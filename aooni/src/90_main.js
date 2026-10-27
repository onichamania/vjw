
/* =========================================================================
   The others: Takeshi, Takuro and Mika as they look in the original (blond Takeshi in a white shirt,
   red-haired Takuro with his ponytail, Mika's brown bob and navy uniform)
   ========================================================================= */
const PEOPLE = {
  takeshi: { name: 'たけし', hair: 0xd8b860, style: 'short', top: 0xf0f0ea, bottom: 0x1c1c22 },
  takuro: { name: 'たくろう', hair: 0xb8402a, style: 'pony', top: 0xf0f0ea, bottom: 0x1c1c22 },
  mika: { name: 'みか', hair: 0x6a3a22, style: 'bob', top: 0x1c2648, bottom: 0x1c2648, skirt: true },
};
function makePerson(def) {
  const g = new THREE.Group(), M = (c, r = 0.75) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const skin = M(0xf0d0b4, 0.6), hair = M(def.hair, 0.55), top = M(def.top), bottom = M(def.bottom), shoe = M(0x3a2414), eye = new THREE.MeshBasicMaterial({ color: 0x1a1210 });
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o; };
  const sph = new THREE.SphereGeometry(1, 18, 14), cyl = new THREE.CylinderGeometry(1, 1, 1, 12), bx = new THREE.BoxGeometry(1, 1, 1);
  const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
  const h = (geo, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); head.add(o); return o; };
  h(sph, skin, 0, 0.02, 0, 0.12, 0.14, 0.125);
  h(sph, hair, 0, 0.07, -0.015, 0.132, 0.12, 0.135);
  h(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), hair, 0, 0.055, 0.035, 0.13, 0.09, 0.105);   // fringe
  if (def.style === 'bob') { h(sph, hair, 0, -0.03, -0.045, 0.142, 0.13, 0.11); for (const sd of [-1, 1]) h(bx, hair, sd * 0.115, -0.04, 0.03, 0.04, 0.16, 0.12); }
  if (def.style === 'pony') { h(sph, hair, 0, 0.0, -0.17, 0.05, 0.12, 0.05); }
  for (const s of [-1, 1]) h(sph, eye, s * 0.045, 0.0, 0.112, 0.016, 0.022, 0.01);
  add(cyl, top, 0, 1.17, 0, 0.17, 0.42, 0.11);
  add(sph, top, 0, 1.36, 0, 0.19, 0.07, 0.12);
  if (def.skirt) add(new THREE.CylinderGeometry(0.15, 0.22, 0.32, 14), bottom, 0, 0.82, 0);
  else add(cyl, bottom, 0, 0.86, 0, 0.165, 0.2, 0.1);
  const legs = [];
  for (const s of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(s * 0.08, 0.86, 0); g.add(lg);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.8, 10), def.skirt ? skin : bottom); l.position.y = -0.42; l.castShadow = true; lg.add(l);
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.2), shoe); sh.position.set(0, -0.83, 0.04); lg.add(sh);
    legs.push(lg);
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const am = new THREE.Group(); am.position.set(s * 0.21, 1.36, 0); g.add(am);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.6, 10), top); a.position.y = -0.3; a.castShadow = true; am.add(a);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), skin); hd.position.y = -0.63; am.add(hd);
    am.rotation.z = s * 0.08; arms.push(am);
  }
  g.userData = { head, legs, arms, def };
  return g;
}
const CAST = {
  list: {},
  get(id) {
    if (!this.list[id]) { const m = makePerson(PEOPLE[id]); m.visible = false; scene.add(m); this.list[id] = { m, walk: 0, shiver: 0 }; }
    return this.list[id];
  },
  place(id, x, y, z, yaw) { const c = this.get(id); c.m.position.set(x, y, z); c.m.rotation.y = yaw; c.m.visible = true; c.base = c.m.position.clone(); return c; },
  hide(id) { if (this.list[id]) this.list[id].m.visible = false; },
  hideAll() { for (const k in this.list) this.list[k].m.visible = false; },
  update(dt) {
    for (const k in this.list) {
      const c = this.list[k]; if (!c.m.visible) continue;
      const u = c.m.userData;
      c.walk = damp(c.walk, c.moving ? 1 : 0, 8, dt);
      const ph = GAME.time * 7;
      u.legs.forEach((l, i) => (l.rotation.x = Math.sin(ph + i * Math.PI) * 0.5 * c.walk));
      u.arms.forEach((a, i) => (a.rotation.x = -Math.sin(ph + i * Math.PI) * 0.4 * c.walk));
      u.head.rotation.y = Math.sin(GAME.time * 0.7 + k.length) * 0.15 * (1 - c.walk);
      if (c.shiver && c.base) { c.m.position.x = c.base.x + (Math.random() - 0.5) * 0.015 * c.shiver; c.m.position.z = c.base.z + (Math.random() - 0.5) * 0.015 * c.shiver; }
    }
  },
  // walk somewhere in a straight line
  walkTo(id, x, z, speed = 1.3, done) {
    const c = this.get(id), m = c.m;
    c.moving = true;
    animate(() => {
      const dx = x - m.position.x, dz = z - m.position.z, d = Math.hypot(dx, dz);
      if (d < 0.05 || !m.visible) { c.moving = false; if (done) done(); return false; }
      m.rotation.y = Math.atan2(dx, dz);
      const st = Math.min(d, speed / 60); m.position.x += dx / d * st; m.position.z += dz / d * st;
      return true;
    });
  },
};

/* ---------- face portraits for the message window ---------- */
function portrait(id) {
  const P = {
    hiroshi: { hair: '#e8e8ec', hairD: '#b8b8c4', top: '#18181c', glasses: true },
    takeshi: { hair: '#e6c46a', hairD: '#b8943a', top: '#f2f2ec' },
    takuro: { hair: '#c8482c', hairD: '#8a2a18', top: '#f2f2ec', pony: true },
    mika: { hair: '#7a4428', hairD: '#4a2414', top: '#1e2a52', bob: true },
  }[id];
  if (!P) return '';
  const pony = P.pony ? `<path d="M22 44 Q8 52 14 76 Q24 64 30 54Z" fill="${P.hairD}"/>` : '';
  const bob = P.bob ? `<path d="M18 40 Q14 70 26 82 L34 82 L32 46Z M78 40 Q82 70 70 82 L62 82 L64 46Z" fill="${P.hair}"/>` : '';
  const glasses = P.glasses ? `<g fill="none" stroke="#2a2a30" stroke-width="2.2"><rect x="30" y="50" width="15" height="10" rx="2"/><rect x="51" y="50" width="15" height="10" rx="2"/><path d="M45 54h6"/></g>` : '';
  return `<svg viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" fill="#0c0c10"/>${pony}
    <path d="M14 96 Q16 78 34 74 L62 74 Q80 78 82 96Z" fill="${P.top}"/><path d="M40 74 L48 86 L56 74Z" fill="${P.top === '#f2f2ec' ? '#dcdcd4' : '#c9c9d4'}"/>
    <rect x="41" y="64" width="14" height="12" fill="#e9c4a6"/>
    <ellipse cx="48" cy="50" rx="23" ry="26" fill="#f2d2b6"/>
    ${bob}
    <path d="M24 46 Q22 18 48 18 Q74 18 72 46 Q66 32 58 30 Q52 40 40 36 Q30 34 24 46Z" fill="${P.hair}"/>
    <path d="M30 30 Q40 22 52 26" stroke="${P.hairD}" stroke-width="2" fill="none"/>
    <ellipse cx="38" cy="55" rx="3.2" ry="4.2" fill="#2a1a12"/><ellipse cx="58" cy="55" rx="3.2" ry="4.2" fill="#2a1a12"/>
    <circle cx="39" cy="53.5" r="1" fill="#fff"/><circle cx="59" cy="53.5" r="1" fill="#fff"/>
    <path d="M43 66 Q48 68 53 66" stroke="#a0604a" stroke-width="1.6" fill="none"/>${glasses}</svg>`;
}
const FACE_OF = { 'ひろし': 'hiroshi', 'たけし': 'takeshi', 'たくろう': 'takuro', 'みか': 'mika' };

