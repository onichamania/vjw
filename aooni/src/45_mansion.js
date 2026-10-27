
/* =========================================================================
   The mansion of the original Ao Oni, built once: rooms on three floors (each room keeps its own walls
   inside its rectangle, so neighbours are 0.4 m apart), doors that swing, two staircases, furniture,
   hiding places (wardrobes and steel lockers), the story's props, and the waypoints the oni walks.
   World coordinates are used directly: x east, z south (north is -z), y up.
   ========================================================================= */
const FL = { F1: 0, F2: 3.4, B1: -3.4 }, RH = 3.0, WT = 0.2, HD_W = 1.1, HD_H = 2.25, WAIN_H = 1.0;
const MAN = { rooms: {}, list: [], doors: [], byId: {}, nodes: [], hides: [], lockers: [] };

const ROOMDEFS = [
  // id, 名前, x0, x1, z0, z1, floor y, height, wallpaper [palette, style] or material, floor material key
  { id: 'hall', name: '玄関ホール', x0: -5, x1: 5, z0: -9, z1: 0, y: FL.F1, H: 3.6, wall: ['cream', 'damask'], floor: 'tileCheck' },
  { id: 'cor1', name: '1階 廊下', x0: -14, x1: 14, z0: -12, z1: -9, y: FL.F1, H: RH, wall: ['green', 'stripes'], floor: 'floor' },
  { id: 'dining', name: '食堂', x0: -14, x1: -5, z0: -9, z1: 0, y: FL.F1, H: RH, wall: ['red', 'damask'], floor: 'floor' },
  { id: 'parlor', name: '応接間', x0: 5, x1: 14, z0: -9, z1: 0, y: FL.F1, H: RH, wall: ['teal', 'lattice'], floor: 'floorLight' },
  { id: 'kitchen', name: '台所', x0: -14, x1: -4, z0: -20, z1: -12, y: FL.F1, H: RH, wall: 'tileWhite', floor: 'tileCheck', wains: false },
  { id: 'library', name: '図書室', x0: -4, x1: 4, z0: -20, z1: -12, y: FL.F1, H: RH, wall: ['brown', 'stripes'], floor: 'floor' },
  { id: 'stair1', name: '階段', x0: 4, x1: 14, z0: -20, z1: -12, y: FL.F1, H: FL.F2 - FL.F1 + RH, wall: ['mustard', 'stripes'], floor: 'floor', stair: true },
  { id: 'cor2', name: '2階 廊下', x0: -14, x1: 14, z0: -23, z1: -20, y: FL.F2, H: RH, wall: ['plum', 'damask'], floor: 'floor' },
  { id: 'bedroom', name: '寝室', x0: -14, x1: -4, z0: -31, z1: -23, y: FL.F2, H: RH, wall: ['green', 'floral'], floor: 'floorLight' },
  { id: 'lockers', name: '更衣室', x0: -4, x1: 4, z0: -31, z1: -23, y: FL.F2, H: RH, wall: 'plaster', floor: 'tileGray', wains: false },
  { id: 'piano', name: 'ピアノの部屋', x0: 4, x1: 14, z0: -31, z1: -23, y: FL.F2, H: RH, wall: ['red', 'stripes'], floor: 'floorLight' },
  { id: 'stairB', name: '地下への階段', x0: -24, x1: -14, z0: -12, z1: -9, y: FL.B1, H: FL.F1 - FL.B1 + RH, wall: 'cellarStone', floor: 'concrete', wains: false, stair: true },
  { id: 'corB', name: '地下 廊下', x0: -24, x1: -12, z0: -9, z1: -6, y: FL.B1, H: RH, wall: 'cellarStone', floor: 'concrete', wains: false },
  { id: 'jail', name: '牢屋', x0: -26, x1: -10, z0: -6, z1: 4, y: FL.B1, H: RH, wall: 'cellarStone', floor: 'concrete', wains: false },
];
// doors on the line between two rooms: z = … (an east-west wall) at x, or x = … (a north-south wall) at z; y = the floor it opens from
const DOORDEFS = [
  { id: 'front', a: 'hall', b: null, z: 0, x: 0, y: FL.F1, lock: 'k_front', double: true },
  { id: 'hall_cor', a: 'hall', b: 'cor1', z: -9, x: 0, y: FL.F1 },
  { id: 'hall_din', a: 'hall', b: 'dining', x: -5, z: -4.5, y: FL.F1 },
  { id: 'hall_par', a: 'hall', b: 'parlor', x: 5, z: -4.5, y: FL.F1 },
  { id: 'cor_kit', a: 'cor1', b: 'kitchen', z: -12, x: -9, y: FL.F1 },
  { id: 'cor_lib', a: 'cor1', b: 'library', z: -12, x: 0, y: FL.F1, lock: 'k_library' },
  { id: 'cor_st1', a: 'cor1', b: 'stair1', z: -12, x: 11.5, y: FL.F1, lock: 'k_stairs' },
  { id: 'cor_stB', a: 'cor1', b: 'stairB', x: -14, z: -10.5, y: FL.F1, lock: 'k_basement' },
  { id: 'st1_cor2', a: 'stair1', b: 'cor2', z: -20, x: 11.5, y: FL.F2 },
  { id: 'cor2_bed', a: 'cor2', b: 'bedroom', z: -23, x: -9, y: FL.F2 },
  { id: 'cor2_lock', a: 'cor2', b: 'lockers', z: -23, x: 0, y: FL.F2 },
  { id: 'cor2_pia', a: 'cor2', b: 'piano', z: -23, x: 9, y: FL.F2 },
  { id: 'stB_corB', a: 'stairB', b: 'corB', z: -9, x: -22.6, y: FL.B1 },
  { id: 'corB_jail', a: 'corB', b: 'jail', z: -6, x: -16, y: FL.B1 },
];
const ITEMS = {
  k_library: { name: '図書室の鍵', icon: 'key', color: '#d9b25a' },
  k_stairs: { name: '階段の鍵', icon: 'key', color: '#c9c9c9' },
  sheet: { name: '楽譜', icon: 'paper', color: '#ece0c2' },
  k_basement: { name: '地下室の鍵', icon: 'key', color: '#9a9a8a' },
  k_front: { name: '玄関の鍵', icon: 'key', color: '#e8c060' },
};

