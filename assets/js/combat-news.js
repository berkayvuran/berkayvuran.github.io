// Data
const mockNews = [
    {
        id: 1,
        category: 'boxing',
        date: '2025-05-20',
        image: 'https://images.unsplash.com/photo-1615117970176-63e52719602e?q=80&w=800&auto=format&fit=crop',
        title: { en: "Fury vs Usyk: The Rematch", tr: "Fury vs Usyk: Büyük Rövanş" },
        summary: { en: "Heavyweight kings set to collide in Riyadh.", tr: "Ağır sikletin kralları Riyad'da tekrar karşılaşıyor." },
        source: "Boxing News 24",
        url: "https://www.boxingnews24.com/"
    },
    {
        id: 2,
        category: 'kickboxing',
        date: '2025-05-19',
        image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=800&auto=format&fit=crop',
        title: { en: "Glory 95: Verhoeven Retains", tr: "Glory 95: Verhoeven Korudu" },
        summary: { en: "Another dominant performance by the King of Kickboxing.", tr: "Kickboks Kralı'ndan bir başka baskın performans." },
        source: "Glory",
        url: "https://glorykickboxing.com/"
    },
    {
        id: 3,
        category: 'muay-thai',
        date: '2025-05-18',
        image: 'https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?q=80&w=800&auto=format&fit=crop',
        title: { en: "Rodtang's Iron Chin Tested", tr: "Rodtang'ın Çenesi Test Edildi" },
        summary: { en: "ONE Championship main event delivers fireworks.", tr: "ONE Championship ana etkinliği nefes kesti." },
        source: "ONE FC",
        url: "https://www.onefc.com/"
    },
    {
        id: 4,
        category: 'mma',
        date: '2025-05-18',
        image: 'https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?q=80&w=800&auto=format&fit=crop',
        title: { en: "UFC 302: Makhachev Defends", tr: "UFC 302: Makhachev Savundu" },
        summary: { en: "Islam Makhachev proves he is the p4p king.", tr: "Islam Makhachev pound-for-pound kralı olduğunu kanıtladı." },
        source: "UFC",
        url: "https://www.ufc.com/"
    },
    {
        id: 5,
        category: 'boxing',
        date: '2025-05-17',
        image: 'https://images.unsplash.com/photo-1591117207239-78898f4e392b?q=80&w=800&auto=format&fit=crop',
        title: { en: "Canelo's Next Move", tr: "Canelo'nun Sonraki Hamlesi" },
        summary: { en: "Mexican superstar eyes September return.", tr: "Meksikalı süperstar Eylül ayında dönüş planlıyor." },
        source: "ESPN",
        url: "https://www.espn.com/boxing/"
    },
    {
        id: 6,
        category: 'mma',
        date: '2025-05-16',
        image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=800&auto=format&fit=crop',
        title: { en: "McGregor Returns?", tr: "McGregor Dönüyor Mu?" },
        summary: { en: "Rumors swirl about a potential summer blockbuster.", tr: "Yaz aylarında potansiyel bir dev maç hakkında söylentiler dolaşıyor." },
        source: "MMA Junkie",
        url: "https://mmajunkie.usatoday.com/"
    }
];

// State
let currentLang = 'en';
let currentCategory = 'all';

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const langBtns = document.querySelectorAll('.lang-btn');
const translatableElements = document.querySelectorAll('[data-lang]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check local storage for language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
        currentLang = savedLang;
        updateLangButtons();
    }

    renderNews();
    setupEventListeners();
    updateLanguage();
});

function setupEventListeners() {
    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class
            btn.classList.add('active');
            // Update state
            currentCategory = btn.dataset.category;
            renderNews();
        });
    });

    // Language Switch
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem('preferredLanguage', currentLang);
            updateLangButtons();
            updateLanguage();
            renderNews();
        });
    });
}

function updateLangButtons() {
    langBtns.forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateLanguage() {
    translatableElements.forEach(el => {
        if (el.dataset.lang === currentLang) {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });
}

function renderNews() {
    // Filter Data
    const filteredNews = currentCategory === 'all' 
        ? mockNews 
        : mockNews.filter(item => item.category === currentCategory);

    // Render HTML
    if (filteredNews.length === 0) {
        newsGrid.innerHTML = `
            <div class="loader">
                ${currentLang === 'tr' ? 'Haber bulunamadı.' : 'No news found.'}
            </div>`;
        return;
    }

    newsGrid.innerHTML = filteredNews.map(item => createCard(item)).join('');
}

function createCard(item) {
    const title = item.title[currentLang];
    const summary = item.summary[currentLang];
    const date = new Date(item.date).toLocaleDateString(
        currentLang === 'tr' ? 'tr-TR' : 'en-US', 
        { year: 'numeric', month: 'long', day: 'numeric' }
    );
    const readMore = currentLang === 'tr' ? 'DEVAMINI OKU' : 'READ MORE';

    return `
        <article class="news-card">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="card-image-wrapper">
                <img src="${item.image}" alt="${title}" class="card-image" loading="lazy">
                <span class="category-tag">${item.category}</span>
            </a>
            <div class="card-content">
                <div class="card-meta">
                    <span>${date}</span>
                    <span>${item.source}</span>
                </div>
                <h3 class="card-title">
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer">${title}</a>
                </h3>
                <p class="card-excerpt">${summary}</p>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="read-more-btn">
                    ${readMore} <ion-icon name="arrow-forward"></ion-icon>
                </a>
            </div>
        </article>
    `;
}
