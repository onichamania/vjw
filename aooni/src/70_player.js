
/* =========================================================================
   Game state, input, the player, interaction, doors, drawers and hiding
   ========================================================================= */
const GAME = {
  state: 'title', time: 0, lightMul: 1, camPos: new THREE.Vector3(), camDir: new THREE.Vector3(), player: null, room: null,
  modal: null, cine: null, paused: false, caught: 0,
};

/* ---------- input ---------- */
const INPUT = { keys: {}, mdx: 0, mdy: 0, locked: false, noLock: false, drag: null, run: false, runLock: false, joy: { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look: { id: null, x: 0, y: 0, sx: 0, sy: 0, t: 0, moved: 0 } };
const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
addEventListener('keydown', e => {
  if (GAME.state !== 'play') return;
  if (KEYMAP[e.code]) { INPUT.keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') INPUT.run = true;
  if (GAME.modal) {
    if (GAME.modal.msg) { if (!e.repeat && /^(KeyE|Space|Enter|NumpadEnter|KeyZ)$/.test(e.code)) { UI.msgNext(); e.preventDefault(); } return; }
    if (e.code === 'Escape') UI.closeModal(); else if (GAME.modal.key) GAME.modal.key(e);
    return;
  }
  if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.repeat) { GAME.interact(); e.preventDefault(); }
  if (e.code === 'Escape' && !INPUT.locked) UI.pause();
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) INPUT.keys[KEYMAP[e.code]] = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') INPUT.run = false; });
addEventListener('blur', () => {
  INPUT.keys = {}; INPUT.run = false;
  if (HUB.embedded && GAME.state === 'play' && !GAME.modal && !GAME.cine && PLAYER.alive && !INPUT.locked) UI.pause();
});
/* Pointer lock can be refused (e.g. inside an embedded viewer). Then dragging turns the view and a click interacts. */
function requestLock() {
  if (INPUT.noLock || !canvas.requestPointerLock) return;
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { INPUT.noLock = true; }); } catch (e) { INPUT.noLock = true; }
}
document.addEventListener('pointerlockerror', () => { if (!INPUT.noLock && GAME.state === 'play') UI.hint('ドラッグで視点を動かせます'); INPUT.noLock = true; });
canvas.addEventListener('mousedown', e => {
  if (GAME.state !== 'play' || IS_TOUCH) return;
  AU.resume();
  if (GAME.modal) { if (GAME.modal.msg) UI.msgNext(); return; }
  if (!INPUT.locked) { INPUT.drag = { button: e.button, moved: 0 }; requestLock(); return; }
  if (e.button === 0) GAME.interact();
});
addEventListener('mouseup', e => {
  const d = INPUT.drag; INPUT.drag = null;
  if (!d || INPUT.locked || GAME.state !== 'play' || GAME.modal || d.moved > 6) return;
  if (d.button === 0 && !GAME.interact()) { const p = toStage(e.clientX, e.clientY); GAME.tapAt(p.x, p.y); }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockchange', () => {
  INPUT.locked = document.pointerLockElement === canvas;
  if (!INPUT.locked && GAME.state === 'play' && !GAME.modal && !IS_TOUCH && !GAME.cine) UI.pause();
});
document.addEventListener('mousemove', e => {
  if (!INPUT.locked) {
    if (!INPUT.drag || !e.buttons) return;
    INPUT.drag.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
  }
  if (ROT.on) { INPUT.mdx += e.movementY; INPUT.mdy -= e.movementX; } else { INPUT.mdx += e.movementX; INPUT.mdy += e.movementY; }
});