/* =========================================================================
   Story: what you carry, what has happened, the scenes, saving
   ========================================================================= */
const STORY = {
  inv: [], got: [], unlocked: [], flags: {}, busy: false,
  reset() { this.inv = []; this.got = []; this.unlocked = []; this.flags = {}; this.busy = false; },
  has(id) { return this.inv.includes(id); },
  hasGot(id) { return this.got.includes(id); },
  give(id) {
    if (!this.got.includes(id)) this.got.push(id);
    if (!this.inv.includes(id)) this.inv.push(id);
    if ((id === 'oil' && this.has('lighter')) || (id === 'lighter' && this.has('oil'))) { this.flags.oilUsed = true; this.use('oil'); GAME.later(0.1, () => GAME.say([['', 'ライターにオイルを入れた。'], ['', IS_TOUCH ? '（炎のボタンでライターをつけられる）' : '（F キー／右クリックでライターをつけられる）']])); }
    UI.inv();
  },
  use(id) { this.inv = this.inv.filter(x => x !== id); UI.inv(); },
  unlock(id) { if (!this.unlocked.includes(id)) this.unlocked.push(id); },
  save() {
    const h = PLAYER.hidden, p = h ? h.exitP : PLAYER.pos;
    store.set('save', { v: 2, inv: this.inv, got: this.got, unlocked: this.unlocked, flags: this.flags, pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +PLAYER.yaw.toFixed(2)], time: Math.round(GAME.time), caught: GAME.caughtN || 0 });
  },
  event(name) { if (EVENTS[name]) EVENTS[name](); },
  // doors with something special about them
  doorHook(d) {
    const f = this.flags;
    if (d.id === 'attic' && f.takuro && this.has('driver') && !this.hasGot('knob')) return { prompt: '＋ドライバーでドアノブを外す', use: () => EVENTS.knob(d) };
    return null;
  },
};
// a timeline that follows game time (so it stops while paused or reading)
GAME.timers = [];
GAME.later = (sec, fn) => GAME.timers.push({ at: GAME.time + sec, fn });
function runTimers() { for (const t of GAME.timers.slice()) if (GAME.time >= t.at) { GAME.timers.splice(GAME.timers.indexOf(t), 1); t.fn(); } }
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
// make the player look at a point (camera yaw/pitch)
function lookAtPoint(p, k = 1) {
  const e = camera.position, dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z;
  PLAYER.yaw = lerp(PLAYER.yaw, Math.atan2(-dx, -dz), k); PLAYER.pitch = lerp(PLAYER.pitch, Math.atan2(dy, Math.hypot(dx, dz)), k);
}
const EVENTS = {
  plate() {
    const f = STORY.flags;
    if (!f.plateLook) { f.plateLook = true; GAME.say([['ひろし', 'お皿が割れている……。さっきの音はこれか。'], ['ひろし', 'でも、どうして急に……？']]); return; }
    GAME.take('shard', null, () => GAME.say([['ひろし', '何かに使えるかもしれない。持っていこう。']]));
  },
  tkChair() {
    const c = MAN.tkChair; if (c.at) return;
    c.at = 1; STORY.flags.tkChair = true; c.slide(c.g.position.x + T, c.g.position.z);
    GAME.later(0.6, () => { MAN.props.k_library.visible = true; GAME.say([['', 'イスを押した。'], ['ひろし', '……机の下で何か光ってる。']]); });
  },
  libraryKey() { GAME.take('k_library', MAN.props.k_library); },
  takeshiCloset() {
    const h = MAN.tkCloset, f = STORY.flags;
    STORY.busy = true; SFX.closet(h.cam, true);
    h.doors.forEach((d, i) => { d.rotation.y = d.userData.baseRy + (i === 0 ? -1.3 : 1.3); });
    const p = h.room.toWorld(h.F.x, 0, h.F.z), c = CAST.place('takeshi', p.x, p.y, p.z, h.F.ry); c.m.scale.setScalar(0.92); c.shiver = 1;
    const lines = !f.takeshiMet ? [
      ['たけし', 'う、うわああああ！！'], ['たけし', '……な、なんだ、ひろしかよ。おどかすなよ……。'], ['ひろし', 'たけし、こんなところで何してるんだ？'],
      ['たけし', 'み、見たんだよ……！　でっかい頭の、青い化け物……！'], ['ひろし', '化け物？　そんなの科学的にありえないよ。'],
      ['たけし', 'ほ、本当なんだって！　俺はここから一歩も出ないからな！'],
    ] : [['たけし', 'お、俺はここにいるからな……。早く出口を見つけてくれよ……。']];
    f.takeshiMet = true;
    GAME.say(lines, () => { c.shiver = 0; CAST.hide('takeshi'); h.doors.forEach(d => { d.rotation.y = d.userData.baseRy; }); SFX.closet(h.cam, false); STORY.busy = false; STORY.save(); });
  },
  greenBook() {
    const f = STORY.flags;
    if (!f.bookMoved) {
      f.bookMoved = true; const b = MAN.props.greenBook, x0 = b.position.x, t0 = performance.now();
      SFX.book(b.position.clone().setY(0.9));
      animate(() => { const k = Math.min(1, (performance.now() - t0) / 400); b.position.x = x0 - 0.35 * smoothstep(0, 1, k); return k < 1; });
      MAN.props.k_bedroom.visible = true;
      GAME.say([['', '本をどけた。'], ['ひろし', '……下に鍵がある。']]);
      return;
    }
    GAME.take('k_bedroom', MAN.props.k_bedroom, () => EVENTS.libraryChase());
  },
  // the first time you go into the library it walks across the middle of the room and away behind the shelves
  // (it is already there as the screen comes back from black; you can't move, your eyes follow it)
  libraryGlimpse() {
    const r = MAN.areas.library, [a, ...rest] = r.oniGlimpse, at = r.glimpseAt;
    STORY.flags.glimpse = true; STORY.busy = true; PLAYER.frozen = true;
    PLAYER.pos.set(at.x, FLOORS.F1, at.z); PLAYER.camY = FLOORS.F1 + 1.58; PLAYER.yaw = Math.atan2(at.x - a[0], at.z - a[1]); PLAYER.pitch = 0.05;   // a few steps in, facing it
    ONI.spawn(a[0], FLOORS.F1, a[1], -Math.PI / 2, 'script');
    ONI.script = { i: 0, steps: [...rest.map(q => ({ t: 'go', p: new THREE.Vector3(q[0], FLOORS.F1, q[1]), sp: 2.8 })), { t: 'gone' }], done: null };
    ONI.script.steps[rest.length].fn = () => { PLAYER.frozen = false; STORY.busy = false; GAME.later(0.5, () => GAME.say([['ひろし', '……今、何か……いなかったか……？']])); };
    const t0 = GAME.time;
    animate(() => {
      if (!ONI.on || ONI.state !== 'script' || GAME.time - t0 > 16) { if (PLAYER.frozen && !ONI.on) PLAYER.frozen = false; return false; }
      lookAtPoint(tmpV.copy(ONI.eye()).setY(ONI.eye().y - 0.4), 0.06); return true;
    });
  },
  libraryChase() {
    const r = MAN.areas.library, [x, z] = r.oniSpawn;
    STORY.flags.libChase = true;
    ONI.spawn(x, FLOORS.F1, z, yawTo({ x, z }, PLAYER.pos), 'appear'); ONI.appearFor = 1.3;
    SFX.oniSpot(); POST.shake = 0.35; UI.hint('…………！？', 1600);
    DIRECTOR.enabled = true; DIRECTOR.cool = 999;
    STORY.save();
  },
  afterChase() {   // called when it is gone
    const f = STORY.flags;
    if (f.libChase && !f.libChaseDone) { f.libChaseDone = true; f.takeshiGone = true; MAN.props.hanky.visible = true; STORY.save(); }
    if (f.pianoChase && !f.pianoChaseDone) { f.pianoChaseDone = true; STORY.save(); }
    if (f.tatamiChase && !f.tatamiChaseDone) { f.tatamiChaseDone = true; STORY.save(); }
    if (f.kidsChase && !f.kidsChaseDone) { f.kidsChaseDone = true; STORY.save(); GAME.later(2.5, () => GAME.say([['ひろし', '……みか……。'], ['ひろし', '地下室……。あそこに行けば、何かわかるかもしれない。']])); }
    if (f.jailScene && !f.jailDone) { f.jailDone = true; STORY.save(); }
  },
  hanky() { GAME.take('hanky', MAN.props.hanky, () => GAME.say([['ひろし', 'ハンカチだ。たけしのかな……？'], ['ひろし', 'たけしはどこへ行ったんだ……。']])); },
  tub() {
    const f = STORY.flags;
    if (!f.tubDrained) {
      f.tubDrained = true; SFX.drain(MAN.tubWater.position.clone());
      const w = MAN.tubWater, y0 = w.position.y, t0 = performance.now();
      animate(() => { const k = Math.min(1, (performance.now() - t0) / 1800); w.position.y = y0 - 0.35 * k; if (k >= 1) w.visible = false; return k < 1; });
      GAME.say([['', '浴槽の栓を抜いた。'], ['', '水が抜けていく……。']]);
      return;
    }
    GAME.take('driver', null, () => GAME.say([['ひろし', '浴槽の底に落ちていた。何かに使えそうだ。']]));
  },
  soap() { GAME.take('soap', MAN.props.soap); },
  takuroScene() {
    const d = MAN.doors.attic, f = STORY.flags;
    f.takuro = true; STORY.busy = true;
    GAME.later(1.2, () => {
      animateDoor(d, 1.1, 900); SFX.door(d.center, 1.0);
      const c = CAST.place('takuro', d.front.x, d.front.y, d.front.z, yawTo(d.front, PLAYER.pos));
      const into = new THREE.Vector3(-Math.sin(d.yawIn), 0, -Math.cos(d.yawIn));
      CAST.walkTo('takuro', d.front.x + into.x * 1.4, d.front.z + into.z * 1.4, 1.2, () => {
        c.m.rotation.y = yawTo(c.m.position, PLAYER.pos);
        GAME.say([
          ['たくろう', '……なんだ、ひろしか。'], ['ひろし', 'たくろう！　無事だったんだね。'], ['たくろう', 'みかを見なかったか？　はぐれちまってさ。'],
          ['ひろし', 'ううん……。たくろう、この家、何かいるよ。'], ['たくろう', '……ああ、知ってる。'], ['たくろう', '俺はみかを探す。お前も気をつけろよ。'],
        ], () => {
          CAST.walkTo('takuro', d.front.x, d.front.z, 1.4, () => { animateDoor(d, 1.1, 700); SFX.door(d.center, 0.9); setTimeout(() => SFX.doorShut(d.center), 500); CAST.hide('takuro'); STORY.busy = false; STORY.save(); });
        });
      });
    });
  },
  knob(d) {
    d.knobs.forEach(k => (k.visible = false));
    SFX.unlock(d.center);
    GAME.take('knob', null, () => GAME.say([['ひろし', 'ドライバーでドアノブを外した。']]));
  },
  pushBed() {
    const b = MAN.leftBed; if (b.at) return;
    b.at = 1; STORY.flags.bedPushed = true; b.slide(b.g.position.x - T, b.g.position.z, 900);
    GAME.later(1.0, () => { MAN.hole.visible = true; GAME.say([['', 'ベッドを押した。'], ['ひろし', '……床に穴が開いてる。']]); });
  },
  fall() {
    if (GAME.busy) return;
    GAME.busy = 1; SFX.fall(); STORY.flags.fell = true;
    const r = MAN.areas.piano, L = r.landing;
    GAME.fade(0.5, () => {
      PLAYER.pos.set(L.x, FLOORS.F2, L.z); PLAYER.camY = FLOORS.F2 + 1.0; PLAYER.yaw = L.yaw; PLAYER.pitch = -0.2; POST.shake = 0.6;
      GAME.room = r; GAME.onEnterRoom(r);
    }, () => { GAME.busy = 0; GAME.say([['ひろし', '……いてて。'], ['ひろし', 'ここは……ピアノの部屋？']]); STORY.save(); });
  },
  pianoShelf() {
    const dr = MAN.pianoDrawers; if (dr.at) return;
    dr.at = 1; STORY.flags.pianoShelf = true; dr.slide(dr.g.position.x + 2.1, dr.g.position.z, 800);
    GAME.later(0.9, () => GAME.say([['', '棚を動かした。'], ['ひろし', '……壁に金庫が埋めこまれている。']]));
  },
  piano() {
    const f = STORY.flags;
    if (!f.pianoClean) {
      if (STORY.has('hanky') && STORY.has('soap')) {
        f.pianoClean = true; MAN.pianoStain.visible = false; STORY.use('soap'); STORY.use('hanky');
        GAME.say([['', 'ハンカチに洗剤をつけて、鍵盤の赤い汚れをふきとった。']], () => EVENTS.pianoChase());
        return;
      }
      GAME.say(STORY.has('hanky') ? [['ひろし', '鍵盤が赤く汚れている……。'], ['ひろし', 'ハンカチだけじゃ落ちないな。洗剤があれば……。']] : [['ひろし', '鍵盤の一部が、赤黒く汚れている……。'], ['ひろし', '何かでふきとれないかな。']]);
      return;
    }
    UI.pianoKeys();
  },
  pianoChase() {
    STORY.flags.pianoChase = true; STORY.flags.pianoUnlocked = true; STORY.save();
    GAME.later(1.2, () => { ONI.enterVia(MAN.doors.piano, 0.01); SFX.oniSpot(); });
  },
  safeOpened() {
    STORY.flags.safeOpen = true; SFX.unlock(MAN.safe.position.clone().setY(FLOORS.F2 + 0.4));
    GAME.take('k_kids', null, () => GAME.say([['ひろし', '「子供部屋」……。2階の左の部屋か。']]));
  },
  mika() {
    const f = STORY.flags;
    GAME.say(!f.mikaMet ? [['みか', '……ひろしくん？'], ['ひろし', 'みか！　ここにいたのか。'], ['みか', 'たくろうとはぐれちゃって……。この家、なにか変だよ……。'], ['ひろし', 'たくろうもみかを探してたよ。'], ['みか', '……私、ここで待ってる。もう、こわくて動けないの……。']]
      : [['みか', '……たくろう、まだかな……。']]);
    f.mikaMet = true; STORY.save();
  },
  kidsChair() {
    const c = MAN.kidsChair; if (c.at) return;
    c.at = 1; STORY.flags.kidsChair = true; c.slide(tm(13.5), tm(-13) + 1.1, 900);
    GAME.later(0.9, () => GAME.say([['', 'イスを棚の前まで押した。']]));
  },
  kidsShelf() {
    if (!MAN.kidsChair.at) { GAME.say([['ひろし', '棚の上に何かある……。でも、手が届かない。']]); return; }
    MAN.props.oil.visible = false;
    GAME.take('oil', null, () => GAME.say([['', 'イスに乗って、棚の上からとった。']]));
  },
  fusumaL() {
    const f = STORY.flags;
    if (!f.tatamiChase) { EVENTS.tatamiChase(); return; }
    if (STORY.hasGot('lighter')) return;
    openFusuma(0, 1);
    GAME.take('lighter', null, () => GAME.later(0.6, () => closeFusuma(0, 1)));
  },
  fusumaR() {
    if (!STORY.flags.tatamiChase) { EVENTS.tatamiChase(); return; }
    GAME.say([['ひろし', '押入れの中は空っぽだ……。']]);
  },
  tatamiChase() {
    STORY.flags.tatamiChase = true; STORY.save();
    GAME.say([['ひろし', '……ん？　中から、何か音が……。']], () => {
      openFusuma(2, 3);
      const p = MAN.fusuma[2].userData.home.clone().lerp(MAN.fusuma[3].userData.home, 0.5);
      ONI.spawn(p.x, FLOORS.F1, p.z + 0.5, 0, 'appear'); ONI.appearFor = 0.9; SFX.oniSpot(); POST.shake = 0.4;
      GAME.later(2.5, () => closeFusuma(2, 3));
    });
  },
  greyWall() {
    const f = STORY.flags, d = MAN.doors.corT_hid;
    if (!f.wallCut) {
      if (!STORY.has('shard')) { GAME.say([['ひろし', 'ここだけ、壁紙の色が少しちがう……。'], ['ひろし', '何か、切れるものがあれば……。']]); return; }
      f.wallCut = true; showHiddenDoor(d, false); SFX.paper();
      GAME.say([['', '皿の破片で、壁紙を切りさいた。'], ['ひろし', '……扉だ！　でも、ドアノブがない。']]); STORY.save(); return;
    }
    if (!f.knobOn) {
      if (!STORY.has('knob')) { GAME.say([['ひろし', 'ドアノブがないから開けられない。']]); return; }
      f.knobOn = true; STORY.use('knob'); showHiddenDoor(d, true); SFX.unlock(d.center);
      GAME.say([['', 'ドアノブを取りつけた。']]); STORY.save(); return;
    }
    GAME.goThrough(d);
  },
  candle() {
    if (MAN.candle.state === 'on') return;
    if (!GAME.canLight()) { GAME.say([['ひろし', STORY.has('lighter') ? 'ライターのオイルがない……。' : 'ろうそくだ。火をつけるものがあれば……。']]); return; }
    MAN.candle.state = 'on'; STORY.flags.candle = true; SFX.lighter();
    GAME.say([['', 'ろうそくに火をつけた。']]); STORY.save();
  },
  jailShelf() {
    if (MAN.candle.state !== 'on' && !GAME.lighterOn) { GAME.say([['ひろし', '暗くてよく見えない……。']]); return; }
    const s = MAN.jailShelf; if (s.at) return;
    s.at = 1; STORY.flags.jailShelf = true; s.slide(s.g.position.x + tm(2), s.g.position.z, 1000);
    GAME.later(1.1, () => GAME.say([['', '本棚を動かした。'], ['ひろし', '……奥に扉がある。']]));
  },
  basementKey() {
    MAN.props.k_basement.visible = false;
    GAME.take('k_basement', null, () => EVENTS.jailScene());
  },
  jailScene() {
    STORY.flags.jailScene = true; STORY.save();
    GAME.later(1.6, () => {
      SFX.oniStep(MAN.doors.jail.front, 0.9);
      ONI.enterVia(MAN.doors.jail, 1.4, 'bars'); ONI.sub = 0; ONI.wait = 0;
      GAME.later(1.5, () => { if (ONI.on && ONI.state === 'bars') { ONI.sub = 0; ONI.wait = 0; } });
    });
  },
  basementUnlocked() {
    STORY.flags.basementOpen = true; STORY.save();
    GAME.later(1.2, () => { SFX.scream2(); POST.shake = 0.3; GAME.later(1.4, () => GAME.say([['ひろし', '……！？'], ['ひろし', '今の……みかの声……！？'], ['ひろし', '子供部屋だ……！']])); });
  },
  kidsChase() {
    STORY.flags.kidsChase = true; STORY.save();
    CAST.hide('mika');
    const m = MAN.areas.kids.mikaAt;
    GAME.later(0.8, () => GAME.say([['ひろし', '……みか？'], ['ひろし', 'いない……。']], () => GAME.later(0.5, () => { ONI.spawn(m.x, FLOORS.F2, m.z, yawTo(m, PLAYER.pos), 'appear'); ONI.appearFor = 1.1; SFX.oniSpot(); POST.shake = 0.4; })));
  },
  downstairs() {
    if (!STORY.flags.kidsChaseDone) { GAME.say([['ひろし', '……先に、みかの様子を見に行こう。']]); return; }
    GAME.chapterEnd();
  },
};
function openFusuma(a, b) { [a, b].forEach((i, k) => { const p = MAN.fusuma[i], t0 = performance.now(), dx = (k === 0 ? -1 : 1) * 0.9; animate(() => { const u = Math.min(1, (performance.now() - t0) / 350); p.position.x = p.userData.home.x + dx * u; return u < 1; }); }); SFX.slide && SFX.slide(MAN.fusuma[a].position.clone()); }
function closeFusuma(a, b) { [a, b].forEach(i => { const p = MAN.fusuma[i], x0 = p.position.x, t0 = performance.now(); animate(() => { const u = Math.min(1, (performance.now() - t0) / 350); p.position.x = lerp(x0, p.userData.home.x, u); return u < 1; }); }); }
function showHiddenDoor(d, knob) { d.leaf.material = AOM.door; d.trims.visible = true; d.panels.forEach(p => (p.visible = true)); d.knobs.forEach(k => (k.visible = knob)); if (MAN.greyCover) MAN.greyCover.visible = false; }
SFX.slide = pos => { if (!AU.ok) return; AU.burst({ pos, dur: 0.35, a: 0.03, f: 1400, q: 0.6, vol: 0.25, rev: 0.25 }); AU.burst({ pos, t0: AU.t + 0.33, dur: 0.05, f: 500, q: 1, vol: 0.3 }); };

