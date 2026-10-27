
/* =========================================================================
   Procedural textures (all generated on canvases — no external assets)
   ========================================================================= */
function makeNoise(seed, P = 64) {
  const r = new RNG(seed), g = new Float32Array(P * P);
  for (let i = 0; i < g.length; i++) g[i] = r.next();
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % P) + P) % P, x1 = (x0 + 1) % P, y0 = ((yi % P) + P) % P, y1 = (y0 + 1) % P;
    const a = g[y0 * P + x0], b = g[y0 * P + x1], c = g[y1 * P + x0], d = g[y1 * P + x1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
const NZ = makeNoise(11), NZ2 = makeNoise(29), NZ3 = makeNoise(53);
function fbm(n, x, y, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f); f *= 2; a *= 0.5; } return s / (1 - Math.pow(0.5, oct)); }

function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function toTex(c, srgb = true, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAniso();
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
function hexRGB(hex) { const c = new THREE.Color(hex); return [c.r * 255, c.g * 255, c.b * 255]; }
function rgbStr(r, g, b, a = 1) { return `rgba(${r | 0},${g | 0},${b | 0},${a})`; }
function shade(hex, k) { const [r, g, b] = hexRGB(hex); return rgbStr(r * k, g * k, b * k); }

/* Height array -> tangent space normal map texture */
function normalTex(H, w, h, strength = 2, wrap = true) {
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const at = (x, y) => {
    if (wrap) { x = (x + w) % w; y = (y + h) % h; } else { x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1); }
    return H[y * w + x];
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let nx = -(at(x + 1, y) - at(x - 1, y)) * strength, ny = (at(x, y + 1) - at(x, y - 1)) * strength, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * w + x) * 4;
    d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return toTex(c, false);
}
function grayTex(F, w, h) {
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let i = 0; i < w * h; i++) { const v = clamp(F[i], 0, 1) * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  return toTex(c, false);
}

/* ---- wood planks (floor) ---- */
function genWoodFloor(size, base = 0x5a3820, planks = 7, seed = 1) {
  const w = size, h = size, r = new RNG(seed);
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const H = new Float32Array(w * h), R = new Float32Array(w * h);
  const pw = w / planks;
  const offs = [], tints = [], boards = [];
  for (let i = 0; i < planks; i++) { offs.push(r.next() * h); tints.push(0.78 + r.next() * 0.36); boards.push(r.int(1, 2)); }
  const [br, bg, bb] = hexRGB(base);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const pi = Math.floor(x / pw), px = x - pi * pw;
    const len = h / boards[pi];
    const yy = (y + offs[pi]) % h;
    const seg = Math.floor(yy / len), sy = yy - seg * len;
    const st = tints[pi] * (0.92 + 0.16 * ((seg * 7919 + pi * 104729) % 97) / 97);
    const gn = fbm(NZ, (x / w) * 64 * 0.25 + pi * 3.1, (yy / h) * 64 * 0.03 + seg, 3);
    const ring = Math.sin((px * 0.35 + gn * 18 + Math.sin(yy * 0.01 + pi) * 6) * 0.9) * 0.5 + 0.5;
    const fine = NZ2((x / w) * 64 * 4, (yy / h) * 64 * 0.4);
    let k = st * (0.78 + 0.14 * ring + 0.1 * fine + 0.08 * gn);
    let hh = 0.6 + 0.05 * ring;
    const edge = Math.min(px, pw - px), jy = Math.min(sy, len - sy);
    if (edge < 1.6 || jy < 1.2) { k *= 0.32; hh = 0.1; } else if (edge < 3 || jy < 2.5) { k *= 0.75; hh = 0.4; }
    const i = (y * w + x);
    d[i * 4] = clamp(br * k, 0, 255); d[i * 4 + 1] = clamp(bg * k, 0, 255); d[i * 4 + 2] = clamp(bb * k, 0, 255); d[i * 4 + 3] = 255;
    H[i] = hh; R[i] = 0.42 + 0.25 * fine + (edge < 2 ? 0.3 : 0);
  }
  g.putImageData(img, 0, 0);
  return { map: toTex(c), normalMap: normalTex(H, w, h, 2.2), roughnessMap: grayTex(R, w, h) };
}

/* ---- generic wood grain for furniture ---- */
function genWoodGrain(size, base = 0x4a2a17, seed = 3, ringy = 1) {
  const w = size, h = size;
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const H = new Float32Array(w * h);
  const [br, bg, bb] = hexRGB(base);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = fbm(NZ3, x / w * 6 + seed, y / h * 48, 4);
    const ring = Math.sin(x / w * 90 * ringy + n * 14) * 0.5 + 0.5;
    const fine = NZ2(x / w * 200, y / h * 12);
    const k = 0.72 + 0.2 * ring + 0.14 * fine + 0.1 * n;
    const i = y * w + x;
    d[i * 4] = clamp(br * k, 0, 255); d[i * 4 + 1] = clamp(bg * k, 0, 255); d[i * 4 + 2] = clamp(bb * k, 0, 255); d[i * 4 + 3] = 255;
    H[i] = ring * 0.3 + fine * 0.2;
  }
  g.putImageData(img, 0, 0);
  return { map: toTex(c), normalMap: normalTex(H, w, h, 0.9) };
}

