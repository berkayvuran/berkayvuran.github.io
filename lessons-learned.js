// Constants & Config
const STORAGE_KEY_LESSONS = 'sestek_pmo_lessons';
const STORAGE_KEY_USER = 'sestek_pmo_user';

// Mock Data for Initial Load - REPLACED WITH REAL DATA
const INITIAL_LESSONS = [
    {
        id: 1,
        project: "PHP - Knovvu VA",
        title: "HTML tags not supported on mobile",
        category: "Technical",
        tags: ["Mobile", "HTML", "Markdown"],
        whatHappened: "Some prompts in the design include certain HTML tags which are different in format between web channel and mobile application. Mobile app has its own markdown structure for the formatting changes. This is not an automated process, however we must consider future projects with Sestek mobile app package and we should be able to support same format by default, without any additional developments or efforts.",
        impact: "We need to inform product team to take necessary action to implement related feature to VA for possible future mobile channel implementations.",
        actionTaken: "Informed Product Team",
        recommendation: "Implement unified formatting support for mobile and web channels in VA.",
        region: "USA",
        product: "Virtual Agent",
        stage: "Deployment",
        deploymentType: "Cloud",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open', // open, assigned, completed
        assignedTo: null
    },
    {
        id: 2,
        project: "PHP - Knovvu VA",
        title: "Must get approval from customer before OpenAI document training",
        category: "Process",
        tags: ["OpenAI", "Security", "Approval"],
        whatHappened: "We uploaded initial version of the document provided by customer before getting approval from them.",
        impact: "Potential security/privacy violation risk.",
        actionTaken: "We have to make sure that the customer acknowledges any document/link provided by customer is going to become public once uploaded to open AI.",
        recommendation: "Get official approval from customer before uploading documents to OpenAI.",
        region: "USA",
        product: "Virtual Agent",
        stage: "Deployment",
        deploymentType: "Cloud",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 3,
        project: "PHP - Knovvu VA",
        title: "Mobile version release to Appstore/Google Play",
        category: "Process",
        tags: ["Mobile", "Store", "Release"],
        whatHappened: "We wanted to make upgrades on the mobile sdk, however it was not compatible with customer's mobile release schedule",
        impact: "Delays in feature availability.",
        actionTaken: "Coordinated with customer.",
        recommendation: "Sync with customer for mobile app upgrades and releases schedules beforehand.",
        region: "USA",
        product: "Virtual Agent",
        stage: "Deployment",
        deploymentType: "Cloud",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 4,
        project: "PHP - Knovvu VA",
        title: "Test environment access should be mandatory for web services",
        category: "Technical",
        tags: ["Access", "Network", "Test Env"],
        whatHappened: "We faced difficulties trying to implement web service integrations as the customer didn't allow us to directly send requests to their test environment from our local network (outside of US)",
        impact: "Implementation delay and difficulty in testing.",
        actionTaken: "Workaround used.",
        recommendation: "Mandate relaxed access for test environments from customers in SoW.",
        region: "USA",
        product: "Virtual Agent",
        stage: "Deployment",
        deploymentType: "Cloud",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 5,
        project: "Axa Knovvu Analytics",
        title: "RTG enablement süreçlerinde yaşanan aksaklıklar",
        category: "Process",
        tags: ["RTG", "Roles", "Internal Communication"],
        whatHappened: "On prem CA projesinde RTG ürününün kurulum sonrası konfigürasyonları ve enable edilmesi sürecinde internal ekipler arası görev tanımlarının netleştirilemediği tespit edilmiştir.",
        impact: "Kurulum sürecinde gecikme ve iletişim kopukluğu.",
        actionTaken: "Tenant oluşturma ve port bilgileri paylaşıldı.",
        recommendation: "RTG süreci için App Support ve DevOps arasındaki görev dağılımı netleştirilmeli ve PM planına optional task olarak eklenmeli.",
        region: "TR",
        product: "Analytics",
        stage: "Deployment",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 6,
        project: "Corendon Airlines",
        title: "Corendon VA - Customer Dissatisfaction",
        category: "People",
        tags: ["Support", "Expectation", "Operational"],
        whatHappened: "Customer stated that our working system was not suitable for them. In the mentioned projects, external service purchases are not carried out on a project basis but operationally.",
        impact: "Customer dissatisfaction regarding support model.",
        actionTaken: "Feedback received.",
        recommendation: "Add operational support process to our range of services in addition to project-oriented progress.",
        region: "TR",
        product: "Virtual Agent",
        stage: "Deployment",
        deploymentType: "Cloud",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 7,
        project: "Fibabanka - VA",
        title: "Fibabanka Deployment Issues (Deployment Type Changing)",
        category: "Process",
        tags: ["Deployment", "SoW", "Bank"],
        whatHappened: "In By Sestek projects, Linux management is done by the customer and our disk partition methods are not accepted. The deployment type for bank projects has been determined as By Customer.",
        impact: "Deployment method had to be changed mid-project.",
        actionTaken: "We changed the deployment method and returned to the by customer method.",
        recommendation: "For bank projects, default to 'By Customer' deployment or clarify strict security requirements in SoW explicitly.",
        region: "TR",
        product: "Virtual Agent",
        stage: "Deployment",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 8,
        project: "Hepsiburada Knovvu VA - Faz 2",
        title: "Deadline Clarification and Sprint Planning Adjustment",
        category: "Process",
        tags: ["Planning", "Agile", "Communication"],
        whatHappened: "Go-live deadline was initially communicated as Dec 23, but actual target was Dec 17. A blocker bug fix had to be prioritized urgently.",
        impact: "Escalation to Product Owner and sprint replanning.",
        actionTaken: "Priorities realigned.",
        recommendation: "Clear and written communication of critical deadlines is essential. Early clarification of key dates.",
        region: "TR",
        product: "Virtual Agent",
        stage: "Deployment",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 9,
        project: "MyQM - Assist Digital SR&TTS POC",
        title: "Software requirements for MRCP SR/TTS",
        category: "Technical",
        tags: ["Docs", "OS", "Windows"],
        whatHappened: "In docs.knovvu, MRCP requirements state that OS of the servers should be Windows 11. This is incorrect, it should be Windows Server 2019 or higher.",
        impact: "Misinformation in documentation.",
        actionTaken: "Feedback was given to product team.",
        recommendation: "Update docs.knovvu to specify Windows Server versions instead of Desktop OS.",
        region: "EU",
        product: "Core",
        stage: "POC",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 10,
        project: "Fiba Sigorta&Emeklilik",
        title: "VA / On-prem Call-center and Positioning of Hummingbird",
        category: "Technical",
        tags: ["Architecture", "On-Prem", "Hybrid"],
        whatHappened: "Hummingbird installation had been made as cloud on SESTEK side for an on-prem customer, which caused architectural issues.",
        impact: "SIP messaging and access problems.",
        actionTaken: "Warned by Software Architect.",
        recommendation: "Proceed with on-premise hummingbird installation for customers which have on-prem call center.",
        region: "TR",
        product: "Analytics",
        stage: "Deployment",
        deploymentType: "Cloud",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 11,
        project: "Hepsiburada Knovvu VA - Faz 2",
        title: "HepsiJet VA – 401 Error Due to Expired Token",
        category: "Technical",
        tags: ["WhatsApp", "Token", "Meta"],
        whatHappened: "During testing, 401 Unauthorized errors occurred because the Meta token valid for 60 days had expired.",
        impact: "Service interruption in test environment.",
        actionTaken: "Token renewed.",
        recommendation: "Implement automated token renewal or monitoring for Meta tokens. Review long-term token docs.",
        region: "TR",
        product: "Virtual Agent",
        stage: "Deployment",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 12,
        project: "THY Knovvu CA POC",
        title: "DB credentials",
        category: "Technical",
        tags: ["DB", "Security", "Access"],
        whatHappened: "We requested separate users for all DB's, however Core DB's (sr & lms) should be accessed with the same user.",
        impact: "Confusion during setup.",
        actionTaken: " Clarified requirement.",
        recommendation: "Specify in docs that Core DBs should be accessed with the same user.",
        region: "TR",
        product: "Analytics",
        stage: "POC",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 13,
        project: "THY Knovvu CA POC",
        title: "Deployment risks and customer requirements",
        category: "Process",
        tags: ["Restrictions", "POC", "Notes"],
        whatHappened: "THY had many restrictions and requirements that affected the deployment process for the POC.",
        impact: "Project didn't move forward to live.",
        actionTaken: "Internal review sessions held.",
        recommendation: "Review internal notes thoroughly before re-initiating deployment discussions with THY.",
        region: "TR",
        product: "Analytics",
        stage: "POC",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 14,
        project: "Burgan Bank",
        title: "Call Recording - Separated Calls",
        category: "Technical",
        tags: ["Genesys", "Configuration", "RTP"],
        whatHappened: "Calls were recorded as multiple separated calls because rtp.multichantimeout parameter in Genesys was 60000.",
        impact: "Fragmented recordings.",
        actionTaken: "Customer changed value to zero.",
        recommendation: "Ensure rtp.multichantimeout is set to zero in Genesys integrations.",
        region: "TR",
        product: "Analytics",
        stage: "Deployment",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 15,
        project: "Axa Knovvu Analytics",
        title: "Email Sending Failure After Version Upgrade",
        category: "Technical",
        tags: ["Upgrade", "Library", "Breaking Change"],
        whatHappened: "Email sending stopped working after upgrade due to a mail kit library change and new certificate requirement.",
        impact: "Delays in project schedule.",
        actionTaken: "Root cause identified.",
        recommendation: "Include library changes in release notes. Add regression tests for email sending. Proactively communicate breaking changes.",
        region: "TR",
        product: "Analytics",
        stage: "Deployment",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 16,
        project: "Halkbank CA",
        title: "Halkbank CA - DB Issue (SR)",
        category: "Technical",
        tags: ["MSSQL", "Compatibility", "Version"],
        whatHappened: "Customer prepared MSSQL 2022, but SR had issues during deployment despite docs stating 2016+ is supported.",
        impact: "Deployment failure.",
        actionTaken: "Software team working on a patch.",
        recommendation: "Verify successful results with all deployment methods (DB versions) to prevent breaking changes.",
        region: "TR",
        product: "Analytics",
        stage: "Deployment",
        deploymentType: "On Prem",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 17,
        project: "AvidXchange Knovvu CA",
        title: "Internal go-live information",
        category: "Process",
        tags: ["Communication", "DevOps", "Cloud"],
        whatHappened: "Devops team was not aware that actual prod calls were coming to the system for Cloud CA project.",
        impact: "Technical problem faced due to lack of awareness.",
        actionTaken: "New task added to project plan.",
        recommendation: "PM must inform internal stakeholders (DevOps) once production traffic milestone is reached.",
        region: "USA",
        product: "Analytics",
        stage: "Deployment",
        deploymentType: "Cloud",
        author: "System",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    }
];