/* ---------------- walls ---------------- */
// side of room r on the door's line, and the distance along that wall from the wall's start
function doorSide(r, d) {
  if (d.z != null && d.x != null && d.b !== undefined) {
    if (Math.abs(r.x0 - d.x) < 0.01 && d.zLine !== true) return { side: 'W', at: r.z1 - d.z };
    if (Math.abs(r.x1 - d.x) < 0.01 && d.zLine !== true) return { side: 'E', at: d.z - r.z0 };
    if (Math.abs(r.z0 - d.z) < 0.01) return { side: 'N', at: d.x - r.x0 };
    if (Math.abs(r.z1 - d.z) < 0.01) return { side: 'S', at: r.x1 - d.x };
  }
  return null;
}
function wallFrame(r, side) {
  if (side === 'N') return { F: new Frame(r, r.x0, 0, r.z0, 0), L: r.x1 - r.x0 };
  if (side === 'S') return { F: new Frame(r, r.x1, 0, r.z1, Math.PI), L: r.x1 - r.x0 };
  if (side === 'W') return { F: new Frame(r, r.x0, 0, r.z1, Math.PI / 2), L: r.z1 - r.z0 };
  return { F: new Frame(r, r.x1, 0, r.z0, -Math.PI / 2), L: r.z1 - r.z0 };
}
// one wall: frame F has +x along the wall and +z into the room; the wall stands just inside the room
function mWall(r, side, ops, mat, o = {}) {
  const { F, L } = wallFrame(r, side), H = r.H;
  const sorted = ops.slice().sort((a, b) => a.at - b.at), solid = [];
  let cur = 0;
  for (const op of sorted) { const a = op.at - op.w / 2, b = op.at + op.w / 2; if (a > cur) solid.push([cur, a]); cur = Math.max(cur, b); }
  if (cur < L) solid.push([cur, L]);
  for (const [s, e] of solid) {
    if (e - s < 0.01) continue;
    r.batch.add(boxGeo(e - s, H, WT, mat, s, 0), mat, F._m((s + e) / 2, H / 2, WT / 2));
    F.collide(s, e, -0.4, H, 0, WT, 'wall');
  }
  for (const op of sorted) {   // above and below each opening
    const top = op.yb + op.h;
    if (top < H - 0.02) r.batch.add(boxGeo(op.w, H - top, WT, mat, op.at - op.w / 2, top), mat, F._m(op.at, (top + H) / 2, WT / 2));
    if (op.yb > 0.02) { r.batch.add(boxGeo(op.w, op.yb, WT, mat), mat, F._m(op.at, op.yb / 2, WT / 2)); F.collide(op.at - op.w / 2, op.at + op.w / 2, -0.4, op.yb, 0, WT, 'wall'); }
  }
  // trims on the room side: wainscot, baseboard (per floor level) and crown
  const levels = o.levels || [0];
  for (const y0 of levels) {
    for (const [s, e] of solid) {
      if (e - s < 0.05) continue;
      const len = e - s, mid = (s + e) / 2;
      if (o.wains !== false) { r.batch.add(boxGeo(len, WAIN_H, 0.03, MAT.wainscot, s, 0), MAT.wainscot, F._m(mid, y0 + WAIN_H / 2, WT + 0.015)); F.box(len, 0.06, 0.05, MAT.trim, mid, y0 + WAIN_H + 0.02, WT + 0.025); }
      F.box(len, 0.16, 0.045, MAT.trim, mid, y0 + 0.08, WT + 0.022);
    }
  }
  F.box(L, 0.13, 0.09, MAT.trim, L / 2, H - 0.065, WT + 0.045);
  r.walls[side] = { F, L };
}

/* ---------------- rooms ---------------- */
function wallMaterial(w) { return typeof w === 'string' ? MAT[w] : wallMat(w[0], w[1]); }
function makeRoom(def) {
  const r = new Room(MAN.list.length, def.id);
  Object.assign(r, { id: def.id, name: def.name, x0: def.x0, x1: def.x1, z0: def.z0, z1: def.z1, H: def.H, def, navPts: [] });
  r.setTransform(new THREE.Vector3(0, def.y, 0), 0);   // local x/z = world x/z
  r.foot = { x0: def.x0, x1: def.x1, z0: def.z0, z1: def.z1, y0: -0.2, y1: def.H };
  r.cx = (def.x0 + def.x1) / 2; r.cz = (def.z0 + def.z1) / 2;
  const F = new Frame(r, 0, 0, 0, 0), W = def.x1 - def.x0, D = def.z1 - def.z0;
  if (!def.stair) { F.box(W, 0.1, D, MAT[def.floor], r.cx, -0.05, r.cz); r.addFloor(def.x0, def.x1, def.z0, def.z1, 0); }
  F.box(W, 0.12, D, def.wall === 'cellarStone' ? MAT.concrete : MAT.ceiling, r.cx, def.H + 0.06, r.cz);
  r.surface = /tile|concrete/.test(def.floor) ? 'tile' : 'wood';
  MAN.rooms[def.id] = r; MAN.list.push(r);
  return r;
}
function buildWalls(r) {
  const ops = { N: [], S: [], W: [], E: [] };
  for (const d of DOORDEFS) for (const rid of [d.a, d.b]) {
    if (rid !== r.id) continue;
    const s = doorSide(r, d); if (!s) continue;
    ops[s.side].push({ at: s.at, w: (d.double ? 2.0 : HD_W) + 0.12, h: HD_H + 0.06, yb: d.y - r.def.y });
  }
  for (const w of r.def.windows || []) ops[w.side].push({ at: w.at, w: w.w, h: w.h, yb: w.yb, window: true });
  const mat = wallMaterial(r.def.wall);
  for (const side of ['N', 'S', 'W', 'E']) mWall(r, side, ops[side], mat, { wains: r.def.wains, levels: r.def.levels });
  for (const side of ['N', 'S', 'W', 'E']) for (const op of ops[side]) if (op.window) addWindow(r, side, op);
}
// a window to the night outside: dark blue glass with mullions, curtains and a faint moonlight
function addWindow(r, side, op) {
  const { F } = wallFrame(r, side), y = op.yb + op.h / 2;
  const glass = new THREE.MeshStandardMaterial({ color: 0x0b1626, emissive: 0x0d1a33, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.1 });
  F.geo(new THREE.PlaneGeometry(op.w, op.h), glass, op.at, y, 0.02);
  F.box(op.w + 0.12, 0.08, 0.12, MAT.trim, op.at, op.yb, WT + 0.04); F.box(op.w + 0.12, 0.08, 0.1, MAT.trim, op.at, op.yb + op.h, WT);
  F.box(0.05, op.h, 0.06, MAT.trim, op.at, y, 0.05); F.box(op.w, 0.05, 0.06, MAT.trim, op.at, y, 0.05);
  for (const s of [-1, 1]) F.box(0.32, op.h + 0.4, 0.06, MAT.velvetRed, op.at + s * (op.w / 2 + 0.12), y + 0.05, WT + 0.06);
  r.addFixture({ local: F.pt(op.at, y, 0.9), color: 0x6f8fd0, intensity: 0.9, range: 5, kind: 'moon', shadow: false });
}

