
# ================= アルファ1の仕掛け =================
# ---- 新しい持ち物 ----
func initPropDefsA1() -> void:
	pdef("key_red", {name = "赤い取っ手の鍵", hx = 0.08, h = 0.03, hz = 0.04, w = 0.1, mk = func(b: MB): b.box(-0.08, 0, -0.03, -0.02, 0.025, 0.03, M("red")); b.box(-0.02, 0.005, -0.007, 0.08, 0.02, 0.007, M("brass")); b.box(0.05, 0.005, 0.007, 0.06, 0.02, 0.02, M("brass")); b.box(0.07, 0.005, 0.007, 0.075, 0.02, 0.016, M("brass"))})
	pdef("bell", {name = "ベル", hx = 0.07, h = 0.16, hz = 0.07, w = 0.4, mk = func(b: MB): b.cyl(0, 0.02, 0, 0.07, 0.1, M("brass"), 14, {rt = 0.035}); b.sphere(0, 0.12, 0, 0.035, M("brass")); b.cyl(0, 0.14, 0, 0.012, 0.03, M("wood_d"), 6); b.sphere(0, 0.005, 0, 0.02, M("metal_dark"))})
	pdef("shovel", {name = "シャベル", hx = 0.13, h = 1.1, hz = 0.05, w = 1.2, mk = func(b: MB):
		b.cyl(0, 0.32, 0, 0.018, 0.72, M("wood_m"), 6); b.box(-0.1, 1.02, -0.012, 0.1, 1.06, 0.012, M("black")); b.box(-0.1, 1.02, -0.01, -0.085, 1.1, 0.01, M("black")); b.box(0.085, 1.02, -0.01, 0.1, 1.1, 0.01, M("black")); b.box(-0.1, 1.08, -0.01, 0.1, 1.1, 0.01, M("black"))
		b.rbox(0, 0.14, 0, 0.22, 0.26, 0.02, 0, 0, 0, M("metal")); b.rbox(0, 0.02, 0, 0.16, 0.06, 0.02, 0, 0, 0, M("metal"))})
	pdef("mannequin", {name = "先生のマネキン", hx = 0.25, h = 1.65, hz = 0.2, w = 3, solid = true, mk = func(b: MB):
		b.cyl(0, 0, 0, 0.2, 0.04, M("wood_d"), 12); b.cyl(0, 0.04, 0, 0.025, 0.45, M("wood_d"), 6); b.cyl(0, 0.45, 0, 0.25, 0.5, M("brown"), 14, {rt = 0.18}); b.cyl(0, 0.95, 0, 0.19, 0.45, M("fab_w"), 14, {rt = 0.2})
		b.sphere(0, 1.46, 0, 0.1, M("skinm"), 1, 1.2, 1); b.sphere(0, 1.54, -0.06, 0.07, M("black")); b.cyl(0, 1.36, 0, 0.04, 0.08, M("skinm"), 6)
		for s in [-1, 1]:
			b.rbox(s * 0.24, 1.1, 0, 0.07, 0.4, 0.07, 0, 0, s * 0.25, M("fab_w")); b.rbox(s * 0.29, 0.85, 0.08, 0.06, 0.3, 0.06, -0.6, 0, s * 0.1, M("skinm"))})
	for cc in [["0", "#e04030"], ["1", "#30a050"], ["2", "#e0a020"], ["3", "#3070d0"], ["4", "#9040c0"], ["5", "#40c0c0"], ["6", "#e06090"], ["7", "#30a050"], ["8", "#e04030"], ["9", "#e0a020"], ["A", "#e04030"], ["F", "#e0a020"]]:
		var ch: String = cc[0]
		pdef("mag_" + ch, {name = "マグネット「" + ch + "」", hx = 0.09, h = 0.03, hz = 0.11, w = 0.15, digit = int(ch) if ch.is_valid_int() else null, ch = ch, mk = func(b: MB):
			var tm := digitMat(ch)
			# 上の面だけ数字の絵（three.js の箱の6面の素材のかわり）
			b.box(-0.09, 0, -0.11, 0.09, 0.03, 0.11, MATS.cab, 1 | 2 | 8 | 16 | 32)
			var g := G.plane(0.18, 0.22)
			b.geo(g, Transform3D(Basis(Vector3.RIGHT, -PI / 2), Vector3(0, 0.0301, 0)), tm, 1, 1)})
	pdef("toyrifle", {name = "おもちゃの銃", hx = 0.5, h = 0.12, hz = 0.06, w = 1, mk = func(b: MB): b.box(-0.5, 0.02, -0.035, -0.1, 0.1, 0.035, M("orange")); b.box(-0.1, 0.04, -0.02, 0.45, 0.08, 0.02, M("can_g")); b.box(-0.3, -0.06, -0.02, -0.22, 0.04, 0.02, M("orange")); b.cyl(0.45, 0.06, 0, 0.02, 0.04, M("red"), 8, {axis = "x"})})
	pdef("silverkey", {name = "銀の鍵", hx = 0.08, h = 0.02, hz = 0.04, w = 0.1, key = true, mk = func(b: MB): b.cyl(-0.05, 0, 0, 0.03, 0.012, M("silver"), 12); b.box(-0.02, 0, -0.008, 0.08, 0.012, 0.008, M("silver")); b.box(0.05, 0, 0.008, 0.06, 0.012, 0.022, M("silver"))})
	pdef("copperkey", {name = "ハートの銅の鍵", hx = 0.08, h = 0.02, hz = 0.05, w = 0.1, key = true, mk = func(b: MB):
		for s in [-1, 1]: b.cyl(-0.05, 0, s * 0.018, 0.026, 0.012, M("copper"), 12)
		b.rbox(-0.03, 0.006, 0, 0.04, 0.012, 0.04, 0, PI / 4, 0, M("copper")); b.box(-0.01, 0, -0.008, 0.08, 0.012, 0.008, M("copper")); b.box(0.05, 0, 0.008, 0.06, 0.012, 0.022, M("copper"))})
	pdef("lockpick", {name = "ピッキング道具", hx = 0.1, h = 0.02, hz = 0.03, w = 0.1, mk = func(b: MB): b.box(-0.1, 0, -0.02, -0.02, 0.02, 0.02, M("black")); b.box(-0.02, 0.008, -0.004, 0.1, 0.012, 0.004, M("chrome")); b.box(-0.02, 0.004, 0.008, 0.08, 0.008, 0.012, M("chrome"))})
	pdef("hammer", {name = "ハンマー", hx = 0.16, h = 0.05, hz = 0.08, w = 0.7, mk = func(b: MB): b.box(-0.16, 0.01, -0.015, 0.12, 0.04, 0.015, M("wood_m")); b.box(0.1, 0, -0.07, 0.16, 0.05, 0.05, M("metal_dark")); b.rbox(0.13, 0.025, 0.07, 0.04, 0.04, 0.05, 0, 0, 0, M("metal_dark"))})
	pdef("jackhammer", {name = "削岩機", hx = 0.2, h = 0.95, hz = 0.12, w = 2, mk = func(b: MB): b.cyl(0, 0.05, 0, 0.015, 0.25, M("chrome"), 6); b.cyl(0, 0.3, 0, 0.09, 0.4, M("red"), 12); b.box(-0.07, 0.7, -0.08, 0.07, 0.78, 0.08, M("black")); b.cyl(0, 0.84, 0, 0.02, 0.35, M("black"), 6, {axis = "x"}); b.box(-0.2, 0.8, -0.02, -0.15, 0.88, 0.02, M("black")); b.box(0.15, 0.8, -0.02, 0.2, 0.88, 0.02, M("black"))})
	pdef("alarm", {name = "目覚まし時計", hx = 0.07, h = 0.15, hz = 0.05, w = 0.3, tool = "alarm", mk = PDEF.clock.mk})
	pdef("paper", {name = "紙くず", hx = 0.04, h = 0.07, hz = 0.04, w = 0.05, mk = func(b: MB): b.sphere(0, 0.035, 0, 0.035, M("cream"), 1, 1, 1, 6)})
	pdef("tire", {name = "タイヤ", hx = 0.35, h = 0.25, hz = 0.35, w = 1.5, bouncy = true, mk = func(b: MB): b.cyl(0, 0, 0, 0.35, 0.25, M("tire"), 14); b.cyl(0, -0.01, 0, 0.16, 0.27, M("chrome"), 10)})
	pdef("broom", {name = "ほうき", hx = 0.12, h = 1.3, hz = 0.05, w = 0.6, mk = func(b: MB): b.cyl(0, 0.35, 0, 0.015, 0.95, M("wood_m"), 6); b.box(-0.12, 0, -0.03, 0.12, 0.35, 0.03, M("straw"))})
	pdef("bulb_w", {name = "電球（長い白）", hx = 0.03, h = 0.3, hz = 0.03, w = 0.1, glass = true, mk = func(b: MB): b.cyl(0, 0.03, 0, 0.025, 0.27, M("bulbw"), 8); b.cyl(0, 0, 0, 0.02, 0.04, M("chrome"), 8)})
	pdef("bulb_r", {name = "電球（赤）", hx = 0.03, h = 0.2, hz = 0.03, w = 0.1, glass = true, mk = func(b: MB): b.cyl(0, 0.03, 0, 0.025, 0.17, M("bulbr"), 8); b.cyl(0, 0, 0, 0.02, 0.04, M("chrome"), 8)})
