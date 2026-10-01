
# ================= さわれる物（ドア・引き出し・窓・スイッチ など）=================
var scene: Node3D = null
var ITS := []        # {box, label(item)->{t,k}|null, act(), use(item)->bool, useLabel(item)->str|null, on}
func addIt(o: Dictionary) -> Dictionary:
	o.on = o.get("on", true) != false
	for k in ["label", "act", "use", "useLabel", "door", "ownCol"]:
		if not o.has(k): o[k] = null
	ITS.append(o)
	return o
var NOISES := []     # 物音
func noise(x: float, y: float, z: float, r: float, kind: String) -> void:
	NOISES.append({x = x, y = y, z = z, r = r, kind = kind, t = GT})
	if NOISES.size() > 20: NOISES.pop_front()
# ---- 動く部品の共通 ----
var MOVERS := []     # {t (0..1), tgt, spd, apply(t), done()}
func addMover(m: Dictionary) -> Dictionary:
	m.t = m.get("t", 0.0); m.tgt = m.get("tgt", m.t); m.spd = m.get("spd", 3.0)
	if not m.has("done"): m.done = null
	MOVERS.append(m); m.apply.call(m.t)
	return m
func updMovers(dt: float) -> void:
	for m in MOVERS:
		if m.t == m.tgt: continue
		var d: float = m.tgt - m.t; var s: float = m.spd * dt
		m.t = m.tgt if absf(d) <= s else m.t + sgn(d) * s
		m.apply.call(smooth(m.t))
		if m.t == m.tgt and m.done: m.done.call()
# 看板（1枚の絵）
func signp(x: float, y: float, z: float, w: float, h: float, mat, yaw := 0.0, o := {}) -> MeshInstance3D:
	var m := mesh(G.plane(w, h), M(mat))
	m.position = Vector3(x, y, z); m.rotation.y = yaw
	if o.get("parent"): o.parent.add_child(m)
	else: scene.add_child(m)
	return m
