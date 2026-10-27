
/* =========================================================================
   The blue oni: model, animation, chase on the waypoint graph, searching
   hiding places (and peeking through a locker's louvres), and the catch
   ========================================================================= */
function makeOniModel() {
  const skin = new THREE.MeshStandardMaterial({ color: 0x2c4cff, roughness: 0.55, emissive: 0x0a1c8a, emissiveIntensity: 0.55 });
  const skinD = new THREE.MeshStandardMaterial({ color: 0x2038d0, roughness: 0.6, emissive: 0x081670, emissiveIntensity: 0.5 });
  const lipM = new THREE.MeshStandardMaterial({ color: 0x1a2ab8, roughness: 0.4, emissive: 0x060f60, emissiveIntensity: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.2, emissive: 0xb8b8b8, emissiveIntensity: 0.75 });
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const mouthM = new THREE.MeshStandardMaterial({ color: 0x14020a, roughness: 0.8 });
  const S = (r, sx, sy, sz, m, x = 0, y = 0, z = 0, seg = 18) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7 | 0)), m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.castShadow = true; return o; };
  const C = (rt, rb, h, m, y) => { const g = new THREE.CylinderGeometry(rt, rb, h, 14); g.translate(0, -h / 2, 0); const o = new THREE.Mesh(g, m); o.position.y = y; o.castShadow = true; return o; };
  // proportions after the original: a head nearly a third of its height on a short, hunched body with long arms
  const root = new THREE.Group(), hips = new THREE.Group(); hips.position.y = 0.72; root.add(hips);
  hips.add(S(1, 0.3, 0.2, 0.22, skin, 0, 0.02, 0));
  const torso = new THREE.Group(); hips.add(torso);
  torso.add(S(1, 0.34, 0.4, 0.25, skin, 0, 0.36, 0, 22));        // one rounded trunk
  torso.add(S(1, 0.36, 0.17, 0.24, skin, 0, 0.6, -0.01, 18));     // shoulders
  const head = new THREE.Group(); head.position.y = 0.62; torso.add(head);
  head.add(S(1, 0.42, 0.5, 0.4, skin, 0, 0.4, 0, 28));            // the huge head
  head.add(S(1, 0.33, 0.22, 0.32, skin, 0, 0.14, 0.04, 20));      // jaw
  for (const s of [-1, 1]) head.add(S(1, 0.05, 0.11, 0.08, skinD, s * 0.41, 0.42, 0));   // ears
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 0.155, 0.5, 0.3); head.add(e);
    e.add(S(0.125, 1, 1.12, 0.6, white, 0, 0, 0, 22));
    const piv = new THREE.Group(); e.add(piv);
    piv.add(S(0.028, 1, 1, 0.45, black, 0, 0, 0.074, 12));
    eyes.push(piv);
  }
  head.add(S(1, 0.05, 0.045, 0.045, skinD, 0, 0.34, 0.39));       // nose
  const mouth = new THREE.Group(); mouth.position.set(0, 0.2, 0.34); head.add(mouth);
  const upLip = S(1, 0.2, 0.04, 0.065, lipM, 0, 0.018, 0), loLip = S(1, 0.18, 0.048, 0.065, lipM, 0, -0.03, -0.005), inner = S(1, 0.17, 0.07, 0.03, mouthM, 0, -0.005, -0.018);
  inner.scale.y = 0.002; mouth.add(upLip, loLip, inner);
  for (let i = -3; i <= 3; i++) { const t = S(1, 0.02, 0.024, 0.012, white, i * 0.04, 0.012, 0.012, 6); t.visible = false; mouth.add(t); }
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.37, 0.58, 0); torso.add(sh);
    sh.add(S(1, 0.13, 0.13, 0.13, skin));
    sh.add(C(0.095, 0.08, 0.5, skin, 0));
    const el = new THREE.Group(); el.position.y = -0.5; sh.add(el);
    el.add(C(0.08, 0.065, 0.46, skin, 0));
    el.add(S(1, 0.085, 0.13, 0.06, skinD, 0, -0.52, 0.01));
    arms.push({ sh, el, s });
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const hp = new THREE.Group(); hp.position.set(s * 0.15, -0.02, 0); hips.add(hp);
    hp.add(C(0.13, 0.1, 0.36, skin, 0));
    const kn = new THREE.Group(); kn.position.y = -0.36; hp.add(kn);
    kn.add(C(0.095, 0.08, 0.31, skin, 0));
    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.27), skinD); ft.position.set(0, -0.33, 0.06); kn.add(ft);
    legs.push({ hp, kn, s });
  }
  root.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  return { root, hips, torso, head, eyes, mouth, upLip, loLip, inner, arms, legs, teeth: mouth.children.slice(3) };
}

