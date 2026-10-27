
/* =========================================================================
   Audio — every sound is synthesized with WebAudio
   ========================================================================= */
const AU = {
  ctx: null, master: null, sfx: null, music: null, amb: null, rev: null, revIn: null, noise: null, brown: null, ok: false,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = SETTINGS.volume * HUB.vol;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.connect(this.master);
    this.music = ctx.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    this.amb = ctx.createGain(); this.amb.gain.value = 0.8; this.amb.connect(this.master);
    // reverb
    this.rev = ctx.createConvolver(); this.rev.buffer = this.impulse(2.4, 2.6);
    this.revIn = ctx.createGain(); this.revIn.gain.value = 0.35;
    const revOut = ctx.createGain(); revOut.gain.value = 0.55;
    this.revIn.connect(this.rev); this.rev.connect(revOut); revOut.connect(this.master);
    // noise buffers
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const b = this.brown.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = last * 3.5; }
    this.ok = true;
  },
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume(); },
  setVolume(v) { if (this.master) this.master.gain.value = v; },
  impulse(sec, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  },
  get t() { return this.ctx.currentTime; },
  // --- building blocks ---
  pan(pos) {
    const p = this.ctx.createPanner();
    p.panningModel = SETTINGS.quality === 'low' ? 'equalpower' : 'HRTF';
    p.distanceModel = 'inverse'; p.refDistance = 1.8; p.rolloffFactor = 1.25; p.maxDistance = 80;
    if (pos) this.setPannerPos(p, pos);
    return p;
  },
  setPannerPos(p, v) {
    if (p.positionX) { p.positionX.value = v.x; p.positionY.value = v.y; p.positionZ.value = v.z; } else p.setPosition(v.x, v.y, v.z);
  },
  out(pos, rev = 0.3, bus = null) { // returns node to connect sources to
    const g = this.ctx.createGain();
    let tail = g;
    if (pos) { const p = this.pan(pos); g.connect(p); tail = p; }
    tail.connect(bus || this.sfx);
    if (rev > 0) { const s = this.ctx.createGain(); s.gain.value = rev; tail.connect(s); s.connect(this.revIn); }
    return g;
  },
  noiseSrc(brown = false, loop = true) {
    const s = this.ctx.createBufferSource(); s.buffer = brown ? this.brown : this.noise; s.loop = loop;
    s.playbackRate.value = 1; s.loopStart = Math.random(); return s;
  },
  osc(type, freq) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o; },
  filt(type, freq, q = 1) { const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; },
  gain(v = 1) { const g = this.ctx.createGain(); g.gain.value = v; return g; },
  shaper(amount = 20) {
    const ws = this.ctx.createWaveShaper(), n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = (1 + amount) * x / (1 + amount * Math.abs(x)); }
    ws.curve = c; return ws;
  },
  env(g, t0, a, hold, rel, peak = 1) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.setValueAtTime(peak, t0 + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel);
  },
  // one-shot noise burst through a filter
  burst({ pos = null, t0 = 0, dur = 0.1, a = 0.002, hold = 0, f = 1000, q = 1, type = 'bandpass', vol = 0.5, rev = 0.2, brown = false, sweepTo = null, bus = null }) {
    if (!this.ok) return;
    const t = (t0 || this.t), s = this.noiseSrc(brown, true), fl = this.filt(type, f, q), g = this.gain(0), o = this.out(pos, rev, bus);
    if (sweepTo) fl.frequency.exponentialRampToValueAtTime(sweepTo, t + a + hold + dur);
    s.connect(fl); fl.connect(g); g.connect(o);
    this.env(g, t, a, hold, dur, vol);
    s.start(t, Math.random()); s.stop(t + a + hold + dur + 0.05);
  },
  tone({ pos = null, t0 = 0, type = 'sine', f = 440, f2 = null, dur = 0.2, a = 0.005, hold = 0, vol = 0.3, rev = 0.2, bus = null, filter = null }) {
    if (!this.ok) return;
    const t = (t0 || this.t), o = this.osc(type, f), g = this.gain(0), out = this.out(pos, rev, bus);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + hold + dur);
    if (filter) { const fl = this.filt('lowpass', filter, 0.7); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(out);
    this.env(g, t, a, hold, dur, vol);
    o.start(t); o.stop(t + a + hold + dur + 0.05);
  },
};