# ---- ドア ----
var DOORS := []
# o: {x,z,y,w,h,axis:'x'|'z',hinge:-1|1,swing:-1|1,mat,lock,name,col,knob}
func mkDoor(o: Dictionary) -> Dictionary:
	var t: float = o.get("t", 0.06); var w: float = o.w; var h: float = o.h; var y: float = o.get("y", 0.0)
	var pivot := Node3D.new(); var leaf := MB.new(); var m := M(o.get("mat", "door"))
	var s: float = -o.hinge # 板がのびる向き（ローカルX）
	leaf.box(minf(0, s * w), 0, -t / 2, maxf(0, s * w), h, t / 2, m, 63, 1)
	# 飾り（パネルとノブ）。アルファ1のドアは上がアーチ形のパネル
	if o.get("arch"):
		var pm := M(o.get("panel", "doorc2")); var pw := w * 0.68; var cx := s * w / 2
		for side in [1, -1]:
			var bs := Basis() if side > 0 else Basis(Vector3.UP, PI)
			leaf.geo(G.arch(pw, h * 0.44), Transform3D(bs, Vector3(cx, h * 0.68, side * (t / 2))), pm, 1, 1)
			leaf.geo(G.box(pw, h * 0.26, 0.014), Transform3D(Basis(), Vector3(cx, h * 0.1 + h * 0.13, side * (t / 2 + 0.007))), pm, 1, 1)
	elif not o.get("plain"):
		var pm := M(o.get("panel", "doorp"))
		for ab in [[0.18, 0.42], [0.55, 0.9]]:
			leaf.box(minf(s * w * 0.15, s * w * 0.85), h * ab[0], -t / 2 - 0.012, maxf(s * w * 0.15, s * w * 0.85), h * ab[1], t / 2 + 0.012, pm, 63, 1)
	var kx := s * (w - 0.09); var km := M(o.get("knob", "brass"))
	if o.get("arch"):
		for side in [1, -1]:
			leaf.box(kx - 0.02, h * 0.45 - 0.07, t / 2 if side > 0 else -t / 2 - 0.012, kx + 0.02, h * 0.45 + 0.07, t / 2 + 0.012 if side > 0 else -t / 2, MATS.black)
			leaf.box(minf(kx, kx - s * 0.12), h * 0.45 - 0.012, t / 2 + 0.012 if side > 0 else -t / 2 - 0.04, maxf(kx, kx - s * 0.12), h * 0.45 + 0.012, t / 2 + 0.04 if side > 0 else -t / 2 - 0.012, MATS.black)
	else:
		leaf.sphere(kx, h * 0.47, t / 2 + 0.035, 0.035, km); leaf.sphere(kx, h * 0.47, -t / 2 - 0.035, 0.035, km)
		leaf.box(kx - 0.015, h * 0.47 - 0.015, -t / 2 - 0.03, kx + 0.015, h * 0.47 + 0.015, t / 2 + 0.03, km)
	pivot.add_child(leaf.build())
	var base := 0.0 if o.axis == "x" else -PI / 2
	var hx: float = o.x + o.hinge * w / 2 if o.axis == "x" else o.x
	var hz: float = o.z if o.axis == "x" else o.z + o.hinge * w / 2
	pivot.position = Vector3(hx, y, hz); pivot.rotation.y = base; scene.add_child(pivot)
	var lsw: float = o.swing if o.axis == "x" else -o.swing
	var d := {o = o, pivot = pivot, base = base, open = 0, lock = o.get("lock"), name = o.get("name", "ドア"), hx = hx, hz = hz, y = y, w = w, h = h, col = null, blockers = [], inside = o.get("inside", 0),
		onToggle = null, onUnlock = null, lockMsg = null, it = null, m = null}
	var cb := func(tt: float) -> void:
		var op := tt > 0.5
		if o.axis == "x":
			if not op: set_box(d.col, o.x - w / 2, y, o.z - 0.05, o.x + w / 2, y + h, o.z + 0.05)
			else: set_box(d.col, hx - 0.07, y, o.z, hx + 0.07, y + h, o.z + o.swing * (w - 0.05))
		else:
			if not op: set_box(d.col, o.x - 0.05, y, o.z - w / 2, o.x + 0.05, y + h, o.z + w / 2)
			else: set_box(d.col, o.x, y, hz - 0.07, o.x + o.swing * (w - 0.05), y + h, hz + 0.07)
		# 当たりの箱（見る用）も合わせる
		var c = d.col; set_box(d.it.box, c.x0, c.y0, c.z0, c.x1, c.y1, c.z1)
	d.col = dyn_box(0, 0, 0, 0, 0, 0, "door", d)
	d.it = addIt({box = Box.new(), door = d,
		label = func(_it): return {t = "閉める" if d.m.tgt > 0.5 else "開ける", k = "E", n = d.name},
		act = func(): toggleDoor(d, "player"),
		use = func(it): return doorUse(d, it), useLabel = func(it): return doorUseLabel(d, it)})
	d.m = addMover({t = 0.0, spd = o.get("spd", 2.6), apply = func(tt: float) -> void:
		pivot.rotation.y = base + tt * (PI / 2) * lsw * o.hinge
		cb.call(tt)})
	DOORS.append(d)
	return d
# 外側から鍵がかかっているドアで、プレイヤーが内側にいるか
func doorInside(d: Dictionary, px: float, pz: float) -> bool:
	var o: Dictionary = d.o
	if not d.inside: return false
	return int(sgn(pz - o.z)) == d.inside if o.axis == "x" else int(sgn(px - o.x)) == d.inside
func doorLockedFor(d: Dictionary, who: String) -> bool:
	if who == "npc": return false
	if not d.lock: return false
	if d.lock == "outside": return not doorInside(d, PL.p.x, PL.p.z)
	return true
