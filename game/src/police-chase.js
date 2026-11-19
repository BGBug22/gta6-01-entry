import * as THREE from 'three';
import { GAME, WORLD } from './config.js';
import { clamp, angleTo, makeRng } from './random.js';
import { Car } from './vehicles.js';
import { makeHuman, walkPose } from './human.js';
import {
  policeCarCount, policeFootCount, helicopterWanted, decayWanted,
} from './wanted-level.js';

export const POLICE_MODEL = { id: 'police', name: 'Vela Patrol', color: 0x111111, speed: 40, accel: 20, price: 0 };

function makeFootCop() {
  const m = makeHuman({
    skin: 0xf1c27d,
    jacket: 0x1b263b,
    pants: 0x0d1b2a,
    hair: 0x111111,
    cap: true,
    capColor: 0x0d1b2a,
  });
  return m;
}

function makeHelicopter() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2, 8),
    new THREE.MeshLambertMaterial({ color: 0x1b263b }));
  body.position.y = 0; g.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 2.4),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ff }));
  glass.position.set(0, 0.3, 3); g.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 6),
    new THREE.MeshLambertMaterial({ color: 0x1b263b }));
  tail.position.set(0, 0.4, -6); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 1.6),
    new THREE.MeshLambertMaterial({ color: 0xe63946 }));
  fin.position.set(0, 1, -8.6); g.add(fin);
  const rotor = new THREE.Group();
  const bladeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  for (const a of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(13, 0.12, 0.7), bladeMat);
    blade.rotation.y = a; rotor.add(blade);
  }
  rotor.position.y = 1.6; g.add(rotor);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff2c9, transparent: true, opacity: 0.30,
    side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(13, 55, 16, 1, true), coneMat);
  beam.position.y = -28; g.add(beam);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.22,
    side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const inner = new THREE.Mesh(new THREE.ConeGeometry(6, 55, 12, 1, true), innerMat);
  inner.position.y = -28; g.add(inner);
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(11, 20),
    new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  pool.rotation.x = -Math.PI / 2; pool.position.y = -54.5; g.add(pool);
  const strobe = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.4),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  strobe.position.y = -1.2; g.add(strobe);
  g.userData.rotor = rotor;
  g.userData.strobe = strobe;
  g.userData.beam = beam;
  return g;
}

export class PoliceChase {
  constructor(scene) {
    this.scene = scene;
    this.rng = makeRng(WORLD.seed + 55);
    this.cars = [];
    this.foot = [];
    this.heli = null;
    this.wanted = 0;
    this.heat = 0;
    this.bustedTimer = 0;
    this.flashT = 0;
  }

  addWanted(n, reason) {
    this.wanted = clamp(this.wanted + n, 0, GAME.maxWanted);
    this.heat = 1;
    return reason;
  }

  policeCount() { return policeCarCount(this.wanted); }
  footCount() { return policeFootCount(this.wanted); }

  ensureUnits(playerPos) {
    const want = policeCarCount(this.wanted);
    while (this.cars.length < want) {
      const a = this.rng() * Math.PI * 2;
      const x = playerPos.x + Math.sin(a) * 45, z = playerPos.z + Math.cos(a) * 45;
      const car = new Car(this.scene, POLICE_MODEL, x, z, angleTo(x, z, playerPos.x, playerPos.z), { police: true });
      car.mesh.children[0].material = new THREE.MeshLambertMaterial({ color: 0xf8f9fa });
      this.cars.push(car);
    }
    const wantFoot = policeFootCount(this.wanted);
    while (this.foot.length < wantFoot) {
      const m = makeFootCop();
      const a = this.rng() * Math.PI * 2;
      m.position.set(playerPos.x + Math.sin(a) * 20, 0, playerPos.z + Math.cos(a) * 20);
      this.scene.add(m);
      this.foot.push({ mesh: m, speed: 4.2, animT: this.rng() * 10 });
    }
  }

  ensureHelicopter(playerPos) {
    if (!helicopterWanted(this.wanted)) {
      if (this.heli) { this.scene.remove(this.heli.mesh); this.heli = null; }
      return;
    }
    if (!this.heli) {
      const mesh = makeHelicopter();
      mesh.position.set(playerPos.x + 26, 55, playerPos.z);
      this.scene.add(mesh);
      this.heli = { mesh, angle: 0 };
    }
  }

  placeHelicopter(x, y, z, rotY) {
    if (!this.heli) return;
    this.heli.mesh.position.set(x, y, z);
    this.heli.mesh.rotation.y = rotY;
  }