var _dig := {}
func digitMat(ch: String) -> Material:
	if not _dig.has(ch): _dig[ch] = std_mat({map = load("res://assets/canvas/dig_%s.png" % ch), rough = 0.6})
	return _dig[ch]
# ================= 水とサメトロン =================
var SHARK := {p = Vector3(-6, WS - 0.25, 27), yaw = 0.0, ang = 0.0, g = null, prop = null, mode = "circle", cool = 0.0}
func buildShark() -> void:
	var g := Node3D.new(); var mb := MB.new() # 機械の胴体（水の下）
	mb.cyl(0, 0, 0, 0.36, 1.6, MATS.shark, 14, {axis = "z", rt = 0.24}); mb.sphere(0, 0, 0.8, 0.3, MATS.shark, 1, 0.9, 1.2); mb.box(-0.4, -0.08, -0.3, 0.4, 0.08, 0.3, MATS.metal_dark)
	# ひれ（水の上に出る）
	mb.rbox(0, 0.55, -0.1, 0.06, 0.7, 0.55, 0.45, 0, 0, MATS.shark); mb.rbox(0, 0.12, -0.95, 0.05, 0.5, 0.35, -0.5, 0, 0, MATS.shark)
	# 目（赤いランプ）
	mb.sphere(-0.18, 0.12, 1, 0.05, MATS.bulbr); mb.sphere(0.18, 0.12, 1, 0.05, MATS.bulbr); g.add_child(mb.build())
	# 前のトラバサミ
	var tr := MB.new(); tr.cyl(0, 0, 1.18, 0.22, 0.03, MATS.metal_dark, 14, null, "z")
	for i in 9:
		var a := i / 8.0 * PI; tr.box(cos(a) * 0.2 - 0.012, -0.04, 1.2 - 0.012, cos(a) * 0.2 + 0.012, 0.04 + sin(a) * 0.14, 1.2 + 0.012, MATS.metal)
	g.add_child(tr.build())
	# プロペラ
	var pr := Node3D.new(); var pm := MB.new()
	for i in 3: pm.rbox(0, 0, 0, 0.05, 0.42, 0.02, 0, 0, i * TAU / 3, MATS.brass)
	pr.add_child(pm.build()); pr.position.z = -1.05; g.add_child(pr); SHARK.prop = pr
	g.position = SHARK.p; scene.add_child(g); SHARK.g = g
