// Kota VELAMAR — membangun semua mesh statis: jalan, trotoar, gedung, pantai,
// laut, dermaga, mercusuar Faro Vela, papan nama distrik, pohon dan lampu.
// Mengembalikan { group, colliders, markers } — colliders = AABB gedung & tembok.
import * as THREE from 'three';
import { WORLD, DISTRICTS, PALETTE } from './config.js';
import { makeRng, pick, range } from './random.js';

function textTexture(lines, opts = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = opts.bg || '#12233d'; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = opts.border || '#ffd23f'; g.lineWidth = 10; g.strokeRect(8, 8, 496, 240);
  g.textAlign = 'center';
  g.fillStyle = opts.color || '#ffd23f';
  g.font = 'bold 64px Arial, sans-serif';
  g.fillText(lines[0], 256, 110);
  if (lines[1]) {
    g.font = 'bold 30px Arial, sans-serif';
    g.fillStyle = '#ffffff';
    g.fillText(lines[1], 256, 175);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tekstur tanah hangat berbintik (canvas, deterministik) — tanah tidak lagi datar polos.
function groundTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#cf9f66'; g.fillRect(0, 0, 256, 256);
  const rng = makeRng(WORLD.seed + 5);
  for (let i = 0; i < 900; i++) {
    const v = rng();
    g.fillStyle = v < 0.5 ? 'rgba(120,80,40,0.10)' : 'rgba(255,230,170,0.10)';
    const s = 2 + rng() * 6;
    g.fillRect(rng() * 256, rng() * 256, s, s);
  }
  // bercak rumput hangat di sana-sini
  for (let i = 0; i < 26; i++) {
    g.fillStyle = 'rgba(122,150,80,0.20)';
    g.beginPath();
    g.ellipse(rng() * 256, rng() * 256, 8 + rng() * 18, 6 + rng() * 12, rng() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(24, 24);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tekstur zebra cross: garis putih di keempat sisi, dipakai ulang di semua persimpangan.
function zebraTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(255,245,220,0.92)';
  for (let i = 0; i < 6; i++) {
    g.fillRect(10 + i * 18, 0, 9, 22); // atas
    g.fillRect(10 + i * 18, 106, 9, 22); // bawah
    g.fillRect(0, 10 + i * 18, 22, 9); // kiri
    g.fillRect(106, 10 + i * 18, 22, 9); // kanan
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tekstur grid jendela menyala — dinding gedung tidak lagi polos dari atas maupun samping.
function windowTexture(warm) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = warm ? '#8a6a45' : '#5a6a80'; g.fillRect(0, 0, 128, 128);
  const rng = makeRng(WORLD.seed + 11);
  for (let y = 8; y < 120; y += 18) {
    for (let x = 8; x < 120; x += 16) {
      const lit = rng();
      g.fillStyle = lit < 0.55 ? '#ffe9a8' : lit < 0.8 ? '#9fd8ff' : '#2b3a55';
      g.fillRect(x, y, 10, 12);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Kotak bantu — gedung, atap, menara, dll.
function box(w, h, d, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color, ...(opts.mat || {}) }),
  );
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  return m;
}

export function buildCity(scene) {
  const rng = makeRng(WORLD.seed);
  const group = new THREE.Group();
  const colliders = []; // {minX,maxX,minZ,maxZ}
  const H = WORLD.halfSize;

  // --- Langit, kabut, matahari (hangat sun-soaked) ---
  scene.background = new THREE.Color(PALETTE.sky);
  scene.fog = new THREE.Fog(PALETTE.fog, 260, 950);
  const sun = new THREE.DirectionalLight(0xffe9b8, 2.6);
  sun.position.set(180, 260, 120);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xffe9c9, 0xb08a5a, 1.25));

  // --- Tanah dasar kota (bertekstur hangat, bukan datar) ---
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(H * 2 + 200, H * 2 + 200),
    new THREE.MeshLambertMaterial({ map: groundTexture() }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(40, -0.05, 0);
  group.add(ground);

  // --- Laut (barat) + pantai pasir ---
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(320, H * 2 + 200),
    new THREE.MeshLambertMaterial({ color: PALETTE.sea }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(WORLD.seaX - 130, 0.02, 0);
  group.add(sea);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(34, H * 2 + 200),
    new THREE.MeshLambertMaterial({ color: PALETTE.sand }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(WORLD.beachX - 12, 0.03, 0);
  group.add(sand);

  // --- Jalan grid + trotoar + garis tengah ---
  const roadMat = new THREE.MeshLambertMaterial({ color: PALETTE.road });
  const walkMat = new THREE.MeshLambertMaterial({ color: PALETTE.sidewalk });
  const lineMat = new THREE.MeshBasicMaterial({ color: PALETTE.roadLine });
  const roads = [];
  for (let i = -4; i <= 4; i++) roads.push(i * WORLD.roadGap);
  for (const r of roads) {
    // jalan horizontal (sepanjang x) dan vertikal (sepanjang z)
    const hRoad = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 14), roadMat);
    hRoad.rotation.x = -Math.PI / 2; hRoad.position.set(0, 0.05, r); group.add(hRoad);
    const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(14, H * 2), roadMat);
    vRoad.rotation.x = -Math.PI / 2; vRoad.position.set(r, 0.05, 0); group.add(vRoad);
    const hWalk = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 20), walkMat);
    hWalk.rotation.x = -Math.PI / 2; hWalk.position.set(0, 0.04, r); group.add(hWalk);
    const vWalk = new THREE.Mesh(new THREE.PlaneGeometry(20, H * 2), walkMat);
    vWalk.rotation.x = -Math.PI / 2; vWalk.position.set(r, 0.04, 0); group.add(vWalk);
    // garis putus-putus tengah jalan
    for (let d = -H; d < H; d += 16) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.7), lineMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(d, 0.06, r); group.add(dash);
      const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 6), lineMat);
      dash2.rotation.x = -Math.PI / 2; dash2.position.set(r, 0.06, d); group.add(dash2);
    }
  }

  // --- Zebra cross di setiap persimpangan (terbaca dari atas, seperti juara) ---
  const zebraTex = zebraTexture();
  const zebraMat = new THREE.MeshBasicMaterial({ map: zebraTex, transparent: true, depthWrite: false });
  for (const rx of roads) for (const rz of roads) {
    const z = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), zebraMat);
    z.rotation.x = -Math.PI / 2; z.position.set(rx, 0.07, rz); group.add(z);
  }

  // --- Gedung per blok (hindari jalan) ---
  const winTexWarm = windowTexture(true);
  const winTexCool = windowTexture(false);
  const blockCenters = [];
  for (let ix = -3; ix <= 3; ix++) for (let iz = -3; iz <= 3; iz++) {
    const cx = ix * WORLD.roadGap + WORLD.roadGap / 2;
    const cz = iz * WORLD.roadGap + WORLD.roadGap / 2;
    if (cx < WORLD.beachX + 20) continue; // area pantai/demaga kosong
    blockCenters.push({ cx, cz });
  }
  for (const { cx, cz } of blockCenters) {
    const n = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < n; k++) {
      const w = range(rng, 16, 26), d = range(rng, 16, 26);
      const h = range(rng, 10, 46);
      const ox = range(rng, -14, 14), oz = range(rng, -14, 14);
      const x = cx + ox, z = cz + oz;
      const isGlass = rng() < 0.25;
      const color = isGlass ? pick(rng, PALETTE.glass) : pick(rng, PALETTE.building);
      // Dinding ber-grid jendela menyala (tekstur canvas) — gedung terbaca dari atas & samping.
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color, map: isGlass ? winTexCool : winTexWarm }),
      );
      b.position.set(x, h / 2, z);
      group.add(b);
      // atap + detail atap (skylight / AC) supaya atap tidak polos dari atas
      const roof = box(w + 1, 1, d + 1, 0x5a5a66, x, h + 0.5, z);
      group.add(roof);
      const roofN = 1 + Math.floor(rng() * 3);
      for (let ri = 0; ri < roofN; ri++) {
        const rw = range(rng, 3, 6), rd = range(rng, 3, 6);
        const rx = x + range(rng, -w / 4, w / 4), rz = z + range(rng, -d / 4, d / 4);
        const ac = box(rw, 1.2, rd, pick(rng, [0x8a8a96, 0xc8c8c8, 0x6a7a8a]), rx, h + 1.6, rz);
        group.add(ac);
      }
      colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    }
  }

  // --- Signage toko di dinding gedung (nama usaha, terbaca dari jalan & atas) ---
  const shopSigns = [
    { lines: ['MOTEL VELA', 'VACANCY • COLD DRINKS'], x: -200, z: -100, ry: Math.PI / 2, color: '#ff5d8f' },
    { lines: ['TACOS 24H', 'EL GATILLO'], x: 120, z: 60, ry: 0, color: '#ffd23f' },
    { lines: ['PLAZA MERCADO', 'PASAR • KOPI'], x: 60, z: 140, ry: Math.PI, color: '#7ee081' },
    { lines: ['SOL FM 95.4', 'SYNTHWAVE'], x: 160, z: -80, ry: -Math.PI / 2, color: '#4cc9f0' },
    { lines: ['COMETA MOTORS', 'DEALER MOBIL'], x: 200, z: 100, ry: Math.PI, color: '#f72585' },
    { lines: ['PANTAI AZUL', 'BOULEVARD MATAHARI'], x: -240, z: 160, ry: Math.PI / 2, color: '#4cc9f0' },
  ];
  for (const s of shopSigns) {
    const tex = textTexture(s.lines, { color: s.color, bg: '#12233d' });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    sign.position.set(s.x, 9, s.z);
    sign.rotation.y = s.ry;
    group.add(sign);
  }

  // --- Properti pantai: payung, menara penjaga, handuk (pantai hidup, bukan pasir kosong) ---
  const umbrellaColors = [0xff5d8f, 0x4cc9f0, 0xffd23f, 0x7ee081, 0xf72585];
  for (let i = 0; i < 14; i++) {
    const ux = range(rng, -268, -240), uz = range(rng, -260, 260);
    if (Math.abs(uz + 190) < 24 && Math.abs(ux + 292) < 20) continue; // jangan tutupi dermaga
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.4, 6),
      new THREE.MeshLambertMaterial({ color: 0xffffff }));
    pole.position.set(ux, 1.7, uz); group.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 10),
      new THREE.MeshLambertMaterial({ color: pick(rng, umbrellaColors) }));
    top.position.set(ux, 3.8, uz); group.add(top);
    const towel = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4),
      new THREE.MeshLambertMaterial({ color: pick(rng, umbrellaColors) }));
    towel.rotation.x = -Math.PI / 2; towel.rotation.z = rng() * Math.PI;
    towel.position.set(ux + range(rng, -3, 3), 0.06, uz + range(rng, -3, 3)); group.add(towel);
  }
  for (const tz of [-120, 40, 200]) {
    const tower = new THREE.Group();
    const legMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (const [lx, lz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.5, 6), legMat);
      leg.position.set(lx, 2.25, lz); tower.add(leg);
    }
    const cab = box(3.4, 2.2, 3.4, 0xff5d5d, 0, 5.4, 0); tower.add(cab);
    const roofL = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.4, 4),
      new THREE.MeshLambertMaterial({ color: 0xffd23f }));
    roofL.position.y = 7.2; roofL.rotation.y = Math.PI / 4; tower.add(roofL);
    tower.position.set(-256, 0, tz);
    group.add(tower);
  }

  // --- Pohon palem di trotoar + lampu jalan ---
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a5a2b });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2fae5f });
  for (let i = 0; i < 90; i++) {
    const rx = roads[Math.floor(rng() * roads.length)] + (rng() < 0.5 ? -11 : 11);
    const rz = range(rng, -H, H);
    if (rx < WORLD.beachX + 8) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 6, 6), trunkMat);
    trunk.position.set(rx, 3, rz); group.add(trunk);
    const top = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 6), leafMat);
    top.position.set(rx, 6.8, rz); top.scale.y = 0.55; group.add(top);
  }

  // --- Dermaga kayu di barat laut + mercusuar FARO VELA (landmark) ---
  const pier = box(16, 1.2, 130, 0x8a6b3d, -292, 0.6, -190);
  group.add(pier);
  // Dermaga TIDAK masuk colliders: permukaannya datar dan boleh dilalui
  // (misi terakhir berakhir di ujung dermaga).
  const tower = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 9, 34, 16),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  );
  base.position.y = 17; tower.add(base);
  for (let i = 0; i < 3; i++) {
    // Pita merah HARUS lebih besar dari radius menara di ketinggian itu
    // (menara meruncing 9 -> 7): kalau tidak, pitanya tenggelam di dalam.
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(8.6 - i * 0.35, 8.6 - i * 0.35, 4, 16),
      new THREE.MeshLambertMaterial({ color: 0xe63946 }),
    );
    band.position.y = 8 + i * 11; tower.add(band);
  }
  const lampRoom = new THREE.Mesh(
    new THREE.CylinderGeometry(4.5, 4.5, 5, 12),
    new THREE.MeshLambertMaterial({ color: 0x222222, emissive: 0xffd23f, emissiveIntensity: 0.9 }),
  );
  lampRoom.position.y = 36.5; tower.add(lampRoom);
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(5.5, 4, 12),
    new THREE.MeshLambertMaterial({ color: 0xe63946 }),
  );
  cap.position.y = 41; tower.add(cap);
  // sorot cahaya mercusuar (kerucut tembus pandang)
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(9, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2c9, transparent: true, opacity: 0.16, side: THREE.DoubleSide }),
  );
  beam.rotation.z = Math.PI / 2; beam.position.set(30, 36, 0);
  tower.add(beam);
  tower.position.set(-292, 1, -252);
  group.add(tower);

  // kapal kecil di dermaga (tujuan misi terakhir)
  const boat = new THREE.Group();
  const hull = box(6, 2.4, 16, 0xf4f4f4, 0, 1.2, 0);
  const cabin = box(4, 2.4, 5, 0x4361ee, 0, 3.4, -2);
  boat.add(hull, cabin);
  boat.position.set(-310, 0.4, -200);
  group.add(boat);

  // --- Nama distrik DICAT di tanah persimpangan (decal datar, terbaca dari
  // atas seperti cover juara) — papan vertikal lama terlihat cermin/garis
  // dari kamera top-down dan mengacaukan screenshot.
  for (const d of DISTRICTS) {
    const tex = textTexture([d.name, d.sub], { color: d.color, bg: '#12233d' });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(d.big ? 36 : 30, d.big ? 18 : 15),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
    );
    sign.rotation.x = -Math.PI / 2; // rebah ke tanah, teks menghadap utara
    sign.position.set(d.x, 0.09, d.z);
    group.add(sign);
  }

  // --- Plaza Mercado: air mancur kecil ---
  const fountain = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 9, 1.2, 16),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ff }),
  );
  fountain.position.set(60, 0.6, 140);
  group.add(fountain);

  scene.add(group);
  return { group, colliders };
}

// Dorong posisi (lingkaran radius r) keluar dari AABB gedung.
export function resolveColliders(pos, r, colliders) {
  for (const c of colliders) {
    if (pos.x > c.minX - r && pos.x < c.maxX + r && pos.z > c.minZ - r && pos.z < c.maxZ + r) {
      const dxl = pos.x - (c.minX - r), dxr = (c.maxX + r) - pos.x;
      const dzl = pos.z - (c.minZ - r), dzr = (c.maxZ + r) - pos.z;
      const m = Math.min(dxl, dxr, dzl, dzr);
      if (m === dxl) pos.x = c.minX - r;
      else if (m === dxr) pos.x = c.maxX + r;
      else if (m === dzl) pos.z = c.minZ - r;
      else pos.z = c.maxZ + r;
    }
  }
}
