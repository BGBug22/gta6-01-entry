// HUD — semua elemen layar: health, armour, respect, wanted stars, uang,
// senjata, objektif misi + jarak + timer, jam kota, dialog, distrik, radio,
// kecepatan + nama mobil, pesan tengah, prompt tombol, layar start / pause / misi.
import { wantedLabel } from './wanted-level.js';

export class Hud {
  constructor() {
    this.el = {};
    for (const id of ['health-fill', 'health-num', 'armour-fill', 'armour-num',
      'money', 'weapon-line', 'respect-line', 'respect-fill',
      'stars', 'wanted-label', 'clock', 'district',
      'objective', 'obj-title', 'obj-text', 'distance', 'timer', 'dialogue',      'speed', 'speed-num', 'speed-unit', 'car-name', 'radio',
      'message', 'prompt', 'crosshair', 'shop', 'shop-title', 'shop-money', 'shop-items', 'shop-hint',
      'screen', 'screen-title', 'screen-text', 'screen-btn', 'controls', 'minimap-wrap',
      'mission-card', 'stage-row', 'stage-text', 'stage-bar', 'stage-fill', 'next-line',
      'police-panel', 'police-list', 'police-head',
      'dialog-card', 'portrait', 'dialog-name', 'condition-fill', 'condition-num', 'minimap-label']) {
      this.el[id] = document.getElementById(id);
    }
    this.messageTimer = 0;
    this.onShopBuy = null; // (index) => dipanggil saat item toko diklik / tombol 1-3
  }
  setHealth(h) {
    this.el['health-fill'].style.width = `${Math.max(0, h)}%`;
    this.el['health-fill'].style.background = h > 50 ? '#7ee081' : h > 25 ? '#ffd23f' : '#ff5d5d';
    this.el['health-num'].textContent = Math.ceil(Math.max(0, h));
  }
  setArmour(a, max = 100) {
    this.el['armour-fill'].style.width = `${Math.max(0, Math.min(100, (a / max) * 100))}%`;
    this.el['armour-num'].textContent = Math.ceil(Math.max(0, a));
  }
  setMoney(m) { this.el.money.textContent = `$${m.toLocaleString('en-US')}`; }
  setWanted(n) {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < n ? '★' : '☆';
    this.el.stars.textContent = s;
    this.el.stars.style.color = n >= 3 ? '#ff5d5d' : '#ffd23f';
    this.el.stars.style.textShadow = n > 0 ? '0 0 12px rgba(255,93,93,.9)' : 'none';
    this.el['wanted-label'].textContent = wantedLabel(n);
  }
  setRespect(level) {
    this.el['respect-line'].textContent = `RESPECT LV ${level}`;
    this.el['respect-fill'].style.width = `${(level / 5) * 100}%`;
  }
  setWeapon(text) { this.el['weapon-line'].textContent = text; }
  setObjective(title, text) {
    this.el['obj-title'].textContent = title || 'VELAMAR';
    this.el['obj-text'].textContent = text || 'Tekan M untuk misi berikutnya.';
  }
  setDistance(m) {
    if (m === null || m === undefined) { this.el.distance.style.display = 'none'; return; }
    this.el.distance.style.display = 'block';
    this.el.distance.textContent = `📍 ${Math.round(m)}m ke tujuan`;
  }
  setTimer(sec) {
    this._timerOn = sec > 0;
    const row = this.el['stage-row'];
    if (sec > 0) {
      const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      this.el.timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      this.el.timer.style.display = 'inline';
      if (row) row.style.display = 'flex';
    } else {
      this.el.timer.style.display = 'none';
      if (row && !this._stageOn) row.style.display = 'none';
    }
  }
  setClock(day, hh, mm) {
    this.el.clock.textContent = `DAY ${day} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  setDialog(giver, line) {
    if (!giver || !line) {
      this.el.dialogue.style.display = 'none';
      if (this.el['dialog-card']) this.el['dialog-card'].style.display = 'none';
      return;
    }
    this.el.dialogue.style.display = 'block';
    this.el.dialogue.textContent = line;
    if (this.el['dialog-name']) this.el['dialog-name'].textContent = giver;
    if (this.el['dialog-card']) this.el['dialog-card'].style.display = 'flex';
    if (this.el.portrait) drawPortrait(this.el.portrait, giver);
  }
  // Panel respons polisi (pola juara): unit bernama + jarak + taktik.
  setPolice(units) {
    const panel = this.el['police-panel'];
    const list = this.el['police-list'];
    if (!panel || !list) return;
    if (!units || units.length === 0) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    const colors = { RAMMING: '#ff5d5d', 'BOXING IN': '#ff9a3d', PURSUIT: '#ffd23f', SEARCHLIGHT: '#4cc9f0', ROADBLOCK: '#f72585' };
    list.innerHTML = '';
    for (const u of units) {
      const row = document.createElement('div');
      row.className = 'police-row';
      const icon = document.createElement('span');
      icon.className = 'police-icon';
      icon.textContent = u.heli ? '🚁' : '🚓';
      const name = document.createElement('span');
      name.className = 'police-name';
      name.textContent = u.name;
      const dist = document.createElement('span');
      dist.className = 'police-dist';
      dist.textContent = `${u.dist} m`;
      const tactic = document.createElement('span');
      tactic.className = 'police-tactic';
      tactic.textContent = u.tactic;
      tactic.style.background = colors[u.tactic] || '#8fa3b8';
      tactic.style.color = u.tactic === 'PURSUIT' ? '#12233d' : '#fff';
      row.appendChild(icon);
      row.appendChild(name);
      row.appendChild(dist);
      row.appendChild(tactic);
      list.appendChild(row);
    }
  }
  // Tahap misi + langkah berikutnya (kartu misi). null = sembunyikan baris.
  // Baris stage/timer dimiliki bersama setTimer: baris tampil kalau ada
  // tahap ATAU ada timer yang berjalan.
  setStage(stage, next) {
    const row = this.el['stage-row'];
    if (!row) return;
    this._stageOn = !!stage;
    if (!stage) {
      this.el['stage-text'].style.display = 'none';
      this.el['stage-bar'].style.display = 'none';
      if (this.el['next-line']) this.el['next-line'].style.display = 'none';
      if (!this._timerOn) row.style.display = 'none';
      return;
    }
    row.style.display = 'flex';
    this.el['stage-text'].style.display = 'inline';
    this.el['stage-bar'].style.display = 'block';
    this.el['stage-text'].textContent = stage;
    const m = /(\d+)\/(\d+)/.exec(stage);
    if (m) this.el['stage-fill'].style.width = `${(Number(m[1]) / Number(m[2])) * 100}%`;
    if (this.el['next-line']) {
      this.el['next-line'].textContent = next || '';
      this.el['next-line'].style.display = next ? 'block' : 'none';
    }
  }
  // Kondisi mobil (0–100%) — turun saat ditabrak polisi / lalu lintas.
  setCondition(pct) {
    if (!this.el['condition-fill']) return;
    const v = Math.max(0, Math.min(100, Math.round(pct)));
    this.el['condition-fill'].style.width = `${v}%`;
    this.el['condition-fill'].style.background = v > 60 ? '#7ee081' : v > 30 ? '#ffd23f' : '#ff5d5d';
    if (this.el['condition-num']) this.el['condition-num'].textContent = `${v}%`;
  }
  setDistrict(name) {
    this.el.district.textContent = `📍 ${name}`;
    if (this.el['minimap-label']) this.el['minimap-label'].textContent = name;
  }
  setRadio(text) { this.el.radio.textContent = text; }
  setSpeed(kmh, inCar) {
    this.el.speed.style.display = inCar ? 'block' : 'none';
    if (inCar) this.el['speed-num'].textContent = Math.round(kmh);
  }
  setCarName(name) {
    this.el['car-name'].textContent = name || '';
    this.el['car-name'].style.display = name ? 'block' : 'none';
  }
  showMessage(text, dur = 3) {
    this.el.message.textContent = text;
    this.el.message.style.opacity = '1';
    this.messageTimer = dur;
  }
  showPrompt(text) {
    if (text) { this.el.prompt.textContent = text; this.el.prompt.style.display = 'block'; }
    else this.el.prompt.style.display = 'none';
  }
  setCrosshair(on) { this.el.crosshair.style.display = on ? 'block' : 'none'; }
  // Menu beli — panel toko / garasi. items: [{name, price, note, disabled}].
  showShop(title, items, money, onBuy) {
    this.el['shop-title'].textContent = title;
    this.el['shop-money'].textContent = `Uangmu: $${money.toLocaleString('en-US')}`;
    this.onShopBuy = onBuy;
    const box = this.el['shop-items'];
    box.innerHTML = '';
    items.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'shop-item' + (it.disabled ? ' disabled' : '');
      const label = document.createElement('span');
      label.textContent = `${i + 1}. ${it.name}${it.note ? ` — ${it.note}` : ''}`;
      const price = document.createElement('span');
      price.className = 'price';
      price.textContent = `$${it.price}`;
      row.appendChild(label);
      row.appendChild(price);
      if (!it.disabled) row.onclick = () => { if (this.onShopBuy) this.onShopBuy(i); };
      box.appendChild(row);
    });
    this.el.shop.style.display = 'block';
  }
  setShopMoney(m) { this.el['shop-money'].textContent = `Uangmu: $${m.toLocaleString('en-US')}`; }
  hideShop() { this.el.shop.style.display = 'none'; this.onShopBuy = null; }
  shopVisible() { return this.el.shop.style.display === 'block'; }
  update(dt) {
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.el.message.style.opacity = '0';
    }
  }
  // Layar penuh: start, pause, misi selesai/gagal, wasted/busted, menang total.
  showScreen(title, text, btnText, onBtn) {
    this.el['screen-title'].textContent = title;
    this.el['screen-text'].innerHTML = text;
    this.el['screen-btn'].textContent = btnText;
    this.el.screen.style.display = 'flex';
    this.el['screen-btn'].onclick = () => { this.hideScreen(); onBtn && onBtn(); };
  }
  hideScreen() { this.el.screen.style.display = 'none'; }
  screenVisible() { return this.el.screen.style.display === 'flex'; }
}

// Potret karakter dialog — digambar datar (flat) di canvas 72×72, deterministik.
// MARA: rambut panjang gelap + kacamata hitam. RICO: topi + jenggot.
export function drawPortrait(canvas, giver) {
  const g = canvas.getContext('2d');
  const S = canvas.width;
  g.clearRect(0, 0, S, S);
  if (giver === 'MARA') {
    g.fillStyle = '#7a2d6d'; g.fillRect(0, 0, S, S);
    g.fillStyle = '#2a1512'; // rambut panjang
    g.fillRect(8, 6, 14, 60);
    g.fillRect(50, 6, 14, 60);
    g.fillRect(8, 6, 56, 16);
    g.fillStyle = '#e8b98a'; // wajah
    g.beginPath(); g.arc(36, 34, 17, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1512'; // alis + rambut depan
    g.fillRect(22, 24, 28, 5);
    g.fillStyle = '#1a1a2e'; // kacamata hitam
    g.fillRect(21, 30, 13, 8);
    g.fillRect(38, 30, 13, 8);
    g.fillRect(34, 32, 4, 3);
    g.fillStyle = '#e63946'; // bibir
    g.fillRect(30, 46, 12, 3);
    g.fillStyle = '#ffd23f'; // baju
    g.fillRect(14, 58, 44, 14);
  } else {
    g.fillStyle = '#1b3a5c'; g.fillRect(0, 0, S, S);
    g.fillStyle = '#c68642'; // wajah
    g.beginPath(); g.arc(36, 36, 17, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1a12'; // jenggot
    g.beginPath(); g.arc(36, 44, 13, 0, Math.PI); g.fill();
    g.fillStyle = '#e63946'; // topi merah
    g.beginPath(); g.arc(36, 26, 17, Math.PI, 0); g.fill();
    g.fillRect(17, 24, 38, 6);
    g.fillStyle = '#1a1a2e'; // kacamata hitam
    g.fillRect(21, 32, 13, 8);
    g.fillRect(38, 32, 13, 8);
    g.fillRect(34, 34, 4, 3);
    g.fillStyle = '#2a9d8f'; // baju
    g.fillRect(14, 58, 44, 14);
  }
}