/* ---------------- doors ---------------- */
function buildDoors() {
  for (const def of DOORDEFS) {
    const ra = MAN.rooms[def.a], rb = def.b ? MAN.rooms[def.b] : null;
    const alongX = Math.abs(ra.z0 - def.z) < 0.01 || Math.abs(ra.z1 - def.z) < 0.01;   // the door's wall runs east-west
    const ly = def.y - ra.def.y, w = def.double ? 2.0 : HD_W;
    const center = new THREE.Vector3(def.x, def.y + 1.1, def.z);
    const n = alongX ? new THREE.Vector3(0, 0, rb ? Math.sign(rb.cz - def.z) : 1) : new THREE.Vector3(rb ? Math.sign(rb.cx - def.x) : 1, 0, 0);   // a → b
    // the frame around the opening, on both faces
    const F = new Frame(ra, def.x, ly, def.z, alongX ? 0 : Math.PI / 2);
    for (const fz of [-WT - 0.02, WT + 0.02]) {
      F.box(0.1, HD_H + 0.1, 0.06, MAT.trim, -w / 2 - 0.05, (HD_H + 0.1) / 2, fz); F.box(0.1, HD_H + 0.1, 0.06, MAT.trim, w / 2 + 0.05, (HD_H + 0.1) / 2, fz);
      F.box(w + 0.3, 0.12, 0.07, MAT.trim, 0, HD_H + 0.1, fz);
    }
    F.box(w, 0.02, WT * 2, MAT.darkWood, 0, 0.01, 0);   // threshold
    const leaves = [];
    for (const k of def.double ? [-1, 1] : [1]) {
      const lw = def.double ? w / 2 : w;
      const piv = new THREE.Group();
      const leaf = new THREE.Mesh(boxGeo(lw - 0.02, HD_H - 0.02, 0.06, MAT.doorFront), [MAT.darkWood, MAT.darkWood, MAT.darkWood, MAT.darkWood, MAT.doorFront, MAT.doorFront]);
      leaf.position.set(k * (lw / 2), HD_H / 2, 0); leaf.castShadow = true; piv.add(leaf);
      for (const s of [1, -1]) {
        const kb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), MAT.brass); kb.position.set(k * (lw - 0.12), 1.0, 0.06 * s); piv.add(kb);
        const pl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.01), MAT.brass); pl.position.set(k * (lw - 0.12), 1.0, 0.035 * s); piv.add(pl);
      }
      F.dyn(piv, -k * w / 2, 0, 0); piv.userData.baseRy = piv.rotation.y; piv.userData.k = k;
      leaves.push({ piv, leaf });
    }
    const col = alongX ? ra.addCollider(def.x - w / 2, def.x + w / 2, ly, ly + HD_H, def.z - 0.08, def.z + 0.08, 'door') : ra.addCollider(def.x - 0.08, def.x + 0.08, ly, ly + HD_H, def.z - w / 2, def.z + w / 2, 'door');
    const door = { id: def.id, def, a: ra, b: rb, leaves, col, center, n, open: false, t: 0, swing: 1, locked: def.lock || null, closeT: 0, alongX };
    MAN.doors.push(door); MAN.byId[def.id] = door;
    for (const { leaf } of leaves) ra.addInteract(leaf, { dist: 2.4, door: true, prompt: () => GAME.doorPrompt(door), use: () => GAME.useDoor(door) });
  }
}
// which way a leaf swings so it opens away from `from` (a world position)
function doorSwingFor(door, from) {
  const side = Math.sign((from.x - door.center.x) * door.n.x + (from.z - door.center.z) * door.n.z) || -1;
  return -side;   // +1: into b, -1: into a
}
function setDoorOpen(door, open, from = null) {
  if (door.open === open) return;
  door.open = open;
  if (open && from) door.swing = doorSwingFor(door, from);
  door.closeT = 0;
}
function updateDoors(dt) {
  for (const d of MAN.doors) {
    const target = d.open ? 1 : 0;
    if (d.t !== target) {
      d.t = d.open ? Math.min(1, d.t + dt * 1.8) : Math.max(0, d.t - dt * 2.4);
      const e = smoothstep(0, 1, d.t);
      for (const { piv } of d.leaves) {
        // a leaf turning +θ about y moves its free end toward -z (east-west wall) / -x (north-south wall)
        const into = d.swing * (d.alongX ? d.n.z : d.n.x);   // +1 toward +z / +x
        piv.rotation.y = piv.userData.baseRy - into * piv.userData.k * e * 1.7;
      }
      if (d.t <= 0.02 && !d.open) SFX.doorShut && SFX.doorShut(d.center);
    }
    d.col.on = d.t < 0.35;
    // open doors swing shut again once nobody is near them
    if (d.open && d.t >= 1 && d.def.b) {
      const near = PLAYER.pos.distanceTo(d.center) < 2.2 + 1.1 || (ONI.on && ONI.pos.distanceTo(d.center) < 3.2);
      d.closeT = near ? 0 : d.closeT + dt;
      if (d.closeT > 6) setDoorOpen(d, false);
    }
  }
}