func toggleDoor(d: Dictionary, who: String, force := false) -> bool:
	if not force and d.m.tgt < 0.5: # 開けようとしている
		if who == "player":
			for b in d.blockers:
				var r = b.call()
				if r:
					toast(r); sfx("locked"); return false
			if doorLockedFor(d, "player"):
				toast(d.lockMsg if d.lockMsg else lockMsg(d.lock)); sfx("locked"); noise(PL.p.x, PL.p.y, PL.p.z, 4, "rattle"); return false
			if d.lock == "outside":
				d.lock = null; sfx("unlock")
	d.m.tgt = 0.0 if d.m.tgt > 0.5 else 1.0
	sfxDoor(d, d.m.tgt > 0.5)
	# おとなりさんが自分で開けたドアの音は、自分では調べない
	if who != "npc": noise(d.hx, d.y + 1, d.hz, 3.0 if PL.crouch > 0.5 else 6.0, "door")
	if d.onToggle: d.onToggle.call(who)
	return true
func lockMsg(l) -> String:
	if not l: return ""
	if l.begins_with("key:"): return "鍵がかかっている"
	if l == "npc": return "鍵がかかっている。こちらからは開かない"
	if l == "outside": return "鍵がかかっている。中からなら開けられそう"
	return "開かない"
func doorUse(d: Dictionary, it) -> bool:
	if d.lock and d.lock.begins_with("key:") and it.type == d.lock.substr(4):
		d.lock = null; sfx("unlock"); toast("鍵を開けた"); consumeHeld()
		if d.onUnlock: d.onUnlock.call()
		return true
	return false
func doorUseLabel(d: Dictionary, it):
	if d.lock and d.lock.begins_with("key:") and it.type == d.lock.substr(4): return "鍵を開ける"
	return null
# ---- ちょうつがいの小さな扉（戸棚・冷蔵庫など）----
# o: {x,y,z,w,h,axis,hinge,swing,mat,t,col}
func mkLeaf(o: Dictionary) -> Dictionary:
	var t: float = o.get("t", 0.03); var w: float = o.w; var h: float = o.h
	var pivot := Node3D.new(); var mb := MB.new(); var s: float = -o.hinge
	mb.box(minf(0, s * w), 0, -t / 2, maxf(0, s * w), h, t / 2, M(o.mat), 63, o.get("uv", 1.0))
	if o.get("knob", true) != false:
		var kx := s * (w - 0.06); var ky: float = o.get("ky", 0.5)
		mb.box(kx - 0.012, h * ky - 0.05, t / 2, kx + 0.012, h * ky + 0.05, t / 2 + 0.03, M(o.get("km", "chrome")))
	if o.get("deco"): o.deco.call(mb, s, w, h, t)
	pivot.add_child(mb.build())
	var base := 0.0 if o.axis == "x" else -PI / 2
	pivot.position = Vector3(o.x + o.hinge * w / 2 if o.axis == "x" else o.x, o.y, o.z if o.axis == "x" else o.z + o.hinge * w / 2)
	pivot.rotation.y = base; scene.add_child(pivot)
	var lsw: float = o.swing if o.axis == "x" else -o.swing
	var L := {o = o, pivot = pivot, m = null}
	var ang: float = o.get("ang", PI * 0.6)
	L.m = addMover({t = 0.0, spd = o.get("spd", 3.0), apply = func(tt: float) -> void:
		pivot.rotation.y = base + tt * ang * lsw * o.hinge
		if o.get("onT"): o.onT.call(tt)})
	return L
# 開け閉めできる入れ物（戸棚・冷蔵庫）：leaves をまとめて1つの「開ける」
var CABS := []
func mkCabinet(bx, leaves: Array, name: String, o := {}) -> Dictionary:
	var c := {leaves = leaves, open = false, name = name, props = [], o = o, it = null}
	CABS.append(c)
	c.it = addIt({box = bx, label = func(_it): return {t = "閉める" if c.open else "開ける", k = "E", n = name},
		act = func():
			c.open = not c.open
			for L in leaves: L.m.tgt = 1.0 if c.open else 0.0
			sfx(o.get("snd", "cab"), c.open)
			if o.get("onToggle"): o.onToggle.call(c.open)
			noise(bx.x0, bx.y0, bx.z0, 3, "cab")})
	return c
