// Global State
let userEmail = '';
let isRegistered = false;
let gameStarted = false;
let completedTasks = new Set();
let currentWeek = 1;
let registrationDate = null;
let isLogin = false;

// Tasks Data
const tasks = [
    // Hafta 1 - Temel Kurulum, Araçlar ve İK Süreçleri
    { id: 101, title: 'Oryantasyon Eğitimi Formu ulaştı ve anlaşıldı mı?', category: 'İK', points: 50, week: 1, difficulty: 'Kolay', link: 'https://sestek-my.sharepoint.com/:b:/p/damla_mardin/Edyl-acAN2xEh4Uwdt1Shf4BbMywT2gaF338stSrWyh5JA?e=reCOCE' },
    { id: 102, title: 'Organizasyonel şema anlatıldı mı?', category: 'İK', points: 50, week: 1, difficulty: 'Kolay', link: 'https://sestek.bamboohr.com/' },
    { id: 103, title: 'Yıllık izin & fazla çalışma & esnek çalışma anlatıldı mı?', category: 'İK', points: 50, week: 1, difficulty: 'Kolay', link: 'https://sestek.bamboohr.com/' },
    { id: 104, title: 'Görev tanımları ve kariyer yolu anlatıldı mı?', category: 'İK', points: 75, week: 1, difficulty: 'Orta', link: 'https://sestek-my.sharepoint.com/:f:/p/onedrive/EntjVTlNNGJJlQCacAxpRHEBYPC_gH-dgcLgt-euqkM5eg?e=vNRVnE' },
    { id: 105, title: 'VPN kurulumu tamamlandı mı?', category: 'IT', points: 50, week: 1, difficulty: 'Kolay', link: 'https://sestek-my.sharepoint.com/my?id=%2Fpersonal%2Fberkay%5Fvuran%5Fsestek%5Fcom%2FDocuments%2FAttachments%2FSESTEK%20SSL%20VPN%20KURULUMU%2Epdf&parent=%2Fpersonal%2Fberkay%5Fvuran%5Fsestek%5Fcom%2FDocuments%2FAttachments&ga=1' },
    { id: 106, title: "TFS'te uygun grubun altına eklendi mi?", category: 'IT', points: 50, week: 1, difficulty: 'Kolay', link: 'https://tf-server.sestek.com.tr/tfs/Sestek' },
    { id: 107, title: "Smartsheet'te yetkiler tanımlandı mı?", category: 'IT', points: 75, week: 1, difficulty: 'Orta', link: 'https://app.smartsheet.com/b/home' },
    { id: 108, title: "docs.knovvu'da editör yetkisi verildi mi?", category: 'IT', points: 50, week: 1, difficulty: 'Kolay', link: 'https://portal.document360.io/' },
    { id: 109, title: "Knovvu Feedback'te editör yetkisi verildi mi?", category: 'IT', points: 50, week: 1, difficulty: 'Kolay', link: 'https://feedback.knovvu.com/' },
    { id: 110, title: "Figma'da editör yetkisi verildi mi?", category: 'IT', points: 50, week: 1, difficulty: 'Kolay', link: 'https://www.figma.com/files/team/1349856567558419474/all-projects?fuid=1418209360007880033' },
    { id: 111, title: 'TFS bildirim ayarları aktarıldı mı?', category: 'IT', points: 50, week: 1, difficulty: 'Kolay', link: 'https://tf-server.sestek.com.tr/tfs/Sestek/_usersSettings/notifications' },

    // Hafta 2 - Eğitimler ve Ürün Bilgisi
    { id: 112, title: 'Product 101 videoları sunuldu mu?', category: 'Eğitim', points: 100, week: 2, difficulty: 'Orta', link: 'https://sestek-my.sharepoint.com/:f:/p/onedrive/EoqVbgYEEVZFjI3YLxhpjhgB07FF4VIcbZf_clzFSATA6A?e=LfQ6nE' },
    { id: 113, title: 'Swagger tanıtımı yapıldı mı?', category: 'Eğitim', points: 75, week: 2, difficulty: 'Orta', link: 'https://sestek-my.sharepoint.com/personal/berkay_vuran_sestek_com/_layouts/15/stream.aspx?id=%2Fpersonal%2Fberkay%5Fvuran%5Fsestek%5Fcom%2FDocuments%2FOnboarding%20S%C3%BCreci%2FSwagger%20Kullan%C4%B1m%C4%B1%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&ga=1&referrer=StreamWebApp%2EWeb&referrerScenario=AddressBarCopied%2Eview%2Eb17f2464%2D4abd%2D413c%2D9839%2D0a00686ddfcd' },
    { id: 114, title: 'ABP framework tanıtıldı mı?', category: 'Eğitim', points: 100, week: 2, difficulty: 'Zor', link: 'https://abp.io/' },
    { id: 115, title: 'TFS PBI DoD standartları aktarıldı mı?', category: 'Eğitim', points: 75, week: 2, difficulty: 'Orta' },
    { id: 116, title: 'Daily Report standartları aktarıldı mı?', category: 'Eğitim', points: 75, week: 2, difficulty: 'Orta' },
    { id: 117, title: 'Hardware Sizing aktarıldı mı?', category: 'Eğitim', points: 100, week: 2, difficulty: 'Zor' },
    { id: 118, title: "CRM'de daily report standartları anlatıldı mı?", category: 'Eğitim', points: 100, week: 2, difficulty: 'Zor', link: 'https://sestek.crm4.dynamics.com/' },
    { id: 119, title: "Smartsheet'te ticket sistemi anlatıldı mı?", category: 'Eğitim', points: 75, week: 2, difficulty: 'Orta', link: 'https://app.smartsheet.com/b/home' },
    { id: 120, title: 'DevOps dashboard tanıtıldı mı?', category: 'Eğitim', points: 100, week: 2, difficulty: 'Zor', link: 'https://dashboard.devops.sestek.com.tr/' },
    { id: 121, title: 'Claude hakkında bilgilendirme yapıldı mı?', category: 'Eğitim', points: 75, week: 2, difficulty: 'Orta', link: 'https://claude.ai/' },
    { id: 122, title: 'OneNote dokümanları paylaşıldı mı?', category: 'Eğitim', points: 50, week: 2, difficulty: 'Kolay' }
];

