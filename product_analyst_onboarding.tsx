import React, { useState, useEffect } from 'react';
import { Trophy, Star, CheckCircle, Clock, Target, Award, BookOpen, Users, Zap, Brain, BarChart3, LogIn, UserPlus, Mail } from 'lucide-react';

const ProductAnalystOnboarding = () => {
  const [userEmail, setUserEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [currentWeek, setCurrentWeek] = useState(1);
  const [registrationDate, setRegistrationDate] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  
  // LocalStorage keys
  const getStorageKey = (email) => `sestek_onboarding_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Görevleri kategorilere ayırıp puanlandırıyoruz
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

  // Load user data from localStorage
  useEffect(() => {
    const email = localStorage.getItem('sestek_current_user');
    if (email) {
      const userData = JSON.parse(localStorage.getItem(getStorageKey(email)) || '{}');
      if (userData.email) {
        setUserEmail(email);
        setIsRegistered(true);
        setGameStarted(true);
        setCompletedTasks(new Set(userData.completedTasks || []));
        setCurrentWeek(userData.currentWeek || 1);
        setRegistrationDate(userData.registrationDate || null);
      }
    }
  }, []);

  // Save user data to localStorage
  useEffect(() => {
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
  }, [completedTasks, currentWeek, userEmail, isRegistered, registrationDate]);

  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const earnedPoints = tasks.filter(task => completedTasks.has(task.id)).reduce((sum, task) => sum + task.points, 0);
  const completionRate = Math.round((earnedPoints / totalPoints) * 100);
  
  const weekTasks = tasks.filter(task => task.week === currentWeek);
  const weekPoints = weekTasks.reduce((sum, task) => sum + task.points, 0);
  const weekEarned = weekTasks.filter(task => completedTasks.has(task.id)).reduce((sum, task) => sum + task.points, 0);
  
  const achievements = [
    { name: 'İlk Adım', description: 'İlk görevi tamamla', icon: <Star className="w-6 h-6" />, unlocked: completedTasks.size >= 1, color: 'from-blue-400 to-blue-600' },
    { name: 'Sistem Kurucusu', description: '5 IT görevi tamamla', icon: <Zap className="w-6 h-6" />, unlocked: tasks.filter(t => t.category === 'IT' && completedTasks.has(t.id)).length >= 5, color: 'from-purple-400 to-purple-600' },
    { name: 'İK Süreçleri', description: 'Tüm İK görevlerini tamamla', icon: <Users className="w-6 h-6" />, unlocked: tasks.filter(t => t.category === 'İK').every(t => completedTasks.has(t.id)), color: 'from-green-400 to-green-600' },
    { name: 'Hafta 1 Şampiyonu', description: '1. haftayı %100 tamamla', icon: <Trophy className="w-6 h-6" />, unlocked: tasks.filter(t => t.week === 1).every(t => completedTasks.has(t.id)), color: 'from-yellow-400 to-yellow-600' },
    { name: 'SESTEK Uzmanı', description: 'Tüm görevleri tamamla', icon: <Award className="w-6 h-6" />, unlocked: completedTasks.size === tasks.length, color: 'from-orange-400 to-red-600' },
  ];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegisterLogin = () => {
    if (!validateEmail(userEmail)) {
      alert('Lütfen geçerli bir email adresi girin');
      return;
    }

    const existingUser = localStorage.getItem(getStorageKey(userEmail));
    
    if (existingUser) {
      // Existing user - login
      const userData = JSON.parse(existingUser);
      setCompletedTasks(new Set(userData.completedTasks || []));
      setCurrentWeek(userData.currentWeek || 1);
      setRegistrationDate(userData.registrationDate);
      setIsLogin(true);
    } else {
      // New user - register
      setRegistrationDate(new Date().toISOString());
      setIsLogin(false);
    }
    
    setIsRegistered(true);
    setGameStarted(true);
  };

  const toggleTask = (taskId) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
  };

  const logout = () => {
    localStorage.removeItem('sestek_current_user');
    setUserEmail('');
    setIsRegistered(false);
    setGameStarted(false);
    setCompletedTasks(new Set());
    setCurrentWeek(1);
    setRegistrationDate(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Kolay': return 'text-green-700 bg-green-100 border-green-200';
      case 'Orta': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Zor': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    const iconClass = "w-5 h-5";
    switch(category) {
      case 'Eğitim': return <BookOpen className={iconClass} />;
      case 'İK': return <Users className={iconClass} />;
      case 'IT': return <Zap className={iconClass} />;
      default: return <CheckCircle className={iconClass} />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Eğitim': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'İK': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'IT': return 'text-purple-700 bg-purple-50 border-purple-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getDaysElapsed = () => {
    if (!registrationDate) return 0;
    const start = new Date(registrationDate);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center border border-blue-100">
          <div className="mb-8">
            {/* SESTEK Logo */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg relative">
                <div className="w-12 h-12 bg-white rounded-full absolute"></div>
                <span className="text-blue-600 font-bold text-2xl z-10">S</span>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wider">
                SESTEK
              </div>
            </div>
            <h2 className="text-xl text-gray-600 mb-2">Product Analyst</h2>
            <h3 className="text-lg text-gray-500">Onboarding Journey v2.0</h3>
          </div>
          
          <div className="mb-8">
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Email adresinizi girin..."
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full pl-12 pr-6 py-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-center text-lg bg-blue-50/30"
              />
            </div>
          </div>
          
          <button
            onClick={handleRegisterLogin}
            disabled={!validateEmail(userEmail)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Kayıt Ol / Giriş Yap
          </button>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 rounded-xl border border-cyan-200">
            <p className="text-sm text-gray-600 mb-2">
              <strong className="text-blue-800">2 haftalık</strong> onboarding macerası
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {tasks.length} görev
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {totalPoints} puan
              </span>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            🔒 İlerlemeniz güvenli bir şekilde kaydedilir
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg relative">
                <div className="w-7 h-7 bg-white rounded-full absolute"></div>
                <span className="text-blue-600 font-bold text-lg z-10">S</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isLogin ? `Tekrar hoş geldiniz!` : `Hoş geldiniz!`} 🎯
                </h1>
                <p className="text-gray-600 font-medium">
                  {userEmail} • {getDaysElapsed()} gün önce başladınız
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 p-4 rounded-xl border border-cyan-200">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {earnedPoints}
                </div>
                <div className="text-sm text-gray-500 font-medium">/ {totalPoints} puan</div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Çıkış Yap"
              >
                <LogIn className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
              <span>Genel İlerleme</span>
              <span className="text-blue-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div 
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 h-4 rounded-full transition-all duration-700 shadow-sm relative overflow-hidden"
                style={{ width: `${completionRate}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Status Banner */}
          {isLogin && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Kaldığınız yerden devam ediyorsunuz!</span>
                <span className="text-sm text-green-600">
                  ({completedTasks.size}/{tasks.length} görev tamamlandı)
                </span>
              </div>
            </div>
          )}

          {/* Week Selector */}
          <div className="flex space-x-3">
            <button
              onClick={() => setCurrentWeek(1)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                currentWeek === 1 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              1. Hafta
            </button>
            <button
              onClick={() => setCurrentWeek(2)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                currentWeek === 2 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              2. Hafta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Tasks */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Clock className="w-7 h-7 text-blue-600" />
                  {currentWeek}. Hafta Görevleri
                </h2>
                <div className="bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 px-4 py-2 rounded-xl border border-cyan-200">
                  <span className="text-sm font-bold text-gray-700">
                    {weekEarned}/{weekPoints} puan
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {weekTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 ${
                      completedTasks.has(task.id)
                        ? 'border-green-300 bg-gradient-to-r from-green-50 to-green-100 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg border ${getCategoryColor(task.category)}`}>
                            {getCategoryIcon(task.category)}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                        </div>
                        
                        <h3 className={`font-semibold text-lg mb-2 transition-all ${
                          completedTasks.has(task.id) ? 'text-green-700 line-through' : 'text-gray-800'
                        }`}>
                          {task.title}
                        </h3>
                        
                        {task.link && (
                          <a 
                            href={task.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Linke Git</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                            +{task.points}
                          </span>
                          <div className="text-xs text-gray-500">puan</div>
                        </div>
                        <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all ${
                          completedTasks.has(task.id)
                            ? 'bg-green-500 border-green-500 shadow-lg'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}>
                          {completedTasks.has(task.id) && (
                            <CheckCircle className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Kullanıcı Bilgileri
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
                  <div className="font-semibold text-gray-800 text-sm">{userEmail}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Durum</div>
                  <div className="font-semibold text-purple-700">
                    {isLogin ? 'Devam Ediyor' : 'Yeni Başladı'}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Süre</div>
                  <div className="font-semibold text-orange-700">
                    {getDaysElapsed()} gün
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Bu Hafta
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Tamamlanan</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {weekTasks.filter(t => completedTasks.has(t.id)).length}/{weekTasks.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Puan</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {weekEarned}/{weekPoints}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${weekTasks.length > 0 ? (weekTasks.filter(t => completedTasks.has(t.id)).length / weekTasks.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-orange-500" />
                Başarımlar
              </h3>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      achievement.unlocked
                        ? `bg-gradient-to-r ${achievement.color} text-white shadow-lg transform hover:scale-105`
                        : 'bg-gray-50 border border-gray-200 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-white/20' : 'bg-gray-200'}`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <div className={`font-bold text-sm ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                          {achievement.name}
                        </div>
                        <div className={`text-xs ${achievement.unlocked ? 'text-white/80' : 'text-gray-400'}`}>
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalystOnboarding;