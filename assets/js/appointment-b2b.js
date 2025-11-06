/**
 * B2B Panel JavaScript
 */

// Initialize on page load
function initB2B() {
  // Ensure appointmentSystem is loaded
  if (typeof appointmentSystem === 'undefined') {
    setTimeout(initB2B, 50);
    return;
  }
  
  // Check authentication
  if (appointmentSystem.isAuthenticated()) {
    showDashboard();
  } else {
    showAuth();
  }
  
  // Setup auth tabs
  setupAuthTabs();
  
  // Setup forms
  setupLoginForm();
  setupRegisterForm();
  setupSettingsForm();
  setupCreateAppointmentForm();
  setupCreatePlanForm();
  
  // Setup navigation
  setupNavigation();
  
  // Load professions
  loadProfessions();
}

// Wait for DOM and scripts to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initB2B, 100);
  });
} else {
  setTimeout(initB2B, 100);
}

// ==================== Authentication ====================

function setupAuthTabs() {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    }
  });

  // Update forms
  document.getElementById('loginForm').classList.toggle('active', tabName === 'login');
  document.getElementById('registerForm').classList.toggle('active', tabName === 'register');
}

function setupLoginForm() {
  // Form already has inline onsubmit handler
  // This function is kept for compatibility but form uses handleLogin directly
}

function setupRegisterForm() {
  // Form already has inline onsubmit handler
  // This function is kept for compatibility but form uses handleRegister directly
}

function showAuth() {
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('headerActions').style.display = 'none';
}

function showDashboard() {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  
  const user = appointmentSystem.getCurrentUser();
  const businessName = user.businessName || user.email;
  document.getElementById('sidebarUserInfo').textContent = businessName;
  
  loadDashboard();
}

// ==================== Dashboard ====================

function loadDashboard() {
  loadOverview();
  loadAppointments();
  loadSubscriptionPlans();
  loadSettings();
}

function loadOverview() {
  const user = appointmentSystem.getCurrentUser();
  const business = appointmentSystem.getBusinessByUserId(user.id);
  
  if (!business) return;
  
  const appointments = appointmentSystem.getAppointments();
  const subscriptions = appointmentSystem.getSubscriptions();
  
  const businessAppointments = appointments.filter(a => a.businessId === business.id);
  const activeAppointments = businessAppointments.filter(a => 
    a.status === 'pending' || a.status === 'confirmed'
  );
  
  const businessSubscriptions = subscriptions.filter(s => s.businessId === business.id);
  const activeSubscriptions = businessSubscriptions.filter(s => s.status === 'active');
  
  // Calculate monthly revenue
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlySubscriptions = activeSubscriptions.filter(s => {
    const subDate = new Date(s.startDate);
    return subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear;
  });
  const monthlyRevenue = monthlySubscriptions.reduce((sum, s) => sum + s.price, 0);
  
  // Count unique customers
  const customerIds = new Set();
  businessAppointments.forEach(a => customerIds.add(a.customerId));
  
  document.getElementById('statActiveAppointments').textContent = activeAppointments.length;
  document.getElementById('statActiveSubscriptions').textContent = activeSubscriptions.length;
  document.getElementById('statMonthlyRevenue').textContent = monthlyRevenue.toFixed(2) + ' ₺';
  document.getElementById('statTotalCustomers').textContent = customerIds.size;
}