const POOL := {x0 = -10.0, x1 = -2.0, z0 = 22.0, z1 = 32.0}
func inPool(x: float, z: float, m := 0.0) -> bool: return x > POOL.x0 + m and x < POOL.x1 - m and z > POOL.z0 + m and z < POOL.z1 - m
func playerInWater() -> bool: return not A.water.frozen and inPool(PL.p.x, PL.p.z) and PL.p.y < WS - 0.05 and PL.p.y > 2.5
func updShark(dt: float) -> void:
	if not SHARK.g: return
	var S := SHARK
	if A.water.frozen:
		S.g.position.y = damp(S.g.position.y, WS - 0.12, 3, dt); return
	S.prop.rotation.z += dt * 14; S.cool -= dt; var inW := playerInWater()
	var near: bool = not inW and absf(PL.p.y - F2) < 0.6 and Vector2(clampf(PL.p.x, POOL.x0, POOL.x1) - PL.p.x, clampf(PL.p.z, POOL.z0, POOL.z1) - PL.p.z).length() < 1.5 and inPool(PL.p.x, PL.p.z, -1.6)
	var tx: float; var tz: float; var sp: float
	if inW:
		tx = PL.p.x; tz = PL.p.z; sp = 4.6
		if S.mode != "hunt":
			S.mode = "hunt"; sfx("sharkgo")
	elif near:
		S.ang += dt * 1.6; tx = clampf(PL.p.x, POOL.x0 + 1, POOL.x1 - 1) + cos(S.ang * 2.3) * 1.2; tz = clampf(PL.p.z, POOL.z0 + 1, POOL.z1 - 1) + sin(S.ang * 1.7) * 1.2; sp = 3.2; S.mode = "near"
	else:
		S.ang += dt * 0.55; tx = -6 + cos(S.ang) * 2.6; tz = 27 + sin(S.ang) * 3.3; sp = 2.3; S.mode = "circle"
	var dx: float = tx - S.p.x; var dz: float = tz - S.p.z; var d := Vector2(dx, dz).length()
	if d > 0.05:
		var ty := atan2(dx, dz); S.yaw = damp_ang(S.yaw, ty, 6.0 if S.mode == "hunt" else 2.5, dt); var st := minf(d, sp * dt); S.p.x += sin(S.yaw) * st; S.p.z += cos(S.yaw) * st
	S.p.x = clampf(S.p.x, POOL.x0 + 0.7, POOL.x1 - 0.7); S.p.z = clampf(S.p.z, POOL.z0 + 0.9, POOL.z1 - 0.9); S.g.position = Vector3(S.p.x, WS - 0.3 + sin(GT * 3) * 0.03, S.p.z); S.g.rotation.y = S.yaw
	if RND() < dt * 6: part("n", S.p.x - sin(S.yaw) * 1.1, WS + 0.02, S.p.z - cos(S.yaw) * 1.1, rr(-0.3, 0.3), 0.4, rr(-0.3, 0.3), 0.6, 0.12, "#dff4ff", 0.7, 0, 1)
	if inW and Vector2(PL.p.x - S.p.x, PL.p.z - S.p.z).length() < 1.1 and S.cool <= 0 and STATE == "play":
		S.cool = 3.0; sharkCatch()
func sharkCatch() -> void:
	sfx("trap"); sfx("splash"); PL.frozen = true; ui_cls("trapFx", "on", true); toast("サメトロンにつかまった！", 2.5); await wait(0.8); await fadeOut(0.4); ui_cls("trapFx", "on", false)
	# おとなりさんの家から追い出される
	teleportPlayer(0, 0.07, 9.2, PI); PL.frozen = false; await wait(0.3); await fadeIn(0.5)
# 凍らせる
func setFrozen(f: bool) -> void:
	A.water.frozen = f; A.water.m.mesh.surface_set_material(0, MATS.ice2 if f else MATS.wtr); A.water.ice.on = f
	if f and playerInWater(): PL.p.y = 3.5
	if f: toast("水が凍った！ サメトロンが動けなくなった", 3)
	else: toast("氷がとけていく……")
# ================= エレベーター =================
var ELEV := {y = F1, floor = 1, tgt = 1, state = "idle", t = 0.0, g = null, col = null, doors = [], openT = 0.0, busy = false, calls = [], panelIt = null}
func buildElevator() -> void:
	var g := Node3D.new(); var mb := MB.new(); mb.box(2.1, 0, 19.1, 4.1, 0.1, 21.3, MATS.metal_dark); mb.box(4.05, 0.1, 19.1, 4.1, 2.4, 21.3, MATS.wood_d); mb.box(2.1, 0.1, 19.1, 4.1, 2.4, 19.15, MATS.wood_d); mb.box(2.1, 0.1, 21.25, 4.1, 2.4, 21.3, MATS.wood_d); mb.box(2.1, 2.4, 19.1, 4.1, 2.45, 21.3, MATS.wood_d)
	mb.box(4.02, 1.1, 20.9, 4.05, 1.5, 21.15, MATS.brass); var lg := mb.build(); g.add_child(lg)
	var lamp := mesh(G.box(0.5, 0.03, 0.5), MATS.bulb); lamp.position = Vector3(3.1, 2.39, 20.2); g.add_child(lamp)
	# ボタン
	var panel := mesh(G.plane(0.2, 0.3), std_mat({map = tex("c91"), emissive = "#403010", ei = 1.0})); panel.position = Vector3(4.015, 1.3, 21.02); panel.rotation.y = -PI / 2; g.add_child(panel)
	g.position.y = F1 - 0.1; scene.add_child(g); ELEV.g = g; ELEV.col = dyn_box(2.1, F1 - 0.1, 19.1, 4.1, F1, 21.3, "metal", null)
	# 各階の戸（引き戸）
	for fy in [[1, F1], [2, F2]]:
		var fl: int = fy[0]; var y: float = fy[1]
		var d := mesh(G.box(0.06, 2.25, 1.2), MATS.metal, true); d.position = Vector3(2.02, y + 1.125, 20.2); scene.add_child(d)
		var col := dyn_box(1.98, y, 19.6, 2.06, y + 2.25, 20.8, "metal", null); ELEV.doors.append({fl = fl, y = y, d = d, col = col, open = 0.0})
		# 呼びボタン
		box(1.9, y + 1.1, 20.95, 1.93, y + 1.4, 21.15, "brass", {solid = false})
		addIt({box = Box.new(1.7, y + 1, 20.85, 1.95, y + 1.5, 21.25), label = func(_it): return {t = "エレベーターを呼ぶ", k = "E", n = "%d階" % fl}, act = func():
			callElev(fl); sfx("click")})
		signp(1.93, y + 2.45, 20.2, 0.3, 0.18, "yellow", -PI / 2)
	ELEV.panelIt = addIt({box = Box.new(3.8, 0, 20.8, 4.1, 0, 21.25), label = func(_it): return {t = ("2" if ELEV.floor == 1 else "1") + "階へ", k = "E", n = "エレベーターのボタン"} if ELEV.state == "idle" else null,
		act = func():
			if ELEV.state == "idle":
				callElev(2 if ELEV.floor == 1 else 1); sfx("click")})
