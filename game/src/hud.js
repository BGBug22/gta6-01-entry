// HUD — semua elemen layar: health, armour, wanted stars, uang, senjata+ammo,
// respect level, objektif misi, jarak tujuan, jam hari, dialog, radio, kecepatan,
// pesan tengah, prompt tombol, layar start / pause / misi / kalah.
import { wantedStars, wantedLabelFor } from './wanted-level.js';

export class Hud {
  constructor() {
    this.el = {};
    for (const id of ['health-fill', 'health-num', 'armour-fill', 'armour-num', 'money',
      'weapon-line', 'respect-line', 'respect-fill', 'district', 'clock', 'stars',
      'wanted-label', 'district-label', 'objective', 'obj-title', 'obj-text', 'distance',
      'timer', 'speed', 'speed-num', 'car-name', 'message', 'dialogue', 'radio', 'prompt',
      'crosshair', 'screen', 'screen-title', 'screen-text', 'screen-btn', 'controls',
      'minimap-wrap']) {
      this.el[id] = document.getElementById(id);
    }
    this.messageTimer = 0;
  }
  setHealth(h) {
    this.el['health-fill'].style.width = `${Math.max(0, h)}%`;
    this.el['health-fill'].style.background = h > 50 ? '#7ee081' : h > 25 ? '#ffd23f' : '#ff5d5d';
    this.el['health-num'].textContent = Math.ceil(Math.max(0, h));
  }
  setArmour(a) {
    this.el['armour-fill'].style.width = `${Math.max(0, Math.min(100, a))}%`;
    this.el['armour-num'].textContent = `ARMOUR ${Math.ceil(Math.max(0, a))}`;
  }
  setRespect(lv, pct) {
    this.el['respect-line'].textContent = `RESPECT LV ${lv}`;
    this.el['respect-fill'].style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }
  setWeaponLabel(text) { this.el['weapon-line'].textContent = text; }
  setClock(day, hh, mm) {
    this.el.clock.textContent = `DAY ${day} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  setDistrict(name) {
    this.el.district.textContent = name;
    this.el['district-label'].textContent = name;
  }
  setMoney(m) { this.el.money.textContent = `$${m.toLocaleString('en-US')}`; }
  setWanted(n) {
    this.el.stars.textContent = wantedStars(n);
    this.el.stars.style.color = n >= 3 ? '#ff5d5d' : '#ffd23f';
    this.el.stars.style.textShadow = n > 0 ? '0 0 12px rgba(255,93,93,.9)' : 'none';
    this.el['wanted-label'].textContent = `WANTED LEVEL • ${wantedLabelFor(n)}`;
  }
  setObjective(title, text) {
    this.el['obj-title'].textContent = title || 'VELAMAR';
    this.el['obj-text'].textContent = text || 'Tekan M untuk misi berikutnya.';
  }
  setDistance(text) { this.el.distance.textContent = text || ''; }
  setDialogue(html) {
    if (html) { this.el.dialogue.innerHTML = html; this.el.dialogue.style.display = 'block'; }
    else this.el.dialogue.style.display = 'none';
  }
  setTimer(sec) {
    if (sec > 0) {
      const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      this.el.timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      this.el.timer.style.display = 'block';
    } else this.el.timer.style.display = 'none';
  }
  setSpeed(kmh, inCar, carName) {
    this.el.speed.style.display = inCar ? 'block' : 'none';
    if (inCar) {
      this.el['speed-num'].textContent = Math.round(kmh);
      this.el['car-name'].textContent = carName || '';
    }
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
