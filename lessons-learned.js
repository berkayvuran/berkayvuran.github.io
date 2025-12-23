// Constants & Config
const STORAGE_KEY_LESSONS = 'sestek_pmo_lessons';
const STORAGE_KEY_USER = 'sestek_pmo_user';

// Mock Data for Initial Load
const INITIAL_LESSONS = [
    {
        id: 1,
        project: "Call Center AI V2",
        category: "technical",
        tags: ["deployment", "api", "timeout"],
        whatHappened: "During the production deployment, the API gateway timed out due to high load from legacy clients.",
        impact: "Service downtime of 15 minutes. 500+ failed requests.",
        actionTaken: "Rolled back to V1 immediately. Increased timeout settings and added retry logic.",
        recommendation: "Implement gradual canary deployment for major API changes. Stress test with legacy client simulation.",
        author: "Berkay V.",
        date: new Date().toISOString(),
        likes: 5
    },
    {
        id: 2,
        project: "Banking Bot Migration",
        category: "process",
        tags: ["stakeholder", "scope-creep"],
        whatHappened: "Client added 3 new critical requirements 1 week before UAT.",
        impact: "Project delayed by 2 weeks. Team burnout risk increased.",
        actionTaken: "Held emergency steering committee. Negotiated Phase 2 for new features.",
        recommendation: "Freeze scope strictly 3 weeks before UAT. Get sign-off on requirements document earlier.",
        author: "Selin A.",
        date: new Date(Date.now() - 86400000).toISOString(),
        likes: 12
    }
];

const INITIAL_USER = {
    name: "Berkay V.",
    avatar: "BV",
    xp: 120,
    level: 1,
    badges: ["first-step"]
};

const ACHIEVEMENTS = [
    { id: "first-step", title: "First Step", desc: "Submit your first lesson", icon: "fa-baby-carriage" },
    { id: "process-guru", title: "Process Guru", desc: "Submit 3 Process related lessons", icon: "fa-cogs" },
    { id: "bug-hunter", title: "Bug Hunter", desc: "Submit 3 Technical lessons", icon: "fa-bug" },
    { id: "influencer", title: "Influencer", desc: "Get 10 likes on a lesson", icon: "fa-star" }
];

// State
let lessons = [];
let currentUser = {};

// DOM Elements
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-links li');
const lessonForm = document.getElementById('lessonForm');
const lessonsContainer = document.getElementById('lessonsContainer');
const toast = document.getElementById('toast');

// Initialization
function init() {
    loadData();
    renderUser();
    renderStats();
    renderFeed();
    setupEventListeners();
    checkAchievements();
}

// Data Management
function loadData() {
    const storedLessons = localStorage.getItem(STORAGE_KEY_LESSONS);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);

    if (storedLessons) {
        lessons = JSON.parse(storedLessons);
    } else {
        lessons = [...INITIAL_LESSONS];
        saveLessons();
    }

    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    } else {
        currentUser = {...INITIAL_USER};
        saveUser();
    }
}

function saveLessons() {
    localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(lessons));
}

function saveUser() {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
}

// Navigation
function switchTab(tabId) {
    views.forEach(view => {
        view.classList.remove('active');
        if (view.id === tabId) view.classList.add('active');
        if (view.id === tabId && !view.classList.contains('hidden')) {
             // ensure hidden class is handled if I used it in CSS separate from active
             // My CSS uses .view { display: none } .view.active { display: block }
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabId) link.classList.add('active');
    });

    // Refresh specific views
    if (tabId === 'leaderboard') renderLeaderboard();
    if (tabId === 'achievements') renderAchievements();
}

// Rendering
function renderUser() {
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.avatar;
    document.getElementById('userLevel').textContent = currentUser.level;
    document.getElementById('currentXP').textContent = currentUser.xp;
    
    const nextLevelXP = (currentUser.level + 1) * 100;
    document.getElementById('nextLevelXP').textContent = nextLevelXP;
    
    const progress = (currentUser.xp % 100); 
    // Simplified Leveling: Level 1 = 0-99, Level 2 = 100-199
    // So progress in current level is just xp % 100 usually, but let's make it robust
    // Actually simpler: 
    // Level 1 starts at 0. Next level at 100.
    // Level 2 starts at 100. Next level at 200.
    // Progress % is (xp - (level-1)*100) / 100 * 100
    
    // Let's stick to simple 100 XP per level for demo
    const xpInLevel = currentUser.xp % 100;
    document.getElementById('xpFill').style.width = `${xpInLevel}%`;
}

function renderStats() {
    document.getElementById('totalLessons').textContent = lessons.length;
    
    // Count actions (just assuming every lesson has an action)
    document.getElementById('totalActions').textContent = lessons.length;

    // User contributions
    const myLessons = lessons.filter(l => l.author === currentUser.name).length;
    document.getElementById('userContributions').textContent = myLessons;
}