const ONI = {
  on: false, m: null, pos: new THREE.Vector3(), yaw: 0, state: 'off', vel: 0, phase: 0, bend: 0, bendT: 0, mouthT: 0,
  path: null, pi: 0, repathT: 0, goal: null, lastSeen: new THREE.Vector3(), trackT: 0, chaseT: 0, seenT: -99, sawHide: null,
  script: null, sub: 0, waitT: 0, stuckT: 0, ghostT: 0, stepAcc: 0, breathT: 0, hbT: 0, lastPos: new THREE.Vector3(), leaveT: 0, armsUp: 0,
  init() {
    if (this.m) return;
    this.m = makeOniModel(); this.m.root.visible = false; scene.add(this.m.root);
  },
  reset() { this.despawn(true); },
  eye() { return tmpV3.set(this.pos.x, this.pos.y + 1.84 - this.bend * 0.45, this.pos.z); },
  spawn(x, z, y, yaw, state = 'chase') {
    this.init();
    this.on = true; this.pos.set(x, y, z); this.yaw = yaw; this.state = state; this.vel = 0; this.bend = 0; this.bendT = 0; this.armsUp = 0;
    this.path = null; this.repathT = 0; this.trackT = 12; this.chaseT = 0; this.sawHide = null; this.script = null; this.waitT = 0; this.leaveT = 0;
    this.lastSeen.copy(PLAYER.pos); this.lastPos.copy(this.pos); this.stuckT = 0; this.ghostT = 0;
    this.m.root.visible = true; this.place();
  },
  despawn(quiet = false) {
    this.on = false; this.state = 'off';
    if (this.m) this.m.root.visible = false;
    if (!quiet) DIRECTOR.onGone();
  },
  place() {
    const m = this.m; m.root.position.copy(this.pos); m.root.rotation.y = this.yaw;
  },
  /* can it see the player? (chasing it looks all around; otherwise only ahead) */
  canSee(cone = true) {
    if (!PLAYER.alive || PLAYER.hidden) return false;
    const p = PLAYER.pos, dx = p.x - this.pos.x, dz = p.z - this.pos.z, d = Math.hypot(dx, dz);
    if (d > 24 || Math.abs(p.y - this.pos.y) > 2.2) return false;
    if (cone && d > 1.5) { const a = Math.atan2(dx, dz); if (Math.abs(angDiff(this.yaw, a)) > 1.25) return false; }
    const a = this.eye().clone(), b = tmpV2.set(p.x, p.y + 1.5, p.z);
    return !WORLD.blocked(a, b);
  },
  seenByPlayer() {
    const e = this.eye().clone(), c = camera.position, d = e.distanceTo(c);
    if (d > 16) return false;
    if (WORLD.blocked(c.clone(), e)) return false;
    tmpV2.subVectors(e, c).normalize();
    return tmpV2.dot(GAME.camDir) > 0.35 || d < 4;
  },
  onPlayerHide(h) {
    if (!this.on || this.state === 'off') return;
    // it watched you get in: it knows exactly where you are
    const p = PLAYER.pos, d = Math.hypot(p.x - this.pos.x, p.z - this.pos.z);
    if (d < 9 && this.canSee(this.state !== 'chase')) { this.sawHide = h; this.state = 'chase'; this.path = null; }
  },
  onPlayerExitHide() { if (this.on && this.state !== 'chase' && this.canSee(false)) this.startChase(); },
  startChase() {
    if (this.state !== 'chase') { this.state = 'chase'; this.chaseT = 0; this.path = null; SFX.oniSpot && SFX.oniSpot(); }
    this.trackT = 9;
  },
  /* ---------- moving ---------- */
  collide(np) {
    const r = 0.36, feet = this.pos.y, hgt = 2.1;
    for (let it = 0; it < 2; it++) for (const c of WORLD.colliders(np, r)) {
      if (c.wy1 <= feet + 0.35 || c.wy0 >= feet + hgt) continue;
      if (this.ghostT > 0 && c.tag !== 'wall' && c.tag !== 'door') continue;
      const cx = clamp(np.x, c.x0, c.x1), cz = clamp(np.z, c.z0, c.z1), dx = np.x - cx, dz = np.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; np.x += dx * k; np.z += dz * k; }
    }
  },
  stepToward(tx, tz, sp, dt, turn = 7) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.02) { this.vel = damp(this.vel, 0, 8, dt); return d; }
    const want = Math.atan2(dx, dz);
    this.yaw += clamp(angDiff(this.yaw, want), -turn * dt, turn * dt);
    const face = Math.cos(angDiff(this.yaw, want));
    this.vel = damp(this.vel, sp * clamp(face, 0.25, 1), 5, dt);
    const st = Math.min(this.vel * dt, d);
    const np = tmpV.set(this.pos.x + Math.sin(this.yaw) * st, this.pos.y, this.pos.z + Math.cos(this.yaw) * st);
    this.collide(np);
    const g = WORLD.groundAt(np.x, np.z, this.pos.y + 0.1);
    if (g === null) return d;
    np.y = g; this.pos.copy(np);
    return d;
  },
  /* follow the waypoint graph to a goal point (opening doors on the way); true when there */
  followTo(goal, sp, dt) {
    const gRoom = WORLD.roomAt(goal) || GAME.room, me = WORLD.roomAt(this.pos);
    if (me === gRoom && Math.abs(goal.y - this.pos.y) < 1.2 && !WORLD.blocked(tmpV2.set(this.pos.x, this.pos.y + 1, this.pos.z), tmpV3.set(goal.x, goal.y + 1, goal.z))) {
      this.path = null;
      return this.stepToward(goal.x, goal.z, sp, dt) < 0.45;
    }
    this.repathT -= dt;
    if (!this.path || this.repathT <= 0) {
      this.repathT = 0.6;
      const a = nearestNode(me, this.pos), b = nearestNode(gRoom, goal);
      this.path = a && b ? navPath(a, b) : null; this.pi = 0;
      if (this.path && this.path.length > 1) {   // don't walk back to a node that is behind
        const n0 = this.path[0], n1 = this.path[1];
        if (n0.room === n1.room && Math.hypot(n1.x - this.pos.x, n1.z - this.pos.z) < Math.hypot(n1.x - n0.x, n1.z - n0.z)) this.pi = 1;
      }
      if (!this.path) return this.stepToward(goal.x, goal.z, sp, dt) < 0.45;
    }
    const n = this.path[this.pi];
    if (!n) return this.stepToward(goal.x, goal.z, sp, dt) < 0.45;
    const nx = this.path[this.pi + 1], door = nx && n.door && nx.door === n.door ? n.door : null;
    const d = Math.hypot(n.x - this.pos.x, n.z - this.pos.z);
    if (door && d < 0.7 && door.t < 0.5) {   // a closed door: stop, and open it
      this.vel = damp(this.vel, 0, 10, dt);
      if (!door.open) { this.waitT += dt; if (this.waitT > 0.45) { setDoorOpen(door, true, this.pos); SFX.door(door.center, 0.85); this.waitT = 0; } }
      const want = Math.atan2(door.center.x - this.pos.x, door.center.z - this.pos.z); this.yaw += clamp(angDiff(this.yaw, want), -6 * dt, 6 * dt);
      return false;
    }
    this.stepToward(n.x, n.z, sp * (door ? 0.8 : 1), dt);
    if (d < (door ? 0.35 : 0.6)) this.pi++;
    return false;
  },
  /* ---------- update ---------- */
  update(dt) {
    if (!this.on) return;
    const m = this.m, P = PLAYER;
    if (this.state === 'kill') return;
    if (GAME.modal) { this.animate(dt, 0); return; }
    const dP = Math.hypot(P.pos.x - this.pos.x, P.pos.z - this.pos.z), sameLevel = Math.abs(P.pos.y - this.pos.y) < 1.2;
    let sp = 0;
    const seen = this.canSee(this.state !== 'chase');
    if (seen) { this.lastSeen.copy(P.pos); this.seenT = GAME.time; }
    if (seen && this.state !== 'chase' && this.state !== 'appear') this.startChase();
    switch (this.state) {
      case 'appear': {   // stands there, turns its head to you, then comes
        this.waitT += dt; sp = 0;
        const want = Math.atan2(P.pos.x - this.pos.x, P.pos.z - this.pos.z); this.yaw += clamp(angDiff(this.yaw, want), -2 * dt, 2 * dt);
        if (this.waitT > (this.appearFor || 1.6)) { this.waitT = 0; this.state = 'chase'; this.chaseT = 0; this.trackT = 12; }
        break;
      }
      case 'chase': {
        this.chaseT += dt;
        if (seen) this.trackT = 9; else this.trackT -= dt;
        sp = (dP > 9 ? 4.55 : 4.3) * (this.chaseT < 1 ? 0.75 : 1);
        if (this.sawHide) {
          const h = this.sawHide;
          if (P.hidden !== h) { this.sawHide = null; break; }
          if (this.followTo(h.exitP, sp, dt) || Math.hypot(h.exitP.x - this.pos.x, h.exitP.z - this.pos.z) < 0.7) { GAME.caught(true); return; }
          break;
        }
        if (P.hidden) {   // lost you: go where it saw you last, then look around
          this.toSearch(); break;
        }
        if (this.trackT > 0) { this.followTo(P.pos, sp, dt); }
        else this.toSearch();
        if (this.chaseT > 55 && !seen) this.toLeave();
        if (dP < 0.95 && sameLevel && !P.hidden && P.alive && !WORLD.blocked(this.eye().clone(), tmpV2.set(P.pos.x, P.pos.y + 1.4, P.pos.z))) { GAME.caught(false); return; }
        break;
      }
      case 'search': {
        sp = 2.4;
        if (this.sub === 0) { if (this.followTo(this.lastSeen, sp, dt)) { this.sub = 1; this.waitT = 0; } this.leaveT += dt; if (this.leaveT > 18) this.toLeave(); }
        else if (this.sub === 1) {   // look around
          this.waitT += dt; sp = 0; this.yaw += Math.sin(this.waitT * 2.2) * dt * 1.6;
          if (this.waitT > 2.4) {
            const h = this.pickHide();
            if (h) { this.inspect = h; this.sub = 2; } else this.toLeave();
          }
        } else if (this.sub === 2) {   // walk up to a hiding place
          const h = this.inspect, front = this.peekSpot(h);
          if (this.followTo(front, 1.9, dt)) { this.sub = 3; this.waitT = 0; }
          this.leaveT += dt; if (this.leaveT > 25) this.toLeave();
        } else if (this.sub === 3) {   // peek in, then give up
          sp = 0; this.waitT += dt;
          const h = this.inspect, want = h.yaw; this.yaw += clamp(angDiff(this.yaw, want), -3 * dt, 3 * dt);
          this.bendT = h.type === 'locker' ? (this.waitT < 3.8 ? 0.8 : 0) : 0;
          if (h.type === 'locker') this.alignPeek(h, dt);
          if (this.waitT > 4.8) this.toLeave();
        }
        break;
      }
      case 'leave': {
        sp = 2.6; this.bendT = 0; this.leaveT += dt;
        if (!this.goal) this.goal = this.leaveGoal();
        const there = this.goal ? this.followTo(this.goal, sp, dt) : true;
        if ((there || this.leaveT > 14) && !this.seenByPlayer()) { this.despawn(); return; }
        if (this.leaveT > 30) { this.despawn(); return; }
        break;
      }
      case 'script': sp = this.runScript(dt); if (!this.on) return; break;
      default: break;
    }
    // stuck against furniture: let it slide through for a moment
    const moved = Math.hypot(this.pos.x - this.lastPos.x, this.pos.z - this.lastPos.z);
    if (sp > 1 && moved < sp * dt * 0.2) { this.stuckT += dt; if (this.stuckT > 0.6) { this.ghostT = 1.2; this.stuckT = 0; } } else this.stuckT = Math.max(0, this.stuckT - dt);
    this.ghostT = Math.max(0, this.ghostT - dt);
    this.lastPos.copy(this.pos);
    // ducking under door frames
    let nearDoor = 0;
    for (const d of MAN.doors) { const dd = Math.hypot(d.center.x - this.pos.x, d.center.z - this.pos.z); if (dd < 1.1 && Math.abs(d.center.y - 1.1 - this.pos.y) < 1) nearDoor = Math.max(nearDoor, 1 - dd / 1.1); }
    this.animate(dt, moved / Math.max(dt, 1e-4), nearDoor);
    this.sounds(dt, moved);
  },
  toSearch() { this.state = 'search'; this.sub = 0; this.waitT = 0; this.leaveT = 0; this.path = null; this.inspect = null; },
  toLeave() { this.state = 'leave'; this.goal = null; this.path = null; this.leaveT = 0; this.bendT = 0; },
  pickHide() {
    const room = WORLD.roomAt(this.pos);
    const list = MAN.hides.filter(h => h.room === room && h.exitP && Math.hypot(h.exitP.x - this.pos.x, h.exitP.z - this.pos.z) < 7 && h !== MAN.takeshiCloset);
    if (!list.length) return null;
    const mine = list.find(h => h === PLAYER.hidden);
    // it tends to find the right one... but only looks, unless it saw you get in
    if (mine && Math.random() < 0.55) return mine;
    return list[Math.floor(Math.random() * list.length)];
  },
  // where to stand in front of a hiding place (out = the way the one hiding looks)
  peekSpot(h) {
    return new THREE.Vector3(h.cam.x, h.exitP.y, h.cam.z).addScaledVector(tmpV2.set(-Math.sin(h.yaw), 0, -Math.cos(h.yaw)), h.type === 'locker' ? 1.15 : 1.25);
  },
  // bend down to the louvres: slide so the eyes end up right outside the slits
  alignPeek(h, dt) {
    if (this.bend < 0.5) return;
    const want = tmpV2.copy(h.cam).addScaledVector(tmpV3.set(-Math.sin(h.yaw), 0, -Math.cos(h.yaw)), 0.78);
    this.m.root.updateMatrixWorld(true);
    const e = this.m.head.localToWorld(new THREE.Vector3(0, 0.5, 0.3));
    this.pos.x += (want.x - e.x) * Math.min(1, dt * 4); this.pos.z += (want.z - e.z) * Math.min(1, dt * 4);
  },
  leaveGoal() {
    // the waypoint farthest from the player that it can still reach (usually through a door)
    const me = nearestNode(WORLD.roomAt(this.pos), this.pos);
    let best = null, bd = -1;
    for (const n of MAN.nodes) {
      if (!n.door || n.room === (WORLD.roomAt(PLAYER.pos))) continue;
      const d = Math.hypot(n.x - PLAYER.pos.x, n.z - PLAYER.pos.z) + Math.abs(n.y - PLAYER.pos.y) * 3, dm = Math.hypot(n.x - this.pos.x, n.z - this.pos.z);
      if (dm > 18) continue;
      if (d > bd && me && navPath(me, n)) { bd = d; best = n; }
    }
    return best ? new THREE.Vector3(best.x, best.y, best.z) : null;
  },
  /* ---------- scripted walk (the locker room) ---------- */
  runScript(dt) {
    const S = this.script, st = S && S.steps[S.i];
    if (!st) { this.toLeave(); return 0; }
    const next = () => { S.i++; this.waitT = 0; this.path = null; };
    switch (st.t) {
      case 'go': if (this.followTo(st.p, st.sp || 2.2, dt)) next(); return st.sp || 2.2;
      case 'look': this.waitT += dt; this.yaw += Math.sin(this.waitT * 1.8) * dt * 1.4; if (this.waitT > st.d) next(); return 0;
      case 'call': st.fn(); next(); return 0;
      case 'peek': {
        const h = st.h();
        if (!h) { next(); return 0; }
        if (!S.at) { if (this.followTo(this.peekSpot(h), 1.8, dt)) { S.at = true; this.waitT = 0; } return 1.8; }
        this.waitT += dt;
        const want = h.yaw; this.yaw += clamp(angDiff(this.yaw, want), -3 * dt, 3 * dt);
        this.bendT = this.waitT > 0.4 && this.waitT < 4.4 ? 0.8 : 0; this.alignPeek(h, dt);
        if (this.waitT > 5.4) { S.at = false; next(); }
        return 0;
      }
      case 'gone': if (!this.seenByPlayer() || this.waitT > 3) { this.despawn(); if (st.fn) st.fn(); return 0; } this.waitT += dt; return 0;
      default: next(); return 0;
    }
  },
  /* ---------- animation ---------- */
  animate(dt, speed = 0, duck = 0) {
    const m = this.m; if (!m) return;
    this.bend = damp(this.bend, Math.max(this.bendT, duck * 0.45), 3.2, dt);
    const k = clamp(speed / 4, 0, 1.2);
    this.phase += dt * (2.2 + speed * 1.55);
    const s = Math.sin(this.phase), c = Math.cos(this.phase);
    for (const L of m.legs) { const ph = L.s > 0 ? s : -s; L.hp.rotation.x = ph * 0.55 * k - this.bend * 0.55; L.kn.rotation.x = Math.max(0, -Math.cos(this.phase + (L.s > 0 ? 0 : Math.PI))) * 0.8 * k + this.bend * 1.0; }
    const up = this.armsUp;
    for (const A of m.arms) { const ph = A.s > 0 ? -s : s; A.sh.rotation.x = ph * 0.45 * k - up * 1.45 - this.bend * 0.3; A.sh.rotation.z = A.s * (0.12 + up * 0.25); A.el.rotation.x = -0.15 - k * 0.25 - up * 0.3; }
    m.hips.position.y = 0.72 + Math.abs(c) * 0.05 * k - this.bend * 0.28;
    m.torso.rotation.x = this.bend * 0.85 + k * 0.08; m.torso.rotation.z = s * 0.04 * k;
    m.head.rotation.x = -this.bend * 0.75 - k * 0.05; m.head.rotation.z = Math.sin(GAME.time * 0.7) * 0.05 + (this.state === 'search' ? Math.sin(GAME.time * 1.3) * 0.12 : 0);
    // mouth (only opens when it gets you)
    const mo = this.mouthT; m.inner.scale.y = 0.002 + mo * 0.09; m.upLip.position.y = 0.015 + mo * 0.05; m.loLip.position.y = -0.025 - mo * 0.06; m.teeth.forEach(t => (t.visible = mo > 0.2));
    this.place();
    // the pupils follow you
    m.root.updateMatrixWorld(true);
    for (const e of m.eyes) {
      const w = e.parent.getWorldPosition(tmpV2), l = e.parent.worldToLocal(tmpV3.copy(camera.position));
      void w; e.rotation.set(clamp(-Math.atan2(l.y, Math.hypot(l.x, l.z)), -0.35, 0.35), clamp(Math.atan2(l.x, l.z), -0.45, 0.45), 0);
    }
  },
  sounds(dt, moved) {
    this.stepAcc += moved;
    if (this.stepAcc > 0.95) { this.stepAcc = 0; SFX.oniStep(this.pos, this.vel > 3 ? 0.9 : 0.6); }
    this.breathT -= dt;
    if (this.breathT <= 0) { this.breathT = 2.2 + Math.random() * 1.6; SFX.oniBreath(this.eye().clone()); }
    // heartbeat while it is near and you are hiding
    if (PLAYER.hidden) {
      const d = Math.hypot(PLAYER.pos.x - this.pos.x, PLAYER.pos.z - this.pos.z);
      if (d < 9) { this.hbT -= dt; if (this.hbT <= 0) { this.hbT = lerp(0.42, 1.0, d / 9); SFX.heartbeat(lerp(0.9, 0.35, d / 9)); } }
    }
  },
};

