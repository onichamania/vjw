
/* =========================================================================
   Geometry helpers, batching and the Room container
   ========================================================================= */
const _eul = new THREE.Euler();
function boxGeo(w, h, d, mat, uOff = 0, vOff = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const tu = (mat && mat.userData.tile) || 1, tv = (mat && (mat.userData.tileV || mat.userData.tile)) || 1;
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i;
    uv.setXY(k, (uv.getX(k) * dims[f][0] + uOff) / tu, (uv.getY(k) * dims[f][1] + vOff) / tv);
  }
  return g;
}
function scaleUV(g, su, sv) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; }

class Batch {
  constructor() { this.lists = new Map(); }
  add(geo, mat, matrix) {
    if (geo.index) { const ng = geo.toNonIndexed(); geo.dispose(); geo = ng; }
    for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.applyMatrix4(matrix);
    let l = this.lists.get(mat); if (!l) { l = []; this.lists.set(mat, l); }
    l.push(geo);
  }
  build(parent, shadows) {
    const out = [];
    for (const [mat, list] of this.lists) {
      const g = mergeGeometries(list, false);
      list.forEach(x => x.dispose());
      if (!g) continue;
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, mat);
      mesh.castShadow = shadows; mesh.receiveShadow = shadows;
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      parent.add(mesh); out.push(mesh);
    }
    this.lists.clear();
    return out;
  }
}

class Frame {
  constructor(room, x, y, z, ry = 0) {
    this.room = room; this.x = x; this.y = y; this.z = z; this.ry = ry;
    this.m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
  }
  _m(lx, ly, lz, rx = 0, ry = 0, rz = 0, s = null) {
    const m = new THREE.Matrix4().compose(tmpV.set(lx, ly, lz), tmpQ.setFromEuler(_eul.set(rx, ry, rz)), s ? tmpV2.set(s[0], s[1], s[2]) : V1);
    return this.m.clone().multiply(m);
  }
  box(w, h, d, mat, lx = 0, ly = 0, lz = 0, rx = 0, ry = 0, rz = 0) { this.room.batch.add(boxGeo(w, h, d, mat), mat, this._m(lx, ly, lz, rx, ry, rz)); return this; }
  geo(g, mat, lx = 0, ly = 0, lz = 0, rx = 0, ry = 0, rz = 0, s = null) { this.room.batch.add(g, mat, this._m(lx, ly, lz, rx, ry, rz, s)); return this; }
  cyl(rt, rb, h, mat, lx, ly, lz, seg = 12, rx = 0, ry = 0, rz = 0) { return this.geo(new THREE.CylinderGeometry(rt, rb, h, seg), mat, lx, ly, lz, rx, ry, rz); }
  sph(r, mat, lx, ly, lz, seg = 10, s = null) { return this.geo(new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.7 | 0)), mat, lx, ly, lz, 0, 0, 0, s); }
  pt(lx, ly, lz) { return new THREE.Vector3(lx, ly, lz).applyMatrix4(this.m); }
  collide(lx0, lx1, ly0, ly1, lz0, lz1, tag = 'furn') {
    const ps = [this.pt(lx0, 0, lz0), this.pt(lx1, 0, lz1), this.pt(lx0, 0, lz1), this.pt(lx1, 0, lz0)];
    return this.room.addCollider(Math.min(...ps.map(p => p.x)), Math.max(...ps.map(p => p.x)), this.y + ly0, this.y + ly1, Math.min(...ps.map(p => p.z)), Math.max(...ps.map(p => p.z)), tag);
  }
  dyn(obj, lx = 0, ly = 0, lz = 0, ry = 0) { obj.position.copy(this.pt(lx, ly, lz)); obj.rotation.y = this.ry + ry; this.room.group.add(obj); return obj; }
}