/* ---- wainscot raised panels (tile = 1 panel, 0.9m wide x 1.1m tall) ---- */
function genPanel(size, base = 0x3a2212) {
  const w = size / 2, h = size / 2;
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const H = new Float32Array(w * h);
  const [br, bg, bb] = hexRGB(base);
  const fx = 0.13 * w, fy = 0.12 * h, bev = 0.06 * w;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ex = Math.min(x, w - 1 - x), ey = Math.min(y, h - 1 - y);
    const e = Math.min((ex - fx), (ey - fy));
    let hh;
    if (e < 0) hh = 0.7;                       // frame
    else if (e < 3) hh = 0.25;                 // groove
    else if (e < 3 + bev) hh = 0.25 + (e - 3) / bev * 0.6; // bevel
    else hh = 0.85;                            // raised field
    const n = fbm(NZ3, x / w * 4, y / h * 30, 3);
    const ring = Math.sin(y / h * 70 + n * 10) * 0.5 + 0.5;
    let k = 0.75 + 0.18 * ring + 0.1 * n;
    if (e >= 0 && e < 3) k *= 0.5;
    if (e < 0 && (ex < 2 || ey < 2)) k *= 0.6;
    const i = y * w + x;
    d[i * 4] = clamp(br * k, 0, 255); d[i * 4 + 1] = clamp(bg * k, 0, 255); d[i * 4 + 2] = clamp(bb * k, 0, 255); d[i * 4 + 3] = 255;
    H[i] = hh + ring * 0.03;
  }
  g.putImageData(img, 0, 0);
  return { map: toTex(c), normalMap: normalTex(H, w, h, 3.2) };
}

/* ---- wallpaper ---- */
function drawDamask(g, cx, cy, s) {
  g.save(); g.translate(cx, cy);
  for (const m of [1, -1]) {
    g.save(); g.scale(m, 1);
    g.beginPath();
    g.moveTo(0, -s);
    g.bezierCurveTo(s * 0.18, -s * 0.78, s * 0.52, -s * 0.72, s * 0.5, -s * 0.42);
    g.bezierCurveTo(s * 0.48, -s * 0.22, s * 0.25, -s * 0.24, s * 0.22, -s * 0.38);
    g.bezierCurveTo(s * 0.32, -s * 0.36, s * 0.34, -s * 0.5, s * 0.24, -s * 0.52);
    g.bezierCurveTo(s * 0.12, -s * 0.5, s * 0.08, -s * 0.3, s * 0.18, -s * 0.16);
    g.bezierCurveTo(s * 0.42, s * 0.05, s * 0.62, -s * 0.05, s * 0.66, s * 0.2);
    g.bezierCurveTo(s * 0.7, s * 0.48, s * 0.4, s * 0.62, s * 0.2, s * 0.56);
    g.bezierCurveTo(s * 0.32, s * 0.72, s * 0.2, s * 0.9, 0, s);
    g.lineTo(0, -s);
    g.fill();
    g.beginPath(); g.ellipse(s * 0.62, -s * 0.72, s * 0.07, s * 0.16, 0.5, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(s * 0.82, s * 0.16, s * 0.06, s * 0.14, -0.3, 0, TAU); g.fill();
    g.restore();
  }
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.ellipse(0, 0, s * 0.1, s * 0.3, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(0, -s * 0.62, s * 0.05, s * 0.13, 0, 0, TAU); g.fill();
  g.globalCompositeOperation = 'source-over';
  g.beginPath(); g.ellipse(0, 0, s * 0.04, s * 0.14, 0, 0, TAU); g.fill();
  g.restore();
}
const WALLPAPERS = {
  green:   { a: 0x3f4d33, b: 0x2f3b25, line: 0x8a8150 },
  mustard: { a: 0x7d6a3e, b: 0x66552f, line: 0xb39a5c },
  red:     { a: 0x5a2420, b: 0x461a17, line: 0x9c6a3c },
  teal:    { a: 0x2f4a4c, b: 0x22383a, line: 0x7d9a8a },
  brown:   { a: 0x5b4130, b: 0x473224, line: 0x9b7a52 },
  cream:   { a: 0x8d7f63, b: 0x776a51, line: 0xb8a57b },
  plum:    { a: 0x4a2f40, b: 0x3a2333, line: 0x8f6c76 },
};
function genWallpaper(size, pal, style, seed = 7) {
  const w = size / 2, h = size / 2, r = new RNG(seed);
  const c = newCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = shade(pal.a, 1); g.fillRect(0, 0, w, h);
  if (style === 'damask') {
    g.fillStyle = shade(pal.b, 1);
    const s = w * 0.22;
    for (const [px, py] of [[0.5, 0.25], [0, 0.75], [1, 0.75], [0, -0.25], [1, -0.25], [0.5, 1.25]]) drawDamask(g, px * w, py * h, s);
    g.fillStyle = shade(pal.line, 0.55); g.globalAlpha = 0.5;
    for (const [px, py] of [[0, 0.25], [1, 0.25], [0.5, 0.75]]) { g.beginPath(); g.arc(px * w, py * h, w * 0.025, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  } else if (style === 'stripes') {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x0 = i * w / n;
      g.fillStyle = shade(i % 2 ? pal.b : pal.a, 1); g.fillRect(x0, 0, w / n, h);
      g.fillStyle = shade(pal.line, 0.8); g.globalAlpha = 0.35; g.fillRect(x0 + 2, 0, 1.5, h); g.globalAlpha = 1;
    }
    g.fillStyle = shade(pal.b, 0.8);
    for (let i = 0; i < n; i += 2) for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse((i + 0.5) * w / n, (j + 0.5) * h / 4, w * 0.02, h * 0.045, 0, 0, TAU); g.fill(); }
  } else if (style === 'harlequin') { // big diamonds in two tones (the Dining Hall)
    g.fillStyle = shade(pal.b, 0.85);
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.lineTo(0, h / 2); g.closePath(); g.fill();
    g.strokeStyle = shade(pal.line, 0.45); g.lineWidth = w * 0.012; g.globalAlpha = 0.6;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.lineTo(0, h / 2); g.closePath(); g.stroke();
    g.globalAlpha = 1;
  } else if (style === 'lattice') {
    g.strokeStyle = shade(pal.b, 0.9); g.lineWidth = w * 0.03;
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h);
    g.moveTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.lineTo(0, h / 2); g.closePath();
    g.stroke();
    g.fillStyle = shade(pal.line, 0.6);
    for (const [px, py] of [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]) { g.beginPath(); g.arc(px * w, py * h, w * 0.05, 0, TAU); g.fill(); }
    g.fillStyle = shade(pal.b, 1.05);
    for (const [px, py] of [[0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]]) { g.beginPath(); g.ellipse(px * w, py * h, w * 0.04, h * 0.08, 0, 0, TAU); g.fill(); }
  } else { // floral small repeat
    g.fillStyle = shade(pal.b, 1);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = (i + (j % 2) * 0.5) * w / 4, y = j * h / 4 + h / 8;
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * w * 0.03, y + Math.sin(a) * w * 0.03, w * 0.022, w * 0.012, a, 0, TAU); g.fill(); }
      g.beginPath(); g.ellipse(x + w * 0.0, y + h * 0.07, w * 0.008, h * 0.04, 0.4, 0, TAU); g.fill();
    }
  }
  // grime & ageing
  const img = g.getImageData(0, 0, w, h), d = img.data;
  const H = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const n = fbm(NZ, x / w * 8 + seed, y / h * 8, 4);
    const fib = NZ2(x / w * 220, y / h * 30) * 0.06;
    const k = 0.84 + 0.22 * n + fib;
    d[i * 4] *= k; d[i * 4 + 1] *= k; d[i * 4 + 2] *= k;
    H[i] = (d[i * 4] + d[i * 4 + 1]) / 510 * 0.6 + fib;
  }
  g.putImageData(img, 0, 0);
  return { map: toTex(c), normalMap: normalTex(H, w, h, 1.2) };
}

