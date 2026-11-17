// VELAMAR — konfigurasi dunia, distrik, kendaraan, misi, dialog, dan angka game.
// Satu-satunya tempat angka-angka dunia didefinisikan; semua sistem lain membaca dari sini.
export const WORLD = {
  name: 'VELAMAR',
  tagline: 'Kota Pelabuhan Matahari',
  // Batas kota yang bisa dijelajahi (meter). Laut di barat (x negatif), kota di timur.
  halfSize: 340,
  seaX: -300,
  beachX: -272,
  roadGap: 80,
  seed: 20261117,
};

export const DISTRICTS = [
  // Papan HARUS di atas persimpangan jalan (bukan tengah blok) supaya tidak
  // terhalang gedung dari jalan mana pun.
  { name: 'VELAMAR', sub: 'KOTA PELABUHAN', x: 0, z: 0, color: '#ffd23f', big: true },
  { name: 'PELABUHAN VELA', sub: 'DERMAGA • FARO VELA', x: -210, z: -190, color: '#ff5d5d' },
  { name: 'KOTA TUA', sub: 'PLAZA MERCADO', x: 80, z: 160, color: '#7ee081' },
  { name: 'PANTAI AZUL', sub: 'BOULEVARD MATAHARI', x: -240, z: 160, color: '#4cc9f0' },
  { name: 'DISTRIK KACA', sub: 'MENARA • KANTOR', x: 190, z: -160, color: '#f72585' },
];

// Palet sun-soaked: langit biru hangat, matahari sore, jalan dan pasir keemasan.
export const PALETTE = {
  sky: 0x8fd0f5, fog: 0xc4e2f2, sun: 0xffe9b8,
  road: 0x40454f, roadLine: 0xfff6c9, sidewalk: 0xc9bfa5, sand: 0xf2d8a0, sea: 0x1e90c8,
  building: [0xffd9a0, 0xffb4a2, 0xa0e7ff, 0xc8f7c5, 0xffe66d, 0xf7aef8, 0xffffff, 0xffc6ff],
  glass: [0x9fd8ff, 0x7ec8f7, 0xbde0fe],
};

// Atap genteng hangat — merah bata, oranye terakota, coklat kayu. Bukan abu-abu.
export const ROOF_COLORS = [0xc96f4a, 0xe07b39, 0x8a5a3b, 0xb5502e, 0xd98e4a, 0xa34d28];

// Kendaraan yang bisa dicuri / dibeli. speed = m/detik, accel, harga beli.
export const CAR_MODELS = [
  { id: 'sedan', name: 'Vela Sedan', color: 0xe63946, speed: 34, accel: 16, price: 0 },
  { id: 'taxi', name: 'Taksi Azul', color: 0xffd23f, speed: 32, accel: 15, price: 0 },
  { id: 'coupe', name: 'Marlin Coupe', color: 0x4361ee, speed: 42, accel: 20, price: 650 },
  { id: 'pickup', name: 'Pikap Dermaga', color: 0x2a9d8f, speed: 30, accel: 13, price: 450 },
  { id: 'sport', name: 'Cometa GT', color: 0xf72585, speed: 48, accel: 24, price: 1200 },
  { id: 'van', name: 'Van Mercado', color: 0xffffff, speed: 28, accel: 12, price: 350 },
];

export const SHOPS = {
  weapon: { name: 'TOKO SENJATA "EL GATILLO"', x: 120, z: 60, pistolPrice: 150, ammoPrice: 40 },
  car: { name: 'DEALER "COMETA MOTORS"', x: 200, z: 100, carId: 'sport' },
  garage: { name: 'GARASI VELA', x: -80, z: -200 },
};

// Papan toko — signage kecil di trotoar dekat toko, terbaca dari jalan.
export const SHOP_SIGNS = [
  { name: 'TOKO SENJATA', sub: 'EL GATILLO • PISTOL', x: 132, z: 88, color: '#ffd23f' },
  { name: 'COMETA MOTORS', sub: 'DEALER • COMETA GT', x: 212, z: 168, color: '#f72585' },
  { name: 'PLAZA MERCADO', sub: 'PASAR KOTA TUA', x: 68, z: 88, color: '#7ee081' },
  { name: 'MOTEL PALMERA', sub: 'KAMAR • KOLAM', x: -252, z: 80, color: '#ff8fa3' },
  { name: 'TACO VELA', sub: 'MAKANAN PANTAI', x: -188, z: 88, color: '#ffe66d' },
  { name: 'PANTAI AZUL', sub: 'KAFFE • ES KELAPA', x: -252, z: 200, color: '#4cc9f0' },
  { name: 'BANK VELA', sub: 'BRANKAS • DISTRIK KACA', x: 200, z: -152, color: '#ffd23f' },
  { name: 'GARASI VELA', sub: 'UPGRADE • BENGKEL', x: -68, z: -208, color: '#ff8fa3' },
];

