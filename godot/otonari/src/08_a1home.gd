
# ================= 自分の家と通り（アルファ1）=================
# 家 x:-6..6 z:-30..-22（玄関は z=-22、通りの方を向く）。前には広い庭
var H1 := {lights = [], power = false}
var STREET_LIGHTS := []
func buildA1Street() -> void:
	# 地面（墓の部屋の穴の所だけあけておく）
	for q in [[-90, -70, 90, 23.4], [-90, 25.6, 90, 90], [-90, 23.4, -5.6, 25.6], [-3.4, 23.4, 90, 25.6]]: box(q[0], -0.5, q[1], q[2], 0, q[3], "grass", {s = "grass", uv = 3})
	box(-90, 0, -4, 90, 0.02, 4, "asphalt", {s = "stone", uv = 6})
	var x := -88
	while x < 88:
		box(x, 0.02, -0.08, x + 2, 0.03, 0.08, "road_y", {solid = false}); x += 4
	box(-90, 0, -6.4, 90, 0.14, -4, "sidewalk", {s = "stone"}); box(-90, 0, 4, 90, 0.14, 6.4, "sidewalk", {s = "stone"}); box(-90, 0, -4.12, 90, 0.16, -4, "concrete", {s = "stone"}); box(-90, 0, 4, 90, 0.16, 4.12, "concrete", {s = "stone"})
	# 反りかえった街灯
	var SL := []
	for xx in [-42, -12, 12, 42]:
		SL.append(curvedLamp(xx, -5.9, 0)); SL.append(curvedLamp(xx + 15, 5.9, 2))
	W.streetLights = SL; STREET_LIGHTS = SL
	# まわりの家
	fakeHouse(-24, -24, 0, "sid_white", "roof_dark", 21); fakeHouse(24, -24, 0, "sid_yellow", "roof_brown", 22); fakeHouse(-46, -22, 0, "sid_pink", "roof", 23); fakeHouse(46, -22, 0, "sid_white", "roof_dark", 24)
	fakeHouse(-38, 22, 2, "brick", "roof_dark", 25); fakeHouse(38, 22, 2, "sid_white", "roof", 26); fakeHouse(-60, 24, 2, "sid_cream", "roof_brown", 27); fakeHouse(60, 24, 2, "brick_y", "roof_dark", 28)
	for xz in [[-30, -9], [30, -9], [-52, -10], [52, -10], [-30, 10], [30, 10], [-50, 12], [50, 12], [-10, -34], [12, -35]]:
		treeAt(xz[0], xz[1], 1 + fposmod_js(xz[0] * xz[1], 3) * 0.12)
	var a := 0.0
	while a < TAU:
		var R := 84 + sin(a * 5) * 5; treeAt(cos(a) * R, 8 + sin(a) * R, 2.3, 1 if int(a * 10) % 3 == 0 else 0); a += TAU / 50
	invis(-70, -5, -50, 70, 40, -49); invis(-70, -5, 70, 70, 40, 71); invis(-71, -5, -50, -70, 40, 71); invis(70, -5, -50, 71, 40, 71)
# JS の % と同じ（負の数は負のまま）
func fposmod_js(a: float, b: float) -> float: return fmod(a, b)
func curvedLamp(x: float, z: float, k: int) -> OmniLight3D:
	var f := XF(x, 0, z, k); cyl(x, 0, z, 0.09, 4.6, "pole", 8, {solid = true, s = "wood"}); f.rbox(0, 4.75, 0.35, 0.08, 0.08, 0.9, -0.5, 0, 0, "pole"); f.box(-0.18, 4.6, 0.7, 0.18, 4.72, 1.05, "lamp", NS)
	var p := f.p(0, 4.4, 0.85); var L := plight("#ffd890", 0, 15, 1.6); L.position = p; scene.add_child(L)
	return L
