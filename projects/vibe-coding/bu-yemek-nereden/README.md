# Bu Yemek Nereden?

A FoodGuessr-style game about Turkey's regional food for 1 to 15 players in online rooms: a dish photo, a map,
a pin on the province it comes from, points by distance plus a bonus for the exact province, five rounds.

This folder runs the same engine as "Neresi Burası?" (`../neresi-burasi/`, read its README for the files, the
rules and the local run recipe). Only `game/` is specific to this game:

| File | What it is |
|---|---|
| `game/config.js` | Title, question, `provinceBonus: 500`, PeerJS prefix |
| `game/manifest.json` | The dishes: name, origin province and its coordinates, description, photo credit |
| `game/photos/` | 1600 px JPEGs with opaque names |

Dishes were chosen for an unambiguous origin province (registered geographical indications first). Photos come
from Wikimedia Commons only (CC0, public domain, CC BY, CC BY-SA); author, licence and source are in the manifest
and on the reveal screen.
