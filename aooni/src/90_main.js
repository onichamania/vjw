
/* =========================================================================
   Story: what you carry, what has happened, the scripted scenes, saving
   ========================================================================= */
const STORY = {
  inv: [], got: [], unlocked: [], flags: {}, busy: false,
  reset() { this.inv = []; this.got = []; this.unlocked = []; this.flags = {}; this.busy = false; },
  has(id) { return this.inv.includes(id); },
  hasGot(id) { return this.got.includes(id); },
  give(id) { if (!this.got.includes(id)) this.got.push(id); if (!this.inv.includes(id)) this.inv.push(id); UI.inv(); },
  use(id) { this.inv = this.inv.filter(x => x !== id); UI.inv(); },
  unlock(id) { if (!this.unlocked.includes(id)) this.unlocked.push(id); },
  save() {
    const h = PLAYER.hidden, p = h ? h.exitP : PLAYER.pos;
    store.set('save', { v: 1, inv: this.inv, got: this.got, unlocked: this.unlocked, flags: this.flags, pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +PLAYER.yaw.toFixed(2)], time: Math.round(GAME.time), caught: GAME.caughtN || 0 });
  },
  event(name) { if (EVENTS[name]) EVENTS[name](); },
  takeshi(h) { EVENTS.takeshi(h); },
};
// a timeline that follows game time (so it stops while paused)
GAME.timers = [];
GAME.later = (sec, fn) => GAME.timers.push({ at: GAME.time + sec, fn });
function runTimers() {
  for (const t of GAME.timers.slice()) if (GAME.time >= t.at) { GAME.timers.splice(GAME.timers.indexOf(t), 1); t.fn(); }
}
function faceYaw(from, to) { return Math.atan2(to.x - from.x, to.z - from.z); }
const EVENTS = {
  // taking the stair key: it is standing in the corner of the library
  libraryOni() {
    STORY.flags.libraryOni = true;
    const x = 3.0, z = -19.35;
    ONI.spawn(x, z, FL.F1, faceYaw({ x, z }, PLAYER.pos), 'appear'); ONI.appearFor = 2.1;
    SFX.oniSpot(); POST.shake = 0.4;
    UI.hint('…………！？', 1800);
    DIRECTOR.enabled = true; DIRECTOR.cool = 999;
  },
  // the front-door key in the jail: it comes out of the dark at the far end
  jailOni() {
    STORY.flags.jailOni = true;
    const x = -24.8, z = -2.6;
    ONI.despawn(true);
    ONI.spawn(x, z, FL.B1, faceYaw({ x, z }, PLAYER.pos), 'appear'); ONI.appearFor = 1.3;
    SFX.oniSpot(); UI.hint('…………！！', 1600);
    DIRECTOR.enabled = true; DIRECTOR.finale = true; DIRECTOR.cool = 999;
  },
  // the changing room: footsteps in the hall, it comes in, searches, bends down to your locker, and goes
  lockerScene() {
    if (STORY.flags.lockerScene || ONI.on) return;
    STORY.busy = true;
    const steps = [-13, -11.5, -10, -8.5, -7];
    GAME.later(2.2, () => SFX.door(new THREE.Vector3(-9, FL.F2 + 1.1, -23), 0.8));
    steps.forEach((x, i) => GAME.later(3.2 + i * 0.75, () => SFX.oniStep(new THREE.Vector3(x, FL.F2, -21.5), 0.75)));
    GAME.later(3.4, () => UI.hint('……足音が近づいてくる！　ロッカーに隠れろ！', 4200));
    GAME.later(7.6, () => {
      if (!PLAYER.alive || ONI.on) { STORY.busy = false; return; }
      STORY.flags.lockerScene = true; STORY.busy = false;
      const door = MAN.byId.cor2_lock, out = new THREE.Vector3(door.na.x, door.na.y, door.na.z);
      ONI.spawn(-5.5, -21.5, FL.F2, Math.PI / 2, 'script');
      const mine = () => (PLAYER.hidden && PLAYER.hidden.type === 'locker' && PLAYER.hidden.room === MAN.rooms.lockers ? PLAYER.hidden : null);
      ONI.script = { i: 0, steps: [
        { t: 'go', p: out, sp: 2.0 },
        { t: 'go', p: new THREE.Vector3(0, FL.F2, -25.4), sp: 1.6 },
        { t: 'look', d: 2.6 },
        { t: 'go', p: new THREE.Vector3(-1.0, FL.F2, -28.6), sp: 1.5 },
        { t: 'look', d: 1.4 },
        { t: 'peek', h: mine },
        { t: 'look', d: 1.2 },
        { t: 'go', p: new THREE.Vector3(0, FL.F2, -25.2), sp: 1.8 },
        { t: 'go', p: out, sp: 2.0 },
        { t: 'go', p: new THREE.Vector3(-9.5, FL.F2, -21.5), sp: 2.2 },
        { t: 'gone', fn: () => { UI.hint('……行ったみたいだ', 2600); DIRECTOR.cool = 80; STORY.save(); } },
      ] };
    });
  },
  takeshi(h) {
    const first = !STORY.flags.takeshi;
    SFX.closet(h.cam, true);
    h.doors.forEach((d, i) => { d.rotation.y = d.userData.baseRy + (i === 0 ? -1.2 : 1.2); });
    TAKESHI.show(h);
    const lines = first ? [
      ['たけし', 'う、うわあああっ！！'], ['たけし', '……な、なんだ、ひろしかよ。おどかすなって……。'],
      ['たけし', 'み、見たんだよ！　青くて、でっかい頭の化け物！'], ['たけし', '俺はここから一歩も出ないからな！'],
      ['ひろし', '……たくろうとみかは？'], ['たけし', '知らねえよ……。そういえば、たくろうが「地下がある」とか言ってたような……。'],
      ['ひろし', '（……2階のどこかにも、何か手がかりがあるかもしれない）'],
    ] : [['たけし', 'お、俺はここにいるからな……。早く出口を見つけてくれよ……。']];
    STORY.flags.takeshi = true;
    GAME.say(lines, () => { TAKESHI.hide(); h.doors.forEach(d => { d.rotation.y = d.userData.baseRy; }); SFX.closet(h.cam, false); STORY.save(); });
  },
};
// Takeshi, crouched in the bedroom wardrobe
const TAKESHI = {
  g: null,
  build() {
    const g = new THREE.Group(), M = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
    const skin = M(0xe8c4a0, 0.6), hair = M(0x2a1a10, 0.5), shirt = M(0x2f5f9a), pants = M(0x2a2a30), white = M(0xffffff, 0.3), black = M(0x080808, 0.2);
    const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o; };
    const sph = new THREE.SphereGeometry(1, 16, 12);
    add(sph, skin, 0, 1.12, 0, 0.13, 0.15, 0.13);
    add(sph, hair, 0, 1.19, -0.02, 0.14, 0.12, 0.14);
    for (const s of [-1, 1]) { add(sph, white, s * 0.045, 1.13, 0.115, 0.03, 0.025, 0.012); add(sph, black, s * 0.045, 1.13, 0.125, 0.012, 0.014, 0.008); }
    add(new THREE.BoxGeometry(0.36, 0.42, 0.22), shirt, 0, 0.78, 0);
    for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.1, 0.36, 0.1), shirt, s * 0.24, 0.8, 0.08).rotation.x = -0.6; add(new THREE.BoxGeometry(0.13, 0.12, 0.42), pants, s * 0.1, 0.5, 0.12); add(new THREE.BoxGeometry(0.12, 0.42, 0.12), pants, s * 0.1, 0.28, 0.3); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  },
  show(h) {
    if (!this.g) { this.g = this.build(); scene.add(this.g); }
    const p = h.room.toWorld(h.F.x, 0, h.F.z); this.g.position.set(p.x, p.y + 0.02, p.z); this.g.rotation.y = h.F.ry; this.g.visible = true;
    this.g.position.addScaledVector(tmpV.set(Math.sin(h.F.ry), 0, Math.cos(h.F.ry)), -0.12);
  },
  hide() { if (this.g) this.g.visible = false; },
};

