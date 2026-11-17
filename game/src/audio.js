// Suara sintetis WebAudio — tanpa file audio sama sekali.
// Mesin (osilator), sirene polisi, tembakan, pukulan, koin misi, klakson.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.engineOsc = null; this.engineGain = null;
    this.sirenOsc = null; this.sirenGain = null; this.sirenTimer = 0;
    this.enabled = true;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth'; this.engineOsc.frequency.value = 40;
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineGain).connect(this.ctx.destination);
      this.engineOsc.start();
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sine'; this.sirenOsc.frequency.value = 700;
      this.sirenGain = this.ctx.createGain(); this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain).connect(this.ctx.destination);
      this.sirenOsc.start();
    } catch { this.ctx = null; }
  }
  setEngine(speed01) {
    if (!this.ctx) return;
    this.engineGain.gain.value = speed01 > 0.02 ? 0.03 + speed01 * 0.05 : 0;
    this.engineOsc.frequency.value = 45 + speed01 * 130;
  }
  setSiren(on, dt) {
    if (!this.ctx) return;
    this.sirenTimer += dt;
    if (on) {
      this.sirenGain.gain.value = 0.035;
      this.sirenOsc.frequency.value = (Math.floor(this.sirenTimer * 1.6) % 2 === 0) ? 720 : 980;
    } else this.sirenGain.gain.value = 0;
  }
  blip(freq, dur, type = 'square', vol = 0.08) {
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch { /* abaikan */ }
  }
  shot() { this.blip(180, 0.12, 'sawtooth', 0.14); this.blip(90, 0.18, 'square', 0.1); }
  punch() { this.blip(120, 0.08, 'square', 0.12); }
  coin() { this.blip(880, 0.1, 'sine', 0.09); setTimeout(() => this.blip(1320, 0.16, 'sine', 0.09), 90); }
  horn() { this.blip(370, 0.25, 'square', 0.07); }
  fail() { this.blip(220, 0.3, 'sawtooth', 0.1); setTimeout(() => this.blip(160, 0.4, 'sawtooth', 0.1), 150); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'sine', 0.1), i * 110)); }
}
