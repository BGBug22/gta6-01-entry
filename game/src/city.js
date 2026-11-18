// Kota VELAMAR — membangun semua mesh statis: jalan, trotoar, zebra cross,
// gedung ber-grid jendela menyala + atap genteng hangat, pantai, laut, dermaga,
// mercusuar Faro Vela, papan nama distrik + decal tanah, payung & menara pantai.
// Mengembalikan { group, colliders } — colliders = AABB gedung & tembok.
import * as THREE from 'three';
import { WORLD, DISTRICTS, PALETTE, ROOF_COLORS, SHOP_SIGNS } from './config.js';
import { makeRng, pick, range } from './random.js';

// LCG kecil untuk tekstur deterministik (bukan Math.random).
function lcg(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tekstur papan nama (canvas) — untuk signage vertikal.
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

// Decal tanah — teks dicat di jalan, terbaca dari kamera atas.
// vertical = teks memanjang sepanjang sumbu z (jalan vertikal).
function groundDecalTexture(text, sub, color, vertical) {
  const c = document.createElement('canvas');
  c.width = vertical ? 128 : 512;
  c.height = vertical ? 512 : 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.textAlign = 'center';
  g.lineWidth = 8;
  g.strokeStyle = 'rgba(10,20,35,.85)';
  g.fillStyle = color;
  if (vertical) {
    g.save();
    g.translate(64, 256);
    g.rotate(Math.PI / 2);
    g.font = 'bold 54px Arial, sans-serif';
    g.strokeText(text, 0, 10);
    g.fillText(text, 0, 10);
    if (sub) {
      g.font = 'bold 26px Arial, sans-serif';
      g.fillStyle = '#ffffff';
      g.strokeText(sub, 0, 52);
      g.fillText(sub, 0, 52);
    }
    g.restore();
  } else {
    g.font = 'bold 60px Arial, sans-serif';
    g.strokeText(text, 256, 62);
    g.fillText(text, 256, 62);
    if (sub) {
      g.font = 'bold 28px Arial, sans-serif';
      g.fillStyle = '#ffffff';
      g.strokeText(sub, 256, 104);
      g.fillText(sub, 256, 104);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tekstur tanah — hijau hangat berbintik (bukan datar polos).
function groundTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#a8b078'; g.fillRect(0, 0, 256, 256);
  const r = lcg(7);
  const dots = ['#98a868', '#b8c088', '#c9b183', '#8a9a68', '#b0a06a'];
  for (let i = 0; i < 900; i++) {
    g.fillStyle = dots[Math.floor(r() * dots.length)];
    const s = 2 + r() * 5;
    g.fillRect(r() * 256, r() * 256, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(28, 28);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Fasad gedung — dinding hangat + grid jendela (sebagian menyala kuning).
function facadeTexture(wall, lit, seed) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = wall; g.fillRect(0, 0, 128, 256);
  const r = lcg(seed);
  // lantai dasar lebih gelap
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 216, 128, 40);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 10 + col * 22, y = 12 + row * 22;
      g.fillStyle = r() < lit ? (r() < 0.5 ? '#ffd23f' : '#fff2c9') : '#2b3a55';
      g.fillRect(x, y, 14, 16);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Zebra cross — garis putih memanjang searah jalan.
function crosswalkTexture(horizontal) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 64);
  g.fillStyle = '#f5f0dc';
  for (let i = 0; i < 5; i++) {
    if (horizontal) g.fillRect(0, 6 + i * 12, 128, 6);
    else g.fillRect(10 + i * 24, 0, 12, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

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

  // --- Langit senja: kubah gradien (ungu-biru di atas, oranye di horizon) ---
  // Bukan warna datar — gradien vertikal dari canvas, ditempel di bola besar
  // (BackSide, tanpa fog) supaya horizon selalu oranye dari sudut mana pun.
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4; skyCanvas.height = 512;
  const sg = skyCanvas.getContext('2d');
  const grad = sg.createLinearGradient(0, 0, 0, 512);
  // Gradien dikompres supaya oranye SUDAH muncul di langit yang terlihat
  // dari kamera chase (pita langit di atas horizon = canvas 0..0.41):
  // ungu di atas, pink di tengah, oranye-emas di dekat horizon.
  grad.addColorStop(0.0, '#241a55');
  grad.addColorStop(0.18, '#5b3a8c');
  grad.addColorStop(0.30, '#b0528f');
  grad.addColorStop(0.38, '#ff7a4d');
  grad.addColorStop(0.48, '#ffb347');
  grad.addColorStop(0.60, '#ffe0a0');
  grad.addColorStop(1.0, '#ffe0a0');
  sg.fillStyle = grad; sg.fillRect(0, 0, 4, 512);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(1200, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }),
  );
  scene.add(skyDome);
  scene.background = new THREE.Color(PALETTE.sky);
  // Matahari senja rendah di barat (di atas laut) + lingkaran cahayanya.
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(55, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }),
  );
  sunDisc.position.set(-1000, 130, -150);
  sunDisc.rotation.y = Math.PI / 2;
  scene.add(sunDisc);
  const sunGlow = new THREE.Mesh(
    new THREE.CircleGeometry(120, 24),
    new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.35, fog: false }),
  );
  sunGlow.position.set(-1010, 130, -150);
  sunGlow.rotation.y = Math.PI / 2;
  scene.add(sunGlow);
  // Kabut hangat oranye — kota jauh larut dalam senja.
  scene.fog = new THREE.Fog(PALETTE.fog, 250, 900);
  // Matahari sore dari barat (rendah, hangat) + lampu isi dari tenggara
  // supaya buritan mobil tidak gelap + langit ungu di atas.
  const sun = new THREE.DirectionalLight(0xffb36b, 2.4);
  sun.position.set(-400, 140, -60);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffe0b8, 0.7);
  fill.position.set(300, 160, 300);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0x8a6fb8, 0x7a5a3a, 0.95));

  // --- Tanah dasar kota (bertekstur) ---
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
    // Jalan dinaikkan (y 0.10) supaya tidak z-fighting dengan trotoar (0.04)
    // saat dilihat dari kamera chase yang rendah.
    const hRoad = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 14), roadMat);
    hRoad.rotation.x = -Math.PI / 2; hRoad.position.set(0, 0.10, r); group.add(hRoad);
    const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(14, H * 2), roadMat);
    vRoad.rotation.x = -Math.PI / 2; vRoad.position.set(r, 0.10, 0); group.add(vRoad);
    const hWalk = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 20), walkMat);
    hWalk.rotation.x = -Math.PI / 2; hWalk.position.set(0, 0.04, r); group.add(hWalk);
    const vWalk = new THREE.Mesh(new THREE.PlaneGeometry(20, H * 2), walkMat);
    vWalk.rotation.x = -Math.PI / 2; vWalk.position.set(r, 0.04, 0); group.add(vWalk);
    // garis putus-putus tengah jalan
    for (let d = -H; d < H; d += 16) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.7), lineMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(d, 0.11, r); group.add(dash);
      const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 6), lineMat);
      dash2.rotation.x = -Math.PI / 2; dash2.position.set(r, 0.11, d); group.add(dash2);
    }
  }

  // --- Zebra cross di SEMUA persimpangan ---
  const crossV = new THREE.MeshBasicMaterial({ map: crosswalkTexture(false), transparent: true });
  const crossH = new THREE.MeshBasicMaterial({ map: crosswalkTexture(true), transparent: true });
  const crossGeoV = new THREE.PlaneGeometry(14, 9);
  const crossGeoH = new THREE.PlaneGeometry(9, 14);
  for (const rx of roads) for (const rz of roads) {
    const arms = [
      { x: rx, z: rz - 10.5, geo: crossGeoV, mat: crossV },
      { x: rx, z: rz + 10.5, geo: crossGeoV, mat: crossV },
      { x: rx - 10.5, z: rz, geo: crossGeoH, mat: crossH },
      { x: rx + 10.5, z: rz, geo: crossGeoH, mat: crossH },
    ];
    for (const a of arms) {
      const m = new THREE.Mesh(a.geo, a.mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(a.x, 0.12, a.z);
      group.add(m);
    }
  }

  // --- Decal nama distrik di jalan (HANYA yang horizontal) ---
  // Decal vertikal (memanjang di jalan) DIHAPUS: dari kamera chase rendah
  // dia jadi coretan warna raksasa di tengah jalan.
  const decals = [
    { text: 'KOTA TUA', sub: 'PLAZA MERCADO', x: 40, z: 160, vertical: false, color: '#7ee081' },
    { text: 'VELAMAR', sub: 'KOTA PELABUHAN', x: -40, z: 0, vertical: false, color: '#ffd23f' },
  ];
  for (const d of decals) {
    const tex = groundDecalTexture(d.text, d.sub, d.color, d.vertical);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(d.vertical ? 11 : 44, d.vertical ? 44 : 11),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(d.x, 0.13, d.z);
    group.add(m);
  }

  // --- Gedung per blok (hindari jalan) — fasad ber-grid jendela + atap genteng hangat ---
  const facades = [
    facadeTexture('#ffd9a0', 0.7, 11),
    facadeTexture('#ffb4a2', 0.65, 23),
    facadeTexture('#ffe66d', 0.6, 37),
    facadeTexture('#9fd8ff', 0.75, 51),
  ];
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
      const tex = isGlass ? facades[3] : facades[Math.floor(rng() * 3)];
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ map: tex, ...(isGlass ? { transparent: true, opacity: 0.94 } : {}) }),
      );
      b.position.set(x, h / 2, z);
      group.add(b);
      // atap genteng hangat + detail atap (AC / tangki air)
      const roofColor = pick(rng, ROOF_COLORS);
      const roof = box(w + 1, 1, d + 1, roofColor, x, h + 0.5, z);
      group.add(roof);
      if (rng() < 0.5) {
        const ac = box(3.5, 1.6, 3.5, 0x8a8f98, x + range(rng, -4, 4), h + 1.8, z + range(rng, -4, 4));
        group.add(ac);
      } else {
        const tank = new THREE.Mesh(
          new THREE.CylinderGeometry(1.6, 1.6, 2.4, 10),
          new THREE.MeshLambertMaterial({ color: 0xf4f4f4 }),
        );
        tank.position.set(x + range(rng, -4, 4), h + 2.2, z + range(rng, -4, 4));
        group.add(tank);
      }
      colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    }
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

  // --- Pantai: 14 payung warna-warni + 3 menara penjaga ---
  const umbrellaColors = [0xe63946, 0xffd23f, 0x4cc9f0, 0xff8fa3, 0x7ee081, 0xf72585];
  for (let i = 0; i < 14; i++) {
    const z = -300 + i * 46;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 3.2, 6),
      new THREE.MeshLambertMaterial({ color: 0xf4f4f4 }),
    );
    pole.position.set(-272, 1.6, z); group.add(pole);
    const top = new THREE.Mesh(
      new THREE.ConeGeometry(2.6, 1.3, 8),
      new THREE.MeshLambertMaterial({ color: umbrellaColors[i % umbrellaColors.length] }),
    );
    top.position.set(-272, 3.7, z); group.add(top);
  }
  for (const tz of [-100, 40, 220]) {
    const tower = new THREE.Group();
    for (const [lx, lz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
      const leg = box(0.3, 4.4, 0.3, 0x8a6b3d, lx, 2.2, lz);
      tower.add(leg);
    }
    const cabin = box(3.4, 2.2, 3.2, 0xffffff, 0, 5.4, 0);
    const cabinRoof = box(4, 0.4, 3.8, 0xe63946, 0, 6.7, 0);
    tower.add(cabin, cabinRoof);
    tower.position.set(-268, 0, tz);
    group.add(tower);
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
  // sorot cahaya mercusuar (kerucut tembus pandang) — mengarah ke BARAT,
  // di atas laut (bukan ke timur masuk kota).
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(9, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2c9, transparent: true, opacity: 0.16, side: THREE.DoubleSide }),
  );
  beam.rotation.z = Math.PI / 2; beam.position.set(-30, 36, 0);
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

  // --- Ferris wheel di ujung utara pantai (landmark kedua, terlihat dari jalan pantai) ---
  const wheel = new THREE.Group();
  const wheelWhite = new THREE.MeshLambertMaterial({ color: 0xf4f4f4 });
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 32, 1.4), wheelWhite);
    leg.position.set(s * 7, 15, 0);
    leg.rotation.z = -s * 0.22;
    wheel.add(leg);
  }
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(17, 0.8, 8, 32),
    new THREE.MeshLambertMaterial({ color: 0xe63946 }),
  );
  rim.position.y = 30;
  wheel.add(rim);
  for (let k = 0; k < 4; k++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.6, 34, 0.6), wheelWhite);
    spoke.position.y = 30;
    spoke.rotation.z = (k * Math.PI) / 4;
    wheel.add(spoke);
  }
  const cabinColors = [0xe63946, 0xffd23f, 0x4cc9f0, 0xff8fa3, 0x7ee081, 0xf72585, 0xffe66d, 0x4361ee];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.6, 2.6),
      new THREE.MeshLambertMaterial({ color: cabinColors[k] }),
    );
    cab.position.set(Math.cos(a) * 17, 30 + Math.sin(a) * 17, 0);
    wheel.add(cab);
  }
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 2, 10),
    new THREE.MeshLambertMaterial({ color: 0xffd23f }),
  );
  hub.rotation.x = Math.PI / 2;
  hub.position.y = 30;
  wheel.add(hub);
  // Roda menghadap timur (ke jalan pantai) supaya bundar penuh dari kamera chase.
  wheel.rotation.y = Math.PI / 2;
  wheel.position.set(-284, 0, -300);
  group.add(wheel);

  // --- 4 kapal di laut (laut tidak boleh kosong dari kamera chase) ---
  const shipSpots = [
    { x: -360, z: -260, c: 0xe63946 }, { x: -385, z: -60, c: 0x4cc9f0 },
    { x: -350, z: 120, c: 0xffd23f }, { x: -395, z: 240, c: 0x7ee081 },
  ];
  for (const s of shipSpots) {
    const ship = new THREE.Group();
    ship.add(box(5, 2, 13, 0xf4f4f4, 0, 1, 0));
    ship.add(box(3.4, 2, 4, s.c, 0, 3, -1.5));
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 5, 6),
      new THREE.MeshLambertMaterial({ color: 0x8a6b3d }),
    );
    mast.position.set(0, 4.5, 1);
    ship.add(mast);
    ship.position.set(s.x, 0.3, s.z);
    ship.rotation.y = 0.4;
    group.add(ship);
  }

  // --- Papan nama distrik (signage besar, terbaca dari jauh) ---
  for (const d of DISTRICTS) {
    const tex = textTexture([d.name, d.sub], { color: d.color, bg: '#12233d' });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(d.big ? 46 : 30, d.big ? 23 : 15),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    sign.position.set(d.x, d.big ? 26 : 20, d.z);
    sign.rotation.y = d.ry !== undefined ? d.ry : Math.PI / 4;
    group.add(sign);
    // tiang penyangga
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, d.big ? 16 : 12, 8),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    pole.position.set(d.x, d.big ? 8 : 6, d.z);
    group.add(pole);
  }

  // --- Papan toko (signage kecil di trotoar dekat toko) ---
  // Ukuran 12×5 di y=4 (setinggi mata) — papan 20×10 di y=12 terlalu tinggi:
  // dari kamera orang ketiga yang menunduk ke pemain, papan setinggi itu
  // jatuh DI ATAS tepi frame dan tidak terlihat sama sekali.
  for (const s of SHOP_SIGNS) {
    const tex = textTexture([s.name, s.sub], { color: s.color, bg: '#12233d' });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 5),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    sign.position.set(s.x, 4, s.z);
    sign.rotation.y = s.ry !== undefined ? s.ry : Math.PI / 4;
    group.add(sign);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 3, 8),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    pole.position.set(s.x, 1.5, s.z);
    group.add(pole);
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