func buildA1Home() -> void:
	var FY := 0.3; var CY := 3.0; var WT := 0.3
	# 床と天井
	slab(-6, -30, -2, -22, FY, 0.3, "floor", null); slab(-2, -30, 2, -22, FY, 0.3, "floor_dark", null); slab(2, -30, 6, -22, FY, 0.3, "carpet_b", null, {s = "carpet"}); box(-6.2, CY, -30.2, 6.2, CY + 0.3, -21.8, "white", {f = 8 | 1 | 2 | 16 | 32})
	wallX(-6.15, 6.15, -30, 0, CY + 0.3, WT, "sid_lav", "wp_kid")
	wallX(-6.15, -2, -22, 0, CY + 0.3, WT, "wp_beige", "sid_lav", [[-5, -3, 1.1, 2.2]]); wallX(-2, 2, -22, 0, CY + 0.3, WT, "wp_brown", "sid_lav", [[-0.5, 0.5, FY, 2.45]]); wallX(2, 6.15, -22, 0, CY + 0.3, WT, "wp_kid", "sid_lav", [[3, 5, 1.1, 2.2]])
	wallZ(-29.85, -22.15, -6, 0, CY + 0.3, WT, "sid_lav", "wp_beige"); wallZ(-29.85, -22.15, 6, 0, CY + 0.3, WT, "wp_kid", "sid_lav")
	wallZ(-29.85, -22.15, -2, FY, CY, 0.12, "wp_beige", "wp_brown", [[-26.4, -24.4, FY, 2.7]]); wallZ(-29.85, -22.15, 2, FY, CY, 0.12, "wp_brown", "wp_kid", [[-24.5, -23.5, FY, 2.42]])
	roofX(-6.15, 6.15, -30.15, -21.85, CY + 0.3, 2, "roof_dark", 0.5); gable(-6.15, -30.15, -21.85, CY + 0.3, CY + 2.3, "sid_lav"); gable(6.15, -30.15, -21.85, CY + 0.3, CY + 2.3, "sid_lav")
	box(-6.4, 0, -30.4, 6.4, 0.3, -29.85, "stone", {solid = false}); box(-6.4, 0, -22.15, 6.4, 0.3, -21.6, "stone", {solid = false})
	# ドア：玄関と、右の寝室
	H1.front = mkDoor({x = 0, z = -22, y = FY, w = 0.96, h = 2.13, axis = "x", hinge = 1, swing = -1, mat = "door_r", panel = "door_rp", name = "玄関", inside = -1, lock = "key:key_red"})
	H1.bedDoor = mkDoor({x = 2, z = -24, y = FY, w = 0.96, h = 2.1, axis = "z", hinge = -1, swing = 1, mat = "doorc", panel = "doorc2", arch = true, name = "寝室のドア"})
	H1.winBed = mkWindow({axis = "x", x = 4, z = -22, y0 = 1.1, w = 2, h = 1.1, breakable = true}); mkWindow({axis = "x", x = -4, z = -22, y0 = 1.1, w = 2, h = 1.1})
	# ポーチと電気の箱
	box(-2.6, 0, -21.85, 2.6, FY, -20.4, "wood_m", {s = "wood"}); box(-1.6, 0, -20.4, 1.6, 0.15, -20, "wood_m", {s = "wood"})
	for xx in [-2.45, 2.45]: box(xx - 0.08, FY, -20.55, xx + 0.08, 2.9, -20.4, "trim", {s = "wood"})
	box(-2.8, 2.9, -21.85, 2.8, 3.1, -20.2, "roof_dark", {s = "wood"})
	var eb := MB.new(); eb.box(-0.2, -0.25, -0.06, 0.2, 0.25, 0, MATS.metal); eb.box(-0.08, 0.05, 0.0, 0.08, 0.18, 0.005, MATS.yellow); var ebg := eb.build(); ebg.position = Vector3(1.4, 1.35, -21.84); scene.add_child(ebg)
	H1.eboxLid = mkLeaf({x = 1.4, y = 1.1, z = -21.83, w = 0.4, h = 0.5, axis = "x", hinge = -1, swing = 1, mat = "metal", t = 0.02, ang = PI * 0.6, knob = false})
	var sg := G.box(0.05, 0.14, 0.05)
	for k in sg.p.size(): sg.p[k] += Vector3(0, 0.05, 0)
	var sw := mesh(sg, MATS.red); sw.position = Vector3(1.4, 1.33, -21.83); sw.rotation.x = 0.7; scene.add_child(sw)
	H1.ebox = {open = false, on = false, sw = sw, it = null}
	H1.ebox.it = addIt({box = Box.new(1.15, 1.05, -21.9, 1.65, 1.65, -21.6), label = func(_it): return {t = "電気が通っている", k = "", n = "電気の箱"} if H1.ebox.on else {t = "スイッチを入れる" if H1.ebox.open else "開ける", k = "E", n = "電気の箱"},
		act = func():
			var E: Dictionary = H1.ebox
			if E.on: return
			if not E.open:
				E.open = true; H1.eboxLid.m.tgt = 1.0; sfx("cab", true); return
			E.on = true; sw.rotation.x = -0.7; sfx("switch"); homeLights(true)
			if story.get("onPower"): story.onPower.call()})
	# 中の家具
	bed(4.6, FY, -28.6, 0, "bed_b", 1.1, 2); H1.ward = wardrobe(2.5, FY, -29.5, 0, {w = 1, d = 0.6, h = 2, mat = "wood_m", hide = true, name = "クローゼット"}); lamp(5.6, FY, -22.6, 1.3); rug(2.5, -27, 5.5, -23, FY, "carpet_p")
	H1.bedIt = addIt({box = Box.new(4.05, FY, -29.6, 5.15, 1.1, -27.6), label = func(_it): return {t = "昼寝する", k = "E", n = "ベッド"} if story.canSleep.call() else {t = story.sleepMsg.call(), k = "", n = "ベッド"},
		act = func():
			if story.canSleep.call(): story.sleep.call()})
	coatRack(-1.5, FY, -22.6); picture(-1.94, 1.7, -27, 1, 0.5, 0.5, 71); sofa(-4, FY, -28.8, 0, "sofa_g", 2); H1.tv = tvSet(-4, FY, -22.6, 2); ceilLamp(0, CY, -26); ceilLamp(4, CY, -26); ceilLamp(-4, CY, -26)
	for xz in [[0, -26], [4, -26], [-4, -26]]:
		var L := plight("#ffd9a0", 0, 8, 1.4); L.position = Vector3(xz[0], CY - 0.5, xz[1]); scene.add_child(L); H1.lights.append(L)
	# 庭：柵・車よせ
	picket(-20, -6.6, -1, -6.6); picket(1, -6.6, 3.6, -6.6); picket(7.6, -6.6, 20, -6.6); picket(-20, -6.6, -20, -34); picket(20, -6.6, 20, -34); picket(-20, -34, 20, -34)
	box(-0.8, 0, -20, 0.8, 0.05, -6.6, "walk", {s = "stone", uv = 1}); box(3.6, 0, -19, 7.6, 0.04, -4, "concrete", {s = "stone"})
	bush(-5.5, -21, 1); bush(5.8, -20.8, 0.9); flowers(-5, -21.4, -3, -20.6); treeAt(-12, -14, 1.3); treeAt(13, -24, 1.2); treeAt(-14, -28, 1.1); mailbox(-1.6, -6.2, "blue")