// Harga toko & garasi — satu tempat, dibaca menu beli.
export const SHOP_PRICES = {
  pistol: 150, ammo: 40, armourRefill: 100,
  engine: 300, armourMax: 250,
};
export const SHOP_LIMITS = { engineMax: 3, armourMaxLevel: 2 };
export const RADIO = [
  { name: 'SOL FM', freq: '95.4', style: 'SYNTHWAVE' },
  { name: 'VELA FM', freq: '88.1', style: 'SALSA PANTAI' },
  { name: 'DERMAGA ROCK', freq: '101.2', style: 'ROCK' },
];

// Jam kota — mulai DAY 1 18:24, maju 1 menit tiap 5 detik main.
export const CLOCK = { day: 1, hour: 18, minute: 24, minutesPerSecond: 0.2 };

// Armour — menyerap damage duluan, pulih saat aman (wanted 0).
export const ARMOUR = { start: 50, max: 100, regen: 6 };

// Respect — naik 1 level tiap 2 misi selesai, mentok LV 5.
export const RESPECT = { perMission: 1, maxLevel: 5 };

// Helikopter polisi — muncul di gameplay live saat wanted >= 4.
export const HELICOPTER = { minWanted: 4, height: 55, orbitRadius: 26, speed: 30 };

// Kepadatan kota — 26 mobil lalu lintas + 44 pejalan kaki.
export const DENSITY = { traffic: 26, pedestrians: 44 };

// 8 misi cerita — rantai "Tiga Hari di Velamar". reward dalam $.
export const MISSIONS = [
  { id: 1, title: 'Pesan Pertama', giver: 'MARA', text: 'Antar paket ke Plaza Mercado. Jangan buka isinya.', target: { x: 60, z: 140 }, reward: 120, time: 0, type: 'goto' },
  { id: 2, title: 'Taksi Kilat', giver: 'MARA', text: 'Penumpang menunggu di Pantai Azul. Antar ke Faro Vela, cepat!', target: { x: -180, z: 190 }, reward: 150, time: 150, type: 'taxi' },
  { id: 3, title: 'Balapan Jalanan', giver: 'RICO', text: 'Lewati 4 gerbang balap sebelum waktu habis. Jangan nabrak!', target: { x: 0, z: 0 }, reward: 250, time: 120, type: 'race', gates: 4 },
  { id: 4, title: 'Ambil Mobilnya', giver: 'MARA', text: 'Curi Cometa GT merah muda di Distrik Kaca. Antar ke Garasi Vela.', target: { x: 190, z: -160 }, reward: 300, time: 0, type: 'steal' },
  { id: 5, title: 'Kabur dari Polisi', giver: 'RICO', text: 'Buat wanted 3 bintang, lalu hilangkan jejakmu. Bertahan!', target: { x: 0, z: 0 }, reward: 350, time: 180, type: 'escape' },
  { id: 6, title: 'Rampok Bank Vela', giver: 'RICO', text: 'Masuk Bank Vela, ambil uang rampasan, kabur ke dermaga sebelum polisi mengepung!', target: { x: 190, z: -160 }, getaway: { x: -292, z: -198 }, reward: 600, time: 180, type: 'heist' },
  { id: 7, title: 'Tembak Balik', giver: 'RICO', text: 'Tiga preman dermaga menghadang. Habisi mereka semua.', target: { x: -210, z: -120 }, reward: 500, time: 0, type: 'combat' },
  { id: 8, title: 'Pelarian Terakhir', giver: 'MARA', text: 'Polisi 4 bintang mengejarmu. Capai kapal di ujung dermaga sebelum waktu habis!', target: { x: -292, z: -198 }, reward: 800, time: 150, type: 'finale' },
];

// Satu baris dialog per misi — yang bicara + kalimatnya, tampil di HUD.
export const DIALOGS = {
  1: { giver: 'MARA', line: 'Paketnya jangan dibuka, ya. Plaza Mercado, cepat.' },
  2: { giver: 'MARA', line: 'Penumpang di Pantai Azul. Antar ke Faro Vela!' },
  3: { giver: 'RICO', line: 'Empat gerbang, satu juara. Gas, jangan nabrak!' },
  4: { giver: 'MARA', line: 'Cometa GT merah muda itu. Bawa ke Garasi Vela.' },
  5: { giver: 'RICO', line: 'Bikin rusuh sampai 3 bintang, lalu hilang!' },
  6: { giver: 'RICO', line: 'Bank Vela, brankasnya. Ambil semua, lalu kabur!' },
  7: { giver: 'RICO', line: 'Tiga preman dermaga. Habisi mereka semua.' },
  8: { giver: 'MARA', line: 'Kapal di ujung dermaga. Ini pelarian terakhir kita!' },
};

export const GAME = {
  startMoney: 50,
  startHealth: 100,
  punchDamage: 34,
  pistolDamage: 50,
  pistolAmmoStart: 12,
  pistolAmmoMax: 120,
  pistolName: 'PISTOL VELA',
  maxWanted: 5,
  bustedFine: 100,
  wastedFine: 150,
  saveKey: 'velamar-save-v1',
};
