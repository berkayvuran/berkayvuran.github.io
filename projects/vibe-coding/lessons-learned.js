// Constants & Config
const STORAGE_KEY_LESSONS = 'lessons_learners_data_v2';
const STORAGE_KEY_USER = 'lessons_learners_user_v2';

// Mock Data for Initial Load - EXTENSIVE DUMMY DATA
const INITIAL_LESSONS = [
    {
        id: 101,
        project: "Project Phoenix",
        title: "Database Indexing Strategy Failure",
        category: "Technical",
        tags: ["Database", "Performance", "SQL"],
        whatHappened: "We deployed a new feature that relied on a non-indexed column for filtering, causing the database CPU to spike to 100% during peak hours.",
        impact: "System downtime for 20 minutes, slow response times for 2 hours.",
        actionTaken: "Added the missing index and optimized the query.",
        recommendation: "Review execution plans for all new queries in code review.",
        region: "EU",
        product: "Core Platform",
        stage: "Production",
        deploymentType: "Cloud",
        author: "Sarah Jenkins",
        date: "2023-11-15T10:30:00Z",
        likes: 12,
        recommendationStatus: 'completed',
        assignedTo: "Mike Ross"
    },
    {
        id: 102,
        project: "Project Phoenix",
        title: "Misaligned Stakeholder Expectations",
        category: "People",
        tags: ["Communication", "Stakeholders"],
        whatHappened: "The client expected the reporting module to be real-time, but the architecture was designed for daily batch processing.",
        impact: "Client dissatisfaction and scope creep late in the project.",
        actionTaken: "Negotiated a phased approach to deliver near real-time updates.",
        recommendation: "Define 'real-time' explicitly in the SOW with latency metrics.",
        region: "US",
        product: "Reporting",
        stage: "UAT",
        deploymentType: "SaaS",
        author: "David Kim",
        date: "2023-11-20T14:15:00Z",
        likes: 8,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 103,
        project: "Alpha Mobile App",
        title: "iOS 17 Beta Crash",
        category: "Technical",
        tags: ["Mobile", "iOS", "Beta"],
        whatHappened: "The app crashed immediately on launch on devices running the iOS 17 developer beta due to a deprecated API usage.",
        impact: "Negative reviews from early adopters.",
        actionTaken: "Hotfix released within 24 hours.",
        recommendation: "Include beta OS versions in the QA test matrix.",
        region: "Global",
        product: "Mobile App",
        stage: "Maintenance",
        deploymentType: "App Store",
        author: "Emily Chen",
        date: "2023-10-05T09:00:00Z",
        likes: 25,
        recommendationStatus: 'completed',
        assignedTo: "Tom Hardy"
    },
    {
        id: 104,
        project: "Data Lake Migration",
        title: "Cost Overrun on Cloud Storage",
        category: "Financial",
        tags: ["Cloud", "Cost", "AWS"],
        whatHappened: "We moved archival data to standard S3 storage instead of Glacier, resulting in a 300% higher bill than estimated.",
        impact: "Budget variance for Q4.",
        actionTaken: "Moved data to Glacier and set up lifecycle policies.",
        recommendation: "Implement automated cost alerts and review storage classes before migration.",
        region: "US",
        product: "Data Infrastructure",
        stage: "Migration",
        deploymentType: "Cloud",
        author: "Michael Scott",
        date: "2023-12-01T11:45:00Z",
        likes: 18,
        recommendationStatus: 'completed',
        assignedTo: "Oscar M."
    },
    {
        id: 105,
        project: "Legacy CRM Integration",
        title: "API Rate Limiting Bottleneck",
        category: "Technical",
        tags: ["API", "Integration", "Legacy"],
        whatHappened: "The legacy CRM had a rate limit of 100 requests/minute which we hit during the initial data sync.",
        impact: "Sync process failed and had to be restarted multiple times.",
        actionTaken: "Implemented exponential backoff and throttling.",
        recommendation: "Verify third-party API limits during the design phase.",
        region: "EU",
        product: "CRM Connector",
        stage: "Development",
        deploymentType: "On Prem",
        author: "Jim Halpert",
        date: "2023-11-28T16:20:00Z",
        likes: 5,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 106,
        project: "Project Apollo",
        title: "Time Zone Confusion in Scheduling",
        category: "Process",
        tags: ["Scheduling", "Timezones", "Global"],
        whatHappened: "The scheduling feature saved dates in local user time instead of UTC, causing errors for international teams.",
        impact: "Missed meetings and confusion.",
        actionTaken: "Refactored backend to store everything in UTC.",
        recommendation: "Always store times in UTC and convert to local time only for display.",
        region: "APAC",
        product: "Scheduler",
        stage: "Testing",
        deploymentType: "SaaS",
        author: "Pam Beesly",
        date: "2023-12-10T13:10:00Z",
        likes: 15,
        recommendationStatus: 'completed',
        assignedTo: "Ryan H."
    },
    {
        id: 107,
        project: "SecurePay Gateway",
        title: "Expired SSL Certificate",
        category: "Process",
        tags: ["Security", "Ops", "Certificate"],
        whatHappened: "The production SSL certificate expired on a Sunday, causing browser security warnings.",
        impact: "Loss of customer trust and transactions for 4 hours.",
        actionTaken: "Renewed certificate manually.",
        recommendation: "Set up auto-renewal (Let's Encrypt) or calendar reminders 30 days in advance.",
        region: "Global",
        product: "Payments",
        stage: "Production",
        deploymentType: "Cloud",
        author: "Stanley Hudson",
        date: "2023-09-15T08:00:00Z",
        likes: 42,
        recommendationStatus: 'completed',
        assignedTo: "Kevin M."
    },
    {
        id: 108,
        project: "Project Phoenix",
        title: "Lack of Documentation for Onboarding",
        category: "People",
        tags: ["Onboarding", "Docs", "Team"],
        whatHappened: "New developers took 3 weeks to set up their environment because the README was outdated.",
        impact: "Reduced productivity and frustration.",
        actionTaken: "Updated the README and created a setup script.",
        recommendation: "Make 'Update Documentation' a requirement for closing setup-related tickets.",
        region: "US",
        product: "Core Platform",
        stage: "Development",
        deploymentType: "N/A",
        author: "Toby Flenderson",
        date: "2023-11-05T10:00:00Z",
        likes: 7,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 109,
        project: "Inventory System",
        title: "Barcode Scanner Compatibility",
        category: "Technical",
        tags: ["Hardware", "Integration"],
        whatHappened: "The new web-based system didn't support the legacy serial port scanners used in the warehouse.",
        impact: "Warehouse operations halted for 1 day.",
        actionTaken: "Purchased USB-to-Serial adapters as a temporary fix.",
        recommendation: "Survey existing hardware infrastructure before software upgrades.",
        region: "US",
        product: "Inventory",
        stage: "Rollout",
        deploymentType: "On Prem",
        author: "Darryl Philbin",
        date: "2023-10-22T14:45:00Z",
        likes: 9,
        recommendationStatus: 'assigned',
        assignedTo: "Val B."
    },
    {
        id: 110,
        project: "Marketing Site Redesign",
        title: "Accessibility Compliance Lawsuit Risk",
        category: "People",
        tags: ["Accessibility", "Legal", "WCAG"],
        whatHappened: "The new color scheme failed WCAG contrast ratios, posing a legal risk.",
        impact: "Redesign required late in the process.",
        actionTaken: "Adjusted color palette.",
        recommendation: "Run automated accessibility audits (Lighthouse/Axe) in the CI/CD pipeline.",
        region: "EU",
        product: "Website",
        stage: "Design",
        deploymentType: "Web",
        author: "Oscar Martinez",
        date: "2023-11-30T11:00:00Z",
        likes: 30,
        recommendationStatus: 'completed',
        assignedTo: "Angela M."
    },
    {
        id: 111,
        project: "HR Portal",
        title: "GDPR Data Export Failure",
        category: "Process",
        tags: ["GDPR", "Compliance", "Legal"],
        whatHappened: "We received a data subject access request and couldn't generate the export automatically.",
        impact: "Manual work required to compile data.",
        actionTaken: "Manually compiled data.",
        recommendation: "Build a 'Download My Data' button for users to ensure compliance and reduce manual work.",
        region: "EU",
        product: "HR",
        stage: "Production",
        deploymentType: "SaaS",
        author: "Holly Flax",
        date: "2023-10-10T09:30:00Z",
        likes: 11,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 112,
        project: "Video Streaming Service",
        title: "CDN Cache Invalidation Delay",
        category: "Technical",
        tags: ["CDN", "Caching", "Video"],
        whatHappened: "Users were seeing old versions of videos because the CDN cache wasn't invalidating correctly after updates.",
        impact: "Customer complaints.",
        actionTaken: "Manually purged cache.",
        recommendation: "Implement versioned filenames (hashing) for assets to bust cache automatically.",
        region: "Global",
        product: "Streaming",
        stage: "Production",
        deploymentType: "Cloud",
        author: "Kelly Kapoor",
        date: "2023-12-05T15:00:00Z",
        likes: 4,
        recommendationStatus: 'assigned',
        assignedTo: "Ryan H."
    },
    {
        id: 113,
        project: "Project Phoenix",
        title: "Scope Creep on Search Feature",
        category: "Process",
        tags: ["Scope", "Management"],
        whatHappened: "The search feature grew from a simple keyword search to a full-blown elasticsearch implementation.",
        impact: "Project delayed by 2 weeks.",
        actionTaken: "Descoped advanced filters.",
        recommendation: "Stick to the MVP definition and move 'nice-to-haves' to Phase 2.",
        region: "US",
        product: "Core Platform",
        stage: "Development",
        deploymentType: "Cloud",
        author: "Jan Levinson",
        date: "2023-11-12T10:00:00Z",
        likes: 14,
        recommendationStatus: 'completed',
        assignedTo: "Michael S."
    },
    {
        id: 114,
        project: "Logistics Dashboard",
        title: "Map API License Violation",
        category: "Financial",
        tags: ["License", "Legal", "Maps"],
        whatHappened: "We used a free tier map API for a commercial internal tool, violating terms of service.",
        impact: "Service blocked by provider.",
        actionTaken: "Upgraded to enterprise plan.",
        recommendation: "Review licensing terms for all 3rd party APIs before integration.",
        region: "Global",
        product: "Logistics",
        stage: "Production",
        deploymentType: "Web",
        author: "Andy Bernard",
        date: "2023-09-20T13:30:00Z",
        likes: 6,
        recommendationStatus: 'completed',
        assignedTo: "Dwight S."
    },
    {
        id: 115,
        project: "User Auth Service",
        title: "Password Hashing Algorithm Weakness",
        category: "Technical",
        tags: ["Security", "Auth", "Crypto"],
        whatHappened: "Security audit revealed we were using MD5 for legacy accounts.",
        impact: "High severity vulnerability.",
        actionTaken: "Migrated all hashes to bcrypt on next login.",
        recommendation: "Conduct annual security audits and keep crypto libraries up to date.",
        region: "Global",
        product: "Auth",
        stage: "Audit",
        deploymentType: "Backend",
        author: "Creed Bratton",
        date: "2023-10-31T23:59:00Z",
        likes: 99,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 116,
        project: "E-commerce Checkout",
        title: "Payment Gateway Timeout Handling",
        category: "Technical",
        tags: ["Payments", "UX", "Error Handling"],
        whatHappened: "When the payment gateway timed out, the user saw a blank screen instead of an error message.",
        impact: "Abandoned carts and duplicate charges.",
        actionTaken: "Added timeout handling and user feedback.",
        recommendation: "Implement robust error handling and idempotent requests for payments.",
        region: "EU",
        product: "Store",
        stage: "Production",
        deploymentType: "Web",
        author: "Phyllis Vance",
        date: "2023-11-25T12:00:00Z",
        likes: 10,
        recommendationStatus: 'assigned',
        assignedTo: "Bob V."
    },
    {
        id: 117,
        project: "Mobile Wallet",
        title: "Biometric Auth Bypass",
        category: "Technical",
        tags: ["Security", "Mobile"],
        whatHappened: "Biometric prompt could be dismissed, allowing access to the previous screen.",
        impact: "Security flaw.",
        actionTaken: "Fixed navigation stack.",
        recommendation: "Test security flows specifically for navigation edge cases.",
        region: "APAC",
        product: "Wallet",
        stage: "Testing",
        deploymentType: "Mobile",
        author: "Meredith Palmer",
        date: "2023-12-15T16:00:00Z",
        likes: 22,
        recommendationStatus: 'completed',
        assignedTo: "Jim H."
    },
    {
        id: 118,
        project: "Internal Wiki",
        title: "Search Relevance Poor",
        category: "Process",
        tags: ["UX", "Search", "Content"],
        whatHappened: "Users couldn't find documents because the search engine didn't index PDF contents.",
        impact: "Low adoption of the wiki.",
        actionTaken: "Added OCR and text extraction for attachments.",
        recommendation: "Ensure search functionality covers all content types, including attachments.",
        region: "Internal",
        product: "Wiki",
        stage: "Production",
        deploymentType: "Intranet",
        author: "Erin Hannon",
        date: "2023-11-08T11:00:00Z",
        likes: 3,
        recommendationStatus: 'open',
        assignedTo: null
    },
    {
        id: 119,
        project: "Customer Portal",
        title: "Dark Mode Contrast Issues",
        category: "People",
        tags: ["UI/UX", "Design", "Dark Mode"],
        whatHappened: "Dark mode implementation made some text unreadable on grey backgrounds.",
        impact: "User complaints.",
        actionTaken: "Revised color tokens.",
        recommendation: "Test all UI changes in both light and dark modes.",
        region: "US",
        product: "Portal",
        stage: "UAT",
        deploymentType: "Web",
        author: "Gabe Lewis",
        date: "2023-10-18T14:00:00Z",
        likes: 5,
        recommendationStatus: 'completed',
        assignedTo: "Kelly K."
    },
    {
        id: 120,
        project: "Project Phoenix",
        title: "Meeting Overload",
        category: "People",
        tags: ["Culture", "Productivity"],
        whatHappened: "Developers were spending 4 hours a day in meetings, reducing coding time.",
        impact: "Velocity dropped by 20%.",
        actionTaken: "Implemented 'No Meeting Wednesdays'.",
        recommendation: "Protect maker time by clustering meetings or having dedicated deep work days.",
        region: "Global",
        product: "All",
        stage: "Process",
        deploymentType: "N/A",
        author: "Kevin Malone",
        date: "2023-09-10T09:00:00Z",
        likes: 150,
        recommendationStatus: 'completed',
        assignedTo: "Michael S."
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
const activityList = document.getElementById('activityList'); // New element
const toast = document.getElementById('toast');

// Initialization
function init() {
    loadData();
    renderUser();
    renderStats();
    renderActivityFeed(); // New render call
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
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabId) link.classList.add('active');
    });

    // Refresh specific views
    if (tabId === 'leaderboard') renderLeaderboard();
    if (tabId === 'achievements') renderAchievements();
    if (tabId === 'my-tasks') renderMyTasks();
    if (tabId === 'dashboard') {
        renderStats();
        renderActivityFeed();
        renderFeed();
    }
}