func callElev(fl: int) -> void:
	if ELEV.tgt == fl and ELEV.state != "idle": return
	if ELEV.floor == fl and ELEV.state == "idle":
		ELEV.openT = 4.0; return
	ELEV.tgt = fl; ELEV.state = "closing"; ELEV.t = 0.0
func updElevator(dt: float) -> void:
	var E := ELEV
	if not E.g: return
	if E.state == "closing":
		E.t += dt
		if E.t > 0.7:
			E.state = "moving"; sfx("elev")
	elif E.state == "moving":
		var ty := F1 if E.tgt == 1 else F2; var d: float = ty - E.y; var st := 1.1 * dt
		E.y = ty if absf(d) <= st else E.y + sgn(d) * st
		if E.y == ty:
			E.floor = E.tgt; E.state = "idle"; E.openT = 5.0; sfx("ding")
	elif E.state == "idle": E.openT -= dt
	E.g.position.y = E.y - 0.1; set_box(E.col, 2.1, E.y - 0.1, 19.1, 4.1, E.y, 21.3); E.panelIt.box.y0 = E.y + 1; E.panelIt.box.y1 = E.y + 1.6
	for D in E.doors:
		var want := 1.0 if E.state == "idle" and E.floor == D.fl else 0.0
		D.open = damp(D.open, want, 6, dt); D.d.position.z = 20.2 - D.open * 1.15; D.col.on = D.open < 0.6
# ================= 汽車（家のまわりを回る）=================
var TRAIN := {cars = [], s = 0.0, path = [], len = 0.0, seg = [], chuff = 0.0}
func buildTrain() -> void: # 線路（角の丸い四角）
	var x0 := -19.5; var x1 := 19.5; var z0 := 8.2; var z1 := 38.0; var r := 3.0; var P := []
	var arc := func(cx: float, cz: float, a0: float) -> void:
		for i in 7:
			var a := a0 + i / 6.0 * PI / 2; P.append(Vector3(cx + cos(a) * r, 0, cz + sin(a) * r))
	arc.call(x1 - r, z0 + r, -PI / 2); arc.call(x1 - r, z1 - r, 0); arc.call(x0 + r, z1 - r, PI / 2); arc.call(x0 + r, z0 + r, PI); P.append(P[0])
	TRAIN.path = P; var L := 0.0; TRAIN.seg = []
	for i in P.size() - 1:
		var l: float = P[i].distance_to(P[i + 1]); TRAIN.seg.append({a = P[i], b = P[i + 1], l = l, s = L}); L += l
	TRAIN.len = L
	for s in TRAIN.seg:
		var dx: float = s.b.x - s.a.x; var dz: float = s.b.z - s.a.z; var yaw := atan2(dx, dz); var n := maxi(1, roundi(s.l / 0.6))
		for i in n:
			var t := (i + 0.5) / n; rbox(s.a.x + dx * t, 0.04, s.a.z + dz * t, 1.2, 0.06, 0.16, 0, yaw, 0, "beam")
		var px := cos(yaw); var pz := -sin(yaw)
		for o in [-0.35, 0.35]: rbox((s.a.x + s.b.x) / 2 + px * o, 0.1, (s.a.z + s.b.z) / 2 + pz * o, 0.05, 0.06, s.l + 0.05, 0, yaw, 0, "metal_dark")
	var mk := func(kind: String) -> Dictionary:
		var g := Node3D.new(); var mb := MB.new()
		if kind == "loco":
			mb.box(-0.45, 0.25, -0.8, 0.45, 0.75, 0.8, MATS.red); mb.cyl(0, 0.9, 0.25, 0.35, 1.1, MATS.black, 12, {axis = "z"}); mb.box(-0.45, 0.75, -0.8, 0.45, 1.45, -0.2, MATS.red); mb.box(-0.5, 1.45, -0.85, 0.5, 1.52, -0.15, MATS.black); mb.cyl(0, 1.35, 0.55, 0.1, 0.35, MATS.black, 8); mb.box(-0.3, 0.9, -0.21, 0.3, 1.2, -0.19, MATS.glassd); mb.box(-0.5, 0.2, 0.8, 0.5, 0.35, 0.9, MATS.black)
		else:
			mb.box(-0.45, 0.25, -0.7, 0.45, 0.85, 0.7, MATS[kind]); mb.box(-0.47, 0.85, -0.72, 0.47, 0.9, 0.72, MATS.wood_d)
		for z in [-0.45, 0.45]:
			for x in [-0.47, 0.47]: mb.cyl(x, 0.2, z, 0.18, 0.08, MATS.black, 10, null, "x")
		g.add_child(mb.build()); set_cast(g, true); scene.add_child(g)
		return {g = g, col = dyn_box(0, 0, 0, 0, 0, 0, "metal", null)}
	TRAIN.cars = [mk.call("loco"), mk.call("yellow"), mk.call("blue")]
