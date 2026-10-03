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

  /* ---------- window behaviour ---------- */
  function setFilter(win, id) {
    win.querySelectorAll('.side-item').forEach(function (a) {
      if (a.getAttribute('data-filter') === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    win.querySelectorAll('[data-cat]').forEach(function (n) { n.hidden = !(id === 'all' || n.getAttribute('data-cat') === id); });
    win.querySelectorAll('[data-group]').forEach(function (n) { n.hidden = n.getAttribute('data-group') !== id; });
    var main = win.querySelector('.win-main'); if (main) main.scrollTop = 0;
  }

  function initWindow(win) {
    if (!win) return;
    var side = win.querySelector('.win-side');
    if (side) {
      side.addEventListener('click', function (e) {
        var a = e.target.closest('.side-item'); if (!a) return;
        e.preventDefault(); setFilter(win, a.getAttribute('data-filter'));
      });
      var def = side.querySelector('[data-default]');
      if (def) setFilter(win, def.getAttribute('data-filter'));
    }
    var g = win.querySelector('.dot.g'), y = win.querySelector('.dot.y');
    if (g) g.addEventListener('click', function () { win.classList.toggle('is-max'); });
    if (y) y.addEventListener('click', function () { win.classList.add('is-min'); body.classList.add('has-min'); });
    var bar = win.querySelector('.titlebar');
    if (bar) {
      bar.addEventListener('dblclick', function (e) { if (!e.target.closest('.dot, a') && wide.matches) win.classList.toggle('is-max'); });
      bar.addEventListener('pointerdown', function (e) {
        if (!wide.matches || e.button !== 0 || win.classList.contains('is-max') || e.target.closest('.dot, a')) return;
        var r = win.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, moved = false;
        bar.setPointerCapture(e.pointerId);
        function mv(ev) {
          if (!moved) {
            moved = true;
            win.classList.add('is-moved');
            win.style.width = r.width + 'px'; win.style.height = r.height + 'px'; win.style.right = 'auto'; win.style.bottom = 'auto';
          }
          var x = Math.min(Math.max(ev.clientX - sx, 60 - r.width), innerWidth - 60);
          var yy = Math.min(Math.max(ev.clientY - sy, 32), innerHeight - 44);
          win.style.left = x + 'px'; win.style.top = yy + 'px';
        }
        function up(ev) { bar.releasePointerCapture(ev.pointerId); bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); }
        bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up);
      });
    }
  }

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
    if (e.e) window.open(e.u, '_blank', 'noopener');
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

  /* ---------- soft navigation ---------- */
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

  var HEAD_SYNC = ['meta[name="description"]', 'link[rel="canonical"]', 'link[rel="alternate"]', 'meta[property^="og:"]', 'meta[name^="twitter:"]', 'script[type="application/ld+json"]'];
  function syncHead(doc) {
    document.title = doc.title;
    HEAD_SYNC.forEach(function (sel) {
      document.head.querySelectorAll(sel).forEach(function (n) { n.remove(); });
      doc.head.querySelectorAll(sel).forEach(function (n) { document.head.appendChild(document.importNode(n, true)); });
    });
  }

  function apply(doc, push, href) {
    var main = document.getElementById('main');
    var old = document.getElementById('win');
    if (old) old.remove();
    ['.hello', '.widgets'].forEach(function (sel) {
      var cur = main.querySelector(sel), nxt = doc.querySelector(sel);
      if (cur && nxt) cur.replaceWith(document.importNode(nxt, true));
    });
    var win = doc.getElementById('win');
    if (win) { win = document.importNode(win, true); main.appendChild(win); }
    body.className = doc.body.className;
    ['.mb-menu', '.mb-app', '.mb-lang', '.icons', '.dock'].forEach(function (sel) {
      var cur = document.querySelector(sel), nxt = doc.querySelector(sel);
      if (cur && nxt) cur.replaceWith(document.importNode(nxt, true));
    });
    body.classList.remove('has-min');
    syncHead(doc);
    if (push) history.pushState({ soft: 1 }, '', href);
    initWindow(win);
    typewriter(); randomQuote(); randomCerts();
    var h = win ? win.querySelector('h1') : document.querySelector('.hello-name');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    if (!win) { var d = document.querySelector('.desktop'); if (d) d.scrollTop = 0; }
  }

  function go(href, push) {
    var cur = document.getElementById('win');
    if (push !== false && cur && cur.classList.contains('is-min') && new URL(href, location.href).pathname === location.pathname) {
      cur.classList.remove('is-min'); body.classList.remove('has-min'); return;
    }
    if (new URL(href, location.href).pathname === location.pathname && push !== false) return;
    fetchDoc(href).then(function (doc) { apply(doc, push !== false, href); }).catch(function () { location.href = href; });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-app]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); go(a.getAttribute('href'));
  });
  document.addEventListener('pointerenter', function (e) {
    var a = e.target.closest && e.target.closest('a[data-app]');
    if (a) fetchDoc(a.getAttribute('href')).catch(function () {});
  }, true);
  window.addEventListener('popstate', function () { go(location.pathname + location.search, false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wide.matches && document.getElementById('win') && !(spot.el && !spot.el.hidden) && !(themeMenu && !themeMenu.hidden)) go(body.getAttribute('data-home'));
  });

  initWindow(document.getElementById('win'));
  typewriter(); randomQuote(); randomCerts();
})();
