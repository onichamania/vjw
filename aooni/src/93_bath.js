
/* =========================================================================
   The bath (1F, off corridor A), as in the original:
   - its door is frosted glass in an aluminium frame, the lit bath behind it
   - until you have seen it in the library the door won't open. The first time you look at the door,
     its shadow goes past behind the glass. Keep on at the door and it gives: you see Hiroshi from
     behind as he goes into the black, the door bangs shut, and a second later the glass goes red
   - the tub: murky water to near the top, the plug on its chain. Pull it and the water goes down the
     drain, leaving a wet bottom, puddles round the drain and a dirty line where the water stood
   ========================================================================= */
let FROST_C = null;
function frostNoise() {
  if (FROST_C) return FROST_C;
  const c = FROST_C = newCanvas(128, 256), g = c.getContext('2d'), im = g.createImageData(128, 256);
  for (let i = 0; i < 128 * 256; i++) { const v = 110 + (Math.random() * 145) | 0; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  return c;
}
// a door's leaf as an aluminium frame round frosted glass, with a solid panel along the bottom
function glassDoor(d, lw, lh, lt2) {
  const W = 256, H = 512, c = newCanvas(W, H), base = newCanvas(W, H), bg = base.getContext('2d');
  const tone = d.def.glass === 'warm' ? ['#7c7466', '#998f7e', '#6c6559'] : ['#76848a', '#94a2a7', '#68757b'];
  const gr = bg.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, tone[0]); gr.addColorStop(0.42, tone[1]); gr.addColorStop(1, tone[2]);
  bg.fillStyle = gr; bg.fillRect(0, 0, W, H);
  bg.globalAlpha = 0.16; bg.drawImage(frostNoise(), 0, 0, W, H); bg.globalAlpha = 1;
  const rg = bg.createRadialGradient(W * 0.5, H * 0.2, 6, W * 0.5, H * 0.2, W * 0.95);   // the lamp behind
  rg.addColorStop(0, 'rgba(255,255,255,.16)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); bg.fillStyle = rg; bg.fillRect(0, 0, W, H);
  const tex = toTex(c, true, false), gm = new THREE.MeshBasicMaterial({ map: tex });
  const alu = std({ color: 0xb4b8bd, roughness: 0.32, metalness: 0.65, envMap: ENV, envMapIntensity: 0.6 }), white = std({ color: 0xdedcd4, roughness: 0.5 });
  d.leaf.material = [alu, alu, alu, alu, gm, gm];
  d.panels.forEach(p => (p.visible = false)); d.knobs.forEach(k => (k.visible = false));
  const fz = lt2 / 2 + 0.008, both = (geo, mat, x, y, dz = 0) => { for (const s of [-1, 1]) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, s * (fz + dz)); d.piv.add(m); } };
  const y0 = 0.01;
  both(new THREE.BoxGeometry(lw, 0.07, 0.016), alu, lw / 2, y0 + lh - 0.035);          // top
  both(new THREE.BoxGeometry(0.07, lh, 0.016), alu, 0.035, y0 + lh / 2);                // hinge side
  both(new THREE.BoxGeometry(0.07, lh, 0.016), alu, lw - 0.035, y0 + lh / 2);           // latch side
  both(new THREE.BoxGeometry(lw - 0.14, 0.4, 0.014), white, lw / 2, y0 + 0.24);        // the panel along the bottom
  both(new THREE.BoxGeometry(lw, 0.05, 0.018), alu, lw / 2, y0 + 0.45);                 // the rail over it
  both(new THREE.BoxGeometry(lw, 0.05, 0.018), alu, lw / 2, y0 + 0.025);                // and at the foot
  both(new THREE.BoxGeometry(0.028, 0.34, 0.03), alu, lw - 0.15, 1.05, 0.02);           // a long pull handle each side
  d.glass = { c, g: c.getContext('2d'), base, tex, mat: gm, blood: null };
  glassPaint(d);
  if (d.id === 'corA_bath') {   // what you see through it when it opens before its time: nothing at all
    const dark = new THREE.Mesh(new THREE.BoxGeometry(DW - 0.02, DR_H, 1.6), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
    dark.userData.ownMat = true; dark.visible = false; d.F.dyn(dark, 0, DR_H / 2, WT - 0.075 - 0.8); d.dark = dark;
  }
}
// the glass, with (o.shadow 0..1) its shadow going past behind it, or (o.blood, o.drip) the red
function glassPaint(d, o = {}) {
  const G = d.glass; if (!G) return;
  const g = G.g, W = G.c.width, H = G.c.height;
  g.globalAlpha = 1; g.drawImage(G.base, 0, 0);
  if (o.shadow != null) glassShadow(g, W, H, o.shadow);
  if (o.blood) glassBlood(g, W, H, G.blood || (G.blood = bloodLayout()), o.blood, o.drip || 0);
  G.tex.needsUpdate = true;
}
const SHADOW_C = { a: null, s: null, blur: false };
function glassShadow(g, W, H, k) {
  // soft, the way a shape looks through frosted glass: blurred where the canvas can, otherwise drawn small and scaled up
  if (!SHADOW_C.a) { SHADOW_C.a = newCanvas(64, 128); SHADOW_C.s = newCanvas(16, 32); SHADOW_C.blur = typeof SHADOW_C.a.getContext('2d').filter === 'string'; }
  const c = SHADOW_C.a, a = c.getContext('2d'), w = 64, h = 128, x = lerp(-0.6, 1.6, k) * w, bob = Math.abs(Math.sin(k * 16)) * h * 0.018;
  a.clearRect(0, 0, w, h); if (SHADOW_C.blur) a.filter = 'blur(3px)';
  a.fillStyle = '#10122a';
  const el = (cx, cy, rx, ry) => { a.beginPath(); a.ellipse(cx, cy, rx, ry, 0, 0, TAU); a.fill(); };
  el(x, h * 0.2 + bob, w * 0.36, h * 0.16);                                        // the huge head
  el(x, h * 0.48 + bob, w * 0.31, h * 0.19);                                       // shoulders and chest
  el(x, h * 0.7 + bob, w * 0.22, h * 0.16);                                        // its belly
  el(x - w * 0.36, h * 0.58 + bob, w * 0.08, h * 0.2); el(x + w * 0.36, h * 0.58 + bob, w * 0.08, h * 0.2);   // the long arms
  if (SHADOW_C.blur) a.filter = 'none';
  else { const sg = SHADOW_C.s.getContext('2d'); sg.clearRect(0, 0, 16, 32); sg.drawImage(c, 0, 0, 16, 32); a.clearRect(0, 0, w, h); a.imageSmoothingEnabled = true; a.drawImage(SHADOW_C.s, 0, 0, w, h); }
  g.imageSmoothingEnabled = true; g.globalAlpha = 0.84; g.drawImage(c, 0, 0, W, H); g.globalAlpha = 1;
}
function bloodLayout() {
  const R = Math.random, cx0 = 0.42 + R() * 0.16, cy0 = 0.34 + R() * 0.1, sp = [], dp = [], dr = [];
  for (let i = 0; i < 18; i++) { const a = R() * TAU, dd = Math.pow(R(), 1.6) * 0.32; sp.push({ x: cx0 + Math.cos(a) * dd, y: cy0 + Math.sin(a) * dd * 0.55, r: (0.05 + R() * 0.13) * (1 - dd * 1.5), j: Array.from({ length: 14 }, () => 0.72 + R() * 0.5) }); }
  for (let i = 0; i < 110; i++) { const a = R() * TAU, dd = 0.08 + Math.pow(R(), 0.8) * 0.55; dp.push({ x: cx0 + Math.cos(a) * dd, y: cy0 + Math.sin(a) * dd * 0.6, r: 0.003 + R() * 0.013 }); }
  for (let i = 0; i < 16; i++) dr.push({ x: cx0 + (R() - 0.5) * 0.6, y: cy0 + (R() - 0.25) * 0.14, len: 0.14 + R() * 0.5, w: 0.008 + R() * 0.016, sp: 0.6 + R() * 0.9 });
  return { sp, dp, dr };
}
// blood on the inside of the glass, the bath's light coming through it: the whole pane red, the splashes dark
function glassBlood(g, W, H, L, k, drip) {
  g.globalAlpha = 1; g.fillStyle = `rgba(170,0,10,${(0.8 * k).toFixed(3)})`; g.fillRect(0, 0, W, H);
  const blob = (x, y, r, j, col) => {   // a smooth closed curve through the jagged points
    const n = j.length, P = j.map((q, i) => [x + Math.cos(i / n * TAU) * r * q, y + Math.sin(i / n * TAU) * r * q]), mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    g.fillStyle = col; g.beginPath(); let m = mid(P[n - 1], P[0]); g.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { m = mid(P[i], P[(i + 1) % n]); g.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); }
    g.fill();
  };
  g.globalAlpha = Math.min(1, k * 1.2);
  for (const s of L.sp) blob(s.x * W, s.y * H, s.r * W, s.j, '#760008');
  for (const s of L.sp) blob(s.x * W, s.y * H, s.r * W * 0.55, s.j, '#4c0004');
  g.fillStyle = '#80000a';
  for (const p of L.dp) { g.beginPath(); g.arc(p.x * W, p.y * H, p.r * W, 0, TAU); g.fill(); }
  if (drip > 0) {
    g.fillStyle = '#5a0006';
    for (const d of L.dr) { const l = Math.min(1, drip * d.sp) * d.len * H, x = d.x * W, y = d.y * H, w = d.w * W; g.fillRect(x - w / 2, y, w, l); g.beginPath(); g.arc(x, y + l, w * 0.8, 0, TAU); g.fill(); }
  }
  g.globalAlpha = 1;
}
let POOL_TEX = null;
function poolTex() {
  if (POOL_TEX) return POOL_TEX;
  const c = newCanvas(128, 128), g = c.getContext('2d'), R = Math.random;
  const blob = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, rr = r * (0.8 + R() * 0.35); if (i) g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
  for (let i = 0; i < 9; i++) blob(64 + (R() - 0.5) * 50, 26 + R() * 50, 22 + R() * 22, '#9a000e');   // (the top of the canvas is under the door)
  for (let i = 0; i < 6; i++) blob(64 + (R() - 0.5) * 40, 18 + R() * 34, 12 + R() * 14, '#6a0008');
  for (let i = 0; i < 14; i++) blob(64 + (R() - 0.5) * 100, 70 + R() * 50, 2 + R() * 4, '#8a000c');
  return (POOL_TEX = toTex(c, true, false));
}
function jiggleDoor(d, dur = 0.32) {
  const t0 = performance.now(), b = d.piv.userData.baseRy;
  animate(() => { const k = (performance.now() - t0) / (dur * 1000); if (k >= 1) { d.piv.rotation.y = b; return false; } d.piv.rotation.y = b - Math.abs(Math.sin(k * 38)) * 0.014 * (1 - k); return true; });
}
SFX.gurgle = (pos, dur = 4) => {
  if (!AU.ok) return;
  AU.burst({ pos, dur: 0.9, a: 0.3, hold: Math.max(0, dur - 1.2), f: 520, q: 0.7, vol: 0.3, sweepTo: 170, brown: true, rev: 0.4 });
  for (let i = 0; i < 24; i++) AU.tone({ pos, t0: AU.t + 0.2 + i * (dur - 0.6) / 24 + Math.random() * 0.08, f: 240 + Math.random() * 400, f2: 110, dur: 0.09 + Math.random() * 0.07, vol: 0.04 + Math.random() * 0.05, rev: 0.4 });
  AU.burst({ pos, t0: AU.t + dur - 0.7, dur: 0.9, a: 0.05, f: 1000, q: 2.5, vol: 0.28, sweepTo: 240, rev: 0.3 });   // the last of it, down the drain
};
SFX.bathKill = pos => {
  if (!AU.ok) return;
  SFX.scream({ pos, steps: [[0, 190], [0.08, 330], [0.45, 270], [0.85, 130]], formants: [[600, 3, 3], [1050, 3, 2], [2400, 4, 0.8]], hold: 0.85, vol: 0.9, rev: 0.55 });
  AU.burst({ pos, t0: AU.t + 0.05, dur: 0.4, f: 280, q: 0.6, type: 'lowpass', vol: 1, brown: true, rev: 0.45 });   // thrown against the glass
  AU.burst({ pos, t0: AU.t + 0.1, dur: 0.22, f: 850, q: 1.1, vol: 0.45, rev: 0.3 });                              // wet
  AU.tone({ pos, t0: AU.t + 0.05, f: 62, f2: 30, dur: 0.6, vol: 0.7 });
  for (const f of [233, 247, 349, 370]) AU.tone({ type: 'sawtooth', f, dur: 1.6, a: 0.004, vol: 0.05, filter: 2600, rev: 0.6 });
  for (let i = 0; i < 6; i++) AU.tone({ pos, t0: AU.t + 1.2 + i * 0.45 + Math.random() * 0.2, f: 900 + Math.random() * 500, f2: 400, dur: 0.05, vol: 0.05, rev: 0.5 });   // dripping
};