/* touch controls */
function setupTouch() {
  const sz = $('stickZone'), base = $('stickBase'), knob = $('stickKnob'), look = $('lookZone');
  const J = INPUT.joy, L = INPUT.look;
  sz.addEventListener('touchstart', e => {
    AU.resume();
    if (GAME.modal && GAME.modal.msg) { UI.msgNext(); e.preventDefault(); return; }
    const t = e.changedTouches[0], p = toStage(t.clientX, t.clientY); J.id = t.identifier; J.ox = p.x; J.oy = p.y;
    base.style.display = 'block'; base.style.left = (p.x - sz.offsetLeft) + 'px'; base.style.top = (p.y - sz.offsetTop) + 'px'; knob.style.transform = 'translate(0,0)';
    e.preventDefault();
  }, { passive: false });
  const jm = e => {
    for (const t of e.changedTouches) if (t.identifier === J.id) {
      const p = toStage(t.clientX, t.clientY);
      let dx = p.x - J.ox, dy = p.y - J.oy; const l = Math.hypot(dx, dy), m = 55;
      if (l > m) { dx *= m / l; dy *= m / l; }
      J.x = dx / m; J.y = dy / m; knob.style.transform = `translate(${dx}px,${dy}px)`;
    }
    e.preventDefault();
  };
  const je = e => { for (const t of e.changedTouches) if (t.identifier === J.id) { J.id = null; J.x = J.y = 0; base.style.display = 'none'; } };
  sz.addEventListener('touchmove', jm, { passive: false }); sz.addEventListener('touchend', je); sz.addEventListener('touchcancel', je);
  look.addEventListener('touchstart', e => {
    AU.resume();
    if (GAME.modal && GAME.modal.msg) { UI.msgNext(); e.preventDefault(); return; }
    const t = e.changedTouches[0], p = toStage(t.clientX, t.clientY); L.id = t.identifier; L.x = L.sx = p.x; L.y = L.sy = p.y; L.t = performance.now(); L.moved = 0;
    e.preventDefault();
  }, { passive: false });
  look.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) if (t.identifier === L.id) {
      const p = toStage(t.clientX, t.clientY), dx = p.x - L.x, dy = p.y - L.y; L.x = p.x; L.y = p.y; L.moved += Math.abs(dx) + Math.abs(dy);
      INPUT.mdx += dx * 2.2; INPUT.mdy += dy * 2.2;
    }
    e.preventDefault();
  }, { passive: false });
  const le = e => {
    for (const t of e.changedTouches) if (t.identifier === L.id) {
      L.id = null;
      if (L.moved < 12 && performance.now() - L.t < 300) { const p = toStage(t.clientX, t.clientY); GAME.tapAt(p.x, p.y); }
    }
  };
  look.addEventListener('touchend', le); look.addEventListener('touchcancel', le);
  const btn = (id, fn) => $(id).addEventListener('touchstart', e => { AU.resume(); e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
  btn('tUse', () => { if (GAME.modal && GAME.modal.msg) { UI.msgNext(); return; } GAME.interact(); });
  btn('tRun', () => { INPUT.runLock = !INPUT.runLock; $('tRun').classList.toggle('on', INPUT.runLock); });
  btn('tPause', () => UI.pause());
  setBtnIcon('tUse', 'hand'); setBtnIcon('tRun', 'run'); setBtnIcon('tPause', 'pause');
}

/* ---------- player ---------- */
const WALK = 2.9, RUN = 4.7;
const PLAYER = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, hidden: null, alive: true, bob: 0, stepAcc: 0, radius: 0.28, height: 1.65,
  camY: 1.58, speed: 0, frozen: false, hideLook: { y: 0, p: 0 }, running: false,
  reset(pos, yaw) {
    this.pos.copy(pos); this.vel.set(0, 0, 0); this.yaw = yaw; this.pitch = 0; this.hidden = null;
    this.alive = true; this.camY = pos.y + 1.58; this.frozen = false;
  },
  update(dt) {
    const lookX = INPUT.mdx, lookY = INPUT.mdy; INPUT.mdx = 0; INPUT.mdy = 0;
    const sens = 0.0022 * SETTINGS.sens * HUB.sens;
    if (this.hidden) {
      const h = this.hidden, lim = h.type === 'bed' ? 0.9 : h.type === 'locker' ? 0.4 : 0.55, lp = h.type === 'locker' ? 0.22 : 0.35;
      this.hideLook.y = clamp(this.hideLook.y - lookX * sens, -lim, lim); this.hideLook.p = clamp(this.hideLook.p - lookY * sens, -lp, lp);
      this.yaw = h.yaw + this.hideLook.y; this.pitch = this.hideLook.p;
      this.speed = 0; this.vel.set(0, 0, 0);
      return;
    }
    if (!this.alive || this.frozen || GAME.modal || GAME.cine) { this.speed = 0; this.vel.set(0, 0, 0); return; }
    this.yaw -= lookX * sens; this.pitch = clamp(this.pitch - lookY * sens, -1.45, 1.45);
    let ix = 0, iz = 0;
    if (INPUT.keys.f) iz -= 1; if (INPUT.keys.b) iz += 1; if (INPUT.keys.l) ix -= 1; if (INPUT.keys.r) ix += 1;
    if (INPUT.joy.id !== null) { ix += INPUT.joy.x; iz += INPUT.joy.y; }
    const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
    this.running = INPUT.run || INPUT.runLock || (INPUT.joy.id !== null && Math.hypot(INPUT.joy.x, INPUT.joy.y) > 0.92);
    const sp = this.running ? RUN : WALK;
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    const tx = (ix * c + iz * s) * sp, tz = (-ix * s + iz * c) * sp;
    this.vel.x = damp(this.vel.x, tx, 12, dt); this.vel.z = damp(this.vel.z, tz, 12, dt);
    const np = tmpV.set(this.pos.x + this.vel.x * dt, this.pos.y, this.pos.z + this.vel.z * dt);
    WORLD.collide(np, this.radius, this.pos.y, this.height);
    const g = WORLD.groundAt(np.x, np.z, this.pos.y);
    if (g !== null) np.y = g; else { np.x = this.pos.x; np.z = this.pos.z; }   // never walk off the floor
    const moved = Math.hypot(np.x - this.pos.x, np.z - this.pos.z);
    this.pos.copy(np);
    this.speed = moved / Math.max(dt, 1e-4);
    if (this.speed > 0.4) {
      this.bob += dt * this.speed * 2.1;
      this.stepAcc += moved;
      if (this.stepAcc > (this.running ? 1.6 : 1.25)) { this.stepAcc = 0; const rm = GAME.room; SFX.step(rm ? rm.surface : 'wood', this.running ? 0.36 : 0.24); }
    }
  },
  applyCamera(dt) {
    if (GAME.cine) { camera.position.copy(GAME.cine.pos); camera.lookAt(GAME.cine.look); }
    else if (this.hidden) {
      const h = this.hidden, k = clamp((GAME.time - h.enterT) / 0.45, 0, 1);
      camera.position.lerpVectors(h.from, h.cam, smoothstep(0, 1, k));
    } else {
      this.camY = damp(this.camY, this.pos.y + 1.58, 16, dt);
      const bb = Math.min(1, this.speed / 4);
      camera.position.set(this.pos.x + Math.cos(this.bob) * 0.02 * bb * Math.cos(this.yaw), this.camY + Math.abs(Math.sin(this.bob)) * 0.045 * bb, this.pos.z - Math.cos(this.bob) * 0.02 * bb * Math.sin(this.yaw));
    }
    if (!GAME.cine) camera.rotation.set(this.pitch, this.yaw, 0);
    if (POST.shake > 0) {
      const s = POST.shake * 0.06;
      camera.position.x += (Math.random() - 0.5) * s; camera.position.y += (Math.random() - 0.5) * s; camera.position.z += (Math.random() - 0.5) * s;
      camera.rotation.z += (Math.random() - 0.5) * s * 0.4;
      POST.shake = Math.max(0, POST.shake - dt * 1.6);
    }
    GAME.camPos.copy(camera.position);
    camera.getWorldDirection(GAME.camDir);
  },
};
GAME.player = PLAYER;

