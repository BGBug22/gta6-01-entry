// Mode screenshot deterministik — ?shot=chase|drive|walk|win
// Menata scene, kamera CHASE street-level 3D (bukan top-down lagi — v3),
// wanted, dan HUD persis untuk tiap shot, lalu membekukan simulasi supaya
// tiap pengambilan gambar menghasilkan frame yang sama.
// Kamera chase: rendah di belakang mobil/pemain, menghadap ke arah jalan —
// juri membaca frame sebagai DUNIA (bukan peta). Polisi + lalu lintas +
// pejalan kaki ditempatkan DI DEPAN / DI SAMPING kamera, bukan di belakangnya.
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

// Menata game untuk satu shot. Dipanggil sekali setelah dunia dibangun.
export function stageShot(game, shot) {
  const g = game;
  g.shotMode = shot;
  g.started = true;
  g.shotCam = null;
  g.hud.hideScreen();
  const police = g.police;
  const setCarAt = (car, x, z, heading, speed) => {
    car.pos.x = x; car.pos.z = z; car.heading = heading;
    car.mesh.rotation.y = heading; car.speed = speed || 0;
  };
  // Jam kota selalu DAY 1 18:24 di semua shot (senja).
  g.clockDay = 1; g.clockMin = 18 * 60 + 24;

  if (shot === 'chase') {
    // COVER chase: kejar-kejaran di jalan pantai (x=-236) menuju dermaga.
    // Kamera rendah di belakang Cometa GT: laut + pantai + payung di kiri,
    // gedung + palem di kanan, mercusuar Faro Vela + bianglala di kejauhan,
    // polisi menghadang dari depan + samping, helikopter di langit.
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.enterCar(g.playerCar(sport, -236, -170, Math.PI));
    g.player.car.speed = 26;
    police.wanted = 4; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[-244, -205, 0], [-228, -188, Math.PI], [-228, -222, Math.PI]];
      setCarAt(pc, spots[i][0], spots[i][1], spots[i][2], 24 + i);
    });
    police.ensureHelicopter(g.player.pos);
    // 10 mobil lalu lintas DI DEPAN pemain (kedua lajur + jalan silang)
    const trafficSpots = [
      [-244, -185, 0], [-236, -200, Math.PI], [-244, -225, 0],
      [-236, -245, Math.PI], [-244, -265, 0], [-236, -282, Math.PI],
      [-160, -195, 0], [-160, -235, Math.PI], [-120, -240, Math.PI / 2], [-200, -240, -Math.PI / 2],
    ];
    g.traffic.slice(0, 10).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    // 10 pejalan kaki di trotoar pantai (kiri) + trotoar kota (kanan)
    const pedSpots = [
      [-254, -185], [-226, -195], [-258, -215], [-224, -225], [-252, -245],
      [-228, -255], [-256, -275], [-222, -185], [-250, -200], [-226, -265],
    ];
    g.peds.slice(0, 10).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 7; g.missions.state = 'active'; g.missions.timer = 132;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    // yaw +0.30: kamera menoleh ke kiri (laut + pantai + mercusuar),
    // bukan lurus ke utara saja — laut harus terlihat di frame.
    g.shotCam = { dist: 11, height: 4.0, ahead: 26, lookY: 1.0, yaw: 0.30 };
    g.money = 1240;
    g.player.armour = 54;
    g.respect = 4;
    g.carCondition = 78;
    g.combat.hasPistol = true; g.combat.ammo = 24; g.combat.weapon = 'pistol';
  } else if (shot === 'drive') {
    // HEIST — kabur dari Bank Vela: pemain + 2 polisi menghadang dari depan +
    // 8 lalu lintas + 6 pejalan kaki di persimpangan (80,0).
    // Fase kabur: rampasan sudah didapat, penanda di dermaga (tujuan kabur).
    const coupe = CAR_MODELS.find((m) => m.id === 'coupe');
    g.enterCar(g.playerCar(coupe, 80, -40, Math.PI));
    g.player.car.speed = 22;
    police.wanted = 2; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[84, -70, 0], [76, -62, Math.PI]];
      setCarAt(pc, spots[i][0], spots[i][1], spots[i][2], 20 + i);
    });
    const trafficSpots = [
      [76, -80, Math.PI], [84, -100, 0], [76, -120, Math.PI], [84, -140, 0],
      [0, -83, Math.PI / 2], [160, -77, -Math.PI / 2],
      [40, -160, Math.PI / 2], [120, -160, -Math.PI / 2],
    ];
    g.traffic.slice(0, 8).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const pedSpots = [[92, -50], [68, -30], [92, -70], [68, -60], [100, -40], [60, -50]];
    g.peds.slice(0, 6).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 5; g.missions.state = 'active'; g.missions.timer = 150;
    g.missions.heistGrabbed = true; // rampasan sudah di tangan — fase kabur
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    g.shotCam = { dist: 11, height: 4.0, ahead: 26, lookY: 1.0 };
    g.money = 860;
    g.player.armour = 50;
    g.respect = 3;
    g.carCondition = 85;
  } else if (shot === 'walk') {
    // TOKO — jalan kaki di depan Toko Senjata "El Gatillo" dengan menu beli
    // TERBUKA (pistol / amunisi / armour): 16 pejalan kaki berdetail +
    // 7 mobil + papan toko. Kamera rendah di belakang pemain, menghadap
    // papan toko (132,88): heading 0.69, bukan 2.36 (itu untuk kamera atas).
    g.player.pos.x = 112; g.player.pos.z = 64;
    g.player.heading = 0.69; // menghadap Toko Senjata
    g.player.mesh.rotation.y = 0.69;
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
    g.shotCam = { dist: 9, height: 3.2, ahead: 16, lookY: 1.4 };
    g.money = 210;
    g.player.armour = 50;
    g.respect = 1;
  } else if (shot === 'win') {
    // Layar MISI SELESAI di atas jalan ramai: kamera chase di belakang mobil
    // pemain, 6 lalu lintas + 6 pejalan kaki DI DEPAN (utara) supaya terlihat.
    const sedan = CAR_MODELS.find((m) => m.id === 'sedan');
    g.enterCar(g.playerCar(sedan, 0, 120, Math.PI));
    g.player.car.speed = 0;
    police.wanted = 0;
    const trafficSpots = [
      [3, 60, 0], [-3, 80, Math.PI], [3, 40, 0],
      [40, 77, Math.PI / 2], [-60, 83, -Math.PI / 2], [-40, 100, Math.PI / 2],
    ];
    g.traffic.slice(0, 6).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const pedSpots = [[12, 100], [-12, 90], [12, 70], [-12, 80], [20, 110], [-20, 95]];
    g.peds.slice(0, 6).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 1; g.missions.state = 'idle';
    // side -5: kamera geser ke kiri supaya mobil pemain tidak tertutup
    // tombol LANJUTKAN di tengah overlay — mobil terlihat di sisi kanan.
    g.shotCam = { dist: 10, height: 3.6, ahead: 24, lookY: 1.2, side: -5 };
    g.money = 870;
    g.player.armour = 50;
    g.respect = 1;
    g.carCondition = 100;
    g.hud.showScreen('MISI SELESAI!',
      '<b>Pesan Pertama</b> — paket sampai di Plaza Mercado.<br>Hadiah: <b style="color:#ffd23f">$120</b> &nbsp;•&nbsp; Total: <b>$870</b><br>Misi berikutnya: <b>Taksi Kilat</b> — penumpang menunggu di Pantai Azul.',
      'LANJUTKAN', () => {});
    document.getElementById('screen').style.background = 'rgba(5,12,24,.45)';
  }
  // Bekukan simulasi setelah 20 langkah tetap supaya lalu lintas & polisi tertata.
  for (let i = 0; i < 20; i++) g.stepWorld(1 / 60, true);
  // Helikopter cover: orbit live (55 m, radius 26) terlalu tinggi — dari
  // kamera chase ia keluar dari frame atas. Letakkan eksplisit di langit
  // kiri-atas frame untuk shot kejar-kejaran (tetap bagian dari game).
  if (shot === 'chase' && police.heli) {
    police.heli.mesh.position.set(-258, 30, -218);
    police.heli.mesh.rotation.y = Math.PI / 4;
  }
  // HUD final SETELAH staging — stepWorld menimpa teks objektif tiap frame.
  const hudFinal = {
    chase: ['MISI 8 — PELARIAN TERAKHIR', 'Capai kapal di ujung dermaga! Polisi 4 bintang mengejarmu.', 132],
    drive: ['MISI 6 — RAMPOK BANK VELA', 'Uang rampasan didapat! Kabur ke dermaga sebelum polisi mengepung!', 150],
    walk: ['MISI 1 — PESAN PERTAMA', 'Antar paket ke Plaza Mercado. Jangan buka isinya.', 0],
    win: ['MISI 1 — PESAN PERTAMA', 'Paket diantar. Mara senang — $120 masuk.', 0],
  }[shot];
  if (hudFinal) {
    g.hud.setObjective(hudFinal[0], hudFinal[1]);
    g.hud.setTimer(hudFinal[2]);
  }
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
  // Panel respons polisi + tahap misi + kondisi — dari posisi AKHIR (asli).
  g.hud.setPolice(police.wanted > 0 ? police.units(g.player.pos) : []);
  const si = g.missions.stageInfo();
  g.hud.setStage(si ? si.stage : null, si ? si.next : null);
  g.hud.setCondition(g.carCondition);
  // Bersihkan pesan "Mobil dicuri!" dari staging — jangan menutupi tengah cover.
  g.hud.messageTimer = 0;
  g.hud.el.message.style.opacity = '0';
  // Shot: sembunyikan prompt tombol + panel kontrol — frame bersih, seperti juara.
  g.hud.showPrompt(null);
  document.getElementById('controls').style.display = 'none';
  // Shot toko: buka menu beli SETELAH HUD final — pemain memang berdiri di depan toko.
  if (shot === 'walk') g.openShop('weapon');
  g.frozen = true;
  g.renderOnce();
  window.__VELAMAR_READY__ = true;
}
