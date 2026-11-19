import * as THREE from 'three';
import { WEAPONS, WORLD } from './config.js';
import { makeHuman, aimPose } from './human.js';
import { makeRng } from './random.js';

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.weapon = 'fist';
    this.ammo = { pistol: 0, smg: 0, shotgun: 0 };
    this.owned = { pistol: false, smg: false, shotgun: false };
    this.cooldown = 0;
    this.tracer = null;
    this.flash = null;
    this.flashTimer = 0;
  }
  get hasPistol() { return this.owned.pistol; }
  set hasPistol(v) { this.owned.pistol = v; if (v && this.ammo.pistol === 0) this.ammo.pistol = 12; }
  buyWeapon(id) {
    this.owned[id] = true;
    this.ammo[id] = Math.max(this.ammo[id], WEAPONS[id].ammo === Infinity ? 0 : 12);
    this.weapon = id;
  }
  buyPistol() { this.buyWeapon('pistol'); }
  buyAmmo(id = 'pistol') {
    if (!this.owned[id]) return;
    const w = WEAPONS[id];
    this.ammo[id] = Math.min(w.ammo, this.ammo[id] + 12);
  }
  ammoFor(id) { return id === 'fist' ? Infinity : this.ammo[id]; }
  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.flash) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) { this.scene.remove(this.flash); this.flash = null; }
    }
  }
  punch(player, targets, onHit) {
    if (this.cooldown > 0) return false;
    this.cooldown = WEAPONS.fist.rate;
    const fx = Math.sin(player.heading), fz = Math.cos(player.heading);
    for (const t of targets) {
      const dx = t.pos.x - player.pos.x, dz = t.pos.z - player.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < WEAPONS.fist.range && (dx * fx + dz * fz) > 0) { onHit(t, WEAPONS.fist.damage); return true; }
    }
    return false;
  }
  shoot(player, camera, targets, onHit) {
    const w = WEAPONS[this.weapon];
    if (!w || this.weapon === 'fist') return 'no-weapon';
    if (!this.owned[this.weapon]) return 'no-weapon';
    if (this.ammo[this.weapon] <= 0) return 'no-ammo';
    if (this.cooldown > 0) return 'cooling';
    this.cooldown = w.rate;
    this.ammo[this.weapon] -= 1;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = camera.position.clone();
    const pellets = w.pellets || 1;
    let hits = 0;
    for (let k = 0; k < pellets; k++) {
      const spread = w.spread * (pellets === 1 ? 0 : (k - (pellets - 1) / 2) / ((pellets - 1) / 2));
      const d = dir.clone();
      d.x += spread * 0.6; d.y += spread * 0.3; d.normalize();
      let best = null, bestT = w.range;
      for (const t of targets) {
        const to = new THREE.Vector3(t.pos.x - origin.x, 1.2 - origin.y, t.pos.z - origin.z);
        const dist = to.length();
        if (dist > w.range) continue;
        const cos = to.normalize().dot(d);
        if (cos > 0.985 && dist < bestT) { bestT = dist; best = t; }
      }
      if (best) { onHit(best, w.damage); hits += 1; }
    }
    this.showTracer(origin, dir, 40);
    this.showMuzzle(origin, dir);
    return hits > 0 ? 'hit' : 'miss';
  }
  showTracer(origin, dir, len) {
    if (this.tracer) this.scene.remove(this.tracer);
    const end = origin.clone().add(dir.clone().multiplyScalar(len));
    const geo = new THREE.BufferGeometry().setFromPoints([origin, end]);
    this.tracer = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe66d }));
    this.scene.add(this.tracer);
    setTimeout(() => { if (this.tracer) { this.scene.remove(this.tracer); this.tracer = null; } }, 70);
  }
  showMuzzle(origin, dir) {
    if (this.flash) this.scene.remove(this.flash);
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff2a0 }),
    );
    g.add(core);
    for (let k = 0; k < 4; k++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.9, 4),
        new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 }),
      );
      spike.rotation.z = (k * Math.PI) / 2;
      spike.position.set(0, 0, 0.3);
      g.add(spike);
    }
    g.position.copy(origin).add(dir.clone().multiplyScalar(2.2));
    g.lookAt(origin.clone().add(dir.clone().multiplyScalar(10)));
    this.scene.add(g);
    this.flash = g;
    this.flashTimer = 0.09;
  }
  staticFlash(pos, dir) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff2a0 }),
    );
    g.add(core);
    for (let k = 0; k < 6; k++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 1.6, 4),
        new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 }),
      );
      spike.rotation.z = (k * Math.PI) / 3;
      spike.position.set(0, 0, 0.35);
      g.add(spike);
    }
    g.position.copy(pos);
    g.lookAt(pos.clone().add(dir));
    this.scene.add(g);
    return g;
  }
}

export class Enemy {
  constructor(scene, x, z, seed = 0) {
    this.mesh = makeHuman({
      skin: 0xf1c27d,
      jacket: 0x9d0208,
      pants: 0x1a1a1a,
      hair: 0x111111,
      band: true,
      bandColor: 0x111111,
      weapon: 'pistol',
    });
    aimPose(this.mesh);
    this.mesh.position.set(x, 0, z);
    this.health = 100;
    this.rng = makeRng(WORLD.seed + 400 + seed);
    this.shootCd = 1.5 + this.rng();
    this.pos = this.mesh.position;
    this.animT = this.rng() * 10;
    scene.add(this.mesh);
  }
  update(dt, playerPos, onShoot) {
    this.animT += dt;
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 14) {
      this.pos.x += (dx / d) * 3.2 * dt; this.pos.z += (dz / d) * 3.2 * dt;
    }
    this.mesh.rotation.y = Math.atan2(dx, dz);
    aimPose(this.mesh);
    this.shootCd -= dt;
    if (d < 26 && this.shootCd <= 0) {
      this.shootCd = 1.6 + this.rng() * 0.8;
      onShoot(d < 20);
    }
  }
}