func trainAt(s: float) -> Vector2:
	s = fposmod(s, TRAIN.len)
	for g in TRAIN.seg:
		if s <= g.s + g.l:
			var t: float = (s - g.s) / g.l
			return Vector2(g.a.x + (g.b.x - g.a.x) * t, g.a.z + (g.b.z - g.a.z) * t)
	return Vector2()
func updTrain(dt: float) -> void:
	if not TRAIN.cars.size(): return
	TRAIN.s += dt * 2.3
	for i in TRAIN.cars.size():
		var c = TRAIN.cars[i]; var s: float = TRAIN.s - i * 1.9; var a := trainAt(s + 0.6); var b := trainAt(s - 0.6); var x := (a.x + b.x) / 2; var z := (a.y + b.y) / 2
		c.g.position = Vector3(x, 0, z); c.g.rotation.y = atan2(a.x - b.x, a.y - b.y); set_box(c.col, x - 0.6, 0, z - 0.6, x + 0.6, 1.5, z + 0.6)
	var L: Vector3 = TRAIN.cars[0].g.position; TRAIN.chuff += dt
	if TRAIN.chuff > 0.45:
		TRAIN.chuff = 0.0; sfxTrain(L)
	if RND() < dt * 0.03: sfxWhistle(L)
# ================= 教室：数字パズルと紙くず =================
func putSlot(S: Dictionary, it: Dictionary) -> void:
	PL.inv[PL.sel] = null; drawInv(); S.v = it; it.st = "att"; it.noPick = true; it.grp.visible = true; it.p = Vector3(9.74, S.y - 0.11, S.z); it.grp.position = Vector3(9.74, S.y, S.z); it.grp.rotation_order = EULER_ORDER_XYZ; it.grp.rotation = Vector3(0, 0, PI / 2)
	for c in it.grp.get_children(): c.position = Vector3()
	sfx("pick"); checkBoard()
func takeSlot(S: Dictionary) -> void:
	var it = S.v; S.v = null; it.noPick = false; it.st = "rest"; detachProp(it); pickUp(it)
func teacherPlaced() -> bool:
	var m = P.get("teacher")
	return m != null and m.st == "rest" and Vector2(m.p.x - A.teachSpot.x, m.p.z - A.teachSpot.z).length() < 2.6 and absf(m.p.y - F2) < 0.4
func slotsAll(fn: Callable) -> bool:
	for S in A.slots:
		if not fn.call(S): return false
	return true
func checkBoard() -> void:
	if A.get("rifleGiven"): return
	var ok := slotsAll(func(S): return S.v != null and S.v.d.digit == S.ans)
	if ok and teacherPlaced():
		A.rifleGiven = true; sfx("ding"); toast("正解！ ……先生の机に何か出てきた"); var r = P.rifle; setPropHidden(r, false); r.noPick = false; propRestAt(r, 8.55, F2 + 0.78, 16.5, PI / 2)
		if story.get("onBoard2"): story.onBoard2.call()
	elif slotsAll(func(S): return S.v != null):
		if not ok:
			sfx("deny"); toast("ちがうみたいだ……")
		else: toast("先生がいないと、答え合わせしてくれないみたいだ")
var paperT := 2.0
func updClassroom(dt: float) -> void:
	if not inClass(PL.p): return
	if not A.get("rifleGiven") and teacherPlaced():
		if slotsAll(func(S): return S.v != null): checkBoard()
	if teacherPlaced(): return
	paperT -= dt
	if paperT <= 0: # 紙くずが飛んでくる
		paperT = rr(1.2, 2.4)
		var sx := rr(3.2, 6.4); var sz := rr(14.8, 18); var sy := F2 + 1; var pr := spawnPaper(sx, sy, sz)
		var dx: float = PL.p.x - sx; var dy: float = PL.p.y + 1.3 - sy; var dz: float = PL.p.z - sz; var d := Vector2(dx, dz).length(); var T := d / 8
		propDropAt(pr, sx, sy, sz, 0, Vector3(dx / T, dy / T + 9 * T, dz / T)); pr.thrown = true; sfx("throw", 0.2)
func inClass(p: Vector3) -> bool: return p.x > 2 and p.x < 10 and p.z > 14 and p.z < 19 and p.y > 3.2 and p.y < 6.3
var PAPERS := []
func spawnPaper(x: float, y: float, z: float) -> Dictionary:
	var pr = null
	for p in PAPERS:
		if p.st == "rest" and p.get("pooled"):
			pr = p; break
	if pr == null:
		if PAPERS.size() >= 10: pr = PAPERS.pop_front()
		else:
			pr = spawnProp("paper", x, y, z, 0); pr.pooled = true
		PAPERS.append(pr)
	return pr
# ================= 射的場 =================
func nearStand() -> bool:
	return A.get("stand") != null and A.stand.has and absf(PL.p.y - F2) < 0.5 and PL.p.x > 2 and PL.p.x < 3.3 and absf(PL.p.z - 24.2) < 1.6
func updRange(dt: float) -> void:
	if not A.get("stand"): return
	for T in A.targets:
		if not A.stand.on: T.up = damp(T.up, 0, 5, dt)
		else:
			T.t -= dt
			if T.t <= 0:
				if T.get("state") == "up":
					T.state = "down"; T.t = rr(1, 3)
				else:
					T.state = "up"; T.hit = false; T.t = rr(1.4, 2.4); sfx("clack")
			T.up = damp(T.up, 1.0 if T.get("state") == "up" and not T.hit else 0.0, 10, dt)
		T.g.rotation.z = (1 - T.up) * PI / 2 * 0.98
