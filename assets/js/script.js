'use strict';

// Hash check is now handled by inline script in HTML for immediate execution

// 1. Core Utilities
const elementToggleFunc = (elem) => elem && elem.classList.toggle("active");

// 2. Sidebar Logic
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) sidebarBtn.addEventListener("click", () => elementToggleFunc(sidebar));

// 3. Dynamic Page Loading
let contentArea = document.querySelector("#content-area");
let navigationLinks = document.querySelectorAll("[data-nav-link]");

async function loadPage(pageName) {
  if (!contentArea) return;
  
  // Normalize page name
  const validPages = ['about', 'cv', 'references', 'showcase', 'blog'];
  if (!validPages.includes(pageName)) pageName = 'about';

  // If about page is already loaded inline, skip fetch
  if (pageName === 'about' && contentArea.querySelector('article.about')) {
    // Content already loaded inline, just ensure it's active
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
    applyLanguage(currentLang, contentArea, false);
    return;
  }

  try {
    // Fetch with cache for instant loading
    const response = await fetch(`./pages/${pageName}.html`, {
      cache: 'default'
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    
    // Inject content immediately - no delay
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
    
    // Init page-specific JS immediately for faster interactivity
    // Use requestAnimationFrame for CV and showcase to ensure DOM is ready
    if (pageName === 'cv') {
      requestAnimationFrame(() => {
        initCV();
      });
    } else if (pageName === 'showcase') {
      requestAnimationFrame(() => {
        initShowcase();
      });
    } else {
      if (pageName === 'references') initReferences();
    }

    window.scrollTo(0, 0);
    
    // Read page content if audio mode is enabled - always trigger on page change
    if (audioModeEnabled) {
      setTimeout(() => {
        readPageContent();
      }, 800);
    }

  } catch (error) {
    if (window.location.hostname === 'localhost') console.error("Load failed:", error);
    contentArea.innerHTML = `<article class="about active"><p>Failed to load ${pageName}.</p></article>`;
    contentArea.style.opacity = "1";
  }
}

// Prefetch pages on hover for instant loading (optimized for performance)
// This will be initialized in DOMContentLoaded to ensure navigationLinks exists

// Extract images from HTML content
function extractImagesFromHTML(html, pageName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img[src]');
  const imageUrls = [];
  const criticalImages = [];
  
  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('./assets/images/')) {
      // Convert relative path to absolute
      const absolutePath = new URL(src, window.location.origin).href;
      imageUrls.push(absolutePath);
      
      // Skip references avatars - they're lazy loaded (optimization)
      
      // Mark first 6 showcase images as critical (above the fold)
      if (pageName === 'showcase' && index < 6) {
        criticalImages.push(absolutePath);
      }
      
      // Mark first 3 blog images as critical (above the fold)
      if (pageName === 'blog' && index < 3) {
        criticalImages.push(absolutePath);
      }
    }
  });
  
  return { imageUrls, criticalImages };
}

// Preload images with priority
function preloadImage(imageUrl, priority = 'low') {
  // Use link preload
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = imageUrl;
  if (priority === 'high' && 'fetchPriority' in link) {
    link.fetchPriority = 'high';
  }
  document.head.appendChild(link);
  
  // Skip Image object preload - link preload is sufficient (optimization)
}

// Prefetch images from all pages for instant loading (optimized - only critical images)
async function prefetchAllImages() {
  // Skip CV page as it has minimal images - optimize for other pages
  const pagesToPrefetch = ['showcase', 'blog']; // Skip references - avatars are lazy loaded
  const allImages = new Set();
  const criticalImages = new Set();
  
  // Skip references page prefetch - avatars are small and lazy loaded
  
  // Load showcase first (has many images, first 6 are critical)
  try {
    const response = await fetch('./pages/showcase.html', { cache: 'default' });
    if (response.ok) {
      const html = await response.text();
      const { imageUrls, criticalImages: crit } = extractImagesFromHTML(html, 'showcase');
      imageUrls.forEach(url => allImages.add(url));
      crit.forEach(url => criticalImages.add(url));
      
      // Immediately start loading critical showcase images
      crit.forEach(imageUrl => preloadImage(imageUrl, 'high'));
    }
  } catch (error) {
    if (window.location.hostname === 'localhost') console.warn('Failed to prefetch showcase images:', error);
  }
  
  // Load blog third (has many images, first 3 are critical)
  try {
    const response = await fetch('./pages/blog.html', { cache: 'default' });
    if (response.ok) {
      const html = await response.text();
      const { imageUrls, criticalImages: crit } = extractImagesFromHTML(html, 'blog');
      imageUrls.forEach(url => allImages.add(url));
      crit.forEach(url => criticalImages.add(url));
      
      // Immediately start loading critical blog images
      crit.forEach(imageUrl => preloadImage(imageUrl, 'high'));
    }
  } catch (error) {
    if (window.location.hostname === 'localhost') console.warn('Failed to prefetch blog images:', error);
  }
  
  // Skip non-critical image prefetching - only critical images are preloaded (optimization)
}

