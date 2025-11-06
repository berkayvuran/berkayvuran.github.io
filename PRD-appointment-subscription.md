# Product Requirements Document (PRD)
## Randevu Abonelik Sistemi

### 1. Ürün Özeti

**Ürün Adı:** AppointmentGuard - Randevu Abonelik Sistemi

**Problem:** Randevuyla çalışan işletmeler (oto tamirciler, dövmeciler, berberler vb.) randevuya gelmeyen müşteriler nedeniyle fırsat maliyeti yaşıyor. Depozito almadıkları için boş kalan slotları başka müşterilere veremiyorlar.

**Çözüm:** İşletmeler için abonelik tabanlı bir sistem. Müşteriler abonelik alarak randevu garantisi sağlıyor, işletmeler ise gelir garantisi ve daha iyi planlama yapabiliyor.

### 2. Hedef Kitle

**B2B (İşletmeler):**
- Oto tamirciler
- Dövmeciler
- Berberler
- Kuaförler
- Masaj salonları
- Estetik merkezleri
- Diğer randevuyla çalışan hizmet sağlayıcıları

**B2C (Müşteriler):**
- Düzenli hizmet almak isteyen müşteriler
- Randevu garantisi isteyen müşteriler
- Abonelik avantajlarından yararlanmak isteyen müşteriler

### 3. Temel Özellikler

#### 3.1 B2B Paneli Özellikleri

**Kimlik Doğrulama:**
- Kayıt ol (işletme bilgileri, meslek seçimi)
- Giriş yap
- Şifre sıfırlama

**İşletme Yönetimi:**
- İşletme profil bilgileri (isim, adres, telefon, email)
- Meslek kategorisi seçimi
- Çalışma saatleri belirleme
- Hizmet fiyatlandırması
- Abonelik paketleri oluşturma

**Randevu Yönetimi:**
- Randevu takvimi görüntüleme
- Randevu onaylama/iptal etme
- Müşteri bilgileri görüntüleme
- Randevu geçmişi

**Abonelik Yönetimi:**
- Aktif abonelikleri görüntüleme
- Abonelik paketleri oluşturma/düzenleme
- Abonelik istatistikleri
- Gelir takibi

**Raporlama:**
- Aylık/haftalık gelir raporları
- Randevu doluluk oranları
- Müşteri istatistikleri
- İptal/No-show oranları

#### 3.2 B2C Paneli Özellikleri

**Kimlik Doğrulama:**
- Kayıt ol (kişisel bilgiler)
- Giriş yap
- Şifre sıfırlama

**İşletme Keşfi:**
- Meslek kategorisine göre işletme arama
- İşletme detayları görüntüleme
- Yorum ve puanlama görüntüleme

**Abonelik İşlemleri:**
- Mevcut abonelikleri görüntüleme
- Yeni abonelik satın alma
- Abonelik iptal etme
- Abonelik yenileme

**Randevu İşlemleri:**
- Randevu oluşturma
- Randevu görüntüleme
- Randevu iptal etme
- Randevu geçmişi

**Profil Yönetimi:**
- Kişisel bilgileri güncelleme
- Favori işletmeler
- Bildirim tercihleri

### 4. Teknik Gereksinimler

#### 4.1 Teknoloji Stack
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Storage:** LocalStorage (local yönetim için)
- **Dil Desteği:** Türkçe ve İngilizce
- **Responsive Design:** Mobil uyumlu

#### 4.2 Veri Yapısı

**Kullanıcı (User):**
```javascript
{
  id: string,
  email: string,
  password: string (hashed),
  type: 'b2b' | 'b2c',
  language: 'tr' | 'en',
  createdAt: timestamp
}
```

**İşletme (Business):**
```javascript
{
  id: string,
  userId: string,
  name: string,
  profession: string, // meslek kategorisi
  address: string,
  phone: string,
  email: string,
  workingHours: {
    monday: { start: string, end: string },
    tuesday: { start: string, end: string },
    // ... diğer günler
  },
  services: [
    {
      name: string,
      price: number,
      duration: number // dakika
    }
  ],
  subscriptionPlans: [
    {
      id: string,
      name: string,
      price: number,
      duration: number, // gün
      benefits: string[]
    }
  ]
}
```

