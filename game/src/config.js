// VELAMAR v5 — world config, districts, vehicles, missions, dialogs.
// The single place world numbers are defined; every system reads them.
// ALL user-facing text is English. Place names stay iconic (Velamar,
// Faro Vela, Playa Azul, Plaza Mercado, Puerto Vela).
export const WORLD = {
  name: 'VELAMAR',
  tagline: 'Sunny Harbor City',
  // Explorable city bounds (meters). Sea to the west (negative x), city east.
  halfSize: 340,
  seaX: -300,
  beachX: -272,
  roadGap: 80,
  seed: 20261117,
};

export const DISTRICTS = [
  // Signs MUST sit above road intersections (not mid-block) so no building
  // hides them from any street.
  // ry = sign facing (radians, normal = (sin ry, cos ry)) — faces the road /
  // the incoming player so the text reads correctly, not mirrored.
  { name: 'VELAMAR', sub: 'HARBOR CITY', x: 0, z: 0, color: '#ffd23f', big: true, ry: 0 },
  { name: 'PUERTO VELA', sub: 'DOCKS • FARO VELA', x: -210, z: -190, color: '#ff5d5d', ry: -0.98 },
  { name: 'OLD TOWN', sub: 'PLAZA MERCADO', x: 80, z: 160, color: '#7ee081', ry: -2.03 },
  { name: 'PLAYA AZUL', sub: 'SUN BOULEVARD', x: -240, z: 160, color: '#4cc9f0', ry: 3.14159 },
  { name: 'GLASS DISTRICT', sub: 'TOWERS • OFFICES', x: 190, z: -160, color: '#f72585', ry: -1.5708 },
];

// Sunset palette: purple-blue sky, warm fog, darker roads (readable from the
// low chase camera), golden sand.
export const PALETTE = {
  sky: 0x2a1e5e, fog: 0xef9a55, sun: 0xffb36b,
  road: 0x454a55, roadLine: 0xfff6c9, sidewalk: 0xc9bfa5, sand: 0xf2d8a0, sea: 0x1e90c8,
  building: [0xffd9a0, 0xffb4a2, 0xa0e7ff, 0xc8f7c5, 0xffe66d, 0xf7aef8, 0xffffff, 0xffc6ff],
  glass: [0x9fd8ff, 0x7ec8f7, 0xbde0fe],
};

// Warm tile roofs — brick red, terracotta orange, wood brown. Not grey.
export const ROOF_COLORS = [0xc96f4a, 0xe07b39, 0x8a5a3b, 0xb5502e, 0xd98e4a, 0xa34d28];

// Vehicles you can steal / buy. speed = m/s, accel, buy price.
export const CAR_MODELS = [
  { id: 'sedan', name: 'Vela Sedan', color: 0xe63946, speed: 34, accel: 16, price: 0 },
  { id: 'taxi', name: 'Azul Taxi', color: 0xffd23f, speed: 32, accel: 15, price: 0 },
  { id: 'coupe', name: 'Marlin Coupe', color: 0x4361ee, speed: 42, accel: 20, price: 650 },
  { id: 'pickup', name: 'Dock Pickup', color: 0x2a9d8f, speed: 30, accel: 13, price: 450 },
  { id: 'sport', name: 'Cometa GT', color: 0xf72585, speed: 48, accel: 24, price: 1200 },
  { id: 'van', name: 'Mercado Van', color: 0xffffff, speed: 28, accel: 12, price: 350 },
];

export const SHOPS = {
  weapon: { name: 'EL GATILLO ARMS', x: 120, z: 60, pistolPrice: 150, ammoPrice: 40 },
  car: { name: 'COMETA MOTORS', x: 200, z: 100, carId: 'sport' },
  garage: { name: 'VELA GARAGE', x: -80, z: -200 },
};

// Shop signs — small signs on the sidewalk near each shop, readable from the road.
// ry = sign facing (normal = (sin ry, cos ry)) — faces the incoming player
// so the text reads correctly, not mirrored from behind.
export const SHOP_SIGNS = [
  // The GUN STORE sign sticks on the north wall of the building (120,80) —
  // right across the street from the shop trigger (120,60), readable from the road.
  { name: 'EL GATILLO ARMS', sub: 'GUNS • AMMO', x: 126, z: 67.6, color: '#ffd23f', ry: 3.1416 },
  { name: 'COMETA MOTORS', sub: 'DEALER • COMETA GT', x: 212, z: 168, color: '#f72585', ry: -1.72 },
  { name: 'PLAZA MERCADO', sub: 'OLD TOWN MARKET', x: 68, z: 88, color: '#7ee081', ry: -0.15 },
  { name: 'MOTEL PALMERA', sub: 'ROOMS • POOL', x: -252, z: 80, color: '#ff8fa3', ry: 1.5708 },
  { name: 'TACO VELA', sub: 'BEACH FOOD', x: -188, z: 88, color: '#ffe66d', ry: -1.5708 },
  { name: 'PLAYA AZUL', sub: 'CAFE • COCONUT ICE', x: -252, z: 200, color: '#4cc9f0', ry: 1.5708 },
  { name: 'VELA BANK', sub: 'VAULT • GLASS DISTRICT', x: 200, z: -152, color: '#ffd23f', ry: -1.77 },
  { name: 'VELA GARAGE', sub: 'UPGRADES • REPAIRS', x: -68, z: -208, color: '#ff8fa3', ry: -0.24 },
];

