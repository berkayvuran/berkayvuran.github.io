// Static site generator for berkayvuran.com (macOS-desktop style).
// Usage: node build.mjs [--base=/next] [--out=../next] [--index=false]
//   preview : node build.mjs                      -> ../next, noindex
//   go live : node build.mjs --base= --out=.. --index=true
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

import { createHash } from 'node:crypto';
const VER = createHash('md5').update(fs.readFileSync(new URL('./src/desk.css', import.meta.url))).update(fs.readFileSync(new URL('./src/desk.js', import.meta.url))).digest('hex').slice(0, 8);
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')]; }));
const BASE = args.base ?? '/next';
const OUT = path.resolve(args.out ?? '../next');
const INDEXABLE = args.index === 'true';
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
  en: { home: 'Home', folders: 'Folders', all: 'All', items: 'items', back: 'Home', close: 'Close', min: 'Minimize', zoom: 'Zoom', menuLabel: 'Sections', skip: 'Skip to content', theme: 'Theme', glass: 'Glass effect', langLabel: 'Türkçe', langShort: 'TR', read: 'Read more', role: 'Product leader & builder', latest: 'Latest writing', liveProducts: 'live products', productsSub: 'Apps, games & tools built with AI', open: 'Open', download: 'Download PDF', more: 'More', external: 'opens in a new tab', tagline: 'Multi disciplinary product enthusiast', now: 'Currently', glance: 'At a glance', says: 'What people say', certs: 'Certifications', products: 'Products', articles: 'Articles', refs: 'References', certsN: 'Certificates', viewCv: 'Open CV', search: 'Search', searchPh: 'Search sections, writing, projects, CV…', searchEmpty: 'No results', searchSections: 'Sections', searchHint: 'to open', goTo: 'Go to' },
  tr: { home: 'Ana ekran', folders: 'Klasörler', all: 'Tümü', items: 'öğe', back: 'Ana ekran', close: 'Kapat', min: 'Küçült', zoom: 'Büyüt', menuLabel: 'Bölümler', skip: 'İçeriğe geç', theme: 'Tema', glass: 'Cam efekti', langLabel: 'English', langShort: 'EN', read: 'Devamını oku', role: 'Ürün lideri ve üretici', latest: 'Son yazılar', liveProducts: 'canlı ürün', productsSub: 'AI ile inşa edilmiş uygulama ve araçlar', open: 'Aç', download: 'PDF indir', more: 'Daha fazla', external: 'yeni sekmede açılır', tagline: 'Çok disiplinli ürün meraklısı', now: 'Şu an', glance: 'Bir bakışta', says: 'Ne diyorlar', certs: 'Sertifikalar', products: 'Ürün', articles: 'Yazı', refs: 'Referans', certsN: 'Sertifika', viewCv: 'CV’yi aç', search: 'Ara', searchPh: 'Bölümlerde, yazılarda, projelerde, CV’de ara…', searchEmpty: 'Sonuç yok', searchSections: 'Bölümler', searchHint: 'açmak için', goTo: 'Git' }
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
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
};
const svg = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[n]}</svg>`;
const LINKS = [
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/berkayvuran' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/berkayvuran' },
  { id: 'mail', label: { en: 'Email', tr: 'E-posta' }, href: 'mailto:berkaypsy@gmail.com' }
];

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
      href: a.attr('href'),
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
    <ul class="side-list" role="list">${entries.map((e, i) => `<li${entries[0].id === 'all' && i > 0 ? ' class="side-sub"' : ''}><a class="side-item" href="#${esc(e.id)}" data-filter="${esc(e.id)}"${e.id === defaultId ? ' data-default aria-current="true"' : ''}>${svg('folder', 'si')}<span class="sl">${esc(e.label)}</span><span class="sc">${e.count}</span></a></li>`).join('')}</ul>
  </aside>`;
}

