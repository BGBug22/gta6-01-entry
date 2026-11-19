import * as THREE from 'three';
import { WORLD, DISTRICTS, CAR_MODELS, SHOPS, MISSIONS, GAME, DENSITY, CLOCK, ARMOUR, RADIO, SHOP_PRICES, SHOP_LIMITS, WEAPONS } from './config.js';
import { makeRng, pick, range, clamp, dist2 } from './random.js';
import { buildCity, resolveColliders } from './city.js';
import { Car, nearestCar } from './vehicles.js';
import { spawnTraffic, spawnPedestrians } from './traffic.js';
import { PoliceChase } from './police-chase.js';
import { StoryCampaign, dialogFor } from './story-campaign.js';
import { Combat, Enemy } from './combat.js';
import { Hud } from './hud.js';
import { Minimap } from './minimap.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { loadSave, writeSave, clearSave } from './save.js';
import { parseShot, stageShot } from './screenshot-staging.js';
import { absorbDamage, regenArmour, respectLevel } from './wanted-level.js';
import { makeHuman, walkPose, aimPose, idlePose, setWeapon } from './human.js';

class Player {
  constructor(scene) {
    this.mesh = makeHuman({
      skin: 0xf1c27d,
      jacket: 0x2a9d8f,
      pants: 0x2b3a55,
      hair: 0x2b2b3a,
      cap: true,
      capColor: 0xffd23f,
    });
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.25, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
    this.mesh.add(ring);
    this.mesh.position.set(20, 0, 20);
    this.pos = this.mesh.position;
    this.heading = 0;
    this.health = GAME.startHealth;
    this.armour = ARMOUR.start;
    this.inCar = false;
    this.car = null;
    this.animT = 0;
    scene.add(this.mesh);
  }
  damage(amount, cause) {
    const r = absorbDamage(amount, this.armour, this.health);
    this.armour = r.armour;
    this.health = r.health;
    return this.health <= 0;
  }
}

class Game {
  constructor(shot = null) {
    const canvas = document.getElementById('c');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 1500);
    this.input = new Input(canvas);
    this.hud = new Hud();
    this.minimap = new Minimap(document.getElementById('minimap'));
    this.sound = new SoundBank();
    this.started = false;
    this.paused = false;
    this.frozen = false;
    this.shotMode = shot;
    this.night = shot === 'heist-night';
    this.shopOpen = false;
    this.shopKind = null;
    this.upgrades = { engine: 0, armour: 0 };
    this.maxArmour = ARMOUR.max;
    this.carSpeedMul = 1;
    this.topDown = false;
    this.topDownHeight = 240;
    this.topDownOffset = { x: 0, z: 0 };
    this.money = GAME.startMoney;
    this.respect = 1;
    this.clockDay = CLOCK.day;
    this.clockMin = CLOCK.hour * 60 + CLOCK.minute;
    this.districtName = 'VELAMAR';
    this.ownedCars = [];
    this.enemies = [];
    this.combatStarted = false;
    this.stealTarget = null;
    this.taxiFare = null;
    this.taxiPassenger = null;
    this.cameraYaw = Math.PI;
    this.cameraPitch = 0.22;
    this.camDist = 11.5;
    this.cameraSide = 0;
    this.camLookSide = 0;

