/* ============================================================
   Procedural audio — no external sound files required.
   ============================================================ */
(function () {
  'use strict';
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.sfx = null;
      this.music = null;
      this.muted = false;
      this.mode = 'menu';
      this.step = 0;
      this.timer = null;
      this.noiseBuffer = null;
      this.musicOn = true;
    }
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.58;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = .7; this.sfx.connect(this.master);
      this.music = this.ctx.createGain(); this.music.gain.value = .18; this.music.connect(this.master);
      const len = this.ctx.sampleRate * 1.2;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.startMusic();
    }
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.setTargetAtTime(m ? 0 : .58, this.ctx.currentTime, .025);
      document.querySelectorAll('[id^="btn-sound"]').forEach(b => b.classList.toggle('muted', m));
      return m;
    }
    toggleMute() { if (!this.ctx) this.ensure(); return this.setMuted(!this.muted); }
    tone(freq, dur, type, gain, slideTo, when, dest) {
      if (!this.ctx || this.muted) return;
      const t = when == null ? this.ctx.currentTime : when;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(Math.max(20, freq), t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(.0001, gain || .08), t + .008);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(dest || this.sfx);
      o.start(t); o.stop(t + dur + .02);
    }
    noise(dur, gain, freq, q, when) {
      if (!this.ctx || this.muted) return;
      const t = when == null ? this.ctx.currentTime : when;
      const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuffer;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || .7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain || .06, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.sfx);
      s.start(t); s.stop(t + dur + .02);
    }
    ui() { this.tone(520, .06, 'triangle', .035, 760); }
    shoot(element) {
      const base = element === 'pyro' ? 330 : element === 'cryo' ? 620 : element === 'electro' ? 480 : element === 'geo' ? 180 : 410;
      this.tone(base, .075, 'sawtooth', .032, base * .42);
      this.noise(.055, .022, base * 3, 1.4);
    }
    enemyShoot() { this.tone(180, .12, 'square', .018, 100); }
    hit() { this.noise(.08, .03, 820, 1.2); this.tone(180, .06, 'triangle', .022, 120); }
    crit() { this.noise(.12, .045, 1900, .8); this.tone(880, .1, 'triangle', .026, 1320); }
    explode() { this.noise(.32, .075, 160, .5); this.tone(95, .3, 'sine', .055, 38); }
    hurt() { this.tone(120, .22, 'sawtooth', .045, 55); this.noise(.18, .045, 400, .7); }
    dash() { this.noise(.17, .035, 1600, 1.4); this.tone(240, .13, 'sine', .025, 520); }
    skill(element) {
      const f = element === 'pyro' ? 220 : element === 'hydro' ? 430 : element === 'cryo' ? 720 : element === 'electro' ? 560 : element === 'geo' ? 150 : element === 'dendro' ? 390 : 510;
      this.tone(f, .4, 'sine', .04, f * 1.8); this.noise(.26, .028, 700, .6);
      setTimeout(() => this.tone(f * 1.5, .3, 'triangle', .025, f * 2.2), 45);
    }
    burst() {
      this.tone(90, .8, 'sine', .07, 32); this.noise(.7, .08, 300, .5);
      [220, 330, 440, 660].forEach((f, i) => setTimeout(() => this.tone(f, .55, 'triangle', .032, f * 1.4), i * 55));
    }
    pickup() { this.tone(740, .06, 'sine', .028, 1100); setTimeout(() => this.tone(1100, .08, 'sine', .02, 1480), 55); }
    levelup() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, .22, 'triangle', .03), i * 70)); }
    wave() { this.tone(196, .28, 'sine', .045, 392); setTimeout(() => this.tone(294, .34, 'triangle', .035, 588), 120); }
    victory() { [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, .55, 'triangle', .042), i * 110)); }
    defeat() { [392, 349, 294, 220].forEach((f, i) => setTimeout(() => this.tone(f, .55, 'sine', .038, f * .8), i * 170)); }
    click() { this.ui(); }
    setMusicMode(mode) {
      if (this.mode === mode) return;
      this.mode = mode;
      this.step = 0;
    }
    startMusic() {
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.musicStep(), 250);
    }
    musicStep() {
      if (!this.ctx || this.muted || !this.musicOn) return;
      const s = this.step++;
      const scale = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99];
      if (this.mode === 'boss') {
        const bass = [146.83, 146.83, 174.61, 155.56];
        if (s % 4 === 0) this.tone(bass[(s / 4) % bass.length], .24, 'sawtooth', .015, null, null, this.music);
        if (s % 2 === 0) this.tone(scale[(s * 3) % scale.length] * .5, .2, 'triangle', .012, null, null, this.music);
        if (s % 4 === 2) this.noise(.1, .012, 220, .6);
      } else if (this.mode === 'battle') {
        const notes = [0, 2, 4, 3, 5, 4, 2, 1];
        if (s % 2 === 0) this.tone(scale[notes[(s / 2) % notes.length]], .34, 'triangle', .015, null, null, this.music);
        if (s % 8 === 0) this.tone(146.83, .8, 'sine', .018, null, null, this.music);
        if (s % 8 === 4) this.tone(220, .6, 'sine', .013, null, null, this.music);
      } else {
        if (s % 4 === 0) this.tone(scale[(s / 2) % scale.length] * .5, .7, 'sine', .012, null, null, this.music);
        if (s % 8 === 3) this.tone(scale[(s + 2) % scale.length], .5, 'triangle', .009, null, null, this.music);
      }
    }
  }
  window.audioEngine = new AudioEngine();
})();
