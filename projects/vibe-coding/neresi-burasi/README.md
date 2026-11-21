# Neresi Burası?

A GeoGuessr-style game about Turkey (and, as a second pool, the world) played alone or by 1 to 15 players in
online rooms: a photo, a map, up to three pins, points by distance. Static files only, no backend, no build step.
Rooms connect browser to browser over WebRTC (PeerJS data channels through the public PeerJS broker); the room host
runs the rules and sends snapshots to everyone else. Solo games run the same host loop locally and send nothing.
Bots fill empty seats.

Its sibling, "Bu Yemek Nereden?" (`../bu-yemek-nereden/`), shares this engine: `index.html`, `style.css`,
`app.js`, `sim.js`, `net.js`, `vendor/` and `assets/` are byte-identical in both folders; only `game/` differs.
Everything game specific (titles, questions, photo pools) lives in `game/config.js` as `window.GAME`.

## Files

| File | What it is |
|---|---|
| `index.html` | Home (name, look, career, solo mode cards, team block), lobby, the round screen (photo + map, compass card), presenter view, reveal and end screens |
| `style.css` | Postcard / atlas look, Inter |
| `sim.js` | The rules: modes, attempts, hints, scoring, badges, bots, pools, presenter. Pure JS, runs in the browser and under Node. Only the host runs it |
| `net.js` | Thin PeerJS transport: `hostRoom` / `joinRoom` |
| `app.js` | Screens, Leaflet map, province/country lookup (ray casting over the pool's GeoJSON), solo flow, host loop, guest sync, reconnect, share text, QR |
| `game/config.js` | What makes this folder this game: title, question, scoring, PeerJS prefix, photo pools |
| `game/manifest.json` | The Türkiye photo list: coordinates, province, title, author, licence, source page (optional `hint1`, `hint2`) |
| `game/photos/` | 1600 px JPEGs with opaque names (a name never gives the answer away) |
| `game/world/` | The Dünya pool: `manifest.json` (same schema, `province` holds the country in Turkish) and `photos/`; a 6-item placeholder until the real set lands |
| `vendor/` | `peerjs.min.js` 1.5.5, Leaflet 1.9.4, `qrcode.min.js` (qrcode-generator 1.4.4, MIT), `tr-provinces.json` (geoBoundaries TUR ADM1, simplified; CC BY-SA, data from OpenStreetMap), `world-countries.json` (placeholder with three fake polygons until the real map lands) |
| `assets/` | Favicon, Inter woff2 subsets |

Map tiles come from OpenStreetMap (`tile.openstreetmap.org`), the only runtime request that leaves the page.

## Rules in short

Every round everyone sees the same photo. Click the map to place a pin (hover shows the province or country),
confirm with "Tahmin et". A pin in the right province (or within 10 km, x10 on the world map) is a hit and ends the
player's round; a miss shows a compass card (distance band, one of eight directions, a hint: the region, then the
first letter) and allows another pin, three at most. The final pin scores `5000 * exp(-km / scale)` times 1, 0.7 or
0.5 for the first, second or third attempt; no pin scores 0. The round ends when every online player is done or the
timer runs out. The reveal shows every final pin, the true spot, the photo credit and round badges. Bots guess with
gaussian noise (pool `botSigma`, x0.6 per retry). A dropped player's seat is played by a bot and the player can come
back to it.

Modes (`MODES` in `sim.js`): Klasik (5 rounds, room or solo), Zamana Karşı (10 x 30 s, speed bonus), Hangi İl?
(10 x 45 s, right province 1000 points), and solo only: Seri (until three misses in a round), Günün Oyunu (the same
five photos for everyone per day and pool, result kept in this browser, share text), Keşif (no timer, no points).
Presenter mode ("Sunum modu") turns the host into a spectator whose screen shows the photo, a big timer, the join
code with a QR code and the players' chips; everyone plays on their phones.

## Photo pools

`GAME.pools` lists the pools the "Harita" picker offers (first one is the default; missing keys fall back to the
top-level `GAME` fields): `id`, `label`, `manifest`, `geojson`, `nameProp`, `regionLabel`, `bounds`
`{latMin, latMax, lngMin, lngMax}`, `scoreScaleKm`, `provinceBonus`, `botSigma` `{pro, rookie}`, `question`,
`revealLabel`, and optionally `dir` (photo folder, default: the manifest's folder), `minZoom` (default 1 for a
world-wide box, else 4) and `attribution` (HTML credit for the GeoJSON). The GeoJSON names (`nameProp`), the
manifest `province` values and the region/continent tables in `sim.js` must use the same Turkish names (compared
without case or diacritics).

## Photos

Wikimedia Commons only (CC0, public domain, CC BY, CC BY-SA), resized to 1600 px, EXIF stripped. Author, licence
and source are in `game/manifest.json` and on the reveal screen.

## Run locally

```bash
cd .. && python3 -m http.server 8768 --bind 127.0.0.1
open http://localhost:8768/neresi-burasi/
```

`?sure=30` shortens rounds to 30 s for testing (rooms and solo games, never Keşif); it works on localhost only.