class Room {
  constructor(index, type) {
    this.index = index; this.type = type;
    this.group = new THREE.Group();
    this.batch = new Batch();
    this.colliders = []; this.floors = []; this.fixtures = []; this.interactables = []; this.hides = [];
    this.updaters = []; this.path = []; this.textures = []; this.statics = []; this.disposables = [];
    this.fy = 0; this.dark = false; this.exit = null; this.door = null; this.meta = {}; this.walls = {};
    this.wpos = new THREE.Vector3(); this.wyaw = 0; this.c = 1; this.s = 0;
    this.bounds = new THREE.Box3(); this.foot = null; this.surface = 'wood';
    this.entered = false; this.events = {};
  }
  setTransform(pos, yaw) {
    this.wpos.copy(pos); this.wyaw = yaw;
    this.c = Math.round(Math.cos(yaw)); this.s = Math.round(Math.sin(yaw));
    this.group.position.copy(pos); this.group.rotation.y = yaw;
  }
  toWorld(x, y, z, out = new THREE.Vector3()) { return out.set(x * this.c + z * this.s + this.wpos.x, y + this.wpos.y, -x * this.s + z * this.c + this.wpos.z); }
  toLocal(x, y, z, out = new THREE.Vector3()) { const dx = x - this.wpos.x, dz = z - this.wpos.z; return out.set(dx * this.c - dz * this.s, y - this.wpos.y, dx * this.s + dz * this.c); }
  worldYaw(localYaw) { return localYaw + this.wyaw; }
  addCollider(x0, x1, y0, y1, z0, z1, tag = 'wall') { const c = { lx0: x0, lx1: x1, y0, y1, lz0: z0, lz1: z1, tag, on: true, room: this }; this.colliders.push(c); return c; }
  addFloor(x0, x1, z0, z1, y0, y1 = y0, axis = null, from = 0, to = 1) { this.floors.push({ x0, x1, z0, z1, y0, y1, axis, from, to }); }
  addFixture(o) {
    const f = Object.assign({ room: this, color: new THREE.Color(0xffb46a), intensity: 5, range: 10, mats: [], state: 'on', level: 1, flickerUntil: 0, seed: Math.random() * 100, priority: 0, kind: 'lamp', shadow: true, pos: new THREE.Vector3(), glow: null }, o);
    if (!(f.color instanceof THREE.Color)) f.color = new THREE.Color(f.color);
    this.fixtures.push(f); return f;
  }
  addInteract(obj, ia) {
    ia.room = this; obj.userData.ia = ia;
    if (obj.userData.nid == null) obj.userData.nid = this.index + ':' + (this._nid = (this._nid || 0) + 1);   // the same on every player's screen (NET)
    obj.traverse(o => { if (o.isMesh) o.userData.iaRoot = obj; });
    this.interactables.push(obj); return obj;
  }
  finalize() {
    for (const c of this.colliders) this._colliderWorld(c);
    for (const f of this.fixtures) { if (f.local) this.toWorld(f.local.x, f.local.y, f.local.z, f.pos); }
    for (const h of this.hides) {
      h.cam = this.toWorld(h.camL.x, h.camL.y, h.camL.z); h.exitP = this.toWorld(h.exitL.x, h.exitL.y, h.exitL.z); h.yaw = this.worldYaw(h.yawL);
    }
    this.pathW = this.path.map(p => this.toWorld(p[0], p[1], p[2]));
    const f = this.foot;
    const a = this.toWorld(f.x0, f.y0, f.z0), b = this.toWorld(f.x1, f.y1, f.z1);
    this.bounds.min.set(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
    this.bounds.max.set(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
    this.statics = this.batch.build(this.group, Q().shadows > 0);
    this.group.updateMatrixWorld(true);
  }
  _colliderWorld(c) {
    const a = this.toWorld(c.lx0, 0, c.lz0, tmpV), ax = a.x, az = a.z, b = this.toWorld(c.lx1, 0, c.lz1, tmpV);
    c.x0 = Math.min(ax, b.x); c.x1 = Math.max(ax, b.x); c.z0 = Math.min(az, b.z); c.z1 = Math.max(az, b.z);
    c.wy0 = c.y0 + this.wpos.y; c.wy1 = c.y1 + this.wpos.y;
  }
  floorAt(wx, wz, feetY) { // returns best floor height (world) or null
    const l = this.toLocal(wx, 0, wz, tmpV3);
    let best = null;
    for (const f of this.floors) {
      if (l.x < f.x0 || l.x > f.x1 || l.z < f.z0 || l.z > f.z1) continue;
      let h = f.y0;
      if (f.axis) { const t = clamp(((f.axis === 'x' ? l.x : l.z) - f.from) / (f.to - f.from), 0, 1); h = lerp(f.y0, f.y1, t); }
      h += this.wpos.y;
      if (h <= feetY + 0.55 && (best === null || h > best)) best = h;
    }
    return best;
  }
  contains(p, pad = 0.05) {
    return p.x >= this.bounds.min.x - pad && p.x <= this.bounds.max.x + pad && p.z >= this.bounds.min.z - pad && p.z <= this.bounds.max.z + pad &&
      p.y >= this.bounds.min.y - 1 && p.y <= this.bounds.max.y + 1;
  }
  dispose() {
    scene.remove(this.group);
    this.group.traverse(o => { if (o.isMesh || o.isSprite) { if (o.geometry) o.geometry.dispose(); if (o.userData.ownMat) [].concat(o.material).forEach(m => m.dispose()); } });
    this.textures.forEach(t => t.dispose());
    this.disposables.forEach(d => d.dispose ? d.dispose() : d());
    for (const f of this.fixtures) f.mats.forEach(m => m.mat.dispose());
  }
}

/* =========================================================================
   Light fixtures
   ========================================================================= */
const GLOW_TEX = {};
function glowSprite(color = 0xffb060, size = 0.6, opacity = 0.55) {
  const key = color;
  if (!GLOW_TEX[key]) { const c = new THREE.Color(color); GLOW_TEX[key] = genGlow(`rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},1)`, `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},0)`); }
  const m = new THREE.SpriteMaterial({ map: GLOW_TEX[key], color: 0xffffff, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
  const s = new THREE.Sprite(m); s.scale.set(size, size, size); s.userData.ownMat = true; s.userData.baseOpacity = opacity;
  return s;
}
function emissiveMat(color = 0xffc070, intensity = 2.5, base = 0xf3dcb0) {
  return new THREE.MeshStandardMaterial({ color: base, emissive: color, emissiveIntensity: intensity, roughness: 0.8 });
}
function addSconce(room, x, y, z, ry, opt = {}) {
  const F = new Frame(room, x, y, z, ry);
  F.box(0.14, 0.26, 0.03, MAT.brass, 0, 0, 0.015);
  F.cyl(0.015, 0.015, 0.22, MAT.brass, 0, 0.03, 0.12, 6, Math.PI / 2, 0, 0);
  F.cyl(0.035, 0.03, 0.05, MAT.brass, 0, 0.06, 0.22, 10);
  const shadeMat = emissiveMat(0xff9e4a, 1.4, 0xf0d2a0); shadeMat.side = THREE.DoubleSide;
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 0.17, 14, 1, true), shadeMat);
  F.dyn(shade, 0, 0.17, 0.22);
  const bulbMat = emissiveMat(0xffd08a, 4, 0xffffff);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bulbMat); F.dyn(bulb, 0, 0.13, 0.22);
  const glow = glowSprite(0xffa050, 0.85, 0.35); F.dyn(glow, 0, 0.16, 0.24);
  const p = F.pt(0, 0.12, 0.38);
  return room.addFixture({ local: p, color: opt.color || 0xffad5c, intensity: opt.intensity || 3.2, range: opt.range || 8.5, mats: [{ mat: shadeMat, base: 1.4 }, { mat: bulbMat, base: 4 }], glow, kind: 'sconce' });
}
function addChandelier(room, x, ceilY, z, scale = 1, opt = {}) {
  const drop = 0.9 * scale, cy = ceilY - drop;
  const F = new Frame(room, x, cy, z, 0);
  F.cyl(0.012, 0.012, drop, MAT.brass, 0, drop / 2, 0, 5);
  F.cyl(0.12 * scale, 0.12 * scale, 0.02, MAT.brass, 0, drop - 0.01, 0, 12);
  F.cyl(0.03, 0.06, 0.5 * scale, MAT.brass, 0, 0, 0, 10);
  F.sph(0.08 * scale, MAT.brass, 0, -0.27 * scale, 0, 10);
  F.geo(new THREE.TorusGeometry(0.42 * scale, 0.018, 6, 28), MAT.brass, 0, -0.05, 0, Math.PI / 2, 0, 0);
  const n = opt.arms || 6, bulbMat = emissiveMat(0xffcf8a, 4.5, 0xffffff), cupMat = MAT.brass;
  const glowG = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, r = 0.42 * scale;
    const lx = Math.cos(a) * r, lz = Math.sin(a) * r;
    F.cyl(0.03, 0.02, 0.05, cupMat, lx, -0.02, lz, 8);
    F.cyl(0.018, 0.018, 0.12, MAT.sheet, lx, 0.06, lz, 6);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), bulbMat); b.scale.y = 1.6; F.dyn(b, lx, 0.15, lz);
    const gs = glowSprite(0xffb060, 0.45, 0.45); gs.position.copy(F.pt(lx, 0.15, lz)); glowG.add(gs);
    // dangling crystals
    F.geo(new THREE.OctahedronGeometry(0.025, 0), MAT.glass, Math.cos(a + 0.3) * r * 0.75, -0.18, Math.sin(a + 0.3) * r * 0.75, 0, 0, 0, [1, 2, 1]);
  }
  room.group.add(glowG);
  return room.addFixture({ local: F.pt(0, 0.05, 0), color: opt.color || 0xffb25e, intensity: opt.intensity || 9 * scale, range: opt.range || 13 * scale, mats: [{ mat: bulbMat, base: 4.5 }], glow: glowG, kind: 'chandelier' });
}
function addCeilingLamp(room, x, ceilY, z, opt = {}) {
  const F = new Frame(room, x, ceilY, z, 0);
  F.cyl(0.1, 0.1, 0.03, MAT.brass, 0, -0.015, 0, 12);
  const m = emissiveMat(0xffc27a, 2.2, 0xf6e6c8);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), m);
  F.dyn(dome, 0, -0.03, 0);
  const glow = glowSprite(0xffb060, 1.2, 0.3); F.dyn(glow, 0, -0.12, 0);
  return room.addFixture({ local: F.pt(0, -0.3, 0), color: opt.color || 0xffb873, intensity: opt.intensity || 6, range: opt.range || 10, mats: [{ mat: m, base: 2.2 }], glow, kind: 'ceiling' });
}
function addBulb(room, x, ceilY, z, opt = {}) {
  const drop = opt.drop || 0.7;
  const F = new Frame(room, x, ceilY, z, 0);
  F.cyl(0.006, 0.006, drop, MAT.black, 0, -drop / 2, 0, 4);
  F.cyl(0.03, 0.03, 0.06, MAT.iron, 0, -drop - 0.02, 0, 8);
  const m = emissiveMat(0xffd9a0, 5, 0xffffff);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), m); F.dyn(b, 0, -drop - 0.09, 0);
  const glow = glowSprite(0xffc070, 0.9, 0.5); F.dyn(glow, 0, -drop - 0.09, 0);
  return room.addFixture({ local: F.pt(0, -drop - 0.12, 0), color: opt.color || 0xffc285, intensity: opt.intensity || 4.5, range: opt.range || 9, mats: [{ mat: m, base: 5 }], glow, kind: 'bulb' });
}
function addTableLamp(room, F, lx, ly, lz, opt = {}) {
  F.cyl(0.07, 0.09, 0.03, MAT.brass, lx, ly + 0.015, lz, 12);
  F.cyl(0.015, 0.015, 0.3, MAT.brass, lx, ly + 0.17, lz, 6);
  const m = emissiveMat(0xffa850, 1.6, 0xf2dcb0); m.side = THREE.DoubleSide;
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 0.2, 14, 1, true), m); F.dyn(sh, lx, ly + 0.38, lz);
  const glow = glowSprite(0xffa050, 0.7, 0.3); F.dyn(glow, lx, ly + 0.36, lz);
  return room.addFixture({ local: F.pt(lx, ly + 0.36, lz), color: 0xffa95a, intensity: opt.intensity || 1.6, range: 5, mats: [{ mat: m, base: 1.6 }], glow, kind: 'table', shadow: false });
}