/* ---- one-shot sound effects ---- */
const SFX = {
  step(surface = 'wood', vol = 0.35, pitch = 1) {
    if (!AU.ok) return;
    const r = 0.85 + Math.random() * 0.3;
    if (surface === 'carpet') { AU.burst({ dur: 0.07, f: 380 * r * pitch, q: 0.8, vol: vol * 0.55, rev: 0.05 }); }
    else if (surface === 'grass') { AU.burst({ dur: 0.09, f: 2600 * r, q: 0.6, type: 'highpass', vol: vol * 0.35, rev: 0.05 }); AU.burst({ dur: 0.06, f: 300, q: 1, vol: vol * 0.3, rev: 0 }); }
    else if (surface === 'concrete' || surface === 'tile') { AU.burst({ dur: 0.05, f: 1400 * r * pitch, q: 1.4, vol: vol * 0.55, rev: 0.25 }); AU.tone({ f: 90, f2: 50, dur: 0.06, vol: vol * 0.3 }); }
    else { AU.burst({ dur: 0.06, f: 520 * r * pitch, q: 1.2, vol: vol * 0.7, rev: 0.18 }); AU.tone({ f: 85 * r, f2: 45, dur: 0.08, vol: vol * 0.55, rev: 0.05 }); if (Math.random() < 0.08) this.creak(null, 0.08); }
  },
  // sawtooth through a resonant band with a wobbling pitch: wood groan by default, hinge squeak with a high band
  creak(pos = null, vol = 0.18, { t0 = 0, dur = 0.6, f = 160 + Math.random() * 120, bp = 900, q = 6 } = {}) {
    if (!AU.ok) return;
    const t = t0 || AU.t, o = AU.osc('sawtooth', f), fl = AU.filt('bandpass', bp, q), g = AU.gain(0), out = AU.out(pos, 0.4);
    const lfo = AU.osc('sine', 18 + Math.random() * 20), lg = AU.gain(f * 0.15); lfo.connect(lg); lg.connect(o.frequency);
    o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (0.7 + Math.random() * 0.6), t + dur * 0.8);
    o.connect(fl); fl.connect(g); g.connect(out);
    AU.env(g, t, Math.min(0.05, dur * 0.15), dur * 0.4, dur * 0.45, vol);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
  },
  door(pos, swing = 1.1) {
    if (!AU.ok) return;
    const t = AU.t;
    AU.burst({ pos, t0: t, dur: 0.03, f: 3200, q: 3, vol: 0.5, rev: 0.1 }); // handle turns
    AU.burst({ pos, t0: t + 0.06, dur: 0.05, f: 1700, q: 2, vol: 0.6, rev: 0.25 }); // latch springs back
    AU.tone({ pos, t0: t + 0.06, type: 'triangle', f: 2300, f2: 1900, dur: 0.07, vol: 0.14 });
    AU.burst({ pos, t0: t + 0.07, dur: 0.14, f: 240, q: 0.7, type: 'lowpass', vol: 0.6, brown: true, rev: 0.3 }); // leaf knocks free of the frame
    AU.tone({ pos, t0: t + 0.07, f: 110, f2: 60, dur: 0.13, vol: 0.32 });
    AU.burst({ pos, t0: t + 0.12, a: swing * 0.3, hold: swing * 0.12, dur: swing * 0.45, f: 900, q: 0.6, type: 'lowpass', vol: 0.32, sweepTo: 350, rev: 0.35 }); // air pushed by the leaf
    this.creak(pos, 0.24, { t0: t + 0.16, dur: swing * 0.7, f: 340 + Math.random() * 80, bp: 2600, q: 4 }); // hinge squeak
    const st = t + swing * 0.92;
    AU.burst({ pos, t0: st, dur: 0.2, f: 180, q: 0.7, type: 'lowpass', vol: 0.55, brown: true, rev: 0.4 }); // settles against the stop
    AU.burst({ pos, t0: st, dur: 0.05, f: 1200, q: 1.5, vol: 0.22, rev: 0.3 });
  },
  slam(pos) { if (!AU.ok) return; AU.burst({ pos, dur: 0.45, f: 260, q: 0.5, type: 'lowpass', vol: 1, rev: 0.7, brown: true }); AU.tone({ pos, f: 70, f2: 35, dur: 0.4, vol: 0.8 }); AU.burst({ pos, dur: 0.08, f: 2400, q: 1, vol: 0.4 }); },
  // handle jiggled twice against the bolt; the leaf rattles in its frame
  locked(pos) {
    if (!AU.ok) return;
    for (let i = 0; i < 2; i++) {
      const k = AU.t + i * 0.17;
      AU.burst({ pos, t0: k, dur: 0.035, f: 2600, q: 2.5, vol: 0.7, rev: 0.15 });
      AU.burst({ pos, t0: k + 0.01, dur: 0.09, f: 260, q: 0.8, type: 'lowpass', vol: 0.75, brown: true, rev: 0.2 });
      AU.tone({ pos, t0: k + 0.01, f: 140, f2: 80, dur: 0.07, vol: 0.3 });
      AU.burst({ pos, t0: k + 0.07, dur: 0.03, f: 3400, q: 3, vol: 0.4, rev: 0.1 });
    }
  },
  // key slides in, tumblers tick, the bolt throws
  unlock(pos) {
    if (!AU.ok) return;
    const t = AU.t;
    AU.burst({ pos, t0: t, dur: 0.14, f: 4200, q: 1.2, vol: 0.35, sweepTo: 2600, rev: 0.1 });
    AU.burst({ pos, t0: t + 0.16, dur: 0.03, f: 3000, q: 3, vol: 0.6, rev: 0.1 });
    AU.burst({ pos, t0: t + 0.26, dur: 0.05, f: 1600, q: 2, vol: 0.9, rev: 0.2 });
    AU.burst({ pos, t0: t + 0.26, dur: 0.1, f: 240, q: 0.8, type: 'lowpass', vol: 0.6, brown: true, rev: 0.2 });
    AU.tone({ pos, t0: t + 0.26, type: 'triangle', f: 1350, dur: 0.18, vol: 0.14 });
  },
  drawer(pos, open = true) {
    if (!AU.ok) return;
    const t = AU.t;
    AU.burst({ pos, t0: t, a: 0.03, dur: 0.3, f: open ? 700 : 900, q: 1.2, vol: 0.45, sweepTo: open ? 400 : 1300, rev: 0.15 }); // wood runners
    AU.burst({ pos, t0: t + 0.02, a: 0.03, dur: 0.25, f: 2600, q: 0.8, vol: 0.12, rev: 0.1 });
    const k = t + (open ? 0.3 : 0.25);
    AU.burst({ pos, t0: k, dur: 0.08, f: 320, q: 0.9, vol: 0.6, rev: 0.15 }); // hits its stop
    AU.tone({ pos, t0: k, f: 120, f2: 70, dur: 0.08, vol: 0.3 });
  },
  coins() {
    if (!AU.ok) return;
    for (let i = 0; i < 6; i++) {
      const t = AU.t + i * 0.045 + Math.random() * 0.03, f = 2400 + Math.random() * 2400;
      AU.tone({ t0: t, type: 'sine', f, dur: 0.18, vol: 0.06, rev: 0.25 });
      AU.tone({ t0: t, type: 'sine', f: f * 2.71, dur: 0.1, vol: 0.03, rev: 0.25 });
    }
  },
  pickup() { if (!AU.ok) return; AU.burst({ dur: 0.12, f: 1500, q: 0.8, vol: 0.18, sweepTo: 3000 }); AU.tone({ type: 'triangle', f: 880, dur: 0.12, vol: 0.08 }); AU.tone({ t0: AU.t + 0.07, type: 'triangle', f: 1320, dur: 0.18, vol: 0.07 }); },
  // short wooden knock: a low sine body plus a band of noise (tc = decay seconds)
  knock(pos, t0, f, nf, vol, tc = 0.04) {
    AU.tone({ pos, t0, f, f2: f * 0.8, dur: tc * 2.5, vol, rev: 0.15 });
    AU.burst({ pos, t0, dur: tc * 2, f: nf, q: 1.5, vol: vol * 0.7, rev: 0.15 });
  },
  // wardrobe, timed to animateClosetDoors (open by 0.3 s, shut by 0.6 s).
  // enter: doors rattle as they are pulled open, then are eased shut and latched; exit: doors are shoved open and bang
  closet(pos, enter = true) {
    if (!AU.ok) return;
    const t = AU.t;
    if (enter) {
      this.knock(pos, t + 0.03, 400, 2000, 0.189, 0.025);
      AU.burst({ pos, t0: t + 0.05, a: 0.02, hold: 0.15, dur: 0.08, f: 1200, q: 0.7, vol: 0.189, rev: 0.15 });
      for (const d of [0.065, 0.105, 0.145, 0.17, 0.22]) AU.burst({ pos, t0: t + d, dur: 0.045, f: 1100, q: 0.9, vol: 0.378, rev: 0.15 });
      for (const d of [0.105, 0.145, 0.175, 0.22]) AU.tone({ pos, t0: t + d, f: 70, f2: 45, dur: 0.08, vol: 0.347 });
      for (const d of [0.065, 0.1, 0.165]) AU.burst({ pos, t0: t + d, dur: 0.012, f: 6000, q: 0.8, vol: 0.126, rev: 0 });
      AU.tone({ pos, t0: t + 0.41, f: 55, f2: 42, dur: 0.12, vol: 0.202 });
      AU.burst({ pos, t0: t + 0.41, dur: 0.12, f: 180, q: 0.7, type: 'lowpass', vol: 0.189, brown: true });
      [0.515, 0.545, 0.59, 0.64].forEach((d, i) => this.knock(pos, t + d, 75, 330, i < 3 ? 0.189 : 0.082, 0.025));
      AU.burst({ pos, t0: t + 0.56, dur: 0.025, f: 1100, q: 3, vol: 0.126 });
      for (const d of [0.685, 0.715]) AU.burst({ pos, t0: t + d, dur: 0.02, f: 1400, q: 2.5, vol: 0.139, rev: 0.05 });
    } else {
      AU.tone({ pos, t0: t + 0.05, f: 6250, dur: 0.18, vol: 0.004, rev: 0 }); // strained hinge whine
      AU.burst({ pos, t0: t + 0.25, a: 0.005, hold: 0.025, dur: 0.03, f: 950, q: 0.9, vol: 0.198, rev: 0.2 }); // crack
      const s = t + 0.29;
      AU.tone({ pos, t0: s, f: 62, f2: 45, a: 0.003, hold: 0.03, dur: 0.12, vol: 0.324 });
      AU.burst({ pos, t0: s, hold: 0.03, dur: 0.3, f: 120, q: 0.7, type: 'lowpass', vol: 0.432, brown: true, rev: 0.35 });
      AU.burst({ pos, t0: s, dur: 0.07, f: 420, q: 1.5, vol: 0.126, rev: 0.3 });
      AU.burst({ pos, t0: s, dur: 0.02, f: 4500, q: 0.7, type: 'highpass', vol: 0.043 });
      for (const d of [0.46, 0.49]) this.knock(pos, t + d, 64, 2100, 0.09, 0.03); // rebound
      for (const d of [0.62, 0.65]) { AU.tone({ pos, t0: t + d, f: 47, dur: 0.04, vol: 0.054 }); AU.burst({ pos, t0: t + d, dur: 0.015, f: 3000, q: 2, vol: 0.036 }); } // latch
    }
  },
  // crawling under / out from a bed: a knock on the frame, a slow creak, body thump, cloth dragging, knees and elbows
  bed(pos = null, enter = true) {
    if (!AU.ok) return;
    const t = AU.t, k = 0.1;
    this.knock(pos, t + (enter ? 0.05 : 0.07), enter ? 140 : 200, enter ? 1500 : 630, k, 0.02);
    this.creak(pos, k * 0.45, { t0: t + (enter ? 0.15 : 0.2), dur: enter ? 0.25 : 0.33, f: enter ? 56 : 40, bp: 1050, q: 0.8 });
    this.knock(pos, t + (enter ? 0.46 : 0.66), enter ? 170 : 135, 300, k * 0.9, 0.05);
    const c0 = enter ? 0.56 : 0.74, c1 = enter ? 1.12 : 1.7;
    for (let d = c0; d < c1; d += 0.2 + Math.random() * 0.13) AU.burst({ pos, t0: t + d, a: 0.04, dur: 0.16, f: 400, q: 0.6, vol: k * (0.3 + Math.random() * 0.4), brown: true, rev: 0.05 });
    (enter ? [0.72, 0.78, 0.915, 0.965, 1.285] : [1.025, 1.11, 1.16, 1.31, 1.37, 1.535, 1.835]).forEach(d => this.knock(pos, t + d, 115 + Math.random() * 25, 330 + Math.random() * 140, k * (0.55 + Math.random() * 0.3), 0.04));
  },
  drop(pos) { if (!AU.ok) return; AU.burst({ pos, dur: 0.07, f: 650, q: 1, vol: 0.45, rev: 0.12 }); AU.tone({ pos, f: 150, f2: 80, dur: 0.07, vol: 0.25 }); AU.burst({ pos, t0: AU.t + 0.09, dur: 0.04, f: 900, q: 1.2, vol: 0.18, rev: 0.1 }); },
  click() { if (!AU.ok) return; AU.burst({ dur: 0.02, f: 3500, q: 2, vol: 0.25, rev: 0 }); },
  lighter() { if (!AU.ok) return; AU.burst({ dur: 0.03, f: 4000, q: 2, vol: 0.3, rev: 0 }); AU.burst({ t0: AU.t + 0.06, dur: 0.25, f: 1200, q: 0.5, vol: 0.12, rev: 0 }); },
  flick(pos) { if (!AU.ok) return; AU.burst({ pos, dur: 0.04, f: 5000, q: 1, type: 'highpass', vol: 0.25 }); AU.tone({ pos, type: 'sawtooth', f: 120, dur: 0.06, vol: 0.06, filter: 900 }); },
  lightBreak(pos) { if (!AU.ok) return; AU.burst({ pos, dur: 0.5, f: 3000, q: 0.5, type: 'highpass', vol: 0.4, rev: 0.4 }); AU.burst({ pos, dur: 0.12, f: 6000, q: 2, vol: 0.3 }); AU.tone({ pos, type: 'sawtooth', f: 90, f2: 40, dur: 0.2, vol: 0.12 }); },
  hurt() { if (!AU.ok) return; AU.tone({ type: 'sawtooth', f: 180, f2: 70, dur: 0.25, vol: 0.18, filter: 800 }); AU.burst({ dur: 0.18, f: 400, q: 0.6, vol: 0.4, brown: true, type: 'lowpass' }); },
  heal() { if (!AU.ok) return; [523, 659, 784].forEach((f, i) => AU.tone({ t0: AU.t + i * 0.08, type: 'sine', f, dur: 0.4, vol: 0.08, rev: 0.5 })); },
  gulp() { if (!AU.ok) return; for (let i = 0; i < 3; i++) AU.tone({ t0: AU.t + i * 0.16, type: 'sine', f: 180, f2: 90, dur: 0.1, vol: 0.18 }); },
  // Screech's whispered "pssst": lip click + puff, then a bright sibilant around 10-11 kHz held ~0.13 s
  // Eyes taking shape: a breathy swell that rises into a soft shimmer, under the murmur fading in
  eyesAppear(pos) {
    if (!AU.ok) return;
    const t = AU.t;
    AU.burst({ pos, t0: t, a: 0.55, dur: 0.5, f: 380, sweepTo: 2600, q: 1.4, vol: 0.55, rev: 0.7 });
    AU.burst({ pos, t0: t + 0.1, a: 0.5, dur: 0.6, f: 160, q: 0.8, type: 'lowpass', brown: true, vol: 0.9, rev: 0.4 });
    for (const [f, d] of [[523, 0], [622, 0.06], [784, 0.12]]) AU.tone({ pos, t0: t + 0.45 + d, type: 'sine', f, f2: f * 1.012, a: 0.25, dur: 1.4, vol: 0.06, rev: 0.8 });
  },
  psst(pos) {
    if (!AU.ok) return;
    const t = AU.t;
    AU.burst({ pos, t0: t, dur: 0.015, f: 2500, q: 1, vol: 0.5, rev: 0.1 }); // "p" click
    AU.burst({ pos, t0: t, a: 0.012, dur: 0.03, f: 300, q: 0.7, type: 'lowpass', vol: 0.9, rev: 0.05 }); // puff
    AU.burst({ pos, t0: t + 0.01, a: 0.01, hold: 0.13, dur: 0.05, f: 10800, q: 1.2, vol: 1.7, sweepTo: 9000, rev: 0.3 }); // "sss"
    AU.burst({ pos, t0: t + 0.01, a: 0.01, hold: 0.1, dur: 0.05, f: 6000, q: 1.4, vol: 0.45, rev: 0.3 });
  },
  // formant shriek: a stepped sawtooth, roughened by a 38 Hz detune wobble, saturated, then through narrow vocal-tract bands
  scream({ pos = null, t0 = 0, steps, formants, hold, vol = 1, rev = 0.25 }) {
    const t = t0 || AU.t, o = AU.osc('sawtooth', steps[0][1]), ws = AU.shaper(3), g = AU.gain(0), out = AU.out(pos, rev);
    steps.forEach(([d, f], i) => { if (i) { o.frequency.setValueAtTime(steps[i - 1][1], t + d - 0.01); o.frequency.linearRampToValueAtTime(f, t + d); } });
    const lfo = AU.osc('sine', 38), lg = AU.gain(40); lfo.connect(lg); lg.connect(o.detune);
    o.connect(ws);
    for (const [f, q, v] of formants) { const b = AU.filt('bandpass', f, q), bg = AU.gain(v); ws.connect(b); b.connect(bg); bg.connect(g); }
    g.connect(out);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.setValueAtTime(vol, t + hold); g.gain.setTargetAtTime(0.0001, t + hold, 0.03);
    o.start(t); lfo.start(t); o.stop(t + hold + 0.25); lfo.stop(t + hold + 0.25);
    AU.burst({ pos, t0: t, a: 0.015, hold, dur: 0.08, f: 3000, q: 1.5, vol: vol * 0.1, rev }); // breath
  },
  // looked at in time: a 0.6 s rising-then-falling shriek as it retreats
  screechFlee(pos) {
    if (!AU.ok) return;
    this.scream({ pos, steps: [[0, 935], [0.31, 1400], [0.49, 605], [0.66, 320]], formants: [[2800, 6, 6], [1870, 6, 3], [5500, 4, 1.5]], hold: 0.6, vol: 0.5 });
  },
  // the bite: stepped shriek + a growling chomp from 0.27 s + wet crunch grains, layered with the (lower) jumpscare scream
  screechAttack() {
    if (!AU.ok) return;
    const t = AU.t;
    this.scream({ steps: [[0, 1310], [0.11, 920], [0.2, 620], [0.31, 915], [0.36, 1330]], formants: [[2700, 6, 6], [3100, 5, 3.8]], hold: 0.44, vol: 0.25, rev: 0.15 });
    this.scream({ steps: [[0, 870], [0.33, 1300], [0.53, 565], [0.71, 290]], formants: [[2610, 6, 6], [1745, 6, 3], [5100, 4, 1.5]], hold: 0.645, vol: 0.18, rev: 0.3 });
    const c = AU.osc('sawtooth', 96), c2 = AU.osc('sine', 60), lp = AU.filt('lowpass', 220, 2), am = AU.gain(0.5), mod = AU.osc('square', 25), mg = AU.gain(0.5), cg = AU.gain(0), out = AU.out(null, 0.15);
    mod.connect(mg); mg.connect(am.gain); c.connect(lp); c2.connect(lp); lp.connect(am); am.connect(cg); cg.connect(out);
    c.frequency.setValueAtTime(96, t + 0.28); c.frequency.exponentialRampToValueAtTime(60, t + 0.33);
    const G = cg.gain;
    G.setValueAtTime(0.0001, t); G.linearRampToValueAtTime(0.4, t + 0.075); G.setTargetAtTime(0.0001, t + 0.075, 0.03);
    G.setValueAtTime(0.0001, t + 0.27); G.linearRampToValueAtTime(0.6, t + 0.29); G.setValueAtTime(0.6, t + 0.45); G.exponentialRampToValueAtTime(0.12, t + 0.55); G.exponentialRampToValueAtTime(0.0001, t + 0.75);
    for (const o of [c, c2, mod]) { o.start(t); o.stop(t + 0.8); }
    for (let i = 0; i < 4; i++) AU.burst({ t0: t + 0.45 + Math.random() * 0.2, dur: 0.02, f: 4000, q: 0.8, vol: 0.25 * (1 - i * 0.2), rev: 0.1 });
    AU.burst({ dur: 0.05, f: 300, q: 0.7, type: 'lowpass', vol: 0.5, brown: true, rev: 0 }); // the hit
  },
  jumpscare(kind = 'generic') {
    if (!AU.ok) return;
    const base = kind === 'jack' ? 300 : kind === 'timothy' ? 900 : 160;
    for (const m of [1, 1.06, 1.41, 1.5, 2.12]) AU.tone({ type: 'sawtooth', f: base * m, f2: base * m * 0.8, dur: 0.9, vol: 0.12, filter: 4000, rev: 0.4 });
    AU.burst({ dur: 0.8, f: 1800, q: 0.4, vol: 0.7, rev: 0.4 });
  },
  heartbeat(vol = 0.6) { if (!AU.ok) return; AU.tone({ type: 'sine', f: 62, f2: 40, dur: 0.12, vol }); AU.tone({ t0: AU.t + 0.2, type: 'sine', f: 55, f2: 38, dur: 0.14, vol: vol * 0.8 }); },
  // lever pulled down: a sharp metallic clack over a low thump, gone by ~0.6 s
  lever(pos) {
    if (!AU.ok) return;
    const t = AU.t + 0.08;
    AU.burst({ pos, t0: t, dur: 0.22, a: 0.001, f: 4500, q: 0.9, vol: 0.55, rev: 0.25 });
    AU.burst({ pos, t0: t, dur: 0.08, a: 0.001, f: 2400, q: 6, vol: 0.35, rev: 0.2 });
    AU.tone({ pos, t0: t, type: 'sine', f: 175, f2: 95, dur: 0.35, vol: 0.5, rev: 0.2 });
    AU.burst({ pos, t0: AU.t, dur: 0.07, f: 900, q: 2, vol: 0.18, sweepTo: 500 });
  },
  // gate: a low rattle, a sharp clank at ~1.3 s, then a ~1.8 kHz ring; quieter than the lever
  gate(pos) {
    if (!AU.ok) return;
    const t = AU.t;
    for (let i = 0; i < 6; i++) AU.burst({ pos, t0: t + 0.9 + i * 0.06, dur: 0.05, f: 380 + Math.random() * 200, q: 3, vol: 0.12, rev: 0.3 });
    AU.burst({ pos, t0: t + 1.3, dur: 0.18, a: 0.001, f: 6000, q: 0.8, vol: 0.4, rev: 0.45 });
    AU.tone({ pos, t0: t + 1.3, type: 'triangle', f: 120, f2: 70, dur: 0.3, vol: 0.25, rev: 0.3 });
    AU.tone({ pos, t0: t + 1.8, type: 'sine', f: 1800, dur: 0.45, a: 0.01, vol: 0.08, rev: 0.6 });
    AU.tone({ pos, t0: t + 1.8, type: 'sine', f: 2710, dur: 0.3, a: 0.01, vol: 0.03, rev: 0.6 });
  },
  paper() { if (!AU.ok) return; AU.burst({ dur: 0.25, f: 3500, q: 0.6, vol: 0.18, sweepTo: 1800 }); },
  book(pos) { if (!AU.ok) return; AU.burst({ pos, dur: 0.12, f: 900, q: 0.7, vol: 0.3 }); AU.burst({ pos, t0: AU.t + 0.1, dur: 0.2, f: 2500, q: 0.5, vol: 0.12 }); },
  padlockFail() { if (!AU.ok) return; AU.tone({ type: 'square', f: 150, dur: 0.25, vol: 0.12, filter: 800 }); this.locked(); },
  buzz() { if (!AU.ok) return; AU.tone({ type: 'sawtooth', f: 110, dur: 0.35, vol: 0.18, filter: 1200 }); },
  breaker() { if (!AU.ok) return; AU.burst({ dur: 0.05, f: 2500, q: 2, vol: 0.5 }); AU.tone({ type: 'square', f: 140, dur: 0.06, vol: 0.08, filter: 600 }); },
  ding() { if (!AU.ok) return; AU.tone({ type: 'sine', f: 1318, dur: 1.5, vol: 0.2, rev: 0.6 }); AU.tone({ t0: AU.t + 0.35, type: 'sine', f: 1046, dur: 1.8, vol: 0.2, rev: 0.6 }); },
  thunder() {
    if (!AU.ok) return;
    const t = AU.t + 0.3 + Math.random() * 0.8;
    AU.burst({ t0: t, a: 0.02, dur: 3.5, f: 180, q: 0.5, type: 'lowpass', vol: 0.9, brown: true, rev: 0.6, bus: AU.amb });
    AU.burst({ t0: t, dur: 0.6, f: 900, q: 0.5, vol: 0.3, rev: 0.5, bus: AU.amb });
  },
  goo(pos) { if (!AU.ok) return; for (let i = 0; i < 6; i++) AU.tone({ pos, t0: AU.t + i * 0.18 + Math.random() * 0.1, type: 'sine', f: 140 + Math.random() * 120, f2: 60, dur: 0.15, vol: 0.25, rev: 0.4 }); AU.burst({ pos, dur: 1.4, f: 300, q: 1, vol: 0.3, type: 'lowpass', rev: 0.5 }); },
  crash(pos) { if (!AU.ok) return; AU.burst({ pos, dur: 1.2, f: 2500, q: 0.4, type: 'highpass', vol: 0.8, rev: 0.6 }); AU.burst({ pos, dur: 0.5, f: 200, q: 0.5, type: 'lowpass', vol: 1, brown: true }); for (let i = 0; i < 8; i++) AU.tone({ pos, t0: AU.t + Math.random() * 0.6, type: 'sine', f: 3000 + Math.random() * 3000, dur: 0.2, vol: 0.05 }); },
  figureStep(pos, vol = 0.9) { if (!AU.ok) return; AU.tone({ pos, f: 55, f2: 30, dur: 0.3, vol, rev: 0.5 }); AU.burst({ pos, dur: 0.15, f: 260, q: 0.6, type: 'lowpass', vol: vol * 0.7, brown: true, rev: 0.4 }); },
  figureGrowl(pos, vol = 0.5) {
    if (!AU.ok) return;
    const t = AU.t, o = AU.osc('sawtooth', 70), f1 = AU.filt('bandpass', 500, 4), g = AU.gain(0), out = AU.out(pos, 0.5);
    const lfo = AU.osc('sine', 9), lg = AU.gain(12); lfo.connect(lg); lg.connect(o.frequency);
    o.frequency.linearRampToValueAtTime(55, t + 1.2);
    o.connect(f1); f1.connect(g); g.connect(out); AU.env(g, t, 0.2, 0.6, 0.6, vol);
    o.start(t); lfo.start(t); o.stop(t + 1.6); lfo.stop(t + 1.6);
    AU.burst({ pos, dur: 1.2, f: 700, q: 3, vol: vol * 0.3, rev: 0.4 });
  },
  figureRoar(pos) {
    if (!AU.ok) return;
    for (const f of [90, 134, 181]) AU.tone({ pos, type: 'sawtooth', f, f2: f * 0.7, dur: 1.8, a: 0.1, vol: 0.3, filter: 1600, rev: 0.6 });
    AU.burst({ pos, a: 0.1, dur: 1.8, f: 900, q: 0.8, vol: 0.6, rev: 0.6 });
  },
  whisper(vol = 0.4) {
    if (!AU.ok) return;
    const t = AU.t;
    for (let i = 0; i < 3; i++) AU.burst({ t0: t + i * 0.22, a: 0.03, dur: 0.2, f: [900, 2400, 1400][i], q: 4, vol, rev: 0.6 });
  },
  // the "Turn" cue: a short glitchy sweep with stuttering clicks (~1 s)
  haltTurn() {
    if (!AU.ok) return;
    const t = AU.t;
    AU.burst({ dur: 0.9, a: 0.01, f: 3400, q: 0.9, vol: 0.5, rev: 0.45, sweepTo: 350 });
    AU.tone({ type: 'square', f: 1320, f2: 260, dur: 0.55, vol: 0.09, rev: 0.5, filter: 2600 });
    AU.tone({ type: 'sawtooth', f: 74, f2: 41, dur: 0.95, vol: 0.28, rev: 0.3, filter: 500 });
    for (let i = 0; i < 7; i++) AU.burst({ t0: t + 0.04 + i * 0.07, dur: 0.025, f: 1200 + Math.random() * 3800, q: 3, vol: 0.28, rev: 0.1 });
  },
  haltRun() {
    if (!AU.ok) return;
    AU.burst({ dur: 0.6, a: 0.005, f: 900, q: 0.7, type: 'highpass', vol: 0.45, rev: 0.4 });
    AU.tone({ type: 'sawtooth', f: 220, f2: 110, dur: 0.6, vol: 0.18, rev: 0.4, filter: 1800 });
    AU.tone({ type: 'square', f: 233, f2: 116, dur: 0.6, vol: 0.1, rev: 0.4, filter: 1500 });
  },
  glass(pos) {
    if (!AU.ok) return;
    AU.burst({ pos, dur: 0.35, a: 0.001, f: 5200, q: 0.7, type: 'highpass', vol: 0.7, rev: 0.5 });
    AU.burst({ pos, dur: 0.12, f: 900, q: 0.8, vol: 0.5, rev: 0.3 });
    for (let i = 0; i < 8; i++) AU.tone({ pos, t0: AU.t + 0.05 + Math.random() * 0.5, type: 'sine', f: 2500 + Math.random() * 4000, dur: 0.08, vol: 0.06, rev: 0.6 });
  },
  haltWhoosh() { if (!AU.ok) return; AU.burst({ dur: 1.4, a: 0.3, f: 300, q: 2, vol: 0.5, sweepTo: 3000, rev: 0.6 }); AU.tone({ type: 'sine', f: 200, f2: 700, dur: 1.2, vol: 0.15, rev: 0.6 }); },

  rushWarn() { if (!AU.ok) return; AU.burst({ a: 0.4, dur: 1.4, f: 120, q: 0.5, type: 'lowpass', vol: 0.5, brown: true, rev: 0.8 }); },
  ambushWarn() { if (!AU.ok) return; AU.tone({ type: 'sawtooth', f: 330, f2: 990, dur: 1.2, a: 0.2, vol: 0.18, filter: 2500, rev: 0.7 }); AU.burst({ a: 0.2, dur: 1.4, f: 900, q: 1, vol: 0.4, rev: 0.7 }); },
  sting() { if (!AU.ok) return; for (const f of [110, 116.5, 164.8]) AU.tone({ type: 'sawtooth', f, dur: 2.2, a: 0.01, vol: 0.12, filter: 1400, rev: 0.7 }); },
  spark(pos) { if (!AU.ok) return; for (let i = 0; i < 4; i++) AU.burst({ pos, t0: AU.t + Math.random() * 0.3, dur: 0.03, f: 6000, q: 1, type: 'highpass', vol: 0.3 }); },
  buy() { if (!AU.ok) return; this.coins(); AU.tone({ t0: AU.t + 0.15, type: 'triangle', f: 1046, dur: 0.3, vol: 0.1 }); },
};