/* =========================================================================
   UI
   ========================================================================= */
const ITEM_SVG = {
  key: c => `<svg viewBox="0 0 40 40"><circle cx="12" cy="20" r="7" fill="none" stroke="${c}" stroke-width="4"/><path d="M19 20h17M30 20v6M35 20v5" stroke="${c}" stroke-width="4" stroke-linecap="round"/></svg>`,
  shard: () => '<svg viewBox="0 0 40 40"><path d="M8 28 L20 8 L32 18 L26 32Z" fill="#eeeae0" stroke="#9a968c" stroke-width="2"/></svg>',
  cloth: () => '<svg viewBox="0 0 40 40"><path d="M8 10 L32 8 L30 32 L10 30Z" fill="#f4f4f0" stroke="#b8b8b0" stroke-width="2"/><path d="M12 14h14M12 20h12" stroke="#c8c8c0" stroke-width="1.5"/></svg>',
  driver: () => '<svg viewBox="0 0 40 40"><rect x="6" y="16" width="12" height="8" rx="3" fill="#d23a2a"/><path d="M18 20h16" stroke="#b8bcc4" stroke-width="3"/><path d="M33 17v6M30 20h6" stroke="#b8bcc4" stroke-width="2"/></svg>',
  soap: () => '<svg viewBox="0 0 40 40"><rect x="13" y="12" width="14" height="22" rx="4" fill="#3fa0e0"/><rect x="16" y="6" width="8" height="7" fill="#eee"/></svg>',
  knob: () => '<svg viewBox="0 0 40 40"><circle cx="20" cy="18" r="9" fill="#d8b84a"/><rect x="17" y="26" width="6" height="8" fill="#a88a2a"/></svg>',
  oil: () => '<svg viewBox="0 0 40 40"><rect x="12" y="12" width="16" height="22" rx="2" fill="#d8b030"/><rect x="17" y="6" width="6" height="7" fill="#888"/></svg>',
  lighter: () => ICONS.lighter,
};
const UI = {
  show(id, on = true) { $(id).classList.toggle('hidden', !on); },
  hint(text, ms = 2600) { const h = $('hint'); h.textContent = text; h.classList.add('on'); clearTimeout(h._t); h._t = setTimeout(() => h.classList.remove('on'), ms); },
  place(name) { const p = $('place'); p.textContent = name; p.style.transition = 'opacity .3s'; p.style.opacity = 1; clearTimeout(p._t); p._t = setTimeout(() => { p.style.transition = 'opacity 1.4s'; p.style.opacity = 0; }, 2000); },
  inv() {
    const el = $('inv'); el.innerHTML = '';
    for (const id of STORY.inv) {
      const d = ITEMS[id], it = document.createElement('div'); it.className = 'it';
      it.innerHTML = (ITEM_SVG[d.icon] ? ITEM_SVG[d.icon](d.color || '#e7c264') : '') + `<span>${d.name}</span>`;
      el.appendChild(it);
    }
  },
  /* the message window, after the original's: a black box with a white frame, the name above it, the face on the left */
  message(lines, done) {
    const M = UI._msg = { lines, i: -1, done, shown: 0, full: '', t0: 0 };
    GAME.modal = { msg: true };
    UI.show('msg'); UI.msgNext();
    animate(() => {
      if (UI._msg !== M) return false;
      if (M.shown < M.full.length) { M.shown = Math.min(M.full.length, Math.floor((performance.now() - M.t0) / 1000 * 36)); $('msgText').textContent = M.full.slice(0, M.shown); $('msgNext').style.visibility = M.shown >= M.full.length ? 'visible' : 'hidden'; }
      return true;
    });
  },
  msgNext() {
    const M = UI._msg; if (!M) return;
    if (M.i >= 0 && M.shown < M.full.length) { M.shown = M.full.length; $('msgText').textContent = M.full; $('msgNext').style.visibility = 'visible'; return; }
    M.i++;
    if (M.i >= M.lines.length) {
      UI._msg = null; UI.show('msg', false);
      if (GAME.modal && GAME.modal.msg) GAME.modal = null;
      if (M.done) M.done();
      return;
    }
    const [name, text] = M.lines[M.i], face = FACE_OF[name];
    $('msgName').textContent = name; $('msgFace').innerHTML = face ? portrait(face) : ''; $('msgBox').classList.toggle('face', !!face);
    M.full = text; M.shown = 0; M.t0 = performance.now(); $('msgText').textContent = ''; $('msgNext').style.visibility = 'hidden';
    if (AU.ok) AU.burst({ dur: 0.02, f: 3200, q: 2, vol: 0.06, rev: 0 });
  },
  closeModal() { $('modal').classList.add('hidden'); $('modal').innerHTML = ''; const m = GAME.modal; GAME.modal = null; if (m && m.onClose) m.onClose(); if (!IS_TOUCH && GAME.state === 'play' && PLAYER.alive) requestLock(); },
  openModal(html, opts = {}) {
    const m = $('modal'); m.innerHTML = html; m.classList.remove('hidden');
    GAME.modal = opts;
    if (document.pointerLockElement) document.exitPointerLock();
    m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => UI.closeModal()));
    m.onclick = e => { if (e.target === m) UI.closeModal(); };   // a tap on the dark around it closes it
    return m;
  },
  // the cleaned keys: the numbers in red
  pianoKeys() {
    const dg = STORY.flags.code.piano, keys = Array.from({ length: 14 }, (_, i) => `<div class="pk">${i >= 5 && i < 9 ? `<b>${dg[i - 5]}</b>` : ''}</div>`).join('');
    const m = UI.openModal(`<div class="pkeys"><button class="close" data-close>×</button><div class="pkrow">${keys}</div><div class="msgline">ふきとった鍵盤に、赤い数字が書かれている。</div><div class="btns"><button class="mbtn primary" data-close>閉じる</button></div></div>`);
    m.querySelector('.pkrow').addEventListener('click', () => UI.closeModal());   // it is only something to look at: a tap on the keys puts it away too
  },
  // the safe: mounted upside down; four dials
  safe() {
    const code = STORY.flags.code.safe, v = [0, 0, 0, 0];
    let fails = 0;
    const m = UI.openModal(`<div class="safe"><button class="close" data-close>×</button><div class="msgline">壁に埋めこまれた金庫。……なぜか、さかさまに取りつけられている。</div>
      <div class="dials">${v.map((_, i) => `<div class="dial"><button data-u="${i}">▲</button><div class="dd" id="sd${i}">0</div><button data-d="${i}">▼</button></div>`).join('')}</div>
      <div class="btns"><button class="mbtn primary" id="sfOpen">開ける</button><button class="mbtn" data-close>やめる</button></div><div class="msgline" id="sfMsg"></div></div>`);
    const draw = () => v.forEach((d, i) => ($('sd' + i).textContent = d));
    m.querySelectorAll('[data-u]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.u; v[i] = (v[i] + 1) % 10; draw(); SFX.click && SFX.click(); }));
    m.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.d; v[i] = (v[i] + 9) % 10; draw(); SFX.click && SFX.click(); }));
    $('sfOpen').onclick = () => {
      // the dials read upside down: what you see from the front is the code turned 180 degrees
      if (v.join('') === code) { UI.closeModal(); EVENTS.safeOpened(); return; }
      fails++; SFX.locked(MAN.safe.position.clone()); $('sfMsg').textContent = fails >= 3 ? '開かない……。ピアノの数字を、さかさまから読んでみたら……？' : '開かない……。';
    };
  },
  pause() {
    if (GAME.state !== 'play' || GAME.paused || !PLAYER.alive || GAME.modal || GAME.cine || GAME.busy || !$('pause').classList.contains('hidden')) return;
    GAME.paused = true; UI.show('pause');
    const r = GAME.room;
    $('pauseInfo').textContent = `現在地：${r ? r.name : '？'}　/　持ち物：${STORY.inv.map(i => ITEMS[i].name).join('、') || 'なし'}`;
    if (AU.ctx) AU.ctx.suspend();
  },
  resume() { GAME.paused = false; UI.show('pause', false); AU.resume(); if (!IS_TOUCH) requestLock(); },
  title() {
    GAME.state = 'title';
    ['hud', 'touch', 'over', 'end', 'pause', 'loading', 'settings', 'how', 'msg'].forEach(i => UI.show(i, false));
    UI.show('title');
    $('bCont').disabled = !store.get('save', null);
    MUSIC.stop(1); if (GAME.amb) { GAME.amb.stop(1); GAME.amb = null; }
    GAME.room = null; ONI.reset(); CAST.hideAll(); UI._msg = null; GAME.modal = null; GAME.cine = null; GAME.busy = 0; GAME.lighterOn = false;
    $('fxBlack').style.transition = 'opacity .6s'; $('fxBlack').style.opacity = 0;
  },
  over() {
    GAME.state = 'over';
    UI.show('hud', false); UI.show('touch', false); UI.show('msg', false);
    const o = $('over'); UI.show('over'); o.classList.remove('show'); void o.offsetWidth; o.classList.add('show');
    $('overSub').innerHTML = '青鬼につかまってしまった……<br><small>部屋を移れば、少し時間がかせげる。追ってこなくなるまで逃げきるか、見られていないうちにクローゼットへ。</small>';
    $('overBtns').style.opacity = 0; $('overBtns').style.pointerEvents = 'none';
    $('oCont').disabled = !store.get('save', null);
    setTimeout(() => { $('overBtns').style.opacity = 1; $('overBtns').style.pointerEvents = 'auto'; $('fxBlack').style.transition = 'opacity .6s'; $('fxBlack').style.opacity = 0; }, 1400);
    if (GAME.amb) { GAME.amb.stop(1); GAME.amb = null; }
  },
  settings(back) {
    UI.show('settings');
    const seg = (id, key, conv = v => v) => { const el = $(id); el.querySelectorAll('button').forEach(b => { b.classList.toggle('on', String(SETTINGS[key]) === b.dataset.v); b.onclick = () => { SETTINGS[key] = conv(b.dataset.v); saveSettings(); seg(id, key, conv); if (key === 'quality') UI._qualityChanged = true; if (key === 'fps') $('fps').style.display = SETTINGS.fps ? 'block' : 'none'; }; }); };
    seg('sQuality', 'quality'); seg('sFps', 'fps', v => +v);
    const rng_ = (id, key, fn) => { const el = $(id); el.value = SETTINGS[key]; el.oninput = () => { SETTINGS[key] = +el.value; saveSettings(); fn && fn(); }; };
    rng_('sBright', 'bright'); rng_('sSens', 'sens'); rng_('sFov', 'fov', () => { camera.fov = SETTINGS.fov; camera.updateProjectionMatrix(); }); rng_('sVol', 'volume', () => AU.setVolume(SETTINGS.volume * HUB.vol));
    $('sBack').onclick = () => { UI.show('settings', false); if (UI._qualityChanged && GAME.state === 'title') { location.reload(); return; } if (UI._qualityChanged) UI.hint('画質の変更は次回の起動から反映されます'); back && back(); };
  },
};

