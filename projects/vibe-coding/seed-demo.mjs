// Demo kullanıcı için 1 aylık dummy data
// Kullanım: node seed-demo.mjs

const SUPABASE_URL = 'https://qftttunqzriytdnbitcu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHR0dW5xenJpeXRkbmJpdGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTA3NzAsImV4cCI6MjA4ODQyNjc3MH0.Qv_8S-ZuJNwQuIihxynk_0p16mLOrMM5nCzDX_BCInI';
const DEMO_HANDLE = 'demo';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation',
};

async function req(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// ---- Veri havuzları ----
const LOCATIONS = ['Mutfak', 'Mutfak', 'Mutfak', 'Yemek Odası', 'Restoran', 'Ofis', 'Kanepe'];
const PORTIONS  = ['Az', 'Biraz Az', 'Normal', 'Normal', 'Normal', 'Fazla', 'Çok Fazla'];

const BREAKFAST_FOODS = [
  'yulaf ezmesi, muz, bal',
  'tam buğday ekmek, peynir, domates, salatalık',
  'yumurta (2 adet), domates, yeşil biber',
  'granola, yoğurt, çilek',
  'peynirli tost, domates suyu',
  'avokado ekmek, haşlanmış yumurta',
  'simit, beyaz peynir, çay',
  'müsli, süt, elma',
];
const LUNCH_FOODS = [
  'mercimek çorbası, tam buğday ekmek, ayran',
  'tavuk ızgara, bulgur pilavı, salata',
  'sebzeli makarna, cacık',
  'ev yapımı köfte, patates püresi, yeşil salata',
  'balık (levrek), zeytinyağlı enginar, pilav',
  'tavuk şiş, közlenmiş sebze, yoğurt',
  'çoban salatası, humus, pide',
  'mantı, yoğurt, nane-pul biber yağı',
  'kuru fasulye, pilav, turşu',
  'sebze çorbası, peynirli börek',
];
const DINNER_FOODS = [
  'mercimek köftesi, cacık, ekmek',
  'zeytinyağlı taze fasulye, pilav, ayran',
  'tavuk sote, bulgur, yoğurt',
  'balık buğulama, haşlanmış brokoli, limon',
  'patlıcan musakka, salata',
  'domates çorbası, peynirli tost',
  'omlet (3 yumurta), salata',
  'izmir köfte, patates, salça',
  'sebzeli tavuk güveç, ekmek',
  'fırın sebze, lor peyniri, ekmek',
];
const SNACK_FOODS = [
  'elma, badem (10 adet)',
  'yoğurt, bal, ceviz',
  'muz, fıstık ezmesi',
  'çikolata (3 kare)',
  'cips, kola',
  'bisküvi (3-4 adet), çay',
  'meyve salatası',
  'fındık karışık kuruyemiş',
  'pasta dilimi, çay',
  'dondurma (1-2 top)',
  'kraker, peynir',
  'hurma, süt',
  'çikolatalı kek, kahve',
  'poğaça, ayran',
];

const EMOTIONS_NORMAL = [
  'Sakin ve rahat bir gündü. Yemek öncesi biraz acıkmıştım.',
  'İş yerinde toplantı vardı, biraz stresliydim ama yemek saatinde rahatlamıştım.',
  'Güzel bir gün geçirdim. Arkadaşlarla sohbet ettik.',
  'Hafif yorgundum, rahat bir yemekti.',
  'Sabah spor yaptım, iyi hissediyordum.',
  'Normal bir gündü. Öğleden sonra biraz baş ağrısı vardı.',
  'Keyifli bir öğle arasıydı, güneşliydi dışarısı.',
];
const EMOTIONS_NEGATIVE = [
  'Bugün çok stresliydim, iş yerinde zor bir gün geçirdim. Yemeği fark etmeden bitirdim.',
  'Çok yorgundum ve sinirliydim. Kendimi ödüllendirmek istedim sanırım.',
  'Sıkılmaktan yedim aslında, gerçekten aç değildim.',
  'Annemi aradım, konuşma beni üzdü. Sonrasında kontrolsüz yedim.',
  'Arkadaşımla tartıştım, kendimi çok kötü hissettim. Yemek bir şekilde teselli gibi geldi.',
  'Uykusuz kaldım, düşüncelerim dağınıktı. Yemeği farkında olmadan bitirdim.',
  'Gece geç saate kadar çalıştım, kaygılıydım.',
];
const EMOTIONS_BINGE = [
  'Çok bunalmış hissediyordum. Yemeğe başladıktan sonra duramadım, kontrolümü kaybettim.',
  'Önce birazcık yiyeceğim diye başladım ama defalarca gidip aldım. Utanıyorum.',
  'Çok sinirliydim ve ne yediğimi fark etmeden yedim. Bittikten sonra içim sıkıştı.',
  'Yalnız ve mutsuzdum. Yemek bir süreliğine iyi hissettirdi ama sonra çok pişman oldum.',
];

const COMMENTS_NORMAL = [
  'Sakin ve kontrollü bir yemekti. Doyduğumda durabildim.',
  'Yavaş yedim, her lokmayı hissettim. İyi bir yemekti.',
  'Miktarı iyi ayarladım. Kendimle gurur duydum.',
  'Plan dahilindeydi. Sonrasında kendimi iyi hissettim.',
  'Biraz fazla oldu ama makul bir sınırda kaldım.',
  'Besin değerine özen gösterdim. Mutluyum.',
];
const COMMENTS_NEGATIVE = [
  'Fazla yediğimi farkettim ama durduramadım kendimi. Sonrasında şişkinlik ve suçluluk vardı.',
  'Yavaş yemek istedim ama oldu hızlı. Doyduğumu da geç farkettim.',
  'Kontrolden çıktım. Bunu farkettim, sonraki öğünde daha dikkatli olacağım.',
  'Çok hızlı yedim. Sonrasında fiziksel olarak rahatsızlık hissettim.',
  'Planlamadığım şeyleri yedim. Kendiminle başa çıkmam gerekiyor.',
];
const COMMENTS_BINGE = [
  'Tıkınma atağıydı. Çok pişmanım ve midem çok doldu. Uzanmak zorunda kaldım.',
  'Durdurmak için çok geç kaldım. Sonrasında midem çok rahatsız oldu. Devam planı yapmalıyım.',
  'Bu sefer çok kötü oldu. Neden böyle yapıyorum diye sorguladım kendimi.',
];

const COMPENSATORY = [
  '',
  '',
  '',
  '',
  'Biraz yürüyüş yapabilirim.',
  'Akşam yemeğini daha hafif tutacağım.',
  'Yarın daha dikkatli olacağım.',
  'Kalorileri telafi etmek için spor yapacağım.',
  '2 saat koşmayı düşündüm ama yapmayacağım.',
];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Gerçekçi öğün planlaması: her gün 2-4 öğün
function generateDayMeals(date) {
  const meals = [];
  // Sabah: %85 ihtimal
  if (Math.random() < 0.85) {
    const h = rndInt(7, 9), m = rndInt(0, 45);
    meals.push({ type: 'breakfast', hour: h, minute: m, duration: rndInt(10, 25) });
  }
  // Öğle: %90 ihtimal
  if (Math.random() < 0.90) {
    const h = rndInt(12, 14), m = rndInt(0, 59);
    meals.push({ type: 'lunch', hour: h, minute: m, duration: rndInt(15, 40) });
  }
  // İkindi atıştırması: %50 ihtimal
  if (Math.random() < 0.50) {
    const h = rndInt(15, 17), m = rndInt(0, 59);
    meals.push({ type: 'snack', hour: h, minute: m, duration: rndInt(5, 20) });
  }
  // Akşam: %95 ihtimal
  if (Math.random() < 0.95) {
    const h = rndInt(18, 21), m = rndInt(0, 59);
    meals.push({ type: 'dinner', hour: h, minute: m, duration: rndInt(20, 50) });
  }
  // Gece atıştırması: %25 ihtimal
  if (Math.random() < 0.25) {
    const h = rndInt(21, 23), m = rndInt(0, 59);
    meals.push({ type: 'snack', hour: h, minute: m, duration: rndInt(5, 25) });
  }
  return meals.map(slot => {
    const startedAt = new Date(date);
    startedAt.setHours(slot.hour, slot.minute, 0, 0);
    const endedAt = new Date(startedAt.getTime() + slot.duration * 60000);

    // Tıkınma ihtimali: %12 (gerçekçi bir oran)
    const isBinge = Math.random() < 0.12;
    // Stresli yemek: %20
    const isStress = !isBinge && Math.random() < 0.20;

    let pre_fullness, post_fullness, portion, emotions, comments, compensatory, foodsText;

    if (isBinge) {
      pre_fullness = rndInt(3, 6);
      post_fullness = rndInt(1, 3);
      portion = rnd(['Fazla', 'Çok Fazla']);
      emotions = rnd(EMOTIONS_BINGE);
      comments = rnd(COMMENTS_BINGE);
      compensatory = rnd(['', '', 'Koşu yapacağım.', 'Bugün bir daha yemeyeceğim.', '']);
    } else if (isStress) {
      pre_fullness = rndInt(3, 7);
      post_fullness = rndInt(4, 7);
      portion = rnd(['Normal', 'Fazla', 'Çok Fazla']);
      emotions = rnd(EMOTIONS_NEGATIVE);
      comments = rnd(COMMENTS_NEGATIVE);
      compensatory = rnd(COMPENSATORY);
    } else {
      pre_fullness = rndInt(4, 7);
      post_fullness = rndInt(6, 9);
      portion = rnd(['Az', 'Biraz Az', 'Normal', 'Normal', 'Normal']);
      emotions = rnd(EMOTIONS_NORMAL);
      comments = rnd(COMMENTS_NORMAL);
      compensatory = '';
    }

    switch (slot.type) {
      case 'breakfast': foodsText = rnd(BREAKFAST_FOODS); break;
      case 'lunch':     foodsText = rnd(LUNCH_FOODS);     break;
      case 'dinner':    foodsText = rnd(DINNER_FOODS);    break;
      default:          foodsText = rnd(SNACK_FOODS);     break;
    }

    const loc = rnd(LOCATIONS);

    return {
      user_email: DEMO_HANDLE,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_minutes: slot.duration,
      location: loc === 'Kanepe' ? 'Diğer' : loc,
      location_custom: loc === 'Kanepe' ? 'Kanepe' : null,
      pre_fullness,
      post_fullness,
      portion_size: portion,
      foods: [{ name: foodsText }],
      status: 'completed',
      compensatory_plan: compensatory || null,
      events_thoughts_emotions: emotions,
      comments,
    };
  });
}

async function main() {
  console.log('🚀 Demo kullanıcısı oluşturuluyor...');

  // Önce varsa sil, yeniden oluştur
  await req('DELETE', `/meals?user_email=eq.${DEMO_HANDLE}`, undefined);
  await req('DELETE', `/profiles?email=eq.${DEMO_HANDLE}`, undefined);

  // Profil oluştur
  const profile = await req('POST', '/profiles', { email: DEMO_HANDLE });
  console.log('✅ Profil oluşturuldu:', DEMO_HANDLE);

  // Son 30 gün için meal üret
  const today = new Date();
  today.setHours(23, 59, 0, 0);
  const allMeals = [];

  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dayMeals = generateDayMeals(date);
    allMeals.push(...dayMeals);
  }

  console.log(`📦 ${allMeals.length} öğün oluşturuldu, Supabase'e yazılıyor...`);

  // Toplu insert (50'şer)
  const BATCH = 50;
  for (let i = 0; i < allMeals.length; i += BATCH) {
    const batch = allMeals.slice(i, i + BATCH);
    const result = await req('POST', '/meals', batch);
    if (result && result[0]?.code) {
      console.error('❌ Hata:', JSON.stringify(result));
      process.exit(1);
    }
    console.log(`  → ${Math.min(i + BATCH, allMeals.length)}/${allMeals.length} yazıldı`);
  }

  // Özet
  const binge = allMeals.filter(m => m.portion_size === 'Çok Fazla' || (m.portion_size === 'Fazla' && m.post_fullness <= 3)).length;
  const normal = allMeals.filter(m => m.portion_size === 'Normal').length;
  console.log('\n✅ Tamamlandı!');
  console.log(`   Toplam öğün : ${allMeals.length}`);
  console.log(`   Normal      : ${normal}`);
  console.log(`   Tıkınma ~   : ${binge}`);
  console.log(`\n   Rumuz: ${DEMO_HANDLE}`);
  console.log('   Uygulamaya giriş için bu rumuzu kullan.');
}

main().catch(console.error);