# ---- 引き出し ----
# o: {x,y,z(前面のまん中),w,h,d,dir:[nx,nz] 前の向き,mat}
var DRAWERS := []
func mkDrawer(o: Dictionary) -> Dictionary:
	var g := Node3D.new(); var mb := MB.new(); var d: float = o.get("d", 0.45); var w: float = o.w; var h: float = o.h; var fm := M(o.get("mat", "wood_m"))
	# ローカル：+Z が前
	mb.box(-w / 2, 0, -0.02, w / 2, h, 0, fm, 63, 1); mb.box(-w / 2 + 0.03, 0.02, -d, w / 2 - 0.03, 0.03, -0.02, MATS.wood_d, 63, 1); mb.box(-w / 2 + 0.03, 0.02, -d, -w / 2 + 0.05, h - 0.04, -0.02, MATS.wood_d, 63, 1); mb.box(w / 2 - 0.05, 0.02, -d, w / 2 - 0.03, h - 0.04, -0.02, MATS.wood_d, 63, 1); mb.box(-w / 2 + 0.03, 0.02, -d, w / 2 - 0.03, h - 0.04, -d + 0.02, MATS.wood_d, 63, 1)
	mb.box(-0.06, h / 2 - 0.012, 0, 0.06, h / 2 + 0.012, 0.03, M(o.get("knob", "brass")), 63, 1); g.add_child(mb.build())
	var yaw := atan2(o.dir[0], o.dir[1]); g.rotation.y = yaw; g.position = Vector3(o.x, o.y, o.z); scene.add_child(g)
	var dr := {g = g, o = o, props = [], yaw = yaw, name = o.get("name", "引き出し"), m = null, it = null}
	var bx := func() -> Box:
		var tt: float = dr.m.t if dr.m else 0.0; var ex := tt * d * 0.8
		var cx: float = o.x + o.dir[0] * ex; var cz: float = o.z + o.dir[1] * ex
		var hw := 0.04 if absf(o.dir[0]) > 0.5 else w / 2; var hd := w / 2 if absf(o.dir[0]) > 0.5 else 0.04
		return Box.new(cx - hw, o.y, cz - hd, cx + hw, o.y + h, cz + hd)
	dr.frame = func() -> Transform3D: return g.global_transform
	dr.it = addIt({box = bx.call(), label = func(_it): return {t = "閉める" if dr.m.tgt > 0.5 else "開ける", k = "E", n = dr.name},
		act = func():
			dr.m.tgt = 0.0 if dr.m.tgt > 0.5 else 1.0
			sfx("drawer", dr.m.tgt > 0.5); noise(o.x, o.y, o.z, 3, "drawer")})
	dr.m = addMover({t = 0.0, spd = 3.5, apply = func(tt: float) -> void:
		var ex := tt * d * 0.8
		g.position = Vector3(o.x + o.dir[0] * ex, o.y, o.z + o.dir[1] * ex)
		var b: Box = bx.call(); set_box(dr.it.box, b.x0, b.y0, b.z0, b.x1, b.y1, b.z1)
		for p in dr.props: updAttached(p)})
	DRAWERS.append(dr)
	return dr
