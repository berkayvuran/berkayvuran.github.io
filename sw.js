/* berkayvuran.com service worker: offline-friendly, never serves stale pages while online. */
const V = 'bv-fdd6dd46';
const SHELL = ['/', '/tr/', '/desk.css', '/desk.js', '/extras.css', '/extras.js', '/ios.css', '/ios.js', '/apps-en.json', '/apps-tr.json', '/assets/images/avatars/my-avatar-160.webp', '/assets/fonts/poppins-400.woff2', '/assets/fonts/poppins-500.woff2', '/assets/fonts/poppins-600.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('bv-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const networkFirst = async (req, ms) => {
  const c = await caches.open(V);
  try {
    const r = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), ms))]);
    if (r && r.ok) c.put(req, r.clone());
    return r;
  } catch (err) {
    return (await c.match(req, { ignoreSearch: false })) || (await c.match(req, { ignoreSearch: true })) || null;
  }
};
const cacheFirst = async req => {
  const c = await caches.open(V);
  const hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r && r.ok) c.put(req, r.clone());
  return r;
};

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, 4000).then(r => r || caches.match(url.pathname.startsWith('/tr') ? '/tr/' : '/')).then(r => r || Response.error()));
    return;
  }
  if (/\.(?:json|webmanifest)$/.test(url.pathname) || (/\.(?:css|js)$/.test(url.pathname) && !url.search)) { e.respondWith(networkFirst(req, 4000).then(r => r || Response.error())); return; }
  if (/\.(?:css|js)$/.test(url.pathname)) { e.respondWith(cacheFirst(req).catch(() => Response.error())); return; }
  if (/\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/.test(url.pathname)) { e.respondWith(cacheFirst(req).catch(() => Response.error())); }
});
