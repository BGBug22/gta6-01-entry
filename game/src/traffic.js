import * as THREE from 'three';
import { WORLD, CAR_MODELS } from './config.js';
import { makeRng, pick, range, clamp } from './random.js';
import { Car } from './vehicles.js';
import { makeHuman, walkPose } from './human.js';
const ROADS = [];
for (let i = -4; i <= 4; i++) ROADS.push(i * WORLD.roadGap);
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
      const p = this.car.pos;
      if (Math.abs(p.x) > WORLD.halfSize || Math.abs(p.z) > WORLD.halfSize) {
        this.car.heading += Math.PI;
        this.car.mesh.rotation.y = this.car.heading;
      }
    }
    const road = this.horizontal
      ? Math.round(this.car.pos.z / WORLD.roadGap) * WORLD.roadGap + 3.5 * this.dir
      : Math.round(this.car.pos.x / WORLD.roadGap) * WORLD.roadGap + 3.5 * this.dir;
    if (this.horizontal) this.car.pos.z += clamp(road - this.car.pos.z, -1, 1) * dt * 2;
    else this.car.pos.x += clamp(road - this.car.pos.x, -1, 1) * dt * 2;
  }
}
const PED_COLORS = [0xff8fa3, 0x90dbf4, 0xffe66d, 0x95d5b2, 0xf7aef8, 0xcaf0f8, 0xffb703];
const SKIN_TONES = [0xf1c27d, 0x8a5a2b, 0xe8b98a, 0x6b4423, 0xc68642];
const HAT_COLORS = [0xffd23f, 0xe63946, 0x4361ee, 0x2a9d8f, 0xffffff, 0xf72585];
export class Pedestrian {
  constructor(scene, rng) {
    const color = pick(rng, PED_COLORS);
    const skin = pick(rng, SKIN_TONES);
    const hat = rng() < 0.5;
    const pack = rng() < 0.4;
    this.mesh = makeHuman({
      skin,
      jacket: color,
      pants: pick(rng, [0x2b3a55, 0x3a3a3a, 0x5a4a3a, 0x2a4a3a]),
      hair: pick(rng, [0x2b2b3a, 0x6b4423, 0x111111, 0x8a5a2b]),
      cap: hat,
      capColor: pick(rng, HAT_COLORS),
    });
    if (pack) {
      const bp = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.5, 0.2),
        new THREE.MeshLambertMaterial({ color: pick(rng, HAT_COLORS) }),
      );
      bp.position.set(0, 1.25, -0.26);
      this.mesh.add(bp);
    }
    const h = range(rng, 0.9, 1.12);
    this.mesh.scale.set(1, h, 1);
    const x = range(rng, -WORLD.halfSize, WORLD.halfSize);
    const z = range(rng, -WORLD.halfSize, WORLD.halfSize);
    this.mesh.position.set(x, 0, z);
    this.target = this.newTarget(rng);
    this.speed = range(rng, 1.2, 2.2);
    this.fleeing = false;
    this.health = 100;
    this.animT = 0;
    scene.add(this.mesh);
  }
  newTarget(rng) {
    return { x: range(rng, -WORLD.halfSize, WORLD.halfSize), z: range(rng, -WORLD.halfSize, WORLD.halfSize) };
  }
  update(dt, rng, danger) {
    this.animT += dt;
    const p = this.mesh.position;
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
    walkPose(this.mesh, this.animT, this.fleeing ? 1.6 : 1);
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
