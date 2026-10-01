
# ================= 拾える物 =================
# 形はすべて「底のまん中」が原点
var PDEF := {}
func pdef(type: String, o: Dictionary) -> void:
	o.type = type
	for k in ["solid", "tool", "key", "glass", "bouncy", "digit", "ch", "s"]:
		if not o.has(k): o[k] = null
	PDEF[type] = o
func mkModel(fn: Callable) -> Node3D:
	var mb := MB.new(); fn.call(mb); var g := mb.build({})
	for m in mb.extra: g.add_child(m.duplicate())
	return g
func initPropDefs() -> void:
	var M_ := func(n): return M(n)
	pdef("letter", {name = "手紙", hx = 0.12, h = 0.015, hz = 0.075, w = 0.1, mk = func(b: MB): b.box(-0.12, 0, -0.075, 0.12, 0.012, 0.075, M("cream")); b.box(-0.03, 0.012, -0.02, 0.03, 0.014, 0.02, M("red"))})
	pdef("key_house", {name = "新しい家の鍵", hx = 0.07, h = 0.02, hz = 0.03, w = 0.1, key = true, mk = func(b: MB): b.cyl(-0.045, 0, 0, 0.025, 0.012, M("brass"), 12); b.box(-0.02, 0, -0.007, 0.07, 0.012, 0.007, M("brass")); b.box(0.04, 0, 0.007, 0.05, 0.012, 0.02, M("brass")); b.box(0.058, 0, 0.007, 0.066, 0.012, 0.016, M("brass"))})
	pdef("suitcase", {name = "スーツケース", hx = 0.32, h = 0.24, hz = 0.22, w = 1.4, solid = true, mk = func(b: MB):
		var L: Material = MATS.brown; b.box(-0.31, 0, -0.21, 0.31, 0.12, 0.21, L); b.box(-0.31, 0.12, -0.21, 0.31, 0.23, 0.21, M("car_r")); b.box(-0.315, 0.11, -0.215, 0.315, 0.13, 0.215, M("black"))
		for x in [-0.16, 0.16]: b.box(x - 0.02, 0, -0.215, x + 0.02, 0.235, 0.215, M("cream"))
		b.box(-0.08, 0.1, 0.215, 0.08, 0.14, 0.25, M("black")); b.box(-0.03, 0.235, -0.05, 0.03, 0.26, 0.05, M("brass"))})
	pdef("crowbar", {name = "バール", hx = 0.4, h = 0.06, hz = 0.05, w = 0.9, mk = func(b: MB): b.box(-0.34, 0, -0.014, 0.34, 0.028, 0.014, M("red")); b.rbox(0.37, 0.03, 0, 0.1, 0.028, 0.028, 0, 0, 0.8, M("red")); b.rbox(-0.37, 0.012, -0.015, 0.08, 0.024, 0.028, 0, 0.5, 0, M("black")); b.box(-0.2, 0, -0.016, -0.05, 0.03, 0.016, M("black"))})
	pdef("box", {name = "段ボール箱", hx = 0.28, h = 0.42, hz = 0.24, w = 1.2, solid = true, mk = func(b: MB): b.box(-0.28, 0, -0.24, 0.28, 0.42, 0.24, M("cardboard")); b.box(-0.285, 0.405, -0.05, 0.285, 0.425, 0.05, M("tape")); b.box(-0.29, 0.3, -0.05, -0.28, 0.425, 0.05, M("tape")); b.box(0.28, 0.3, -0.05, 0.29, 0.425, 0.05, M("tape"))})
	pdef("trashcan", {name = "ゴミ箱", hx = 0.28, h = 0.8, hz = 0.28, w = 2, solid = true, mk = func(b: MB): b.cyl(0, 0, 0, 0.25, 0.78, M("corr"), 16, {rt = 0.28}); b.cyl(0, 0.74, 0, 0.29, 0.05, M("metal"), 16); b.box(-0.33, 0.55, -0.03, -0.27, 0.62, 0.03, M("metal")); b.box(0.27, 0.55, -0.03, 0.33, 0.62, 0.03, M("metal"))})
	pdef("lid", {name = "ゴミ箱のフタ", hx = 0.3, h = 0.1, hz = 0.3, w = 0.7, mk = func(b: MB): b.cyl(0, 0, 0, 0.3, 0.04, M("metal"), 18, {rt = 0.27}); b.cyl(0, 0.04, 0, 0.24, 0.03, M("metal"), 18, {rt = 0.1}); b.box(-0.08, 0.07, -0.015, 0.08, 0.1, 0.015, M("metal_dark"))})
	pdef("apple_core", {name = "りんごの芯", hx = 0.04, h = 0.1, hz = 0.04, w = 0.15, mk = func(b: MB): b.sphere(0, 0.022, 0, 0.034, M("apple"), 1, 0.7, 1, 10); b.cyl(0, 0.03, 0, 0.018, 0.04, M("applein"), 10); b.sphere(0, 0.078, 0, 0.032, M("apple"), 1, 0.6, 1, 10); b.cyl(0, 0.09, 0, 0.004, 0.03, M("brown"), 5)})
	pdef("keycard", {name = "カードキー", hx = 0.05, h = 0.01, hz = 0.035, w = 0.1, key = true, mk = func(b: MB): b.box(-0.05, 0, -0.032, 0.05, 0.005, 0.032, M("card")); b.box(-0.05, 0.005, 0.01, 0.05, 0.006, 0.02, M("black")); b.box(-0.04, 0.005, -0.025, -0.01, 0.006, -0.005, M("brass"))})
	pdef("watering_can", {name = "じょうろ", hx = 0.24, h = 0.3, hz = 0.12, w = 0.8, mk = func(b: MB): b.cyl(0, 0, 0, 0.12, 0.22, M("can_g"), 14); b.rbox(0.19, 0.16, 0, 0.2, 0.03, 0.03, 0, 0, 0.7, M("can_g")); b.cyl(0.26, 0.23, 0, 0.035, 0.03, M("can_g"), 10); b.rbox(-0.02, 0.27, 0, 0.2, 0.03, 0.03, 0, 0, 0, M("can_g")); b.box(-0.12, 0.2, -0.015, -0.1, 0.27, 0.015, M("can_g")); b.box(0.08, 0.2, -0.015, 0.1, 0.27, 0.015, M("can_g"))})
	pdef("chair", {name = "いす", hx = 0.24, h = 0.92, hz = 0.24, w = 2, solid = true, mk = func(b: MB):
		var w: Material = M("wood_m")
		for xz in [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]: b.box(xz[0] - 0.025, 0, xz[1] - 0.025, xz[0] + 0.025, 0.45, xz[1] + 0.025, w)
		b.box(-0.23, 0.45, -0.23, 0.23, 0.5, 0.23, w)
		b.box(-0.23, 0.5, -0.23, -0.18, 0.92, -0.18, w); b.box(0.18, 0.5, -0.23, 0.23, 0.92, -0.18, w); b.box(-0.23, 0.72, -0.235, 0.23, 0.88, -0.19, w); b.box(-0.21, 0.53, -0.22, 0.21, 0.56, -0.2, w)})
	pdef("binoculars", {name = "双眼鏡", hx = 0.09, h = 0.07, hz = 0.08, w = 0.4, tool = "binoc", mk = func(b: MB): b.cyl(-0.045, 0.035, 0, 0.032, 0.14, M("black"), 10, {axis = "z"}); b.cyl(0.045, 0.035, 0, 0.032, 0.14, M("black"), 10, {axis = "z"}); b.box(-0.02, 0.03, -0.03, 0.02, 0.05, 0.03, M("dgrey")); b.cyl(-0.045, 0.035, 0.07, 0.026, 0.01, M("glassb"), 10, {axis = "z"}); b.cyl(0.045, 0.035, 0.07, 0.026, 0.01, M("glassb"), 10, {axis = "z"})})
	pdef("flashlight", {name = "懐中電灯", hx = 0.04, h = 0.06, hz = 0.13, w = 0.3, tool = "light", mk = func(b: MB): b.cyl(0, 0.03, 0, 0.022, 0.2, M("yellow"), 10, {axis = "z"}); b.cyl(0, 0.03, 0.11, 0.035, 0.05, M("black"), 12, {axis = "z", rt = 0.026}); b.cyl(0, 0.03, 0.136, 0.03, 0.006, M("bulb"), 12, {axis = "z"})})
	pdef("cup", {name = "マグカップ", hx = 0.05, h = 0.1, hz = 0.05, w = 0.2, mk = func(b: MB): b.cyl(0, 0, 0, 0.045, 0.1, M("cup"), 12); b.box(0.045, 0.03, -0.008, 0.07, 0.08, 0.008, M("cup"))})
	pdef("plate", {name = "お皿", hx = 0.11, h = 0.02, hz = 0.11, w = 0.3, mk = func(b: MB): b.cyl(0, 0, 0, 0.11, 0.02, M("porcelain"), 16, {rt = 0.07})})
	pdef("bottle", {name = "びん", hx = 0.04, h = 0.26, hz = 0.04, w = 0.3, glass = true, mk = func(b: MB): b.cyl(0, 0, 0, 0.038, 0.17, M("bottle"), 10); b.cyl(0, 0.17, 0, 0.014, 0.07, M("bottle"), 8, {rt = 0.038}); b.cyl(0, 0.24, 0, 0.015, 0.02, M("red"), 8)})
	pdef("book", {name = "本", hx = 0.1, h = 0.04, hz = 0.14, w = 0.4, mk = func(b: MB): b.box(-0.1, 0, -0.14, 0.1, 0.04, 0.14, M("bookc")); b.box(-0.095, 0.004, -0.135, 0.1, 0.036, 0.138, M("cream"))})
	pdef("can", {name = "あき缶", hx = 0.035, h = 0.12, hz = 0.035, w = 0.1, mk = func(b: MB): b.cyl(0, 0, 0, 0.034, 0.12, M("canr"), 10)})
	pdef("ball", {name = "ボール", hx = 0.12, h = 0.24, hz = 0.12, w = 0.5, bouncy = true, mk = func(b: MB): b.sphere(0, 0.12, 0, 0.12, M("ball"), 1, 1, 1, 14)})
	pdef("duck", {name = "アヒルのおもちゃ", hx = 0.06, h = 0.1, hz = 0.07, w = 0.1, mk = func(b: MB): b.sphere(0, 0.035, 0, 0.05, M("yellow"), 1, 0.7, 1.2, 10); b.sphere(0, 0.08, 0.03, 0.03, M("yellow"), 1, 1, 1, 8); b.box(-0.012, 0.075, 0.055, 0.012, 0.085, 0.08, M("orange"))})
	pdef("clock", {name = "目覚まし時計", hx = 0.07, h = 0.15, hz = 0.05, w = 0.3, mk = func(b: MB): b.cyl(0, 0.075, 0, 0.065, 0.05, M("red"), 14, {axis = "z"}); b.cyl(0, 0.075, 0.026, 0.055, 0.004, M("cream"), 14, {axis = "z"}); b.sphere(-0.04, 0.14, 0, 0.025, M("chrome")); b.sphere(0.04, 0.14, 0, 0.025, M("chrome")); b.box(-0.05, 0, -0.01, -0.035, 0.03, 0.01, M("black")); b.box(0.035, 0, -0.01, 0.05, 0.03, 0.01, M("black"))})
	pdef("pot", {name = "なべ", hx = 0.14, h = 0.14, hz = 0.14, w = 0.8, mk = func(b: MB): b.cyl(0, 0, 0, 0.13, 0.12, M("metal"), 14); b.box(0.13, 0.09, -0.015, 0.26, 0.11, 0.015, M("black"))})
	pdef("vase", {name = "花びん", hx = 0.07, h = 0.28, hz = 0.07, w = 0.5, glass = true, mk = func(b: MB): b.cyl(0, 0, 0, 0.06, 0.1, M("vase"), 12, {rt = 0.08}); b.cyl(0, 0.1, 0, 0.08, 0.1, M("vase"), 12, {rt = 0.04}); b.cyl(0, 0.2, 0, 0.04, 0.08, M("vase"), 12, {rt = 0.05})})
	pdef("shoe", {name = "くつ", hx = 0.06, h = 0.09, hz = 0.13, w = 0.3, mk = func(b: MB): b.box(-0.05, 0, -0.12, 0.05, 0.02, 0.13, M("black")); b.box(-0.05, 0.02, -0.12, 0.05, 0.08, 0.02, M("shoe")); b.box(-0.05, 0.02, 0.02, 0.05, 0.05, 0.13, M("shoe"))})
	pdef("board", {name = "板", hx = 0.55, h = 0.03, hz = 0.08, w = 0.8, mk = func(b: MB): b.box(-0.55, 0, -0.075, 0.55, 0.03, 0.075, M("raw"), 63, 1)})
	pdef("radio", {name = "ラジオ", hx = 0.15, h = 0.16, hz = 0.07, w = 0.8, mk = func(b: MB): b.box(-0.15, 0, -0.06, 0.15, 0.14, 0.06, M("radio")); b.box(-0.12, 0.02, 0.06, 0.02, 0.12, 0.065, M("dgrey")); b.cyl(0.08, 0.07, 0.06, 0.03, 0.01, M("cream"), 10, {axis = "z"}); b.box(0.1, 0.14, -0.01, 0.105, 0.3, 0, M("chrome"))})
	pdef("banana", {name = "バナナの皮", hx = 0.08, h = 0.04, hz = 0.06, w = 0.1, mk = func(b: MB): b.rbox(0, 0.015, 0, 0.14, 0.025, 0.04, 0, 0.3, 0, M("yellow")); b.rbox(-0.05, 0.015, 0.03, 0.08, 0.02, 0.03, 0, 1.2, 0, M("yellow"))})
