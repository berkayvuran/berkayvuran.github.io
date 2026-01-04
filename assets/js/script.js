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

  } catch (error) {
    if (window.location.hostname === 'localhost') console.error("Load failed:", error);
    contentArea.innerHTML = `<article class="about active"><p>Failed to load ${pageName}.</p></article>`;
    contentArea.style.opacity = "1";
  }
}

// Prefetch pages on hover for instant loading
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
      
      // Mark references avatars as critical
      if (pageName === 'references' && src.includes('/avatars/')) {
        criticalImages.push(absolutePath);
      }
      
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
  
  // Also preload using Image objects for better browser compatibility
  const img = new Image();
  img.src = imageUrl;
}

// Prefetch images from all pages for instant loading
async function prefetchAllImages() {
  // Skip CV page as it has minimal images - optimize for other pages
  const pagesToPrefetch = ['references', 'showcase', 'blog']; // References and showcase first (most images)
  const allImages = new Set();
  const criticalImages = new Set();
  
  // Load references first (most critical - has many avatars)
  try {
    const response = await fetch('./pages/references.html', { cache: 'default' });
    if (response.ok) {
      const html = await response.text();
      const { imageUrls, criticalImages: crit } = extractImagesFromHTML(html, 'references');
      imageUrls.forEach(url => allImages.add(url));
      crit.forEach(url => criticalImages.add(url));
      
      // Immediately start loading critical images
      crit.forEach(imageUrl => preloadImage(imageUrl, 'high'));
    }
  } catch (error) {
    if (window.location.hostname === 'localhost') console.warn('Failed to prefetch references images:', error);
  }
  
  // Load showcase second (has many images, first 6 are critical)
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
  
  // Preload remaining images with lower priority
  allImages.forEach(imageUrl => {
    if (!criticalImages.has(imageUrl)) {
      preloadImage(imageUrl, 'low');
    }
  });
  
  if (window.location.hostname === 'localhost') console.log(`Prefetched ${allImages.size} images (${criticalImages.size} critical) from all pages`);
}

// Prefetch all pages on initial load for instant navigation
window.addEventListener('DOMContentLoaded', () => {
  // Ensure contentArea and navigationLinks are available
  if (!contentArea) contentArea = document.querySelector("#content-area");
  if (!navigationLinks || navigationLinks.length === 0) navigationLinks = document.querySelectorAll("[data-nav-link]");
  
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
  
  // Prefetch images after page load - only if not on CV page (CV has minimal images)
  // Use requestIdleCallback if available, otherwise setTimeout
  const prefetchImages = () => {
    // Skip prefetching if on CV page to reduce initial load
    if (hash === 'cv') return;
    // Wait a bit to ensure main page is fully rendered
    setTimeout(() => {
      prefetchAllImages();
    }, 100);
  };
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetchImages, { timeout: 3000 });
  } else {
    // Fallback for browsers without requestIdleCallback - delay longer for CV page
    setTimeout(prefetchImages, hash === 'cv' ? 2000 : 500);
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
const themeToggleInput = document.querySelector('#theme-toggle');
const htmlEl = document.documentElement;

function setTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (themeToggleInput) {
    themeToggleInput.checked = theme === 'light';
  }
}

function toggleTheme() {
  const current = htmlEl.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

if (themeToggleInput) {
  themeToggleInput.addEventListener('change', toggleTheme);
}
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