// Shop & garage prices — one place, read by the buy menu.
export const SHOP_PRICES = {
  pistol: 150, smg: 450, shotgun: 600, ammo: 40, armourRefill: 100,
  engine: 300, armourMax: 250,
};
export const SHOP_LIMITS = { engineMax: 3, armourMaxLevel: 2 };

// Three radio stations (WebAudio, synthesized — no audio files).
export const RADIO = [
  { name: 'SOL FM', freq: '95.4', style: 'SYNTHWAVE' },
  { name: 'VELA WAVE', freq: '101.2', style: 'CHILLWAVE' },
  { name: 'NIGHTWIRE', freq: '88.7', style: 'NIGHT DRIVE' },
];

// City clock — starts DAY 1 18:24, advances 1 minute per 5 seconds of play.
export const CLOCK = { day: 1, hour: 18, minute: 24, minutesPerSecond: 0.2 };

// Armour — absorbs damage first, regens when safe (wanted 0).
export const ARMOUR = { start: 50, max: 100, regen: 6 };

// Respect — rises 1 level per 2 missions done, caps at LV 5.
export const RESPECT = { perMission: 1, maxLevel: 5 };

// Police helicopter — appears in live play at wanted >= 4.
export const HELICOPTER = { minWanted: 4, height: 55, orbitRadius: 26, speed: 30 };

// City density — 26 traffic cars + 44 pedestrians.
export const DENSITY = { traffic: 26, pedestrians: 44 };

// 4 weapons — all functional. key = HUD slot key, damage per hit, rate = s
// between shots, ammoMax, spread = radians of random spread, range in meters.
export const WEAPONS = {
  fist: { name: 'FISTS', key: '1', damage: 34, rate: 0.45, ammo: Infinity, range: 2.4, spread: 0, icon: '✊' },
  pistol: { name: 'PISTOL', key: '2', damage: 50, rate: 0.35, ammo: 120, range: 90, spread: 0.01, icon: '🔫', price: 150 },
  smg: { name: 'MICRO-SMG', key: '3', damage: 22, rate: 0.12, ammo: 200, range: 60, spread: 0.05, icon: '🔫', price: 450 },
  shotgun: { name: 'SHOTGUN', key: '4', damage: 26, rate: 0.8, ammo: 40, range: 30, spread: 0.12, pellets: 5, icon: '🔫', price: 600 },
};

// 8 story missions — the "Three Days in Velamar" chain. reward in $.
export const MISSIONS = [
  { id: 1, title: 'First Delivery', giver: 'MARA', text: 'Drop the package at Plaza Mercado. Do not open it.', target: { x: 60, z: 140 }, reward: 120, time: 0, type: 'goto' },
  { id: 2, title: 'Flash Cab', giver: 'MARA', text: 'A fare is waiting at Playa Azul. Get them to Faro Vela, fast!', target: { x: -180, z: 190 }, reward: 150, time: 150, type: 'taxi' },
  { id: 3, title: 'Street Race', giver: 'RICO', text: 'Clear 4 race gates before the clock runs out. No crashing!', target: { x: 0, z: 0 }, reward: 250, time: 120, type: 'race', gates: 4 },
  { id: 4, title: 'Steal the Ride', giver: 'MARA', text: 'Lift the pink Cometa GT in the Glass District. Bring it to Vela Garage.', target: { x: 190, z: -160 }, reward: 300, time: 0, type: 'steal' },
  { id: 5, title: 'Lose the Heat', giver: 'RICO', text: 'Stir up a 3-star wanted level, then vanish. Survive!', target: { x: 0, z: 0 }, reward: 350, time: 180, type: 'escape' },
  { id: 6, title: 'Vela Bank Heist', giver: 'RICO', text: 'Walk into Vela Bank, grab the loot, and run for the pier before the cops close in!', target: { x: 190, z: -160 }, getaway: { x: -292, z: -198 }, reward: 600, time: 180, type: 'heist' },
  { id: 7, title: 'Shoot Back', giver: 'RICO', text: 'Three dock thugs are waiting for you. Drop them all.', target: { x: -210, z: -120 }, reward: 500, time: 0, type: 'combat' },
  { id: 8, title: 'The Last Run', giver: 'MARA', text: 'Four stars are on your tail. Reach the boat at the end of the pier before time runs out!', target: { x: -292, z: -198 }, reward: 800, time: 150, type: 'finale' },
];

// One dialog line per mission — who speaks + the line, shown in the HUD.
// Sharp crime-drama voice, like the Top 5.
export const DIALOGS = {
  1: { giver: 'MARA', line: 'Do not open the package. Plaza Mercado. Move.' },
  2: { giver: 'MARA', line: 'Fare waiting at Playa Azul. Faro Vela, and step on it!' },
  3: { giver: 'RICO', line: 'Four gates, one winner. Floor it — and do not crash!' },
  4: { giver: 'MARA', line: 'That pink Cometa GT. Bring it to Vela Garage.' },
  5: { giver: 'RICO', line: 'Make some noise till you hit three stars, then disappear!' },
  6: { giver: 'RICO', line: 'Vela Bank. The vault. Take it all — then run!' },
  7: { giver: 'RICO', line: 'Three dock thugs. Drop them all.' },
  8: { giver: 'MARA', line: 'The boat at the end of the pier. This is our last run!' },
};

export const GAME = {
  startMoney: 50,
  startHealth: 100,
  punchDamage: 34,
  pistolDamage: 50,
  pistolAmmoStart: 12,
  pistolAmmoMax: 120,
  pistolName: 'PISTOL',
  maxWanted: 5,
  bustedFine: 100,
  wastedFine: 150,
  saveKey: 'velamar-save-v1',
};