    const { colliders, clouds, roadMats } = buildCity(this.scene, { night: this.night });
    this.colliders = colliders;
    this.clouds = clouds;
    this.roadMats = roadMats;
    this.traffic = spawnTraffic(this.scene, DENSITY.traffic);
    this.peds = spawnPedestrians(this.scene, DENSITY.pedestrians);
    this.parked = this.spawnParkedCars();
    this.player = new Player(this.scene);
    this.police = new PoliceChase(this.scene);
    this.combat = new Combat(this.scene);
    this.missions = new StoryCampaign(this.scene, (t, d) => this.onMissionEvent(t, d));
    this.rng = makeRng(WORLD.seed + 99);

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyM') this.tryStartMission(); });
    window.addEventListener('keydown', (e) => {
      if (!this.shopOpen) return;
      if (e.code === 'Digit1') this.buyShopItem(0);
      else if (e.code === 'Digit2') this.buyShopItem(1);
      else if (e.code === 'Digit3') this.buyShopItem(2);
      else if (e.code === 'Digit4') this.buyShopItem(3);
      else if (e.code === 'Digit5') this.buyShopItem(4);
      else if (e.code === 'KeyB' || e.code === 'Escape') this.closeShop();
    });
    this.showStartScreen();
    this.last = performance.now();
    this.frames = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  spawnParkedCars() {
    const rng = makeRng(WORLD.seed + 33);
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

  addRespect(n) {
    this.respect = Math.min(5, this.respect + n);
  }

  applyUpgrades() {
    this.maxArmour = ARMOUR.max + 25 * this.upgrades.armour;
    this.carSpeedMul = 1 + 0.1 * this.upgrades.engine;
  }

  missionTarget() {
    if (this.taxiFare) return this.taxiFare.stage === 'pickup' ? this.taxiFare.pickup : this.taxiFare.drop;
    return this.missions.targetPos();
  }

  showStartScreen() {
    const save = loadSave();
    const txt = save
      ? `Save found: <b>$${save.money}</b> • Mission <b>${save.mission + 1}/8</b> • ${save.hasPistol ? 'Pistol owned' : 'No pistol yet'}<br>` +
        `Steal any car, outrun a 3-star police chase before time runs out.<br>` +
        `8 story missions await you — from Mara's first package to the last escape at the pier.`
      : `Steal any car, outrun a 3-star police chase before time runs out.<br>` +
        `8 story missions await you — from Mara's first package to the last escape at the pier.<br>` +
        `The city of VELAMAR: beaches, the Faro Vela lighthouse, traffic, and police that never sleep.<br>` +
        `Armour absorbs damage — it recovers while you stay safe. Respect rises with every mission done.`;
    const foot = save ? 'Press N to start over (clears the save).' : 'Progress saves automatically in this browser.';
    this.hud.showScreen('VELAMAR', txt, save ? '▶ CONTINUE' : '▶ START GAME', () => this.startGame(save));
    document.getElementById('screen-foot').textContent = foot;
    this.pendingSave = save;
  }
  startGame(save) {
    this.sound.ensure();
    if (save) {
      this.money = save.money;
      this.missions.index = Math.min(save.mission, MISSIONS.length - 1);
      this.respect = respectLevel(save.mission);
      this.upgrades = save.upgrades || { engine: 0, armour: 0 };
      this.applyUpgrades();
      if (save.hasPistol) {
        this.combat.hasPistol = true;
        if (typeof save.ammo === 'number') this.combat.ammo.pistol = save.ammo;
        else if (save.ammo) this.combat.ammo = { pistol: 0, smg: 0, shotgun: 0, ...save.ammo };
      }
      this.ownedCars = save.ownedCars || [];
    }
    this.started = true;
    this.hud.setMoney(this.money);
    this.hud.showMessage('Welcome to VELAMAR! Press M for the first mission.');
    this.updateWeaponLine();
  }
  pauseGame() {
    if (!this.started || this.hud.screenVisible()) return;
    this.paused = true;
    this.hud.showScreen('PAUSED', `Money <b>$${this.money}</b> • Mission <b>${this.missions.index + 1}/8</b> • Wanted <b>${this.police.wanted}★</b><br>Progress saves automatically.`, '▶ CONTINUE', () => { this.paused = false; });
  }

  tryStartMission() {
    if (!this.started || this.paused || this.hud.screenVisible()) return;
    if (this.missions.state === 'active') {
      this.hud.showMessage('Mission in progress — finish it first!');
      return;
    }
    if (!this.missions.current()) {
      this.hud.showMessage('All 8 missions complete! You are a Velamar legend. 🏆');
      return;
    }
    this.missions.start();
  }
  onMissionEvent(type, data) {
    if (type === 'start') {
      const m = data;
      this.sound.coin();
      this.hud.showMessage(`MISSION ${m.id} — ${m.title}: ${m.text}`);
      if (m.type === 'steal') this.spawnStealTarget();
      if (m.type === 'combat') this.spawnEnemies();
      if (m.type === 'heist') { this.police.addWanted(2, 'bank alarm'); }
      if (m.type === 'finale') { this.police.addWanted(4, 'final escape'); }
      if (m.type === 'escape') { this.police.addWanted(1, 'stirring trouble'); }
    } else if (type === 'complete') {
      const m = data;
      this.sound.win();
      writeSave(this.saveState());
      const next = MISSIONS[this.missions.index];
      this.paused = true;
      this.hud.showScreen('MISSION PASSED!',
        `<b>${m.title}</b> — reward <b style="color:#ffd23f">$${m.reward}</b> &nbsp;•&nbsp; Total: <b>$${this.money}</b> &nbsp;•&nbsp; Respect LV <b>${this.respect}</b><br>` +
        (next ? `Next mission: <b>${next.title}</b> — ${next.text}` : 'All missions complete. You are a Velamar legend! 🏆'),
        next ? 'CONTINUE' : 'FREE ROAM', () => { this.paused = false; });
    } else if (type === 'fail') {
      this.sound.fail();
      this.paused = true;
      this.hud.showScreen('MISSION FAILED', `${data.mission ? `<b>${data.mission.title}</b> — ` : ''}${data.reason}<br>Press M to try again.`, 'TRY AGAIN', () => { this.paused = false; });
    } else if (type === 'info') {
      this.sound.coin();
      this.hud.showMessage(data.text);
    }
  }
  saveState() {
    return { money: this.money, missionIndex: this.missions.index, hasPistol: this.combat.hasPistol, ammo: this.combat.ammo, ownedCars: this.ownedCars, upgrades: this.upgrades };
  }
  spawnStealTarget() {
    const model = CAR_MODELS.find((m) => m.id === 'sport');
    const car = new Car(this.scene, model, 190, -160, Math.PI / 2);
    car.stolen = false;
    this.parked.push(car);
    this.stealTarget = car;
    this.hud.showMessage('The pink Cometa GT is parked in the Glass District. Steal it!');
  }
  spawnEnemies() {
    this.combatStarted = true;
    const spots = [[-210, -120], [-190, -140], [-225, -100]];
    spots.forEach(([x, z], i) => this.enemies.push(new Enemy(this.scene, x, z, i)));
  }
  spawnTaxiPassenger(x, z) {
    this.removeTaxiPassenger();
    const g = makeHuman({
      skin: 0x8a5a2b, jacket: 0xffd23f, pants: 0x2b3a55, hair: 0x111111,
    });
    g.position.set(x + 3, 0, z + 3);
    this.scene.add(g);
    this.taxiPassenger = g;
  }
  removeTaxiPassenger() {
    if (this.taxiPassenger) { this.scene.remove(this.taxiPassenger); this.taxiPassenger = null; }
  }

  enterCar(car) {
    const p = this.player;
    p.inCar = true; p.car = car;
    p.mesh.visible = false;
    if (!car.stolen && !this.ownedCars.includes(car)) {
      car.stolen = true;
      this.police.addWanted(1, 'car theft');
      this.hud.showMessage('Car stolen! Wanted +1★');
      this.sound.horn();
    }
    this.camDist = 11.5;
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

  nearestShop() {
    const p = this.player.pos;
    if (dist2(p.x, p.z, SHOPS.weapon.x, SHOPS.weapon.z) < 100) return 'weapon';
    if (dist2(p.x, p.z, SHOPS.car.x, SHOPS.car.z) < 100) return 'car';
    if (dist2(p.x, p.z, SHOPS.garage.x, SHOPS.garage.z) < 100) return 'garage';
    return null;
  }
  shopTitle(kind) {
    return kind === 'weapon' ? 'GUN STORE "EL GATILLO ARMS"'
      : kind === 'car' ? 'DEALER "COMETA MOTORS"'
      : 'VELA GARAGE — UPGRADES';
  }
  shopItemsFor(kind) {
    if (kind === 'weapon') {
      const w = (id) => ({
        name: WEAPONS[id].name, price: SHOP_PRICES[id === 'pistol' ? 'pistol' : id],
        note: this.combat.owned[id] ? 'OWNED' : 'weapon',
        disabled: this.combat.owned[id],
      });
      return [
        w('pistol'),
        w('smg'),
        w('shotgun'),
        { name: 'Ammo +12', price: SHOP_PRICES.ammo, note: this.combat.owned.pistol || this.combat.owned.smg || this.combat.owned.shotgun ? '' : 'needs a gun', disabled: !(this.combat.owned.pistol || this.combat.owned.smg || this.combat.owned.shotgun) },
        { name: 'Full Armour', price: SHOP_PRICES.armourRefill, note: `armour → ${this.maxArmour}`, disabled: this.player.armour >= this.maxArmour },
      ];
    }
    if (kind === 'car') {
      const model = CAR_MODELS.find((m) => m.id === SHOPS.car.carId);
      const owned = this.ownedCars.includes(model.id);
      return [
        { name: `Cometa GT — ${model.speed * 3.6} km/h`, price: model.price, note: owned ? 'OWNED' : 'sports car', disabled: owned },
        { name: 'Ammo +12', price: SHOP_PRICES.ammo, note: this.combat.hasPistol ? '' : 'needs a gun', disabled: !this.combat.hasPistol },
        { name: 'Full Armour', price: SHOP_PRICES.armourRefill, note: `armour → ${this.maxArmour}`, disabled: this.player.armour >= this.maxArmour },
      ];
    }
    return [
      { name: `Turbo Engine +10% (LV ${this.upgrades.engine}/${SHOP_LIMITS.engineMax})`, price: SHOP_PRICES.engine, note: this.upgrades.engine >= SHOP_LIMITS.engineMax ? 'MAX' : 'all your cars', disabled: this.upgrades.engine >= SHOP_LIMITS.engineMax },
      { name: `Max Armour +25 (LV ${this.upgrades.armour}/${SHOP_LIMITS.armourMaxLevel})`, price: SHOP_PRICES.armourMax, note: this.upgrades.armour >= SHOP_LIMITS.armourMaxLevel ? 'MAX' : `max → ${this.maxArmour + 25}`, disabled: this.upgrades.armour >= SHOP_LIMITS.armourMaxLevel },
      { name: 'Full Armour', price: SHOP_PRICES.armourRefill, note: `armour → ${this.maxArmour}`, disabled: this.player.armour >= this.maxArmour },
    ];
  }
  openShop(kind) {
    this.shopKind = kind;
    this.shopOpen = true;
    this.hud.showShop(this.shopTitle(kind), this.shopItemsFor(kind), this.money, (i) => this.buyShopItem(i));
  }
  refreshShop() {
    if (!this.shopOpen) return;
    this.hud.showShop(this.shopTitle(this.shopKind), this.shopItemsFor(this.shopKind), this.money, (i) => this.buyShopItem(i));
  }
  closeShop() {
    this.shopOpen = false;
    this.shopKind = null;
    this.hud.hideShop();
    this.input.pressed = {};
    this.input.keys['KeyB'] = false;
    this.input.keys['Escape'] = false;
  }
  buyShopItem(i) {
    const kind = this.shopKind;
    const items = this.shopItemsFor(kind);
    const it = items[i];
    if (!it || it.disabled) return;
    if (this.money < it.price) {
      this.hud.showMessage('Not enough money!');
      this.sound.fail();
      return;
    }
    this.money -= it.price;
    if (kind === 'weapon') {
      if (i === 0) { this.combat.buyWeapon('pistol'); this.hud.showMessage('Pistol bought! Press 2 to use it.'); }
      else if (i === 1) { this.combat.buyWeapon('smg'); this.hud.showMessage('Micro-SMG bought! Press 3 to use it.'); }
      else if (i === 2) { this.combat.buyWeapon('shotgun'); this.hud.showMessage('Shotgun bought! Press 4 to use it.'); }
      else if (i === 3) { this.combat.buyAmmo(this.combat.weapon === 'fist' ? 'pistol' : this.combat.weapon); this.hud.showMessage('Ammo +12 bought.'); }
      else { this.player.armour = this.maxArmour; this.hud.showMessage('Armour full!'); }
    } else if (kind === 'car') {
      if (i === 0) {
        const model = CAR_MODELS.find((m) => m.id === SHOPS.car.carId);
        this.ownedCars.push(model.id);
        const car = new Car(this.scene, model, SHOPS.garage.x, SHOPS.garage.z, 0);
        car.stolen = true;
        this.parked.push(car);
        this.hud.showMessage(`Cometa GT bought! ($${model.price}) — parked at Vela Garage.`);
      } else if (i === 1) {
        this.combat.buyAmmo();
        this.hud.showMessage('Ammo +12 bought.');
      } else {
        this.player.armour = this.maxArmour;
        this.hud.showMessage('Armour full!');
      }
    } else if (kind === 'garage') {
      if (i === 0) {
        this.upgrades.engine += 1;
        this.applyUpgrades();
        this.hud.showMessage(`Turbo Engine LV ${this.upgrades.engine}! All your cars are faster.`);
      } else if (i === 1) {
        this.upgrades.armour += 1;
        this.applyUpgrades();
        this.hud.showMessage(`Max Armour up to ${this.maxArmour}!`);
      } else {
        this.player.armour = this.maxArmour;
        this.hud.showMessage('Armour full!');
      }
    }
    this.sound.coin();
    this.updateWeaponLine();
    this.hud.setMoney(this.money);
    writeSave(this.saveState());
    this.refreshShop();
  }
  updateWeaponLine() {
    const w = this.combat.weapon;
    const slots = [
      { icon: '✊', name: 'FISTS', ammo: '∞', active: w === 'fist', locked: false },
      { icon: '🔫', name: 'PISTOL', ammo: this.combat.owned.pistol ? `${this.combat.ammo.pistol}/${WEAPONS.pistol.ammo}` : '🔒', active: w === 'pistol', locked: !this.combat.owned.pistol },
      { icon: '🔫', name: 'MICRO-SMG', ammo: this.combat.owned.smg ? `${this.combat.ammo.smg}/${WEAPONS.smg.ammo}` : '🔒', active: w === 'smg', locked: !this.combat.owned.smg },
      { icon: '🔫', name: 'SHOTGUN', ammo: this.combat.owned.shotgun ? `${this.combat.ammo.shotgun}/${WEAPONS.shotgun.ammo}` : '🔒', active: w === 'shotgun', locked: !this.combat.owned.shotgun },
    ];
    this.hud.setWeaponSlots(slots);
    const ammo = w === 'fist' ? '∞' : `${this.combat.ammo[w]}/${WEAPONS[w].ammo}`;
    this.hud.setWeapon(`${WEAPONS[w].name} — ${ammo}`);
    if (this.player && this.player.mesh) setWeapon(this.player.mesh, w);
  }

  startTaxiFare() {
    if (this.taxiFare || this.missions.state === 'active') { this.hud.showMessage('Finish what you started first!'); return; }
    const spots = [{ x: 120, z: -80 }, { x: -40, z: 120 }, { x: 200, z: -40 }, { x: 0, z: 200 }];
    const a = spots[Math.floor(this.rng() * spots.length)];
    let b = spots[Math.floor(this.rng() * spots.length)];
    if (b === a) b = spots[(spots.indexOf(a) + 1) % spots.length];
    this.taxiFare = { pickup: a, drop: b, stage: 'pickup', pay: 80 };
    this.spawnTaxiPassenger(a.x, a.z);
    this.hud.showMessage('Taxi: pick up the fare at the yellow marker! ($80)');
    this.sound.coin();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.frozen && this.started && !this.paused && !this.shopOpen) this.stepWorld(dt, false);
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
    if (input.hit('KeyP') || input.hit('Escape')) this.pauseGame();
    if (input.hit('KeyN') && !this.started) { clearSave(); location.reload(); }
    if (input.hit('Digit1')) { this.combat.weapon = 'fist'; this.updateWeaponLine(); }
    if (input.hit('Digit2')) {
      if (this.combat.owned.pistol) { this.combat.weapon = 'pistol'; this.updateWeaponLine(); }
      else this.hud.showMessage('No pistol yet — buy one at the Gun Store ($150).');
    }
    if (input.hit('Digit3')) {
      if (this.combat.owned.smg) { this.combat.weapon = 'smg'; this.updateWeaponLine(); }
      else this.hud.showMessage('No Micro-SMG yet — buy one at the Gun Store ($450).');
    }
    if (input.hit('Digit4')) {
      if (this.combat.owned.shotgun) { this.combat.weapon = 'shotgun'; this.updateWeaponLine(); }
      else this.hud.showMessage('No Shotgun yet — buy one at the Gun Store ($600).');
    }
    if (input.hit('KeyR')) {
      const label = this.sound.cycleStation();
      this.hud.setRadio(label);
    }
    if (input.hit('KeyH')) this.sound.horn();
    const mouse = input.consumeMouse();
    this.cameraYaw -= mouse.dx * 0.004;
    this.cameraPitch = clamp(this.cameraPitch + mouse.dy * 0.003, 0.08, 1.1);

    if (!staging && this.started && !this.paused) {
      this.clockMin += dt * CLOCK.minutesPerSecond;
      if (this.clockMin >= 1440) { this.clockMin -= 1440; this.clockDay += 1; }
    }

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
        p.animT += dt * speed * 0.9;
        walkPose(p.mesh, p.animT, run ? 1.4 : 1);
        if (this.combat.weapon !== 'fist') aimPose(p.mesh);
      } else {
        p.animT += dt;
        idlePose(p.mesh, p.animT);
        if (this.combat.weapon !== 'fist') aimPose(p.mesh);
      }
      resolveColliders(p.pos, 0.7, this.colliders);
      p.pos.x = clamp(p.pos.x, -WORLD.halfSize - 20, WORLD.halfSize);
      p.pos.z = clamp(p.pos.z, -WORLD.halfSize, WORLD.halfSize);
      if (input.hit('KeyE')) {
        const car = nearestCar(this.parked, p.pos.x, p.pos.z, 5);
        if (car) this.enterCar(car);
      }
      if (input.hit('KeyF')) {
        const targets = [...this.enemies, ...this.peds.map((pd) => ({ pos: pd.mesh.position, ped: pd }))];
        if (this.combat.punch(p, targets, (t, dmg) => this.hitTarget(t, dmg))) this.sound.punch();
      }
      if (input.consumeClick() && this.combat.weapon !== 'fist') {
        const res = this.combat.shoot(p, this.camera, this.enemies, (t, dmg) => this.hitTarget(t, dmg));
        if (res === 'hit' || res === 'miss') { this.sound.shot(); if (this.police.wanted < 2) this.police.addWanted(1, 'gunfire'); }
        if (res === 'no-ammo') this.hud.showMessage('Out of ammo! Buy at the Gun Store ($40).');
        if (res === 'no-weapon') this.hud.showMessage('Select a gun first (keys 2–4).');
      }
    } else {
      const mv = input.moveVector();
      const throttle = mv.z < 0 ? 1 : mv.z > 0 ? -1 : 0;
      const steer = mv.x;
      p.car.drive(throttle, steer, dt, this.carSpeedMul);
      resolveColliders(p.car.pos, 2.2, this.colliders);
      p.car.pos.x = clamp(p.car.pos.x, -WORLD.halfSize - 20, WORLD.halfSize);
      p.car.pos.z = clamp(p.car.pos.z, -WORLD.halfSize, WORLD.halfSize);
      p.pos.x = p.car.pos.x; p.pos.z = p.car.pos.z;
      if (!staging) {
        let targetYaw = p.car.heading + Math.PI;
        let dy = targetYaw - this.cameraYaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        this.cameraYaw += dy * Math.min(1, dt * 1.2);
      }
      if (input.hit('KeyE')) this.exitCar();
      if (p.car) for (const pd of this.peds) {
        const d = dist2(p.car.pos.x, p.car.pos.z, pd.mesh.position.x, pd.mesh.position.z);
        if (d < 6 && Math.abs(p.car.speed) > 8) {
          this.scene.remove(pd.mesh);
          this.peds.splice(this.peds.indexOf(pd), 1);
          const fresh = spawnPedestrians(this.scene, 1);
          this.peds.push(...fresh);
          this.police.addWanted(1, 'ran over a pedestrian');
          this.hud.showMessage('You ran over a pedestrian! Wanted +1 ★');
          this.sound.fail();
          break;
        }
      }
      if (p.car) for (const t of this.traffic) {
        const d = dist2(p.car.pos.x, p.car.pos.z, t.car.pos.x, t.car.pos.z);
        if (d < 12) {
          const push = 3;
          const dx = p.car.pos.x - t.car.pos.x, dz = p.car.pos.z - t.car.pos.z;
          const dd = Math.hypot(dx, dz) || 1;
          p.car.pos.x += (dx / dd) * push * dt * 4;
          p.car.pos.z += (dz / dd) * push * dt * 4;
          p.car.speed *= 0.96;
          if (Math.abs(p.car.speed) > 10) p.car.condition = Math.max(40, p.car.condition - 0.15);
        }
      }
    }