func homeLights(on: bool) -> void:
	H1.power = on
	for L in H1.lights: li(L, (1.5 if ENV.mode == "day" else 5.0) if on and QUAL else 0.0)
# ---- 自分の車（屋根に荷物）----
var MYCAR = null
func buildMyCar() -> Dictionary:
	var g := Node3D.new(); var saveW := W; W = MB.new(); NOSOLID = true; carModel(0, 0, 0, "car_y"); NOSOLID = false # ローカルに作ってからグループへ
	var bb := W.build(); g.add_child(bb); W = saveW
	# 屋根の荷物
	var mb := MB.new(); mb.box(-0.55, 1.47, -0.9, 0.55, 1.49, 0.7, MATS.black); mb.box(-0.5, 1.49, -0.8, 0.3, 1.9, -0.1, MATS.cardboard); mb.box(-0.3, 1.49, 0, 0.45, 1.75, 0.6, MATS.brown); mb.box(-0.25, 1.9, -0.7, 0.15, 2.2, -0.3, MATS.cardboard)
	# いす
	mb.box(-0.2, 1.75, 0.1, 0.3, 1.8, 0.5, MATS.wood_m); mb.box(0.25, 1.8, 0.1, 0.3, 2.25, 0.5, MATS.wood_m)
	for ab in [[-0.18, 0.12], [-0.18, 0.48], [0.28, 0.12]]: mb.box(ab[0] - 0.02, 1.8, ab[1] - 0.02, ab[0] + 0.02, 2.05, ab[1] + 0.02, MATS.wood_m)
	mb.box(-0.6, 1.6, -0.95, 0.6, 1.62, -0.93, MATS.red); g.add_child(mb.build()); set_cast(g, true); scene.add_child(g)
	MYCAR = {g = g, col = [], body = null}
	return MYCAR