/* ---------- when it shows up on its own ---------- */
const DIRECTOR = {
  enabled: false, cool: 60, finale: false,
  reset() { this.enabled = false; this.cool = 60; this.finale = false; },
  onGone() {
    this.cool = this.finale ? rng.range(28, 42) : rng.range(70, 115);
    MUSIC.stop(2.5); GAME.chaseFx = 0;
    if (PLAYER.alive && GAME.state === 'play') setTimeout(() => { if (!ONI.on && PLAYER.alive && GAME.state === 'play') UI.hint('……いなくなったみたいだ', 2400); }, 1800);
  },
  update(dt) {
    if (!this.enabled || ONI.on || GAME.modal || GAME.cine || !PLAYER.alive || STORY.busy) return;
    this.cool -= dt * (PLAYER.hidden ? 0.3 : 1);
    if (this.cool > 0) return;
    const room = WORLD.roomAt(PLAYER.pos); if (!room) return;
    // come in through a door of the room you are in, from the other side
    const doors = MAN.doors.filter(d => d.b && !d.locked && (d.a === room || d.b === room) && d.center.distanceTo(PLAYER.pos) > 4.5 && Math.abs(d.center.y - 1.1 - PLAYER.pos.y) < 1.5);
    if (!doors.length) { this.cool = 5; return; }
    const d = doors[Math.floor(rng.next() * doors.length)], far = d.a === room ? d.b : d.a, sgn = d.a === room ? 1 : -1;
    const x = d.center.x + d.n.x * sgn * 1.4, z = d.center.z + d.n.z * sgn * 1.4, y = WORLD.groundAt(x, z, far.def.y + 0.5) ?? far.def.y;
    ONI.spawn(x, z, y, Math.atan2(-d.n.x * sgn, -d.n.z * sgn), 'chase');
    ONI.trackT = 12; this.cool = 999;
  },
};

