// Wanted level — PURE functions (no THREE, no global state).
// All wanted rules in one place: how many police, when the helicopter comes,
// the wanted label, how wanted fades, and how armour absorbs damage.
import { GAME, ARMOUR, RESPECT, HELICOPTER } from './config.js';

// Patrol car count for a given wanted level.
export function policeCarCount(wanted) {
  if (wanted <= 0) return 0;
  if (wanted <= 1) return 1;
  if (wanted <= 3) return 2;
  return 4;
}

// Foot cop count for a given wanted level.
export function policeFootCount(wanted) {
  return wanted >= 2 ? wanted - 1 : 0;
}

// The police helicopter appears once wanted reaches this threshold.
export function helicopterWanted(wanted) {
  return wanted >= HELICOPTER.minWanted;
}

// Wanted label in the HUD — the higher, the hotter.
export function wantedLabel(wanted) {
  if (wanted >= 4) return 'MOST WANTED';
  if (wanted === 3) return 'FUGITIVE';
  if (wanted >= 1) return 'WANTED BY POLICE';
  return 'WANTED LEVEL';
}

// One wanted-decay step: heat fades, then stars drop one by one.
// Returns the new { wanted, heat } — does not mutate its arguments.
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

// Damage goes to armour first; the rest hits health.
// Returns the new { armour, health }.
export function absorbDamage(damage, armour, health) {
  const absorbed = Math.min(Math.max(0, armour), damage);
  return {
    armour: Math.max(0, armour - absorbed),
    health: Math.max(0, health - (damage - absorbed)),
  };
}

// Recover while safe: armour grows back when there is no wanted level.
export function regenArmour(armour, wanted, dt, max = ARMOUR.max) {
  if (wanted > 0) return armour;
  return Math.min(max, armour + ARMOUR.regen * dt);
}

// Respect level from missions completed — +1 every 2 missions.
export function respectLevel(missionsDone) {
  return Math.min(RESPECT.maxLevel, 1 + Math.floor(Math.max(0, missionsDone) / 2));
}

export { GAME };
