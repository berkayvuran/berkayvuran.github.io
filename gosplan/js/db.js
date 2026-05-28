const SUPABASE_URL = 'https://givvythygqikwyfmapnr.supabase.co';
const SUPABASE_KEY = 'sb_publishable__4x6V69qjksFuNxgvEjU_w_gbq--BVp';
const SESSION_KEY  = 'gosplan_session';

// ── Session helpers ──────────────────────────────────────
export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.tenantId || !parsed?.userId) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}
export function setSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
function tenantId() {
  const s = getSession();
  if (!s?.tenantId) throw new Error('Oturum yok');
  return s.tenantId;
}
function userId() {
  return getSession()?.userId || null;
}

// ── Low-level fetch ──────────────────────────────────────
async function sbFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DB: ${res.status} — ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function rpc(name, args = {}) {
  return sbFetch(`rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
}

// ── AUTH ─────────────────────────────────────────────────
export const Auth = {
  async login(tenant, username, password) {
    const rows = await rpc('authenticate_user', {
      p_tenant: tenant.trim().toLowerCase(),
      p_username: username.trim(),
      p_password: password
    });
    if (!rows || rows.length === 0) {
      throw new Error('Hane, kullanıcı adı veya parola hatalı');
    }
    const r = rows[0];
    const session = {
      tenantId: r.tenant_id,
      tenantName: r.tenant_name,
      userId: r.user_id,
      username: r.username,
      displayName: r.display_name || r.username
    };
    setSession(session);
    return session;
  },

  async register(tenant, username, password, displayName) {
    const rows = await rpc('register_user', {
      p_tenant: tenant.trim().toLowerCase(),
      p_username: username.trim(),
      p_password: password,
      p_display_name: (displayName || '').trim() || null
    });
    if (!rows || rows.length === 0) throw new Error('Kayıt başarısız');
    const r = rows[0];
    const session = {
      tenantId: r.tenant_id,
      tenantName: r.tenant_name,
      userId: r.user_id,
      username: r.username,
      displayName: r.display_name || r.username
    };
    setSession(session);
    return session;
  },

  async tenantExists(name) {
    const rows = await sbFetch(`tenants?name=eq.${encodeURIComponent(name.trim().toLowerCase())}&select=id`);
    return rows && rows.length > 0;
  },

  logout() { clearSession(); }
};

// ── ADMIN ────────────────────────────────────────────────
export const Admin = {
  async verify(username, password) {
    const ok = await rpc('authenticate_admin', { p_username: username, p_password: password });
    return ok === true;
  },

  async listTenants(adminUser, adminPass) {
    return rpc('list_tenants_admin', { p_admin_username: adminUser, p_admin_password: adminPass });
  },

  async createTenant(adminUser, adminPass, tenantName, displayName) {
    return rpc('create_tenant', {
      p_admin_username: adminUser,
      p_admin_password: adminPass,
      p_tenant_name: tenantName.trim().toLowerCase(),
      p_display_name: displayName.trim() || null
    });
  },

  async deleteTenant(adminUser, adminPass, tenantId) {
    return rpc('delete_tenant', {
      p_admin_username: adminUser,
      p_admin_password: adminPass,
      p_tenant_id: tenantId
    });
  }
};

// ── Tenant-scoped helpers ────────────────────────────────
const T = () => `tenant_id=eq.${tenantId()}`;

export const Categories = {
  list: () => sbFetch(`categories?${T()}&order=type,name`),
  create: (data) => sbFetch('categories', { method: 'POST', body: JSON.stringify({ ...data, tenant_id: tenantId() }) }),
  delete: (id) => sbFetch(`categories?id=eq.${id}&${T()}`, { method: 'DELETE', prefer: 'return=minimal' })
};

export const Items = {
  list: () => sbFetch(`items?${T()}&is_active=eq.true&order=name&select=*,categories(name,type,color)`),
  create: (data) => sbFetch('items', { method: 'POST', body: JSON.stringify({ ...data, tenant_id: tenantId() }) }),
  update: (id, data) => sbFetch(`items?id=eq.${id}&${T()}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deactivate: (id) => sbFetch(`items?id=eq.${id}&${T()}`, { method: 'PATCH', body: JSON.stringify({ is_active: false }), prefer: 'return=minimal' })
};

export const Transactions = {
  list: (filters = {}) => {
    let q = `transactions?${T()}&order=date.desc,created_at.desc&select=*,items(name,categories(name,type,color)),app_users(display_name,username)`;
    if (filters.month && filters.year) {
      const mm   = String(filters.month).padStart(2,'0');
      const from = `${filters.year}-${mm}-01`;
      // Sonraki ayın 1'inden bir önceki gün (ay sonu doğru hesabı)
      const last = new Date(filters.year, filters.month, 0).getDate();
      const to   = `${filters.year}-${mm}-${String(last).padStart(2,'0')}`;
      q += `&date=gte.${from}&date=lte.${to}`;
    }
    return sbFetch(q);
  },
  create: (data) => sbFetch('transactions', {
    method: 'POST',
    body: JSON.stringify({ ...data, tenant_id: tenantId(), user_id: userId() })
  }),
  update: (id, data) => sbFetch(`transactions?id=eq.${id}&${T()}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => sbFetch(`transactions?id=eq.${id}&${T()}`, { method: 'DELETE', prefer: 'return=minimal' })
};

export const CreditCards = {
  list: () => sbFetch(`credit_cards?${T()}&is_active=eq.true&order=name`),
  create: (data) => sbFetch('credit_cards', { method: 'POST', body: JSON.stringify({ ...data, tenant_id: tenantId() }) }),
  update: (id, data) => sbFetch(`credit_cards?id=eq.${id}&${T()}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => sbFetch(`credit_cards?id=eq.${id}&${T()}`, { method: 'DELETE', prefer: 'return=minimal' })
};

export const MonthlyConfig = {
  list: () => sbFetch(`monthly_config?${T()}&order=year.desc,month.desc`),
  get: (month, year) => sbFetch(`monthly_config?${T()}&month=eq.${month}&year=eq.${year}`),
  upsert: (data) => sbFetch('monthly_config', {
    method: 'POST',
    body: JSON.stringify({ ...data, tenant_id: tenantId() }),
    prefer: 'resolution=merge-duplicates,return=representation'
  }),
};

export const Loans = {
  list: () => sbFetch(`loans?${T()}&is_active=eq.true&order=name`),
  create: (data) => sbFetch('loans', { method: 'POST', body: JSON.stringify({ ...data, tenant_id: tenantId() }) }),
  update: (id, data) => sbFetch(`loans?id=eq.${id}&${T()}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => sbFetch(`loans?id=eq.${id}&${T()}`, { method: 'DELETE', prefer: 'return=minimal' })
};

// ── Utils ─────────────────────────────────────────────────
export function hourlyRate(netSalary) { return netSalary / 220; }
export function toHours(amount, netSalary) {
  if (!netSalary || netSalary === 0) return 0;
  return amount / hourlyRate(netSalary);
}
export function fmtTL(n) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' ₺';
}
export function fmtHours(h) {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}dk`;
  if (mins === 0) return `${hrs}sa`;
  return `${hrs}sa ${mins}dk`;
}