/* ---------- interaction ---------- */
const raycaster = new THREE.Raycaster();
const _center = new THREE.Vector2(0, 0);
let TARGET = null;
function interactables() {
  const out = [], p = PLAYER.pos;
  for (const r of WORLD.rooms) {
    const b = r.bounds;
    if (p.x < b.min.x - 3 || p.x > b.max.x + 3 || p.z < b.min.z - 3 || p.z > b.max.z + 3 || p.y < b.min.y - 2.5 || p.y > b.max.y + 1) continue;
    for (const o of r.interactables) if (o.parent) out.push(o);
  }
  return out;
}
// walls (not doors) between the eye and what you point at
function wallBetween(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
  if (l < 0.2) return false;
  const bx = b.x - dx / l * 0.15, bz = b.z - dz / l * 0.15;
  for (const c of WORLD.colliders(a, l + 1)) {
    if (c.tag !== 'wall' || Math.min(a.y, b.y) > c.wy1 || Math.max(a.y, b.y) < c.wy0) continue;
    if (segBox(a.x, a.z, bx, bz, c.x0, c.z0, c.x1, c.z1)) return true;
  }
  return false;
}
function findTarget(ndc) {
  raycaster.setFromCamera(ndc || _center, camera);
  raycaster.far = 3.2;
  const hits = raycaster.intersectObjects(interactables(), true);
  for (const h of hits) {
    let o = h.object; while (o && !o.userData.ia) o = o.userData.iaRoot || o.parent;
    if (!o) continue;
    const ia = o.userData.ia;
    if (h.distance > (ia.dist || 2.5)) continue;
    const p = ia.prompt();
    if (p == null) continue;
    if (wallBetween(camera.position, h.point)) continue;
    return { obj: o, ia, prompt: p, dist: h.distance };
  }
  return null;
}
/* touch-button icons: pale, slightly blocky silhouettes on a dark disc */
const BTN_C = '#e2e8ff', BTN_D = '#aab6e6', BTN_K = '#08090f';
const BTN_HAND = `<polygon fill="${BTN_C}" points="17,5 27,2 35,24 54,27 60,35 60,52 53,61 29,61 19,52 7,41 8,34 15,35 22,41 21,30"/><polygon fill="${BTN_D}" points="35,24 54,27 60,35 58,40 37,35"/>`;
const BTN_ICON = {
  hand: BTN_HAND,
  loot: BTN_HAND + `<polygon fill="#4f63d8" points="49,2 60,10 56,23 42,23 38,10"/><text x="49" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="15" fill="#fff">?</text>`,
  eye: `<polygon fill="${BTN_C}" points="2,32 16,13 48,13 62,32 48,51 16,51"/><polygon fill="${BTN_K}" points="11,32 21,20 43,20 53,32 43,44 21,44"/><polygon fill="${BTN_C}" points="32,21 41,32 32,43 23,32"/>`,
  hide: `<polygon fill="${BTN_C}" points="10,5 27,10 27,57 10,62"/><rect fill="${BTN_C}" x="38" y="7" width="12" height="12" rx="1.5"/><rect fill="${BTN_C}" x="36" y="22" width="15" height="21"/><rect fill="${BTN_C}" x="36" y="45" width="6.5" height="15"/><rect fill="${BTN_C}" x="44.5" y="45" width="6.5" height="15"/><rect fill="${BTN_C}" stroke="${BTN_K}" stroke-width="2.4" x="24" y="28" width="22" height="7"/>`,
  door: `<rect fill="${BTN_C}" x="14" y="4" width="36" height="56" rx="2"/><rect fill="${BTN_K}" x="19" y="9" width="26" height="22"/><rect fill="${BTN_K}" x="19" y="35" width="26" height="20"/><circle fill="${BTN_C}" stroke="${BTN_K}" stroke-width="2" cx="41" cy="33" r="3.5"/>`,
  key: `<circle cx="20" cy="32" r="12" fill="none" stroke="${BTN_C}" stroke-width="7"/><path d="M32 32h26M50 32v10M57 32v8" stroke="${BTN_C}" stroke-width="7" stroke-linecap="square"/>`,
  run: `<rect fill="${BTN_C}" x="33" y="3" width="12" height="11" rx="2"/><polygon fill="${BTN_C}" points="24,18 42,16 46,36 30,38"/><polygon fill="${BTN_D}" points="24,18 12,30 17,34 27,26"/><polygon fill="${BTN_D}" points="42,17 54,27 50,31 41,25"/><polygon fill="${BTN_C}" points="30,37 39,37 30,50 18,60 13,55 24,47"/><polygon fill="${BTN_C}" points="39,36 46,35 55,46 58,58 52,59 47,48"/>`,
  pause: `<rect fill="${BTN_C}" x="16" y="12" width="11" height="40" rx="2"/><rect fill="${BTN_C}" x="37" y="12" width="11" height="40" rx="2"/>`,
};
const btnSvg = key => `<svg viewBox="0 0 64 64" aria-hidden="true">${BTN_ICON[key] || BTN_ICON.hand}</svg>`;
function setBtnIcon(id, key) { const el = $(id); if (el && el.dataset.icon !== key) { el.dataset.icon = key; el.innerHTML = btnSvg(key); } }
function targetIcon(t) {
  if (t.ia.icon) return t.ia.icon;
  const p = t.prompt || '';
  if (/隠れる|潜り込む/.test(p)) return 'hide';
  if (/鍵で開ける|鍵を使う/.test(p)) return 'key';
  if (/扉|開ける|閉める|外へ/.test(p) && t.ia.door) return 'door';
  return 'hand';
}
GAME.updateTarget = function () {
  TARGET = (PLAYER.alive && !GAME.modal && !GAME.cine && !PLAYER.hidden) ? findTarget() : null;
  const pr = $('prompt'), ch = $('crosshair');
  if (PLAYER.hidden && !GAME.modal) {
    pr.classList.add('on'); $('promptText').textContent = '出る'; ch.classList.remove('on');
    $('tUse').classList.add('ready'); setBtnIcon('tUse', 'hide');
    return;
  }
  if (TARGET) { $('promptText').textContent = TARGET.prompt; pr.classList.add('on'); ch.classList.add('on'); }
  else { pr.classList.remove('on'); ch.classList.remove('on'); }
  $('tUse').classList.toggle('ready', !!TARGET); setBtnIcon('tUse', TARGET ? targetIcon(TARGET) : 'hand');
};
GAME.interact = function () {
  if (!PLAYER.alive || GAME.modal || GAME.cine) return false;
  if (PLAYER.hidden) { GAME.exitHide(); return true; }
  if (!TARGET) return false;
  TARGET.ia.use();
  return true;
};
GAME.tapAt = function (x, y) {
  if (GAME.modal || GAME.cine) return false;
  if (PLAYER.hidden) { GAME.exitHide(); return true; }
  const t = findTarget(new THREE.Vector2(x / VW() * 2 - 1, -(y / VH()) * 2 + 1));
  if (t) t.ia.use();
  return !!t;
};

