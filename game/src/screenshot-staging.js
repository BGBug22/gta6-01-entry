// Deterministic screenshot mode — ?shot=cover|heist-night|combat-dock|plaza-shop
// Stages the scene, the 3D street-level CHASE camera (not top-down), wanted,
// and the HUD exactly for each shot, then freezes the simulation so every
// capture produces the same frame.
// Chase camera: low behind the car, yaw slightly left so the sea + beach +
// lighthouse enter the frame; the helicopter is pinned explicitly in the
// upper-left sky so it sits WHOLE inside the frame (not clipped by the edge).
import * as THREE from 'three';
import { CAR_MODELS, DIALOGS } from './config.js';

export function parseShot() {
  const q = new URLSearchParams(location.search);
  return { shot: q.get('shot') || null, seed: Number(q.get('seed') || 1) };
}

// Move one traffic car to a set point + heading.
function placeTrafficCar(tc, x, z, heading) {
  tc.car.pos.x = x; tc.car.pos.z = z;
  tc.car.heading = heading; tc.car.mesh.rotation.y = heading;
}

// Move one pedestrian to a set point.
function placePed(pd, x, z) {
  pd.mesh.position.set(x, 0, z);
}

// Move one dock thug to a set point (combat-dock shot).
function placeEnemy(e, x, z) {
  e.mesh.position.set(x, 0, z);
  e.pos = e.mesh.position;
}

// Pin the helicopter in the upper-left sky (relative to the camera):
// fwd meters forward, left meters to the left, y = fixed height.
// Called AFTER the 20 staging steps — the live orbit no longer moves it.
function pinHelicopter(game, fwd, left, height) {
  const p = game.police;
  if (!p.heli) return;
  const cam = game.camera;
  const tgt = game.player.inCar ? game.player.car.pos : game.player.pos;
  const cx = cam.position.x, cz = cam.position.z;
  let hx = tgt.x - cx, hz = tgt.z - cz;
  const hl = Math.hypot(hx, hz) || 1;
  hx /= hl; hz /= hl; // forward (horizontal)
  const lx = hz, lz = -hx; // left
  const px = cx + hx * fwd + lx * left;
  const pz = cz + hz * fwd + lz * left;
  p.placeHelicopter(px, height, pz, Math.atan2(cx - px, cz - pz));
}