/* ---------- the catch ---------- */
GAME.caught = function (inHide) {
  if (!PLAYER.alive) return;
  PLAYER.alive = false; GAME.caughtN = (GAME.caughtN || 0) + 1;
  ONI.state = 'kill'; MUSIC.stop(0.2); GAME.chaseFx = 0;
  const h = PLAYER.hidden;
  if (h && h.doors) { h.doors.forEach(d => (d.visible = true)); animateHideDoors(h, 420, 1.7); if (h.type === 'locker') SFX.locker(h.cam, true); else SFX.closet(h.cam, false); }
  $('fxHide').style.opacity = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  const eye = camera.position.clone(), dir = new THREE.Vector3(), ground = h ? h.exitP.y : PLAYER.pos.y;
  if (inHide && h) dir.set(-Math.sin(h.yaw), 0, -Math.cos(h.yaw));
  else { dir.set(ONI.pos.x - eye.x, 0, ONI.pos.z - eye.z); if (dir.lengthSq() < 1e-4) dir.set(-Math.sin(PLAYER.yaw), 0, -Math.cos(PLAYER.yaw)); dir.normalize(); }
  // the oni right in front of you, leaning down into your face
  ONI.yaw = Math.atan2(-dir.x, -dir.z); ONI.bendT = 0.5; ONI.bend = 0.5;
  const t0 = performance.now(), look = new THREE.Vector3();
  GAME.cine = { pos: eye, look: eye.clone().addScaledVector(dir, 1) };
  SFX.oniCatch();
  animate(() => {
    const k = (performance.now() - t0) / 1000, dist = lerp(1.7, 0.95, smoothstep(0, 0.28, k));
    ONI.pos.set(eye.x + dir.x * dist, ground, eye.z + dir.z * dist);
    ONI.armsUp = smoothstep(0, 0.25, k); ONI.mouthT = smoothstep(0.05, 0.3, k);
    ONI.animate(1 / 60, 0);
    ONI.m.head.localToWorld(look.set(0, 0.45, 0.25));
    GAME.cine.look.lerp(look, 0.35);
    POST.shake = k < 0.9 ? 0.7 : 0;
    if (k > 0.95 && !GAME._blk) { GAME._blk = true; $('fxBlack').style.transition = 'opacity .25s'; $('fxBlack').style.opacity = 1; }
    if (k > 1.7) { GAME._blk = false; ONI.mouthT = 0; ONI.armsUp = 0; UI.over(); return false; }
    return true;
  });
};