/* ---- continuous loops ---- */
function makeLoop(build, pos = null, rev = 0.4, bus = null) {
  if (!AU.ok) return { setPos() {}, setVol() {}, setRate() {}, stop() {} };
  const out = AU.gain(0), p = pos !== false ? AU.pan(pos || new THREE.Vector3()) : null;
  if (p) { out.connect(p); p.connect(bus || AU.sfx); } else out.connect(bus || AU.sfx);
  if (rev > 0) { const s = AU.gain(rev); (p || out).connect(s); s.connect(AU.revIn); }
  const parts = build(out) || {};
  const nodes = parts.nodes || [];
  nodes.forEach(n => n.start && n.start());
  return {
    out, parts, panner: p,
    setPos(v) { if (p) AU.setPannerPos(p, v); },
    setVol(v, k = 0.08) { out.gain.setTargetAtTime(v, AU.t, k); },
    setRate(r) { parts.rate && parts.rate(r); },
    stop(fade = 0.3) {
      out.gain.setTargetAtTime(0, AU.t, fade / 3);
      setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) { /* already stopped */ } }); try { out.disconnect(); } catch (e) { /* ignore */ } }, fade * 1000 + 200);
    },
  };
}
let _rushSrc = null;
function rushSource() {
  if (_rushSrc) return _rushSrc;
  const sr = AU.ctx.sampleRate, n = Math.floor(sr * 2.45), buf = AU.ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  const kh = 1 - Math.exp(-TAU * 2500 / sr), kl = 1 - Math.exp(-TAU * 12000 / sr);
  const fr = 106 / 2.45, fp = 8 / 2.45;   // whole cycles so the loop has no seam
  let lo = 0, hi = 0, peak = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1; lo += (w - lo) * kh; hi += ((w - lo) - hi) * kl;
    const t = i / sr, pulse = Math.pow(0.5 + 0.5 * Math.sin(TAU * fp * t), 4);
    d[i] = hi * (1 + 0.5 * Math.sin(TAU * fr * t)) * (0.55 + 0.45 * pulse);
    peak = Math.max(peak, Math.abs(d[i]));
  }
  for (let i = 0; i < n; i++) d[i] /= peak;
  return (_rushSrc = buf);
}
/* Eyes: a crowd of garbled voices murmuring at once. Each voice is a buzzy pulse train (or a bare whisper)
   through three vowel formants that jump to a new random vowel every syllable, with little gaps and its own
   rise and fall in pitch. 6 s, the tail cross-faded into the head so it loops without a seam. */