# ---- 置いてある物 ----
var PROPS := []
var PID := 1
func spawnProp(type: String, x: float, y: float, z: float, yaw := 0.0, o := {}) -> Dictionary:
	var d: Dictionary = PDEF[type]; var g := mkModel(d.mk); set_cast(g, true); g.rotation_order = EULER_ORDER_XYZ; scene.add_child(g)
	var pid: String = o.get("id", "")
	if pid == "":
		pid = "p%d" % PID; PID += 1
	var pr := {id = pid, type = type, d = d, grp = g, p = Vector3(x, y, z), v = Vector3(), yaw = yaw, spin = Vector3(), rot = Vector3(), st = "rest", data = o.get("data", {}).duplicate(), solid = null,
		home = {x = x, y = y, z = z, yaw = yaw}, sleep = 0.0, att = null, lp = null, onGround = true, hidden = false, noPick = not not o.get("noPick"), lying = false, thrown = false, cont = null, lid = null}
	PROPS.append(pr); placeProp(pr)
	if o.get("att"): attachProp(pr, o.att, o.get("lp", Vector3()))
	else: refreshSolid(pr)
	return pr
func propHX(pr: Dictionary) -> float:
	var q := absi(roundi(pr.yaw / (PI / 2))) % 2
	return pr.d.hz if q else pr.d.hx
