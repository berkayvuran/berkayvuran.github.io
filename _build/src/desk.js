/* berkayvuran.com desktop shell. Progressive enhancement: every page works without this file. */
(function () {
  'use strict';
  var body = document.body;
  var lang = body.getAttribute('data-lang') || 'en';
  var cache = new Map();
  var wide = window.matchMedia('(min-width:1100px)');

  /* ---------- clock ---------- */
  function tick() {
    var el = document.getElementById('clock');
    if (!el) return;
    var d = new Date(), loc = lang === 'tr' ? 'tr-TR' : 'en-GB';
    el.textContent = d.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' }) + '  ' + d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  }
  tick(); setInterval(tick, 20000);


  /* ---------- calendar popover (click the date and time) ---------- */
  (function calendar() {
    var btn = document.querySelector('.mb-clock-btn'); if (!btn) return;
    var loc = lang === 'tr' ? 'tr-TR' : 'en-GB', first = lang === 'tr' ? 1 : 0;
    var pop = document.createElement('div');
    pop.className = 'cal'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', btn.getAttribute('aria-label'));
    document.body.appendChild(pop);
    var view = new Date(); view.setDate(1);
    function draw() {
      var now = new Date(), y = view.getFullYear(), m = view.getMonth();
      var head = now.toLocaleDateString(loc, { weekday: 'long' }), big = now.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
      var days = '', ref = new Date(2023, 0, 1 + first);
      for (var i = 0; i < 7; i++) { days += '<span>' + new Date(ref.getTime() + i * 864e5).toLocaleDateString(loc, { weekday: 'narrow' }) + '</span>'; }
      var start = (new Date(y, m, 1).getDay() - first + 7) % 7, dim = new Date(y, m + 1, 0).getDate(), cells = '';
      for (var s = 0; s < start; s++) cells += '<i></i>';
      for (var d = 1; d <= dim; d++) {
        var t = d === now.getDate() && m === now.getMonth() && y === now.getFullYear(), wk = (start + d - 1) % 7, we = (wk + first) % 7;
        cells += '<b class="' + (t ? 'today' : '') + (we === 0 || we === 6 ? ' we' : '') + '"' + (t ? ' aria-current="date"' : '') + '>' + d + '</b>';
      }
      var title = new Date(y, m, 1).toLocaleDateString(loc, { month: 'long', year: 'numeric' });
      pop.innerHTML = '<div class="cal-top"><small>' + head + '</small><strong>' + big + '</strong></div>' +
        '<div class="cal-nav"><button type="button" data-n="-1" aria-label="‹">‹</button><span>' + title + '</span><button type="button" data-n="1" aria-label="›">›</button></div>' +
        '<div class="cal-grid"><div class="cal-wd">' + days + '</div><div class="cal-days">' + cells + '</div></div>' +
        '<button type="button" class="cal-today" data-n="0">' + btn.getAttribute('data-today') + '</button>';
    }
    function setOpen(o) { pop.hidden = !o; btn.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) { view = new Date(); view.setDate(1); draw(); } }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(pop.hidden); });
    pop.addEventListener('click', function (e) {
      e.stopPropagation(); var n = e.target.closest('[data-n]'); if (!n) return;
      var v = +n.getAttribute('data-n'); if (v === 0) { view = new Date(); view.setDate(1); } else view.setMonth(view.getMonth() + v);
      draw();
    });
    document.addEventListener('click', function () { if (!pop.hidden) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { setOpen(false); btn.focus(); e.stopPropagation(); } }, true);
  })();

  /* ---------- theme switcher (dark, light, matrix, high-contrast) ---------- */
  var THEME_IDS = ['dark', 'light', 'matrix', 'high-contrast'];
  var themeBtn = document.querySelector('.mb-theme'), themeMenu = document.querySelector('.theme-menu');
  function paintTheme(id) {
    var root = document.documentElement;
    root.setAttribute('data-theme', id);
    if (themeMenu) themeMenu.querySelectorAll('[data-theme-set]').forEach(function (b) {
      var on = b.getAttribute('data-theme-set') === id;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      if (on && themeBtn) { themeBtn.querySelector('.th-e').textContent = b.getAttribute('data-emoji'); themeBtn.querySelector('.th-n').textContent = b.getAttribute('data-name'); }
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--meta').trim() || '#0b0f17');
  }
  function closeThemeMenu() { if (themeMenu && !themeMenu.hidden) { themeMenu.hidden = true; themeBtn.setAttribute('aria-expanded', 'false'); } }
  if (themeBtn && themeMenu) {
    paintTheme(THEME_IDS.indexOf(document.documentElement.getAttribute('data-theme')) > -1 ? document.documentElement.getAttribute('data-theme') : 'dark');
    themeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = themeMenu.hidden;
      themeMenu.hidden = !open; themeBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { var cur = themeMenu.querySelector('[aria-checked="true"]'); if (cur) cur.focus(); }
    });
    var glassBtn = themeMenu.querySelector('[data-glass-toggle]');
    function paintGlass() { if (glassBtn) glassBtn.setAttribute('aria-checked', document.documentElement.getAttribute('data-glass') === 'off' ? 'false' : 'true'); }
    paintGlass();
    themeMenu.addEventListener('click', function (e) {
      var g = e.target.closest('[data-glass-toggle]');
      if (g) {
        var off = document.documentElement.getAttribute('data-glass') !== 'off';
        if (off) document.documentElement.setAttribute('data-glass', 'off'); else document.documentElement.removeAttribute('data-glass');
        try { localStorage.setItem('glass', off ? 'off' : 'on'); } catch (er) {}
        paintGlass(); return;
      }
      var b = e.target.closest('[data-theme-set]'); if (!b) return;
      var id = b.getAttribute('data-theme-set');
      paintTheme(id); try { localStorage.setItem('theme', id); } catch (er) {}
      closeThemeMenu(); themeBtn.focus();
    });
    themeMenu.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(themeMenu.querySelectorAll('button')), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeThemeMenu(); themeBtn.focus(); }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.mb-themewrap')) closeThemeMenu(); });
  }

  function fetchDoc(href) {
    if (cache.has(href)) return cache.get(href);
    var p = fetch(href, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (t) { return new DOMParser().parseFromString(t, 'text/html'); });
    cache.set(href, p);
    p.catch(function () { cache.delete(href); });
    return p;
  }

  /* ---------- window manager (real stacking windows) ---------- */
  var home = body.getAttribute('data-home');
  var SECTIONS = ['about', 'cv', 'references', 'showcase', 'blog', 'builder'];
  var wins = {}, active = null, zTop = 500, opened = 0;

  function slugOf(href) {
    var p = new URL(href, location.href).pathname;
    if (p.indexOf(home) !== 0) return null;
    var s = p.slice(home.length).replace(/\/+$/, '');
    return s === '' ? '' : (SECTIONS.indexOf(s) > -1 ? s : null);
  }
  function urlOf(slug) { return home + (slug ? slug + '/' : ''); }
  function isVirtual(slug) { return !!(slug && wins[slug] && wins[slug].hasAttribute('data-virtual')); }
  function labelOf(slug) {
    if (isVirtual(slug)) { var h = wins[slug].querySelector('h1'); return h ? h.textContent : slug; }
    var n = document.querySelector('.mb-menu a[data-app="' + slug + '"]'); return n ? n.textContent : slug;
  }

  function setFilter(win, id) {
    win.querySelectorAll('.side-item').forEach(function (a) {
      if (a.getAttribute('data-filter') === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    win.querySelectorAll('[data-cat]').forEach(function (n) { n.hidden = !(id === 'all' || n.getAttribute('data-cat') === id); });
    win.querySelectorAll('[data-group]').forEach(function (n) { n.hidden = !(id === 'all' || n.getAttribute('data-group') === id); });
    win.querySelectorAll('.side-sub2').forEach(function (u) { u.hidden = u.getAttribute('data-for') !== id; });
    win.querySelectorAll('.side-leaf[aria-current]').forEach(function (l) { l.removeAttribute('aria-current'); });
    var main = win.querySelector('.win-main'); if (main) main.scrollTop = 0;
  }

  function visibleSlugs() { return Object.keys(wins).filter(function (k) { return !wins[k].classList.contains('is-min'); }); }
  function topSlug() {
    var best = null, bz = -1;
    visibleSlugs().forEach(function (k) { var zi = parseInt(wins[k].style.zIndex || 0, 10); if (zi > bz) { bz = zi; best = k; } });
    return best;
  }

  function chrome() {
    body.classList.toggle('has-win', visibleSlugs().length > 0);
    Array.prototype.slice.call(body.classList).forEach(function (c) { if (c.indexOf('page-') === 0) body.classList.remove(c); });
    body.classList.add('page-' + (active || 'home'));
    var app = document.getElementById('mb-app'); if (app) app.textContent = active ? labelOf(active) : 'Berkay Vuran';
    document.querySelectorAll('.mb-menu a').forEach(function (a) { if (a.getAttribute('data-app') === active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.querySelectorAll('.icons a[data-app], .dock a[data-app], .icons a[data-vapp], .dock a[data-vapp]').forEach(function (a) {
      var s = a.getAttribute('data-app') || a.getAttribute('data-vapp');
      a.classList.toggle('is-open', !!wins[s]);
      if (s === active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    Object.keys(wins).forEach(function (k) { wins[k].classList.toggle('active', k === active); });
  }

  var HEAD_SYNC = ['meta[name="description"]', 'link[rel="canonical"]', 'link[rel="alternate"]', 'meta[property^="og:"]', 'meta[name^="twitter:"]', 'script[type="application/ld+json"]'];
  function syncHead(doc) {
    document.title = doc.title;
    HEAD_SYNC.forEach(function (sel) {
      document.head.querySelectorAll(sel).forEach(function (n) { n.remove(); });
      doc.head.querySelectorAll(sel).forEach(function (n) { document.head.appendChild(document.importNode(n, true)); });
    });
    var other = document.head.querySelector('link[rel="alternate"][hreflang]:not([hreflang="' + lang + '"]):not([hreflang="x-default"])'), ml = document.querySelector('.mb-lang');
    if (other && ml) { try { ml.setAttribute('href', new URL(other.getAttribute('href')).pathname); } catch (e) {} }
  }
  function setUrl(slug, push) {
    if (isVirtual(slug)) return;
    var href = urlOf(slug);
    if (location.pathname !== href) { try { history[push === false ? 'replaceState' : 'pushState']({ w: 1 }, '', href); if (push !== false) document.dispatchEvent(new CustomEvent('desk:nav', { detail: { path: href } })); } catch (e) {} }
    fetchDoc(href).then(syncHead).catch(function () {});
  }

  function focusWin(slug, push) {
    var w = wins[slug]; if (!w) return;
    w.classList.remove('is-min'); w.style.zIndex = ++zTop; active = slug;
    chrome(); setUrl(slug, push);
    var h = w.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function afterLeave(push) {
    var next = topSlug();
    if (next) { active = next; wins[next].style.zIndex = ++zTop; chrome(); setUrl(next, push); }
    else { active = null; chrome(); setUrl('', push); }
  }
  function closeWin(slug) { if (!wins[slug]) return; document.dispatchEvent(new CustomEvent('desk:close', { detail: { slug: slug } })); wins[slug].remove(); delete wins[slug]; if (active === slug) afterLeave(false); else chrome(); }
  function minimizeWin(slug) { var w = wins[slug]; if (!w) return; w.classList.add('is-min'); if (active === slug) afterLeave(false); else chrome(); }
  function showDesktop(push) { Object.keys(wins).forEach(function (k) { wins[k].classList.add('is-min'); }); active = null; chrome(); setUrl('', push); }

  function initWindow(win, slug) {
    var side = win.querySelector('.win-side');
    if (side) {
      side.addEventListener('click', function (e) {
        var leaf = e.target.closest('.side-leaf');
        if (leaf) {
          e.preventDefault();
          var cur = side.querySelector('.side-item[aria-current]');
          if (!cur || cur.getAttribute('data-filter') !== leaf.getAttribute('data-parent')) setFilter(win, leaf.getAttribute('data-parent'));
          var t = win.querySelector('[id="' + leaf.getAttribute('data-target') + '"]');
          side.querySelectorAll('.side-leaf[aria-current]').forEach(function (l) { l.removeAttribute('aria-current'); });
          leaf.setAttribute('aria-current', 'true');
          if (t) {
            var d = t.tagName === 'DETAILS' ? t : t.querySelector('details'); if (d) d.open = true;
            t.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash');
          }
          return;
        }
        var a = e.target.closest('.side-item'); if (!a) return;
        e.preventDefault(); setFilter(win, a.getAttribute('data-filter'));
      });
      var def = side.querySelector('[data-default]');
      if (def) setFilter(win, def.getAttribute('data-filter'));
    }
    win.addEventListener('pointerdown', function () { if (active !== slug) { win.style.zIndex = ++zTop; active = slug; chrome(); setUrl(slug, true); } }, true);
    var close = function (e) { e.preventDefault(); e.stopPropagation(); closeWin(slug); };
    var r = win.querySelector('.dot.r'), back = win.querySelector('.back'), g = win.querySelector('.dot.g'), y = win.querySelector('.dot.y');
    if (r) r.addEventListener('click', close);
    if (back) back.addEventListener('click', close);
    if (g) g.addEventListener('click', function () { win.classList.toggle('is-max'); });
    if (y) y.addEventListener('click', function () { minimizeWin(slug); });
    var bar = win.querySelector('.titlebar');
    function pin() {
      var rc = win.getBoundingClientRect();
      win.classList.add('is-moved');
      win.style.left = rc.left + 'px'; win.style.top = rc.top + 'px'; win.style.width = rc.width + 'px'; win.style.height = rc.height + 'px'; win.style.right = 'auto'; win.style.bottom = 'auto';
      return rc;
    }
    if (bar) {
      bar.addEventListener('dblclick', function (e) { if (!e.target.closest('.dot, a') && wide.matches) win.classList.toggle('is-max'); });
      bar.addEventListener('pointerdown', function (e) {
        if (!wide.matches || e.button !== 0 || win.classList.contains('is-max') || e.target.closest('.dot, a')) return;
        var rc = win.getBoundingClientRect(), sx = e.clientX - rc.left, sy = e.clientY - rc.top, moved = false;
        bar.setPointerCapture(e.pointerId);
        function mv(ev) {
          if (!moved) { moved = true; pin(); }
          win.style.left = Math.min(Math.max(ev.clientX - sx, 60 - rc.width), innerWidth - 60) + 'px';
          win.style.top = Math.min(Math.max(ev.clientY - sy, 32), innerHeight - 44) + 'px';
        }
        function up(ev) { try { bar.releasePointerCapture(ev.pointerId); } catch (er) {} bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); }
        bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
      });
    }
    var rz = document.createElement('div'); rz.className = 'rz'; rz.setAttribute('aria-hidden', 'true'); win.appendChild(rz);
    rz.addEventListener('pointerdown', function (e) {
      if (!wide.matches || e.button !== 0 || win.classList.contains('is-max')) return;
      e.preventDefault(); var rc = pin(), sx = e.clientX, sy = e.clientY;
      rz.setPointerCapture(e.pointerId);
      function mv(ev) { win.style.width = Math.max(380, rc.width + ev.clientX - sx) + 'px'; win.style.height = Math.max(280, rc.height + ev.clientY - sy) + 'px'; }
      function up(ev) { try { rz.releasePointerCapture(ev.pointerId); } catch (er) {} rz.removeEventListener('pointermove', mv); rz.removeEventListener('pointerup', up); rz.removeEventListener('pointercancel', up); }
      rz.addEventListener('pointermove', mv); rz.addEventListener('pointerup', up); rz.addEventListener('pointercancel', up);
    });
  }
  function register(slug, w) { wins[slug] = w; initWindow(w, slug); }

  function mount(w, slug, push) {
    if (wide.matches && Object.keys(wins).length) { var off = (opened % 6 + 1) * 28; w.style.setProperty('--ox', off + 'px'); w.style.setProperty('--oy', off + 'px'); }
    opened++;
    document.getElementById('main').appendChild(w);
    register(slug, w); focusWin(slug, push);
    document.dispatchEvent(new CustomEvent('desk:open', { detail: { slug: slug } }));
  }
  /* virtual apps (Terminal, Notes, Photos, Mail) live in extras.js: windows without their own URL */
  var Desk = window.Desk = { apps: {}, go: null, closeWin: closeWin, wide: wide };
  function openVirtual(slug) {
    var def = Desk.apps[slug];
    if (!def) return Promise.reject(new Error('no app'));
    if (wins[slug]) { focusWin(slug, false); return Promise.resolve(); }
    return Promise.resolve(Desk.data()).then(function (data) {
      var ui = data.ui, w = document.createElement('section');
      w.className = 'window no-side win-virt win-' + slug; w.setAttribute('data-slug', slug); w.setAttribute('data-virtual', '1'); w.setAttribute('aria-labelledby', 'win-title-' + slug);
      w.innerHTML = '<header class="titlebar"><a class="back" href="' + home + '"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg><span>' + ui.back + '</span></a><div class="dots"><a class="dot r" href="' + home + '" aria-label="' + ui.close + '"></a><button class="dot y" type="button" aria-label="' + ui.min + '"></button><button class="dot g" type="button" aria-label="' + ui.zoom + '"></button></div><h1 id="win-title-' + slug + '"></h1></header><div class="win-body"><div class="win-main"></div></div>';
      w.querySelector('h1').textContent = ui.names[slug];
      if (!wide.matches) Object.keys(wins).forEach(function (k) { wins[k].remove(); delete wins[k]; });
      def.build(w.querySelector('.win-main'), data, w);
      mount(w, slug, false);
      if (def.focus) def.focus(w);
    });
  }
  Desk.openVirtual = openVirtual;
  function openApp(slug, push) {
    if (wins[slug]) { focusWin(slug, push); return Promise.resolve(); }
    return fetchDoc(urlOf(slug)).then(function (doc) {
      var src = doc.querySelector('.window'); if (!src) throw new Error('no window');
      if (!wide.matches) Object.keys(wins).forEach(function (k) { wins[k].remove(); delete wins[k]; });
      var w = document.importNode(src, true);
      mount(w, slug, push);
    }).catch(function () { location.href = urlOf(slug); });
  }
  function go(href, push) {
    if (/^#/.test(href)) { openVirtual(href.slice(1)).catch(function () {}); return; }
    var s = slugOf(href);
    if (s === null) { location.href = href; return; }
    if (s === '') showDesktop(push); else openApp(s, push);
  }

  Desk.go = go; Desk.setTheme = function (id) { paintTheme(id); try { localStorage.setItem('theme', id); } catch (er) {} };
  Desk.slugOf = slugOf; Desk.active = function () { return active; };

  /* ---------- typewriter title ---------- */
  var twTimer = null;
  function typewriter() {
    clearTimeout(twTimer);
    var host = document.querySelector('.hello-sub[data-titles]');
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var out = host.querySelector('.tw'), titles;
    try { titles = JSON.parse(host.getAttribute('data-titles')); } catch (e) { return; }
    var i = 0, n = 0, del = false;
    out.textContent = '';
    (function step() {
      if (!document.body.contains(out)) return;
      var full = titles[i];
      if (del) {
        out.textContent = full.slice(0, --n);
        if (n === 0) { del = false; i = (i + 1) % titles.length; twTimer = setTimeout(step, 300); return; }
        twTimer = setTimeout(step, 40);
      } else {
        out.textContent = full.slice(0, ++n);
        if (n === full.length) { del = true; twTimer = setTimeout(step, 1500); return; }
        twTimer = setTimeout(step, 80);
      }
    })();
  }

  /* ---------- random testimonial ---------- */
  function randomQuote() {
    var w = document.querySelector('.w-quote[data-quotes]');
    if (!w) return;
    var list; try { list = JSON.parse(w.getAttribute('data-quotes')); } catch (e) { return; }
    if (!list || list.length < 2) return;
    var bq = w.querySelector('blockquote'), cur = bq.textContent, q, tries = 0;
    do { q = list[Math.floor(Math.random() * list.length)]; tries++; } while (('\u201c' + q.t + '\u201d') === cur && tries < 8);
    bq.textContent = '\u201c' + q.t + '\u201d';
    var av = w.querySelector('.w-av');
    if (q.a) { var im = document.createElement('img'); im.src = q.a; im.alt = ''; im.width = 34; im.height = 34; av.replaceChildren(im); }
    else { var sp = document.createElement('span'); sp.className = 'av-init'; sp.style.cssText = 'width:34px;height:34px'; sp.textContent = q.i || ''; av.replaceChildren(sp); }
    w.querySelector('.w-by b').textContent = q.n;
    w.querySelector('.w-by i').textContent = q.r;
  }

  /* ---------- spotlight search ---------- */
  var spot = { el: null, data: null, loading: null, items: [], sel: 0, btn: document.querySelector('.mb-search') };
  var norm = function (s) { return String(s).toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0131/g, 'i'); };
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (spot.btn && !isMac) { var kb = spot.btn.querySelector('.mb-kbd'); if (kb) kb.textContent = 'Ctrl K'; }

  function loadIndex() {
    if (spot.data) return Promise.resolve(spot.data);
    if (!spot.loading) spot.loading = fetch(body.getAttribute('data-base') + '/search-' + lang + '.json').then(function (r) { return r.json(); }).then(function (d) {
      d.forEach(function (e) { e.h = norm(e.t + ' ' + (e.d || '') + ' ' + e.s); e.n = norm(e.t); }); spot.data = d; return d;
    });
    return spot.loading;
  }
  function highlight(node, text, tokens) {
    var n = norm(text), ranges = [];
    tokens.forEach(function (t) { var i = n.indexOf(t); if (i > -1) ranges.push([i, i + t.length]); });
    if (!ranges.length || n.length !== text.length) { node.textContent = text; return; }
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var pos = 0;
    ranges.forEach(function (r) {
      if (r[0] < pos) return;
      node.appendChild(document.createTextNode(text.slice(pos, r[0])));
      var m = document.createElement('mark'); m.textContent = text.slice(r[0], r[1]); node.appendChild(m); pos = r[1];
    });
    node.appendChild(document.createTextNode(text.slice(pos)));
  }
  function render(q) {
    if (!spot.data) return;
    var list = spot.el.querySelector('.spot-list'); list.textContent = '';
    var tokens = norm(q).split(/\s+/).filter(Boolean), res;
    if (!tokens.length) res = spot.data.filter(function (e) { return e.k; });
    else res = spot.data.map(function (e, i) {
      for (var k = 0; k < tokens.length; k++) if (e.h.indexOf(tokens[k]) < 0) return null;
      return { e: e, sc: (e.n.indexOf(tokens[0]) === 0 ? 0 : e.n.indexOf(tokens[0]) > -1 ? 1 : 2) + (e.k ? -0.5 : 0), i: i };
    }).filter(Boolean).sort(function (a, b) { return a.sc - b.sc || a.i - b.i; }).slice(0, 9).map(function (x) { return x.e; });
    spot.items = res; spot.sel = 0;
    if (!res.length) { var li = document.createElement('li'); li.className = 'spot-empty'; li.textContent = spot.btn.getAttribute('data-empty'); list.appendChild(li); return; }
    if (!tokens.length) { var h = document.createElement('li'); h.className = 'spot-h'; h.setAttribute('role', 'presentation'); h.textContent = spot.btn.getAttribute('data-sections'); list.appendChild(h); }
    res.forEach(function (e, i) {
      var li = document.createElement('li'); li.className = 'spot-item'; li.id = 'spot-o' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      var st = document.createElement('span'); st.className = 'st'; var b = document.createElement('b'), sm = document.createElement('small');
      highlight(b, e.t, tokens); sm.textContent = e.d || ''; st.append(b, sm);
      var sb = document.createElement('span'); sb.className = 'sb'; sb.textContent = e.s;
      li.append(st, sb);
      li.addEventListener('mousemove', function () { select(i); });
      li.addEventListener('click', function () { choose(i); });
      list.appendChild(li);
    });
    spot.el.querySelector('input').setAttribute('aria-activedescendant', 'spot-o0');
  }
  function select(i) {
    var opts = spot.el.querySelectorAll('.spot-item'); if (!opts.length) return;
    spot.sel = (i + opts.length) % opts.length;
    opts.forEach(function (o, k) { o.setAttribute('aria-selected', k === spot.sel ? 'true' : 'false'); });
    var cur = opts[spot.sel]; cur.scrollIntoView({ block: 'nearest' });
    spot.el.querySelector('input').setAttribute('aria-activedescendant', cur.id);
  }
  function choose(i) {
    var e = spot.items[i]; if (!e) return;
    closeSpot();
    if (e.v) openVirtual(e.v).catch(function () { location.href = '/'; });
    else if (e.e) window.open(e.u, '_blank', 'noopener');
    else if (e.u.indexOf('/projects/') > -1) location.href = e.u;
    else go(e.u);
  }
  function closeSpot() {
    if (!spot.el) return;
    spot.el.hidden = true; document.body.style.overflow = '';
    if (spot.btn) spot.btn.setAttribute('aria-expanded', 'false');
    if (spot.prev && spot.prev.focus) spot.prev.focus();
  }
  function openSpot() {
    if (!spot.btn) return;
    spot.prev = document.activeElement;
    if (!spot.el) {
      var el = document.createElement('div'); el.className = 'spot'; el.hidden = true;
      el.innerHTML = '<div class="spot-panel" role="dialog" aria-modal="true" aria-label="' + spot.btn.getAttribute('aria-label') + '"><div class="spot-bar"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg><input type="text" role="combobox" aria-expanded="true" aria-controls="spot-list" aria-autocomplete="list" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"><kbd>esc</kbd></div><ul class="spot-list" id="spot-list" role="listbox"></ul><div class="spot-foot"><span>\u2191\u2193</span><span>\u21b5 ' + spot.btn.getAttribute('data-hint') + '</span></div></div>';
      document.body.appendChild(el); spot.el = el;
      var input = el.querySelector('input'); input.placeholder = spot.btn.getAttribute('data-ph');
      input.addEventListener('input', function () { render(input.value); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); select(spot.sel + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); select(spot.sel - 1); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(spot.sel); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSpot(); }
      });
      el.addEventListener('mousedown', function (e) { if (e.target === el) closeSpot(); });
    }
    spot.el.hidden = false; spot.btn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
    var inp = spot.el.querySelector('input'); inp.value = ''; inp.focus();
    loadIndex().then(function () { render(inp.value); }).catch(function () {});
  }
  if (spot.btn) spot.btn.addEventListener('click', openSpot);
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSpot(); }
    else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); openSpot(); }
  });

  /* ---------- random certificates (6 at a time) ---------- */
  function randomCerts() {
    var w = document.querySelector('.w-certs[data-certs]');
    if (!w) return;
    var list; try { list = JSON.parse(w.getAttribute('data-certs')); } catch (e) { return; }
    for (var i = list.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[k]; list[k] = t; }
    var box = w.querySelector('.w-thumbs'); box.textContent = '';
    list.slice(0, 6).forEach(function (c) {
      var im = document.createElement('img'); im.src = c.i; im.alt = c.t; im.title = c.t; im.width = 120; im.height = 68; im.onerror = function () { if (!im.dataset.r) { im.dataset.r = '1'; im.src = c.i + '?r=1'; } }; box.appendChild(im);
    });
  }

  /* ---------- global wiring ---------- */
  document.addEventListener('click', function (e) {
    var v = e.target.closest('a[data-vapp]');
    if (v && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && Desk.apps[v.getAttribute('data-vapp')]) { e.preventDefault(); openVirtual(v.getAttribute('data-vapp')).catch(function () { location.href = v.href; }); return; }
    var a = e.target.closest('a[data-app]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); go(a.getAttribute('href'));
  });
  document.addEventListener('pointerenter', function (e) {
    var a = e.target.closest && e.target.closest('a[data-app]');
    if (a) fetchDoc(a.getAttribute('href')).catch(function () {});
  }, true);
  window.addEventListener('popstate', function () {
    var s = slugOf(location.pathname);
    if (s === null) return;
    if (s === '') showDesktop(false); else openApp(s, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wide.matches && active && !(e.target.matches && e.target.matches('input,textarea,select')) && !document.querySelector('.ql:not([hidden]),.lock:not([hidden]),.cc:not([hidden]),.ctx:not([hidden])') && !(spot.el && !spot.el.hidden) && !(themeMenu && !themeMenu.hidden)) closeWin(active);
  });

  document.querySelectorAll('.window[data-slug]').forEach(function (w) { register(w.getAttribute('data-slug'), w); active = w.getAttribute('data-slug'); w.style.zIndex = ++zTop; });
  chrome();
  typewriter(); randomQuote(); randomCerts();
})();