/* =========================================================================
   Game flow
   ========================================================================= */
let materialsReady = false;
function newCode() {
  // four digits that still read as digits upside down; the safe takes them turned 180 degrees
  const pool = [1, 2, 5, 6, 8, 9], rot = { 0: 0, 1: 1, 2: 2, 5: 5, 6: 9, 8: 8, 9: 6 };
  let d, s;
  do { d = Array.from({ length: 4 }, () => pool[(Math.random() * pool.length) | 0]); s = d.slice().reverse().map(x => rot[x]); } while (s.join('') === d.join(''));
  return { piano: d.join(''), safe: s.join('') };
}
// put the house in the state a save describes (things moved, opened, taken)
function applyState() {
  const f = STORY.flags;
  for (const id of STORY.got) { const m = MAN.props[id]; if (m) m.visible = false; }
  for (const id of STORY.unlocked) { const d = MAN.doors[id]; if (d) { d.lock = null; const p = d.to && MAN.doors[d.to]; if (p) p.lock = null; } }
  if (f.tkChair) { MAN.tkChair.at = 1; MAN.tkChair.place(MAN.tkChair.g.position.x + T, MAN.tkChair.g.position.z); if (!STORY.hasGot('k_library')) MAN.props.k_library.visible = true; }
  if (f.bookMoved) { MAN.props.greenBook.position.x -= 0.35; if (!STORY.hasGot('k_bedroom')) MAN.props.k_bedroom.visible = true; }
  if (f.libChase && !f.libChaseDone) { f.libChaseDone = true; f.takeshiGone = true; }
  if (f.libChaseDone && !STORY.hasGot('hanky')) MAN.props.hanky.visible = true;
  if (f.tubDrained) MAN.tubWater.visible = false;
  if (STORY.hasGot('soap')) MAN.props.soap.visible = false;
  if (STORY.hasGot('knob')) MAN.doors.attic.knobs.forEach(k => (k.visible = false));
  if (f.bedPushed) { MAN.leftBed.at = 1; MAN.leftBed.place(MAN.leftBed.g.position.x - T, MAN.leftBed.g.position.z); MAN.hole.visible = true; }
  if (f.pianoShelf) { MAN.pianoDrawers.at = 1; MAN.pianoDrawers.place(MAN.pianoDrawers.g.position.x + 2.1, MAN.pianoDrawers.g.position.z); }
  if (f.pianoClean) MAN.pianoStain.visible = false;
  if (f.kidsChair) { MAN.kidsChair.at = 1; MAN.kidsChair.place(tm(13.5), tm(-13) + 1.1); }
  if (STORY.hasGot('oil')) MAN.props.oil.visible = false;
  if (f.wallCut) showHiddenDoor(MAN.doors.corT_hid, !!f.knobOn);
  if (f.candle) MAN.candle.state = 'on';
  if (f.jailShelf) { MAN.jailShelf.at = 1; MAN.jailShelf.place(MAN.jailShelf.g.position.x + tm(2), MAN.jailShelf.g.position.z); }
  for (const k of ['pianoChase', 'tatamiChase', 'kidsChase']) if (f[k]) f[k + 'Done'] = true;   // a chase you were caught in counts as over
  if (f.jailScene) f.jailDone = true;
  buildNav();
}
GAME.start = async function (save = null) {
  AU.init(); AU.resume();
  ['title', 'over', 'end', 'settings', 'how'].forEach(i => UI.show(i, false));
  if (!materialsReady) {
    UI.show('loading');
    await buildMaterials(p => { $('loadBar').style.width = Math.round(p * 100) + '%'; });
    materialsReady = true;
    UI.show('loading', false);
  }
  rng = new RNG((Math.random() * 2 ** 31) | 0);
  ONI.reset(); WORLD.reset(); PARTICLES.clear(); MUSIC.stop(0.3); CAST.hideAll();
  STORY.reset(); DIRECTOR.reset(); GAME.timers = []; GAME.modal = null; GAME.cine = null; GAME.paused = false; GAME.chaseFx = 0; GAME.busy = 0; GAME.lighterOn = false; UI._msg = null;
  GAME.time = 0; WORLD.time = 0; GAME.caughtN = 0; GAME.room = null; GAME.stairLock = null;
  POST.shake = 0; POST.flash = 0;
  buildMansion();
  ONI.init();
  LIGHTS.init();
  const sp = MAN.areas.foyer.spawn;
  PLAYER.reset(new THREE.Vector3(sp.x, FLOORS.F1, sp.z), sp.yaw);
  if (save) {
    STORY.inv = save.inv.slice(); STORY.got = save.got.slice(); STORY.unlocked = save.unlocked.slice(); STORY.flags = JSON.parse(JSON.stringify(save.flags));
    applyState();
    PLAYER.reset(new THREE.Vector3(save.pos[0], save.pos[1], save.pos[2]), save.pos[3]);
    GAME.time = save.time || 0; GAME.caughtN = save.caught || 0;
    DIRECTOR.enabled = !!STORY.flags.libChase; DIRECTOR.cool = 60;
  } else STORY.flags.code = newCode();
  GAME.room = WORLD.roomAt(PLAYER.pos);
  UI.inv();
  $('fxBlack').style.transition = 'none'; $('fxBlack').style.opacity = 1; $('fxHide').style.opacity = 0;
  UI.show('hud'); UI.show('touch', IS_TOUCH);
  $('fps').style.display = SETTINGS.fps ? 'block' : 'none';
  GAME.state = 'play';
  if (GAME.amb) GAME.amb.stop(0.2);
  GAME.amb = LOOPS.ambience(); GAME.amb.setVol(0.8, 1);
  if (!IS_TOUCH) requestLock();
  const fadeIn = (s = 1.6) => { $('fxBlack').style.transition = `opacity ${s}s`; $('fxBlack').style.opacity = 0; };
  if (save) { setTimeout(() => fadeIn(), 60); if (GAME.room) UI.place(GAME.room.name); UI.hint('記録したところから再開', 2400); GAME.onEnterRoom(GAME.room, null, true); return; }
  // the opening: the four of them in the hall
  const fa = MAN.areas.foyer.friendsAt;
  const me = { x: MAN.areas.foyer.spawn.x, z: MAN.areas.foyer.spawn.z };
  ['takuro', 'mika', 'takeshi'].forEach((id, i) => CAST.place(id, fa[i][0], FLOORS.F1, fa[i][1], yawTo({ x: fa[i][0], z: fa[i][1] }, me)));
  PLAYER.yaw = 0; PLAYER.pitch = -0.05;
  setTimeout(() => fadeIn(2.0), 200);
  GAME.later(1.6, () => GAME.say([
    ['', '――町はずれの洋館。そこには「化け物が出る」という噂があった。'],
    ['たくろう', '中は、思ったよりきれいだな。'],
    ['たけし', 'な、なあ……やっぱり帰ろうぜ。'],
    ['みか', 'たけし、こわいの？'],
    ['たけし', 'こ、こわくねーよ！'],
    ['たくろう', 'せっかく来たんだ。ちょっと探検してみようぜ。'],
    ['ひろし', '化け物なんて、科学的にありえないよ。'],
  ], () => {
    SFX.crash(new THREE.Vector3(tm(37.4), FLOORS.F1 + 1, tm(-4.4))); POST.shake = 0.3;
    GAME.later(0.9, () => GAME.say([
      ['みか', 'きゃっ！　な、なに今の音……。'],
      ['たけし', 'ひっ……！'],
      ['ひろし', '右の奥……台所のほうからだ。ちょっと見てくるよ。'],
    ], () => { STORY.save(); UI.hint(IS_TOUCH ? '左側で移動・右側で視点・手のボタンで調べる' : 'WASD 移動 ・ Shift 走る ・ E / クリック 調べる', 4500); }));
  }));
};
GAME.onEnterRoom = function (r, via = null, quiet = false) {
  if (!r) return;
  if (!quiet) UI.place(r.name);
  const f = STORY.flags;
  // the others are gone once you come back from the dining room
  if (r.id === 'kitchen') { CAST.hide('takuro'); CAST.hide('mika'); CAST.hide('takeshi'); f.friendsLeft = true; }
  if (r.id === 'foyer' && f.friendsLeft && !f.friendsGone && f.plateLook) { f.friendsGone = true; GAME.later(0.5, () => GAME.say([['ひろし', '……あれ？　みんなは？'], ['ひろし', 'どこへ行ったんだろう……。']], () => STORY.save())); }
  if (r.id === 'library' && !f.glimpse && !quiet) EVENTS.libraryGlimpse();
  if (r.id === 'attic' && !f.takuro) EVENTS.takuroScene();
  if (r.id === 'kids') {
    if (!f.basementOpen) { const m = r.mikaAt, c = CAST.place('mika', m.x, FLOORS.F2, m.z, m.yaw); if (!c.m.userData.ia) { c.m.userData.ia = { dist: 2.5, prompt: () => 'みかに話しかける', use: () => EVENTS.mika() }; c.m.traverse(o => { if (o.isMesh) o.userData.iaRoot = c.m; }); r.interactables.push(c.m); } }
    else { CAST.hide('mika'); if (!f.kidsChase) EVENTS.kidsChase(); }
  } else if (r.id !== 'kids') CAST.hide('mika');
  if (r.id === 'takeshi' && !f.takeshiMet && !f.takeshiGone) {   // the closet shakes
    const h = MAN.tkCloset;
    h.prompt = () => (STORY.flags.takeshiGone ? 'クローゼットに隠れる' : 'クローゼットを調べる');
    h.use = () => (STORY.flags.takeshiGone ? GAME.enterHide(h) : EVENTS.takeshiCloset());
    const t0 = GAME.time;
    SFX.creak(h.cam, 0.3);
    animate(() => { if (GAME.room !== r || STORY.flags.takeshiMet || GAME.time - t0 > 6) { h.doors.forEach(d => (d.rotation.z = 0)); return false; } const k = Math.sin(GAME.time * 40) * 0.008 * (Math.sin(GAME.time * 3) > 0 ? 1 : 0); h.doors.forEach(d => (d.rotation.z = k)); return true; });
  }
  if (r.id === 'takeshi') { const h = MAN.tkCloset; h.prompt = () => (STORY.flags.takeshiGone ? 'クローゼットに隠れる' : 'クローゼットを調べる'); h.use = () => (STORY.flags.takeshiGone ? GAME.enterHide(h) : EVENTS.takeshiCloset()); }
  if (r.dark && !GAME.lighterOn && !quiet && MAN.candle.state !== 'on') GAME.later(0.3, () => UI.hint(GAME.canLight() ? '真っ暗だ……（ライターをつけよう）' : '真っ暗だ……', 2600));
  void via;
};
GAME.chapterEnd = function () {
  if (GAME.state !== 'play') return;
  GAME.state = 'ending'; PLAYER.frozen = true; ONI.despawn(true); MUSIC.stop(1.5);
  if (document.pointerLockElement) document.exitPointerLock();
  SFX.door(MAN.doors.corC_base.center, 1.0);
  $('fxBlack').style.transition = 'opacity 1.5s'; $('fxBlack').style.opacity = 1;
  const play = GAME.time, caught = GAME.caughtN || 0;
  store.set('cleared', (store.get('cleared', 0) || 0) + 1);
  setTimeout(() => {
    UI.show('hud', false); UI.show('touch', false); UI.show('end');
    if (GAME.amb) { GAME.amb.stop(1); GAME.amb = null; }
    const lines = ['ひろしは、暗い地下への階段を降りていった。', 'たけし、たくろう、みか……。みんなは、無事なのだろうか。', '本館　―　おしまい', '（地下・別館は、またいつか。）'];
    const box = $('endText'); box.innerHTML = '';
    lines.forEach((l, i) => { const p = document.createElement('div'); p.className = 'gl'; p.textContent = l; box.appendChild(p); setTimeout(() => p.classList.add('on'), 600 + i * 1900); });
    $('endStats').innerHTML = `プレイ時間 ${Math.floor(play / 60)}分${String(Math.floor(play % 60)).padStart(2, '0')}秒　/　つかまった回数 ${caught}回`;
    setTimeout(() => { $('endStats').style.opacity = 1; $('endBtns').style.opacity = 1; }, 600 + lines.length * 1900);
    MUSIC.play('guiding');
  }, 1700);
};