function loadAppointments() {
  const user = appointmentSystem.getCurrentUser();
  const business = appointmentSystem.getBusinessByUserId(user.id);
  
  if (!business) return;
  
  const appointments = appointmentSystem.getAppointments();
  const businessAppointments = appointments
    .filter(a => a.businessId === business.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const list = document.getElementById('appointmentsList');
  list.innerHTML = '';
  
  if (businessAppointments.length === 0) {
    list.innerHTML = '<p>Henüz randevu yok</p>';
    return;
  }
  
  businessAppointments.forEach(appointment => {
    const card = createAppointmentCard(appointment);
    list.appendChild(card);
  });
}

function createAppointmentCard(appointment) {
  const card = document.createElement('div');
  card.className = 'appointment-card';
  
  const date = appointmentSystem.formatDate(appointment.date);
  const statusClass = appointment.status === 'confirmed' ? 'status-confirmed' : 
                     appointment.status === 'cancelled' ? 'status-cancelled' : 'status-pending';
  const statusText = appointment.status === 'confirmed' ? 'Onaylandı' : 
                     appointment.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede';
  
  card.innerHTML = `
    <div class="appointment-card-header">
      <h3>${appointment.service}</h3>
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
    <div class="appointment-card-body">
      <p><strong>Tarih:</strong> ${date}</p>
      <p><strong>Saat:</strong> ${appointment.time}</p>
      <p><strong>Müşteri:</strong> ${appointment.customerEmail || 'Belirtilmemiş'}</p>
    </div>
    <div class="appointment-card-actions">
      ${appointment.status === 'pending' ? `
        <button class="btn btn-sm btn-success" onclick="confirmAppointment('${appointment.id}')">Onayla</button>
      ` : ''}
      ${appointment.status !== 'cancelled' ? `
        <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${appointment.id}')">İptal</button>
      ` : ''}
    </div>
  `;
  
  return card;
}

function loadSubscriptionPlans() {
  const user = appointmentSystem.getCurrentUser();
  const business = appointmentSystem.getBusinessByUserId(user.id);
  
  if (!business) return;
  
  const list = document.getElementById('subscriptionsList');
  list.innerHTML = '';
  
  if (!business.subscriptionPlans || business.subscriptionPlans.length === 0) {
    list.innerHTML = '<p>Henüz abonelik paketi yok</p>';
    return;
  }
  
  business.subscriptionPlans.forEach(plan => {
    const card = createPlanCard(plan, business);
    list.appendChild(card);
  });
}

function createPlanCard(plan, business) {
  const card = document.createElement('div');
  card.className = 'plan-card';
  
  const benefits = plan.benefits ? plan.benefits.split('\n').filter(b => b.trim()) : [];
  
  card.innerHTML = `
    <div class="plan-card-header">
      <h3>${plan.name}</h3>
      <span class="plan-price">${plan.price} ₺</span>
    </div>
    <div class="plan-card-body">
      <p><strong>Süre:</strong> ${plan.duration} gün</p>
      <div class="plan-benefits">
        <strong>Avantajlar:</strong>
        <ul>
          ${benefits.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="plan-card-actions">
      <button class="btn btn-sm btn-danger" onclick="deletePlan('${plan.id}', '${business.id}')">Sil</button>
    </div>
  `;
  
  return card;
}

function loadSettings() {
  const user = appointmentSystem.getCurrentUser();
  const business = appointmentSystem.getBusinessByUserId(user.id);
  
  if (!business) return;
  
  document.getElementById('settingsBusinessName').value = business.name || '';
  document.getElementById('settingsPhone').value = business.phone || '';
  document.getElementById('settingsAddress').value = business.address || '';
  
  // Load profession select
  const professionSelect = document.getElementById('settingsProfession');
  loadProfessionsIntoSelect(professionSelect);
  if (business.profession) {
    professionSelect.value = business.profession;
  }
}

function setupSettingsForm() {
  const form = document.getElementById('settingsForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = appointmentSystem.getCurrentUser();
    const business = appointmentSystem.getBusinessByUserId(user.id);
    
    if (!business) return;
    
    business.name = document.getElementById('settingsBusinessName').value;
    business.profession = document.getElementById('settingsProfession').value;
    business.phone = document.getElementById('settingsPhone').value;
    business.address = document.getElementById('settingsAddress').value;
    
    appointmentSystem.saveBusiness(business);
    
    alert('Ayarlar başarıyla kaydedildi!');
    loadDashboard();
  });
}

// ==================== Navigation ====================

function setupNavigation() {
  const navButtons = document.querySelectorAll('.sidebar-nav-btn, .nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      switchPage(page);
    });
  });
}