// Prefetch all pages on initial load for instant navigation
window.addEventListener('DOMContentLoaded', () => {
  // Ensure contentArea and navigationLinks are available
  if (!contentArea) contentArea = document.querySelector("#content-area");
  if (!navigationLinks || navigationLinks.length === 0) navigationLinks = document.querySelectorAll("[data-nav-link]");
  
  // Initialize navigation link prefetching
  if (navigationLinks && navigationLinks.length > 0) {
    navigationLinks.forEach(link => {
      const page = link.getAttribute("data-nav-link");
      
      // Prefetch on hover - instant load when clicked
      link.addEventListener("mouseenter", () => {
        if (page !== 'about') { // about is already inline
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = `./pages/${page}.html`;
          prefetchLink.as = 'document';
          // Prioritize CV page prefetch
          if (page === 'cv' && 'fetchPriority' in prefetchLink) {
            prefetchLink.fetchPriority = 'high';
          }
          document.head.appendChild(prefetchLink);
        }
      }, { once: true }); // Only prefetch once per link
      
      // Click handler
      link.addEventListener("click", (e) => {
        e.preventDefault();
        loadPage(page);
        history.pushState(null, null, `#${page}`);
      });
    });
  }
  
  // Load initial page
  const hash = window.location.hash.replace('#', '') || 'about';
  
  // Prefetch all pages except about (already inline) and current page
  // Prioritize CV page for faster loading
  const pagesToPrefetch = ['cv', 'references', 'showcase', 'blog'];
  
  // Only prefetch other pages if not already on that page
  pagesToPrefetch.forEach((page) => {
    // Skip prefetching current page
    if (page === hash) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `./pages/${page}.html`;
    link.as = 'document';
    // Use preload for CV and showcase pages (higher priority)
    if (page === 'cv' || page === 'showcase') {
      link.rel = 'preload';
      if ('fetchPriority' in link) {
        link.fetchPriority = 'high';
      }
    } else if (page === 'cv' && 'fetchPriority' in link) {
      link.fetchPriority = 'high';
    }
    document.head.appendChild(link);
  });
  
  // Clear inline about if hash is not about (backup check - inline script should handle it)
  if (hash !== 'about' && contentArea) {
    const inlineAbout = contentArea.querySelector('#inline-about-content');
    if (inlineAbout) {
      inlineAbout.remove();
    }
  }
  
  // Load page with error handling
  if (contentArea) {
    loadPage(hash);
  } else {
    console.error('Content area not found');
  }
  
  // Optimized: Only prefetch images for showcase/blog, skip CV and references
  if (hash !== 'cv' && hash !== 'references') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => prefetchAllImages(), { timeout: 2000 });
    } else {
      setTimeout(() => prefetchAllImages(), 1000);
    }
  }
  
  // Prevent prefetching of appendices (PDFs) and projects - lazy load only on click
  const preventPrefetch = () => {
    // Find all PDF links and project links
    const pdfLinks = document.querySelectorAll('a[href*="appendices"], a[href*=".pdf"]');
    const projectLinks = document.querySelectorAll('a[href*="projects/"]');
    
    // Add click handler to load only on click (no prefetch)
    [...pdfLinks, ...projectLinks].forEach(link => {
      // Ensure no prefetch happens
      if (!link.hasAttribute('data-lazy-loaded')) {
        link.setAttribute('data-lazy-loaded', 'true');
        // Remove any existing prefetch hints
        const href = link.getAttribute('href');
        if (href) {
          const existingPrefetch = document.querySelector(`link[rel="prefetch"][href="${href}"]`);
          if (existingPrefetch) {
            existingPrefetch.remove();
          }
        }
      }
    });
  };
  
  // Run immediately and also after page loads
  preventPrefetch();
  
  // Re-run when new content is loaded (e.g., when switching pages)
  const observer = new MutationObserver(() => {
    preventPrefetch();
  });
  
  if (contentArea) {
    observer.observe(contentArea, { childList: true, subtree: true });
  }
});