/* =========================================================================
   Items (world pickups and hotbar definitions)
   ========================================================================= */
const ITEM_DEF = {
  key:       { name: '鍵', color: '#d9b25a' },
  lighter:   { name: 'ライター', color: '#c33' },
  flashlight:{ name: '懐中電灯', color: '#777' },
  vitamins:  { name: 'ビタミン', color: '#f39a2b' },
  bandage:   { name: '包帯', color: '#eee' },
  lockpick:  { name: 'ロックピック', color: '#9aa' },
  skeleton:  { name: 'スケルトンキー', color: '#556' },
  crucifix:  { name: '十字架', color: '#ddd' },
  battery:   { name: '電池', color: '#3c6' },
  hint:      { name: '図書館のヒント', color: '#e8dcc0' },
  ekey:      { name: '電気室の鍵', color: '#9fb8d0' },
};
const ICONS = {
  key: '<svg viewBox="0 0 40 40"><circle cx="12" cy="20" r="7" fill="none" stroke="#e7c264" stroke-width="4"/><path d="M19 20h17M30 20v6M35 20v5" stroke="#e7c264" stroke-width="4" stroke-linecap="round"/></svg>',
  lighter: '<svg viewBox="0 0 40 40"><rect x="13" y="15" width="14" height="20" rx="2" fill="#b8302a"/><rect x="13" y="10" width="14" height="6" fill="#bbb"/><path d="M22 3c3 4 3 6 0 8-3-2-3-4 0-8z" fill="#ffb347"/></svg>',
  flashlight: '<svg viewBox="0 0 40 40"><rect x="6" y="16" width="20" height="9" rx="2" fill="#3a3a3a"/><path d="M26 13h6v15h-6z" fill="#555"/><path d="M32 14l6-4v21l-6-4z" fill="#ffe9a6" opacity=".8"/></svg>',
  vitamins: '<svg viewBox="0 0 40 40"><rect x="12" y="12" width="16" height="23" rx="3" fill="#f39a2b"/><rect x="11" y="6" width="18" height="7" rx="2" fill="#eee"/><rect x="15" y="18" width="10" height="9" fill="#fff" opacity=".8"/></svg>',
  bandage: '<svg viewBox="0 0 40 40"><rect x="5" y="14" width="30" height="12" rx="6" fill="#efe6d6" transform="rotate(-30 20 20)"/><rect x="15" y="14" width="10" height="12" fill="#d8cdbb" transform="rotate(-30 20 20)"/></svg>',
  lockpick: '<svg viewBox="0 0 40 40"><path d="M6 32L28 10" stroke="#aab" stroke-width="3"/><path d="M28 10l5-3M10 34L32 12" stroke="#889" stroke-width="2"/><rect x="3" y="30" width="8" height="6" rx="2" fill="#654"/></svg>',
  skeleton: '<svg viewBox="0 0 40 40"><circle cx="11" cy="20" r="7" fill="none" stroke="#8a8fa8" stroke-width="3"/><circle cx="11" cy="20" r="2" fill="#8a8fa8"/><path d="M18 20h18M28 20v7M33 20v5" stroke="#8a8fa8" stroke-width="3"/></svg>',
  crucifix: '<svg viewBox="0 0 40 40"><path d="M20 4v32M11 13h18" stroke="#e8e2d0" stroke-width="5" stroke-linecap="round"/></svg>',
  battery: '<svg viewBox="0 0 40 40"><rect x="10" y="9" width="20" height="27" rx="3" fill="#2e8b4e"/><rect x="16" y="5" width="8" height="5" fill="#ccc"/><path d="M22 14l-5 9h5l-3 8 7-11h-5l3-6z" fill="#fff"/></svg>',
  hint: '<svg viewBox="0 0 40 40"><path d="M8 6h20l5 5v24H8z" fill="#e8dcc0"/><path d="M12 15h16M12 20h16M12 25h12" stroke="#7a6a4a" stroke-width="2"/></svg>',
  ekey: '<svg viewBox="0 0 40 40"><path d="M12 13l6 0 3 5-3 5h-6l-3-5z" fill="none" stroke="#a9c4dc" stroke-width="3.5"/><path d="M21 18h15M30 18v6M35 18v5" stroke="#a9c4dc" stroke-width="3.5" stroke-linecap="round"/></svg>',
  gold: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="13" fill="#e9b843"/><circle cx="20" cy="20" r="9" fill="none" stroke="#a37819" stroke-width="2"/></svg>',
};
const GOLDMAT = () => MAT.goldCoin || (MAT.goldCoin = std({ color: 0xe8b442, metalness: 1, roughness: 0.28, envMap: ENV, envMapIntensity: 1.4, emissive: 0x3a2400, emissiveIntensity: 0.3 }));
function makeItemMesh(type, extra) {
  const g = new THREE.Group();
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
  switch (type) {
    case 'gold': {
      const n = clamp(Math.round((extra || 10) / 3), 3, 12);
      for (let i = 0; i < n; i++) add(new THREE.CylinderGeometry(0.028, 0.028, 0.007, 12), GOLDMAT(), (Math.random() - 0.5) * 0.12, 0.004 + Math.floor(i / 4) * 0.007, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), GOLDMAT(), 0.02, 0.025, 0.01);
      break;
    }
    case 'key': {
      add(new THREE.TorusGeometry(0.03, 0.009, 6, 14), MAT.brass, -0.06, 0.01, 0, Math.PI / 2);
      add(new THREE.BoxGeometry(0.11, 0.012, 0.014), MAT.brass, 0.025, 0.01, 0);
      add(new THREE.BoxGeometry(0.012, 0.012, 0.03), MAT.brass, 0.06, 0.01, 0.018);
      add(new THREE.BoxGeometry(0.012, 0.012, 0.022), MAT.brass, 0.075, 0.01, 0.014);
      break;
    }
    case 'ekey': {
      add(new THREE.TorusGeometry(0.032, 0.01, 4, 6), MAT.steel, -0.06, 0.01, 0, Math.PI / 2);
      add(new THREE.BoxGeometry(0.11, 0.012, 0.014), MAT.steel, 0.025, 0.01, 0, 0, 0.08, 0);
      add(new THREE.BoxGeometry(0.012, 0.012, 0.03), MAT.steel, 0.06, 0.01, 0.018);
      add(new THREE.BoxGeometry(0.012, 0.012, 0.022), MAT.steel, 0.075, 0.01, 0.014);
      break;
    }
    case 'skeleton': {
      add(new THREE.TorusGeometry(0.035, 0.008, 6, 14), MAT.iron, -0.07, 0.01, 0, Math.PI / 2);
      add(new THREE.BoxGeometry(0.13, 0.012, 0.012), MAT.iron, 0.03, 0.01, 0);
      add(new THREE.BoxGeometry(0.012, 0.012, 0.035), MAT.iron, 0.085, 0.01, 0.02);
      break;
    }
    case 'lighter': {
      add(new THREE.BoxGeometry(0.04, 0.065, 0.018), std({ color: 0x6a1a14, roughness: 0.45, metalness: 0.3, envMap: ENV, envMapIntensity: 0.6 }), 0, 0.033, 0);
      add(new THREE.BoxGeometry(0.04, 0.018, 0.018), MAT.steel, 0, 0.074, 0);
      break;
    }
    case 'flashlight': {
      add(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 10), std({ color: 0x222222, roughness: 0.5, metalness: 0.5 }), 0, 0.02, 0, 0, 0, Math.PI / 2);
      add(new THREE.CylinderGeometry(0.032, 0.022, 0.05, 12), MAT.steel, 0.1, 0.02, 0, 0, 0, Math.PI / 2);
      break;
    }
    case 'vitamins': {
      add(new THREE.CylinderGeometry(0.028, 0.028, 0.08, 12), std({ color: 0xf08a1a, roughness: 0.3 }), 0, 0.04, 0);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.022, 12), std({ color: 0xeeeeee, roughness: 0.5 }), 0, 0.09, 0);
      break;
    }
    case 'bandage': add(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 14), std({ color: 0xece2d0, roughness: 0.95 }), 0, 0.035, 0, 0, 0, Math.PI / 2); break;
    case 'battery': {
      add(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 10), std({ color: 0x2e8b4e, roughness: 0.4, metalness: 0.3 }), 0, 0.016, 0, 0, 0, Math.PI / 2);
      add(new THREE.CylinderGeometry(0.006, 0.006, 0.008, 6), MAT.steel, 0.039, 0.016, 0, 0, 0, Math.PI / 2);
      break;
    }
    case 'lockpick': {
      for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(0.12, 0.004, 0.006), MAT.steel, 0, 0.005 + i * 0.004, (i - 1) * 0.012, 0, (i - 1) * 0.15, 0);
      add(new THREE.BoxGeometry(0.04, 0.015, 0.03), std({ color: 0x5a4030 }), -0.06, 0.008, 0);
      break;
    }
    case 'crucifix': {
      const m = std({ color: 0xd9d2c0, metalness: 0.6, roughness: 0.3, envMap: ENV });
      add(new THREE.BoxGeometry(0.02, 0.14, 0.012), m, 0, 0.07, 0); add(new THREE.BoxGeometry(0.08, 0.02, 0.012), m, 0, 0.1, 0);
      break;
    }
    case 'book': {
      const m = std({ color: extra?.color || 0x2a4a7a, roughness: 0.7, emissive: 0x2a4a9a, emissiveIntensity: 0.25 });
      add(new THREE.BoxGeometry(0.05, 0.26, 0.19), m, 0, 0.13, 0);
      add(new THREE.BoxGeometry(0.045, 0.25, 0.18), MAT.paper, 0.004, 0.13, 0);
      break;
    }
    case 'breaker': {
      add(new THREE.BoxGeometry(0.06, 0.1, 0.05), std({ color: 0x222222, roughness: 0.6 }), 0, 0.05, 0);
      add(new THREE.BoxGeometry(0.02, 0.04, 0.03), std({ color: 0xf2c418, emissive: 0x6a5000, emissiveIntensity: 0.6 }), 0, 0.08, 0.03);
      break;
    }
    case 'paper': add(new THREE.PlaneGeometry(0.2, 0.27), std({ color: 0xece0c2, roughness: 0.9, side: THREE.DoubleSide }), 0, 0.003, 0, -Math.PI / 2); break;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}