/* ---------------- furniture that only this house has ---------------- */
// a steel locker: front is local +z. The door has louvres at eye height (that is all you see from inside)
let _lockerMat = null, _lockerDark = null;
function addLocker(room, x, z, ry, opt = {}) {
  if (!_lockerMat) { _lockerMat = std({ color: 0x5f6f68, metalness: 0.55, roughness: 0.48, envMap: ENV, envMapIntensity: 0.5 }); _lockerDark = std({ color: 0x0c0f0e, roughness: 0.8 }); }
  const F = new Frame(room, x, room.fy, z, ry), W = 0.56, D = 0.55, H = 1.95, m = _lockerMat;
  F.box(W, H, 0.02, m, 0, H / 2, -D / 2 + 0.01);
  F.box(0.02, H, D, m, -W / 2 + 0.01, H / 2, 0); F.box(0.02, H, D, m, W / 2 - 0.01, H / 2, 0);
  F.box(W, 0.03, D, m, 0, H - 0.015, 0); F.box(W, 0.08, D, m, 0, 0.04, 0);
  F.box(W - 0.04, H - 0.14, 0.01, _lockerDark, 0, H / 2, -D / 2 + 0.03);
  F.box(W - 0.06, 0.02, D - 0.06, m, 0, 1.62, -0.02);   // hat shelf inside
  const piv = new THREE.Group(); F.dyn(piv, -W / 2 + 0.02, 0, D / 2 - 0.01); piv.userData.baseRy = piv.rotation.y;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.04, H - 0.1, 0.02), m); leaf.position.set((W - 0.04) / 2, H / 2, 0); leaf.castShadow = true; piv.add(leaf);
  for (const [y0, n] of [[1.42, 6], [0.2, 3]]) for (let i = 0; i < n; i++) {   // the louvres
    const sl = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.018, 0.012), _lockerDark); sl.position.set((W - 0.04) / 2, y0 + i * 0.045, 0.012); piv.add(sl);
  }
  const hd = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), MAT.steel); hd.position.set(W - 0.12, 1.05, 0.03); piv.add(hd);
  if (opt.num != null) {
    const c = newCanvas(64, 32), g = c.getContext('2d'); g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#222'; g.font = '700 22px sans-serif'; g.textAlign = 'center'; g.fillText(String(opt.num), 32, 24);
    const tx = toTex(c, true, false); room.textures.push(tx);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 })); pl.userData.ownMat = true; pl.position.set((W - 0.04) / 2, 1.82, 0.012); piv.add(pl);
  }
  F.collide(-W / 2, W / 2, 0, H, -D / 2, D / 2);
  const hide = { type: 'locker', room, camL: F.pt(0, 1.56, 0.06), exitL: F.pt(0, 0, D / 2 + 0.55), yawL: ry + Math.PI, doors: [piv], F, blockedUntil: 0, item: opt.item || null,
    front: F.pt(0, 0, D / 2 + 0.55), num: opt.num };
  room.hides.push(hide); MAN.hides.push(hide); MAN.lockers.push(hide);
  room.addInteract(leaf, { dist: 2.2, icon: 'hide', prompt: () => (PLAYER.hidden ? null : 'ロッカーに隠れる'), use: () => GAME.enterHide(hide) });
  return hide;
}
// a grand piano (the keyboard faces local +z), with a stool
function addPiano(room, x, z, ry) {
  const F = new Frame(room, x, room.fy, z, ry), black = std({ color: 0x080808, roughness: 0.18, metalness: 0.2, envMap: ENV, envMapIntensity: 0.9 });
  const shape = new THREE.Shape(); shape.moveTo(-0.75, 0.75); shape.lineTo(0.75, 0.75); shape.lineTo(0.75, -0.2); shape.quadraticCurveTo(0.7, -1.2, 0.05, -1.25); shape.quadraticCurveTo(-0.6, -1.3, -0.75, -0.6); shape.lineTo(-0.75, 0.75);
  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.32, bevelEnabled: false }); body.rotateX(-Math.PI / 2);
  F.geo(body, black, 0, 0.62, 0);
  const lid = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false }); lid.rotateX(-Math.PI / 2);
  F.geo(lid, black, 0, 0.96, -0.05, -0.55, 0, 0);
  for (const [lx, lz] of [[-0.6, 0.6], [0.6, 0.6], [0, -1.05]]) F.cyl(0.05, 0.04, 0.62, black, lx, 0.31, lz, 10);
  F.box(1.5, 0.08, 0.28, black, 0, 0.72, 0.86);
  F.box(1.36, 0.03, 0.16, std({ color: 0xf2efe6, roughness: 0.3 }), 0, 0.775, 0.86);
  for (let i = 0; i < 26; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) F.box(0.022, 0.025, 0.09, black, -0.66 + i * 0.052 - 0.026, 0.795, 0.83);
  F.box(1.2, 0.3, 0.02, black, 0, 0.98, 0.76, -0.2, 0, 0);
  F.box(0.6, 0.05, 0.35, MAT.velvetRed, 0, 0.5, 1.45); for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box(0.04, 0.48, 0.04, black, sx * 0.26, 0.24, 1.45 + sz * 0.14);
  F.collide(-0.78, 0.78, 0, 1.1, -1.3, 1.0);
  return F;
}
// iron bars along a line (a jail wall), with an optional barred door that is open
function addBars(room, x0, x1, z, h = 2.6, gap = null) {
  for (let x = x0; x <= x1 + 1e-6; x += 0.16) {
    if (gap && x > gap[0] && x < gap[1]) continue;
    new Frame(room, x, 0, z, 0).cyl(0.018, 0.018, h, MAT.iron, 0, h / 2, 0, 6);
  }
  const F = new Frame(room, 0, 0, z, 0);
  F.box(x1 - x0, 0.06, 0.06, MAT.iron, (x0 + x1) / 2, h, 0); F.box(x1 - x0, 0.05, 0.05, MAT.iron, (x0 + x1) / 2, 0.12, 0);
  if (!gap) room.addCollider(x0, x1, 0, h, z - 0.06, z + 0.06, 'bars');
  else { room.addCollider(x0, gap[0], 0, h, z - 0.06, z + 0.06, 'bars'); room.addCollider(gap[1], x1, 0, h, z - 0.06, z + 0.06, 'bars'); }
}
// something to pick up: an item that goes in the story inventory
function addPickup(room, id, x, y, z, ry = 0, opt = {}) {
  const def = ITEMS[id];
  const m = makeItemMesh(def.icon === 'paper' ? 'paper' : 'key');
  m.position.set(x, y, z); m.rotation.y = ry; m.scale.setScalar(def.icon === 'paper' ? 1 : 1.5);
  const glow = glowSprite(0xfff0c0, 0.22, 0.45); glow.position.y = 0.04; m.add(glow);
  room.group.add(m);
  room.addInteract(m, { dist: 2.4, prompt: () => (STORY.has(id) ? null : def.name + 'を拾う'), use: () => GAME.take(id, m, opt.onTake) });
  MAN.props[id] = m;
  return m;
}
function interactBox(room, x, y, z, w, h, d, prompt, use, opt = {}) {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(x, y, z); room.group.add(hit);
  room.addInteract(hit, Object.assign({ dist: 2.4, prompt, use }, opt));
  return hit;
}

