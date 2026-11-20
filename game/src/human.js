import * as THREE from 'three';
function lam(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}
function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}
export function makeWeaponMesh(kind) {
  const g = new THREE.Group();
  const dark = lam(0x1a1a22);
  const grip = box(0.07, 0.16, 0.09, dark);
  grip.position.y = -0.06; g.add(grip);
  if (kind === 'pistol') {
    const slide = box(0.07, 0.09, 0.30, lam(0x2a2f38));
    slide.position.set(0, 0.03, 0.10); g.add(slide);
  } else if (kind === 'smg') {
    const body = box(0.09, 0.11, 0.42, lam(0x2a2f38));
    body.position.set(0, 0.02, 0.12); g.add(body);
    const mag = box(0.06, 0.16, 0.08, dark);
    mag.position.set(0, -0.10, 0.10); g.add(mag);
  } else if (kind === 'shotgun') {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8), lam(0x3a3f48));
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.03, 0.22); g.add(barrel);
    const pump = box(0.08, 0.07, 0.18, lam(0x6b4423));
    pump.position.set(0, -0.02, 0.22); g.add(pump);
    const stock = box(0.07, 0.12, 0.22, lam(0x6b4423));
    stock.position.set(0, 0.0, -0.14); g.add(stock);
  }
  return g;
}
export function makeHuman(o = {}) {
  const skin = o.skin ?? 0xf1c27d;
  const jacket = o.jacket ?? 0x2a9d8f;
  const pants = o.pants ?? 0x2b3a55;
  const hairColor = o.hair ?? 0x2b2b3a;
  const g = new THREE.Group();
  const parts = {};
  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.14, 0.95, 0);
    const thigh = box(0.17, 0.45, 0.19, lam(pants));
    thigh.position.y = -0.22; hip.add(thigh);
    const shin = box(0.15, 0.42, 0.16, lam(pants));
    shin.position.y = -0.66; hip.add(shin);
    const shoe = box(0.17, 0.09, 0.30, lam(0x1a1a1a));
    shoe.position.set(0, -0.90, 0.05); hip.add(shoe);
    g.add(hip);
    return hip;
  }
  parts.legL = makeLeg(-1);
  parts.legR = makeLeg(1);
  const torso = new THREE.Group();
  torso.position.y = 0.95;
  const chest = box(0.56, 0.52, 0.32, lam(jacket));
  chest.position.y = 0.26; torso.add(chest);
  const collar = box(0.58, 0.08, 0.34, lam(0x1a1a22));
  collar.position.y = 0.50; torso.add(collar);
  g.add(torso);
  parts.torso = torso;
  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.33, 1.42, 0);
    const upper = box(0.14, 0.34, 0.15, lam(jacket));
    upper.position.y = -0.17; shoulder.add(upper);
    const fore = box(0.12, 0.32, 0.13, lam(skin));
    fore.position.y = -0.48; shoulder.add(fore);
    const hand = box(0.11, 0.11, 0.12, lam(skin));
    hand.position.y = -0.68; shoulder.add(hand);
    g.add(shoulder);
    return shoulder;
  }
  parts.armL = makeArm(-1);
  parts.armR = makeArm(1);
  const head = new THREE.Group();
  head.position.y = 1.68;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), lam(skin));
  head.add(skull);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    lam(hairColor),
  );
  hair.position.y = 0.03; head.add(hair);
  if (o.glasses) {
    const frame = lam(0x12233d);
    for (const sx of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12), frame);
      lens.position.set(sx * 0.09, 0.01, 0.19); head.add(lens);
    }
    const bridge = box(0.05, 0.015, 0.015, frame);
    bridge.position.set(0, 0.01, 0.19); head.add(bridge);
  }
  if (o.cap) {
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.09, 12), lam(o.capColor ?? 0xffd23f));
    capTop.position.y = 0.16; head.add(capTop);
    const brim = box(0.24, 0.03, 0.14, lam(o.capColor ?? 0xffd23f));
    brim.position.set(0, 0.13, 0.22); head.add(brim);
  }
  if (o.band) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.07, 12), lam(o.bandColor ?? 0x111111));
    band.position.y = 0.10; head.add(band);
  }
  g.add(head);
  parts.head = head;
  parts.weapon = null;
  parts.weaponKind = o.weapon || null;
  if (o.weapon) {
    const w = makeWeaponMesh(o.weapon);
    w.position.set(0, -0.70, 0.06);
    parts.armR.add(w);
    parts.weapon = w;
  }
  if (o.ring) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.75, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05;
    g.add(ring);
  }
  g.userData.parts = parts;
  return g;
}
export function walkPose(human, t, speed = 1) {
  const p = human.userData.parts;
  if (!p) return;
  const s = Math.sin(t * 8) * 0.55 * speed;
  p.legL.rotation.x = s;
  p.legR.rotation.x = -s;
  p.armL.rotation.x = -s * 0.8;
  p.armR.rotation.x = s * 0.8;
  p.armL.rotation.z = 0.08;
  p.armR.rotation.z = -0.08;
}
export function aimPose(human) {
  const p = human.userData.parts;
  if (!p) return;
  p.armR.rotation.x = -Math.PI / 2 + 0.12;
  p.armR.rotation.z = -0.10;
  p.armL.rotation.x = -Math.PI / 2 + 0.22;
  p.armL.rotation.z = 0.35;
  p.legL.rotation.x = 0.18;
  p.legR.rotation.x = -0.22;
}
export function idlePose(human) {
  const p = human.userData.parts;
  if (!p) return;
  p.armL.rotation.x = 0; p.armR.rotation.x = 0;
  p.armL.rotation.z = 0.08; p.armR.rotation.z = -0.08;
  p.legL.rotation.x = 0; p.legR.rotation.x = 0;
}
export function setWeapon(human, kind) {
  const p = human.userData.parts;
  if (!p) return null;
  if (p.weapon) { p.armR.remove(p.weapon); p.weapon = null; }
  p.weaponKind = kind;
  if (!kind) return null;
  const w = makeWeaponMesh(kind);
  w.position.set(0, -0.70, 0.06);
  p.armR.add(w);
  p.weapon = w;
  return w;
}