/* ---- carpet / rugs ---- */
function genRunner(size) {
  const w = size / 4, h = size / 2;
  const c = newCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = '#5c1010'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7a1a16';
  for (let j = 0; j < 8; j++) for (let i = 0; i < 3; i++) {
    const x = w * (0.3 + i * 0.2), y = (j + 0.5) * h / 8;
    g.beginPath(); g.moveTo(x, y - h / 30); g.lineTo(x + w / 18, y); g.lineTo(x, y + h / 30); g.lineTo(x - w / 18, y); g.closePath(); g.fill();
  }
  for (const side of [0, 1]) {
    const x0 = side ? w * 0.82 : 0;
    g.fillStyle = '#3a0b09'; g.fillRect(x0, 0, w * 0.18, h);
    g.fillStyle = '#a17431'; g.fillRect(x0 + (side ? 0 : w * 0.13), 0, w * 0.035, h);
    g.fillStyle = '#c9a052';
    for (let j = 0; j < 16; j++) { const y = (j + 0.5) * h / 16; g.beginPath(); g.arc(x0 + w * 0.07 + (side ? w * 0.04 : 0), y, w * 0.022, 0, TAU); g.fill(); }
  }
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, k = 0.85 + 0.25 * NZ2(x * 0.9, y * 0.9) + 0.1 * fbm(NZ, x / w * 4, y / h * 8, 3) - 0.1;
    d[i * 4] *= k; d[i * 4 + 1] *= k; d[i * 4 + 2] *= k;
  }
  g.putImageData(img, 0, 0);
  const t = toTex(c); return { map: t };
}
function genRug(size, seed) {
  const r = new RNG(seed), w = size / 2, h = size / 2;
  const pals = [['#2a1b3d', '#7a1f1f', '#c9a25c', '#1f3550'], ['#5a1414', '#1e2f4a', '#d7b46a', '#3b0c0c'], ['#173326', '#6d3b1a', '#c7a35a', '#0f2018'], ['#3a2412', '#8a2b1f', '#e0c27a', '#1c3a52']];
  const p = r.pick(pals);
  const c = newCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = p[0]; g.fillRect(0, 0, w, h);
  const bands = [[0.02, p[2]], [0.05, p[1]], [0.12, p[2]], [0.14, p[3]]];
  for (const [m, col] of bands) { g.strokeStyle = col; g.lineWidth = w * 0.02; g.strokeRect(w * m, h * m, w * (1 - 2 * m), h * (1 - 2 * m)); }
  g.fillStyle = p[1];
  g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.24, h * 0.3, 0, 0, TAU); g.fill();
  g.fillStyle = p[2];
  g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.12, h * 0.16, 0, 0, TAU); g.fill();
  g.fillStyle = p[3];
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * w * 0.18, h / 2 + Math.sin(a) * h * 0.22, w * 0.03, h * 0.05, a, 0, TAU); g.fill(); }
  for (const [px, py] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) { g.fillStyle = p[1]; g.beginPath(); g.arc(px * w, py * h, w * 0.06, 0, TAU); g.fill(); }
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, k = 0.8 + 0.3 * NZ2(x * 1.1, y * 1.1) + 0.1 * fbm(NZ, x / w * 5, y / h * 5, 3) - 0.08;
    d[i * 4] *= k; d[i * 4 + 1] *= k; d[i * 4 + 2] *= k;
  }
  g.putImageData(img, 0, 0);
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

