/* "Neresi Burası?": everything that makes this folder the geo game. The engine files around it are shared. */
window.GAME = {
  id: 'geo',
  title: 'Neresi Burası?',
  tagline: 'Bir fotoğraf, koca bir ülke. İğneyi haritaya bırak, ekipten daha yakın tahmin et.',
  peerPrefix: 'neresi-burasi-v1-',
  question: 'Bu fotoğraf Türkiye\'nin neresinde çekildi?',
  revealLabel: 'Çekildiği yer',
  scoreScaleKm: 200,
  provinceBonus: 0,
  // Photo pools the player picks from ("Harita"). The first one is the default; the fields above are its fallbacks.
  pools: [
    {
      id: 'tr', label: 'Türkiye', manifest: 'game/manifest.json', geojson: 'vendor/tr-provinces.json', nameProp: 'name', regionLabel: 'İl',
      bounds: { latMin: 35.4, latMax: 42.6, lngMin: 25.2, lngMax: 45.3 }, scoreScaleKm: 200, provinceBonus: 0, botSigma: { pro: 60, rookie: 250 },
      question: 'Bu fotoğraf Türkiye\'nin neresinde çekildi?', revealLabel: 'Çekildiği yer'
    },
    {
      id: 'world', label: 'Dünya', manifest: 'game/world/manifest.json', geojson: 'vendor/world-countries.json', nameProp: 'name', regionLabel: 'Ülke',
      bounds: { latMin: -60, latMax: 84, lngMin: -180, lngMax: 180 }, scoreScaleKm: 2000, provinceBonus: 0, botSigma: { pro: 500, rookie: 2000 },
      question: 'Bu fotoğraf dünyanın neresinde çekildi?', revealLabel: 'Çekildiği ülke'
    }
  ]
};