    const allCars = [...this.traffic.map((t) => t.car), ...this.parked, ...this.police.cars];
    for (const t of this.traffic) t.update(dt, allCars);
    const danger = this.combat.weapon !== 'fist' ? { x: p.pos.x, z: p.pos.z } : null;
    for (const pd of this.peds) pd.update(dt, this.rng, danger);
    for (const e of this.enemies) {
      e.update(dt, p.pos, (hit) => { if (hit && this.player.damage(8, 'shot')) this.onWasted(); });
    }
    const busted = this.police.update(dt, p);
    if (busted === 'busted') this.onBusted();
    if (p.health <= 0) { this.onWasted(); return; }
    if (this.paused) return;
    this.missions.update(dt, this);
    this.updateTaxiFare(dt);
    this.combat.update(dt);

    let prompt = null;
    if (!p.inCar) {
      const car = nearestCar(this.parked, p.pos.x, p.pos.z, 5);
      if (car) prompt = `[E] Enter ${car.model.name}`;
      else {
        const shop = this.nearestShop();
        if (shop === 'weapon') prompt = '[B] Gun Store — buy pistol / ammo / armour';
        else if (shop === 'car') prompt = '[B] Cometa Motors dealer — buy a car';
        else if (shop === 'garage') prompt = '[B] Vela Garage — engine / armour upgrades';
        if (shop && input.hit('KeyB')) this.openShop(shop);
      }
    } else prompt = '[E] Exit Vehicle';
    if (!p.inCar && this.missions.state !== 'active' && this.missions.current()) {
      prompt = (prompt ? prompt + '   •   ' : '') + '[M] Start mission: ' + this.missions.current().title;
    }
    this.hud.showPrompt(prompt);

