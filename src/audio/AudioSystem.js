// Audio architecture (Web Audio API).
//
//   master ─┬─ musicGain ── generative island loop (or a music file)
//           └─ sfxGain   ── one-shot sound effects
//
// Every sound has a NAME. By default each name is produced by a small synthesiser
// (placeholder audio). To use real recordings, register files in SOUND_FILES below
// (or call audio.registerFile(name, url)) – a decoded file always wins over the synth.
export const SOUND_FILES = {
  // jump: new URL('../../assets/audio/jump.mp3', import.meta.url).href,
  // star: …, magicStar: …, switch: …, land: …, victory: …, music: … (looped)
};
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class AudioSystem {
  constructor(settings) { this.settings = settings; this.ctx = null; this.buffers = {}; this.files = { ...SOUND_FILES }; this.musicOn = false; this._step = 0; this._next = 0; this._timer = null; this.combo = 0; this.comboT = 0; }
  registerFile(name, url) { this.files[name] = url; if (this.ctx) this._loadFile(name, url); }
  /** Must be called from a user gesture (browser autoplay rules). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC(); const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.musicGain = c.createGain(); this.sfxGain = c.createGain(); this.musicGain.connect(this.master); this.sfxGain.connect(this.master);
    this.applySettings();
    for (const [n, u] of Object.entries(this.files)) this._loadFile(n, u);
  }
  async _loadFile(name, url) { try { const r = await fetch(url); this.buffers[name] = await this.ctx.decodeAudioData(await r.arrayBuffer()); if (name === 'music' && this.musicOn) { this.stopMusic(); this.startMusic(); } } catch (e) { console.warn('[audio] could not load', name, e); } }
  applySettings() { if (!this.ctx) return; const t = this.ctx.currentTime; this.musicGain.gain.setTargetAtTime(this.settings.music ? (this.ducked ? 0.1 : 0.34) : 0, t, 0.08); this.sfxGain.gain.setTargetAtTime(this.settings.sfx ? 0.8 : 0, t, 0.03); }
  duck(v) { this.ducked = v; this.applySettings(); }

  // ---- synth building blocks ----
  _tone(dest, { f = 440, f2 = null, t = 0, dur = 0.2, type = 'sine', gain = 0.3, attack = 0.005 }) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  _noise(dest, { t = 0, dur = 0.2, gain = 0.3, f = 1200, f2 = null, q = 0.8, type = 'lowpass' }) {
    const c = this.ctx, n = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime + t; s.buffer = buf; fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t0); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t0);
  }
  // ---- sound effects ----
  play(name, opt = {}) {
    if (!this.ctx || !this.settings.sfx) return;
    if (this.buffers[name]) { const s = this.ctx.createBufferSource(); s.buffer = this.buffers[name]; s.playbackRate.value = opt.rate || 1; s.connect(this.sfxGain); s.start(); return; }
    const d = this.sfxGain, T = (o) => this._tone(d, o), N = (o) => this._noise(d, o);
    switch (name) {
      case 'jump': T({ f: 330, f2: 640, dur: 0.16, type: 'triangle', gain: 0.32 }); break;
      case 'doubleJump': T({ f: 520, f2: 980, dur: 0.14, type: 'triangle', gain: 0.28 }); T({ f: 1040, f2: 1500, t: 0.05, dur: 0.12, gain: 0.12 }); break;
      case 'land': N({ dur: 0.12, gain: 0.3 * (opt.strength ?? 1), f: 500, f2: 120 }); T({ f: 120, f2: 70, dur: 0.1, gain: 0.25 * (opt.strength ?? 1) }); break;
      case 'star': { const now = performance.now(); this.combo = now - this.comboT < 900 ? Math.min(this.combo + 1, 7) : 0; this.comboT = now;
        const n = 84 + [0, 2, 4, 7, 9, 12, 14, 16][this.combo]; T({ f: NOTE(n), dur: 0.22, gain: 0.26 }); T({ f: NOTE(n + 7), t: 0.06, dur: 0.3, gain: 0.2 }); break; }
      case 'magicStar': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => T({ f: NOTE(72 + s), t: i * 0.07, dur: 0.5, gain: 0.22, type: 'triangle' })); break;
      case 'switch': T({ f: 660, f2: 880, dur: 0.09, type: 'square', gain: 0.1 }); T({ f: 990, f2: 1320, t: 0.08, dur: 0.12, type: 'square', gain: 0.1 }); break;
      case 'bounce': T({ f: 180, f2: 720, dur: 0.24, type: 'sine', gain: 0.38 }); break;
      case 'bonk': T({ f: 300, f2: 140, dur: 0.18, type: 'triangle', gain: 0.38 }); N({ dur: 0.06, gain: 0.25, f: 900 }); break;
      case 'bump': T({ f: 400, f2: 300, dur: 0.1, type: 'triangle', gain: 0.2 }); break;
      case 'splash': N({ dur: 0.5, gain: 0.45, f: 2600, f2: 300, q: 0.6 }); N({ t: 0.05, dur: 0.3, gain: 0.2, f: 5000, type: 'highpass' }); break;
      case 'checkpoint': [0, 7, 12].forEach((s, i) => T({ f: NOTE(76 + s), t: i * 0.09, dur: 0.3, gain: 0.2 })); break;
      case 'click': T({ f: 700, f2: 900, dur: 0.06, type: 'triangle', gain: 0.14 }); break;
      // ---- winter edition ----
      case 'footprint': [0, 5, 9, 12].forEach((k, i) => T({ f: NOTE(81 + k), t: i * 0.06, dur: 0.35, gain: 0.18, type: 'sine' })); T({ f: NOTE(105), t: 0.24, dur: 0.6, gain: 0.06 }); break;
      case 'iceLand': T({ f: 2100, f2: 1500, dur: 0.18, gain: 0.12 * (opt.strength ?? 1) }); T({ f: 3150, f2: 2600, t: 0.02, dur: 0.22, gain: 0.07 }); N({ dur: 0.08, gain: 0.12 * (opt.strength ?? 1), f: 3000, type: 'highpass' }); break;
      case 'iceSlide': N({ dur: 0.24, gain: 0.05 * (opt.strength ?? 1), f: 4200, f2: 2600, q: 1.5, type: 'bandpass' }); break;
      case 'penguin': { const b = 900 + Math.random() * 300; T({ f: b, f2: b * 1.6, dur: 0.09, type: 'square', gain: 0.035 }); T({ f: b * 1.1, f2: b * 1.8, t: 0.12, dur: 0.1, type: 'square', gain: 0.03 }); break; }
      case 'seal': T({ f: 260, f2: 200, dur: 0.16, type: 'sawtooth', gain: 0.05 }); T({ f: 300, f2: 220, t: 0.22, dur: 0.16, type: 'sawtooth', gain: 0.045 }); break;
      case 'castle': [[67, 0], [71, 0.16], [74, 0.32], [79, 0.48], [83, 0.66], [86, 0.84], [91, 1.05]].forEach(([n, t]) => { T({ f: NOTE(n), t, dur: n === 91 ? 1.6 : 0.5, gain: 0.2, type: 'triangle' }); T({ f: NOTE(n + 12), t: t + 0.02, dur: 0.6, gain: 0.05 }); });
        [55, 62, 67].forEach((n) => T({ f: NOTE(n), t: 1.05, dur: 2.2, gain: 0.12, attack: 0.1 })); break;
      case 'rewardFanfare': [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [88, 0.6], [91, 0.84], [96, 1.1]].forEach(([n, t]) => { T({ f: NOTE(n), t, dur: 0.7, gain: 0.18, type: 'triangle' }); T({ f: NOTE(n) * 2, t, dur: 0.25, gain: 0.04 }); });
        [60, 64, 67, 72].forEach((n) => T({ f: NOTE(n), t: 1.1, dur: 2.6, gain: 0.09, attack: 0.15 })); break;
      case 'victory': [[72, 0], [76, 0.14], [79, 0.28], [84, 0.42], [79, 0.62], [84, 0.76], [88, 0.92]].forEach(([n, t]) => { T({ f: NOTE(n), t, dur: n === 88 ? 0.9 : 0.24, gain: 0.26, type: 'triangle' }); T({ f: NOTE(n - 12), t, dur: 0.3, gain: 0.12 }); }); break;
    }
  }
  // ---- music: a small generative ukulele-and-marimba loop ----
  startMusic() {
    if (!this.ctx || this.musicOn) return; this.musicOn = true;
    if (this.buffers.music) { const s = this.ctx.createBufferSource(); s.buffer = this.buffers.music; s.loop = true; s.connect(this.musicGain); s.start(); this._musicSrc = s; return; }
    this._next = this.ctx.currentTime + 0.1; this._step = 0;
    this._timer = setInterval(() => this._schedule(), 60);
  }
  /** Soft winter wind / falling-snow bed (part of the sound-effects bus, so the SFX switch turns it off too). */
  startAmbience() {
    if (!this.ctx || this._amb) return; const c = this.ctx, n = c.sampleRate * 4, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    let b = 0; for (let i = 0; i < n; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); d[i] = b * 3; }       // brown-ish noise
    const src = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    src.buffer = buf; src.loop = true; lp.type = 'lowpass'; lp.frequency.value = 700; g.gain.value = 0.12;
    lfo.frequency.value = 0.07; lg.gain.value = 350; lfo.connect(lg); lg.connect(lp.frequency);
    src.connect(lp); lp.connect(g); g.connect(this.sfxGain); src.start(); lfo.start(); this._amb = { src, g };
  }
  stopMusic() { this.musicOn = false; clearInterval(this._timer); if (this._musicSrc) { try { this._musicSrc.stop(); } catch {} this._musicSrc = null; } }
  _schedule() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const BEAT = 60 / 92 / 2;                              // eighth notes at 92 bpm – a gentle winter waltz-ish feel
    const CH = [[62, 66, 69, 74], [59, 62, 66, 71], [55, 59, 62, 67], [57, 61, 64, 69]];   // D  Bm  G  A
    const MEL = [78, -1, 81, 78, 74, -1, 76, 78, 74, -1, 71, 74, 78, -1, 76, 74, 71, -1, 74, 79, 78, -1, 76, 74, 76, -1, 73, 76, 81, -1, -1, -1,
                 78, 81, 86, 81, 78, -1, 81, 83, 83, -1, 78, 74, 71, -1, 74, 78, 79, -1, 83, 79, 76, -1, 79, 83, 81, -1, 85, 81, 86, -1, -1, -1];
    while (this._next < c.currentTime + 0.25) {
      const s = this._step, t = this._next - c.currentTime, bar = Math.floor(s / 8) % 4, ch = CH[bar], e = s % 8, d = this.musicGain;
      if (e === 0) this._tone(d, { f: NOTE(ch[0] - 24), t, dur: BEAT * 3.6, gain: 0.3, type: 'sine', attack: 0.02 });
      if (e === 4) this._tone(d, { f: NOTE(ch[1] - 24 + 7 - 4), t, dur: BEAT * 1.8, gain: 0.2, type: 'sine', attack: 0.02 });
      if ([0, 3, 6].includes(e)) ch.forEach((n, i) => { this._tone(d, { f: NOTE(n + 12), t: t + i * 0.03, dur: 0.6, gain: e === 0 ? 0.05 : 0.035, type: 'sine' }); this._tone(d, { f: NOTE(n + 12) * 2.76, t: t + i * 0.03, dur: 0.25, gain: 0.008 }); });   // music-box bells
      const m = MEL[s % MEL.length]; if (m > 0) { this._tone(d, { f: NOTE(m), t, dur: 0.55, gain: 0.13, type: 'sine' }); this._tone(d, { f: NOTE(m) * 3, t, dur: 0.12, gain: 0.025, type: 'sine' }); }   // celesta
      if (e % 2 === 1) { this._noise(d, { t, dur: 0.05, gain: 0.022, f: 8000, type: 'highpass' }); this._noise(d, { t: t + 0.03, dur: 0.04, gain: 0.014, f: 9000, type: 'highpass' }); }   // sleigh bells
      this._next += BEAT; this._step++;
    }
  }
}