let _murmurSrc = null;
function murmurData(sr, sec = 6, voices = 8) {
  const X = Math.floor(sr * 0.5), L = Math.floor(sr * sec), n = L + X, d = new Float32Array(n);
  const VOW = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240], [530, 1840, 2480], [570, 840, 2410], [440, 1020, 2240], [660, 1720, 2410]];
  const BW = [90, 130, 220], FG = [1, 0.7, 0.35], R = () => Math.random();
  for (let v = 0; v < voices; v++) {
    const whisper = v % 4 === 3, base = 85 + R() * 130, breath = whisper ? 1 : 0.12 + R() * 0.25, vol = 0.6 + R() * 0.5;
    const fs = 0.85 + R() * 0.3;   // vocal tract length
    const st = [0, 0, 0].map(() => ({ x1: 0, x2: 0, y1: 0, y2: 0, b0: 0, a1: 0, a2: 0, f: 600 }));
    let ph = R(), glot = 0, syl = 0, sylLen = 1, gap = 0, amp = 0, tgtF = VOW[0], pitch = 1, pitch2 = 1;
    for (let i = 0; i < n; i++) {
      if (--syl <= 0) {   // next syllable (or a short pause)
        sylLen = syl = Math.floor(sr * (0.07 + R() * 0.17)); gap = R() < 0.16 ? 1 : 0;
        tgtF = VOW[Math.floor(R() * VOW.length)]; pitch2 = 0.86 + R() * 0.3;
      }
      const k = 1 - syl / sylLen, env = gap ? 0 : Math.min(1, k * 7) * (1 - k * 0.55);
      amp += (env - amp) * 0.004; pitch += (pitch2 - pitch) * 0.0008;
      if ((i & 31) === 0) for (let j = 0; j < 3; j++) {   // glide the formants, refresh the resonator coefficients
        const s = st[j]; s.f += (tgtF[j] * fs - s.f) * 0.18;
        const w = TAU * s.f / sr, a = Math.sin(w) * BW[j] / (2 * s.f), a0 = 1 + a;
        s.b0 = a / a0; s.a1 = -2 * Math.cos(w) / a0; s.a2 = (1 - a) / a0;
      }
      ph += base * pitch / sr; if (ph >= 1) ph -= 1;
      glot += ((1 - 2 * ph) - glot) * 0.35;   // softened sawtooth
      const ex = (whisper ? 0 : glot) + (R() * 2 - 1) * breath;
      let y = 0;
      for (let j = 0; j < 3; j++) {
        const s = st[j], o = s.b0 * (ex - s.x2) - s.a1 * s.y1 - s.a2 * s.y2;
        s.x2 = s.x1; s.x1 = ex; s.y2 = s.y1; s.y1 = o; y += o * FG[j];
      }
      d[i] += y * amp * vol;
    }
  }
  for (let i = 0; i < X; i++) { const u = i / X; d[i] = d[i] * Math.sqrt(u) + d[L + i] * Math.sqrt(1 - u); }
  let peak = 1e-6; for (let i = 0; i < L; i++) peak = Math.max(peak, Math.abs(d[i]));
  const out = d.subarray(0, L); for (let i = 0; i < L; i++) out[i] *= 0.9 / peak;
  return out;
}
function murmurSource() {
  if (_murmurSrc || !AU.ok) return _murmurSrc;
  const sr = 22050, data = murmurData(sr), buf = AU.ctx.createBuffer(1, data.length, sr);   // voices only, so a low rate is plenty (and ~4x faster)
  buf.getChannelData(0).set(data);
  return (_murmurSrc = buf);
}
const LOOPS = {
  /* Rush, as in the game: one 2.45 s burst of bright noise (43 Hz roughness, ~3 Hz pulses) played as two
     loops at once. FAR is it slowed ~16x: a low noisy rumble (energy 250 Hz-1 kHz, a ~2.7 Hz throb) heard
     from about two rooms away. NEAR is it slowed ~5x: a bright screech with an 8.6 Hz rattle that is only
     unmuted when Rush is close. No doppler. parts.update(dist) is called every frame by the entity. */
  rush(ambush = false) {
    if (ambush) return this.ambush();
    return makeLoop(out => {
      const buf = rushSource();
      const far = AU.ctx.createBufferSource(), near = AU.ctx.createBufferSource();
      far.buffer = near.buffer = buf; far.loop = near.loop = true;
      far.playbackRate.value = 1 / 16; near.playbackRate.value = 1 / 5;
      const fl = AU.filt('lowpass', 1100, 0.6), fg = AU.gain(0); far.connect(fl); fl.connect(fg); fg.connect(out);
      const nh = AU.filt('highpass', 260, 0.6), ng = AU.gain(0); near.connect(nh); nh.connect(ng); ng.connect(out);
      return {
        nodes: [far, near],
        update(dist) {
          const t = AU.t, fv = clamp(1 - dist / 75, 0, 1), nv = clamp(1 - dist / 13, 0, 1);
          fg.gain.setTargetAtTime(2.2 * fv * fv, t, 0.08);
          ng.gain.setTargetAtTime(1.6 * nv * nv, t, 0.04);
        },
      };
    }, null, 0.45);
  },
  /* Ambush: a heavy, fast-wobbling roar with a scraping metallic shriek on top; muffled far away,
     opening up as it closes in. */
  ambush() {
    const ambush = true;
    return makeLoop(out => {
      const nodes = [];
      const tone = AU.filt('lowpass', 600, 0.6);             // distance muffling
      const drive = AU.shaper(ambush ? 60 : 40), pre = AU.gain(1.4), post = AU.gain(0.9);
      pre.connect(drive); drive.connect(tone); tone.connect(post); post.connect(out);
      // 1) rumbling body: brown noise, band-limited, with a fast tremolo ("brrrrrr")
      const n = AU.noiseSrc(true), nb = AU.filt('bandpass', ambush ? 260 : 170, 0.7), trem = AU.gain(0.9);
      const tl = AU.osc('square', ambush ? 17 : 13), tlg = AU.gain(0.55); tl.connect(tlg); tlg.connect(trem.gain);
      n.connect(nb); nb.connect(trem); trem.connect(pre); nodes.push(n, tl);
      // 2) low growl: two detuned saws beating against each other
      const base = ambush ? 62 : 44;
      const s1 = AU.osc('sawtooth', base), s2 = AU.osc('sawtooth', base * 1.47), sg = AU.gain(0.22);
      s2.detune.value = 18;
      const vib = AU.osc('sine', ambush ? 6.5 : 3.2), vg = AU.gain(base * 0.06); vib.connect(vg); vg.connect(s1.frequency); vg.connect(s2.frequency);
      s1.connect(sg); s2.connect(sg); sg.connect(pre); nodes.push(s1, s2, vib);
      // 3) scraping metal: narrow resonances swept slowly, ring-modulated
      const m = AU.noiseSrc(false), mb1 = AU.filt('bandpass', ambush ? 2900 : 1900, 14), mb2 = AU.filt('bandpass', ambush ? 4300 : 3100, 18), mg = AU.gain(ambush ? 0.9 : 0.55);
      const sw = AU.osc('sine', 0.45), swg = AU.gain(ambush ? 900 : 650); sw.connect(swg); swg.connect(mb1.frequency); swg.connect(mb2.frequency);
      const rm = AU.gain(0), rmo = AU.osc('sine', ambush ? 41 : 29), rmg = AU.gain(1); rmo.connect(rmg); rmg.connect(rm.gain);
      m.connect(mb1); m.connect(mb2); mb1.connect(rm); mb2.connect(rm); rm.connect(mg); mg.connect(tone); nodes.push(m, sw, rmo);
      // 4) shriek (stronger for Ambush): a wailing saw pair
      const sh1 = AU.osc('sawtooth', ambush ? 520 : 330), sh2 = AU.osc('sawtooth', ambush ? 540 : 347), shb = AU.filt('bandpass', ambush ? 1300 : 900, 3), shg = AU.gain(ambush ? 0.32 : 0.12);
      const shv = AU.osc('sine', ambush ? 8 : 5.5), shvg = AU.gain(ambush ? 70 : 35); shv.connect(shvg); shvg.connect(sh1.frequency); shvg.connect(sh2.frequency);
      sh1.connect(shb); sh2.connect(shb); shb.connect(shg); shg.connect(tone); nodes.push(sh1, sh2, shv);
      // 5) air: hiss that only shows up when close
      const h = AU.noiseSrc(false), hp = AU.filt('highpass', 2500, 0.5), hg = AU.gain(0); h.connect(hp); hp.connect(hg); hg.connect(out); nodes.push(h);
      const pitched = [[s1, base], [s2, base * 1.47], [sh1, ambush ? 520 : 330], [sh2, ambush ? 540 : 347]];
      return {
        nodes,
        update(dist, vr) {
          const t = AU.t, near = clamp(1 - dist / 28, 0, 1);
          tone.frequency.setTargetAtTime(500 + 7500 * near * near, t, 0.05);
          hg.gain.setTargetAtTime(0.35 * near * near, t, 0.05);
          void vr; void pitched;
        },
      };
    }, null, 0.5);
  },
  /* Eyes: the murmuring crowd, plus a slower copy whose speed wavers (a deeper, warbling mumble), over a faint hollow chord */
  eyes() {
    return makeLoop(out => {
      const nodes = [], buf = murmurSource();
      if (buf) for (const [rate, vol, lp, wob] of [[1, 0.75, 3400, 0], [0.74, 0.45, 1900, 0.035]]) {
        const s = AU.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate;
        const hp = AU.filt('highpass', 120, 0.6), lp_ = AU.filt('lowpass', lp, 0.7), g = AU.gain(vol);
        s.connect(hp); hp.connect(lp_); lp_.connect(g); g.connect(out); nodes.push(s);
        if (wob) { const w = AU.osc('sine', 0.37), wg = AU.gain(wob); w.connect(wg); wg.connect(s.playbackRate); nodes.push(w); }
      }
      for (const [f, ff] of [[196, 700], [247, 1150], [294, 900], [392, 2400]]) {
        const o = AU.osc('sawtooth', f), b = AU.filt('bandpass', ff, 6), g = AU.gain(buf ? 0.035 : 0.12);
        const v = AU.osc('sine', 4 + Math.random() * 2), vg = AU.gain(f * 0.012); v.connect(vg); vg.connect(o.frequency);
        o.detune.value = Math.random() * 14 - 7;
        o.connect(b); b.connect(g); g.connect(out); nodes.push(o, v);
      }
      return { nodes };
    }, null, 0.6);
  },
  /* Halt: constant monotone static in your head, a low drone and a thin whine that creep up in pitch */
  halt() {
    return makeLoop(out => {
      const n = AU.noiseSrc(), hp = AU.filt('highpass', 1600, 0.5), ng = AU.gain(0.14); n.connect(hp); hp.connect(ng); ng.connect(out);
      const n2 = AU.noiseSrc(), bp = AU.filt('bandpass', 700, 2.5), cg = AU.gain(0), cr = AU.osc('square', 7.3), crg = AU.gain(0.08);
      cr.connect(crg); crg.connect(cg.gain); n2.connect(bp); bp.connect(cg); cg.connect(out);
      const d1 = AU.osc('sawtooth', 55), d2 = AU.osc('sawtooth', 55.7), lp = AU.filt('lowpass', 380, 1.4), dg = AU.gain(0.2);
      d1.connect(lp); d2.connect(lp); lp.connect(dg); dg.connect(out);
      const w = AU.osc('sine', 880), wg = AU.gain(0.025), wl = AU.osc('sine', 0.35), wlg = AU.gain(30); wl.connect(wlg); wlg.connect(w.frequency); w.connect(wg); wg.connect(out);
      return {
        nodes: [n, n2, cr, d1, d2, w, wl],
        rate(r) { const t = AU.t; d1.frequency.setTargetAtTime(55 * r, t, 0.4); d2.frequency.setTargetAtTime(55.7 * r, t, 0.4); w.frequency.setTargetAtTime(880 * r, t, 0.4); lp.frequency.setTargetAtTime(380 * r, t, 0.4); },
      };
    }, false, 0.5);
  },
  fire(pos) {
    return makeLoop(out => {
      const n = AU.noiseSrc(true), lp = AU.filt('lowpass', 400, 0.7), g = AU.gain(1.4); n.connect(lp); lp.connect(g); g.connect(out);
      const c = AU.noiseSrc(), hp = AU.filt('highpass', 2500, 0.7), cg = AU.gain(0);
      const cl = AU.osc('square', 13), clg = AU.gain(0.12); cl.connect(clg); clg.connect(cg.gain);
      c.connect(hp); hp.connect(cg); cg.connect(out);
      return { nodes: [n, c, cl] };
    }, pos, 0.3);
  },
  rain() {
    return makeLoop(out => {
      const n = AU.noiseSrc(), hp = AU.filt('highpass', 900, 0.5), lp = AU.filt('lowpass', 7000, 0.5), g = AU.gain(0.22);
      n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
      const b = AU.noiseSrc(true), bl = AU.filt('lowpass', 300, 0.5), bg = AU.gain(0.6); b.connect(bl); bl.connect(bg); bg.connect(out);
      return { nodes: [n, b] };
    }, false, 0.2, AU.amb);
  },
  hum(pos) { // electric light hum / buzz
    return makeLoop(out => {
      const o = AU.osc('sawtooth', 120), lp = AU.filt('lowpass', 500, 1), g = AU.gain(0.05); o.connect(lp); lp.connect(g); g.connect(out);
      return { nodes: [o] };
    }, pos, 0.1);
  },
  ambience() {
    return makeLoop(out => {
      const n = AU.noiseSrc(true), lp = AU.filt('lowpass', 140, 0.7), g = AU.gain(0.5); n.connect(lp); lp.connect(g); g.connect(out);
      const o = AU.osc('sine', 55), og = AU.gain(0.05); o.connect(og); og.connect(out);
      const o2 = AU.osc('sine', 82.4), og2 = AU.gain(0.025); o2.connect(og2); og2.connect(out);
      const l = AU.osc('sine', 0.07), lg = AU.gain(0.03); l.connect(lg); lg.connect(og.gain);
      return { nodes: [n, o, o2, l] };
    }, false, 0.2, AU.amb);
  },
};

