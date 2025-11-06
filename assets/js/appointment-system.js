/**
 * Appointment Subscription System - Core Module
 * Handles authentication, data management, and localization
 */

class AppointmentSystem {
  constructor() {
    this.currentUser = null;
    this.currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';
    this.init();
  }

  init() {
    this.loadLanguage();
    this.checkAuth();
    this.setupEventListeners();
  }

  // ==================== Authentication ====================

  register(email, password, userData, type = 'b2c') {
    const users = this.getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return { success: false, message: this.t('auth.emailExists') };
    }

    const newUser = {
      id: this.generateId(),
      email,
      password: this.hashPassword(password),
      type,
      language: this.currentLanguage,
      ...userData,
      createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem('appointment_users', JSON.stringify(users));
    
    return { success: true, user: newUser };
  }

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: this.t('auth.userNotFound') };
    }

    if (user.password !== this.hashPassword(password)) {
      return { success: false, message: this.t('auth.wrongPassword') };
    }

    this.currentUser = { ...user };
    delete this.currentUser.password;
    
    localStorage.setItem('appointment_currentUser', JSON.stringify(this.currentUser));
    localStorage.setItem('appointment_token', this.generateToken());
    
    return { success: true, user: this.currentUser };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('appointment_currentUser');
    localStorage.removeItem('appointment_token');
    window.location.reload();
  }

  checkAuth() {
    const token = localStorage.getItem('appointment_token');
    const userStr = localStorage.getItem('appointment_currentUser');
    
    if (token && userStr) {
      this.currentUser = JSON.parse(userStr);
      return true;
    }
    
    return false;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  // ==================== Data Management ====================

  getUsers() {
    const users = localStorage.getItem('appointment_users');
    return users ? JSON.parse(users) : [];
  }

  getBusinesses() {
    const businesses = localStorage.getItem('appointment_businesses');
    return businesses ? JSON.parse(businesses) : [];
  }

  saveBusiness(business) {
    const businesses = this.getBusinesses();
    const existingIndex = businesses.findIndex(b => b.id === business.id);
    
    if (existingIndex >= 0) {
      businesses[existingIndex] = business;
    } else {
      businesses.push(business);
    }
    
    localStorage.setItem('appointment_businesses', JSON.stringify(businesses));
    return business;
  }

  getBusinessByUserId(userId) {
    const businesses = this.getBusinesses();
    return businesses.find(b => b.userId === userId);
  }

  getSubscriptions() {
    const subscriptions = localStorage.getItem('appointment_subscriptions');
    return subscriptions ? JSON.parse(subscriptions) : [];
  }

  saveSubscription(subscription) {
    const subscriptions = this.getSubscriptions();
    const existingIndex = subscriptions.findIndex(s => s.id === subscription.id);
    
    if (existingIndex >= 0) {
      subscriptions[existingIndex] = subscription;
    } else {
      subscriptions.push(subscription);
    }
    
    localStorage.setItem('appointment_subscriptions', JSON.stringify(subscriptions));
    return subscription;
  }

  getAppointments() {
    const appointments = localStorage.getItem('appointment_appointments');
    return appointments ? JSON.parse(appointments) : [];
  }

  saveAppointment(appointment) {
    const appointments = this.getAppointments();
    const existingIndex = appointments.findIndex(a => a.id === appointment.id);
    
    if (existingIndex >= 0) {
      appointments[existingIndex] = appointment;
    } else {
      appointments.push(appointment);
    }
    
    localStorage.setItem('appointment_appointments', JSON.stringify(appointments));
    return appointment;
  }

  // ==================== Professions ====================

  getProfessions() {
    return {
      tr: [
        'Oto Tamircisi',
        'Dövmeci',
        'Berber',
        'Kuaför',
        'Masaj Salonu',
        'Estetik Merkezi',
        'Diş Hekimi',
        'Fizyoterapist',
        'Diğer'
      ],
      en: [
        'Auto Mechanic',
        'Tattoo Artist',
        'Barber',
        'Hairdresser',
        'Massage Salon',
        'Aesthetic Center',
        'Dentist',
        'Physiotherapist',
        'Other'
      ]
    };
  }

  // ==================== Utilities ====================

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateToken() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  hashPassword(password) {
    // Simple hash for demo purposes (not secure for production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString(this.currentLanguage === 'tr' ? 'tr-TR' : 'en-US');
  }

  formatTime(time) {
    return time;
  }

  // ==================== Localization ====================

  translations = {
    tr: {
      auth: {
        login: 'Giriş Yap',
        register: 'Kayıt Ol',
        logout: 'Çıkış Yap',
        email: 'E-posta',
        password: 'Parola',
        confirmPassword: 'Parola Tekrar',
        forgotPassword: 'Parolamı Unuttum',
        emailExists: 'Bu e-posta adresi zaten kullanılıyor',
        userNotFound: 'Kullanıcı bulunamadı',
        wrongPassword: 'Parola yanlış',
        loginSuccess: 'Giriş başarılı',
        registerSuccess: 'Kayıt başarılı'
      },
      business: {
        name: 'İşletme Adı',
        profession: 'Meslek',
        address: 'Adres',
        phone: 'Telefon',
        workingHours: 'Çalışma Saatleri',
        services: 'Hizmetler',
        subscriptionPlans: 'Abonelik Paketleri'
      },
      customer: {
        firstName: 'Ad',
        lastName: 'Soyad',
        phone: 'Telefon',
        email: 'E-posta'
      },
      appointment: {
        create: 'Randevu Oluştur',
        view: 'Randevularım',
        cancel: 'İptal Et',
        confirm: 'Onayla',
        date: 'Tarih',
        time: 'Saat',
        service: 'Hizmet',
        status: 'Durum'
      },
      subscription: {
        plans: 'Abonelik Paketleri',
        active: 'Aktif Abonelikler',
        purchase: 'Abonelik Satın Al',
        cancel: 'İptal Et',
        renew: 'Yenile'
      },
      common: {
        save: 'Kaydet',
        cancel: 'İptal',
        delete: 'Sil',
        edit: 'Düzenle',
        search: 'Ara',
        filter: 'Filtrele',
        dashboard: 'Dashboard',
        profile: 'Profil',
        settings: 'Ayarlar'
      }
    },
    en: {
      auth: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        forgotPassword: 'Forgot Password',
        emailExists: 'This email address is already in use',
        userNotFound: 'User not found',
        wrongPassword: 'Wrong password',
        loginSuccess: 'Login successful',
        registerSuccess: 'Registration successful'
      },
      business: {
        name: 'Business Name',
        profession: 'Profession',
        address: 'Address',
        phone: 'Phone',
        workingHours: 'Working Hours',
        services: 'Services',
        subscriptionPlans: 'Subscription Plans'
      },
      customer: {
        firstName: 'First Name',
        lastName: 'Last Name',
        phone: 'Phone',
        email: 'Email'
      },
      appointment: {
        create: 'Create Appointment',
        view: 'My Appointments',
        cancel: 'Cancel',
        confirm: 'Confirm',
        date: 'Date',
        time: 'Time',
        service: 'Service',
        status: 'Status'
      },
      subscription: {
        plans: 'Subscription Plans',
        active: 'Active Subscriptions',
        purchase: 'Purchase Subscription',
        cancel: 'Cancel',
        renew: 'Renew'
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
        filter: 'Filter',
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings'
      }
    }
  };

  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    this.loadLanguage();
  }

  loadLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      this.currentLanguage = savedLang;
    }
    
    // Update all elements with data-lang attribute
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.updateLanguageElements());
    } else {
      this.updateLanguageElements();
    }
  }

  updateLanguageElements() {
    document.querySelectorAll('[data-lang]').forEach(el => {
      const elementLang = el.getAttribute('data-lang');
      if (elementLang === this.currentLanguage) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
    
    // Update language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-lang') === this.currentLanguage) {
        btn.classList.add('active');
      }
    });
  }

  // ==================== Event Listeners ====================

  setupEventListeners() {
    // Language switcher - wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupLanguageSwitcher());
    } else {
      this.setupLanguageSwitcher();
    }
  }

  setupLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = btn.getAttribute('data-lang');
        this.setLanguage(lang);
        window.location.reload();
      });
      
      // Set active state
      if (btn.getAttribute('data-lang') === this.currentLanguage) {
        btn.classList.add('active');
      }
    });
  }
}

