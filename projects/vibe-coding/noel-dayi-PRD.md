# PRD: Noel Dayi - The Game
## Grafi2000'in Efsane Karakteri Oyun Oluyor!

---

## 1. Vizyon

Grafi2000'in efsanevi Flash animasyonu **Noel Dayı**'yı, tarayıcıda oynanabilir bir **2D platformer/aksiyon oyununa** dönüştürmek. Oyun, orijinal animasyonun ruhunu, estetiğini ve mizah anlayışını birebir koruyacak.

---

## 2. Oyun Konsepti

### Tür: 2D Side-Scrolling Hediye Dağıtma Aksiyonu

**Senaryo:** Noel Dayı yılbaşı gecesi sokakta hediye dağıtıyor. Ama bu normal bir Noel Baba değil - bu bir Noel DAYI. Kapıları kırarak giriyor, hediyesini beğenmeyeni sakatlıyor, lahmacun ve ayranla geliyor.

### Oynanış:
- **Noel Dayı** ekranın solundan sağına doğru ilerler
- Yolda **çocuklar** belirir - hediyeleri atarsın
- Çocuklar ya hediyeyi **beğenir** (puan kazanırsın) ya da **beğenmez** (Noel Dayı otomatik olarak çocuğu tokatlar - bonus puan!)
- **Bacalardan atlama** mekaniği var
- **Eminem** boss fight olarak çıkar (referans: efsanevi Noel Dayı vs Eminem bölümü)
- Oyun hızlanır, daha fazla çocuk çıkar

### Kontroller:
- **Sol/Sağ ok tuşları** veya **A/D**: Hareket
- **Yukarı ok** veya **W** veya **Space**: Zıplama
- **E tuşu**: Hediye at

---

## 3. Karakter Tasarımı - Noel Dayı

Orijinal animasyona sadık kalınacak. CSS/Canvas ile çizilecek:

- **Noel şapkası** (kırmızı-beyaz, biraz eğri/dağınık)
- **Kıllı, iri yarı bir vücut** - kaba saba görünüm
- **Kirli/dağınık sakal** (beyaz ama bakımsız)
- **Kırmızı kıyafet** ama biraz yırtık/pejmürde
- **Kırmızı-beyaz ayakkabılar**
- **Çuval** sırtında (hediye çuvalı)
- **Yüz ifadesi**: Sürekli sinirli/asabi bir gülümseme

### Animasyon Durumları:
1. **Yürüme** - Sallana sallana yürüyüş
2. **Zıplama** - Bacadan atlama
3. **Hediye atma** - Çuvaldan hediye fırlatma
4. **Tokat atma** - Hediyeyi beğenmeyen çocuğa şaplak
5. **Zafer pozu** - Level sonu

---

## 4. Görsel Stil