# ---- 窓 ----
var WINDOWS := []
# o: {axis,x,z,y0,w,h,frame:'trim',breakable,boarded,entry}
func mkWindow(o: Dictionary) -> Dictionary:
	var t := 0.1; var fw := 0.07; var fm := M(o.get("frame", "trim"))
	var ax: bool = o.axis == "x"; var c: float = o.x if ax else o.z; var p: float = o.z if ax else o.x; var y0: float = o.y0; var y1: float = o.y0 + o.h
	var bx := func(a0: float, b0: float, c0: float, a1: float, b1: float, c1: float, m) -> void:
		if ax: box(a0, b0, c0, a1, b1, c1, m, {solid = false})
		else: box(c0, b0, a0, c1, b1, a1, m, {solid = false})
	# 枠
	bx.call(c - o.w / 2 - fw, y0 - fw, p - t, c + o.w / 2 + fw, y0, p + t, fm); bx.call(c - o.w / 2 - fw, y1, p - t, c + o.w / 2 + fw, y1 + fw, p + t, fm); bx.call(c - o.w / 2 - fw, y0, p - t, c - o.w / 2, y1, p + t, fm); bx.call(c + o.w / 2, y0, p - t, c + o.w / 2 + fw, y1, p + t, fm)
	# 窓台
	bx.call(c - o.w / 2 - fw - 0.05, y0 - fw - 0.04, p - t - 0.08, c + o.w / 2 + fw + 0.05, y0 - fw, p + t + 0.08, fm)
	var wn := {o = o, broken = not not o.get("broken"), boarded = not not o.get("boarded"), glass = null, col = null, boards = null, bars = null, it = null, onBreak = null, breakGlass = null}
	# ガラス（動かせるメッシュ）
	var gm := mesh(G.plane(o.w, o.h), MATS.glass); gm.position = Vector3(c if ax else p, y0 + o.h / 2, p if ax else c)
	if not ax: gm.rotation.y = PI / 2
	scene.add_child(gm); wn.glass = gm
	# 桟
	var bars := Node3D.new()
	var vb := mesh(G.box(0.04 if ax else 0.05, o.h, 0.05 if ax else 0.04), fm); vb.position = gm.position; bars.add_child(vb)
	var hb := mesh(G.box(o.w if ax else 0.05, 0.04, 0.05 if ax else o.w), fm); hb.position = gm.position; bars.add_child(hb)
	scene.add_child(bars); wn.bars = bars
	wn.col = dyn_box(c - o.w / 2, y0, p - 0.04, c + o.w / 2, y1, p + 0.04, "glass", wn) if ax else dyn_box(p - 0.04, y0, c - o.w / 2, p + 0.04, y1, c + o.w / 2, "glass", wn)
	wn.breakGlass = func(pr) -> void:
		if wn.broken or wn.boarded or not o.get("breakable"): return
		setBroken(wn, true); spawnShards(gm.position.x, gm.position.y, gm.position.z, "#bfe4f4", 26); sfxGlass(gm.position, 1)
		noise(gm.position.x, gm.position.y, gm.position.z, 26, "glass")
		if pr: pr.v *= 0.45
		if wn.onBreak: wn.onBreak.call()
	wn.it = addIt({box = Box.new(c - o.w / 2, y0, p - 0.1, c + o.w / 2, y1, p + 0.1) if ax else Box.new(p - 0.1, y0, c - o.w / 2, p + 0.1, y1, c + o.w / 2),
		label = func(_it):
			if wn.boarded: return {t = "板が打ちつけてある", k = "", n = "窓"}
			if not wn.broken: return {t = "物を投げると割れそう", k = "", n = "窓"} if o.get("breakable") else null
			return null,
		act = func():
			if wn.boarded: toast("板はしっかり打ちつけてある。バールでもはがせない"),
		use = func(it):
			if it.type == "crowbar" and wn.boarded:
				toast("板はしっかり打ちつけてある。バールでもはがせない"); return true
			return false,
		useLabel = func(it): return "はがす？" if it.type == "crowbar" and wn.boarded else null})
	setBroken(wn, wn.broken)
	if wn.boarded: boardWindow(wn, true)
	WINDOWS.append(wn)
	return wn
func setBroken(w: Dictionary, b: bool) -> void:
	w.broken = b; w.glass.visible = not b; w.bars.visible = not b; w.col.on = not b or w.boarded; w.col.s = "wood" if w.boarded else "glass"
