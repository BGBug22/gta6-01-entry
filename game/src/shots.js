// Mode screenshot deterministik — ?shot=chase|drive|walk|win
// Menata scene, kamera, wanted, dan HUD persis untuk tiap shot, lalu membekukan
// simulasi supaya tiap pengambilan gambar menghasilkan frame yang sama.
import { CAR_MODELS } from './config.js';

export function parseShot() {
  const q = new URLSearchParams(location.search);
  return { shot: q.get('shot') || null, seed: Number(q.get('seed') || 1) };
}

// Menata game untuk satu shot. Dipanggil sekali setelah dunia dibangun.
export function stageShot(game, shot) {
  const g = game;
  g.shotMode = shot;
  g.started = true;
  g.hud.hideScreen();
  const police = g.police;
  const setCarAt = (car, x, z, heading, speed) => {
    car.pos.x = x; car.pos.z = z; car.heading = heading;
    car.mesh.rotation.y = heading; car.speed = speed || 0;
  };

  if (shot === 'chase') {
    // Kejar-kejaran: pemain di Cometa GT melaju ke UTARA di jalan x=-240
    // menuju dermaga Faro Vela. Kamera di BELAKANG mobil; 3 mobil polisi
    // mengepung dari depan-samping (kiri-kanan) supaya ketiganya + mercusuar
    // Faro Vela masuk satu frame.
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.enterCar(g.playerCar(sport, -240, -170, Math.PI));
    g.player.car.speed = 26;
    police.wanted = 3; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[-232, -182], [-248, -186], [-236, -194]];
      setCarAt(pc, spots[i][0], spots[i][1], Math.PI, 24 + i);
    });
    g.missions.index = 7; g.missions.state = 'active'; g.missions.timer = 132;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -200);
    g.cameraYaw = 0; g.camDist = 13; g.cameraPitch = 0.32; // kamera di selatan mobil (belakang), menghadap utara ke dermaga
    g.money = 1240;
  } else if (shot === 'drive') {
    // Nyetir di jalan utama z=0 ke timur, papan VELAMAR + gerbang balap di depan.
    const coupe = CAR_MODELS.find((m) => m.id === 'coupe');
    g.enterCar(g.playerCar(coupe, -60, 0, Math.PI / 2));
    g.player.car.speed = 22;
    police.wanted = 0;
    g.missions.index = 2; g.missions.state = 'active'; g.missions.timer = 96;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(80, 0, 0);
    g.cameraYaw = Math.PI * 1.5; g.cameraPitch = 0.3;
    g.money = 480;
  } else if (shot === 'walk') {
    // Jalan kaki di pantai dekat Faro Vela: mercusuar + dermaga + pejalan kaki.
    // Kamera dekat (8 m) supaya pemain besar di frame; pejalan kaki ditaruh
    // DI DEPAN pemain (arah mercusuar) supaya terlihat.
    g.player.pos.x = -255; g.player.pos.z = -185;
    g.player.heading = 3.62; // menghadap mercusuar
    g.player.mesh.rotation.y = 3.62;
    police.wanted = 1; police.heat = 0.9;
    police.ensureUnits(g.player.pos);
    g.peds.slice(0, 4).forEach((pd, i) => {
      const spots = [[-262, -200], [-268, -195], [-258, -205], [-272, -210]];
      pd.mesh.position.set(spots[i][0], 0, spots[i][1]);
    });
    g.missions.index = 0; g.missions.state = 'active';
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-282, 0, -235);
    g.cameraYaw = 0.48; g.cameraPitch = 0.28; g.camDist = 8;
    g.money = 210;
  } else if (shot === 'win') {
    // Layar MISI SELESAI di atas gameplay (overlay dibuat tembus pandang
    // supaya kota tetap terlihat di belakangnya).
    const sedan = CAR_MODELS.find((m) => m.id === 'sedan');
    g.enterCar(g.playerCar(sedan, 0, 120, Math.PI));
    g.player.car.speed = 0;
    police.wanted = 0;
    g.money = 870;
    g.cameraYaw = 0; g.cameraPitch = 0.3;
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
    drive: ['MISI 3 — BALAPAN JALANAN', 'Lewati 4 gerbang balap sebelum waktu habis!', 96],
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
  // Bersihkan pesan "Mobil dicuri!" dari staging — kecuali chase (wanted 3, konsisten).
  if (shot !== 'chase') {
    g.hud.messageTimer = 0;
    g.hud.el.message.style.opacity = '0';
  }
  g.frozen = true;
  g.renderOnce();
  window.__VELAMAR_READY__ = true;
}