// Initialize global instance
const appointmentSystem = new AppointmentSystem();

// Initialize dummy data on first load
function initDummyData() {
  // Check if dummy data already exists
  if (localStorage.getItem('appointment_dummy_data_loaded')) {
    return;
  }

  const professions = appointmentSystem.getProfessions();
  
  // Create dummy businesses
  const dummyBusinesses = [
    {
      id: 'biz1',
      userId: 'user_biz1',
      name: 'Elite Berber Salonu',
      profession: professions.tr[2], // Berber
      phone: '+90 212 555 0101',
      email: 'elite@berber.com',
      address: 'Kadıköy, İstanbul',
      workingHours: {
        monday: { start: '09:00', end: '19:00' },
        tuesday: { start: '09:00', end: '19:00' },
        wednesday: { start: '09:00', end: '19:00' },
        thursday: { start: '09:00', end: '19:00' },
        friday: { start: '09:00', end: '19:00' },
        saturday: { start: '09:00', end: '20:00' },
        sunday: { start: '10:00', end: '18:00' }
      },
      services: [
        { name: 'Saç Kesimi', price: 150, duration: 30 },
        { name: 'Sakal Tıraşı', price: 100, duration: 20 },
        { name: 'Saç + Sakal', price: 200, duration: 45 }
      ],
      subscriptionPlans: [
        {
          id: 'plan1',
          name: 'Aylık Paket',
          price: 500,
          duration: 30,
          benefits: ['Ayda 4 randevu hakkı', '10% indirim', 'Öncelikli randevu']
        },
        {
          id: 'plan2',
          name: '3 Aylık Paket',
          price: 1200,
          duration: 90,
          benefits: ['Ayda 4 randevu hakkı', '15% indirim', 'Öncelikli randevu', 'Ücretsiz bakım']
        }
      ]
    },
    {
      id: 'biz2',
      userId: 'user_biz2',
      name: 'AutoFix Oto Tamiri',
      profession: professions.tr[0], // Oto Tamircisi
      phone: '+90 212 555 0202',
      email: 'info@autofix.com',
      address: 'Şişli, İstanbul',
      workingHours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '17:00' },
        sunday: { start: '10:00', end: '16:00' }
      },
      services: [
        { name: 'Periyodik Bakım', price: 800, duration: 120 },
        { name: 'Fren Tamiri', price: 500, duration: 60 },
        { name: 'Lastik Değişimi', price: 300, duration: 30 }
      ],
      subscriptionPlans: [
        {
          id: 'plan3',
          name: 'Yıllık Bakım Paketi',
          price: 5000,
          duration: 365,
          benefits: ['Yılda 4 periyodik bakım', '20% indirim', 'Acil servis önceliği', 'Ücretsiz muayene']
        }
      ]
    },
    {
      id: 'biz3',
      userId: 'user_biz3',
      name: 'Tattoo Studio Art',
      profession: professions.tr[1], // Dövmeci
      phone: '+90 212 555 0303',
      email: 'hello@tattooart.com',
      address: 'Beşiktaş, İstanbul',
      workingHours: {
        monday: { start: '12:00', end: '20:00' },
        tuesday: { start: '12:00', end: '20:00' },
        wednesday: { start: '12:00', end: '20:00' },
        thursday: { start: '12:00', end: '20:00' },
        friday: { start: '12:00', end: '22:00' },
        saturday: { start: '12:00', end: '22:00' },
        sunday: { start: '14:00', end: '20:00' }
      },
      services: [
        { name: 'Küçük Dövme', price: 500, duration: 60 },
        { name: 'Orta Dövme', price: 1500, duration: 180 },
        { name: 'Büyük Dövme', price: 3000, duration: 360 }
      ],
      subscriptionPlans: [
        {
          id: 'plan4',
          name: 'Dövme Sevgilisi Paketi',
          price: 2000,
          duration: 180,
          benefits: ['3 dövme hakkı', '15% indirim', 'Tasarım danışmanlığı', 'Bakım ürünleri']
        }
      ]
    },
    {
      id: 'biz4',
      userId: 'user_biz4',
      name: 'Güzellik Merkezi',
      profession: professions.tr[5], // Estetik Merkezi
      phone: '+90 212 555 0404',
      email: 'info@guzellik.com',
      address: 'Nişantaşı, İstanbul',
      workingHours: {
        monday: { start: '10:00', end: '20:00' },
        tuesday: { start: '10:00', end: '20:00' },
        wednesday: { start: '10:00', end: '20:00' },
        thursday: { start: '10:00', end: '20:00' },
        friday: { start: '10:00', end: '20:00' },
        saturday: { start: '10:00', end: '20:00' },
        sunday: { start: '12:00', end: '18:00' }
      },
      services: [
        { name: 'Cilt Bakımı', price: 800, duration: 90 },
        { name: 'Lazer Epilasyon', price: 1200, duration: 60 },
        { name: 'Botoks', price: 2000, duration: 30 }
      ],
      subscriptionPlans: [
        {
          id: 'plan5',
          name: 'Güzellik Paketi',
          price: 3000,
          duration: 90,
          benefits: ['Ayda 2 cilt bakımı', '10% indirim', 'Ücretsiz danışmanlık', 'Özel fiyatlar']
        }
      ]
    }
  ];

  // Save dummy businesses
  localStorage.setItem('appointment_businesses', JSON.stringify(dummyBusinesses));

  // Create dummy users for businesses
  const dummyUsers = [
    {
      id: 'user_biz1',
      email: 'elite@berber.com',
      password: appointmentSystem.hashPassword('123456'),
      type: 'b2b',
      language: 'tr',
      businessName: 'Elite Berber Salonu',
      profession: professions.tr[2],
      phone: '+90 212 555 0101',
      address: 'Kadıköy, İstanbul',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
    },
    {
      id: 'user_biz2',
      email: 'info@autofix.com',
      password: appointmentSystem.hashPassword('123456'),
      type: 'b2b',
      language: 'tr',
      businessName: 'AutoFix Oto Tamiri',
      profession: professions.tr[0],
      phone: '+90 212 555 0202',
      address: 'Şişli, İstanbul',
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000
    },
    {
      id: 'user_biz3',
      email: 'hello@tattooart.com',
      password: appointmentSystem.hashPassword('123456'),
      type: 'b2b',
      language: 'tr',
      businessName: 'Tattoo Studio Art',
      profession: professions.tr[1],
      phone: '+90 212 555 0303',
      address: 'Beşiktaş, İstanbul',
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000
    },
    {
      id: 'user_biz4',
      email: 'info@guzellik.com',
      password: appointmentSystem.hashPassword('123456'),
      type: 'b2b',
      language: 'tr',
      businessName: 'Güzellik Merkezi',
      profession: professions.tr[5],
      phone: '+90 212 555 0404',
      address: 'Nişantaşı, İstanbul',
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000
    },
    {
      id: 'user_cust1',
      email: 'musteri@example.com',
      password: appointmentSystem.hashPassword('123456'),
      type: 'b2c',
      language: 'tr',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phone: '+90 555 123 4567',
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
    },
    {
      id: 'user_cust2',
      email: 'customer@example.com',
      password: appointmentSystem.hashPassword('123456'),
      type: 'b2c',
      language: 'tr',
      firstName: 'Ayşe',
      lastName: 'Demir',
      phone: '+90 555 987 6543',
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000
    }
  ];

  // Save dummy users
  localStorage.setItem('appointment_users', JSON.stringify(dummyUsers));

  // Create dummy appointments
  const now = Date.now();
  const dummyAppointments = [
    {
      id: 'apt1',
      businessId: 'biz1',
      customerId: 'user_cust1',
      customerEmail: 'musteri@example.com',
      date: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '14:00',
      service: 'Saç Kesimi',
      status: 'confirmed',
      notes: 'Kısa saç kesimi'
    },
    {
      id: 'apt2',
      businessId: 'biz1',
      customerId: 'user_cust2',
      customerEmail: 'customer@example.com',
      date: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '16:00',
      service: 'Saç + Sakal',
      status: 'pending',
      notes: ''
    },
    {
      id: 'apt3',
      businessId: 'biz2',
      customerId: 'user_cust1',
      customerEmail: 'musteri@example.com',
      date: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      service: 'Periyodik Bakım',
      status: 'confirmed',
      notes: '30.000 km bakım'
    },
    {
      id: 'apt4',
      businessId: 'biz3',
      customerId: 'user_cust2',
      customerEmail: 'customer@example.com',
      date: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '15:00',
      service: 'Orta Dövme',
      status: 'pending',
      notes: 'Kol dövmesi'
    }
  ];

  localStorage.setItem('appointment_appointments', JSON.stringify(dummyAppointments));

  // Create dummy subscriptions
  const dummySubscriptions = [
    {
      id: 'sub1',
      businessId: 'biz1',
      customerId: 'user_cust1',
      customerEmail: 'musteri@example.com',
      planId: 'plan1',
      planName: 'Aylık Paket',
      startDate: now - 10 * 24 * 60 * 60 * 1000,
      endDate: now + 20 * 24 * 60 * 60 * 1000,
      status: 'active',
      price: 500
    },
    {
      id: 'sub2',
      businessId: 'biz2',
      customerId: 'user_cust1',
      customerEmail: 'musteri@example.com',
      planId: 'plan3',
      planName: 'Yıllık Bakım Paketi',
      startDate: now - 30 * 24 * 60 * 60 * 1000,
      endDate: now + 335 * 24 * 60 * 60 * 1000,
      status: 'active',
      price: 5000
    },
    {
      id: 'sub3',
      businessId: 'biz3',
      customerId: 'user_cust2',
      customerEmail: 'customer@example.com',
      planId: 'plan4',
      planName: 'Dövme Sevgilisi Paketi',
      startDate: now - 60 * 24 * 60 * 60 * 1000,
      endDate: now + 120 * 24 * 60 * 60 * 1000,
      status: 'active',
      price: 2000
    }
  ];

  localStorage.setItem('appointment_subscriptions', JSON.stringify(dummySubscriptions));

  // Mark dummy data as loaded
  localStorage.setItem('appointment_dummy_data_loaded', 'true');
}

// Initialize dummy data when system loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initDummyData();
  });
}

