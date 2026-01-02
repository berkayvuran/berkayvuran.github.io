'use strict';

// 1. Core Utilities
const elementToggleFunc = (elem) => elem && elem.classList.toggle("active");

// 2. Sidebar Logic
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) sidebarBtn.addEventListener("click", () => elementToggleFunc(sidebar));

// 3. Dynamic Page Loading
const contentArea = document.querySelector("#content-area");
const navigationLinks = document.querySelectorAll("[data-nav-link]");

async function loadPage(pageName) {
  if (!contentArea) return;
  
  // Normalize page name
  const validPages = ['about', 'cv', 'references', 'showcase', 'blog'];
  if (!validPages.includes(pageName)) pageName = 'about';

  try {
    // Visual feedback
    contentArea.style.opacity = "0";
    
    const response = await fetch(`./pages/${pageName}.html`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    
    // Inject content
    contentArea.innerHTML = html;
    
    // Ensure nested articles are active/visible
    const articles = contentArea.querySelectorAll('article');
    articles.forEach(art => {
      art.classList.add('active');
      art.style.display = 'block';
    });

    // Update Nav UI
    navigationLinks.forEach(link => {
      const linkPage = link.getAttribute('data-nav-link');
      link.classList.toggle('active', linkPage === pageName);
    });

    // Re-apply current language
    const currentLang = localStorage.getItem('preferredLanguage') || 'en';
    applyLanguage(currentLang, contentArea, false); // false = don't restart typewriter on every page load
    
    // Init page-specific JS
    if (pageName === 'cv') initCV();
    if (pageName === 'references') initReferences();
    if (pageName === 'showcase') initShowcase();

    // Finalize transition
    setTimeout(() => {
      contentArea.style.opacity = "1";
    }, 50);

    window.scrollTo(0, 0);

  } catch (error) {
    console.error("Load failed:", error);
    contentArea.innerHTML = `<article class="about active"><p>Failed to load ${pageName}.</p></article>`;
    contentArea.style.opacity = "1";
  }
}

// Nav Click Events
navigationLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = link.getAttribute("data-nav-link");
    loadPage(page);
    history.pushState(null, null, `#${page}`);
  });
});

// Initial Load Handler
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '') || 'about';
  loadPage(hash);
});

// Popstate (Back/Forward buttons)
window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '') || 'about';
  loadPage(hash);
});

// 4. Language Management
function applyLanguage(lang, scope = document.body, shouldRestartTypewriter = true) {
  const elements = scope.querySelectorAll('[data-lang]');
  elements.forEach(el => {
    const isTarget = el.getAttribute('data-lang') === lang;
    el.style.display = isTarget ? '' : 'none';
    if (isTarget && el.tagName === 'SPAN' && el.classList.contains('cursor')) {
      el.style.display = 'inline-block';
    }
  });

  // Update language toggle button display
  document.documentElement.setAttribute('data-lang', lang);

  localStorage.setItem('preferredLanguage', lang);
  if (shouldRestartTypewriter && window.typewriter) window.typewriter.restart();
}

function toggleLanguage() {
  const current = localStorage.getItem('preferredLanguage') || 'en';
  const next = current === 'en' ? 'tr' : 'en';
  applyLanguage(next);
}

const langToggleBtn = document.querySelector('.lang-toggle-btn');
if (langToggleBtn) langToggleBtn.onclick = toggleLanguage;

// Apply saved language on page load
const savedLang = localStorage.getItem('preferredLanguage') || 'en';
document.documentElement.setAttribute('data-lang', savedLang);
applyLanguage(savedLang, document.body, false);

// 5. Theme Management
const themeToggleBtn = document.querySelector('.theme-toggle-btn');
const htmlEl = document.documentElement;

function setTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = htmlEl.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

if (themeToggleBtn) themeToggleBtn.onclick = toggleTheme;
setTheme(localStorage.getItem('theme') || 'dark');