// Popstate (Back/Forward buttons)
window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '') || 'about';
  loadPage(hash);
  
  // Read page content if audio mode is enabled
  if (audioModeEnabled) {
    setTimeout(() => {
      readPageContent();
    }, 800);
  }
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

  // Update language toggle button display and aria-checked
  document.documentElement.setAttribute('data-lang', lang);
  const langToggleBtn = document.querySelector('.lang-toggle-btn');
  if (langToggleBtn) {
    langToggleBtn.setAttribute('aria-checked', lang === 'tr' ? 'true' : 'false');
  }
  
  // Update info_more-btn aria-label based on language
  const infoMoreBtn = document.querySelector('.info_more-btn');
  if (infoMoreBtn) {
    const ariaLabel = lang === 'tr' 
      ? infoMoreBtn.getAttribute('data-aria-label-tr') || 'İletişim bilgilerini göster'
      : infoMoreBtn.getAttribute('data-aria-label-en') || 'Show contacts';
    infoMoreBtn.setAttribute('aria-label', ariaLabel);
  }

  localStorage.setItem('preferredLanguage', lang);
  if (shouldRestartTypewriter && window.typewriter) window.typewriter.restart();
  
  // Dispatch event for theme select update
  document.dispatchEvent(new CustomEvent('languageChanged'));
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

// 5. Theme Management - 4 Themes Support with Creative Names
const htmlEl = document.documentElement;

// Valid themes in order (for cycling)
const validThemes = ['dark', 'light', 'matrix', 'high-contrast'];

// Creative and funny theme names in different languages
const themeNames = {
  'dark': { 
    'en': '🌙 Night Owl', 
    'tr': '🌙 Gece Baykuşu' 
  },
  'light': { 
    'en': '☀️ Sunshine Mode', 
    'tr': '☀️ Güneş Modu' 
  },
  'matrix': { 
    'en': '💚 Matrix Vibes', 
    'tr': '💚 Matrix Ruhu' 
  },
  'high-contrast': { 
    'en': '⚡ Zap Mode', 
    'tr': '⚡ Şimşek Modu' 
  }
};

function setTheme(theme) {
  // Validate theme
  if (!validThemes.includes(theme)) {
    theme = 'dark';
  }
  
  // Use requestAnimationFrame for smooth theme transition (performance optimization)
  requestAnimationFrame(() => {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle button text
    updateThemeToggleButton();
  });
}

function getNextTheme(currentTheme) {
  const currentIndex = validThemes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % validThemes.length;
  return validThemes[nextIndex];
}

function updateThemeToggleButton() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleTexts = document.querySelectorAll('.theme-toggle-text');
  if (!themeToggleBtn) return;
  
  const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
  const currentLang = localStorage.getItem('preferredLanguage') || 'en';
  
  // Update button text based on current theme and language
  themeToggleTexts.forEach(textEl => {
    const lang = textEl.getAttribute('data-lang');
    if (lang === currentLang) {
      textEl.textContent = themeNames[currentTheme][currentLang];
      textEl.style.display = 'inline';
    } else {
      textEl.style.display = 'none';
    }
  });
}

// Initialize theme toggle button
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (!themeToggleBtn) return;
  
  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);
  
  // Add click handler to cycle through themes
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
    const nextTheme = getNextTheme(currentTheme);
    setTheme(nextTheme);
  });
}

// Initialize theme on load
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