func propHZ(pr: Dictionary) -> float:
	var q := absi(roundi(pr.yaw / (PI / 2))) % 2
	return pr.d.hx if q else pr.d.hz
func propBox(pr: Dictionary) -> Box:
	var hx := propHX(pr); var hz := propHZ(pr); var p: Vector3 = pr.p
	if pr.lying: return Box.new(p.x - hx, p.y - 0.25, p.z - pr.d.h, p.x + hx, p.y + 0.25, p.z)
	return Box.new(p.x - hx, p.y, p.z - hz, p.x + hx, p.y + pr.d.h, p.z + hz)
func placeProp(pr: Dictionary) -> void:
	var g: Node3D = pr.grp
	g.position = pr.p
	if pr.st == "fly":
		g.rotation_order = EULER_ORDER_XYZ
		g.rotation = Vector3(pr.rot.x, pr.yaw + pr.rot.y, pr.rot.z); g.position.y += pr.d.h / 2
		# 回転の中心を物のまん中に
		for m in g.get_children(): m.position = Vector3(0, -pr.d.h / 2, 0)
	else:
		g.rotation_order = EULER_ORDER_XYZ
		g.rotation = Vector3(-PI / 2 if pr.lying else 0.0, 0.0 if pr.lying else pr.yaw, 0)
		for m in g.get_children(): m.position = Vector3()