/* ---- simple noise-tinted surfaces ---- */
function genNoiseSurface(size, base, var1 = 0.18, scale = 8, normalK = 1, extra = null) {
  const w = size / 2, h = size / 2;
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const H = new Float32Array(w * h);
  const [br, bg, bb] = hexRGB(base);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const n = fbm(NZ, x / w * scale, y / h * scale, 4), f = NZ2(x / w * scale * 12, y / h * scale * 12);
    let k = 1 - var1 + var1 * 2 * (0.7 * n + 0.3 * f);
    let hh = n * 0.6 + f * 0.4;
    if (extra) { const e = extra(x / w, y / h, n, f); k *= e[0]; hh = e[1] ?? hh; }
    d[i * 4] = clamp(br * k, 0, 255); d[i * 4 + 1] = clamp(bg * k, 0, 255); d[i * 4 + 2] = clamp(bb * k, 0, 255); d[i * 4 + 3] = 255;
    H[i] = hh;
  }
  g.putImageData(img, 0, 0);
  return { map: toTex(c), normalMap: normalTex(H, w, h, normalK) };
}
function genTilesColor(size, c1, c2, n = 4, checker = true) {
  const w = size / 2, h = size / 2;
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const H = new Float32Array(w * h);
  const A = hexRGB(c1), B = hexRGB(c2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, ix = Math.floor(u * n), iy = Math.floor(v * n), fx = u * n - ix, fy = v * n - iy;
    const grout = fx < 0.035 || fy < 0.035 || fx > 0.965 || fy > 0.965;
    const col = checker && (ix + iy) % 2 ? B : A;
    const nn = fbm(NZ, u * 8, v * 8, 3);
    const k = grout ? 0.45 : 0.9 + nn * 0.14;
    const i = y * w + x;
    d[i * 4] = col[0] * k; d[i * 4 + 1] = col[1] * k; d[i * 4 + 2] = col[2] * k; d[i * 4 + 3] = 255;
    H[i] = grout ? 0.1 : 0.8;
  }
  g.putImageData(img, 0, 0);
  return { map: toTex(c), normalMap: normalTex(H, w, h, 2.5) };
}
function genStoneBlocks(size, base = 0x6e6a62, rows = 4, cols = 2) {
  const w = size / 2, h = size / 2;
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const H = new Float32Array(w * h);
  const [br, bg, bb] = hexRGB(base);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = y / h * rows, row = Math.floor(v), fy = v - row;
    const u = x / w * cols + (row % 2) * 0.5, col = Math.floor(u), fx = u - col;
    const mort = fy < 0.012 * rows || fx < 0.0125 * cols;
    const n = fbm(NZ, x / w * 10, y / h * 10, 4);
    const t = 0.85 + ((col * 31 + row * 17) % 13) / 13 * 0.25;
    const k = mort ? 0.45 : t * (0.75 + n * 0.4);
    const i = y * w + x;
    d[i * 4] = clamp(br * k, 0, 255); d[i * 4 + 1] = clamp(bg * k, 0, 255); d[i * 4 + 2] = clamp(bb * k, 0, 255); d[i * 4 + 3] = 255;
    H[i] = mort ? 0 : 0.6 + n * 0.4;
  }
  g.putImageData(img, 0, 0);
  return { map: toTex(c), normalMap: normalTex(H, w, h, 2) };
}

/* ---- door leaf (front) ---- */
function genDoorTex(size, base = 0x4a2416) {
  const w = size / 4, h = size / 2;
  const c = newCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const H = new Float32Array(w * h);
  const [br, bg, bb] = hexRGB(base);
  const panels = [[0.14, 0.06, 0.86, 0.3], [0.14, 0.36, 0.86, 0.62], [0.14, 0.68, 0.86, 0.94]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    let hh = 0.7, inside = -1;
    for (const p of panels) {
      if (u > p[0] && u < p[2] && v > p[1] && v < p[3]) {
        const e = Math.min(u - p[0], p[2] - u, (v - p[1]) * h / w, (p[3] - v) * h / w);
        inside = e;
        if (e < 0.02) hh = 0.3; else if (e < 0.08) hh = 0.3 + (e - 0.02) / 0.06 * 0.55; else hh = 0.85;
      }
    }
    const n = fbm(NZ3, u * 5, v * 40, 4);
    const ring = Math.sin(v * 160 + n * 12) * 0.5 + 0.5;
    let k = 0.72 + 0.2 * ring + 0.12 * n;
    if (inside >= 0 && inside < 0.02) k *= 0.55;
    const i = y * w + x;
    d[i * 4] = clamp(br * k, 0, 255); d[i * 4 + 1] = clamp(bg * k, 0, 255); d[i * 4 + 2] = clamp(bb * k, 0, 255); d[i * 4 + 3] = 255;
    H[i] = hh + ring * 0.02;
  }
  g.putImageData(img, 0, 0);
  const map = toTex(c, true, false), normalMap = normalTex(H, w, h, 4, false);
  normalMap.wrapS = normalMap.wrapT = THREE.ClampToEdgeWrapping;
  return { map, normalMap };
}