**Müşteri (Customer):**
```javascript
{
  id: string,
  userId: string,
  firstName: string,
  lastName: string,
  phone: string,
  email: string
}
```

**Abonelik (Subscription):**
```javascript
{
  id: string,
  businessId: string,
  customerId: string,
  planId: string,
  startDate: timestamp,
  endDate: timestamp,
  status: 'active' | 'expired' | 'cancelled',
  price: number
}
```

**Randevu (Appointment):**
```javascript
{
  id: string,
  businessId: string,
  customerId: string,
  subscriptionId: string | null,
  date: timestamp,
  time: string,
  service: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show',
  notes: string
}
```

#### 4.3 Meslek Kategorileri

**Türkçe:**
- Oto Tamircisi
- Dövmeci
- Berber
- Kuaför
- Masaj Salonu
- Estetik Merkezi
- Diş Hekimi
- Fizyoterapist
- Diğer

**İngilizce:**
- Auto Mechanic
- Tattoo Artist
- Barber
- Hairdresser
- Massage Salon
- Aesthetic Center
- Dentist
- Physiotherapist
- Other

### 5. Kullanıcı Akışları

#### 5.1 B2B Kayıt Akışı
1. Kayıt sayfasına git
2. Email ve şifre gir
3. İşletme bilgilerini doldur
4. Meslek kategorisi seç
5. Çalışma saatlerini belirle
6. İlk abonelik paketini oluştur
7. Dashboard'a yönlendir

#### 5.2 B2C Kayıt Akışı
1. Kayıt sayfasına git
2. Email ve şifre gir
3. Kişisel bilgileri doldur
4. Dashboard'a yönlendir

#### 5.3 Randevu Oluşturma Akışı (B2C)
1. İşletme ara/seç
2. Abonelik satın al (opsiyonel)
3. Randevu tarih/saat seç
4. Hizmet seç
5. Randevu onayla
6. Onay emaili al (simüle)

#### 5.4 Abonelik Yönetimi (B2B)
1. Abonelik paketleri sayfasına git
2. Yeni paket oluştur veya mevcut paketi düzenle
3. Fiyat ve süre belirle
4. Avantajları tanımla
5. Kaydet

### 6. UI/UX Gereksinimleri

#### 6.1 Tasarım Prensipleri
- Modern ve temiz arayüz
- Mevcut site tasarımıyla uyumlu
- Koyu/açık tema desteği
- Responsive tasarım
- Erişilebilirlik standartlarına uygun

#### 6.2 Sayfa Yapısı

**B2B Paneli:**
- `/appointment-b2b.html` - Ana sayfa (dashboard)
- Login/Register modalleri
- Randevu takvimi
- Abonelik yönetimi
- Raporlar

**B2C Paneli:**
- `/appointment-b2c.html` - Ana sayfa (dashboard)
- Login/Register modalleri
- İşletme arama/keşif
- Randevu yönetimi
- Abonelik yönetimi

### 7. Güvenlik Gereksinimleri

- Şifreler localStorage'da hash'lenmiş olarak saklanacak (basit hash)
- Session yönetimi (localStorage token)
- Input validation
- XSS koruması

### 8. Performans Gereksinimleri

- Sayfa yükleme süresi < 2 saniye
- Smooth animasyonlar
- Lazy loading (gerekirse)

### 9. Dil Desteği

- Türkçe ve İngilizce tam destek
- Tüm UI elementleri çevrilmiş
- Kullanıcı tercihi localStorage'da saklanır
- Sayfa yenilendiğinde tercih korunur

### 10. Gelecek Geliştirmeler (Phase 2)

- Email bildirimleri
- SMS bildirimleri
- Ödeme entegrasyonu
- Mobil uygulama
- Backend API entegrasyonu
- Gerçek zamanlı randevu takibi
- Müşteri yorumları ve puanlama sistemi

---

**Versiyon:** 1.0  
**Tarih:** 2025-01-XX  
**Hazırlayan:** Berkay Vuran