/* ---------- its sounds, and the chase music ---------- */
SFX.oniStep = (pos, vol = 0.7) => { if (!AU.ok) return; AU.tone({ pos, f: 62, f2: 34, dur: 0.22, vol: vol * 0.9, rev: 0.35 }); AU.burst({ pos, dur: 0.1, f: 300, q: 0.7, type: 'lowpass', vol: vol * 0.6, brown: true, rev: 0.3 }); AU.burst({ pos, t0: AU.t + 0.03, dur: 0.05, f: 1400, q: 1, vol: vol * 0.08, rev: 0.2 }); };
SFX.oniBreath = pos => {
  if (!AU.ok) return;
  AU.burst({ pos, dur: 0.9, a: 0.35, f: 420, q: 1.2, vol: 0.32, brown: true, rev: 0.4, sweepTo: 260 });
  AU.tone({ pos, type: 'sawtooth', f: 58, f2: 52, dur: 0.8, a: 0.3, vol: 0.05, rev: 0.4, filter: 320 });
};
SFX.oniSpot = () => { if (!AU.ok) return; for (const f of [146.8, 155.6, 207.7]) AU.tone({ type: 'sawtooth', f, dur: 1.4, a: 0.005, vol: 0.09, filter: 1800, rev: 0.6 }); AU.burst({ dur: 0.5, f: 2400, q: 0.5, vol: 0.3, rev: 0.6 }); };
SFX.oniCatch = () => {
  if (!AU.ok) return;
  SFX.scream({ steps: [[0, 190], [0.12, 330], [0.6, 260], [1.1, 140]], formants: [[650, 3, 4], [1100, 3, 3], [2500, 4, 1.2]], hold: 1.1, vol: 1.1, rev: 0.35 });
  AU.burst({ dur: 1.0, a: 0.01, f: 1500, q: 0.4, vol: 0.7, rev: 0.4 }); AU.tone({ type: 'sawtooth', f: 70, f2: 40, dur: 1.0, vol: 0.4, filter: 600 });
  for (const f of [233, 247, 349, 370]) AU.tone({ type: 'sawtooth', f, dur: 1.3, a: 0.004, vol: 0.07, filter: 3000, rev: 0.5 });
};
// a piano note for the puzzle (a few decaying partials and the hammer)
SFX.piano = (midi, vol = 0.32) => {
  if (!AU.ok) return;
  const f = NOTE(midi);
  [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1]].forEach(([h, v], i) => AU.tone({ type: i ? 'sine' : 'triangle', f: f * h * (1 + i * 0.0007), dur: 1.6 / Math.sqrt(h), a: 0.003, vol: vol * v, rev: 0.45 }));
  AU.burst({ dur: 0.03, f: 2500, q: 0.7, vol: 0.05, rev: 0.2 });
};
MUSIC_DEFS.aochase = {
  bpm: 150, div: 4,
  step(s, t, bus, spb) {
    const b = s % 16, bar = Math.floor(s / 16) % 4, r = [38, 38, 39, 37][bar];
    // low piano octaves and a running minor figure above them
    if (b % 2 === 0) mTone(bus, t, { type: 'triangle', f: NOTE(r + (b % 4 ? 12 : 0)), dur: spb * 1.8, vol: 0.2, lp: 900 });
    const fig = [0, 3, 7, 6, 3, 7, 12, 6][b % 8];
    mTone(bus, t, { type: 'triangle', f: NOTE(r + 36 + fig), dur: spb * 0.9, vol: 0.06, lp: 2600 });
    mTone(bus, t, { type: 'sine', f: NOTE(r + 48 + fig), dur: spb * 0.5, vol: 0.02 });
    // strings: tremolo chord stabs
    if (b === 0 || b === 10) for (const n of [[62, 65, 69], [62, 65, 68], [63, 66, 70], [61, 64, 67]][bar]) for (const d of [-7, 7]) mTone(bus, t, { type: 'sawtooth', f: NOTE(n), detune: d, dur: spb * 5, a: 0.02, vol: 0.035, lp: 2200 });
    // drums: deep hits on the beat, a dry tick between
    if (b % 4 === 0) mTone(bus, t, { f: 110, f2: 36, dur: 0.25, vol: 0.75 });
    if (b === 6 || b === 14) mNoise(bus, t, { dur: 0.12, f: 900, type: 'bandpass', q: 0.8, vol: 0.28 });
    if (b % 2 === 1) mNoise(bus, t, { dur: 0.025, f: 6500, vol: 0.06 });
    if (bar === 3 && b === 12) mTone(bus, t, { type: 'square', f: NOTE(86), f2: NOTE(74), dur: 0.35, vol: 0.035, lp: 3000 });
  },
};
