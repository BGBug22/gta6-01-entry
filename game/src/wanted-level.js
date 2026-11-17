// Wanted level — aturan murni bintang buron: berapa unit polisi & pejalan kaki
// yang dikerahkan, label buron, dan string bintang. Dipakai police-chase.js.
import { GAME } from './config.js';
import { clamp } from './random.js';

// Jumlah mobil patroli yang mengejar pada wanted level n (0-5).
export function policeUnitsForWanted(n) {
  if (n <= 0) return 0;
  if (n <= 1) return 1;
  if (n <= 3) return 2;
  return 3;
}

// Jumlah polisi jalan kaki yang mengejar pada wanted level n.
export function footUnitsForWanted(n) {
  return n >= 2 ? n - 1 : 0;
}

// Label buron untuk HUD.
export function wantedLabelFor(n) {
  if (n <= 0) return 'TENANG';
  if (n <= 1) return 'DIAWASI';
  if (n <= 2) return 'BURON';
  if (n <= 3) return 'BURON BERAT';
  return 'PALING DICARI';
}

// String bintang ★☆ untuk HUD.
export function wantedStars(n) {
  let s = '';
  for (let i = 0; i < GAME.maxWanted; i++) s += i < n ? '★' : '☆';
  return s;
}

export function clampWanted(n) {
  return clamp(n, 0, GAME.maxWanted);
}
