# VELAMAR — Sunny Harbor City

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/c/gta6-01)
[![rank](https://make.fun/badge/gta6-01/BGBug22/gta6-01-entry/rank.svg)](https://make.fun/c/gta6-01)
[![reward](https://make.fun/badge/gta6-01/BGBug22/gta6-01-entry/reward.svg)](https://make.fun/c/gta6-01)

A 3D open-world crime game for the **gta6-01 "Make GTA 6"** bounty on make.fun.
A bright original city on the seashore — not a copy of any game.

## City

**VELAMAR** — a sunny harbor city on a blue sea. Its landmark is
**Faro Vela**, a red-white lighthouse at the end of the pier, visible from
anywhere in the city. Five districts with big name signs: Puerto Vela, Old Town
(Plaza Mercado), Playa Azul, Glass District, and the VELAMAR main road.
District names are also painted on the road (ground decals) so they read from
a high camera. Buildings with grids of lit windows and warm tile roofs, zebra
crossings at every intersection, a beach with colorful umbrellas and lifeguard
towers.

## Signature mechanic

**Steal any car, outrun a 3-star police chase before time runs out.**
Every parked car can be stolen (E key) — and every theft raises your wanted
level. Police chase in patrol cars and on foot, ram and catch you if you slip.
At wanted 4 stars and up: a police helicopter orbits above you.

## What you can play

- **On foot** (WASD + mouse, third person, run with Shift) and **driving**
  any car — enter with E, exit with E.
- **Living traffic**: 26 AI cars following the roads + 44 detailed pedestrians
  (hats, varied skin tones and heights, some with backpacks) who run in fear
  from gunfire or speeding cars.
- **Wanted level 0–5 stars**: rises when you steal a car, hit a pedestrian,
  punch a citizen, or shoot. Police chase, ram your car, and catch you on
  foot. Wanted 4+ = patrol helicopter. Wanted fades when you hide.
- **Armour**: absorbs damage before health, regens when you are safe
  (wanted 0). **Respect**: +1 level per mission completed (caps at LV 5).
- **8 story missions "Three Days in Velamar"** (Mara & Rico): deliver a package,
  flash cab, 4-gate street race, steal the Cometa GT, escape a 3-star chase,
  **ROB VELA BANK (heist — enter the bank, grab the loot, run to the docks
  under a 2-star chase)**, shoot back at 3 dock thugs, and a final escape to
  the boat with 4 stars. Every mission: objective, timer, cash reward,
  character dialog, pass/fail screens.
- **Shops (B key, near a shop)**: a real buy menu — pistol ($150), ammo
  +12 ($40), full armour refill ($100) at the "El Gatillo" gun store; buy
  the Cometa GT ($1200) at Cometa Motors. Buy with keys 1/2/3 or click.
- **Vela Garage — upgrades (B key, near the garage)**: Turbo Engine +10%
  speed per level (max LV 3, $300), Max Armour +25 per level (max
  LV 2, $250), full armour refill ($100). Upgrades persist in the save and
  apply to every car you own.
- **Side activity**: instant taxi (T key — pick up a fare, drop them off,
  paid $80).
- **Combat**: punch (F) + pistol (key 2, click to shoot) with ammo.
- **Progression**: cash from missions & taxi — buy a pistol ($150) + ammo ($40)
  at the "El Gatillo" gun store, buy the Cometa GT ($1200) at Cometa Motors,
  upgrade engine & armour at Vela Garage. Progress auto-saves to
  localStorage (continue from the start screen).
- **Full HUD**: health, armour, respect, money, weapon + ammo, wanted
  stars + label (WANTED BY POLICE / FUGITIVE / MOST WANTED), objective + target
  distance + mission timer, city clock (DAY 1 18:24, advances as you play),
  mission dialog, district, radio (SOL FM 95.4), speed + car name while
  driving, live minimap (player, police, mission target, cars), crosshair,
  button prompts, and start / pause / mission pass / fail / busted / wasted
  screens.
- **Synthesized sound** (WebAudio, no files): engine, police sirens, gunshots,
  mission coins.

## Controls

| Key | Action |
|---|---|
| WASD / arrows | Walk / drive |
| Mouse (drag) | Rotate camera |
| Shift | Run |
| E | Enter / exit car |
| F | Punch |
| Left click | Shoot (pistol) |
| 1 / 2 | Fists / pistol |
| M | Start next mission |
| T | Instant taxi |
| B | Buy (near a shop) |
| H | Horn |
| P / Esc | Pause |

## How to play

Open `game/index.html` through any static server (e.g. `node serve.ts`,
then http://localhost:8080). The game runs fully offline — three.js is
vendored locally in `game/vendor/three.module.min.js`, with no network requests.

## Source structure

| File | Job |
|---|---|
| `game/src/main.js` | Main loop, player controls, camera, shops, save |
| `game/src/config.js` | World, districts, vehicles, missions, dialogs, game numbers |
| `game/src/city.js` | Builds the city: roads, buildings, beach, Faro Vela |
| `game/src/vehicles.js` | 3D car factory + arcade driving physics |
| `game/src/traffic.js` | AI traffic cars + detailed pedestrians |
| `game/src/police-chase.js` | Police + wanted level 0–5 + helicopter |
| `game/src/wanted-level.js` | Pure wanted rules (unit counts, labels, armour) |
| `game/src/story-campaign.js` | 8-mission chain (including heist) + dialog + side activity |
| `game/src/textures.js` | Procedural textures (asphalt, Art Deco facades, neon, containers, sand, sea, sun, clouds) |
| `game/src/human.js` | Articulated 3D humans (walk, aim, idle, weapons) |
| `game/src/combat.js` | Punch, pistol, dock enemies |
| `game/src/hud.js` | HUD + buy menu + start/pause/mission screens |
| `game/src/minimap.js` | Live minimap canvas |
| `game/src/input.js` | Keyboard + mouse |
| `game/src/audio.js` | Synthesized WebAudio sound |
| `game/src/save.js` | Save/load localStorage (including garage upgrades) |
| `game/src/screenshot-staging.js` | Deterministic chase-camera screenshot mode (`?shot=...`) |
| `game/src/random.js` | Deterministic seeded RNG |

## Screenshots

Four deterministic screenshots taken from the game actually running
(`shots.json`), all 3D street-level chase cameras: a golden-hour chase on
the beach boulevard with the Cometa GT + helicopter + Faro Vela lighthouse,
a night heist escape from Vela Bank under the helicopter searchlight,
on-foot gunfight at the Puerto Vela Docks (containers + crane + ship),
and a bright day at Plaza Mercado with a "MISSION PASSED! +$5,000" banner.
