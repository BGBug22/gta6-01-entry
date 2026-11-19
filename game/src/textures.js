// VELAMAR v5 — procedural canvas textures (no image files, no network).
// Every texture is drawn once from a seeded LCG, so the city looks the same
// on every run. Used by city.js (facades, neon, containers, sand, sea) and
// vehicles.js (asphalt sheen).
import * as THREE from 'three';

// Small deterministic LCG (same family as random.js, local so this module
// stands alone for the dossier outline).
export function lcg(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTex(c, repeat) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

// Asphalt: dark grain + speckle + a wet sheen band that catches the sunset
// and the police sirens (drawn as faint red/blue streaks).
export function asphaltTexture(seed = 5) {
  const [c, g] = canvas(256, 256);
  const r = lcg(seed);
  g.fillStyle = '#33373f'; g.fillRect(0, 0, 256, 256);
  const dots = ['#2b2f36', '#3d424b', '#454a55', '#26292f', '#4a4f58'];
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = dots[Math.floor(r() * dots.length)];
    const s = 1 + r() * 2.5;
    g.fillRect(r() * 256, r() * 256, s, s);
  }
  // wet sheen: two diagonal gloss bands
  g.fillStyle = 'rgba(255,180,110,.06)';
  g.beginPath(); g.moveTo(0, 90); g.lineTo(256, 40); g.lineTo(256, 90); g.lineTo(0, 140); g.fill();
  g.fillStyle = 'rgba(80,140,255,.05)';
  g.beginPath(); g.moveTo(0, 200); g.lineTo(256, 150); g.lineTo(256, 200); g.lineTo(0, 250); g.fill();
  // faint siren reflections
  g.fillStyle = 'rgba(255,40,40,.10)';
  g.fillRect(20, 0, 6, 256);
  g.fillStyle = 'rgba(40,80,255,.10)';
  g.fillRect(230, 0, 6, 256);
  return toTex(c, [10, 10]);
}

// Center line + edge lines for the boulevard (drawn on the road plane).
export function roadMarkTexture() {
  const [c, g] = canvas(256, 64);
  g.clearRect(0, 0, 256, 64);
  g.fillStyle = '#ffd23f';
  g.fillRect(0, 28, 256, 8); // double yellow center
  g.fillStyle = '#f5f0dc';
  g.fillRect(0, 2, 256, 3); g.fillRect(0, 59, 256, 3); // white edges
  return toTex(c);
}

// Art Deco facade: warm wall + vertical fins + lit window grid + neon trim.
export function artDecoFacade(wall, lit, seed) {
  const [c, g] = canvas(128, 256);
  const r = lcg(seed);
  g.fillStyle = wall; g.fillRect(0, 0, 128, 256);
  // vertical Deco fins
  g.fillStyle = 'rgba(0,0,0,.14)';
  for (let x = 8; x < 128; x += 32) g.fillRect(x, 0, 4, 256);
  g.fillStyle = 'rgba(255,255,255,.10)';
  for (let x = 12; x < 128; x += 32) g.fillRect(x, 0, 2, 256);
  // ground floor darker + entrance glow
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 216, 128, 40);
  g.fillStyle = '#ffd23f'; g.fillRect(52, 224, 24, 24);
  // lit window grid (warm yellow / cool white / dark)
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 10 + col * 22, y = 12 + row * 22;
      const litR = r();
      g.fillStyle = litR < lit ? (r() < 0.6 ? '#ffd23f' : '#fff2c9') : '#2b3a55';
      g.fillRect(x, y, 14, 16);
    }
  }
  // neon trim along the top edge
  g.fillStyle = '#ff5d8f'; g.fillRect(0, 0, 128, 4);
  return toTex(c);
}

// Glass tower: dark blue glass + bright lit window grid + mullions.
export function glassTowerTexture(seed) {
  const [c, g] = canvas(128, 256);
  const r = lcg(seed);
  g.fillStyle = '#16283f'; g.fillRect(0, 0, 128, 256);
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 6 + col * 20, y = 8 + row * 20;
      const litR = r();
      g.fillStyle = litR < 0.55 ? (r() < 0.5 ? '#bfe6ff' : '#ffd23f') : '#0e1a2c';
      g.fillRect(x, y, 14, 13);
    }
  }
  g.fillStyle = 'rgba(255,255,255,.12)';
  for (let x = 0; x < 128; x += 20) g.fillRect(x, 0, 1, 256);
  return toTex(c);
}