// Rendering
function renderUser() {
    document.getElementById('userNameDisplay').textContent = currentUser.name || 'Guest';
    document.getElementById('userAvatar').textContent = currentUser.avatar || 'G';
    document.getElementById('userLevel').textContent = currentUser.level;
    document.getElementById('currentXP').textContent = currentUser.xp;
    
    const nextLevelXP = (currentUser.level + 1) * 100;
    document.getElementById('nextLevelXP').textContent = nextLevelXP;
    
    const xpInLevel = currentUser.xp % 100;
    document.getElementById('xpFill').style.width = `${xpInLevel}%`;
}

function renderStats() {
    document.getElementById('totalLessons').textContent = lessons.length;
    document.getElementById('totalActions').textContent = lessons.filter(l => l.recommendationStatus === 'completed').length;
    const myLessons = lessons.filter(l => l.author === currentUser.name).length;
    document.getElementById('userContributions').textContent = myLessons;
}

// NEW: Activity Feed Rendering
function renderActivityFeed() {
    if (!activityList) return;
    
    activityList.innerHTML = '';
    
    // Filter for completed tasks not by current user (to show community activity)
    // Or just all completed tasks. Let's show all completed tasks.
    const completedTasks = lessons
        .filter(l => l.recommendationStatus === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first
        .slice(0, 5); // Show top 5

    if (completedTasks.length === 0) {
        activityList.innerHTML = '<p style="color: #9CA3AF; text-align: center;">No recent activity.</p>';
        return;
    }

    completedTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        // Initials for avatar
        const assignedName = task.assignedTo || 'Unknown';
        const initials = assignedName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        
        item.innerHTML = `
            <div class="activity-avatar">${initials}</div>
            <div class="activity-content">
                <div>
                    <span style="font-weight: 600; color: #111827;">${assignedName}</span> 
                    completed a task for 
                    <span style="font-weight: 500; color: #4F46E5;">${task.project}</span>
                </div>
                <div style="color: #4B5563; font-size: 0.85rem; margin-top: 0.2rem;">
                    <i class="fa-solid fa-check-circle" style="color: #10B981;"></i> ${task.recommendation}
                </div>
            </div>
            <div class="activity-time">
                ${new Date(task.date).toLocaleDateString()}
            </div>
        `;
        activityList.appendChild(item);
    });
}

