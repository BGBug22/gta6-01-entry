// VELAMAR — konfigurasi dunia, distrik, kendaraan, dan misi.
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

export const PALETTE = {
  sky: 0x7ec8f7, fog: 0xaadcf7, sun: 0xfff2c9,
  road: 0x3a3f4a, roadLine: 0xf5f0dc, sidewalk: 0xb9b3a4, sand: 0xf2d8a0, sea: 0x1e90c8,
  building: [0xffd9a0, 0xffb4a2, 0xa0e7ff, 0xc8f7c5, 0xffe66d, 0xf7aef8, 0xffffff, 0xffc6ff],
  glass: [0x9fd8ff, 0x7ec8f7, 0xbde0fe],
};

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

// 8 misi cerita — rantai "Tiga Hari di Velamar". reward dalam $.
export const MISSIONS = [
  { id: 1, title: 'Pesan Pertama', giver: 'MARA', text: 'Antar paket ke Plaza Mercado. Jangan buka isinya.', target: { x: 60, z: 140 }, reward: 120, time: 0, type: 'goto' },
  { id: 2, title: 'Taksi Kilat', giver: 'MARA', text: 'Penumpang menunggu di Pantai Azul. Antar ke Faro Vela, cepat!', target: { x: -180, z: 190 }, reward: 150, time: 150, type: 'taxi' },
  { id: 3, title: 'Balapan Jalanan', giver: 'RICO', text: 'Lewati 4 gerbang balap sebelum waktu habis. Jangan nabrak!', target: { x: 0, z: 0 }, reward: 250, time: 120, type: 'race', gates: 4 },
  { id: 4, title: 'Ambil Mobilnya', giver: 'MARA', text: 'Curi Cometa GT merah muda di Distrik Kaca. Antar ke Garasi Vela.', target: { x: 190, z: -160 }, reward: 300, time: 0, type: 'steal' },
  { id: 5, title: 'Kabur dari Polisi', giver: 'RICO', text: 'Buat wanted 3 bintang, lalu hilangkan jejakmu. Bertahan!', target: { x: 0, z: 0 }, reward: 350, time: 180, type: 'escape' },
  { id: 6, title: 'Paket Panas', giver: 'MARA', text: 'Antar paket ke dermaga selagi wanted 2 bintang mengejarmu.', target: { x: -210, z: -190 }, reward: 400, time: 180, type: 'hotdrop' },
  { id: 7, title: 'Tembak Balik', giver: 'RICO', text: 'Tiga preman dermaga menghadang. Habisi mereka semua.', target: { x: -210, z: -120 }, reward: 500, time: 0, type: 'combat' },
  { id: 8, title: 'Pelarian Terakhir', giver: 'MARA', text: 'Polisi 4 bintang mengejarmu. Capai kapal di ujung dermaga sebelum waktu habis!', target: { x: -290, z: -200 }, reward: 800, time: 150, type: 'finale' },
];

export const GAME = {
  startMoney: 50,
  startHealth: 100,
  punchDamage: 34,
  pistolDamage: 50,
  pistolAmmoStart: 12,
  maxWanted: 5,
  bustedFine: 100,
  wastedFine: 150,
  saveKey: 'velamar-save-v1',
};
