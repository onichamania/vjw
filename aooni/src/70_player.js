
/* =========================================================================
   Game state, input, the player, interaction, doors and stairs (the map changes), hiding, the lighter
   ========================================================================= */
const GAME = {
  state: 'title', time: 0, lightMul: 1, camPos: new THREE.Vector3(), camDir: new THREE.Vector3(), player: null, room: null,
  modal: null, cine: null, paused: false, caughtN: 0, busy: 0, lighterOn: false,
};

/* ---------- input ---------- */
const INPUT = { keys: {}, mdx: 0, mdy: 0, locked: false, noLock: false, drag: null, run: false, runLock: false, joy: { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look: { id: null, x: 0, y: 0, sx: 0, sy: 0, t: 0, moved: 0 } };
const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
addEventListener('keydown', e => {
  if (UI._files) { if (/^(Escape|KeyX|Backspace)$/.test(e.code)) UI.closeFiles(); return; }
  if (GAME.state !== 'play') return;
  if (KEYMAP[e.code]) { INPUT.keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') INPUT.run = true;
  if (GAME.modal && GAME.modal.items) { UI.itemKey(e); e.preventDefault(); return; }
  if (GAME.modal && GAME.modal.choice) { UI.choiceKey(e); e.preventDefault(); return; }
  if (GAME.modal) {
    if (GAME.modal.msg) { if (!e.repeat && /^(KeyE|Space|Enter|NumpadEnter|KeyZ)$/.test(e.code)) { UI.msgNext(); e.preventDefault(); } return; }
    if (e.code === 'Escape') UI.closeModal(); else if (GAME.modal.key) GAME.modal.key(e);
    return;
  }
  if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.repeat) { GAME.interact(); e.preventDefault(); }
  if (e.code === 'KeyF' && !e.repeat) GAME.toggleLighter();
  if ((e.code === 'KeyI' || e.code === 'Tab' || e.code === 'KeyX') && !e.repeat) { UI.items(); e.preventDefault(); }
  if (e.code === 'Escape' && !INPUT.locked) UI.pause();
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) INPUT.keys[KEYMAP[e.code]] = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') INPUT.run = false; });
addEventListener('blur', () => {
  INPUT.keys = {}; INPUT.run = false;
  if (HUB.embedded && GAME.state === 'play' && !GAME.modal && !GAME.cine && PLAYER.alive && !INPUT.locked) UI.pause();
});
/* Pointer lock can be refused (e.g. inside an embedded viewer). Then dragging turns the view and a click interacts. */
function releaseLock() { if (document.pointerLockElement) { INPUT.selfUnlockT = performance.now(); document.exitPointerLock(); } }
function requestLock() {
  if (INPUT.noLock || !canvas.requestPointerLock) return;
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { INPUT.noLock = true; }); } catch (e) { INPUT.noLock = true; }
}
document.addEventListener('pointerlockerror', () => { if (!INPUT.noLock && GAME.state === 'play') UI.hint('ドラッグで視点を動かせます'); INPUT.noLock = true; });
canvas.addEventListener('mousedown', e => {
  if (GAME.state !== 'play' || IS_TOUCH) return;
  AU.resume();
  if (GAME.modal) { if (GAME.modal.msg) { if (INPUT.locked) UI.msgNext(); else INPUT.drag = { button: e.button, moved: 0, msg: true }; } return; }
  if (!INPUT.locked) { INPUT.drag = { button: e.button, moved: 0 }; requestLock(); return; }
  if (e.button === 0) GAME.interact();
  if (e.button === 2) GAME.toggleLighter();
});
addEventListener('mouseup', e => {
  const d = INPUT.drag; INPUT.drag = null;
  if (!d || INPUT.locked || GAME.state !== 'play' || d.moved > 6) return;
  if (d.msg) { if (GAME.modal && GAME.modal.msg) UI.msgNext(); return; }   // a click reads on; a drag looked round
  if (GAME.modal) return;
  if (d.button === 0 && CHAIRS.held) { const p = toStage(e.clientX, e.clientY); GAME.tapAt(p.x, p.y); return; }   // the chair goes where you click
  if (d.button === 0 && !GAME.interact()) { const p = toStage(e.clientX, e.clientY); GAME.tapAt(p.x, p.y); }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockchange', () => {
  INPUT.locked = document.pointerLockElement === canvas;
  // losing the lock pauses the game, unless the game let go of it itself a moment ago (to show the item screen, the safe...)
  if (!INPUT.locked && GAME.state === 'play' && !GAME.modal && !IS_TOUCH && !GAME.cine && performance.now() - (INPUT.selfUnlockT || -1e9) > 600) UI.pause();
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
    const t = e.changedTouches[0], p = toStage(t.clientX, t.clientY); L.id = t.identifier; L.x = L.sx = p.x; L.y = L.sy = p.y; L.t = e.timeStamp; L.moved = 0;
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
      if (L.moved < 12 && e.timeStamp - L.t < 350) {   // when the touches happened, not when a busy frame got to them
        if (GAME.modal && GAME.modal.msg) UI.msgNext();   // in a conversation a drag looks round, a tap reads on
        else { const p = toStage(t.clientX, t.clientY); GAME.tapAt(p.x, p.y); }
      }
    }
  };
  look.addEventListener('touchend', le); look.addEventListener('touchcancel', le);
  const btn = (id, fn) => $(id).addEventListener('touchstart', e => { AU.resume(); e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
  btn('tUse', () => { if (GAME.modal && GAME.modal.msg) { UI.msgNext(); return; } GAME.interact(); });
  btn('tRun', () => { INPUT.runLock = !INPUT.runLock; $('tRun').classList.toggle('on', INPUT.runLock); });
  btn('tLight', () => GAME.toggleLighter());
  btn('tPause', () => UI.pause());
  setBtnIcon('tUse', 'hand'); setBtnIcon('tRun', 'run'); setBtnIcon('tPause', 'pause'); setBtnIcon('tLight', 'lighter');
}

/* ---------- player ---------- */
const WALK = 3.4, RUN = 5.6;
const PLAYER = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, hidden: null, alive: true, bob: 0, stepAcc: 0, radius: 0.3, height: 1.65,
  camY: 1.58, speed: 0, frozen: false, hideLook: { y: 0, p: 0 }, running: false, onChair: null, chairFrom: null,
  reset(pos, yaw) {
    this.pos.copy(pos); this.vel.set(0, 0, 0); this.yaw = yaw; this.pitch = 0; this.hidden = null; this.onChair = null; this.chairFrom = null;
    this.alive = true; this.camY = pos.y + 1.58; this.frozen = false;
  },
  update(dt) {
    const lookX = INPUT.mdx, lookY = INPUT.mdy; INPUT.mdx = 0; INPUT.mdy = 0;
    const sens = 0.0022 * SETTINGS.sens * HUB.sens;
    if (this.hidden) {
      const h = this.hidden;
      this.hideLook.y = clamp(this.hideLook.y - lookX * sens, -0.55, 0.55); this.hideLook.p = clamp(this.hideLook.p - lookY * sens, -0.35, 0.35);
      this.yaw = h.yaw + this.hideLook.y; this.pitch = this.hideLook.p;
      this.speed = 0; this.vel.set(0, 0, 0);
      return;
    }
    const talking = GAME.modal && GAME.modal.msg;
    if (this.alive && !this.frozen && !GAME.cine && !GAME.busy && (!GAME.modal || talking)) { this.yaw -= lookX * sens; this.pitch = clamp(this.pitch - lookY * sens, -1.45, 1.45); }
    if (!this.alive || this.frozen || GAME.modal || GAME.cine || GAME.busy) { this.speed = 0; this.vel.set(0, 0, 0); return; }
    let ix = 0, iz = 0;
    if (INPUT.keys.f) iz -= 1; if (INPUT.keys.b) iz += 1; if (INPUT.keys.l) ix -= 1; if (INPUT.keys.r) ix += 1;
    if (INPUT.joy.id !== null) { ix += INPUT.joy.x; iz += INPUT.joy.y; }
    const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
    if (this.onChair) { this.speed = 0; this.vel.set(0, 0, 0); if (il > 0.3) stepDown(); return; }   // standing on a chair: a step in any direction gets you down
    this.running = INPUT.run || INPUT.runLock || (INPUT.joy.id !== null && Math.hypot(INPUT.joy.x, INPUT.joy.y) > 0.92);
    const sp = this.running ? RUN : WALK;
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    const tx = (ix * c + iz * s) * sp, tz = (-ix * s + iz * c) * sp;
    this.vel.x = damp(this.vel.x, tx, 12, dt); this.vel.z = damp(this.vel.z, tz, 12, dt);
    const np = tmpV.set(this.pos.x + this.vel.x * dt, this.pos.y, this.pos.z + this.vel.z * dt);
    WORLD.collide(np, this.radius, this.pos.y, this.height);
    let g = WORLD.groundAt(np.x, np.z, this.pos.y);
    if (g === null) { np.x = this.pos.x; np.z = this.pos.z; g = WORLD.groundAt(np.x, np.z, this.pos.y); }   // never walk off the floor
    if (g !== null) np.y = g;
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
  const out = [], here = GAME.room;
  if (!here) return out;
  for (const r of here.joined) for (const o of r.interactables) if (o.parent && o.visible !== false) out.push(o);
  return out;
}
// walls between the eye and what you point at
function wallBetween(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
  if (l < 0.25) return false;
  const bx = b.x - dx / l * 0.18, bz = b.z - dz / l * 0.18;
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
  eye: `<polygon fill="${BTN_C}" points="2,32 16,13 48,13 62,32 48,51 16,51"/><polygon fill="${BTN_K}" points="11,32 21,20 43,20 53,32 43,44 21,44"/><polygon fill="${BTN_C}" points="32,21 41,32 32,43 23,32"/>`,
  hide: `<polygon fill="${BTN_C}" points="10,5 27,10 27,57 10,62"/><rect fill="${BTN_C}" x="38" y="7" width="12" height="12" rx="1.5"/><rect fill="${BTN_C}" x="36" y="22" width="15" height="21"/><rect fill="${BTN_C}" x="36" y="45" width="6.5" height="15"/><rect fill="${BTN_C}" x="44.5" y="45" width="6.5" height="15"/><rect fill="${BTN_C}" stroke="${BTN_K}" stroke-width="2.4" x="24" y="28" width="22" height="7"/>`,
  door: `<rect fill="${BTN_C}" x="14" y="4" width="36" height="56" rx="2"/><rect fill="${BTN_K}" x="19" y="9" width="26" height="22"/><rect fill="${BTN_K}" x="19" y="35" width="26" height="20"/><circle fill="${BTN_C}" stroke="${BTN_K}" stroke-width="2" cx="41" cy="33" r="3.5"/>`,
  key: `<circle cx="20" cy="32" r="12" fill="none" stroke="${BTN_C}" stroke-width="7"/><path d="M32 32h26M50 32v10M57 32v8" stroke="${BTN_C}" stroke-width="7" stroke-linecap="square"/>`,
  run: `<rect fill="${BTN_C}" x="33" y="3" width="12" height="11" rx="2"/><polygon fill="${BTN_C}" points="24,18 42,16 46,36 30,38"/><polygon fill="${BTN_D}" points="24,18 12,30 17,34 27,26"/><polygon fill="${BTN_D}" points="42,17 54,27 50,31 41,25"/><polygon fill="${BTN_C}" points="30,37 39,37 30,50 18,60 13,55 24,47"/><polygon fill="${BTN_C}" points="39,36 46,35 55,46 58,58 52,59 47,48"/>`,
  lighter: `<polygon fill="${BTN_C}" points="12,22 27,14 32,25 18,33"/><polygon fill="${BTN_C}" points="22,32 44,27 49,57 27,61"/><polygon fill="${BTN_C}" points="33,22 41,21 42,28 34,29"/><path fill="${BTN_C}" d="M37 4 C30 12 32 18 37 20 C43 18 44 11 37 4 Z"/>`,
  pause: `<rect fill="${BTN_C}" x="16" y="12" width="11" height="40" rx="2"/><rect fill="${BTN_C}" x="37" y="12" width="11" height="40" rx="2"/>`,
};
const btnSvg = key => `<svg viewBox="0 0 64 64" aria-hidden="true">${BTN_ICON[key] || BTN_ICON.hand}</svg>`;
function setBtnIcon(id, key) { const el = $(id); if (el && el.dataset.icon !== key) { el.dataset.icon = key; el.innerHTML = btnSvg(key); } }
function targetIcon(t) {
  if (t.ia.icon) return t.ia.icon;
  const p = t.prompt || '';
  if (/鍵で開ける/.test(p)) return 'key';
  if (t.ia.door) return 'door';
  return 'hand';
}
GAME.updateTarget = function () {
  const free = PLAYER.alive && !GAME.modal && !GAME.cine && !PLAYER.hidden && !GAME.busy;
  TARGET = free && !CHAIRS.held ? findTarget() : null;
  const pr = $('prompt'), ch = $('crosshair');
  $('tLight').classList.toggle('hidden', !GAME.canLight());
  $('tLight').classList.toggle('on', GAME.lighterOn);
  if (PLAYER.hidden && !GAME.modal) {
    pr.classList.add('on'); $('promptText').textContent = '出る'; ch.classList.remove('on');
    $('tUse').classList.add('ready'); setBtnIcon('tUse', 'hide');
    return;
  }
  // carrying a chair: the ring shows where it would go; standing on one: getting down
  const say = CHAIRS.held && free ? (CHAIRS.ring && CHAIRS.ring.visible ? 'イスを置く' : null) : TARGET ? TARGET.prompt : PLAYER.onChair && free ? 'イスから降りる' : null;
  if (say) { $('promptText').textContent = say; pr.classList.add('on'); ch.classList.add('on'); }
  else { pr.classList.remove('on'); ch.classList.toggle('on', !!CHAIRS.held && free); }
  $('tUse').classList.toggle('ready', !!say); setBtnIcon('tUse', TARGET ? targetIcon(TARGET) : 'hand');
};
GAME.interact = function () {
  if (!PLAYER.alive || GAME.modal || GAME.cine || GAME.busy) return false;
  if (PLAYER.hidden) { GAME.exitHide(); return true; }
  if (CHAIRS.held) { placeChair(); return true; }
  if (!TARGET) { if (PLAYER.onChair) { stepDown(); return true; } return false; }
  TARGET.ia.use();
  return true;
};
GAME.tapAt = function (x, y) {
  if (GAME.modal || GAME.cine || GAME.busy) return false;
  if (PLAYER.hidden) { GAME.exitHide(); return true; }
  const ndc = new THREE.Vector2(x / VW() * 2 - 1, -(y / VH()) * 2 + 1);
  if (CHAIRS.held) { placeChair(ndc); return true; }
  const t = findTarget(ndc);
  if (t) t.ia.use();
  return !!t;
};
// the message window: lines are [name, text] (name '' = narration); blocks the game until read
GAME.say = function (lines, done) { UI.message(lines.map(l => (typeof l === 'string' ? ['', l] : l)), done); };
// an item from the floor or a shelf
GAME.take = function (id, mesh, after) {
  if (STORY.hasGot(id) || !PLAYER.alive) return;
  if (mesh && mesh.parent) mesh.visible = false;
  STORY.give(id); SFX.pickup(); STORY.save();
  GAME.say([['', `${ITEMS[id].name}を手に入れた。`]], () => { if (after) after(); });
};

/* ---------- doors: going through one is a change of map, as in the original ---------- */
GAME.doorShut = function (d) {   // a door the oni can't use either
  if (d.kind === 'front' || d.kind === 'basement' || d.kind === 'back') return true;
  if (d.lock) return true;
  if (d.kind === 'hidden' && !STORY.flags.knobOn) return true;
  if (d.kind === 'shelf' && !(MAN.jailShelf && MAN.jailShelf.at)) return true;
  const p = d.to && MAN.doors[d.to];
  if (p && p.kind === 'hidden' && !STORY.flags.knobOn) return true;
  if ((d.kind === 'stuck' || (p && p.kind === 'stuck')) && !STORY.flags.pianoUnlocked) return d.kind === 'stuck';
  return false;
};
GAME.doorPrompt = function (d) {
  if (GAME.busy) return null;
  const hk = STORY.doorHook(d); if (hk) return hk.prompt;
  switch (d.kind) {
    case 'front': return '玄関の扉を調べる';
    case 'back': return '扉を調べる';
    case 'basement': return d.lock ? (STORY.has(d.lock) ? '地下室の鍵で開ける' : '扉を調べる') : '地下へ降りる';
    case 'hidden': return !STORY.flags.wallCut ? '壁を調べる' : !STORY.flags.knobOn ? 'ドアノブのない扉を調べる' : '開ける';
    case 'shelf': return MAN.jailShelf && MAN.jailShelf.at ? '開ける' : null;
    default: break;
  }
  if (d.lock) return STORY.has(d.lock) ? `${ITEMS[d.lock].name}で開ける` : '鍵がかかっている';
  return '開ける';
};
const LOCK_TALK = {
  corB_lib: [['', '鍵がかかっている。']],
  cor2_kids: [['', '鍵がかかっている。']],
  cor3_bed: [['', '鍵がかかっている。']],
};
GAME.useDoor = function (d) {
  if (GAME.busy || !PLAYER.alive) return;
  const hk = STORY.doorHook(d); if (hk) { hk.use(); return; }
  if (d.kind === 'front') { SFX.locked(d.center); GAME.say([['', '鍵がかかっている。']]); STORY.flags.frontTried = true; return; }
  if (d.kind === 'hidden') { STORY.event('greyWall'); return; }
  if (d.kind === 'back') { SFX.locked(d.center); GAME.say(STORY.hasGot('knob') ? [['', 'ドアノブが外れている。開かない。']] : STORY.flags.takuro ? [['', '鍵がかかっている。'], ['', 'ドアノブがネジで留めてある。']] : [['', '鍵がかかっている。']]); return; }
  if (d.kind === 'stuck' && !STORY.flags.pianoUnlocked) { SFX.locked(d.center); GAME.say([['', '開かない。']]); return; }
  if (d.lock) {
    if (!STORY.has(d.lock)) {
      SFX.locked(d.center);
      if (d.kind === 'basement') GAME.say([['', '鍵がかかっている。']]);
      else if (LOCK_TALK[d.id] && !d._talked) { d._talked = true; GAME.say(LOCK_TALK[d.id]); }
      else UI.hint('鍵がかかっている');
      return;
    }
    const key = d.lock, p = d.to && MAN.doors[d.to];
    STORY.use(key); d.lock = null; if (p) p.lock = null; STORY.unlock(d.id);
    SFX.unlock(d.center); UI.hint(`${ITEMS[key].name}を使った`);
    STORY.save();
    if (d.kind === 'basement') { GAME.later(0.6, () => STORY.event('basementUnlocked')); return; }
    GAME.later(0.45, () => GAME.goThrough(d));
    return;
  }
  if (d.kind === 'basement') { STORY.event('downstairs'); return; }
  if (d.id === 'piano' && !STORY.flags.pianoUnlocked) { STORY.flags.pianoUnlocked = true; SFX.unlock(d.center); UI.hint('内側から扉を開けた'); STORY.save(); GAME.later(0.4, () => GAME.goThrough(d)); return; }
  GAME.goThrough(d);
};
// fade out, come out of the other door (it shuts behind you), fade in
GAME.goThrough = function (d, opts = {}) {
  const p = d.to && MAN.doors[d.to];
  if (!p || GAME.busy) return;
  GAME.busy = 1; PLAYER.onChair = null;
  animateDoor(d); SFX.door(d.center, 1.0);
  GAME.fade(0.22, () => {
    PLAYER.pos.copy(p.front); PLAYER.camY = p.front.y + 1.58; PLAYER.yaw = p.yawIn; PLAYER.pitch = 0; PLAYER.vel.set(0, 0, 0);
    GAME.room = p.area; GAME.onEnterRoom(p.area, d);
    animateDoor(p, 0.9, 500); setTimeout(() => SFX.doorShut(p.center), 380);
    ONI.onPlayerMoved(d, p);
  }, () => { GAME.busy = 0; if (opts.done) opts.done(); });
};
GAME.fade = function (sec, mid, done) {
  const b = $('fxBlack'); b.style.transition = `opacity ${sec}s`; b.style.opacity = 1;
  const t0 = performance.now();
  animate(() => {
    if (performance.now() - t0 < sec * 1000 + 30) return true;
    mid && mid(); PLAYER.applyCamera(0.016);
    b.style.opacity = 0;
    setTimeout(() => { done && done(); }, sec * 1000);
    return false;
  });
};
// stairs and the hole: walk into the dark at the end of a flight and you come out of the dark end of the
// flight it leads to, still walking the same way (the black hides the jump, as a screen change does)
GAME.checkMoves = function () {
  if (GAME.busy || !PLAYER.alive || PLAYER.hidden) return;
  const p = PLAYER.pos;
  for (const s of Object.values(MAN.stairs)) {
    if (!onStair(s, p)) continue;
    const left = (1 - stairS(s, p)) * s.len;   // metres to its dark end
    if (GAME.stairLock === s) { if (left > 1.7) GAME.stairLock = null; continue; }
    if (left < 0.62) {
      const t = MAN.stairs[s.to], a = stairPoint(t, 1 - 0.95 / t.len);
      const turn = (t.dir === 'S' ? 0 : Math.PI) - (s.dir === 'N' ? 0 : Math.PI);
      PLAYER.pos.copy(a); PLAYER.camY = a.y + 1.58; PLAYER.yaw += turn;
      if (turn) PLAYER.vel.applyAxisAngle(UP, turn);
      SFX.step('wood', 0.3);
      GAME.stairLock = t; GAME.room = t.room; GAME.onEnterRoom(t.room, s);
      ONI.onPlayerMoved(s, t);
      return;
    }
  }
  if (MAN.hole && MAN.hole.visible) {
    const c = cellOf(p);
    if (c && c.area.id === 'bed3' && Math.hypot(p.x - MAN.hole.position.x, p.z - MAN.hole.position.z) < 0.45) STORY.event('fall');
  }
};

/* ---------- the lighter ---------- */
GAME.canLight = () => STORY.has('lighter') && STORY.flags.oilUsed;
GAME.toggleLighter = function () {
  if (!GAME.canLight() || PLAYER.hidden || !PLAYER.alive) { if (STORY.has('lighter') && !STORY.flags.oilUsed) UI.hint('オイルが入っていない'); return; }
  GAME.lighterOn = !GAME.lighterOn; SFX.lighter();
};
const VIEW = {
  g: new THREE.Group(), flame: null, chair: new THREE.Group(), chairMats: [],
  init() {
    // a chair held up in front of you (drawn over the room, back to front, so it never sinks into a wall)
    camera.add(this.chair); this.chair.visible = false; this.chair.position.set(0.3, -0.74, -1.05); this.chair.rotation.set(0.42, -0.55, 0.1); this.chair.scale.setScalar(0.62);
    const cm = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.75, emissive: 0x3a2414, depthTest: false, depthWrite: false }); this.chairMats.push(cm);
    const part = (w, h, d, x, y, z, ord) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cm); o.position.set(x, y, z); o.renderOrder = ord; this.chair.add(o); };
    part(0.44, 0.5, 0.04, 0, 0.74, -0.2, 10);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(0.04, 0.46, 0.04, sx * 0.19, 0.23, sz * 0.19, sz < 0 ? 11 : 13);
    part(0.44, 0.05, 0.44, 0, 0.46, 0, 12);
    camera.add(this.g); this.g.position.set(0.28, -0.27, -0.52);
    const m = makeItemMesh('lighter'); m.scale.setScalar(1.25); this.g.add(m);
    const fl = glowSprite(0xffb050, 0.06, 0.7); fl.position.set(0, 0.1, 0); m.add(fl); this.flame = fl;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); core.scale.y = 2.2; core.position.set(0, 0.095, 0); fl.add(core);
    m.traverse(o => { if (o.isMesh) o.renderOrder = 10; });
  },
  // take on the look of the chair you lift
  holdChair(ch) {
    let src = null; ch.g.traverse(o => { if (!src && o.isMesh) src = o.material; });
    for (const m of this.chairMats) { if (src) { m.map = src.map || null; m.color.copy(src.color); } m.needsUpdate = true; }
    this.chair.visible = true;
  },
  update(dt) {
    const on = GAME.lighterOn && !PLAYER.hidden && PLAYER.alive, b = PLAYER.bob, k = Math.min(1, PLAYER.speed / 4);
    this.g.visible = on;
    this.g.position.set(0.28 + Math.cos(b) * 0.012 * k, -0.27 + Math.abs(Math.sin(b)) * 0.012 * k, -0.52);
    const s = 0.055 + Math.sin(GAME.time * 25) * 0.006; this.flame.scale.set(s, s * 1.6, s);
    const t = GAME.time;
    LIGHTS.lighter.color.setHex(0xffa04a); LIGHTS.lighter.distance = 9;
    LIGHTS.lighter.intensity = on ? (5.5 + Math.sin(t * 23) * 0.5 + Math.sin(t * 9.1) * 0.5) : (GAME.room && GAME.room.dark ? 0.12 : 0.5);
    void dt;
  },
};

