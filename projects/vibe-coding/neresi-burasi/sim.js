/* Guessing game engine ("Neresi Burası?", "Bu Yemek Nereden?"): the game rules.
 * Only the room host runs this simulation. Everyone else receives snapshots and sends intents.
 * Pure JavaScript without DOM access, so the same file also runs under Node for the tests.
 * Secrecy rule: before the reveal a snapshot carries nothing about the photo but its opaque id and file name,
 * no player's pin except the receiver's own, and for the receiver's misses only a coarse distance band,
 * a compass point and a hint. */
(function (root) {
  'use strict';

  const PROTOCOL = 2;          // host and guests must run the same rules
  const MAX_PLAYERS = 15;
  const NAME_MAX = 16;
  const ROUNDS = 5;
  const ROUND_TIMES = [120, 180, 300];
  const REVEAL_TIME = 20;      // seconds until the next round starts on its own
  const BOT_DELAY = [5, 40];   // seconds after the round start a bot places its first pin
  const BOT_RETRY = [3, 12];   // seconds between a bot's attempts
  const MAX_POINTS = 5000;
  const ATTEMPTS = 3;                  // pins per player and round; a hit ends the player's round at once
  const ATTEMPT_MULT = [1, 0.7, 0.5];  // the final attempt's points are multiplied by this
  const RETRY_SIGMA = 0.6;             // a bot's spread shrinks by this factor on every retry
  const HIT_KM = 10;                   // distance modes: a pin this close is a hit even across a border or just off the coast
  const UNLIMITED_CAP = 200;           // rounds of the open-ended modes (never more than the photos)
  const SPEED_KM = 150;                // Zamana Karşı: the speed bonus needs a pin this close
  const SPEED_BONUS = 500;
  const BANTER_LOW = 200;              // a bot that scored less than this may make a joke at the reveal
  const BANTER_CHANCE = 0.5;
  const KM_BANDS = [25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2500, 5000];
  const DIRS = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  // The Türkiye pool: guesses outside this box are refused and the map is limited to it. Other pools bring their own.
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
    ['Bot Rıza', 1], ['Bot Saniye', 0], ['Bot Kadriye', 0], ['Bot Necati', 1], ['Bot Sevim', 0], ['Bot Ferhat', 1], ['Bot Gülizar', 0],
    ['Bot Oya', 0], ['Bot Kemal', 1], ['Bot Zehra', 0], ['Bot Selim', 1], ['Bot Nuray', 0], ['Bot Orhan', 1], ['Bot Hülya', 0], ['Bot Yavuz', 1],
    ['Bot Leyla', 0], ['Bot Erol', 1], ['Bot Perihan', 0], ['Bot Sinan', 1], ['Bot Filiz', 0], ['Bot Tarık', 1], ['Bot Aysel', 0]
  ];
  const BOT_LEVELS = {
    rookie: { label: 'Çaylak', sigma: 250 },
    pro: { label: 'Usta', sigma: 60 }
  };
  const TAKEOVER_LEVEL = 'rookie';   // a bot plays the seat of a player who dropped, at this level
  // A bot that won the round says a "win" line, one that scored badly a "miss" line.
  const BANTER = {
    win: ['Kolaydı!', 'Haritayı ezbere biliyorum.', 'Bu turu ben aldım.', 'Gözüm kapalı bulurdum.', 'Yapıştırdım!', 'Pusulam hiç şaşmaz.'],
    miss: ['Haritayı ters tutmuşum galiba.', 'Bir dahaki tura bakarsınız.', 'Ben oraya hiç gitmedim ki!', 'Pusulam bozuk, kesin.', 'Bu fotoğraf beni yanılttı.', 'Neyse, gezmek de güzel.']
  };
  const BADGES = {
    bullseye: { icon: '🎯', label: 'Tam isabet' },
    fastest: { icon: '⚡', label: 'En hızlı' },
    farthest: { icon: '🧭', label: 'En uzak' },
    sniper: { icon: '🎯', label: 'Keskin Nişancı' },
    lightning: { icon: '⚡', label: 'Yıldırım' },
    explorer: { icon: '🧭', label: 'Gezgin' }
  };

  /**
   * Game modes. rounds null means open-ended (capped by UNLIMITED_CAP and the photo count); roundTime null takes the
   * lobby setting, 0 means no timer; revealTime 0 means the reveal waits for "Sonraki". "{region}" in a text is the
   * pool's region word (İl, Ülke).
   */
  const MODES = {
    klasik: { id: 'klasik', label: 'Klasik', desc: '5 tur. İğneyi bırak, yaklaştıkça puan artar.', solo: true, room: true, bots: true, rounds: ROUNDS, roundTime: null, revealTime: REVEAL_TIME, scoring: 'distance' },
    hizli: { id: 'hizli', label: 'Zamana Karşı', desc: '10 tur, 30 saniye. Hızlı ve yakın tahmine bonus.', solo: true, room: true, bots: true, rounds: 10, roundTime: 30, revealTime: 8, scoring: 'speed' },
    il: { id: 'il', label: 'Hangi {region}?', desc: '10 tur, 45 saniye. {region} tutarsa 1000 puan.', solo: true, room: true, bots: true, rounds: 10, roundTime: 45, revealTime: REVEAL_TIME, scoring: 'region' },
    seri: { id: 'seri', label: 'Seri', desc: '{region} tuttukça seri büyür, üç deneme de boşa giderse biter.', solo: true, room: false, bots: false, rounds: null, roundTime: 30, revealTime: REVEAL_TIME, scoring: 'streak' },
    gunluk: { id: 'gunluk', label: 'Günün Oyunu', desc: 'Bugün herkes aynı 5 fotoğrafı görür.', solo: true, room: false, bots: false, rounds: 5, roundTime: 180, revealTime: REVEAL_TIME, scoring: 'distance', daily: true },
    kesif: { id: 'kesif', label: 'Keşif', desc: 'Süre yok, puan yok. Tahmin et, cevabı ve hikayesini oku.', solo: true, room: false, bots: false, rounds: null, roundTime: 0, revealTime: 0, scoring: 'none' }
  };
  const modeText = (text, region) => String(text || '').replace(/\{region\}/g, region || 'İl');

  // Hint after the first miss: the province's geographic region, or the country's continent.
  const REGIONS = {
    'Marmara': ['Edirne', 'Kırklareli', 'Tekirdağ', 'İstanbul', 'Kocaeli', 'Yalova', 'Sakarya', 'Bilecik', 'Bursa', 'Balıkesir', 'Çanakkale'],
    'Ege': ['İzmir', 'Manisa', 'Aydın', 'Denizli', 'Muğla', 'Afyonkarahisar', 'Kütahya', 'Uşak'],
    'Akdeniz': ['Antalya', 'Isparta', 'Burdur', 'Mersin', 'Adana', 'Hatay', 'Osmaniye', 'Kahramanmaraş'],
    'İç Anadolu': ['Ankara', 'Konya', 'Kayseri', 'Eskişehir', 'Sivas', 'Kırıkkale', 'Aksaray', 'Karaman', 'Kırşehir', 'Niğde', 'Nevşehir', 'Yozgat', 'Çankırı'],
    'Karadeniz': ['Bolu', 'Düzce', 'Zonguldak', 'Karabük', 'Bartın', 'Kastamonu', 'Çorum', 'Sinop', 'Samsun', 'Amasya', 'Tokat', 'Ordu', 'Giresun', 'Trabzon', 'Rize', 'Artvin', 'Gümüşhane', 'Bayburt'],
    'Doğu Anadolu': ['Erzurum', 'Erzincan', 'Kars', 'Ağrı', 'Ardahan', 'Iğdır', 'Van', 'Muş', 'Bitlis', 'Bingöl', 'Tunceli', 'Elazığ', 'Malatya', 'Hakkâri'],
    'Güneydoğu Anadolu': ['Gaziantep', 'Şanlıurfa', 'Diyarbakır', 'Mardin', 'Batman', 'Siirt', 'Şırnak', 'Kilis', 'Adıyaman']
  };
  // Country names in Turkish (manifest "province" field of the world pool), with the usual alternative spellings.
  const CONTINENTS = {
    'Avrupa': ['Arnavutluk', 'Andorra', 'Avusturya', 'Belarus', 'Beyaz Rusya', 'Belçika', 'Bosna-Hersek', 'Bosna Hersek', 'Bulgaristan', 'Hırvatistan',
      'Çekya', 'Çek Cumhuriyeti', 'Danimarka', 'Estonya', 'Finlandiya', 'Fransa', 'Almanya', 'Yunanistan', 'Macaristan', 'İzlanda', 'İrlanda', 'İtalya',
      'Kosova', 'Letonya', 'Lihtenştayn', 'Litvanya', 'Lüksemburg', 'Malta', 'Moldova', 'Monako', 'Karadağ', 'Hollanda', 'Kuzey Makedonya', 'Makedonya',
      'Norveç', 'Polonya', 'Portekiz', 'Romanya', 'Rusya', 'San Marino', 'Sırbistan', 'Slovakya', 'Slovenya', 'İspanya', 'İsveç', 'İsviçre', 'Ukrayna',
      'Birleşik Krallık', 'İngiltere', 'İskoçya', 'Galler', 'Vatikan'],
    'Asya': ['Afganistan', 'Ermenistan', 'Azerbaycan', 'Bahreyn', 'Bangladeş', 'Butan', 'Brunei', 'Kamboçya', 'Çin', 'Kıbrıs', 'Kuzey Kıbrıs', 'Gürcistan',
      'Hindistan', 'Endonezya', 'İran', 'Irak', 'İsrail', 'Japonya', 'Ürdün', 'Kazakistan', 'Kuveyt', 'Kırgızistan', 'Laos', 'Lübnan', 'Malezya',
      'Maldivler', 'Moğolistan', 'Myanmar', 'Nepal', 'Kuzey Kore', 'Umman', 'Pakistan', 'Filistin', 'Filipinler', 'Katar', 'Suudi Arabistan',
      'Singapur', 'Güney Kore', 'Sri Lanka', 'Suriye', 'Tayvan', 'Tacikistan', 'Tayland', 'Doğu Timor', 'Türkiye', 'Türkmenistan',
      'Birleşik Arap Emirlikleri', 'Özbekistan', 'Vietnam', 'Yemen', 'Hong Kong', 'Makao'],
    'Afrika': ['Cezayir', 'Angola', 'Benin', 'Botsvana', 'Burkina Faso', 'Burundi', 'Yeşil Burun Adaları', 'Kamerun', 'Orta Afrika Cumhuriyeti', 'Çad',
      'Komorlar', 'Kongo', 'Kongo Cumhuriyeti', 'Kongo Demokratik Cumhuriyeti', 'Demokratik Kongo Cumhuriyeti', 'Somaliland', 'Cibuti', 'Mısır', 'Ekvator Ginesi', 'Eritre', 'Esvatini', 'Svaziland',
      'Etiyopya', 'Gabon', 'Gambiya', 'Gana', 'Gine', 'Gine-Bissau', 'Fildişi Sahili', 'Kenya', 'Lesotho', 'Liberya', 'Libya', 'Madagaskar', 'Malavi',
      'Mali', 'Moritanya', 'Morityus', 'Fas', 'Mozambik', 'Namibya', 'Nijer', 'Nijerya', 'Ruanda', 'Sao Tome ve Principe', 'Senegal', 'Seyşeller',
      'Sierra Leone', 'Somali', 'Güney Afrika', 'Güney Afrika Cumhuriyeti', 'Güney Sudan', 'Sudan', 'Tanzanya', 'Togo', 'Tunus', 'Uganda', 'Zambiya',
      'Zimbabve', 'Batı Sahra'],
    'Kuzey Amerika': ['Antigua ve Barbuda', 'Bahamalar', 'Barbados', 'Belize', 'Kanada', 'Kosta Rika', 'Küba', 'Dominika', 'Dominik Cumhuriyeti',
      'El Salvador', 'Grenada', 'Guatemala', 'Haiti', 'Honduras', 'Jamaika', 'Meksika', 'Nikaragua', 'Panama', 'Saint Kitts ve Nevis', 'Saint Lucia',
      'Saint Vincent ve Grenadinler', 'Trinidad ve Tobago', 'Amerika Birleşik Devletleri', 'ABD', 'Grönland', 'Porto Riko'],
    'Güney Amerika': ['Arjantin', 'Bolivya', 'Brezilya', 'Şili', 'Kolombiya', 'Ekvador', 'Guyana', 'Paraguay', 'Peru', 'Surinam', 'Uruguay', 'Venezuela',
      'Fransız Guyanası', 'Falkland Adaları'],
    'Okyanusya': ['Avustralya', 'Fiji', 'Kiribati', 'Marshall Adaları', 'Mikronezya', 'Nauru', 'Yeni Zelanda', 'Palau', 'Papua Yeni Gine', 'Samoa',
      'Solomon Adaları', 'Tonga', 'Tuvalu', 'Vanuatu', 'Yeni Kaledonya']
  };

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
  function strHash(s) { // FNV-1a, 32 bit
    let h = 0x811c9dc5;
    for (const ch of String(s)) h = Math.imul(h ^ ch.codePointAt(0), 0x01000193);
    return h | 0;
  }
  /** The seed of the day's photo order: the same calendar day and pool give the same five photos everywhere. */
  const dailySeed = (day, pool) => (Number(day) ^ strHash(pool || 'tr')) | 0;

  /** Great-circle distance in kilometres. */
  function haversineKm(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lng2 - lng1) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /** One of eight compass points (K, KD, D ...) for the initial great-circle bearing from the pin to the truth. */
  function compassDir(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180;
    const y = Math.sin((lng2 - lng1) * rad) * Math.cos(lat2 * rad);
    const x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad) - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lng2 - lng1) * rad);
    const deg = (Math.atan2(y, x) / rad + 360) % 360;
    return DIRS[Math.round(deg / 45) % 8];
  }

  /** A coarse distance ("~500 km", "5.000 km+"): the nearest of KM_BANDS, never the exact figure. */
  function kmBand(km) {
    let best = KM_BANDS[0];
    for (const b of KM_BANDS) if (Math.abs(b - km) < Math.abs(best - km)) best = b;
    return best === KM_BANDS[KM_BANDS.length - 1] ? best.toLocaleString('tr-TR') + ' km+' : '~' + best.toLocaleString('tr-TR') + ' km';
  }

  /** Province names compared without case, Turkish dots or circumflexes ("Hakkâri" equals "HAKKARI"). */
  function normProvince(s) {
    return String(s == null ? '' : s).trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  }
  const sameProvince = (a, b) => !!normProvince(a) && normProvince(a) === normProvince(b);

  const REGION_OF = new Map();
  for (const [region, names] of Object.entries(REGIONS)) for (const n of names) REGION_OF.set(normProvince(n), region + ' Bölgesi');
  for (const [continent, names] of Object.entries(CONTINENTS)) for (const n of names) REGION_OF.set(normProvince(n), continent);
  /** "Karadeniz Bölgesi" for a province, "Güney Amerika" for a country, '' when unknown. */
  const regionOf = name => REGION_OF.get(normProvince(name)) || '';

  function scoreFor(km, cfg, sameProv) {
    const scale = cfg && cfg.scoreScaleKm > 0 ? cfg.scoreScaleKm : 200;
    const bonus = cfg && cfg.provinceBonus > 0 && sameProv ? cfg.provinceBonus : 0;
    return Math.round(MAX_POINTS * Math.exp(-Math.max(0, km) / scale)) + bonus;
  }

  const inBounds = (lat, lng, b) => {
    const box = b || BOUNDS;
    return lat >= box.latMin && lat <= box.latMax && lng >= box.lngMin && lng <= box.lngMax;
  };

  function cleanBounds(b) {
    const ok = b && ['latMin', 'latMax', 'lngMin', 'lngMax'].every(k => Number.isFinite(b[k])) && b.latMin < b.latMax && b.lngMin < b.lngMax;
    return ok ? { latMin: b.latMin, latMax: b.latMax, lngMin: b.lngMin, lngMax: b.lngMax } : Object.assign({}, BOUNDS);
  }

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
  const modeOf = room => MODES[room.game ? room.game.mode : room.settings.mode] || MODES.klasik;
  const kmScale = room => room.cfg.scoreScaleKm / 200;   // distances that matter grow with the pool (Dünya: x10)

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
  const cleanItems = items => (Array.isArray(items) ? items : []).filter(validItem).map((it, i) => Object.assign({}, it, { id: typeof it.id === 'string' ? it.id : 'i' + (i + 1) }));

  /** The scoring and bot settings of one photo pool (Türkiye, Dünya): bounds, scoreScaleKm, provinceBonus, botSigma, regionLabel. */
  function poolCfg(o) {
    const sigma = o.botSigma && typeof o.botSigma === 'object' ? o.botSigma : {};
    return {
      bounds: cleanBounds(o.bounds),
      scoreScaleKm: Number(o.scoreScaleKm) > 0 ? Number(o.scoreScaleKm) : 200,
      provinceBonus: Number(o.provinceBonus) > 0 ? Number(o.provinceBonus) : 0,
      botSigma: { rookie: Number(sigma.rookie) > 0 ? Number(sigma.rookie) : BOT_LEVELS.rookie.sigma, pro: Number(sigma.pro) > 0 ? Number(sigma.pro) : BOT_LEVELS.pro.sigma },
      regionLabel: typeof o.regionLabel === 'string' && o.regionLabel.trim() ? o.regionLabel.trim() : 'İl'
    };
  }

  /* ---------------------------------------------------------------- room and players */
  /**
   * items: the manifest items of the room's first pool (only the host has them). opts: { pool, bounds, scoreScaleKm,
   * provinceBonus, botSigma, regionLabel, provinceAt(lat, lng, pool), debugRoundTime, revealTime, solo };
   * provinceAt is the host's province (or country) lookup, used for every guess when present.
   */
  function createRoom(code, hostId, seed, items, opts) {
    const o = opts || {};
    const pool = typeof o.pool === 'string' && o.pool ? o.pool : 'tr';
    const first = { items: cleanItems(items), cfg: poolCfg(o) };
    return {
      code: String(code || ''), hostId, seed: seed | 0, phase: 'lobby', solo: o.solo === true,
      settings: { roundTime: 180, mode: 'klasik', presenter: false, pool },
      pools: { [pool]: first },
      items: first.items,
      cfg: Object.assign({}, first.cfg, {
        provinceAt: typeof o.provinceAt === 'function' ? o.provinceAt : null,
        debugRoundTime: Number(o.debugRoundTime) > 0 ? Number(o.debugRoundTime) : 0,
        revealTime: Number(o.revealTime) > 0 ? Number(o.revealTime) : 0
      }),
      players: [], nextId: 1, notices: {}, used: [], gameNo: 0, game: null
    };
  }

  /** Registers another photo pool on the host (its items and settings); the lobby setting `pool` switches to it. */
  function addPool(room, id, items, opts) {
    if (typeof id !== 'string' || !id) return { ok: false, reason: 'invalid' };
    room.pools[id] = { items: cleanItems(items), cfg: poolCfg(opts || {}) };
    if (room.settings.pool === id) selectPool(room, id);
    return { ok: true };
  }

  function selectPool(room, id) {
    const p = room.pools[id];
    room.settings.pool = id;
    room.items = p.items;
    Object.assign(room.cfg, p.cfg);
    room.used = [];   // indices of the old pool's photos mean nothing here
  }

  function botLook(room, body) {
    return { skin: Math.floor(rand(room) * LOOK_RANGE), hair: Math.floor(rand(room) * LOOK_RANGE), shirt: Math.floor(rand(room) * LOOK_RANGE), body };
  }

  function resetRound(p) { p.tries = []; p.done = false; p.guess = null; }
  function resetGame(p) { p.score = 0; p.lastPoints = 0; p.rounds = []; p.kms = []; p.hits = []; p.times = []; resetRound(p); }

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
      const free = BOT_NAMES.filter(n => !taken.has(n[0]));
      const pick = free.length ? free[Math.floor(rand(room) * free.length)] : null;
      name = pick ? pick[0] : `Bot ${room.players.length + 1}`;
      look = botLook(room, pick ? pick[1] : Math.floor(rand(room) * 2));
    }
    if (!name) name = `Oyuncu ${room.players.length + 1}`;
    const g = room.game;
    const player = {
      id: String(info.id), name, bot, look: look || { skin: 0, hair: 0, shirt: 0, body: 0 },
      emoji: bot ? '🤖' : (AVATARS.includes(info.emoji) ? info.emoji : AVATARS[0]),
      level: BOT_LEVELS[info.level] ? info.level : 'pro',
      online: true, takeover: false, spectator: false,
      botAt: g ? g.elapsed + between(room, BOT_DELAY[0], BOT_DELAY[1]) : 0
    };
    resetGame(player);
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
      if (p.takeover && room.game && !p.tries.length) p.botAt = Math.max(p.botAt, room.game.elapsed + between(room, 3, 10));
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

  /**
   * Starts a game. opts: { mode, roundTime, rounds, day }; mode and roundTime default to the lobby settings, day
   * (YYYYMMDD of the player's calendar) is required for Günün Oyunu.
   */
  function startGame(room, opts) {
    const o = opts || {};
    const modeId = o.mode == null ? room.settings.mode : o.mode;
    const mode = MODES[modeId];
    if (!mode) return { ok: false, reason: 'invalid' };
    const humans = room.players.filter(p => !p.bot);
    if (!(room.solo ? mode.solo : mode.room) || (!mode.room && humans.length > 1)) return { ok: false, reason: 'mode' };
    if (!mode.bots && room.players.some(p => p.bot)) return { ok: false, reason: 'bots' };
    if (room.players.some(p => p.spectator) && !humans.some(p => !p.spectator)) return { ok: false, reason: 'no-players' };
    const day = Number(o.day);
    if (mode.daily && !(Number.isInteger(day) && day >= 19000101 && day <= 29991231)) return { ok: false, reason: 'day' };
    const wanted = Number(o.roundTime);
    let roundTime = mode.roundTime == null ? (ROUND_TIMES.includes(wanted) ? wanted : room.settings.roundTime) : mode.roundTime;
    if (roundTime > 0 && room.cfg.debugRoundTime) roundTime = room.cfg.debugRoundTime;
    const want = mode.rounds || UNLIMITED_CAP;
    const limit = Math.min(want, Number(o.rounds) > 0 ? Number(o.rounds) : want, room.items.length);
    if (!limit) return { ok: false, reason: 'no-items' };
    const order = mode.daily ? shuffle({ seed: dailySeed(day, room.settings.pool) }, room.items.map((_, i) => i)).slice(0, limit) : pickOrder(room, limit);
    room.settings.mode = modeId;
    room.gameNo++;
    room.notices = {};
    room.game = {
      mode: modeId, round: 0, rounds: mode.rounds ? limit : null, limit, roundTime, order,
      revealTime: room.cfg.revealTime || mode.revealTime, day: mode.daily ? day : 0, streak: 0, over: false,
      timeLeft: 0, elapsed: 0, revealLeft: 0, reveal: null, standings: null, history: []
    };
    for (const p of room.players) {
      resetGame(p);
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
    for (const p of room.players) { resetRound(p); p.botAt = between(room, BOT_DELAY[0], BOT_DELAY[1]); }
    room.phase = 'guess';
  }

  /**
   * Records one attempt. A hit, or the last allowed attempt, ends the player's round. auto: placed by the bot that
   * plays a dropped seat; forced: a bot's pin at an early round end (neither counts as the player's own speed).
   */
  function addAttempt(room, p, lat, lng, province, auto, forced) {
    const item = currentItem(room);
    const t = { lat: round6(lat), lng: round6(lng), province, at: round1(room.game.elapsed), km: 0, hit: false, auto: !!auto, forced: !!forced };
    t.km = haversineKm(t.lat, t.lng, item.lat, item.lng);
    // The province modes count the province only; the others also accept a pin right next to the spot.
    const byRegion = ['region', 'streak'].includes(MODES[room.game.mode].scoring);
    t.hit = sameProvince(province, item.province) || (!byRegion && t.km <= HIT_KM * kmScale(room));
    p.tries.push(t);
    p.guess = t;
    if (t.hit || p.tries.length >= ATTEMPTS) p.done = true;
    return t;
  }

  function guess(room, p, intent) {
    if (room.phase !== 'guess') return { ok: false, reason: 'late' };
    if (p.spectator) return { ok: false, reason: 'spectator' };
    if (p.done) return { ok: false, reason: 'already' };
    const lat = intent.lat;
    const lng = intent.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, reason: 'invalid' };
    if (!inBounds(lat, lng, room.cfg.bounds)) return { ok: false, reason: 'range' };
    // The host's own lookup wins; the province a guest sends is only used when the host has none.
    const sent = typeof intent.province === 'string' ? cleanName(intent.province).slice(0, 40) : '';
    const province = room.cfg.provinceAt ? String(room.cfg.provinceAt(lat, lng, room.settings.pool) || '') : sent;
    const t = addAttempt(room, p, lat, lng, province, false);
    checkRoundEnd(room);
    return { ok: true, hit: t.hit, done: p.done };
  }

  /** Bots and the bot that plays a dropped seat (only when its owner made no attempt of their own). */
  const botPlays = p => !p.spectator && (p.bot || (p.takeover && p.tries.every(t => t.auto)));

  function botAttempt(room, p, forced) {
    const item = currentItem(room);
    if (!item) return;
    const b = room.cfg.bounds;
    const sigma = room.cfg.botSigma[p.bot ? p.level : TAKEOVER_LEVEL] * Math.pow(RETRY_SIGMA, p.tries.length);
    const north = gauss(room) * sigma;
    const east = gauss(room) * sigma;
    const lat = clamp(item.lat + north / 111.32, b.latMin, b.latMax);
    const lng = clamp(item.lng + east / (111.32 * Math.max(0.05, Math.cos(item.lat * Math.PI / 180))), b.lngMin, b.lngMax);
    const province = room.cfg.provinceAt ? String(room.cfg.provinceAt(lat, lng, room.settings.pool) || '') : '';
    addAttempt(room, p, lat, lng, province, !p.bot, forced);
    if (!p.done) p.botAt = room.game.elapsed + between(room, BOT_RETRY[0], BOT_RETRY[1]);
  }

  /**
   * The round ends when every online human is done (a hit or all attempts used). With no human online it waits for
   * the seats a bot plays. The spectator (presenter) never counts.
   */
  function checkRoundEnd(room) {
    if (room.phase !== 'guess') return;
    const seats = room.players.filter(p => !p.spectator);
    const humans = seats.filter(p => !p.bot && p.online);
    const waitingOn = humans.length ? humans : seats.filter(botPlays);
    if (waitingOn.every(p => p.done)) endRound(room);
  }

  /** Points for the player's final attempt (the attempt number sets the multiplier). */
  function pointsFor(room, p, t) {
    const g = room.game;
    const item = currentItem(room);
    const mult = ATTEMPT_MULT[Math.min(p.tries.length, ATTEMPT_MULT.length) - 1];
    const km = t.km;
    switch (MODES[g.mode].scoring) {
      case 'speed': {
        const base = Math.round(scoreFor(km, room.cfg, sameProvince(t.province, item.province)) * mult);
        const fast = km <= SPEED_KM * kmScale(room) && g.roundTime > 0 ? Math.round(SPEED_BONUS * Math.max(0, g.roundTime - t.at) / g.roundTime) : 0;
        return base + fast;
      }
      case 'region': return Math.round((t.hit ? 1000 : 400 * Math.exp(-km / (150 * kmScale(room)))) * mult);
      case 'streak': return t.hit ? 1 : 0;
      case 'none': return 0;
      default: return Math.round(scoreFor(km, room.cfg, sameProvince(t.province, item.province)) * mult);
    }
  }

  /** Round badges: a hit within HIT_KM (the right province in the province modes), the first human done, the farthest pin. */
  function roundBadges(room, pins) {
    const badges = {};
    const give = (pid, id) => (badges[pid] || (badges[pid] = [])).push(id);
    const byRegion = ['region', 'streak'].includes(MODES[room.game.mode].scoring);
    for (const pin of pins) if (byRegion ? pin.hit : pin.km <= HIT_KM * kmScale(room)) give(pin.pid, 'bullseye');
    const own = room.players.filter(p => !p.bot && !p.spectator && p.guess && !p.guess.auto);
    if (own.length) {
      const first = Math.min(...own.map(p => p.guess.at));
      for (const p of own) if (p.guess.at === first) give(p.id, 'fastest');
    }
    if (pins.length >= 3) {
      const far = Math.max(...pins.map(x => x.km));
      for (const pin of pins) if (pin.km === far) give(pin.pid, 'farthest');
    }
    return badges;
  }

  function endRound(room) {
    const g = room.game;
    const item = currentItem(room);
    const i = g.round - 1;
    // Bots and dropped seats that had not placed a pin yet guess now, so an early end does not cost them the round.
    for (const p of room.players) if (botPlays(p) && !p.tries.length) botAttempt(room, p, true);
    const pins = [];
    for (const p of room.players) {
      if (p.spectator) continue;
      const t = p.guess;
      let points = 0;
      if (t) {
        points = pointsFor(room, p, t);
        pins.push({ pid: p.id, lat: t.lat, lng: t.lng, province: t.province, km: round1(t.km), points, attempts: p.tries.length, hit: t.hit });
      } else if (!p.bot) {
        notify(room, p.id, 'Süre doldu, bu tur tahmin yapmadın.', 'warn');
      }
      p.score += points;
      p.lastPoints = points;
      p.rounds[i] = points;
      p.kms[i] = t ? round1(t.km) : null;
      p.hits[i] = !!(t && t.hit);
      p.times[i] = t && !t.auto && !t.forced ? t.at : null;
    }
    pins.sort((a, b) => b.points - a.points || a.km - b.km);
    g.reveal = { round: g.round, item: Object.assign({}, item), pins, badges: roundBadges(room, pins), banter: null };
    if (MODES[g.mode].scoring === 'streak') {
      const human = room.players.find(p => !p.bot && !p.spectator);
      if (human && human.hits[i]) g.streak++; else g.over = true;
    }
    // At most one joke per round, from a bot that won the round or scored badly.
    const top = pins[0];
    const cands = room.players.filter(p => p.bot && p.guess && ((top && top.pid === p.id) || p.lastPoints < BANTER_LOW));
    if (cands.length && rand(room) < BANTER_CHANCE) {
      const b = cands[Math.floor(rand(room) * cands.length)];
      const list = top && top.pid === b.id ? BANTER.win : BANTER.miss;
      g.reveal.banter = { pid: b.id, text: list[Math.floor(rand(room) * list.length)] };
    }
    g.history.push({ round: g.round, title: item.title || '', province: item.province || '' });
    g.revealLeft = g.revealTime;
    g.timeLeft = 0;
    room.phase = 'reveal';
  }

  const isLast = g => g.over || g.round >= g.limit;

  function nextRound(room) {
    if (isLast(room.game)) endGame(room);
    else startRound(room);
  }

  /** The best players by a per-player value (lower or higher wins); null values never win. */
  function bestOf(rows, value, lower) {
    const vals = rows.map(value);
    const ok = vals.filter(v => v != null);
    if (!ok.length) return [];
    const best = lower ? Math.min(...ok) : Math.max(...ok);
    return rows.filter((_, i) => vals[i] === best);
  }
  const mean = list => { const a = list.filter(x => typeof x === 'number'); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };

  function standings(room) {
    const n = room.game.round;
    const seats = room.players.filter(p => !p.spectator);
    const at = (arr, i) => (typeof arr[i] === 'number' ? arr[i] : null);
    const rows = seats.map(p => ({
      id: p.id, name: p.name, look: p.look, bot: p.bot, takeover: p.takeover, score: p.score,
      rounds: Array.from({ length: n }, (_, i) => at(p.rounds, i)),
      kms: Array.from({ length: n }, (_, i) => at(p.kms, i)),
      hits: Array.from({ length: n }, (_, i) => p.hits[i] === true),
      badges: []
    }));
    rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'tr'));
    rows.forEach((r, i) => { r.rank = i > 0 && rows[i - 1].score === r.score ? rows[i - 1].rank : i + 1; });
    const player = r => getPlayer(room, r.id);
    for (const r of bestOf(rows, r => mean(r.kms), true)) r.badges.push('sniper');
    for (const r of bestOf(rows, r => mean(player(r).times.slice(0, n)), true)) r.badges.push('lightning');
    for (const r of bestOf(rows, r => { const c = r.hits.filter(Boolean).length; return c ? c : null; }, false)) r.badges.push('explorer');
    return rows;
  }

  function endGame(room) {
    room.game.standings = standings(room);
    room.game.revealLeft = 0;
    room.phase = 'end';
  }

  function backToLobby(room) {
    room.players = room.players.filter(p => p.bot || p.online);
    for (const p of room.players) { p.takeover = false; resetGame(p); }
    room.phase = 'lobby';
    room.game = null;
    room.notices = {};
  }

  /** Lobby settings: any of roundTime, mode, presenter and pool; every given field must be valid. */
  function applySettings(room, intent) {
    const next = {};
    if (intent.roundTime !== undefined) {
      const rt = Number(intent.roundTime);
      if (!ROUND_TIMES.includes(rt)) return { ok: false, reason: 'invalid' };
      next.roundTime = rt;
    }
    if (intent.mode !== undefined) {
      const m = typeof intent.mode === 'string' ? MODES[intent.mode] : null;
      if (!m || !(room.solo ? m.solo : m.room)) return { ok: false, reason: 'invalid' };
      next.mode = m.id;
    }
    if (intent.presenter !== undefined) {
      if (room.solo || typeof intent.presenter !== 'boolean') return { ok: false, reason: 'invalid' };
      next.presenter = intent.presenter;
    }
    if (intent.pool !== undefined) {
      if (typeof intent.pool !== 'string' || !Object.prototype.hasOwnProperty.call(room.pools, intent.pool)) return { ok: false, reason: 'invalid' };
      next.pool = intent.pool;
    }
    if (!Object.keys(next).length) return { ok: false, reason: 'invalid' };
    if (next.roundTime) room.settings.roundTime = next.roundTime;
    if (next.mode) room.settings.mode = next.mode;
    if (next.presenter !== undefined) {
      room.settings.presenter = next.presenter;
      const host = getPlayer(room, room.hostId);
      if (host) host.spectator = next.presenter;
    }
    if (next.pool) selectPool(room, next.pool);
    return { ok: true };
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
      case 'settings':
        if (!isHost || room.phase !== 'lobby') return { ok: false, reason: 'not-allowed' };
        return applySettings(room, intent);
      case 'addBot': {
        if (!isHost || room.phase !== 'lobby' || !modeOf(room).bots) return { ok: false, reason: 'not-allowed' };
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
        return startGame(room, { mode: room.settings.mode, roundTime: room.settings.roundTime, day: intent.day });
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
      if (g.roundTime > 0) g.timeLeft = Math.max(0, g.timeLeft - dt);
      for (const p of room.players) if (botPlays(p) && !p.done && g.elapsed >= p.botAt) botAttempt(room, p);
      if (g.roundTime > 0 && g.timeLeft <= 0) endRound(room);
      else checkRoundEnd(room);
    } else if (room.phase === 'reveal' && g.revealTime > 0) {
      g.revealLeft -= dt;
      if (g.revealLeft <= 0) nextRound(room);
    }
  }

  /* ---------------------------------------------------------------- snapshot */
  /** What one player learns about an own attempt: a miss gets a distance band, a compass point and a hint. */
  function attemptView(room, item, t, i) {
    const out = { lat: t.lat, lng: t.lng, hit: t.hit };
    if (t.hit) return out;
    out.kmBand = kmBand(t.km);
    out.dir = compassDir(t.lat, t.lng, item.lat, item.lng);
    out.hint = i === 0 ? hint1(room, item) : i === 1 ? hint2(room, item) : '';
    return out;
  }
  function hint1(room, item) {
    if (typeof item.hint1 === 'string' && item.hint1.trim()) return item.hint1.trim();
    const region = regionOf(item.province);
    return region ? `İpucu: ${region}${region.endsWith('Bölgesi') ? "'nde" : "'da"}.` : '';
  }
  function hint2(room, item) {
    if (typeof item.hint2 === 'string' && item.hint2.trim()) return item.hint2.trim();
    const first = String(item.province || '').trim().charAt(0).toLocaleUpperCase('tr-TR');
    return first ? `${room.cfg.regionLabel} adı '${first}' ile başlıyor.` : '';
  }

  /** The view sent to one player. Before the reveal it holds no answer and no other player's pin. */
  function snapshot(room, forPid) {
    const g = room.game;
    const phase = room.phase;
    const mode = modeOf(room);
    const s = {
      v: PROTOCOL, code: room.code, hostId: room.hostId, phase, max: MAX_PLAYERS, gameNo: room.gameNo,
      mode: mode.id, pool: room.settings.pool, solo: room.solo,
      settings: { roundTime: room.settings.roundTime, mode: room.settings.mode, presenter: room.settings.presenter, pool: room.settings.pool },
      round: g ? g.round : 0,
      rounds: g ? g.rounds : mode.rounds,
      roundTime: g ? g.roundTime : (mode.roundTime == null ? room.settings.roundTime : mode.roundTime),
      revealTime: g ? g.revealTime : mode.revealTime,
      streak: g ? g.streak : 0, day: g ? g.day : 0,
      timeLeft: phase === 'guess' ? round1(g.timeLeft) : phase === 'reveal' ? Math.max(0, round1(g.revealLeft)) : 0,
      players: room.players.map(p => ({
        id: p.id, name: p.name, emoji: p.emoji, look: p.look, bot: p.bot, level: p.level, online: p.online, takeover: p.takeover,
        spectator: p.spectator, score: p.score, guessed: p.done, tries: p.tries.length, lastPoints: p.lastPoints
      }))
    };
    if (!g) return s;
    const me = getPlayer(room, forPid);
    if (phase === 'guess') {
      const item = currentItem(room);
      s.photo = { id: item.id, file: item.file };
      const last = me && me.guess;
      s.mine = last ? {
        lat: last.lat, lng: last.lng, province: last.province, done: me.done, left: ATTEMPTS - me.tries.length,
        attempts: me.tries.map((t, i) => attemptView(room, item, t, i))
      } : null;
    }
    if ((phase === 'reveal' || phase === 'end') && g.reveal) {
      const badges = {};
      for (const [pid, list] of Object.entries(g.reveal.badges)) badges[pid] = list.slice();
      s.reveal = {
        round: g.reveal.round, item: Object.assign({}, g.reveal.item), pins: g.reveal.pins.map(x => Object.assign({}, x)),
        badges, banter: g.reveal.banter ? Object.assign({}, g.reveal.banter) : null
      };
      // Only the receiver's own earlier attempts, for the faint trail on the reveal map.
      if (me && me.tries.length) s.mine = { attempts: me.tries.map(t => ({ lat: t.lat, lng: t.lng, hit: t.hit })) };
      s.last = isLast(g);
      // The next photo's file name (opaque) lets the browsers load it during the reveal.
      if (phase === 'reveal' && !s.last) s.next = { file: room.items[g.order[g.round]].file };
    }
    if (phase === 'end') {
      s.standings = g.standings.map(r => Object.assign({}, r, { rounds: r.rounds.slice(), kms: r.kms.slice(), hits: r.hits.slice(), badges: r.badges.slice() }));
      s.history = g.history.map(h => Object.assign({}, h));
    }
    return s;
  }

  /** Private notices (a player dropped, the time ran out) go only to the players they are for. */
  const noticesFor = (room, pid) => (room.notices[pid] || []).slice();

  const api = {
    PROTOCOL, MAX_PLAYERS, NAME_MAX, ROUNDS, ROUND_TIMES, REVEAL_TIME, BOT_DELAY, BOT_RETRY, MAX_POINTS, BOUNDS, BOT_LEVELS, AVATARS, LOOK_RANGE, PALETTES,
    ATTEMPTS, ATTEMPT_MULT, RETRY_SIGMA, HIT_KM, UNLIMITED_CAP, KM_BANDS, DIRS, MODES, BADGES, BANTER, BOT_NAMES, REGIONS, CONTINENTS,
    createRoom, addPool, addPlayer, removePlayer, setOnline, setProfile, startGame, backToLobby, apply, tick, snapshot, noticesFor,
    cleanName, haversineKm, scoreFor, normProvince, sameProvince, inBounds, kmBand, compassDir, regionOf, modeText, dailySeed,
    _internal: { getPlayer, currentItem }
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HK = api;
})(typeof self !== 'undefined' ? self : this);
