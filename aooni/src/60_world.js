
/* =========================================================================
   World: the mansion's rooms, lights pool, collision & floor queries
   ========================================================================= */
const WORLD = {
  rooms: [], dyn: [], time: 0,
  reset() {
    for (const r of this.rooms) r.dispose();
    this.rooms = []; this.dyn = [];
  },
  add(room) { room.finalize(); scene.add(room.group); this.rooms.push(room); return room; },
  roomAt(p) {
    let best = null;
    for (const r of this.rooms) if (r.contains(p) && (!best || r.index > best.index)) best = r;
    return best;
  },
  colliders(p, rad = 2) {
    const out = [];
    for (const r of this.rooms) {
      const b = r.bounds;
      if (p.x < b.min.x - rad - 1 || p.x > b.max.x + rad + 1 || p.z < b.min.z - rad - 1 || p.z > b.max.z + rad + 1) continue;
      for (const c of r.colliders) if (c.on) out.push(c);
    }
    return out;
  },
  groundAt(x, z, feetY) {
    let best = null;
    for (const r of this.rooms) {
      const b = r.bounds;
      if (x < b.min.x - 0.6 || x > b.max.x + 0.6 || z < b.min.z - 0.6 || z > b.max.z + 0.6) continue;
      const h = r.floorAt(x, z, feetY);
      if (h !== null && (best === null || h > best)) best = h;
    }
    return best;
  },
  /* resolve a circle (player/entity) against colliders */
  collide(pos, radius, feetY, height) {
    const cols = this.colliders(pos, radius);
    for (let it = 0; it < 3; it++) {
      let moved = false;
      for (const c of cols) {
        if (c.wy1 <= feetY + 0.35 || c.wy0 >= feetY + height) continue;
        const cx = clamp(pos.x, c.x0, c.x1), cz = clamp(pos.z, c.z0, c.z1);
        const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= radius * radius) continue;
        if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (radius - d) / d; pos.x += dx * k; pos.z += dz * k; }
        else { // centre inside box: push out along the smallest axis
          const l = pos.x - c.x0, rr = c.x1 - pos.x, f = pos.z - c.z0, bk = c.z1 - pos.z, m = Math.min(l, rr, f, bk);
          if (m === l) pos.x = c.x0 - radius; else if (m === rr) pos.x = c.x1 + radius; else if (m === f) pos.z = c.z0 - radius; else pos.z = c.z1 + radius;
        }
        moved = true;
      }
      if (!moved) break;
    }
  },
  /* line of sight test against walls/doors (2D) */
  blocked(a, b) {
    const cols = this.colliders(a, a.distanceTo(b) + 2);
    for (const c of cols) {
      if (c.tag !== 'wall' && c.tag !== 'door') continue;
      if (Math.min(a.y, b.y) > c.wy1 || Math.max(a.y, b.y) < c.wy0) continue;
      if (segBox(a.x, a.z, b.x, b.z, c.x0, c.z0, c.x1, c.z1)) return true;
    }
    return false;
  },
};
function segBox(x0, z0, x1, z1, bx0, bz0, bx1, bz1) {
  let t0 = 0, t1 = 1; const dx = x1 - x0, dz = z1 - z0;
  const p = [-dx, dx, -dz, dz], q = [x0 - bx0, bx1 - x0, z0 - bz0, bz1 - z0];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) { if (q[i] < 0) return false; }
    else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
  }
  return true;
}