/* =========================================================================
   Doors
   ========================================================================= */
const DOOR_W = 1.68, DOOR_H = 2.65, DOOR_GAP = DOOR_W + 0.3;
let _doorLeafGeo = null, _doorEdge = null;
function buildExitDoor(room, x, y, z, ry, number, opt = {}) {
  const F = new Frame(room, x, y, z, ry);
  F.box(0.15, DOOR_H + 0.16, 0.34, MAT.trim, -DOOR_W / 2 - 0.075, (DOOR_H + 0.16) / 2, 0);
  F.box(0.15, DOOR_H + 0.16, 0.34, MAT.trim, DOOR_W / 2 + 0.075, (DOOR_H + 0.16) / 2, 0);
  F.box(DOOR_W + 0.3, 0.18, 0.34, MAT.trim, 0, DOOR_H + 0.09, 0);
  F.box(DOOR_W + 0.44, 0.06, 0.38, MAT.trim, 0, DOOR_H + 0.21, 0);
  // hinged on the right as you approach (handle on the left); it swings away from you into the next room
  const pivot = new THREE.Group();
  F.dyn(pivot, DOOR_W / 2, 0, 0);
  pivot.userData.baseRy = pivot.rotation.y;
  if (!_doorLeafGeo) {
    _doorLeafGeo = new THREE.BoxGeometry(DOOR_W - 0.02, DOOR_H - 0.02, 0.09);
    _doorEdge = std({ color: 0x3a1c10, roughness: 0.6 });
  }
  const leaf = new THREE.Mesh(_doorLeafGeo, [_doorEdge, _doorEdge, _doorEdge, _doorEdge, MAT.doorFront, MAT.doorFront]);
  leaf.position.set(-DOOR_W / 2, DOOR_H / 2, 0); leaf.castShadow = true; leaf.receiveShadow = true;
  pivot.add(leaf);
  for (const s of [1, -1]) { // lever handle on a backplate
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.012), MAT.brass); pl.position.set(-(DOOR_W - 0.16), 1.12, 0.05 * s); pivot.add(pl);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 8), MAT.brass); st.rotation.x = Math.PI / 2; st.position.set(-(DOOR_W - 0.16), 1.16, 0.08 * s); pivot.add(st);
    const lv = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.03, 0.03), MAT.brass); lv.position.set(-(DOOR_W - 0.23), 1.16, 0.11 * s); pivot.add(lv);
  }
  let plaqueTex = null;
  if (number != null) {
    plaqueTex = genPlaque(typeof number === 'number' ? pad4(number) : number); room.textures.push(plaqueTex);
    const pm = new THREE.MeshStandardMaterial({ map: plaqueTex, metalness: 0.6, roughness: 0.35, envMap: ENV, envMapIntensity: 1, emissive: 0xffd28a, emissiveMap: plaqueTex, emissiveIntensity: 0.22 });
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.17), pm); plaque.userData.ownMat = true;
    plaque.position.set(-DOOR_W / 2, DOOR_H * 0.75, 0.047); plaque.scale.set(1.65, 1.95, 1); pivot.add(plaque);
  }
  const collider = F.collide(-DOOR_W / 2, DOOR_W / 2, 0, DOOR_H, -0.07, 0.07, 'door');
  const door = {
    room, pivot, leaf, number, F, open: false, openT: 0, locked: !!opt.locked, lockType: opt.lockType || (opt.locked ? 'key' : null),
    collider, padlock: null, swing: opt.swing || -1.75, center: F.pt(0, 1.2, 0), slam: false, auto: !!opt.auto, onOpen: null,
  };
  if (door.locked) {
    // padlock hanging from the handle: silver shackle, dark body with a big keyhole
    const lock = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.05), MAT.iron); lock.add(body);
    const hole = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.01), MAT.black); hole.position.set(0, -0.01, 0.027); lock.add(hole);
    const sh = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 6, 14, Math.PI), MAT.steel); sh.position.y = 0.065; lock.add(sh);
    lock.position.set(-(DOOR_W - 0.2), 1.02, 0.12); pivot.add(lock); door.padlock = lock;
  }
  room.door = door;
  room.addInteract(leaf, {
    dist: 2.6,
    prompt: () => {
      if (door.open) return null;
      if (door.locked) {
        if (door.lockType === 'padlock') return '南京錠を調べる';
        if (door.lockType === 'elevator') return null;
        if (GAME && GAME.hasItem('key')) return '鍵を開ける';
        if (GAME && GAME.hasItem('skeleton')) return 'スケルトンキーで開ける';
        if (GAME && GAME.hasItem('lockpick')) return 'ロックピックで開ける';
        return '鍵がかかっている';
      }
      return door.auto ? null : '開ける';
    },
    use: () => GAME.useDoor(door),
  });
  return door;
}
function openDoor(door, silent = false, remote = false) {   // remote: another player opened it (online)
  if (door.open) return;
  door.open = true; door.collider.on = false;
  if (!silent) SFX.door(door.center.clone().applyMatrix4(door.room.group.matrixWorld), door.auto ? 0.65 : 1.15);
  if (door.onOpen) door.onOpen();
  if (GAME) GAME.onDoorOpened(door, remote);
}
function updateDoor(door, dt) {
  const target = door.open ? 1 : 0;
  if (door.openT !== target) {
    const sp = door.open ? (door.auto ? 1.6 : 0.85) : 6;
    door.openT = door.open ? Math.min(1, door.openT + dt * sp) : Math.max(0, door.openT - dt * sp);
    const e = door.open ? smoothstep(0, 1, door.openT) : door.openT;
    door.pivot.rotation.y = door.pivot.userData.baseRy + e * door.swing;
  }
}