/* ---------- the tub ---------- */
let MURK_TEX = null, PUDDLE_TEX = null, SWIRL_TEX = null;
function murkTex() {
  if (MURK_TEX) return MURK_TEX;
  const c = newCanvas(64, 128), g = c.getContext('2d'), R = Math.random;
  g.fillStyle = '#3a473b'; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 70; i++) { g.fillStyle = R() < 0.5 ? 'rgba(80,92,70,.35)' : 'rgba(28,34,27,.4)'; g.beginPath(); g.ellipse(R() * 64, R() * 128, 3 + R() * 10, 3 + R() * 10, R() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(150,140,110,.35)'; g.fillRect(R() * 64, R() * 128, 1, 1 + R() * 2); }   // dust on the surface
  return (MURK_TEX = toTex(c, true, false));
}
function puddleTex() {
  if (PUDDLE_TEX) return PUDDLE_TEX;
  const c = newCanvas(64, 128), g = c.getContext('2d'), R = Math.random;
  g.fillStyle = 'rgba(40,30,24,.22)'; g.fillRect(0, 0, 64, 128);   // the bottom still wet all over
  const blob = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, rr = r * (0.75 + R() * 0.4); if (i) g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 1.4); else g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 1.4); } g.fill(); };
  blob(32, 104, 22, 'rgba(26,22,16,.75)'); blob(30, 110, 12, 'rgba(18,14,10,.85)');   // round the drain (the near end, at the bottom of the picture)
  for (let i = 0; i < 6; i++) blob(10 + R() * 44, 20 + R() * 80, 3 + R() * 7, 'rgba(26,22,16,.6)');
  for (let i = 0; i < 90; i++) { g.fillStyle = R() < 0.5 ? 'rgba(90,76,52,.7)' : 'rgba(40,46,30,.7)'; g.fillRect(R() * 64, 60 + R() * 68, 1, 1); }   // grit left behind
  return (PUDDLE_TEX = toTex(c, true, false));
}
function swirlTex() {
  if (SWIRL_TEX) return SWIRL_TEX;
  const c = newCanvas(64, 64), g = c.getContext('2d');
  g.strokeStyle = 'rgba(200,210,190,.55)'; g.lineWidth = 2;
  for (let arm = 0; arm < 3; arm++) { g.beginPath(); for (let t = 0; t < 1; t += 0.02) { const a = arm * TAU / 3 + t * 7, r = 30 * (1 - t); const x = 32 + Math.cos(a) * r, y = 32 + Math.sin(a) * r; if (t) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 10); rg.addColorStop(0, 'rgba(10,12,8,.9)'); rg.addColorStop(1, 'rgba(10,12,8,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  return (SWIRL_TEX = toTex(c, true, false));
}
function buildTub(r, F) {
  const TW = 0.95, TL = 2.05, TH = 0.62, th = 0.08, iw = TW - 2 * th, il = TL - 2 * th, by = 0.12, wy = 0.5, dz = TL / 2 - th - 0.22;
  // the tub itself: hollow, with a white rim
  F.box(TW, by, TL, AOM.pink, 0, by / 2, 0);
  for (const s of [-1, 1]) { F.box(th, TH, TL, AOM.pink, s * (TW - th) / 2, TH / 2, 0); F.box(iw, TH, th, AOM.pink, 0, TH / 2, s * (TL - th) / 2); }
  for (const s of [-1, 1]) { F.box(th + 0.03, 0.03, TL + 0.03, AOM.white, s * (TW - th) / 2, TH + 0.015, 0); F.box(iw, 0.03, th + 0.03, AOM.white, 0, TH + 0.015, s * (TL - th) / 2); }
  F.collide(-TW / 2, TW / 2, 0, TH, -TL / 2, TL / 2);
  // the taps at the far end, the spout over the water
  const ez = -TL / 2 + th / 2;
  F.cyl(0.02, 0.02, 0.2, MAT.steel, 0, TH + 0.13, ez, 10);
  F.cyl(0.016, 0.016, 0.2, MAT.steel, 0, TH + 0.22, ez + 0.1, 10, Math.PI / 2, 0, 0);
  F.cyl(0.02, 0.013, 0.05, MAT.steel, 0, TH + 0.2, ez + 0.2, 10);
  for (const s of [-1, 1]) F.cyl(0.032, 0.032, 0.035, std({ color: s < 0 ? 0xc0392b : 0x2e5cb8, roughness: 0.4 }), s * 0.14, TH + 0.05, ez, 10);
  // the drain in the bottom at the near end
  F.cyl(0.042, 0.042, 0.006, MAT.steel, 0, by + 0.003, dz, 14); F.cyl(0.027, 0.027, 0.008, MAT.black, 0, by + 0.004, dz, 12);
  const g = new THREE.Group(); F.dyn(g, 0, 0, 0);
  const mk = (geo, mat, x, y, z, par = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); par.add(m); return m; };
  const rubber = std({ color: 0x1b1b1b, roughness: 0.85 }), bead = new THREE.SphereGeometry(0.008, 6, 4);
  const chain = pts => { const cg = new THREE.Group(); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.02)); for (let k = 0; k < n; k++) mk(bead, MAT.steel, 0, 0, 0, cg).position.lerpVectors(a, b, k / n); } g.add(cg); return cg; };
  const att = new THREE.Vector3(TW / 2 - th / 2, TH + 0.035, dz);   // the chain is fixed to the rim on the room side
  const plugIn = mk(new THREE.CylinderGeometry(0.036, 0.03, 0.03, 12), rubber, 0, by + 0.016, dz);
  const chainIn = chain([att, new THREE.Vector3(iw / 2 - 0.006, TH - 0.04, dz), new THREE.Vector3(iw / 2 - 0.012, by + 0.05, dz), new THREE.Vector3(0.03, by + 0.02, dz)]);
  const plugOut = mk(new THREE.CylinderGeometry(0.036, 0.03, 0.03, 12), rubber, TW / 2 - th / 2, TH + 0.05, dz - 0.26); plugOut.rotation.z = 0.2;
  const chainOut = chain([att, new THREE.Vector3(TW / 2 - th / 2 + 0.012, TH + 0.04, dz - 0.12), new THREE.Vector3(TW / 2 - th / 2, TH + 0.045, dz - 0.24)]);
  // murky water, nearly to the top: you can't see the bottom
  const water = mk(new THREE.BoxGeometry(iw - 0.004, 0.01, il - 0.004), new THREE.MeshStandardMaterial({ map: murkTex(), roughness: 0.06, metalness: 0.3, transparent: true, opacity: 0.95, envMap: ENV, envMapIntensity: 0.55 }), 0, wy, 0);
  water.userData.ownMat = true;
  const swirl = mk(new THREE.CircleGeometry(0.13, 24), new THREE.MeshBasicMaterial({ map: swirlTex(), transparent: true, depthWrite: false }), 0, wy + 0.008, dz);
  swirl.rotation.x = -Math.PI / 2; swirl.visible = false; swirl.userData.ownMat = true;
  // where the water stood: a dirty line round the inside, and below it the sides still wet
  const ring = new THREE.Group(); g.add(ring);
  const ringM = new THREE.MeshStandardMaterial({ color: 0x5c4a34, roughness: 0.9, transparent: true, opacity: 0, depthWrite: false });
  const wetM = new THREE.MeshStandardMaterial({ color: 0x2a1418, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0, depthWrite: false });
  const bh = wy - by;
  for (const s of [-1, 1]) {
    mk(new THREE.BoxGeometry(iw, 0.028, 0.004), ringM, 0, wy, s * (il / 2 - 0.003), ring); mk(new THREE.BoxGeometry(0.004, 0.028, il), ringM, s * (iw / 2 - 0.003), wy, 0, ring);
    mk(new THREE.BoxGeometry(iw, bh, 0.003), wetM, 0, by + bh / 2, s * (il / 2 - 0.002), ring); mk(new THREE.BoxGeometry(0.003, bh, il), wetM, s * (iw / 2 - 0.002), by + bh / 2, 0, ring);
  }
  const wet = mk(new THREE.PlaneGeometry(iw - 0.01, il - 0.01), new THREE.MeshStandardMaterial({ map: puddleTex(), transparent: true, opacity: 0, roughness: 0.06, metalness: 0.25, envMap: ENV, envMapIntensity: 0.7, depthWrite: false }), 0, by + 0.002, 0);
  wet.rotation.x = -Math.PI / 2;
  const dp = F.pt(0.06, by + 0.02, 0.15); shineAt(r, dp.x, dp.y, dp.z, 'driver', false);   // on the bottom, once the water is out
  MAN.tubWater = water;
  MAN.tub = {
    water, swirl, ring, ringM, wetM, wet, plugIn, plugOut, chainIn, chainOut, wy, by, draining: false,
    set(drained) {
      water.visible = !drained; plugIn.visible = chainIn.visible = !drained; plugOut.visible = chainOut.visible = drained;
      ring.visible = wet.visible = drained; ringM.opacity = drained ? 0.8 : 0; wetM.opacity = drained ? 0.32 : 0; wet.material.opacity = drained ? 1 : 0;
    },
  };
  MAN.tub.set(false);
}
// the plug is out: the level drops, the water turning round over the drain, and what was under it shows
function drainTub() {
  const B = MAN.tub; if (!B || B.draining) return;
  B.draining = true;
  B.plugIn.visible = B.chainIn.visible = false; B.plugOut.visible = B.chainOut.visible = true;
  B.ring.visible = B.wet.visible = true; B.swirl.visible = true;
  const w = B.water, t0 = GAME.time, dur = 4.3;   // (on the game's clock: it waits while paused)
  SFX.gurgle(w.getWorldPosition(new THREE.Vector3()), dur);
  animate(() => {
    if (MAN.tub !== B) return false;   // (a new game was started)
    const k = Math.min(1, (GAME.time - t0) / dur), e = smoothstep(0, 1, k), lvl = lerp(B.wy, B.by + 0.004, e);
    w.position.y = lvl; w.material.opacity = 0.95 - 0.35 * smoothstep(0.82, 1, k);
    B.ringM.opacity = 0.8 * smoothstep(0.04, 0.3, k); B.wetM.opacity = 0.32 * smoothstep(0.1, 0.6, k); B.wet.material.opacity = smoothstep(0.75, 1, k);
    B.swirl.position.y = lvl + 0.008; B.swirl.rotation.z -= 0.22; B.swirl.scale.setScalar(0.5 + 0.7 * smoothstep(0.05, 0.4, k) * (1 - smoothstep(0.85, 1, k)));
    if (k < 1) return true;
    B.swirl.visible = false; B.draining = false; B.set(true);
    if (!STORY.hasGot('driver')) { MAN.props.driver.visible = true; UI.hint('水が抜けた。底に何か落ちている', 2800); }
    return false;
  });
}

