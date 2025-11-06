/**
 * B2C Panel JavaScript
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initB2C();
});

function initB2C() {
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
  setupProfileForm();
  setupCreateAppointmentForm();
  
  // Setup navigation
  setupNavigation();
  
  // Load professions for filter
  loadProfessionFilter();
  
  // Load businesses
  loadBusinesses();
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
  const form = document.getElementById('loginFormElement');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = appointmentSystem.login(email, password);
    
    if (result.success) {
      showDashboard();
    } else {
      alert(result.message);
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById('registerFormElement');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const phone = document.getElementById('registerPhone').value;
    
    // Register user
    const userResult = appointmentSystem.register(email, password, {
      firstName,
      lastName,
      phone
    }, 'b2c');
    
    if (!userResult.success) {
      alert(userResult.message);
      return;
    }
    
    // Auto login
    appointmentSystem.login(email, password);
    showDashboard();
  });
}

function showAuth() {
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  
  const user = appointmentSystem.getCurrentUser();
  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  document.getElementById('sidebarUserInfo').textContent = userName;
  
  loadDashboard();
}

// ==================== Dashboard ====================

function loadDashboard() {
  loadBusinesses();
  loadAppointments();
  loadSubscriptions();
  loadProfile();
}

function loadBusinesses() {
  const businesses = appointmentSystem.getBusinesses();
  const list = document.getElementById('businessesList');
  list.innerHTML = '';
  
  if (businesses.length === 0) {
    list.innerHTML = '<p>Henüz işletme yok</p>';
    return;
  }
  
  businesses.forEach(business => {
    const card = createBusinessCard(business);
    list.appendChild(card);
  });
}

function createBusinessCard(business) {
  const card = document.createElement('div');
  card.className = 'business-card';
  card.setAttribute('data-business-id', business.id);
  card.setAttribute('data-business-name', business.name.toLowerCase());
  card.setAttribute('data-business-profession', business.profession || '');
  
  const plansCount = business.subscriptionPlans ? business.subscriptionPlans.length : 0;
  
  card.innerHTML = `
    <div class="business-card-header">
      <h3>${business.name}</h3>
      <span class="business-profession">${business.profession || 'Belirtilmemiş'}</span>
    </div>
    <div class="business-card-body">
      <p><strong>Adres:</strong> ${business.address || 'Belirtilmemiş'}</p>
      <p><strong>Telefon:</strong> ${business.phone || 'Belirtilmemiş'}</p>
      <p><strong>Abonelik Paketleri:</strong> ${plansCount}</p>
    </div>
    <div class="business-card-actions">
      <button class="btn btn-primary" onclick="showBusinessDetail('${business.id}')">Detaylar</button>
      <button class="btn btn-success" onclick="showCreateAppointmentForBusiness('${business.id}')">Randevu Al</button>
    </div>
  `;
  
  return card;
}

function filterBusinesses() {
  const searchTerm = document.getElementById('businessSearch').value.toLowerCase();
  const professionFilter = document.getElementById('professionFilter').value;
  
  const cards = document.querySelectorAll('.business-card');
  
  cards.forEach(card => {
    const businessName = card.getAttribute('data-business-name');
    const businessProfession = card.getAttribute('data-business-profession');
    
    const matchesSearch = !searchTerm || businessName.includes(searchTerm);
    const matchesProfession = !professionFilter || businessProfession === professionFilter;
    
    if (matchesSearch && matchesProfession) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function showBusinessDetail(businessId) {
  const businesses = appointmentSystem.getBusinesses();
  const business = businesses.find(b => b.id === businessId);
  
  if (!business) return;
  
  const content = document.getElementById('businessDetailContent');
  const plans = business.subscriptionPlans || [];
  
  content.innerHTML = `
    <h2>${business.name}</h2>
    <div class="business-detail-info">
      <p><strong>Meslek:</strong> ${business.profession || 'Belirtilmemiş'}</p>
      <p><strong>Adres:</strong> ${business.address || 'Belirtilmemiş'}</p>
      <p><strong>Telefon:</strong> ${business.phone || 'Belirtilmemiş'}</p>
      <p><strong>E-posta:</strong> ${business.email || 'Belirtilmemiş'}</p>
    </div>
    ${plans.length > 0 ? `
      <div class="business-plans">
        <h3>Abonelik Paketleri</h3>
        ${plans.map(plan => `
          <div class="plan-item">
            <h4>${plan.name} - ${plan.price} ₺</h4>
            <p><strong>Süre:</strong> ${plan.duration} gün</p>
            <ul>
              ${plan.benefits.map(b => `<li>${b}</li>`).join('')}
            </ul>
            <button class="btn btn-primary" onclick="purchaseSubscription('${businessId}', '${plan.id}')">Satın Al</button>
          </div>
        `).join('')}
      </div>
    ` : '<p>Henüz abonelik paketi yok</p>'}
  `;
  
  document.getElementById('businessDetailModal').style.display = 'block';
}

function showCreateAppointmentForBusiness(businessId) {
  document.getElementById('appointmentBusinessId').value = businessId;
  document.getElementById('createAppointmentModal').style.display = 'block';
}

function loadAppointments() {
  const user = appointmentSystem.getCurrentUser();
  const appointments = appointmentSystem.getAppointments();
  const userAppointments = appointments
    .filter(a => a.customerEmail === user.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const list = document.getElementById('appointmentsList');
  list.innerHTML = '';
  
  if (userAppointments.length === 0) {
    list.innerHTML = '<p>Henüz randevunuz yok</p>';
    return;
  }
  
  const businesses = appointmentSystem.getBusinesses();
  
  userAppointments.forEach(appointment => {
    const business = businesses.find(b => b.id === appointment.businessId);
    const card = createAppointmentCard(appointment, business);
    list.appendChild(card);
  });
}

function createAppointmentCard(appointment, business) {
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
      <p><strong>İşletme:</strong> ${business ? business.name : 'Belirtilmemiş'}</p>
      <p><strong>Tarih:</strong> ${date}</p>
      <p><strong>Saat:</strong> ${appointment.time}</p>
    </div>
    <div class="appointment-card-actions">
      ${appointment.status !== 'cancelled' ? `
        <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${appointment.id}')">İptal</button>
      ` : ''}
    </div>
  `;
  
  return card;
}

function loadSubscriptions() {
  const user = appointmentSystem.getCurrentUser();
  const subscriptions = appointmentSystem.getSubscriptions();
  const userSubscriptions = subscriptions
    .filter(s => s.customerEmail === user.email)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  
  const list = document.getElementById('subscriptionsList');
  list.innerHTML = '';
  
  if (userSubscriptions.length === 0) {
    list.innerHTML = '<p>Henüz aboneliğiniz yok</p>';
    return;
  }
  
  const businesses = appointmentSystem.getBusinesses();
  
  userSubscriptions.forEach(subscription => {
    const business = businesses.find(b => b.id === subscription.businessId);
    const card = createSubscriptionCard(subscription, business);
    list.appendChild(card);
  });
}

function createSubscriptionCard(subscription, business) {
  const card = document.createElement('div');
  card.className = 'subscription-card';
  
  const startDate = appointmentSystem.formatDate(subscription.startDate);
  const endDate = appointmentSystem.formatDate(subscription.endDate);
  const isActive = subscription.status === 'active';
  const isExpired = new Date(subscription.endDate) < new Date();
  
  card.innerHTML = `
    <div class="subscription-card-header">
      <h3>${business ? business.name : 'N/A'}</h3>
      <span class="subscription-status ${isActive && !isExpired ? 'status-active' : 'status-expired'}">
        ${isActive && !isExpired ? 'Aktif' : 'Süresi Dolmuş'}
      </span>
    </div>
    <div class="subscription-card-body">
      <p><strong>Paket:</strong> ${subscription.planName || 'Belirtilmemiş'}</p>
      <p><strong>Başlangıç:</strong> ${startDate}</p>
      <p><strong>Bitiş:</strong> ${endDate}</p>
      <p><strong>Fiyat:</strong> ${subscription.price} ₺</p>
    </div>
  `;
  
  return card;
}

function loadProfile() {
  const user = appointmentSystem.getCurrentUser();
  
  document.getElementById('profileFirstName').value = user.firstName || '';
  document.getElementById('profileLastName').value = user.lastName || '';
  document.getElementById('profileEmail').value = user.email || '';
  document.getElementById('profilePhone').value = user.phone || '';
}

function setupProfileForm() {
  const form = document.getElementById('profileForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = appointmentSystem.getCurrentUser();
    const users = appointmentSystem.getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex >= 0) {
      users[userIndex].firstName = document.getElementById('profileFirstName').value;
      users[userIndex].lastName = document.getElementById('profileLastName').value;
      users[userIndex].phone = document.getElementById('profilePhone').value;
      
      localStorage.setItem('appointment_users', JSON.stringify(users));
      
      // Update current user
      appointmentSystem.currentUser = users[userIndex];
      delete appointmentSystem.currentUser.password;
      localStorage.setItem('appointment_currentUser', JSON.stringify(appointmentSystem.currentUser));
      
      alert('Profil güncellendi');
      loadProfile();
    }
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
  
  // Reload data if needed
  if (pageName === 'appointments') {
    loadAppointments();
  } else if (pageName === 'subscriptions') {
    loadSubscriptions();
  } else if (pageName === 'discover') {
    loadBusinesses();
  }
}

// ==================== Modals ====================

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function setupCreateAppointmentForm() {
  const form = document.getElementById('createAppointmentForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = appointmentSystem.getCurrentUser();
    const businessId = document.getElementById('appointmentBusinessId').value;
    
    const appointment = {
      id: appointmentSystem.generateId(),
      businessId: businessId,
      customerId: user.id,
      customerEmail: user.email,
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
    switchPage('appointments');
  });
}

function purchaseSubscription(businessId, planId) {
  const businesses = appointmentSystem.getBusinesses();
  const business = businesses.find(b => b.id === businessId);
  
  if (!business || !business.subscriptionPlans) return;
  
  const plan = business.subscriptionPlans.find(p => p.id === planId);
  if (!plan) return;
  
  const user = appointmentSystem.getCurrentUser();
  
  const subscription = {
    id: appointmentSystem.generateId(),
    businessId: businessId,
    customerId: user.id,
    customerEmail: user.email,
    planId: planId,
    planName: plan.name,
    startDate: Date.now(),
    endDate: Date.now() + (plan.duration * 24 * 60 * 60 * 1000),
    status: 'active',
    price: plan.price
  };
  
  appointmentSystem.saveSubscription(subscription);
  
  alert('Abonelik başarıyla satın alındı!');
  closeModal('businessDetailModal');
  closeModal('purchaseSubscriptionModal');
  loadSubscriptions();
  switchPage('subscriptions');
}

// ==================== Actions ====================

function cancelAppointment(appointmentId) {
  if (!confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return;
  
  const appointments = appointmentSystem.getAppointments();
  const appointment = appointments.find(a => a.id === appointmentId);
  
  if (appointment) {
    appointment.status = 'cancelled';
    appointmentSystem.saveAppointment(appointment);
    loadAppointments();
  }
}

// ==================== Professions ====================

function loadProfessionFilter() {
  const select = document.getElementById('professionFilter');
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

