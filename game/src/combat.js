// Combat — pukulan (F) + pistol (klik kiri, tombol 1/2 ganti senjata).
// Musuh dermaga (misi 7): kapsul merah yang menembak balik dari jarak dekat.
import * as THREE from 'three';

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.weapon = 'fist'; // fist | pistol
    this.ammo = 0;
    this.hasPistol = false;
    this.cooldown = 0;
    this.tracer = null;
  }
  buyPistol() { this.hasPistol = true; this.ammo += 12; }
  buyAmmo() { if (this.hasPistol) this.ammo += 12; }
  update(dt) { this.cooldown = Math.max(0, this.cooldown - dt); }
  // Pukulan: musuh/pejalan kaki dalam 2,2 m di depan pemain.
  punch(player, targets, onHit) {
    if (this.cooldown > 0) return false;
    this.cooldown = 0.45;
    const fx = Math.sin(player.heading), fz = Math.cos(player.heading);
    for (const t of targets) {
      const dx = t.pos.x - player.pos.x, dz = t.pos.z - player.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 2.4 && (dx * fx + dz * fz) > 0) { onHit(t, 34); return true; }
    }
    return false;
  }
  // Tembakan: raycast sederhana ke target terdekat di arah kamera.
  shoot(player, camera, targets, onHit) {
    if (this.weapon !== 'pistol' || !this.hasPistol) return 'no-weapon';
    if (this.ammo <= 0) return 'no-ammo';
    if (this.cooldown > 0) return 'cooling';
    this.cooldown = 0.35;
    this.ammo -= 1;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = camera.position.clone();
    let best = null, bestT = 120;
    for (const t of targets) {
      const to = new THREE.Vector3(t.pos.x - origin.x, 1.2 - origin.y, t.pos.z - origin.z);
      const dist = to.length();
      if (dist > 90) continue;
      const cos = to.normalize().dot(dir);
      if (cos > 0.985 && dist < bestT) { bestT = dist; best = t; }
    }
    // garis tembak singkat
    this.showTracer(origin, dir, best ? bestT : 40);
    if (best) onHit(best, 50);
    return best ? 'hit' : 'miss';
  }
  showTracer(origin, dir, len) {
    if (this.tracer) this.scene.remove(this.tracer);
    const end = origin.clone().add(dir.clone().multiplyScalar(len));
    const geo = new THREE.BufferGeometry().setFromPoints([origin, end]);
    this.tracer = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe66d }));
    this.scene.add(this.tracer);
    setTimeout(() => { if (this.tracer) { this.scene.remove(this.tracer); this.tracer = null; } }, 70);
  }
}

// Musuh misi 7 — preman dermaga.
export class Enemy {
  constructor(scene, x, z) {
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.05, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0x9d0208 }));
    body.position.y = 1.05; this.mesh.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xf1c27d }));
    head.position.y = 2.1; this.mesh.add(head);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 10),
      new THREE.MeshLambertMaterial({ color: 0x111111 }));
    band.position.y = 2.32; this.mesh.add(band);
    this.mesh.position.set(x, 0, z);
    this.health = 100;
    this.shootCd = 1.5 + Math.random();
    this.pos = this.mesh.position;
    scene.add(this.mesh);
  }
  update(dt, playerPos, onShoot) {
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 14) {
      this.pos.x += (dx / d) * 3.2 * dt; this.pos.z += (dz / d) * 3.2 * dt;
    }
    this.mesh.rotation.y = Math.atan2(dx, dz);
    this.shootCd -= dt;
    if (d < 26 && this.shootCd <= 0) {
      this.shootCd = 1.6 + Math.random() * 0.8;
      onShoot(d < 20);
    }
  }
}
