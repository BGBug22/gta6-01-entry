// VELAMAR — open-world crime game. Titik masuk: membangun dunia, loop utama,
// kontrol pemain (jalan kaki + mobil), wanted/polisi, misi, combat, toko, save.
import * as THREE from 'three';
import { WORLD, DISTRICTS, CAR_MODELS, SHOPS, MISSIONS, GAME } from './config.js';
import { makeRng, pick, range, clamp, dist2 } from './random.js';
import { buildCity, resolveColliders } from './city.js';
import { Car, nearestCar } from './vehicles.js';
import { spawnTraffic, spawnPedestrians } from './traffic.js';
import { Police } from './police.js';
import { MissionSystem } from './missions.js';
import { Combat, Enemy } from './combat.js';
import { Hud } from './hud.js';
import { Minimap } from './minimap.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { loadSave, writeSave, clearSave } from './save.js';
import { parseShot, stageShot } from './shots.js';

class Player {
  constructor(scene) {
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.0, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a9d8f }));
    body.position.y = 1.05; this.mesh.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xf1c27d }));
    head.position.y = 2.1; this.mesh.add(head);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 10),
      new THREE.MeshLambertMaterial({ color: 0xffd23f }));
    cap.position.y = 2.32; this.mesh.add(cap);
    this.mesh.position.set(20, 0, 20);
    this.pos = this.mesh.position;
    this.heading = 0;
    this.health = GAME.startHealth;
    this.inCar = false;
    this.car = null;
    this.walkBob = 0;
    scene.add(this.mesh);
  }
  damage(amount, cause) {
    this.health -= amount;
    return this.health <= 0;
  }
}

class Game {
  constructor() {
    const canvas = document.getElementById('c');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1500);
    this.input = new Input(canvas);
    this.hud = new Hud();
    this.minimap = new Minimap(document.getElementById('minimap'));
    this.sound = new SoundBank();
    this.started = false;
    this.paused = false;
    this.frozen = false;
    this.shotMode = null;
    this.money = GAME.startMoney;
    this.ownedCars = [];
    this.enemies = [];
    this.combatStarted = false;
    this.stealTarget = null;
    this.taxiFare = null;
    this.taxiPassenger = null;
    this.cameraYaw = Math.PI;
    this.cameraPitch = 0.3;
    this.camDist = 10;

    const { colliders } = buildCity(this.scene);
    this.colliders = colliders;
    this.traffic = spawnTraffic(this.scene, 12);
    this.peds = spawnPedestrians(this.scene, 22);
    this.parked = this.spawnParkedCars();
    this.player = new Player(this.scene);
    this.police = new Police(this.scene);
    this.combat = new Combat(this.scene);
    this.missions = new MissionSystem(this.scene, (t, d) => this.onMissionEvent(t, d));
    this.rng = makeRng(WORLD.seed + 99);

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyM') this.tryStartMission(); });
    this.showStartScreen();
    this.last = performance.now();
    this.frames = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  spawnParkedCars() {
    const rng = makeRng(WORLD.seed + 33);
    // Mobil parkir SELALU di jalan (bukan tengah blok) dengan heading searah jalan,
    // supaya bisa langsung dikendarai tanpa nyangkut di gedung.
    const spots = [
      { x: -200, z: 0, h: Math.PI / 2 }, { x: -120, z: 0, h: Math.PI / 2 },
      { x: 120, z: 0, h: Math.PI / 2 }, { x: 200, z: 0, h: Math.PI / 2 },
      { x: 0, z: -200, h: 0 }, { x: 0, z: 200, h: 0 },
      { x: -160, z: 80, h: Math.PI / 2 }, { x: 160, z: 80, h: Math.PI / 2 },
      { x: 80, z: -160, h: 0 }, { x: 80, z: 160, h: 0 },
    ];
    const list = [];
    for (const s of spots) {
      const model = pick(rng, CAR_MODELS);
      const car = new Car(this.scene, model,
        s.x + range(rng, -3, 3), s.z + range(rng, -3, 3), s.h);
      list.push(car);
    }
    return list;
  }

