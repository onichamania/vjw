
/* =========================================================================
   The main building (本館) of Ao Oni ver6.23, rebuilt tile for tile. Every room keeps the size it has on
   the original map: one tile is 1.1 m, the room one character takes up, so a 3-tile corridor is three
   people wide. Rooms that join at the screen edge in the original are joined here too; doors and stairs
   take you to the other side the way the original's map changes do.
   Tile coordinates: x east, z south; each floor sits at its own height.
   ========================================================================= */
const T = 1.1, WALL_H = 3.6, DR_H = 2.45, WT = 0.14;
const FLOORS = { F1: 0, F2: 40, F3: 80 };
const cx = x => (x + 0.5) * T;             // centre of tile x (or z)
const tm = v => v * T;                      // tiles -> metres
const MAN = { areas: {}, list: [], doors: {}, doorList: [], stairs: {}, hides: [], props: {}, grid: new Map(), open: new Set(), doorEdges: new Set(), nodes: [] };
const gkey = (fl, x, z) => fl + ':' + x + ',' + z;

/* ---------- materials of this house ---------- */
const AOM = {};
function aoMaterials() {
  if (AOM.ready) return;
  const S = Q().tex;
  AOM.wallWhite = std({ ...genNoiseSurface(S / 2, 0xd7d3c8, 0.05, 6, 0.35), roughness: 0.92 }, 2);
  AOM.wallGrey = std({ ...genNoiseSurface(S / 2, 0xbdbab1, 0.05, 6, 0.35), roughness: 0.92 }, 2);   // the patch of wallpaper that is a little greyer
  AOM.wallGreen = std({ ...genNoiseSurface(S / 2, 0x9db25e, 0.06, 6, 0.35), roughness: 0.9 }, 2);
  AOM.wallBeige = std({ ...genNoiseSurface(S / 2, 0xcdbf9e, 0.07, 6, 0.4), roughness: 0.92 }, 2);
  AOM.wallDark = std({ ...genNoiseSurface(S / 2, 0x8a857a, 0.12, 6, 0.6), roughness: 0.95 }, 2);
  AOM.floorWood = std({ ...genWoodFloor(S, 0xc0803f, 8, 3), roughness: 0.95, normalScale: new THREE.Vector2(0.6, 0.6) }, 2.2);
  AOM.floorRed = std({ ...genWoodFloor(S, 0x7a3220, 9, 5), roughness: 0.9, normalScale: new THREE.Vector2(0.6, 0.6) }, 2.2);
  AOM.floorPale = std({ ...genWoodFloor(S, 0xd2cdc0, 9, 7), roughness: 0.9, normalScale: new THREE.Vector2(0.5, 0.5) }, 2.2);
  AOM.floorAttic = std({ ...genWoodFloor(S, 0x4a3220, 7, 9), roughness: 1, normalScale: new THREE.Vector2(0.8, 0.8) }, 2.2);
  AOM.tileBlue = std({ ...genTilesColor(S / 2, 0x2c3650, 0x222a40, 5, false), roughness: 0.3 }, 1.1);
  AOM.vinyl = std({ ...genNoiseSurface(S / 2, 0xb4a37c, 0.05, 8, 0.2), roughness: 0.7 }, 2);
  AOM.brickRed = std({ ...genStoneBlocks(S, 0x7c3a26, 10, 4), roughness: 0.92 }, 1.4);
  AOM.genkan = std({ ...genTilesColor(S / 2, 0xc9b996, 0xbfae8a, 3, false), roughness: 0.6 }, 1.2);
  AOM.tatami = std({ map: tatamiTex(), roughness: 0.95 }, 1);
  AOM.fusuma = std({ map: fusumaTex(), roughness: 0.9 }, 1);
  AOM.pink = std({ color: 0xd98aa2, roughness: 0.25, envMap: ENV, envMapIntensity: 0.4 });
  AOM.white = std({ color: 0xe9e7e1, roughness: 0.45 });
  AOM.grey = std({ color: 0x8d8f93, roughness: 0.75 });
  AOM.teal = std({ color: 0x6f9c90, roughness: 0.5 });
  AOM.door = std({ color: 0x3a2214, roughness: 0.6 });
  AOM.rug = std({ ...genNoiseSurface(S / 2, 0xc9bb98, 0.06, 10, 0.3), roughness: 1 }, 2);
  AOM.knob = std({ color: 0xd8b84a, metalness: 0.9, roughness: 0.3, envMap: ENV, envMapIntensity: 0.9 });
  AOM.ready = true;
}
function tatamiTex() {
  const c = newCanvas(512, 256), g = c.getContext('2d');
  g.fillStyle = '#7f9a48'; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 3) { g.fillStyle = x % 6 ? 'rgba(60,80,30,.18)' : 'rgba(200,220,140,.12)'; g.fillRect(x, 8, 1.5, 240); }
  g.fillStyle = '#2d3a1c'; g.fillRect(0, 0, 512, 9); g.fillRect(0, 247, 512, 9);   // the cloth borders
  return toTex(c, true, false);
}
function fusumaTex() {
  const c = newCanvas(256, 512), g = c.getContext('2d');
  g.fillStyle = '#e6dcc2'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(150,130,90,${Math.random() * 0.08})`; g.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 30, 1 + Math.random() * 3); }
  g.strokeStyle = '#1b1510'; g.lineWidth = 12; g.strokeRect(6, 6, 244, 500);
  g.fillStyle = '#1b1510'; g.beginPath(); g.ellipse(214, 256, 9, 14, 0, 0, TAU); g.fill();
  return toTex(c, true, false);
}

/* ---------- the map ---------- */
// cells: [x, z, w, h] in tiles. wall/floor: material keys. lamps: tile positions of ceiling lights.
const AREAS = [
  // 1F
  { id: 'toilet', name: 'トイレ', fl: 'F1', cells: [[-5, 1, 4, 1], [-5, 2, 3, 1], [-5, 3, 1, 2], [-5, 5, 3, 2]], wall: 'wallWhite', floor: 'genkan', lamps: [[-4, 1.5], [-4, 6]] },
  { id: 'corA', name: '廊下', fl: 'F1', cells: [[0, 0, 10, 3], [-1, 1, 1, 1]], wall: 'wallWhite', floor: 'floorWood', lamps: [[2.5, 1.5], [7.5, 1.5]] },
  { id: 'foyer', name: '玄関', fl: 'F1', cells: [[10, 0, 13, 3], [14, -4, 3, 4], [13, 3, 7, 3], [16, 6, 1, 1]], wall: 'wallWhite', floor: 'floorWood', lamps: [[13, 1.5], [20, 1.5], [15.5, -2], [16.5, 4.5]] },
  { id: 'corB', name: '廊下', fl: 'F1', cells: [[23, 0, 9, 3], [32, 1, 1, 1]], wall: 'wallWhite', floor: 'floorWood', lamps: [[25.5, 1.5], [30, 1.5]] },
  { id: 'kitchen', name: '食堂', fl: 'F1', cells: [[34, -6, 8, 14], [33, 1, 1, 1]], wall: 'wallGreen', floor: 'floorRed', lamps: [[38, -3.5], [38, 1.5], [38, 5.5]] },
  { id: 'bath', name: '浴室', fl: 'F1', cells: [[-2, -9, 3, 2], [1, -8, 1, 1], [2, -9, 3, 2], [3, -7, 1, 1]], wall: 'wallWhite', floor: 'vinyl', lamps: [[-0.5, -8], [3.5, -8]] },
  { id: 'library', name: '図書室', fl: 'F1', cells: [[17, -25, 16, 17], [30, -8, 3, 2], [31, -6, 1, 1]], wall: 'wallBeige', floor: 'floorWood', lamps: [[21, -21], [29, -21], [21, -13], [29, -13], [31.5, -7]] },
  { id: 'corC', name: '廊下', fl: 'F1', cells: [[0, -32, 11, 3]], wall: 'wallWhite', floor: 'floorWood', lamps: [[2.5, -30.5], [8, -30.5]] },
  { id: 'corT', name: '廊下', fl: 'F1', cells: [[11, -32, 15, 3]], wall: 'wallWhite', floor: 'floorWood', lamps: [[19.5, -30.5], [24, -30.5]] },
  { id: 'tatami', name: '和室', fl: 'F1', cells: [[12, -40, 6, 8]], wall: 'wallBeige', floor: 'tatami', lamps: [[15, -36.5]] },
  { id: 'hidden', name: '隠し部屋', fl: 'F1', cells: [[30, -44, 9, 8], [34, -36, 1, 1]], wall: 'wallDark', floor: 'floorAttic', dark: true, lamps: [] },
  { id: 'jail', name: '牢屋', fl: 'F1', cells: [[30, -53, 7, 6], [31, -47, 1, 1]], wall: 'wallGrey', floor: 'brickRed', lamps: [[33.5, -49]] },
  // 2F
  { id: 'piano', name: 'ピアノの部屋', fl: 'F2', cells: [[0, 2, 11, 9], [5, 11, 1, 1]], wall: 'wallWhite', floor: 'floorPale', lamps: [[3, 5], [8, 5], [5.5, 9]] },
  { id: 'cor2', name: '2階 廊下', fl: 'F2', cells: [[13, 2, 10, 2], [16, 4, 2, 8], [20, 4, 1, 5], [18, 10, 2, 2], [20, 11, 1, 1], [13, 12, 10, 2]], wall: 'wallWhite', floor: 'floorWood', lamps: [[15, 3], [21, 3], [17, 8], [17, 13]] },
  { id: 'kids', name: '子供部屋', fl: 'F2', cells: [[7, -13, 9, 8], [11, -5, 1, 1]], wall: 'wallWhite', floor: 'floorWood', lamps: [[11.5, -9]] },
  { id: 'takeshi', name: '右上の部屋', fl: 'F2', cells: [[17, -13, 9, 8], [21, -5, 1, 1]], wall: 'wallWhite', floor: 'floorWood', lamps: [[21.5, -9]] },
  // 3F
  { id: 'attic', name: '屋根裏部屋', fl: 'F3', cells: [[11, -12, 9, 10], [15, -2, 1, 1]], wall: 'wallDark', floor: 'floorAttic', lamps: [[15.5, -7]] },
  { id: 'cor3', name: '3階 廊下', fl: 'F3', cells: [[14, 2, 2, 8], [13, 7, 1, 1]], wall: 'wallWhite', floor: 'floorWood', lamps: [[15, 4], [15, 8]] },
  { id: 'bed3', name: '寝室', fl: 'F3', cells: [[0, 4, 9, 8], [9, 8, 1, 1]], wall: 'wallWhite', floor: 'floorWood', lamps: [[4.5, 8]] },
];
// stairs: a flight inside an area; dir is the way you walk along it from its entry, rise is up (+) or down (-)
const STAIRS = [
  { id: 'st1up', fl: 'F1', area: 'foyer', r: [18, -6, 2, 6], dir: 'N', rise: 2.0, to: 'st2dn' },
  { id: 'st2dn', fl: 'F2', area: 'cor2', r: [18, 4, 2, 6], dir: 'S', rise: -2.0, to: 'st1up' },
  { id: 'st2up', fl: 'F2', area: 'cor2', r: [21, 6, 2, 6], dir: 'N', rise: 2.0, to: 'st3dn' },
  { id: 'st3dn', fl: 'F3', area: 'cor3', r: [14, 10, 2, 5], dir: 'S', rise: -2.0, to: 'st2up' },
];
// screen-edge joins of the original: walls between these neighbouring tiles are left open
const JOINS = [
  ['F1', -2, 1, -1, 1],                                                 // toilet - corridor A
  ['F1', 9, 0, 10, 0], ['F1', 9, 1, 10, 1], ['F1', 9, 2, 10, 2],       // corridor A - foyer
  ['F1', 22, 0, 23, 0], ['F1', 22, 1, 23, 1], ['F1', 22, 2, 23, 2],    // foyer - corridor B
  ['F1', 32, 1, 33, 1],                                                 // corridor B - dining room
  ['F1', 10, -32, 11, -32], ['F1', 10, -31, 11, -31], ['F1', 10, -30, 11, -30],   // corridor C - the corridor by the tatami room
  ...[12, 13, 14, 15, 16, 17].map(x => ['F1', x, -33, x, -32]),        // the tatami room opens onto that corridor
];
// doors: on tile (x, z), in its wall on `side`; `to` is the door you come out of
const DOORDEFS = [
  { id: 'foyerN', fl: 'F1', x: 15, z: -4, side: 'N', to: 'corC' },
  { id: 'front', fl: 'F1', x: 16, z: 6, side: 'S', to: null, kind: 'front' },
  { id: 'corA_bath', fl: 'F1', x: 2, z: 0, side: 'N', to: 'bath' },
  { id: 'bath', fl: 'F1', x: 3, z: -7, side: 'S', to: 'corA_bath' },
  { id: 'corB_lib', fl: 'F1', x: 27, z: 0, side: 'N', to: 'lib', lock: 'k_library' },
  { id: 'lib', fl: 'F1', x: 31, z: -6, side: 'S', to: 'corB_lib' },
  { id: 'corC', fl: 'F1', x: 6, z: -30, side: 'S', to: 'foyerN' },
  { id: 'corC_base', fl: 'F1', x: 2, z: -32, side: 'N', to: null, kind: 'basement', lock: 'k_basement' },
  { id: 'corT_hid', fl: 'F1', x: 23, z: -32, side: 'N', to: 'hid', kind: 'hidden' },
  { id: 'hid', fl: 'F1', x: 34, z: -36, side: 'S', to: 'corT_hid' },
  { id: 'hid_jail', fl: 'F1', x: 31, z: -44, side: 'N', to: 'jail', kind: 'shelf' },
  { id: 'jail', fl: 'F1', x: 31, z: -47, side: 'S', to: 'hid_jail' },
  { id: 'cor2_kids', fl: 'F2', x: 14, z: 2, side: 'N', to: 'kids', lock: 'k_kids' },
  { id: 'kids', fl: 'F2', x: 11, z: -5, side: 'S', to: 'cor2_kids' },
  { id: 'cor2_tk', fl: 'F2', x: 21, z: 2, side: 'N', to: 'tk' },
  { id: 'tk', fl: 'F2', x: 21, z: -5, side: 'S', to: 'cor2_tk' },
  { id: 'cor2_piano', fl: 'F2', x: 14, z: 12, side: 'N', to: 'piano', kind: 'stuck' },
  { id: 'piano', fl: 'F2', x: 5, z: 11, side: 'S', to: 'cor2_piano' },
  { id: 'cor3_attic', fl: 'F3', x: 15, z: 2, side: 'N', to: 'attic' },
  { id: 'attic', fl: 'F3', x: 15, z: -2, side: 'S', to: 'cor3_attic' },
  { id: 'cor3_bed', fl: 'F3', x: 13, z: 7, side: 'W', to: 'bed3', lock: 'k_bedroom' },
  { id: 'bed3', fl: 'F3', x: 9, z: 8, side: 'E', to: 'cor3_bed' },
];
const ITEMS = {
  shard: { name: '皿の破片', icon: 'shard' },
  k_library: { name: '図書室の鍵', icon: 'key', color: '#d9b25a' },
  k_bedroom: { name: '寝室の鍵', icon: 'key', color: '#c9c9c9' },
  hanky: { name: 'ハンカチ', icon: 'cloth' },
  driver: { name: '＋ドライバー', icon: 'driver' },
  soap: { name: '洗剤', icon: 'soap' },
  knob: { name: 'ドアノブ', icon: 'knob' },
  k_kids: { name: '子供部屋の鍵', icon: 'key', color: '#e89ab0' },
  oil: { name: 'ライターオイル', icon: 'oil' },
  lighter: { name: 'ライター', icon: 'lighter' },
  k_basement: { name: '地下室の鍵', icon: 'key', color: '#9a9a8a' },
};
const SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: 'S', S: 'N', W: 'E', E: 'W' };
const edgeKey = (fl, x, z, side) => gkey(fl, x, z) + side;

/* ---------- building ---------- */
function cellsOf(rect) { const out = []; for (let x = rect[0]; x < rect[0] + rect[2]; x++) for (let z = rect[1]; z < rect[1] + rect[3]; z++) out.push([x, z]); return out; }
function makeArea(def, i) {
  const r = new Room(i, def.id);
  Object.assign(r, { id: def.id, name: def.name, fl: def.fl, def, H: WALL_H, y: FLOORS[def.fl] });
  r.setTransform(new THREE.Vector3(0, FLOORS[def.fl], 0), 0);   // local x/z = world metres
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const rects = def.cells.concat(STAIRS.filter(s => s.area === def.id).map(s => s.r));
  for (const c of rects) { x0 = Math.min(x0, c[0]); z0 = Math.min(z0, c[1]); x1 = Math.max(x1, c[0] + c[2]); z1 = Math.max(z1, c[1] + c[3]); }
  r.foot = { x0: tm(x0), x1: tm(x1), z0: tm(z0), z1: tm(z1), y0: -3, y1: WALL_H };
  r.surface = /tile|genkan|vinyl|brick/i.test(def.floor) ? 'tile' : 'wood';
  r.dark = !!def.dark;
  for (const c of def.cells) for (const [x, z] of cellsOf(c)) MAN.grid.set(gkey(def.fl, x, z), { area: r, x, z, fl: def.fl, stair: null, blocked: false });
  MAN.areas[def.id] = r; MAN.list.push(r);
  return r;
}
function floorAndCeiling(r) {
  const F = new Frame(r, 0, 0, 0, 0), fm = AOM[r.def.floor] || MAT.floor;
  for (const c of r.def.cells) {
    const w = tm(c[2]), d = tm(c[3]), mx = tm(c[0]) + w / 2, mz = tm(c[1]) + d / 2;
    if (r.def.floor === 'tatami') {   // tatami mats, two tiles by one, turned every other row
      for (let j = 0; j < c[3]; j++) for (let i = 0; i < c[2]; i += 2) {
        const g = new THREE.PlaneGeometry(tm(2) - 0.03, T - 0.03); g.rotateX(-Math.PI / 2);
        F.geo(g, fm, tm(c[0] + i) + T, 0.003, tm(c[1] + j) + T / 2, 0, j % 2 ? Math.PI : 0, 0);
      }
      F.box(w, 0.1, d, MAT.darkWood, mx, -0.05, mz);
    } else F.box(w, 0.1, d, fm, mx, -0.05, mz);
    r.addFloor(tm(c[0]), tm(c[0] + c[2]), tm(c[1]), tm(c[1] + c[3]), 0);
    F.box(w, 0.12, d, MAT.ceiling, mx, WALL_H + 0.06, mz);
  }
}
// walls on every tile edge where the floor stops (or meets another room that isn't joined to it)
function buildWalls(r) {
  const fl = r.fl, wm = AOM[r.def.wall] || MAT.plaster, runs = new Map();
  for (const cell of MAN.grid.values()) {
    if (cell.area !== r) continue;
    for (const side of ['N', 'S', 'W', 'E']) {
      const [dx, dz] = SIDE[side], nb = MAN.grid.get(gkey(fl, cell.x + dx, cell.z + dz));
      if (nb && (nb.area === r || MAN.open.has(edgeKey(fl, cell.x, cell.z, side)))) continue;
      if (MAN.doorEdges.has(edgeKey(fl, cell.x, cell.z, side))) continue;
      const along = side === 'N' || side === 'S' ? cell.x : cell.z, line = side === 'N' ? cell.z : side === 'S' ? cell.z + 1 : side === 'W' ? cell.x : cell.x + 1;
      const key = side + line;
      if (!runs.has(key)) runs.set(key, []);
      runs.get(key).push(along);
    }
  }
  for (const [key, list] of runs) {
    const side = key[0], line = +key.slice(1);
    list.sort((a, b) => a - b);
    let s = list[0], p = list[0];
    for (let i = 1; i < list.length; i++) { if (list[i] === p + 1) { p = list[i]; continue; } wallRun(r, side, line, s, p + 1, wm); s = p = list[i]; }
    wallRun(r, side, line, s, p + 1, wm);
  }
}
// one straight wall along a tile line, standing just inside the room, with a skirting board
function wallRun(r, side, line, a, b, wm, y0 = -2.6, y1 = WALL_H) {
  const len = tm(b - a), mid = tm(a) + len / 2, h = y1 - y0, inward = side === 'N' || side === 'W' ? 1 : -1;
  const F = new Frame(r, 0, 0, 0, 0);
  if (side === 'N' || side === 'S') {
    const z = tm(line) + inward * WT / 2;
    r.batch.add(boxGeo(len, h, WT, wm, tm(a), y0), wm, F._m(mid, (y0 + y1) / 2, z));
    if (y0 < 0 && y1 > 0.2) F.box(len, 0.12, 0.03, MAT.trim, mid, 0.06, tm(line) + inward * (WT + 0.015));
    r.addCollider(tm(a), tm(b), y0, y1, z - WT / 2, z + WT / 2, 'wall');
  } else {
    const x = tm(line) + inward * WT / 2;
    r.batch.add(boxGeo(WT, h, len, wm, tm(a), y0), wm, F._m(x, (y0 + y1) / 2, mid));
    if (y0 < 0 && y1 > 0.2) F.box(0.03, 0.12, len, MAT.trim, tm(line) + inward * (WT + 0.015), 0.06, mid);
    r.addCollider(x - WT / 2, x + WT / 2, y0, y1, tm(a), tm(b), 'wall');
  }
}
// the middle of a tile edge, and the yaw that faces into the room from it
function edgeFrame(x, z, side) {
  const [dx, dz] = SIDE[side];
  const px = cx(x) + dx * T / 2, pz = cx(z) + dz * T / 2;
  const into = { x: -dx, z: -dz };
  return { px, pz, ry: Math.atan2(into.x, into.z), into };   // a Frame's +z faces into the room
}

/* ---------- doors ---------- */
function buildDoor(def) {
  const cell = MAN.grid.get(gkey(def.fl, def.x, def.z)), r = cell.area;
  const { px, pz, ry, into } = edgeFrame(def.x, def.z, def.side);
  const F = new Frame(r, px, 0, pz, ry), wm = AOM[r.def.wall] || MAT.plaster;
  const door = { id: def.id, def, area: r, fl: def.fl, x: def.x, z: def.z, side: def.side, lock: def.lock || null, kind: def.kind || 'door', to: def.to, F };
  F.box(T, WALL_H - DR_H, WT, wm, 0, (DR_H + WALL_H) / 2, WT / 2);
  const trims = new THREE.Group(); F.dyn(trims, 0, 0, 0);
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.08, DR_H, 0.06), MAT.trim); t.position.set(sx * (T / 2 - 0.04), DR_H / 2, WT + 0.02); trims.add(t); }
  const lt = new THREE.Mesh(new THREE.BoxGeometry(T, 0.08, 0.06), MAT.trim); lt.position.set(0, DR_H + 0.04, WT + 0.02); trims.add(lt);
  const piv = new THREE.Group(); F.dyn(piv, -T / 2 + 0.08, 0, WT / 2); piv.userData.baseRy = piv.rotation.y;
  const lw = T - 0.16;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(lw, DR_H - 0.02, 0.07), AOM.door);
  leaf.position.set(lw / 2, DR_H / 2, 0); leaf.castShadow = true; piv.add(leaf);
  const knobs = [0.06, -0.06].map(kz => { const k = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), AOM.knob); k.position.set(lw - 0.1, 1.0, kz); piv.add(k); return k; });
  Object.assign(door, { piv, leaf, knobs, trims });
  if (door.kind === 'hidden') { leaf.material = AOM.wallGrey; knobs.forEach(k => (k.visible = false)); trims.visible = false; }
  door.front = new THREE.Vector3(cx(def.x) + into.x * 0.12, FLOORS[def.fl], cx(def.z) + into.z * 0.12);
  door.center = new THREE.Vector3(px, FLOORS[def.fl] + 1.2, pz);
  door.yawIn = Math.atan2(-into.x, -into.z);         // a camera with this yaw looks into the room
  const ax = Math.abs(into.x), az = Math.abs(into.z);
  r.addCollider(px - az * T / 2 - ax * 0.06, px + az * T / 2 + ax * 0.06, 0, DR_H, pz - ax * T / 2 - az * 0.06, pz + ax * T / 2 + az * 0.06, 'door');
  r.addInteract(leaf, { dist: 2.5, door: true, prompt: () => GAME.doorPrompt(door), use: () => GAME.useDoor(door) });
  MAN.doors[def.id] = door; MAN.doorList.push(door);
  return door;
}
// a leaf swinging open and shut again (when someone goes through)
function animateDoor(door, amt = 1.15, dur = 650) {
  const t0 = performance.now();
  animate(() => {
    const k = (performance.now() - t0) / dur, a = Math.sin(Math.min(1, k) * Math.PI) * amt;
    door.piv.rotation.y = door.piv.userData.baseRy - a;
    return k < 1;
  });
}

/* ---------- stairs ---------- */
function buildStairs(s) {
  const r = MAN.areas[s.area], [x, z, w, h] = s.r, n = h * 3, F = new Frame(r, 0, 0, 0, 0);
  const north = s.dir === 'N';
  Object.assign(s, { entryZ: north ? z + h : z, farZ: north ? z : z + h, x0: x, x1: x + w, room: r });
  r.addFloor(tm(x), tm(x + w), tm(z), tm(z + h), 0, s.rise, 'z', tm(s.entryZ), tm(s.farZ));
  const depth = tm(h) / n, wd = tm(w), mx = tm(x) + wd / 2;
  for (let i = 0; i < n; i++) {
    const zz = tm(s.entryZ) + (north ? -1 : 1) * (i + 0.5) * depth, top = s.rise * (i + 1) / n;
    if (s.rise > 0) F.box(wd, top, depth + 0.01, MAT.darkWood, mx, top / 2, zz);
    else F.box(wd, 0.14, depth + 0.01, MAT.darkWood, mx, top - 0.07, zz);
    F.box(wd, 0.025, 0.05, MAT.trim, mx, top + 0.01, zz + (north ? depth / 2 : -depth / 2));
  }
  for (const [tx, tz] of cellsOf(s.r)) MAN.grid.set(gkey(s.fl, tx, tz), { area: r, x: tx, z: tz, fl: s.fl, stair: s, blocked: false });
  // where the flight runs on into the dark: no ceiling over its far half, and blackness at its end
  const half = Math.ceil(h / 2), vz = north ? z : z + h - half, fz = tm(s.farZ) + (north ? 0.16 : -0.16);
  if (s.rise > 0) { F.box(wd, 0.05, tm(half), MAT.void, mx, WALL_H - 0.02, tm(vz) + tm(half) / 2); F.box(wd, WALL_H, 0.05, MAT.void, mx, WALL_H / 2, fz); }
  else { F.box(wd, -s.rise + 0.6, 0.05, MAT.void, mx, (s.rise - 0.6) / 2, fz); F.box(wd, 0.05, tm(h), MAT.void, mx, s.rise - 0.6, tm(z) + tm(h) / 2); }
  MAN.stairs[s.id] = s;
}
// walls beside a flight where it runs next to open floor (a pit you can't step into, or a flight you can't climb onto from the side)
function stairRails(s) {
  const r = s.room, lo = Math.min(0, s.rise) - 0.4, hi = Math.max(0, s.rise) + 1.0;
  const [x, z, w, h] = s.r;
  for (let zz = z; zz < z + h; zz++) for (const [side, xx] of [['W', x], ['E', x + w - 1]]) {
    const [dx] = SIDE[side], nb = MAN.grid.get(gkey(s.fl, xx + dx, zz));
    if (nb && nb.area === r && !nb.stair) wallRun(r, side, side === 'W' ? xx : xx + 1, zz, zz + 1, MAT.trim, lo, hi);
  }
  const fz = s.dir === 'N' ? z - 1 : z + h, nb = MAN.grid.get(gkey(s.fl, x, fz));
  if (nb && nb.area === r && !nb.stair) wallRun(r, s.dir === 'N' ? 'N' : 'S', s.dir === 'N' ? z : z + h, x, x + w, MAT.trim, lo, hi);
}
// how far along a flight a point is (0 at its entry, 1 at its far end), and the point at a given fraction
function stairS(s, p) { return (p.z - tm(s.entryZ)) / (tm(s.farZ) - tm(s.entryZ)); }
function stairPoint(s, k) { return new THREE.Vector3(tm(s.x0) + tm(s.x1 - s.x0) / 2, FLOORS[s.fl] + s.rise * k, lerp(tm(s.entryZ), tm(s.farZ), k)); }
function onStair(s, p) { return Math.abs(p.y - FLOORS[s.fl]) < 4 && p.x > tm(s.x0) && p.x < tm(s.x1) && p.z > tm(s.r[1]) && p.z < tm(s.r[1] + s.r[3]); }

/* ---------- furniture of this house ---------- */
function box(r, w, h, d, mat, x, y, z, ry = 0, collide = true) {
  const F = new Frame(r, x, 0, z, ry); F.box(w, h, d, mat, 0, y + h / 2, 0);
  if (collide) F.collide(-w / 2, w / 2, y, y + h, -d / 2, d / 2);
  return F;
}
// furniture that can be pushed: its own group of meshes and a collider that follows it
function movable(r, x, z, w, d, h) {
  const g = new THREE.Group(); g.position.set(x, 0, z); r.group.add(g);
  const col = r.addCollider(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, 'furn');
  return {
    g, col, r, w, d, at: 0,
    add(geo, mat, px, py, pz) { const o = new THREE.Mesh(geo, mat); o.position.set(px, py, pz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; },
    slide(nx, nz, dur = 500) {
      const fx = g.position.x, fz = g.position.z, t0 = performance.now();
      col.lx0 = nx - w / 2; col.lx1 = nx + w / 2; col.lz0 = nz - d / 2; col.lz1 = nz + d / 2; r._colliderWorld(col);
      SFX.push && SFX.push(new THREE.Vector3(nx, r.y + 0.5, nz));
      animate(() => { const k = Math.min(1, (performance.now() - t0) / dur); g.position.x = lerp(fx, nx, smoothstep(0, 1, k)); g.position.z = lerp(fz, nz, smoothstep(0, 1, k)); return k < 1; });
    },
    place(nx, nz) { g.position.x = nx; g.position.z = nz; col.lx0 = nx - w / 2; col.lx1 = nx + w / 2; col.lz0 = nz - d / 2; col.lz1 = nz + d / 2; r._colliderWorld(col); },
  };
}
// a tall two-door wardrobe (the original's closet): front is local +z
function addTansu(r, x, z, ry, opt = {}) {
  const F = new Frame(r, x, 0, z, ry), W = 1.02, H = 2.3, D = 0.7, wood = opt.mat || MAT.darkWood;
  F.box(W, H, 0.04, wood, 0, H / 2, -D / 2 + 0.02);
  F.box(0.05, H, D, wood, -W / 2 + 0.025, H / 2, 0); F.box(0.05, H, D, wood, W / 2 - 0.025, H / 2, 0);
  F.box(W + 0.06, 0.08, D + 0.04, wood, 0, H + 0.04, 0); F.box(W, 0.1, D, wood, 0, 0.05, 0);
  F.box(W - 0.08, H - 0.2, 0.02, MAT.black, 0, H / 2, -D / 2 + 0.05);
  F.cyl(0.012, 0.012, W - 0.1, MAT.brass, 0, H - 0.25, -0.05, 6, 0, 0, Math.PI / 2);
  const doors = [];
  for (const sd of [-1, 1]) {
    const piv = new THREE.Group(); F.dyn(piv, sd * (W / 2 - 0.03), 0, D / 2 - 0.02); piv.userData.baseRy = piv.rotation.y;
    const dw = W / 2 - 0.045, leaf = new THREE.Mesh(boxGeo(dw, H - 0.18, 0.035, wood), wood);
    leaf.position.set(-sd * dw / 2, H / 2 + 0.02, 0); leaf.castShadow = true; piv.add(leaf);
    const inset = new THREE.Mesh(boxGeo(dw - 0.12, 0.8, 0.012, wood), wood); inset.position.set(-sd * dw / 2, H * 0.66, 0.022); piv.add(inset);
    const inset2 = inset.clone(); inset2.position.y = H * 0.3; piv.add(inset2);
    const kb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), MAT.brass); kb.position.set(-sd * (dw - 0.06), H * 0.5, 0.03); piv.add(kb);
    doors.push(piv);
  }
  F.collide(-W / 2, W / 2, 0, H + 0.08, -D / 2, D / 2);
  const hide = { type: 'closet', room: r, camL: F.pt(0, 1.52, D / 2 - 0.12), exitL: F.pt(0, 0, D / 2 + 0.6), yawL: ry + Math.PI, doors, F, blockedUntil: 0 };
  r.hides.push(hide); MAN.hides.push(hide);
  for (const d of doors) r.addInteract(d, { dist: 2.4, icon: 'hide', prompt: () => (PLAYER.hidden ? null : hide.prompt ? hide.prompt() : 'クローゼットに隠れる'), use: () => (hide.use ? hide.use() : GAME.enterHide(hide)) });
  return hide;
}
function addSimpleBed(r, x, z, opt = {}) {
  const W = opt.w || 1.0, L = 2.0, wood = MAT.darkWood, b = movable(r, x, z, W + 0.06, L + 0.06, 0.95);
  b.add(new THREE.BoxGeometry(W + 0.06, 0.9, 0.06), wood, 0, 0.45, -L / 2);
  b.add(new THREE.BoxGeometry(W + 0.06, 0.5, 0.06), wood, 0, 0.25, L / 2);
  b.add(new THREE.BoxGeometry(W, 0.28, L), wood, 0, 0.2, 0);
  b.add(new THREE.BoxGeometry(W - 0.04, 0.16, L - 0.1), MAT.sheet, 0, 0.42, 0);
  b.add(new THREE.BoxGeometry(W, 0.06, L * 0.62), opt.blanket || MAT.blanket, 0, 0.52, L * 0.18);
  b.add(new THREE.BoxGeometry(W * 0.7, 0.1, 0.32), MAT.sheet, 0, 0.53, -L / 2 + 0.3);
  return b;
}
function addChairW(r, x, z, ry, mat = AOM.white) {
  const c = movable(r, x, z, 0.48, 0.48, 0.9), g = new THREE.Group(); g.rotation.y = ry; c.g.add(g);
  const add = (w, h, d, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(px, py, pz); o.castShadow = true; g.add(o); };
  add(0.44, 0.05, 0.44, 0, 0.46, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(0.04, 0.46, 0.04, sx * 0.19, 0.23, sz * 0.19);
  add(0.44, 0.5, 0.04, 0, 0.74, -0.2);
  return c;
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
  // the red stain over three of the keys (wiped off with the soapy handkerchief)
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.13), new THREE.MeshStandardMaterial({ color: 0x5a0a0a, roughness: 0.4 }));
  st.rotation.x = -Math.PI / 2; st.position.copy(F.pt(0.05, 0.793, 0.86)); st.userData.ownMat = true; room.group.add(st);
  return { F, stain: st };
}
function lamp(r, x, z, opt = {}) { return addBulb(r, x * T, WALL_H, z * T, Object.assign({ intensity: 3.6, range: 9, drop: 0.55 }, opt)); }
function interactBox(room, x, y, z, w, h, d, prompt, use, opt = {}) {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(x, y, z); room.group.add(hit);
  room.addInteract(hit, Object.assign({ dist: 2.4, prompt, use }, opt));
  return hit;
}
function examine(r, x, y, z, w, h, d, prompt, fn) { return interactBox(r, x, y, z, w, h, d, prompt, fn, { icon: 'eye' }); }
// something that glints where an item lies
function shineAt(r, x, y, z, id, visible = true) {
  const m = makeItemMesh(ITEMS[id].icon === 'key' ? 'key' : 'paper');
  m.position.set(x, y, z); m.scale.setScalar(ITEMS[id].icon === 'key' ? 1.6 : 0.8); m.rotation.y = 0.7;
  const glow = glowSprite(0xfff3c0, 0.3, 0.5); glow.position.y = 0.05; m.add(glow);
  r.group.add(m); m.visible = visible;
  MAN.props[id] = m;
  return m;
}

const FURNISH = {
  foyer(r) {
    box(r, tm(7), 0.03, T, AOM.genkan, tm(16.5), 0, tm(5.5), 0, false);   // the genkan by the front door
    box(r, T, 0.03, T, AOM.genkan, tm(16.5), 0, tm(6.5), 0, false);
    r.spawn = { x: tm(16.2), z: tm(2.7), yaw: 0 };
    r.friendsAt = [[tm(13.6), tm(0.9)], [tm(15.6), tm(0.4)], [tm(18.4), tm(1.0)]];
  },
  toilet(r) {
    // the toilet in the stall, a see-through shelf by the way in (the detergent is in it)
    const tF = new Frame(r, cx(-3) + 0.15, 0, cx(6), -Math.PI / 2);
    tF.box(0.42, 0.42, 0.6, AOM.white, 0, 0.21, 0); tF.box(0.44, 0.5, 0.2, AOM.white, 0, 0.6, -0.36); tF.box(0.38, 0.04, 0.5, AOM.white, 0, 0.44, 0.02);
    tF.collide(-0.24, 0.24, 0, 0.8, -0.45, 0.32);
    const sh = new Frame(r, cx(-5), 0, tm(1) + 0.25, 0);
    sh.box(0.8, 1.6, 0.36, MAT.trim, 0, 0.8, -0.02); sh.box(0.74, 1.5, 0.02, MAT.glass, 0, 0.82, 0.18);
    for (let i = 0; i < 3; i++) sh.box(0.74, 0.02, 0.3, MAT.glass, 0, 0.35 + i * 0.45, 0);
    sh.collide(-0.4, 0.4, 0, 1.6, -0.18, 0.18);
    const bottle = new THREE.Group(), b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 10), std({ color: 0x3fa0e0, roughness: 0.3 })); b.position.y = 0.1; bottle.add(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.06, 8), AOM.white); cap.position.y = 0.23; bottle.add(cap);
    bottle.position.copy(sh.pt(0.15, 0.81, 0)); r.group.add(bottle); MAN.props.soap = bottle;
    examine(r, cx(-5), 1.0, tm(1) + 0.3, 0.9, 1.6, 0.5, () => (STORY.hasGot('soap') ? null : '棚を調べる'), () => STORY.event('soap'));
    examine(r, cx(-3), 0.5, cx(6), 0.6, 0.9, 0.7, () => 'トイレ', () => GAME.say([['ひろし', '……ふつうのトイレだ。']]));
  },
  bath(r) {
    // left: the bath (pink tub, dark blue tiles); right: the washroom (washing machine, basin)
    box(r, tm(3) - 0.02, 0.01, tm(2) - 0.02, AOM.tileBlue, tm(-0.5), 0, tm(-8), 0, false);
    const tub = new Frame(r, cx(-2), 0, tm(-8), 0);
    tub.box(0.95, 0.6, 2.05, AOM.pink, 0, 0.3, 0); tub.box(0.75, 0.04, 1.85, MAT.black, 0, 0.42, 0); tub.collide(-0.48, 0.48, 0, 0.6, -1.03, 1.03);
    const water = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.04, 1.84), new THREE.MeshStandardMaterial({ color: 0x5f7f92, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.8 }));
    water.position.copy(tub.pt(0, 0.56, 0)); water.userData.ownMat = true; r.group.add(water); MAN.tubWater = water;
    const sw = new Frame(r, cx(-1), 0, tm(-9) + 0.12, 0); sw.cyl(0.015, 0.015, 1.2, MAT.steel, -0.2, 1.4, 0, 6); sw.cyl(0.06, 0.04, 0.05, MAT.steel, -0.2, 2.0, 0.05, 10, Math.PI / 2, 0, 0);
    sw.box(0.6, 0.8, 0.02, MAT.glass, 0.35, 1.6, 0);
    const wm = new Frame(r, cx(3), 0, tm(-9) + 0.4, 0);
    wm.box(0.6, 0.85, 0.6, AOM.white, 0, 0.425, 0); wm.cyl(0.2, 0.2, 0.02, std({ color: 0x3050c0, roughness: 0.3 }), 0, 0.86, 0, 16); wm.collide(-0.3, 0.3, 0, 0.9, -0.3, 0.3);
    const sk = new Frame(r, cx(4), 0, tm(-9) + 0.3, 0);
    sk.box(0.55, 0.8, 0.45, std({ color: 0xb8662a, roughness: 0.5 }), 0, 0.4, 0); sk.box(0.58, 0.08, 0.48, AOM.white, 0, 0.84, 0); sk.box(0.45, 0.6, 0.02, MAT.glass, 0, 1.45, -0.2);
    sk.collide(-0.28, 0.28, 0, 0.9, -0.24, 0.24);
    examine(r, cx(-2), 0.6, tm(-8), 1.0, 0.7, 2.1, () => (STORY.hasGot('driver') ? null : '浴槽を調べる'), () => STORY.event('tub'));
    examine(r, cx(3), 0.6, tm(-9) + 0.4, 0.6, 1.0, 0.6, () => '洗濯機', () => GAME.say([['ひろし', '洗濯機だ。中はからっぽだ。']]));
  },
  kitchen(r) {
    const ox = 34, oz = -6;
    // the back wall: fridge, counter and cabinets; the island with the sink and the stove
    box(r, 0.8, 1.9, 0.7, std({ color: 0xc9cdd2, roughness: 0.35, metalness: 0.2 }), tm(ox + 3.5), 0, tm(oz) + 0.5);
    box(r, tm(4) - 0.1, 0.9, 0.6, AOM.teal, tm(ox + 6), 0, tm(oz) + 0.45);
    box(r, tm(4) - 0.1, 0.04, 0.62, AOM.white, tm(ox + 6), 0.9, tm(oz) + 0.45, 0, false);
    box(r, tm(4) - 0.1, 0.7, 0.36, AOM.teal, tm(ox + 6), 1.65, tm(oz) + 0.33, 0, false);
    const isl = new Frame(r, tm(ox + 6), 0, tm(oz + 1.9), 0);
    isl.box(tm(4) - 0.1, 0.85, 0.7, AOM.teal, 0, 0.425, 0); isl.box(tm(4) - 0.06, 0.05, 0.74, AOM.white, 0, 0.87, 0);
    isl.box(0.5, 0.06, 0.38, MAT.steel, -0.7, 0.88, 0); isl.box(0.5, 0.03, 0.4, MAT.black, 1.2, 0.9, 0);
    for (const sx of [1.05, 1.35]) isl.cyl(0.09, 0.09, 0.01, MAT.iron, sx, 0.92, 0, 12);
    isl.collide(-tm(2), tm(2), 0, 0.9, -0.37, 0.37);
    // the dining table and its four white chairs
    const tb = new Frame(r, tm(ox + 4.55), 0, tm(oz + 4.8), 0);
    tb.box(2.6, 0.06, 4.6, MAT.wood, 0, 0.76, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) tb.box(0.08, 0.74, 0.08, MAT.darkWood, sx * 1.2, 0.37, sz * 2.2);
    tb.collide(-1.3, 1.3, 0, 0.8, -2.3, 2.3);
    for (const [x, z, ry] of [[ox + 2.4, oz + 3.6, Math.PI / 2], [ox + 2.4, oz + 6.2, Math.PI / 2], [ox + 6.7, oz + 4.4, -Math.PI / 2], [ox + 6.7, oz + 6.4, -Math.PI / 2]]) addChairW(r, tm(x), tm(z), ry);
    // the broken plate
    const shards = new THREE.Group(), plate = std({ color: 0xf2efe8, roughness: 0.35 });
    for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06 + Math.random() * 0.05, 0.04, 0.012, 3 + (i % 3)), plate); s.position.set((Math.random() - 0.5) * 0.6, 0.006, (Math.random() - 0.5) * 0.5); s.rotation.y = Math.random() * TAU; shards.add(s); }
    shards.position.set(tm(ox + 3.4), 0, tm(oz + 1.6)); r.group.add(shards); MAN.props.plate = shards;
    interactBox(r, tm(ox + 3.4), 0.15, tm(oz + 1.6), 0.9, 0.4, 0.8, () => (STORY.hasGot('shard') ? null : '割れたお皿を調べる'), () => STORY.event('plate'), { icon: 'eye' });
    // the living corner: a rug and an L-shaped sofa
    box(r, tm(6.6), 0.012, tm(5), AOM.rug, tm(ox + 3.6), 0, tm(oz + 11), 0, false);
    box(r, tm(6.6) - 0.3, 0.014, tm(5) - 0.3, AOM.rug, tm(ox + 3.6), 0, tm(oz + 11), 0, false);
    addSofa(r, tm(ox + 5.7), tm(oz + 10.4), -Math.PI / 2, AOM.grey, 2.2);
    addSofa(r, tm(ox + 3), tm(oz + 12.7), 0, AOM.grey, 2.4);
    box(r, 1.0, 0.4, 0.6, MAT.darkWood, tm(ox + 3.5), 0, tm(oz + 10.6));
  },
  library(r) {
    const ox = 17, oz = -25;
    const shelf = (c0, z, tall = true) => addBookshelf(r, tm(ox + c0 + 1.5), tm(oz + z), 0, tm(3) - 0.15, tall ? 2.5 : 1.2);
    for (const c of [0, 3, 10, 13]) shelf(c, 3.0);
    for (const c of [0, 10, 13]) shelf(c, 7.0);
    shelf(7, 10.1, false); shelf(10, 10.1, false); shelf(13, 10.1, true);
    for (const c of [7, 10, 13]) shelf(c, 14.0);
    // the messy table
    const tb = new Frame(r, tm(ox + 1.95), 0, tm(oz + 12.3), 0);
    tb.box(tm(3.9) - 0.1, 0.06, tm(5.5) - 0.1, MAT.darkWood, 0, 0.78, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tb.box(0.08, 0.76, 0.08, MAT.darkWood, sx * (tm(1.95) - 0.12), 0.38, sz * (tm(2.75) - 0.12));
    tb.collide(-tm(1.95), tm(1.95), 0, 0.82, -tm(2.75), tm(2.75));
    for (let i = 0; i < 14; i++) { const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), MAT.paper); pg.rotation.set(-Math.PI / 2, 0, Math.random() * TAU); pg.position.copy(tb.pt((Math.random() - 0.5) * 3.4, 0.815, (Math.random() - 0.5) * 5.4)); r.group.add(pg); }
    for (let i = 0; i < 6; i++) { const bk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.28), std({ color: [0x7a2a2a, 0x2a4a7a, 0x6a5a2a, 0x8a7a3a][i % 4], roughness: 0.7 })); bk.position.copy(tb.pt((Math.random() - 0.5) * 2.6, 0.835, (Math.random() - 0.5) * 4.8)); bk.rotation.y = Math.random() * TAU; r.group.add(bk); }
    // the lone green book: the bedroom key is under it
    const gb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.32), std({ color: 0x2e7a3a, roughness: 0.6 })); gb.position.copy(tb.pt(1.6, 0.84, 1.6)); r.group.add(gb); MAN.props.greenBook = gb;
    shineAt(r, gb.position.x, 0.83, gb.position.z, 'k_bedroom', false);
    interactBox(r, gb.position.x, 0.9, gb.position.z, 0.5, 0.3, 0.5, () => (STORY.hasGot('k_bedroom') ? null : (STORY.flags.bookMoved ? '寝室の鍵を拾う' : '本を調べる')), () => STORY.event('greenBook'), { icon: 'eye' });
    box(r, 0.45, 0.45, 0.45, MAT.darkWood, tm(ox + 0.5), 0, tm(oz + 15.5));
    r.oniGlimpse = [[tm(ox + 8), tm(oz + 5)], [tm(ox + 0.8), tm(oz + 5)]];
    r.oniSpawn = [tm(ox + 4.5), tm(oz + 4.8)];
  },
  corT(r) {
    // the slightly greyer wallpaper on the right
    for (const x of [22, 24]) { const F = new Frame(r, cx(x), 0, tm(-32) + WT + 0.012, 0); F.box(T + 0.02, WALL_H - 0.1, 0.01, AOM.wallGrey, 0, (WALL_H - 0.1) / 2 + 0.05, 0); }
  },
  tatami(r) {
    // fusuma along the back: the right pair is where it comes out from; the left pair hides the lighter
    const F = new Frame(r, tm(15), 0, tm(-40) + WT + 0.02, 0);
    F.box(tm(6), 0.35, 0.08, MAT.darkWood, 0, 2.2, 0.02); F.box(tm(6), 0.06, 0.1, MAT.darkWood, 0, 0.03, 0.02);
    MAN.fusuma = [];
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(tm(1.5) - 0.03, 2.0, 0.04), AOM.fusuma); p.position.copy(F.pt(-tm(2.25) + i * tm(1.5), 1.02, 0.04 + (i % 2) * 0.05)); r.group.add(p);
      p.userData.home = p.position.clone(); MAN.fusuma.push(p);
    }
    F.box(tm(6) - 0.02, 2.0, 0.02, MAT.black, 0, 1.02, -0.02);
    examine(r, tm(13.5), 1.1, tm(-40) + 0.3, tm(3) - 0.1, 2.0, 0.4, () => (STORY.hasGot('lighter') ? null : 'ふすまを調べる'), () => STORY.event('fusumaL'));
    examine(r, tm(16.5), 1.1, tm(-40) + 0.3, tm(3) - 0.1, 2.0, 0.4, () => 'ふすまを調べる', () => STORY.event('fusumaR'));
    box(r, 0.6, 0.35, 0.6, MAT.darkWood, tm(17.5) - 0.3, 0, tm(-35));
  },
  hidden(r) {
    const ox = 30, oz = -44;
    // the bookshelf that hides the way to the jail (top left), a candle on a little table
    const bs = movable(r, tm(ox + 1.5), tm(oz) + 0.45, tm(2) - 0.15, 0.5, 2.4);
    bs.add(new THREE.BoxGeometry(tm(2) - 0.15, 2.4, 0.5), MAT.darkWood, 0, 1.2, 0);
    for (let i = 0; i < 5; i++) bs.add(new THREE.BoxGeometry(tm(2) - 0.3, 0.38, 0.04), i % 2 ? MAT.books : MAT.books2, 0, 0.3 + i * 0.45, 0.24);
    MAN.jailShelf = bs;
    interactBox(r, tm(ox + 1.5), 1.2, tm(oz) + 0.5, tm(2), 2.2, 0.6, () => (bs.at ? null : '本棚を調べる'), () => STORY.event('jailShelf'), { icon: 'hand' });
    const t = new Frame(r, tm(ox + 6.5), 0, tm(oz + 3.5), 0); t.box(0.8, 0.05, 0.6, MAT.darkWood, 0, 0.72, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.box(0.05, 0.7, 0.05, MAT.darkWood, sx * 0.35, 0.35, sz * 0.25);
    t.collide(-0.4, 0.4, 0, 0.75, -0.3, 0.3);
    MAN.candle = addCandle(t, 0, 0.745, 0, r); MAN.candle.state = 'off'; MAN.candle.intensity = 2.4; MAN.candle.range = 9; MAN.candle.level = 0;
    interactBox(r, tm(ox + 6.5), 0.9, tm(oz + 3.5), 0.5, 0.4, 0.5, () => (MAN.candle.state === 'on' ? null : 'ろうそくを調べる'), () => STORY.event('candle'), { icon: 'hand' });
    addCrate(r, tm(ox + 8) - 0.2, tm(oz + 7) - 0.2, 0.7, 0.3); addCrate(r, tm(ox + 0.6), tm(oz + 6.8), 0.6, 0.9);
  },
  jail(r) {
    const ox = 30, oz = -53, z = tm(oz + 3);
    // bars across the room; the cell door is the gap at the left
    for (let x = tm(ox) + 0.1; x < tm(ox + 7) - 0.05; x += 0.16) { if (x > tm(ox + 1) && x < tm(ox + 2)) continue; new Frame(r, x, 0, z, 0).cyl(0.02, 0.02, WALL_H, MAT.iron, 0, WALL_H / 2, 0, 6); }
    const F = new Frame(r, 0, 0, z, 0); F.box(tm(7), 0.07, 0.07, MAT.iron, tm(ox + 3.5), 2.5, 0); F.box(tm(7), 0.06, 0.06, MAT.iron, tm(ox + 3.5), 0.1, 0);
    r.addCollider(tm(ox), tm(ox + 1), 0, WALL_H, z - 0.06, z + 0.06, 'bars'); r.addCollider(tm(ox + 2), tm(ox + 7), 0, WALL_H, z - 0.06, z + 0.06, 'bars');
    const piv = new THREE.Group(); F.dyn(piv, tm(ox + 1), 0, 0); piv.userData.baseRy = piv.rotation.y;
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6), MAT.iron); b.position.set(0.08 + i * 0.15, 1.2, 0); piv.add(b); }
    for (const y of [0.1, 1.2, 2.35]) { const b = new THREE.Mesh(new THREE.BoxGeometry(T - 0.04, 0.05, 0.05), MAT.iron); b.position.set(T / 2, y, 0); piv.add(b); }
    const col = r.addCollider(tm(ox + 1), tm(ox + 2), 0, WALL_H, z - 0.06, z + 0.06, 'bars');
    const cell = MAN.cell = { piv, col, closed: false, room: r, z, x0: tm(ox), x1: tm(ox + 7) };
    cell.set = closed => {
      cell.closed = closed; col.on = closed;
      const t0 = performance.now(), from = piv.rotation.y, to = piv.userData.baseRy + (closed ? 0 : 1.6);
      animate(() => { const k = Math.min(1, (performance.now() - t0) / 400); piv.rotation.y = lerp(from, to, smoothstep(0, 1, k)); return k < 1; });
      SFX.cellDoor(new THREE.Vector3(tm(ox + 1.5), FLOORS.F1 + 1, z));
    };
    piv.rotation.y = piv.userData.baseRy + 1.6; col.on = false;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(T, 2.4, 0.25), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(tm(ox + 1.5), 1.2, z); r.group.add(hit);
    r.addInteract(hit, { dist: 2.4, icon: 'hand', prompt: () => (ONI.state === 'bars' ? null : cell.closed ? '牢の扉を開ける' : '牢の扉を閉める'), use: () => cell.set(!cell.closed) });
    shineAt(r, tm(ox + 4.5), 0.01, tm(oz + 1.2), 'k_basement');
    interactBox(r, tm(ox + 4.5), 0.2, tm(oz + 1.2), 0.6, 0.4, 0.6, () => (STORY.hasGot('k_basement') ? null : '地下室の鍵を拾う'), () => STORY.event('basementKey'), { icon: 'hand' });
    box(r, 1.2, 0.06, 0.7, std({ color: 0x8a7a40, roughness: 1 }), tm(ox + 6), 0, tm(oz + 0.7), 0, false);
  },
  piano(r) {
    const ox = 0, oz = 2;
    const pn = addPiano(r, tm(ox + 5.5), tm(oz + 4.8), 0); MAN.pianoStain = pn.stain;
    interactBox(r, tm(ox + 5.5), 0.85, tm(oz + 4.8) + 0.95, 1.5, 0.4, 0.5, () => 'ピアノを調べる', () => STORY.event('piano'), { icon: 'hand' });
    // white drawers on the left (the safe is behind them), white shelves on the right
    const dr = movable(r, tm(ox + 1), tm(oz) + 0.35, tm(2) - 0.1, 0.5, 0.9);
    dr.add(new THREE.BoxGeometry(tm(2) - 0.1, 0.85, 0.5), AOM.white, 0, 0.425, 0);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { dr.add(new THREE.BoxGeometry(tm(1) - 0.12, 0.34, 0.02), AOM.white, (j - 0.5) * tm(1), 0.22 + i * 0.4, 0.26); dr.add(new THREE.SphereGeometry(0.02, 8, 6), MAT.brass, (j - 0.5) * tm(1), 0.22 + i * 0.4, 0.28); }
    MAN.pianoDrawers = dr;
    interactBox(r, tm(ox + 1), 0.6, tm(oz) + 0.45, tm(2), 1.0, 0.7, () => (dr.at ? null : '棚を調べる'), () => STORY.event('pianoShelf'), { icon: 'hand' });
    addBookshelf(r, tm(ox + 10), tm(oz) + 0.3, 0, tm(2) - 0.1, 1.9, { mat: AOM.white });
    // the safe in the wall, behind the drawers
    const sf = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.3), std({ color: 0x2a2c30, metalness: 0.6, roughness: 0.4 })); body.position.y = 0.3; sf.add(body);
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), MAT.steel); dial.rotation.x = Math.PI / 2; dial.position.set(-0.18, 0.3, 0.16); sf.add(dial);
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ color: 0x0a0a0a })); disp.position.set(0.1, 0.3, 0.151); sf.add(disp);
    sf.position.set(tm(ox + 1), 0.05, tm(oz) + 0.3); r.group.add(sf); MAN.safe = sf;
    interactBox(r, tm(ox + 1), 0.35, tm(oz) + 0.4, 0.8, 0.7, 0.4, () => (dr.at && !STORY.flags.safeOpen ? '金庫を調べる' : null), () => UI.safe(), { icon: 'hand' });
    const st = new Frame(r, tm(ox + 9), 0, tm(oz + 7.5), 0); st.cyl(0.02, 0.02, 1.2, MAT.brass, 0, 0.6, 0, 6); st.box(0.35, 0.25, 0.02, MAT.brass, 0, 1.25, 0, -0.4, 0, 0);
    r.landing = { x: tm(ox + 1.5), z: tm(oz + 6.5), yaw: -Math.PI / 2 };
  },
  cor2(r) { addPlant(r, tm(13) + 0.5, tm(14) - 0.5, 1); },
  kids(r) {
    const ox = 7, oz = -13;
    addSimpleBed(r, tm(ox + 1), tm(oz + 1.2), { w: 0.95, blanket: std({ color: 0xd06a8a, roughness: 0.9 }) });
    // the tall shelf with the lighter oil on top, and the chair that can be pushed over to it
    addBookshelf(r, tm(ox + 6.5), tm(oz) + 0.3, 0, tm(1.5), 2.6, { mat: MAT.wood });
    const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 10), std({ color: 0xd8b030, roughness: 0.4, metalness: 0.4 })); oil.position.set(tm(ox + 6.5), 2.72, tm(oz) + 0.3); r.group.add(oil); MAN.props.oil = oil;
    const ch = MAN.kidsChair = addChairW(r, tm(ox + 3.5), tm(oz + 4), 0, MAT.wood);
    r.addInteract(ch.g, { dist: 2.4, icon: 'hand', prompt: () => (ch.at ? null : 'イスを押す'), use: () => STORY.event('kidsChair') });
    examine(r, tm(ox + 6.5), 1.8, tm(oz) + 0.5, tm(1.5), 2.6, 0.6, () => (STORY.hasGot('oil') ? null : '棚の上を調べる'), () => STORY.event('kidsShelf'));
    addRug(r, tm(ox + 5), tm(oz + 5), tm(3), tm(2), 0, 5);
    for (let i = 0; i < 5; i++) box(r, 0.16, 0.16, 0.16, std({ color: [0xd04040, 0x3a70d0, 0xe0c040, 0x40a050, 0xa060c0][i], roughness: 0.6 }), tm(ox + 4.5) + i * 0.22, 0, tm(oz + 5.3) + (i % 2) * 0.2, i, false);
    r.mikaAt = { x: tm(ox + 2.2), z: tm(oz + 6.2), yaw: Math.PI * 0.75 };
  },
  takeshi(r) {
    const ox = 17, oz = -13;
    MAN.tkCloset = addTansu(r, tm(ox) + 0.6, tm(oz) + 0.5, 0);
    // the desk (the library key is under it once the chair is out of the way)
    const dk = new Frame(r, tm(ox + 4.5), 0, tm(oz) + 0.55, 0);
    dk.box(1.6, 0.05, 0.75, MAT.wood, 0, 0.76, 0); dk.box(0.45, 0.72, 0.7, MAT.wood, 0.55, 0.36, 0); dk.box(0.04, 0.72, 0.7, MAT.wood, -0.78, 0.36, 0);
    dk.collide(-0.8, 0.8, 0.5, 0.8, -0.38, 0.38); dk.collide(0.32, 0.8, 0, 0.8, -0.38, 0.38);
    addTableLamp(r, dk, -0.5, 0.785, -0.15);
    const ch = MAN.tkChair = addChairW(r, tm(ox + 4.5) - 0.25, tm(oz) + 1.25, Math.PI, MAT.wood);
    r.addInteract(ch.g, { dist: 2.4, icon: 'hand', prompt: () => (ch.at ? null : 'イスを押す'), use: () => STORY.event('tkChair') });
    shineAt(r, tm(ox + 4.5) - 0.3, 0.01, tm(oz) + 0.5, 'k_library', false);
    interactBox(r, tm(ox + 4.5) - 0.3, 0.3, tm(oz) + 0.6, 0.7, 0.6, 0.6, () => (ch.at && !STORY.hasGot('k_library') ? '机の下を調べる' : null), () => STORY.event('libraryKey'), { icon: 'eye' });
    addBookshelf(r, tm(ox + 7.6), tm(oz) + 0.3, 0, tm(2), 2.4);
    addDresser(r, tm(ox + 2.3), tm(oz) + 0.35, 0, { w: 1.2, h: 0.9, d: 0.5, rows: 3, cols: 1, mat: MAT.wood });
    addSimpleBed(r, tm(ox + 8) + 0.2, tm(oz + 6));
    // the handkerchief turns up in front of the closet after the first chase
    const hk = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), std({ color: 0xf4f4f0, roughness: 0.9, side: THREE.DoubleSide })); hk.rotation.x = -Math.PI / 2; hk.position.set(tm(ox) + 0.7, 0.012, tm(oz) + 1.6); hk.visible = false; r.group.add(hk); MAN.props.hanky = hk;
    interactBox(r, tm(ox) + 0.7, 0.15, tm(oz) + 1.6, 0.5, 0.3, 0.5, () => (hk.visible && !STORY.hasGot('hanky') ? '白いものを拾う' : null), () => STORY.event('hanky'), { icon: 'hand' });
  },
  attic(r) {
    const ox = 11, oz = -12;
    MAN.atCloset = addTansu(r, tm(ox) + 0.6, tm(oz) + 0.5, 0);
    for (const [x, z, s, ry] of [[ox + 7.5, oz + 0.8, 0.8, 0.2], [ox + 8.2, oz + 1.6, 0.6, 0.6], [ox + 6.5, oz + 0.7, 0.55, 1.1], [ox + 0.8, oz + 8.5, 0.7, 0.4], [ox + 8, oz + 8.6, 0.7, 0]]) addCrate(r, tm(x), tm(z), s, ry);
    addShelfRack(r, tm(ox + 4.5), tm(oz) + 0.4, 0, 2.2, 2.2, { mat: MAT.darkWood });
  },
  bed3(r) {
    const ox = 0, oz = 4;
    // two beds; the left one stands on boards of another colour (it can be pushed aside)
    MAN.leftBed = addSimpleBed(r, tm(ox + 2.5), tm(oz + 1));
    r.addInteract(MAN.leftBed.g, { dist: 2.4, icon: 'hand', prompt: () => (MAN.leftBed.at ? null : 'ベッドを押す'), use: () => STORY.event('pushBed') });
    addSimpleBed(r, tm(ox + 5.5), tm(oz + 1));
    addNightstand(r, tm(ox + 4), tm(oz) + 0.4, 0);
    box(r, T - 0.05, 0.004, tm(2) - 0.05, AOM.floorPale, tm(ox + 1.5), 0.002, tm(oz + 1), 0, false);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), MAT.void); hole.rotation.x = -Math.PI / 2; hole.position.set(tm(ox + 2.5), 0.012, tm(oz + 1)); hole.visible = false; r.group.add(hole); MAN.hole = hole;
    addDresser(r, tm(ox + 8) + 0.3, tm(oz + 5), -Math.PI / 2, { w: 1.4, h: 0.9, d: 0.5, rows: 3, cols: 1, mat: MAT.wood });
    addRug(r, tm(ox + 4), tm(oz + 5.5), tm(4), tm(2.5), 0, 7);
  },
};

/* ---------- the tiles the oni walks ---------- */
function buildNav() {
  // a tile is blocked for it when furniture covers its middle
  for (const c of MAN.grid.values()) {
    const y = FLOORS[c.fl], px = cx(c.x), pz = cx(c.z);
    c.blocked = false;
    for (const col of c.area.colliders) {
      if (col.tag !== 'furn' || !col.on || col.wy1 < y + 0.3) continue;
      if (px > col.x0 - 0.15 && px < col.x1 + 0.15 && pz > col.z0 - 0.15 && pz < col.z1 + 0.15) { c.blocked = true; break; }
    }
  }
  MAN.nodes = [...MAN.grid.values()];
  MAN.nodes.forEach((n, i) => { n.i = i; n.e = []; });
  const dirOf = (a, b) => (b.x > a.x ? 'E' : b.x < a.x ? 'W' : b.z > a.z ? 'S' : 'N');
  const passable = (a, b) => {
    if (!b || b.blocked) return false;
    if (MAN.doorEdges.has(edgeKey(a.fl, a.x, a.z, dirOf(a, b)))) return false;
    if (a.area !== b.area) return MAN.open.has(edgeKey(a.fl, a.x, a.z, dirOf(a, b)));
    if (a.stair || b.stair) {
      if (a.stair && b.stair) return a.stair === b.stair;
      const s = a.stair || b.stair, other = a.stair ? b : a, inS = a.stair ? a : b;
      const first = s.dir === 'N' ? s.entryZ - 1 : s.entryZ, before = s.dir === 'N' ? s.entryZ : s.entryZ - 1;
      return inS.z === first && other.z === before && other.x === inS.x;
    }
    return true;
  };
  for (const n of MAN.nodes) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const m = MAN.grid.get(gkey(n.fl, n.x + dx, n.z + dz));
      if (passable(n, m)) n.e.push({ n: m, w: 1 });
    }
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const m = MAN.grid.get(gkey(n.fl, n.x + dx, n.z + dz)), a = MAN.grid.get(gkey(n.fl, n.x + dx, n.z)), b = MAN.grid.get(gkey(n.fl, n.x, n.z + dz));
      if (m && a && b && !n.stair && !m.stair && !a.stair && !b.stair && passable(n, a) && passable(n, b) && passable(a, m) && passable(b, m)) n.e.push({ n: m, w: 1.41 });
    }
  }
  // doors and stairs: it goes through them as you do
  for (const d of MAN.doorList) {
    const p = d.to && MAN.doors[d.to]; if (!p) continue;
    const a = MAN.grid.get(gkey(d.fl, d.x, d.z)), b = MAN.grid.get(gkey(p.fl, p.x, p.z));
    if (a && b) a.e.push({ n: b, w: 6, door: d });
  }
  for (const s of Object.values(MAN.stairs)) {
    const p = MAN.stairs[s.to]; if (!p) continue;
    const zf = s.dir === 'N' ? s.farZ : s.farZ - 1, zp = p.dir === 'N' ? p.farZ : p.farZ - 1;
    const a = MAN.grid.get(gkey(s.fl, s.x0, zf)), b = MAN.grid.get(gkey(p.fl, p.x0, zp));
    if (a && b) a.e.push({ n: b, w: 8, stair: s });
  }
}
// cheapest way over the tiles (through doors and up and down stairs), with a binary heap
function navPath(from, to, opts = {}) {
  if (!from || !to) return null;
  const N = MAN.nodes.length, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), via = new Array(N);
  const heap = [[0, from.i]]; dist[from.i] = 0;
  const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, rr = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  while (heap.length) {
    const [d, i] = pop();
    if (d > dist[i]) continue;
    if (i === to.i) break;
    for (const e of MAN.nodes[i].e) {
      if (e.door && (opts.noDoors || GAME.doorShut(e.door))) continue;
      const nd = d + e.w;
      if (nd < dist[e.n.i]) { dist[e.n.i] = nd; prev[e.n.i] = i; via[e.n.i] = e; push(nd, e.n.i); }
    }
  }
  if (dist[to.i] === Infinity) return null;
  const out = []; let c = to.i;
  while (c !== -1) { out.unshift({ node: MAN.nodes[c], via: via[c] || null }); c = prev[c]; }
  return out;
}
function floorOf(y) { let best = 'F1', bd = Infinity; for (const fl in FLOORS) { const d = Math.abs(y - FLOORS[fl]); if (d < bd) { bd = d; best = fl; } } return best; }
function cellOf(p) { return MAN.grid.get(gkey(floorOf(p.y), Math.floor(p.x / T), Math.floor(p.z / T))) || null; }
function nearestNode(p) {
  const c = cellOf(p);
  if (c && !c.blocked) return c;
  const fl = floorOf(p.y);
  let best = null, bd = Infinity;
  for (const n of MAN.nodes) { if (n.blocked || n.fl !== fl) continue; const d = Math.hypot(cx(n.x) - p.x, cx(n.z) - p.z); if (d < bd) { bd = d; best = n; } }
  return best;
}
const nodePos = (n, out = new THREE.Vector3()) => out.set(cx(n.x), FLOORS[n.fl], cx(n.z));

/* ---------- build everything ---------- */
function buildMansion() {
  aoMaterials();
  Object.assign(MAN, { areas: {}, list: [], doors: {}, doorList: [], stairs: {}, hides: [], props: {}, grid: new Map(), open: new Set(), doorEdges: new Set() });
  AREAS.forEach((d, i) => makeArea(d, i));
  for (const s of STAIRS) buildStairs(s);
  for (const [fl, ax, az, bx, bz] of JOINS) {
    const side = bx > ax ? 'E' : bx < ax ? 'W' : bz > az ? 'S' : 'N';
    MAN.open.add(edgeKey(fl, ax, az, side)); MAN.open.add(edgeKey(fl, bx, bz, OPP[side]));
  }
  for (const d of DOORDEFS) MAN.doorEdges.add(edgeKey(d.fl, d.x, d.z, d.side));
  for (const r of MAN.list) floorAndCeiling(r);
  for (const d of DOORDEFS) buildDoor(d);
  for (const r of MAN.list) buildWalls(r);
  for (const s of STAIRS) stairRails(s);
  for (const r of MAN.list) { for (const l of r.def.lamps) lamp(r, l[0], l[1]); if (FURNISH[r.id]) FURNISH[r.id](r); }
  // rooms joined at an edge share their light; the others are shut off from each other
  for (const r of MAN.list) r.joined = new Set([r]);
  for (const [fl, ax, az, bx, bz] of JOINS) {
    const a = MAN.grid.get(gkey(fl, ax, az)).area, b = MAN.grid.get(gkey(fl, bx, bz)).area, all = new Set([...a.joined, ...b.joined]);
    for (const x of all) x.joined = all;
  }
  for (const r of MAN.list) WORLD.add(r);
  WORLD.roomAt = p => { const c = cellOf(p); return c ? c.area : null; };
  buildNav();
}