function renderFeed(filter = 'all') {
    lessonsContainer.innerHTML = '';
    
    let filteredLessons = lessons.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filter !== 'all') {
        filteredLessons = filteredLessons.filter(l => l.category === filter);
    }

    filteredLessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        
        // Tags HTML
        const tagsHtml = lesson.tags.map(tag => `<span class="card-badge">#${tag.trim()}</span>`).join(' ');
        
        // Category Badge Color
        let catColor = 'gray';
        if(lesson.category === 'technical') catColor = 'blue';
        if(lesson.category === 'process') catColor = 'green';
        if(lesson.category === 'people') catColor = 'purple';

        card.innerHTML = `
            <div class="card-header">
                <div class="project-name">${lesson.project}</div>
                <div class="card-badge" style="background-color: var(--${catColor}-100)">${lesson.category.toUpperCase()}</div>
            </div>
            
            <div class="card-body">
                <div>${tagsHtml}</div>
                
                <h4><i class="fa-solid fa-triangle-exclamation"></i> What Happened</h4>
                <p>${lesson.whatHappened}</p>
                
                <h4><i class="fa-solid fa-chart-line"></i> Impact</h4>
                <p>${lesson.impact}</p>

                <h4><i class="fa-solid fa-check"></i> Action Taken</h4>
                <p>${lesson.actionTaken}</p>

                <div style="background: #F0FDF4; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; border-left: 3px solid #10B981;">
                    <h4 style="margin-top:0; color: #047857"><i class="fa-solid fa-lightbulb"></i> Future Recommendation</h4>
                    <p style="margin-bottom:0; color: #065F46">${lesson.recommendation}</p>
                </div>
            </div>

            <div class="card-footer">
                <div class="author">
                    <i class="fa-solid fa-user-circle"></i> ${lesson.author} • ${new Date(lesson.date).toLocaleDateString()}
                </div>
                <div class="reactions">
                    <div class="reaction-btn" onclick="likeLesson(${lesson.id})">
                        <i class="fa-regular fa-thumbs-up"></i> ${lesson.likes || 0}
                    </div>
                </div>
            </div>
        `;
        lessonsContainer.appendChild(card);
    });
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    // Clear list but keep header
    const header = list.firstElementChild;
    list.innerHTML = '';
    list.appendChild(header);

    // Mock other users mixed with current user
    const users = [
        { name: "Ahmet Y.", level: 5, points: 540 },
        { name: "Selin A.", level: 4, points: 420 },
        { name: currentUser.name, level: currentUser.level, points: currentUser.xp },
        { name: "Mehmet K.", level: 2, points: 210 },
        { name: "Ayşe B.", level: 1, points: 90 }
    ];

    users.sort((a, b) => b.points - a.points);

    users.forEach((u, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item top-${index+1}`;
        item.innerHTML = `
            <div class="rank-circle">${index + 1}</div>
            <div style="font-weight: 500">${u.name} ${u.name === currentUser.name ? '(You)' : ''}</div>
            <div>Lvl ${u.level}</div>
            <div>${u.points} XP</div>
        `;
        list.appendChild(item);
    });
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = '';

    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = currentUser.badges.includes(ach.id);
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
        card.innerHTML = `
            <div class="achievement-icon">
                <i class="fa-solid ${ach.icon}"></i>
            </div>
            <h4>${ach.title}</h4>
            <p>${ach.desc}</p>
            ${isUnlocked ? '<div style="color:var(--secondary-color); font-size:0.8rem; margin-top:0.5rem"><i class="fa-solid fa-check"></i> Unlocked</div>' : ''}
        `;
        grid.appendChild(card);
    });
}

// Logic & Actions
function handleLessonSubmit(e) {
    e.preventDefault();

    const newLesson = {
        id: Date.now(),
        project: document.getElementById('projectName').value,
        category: document.getElementById('category').value,
        tags: document.getElementById('tags').value.split(',').filter(t => t.trim()),
        whatHappened: document.getElementById('whatHappened').value,
        impact: document.getElementById('impact').value,
        actionTaken: document.getElementById('actionTaken').value,
        recommendation: document.getElementById('recommendation').value,
        author: currentUser.name,
        date: new Date().toISOString(),
        likes: 0
    };

    lessons.unshift(newLesson);
    saveLessons();

    // Reward User
    addXP(50);
    checkAchievements();
    
    showToast("Lesson Learned!", "Your insight has been added to the library. +50 XP");
    
    e.target.reset();
    switchTab('dashboard');
    renderStats();
    renderFeed();
}

function addXP(amount) {
    currentUser.xp += amount;
    // Simple level up logic
    const newLevel = Math.floor(currentUser.xp / 100) + 1; // 0-99 = Lvl 1
    if (newLevel > currentUser.level) {
        currentUser.level = newLevel;
        showToast("Level Up!", `Congratulations! You reached Level ${newLevel}!`);
    }
    saveUser();
    renderUser();
}

function checkAchievements() {
    let newBadge = false;
    
    // Check "First Step"
    if (!currentUser.badges.includes('first-step') && lessons.some(l => l.author === currentUser.name)) {
        currentUser.badges.push('first-step');
        newBadge = 'First Step';
    }

    // Check "Process Guru"
    const processCount = lessons.filter(l => l.author === currentUser.name && l.category === 'process').length;
    if (!currentUser.badges.includes('process-guru') && processCount >= 3) {
        currentUser.badges.push('process-guru');
        newBadge = 'Process Guru';
    }

    if (newBadge) {
        showToast("Achievement Unlocked!", `You earned the "${newBadge}" badge.`);
        saveUser();
    }
}

function showToast(title, message) {
    const t = document.getElementById('toast');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    
    t.classList.remove('hidden');
    // Force reflow for animation
    void t.offsetWidth; 
    t.classList.add('show');

    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.classList.add('hidden'), 400);
    }, 3000);
}

function setupEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            switchTab(link.dataset.tab);
        });
    });

    lessonForm.addEventListener('submit', handleLessonSubmit);

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderFeed(e.target.dataset.filter);
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.lesson-card');
        
        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            if (text.includes(term)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Like functionality (mock)
window.likeLesson = function(id) {
    const lesson = lessons.find(l => l.id === id);
    if (lesson) {
        lesson.likes = (lesson.likes || 0) + 1;
        saveLessons();
        renderFeed(); // Re-render to show new count
        
        // Check "Influencer" achievement for the author of this post (if real backend)
        // Here we just check for current user if they are the author
        // But let's keep it simple
    }
};

// Start
init();