/* =========================================================================
   UI
   ========================================================================= */
const MELODY = [64, 67, 69, 67, 64, 62];   // ミ ソ ラ ソ ミ レ
const SOLFA = { 60: 'ド', 62: 'レ', 64: 'ミ', 65: 'ファ', 67: 'ソ', 69: 'ラ', 71: 'シ', 72: 'ド' };
// a staff with note heads (treble clef, C4 .. C5; a black key gets a sharp)
function staffSvg(notes, opt = {}) {
  const W = 520, H = 120, top = 30, gap = 12, bottom = top + gap * 4, x0 = 92, dx = (W - x0 - 30) / 6;
  const STEP = { 60: [0, 0], 61: [0, 1], 62: [1, 0], 63: [1, 1], 64: [2, 0], 65: [3, 0], 66: [3, 1], 67: [4, 0], 68: [4, 1], 69: [5, 0], 70: [5, 1], 71: [6, 0], 72: [7, 0] };
  let s = `<svg viewBox="0 0 ${W} ${H}">`;
  for (let i = 0; i < 5; i++) s += `<line x1="10" x2="${W - 10}" y1="${top + i * gap}" y2="${top + i * gap}" stroke="#3a2f20" stroke-width="1.4"/>`;
  s += `<text x="14" y="${bottom + 10}" font-size="64" font-family="serif" fill="#2a2216">𝄞</text>`;
  if (opt.label) s += `<text x="${W - 12}" y="16" font-size="13" text-anchor="end" fill="#6a5a40" font-family="sans-serif">${opt.label}</text>`;
  notes.forEach((n, i) => {
    const [k, sharp] = STEP[n] || [0, 0], x = x0 + i * dx + dx / 2, y = bottom - (k - 2) * gap / 2, col = opt.colors ? opt.colors[i] : '#1a140c';
    if (k === 0) s += `<line x1="${x - 14}" x2="${x + 14}" y1="${y}" y2="${y}" stroke="#3a2f20" stroke-width="1.4"/>`;
    if (sharp) s += `<text x="${x - 26}" y="${y + 6}" font-size="18" fill="${col}" font-family="serif">♯</text>`;
    s += `<ellipse cx="${x}" cy="${y}" rx="8.5" ry="6.2" transform="rotate(-20 ${x} ${y})" fill="${col}"/><line x1="${x + 7.6}" x2="${x + 7.6}" y1="${y}" y2="${y - 34}" stroke="${col}" stroke-width="1.6"/>`;
  });
  return s + '</svg>';
}
const UI = {
  show(id, on = true) { $(id).classList.toggle('hidden', !on); },
  hint(text, ms = 2600) { const h = $('hint'); h.textContent = text; h.classList.add('on'); clearTimeout(h._t); h._t = setTimeout(() => h.classList.remove('on'), ms); },
  toast(text) { const t = document.createElement('div'); t.className = 'toastItem'; t.textContent = text; $('toast').appendChild(t); setTimeout(() => t.remove(), 4000); },
  place(name) { const p = $('place'); p.textContent = name; p.style.transition = 'opacity .3s'; p.style.opacity = 1; clearTimeout(p._t); p._t = setTimeout(() => { p.style.transition = 'opacity 1.4s'; p.style.opacity = 0; }, 2200); },
  inv() {
    const el = $('inv'); el.innerHTML = '';
    for (const id of STORY.inv) {
      const d = ITEMS[id], it = document.createElement('div');
      it.className = 'it' + (id === 'sheet' ? ' view' : '');
      it.innerHTML = (d.icon === 'paper' ? ICONS.hint : ICONS.key.replace(/#e7c264/g, d.color)) + `<span>${d.name}</span>`;
      if (id === 'sheet') { const open = e => { e.preventDefault(); e.stopPropagation(); UI.sheet(); }; it.addEventListener('click', open); it.addEventListener('touchstart', open, { passive: false }); }
      el.appendChild(it);
    }
  },
  /* the message window */
  message(lines, done) {
    const M = UI._msg = { lines, i: -1, done, shown: 0, full: '', t0: 0 };
    GAME.modal = { msg: true };
    UI.show('msg'); UI.msgNext();
    animate(() => {
      if (UI._msg !== M) return false;
      if (M.shown < M.full.length) { M.shown = Math.min(M.full.length, Math.floor((performance.now() - M.t0) / 1000 * 38)); $('msgText').textContent = M.full.slice(0, M.shown); $('msgNext').style.visibility = M.shown >= M.full.length ? 'visible' : 'hidden'; }
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
    const [name, text] = M.lines[M.i];
    $('msgName').textContent = name; M.full = text; M.shown = 0; M.t0 = performance.now(); $('msgText').textContent = ''; $('msgNext').style.visibility = 'hidden';
    if (AU.ok) AU.burst({ dur: 0.02, f: 3200, q: 2, vol: 0.06, rev: 0 });
  },
  closeModal() { $('modal').classList.add('hidden'); $('modal').innerHTML = ''; const m = GAME.modal; GAME.modal = null; if (m && m.onClose) m.onClose(); if (!IS_TOUCH && GAME.state === 'play' && PLAYER.alive) requestLock(); },
  openModal(html, opts = {}) {
    const m = $('modal'); m.innerHTML = html; m.classList.remove('hidden');
    GAME.modal = opts;
    if (document.pointerLockElement) document.exitPointerLock();
    m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => UI.closeModal()));
    return m;
  },
  sheet() {
    if (GAME.modal || !STORY.has('sheet')) return;
    UI.openModal(`<div class="sheet"><button class="close" data-close>×</button><h3>― 楽譜 ―</h3>${staffSvg(MELODY)}<div class="note">古い楽譜。音符が6つだけ書いてある。裏に「ピアノの部屋」と走り書きがある。</div></div>`);
    SFX.paper && SFX.paper();
  },
  piano() {
    if (STORY.flags.pianoSolved) return;
    if (!STORY.has('sheet')) { GAME.say([['ひろし', '古いグランドピアノだ。……楽譜があれば、何か弾けるかもしれない。']]); return; }
    const played = [];
    const whites = [60, 62, 64, 65, 67, 69, 71, 72], blacks = [[61, 1], [63, 2], [66, 4], [68, 5], [70, 6]];
    const keysHtml = whites.map(n => `<div class="w" data-n="${n}">${SOLFA[n]}</div>`).join('') + blacks.map(([n, i]) => `<div class="b" data-n="${n}" style="left:${i / 8 * 100}%"></div>`).join('');
    const m = UI.openModal(`<div class="piano"><button class="close" data-close>×</button><div class="staffs"><div id="pSheet">${staffSvg(MELODY, { label: '楽譜' })}</div><div id="pPlay"></div></div><div class="keys">${keysHtml}</div><div class="msgline">楽譜のとおりに弾いてみよう（PC：A〜K が白鍵、W E T Y U が黒鍵）</div></div>`, {
      key(e) { const map = { KeyA: 60, KeyW: 61, KeyS: 62, KeyE: 63, KeyD: 64, KeyF: 65, KeyT: 66, KeyG: 67, KeyY: 68, KeyH: 69, KeyU: 70, KeyJ: 71, KeyK: 72 }; if (map[e.code] && !e.repeat) press(map[e.code]); },
    });
    const draw = () => {
      const cols = played.map((n, i) => (n === MELODY[i] ? '#1a3a9a' : '#9a1a1a'));
      $('pPlay').innerHTML = staffSvg(played, { label: 'あなたの演奏', colors: cols });
    };
    let done = false;
    const press = n => {
      if (done) return;
      SFX.piano(n);
      const el = m.querySelector(`[data-n="${n}"]`); if (el) { el.classList.add('down'); setTimeout(() => el.classList.remove('down'), 160); }
      played.push(n); if (played.length > 6) played.splice(0, played.length - 6);
      draw();
      if (played.length === 6 && played.every((x, i) => x === MELODY[i])) {
        done = true;
        setTimeout(() => {
          UI.closeModal(); STORY.flags.pianoSolved = true; MAN.pianoDrawer.locked = false;
          SFX.unlock(MAN.pianoDrawer.room.toWorld(MAN.pianoDrawer.base.x, MAN.pianoDrawer.base.y, MAN.pianoDrawer.base.z));
          STORY.save();
          GAME.say([['', '……カチッ。'], ['ひろし', 'どこかで鍵の開く音がした。……あの小さな棚かな？']]);
        }, 900);
      }
    };
    m.querySelectorAll('.keys [data-n]').forEach(k => {
      const go = e => { e.preventDefault(); e.stopPropagation(); AU.resume(); press(+k.dataset.n); };
      k.addEventListener('mousedown', go); k.addEventListener('touchstart', go, { passive: false });
    });
    draw();
  },
  pause() {
    if (GAME.state !== 'play' || GAME.paused || !PLAYER.alive || GAME.modal || GAME.cine || !$('pause').classList.contains('hidden')) return;
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
    GAME.room = null; ONI.reset(); UI._msg = null; GAME.modal = null; GAME.cine = null;
    $('fxBlack').style.transition = 'opacity .6s'; $('fxBlack').style.opacity = 0; $('fxWhite').style.opacity = 0;
  },
  over() {
    GAME.state = 'over';
    UI.show('hud', false); UI.show('touch', false); UI.show('msg', false);
    const o = $('over'); UI.show('over'); o.classList.remove('show'); void o.offsetWidth; o.classList.add('show');
    $('overSub').innerHTML = '青鬼につかまってしまった……<br><small>隠れるところを見られないように。逃げきれないときは、部屋を移ってロッカーやタンスへ。</small>';
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
  ONI.reset(); WORLD.reset(); PARTICLES.clear(); MUSIC.stop(0.3); TAKESHI.hide();
  STORY.reset(); DIRECTOR.reset(); GAME.timers = []; GAME.modal = null; GAME.cine = null; GAME.paused = false; GAME.chaseFx = 0; UI._msg = null;
  GAME.time = 0; WORLD.time = 0; GAME.caughtN = 0; GAME.room = null;
  POST.shake = 0; POST.flash = 0;
  buildMansion();
  ONI.init();
  LIGHTS.init();
  LIGHTS.lighter.color.setHex(0xd8dcff); LIGHTS.lighter.distance = 7;
  const sp = MAN.rooms.hall.spawn;
  PLAYER.reset(new THREE.Vector3(sp.x, FL.F1, sp.z), sp.yaw);
  if (save) {
    STORY.inv = save.inv.slice(); STORY.got = save.got.slice(); STORY.unlocked = save.unlocked.slice(); STORY.flags = Object.assign({}, save.flags);
    for (const id of STORY.got) { const m = MAN.props[id]; if (m && m.parent) m.parent.remove(m); }
    for (const id of STORY.unlocked) { const d = MAN.byId[id]; if (d) d.locked = null; }
    if (STORY.flags.pianoSolved) MAN.pianoDrawer.locked = false;
    PLAYER.reset(new THREE.Vector3(save.pos[0], save.pos[1], save.pos[2]), save.pos[3]);
    GAME.time = save.time || 0; GAME.caughtN = save.caught || 0;
    DIRECTOR.enabled = STORY.hasGot('k_stairs'); DIRECTOR.finale = STORY.hasGot('k_front'); DIRECTOR.cool = DIRECTOR.finale ? 25 : 45;
  }
  UI.inv();
  $('fxBlack').style.transition = 'none'; $('fxBlack').style.opacity = 1; $('fxHide').style.opacity = 0; $('fxWhite').style.opacity = 0;
  UI.show('hud'); UI.show('touch', IS_TOUCH);
  $('fps').style.display = SETTINGS.fps ? 'block' : 'none';
  GAME.state = 'play';
  if (GAME.amb) GAME.amb.stop(0.2);
  GAME.amb = LOOPS.ambience(); GAME.amb.setVol(0.8, 1);
  if (!IS_TOUCH) requestLock();
  const fadeIn = () => { $('fxBlack').style.transition = 'opacity 1.6s'; $('fxBlack').style.opacity = 0; };
  if (save) { setTimeout(fadeIn, 60); UI.hint('記録したところから再開', 2400); return; }
  // the opening, in the dark
  GAME.say([
    ['', '――町はずれの丘の上に、古い洋館がある。'],
    ['', 'そこには「化け物が出る」という噂があった。'],
    ['たけし', 'ここが例の屋敷か……。なあ、ちょっと入ってみようぜ。'],
    ['ひろし', '勝手に入ったらまずいよ。'],
    ['たくろう', '平気だって。誰も住んでないんだからさ。'],
    ['みか', 'ねえ……やっぱりやめない？'],
  ], () => {
    SFX.slam(new THREE.Vector3(0, 1.2, 0.2)); POST.shake = 0.6;
    GAME.later(0.6, () => GAME.say([
      ['たけし', 'うわっ！　ド、ドアが勝手に閉まったぞ！'],
      ['みか', '……開かない！　どうして！？'],
    ], () => {
      SFX.crash(new THREE.Vector3(-11.8, 1, -17.6));
      GAME.later(1.0, () => GAME.say([
        ['たくろう', '……今の音、台所のほうからだな。俺、ちょっと見てくる。'],
        ['たけし', 'お、おい待てよ！　置いてくなって！'],
        ['', '――足音が遠ざかっていく。気がつくと、ひろしはひとりになっていた。'],
      ], () => {
        fadeIn(); UI.place('玄関ホール');
        GAME.later(2.0, () => GAME.say([['ひろし', '……みんな、どこへ行ったんだろう。'], ['ひろし', '屋敷を調べて、ここから出る方法を探そう。']], () => {
          STORY.save();
          UI.hint(IS_TOUCH ? '左側で移動・右側で視点・手のボタンで調べる' : 'WASD 移動 ・ Shift 走る ・ E / クリック 調べる', 4500);
        }));
      }));
    }));
  });
};
GAME.onEnterRoom = function (r) {
  UI.place(r.name);
  if (r.id === 'lockers' && !STORY.flags.lockerScene && STORY.hasGot('k_stairs') && !ONI.on && !STORY.busy) EVENTS.lockerScene();
  if (r.id === 'kitchen' && !STORY.flags.kitchenSeen) { STORY.flags.kitchenSeen = true; GAME.later(0.6, () => GAME.say([['ひろし', 'たくろう……？　いないのか……？']])); }
  if (r.id === 'jail' && !STORY.flags.jailSeen) { STORY.flags.jailSeen = true; GAME.later(0.5, () => GAME.say([['ひろし', '……牢屋？　どうして屋敷の地下にこんなものが……。']])); }
};
GAME.escape = function () {
  if (GAME.state !== 'play') return;
  GAME.state = 'ending'; PLAYER.frozen = true; ONI.despawn(true); MUSIC.stop(1.5);
  if (document.pointerLockElement) document.exitPointerLock();
  const fr = MAN.byId.front; fr.locked = null; setDoorOpen(fr, true, PLAYER.pos); SFX.door(fr.center, 1.2);
  $('fxWhite').style.opacity = 1;
  const play = GAME.time, caught = GAME.caughtN || 0;
  store.set('save', null); store.set('cleared', (store.get('cleared', 0) || 0) + 1);
  setTimeout(() => {
    UI.show('hud', false); UI.show('touch', false); UI.show('end');
    if (GAME.amb) { GAME.amb.stop(1); GAME.amb = null; }
    const lines = ['ひろしは、青鬼の屋敷から脱出した。', '……けれど、たけしも、たくろうも、みかも、まだ屋敷の中にいる。', '夜が明けたら、きっと助けに戻ろう。', '― 青鬼 3D ・ おしまい ―'];
    const box = $('endText'); box.innerHTML = '';
    lines.forEach((l, i) => { const p = document.createElement('div'); p.className = 'gl'; p.textContent = l; box.appendChild(p); setTimeout(() => p.classList.add('on'), 600 + i * 1900); });
    $('endStats').innerHTML = `プレイ時間 ${Math.floor(play / 60)}分${String(Math.floor(play % 60)).padStart(2, '0')}秒　/　つかまった回数 ${caught}回`;
    setTimeout(() => { $('endStats').style.opacity = 1; $('endBtns').style.opacity = 1; $('fxWhite').style.opacity = 0; }, 600 + lines.length * 1900);
    MUSIC.play('guiding');
  }, 1900);
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
    if (!GAME.modal || !GAME.modal.msg || GAME.cine) { GAME.time += dt; WORLD.time = GAME.time; }
    if (!GAME.modal) runTimers();
    PLAYER.update(dt);
    const r = PLAYER.alive ? WORLD.roomAt(PLAYER.pos) : null;
    if (r && r !== GAME.room) { GAME.room = r; GAME.onEnterRoom(r); }
    updateDoors(dt);
    for (const rm of WORLD.rooms) for (const fn of rm.updaters) fn(dt, GAME.time);
    ONI.update(dt);
    DIRECTOR.update(dt);
    PARTICLES.update(dt);
    // the chase: music and a blue edge while it is after you
    const chasing = ONI.on && ONI.state === 'chase';
    if (chasing) { GAME.chaseFx = 1; MUSIC.play('aochase'); }
    else if (ONI.on && ONI.state === 'appear') MUSIC.play('aochase');
    else if (MUSIC.cur && MUSIC.cur.name === 'aochase' && (!ONI.on || ONI.state === 'leave')) { MUSIC.stop(3); GAME.chaseFx = 0; }
    else if (!ONI.on) GAME.chaseFx = 0;
  }
  PLAYER.applyCamera(dt);
  LIGHTS.update(dt, GAME.time);
  LIGHTS.lighter.intensity = GAME.state === 'play' ? 0.9 : 0;
  GAME.updateTarget();
  $('fxChase').style.opacity = GAME.chaseFx ? 1 : 0;
  hemi.intensity = 0.3; hemi.color.setHex(0x9aa6d6); hemi.groundColor.setHex(0x1a1410);
  scene.fog.density = 0.032;
  renderer.toneMappingExposure = BASE_EXPOSURE * SETTINGS.bright * (1 + POST.flash * 2.5);
  POST.flash = Math.max(0, POST.flash - dt * 2.2);
  if (gradePass) { const u = gradePass.uniforms; u.time.value = GAME.time; u.grain.value = 0.05; u.aberr.value = GAME.chaseFx ? 0.0025 : 0; u.desat.value = 0.12; u.warp.value = 0; }
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
  if (IS_TOUCH) setupTouch();
  $('msg').addEventListener('click', e => { e.stopPropagation(); AU.resume(); UI.msgNext(); });
  $('bNew').onclick = () => GAME.start();
  $('bCont').onclick = () => { const s = store.get('save', null); if (s) GAME.start(s); };
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
window.__AO = { GAME, STORY, ONI, DIRECTOR, MAN, WORLD, PLAYER, UI, EVENTS, SFX, MUSIC, AU, camera, scene, POST, INPUT, LIGHTS, THREE, navPath, nearestNode, setDoorOpen, renderer: () => renderer, sim: (sec, step = 1 / 30) => { for (let t = 0; t < sec; t += step) { update(step); stepAnims(); } } };