    if (this.police.wanted === 0) {
      if (p.health < GAME.startHealth) p.health = Math.min(GAME.startHealth, p.health + 2 * dt);
      p.armour = regenArmour(p.armour, 0, dt, this.maxArmour);
    }

    this.respect = respectLevel(this.missions.index);

    let bestD = Infinity, bestName = 'VELAMAR';
    for (const d of DISTRICTS) {
      const dd = dist2(p.pos.x, p.pos.z, d.x, d.z);
      if (dd < bestD) { bestD = dd; bestName = d.name; }
    }
    this.districtName = bestName;

    this.hud.setHealth(p.health);
    this.hud.setArmour(p.armour, this.maxArmour);
    this.hud.setMoney(this.money);
    this.hud.setWanted(this.police.wanted);
    this.hud.setRespect(this.respect);
    this.updateWeaponLine();
    const m = this.missions.current();
    if (this.taxiFare) {
      this.hud.setObjective('TAXI — $80', this.taxiFare.stage === 'pickup' ? 'Pick up the fare at the yellow marker.' : 'Drop the fare at the destination!');
      this.hud.setStage(1, 1, 'Drop the fare — $80');
    } else if (m && this.missions.state === 'active') {
      this.hud.setObjective(`MISSION ${m.id}/8 · ${m.title.toUpperCase()}`, `${m.giver}: ${m.text}`);
      const si = this.missions.stageInfo();
      this.hud.setStage(si.stage, si.total, si.next);
      this.hud.setTimer(this.missions.timer);
    } else if (m) {
      this.hud.setObjective(`MISSION ${m.id}/8 · ${m.title.toUpperCase()}`, 'Press M to start this mission.');
      const si = this.missions.stageInfo();
      this.hud.setStage(si.stage, si.total, si.next);
      this.hud.setTimer(0);
    } else {
      this.hud.setObjective('VELAMAR — FREE ROAM', 'All missions complete! Explore the city, taxi (T), or buy a car.');
      this.hud.setStage(8, 8, 'Velamar Legend');
      this.hud.setTimer(0);
    }
    this.hud.setPolice(this.police.units(p.pos));
    this.hud.setCondition(p.inCar ? p.car.condition : 100);
    const dlg = dialogFor(m);
    this.hud.setDialog(dlg ? dlg.giver : null, dlg ? dlg.line : null);
    const tgt = this.missionTarget();
    this.hud.setDistance(tgt ? Math.hypot(tgt.x - p.pos.x, tgt.z - p.pos.z) : null);
    this.hud.setClock(this.clockDay, Math.floor(this.clockMin / 60), Math.floor(this.clockMin % 60));
    this.hud.setDistrict(this.districtName);
    this.hud.setRadio(this.sound.radioLabel());
    this.hud.setSpeed(p.inCar ? p.car.kmh() : 0, p.inCar);
    this.hud.setCarName(p.inCar ? p.car.model.name : '');
    this.hud.setCrosshair(!p.inCar && this.combat.weapon !== 'fist' && this.combat.owned[this.combat.weapon]);
    this.hud.update(dt);
    this.minimap.draw(this);
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
        this.hud.showMessage('Fare picked up! Take them to the destination.');
      } else {
        this.money += f.pay;
        this.hud.showMessage(`Taxi done! +$${f.pay}`);
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
        this.hud.showMessage('One thug down!');
      }
    } else if (t.ped) {
      this.police.addWanted(1, 'punched a civilian');
      this.hud.showMessage('You punched a civilian! Wanted +1 ★');
      t.ped.fleeing = true;
    }
  }

  onWasted() {
    if (this.paused) return;
    this.money = Math.max(0, this.money - GAME.wastedFine);
    this.player.health = GAME.startHealth;
    this.player.armour = ARMOUR.start;
    this.player.pos.set(60, 0, 200);
    if (this.player.inCar) this.exitCar();
    this.police.clearAll();
    if (this.missions.state === 'active') this.missions.fail('You went down in the street.');
    this.paused = true;
    this.hud.showScreen('WASTED', `Treated at the Playa Azul clinic. Cost: <b>$${GAME.wastedFine}</b><br>Your money now: <b>$${this.money}</b>`, 'GET UP AGAIN', () => { this.paused = false; });
  }
  onBusted() {
    if (this.paused) return;
    this.money = Math.max(0, this.money - GAME.bustedFine);
    this.player.health = GAME.startHealth;
    this.player.armour = ARMOUR.start;
    this.player.pos.set(120, 0, -40);
    if (this.player.inCar) this.exitCar();
    this.police.clearAll();
    if (this.missions.state === 'active') this.missions.fail('The police caught you.');
    this.paused = true;
    this.hud.showScreen('BUSTED!', `Vela Police held you overnight. Fine: <b>$${GAME.bustedFine}</b><br>Your money now: <b>$${this.money}</b>`, 'FREE AGAIN', () => { this.paused = false; });
  }

  updateCamera(dt) {
    const p = this.player;
    if (this.topDown) {
      const target = p.inCar ? p.car.pos : p.pos;
      const tx = target.x + this.topDownOffset.x;
      const tz = target.z + this.topDownOffset.z;
      this.camera.up.set(0, 0, -1);
      this.camera.position.set(tx, this.topDownHeight, tz + 0.01);
      this.camera.lookAt(tx, 0, tz);
      return;
    }
    this.camera.up.set(0, 1, 0);
    const target = p.inCar ? p.car.pos : p.pos;
    const ty = (p.inCar ? 2.2 : 2.0);
    const dist = this.camDist;
    const cx = target.x + Math.sin(this.cameraYaw) * dist * Math.cos(this.cameraPitch);
    const cz = target.z + Math.cos(this.cameraYaw) * dist * Math.cos(this.cameraPitch);
    const cy = ty + Math.sin(this.cameraPitch) * dist + 1.5;
    const fx = -Math.sin(this.cameraYaw), fz = -Math.cos(this.cameraYaw);
    const rx = -fz, rz = fx;
    this.camera.position.set(cx + rx * this.cameraSide, cy, cz + rz * this.cameraSide);
    const lookSide = this.cameraSide + (this.camLookSide || 0);
    const ly = this.lookY !== undefined ? this.lookY : ty;
    this.camera.lookAt(target.x + rx * lookSide, ly, target.z + rz * lookSide);
  }
}

const { shot } = parseShot();
const game = new Game(shot);
window.__game = game;
if (shot) {
  game.sound.enabled = false;
  stageShot(game, shot);
}