func parkMyCar(x: float, z: float, yaw: float) -> void:
	var C = MYCAR; C.g.position = Vector3(x, 0, z); C.g.rotation.y = yaw
	for b in C.col: b.on = false
	var c := absf(sin(yaw)) > 0.5
	var hx := 2.1 if c else 0.9; var hz := 0.9 if c else 2.1
	if not C.body: C.body = dyn_box(0, 0, 0, 0, 0, 0, "metal", null)
	set_box(C.body, x - hx, 0, z - hz, x + hx, 1.4, z + hz); C.body.on = true
# ---- 空に浮かぶ手書きの説明 ----
var HINTTXT := []
func floatText(txt: String, x: float, y: float, z: float, arrow := 0, size := 1.0) -> Label3D:
	var s := Label3D.new(); s.text = txt + ("\n→" if arrow > 0 else "\n←" if arrow < 0 else "")
	s.font_size = 58; s.outline_size = 10; s.outline_modulate = Color(0.08, 0.08, 0.08, 0.55); s.modulate = Color.WHITE
	s.pixel_size = 1.6 * size / 512.0; s.billboard = BaseMaterial3D.BILLBOARD_ENABLED; s.shaded = false; s.double_sided = true; s.render_priority = 6
	s.position = Vector3(x, y, z); scene.add_child(s); HINTTXT.append(s)
	return s
# ================= 夢：地下室の中は「町の通り」=================
var DREAM := {g = null, L = null, wheel = null}
func buildDreamSet() -> void:
	var saveW := W; W = MB.new() # 地下室の階段のところに置く（ふだんは見えない）
	box(-9.85, F1 - 0.02, 22.1, -7.1, F1, 26.9, "asphalt", {solid = false, uv = 3}); box(-9.84, F1, 26.8, -7.12, 3, 26.85, "citynight", {solid = false, uv = 3}); box(-9.84, F1, 22.1, -9.8, 3, 26.8, "citynight", {solid = false, uv = 4}); box(-7.14, F1, 22.1, -7.1, 3, 26.8, "citynight", {solid = false, uv = 4})
	var z := 22.6
	while z < 26.6:
		box(-8.55, F1, z, -8.45, F1 + 0.01, z + 0.6, "road_y", {solid = false}); z += 1.2
	cyl(-9.4, F1, 25.8, 0.05, 2.6, "dgrey", 6); box(-9.5, F1 + 2.5, 25.6, -9.1, F1 + 2.6, 26, "lamp", {solid = false})
	var g := W.build({shadow = false}); W = saveW; g.visible = false; scene.add_child(g); DREAM.g = g
	var L := plight("#ffd080", 0, 8, 1.5); L.position = Vector3(-9.2, 2.6, 25.7); scene.add_child(L); DREAM.L = L
	var wheel := MB.new(); wheel.cyl(0, 0, 0, 0.36, 0.22, MATS.tire, 16, null, "x"); wheel.cyl(0, 0, 0, 0.2, 0.24, MATS.chrome, 10, null, "x"); DREAM.wheel = wheel.build(); DREAM.wheel.visible = false; scene.add_child(DREAM.wheel)
