const SUPABASE_URL = 'https://givvythygqikwyfmapnr.supabase.co';
const SUPABASE_KEY = 'sb_publishable__4x6V69qjksFuNxgvEjU_w_gbq--BVp';

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
    throw new Error(`DB hatası: ${res.status} — ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Categories ──────────────────────────────────────────
export const Categories = {
  list: () => sbFetch('categories?order=type,name'),
  create: (data) => sbFetch('categories', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => sbFetch(`categories?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' })
};

// ── Items ────────────────────────────────────────────────
export const Items = {
  list: () => sbFetch('items?is_active=eq.true&order=name&select=*,categories(name,type,color)'),
  create: (data) => sbFetch('items', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => sbFetch(`items?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deactivate: (id) => sbFetch(`items?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: false }), prefer: 'return=minimal' })
};

// ── Transactions ─────────────────────────────────────────
export const Transactions = {
  list: (filters = {}) => {
    let q = 'transactions?order=date.desc,created_at.desc&select=*,items(name,categories(name,type,color))';
    if (filters.month && filters.year) {
      const from = `${filters.year}-${String(filters.month).padStart(2,'0')}-01`;
      const to   = `${filters.year}-${String(filters.month).padStart(2,'0')}-31`;
      q += `&date=gte.${from}&date=lte.${to}`;
    }
    return sbFetch(q);
  },
  create: (data) => sbFetch('transactions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => sbFetch(`transactions?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => sbFetch(`transactions?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' })
};

// ── Credit Cards ─────────────────────────────────────────
export const CreditCards = {
  list: () => sbFetch('credit_cards?is_active=eq.true&order=name'),
  create: (data) => sbFetch('credit_cards', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => sbFetch(`credit_cards?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => sbFetch(`credit_cards?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' })
};

// ── Monthly Config ────────────────────────────────────────
export const MonthlyConfig = {
  list: () => sbFetch('monthly_config?order=year.desc,month.desc'),
  get: (month, year) => sbFetch(`monthly_config?month=eq.${month}&year=eq.${year}`),
  upsert: (data) => sbFetch('monthly_config', {
    method: 'POST',
    body: JSON.stringify(data),
    prefer: 'resolution=merge-duplicates,return=representation'
  }),
};

// ── Loans ─────────────────────────────────────────────────
export const Loans = {
  list: () => sbFetch('loans?is_active=eq.true&order=name'),
  create: (data) => sbFetch('loans', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => sbFetch(`loans?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => sbFetch(`loans?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' })
};

// ── Utils ─────────────────────────────────────────────────
export function hourlyRate(netSalary) {
  return netSalary / 220;
}

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