// Achievements Data
const achievements = [
    { name: 'İlk Adım', description: 'İlk görevi tamamla', icon: 'star', checkUnlocked: () => completedTasks.size >= 1, color: 'from-blue-400 to-blue-600' },
    { name: 'Sistem Kurucusu', description: '5 IT görevi tamamla', icon: 'zap', checkUnlocked: () => tasks.filter(t => t.category === 'IT' && completedTasks.has(t.id)).length >= 5, color: 'from-purple-400 to-purple-600' },
    { name: 'İK Süreçleri', description: 'Tüm İK görevlerini tamamla', icon: 'users', checkUnlocked: () => tasks.filter(t => t.category === 'İK').every(t => completedTasks.has(t.id)), color: 'from-green-400 to-green-600' },
    { name: 'Hafta 1 Şampiyonu', description: '1. haftayı %100 tamamla', icon: 'trophy', checkUnlocked: () => tasks.filter(t => t.week === 1).every(t => completedTasks.has(t.id)), color: 'from-yellow-400 to-yellow-600' },
    { name: 'SESTEK Uzmanı', description: 'Tüm görevleri tamamla', icon: 'award', checkUnlocked: () => completedTasks.size === tasks.length, color: 'from-orange-400 to-red-600' },
];

// LocalStorage Helper Functions
function getStorageKey(email) {
    return `sestek_onboarding_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

function loadUserData() {
    const email = localStorage.getItem('sestek_current_user');
    if (email) {
        const userData = JSON.parse(localStorage.getItem(getStorageKey(email)) || '{}');
        if (userData.email) {
            userEmail = email;
            isRegistered = true;
            gameStarted = true;
            completedTasks = new Set(userData.completedTasks || []);
            currentWeek = userData.currentWeek || 1;
            registrationDate = userData.registrationDate || null;
            return true;
        }
    }
    return false;
}

function saveUserData() {
    if (isRegistered && userEmail) {
        const userData = {
            email: userEmail,
            completedTasks: Array.from(completedTasks),
            currentWeek,
            registrationDate,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(getStorageKey(userEmail), JSON.stringify(userData));
        localStorage.setItem('sestek_current_user', userEmail);
    }
}

// Utility Functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getDaysElapsed() {
    if (!registrationDate) return 0;
    const start = new Date(registrationDate);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function getDifficultyColor(difficulty) {
    switch(difficulty) {
        case 'Kolay': return 'text-green-700 bg-green-100 border-green-200';
        case 'Orta': return 'text-orange-700 bg-orange-100 border-orange-200';
        case 'Zor': return 'text-red-700 bg-red-100 border-red-200';
        default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
}

function getCategoryIcon(category) {
    switch(category) {
        case 'Eğitim': return 'book-open';
        case 'İK': return 'users';
        case 'IT': return 'zap';
        default: return 'check-circle';
    }
}

function getCategoryColor(category) {
    switch(category) {
        case 'Eğitim': return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'İK': return 'text-orange-700 bg-orange-50 border-orange-200';
        case 'IT': return 'text-purple-700 bg-purple-50 border-purple-200';
        default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
}

// UI Functions
function handleRegisterLogin() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();
    
    if (!validateEmail(email)) {
        alert('Lütfen geçerli bir email adresi girin');
        return;
    }
    
    userEmail = email;
    const existingUser = localStorage.getItem(getStorageKey(email));
    
    if (existingUser) {
        // Existing user - login
        const userData = JSON.parse(existingUser);
        completedTasks = new Set(userData.completedTasks || []);
        currentWeek = userData.currentWeek || 1;
        registrationDate = userData.registrationDate;
        isLogin = true;
    } else {
        // New user - register
        registrationDate = new Date().toISOString();
        isLogin = false;
    }
    
    isRegistered = true;
    gameStarted = true;
    saveUserData();
    showMainApp();
}

function logout() {
    localStorage.removeItem('sestek_current_user');
    userEmail = '';
    isRegistered = false;
    gameStarted = false;
    completedTasks = new Set();
    currentWeek = 1;
    registrationDate = null;
    showLoginScreen();
}

function toggleTask(taskId) {
    if (completedTasks.has(taskId)) {
        completedTasks.delete(taskId);
    } else {
        completedTasks.add(taskId);
    }
    saveUserData();
    updateUI();
}

function setCurrentWeek(week) {
    currentWeek = week;
    saveUserData();
    updateUI();
}

function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUI();
}

function updateUI() {
    // Calculate stats
    const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
    const earnedPoints = tasks.filter(task => completedTasks.has(task.id)).reduce((sum, task) => sum + task.points, 0);
    const completionRate = Math.round((earnedPoints / totalPoints) * 100);
    
    const weekTasks = tasks.filter(task => task.week === currentWeek);
    const weekPoints = weekTasks.reduce((sum, task) => sum + task.points, 0);
    const weekEarned = weekTasks.filter(task => completedTasks.has(task.id)).reduce((sum, task) => sum + task.points, 0);
    const weekCompletedCount = weekTasks.filter(task => completedTasks.has(task.id)).length;
    const weekProgress = weekTasks.length > 0 ? (weekCompletedCount / weekTasks.length) * 100 : 0;
    
    // Update Header
    document.getElementById('welcomeText').textContent = isLogin ? 'Tekrar hoş geldiniz!' : 'Hoş geldiniz!';
    document.getElementById('userEmailDisplay').textContent = userEmail;
    document.getElementById('daysElapsed').textContent = getDaysElapsed();
    document.getElementById('earnedPoints').textContent = earnedPoints;
    document.getElementById('totalPoints').textContent = totalPoints;
    document.getElementById('completionRate').textContent = completionRate;
    document.getElementById('progressBar').style.width = `${completionRate}%`;
    
    // Update Status Banner
    const statusBanner = document.getElementById('statusBanner');
    if (isLogin) {
        statusBanner.classList.remove('hidden');
        document.getElementById('completedCount').textContent = completedTasks.size;
        document.getElementById('totalTasksCount').textContent = tasks.length;
    } else {
        statusBanner.classList.add('hidden');
    }
    
    // Update Week Buttons
    const week1Btn = document.getElementById('week1Btn');
    const week2Btn = document.getElementById('week2Btn');
    if (currentWeek === 1) {
        week1Btn.className = 'px-6 py-3 rounded-xl font-bold transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105';
        week2Btn.className = 'px-6 py-3 rounded-xl font-bold transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800';
    } else {
        week1Btn.className = 'px-6 py-3 rounded-xl font-bold transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800';
        week2Btn.className = 'px-6 py-3 rounded-xl font-bold transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105';
    }
    
    // Update Week Title
    document.getElementById('currentWeekTitle').textContent = currentWeek;
    document.getElementById('weekEarnedPoints').textContent = weekEarned;
    document.getElementById('weekTotalPoints').textContent = weekPoints;
    
    // Render Tasks
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';
    weekTasks.forEach(task => {
        const isCompleted = completedTasks.has(task.id);
        const taskDiv = document.createElement('div');
        taskDiv.className = `p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 ${
            isCompleted
                ? 'border-green-300 bg-gradient-to-r from-green-50 to-green-100 shadow-lg'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
        }`;
        taskDiv.onclick = () => toggleTask(task.id);
        
        taskDiv.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="p-2 rounded-lg border ${getCategoryColor(task.category)}">
                            <i data-lucide="${getCategoryIcon(task.category)}" class="w-5 h-5"></i>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(task.category)}">
                            ${task.category}
                        </span>
                        <span class="px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(task.difficulty)}">
                            ${task.difficulty}
                        </span>
                    </div>
                    
                    <h3 class="font-semibold text-lg mb-2 transition-all ${
                        isCompleted ? 'text-green-700 line-through' : 'text-gray-800'
                    }">
                        ${task.title}
                    </h3>
                    
                    ${task.link ? `
                        <a 
                            href="${task.link}" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline transition-all"
                            onclick="event.stopPropagation()"
                        >
                            <span>Linke Git</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    ` : ''}
                </div>
                
                <div class="flex items-center gap-4 ml-4">
                    <div class="text-right">
                        <span class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                            +${task.points}
                        </span>
                        <div class="text-xs text-gray-500">puan</div>
                    </div>
                    <div class="w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all ${
                        isCompleted
                            ? 'bg-green-500 border-green-500 shadow-lg'
                            : 'border-gray-300 hover:border-blue-400'
                    }">
                        ${isCompleted ? '<i data-lucide="check-circle" class="w-5 h-5 text-white"></i>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        tasksList.appendChild(taskDiv);
    });
    
    // Update Sidebar
    document.getElementById('sidebarEmail').textContent = userEmail;
    document.getElementById('userStatus').textContent = isLogin ? 'Devam Ediyor' : 'Yeni Başladı';
    document.getElementById('sidebarDays').textContent = getDaysElapsed();
    
    // Update Weekly Stats
    document.getElementById('weekCompletedTasks').textContent = weekCompletedCount;
    document.getElementById('weekTotalTasks').textContent = weekTasks.length;
    document.getElementById('weekEarnedPointsStat').textContent = weekEarned;
    document.getElementById('weekTotalPointsStat').textContent = weekPoints;
    document.getElementById('weekProgressBar').style.width = `${weekProgress}%`;
    
    // Render Achievements
    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';
    achievements.forEach(achievement => {
        const isUnlocked = achievement.checkUnlocked();
        const achievementDiv = document.createElement('div');
        achievementDiv.className = `p-4 rounded-xl transition-all duration-300 ${
            isUnlocked
                ? `bg-gradient-to-r ${achievement.color} text-white shadow-lg transform hover:scale-105`
                : 'bg-gray-50 border border-gray-200 text-gray-500'
        }`;
        
        achievementDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg ${isUnlocked ? 'bg-white/20' : 'bg-gray-200'}">
                    <i data-lucide="${achievement.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <div class="font-bold text-sm ${isUnlocked ? 'text-white' : 'text-gray-500'}">
                        ${achievement.name}
                    </div>
                    <div class="text-xs ${isUnlocked ? 'text-white/80' : 'text-gray-400'}">
                        ${achievement.description}
                    </div>
                </div>
            </div>
        `;
        
        achievementsList.appendChild(achievementDiv);
    });
    
    // Re-initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    // Initialize total counts on login screen
    document.getElementById('totalTaskCount').textContent = tasks.length;
    document.getElementById('totalPointCount').textContent = tasks.reduce((sum, task) => sum + task.points, 0);
    
    // Try to load existing user data
    if (loadUserData()) {
        showMainApp();
    } else {
        showLoginScreen();
    }
    
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Add enter key support for email input
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleRegisterLogin();
            }
        });
        
        // Enable/disable login button based on email validity
        emailInput.addEventListener('input', function() {
            const loginBtn = document.getElementById('loginBtn');
            if (validateEmail(this.value)) {
                loginBtn.disabled = false;
                loginBtn.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
            } else {
                loginBtn.disabled = true;
                loginBtn.classList.add('disabled:opacity-50', 'disabled:cursor-not-allowed');
            }
        });
    }
});