# ================= 悪夢：遊園地（かくれんぼの練習）=================
var CARN := {g = null, ox = 600.0, oz = 0.0, ward = null, wheel = null, lights = [], sign = null, bedHide = null}
func buildCarnival() -> void:
	var saveW := W; W = MB.new(); var ox: float = CARN.ox; var oz: float = CARN.oz
	box(ox - 120, -0.5, oz - 120, ox + 120, 0, oz + 120, "concrete", {s = "stone", uv = 8})
	# はじめの囲い
	for q in [[-3, -3, 3, -2.8], [-3, -3, -2.8, 3], [2.8, -3, 3, 3]]: box(ox + q[0], 0, oz + q[1], ox + q[2], 1.4, oz + q[3], "red", {s = "metal"})
	box(ox - 3, 0, oz + 2.8, ox - 1, 1.4, oz + 3, "red", {s = "metal"}); box(ox + 1, 0, oz + 2.8, ox + 3, 1.4, oz + 3, "red", {s = "metal"})
	box(ox - 1.1, 0, oz + 2.85, ox - 0.95, 3.2, oz + 3, "yellow", {s = "metal"}); box(ox + 0.95, 0, oz + 2.85, ox + 1.1, 3.2, oz + 3, "yellow", {s = "metal"})
	# かくれる所：ベッドとたんす
	bed(ox - 5, 0, oz + 12, 1, "bed_b", 1.1, 2); CARN.ward = wardrobe(ox + 5, 0, oz + 12, 3, {w = 1.1, d = 0.6, h = 2.1, mat = "wood_d", hide = true, name = "たんす"})
	box(ox - 4.4, 0, oz + 10.6, ox - 4.3, 2, oz + 10.7, "wood_d", {solid = false}); box(ox + 4.3, 0, oz + 10.6, ox + 4.4, 2, oz + 10.7, "wood_d", {solid = false})
	# 観覧車（遠く）
	var fw := Node3D.new(); var fm := MB.new()
	for i in 16:
		var a := i / 16.0 * TAU; fm.rbox(cos(a) * 7, sin(a) * 7, 0, 0.2, 14, 0.2, 0, 0, a + PI / 2, MATS.white); fm.rbox(cos(a) * 14, sin(a) * 14, 0, 0.3, 0.3, 0.3, 0, 0, 0, MATS.bulbr)
	for i in 32:
		var a := i / 32.0 * TAU; fm.rbox(cos(a) * 14, sin(a) * 14, 0, 0.25, 2.8, 0.25, 0, 0, a, MATS.white)
	for i in 8:
		var a := i / 8.0 * TAU; fm.box(cos(a) * 14 - 0.6, sin(a) * 14 - 1.6, -0.6, cos(a) * 14 + 0.6, sin(a) * 14 - 0.4, 0.6, MATS[["red", "yellow", "blue", "green"][i % 4]])
	fw.add_child(fm.build()); fw.position = Vector3(ox + 10, 16, oz + 70); scene.add_child(fw); CARN.wheel = fw
	for s in [-1, 1]: rbox(ox + 10 + s * 5, 8, oz + 70, 0.4, 17, 0.4, 0, 0, s * 0.3, "white")
	# テント・屋台
	for q in [[-30, 50, "red"], [-18, 58, "yellow"], [28, 48, "blue"], [40, 60, "red"]]:
		cyl(ox + q[0], 0, oz + q[1], 3.5, 3, q[2], 12); cyl(ox + q[0], 3, oz + q[1], 3.6, 2.5, "white", 12, {rt = 0.1})
	var g := W.build(); W = saveW; scene.add_child(g); CARN.g = g; CARN.lights = []
	for xz in [[0, 6], [-5, 12], [5, 12]]:
		var L := plight("#ffe0a0", 0, 16, 1.4); L.position = Vector3(ox + xz[0], 4, oz + xz[1]); scene.add_child(L); CARN.lights.append(L)
	CARN.sign = signp(ox, 2.8, oz + 2.92, 1.9, 0.6, "tall", PI); signp(ox - 5, 2.2, oz + 10.72, 1, 0.38, "hidehere", PI); signp(ox + 5, 2.2, oz + 10.72, 1, 0.38, "hidehere", PI)
	CARN.bedHide = mkBedHide(ox - 5, 0, oz + 12, 0, Box.new(ox - 6.1, 0, oz + 11.4, ox - 3.9, 0.9, oz + 12.6), {x = ox - 5, y = 0, z = oz + 10.3}, "ベッド")
