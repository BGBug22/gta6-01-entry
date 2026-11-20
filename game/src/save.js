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
      upgrades: state.upgrades || { engine: 0, armour: 0 },
      savedAt: new Date().toISOString(),
    }));
  } catch {  }
}
export function clearSave() {
  try { localStorage.removeItem(GAME.saveKey); } catch {  }
}