/* ---------------- the rooms' contents ---------------- */
const FURNISH = {
  hall(r) {
    const H = r.H;
    addChandelier(r, 0, H, -4.5, 1.35, { intensity: 10 });
    for (const x of [-3.2, 3.2]) addSconce(r, x, 2.2, -8.78, 0);
    for (const z of [-1.4, -7.6]) { addSconce(r, -4.78, 2.2, z, Math.PI / 2); addSconce(r, 4.78, 2.2, z, -Math.PI / 2); }
    addRunner(r, 0, -0.3, -8.6, 1.6);
    addRug(r, 0, -4.5, 4, 3, 0, 3);
    addClock(r, -4.55, -7.6, Math.PI / 2);
    const d = addDresser(r, 4.5, -1.4, -Math.PI / 2, { w: 1.4, h: 0.95, d: 0.5, rows: 2 }); addVase(d.F, 0.35, d.H, 0, 1.2);
    addPlant(r, -4.3, -0.6, 1.1); addPlant(r, 4.3, -8.3, 1.1); addPlant(r, -4.3, -8.3, 1.1);
    addPainting(r, -2.6, 2.1, -8.78, 0, 1.0, 1.2, 4); addPainting(r, 2.6, 2.1, -8.78, 0, 1.0, 1.2, 11);
    // the front door: big, double, locked from the moment you came in
    const fr = MAN.byId.front;
    interactBox(r, 0, 1.2, -0.25, 2, 2.3, 0.3, () => GAME.doorPrompt(fr), () => GAME.useDoor(fr), { door: true });
    r.navPts.push([0, -4.5], [-3, -6.5], [3, -2.5]);
    r.spawn = { x: 0, z: -1.6, yaw: 0 };
  },
  cor1(r) {
    for (const x of [-11.5, -4.5, 4.5, 11.5]) addSconce(r, x, 2.1, -11.78, 0);
    for (const x of [-11.5, -4.5, 4.5, 11.5]) addSconce(r, x, 2.1, -9.22, Math.PI);
    addRunner(r, -10.5, -13.6, 13.6, 1.3, true);
    addPainting(r, -5.5, 1.75, -9.22, Math.PI, 0.7, 0.9, 7); addPainting(r, 5.8, 1.75, -9.22, Math.PI, 0.7, 0.9, 13);
    const t = addTable(r, 13.5, -10.5, Math.PI / 2, 0.9, 0.45, 0.85, MAT.darkWood); addVase(t.F, 0, 0.85, 0, 1.4);
    r.navPts.push([-11.5, -10.5], [-4.5, -10.5], [4.5, -10.5], [11.5, -10.5]);
    r.navChain = true;   // a long hallway: walk it in order
  },
  dining(r) {
    addChandelier(r, -9.5, r.H, -4.5, 1.1);
    addTable(r, -9.5, -4.5, Math.PI / 2, 4.2, 1.2, 0.78, MAT.wood, true);
    for (let i = 0; i < 4; i++) { const zz = -6.1 + i * 1.07; addChair(r, -11.15, zz, Math.PI / 2); addChair(r, -7.85, zz, -Math.PI / 2); }
    addFireplace(r, -13.45, -4.5, Math.PI / 2);
    const d = addDresser(r, -9.5, -8.5, 0, { w: 2.2, h: 1.0, d: 0.5, rows: 2 }); for (const lx of [-0.6, 0.6]) addCandle(d.F, lx, d.H, 0, r);
    addPainting(r, -9.5, 2.1, -0.22, Math.PI, 1.3, 0.9, 2);
    r.navPts.push([-6.2, -1.6], [-6.2, -7.4], [-12.4, -1.6], [-12.4, -7.4]);
  },
  parlor(r) {
    addCeilingLamp(r, 9.5, r.H, -4.5, { intensity: 6 });
    addRug(r, 10, -4.5, 4.2, 3.2, 0, 8);
    addSofa(r, 10, -6.9, 0, MAT.velvetGreen, 2.2); addArmchair(r, 12.6, -4.5, -Math.PI / 2); addArmchair(r, 7.6, -4.5, Math.PI / 2, MAT.velvetGreen);
    addTable(r, 10, -4.4, 0, 1.3, 0.7, 0.45, MAT.darkWood);
    addBookshelf(r, 12, -8.55, 0, 2.2, 2.4);
    MAN.parlorCloset = addWardrobe(r, 13.37, -1.6, -Math.PI / 2);
    addClock(r, 7.2, -0.35, Math.PI);
    addPainting(r, 9.6, 1.9, -0.22, Math.PI, 1.0, 0.8, 19);
    r.navPts.push([6.2, -2.0], [6.2, -7.2], [9.5, -2.2]);
  },
  kitchen(r) {
    addBulb(r, -9, r.H, -16, { intensity: 5 }); addBulb(r, -6, r.H, -14, { intensity: 3 });
    addCounter(r, -10.5, -19.48, 0, 4.2); addCounter(r, -13.48, -16.5, Math.PI / 2, 3.4);
    // the sink and the stove
    const SF = new Frame(r, -9.6, 0.93, -19.45, 0); SF.box(0.8, 0.04, 0.45, MAT.steel, 0, 0, 0); SF.box(0.7, 0.2, 0.36, _darkMat(), 0, -0.08, 0.02); SF.cyl(0.02, 0.02, 0.3, MAT.steel, 0, 0.15, -0.18, 6);
    const ST = new Frame(r, -12.4, 0, -19.4, 0); ST.box(0.9, 0.92, 0.62, MAT.iron, 0, 0.46, 0); ST.box(0.9, 0.04, 0.62, _darkMat(), 0, 0.94, 0); for (const sx of [-0.2, 0.2]) ST.cyl(0.12, 0.12, 0.02, MAT.black, sx, 0.97, 0.05, 14);
    ST.collide(-0.45, 0.45, 0, 0.96, -0.31, 0.31);
    addShelfRack(r, -5.0, -19.5, 0, 1.6, 2.2, { mat: MAT.darkWood });
    addTable(r, -8.6, -15.2, 0, 1.6, 0.9, 0.78, MAT.wood); addChair(r, -8.6, -14.25, Math.PI);
    // the cupboard where the library key is
    const cb = addDresser(r, -4.52, -16.0, -Math.PI / 2, { w: 1.6, h: 1.0, d: 0.55, rows: 3, cols: 2 });
    cb.drawers[1].preset = [{ type: 'k_library' }];
    // the plate that broke (the noise you heard)
    const shards = new THREE.Group(), plate = std({ color: 0xf2efe8, roughness: 0.35 });
    for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.07 + Math.random() * 0.06, 0.05, 0.012, 3 + (i % 3)), plate); s.position.set((Math.random() - 0.5) * 0.9, 0.006, (Math.random() - 0.5) * 0.7); s.rotation.y = Math.random() * TAU; shards.add(s); }
    shards.position.set(-11.8, 0, -17.6); r.group.add(shards);
    interactBox(r, -11.8, 0.1, -17.6, 1.0, 0.3, 0.8, () => 'お皿のかけら', () => GAME.say([['ひろし', 'お皿が割れてる…。さっきの音はこれか。'], ['ひろし', '……だれが割ったんだ？']]), { icon: 'eye' });
    r.navPts.push([-9, -13.4], [-6.2, -14.0], [-11.6, -14.4], [-11.2, -17.3]);
  },
  library(r) {
    addBulb(r, -2, r.H, -16, { intensity: 3.5, color: 0xffb46e }); addBulb(r, 2, r.H, -14, { intensity: 3.5, color: 0xffb46e });
    for (const z of [-13.4, -15.6, -17.8]) { addBookshelf(r, -3.57, z, Math.PI / 2, 2.0, 2.5); addBookshelf(r, 3.57, z, -Math.PI / 2, 2.0, 2.5); }
    for (const x of [-1.6, 1.6]) { const b = addBookshelf(r, x, -16.4, 0, 1.6, 2.4); void b; addBookshelf(r, x, -16.83, Math.PI, 1.6, 2.4); }
    const desk = addTable(r, 0, -19.2, 0, 1.6, 0.8, 0.78, MAT.darkWood); addTableLamp(r, desk.F, -0.55, 0.78, -0.1);
    addChair(r, 0, -18.4, Math.PI);
    // an open book on the desk
    const BF = new Frame(r, 0.3, 0.79, -19.15, 0.2); BF.box(0.42, 0.02, 0.3, MAT.paper, 0, 0, 0); BF.box(0.01, 0.025, 0.3, MAT.darkWood, 0, 0.004, 0);
    interactBox(r, 0.3, 0.85, -19.15, 0.5, 0.2, 0.4, () => '本を読む', () => GAME.say([['', '『……この屋敷には、青い何かが住みついている。'], ['', '　見つかったら、決して立ち止まるな。'], ['', '　部屋をうつっても、あれは追ってくる。かくれるしかない。』']]), { icon: 'eye' });
    addPickup(r, 'k_stairs', -0.35, 0.8, -19.0, 0.6, { onTake: () => STORY.event('libraryOni') });
    r.navPts.push([0, -13.0], [0, -15.0], [0, -18.0], [-2.6, -18.6], [2.6, -18.6], [-2.6, -12.9], [2.6, -12.9]);
    r.oniSpawn = { x: 2.6, z: -18.9 };   // behind the north-east shelves
  },
  stair1(r) {
    // flat at the bottom (z -12 → -13.2), a straight flight up to the north (rise 3.4 over 5.4 m), landing at the top
    r.addFloor(r.x0, r.x1, -13.2, r.z1, 0);
    r.addFloor(9.2, r.x1, -18.6, -13.2, 0, FL.F2 - FL.F1, 'z', -13.2, -18.6);
    r.addFloor(r.x0, r.x1, r.z0, -18.6, FL.F2 - FL.F1);
    const F = new Frame(r, 0, 0, 0, 0), rise = FL.F2 - FL.F1, n = 17;
    F.box(r.x1 - r.x0, 0.1, 1.2, MAT.floor, r.cx, -0.05, -12.6);
    for (let i = 0; i < n; i++) { const z = -13.2 - (i + 0.5) * 5.4 / n, y = (i + 1) * rise / n; F.box(4.8, 0.06, 5.4 / n + 0.02, MAT.darkWood, 11.6, y - 0.03, z); F.box(4.8, rise / n, 0.03, MAT.trim, 11.6, y - rise / n / 2, z + 5.4 / n / 2); }
    const slope = new THREE.BoxGeometry(4.8, 0.3, Math.hypot(5.4, rise)); const sm = new THREE.Mesh(slope, MAT.darkWood); sm.rotation.x = Math.atan2(rise, 5.4); sm.position.set(11.6, rise / 2 - 0.3, -15.9); r.group.add(sm);
    F.box(r.x1 - r.x0, 0.2, 1.4, MAT.floor, r.cx, rise - 0.1, -19.3);
    // the space under the flight and west of it is walled off
    F.box(0.2, rise + 1.1, 5.4, wallMaterial(r.def.wall), 9.1, (rise + 1.1) / 2, -15.9); r.addCollider(9.0, 9.2, 0, rise + 1.1, -18.6, -13.2);
    for (let i = 0; i <= 9; i++) { const k = i / 9; F.cyl(0.02, 0.02, 0.9, MAT.trim, 9.3, k * rise + 0.45, -13.2 - k * 5.4, 6); }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, Math.hypot(5.4, rise)), MAT.trim); rail.rotation.x = Math.atan2(rise, 5.4); rail.position.set(9.3, rise / 2 + 0.92, -15.9); r.group.add(rail);
    F.box(4.6, 0.05, 1.0, wallMaterial(r.def.wall), 6.6, rise + RH - 0.4, -16);   // dummy beam over the west half
    r.addCollider(r.x0, 9.0, 0, rise + RH, -18.6, -12.6);   // the west half is closed (storage)
    addSconce(r, 13.78, 1.9, -13.0, -Math.PI / 2); addSconce(r, 13.78, rise + 1.9, -19.2, -Math.PI / 2); addBulb(r, 11.6, r.H, -16.0, { intensity: 4 });
    r.def.levels = [0, rise];
    r.navPts = [[11.5, -12.7, 0], [11.6, -13.4, 0], [11.6, -18.4, rise], [11.5, -19.3, rise]];
    r.navChain = true;
  },
  cor2(r) {
    for (const x of [-11.5, -4.5, 4.5, 11.5]) addSconce(r, x, 2.1, -20.22, Math.PI);
    for (const x of [-4.5, 4.5]) addSconce(r, x, 2.1, -22.78, 0);
    addRunner(r, -21.5, -13.6, 13.6, 1.3, true);
    addPainting(r, -4.6, 1.75, -22.78, 0, 0.7, 0.9, 22); addPainting(r, 4.6, 1.75, -22.78, 0, 0.7, 0.9, 16);
    addPlant(r, -13.4, -20.6, 1);
    r.navPts.push([-11.5, -21.5], [-4.5, -21.5], [4.5, -21.5], [11.5, -21.5]);
    r.navChain = true;
  },
  bedroom(r) {
    addCeilingLamp(r, -9, r.H, -27, { intensity: 4.5 });
    addBed(r, -9.6, -29.5, 0, { double: true });
    addNightstand(r, -11.2, -30.5, 0); addNightstand(r, -8.0, -30.5, 0);
    MAN.takeshiCloset = addWardrobe(r, -13.37, -26.6, Math.PI / 2);
    addWardrobe(r, -13.37, -29.4, Math.PI / 2);
    addDresser(r, -4.52, -27.0, -Math.PI / 2, { w: 1.6, h: 1.0, d: 0.5, rows: 3 });
    addRug(r, -9.5, -26.6, 3.0, 2.0, 0, 5);
    addPainting(r, -9.6, 1.9, -30.78, 0, 1.0, 0.7, 9);
    r.navPts.push([-9, -24.2], [-6.0, -26.0], [-11.8, -25.4], [-6.0, -29.6]);
  },
  lockers(r) {
    // fluorescent tubes
    for (const z of [-25.5, -28.5]) {
      const F = new Frame(r, 0, r.H, z, 0); F.box(1.3, 0.05, 0.14, MAT.steel, 0, -0.03, 0);
      const m = emissiveMat(0xe4f2ff, 2.2, 0xeef4f6); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.2, 8), m); t.rotation.z = Math.PI / 2; F.dyn(t, 0, -0.08, 0);
      r.addFixture({ local: F.pt(0, -0.3, 0), color: 0xd8ecff, intensity: 3.2, range: 8, mats: [{ mat: m, base: 2.2 }], kind: 'tube', shadow: false });
    }
    // six along the north wall, four along the west wall; the sheet music is in number 3
    for (let i = 0; i < 6; i++) addLocker(r, -2.9 + i * 0.6, -30.5, 0, { num: i + 1, item: i === 2 ? 'sheet' : null });
    for (let i = 0; i < 4; i++) addLocker(r, -3.52, -28.6 + i * 0.6, Math.PI / 2, { num: 7 + i });
    const B = new Frame(r, 0.6, 0, -27.0, 0); B.box(2.4, 0.06, 0.4, MAT.wood, 0, 0.45, 0); for (const sx of [-1, 1]) B.box(0.06, 0.45, 0.36, MAT.steel, sx * 1.1, 0.225, 0); B.collide(-1.2, 1.2, 0, 0.5, -0.2, 0.2);
    const M = new Frame(r, 3.79, 0, -27.5, -Math.PI / 2); M.box(0.9, 1.2, 0.03, std({ color: 0x9aa6ad, metalness: 0.9, roughness: 0.08, envMap: ENV, envMapIntensity: 1.2 }), 0, 1.5, 0.02);
    M.box(0.7, 0.15, 0.45, std({ color: 0xe8e8e2, roughness: 0.3 }), 0, 0.85, 0.24); M.collide(-0.35, 0.35, 0, 0.95, 0, 0.47);
    r.navPts.push([0, -24.2], [-1.6, -25.4], [1.6, -25.4], [-1.4, -29.3], [2.4, -29.3]);
  },
  piano(r) {
    addChandelier(r, 9, r.H, -27, 0.9, { intensity: 6.5 });
    MAN.pianoF = addPiano(r, 9, -28.3, 0);
    interactBox(r, 9, 0.85, -27.35, 1.5, 0.4, 0.5, () => (STORY.flags.pianoSolved ? null : 'ピアノをひく'), () => UI.piano(), { icon: 'hand' });
    // the little cabinet whose drawer opens when the right melody is played
    const cab = addDresser(r, 13.47, -28.6, -Math.PI / 2, { w: 1.0, h: 0.85, d: 0.45, rows: 2, cols: 1 });
    MAN.pianoDrawer = cab.drawers[1]; MAN.pianoDrawer.locked = true; MAN.pianoDrawer.preset = [{ type: 'k_basement' }];
    addBookshelf(r, 4.43, -28.0, Math.PI / 2, 2.0, 2.3);
    addChair(r, 6.2, -24.4, Math.PI * 0.8); addChair(r, 7.2, -24.4, Math.PI);
    addPainting(r, 9.0, 2.0, -30.78, 0, 1.2, 0.9, 6);
    const st = new Frame(r, 12.5, 0, -24.4, 0); st.cyl(0.02, 0.02, 1.2, MAT.brass, 0, 0.6, 0, 6); st.box(0.35, 0.25, 0.02, MAT.brass, 0, 1.25, 0, -0.4, 0, 0);
    r.navPts.push([9, -24.2], [6.0, -26.0], [12.2, -26.0], [6.0, -29.8], [12.2, -29.8]);
  },
  stairB(r) {
    // the top is on the 1F (east end), the flight goes down to the west
    const top = FL.F1 - FL.B1;
    r.addFloor(-15.2, r.x1, r.z0, r.z1, top);
    r.addFloor(-21.2, -15.2, r.z0, r.z1, 0, top, 'x', -21.2, -15.2);
    r.addFloor(r.x0, -21.2, r.z0, r.z1, 0);
    const F = new Frame(r, 0, 0, 0, 0), n = 17;
    F.box(1.2, 0.2, 3, MAT.concrete, -14.6, top - 0.1, r.cz);
    for (let i = 0; i < n; i++) { const x = -15.2 - (i + 0.5) * 6 / n, y = top - i * top / n; F.box(6 / n + 0.02, 0.06, 2.6, MAT.stone, x, y - 0.03, r.cz); F.box(0.03, top / n, 2.6, MAT.stone, x + 3 / n, y - top / n / 2, r.cz); }
    const slope = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(6, top), 0.4, 2.6), MAT.stone); slope.rotation.z = -Math.atan2(top, 6); slope.position.set(-18.2, top / 2 - 0.35, r.cz); r.group.add(slope);
    F.box(2.8, 0.1, 3, MAT.concrete, -22.6, -0.05, r.cz);
    addBulb(r, -15.2, r.H, r.cz, { intensity: 2.5 }); addBulb(r, -22.6, top - 0.2, r.cz, { intensity: 2.8, drop: 0.4 });
    r.def.levels = [0, top];
    r.navPts = [[-14.6, -10.5, top], [-15.4, -10.5, top], [-21.0, -10.5, 0], [-22.6, -9.7, 0]];
    r.navChain = true;
  },
  corB(r) {
    for (const x of [-21.5, -15.5]) addBulb(r, x, r.H, -7.5, { intensity: 2.4 });
    addLocker(r, -12.52, -7.5, -Math.PI / 2, { num: 1 });
    addLocker(r, -13.1, -8.5, 0, { num: 2 });
    addCrate(r, -19.5, -8.4, 0.7, 0.3); addCrate(r, -23.4, -6.6, 0.6, 0.8);
    r.navPts.push([-22.6, -7.5], [-19.0, -7.5], [-16.0, -7.5]);
    r.navChain = true;
  },
  jail(r) {
    for (const x of [-21, -15]) addBulb(r, x, r.H, -2.5, { intensity: 2.6, color: 0xffc78a });
    // three cells along the south wall; the middle one's door hangs open
    addBars(r, r.x0 + 0.2, r.x1 - 0.2, 0.0, 2.6, null);
    for (const x of [-21.33, -15.67]) { const F = new Frame(r, x, 0, 2, Math.PI / 2); F.box(4, 2.6, 0.12, MAT.cellarStone, 0, 1.3, 0); r.addCollider(x - 0.06, x + 0.06, 0, 2.6, 0, 3.8); }
    // the open door of the middle cell: replace two bars with a gap
    for (const c of r.colliders) if (c.tag === 'bars') c.on = false;
    r.colliders = r.colliders.filter(c => c.tag !== 'bars');
    r.addCollider(r.x0, -19.2, 0, 2.6, -0.06, 0.06, 'bars'); r.addCollider(-17.8, r.x1, 0, 2.6, -0.06, 0.06, 'bars');
    const cellDoor = new THREE.Group(); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.4, 6), MAT.iron); b.position.set(i * 0.16, 1.2, 0); cellDoor.add(b); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.05), MAT.iron); bar.position.set(0.64, 2.3, 0); cellDoor.add(bar);
    cellDoor.position.set(-17.8, 0, 0.05); cellDoor.rotation.y = -1.9; r.group.add(cellDoor);
    // straw, a bucket, chains
    const S = new Frame(r, -18.5, 0, 2.6, 0); S.box(1.6, 0.06, 1.0, std({ color: 0x8a7a40, roughness: 1 }), 0, 0.03, 0); S.cyl(0.16, 0.13, 0.3, MAT.wood, 1.2, 0.15, -0.6, 10);
    for (const x of [-23.5, -12.6]) { const C = new Frame(r, x, 0, 3.75, 0); for (let k = 0; k < 7; k++) C.geo(new THREE.TorusGeometry(0.035, 0.009, 4, 8), MAT.iron, 0, 1.9 - k * 0.07, 0, 0, k % 2 ? Math.PI / 2 : 0, 0); }
    addPickup(r, 'k_front', -18.9, 0.01, 2.9, 0.8, { onTake: () => STORY.event('jailOni') });
    addCrate(r, -25.2, -5.1, 0.8, 0.2); addCrate(r, -11.0, -5.2, 0.7, 0.6);
    r.navPts.push([-16, -5.0], [-22.0, -3.0], [-12.2, -3.0], [-18.5, -1.0], [-18.5, 1.6]);
  },
};
let _darkM = null;
const _darkMat = () => _darkM || (_darkM = std({ color: 0x141414, roughness: 0.6 }));

