/* "Bu Yemek Nereden?": everything that makes this folder the food game. The engine files around it are shared. */
window.GAME = {
  id: 'food',
  title: 'Bu Yemek Nereden?',
  tagline: 'Bir yöresel lezzet, 81 il. Hangi ilin sofrasından geldiğini haritada işaretle; ili tutturana ek puan.',
  peerPrefix: 'bu-yemek-nereden-v1-',
  question: 'Bu yemek hangi ilin yöresel lezzeti?',
  revealLabel: 'Yöresi',
  scoreScaleKm: 200,
  provinceBonus: 500,
  // Photo pools the player picks from ("Harita"). The first one is the default; the fields above are its fallbacks.
  pools: [
    {
      id: 'tr', label: 'Türkiye', manifest: 'game/manifest.json', geojson: 'vendor/tr-provinces.json', nameProp: 'name', regionLabel: 'İl',
      bounds: { latMin: 35.4, latMax: 42.6, lngMin: 25.2, lngMax: 45.3 }, scoreScaleKm: 200, provinceBonus: 500, botSigma: { pro: 60, rookie: 250 },
      question: 'Bu yemek hangi ilin yöresel lezzeti?', revealLabel: 'Yöresi'
    },
    {
      id: 'world', label: 'Dünya', manifest: 'game/world/manifest.json', geojson: 'vendor/world-countries.json', nameProp: 'name', regionLabel: 'Ülke',
      bounds: { latMin: -60, latMax: 84, lngMin: -180, lngMax: 180 }, scoreScaleKm: 2000, provinceBonus: 1500, botSigma: { pro: 500, rookie: 2000 },
      question: 'Bu yemek hangi ülkenin mutfağından?', revealLabel: 'Ülkesi'
    }
  ]
};
