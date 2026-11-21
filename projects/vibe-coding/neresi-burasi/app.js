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
  const KEY = 'tg.' + GAME.id + '.';   // client id and career are per game; name and look are shared by the games of this site
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // ?sure=12 shortens the rounds of a room opened on this machine, for testing only.
  const debugRoundTime = LOCAL ? Math.max(0, Math.min(600, Math.round(Number(new URLSearchParams(location.search).get('sure')) || 0))) : 0;

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

  /* Career: experience points gathered over games, stored in this browser only (one point per 100 game points). */
  const TITLES = ['Çaylak', 'Meraklı', 'Gezgin', 'Kaşif', 'Uzman', 'Usta', 'Efsane'];
  const career = { xp: Math.max(0, Number(load('localStorage', KEY + 'xp')) || 0) };
  const levelOf = xp => Math.min(TITLES.length, 1 + Math.floor(Math.sqrt(xp / 120)));
  const xpForLevel = lvl => (lvl - 1) * (lvl - 1) * 120;

  const S = {
    role: null, link: null, room: null, myId: null, view: null,
    conns: new Map(), seen: new Map(), dirty: false, lastSend: 0, stopTicker: null, timers: [],
    seenNotice: 0, lastState: 0, endKey: '', offline: false, reconnecting: false,
    items: null, pin: null, roundKey: '', sentKey: '', revealKey: '', myMarker: null, myMarkerSig: '', lastSec: -1, lastXp: 0, promo: '', hover: '', hl: ''
  };

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
  /** Only plain relative paths inside game/ are loaded; anything else from a snapshot is ignored. */
  const gameUrl = file => (typeof file === 'string' && /^[A-Za-z0-9_\-./]+$/.test(file) && !file.includes('..') && !file.startsWith('/') ? 'game/' + file : '');

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
    for (const b of [$('#btn-create'), $('#btn-join')]) b.disabled = busy;
  }

  function leave(reason) {
    if (S.role === 'host' && S.link) S.link.broadcast({ t: 'bye' });
    if (S.stopTicker) S.stopTicker();
    S.timers.forEach(clearInterval);
    const link = S.link;
    Object.assign(S, { role: null, link: null, room: null, myId: null, view: null, conns: new Map(), seen: new Map(), dirty: false, stopTicker: null, timers: [], seenNotice: 0, endKey: '', offline: false, reconnecting: false, pin: null, roundKey: '', sentKey: '', revealKey: '', lastSec: -1 });
    if (link) setTimeout(() => link.close(), 150);
    clearMapLayers();
    $('#end').hidden = true;
    document.body.classList.remove('in-game');
    show('home');
    setBusy(false);
    homeMsg(reason || '', reason ? 'error' : '');
    history.replaceState(null, '', location.pathname);
  }

  /* ------------------------------------------------------------ provinces (GeoJSON) */
  const geo = { raw: null, features: null, loading: null };
  function loadGeo() {
    if (!geo.loading) {
      geo.loading = fetch('vendor/tr-provinces.json')
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(data => {
          geo.raw = data;
          geo.features = (data.features || []).map(f => {
            const g = f.geometry || {};
            const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
            const bbox = [Infinity, Infinity, -Infinity, -Infinity];
            for (const poly of polys) for (const [x, y] of poly[0]) { bbox[0] = Math.min(bbox[0], x); bbox[1] = Math.min(bbox[1], y); bbox[2] = Math.max(bbox[2], x); bbox[3] = Math.max(bbox[3], y); }
            return { name: String((f.properties && f.properties.name) || ''), polys, bbox };
          });
          addProvinceLayer();
          drawDecor();
          return true;
        })
        .catch(err => {
          geo.loading = null;
          toast('İl sınırları yüklenemedi: ' + err.message, 'warn');
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
  /** The province under a point, '' at sea, abroad or before the GeoJSON has loaded. */
  function provinceAt(lat, lng) {
    if (!geo.features || !Number.isFinite(lat) || !Number.isFinite(lng)) return '';
    for (const f of geo.features) {
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
    if (!cv || !geo.features || document.body.classList.contains('in-game')) return;
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
    geo.features.forEach((f, i) => {
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
  let revealLayer = null;
  let provLayer = null;
  const provByName = new Map();
  const PROV_STYLE = { color: '#2a6f97', weight: 0.7, opacity: 0.4, fill: false };
  const PROV_HL = { color: '#b5482a', weight: 1.8, opacity: 0.9, fill: true, fillColor: '#b5482a', fillOpacity: 0.1 };
  const playBounds = () => L.latLngBounds([HK.BOUNDS.latMin, HK.BOUNDS.lngMin], [HK.BOUNDS.latMax, HK.BOUNDS.lngMax]);

  function ensureMap() {
    if (map || typeof L === 'undefined') return;
    map = L.map($('#map'), {
      minZoom: 4, maxZoom: 13, maxBounds: playBounds(), maxBoundsViscosity: 1, zoomSnap: 0.25, zoomDelta: 0.5,
      wheelPxPerZoomLevel: 80, worldCopyJump: false, boxZoom: false
    });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıcıları · İl sınırları: <a href="https://www.geoboundaries.org/" target="_blank" rel="noopener">geoBoundaries</a>'
    }).addTo(map);
    myLayer = L.layerGroup().addTo(map);
    revealLayer = L.layerGroup().addTo(map);
    map.fitBounds(playBounds(), { animate: false });
    map.on('click', onMapClick);
    let hoverQueued = null;
    map.on('mousemove', e => {
      if (hoverQueued) { hoverQueued = e.latlng; return; }
      hoverQueued = e.latlng;
      requestAnimationFrame(() => { const ll = hoverQueued; hoverQueued = null; setHover(provinceAt(ll.lat, ll.lng)); });
    });
    map.on('mouseout', () => setHover(''));
    addProvinceLayer();
    // The inset grows on hover; Leaflet must learn its new size or clicks land on the wrong spot. Until the player
    // zooms or pans on purpose, every resize re-fits Turkey, otherwise the big map shows half the Middle East.
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
  function addProvinceLayer() {
    if (!map || provLayer || !geo.raw) return;
    provLayer = L.geoJSON(geo.raw, { renderer: L.canvas({ padding: 0.3 }), interactive: false, style: () => Object.assign({}, PROV_STYLE) });
    provLayer.eachLayer(layer => provByName.set(layer.feature.properties.name, layer));
    provLayer.addTo(map);
    S.hl = '';
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
    if (v.phase === 'guess') highlightProvince(S.hover || (v.mine ? v.mine.province : S.pin ? S.pin.province : ''));
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
    if (revealLayer) revealLayer.clearLayers();
    S.myMarker = null;
    S.myMarkerSig = '';
    if (map) setHover('');
  }
  function placePin(lat, lng) {
    const v = S.view;
    if (!v || v.phase !== 'guess' || v.mine) return false;
    if (!HK.inBounds(lat, lng)) { toast('Bu nokta oyun alanının dışında. Türkiye üzerinde bir yer seç.', 'warn'); return false; }
    S.pin = { lat, lng, province: provinceAt(lat, lng) };
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
  function setPhoto(file) {
    const url = gameUrl(file);
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

  /** Each player gets a snapshot of their own: before the reveal it holds only their own pin. */
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

  async function loadManifest() {
    if (S.items) return S.items;
    const res = await fetch('game/manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const items = (data && Array.isArray(data.items) ? data.items : []).filter(it => it && typeof it.file === 'string' && Number.isFinite(it.lat) && Number.isFinite(it.lng));
    if (!items.length) throw new Error('liste boş');
    S.items = items;
    return items;
  }

  async function hostStart() {
    if (!checkName()) return;
    setBusy(true);
    homeMsg('Fotoğraflar hazırlanıyor…');
    let items;
    try {
      [items] = await Promise.all([loadManifest(), loadGeo()]);
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
    S.room = HK.createRoom(link ? code : '', cid, crypto.getRandomValues(new Uint32Array(1))[0] | 0, items, {
      scoreScaleKm: GAME.scoreScaleKm, provinceBonus: GAME.provinceBonus, provinceAt: (lat, lng) => provinceAt(lat, lng), debugRoundTime
    });
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
    loadGeo();
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
    if (!S.pin || !v || v.phase !== 'guess' || v.mine || S.sentKey === S.roundKey) return;
    S.sentKey = S.roundKey;
    intent({ t: 'guess', lat: S.pin.lat, lng: S.pin.lng, province: S.pin.province || '' });
    audio.ok();
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
    const url = location.origin + location.pathname + '?oda=' + S.view.code;
    try {
      await navigator.clipboard.writeText(url);
      toast('Davet linki kopyalandı. Ekibe gönder!', 'ok');
    } catch {
      // Clipboard access can be denied (no permission or an insecure context): show the link to copy by hand.
      window.prompt('Davet linkini kopyala:', url);
    }
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
    if (prev.phase === 'lobby' && v.phase === 'guess') audio.start();
    if (prev.phase === 'guess' && v.phase === 'reveal') {
      audio.gong();
      const mine = me(v);
      if (mine && v.reveal && v.reveal.pins.some(x => x.pid === S.myId)) toast(`+${fmt(mine.lastPoints)} puan`, 'ok');
    }
    if (prev.phase !== 'end' && v.phase === 'end') {
      audio.fanfare();
      const mine = me(v);
      S.lastXp = mine ? Math.round(mine.score / 100) : 0;
      // The end card has the whole story; toasts from the last round would only cover its title.
      $('#toasts').replaceChildren();
      S.promo = earnXp(S.lastXp, true);
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
    const full = v.players.length >= v.max;
    setText($('#lobby-code'), v.code || 'YEREL');
    $('#btn-copy').hidden = !v.code;
    setText($('#lobby-count'), `${v.players.length}/${v.max}`);
    const seats = v.players.map(p => ({ p }));
    for (let i = v.players.length; i < v.max; i++) seats.push({ empty: i });
    syncList($('#lobby-players'), seats, s => (s.p ? s.p.id : 'empty' + s.empty), s => {
      const li = el('li', 'seat' + (s.p ? '' : ' seat-free'));
      if (!s.p) { li.textContent = 'Boş koltuk'; return li; }
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
      if (!s.p) return;
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
    $('#bot-controls').hidden = !host;
    for (const b of document.querySelectorAll('#bot-controls button')) b.disabled = full;
    setText($('#set-rounds'), `${HK.ROUNDS} tur, her turda bir fotoğraf`);
    renderSeg($('#set-time'), HK.ROUND_TIMES.map(d => [String(d), TIME_LABELS[d] || d + ' sn']), String(v.settings.roundTime), host, val => intent({ t: 'settings', roundTime: Number(val) }));
    $('#btn-start').hidden = !host;
    $('#lobby-wait').hidden = host;
    setText($('#btn-leave'), host ? 'Odayı kapat' : 'Odadan çık');
  }

  function renderSeg(box, options, current, enabled, onPick) {
    if (box.childElementCount !== options.length) {
      box.replaceChildren(...options.map(([val, label]) => {
        const b = el('button', '', label);
        b.type = 'button';
        b.dataset.val = val;
        b.setAttribute('role', 'radio');
        b.addEventListener('click', () => onPick(val));
        return b;
      }));
    }
    for (const b of box.children) {
      b.setAttribute('aria-checked', String(b.dataset.val === current));
      b.disabled = !enabled;
    }
  }

  /* ------------------------------------------------------------ game */
  function renderGame(v) {
    const game = $('#screen-game');
    const layout = v.phase === 'guess' ? 'guess' : 'reveal';
    ensureMap();
    if (game.dataset.phase !== layout) {
      game.dataset.phase = layout;
      if (map) map.invalidateSize({ pan: false });
    }
    setText($('#hud-round'), `Tur ${v.round}/${v.rounds}`);
    setText($('#hud-question'), v.phase === 'guess' ? GAME.question : v.phase === 'reveal' ? GAME.title + ' · sonuçlar' : 'Oyun bitti');
    renderChips(v);
    if (v.phase === 'guess') { $('#reveal').hidden = true; renderGuess(v); } else renderReveal(v);
  }

  function renderChips(v) {
    syncList($('#chips'), v.players, p => p.id, p => {
      const li = el('li', 'chip');
      li.append(avatar(p.look, 'sm'), el('span', 'who'));
      li.querySelector('.who').append(el('b'), el('small'));
      return li;
    }, (li, p) => {
      paintAvatar(li.querySelector('.avatar'), p.look);
      setText(li.querySelector('.who b'), p.name + (p.id === S.myId ? ' (sen)' : ''));
      const state = p.guessed ? 'Tahmin etti ✓' : p.takeover ? 'Koptu, bot oynuyor' : !p.online ? 'Bağlantı yok' : p.bot ? 'Bot düşünüyor' : 'Düşünüyor…';
      setText(li.querySelector('.who small'), state);
      li.classList.toggle('guessed', p.guessed);
      li.classList.toggle('me', p.id === S.myId);
      li.classList.toggle('bot', p.bot);
      li.classList.toggle('takeover', !!p.takeover);
      li.classList.toggle('offline', !p.online);
    });
  }

  function renderGuess(v) {
    const key = v.gameNo + ':' + v.round;
    if (S.roundKey !== key) {
      S.roundKey = key;
      S.pin = null;
      S.sentKey = '';
      S.revealKey = '';
      S.lastSec = -1;
      clearMapLayers();
      if (v.photo) setPhoto(v.photo.file);
      mapTouched = false;
      if (map) { map.invalidateSize({ pan: false }); map.setMaxBounds(playBounds()); map.fitBounds(playBounds(), { animate: false }); }
    }
    const locked = !!v.mine;
    setMyMarker(locked ? v.mine : S.pin, locked);
    const sending = !locked && S.sentKey === key;
    const btn = $('#btn-guess');
    btn.disabled = locked || sending || !S.pin;
    setText(btn, locked ? 'Tahmin edildi' : sending ? 'Gönderiliyor…' : 'Tahmin et');
    const where = locked ? v.mine.province : S.pin ? S.pin.province : '';
    setText($('#guess-info'), locked ? 'Tahminin alındı. Diğerleri bekleniyor…'
      : S.pin ? (where ? `İğne: ${where}. Taşıyabilir ya da onaylayabilirsin.` : 'İğne yerinde. Taşıyabilir ya da onaylayabilirsin.')
        : 'Haritada tahmin ettiğin yere tıkla.');
    const timer = $('#hud-timer');
    setText(timer, mmss(v.timeLeft));
    timer.classList.toggle('warn', v.timeLeft <= 30 && v.timeLeft > 10);
    timer.classList.toggle('danger', v.timeLeft <= 10);
    const sec = Math.ceil(v.timeLeft);
    if (sec !== S.lastSec) { if (S.lastSec > 0 && sec <= 5 && sec > 0 && !locked) audio.tick(); S.lastSec = sec; }
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
    const key = v.gameNo + ':' + R.round;
    if (S.revealKey !== key) {
      S.revealKey = key;
      const it = R.item || {};
      setText($('#rv-round'), `Tur ${R.round}/${v.rounds}`);
      setText($('#rv-title'), it.title || '');
      setText($('#rv-label'), GAME.revealLabel);
      setText($('#rv-province'), it.province || '');
      const desc = $('#rv-desc');
      desc.hidden = !it.description;
      setText(desc, it.description || '');
      const img = $('#rv-img');
      img.src = gameUrl(it.file);
      img.alt = it.title || '';
      credit(it);
      const mineRow = $('#rv-mine');
      const myPin = R.pins.find(x => x.pid === S.myId);
      setText(mineRow, myPin ? `Sen: ${fmtKm(myPin.km)} · +${fmt(myPin.points)} puan` : (me(v) ? 'Bu tur tahmin yapmadın' : ''));
      mineRow.classList.toggle('none', !myPin);
      drawReveal(v);
      // Load the next photo now, so the next round starts with it on screen.
      if (v.next) { const pre = new Image(); pre.src = gameUrl(v.next.file); }
    }
    const pinOf = new Map(R.pins.map(x => [x.pid, x]));
    const rows = v.players.map(p => ({ p, pin: pinOf.get(p.id) || null }))
      .sort((a, b) => (b.pin ? b.pin.points : -1) - (a.pin ? a.pin.points : -1) || b.p.score - a.p.score);
    syncList($('#rv-results'), rows, r => r.p.id, () => {
      const li = el('li', 'result');
      li.append(el('span', 'pos'), avatar(null, 'sm'), el('div', 'who'), el('div', 'pts'));
      li.querySelector('.who').append(el('b'), el('small'));
      li.querySelector('.pts').append(el('b'), el('small'));
      return li;
    }, (li, r) => {
      const i = rows.indexOf(r);
      setText(li.querySelector('.pos'), String(i + 1));
      paintAvatar(li.querySelector('.avatar'), r.p.look);
      setText(li.querySelector('.who b'), r.p.name + (r.p.id === S.myId ? ' (sen)' : ''));
      const detail = r.pin ? fmtKm(r.pin.km) + (r.pin.province ? ' · ' + r.pin.province : '') : 'Tahmin yok';
      setText(li.querySelector('.who small'), detail + (r.p.takeover ? ' · bot oynadı' : ''));
      setText(li.querySelector('.pts b'), r.pin ? '+' + fmt(r.pin.points) : '0');
      setText(li.querySelector('.pts small'), 'Toplam ' + fmt(r.p.score));
      li.classList.toggle('me', r.p.id === S.myId);
      li.classList.toggle('nopin', !r.pin);
      li.classList.toggle('takeover', !!r.p.takeover);
    });
    const btn = $('#btn-next');
    if (v.phase === 'reveal') {
      const last = v.round >= v.rounds;
      const secs = Math.max(0, Math.ceil(v.timeLeft));
      setText($('#rv-count'), host ? `${secs} sn sonra kendiliğinden geçer` : last ? `Sonuçlar ${secs} sn içinde` : `Sonraki tur ${secs} sn içinde başlıyor`);
      btn.hidden = !host;
      setText(btn, last ? 'Sonuçları gör' : 'Sonraki tur');
    } else {
      setText($('#rv-count'), '');
      btn.hidden = true;
    }
  }

  function drawReveal(v) {
    if (!map) return;
    const R = v.reveal;
    myLayer.clearLayers();
    S.myMarker = null;
    S.myMarkerSig = '';
    revealLayer.clearLayers();
    const it = R.item;
    const truth = [it.lat, it.lng];
    const points = [truth];
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
    L.marker(truth, { icon: truthIcon(), keyboard: false, zIndexOffset: 1000 })
      .bindTooltip(tipEl(`${GAME.revealLabel}: ${it.title || ''}`), { direction: 'top' })
      .addTo(revealLayer);
    // The play-area limit would pan the framed reveal away from pins near its edge; it is back for the next guess.
    map.setMaxBounds(null);
    map.invalidateSize({ pan: false });
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 8, animate: false });
    setHover('');
  }

  /* ------------------------------------------------------------ end */
  function renderEnd(v) {
    const st = v.standings || [];
    const host = S.myId === v.hostId;
    $('#btn-again').hidden = !host;
    $('#end-wait').hidden = host;
    const key = v.gameNo + '|' + st.map(r => r.id + ':' + r.score).join();
    if (S.endKey === key) return;
    S.endKey = key;
    const top = st[0];
    const mine = st.find(r => r.id === S.myId);
    setText($('#end-title'), !top ? 'Oyun bitti' : top.id === S.myId ? 'Tebrikler, kazandın!' : `Kazanan: ${top.name}`);
    setText($('#end-sub'), mine ? `${mine.rank}. oldun · ${fmt(mine.score)} puan` : `${GAME.title} bitti.`);
    const places = [[st[1], 2], [st[0], 1], [st[2], 3]];
    $('#podium').replaceChildren(...places.map(([r, n]) => {
      const d = el('div', 'place p' + n);
      if (!r) return d;
      d.append(avatar(r.look, 'lg'), el('b', '', r.name + (r.id === S.myId ? ' (sen)' : '')), el('span', '', fmt(r.score) + ' puan'), el('div', 'block', String(r.rank)));
      return d;
    }));
    $('#end-rank').replaceChildren(...st.map(r => {
      const li = el('li', r.id === S.myId ? 'me' : '');
      const who = el('div', 'who');
      who.append(el('b', '', r.name + (r.id === S.myId ? ' (sen)' : '') + (r.bot ? ' · bot' : '')), el('small', '', r.rounds.map(x => (x == null ? '-' : fmt(x))).join(' · ')));
      li.append(el('span', 'pos', String(r.rank)), avatar(r.look, 'sm'), who, el('span', 'pts', fmt(r.score)));
      return li;
    }));
    const lvl = levelOf(career.xp);
    setText($('#end-xp'), mine ? `+${fmt(S.lastXp)} kariyer puanı · Seviye ${lvl}, ${TITLES[lvl - 1]}` + (S.promo ? ` · Terfi! Artık ${S.promo} oldun.` : '') : '');
  }

  /* ------------------------------------------------------------ static UI wiring */
  function buildStatic() {
    document.title = GAME.title;
    setText($('#home-title'), GAME.title);
    setText($('#home-lead'), GAME.tagline);
    const steps = [
      ['Fotoğrafa iyi bak.', ' İpuçları her yerde saklı. Yakınlaştırmak için fotoğrafa tıkla.'],
      ['Haritada yerini işaretle.', ' Köşedeki harita üzerine gelince büyür. Onaylayana kadar iğneni istediğin kadar taşıyabilirsin.'],
      ['Tahmin et.', ' Herkes tahmin edince ya da süre bitince doğru yer açılır.'],
      ['Yakınlık puan getirir.', ` Tam isabet ${fmt(HK.MAX_POINTS)} puan, uzaklaştıkça azalır.` + (GAME.provinceBonus > 0 ? ` İli tutturana +${fmt(GAME.provinceBonus)} puan.` : '')],
      [`${HK.ROUNDS} tur sonunda`, ' en çok puanı toplayan kazanır. Boş koltuklara bot oturtabilirsin.']
    ];
    $('#howto-list').replaceChildren(...steps.map(([b, t]) => { const li = el('li'); li.append(el('b', '', b), document.createTextNode(t)); return li; }));

    const nameIn = $('#in-name');
    nameIn.value = profile.name;
    renderCareer();
    buildSwatches();
    previewLook();
    const codeIn = $('#in-code');
    codeIn.addEventListener('input', () => {
      const clean = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
      if (codeIn.value !== clean) codeIn.value = clean;
    });
    const fromUrl = (new URLSearchParams(location.search).get('oda') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    const joinMode = on => {
      $('.home-card').classList.toggle('joining', on);
      $('#invite').hidden = !on;
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
    $('#btn-copy').addEventListener('click', copyInvite);
    for (const b of document.querySelectorAll('#bot-controls button')) b.addEventListener('click', () => intent({ t: 'addBot', level: b.dataset.bot }));
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
    $('#btn-again').addEventListener('click', () => intent({ t: 'again' }));
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

    // Test hooks, only on this machine: the province lookup and the current view.
    if (LOCAL) window.hk = { provinceAt, view: () => S.view, role: () => S.role, debugRoundTime };
  }

  buildStatic();
  loadGeo();
})();