func shootRange() -> void:
	if not A.stand.on:
		toast("電気が来ていない。分電盤を見てみよう"); return
	sfx("pop"); PL.swing = 0.3; var ro := camPos(); var rd := lookDir()
	if rd.x <= 0: return
	var t := (5.4 - ro.x) / rd.x; var y := ro.y + rd.y * t; var z := ro.z + rd.z * t
	for T in A.targets:
		if T.up > 0.8 and not T.hit and absf(z - T.z) < 0.24 and y > F2 + 0.2 and y < F2 + 1.18:
			T.hit = true; T.t = 0.6; A.stand.score += 100; drawScore(A.stand.score); sfx("ding"); part("n", 5.4, y, z, rr(-1, 0), 1, rr(-0.5, 0.5), 0.5, 0.05, "#e8c070", 1, 6)
			if A.stand.score >= 300 and not A.get("keyDropped"):
				A.keyDropped = true
				after(0.7, func():
					var k = P.skey; setPropHidden(k, false); k.noPick = false; propDropAt(k, 2.35, C2 - 1.3, 21.75, 0, Vector3(0, -1, 0.2)); sfx("clink"); toast("パイプから銀の鍵が落ちてきた！"))
			return
# ================= れんがの壁 =================
func buildBricks() -> void:
	var g := Node3D.new()
	for r in 7:
		for c in 5:
			var p := Vector3(6, F2 + 0.15 + r * 0.3, 28.95 + c * 0.28 + (0.14 if r % 2 else 0.0))
			if p.z > 30.15: continue
			var m := mesh(G.box(0.14, 0.28, 0.28), MATS.brick, true); m.position = p; g.add_child(m)
	scene.add_child(g)
	var B := {g = g, broken = false, t = 0.0, drilling = false, col = null, it = null}
	B.col = dyn_box(5.93, F2, 28.8, 6.07, F2 + 2.1, 30.2, "stone", B)
	B.it = addIt({box = Box.new(5.8, F2, 28.8, 6.2, F2 + 2.1, 30.2), label = func(_it): return null if B.broken else {t = "れんががむき出しの壁", k = "", n = "壁"},
		act = func():
			if not B.broken: toast("何か強い道具があれば、こわせそうだ"),
		use = func(it):
			if not B.broken and it.type == "jackhammer":
				drillBricks(B); return true
			return false,
		useLabel = func(it): return "削岩機でこわす" if not B.broken and it.type == "jackhammer" else null})
	A.bricks = B
func drillBricks(B: Dictionary) -> void:
	if B.drilling: return
	B.drilling = true; PL.frozen = true; sfx("drill")
	for i in 14:
		noise(6, F2, 29.5, 22, "drill"); puff(5.9, F2 + rr(0.2, 1.8), rr(28.9, 30.1), "#b86a4a", 2, 0.2, 0.6, 0.4); PL.swing = 0.2; await wait(0.12)
	B.broken = true; B.g.visible = false; B.col.on = false
	for i in 30: part("n", 6, F2 + rr(0, 2), rr(28.8, 30.2), rr(-2, 2), rr(0, 2), rr(-1, 1), 1.2, 0.07, "#a8583a", 1, 9)
	PL.frozen = false; toast("壁に穴があいた！")
	if story.get("onBricks"): story.onBricks.call()
# ================= 地下室のドア：板2枚と銅の錠 =================
func buildBaseLock() -> void:
	A.boards = [mkDoorBoard(-7.6, 1.0, 21.88, 0.35), mkDoorBoard(-7.6, 1.8, 21.88, -0.3)]
	for b in A.boards: b.setOn.call(true)
	var g := Node3D.new(); var mb := MB.new(); mb.box(-0.07, -0.09, -0.03, 0.07, 0.07, 0.03, MATS.copper); mb.cyl(0, 0.09, 0, 0.05, 0.02, MATS.copper, 10, null, "z"); g.add_child(mb.build()); g.position = Vector3(-7.2, 1.35, 21.85); scene.add_child(g)
	var L := {g = g, locked = true, it = null}
	L.it = addIt({box = Box.new(-7.35, 1.2, 21.75, -7.05, 1.5, 21.95), label = func(_it): return {t = "銅の錠がかかっている", k = "", n = "地下室のドア"} if L.locked else null,
		act = func():
			if L.locked:
				toast("銅の錠がかかっている"); sfx("locked"),
		use = func(it):
			if L.locked and (it.type == "copperkey" or it.type == "lockpick"):
				unlockCopper(it); return true
			return false,
		useLabel = func(it): return "銅の鍵で開ける" if L.locked and it.type == "copperkey" else "ピッキングで開ける" if L.locked and it.type == "lockpick" else null})
	A.clock = L
	A.base.blockers = [func():
		for b in A.boards:
			if b.on: return "板が打ちつけてあって開かない"
		return null, func(): return "銅の錠がかかっている" if A.clock.locked else null]
func unlockCopper(it: Dictionary) -> void:
	if it.type == "lockpick":
		PL.frozen = true; toast("カチャ……カチャ……", 1.5)
		for i in 5:
			sfx("click"); await wait(0.3)
		PL.frozen = false
	A.clock.locked = false; A.clock.g.visible = false; sfx("unlock"); toast("銅の錠が開いた！")
	if it.type == "copperkey": consumeHeld()
	if story.get("onCopper"): story.onCopper.call()
# ================= 棺のふた・マネキン =================
func updCoffin(dt: float) -> void:
	var C = A.get("coffin")
	if not C or not C.open or C.lidT >= 1: return
	C.lidT = minf(1, C.lidT + dt * 1.2); C.lid.position = Vector3(C.x - 0.95 * C.lidT, C.y + 0.53 + sin(C.lidT * PI) * 0.4, C.z); C.lid.rotation.z = C.lidT * 1.1
