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

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  localStorage.setItem('preferredLanguage', lang);
  if (shouldRestartTypewriter && window.typewriter) window.typewriter.restart();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    applyLanguage(btn.getAttribute('data-lang'));
  });
});

// 5. Theme Management
const themeBtns = document.querySelectorAll('.theme-btn');
const htmlEl = document.documentElement;

function setTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-theme') === theme));
}

themeBtns.forEach(btn => btn.onclick = () => setTheme(btn.getAttribute('data-theme')));
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
  const modal = document.querySelector("[data-modal-container]");
  const overlay = document.querySelector("[data-overlay]");
  if (!modal || !overlay) return;

  const toggle = () => { modal.classList.toggle("active"); overlay.classList.toggle("active"); };

  document.querySelectorAll("[data-testimonials-item]").forEach(item => {
    item.onclick = function() {
      document.querySelector("[data-modal-img]").src = this.querySelector("[data-testimonials-avatar]").src;
      document.querySelector("[data-modal-title]").innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
      document.querySelector("[data-modal-text]").innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;
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
    this.titlesEn = ['Product Manager', 'Product Owner', 'UX Researcher', 'Data Analyst', 'Scrum Master', 'Digital Strategist', 'Innovation Catalyst', 'Problem Solver'];
    this.titlesTr = ['Ürün Müdürü', 'Ürün Sahibi', 'UX Araştırmacısı', 'Veri Analisti', 'Scrum Master', 'Dijital Stratejist', 'İnovasyon Katalizörü', 'Problem Çözücü'];
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
        this.timeoutId = setTimeout(() => this.start(), 500); 
        return; 
      }
      this.timeoutId = setTimeout(() => this.start(), 100);
    } else {
      el.textContent = full.substring(0, this.currentTextIndex + 1);
      this.currentTextIndex++;
      if (this.currentTextIndex === full.length) { 
        this.isDeleting = true; 
        this.timeoutId = setTimeout(() => this.start(), 2000); 
        return; 
      }
      this.timeoutId = setTimeout(() => this.start(), 200);
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

window.addEventListener('DOMContentLoaded', () => { window.typewriter = new TypewriterEffect(); });