// 6. Page-Specific Components
function initCV() {
  document.querySelectorAll(".accordion").forEach(acc => {
    acc.onclick = function() {
      this.classList.toggle("active");
      const panel = this.nextElementSibling;
      if (panel) panel.style.display = panel.style.display === "block" ? "none" : "block";
    };
  });
}

function initReferences() {
  const referencesArticle = document.querySelector('.references');
  if (!referencesArticle) return;

  // Create unified grid container
  const grid = document.createElement('div');
  grid.className = 'references-grid';

  // Move all testimonial items into single grid with business card layout
  document.querySelectorAll('.references .testimonials').forEach(section => {
    const companyTitle = section.querySelector('.service-title');
    const companyName = companyTitle ? companyTitle.textContent.replace('Testimonials from ', '').replace(' Referansları', '').trim() : '';
    
    section.querySelectorAll('.testimonials-item').forEach(item => {
      const card = item.querySelector('.content-card');
      if (card) {
        // Create card-info wrapper for business card layout
        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';
        
        // Move title, text to card-info
        const title = card.querySelector('.testimonials-item-title');
        const text = card.querySelector('.testimonials-text');
        if (title) cardInfo.appendChild(title);
        if (text) cardInfo.appendChild(text);
        
        // Add company badge
        if (companyName) {
          const badge = document.createElement('span');
          badge.className = 'company-badge';
          badge.textContent = companyName;
          cardInfo.appendChild(badge);
        }
        
        card.appendChild(cardInfo);
      }
      grid.appendChild(item);
    });
  });

  // Replace sections with unified grid
  const firstSection = referencesArticle.querySelector('.testimonials');
  if (firstSection) {
    firstSection.parentNode.insertBefore(grid, firstSection);
  }
  
  // Remove old sections
  referencesArticle.querySelectorAll('.testimonials').forEach(s => s.remove());

  // Modal functionality
  const modal = document.querySelector("[data-modal-container]");
  const overlay = document.querySelector("[data-overlay]");
  if (!modal || !overlay) return;

  const toggle = () => { modal.classList.toggle("active"); overlay.classList.toggle("active"); };

  document.querySelectorAll("[data-testimonials-item]").forEach(item => {
    item.onclick = function() {
      const modalImg = document.querySelector("[data-modal-img]");
      const modalTitle = document.querySelector("[data-modal-title]");
      const modalText = document.querySelector("[data-modal-text]");
      if (modalImg) modalImg.src = this.querySelector("[data-testimonials-avatar]")?.src || '';
      if (modalTitle) modalTitle.innerHTML = this.querySelector("[data-testimonials-title]")?.innerHTML || '';
      if (modalText) modalText.innerHTML = this.querySelector("[data-testimonials-text]")?.innerHTML || '';
      toggle();
    };
  });

  const close = document.querySelector("[data-modal-close-btn]");
  if (close) close.onclick = toggle;
  overlay.onclick = toggle;
}

function initShowcase() {
  const select = document.querySelector("[data-select]");
  const selectValue = document.querySelector("[data-selecct-value]");
  const filterBtns = document.querySelectorAll("[data-filter-btn]");
  const filterItems = document.querySelectorAll("[data-filter-item]");

  if (select) select.onclick = () => elementToggleFunc(select);

  const filter = (val) => {
    filterItems.forEach(item => {
      const cat = item.dataset.category;
      item.classList.toggle('active', val === 'all' || val === 'tümü' || val === cat);
    });
  };

  const map = { "tümü": "all", "sertifikalar": "certifications", "eserlerim": "my creations", "koordinasyonumla": "with my coordination", "dahiliyetimle": "with my collaboration" };

  document.querySelectorAll("[data-select-item]").forEach(item => {
    item.onclick = function() {
      const val = this.innerText.toLowerCase().trim();
      if (selectValue) selectValue.innerText = this.innerText;
      filter(map[val] || val);
      elementToggleFunc(select);
    };
  });

  filterBtns.forEach(btn => {
    btn.onclick = function() {
      const val = this.innerText.toLowerCase().trim();
      if (selectValue) selectValue.innerText = this.innerText;
      filter(map[val] || val);
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    };
  });
}