# ================= ベッドの下に隠れる =================
func mkBedHide(x: float, y: float, z: float, yaw: float, bx, out, name := "", onEnter = null) -> Dictionary:
	var h := {pos = Vector3(x, y + 0.28, z), yaw = yaw, box = bx, out = out, name = name if name else "ベッドの下", under = true, cab = null, nb = null, it = null}
	h.it = addIt({box = bx, label = func(_it): return {t = "ベッドの下に隠れる", k = "E", n = name if name else "ベッド"}, act = func():
		enterHide(h)
		if onEnter: onEnter.call()})
	HIDES.append(h)
	return h
# ================= 目覚まし時計 =================
var ALARMS := []
func armAlarm(pr: Dictionary) -> void:
	if pr.data.get("armed"): return
	pr.data.armed = true; pr.data.t = 5.0; ALARMS.append(pr); sfx("click"); toast("目覚ましをセットした（5秒後に鳴る）")
func updAlarms(dt: float) -> void:
	for i in range(ALARMS.size() - 1, -1, -1):
		var pr = ALARMS[i]; pr.data.t -= dt; var pos: Vector3 = PL.p if pr.st == "inv" else pr.p
		if pr.data.t > 0:
			if floori(pr.data.t * 2) != floori((pr.data.t + dt) * 2): sfxTick(pos)
		elif pr.data.t > -6:
			if floori(pr.data.t * 8) != floori((pr.data.t + dt) * 8): sfxRing(pos)
			if floori(pr.data.t) != floori(pr.data.t + dt): noise(pos.x, pos.y, pos.z, 26, "alarm")
		else:
			pr.data.armed = false; ALARMS.remove_at(i)
# ================= バナナ（すべる）=================
var slipT := 0.0
func updBananas(dt: float) -> void:
	slipT -= dt
	if slipT > 0:
		PL.slip = slipT; return
	PL.slip = 0.0
	if not PL.onGround or Vector2(PL.v.x, PL.v.z).length() < 1.5: return
	for pr in PROPS:
		if pr.type != "banana" or pr.st != "rest": continue
		if Vector2(pr.p.x - PL.p.x, pr.p.z - PL.p.z).length() < 0.3 and absf(pr.p.y - PL.p.y) < 0.3:
			slipT = 0.9; sfx("slip"); noise(PL.p.x, PL.p.y, PL.p.z, 8, "slip"); PL.v *= 1.6; toast("つるっ！", 1); propDropAt(pr, pr.p.x, pr.p.y + 0.1, pr.p.z, 0, Vector3(PL.v.x * 0.5, 1.5, PL.v.z * 0.5)); break
# ================= 監視カメラ（電気が必要）=================
func buildCamerasA1() -> void:
	for c in [[1.8, 3, 14.35, 0, 0.3, 19, "hall"], [-9.8, 2.95, 14.3, -7.6, 0.3, 21, "liv"], [1.8, 6.1, 31.7, 0, 3.5, 20, "hall2"], [-2.3, 6.1, 22.3, -7, 3, 29, "flood"], [9.8, 6.1, 18.8, 4, 3.5, 15.5, "class"], [-2.3, C1 - 0.2, 31.7, -2, 0.3, 23, "hallb"]]:
		addCamera(c.slice(0, 6), c[6])
	buildCamPanel()
# ================= 監視室：カメラのスイッチと、カメラの映像が映るモニター =================
var CAMV := {live = [], i = 0, t = 0.0, noSig = null}
const CAM_NAMES := ["1階のろうか", "居間", "2階のろうか", "水びたしの部屋", "教室", "1階のおく"]
const MON_LAYER := 1 << 10   # モニターだけの描画レイヤー（カメラの映像には写さない）
func camsWorking() -> bool: return A.get("power") != null and A.power.on and not A.get("camsOff")
func buildCamPanel() -> void:
	var CP := {}; A.camPanel = CP; var x := -7.075 # 東の壁（2階の居間側）に取りつける
	box(x - 0.13, F2 + 0.92, 14.75, x, F2 + 2.08, 16.55, "metal_dark", {solid = false}); box(x - 0.15, F2 + 2.02, 14.72, x - 0.1, F2 + 2.1, 16.58, "dgrey", {solid = false})
	# 文字の板
	signp(x - 0.135, F2 + 1.53, 15.35, 0.62, 0.93, std_mat({map = tex("c92"), rough = 0.7}), -PI / 2, {noShadow = true})
	# ランプ（カメラごと）
	CP.mG = std_mat({color = "#30ff60", emissive = "#20ff40", ei = 2.4}); CP.mOff = std_mat({color = "#1a1d20"}); CP.mR = std_mat({color = "#ff3020", emissive = "#ff2010", ei = 2.4})
	CP.leds = []
	for i in CAM_NAMES.size():
		var m := mesh(G.sphere(0.026, 10, 8), CP.mG); m.position = Vector3(x - 0.145, F2 + 1.53 + 0.465 - (100 + i * 46 - 8) / 384.0 * 0.93, 15.35 + 0.31 - 36 / 256.0 * 0.62); scene.add_child(m); CP.leds.append(m)
	# 大きなレバー
	var lv := Node3D.new(); var lm := MB.new(); lm.box(-0.3, -0.025, -0.025, 0, 0.025, 0.025, MATS.chrome); lm.sphere(-0.31, 0, 0, 0.05, MATS.red); lv.add_child(lm.build()); lv.position = Vector3(x - 0.14, F2 + 1.4, 16.15); scene.add_child(lv); CP.lever = lv
	box(x - 0.16, F2 + 1.18, 16.0, x - 0.13, F2 + 1.62, 16.3, "black", {solid = false})
	signp(x - 0.135, F2 + 1.74, 16.15, 0.3, 0.11, std_mat({map = tex("c93"), basic = true}), -PI / 2, {noShadow = true})
	CP.it = addIt({box = Box.new(x - 0.5, F2 + 1.1, 15.95, x, F2 + 1.7, 16.38), label = func(_it): return {t = "監視カメラを入れる" if A.get("camsOff") else "監視カメラを切る", k = "E", n = "（家の電気が切れている）" if A.get("power") and not A.power.on else "レバー"}, act = func(): setCamsOff(not A.get("camsOff"), "pl")})
	# 映らないときの画面
	CAMV.noSig = std_mat({map = tex("c94"), basic = true})
	# カメラの映像（画質がいちばん低いときは使わない）
	var mons := [A.mon0, A.mon1, A.mon2, A.mon3, A.monU[0], A.monU[1]]
	for m in A.monU + [A.mon0, A.mon1, A.mon2, A.mon3]: m.layers = MON_LAYER
	for i in mons.size():
		var mon = mons[i]
		if i >= CAMS.size(): continue
		var C = CAMS[i]; var L := {mon = mon, C = C, rt = null, cam = null, mat = null, fresh = false}
		if QUAL > 0:
			var vp := SubViewport.new(); vp.size = Vector2i(176, 132); vp.render_target_update_mode = SubViewport.UPDATE_DISABLED; vp.msaa_3d = Viewport.MSAA_DISABLED
			var cam := Camera3D.new(); cam.fov = 74; cam.near = 0.08; cam.far = 30; cam.cull_mask = 0xFFFFF & ~MON_LAYER
			vp.add_child(cam); add_child(vp)
			cam.position = Vector3(C.x + C.dx * 0.22, C.y + C.dy * 0.22, C.z + C.dz * 0.22); cam.look_at(Vector3(C.x + C.dx * 4, C.y + C.dy * 4, C.z + C.dz * 4))
			var mt := StandardMaterial3D.new(); mt.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED; mt.albedo_texture = vp.get_texture(); mt.albedo_color = Color("#dcefff")
			L.rt = vp; L.cam = cam; L.mat = mt
		CAMV.live.append(L)
	A.camsOff = false; A.camsCheckAt = 0.0; updCamLeds()