/* ---------------- the waypoints the oni walks ---------------- */
function buildNav() {
  const nodes = MAN.nodes; nodes.length = 0;
  const add = (room, x, z, y = null) => {
    const ny = y != null ? room.def.y + y : (WORLD.groundAt(x, z, room.def.y + 0.3) ?? room.def.y);
    const n = { i: nodes.length, room, x, z, y: ny, e: [] }; nodes.push(n); return n;
  };
  const link = (a, b, door = null) => { const w = Math.hypot(a.x - b.x, a.z - b.z) + Math.abs(a.y - b.y); a.e.push({ n: b, w, door }); b.e.push({ n: a, w, door }); };
  const per = new Map(MAN.list.map(r => [r, []]));
  for (const r of MAN.list) for (const p of r.navPts) per.get(r).push(add(r, p[0], p[1], p.length > 2 ? p[2] : null));
  for (const d of MAN.doors) {
    if (!d.b) continue;
    const off = 0.75, na = add(d.a, d.center.x - d.n.x * off, d.center.z - d.n.z * off), nb = add(d.b, d.center.x + d.n.x * off, d.center.z + d.n.z * off);
    na.door = nb.door = d; d.na = na; d.nb = nb;
    link(na, nb, d);
    per.get(d.a).push(na); per.get(d.b).push(nb);
  }
  for (const [r, list] of per) {
    if (r.navChain) {   // hallways and stairs: link each node to its nearest neighbours along the way
      const pts = list.filter(n => !n.door).sort((a, b) => (r.id.startsWith('st') ? 0 : a.x - b.x) || 0);
      if (r.id.startsWith('st')) pts.sort((a, b) => r.navPts.findIndex(p => p[0] === a.x && p[1] === a.z) - r.navPts.findIndex(p => p[0] === b.x && p[1] === b.z));
      for (let i = 1; i < pts.length; i++) link(pts[i - 1], pts[i]);
      for (const dn of list.filter(n => n.door)) {   // a door joins the nearest point of the way (same level)
        let best = null, bd = Infinity;
        for (const p of pts) { const dd = Math.hypot(p.x - dn.x, p.z - dn.z) + Math.abs(p.y - dn.y) * 4; if (dd < bd) { bd = dd; best = p; } }
        if (best) link(dn, best);
      }
    } else for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) link(list[i], list[j]);
  }
}
// cheapest way between two nodes (doors that are locked can't be used)
function navPath(from, to) {
  const dist = new Map([[from, 0]]), prev = new Map(), open = [from];
  while (open.length) {
    open.sort((a, b) => dist.get(a) - dist.get(b));
    const n = open.shift();
    if (n === to) break;
    for (const { n: m, w, door } of n.e) {
      if (door && door.locked) continue;
      const nd = dist.get(n) + w;
      if (nd < (dist.has(m) ? dist.get(m) : Infinity)) { dist.set(m, nd); prev.set(m, n); if (!open.includes(m)) open.push(m); }
    }
  }
  if (!dist.has(to)) return null;
  const out = [to]; let c = to;
  while (prev.has(c)) { c = prev.get(c); out.unshift(c); }
  return out;
}
function nearestNode(room, p) {
  let best = null, bd = Infinity;
  for (const n of MAN.nodes) { if (n.room !== room) continue; const d = Math.hypot(n.x - p.x, n.z - p.z) + Math.abs(n.y - p.y) * 3; if (d < bd) { bd = d; best = n; } }
  return best;
}