func refreshSolid(pr: Dictionary) -> void:
	var want: bool = pr.d.solid and pr.st == "rest" and not pr.hidden and not pr.lying
	if want:
		var b := propBox(pr)
		if not pr.solid: pr.solid = dyn_box(b.x0, b.y0, b.z0, b.x1, b.y1, b.z1, pr.d.s if pr.d.s else "wood", pr)
		else:
			set_box(pr.solid, b.x0, b.y0, b.z0, b.x1, b.y1, b.z1); pr.solid.on = true
	elif pr.solid: pr.solid.on = false
func attachProp(pr: Dictionary, obj: Dictionary, lp: Vector3) -> void:
	pr.st = "att"; pr.att = obj; pr.lp = lp
	if not obj.has("props"): obj.props = []
	obj.props.append(pr); refreshSolid(pr); updAttached(pr)
func detachProp(pr: Dictionary) -> void:
	if pr.att and pr.att.get("props") != null: remove_ref(pr.att.props, pr)
	pr.att = null; pr.lp = null
func updAttached(pr: Dictionary) -> void:
	var o = pr.att
	if not o: return
	var m: Transform3D = o.frame.call()
	var p: Vector3 = m * pr.lp
	pr.p = p
	var g: Node3D = pr.grp
	g.position = p
	g.basis = Basis(m.basis.get_rotation_quaternion()) * Basis(Vector3.UP, pr.yaw)
	for c in g.get_children(): c.position = Vector3()