/* ---- sequenced music ---- */
const MUSIC = {
  cur: null,
  stop(fade = 1) { if (this.cur) { this.cur.stop(fade); this.cur = null; } },
  play(name) {
    if (!AU.ok) return;
    if (this.cur && this.cur.name === name) return;
    this.stop(0.8);
    this.cur = this.make(name);
  },
  make(name) {
    const bus = AU.gain(0); bus.connect(AU.music);
    const send = AU.gain(0.3); bus.connect(send); send.connect(AU.revIn);
    bus.gain.setTargetAtTime(1, AU.t, 0.3);
    const def = MUSIC_DEFS[name];
    let step = 0, next = AU.t + 0.1, alive = true;
    const spb = 60 / def.bpm / (def.div || 4);
    const timer = setInterval(() => {
      if (!alive) return;
      while (next < AU.t + 0.2) {
        def.step(step, next, bus, spb);
        step++; next += spb * (def.swing && step % 2 ? 1 + def.swing : def.swing && step % 2 === 0 ? 1 - def.swing : 1);
      }
    }, 30);
    return {
      name,
      stop(fade = 1) {
        alive = false; clearInterval(timer);
        bus.gain.setTargetAtTime(0, AU.t, fade / 3);
        setTimeout(() => { try { bus.disconnect(); } catch (e) { /* ignore */ } }, fade * 1000 + 600);
      },
    };
  },
};
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
function mTone(bus, t, { type = 'sine', f = 440, dur = 0.2, a = 0.005, vol = 0.2, lp = null, detune = 0, f2 = null }) {
  const o = AU.osc(type, f), g = AU.gain(0);
  o.detune.value = detune;
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  if (lp) { const fl = AU.filt('lowpass', lp, 0.8); o.connect(fl); fl.connect(g); } else o.connect(g);
  g.connect(bus); AU.env(g, t, a, 0, dur, vol); o.start(t); o.stop(t + a + dur + 0.05);
}
function mNoise(bus, t, { dur = 0.05, f = 8000, q = 1, type = 'highpass', vol = 0.1 }) {
  const s = AU.noiseSrc(), fl = AU.filt(type, f, q), g = AU.gain(0);
  s.connect(fl); fl.connect(g); g.connect(bus); AU.env(g, t, 0.002, 0, dur, vol); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
const MUSIC_DEFS = {
  // Seek chase: driving drums + low ostinato + string stabs
  chase: {
    bpm: 168, div: 4,
    step(s, t, bus, spb) {
      const b = s % 16, bar = Math.floor(s / 16) % 4;
      if (b % 4 === 0) mTone(bus, t, { f: 130, f2: 38, dur: 0.22, vol: 0.9 });
      if (b === 4 || b === 12) mNoise(bus, t, { dur: 0.18, f: 1600, type: 'bandpass', q: 0.6, vol: 0.55 });
      if (b % 2 === 1) mNoise(bus, t, { dur: 0.03, f: 7000, vol: 0.1 });
      const roots = [38, 34, 36, 33];
      const r = roots[bar];
      const pat = [0, 0, 12, 0, 0, 7, 0, 12, 0, 0, 12, 0, 3, 0, 7, 12];
      mTone(bus, t, { type: 'sawtooth', f: NOTE(r + pat[b]), dur: spb * 0.8, vol: 0.13, lp: 900 });
      if (b === 0 || b === 6 || b === 10) {
        const chord = [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 61, 64]][bar];
        for (const n of chord) for (const d of [-8, 8]) mTone(bus, t, { type: 'sawtooth', f: NOTE(n), detune: d, dur: spb * 2.5, a: 0.01, vol: 0.05, lp: 2600 });
      }
      if (b === 14 && bar === 3) mTone(bus, t, { type: 'square', f: NOTE(81), f2: NOTE(69), dur: 0.3, vol: 0.05, lp: 3000 });
    },
  },
  // Elevator jam: smooth jazzy loop for the elevator ride
  elevator: {
    bpm: 104, div: 2, swing: 0.18,
    step(s, t, bus, spb) {
      const b = s % 8, bar = Math.floor(s / 8) % 4;
      const ch = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [55, 59, 62, 65]][bar];
      const bass = [[41, 45, 48, 45], [40, 43, 47, 43], [38, 41, 45, 41], [43, 47, 50, 49]][bar];
      if (b % 2 === 0) mTone(bus, t, { type: 'triangle', f: NOTE(bass[b / 2] - 12 + 12), dur: spb * 1.6, vol: 0.22, lp: 700 });
      if (b === 0 || b === 3 || b === 6) for (const n of ch) { mTone(bus, t, { type: 'sine', f: NOTE(n), dur: spb * 1.8, vol: 0.045 }); mTone(bus, t, { type: 'sine', f: NOTE(n) * 2, dur: spb * 0.6, vol: 0.012 }); }
      mNoise(bus, t, { dur: b % 2 ? 0.05 : 0.12, f: 6000, vol: b % 2 ? 0.03 : 0.05 });
      if ((s * 7) % 11 === 3) mTone(bus, t, { type: 'sine', f: NOTE(ch[(s * 3) % 4] + 12), dur: spb * 0.9, vol: 0.06 });
    },
  },
  // Guiding light: soft ethereal pad for the death screen
  guiding: {
    bpm: 40, div: 1,
    step(s, t, bus, spb) {
      const ch = [[64, 68, 71, 76], [61, 64, 68, 73], [57, 61, 64, 69], [59, 63, 66, 71]][s % 4];
      for (const n of ch) for (const d of [-6, 6]) mTone(bus, t, { type: 'sine', f: NOTE(n), detune: d, dur: spb * 1.3, a: spb * 0.5, vol: 0.05 });
      mTone(bus, t + spb * 0.5, { type: 'triangle', f: NOTE(ch[s % 4] + 12), dur: spb * 0.8, a: 0.05, vol: 0.03 });
    },
  },
  // Library / tense ambience
  tense: {
    bpm: 50, div: 1,
    step(s, t, bus, spb) {
      mTone(bus, t, { type: 'sine', f: NOTE([38, 39][s % 2]), dur: spb * 1.2, a: spb * 0.4, vol: 0.12 });
      if (s % 3 === 2) mTone(bus, t, { type: 'triangle', f: NOTE(74 + (s % 2)), dur: spb, a: 0.3, vol: 0.02 });
    },
  },
};
