// Static site generator for berkayvuran.com (macOS-desktop style).
// Usage: node build.mjs [--base=/next] [--out=../next] [--index=false]
//   preview : node build.mjs                      -> ../next, noindex
//   go live : node build.mjs --base= --out=.. --index=true
import * as cheerio from 'cheerio';
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

import { createHash } from 'node:crypto';
const VER = createHash('md5').update(['desk.css', 'desk.js', 'extras.css', 'extras.js', 'ios.css', 'ios.js'].map(f => fs.readFileSync(new URL('./src/' + f, import.meta.url))).join('')).digest('hex').slice(0, 8);
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')]; }));
const BASE = args.base ?? '/next';
const OUT = path.resolve(args.out ?? '../next');
const INDEXABLE = args.index === 'true';
const GOATCOUNTER = args.goatcounter || '';   // cookieless analytics: --goatcounter=<code> (https://<code>.goatcounter.com)
const FORM_URL = args.form || '';              // optional form endpoint for the Mail app (e.g. https://formspree.io/f/xxxx); empty = opens the visitor's mail app
const ORIGIN = 'https://berkayvuran.com';
const TODAY = new Date().toISOString().slice(0, 10);
const LANGS = ['en', 'tr'];
const TITLES = {
  en: ['Product Leader', 'Builder of Things That Scale', 'Conversational AI Strategist', 'Cross-Functional Aligner', 'Data Over Opinions', '0-to-1 Launcher', 'Human-Centered PM', 'PMP® & Scrum Certified', 'Autonomy for Teams', 'AI + ML + Data, Real Workflows', 'Psychology + Product'],
  tr: ['Ürün Lideri', 'Ölçeklenen Şeyler İnşa Ederim', 'Konuşma AI Stratejisti', 'Ekipleri Ortak Hedefte Buluşturan', 'Fikir Değil, Veri', 'Sıfırdan Bire Lansman', 'İnsan Odaklı Ürün Yöneticisi', 'PMP® & Scrum Sertifikalı', 'Ekiplere Otonomi', 'Yapay Zeka + ML + Veri, Gerçek İş Akışları', 'Psikoloji + Ürün']
};
const THEMES = [
  { id: 'dark', e: '🌙', en: 'Night Owl', tr: 'Gece Baykuşu' },
  { id: 'light', e: '☀️', en: 'Sunshine Mode', tr: 'Güneş Modu' },
  { id: 'matrix', e: '💚', en: 'Matrix Vibes', tr: 'Matrix Ruhu' },
  { id: 'high-contrast', e: '⚡', en: 'Zap Mode', tr: 'Şimşek Modu' }
];
const SLUGS = ['about', 'cv', 'references', 'showcase', 'blog', 'builder'];