function switchPage(pageName) {
  // Update sidebar nav buttons
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-page') === pageName) {
      btn.classList.add('active');
    }
  });
  
  // Update top nav buttons (if exists)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-page') === pageName) {
      btn.classList.add('active');
    }
  });

  // Update pages
  document.querySelectorAll('.dashboard-page').forEach(page => {
    page.classList.remove('active');
  });
  
  document.getElementById(pageName + 'Page').classList.add('active');
}

// ==================== Modals ====================

function showCreateAppointmentModal() {
  document.getElementById('createAppointmentModal').style.display = 'block';
}

function showCreatePlanModal() {
  document.getElementById('createPlanModal').style.display = 'block';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function setupCreateAppointmentForm() {
  const form = document.getElementById('createAppointmentForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = appointmentSystem.getCurrentUser();
    const business = appointmentSystem.getBusinessByUserId(user.id);
    
    if (!business) return;
    
    const appointment = {
      id: appointmentSystem.generateId(),
      businessId: business.id,
      customerId: appointmentSystem.generateId(), // Temporary
      customerEmail: document.getElementById('appointmentCustomerEmail').value,
      date: document.getElementById('appointmentDate').value,
      time: document.getElementById('appointmentTime').value,
      service: document.getElementById('appointmentService').value,
      status: 'pending',
      notes: ''
    };
    
    appointmentSystem.saveAppointment(appointment);
    closeModal('createAppointmentModal');
    form.reset();
    loadAppointments();
    loadOverview();
  });
}

function setupCreatePlanForm() {
  const form = document.getElementById('createPlanForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = appointmentSystem.getCurrentUser();
    const business = appointmentSystem.getBusinessByUserId(user.id);
    
    if (!business) {
      alert('İşletme bulunamadı');
      return;
    }
    
    if (!business.subscriptionPlans) {
      business.subscriptionPlans = [];
    }
    
    const plan = {
      id: appointmentSystem.generateId(),
      name: document.getElementById('planName').value,
      price: parseFloat(document.getElementById('planPrice').value),
      duration: parseInt(document.getElementById('planDuration').value),
      benefits: document.getElementById('planBenefits').value.split('\n').filter(b => b.trim())
    };
    
    business.subscriptionPlans.push(plan);
    appointmentSystem.saveBusiness(business);
    
    closeModal('createPlanModal');
    form.reset();
    loadSubscriptionPlans();
  });
}

// ==================== Actions ====================

function confirmAppointment(appointmentId) {
  const appointments = appointmentSystem.getAppointments();
  const appointment = appointments.find(a => a.id === appointmentId);
  
  if (appointment) {
    appointment.status = 'confirmed';
    appointmentSystem.saveAppointment(appointment);
    loadAppointments();
    loadOverview();
  }
}

function cancelAppointment(appointmentId) {
  if (!confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return;
  
  const appointments = appointmentSystem.getAppointments();
  const appointment = appointments.find(a => a.id === appointmentId);
  
  if (appointment) {
    appointment.status = 'cancelled';
    appointmentSystem.saveAppointment(appointment);
    loadAppointments();
    loadOverview();
  }
}

function deletePlan(planId, businessId) {
  if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return;
  
  const business = appointmentSystem.getBusinesses().find(b => b.id === businessId);
  
  if (business && business.subscriptionPlans) {
    business.subscriptionPlans = business.subscriptionPlans.filter(p => p.id !== planId);
    appointmentSystem.saveBusiness(business);
    loadSubscriptionPlans();
  }
}

// ==================== Professions ====================

function loadProfessions() {
  const registerSelect = document.getElementById('registerProfession');
  loadProfessionsIntoSelect(registerSelect);
}

function loadProfessionsIntoSelect(select) {
  const professions = appointmentSystem.getProfessions();
  const lang = appointmentSystem.currentLanguage;
  const profList = professions[lang] || professions['tr'];
  
  // Clear existing options (except first one)
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  profList.forEach(prof => {
    const option = document.createElement('option');
    option.value = prof;
    option.textContent = prof;
    select.appendChild(option);
  });
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