/* ---- door number plaque ---- */
const PLAQUE_FONT = '"Oswald", "Times New Roman", serif';
function genPlaque(text) {
  const w = 256, h = 96, c = newCanvas(w, h), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#f6dc8e'); gr.addColorStop(0.45, '#c79a3f'); gr.addColorStop(1, '#7a5418');
  g.fillStyle = '#3b2708'; g.fillRect(0, 0, w, h);
  g.fillStyle = gr; g.fillRect(4, 4, w - 8, h - 8);
  g.strokeStyle = 'rgba(70,45,10,.9)'; g.lineWidth = 3; g.strokeRect(12, 12, w - 24, h - 24);
  g.fillStyle = '#26170a'; g.font = `600 58px ${PLAQUE_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 3);
  g.fillStyle = 'rgba(255,240,200,.35)'; g.fillText(text, w / 2 - 1, h / 2 + 1);
  g.fillStyle = '#26170a'; g.fillText(text, w / 2, h / 2 + 3);
  const t = toTex(c, true, false); return t;
}

/* ---- paintings ---- */
const PAINTING_NAMES = ['沈黙の湖', '名もなき肖像', '最後の晩餐会', '月夜の庭', '古い灯台', '眠れる森', '赤い部屋', '待つ人', '迷い子', '嵐の前', '果実と銀器', '帰らぬ船', '番人', '窓辺の婦人', '黄昏の丘', '鐘楼', '見知らぬ客', '静物：燭台', 'ホテルの創業者', '青い扉', '影の踊り', '冬の訪問者', '鏡の向こう', '五十年目の祝杯'];
function genPainting(seed) {
  const r = new RNG(seed), w = 192, h = 240, c = newCanvas(w, h), g = c.getContext('2d');
  const type = r.int(0, 3);
  if (type === 0) { // landscape
    const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
    const hue = r.range(15, 220);
    sky.addColorStop(0, `hsl(${hue},35%,${r.range(18, 40)}%)`); sky.addColorStop(1, `hsl(${hue + 20},40%,${r.range(45, 65)}%)`);
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 3; k++) {
      g.fillStyle = `hsl(${r.range(70, 140)},${r.range(15, 35)}%,${12 + k * 8}%)`;
      g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * (0.45 + k * 0.12) + Math.sin(x * 0.03 + k * 2 + r.next()) * 18);
      g.lineTo(w, h); g.fill();
    }
    g.fillStyle = 'rgba(255,240,200,.7)'; g.beginPath(); g.arc(r.range(30, w - 30), r.range(25, 70), r.range(8, 16), 0, TAU); g.fill();
  } else if (type === 1) { // portrait
    g.fillStyle = `hsl(${r.range(0, 60)},25%,${r.range(8, 16)}%)`; g.fillRect(0, 0, w, h);
    const sk = `hsl(${r.range(15, 30)},${r.range(25, 45)}%,${r.range(45, 65)}%)`;
    g.fillStyle = `hsl(${r.range(0, 360)},30%,${r.range(10, 25)}%)`;
    g.beginPath(); g.ellipse(w / 2, h * 0.95, w * 0.42, h * 0.32, 0, 0, TAU); g.fill();
    g.fillStyle = sk; g.beginPath(); g.ellipse(w / 2, h * 0.42, w * 0.17, h * 0.15, 0, 0, TAU); g.fill();
    g.fillStyle = `hsl(${r.range(15, 40)},30%,${r.range(5, 25)}%)`;
    g.beginPath(); g.ellipse(w / 2, h * 0.33, w * 0.19, h * 0.09, 0, Math.PI, TAU); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(w * 0.44, h * 0.42, 3, 0, TAU); g.arc(w * 0.56, h * 0.42, 3, 0, TAU); g.fill();
    if (r.chance(0.3)) { g.fillStyle = '#000'; g.fillRect(w * 0.4, h * 0.4, w * 0.2, h * 0.04); } // creepy censor bar
  } else if (type === 2) { // still life
    g.fillStyle = `hsl(${r.range(20, 50)},30%,${r.range(10, 20)}%)`; g.fillRect(0, 0, w, h);
    g.fillStyle = `hsl(${r.range(20, 40)},35%,25%)`; g.fillRect(0, h * 0.7, w, h * 0.3);
    for (let k = 0; k < 4; k++) { g.fillStyle = `hsl(${r.range(0, 120)},${r.range(40, 70)}%,${r.range(30, 55)}%)`; g.beginPath(); g.arc(w * (0.25 + k * 0.17), h * 0.66 - r.range(0, 20), r.range(10, 18), 0, TAU); g.fill(); }
    g.fillStyle = `hsl(${r.range(180, 240)},20%,40%)`; g.beginPath(); g.ellipse(w * 0.5, h * 0.48, 20, 38, 0, 0, TAU); g.fill();
  } else { // abstract / dark sea
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, `hsl(${r.range(180, 260)},40%,18%)`); gr.addColorStop(1, `hsl(${r.range(0, 40)},40%,22%)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 9; k++) { g.strokeStyle = `hsla(${r.range(0, 360)},40%,60%,.3)`; g.lineWidth = r.range(2, 9); g.beginPath(); g.moveTo(r.range(0, w), r.range(0, h)); g.bezierCurveTo(r.range(0, w), r.range(0, h), r.range(0, w), r.range(0, h), r.range(0, w), r.range(0, h)); g.stroke(); }
  }
  // varnish + craquelure
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, n = fbm(NZ, x / w * 6 + seed, y / h * 6, 3), cr = NZ2(x * 0.6, y * 0.6) > 0.92 ? 0.7 : 1;
    const vig = 1 - 0.55 * Math.pow(Math.hypot(x / w - 0.5, y / h - 0.5) * 1.6, 2);
    const k = (0.75 + 0.3 * n) * cr * vig;
    d[i] = d[i] * k * 1.05; d[i + 1] = d[i + 1] * k * 0.95; d[i + 2] = d[i + 2] * k * 0.75;
  }
  g.putImageData(img, 0, 0);
  return toTex(c, true, false);
}

