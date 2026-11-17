// HUD — semua elemen layar: health, wanted stars, uang, objektif misi, timer,
// kecepatan, pesan tengah, prompt tombol, layar start / pause / misi / kalah.
export class Hud {
  constructor() {
    this.el = {};
    for (const id of ['health-fill', 'health-num', 'money', 'stars', 'objective', 'obj-title',
      'obj-text', 'timer', 'speed', 'speed-num', 'message', 'prompt', 'crosshair',
      'screen', 'screen-title', 'screen-text', 'screen-btn', 'controls', 'minimap-wrap']) {
      this.el[id] = document.getElementById(id);
    }
    this.messageTimer = 0;
  }
  setHealth(h) {
    this.el['health-fill'].style.width = `${Math.max(0, h)}%`;
    this.el['health-fill'].style.background = h > 50 ? '#7ee081' : h > 25 ? '#ffd23f' : '#ff5d5d';
    this.el['health-num'].textContent = Math.ceil(Math.max(0, h));
  }
  setMoney(m) { this.el.money.textContent = `$${m.toLocaleString('en-US')}`; }
  setWanted(n) {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < n ? '★' : '☆';
    this.el.stars.textContent = s;
    this.el.stars.style.color = n >= 3 ? '#ff5d5d' : '#ffd23f';
    this.el.stars.style.textShadow = n > 0 ? '0 0 12px rgba(255,93,93,.9)' : 'none';
  }
  setObjective(title, text) {
    this.el['obj-title'].textContent = title || 'VELAMAR';
    this.el['obj-text'].textContent = text || 'Tekan M untuk misi berikutnya.';
  }
  setTimer(sec) {
    if (sec > 0) {
      const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      this.el.timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      this.el.timer.style.display = 'block';
    } else this.el.timer.style.display = 'none';
  }
  setSpeed(kmh, inCar) {
    this.el.speed.style.display = inCar ? 'block' : 'none';
    if (inCar) this.el['speed-num'].textContent = Math.round(kmh);
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
