/* Guessing game engine ("Neresi Burası?", "Bu Yemek Nereden?"): the game rules.
 * Only the room host runs this simulation. Everyone else receives snapshots and sends intents.
 * Pure JavaScript without DOM access, so the same file also runs under Node for the tests.
 * Secrecy rule: before the reveal a snapshot carries nothing about the photo but its opaque id and file name,
 * and no player's pin except the receiver's own. */
(function (root) {
  'use strict';

  const PROTOCOL = 1;          // host and guests must run the same rules
  const MAX_PLAYERS = 15;
  const NAME_MAX = 16;
  const ROUNDS = 5;
  const ROUND_TIMES = [120, 180, 300];
  const REVEAL_TIME = 20;      // seconds until the next round starts on its own
  const BOT_DELAY = [5, 40];   // seconds after the round start a bot places its pin
  const MAX_POINTS = 5000;
  // Guesses outside this box are refused; the map is limited to the same box.
  const BOUNDS = { latMin: 35.4, latMax: 42.6, lngMin: 25.2, lngMax: 45.3 };
  const EARTH_KM = 6371.0088;
  const AVATARS = ['🦊', '🐻', '🐼', '🐸', '🐙', '🦁', '🐯', '🐨', '🐵', '🦄', '🐧', '🐢'];
  const LOOK_RANGE = 8;
  const PALETTES = {
    skin: ['#f1c7a5', '#e2b08a', '#c98b66', '#a86d4c', '#7e4d35', '#f6d4b8', '#d9a07d', '#5c3a28'],
    hair: ['#2b1d14', '#4a3121', '#6b4a2f', '#1c1c1c', '#8a6a44', '#b5aea3', '#3a2618', '#9a4b2c'],
    shirt: ['#2b5fb8', '#c23b3b', '#2f8f5b', '#e0a52b', '#7a4bc4', '#1f9aa8', '#d85c9b', '#4a4f5c']
  };
  // [name, body] where body 0 is the Kadın figure and 1 the Erkek figure.
  const BOT_NAMES = [
    ['Bot Bülent', 1], ['Bot Nermin', 0], ['Bot Cemil', 1], ['Bot Şükran', 0], ['Bot Turgut', 1], ['Bot Feride', 0], ['Bot Hayri', 1], ['Bot Melahat', 0],
    ['Bot Rıza', 1], ['Bot Saniye', 0], ['Bot Kadriye', 0], ['Bot Necati', 1], ['Bot Sevim', 0], ['Bot Ferhat', 1], ['Bot Gülizar', 0]
  ];
  const BOT_LEVELS = {
    rookie: { label: 'Çaylak', sigma: 250 },
    pro: { label: 'Usta', sigma: 60 }
  };
  const TAKEOVER_LEVEL = 'rookie';   // a bot plays the seat of a player who dropped, at this level

  /* ---------------------------------------------------------------- helpers */
  function rand(room) { // mulberry32, seeded per room so tests are reproducible
    room.seed = (room.seed + 0x6D2B79F5) | 0;
    let a = room.seed;
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  }
  const between = (room, lo, hi) => lo + rand(room) * (hi - lo);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const round1 = x => Math.round(x * 10) / 10;
  const round6 = x => Math.round(x * 1e6) / 1e6;
  function gauss(room) { // Box-Muller
    const u = Math.max(1e-12, rand(room));
    const v = rand(room);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function shuffle(room, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand(room) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Great-circle distance in kilometres. */
  function haversineKm(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lng2 - lng1) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /** Province names compared without case, Turkish dots or circumflexes ("Hakkâri" equals "HAKKARI"). */
  function normProvince(s) {
    return String(s == null ? '' : s).trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  }
  const sameProvince = (a, b) => !!normProvince(a) && normProvince(a) === normProvince(b);

  function scoreFor(km, cfg, sameProv) {
    const scale = cfg && cfg.scoreScaleKm > 0 ? cfg.scoreScaleKm : 200;
    const bonus = cfg && cfg.provinceBonus > 0 && sameProv ? cfg.provinceBonus : 0;
    return Math.round(MAX_POINTS * Math.exp(-Math.max(0, km) / scale)) + bonus;
  }

  const inBounds = (lat, lng) => lat >= BOUNDS.latMin && lat <= BOUNDS.latMax && lng >= BOUNDS.lngMin && lng <= BOUNDS.lngMax;

  function cleanLook(look) {
    const out = { skin: 0, hair: 0, shirt: 0, body: 0 };
    if (!look || typeof look !== 'object') return null;
    for (const k of Object.keys(out)) {
      const v = Number(look[k]);
      out[k] = Number.isInteger(v) && v >= 0 && v < (k === 'body' ? 2 : LOOK_RANGE) ? v : 0;
    }
    return out;
  }

  function cleanName(s) {
    return String(s == null ? '' : s).replace(/[\p{Cc}<>]/gu, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX).trim();
  }

  const getPlayer = (room, id) => room.players.find(p => p.id === id) || null;
  const currentItem = room => (room.game && room.game.round > 0 ? room.items[room.game.order[room.game.round - 1]] : null);
  const nextId = (room, prefix) => prefix + (room.nextId++);

  function notify(room, pid, text, kind) {
    const list = room.notices[pid] || (room.notices[pid] = []);
    list.push({ id: room.nextId++, text, kind: kind || 'info' });
    if (list.length > 5) list.shift();
  }
  function notifyAll(room, text, kind, exceptId) {
    for (const p of room.players) if (!p.bot && p.id !== exceptId) notify(room, p.id, text, kind);
  }

  function validItem(it) {
    return !!it && typeof it === 'object' && typeof it.file === 'string' && Number.isFinite(it.lat) && Number.isFinite(it.lng);
  }

  /* ---------------------------------------------------------------- room and players */
  /**
   * items: the manifest items (only the host has them). opts: { scoreScaleKm, provinceBonus, provinceAt(lat, lng),
   * debugRoundTime, revealTime }; provinceAt is the host's province lookup, used for every guess when present.
   */
  function createRoom(code, hostId, seed, items, opts) {
    const o = opts || {};
    return {
      code: String(code || ''), hostId, seed: seed | 0, phase: 'lobby',
      settings: { roundTime: 180 },
      items: (Array.isArray(items) ? items : []).filter(validItem).map((it, i) => Object.assign({}, it, { id: typeof it.id === 'string' ? it.id : 'i' + (i + 1) })),
      cfg: {
        scoreScaleKm: Number(o.scoreScaleKm) > 0 ? Number(o.scoreScaleKm) : 200,
        provinceBonus: Number(o.provinceBonus) > 0 ? Number(o.provinceBonus) : 0,
        provinceAt: typeof o.provinceAt === 'function' ? o.provinceAt : null,
        debugRoundTime: Number(o.debugRoundTime) > 0 ? Number(o.debugRoundTime) : 0,
        revealTime: Number(o.revealTime) > 0 ? Number(o.revealTime) : REVEAL_TIME
      },
      players: [], nextId: 1, notices: {}, used: [], gameNo: 0, game: null
    };
  }

  function botLook(room, body) {
    return { skin: Math.floor(rand(room) * LOOK_RANGE), hair: Math.floor(rand(room) * LOOK_RANGE), shirt: Math.floor(rand(room) * LOOK_RANGE), body };
  }

  function addPlayer(room, info) {
    const bot = !!info.bot;
    if (getPlayer(room, info.id)) return { ok: false, reason: 'exists' };
    if (room.players.length >= MAX_PLAYERS) {
      const lastBot = [...room.players].reverse().find(p => p.bot);
      if (bot || !lastBot) return { ok: false, reason: 'full' };
      removePlayer(room, lastBot.id);
      notifyAll(room, `${lastBot.name} yerini yeni gelen arkadaşa bıraktı.`, 'info');
    }
    let name = cleanName(info.name);
    let look = cleanLook(info.look);
    if (bot) {
      const taken = new Set(room.players.map(p => p.name));
      const pick = BOT_NAMES.find(n => !taken.has(n[0]));
      name = pick ? pick[0] : `Bot ${room.players.length + 1}`;
      look = botLook(room, pick ? pick[1] : Math.floor(rand(room) * 2));
    }
    if (!name) name = `Oyuncu ${room.players.length + 1}`;
    const g = room.game;
    const player = {
      id: String(info.id), name, bot, look: look || { skin: 0, hair: 0, shirt: 0, body: 0 },
      emoji: bot ? '🤖' : (AVATARS.includes(info.emoji) ? info.emoji : AVATARS[0]),
      level: BOT_LEVELS[info.level] ? info.level : 'pro',
      online: true, takeover: false, score: 0, lastPoints: 0, rounds: [], guess: null,
      botAt: g ? g.elapsed + between(room, BOT_DELAY[0], BOT_DELAY[1]) : 0
    };
    room.players.push(player);
    if (room.phase !== 'lobby') notifyAll(room, `${player.name} oyuna katıldı.`, 'info', player.id);
    return { ok: true, player };
  }

  function removePlayer(room, id) {
    const p = getPlayer(room, id);
    if (!p) return false;
    room.players.splice(room.players.indexOf(p), 1);
    delete room.notices[id];
    return true;
  }

  /** Marks a human online or offline. During a game a bot plays an offline seat until its owner returns. */
  function setOnline(room, id, on) {
    const p = getPlayer(room, id);
    if (!p || p.bot) return;
    p.online = !!on;
    const inGame = room.phase === 'guess' || room.phase === 'reveal';
    if (inGame && p.takeover !== !on) {
      p.takeover = !on;
      if (p.takeover && room.game && !p.guess) p.botAt = Math.max(p.botAt, room.game.elapsed + between(room, 3, 10));
      notifyAll(room, on ? `${p.name} geri döndü.` : `${p.name} koptu, yerine bot oynuyor.`, 'info', p.id);
    }
    if (on) p.takeover = false;
  }

  function setProfile(room, id, info) {
    const p = getPlayer(room, id);
    if (!p || p.bot || !info) return;
    const name = cleanName(info.name);
    if (name) p.name = name;
    if (AVATARS.includes(info.emoji)) p.emoji = info.emoji;
    const look = cleanLook(info.look);
    if (look) p.look = look;
  }

  /* ---------------------------------------------------------------- game */
  /** The photos of one game: unseen ones first, so "Tekrar oyna" does not show the same photos again. */
  function pickOrder(room, n) {
    const all = room.items.map((_, i) => i);
    const fresh = shuffle(room, all.filter(i => !room.used.includes(i)));
    const old = shuffle(room, all.filter(i => room.used.includes(i)));
    const order = fresh.concat(old).slice(0, n);
    room.used = fresh.length >= n ? room.used.concat(order) : order.slice();
    return order;
  }

  function startGame(room, opts) {
    const o = opts || {};
    const wanted = Number(o.roundTime);
    const roundTime = room.cfg.debugRoundTime || (ROUND_TIMES.includes(wanted) ? wanted : room.settings.roundTime);
    const rounds = Math.min(ROUNDS, Number(o.rounds) > 0 ? Number(o.rounds) : ROUNDS, room.items.length);
    if (!rounds) return { ok: false, reason: 'no-items' };
    room.gameNo++;
    room.notices = {};
    room.game = { round: 0, rounds, roundTime, order: pickOrder(room, rounds), timeLeft: 0, elapsed: 0, revealLeft: 0, reveal: null, standings: null };
    for (const p of room.players) {
      p.score = 0; p.lastPoints = 0; p.rounds = []; p.guess = null;
      p.takeover = !p.bot && !p.online;
    }
    startRound(room);
    return { ok: true };
  }

  function startRound(room) {
    const g = room.game;
    g.round++;
    g.timeLeft = g.roundTime;
    g.elapsed = 0;
    g.reveal = null;
    for (const p of room.players) { p.guess = null; p.botAt = between(room, BOT_DELAY[0], BOT_DELAY[1]); }
    room.phase = 'guess';
  }

  function guess(room, p, intent) {
    if (room.phase !== 'guess') return { ok: false, reason: 'late' };
    if (p.guess) return { ok: false, reason: 'already' };
    const lat = intent.lat;
    const lng = intent.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, reason: 'invalid' };
    if (!inBounds(lat, lng)) return { ok: false, reason: 'range' };
    // The host's own lookup wins; the province a guest sends is only used when the host has none.
    const sent = typeof intent.province === 'string' ? cleanName(intent.province).slice(0, 40) : '';
    const province = room.cfg.provinceAt ? String(room.cfg.provinceAt(lat, lng) || '') : sent;
    p.guess = { lat: round6(lat), lng: round6(lng), province, at: round1(room.game.elapsed) };
    checkRoundEnd(room);
    return { ok: true };
  }

  function botGuess(room, p) {
    const item = currentItem(room);
    if (!item) return;
    const sigma = BOT_LEVELS[p.bot ? p.level : TAKEOVER_LEVEL].sigma;
    const north = gauss(room) * sigma;
    const east = gauss(room) * sigma;
    const lat = clamp(item.lat + north / 111.32, BOUNDS.latMin, BOUNDS.latMax);
    const lng = clamp(item.lng + east / (111.32 * Math.cos(item.lat * Math.PI / 180)), BOUNDS.lngMin, BOUNDS.lngMax);
    const province = room.cfg.provinceAt ? String(room.cfg.provinceAt(lat, lng) || '') : '';
    p.guess = { lat: round6(lat), lng: round6(lng), province, at: round1(room.game.elapsed) };
  }

  /** The round ends when every online human has guessed (with no human online: every seat). */
  function checkRoundEnd(room) {
    if (room.phase !== 'guess') return;
    const humans = room.players.filter(p => !p.bot && p.online);
    const waitingOn = humans.length ? humans : room.players;
    if (waitingOn.every(p => p.guess)) endRound(room);
  }

  function endRound(room) {
    const g = room.game;
    const item = currentItem(room);
    // Bots and dropped seats that were still thinking guess now, so an early end does not cost them the round.
    for (const p of room.players) if ((p.bot || p.takeover) && !p.guess) botGuess(room, p);
    const pins = [];
    for (const p of room.players) {
      let points = 0;
      if (p.guess) {
        const km = haversineKm(p.guess.lat, p.guess.lng, item.lat, item.lng);
        points = scoreFor(km, room.cfg, sameProvince(p.guess.province, item.province));
        pins.push({ pid: p.id, lat: p.guess.lat, lng: p.guess.lng, province: p.guess.province, km: round1(km), points });
      } else if (!p.bot) {
        notify(room, p.id, 'Süre doldu, bu tur tahmin yapmadın.', 'warn');
      }
      p.score += points;
      p.lastPoints = points;
      p.rounds[g.round - 1] = points;
    }
    pins.sort((a, b) => b.points - a.points || a.km - b.km);
    g.reveal = { round: g.round, item: Object.assign({}, item), pins };
    g.revealLeft = room.cfg.revealTime;
    g.timeLeft = 0;
    room.phase = 'reveal';
  }

  function nextRound(room) {
    if (room.game.round >= room.game.rounds) endGame(room);
    else startRound(room);
  }

  function standings(room) {
    const rows = room.players.map(p => ({
      id: p.id, name: p.name, look: p.look, bot: p.bot, takeover: p.takeover, score: p.score,
      rounds: Array.from({ length: room.game.rounds }, (_, i) => (typeof p.rounds[i] === 'number' ? p.rounds[i] : null))
    }));
    rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'tr'));
    rows.forEach((r, i) => { r.rank = i > 0 && rows[i - 1].score === r.score ? rows[i - 1].rank : i + 1; });
    return rows;
  }

  function endGame(room) {
    room.game.standings = standings(room);
    room.game.revealLeft = 0;
    room.phase = 'end';
  }

  function backToLobby(room) {
    room.players = room.players.filter(p => p.bot || p.online);
    for (const p of room.players) { p.takeover = false; p.guess = null; p.score = 0; p.lastPoints = 0; p.rounds = []; }
    room.phase = 'lobby';
    room.game = null;
    room.notices = {};
  }

  /**
   * Applies one intent from a player. Every field is checked: intents arrive from other browsers and are untrusted.
   * Returns { ok, reason }.
   */
  function apply(room, pid, intent) {
    const p = getPlayer(room, pid);
    if (!p || !intent || typeof intent !== 'object' || typeof intent.t !== 'string') return { ok: false, reason: 'invalid' };
    const isHost = pid === room.hostId;
    switch (intent.t) {
      case 'guess': return guess(room, p, intent);
      case 'settings': {
        if (!isHost || room.phase !== 'lobby') return { ok: false, reason: 'not-allowed' };
        const rt = Number(intent.roundTime);
        if (!ROUND_TIMES.includes(rt)) return { ok: false, reason: 'invalid' };
        room.settings.roundTime = rt;
        return { ok: true };
      }
      case 'addBot': {
        if (!isHost || room.phase !== 'lobby') return { ok: false, reason: 'not-allowed' };
        const r = addPlayer(room, { id: nextId(room, 'bot'), bot: true, level: intent.level });
        if (!r.ok) { notify(room, p.id, `Oda dolu: en fazla ${MAX_PLAYERS} kişi.`, 'warn'); return r; }
        return { ok: true };
      }
      case 'removeBot': {
        const b = typeof intent.id === 'string' ? getPlayer(room, intent.id) : null;
        if (!isHost || !b || !b.bot || room.phase !== 'lobby') return { ok: false, reason: 'not-allowed' };
        removePlayer(room, b.id);
        return { ok: true };
      }
      case 'start':
        if (!isHost || room.phase !== 'lobby') return { ok: false, reason: 'not-allowed' };
        return startGame(room, { rounds: ROUNDS, roundTime: room.settings.roundTime });
      case 'next':
        if (!isHost || room.phase !== 'reveal') return { ok: false, reason: 'not-allowed' };
        nextRound(room);
        return { ok: true };
      case 'again':
        if (!isHost || room.phase !== 'end') return { ok: false, reason: 'not-allowed' };
        backToLobby(room);
        return { ok: true };
      case 'profile':
        if (room.phase !== 'lobby') return { ok: false, reason: 'not-allowed' };
        setProfile(room, pid, intent);
        return { ok: true };
      default: return { ok: false, reason: 'invalid' };
    }
  }

  /** Advances the clock by dt seconds: bot pins, the round timer and the reveal countdown. */
  function tick(room, dt) {
    const g = room.game;
    if (!g || !(dt > 0)) return;
    if (room.phase === 'guess') {
      g.elapsed += dt;
      g.timeLeft = Math.max(0, g.timeLeft - dt);
      for (const p of room.players) if ((p.bot || p.takeover) && !p.guess && g.elapsed >= p.botAt) botGuess(room, p);
      if (g.timeLeft <= 0) endRound(room);
      else checkRoundEnd(room);
    } else if (room.phase === 'reveal') {
      g.revealLeft -= dt;
      if (g.revealLeft <= 0) nextRound(room);
    }
  }

  /* ---------------------------------------------------------------- snapshot */
  /** The view sent to one player. Before the reveal it holds no answer and no other player's pin. */
  function snapshot(room, forPid) {
    const g = room.game;
    const phase = room.phase;
    const s = {
      v: PROTOCOL, code: room.code, hostId: room.hostId, phase, max: MAX_PLAYERS, gameNo: room.gameNo,
      settings: { roundTime: room.settings.roundTime },
      round: g ? g.round : 0, rounds: g ? g.rounds : ROUNDS, roundTime: g ? g.roundTime : room.settings.roundTime,
      timeLeft: phase === 'guess' ? round1(g.timeLeft) : phase === 'reveal' ? Math.max(0, round1(g.revealLeft)) : 0,
      players: room.players.map(p => ({
        id: p.id, name: p.name, emoji: p.emoji, look: p.look, bot: p.bot, level: p.level, online: p.online, takeover: p.takeover,
        score: p.score, guessed: !!p.guess, lastPoints: p.lastPoints
      }))
    };
    if (!g) return s;
    if (phase === 'guess') {
      const item = currentItem(room);
      s.photo = { id: item.id, file: item.file };
      const me = getPlayer(room, forPid);
      s.mine = me && me.guess ? { lat: me.guess.lat, lng: me.guess.lng, province: me.guess.province } : null;
    }
    if ((phase === 'reveal' || phase === 'end') && g.reveal) {
      s.reveal = { round: g.reveal.round, item: Object.assign({}, g.reveal.item), pins: g.reveal.pins.map(x => Object.assign({}, x)) };
      // The next photo's file name (opaque) lets the browsers load it during the reveal.
      if (phase === 'reveal' && g.round < g.rounds) s.next = { file: room.items[g.order[g.round]].file };
    }
    if (phase === 'end') s.standings = g.standings.map(r => Object.assign({}, r, { rounds: r.rounds.slice() }));
    return s;
  }

  /** Private notices (a player dropped, the time ran out) go only to the players they are for. */
  const noticesFor = (room, pid) => (room.notices[pid] || []).slice();

  const api = {
    PROTOCOL, MAX_PLAYERS, NAME_MAX, ROUNDS, ROUND_TIMES, REVEAL_TIME, BOT_DELAY, MAX_POINTS, BOUNDS, BOT_LEVELS, AVATARS, LOOK_RANGE, PALETTES,
    createRoom, addPlayer, removePlayer, setOnline, setProfile, startGame, backToLobby, apply, tick, snapshot, noticesFor,
    cleanName, haversineKm, scoreFor, normProvince, sameProvince, inBounds,
    _internal: { getPlayer, currentItem }
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HK = api;
})(typeof self !== 'undefined' ? self : this);
