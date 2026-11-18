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

// Kubah langit senja — gradien vertikal deterministik (canvas): ungu gelap di
// atas, magenta, oranye, emas di horizon. Kubah besar (BackSide) mengelilingi
// kota supaya kamera chase melihat LANGIT, bukan warna datar.
function skyDomeTexture() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  // Horizon (v=0.5, y=256) harus EMAS-ORANYE: kamera chase melihat langit
  // di atas horizon, jadi oranye mulai TINGGI (bukan cuma di garis horizon).
  grad.addColorStop(0.00, '#2b1a5e'); // ungu gelap — zenit
  grad.addColorStop(0.14, '#7a2d6d'); // magenta
  grad.addColorStop(0.28, '#e85d4a'); // merah-oranye
  grad.addColorStop(0.42, '#ff8a3d'); // oranye senja
  grad.addColorStop(0.52, '#ffb347'); // emas horizon
  grad.addColorStop(0.70, '#ffd23f');
  grad.addColorStop(1.00, '#ffd23f');
  g.fillStyle = grad; g.fillRect(0, 0, 16, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Cakram matahari — radial glow putih-kuning ke oranye transparan.
function sunTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0.00, 'rgba(255,255,240,1)');
  grad.addColorStop(0.18, 'rgba(255,214,120,1)');
  grad.addColorStop(0.45, 'rgba(255,150,60,0.55)');
  grad.addColorStop(1.00, 'rgba(255,120,40,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Bianglala pantai — roda + jeruji + kabin warna-warni + kaki penyangga.
// Statis (tanpa animasi) supaya screenshot deterministik.
function buildFerrisWheel(x, z) {
  const g = new THREE.Group();
  const frame = new THREE.MeshLambertMaterial({ color: 0xf4f4f4 });
  const legMat = new THREE.MeshLambertMaterial({ color: 0x8a6b3d });
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 26, 1.2), legMat);
    leg.position.set(s * 7, 13, 0); leg.rotation.z = s * 0.28;
    g.add(leg);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3, 10), frame);
  hub.rotation.x = Math.PI / 2; hub.position.y = 24; g.add(hub);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(17, 0.7, 8, 40), frame);
  rim.position.y = 24; g.add(rim);
  const cabinColors = [0xe63946, 0xffd23f, 0x4cc9f0, 0xff8fa3, 0x7ee081, 0xf72585, 0xffe66d, 0x4361ee];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sx = Math.cos(a) * 17, sy = 24 + Math.sin(a) * 17;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 17, 0.5), frame);
    spoke.position.set(Math.cos(a) * 8.5, 24 + Math.sin(a) * 8.5, 0);
    spoke.rotation.z = a + Math.PI / 2;
    g.add(spoke);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.2, 2.2),
      new THREE.MeshLambertMaterial({ color: cabinColors[i] }),
    );
    cabin.position.set(sx, sy, 0);
    g.add(cabin);
  }
  g.position.set(x, 0, z);
  return g;
}