// Initialize theme toggle button
window.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  
  // Update theme button when language changes
  document.addEventListener('languageChanged', () => {
    updateThemeToggleButton();
  });
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
  initThemeToggle();
}

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

  // Create unified grid container with proper list structure for accessibility
  const grid = document.createElement('ul');
  grid.className = 'references-grid';
  grid.setAttribute('role', 'list');

  // Move all testimonial items into single grid with business card layout
  document.querySelectorAll('.references .testimonials').forEach(section => {
    const companyTitle = section.querySelector('.service-title');
    const companyName = companyTitle ? companyTitle.textContent.replace('Testimonials from ', '').replace(' Referansları', '').trim() : '';
    
    section.querySelectorAll('.testimonials-item').forEach(item => {
      const card = item.querySelector('.content-card');
      if (card) {
        // Ensure role is set for accessibility
        if (!card.getAttribute('role')) {
          card.setAttribute('role', 'article');
        }
        
        // Get title for aria-labelledby and fix heading hierarchy (h4 -> h3)
        const title = card.querySelector('.testimonials-item-title');
        if (title && title.tagName === 'H4') {
          // Change h4 to h3 for proper heading hierarchy
          const h3 = document.createElement('h3');
          h3.className = title.className;
          h3.setAttribute('data-testimonials-title', title.getAttribute('data-testimonials-title') || '');
          h3.textContent = title.textContent;
          if (title.id) h3.id = title.id;
          title.parentNode.replaceChild(h3, title);
        }
        const titleElement = card.querySelector('.testimonials-item-title');
        const titleText = titleElement ? titleElement.textContent.trim() : '';
        const titleId = titleText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-title';
        if (titleElement && !titleElement.id) {
          titleElement.id = titleId;
          card.setAttribute('aria-labelledby', titleId);
        }
        
        // Create card-info wrapper for business card layout
        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';
        
        // Move title, text to card-info
        if (titleElement) cardInfo.appendChild(titleElement);
        const text = card.querySelector('.testimonials-text');
        if (text) cardInfo.appendChild(text);
        
        // Add company badge with accessibility
        if (companyName) {
          const badge = document.createElement('span');
          badge.className = 'company-badge';
          badge.textContent = companyName;
          badge.setAttribute('aria-label', `Company: ${companyName}`);
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
      const avatarImg = this.querySelector("[data-testimonials-avatar]");
      if (modalImg && avatarImg && avatarImg.src) {
        modalImg.src = avatarImg.src;
        modalImg.alt = avatarImg.alt || '';
      }
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

  // Add aria-labels to project links for accessibility
  const projectLinks = document.querySelectorAll('.project-item > a');
  projectLinks.forEach(link => {
    if (!link.getAttribute('aria-label')) {
      const title = link.querySelector('.project-title');
      const category = link.querySelector('.project-category[data-lang="en"]') || link.querySelector('.project-category');
      const titleText = title ? title.textContent.trim() : 'project';
      const categoryText = category ? category.textContent.trim() : '';
      const currentLang = localStorage.getItem('preferredLanguage') || 'en';
      
      if (currentLang === 'tr') {
        const categoryTr = link.querySelector('.project-category[data-lang="tr"]');
        const categoryTextTr = categoryTr ? categoryTr.textContent.trim() : categoryText;
        link.setAttribute('aria-label', `${titleText} projesini görüntüle${categoryTextTr ? ` - ${categoryTextTr}` : ''}`);
      } else {
        link.setAttribute('aria-label', `View ${titleText} project${categoryText ? ` - ${categoryText}` : ''}`);
      }
    }
  });

  // Update aria-expanded for select button
  if (select) {
    select.onclick = () => {
      const isActive = select.classList.contains('active');
      select.setAttribute('aria-expanded', isActive ? 'false' : 'true');
      elementToggleFunc(select);
    };
  }

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
    // Check if ADHD mode is enabled - if so, show static text
    const adhdMode = localStorage.getItem('adhdMode') === 'true';
    if (adhdMode) {
      const lang = localStorage.getItem('preferredLanguage') || 'en';
      const titles = lang === 'tr' ? this.titlesTr : this.titlesEn;
      const el = lang === 'tr' ? this.elTr : this.elEn;
      if (el && titles.length > 0) {
        el.textContent = titles[0]; // Show first title statically
      }
      return; // Don't animate
    }
    
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

// Initialize floating settings menu - try multiple times to ensure it works
function initFloatingSettingsMenuWithRetry() {
  const settingsBtn = document.getElementById('floating-settings-btn');
  const settingsMenu = document.getElementById('floating-settings-menu');
  
  if (!settingsBtn || !settingsMenu) {
    // Retry after a short delay if elements not found
    setTimeout(initFloatingSettingsMenuWithRetry, 100);
    return;
  }
  
  // Elements found, initialize menu
  initFloatingSettingsMenu();
}

window.addEventListener('DOMContentLoaded', () => { 
  window.typewriter = new TypewriterEffect();
  formatTimelineBullets();
  
  // Floating Settings Menu - initialize with retry mechanism
  initFloatingSettingsMenuWithRetry();
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initFloatingSettingsMenuWithRetry, 1);
}

// 9. Floating Settings Menu
function initFloatingSettingsMenu() {
  const settingsBtn = document.getElementById('floating-settings-btn');
  const settingsMenu = document.getElementById('floating-settings-menu');
  const settingsClose = document.getElementById('floating-settings-close');
  
  if (!settingsBtn || !settingsMenu) {
    return;
  }
  
  // Store references
  const btn = settingsBtn;
  const menu = settingsMenu;
  
  function openMenu() {
    console.log('Opening menu...');
    settingsMenu.classList.add('active');
    // Force inline styles to ensure menu is visible
    settingsMenu.style.opacity = '1';
    settingsMenu.style.visibility = 'visible';
    settingsMenu.style.transform = 'translateY(0) scale(1) translateZ(0)';
    settingsMenu.style.pointerEvents = 'all';
    settingsMenu.style.display = 'block';
    btn.setAttribute('aria-expanded', 'true');
    console.log('Menu classes:', settingsMenu.className);
    console.log('Menu computed opacity:', window.getComputedStyle(settingsMenu).opacity);
    console.log('Menu computed visibility:', window.getComputedStyle(settingsMenu).visibility);
    // Prevent body scroll when menu is open on mobile
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    }
  }
  
  function closeMenu() {
    console.log('Closing menu...');
    settingsMenu.classList.remove('active');
    // Reset inline styles
    settingsMenu.style.opacity = '';
    settingsMenu.style.visibility = '';
    settingsMenu.style.transform = '';
    settingsMenu.style.pointerEvents = '';
    settingsMenu.style.display = '';
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  
  function toggleMenu() {
    console.log('Toggle menu called, current state:', settingsMenu.classList.contains('active'));
    if (settingsMenu.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  }
  
  // Flag to prevent immediate closing when opening
  let isOpening = false;
  
  // Add click event listener - use capture phase to ensure it fires
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    isOpening = true;
    console.log('Button clicked, menu state before:', settingsMenu.classList.contains('active'));
    toggleMenu();
    console.log('Menu state after:', settingsMenu.classList.contains('active'));
    console.log('Menu element:', settingsMenu);
    // Reset flag after a short delay
    setTimeout(() => {
      isOpening = false;
    }, 200);
  }, true); // Use capture phase
  
  // Touch support for mobile
  btn.addEventListener('touchend', (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    isOpening = true;
    toggleMenu();
    setTimeout(() => {
      isOpening = false;
    }, 200);
  }, true);
  
  if (settingsClose) {
    settingsClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
    });
  }
  
  // Close menu when clicking outside (but not when opening)
  document.addEventListener('click', (e) => {
    if (isOpening) return;
    
    if (settingsMenu.classList.contains('active') && 
        !settingsMenu.contains(e.target) && 
        !settingsBtn.contains(e.target)) {
      closeMenu();
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsMenu.classList.contains('active')) {
      closeMenu();
    }
  });
  
  // Prevent menu from closing when clicking inside it
  settingsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// 10. Audio Mode (Text-to-Speech) - Accessibility Mode
let audioModeEnabled = false;
let speechSynthesis = null;
let currentUtterance = null;
let contentObserver = null;
let readingSpeed = parseFloat(localStorage.getItem('readingSpeed')) || 1.0;
let currentText = ''; // Store current text being read
let currentLang = 'en'; // Store current language
let speechStartTime = 0; // Track when speech started
let speechCharIndex = 0; // Track character position

// Initialize Speech Synthesis
function initAudioMode() {
  if ('speechSynthesis' in window) {
    speechSynthesis = window.speechSynthesis;
    console.log('Speech synthesis initialized');
  } else {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }
  
  const screenReaderToggle = document.getElementById('screen-reader-toggle');
  if (!screenReaderToggle) {
    console.warn('Screen reader toggle not found');
    return;
  }
  
  // Load saved state (check both old and new key for migration)
  audioModeEnabled = localStorage.getItem('screenReaderMode') === 'true' || localStorage.getItem('audioMode') === 'true';
  if (localStorage.getItem('audioMode') === 'true' && !localStorage.getItem('screenReaderMode')) {
    // Migrate old key to new key
    localStorage.setItem('screenReaderMode', 'true');
    localStorage.removeItem('audioMode');
  }
  screenReaderToggle.checked = audioModeEnabled;
  console.log('Screen reader mode initial state:', audioModeEnabled);
  
  // Reading speed control
  const readingSpeedSlider = document.getElementById('reading-speed');
  const readingSpeedValue = document.getElementById('reading-speed-value');
  const readingSpeedItem = document.getElementById('reading-speed-item');
  
  if (readingSpeedSlider && readingSpeedValue) {
    readingSpeedSlider.value = readingSpeed;
    readingSpeedValue.textContent = readingSpeed.toFixed(1) + 'x';
    
    readingSpeedSlider.addEventListener('input', (e) => {
      const newSpeed = parseFloat(e.target.value);
      const oldSpeed = readingSpeed;
      readingSpeed = newSpeed;
      readingSpeedValue.textContent = readingSpeed.toFixed(1) + 'x';
      localStorage.setItem('readingSpeed', readingSpeed);
      
      // If currently speaking, continue from current position with new speed
      if (audioModeEnabled && speechSynthesis && speechSynthesis.speaking && currentText && speechStartTime > 0) {
        // Calculate how much has been read based on time and old speed
        const elapsedTime = (Date.now() - speechStartTime) / 1000; // in seconds
        
        // More accurate estimation: average speaking rate is ~150 words/min
        // Average word length is ~5 characters, so ~750 chars/min = ~12.5 chars/sec at 1x speed
        // But we need to account for pauses, so use a more conservative estimate
        const charsPerSecond = 10 * oldSpeed; // Conservative estimate
        const estimatedCharsRead = Math.floor(elapsedTime * charsPerSecond);
        
        // Update character index (don't exceed text length)
        speechCharIndex = Math.min(estimatedCharsRead + speechCharIndex, currentText.length);
        
        // Get remaining text (skip already read part)
        const remainingText = currentText.substring(speechCharIndex).trim();
        
        if (remainingText.length > 10) { // Only continue if there's substantial text left
          console.log('Speed changed. Continuing from position:', speechCharIndex, '/', currentText.length, 'Remaining:', remainingText.substring(0, 50));
          
          // Stop current speech
          speechSynthesis.cancel();
          
          // Update character index to mark what we've read
          // We'll update it again when this utterance ends
          
          // Continue with remaining text at new speed
          setTimeout(() => {
            continueSpeaking(remainingText, currentLang, true);
          }, 150);
        } else {
          console.log('Not enough text remaining to continue');
        }
      }
    });
  }
  
  // Screen Reader Mode toggle handler
  screenReaderToggle.addEventListener('change', (e) => {
    audioModeEnabled = e.target.checked;
    localStorage.setItem('screenReaderMode', audioModeEnabled);
    console.log('Screen reader mode toggled:', audioModeEnabled);
    
    // Show/hide reading speed control
    if (readingSpeedItem) {
      readingSpeedItem.style.display = audioModeEnabled ? 'flex' : 'none';
    }
    
    if (audioModeEnabled) {
      // User interaction happened, safe to start
      startAudioMode();
    } else {
      stopAudioMode();
    }
  });
  
  // Show reading speed if already enabled
  if (audioModeEnabled && readingSpeedItem) {
    readingSpeedItem.style.display = 'flex';
  }
  
  // Also add click handler to ensure user interaction
  screenReaderToggle.addEventListener('click', (e) => {
    // This ensures user interaction is registered
    if (audioModeEnabled && speechSynthesis) {
      // Test if we can speak
      const testUtterance = new SpeechSynthesisUtterance('');
      testUtterance.volume = 0;
      speechSynthesis.speak(testUtterance);
      speechSynthesis.cancel();
    }
  });
  
  // Start if enabled
  if (audioModeEnabled) {
    setTimeout(() => {
      startAudioMode();
    }, 500);
  }
}

function startAudioMode() {
  console.log('Starting audio mode');
  // Stop any current speech
  if (speechSynthesis && speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  
  // Read current page
  setTimeout(() => {
    readPageContent();
  }, 300);
  
  // Observe content changes
  observeContentChanges();
}

function stopAudioMode() {
  // Stop speech
  if (speechSynthesis && speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  
  // Stop observing
  if (contentObserver) {
    contentObserver.disconnect();
    contentObserver = null;
  }
}

function readPageContent() {
  console.log('Reading page content, audioModeEnabled:', audioModeEnabled);
  if (!speechSynthesis || !audioModeEnabled) {
    console.log('Speech synthesis not available or audio mode disabled');
    return;
  }
  
  const contentArea = document.querySelector('#content-area');
  if (!contentArea) {
    console.log('Content area not found');
    return;
  }
  
  // Get current language
  const currentLang = localStorage.getItem('preferredLanguage') || 'en';
  
  // Extract page summary
  const summary = extractPageSummary(contentArea, currentLang);
  console.log('Page summary extracted:', summary);
  
  if (summary) {
    speakText(summary, currentLang);
  } else {
    console.log('No summary extracted');
  }
}

function extractPageSummary(contentArea, lang) {
  if (!contentArea) {
    console.log('extractPageSummary: contentArea not found');
    return '';
  }
  
  // Try multiple selectors to find the article
  let activeArticle = contentArea.querySelector('article.active');
  if (!activeArticle) {
    activeArticle = contentArea.querySelector('article[data-page]');
  }
  if (!activeArticle) {
    activeArticle = contentArea.querySelector('article');
  }
  
  if (!activeArticle) {
    console.log('extractPageSummary: No article found');
    return '';
  }
  
  const pageName = activeArticle.getAttribute('data-page') || 'about';
  console.log('extractPageSummary: pageName:', pageName);
  
  // Get title - try multiple selectors
  let title = activeArticle.querySelector('.article-title');
  if (!title) title = activeArticle.querySelector('h2');
  if (!title) title = activeArticle.querySelector('h1');
  const titleText = title ? title.textContent.trim() : '';
  console.log('extractPageSummary: titleText:', titleText);
  
  // Get ALL visible content - not just summary
  // Use a recursive function to extract text in order
  function extractTextRecursive(element, lang) {
    let text = '';
    
    // Check if element is visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return '';
    }
    
    // Check language attribute
    const elementLang = element.getAttribute('data-lang');
    if (elementLang && elementLang !== lang) {
      return '';
    }
    
    // Process children first
    const children = Array.from(element.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        const textContent = child.textContent.trim();
        if (textContent) {
          text += textContent + ' ';
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childText = extractTextRecursive(child, lang);
        if (childText) {
          text += childText;
        }
      }
    }
    
    // Add punctuation based on element type
    if (element.tagName && element.tagName.match(/^H[1-6]$/)) {
      text = text.trim() + '. ';
    } else if (element.tagName === 'P' || element.tagName === 'LI') {
      text = text.trim() + '. ';
    }
    
    return text;
  }
  
  // Extract all text from article
  let fullContent = extractTextRecursive(activeArticle, lang);
  
  // Clean up multiple spaces and periods
  fullContent = fullContent.replace(/\s+/g, ' ').replace(/\.\.+/g, '.').trim();
  
  console.log('extractPageSummary: full content length:', fullContent.length);
  
  // Build full text with page context
  let fullText = '';
  if (lang === 'tr') {
    switch(pageName) {
      case 'about':
        fullText = 'Hakkımda sayfası. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      case 'cv':
        fullText = 'CV sayfası. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      case 'references':
        fullText = 'Referanslar sayfası. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      case 'showcase':
        fullText = 'Vitrin sayfası. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      case 'blog':
        fullText = 'Blog sayfası. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      default:
        fullText = (titleText ? titleText + '. ' : '') + fullContent;
    }
  } else {
    switch(pageName) {
      case 'about':
        fullText = 'About page. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      case 'cv':
        fullText = 'CV page. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      case 'references':
        fullText = 'References page. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      case 'showcase':
        fullText = 'Showcase page. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      case 'blog':
        fullText = 'Blog page. ' + (titleText ? titleText + '. ' : '') + fullContent;
        break;
      default:
        fullText = (titleText ? titleText + '. ' : '') + fullContent;
    }
  }
  
  const finalText = fullText.trim();
  console.log('extractPageSummary: final text length:', finalText.length);
  return finalText;
}

function speakText(text, lang) {
  // Reset position tracking for new text
  speechCharIndex = 0;
  currentText = text;
  currentLang = lang;
  
  continueSpeaking(text, lang);
}

function continueSpeaking(text, lang, isContinuation = false) {
  console.log('Speaking text:', text.substring(0, 50) + '...', 'Lang:', lang, 'Speed:', readingSpeed, 'Continuation:', isContinuation);
  
  // Ensure speechSynthesis is available
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    return;
  }
  
  if (!speechSynthesis) {
    speechSynthesis = window.speechSynthesis;
  }
  
  if (!speechSynthesis || !text) {
    console.log('Cannot speak: speechSynthesis:', !!speechSynthesis, 'text:', !!text);
    return;
  }
  
  // Cancel any ongoing speech
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  
  // Wait a bit for cancel to complete
  setTimeout(() => {
    try {
      // Create utterance with current reading speed
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'tr' ? 'tr-TR' : 'en-US';
      utterance.rate = readingSpeed; // Use configured reading speed
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Store utterance reference
      currentUtterance = utterance;
      
      // Event handlers
      utterance.onstart = () => {
        console.log('Speech started at speed:', readingSpeed);
        speechStartTime = Date.now(); // Track start time (reset for continuation)
      };
      utterance.onend = () => {
        console.log('Speech ended');
        currentUtterance = null;
        speechStartTime = 0;
        
        // Update character index - if continuation, we already updated it before speaking
        // If not continuation and we finished, we've read everything
        if (!isContinuation) {
          speechCharIndex = currentText.length; // Mark as fully read
        }
        
        // Only clear if we've read everything
        if (speechCharIndex >= currentText.length) {
          currentText = '';
          speechCharIndex = 0;
        }
      };
      utterance.onerror = (e) => {
        console.error('Speech error:', e);
        currentUtterance = null;
        speechStartTime = 0;
      };
      
      // Select voice based on language - get voices safely
      let voices = [];
      try {
        voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
      } catch (e) {
        console.warn('Could not get voices:', e);
      }
      
      if (voices.length > 0) {
        const preferredVoice = voices.find(voice => {
          if (lang === 'tr') {
            return voice.lang.startsWith('tr');
          } else {
            return voice.lang.startsWith('en');
          }
        });
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('Using voice:', preferredVoice.name);
        } else {
          console.log('No preferred voice found, using default');
        }
      }
      
      speechSynthesis.speak(utterance);
      console.log('Speech synthesis.speak() called at speed:', readingSpeed);
    } catch (e) {
      console.error('Error creating/speaking utterance:', e);
    }
  }, 100);
}

function observeContentChanges() {
  if (contentObserver) {
    contentObserver.disconnect();
  }
  
  const contentArea = document.querySelector('#content-area');
  if (!contentArea) return;
  
  // Observe changes in content area
  contentObserver = new MutationObserver((mutations) => {
    // Check if content actually changed (not just style/class changes)
    let contentChanged = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if actual content was added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && (node.tagName === 'ARTICLE' || node.querySelector('article'))) {
            contentChanged = true;
          }
        });
      }
    });
    
    if (contentChanged && audioModeEnabled) {
      // Wait a bit for content to render
      setTimeout(() => {
        readPageContent();
      }, 500);
    }
  });
  
  contentObserver.observe(contentArea, {
    childList: true,
    subtree: true
  });
}