  playerCar(model, x, z, heading) {
    const car = new Car(this.scene, model, x, z, heading);
    this.parked.push(car);
    return car;
  }

  // ---------- layar ----------
  showStartScreen() {
    const save = loadSave();
    const txt = save
      ? `Save ditemukan: <b>$${save.money}</b> • Misi <b>${save.mission + 1}/8</b> • ${save.hasPistol ? 'Pistol dimiliki' : 'Belum punya pistol'}<br>` +
        `Curi mobil apa pun, kabur dari kejaran polisi 3 bintang sebelum waktu habis.<br>` +
        `8 misi cerita menantimu — dari pesan pertama Mara sampai pelarian terakhir di dermaga.`
      : `Curi mobil apa pun, kabur dari kejaran polisi 3 bintang sebelum waktu habis.<br>` +
        `8 misi cerita menantimu — dari pesan pertama Mara sampai pelarian terakhir di dermaga.<br>` +
        `Kota VELAMAR: pantai, mercusuar Faro Vela, lalu lintas, dan polisi yang tidak pernah tidur.`;
    const foot = save ? 'Tekan N untuk mulai dari awal (hapus save).' : 'Progres tersimpan otomatis di browser ini.';
    this.hud.showScreen('VELAMAR', txt, save ? '▶ LANJUTKAN' : '▶ MULAI MAIN', () => this.startGame(save));
    document.getElementById('screen-foot').textContent = foot;
    this.pendingSave = save;
  }
  startGame(save) {
    this.sound.ensure();
    if (save) {
      this.money = save.money;
      this.missions.index = Math.min(save.mission, MISSIONS.length - 1);
      if (save.hasPistol) { this.combat.hasPistol = true; this.combat.ammo = save.ammo || 0; }
      this.ownedCars = save.ownedCars || [];
    }
    this.started = true;
    this.hud.setMoney(this.money);
    this.hud.showMessage('Selamat datang di VELAMAR! Tekan M untuk misi pertama.');
    this.updateWeaponLine();
  }
  pauseGame() {
    if (!this.started || this.hud.screenVisible()) return;
    this.paused = true;
    this.hud.showScreen('JEDA', `Uang <b>$${this.money}</b> • Misi <b>${this.missions.index + 1}/8</b> • Wanted <b>${this.police.wanted}★</b><br>Progres tersimpan otomatis.`, '▶ LANJUTKAN', () => { this.paused = false; });
  }

