// Mode screenshot deterministik v2 — ?shot=chase|drive|walk|win
// Menata scene, kamera TOP-DOWN, wanted, dan HUD persis untuk tiap shot, lalu
// membekukan simulasi supaya tiap pengambilan gambar menghasilkan frame yang sama.
// Pelajaran dari scan v2: cover juara = top-down PADAT (pantai + jalan + banyak
// mobil + pejalan kaki + gedung berjendela + HUD lengkap) — bukan kamera 3D kosong.
import * as THREE from 'three';
import { CAR_MODELS } from './config.js';

export function parseShot() {
  const q = new URLSearchParams(location.search);
  return { shot: q.get('shot') || null, seed: Number(q.get('seed') || 1) };
}

// Helikopter polisi (PSPD AIR) — hover + sorot lampu, hanya untuk shot kejar-kejaran.
function makeHelicopter(scene, x, y, z) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1b263b });
  const body = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 2.6), bodyMat);
  body.position.y = 0; g.add(body);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.8, 0.8), bodyMat);
  tail.position.set(-4.2, 0.3, 0); g.add(tail);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ff }));
  glass.position.set(2.2, 0.2, 0); g.add(glass);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(13, 0.15, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x222222 }));
  rotor.position.y = 1.4; rotor.rotation.y = 0.5; g.add(rotor);
  const skidMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.18, 0.18), skidMat);
    skid.position.set(0, -1.3, s * 1.1); g.add(skid);
  }
  // sorot lampu ke bawah (kerucut tembus pandang)
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(16, y, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2c9, transparent: true, opacity: 0.10, side: THREE.DoubleSide }),
  );
  cone.position.y = -y / 2; cone.rotation.x = Math.PI; g.add(cone);
  g.position.set(x, y, z);
  g.rotation.y = 0.6;
  scene.add(g);
  return g;
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
  // Sebar mobil lalu lintas ke titik-titik dalam frame (jalan lurus, searah jalan).
  const placeTraffic = (spots) => {
    g.traffic.forEach((t, i) => {
      if (i >= spots.length) return;
      const [x, z, heading, speed] = spots[i];
      setCarAt(t.car, x, z, heading, speed);
      t.horizontal = Math.abs(Math.sin(heading)) > 0.5;
      t.dir = heading === Math.PI / 2 || heading === 0 ? 1 : -1;
    });
  };
  // Sebar pejalan kaki ke trotoar dalam frame.
  const placePeds = (spots) => {
    g.peds.forEach((pd, i) => {
      if (i >= spots.length) return;
      pd.mesh.position.set(spots[i][0], 0, spots[i][1]);
      pd.target = { x: spots[i][0] + 4, z: spots[i][1] + 4 };
    });
  };
  // Perlengkapan standar shot: pistol + ammo + jam + respect + armour.
  const kitOut = (ammo, respect, armour, day, hh, mm) => {
    if (!g.combat.hasPistol) g.combat.buyPistol();
    g.combat.ammo = ammo;
    g.combat.weapon = 'pistol';
    g.player.respect = respect;
    g.player.armour = armour;
    g.day = day; g.clockMinutes = hh * 60 + mm;
  };

  if (shot === 'chase') {
    // COVER — top-down padat blok pantai: MERCUSUAR Faro Vela + pantai + dermaga
    // + jalan tepi pantai + zebra cross + BANYAK mobil + pejalan kaki + helikopter.
    // Pemain Cometa GT melaju ke UTARA (heading Math.PI) di jalan pantai x=-240,
    // 3 polisi mengejar. Kamera memuat mercusuar (-292,-252) di sudut barat laut.
    const sport = CAR_MODELS.find((m) => m.id === 'sport');
    g.enterCar(g.playerCar(sport, -240, -168, Math.PI));
    g.player.car.speed = 26;
    police.wanted = 4; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[-240, -142, Math.PI, 24], [-256, -176, Math.PI, 22], [-224, -180, Math.PI, 23]];
      setCarAt(pc, spots[i][0], spots[i][1], spots[i][2], spots[i][3]);
    });
    // lalu lintas di jalan pantai (x=-240), jalan z=-160, dan jalan x=-160
    placeTraffic([
      [-243, -216, 0, 12], [-237, -120, Math.PI, 11], [-243, -100, 0, 13],
      [-163, -186, Math.PI, 12], [-157, -140, 0, 11], [-163, -116, Math.PI, 12],
      [-220, -163, Math.PI / 2, 13], [-184, -157, -Math.PI / 2, 12],
      [-228, -203, Math.PI / 2, 11], [-192, -197, -Math.PI / 2, 13],
    ]);
    // pejalan kaki di trotoar tepi pantai & sekitar persimpangan
    placePeds([
      [-228, -196], [-228, -172], [-228, -148], [-252, -172], [-252, -148],
      [-204, -172], [-204, -148], [-248, -196], [-152, -172], [-152, -148],
    ]);
    makeHelicopter(g.scene, -214, 55, -200);
    g.missions.index = 7; g.missions.state = 'active'; g.missions.timer = 132;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(-292, 0, -200);
    // kamera atas: pusat (-219,-251) — mercusuar utuh di kiri panel misi
    // (proyeksi terukur: base (446,132)), pemain di tengah-kiri, dermaga + pantai masuk
    g.setTopDownCamera(-211, -244, 240, 40, -8, -7);
    kitOut(24, 4, 54, 1, 18, 24);
    g.money = 1240;
  } else if (shot === 'drive') {
    // Kejar-kejaran di tengah lalu lintas — persimpangan (80,0), gerbang balap
    // pertama TEPAT di depan pemain (timur = ATAS gambar, kamera menghadap timur).
    // Pemain Marlin Coupe melaju ke timur, 2 polisi di belakang, wanted 3 terisi.
    const coupe = CAR_MODELS.find((m) => m.id === 'coupe');
    g.enterCar(g.playerCar(coupe, 60, 0, Math.PI / 2));
    g.player.car.speed = 24;
    police.wanted = 3; police.heat = 1;
    police.ensureUnits(g.player.pos);
    police.cars.forEach((pc, i) => {
      const spots = [[38, -4, Math.PI / 2, 23], [42, 6, Math.PI / 2, 22]];
      setCarAt(pc, spots[i][0], spots[i][1], spots[i][2], spots[i][3]);
    });
    placeTraffic([
      [30, -3, Math.PI / 2, 12], [50, 3, -Math.PI / 2, 11], [100, -3, Math.PI / 2, 12],
      [120, 3, -Math.PI / 2, 11], [77, -83, 0, 12], [83, 77, Math.PI, 11],
      [100, 77, -Math.PI / 2, 12], [60, -77, 0, 11],
    ]);
    placePeds([
      [60, -12], [90, 12], [110, -12], [40, 12], [80, -12], [100, 12],
    ]);
    g.missions.index = 2; g.missions.state = 'active'; g.missions.timer = 96;
    g.missions.marker.visible = true;
    g.missions.marker.position.set(80, 0, 0);
    g.missions.buildRaceGates();
    g.setTopDownCamera(70, 0, 200, 40, 5, 0);
    kitOut(12, 2, 50, 1, 18, 40);
    g.money = 480;
  } else if (shot === 'walk') {
    // Jalan kaki di trotoar RAMAI dekat Plaza Mercado — pejalan kaki berdetail,
    // mobil lewat, etalase toko, penanda misi + air mancur terlihat. Kamera
    // sejajar sumbu (jalan horizontal/vertikal, bukan diagonal).
    g.player.pos.x = 48; g.player.pos.z = 122;
    g.player.heading = 0.8; // menghadap penanda misi (60,140)
    g.player.mesh.rotation.y = 0.8;
    police.wanted = 1; police.heat = 0.9;
    police.ensureUnits(g.player.pos);
    placePeds([
      [52, 128], [56, 132], [68, 128], [76, 136], [52, 144], [64, 148],
      [72, 124], [44, 136], [80, 144], [60, 120], [88, 132], [36, 148],
      [48, 152], [70, 152], [40, 124], [84, 120],
    ]);
    placeTraffic([
      [-3, 100, Math.PI, 11], [3, 90, 0, 12], [80, 120, 0, 11],
      [80, 170, Math.PI, 12], [40, 163, Math.PI / 2, 11], [4, 123, Math.PI / 2, 11],
      [84, 84, -Math.PI / 2, 12],
    ]);
    g.missions.index = 0; g.missions.state = 'active';
    g.missions.marker.visible = true;
    g.missions.marker.position.set(60, 0, 140);
    // kamera menghadap UTARA (atas gambar = utara) supaya decal KOTA TUA terbaca
    g.setTopDownCamera(58, 136, 135, 45, 0, -6);
    kitOut(36, 1, 40, 1, 18, 7);
    g.money = 210;
  } else if (shot === 'win') {
    // Layar MISI SELESAI di atas gameplay (overlay dibuat tembus pandang
    // supaya kota tetap terlihat di belakangnya) — latar jalan RAMAI, bukan kosong.
    const sedan = CAR_MODELS.find((m) => m.id === 'sedan');
    g.enterCar(g.playerCar(sedan, 0, 120, Math.PI));
    g.player.car.speed = 0;
    police.wanted = 0;
    placeTraffic([
      [-4, 80, 0, 10], [4, 160, Math.PI, 11], [-40, 123, Math.PI / 2, 10],
      [40, 117, -Math.PI / 2, 11], [-80, 123, Math.PI / 2, 10], [80, 117, -Math.PI / 2, 11],
    ]);
    placePeds([
      [-12, 108], [12, 108], [-12, 132], [12, 132], [-40, 132], [40, 108],
    ]);
    g.money = 870;
    g.setTopDownCamera(0, 120, 150, 40, 0, 6);
    kitOut(12, 2, 50, 1, 19, 2);
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
  g.hud.setArmour(g.player.armour);
  g.hud.setRespect(g.player.respect, 20);
  g.hud.setClock(g.day, Math.floor(g.clockMinutes / 60), Math.floor(g.clockMinutes % 60));
  g.hud.setDistrict(g.nearestDistrict(g.player.pos.x, g.player.pos.z));
  g.updateWeaponLine();
  const tgt = g.missions.targetPos();
  if (tgt) {
    const d = Math.round(Math.hypot(tgt.x - g.player.pos.x, tgt.z - g.player.pos.z));
    g.hud.setDistance(`${d}m ke ${g.missions.current() ? g.missions.current().title : 'Tujuan'}`);
  }
  // Bersihkan pesan "Mobil dicuri!" dari staging — kecuali chase (wanted 4, konsisten).
  if (shot !== 'chase') {
    g.hud.messageTimer = 0;
    g.hud.el.message.style.opacity = '0';
  }
  g.frozen = true;
  g.renderOnce();
  window.__VELAMAR_READY__ = true;
}
