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

  /* ---------- theme ---------- */
  var themeBtn = document.querySelector('.mb-theme');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var root = document.documentElement;
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

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
    if (e.key === 'Escape' && wide.matches && document.getElementById('win')) go(body.getAttribute('data-home'));
  });

  initWindow(document.getElementById('win'));
})();
