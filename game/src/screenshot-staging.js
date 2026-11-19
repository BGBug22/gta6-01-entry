import * as THREE from 'three';
import { CAR_MODELS, DIALOGS } from './config.js';

export function parseShot() {
  const q = new URLSearchParams(location.search);
  return { shot: q.get('shot') || null, seed: Number(q.get('seed') || 1) };
}

function placeTrafficCar(tc, x, z, heading) {
  tc.car.pos.x = x; tc.car.pos.z = z;
  tc.car.heading = heading; tc.car.mesh.rotation.y = heading;
}

function placePed(pd, x, z) {
  pd.mesh.position.set(x, 0, z);
}

function placeEnemy(e, x, z) {
  e.mesh.position.set(x, 0, z);
  e.pos = e.mesh.position;
}

function pinHelicopter(game, fwd, left, height) {
  const p = game.police;
  if (!p.heli) return;
  const cam = game.camera;
  const tgt = game.player.inCar ? game.player.car.pos : game.player.pos;
  const cx = cam.position.x, cz = cam.position.z;
  let hx = tgt.x - cx, hz = tgt.z - cz;
  const hl = Math.hypot(hx, hz) || 1;
  hx /= hl; hz /= hl;
  const lx = hz, lz = -hx;
  const px = cx + hx * fwd + lx * left;
  const pz = cz + hz * fwd + lz * left;
  p.placeHelicopter(px, height, pz, Math.atan2(cx - px, cz - pz));
}