// Kapal kecil di laut — lambung putih + kabin biru, statis.
function buildBoat(x, z, s = 1) {
  const g = new THREE.Group();
  const hull = box(6 * s, 2.4 * s, 16 * s, 0xf4f4f4, 0, 1.2 * s, 0);
  const cabin = box(4 * s, 2.4 * s, 5 * s, 0x4361ee, 0, 3.4 * s, -2 * s);
  g.add(hull, cabin);
  g.position.set(x, 0.4, z);
  return g;
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

  // --- Langit senja, kabut hangat, matahari sore dari barat ---
  // Kubah gradien (bukan warna datar): kamera chase melihat langit oranye-ungu
  // dengan matahari rendah di atas laut — seperti kota juara top 1/2/4/5.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1150, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyDomeTexture(), side: THREE.BackSide, fog: false }),
  );
  sky.position.set(0, 0, 0);
  scene.add(sky);
  scene.background = null;
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTexture(), fog: false, depthWrite: false, transparent: true,
  }));
  sunSprite.position.set(-480, 60, -800);
  sunSprite.scale.set(200, 200, 1);
  scene.add(sunSprite);
  scene.fog = new THREE.Fog(PALETTE.fogSunset, 250, 900);
  const sun = new THREE.DirectionalLight(0xffc890, 1.7);
  sun.position.set(-220, 190, -160);
  scene.add(sun);
  // Fill dari tenggara (di belakang kamera chase): menerangi buritan mobil +
  // jalan supaya tidak gelap — matahari senja datang dari barat saja
  // membuat sisi yang menghadap kamera nyaris hitam.
  const fill = new THREE.DirectionalLight(0xfff2e0, 0.5);
  fill.position.set(120, 140, 320);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffb27d, 0x5a4a42, 0.65));

  // --- Tanah dasar kota (bertekstur) ---
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(H * 2 + 200, H * 2 + 200),
    new THREE.MeshLambertMaterial({ map: groundTexture() }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(40, -0.05, 0);
  group.add(ground);

  // --- Laut (barat) + pantai pasir ---
  // Laut TANPA kabut: kabut senja yang hangat membuat laut biru jadi coklat
  // dan tidak terbaca dari kamera chase — laut harus tetap biru.
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(320, H * 2 + 200),
    new THREE.MeshLambertMaterial({ color: PALETTE.sea, fog: false }),
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
      dash.rotation.x = -Math.PI / 2; dash.position.set(d, 0.12, r); group.add(dash);
      const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 6), lineMat);
      dash2.rotation.x = -Math.PI / 2; dash2.position.set(r, 0.12, d); group.add(dash2);
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
      m.position.set(a.x, 0.13, a.z);
      group.add(m);
    }
  }

  // --- Decal nama distrik di jalan ---
  // HANYA horizontal (KOTA TUA, VELAMAR): decal vertikal di jalan pantai
  // jadi coretan merah raksasa dari kamera chase (dulu untuk kamera atas).
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
    m.position.set(d.x, 0.14, d.z);
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
  // sorot cahaya mercusuar — ke BARAT di atas laut (bukan ke kota): dari
  // kamera chase, beam ke timur jadi segitiga putih raksasa di tengah frame.
  // Apex kerucut di menara, melebar ke barat: rotasi -90° (apex +y -> +x).
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(7, 40, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2c9, transparent: true, opacity: 0.10, side: THREE.DoubleSide }),
  );
  beam.rotation.z = -Math.PI / 2; beam.position.set(-20, 36, 0);
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

  // Laut TIDAK kosong: kapal-kapal lain + bianglala pantai di kejauhan —
  // dari kamera chase, sisi laut terisi aktivitas, bukan bidang biru polos.
  group.add(buildBoat(-330, -60, 1.1));
  group.add(buildBoat(-345, 90, 0.9));
  group.add(buildBoat(-322, 240, 1.2));
  group.add(buildBoat(-335, -260, 0.8));
  group.add(buildFerrisWheel(-284, -300));

  // --- Papan nama distrik (signage besar, terbaca dari jauh) ---
  for (const d of DISTRICTS) {
    const tex = textTexture([d.name, d.sub], { color: d.color, bg: '#12233d' });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(d.big ? 46 : 30, d.big ? 23 : 15),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    sign.position.set(d.x, d.big ? 26 : 20, d.z);
    sign.rotation.y = Math.PI / 4;
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
  for (const s of SHOP_SIGNS) {
    const tex = textTexture([s.name, s.sub], { color: s.color, bg: '#12233d' });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    sign.position.set(s.x, 12, s.z);
    sign.rotation.y = s.ry !== undefined ? s.ry : Math.PI / 4;
    group.add(sign);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 7, 8),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    pole.position.set(s.x, 3.5, s.z);
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