func updCamLeds() -> void:
	var on := camsWorking()
	for C in CAMS:
		if C.get("led"): C.led.visible = on and not C.broken
	var CP = A.get("camPanel")
	if not CP: return
	for i in CP.leds.size():
		var C = CAMS[i] if i < CAMS.size() else null
		CP.leds[i].mesh.surface_set_material(0, CP.mOff if not C else CP.mR if C.broken else CP.mG if on else CP.mOff)
	CP.lever.rotation.z = 0.65 if A.camsOff else -0.65
	for L in CAMV.live:
		L.mon.mesh.surface_set_material(0, CAMV.noSig if not on else MATS.monitor if L.C.broken or not L.mat else L.mat); L.fresh = false
	if A.monU.size() > 2: A.monU[2].mesh.surface_set_material(0, MATS.monitor if on else CAMV.noSig)
func setCamsOff(off: bool, who: String) -> void:
	if not A.get("camPanel"): return
	A.camsOff = off
	if who == "pl":
		sfx("click"); sfx("genoff" if off else "genon"); noise(-7.4, F2, 16, 6, "switch")
		if off:
			A.camsCheckAt = GT + rr(40, 70); toast("監視カメラを切った。……そのうち、おとなりさんが入れ直しに来るかも", 3.5)
		else:
			A.camsCheckAt = 0.0; toast("監視カメラを入れた", 2)
	elif who == "nb":
		sfx("genon"); A.camsCheckAt = 0.0
	updCamLeds()
	if story.get("onCams"): story.onCams.call(off)
# 監視室にいるときだけ、カメラの映像を順番に描く
func updCamFeeds(dt: float) -> void:
	if not CAMV.live.size() or NORENDER: return
	var r := roomAt(PL.p.x, PL.p.y + 0.1, PL.p.z)
	if r != "security" and r != "ante": return
	if not camsWorking(): return
	CAMV.t -= dt
	if CAMV.t > 0: return
	CAMV.t = 1.0 / 30
	for k in CAMV.live.size():
		var L = CAMV.live[CAMV.i % CAMV.live.size()]; CAMV.i += 1
		if not L.rt or L.C.broken: continue
		L.rt.render_target_update_mode = SubViewport.UPDATE_ONCE
		if not L.fresh:
			L.fresh = true; L.mon.mesh.surface_set_material(0, L.mat)
		break
# ================= 毎フレームの仕掛け =================
func a1Update(dt: float) -> void:
	updShark(dt); updCamFeeds(dt)
	# はじめて監視室に入ったとき
	if story.part == "main" and not story.flags.get("secSeen") and roomAt(PL.p.x, PL.p.y + 0.1, PL.p.z) == "security":
		story.flags.secSeen = 1; toast("監視室：右の壁のレバーで、家じゅうの監視カメラを切れる", 4.5)
	updElevator(dt); updTrain(dt); updRange(dt); updClassroom(dt); updCoffin(dt); updAlarms(dt); updBananas(dt)
	# 温度計の針と、凍る・とける
	if A.get("furn"):
		var F: Dictionary = A.furn; var tgtN := -1.9 if F.cold else 1.2
		F.needle.rotation.z = damp(F.needle.rotation.z, -tgtN, 0.8, dt); F.valve.rotation.z += ((1.0 if F.cold else 0.0) * 3 - F.valve.rotation.z) * minf(1, dt * 2); F.t += dt
		if F.cold and not A.water.frozen and F.t > 3: setFrozen(true)
		if not F.cold and A.water.frozen and F.t > 6: setFrozen(false)
	# 地下室のドアの明かり
	if A.get("exitLight"): li(A.exitLight, 0.8 if QUAL else 0.0)
	# 監視室のモニター（ちらつき）
	if A.get("mon0") and RND() < dt * 3: MATS.monitor.uv1_offset = Vector3(RND(), RND(), 0)
