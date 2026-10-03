/* berkayvuran.com: iOS / iPadOS behaviour (home pager, app zoom animation, gestures, Settings app).
   Runs on touch devices and narrow screens only; Desk comes from desk.js, prefs from extras.js. */
(function () {
  'use strict';
  var D = window.Desk; if (!D) return;
  var body = document.body, root = document.documentElement;
  var lang = body.getAttribute('data-lang') || 'en';
  var mq = window.matchMedia('(max-width:1099px),(min-width:1100px) and (hover:none)');
  function on() { return mq.matches; }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= Settings app (the one place for theme, wallpaper, language, display, sound on touch devices) ================= */
  var IC = {
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5s1.2-6.1 3.8-8.5z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/></svg>',
    mc: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="7.5" height="6" rx="1.5"/><rect x="13" y="5" width="7.5" height="6" rx="1.5"/><rect x="3.5" y="13" width="17" height="6" rx="1.5"/></svg>',
    person: '<svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="3.6"/><path d="M3.5 20c0-3.6 2.9-6 6.5-6 1.4 0 2.6.3 3.6 1M18 14v6M15 17h6"/></svg>',
    glass: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 9c1.5-1.4 3-1.8 4.5-1.8"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5l4.5 3.5v-12L7.5 9.5z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a8 8 0 010 11"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3L15 13l5 4.5"/></svg>',
    palette: '<svg viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 100 17c1.3 0 2-.9 2-1.8 0-1.2-1.1-1.5-1.1-2.7 0-1 .8-1.7 1.9-1.7H17a3.5 3.5 0 003.5-3.5C20.500 6.700 16.800 3.500 12 3.500z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7.500" r="1"/><circle cx="15.500" cy="8.500" r="1"/></svg>'
  };
  var WALL_SW = { default: 'linear-gradient(135deg,#1c2233,#0a1a33)', aurora: 'linear-gradient(135deg,#0b3a3a,#6b2fa0)', sunset: 'linear-gradient(135deg,#ff9500,#ff2d55)', ocean: 'linear-gradient(135deg,#0a84ff,#5ac8fa)' };
  var SET = lang === 'tr' ? { app: 'Görünüm', disp: 'Ekran ve Ses', gen: 'Genel', check: '' } : { app: 'Appearance', disp: 'Display & Sound', gen: 'General', check: '' };

  D.apps.settings = {
    build: function (main, d) {
      var u = d.ui, P = D.prefs;
      main.classList.add('st');
      function ico(name, color) { var s = el('span', 'st-ic'); s.style.background = color; s.innerHTML = IC[name]; return s; }
      function group(title) { var g = el('section', 'st-g'); if (title) g.appendChild(el('h3', null, title)); var ul = el('ul'); ul.setAttribute('role', 'list'); g.appendChild(ul); main.appendChild(g); return ul; }
      function row(ul, icon, color, label, right, onClick) {
        var li = el('li'), b = el(onClick ? 'button' : 'div', 'st-r'); if (onClick) b.type = 'button';
        if (icon) b.appendChild(ico(icon, color)); b.appendChild(el('span', 'st-l', label));
        if (right) { var r = typeof right === 'string' ? el('span', 'st-v', right) : right; b.appendChild(r); }
        if (onClick) b.addEventListener('click', onClick);
        li.appendChild(b); ul.appendChild(li); return b;
      }
      /* appearance: theme */
      var ul = group(u.ccTheme), themeBtns = [];
      d.themes.forEach(function (t) {
        var b = row(ul, null, '', t.e + '  ' + t.n, el('span', 'st-ck', '✓'), function () { D.setTheme(t.id); paint(); });
        b.setAttribute('data-t', t.id); themeBtns.push(b);
      });
      /* wallpaper */
      var wl = group(u.ccWall), wallBtns = [];
      P.WALLS.forEach(function (w) {
        var sw = el('span', 'st-sw'); sw.style.background = WALL_SW[w];
        var b = row(wl, null, '', u.walls[w], el('span', 'st-ck', '✓'), function () { P.setWall(w); paint(); });
        b.insertBefore(sw, b.firstChild); b.setAttribute('data-w', w); wallBtns.push(b);
      });
      /* display + sound */
      var dl = group(SET.disp);
      var gl = row(dl, 'glass', '#5E5CE6', u.ccGlass, null, null);
      var sw = el('button', 'st-switch'); sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-label', u.ccGlass); sw.appendChild(el('i'));
      sw.addEventListener('click', function () { D.setGlass(!D.glassOn()); paint(); }); gl.appendChild(sw);
      function sliderRow(icon, color, label, min, max, step, get, set) {
        var li = el('li', 'st-sl'), top = el('div', 'st-r'); top.appendChild(ico(icon, color)); top.appendChild(el('span', 'st-l', label)); li.appendChild(top);
        var inp = el('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = get(); inp.setAttribute('aria-label', label);
        inp.addEventListener('input', function () { set(+inp.value); }); li.appendChild(inp); dl.appendChild(li); return inp;
      }
      sliderRow('sun', '#FF9F0A', u.ccBright, 40, 100, 1, P.bright, P.setBright);
      var vs = sliderRow('sound', '#FF375F', u.ccSound, 0, 100, 5, P.vol, P.setVol); vs.addEventListener('change', P.blip);
      /* general */
      var g = group(SET.gen);
      var la = el('a', 'st-r st-link'); la.href = D.langHref(); la.appendChild(ico('globe', '#0A84FF')); la.appendChild(el('span', 'st-l', u.ccLang)); la.appendChild(el('span', 'st-v', u.otherShort)); la.appendChild(el('span', 'st-chev', '›'));
      var lli = el('li'); lli.appendChild(la); g.appendChild(lli);
      row(g, 'lock', '#8E8E93', u.ccLock, el('span', 'st-chev', '›'), function () { D.lock(); });
      row(g, 'mc', '#30B0C7', u.ccMC, el('span', 'st-chev', '›'), function () { D.missionControl(); });
      var vc = el('a', 'st-r st-link'); vc.href = (document.body.getAttribute('data-base') || '') + '/berkay-vuran.vcf'; vc.download = 'berkay-vuran.vcf';
      vc.appendChild(ico('person', '#34C759')); vc.appendChild(el('span', 'st-l', u.addContact)); vc.appendChild(el('span', 'st-chev', '›'));
      var li = el('li'); li.appendChild(vc); g.appendChild(li);
      main.appendChild(el('p', 'st-foot', 'berkayvuran.com'));
      function paint() {
        var cur = root.getAttribute('data-theme'), w = P.wall();
        themeBtns.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-t') === cur ? 'true' : 'false'); });
        wallBtns.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-w') === w ? 'true' : 'false'); });
        sw.setAttribute('aria-checked', D.glassOn() ? 'true' : 'false');
      }
      paint();
    }
  };

  /* ================= touch / narrow screens only ================= */
  var inited = false;
  function init() {
    if (inited || !on()) return; inited = true;
    var desktop = document.querySelector('.desktop'), pager = document.querySelector('.pager'), home = pager && pager.querySelector('.pg-home');
    var search = document.querySelector('.mb-search');

    /* ---- footer: page dots, search pill, home indicator ---- */
    var foot = el('div', 'ios-foot');
    var dots = el('div', 'ios-dots'); dots.setAttribute('aria-hidden', 'true'); dots.appendChild(el('i')); dots.appendChild(el('i', 'on'));
    var pill = el('button', 'ios-search'); pill.type = 'button';
    pill.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg><span></span>';
    pill.querySelector('span').textContent = search ? search.getAttribute('aria-label') : 'Search';
    pill.addEventListener('click', function () { if (search) search.click(); });
    foot.appendChild(dots); foot.appendChild(pill); body.appendChild(foot);
    var hi = el('div', 'ios-hi'); hi.setAttribute('aria-hidden', 'true'); body.appendChild(hi);
    var multi = el('button', 'ios-multi'); multi.type = 'button'; multi.setAttribute('aria-label', 'Mission Control'); multi.innerHTML = '<i></i><i></i><i></i>';
    multi.addEventListener('click', function () { D.missionControl(); }); body.appendChild(multi);

    /* ---- home pager: Today View on the left, apps on the right (single column layouts only) ---- */
    if (pager) {
      var raf = 0;
      function single() { return pager.scrollWidth > pager.clientWidth + 4; }
      function toHome() { if (single()) pager.scrollLeft = pager.clientWidth; }
      toHome(); requestAnimationFrame(toHome);
      pager.addEventListener('scroll', function () {
        if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var i = Math.round(pager.scrollLeft / Math.max(1, pager.clientWidth)); dots.children[0].classList.toggle('on', i === 0); dots.children[1].classList.toggle('on', i !== 0); });
      }, { passive: true });
      dots.addEventListener('click', function (e) { var i = Array.prototype.indexOf.call(dots.children, e.target); if (i > -1) pager.scrollTo({ left: i * pager.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); });
    }

    /* ---- iOS app launch / close animation (zoom from and back to the icon) ---- */
    function iconRect(slug) {
      var a = document.querySelector('.icons a[data-app="' + slug + '"], .icons a[data-vapp="' + slug + '"], .dock a[data-app="' + slug + '"], .dock a[data-vapp="' + slug + '"]');
      var t = a && a.querySelector('.tile'); if (!t) return null;
      var r = t.getBoundingClientRect(); return r.width ? r : null;
    }
    function frames(r) {
      var W = innerWidth, H = innerHeight, sx = r.width / W, sy = r.height / H, dx = r.left + r.width / 2 - W / 2, dy = r.top + r.height / 2 - H / 2;
      return [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', opacity: 0.2, borderRadius: '120px' }, { transform: 'translate(0,0) scale(1,1)', opacity: 1, borderRadius: '0px' }];
    }
    document.addEventListener('desk:open', function (e) {
      if (!on() || reduce) return;
      var w = document.querySelector('.window[data-slug="' + e.detail.slug + '"]'); if (!w || !w.animate) return;
      var r = iconRect(e.detail.slug); if (!r) return;
      w.animate(frames(r), { duration: 420, easing: 'cubic-bezier(.32,.72,0,1)' });
      if (pager) pager.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.94)', opacity: .6 }], { duration: 420, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'none' });
    });
    D.exit = function (w, slug, done) {
      if (!on() || reduce || !w.animate) { done(); return; }
      var r = iconRect(slug); w.style.pointerEvents = 'none'; w.style.zIndex = '99';
      if (!r) { var a0 = w.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 220, easing: 'ease-out' }); a0.onfinish = done; return; }
      var f = frames(r).reverse(), a = w.animate(f, { duration: 360, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
      a.onfinish = done; a.oncancel = done;
      if (pager) pager.animate([{ transform: 'scale(.94)', opacity: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.32,.72,0,1)' });
    };

    /* ---- large title collapses into the navigation bar on scroll ---- */
    document.addEventListener('scroll', function (e) {
      var t = e.target; if (!t || !t.classList || !t.classList.contains('win-main')) return;
      var w = t.closest('.window'); if (w) w.classList.toggle('scrolled', t.scrollTop > 26);
    }, { capture: true, passive: true });

    /* ---- gestures: swipe up from the bottom = home, swipe in from the left edge = back, pull down on the home screen = search ---- */
    var g = null;
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || !on()) { g = null; return; }
      var t = e.touches[0]; g = { x: t.clientX, y: t.clientY, bottom: t.clientY > innerHeight - 36, left: t.clientX < 22, home: !!e.target.closest('.pg-home'), top: t.clientY > 40 };
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!g) return; var t = e.changedTouches[0], dx = t.clientX - g.x, dy = t.clientY - g.y, s = g; g = null;
      if (document.querySelector('.ql:not([hidden]), .lock, .mc, .cal')) return;
      var act = D.active();
      if (act && s.bottom && dy < -56 && Math.abs(dx) < 90) { D.closeWin(act); return; }
      if (act && s.left && dx > 72 && Math.abs(dy) < 70) { D.closeWin(act); return; }
      if (!act && s.home && s.top && dy > 90 && Math.abs(dx) < 60 && search && home && home.scrollTop <= 0) search.click();
    }, { passive: true });
  }
  init(); if (mq.addEventListener) mq.addEventListener('change', init);
})();
