// Vehicles — sporty 3D car factory (body, cabin, wheels, lights) + driving state.
// Player cars, traffic cars, and police cars all use this factory.
// v5: low/wide sporty body with a sloped hood, glossy windshield, visible
// fenders, a rear spoiler, glowing brake lights, headlight beams, and a
// bright red/blue police lightbar.
import * as THREE from 'three';
import { CAR_MODELS } from './config.js';

function lam(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}
function phong(color, shininess = 90) {
  return new THREE.MeshPhongMaterial({ color, shininess, specular: 0x888888 });
}

export function makeCarMesh(model, opts = {}) {
  const g = new THREE.Group();
  const sporty = model.id === 'sport' || model.id === 'coupe';
  const bodyMat = phong(model.color, sporty ? 120 : 60);
  // low/wide main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.62, 4.5), bodyMat);
  body.position.y = 0.58; g.add(body);
  // sloped hood (front, lower) — the sporty wedge
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.34, 1.5), bodyMat);
  hood.position.set(0, 0.78, 1.55); hood.rotation.x = 0.10; g.add(hood);
  // sloped rear deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.30, 1.1), bodyMat);
  deck.position.set(0, 0.76, -1.65); deck.rotation.x = -0.08; g.add(deck);
  // glossy dark windshield + rear glass
  const glassMat = phong(0x0d1622, 160);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.62, 0.12), glassMat);
  windshield.position.set(0, 1.05, 0.75); windshield.rotation.x = -0.42; g.add(windshield);
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.12), glassMat);
  rearGlass.position.set(0, 1.02, -1.05); rearGlass.rotation.x = 0.38; g.add(rearGlass);
  // roof (low, sporty)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 1.6), bodyMat);
  roof.position.set(0, 1.32, -0.15); g.add(roof);
  // side skirts
  for (const sx of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 3.4), lam(0x1a1a1a));
    skirt.position.set(sx * 1.02, 0.32, 0); g.add(skirt);
  }
  // fenders over the wheels (visible arches)
  const fenderMat = bodyMat;
  for (const [x, z] of [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]]) {
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 1.0), fenderMat);
    fender.position.set(x, 0.82, z); g.add(fender);
  }
  // wheels — bigger, with a hubcap disc
  const wheelMat = lam(0x111111);
  const hubMat = lam(0xcccccc);
  const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 12);
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.36, 10);
  const wheels = [];
  for (const [x, z] of [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.44, z);
    g.add(w); wheels.push(w);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.z = Math.PI / 2; hub.position.set(x, 0.44, z);
    g.add(hub);
  }
  // headlights (bright) + light beams (translucent cones, forward)
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6c9 });
  for (const x of [-0.68, 0.68]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1), headMat);
    h.position.set(x, 0.62, 2.28); g.add(h);
  }
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff2c9, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false,
  });
  const beamGeo = new THREE.ConeGeometry(0.9, 7, 10, 1, true);
  for (const x of [-0.68, 0.68]) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = -Math.PI / 2 - 0.06; // point forward (+z)
    beam.position.set(x, 0.55, 5.6);
    g.add(beam);
  }
  // brake lights (glowing red bar) + reverse lights
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 0.08), tailMat);
  tailBar.position.set(0, 0.66, -2.28); g.add(tailBar);
  const tailGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.30, side: THREE.DoubleSide, depthWrite: false }),
  );
  tailGlow.position.set(0, 0.66, -2.34); g.add(tailGlow);
  // rear spoiler (sporty models)
  if (sporty) {
    for (const sx of [-0.7, 0.7]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.12), lam(0x1a1a1a));
      strut.position.set(sx, 1.0, -2.05); g.add(strut);
    }
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 0.5), lam(0x1a1a1a));
    wing.position.set(0, 1.14, -2.05); wing.rotation.x = -0.12; g.add(wing);
  }
  if (opts.police) {
    // lightbar: white base + bright red/blue beacons with glow
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 0.5), lam(0xffffff));
    bar.position.set(0, 1.48, -0.15); g.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    red.position.set(-0.32, 1.5, -0.15); g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x2244ff }));
    blue.position.set(0.32, 1.5, -0.15); g.add(blue);
    const glowR = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
    );
    glowR.position.set(-0.32, 1.5, -0.15); g.add(glowR);
    const glowB = glowR.clone();
    glowB.material = new THREE.MeshBasicMaterial({ color: 0x3355ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
    glowB.position.set(0.32, 1.5, -0.15); g.add(glowB);
    g.userData.lightBar = { red, blue };
  }
  if (opts.taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    sign.position.set(0, 1.55, -0.15); g.add(sign);
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
    this.stolen = false; // stolen once by the player (raises wanted once)
    this.isPolice = !!opts.police;
    this.isTaxi = !!opts.taxi;
    this.condition = 100; // car condition 0–100: drops on crashes / police rams
    scene.add(this.mesh);
  }
  get pos() { return this.mesh.position; }
  // Arcade physics: gas, brake, steer. dt seconds. Returns the speed.
  drive(throttle, steerInput, dt, maxSpeedMul = 1) {
    const max = this.model.speed * maxSpeedMul;
    const accel = this.model.accel;
    if (throttle > 0) this.speed += accel * throttle * dt;
    else if (throttle < 0) this.speed += accel * 1.6 * throttle * dt; // brake / reverse
    else this.speed *= Math.pow(0.4, dt); // friction
    if (this.speed > max) this.speed = max;
    if (this.speed < -max * 0.35) this.speed = -max * 0.35;
    const steerTarget = steerInput * 0.55 * Math.min(1, Math.abs(this.speed) / 8);
    this.steer += (steerTarget - this.steer) * Math.min(1, dt * 8);
    this.heading += this.steer * (this.speed / max) * dt * 2.2 * Math.sign(this.speed || 1);
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    this.mesh.position.x += fx * this.speed * dt;
    this.mesh.position.z += fz * this.speed * dt;
    this.mesh.rotation.y = this.heading;
    // wheels spin
    const spin = (this.speed * dt) / 0.44;
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
