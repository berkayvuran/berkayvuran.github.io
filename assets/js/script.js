'use strict';

// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
}

// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  if (modalContainer && overlay) {
    modalContainer.classList.toggle("active");
    overlay.classList.toggle("active");
  }
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {
  testimonialsItem[i].addEventListener("click", function () {
    if (modalImg && modalTitle && modalText) {
      modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
      modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
      modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
      modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;
      testimonialsModalFunc();
    }
  });
}

// add click event to modal close button
if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", testimonialsModalFunc);
}
if (overlay) {
  overlay.addEventListener("click", testimonialsModalFunc);
}

// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

if (select) {
  select.addEventListener("click", function () { elementToggleFunc(this); });
}

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase().trim();
    
    // Türkçe-İngilizce mapping
    const categoryMapping = {
      "tümü": "all",
      "sertifikalar": "certifications", 
      "eserlerim": "my creations",
      "koordinasyonumla": "with my coordination",
      "dahiliyetimle": "with my collaboration",
      "all": "all",
      "certifications": "certifications",
      "my creations": "my creations", 
      "with my coordination": "with my coordination",
      "with my collaboration": "with my collaboration"
    };
    
    const mappedValue = categoryMapping[selectedValue] || selectedValue;
    
    // Select value'yu güncelle
    const selectValues = document.querySelectorAll("[data-selecct-value]");
    selectValues.forEach(sv => {
      if (sv) sv.innerText = this.innerText;
    });
    
    if (select) {
      elementToggleFunc(select);
    }
    filterFunc(mappedValue);
  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {
  for (let i = 0; i < filterItems.length; i++) {
    const itemCategory = filterItems[i].dataset.category;
    
    if (selectedValue === "all" || selectedValue === "tümü") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === itemCategory) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }
  }
}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {
  filterBtn[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase();
    
    // Türkçe kategori mapping - HTML'deki data-category değerleriyle eşleştirildi
    const categoryMapping = {
      "tümü": "all",
      "sertifikalar": "certifications", 
      "eserlerim": "my creations",
      "koordinasyonumla": "with my coordination",
      "dahiliyetimle": "with my collaboration"
    };
    
    // Eğer Türkçe ise mapping'e çevir
    if (categoryMapping[selectedValue]) {
      selectedValue = categoryMapping[selectedValue];
    }
    
    if (selectValue) {
      selectValue.innerText = this.innerText;
    }
    filterFunc(selectedValue);

    if (lastClickedBtn) {
      lastClickedBtn.classList.remove("active");
    }
    this.classList.add("active");
    lastClickedBtn = this;
  });
}

// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {
    // check form validation
    if (form && form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
}

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const navigationLinksMap = Array.from(navigationLinks).reduce((acc, link) => {
  acc[link.innerHTML.toLowerCase()] = link;
  return acc;
}, {});
const pages = document.querySelectorAll("[data-page]");
const pagesMap = Array.from(pages).reduce((acc, page) => {
  acc[page.dataset.page] = page;
  return acc;
}, {});

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const langAttribute = this.getAttribute("data-lang");
    const innerHTML = this.innerHTML.toLowerCase();
    
    // İyileştirilmiş Türkçe-İngilizce mapping
    const elementTextMap = {
      "hakkımda": "about",
      "cv": "cv", 
      "referanslar": "references",
      "vitrin": "showcase",
      "blog": "blog"
    };
    
    const elementText = langAttribute === "tr" ? elementTextMap[innerHTML] : innerHTML;

    const relatedPage = pagesMap[elementText];
    const relatedLink = navigationLinksMap[elementText];

    // Tüm sayfaları gizle
    for (let j = 0; j < pages.length; j++) {
      pages[j].classList.remove("active");
    }
    
    // Tüm nav linklerinden active'i kaldır
    for (let k = 0; k < navigationLinks.length; k++) {
      navigationLinks[k].classList.remove("active");
    }

    // İlgili sayfayı göster
    if (relatedPage) {
      relatedPage.classList.add("active");
    }
    
    // Şu anki linki active yap
    this.classList.add("active");
    
    // Aynı sayfanın diğer dildeki linkini de active yap
    const currentPageName = elementText;
    navigationLinks.forEach(link => {
      const linkLang = link.getAttribute("data-lang");
      const linkText = link.innerHTML.toLowerCase();
      
      if (linkLang === "en" && linkText === currentPageName) {
        link.classList.add("active");
      } else if (linkLang === "tr") {
        const trToEnMap = Object.keys(elementTextMap).find(key => elementTextMap[key] === currentPageName);
        if (trToEnMap && linkText === trToEnMap) {
          link.classList.add("active");
        }
      }
    });

    window.scrollTo(0, 0);
  });
}