func setPropHidden(pr: Dictionary, h: bool) -> void:
	pr.hidden = h; pr.grp.visible = not h; refreshSolid(pr)
func propToInv(pr: Dictionary) -> void:
	detachProp(pr); pr.st = "inv"; pr.grp.visible = false; refreshSolid(pr)
func propDropAt(pr: Dictionary, x: float, y: float, z: float, yaw: float, vel = null) -> void:
	pr.st = "fly"; pr.p = Vector3(x, y, z); pr.yaw = yaw; pr.grp.visible = not pr.hidden; pr.v = vel if vel != null else Vector3(); pr.rot = Vector3()
	pr.spin = Vector3(rr(-6, 6), rr(-4, 4), rr(-6, 6)) if vel != null else Vector3()
	pr.sleep = 0.0; pr.thrown = vel != null; refreshSolid(pr); placeProp(pr)
func propRestAt(pr: Dictionary, x: float, y: float, z: float, yaw: float) -> void:
	detachProp(pr); pr.st = "rest"; pr.p = Vector3(x, y, z); pr.yaw = yaw; pr.v = Vector3(); pr.grp.visible = not pr.hidden; refreshSolid(pr); placeProp(pr)
# 当たり（物が飛んでいるとき）
var TARGETS := []   # {box, hit(pr)} スイッチなど
var propHitHook = null
func updProps(dt: float) -> void:
	for pr in PROPS:
		if pr.st == "att":
			updAttached(pr); continue
		if pr.st == "rest":
			pr.sleep += dt
			if pr.sleep > 0.35:
				pr.sleep = 0.0; var b := propBox(pr)
				if not overlap_any(b.x0 + 0.02, b.y0 - 0.06, b.z0 + 0.02, b.x1 - 0.02, b.y0 + 0.01, b.z1 - 0.02, pr.solid, func(s): return not is_same(s.ref, pr) and s.s != "trig"):
					pr.st = "fly"; pr.v = Vector3(); pr.rot = Vector3(); pr.spin = Vector3(); pr.thrown = false; refreshSolid(pr)
			continue
		if pr.st != "fly": continue
		pr.v.y -= 18 * dt
		var sp: float = pr.v.length(); var n := maxi(1, ceili(sp * dt / 0.12)); var h := dt / n; var hx := propHX(pr); var hz := propHZ(pr)
		var filt := func(b): return not is_same(b.ref, pr) and b.s != "trig"
		var s := 0
		while s < n and pr.st == "fly":
			s += 1
			var vx: float = pr.v.x; var vy: float = pr.v.y; var vz: float = pr.v.z
			# 見えない当たり（スイッチなど）
			for t in TARGETS:
				var b = t.box
				if pr.p.x + hx > b.x0 and pr.p.x - hx < b.x1 and pr.p.y + pr.d.h > b.y0 and pr.p.y < b.y1 and pr.p.z + hz > b.z0 and pr.p.z - hz < b.z1 and pr.thrown and not t.get("done"): t.hit.call(pr)
			if propHitHook != null and pr.thrown and propHitHook.call(pr, hx, hz): continue
			pr.p = move_body(pr.p, hx, pr.d.h, hz, vx * h, vy * h, vz * h, null, filt)
			var hb = HIT.box; var impact := (absf(vx) if HIT.x else 0.0) + (absf(vy) if HIT.y else 0.0) + (absf(vz) if HIT.z else 0.0)
			if hb != null and hb.s == "glass" and impact > 2.5 and hb.ref != null and hb.ref.get("breakGlass"):
				hb.ref.breakGlass.call(pr); continue
			if hb != null and hb.ref != null and hb.ref.get("onPropHit"): hb.ref.onPropHit.call(pr, impact)
			var bo := 0.7 if pr.d.bouncy else 0.25
			if HIT.x: pr.v.x = -vx * bo
			if HIT.z: pr.v.z = -vz * bo
			if HIT.y:
				if vy < 0:
					if vy < -2.2:
						pr.v.y = -vy * bo; pr.v.x *= 0.7; pr.v.z *= 0.7
					else:
						pr.v.y = 0.0; pr.v.x *= pow(0.02, h); pr.v.z *= pow(0.02, h)
				else: pr.v.y = 0.0
			if impact > 2.2: propImpact(pr, impact, hb)
		pr.rot += pr.spin * dt
		# 止まったら置く
		var onG: bool = HIT.ground != null
		if onG: pr.spin *= pow(0.05, dt)
		if onG and absf(pr.v.y) < 0.5 and Vector2(pr.v.x, pr.v.z).length() < 0.35:
			pr.st = "rest"; pr.thrown = false; pr.v = Vector3(); pr.yaw = roundf((pr.yaw + pr.rot.y) / (PI / 2)) * (PI / 2) + rr(-0.12, 0.12); pr.rot = Vector3(); pr.spin = Vector3(); refreshSolid(pr)
		if pr.p.y < -30: propRestAt(pr, pr.home.x, pr.home.y, pr.home.z, pr.home.yaw)
		placeProp(pr)