const INITIAL_USER_TEMPLATE = {
    name: "",
    avatar: "",
    xp: 0,
    level: 1,
    badges: []
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
        // Show Welcome Modal
        document.getElementById('welcomeModal').classList.remove('hidden');
        currentUser = {...INITIAL_USER_TEMPLATE}; // Placeholder
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
    if (tabId === 'my-tasks') renderMyTasks();
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

// Modal Logic
window.openDetailsModal = function(id) {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    document.getElementById('detailTitle').textContent = lesson.title || lesson.project;
    document.getElementById('detailBadge').textContent = lesson.category.toUpperCase();
    
    // Set Badge Color
    let catColor = 'gray';
    if(lesson.category.toLowerCase() === 'technical') catColor = 'blue';
    if(lesson.category.toLowerCase() === 'process') catColor = 'green';
    if(lesson.category.toLowerCase() === 'people') catColor = 'purple';
    if(lesson.category.toLowerCase() === 'financial') catColor = 'yellow';
    
    document.getElementById('detailBadge').style.backgroundColor = `var(--${catColor}-100)`;
    document.getElementById('detailBadge').style.color = `var(--${catColor})`;

    document.getElementById('detailMeta').innerHTML = `
        <span class="meta-badge"><i class="fa-solid fa-globe"></i> ${lesson.region || 'Global'}</span>
        <span class="meta-badge"><i class="fa-solid fa-box"></i> ${lesson.product || 'General'}</span>
        <span class="meta-badge"><i class="fa-solid fa-code-branch"></i> ${lesson.deploymentType || 'N/A'}</span>
        <span class="meta-badge"><i class="fa-solid fa-user"></i> ${lesson.author}</span>
        <span class="meta-badge"><i class="fa-regular fa-calendar"></i> ${new Date(lesson.date).toLocaleDateString()}</span>
    `;

    document.getElementById('detailWhatHappened').textContent = lesson.whatHappened;
    document.getElementById('detailImpact').textContent = lesson.impact;
    document.getElementById('detailActionTaken').textContent = lesson.actionTaken;
    document.getElementById('detailRecommendation').textContent = lesson.recommendation;

    // Task Action Button
    let taskActionHtml = '';
    if (lesson.recommendationStatus === 'open') {
        taskActionHtml = `<button class="task-btn" onclick="assignTask(${lesson.id}); closeDetailsModal();"><i class="fa-solid fa-hand-point-up"></i> I'll take this task</button>`;
    } else if (lesson.recommendationStatus === 'assigned' && lesson.assignedTo === currentUser.name) {
        taskActionHtml = `<span class="task-status assigned">Assigned to You</span>`;
    }
    document.getElementById('detailTaskAction').innerHTML = taskActionHtml;

    document.getElementById('lessonDetailsModal').classList.remove('hidden');
};

window.closeDetailsModal = function() {
    document.getElementById('lessonDetailsModal').classList.add('hidden');
};

// Close modal when clicking outside
document.getElementById('lessonDetailsModal').addEventListener('click', (e) => {
    if (e.target.id === 'lessonDetailsModal') {
        closeDetailsModal();
    }
});

// Update renderFeed to add click event
function renderFeed(filter = 'all') {
    lessonsContainer.innerHTML = '';
    
    let filteredLessons = lessons.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filter !== 'all') {
        filteredLessons = filteredLessons.filter(l => l.category === filter);
    }

    filteredLessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.onclick = (e) => {
            // Prevent opening modal if clicking specific interactive elements
            if(e.target.closest('.reaction-btn') || e.target.closest('.task-btn')) return;
            openDetailsModal(lesson.id);
        };
        
        // Tags HTML
        const tagsHtml = lesson.tags.map(tag => `<span class="card-badge">#${tag.trim()}</span>`).join(' ');
        
        // Category Badge Color
        let catColor = 'gray';
        if(lesson.category.toLowerCase() === 'technical') catColor = 'blue';
        if(lesson.category.toLowerCase() === 'process') catColor = 'green';
        if(lesson.category.toLowerCase() === 'people') catColor = 'purple';
        if(lesson.category.toLowerCase() === 'financial') catColor = 'yellow';

        // Meta badges
        const metaBadges = `
            <span class="meta-badge"><i class="fa-solid fa-globe"></i> ${lesson.region || 'Global'}</span>
            <span class="meta-badge"><i class="fa-solid fa-box"></i> ${lesson.product || 'General'}</span>
            <span class="meta-badge"><i class="fa-solid fa-code-branch"></i> ${lesson.deploymentType || 'N/A'}</span>
        `;

        // Task Button Logic
        let taskButton = '';
        if (lesson.recommendationStatus === 'open') {
            taskButton = `<button class="task-btn" onclick="assignTask(${lesson.id})"><i class="fa-solid fa-hand-point-up"></i> I'll do this</button>`;
        } else if (lesson.recommendationStatus === 'assigned') {
            if (lesson.assignedTo === currentUser.name) {
                taskButton = `<span class="task-status assigned"><i class="fa-solid fa-user-clock"></i> Assigned to You</span>`;
            } else {
                taskButton = `<span class="task-status locked"><i class="fa-solid fa-lock"></i> Taken by ${lesson.assignedTo}</span>`;
            }
        } else if (lesson.recommendationStatus === 'completed') {
            taskButton = `<span class="task-status completed"><i class="fa-solid fa-check-double"></i> Completed by ${lesson.assignedTo}</span>`;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="project-name">${lesson.project}</div>
                <div class="card-badge" style="background-color: var(--${catColor}-100); color: var(--${catColor});">${lesson.category.toUpperCase()}</div>
            </div>
            
            <div class="card-meta-row">
                ${metaBadges}
            </div>

            <div class="card-body">
                <h3 style="font-size: 1rem; margin-top: 0.5rem;">${lesson.title || 'Insight'}</h3>
                <div style="margin-bottom: 0.5rem;">${tagsHtml}</div>
                
                <p style="color: var(--text-muted); font-size: 0.9rem;">${lesson.whatHappened.substring(0, 100)}...</p>

                <div class="recommendation-box">
                    <div>
                        <h4 style="margin-top:0; color: #047857"><i class="fa-solid fa-lightbulb"></i> Feature Suggestion</h4>
                        <p style="margin-bottom:0; color: #065F46">${lesson.recommendation}</p>
                    </div>
                    <div style="margin-top: 1rem; text-align: right;">
                        ${taskButton}
                    </div>
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

function renderMyTasks() {
    const container = document.getElementById('myTasksContainer');
    container.innerHTML = '';
    
    const myTasks = lessons.filter(l => l.assignedTo === currentUser.name && l.recommendationStatus !== 'completed');
    
    if (myTasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No active tasks. Go to Dashboard and assign recommendations to yourself!</div>';
        return;
    }

    myTasks.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card task-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="project-name">${lesson.project}</div>
                <span class="card-badge">IN PROGRESS</span>
            </div>
            <div class="card-body">
                 <h3>${lesson.title}</h3>
                 <div class="recommendation-box">
                    <p><strong>Goal:</strong> ${lesson.recommendation}</p>
                 </div>
                 <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
                    <button class="submit-btn" style="width: auto; padding: 0.5rem 1rem; background: var(--secondary-color);" onclick="completeTask(${lesson.id})">
                        <i class="fa-solid fa-check"></i> Mark as Done (+100 XP)
                    </button>
                 </div>
            </div>
        `;
        container.appendChild(card);
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
function handleWelcomeSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('welcomeNameInput').value.trim();
    
    if (nameInput) {
        currentUser = {
            ...INITIAL_USER_TEMPLATE,
            name: nameInput,
            avatar: getInitials(nameInput),
            xp: 0,
            level: 1,
            badges: []
        };
        saveUser();
        renderUser();
        
        // Hide Modal
        document.getElementById('welcomeModal').classList.add('hidden');
        showToast("Welcome!", `Great to have you here, ${nameInput.split(' ')[0]}!`);
    }
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

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
    
    // Welcome Form
    document.getElementById('welcomeForm').addEventListener('submit', handleWelcomeSubmit);

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

// Task Management
window.assignTask = function(id) {
    const lesson = lessons.find(l => l.id === id);
    if (lesson && lesson.recommendationStatus === 'open') {
        lesson.recommendationStatus = 'assigned';
        lesson.assignedTo = currentUser.name;
        saveLessons();
        renderFeed();
        showToast("Task Assigned", "You have taken ownership of this suggestion.");
    }
};

window.completeTask = function(id) {
    const lesson = lessons.find(l => l.id === id);
    if (lesson && lesson.assignedTo === currentUser.name) {
        lesson.recommendationStatus = 'completed';
        saveLessons();
        addXP(100);
        showToast("Task Completed!", "Great job implementing the suggestion. +100 XP");
        renderMyTasks();
        renderStats(); // Update stats
    }
};

// Start
init();
