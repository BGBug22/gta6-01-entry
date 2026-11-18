// Minimap — canvas 2D live: jalan grid, laut, mercusuar, pemain (panah kuning),
// polisi (biru/merah), target misi (berlian kuning berkedip), mobil (abu-abu).
import { WORLD } from './config.js';

export class Minimap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = canvas.width;
    this.t = 0;
  }
  draw(state) {
    const ctx = this.ctx, S = this.size;
    const H = WORLD.halfSize + 60;
    const toMap = (x, z) => [((x + H) / (2 * H)) * S, ((z + H) / (2 * H)) * S];
    this.t += 0.016;
    // latar: darat + laut — warna TERANG supaya terbaca di lingkaran kecil
    ctx.fillStyle = '#6f8f5f'; ctx.fillRect(0, 0, S, S);
    const [seaX] = toMap(WORLD.seaX - 160, 0);
    ctx.fillStyle = '#2f9fd8'; ctx.fillRect(0, 0, Math.max(0, seaX), S);
    ctx.fillStyle = '#f2d8a0';
    const [bx] = toMap(WORLD.beachX, 0);
    ctx.fillRect(Math.max(0, bx) - 4, 0, 5, S);
    // jalan grid
    ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 3;
    for (let i = -4; i <= 4; i++) {
      const [x1, y1] = toMap(i * WORLD.roadGap, -H);
      const [x2, y2] = toMap(i * WORLD.roadGap, H);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const [x3, y3] = toMap(-H, i * WORLD.roadGap);
      const [x4, y4] = toMap(H, i * WORLD.roadGap);
      ctx.beginPath(); ctx.moveTo(x3, y3); ctx.lineTo(x4, y4); ctx.stroke();
    }
    // dermaga + mercusuar
    const [lx, ly] = toMap(-292, -252);
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial';
    ctx.fillText('FARO', lx + 7, ly + 3);
    // target misi (berkedip)
    if (state.target) {
      const [tx, ty] = toMap(state.target.x, state.target.z);
      const r = 6 + Math.sin(this.t * 6) * 2;
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(tx, ty - r); ctx.lineTo(tx + r, ty); ctx.lineTo(tx, ty + r); ctx.lineTo(tx - r, ty);
      ctx.closePath(); ctx.fill();
    }
    // mobil lalu lintas
    ctx.fillStyle = '#c8c8c8';
    for (const c of state.cars || []) {
      const [cx, cy] = toMap(c.x, c.z);
      ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
    }
    // polisi
    for (const c of state.police || []) {
      const [cx, cy] = toMap(c.x, c.z);
      ctx.fillStyle = '#2244ff';
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    // pemain: panah kuning BESAR searah hadap
    const [px, py] = toMap(state.player.x, state.player.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(Math.sin(state.player.heading), Math.cos(state.player.heading)) * -1 + Math.PI);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6.5, 7); ctx.lineTo(-6.5, 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#12233d'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    // bingkai LINGKARAN (minimap kini bundar)
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.stroke();
  }
}