/* ---------------- build everything ---------------- */
function buildMansion() {
  MAN.rooms = {}; MAN.list = []; MAN.doors = []; MAN.byId = {}; MAN.hides = []; MAN.lockers = []; MAN.props = {};
  ROOMDEFS.find(d => d.id === 'hall').windows = [{ side: 'S', at: 2.2, w: 1.1, h: 1.8, yb: 1.0 }, { side: 'S', at: 7.8, w: 1.1, h: 1.8, yb: 1.0 }];
  ROOMDEFS.find(d => d.id === 'cor2').windows = [{ side: 'W', at: 1.5, w: 1.0, h: 1.6, yb: 0.9 }];
  ROOMDEFS.find(d => d.id === 'bedroom').windows = [{ side: 'W', at: 5.6, w: 1.1, h: 1.7, yb: 0.9 }];
  ROOMDEFS.find(d => d.id === 'parlor').windows = [{ side: 'S', at: 4.5, w: 1.2, h: 1.8, yb: 0.9 }];
  for (const def of ROOMDEFS) makeRoom(def);
  buildDoors();
  for (const r of MAN.list) FURNISH[r.id](r);
  for (const r of MAN.list) buildWalls(r);
  for (const r of MAN.list) WORLD.add(r);
  for (const d of MAN.doors) d.a._colliderWorld(d.col);
  buildNav();
}