/* ---- lights ---- */
const LIGHT_SCALE = 1.75, RANGE_SCALE = 1.45;   // rooms were scaled up, so lamps reach further
const LIGHTS = {
  pool: [], lighter: null, flash: null, n: 0,
  init() {
    for (const l of this.pool) scene.remove(l);
    this.pool = [];
    const q = Q();
    this.n = q.pool;
    for (let i = 0; i < this.n; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 1);
      if (i < q.shadows) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.004; l.shadow.normalBias = 0.03; l.shadow.camera.near = 0.15; l.shadow.camera.far = 16; l.shadow.radius = 3; }
      scene.add(l); this.pool.push(l);
    }
    if (!this.lighter) {
      this.lighter = new THREE.PointLight(0xffa04a, 0, 15, 1); camera.add(this.lighter); this.lighter.position.set(0.05, 0.12, -0.6);
      this.flash = new THREE.SpotLight(0xfff1d6, 0, 26, 0.48, 0.55, 1); camera.add(this.flash); this.flash.position.set(0.2, -0.15, 0); camera.add(this.flash.target); this.flash.target.position.set(0.1, -0.05, -5);
    }
  },
  update(dt, t) {
    const cand = [];
    const cp = GAME.camPos;
    for (const r of WORLD.rooms) {
      for (const f of r.fixtures) { fixtureTick(f, t, dt); if (f.level > 0.01) cand.push(f); }
    }
    for (const f of WORLD.dyn) { if (f.level == null) f.level = 1; if (f.level * f.intensity > 0.01) cand.push(f); }
    for (const f of cand) {
      f._d = f.pos.distanceTo(cp) - (f.priority || 0) * 50;
      if (f.room && Math.abs(f.pos.y - cp.y) > 2.6) f._d += 30;   // lamps of another floor come last
    }
    cand.sort((a, b) => a._d - b._d);
    const n = this.n;
    const cut = cand.length > n ? cand[n]._d : Infinity;
    for (let i = 0; i < n; i++) {
      const l = this.pool[i], f = cand[i];
      if (!f) { l.intensity = 0; continue; }
      const w = cut === Infinity ? 1 : clamp((cut - f._d) / 3, 0, 1);
      l.position.copy(f.pos); l.color.copy(f.color); l.distance = f.range * RANGE_SCALE;
      l.intensity = f.intensity * f.level * (f.flick || 1) * w * GAME.lightMul * LIGHT_SCALE;
    }
    if (Q().shadows) { this.shadowFrame++; if (this.shadowFrame % 2 === 0) renderer.shadowMap.needsUpdate = true; }
  },
};
function fixtureTick(f, t, dt) {
  let target = (f.state === 'on') ? 1 : 0;
  if (t < f.flickerUntil && f.state === 'on') {
    const k = Math.sin(t * 31 + f.seed) * Math.sin(t * 11.7 + f.seed * 3.1) + Math.sin(t * 5.3 + f.seed) * 0.3;
    target = k > 0.05 ? 1 : 0.04;
  }
  const prev = f.level;
  f.level = target > f.level ? Math.min(target, f.level + dt * 25) : Math.max(target, f.level - dt * 25);
  if (Math.abs(prev - f.level) > 0.001 || f._init !== true) {
    f._init = true;
    for (const m of f.mats) m.mat.emissiveIntensity = m.base * f.level;
    if (f.glow) f.glow.traverse(o => { if (o.isSprite) o.material.opacity = o.userData.baseOpacity * f.level; });
  }
}
function flickerRoom(room, dur = 2.5) {
  if (!room) return;
  const t = WORLD.time;
  for (const f of room.fixtures) if (f.state === 'on' && f.kind !== 'moon') f.flickerUntil = t + dur * (0.8 + Math.random() * 0.4);
  const p = room.fixtures[0] ? room.fixtures[0].pos : null;
  for (let i = 0; i < 5; i++) setTimeout(() => SFX.flick(p), i * dur * 180 + Math.random() * 100);
}
function breakFixture(f) {
  if (f.state !== 'on') return;
  f.state = 'broken';
  SFX.lightBreak(f.pos); SFX.spark(f.pos);
  PARTICLES.sparks(f.pos);
}

/* ---- tiny particle helper ---- */
const PARTICLES = {
  list: [],
  sparks(pos) {
    const n = 14, geo = new THREE.BufferGeometry(), arr = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { arr.set([pos.x, pos.y, pos.z], i * 3); vel.push(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3)); }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({ color: 0xffd080, size: 0.05, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const pts = new THREE.Points(geo, m); scene.add(pts);
    this.list.push({ pts, vel, life: 0.8, max: 0.8 });
  },
  update(dt) {
    for (const p of this.list.slice()) {
      p.life -= dt;
      const a = p.pts.geometry.attributes.position;
      for (let i = 0; i < p.vel.length; i++) { p.vel[i].y -= 9 * dt; a.setXYZ(i, a.getX(i) + p.vel[i].x * dt, a.getY(i) + p.vel[i].y * dt, a.getZ(i) + p.vel[i].z * dt); }
      a.needsUpdate = true; p.pts.material.opacity = p.life / p.max;
      if (p.life <= 0) { scene.remove(p.pts); p.pts.geometry.dispose(); p.pts.material.dispose(); this.list.splice(this.list.indexOf(p), 1); }
    }
  },
  clear() { for (const p of this.list) { scene.remove(p.pts); p.pts.geometry.dispose(); p.pts.material.dispose(); } this.list = []; },
};