/* ---------- the door, until you have seen it in the library ---------- */
const prevDoorHook3 = STORY.doorHook.bind(STORY);
STORY.doorHook = function (d) {
  if (d.id === 'corA_bath' && !this.flags.glimpse) return { prompt: '扉を調べる', use: () => EVENTS.bathDoor(d) };
  return prevDoorHook3(d);
};
const prevDoorShut3 = STORY.doorShut2;
STORY.doorShut2 = function (d) {
  if ((d.id === 'corA_bath' || d.id === 'bath') && !STORY.flags.glimpse) return true;
  return prevDoorShut3 ? prevDoorShut3.call(STORY, d) : false;
};
// it won't open; keep on at it and it gives
EVENTS.bathDoor = function (d) {
  const B = d.tries || (d.tries = { n: 0, t: -9 });
  if (GAME.time - B.t > 1.5) B.n = 0;
  B.n++; B.t = GAME.time;
  SFX.locked(d.center); jiggleDoor(d);
  if (B.n >= 7) { EVENTS.bathDeath(d); return; }
  UI.hint(B.n < 3 ? '開かない' : 'ガチャ　ガチャ……', 1400);
};
// the first time you look at the door: its shadow goes past behind the glass
TICK_HOOKS.push(() => {
  const f = STORY.flags;
  if (f.glimpse || f.bathShadow || !PLAYER.alive || GAME.busy || GAME.modal || GAME.cine || !GAME.room || GAME.room.id !== 'corA') return;
  const d = MAN.doors.corA_bath; if (!d || !d.glass) return;
  const v = tmpV.copy(d.center).sub(GAME.camPos), dist = v.length();
  if (dist > 9 || dist < 1.1 || v.normalize().dot(GAME.camDir) < 0.93) return;
  f.bathShadow = true;
  EVENTS.bathShadow(d);
});
EVENTS.bathShadow = function (d) {
  const t0 = performance.now(), dur = 2600, foot = d.center.clone().setY(d.center.y - 1.1);
  SFX.creak(d.center, 0.1, { dur: 0.9, f: 120, bp: 600, q: 4 });
  [0.25, 0.95, 1.65].forEach(s => setTimeout(() => SFX.oniStep(foot, 0.28), s * 1000));
  animate(() => { const k = (performance.now() - t0) / dur; if (MAN.doors.corA_bath !== d) return false; if (k >= 1) { glassPaint(d); return false; } glassPaint(d, { shadow: k }); return true; });
};
// in through the door: from behind, Hiroshi goes into the black; the door bangs shut; a second later the glass goes red
EVENTS.bathDeath = function (d) {
  if (!PLAYER.alive) return;
  GAME.busy = 1; STORY.busy = true; PLAYER.frozen = true; PLAYER.alive = false; GAME.caughtN = (GAME.caughtN || 0) + 1;
  dropChair(); stopPush(); GAME.lighterOn = false; MUSIC.stop(0.4); UI.hint('', 10);
  const into = new THREE.Vector3(d.front.x - d.center.x, 0, d.front.z - d.center.z).normalize(), side = new THREE.Vector3(-into.z, 0, into.x);
  const y0 = FLOORS[d.fl], base = new THREE.Vector3(d.center.x, y0, d.center.z);
  const p0 = base.clone().addScaledVector(into, 3.4).addScaledVector(side, -0.85).setY(y0 + 1.72), p1 = p0.clone().addScaledVector(into, -0.7).setY(y0 + 1.62);   // (from the latch side: the open leaf is not in the way)
  const cine = { pos: p0.clone(), look: base.clone().setY(y0 + 1.15) };
  const start = base.clone().addScaledVector(into, 1.05), end = base.clone().addScaledVector(into, -0.9);
  // the pool that comes out under the door afterwards
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: poolTex(), transparent: true, alphaTest: 0.4, roughness: 0.08, metalness: 0.15, envMap: ENV, envMapIntensity: 1.1, emissive: 0x2a0002, polygonOffset: true, polygonOffsetFactor: -2 }));
  pool.userData.ownMat = true; pool.rotation.x = -Math.PI / 2; pool.rotation.z = Math.atan2(into.x, into.z);   // (the top of its picture under the door)
  pool.visible = false; d.area.group.add(pool);
  const setPool = k => { pool.visible = k > 0; pool.scale.set(0.6 + 1.0 * k, 0.05 + 1.25 * k, 1); pool.position.set(base.x + into.x * (0.03 + 0.62 * k), 0.008, base.z + into.z * (0.03 + 0.62 * k)); };
  const H = CAST.get('hiroshi');
  GAME.fade(0.35, () => {
    GAME.cine = cine; releaseLock();
    UI.show('hud', false); UI.show('touch', false);
    CAST.place('hiroshi', start.x, y0, start.z, Math.atan2(-into.x, -into.z)); H.base = null;
  }, () => {
    const t0 = performance.now(); let st = 0, stepT = 0;
    if (d.dark) d.dark.visible = true;
    animate(() => {
      const t = (performance.now() - t0) / 1000;
      cine.pos.lerpVectors(p0, p1, smoothstep(0, 9, t));   // creeping closer all the while
      if (MAN.doors.corA_bath !== d) return false;   // (a new game was started)
      if (st === 0 && t > 0.5) { st = 1; SFX.locked(d.center); }
      if (st === 1 && t > 1.2) { st = 2; SFX.creak(d.center, 0.32, { dur: 1.1, f: 240, bp: 2200, q: 5 }); }
      const open = t < 1.2 ? 0 : t < 2.2 ? smoothstep(1.2, 2.2, t) * 1.2 : t < 3.9 ? 1.2 : Math.max(0, 1.2 * (1 - (t - 3.9) / 0.16));
      d.piv.rotation.y = d.piv.userData.baseRy - open - (t > 0.5 && t < 0.85 ? Math.abs(Math.sin((t - 0.5) * 120)) * 0.014 : 0);   // rattled, then open
      if (st === 2 && t > 2.0) { st = 3; H.moving = true; }
      if (st === 3) {
        const k = clamp((t - 2.0) / 1.7, 0, 1); H.m.position.lerpVectors(start, end, k);
        if (t - stepT > 0.42) { stepT = t; NET.stepAt(H.m.position.clone().setY(y0 + 0.1), d.area); }
        if (t > 3.75) { st = 4; H.moving = false; H.m.visible = false; }
      }
      if (st === 4 && t > 4.06) { st = 5; SFX.slam(d.center); POST.shake = 0.22; }
      if (st === 5 && t > 5.1) { st = 6; SFX.bathKill(d.center); POST.shake = 0.5; }   // a second of nothing first
      if (st >= 6) { glassPaint(d, { blood: clamp((t - 5.1) / 0.25, 0, 1), drip: clamp((t - 5.35) / 2.8, 0, 1) }); setPool(clamp((t - 5.6) / 3.4, 0, 1)); }
      if (st === 6 && t > 8.8) { st = 7; const b = $('fxBlack'); b.style.transition = 'opacity 1.4s'; b.style.opacity = 1; }
      if (st === 7 && t > 10.4) {
        if (d.dark) d.dark.visible = false;
        CAST.hide('hiroshi'); GAME.busy = 0; STORY.busy = false; PLAYER.frozen = false;
        UI.over(); $('overSub').innerHTML = '浴室の中に、何かがいた……<br><small>開かない扉は、無理に開けないほうがいい。</small>';
        return false;
      }
      return true;
    });
  });
};