  // ---------- misi ----------
  tryStartMission() {
    if (!this.started || this.paused || this.hud.screenVisible()) return;
    if (this.missions.state === 'active') {
      this.hud.showMessage('Misi sedang berjalan — selesaikan dulu!');
      return;
    }
    if (!this.missions.current()) {
      this.hud.showMessage('Semua 8 misi selesai! Kamu legenda Velamar. 🏆');
      return;
    }
    this.missions.start();
  }
  onMissionEvent(type, data) {
    if (type === 'start') {
      const m = data;
      this.sound.coin();
      this.hud.showMessage(`MISI ${m.id} — ${m.title}: ${m.text}`);
      if (m.type === 'steal') this.spawnStealTarget();
      if (m.type === 'combat') this.spawnEnemies();
      if (m.type === 'hotdrop') { this.police.addWanted(2, 'paket panas'); }
      if (m.type === 'finale') { this.police.addWanted(4, 'pelarian terakhir'); }
      if (m.type === 'escape') { this.police.addWanted(1, 'cari masalah'); }
    } else if (type === 'complete') {
      const m = data;
      this.sound.win();
      writeSave(this.saveState());
      const next = MISSIONS[this.missions.index];
      this.paused = true;
      this.hud.showScreen('MISI SELESAI!',
        `<b>${m.title}</b> — hadiah <b style="color:#ffd23f">$${m.reward}</b> &nbsp;•&nbsp; Total: <b>$${this.money}</b><br>` +
        (next ? `Misi berikutnya: <b>${next.title}</b> — ${next.text}` : 'Semua misi selesai. Kamu legenda Velamar! 🏆'),
        next ? 'LANJUTKAN' : 'MAIN BEBAS', () => { this.paused = false; });
    } else if (type === 'fail') {
      this.sound.fail();
      this.paused = true;
      this.hud.showScreen('MISI GAGAL', `${data.mission ? `<b>${data.mission.title}</b> — ` : ''}${data.reason}<br>Tekan M untuk mencoba lagi.`, 'COBA LAGI', () => { this.paused = false; });
    } else if (type === 'info') {
      this.sound.coin();
      this.hud.showMessage(data.text);
    }
  }
  saveState() {
    return { money: this.money, missionIndex: this.missions.index, hasPistol: this.combat.hasPistol, ammo: this.combat.ammo, ownedCars: this.ownedCars };
  }
  spawnStealTarget() {
    const model = CAR_MODELS.find((m) => m.id === 'sport');
    const car = new Car(this.scene, model, 190, -160, Math.PI / 2);
    car.stolen = false;
    this.parked.push(car);
    this.stealTarget = car;
    this.hud.showMessage('Cometa GT merah muda terparkir di Distrik Kaca. Curi dia!');
  }
  spawnEnemies() {
    this.combatStarted = true;
    const spots = [[-210, -120], [-190, -140], [-225, -100]];
    for (const [x, z] of spots) this.enemies.push(new Enemy(this.scene, x, z));
  }
  spawnTaxiPassenger(x, z) {
    this.removeTaxiPassenger();
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.0, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0xffd23f }));
    body.position.y = 1.05; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0x8a5a2b }));
    head.position.y = 2.1; g.add(head);
    g.position.set(x + 3, 0, z + 3);
    this.scene.add(g);
    this.taxiPassenger = g;
  }
  removeTaxiPassenger() {
    if (this.taxiPassenger) { this.scene.remove(this.taxiPassenger); this.taxiPassenger = null; }
  }

  // ---------- masuk / keluar mobil ----------
  enterCar(car) {
    const p = this.player;
    p.inCar = true; p.car = car;
    p.mesh.visible = false;
    if (!car.stolen && !this.ownedCars.includes(car)) {
      car.stolen = true;
      this.police.addWanted(1, 'curi mobil');
      this.hud.showMessage('Mobil dicuri! Wanted +1 ★ — polisi mengejarmu!');
      this.sound.horn();
    }
    // taksi: penumpang ikut kalau misi taksi aktif
    this.camDist = 13;
  }
  exitCar() {
    const p = this.player;
    if (!p.car) return;
    const c = p.car;
    p.pos.x = c.pos.x - Math.sin(c.heading + Math.PI / 2) * 3;
    p.pos.z = c.pos.z - Math.cos(c.heading + Math.PI / 2) * 3;
    p.heading = c.heading;
    p.mesh.visible = true;
    p.inCar = false; p.car = null;
    this.camDist = 10;
  }

  // ---------- toko ----------
  nearestShop() {
    const p = this.player.pos;
    if (dist2(p.x, p.z, SHOPS.weapon.x, SHOPS.weapon.z) < 100) return 'weapon';
    if (dist2(p.x, p.z, SHOPS.car.x, SHOPS.car.z) < 100) return 'car';
    return null;
  }
  buyAtShop(kind) {
    if (kind === 'weapon') {
      if (!this.combat.hasPistol) {
        if (this.money >= SHOPS.weapon.pistolPrice) {
          this.money -= SHOPS.weapon.pistolPrice;
          this.combat.buyPistol();
          this.hud.showMessage('Pistol dibeli! Tekan 2 untuk memakainya. ($150)');
        } else this.hud.showMessage('Uang tidak cukup — pistol $150.');
      } else if (this.money >= SHOPS.weapon.ammoPrice) {
        this.money -= SHOPS.weapon.ammoPrice;
        this.combat.buyAmmo();
        this.hud.showMessage('Amunisi +12 dibeli. ($40)');
      } else this.hud.showMessage('Uang tidak cukup — amunisi $40.');
    } else if (kind === 'car') {
      const model = CAR_MODELS.find((m) => m.id === SHOPS.car.carId);
      if (this.ownedCars.includes(model.id)) { this.hud.showMessage('Cometa GT sudah milikmu — ada di Garasi Vela.'); return; }
      if (this.money >= model.price) {
        this.money -= model.price;
        this.ownedCars.push(model.id);
        const car = new Car(this.scene, model, SHOPS.garage.x, SHOPS.garage.z, 0);
        car.stolen = true; // milik sendiri, bukan curian
        this.parked.push(car);
        this.hud.showMessage(`Cometa GT dibeli! ($${model.price}) — parkir di Garasi Vela.`);
      } else this.hud.showMessage(`Uang tidak cukup — Cometa GT $${model.price}.`);
    }
    this.updateWeaponLine();
    writeSave(this.saveState());
  }
  updateWeaponLine() {
    const el = document.getElementById('weapon-line');
    if (this.combat.weapon === 'pistol' && this.combat.hasPistol) el.textContent = `🔫 Pistol — ${this.combat.ammo} peluru`;
    else if (this.combat.hasPistol) el.textContent = `✊ Tangan kosong — tekan 2 untuk pistol (${this.combat.ammo} peluru)`;
    else el.textContent = '✊ Tangan kosong — beli pistol di Toko Senjata ($150)';
  }

  // ---------- taksi sampingan ----------
  startTaxiFare() {
    if (this.taxiFare || this.missions.state === 'active') { this.hud.showMessage('Selesaikan urusanmu dulu!'); return; }
    const spots = [{ x: 120, z: -80 }, { x: -40, z: 120 }, { x: 200, z: -40 }, { x: 0, z: 200 }];
    const a = spots[Math.floor(Math.random() * spots.length)];
    let b = spots[Math.floor(Math.random() * spots.length)];
    if (b === a) b = spots[(spots.indexOf(a) + 1) % spots.length];
    this.taxiFare = { pickup: a, drop: b, stage: 'pickup', pay: 80 };
    this.spawnTaxiPassenger(a.x, a.z);
    this.hud.showMessage('Taksi: jemput penumpang di penanda kuning! ($80)');
    this.sound.coin();
  }

  // ---------- loop ----------
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.frozen && this.started && !this.paused) this.stepWorld(dt, false);
    else if (this.frozen) this.renderOnce();
    else this.renderOnce();
    this.frames += 1;
    if (this.frames === 5) window.__VELAMAR_READY__ = true;
  }
  renderOnce() {
    this.updateCamera(0.016);
    this.renderer.render(this.scene, this.camera);
  }

  stepWorld(dt, staging) {
    const input = this.input;
    const p = this.player;
    // tombol global
    if (input.hit('KeyP') || input.hit('Escape')) this.pauseGame();
    if (input.hit('KeyN') && !this.started) { clearSave(); location.reload(); }
    if (input.hit('Digit1')) { this.combat.weapon = 'fist'; this.updateWeaponLine(); }
    if (input.hit('Digit2')) {
      if (this.combat.hasPistol) { this.combat.weapon = 'pistol'; this.updateWeaponLine(); }
      else this.hud.showMessage('Belum punya pistol — beli di Toko Senjata ($150).');
    }
    if (input.hit('KeyH')) this.sound.horn();
    const mouse = input.consumeMouse();
    this.cameraYaw -= mouse.dx * 0.004;
    this.cameraPitch = clamp(this.cameraPitch + mouse.dy * 0.003, 0.08, 1.1);

    // --- gerak pemain ---
    if (!p.inCar) {
      const mv = input.moveVector();
      const run = input.down('ShiftLeft') || input.down('ShiftRight');
      const speed = run ? 10.5 : 6;
      const fx = -Math.sin(this.cameraYaw), fz = -Math.cos(this.cameraYaw);
      const rx = Math.cos(this.cameraYaw), rz = -Math.sin(this.cameraYaw);
      let mx = fx * -mv.z + rx * mv.x;
      let mz = fz * -mv.z + rz * mv.x;
      const len = Math.hypot(mx, mz);
      if (len > 0) {
        mx /= len; mz /= len;
        p.pos.x += mx * speed * dt;
        p.pos.z += mz * speed * dt;
        p.heading = Math.atan2(mx, mz);
        p.mesh.rotation.y = p.heading;
        p.walkBob += dt * speed;
        p.mesh.children[0].position.y = 1.05 + Math.abs(Math.sin(p.walkBob * 1.6)) * 0.07;
      }
      resolveColliders(p.pos, 0.7, this.colliders);
      p.pos.x = clamp(p.pos.x, -WORLD.halfSize - 20, WORLD.halfSize);
      p.pos.z = clamp(p.pos.z, -WORLD.halfSize, WORLD.halfSize);
      // masuk mobil
      if (input.hit('KeyE')) {
        const car = nearestCar(this.parked, p.pos.x, p.pos.z, 5);
        if (car) this.enterCar(car);
      }
      // pukul
      if (input.hit('KeyF')) {
        const targets = [...this.enemies, ...this.peds.map((pd) => ({ pos: pd.mesh.position, ped: pd }))];
        if (this.combat.punch(p, targets, (t, dmg) => this.hitTarget(t, dmg))) this.sound.punch();
      }
      // tembak
      if (input.consumeClick() && this.combat.weapon === 'pistol') {
        const res = this.combat.shoot(p, this.camera, this.enemies, (t, dmg) => this.hitTarget(t, dmg));
        if (res === 'hit' || res === 'miss') { this.sound.shot(); if (this.police.wanted < 2) this.police.addWanted(1, 'tembakan'); }
        if (res === 'no-ammo') this.hud.showMessage('Peluru habis! Beli di Toko Senjata ($40).');
        if (res === 'no-weapon') this.hud.showMessage('Pilih pistol dulu (tombol 2).');
      }
    } else {
      // --- mengemudi ---
      const mv = input.moveVector();
      const throttle = mv.z < 0 ? 1 : mv.z > 0 ? -1 : 0;
      const steer = mv.x;
      p.car.drive(throttle, steer, dt);
      resolveColliders(p.car.pos, 2.2, this.colliders);
      p.car.pos.x = clamp(p.car.pos.x, -WORLD.halfSize - 20, WORLD.halfSize);
      p.car.pos.z = clamp(p.car.pos.z, -WORLD.halfSize, WORLD.halfSize);
      // Posisi pemain HARUS mengikuti mobil — polisi, misi, dan minimap
      // semuanya membaca player.pos (bukan posisi mesh jalan kaki).
      p.pos.x = p.car.pos.x; p.pos.z = p.car.pos.z;
      // kamera mengikuti arah mobil (kecuali saat staging screenshot)
      if (!staging) {
        let targetYaw = p.car.heading + Math.PI;
        let dy = targetYaw - this.cameraYaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        this.cameraYaw += dy * Math.min(1, dt * 1.2);
      }
      if (input.hit('KeyE')) this.exitCar();
      // tabrak pejalan kaki = kejahatan (hanya selagi masih di mobil)
      if (p.car) for (const pd of this.peds) {
        const d = dist2(p.car.pos.x, p.car.pos.z, pd.mesh.position.x, pd.mesh.position.z);
        if (d < 6 && Math.abs(p.car.speed) > 8) {
          this.scene.remove(pd.mesh);
          this.peds.splice(this.peds.indexOf(pd), 1);
          const fresh = spawnPedestrians(this.scene, 1);
          this.peds.push(...fresh);
          this.police.addWanted(1, 'tabrak pejalan kaki');
          this.hud.showMessage('Kamu menabrak pejalan kaki! Wanted +1 ★');
          this.sound.fail();
          break;
        }
      }
      // tabrak mobil lalu lintas: pelan + bunyi (hanya selagi masih di mobil)
      if (p.car) for (const t of this.traffic) {
        const d = dist2(p.car.pos.x, p.car.pos.z, t.car.pos.x, t.car.pos.z);
        if (d < 12) {
          const push = 3;
          const dx = p.car.pos.x - t.car.pos.x, dz = p.car.pos.z - t.car.pos.z;
          const dd = Math.hypot(dx, dz) || 1;
          p.car.pos.x += (dx / dd) * push * dt * 4;
          p.car.pos.z += (dz / dd) * push * dt * 4;
          p.car.speed *= 0.96;
        }
      }
    }

    // --- dunia hidup ---
    const allCars = [...this.traffic.map((t) => t.car), ...this.parked, ...this.police.cars];
    for (const t of this.traffic) t.update(dt, allCars);
    const danger = this.combat.weapon === 'pistol' ? { x: p.pos.x, z: p.pos.z } : null;
    for (const pd of this.peds) pd.update(dt, this.rng, danger);
    for (const e of this.enemies) {
      e.update(dt, p.pos, (hit) => { if (hit && this.player.damage(8, 'ditembak')) this.onWasted(); });
    }
    const busted = this.police.update(dt, p);
    if (busted === 'busted') this.onBusted();
    if (p.health <= 0) { this.onWasted(); return; }
    if (this.paused) return;
    this.missions.update(dt, this);
    this.updateTaxiFare(dt);
    this.combat.update(dt);

    // --- toko / prompt ---
    let prompt = null;
    if (!p.inCar) {
      const car = nearestCar(this.parked, p.pos.x, p.pos.z, 5);
      if (car) prompt = `[E] Masuk ${car.model.name}`;
      else {
        const shop = this.nearestShop();
        if (shop === 'weapon') prompt = this.combat.hasPistol ? '[B] Beli amunisi $40' : '[B] Beli pistol $150';
        else if (shop === 'car') prompt = '[B] Beli Cometa GT $1200';
        if (shop && input.hit('KeyB')) this.buyAtShop(shop);
      }
    } else prompt = '[E] Keluar mobil';
    if (!p.inCar && this.missions.state !== 'active' && this.missions.current()) {
      prompt = (prompt ? prompt + '   •   ' : '') + '[M] Mulai misi: ' + this.missions.current().title;
    }
    this.hud.showPrompt(prompt);

    // --- kesehatan pulih saat aman ---
    if (this.police.wanted === 0 && p.health < GAME.startHealth) p.health = Math.min(GAME.startHealth, p.health + 2 * dt);

    // --- HUD + minimap ---
    this.hud.setHealth(p.health);
    this.hud.setMoney(this.money);
    this.hud.setWanted(this.police.wanted);
    const m = this.missions.current();
    if (this.taxiFare) {
      this.hud.setObjective('TAKSI — $80', this.taxiFare.stage === 'pickup' ? 'Jemput penumpang di penanda kuning.' : 'Antar penumpang ke tujuan!');
    } else if (m && this.missions.state === 'active') {
      this.hud.setObjective(`MISI ${m.id} — ${m.title.toUpperCase()}`, `${m.giver}: ${m.text}`);
      this.hud.setTimer(this.missions.timer);
    } else if (m) {
      this.hud.setObjective(`MISI ${m.id} — ${m.title.toUpperCase()}`, 'Tekan M untuk memulai misi ini.');
      this.hud.setTimer(0);
    } else {
      this.hud.setObjective('VELAMAR — BEBAS', 'Semua misi selesai! Jelajahi kota, taksi (T), atau beli mobil.');
      this.hud.setTimer(0);
    }
    this.hud.setSpeed(p.inCar ? p.car.kmh() : 0, p.inCar);
    this.hud.setCrosshair(!p.inCar && this.combat.weapon === 'pistol' && this.combat.hasPistol);
    this.hud.update(dt);
    this.minimap.draw({
      player: { x: p.pos.x, z: p.pos.z, heading: p.inCar ? p.car.heading : p.heading },
      target: this.taxiFare
        ? (this.taxiFare.stage === 'pickup' ? this.taxiFare.pickup : this.taxiFare.drop)
        : this.missions.targetPos(),
      cars: [...this.traffic.map((t) => ({ x: t.car.pos.x, z: t.car.pos.z })), ...this.parked.map((c) => ({ x: c.pos.x, z: c.pos.z }))],
      police: this.police.cars.map((c) => ({ x: c.pos.x, z: c.pos.z })),
    });
    this.sound.setEngine(p.inCar ? Math.abs(p.car.speed) / p.car.model.speed : 0);
    this.sound.setSiren(this.police.wanted >= 2, dt);

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    input.endFrame();
  }

  updateTaxiFare(dt) {
    if (!this.taxiFare) return;
    const p = this.player.pos;
    const f = this.taxiFare;
    const tgt = f.stage === 'pickup' ? f.pickup : f.drop;
    if (dist2(p.x, p.z, tgt.x, tgt.z) < 49) {
      if (f.stage === 'pickup') {
        if (!this.player.inCar) return;
        f.stage = 'drop';
        this.hud.showMessage('Penumpang naik! Antar ke tujuan.');
      } else {
        this.money += f.pay;
        this.hud.showMessage(`Taksi selesai! +$${f.pay}`);
        this.sound.coin();
        this.removeTaxiPassenger();
        this.taxiFare = null;
        writeSave(this.saveState());
      }
    }
  }

  hitTarget(t, dmg) {
    if (t instanceof Enemy || t.health !== undefined) {
      t.health -= dmg;
      if (t.health <= 0) {
        const i = this.enemies.indexOf(t);
        if (i >= 0) { this.scene.remove(t.mesh); this.enemies.splice(i, 1); }
        this.hud.showMessage('Satu preman tumbang!');
      }
    } else if (t.ped) {
      // pukul pejalan kaki = kejahatan
      this.police.addWanted(1, 'memukul warga');
      this.hud.showMessage('Kamu memukul warga! Wanted +1 ★');
      t.ped.fleeing = true;
    }
  }

  onWasted() {
    if (this.paused) return;
    this.money = Math.max(0, this.money - GAME.wastedFine);
    this.player.health = GAME.startHealth;
    this.player.pos.set(60, 0, 200);
    if (this.player.inCar) this.exitCar();
    this.police.clearAll();
    if (this.missions.state === 'active') this.missions.fail('Kamu tumbang di jalan.');
    this.paused = true;
    this.hud.showScreen('KAMU TUMBANG', `Dirawat di klinik Pantai Azul. Biaya: <b>$${GAME.wastedFine}</b><br>Uangmu sekarang: <b>$${this.money}</b>`, 'BANGKIT LAGI', () => { this.paused = false; });
  }
  onBusted() {
    if (this.paused) return;
    this.money = Math.max(0, this.money - GAME.bustedFine);
    this.player.health = GAME.startHealth;
    this.player.pos.set(120, 0, -40);
    if (this.player.inCar) this.exitCar();
    this.police.clearAll();
    if (this.missions.state === 'active') this.missions.fail('Polisi menangkapmu.');
    this.paused = true;
    this.hud.showScreen('TERTANGKAP!', `Polisi Velamar menahanmu semalam. Denda: <b>$${GAME.bustedFine}</b><br>Uangmu sekarang: <b>$${this.money}</b>`, 'BEBAS LAGI', () => { this.paused = false; });
  }

  updateCamera(dt) {
    const p = this.player;
    const target = p.inCar ? p.car.pos : p.pos;
    const ty = (p.inCar ? 2.2 : 2.0);
    const dist = this.camDist;
    const cx = target.x + Math.sin(this.cameraYaw) * dist * Math.cos(this.cameraPitch);
    const cz = target.z + Math.cos(this.cameraYaw) * dist * Math.cos(this.cameraPitch);
    const cy = ty + Math.sin(this.cameraPitch) * dist + 1.5;
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(target.x, ty, target.z);
  }
}

// ---------- boot ----------
const { shot } = parseShot();
const game = new Game();
window.__game = game;
if (shot) {
  // Mode screenshot: lewati layar start, tata scene deterministik.
  game.sound.enabled = false;
  stageShot(game, shot);
}