// Modal Logic
window.openDetailsModal = function(id) {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    document.getElementById('detailTitle').textContent = lesson.title || lesson.project;
    document.getElementById('detailBadge').textContent = lesson.category.toUpperCase();
    
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
    } else if (lesson.recommendationStatus === 'completed') {
        taskActionHtml = `<span class="task-status completed">Completed by ${lesson.assignedTo}</span>`;
    }
    document.getElementById('detailTaskAction').innerHTML = taskActionHtml;

    document.getElementById('lessonDetailsModal').classList.remove('hidden');
};

window.closeDetailsModal = function() {
    document.getElementById('lessonDetailsModal').classList.add('hidden');
};

document.getElementById('lessonDetailsModal').addEventListener('click', (e) => {
    if (e.target.id === 'lessonDetailsModal') {
        closeDetailsModal();
    }
});

function renderFeed(filter = 'all') {
    lessonsContainer.innerHTML = '';
    
    let filteredLessons = lessons.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filter !== 'all') {
        filteredLessons = filteredLessons.filter(l => l.category.toLowerCase() === filter.toLowerCase());
    }

    filteredLessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.onclick = (e) => {
            if(e.target.closest('.reaction-btn') || e.target.closest('.task-btn')) return;
            openDetailsModal(lesson.id);
        };
        
        const tagsHtml = lesson.tags.map(tag => `<span class="card-badge">#${tag.trim()}</span>`).join(' ');
        
        let catColor = 'gray';
        if(lesson.category.toLowerCase() === 'technical') catColor = 'blue';
        if(lesson.category.toLowerCase() === 'process') catColor = 'green';
        if(lesson.category.toLowerCase() === 'people') catColor = 'purple';
        if(lesson.category.toLowerCase() === 'financial') catColor = 'yellow';

        const metaBadges = `
            <span class="meta-badge"><i class="fa-solid fa-globe"></i> ${lesson.region || 'Global'}</span>
            <span class="meta-badge"><i class="fa-solid fa-box"></i> ${lesson.product || 'General'}</span>
            <span class="meta-badge"><i class="fa-solid fa-code-branch"></i> ${lesson.deploymentType || 'N/A'}</span>
        `;

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
    const header = list.firstElementChild;
    list.innerHTML = '';
    list.appendChild(header);

    const users = [
        { name: "Sarah J.", level: 7, points: 740 },
        { name: "Mike T.", level: 5, points: 520 },
        { name: currentUser.name || "You", level: currentUser.level, points: currentUser.xp },
        { name: "Oscar M.", level: 4, points: 410 },
        { name: "Kelly K.", level: 3, points: 350 },
        { name: "Jim H.", level: 3, points: 310 }
    ];

    users.sort((a, b) => b.points - a.points);

    users.forEach((u, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item top-${index+1}`;
        item.innerHTML = `
            <div class="rank-circle">${index + 1}</div>
            <div style="font-weight: 500">${u.name} ${u.name === (currentUser.name || 'You') ? '(You)' : ''}</div>
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
        const isUnlocked = currentUser.badges && currentUser.badges.includes(ach.id);
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
        renderLeaderboard(); // Update leaderboard with new name
        
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
        author: currentUser.name || "Anonymous",
        date: new Date().toISOString(),
        likes: 0,
        recommendationStatus: 'open',
        assignedTo: null
    };

    lessons.unshift(newLesson);
    saveLessons();

    addXP(50);
    checkAchievements();
    
    showToast("Lesson Learned!", "Your insight has been added to the library. +50 XP");
    
    e.target.reset();
    switchTab('dashboard');
}