export function stageShot(game, shot) {
  const g = game;
  g.shotMode = shot;
  g.started = true;
  g.topDown = false;
  g.hud.hideScreen();
  const police = g.police;
  const setCarAt = (car, x, z, heading, speed) => {
    car.pos.x = x; car.pos.z = z; car.heading = heading;
    car.mesh.rotation.y = heading; car.speed = speed || 0;
  };
  g.clockDay = 1; g.clockMin = 18 * 60 + 24;

  if (shot === 'cover') {
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.enterCar(g.playerCar(sport, -240, -200, Math.PI));
    g.player.car.speed = 0;
    g.player.car.condition = 78;
    police.wanted = 4; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[-246, -211], [-234, -213], [-240, -217], [-243, -208]];
      setCarAt(pc, spots[i][0], spots[i][1], Math.PI, 6);
    });
    police.ensureHelicopter(g.player.pos);
    const trafficSpots = [
      [-236.5, -220, Math.PI], [-243.5, -240, 0], [-236.5, -270, Math.PI],
      [-243.5, -295, 0], [-236.5, -315, Math.PI], [-243.5, -255, 0],
      [-156.5, -230, Math.PI], [-163.5, -260, 0], [-156.5, -290, Math.PI], [-163.5, -220, 0],
    ];
    g.traffic.slice(0, 10).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const pedSpots = [
      [-256, -215], [-229, -225], [-258, -245], [-231, -255], [-254, -275],
      [-262, -300], [-230, -285], [-257, -230], [-228, -310], [-253, -320],
    ];
    g.peds.slice(0, 10).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 7; g.missions.state = 'active'; g.missions.timer = 132;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    g.cameraYaw = 0.28; g.cameraPitch = 0.05; g.camDist = 12; g.cameraSide = 0; g.camLookSide = -1.5; g.lookY = 4;
    g.money = 18450;
    g.clockDay = 3; g.clockMin = 18 * 60 + 36;
    g.player.armour = 54;
    g.respect = 4;
    g.combat.hasPistol = true; g.combat.ammo.pistol = 24; g.combat.weapon = 'pistol';
    const coverSun = new THREE.DirectionalLight(0xffe0b8, 0.55);
    coverSun.position.set(150, 250, 150);
    g.scene.add(coverSun);
    g.scene.add(new THREE.HemisphereLight(0xffe6c0, 0x8a7a68, 0.8));
    if (g.roadMats) for (const m of g.roadMats) m.emissive.setHex(0x2e333e);
    const cl = g.clouds;
    if (cl) {
      const cp = [[-380, 95, -520], [-290, 123, -400], [-200, 100, -520], [-110, 130, -400], [-20, 105, -520], [70, 125, -400]];
      cl.forEach((c, i) => { if (i < 6) { c.position.set(cp[i][0], cp[i][1], cp[i][2]); c.rotation.y = 0.15; } });
      cl[0].material.color.setHex(0xffc09a);
    }
  } else if (shot === 'heist-night') {
    const coupe = CAR_MODELS.find((m) => m.id === 'coupe');
    g.enterCar(g.playerCar(coupe, 160, -120, Math.PI));
    g.player.car.speed = 0;
    g.player.car.condition = 85;
    police.wanted = 4; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[156, -100], [164, -90], [160, -150], [150, -110]];
      const headings = [Math.PI, Math.PI, 0, Math.PI];
      setCarAt(pc, spots[i][0], spots[i][1], headings[i], 28 + i);
    });
    police.ensureHelicopter(g.player.pos);
    const trafficSpots = [
      [156, -140, Math.PI], [164, -160, 0], [156, -180, Math.PI], [164, -200, 0],
      [120, -156, Math.PI / 2], [200, -164, -Math.PI / 2], [80, -160, Math.PI / 2], [240, -160, -Math.PI / 2],
    ];
    g.traffic.slice(0, 8).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const pedSpots = [[150, -110], [170, -130], [148, -150], [172, -170], [150, -190], [170, -100]];
    g.peds.slice(0, 6).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 5; g.missions.state = 'active'; g.missions.timer = 150;
    g.missions.heistGrabbed = true;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    g.cameraYaw = 0; g.cameraPitch = 0.14; g.camDist = 12; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 12450;
    g.clockDay = 3; g.clockMin = 21 * 60 + 30;
    g.player.armour = 50;
    g.respect = 3;
    g.combat.hasPistol = true; g.combat.ammo.pistol = 18; g.combat.weapon = 'pistol';
  } else if (shot === 'combat-dock') {
    g.player.pos.x = -235; g.player.pos.z = -135;
    g.player.heading = -1.75;
    g.player.mesh.rotation.y = -1.75;
    police.wanted = 1; police.heat = 0.9;
    police.ensureUnits(g.player.pos);
    g.spawnEnemies();
    const enemySpots = [[-260, -140], [-270, -150], [-255, -155]];
    g.enemies.forEach((e, i) => placeEnemy(e, ...enemySpots[i]));
    const pedSpots = [
      [-240, -100], [-220, -80], [-250, -70], [-210, -100], [-260, -110], [-230, -70],
    ];
    g.peds.slice(0, 6).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    const trafficSpots = [
      [-236, -60, Math.PI], [-244, -40, 0], [-160, -80, Math.PI / 2], [-80, -160, 0],
    ];
    g.traffic.slice(0, 4).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    g.missions.index = 6; g.missions.state = 'active';
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-260, 0, -145);
    g.cameraYaw = -1.75 + Math.PI + 0.5; g.cameraPitch = 0.12; g.camDist = 8; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 870;
    g.clockDay = 2; g.clockMin = 16 * 60 + 40;
    g.player.armour = 62;
    g.respect = 2;
    g.combat.hasPistol = true; g.combat.ammo.pistol = 24; g.combat.weapon = 'pistol';
  } else if (shot === 'plaza-shop') {
    g.player.pos.x = 60; g.player.pos.z = 120;
    g.player.heading = 0;
    g.player.mesh.rotation.y = 0;
    police.wanted = 0;
    const trafficSpots = [
      [76, 120, 0], [84, 160, Math.PI], [76, 200, 0], [84, 80, Math.PI],
      [40, 156, Math.PI / 2], [120, 164, -Math.PI / 2], [0, 160, Math.PI / 2], [160, 160, -Math.PI / 2],
    ];
    g.traffic.slice(0, 8).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.playerCar(sport, 86, 130, Math.PI);
    g.playerCar(sport, 86, 155, Math.PI);
    const pedSpots = [
      [52, 130], [68, 135], [56, 150], [64, 110], [72, 145], [48, 140],
      [60, 160], [76, 125], [44, 120], [70, 155], [52, 105], [66, 165],
    ];
    g.peds.slice(0, 12).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 1; g.missions.state = 'idle';
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-180, 0, 190);
    g.cameraYaw = Math.PI; g.cameraPitch = 0.15; g.camDist = 7; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 5050;
    g.clockDay = 2; g.clockMin = 14 * 60 + 30;
    g.player.armour = 100;
    g.respect = 2;
  }
  for (let i = 0; i < 20; i++) g.stepWorld(1 / 60, true);
  if (shot === 'cover') {
    pinHelicopter(g, 75, 15, 30);
    if (g.police.heli) g.police.heli.mesh.traverse((o) => { if (o.geometry && o.geometry.type === 'ConeGeometry') { o.material.opacity = 0.28; o.scale.set(0.55, 1, 0.55); } });
  }
  if (shot === 'heist-night') pinHelicopter(g, 60, 15, 20);
  if (shot === 'combat-dock') {
    const fwd = { x: Math.sin(g.player.heading), z: Math.cos(g.player.heading) };
    const muzzle = new THREE.Vector3(
      g.player.pos.x + fwd.x * 1.2, 1.4, g.player.pos.z + fwd.z * 1.2,
    );
    g.combat.staticFlash(muzzle, new THREE.Vector3(fwd.x, 0, fwd.z));
    const thug = g.enemies[0];
    if (thug) {
      const end = new THREE.Vector3(thug.pos.x, 1.2, thug.pos.z);
      const dir = end.clone().sub(muzzle);
      const len = dir.length();
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, len, 6),
        new THREE.MeshBasicMaterial({ color: 0xffe66d, transparent: true, opacity: 0.85 }),
      );
      beam.position.copy(muzzle).add(end).multiplyScalar(0.5);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      g.scene.add(beam);
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd23f }),
      );
      hit.position.copy(end);
      g.scene.add(hit);
    }
  }
  const hudFinal = {
    cover: ['MISSION 8/8 · THE LAST RUN', 'Reach the boat at the end of the pier before time runs out!', 132],
    'heist-night': ['MISSION 6/8 · VELA BANK HEIST', 'Loot secured! Run for the pier before the cops close in!', 150],
    'combat-dock': ['MISSION 7/8 · SHOOT BACK', 'Three dock thugs are waiting for you. Drop them all.', 0],
    'plaza-shop': ['MISSION 2/8 · FLASH CAB', 'A fare is waiting at Playa Azul. Get them to Faro Vela, fast!', 0],
  }[shot];
  if (hudFinal) {
    g.hud.setObjective(hudFinal[0], hudFinal[1]);
    g.hud.setTimer(hudFinal[2]);
  }
  const si = g.missions.stageInfo();
  g.hud.setStage(si.stage, si.total, si.next);
  g.hud.setPolice(g.police.units(g.player.pos));
  g.hud.setCondition(g.player.inCar ? g.player.car.condition : 100);
  g.hud.setMoney(g.money);
  g.hud.setWanted(police.wanted);
  g.hud.setHealth(g.player.health);
  g.hud.setArmour(g.player.armour);
  g.hud.setRespect(g.respect);
  g.updateWeaponLine();
  g.hud.setClock(g.clockDay, Math.floor(g.clockMin / 60), Math.floor(g.clockMin % 60));
  const missionId = { cover: 8, 'heist-night': 6, 'combat-dock': 7, 'plaza-shop': 2 }[shot];
  const dlg = DIALOGS[missionId];
  if (dlg) g.hud.setDialog(dlg.giver, dlg.line);
  const district = { cover: 'PUERTO VELA', 'heist-night': 'GLASS DISTRICT', 'combat-dock': 'PUERTO VELA', 'plaza-shop': 'OLD TOWN' }[shot];
  g.hud.setDistrict(district);
  const radio = {
    cover: '🎵 SOL FM 95.4 — SYNTHWAVE',
    'heist-night': '🎵 NIGHTWIRE 88.7 — NIGHT DRIVE',
    'combat-dock': '🎵 VELA WAVE 101.2 — CHILLWAVE',
    'plaza-shop': '🎵 VELA WAVE 101.2 — CHILLWAVE',
  }[shot];
  g.hud.setRadio(radio);
  if (shot === 'cover') g.player.car.speed = 36;
  else if (shot === 'heist-night') g.player.car.speed = 30;
  if (shot === 'plaza-shop') {
    g.hud.setDistance(null);
  } else {
    const tgt = g.missions.targetPos();
    if (tgt) g.hud.setDistance(Math.hypot(tgt.x - g.player.pos.x, tgt.z - g.player.pos.z));
  }
  g.hud.setSpeed(g.player.inCar ? g.player.car.kmh() : 0, g.player.inCar);
  g.hud.setCarName(g.player.inCar ? g.player.car.model.name : '');
  g.hud.messageTimer = 0;
  g.hud.el.message.style.opacity = '0';
  if (shot === 'cover') g.hud.showMessage('🔥 NEAR MISS +$250', 999);
  else if (shot === 'heist-night') g.hud.showMessage('🚧 ROADBLOCK AHEAD', 999);
  else if (shot === 'combat-dock') g.hud.showMessage('⚠️ THUGS OPEN FIRE', 999);
  else if (shot === 'plaza-shop') g.hud.showMessage('🏆 MISSION PASSED! +$5,000', 999);
  if (shot === 'plaza-shop') g.hud.showPrompt(null);
  g.frozen = true;
  g.renderOnce();
  window.__VELAMAR_READY__ = true;
}