// 7. Typewriter Effect
class TypewriterEffect {
  constructor() {
    this.currentIndex = 0; 
    this.currentTextIndex = 0; 
    this.isDeleting = false;
    this.timeoutId = null;
    this.titlesEn = [
      'Product Leader', 
      'AI Product Enthusiast', 
      'Conversational AI Specialist',
      'Agile Coach',
      'UX Strategist', 
      'Data-Driven PM',
      'Scrum Master',
      'PropTech Innovator',
      'Team Builder',
      'Digital Transformer',
      'Growth Hacker',
      'Psychology + Tech'
    ];
    this.titlesTr = [
      'Ürün Lideri', 
      'AI Ürün Tutkunu', 
      'Konuşma AI Uzmanı',
      'Çevik Koç',
      'UX Stratejisti', 
      'Veri Odaklı ÜY',
      'Scrum Master',
      'PropTech Yenilikçisi',
      'Takım Kurucusu',
      'Dijital Dönüştürücü',
      'Büyüme Hackeri',
      'Psikoloji + Teknoloji'
    ];
    this.init();
  }
  
  init() { 
    this.elEn = document.getElementById('typewriter-en'); 
    this.elTr = document.getElementById('typewriter-tr'); 
    if (this.elEn || this.elTr) this.start(); 
  }

  start() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    
    const lang = localStorage.getItem('preferredLanguage') || 'en';
    const titles = lang === 'tr' ? this.titlesTr : this.titlesEn;
    const el = lang === 'tr' ? this.elTr : this.elEn;
    if (!el) return;

    const full = titles[this.currentIndex];
    
    if (this.isDeleting) {
      el.textContent = full.substring(0, this.currentTextIndex - 1);
      this.currentTextIndex--;
      if (this.currentTextIndex === 0) { 
        this.isDeleting = false; 
        this.currentIndex = (this.currentIndex + 1) % titles.length; 
        this.timeoutId = setTimeout(() => this.start(), 300); 
        return; 
      }
      this.timeoutId = setTimeout(() => this.start(), 40);
    } else {
      el.textContent = full.substring(0, this.currentTextIndex + 1);
      this.currentTextIndex++;
      if (this.currentTextIndex === full.length) { 
        this.isDeleting = true; 
        this.timeoutId = setTimeout(() => this.start(), 1500); 
        return; 
      }
      this.timeoutId = setTimeout(() => this.start(), 80);
    }
  }

  restart() { 
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.currentIndex = 0; 
    this.currentTextIndex = 0; 
    this.isDeleting = false; 
    if (this.elEn) this.elEn.textContent = ''; 
    if (this.elTr) this.elTr.textContent = ''; 
    this.timeoutId = setTimeout(() => this.start(), 300); 
  }
}

// 8. CV Timeline Bullet Formatting
function formatTimelineBullets() {
  document.querySelectorAll('.timeline-text').forEach(el => {
    const html = el.innerHTML;
    // Check if content has bullet arrows
    if (html.includes('⇢')) {
      // Split by <br><br> and format as list
      const parts = html.split(/<br\s*\/?><br\s*\/?>/gi);
      if (parts.length > 1) {
        let intro = '';
        let bullets = [];
        
        parts.forEach((part, index) => {
          const trimmed = part.trim();
          if (trimmed.startsWith('⇢')) {
            // Remove the arrow and add as bullet
            bullets.push(trimmed.replace(/^⇢\s*/, ''));
          } else if (trimmed && index === 0) {
            intro = trimmed;
          }
        });
        
        if (bullets.length > 0) {
          let newHtml = intro ? `<p class="cv-intro">${intro}</p>` : '';
          newHtml += '<ul class="cv-bullets">';
          bullets.forEach(bullet => {
            newHtml += `<li>${bullet}</li>`;
          });
          newHtml += '</ul>';
          el.innerHTML = newHtml;
        }
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', () => { 
  window.typewriter = new TypewriterEffect();
  formatTimelineBullets();
});