- **2000'lerin Flash animasyon estetiği** - kalın siyah outline'lar, flat renkler
- **Arka plan**: Kar yağan gece, Türk mahallesi (apartmanlar, balkonlar, çamaşır ipleri)
- **Renk paleti**:
  - Gece mavisi gökyüzü (#1a1a3e)
  - Kar beyazı (#ffffff)
  - Noel kırmızısı (#d42426)
  - Apartman sarısı/turuncusu
- **Pixel-art tarzı değil**, daha çok **çizgi film tarzı** (Flash animasyon gibi)
- **Kar yağışı efekti** sürekli

---

## 5. Ses ve Müzik

- **Ana tema**: Noel Dayı'nın efsanevi sözü ekranda text olarak görünecek:
  > "Ben Noel Dayıyım, delikanlıyım, hediyemi beğenmeyeni sakatlarım!"
- Ses dosyaları opsiyonel (ilk versiyonda yok)
- Retro 8-bit tarzı efektler (hediye atma, tokat, puan)

---

## 6. Oyun Mekaniği Detayları

### Puanlama:
| Aksiyon | Puan |
|---------|------|
| Hediye verme (beğenildi) | +100 |
| Tokat atma (beğenilmedi) | +150 (bonus!) |
| Bacadan atlama | +50 |
| Boss yenme | +500 |

### Zorluk Artışı:
- Her level'da çocuklar daha hızlı gelir
- Hediye beğenilme oranı düşer (daha fazla tokat fırsatı!)
- Level 5'te Eminem boss fight

### Can Sistemi:
- 3 can (lahmacun ikonu ile gösterilir)
- Hediye biterse puan kaybedersin
- Çocuğu kaçırırsan can kaybedersin

---

## 7. Teknik Mimari

### Teknoloji:
- **Pure HTML5 Canvas + JavaScript** (framework yok)
- **Tek HTML dosyası** (diğer vibe-coding projeleriyle uyumlu)
- **CSS embedded** (inline styles)
- **Responsive** (mobil ve desktop)
- **Touch controls** (mobil için ekran butonları)

### Dosya Yapısı:
```
/projects/vibe-coding/noel-dayi-game.html  (tek dosya, tüm oyun)
```

### Performans:
- 60 FPS hedef
- RequestAnimationFrame kullanımı
- Sprite-based rendering (Canvas)

---

## 8. Ekran Akışı

```
[Başlangıç Ekranı]
  - "NOEL DAYI: THE GAME" başlığı
  - Noel Dayı'nın büyük görseli
  - "Ben Noel Dayıyım..." catchphrase
  - "OYNA" butonu
  - "Grafi2000 Efsanesinden İlham Alınmıştır" alt yazısı
       |
       v
[Oyun Ekranı]
  - Üstte: Skor, Level, Canlar (lahmacun)
  - Ortada: Oyun alanı (side-scrolling)
  - Altta: Mobil kontrol butonları
       |
       v
[Game Over Ekranı]
  - Final skor
  - "Hediyemi beğenmedin ha?!" mesajı
  - "Tekrar Oyna" butonu
  - En yüksek skor
```

---

## 9. MVP (İlk Versiyon) - Şu An Yapılacak

Basit ama oynanabilir bir ilk versiyon:

- [x] Noel Dayı karakteri (Canvas ile çizim)
- [x] Sol-sağ hareket + zıplama
- [x] Hediye atma mekaniği
- [x] Çocuklar random spawn
- [x] Beğenme/beğenmeme mekaniği
- [x] Tokat animasyonu
- [x] Skor sistemi
- [x] Başlangıç ekranı
- [x] Game over ekranı
- [x] Kar yağışı efekti
- [x] Responsive tasarım

### Sonraki Versiyonlar:
- Boss fight (Eminem)
- Ses efektleri
- Multiple levels
- Leaderboard
- Power-up'lar (katana, lahmacun boost)

---

## 10. Showcase Entegrasyonu

- **Showcase sayfasında** "Vibe Coding" kategorisine eklenecek
- **Proje başlığı**: "Noel Dayı: The Game"
- **Thumbnail**: Oyunun başlangıç ekranından screenshot
- **Link**: `./projects/vibe-coding/noel-dayi-game.html`

---

## 11. Yasal Uyarı & Hayranlık Notu

> **Bu proje herhangi bir ticari amaca hizmet etmemektedir.**
>
> Tamamen **Varol Yaşaroğlu**, **Erdil Yaşaroğlu**, **Berk Tokay** ve **Grafi2000** ekibine duyulan derin hayranlık ve saygıdan ilham alınarak, kişisel bir fan projesi olarak geliştirilmiştir. Noel Dayı karakteri ve Grafi2000 markası, yaratıcılarına aittir.
>
> Bu oyun; 2000'li yılların başında Türk internet kültürünü şekillendiren, bir neslin hafızasına kazınan o efsanevi Flash animasyonların anısına yapılmış bir **saygı duruşu (tribute)** ve **nostalji projesidir**.
>
> Grafi2000, Türkiye'nin en çok izlenen mizah ve eğlence sitesiydi. Noel Dayı, Poke İmam, Sayko İmam, Karate Kamil gibi karakterler bir neslin internet ile tanışmasına eşlik etti. Bu proje, o kültürel mirası yaşatmayı ve yeni nesillere tanıtmayı amaçlar - başka hiçbir şeyi değil.
>
> Hak sahiplerinin herhangi bir itirazı olması durumunda proje derhal kaldırılacaktır.

---

## 12. Referanslar

- Grafi2000 - grafi2000.com
- Noel Dayı animasyon serisi (Berk Tokay)
- Flash Museum arşivi - flashmuseum.org/browse/series/noel-dayi/
- Catchphrase: "Ben Noel Dayıyım, delikanlıyım, hediyemi beğenmeyeni sakatlarım!"

---

*Bu oyun, Türk internet kültürünün efsanevi karakterine bir saygı duruşudur.*
*Varol Yaşaroğlu, Erdil Yaşaroğlu, Berk Tokay ve tüm Grafi2000 ekibine sonsuz selam ve saygılar!*
