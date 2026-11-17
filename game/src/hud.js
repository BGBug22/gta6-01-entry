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
      'objective', 'obj-title', 'obj-text', 'distance', 'timer', 'dialogue',
      'speed', 'speed-num', 'speed-unit', 'car-name', 'radio',
      'message', 'prompt', 'crosshair', 'shop', 'shop-title', 'shop-money', 'shop-items', 'shop-hint',
      'screen', 'screen-title', 'screen-text', 'screen-btn', 'controls', 'minimap-wrap']) {
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
    if (sec > 0) {
      const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      this.el.timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      this.el.timer.style.display = 'block';
    } else this.el.timer.style.display = 'none';
  }
  setClock(day, hh, mm) {
    this.el.clock.textContent = `DAY ${day} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  setDialog(giver, line) {
    if (!giver || !line) { this.el.dialogue.style.display = 'none'; return; }
    this.el.dialogue.style.display = 'block';
    this.el.dialogue.textContent = `${giver}: ${line}`;
  }
  setDistrict(name) { this.el.district.textContent = `📍 ${name}`; }
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
