/* berkayvuran.com extras: virtual apps (Terminal, Notes, Photos, Mail), Control Center, lock screen,
   context menu, Quick Look, dock magnification, service worker. Needs desk.js (window.Desk). */
(function () {
  'use strict';
  var D = window.Desk; if (!D) return;
  var body = document.body, root = document.documentElement;
  var lang = body.getAttribute('data-lang') || 'en', base = body.getAttribute('data-base') || '';
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function once(fn) { var done = false, val; return function () { if (!done) { done = true; val = fn.apply(this, arguments); } return val; }; }

  /* ---------- data (fetched once, on demand) ---------- */
  var dataP = null, ui = null;
  D.data = function () {
    if (!dataP) dataP = fetch(base + '/apps-' + lang + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { ui = d.ui; return d; }).catch(function (e) { dataP = null; throw e; });
    return dataP;
  };
  var warm = function () { D.data().catch(function () {}); };
  document.addEventListener('pointerover', function (e) { if (e.target.closest && e.target.closest('.dock, .icons, .mb-cc')) warm(); }, { once: true, passive: true });
  document.addEventListener('touchstart', warm, { once: true, passive: true });
  if ('requestIdleCallback' in window) requestIdleCallback(function () { if (D.wide.matches) warm(); }, { timeout: 6000 });

  /* ---------- sound (off by default, tiny WebAudio blips) ---------- */
  var vol = parseInt(store.get('sound') || '0', 10) || 0, actx = null;
  function blip(f1, f2, dur) {
    if (!vol) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol / 100 * 0.14), t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  document.addEventListener('desk:open', function () { blip(520, 820, 0.14); });
  document.addEventListener('desk:close', function () { blip(640, 360, 0.12); });

  /* ---------- display brightness (dim overlay) ---------- */
  var dim = el('div', 'dim'); dim.setAttribute('aria-hidden', 'true'); body.appendChild(dim);
  var bright = parseInt(store.get('bright') || '100', 10); if (!(bright >= 40 && bright <= 100)) bright = 100;
  function setBright(v) { bright = v; dim.style.opacity = String((100 - v) / 100); store.set('bright', String(v)); }
  setBright(bright);

  /* ---------- wallpapers ---------- */
  var WALLS = ['default', 'aurora', 'sunset', 'ocean'];
  function wall() { return root.getAttribute('data-wp') || 'default'; }
  function setWall(n) {
    if (WALLS.indexOf(n) < 0) return false;
    if (n === 'default') root.removeAttribute('data-wp'); else root.setAttribute('data-wp', n);
    store.set('wp', n); return true;
  }
  var THEME_ALIAS = { dark: 'dark', light: 'light', matrix: 'matrix', zap: 'high-contrast', 'high-contrast': 'high-contrast' };

  /* ---------- popover plumbing ---------- */
  var pops = [];
  function closeAll(except) { pops.forEach(function (p) { if (p !== except) p.close(); }); }

  /* ================= Control Center ================= */
  (function controlCenter() {
    var btn = document.querySelector('.mb-cc'); if (!btn) return;
    var pop = el('div', 'cc'); pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', btn.getAttribute('aria-label')); body.appendChild(pop);
    var built = false;
    function themes() { return Array.prototype.map.call(document.querySelectorAll('[data-theme-set]'), function (b) { return { id: b.getAttribute('data-theme-set'), e: b.getAttribute('data-emoji'), n: b.getAttribute('data-name') }; }); }
    function glassOn() { return root.getAttribute('data-glass') !== 'off'; }
    function paint() {
      var cur = root.getAttribute('data-theme');
      pop.querySelectorAll('[data-t]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-t') === cur ? 'true' : 'false'); });
      var g = pop.querySelector('[data-glass]'); if (g) g.setAttribute('aria-pressed', glassOn() ? 'true' : 'false');
      var w = pop.querySelector('[data-wall] small'); if (w) w.textContent = ui.walls[wall()];
      var s = pop.querySelector('[data-snd]'); if (s) s.setAttribute('aria-pressed', vol > 0 ? 'true' : 'false');
    }
    function build() {
      built = true;
      var t = themes().map(function (x) { return '<button type="button" data-t="' + x.id + '" aria-pressed="false"><span class="e" aria-hidden="true">' + x.e + '</span><span>' + x.n + '</span></button>'; }).join('');
      pop.innerHTML =
        '<p class="cc-h">' + ui.ccTheme + '</p><div class="cc-themes">' + t + '</div>' +
        '<div class="cc-tiles">' +
        '<button type="button" class="cc-tile" data-glass aria-pressed="true"><span class="ic">' + svgGlass + '</span><span class="tx"><b>' + ui.ccGlass + '</b></span></button>' +
        '<a class="cc-tile" data-lang href="#"><span class="ic">' + svgGlobe + '</span><span class="tx"><b>' + ui.ccLang + '</b><small>' + ui.otherShort + '</small></span></a>' +
        '<button type="button" class="cc-tile" data-wall><span class="ic">' + svgImage + '</span><span class="tx"><b>' + ui.ccWall + '</b><small></small></span></button>' +
        '<button type="button" class="cc-tile" data-lock><span class="ic">' + svgLock + '</span><span class="tx"><b>' + ui.ccLock + '</b></span></button>' +
        '</div>' +
        '<label class="cc-slider"><span><b>' + ui.ccBright + '</b></span><input type="range" min="40" max="100" step="1" data-bright aria-label="' + ui.ccBright + '"></label>' +
        '<label class="cc-slider"><span><b>' + ui.ccSound + '</b><button type="button" class="cc-mini" data-snd aria-pressed="false" aria-label="' + ui.ccSound + '">' + svgSound + '</button></span><input type="range" min="0" max="100" step="5" data-vol aria-label="' + ui.ccSound + '"></label>';
      pop.querySelector('[data-bright]').value = String(bright);
      pop.querySelector('[data-vol]').value = String(vol);
      pop.querySelector('[data-bright]').addEventListener('input', function (e) { setBright(+e.target.value); });
      pop.querySelector('[data-vol]').addEventListener('input', function (e) { vol = +e.target.value; store.set('sound', String(vol)); paint(); });
      pop.querySelector('[data-vol]').addEventListener('change', function () { blip(520, 820, 0.14); });
      pop.addEventListener('click', function (e) {
        e.stopPropagation();
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-t')) D.setTheme(b.getAttribute('data-t'));
        else if (b.hasAttribute('data-glass')) document.querySelector('[data-glass-toggle]').click();
        else if (b.hasAttribute('data-wall')) setWall(WALLS[(WALLS.indexOf(wall()) + 1) % WALLS.length]);
        else if (b.hasAttribute('data-lock')) { api.close(); showLock(true); return; }
        else if (b.hasAttribute('data-snd')) { vol = vol > 0 ? 0 : 50; store.set('sound', String(vol)); pop.querySelector('[data-vol]').value = String(vol); if (vol) blip(520, 820, 0.14); }
        paint();
      });
    }
    var api = {
      close: function () { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); },
      open: function () {
        D.data().then(function () {
          if (!built) build();
          closeAll(api); var ml = document.querySelector('.mb-lang'); pop.querySelector('[data-lang]').setAttribute('href', ml ? ml.getAttribute('href') : ui.other);
          pop.querySelector('[data-bright]').value = String(bright); paint();
          pop.hidden = false; btn.setAttribute('aria-expanded', 'true');
        }).catch(function () {});
      },
      isOpen: function () { return !pop.hidden; }
    };
    pops.push(api); D.cc = api;
    btn.addEventListener('click', function (e) { e.stopPropagation(); if (api.isOpen()) api.close(); else api.open(); });
    document.addEventListener('click', function (e) { if (api.isOpen() && !e.target.closest('.cc, .mb-cc')) api.close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && api.isOpen()) { api.close(); btn.focus(); e.stopPropagation(); } }, true);
  })();

  var svgGlass = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 9c1.5-1.4 3-1.8 4.5-1.8"/></svg>';
  var svgGlobe = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5s1.2-6.1 3.8-8.5z"/></svg>';
  var svgImage = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3L15 13l5 4.5"/></svg>';
  var svgLock = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/></svg>';
  var svgSound = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 3.5v-12L7.5 9.5z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a8 8 0 010 11"/></svg>';

  /* ================= Lock screen ================= */
  var LOCK = { en: ['Click or press any key to enter', 'Tap to enter'], tr: ['Girmek için tıkla veya bir tuşa bas', 'Girmek için dokun'] };
  var lockEl = null;
  function showLock(force) {
    if (lockEl) return;
    var home = document.querySelector('.hello img'), loc = lang === 'tr' ? 'tr-TR' : 'en-GB';
    var l = el('div', 'lock'); l.setAttribute('role', 'dialog'); l.setAttribute('aria-modal', 'true'); l.setAttribute('aria-label', 'Berkay Vuran'); l.tabIndex = -1;
    var touch = window.matchMedia('(hover:none)').matches;
    l.innerHTML = '<div class="lock-bg"></div><div class="lock-top"><div class="lock-date"></div><div class="lock-time"></div></div>' +
      '<div class="lock-bot">' + (home ? '<img src="' + home.getAttribute('src') + '" alt="" width="84" height="84">' : '') + '<strong>Berkay Vuran</strong><span class="lock-hint">' + LOCK[lang][touch ? 1 : 0] + '</span></div>';
    function tick() {
      var d = new Date();
      l.querySelector('.lock-date').textContent = d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
      l.querySelector('.lock-time').textContent = d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
    }
    tick(); var tm = setInterval(tick, 5000);
    var inert = ['.menubar', '.desktop', '.dock'].map(function (s) { return document.querySelector(s); }).filter(Boolean);
    inert.forEach(function (n) { n.setAttribute('inert', ''); });
    body.appendChild(l); lockEl = l; l.focus({ preventScroll: true });
    var ready = Date.now() + (force ? 250 : 350), gone = false;
    function unlock(e) {
      if (gone || Date.now() < ready) return; if (e && e.key && (e.metaKey || e.ctrlKey || e.key === 'Tab' || e.key === 'Shift')) return;
      gone = true; clearInterval(tm); l.classList.add('out'); blip(520, 880, 0.18);
      inert.forEach(function (n) { n.removeAttribute('inert'); });
      document.removeEventListener('keydown', unlock, true);
      setTimeout(function () { l.remove(); lockEl = null; }, 520);
    }
    l.addEventListener('click', unlock); l.addEventListener('wheel', unlock, { passive: true });
    var y0 = null; l.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    l.addEventListener('touchmove', function (e) { if (y0 !== null && y0 - e.touches[0].clientY > 40) unlock(); }, { passive: true });
    document.addEventListener('keydown', function h(e) { if (gone) { document.removeEventListener('keydown', h, true); return; } if (e.metaKey || e.ctrlKey || e.altKey) return; e.preventDefault(); e.stopPropagation(); unlock(e); }, true);
  }
  D.lock = function () { showLock(true); };
  (function autoLock() {
    var q = /[?&]lock(=|&|$)/.test(location.search);
    var bot = navigator.webdriver || /bot|crawl|spider|lighthouse|headless|prerender/i.test(navigator.userAgent);
    var seen = false; try { seen = sessionStorage.getItem('lockSeen') === '1'; } catch (e) {}
    if (q || (!bot && !seen && body.classList.contains('page-home') && !location.hash)) { try { sessionStorage.setItem('lockSeen', '1'); } catch (e) {} showLock(q); }
  })();

  /* ================= Quick Look ================= */
  var qlEl = null, qlItems = [], qlI = 0;
  function qlShow() {
    var it = qlItems[qlI]; if (!it) return;
    qlEl.querySelector('img').src = it.src; qlEl.querySelector('img').alt = it.title;
    qlEl.querySelector('.ql-t').textContent = it.title; qlEl.querySelector('.ql-s').textContent = it.sub || '';
    var a = qlEl.querySelector('.ql-open'); a.href = it.href || '#'; a.hidden = !it.href;
    qlEl.querySelector('.ql-prev').hidden = qlEl.querySelector('.ql-next').hidden = qlItems.length < 2;
  }
  function closeQL() { if (!qlEl || qlEl.hidden) return; qlEl.hidden = true; document.body.style.overflow = ''; if (qlEl._prev && qlEl._prev.focus) qlEl._prev.focus({ preventScroll: true }); }
  function openQL(items, i) {
    if (!items.length) return;
    D.data().catch(function () { return { ui: { ql: { open: 'Open', close: 'Close', prev: 'Previous', next: 'Next', hint: '' } } }; }).then(function (d) {
      var q = d.ui.ql;
      if (!qlEl) {
        qlEl = el('div', 'ql'); qlEl.hidden = true; qlEl.setAttribute('role', 'dialog'); qlEl.setAttribute('aria-modal', 'true');
        qlEl.innerHTML = '<div class="ql-card"><button type="button" class="ql-x" aria-label="' + q.close + '">×</button><button type="button" class="ql-nav ql-prev" aria-label="' + q.prev + '">‹</button><button type="button" class="ql-nav ql-next" aria-label="' + q.next + '">›</button><img alt=""><div class="ql-bar"><span class="ql-cap"><b class="ql-t"></b><small class="ql-s"></small></span><a class="btn ql-open" target="_blank" rel="noopener noreferrer">' + q.open + '</a></div></div>';
        body.appendChild(qlEl);
        qlEl.addEventListener('click', function (e) { if (e.target === qlEl || e.target.closest('.ql-x')) closeQL(); else if (e.target.closest('.ql-prev')) { qlI = (qlI - 1 + qlItems.length) % qlItems.length; qlShow(); } else if (e.target.closest('.ql-next')) { qlI = (qlI + 1) % qlItems.length; qlShow(); } });
        document.addEventListener('keydown', function (e) {
          if (qlEl.hidden) return;
          if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); closeQL(); }
          else if (e.key === 'ArrowLeft' && qlItems.length > 1) { e.preventDefault(); qlI = (qlI - 1 + qlItems.length) % qlItems.length; qlShow(); }
          else if (e.key === 'ArrowRight' && qlItems.length > 1) { e.preventDefault(); qlI = (qlI + 1) % qlItems.length; qlShow(); }
        }, true);
      }
      qlItems = items; qlI = i || 0; qlEl._prev = document.activeElement;
      qlEl.querySelector('.ql-open').textContent = q.open;
      qlShow(); closeAll(); qlEl.hidden = false; document.body.style.overflow = 'hidden'; qlEl.querySelector('.ql-x').focus({ preventScroll: true });
    });
  }
  D.quickLook = openQL;
  /* Space on a showcase tile quick-looks it */
  var hov = null;
  document.addEventListener('pointerover', function (e) { hov = e.target.closest ? e.target.closest('.tile-card a') : null; }, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;
    var a = (document.activeElement && document.activeElement.closest && document.activeElement.closest('.tile-card a')) || hov;
    if (!a || !document.body.contains(a)) return;
    var all = Array.prototype.slice.call(a.closest('.window, body').querySelectorAll('.tile-card:not([hidden]) a'));
    e.preventDefault();
    openQL(all.map(function (x) { var im = x.querySelector('img'); return { src: im.currentSrc || im.src, title: x.querySelector('.tc-t').textContent, sub: x.querySelector('.tc-c').textContent, href: x.href }; }), Math.max(0, all.indexOf(a)));
  });

  /* ================= context menu (desktop right click) ================= */
  (function contextMenu() {
    var menu = el('ul', 'ctx'); menu.hidden = true; menu.setAttribute('role', 'menu'); body.appendChild(menu);
    var api = { close: function () { menu.hidden = true; }, isOpen: function () { return !menu.hidden; } }; pops.push(api);
    function item(label, fn, opts) {
      opts = opts || {}; var li = el('li'); li.setAttribute('role', 'none');
      var b = el('button'); b.type = 'button'; b.setAttribute('role', opts.check != null ? 'menuitemradio' : 'menuitem');
      if (opts.check != null) b.setAttribute('aria-checked', opts.check ? 'true' : 'false');
      b.innerHTML = '<span class="ck" aria-hidden="true">' + (opts.check ? '✓' : '') + '</span><span class="lb"></span>' + (opts.key ? '<kbd></kbd>' : '');
      b.querySelector('.lb').textContent = label; if (opts.key) b.querySelector('kbd').textContent = opts.key;
      b.addEventListener('click', function () { api.close(); fn(); }); li.appendChild(b); return li;
    }
    function head(t) { var li = el('li', 'ch', t); li.setAttribute('role', 'presentation'); return li; }
    function sep() { var li = el('li', 'cs'); li.setAttribute('role', 'separator'); return li; }
    document.addEventListener('contextmenu', function (e) {
      if (!D.wide.matches || !window.matchMedia('(pointer:fine)').matches) return;
      if (e.target.closest('.window, .widget, .dock, .icons, .menubar, .ctx, .cc, .cal, .spot, .lock, .ql, input, textarea, a, button')) return;
      e.preventDefault();
      var x = e.clientX, y = e.clientY;
      D.data().then(function (d) {
        var c = d.ui.ctx, cur = wall(), th = root.getAttribute('data-theme'); menu.textContent = '';
        menu.appendChild(item(c.terminal, function () { D.openVirtual('terminal'); }));
        menu.appendChild(item(c.search, function () { var s = document.querySelector('.mb-search'); if (s) s.click(); }, { key: /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K' }));
        menu.appendChild(sep()); menu.appendChild(head(c.wallpaper));
        WALLS.forEach(function (w) { menu.appendChild(item(d.ui.walls[w], function () { setWall(w); }, { check: cur === w })); });
        menu.appendChild(sep()); menu.appendChild(head(c.theme));
        Array.prototype.forEach.call(document.querySelectorAll('[data-theme-set]'), function (b) { var id = b.getAttribute('data-theme-set'); menu.appendChild(item(b.getAttribute('data-emoji') + '  ' + b.getAttribute('data-name'), function () { D.setTheme(id); }, { check: th === id })); });
        menu.appendChild(sep());
        menu.appendChild(item(c.lock, function () { showLock(true); }));
        menu.appendChild(item(c.cc, function () { D.cc.open(); }));
        menu.appendChild(item(c.about, function () { D.go(d.sections[0].u); }));
        closeAll(api); menu.hidden = false;
        var w = menu.offsetWidth, h = menu.offsetHeight;
        menu.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px'; menu.style.top = Math.max(36, Math.min(y, innerHeight - h - 8)) + 'px';
        var first = menu.querySelector('button'); if (first) first.focus({ preventScroll: true });
      }).catch(function () {});
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !e.target.closest('.ctx')) api.close(); });
    window.addEventListener('blur', api.close); window.addEventListener('resize', api.close);
    menu.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(menu.querySelectorAll('button')), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); api.close(); }
    });
  })();

  /* ================= dock: magnification + tooltips ================= */
  (function magnify() {
    var dock = document.querySelector('.dock');
    if (!dock || !window.matchMedia('(hover:hover) and (pointer:fine) and (min-width:700px)').matches) return;
    dock.classList.add('mag');
    var raf = 0, x = 0;
    function apply() {
      raf = 0;
      dock.querySelectorAll('.icon').forEach(function (a) {
        var r = a.getBoundingClientRect(); if (!r.width) return;
        var d = Math.abs(x - (r.left + r.width / 2)), t = Math.max(0, 1 - d / 130), s = 1 + 0.4 * t * t * (3 - 2 * t);
        a.style.transform = 'scale(' + s.toFixed(3) + ')'; a.style.zIndex = String(Math.round(s * 100));
      });
    }
    dock.addEventListener('pointermove', function (e) { x = e.clientX; if (!raf) raf = requestAnimationFrame(apply); });
    dock.addEventListener('pointerleave', function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } dock.querySelectorAll('.icon').forEach(function (a) { a.style.transform = ''; a.style.zIndex = ''; }); });
  })();

  /* ================= virtual apps ================= */
  function link(label, href, ext) { var a = el('a', null, label); a.href = href; if (ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a; }

  /* ---------- Terminal ---------- */
  D.apps.terminal = {
    focus: function (w) { if (D.wide.matches) { var i = w.querySelector('.tm-in input'); if (i) i.focus({ preventScroll: true }); } },
    build: function (main, d, win) {
      var t = d.ui.term, c = d.contact;
      main.classList.add('tm');
      main.innerHTML = '<div class="tm-out" role="log" aria-live="polite"></div><form class="tm-in" autocomplete="off"><span class="tm-p"></span><input type="text" aria-label="Terminal" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="go"></form>';
      var out = main.querySelector('.tm-out'), form = main.querySelector('.tm-in'), input = form.querySelector('input'), pr = form.querySelector('.tm-p');
      pr.textContent = t.prompt + ' ~ %';
      var hist = [], hi = 0;
      function line() { var p = el('div', 'tm-l'); for (var i = 0; i < arguments.length; i++) { var a = arguments[i]; p.appendChild(typeof a === 'string' ? document.createTextNode(a) : a); } out.appendChild(p); return p; }
      function pad() { out.appendChild(el('div', 'tm-gap')); }
      function dd(label, text) { var p = el('div', 'tm-l tm-kv'); p.appendChild(el('span', 'tm-k', label)); p.appendChild(typeof text === 'string' ? el('span', 'tm-v', text) : text); out.appendChild(p); }
      function openSection(id) {
        var map = {}; d.sections.forEach(function (s) { map[s.id] = s.u; });
        if (map[id]) { line(t.opened + ' ' + id + '…'); D.go(map[id]); return true; }
        if (id === 'terminal') { line(t.opened + ' ' + id + '…'); return true; }
        if (['notes', 'photos', 'mail'].indexOf(id) > -1) { line(t.opened + ' ' + id + '…'); D.openVirtual(id); return true; }
        return false;
      }
      var CMD = {
        help: function () { t.help.forEach(function (h) { dd(h[0], h[1]); }); },
        about: function () { line(d.about); },
        whoami: function () { line('guest'); },
        experience: function () { d.cv.experience.forEach(function (i) { dd(i.d, i.r + (i.o ? ' @ ' + i.o : '')); }); },
        education: function () { d.cv.education.forEach(function (i) { dd(i.d, i.r + (i.o ? ' @ ' + i.o : '')); }); },
        projects: function () { d.projects.forEach(function (p) { var s = el('span', 'tm-v'); s.appendChild(link(p.n, p.u, true)); s.appendChild(document.createTextNode('  ' + p.d)); dd('▸', s); }); },
        blog: function () { d.posts.slice(0, 6).forEach(function (p) { var s = el('span', 'tm-v'); s.appendChild(link(p.t, p.u, true)); dd(p.d, s); }); },
        skills: function () { d.focus.forEach(function (f) { line('• ' + f); }); },
        contact: function () {
          dd('phone', link(c.show, 'tel:' + c.tel)); dd('email', link(c.mail, 'mailto:' + c.mail));
          dd('linkedin', link(c.linkedin.replace('https://www.', ''), c.linkedin, true)); dd('github', link(c.github.replace('https://', ''), c.github, true)); dd('web', link(c.site.replace('https://', ''), c.site, true));
        },
        open: function (a) { if (!a[0]) { line(t.usage + ' open <name>'); return; } if (!openSection(a[0].toLowerCase())) line(t.badOpen); },
        theme: function (a) { var id = THEME_ALIAS[(a[0] || '').toLowerCase()]; if (!id) { line(t.badTheme); return; } D.setTheme(id); line(t.themeSet + ' ' + a[0].toLowerCase()); },
        wallpaper: function (a) { if (!setWall((a[0] || '').toLowerCase())) { line(t.badWall); return; } line(t.wallSet + ' ' + a[0].toLowerCase()); },
        lang: function (a) { var l = (a[0] || '').toLowerCase(); if (l !== 'en' && l !== 'tr') { line(t.usage + ' lang <en|tr>'); return; } if (l === d.ui.lang) { line(l); return; } line(t.langSwitch); var ml = document.querySelector('.mb-lang'); location.href = ml ? ml.getAttribute('href') : d.ui.other; },
        lock: function () { setTimeout(function () { showLock(true); }, 120); },
        ls: function () { line(t.files.join('   ')); },
        cat: function (a) {
          var f = (a[0] || '').replace(/^\.\//, '');
          if (!f) { line(t.usage + ' cat <file>'); return; }
          if (f === 'about.txt') CMD.about(); else if (f === 'contact.txt') CMD.contact(); else if (f === 'cv.txt') CMD.experience();
          else if (f === 'projects' || f === 'projects/') CMD.projects(); else if (f === 'blog' || f === 'blog/') CMD.blog();
          else line(t.noFile + ' ' + f);
        },
        date: function () { line(new Date().toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { dateStyle: 'full', timeStyle: 'medium' })); },
        echo: function (a) { line(a.join(' ')); },
        history: function () { hist.forEach(function (h, i) { line(String(i + 1).padStart(3, ' ') + '  ' + h); }); },
        clear: function () { out.textContent = ''; },
        hello: function () { line(t.hello); },
        exit: function () { line(t.exit); setTimeout(function () { D.closeWin('terminal'); }, 350); },
        neofetch: function () {
          var n = t.neofetch, th = root.getAttribute('data-theme');
          var art = el('pre', 'tm-art', '  ___  ___ \n | _ )/ _ \\\n | _ \\ V / \n |___/\\_/  ');
          var box = el('div', 'tm-nf'); box.appendChild(art);
          var rows = el('div', 'tm-rows');
          [[n[0], ''], [n[1], n[2]], [n[3], n[4]], [n[5], n[6]], [n[7], n[8]], [n[9], th]].forEach(function (r, i) { var p = el('div'); if (i === 0) { p.appendChild(el('b', null, r[0])); } else { p.appendChild(el('b', null, r[0] + ': ')); p.appendChild(document.createTextNode(r[1])); } rows.appendChild(p); });
          box.appendChild(rows); out.appendChild(box);
        },
        sudo: function (a) {
          if (a.join(' ').toLowerCase().indexOf('hire') > -1) {
            t.sudo.slice(0, 2).forEach(function (s, i) { setTimeout(function () { line(s); out.scrollTop = out.scrollHeight; }, i * 420); });
            setTimeout(function () { line(t.sudo[2]); D.openVirtual('mail'); }, 1100);
          } else line(t.root);
        }
      };
      CMD.hi = CMD.hello; CMD.dir = CMD.ls; CMD['?'] = CMD.help; CMD.resume = CMD.experience; CMD.cv = CMD.experience;
      var NAMES = Object.keys(CMD).filter(function (k) { return k !== '?' && k !== 'hi' && k !== 'dir'; });
      function run(raw) {
        var echoLine = line(); echoLine.appendChild(el('span', 'tm-p', t.prompt + ' ~ %')); echoLine.appendChild(document.createTextNode(' ' + raw));
        var parts = raw.trim().split(/\s+/).filter(Boolean); if (!parts.length) return;
        if (hist[hist.length - 1] !== raw.trim()) hist.push(raw.trim()); hi = hist.length;
        var name = parts[0].toLowerCase();
        if (CMD[name]) CMD[name](parts.slice(1)); else { line(t.unknown + ' ' + parts[0]); line(t.tryHelp); }
        pad(); out.scrollTop = out.scrollHeight;
      }
      form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; run(v); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) { hi--; input.value = hist[hi]; } }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (hi < hist.length - 1) { hi++; input.value = hist[hi]; } else { hi = hist.length; input.value = ''; } }
        else if (e.key === 'Tab') { e.preventDefault(); var v = input.value.trim().toLowerCase(); if (!v || v.indexOf(' ') > -1) return; var m = NAMES.filter(function (n) { return n.indexOf(v) === 0; }); if (m.length === 1) input.value = m[0] + ' '; else if (m.length > 1) line(m.join('   ')); }
        else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); CMD.clear(); }
        else if (e.key === 'Escape') { e.stopPropagation(); }
      });
      main.addEventListener('click', function (e) { if (!e.target.closest('a') && !window.getSelection().toString()) input.focus({ preventScroll: true }); });
      line(t.welcome); line(t.tryHelp); pad();
    }
  };

  /* ---------- Notes ---------- */
  D.apps.notes = {
    build: function (main, d) {
      var n = d.ui.notes, posts = d.posts, cats = [];
      posts.forEach(function (p) { if (cats.indexOf(p.c) < 0) cats.push(p.c); });
      main.classList.add('nt');
      main.innerHTML = '<div class="nt-list"><div class="nt-hd"><h2></h2><div class="nt-chips" role="group"></div></div><ul class="nt-ul" role="list"></ul></div><article class="nt-detail" aria-live="polite"><button type="button" class="nt-back"></button><div class="nt-body"></div></article>';
      main.querySelector('h2').textContent = n.all + ' · ' + posts.length;
      var ul = main.querySelector('.nt-ul'), chips = main.querySelector('.nt-chips'), body = main.querySelector('.nt-body'), cur = 'all', sel = -1;
      main.querySelector('.nt-back').textContent = '‹ ' + n.back;
      main.querySelector('.nt-back').addEventListener('click', function () { main.classList.remove('is-detail'); });
      function show(i) {
        sel = i; var p = posts[i]; main.classList.add('is-detail');
        ul.querySelectorAll('li').forEach(function (li) { li.classList.toggle('on', +li.getAttribute('data-i') === i); });
        body.textContent = '';
        body.appendChild(el('p', 'nt-meta', p.d + ' · ' + p.c));
        body.appendChild(el('h3', null, p.t));
        if (p.i) { var im = el('img'); im.src = p.i; im.alt = ''; im.width = 560; im.height = 280; body.appendChild(im); }
        body.appendChild(el('p', 'nt-ex', p.e));
        var a = link(n.read + ' ↗', p.u, true); a.className = 'btn'; body.appendChild(a);
      }
      function draw() {
        ul.textContent = ''; var first = -1;
        posts.forEach(function (p, i) {
          if (cur !== 'all' && p.c !== cur) return; if (first < 0) first = i;
          var li = el('li'); li.setAttribute('data-i', i); var b = el('button'); b.type = 'button';
          b.appendChild(el('b', null, p.t)); b.appendChild(el('span', null, p.d + '  ' + p.e));
          b.addEventListener('click', function () { show(i); }); li.appendChild(b); ul.appendChild(li);
        });
        return first;
      }
      [['all', n.all]].concat(cats.map(function (c) { return [c, c]; })).forEach(function (c) {
        var b = el('button', null, c[1]); b.type = 'button'; b.setAttribute('aria-pressed', c[0] === 'all' ? 'true' : 'false');
        b.addEventListener('click', function () { cur = c[0]; chips.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); draw(); ul.scrollTop = 0; });
        chips.appendChild(b);
      });
      var f = draw();
      if (D.wide.matches && f > -1) { show(f); main.classList.remove('is-detail'); } else body.appendChild(el('p', 'nt-empty', n.pick));
      if (D.wide.matches) main.classList.remove('is-detail');
    }
  };

  /* ---------- Photos ---------- */
  D.apps.photos = {
    build: function (main, d) {
      var ph = d.photos, uiP = d.ui.photos, cur = 'all';
      main.classList.add('ph');
      main.innerHTML = '<div class="ph-bar" role="group"></div><ul class="ph-grid" role="list"></ul>';
      var bar = main.querySelector('.ph-bar'), grid = main.querySelector('.ph-grid');
      var shown = [];
      ph.items.forEach(function (it, i) {
        var li = el('li'); li.setAttribute('data-c', it.c); var b = el('button'); b.type = 'button'; b.setAttribute('aria-label', it.t);
        var im = el('img'); im.src = it.i; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 300; im.height = 200; b.appendChild(im); b.appendChild(el('span', null, it.t));
        b.addEventListener('click', function () {
          var vis = ph.items.filter(function (x) { return cur === 'all' || x.c === cur; });
          openQL(vis.map(function (x) { return { src: x.i, title: x.t, sub: x.cl, href: x.u }; }), vis.indexOf(it));
        });
        li.appendChild(b); grid.appendChild(li);
      });
      ph.cats.forEach(function (c) {
        var b = el('button', null, c.l); b.type = 'button'; b.setAttribute('aria-pressed', c.id === 'all' ? 'true' : 'false');
        b.addEventListener('click', function () {
          cur = c.id; bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          grid.querySelectorAll('li').forEach(function (li) { li.hidden = !(cur === 'all' || li.getAttribute('data-c') === cur); });
          main.scrollTop = 0;
        });
        bar.appendChild(b);
      });
    }
  };

  /* ---------- Mail ---------- */
  D.apps.mail = {
    focus: function (w) { if (D.wide.matches) { var i = w.querySelector('input[name="email"]'); if (i) i.focus({ preventScroll: true }); } },
    build: function (main, d) {
      var m = d.ui.mail, c = d.contact;
      main.classList.add('ml');
      main.innerHTML = '<form class="ml-f" novalidate>' +
        '<div class="ml-to"><span>' + m.to + '</span><b></b><button type="button" class="ml-copy"></button></div>' +
        '<label><span>' + m.name + '</span><input name="name" type="text" autocomplete="name"></label>' +
        '<label><span>' + m.email + '</span><input name="email" type="email" autocomplete="email" inputmode="email" required></label>' +
        '<label><span>' + m.subject + '</span><input name="subject" type="text"></label>' +
        '<label class="ml-msg"><span>' + m.message + '</span><textarea name="message" rows="7" required></textarea></label>' +
        '<p class="ml-st" role="status" aria-live="polite"></p>' +
        '<div class="ml-act"><button type="submit" class="btn"></button><a class="ml-call"></a></div></form>';
      var f = main.querySelector('form'), st = main.querySelector('.ml-st'), send = f.querySelector('[type=submit]');
      main.querySelector('.ml-to b').textContent = c.mail;
      var cp = main.querySelector('.ml-copy'); cp.textContent = m.copy;
      cp.addEventListener('click', function () { var done = function () { cp.textContent = m.copied; setTimeout(function () { cp.textContent = m.copy; }, 1600); }; if (navigator.clipboard) navigator.clipboard.writeText(c.mail).then(done, done); else done(); });
      send.textContent = m.send;
      var call = main.querySelector('.ml-call'); call.href = 'tel:' + c.tel; call.textContent = m.or + ': ' + c.show;
      f.elements.subject.placeholder = m.subjectDefault;
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = f.elements.name.value.trim(), email = f.elements.email.value.trim(), msg = f.elements.message.value.trim(), subj = f.elements.subject.value.trim() || m.subjectDefault;
        if (!/^\S+@\S+\.\S+$/.test(email) || !msg) { st.textContent = m.required; st.className = 'ml-st err'; (msg ? f.elements.email : f.elements.message).focus(); return; }
        st.className = 'ml-st';
        if (d.form) {
          send.disabled = true; st.textContent = m.sending;
          fetch(d.form, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: name, email: email, _replyto: email, subject: subj, message: msg }) })
            .then(function (r) { if (!r.ok) throw new Error(r.status); st.textContent = m.sent; st.className = 'ml-st ok'; f.reset(); })
            .catch(function () { st.className = 'ml-st err'; st.textContent = m.failed + ' ' + c.mail; })
            .then(function () { send.disabled = false; });
          return;
        }
        var bodyTxt = msg + (name || email ? '\n\n' + (name ? name + '\n' : '') + email : '');
        st.textContent = m.opening + ' ' + c.mail;
        location.href = 'mailto:' + c.mail + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(bodyTxt);
      });
    }
  };

  /* ---------- offline support + SPA analytics hook ---------- */
  document.addEventListener('desk:nav', function (e) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: e.detail.path }); } catch (er) {} });
  if (base === '' && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
})();
