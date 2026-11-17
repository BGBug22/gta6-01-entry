// Lalu lintas + pejalan kaki — mobil AI mengikuti jalan grid, pejalan kaki
// berjalan di trotoar. Sederhana tapi hidup: berhenti kalau ada mobil di depan.
import * as THREE from 'three';
import { WORLD, CAR_MODELS } from './config.js';
import { makeRng, pick, range, clamp } from './random.js';
import { Car } from './vehicles.js';

const ROADS = [];
for (let i = -4; i <= 4; i++) ROADS.push(i * WORLD.roadGap);

// Satu mobil lalu lintas: jalan lurus di satu jalan, belok di ujung kota.
export class TrafficCar {
  constructor(scene, rng) {
    const model = pick(rng, CAR_MODELS.filter((m) => m.id !== 'sport'));
    const horizontal = rng() < 0.5;
    const road = pick(rng, ROADS);
    const dir = rng() < 0.5 ? 1 : -1;
    const lane = 3.5;
    const x = horizontal ? range(rng, -WORLD.halfSize, WORLD.halfSize) : road + lane * dir;
    const z = horizontal ? road + lane * dir : range(rng, -WORLD.halfSize, WORLD.halfSize);
    const heading = horizontal ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
    this.car = new Car(scene, model, x, z, heading);
    this.horizontal = horizontal;
    this.dir = dir;
    this.cruise = range(rng, 10, 16);
    this.wait = 0;
  }
  update(dt, others) {
    // berhenti kalau ada mobil lain dekat di depan
    let blocked = false;
    const fx = Math.sin(this.car.heading), fz = Math.cos(this.car.heading);
    for (const o of others) {
      if (o === this.car) continue;
      const dx = o.pos.x - this.car.pos.x, dz = o.pos.z - this.car.pos.z;
      const ahead = dx * fx + dz * fz;
      const side = Math.abs(dx * fz - dz * fx);
      if (ahead > 0 && ahead < 9 && side < 2.5) { blocked = true; break; }
    }
    if (blocked) { this.car.speed *= Math.pow(0.1, dt); }
    else {
      this.car.speed += (this.cruise - this.car.speed) * Math.min(1, dt * 1.5);
      this.car.drive(0, 0, dt);
      // belok di ujung: putar balik arah jalan lain (pilih jalan baru)
      const p = this.car.pos;
      if (Math.abs(p.x) > WORLD.halfSize || Math.abs(p.z) > WORLD.halfSize) {
        this.car.heading += Math.PI;
        this.car.mesh.rotation.y = this.car.heading;
      }
    }
    // jaga tetap di jalan: koreksi halus ke garis jalan
    const road = this.horizontal
      ? Math.round(this.car.pos.z / WORLD.roadGap) * WORLD.roadGap + 3.5 * this.dir
      : Math.round(this.car.pos.x / WORLD.roadGap) * WORLD.roadGap + 3.5 * this.dir;
    if (this.horizontal) this.car.pos.z += clamp(road - this.car.pos.z, -1, 1) * dt * 2;
    else this.car.pos.x += clamp(road - this.car.pos.x, -1, 1) * dt * 2;
  }
}

// Pejalan kaki: kapsul berwarna + kepala + topi/kunci variasi, jalan di trotoar.
const PED_COLORS = [0xff8fa3, 0x90dbf4, 0xffe66d, 0x95d5b2, 0xf7aef8, 0xcaf0f8, 0xffb703, 0xff5d8f, 0x4cc9f0];
const PED_SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const PED_HATS = [0xffd23f, 0xe63946, 0x4361ee, 0x2a9d8f, 0xffffff, null, null];
export class Pedestrian {
  constructor(scene, rng) {
    this.mesh = new THREE.Group();
    const color = pick(rng, PED_COLORS);
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 1.0, 4, 8),
      new THREE.MeshLambertMaterial({ color }),
    );
    body.position.y = 1.0; this.mesh.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshLambertMaterial({ color: pick(rng, PED_SKINS) }),
    );
    head.position.y = 2.05; this.mesh.add(head);
    // topi / variasi: ~60% bertopi, tinggi badan bervariasi
    const hat = pick(rng, PED_HATS);
    if (hat !== null) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.16, 10),
        new THREE.MeshLambertMaterial({ color: hat }));
      cap.position.y = 2.32; this.mesh.add(cap);
    }
    // ransel di sebagian pejalan kaki
    if (rng() < 0.3) {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25),
        new THREE.MeshLambertMaterial({ color: pick(rng, PED_COLORS) }));
      pack.position.set(0, 1.2, -0.5); this.mesh.add(pack);
    }
    const s = 0.88 + rng() * 0.28;
    this.mesh.scale.set(s, s, s);
    const x = range(rng, -WORLD.halfSize, WORLD.halfSize);
    const z = range(rng, -WORLD.halfSize, WORLD.halfSize);
    this.mesh.position.set(x, 0, z);
    this.target = this.newTarget(rng);
    this.speed = range(rng, 1.2, 2.2);
    this.fleeing = false;
    this.health = 100;
    scene.add(this.mesh);
  }
  newTarget(rng) {
    return { x: range(rng, -WORLD.halfSize, WORLD.halfSize), z: range(rng, -WORLD.halfSize, WORLD.halfSize) };
  }
  update(dt, rng, danger) {
    const p = this.mesh.position;
    // lari menjauh dari bahaya (tembakan / mobil ngebut dekat)
    let tx = this.target.x, tz = this.target.z;
    if (danger && Math.hypot(danger.x - p.x, danger.z - p.z) < 18) {
      tx = p.x + (p.x - danger.x) * 2; tz = p.z + (p.z - danger.z) * 2;
      this.fleeing = true;
    } else this.fleeing = false;
    const dx = tx - p.x, dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 3) { this.target = this.newTarget(rng); return; }
    const sp = this.speed * (this.fleeing ? 2.6 : 1);
    p.x += (dx / d) * sp * dt; p.z += (dz / d) * sp * dt;
    this.mesh.rotation.y = Math.atan2(dx, dz);
    // animasi jalan: goyang ringan
    this.mesh.children[0].position.y = 1.0 + Math.abs(Math.sin(performance.now() * 0.008 + p.x)) * 0.08;
  }
}

export function spawnTraffic(scene, count) {
  const rng = makeRng(WORLD.seed + 7);
  const list = [];
  for (let i = 0; i < count; i++) list.push(new TrafficCar(scene, rng));
  return list;
}
export function spawnPedestrians(scene, count) {
  const rng = makeRng(WORLD.seed + 21);
  const list = [];
  for (let i = 0; i < count; i++) list.push(new Pedestrian(scene, rng));
  return list;
}