// accordion functionality
var acc = document.getElementsByClassName("accordion"); 
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    // Toggle between adding and removing the "active" class
    this.classList.toggle("active");

    // Toggle between hiding and showing the active panel
    var panel = this.nextElementSibling;
    if (panel.style.display === "block") {
      panel.style.display = "none";
    } else {
      panel.style.display = "block";
    }
  });
}

// Language switching functionality
document.addEventListener('DOMContentLoaded', () => {
  // Dil değiştirme fonksiyonu
  const switchLanguage = (lang) => {
    // Tüm data-lang elementlerini kontrol et
    document.querySelectorAll('[data-lang]').forEach(el => {
      const elementLang = el.getAttribute('data-lang');
      if (elementLang === lang) {
        el.style.display = '';
        // Eğer bu bir button ise ve active class'ı varsa, karşılık gelen button'u da active yap
        if (el.tagName === 'BUTTON' && el.classList.contains('active')) {
          // Aynı parent içindeki diğer dil versiyonunu da active yap
          const parent = el.parentElement;
          if (parent) {
            const otherLangButtons = parent.querySelectorAll(`[data-lang]:not([data-lang="${lang}"])`);
            otherLangButtons.forEach(btn => btn.classList.remove('active'));
          }
        }
      } else {
        el.style.display = 'none';
      }
    });
    
    // Language switcher value'sunu güncelle
    const languageSwitcher = document.querySelector('#languageSwitcher');
    if (languageSwitcher) {
      languageSwitcher.value = lang;
    }
    
    // Local storage'a kaydet
    localStorage.setItem('preferredLanguage', lang);
  };

  // Language switcher event listener
  const languageSwitcher = document.querySelector('#languageSwitcher');
  if (languageSwitcher) {
    languageSwitcher.addEventListener('change', (event) => {
      switchLanguage(event.target.value);
    });
  }

  // Sayfa yüklendiğinde saved language'ı uygula
  const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
  switchLanguage(savedLanguage);
});

// Light mode toggle functionality
const themeSwitcher = document.querySelector('.theme-switcher');
const themeBtns = document.querySelectorAll('.theme-btn');
const html = document.documentElement;

// Check for saved theme preference or default to dark mode
const currentTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', currentTheme);

// Update active button state
themeBtns.forEach(btn => {
  if (btn.getAttribute('data-theme') === currentTheme) {
    btn.classList.add('active');
  }
});

// Theme toggle function
function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  // Update active button state
  themeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-theme') === theme) {
      btn.classList.add('active');
    }
  });
}

// Add click event to theme buttons
themeBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    const theme = this.getAttribute('data-theme');
    setTheme(theme);
  });
});

// Add keyboard shortcut for theme switching (Ctrl/Cmd + T)
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 't') {
    e.preventDefault();
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }
});

// Add system theme detection
function detectSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

// Listen for system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
    if (!localStorage.getItem('theme')) { // Only auto-switch if user hasn't manually set a preference
      const newTheme = e.matches ? 'light' : 'dark';
      setTheme(newTheme);
    }
  });
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
  // If no theme is saved, use system preference
  if (!localStorage.getItem('theme')) {
    const systemTheme = detectSystemTheme();
    setTheme(systemTheme);
  }
});