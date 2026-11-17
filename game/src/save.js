// Save — progres tersimpan di localStorage: uang, misi, senjata, mobil milik.
// Muat di layar start ("Lanjutkan") atau mulai baru.
import { GAME } from './config.js';

export function loadSave() {
  try {
    const raw = localStorage.getItem(GAME.saveKey);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s.money !== 'number' || typeof s.mission !== 'number') return null;
    return s;
  } catch { return null; }
}

export function writeSave(state) {
  try {
    localStorage.setItem(GAME.saveKey, JSON.stringify({
      money: state.money,
      mission: state.missionIndex,
      hasPistol: state.hasPistol,
      ammo: state.ammo,
      ownedCars: state.ownedCars,
      savedAt: new Date().toISOString(),
    }));
  } catch { /* penyimpanan penuh / privat — main tetap jalan */ }
}

export function clearSave() {
  try { localStorage.removeItem(GAME.saveKey); } catch { /* abaikan */ }
}