/* ---------- story items ---------- */
GAME.take = function (id, mesh, onTake) {
  if (STORY.has(id) || !PLAYER.alive) return;
  if (mesh) {
    const dr = mesh.userData.drawer;
    if (dr) dr.contents = dr.contents.filter(m => m !== mesh);
    if (mesh.parent) mesh.parent.remove(mesh);
  }
  STORY.give(id);
  SFX.pickup();
  STORY.save();
  GAME.say([['', `${ITEMS[id].name}を手に入れた。`]], () => { if (onTake) onTake(); });
};
// the message window: lines are [name, text] (name '' = narration); blocks the game until read
GAME.say = function (lines, done) { UI.message(lines.map(l => (typeof l === 'string' ? ['', l] : l)), done); };

/* ---------- doors ---------- */
GAME.doorPrompt = function (door) {
  if (door.def.id === 'front') return door.locked ? (STORY.has('k_front') ? '玄関の鍵で開ける' : '玄関の扉を調べる') : '外へ出る';
  if (door.locked) return STORY.has(door.locked) ? `${ITEMS[door.locked].name}で開ける` : '鍵がかかっている';
  if (door.open) return door.t > 0.6 ? '閉める' : null;
  return '開ける';
};
const LOCK_TALK = {
  front: [['ひろし', '……開かない。外から鍵をかけられたみたいだ。'], ['ひろし', 'どこかに玄関の鍵があるはず……。']],
  cor_lib: [['ひろし', '鍵がかかってる。この部屋の鍵を探さないと。']],
  cor_st1: [['ひろし', '階段への扉だ。鍵がかかっている。']],
  cor_stB: [['ひろし', '地下へ続く扉みたいだ。……鍵がかかっている。']],
};
GAME.useDoor = function (door) {
  const c = door.center;
  if (door.locked) {
    if (!STORY.has(door.locked)) {
      SFX.locked(c);
      if (LOCK_TALK[door.id] && !door._talked) { door._talked = true; GAME.say(LOCK_TALK[door.id]); }
      else UI.hint(door.def.id === 'front' ? '玄関の扉には鍵がかかっている' : `${door.b ? door.b.name : ''}の扉には鍵がかかっている`);
      return;
    }
    const key = door.locked;
    STORY.use(key); door.locked = null; STORY.unlock(door.id);
    SFX.unlock(c); UI.hint(`${ITEMS[key].name}を使った`);
    if (door.def.id === 'front') { setTimeout(() => GAME.escape(), 500); return; }
    STORY.save();
    setTimeout(() => { setDoorOpen(door, true, PLAYER.pos); SFX.door(c, 1.0); }, 380);
    return;
  }
  if (door.def.id === 'front') { GAME.escape(); return; }
  if (door.open) { setDoorOpen(door, false); return; }
  setDoorOpen(door, true, PLAYER.pos); SFX.door(c, 1.0);
};
SFX.doorShut = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 0.12, f: 380, q: 0.7, type: 'lowpass', vol: 0.55, rev: 0.35, brown: true }); AU.tone({ pos, f: 95, f2: 55, dur: 0.12, vol: 0.3 }); AU.burst({ pos, t0: AU.t + 0.05, dur: 0.03, f: 2400, q: 2, vol: 0.12 }); };
SFX.locker = (pos, open = true) => {
  if (!AU.ok) return;
  AU.burst({ pos, dur: 0.05, f: 2600, q: 3, vol: 0.4, rev: 0.25 });
  for (const [f, v] of [[612, 0.07], [1184, 0.04], [1931, 0.025]]) AU.tone({ pos, t0: AU.t + 0.01, type: 'sine', f, dur: 0.5, vol: v, rev: 0.4 });
  AU.burst({ pos, t0: AU.t + (open ? 0.18 : 0.12), dur: 0.08, f: open ? 900 : 500, q: 1, vol: open ? 0.2 : 0.45, type: 'lowpass', rev: 0.3 });
  if (!open) AU.tone({ pos, t0: AU.t + 0.12, type: 'triangle', f: 240, f2: 180, dur: 0.18, vol: 0.12, rev: 0.3 });
};