/* =========================================================================
   Main loop
   ========================================================================= */
let lastT = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const real = (now - lastT) / 1000, dt = Math.min(0.05, real); lastT = now;
  fpsAcc += real; fpsN++; if (fpsAcc > 0.5) { if (SETTINGS.fps) $('fps').textContent = Math.round(fpsN / fpsAcc) + ' fps'; fpsAcc = 0; fpsN = 0; }
  stepAnims();
  if (GAME.state !== 'play' && GAME.state !== 'ending') return;
  update(dt);
  if (composer) composer.render(dt); else renderer.render(scene, camera);
}
function update(dt) {
  if (GAME.state === 'play' && !GAME.paused) {
    if (!GAME.modal || GAME.cine) { GAME.time += dt; WORLD.time = GAME.time; }
    if (!GAME.modal) runTimers();
    PLAYER.update(dt);
    const r = PLAYER.alive && !GAME.busy ? WORLD.roomAt(PLAYER.pos) : null;
    if (r && r !== GAME.room) { GAME.room = r; GAME.onEnterRoom(r); }
    GAME.checkMoves();
    for (const rm of WORLD.rooms) for (const fn of rm.updaters) fn(dt, GAME.time);
    const wasOn = ONI.on;
    ONI.update(dt);
    if (wasOn && !ONI.on) EVENTS.afterChase();
    DIRECTOR.update(dt);
    CAST.update(dt);
    PARTICLES.update(dt);
    const chasing = ONI.on && (ONI.state === 'chase' || ONI.state === 'appear' || ONI.state === 'transit' || ONI.state === 'bars');
    if (chasing && ONI.state !== 'bars') { GAME.chaseFx = 1; MUSIC.play('aochase'); }
    else if (!ONI.on && MUSIC.cur && MUSIC.cur.name === 'aochase') { MUSIC.stop(3); GAME.chaseFx = 0; }
    else if (!ONI.on) GAME.chaseFx = 0;
  }
  PLAYER.applyCamera(dt);
  VIEW.update(dt);
  LIGHTS.update(dt, GAME.time);
  GAME.updateTarget();
  $('fxChase').style.opacity = GAME.chaseFx ? 1 : 0;
  $('fxHide').classList.toggle('dark', !!PLAYER.hidden && ONI.on);
  const dark = GAME.room && GAME.room.dark && MAN.candle && MAN.candle.state !== 'on';
  hemi.intensity = damp(hemi.intensity, dark ? 0.02 : 0.26, 3, dt); hemi.color.setHex(0xa4accc); hemi.groundColor.setHex(0x1a1410);
  scene.fog.color.setHex(0x040406); scene.fog.density = 0.026;
  $('fxVeil').style.opacity = GAME.state === 'play' && !PLAYER.hidden ? veilDark(camera.position, PLAYER.pos.y).toFixed(3) : 0;   // walking into a black screen edge
  renderer.toneMappingExposure = BASE_EXPOSURE * SETTINGS.bright * (1 + POST.flash * 2.5);
  POST.flash = Math.max(0, POST.flash - dt * 2.2);
  if (gradePass) { const u = gradePass.uniforms; u.time.value = GAME.time; u.grain.value = 0.05; u.aberr.value = GAME.chaseFx ? 0.0025 : 0; u.desat.value = 0.1; u.warp.value = 0; }
  if (AU.ok) {
    const L = AU.ctx.listener, p = camera.position, f = GAME.camDir;
    if (L.positionX) { L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z; L.forwardX.value = f.x; L.forwardY.value = f.y; L.forwardZ.value = f.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(p.x, p.y, p.z); L.setOrientation(f.x, f.y, f.z, 0, 1, 0); }
  }
}