  units(playerPos) {
    const rows = [];
    const names = ['VELA-11', 'AZUL-25', 'MARLIN-18', 'FARO-2', 'CORAL-7'];
    if (this.heli) {
      const d = Math.hypot(this.heli.mesh.position.x - playerPos.x, this.heli.mesh.position.z - playerPos.z);
      rows.push({ name: 'FARO-1', dist: Math.round(d), tactic: 'SEARCHLIGHT' });
    }
    this.cars.forEach((pc, i) => {
      const d = Math.hypot(pc.pos.x - playerPos.x, pc.pos.z - playerPos.z);
      const tactic = d < 22 ? 'RAMMING' : d < 40 ? 'BOXING IN' : d > 90 ? 'ROADBLOCK' : 'PURSUIT';
      rows.push({ name: names[i % names.length], dist: Math.round(d), tactic });
    });
    return rows;
  }

  removeUnit(list, i) {
    this.scene.remove(list[i].mesh || list[i].car?.mesh);
    list.splice(i, 1);
  }

  update(dt, player) {
    this.flashT += dt;
    const decayed = decayWanted(this.wanted, this.heat, dt);
    this.wanted = decayed.wanted;
    this.heat = decayed.heat;
    this.ensureUnits(player.pos);
    this.ensureHelicopter(player.pos);
    while (this.cars.length > policeCarCount(this.wanted)) this.removeUnit(this.cars, this.cars.length - 1);
    while (this.foot.length > policeFootCount(this.wanted)) this.removeUnit(this.foot, this.foot.length - 1);

    const px = player.pos.x, pz = player.pos.z;
    for (const pc of this.cars) {
      const dx = px - pc.pos.x, dz = pz - pc.pos.z;
      const d = Math.hypot(dx, dz);
      const targetHeading = angleTo(pc.pos.x, pc.pos.z, px, pz);
      let dh = targetHeading - pc.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const steer = clamp(dh * 2, -1, 1);
      const throttle = d > 6 ? 1 : 0.4;
      pc.drive(throttle, steer, dt, 1 + this.wanted * 0.06);
      const bar = pc.mesh.userData.lightBar;
      if (bar) {
        const on = Math.floor(this.flashT * 6) % 2 === 0;
        bar.red.material.color.setHex(on ? 0xff0000 : 0x550000);
        bar.blue.material.color.setHex(on ? 0x2244ff : 0x000055);
      }
      if (d < 4.5 && player.inCar) {
        player.damage(6 * dt * 10, 'rammed by police');
        if (player.car) player.car.condition = Math.max(40, player.car.condition - 0.4);
        pc.speed *= 0.5;
        player.car.pos.x += (dx / (d || 1)) * -2 * dt * 10;
        player.car.pos.z += (dz / (d || 1)) * -2 * dt * 10;
      }
      if (d > 180) {
        const a = this.rng() * Math.PI * 2;
        pc.pos.x = px + Math.sin(a) * 60; pc.pos.z = pz + Math.cos(a) * 60;
      }
    }
    if (this.heli) {
      const h = this.heli;
      h.angle += dt * 0.35;
      h.mesh.position.set(px + Math.cos(h.angle) * 26, 55, pz + Math.sin(h.angle) * 26);
      h.mesh.rotation.y = -h.angle + Math.PI / 2;
      h.mesh.userData.rotor.rotation.y += dt * 22;
      const on = Math.floor(this.flashT * 4) % 2 === 0;
      h.mesh.userData.strobe.material.color.setHex(on ? 0xff0000 : 0x2244ff);
    }
    let touching = false;
    for (const f of this.foot) {
      const p = f.mesh.position;
      const dx = px - p.x, dz = pz - p.z;
      const d = Math.hypot(dx, dz);
      if (!player.inCar && d > 1.2) {
        p.x += (dx / d) * f.speed * dt; p.z += (dz / d) * f.speed * dt;
        f.mesh.rotation.y = Math.atan2(dx, dz);
        f.animT += dt;
        walkPose(f.mesh, f.animT, 1.4);
      }
      if (!player.inCar && d < 1.6) touching = true;
    }
    if (touching) {
      this.bustedTimer += dt;
      if (this.bustedTimer > 2) { this.bustedTimer = 0; return 'busted'; }
    } else this.bustedTimer = 0;
    return null;
  }

  clearAll() {
    for (const c of this.cars) this.scene.remove(c.mesh);
    for (const f of this.foot) this.scene.remove(f.mesh);
    if (this.heli) this.scene.remove(this.heli.mesh);
    this.cars = []; this.foot = []; this.heli = null;
    this.wanted = 0; this.heat = 0; this.bustedTimer = 0;
  }
}