func boardWindow(w: Dictionary, on: bool) -> void:
	var o: Dictionary = w.o; var ax: bool = o.axis == "x"
	if on and not w.boards:
		var g := Node3D.new(); var c: float = o.x if ax else o.z; var p: float = o.z if ax else o.x
		for i in 3:
			var m := mesh(G.box(o.w + 0.3, 0.16, 0.04), MATS.raw, true)
			m.position = Vector3(c if ax else p + 0.1 * o.get("side", 1), o.y0 + o.h * (0.2 + 0.3 * i), p + 0.1 * o.get("side", 1) if ax else c)
			m.rotation_order = EULER_ORDER_XYZ
			m.rotation = Vector3(0, 0 if ax else PI / 2, (i - 1) * 0.12)
			g.add_child(m)
		scene.add_child(g); w.boards = g
	w.boarded = on
	if w.boards: w.boards.visible = on
	w.col.on = on or not w.broken; w.col.s = "wood" if on else "glass"
# ---- はしご ----
var LADDERS := []
# x0..x1,z0..z1 登れる範囲（はしごの前）、y0..y1、face=[nx,nz] はしごから外への向き
func mkLadder(x: float, z: float, y0: float, y1: float, face: Array, o := {}) -> Dictionary:
	var w := 0.5; var ax := absf(face[1]) > 0.5 # 壁がX方向にそっている
	var mat = o.get("mat", "metal_dark")
	var rail := func(dx: float, dz: float) -> void: box(x + dx - 0.03, y0, z + dz - 0.03, x + dx + 0.03, y1, z + dz + 0.03, mat, {solid = false})
	if ax:
		rail.call(-w / 2, 0); rail.call(w / 2, 0)
		var y := y0 + 0.3
		while y < y1:
			box(x - w / 2, y, z - 0.02, x + w / 2, y + 0.035, z + 0.02, mat, {solid = false}); y += 0.3
	else:
		rail.call(0, -w / 2); rail.call(0, w / 2)
		var y := y0 + 0.3
		while y < y1:
			box(x - 0.02, y, z - w / 2, x + 0.02, y + 0.035, z + w / 2, mat, {solid = false}); y += 0.3
	var L := {x = x, z = z, y0 = y0, y1 = y1, face = face, box = Box.new(
		x - (w / 2 if ax else 0.0) + (0.0 if ax else minf(0, face[0] * 0.6)), y0 - 0.1,
		z - (0.0 if ax else w / 2) + (minf(0, face[1] * 0.6) if ax else 0.0),
		x + (w / 2 if ax else 0.0) + (0.0 if ax else maxf(0, face[0] * 0.6)), y1 + 0.9,
		z + (0.0 if ax else w / 2) + (maxf(0, face[1] * 0.6) if ax else 0.0))}
	LADDERS.append(L)
	return L
# ---- 隠れる場所 ----
var HIDES := []
func mkHide(o: Dictionary) -> Dictionary:
	var h := {pos = o.pos, yaw = o.yaw, box = o.box, cab = o.get("cab"), name = o.get("name", "クローゼット"), out = o.out, under = o.get("under", false), nb = null, it = null}
	h.it = addIt({box = o.box, label = func(_it): return {t = "隠れる", k = "E", n = h.name}, act = func(): enterHide(h)})
	HIDES.append(h)
	return h
# ---- パーティクル ----
var PFX := {}
const PFX_N := 900
func initPFX() -> void:
	for k in ["n", "a"]:
		var sh := Shader.new()
		sh.code = """shader_type spatial;
render_mode unshaded, depth_draw_never, cull_disabled, %s;
varying vec4 vC;
void vertex(){
	vC = COLOR;
	float s = INSTANCE_CUSTOM.x;
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
	VERTEX *= s;
}
void fragment(){
	vec2 d = UV - 0.5; float r = length(d);
	if (r > 0.5) discard;
	ALBEDO = vC.rgb; ALPHA = vC.a * smoothstep(0.5, 0.15, r);
}""" % ("blend_add" if k == "a" else "blend_mix")
		var mat := ShaderMaterial.new(); mat.shader = sh
		var qm := QuadMesh.new(); qm.size = Vector2(1.38, 1.38); qm.material = mat
		var mm := MultiMesh.new(); mm.transform_format = MultiMesh.TRANSFORM_3D; mm.use_colors = true; mm.use_custom_data = true; mm.mesh = qm; mm.instance_count = PFX_N; mm.visible_instance_count = 0
		var mi := MultiMeshInstance3D.new(); mi.multimesh = mm; mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mi.custom_aabb = AABB(Vector3(-500, -500, -500), Vector3(1000, 1000, 1000))
		scene.add_child(mi)
		PFX[k] = {mi = mi, mm = mm, list = []}
