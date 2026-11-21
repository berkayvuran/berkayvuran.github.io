# Bu Yemek Nereden?

A FoodGuessr-style game about regional food for 1 to 15 players, solo or in online rooms: a dish photo, a map,
up to three pins per round with a compass and hints between them, points by distance plus a bonus for the exact
province (Türkiye map) or country (Dünya map).

This folder runs the same engine as "Neresi Burası?" (`../neresi-burasi/`, read its README for the files, the
modes, the rules and the local run recipe). Only `game/` is specific to this game:

| File | What it is |
|---|---|
| `game/config.js` | Title, questions, the two pools (Türkiye / Dünya) with their bonus and scale, PeerJS prefix |
| `game/manifest.json` + `game/photos/` | Turkish dishes: name, origin province and its coordinates, description, credit |
| `game/world/manifest.json` + `game/world/photos/` | World dishes: name, origin country (Turkish name), description, credit |

Dishes were chosen for an unambiguous origin (registered geographical indications first for Türkiye). Photos come
from Wikimedia Commons only (CC0, public domain, CC BY, CC BY-SA); author, licence and source are in the manifests
and on the reveal screen.
