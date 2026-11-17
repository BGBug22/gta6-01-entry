// Misi cerita + aktivitas sampingan — rantai 8 misi "Tiga Hari di Velamar",
// taksi dadakan, dan balapan jalanan yang bisa diulang. Setiap misi punya
// objektif, target di peta, timer opsional, hadiah, dan layar selesai/gagal.
import * as THREE from 'three';
import { MISSIONS, CAR_MODELS, GAME } from './config.js';
import { dist2 } from './random.js';

export class MissionSystem {
  constructor(scene, onEvent) {
    this.scene = scene;
    this.onEvent = onEvent; // (type, data) -> 'complete' | 'fail' | 'start' | 'info'
    this.index = 0; // misi aktif (0..7), 8 = semua selesai
    this.state = 'idle'; // idle | active | done | failed
    this.timer = 0;
    this.gates = []; // gerbang balapan {x,z,passed,mesh}
    this.gateIndex = 0;
    this.taxi = null; // {ped, pickup, drop}
    this.combatTargets = [];
    this.raceActive = false;
    this.escapeStartWanted = 0;
    this.marker = this.makeMarker();
    scene.add(this.marker);
  }
  makeMarker() {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 60, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    );
    beam.position.y = 30; g.add(beam);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.5, 3.4, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.15; g.add(ring);
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 2.4, 4),
      new THREE.MeshBasicMaterial({ color: 0xffd23f }),
    );
    arrow.position.y = 12; arrow.rotation.x = Math.PI; g.add(arrow);
    g.visible = false;
    return g;
  }
  current() { return MISSIONS[this.index] || null; }
  start() {
    const m = this.current();
    if (!m) return;
    this.state = 'active';
    this.timer = m.time || 0;
    this.gateIndex = 0;
    this.taxi = null;
    this.clearGates();
    if (m.type === 'race') this.buildRaceGates();
    this.onEvent('start', m);
  }
  clearGates() {
    for (const g of this.gates) this.scene.remove(g.mesh);
    this.gates = [];
  }
  buildRaceGates() {
    const pts = [
      { x: 80, z: 0 }, { x: 80, z: 160 }, { x: -80, z: 160 }, { x: -80, z: -80 },
    ];
    for (const p of pts) {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(5, 0.5, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0x4cc9f0 }),
      );
      mesh.position.set(p.x, 5, p.z);
      this.scene.add(mesh);
      this.gates.push({ ...p, passed: false, mesh });
    }
  }
  targetPos() {
    const m = this.current();
    if (!m) return null;
    if (m.type === 'race' && this.gates[this.gateIndex]) return this.gates[this.gateIndex];
    if (m.type === 'taxi' && this.taxi) return this.taxi.stage === 'pickup' ? this.taxi.pickup : this.taxi.drop;
    return m.target;
  }
  complete(game) {
    const m = this.current();
    this.state = 'done';
    this.clearGates();
    this.marker.visible = false;
    game.money += m.reward;
    this.index += 1; // naik dulu supaya save mencatat misi berikutnya
    this.state = 'idle';
    this.onEvent('complete', m);
  }
  fail(reason) {
    this.state = 'failed';
    this.clearGates();
    this.marker.visible = false;
    this.onEvent('fail', { mission: this.current(), reason });
    this.state = 'idle';
  }
  // Dipanggil tiap frame. game = objek game utama (player, police, dll).
  update(dt, game) {
    const m = this.current();
    if (!m || this.state !== 'active') return;
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) { this.fail('Waktu habis!'); return; }
    }
    const p = game.player.pos;
    const t = this.targetPos();
    if (t) {
      this.marker.visible = true;
      this.marker.position.set(t.x, 0, t.z);
      this.marker.rotation.y += dt * 2;
      this.marker.children[2].position.y = 12 + Math.sin(performance.now() * 0.004) * 1.2;
    }
    const near = (x, z, r = 7) => dist2(p.x, p.z, x, z) < r * r;

    switch (m.type) {
      case 'goto':
      case 'hotdrop':
        if (near(m.target.x, m.target.z, 8)) this.complete(game);
        break;
      case 'taxi': {
        if (!this.taxi) {
          // penumpang muncul di target misi
          this.taxi = { stage: 'pickup', pickup: m.target, drop: { x: -292, z: -240 } };
          game.spawnTaxiPassenger(m.target.x, m.target.z);
        }
        if (this.taxi.stage === 'pickup' && near(m.target.x, m.target.z, 6) && game.player.inCar) {
          this.taxi.stage = 'drop';
          this.onEvent('info', { text: 'Penumpang naik! Antar ke Faro Vela.' });
        } else if (this.taxi.stage === 'drop' && near(-292, -240, 8)) {
          game.removeTaxiPassenger();
          this.complete(game);
        }
        break;
      }
      case 'race': {
        const gate = this.gates[this.gateIndex];
        if (gate && near(gate.x, gate.z, 8)) {
          gate.passed = true;
          gate.mesh.material.color.setHex(0x7ee081);
          this.gateIndex += 1;
          this.onEvent('info', { text: `Gerbang ${this.gateIndex}/4 dilewati!` });
          if (this.gateIndex >= this.gates.length) this.complete(game);
        }
        break;
      }
      case 'steal': {
        const targetCar = game.stealTarget;
        if (targetCar && game.player.inCar && game.player.car === targetCar) {
          // bawa ke garasi
          this.marker.position.set(-80, 0, -200);
          if (near(-80, -200, 8)) this.complete(game);
        }
        break;
      }
      case 'escape': {
        if (this.escapeStartWanted === 0) this.escapeStartWanted = game.police.wanted;
        if (game.police.wanted >= 3) this.escapeStartWanted = 3;
        if (this.escapeStartWanted >= 3 && game.police.wanted === 0) this.complete(game);
        break;
      }
      case 'combat':
        if (game.enemies.length === 0 && game.combatStarted) this.complete(game);
        break;
      case 'finale':
        if (game.police.wanted >= 4 && near(m.target.x, m.target.z, 9)) this.complete(game);
        break;
      default: break;
    }
  }
}

// Aktivitas sampingan: taksi dadakan (naik penumpang acak, antar, dibayar)
// dan balapan jalanan cepat. Dipanggil dari main.js lewat tombol T / R.
export class SideActivities {
  constructor() { this.taxiFare = null; this.raceTimer = 0; }
  startTaxiFare(game) {
    const spots = [{ x: 120, z: -80 }, { x: -40, z: 120 }, { x: 200, z: -40 }, { x: 0, z: 200 }];
    const a = spots[Math.floor(Math.random() * spots.length)];
    const b = spots[Math.floor(Math.random() * spots.length)];
    this.taxiFare = { pickup: a, drop: b, stage: 'pickup', pay: 80 };
    return this.taxiFare;
  }
}
export { CAR_MODELS, GAME };