/* ---- book spines (for shelves) ---- */
function genBooks(size, seed = 5) {
  const r = new RNG(seed), w = size / 2, h = size / 4;
  const c = newCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = '#120a05'; g.fillRect(0, 0, w, h);
  let x = 0;
  while (x < w) {
    const bw = r.range(7, 18), bh = h * r.range(0.72, 0.98);
    const hue = r.pick([0, 10, 25, 35, 120, 200, 220, 280, 45]);
    g.fillStyle = `hsl(${hue},${r.range(20, 50)}%,${r.range(12, 32)}%)`;
    g.fillRect(x, h - bh, bw - 1, bh);
    g.fillStyle = `rgba(210,170,90,${r.range(0.2, 0.6)})`;
    g.fillRect(x + 1, h - bh + bh * 0.12, bw - 3, 2); g.fillRect(x + 1, h - bh * 0.18, bw - 3, 2);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + bw - 3, h - bh, 2, bh);
    x += bw;
    if (r.chance(0.06)) x += r.range(4, 14);
  }
  return toTex(c);
}

/* ---- radial glow sprite ---- */
function genGlow(inner = 'rgba(255,220,160,1)', outer = 'rgba(255,140,40,0)') {
  const s = 128, c = newCanvas(s, s), g = c.getContext('2d');
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, inner); gr.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.45)')); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---- dark environment map so metals have something to reflect ---- */
function genEnvMap() {
  const w = 256, h = 128, c = newCanvas(w, h), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#3a2a1a'); gr.addColorStop(0.45, '#2a1d12'); gr.addColorStop(0.55, '#140d08'); gr.addColorStop(1, '#070504');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { const gg = g.createRadialGradient(i * 45 + 20, 40, 0, i * 45 + 20, 40, 18); gg.addColorStop(0, 'rgba(255,200,120,.9)'); gg.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = gg; g.fillRect(0, 0, w, h); }
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromEquirectangular(t); pm.dispose(); t.dispose();
  return rt.texture;
}

/* =========================================================================
   Material library
   ========================================================================= */
const MAT = {};
const TEX = {};
function std(params, tile = 1) { const m = new THREE.MeshStandardMaterial(params); m.userData.tile = tile; return m; }
let ENV = null;