/* ------------------------------------------------------------------ helpers */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fixUrls = h => h.replace(/(src|href)=(["'])\s*(?:\.\.?\/)*(assets|projects|pages)\//g, '$1=$2/$3/');
const load = f => cheerio.load(fs.readFileSync(new URL('../pages/' + f + '.html', import.meta.url), 'utf8'), null, false);
const url = (lang, slug = '') => `${BASE}/${lang === 'tr' ? 'tr/' : ''}${slug ? slug + '/' : ''}`;
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const isBlank = src => { try { return fs.statSync(path.join(ROOT, src.replace(/^\//, ''))).size < 3000; } catch { return false; } };
const initials = n => n.split(/\s+/).filter(Boolean).map((w, i, a) => (i === 0 || i === a.length - 1) ? w[0] : '').join('').toUpperCase();
const avatarHtml = (name, src, size, cls = '') => (src && !isBlank(src)) ? `<img class="${cls}" src="${esc(src)}" alt="${esc(name)}" width="${size}" height="${size}" loading="lazy">` : `<span class="av-init ${cls}" style="width:${size}px;height:${size}px" role="img" aria-label="${esc(name)}">${esc(initials(name))}</span>`;
const abs = (lang, slug) => ORIGIN + url(lang, slug);

/** Clone `el` keeping only the requested language; falls back to the other language when empty. */
function L($, el, lang) {
  const build = keep => {
    const c = $(el).filter((i, e) => !$(e).attr('data-lang') || $(e).attr('data-lang') === keep).clone();
    c.find('[data-lang]').each((i, e) => { if ($(e).attr('data-lang') !== keep) $(e).remove(); else $(e).removeAttr('data-lang').removeAttr('style'); });
    c.removeAttr('data-lang').removeAttr('style');
    c.find('img').each((i, im) => { const s = $(im).attr('src'); if (s) $(im).attr('src', s.trim()); });
    return c;
  };
  let c = build(lang);
  if (!c.text().trim() && !c.find('img').length) c = build(lang === 'en' ? 'tr' : 'en');
  return c;
}
const text = ($, el, lang) => L($, el, lang).text().replace(/\s+/g, ' ').trim();
const inner = ($, el, lang) => fixUrls((L($, el, lang).html() || '').trim());

const UI = {
  en: { home: 'Home', folders: 'Folders', all: 'All', items: 'items', back: 'Home', close: 'Close', min: 'Minimize', zoom: 'Zoom', menuLabel: 'Sections', skip: 'Skip to content', theme: 'Theme', glass: 'Glass effect', langLabel: 'Türkçe', langShort: 'TR', read: 'Read more', role: 'Product leader & builder', latest: 'Latest writing', liveProducts: 'live products', productsSub: 'Apps, games & tools built with AI', open: 'Open', download: 'Download PDF', more: 'More', external: 'opens in a new tab', tagline: 'Multi disciplinary product enthusiast', now: 'Currently', glance: 'At a glance', says: 'What people say', certs: 'Certifications', products: 'Products', articles: 'Articles', refs: 'References', certsN: 'Certificates', viewCv: 'Open CV', contact: 'Contact', calendar: 'Calendar', today: 'Today', addContact: 'Add to Contacts', sticky: 'Sticky note', stickyPh: 'Jot something down. It stays in this browser.', callMe: 'Call me', mailMe: 'Email me', search: 'Search', searchPh: 'Search sections, writing, projects, CV…', searchEmpty: 'No results', searchSections: 'Sections', searchHint: 'to open', goTo: 'Go to' },
  tr: { home: 'Ana ekran', folders: 'Klasörler', all: 'Tümü', items: 'öğe', back: 'Ana ekran', close: 'Kapat', min: 'Küçült', zoom: 'Büyüt', menuLabel: 'Bölümler', skip: 'İçeriğe geç', theme: 'Tema', glass: 'Cam efekti', langLabel: 'English', langShort: 'EN', read: 'Devamını oku', role: 'Ürün lideri ve üretici', latest: 'Son yazılar', liveProducts: 'canlı ürün', productsSub: 'AI ile inşa edilmiş uygulama ve araçlar', open: 'Aç', download: 'PDF indir', more: 'Daha fazla', external: 'yeni sekmede açılır', tagline: 'Çok disiplinli ürün meraklısı', now: 'Şu an', glance: 'Bir bakışta', says: 'Ne diyorlar', certs: 'Sertifikalar', products: 'Ürün', articles: 'Yazı', refs: 'Referans', certsN: 'Sertifika', viewCv: 'CV’yi aç', contact: 'İletişim', calendar: 'Takvim', today: 'Bugün', addContact: 'Rehbere ekle', sticky: 'Yapışkan not', stickyPh: 'Bir şey not al. Bu tarayıcıda kalır.', callMe: 'Beni ara', mailMe: 'E-posta gönder', search: 'Ara', searchPh: 'Bölümlerde, yazılarda, projelerde, CV’de ara…', searchEmpty: 'Sonuç yok', searchSections: 'Bölümler', searchHint: 'açmak için', goTo: 'Git' }
};
const NAV = {
  en: { about: 'About', cv: 'CV', references: 'References', showcase: 'Showcase', blog: 'Blog', builder: 'Builder' },
  tr: { about: 'Hakkımda', cv: 'CV', references: 'Referanslar', showcase: 'Vitrin', blog: 'Blog', builder: 'İnşacı' }
};
const ICONS = {
  about: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  cv: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  references: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  showcase: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  blog: '<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M13 7l4 4"/>',
  builder: '<path d="M14 7l3-3 3 3-3 3z"/><path d="M4 20l9-9M12 5l7 7"/>',
  linkedin: '<path d="M6 9v10M6 5v.01M11 19v-6a3 3 0 016 0v6M11 9v10"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 4v-3a3 3 0 00-1-2c3 0 6-1.5 6-6a5 5 0 00-1-3 5 5 0 000-3s-1-.3-3 1a10 10 0 00-6 0C8 3 7 3.3 7 3.3a5 5 0 000 3 5 5 0 00-1 3c0 4.5 3 6 6 6a3 3 0 00-1 2v3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  file: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  arrow: '<path d="M7 17L17 7M17 7H8M17 7v9"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  addc: '<circle cx="10" cy="8" r="3.6"/><path d="M3.5 20c0-3.6 2.9-6 6.5-6 1.4 0 2.6.3 3.6 1M18 14v6M15 17h6"/>',
  cc: '<rect x="3" y="4" width="18" height="7" rx="3.5"/><circle cx="16.5" cy="7.5" r="1.3" fill="currentColor"/><rect x="3" y="13" width="18" height="7" rx="3.5"/><circle cx="7.5" cy="16.5" r="1.3" fill="currentColor"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
};
const svg = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[n]}</svg>`;

/* Filled, SF Symbols-style glyphs for the app tiles (Apple's own symbols cannot be redistributed on the web) */
const TILE = {
  about: '<circle cx="12" cy="7.4" r="4.3"/><path d="M3.7 20.3c0-4.4 3.7-7.1 8.3-7.1s8.3 2.7 8.3 7.1c0 .9-.6 1.5-1.5 1.5H5.2c-.9 0-1.5-.6-1.5-1.5z"/>',
  cv: '<path fill-rule="evenodd" d="M7 2.5h6.9l5.6 5.6V19a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 19V5A2.5 2.5 0 0 1 7 2.5zM7.8 12.2v1.6h8.4v-1.6zm0 3.5v1.6h8.4v-1.6zm0-7v1.6h4.4V8.7z"/>',
  references: '<path fill-rule="evenodd" d="M12 3C6.8 3 2.8 6.5 2.8 10.9c0 2.3 1.1 4.3 2.9 5.7-.1 1.2-.6 2.4-1.6 3.4-.3.3-.1.9.4.9 2 0 3.7-.8 5-1.8.8.2 1.6.3 2.5.3 5.2 0 9.2-3.5 9.2-8.5S17.2 3 12 3zM8.3 9.1h2.7v2.7c0 1.4-.9 2.2-2.4 2.4l-.3-.9c.8-.2 1-.6 1-1.1H8.3zm4.6 0h2.7v2.7c0 1.4-.9 2.2-2.4 2.4l-.3-.9c.8-.2 1-.6 1-1.1h-1z"/>',
  showcase: '<rect x="3.5" y="3.5" width="7.4" height="7.4" rx="2.2"/><rect x="13.1" y="3.5" width="7.4" height="7.4" rx="2.2"/><rect x="3.5" y="13.1" width="7.4" height="7.4" rx="2.2"/><rect x="13.1" y="13.1" width="7.4" height="7.4" rx="2.2"/>',
  blog: '<path d="M16.6 3.1l4.3 4.3-1.9 1.9-4.3-4.3z"/><path d="M13.3 6.4l4.3 4.3-7.9 7.9-5.2.9.9-5.2z"/><path d="M14 20.2h6.4a1.1 1.1 0 0 0 0-2.2H14a1.1 1.1 0 0 0 0 2.2z"/>',
  builder: '<path d="M9.6 3l2 5.4L17 10.4l-5.4 2L9.6 18 7.6 12.4 2.2 10.4l5.4-2z"/><path d="M18 2.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/><path d="M18 15.2l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/>',
  phone: '<path d="M6.5 2.9c.6-.6 1.5-.5 2 .1l2 2.6c.4.5.4 1.2 0 1.7l-1.2 1.5c1 2 2.6 3.6 4.6 4.7l1.6-1.1c.6-.4 1.3-.3 1.8.1l2.5 2.1c.6.5.7 1.4.1 2-1.4 1.6-3.5 2.3-5.5 1.7-5-1.5-8.9-5.4-10.3-10.4-.5-2 .1-4 1.5-5.3z"/>',
  mail: '<path fill-rule="evenodd" d="M5.2 4.5h13.6a2.7 2.7 0 0 1 2.7 2.7v9.6a2.7 2.7 0 0 1-2.7 2.7H5.2a2.7 2.7 0 0 1-2.7-2.7V7.2a2.7 2.7 0 0 1 2.7-2.7zM4.6 7.4l7.4 5.6 7.4-5.6v1.9L12 15 4.6 9.3z"/>',
  linkedin: '<path d="M4.6 9.4h3v10.2h-3zM6.1 4.4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM10.4 9.4h2.9v1.4c.5-.9 1.7-1.6 3.2-1.6 3.1 0 3.6 2 3.6 4.7v5.7h-3v-5.1c0-1.2 0-2.7-1.7-2.7s-2 1.3-2 2.6v5.2h-3z"/>'
};
TILE.terminal = '<path d="M4.4 5.6 6.2 3.9 14.2 12 6.2 20.1 4.4 18.4 10.6 12z"/><rect x="14.6" y="17.4" width="5.8" height="2.3" rx="1.15"/>';
TILE.finder = '<path d="M3 7.2A2.7 2.7 0 0 1 5.7 4.5h3.4c.5 0 1 .2 1.3.6l1 1.1c.2.2.5.3.8.3h6.1A2.7 2.7 0 0 1 21 9.2v8.1a2.7 2.7 0 0 1-2.7 2.7H5.7A2.7 2.7 0 0 1 3 17.3z"/>';
TILE.ask = '<path fill-rule="evenodd" d="M12 3C6.9 3 2.8 6.4 2.8 10.7c0 2.3 1.2 4.3 3.1 5.7-.1 1.3-.7 2.5-1.7 3.5-.3.3-.1.8.4.8 2.2 0 3.9-.9 5.2-1.9.7.1 1.4.2 2.2.2 5.1 0 9.2-3.4 9.2-8.3S17.1 3 12 3zM7.3 10.7a1.15 1.15 0 1 0 2.3 0 1.15 1.15 0 1 0-2.3 0zm3.55 0a1.15 1.15 0 1 0 2.3 0 1.15 1.15 0 1 0-2.3 0zm3.55 0a1.15 1.15 0 1 0 2.3 0 1.15 1.15 0 1 0-2.3 0z"/>';
TILE.settings = '<path fill-rule="evenodd" d="M10.4 2.6h3.2l.6 2.4c.5.2 1 .5 1.5.8l2.3-.8 1.6 2.8-1.8 1.6c.1.6.1 1.1 0 1.7l1.8 1.6-1.6 2.8-2.3-.8c-.5.3-1 .6-1.5.8l-.6 2.4h-3.2l-.6-2.4c-.5-.2-1-.5-1.5-.8l-2.3.8-1.6-2.8 1.8-1.6a5 5 0 0 1 0-1.7L4.4 7.8 6 5l2.3.8c.5-.3 1-.6 1.5-.8zM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z"/>';
TILE.notes = '<path fill-rule="evenodd" d="M6.5 3.5h11A2.5 2.5 0 0 1 20 6v12a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18V6a2.5 2.5 0 0 1 2.5-2.5zM7.6 8v1.5h8.8V8zm0 3.6v1.5h8.8v-1.5zm0 3.6v1.5h5.2v-1.5z"/>';
const PETALS = ['#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#007AFF', '#AF52DE', '#FF2D55', '#FF3B30'];
const PHOTOS_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" stroke="none">${PETALS.map((c, i) => `<ellipse cx="12" cy="7.3" rx="2.5" ry="4.4" fill="${c}" opacity=".88" transform="rotate(${i * 45} 12 12)" style="mix-blend-mode:multiply"/>`).join('')}</svg>`;
const tile = n => n === 'photos' ? PHOTOS_SVG : TILE[n] ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="#fff" stroke="none">${TILE[n]}</svg>` : svg(n);
const LINKS = [
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/berkayvuran' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/berkayvuran' },
  { id: 'phone', label: { en: 'Call', tr: 'Ara' }, href: 'tel:+905424239930' },
  { id: 'mail', app: 'mail', label: { en: 'Mail', tr: 'Posta' }, href: 'mailto:berkaypsy@gmail.com' }
];


/* ------------------------------------------------------------------ virtual apps (Terminal, Notes, Photos, Mail) + Control Center strings */
const APP = {
  en: {
    names: { terminal: 'Terminal', notes: 'Notes', photos: 'Photos', mail: 'Mail', finder: 'Finder', ask: 'Ask', settings: 'Settings' },
    descs: { terminal: 'Command line: try help, about, projects or sudo hire berkay', notes: 'Writing, as notes', photos: 'Certificates, websites and projects as photos', mail: 'Send Berkay a message', finder: 'Resume, contact card and pictures to download', ask: 'Ask questions about Berkay and get answers from this site', settings: 'Theme, wallpaper, language, display and sound' },
    apps: 'Apps',
    finder: { fav: 'Favorites', all: 'All Files', open: 'Open', download: 'Download', items: 'items', folders: { documents: 'Documents', pictures: 'Pictures', certificates: 'Certificates' }, empty: 'Nothing here' },
    ask: { ph: 'Ask about Berkay…', hello: 'Hi! I am a small assistant that only knows this site. Ask me about Berkay’s work, projects, writing or how to reach him.', chips: ['Who is Berkay?', 'What does he do now?', 'Show his projects', 'How can I contact him?', 'Where did he work?'], fallback: 'I do not know that one yet. I can only answer from what is on this site. The best way to ask Berkay directly is to write to him.', send: 'Send', mailCta: 'Write to Berkay', you: 'You' },
    mc: { title: 'Mission Control', desktop: 'Desktop', none: 'No open windows. Open an app from the dock.', hint: 'Esc to close', close: 'Close window' },
    ccMC: 'Mission Control',
    cc: 'Control Center', ccTheme: 'Theme', ccGlass: 'Glass', ccLang: 'Language', ccSound: 'Sound', ccWall: 'Wallpaper', ccBright: 'Display', ccLock: 'Lock Screen', ccOn: 'On', ccOff: 'Off',
    walls: { default: 'Default', aurora: 'Aurora', sunset: 'Sunset', ocean: 'Ocean' },
    lock: { hint: 'Click or press any key to enter', hintTouch: 'Tap to enter' },
    ql: { open: 'Open', close: 'Close', prev: 'Previous', next: 'Next', hint: 'Space to close' },
    ctx: { terminal: 'Open Terminal', search: 'Search…', wallpaper: 'Wallpaper', theme: 'Theme', lock: 'Lock Screen', cc: 'Control Center', about: 'About this site' },
    mail: { newMsg: 'New Message', to: 'To', name: 'Your name', email: 'Your email', subject: 'Subject', message: 'Message', send: 'Send', sending: 'Sending…', sent: 'Thank you! Your message is on its way.', opening: 'Your message is ready. If nothing opened, send it with:', mailApp: 'Mail app', copyMsg: 'Copy message', copy: 'Copy address', copied: 'Copied', required: 'Please add your email and a message.', failed: 'Could not send. Please email directly:', subjectDefault: 'Hello from berkayvuran.com', or: 'Or reach me directly', again: 'Write another' },
    notes: { all: 'All Notes', read: 'Read the full article', back: 'Notes', pick: 'Pick a note on the left' },
    photos: { all: 'All', open: 'Open' },
    term: {
      welcome: 'Berkay Vuran, version 1.0. Type "help" to see what you can do.', prompt: 'guest@berkayvuran', unknown: 'command not found:', tryHelp: 'Type "help" for the list of commands.',
      help: [['help', 'show this list'], ['about', 'who I am'], ['experience', 'where I have worked'], ['education', 'where I studied'], ['projects', 'AI-built products you can open'], ['blog', 'latest writing'], ['skills', 'what I do'], ['contact', 'phone, email and links'], ['open <name>', 'open a window: about, cv, references, showcase, blog, builder, notes, photos, mail'], ['theme <name>', 'dark, light, matrix or zap'], ['wallpaper <name>', 'default, aurora, sunset or ocean'], ['lang <en|tr>', 'switch language'], ['lock', 'show the lock screen'], ['ls / cat <file>', 'look around'], ['neofetch', 'system info'], ['snake', 'a tiny game'], ['cowsay <text>', 'a talking cow'], ['matrix', 'follow the white rabbit'], ['date, echo, history, clear, exit', 'the usual']],
      files: ['about.txt', 'contact.txt', 'cv.txt', 'projects/', 'blog/'], noFile: 'No such file:', usage: 'usage:', opened: 'opening', themeSet: 'theme set to', wallSet: 'wallpaper set to', langSwitch: 'switching language…', badTheme: 'unknown theme. Try: dark, light, matrix, zap', badWall: 'unknown wallpaper. Try: default, aurora, sunset, ocean', badOpen: 'unknown window. Try: about, cv, references, showcase, blog, builder, notes, photos, mail',
      sudo: ['[sudo] password for guest: ********', 'Access granted. Hiring pipeline unlocked.', 'Opening the mail app, say hi at berkaypsy@gmail.com.'], root: 'Nice try. This is a very polite machine, but it is not that polite.', hello: 'Hello! Great to see you here.', matrixMsg: 'Wake up, Neo…', snakeHint: 'Arrow keys or WASD to move, q to quit. Swipe on touch.', exit: 'Closing the terminal…',
      neofetch: ['Berkay Vuran', 'OS', 'Product Leader 1.0', 'Role', 'Product leader and builder', 'Focus', 'AI, ML, data and real workflows', 'Shell', 'berkayvuran.com', 'Theme']
    }
  },
  tr: {
    names: { terminal: 'Terminal', notes: 'Notlar', photos: 'Fotoğraflar', mail: 'Posta', finder: 'Finder', ask: 'Sor', settings: 'Ayarlar' },
    descs: { terminal: 'Komut satırı: help, about, projects veya sudo hire berkay dene', notes: 'Yazılar, not olarak', photos: 'Sertifikalar, web siteleri ve projeler, fotoğraf olarak', mail: 'Berkay’a mesaj gönder', finder: 'CV, kartvizit ve indirilebilir resimler', ask: 'Berkay hakkında sor, cevabı bu siteden al', settings: 'Tema, duvar kâğıdı, dil, ekran ve ses' },
    apps: 'Uygulamalar',
    finder: { fav: 'Sık Kullanılanlar', all: 'Tüm Dosyalar', open: 'Aç', download: 'İndir', items: 'öğe', folders: { documents: 'Belgeler', pictures: 'Resimler', certificates: 'Sertifikalar' }, empty: 'Burada bir şey yok' },
    ask: { ph: 'Berkay hakkında sor…', hello: 'Merhaba! Ben yalnızca bu siteyi bilen küçük bir asistanım. Berkay’ın işini, projelerini, yazılarını ya da ona nasıl ulaşacağını sorabilirsin.', chips: ['Berkay kim?', 'Şu an ne yapıyor?', 'Projelerini göster', 'Ona nasıl ulaşırım?', 'Nerelerde çalıştı?'], fallback: 'Bunu henüz bilmiyorum. Yalnızca bu sitedeki bilgilerden cevap verebilirim. Berkay’a doğrudan sormanın en iyi yolu ona yazmak.', send: 'Gönder', mailCta: 'Berkay’a yaz', you: 'Sen' },
    mc: { title: 'Mission Control', desktop: 'Masaüstü', none: 'Açık pencere yok. Dock’tan bir uygulama aç.', hint: 'Kapatmak için Esc', close: 'Pencereyi kapat' },
    ccMC: 'Mission Control',
    cc: 'Denetim Merkezi', ccTheme: 'Tema', ccGlass: 'Cam', ccLang: 'Dil', ccSound: 'Ses', ccWall: 'Duvar kâğıdı', ccBright: 'Ekran', ccLock: 'Ekranı Kilitle', ccOn: 'Açık', ccOff: 'Kapalı',
    walls: { default: 'Varsayılan', aurora: 'Aurora', sunset: 'Gün batımı', ocean: 'Okyanus' },
    lock: { hint: 'Girmek için tıkla veya bir tuşa bas', hintTouch: 'Girmek için dokun' },
    ql: { open: 'Aç', close: 'Kapat', prev: 'Önceki', next: 'Sonraki', hint: 'Kapatmak için Boşluk' },
    ctx: { terminal: 'Terminal’i aç', search: 'Ara…', wallpaper: 'Duvar kâğıdı', theme: 'Tema', lock: 'Ekranı Kilitle', cc: 'Denetim Merkezi', about: 'Bu site hakkında' },
    mail: { newMsg: 'Yeni İleti', to: 'Kime', name: 'Adın', email: 'E-posta adresin', subject: 'Konu', message: 'Mesaj', send: 'Gönder', sending: 'Gönderiliyor…', sent: 'Teşekkürler! Mesajın yolda.', opening: 'Mesajın hazır. Hiçbir şey açılmadıysa şunlardan biriyle gönder:', mailApp: 'Posta uygulaması', copyMsg: 'Mesajı kopyala', copy: 'Adresi kopyala', copied: 'Kopyalandı', required: 'Lütfen e-posta adresini ve mesajını ekle.', failed: 'Gönderilemedi. Doğrudan e-posta at:', subjectDefault: 'berkayvuran.com’dan merhaba', or: 'Ya da doğrudan ulaş', again: 'Bir tane daha yaz' },
    notes: { all: 'Tüm Notlar', read: 'Yazının tamamını oku', back: 'Notlar', pick: 'Soldan bir not seç' },
    photos: { all: 'Tümü', open: 'Aç' },
    term: {
      welcome: 'Berkay Vuran, sürüm 1.0. Neler yapabileceğini görmek için "help" yaz.', prompt: 'misafir@berkayvuran', unknown: 'komut bulunamadı:', tryHelp: 'Komut listesi için "help" yaz.',
      help: [['help', 'bu listeyi göster'], ['about', 'ben kimim'], ['experience', 'nerelerde çalıştım'], ['education', 'nerede okudum'], ['projects', 'açabileceğin AI ürünleri'], ['blog', 'son yazılar'], ['skills', 'ne yaparım'], ['contact', 'telefon, e-posta ve bağlantılar'], ['open <ad>', 'pencere aç: about, cv, references, showcase, blog, builder, notes, photos, mail'], ['theme <ad>', 'dark, light, matrix veya zap'], ['wallpaper <ad>', 'default, aurora, sunset veya ocean'], ['lang <en|tr>', 'dili değiştir'], ['lock', 'kilit ekranını göster'], ['ls / cat <dosya>', 'etrafa bak'], ['neofetch', 'sistem bilgisi'], ['snake', 'küçük bir oyun'], ['cowsay <metin>', 'konuşan inek'], ['matrix', 'beyaz tavşanı takip et'], ['date, echo, history, clear, exit', 'bildiklerin']],
      files: ['about.txt', 'contact.txt', 'cv.txt', 'projects/', 'blog/'], noFile: 'Böyle bir dosya yok:', usage: 'kullanım:', opened: 'açılıyor', themeSet: 'tema ayarlandı:', wallSet: 'duvar kâğıdı ayarlandı:', langSwitch: 'dil değiştiriliyor…', badTheme: 'bilinmeyen tema. Dene: dark, light, matrix, zap', badWall: 'bilinmeyen duvar kâğıdı. Dene: default, aurora, sunset, ocean', badOpen: 'bilinmeyen pencere. Dene: about, cv, references, showcase, blog, builder, notes, photos, mail',
      sudo: ['[sudo] misafir için parola: ********', 'Erişim verildi. İşe alım hattı açıldı.', 'Posta uygulaması açılıyor, merhaba de: berkaypsy@gmail.com.'], root: 'Güzel deneme. Bu makine çok kibar ama o kadar da değil.', hello: 'Merhaba! Burada olman çok güzel.', matrixMsg: 'Uyan, Neo…', snakeHint: 'Hareket için ok tuşları ya da WASD, çıkmak için q. Dokunmatikte kaydır.', exit: 'Terminal kapatılıyor…',
      neofetch: ['Berkay Vuran', 'İS', 'Ürün Lideri 1.0', 'Rol', 'Ürün lideri ve üretici', 'Odak', 'AI, ML, veri ve gerçek iş akışları', 'Kabuk', 'berkayvuran.com', 'Tema']
    }
  }
};
const VAPPS = ['terminal', 'notes', 'photos', 'finder', 'ask', 'settings'];
const vFallback = (id, lang) => id === 'terminal' ? url(lang, 'about') : id === 'notes' ? url(lang, 'blog') : id === 'photos' ? url(lang, 'showcase') : id === 'finder' ? (lang === 'tr' ? '/assets/appendices/berkay-vuran-ozgecmis.pdf' : '/assets/appendices/berkay-vuran-resume.pdf') : id === 'ask' || id === 'settings' ? url(lang, 'about') : 'mailto:berkaypsy@gmail.com';
const vIcon = (id, lang, cls = 'icon') => `<a class="${cls} c-${id}" href="${esc(vFallback(id, lang))}" data-vapp="${id}"><span class="tile">${tile(id)}</span><span class="lbl">${esc(APP[lang].names[id])}</span></a>`;

/* ------------------------------------------------------------------ parsers */
function parseAbout(lang) {
  const $ = load('about');
  const body = inner($, $('section.about-text'), lang);
  const services = $('li.service-item').map((i, li) => ({
    icon: ($(li).find('img').attr('src') || '').trim(),
    title: text($, $(li).find('.service-content-box').children('h4'), lang),
    text: text($, $(li).find('.service-content-box').children('p'), lang)
  })).get();
  const heading = text($, $('section.service > h3'), lang);
  return { body, services, heading };
}

function parseCv(lang) {
  const $ = load('cv');
  const ids = ['experience', 'education', 'volunteering', 'publications', 'test-scores'];
  const groups = $('section.timeline').map((gi, sec) => {
    const title = text($, $(sec).find('button.accordion h3'), lang) || ids[gi];
    const items = $(sec).find('li.timeline-item').map((ii, li) => {
      const c = L($, li, lang);
      const t = c.find('h4').first().text().replace(/\s+/g, ' ').trim();
      c.find('h4').first().remove();
      const dateEl = c.find('span').first();
      const date = dateEl.text().replace(/\s+/g, ' ').trim();
      dateEl.remove();
      c.find('a').each((i, a) => { if (!$(a).text().trim()) $(a).remove(); });
      c.find('u').each((i, u) => { if (!$(u).text().trim()) $(u).remove(); });
      c.find('p.timeline-text').each((i, p) => {
        const h = $(p).html() || '';
        if (h.includes('⇢')) {
          const lis = h.split('⇢').map(s => s.replace(/<br\s*\/?>/gi, '').trim()).filter(Boolean).map(s => `<li>${s}</li>`).join('');
          $(p).replaceWith(`<ul class="bul">${lis}</ul>`);
        }
      });
      c.find('[class]').removeAttr('class');
      const [role, org] = t.split(/\s+@/);
      return { role: role.trim(), org: org ? org.trim() : '', date, body: fixUrls((c.html() || '').trim()) };
    }).get();
    return { id: ids[gi], title, items };
  }).get();
  return groups;
}

function parseRefs(lang) {
  const $ = load('references');
  return $('section.testimonials').map((gi, sec) => {
    const rawTitle = text($, $(sec).find('.service-title'), lang);
    const label = rawTitle.replace(/^Testimonials from\s+/i, '').replace(/\s+Referansları$/i, '');
    const items = $(sec).find('li.testimonials-item').map((ii, li) => {
      const img = $(li).find('img').first();
      const name = $(li).find('.testimonials-item-title').text().trim();
      const box = L($, $(li).find('.testimonials-text'), lang);
      const role = box.find('strong').first().text().trim();
      box.find('p').each((i, p) => { if (!$(p).text().trim() || $(p).children('strong').length && $(p).text().trim() === role) $(p).remove(); });
      box.find('[class],[style]').removeAttr('class').removeAttr('style');
      return { name, role, avatar: fixUrls(`src="${(img.attr('src') || '').trim()}"`).slice(5, -1), html: fixUrls((box.html() || '').trim()), plain: box.text().replace(/\s+/g, ' ').trim() };
    }).get();
    return { id: 'c' + gi, label, items };
  }).get();
}

function parseShowcase(lang) {
  const $ = load('showcase');
  const keys = ['all', 'certifications', 'my creations', 'with my coordination', 'with my collaboration'];
  const labels = $('li.filter-item').map((i, li) => text($, li, lang)).get();
  const cats = keys.map((k, i) => ({ id: k.replace(/\s+/g, '-'), key: k, label: labels[i] || k }));
  const items = $('li.project-item').map((i, li) => {
    const a = $(li).find('> a').first();
    const im = a.find('img').first();
    return {
      href: fixUrls(`href="${a.attr('href') || ''}"`).slice(6, -1),
      img: (im.attr('src') || '').trim(), w: im.attr('width'), h: im.attr('height'), alt: im.attr('alt') || '',
      title: text($, a.find('.project-title'), lang),
      cat: ($(li).attr('data-category') || '').trim(),
      catLabel: text($, a.find('.project-category'), lang)
    };
  }).get();
  return { cats, items };
}

function parseBlog(lang) {
  const $ = load('blog');
  return $('li.blog-post-item').map((i, li) => {
    const a = $(li).find('> a').first();
    const im = a.find('img').first();
    const dt = a.find('time').attr('datetime');
    return {
      href: a.attr('href'), img: (im.attr('src') || '').trim(), alt: im.attr('alt') || '',
      cat: a.find('.blog-category').text().trim(), date: dt,
      title: a.find('.blog-item-title').text().trim(),
      excerpt: a.find('.blog-text').text().replace(/\s+/g, ' ').trim()
    };
  }).get();
}

function parseBuilder(lang) {
  const $ = load('builder');
  const cards = $('a.builder-card').map((i, a) => {
    const ic = $(a).find('.builder-card-icon');
    return {
      href: fixUrls(`href="${$(a).attr('href')}"`).slice(6, -1),
      icon: ic.text().trim(), color: (ic.attr('class') || '').replace('builder-card-icon', '').trim(),
      name: text($, $(a).find('.builder-card-name'), lang), desc: text($, $(a).find('.builder-card-desc'), lang),
      tags: $(a).find('.builder-tag').filter((j, t) => !$(t).attr('data-lang') || $(t).attr('data-lang') === lang).map((j, t) => $(t).text().trim()).get()
    };
  }).get();
  const intro = text($, $('.builder-intro'), lang);
  const stats = $('.builder-stat').map((i, s) => ({ num: $(s).find('.builder-stat-num').text().trim(), label: text($, $(s).find('.builder-stat-label'), lang) })).get();
  return { cards, intro, stats };
}

/* ------------------------------------------------------------------ components */
const fmtDate = (iso, lang) => new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function sidebar(lang, entries, defaultId) {
  // entries: [{id,label,count}]
  return `<aside class="win-side" aria-label="${esc(UI[lang].folders)}">
    <p class="side-h">${esc(UI[lang].folders)}</p>
    <ul class="side-list" role="list">${entries.map((e, i) => `<li${entries[0].id === 'all' && i > 0 ? ' class="side-sub"' : ''}><a class="side-item" href="#${esc(e.id)}" data-filter="${esc(e.id)}"${e.id === defaultId ? ' data-default aria-current="true"' : ''}>${svg('folder', 'si')}<span class="sl">${esc(e.label)}</span><span class="sc">${e.count}</span></a>${e.children && e.children.length ? `<ul class="side-sub2" role="list" data-for="${esc(e.id)}">${e.children.map(c => `<li><a class="side-leaf" href="#${esc(c.id)}" data-target="${esc(c.id)}" data-parent="${esc(e.id)}" title="${esc(c.label)}">${esc(c.label)}</a></li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>
  </aside>`;
}


const PHONE = { tel: '+905424239930', show: '+90 542 423 99 30' };
const VCARD = (() => {
  const photo = fs.readFileSync(new URL('./src/vcard-photo.jpg', import.meta.url)).toString('base64').match(/.{1,74}/g).map((l, i) => (i ? ' ' : '') + l).join('\r\n');
  return ['BEGIN:VCARD', 'VERSION:3.0', 'N:Vuran;Berkay;;;', 'FN:Berkay Vuran', 'TITLE:Product Leader & Builder', `TEL;TYPE=CELL,VOICE:${PHONE.tel}`, 'EMAIL;TYPE=INTERNET,PREF:berkaypsy@gmail.com', `URL:${ORIGIN}`, 'URL:https://www.linkedin.com/in/berkayvuran', 'URL:https://github.com/berkayvuran', 'PHOTO;ENCODING=b;TYPE=JPEG:' + photo, 'END:VCARD', ''].join('\r\n');
})();
const contactCard = (lang, cls = '') => { const u = UI[lang]; return `<div class="contact ${cls}"><a class="call-btn" href="tel:${PHONE.tel}"><span class="cb-ic">${tile('phone')}</span><span class="cb-t"><small>${esc(u.callMe)}</small><b>${PHONE.show}</b></span></a><a class="mail-btn" href="mailto:berkaypsy@gmail.com"><span class="cb-ic">${tile('mail')}</span><span class="cb-t"><small>${esc(u.mailMe)}</small><b>berkaypsy@gmail.com</b></span></a><a class="vc-btn" href="${BASE}/berkay-vuran.vcf" download="berkay-vuran.vcf">${svg('addc')}<span>${esc(u.addContact)}</span></a></div>`; };

function winAbout(lang) {
  const d = parseAbout(lang);
  return {
    side: '',
    body: `<article class="doc">
      ${contactCard(lang, 'in-win')}
      <div class="prose">${d.body}</div>
      <h2 class="doc-h">${esc(d.heading)}</h2>
      <ul class="cards3" role="list">${d.services.map(s => `<li class="card"><img src="${esc(fixUrls('src="' + s.icon + '"').slice(5, -1))}" alt="" width="40" height="40" loading="lazy"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ul>
    </article>`,
    meta: { count: d.services.length }
  };
}

function winCv(lang) {
  const g = parseCv(lang);
  const pdf = lang === 'tr' ? '/assets/appendices/berkay-vuran-ozgecmis.pdf' : '/assets/appendices/berkay-vuran-resume.pdf';
  const side = sidebar(lang, [{ id: 'all', label: UI[lang].all, count: g.reduce((n, x) => n + x.items.length, 0) }, ...g.map(x => ({ id: x.id, label: x.title, count: x.items.length, children: x.items.map((it, i) => ({ id: `cv-${x.id}-${i}`, label: it.role + (it.org ? ' · ' + it.org : '') })) }))], 'experience');
  const body = `<div class="toolbar"><a class="btn" href="${pdf}" target="_blank" rel="noopener noreferrer">${svg('download')}<span>${esc(UI[lang].download)}</span></a></div>` +
    g.map(grp => `<section class="group" id="${grp.id}" data-group="${grp.id}" aria-labelledby="${grp.id}-h">
      <h2 class="group-h" id="${grp.id}-h">${esc(grp.title)} <span class="muted">${grp.items.length} ${esc(UI[lang].items)}</span></h2>
      <div class="rows">${grp.items.map((it, i) => `<details class="row" id="cv-${grp.id}-${i}"${grp.id === 'experience' && i === 0 ? ' open' : ''}>
        <summary>${svg(grp.id === 'experience' ? 'file' : 'file', 'ri')}<span class="rt"><b>${esc(it.role)}</b>${it.org ? `<span class="org">${esc(it.org)}</span>` : ''}</span><span class="rd">${esc(it.date)}</span></summary>
        <div class="row-body">${it.body}</div></details>`).join('')}</div></section>`).join('');
  return { side, body, meta: { groups: g } };
}

function winRefs(lang) {
  const groups = parseRefs(lang);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const side = sidebar(lang, [{ id: 'all', label: UI[lang].all, count: total }, ...groups.map(g => ({ id: g.id, label: g.label, count: g.items.length, children: g.items.map((it, i) => ({ id: `ref-${g.id}-${i}`, label: it.name })) }))], 'all');
  const cards = groups.flatMap(g => g.items.map((it, i) => ({ ...it, g, n: i })));
  const body = `<ul class="people" role="list">${cards.map(it => `<li class="person" id="ref-${it.g.id}-${it.n}" data-cat="${it.g.id}"><details>
      <summary>${avatarHtml(it.name, it.avatar, 56)}<span class="pn"><b>${esc(it.name)}</b><span>${esc(it.role)}</span><em>${esc(it.g.label)}</em></span></summary>
      <div class="quote">${it.html}</div></details></li>`).join('')}</ul>`;
  return { side, body, meta: { total, groups } };
}

function winShowcase(lang) {
  const { cats, items } = parseShowcase(lang);
  const counts = k => k === 'all' ? items.length : items.filter(i => i.cat === k).length;
  const side = sidebar(lang, cats.map(c => ({ id: c.id, label: c.label, count: counts(c.key), children: c.key === 'all' ? [] : items.map((it, i) => ({ it, i })).filter(x => x.it.cat === c.key).map(x => ({ id: `sc-${x.i}`, label: x.it.title })) })), 'all');
  const body = `<ul class="grid" role="list">${items.map((it, i) => `<li class="tile-card" id="sc-${i}" data-cat="${esc(it.cat.replace(/\s+/g, '-'))}">
    <a href="${esc(it.href)}" target="_blank" rel="noopener noreferrer">
      <img src="${esc(fixUrls('src="' + it.img + '"').slice(5, -1))}" alt="${esc(it.alt || it.title)}" width="${esc(it.w || 600)}" height="${esc(it.h || 270)}" loading="lazy" decoding="async">
      <span class="tc-t">${esc(it.title)}</span><span class="tc-c">${esc(it.catLabel)}</span></a></li>`).join('')}</ul>`;
  return { side, body, meta: { items, cats } };
}

function winBlog(lang) {
  const posts = parseBlog(lang);
  const catCount = {};
  posts.forEach(p => { catCount[p.cat] = (catCount[p.cat] || 0) + 1; });
  const cats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ id: slugify(c), label: c, count: n, children: posts.map((p, i) => ({ p, i })).filter(x => x.p.cat === c).map(x => ({ id: `bl-${x.i}`, label: x.p.title })) }));
  const side = sidebar(lang, [{ id: 'all', label: UI[lang].all, count: posts.length }, ...cats], 'all');
  const body = `<ol class="posts" reversed>${posts.map((p, i) => `<li class="post" id="bl-${i}" data-cat="${slugify(p.cat)}"><a href="${esc(p.href)}" target="_blank" rel="noopener noreferrer">
    <img src="${esc(fixUrls('src="' + p.img + '"').slice(5, -1))}" alt="" width="120" height="60" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async">
    <span class="pt"><b>${esc(p.title)}</b><span class="pe">${esc(p.excerpt)}</span></span>
    <span class="pm"><span class="pc">${esc(p.cat)}</span><time datetime="${esc(p.date)}">${esc(fmtDate(p.date, lang))}</time></span></a></li>`).join('')}</ol>`;
  return { side, body, meta: { posts } };
}

function winBuilder(lang) {
  const b = parseBuilder(lang);
  const body = `<div class="hero"><p class="intro">${esc(b.intro)}</p><ul class="stats" role="list">${b.stats.map(s => `<li><b>${esc(s.num)}</b><span>${esc(s.label)}</span></li>`).join('')}</ul></div>
  <ul class="launchpad" role="list">${b.cards.map(c => `<li><a class="app" href="${esc(c.href)}"><span class="app-icon ${esc(c.color)}" aria-hidden="true">${c.icon}</span>
    <span class="app-n">${esc(c.name)}</span><span class="app-d">${esc(c.desc)}</span>
    <span class="app-tags">${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}</span></a></li>`).join('')}</ul>`;
  return { side: '', body, meta: b };
}

const WIN = { about: winAbout, cv: winCv, references: winRefs, showcase: winShowcase, blog: winBlog, builder: winBuilder };

/* ------------------------------------------------------------------ SEO copy */
const companiesFromCv = lang => {
  const g = parseCv(lang)[0].items.map(i => i.org).filter(Boolean);
  return [...new Set(g)].slice(0, 4);
};
function seo(lang, slug, data = {}) {
  data = { groups: [], items: [], posts: [], total: 0, ...data };
  const cos = companiesFromCv('en').join(', ');
  const builderCount = parseBuilder(lang).cards.length;
  const en = {
    '': ['Berkay Vuran | Product Leader & Builder', `Berkay Vuran is a product leader with 7+ years across AI, telco, health, logistics and proptech. Explore his CV, showcase, writing and ${builderCount} live AI-built products.`],
    about: ['About Berkay Vuran | Product Leader', 'About Berkay Vuran: a product leader integrating AI, ML and data into real-world workflows, aligning cross-functional teams with business reality. Currently leading a Product Analysis team at SESTEK.'],
    cv: ['CV | Berkay Vuran', `Résumé of Berkay Vuran: product management and analysis roles at ${cos}, plus education, volunteering, publications and test scores. Download the PDF.`],
    references: ['References | Berkay Vuran', `${data.total} testimonials from managers, peers and clients about working with Berkay Vuran across ${data.groups.length} organizations.`],
    showcase: ['Showcase | Berkay Vuran', `Certifications, websites and projects created, coordinated or collaborated on by Berkay Vuran: ${data.items.length} items.`],
    blog: ['Blog | Berkay Vuran', `${data.posts.length} articles by Berkay Vuran on product management, AI, psychology and leadership.`],
    builder: [`Product Builder: ${builderCount} AI-built apps | Berkay Vuran`, `${builderCount} browser-based apps, games and tools built with AI by Berkay Vuran, including a Product Graveyard, a PM decision simulator and more.`]
  };
  const tr = {
    '': ['Berkay Vuran | Ürün Lideri ve Üretici', `Berkay Vuran; yapay zeka, telekom, sağlık, lojistik ve proptech alanlarında 7+ yıl deneyimli bir ürün lideri. CV, vitrin, yazılar ve AI ile inşa edilmiş ${builderCount} canlı ürünü keşfedin.`],
    about: ['Hakkımda | Berkay Vuran', 'Berkay Vuran hakkında: AI, ML ve veriyi gerçek iş akışlarına entegre eden, ekipleri iş gerçekleriyle hizalayan bir ürün lideri. Şu anda SESTEK’te Ürün Analizi ekibine liderlik ediyor.'],
    cv: ['Özgeçmiş (CV) | Berkay Vuran', `Berkay Vuran’ın özgeçmişi: ${cos} gibi kurumlarda ürün yönetimi ve analiz rolleri; eğitim, gönüllülük, yayınlar ve sınav sonuçları. PDF olarak indirin.`],
    references: ['Referanslar | Berkay Vuran', `Yöneticilerden, ekip arkadaşlarından ve müşterilerden ${data.groups.length} kurumdan ${data.total} referans.`],
    showcase: ['Vitrin | Berkay Vuran', `Berkay Vuran’ın oluşturduğu, koordine ettiği veya katkı verdiği sertifikalar, web siteleri ve projeler: ${data.items.length} öğe.`],
    blog: ['Blog | Berkay Vuran', `Berkay Vuran’dan ürün yönetimi, yapay zeka, psikoloji ve liderlik üzerine ${data.posts.length} yazı.`],
    builder: [`Ürün İnşacısı: AI ile ${builderCount} uygulama | Berkay Vuran`, `Berkay Vuran’ın AI ile geliştirdiği ${builderCount} tarayıcı tabanlı uygulama, oyun ve araç: Ürün Mezarlığı, PM karar simülatörü ve daha fazlası.`]
  };
  const [title, description] = (lang === 'tr' ? tr : en)[slug];
  return { title, description };
}

function jsonLd(lang, slug, data, s) {
  const person = { '@type': 'Person', '@id': ORIGIN + '/#person', name: 'Berkay Vuran', url: ORIGIN + '/', image: ORIGIN + '/assets/images/avatars/my-avatar-160.webp', telephone: '+90 542 423 99 30', jobTitle: 'Conversational Intelligence PA Team Leader', worksFor: { '@type': 'Organization', name: 'SESTEK' }, address: { '@type': 'PostalAddress', addressLocality: 'Ankara', addressCountry: 'TR' }, sameAs: ['https://www.linkedin.com/in/berkayvuran', 'https://github.com/berkayvuran', 'https://twitter.com/vuranberkay', 'https://www.instagram.com/vuran.berkay/', 'https://www.facebook.com/vuranberkay', 'https://berkayvuran.medium.com/'] };
  const crumbs = { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: UI[lang].home, item: abs(lang, '') }].concat(slug ? [{ '@type': 'ListItem', position: 2, name: NAV[lang][slug], item: abs(lang, slug) }] : []) };
  const page = { '@type': slug === 'cv' || slug === 'about' ? 'ProfilePage' : slug === 'blog' ? 'Blog' : 'CollectionPage', '@id': abs(lang, slug) + '#page', url: abs(lang, slug), name: s.title, description: s.description, inLanguage: lang, isPartOf: { '@id': ORIGIN + '/#website' }, mainEntity: { '@id': ORIGIN + '/#person' } };
  const graph = [person, { '@type': 'WebSite', '@id': ORIGIN + '/#website', url: ORIGIN + '/', name: 'Berkay Vuran', inLanguage: LANGS, publisher: { '@id': ORIGIN + '/#person' } }, page, crumbs];
  if (slug === 'blog') page.blogPost = data.posts.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: p.href, datePublished: p.date, author: { '@id': ORIGIN + '/#person' } }));
  if (slug === 'builder') graph.push({ '@type': 'ItemList', itemListElement: data.cards.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: ORIGIN + c.href })) });
  if (slug === 'showcase') graph.push({ '@type': 'ItemList', itemListElement: data.items.slice(0, 50).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.title, url: c.href })) });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

/* ------------------------------------------------------------------ shell */
function iconLink(id, lang, cls = 'icon') {
  return `<a class="${cls} c-${id}" href="${url(lang, id)}" data-app="${id}"><span class="tile">${tile(id)}</span><span class="lbl">${esc(NAV[lang][id])}</span></a>`;
}
function extLink(l, lang) {
  const label = typeof l.label === 'string' ? l.label : l.label[lang];
  const ext = l.href.startsWith('http');
  return `<a class="icon c-${l.id}" href="${esc(l.href)}"${l.app ? ` data-vapp="${l.app}"` : ''}${ext ? ' target="_blank" rel="noopener noreferrer"' : ''} aria-label="${esc(label)}${ext ? ' (' + UI[lang].external + ')' : ''}"><span class="tile">${tile(l.id)}</span><span class="lbl">${esc(label)}</span></a>`;
}

function windowHtml(lang, slug, w) {
  const u = UI[lang];
  return `<section class="window${w.side ? '' : ' no-side'}" data-slug="${slug}" aria-labelledby="win-title-${slug}">
  <header class="titlebar">
    <a class="back" href="${url(lang, '')}" data-app="home">${svg('back')}<span>${esc(u.back)}</span></a>
    <div class="dots"><a class="dot r" href="${url(lang, '')}" data-app="home" aria-label="${esc(u.close)}"></a><button class="dot y" type="button" aria-label="${esc(u.min)}"></button><button class="dot g" type="button" aria-label="${esc(u.zoom)}"></button></div>
    <h1 id="win-title-${slug}">${esc(NAV[lang][slug])}</h1>
  </header>
  <div class="win-body">${w.side}<div class="win-main"><h2 class="lt" aria-hidden="true">${esc(NAV[lang][slug])}</h2>${w.body}</div></div>
</section>`;
}

function homeWidgets(lang, blog, builder) {
  const u = UI[lang];
  const cv = parseCv(lang)[0].items[0];
  const refs = parseRefs(lang);
  const refTotal = refs.reduce((n, g) => n + g.items.length, 0);
  const pick = refs.flatMap(g => g.items.map(i => ({ ...i, org: g.label }))).find(i => i.plain.length > 160) || refs[0].items[0];
  const cut = (t, n) => { if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(' ')) + '…'; };
  const quotes = refs.flatMap(g => g.items).filter(i => i.plain.length > 60).map(i => ({ t: cut(i.plain, 190), n: i.name, r: i.role, a: isBlank(i.avatar) ? '' : i.avatar, i: initials(i.name) }));
  const sc = parseShowcase(lang);
  const certItems = sc.items.filter(i => i.cat === 'certifications');
  const src = x => fixUrls(`src="${x}"`).slice(5, -1);
  return `<aside class="widgets" aria-label="Highlights"><div class="wcol">
      <section class="widget w-contact"><h2>${esc(u.contact)}</h2>${contactCard(lang)}</section>
      <a class="widget w-builder" href="${url(lang, 'builder')}" data-app="builder"><span class="w-badge">Product Builder</span><b>${builder.cards.length} ${esc(u.liveProducts)} →</b><span>${esc(u.productsSub)}</span></a>
      <a class="widget w-now" href="${url(lang, 'cv')}" data-app="cv"><h2>${esc(u.now)}</h2><b>${esc(cv.role)}</b><span>${esc(cv.org)}${cv.date ? ' · ' + esc(cv.date) : ''}</span><em>${esc(u.viewCv)} →</em></a>
      <section class="widget w-posts"><h2>${esc(u.latest)}</h2><ul role="list">${blog.slice(0, 3).map(p => `<li><a href="${esc(p.href)}" target="_blank" rel="noopener noreferrer"><b>${esc(p.title)}</b><time datetime="${esc(p.date)}">${esc(fmtDate(p.date, lang))}</time></a></li>`).join('')}</ul></section>
</div><div class="wcol">
      <div class="widget w-stats"><h2>${esc(u.glance)}</h2><ul role="list">
        <li><a href="${url(lang, 'builder')}" data-app="builder"><b>${builder.cards.length}</b><span>${esc(u.products)}</span></a></li>
        <li><a href="${url(lang, 'blog')}" data-app="blog"><b>${blog.length}</b><span>${esc(u.articles)}</span></a></li>
        <li><a href="${url(lang, 'references')}" data-app="references"><b>${refTotal}</b><span>${esc(u.refs)}</span></a></li>
        <li><a href="${url(lang, 'showcase')}" data-app="showcase"><b>${sc.items.length}</b><span>${esc(NAV[lang].showcase)}</span></a></li></ul></div>
      <a class="widget w-certs w-extra" href="${url(lang, 'showcase')}" data-app="showcase" data-certs="${esc(JSON.stringify(certItems.map(c => ({ t: c.title, i: src(c.img.replace('/portfolio/', '/portfolio/t/')) }))))}"><h2>${esc(u.certs)}</h2><span class="w-thumbs">${certItems.slice(0, 6).map(c => `<img src="${esc(src(c.img))}" alt="${esc(c.title)}" width="120" height="68" loading="lazy">`).join('')}</span><span class="w-foot"><b>${certItems.length}</b> ${esc(u.certsN)}</span></a>
      <a class="widget w-quote w-extra" href="${url(lang, 'references')}" data-app="references" data-quotes="${esc(JSON.stringify(quotes))}"><h2>${esc(u.says)}</h2><blockquote>“${esc(cut(pick.plain, 190))}”</blockquote><span class="w-by"><span class="w-av">${avatarHtml(pick.name, pick.avatar, 34)}</span><span><b>${esc(pick.name)}</b><i>${esc(pick.role)}</i></span></span></a>
      <section class="widget w-weather w-extra" data-weather hidden aria-label="Weather"><span class="wx-e" aria-hidden="true"></span><span class="wx-t"><b></b><small></small></span></section>
  </div></aside>`;
}

function page(lang, slug) {
  const u = UI[lang];
  const w = slug ? WIN[slug](lang) : null;
  const data = w ? w.meta : null;
  const s = seo(lang, slug, data || {});
  const other = lang === 'en' ? 'tr' : 'en';
  const blog = parseBlog(lang), builder = parseBuilder(lang);
  const robots = INDEXABLE ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
  const ogImage = ORIGIN + BASE + '/og-image.png';
  const canonical = abs(lang, slug);
  const head = `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(s.title)}</title>
<meta name="description" content="${esc(s.description)}">
<meta name="robots" content="${robots}">
<meta name="author" content="Berkay Vuran">
<meta name="theme-color" content="#0b0f17">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${abs('en', slug)}">
<link rel="alternate" hreflang="tr" href="${abs('tr', slug)}">
<link rel="alternate" hreflang="x-default" href="${abs('en', slug)}">
<meta property="og:type" content="${slug ? 'website' : 'profile'}">
<meta property="og:site_name" content="Berkay Vuran">
<meta property="og:title" content="${esc(s.title)}">
<meta property="og:description" content="${esc(s.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${lang === 'tr' ? 'tr_TR' : 'en_US'}">
<meta property="og:locale:alternate" content="${other === 'tr' ? 'tr_TR' : 'en_US'}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Berkay Vuran's portfolio as a desktop with windows and widgets">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(s.title)}">
<meta name="twitter:description" content="${esc(s.description)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" href="/assets/images/favicon.ico">
<link rel="apple-touch-icon" href="${BASE}/icons/apple-touch-icon.png">
<link rel="manifest" href="${BASE}/manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Berkay Vuran">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="preload" href="${BASE}/desk.css?v=${VER}" as="style">
<script>try{var T=['dark','light','matrix','high-contrast'],t=localStorage.getItem('theme');if(T.indexOf(t)<0)t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',t);var g=localStorage.getItem('glass');if(g==='off'||(g===null&&window.matchMedia('(prefers-reduced-transparency: reduce)').matches))document.documentElement.setAttribute('data-glass','off');var w=localStorage.getItem('wp');if(/^(aurora|sunset|ocean)$/.test(w))document.documentElement.setAttribute('data-wp',w)}catch(e){}</script>
<link rel="stylesheet" href="${BASE}/desk.css?v=${VER}">
<link rel="stylesheet" href="${BASE}/extras.css?v=${VER}">
<link rel="stylesheet" href="${BASE}/ios.css?v=${VER}" media="(max-width:1099px),(min-width:1100px) and (hover:none)">${GOATCOUNTER ? `
<script data-goatcounter="https://${esc(GOATCOUNTER)}.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>` : ''}
<script type="application/ld+json">${jsonLd(lang, slug, data, s)}</script>
</head>`;
  const menu = SLUGS.map(id => `<a href="${url(lang, id)}" data-app="${id}"${id === slug ? ' aria-current="page"' : ''}>${esc(NAV[lang][id])}</a>`).join('');
  const body = `<body class="desk page-${slug || 'home'}" data-v="${VER}" data-base="${BASE}" data-lang="${lang}" data-home="${url(lang, '')}">
<a class="skip" href="#main">${esc(u.skip)}</a>
<div class="wallpaper" aria-hidden="true"><svg viewBox="0 0 1440 900" preserveAspectRatio="none"><path d="M0 520C300 440 520 640 820 640S1280 440 1440 500"/><path d="M0 640C320 560 560 780 860 780S1300 580 1440 620"/><path d="M0 760C340 700 600 860 900 860S1320 720 1440 750"/></svg></div>
<header class="menubar">
  <div class="mb-left"><a class="mb-logo" href="${url(lang, '')}" data-app="home" aria-label="${esc(u.home)}">BV</a><strong class="mb-app" id="mb-app">${esc(slug ? NAV[lang][slug] : 'Berkay Vuran')}</strong><nav class="mb-menu" aria-label="${esc(u.menuLabel)}">${menu}</nav></div>
  <div class="mb-right"><button class="mb-wx" type="button" hidden aria-haspopup="dialog" aria-expanded="false" aria-label="${lang === 'tr' ? 'Hava durumu' : 'Weather'}"><span class="wx-e" aria-hidden="true"></span><b></b></button><button class="mb-search" type="button" aria-label="${esc(u.search)}" aria-haspopup="dialog" data-ph="${esc(u.searchPh)}" data-empty="${esc(u.searchEmpty)}" data-sections="${esc(u.searchSections)}" data-hint="${esc(u.searchHint)}">${svg('search')}<kbd class="mb-kbd" aria-hidden="true">⌘K</kbd></button><button class="mb-cc" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(APP[lang].cc)}">${svg('cc')}</button><button class="mb-clock-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(u.calendar)}" data-today="${esc(u.today)}"><time class="mb-clock" id="clock"></time></button></div>
</header>
<main class="desktop" id="main">
  <div class="pager"><div class="pg pg-today">
  <div class="hello">
    <img src="/assets/images/avatars/my-avatar-160.webp" srcset="/assets/images/avatars/my-avatar-160.webp 160w, /assets/images/avatars/my-avatar-336.webp 336w" sizes="(min-width:1100px) 168px, 96px" alt="Berkay Vuran" width="168" height="168" fetchpriority="high">
    ${slug ? '<p class="hello-name">Berkay Vuran</p>' : '<h1 class="hello-name">Berkay Vuran</h1>'}
    <p class="hello-sub" data-titles="${esc(JSON.stringify(TITLES[lang]))}"><span class="sr-only">${esc(u.tagline)}</span><span class="tw" aria-hidden="true">${esc(u.tagline)}</span><span class="cursor" aria-hidden="true">|</span></p>
    ${false ? '' : `<p class="hello-bio">${esc(seo(lang, '', {}).description)}</p>`}
  </div>
  ${homeWidgets(lang, blog, builder)}
  </div><div class="pg pg-home">
  <nav class="icons" aria-label="${esc(u.menuLabel)}">${SLUGS.map(id => iconLink(id, lang)).join('')}${VAPPS.map(id => vIcon(id, lang, 'icon icon-x')).join('')}</nav>
  </div></div>
  ${slug ? windowHtml(lang, slug, w) : ''}
</main>
<nav class="dock" aria-label="Dock">${['about', 'showcase', 'builder', 'blog'].map(id => iconLink(id, lang)).join('')}${VAPPS.filter(id => id !== 'settings').map(id => vIcon(id, lang, 'icon dk-x')).join('')}<span class="dock-sep" aria-hidden="true"></span>${LINKS.map(l => extLink(l, lang)).join('')}</nav>
<script src="${BASE}/desk.js?v=${VER}" defer></script>
<script src="${BASE}/extras.js?v=${VER}" defer></script>
<script src="${BASE}/ios.js?v=${VER}" defer></script>
</body>`;
  return `<!DOCTYPE html>\n<html lang="${lang}">\n${head}\n${body}\n</html>\n`;
}

/* ------------------------------------------------------------------ write */
function write(rel, content) { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); }


const fileSize = rel => { try { const b = fs.statSync(path.join(ROOT, rel)).size; return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; } catch { return ''; } };
function finderFiles(lang) {
  const tr = lang === 'tr';
  const f = (n, rel, k, folder, dl) => ({ n, u: '/' + rel, k, f: folder, sz: fileSize(rel), dl: dl ? 1 : 0 });
  return [
    f(tr ? 'Özgeçmiş (TR).pdf' : 'Resume (EN).pdf', tr ? 'assets/appendices/berkay-vuran-ozgecmis.pdf' : 'assets/appendices/berkay-vuran-resume.pdf', 'pdf', 'documents'),
    f(tr ? 'Resume (EN).pdf' : 'Özgeçmiş (TR).pdf', tr ? 'assets/appendices/berkay-vuran-resume.pdf' : 'assets/appendices/berkay-vuran-ozgecmis.pdf', 'pdf', 'documents'),
    { n: 'Berkay Vuran.vcf', u: BASE + '/berkay-vuran.vcf', k: 'vcf', f: 'documents', sz: '13 KB', dl: 1 },
    f('PMP.pdf', 'assets/appendices/pmp.pdf', 'pdf', 'certificates'),
    f(tr ? 'PMI Üyelik.pdf' : 'PMI Membership.pdf', 'assets/appendices/pmi-member-certificate.pdf', 'pdf', 'certificates'),
    f(tr ? 'Profil fotoğrafı.webp' : 'Profile photo.webp', 'assets/images/avatars/my-avatar-336.webp', 'img', 'pictures', 1),
    { n: tr ? 'Sosyal önizleme.png' : 'Social preview.png', u: BASE + '/og-image.png', k: 'img', f: 'pictures', sz: fileSize('_build/src/og-image.png'), dl: 1 }
  ];
}
/* Ask: answers come only from data already on the site (no model, no network) */
function kbData(lang) {
  const tr = lang === 'tr', cv = parseCv(lang), exp = cv[0].items, edu = (cv[1] || { items: [] }).items, blog = parseBlog(lang), b = parseBuilder(lang), sc = parseShowcase(lang), refs = parseRefs(lang);
  const certs = sc.items.filter(i => i.cat === 'certifications'), refTotal = refs.reduce((n, g) => n + g.items.length, 0), now = exp[0];
  const L = (t, u, ext) => ({ t, u, e: ext ? 1 : 0 });
  const win = id => L(NAV[lang][id], url(lang, id));
  const line = i => `${i.date}: ${i.role}${i.org ? ' @ ' + i.org : ''}`;
  return [
    { k: 'who about berkay introduce tell me kim kimdir hakkinda tanit anlat', a: seo(lang, '', {}).description, l: [win('about')] },
    { k: 'now current currently role job position doing today su an simdi gorev pozisyon calisiyor ne yapiyor', a: `${now.role}${now.org ? ' @ ' + now.org : ''}${now.date ? ' (' + now.date + ')' : ''}.`, l: [win('cv')] },
    { k: 'experience work worked companies career history employer deneyim calis sirket kariyer nerelerde isyeri', a: exp.slice(0, 6).map(line).join('\n'), l: [win('cv')] },
    { k: 'education school university degree studied study okul universite egitim mezun okudu', a: edu.length ? edu.map(line).join('\n') : (tr ? 'Eğitim bilgileri CV penceresinde.' : 'Education details are in the CV window.'), l: [win('cv')] },
    { k: 'contact phone call number email mail reach message iletisim telefon numara ara eposta ulas yaz', a: `${PHONE.show}\nberkaypsy@gmail.com`, l: [L(tr ? 'Ara' : 'Call', 'tel:' + PHONE.tel), { t: tr ? 'Mesaj yaz' : 'Write a message', u: '#mail', e: 0 }] },
    { k: 'linkedin github social profile sosyal profil', a: 'LinkedIn: linkedin.com/in/berkayvuran\nGitHub: github.com/berkayvuran', l: [L('LinkedIn', LINKS[0].href, 1), L('GitHub', LINKS[1].href, 1)] },
    { k: 'projects products builder apps built made tools games urun proje uygulama yaptigi insa arac oyun', a: (tr ? `${b.cards.length} canlı ürün: ` : `${b.cards.length} live products: `) + b.cards.slice(0, 5).map(c => c.name).join(', ') + '…', l: [win('builder')] },
    { k: 'blog writing articles posts write read yazi makale yazdi yazar okumak', a: blog.slice(0, 3).map(p => `${fmtDate(p.date, lang)}: ${p.title}`).join('\n'), l: [win('blog')] },
    { k: 'certificates certification certified pmp scrum sertifika belge sertifikali', a: (tr ? `${certs.length} sertifika, ör. ` : `${certs.length} certificates, e.g. `) + certs.slice(0, 4).map(c => c.title).join(', ') + '.', l: [win('showcase')] },
    { k: 'references testimonials recommend feedback colleagues referans tavsiye yorum meslektas', a: tr ? `${refs.length} kurumdan ${refTotal} referans.` : `${refTotal} references from ${refs.length} organizations.`, l: [win('references')] },
    { k: 'hire available availability freelance collaborate consult consulting work with ise al musait calisma isbirligi danismanlik teklif', a: tr ? 'En hızlısı doğrudan yazmak ya da aramak.' : 'The quickest way is to write or call directly.', l: [{ t: tr ? 'Mesaj yaz' : 'Write a message', u: '#mail', e: 0 }, L(tr ? 'Ara' : 'Call', 'tel:' + PHONE.tel)] },
    { k: 'cv resume pdf download ozgecmis indir', a: tr ? 'CV hem pencerede hem PDF olarak.' : 'The CV is in a window and as a PDF.', l: [win('cv'), L('PDF', tr ? '/assets/appendices/berkay-vuran-ozgecmis.pdf' : '/assets/appendices/berkay-vuran-resume.pdf', 1)] },
    { k: 'site website how built technology made this nasil yapildi teknoloji bu site', a: tr ? 'Bu site Node ile üretilen statik sayfalardan oluşuyor; çerçeve yok, sade JavaScript ve CSS kullanıyor.' : 'This site is static pages generated with Node, with plain JavaScript and CSS and no framework.', l: [] },
    { k: 'hi hello hey merhaba selam naber', a: tr ? 'Merhaba! Berkay hakkında ne öğrenmek istersin?' : 'Hello! What would you like to know about Berkay?', l: [] }
  ];
}
function appsData(lang) {
  const a = APP[lang], cv = parseCv(lang), blog = parseBlog(lang), b = parseBuilder(lang), sc = parseShowcase(lang);
  const im = x => fixUrls(`src="${x}"`).slice(5, -1);
  return {
    ui: { ...a, addContact: UI[lang].addContact, back: UI[lang].back, close: UI[lang].close, min: UI[lang].min, zoom: UI[lang].zoom, home: url(lang, ''), other: url(lang === 'en' ? 'tr' : 'en', ''), otherShort: UI[lang].langShort, lang },
    form: FORM_URL,
    contact: { tel: PHONE.tel, show: PHONE.show, mail: 'berkaypsy@gmail.com', linkedin: LINKS[0].href, github: LINKS[1].href, site: ORIGIN },
    about: seo(lang, '', {}).description,
    focus: TITLES[lang],
    cv: { experience: cv[0].items.map(i => ({ r: i.role, o: i.org, d: i.date })), education: (cv[1] || { items: [] }).items.map(i => ({ r: i.role, o: i.org, d: i.date })) },
    projects: b.cards.map(c => ({ n: c.name, d: c.desc, u: c.href })),
    posts: blog.map(p => ({ t: p.title, c: p.cat, d: fmtDate(p.date, lang), e: p.excerpt, u: p.href, i: im(p.img) })),
    photos: { cats: sc.cats.map(c => ({ id: c.id, l: c.label })), items: sc.items.map(it => ({ t: it.title, c: it.cat.replace(/\s+/g, '-'), cl: it.catLabel, u: it.href, i: im(it.img) })) },
    themes: THEMES.map(t => ({ id: t.id, e: t.e, n: t[lang] })),
    sections: SLUGS.map(id => ({ id, n: NAV[lang][id], u: url(lang, id) })),
    files: finderFiles(lang),
    kb: kbData(lang)
  };
}
const minify = f => esbuild.transformSync(fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8'), { loader: f.endsWith('.css') ? 'css' : 'js', minify: true, target: f.endsWith('.css') ? 'safari14' : 'es2019', legalComments: 'none' }).code;
const written = [];
for (const lang of LANGS) {
  for (const slug of ['', ...SLUGS]) {
    write(`${lang === 'tr' ? 'tr/' : ''}${slug ? slug + '/' : ''}index.html`, page(lang, slug));
    written.push([lang, slug]);
  }
}
function searchIndex(lang) {
  const u = UI[lang], out = [];
  SLUGS.forEach(id => out.push({ t: NAV[lang][id], d: seo(lang, id, WIN[id](lang).meta).description, s: u.goTo, u: url(lang, id), k: 1 }));
  [...VAPPS, 'mail'].forEach(id => out.push({ t: APP[lang].names[id], d: APP[lang].descs[id], s: APP[lang].apps, u: '#' + id, v: id, k: 1 }));
  parseCv(lang).forEach(g => g.items.forEach(it => out.push({ t: it.role + (it.org ? ' @ ' + it.org : ''), d: `${g.title} · ${it.date}`, s: NAV[lang].cv, u: url(lang, 'cv') })));
  parseBlog(lang).forEach(p => out.push({ t: p.title, d: `${p.cat} · ${fmtDate(p.date, lang)}`, s: NAV[lang].blog, u: p.href, e: 1 }));
  parseShowcase(lang).items.forEach(p => out.push({ t: p.title, d: p.catLabel, s: NAV[lang].showcase, u: p.href, e: 1 }));
  parseBuilder(lang).cards.forEach(c => out.push({ t: c.name, d: c.desc, s: NAV[lang].builder, u: c.href }));
  parseRefs(lang).forEach(g => g.items.forEach(i => out.push({ t: i.name, d: `${i.role}, ${g.label}`, s: NAV[lang].references, u: url(lang, 'references') })));
  return out;
}
for (const lang of LANGS) write(`search-${lang}.json`, JSON.stringify(searchIndex(lang)));
for (const lang of LANGS) write(`apps-${lang}.json`, JSON.stringify(appsData(lang)));
write('manifest.webmanifest', JSON.stringify({
  name: 'Berkay Vuran', short_name: 'Berkay Vuran', description: 'Product leader and builder. CV, showcase, writing and live products.',
  start_url: url('en', ''), scope: url('en', ''), display: 'standalone', background_color: '#14123a', theme_color: '#14123a',
  icons: [{ src: `${BASE}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' }, { src: `${BASE}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' }]
}, null, 2));
for (const f of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) { fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true }); fs.copyFileSync(new URL('./src/icons/' + f, import.meta.url), path.join(OUT, 'icons', f)); }
if (fs.existsSync(new URL('./src/og-image.png', import.meta.url))) fs.copyFileSync(new URL('./src/og-image.png', import.meta.url), path.join(OUT, 'og-image.png'));
write('desk.css', minify('desk.css'));
write('desk.js', minify('desk.js'));
write('berkay-vuran.vcf', VCARD);
write('extras.css', minify('extras.css'));
write('extras.js', minify('extras.js'));
write('ios.css', minify('ios.css'));
write('ios.js', minify('ios.js'));
if (BASE === '') write('sw.js', fs.readFileSync(new URL('./src/sw.js', import.meta.url), 'utf8').replace('__VER__', VER));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${written.map(([lang, slug]) => `  <url><loc>${abs(lang, slug)}</loc><lastmod>${TODAY}</lastmod><changefreq>${slug === 'blog' || slug === '' ? 'weekly' : 'monthly'}</changefreq><priority>${slug === '' ? (lang === 'en' ? '1.0' : '0.9') : '0.7'}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${abs('en', slug)}"/><xhtml:link rel="alternate" hreflang="tr" href="${abs('tr', slug)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${abs('en', slug)}"/></url>`).join('\n')}
</urlset>
`;
write('sitemap.xml', sitemap);
if (BASE === '') write('robots.txt', `User-agent: *\nDisallow: /dashboard-parameters/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

/* 404 page (GitHub Pages serves /404.html for unknown URLs): a desktop-style "file not found" */
if (BASE === '') {
  const nf = l => {
    const tr = l === 'tr', u = UI[l];
    const t = tr ? { title: 'Dosya bulunamadı', cmd: 'cat', err: 'Böyle bir dosya ya da klasör yok.', hint: 'Adres yanlış yazılmış ya da bu sayfa taşınmış olabilir. Şunlardan birine gidebilirsin:', home: 'Ana ekran' } : { title: 'File not found', cmd: 'cat', err: 'No such file or directory.', hint: 'The address may be mistyped or the page may have moved. Try one of these:', home: 'Home' };
    return `<div class="nf-l" lang="${l}"${tr ? ' hidden' : ''}><h1>${t.title}</h1><p class="nf-cmd"><span class="tm-p">guest@berkayvuran ~ %</span> ${t.cmd} <b class="nf-path"></b></p><p class="nf-err">cat: <span class="nf-path"></span>: ${t.err}</p><p>${t.hint}</p><div class="nf-links"><a class="btn" href="${tr ? '/tr/' : '/'}">${t.home}</a>${['about', 'cv', 'showcase', 'blog', 'builder'].map(id => `<a class="nf-a" href="${url(l, id)}">${esc(NAV[l][id])}</a>`).join('')}</div></div>`;
  };
  write('404.html', `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>404 | Berkay Vuran</title><meta name="robots" content="noindex, nofollow"><meta name="theme-color" content="#0b0f17"><link rel="icon" href="/assets/images/favicon.ico">
<script>try{var T=['dark','light','matrix','high-contrast'],t=localStorage.getItem('theme');if(T.indexOf(t)<0)t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',t);var w=localStorage.getItem('wp');if(/^(aurora|sunset|ocean)$/.test(w))document.documentElement.setAttribute('data-wp',w)}catch(e){}</script>
<link rel="stylesheet" href="/desk.css?v=${VER}"><link rel="stylesheet" href="/extras.css?v=${VER}"></head>
<body class="desk page-404"><div class="wallpaper" aria-hidden="true"><svg viewBox="0 0 1440 900" preserveAspectRatio="none"><path d="M0 520C300 440 520 640 820 640S1280 440 1440 500"/><path d="M0 640C320 560 560 780 860 780S1300 580 1440 620"/></svg></div>
<header class="menubar"><div class="mb-left"><a class="mb-logo" href="/" aria-label="Home">BV</a><strong class="mb-app">Terminal</strong></div><div class="mb-right"><time class="mb-clock" id="clock"></time></div></header>
<main class="desktop nf"><section class="window nf-win" aria-labelledby="nf-h"><header class="titlebar" style="cursor:default"><div class="dots"><a class="dot r" href="/" aria-label="Home"></a><span class="dot y"></span><span class="dot g"></span></div><span class="nf-title" id="nf-h">Terminal</span></header><div class="nf-body">${nf('en')}${nf('tr')}</div></section></main>
<script>(function(){var p=location.pathname,tr=p.indexOf('/tr/')===0||p==='/tr';document.querySelectorAll('.nf-l').forEach(function(n){n.hidden=(n.lang==='tr')!==tr});document.documentElement.lang=tr?'tr':'en';document.querySelectorAll('.nf-path').forEach(function(n){n.textContent=p});function t(){var e=document.getElementById('clock');if(e)e.textContent=new Date().toLocaleTimeString(tr?'tr-TR':'en-GB',{hour:'2-digit',minute:'2-digit'})}t();setInterval(t,20000)})();</script>
</body></html>
`);
}
console.log(`built ${written.length} pages -> ${OUT} (base="${BASE}", ${INDEXABLE ? 'indexable' : 'noindex'})`);
