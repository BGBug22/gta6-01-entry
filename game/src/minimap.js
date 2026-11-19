import { WORLD } from './config.js';

export class Minimap {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.t = 0;
  }
  draw(game) {
    const ctx = this.ctx;
    const S = this.c.width;
    const cx = S / 2, cy = S / 2;
    const scale = S / (WORLD.halfSize * 2 + 80);
    const px = (x) => cx + (x - game.player.pos.x) * scale;
    const py = (z) => cy + (z - game.player.pos.z) * scale;
    this.t += 1 / 60;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, S / 2 - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0b3d66';
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#f2d8a0';
    const bx0 = px(WORLD.beachX - 37), bx1 = px(WORLD.beachX + 13);
    ctx.fillRect(bx0, 0, bx1 - bx0, S);
    ctx.fillStyle = '#2b2f38';
    ctx.fillRect(px(WORLD.beachX + 13), 0, S - px(WORLD.beachX + 13), S);
    ctx.strokeStyle = '#c9cdd6';
    ctx.lineWidth = 4;
    for (let i = -4; i <= 4; i++) {
      const r = i * WORLD.roadGap;
      ctx.beginPath(); ctx.moveTo(0, py(r)); ctx.lineTo(S, py(r)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px(r), 0); ctx.lineTo(px(r), S); ctx.stroke();
    }
    const target = game.missionTarget();
    if (target) {
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(px(target.x), py(game.player.pos.z));
      ctx.lineTo(px(target.x), py(target.z));
      ctx.stroke();
      ctx.setLineDash([]);
      const blink = 0.6 + 0.4 * Math.sin(this.t * 4);
      ctx.save();
      ctx.translate(px(target.x), py(target.z));
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(255,210,63,${blink})`;
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    }
    ctx.strokeStyle = '#8a6b3d';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px(-292), py(-130)); ctx.lineTo(px(-292), py(-250)); ctx.stroke();
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(px(-292), py(-252), 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0ab';
    for (const t of game.traffic) { ctx.fillRect(px(t.car.pos.x) - 1, py(t.car.pos.z) - 1, 2, 2); }
    ctx.fillStyle = '#e8e8e8';
    for (const p of game.peds) { ctx.fillRect(px(p.mesh.position.x) - 1, py(p.mesh.position.z) - 1, 2, 2); }
    for (const pc of game.police.cars) {
      ctx.fillStyle = '#ff2222';
      ctx.beginPath(); ctx.arc(px(pc.pos.x), py(pc.pos.z), 4, 0, Math.PI * 2); ctx.fill();
      const a = Math.atan2(game.player.pos.x - pc.pos.x, game.player.pos.z - pc.pos.z);
      ctx.fillStyle = 'rgba(255,34,34,0.35)';
      ctx.beginPath();
      ctx.moveTo(px(pc.pos.x), py(pc.pos.z));
      ctx.arc(px(pc.pos.x), py(pc.pos.z), 10, Math.PI / 2 - a - 0.4, Math.PI / 2 - a + 0.4);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#3355ff';
    for (const f of game.police.foot) {
      ctx.beginPath(); ctx.arc(px(f.mesh.position.x), py(f.mesh.position.z), 3, 0, Math.PI * 2); ctx.fill();
    }
    if (game.police.heli) {
      const h = game.police.heli.mesh.position;
      ctx.strokeStyle = '#4cc9f0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px(h.x), py(h.z), 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,242,201,0.35)';
      ctx.beginPath(); ctx.arc(px(h.x), py(h.z), 12, 0, Math.PI * 2); ctx.fill();
    }
    const heading = game.player.inCar && game.player.car ? game.player.car.heading : game.player.heading;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(heading);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (game.police.wanted > 0) {
      ctx.strokeStyle = 'rgba(255,34,34,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, S / 2 - 2, 0, Math.PI * 2); ctx.stroke();
  }
}