/* =========================================================================
   Boot
   ========================================================================= */
/* 3dgame home screen settings: 横画面 (rotate the stage), sound on/off, volume, look sensitivity */
function applyHome(S) {
  if (!S || typeof S !== 'object') return;
  if (typeof S.land === 'boolean' && S.land !== ROT.on) { ROT.on = S.land; onResize(); }
  if (typeof S.sound === 'boolean' || typeof S.vol === 'number') {
    HUB.vol = S.sound === false ? 0 : clamp(typeof S.vol === 'number' ? S.vol : HUB.vol, 0, 1);
    AU.setVolume(SETTINGS.volume * HUB.vol);
  }
  if (typeof S.sens === 'number') HUB.sens = clamp(S.sens, 0.4, 2.2);
}
function boot() {
  if (HUB.embedded) {
    try { applyHome(JSON.parse(localStorage.getItem('3dame-settings'))); } catch (e) { /* no saved home settings */ }
    addEventListener('message', e => { if (e.data && e.data.h3dSet) applyHome(e.data.h3dSet); });
  }
  onResize();
  VIEW.init();
  if (IS_TOUCH) setupTouch();
  $('msg').addEventListener('click', e => { e.stopPropagation(); AU.resume(); UI.msgNext(); });
  $('bNew').onclick = () => GAME.start();
  $('bCont').onclick = () => { const s = store.get('save', null); if (s && s.v === 2) GAME.start(s); else GAME.start(); };
  $('bSettings').onclick = () => UI.settings();
  $('bHow').onclick = () => UI.show('how');
  $('hBack').onclick = () => UI.show('how', false);
  $('pResume').onclick = () => UI.resume();
  $('pSettings').onclick = () => { UI.show('pause', false); UI.settings(() => UI.show('pause')); };
  $('pQuit').onclick = () => { GAME.paused = false; UI.show('pause', false); AU.resume(); ONI.reset(); WORLD.reset(); UI.title(); };
  $('oCont').onclick = () => { const s = store.get('save', null); if (s) GAME.start(s); };
  $('oTitle').onclick = () => { ONI.reset(); WORLD.reset(); UI.title(); };
  $('eTitle').onclick = () => { $('endStats').style.opacity = 0; $('endBtns').style.opacity = 0; ONI.reset(); WORLD.reset(); UI.title(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden && GAME.state === 'play') UI.pause(); });
  UI.title();
  requestAnimationFrame(frame);
}
boot();
window.__AO = { GAME, STORY, ONI, DIRECTOR, MAN, WORLD, PLAYER, UI, EVENTS, SFX, MUSIC, AU, CAST, camera, scene, POST, INPUT, LIGHTS, THREE, TILE: T, FLOORS, navPath, nearestNode, cellOf, stairPoint, veilDark, renderer: () => renderer, sim: (sec, step = 1 / 30) => { for (let t = 0; t < sec; t += step) { update(step); stepAnims(); } } };
