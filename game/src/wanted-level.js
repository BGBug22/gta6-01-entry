// Wanted level — fungsi MURNI (tanpa THREE, tanpa state global).
// Semua aturan wanted di satu tempat: berapa polisi, kapan helikopter datang,
// label wanted, cara wanted memudar, dan cara armour menyerap damage.
import { GAME, ARMOUR, RESPECT, HELICOPTER } from './config.js';

// Jumlah mobil patroli untuk wanted tertentu.
export function policeCarCount(wanted) {
  if (wanted <= 0) return 0;
  if (wanted <= 1) return 1;
  if (wanted <= 3) return 2;
  return 3;
}

// Jumlah polisi jalan kaki untuk wanted tertentu.
export function policeFootCount(wanted) {
  return wanted >= 2 ? wanted - 1 : 0;
}

// Helikopter polisi muncul saat wanted mencapai ambang ini.
export function helicopterWanted(wanted) {
  return wanted >= HELICOPTER.minWanted;
}

// Label wanted di HUD — makin tinggi makin gawat.
export function wantedLabel(wanted) {
  if (wanted >= 4) return 'PALING DICARI';
  if (wanted === 3) return 'BURONAN';
  if (wanted >= 1) return 'DICARI POLISI';
  return 'WANTED LEVEL';
}

// Satu langkah peluruhan wanted: heat memudar, lalu bintang turun satu per satu.
// Mengembalikan { wanted, heat } yang baru — tidak mengubah argumen.
export function decayWanted(wanted, heat, dt) {
  if (wanted <= 0) return { wanted: 0, heat: 0 };
  let h = heat - dt * 0.03;
  let w = wanted;
  if (h <= 0) {
    w = Math.max(0, wanted - 1);
    h = w > 0 ? 0.7 : 0;
  }
  return { wanted: w, heat: h };
}

// Damage masuk ke armour dulu; sisanya baru ke health.
// Mengembalikan { armour, health } yang baru.
export function absorbDamage(damage, armour, health) {
  const absorbed = Math.min(Math.max(0, armour), damage);
  return {
    armour: Math.max(0, armour - absorbed),
    health: Math.max(0, health - (damage - absorbed)),
  };
}

// Pulih saat aman: armour tumbuh kembali kalau tidak ada wanted.
export function regenArmour(armour, wanted, dt, max = ARMOUR.max) {
  if (wanted > 0) return armour;
  return Math.min(max, armour + ARMOUR.regen * dt);
}

// Level respect dari jumlah misi yang sudah selesai — naik 1 tiap 2 misi.
export function respectLevel(missionsDone) {
  return Math.min(RESPECT.maxLevel, 1 + Math.floor(Math.max(0, missionsDone) / 2));
}

export { GAME };