func part(kind: String, x: float, y: float, z: float, vx: float, vy: float, vz: float, life: float, size: float, col, alpha := 1.0, grav := 0.0, grow := 0.0) -> void:
	var s = PFX.get(kind)
	if not s or s.list.size() >= PFX_N: return
	var c: Color = Color.html(col) if col is String else col
	s.list.append({x = x, y = y, z = z, vx = vx, vy = vy, vz = vz, life = life, t = 0.0, size = size, c = c, a = alpha, grav = grav, grow = grow, floor = -1e9})
func updPFX(dt: float) -> void:
	for k in ["n", "a"]:
		var s = PFX.get(k)
		if not s: continue
		var L: Array = s.list
		for i in range(L.size() - 1, -1, -1):
			var q = L[i]; q.t += dt
			if q.t >= q.life: L.remove_at(i)
		var n := 0; var mm: MultiMesh = s.mm
		for q in L:
			q.vy -= q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt
			if q.grav and q.y < q.floor:
				q.y = q.floor; q.vy *= -0.3; q.vx *= 0.5; q.vz *= 0.5
			var f: float = q.t / q.life
			mm.set_instance_transform(n, Transform3D(Basis(), Vector3(q.x, q.y, q.z)))
			var c: Color = q.c; c.a = q.a * (1 - f * f)
			mm.set_instance_color(n, c)
			mm.set_instance_custom_data(n, Color(q.size * (1 + q.grow * f), 0, 0, 0))
			n += 1
		mm.visible_instance_count = n
func spawnShards(x: float, y: float, z: float, col, n: int) -> void:
	for i in n:
		var a := RND() * TAU
		part("n", x + rr(-0.3, 0.3), y + rr(-0.3, 0.3), z + rr(-0.3, 0.3), cos(a) * rr(0.5, 3), rr(0, 3), sin(a) * rr(0.5, 3), rr(0.8, 1.6), rr(0.02, 0.05), col, 0.9, 12)
		if PFX.n.list.size(): PFX.n.list[-1].floor = groundAt(x, y, z)
func puff(x: float, y: float, z: float, col, n := 6, sz := 0.25, life := 1.2, up := 0.6) -> void:
	for i in n: part("n", x + rr(-0.1, 0.1), y + rr(-0.1, 0.1), z + rr(-0.1, 0.1), rr(-0.3, 0.3), rr(0.2, up), rr(-0.3, 0.3), rr(life * 0.6, life), sz * rr(0.7, 1.2), col, 0.55, 0, 1.5)
func flame(x: float, y: float, z: float, s := 1.0) -> void:
	part("a", x + rr(-0.08, 0.08) * s, y, z + rr(-0.08, 0.08) * s, rr(-0.2, 0.2), rr(0.8, 1.6) * s, rr(-0.2, 0.2), rr(0.3, 0.6), rr(0.12, 0.22) * s, "#ff9a30" if RND() < 0.5 else "#ff5a10", 0.9, 0, -0.5)
func groundAt(x: float, y: float, z: float) -> float:
	var best := -1.0
	for b in gather(x - 0.05, z - 0.05, x + 0.05, z + 0.05):
		if b.x0 <= x and b.x1 >= x and b.z0 <= z and b.z1 >= z and b.y1 <= y + 0.05 and b.y1 > best: best = b.y1
	return best