/* =========================================================================
   Furniture
   ========================================================================= */
function addWardrobe(room, x, z, ry, opt = {}) {
  const F = new Frame(room, x, room.fy, z, ry);
  const W = opt.w || 1.5, H = 2.75, D = 0.86, wood = opt.mat || MAT.darkWood;
  F.box(W, H - 0.1, 0.04, wood, 0, (H - 0.1) / 2 + 0.08, -D / 2 + 0.02);
  F.box(0.05, H - 0.1, D, wood, -W / 2 + 0.025, (H - 0.1) / 2 + 0.08, 0);
  F.box(0.05, H - 0.1, D, wood, W / 2 - 0.025, (H - 0.1) / 2 + 0.08, 0);
  F.box(W + 0.08, 0.1, D + 0.06, wood, 0, H + 0.0, 0.0);
  F.box(W + 0.14, 0.05, D + 0.1, MAT.trim, 0, H + 0.07, 0.01);
  F.box(W, 0.1, D, wood, 0, 0.05, 0);
  F.box(W - 0.1, 0.02, D - 0.06, MAT.black, 0, 0.11, 0);
  F.box(W - 0.1, H - 0.2, 0.02, MAT.black, 0, H / 2, -D / 2 + 0.05);
  F.cyl(0.012, 0.012, W - 0.12, MAT.brass, 0, H - 0.25, -0.05, 6, 0, 0, Math.PI / 2);
  const doors = [];
  for (const side of [-1, 1]) {
    const piv = new THREE.Group();
    F.dyn(piv, side * (W / 2 - 0.04), 0, D / 2 - 0.02);
    piv.userData.baseRy = piv.rotation.y;
    const dw = W / 2 - 0.05;
    const leaf = new THREE.Mesh(boxGeo(dw, H - 0.2, 0.04, wood), wood);
    leaf.position.set(-side * dw / 2, H / 2 + 0.03, 0); leaf.castShadow = true;
    piv.add(leaf);
    const inset = new THREE.Mesh(boxGeo(dw - 0.14, 0.75, 0.012, wood), wood); inset.position.set(-side * dw / 2, H * 0.68, 0.025); piv.add(inset);
    const inset2 = inset.clone(); inset2.position.y = H * 0.3; piv.add(inset2);
    const kb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), MAT.brass); kb.position.set(-side * (dw - 0.07), H * 0.52, 0.04); piv.add(kb);
    doors.push(piv);
  }
  F.collide(-W / 2, W / 2, 0, H + 0.1, -D / 2, D / 2);
  const hide = { type: 'closet', room, camL: F.pt(0, 1.55, D / 2 - 0.1), exitL: F.pt(0, 0, D / 2 + 0.7), yawL: ry + Math.PI, doors, open: 0, jack: false, F, blockedUntil: 0 };
  room.hides.push(hide);
  for (const d of doors) room.addInteract(d, { dist: 2.4, prompt: () => (GAME.player.hidden ? null : (hide.blockedUntil > GAME.time ? null : '隠れる')), use: () => GAME.enterHide(hide) });
  return hide;
}
function addBed(room, x, z, ry, opt = {}) {
  const F = new Frame(room, x, room.fy, z, ry);
  const W = opt.double ? 1.9 : 1.3, L = 2.4, wood = MAT.darkWood;
  F.box(W + 0.1, 1.35, 0.1, wood, 0, 0.68, -L / 2);
  F.box(W + 0.14, 0.06, 0.14, MAT.trim, 0, 1.37, -L / 2);
  F.box(W + 0.1, 0.55, 0.08, wood, 0, 0.64, L / 2);
  F.box(0.06, 0.16, L, wood, -W / 2, 0.42, 0); F.box(0.06, 0.16, L, wood, W / 2, 0.42, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box(0.08, 0.38, 0.08, wood, sx * (W / 2 - 0.02), 0.19, sz * (L / 2 - 0.05));
  F.box(W - 0.04, 0.2, L - 0.12, MAT.sheet, 0, 0.6, 0);
  F.box(W - 0.02, 0.06, L * 0.62, opt.blanket || MAT.blanket, 0, 0.73, L * 0.17);
  F.box(W - 0.02 + 0.02, 0.4, 0.04, opt.blanket || MAT.blanket, 0, 0.55, L / 2 - 0.06 + 0.02);
  const pw = opt.double ? 0.65 : 0.8;
  for (const px of (opt.double ? [-0.4, 0.4] : [0])) F.geo(new THREE.SphereGeometry(0.5, 12, 8), MAT.sheet, px, 0.76, -L / 2 + 0.3, 0, 0, 0, [pw * 0.55, 0.12, 0.28]);
  F.collide(-W / 2 - 0.05, W / 2 + 0.05, 0, 1.4, -L / 2 - 0.06, L / 2 + 0.04);
  const hide = { type: 'bed', room, camL: F.pt(0, 0.2, 0.25), exitL: F.pt(0, 0, L / 2 + 0.75), yawL: ry + Math.PI, F, blockedUntil: 0 };
  room.hides.push(hide);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W, 0.75, L), new THREE.MeshBasicMaterial({ visible: false }));
  F.dyn(hit, 0, 0.38, 0);
  room.addInteract(hit, { dist: 2.4, prompt: () => (GAME.player.hidden ? null : '潜り込む'), use: () => GAME.enterHide(hide) });
  return hide;
}
function addDresser(room, x, z, ry, opt = {}) {
  const F = new Frame(room, x, room.fy, z, ry);
  const W = opt.w || 1.3, H = opt.h || 1.05, D = opt.d || 0.55, rows = opt.rows || 3, cols = opt.cols || (W > 1.1 ? 2 : 1);
  const wood = opt.mat || MAT.wood;
  F.box(W, H - 0.1, 0.03, wood, 0, (H - 0.1) / 2 + 0.08, -D / 2 + 0.015);
  F.box(0.04, H - 0.08, D, wood, -W / 2 + 0.02, (H - 0.08) / 2 + 0.06, 0);
  F.box(0.04, H - 0.08, D, wood, W / 2 - 0.02, (H - 0.08) / 2 + 0.06, 0);
  F.box(W + 0.06, 0.04, D + 0.04, opt.top || MAT.darkWood, 0, H, 0.01);
  F.box(W, 0.08, D - 0.02, MAT.darkWood, 0, 0.04, 0);
  for (const sx of [-1, 1]) F.box(0.06, 0.06, 0.06, MAT.darkWood, sx * (W / 2 - 0.05), 0.03, D / 2 - 0.05);
  F.box(W - 0.08, H - 0.16, 0.01, MAT.black, 0, H / 2 + 0.02, -D / 2 + 0.04);
  F.collide(-W / 2, W / 2, 0, H + 0.04, -D / 2, D / 2);
  const drawers = [];
  const dh = (H - 0.16) / rows, dw = (W - 0.08) / cols;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const g = new THREE.Group();
    const cx = -W / 2 + 0.04 + dw * (c + 0.5), cy = 0.1 + dh * (r + 0.5);
    F.dyn(g, cx, cy, 0);
    const front = new THREE.Mesh(boxGeo(dw - 0.02, dh - 0.02, 0.03, wood), wood); front.position.z = D / 2 - 0.015; front.castShadow = true; g.add(front);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), MAT.brass); knob.position.set(0, 0, D / 2 + 0.01); g.add(knob);
    const tray = new THREE.Mesh(boxGeo(dw - 0.06, 0.01, D - 0.06, MAT.wood), MAT.darkWood); tray.position.set(0, -dh / 2 + 0.03, 0); g.add(tray);
    for (const s of [-1, 1]) { const sd = new THREE.Mesh(boxGeo(0.01, dh * 0.6, D - 0.06, MAT.wood), MAT.darkWood); sd.position.set(s * (dw / 2 - 0.035), -dh / 2 + 0.03 + dh * 0.3, 0); g.add(sd); }
    const back = new THREE.Mesh(boxGeo(dw - 0.06, dh * 0.6, 0.01, MAT.wood), MAT.darkWood); back.position.set(0, -dh / 2 + 0.03 + dh * 0.3, -D / 2 + 0.06); g.add(back);
    const dr = { g, open: false, t: 0, base: g.position.clone(), dir: new THREE.Vector3(Math.sin(F.ry), 0, Math.cos(F.ry)), depth: D * 0.72, contents: null, filled: false, room, floorY: -dh / 2 + 0.035, w: dw, d: D, timothy: false };
    drawers.push(dr); g.userData.dr = dr;
    room.addInteract(g, { dist: 2.3, icon: 'loot', prompt: () => (dr.open ? (dr.contents && dr.contents.length ? null : '閉める') : '開ける'), use: () => GAME.toggleDrawer(dr) });
    room.updaters.push(dt => {
      const tgt = dr.open ? 1 : 0;
      if (dr.t !== tgt) { dr.t = dr.open ? Math.min(1, dr.t + dt * 4) : Math.max(0, dr.t - dt * 5); const e = 1 - Math.pow(1 - dr.t, 2); g.position.copy(dr.base).addScaledVector(dr.dir, e * dr.depth); }
    });
  }
  room.meta.drawers = (room.meta.drawers || []).concat(drawers);
  const top = { F, y: H + 0.02, w: W, d: D };
  room.meta.surfaces = (room.meta.surfaces || []).concat([top]);
  return { F, drawers, top, H };
}
function addNightstand(room, x, z, ry, lamp = true) {
  const d = addDresser(room, x, z, ry, { w: 0.55, h: 0.62, d: 0.45, rows: 2, cols: 1, mat: MAT.darkWood });
  if (lamp) addTableLamp(room, d.F, 0, d.H + 0.02, -0.02);
  return d;
}
function addTable(room, x, z, ry, w = 1.6, d = 0.9, h = 0.78, mat = MAT.wood, cloth = false) {
  const F = new Frame(room, x, room.fy, z, ry);
  F.box(w, 0.05, d, mat, 0, h - 0.025, 0);
  F.box(w - 0.1, 0.08, d - 0.1, MAT.darkWood, 0, h - 0.09, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.cyl(0.035, 0.025, h - 0.05, MAT.darkWood, sx * (w / 2 - 0.08), (h - 0.05) / 2, sz * (d / 2 - 0.08), 8);
  if (cloth) F.box(w * 0.4, 0.005, d + 0.06, MAT.sheet, 0, h + 0.003, 0);
  F.collide(-w / 2, w / 2, 0, h, -d / 2, d / 2);
  const top = { F, y: h, w, d };
  room.meta.surfaces = (room.meta.surfaces || []).concat([top]);
  return { F, top };
}
function addChair(room, x, z, ry, mat = MAT.velvetRed) {
  const F = new Frame(room, x, room.fy, z, ry);
  F.box(0.46, 0.06, 0.46, MAT.darkWood, 0, 0.46, 0);
  F.box(0.42, 0.06, 0.42, mat, 0, 0.5, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box(0.04, 0.46, 0.04, MAT.darkWood, sx * 0.2, 0.23, sz * 0.2);
  F.box(0.46, 0.55, 0.04, MAT.darkWood, 0, 0.78, -0.21);
  F.box(0.34, 0.4, 0.02, mat, 0, 0.78, -0.19);
  F.collide(-0.24, 0.24, 0, 0.9, -0.24, 0.24);
}
function addSofa(room, x, z, ry, mat = MAT.velvetGreen, w = 2.1) {
  const F = new Frame(room, x, room.fy, z, ry);
  F.box(w, 0.42, 0.85, mat, 0, 0.25, 0);
  F.box(w, 0.6, 0.22, mat, 0, 0.7, -0.33);
  for (const s of [-1, 1]) F.box(0.2, 0.62, 0.85, mat, s * (w / 2 - 0.1), 0.42, 0);
  for (let i = 0; i < 3; i++) F.box(w / 3 - 0.1, 0.12, 0.62, mat, -w / 3 + i * w / 3, 0.52, 0.06);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box(0.06, 0.06, 0.06, MAT.darkWood, sx * (w / 2 - 0.08), 0.03, sz * 0.36);
  F.collide(-w / 2, w / 2, 0, 1, -0.45, 0.43);
}
function addArmchair(room, x, z, ry, mat = MAT.velvetRed) { addSofa(room, x, z, ry, mat, 0.95); }
function addBookshelf(room, x, z, ry, w = 1.6, h = 2.5, opt = {}) {
  const F = new Frame(room, x, room.fy, z, ry);
  const D = 0.42, wood = opt.mat || MAT.darkWood, n = Math.max(3, Math.round(h / 0.45));
  F.box(w, h, 0.03, wood, 0, h / 2, -D / 2);
  F.box(0.05, h, D, wood, -w / 2, h / 2, 0); F.box(0.05, h, D, wood, w / 2, h / 2, 0);
  F.box(w + 0.08, 0.06, D + 0.06, wood, 0, h + 0.03, 0);
  const sh = (h - 0.12) / n;
  for (let i = 0; i <= n; i++) F.box(w - 0.05, 0.035, D, wood, 0, 0.08 + i * sh, 0);
  const bm = (x * 13 + z * 7) % 2 > 1 ? MAT.books : MAT.books2;
  for (let i = 0; i < n; i++) {
    if (opt.sparse && (i * 3 + Math.round(x)) % 4 === 0) continue;
    const pg = new THREE.PlaneGeometry(w - 0.08, sh - 0.04);
    scaleUV(pg, (w - 0.08) / 1.2, 1); const uv = pg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) + i * 0.37 + x * 0.1);
    F.geo(pg, bm, 0, 0.1 + i * sh + (sh - 0.04) / 2, 0.05);
  }
  F.collide(-w / 2 - 0.03, w / 2 + 0.03, 0, h, -D / 2, D / 2);
  return { F, n, sh, D, w, h };
}
function addPainting(room, x, y, z, ry, w = 0.8, h = 1, seed = 1) {
  const F = new Frame(room, x, y, z, ry);
  const fm = seed % 3 === 0 ? MAT.brass : MAT.trim;
  F.box(w + 0.12, 0.06, 0.05, fm, 0, h / 2 + 0.03, 0.025); F.box(w + 0.12, 0.06, 0.05, fm, 0, -h / 2 - 0.03, 0.025);
  F.box(0.06, h, 0.05, fm, -w / 2 - 0.03, 0, 0.025); F.box(0.06, h, 0.05, fm, w / 2 + 0.03, 0, 0.025);
  const pm = paintingMat(seed);
  F.geo(new THREE.PlaneGeometry(w, h), pm, 0, 0, 0.012);
  const hit = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ visible: false }));
  F.dyn(hit, 0, 0, 0.03);
  const name = PAINTING_NAMES[seed % PAINTING_NAMES.length];
  room.addInteract(hit, { dist: 3.2, prompt: () => `「${name}」`, use: () => {}, passive: true });
}
function addRug(room, x, z, w, d, ry = 0, seed = 1) {
  const F = new Frame(room, x, room.fy + 0.006, z, ry);
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  F.geo(g, rugMat(seed), 0, 0, 0);
}
function addRunner(room, x, z0, z1, w = 1.4, alongX = false) {
  const len = Math.abs(z1 - z0);
  const g = new THREE.PlaneGeometry(w, len); g.rotateX(-Math.PI / 2);
  scaleUV(g, 1, len / 2.8);
  const F = new Frame(room, alongX ? (z0 + z1) / 2 : x, 0.007, alongX ? x : (z0 + z1) / 2, alongX ? Math.PI / 2 : 0);
  F.geo(g, MAT.runner, 0, 0, 0);
}
function addPlant(room, x, z, scale = 1, y = room.fy) {
  const F = new Frame(room, x, y, z, Math.random() * TAU);
  F.cyl(0.2 * scale, 0.15 * scale, 0.42 * scale, MAT.pot, 0, 0.21 * scale, 0, 12);
  F.cyl(0.19 * scale, 0.19 * scale, 0.02, MAT.dirt, 0, 0.41 * scale, 0, 12);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU, r = 0.12 * scale;
    F.geo(new THREE.SphereGeometry(0.22 * scale, 8, 6), i % 2 ? MAT.leaf : MAT.leafDark, Math.cos(a) * r, (0.75 + (i % 3) * 0.18) * scale, Math.sin(a) * r, 0, a, 0, [1, 0.7, 0.5]);
  }
  F.geo(new THREE.SphereGeometry(0.24 * scale, 8, 6), MAT.leaf, 0, 1.1 * scale, 0);
  F.collide(-0.22 * scale, 0.22 * scale, 0, 1.2 * scale, -0.22 * scale, 0.22 * scale);
}
function addVase(F, lx, ly, lz, s = 1) {
  const pts = [[0, 0], [0.06, 0], [0.08, 0.05], [0.09, 0.14], [0.05, 0.24], [0.04, 0.28], [0.06, 0.3]].map(p => new THREE.Vector2(p[0] * s, p[1] * s));
  F.geo(new THREE.LatheGeometry(pts, 12), (Math.round(lx * 10 + lz * 3) % 2) ? MAT.marble : std({ color: 0x1f3d5a, roughness: 0.3, envMap: ENV, envMapIntensity: 0.5 }), lx, ly, lz);
}
function addCandle(F, lx, ly, lz, room) {
  F.cyl(0.04, 0.05, 0.03, MAT.brass, lx, ly + 0.015, lz, 10);
  F.cyl(0.015, 0.015, 0.16, MAT.sheet, lx, ly + 0.11, lz, 8);
  const m = emissiveMat(0xffb040, 5, 0xffffff);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), m); fl.scale.y = 2; F.dyn(fl, lx, ly + 0.21, lz);
  const gl = glowSprite(0xff9a40, 0.3, 0.6); F.dyn(gl, lx, ly + 0.22, lz);
  return room.addFixture({ local: F.pt(lx, ly + 0.25, lz), color: 0xff9a40, intensity: 0.6, range: 3.5, mats: [{ mat: m, base: 5 }], glow: gl, kind: 'candle', shadow: false });
}
function addFireplace(room, x, z, ry) {
  const F = new Frame(room, x, room.fy, z, ry);
  F.box(2.0, 1.35, 0.5, MAT.marble, 0, 0.675, 0);
  F.box(2.3, 0.1, 0.62, MAT.marble, 0, 1.4, 0.04);
  F.box(1.1, 0.85, 0.42, MAT.black, 0, 0.45, 0.05);
  F.box(1.3, 0.05, 0.5, MAT.stone, 0, 0.025, 0.4);
  for (let i = 0; i < 3; i++) F.cyl(0.05, 0.05, 0.6, MAT.crateWood, -0.15 + i * 0.15, 0.1, 0.12, 6, 0, 0.5 * i, Math.PI / 2);
  const flames = new THREE.Group();
  const fm = [];
  for (let i = 0; i < 5; i++) {
    const s = glowSprite(i % 2 ? 0xff7a20 : 0xffb040, 0.5, 0.8); s.position.set((i - 2) * 0.12, 0.3, 0.22); flames.add(s); fm.push(s);
  }
  F.dyn(flames, 0, 0, 0);
  F.collide(-1.0, 1.0, 0, 1.45, -0.25, 0.34);
  const fx = room.addFixture({ local: F.pt(0, 0.5, 0.6), color: 0xff7c2c, intensity: 4, range: 8, kind: 'fire', mats: [], shadow: true });
  room.updaters.push((dt, t) => {
    fm.forEach((s, i) => { const k = 0.7 + 0.3 * Math.sin(t * (9 + i) + i * 2) * Math.sin(t * 3.3 + i); s.scale.set(0.35 + k * 0.25, 0.5 + k * 0.4, 1); s.position.y = 0.25 + k * 0.12; s.material.opacity = fx.level * 0.8; });
    fx.flick = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 7.7);
  });
  return fx;
}
function addClock(room, x, z, ry) {
  const F = new Frame(room, x, room.fy, z, ry);
  F.box(0.55, 2.1, 0.35, MAT.darkWood, 0, 1.05, 0);
  F.box(0.62, 0.12, 0.4, MAT.trim, 0, 2.16, 0);
  F.cyl(0.18, 0.18, 0.02, MAT.paper, 0, 1.75, 0.18, 20, Math.PI / 2, 0, 0);
  F.box(0.01, 0.12, 0.01, MAT.black, 0.0, 1.79, 0.2); F.box(0.09, 0.01, 0.01, MAT.black, 0.03, 1.75, 0.2);
  F.box(0.3, 0.8, 0.01, MAT.glass, 0, 0.9, 0.18);
  const pend = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14), MAT.brass); pend.rotation.x = Math.PI / 2;
  const pg = new THREE.Group(); pend.position.y = -0.55; pg.add(pend);
  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.55, 0.01), MAT.brass); rod.position.y = -0.27; pg.add(rod);
  F.dyn(pg, 0, 1.4, 0.12);
  room.updaters.push((dt, t) => { pg.rotation.z = Math.sin(t * Math.PI) * 0.18; });
  F.collide(-0.3, 0.3, 0, 2.2, -0.18, 0.18);
}
function addCrate(room, x, z, s = 0.8, ry = 0, y = 0) {
  const F = new Frame(room, x, room.fy + y, z, ry);
  F.box(s, s, s, MAT.crateWood, 0, s / 2, 0);
  for (const e of [-1, 1]) { F.box(s + 0.02, 0.06, 0.06, MAT.wood, 0, s / 2 + e * (s / 2 - 0.03), s / 2 - 0.02); F.box(0.06, s + 0.02, 0.06, MAT.wood, e * (s / 2 - 0.03), s / 2, s / 2 - 0.02); }
  F.collide(-s / 2, s / 2, 0, s, -s / 2, s / 2);
  return F;
}
function addShelfRack(room, x, z, ry, w = 2, h = 2.4, opt = {}) {
  const F = new Frame(room, x, room.fy, z, ry);
  const D = 0.6, fm = opt.mat || MAT.iron;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box(0.05, h, 0.05, fm, sx * (w / 2 - 0.03), h / 2, sz * (D / 2 - 0.03));
  for (let i = 0; i < 4; i++) {
    const y = 0.15 + i * (h - 0.2) / 3.2;
    F.box(w, 0.03, D, MAT.metalPanel, 0, y, 0);
    let px = -w / 2 + 0.15;
    while (px < w / 2 - 0.25) { const bw = 0.2 + Math.random() * 0.35, bh = 0.15 + Math.random() * 0.3; if (Math.random() < 0.75) F.box(bw, bh, D * 0.8, Math.random() < 0.5 ? MAT.crateWood : MAT.paper, px + bw / 2, y + bh / 2 + 0.015, 0); px += bw + 0.05; }
  }
  F.collide(-w / 2, w / 2, 0, h, -D / 2, D / 2);
  return F;
}
function addCounter(room, x, z, ry, w = 2.4, opt = {}) {
  const F = new Frame(room, x, room.fy, z, ry);
  const d = addDresser(room, x, z, ry, { w, h: 0.92, d: 0.62, rows: 2, cols: Math.max(2, Math.round(w / 0.6)), mat: opt.mat || MAT.wood, top: MAT.marble });
  return d;
}
function addPillar(room, x, z, h, r = 0.32) {
  const F = new Frame(room, x, room.fy, z, 0);
  F.box(r * 2 + 0.16, 0.3, r * 2 + 0.16, MAT.marble, 0, 0.15, 0);
  F.cyl(r, r, h - 0.6, MAT.marble, 0, h / 2, 0, 18);
  F.box(r * 2 + 0.2, 0.3, r * 2 + 0.2, MAT.marble, 0, h - 0.15, 0);
  F.collide(-r - 0.08, r + 0.08, 0, h, -r - 0.08, r + 0.08);
}
function addHedge(room, x, z, w, d, h = 1.8) {
  const F = new Frame(room, x, 0, z, 0);
  F.box(w, h, d, MAT.hedge, 0, h / 2, 0);
  for (let i = 0; i < Math.max(2, w * d * 2); i++) F.geo(new THREE.SphereGeometry(0.35, 7, 5), MAT.leafDark, (Math.random() - 0.5) * w, h - 0.05 + Math.random() * 0.1, (Math.random() - 0.5) * d, 0, 0, 0, [1, 0.5, 1]);
  F.collide(-w / 2, w / 2, 0, h, -d / 2, d / 2);
}
function addBush(room, x, z, s = 1, collide = true) {
  const F = new Frame(room, x, room.fy, z, Math.random() * TAU);
  for (let i = 0; i < 5; i++) F.geo(new THREE.IcosahedronGeometry(0.35 * s, 0), i % 2 ? MAT.leaf : MAT.leafDark, (Math.random() - 0.5) * 0.5 * s, (0.3 + Math.random() * 0.4) * s, (Math.random() - 0.5) * 0.5 * s, Math.random(), Math.random(), 0);
  if (collide) F.collide(-0.4 * s, 0.4 * s, 0, 0.9 * s, -0.4 * s, 0.4 * s);
}
function addTallGrass(room, x, z, w, d, n = 30) {
  const F = new Frame(room, x, 0, z, 0);
  for (let i = 0; i < n; i++) {
    const g = new THREE.PlaneGeometry(0.12, 0.5 + Math.random() * 0.5);
    g.translate(0, 0.3, 0);
    F.geo(g, i % 3 ? MAT.leaf : MAT.leafDark, (Math.random() - 0.5) * w, 0, (Math.random() - 0.5) * d, (Math.random() - 0.5) * 0.4, Math.random() * TAU, 0);
  }
}