/* ---------- drawers ---------- */
GAME.toggleDrawer = function (dr) {
  const pos = dr.room.toWorld(dr.base.x, dr.base.y, dr.base.z);
  if (dr.locked) { SFX.locked(pos); UI.hint('鍵がかかっていて開かない'); return; }
  if (!dr.open) {
    dr.open = true; SFX.drawer(pos, true);
    if (!dr.filled) {
      dr.filled = true; dr.contents = [];
      for (const it of dr.preset || []) {
        if (STORY.hasGot(it.type)) continue;
        const def = ITEMS[it.type], m = makeItemMesh(def.icon === 'paper' ? 'paper' : 'key');
        m.position.set(0, dr.floorY + 0.01, 0.02); m.rotation.y = 0.4; m.scale.setScalar(def.icon === 'paper' ? 0.9 : 1.4);
        dr.g.add(m); m.userData.drawer = dr; dr.contents.push(m);
        dr.room.addInteract(m, { dist: 2.4, prompt: () => (STORY.has(it.type) ? null : def.name + 'を拾う'), use: () => GAME.take(it.type, m) });
      }
      if (!dr.contents.length && Math.random() < 0.5) UI.hint('なにも入っていない', 1400);
    }
  } else {
    if (dr.contents && dr.contents.length) return;
    dr.open = false; SFX.drawer(pos, false);
  }
};