var lastImpactT := 0.0
func propImpact(pr: Dictionary, sp: float, hb) -> void:
	if GT - lastImpactT < 0.05: return
	lastImpactT = GT
	var w: float = pr.d.w if pr.d.w else 0.5
	sfxImpact(pr, sp, hb.s if hb != null else "wood"); noise(pr.p.x, pr.p.y, pr.p.z, clampf(4 + sp * w * 2.2, 4, 20), "impact")
	if pr.d.glass and sp > 6: breakProp(pr)
func breakProp(pr: Dictionary) -> void:
	spawnShards(pr.p.x, pr.p.y + 0.1, pr.p.z, "#4a7ad0" if pr.d.type == "vase" else "#3f8a5a", 10); sfxGlass(pr.p, 0.6); noise(pr.p.x, pr.p.y, pr.p.z, 16, "glass")
	propRestAt(pr, pr.home.x, pr.home.y, pr.home.z, pr.home.yaw)
func propById(id: String):
	for p in PROPS:
		if p.id == id: return p
	return null
func propsInBox(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, type = null) -> Array:
	return PROPS.filter(func(p): return (p.st == "rest" or p.st == "fly") and (not type or p.type == type) and p.p.x > x0 and p.p.x < x1 and p.p.y > y0 and p.p.y < y1 and p.p.z > z0 and p.p.z < z1)
