// Synthetic WebAudio sound — no audio files at all.
// Engine (oscillator), police siren, gunshots, punches, mission coins, horn,
// plus 3 generative radio stations (no audio files, no network):
//   95.4 SOL FM — synthwave arpeggio (sawtooth bass + square lead)
//   101.2 VELA WAVE — chillwave pads (soft sine, major-7th)
//   88.7 NIGHTWIRE — night drive (slow dark bass pulse + sparse lead)
import { RADIO } from './config.js';

// Note patterns per station: [lead notes (Hz), bass notes (Hz), step ms, lead wave, bass wave]
const STATIONS = [
  { lead: [220, 261.6, 329.6, 440, 329.6, 261.6, 220, 196], bass: [110, 110, 130.8, 164.8], step: 190, leadWave: 'square', bassWave: 'sawtooth', vol: 0.035 },
  { lead: [261.6, 329.6, 392, 493.9, 392, 329.6, 261.6, 220], bass: [130.8, 164.8, 196, 246.9], step: 320, leadWave: 'sine', bassWave: 'sine', vol: 0.03 },
  { lead: [146.8, 174.6, 220, 261.6, 220, 174.6, 146.8, 130.8], bass: [73.4, 73.4, 87.3, 110], step: 260, leadWave: 'triangle', bassWave: 'sawtooth', vol: 0.032 },
];

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.engineOsc = null; this.engineGain = null;
    this.sirenOsc = null; this.sirenGain = null; this.sirenTimer = 0;
    this.enabled = true;
    this.radioStation = 0;
    this.radioTimer = null;
    this.radioStep = 0;
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
    } catch { /* ignore */ }
  }
  shot() { this.blip(180, 0.12, 'sawtooth', 0.14); this.blip(90, 0.18, 'square', 0.1); }
  punch() { this.blip(120, 0.08, 'square', 0.12); }
  coin() { this.blip(880, 0.1, 'sine', 0.09); setTimeout(() => this.blip(1320, 0.16, 'sine', 0.09), 90); }
  horn() { this.blip(370, 0.25, 'square', 0.07); }
  fail() { this.blip(220, 0.3, 'sawtooth', 0.1); setTimeout(() => this.blip(160, 0.4, 'sawtooth', 0.1), 150); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'sine', 0.1), i * 110)); }
  // --- Radio: generative station loop (setInterval steps through the motif) ---
  radioLabel() {
    const r = RADIO[this.radioStation];
    return `🎵 ${r.name} ${r.freq} — ${r.style}`;
  }
  startRadio() {
    this.stopRadio();
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const st = STATIONS[this.radioStation];
    this.radioStep = 0;
    this.radioTimer = setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      const i = this.radioStep;
      const lead = st.lead[i % st.lead.length];
      this.blip(lead, st.step / 1000 * 0.9, st.leadWave, st.vol);
      if (i % 4 === 0) this.blip(st.bass[(i / 4) % st.bass.length], st.step / 1000 * 3.2, st.bassWave, st.vol * 1.2);
      this.radioStep += 1;
    }, st.step);
  }
  setStation(i) {
    this.radioStation = ((i % RADIO.length) + RADIO.length) % RADIO.length;
    this.startRadio();
    return this.radioLabel();
  }
  cycleStation() { return this.setStation(this.radioStation + 1); }
  stopRadio() {
    if (this.radioTimer) { clearInterval(this.radioTimer); this.radioTimer = null; }
  }
}