/* ---------- hiding in a closet ---------- */
GAME.enterHide = function (h) {
  if (PLAYER.hidden || !PLAYER.alive || GAME.modal || GAME.cine || GAME.busy) return;
  if (h.blockedUntil > GAME.time) return;
  ONI.onPlayerHide(h);
  h.enterT = GAME.time; h.from = camera.position.clone(); h.chased = ONI.on; h.outT = 0;
  PLAYER.hidden = h; PLAYER.hideLook.y = 0; PLAYER.hideLook.p = 0; PLAYER.onChair = null; dropChair();
  PLAYER.yaw = h.yaw; PLAYER.pitch = 0;
  PLAYER.pos.set(h.exitP.x, h.exitP.y, h.exitP.z); PLAYER.vel.set(0, 0, 0);
  GAME.lighterOn = false;
  const fx = $('fxHide'); fx.className = 'fx closet' + (ONI.on ? ' dark' : '');
  setTimeout(() => { if (PLAYER.hidden === h) fx.style.opacity = 1; }, 250);
  SFX.closet(h.cam, true); animateHideDoors(h);
  setTimeout(() => { if (PLAYER.hidden === h) h.doors.forEach(d => (d.visible = false)); }, 420);
};
GAME.exitHide = function () {
  const h = PLAYER.hidden; if (!h || GAME.modal || GAME.cine) return;
  if (GAME.time - h.enterT < 0.5) return;
  PLAYER.hidden = null;
  PLAYER.pos.set(h.exitP.x, h.exitP.y, h.exitP.z);
  PLAYER.camY = h.exitP.y + 1.58;
  $('fxHide').style.opacity = 0;
  h.doors.forEach(d => (d.visible = true));
  SFX.closet(h.cam, false); animateHideDoors(h);
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
SFX.doorShut = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 0.14, f: 360, q: 0.7, type: 'lowpass', vol: 0.75, rev: 0.4, brown: true }); AU.tone({ pos, f: 90, f2: 50, dur: 0.14, vol: 0.4 }); AU.burst({ pos, t0: AU.t + 0.05, dur: 0.03, f: 2400, q: 2, vol: 0.14 }); };
SFX.push = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 0.45, a: 0.05, f: 240, q: 0.6, type: 'lowpass', vol: 0.5, brown: true, rev: 0.25 }); AU.burst({ pos, dur: 0.35, a: 0.05, f: 1200, q: 3, vol: 0.06, rev: 0.2 }); };
SFX.cellDoor = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 0.08, f: 1800, q: 4, vol: 0.5, rev: 0.4 }); for (const [f, v] of [[420, 0.08], [880, 0.05], [1310, 0.03]]) AU.tone({ pos, type: 'sine', f, dur: 0.8, vol: v, rev: 0.5 }); };
SFX.drain = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 1.6, a: 0.2, f: 500, q: 0.8, vol: 0.35, sweepTo: 180, brown: true, rev: 0.4 }); for (let i = 0; i < 8; i++) AU.tone({ pos, t0: AU.t + 0.2 + i * 0.16, type: 'sine', f: 300 + Math.random() * 300, f2: 120, dur: 0.12, vol: 0.06, rev: 0.4 }); };
SFX.fall = () => { if (!AU.ok) return; AU.burst({ dur: 0.5, a: 0.1, f: 600, q: 0.5, vol: 0.3, sweepTo: 2000 }); AU.burst({ t0: AU.t + 0.55, dur: 0.3, f: 220, q: 0.6, type: 'lowpass', vol: 1, brown: true, rev: 0.3 }); AU.tone({ t0: AU.t + 0.55, f: 80, f2: 40, dur: 0.3, vol: 0.6 }); };
