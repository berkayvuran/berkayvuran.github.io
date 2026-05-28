-- GOSPLAN — Supabase Schema
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- 1. KATEGORİLER
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  type text not null check (type in ('gelir', 'gider', 'birikim')),
  color text not null default '#cc0000',
  created_at timestamptz default now()
);

-- 2. KALEMLER
create table items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category_id uuid references categories(id) on delete set null,
  is_custom boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. İŞLEMLER
create table transactions (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references items(id) on delete set null,
  item_name text,
  amount numeric(12,2) not null,
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- 4. KREDİ KARTLARI
create table credit_cards (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  limit_amount numeric(12,2) not null default 0,
  statement_balance numeric(12,2) default 0,
  color text default '#cc0000',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. AYLIK MAAŞ KONFİGÜRASYONU
create table monthly_config (
  id uuid default gen_random_uuid() primary key,
  month int not null check (month between 1 and 12),
  year int not null,
  net_salary numeric(12,2) not null,
  unique(month, year),
  created_at timestamptz default now()
);

-- 6. KREDİLER / TAKSİTLER
create table loans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  monthly_payment numeric(12,2) not null,
  remaining_balance numeric(12,2) default 0,
  interest_rate numeric(5,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table categories enable row level security;
alter table items enable row level security;
alter table transactions enable row level security;
alter table credit_cards enable row level security;
alter table monthly_config enable row level security;
alter table loans enable row level security;

create policy "anon_all" on categories for all to anon using (true) with check (true);
create policy "anon_all" on items for all to anon using (true) with check (true);
create policy "anon_all" on transactions for all to anon using (true) with check (true);
create policy "anon_all" on credit_cards for all to anon using (true) with check (true);
create policy "anon_all" on monthly_config for all to anon using (true) with check (true);
create policy "anon_all" on loans for all to anon using (true) with check (true);

-- SEED: Kategoriler
insert into categories (name, type, color) values
('Ana Emek Geliri',            'gelir',   '#ef4444'),
('Rantiye Kaynaklı Gelir',     'gelir',   '#f97316'),
('Artı Değer Payı',            'gelir',   '#eab308'),
('Kolektif Emek Geliri',       'gelir',   '#f87171'),
('Spekülatif Sermaye Getirisi','gelir',   '#fb923c'),
('Sisteme Karşı Güvence',      'birikim', '#991b1b'),
('Sözleşmeli Yeniden Üretim',  'gider',   '#7f1d1d'),
('Gündelik Yeniden Üretim',    'gider',   '#b91c1c'),
('Biyolojik Yeniden Üretim',   'gider',   '#dc2626'),
('Emek Gücü Bakımı',           'gider',   '#c0392b'),
('Beslenme / Fizyolojik Temel','gider',   '#a93226'),
('Kültürel Sermaye Yatırımı',  'gider',   '#922b21'),
('Dijital Üretim Araçları',    'gider',   '#7b241c'),
('Hareket Özgürlüğü Gideri',   'gider',   '#641e16'),
('Finans Kapital Geri Ödemesi','gider',   '#4a0e0e'),
('Devlete Haraç',              'gider',   '#3b0a0a'),
('Meta Fetişizmi',             'gider',   '#e74c3c'),
('Özgürleşmiş Emek',           'gider',   '#c0392b');

-- SEED: Kalemler
insert into items (name, category_id) select 'Berkay Maaş', id from categories where name = 'Ana Emek Geliri';
insert into items (name, category_id) select 'Yemek Kartı', id from categories where name = 'Ana Emek Geliri';
insert into items (name, category_id) select 'Kira Geliri', id from categories where name = 'Rantiye Kaynaklı Gelir';
insert into items (name, category_id) select 'Prim / İkramiye', id from categories where name = 'Artı Değer Payı';
insert into items (name, category_id) select 'Freelance Gelir', id from categories where name = 'Kolektif Emek Geliri';
insert into items (name, category_id) select 'Yatırım Getirisi', id from categories where name = 'Spekülatif Sermaye Getirisi';
insert into items (name, category_id) select 'Acil Fon', id from categories where name = 'Sisteme Karşı Güvence';
insert into items (name, category_id) select 'Kira Gideri', id from categories where name = 'Sözleşmeli Yeniden Üretim';
insert into items (name, category_id) select 'Aidat', id from categories where name = 'Sözleşmeli Yeniden Üretim';
insert into items (name, category_id) select 'Fatura (Elektrik, Su, Gaz)', id from categories where name = 'Sözleşmeli Yeniden Üretim';
insert into items (name, category_id) select 'Araç Sigortası / Muayene', id from categories where name = 'Sözleşmeli Yeniden Üretim';
insert into items (name, category_id) select 'Abonelikler (Netflix vb.)', id from categories where name = 'Dijital Üretim Araçları';
insert into items (name, category_id) select 'Temel Market', id from categories where name = 'Beslenme / Fizyolojik Temel';
insert into items (name, category_id) select 'Restoran / Dışarıda Yemek', id from categories where name = 'Beslenme / Fizyolojik Temel';
insert into items (name, category_id) select 'İlaç / Eczane', id from categories where name = 'Biyolojik Yeniden Üretim';
insert into items (name, category_id) select 'Doktor / Muayene', id from categories where name = 'Biyolojik Yeniden Üretim';
insert into items (name, category_id) select 'Spor / Fitness', id from categories where name = 'Emek Gücü Bakımı';
insert into items (name, category_id) select 'Kişisel Bakım / Berber', id from categories where name = 'Emek Gücü Bakımı';
insert into items (name, category_id) select 'Kitap / Kurs', id from categories where name = 'Kültürel Sermaye Yatırımı';
insert into items (name, category_id) select 'Benzin / Araç Gideri', id from categories where name = 'Hareket Özgürlüğü Gideri';
insert into items (name, category_id) select 'Toplu Taşıma', id from categories where name = 'Hareket Özgürlüğü Gideri';
insert into items (name, category_id) select 'Ev Kredisi Taksiti', id from categories where name = 'Finans Kapital Geri Ödemesi';
insert into items (name, category_id) select 'Kredi Kartı Ödemesi', id from categories where name = 'Finans Kapital Geri Ödemesi';
insert into items (name, category_id) select 'Avukatlık / Hukuki Gider', id from categories where name = 'Finans Kapital Geri Ödemesi';
insert into items (name, category_id) select 'Vergi / Harç', id from categories where name = 'Devlete Haraç';
insert into items (name, category_id) select 'Eğlence / Gezi', id from categories where name = 'Meta Fetişizmi';
insert into items (name, category_id) select 'Giyim / Aksesuar', id from categories where name = 'Meta Fetişizmi';
insert into items (name, category_id) select 'Elektronik / Gadget', id from categories where name = 'Meta Fetişizmi';
insert into items (name, category_id) select 'Bağış / Yardım', id from categories where name = 'Özgürleşmiş Emek';
insert into items (name, category_id) select 'Hediye', id from categories where name = 'Özgürleşmiş Emek';

-- SEED: Kredi Kartları (limiti sonra ayarlardan güncelle)
insert into credit_cards (name, limit_amount, statement_balance) values
('Enpara KK',  0, 0),
('Garanti KK', 0, 0);

-- SEED: Haziran 2026 maaş
insert into monthly_config (month, year, net_salary) values (6, 2026, 158466.63);
