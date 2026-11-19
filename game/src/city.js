import * as THREE from 'three';
import { WORLD, DISTRICTS, PALETTE, ROOF_COLORS, SHOP_SIGNS } from './config.js';
import { makeRng, pick, range } from './random.js';
import {
  lcg, asphaltTexture, artDecoFacade, glassTowerTexture, neonSignTexture,
  containerTexture, sandTexture, seaTexture, sunTexture, cloudTexture,
  groundTexture,
} from './textures.js';

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

export function buildCity(scene, opts = {}) {
  const night = !!opts.night;
  const rng = makeRng(WORLD.seed);
  const group = new THREE.Group();
  const colliders = [];
  const H = WORLD.halfSize;

  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4; skyCanvas.height = 512;
  const sg = skyCanvas.getContext('2d');
  const grad = sg.createLinearGradient(0, 0, 0, 512);
  if (night) {
    grad.addColorStop(0.0, '#050518');
    grad.addColorStop(0.20, '#141038');
    grad.addColorStop(0.34, '#3a2050');
    grad.addColorStop(0.44, '#7a3a3a');
    grad.addColorStop(0.55, '#c06a3a');
    grad.addColorStop(1.0, '#c06a3a');
  } else {
    grad.addColorStop(0.0, '#1c1248');
    grad.addColorStop(0.12, '#4a2f7e');
    grad.addColorStop(0.22, '#a04a8a');
    grad.addColorStop(0.32, '#ff6a4d');
    grad.addColorStop(0.40, '#ffb347');
    grad.addColorStop(0.50, '#ffe0a0');
    grad.addColorStop(1.0, '#ffe0a0');
  }
  sg.fillStyle = grad; sg.fillRect(0, 0, 4, 512);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(1200, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }),
  );
  scene.add(skyDome);
  scene.background = new THREE.Color(night ? 0x0a0a24 : PALETTE.sky);

  const cloudTex = cloudTexture();
  const cloudMat = new THREE.MeshBasicMaterial({
    map: cloudTex, transparent: true, opacity: night ? 0.35 : 0.95,
    side: THREE.DoubleSide, depthWrite: false, fog: false,
  });
  const cloudRng = makeRng(WORLD.seed + 101);
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const w = 120 + cloudRng() * 180;
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.42), cloudMat);
    cloud.position.set(
      -500 + cloudRng() * 1000,
      180 + cloudRng() * 160,
      -600 + cloudRng() * 900,
    );
    cloud.rotation.y = Math.PI / 2 + (cloudRng() - 0.5) * 0.6;
    scene.add(cloud);
    clouds.push(cloud);
  }

  if (!night) {
    const haloTex = sunTexture();
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshBasicMaterial({
        map: haloTex, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
      }),
    );
    halo.position.set(-1000, 120, -350);
    halo.rotation.y = Math.PI / 2;
    scene.add(halo);
    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(55, 24),
      new THREE.MeshBasicMaterial({ color: 0xffe066, fog: false }),
    );
    sunDisc.position.set(-990, 120, -350);
    sunDisc.rotation.y = Math.PI / 2;
    scene.add(sunDisc);
    const reflect = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 260),
      new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    reflect.rotation.x = -Math.PI / 2;
    reflect.position.set(-380, 0.06, -320);
    group.add(reflect);
  } else {
    const starRng = makeRng(WORLD.seed + 202);
    const starPos = [];
    for (let i = 0; i < 220; i++) {
      const a = starRng() * Math.PI * 2;
      const e = 0.25 + starRng() * 1.1;
      const r = 1150;
      starPos.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, fog: false }));
    scene.add(stars);
    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(38, 24),
      new THREE.MeshBasicMaterial({ color: 0xe8ecff, fog: false }),
    );
    moon.position.set(900, 420, -500);
    moon.rotation.y = -Math.PI / 2;
    scene.add(moon);
  }

  scene.fog = new THREE.Fog(night ? 0x1a1a3a : PALETTE.fog, night ? 200 : 250, night ? 800 : 900);
  const sun = new THREE.DirectionalLight(night ? 0x8a9fd8 : 0xffb36b, night ? 1.0 : 2.4);
  sun.position.set(-400, 140, -60);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffe0b8, night ? 0.35 : 0.7);
  fill.position.set(300, 160, 300);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(night ? 0x2a2a5a : 0x8a6fb8, 0x7a5a3a, night ? 0.55 : 0.95));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(H * 2 + 200, H * 2 + 200),
    new THREE.MeshLambertMaterial({ map: groundTexture() }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(40, -0.05, 0);
  group.add(ground);

  const seaTex = seaTexture();
  seaTex.repeat.set(6, 14);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(320, H * 2 + 200),
    new THREE.MeshLambertMaterial({ map: seaTex }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(WORLD.seaX - 130, 0.02, 0);
  group.add(sea);
  const sandTex = sandTexture();
  sandTex.repeat.set(1, 14);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(50, H * 2 + 200),
    new THREE.MeshLambertMaterial({ map: sandTex }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(WORLD.beachX - 12, 0.03, 0);
  group.add(sand);
  const foam = new THREE.Mesh(
    new THREE.PlaneGeometry(7, H * 2 + 200),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(WORLD.beachX - 38, 0.05, 0);
  group.add(foam);

  const roadTexH = asphaltTexture(5, night ? '#222836' : '#3a4150'); roadTexH.repeat.set(40, 1);
  const roadTexV = asphaltTexture(5, night ? '#222836' : '#3a4150'); roadTexV.repeat.set(1, 40);
  const roadMatH = new THREE.MeshLambertMaterial({ map: roadTexH });
  const roadMatV = new THREE.MeshLambertMaterial({ map: roadTexV });
  const walkMat = new THREE.MeshLambertMaterial({ color: PALETTE.sidewalk });
  const lineMat = new THREE.MeshBasicMaterial({ color: PALETTE.roadLine });
  const roads = [];
  for (let i = -4; i <= 4; i++) roads.push(i * WORLD.roadGap);
  for (const r of roads) {
    const hRoad = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 14), roadMatH);
    hRoad.rotation.x = -Math.PI / 2; hRoad.position.set(0, 0.10, r); group.add(hRoad);
    const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(14, H * 2), roadMatV);
    vRoad.rotation.x = -Math.PI / 2; vRoad.position.set(r, 0.10, 0); group.add(vRoad);
    const hWalk = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 20), walkMat);
    hWalk.rotation.x = -Math.PI / 2; hWalk.position.set(0, 0.04, r); group.add(hWalk);
    const vWalk = new THREE.Mesh(new THREE.PlaneGeometry(20, H * 2), walkMat);
    vWalk.rotation.x = -Math.PI / 2; vWalk.position.set(r, 0.04, 0); group.add(vWalk);
    for (let d = -H; d < H; d += 16) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.7), lineMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(d, 0.11, r); group.add(dash);
      const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 6), lineMat);
      dash2.rotation.x = -Math.PI / 2; dash2.position.set(r, 0.11, d); group.add(dash2);
    }
  }

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

  const decals = [
    { text: 'OLD TOWN', sub: 'PLAZA MERCADO', x: 40, z: 160, vertical: false, color: '#7ee081' },
    { text: 'VELAMAR', sub: 'HARBOR CITY', x: -40, z: 0, vertical: false, color: '#ffd23f' },
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

  const lit = night ? 0.85 : 0.7;
  const facades = [
    artDecoFacade('#ffd9a0', lit, 11),
    artDecoFacade('#ffb4a2', lit, 23),
    artDecoFacade('#ffe66d', lit, 37),
    glassTowerTexture('#9fd8ff', night ? 0.9 : 0.75, 51),
  ];
  const blockCenters = [];
  for (let ix = -3; ix <= 3; ix++) for (let iz = -3; iz <= 3; iz++) {
    const cx = ix * WORLD.roadGap + WORLD.roadGap / 2;
    const cz = iz * WORLD.roadGap + WORLD.roadGap / 2;
    if (cx < WORLD.beachX + 20) continue;
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

  const neons = [
    { text: 'VELA BANK', sub: 'VAULT • GLASS DISTRICT', x: 190, y: 14, z: -148, color: '#ffd23f', ry: Math.PI },
    { text: 'HOTEL AZUL', sub: 'ROOMS • SEA VIEW', x: -252, y: 12, z: 168, color: '#4cc9f0', ry: Math.PI / 2 },
    { text: 'EL GATILLO ARMS', sub: 'GUNS • AMMO', x: 126, y: 10, z: 66, color: '#ff5d5d', ry: Math.PI },
  ];
  for (const n of neons) {
    const tex = neonSignTexture(n.text, n.sub, n.color);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 8),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
    );
    sign.position.set(n.x, n.y, n.z);
    sign.rotation.y = n.ry;
    group.add(sign);
  }

  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a5a2b });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2fae5f });
  const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x45c47a });
  const palmTrunkGeo = new THREE.CylinderGeometry(0.2, 0.42, 8, 6);
  const palmFrondGeo = new THREE.BoxGeometry(5.2, 0.12, 1.3);
  const palmFrondGeo2 = new THREE.BoxGeometry(4.2, 0.12, 1.1);
  function makePalm(x, z, h, lean) {
    const g = new THREE.Group();
    const lower = new THREE.Mesh(palmTrunkGeo, trunkMat);
    lower.scale.y = (h * 0.6) / 8;
    lower.position.y = h * 0.3;
    g.add(lower);
    const upper = new THREE.Mesh(palmTrunkGeo, trunkMat);
    upper.scale.y = (h * 0.45) / 8;
    upper.position.set(lean * h * 0.5, h * 0.75, 0);
    upper.rotation.z = lean * 2.2;
    g.add(upper);
    const topX = lean * h * 0.9;
    const topY = h;
    for (let k = 0; k < 7; k++) {
      const holder = new THREE.Group();
      holder.position.set(topX, topY, 0);
      holder.rotation.y = (k * Math.PI * 2) / 7 + 0.3;
      const frond = new THREE.Mesh(k % 2 ? palmFrondGeo2 : palmFrondGeo, k % 2 ? leafMat2 : leafMat);
      frond.position.set(2.2, -0.6 - (k % 3) * 0.25, 0);
      frond.rotation.z = -0.5 - (k % 3) * 0.12;
      holder.add(frond);
      g.add(holder);
    }
    g.position.set(x, 0, z);
    return g;
  }
  for (let i = 0; i < 70; i++) {
    const rx = roads[Math.floor(rng() * roads.length)] + (rng() < 0.5 ? -11 : 11);
    const rz = range(rng, -H, H);
    if (rx < WORLD.beachX + 8) continue;
    group.add(makePalm(rx, rz, 7 + (i % 3), (i % 5) * 0.02 - 0.04));
  }
  const pj = lcg(99);
  for (let z = -320; z <= 320; z += 20) {
    group.add(makePalm(-263 + (pj() - 0.5) * 6, z + (pj() - 0.5) * 8, 8, (pj() - 0.5) * 0.08));
  }

  const poleMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
  const glowMat = new THREE.MeshBasicMaterial({ color: night ? 0xffe9a0 : 0xfff2c9, transparent: true, opacity: night ? 1 : 0.7 });
  function streetlight(x, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 7, 6), poleMat);
    pole.position.y = 3.5; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.14), poleMat);
    arm.position.set(1, 6.9, 0); g.add(arm);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), glowMat);
    lamp.position.set(2, 6.7, 0); g.add(lamp);
    g.position.set(x, 0, z);
    return g;
  }
  for (let z = -300; z <= 300; z += 40) {
    group.add(streetlight(-252, z));
    if (z % 80 === 0) group.add(streetlight(12, z));
  }

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

  const pier = box(16, 1.2, 130, 0x8a6b3d, -292, 0.6, -190);
  group.add(pier);
  const tower = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 9, 34, 16),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  );
  base.position.y = 17; tower.add(base);
  for (let i = 0; i < 3; i++) {
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
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(9, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2c9, transparent: true, opacity: night ? 0.3 : 0.16, side: THREE.DoubleSide }),
  );
  beam.rotation.z = Math.PI / 2; beam.position.set(-30, 36, 0);
  tower.add(beam);
  tower.position.set(-292, 1, -252);
  group.add(tower);

  const boat = new THREE.Group();
  const hull = box(6, 2.4, 16, 0xf4f4f4, 0, 1.2, 0);
  const cabin = box(4, 2.4, 5, 0x4361ee, 0, 3.4, -2);
  boat.add(hull, cabin);
  boat.position.set(-310, 0.4, -200);
  group.add(boat);

  const dockX = -252, dockZ = -140;
  const contCols = ['#c8342c', '#e07b2a', '#2a5fc8'];
  const contMats = contCols.map((c, i) => new THREE.MeshLambertMaterial({ map: containerTexture(c, 20 + i) }));
  const contGeo = new THREE.BoxGeometry(12, 2.6, 2.6);
  const contSpots = [
    { x: -246, z: -120, y: 1.3, ry: 0 }, { x: -246, z: -120, y: 3.9, ry: 0 },
    { x: -246, z: -132, y: 1.3, ry: 0 }, { x: -258, z: -108, y: 1.3, ry: Math.PI / 2 },
    { x: -258, z: -108, y: 3.9, ry: Math.PI / 2 }, { x: -258, z: -108, y: 6.5, ry: Math.PI / 2 },
    { x: -232, z: -150, y: 1.3, ry: 0.3 }, { x: -270, z: -160, y: 1.3, ry: -0.2 },
  ];
  contSpots.forEach((s, i) => {
    const c = new THREE.Mesh(contGeo, contMats[i % 3]);
    c.position.set(s.x, s.y, s.z);
    c.rotation.y = s.ry;
    group.add(c);
    colliders.push({ minX: s.x - 6, maxX: s.x + 6, minZ: s.z - 2, maxZ: s.z + 2 });
  });
  const crane = new THREE.Group();
  const craneMat = new THREE.MeshLambertMaterial({ color: 0xffd23f });
  const craneTower = new THREE.Mesh(new THREE.BoxGeometry(3, 26, 3), craneMat);
  craneTower.position.y = 13; crane.add(craneTower);
  const jib = new THREE.Mesh(new THREE.BoxGeometry(26, 1.6, 1.6), craneMat);
  jib.position.set(10, 25, 0); crane.add(jib);
  const counterJib = new THREE.Mesh(new THREE.BoxGeometry(8, 1.6, 1.6), craneMat);
  counterJib.position.set(-7, 25, 0); crane.add(counterJib);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 14, 4),
    new THREE.MeshLambertMaterial({ color: 0x222222 }));
  cable.position.set(20, 18, 0); crane.add(cable);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x333333 }));
  hook.position.set(20, 11, 0); crane.add(hook);
  crane.position.set(dockX - 16, 0, dockZ + 0);
  group.add(crane);
  const cargo = new THREE.Group();
  cargo.add(box(14, 4, 46, 0x1b263b, 0, 2, 0));
  cargo.add(box(10, 3, 8, 0xe63946, 0, 5.5, -14));
  cargo.add(box(8, 2.4, 6, 0xffd23f, 0, 5.2, 6));
  cargo.add(box(6, 2.4, 6, 0x4cc9f0, 0, 5.2, 14));
  cargo.position.set(-318, 0.4, -150);
  cargo.rotation.y = 0.15;
  group.add(cargo);

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
  wheel.rotation.y = Math.PI / 2;
  wheel.position.set(-284, 0, -300);
  group.add(wheel);

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

  for (const d of DISTRICTS) {
    const tex = textTexture([d.name, d.sub], { color: d.color, bg: '#12233d' });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(d.big ? 46 : 30, d.big ? 23 : 15),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    sign.position.set(d.x, d.big ? 26 : 20, d.z);
    sign.rotation.y = d.ry !== undefined ? d.ry : Math.PI / 4;
    group.add(sign);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, d.big ? 16 : 12, 8),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    pole.position.set(d.x, d.big ? 8 : 6, d.z);
    group.add(pole);
  }

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

  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(34, 24),
    new THREE.MeshLambertMaterial({ map: sandTexture(), color: 0xd8cbb0 }),
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(60, 0.06, 140);
  group.add(plaza);
  const fountain = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 9, 1.2, 16),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ff }),
  );
  fountain.position.set(60, 0.6, 140);
  group.add(fountain);
  const fountainRim = new THREE.Mesh(
    new THREE.TorusGeometry(8.5, 0.5, 8, 24),
    new THREE.MeshLambertMaterial({ color: 0xf4f4f4 }),
  );
  fountainRim.rotation.x = Math.PI / 2;
  fountainRim.position.set(60, 1.2, 140);
  group.add(fountainRim);
  const spout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.2, 2.6, 8),
    new THREE.MeshLambertMaterial({ color: 0xf4f4f4 }),
  );
  spout.position.set(60, 2.2, 140);
  group.add(spout);
  const spoutTop = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ff }),
  );
  spoutTop.position.set(60, 3.8, 140);
  group.add(spoutTop);
  for (const [ux, uz, uc] of [[38, 118, 0xe63946], [82, 162, 0xffd23f], [40, 162, 0x4cc9f0]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 6), new THREE.MeshLambertMaterial({ color: 0xf4f4f4 }));
    pole.position.set(ux, 1.5, uz); group.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 8), new THREE.MeshLambertMaterial({ color: uc }));
    top.position.set(ux, 3.5, uz); group.add(top);
    group.add(box(2.4, 0.5, 0.9, 0x8a6b3d, ux + 2, 0.25, uz + 2));
  }
  group.add(makePalm(34, 120, 8, 0.02), makePalm(86, 118, 7, -0.02));

  scene.add(group);
  return { group, colliders, clouds, roadMats: [roadMatH, roadMatV] };
}

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