function addXP(amount) {
    currentUser.xp = (currentUser.xp || 0) + amount;
    const newLevel = Math.floor(currentUser.xp / 100) + 1;
    if (newLevel > currentUser.level) {
        currentUser.level = newLevel;
        showToast("Level Up!", `Congratulations! You reached Level ${newLevel}!`);
    }
    saveUser();
    renderUser();
}

function checkAchievements() {
    if (!currentUser.badges) currentUser.badges = [];
    let newBadge = false;
    
    if (!currentUser.badges.includes('first-step') && lessons.some(l => l.author === currentUser.name)) {
        currentUser.badges.push('first-step');
        newBadge = 'First Step';
    }

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
    document.getElementById('welcomeForm').addEventListener('submit', handleWelcomeSubmit);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderFeed(e.target.dataset.filter);
        });
    });

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

window.likeLesson = function(id) {
    const lesson = lessons.find(l => l.id === id);
    if (lesson) {
        lesson.likes = (lesson.likes || 0) + 1;
        saveLessons();
        renderFeed();
    }
};

window.assignTask = function(id) {
    const lesson = lessons.find(l => l.id === id);
    if (lesson && lesson.recommendationStatus === 'open') {
        lesson.recommendationStatus = 'assigned';
        lesson.assignedTo = currentUser.name || "Guest";
        saveLessons();
        renderFeed();
        // Update stats
        renderStats();
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
        renderStats();
        renderActivityFeed(); // Update activity feed immediately
    }
};

// Start
init();