function winAbout(lang) {
  const d = parseAbout(lang);
  return {
    side: '',
    body: `<article class="doc">
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
  const side = sidebar(lang, [{ id: 'all', label: UI[lang].all, count: g.reduce((n, x) => n + x.items.length, 0) }, ...g.map(x => ({ id: x.id, label: x.title, count: x.items.length }))], 'experience');
  const body = `<div class="toolbar"><a class="btn" href="${pdf}" target="_blank" rel="noopener noreferrer">${svg('download')}<span>${esc(UI[lang].download)}</span></a></div>` +
    g.map(grp => `<section class="group" id="${grp.id}" data-group="${grp.id}" aria-labelledby="${grp.id}-h">
      <h2 class="group-h" id="${grp.id}-h">${esc(grp.title)} <span class="muted">${grp.items.length} ${esc(UI[lang].items)}</span></h2>
      <div class="rows">${grp.items.map((it, i) => `<details class="row"${grp.id === 'experience' && i === 0 ? ' open' : ''}>
        <summary>${svg(grp.id === 'experience' ? 'file' : 'file', 'ri')}<span class="rt"><b>${esc(it.role)}</b>${it.org ? `<span class="org">${esc(it.org)}</span>` : ''}</span><span class="rd">${esc(it.date)}</span></summary>
        <div class="row-body">${it.body}</div></details>`).join('')}</div></section>`).join('');
  return { side, body, meta: { groups: g } };
}

function winRefs(lang) {
  const groups = parseRefs(lang);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const side = sidebar(lang, [{ id: 'all', label: UI[lang].all, count: total }, ...groups.map(g => ({ id: g.id, label: g.label, count: g.items.length }))], 'all');
  const cards = groups.flatMap(g => g.items.map(it => ({ ...it, g })));
  const body = `<ul class="people" role="list">${cards.map(it => `<li class="person" data-cat="${it.g.id}"><details>
      <summary>${avatarHtml(it.name, it.avatar, 56)}<span class="pn"><b>${esc(it.name)}</b><span>${esc(it.role)}</span><em>${esc(it.g.label)}</em></span></summary>
      <div class="quote">${it.html}</div></details></li>`).join('')}</ul>`;
  return { side, body, meta: { total, groups } };
}

function winShowcase(lang) {
  const { cats, items } = parseShowcase(lang);
  const counts = k => k === 'all' ? items.length : items.filter(i => i.cat === k).length;
  const side = sidebar(lang, cats.map(c => ({ id: c.id, label: c.label, count: counts(c.key) })), 'all');
  const body = `<ul class="grid" role="list">${items.map(it => `<li class="tile-card" data-cat="${esc(it.cat.replace(/\s+/g, '-'))}">
    <a href="${esc(it.href)}" target="_blank" rel="noopener noreferrer">
      <img src="${esc(fixUrls('src="' + it.img + '"').slice(5, -1))}" alt="${esc(it.alt || it.title)}" width="${esc(it.w || 600)}" height="${esc(it.h || 270)}" loading="lazy" decoding="async">
      <span class="tc-t">${esc(it.title)}</span><span class="tc-c">${esc(it.catLabel)}</span></a></li>`).join('')}</ul>`;
  return { side, body, meta: { items, cats } };
}

function winBlog(lang) {
  const posts = parseBlog(lang);
  const catCount = {};
  posts.forEach(p => { catCount[p.cat] = (catCount[p.cat] || 0) + 1; });
  const cats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ id: slugify(c), label: c, count: n }));
  const side = sidebar(lang, [{ id: 'all', label: UI[lang].all, count: posts.length }, ...cats], 'all');
  const body = `<ol class="posts" reversed>${posts.map((p, i) => `<li class="post" data-cat="${slugify(p.cat)}"><a href="${esc(p.href)}" target="_blank" rel="noopener noreferrer">
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
  const person = { '@type': 'Person', '@id': ORIGIN + '/#person', name: 'Berkay Vuran', url: ORIGIN + '/', image: ORIGIN + '/assets/images/avatars/my-avatar-160.webp', jobTitle: 'Conversational Intelligence PA Team Leader', worksFor: { '@type': 'Organization', name: 'SESTEK' }, address: { '@type': 'PostalAddress', addressLocality: 'Ankara', addressCountry: 'TR' }, sameAs: ['https://www.linkedin.com/in/berkayvuran', 'https://github.com/berkayvuran', 'https://twitter.com/vuranberkay', 'https://www.instagram.com/vuran.berkay/', 'https://www.facebook.com/vuranberkay', 'https://berkayvuran.medium.com/'] };
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
  return `<a class="${cls} c-${id}" href="${url(lang, id)}" data-app="${id}"><span class="tile">${svg(id)}</span><span class="lbl">${esc(NAV[lang][id])}</span></a>`;
}
function extLink(l, lang) {
  const label = typeof l.label === 'string' ? l.label : l.label[lang];
  const ext = l.href.startsWith('http');
  return `<a class="icon c-${l.id}" href="${esc(l.href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''} aria-label="${esc(label)}${ext ? ' (' + UI[lang].external + ')' : ''}"><span class="tile">${svg(l.id)}</span><span class="lbl">${esc(label)}</span></a>`;
}

function windowHtml(lang, slug, w) {
  const u = UI[lang];
  return `<section class="window${w.side ? '' : ' no-side'}" data-slug="${slug}" aria-labelledby="win-title-${slug}">
  <header class="titlebar">
    <a class="back" href="${url(lang, '')}" data-app="home">${svg('back')}<span>${esc(u.back)}</span></a>
    <div class="dots"><a class="dot r" href="${url(lang, '')}" data-app="home" aria-label="${esc(u.close)}"></a><button class="dot y" type="button" aria-label="${esc(u.min)}"></button><button class="dot g" type="button" aria-label="${esc(u.zoom)}"></button></div>
    <h1 id="win-title-${slug}">${esc(NAV[lang][slug])}</h1>
  </header>
  <div class="win-body">${w.side}<div class="win-main">${w.body}</div></div>
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
  return `<aside class="widgets" aria-label="Highlights">
      <a class="widget w-builder" href="${url(lang, 'builder')}" data-app="builder"><span class="w-badge">Product Builder</span><b>${builder.cards.length} ${esc(u.liveProducts)} →</b><span>${esc(u.productsSub)}</span></a>
      <a class="widget w-now" href="${url(lang, 'cv')}" data-app="cv"><h2>${esc(u.now)}</h2><b>${esc(cv.role)}</b><span>${esc(cv.org)}${cv.date ? ' · ' + esc(cv.date) : ''}</span><em>${esc(u.viewCv)} →</em></a>
      <section class="widget w-posts"><h2>${esc(u.latest)}</h2><ul role="list">${blog.slice(0, 3).map(p => `<li><a href="${esc(p.href)}" target="_blank" rel="noopener noreferrer"><b>${esc(p.title)}</b><time datetime="${esc(p.date)}">${esc(fmtDate(p.date, lang))}</time></a></li>`).join('')}</ul></section>
      <div class="widget w-stats"><h2>${esc(u.glance)}</h2><ul role="list">
        <li><a href="${url(lang, 'builder')}" data-app="builder"><b>${builder.cards.length}</b><span>${esc(u.products)}</span></a></li>
        <li><a href="${url(lang, 'blog')}" data-app="blog"><b>${blog.length}</b><span>${esc(u.articles)}</span></a></li>
        <li><a href="${url(lang, 'references')}" data-app="references"><b>${refTotal}</b><span>${esc(u.refs)}</span></a></li>
        <li><a href="${url(lang, 'showcase')}" data-app="showcase"><b>${sc.items.length}</b><span>${esc(NAV[lang].showcase)}</span></a></li></ul></div>
      <a class="widget w-certs w-extra" href="${url(lang, 'showcase')}" data-app="showcase" data-certs="${esc(JSON.stringify(certItems.map(c => ({ t: c.title, i: src(c.img.replace('/portfolio/', '/portfolio/t/')) }))))}"><h2>${esc(u.certs)}</h2><span class="w-thumbs">${certItems.slice(0, 6).map(c => `<img src="${esc(src(c.img))}" alt="${esc(c.title)}" width="120" height="68" loading="lazy">`).join('')}</span><span class="w-foot"><b>${certItems.length}</b> ${esc(u.certsN)}</span></a>
      <a class="widget w-quote w-extra" href="${url(lang, 'references')}" data-app="references" data-quotes="${esc(JSON.stringify(quotes))}"><h2>${esc(u.says)}</h2><blockquote>“${esc(cut(pick.plain, 190))}”</blockquote><span class="w-by"><span class="w-av">${avatarHtml(pick.name, pick.avatar, 34)}</span><span><b>${esc(pick.name)}</b><i>${esc(pick.role)}</i></span></span></a>
  </aside>`;
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
<link rel="preload" href="/assets/fonts/poppins-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${BASE}/desk.css?v=${VER}" as="style">
<script>try{var T=['dark','light','matrix','high-contrast'],t=localStorage.getItem('theme');if(T.indexOf(t)<0)t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',t);var g=localStorage.getItem('glass');if(g==='off'||(g===null&&window.matchMedia('(prefers-reduced-transparency: reduce)').matches))document.documentElement.setAttribute('data-glass','off')}catch(e){}</script>
<link rel="stylesheet" href="${BASE}/desk.css?v=${VER}">
<script type="application/ld+json">${jsonLd(lang, slug, data, s)}</script>
</head>`;
  const menu = SLUGS.map(id => `<a href="${url(lang, id)}" data-app="${id}"${id === slug ? ' aria-current="page"' : ''}>${esc(NAV[lang][id])}</a>`).join('');
  const body = `<body class="desk page-${slug || 'home'}" data-base="${BASE}" data-lang="${lang}" data-home="${url(lang, '')}">
<a class="skip" href="#main">${esc(u.skip)}</a>
<div class="wallpaper" aria-hidden="true"><svg viewBox="0 0 1440 900" preserveAspectRatio="none"><path d="M0 520C300 440 520 640 820 640S1280 440 1440 500"/><path d="M0 640C320 560 560 780 860 780S1300 580 1440 620"/><path d="M0 760C340 700 600 860 900 860S1320 720 1440 750"/></svg></div>
<header class="menubar">
  <div class="mb-left"><a class="mb-logo" href="${url(lang, '')}" data-app="home" aria-label="${esc(u.home)}">BV</a><strong class="mb-app" id="mb-app">${esc(slug ? NAV[lang][slug] : 'Berkay Vuran')}</strong><nav class="mb-menu" aria-label="${esc(u.menuLabel)}">${menu}</nav></div>
  <div class="mb-right"><button class="mb-search" type="button" aria-label="${esc(u.search)}" aria-haspopup="dialog" data-ph="${esc(u.searchPh)}" data-empty="${esc(u.searchEmpty)}" data-sections="${esc(u.searchSections)}" data-hint="${esc(u.searchHint)}">${svg('search')}<kbd class="mb-kbd" aria-hidden="true">⌘K</kbd></button><a class="mb-lang" href="${url(other, slug)}" hreflang="${other}" lang="${other}" aria-label="${esc(u.langLabel)}">${u.langShort}</a><div class="mb-themewrap"><button class="mb-theme" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(u.theme)}"><span class="th-e" aria-hidden="true">🌙</span><span class="th-n">${esc(THEMES[0][lang])}</span></button><ul class="theme-menu" role="menu" aria-label="${esc(u.theme)}" hidden>${THEMES.map(t => `<li role="none"><button type="button" role="menuitemradio" aria-checked="false" data-theme-set="${t.id}" data-emoji="${t.e}" data-name="${esc(t[lang])}"><span class="te" aria-hidden="true">${t.e}</span><span>${esc(t[lang])}</span><span class="tc" aria-hidden="true">✓</span></button></li>`).join('')}<li role="separator" class="tm-sep"></li><li role="none"><button type="button" role="menuitemcheckbox" aria-checked="true" data-glass-toggle><span class="te" aria-hidden="true">🪟</span><span>${esc(u.glass)}</span><span class="sw" aria-hidden="true"></span></button></li></ul></div><time class="mb-clock" id="clock"></time></div>
</header>
<main class="desktop" id="main">
  <div class="hello">
    <img src="/assets/images/avatars/my-avatar-160.webp" srcset="/assets/images/avatars/my-avatar-160.webp 160w, /assets/images/avatars/my-avatar-336.webp 336w" sizes="(min-width:1100px) 168px, 96px" alt="Berkay Vuran" width="168" height="168" fetchpriority="high">
    ${slug ? '<p class="hello-name">Berkay Vuran</p>' : '<h1 class="hello-name">Berkay Vuran</h1>'}
    <p class="hello-sub" data-titles="${esc(JSON.stringify(TITLES[lang]))}"><span class="sr-only">${esc(u.tagline)}</span><span class="tw" aria-hidden="true">${esc(u.tagline)}</span><span class="cursor" aria-hidden="true">|</span></p>
    ${slug ? '' : `<p class="hello-bio">${esc(seo(lang, '', {}).description)}</p>`}
  </div>
  ${homeWidgets(lang, blog, builder)}
  <nav class="icons" aria-label="${esc(u.menuLabel)}">${SLUGS.map(id => iconLink(id, lang)).join('')}</nav>
  ${slug ? windowHtml(lang, slug, w) : ''}
</main>
<nav class="dock" aria-label="Dock">${['about', 'showcase', 'builder', 'blog'].map(id => iconLink(id, lang)).join('')}<span class="dock-sep" aria-hidden="true"></span>${LINKS.map(l => extLink(l, lang)).join('')}</nav>
<script src="${BASE}/desk.js?v=${VER}" defer></script>
</body>`;
  return `<!DOCTYPE html>\n<html lang="${lang}">\n${head}\n${body}\n</html>\n`;
}

/* ------------------------------------------------------------------ write */
function write(rel, content) { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); }
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
  parseCv(lang).forEach(g => g.items.forEach(it => out.push({ t: it.role + (it.org ? ' @ ' + it.org : ''), d: `${g.title} · ${it.date}`, s: NAV[lang].cv, u: url(lang, 'cv') })));
  parseBlog(lang).forEach(p => out.push({ t: p.title, d: `${p.cat} · ${fmtDate(p.date, lang)}`, s: NAV[lang].blog, u: p.href, e: 1 }));
  parseShowcase(lang).items.forEach(p => out.push({ t: p.title, d: p.catLabel, s: NAV[lang].showcase, u: p.href, e: 1 }));
  parseBuilder(lang).cards.forEach(c => out.push({ t: c.name, d: c.desc, s: NAV[lang].builder, u: c.href }));
  parseRefs(lang).forEach(g => g.items.forEach(i => out.push({ t: i.name, d: `${i.role}, ${g.label}`, s: NAV[lang].references, u: url(lang, 'references') })));
  return out;
}
for (const lang of LANGS) write(`search-${lang}.json`, JSON.stringify(searchIndex(lang)));
write('manifest.webmanifest', JSON.stringify({
  name: 'Berkay Vuran', short_name: 'Berkay Vuran', description: 'Product leader and builder. CV, showcase, writing and live products.',
  start_url: url('en', ''), scope: url('en', ''), display: 'standalone', background_color: '#14123a', theme_color: '#14123a',
  icons: [{ src: `${BASE}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' }, { src: `${BASE}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' }]
}, null, 2));
for (const f of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) { fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true }); fs.copyFileSync(new URL('./src/icons/' + f, import.meta.url), path.join(OUT, 'icons', f)); }
if (fs.existsSync(new URL('./src/og-image.png', import.meta.url))) fs.copyFileSync(new URL('./src/og-image.png', import.meta.url), path.join(OUT, 'og-image.png'));
fs.copyFileSync(new URL('./src/desk.css', import.meta.url), path.join(OUT, 'desk.css'));
fs.copyFileSync(new URL('./src/desk.js', import.meta.url), path.join(OUT, 'desk.js'));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${written.map(([lang, slug]) => `  <url><loc>${abs(lang, slug)}</loc><lastmod>${TODAY}</lastmod><changefreq>${slug === 'blog' || slug === '' ? 'weekly' : 'monthly'}</changefreq><priority>${slug === '' ? (lang === 'en' ? '1.0' : '0.9') : '0.7'}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${abs('en', slug)}"/><xhtml:link rel="alternate" hreflang="tr" href="${abs('tr', slug)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${abs('en', slug)}"/></url>`).join('\n')}
</urlset>
`;
write('sitemap.xml', sitemap);
if (BASE === '') write('robots.txt', `User-agent: *\nDisallow: /dashboard-parameters/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log(`built ${written.length} pages -> ${OUT} (base="${BASE}", ${INDEXABLE ? 'indexable' : 'noindex'})`);
