// Mode screenshot deterministik — ?shot=chase|drive|walk|win
// Menata scene, kamera CHASE 3D street-level (bukan top-down), wanted,
// dan HUD persis untuk tiap shot, lalu membekukan simulasi supaya tiap
// pengambilan gambar menghasilkan frame yang sama.
// Kamera chase: rendah di belakang mobil, yaw sedikit ke kiri supaya laut +
// pantai + mercusuar masuk frame; helikopter dipin eksplisit di langit
// kiri-atas supaya UTUH di dalam frame (tidak terpotong tepi).
import { CAR_MODELS, DIALOGS } from './config.js';

export function parseShot() {
  const q = new URLSearchParams(location.search);
  return { shot: q.get('shot') || null, seed: Number(q.get('seed') || 1) };
}

// Pindahkan satu mobil lalu lintas ke titik + heading yang ditentukan.
function placeTrafficCar(tc, x, z, heading) {
  tc.car.pos.x = x; tc.car.pos.z = z;
  tc.car.heading = heading; tc.car.mesh.rotation.y = heading;
}

// Pindahkan satu pejalan kaki ke titik yang ditentukan.
function placePed(pd, x, z) {
  pd.mesh.position.set(x, 0, z);
}

// Pin helikopter di langit kiri-atas frame (relatif terhadap kamera):
// fwd meter ke depan, left meter ke kiri, y = ketinggian tetap.
// Dipanggil SETELAH 20 langkah staging — orbit live tidak menggesernya lagi.
function pinHelicopter(game, fwd, left, height) {
  const p = game.police;
  if (!p.heli) return;
  const cam = game.camera;
  const tgt = game.player.inCar ? game.player.car.pos : game.player.pos;
  const cx = cam.position.x, cz = cam.position.z;
  let hx = tgt.x - cx, hz = tgt.z - cz;
  const hl = Math.hypot(hx, hz) || 1;
  hx /= hl; hz /= hl; // maju (horizontal)
  const lx = hz, lz = -hx; // kiri
  const px = cx + hx * fwd + lx * left;
  const pz = cz + hz * fwd + lz * left;
  p.placeHelicopter(px, height, pz, Math.atan2(cx - px, cz - pz));
}

