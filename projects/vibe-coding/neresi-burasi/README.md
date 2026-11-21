# Neresi Burası?

A GeoGuessr-style game about Turkey for 1 to 15 players in online rooms: a photo, a map, a pin, points by
distance over five rounds. Static files only, no backend, no build step. Rooms connect browser to browser over
WebRTC (PeerJS data channels through the public PeerJS broker); the room host runs the rules and sends snapshots
to everyone else. Bots fill empty seats.

Its sibling, "Bu Yemek Nereden?" (`../bu-yemek-nereden/`), shares this engine: `index.html`, `style.css`,
`app.js`, `sim.js`, `net.js`, `vendor/` and `assets/` are byte-identical in both folders; only `game/` differs.

## Files

| File | What it is |
|---|---|
| `index.html` | Home (name, look, career), lobby, the round screen (photo + map), reveal and end screens |
| `style.css` | Postcard / atlas look, Inter |
| `sim.js` | The rules: rounds, timers, scoring, bots. Pure JS, runs in the browser and under Node. Only the host runs it |
| `net.js` | Thin PeerJS transport: `hostRoom` / `joinRoom` |
| `app.js` | Screens, Leaflet map, province lookup (ray casting over the GeoJSON), host loop, guest sync, reconnect |
| `game/config.js` | What makes this folder this game: title, question, scoring, PeerJS prefix |
| `game/manifest.json` | The photo list: coordinates, province, title, author, licence, source page |
| `game/photos/` | 1600 px JPEGs with opaque names (a name never gives the answer away) |
| `vendor/` | `peerjs.min.js` 1.5.5, Leaflet 1.9.4, `tr-provinces.json` (geoBoundaries TUR ADM1, simplified; CC BY-SA, data from OpenStreetMap) |
| `assets/` | Favicon, Inter woff2 subsets |

Map tiles come from OpenStreetMap (`tile.openstreetmap.org`), the only runtime request that leaves the page.

## Rules in short

Every round everyone sees the same photo. Click the map to place a pin (hover shows the province), confirm with
"Tahmin et"; the round ends when everyone has guessed or the timer runs out. Points: `5000 * exp(-km / 200)`,
no guess scores 0. The reveal shows every pin, the true spot and the photo credit. Five rounds, podium, play again.
Bots guess with gaussian noise (pro about 60 km, rookie about 250 km). A dropped player's seat is played by a bot
and the player can come back to it.

## Photos

Wikimedia Commons only (CC0, public domain, CC BY, CC BY-SA), resized to 1600 px, EXIF stripped. Author, licence
and source are in `game/manifest.json` and on the reveal screen.

## Run locally

```bash
cd .. && python3 -m http.server 8768 --bind 127.0.0.1
open http://localhost:8768/neresi-burasi/
```

`?sure=30` shortens rounds to 30 s for testing; it works on localhost only.
