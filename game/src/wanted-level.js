import { GAME, ARMOUR, RESPECT, HELICOPTER } from './config.js';

export function policeCarCount(wanted) {
  if (wanted <= 0) return 0;
  if (wanted <= 1) return 1;
  if (wanted <= 3) return 2;
  return 4;
}

export function policeFootCount(wanted) {
  return wanted >= 2 ? wanted - 1 : 0;
}

export function helicopterWanted(wanted) {
  return wanted >= HELICOPTER.minWanted;
}

export function wantedLabel(wanted) {
  if (wanted >= 4) return 'MOST WANTED';
  if (wanted === 3) return 'FUGITIVE';
  if (wanted >= 1) return 'WANTED BY POLICE';
  return 'WANTED LEVEL';
}

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

export function absorbDamage(damage, armour, health) {
  const absorbed = Math.min(Math.max(0, armour), damage);
  return {
    armour: Math.max(0, armour - absorbed),
    health: Math.max(0, health - (damage - absorbed)),
  };
}

export function regenArmour(armour, wanted, dt, max = ARMOUR.max) {
  if (wanted > 0) return armour;
  return Math.min(max, armour + ARMOUR.regen * dt);
}

export function respectLevel(missionsDone) {
  return Math.min(RESPECT.maxLevel, 1 + Math.floor(Math.max(0, missionsDone) / 2));
}

export { GAME };