# ================= 最後：棺の中から見上げる =================
var GRAVE := {g = null, ox = 900.0, oz = 0.0, lid = null}
func buildGraveEnd() -> void:
	var saveW := W; W = MB.new(); var ox: float = GRAVE.ox; var oz: float = GRAVE.oz
	for q in [[-40, -40, 40, -1.6], [-40, 1.6, 40, 40], [-40, -1.6, -1, 1.6], [1, -1.6, 40, 1.6]]: box(ox + q[0], -0.5, oz + q[1], ox + q[2], 0, oz + q[3], "grass", {uv = 3})
	box(ox - 1, -2.2, oz - 1.6, ox + 1, -2, oz + 1.6, "dirt", {solid = false})
	for q in [[-1, -1.6, -0.8, 1.6], [0.8, -1.6, 1, 1.6], [-1, -1.6, 1, -1.4], [-1, 1.4, 1, 1.6]]: box(ox + q[0], -2.2, oz + q[1], ox + q[2], 0, oz + q[3], "dirt", {solid = false})
	var cf := MB.new(); cf.box(-0.42, 0, -1.1, 0.42, 0.08, 1.1, MATS.wood_d)
	for q in [[-0.42, -1.1, -0.34, 1.1], [0.34, -1.1, 0.42, 1.1], [-0.42, -1.1, 0.42, -1.02], [-0.42, 1.02, 0.42, 1.1]]: cf.box(q[0], 0, q[1], q[2], 0.5, q[3], MATS.wood_d)
	cf.box(-0.34, 0.08, -1.02, 0.34, 0.14, 1.02, MATS.fab_r); var cg := cf.build(); cg.position = Vector3(ox, -2, oz); scene.add_child(cg)
	box(ox - 0.06, 0, oz - 2.2, ox + 0.06, 1.6, oz - 2.08, "wood_d", {solid = false}); box(ox - 0.45, 1.05, oz - 2.2, ox + 0.45, 1.17, oz - 2.08, "wood_d", {solid = false}) # 十字架
	for i in 7:
		var a := i / 7.0 * TAU + 0.4; var r := rr(8, 14); treeAt(ox + cos(a) * r, oz + sin(a) * r, 1.2)
	var g := W.build(); W = saveW; scene.add_child(g); GRAVE.g = g
	var lid := mesh(G.box(0.86, 0.07, 2.2), MATS.wood_m, true); scene.add_child(lid); GRAVE.lid = lid; lid.visible = false
