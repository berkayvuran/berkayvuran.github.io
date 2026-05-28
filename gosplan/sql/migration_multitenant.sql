-- ============================================================
-- GOSPLAN — MULTI-TENANT + MULTI-USER + ADMIN MIGRATION
-- Supabase SQL Editor → çalıştır (idempotent, güvenle tekrar çalıştırılabilir)
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ── 1. TENANTS ──────────────────────────────────────────
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- ── 2. APP USERS (tenant başına) ────────────────────────
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  username text not null,
  password_hash text not null,
  display_name text,
  created_at timestamptz default now(),
  unique(tenant_id, username)
);

-- ── 3. PLATFORM ADMINS (tenant'tan bağımsız) ────────────
create table if not exists platform_admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- ── 4. Mevcut tablolara tenant_id ekle (idempotent) ─────
alter table categories     add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table items          add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table transactions   add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table transactions   add column if not exists user_id   uuid references app_users(id) on delete set null;
alter table credit_cards   add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table monthly_config add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table loans          add column if not exists tenant_id uuid references tenants(id) on delete cascade;

-- monthly_config unique kısıtını tenant'a duyarlı yap
do $$ begin
  alter table monthly_config drop constraint monthly_config_month_year_key;
exception when undefined_object then null; end $$;

do $$ begin
  alter table monthly_config add constraint monthly_config_tenant_month_year_key unique(tenant_id, month, year);
exception when duplicate_object then null; end $$;

-- ── 5. RLS ──────────────────────────────────────────────
alter table tenants            enable row level security;
alter table app_users          enable row level security;
alter table platform_admins    enable row level security;

drop policy if exists "anon_read_tenants" on tenants;
create policy "anon_read_tenants" on tenants for select to anon using (true);
-- tenant yazımı sadece RPC üzerinden (admin)

-- app_users ve platform_admins: anon erişim YOK (sadece SECURITY DEFINER RPC üzerinden)

-- ── 6. RPC: KULLANICI DOĞRULAMA ─────────────────────────
create or replace function authenticate_user(
  p_tenant text, p_username text, p_password text
) returns table(user_id uuid, tenant_id uuid, tenant_name text, username text, display_name text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  t_id uuid;
  rec record;
begin
  select id into t_id from tenants where name = lower(p_tenant);
  if t_id is null then return; end if;

  for rec in select id, app_users.username as un, password_hash, app_users.display_name as dn
             from app_users
             where app_users.tenant_id = t_id and app_users.username = p_username loop
    if rec.password_hash = extensions.crypt(p_password, rec.password_hash) then
      user_id := rec.id;
      tenant_id := t_id;
      tenant_name := lower(p_tenant);
      username := rec.un;
      display_name := rec.dn;
      return next;
      return;
    end if;
  end loop;
end; $$;

-- ── 7. RPC: KULLANICI KAYDI ─────────────────────────────
create or replace function register_user(
  p_tenant text, p_username text, p_password text, p_display_name text
) returns table(user_id uuid, tenant_id uuid, tenant_name text, username text, display_name text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  t_id uuid;
  u_id uuid;
begin
  select id into t_id from tenants where name = lower(p_tenant);
  if t_id is null then
    raise exception 'Tenant "%" bulunamadı', p_tenant;
  end if;

  if exists(select 1 from app_users where app_users.tenant_id = t_id and app_users.username = p_username) then
    raise exception 'Bu kullanıcı adı alınmış';
  end if;

  if length(p_password) < 6 then
    raise exception 'Şifre en az 6 karakter olmalı';
  end if;

  insert into app_users (tenant_id, username, password_hash, display_name)
  values (t_id, p_username, extensions.crypt(p_password, extensions.gen_salt('bf')), coalesce(p_display_name, p_username))
  returning id into u_id;

  user_id := u_id;
  tenant_id := t_id;
  tenant_name := lower(p_tenant);
  username := p_username;
  display_name := coalesce(p_display_name, p_username);
  return next;
end; $$;

-- ── 8. RPC: ADMIN DOĞRULAMA ─────────────────────────────
create or replace function authenticate_admin(
  p_username text, p_password text
) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare rec record;
begin
  for rec in select password_hash from platform_admins where username = p_username loop
    if rec.password_hash = extensions.crypt(p_password, rec.password_hash) then
      return true;
    end if;
  end loop;
  return false;
end; $$;

-- ── 9. RPC: TENANT LİSTESİ (admin) ──────────────────────
create or replace function list_tenants_admin(
  p_admin_username text, p_admin_password text
) returns table(id uuid, name text, display_name text, user_count bigint, tx_count bigint, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not authenticate_admin(p_admin_username, p_admin_password) then
    raise exception 'Admin doğrulanamadı';
  end if;

  return query
    select t.id, t.name, t.display_name,
           (select count(*) from app_users   where app_users.tenant_id   = t.id),
           (select count(*) from transactions where transactions.tenant_id = t.id),
           t.created_at
    from tenants t
    order by t.created_at desc;
end; $$;

-- ── 10. RPC: TENANT OLUŞTUR (admin) ─────────────────────
create or replace function create_tenant(
  p_admin_username text, p_admin_password text,
  p_tenant_name text, p_display_name text
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare t_id uuid;
begin
  if not authenticate_admin(p_admin_username, p_admin_password) then
    raise exception 'Admin doğrulanamadı';
  end if;

  insert into tenants (name, display_name)
  values (lower(p_tenant_name), p_display_name)
  returning id into t_id;

  perform seed_tenant_defaults(t_id);
  return t_id;
end; $$;

-- ── 11. RPC: TENANT SİL (admin) ─────────────────────────
create or replace function delete_tenant(
  p_admin_username text, p_admin_password text,
  p_tenant_id uuid
) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not authenticate_admin(p_admin_username, p_admin_password) then
    raise exception 'Admin doğrulanamadı';
  end if;
  delete from tenants where id = p_tenant_id;
end; $$;

-- ── 12. SEED: Yeni tenant için varsayılan kategori + kalem ──
create or replace function seed_tenant_defaults(p_tenant_id uuid)
returns void language plpgsql as $$
declare
  c_ana_emek      uuid; c_rantiye      uuid; c_arti_deger   uuid;
  c_kolektif      uuid; c_spekulatif   uuid; c_guvence      uuid;
  c_sozlesmeli    uuid; c_gundelik     uuid; c_biyolojik    uuid;
  c_emek_bakim    uuid; c_beslenme     uuid; c_kultur       uuid;
  c_dijital       uuid; c_hareket      uuid; c_finans       uuid;
  c_devlet        uuid; c_meta         uuid; c_ozgur        uuid;
begin
  insert into categories (name, type, color, tenant_id) values
    ('Ana Emek Geliri',             'gelir',   '#ef4444', p_tenant_id) returning id into c_ana_emek;
  insert into categories (name, type, color, tenant_id) values
    ('Rantiye Kaynaklı Gelir',      'gelir',   '#f97316', p_tenant_id) returning id into c_rantiye;
  insert into categories (name, type, color, tenant_id) values
    ('Artı Değer Payı',             'gelir',   '#eab308', p_tenant_id) returning id into c_arti_deger;
  insert into categories (name, type, color, tenant_id) values
    ('Kolektif Emek Geliri',        'gelir',   '#f87171', p_tenant_id) returning id into c_kolektif;
  insert into categories (name, type, color, tenant_id) values
    ('Spekülatif Sermaye Getirisi', 'gelir',   '#fb923c', p_tenant_id) returning id into c_spekulatif;
  insert into categories (name, type, color, tenant_id) values
    ('Sisteme Karşı Güvence',       'birikim', '#991b1b', p_tenant_id) returning id into c_guvence;
  insert into categories (name, type, color, tenant_id) values
    ('Sözleşmeli Yeniden Üretim',   'gider',   '#7f1d1d', p_tenant_id) returning id into c_sozlesmeli;
  insert into categories (name, type, color, tenant_id) values
    ('Gündelik Yeniden Üretim',     'gider',   '#b91c1c', p_tenant_id) returning id into c_gundelik;
  insert into categories (name, type, color, tenant_id) values
    ('Biyolojik Yeniden Üretim',    'gider',   '#dc2626', p_tenant_id) returning id into c_biyolojik;
  insert into categories (name, type, color, tenant_id) values
    ('Emek Gücü Bakımı',            'gider',   '#c0392b', p_tenant_id) returning id into c_emek_bakim;
  insert into categories (name, type, color, tenant_id) values
    ('Beslenme / Fizyolojik Temel', 'gider',   '#a93226', p_tenant_id) returning id into c_beslenme;
  insert into categories (name, type, color, tenant_id) values
    ('Kültürel Sermaye Yatırımı',   'gider',   '#922b21', p_tenant_id) returning id into c_kultur;
  insert into categories (name, type, color, tenant_id) values
    ('Dijital Üretim Araçları',     'gider',   '#7b241c', p_tenant_id) returning id into c_dijital;
  insert into categories (name, type, color, tenant_id) values
    ('Hareket Özgürlüğü Gideri',    'gider',   '#641e16', p_tenant_id) returning id into c_hareket;
  insert into categories (name, type, color, tenant_id) values
    ('Finans Kapital Geri Ödemesi', 'gider',   '#4a0e0e', p_tenant_id) returning id into c_finans;
  insert into categories (name, type, color, tenant_id) values
    ('Devlete Haraç',               'gider',   '#3b0a0a', p_tenant_id) returning id into c_devlet;
  insert into categories (name, type, color, tenant_id) values
    ('Meta Fetişizmi',              'gider',   '#e74c3c', p_tenant_id) returning id into c_meta;
  insert into categories (name, type, color, tenant_id) values
    ('Özgürleşmiş Emek',            'gider',   '#c0392b', p_tenant_id) returning id into c_ozgur;

  insert into items (name, category_id, tenant_id) values
    ('Maaş',                              c_ana_emek,   p_tenant_id),
    ('Yemek Kartı',                       c_ana_emek,   p_tenant_id),
    ('Kira Geliri',                       c_rantiye,    p_tenant_id),
    ('Prim / İkramiye',                   c_arti_deger, p_tenant_id),
    ('Freelance Gelir',                   c_kolektif,   p_tenant_id),
    ('Yatırım Getirisi',                  c_spekulatif, p_tenant_id),
    ('Devrimci Güvence Fonu',             c_guvence,    p_tenant_id),
    ('Kira Gideri',                       c_sozlesmeli, p_tenant_id),
    ('Aidat',                             c_sozlesmeli, p_tenant_id),
    ('Fatura (Elektrik, Su, Gaz)',        c_sozlesmeli, p_tenant_id),
    ('Araç Sigortası / Muayene',          c_sozlesmeli, p_tenant_id),
    ('Abonelikler (Netflix vb.)',         c_dijital,    p_tenant_id),
    ('Temel Market',                      c_beslenme,   p_tenant_id),
    ('Restoran / Dışarıda Yemek',         c_beslenme,   p_tenant_id),
    ('Temel Gider',                       c_gundelik,   p_tenant_id),
    ('İlaç / Eczane',                     c_biyolojik,  p_tenant_id),
    ('Doktor / Muayene',                  c_biyolojik,  p_tenant_id),
    ('Spor / Fitness',                    c_emek_bakim, p_tenant_id),
    ('Kişisel Bakım / Berber',            c_emek_bakim, p_tenant_id),
    ('Kitap / Kurs',                      c_kultur,     p_tenant_id),
    ('Benzin / Araç Gideri',              c_hareket,    p_tenant_id),
    ('Toplu Taşıma',                      c_hareket,    p_tenant_id),
    ('Ev Kredisi Taksiti',                c_finans,     p_tenant_id),
    ('Kredi Kartı Ödemesi',               c_finans,     p_tenant_id),
    ('Avukatlık / Hukuki Gider',          c_finans,     p_tenant_id),
    ('Vergi / Harç',                      c_devlet,     p_tenant_id),
    ('Eğlence / Gezi',                    c_meta,       p_tenant_id),
    ('Giyim / Aksesuar',                  c_meta,       p_tenant_id),
    ('Elektronik / Gadget',               c_meta,       p_tenant_id),
    ('Bağış / Yardım',                    c_ozgur,      p_tenant_id),
    ('Hediye',                            c_ozgur,      p_tenant_id);
end; $$;

-- ── 13. MEVCUT VERİYİ "vuran" TENANT'INA TAŞIMA ─────────
do $$
declare
  vuran_id  uuid;
  berkay_id uuid;
begin
  insert into tenants (name, display_name) values ('vuran', 'Vuran Hane')
  on conflict (name) do nothing;
  select id into vuran_id from tenants where name = 'vuran';

  update categories     set tenant_id = vuran_id where tenant_id is null;
  update items          set tenant_id = vuran_id where tenant_id is null;
  update transactions   set tenant_id = vuran_id where tenant_id is null;
  update credit_cards   set tenant_id = vuran_id where tenant_id is null;
  update monthly_config set tenant_id = vuran_id where tenant_id is null;
  update loans          set tenant_id = vuran_id where tenant_id is null;

  -- Mevcut "Acil Fon" varsa "Devrimci Güvence Fonu"na yeniden adlandır
  update items set name = 'Devrimci Güvence Fonu'
   where tenant_id = vuran_id and name = 'Acil Fon';

  -- Berkay kullanıcısını oluştur (idempotent)
  insert into app_users (tenant_id, username, password_hash, display_name)
  values (vuran_id, 'berkay', extensions.crypt('Nakama123!', extensions.gen_salt('bf')), 'Berkay')
  on conflict (tenant_id, username) do nothing;

  select id into berkay_id from app_users where tenant_id = vuran_id and username = 'berkay';

  -- Mevcut işlemleri Berkay'a ata
  update transactions set user_id = berkay_id where user_id is null and tenant_id = vuran_id;
end $$;

-- ── 14. ADMIN SEED ──────────────────────────────────────
insert into platform_admins (username, password_hash)
values ('gosplanadmin', extensions.crypt('Nakama123!', extensions.gen_salt('bf')))
on conflict (username) do nothing;

-- ── 15. tenant_id NOT NULL (artık tüm satırlar dolu) ────
alter table categories     alter column tenant_id set not null;
alter table items          alter column tenant_id set not null;
alter table transactions   alter column tenant_id set not null;
alter table credit_cards   alter column tenant_id set not null;
alter table monthly_config alter column tenant_id set not null;
alter table loans          alter column tenant_id set not null;