// Initialize audio mode when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  // Wait for voices to load
  if ('speechSynthesis' in window) {
    speechSynthesis = window.speechSynthesis;
    // Some browsers need voices to be loaded
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        initAudioMode();
      }, { once: true });
    } else {
      initAudioMode();
    }
  } else {
    console.warn('Speech synthesis not supported');
  }
  
  // Initialize Colorblind Mode
  initColorblindMode();
  
  // Initialize ADHD Mode
  initADHDMode();
});

// 11. Colorblind Mode
function initColorblindMode() {
  // Apply saved state immediately on page load
  const colorblindEnabled = localStorage.getItem('colorblindMode') === 'true';
  if (colorblindEnabled) {
    applyColorblindMode();
  }
  
  const colorblindToggle = document.getElementById('colorblind-toggle');
  if (!colorblindToggle) return;
  
  colorblindToggle.checked = colorblindEnabled;
  
  colorblindToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('colorblindMode', enabled);
    
    if (enabled) {
      applyColorblindMode();
    } else {
      removeColorblindMode();
    }
  });
}

function applyColorblindMode() {
  document.documentElement.setAttribute('data-colorblind', 'true');
}

function removeColorblindMode() {
  document.documentElement.removeAttribute('data-colorblind');
}

// 12. ADHD Mode
function initADHDMode() {
  // Apply saved state immediately on page load
  const adhdEnabled = localStorage.getItem('adhdMode') === 'true';
  if (adhdEnabled) {
    applyADHDMode();
  }
  
  const adhdToggle = document.getElementById('adhd-toggle');
  if (!adhdToggle) return;
  
  adhdToggle.checked = adhdEnabled;
  
  adhdToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('adhdMode', enabled);
    
    if (enabled) {
      applyADHDMode();
    } else {
      removeADHDMode();
    }
  });
}

function applyADHDMode() {
  document.documentElement.setAttribute('data-adhd', 'true');
}

function removeADHDMode() {
  document.documentElement.removeAttribute('data-adhd');
}