// Neon sign: glowing letters on a dark plate with a colored border.
export function neonSignTexture(lines, color, bg = '#0d1526') {
  const [c, g] = canvas(512, 256);
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = color; g.lineWidth = 10;
  g.shadowColor = color; g.shadowBlur = 28;
  g.strokeRect(10, 10, 492, 236);
  g.textAlign = 'center';
  g.fillStyle = color;
  g.font = 'bold 62px Arial, sans-serif';
  g.fillText(lines[0], 256, 108);
  if (lines[1]) {
    g.font = 'bold 30px Arial, sans-serif';
    g.fillStyle = '#ffffff';
    g.fillText(lines[1], 256, 176);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Corrugated shipping container: ridges + rust streaks + stencil label.
export function containerTexture(color, seed) {
  const [c, g] = canvas(256, 128);
  const r = lcg(seed);
  g.fillStyle = color; g.fillRect(0, 0, 256, 128);
  for (let x = 0; x < 256; x += 16) {
    g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x, 0, 5, 128);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 5, 0, 3, 128);
  }
  // rust streaks
  for (let i = 0; i < 24; i++) {
    g.fillStyle = `rgba(120,60,20,${0.10 + r() * 0.18})`;
    const x = r() * 256;
    g.fillRect(x, r() * 40, 3 + r() * 4, 30 + r() * 60);
  }
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.font = 'bold 26px Arial, sans-serif'; g.textAlign = 'center';
  g.fillText('VELA LINE', 128, 72);
  return toTex(c);
}

// Sand: warm grains + speckles + a foam edge band (for the shoreline).
export function sandTexture(seed = 9) {
  const [c, g] = canvas(256, 256);
  const r = lcg(seed);
  g.fillStyle = '#f2d8a0'; g.fillRect(0, 0, 256, 256);
  const dots = ['#e8c88a', '#fbeec0', '#d9b878', '#fff2c9', '#c9a86a'];
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = dots[Math.floor(r() * dots.length)];
    const s = 1 + r() * 3;
    g.fillRect(r() * 256, r() * 256, s, s);
  }
  return toTex(c, [12, 12]);
}

// Sea: turquoise with sun glitter + wave foam lines.
export function seaTexture(seed = 11) {
  const [c, g] = canvas(256, 256);
  const r = lcg(seed);
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#1e90c8'); grad.addColorStop(0.5, '#2fb3e0'); grad.addColorStop(1, '#1778a8');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  // sun glitter
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(255,240,190,${0.15 + r() * 0.35})`;
    const s = 1 + r() * 3;
    g.fillRect(r() * 256, r() * 256, s, s);
  }
  // foam lines
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const y = 20 + i * 34 + r() * 10;
    g.beginPath();
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 4);
    g.stroke();
  }
  return toTex(c, [6, 6]);
}

// Sun disc with halo bloom: bright core + warm radial glow.
export function sunTexture() {
  const [c, g] = canvas(256, 256);
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,246,200,1)');
  grad.addColorStop(0.25, 'rgba(255,214,100,0.95)');
  grad.addColorStop(0.55, 'rgba(255,150,70,0.45)');
  grad.addColorStop(1, 'rgba(255,120,60,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Procedural cloud puffs (soft white blobs) for the sky dome.
export function cloudTexture(seed = 13) {
  const [c, g] = canvas(512, 256);
  const r = lcg(seed);
  g.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 26; i++) {
    const x = r() * 512, y = 40 + r() * 150, rad = 22 + r() * 42;
    const grad = g.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, 'rgba(255,235,220,0.85)');
    grad.addColorStop(0.6, 'rgba(255,210,200,0.35)');
    grad.addColorStop(1, 'rgba(255,200,190,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Ground: warm green-brown speckle (city blocks, not flat).
export function groundTexture(seed = 7) {
  const [c, g] = canvas(256, 256);
  const r = lcg(seed);
  g.fillStyle = '#a8b078'; g.fillRect(0, 0, 256, 256);
  const dots = ['#98a868', '#b8c088', '#c9b183', '#8a9a68', '#b0a06a'];
  for (let i = 0; i < 900; i++) {
    g.fillStyle = dots[Math.floor(r() * dots.length)];
    const s = 2 + r() * 5;
    g.fillRect(r() * 256, r() * 256, s, s);
  }
  return toTex(c, [28, 28]);
}