/* ---------- hiding ---------- */
// what you see from inside a steel locker: black, except for the louvres in the door
const LOCKER_BG = (() => {
  const stops = ['#000 0%', '#000 22%'];
  for (let i = 0; i < 7; i++) {
    const a = 22 + i * 8.6, b = a + 3.8;
    stops.push(`#000 ${a}%`, `rgba(14,20,18,.85) ${a + 0.3}%`, `rgba(0,0,0,0) ${a + 1.1}%`, `rgba(0,0,0,0) ${b - 0.5}%`, `rgba(10,14,13,.9) ${b}%`, `#000 ${b + 0.4}%`);
  }
  stops.push('#000 100%');
  return `linear-gradient(90deg, #000 0%, #000 9%, rgba(0,0,0,.6) 15%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,.6) 85%, #000 91%, #000 100%), linear-gradient(180deg, ${stops.join(', ')})`;
})();
GAME.enterHide = function (h) {
  if (PLAYER.hidden || !PLAYER.alive || GAME.modal || GAME.cine) return;
  if (h.blockedUntil > GAME.time) return;
  if (h === MAN.takeshiCloset) { STORY.takeshi(h); return; }
  ONI.onPlayerHide(h);
  h.enterT = GAME.time; h.from = camera.position.clone();
  PLAYER.hidden = h; PLAYER.hideLook.y = 0; PLAYER.hideLook.p = 0;
  PLAYER.yaw = h.yaw; PLAYER.pitch = 0;
  PLAYER.pos.set(h.exitP.x, h.exitP.y, h.exitP.z); PLAYER.vel.set(0, 0, 0);
  const fx = $('fxHide'), lk = h.type === 'locker';
  fx.className = 'fx ' + (lk ? 'locker' : h.type === 'bed' ? 'bed' : 'closet'); fx.style.background = lk ? LOCKER_BG : '';
  setTimeout(() => { if (PLAYER.hidden === h) fx.style.opacity = 1; }, 250);
  if (lk) { SFX.locker(h.cam, true); animateHideDoors(h); setTimeout(() => { if (PLAYER.hidden === h) { SFX.locker(h.cam, false); h.doors.forEach(d => (d.visible = false)); } }, 430); }
  else if (h.type === 'closet') { SFX.closet(h.cam, true); animateHideDoors(h); setTimeout(() => { if (PLAYER.hidden === h) h.doors.forEach(d => (d.visible = false)); }, 420); }
  else SFX.bed(h.cam, true);
  if (h.item && !STORY.hasGot(h.item)) {
    const id = h.item;
    setTimeout(() => { if (PLAYER.hidden !== h || STORY.hasGot(id)) return; STORY.give(id); SFX.pickup(); STORY.save(); GAME.say([['ひろし', '……ん？　足もとに何かある。'], ['', `${ITEMS[id].name}を手に入れた。`]]); }, 900);
  }
};
GAME.exitHide = function () {
  const h = PLAYER.hidden; if (!h || GAME.modal || GAME.cine) return;
  if (GAME.time - h.enterT < 0.5) return;
  PLAYER.hidden = null;
  PLAYER.pos.set(h.exitP.x, h.exitP.y, h.exitP.z);
  PLAYER.camY = h.exitP.y + 1.58;
  $('fxHide').style.opacity = 0;
  h.doors && h.doors.forEach(d => (d.visible = true));
  if (h.type === 'locker') { SFX.locker(h.cam, true); animateHideDoors(h); setTimeout(() => SFX.locker(h.cam, false), 520); }
  else if (h.type === 'closet') { SFX.closet(h.cam, false); animateHideDoors(h); } else SFX.bed(h.cam, false);
  ONI.onPlayerExitHide(h);
};
function animateHideDoors(h, dur = 600, amt = 1.1) {
  const t0 = performance.now();
  animate(() => {
    const k = (performance.now() - t0) / dur, a = Math.sin(Math.min(1, k) * Math.PI) * amt;
    h.doors.forEach((d, i) => { d.rotation.y = d.userData.baseRy + (i === 0 ? -a : a); });
    return k < 1;
  });
}
