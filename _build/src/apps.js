/* berkayvuran.com extra apps (Calculator, Clock, Calendar, Activity Monitor, Music, Reminders, Preview,
   Whiteboard, Minesweeper, About This Site). Loaded the first time one of them is opened. Needs desk.js + extras.js. */
(function () {
  'use strict';
  var D = window.Desk; if (!D || D.apps.calculator) return;
  var body = document.body, root = document.documentElement, lang = body.getAttribute('data-lang') || 'en', tr = lang === 'tr';
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function btn(cls, txt, fn) { var b = el('button', cls, txt); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
  function json(k, def) { try { var v = JSON.parse(store.get(k) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function alive(node) { return node.isConnected && document.body.contains(node); }
  var ctxA = null;
  function beep(times) {
    var v = D.prefs ? D.prefs.vol() : 60; if (!v) return;
    try {
      ctxA = ctxA || new (window.AudioContext || window.webkitAudioContext)(); if (ctxA.state === 'suspended') ctxA.resume();
      for (var i = 0; i < (times || 1); i++) {
        var t = ctxA.currentTime + i * 0.32, o = ctxA.createOscillator(), g = ctxA.createGain();
        o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.001, v / 100 * 0.25), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        o.connect(g); g.connect(ctxA.destination); o.start(t); o.stop(t + 0.28);
      }
    } catch (e) {}
  }
  /* small helper: run fn every ms while the app's window exists */
  /* run fn once node is attached to the page (windows are mounted right after build) */
  function whenAlive(node, fn) { var n = 0; (function w() { if (alive(node)) fn(); else if (n++ < 120) requestAnimationFrame(w); })(); }
  function every(node, ms, fn) { requestAnimationFrame(function () { if (alive(node)) fn(); }); var id = setInterval(function () { if (!alive(node)) { clearInterval(id); return; } fn(); }, ms); return id; }

  /* ================= Calculator ================= */
  D.apps.calculator = {
    focus: function (w) { var m = w.querySelector('.win-main'); if (m && D.wide.matches) m.focus({ preventScroll: true }); },
    build: function (main) {
      main.classList.add('ap', 'calc'); main.tabIndex = 0;
      var dec = tr ? ',' : '.', grp = tr ? '.' : ',';
      main.innerHTML = '<div class="ca-top"><div class="ca-expr" aria-hidden="true"></div><output class="ca-out" aria-live="polite">0</output></div><div class="ca-keys"></div>';
      var out = main.querySelector('.ca-out'), expr = main.querySelector('.ca-expr'), keys = main.querySelector('.ca-keys');
      var cur = '0', acc = null, op = null, fresh = true, justEq = false;
      function show(s) {
        var neg = s.charAt(0) === '-', raw = neg ? s.slice(1) : s;
        if (/e/.test(raw) || raw === 'Infinity' || raw === 'NaN') { out.textContent = (neg ? '-' : '') + raw; return; }
        var p = raw.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, grp);
        out.textContent = (neg ? '-' : '') + p.join(dec);
        out.style.fontSize = out.textContent.length > 11 ? '34px' : out.textContent.length > 8 ? '46px' : '';
      }
      function num(s) { return parseFloat(s); }
      function str(n) { if (!isFinite(n)) return null; return String(+n.toPrecision(12)); }
      function compute(a, b, o) { return o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b === 0 ? NaN : a / b; }
      function fail() { cur = '0'; acc = null; op = null; fresh = true; out.textContent = tr ? 'Hata' : 'Error'; expr.textContent = ''; }
      function digit(d) {
        if (fresh) { cur = d === '.' ? '0.' : d; fresh = false; }
        else if (d === '.') { if (cur.indexOf('.') < 0) cur += '.'; }
        else if (cur.replace(/[-.]/g, '').length < 12) cur = cur === '0' ? d : cur === '-0' ? '-' + d : cur + d;
        justEq = false; show(cur); clearBtn.textContent = 'C';
      }
      function operator(o) {
        if (op && !fresh) { var r = str(compute(acc, num(cur), op)); if (r == null) return fail(); cur = r; show(cur); }
        acc = num(cur); op = o; fresh = true; justEq = false; expr.textContent = out.textContent + ' ' + o;
        keys.querySelectorAll('.op').forEach(function (b) { b.classList.toggle('on', b.textContent === o); });
      }
      function equals() {
        if (op == null) return;
        var b = num(cur), r = str(compute(acc, b, op)); if (r == null) return fail();
        expr.textContent = acc + ' ' + op + ' ' + b + ' ='; cur = r; acc = null; op = null; fresh = true; justEq = true; show(cur);
        keys.querySelectorAll('.op').forEach(function (x) { x.classList.remove('on'); });
      }
      function clear() {
        if (clearBtn.textContent === 'C' && !fresh) { cur = '0'; fresh = true; show(cur); clearBtn.textContent = 'AC'; return; }
        cur = '0'; acc = null; op = null; fresh = true; justEq = false; show(cur); expr.textContent = ''; clearBtn.textContent = 'AC';
        keys.querySelectorAll('.op').forEach(function (x) { x.classList.remove('on'); });
      }
      function sign() { if (cur === '0') return; cur = cur.charAt(0) === '-' ? cur.slice(1) : '-' + cur; if (fresh) fresh = false; show(cur); }
      function percent() { var r = str(num(cur) / 100); if (r == null) return fail(); cur = r; fresh = true; show(cur); }
      var clearBtn;
      var layout = [['AC', 'fn', clear], ['±', 'fn', sign], ['%', 'fn', percent], ['÷', 'op', function () { operator('÷'); }],
        ['7'], ['8'], ['9'], ['×', 'op', function () { operator('×'); }], ['4'], ['5'], ['6'], ['−', 'op', function () { operator('−'); }],
        ['1'], ['2'], ['3'], ['+', 'op', function () { operator('+'); }], ['0', 'zero'], [dec], ['=', 'op eq', equals]];
      layout.forEach(function (k) {
        var b = btn('ca-k ' + (k[1] || 'num'), k[0], k[2] || function () { digit(k[0] === dec ? '.' : k[0]); });
        if (k[0] === 'AC') clearBtn = b; keys.appendChild(b);
      });
      main.addEventListener('keydown', function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        var k = e.key, handled = true;
        if (/^[0-9]$/.test(k)) digit(k); else if (k === '.' || k === ',') digit('.');
        else if (k === '+') operator('+'); else if (k === '-') operator('−'); else if (k === '*' || k === 'x' || k === 'X') operator('×'); else if (k === '/') operator('÷');
        else if (k === 'Enter' || k === '=') equals(); else if (k === '%') percent();
        else if (k === 'Backspace') { if (!fresh && cur.length > 1) { cur = cur.slice(0, -1); if (cur === '-') cur = '0'; show(cur); } else { cur = '0'; fresh = true; show(cur); } }
        else if (k === 'Escape' || k === 'Delete') clear(); else handled = false;
        if (handled) { e.preventDefault(); e.stopPropagation(); }
      });
    }
  };

  /* ================= Clock: world, stopwatch, timer, alarm ================= */
  var CT = tr ? { world: 'Dünya Saati', sw: 'Kronometre', timer: 'Zamanlayıcı', alarm: 'Alarm', start: 'Başlat', stop: 'Durdur', lap: 'Tur', reset: 'Sıfırla', min: 'dk', sec: 'sn', done: 'Süre doldu', ring: 'Alarm', dismiss: 'Kapat', add: 'Ekle', label: 'Etiket', note: 'Alarmlar bu sayfa açıkken çalar.', today: 'Bugün', tom: 'Yarın', yes: 'Dün', hrs: 'sa', none: 'Alarm yok', cont: 'Devam', pause: 'Duraklat' } :
    { world: 'World Clock', sw: 'Stopwatch', timer: 'Timer', alarm: 'Alarm', start: 'Start', stop: 'Stop', lap: 'Lap', reset: 'Reset', min: 'min', sec: 'sec', done: 'Time is up', ring: 'Alarm', dismiss: 'Dismiss', add: 'Add', label: 'Label', note: 'Alarms ring while this page is open.', today: 'Today', tom: 'Tomorrow', yes: 'Yesterday', hrs: 'h', none: 'No alarms', cont: 'Resume', pause: 'Pause' };
  var CITIES = [['Istanbul', 'İstanbul', 'Europe/Istanbul'], ['London', 'Londra', 'Europe/London'], ['New York', 'New York', 'America/New_York'], ['San Francisco', 'San Francisco', 'America/Los_Angeles'], ['Dubai', 'Dubai', 'Asia/Dubai'], ['Tokyo', 'Tokyo', 'Asia/Tokyo'], ['Sydney', 'Sidney', 'Australia/Sydney']];
  function tzParts(tz, d) {
    var p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return { h: +p.hour % 24, m: +p.minute, s: +p.second, day: Date.UTC(+p.year, +p.month - 1, +p.day), ms: Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) };
  }
  D.apps.clock = {
    build: function (main) {
      main.classList.add('ap', 'clk');
      var tabs = el('div', 'ap-tabs'), pane = el('div', 'clk-pane'); main.appendChild(tabs); main.appendChild(pane);
      var names = [['world', CT.world], ['sw', CT.sw], ['timer', CT.timer], ['alarm', CT.alarm]], cur = store.get('clkTab') || 'world', tabBtns = {}, timers = [];
      names.forEach(function (n) { tabBtns[n[0]] = btn('ap-tab', n[1], function () { go(n[0]); }); tabs.appendChild(tabBtns[n[0]]); });
      var sw = { run: false, t0: 0, acc: 0, laps: [] }, tm = { run: false, end: 0, left: 0, total: 0 };
      var alarms = json('alarms', []), fired = '';
      function fmtSw(ms) { var c = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000); return pad2(m) + ':' + pad2(s) + '.' + pad2(c); }
      function ringBanner(text) {
        var b = el('div', 'al-banner'); b.setAttribute('role', 'alertdialog'); b.appendChild(el('b', null, text)); b.appendChild(btn('btn', CT.dismiss, function () { b.remove(); }));
        body.appendChild(b); beep(4); setTimeout(function () { if (b.isConnected) b.remove(); }, 20000);
      }
      /* these two keep running when you switch tabs */
      setInterval(function () {
        if (!alive(main)) { return; }
        if (tm.run && Date.now() >= tm.end) { tm.run = false; tm.left = 0; ringBanner(CT.done); if (cur === 'timer') render(); }
        var d = new Date(), hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
        if (hm !== fired) alarms.forEach(function (a) { if (a.on && a.t === hm) { fired = hm; ringBanner(CT.ring + ' ' + hm + (a.l ? ' · ' + a.l : '')); } });
      }, 1000);
      function go(t) { cur = t; store.set('clkTab', t); render(); }
      function render() {
        timers.forEach(clearInterval); timers = []; pane.textContent = '';
        Object.keys(tabBtns).forEach(function (k) { tabBtns[k].setAttribute('aria-pressed', k === cur ? 'true' : 'false'); });
        if (cur === 'world') world(); else if (cur === 'sw') stopwatch(); else if (cur === 'timer') timer(); else alarm();
      }
      function world() {
        var face = el('div', 'clk-face'); face.innerHTML = '<svg viewBox="-50 -50 100 100" aria-hidden="true"><circle r="47" class="cf-ring"/>' + (function () { var s = ''; for (var i = 0; i < 12; i++) s += '<line class="cf-t" x1="0" y1="-41" x2="0" y2="-' + (i % 3 ? 44 : 38) + '" transform="rotate(' + i * 30 + ')"/>'; return s; })() + '<line class="cf-h" id="cfh" x1="0" y1="2" x2="0" y2="-24"/><line class="cf-m" id="cfm" x1="0" y1="3" x2="0" y2="-36"/><line class="cf-s" id="cfs" x1="0" y1="8" x2="0" y2="-40"/><circle r="2.4" class="cf-c"/></svg>';
        pane.appendChild(face);
        var list = el('ul', 'clk-list'); pane.appendChild(list);
        CITIES.forEach(function (c) { var li = el('li'); li.innerHTML = '<span class="cl-c"><b></b><small></small></span><span class="cl-t"></span>'; li.querySelector('b').textContent = tr ? c[1] : c[0]; list.appendChild(li); c.li = li; });
        timers.push(every(main, 1000, function () {
          var now = new Date(), loc = tzParts(Intl.DateTimeFormat().resolvedOptions().timeZone, now);
          face.querySelector('#cfh').setAttribute('transform', 'rotate(' + ((loc.h % 12) * 30 + loc.m / 2) + ')'); face.querySelector('#cfm').setAttribute('transform', 'rotate(' + (loc.m * 6 + loc.s / 10) + ')'); face.querySelector('#cfs').setAttribute('transform', 'rotate(' + loc.s * 6 + ')');
          CITIES.forEach(function (c) {
            var p = tzParts(c[2], now), diff = Math.round((p.ms - loc.ms) / 36e5), dd = Math.round((p.day - loc.day) / 864e5);
            c.li.querySelector('.cl-t').textContent = pad2(p.h) + ':' + pad2(p.m);
            c.li.querySelector('small').textContent = (dd === 0 ? CT.today : dd > 0 ? CT.tom : CT.yes) + (diff ? ', ' + (diff > 0 ? '+' : '') + diff + CT.hrs : '');
          });
        }));
      }
      function stopwatch() {
        var big = el('div', 'sw-big', fmtSw(sw.acc + (sw.run ? performance.now() - sw.t0 : 0))), row = el('div', 'sw-row'), laps = el('ol', 'sw-laps');
        var a = btn('ck-b', sw.run ? CT.lap : CT.reset, function () {
          if (sw.run) { var t = sw.acc + performance.now() - sw.t0; sw.laps.unshift(t); drawLaps(); } else { sw = { run: false, t0: 0, acc: 0, laps: [] }; render(); }
        });
        var b = btn('ck-b go' + (sw.run ? ' stop' : ''), sw.run ? CT.stop : CT.start, function () {
          if (sw.run) { sw.acc += performance.now() - sw.t0; sw.run = false; } else { sw.t0 = performance.now(); sw.run = true; } render();
        });
        row.appendChild(a); row.appendChild(b); pane.appendChild(big); pane.appendChild(row); pane.appendChild(laps);
        function drawLaps() { laps.textContent = ''; sw.laps.forEach(function (t, i) { var prev = sw.laps[i + 1] || 0, li = el('li'); li.innerHTML = '<span></span><span></span>'; li.children[0].textContent = CT.lap + ' ' + (sw.laps.length - i); li.children[1].textContent = fmtSw(t - prev) + '  ·  ' + fmtSw(t); laps.appendChild(li); }); }
        drawLaps();
        if (sw.run) timers.push(setInterval(function () { if (alive(main)) big.textContent = fmtSw(sw.acc + performance.now() - sw.t0); }, 33));
      }
      function timer() {
        var big = el('div', 'sw-big'), prog = el('div', 'tm-prog'), bar = el('i'); prog.appendChild(bar);
        function left() { return tm.run ? Math.max(0, tm.end - Date.now()) : tm.left; }
        function draw() { var l = left(), s = Math.ceil(l / 1000); big.textContent = pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); bar.style.width = (tm.total ? (100 - l / tm.total * 100) : 0) + '%'; }
        var mi = el('input'); mi.type = 'number'; mi.min = 0; mi.max = 999; mi.value = Math.floor((tm.total || 300000) / 60000); mi.setAttribute('aria-label', CT.min);
        var si = el('input'); si.type = 'number'; si.min = 0; si.max = 59; si.value = Math.floor(((tm.total || 300000) % 60000) / 1000); si.setAttribute('aria-label', CT.sec);
        var inputs = el('div', 'tm-in2'); [[mi, CT.min], [si, CT.sec]].forEach(function (x) { var l = el('label'); l.appendChild(x[0]); l.appendChild(el('span', null, x[1])); inputs.appendChild(l); });
        var presets = el('div', 'tm-pre'); [1, 5, 10, 25].forEach(function (m) { presets.appendChild(btn('ap-chip', m + ' ' + CT.min, function () { tm = { run: false, end: 0, left: m * 60000, total: m * 60000 }; render(); })); });
        var row = el('div', 'sw-row');
        row.appendChild(btn('ck-b', CT.reset, function () { tm = { run: false, end: 0, left: tm.total, total: tm.total }; render(); }));
        row.appendChild(btn('ck-b go' + (tm.run ? ' stop' : ''), tm.run ? CT.pause : (tm.left && tm.left < tm.total ? CT.cont : CT.start), function () {
          if (tm.run) { tm.left = Math.max(0, tm.end - Date.now()); tm.run = false; }
          else { if (!tm.left || tm.left >= tm.total && tm.total === 0) { var t = (+mi.value || 0) * 60000 + (+si.value || 0) * 1000; if (!t) return; tm.total = t; tm.left = t; } tm.end = Date.now() + tm.left; tm.run = true; }
          render();
        }));
        if (!tm.run && (!tm.left || tm.left === tm.total)) { pane.appendChild(inputs); inputs.addEventListener('input', function () { var t = (+mi.value || 0) * 60000 + (+si.value || 0) * 1000; tm.total = t; tm.left = t; draw(); }); }
        pane.appendChild(big); pane.appendChild(prog); pane.appendChild(row); pane.appendChild(presets); draw();
        if (tm.run) timers.push(setInterval(function () { if (alive(main)) draw(); }, 200));
      }
      function alarm() {
        var form = el('form', 'al-form'), ti = el('input'); ti.type = 'time'; ti.value = '07:30'; ti.required = true; ti.setAttribute('aria-label', CT.alarm);
        var li = el('input'); li.type = 'text'; li.placeholder = CT.label; li.maxLength = 30; li.setAttribute('aria-label', CT.label);
        form.appendChild(ti); form.appendChild(li); form.appendChild(btn('btn', CT.add)); form.lastChild.type = 'submit';
        var ul = el('ul', 'al-list'); pane.appendChild(form); pane.appendChild(ul); pane.appendChild(el('p', 'ap-note', CT.note));
        function save() { store.set('alarms', JSON.stringify(alarms)); }
        function draw() {
          ul.textContent = ''; if (!alarms.length) { ul.appendChild(el('li', 'ap-empty', CT.none)); return; }
          alarms.slice().sort(function (a, b) { return a.t < b.t ? -1 : 1; }).forEach(function (a) {
            var r = el('li'), t = el('div', 'al-t'); t.appendChild(el('b', null, a.t)); if (a.l) t.appendChild(el('small', null, a.l));
            var sw2 = el('button', 'st-switch'); sw2.type = 'button'; sw2.setAttribute('role', 'switch'); sw2.setAttribute('aria-label', a.t); sw2.setAttribute('aria-checked', a.on ? 'true' : 'false'); sw2.appendChild(el('i'));
            sw2.addEventListener('click', function () { a.on = !a.on; save(); draw(); });
            var del = btn('ap-x', '×', function () { alarms.splice(alarms.indexOf(a), 1); save(); draw(); }); del.setAttribute('aria-label', 'Delete');
            r.appendChild(t); r.appendChild(sw2); r.appendChild(del); ul.appendChild(r);
          });
        }
        form.addEventListener('submit', function (e) { e.preventDefault(); if (!ti.value) return; alarms.push({ t: ti.value, l: li.value.trim(), on: true }); li.value = ''; save(); draw(); });
        draw();
      }
      render();
    }
  };

  /* ================= Calendar ================= */
  D.apps.calendar = {
    build: function (main, d) {
      main.classList.add('ap', 'cal2');
      var T = tr ? { today: 'Bugün', events: 'Etkinlikler', none: 'Etkinlik yok', add: 'Ekle', ph: 'Yeni etkinlik', ms: 'Kilometre taşları' } : { today: 'Today', events: 'Events', none: 'No events', add: 'Add', ph: 'New event', ms: 'Milestones' };
      var ev = json('calEv', {}), now = new Date(), view = new Date(now.getFullYear(), now.getMonth(), 1), sel = key(now);
      function key(dt) { return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate()); }
      main.innerHTML = '<div class="cl-grid"><div class="cl-head"><b class="cl-title"></b><span><button type="button" class="ap-x" data-n="-1" aria-label="‹">‹</button><button type="button" class="ap-chip" data-n="0"></button><button type="button" class="ap-x" data-n="1" aria-label="›">›</button></span></div><div class="cl-dow"></div><div class="cl-days"></div></div><aside class="cl-side"><h3></h3><ul class="cl-ev"></ul><form class="cl-add"><input type="text" maxlength="60"><button class="btn" type="submit"></button></form><h3 class="cl-mh"></h3><ul class="cl-ms"></ul></aside>';
      var title = main.querySelector('.cl-title'), days = main.querySelector('.cl-days'), dow = main.querySelector('.cl-dow'), evl = main.querySelector('.cl-ev'), sideH = main.querySelector('.cl-side h3');
      main.querySelector('[data-n="0"]').textContent = T.today; main.querySelector('.cl-add input').placeholder = T.ph; main.querySelector('.cl-add button').textContent = T.add; main.querySelector('.cl-mh').textContent = T.ms;
      for (var i = 0; i < 7; i++) dow.appendChild(el('span', null, new Date(2024, 0, 1 + i).toLocaleDateString(tr ? 'tr-TR' : 'en-GB', { weekday: 'short' })));
      var msl = main.querySelector('.cl-ms'); d.cv.experience.slice(0, 8).forEach(function (x) { var li = el('li'); li.appendChild(el('small', null, x.d)); li.appendChild(el('span', null, x.r + (x.o ? ' @ ' + x.o : ''))); msl.appendChild(li); });
      function save() { store.set('calEv', JSON.stringify(ev)); }
      function draw() {
        title.textContent = view.toLocaleDateString(tr ? 'tr-TR' : 'en-GB', { month: 'long', year: 'numeric' }); days.textContent = '';
        var first = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7, n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        for (var i = 0; i < first; i++) days.appendChild(el('span', 'cl-blank'));
        for (var dd = 1; dd <= n; dd++) {
          (function (dd) {
            var k = view.getFullYear() + '-' + pad2(view.getMonth() + 1) + '-' + pad2(dd), b = btn('cl-d' + (k === key(now) ? ' today' : '') + (k === sel ? ' sel' : ''), String(dd), function () { sel = k; draw(); });
            if (ev[k] && ev[k].length) b.appendChild(el('i')); days.appendChild(b);
          })(dd);
        }
        var sd = new Date(sel + 'T12:00'); sideH.textContent = sd.toLocaleDateString(tr ? 'tr-TR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        evl.textContent = ''; var list = ev[sel] || [];
        if (!list.length) evl.appendChild(el('li', 'ap-empty', T.none));
        list.forEach(function (t, i) { var li = el('li'); li.appendChild(el('span', null, t)); var x = btn('ap-x', '×', function () { list.splice(i, 1); if (!list.length) delete ev[sel]; save(); draw(); }); x.setAttribute('aria-label', 'Delete'); li.appendChild(x); evl.appendChild(li); });
      }
      main.addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; var v = +b.getAttribute('data-n'); if (v === 0) { view = new Date(now.getFullYear(), now.getMonth(), 1); sel = key(now); } else view = new Date(view.getFullYear(), view.getMonth() + v, 1); draw(); });
      main.querySelector('.cl-add').addEventListener('submit', function (e) { e.preventDefault(); var inp = e.target.querySelector('input'), t = inp.value.trim(); if (!t) return; (ev[sel] = ev[sel] || []).push(t); inp.value = ''; save(); draw(); });
      draw();
    }
  };

  /* ================= Activity Monitor ================= */
  var MT = tr ? { win: 'Pencere', fps: 'FPS', busy: 'Ana iş parçacığı', heap: 'JS belleği', up: 'Çalışma süresi', proc: 'Süreç', pid: 'PID', nodes: 'Öğe', state: 'Durum', act: 'Etkin', bg: 'Arka planda', min: 'Küçültülmüş', quit: 'Zorla Kapat', na: 'yok', note: 'Öğe: pencerenin içindeki DOM öğesi sayısı. Değerler tarayıcıdan gerçek zamanlı okunur.', none: 'Açık pencere yok' } :
    { win: 'Windows', fps: 'FPS', busy: 'Main thread', heap: 'JS memory', up: 'Uptime', proc: 'Process', pid: 'PID', nodes: 'Nodes', state: 'State', act: 'Active', bg: 'Background', min: 'Minimized', quit: 'Force Quit', na: 'n/a', note: 'Nodes: DOM elements inside the window. Values are read live from the browser.', none: 'No open windows' };
  var pids = {}, nextPid = 1000;
  D.apps.monitor = {
    build: function (main) {
      main.classList.add('ap', 'mon');
      main.innerHTML = '<div class="mo-cards"></div><div class="mo-tbl"><div class="mo-h"><span>' + MT.proc + '</span><span>' + MT.pid + '</span><span>' + MT.nodes + '</span><span>' + MT.state + '</span></div><div class="mo-rows" role="listbox"></div></div><div class="mo-foot"><p class="ap-note"></p><button type="button" class="btn mo-q" disabled></button></div>';
      var cards = main.querySelector('.mo-cards'), rows = main.querySelector('.mo-rows'), q = main.querySelector('.mo-q'); q.textContent = MT.quit; main.querySelector('.ap-note').textContent = MT.note;
      var sel = null, fps = 60, busy = null, hist = { fps: [], busy: [] }, frames = 0, t0 = performance.now(), longMs = 0;
      var cvs = {}; ['fps', 'busy'].forEach(function (k) { var c = el('canvas'); c.width = 120; c.height = 36; cvs[k] = c; });
      function card(label, valId) { var c = el('div', 'mo-c'); c.appendChild(el('small', null, label)); c.appendChild(el('b', null, '-')); c.id = valId; return c; }
      var cW = card(MT.win, 'm1'), cF = card(MT.fps, 'm2'), cB = card(MT.busy, 'm3'), cH = card(MT.heap, 'm4'), cU = card(MT.up, 'm5');
      cF.appendChild(cvs.fps); cB.appendChild(cvs.busy); [cW, cF, cB, cH, cU].forEach(function (c) { cards.appendChild(c); });
      try { var po = new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { longMs += e.duration; }); }); po.observe({ entryTypes: ['longtask'] }); busy = 0; main._po = po; } catch (e) { busy = null; }
      whenAlive(main, function raf() { if (!alive(main)) { if (main._po) main._po.disconnect(); return; } frames++; requestAnimationFrame(raf); });
      function spark(c, arr, max, color) {
        var g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); if (arr.length < 2) return; g.strokeStyle = color; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath();
        arr.forEach(function (v, i) { var x = i / 59 * (c.width - 2) + 1, y = c.height - 3 - Math.min(1, v / max) * (c.height - 6); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
      }
      function tick() {
        var now = performance.now(), dt = (now - t0) / 1000; if (dt >= 0.6) { fps = Math.round(frames / dt); frames = 0; t0 = now; } else { dt = 1; }
        hist.fps.push(fps); if (hist.fps.length > 60) hist.fps.shift(); cF.querySelector('b').textContent = String(fps); spark(cvs.fps, hist.fps, 70, '#30d158');
        if (busy === null) { cB.querySelector('b').textContent = MT.na; } else { var bp = Math.min(100, Math.round(longMs / (dt * 10))); longMs = 0; hist.busy.push(bp); if (hist.busy.length > 60) hist.busy.shift(); cB.querySelector('b').textContent = bp + '%'; spark(cvs.busy, hist.busy, 100, '#ff9f0a'); }
        var pm = performance.memory; cH.querySelector('b').textContent = pm ? (pm.usedJSHeapSize / 1048576).toFixed(1) + ' MB' : MT.na;
        var s = Math.round(now / 1000); cU.querySelector('b').textContent = s >= 3600 ? Math.floor(s / 3600) + 'h ' + Math.floor(s % 3600 / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + s % 60 + 's' : s + 's';
        var list = D.list().sort(function (a, b) { return b.z - a.z; }); cW.querySelector('b').textContent = String(list.length);
        rows.textContent = ''; if (!list.length) rows.appendChild(el('div', 'ap-empty', MT.none));
        list.forEach(function (w) {
          if (!pids[w.slug]) pids[w.slug] = nextPid++; var node = document.querySelector('.window[data-slug="' + w.slug + '"]');
          var r = el('div', 'mo-r' + (sel === w.slug ? ' sel' : '')); r.setAttribute('role', 'option'); r.setAttribute('aria-selected', sel === w.slug ? 'true' : 'false');
          r.appendChild(el('span', null, w.title)); r.appendChild(el('span', null, String(pids[w.slug]))); r.appendChild(el('span', null, String(node ? node.querySelectorAll('*').length : 0))); r.appendChild(el('span', null, w.min ? MT.min : w.active ? MT.act : MT.bg));
          r.addEventListener('click', function () { sel = w.slug; q.disabled = false; tick(); }); rows.appendChild(r);
        });
        if (sel && !list.some(function (w) { return w.slug === sel; })) { sel = null; q.disabled = true; }
      }
      q.addEventListener('click', function () { if (sel) { var s = sel; sel = null; q.disabled = true; D.closeWin(s); setTimeout(tick, 350); } });
      every(main, 1000, tick);
    }
  };

  /* ================= Music ================= */
  D.apps.music = {
    build: function (main) {
      main.classList.add('ap', 'mus');
      var P = D.prefs.music, T = tr ? { np: 'Çalıyor', idle: 'Durduruldu', vol: 'Ses' } : { np: 'Now playing', idle: 'Stopped', vol: 'Volume' }, last = Math.max(0, P.cur());
      main.innerHTML = '<div class="mu-wrap"><div class="mu-art"><canvas width="360" height="200"></canvas></div><div class="mu-meta"><small></small><b></b></div><div class="mu-ctl"></div><label class="mu-vol"><span></span><input type="range" min="0" max="100" step="5"></label><ol class="mu-list"></ol></div>';
      var cv = main.querySelector('canvas'), g = cv.getContext('2d'), small = main.querySelector('small'), name = main.querySelector('.mu-meta b'), ctl = main.querySelector('.mu-ctl'), list = main.querySelector('.mu-list'), vol = main.querySelector('input');
      main.querySelector('.mu-vol span').textContent = T.vol; vol.value = String(D.prefs.vol()); vol.setAttribute('aria-label', T.vol);
      vol.addEventListener('input', function () { D.prefs.setVol(+vol.value); });
      var prev = btn('mu-b', '⏮', function () { var i = (Math.max(0, P.cur()) - 1 + P.tracks.length) % P.tracks.length; last = i; P.set(i); });
      var play = btn('mu-b big', '▶', function () { if (P.cur() >= 0 && playing()) P.set(-1); else P.set(last); });
      var next = btn('mu-b', '⏭', function () { var i = (Math.max(0, P.cur()) + 1) % P.tracks.length; last = i; P.set(i); });
      prev.setAttribute('aria-label', 'Previous'); next.setAttribute('aria-label', 'Next'); ctl.appendChild(prev); ctl.appendChild(play); ctl.appendChild(next);
      function playing() { return !!P.analyser() || P.cur() >= 0; }
      P.tracks.forEach(function (n, i) { var li = el('li'); li.appendChild(btn('mu-t', n, function () { last = i; P.set(i); })); list.appendChild(li); });
      function paint() {
        var c = P.cur(), on = c >= 0; if (on) last = c; small.textContent = on ? T.np : T.idle; name.textContent = P.tracks[on ? c : last];
        play.textContent = on ? '⏸' : '▶'; play.setAttribute('aria-label', on ? 'Pause' : 'Play');
        list.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-pressed', on && i === c ? 'true' : 'false'); });
        vol.value = String(D.prefs.vol());
      }
      document.addEventListener('desk:music', function () { if (alive(main)) paint(); }); paint();
      var data = new Uint8Array(64), still = 0;
      whenAlive(main, function draw() {
        if (!alive(main)) return; requestAnimationFrame(draw);
        var w = cv.width, h = cv.height, an = P.analyser(), acc = getComputedStyle(root).getPropertyValue('--accent').trim() || '#007AFF';
        g.clearRect(0, 0, w, h); var n = 32, bw = w / n; if (an) an.getByteFrequencyData(data); else { still += 0.04; }
        for (var i = 0; i < n; i++) { var v = an ? data[i] / 255 : 0.06 + 0.04 * Math.sin(still + i * 0.5); var bh = Math.max(3, v * h * 0.95); g.fillStyle = acc; g.globalAlpha = 0.35 + v * 0.65; g.beginPath(); g.roundRect ? g.roundRect(i * bw + 2, h - bh, bw - 4, bh, 3) : g.rect(i * bw + 2, h - bh, bw - 4, bh); g.fill(); }
        g.globalAlpha = 1;
      });
    }
  };

  /* ================= Reminders ================= */
  D.apps.reminders = {
    focus: function (w) { var i = w.querySelector('.rm-in input'); if (i && D.wide.matches) i.focus({ preventScroll: true }); },
    build: function (main) {
      main.classList.add('ap', 'rem');
      var T = tr ? { ph: 'Yeni anımsatıcı', add: 'Ekle', none: 'Her şey tamam', clear: 'Tamamlananları temizle', left: 'kaldı', note: 'Liste yalnızca bu tarayıcıda saklanır.' } : { ph: 'New reminder', add: 'Add', none: 'All done', clear: 'Clear completed', left: 'left', note: 'Saved only in this browser.' };
      var items = json('rem', []);
      main.innerHTML = '<div class="rm-top"><h2></h2><span class="rm-c"></span></div><ul class="rm-list"></ul><form class="rm-in"><input type="text" maxlength="120"><button class="btn" type="submit"></button></form><div class="rm-foot"><button type="button" class="ap-chip"></button><p class="ap-note"></p></div>';
      var ul = main.querySelector('.rm-list'), cnt = main.querySelector('.rm-c'), inp = main.querySelector('input'), clr = main.querySelector('.rm-foot button');
      main.querySelector('h2').textContent = tr ? 'Anımsatıcılar' : 'Reminders'; inp.placeholder = T.ph; inp.setAttribute('aria-label', T.ph); main.querySelector('.rm-in .btn').textContent = T.add; clr.textContent = T.clear; main.querySelector('.ap-note').textContent = T.note;
      function save() { store.set('rem', JSON.stringify(items)); }
      function draw() {
        ul.textContent = ''; var open = items.filter(function (x) { return !x.d; }).length; cnt.textContent = open + ' ' + T.left; clr.hidden = !items.some(function (x) { return x.d; });
        if (!items.length) ul.appendChild(el('li', 'ap-empty', T.none));
        items.forEach(function (x) {
          var li = el('li', x.d ? 'done' : ''), cb = el('button', 'rm-cb'); cb.type = 'button'; cb.setAttribute('role', 'checkbox'); cb.setAttribute('aria-checked', x.d ? 'true' : 'false'); cb.setAttribute('aria-label', x.t);
          cb.addEventListener('click', function () { x.d = !x.d; save(); draw(); });
          var del = btn('ap-x', '×', function () { items.splice(items.indexOf(x), 1); save(); draw(); }); del.setAttribute('aria-label', 'Delete');
          li.appendChild(cb); li.appendChild(el('span', null, x.t)); li.appendChild(del); ul.appendChild(li);
        });
      }
      main.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var t = inp.value.trim(); if (!t) return; items.unshift({ t: t, d: 0 }); inp.value = ''; save(); draw(); });
      clr.addEventListener('click', function () { items = items.filter(function (x) { return !x.d; }); save(); draw(); });
      draw();
    }
  };

  /* ================= Preview ================= */
  D.apps.preview = {
    build: function (main, d) {
      main.classList.add('ap', 'pv');
      var T = tr ? { open: 'Aç', dl: 'İndir', pick: 'Soldan bir dosya seç' } : { open: 'Open', dl: 'Download', pick: 'Pick a file on the left' };
      var files = (d.files || []).filter(function (f) { return f.k === 'pdf' || f.k === 'img'; });
      main.innerHTML = '<ul class="pv-list" role="listbox"></ul><div class="pv-view"></div>';
      var list = main.querySelector('.pv-list'), view = main.querySelector('.pv-view');
      function show(f, li) {
        list.querySelectorAll('li').forEach(function (n) { n.setAttribute('aria-selected', n === li ? 'true' : 'false'); }); view.textContent = '';
        var bar = el('div', 'pv-bar'); bar.appendChild(el('b', null, f.n));
        var a = el('a', 'ap-chip', T.open); a.href = f.u; a.target = '_blank'; a.rel = 'noopener noreferrer'; bar.appendChild(a);
        var dl = el('a', 'ap-chip', T.dl); dl.href = f.u; dl.download = f.n; bar.appendChild(dl); view.appendChild(bar);
        if (f.k === 'img') { var im = el('img'); im.src = f.u; im.alt = f.n; view.appendChild(im); }
        else if (D.wide.matches) { var fr = el('iframe'); fr.src = f.u + '#toolbar=0&view=FitH'; fr.title = f.n; view.appendChild(fr); }
        else { var c = el('div', 'pv-pdf'); c.appendChild(el('b', null, 'PDF')); var oa = el('a', 'btn', T.open); oa.href = f.u; oa.target = '_blank'; oa.rel = 'noopener noreferrer'; c.appendChild(oa); view.appendChild(c); }
      }
      files.forEach(function (f, i) { var li = el('li'); li.setAttribute('role', 'option'); li.tabIndex = 0; li.appendChild(el('span', 'pv-k', f.k === 'pdf' ? 'PDF' : 'IMG')); li.appendChild(el('span', 'pv-n', f.n)); li.addEventListener('click', function () { show(f, li); }); li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(f, li); } }); list.appendChild(li); if (i === 0 && D.wide.matches) show(f, li); });
      if (!D.wide.matches || !files.length) view.appendChild(el('p', 'ap-empty', T.pick));
    }
  };

  /* ================= Whiteboard ================= */
  D.apps.board = {
    build: function (main) {
      main.classList.add('ap', 'wb');
      var T = tr ? { pen: 'Kalem', eraser: 'Silgi', undo: 'Geri al', clear: 'Temizle', save: 'PNG kaydet', size: 'Kalınlık' } : { pen: 'Pen', eraser: 'Eraser', undo: 'Undo', clear: 'Clear', save: 'Save PNG', size: 'Size' };
      main.innerHTML = '<div class="wb-bar"></div><div class="wb-paper"><canvas></canvas></div>';
      var bar = main.querySelector('.wb-bar'), paper = main.querySelector('.wb-paper'), cv = main.querySelector('canvas'), g = cv.getContext('2d');
      var colors = ['#1d1d1f', '#ff3b30', '#ff9500', '#34c759', '#007aff', '#af52de'], color = colors[0], size = 4, erase = false, strokes = [], cur = null, swatches = [];
      colors.forEach(function (c) { var b = btn('wb-c', '', function () { color = c; erase = false; paint(); }); b.style.background = c; b.setAttribute('aria-label', c); bar.appendChild(b); swatches.push([b, c]); });
      var sz = el('input'); sz.type = 'range'; sz.min = 1; sz.max = 24; sz.value = size; sz.setAttribute('aria-label', T.size); sz.addEventListener('input', function () { size = +sz.value; }); bar.appendChild(sz);
      var eb = btn('ap-chip', T.eraser, function () { erase = !erase; paint(); }); bar.appendChild(eb);
      bar.appendChild(btn('ap-chip', T.undo, function () { strokes.pop(); redraw(); }));
      bar.appendChild(btn('ap-chip', T.clear, function () { strokes = []; redraw(); }));
      bar.appendChild(btn('ap-chip', T.save, function () { var a = el('a'); a.download = 'whiteboard.png'; a.href = cv.toDataURL('image/png'); a.click(); }));
      function paint() { swatches.forEach(function (s) { s[0].setAttribute('aria-pressed', !erase && s[1] === color ? 'true' : 'false'); }); eb.setAttribute('aria-pressed', erase ? 'true' : 'false'); }
      paint();
      function fit() { var r = paper.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); if (!r.width) return; cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; g.setTransform(dpr, 0, 0, dpr, 0, 0); redraw(); }
      function line(s) { g.lineCap = g.lineJoin = 'round'; g.strokeStyle = s.e ? '#ffffff' : s.c; g.lineWidth = s.e ? s.s * 3 : s.s; g.beginPath(); s.p.forEach(function (pt, i) { if (i) g.lineTo(pt[0], pt[1]); else g.moveTo(pt[0], pt[1]); }); if (s.p.length === 1) g.lineTo(s.p[0][0] + 0.01, s.p[0][1]); g.stroke(); }
      function redraw() { g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height); strokes.forEach(line); }
      function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); cur = { c: color, s: size, e: erase, p: [pt(e)] }; strokes.push(cur); line(cur); });
      cv.addEventListener('pointermove', function (e) { if (!cur) return; cur.p.push(pt(e)); var n = cur.p.length; g.lineCap = 'round'; g.strokeStyle = cur.e ? '#fff' : cur.c; g.lineWidth = cur.e ? cur.s * 3 : cur.s; g.beginPath(); g.moveTo(cur.p[n - 2][0], cur.p[n - 2][1]); g.lineTo(cur.p[n - 1][0], cur.p[n - 1][1]); g.stroke(); });
      ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { cur = null; }); });
      if ('ResizeObserver' in window) new ResizeObserver(function () { if (alive(main)) fit(); }).observe(paper); else { window.addEventListener('resize', fit); }
      setTimeout(fit, 30);
    }
  };

  /* ================= Minesweeper ================= */
  D.apps.mines = {
    build: function (main) {
      main.classList.add('ap', 'ms');
      var T = tr ? { easy: 'Kolay', mid: 'Orta', flag: 'Bayrak', won: 'Kazandın!', lost: 'Patladı', mines: 'mayın' } : { easy: 'Easy', mid: 'Medium', flag: 'Flag', won: 'You won!', lost: 'Boom', mines: 'mines' };
      main.innerHTML = '<div class="ms-bar"><span class="ms-n" aria-live="off"></span><button type="button" class="ms-face" aria-label="Restart">🙂</button><span class="ms-t">000</span></div><div class="ms-lv"></div><div class="ms-board" role="grid"></div><p class="ms-msg" role="status"></p>';
      var board = main.querySelector('.ms-board'), face = main.querySelector('.ms-face'), nEl = main.querySelector('.ms-n'), tEl = main.querySelector('.ms-t'), msg = main.querySelector('.ms-msg'), lv = main.querySelector('.ms-lv');
      var LV = { easy: [9, 9, 10], mid: [12, 12, 24] }, level = store.get('msLevel') === 'mid' ? 'mid' : 'easy', flagMode = false, S, timer = null;
      var modes = {}; ['easy', 'mid'].forEach(function (k) { modes[k] = btn('ap-chip', T[k], function () { level = k; store.set('msLevel', k); init(); }); lv.appendChild(modes[k]); });
      var fm = btn('ap-chip ms-fm', '🚩 ' + T.flag, function () { flagMode = !flagMode; fm.setAttribute('aria-pressed', flagMode ? 'true' : 'false'); }); lv.appendChild(fm);
      function init() {
        clearInterval(timer); timer = null; var c = LV[level]; S = { w: c[0], h: c[1], m: c[2], cells: [], over: false, started: false, left: c[0] * c[1] - c[2], flags: 0, t: 0 };
        for (var i = 0; i < S.w * S.h; i++) S.cells.push({ mine: false, open: false, flag: false, n: 0 });
        face.textContent = '🙂'; msg.textContent = ''; Object.keys(modes).forEach(function (k) { modes[k].setAttribute('aria-pressed', k === level ? 'true' : 'false'); });
        board.style.setProperty('--cols', S.w); board.style.setProperty('--rows', S.h); draw(); counters();
      }
      function counters() { nEl.textContent = String(S.m - S.flags).padStart(3, '0') + ' ' + T.mines; tEl.textContent = String(Math.min(999, S.t)).padStart(3, '0'); }
      function nb(i) { var x = i % S.w, y = Math.floor(i / S.w), o = []; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; var nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < S.w && ny < S.h) o.push(ny * S.w + nx); } return o; }
      function plant(safe) {
        var ban = {}; ban[safe] = 1; nb(safe).forEach(function (j) { ban[j] = 1; }); var placed = 0;
        while (placed < S.m) { var r = Math.floor(Math.random() * S.cells.length); if (!S.cells[r].mine && !ban[r]) { S.cells[r].mine = true; placed++; } }
        S.cells.forEach(function (c, i) { c.n = nb(i).filter(function (j) { return S.cells[j].mine; }).length; });
      }
      function reveal(i) {
        var stack = [i];
        while (stack.length) { var k = stack.pop(), c = S.cells[k]; if (c.open || c.flag) continue; c.open = true; S.left--; if (c.n === 0 && !c.mine) nb(k).forEach(function (j) { if (!S.cells[j].open) stack.push(j); }); }
      }
      function end(win) {
        S.over = true; clearInterval(timer); face.textContent = win ? '😎' : '😵'; msg.textContent = win ? T.won : T.lost;
        if (!win) S.cells.forEach(function (c) { if (c.mine) c.open = true; }); else S.cells.forEach(function (c) { if (c.mine) c.flag = true; }); S.flags = win ? S.m : S.flags; draw(); counters();
      }
      function act(i, flag) {
        if (S.over) return; var c = S.cells[i];
        if (flag || flagMode) { if (!c.open) { c.flag = !c.flag; S.flags += c.flag ? 1 : -1; draw(); counters(); } return; }
        if (c.flag) return;
        if (!S.started) { S.started = true; plant(i); timer = setInterval(function () { if (!alive(main)) { clearInterval(timer); return; } S.t++; counters(); }, 1000); }
        if (c.open) { /* chord */ var fl = nb(i).filter(function (j) { return S.cells[j].flag; }).length; if (c.n && fl === c.n) nb(i).forEach(function (j) { if (!S.cells[j].flag && !S.cells[j].open) { if (S.cells[j].mine) { S.cells[j].open = true; end(false); } else reveal(j); } }); }
        else if (c.mine) { c.open = true; end(false); return; } else reveal(i);
        if (!S.over && S.left <= 0) { end(true); return; } draw();
      }
      function draw() {
        board.textContent = '';
        S.cells.forEach(function (c, i) {
          var b = el('button', 'ms-c' + (c.open ? ' open' : '') + (c.open && c.mine ? ' mine' : '') + (c.open && c.n ? ' n' + c.n : '')); b.type = 'button';
          b.textContent = c.open ? (c.mine ? '💣' : c.n || '') : c.flag ? '🚩' : '';
          b.addEventListener('click', function () { act(i, false); }); b.addEventListener('contextmenu', function (e) { e.preventDefault(); act(i, true); });
          var lp = 0; b.addEventListener('touchstart', function () { lp = setTimeout(function () { lp = -1; act(i, true); }, 450); }, { passive: true });
          b.addEventListener('touchend', function (e) { if (lp === -1) { e.preventDefault(); } clearTimeout(lp); }); board.appendChild(b);
        });
      }
      face.addEventListener('click', init); init();
    }
  };

  /* ================= About This Site ================= */
  D.apps.sysinfo = {
    build: function (main, d) {
      main.classList.add('ap', 'sys');
      var T = tr ? { os: 'Sistem', ver: 'Sürüm', built: 'Derleme', browser: 'Tarayıcı', display: 'Ekran', up: 'Çalışma süresi', wins: 'Açık pencere', apps: 'Uygulama', kernel: 'Çekirdek', kv: 'Henüz yazılmadı', kn: 'Belki bir sonraki adımda?', copy: 'Bilgiyi kopyala', copied: 'Kopyalandı', lang: 'Dil' } :
        { os: 'System', ver: 'Version', built: 'Build', browser: 'Browser', display: 'Display', up: 'Uptime', wins: 'Open windows', apps: 'Apps', kernel: 'Kernel', kv: 'Not written yet', kn: 'Maybe the next stage?', copy: 'Copy info', copied: 'Copied', lang: 'Language' };
      var ua = navigator.userAgent, br = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
      var built = d.ui.built ? new Date(d.ui.built + 'T12:00').toLocaleDateString(tr ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
      main.innerHTML = '<div class="sy-logo" aria-hidden="true">BV</div><h2>BerkayOS</h2><p class="sy-sub">1.0 · Sonnet 5.5 edition</p><dl class="sy-dl"></dl><div class="sy-act"></div>';
      var dl = main.querySelector('.sy-dl'), vals = {};
      function row(k, v, id) { var a = el('dt', null, k), b = el('dd', null, v); dl.appendChild(a); dl.appendChild(b); if (id) vals[id] = b; return b; }
      row(T.os, 'berkayvuran.com'); row(T.ver, '1.0'); row(T.built, built); row(T.browser, br); row(T.display, innerWidth + ' × ' + innerHeight + ' @' + (window.devicePixelRatio || 1) + 'x', 'disp'); row(T.lang, tr ? 'Türkçe' : 'English');
      row(T.apps, String(document.querySelectorAll('.icons a.icon').length + 1)); row(T.wins, '-', 'wins'); row(T.up, '-', 'up');
      var kb = row(T.kernel, T.kv); kb.classList.add('sy-kernel'); kb.appendChild(el('small', null, T.kn));
      var copy = btn('ap-chip', T.copy, function () { var t = ['BerkayOS 1.0 (Sonnet 5.5 edition)'].concat([].map.call(dl.querySelectorAll('dt'), function (n) { return n.textContent + ': ' + n.nextSibling.textContent.replace(T.kn, '').trim(); })).join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { copy.textContent = T.copied; setTimeout(function () { copy.textContent = T.copy; }, 1500); }, function () {}); });
      main.querySelector('.sy-act').appendChild(copy);
      every(main, 1000, function () { var s = Math.round(performance.now() / 1000); vals.up.textContent = s >= 3600 ? Math.floor(s / 3600) + 'h ' + Math.floor(s % 3600 / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + s % 60 + 's' : s + 's'; vals.wins.textContent = String(D.list().length); vals.disp.textContent = innerWidth + ' × ' + innerHeight + ' @' + (window.devicePixelRatio || 1) + 'x'; });
    }
  };
})();
