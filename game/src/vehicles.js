// Kendaraan — pabrik mobil 3D (bodi, kabin, roda, lampu) + state mengemudi.
// Mobil pemain, mobil lalu lintas, dan mobil polisi semuanya memakai pabrik ini.
import * as THREE from 'three';
import { CAR_MODELS } from './config.js';

export function makeCarMesh(model, opts = {}) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: model.color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.4), bodyMat);
  body.position.y = 0.65; g.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.7, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x1c2733, transparent: true, opacity: 0.85 }),
  );
  cabin.position.set(0, 1.35, -0.2); g.add(cabin);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10);
  const wheels = [];
  for (const [x, z] of [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.42, z);
    g.add(w); wheels.push(w);
  }
  // lampu depan + belakang
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6c9 });
  for (const x of [-0.7, 0.7]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.1), headMat);
    h.position.set(x, 0.7, 2.22); g.add(h);
  }
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  for (const x of [-0.7, 0.7]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.1), tailMat);
    t.position.set(x, 0.7, -2.22); g.add(t);
  }
  if (opts.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xffffff }));
    bar.position.set(0, 1.78, -0.2); g.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    red.position.set(-0.3, 1.78, -0.2); g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x2244ff }));
    blue.position.set(0.3, 1.78, -0.2); g.add(blue);
    g.userData.lightBar = { red, blue };
  }
  if (opts.taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    sign.position.set(0, 1.85, -0.2); g.add(sign);
  }
  g.userData.wheels = wheels;
  return g;
}

export class Car {
  constructor(scene, model, x, z, heading, opts = {}) {
    this.model = model;
    this.mesh = makeCarMesh(model, opts);
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = heading;
    this.heading = heading;
    this.speed = 0;
    this.steer = 0;
    this.opts = opts;
    this.stolen = false; // pernah dicuri pemain (menaikkan wanted sekali)
    this.isPolice = !!opts.police;
    this.isTaxi = !!opts.taxi;
    scene.add(this.mesh);
  }
  get pos() { return this.mesh.position; }
  // Fisika arcade: gas, rem, belok. dt detik. Mengembalikan kecepatan.
  drive(throttle, steerInput, dt, maxSpeedMul = 1) {
    const max = this.model.speed * maxSpeedMul;
    const accel = this.model.accel;
    if (throttle > 0) this.speed += accel * throttle * dt;
    else if (throttle < 0) this.speed += accel * 1.6 * throttle * dt; // rem/mundur
    else this.speed *= Math.pow(0.4, dt); // gesekan
    if (this.speed > max) this.speed = max;
    if (this.speed < -max * 0.35) this.speed = -max * 0.35;
    const steerTarget = steerInput * 0.55 * Math.min(1, Math.abs(this.speed) / 8);
    this.steer += (steerTarget - this.steer) * Math.min(1, dt * 8);
    this.heading += this.steer * (this.speed / max) * dt * 2.2 * Math.sign(this.speed || 1);
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    this.mesh.position.x += fx * this.speed * dt;
    this.mesh.position.z += fz * this.speed * dt;
    this.mesh.rotation.y = this.heading;
    // roda berputar
    const spin = (this.speed * dt) / 0.42;
    for (const w of this.mesh.userData.wheels) w.rotation.x += spin;
    return this.speed;
  }
  stop() { this.speed = 0; }
  kmh() { return Math.abs(this.speed) * 3.6; }
}

export function nearestCar(cars, x, z, maxDist) {
  let best = null, bestD = maxDist * maxDist;
  for (const c of cars) {
    const dx = c.pos.x - x, dz = c.pos.z - z, d = dx * dx + dz * dz;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