// Stage the game for one shot. Called once after the world is built.
export function stageShot(game, shot) {
  const g = game;
  g.shotMode = shot;
  g.started = true;
  g.topDown = false; // v5: chase camera, not top-down
  g.hud.hideScreen();
  const police = g.police;
  const setCarAt = (car, x, z, heading, speed) => {
    car.pos.x = x; car.pos.z = z; car.heading = heading;
    car.mesh.rotation.y = heading; car.speed = speed || 0;
  };
  // City clock is always DAY 1 18:24 in every shot (overridden per shot below).
  g.clockDay = 1; g.clockMin = 18 * 60 + 24;

  if (shot === 'cover') {
    // COVER: golden-hour pursuit on the BEACH AVENUE x=-240, heading north
    // to the pier. Vanishing-point camera: low, behind and slightly 3/4 of
    // the big Cometa GT hero in the foreground. The sea + sand fill the left
    // half of the frame, palms + beach umbrellas + the low sun over the sea,
    // the Faro Vela lighthouse whole in the mid-right.
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.enterCar(g.playerCar(sport, -240, -170, Math.PI));
    // Speed 0 DURING staging: 20 stepWorld steps move the car ~11 m north
    // and drag the camera with it — the framing (lighthouse whole in frame)
    // is computed from this position. Speed 36 (130 km/h) is restored in
    // the final HUD section, after staging is done.
    g.player.car.speed = 0;
    g.player.car.condition = 78;
    police.wanted = 4; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      // 22-38 m ahead, SPREAD ACROSS the road (not single file): the police
      // close in during staging but never reach the player's (now
      // stationary) car, and they stay visible on both sides of the hero.
      const spots = [[-232, -192], [-248, -200], [-238, -208], [-228, -186]];
      setCarAt(pc, spots[i][0], spots[i][1], Math.PI, 34 + i);
    });
    police.ensureHelicopter(g.player.pos);
    // Traffic on the beach road + the road beside it — all IN FRONT of the camera.
    const trafficSpots = [
      [-236.5, -190, Math.PI], [-243.5, -210, 0], [-236.5, -240, Math.PI],
      [-243.5, -265, 0], [-236.5, -285, Math.PI], [-243.5, -225, 0],
      [-156.5, -200, Math.PI], [-163.5, -230, 0], [-156.5, -260, Math.PI], [-163.5, -190, 0],
    ];
    g.traffic.slice(0, 10).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    // Pedestrians on the beach sidewalk + the sand, in front of the camera.
    const pedSpots = [
      [-256, -185], [-229, -195], [-258, -215], [-231, -225], [-254, -245],
      [-262, -270], [-230, -255], [-257, -200], [-228, -280], [-253, -290],
    ];
    g.peds.slice(0, 10).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 7; g.missions.state = 'active'; g.missions.timer = 132;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    // Chase camera: yaw 0.65 (~37 deg west of north) so the view runs DOWN
    // the beach boulevard (vanishing point ahead) with the sea + beach
    // filling the left half and the Art Deco city on the right; pitch 0.03
    // + dist 13 keeps the whole Faro Vela lighthouse in frame; camLookSide
    // -3 shifts the aim west so the sea fills the left, hero sits right.
    g.cameraYaw = 0.65; g.cameraPitch = 0.03; g.camDist = 13; g.cameraSide = 0; g.camLookSide = -3;
    g.money = 18450; // mission 8/8, DAY 3 — an endgame player must be rich (champions $12-48k)
    g.clockDay = 3; g.clockMin = 18 * 60 + 36;
    g.player.armour = 54;
    g.respect = 4;
    g.combat.hasPistol = true; g.combat.ammo.pistol = 24; g.combat.weapon = 'pistol';
  } else if (shot === 'heist-night') {
    // HEIST NIGHT: the Vela Bank escape in the Glass District, at NIGHT
    // (the city was built with { night: true }). The player in a coupe on
    // road x=160 heading north, the VELA BANK neon sign + glass towers
    // ahead-right, 4 stars, a roadblock car ahead, the helicopter
    // searchlight cone cutting the dark sky.
    const coupe = CAR_MODELS.find((m) => m.id === 'coupe');
    g.enterCar(g.playerCar(coupe, 160, -120, Math.PI));
    // Speed 0 during staging (like the cover) — restored to 30
    // (108 km/h) in the final HUD section.
    g.player.car.speed = 0;
    g.player.car.condition = 85;
    police.wanted = 4; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      // two chasers behind, one roadblock ahead (facing the player), one flank
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
    g.missions.heistGrabbed = true; // the loot is in hand — the escape phase
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    // Camera behind the car, looking north up road x=160: the bank neon +
    // glass towers ahead-right, the road vanishing ahead.
    g.cameraYaw = 0; g.cameraPitch = 0.14; g.camDist = 12; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 12450; // heist loot — big money (champions $12-48k)
    g.clockDay = 3; g.clockMin = 21 * 60 + 30;
    g.player.armour = 50;
    g.respect = 3;
    // The heist crew is armed — pistol active in the escape shot.
    g.combat.hasPistol = true; g.combat.ammo.pistol = 18; g.combat.weapon = 'pistol';
  } else if (shot === 'combat-dock') {
    // COMBAT DOCK: on foot at Puerto Vela Docks, mid-shootout. The
    // articulated player aims a pistol at three dock thugs between the
    // player and the cargo ship — containers to the right, the dock crane
    // and the ship + sea ahead. Static muzzle flash + tracer are placed
    // after staging (deterministic — no timer).
    g.player.pos.x = -235; g.player.pos.z = -135;
    g.player.heading = -1.75; // facing west, toward the crane + cargo ship + sea
    g.player.mesh.rotation.y = -1.75;
    police.wanted = 1; police.heat = 0.9;
    police.ensureUnits(g.player.pos);
    // Thugs in front of the player, between the player and the ship.
    g.spawnEnemies();
    const enemySpots = [[-260, -140], [-270, -150], [-255, -155]];
    g.enemies.forEach((e, i) => placeEnemy(e, ...enemySpots[i]));
    // Dock workers + a couple of peds on the pier road.
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
    // Camera over-the-shoulder: 3/4 behind the player's RIGHT side (the
    // player faces west, so right = north) — the dock crane mast, which
    // stood dead-center, now sits off to the side and the thugs + ship +
    // sea stay in frame.
    g.cameraYaw = -1.75 + Math.PI + 0.5; g.cameraPitch = 0.12; g.camDist = 8; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 870;
    g.clockDay = 2; g.clockMin = 16 * 60 + 40;
    g.player.armour = 62;
    g.respect = 2;
    g.combat.hasPistol = true; g.combat.ammo.pistol = 24; g.combat.weapon = 'pistol';
  } else if (shot === 'plaza-shop') {
    // PLAZA SHOP: bright afternoon at Plaza Mercado. The player on foot by
    // the fountain, cars + palms + the market around, the OLD TOWN sign in
    // frame. A compact "MISSION PASSED! +$5,000" banner (the #message line,
    // not a dark modal) sits at the top — over 75% of the 3D city stays
    // fully visible.
    g.player.pos.x = 60; g.player.pos.z = 120;
    g.player.heading = 0; // facing south (+z), toward the fountain at (60, 140)
    g.player.mesh.rotation.y = 0;
    police.wanted = 0;
    const trafficSpots = [
      [76, 120, 0], [84, 160, Math.PI], [76, 200, 0], [84, 80, Math.PI],
      [40, 156, Math.PI / 2], [120, 164, -Math.PI / 2], [0, 160, Math.PI / 2], [160, 160, -Math.PI / 2],
    ];
    g.traffic.slice(0, 8).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    // Two sports cars parked at the plaza's east edge (on the road, curb side).
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.playerCar(sport, 86, 130, Math.PI);
    g.playerCar(sport, 86, 155, Math.PI);
    const pedSpots = [
      [52, 130], [68, 135], [56, 150], [64, 110], [72, 145], [48, 140],
      [60, 160], [76, 125], [44, 120], [70, 155], [52, 105], [66, 165],
    ];
    g.peds.slice(0, 12).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    // Mission 1 just passed — mission 2 (taxi) is next.
    g.missions.index = 1; g.missions.state = 'idle';
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-180, 0, 190);
    // Camera behind the player, looking south at the fountain + market.
    g.cameraYaw = Math.PI; g.cameraPitch = 0.15; g.camDist = 7; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 5050; // $5,000 mission bonus + $50 starting cash
    g.clockDay = 2; g.clockMin = 14 * 60 + 30;
    g.player.armour = 100;
    g.respect = 2;
  }
  // Freeze the simulation after 20 fixed steps so traffic & police settle.
  for (let i = 0; i < 20; i++) g.stepWorld(1 / 60, true);
  // Helicopter: pin it in the upper-left sky AFTER the live orbit — whole in frame.
  // cover: fwd 70 (bigger but not clipped) + left 20 + height 15 —
  // height 15 m puts the heli ~60% up the frame, clear of the lighthouse
  // silhouette now in the mid-right.
  if (shot === 'cover') pinHelicopter(g, 70, 20, 15);
  if (shot === 'heist-night') pinHelicopter(g, 60, 15, 20);
  // Combat-dock: static muzzle flash + tracer (deterministic — no timer).
  if (shot === 'combat-dock') {
    const fwd = { x: Math.sin(g.player.heading), z: Math.cos(g.player.heading) };
    const muzzle = new THREE.Vector3(
      g.player.pos.x + fwd.x * 1.2, 1.4, g.player.pos.z + fwd.z * 1.2,
    );
    g.combat.staticFlash(muzzle, new THREE.Vector3(fwd.x, 0, fwd.z));
    // tracer from the muzzle to the nearest thug — a glowing beam
    // (a real 3D cylinder, visible at screenshot resolution) + an impact
    // burst where the round hits the thug.
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
  // Final HUD AFTER staging — stepWorld overwrites the objective text every frame.
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
  // Weapon line + slots from the combat state (also shows the gun in the
  // player's hand for the on-foot shot).
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
  // Restore the chase speed AFTER the 20 staging steps: friction
  // (drive() without gas) grinds 36 -> 26 m/s during staging, so the HUD
  // would show 95 instead of 130 km/h. The game is frozen after this, so
  // this is the number in the screenshot — the real chase speed.
  if (shot === 'cover') g.player.car.speed = 36;
  else if (shot === 'heist-night') g.player.car.speed = 30;
  // Distance is computed from the FINAL position (after staging) — a real number, not invented.
  if (shot === 'plaza-shop') {
    g.hud.setDistance(null);
  } else {
    const tgt = g.missions.targetPos();
    if (tgt) g.hud.setDistance(Math.hypot(tgt.x - g.player.pos.x, tgt.z - g.player.pos.z));
  }
  g.hud.setSpeed(g.player.inCar ? g.player.car.kmh() : 0, g.player.inCar);
  g.hud.setCarName(g.player.inCar ? g.player.car.model.name : '');
  // Clear the "Car stolen!" message from staging — then replace it with
  // action feedback text (champion style): a signal that something is
  // happening RIGHT NOW.
  g.hud.messageTimer = 0;
  g.hud.el.message.style.opacity = '0';
  if (shot === 'cover') g.hud.showMessage('🔥 NEAR MISS +$250', 999);
  else if (shot === 'heist-night') g.hud.showMessage('🚧 ROADBLOCK AHEAD', 999);
  else if (shot === 'combat-dock') g.hud.showMessage('⚠️ THUGS OPEN FIRE', 999);
  else if (shot === 'plaza-shop') g.hud.showMessage('🏆 MISSION PASSED! +$5,000', 999);
  // Plaza-shop: hide the "[E] Exit Vehicle" prompt — nothing to enter here.
  if (shot === 'plaza-shop') g.hud.showPrompt(null);
  g.frozen = true;
  g.renderOnce();
  window.__VELAMAR_READY__ = true;
}
