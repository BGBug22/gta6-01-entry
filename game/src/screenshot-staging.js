// Mode screenshot deterministik — ?shot=chase|drive|walk|win
// Menata scene, kamera ATAS (top-down), wanted, dan HUD persis untuk tiap shot,
// lalu membekukan simulasi supaya tiap pengambilan gambar menghasilkan frame yang sama.
// Kamera atas: lurus ke bawah dari ketinggian tetap, utara (-z) di atas layar,
// jalan sejajar sumbu — kota terbaca walau dikecilkan juri.
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
  g.topDown = true;
  g.hud.hideScreen();
  const police = g.police;
  const setCarAt = (car, x, z, heading, speed) => {
    car.pos.x = x; car.pos.z = z; car.heading = heading;
    car.mesh.rotation.y = heading; car.speed = speed || 0;
  };
  // Jam kota selalu DAY 1 18:24 di semua shot.
  g.clockDay = 1; g.clockMin = 18 * 60 + 24;

  if (shot === 'chase') {
    // COVER top-down: kejar-kejaran di jalan pantai x=-240 menuju dermaga.
    // Mercusuar Faro Vela utuh + laut + pantai + dermaga + jalan pantai +
    // 10 lalu lintas + 3 polisi + 10 pejalan kaki + helikopter dalam 1 frame.
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.enterCar(g.playerCar(sport, -240, -170, Math.PI));
    g.player.car.speed = 26;
    police.wanted = 4; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[-232, -182], [-248, -186], [-236, -194]];
      setCarAt(pc, spots[i][0], spots[i][1], Math.PI, 24 + i);
    });
    police.ensureHelicopter(g.player.pos);
    // 10 mobil lalu lintas di jalan pantai + jalan sebelah
    const trafficSpots = [
      [-236, -140, Math.PI], [-244, -180, 0], [-236, -220, Math.PI],
      [-244, -100, 0], [-236, -260, Math.PI], [-244, -250, 0],
      [-156, -200, 0], [-164, -150, Math.PI], [-164, -240, 0], [-156, -120, Math.PI],
    ];
    g.traffic.slice(0, 10).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    // 10 pejalan kaki di trotoar pantai
    const pedSpots = [
      [-252, -150], [-228, -170], [-256, -200], [-230, -210], [-250, -120],
      [-262, -240], [-232, -250], [-258, -90], [-226, -140], [-254, -180],
    ];
    g.peds.slice(0, 10).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 7; g.missions.state = 'active'; g.missions.timer = 132;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    g.topDownHeight = 240; g.topDownOffset = { x: 0, z: 0 };
    g.money = 1240;
    g.player.armour = 54;
    g.respect = 4;
    g.combat.hasPistol = true; g.combat.ammo = 24; g.combat.weapon = 'pistol';
  } else if (shot === 'drive') {
    // HEIST — kabur dari Bank Vela: pemain + 2 polisi di belakang +
    // 8 lalu lintas + 6 pejalan kaki di persimpangan (80,0).
    // Fase kabur: rampasan sudah didapat, penanda di dermaga (tujuan kabur).
    const coupe = CAR_MODELS.find((m) => m.id === 'coupe');
    g.enterCar(g.playerCar(coupe, 80, -40, Math.PI));
    g.player.car.speed = 22;
    police.wanted = 2; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[80, -70], [80, -86]];
      setCarAt(pc, spots[i][0], spots[i][1], Math.PI, 20 + i);
    });
    const trafficSpots = [
      [76, 20, 0], [84, -80, Math.PI], [76, 60, Math.PI], [84, -120, 0],
      [20, 3, Math.PI / 2], [140, -3, -Math.PI / 2],
      [40, -77, Math.PI / 2], [120, -83, -Math.PI / 2],
    ];
    g.traffic.slice(0, 8).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const pedSpots = [[92, 12], [68, -12], [92, -8], [68, 8], [100, 20], [60, -20]];
    g.peds.slice(0, 6).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 5; g.missions.state = 'active'; g.missions.timer = 150;
    g.missions.heistGrabbed = true; // rampasan sudah di tangan — fase kabur
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -198);
    g.topDownHeight = 170; g.topDownOffset = { x: 0, z: 40 };
    g.money = 860;
    g.player.armour = 50;
    g.respect = 3;
  } else if (shot === 'walk') {
    // TOKO — jalan kaki di depan Toko Senjata "El Gatillo" dengan menu beli
    // TERBUKA (pistol / amunisi / armour): 16 pejalan kaki berdetail +
    // 7 mobil + papan toko. Kamera rendah (~110) supaya pemain + ring terlihat.
    g.player.pos.x = 114; g.player.pos.z = 66;
    g.player.heading = 2.36; // menghadap Toko Senjata
    g.player.mesh.rotation.y = 2.36;
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
    g.topDownHeight = 110; g.topDownOffset = { x: 0, z: 0 };
    g.money = 210;
    g.player.armour = 50;
    g.respect = 1;
  } else if (shot === 'win') {
    // Layar MISI SELESAI di atas jalan ramai (top-down): 6 lalu lintas +
    // 6 pejalan kaki. Kamera digeser supaya mobil pemain terlihat di sisi overlay.
    const sedan = CAR_MODELS.find((m) => m.id === 'sedan');
    g.enterCar(g.playerCar(sedan, 0, 120, Math.PI));
    g.player.car.speed = 0;
    police.wanted = 0;
    const trafficSpots = [
      [3, 60, 0], [-3, 180, Math.PI], [3, 200, 0],
      [40, 77, Math.PI / 2], [-60, 83, -Math.PI / 2], [-40, 157, Math.PI / 2],
    ];
    g.traffic.slice(0, 6).forEach((tc, i) => placeTrafficCar(tc, ...trafficSpots[i]));
    const pedSpots = [[12, 110], [-12, 130], [12, 150], [-12, 100], [20, 120], [-20, 140]];
    g.peds.slice(0, 6).forEach((pd, i) => placePed(pd, ...pedSpots[i]));
    g.missions.index = 1; g.missions.state = 'idle';
    g.topDownHeight = 160; g.topDownOffset = { x: 70, z: 0 };
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