async function buildMaterials(progress) {
  const S = Q().tex;
  const steps = [];
  const step = (fn) => steps.push(fn);
  step(() => { ENV = genEnvMap(); });
  step(() => { const t = genWoodFloor(S, 0x5b3a22, 7, 1); MAT.floor = std({ ...t, roughness: 1, metalness: 0, normalScale: new THREE.Vector2(0.8, 0.8) }, 2.2); });
  step(() => { const t = genWoodFloor(S, 0x6b4a2c, 9, 4); MAT.floorLight = std({ ...t, roughness: 1, normalScale: new THREE.Vector2(0.7, 0.7) }, 2.2); });
  step(() => { const t = genPanel(S, 0x3b2314); MAT.wainscot = std({ ...t, roughness: 0.55, normalScale: new THREE.Vector2(1, 1) }, 0.9); MAT.wainscot.userData.tileV = 1.4; });
  step(() => { const t = genWoodGrain(S / 2, 0x3c2213, 3); MAT.darkWood = std({ ...t, roughness: 0.5, normalScale: new THREE.Vector2(0.5, 0.5) }, 1.2); });
  step(() => { const t = genWoodGrain(S / 2, 0x5c3418, 9, 1.4); MAT.wood = std({ ...t, roughness: 0.55, normalScale: new THREE.Vector2(0.5, 0.5) }, 1.2); });
  step(() => { const t = genWoodGrain(S / 2, 0x6e4a2c, 17, 0.8); MAT.trim = std({ ...t, roughness: 0.6 }, 1); });
  step(() => { const t = genWoodGrain(S / 2, 0x8a6a45, 21, 1.1); MAT.crateWood = std({ ...t, roughness: 0.85 }, 0.8); });
  step(() => { const t = genNoiseSurface(S / 2, 0xcfc1a2, 0.08, 6, 0.6); MAT.ceiling = std({ ...t, roughness: 0.95 }, 2.5); MAT.plaster = std({ ...genNoiseSurface(S / 2, 0xb8aa8c, 0.1, 5, 0.6), roughness: 0.95 }, 2); });
  step(() => { const t = genRunner(S); MAT.runner = std({ ...t, roughness: 1 }, 1); });
  step(() => {
    TEX.wall = {};
    const styles = ['damask', 'stripes', 'lattice', 'floral'];
    for (const k of Object.keys(WALLPAPERS)) TEX.wall[k] = {};
    MAT.wall = {};
    for (const k of Object.keys(WALLPAPERS)) MAT.wall[k] = {};
    MAT._wallStyles = styles;
  });
  step(() => { const t = genDoorTex(S, 0x51281a); TEX.door = t; MAT.doorFront = std({ map: t.map, normalMap: t.normalMap, roughness: 0.5, normalScale: new THREE.Vector2(1, 1) }); });
  step(() => { const t = genTilesColor(S / 2, 0xd9d4c7, 0x2a2a2a, 4, true); MAT.tileCheck = std({ ...t, roughness: 0.25 }, 1.4); });
  step(() => { const t = genTilesColor(S / 2, 0xdfe6e2, 0xdfe6e2, 5, false); MAT.tileWhite = std({ ...t, roughness: 0.2 }, 1.2); });
  step(() => { const t = genTilesColor(S / 2, 0x8fa89a, 0x8fa89a, 6, false); MAT.tileGreen = std({ ...t, roughness: 0.3 }, 1.2); });
  step(() => { const t = genStoneBlocks(S, 0x77726a); MAT.stone = std({ ...t, roughness: 0.9 }, 2.4); });
  step(() => { const t = genStoneBlocks(S, 0x8a5a44, 10, 4); MAT.brick = std({ ...t, roughness: 0.92 }, 1.6); });
  step(() => { const t = genStoneBlocks(S, 0x9a8f80, 5, 2); MAT.cellarStone = std({ ...t, roughness: 0.9 }, 1.8); });
  step(() => { const t = genStoneBlocks(S, 0x8f9a90, 6, 3); MAT.cinder = std({ ...t, roughness: 0.92 }, 1.6); });
  step(() => { const t = genTilesColor(S / 2, 0x9a9c98, 0x9a9c98, 3, false); MAT.tileGray = std({ ...t, roughness: 0.6 }, 1.4); });
  step(() => { const t = genTilesColor(S / 2, 0x7a6f62, 0x7a6f62, 2, false); MAT.tileBrown = std({ ...t, roughness: 0.65 }, 1.2); });
  step(() => {
    const c = newCanvas(128, 32), g = c.getContext('2d'); g.fillStyle = '#e8c21a'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#141414';
    for (let x = -32; x < 160; x += 32) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, 32); g.fill(); }
    MAT.hazard = std({ map: toTex(c), roughness: 0.7 }, 1);
    const e = newCanvas(128, 48), h = e.getContext('2d'); h.fillStyle = '#0d7a34'; h.fillRect(0, 0, 128, 48); h.fillStyle = '#eaffef';
    h.font = '700 26px Oswald, sans-serif'; h.textBaseline = 'middle'; h.fillText('EXIT', 48, 25);
    h.beginPath(); h.arc(22, 12, 4, 0, TAU); h.fill(); h.fillRect(19, 16, 6, 13); h.fillRect(12, 20, 20, 3); h.fillRect(16, 28, 4, 12); h.fillRect(24, 28, 4, 12);
    const tx = toTex(e, true, false); MAT.exitSign = new THREE.MeshStandardMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 1.6, roughness: 0.5 });
  });
  step(() => { const t = genTilesColor(S / 2, 0xcfb090, 0xa3826a, 4, true); MAT.tileDining = std({ ...t, roughness: 0.45 }, 1.6); });
  step(() => { const t = genNoiseSurface(S / 2, 0x6d6a66, 0.2, 7, 0.8); MAT.concrete = std({ ...t, roughness: 0.92 }, 3); });
  step(() => { const t = genNoiseSurface(S / 2, 0x334a22, 0.35, 10, 1.6); MAT.grass = std({ ...t, roughness: 1 }, 2.5); });
  step(() => { const t = genNoiseSurface(S / 2, 0x3a2a1c, 0.3, 9, 1.2); MAT.dirt = std({ ...t, roughness: 1 }, 2); });
  step(() => { const t = genNoiseSurface(S / 2, 0x1f3417, 0.45, 14, 3); MAT.hedge = std({ ...t, roughness: 0.95 }, 1.4); });
  step(() => { const t = genNoiseSurface(S / 4, 0x8a1c1c, 0.22, 20, 0.6); MAT.velvetRed = std({ ...t, roughness: 0.92 }, 0.6); });
  step(() => { const t = genNoiseSurface(S / 4, 0x2b4a2e, 0.22, 20, 0.6); MAT.velvetGreen = std({ ...t, roughness: 0.92 }, 0.6); });
  step(() => { const t = genNoiseSurface(S / 4, 0x2a3350, 0.2, 20, 0.6); MAT.velvetBlue = std({ ...t, roughness: 0.92 }, 0.6); });
  step(() => { const t = genNoiseSurface(S / 4, 0xe6e0d2, 0.06, 18, 0.4); MAT.sheet = std({ ...t, roughness: 0.95 }, 0.8); });
  step(() => { const t = genNoiseSurface(S / 4, 0x6a1b1b, 0.15, 18, 0.5); MAT.blanket = std({ ...t, roughness: 0.95 }, 0.8); });
  step(() => { MAT.books = std({ map: genBooks(S, 5), roughness: 0.8 }, 1); MAT.books2 = std({ map: genBooks(S, 77), roughness: 0.8 }, 1); });
  step(() => {
    MAT.brass = std({ color: 0xc9a45c, metalness: 0.85, roughness: 0.32, envMap: ENV, envMapIntensity: 0.9 });
    MAT.iron = std({ color: 0x2b2b2d, metalness: 0.8, roughness: 0.45, envMap: ENV, envMapIntensity: 0.6 });
    MAT.steel = std({ color: 0x8c9196, metalness: 0.8, roughness: 0.35, envMap: ENV, envMapIntensity: 0.8 });
    MAT.black = std({ color: 0x050505, roughness: 0.9 });
    MAT.void = new THREE.MeshBasicMaterial({ color: 0x000000 });
    MAT.marble = std({ ...genNoiseSurface(S / 2, 0xd8d2c6, 0.12, 4, 0.3), roughness: 0.18, envMap: ENV, envMapIntensity: 0.3 }, 1.5);
    MAT.shade = std({ color: 0xf2d7a6, roughness: 0.9, emissive: 0xffb060, emissiveIntensity: 0.0, side: THREE.DoubleSide });
    MAT.glass = new THREE.MeshStandardMaterial({ color: 0x9fb7c0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.22, envMap: ENV, envMapIntensity: 1, depthWrite: false });
    MAT.water = new THREE.MeshStandardMaterial({ color: 0x0d1a22, roughness: 0.05, metalness: 0.6, envMap: ENV, envMapIntensity: 1.2 });
    MAT.paper = std({ color: 0xe8dcc0, roughness: 0.9 });
    MAT.potRed = std({ color: 0x8e2f22, roughness: 0.7 });
    MAT.rust = std({ color: 0x8a4a22, metalness: 0.6, roughness: 0.6, envMap: ENV, envMapIntensity: 0.4 });
    MAT.tanSteel = std({ color: 0xa8957a, metalness: 0.55, roughness: 0.55, envMap: ENV, envMapIntensity: 0.4 });
    MAT.tealSteel = std({ color: 0x2f5552, metalness: 0.7, roughness: 0.45, envMap: ENV, envMapIntensity: 0.6 });
    MAT.tube = std({ color: 0xdfeaf0, emissive: 0xdff2ff, emissiveIntensity: 2.2 });
    MAT.ivory = std({ color: 0xece6d6, roughness: 0.35 });
    MAT.piano = std({ color: 0x0b0b0e, roughness: 0.16, metalness: 0.15, envMap: ENV, envMapIntensity: 0.9 });
    MAT.nightGlass = std({ color: 0x0a1424, emissive: 0x13284a, emissiveIntensity: 0.45, roughness: 0.08, metalness: 0.4, envMap: ENV, envMapIntensity: 0.8 });
    MAT.barrel = std({ ...genWoodGrain(S / 4, 0x7a4a26, 31, 0.6), roughness: 0.7 }, 0.7);
    MAT.leaf = std({ color: 0x2d4a22, roughness: 0.85, side: THREE.DoubleSide });
    MAT.leafDark = std({ color: 0x1b2d15, roughness: 0.9, side: THREE.DoubleSide });
    MAT.pot = std({ color: 0x7a3d24, roughness: 0.8 });
    MAT.flesh = std({ color: 0x8a3a2a, roughness: 0.55 });
    MAT.goo = std({ color: 0x050505, roughness: 0.08, metalness: 0.3, envMap: ENV, envMapIntensity: 1.5 });
    MAT.redLamp = std({ color: 0x400000, emissive: 0xff2010, emissiveIntensity: 2 });
    MAT.metalPanel = std({ color: 0x4b5157, metalness: 0.6, roughness: 0.5, envMap: ENV, envMapIntensity: 0.5 });
    MAT.elevator = std({ color: 0x9a8a6a, metalness: 0.9, roughness: 0.3, envMap: ENV, envMapIntensity: 1 });
  });
  for (let i = 0; i < steps.length; i++) {
    steps[i]();
    progress && progress((i + 1) / steps.length);
    await new Promise(r => setTimeout(r, 0));
  }
}
function wallMat(pal, style) {
  if (!MAT.wall[pal][style]) {
    const t = genWallpaper(Q().tex, WALLPAPERS[pal], style, (pal.length * 31 + style.length * 7));
    MAT.wall[pal][style] = std({ ...t, roughness: 0.9, normalScale: new THREE.Vector2(0.6, 0.6) }, 0.95);
  }
  return MAT.wall[pal][style];
}
const _rugCache = [];
function rugMat(seed) {
  const k = seed % 6;
  if (!_rugCache[k]) _rugCache[k] = std({ map: genRug(Q().tex, k + 3), roughness: 1 }, 1);
  return _rugCache[k];
}
const _paintCache = new Map();
function paintingMat(seed) {
  const k = seed % 24;
  if (!_paintCache.has(k)) _paintCache.set(k, std({ map: genPainting(k * 97 + 13), roughness: 0.6 }));
  return _paintCache.get(k);
}
