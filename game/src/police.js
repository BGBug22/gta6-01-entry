// Polisi + wanted level — mobil polisi mengejar & menabrak, polisi jalan kaki
// mengejar & menangkap. Wanted 0–5 bintang; naik saat kejahatan, turun saat sembunyi.
import * as THREE from 'three';
import { GAME, WORLD } from './config.js';
import { clamp, angleTo } from './random.js';
import { Car } from './vehicles.js';

export const POLICE_MODEL = { id: 'police', name: 'Patroli Vela', color: 0x111111, speed: 40, accel: 20, price: 0 };

export class Police {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.foot = []; // polisi jalan kaki {mesh, speed}
    this.wanted = 0;
    this.heat = 0; // 0..1, memudar saat tidak ada kejahatan
    this.bustedTimer = 0;
    this.spawnCooldown = 0;
    this.flashT = 0;
  }
  addWanted(n, reason) {
    this.wanted = clamp(this.wanted + n, 0, GAME.maxWanted);
    this.heat = 1;
    return reason;
  }
  policeCount() { return this.wanted <= 1 ? 1 : this.wanted <= 3 ? 2 : 3; }
  footCount() { return this.wanted >= 2 ? this.wanted - 1 : 0; }

  ensureUnits(playerPos) {
    const want = this.wanted > 0 ? this.policeCount() : 0;
    while (this.cars.length < want) {
      const a = Math.random() * Math.PI * 2;
      const x = playerPos.x + Math.sin(a) * 45, z = playerPos.z + Math.cos(a) * 45;
      const car = new Car(this.scene, POLICE_MODEL, x, z, angleTo(x, z, playerPos.x, playerPos.z), { police: true });
      car.mesh.children[0].material = new THREE.MeshLambertMaterial({ color: 0xf8f9fa });
      this.cars.push(car);
    }
    const wantFoot = this.wanted > 0 ? this.footCount() : 0;
    while (this.foot.length < wantFoot) {
      const m = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.0, 4, 8),
        new THREE.MeshLambertMaterial({ color: 0x1b263b }));
      body.position.y = 1.0; m.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8),
        new THREE.MeshLambertMaterial({ color: 0xf1c27d }));
      head.position.y = 2.05; m.add(head);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 10),
        new THREE.MeshLambertMaterial({ color: 0x0d1b2a }));
      cap.position.y = 2.3; m.add(cap);
      const a = Math.random() * Math.PI * 2;
      m.position.set(playerPos.x + Math.sin(a) * 20, 0, playerPos.z + Math.cos(a) * 20);
      this.scene.add(m);
      this.foot.push({ mesh: m, speed: 4.2 });
    }
  }

  removeUnit(list, i) {
    this.scene.remove(list[i].mesh || list[i].car?.mesh);
    list.splice(i, 1);
  }

  update(dt, player) {
    this.flashT += dt;
    // wanted memudar kalau pemain tidak berbuat jahat & jauh dari polisi
    if (this.wanted > 0) {
      this.heat -= dt * 0.03;
      if (this.heat <= 0) { this.wanted = Math.max(0, this.wanted - 1); this.heat = this.wanted > 0 ? 0.7 : 0; }
    }
    this.ensureUnits(player.pos);
    // kurangi unit kalau wanted turun
    while (this.cars.length > this.policeCount()) this.removeUnit(this.cars, this.cars.length - 1);
    while (this.foot.length > this.footCount()) this.removeUnit(this.foot, this.foot.length - 1);

    const px = player.pos.x, pz = player.pos.z;
    // mobil polisi: kejar pemain, tabrak kalau dekat
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
      // lampu strobo
      const bar = pc.mesh.userData.lightBar;
      if (bar) {
        const on = Math.floor(this.flashT * 6) % 2 === 0;
        bar.red.material.color.setHex(on ? 0xff0000 : 0x550000);
        bar.blue.material.color.setHex(on ? 0x2244ff : 0x000055);
      }
      // tabrakan dengan mobil pemain
      if (d < 4.5 && player.inCar) {
        player.damage(6 * dt * 10, 'ditabrak polisi');
        pc.speed *= 0.5;
        // dorong mobil pemain
        player.car.pos.x += (dx / (d || 1)) * -2 * dt * 10;
        player.car.pos.z += (dz / (d || 1)) * -2 * dt * 10;
      }
      // polisi terlalu jauh -> teleport mendekat (tetap dalam jarak kejar)
      if (d > 180) {
        const a = Math.random() * Math.PI * 2;
        pc.pos.x = px + Math.sin(a) * 60; pc.pos.z = pz + Math.cos(a) * 60;
      }
    }
    // polisi jalan kaki: kejar & tangkap kalau pemain jalan kaki
    let touching = false;
    for (const f of this.foot) {
      const p = f.mesh.position;
      const dx = px - p.x, dz = pz - p.z;
      const d = Math.hypot(dx, dz);
      if (!player.inCar && d > 1.2) {
        p.x += (dx / d) * f.speed * dt; p.z += (dz / d) * f.speed * dt;
        f.mesh.rotation.y = Math.atan2(dx, dz);
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
    this.cars = []; this.foot = [];
    this.wanted = 0; this.heat = 0; this.bustedTimer = 0;
  }
}
