/* Guessing game engine: screens, map, input, sound and the glue between the host and the other players.
 * The same file runs "Neresi Burası?" and "Bu Yemek Nereden?"; everything game specific comes from window.GAME. */
(function () {
  'use strict';

  const HK = window.HK;
  const Net = window.HKNet;
  const GAME = window.GAME;
  const PROTOCOL = 'v' + HK.PROTOCOL + ':' + GAME.id;   // host and guests must run the same rules and the same game
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const STATE_EVERY = 200;     // ms between snapshots to guests during a game
  const LOBBY_EVERY = 1000;
  const PING_EVERY = 2000;
  const GUEST_TIMEOUT = 20000; // the host frees a seat that has been silent this long
  const HOST_TIMEOUT = 15000;  // a guest gives up on a silent host after this
  const TIME_LABELS = { 120: '2 dk', 180: '3 dk', 300: '5 dk' };
  const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const TR_CREDIT = 'İl sınırları: <a href="https://www.geoboundaries.org/" target="_blank" rel="noopener">geoBoundaries</a>';
  const KEY = 'tg.' + GAME.id + '.';   // client id and career are per game; name and look are shared by the games of this site
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // ?sure=12 shortens the rounds of a room or a solo game opened on this machine, for testing only.
  const debugRoundTime = LOCAL ? Math.max(0, Math.min(600, Math.round(Number(new URLSearchParams(location.search).get('sure')) || 0))) : 0;
  const DIR_NAMES = { K: 'kuzey', KD: 'kuzeydoğu', D: 'doğu', GD: 'güneydoğu', G: 'güney', GB: 'güneybatı', B: 'batı', KB: 'kuzeybatı' };
  const DIR_DEG = { K: 0, KD: 45, D: 90, GD: 135, G: 180, GB: 225, B: 270, KB: 315 };
  const SOLO_BOTS = 3;
  const BOT_CHOICES = [['none', 'Yok'], ['rookie', '3 çaylak'], ['pro', '3 usta']];
  // One line for the reveal per photo kind; kinds missing here (the dishes) stay silent.
  const FLAVOUR = {
    coast: 'Deniz kokusu aldın mı?',
    nature: 'Burada sözü doğa alıyor.',
    monument: 'Bu taşların anlatacak çok hikayesi var.',
    city: 'Şehrin uğultusu fotoğraftan taşıyor.',
    village: 'Köy sabahı, taze ekmek kokusu.'
  };

  const $ = sel => document.querySelector(sel);
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* Browser storage can be blocked (private windows, strict settings). The game works without it,
   * only the remembered name, look, career and mute choice are lost, so failures fall back to defaults. */
  function load(kind, key) {
    try { return window[kind].getItem(key); } catch { return null; }
  }
  function save(kind, key, value) {
    try { window[kind].setItem(key, value); } catch { return false; }
    return true;
  }
  function loadJson(key) {
    try { const v = JSON.parse(load('localStorage', key) || 'null'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; }
  }

  function randomCode(n) {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => CODE_CHARS[b % CODE_CHARS.length]).join('');
  }

  let cid = load('sessionStorage', KEY + 'cid');
  if (!/^u[A-Z0-9]{10}$/.test(cid || '')) { cid = 'u' + randomCode(10); save('sessionStorage', KEY + 'cid', cid); }
  const savedEmoji = load('localStorage', 'tg.emoji');
  const profile = {
    name: HK.cleanName(load('localStorage', 'tg.name') || load('localStorage', 'hk.name') || ''),
    emoji: HK.AVATARS.includes(savedEmoji) ? savedEmoji : HK.AVATARS[Math.floor(Math.random() * HK.AVATARS.length)]
  };
  save('localStorage', 'tg.emoji', profile.emoji);

  /* Look (Kadın/Erkek, skin, hair, shirt) chosen on the home screen and sent with the name. The shirt colours the pins. */
  const look = { skin: 0, hair: 0, shirt: 0, body: 0 };
  try {
    const saved = JSON.parse(load('localStorage', 'tg.look') || load('localStorage', 'hk.look') || 'null');
    for (const k of Object.keys(look)) { const v = Number(saved && saved[k]); if (Number.isInteger(v) && v >= 0 && v < (k === 'body' ? 2 : HK.LOOK_RANGE)) look[k] = v; }
  } catch { /* unreadable saved look: keep the defaults */ }

  /* Photo pools (Türkiye, Dünya) come from GAME.pools; the top-level GAME fields are the defaults of a missing key.
   * Photo URLs are <dir>/<file>, dir being the manifest's folder unless the pool names one. */
  function normPool(p) {
    const manifest = typeof p.manifest === 'string' && p.manifest ? p.manifest : 'game/manifest.json';
    const bounds = p.bounds || HK.BOUNDS;
    const geojson = p.geojson || 'vendor/tr-provinces.json';
    return {
      id: String(p.id || 'tr'), label: p.label || 'Türkiye', manifest,
      dir: typeof p.dir === 'string' ? p.dir : manifest.replace(/\/?[^/]*$/, ''),
      geojson, nameProp: p.nameProp || 'name', regionLabel: p.regionLabel || 'İl',
      attribution: typeof p.attribution === 'string' ? p.attribution : geojson === 'vendor/tr-provinces.json' ? TR_CREDIT : '',
      bounds, minZoom: Number(p.minZoom) > 0 ? Number(p.minZoom) : (bounds.lngMax - bounds.lngMin > 90 ? 1 : 4),
      scoreScaleKm: Number(p.scoreScaleKm) > 0 ? Number(p.scoreScaleKm) : GAME.scoreScaleKm,
      provinceBonus: p.provinceBonus != null ? p.provinceBonus : GAME.provinceBonus,
      botSigma: p.botSigma || null, question: p.question || GAME.question, revealLabel: p.revealLabel || GAME.revealLabel
    };
  }
  const POOLS = (Array.isArray(GAME.pools) && GAME.pools.length ? GAME.pools : [{}]).map(normPool);
  const poolOf = id => POOLS.find(p => p.id === id) || POOLS[0];
  const DECOR_POOL = poolOf('tr');   // the home atlas is drawn from the Türkiye provinces
  const poolOpts = pool => ({ pool: pool.id, bounds: pool.bounds, scoreScaleKm: pool.scoreScaleKm, provinceBonus: pool.provinceBonus, botSigma: pool.botSigma, regionLabel: pool.regionLabel });

  /* Career: experience points gathered over games, stored in this browser only (one point per 100 game points). */
  const TITLES = ['Çaylak', 'Meraklı', 'Gezgin', 'Kaşif', 'Uzman', 'Usta', 'Efsane'];
  const career = { xp: Math.max(0, Number(load('localStorage', KEY + 'xp')) || 0) };
  const levelOf = xp => Math.min(TITLES.length, 1 + Math.floor(Math.sqrt(xp / 120)));
  const xpForLevel = lvl => (lvl - 1) * (lvl - 1) * 120;
  /** Career points of a finished game: score / 100, ten per streak round in Seri, none in Keşif. */
  const xpFor = (mode, score) => (mode.scoring === 'none' ? 0 : mode.scoring === 'streak' ? score * 10 : Math.round(score / 100));
  const dailyKey = poolId => KEY + 'daily.' + poolId;     // { "20261121": { score, rounds: [{ points, km }] } }
  const streakKey = poolId => KEY + 'streak.' + poolId;   // best Seri length
  const bestStreak = poolId => Math.max(0, Number(load('localStorage', streakKey(poolId))) || 0);
  /** Today's date on this computer as YYYYMMDD (Günün Oyunu follows the player's calendar). */
  function today() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  const fmtDay = day => { const s = String(day); return s.slice(6, 8) + '.' + s.slice(4, 6) + '.' + s.slice(0, 4); };

  const S = {
    role: null, link: null, room: null, myId: null, view: null, solo: false,
    conns: new Map(), seen: new Map(), dirty: false, lastSend: 0, stopTicker: null, timers: [],
    seenNotice: 0, lastState: 0, endKey: '', offline: false, reconnecting: false, poolBusy: false,
    pin: null, roundKey: '', tryKey: '', sentKey: '', revealKey: '', myMarker: null, myMarkerSig: '', lastSec: -1, lastXp: 0, promo: '', hover: '', hl: '',
    record: false, best: 0, replay: false
  };
  const savedPool = load('localStorage', KEY + 'pool');
  const solo = { pool: poolOf(savedPool).id, mode: null, bots: 'none', time: 180 };

  /* ------------------------------------------------------------ sound */
  const audio = {
    ctx: null,
    muted: load('localStorage', 'tg.mute') === '1',
    unlock() {
      if (audio.ctx) { if (audio.ctx.state === 'suspended') audio.ctx.resume(); return; }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audio.ctx = new Ctx();
    },
    tone(freq, dur, opts) {
      const o = opts || {};
      if (audio.muted || !audio.ctx || audio.ctx.state !== 'running') return;
      const t0 = audio.ctx.currentTime + (o.at || 0);
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(o.gain || 0.08, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(audio.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    start() { [440, 554, 659].forEach((f, i) => audio.tone(f, 0.16, { at: i * 0.09, gain: 0.05, type: 'triangle' })); },
    pin() { audio.tone(660, 0.08, { gain: 0.05, type: 'triangle' }); },
    ok() { [523, 659, 784].forEach((f, i) => audio.tone(f, 0.14, { at: i * 0.07, gain: 0.06, type: 'triangle' })); },
    miss() { audio.tone(330, 0.16, { gain: 0.05, type: 'triangle', to: 262 }); audio.tone(247, 0.2, { at: 0.12, gain: 0.04, type: 'triangle' }); },
    tick() { audio.tone(1200, 0.05, { gain: 0.03, type: 'square' }); },
    gong() { audio.tone(196, 0.9, { gain: 0.07, type: 'triangle', to: 180 }); audio.tone(392, 0.6, { gain: 0.03 }); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => audio.tone(f, 0.25, { at: i * 0.12, gain: 0.06, type: 'triangle' })); }
  };
  document.addEventListener('pointerdown', audio.unlock);
  document.addEventListener('keydown', audio.unlock);

  /* ------------------------------------------------------------ toasts and messages */
  function toast(text, kind) {
    const box = $('#toasts');
    const t = el('div', 'toast ' + (kind || 'info'), text);
    box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => t.remove(), 2600);
  }
  function homeMsg(text, kind) {
    const m = $('#home-msg');
    m.textContent = text || '';
    m.className = 'msg' + (kind ? ' ' + kind : '');
  }

  function netReason(err) {
    const type = err && err.type;
    if (type === 'peer-unavailable') return 'Bu kodla açık bir oda bulunamadı. Kodu kontrol et.';
    if (type === 'timeout') return 'Odaya bağlanılamadı (zaman aşımı). Ağ engelliyor olabilir, tekrar dene.';
    if (type === 'no-webrtc' || type === 'browser-incompatible') return 'Bu tarayıcı online odaları desteklemiyor. Güncel bir Chrome, Edge, Safari ya da Firefox dene.';
    if (type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed') return 'Bağlantı sunucusuna ulaşılamadı. İnternetini kontrol et.';
    return 'Bağlantı hatası: ' + (type || 'bilinmiyor');
  }
  function rejectReason(reason) {
    if (reason === 'full') return 'Oda dolu: en fazla 15 kişi.';
    if (reason === 'version') return 'Oda sahibi farklı bir sürümde. İki taraf da sayfayı yenilesin.';
    return 'Odaya girilemedi.';
  }

  /* ------------------------------------------------------------ formatting */
  const fmt = n => Math.round(Number(n) || 0).toLocaleString('tr-TR');
  function fmtKm(km) {
    if (!(km >= 0)) return '';
    if (km < 1) return Math.round(km * 1000) + ' m';
    if (km < 10) return km.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' km';
    return fmt(km) + ' km';
  }
  const mmss = sec => { const s = Math.max(0, Math.ceil(sec)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function initials(name) {
    const words = String(name || '?').replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean);
    const pickWords = words.length > 1 ? [words[0], words[words.length - 1]] : words;
    return pickWords.map(w => w[0]).join('').toLocaleUpperCase('tr-TR').slice(0, 2) || '?';
  }
  /** Only plain relative paths inside the pool's folder are loaded; anything else from a snapshot is ignored. */
  const gameUrl = (file, pool) => (typeof file === 'string' && /^[A-Za-z0-9_\-./]+$/.test(file) && !file.includes('..') && !file.startsWith('/') ? (pool.dir ? pool.dir + '/' : '') + file : '');
  const modeOf = v => HK.MODES[v && v.mode] || HK.MODES.klasik;
  const modeLabel = (m, pool) => HK.modeText(m.label, pool.regionLabel);
  const modeDesc = (m, pool) => HK.modeText(m.desc, pool.regionLabel);
  const viewPool = v => poolOf(v ? v.pool : solo.pool);
  /** "ilk denemede", "2. denemede ×0,7", "3 deneme, ıska ×0,5" for a reveal pin. */
  function triesText(pin, mode) {
    const n = pin.attempts || 1;
    const mult = HK.ATTEMPT_MULT[Math.min(n, HK.ATTEMPT_MULT.length) - 1];
    const text = pin.hit ? (n === 1 ? 'ilk denemede' : `${n}. denemede`) : `${n} deneme, ıska`;
    return text + (mult < 1 && !['streak', 'none'].includes(mode.scoring) ? ' ×' + String(mult).replace('.', ',') : '');
  }

  /* ------------------------------------------------------------ avatars and colours */
  function palette(kind, i) {
    const list = HK.PALETTES[kind];
    return list[Number.isInteger(i) && i >= 0 && i < list.length ? i : 0];
  }
  const colorOf = lk => palette('shirt', lk && lk.shirt);
  function avatarSvg(lk) {
    const o = lk || {};
    const skin = palette('skin', o.skin);
    const hair = palette('hair', o.hair);
    const shirt = palette('shirt', o.shirt);
    const long = o.body === 0;
    return '<svg viewBox="0 0 40 40" aria-hidden="true">' +
      (long ? `<path d="M10.5 19c0-8 4.3-11.5 9.5-11.5s9.5 3.5 9.5 11.5l1 12H9.5z" fill="${hair}"/>` : '') +
      `<path d="M5 41c0-8.5 6.5-13 15-13s15 4.5 15 13z" fill="${shirt}"/>` +
      `<rect x="17" y="22" width="6" height="7" rx="2" fill="${skin}"/>` +
      `<circle cx="20" cy="17.5" r="7.5" fill="${skin}"/>` +
      `<path d="${long ? 'M12.3 17c.4-6 3.6-9 7.7-9s7.3 3 7.7 9c-2.6-3.2-5-4.4-7.7-4.4S14.9 13.8 12.3 17z' : 'M12.4 16.5c0-5.6 3.4-8.7 7.6-8.7s7.6 3.1 7.6 8.7c-1.8-2.4-4.4-3.6-7.6-3.6s-5.8 1.2-7.6 3.6z'}" fill="${hair}"/></svg>`;
  }
  function paintAvatar(node, lk) {
    const sig = lk ? [lk.skin, lk.hair, lk.shirt, lk.body].join() : '-';
    if (node.dataset.sig === sig) return;
    node.dataset.sig = sig;
    node.innerHTML = avatarSvg(lk);
  }
  function avatar(lk, cls) {
    const a = el('span', 'avatar' + (cls ? ' ' + cls : ''));
    a.setAttribute('aria-hidden', 'true');
    paintAvatar(a, lk);
    return a;
  }

  /* ------------------------------------------------------------ QR code of the invite link (vendor/qrcode.min.js) */
  const inviteUrl = code => location.origin + location.pathname + '?oda=' + code;
  const qrCache = new Map();
  function setQr(img, text) {
    if (img.dataset.qr === text) return;
    img.dataset.qr = text;
    let url = qrCache.get(text) || '';
    if (!url && text && typeof window.qrcode === 'function') {
      const qr = window.qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      url = qr.createDataURL(6, 2);
      qrCache.set(text, url);
    }
    img.hidden = !url;
    if (url) img.src = url;
  }

  /* ------------------------------------------------------------ screens */
  function show(name) {
    const was = ['home', 'lobby', 'game'].find(k => !$('#screen-' + k).hidden);
    for (const s of ['home', 'lobby', 'game']) $('#screen-' + s).hidden = s !== name;
    // A button that just got hidden would otherwise keep the focus and swallow the Space key.
    if (was !== name && document.activeElement && document.activeElement.closest('#screen-' + was)) document.activeElement.blur();
    if (was !== name && name === 'game') requestAnimationFrame(() => { if (map) map.invalidateSize(); });
    if (was !== name && name !== 'game') requestAnimationFrame(drawDecor);
  }

  function setBusy(busy) {
    for (const b of [$('#btn-create'), $('#btn-join'), $('#btn-solo-start'), ...document.querySelectorAll('#solo-modes button')]) b.disabled = busy;
  }

  function leave(reason) {
    if (S.role === 'host' && S.link) S.link.broadcast({ t: 'bye' });
    if (S.stopTicker) S.stopTicker();
    S.timers.forEach(clearInterval);
    const link = S.link;
    Object.assign(S, { role: null, link: null, room: null, myId: null, view: null, solo: false, conns: new Map(), seen: new Map(), dirty: false, stopTicker: null, timers: [], seenNotice: 0, endKey: '', offline: false, reconnecting: false, poolBusy: false, pin: null, roundKey: '', tryKey: '', sentKey: '', revealKey: '', lastSec: -1 });
    if (link) setTimeout(() => link.close(), 150);
    clearMapLayers();
    $('#end').hidden = true;
    document.body.classList.remove('in-game');
    show('home');
    renderSolo();
    setBusy(false);
    homeMsg(reason || '', reason ? 'error' : '');
    history.replaceState(null, '', location.pathname);
  }

  /* ------------------------------------------------------------ regions (GeoJSON per pool) */
  const geos = new Map();   // pool id -> { raw, features, loading }
  function geoOf(pool) {
    let g = geos.get(pool.id);
    if (!g) { g = { raw: null, features: null, loading: null }; geos.set(pool.id, g); }
    return g;
  }
  function loadGeo(pool) {
    const geo = geoOf(pool);
    if (!geo.loading) {
      geo.loading = fetch(pool.geojson)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(data => {
          geo.raw = data;
          geo.features = (data.features || []).map(f => {
            const g = f.geometry || {};
            const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
            const bbox = [Infinity, Infinity, -Infinity, -Infinity];
            for (const poly of polys) for (const [x, y] of poly[0]) { bbox[0] = Math.min(bbox[0], x); bbox[1] = Math.min(bbox[1], y); bbox[2] = Math.max(bbox[2], x); bbox[3] = Math.max(bbox[3], y); }
            return { name: String((f.properties && f.properties[pool.nameProp]) || ''), polys, bbox };
          });
          syncRegionLayer();
          if (pool === DECOR_POOL) drawDecor();
          return true;
        })
        .catch(err => {
          geo.loading = null;
          toast(`${pool.regionLabel} sınırları yüklenemedi: ${err.message}`, 'warn');
          return false;
        });
    }
    return geo.loading;
  }
  /** Ray casting: is the point (x = lng, y = lat) inside the ring? */
  function inRing(ring, x, y) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const inPolygon = (poly, x, y) => inRing(poly[0], x, y) && !poly.slice(1).some(hole => inRing(hole, x, y));
  /** The province (or country) under a point in a pool, '' at sea, outside or before its GeoJSON has loaded. */
  function provinceAt(lat, lng, poolId) {
    const features = geoOf(poolOf(poolId)).features;
    if (!features || !Number.isFinite(lat) || !Number.isFinite(lng)) return '';
    for (const f of features) {
      const b = f.bbox;
      if (lng < b[0] || lng > b[2] || lat < b[1] || lat > b[3]) continue;
      if (f.polys.some(poly => inPolygon(poly, lng, lat))) return f.name;
    }
    return '';
  }

  /* The home and lobby screens sit on a pastel atlas of the provinces with a dashed travel route. */
  const ATLAS = ['#f1d9b5', '#d9e4c6', '#f4e3a6', '#cfe1ea', '#efcfc3', '#e4d8ea'];
  function drawDecor() {
    const cv = $('#decor');
    const features = geoOf(DECOR_POOL).features;
    if (!cv || !features || document.body.classList.contains('in-game')) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const narrow = w <= 820;
    const left = Math.max(520, w * 0.4);
    const box = narrow ? { x: 12, y: 10, w: w - 24, h: h * 0.22 - 10 } : { x: left, y: h * 0.1, w: w - left - 40, h: h * 0.8 };
    if (box.w < 120) return;
    const k = Math.cos(39 * Math.PI / 180);
    const W0 = 25.6;
    const N0 = 42.2;
    const scale = Math.min(box.w / ((44.9 - W0) * k), box.h / (N0 - 35.8));
    const ox = box.x + (box.w - (44.9 - W0) * k * scale) / 2;
    const oy = box.y + (box.h - (N0 - 35.8) * scale) / 2;
    const P = (x, y) => [ox + (x - W0) * k * scale, oy + (N0 - y) * scale];
    ctx.lineJoin = 'round';
    features.forEach((f, i) => {
      ctx.beginPath();
      for (const poly of f.polys) for (const ring of poly) ring.forEach(([x, y], j) => { const [px, py] = P(x, y); if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.fillStyle = ATLAS[i % ATLAS.length];
      ctx.fill('evenodd');
      ctx.strokeStyle = '#fffaf0';
      ctx.lineWidth = narrow ? 0.6 : 1;
      ctx.stroke();
    });
    const stops = [[28.98, 41.01], [32.86, 39.93], [34.83, 38.64], [30.71, 36.89], [27.14, 38.42]];
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#b5482a';
    ctx.lineWidth = narrow ? 1.5 : 2;
    ctx.beginPath();
    stops.forEach((s, i) => { const [px, py] = P(s[0], s[1]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke();
    ctx.setLineDash([]);
    for (const s of stops) {
      const [px, py] = P(s[0], s[1]);
      ctx.beginPath();
      ctx.arc(px, py, narrow ? 3.5 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#b5482a';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fffaf0';
      ctx.stroke();
    }
  }
  window.addEventListener('resize', () => { if (!document.body.classList.contains('in-game')) drawDecor(); });

  /* ------------------------------------------------------------ map (Leaflet) */
  let map = null;
  let mapTouched = false;
  let myLayer = null;
  let triesLayer = null;
  let revealLayer = null;
  let provLayer = null;
  let provPool = '';
  let mapPool = '';
  const provByName = new Map();
  const PROV_STYLE = { color: '#2a6f97', weight: 0.7, opacity: 0.4, fill: false };
  const PROV_HL = { color: '#b5482a', weight: 1.8, opacity: 0.9, fill: true, fillColor: '#b5482a', fillOpacity: 0.1 };
  const activePool = () => viewPool(S.view);
  const playBounds = () => { const b = activePool().bounds; return L.latLngBounds([b.latMin, b.lngMin], [b.latMax, b.lngMax]); };

  function ensureMap() {
    if (map || typeof L === 'undefined') return;
    const pool = activePool();
    map = L.map($('#map'), {
      minZoom: pool.minZoom, maxZoom: 13, maxBounds: playBounds(), maxBoundsViscosity: 1, zoomSnap: 0.25, zoomDelta: 0.5,
      wheelPxPerZoomLevel: 80, worldCopyJump: false, boxZoom: false
    });
    mapPool = pool.id;
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    L.tileLayer(TILE_URL, {
      maxZoom: 19, noWrap: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıcıları'
    }).addTo(map);
    if (pool.attribution) map.attributionControl.addAttribution(pool.attribution);
    myLayer = L.layerGroup().addTo(map);
    triesLayer = L.layerGroup().addTo(map);
    revealLayer = L.layerGroup().addTo(map);
    map.fitBounds(playBounds(), { animate: false });
    map.on('click', onMapClick);
    let hoverQueued = null;
    map.on('mousemove', e => {
      if (hoverQueued) { hoverQueued = e.latlng; return; }
      hoverQueued = e.latlng;
      requestAnimationFrame(() => { const ll = hoverQueued; hoverQueued = null; setHover(provinceAt(ll.lat, ll.lng, activePool().id)); });
    });
    map.on('mouseout', () => setHover(''));
    syncRegionLayer();
    // The inset grows on hover; Leaflet must learn its new size or clicks land on the wrong spot. Until the player
    // zooms or pans on purpose, every resize re-fits the play area, otherwise the big map shows half the Middle East.
    const touched = () => { mapTouched = true; };
    map.getContainer().addEventListener('wheel', touched, { passive: true });
    map.getContainer().addEventListener('dblclick', touched);
    map.on('dragstart', touched);
    map.getContainer().querySelectorAll('.leaflet-control-zoom a').forEach(a => a.addEventListener('click', touched));
    $('#mapbox').addEventListener('transitionend', e => {
      if (!(e.target.classList.contains('map') || e.target.id === 'mapbox')) return;
      map.invalidateSize();
      if (!mapTouched && S.view && S.view.phase === 'guess') map.fitBounds(playBounds(), { animate: false });
    });
  }
  /** A room or solo game on another pool: new bounds, zoom floor and region layer. */
  function syncMapPool() {
    if (!map) return;
    const pool = activePool();
    if (mapPool !== pool.id) {
      const was = poolOf(mapPool);
      if (was.attribution) map.attributionControl.removeAttribution(was.attribution);
      if (pool.attribution) map.attributionControl.addAttribution(pool.attribution);
      mapPool = pool.id;
      map.setMinZoom(pool.minZoom);
      map.setMaxBounds(playBounds());
      map.fitBounds(playBounds(), { animate: false });
    }
    syncRegionLayer();
  }
  function syncRegionLayer() {
    if (!map) return;
    const pool = activePool();
    if (provLayer && provPool === pool.id) return;
    if (provLayer) { provLayer.remove(); provLayer = null; provPool = ''; provByName.clear(); S.hl = ''; }
    const geo = geoOf(pool);
    if (!geo.raw) { loadGeo(pool); return; }
    provPool = pool.id;
    provLayer = L.geoJSON(geo.raw, { renderer: L.canvas({ padding: 0.3 }), interactive: false, style: () => Object.assign({}, PROV_STYLE) });
    provLayer.eachLayer(layer => provByName.set(String(layer.feature.properties[pool.nameProp] || ''), layer));
    provLayer.addTo(map);
    paintHighlight();
  }
  function highlightProvince(name) {
    if (S.hl === name) return;
    const old = provByName.get(S.hl);
    if (old) old.setStyle(PROV_STYLE);
    const now = provByName.get(name);
    if (now) now.setStyle(PROV_HL);
    S.hl = name;
  }
  function paintHighlight() {
    const v = S.view;
    if (!v) { highlightProvince(''); return; }
    if (v.phase === 'guess') highlightProvince(S.hover || (S.pin ? S.pin.province : v.mine && v.mine.done ? v.mine.province : ''));
    else highlightProvince(v.reveal ? findProvince(v.reveal.item.province) : '');
  }
  function findProvince(name) {
    for (const k of provByName.keys()) if (HK.sameProvince(k, name)) return k;
    return '';
  }
  function setHover(name) {
    S.hover = name;
    const tag = $('#map-hover');
    tag.hidden = !name;
    if (name) tag.textContent = name;
    paintHighlight();
  }
  function tipEl(text) { return el('span', '', text); }
  function pinIcon(name, color, opts) {
    const o = opts || {};
    const wrap = el('span', 'pin' + (o.mine ? ' mine' : '') + (o.locked ? ' locked' : ''));
    wrap.style.setProperty('--c', color);
    wrap.append(el('b', '', o.mine ? 'Sen' : initials(name)));
    return L.divIcon({ className: 'pin-icon', html: wrap, iconSize: [34, 34], iconAnchor: [17, 42], tooltipAnchor: [0, -40] });
  }
  function truthIcon() {
    return L.divIcon({ className: 'pin-icon', html: el('span', 'pin-truth', '★'), iconSize: [38, 38], iconAnchor: [19, 19], tooltipAnchor: [0, -20] });
  }
  function clearMapLayers() {
    if (myLayer) myLayer.clearLayers();
    if (triesLayer) triesLayer.clearLayers();
    if (revealLayer) revealLayer.clearLayers();
    S.myMarker = null;
    S.myMarkerSig = '';
    if (map) setHover('');
  }
  /** The player's own earlier attempts: faint dots joined by a dotted line, in the order they were placed. */
  function drawTrail(layer, attempts, upTo) {
    const color = colorOf((me(S.view) || {}).look);
    const pts = attempts.map(t => [t.lat, t.lng]);
    if (pts.length > 1) L.polyline(pts, { color, weight: 2, opacity: 0.55, dashArray: '2 6', interactive: false }).addTo(layer);
    attempts.slice(0, upTo).forEach(t => L.circleMarker([t.lat, t.lng], { radius: 6, color, weight: 2, opacity: 0.7, fillColor: color, fillOpacity: 0.25, interactive: false }).addTo(layer));
  }
  function placePin(lat, lng) {
    const v = S.view;
    if (!v || v.phase !== 'guess' || (v.mine && v.mine.done) || isPresenter(v) || S.sentKey === S.tryKey) return false;
    const pool = activePool();
    if (!HK.inBounds(lat, lng, pool.bounds)) { toast('Bu nokta oyun alanının dışında. Haritanın içinde bir yer seç.', 'warn'); return false; }
    S.pin = { lat, lng, province: provinceAt(lat, lng, pool.id) };
    audio.pin();
    renderGuess(v);
    return true;
  }
  function onMapClick(e) { placePin(e.latlng.lat, e.latlng.lng); }
  function setMyMarker(pos, locked) {
    if (!map) return;
    if (!pos) {
      if (S.myMarker) { myLayer.removeLayer(S.myMarker); S.myMarker = null; S.myMarkerSig = ''; }
      return;
    }
    const mine = me(S.view);
    const sig = (locked ? 'L' : 'F') + ':' + colorOf(mine && mine.look);
    if (!S.myMarker || S.myMarkerSig !== sig) {
      if (S.myMarker) myLayer.removeLayer(S.myMarker);
      const m = L.marker([pos.lat, pos.lng], { icon: pinIcon(mine ? mine.name : '', colorOf(mine && mine.look), { mine: true, locked }), draggable: !locked, keyboard: false, zIndexOffset: 500 });
      if (!locked) {
        m.on('dragend', () => {
          const ll = m.getLatLng();
          if (!placePin(ll.lat, ll.lng) && S.pin) m.setLatLng([S.pin.lat, S.pin.lng]);
        });
      }
      m.addTo(myLayer);
      S.myMarker = m;
      S.myMarkerSig = sig;
      return;
    }
    const ll = S.myMarker.getLatLng();
    if (ll.lat !== pos.lat || ll.lng !== pos.lng) S.myMarker.setLatLng([pos.lat, pos.lng]);
  }

  /* ------------------------------------------------------------ photo viewer: click to zoom, drag to pan */
  const zoom = { s: 1, x: 0, y: 0, drag: null, moved: false };
  function applyZoom() {
    $('#photo').style.transform = zoom.s > 1 ? `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})` : '';
    $('#stage').classList.toggle('zoomed', zoom.s > 1);
  }
  function clampPan() {
    const st = $('#stage');
    const w = st.clientWidth;
    const h = st.clientHeight;
    zoom.x = Math.min(0, Math.max(w - w * zoom.s, zoom.x));
    zoom.y = Math.min(0, Math.max(h - h * zoom.s, zoom.y));
  }
  function zoomAt(cx, cy, scale) {
    const ns = Math.max(1, Math.min(4, scale));
    zoom.x = cx - (cx - zoom.x) * (ns / zoom.s);
    zoom.y = cy - (cy - zoom.y) * (ns / zoom.s);
    zoom.s = ns;
    if (ns === 1) { zoom.x = 0; zoom.y = 0; }
    clampPan();
    applyZoom();
  }
  function resetZoom() { zoom.s = 1; zoom.x = 0; zoom.y = 0; applyZoom(); }
  function setPhoto(file, pool) {
    const url = gameUrl(file, pool);
    const stage = $('#stage');
    const img = $('#photo');
    resetZoom();
    stage.classList.add('loading');
    $('#photo-wait').textContent = 'Fotoğraf yükleniyor…';
    img.onload = () => stage.classList.remove('loading');
    img.onerror = () => { $('#photo-wait').textContent = 'Fotoğraf yüklenemedi. Sayfayı yenilemeyi dene.'; };
    img.src = url;
    $('#photo-bg').src = url;
  }
  function wireStage() {
    const stage = $('#stage');
    const local = e => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener('wheel', e => {
      if (!S.view || S.view.phase !== 'guess') return;
      e.preventDefault();
      const [x, y] = local(e);
      zoomAt(x, y, zoom.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2));
    }, { passive: false });
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      zoom.drag = { x: e.clientX, y: e.clientY, ox: zoom.x, oy: zoom.y };
      zoom.moved = false;
    });
    stage.addEventListener('pointermove', e => {
      const d = zoom.drag;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) zoom.moved = true;
      if (zoom.s > 1 && zoom.moved) { zoom.x = d.ox + dx; zoom.y = d.oy + dy; clampPan(); applyZoom(); }
    });
    stage.addEventListener('pointerup', e => {
      const d = zoom.drag;
      zoom.drag = null;
      if (!d || zoom.moved) return;
      const [x, y] = local(e);
      if (zoom.s > 1) resetZoom(); else zoomAt(x, y, 2.2);
    });
    stage.addEventListener('pointercancel', () => { zoom.drag = null; });
    window.addEventListener('resize', () => { if (zoom.s > 1) { clampPan(); applyZoom(); } });
  }

  /* ------------------------------------------------------------ host */
  function ticker(fn, ms) {
    // A worker keeps ticking while the tab is in the background; plain timers get throttled there.
    const every = ms || 100;
    const src = `const id = setInterval(() => postMessage(0), ${every}); onmessage = () => { clearInterval(id); close(); };`;
    if (typeof Worker === 'function') {
      const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      w.onmessage = fn;
      return () => w.terminate();
    }
    const id = setInterval(fn, every);
    return () => clearInterval(id);
  }

  const isLive = pid => pid === S.myId || [...S.conns.values()].includes(pid);
  const inGame = phase => phase === 'guess' || phase === 'reveal';
  // The host's province (or country) lookup for every guess, in the room's current pool.
  const hostLookup = (lat, lng, poolId) => provinceAt(lat, lng, poolId);

  function hostDrop(connId) {
    const pid = S.conns.get(connId);
    S.conns.delete(connId);
    if (!pid || isLive(pid) || !S.room) return;
    if (S.room.phase === 'lobby') HK.removePlayer(S.room, pid); else HK.setOnline(S.room, pid, false);
    S.seen.delete(pid);
    S.dirty = true;
  }

  function hostReceive(connId, msg) {
    if (!S.room || !msg || typeof msg !== 'object' || typeof msg.t !== 'string') return;
    const room = S.room;
    let pid = S.conns.get(connId);
    if (msg.t === 'hello') {
      if (pid) return;
      if (msg.v !== PROTOCOL) { S.link.send(connId, { t: 'reject', reason: 'version' }); setTimeout(() => S.link && S.link.drop(connId), 400); return; }
      const want = typeof msg.cid === 'string' && /^u[A-Z0-9]{10}$/.test(msg.cid) ? msg.cid : '';
      const existing = want ? HK._internal.getPlayer(room, want) : null;
      if (existing && !existing.bot && existing.id !== S.myId) {
        // The same browser came back (page reload or reconnect): the old channel, if any, gives way.
        for (const [oldConn, oldPid] of [...S.conns]) if (oldPid === existing.id && oldConn !== connId) { S.conns.delete(oldConn); S.link.drop(oldConn); }
        pid = existing.id;
        HK.setOnline(room, pid, true);
        if (room.phase === 'lobby') HK.setProfile(room, pid, { name: msg.name, emoji: msg.emoji, look: msg.look });
      } else {
        pid = want && !existing ? want : 'u' + randomCode(10);
        const r = HK.addPlayer(room, { id: pid, name: msg.name, emoji: msg.emoji, look: msg.look });
        if (!r.ok) { S.link.send(connId, { t: 'reject', reason: r.reason }); setTimeout(() => S.link && S.link.drop(connId), 400); return; }
      }
      S.conns.set(connId, pid);
      S.seen.set(pid, Date.now());
      S.link.send(connId, { t: 'welcome', id: pid });
      S.dirty = true;
      return;
    }
    if (!pid) return;
    S.seen.set(pid, Date.now());
    if (msg.t === 'intent') { HK.apply(room, pid, msg.i); S.dirty = true; }
  }

  function housekeeping() {
    const now = Date.now();
    for (const [connId, pid] of [...S.conns]) {
      if (now - (S.seen.get(pid) || 0) > GUEST_TIMEOUT) { S.link.drop(connId); hostDrop(connId); }
    }
  }

  /** Each player gets a snapshot of their own: before the reveal it holds only their own pin. A solo game sends nothing. */
  function publish(toGuests) {
    if (toGuests && S.link) {
      S.lastSend = performance.now();
      S.dirty = false;
      S.link.each(connId => {
        const pid = S.conns.get(connId);
        if (pid) S.link.send(connId, { t: 'state', s: HK.snapshot(S.room, pid), n: HK.noticesFor(S.room, pid) });
      });
    }
    onState(HK.snapshot(S.room, S.myId), HK.noticesFor(S.room, S.myId));
  }

  function startHostLoop() {
    let last = performance.now();
    let lastHouse = 0;
    S.stopTicker = ticker(() => {
      if (!S.room) return;
      const now = performance.now();
      let dt = (now - last) / 1000;
      last = now;
      const room = S.room;
      if (inGame(room.phase)) {
        if (dt > 2) dt = 0.1; // the computer slept: pause the game instead of fast-forwarding it
        const before = room.phase + room.game.round;
        while (dt > 0 && inGame(room.phase)) { const step = Math.min(dt, 0.25); HK.tick(room, step); dt -= step; }
        if (room.phase + room.game.round !== before) S.dirty = true;
      }
      if (now - lastHouse > 1000) { lastHouse = now; housekeeping(); }
      const every = inGame(room.phase) ? STATE_EVERY : LOBBY_EVERY;
      const due = S.dirty || now - S.lastSend >= every;
      if (due || inGame(room.phase)) publish(due);
    });
  }

  const manifests = new Map();   // pool id -> items
  async function loadManifest(pool) {
    if (manifests.has(pool.id)) return manifests.get(pool.id);
    const res = await fetch(pool.manifest, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const items = (data && Array.isArray(data.items) ? data.items : []).filter(it => it && typeof it.file === 'string' && Number.isFinite(it.lat) && Number.isFinite(it.lng));
    if (!items.length) throw new Error('liste boş');
    manifests.set(pool.id, items);
    return items;
  }

  async function hostStart() {
    if (!checkName()) return;
    const pool = POOLS[0];
    setBusy(true);
    homeMsg('Fotoğraflar hazırlanıyor…');
    let items;
    try {
      [items] = await Promise.all([loadManifest(pool), loadGeo(pool)]);
    } catch (err) {
      setBusy(false);
      homeMsg(`Fotoğraf listesi yüklenemedi (${err.message}). Sayfayı yenileyip tekrar dene.`, 'error');
      return;
    }
    homeMsg('Oda açılıyor…');
    let code = '';
    let link = null;
    let lastErr = null;
    const handlers = {
      onOpen() { /* the guest introduces itself with a hello message next */ },
      onMessage: hostReceive,
      onClose: hostDrop,
      onError(err) { toast(netReason(err), 'warn'); }
    };
    for (let i = 0; i < 3 && !link; i++) {
      code = randomCode(5);
      try { link = await Net.hostRoom(code, handlers); } catch (err) {
        lastErr = err;
        if (err.type !== 'unavailable-id' && !brokerHiccup(err)) break;
        if (brokerHiccup(err)) { homeMsg(`Bağlantı sunucusu yanıt vermedi, tekrar deneniyor… (${i + 2}/3)`); await pause(BROKER_RETRY_MS); }
      }
    }
    S.role = 'host';
    S.myId = cid;
    S.link = link;
    S.offline = !link;
    S.room = HK.createRoom(link ? code : '', cid, crypto.getRandomValues(new Uint32Array(1))[0] | 0, items,
      Object.assign(poolOpts(pool), { provinceAt: hostLookup, debugRoundTime }));
    HK.addPlayer(S.room, { id: cid, name: profile.name, emoji: profile.emoji, look: Object.assign({}, look) });
    const net = $('#lobby-net');
    net.hidden = !!link;
    net.textContent = link ? '' : `Online oda açılamadı. ${netReason(lastErr)} Botlarla tek başına oynayabilirsin.`;
    history.replaceState(null, '', link ? '?oda=' + code : location.pathname);
    startHostLoop();
    homeMsg('');
    setBusy(false);
    publish(true);
  }

  /** The host picks another pool in the lobby: its photos and borders load first, then everyone switches. */
  async function choosePool(id) {
    const pool = poolOf(id);
    if (S.role !== 'host' || !S.room || S.room.phase !== 'lobby' || S.poolBusy) return;
    if (!S.room.pools[pool.id]) {
      S.poolBusy = true;
      if (S.view) renderLobby(S.view);
      try {
        const [items] = await Promise.all([loadManifest(pool), loadGeo(pool)]);
        if (!S.room) return;
        HK.addPool(S.room, pool.id, items, poolOpts(pool));
      } catch (err) {
        toast(`${pool.label} fotoğrafları yüklenemedi (${err.message}).`, 'warn');
        return;
      } finally {
        S.poolBusy = false;
      }
    }
    intent({ t: 'settings', pool: pool.id });
  }

  /* ------------------------------------------------------------ solo: the host loop runs here, nothing goes out */
  async function soloStart(modeId) {
    const m = HK.MODES[modeId];
    if (!m || !checkName()) return;
    const pool = poolOf(solo.pool);
    setBusy(true);
    homeMsg('Fotoğraflar hazırlanıyor…');
    let items;
    try {
      [items] = await Promise.all([loadManifest(pool), loadGeo(pool)]);
    } catch (err) {
      setBusy(false);
      homeMsg(`Fotoğraf listesi yüklenemedi (${err.message}). Sayfayı yenileyip tekrar dene.`, 'error');
      return;
    }
    S.role = 'host';
    S.solo = true;
    S.myId = cid;
    S.link = null;
    S.room = HK.createRoom('', cid, crypto.getRandomValues(new Uint32Array(1))[0] | 0, items,
      Object.assign(poolOpts(pool), { provinceAt: hostLookup, debugRoundTime, solo: true }));
    HK.addPlayer(S.room, { id: cid, name: profile.name, emoji: profile.emoji, look: Object.assign({}, look) });
    HK.apply(S.room, cid, { t: 'settings', mode: m.id, roundTime: solo.time });
    if (m.bots && solo.bots !== 'none') for (let i = 0; i < SOLO_BOTS; i++) HK.apply(S.room, cid, { t: 'addBot', level: solo.bots });
    const res = HK.apply(S.room, cid, { t: 'start', day: today() });
    if (!res.ok) { leave('Oyun başlatılamadı: ' + res.reason); return; }
    solo.mode = null;
    startHostLoop();
    homeMsg('');
    setBusy(false);
    publish(true);
  }
  /** "Tekrar oyna" in a solo game starts the same mode at once; a solo game never shows the lobby. */
  function soloAgain() {
    HK.apply(S.room, S.myId, { t: 'again' });
    const res = HK.apply(S.room, S.myId, { t: 'start', day: today() });
    if (!res.ok) { leave('Oyun başlatılamadı: ' + res.reason); return; }
    S.dirty = true;
    publish(true);
  }

  /* ------------------------------------------------------------ guest */
  function guestReceive(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'welcome' && typeof msg.id === 'string') { S.myId = msg.id; return; }
    if (msg.t === 'reject') { leave(rejectReason(msg.reason)); return; }
    if (msg.t === 'bye') { leave('Oda sahibi odayı kapattı.'); return; }
    if (msg.t === 'state' && msg.s && typeof msg.s === 'object' && Array.isArray(msg.s.players)) {
      S.lastState = Date.now();
      if (!S.myId) return;
      if (!msg.s.players.some(p => p.id === S.myId)) { leave('Odadan çıkarıldın.'); return; }
      onState(msg.s, Array.isArray(msg.n) ? msg.n : []);
    }
  }

  const RECONNECT_TRIES = 3;
  const BROKER_RETRY_MS = 1200;
  const pause = ms => new Promise(r => setTimeout(r, ms));
  /** A broker-side failure before the handshake finished: the socket closed early or the server was unreachable. */
  const brokerHiccup = err => !!err && ['network', 'socket-error', 'socket-closed', 'server-error'].includes(err.type);

  async function connectGuest(code) {
    const link = await Net.joinRoom(code, {
      onMessage: guestReceive,
      onClose() { if (S.role === 'guest' && S.link === link) lostHost(code); },
      onError(err) { toast(netReason(err), 'warn'); }
    });
    S.link = link;
    link.send({ t: 'hello', v: PROTOCOL, cid, name: profile.name, emoji: profile.emoji, look: Object.assign({}, look) });
    S.lastState = Date.now();
  }

  /* The host went quiet: try to come back to the same seat a few times before giving up. */
  async function lostHost(code) {
    if (S.role !== 'guest' || S.reconnecting) return;
    S.reconnecting = true;
    const old = S.link;
    S.link = null;
    if (old) setTimeout(() => old.close(), 100);
    for (let attempt = 1; attempt <= RECONNECT_TRIES && S.role === 'guest'; attempt++) {
      toast(`Bağlantı koptu, yeniden bağlanılıyor… (${attempt}/${RECONNECT_TRIES})`, 'warn');
      try {
        await connectGuest(code);
        S.reconnecting = false;
        toast('Yeniden bağlandın.', 'ok');
        return;
      } catch (err) {
        if (err && err.type === 'peer-unavailable') break; // the host is really gone
      }
    }
    S.reconnecting = false;
    if (S.role === 'guest') leave('Oda sahibiyle bağlantı koptu.');
  }

  async function guestStart(code) {
    if (!checkName()) return;
    setBusy(true);
    homeMsg('Odaya bağlanılıyor…');
    S.role = 'guest';
    loadGeo(POOLS[0]);
    for (let attempt = 1; ; attempt++) {
      try {
        await connectGuest(code);
        break;
      } catch (err) {
        // The public broker sometimes closes the socket before the handshake; that is not the player's fault, try again.
        if (brokerHiccup(err) && attempt < 3) { homeMsg(`Bağlantı sunucusu yanıt vermedi, tekrar deneniyor… (${attempt + 1}/3)`); await pause(BROKER_RETRY_MS); continue; }
        S.role = null;
        setBusy(false);
        homeMsg(netReason(err), 'error');
        return;
      }
    }
    // The ping runs from a worker so a guest who switches tabs is not dropped by the host.
    S.stopTicker = ticker(() => {
      if (S.link) S.link.send({ t: 'ping' });
      if (S.role === 'guest' && !S.reconnecting && Date.now() - S.lastState > HOST_TIMEOUT) lostHost(code);
    }, PING_EVERY);
    history.replaceState(null, '', '?oda=' + code);
    homeMsg('Bağlandı, oda bilgisi bekleniyor…');
  }

  /* ------------------------------------------------------------ actions */
  function intent(i) {
    if (S.role === 'host') {
      HK.apply(S.room, S.myId, i);
      S.dirty = true;
      publish(true);
    } else if (S.role === 'guest' && S.link) {
      S.link.send({ t: 'intent', i });
    }
  }

  function confirmGuess() {
    const v = S.view;
    if (!S.pin || !v || v.phase !== 'guess' || (v.mine && v.mine.done) || isPresenter(v) || S.sentKey === S.tryKey) return;
    S.sentKey = S.tryKey;
    intent({ t: 'guess', lat: S.pin.lat, lng: S.pin.lng, province: S.pin.province || '' });
    // The host's own guess may have ended the round already; only a still running round shows "sending".
    if (S.view && S.view.phase === 'guess') renderGuess(S.view);
  }

  function checkName() {
    profile.name = HK.cleanName($('#in-name').value);
    if (!profile.name) { homeMsg('Önce bir ad yaz.', 'error'); $('#in-name').focus(); return false; }
    save('localStorage', 'tg.name', profile.name);
    return true;
  }

  function me(v) { return v && v.players.find(p => p.id === S.myId); }
  const isPresenter = v => !!(me(v) && me(v).spectator);

  function renderCareer() {
    const lvl = levelOf(career.xp);
    const from = xpForLevel(lvl);
    const to = xpForLevel(lvl + 1);
    setText($('#career-level'), 'Seviye ' + lvl);
    setText($('#career-title'), TITLES[lvl - 1]);
    const top = lvl >= TITLES.length;
    $('#career-bar').style.width = top ? '100%' : Math.round(((career.xp - from) / (to - from)) * 100) + '%';
    setText($('#career-xp'), top ? career.xp + ' puan' : `${career.xp} / ${to} puan`);
  }
  /** Adds career points; returns the new title after a promotion, '' otherwise. */
  function earnXp(points, quiet) {
    if (!(points > 0)) return '';
    const before = levelOf(career.xp);
    career.xp += points;
    save('localStorage', KEY + 'xp', String(career.xp));
    renderCareer();
    const after = levelOf(career.xp);
    if (after <= before) return '';
    if (!quiet) toast(`Terfi! Artık ${TITLES[after - 1]} oldun.`, 'ok');
    return TITLES[after - 1];
  }
  function buildSwatches() {
    const bodyBox = $('#look-body');
    const paintBody = () => { for (const b of bodyBox.children) b.setAttribute('aria-checked', String(Number(b.dataset.body) === look.body)); };
    if (!bodyBox.dataset.wired) {
      bodyBox.dataset.wired = '1';
      for (const b of bodyBox.children) b.addEventListener('click', () => { look.body = Number(b.dataset.body); save('localStorage', 'tg.look', JSON.stringify(look)); paintBody(); previewLook(); });
    }
    paintBody();
    for (const k of ['skin', 'hair', 'shirt']) {
      const box = $('#look-' + k);
      box.replaceChildren(...HK.PALETTES[k].slice(0, HK.LOOK_RANGE).map((c, i) => {
        const b = el('button');
        b.type = 'button';
        b.style.setProperty('--c', c);
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-label', `${k === 'skin' ? 'Ten' : k === 'hair' ? 'Saç' : 'Tişört'} ${i + 1}`);
        b.setAttribute('aria-checked', String(look[k] === i));
        b.addEventListener('click', () => {
          look[k] = i;
          save('localStorage', 'tg.look', JSON.stringify(look));
          for (const x of box.children) x.setAttribute('aria-checked', String(x === b));
          previewLook();
        });
        return b;
      }));
    }
  }
  function previewLook() { paintAvatar($('#look-preview'), look); }

  async function copyInvite() {
    if (!S.view || !S.view.code) return;
    const url = inviteUrl(S.view.code);
    try {
      await navigator.clipboard.writeText(url);
      toast('Davet linki kopyalandı. Ekibe gönder!', 'ok');
    } catch {
      // Clipboard access can be denied (no permission or an insecure context): show the link to copy by hand.
      window.prompt('Davet linkini kopyala:', url);
    }
  }

  /* ------------------------------------------------------------ home: solo mode cards and setup */
  function renderSolo() {
    const pool = poolOf(solo.pool);
    $('#solo-pool-row').hidden = POOLS.length < 2;
    renderSeg($('#solo-pool'), POOLS.map(p => [p.id, p.label]), pool.id, true, id => {
      solo.pool = poolOf(id).id;
      save('localStorage', KEY + 'pool', solo.pool);
      renderSolo();
    });
    const day = today();
    const daily = loadJson(dailyKey(pool.id));
    const best = bestStreak(pool.id);
    const box = $('#solo-modes');
    box.replaceChildren(...Object.values(HK.MODES).filter(m => m.solo).map(m => {
      const b = el('button', 'mode-card');
      b.type = 'button';
      b.dataset.mode = m.id;
      b.setAttribute('aria-pressed', String(solo.mode === m.id));
      const meta = [pool.label];
      if (m.daily) meta.push(fmtDay(day), daily[day] ? `Bugün: ${fmt(daily[day].score)} puan` : 'Bugün oynanmadı');
      if (m.scoring === 'streak' && best) meta.push(`En iyi seri: ${best}`);
      b.append(el('b', '', modeLabel(m, pool)), el('small', '', modeDesc(m, pool)), el('span', 'meta', meta.join(' · ')));
      b.addEventListener('click', () => pickSoloMode(m.id));
      return b;
    }));
    renderSoloSetup();
  }
  /** A mode with choices (bots, round time) opens the setup card; the others start at once. */
  function pickSoloMode(id) {
    const m = HK.MODES[id];
    if (!m.bots) { solo.mode = null; renderSoloSetup(); soloStart(id); return; }
    solo.mode = id;
    for (const b of document.querySelectorAll('#solo-modes button')) b.setAttribute('aria-pressed', String(b.dataset.mode === id));
    renderSoloSetup();
  }
  function renderSoloSetup() {
    const box = $('#solo-setup');
    const m = HK.MODES[solo.mode];
    box.hidden = !m;
    if (!m) return;
    const pool = poolOf(solo.pool);
    setText($('#solo-name'), `${modeLabel(m, pool)} · ${pool.label}`);
    setText($('#solo-desc'), modeDesc(m, pool));
    renderSeg($('#solo-bots'), BOT_CHOICES, solo.bots, true, val => { solo.bots = val; renderSoloSetup(); });
    $('#solo-time-row').hidden = m.roundTime != null;
    renderSeg($('#solo-time'), HK.ROUND_TIMES.map(d => [String(d), TIME_LABELS[d] || d + ' sn']), String(solo.time), true, val => { solo.time = Number(val); renderSoloSetup(); });
  }

  /* ------------------------------------------------------------ state handling */
  function onState(v, notices) {
    const prev = S.view;
    S.view = v;
    feedback(prev, v);
    for (const n of notices) {
      if (n.id > S.seenNotice) { S.seenNotice = n.id; toast(n.text, n.kind); }
    }
    render(v);
  }

  function feedback(prev, v) {
    if (!prev || !v) return;
    if ((prev.phase === 'lobby' || prev.phase === 'end') && v.phase === 'guess') audio.start();
    if (prev.phase === 'guess' && v.phase === 'guess' && prev.round === v.round && v.mine) {
      const before = prev.mine ? prev.mine.attempts.length : 0;
      const last = v.mine.attempts[v.mine.attempts.length - 1];
      if (v.mine.attempts.length > before && last) { if (last.hit) audio.ok(); else audio.miss(); }
    }
    if (prev.phase === 'guess' && v.phase === 'reveal') {
      audio.gong();
      const mine = me(v);
      if (mine && v.reveal && v.reveal.pins.some(x => x.pid === S.myId) && modeOf(v).scoring !== 'none') toast(`+${fmt(mine.lastPoints)} puan`, 'ok');
      // At most one bot joke per round, on every screen, never during a guess.
      const bn = v.reveal && v.reveal.banter;
      const bot = bn && v.players.find(p => p.id === bn.pid);
      if (bot) toast(`${bot.name}: "${bn.text}"`, 'info');
    }
    if (prev.phase !== 'end' && v.phase === 'end') {
      audio.fanfare();
      const mode = modeOf(v);
      const mine = (v.standings || []).find(r => r.id === S.myId);
      S.lastXp = mine ? xpFor(mode, mine.score) : 0;
      S.record = false;
      S.replay = false;
      if (v.solo && mine) recordSolo(v, mode, mine);
      // The end card has the whole story; toasts from the last round would only cover its title.
      $('#toasts').replaceChildren();
      S.promo = earnXp(S.lastXp, true);
    }
  }
  /** Solo results kept in this browser: the best Seri and the day's first Günün Oyunu result, per pool. */
  function recordSolo(v, mode, mine) {
    const pool = viewPool(v);
    if (mode.scoring === 'streak') {
      const best = bestStreak(pool.id);
      S.record = mine.score > best;
      S.best = Math.max(best, mine.score);
      if (S.record) save('localStorage', streakKey(pool.id), String(mine.score));
    }
    if (mode.daily) {
      const all = loadJson(dailyKey(pool.id));
      S.replay = !!all[v.day];
      if (!S.replay) {
        all[v.day] = { score: mine.score, rounds: mine.rounds.map((points, i) => ({ points, km: mine.kms[i] })) };
        save('localStorage', dailyKey(pool.id), JSON.stringify(all));
      }
    }
  }

  /* ------------------------------------------------------------ rendering helpers */
  function syncList(ul, items, key, create, update) {
    const old = new Map();
    for (const li of ul.children) old.set(li.dataset.key, li);
    items.forEach((item, i) => {
      const k = key(item);
      let li = old.get(k);
      if (li) old.delete(k); else { li = create(item); li.dataset.key = k; }
      update(li, item);
      if (ul.children[i] !== li) ul.insertBefore(li, ul.children[i] || null);
    });
    old.forEach(li => li.remove());
  }
  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }

  function render(v) {
    document.body.classList.toggle('in-game', v.phase !== 'lobby');
    if (v.phase === 'lobby') { show('lobby'); renderLobby(v); $('#end').hidden = true; S.endKey = ''; return; }
    show('game');
    renderGame(v);
    $('#end').hidden = v.phase !== 'end';
    if (v.phase === 'end') renderEnd(v);
  }

  /* ------------------------------------------------------------ lobby */
  function renderLobby(v) {
    const host = S.myId === v.hostId;
    const pool = viewPool(v);
    const mode = HK.MODES[v.settings.mode] || HK.MODES.klasik;
    const seated = v.players.filter(p => !p.spectator);
    const max = v.max - (v.players.length - seated.length);   // the presenter's seat is not a playing seat
    const full = v.players.length >= v.max;
    setText($('#lobby-code'), v.code || 'YEREL');
    $('#btn-copy').hidden = !v.code;
    setText($('#lobby-count'), `${seated.length}/${max}`);
    // Empty seats fold into one line, so the settings and the start button stay in view.
    const seats = seated.map(p => ({ p }));
    const free = max - seated.length;
    if (free > 0) seats.push({ empty: free });
    syncList($('#lobby-players'), seats, s => (s.p ? s.p.id : 'empty'), s => {
      const li = el('li', 'seat' + (s.p ? '' : ' seat-free'));
      if (!s.p) return li;
      li.append(avatar(s.p.look), el('div', 'who'), el('span', 'tags'));
      li.querySelector('.who').append(el('b'), el('small'));
      if (host && s.p.bot) {
        const x = el('button', 'x', '×');
        x.type = 'button';
        x.setAttribute('aria-label', s.p.name + ' botunu çıkar');
        x.addEventListener('click', () => intent({ t: 'removeBot', id: s.p.id }));
        li.append(x);
      }
      return li;
    }, (li, s) => {
      if (!s.p) { setText(li, s.empty === 1 ? '1 boş koltuk' : `${s.empty} boş koltuk`); return; }
      const p = s.p;
      paintAvatar(li.querySelector('.avatar'), p.look);
      setText(li.querySelector('.who b'), p.name);
      setText(li.querySelector('.who small'), p.bot ? `${(HK.BOT_LEVELS[p.level] || HK.BOT_LEVELS.pro).label} bot` : (p.online ? 'Hazır' : 'Bağlanıyor…'));
      const tags = li.querySelector('.tags');
      const want = [p.id === v.hostId ? ['host', 'Oda sahibi'] : null, p.id === S.myId ? ['you', 'Sen'] : null, p.bot ? ['bot', 'Bot'] : null].filter(Boolean);
      const sig = want.map(t => t[1]).join();
      if (tags.dataset.sig !== sig) {
        tags.dataset.sig = sig;
        tags.replaceChildren(...want.map(([c, t]) => el('span', 'tag ' + c, t)));
      }
    });
    $('#bot-controls').hidden = !host || !mode.bots;
    for (const b of document.querySelectorAll('#bot-controls button')) b.disabled = full;
    const roomModes = Object.values(HK.MODES).filter(m => m.room);
    renderSeg($('#set-mode'), roomModes.map(m => [m.id, modeLabel(m, pool)]), mode.id, host, val => intent({ t: 'settings', mode: val }));
    setText($('#set-mode-desc'), modeDesc(mode, pool));
    $('#row-pool').hidden = POOLS.length < 2;
    renderSeg($('#set-pool'), POOLS.map(p => [p.id, p.label]), pool.id, host && !S.poolBusy, choosePool);
    setText($('#set-rounds'), mode.roundTime == null ? `${mode.rounds} tur, her turda bir fotoğraf` : `${mode.rounds} tur, her tur ${mode.roundTime} sn`);
    $('#row-time').hidden = mode.roundTime != null;
    renderSeg($('#set-time'), HK.ROUND_TIMES.map(d => [String(d), TIME_LABELS[d] || d + ' sn']), String(v.settings.roundTime), host, val => intent({ t: 'settings', roundTime: Number(val) }));
    const presenter = !!v.settings.presenter;
    const box = $('#set-presenter');
    box.checked = presenter;
    box.disabled = !host;
    $('#row-presenter').hidden = !host && !presenter;
    $('#lobby-qr').hidden = !(presenter && v.code);
    if (presenter && v.code) setQr($('#lobby-qr-img'), inviteUrl(v.code));
    const waiting = presenter && !seated.some(p => !p.bot);
    const start = $('#btn-start');
    start.hidden = !host;
    start.disabled = waiting;
    setText(start, waiting ? 'En az bir oyuncu bekleniyor' : 'Oyunu başlat');
    $('#lobby-wait').hidden = host;
    setText($('#btn-leave'), host ? 'Odayı kapat' : 'Odadan çık');
    loadGeo(pool);
  }

  function renderSeg(box, options, current, enabled, onPick) {
    if (box.childElementCount !== options.length) {
      box.replaceChildren(...options.map(([val]) => {
        const b = el('button');
        b.type = 'button';
        b.dataset.val = val;
        b.setAttribute('role', 'radio');
        b.addEventListener('click', () => onPick(val));
        return b;
      }));
    }
    [...box.children].forEach((b, i) => {
      setText(b, options[i][1]);
      b.setAttribute('aria-checked', String(b.dataset.val === current));
      b.disabled = !enabled;
    });
  }

  /* ------------------------------------------------------------ game */
  function renderGame(v) {
    const game = $('#screen-game');
    const layout = v.phase === 'guess' ? 'guess' : 'reveal';
    const presenter = isPresenter(v);
    const changed = game.dataset.phase !== layout || game.hasAttribute('data-presenter') !== presenter;
    game.dataset.phase = layout;
    game.toggleAttribute('data-presenter', presenter);
    // The presenter's guess screen has no map; it is built once the reveal shows one.
    if (!(presenter && layout === 'guess')) ensureMap();
    if (changed && map) map.invalidateSize({ pan: false });
    syncMapPool();
    const mode = modeOf(v);
    const pool = viewPool(v);
    setText($('#hud-round'), v.rounds ? `Tur ${v.round}/${v.rounds}` : `Tur ${v.round}`);
    setText($('#hud-mode'), mode.scoring === 'streak' ? `${modeLabel(mode, pool)} · ${v.streak}` : modeLabel(mode, pool));
    setText($('#hud-question'), v.phase === 'guess' ? pool.question : v.phase === 'reveal' ? GAME.title + ' · sonuçlar' : 'Oyun bitti');
    renderChips(v);
    renderPresent(v, presenter);
    if (v.phase === 'guess') { $('#reveal').hidden = true; renderGuess(v); } else { showCompass(null); renderReveal(v); }
  }

  function renderChips(v) {
    syncList($('#chips'), v.players.filter(p => !p.spectator), p => p.id, p => {
      const li = el('li', 'chip');
      const dots = el('span', 'tries');
      dots.setAttribute('aria-hidden', 'true');
      dots.append(...Array.from({ length: HK.ATTEMPTS }, () => el('i')));
      li.append(avatar(p.look, 'sm'), el('span', 'who'), dots);
      li.querySelector('.who').append(el('b'), el('small'));
      return li;
    }, (li, p) => {
      paintAvatar(li.querySelector('.avatar'), p.look);
      setText(li.querySelector('.who b'), p.name + (p.id === S.myId ? ' (sen)' : ''));
      const state = p.takeover ? 'Koptu, bot oynuyor' : p.guessed ? 'Tahmin etti ✓' : !p.online ? 'Bağlantı yok' : p.tries ? `Deniyor (${p.tries}/${HK.ATTEMPTS})` : p.bot ? 'Bot düşünüyor' : 'Düşünüyor…';
      setText(li.querySelector('.who small'), state);
      [...li.querySelector('.tries').children].forEach((d, i) => d.classList.toggle('on', i < p.tries));
      li.classList.toggle('guessed', p.guessed);
      li.classList.toggle('me', p.id === S.myId);
      li.classList.toggle('bot', p.bot);
      li.classList.toggle('takeover', !!p.takeover);
      li.classList.toggle('offline', !p.online);
    });
  }

  /** The presenter's join card: the room code in large type and a QR of the invite link. */
  function renderPresent(v, presenter) {
    const box = $('#present');
    box.hidden = !(presenter && v.phase === 'guess' && v.code);
    if (box.hidden) return;
    const url = inviteUrl(v.code);
    setText($('#present-code'), v.code);
    setText($('#present-url'), url.replace(/^https?:\/\//, ''));
    setQr($('#present-qr'), url);
  }

  /** After a miss: the compass card with the direction, the distance band, the hint and the attempts left. */
  function showCompass(mine) {
    const card = $('#compass');
    const tries = mine ? mine.attempts.length : 0;
    const last = tries ? mine.attempts[tries - 1] : null;
    const on = !!(last && !last.hit && !mine.done);
    card.hidden = !on;
    card.parentElement.classList.toggle('compassing', on);
    if (!on) return;
    const left = HK.ATTEMPTS - tries;
    setText($('#compass-band'), last.kmBand);
    setText($('#compass-text'), `Iska! ${last.kmBand}, ${DIR_NAMES[last.dir] || ''} yönünde. ${left} hakkın kaldı.`);
    const hint = $('#compass-hint');
    hint.hidden = !last.hint;
    setText(hint, last.hint || '');
    const dots = $('#compass-dots');
    if (dots.childElementCount !== HK.ATTEMPTS) dots.replaceChildren(...Array.from({ length: HK.ATTEMPTS }, () => el('i')));
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i < left));
    card.dataset.dir = last.dir;
    card.classList.remove('in');
    void card.offsetWidth;   // restart the slide-in
    card.classList.add('in');
    const needle = $('#compass-needle');
    requestAnimationFrame(() => { needle.style.transform = `rotate(${DIR_DEG[last.dir] || 0}deg)`; });
  }

  function renderGuess(v) {
    const key = v.gameNo + ':' + v.round;
    if (S.roundKey !== key) {
      S.roundKey = key;
      S.pin = null;
      S.sentKey = '';
      S.tryKey = '';
      S.revealKey = '';
      S.lastSec = -1;
      clearMapLayers();
      if (v.photo) setPhoto(v.photo.file, viewPool(v));
      mapTouched = false;
      if (map) { map.invalidateSize({ pan: false }); map.setMaxBounds(playBounds()); map.fitBounds(playBounds(), { animate: false }); }
    }
    const mine = v.mine;
    const tries = mine ? mine.attempts.length : 0;
    const done = !!(mine && mine.done);
    const tryKey = key + ':' + tries;
    if (S.tryKey !== tryKey) {
      // A new attempt starts without a pin; the earlier ones stay as a faint trail.
      S.tryKey = tryKey;
      S.pin = null;
      if (triesLayer) { triesLayer.clearLayers(); if (tries) drawTrail(triesLayer, mine.attempts, done ? tries - 1 : tries); }
      showCompass(mine);
    }
    setMyMarker(done ? mine : S.pin, done);
    const sending = !done && S.sentKey === tryKey;
    const btn = $('#btn-guess');
    btn.disabled = done || sending || !S.pin;
    setText(btn, done ? 'Tahmin edildi' : sending ? 'Gönderiliyor…' : tries === 0 ? 'Tahmin et' : tries >= HK.ATTEMPTS - 1 ? 'Son tahmin' : `${tries + 1}. tahmin`);
    const where = S.pin ? S.pin.province : '';
    const hitNow = done && mine.attempts[tries - 1].hit;
    setText($('#guess-info'), done ? (hitNow ? 'İsabet! ' : '') + 'Tahminin alındı, diğerleri bekleniyor'
      : S.pin ? (where ? `İğne: ${where}. Taşıyabilir ya da onaylayabilirsin.` : 'İğne yerinde. Taşıyabilir ya da onaylayabilirsin.')
        : tries ? 'Pusulaya bak, haritada yeni bir yer seç.' : 'Haritada tahmin ettiğin yere tıkla.');
    const timer = $('#hud-timer');
    timer.hidden = !(v.roundTime > 0);
    setText(timer, mmss(v.timeLeft));
    timer.classList.toggle('warn', v.timeLeft <= 30 && v.timeLeft > 10);
    timer.classList.toggle('danger', v.timeLeft <= 10);
    const sec = Math.ceil(v.timeLeft);
    if (sec !== S.lastSec) { if (S.lastSec > 0 && sec <= 5 && sec > 0 && !done && !isPresenter(v)) audio.tick(); S.lastSec = sec; }
    if (map) paintHighlight();
  }

  function credit(it) {
    const box = $('#rv-credit');
    const parts = [it.author, it.license].filter(x => typeof x === 'string' && x.trim()).map(x => x.trim());
    box.replaceChildren(document.createTextNode('Fotoğraf: ' + (parts.length ? parts.join(' · ') + ' · ' : '')));
    if (typeof it.source === 'string' && /^https:\/\//.test(it.source)) {
      const a = el('a', '', 'Wikimedia Commons');
      a.href = it.source;
      a.target = '_blank';
      a.rel = 'noopener';
      box.append(a);
    } else box.append(document.createTextNode('Wikimedia Commons'));
  }

  function renderReveal(v) {
    const R = v.reveal;
    $('#reveal').hidden = !R;
    if (!R) return;
    const host = S.myId === v.hostId;
    const mode = modeOf(v);
    const pool = viewPool(v);
    const key = v.gameNo + ':' + R.round;
    if (S.revealKey !== key) {
      S.revealKey = key;
      const it = R.item || {};
      setText($('#rv-round'), v.rounds ? `Tur ${R.round}/${v.rounds}` : `Tur ${R.round}`);
      setText($('#rv-title'), it.title || '');
      setText($('#rv-label'), pool.revealLabel);
      setText($('#rv-province'), it.province || '');
      const desc = $('#rv-desc');
      desc.hidden = !it.description;
      setText(desc, it.description || '');
      const flavour = $('#rv-flavour');
      const line = FLAVOUR[it.kind] || '';
      flavour.hidden = !line;
      setText(flavour, line);
      const img = $('#rv-img');
      img.src = gameUrl(it.file, pool);
      img.alt = it.title || '';
      credit(it);
      const mineRow = $('#rv-mine');
      const myPin = R.pins.find(x => x.pid === S.myId);
      const mine = me(v);
      let text = '';
      if (myPin && mode.scoring === 'streak') text = myPin.hit ? `Doğru! Seri: ${v.streak}` : `Iska, seri ${v.streak} turda bitti`;
      else if (myPin && mode.scoring === 'none') text = `Sen: ${fmtKm(myPin.km)} · ${triesText(myPin, mode)}`;
      else if (myPin) text = `Sen: ${fmtKm(myPin.km)} · +${fmt(myPin.points)} puan`;
      else if (mine && !mine.spectator) text = 'Bu tur tahmin yapmadın';
      setText(mineRow, text);
      mineRow.classList.toggle('none', !myPin || (mode.scoring === 'streak' && !myPin.hit));
      drawReveal(v);
      // Load the next photo now, so the next round starts with it on screen.
      if (v.next) { const pre = new Image(); pre.src = gameUrl(v.next.file, pool); }
    }
    const pinOf = new Map(R.pins.map(x => [x.pid, x]));
    const badges = R.badges || {};
    const rows = v.players.filter(p => !p.spectator).map(p => ({ p, pin: pinOf.get(p.id) || null }))
      .sort((a, b) => (b.pin ? b.pin.points : -1) - (a.pin ? a.pin.points : -1) || b.p.score - a.p.score);
    syncList($('#rv-results'), rows, r => r.p.id, () => {
      const li = el('li', 'result');
      li.append(el('span', 'pos'), avatar(null, 'sm'), el('div', 'who'), el('span', 'bdg'), el('div', 'pts'));
      li.querySelector('.who').append(el('b'), el('small'));
      li.querySelector('.pts').append(el('b'), el('small'));
      return li;
    }, (li, r) => {
      const i = rows.indexOf(r);
      setText(li.querySelector('.pos'), String(i + 1));
      paintAvatar(li.querySelector('.avatar'), r.p.look);
      setText(li.querySelector('.who b'), r.p.name + (r.p.id === S.myId ? ' (sen)' : ''));
      const detail = r.pin ? fmtKm(r.pin.km) + (r.pin.province ? ' · ' + r.pin.province : '') + ' · ' + triesText(r.pin, mode) : 'Tahmin yok';
      setText(li.querySelector('.who small'), detail + (r.p.takeover ? ' · bot oynadı' : ''));
      const mine = (badges[r.p.id] || []).map(id => HK.BADGES[id]).filter(Boolean);
      const bdg = li.querySelector('.bdg');
      setText(bdg, mine.map(b => b.icon).join(''));
      bdg.title = mine.map(b => b.label).join(', ');
      bdg.setAttribute('aria-label', bdg.title);
      setText(li.querySelector('.pts b'), mode.scoring === 'none' ? '' : r.pin ? '+' + fmt(r.pin.points) : '0');
      setText(li.querySelector('.pts small'), mode.scoring === 'none' ? '' : 'Toplam ' + fmt(r.p.score));
      li.classList.toggle('me', r.p.id === S.myId);
      li.classList.toggle('nopin', !r.pin);
      li.classList.toggle('takeover', !!r.p.takeover);
    });
    const btn = $('#btn-next');
    if (v.phase === 'reveal') {
      const last = !!v.last;
      const secs = Math.max(0, Math.ceil(v.timeLeft));
      const auto = v.revealTime > 0;
      setText($('#rv-count'), !auto ? '' : host ? `${secs} sn sonra kendiliğinden geçer` : last ? `Sonuçlar ${secs} sn içinde` : `Sonraki tur ${secs} sn içinde başlıyor`);
      btn.hidden = !host;
      btn.classList.toggle('big', isPresenter(v));
      setText(btn, last ? 'Sonuçları gör' : mode.scoring === 'none' ? 'Sonraki' : 'Sonraki tur');
    } else {
      setText($('#rv-count'), '');
      btn.hidden = true;
    }
  }

  function drawReveal(v) {
    if (!map) return;
    const R = v.reveal;
    myLayer.clearLayers();
    triesLayer.clearLayers();
    S.myMarker = null;
    S.myMarkerSig = '';
    revealLayer.clearLayers();
    const it = R.item;
    const truth = [it.lat, it.lng];
    const points = [truth];
    const pool = viewPool(v);
    for (const pin of R.pins) {
      const p = v.players.find(x => x.id === pin.pid);
      const name = p ? p.name : '?';
      const color = colorOf(p && p.look);
      const mine = pin.pid === S.myId;
      L.polyline([[pin.lat, pin.lng], truth], { color, weight: mine ? 3 : 2, opacity: 0.85, dashArray: '6 6', interactive: false }).addTo(revealLayer);
      L.marker([pin.lat, pin.lng], { icon: pinIcon(name, color, { mine }), keyboard: false, zIndexOffset: mine ? 400 : 0 })
        .bindTooltip(tipEl(`${name}: ${fmtKm(pin.km)} · ${fmt(pin.points)} puan`), { direction: 'top' })
        .addTo(revealLayer);
      points.push([pin.lat, pin.lng]);
    }
    // Only this player's own earlier attempts, faint, for the story of the round.
    const own = v.mine && Array.isArray(v.mine.attempts) ? v.mine.attempts : [];
    if (own.length > 1) drawTrail(revealLayer, own, own.length - 1);
    L.marker(truth, { icon: truthIcon(), keyboard: false, zIndexOffset: 1000 })
      .bindTooltip(tipEl(`${pool.revealLabel}: ${it.title || ''}`), { direction: 'top' })
      .addTo(revealLayer);
    // The play-area limit would pan the framed reveal away from pins near its edge; it is back for the next guess.
    map.setMaxBounds(null);
    map.invalidateSize({ pan: false });
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 8, animate: false });
    setHover('');
  }

  /* ------------------------------------------------------------ end */
  /** The Günün Oyunu result to paste: date, score, stars and one square per round. */
  function shareText(v, mine) {
    const pool = viewPool(v);
    const mode = modeOf(v);
    const scale = pool.scoreScaleKm / 200;
    const byRegion = ['region', 'streak'].includes(mode.scoring);
    const perRound = mode.scoring === 'region' ? 1000 : HK.MAX_POINTS + (pool.provinceBonus > 0 ? pool.provinceBonus : 0);
    const stars = Math.max(0, Math.min(5, Math.round((mine.score / (perRound * Math.max(1, mine.rounds.length))) * 5)));
    const marks = mine.kms.map((km, i) => (byRegion ? (mine.hits[i] ? '✅' : '❌')
      : km == null ? '🟥' : km <= 50 * scale ? '🟩' : km <= 250 * scale ? '🟨' : km <= 600 * scale ? '🟧' : '🟥'));
    const parts = [GAME.title, fmtDay(v.day)];
    if (pool !== POOLS[0]) parts.push(pool.label);
    parts.push(fmt(mine.score) + ' puan', '⭐'.repeat(stars) + '☆'.repeat(5 - stars));
    if (S.replay) parts.push('tekrar');
    return parts.join(' · ') + '\n' + marks.join('');
  }
  async function copyShare() {
    const box = $('#share-text');
    try {
      await navigator.clipboard.writeText(box.value);
      toast('Sonuç kopyalandı.', 'ok');
    } catch {
      // Clipboard access can be denied: select the text so it can be copied by hand.
      box.focus();
      box.select();
      toast('Kopyalanamadı. Metni seçtim, elle kopyalayabilirsin.', 'warn');
    }
  }

  function renderEnd(v) {
    const st = v.standings || [];
    const host = S.myId === v.hostId;
    const mode = modeOf(v);
    const pool = viewPool(v);
    $('#btn-again').hidden = !host;
    $('#end-wait').hidden = host;
    const key = v.gameNo + '|' + st.map(r => r.id + ':' + r.score).join();
    if (S.endKey === key) return;
    S.endKey = key;
    const top = st[0];
    const mine = st.find(r => r.id === S.myId);
    const many = st.length > 1;
    const label = modeLabel(mode, pool);
    let title = !top ? 'Oyun bitti' : top.id === S.myId ? 'Tebrikler, kazandın!' : `Kazanan: ${top.name}`;
    let sub = mine ? `${mine.rank}. oldun · ${fmt(mine.score)} puan` : `${GAME.title} bitti.`;
    if (v.solo && mine) {
      if (mode.scoring === 'streak') { title = 'Seri bitti'; sub = `Serin: ${mine.score} · En iyi serin: ${S.best}` + (S.record ? ' · Yeni rekor!' : ''); }
      else if (mode.scoring === 'none') { title = `${label} bitti`; sub = `${mine.rounds.length} yer gezdin.`; }
      else if (mode.daily) { title = `${label} · ${fmtDay(v.day)}`; sub = `${fmt(mine.score)} puan` + (S.replay ? ' · tekrar' : ''); }
      else if (!many) { title = `${label} bitti`; sub = `${fmt(mine.score)} puan`; }
    }
    setText($('#end-title'), title);
    setText($('#end-sub'), sub);
    const places = [[st[1], 2], [st[0], 1], [st[2], 3]];
    $('#podium').hidden = !many;
    $('#podium').replaceChildren(...places.map(([r, n]) => {
      const d = el('div', 'place p' + n);
      if (!r) return d;
      d.append(avatar(r.look, 'lg'), el('b', '', r.name + (r.id === S.myId ? ' (sen)' : '')), el('span', '', fmt(r.score) + ' puan'), el('div', 'block', String(r.rank)));
      return d;
    }));
    $('#end-rank-h').hidden = !many;
    $('#end-rank').hidden = !many;
    $('#end-rank').replaceChildren(...st.map(r => {
      const li = el('li', r.id === S.myId ? 'me' : '');
      const who = el('div', 'who');
      who.append(el('b', '', r.name + (r.id === S.myId ? ' (sen)' : '') + (r.bot ? ' · bot' : '')), el('small', '', r.rounds.map(x => (x == null ? '-' : fmt(x))).join(' · ')));
      const earned = (r.badges || []).map(id => HK.BADGES[id]).filter(Boolean);
      if (earned.length) {
        const row = el('span', 'end-badges');
        row.append(...earned.map(b => el('span', 'tag', b.icon + ' ' + b.label)));
        who.append(row);
      }
      li.append(el('span', 'pos', String(r.rank)), avatar(r.look, 'sm'), who, el('span', 'pts', fmt(r.score)));
      return li;
    }));
    // Solo: one row per round with the answer, the distance and the points.
    const showRounds = !!(v.solo && mine);
    $('#end-rounds-h').hidden = !showRounds;
    $('#end-rounds').hidden = !showRounds;
    $('#end-rounds').replaceChildren(...(showRounds ? mine.rounds.map((points, i) => {
      const h = (v.history || [])[i] || {};
      const li = el('li');
      const who = el('div', 'who');
      const mark = ['region', 'streak'].includes(mode.scoring) ? (mine.hits[i] ? '✅ ' : '❌ ') : '';
      who.append(el('b', '', h.title || ''), el('small', '', mark + (h.province || '')));
      li.append(el('span', 'pos', String(i + 1)), who, el('span', 'km', mine.kms[i] == null ? 'Tahmin yok' : fmtKm(mine.kms[i])), el('span', 'pts', mode.scoring === 'none' ? '' : fmt(points)));
      return li;
    }) : []));
    const share = $('#end-share');
    share.hidden = !(v.solo && mine && mode.daily);
    if (!share.hidden) $('#share-text').value = shareText(v, mine);
    const lvl = levelOf(career.xp);
    setText($('#end-xp'), mine && mode.scoring !== 'none' ? `+${fmt(S.lastXp)} kariyer puanı · Seviye ${lvl}, ${TITLES[lvl - 1]}` + (S.promo ? ` · Terfi! Artık ${S.promo} oldun.` : '') : '');
  }

  /* ------------------------------------------------------------ static UI wiring */
  function buildStatic() {
    document.title = GAME.title;
    setText($('#home-title'), GAME.title);
    setText($('#home-lead'), GAME.tagline);
    const steps = [
      ['Fotoğrafa iyi bak.', ' İpuçları her yerde saklı. Yakınlaştırmak için fotoğrafa tıkla.'],
      ['Haritada yerini işaretle.', ' Köşedeki harita üzerine gelince büyür. Onaylayana kadar iğneni istediğin kadar taşıyabilirsin.'],
      ['Üç hakkın var.', ' Iskalarsan pusula yönü, yaklaşık uzaklığı ve bir ipucunu gösterir. Sonraki denemeler daha az puan getirir.'],
      ['Yakınlık puan getirir.', ` Tam isabet ${fmt(HK.MAX_POINTS)} puan, uzaklaştıkça azalır.` + (GAME.provinceBonus > 0 ? ` İli tutturana +${fmt(GAME.provinceBonus)} puan.` : '')],
      ['Tek başına ya da ekiple.', ' Oyun türünü seç; odada en çok puanı toplayan kazanır, boş koltuklara bot oturtabilirsin.']
    ];
    $('#howto-list').replaceChildren(...steps.map(([b, t]) => { const li = el('li'); li.append(el('b', '', b), document.createTextNode(t)); return li; }));

    const nameIn = $('#in-name');
    nameIn.value = profile.name;
    renderCareer();
    buildSwatches();
    previewLook();
    renderSolo();
    const codeIn = $('#in-code');
    codeIn.addEventListener('input', () => {
      const clean = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
      if (codeIn.value !== clean) codeIn.value = clean;
    });
    const fromUrl = (new URLSearchParams(location.search).get('oda') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    const joinMode = on => {
      $('.home-card').classList.toggle('joining', on);
      $('#invite').hidden = !on;
      $('#solo-block').hidden = on;   // an invited player came to join; solo play is one click away below
      $('#btn-create').hidden = on;
      $('#btn-create-alt').hidden = !on;
      setText($('#join-label'), on ? 'Oda kodu' : 'Ya da bir odaya katıl');
      $('#btn-join').classList.toggle('primary', on);
      setText($('#btn-join'), on ? 'Odaya katıl' : 'Katıl');
    };
    if (fromUrl) {
      codeIn.value = fromUrl;
      setText($('#invite-code'), fromUrl);
      joinMode(true);
      (profile.name ? $('#btn-join') : nameIn).focus();
    }
    $('#btn-create-alt').addEventListener('click', () => { joinMode(false); codeIn.value = ''; history.replaceState(null, '', location.pathname); });

    $('#btn-create').addEventListener('click', hostStart);
    $('#join-form').addEventListener('submit', e => {
      e.preventDefault();
      const code = codeIn.value.trim();
      if (code.length !== 5) { homeMsg('Oda kodu 5 karakter olmalı.', 'error'); codeIn.focus(); return; }
      guestStart(code);
    });
    $('#btn-solo-start').addEventListener('click', () => { if (solo.mode) soloStart(solo.mode); });
    $('#btn-solo-cancel').addEventListener('click', () => { solo.mode = null; renderSolo(); });
    $('#btn-copy').addEventListener('click', copyInvite);
    for (const b of document.querySelectorAll('#bot-controls button')) b.addEventListener('click', () => intent({ t: 'addBot', level: b.dataset.bot }));
    $('#set-presenter').addEventListener('change', e => intent({ t: 'settings', presenter: e.target.checked }));
    $('#btn-start').addEventListener('click', () => intent({ t: 'start' }));
    const askLeave = text => {
      const others = S.view && S.view.players.some(p => !p.bot && p.id !== S.myId);
      if (S.role === 'host' && others && !window.confirm(text)) return;
      leave();
    };
    $('#btn-leave').addEventListener('click', () => askLeave('Odayı kapatırsan herkes çıkar. Emin misin?'));
    $('#btn-quit').addEventListener('click', () => askLeave('Odadan çıkarsan oda kapanır ve herkes çıkar. Emin misin?'));
    $('#btn-home').addEventListener('click', () => askLeave('Ana sayfaya dönersen oda kapanır. Emin misin?'));
    $('#btn-guess').addEventListener('click', confirmGuess);
    $('#btn-next').addEventListener('click', () => intent({ t: 'next' }));
    $('#btn-again').addEventListener('click', () => { if (S.solo) soloAgain(); else intent({ t: 'again' }); });
    $('#btn-share').addEventListener('click', copyShare);
    const sizeBtn = $('#btn-map-size');
    sizeBtn.addEventListener('click', () => {
      const big = !$('#mapbox').classList.contains('big');
      $('#mapbox').classList.toggle('big', big);
      sizeBtn.setAttribute('aria-pressed', String(big));
      sizeBtn.title = big ? 'Haritayı küçült' : 'Haritayı büyüt';
    });
    wireStage();

    const mute = $('#btn-mute');
    const paintMute = () => {
      mute.textContent = audio.muted ? '🔇' : '🔊';
      mute.title = audio.muted ? 'Sesi aç' : 'Sesi kapat';
      mute.setAttribute('aria-pressed', String(audio.muted));
    };
    paintMute();
    mute.addEventListener('click', () => {
      audio.muted = !audio.muted;
      save('localStorage', 'tg.mute', audio.muted ? '1' : '0');
      paintMute();
    });

    // Space or Enter confirms the pin, like the big button.
    document.addEventListener('keydown', e => {
      const v = S.view;
      if (!v || v.phase !== 'guess' || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.target.closest('input, textarea, select, button, a')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); confirmGuess(); }
    });

    window.addEventListener('pagehide', () => {
      if (S.role === 'host' && S.link) S.link.broadcast({ t: 'bye' });
    });

    // Test hooks, only on this machine: the region lookup of the current pool, the view and the map state.
    if (LOCAL) {
      window.hk = {
        provinceAt: (lat, lng) => provinceAt(lat, lng, activePool().id), view: () => S.view, role: () => S.role, debugRoundTime,
        pool: () => activePool().id, minZoom: () => (map ? map.getMinZoom() : null),
        // The page coordinates of a map position, so a test can click a known spot (e.g. open sea for a sure miss).
        mapPoint: (lat, lng) => {
          if (!map) return null;
          const r = map.getContainer().getBoundingClientRect();
          const p = map.latLngToContainerPoint([lat, lng]);
          return { x: r.left + p.x, y: r.top + p.y };
        }
      };
    }
  }

  buildStatic();
  loadGeo(DECOR_POOL);
})();