// Menata game untuk satu shot. Dipanggil sekali setelah dunia dibangun.
export function stageShot(game, shot) {
  const g = game;
  g.shotMode = shot;
  g.started = true;
  g.topDown = false; // v3: kamera chase, bukan top-down
  g.hud.hideScreen();
  const police = g.police;
  const setCarAt = (car, x, z, heading, speed) => {
    car.pos.x = x; car.pos.z = z; car.heading = heading;
    car.mesh.rotation.y = heading; car.speed = speed || 0;
  };
  // Jam kota selalu DAY 1 18:24 di semua shot.
  g.clockDay = 1; g.clockMin = 18 * 60 + 24;

  if (shot === 'chase') {
    // COVER chase: kejar-kejaran di jalan pantai x=-240 menuju dermaga (utara).
    // Mercusuar Faro Vela + laut + pantai + ferris wheel + helikopter + 3 polisi
    // + lalu lintas + pejalan kaki dalam 1 frame, dari belakang mobil pemain.
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.enterCar(g.playerCar(sport, -240, -170, Math.PI));
    g.player.car.speed = 26;
    g.player.car.condition = 78;
    police.wanted = 4; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[-236.5, -182], [-243.5, -188], [-236.5, -196]];
      setCarAt(pc, spots[i][0], spots[i][1], Math.PI, 24 + i);
    });
    police.ensureHelicopter(g.player.pos);
    // Lalu lintas di jalan pantai + jalan sebelah — semuanya di DEPAN kamera.
    const trafficSpots = [
      [-236.5, -190, Math.PI], [-243.5, -210, 0], [-236.5, -240, Math.PI],
      [-243.5, -265, 0], [-236.5, -285, Math.PI], [-243.5, -225, 0],
      [-156.5, -200, Math.PI], [-163.5, -230, 0], [-156.5, -260, Math.PI], [-163.5, -190, 0],
    ];
    g.traffic.slice(0, 10).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    // Pejalan kaki di trotoar pantai + pasir, di depan kamera.
    const pedSpots = [
      [-256, -185], [-229, -195], [-258, -215], [-231, -225], [-254, -245],
      [-262, -270], [-230, -255], [-257, -200], [-228, -280], [-253, -290],
    ];
    g.peds.slice(0, 10).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 7; g.missions.state = 'active'; g.missions.timer = 132;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    // Kamera chase: di belakang mobil, yaw +0.30 ke kiri (laut masuk frame).
    g.cameraYaw = 0.30; g.cameraPitch = 0.18; g.camDist = 12; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 1240;
    g.player.armour = 54;
    g.respect = 4;
    g.combat.hasPistol = true; g.combat.ammo = 24; g.combat.weapon = 'pistol';
  } else if (shot === 'drive') {
    // HEIST — kabur dari Bank Vela: pemain + 2 polisi di depan +
    // 8 lalu lintas + 6 pejalan kaki di persimpangan (80,0).
    // Fase kabur: rampasan sudah didapat, penanda di dermaga (tujuan kabur).
    const coupe = CAR_MODELS.find((m) => m.id === 'coupe');
    g.enterCar(g.playerCar(coupe, 80, -40, Math.PI));
    g.player.car.speed = 22;
    g.player.car.condition = 85;
    police.wanted = 2; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[76.5, -70], [83.5, -86]];
      setCarAt(pc, spots[i][0], spots[i][1], Math.PI, 20 + i);
    });
    const trafficSpots = [
      [76.5, -65, Math.PI], [83.5, -85, Math.PI], [76.5, -105, 0], [83.5, -130, Math.PI],
      [40, -83, Math.PI / 2], [120, -77, -Math.PI / 2],
      [3, -100, Math.PI], [160, -60, 0],
    ];
    g.traffic.slice(0, 8).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const pedSpots = [[70, -60], [90, -55], [72, -80], [88, -75], [95, -100], [65, -95]];
    g.peds.slice(0, 6).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 5; g.missions.state = 'active'; g.missions.timer = 150;
    g.missions.heistGrabbed = true; // rampasan sudah di tangan — fase kabur
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    g.cameraYaw = 0.20; g.cameraPitch = 0.18; g.camDist = 12; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 860;
    g.player.armour = 50;
    g.respect = 3;
  } else if (shot === 'walk') {
    // TOKO — jalan kaki di jalan z=60, menghadap papan "TOKO SENJATA" di
    // dinding utara gedung (120,80) — papan lurus di tengah frame, di belakang
    // pemain, dengan menu beli TERBUKA (pistol / amunisi / armour).
    // Pemain di (114,58): 6,3 m dari trigger toko (120,60) — toko terbuka;
    // kamera 5,5 m di belakang pemain, di jalan (tidak di dalam gedung).
    g.player.pos.x = 114; g.player.pos.z = 58;
    g.player.heading = 0.90; // menghadap papan TOKO SENJATA (126, 67.6)
    g.player.mesh.rotation.y = 0.90;
    police.wanted = 1; police.heat = 0.9;
    police.ensureUnits(g.player.pos);
    const pedSpots = [
      [100, 50], [120, 92], [140, 60], [96, 72], [128, 40], [150, 68],
      [88, 60], [108, 92], [136, 48], [104, 36], [120, 20], [144, 92],
      [92, 40], [116, 94], [132, 68], [100, 94],
    ];
    g.peds.slice(0, 16).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    const trafficSpots = [
      [77, 40, 0], [83, 100, Math.PI], [157, 20, 0], [163, 60, Math.PI],
      [40, 3, Math.PI / 2], [120, -3, -Math.PI / 2], [60, 77, Math.PI / 2],
    ];
    g.traffic.slice(0, 7).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    g.missions.index = 0; g.missions.state = 'active';
    g.missions.marker.visible = true;
    g.missions.marker.position.set(60, 0, 140);
    // Kamera di belakang pemain jalan kaki (heading + PI), jarak 6,5 m,
    // pitch rendah (0.12) supaya papan toko (y=4) masuk frame di atas pemain.
    g.cameraYaw = 0.90 + Math.PI; g.cameraPitch = 0.12; g.camDist = 6.5; g.cameraSide = 0; g.camLookSide = 0;
    g.money = 210;
    g.player.armour = 50;
    g.respect = 1;
  } else if (shot === 'win') {
    // Layar MISI SELESAI di atas jalan ramai: 6 lalu lintas + 6 pejalan kaki.
    // Titik bidik digeser 5 m ke kiri (camLookSide) supaya mobil pemain
    // tampak di sisi kanan frame, tidak tertutup tombol LANJUTKAN.
    // (cameraSide saja TIDAK cukup — ia menggeser kamera + bidik bersamaan,
    // jadi mobil tetap di tengah layar.)
    const sedan = CAR_MODELS.find((m) => m.id === 'sedan');
    g.enterCar(g.playerCar(sedan, 0, 120, Math.PI));
    g.player.car.speed = 0;
    g.player.car.condition = 100;
    police.wanted = 0;
    const trafficSpots = [
      [3, 60, 0], [-3, 40, Math.PI], [3, 20, 0],
      [40, 77, Math.PI / 2], [-60, 83, -Math.PI / 2], [-40, 60, Math.PI / 2],
    ];
    g.traffic.slice(0, 6).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const pedSpots = [[12, 110], [-12, 100], [12, 90], [-12, 80], [20, 105], [-20, 95]];
    g.peds.slice(0, 6).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 1; g.missions.state = 'idle';
    g.cameraYaw = 0.10; g.cameraPitch = 0.18; g.camDist = 12; g.cameraSide = 0; g.camLookSide = -5;
    g.money = 870;
    g.player.armour = 50;
    g.respect = 1;
    g.hud.showScreen('MISI SELESAI!',
      '<b>Pesan Pertama</b> — paket sampai di Plaza Mercado.<br>Hadiah: <b style="color:#ffd23f">$120</b> &nbsp;•&nbsp; Total: <b>$870</b><br>Misi berikutnya: <b>Taksi Kilat</b> — penumpang menunggu di Pantai Azul.',
      'LANJUTKAN', () => {});
    document.getElementById('screen').style.background = 'rgba(5,12,24,.45)';
  }
  // Bekukan simulasi setelah 20 langkah tetap supaya lalu lintas & polisi tertata.
  for (let i = 0; i < 20; i++) g.stepWorld(1 / 60, true);
  // Helikopter cover: pin di langit kiri-atas SETELAH orbit live — utuh di frame.
  if (shot === 'chase') pinHelicopter(g, 70, 12, 15);
  // HUD final SETELAH staging — stepWorld menimpa teks objektif tiap frame.
  const hudFinal = {
    chase: ['MISSION 8/8 · PELARIAN TERAKHIR', 'Capai kapal di ujung dermaga! Polisi 4 bintang mengejarmu.', 132],
    drive: ['MISSION 6/8 · RAMPOK BANK VELA', 'Uang rampasan didapat! Kabur ke dermaga sebelum polisi mengepung!', 150],
    walk: ['MISSION 1/8 · PESAN PERTAMA', 'Antar paket ke Plaza Mercado. Jangan buka isinya.', 0],
    win: ['MISSION 1/8 · PESAN PERTAMA', 'Paket diantar. Mara senang — $120 masuk.', 0],
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
  if (shot === 'chase') {
    g.hud.setWeapon('🔫 PISTOL VELA — 24/120');
  } else {
    g.hud.setWeapon('✊ Tangan kosong — beli pistol di Toko Senjata ($150)');
  }
  g.hud.setClock(g.clockDay, Math.floor(g.clockMin / 60), Math.floor(g.clockMin % 60));
  const missionId = { chase: 8, drive: 6, walk: 1, win: 1 }[shot];
  const dlg = DIALOGS[missionId];
  if (dlg) g.hud.setDialog(dlg.giver, dlg.line);
  const district = { chase: 'PELABUHAN VELA', drive: 'VELAMAR', walk: 'KOTA TUA', win: 'KOTA TUA' }[shot];
  g.hud.setDistrict(district);
  g.hud.setRadio('🎵 SOL FM 95.4 — SYNTHWAVE');
  // Jarak dihitung dari posisi AKHIR (setelah staging) — angka asli, bukan karangan.
  if (shot === 'win') {
    g.hud.setDistance(null);
  } else {
    const tgt = g.missions.targetPos();
    if (tgt) g.hud.setDistance(Math.hypot(tgt.x - g.player.pos.x, tgt.z - g.player.pos.z));
  }
  g.hud.setSpeed(g.player.inCar ? g.player.car.kmh() : 0, g.player.inCar);
  g.hud.setCarName(g.player.inCar ? g.player.car.model.name : '');
  // Bersihkan pesan "Mobil dicuri!" dari staging — jangan menutupi tengah cover.
  g.hud.messageTimer = 0;
  g.hud.el.message.style.opacity = '0';
  // Shot menang: sembunyikan prompt "[E] Keluar mobil" — jangan menutupi mobil pemain.
  if (shot === 'win') g.hud.showPrompt(null);
  // Shot toko: buka menu beli SETELAH HUD final — pemain memang berdiri di depan toko.
  if (shot === 'walk') g.openShop('weapon');
  g.frozen = true;
  g.renderOnce();
  window.__VELAMAR_READY__ = true;
}
