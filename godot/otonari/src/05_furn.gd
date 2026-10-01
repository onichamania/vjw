
# ================= 家具 =================
# XF：ローカル座標（前が+Z）を k*90° 回して置く。k: 0→前が+Z 1→+X 2→-Z 3→-X
class XFo:
	var g
	var k: int
	var ox: float
	var oy: float
	var oz: float
	var c: float
	var s: float
	var yaw: float
	func _init(game, x: float, y: float, z: float, kk: int) -> void:
		g = game; k = kk & 3; ox = x; oy = y; oz = z
		c = [1.0, 0.0, -1.0, 0.0][k]; s = [0.0, 1.0, 0.0, -1.0][k]; yaw = k * PI / 2
	func tx(x: float, z: float) -> float: return ox + x * c + z * s
	func tz(x: float, z: float) -> float: return oz - x * s + z * c
	func p(x: float, y: float, z: float) -> Vector3: return Vector3(tx(x, z), oy + y, tz(x, z))
	func dir(nx: float, nz: float) -> Array: return [nx * c + nz * s, -nx * s + nz * c]
	func box(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, mat, o := {}):
		var ax := tx(x0, z0); var az := tz(x0, z0); var bx := tx(x1, z1); var bz := tz(x1, z1)
		return g.box(minf(ax, bx), oy + y0, minf(az, bz), maxf(ax, bx), oy + y1, maxf(az, bz), mat, o)
	func cyl(x: float, y: float, z: float, r: float, h: float, mat, seg := 12, o := {}) -> void: g.cyl(tx(x, z), oy + y, tz(x, z), r, h, mat, seg, o)
	func sphere(x: float, y: float, z: float, r: float, mat, sx := 1.0, sy := 1.0, sz := 1.0) -> void:
		g.W.sphere(tx(x, z), oy + y, tz(x, z), r, g.M(mat), sz if k % 2 else sx, sy, sx if k % 2 else sz)
	func rbox(cx: float, cy: float, cz: float, sx: float, sy: float, sz: float, rx: float, ry: float, rz: float, mat, o := {}) -> void:
		g.rbox(tx(cx, cz), oy + cy, tz(cx, cz), sx, sy, sz, rx, ry + k * PI / 2, rz, mat, o)
func XF(ox: float, oy: float, oz: float, k := 0) -> XFo: return XFo.new(self, ox, oy, oz, k)
const NS := {solid = false}
# ---- 基本の家具 ----
func table(x: float, y: float, z: float, w: float, d: float, h := 0.76, mat = "wood_m", k := 0) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, h - 0.05, -d / 2, w / 2, h, d / 2, mat)
	for ab in [[-1, -1], [1, -1], [-1, 1], [1, 1]]: f.box(ab[0] * (w / 2 - 0.06) - 0.03, 0, ab[1] * (d / 2 - 0.06) - 0.03, ab[0] * (w / 2 - 0.06) + 0.03, h - 0.05, ab[1] * (d / 2 - 0.06) + 0.03, mat, NS)
	add_solid(minf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2)), y, minf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2)), maxf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2)), y + h - 0.05, maxf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2)), "wood", "under")
func sofa(x: float, y: float, z: float, k: int, mat = "sofa_g", w := 2.0) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0.12, -0.45, w / 2, 0.45, 0.45, mat); f.box(-w / 2, 0.45, -0.45, w / 2, 0.95, -0.2, mat); f.box(-w / 2, 0.45, -0.45, -w / 2 + 0.2, 0.7, 0.45, mat); f.box(w / 2 - 0.2, 0.45, -0.45, w / 2, 0.7, 0.45, mat)
	f.box(-w / 2 + 0.2, 0.45, -0.2, -0.02, 0.58, 0.42, mat, NS); f.box(0.02, 0.45, -0.2, w / 2 - 0.2, 0.58, 0.42, mat, NS); f.box(-w / 2 + 0.05, 0, -0.4, w / 2 - 0.05, 0.12, 0.4, "wood_d", NS)
func armchair(x: float, y: float, z: float, k: int, mat = "sofa_r") -> void: sofa(x, y, z, k, mat, 0.95)
func bed(x: float, y: float, z: float, k: int, mat = "bed_b", w := 1.1, l := 2.05) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -l / 2, w / 2, 0.35, l / 2, "wood_d"); f.box(-w / 2 + 0.03, 0.35, -l / 2 + 0.03, w / 2 - 0.03, 0.55, l / 2 - 0.03, "sheet"); f.box(-w / 2 + 0.02, 0.4, -l / 2 + 0.5, w / 2 - 0.02, 0.6, l / 2 - 0.02, mat, NS)
	f.box(-w / 2, 0, -l / 2 - 0.06, w / 2, 1.05, -l / 2, "wood_d"); f.box(-w / 2, 0, l / 2, w / 2, 0.7, l / 2 + 0.06, "wood_d"); f.box(-w / 2 + 0.12, 0.55, -l / 2 + 0.1, w / 2 - 0.12, 0.72, -l / 2 + 0.45, "sheet", NS)
func tvSet(x: float, y: float, z: float, k: int) -> MeshInstance3D:
	var f := XF(x, y, z, k); f.box(-0.6, 0, -0.22, 0.6, 0.5, 0.22, "wood_d"); f.box(-0.45, 0.5, -0.2, 0.45, 1.02, 0.18, "dgrey")
	# 画面（動く素材）
	var p := f.p(0, 0.76, 0.185); var m := mesh(G.plane(0.78, 0.44), MATS.tvscreen.duplicate()); m.position = p; m.rotation.y = f.yaw; scene.add_child(m); f.box(-0.12, 1.02, -0.05, 0.12, 1.06, 0.05, "black", NS)
	f.cyl(0.1, 1.06, 0, 0.006, 0.3, "chrome", 4); f.cyl(-0.1, 1.06, 0, 0.006, 0.3, "chrome", 4)
	return m
func shelf(x: float, y: float, z: float, k: int, w := 1.2, h := 1.8, d := 0.35, mat = "wood_d", fill := true) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, mat); f.box(-w / 2, 0, -d / 2, -w / 2 + 0.04, h, d / 2, mat, NS); f.box(w / 2 - 0.04, 0, -d / 2, w / 2, h, d / 2, mat, NS)
	add_solid(minf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2)), y, minf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2)), maxf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2)), y + h, maxf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2)), "wood")
	var n := roundi(h / 0.45)
	for i in n + 1:
		var yy := i * h / n; f.box(-w / 2 + 0.04, yy, -d / 2, w / 2 - 0.04, yy + 0.03, d / 2, mat, NS)
		if fill and i < n:
			var xx := -w / 2 + 0.08; var r := mulberry(int((x * 7 + z * 13 + i) * 1000))
			while xx < w / 2 - 0.12:
				var bw := 0.03 + r.next() * 0.05; var bh := 0.2 + r.next() * 0.16; var col: String = ["bookc", "red", "blue", "green", "yellow", "brown", "teal", "cream"][int(r.next() * 8)]
				f.box(xx, yy + 0.03, -d / 2 + 0.05, xx + bw, yy + 0.03 + bh, d / 2 - 0.04, col, NS); xx += bw + (0.12 if r.next() < 0.15 else 0.005)
func counter(x: float, y: float, z: float, k: int, w: float, d := 0.62, h := 0.9, top = "lgrey", body = "cab") -> XFo:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -d / 2, w / 2, h - 0.04, d / 2 - 0.02, body); f.box(-w / 2 - 0.02, h - 0.04, -d / 2, w / 2 + 0.02, h, d / 2 + 0.02, top); f.box(-w / 2, 0, d / 2 - 0.06, w / 2, 0.1, d / 2 - 0.02, "black", NS)
	return f
func upperCab(x: float, y: float, z: float, k: int, w: float, mat = "cab") -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -0.17, w / 2, 0.7, 0.17, mat)
	var xx := -w / 2
	while xx < w / 2 - 0.01:
		f.box(xx + 0.02, 0.04, 0.17, xx + 0.48, 0.66, 0.19, "cabd", NS); xx += 0.5
func lamp(x: float, y: float, z: float, h := 1.5) -> void:
	cyl(x, y, z, 0.16, 0.03, "dgrey", 10); cyl(x, y, z, 0.02, h, "chrome", 6); cyl(x, y + h - 0.05, z, 0.22, 0.32, "lamp", 12, {rt = 0.12}); add_solid(x - 0.12, y, z - 0.12, x + 0.12, y + h, z + 0.12, "metal")
func ceilLamp(x: float, y: float, z: float) -> void:
	cyl(x, y - 0.3, z, 0.01, 0.3, "black", 4); W.sphere(x, y - 0.38, z, 0.13, MATS.bulb, 1, 0.7, 1); cyl(x, y - 0.36, z, 0.2, 0.12, "lamp", 12, {rt = 0.06})
func rug(x0: float, z0: float, x1: float, z1: float, y: float, mat = "carpet_r") -> void:
	box(x0, y, z0, x1, y + 0.015, z1, mat, {solid = false, uv = maxf(x1 - x0, z1 - z0)})
func picture(x: float, y: float, z: float, k: int, w := 0.6, h := 0.45, seed := 1) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -0.02, w / 2, h, 0.02, "wood_d", NS); var r := mulberry(seed * 991); var cols := ["sid_blue", "green", "yellow", "blue", "pink", "teal", "orange"]
	f.box(-w / 2 + 0.05, 0.05, 0.02, w / 2 - 0.05, h - 0.05, 0.025, ["cream", "lgrey"][seed % 2], NS); f.box(-w / 2 + 0.08, 0.08, 0.025, w / 2 - 0.08, h * 0.45, 0.03, cols[int(r.next() * 7)], NS); f.box(-w / 2 + 0.08, h * 0.45, 0.025, w / 2 - 0.08, h - 0.08, 0.028, ["sid_blue", "teal", "cream"][seed % 3], NS)
	f.sphere(w * (r.next() - 0.5) * 0.5, h * 0.62, 0.03, 0.05, "yellow", 1, 1, 0.2)
func plant(x: float, y: float, z: float, s := 1.0) -> void:
	cyl(x, y, z, 0.16 * s, 0.3 * s, "pot_c", 10, {rt = 0.2 * s})
	for i in 5:
		var a := i / 5.0 * TAU; W.sphere(x + cos(a) * 0.1 * s, y + 0.45 * s + (i % 2) * 0.1 * s, z + sin(a) * 0.1 * s, 0.16 * s, MATS.leafm, 1, 1.2, 1)
	add_solid(x - 0.18 * s, y, z - 0.18 * s, x + 0.18 * s, y + 0.7 * s, z + 0.18 * s, "wood")
func toilet(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.2, 0, -0.35, 0.2, 0.42, 0.15, "porcelain"); f.box(-0.22, 0.42, -0.36, 0.22, 0.46, 0.18, "porcelain", NS); f.box(-0.24, 0.4, -0.42, 0.24, 0.85, -0.26, "porcelain")
func tub(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.4, 0, -0.85, 0.4, 0.55, 0.85, "porcelain"); f.box(-0.33, 0.3, -0.78, 0.33, 0.52, 0.78, "water", NS); f.cyl(0, 0.55, -0.8, 0.02, 0.25, "chrome", 6)
func sinkUnit(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.3, 0, -0.22, 0.3, 0.8, 0.22, "cab"); f.box(-0.32, 0.8, -0.24, 0.32, 0.86, 0.24, "porcelain"); f.cyl(0, 0.86, -0.14, 0.02, 0.18, "chrome", 6); f.box(-0.25, 1.2, -0.24, 0.25, 1.75, -0.22, "mirror", NS)
func washer(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.3, 0, -0.3, 0.3, 0.88, 0.3, "fridge"); f.cyl(0, 0.45, 0.3, 0.2, 0.02, "glassb", 16, {axis = "z"}); f.box(-0.25, 0.78, 0.3, 0.25, 0.84, 0.31, "lgrey", NS)
func crate(x: float, y: float, z: float, s := 0.6, mat = "raw") -> void:
	box(x - s / 2, y, z - s / 2, x + s / 2, y + s, z + s / 2, mat, {uv = s}); box(x - s / 2 - 0.01, y + s * 0.4, z - s / 2 - 0.01, x + s / 2 + 0.01, y + s * 0.55, z + s / 2 + 0.01, "beam", {solid = false, uv = s})
func barrel(x: float, y: float, z: float, mat = "rust") -> void:
	cyl(x, y, z, 0.3, 0.9, mat, 12, {solid = true, s = "metal"}); cyl(x, y + 0.2, z, 0.31, 0.05, "metal_dark", 12); cyl(x, y + 0.65, z, 0.31, 0.05, "metal_dark", 12)
func fireplace(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.8, 0, -0.3, 0.8, 1.1, 0.25, "brick"); f.box(-0.45, 0, 0.0, 0.45, 0.7, 0.26, "black", NS); f.box(-0.9, 1.1, -0.32, 0.9, 1.18, 0.32, "wood_d"); f.box(-0.5, 1.18, -0.3, 0.5, 2.8, 0.1, "brick")
func desk(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.7, 0.72, -0.35, 0.7, 0.77, 0.35, "wood_m"); f.box(-0.7, 0, -0.35, -0.25, 0.72, 0.35, "wood_m"); f.box(0.62, 0, -0.35, 0.7, 0.72, 0.35, "wood_m")
	f.box(-0.65, 0.2, 0.35, -0.3, 0.66, 0.36, "cabd", NS); f.box(-0.2, 0.77, -0.2, 0.15, 0.8, 0.1, "cream", NS)
func coatRack(x: float, y: float, z: float) -> void:
	cyl(x, y, z, 0.03, 1.8, "wood_d", 6); cyl(x, y, z, 0.2, 0.03, "wood_d", 8)
	for i in 4:
		var a := i / 4.0 * TAU; cyl(x + cos(a) * 0.12, y + 1.65, z + sin(a) * 0.12, 0.02, 0.12, "wood_d", 4)
	W.sphere(x + 0.12, y + 1.45, z, 0.13, MATS.fab_r, 1, 2.5, 1)
func clockWall(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.cyl(0, 0, 0, 0.18, 0.04, "cream", 16, {axis = "z"})
# ---- 開け閉めできる家具 ----
# 戸棚（両開き）：ローカルで前が+Z。中に物を入れられる。hide=true なら隠れられる
func wardrobe(x: float, y: float, z: float, k: int, o := {}) -> Dictionary:
	var w: float = o.get("w", 1.1); var d: float = o.get("d", 0.6); var h: float = o.get("h", 2.0); var mat = o.get("mat", "wood_d"); var f := XF(x, y, z, k)
	# 箱（前はあいている）
	f.box(-w / 2, 0, -d / 2, w / 2, 0.08, d / 2, mat, {s = "wood"}); f.box(-w / 2, h - 0.06, -d / 2, w / 2, h, d / 2, mat); f.box(-w / 2, 0, -d / 2, -w / 2 + 0.04, h, d / 2, mat); f.box(w / 2 - 0.04, 0, -d / 2, w / 2, h, d / 2, mat)
	if not o.get("noBack"): f.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, mat)
	if o.get("shelf"): f.box(-w / 2 + 0.04, o.shelf, -d / 2 + 0.03, w / 2 - 0.04, o.shelf + 0.04, d / 2 - 0.02, mat)
	if not o.get("noRod") and not o.get("shelf"):
		f.cyl(0, h - 0.25, 0, 0.015, w - 0.1, "chrome", 6, {axis = "x", rot = f.yaw})
		for i in 3:
			var hx := -w / 2 + 0.2 + i * (w - 0.4) / 2; f.box(hx - 0.2, h - 0.9, -0.03, hx + 0.2, h - 0.28, 0.03, ["fab_r", "fab_b", "fab_y"][i], NS)
	# 扉2枚
	var leaves := []; var ax := "z" if k % 2 else "x"; var fz := d / 2 + 0.015
	for side in [-1, 1]:
		var hp := f.p(side * w / 2, 0, fz); var cp := f.p(side * w / 4, 0, fz)
		var hs := sgn(hp.x - cp.x) if ax == "x" else sgn(hp.z - cp.z); var fr := f.dir(0, 1); var sw: float = sgn(fr[1]) if ax == "x" else sgn(fr[0])
		leaves.append(mkLeaf({x = cp.x, y = y + 0.04, z = cp.z, w = w / 2 - 0.01, h = h - 0.08, axis = ax, hinge = hs, swing = sw, mat = o.get("lm", mat), t = 0.03, ang = PI * 0.62,
			deco = func(mb: MB, s: float, ww: float, hh: float, t: float) -> void:
				mb.box(minf(s * ww * 0.15, s * ww * 0.85), hh * 0.1, t / 2, maxf(s * ww * 0.15, s * ww * 0.85), hh * 0.45, t / 2 + 0.01, MATS.cabd, 63, 1)
				mb.box(minf(s * ww * 0.15, s * ww * 0.85), hh * 0.55, t / 2, maxf(s * ww * 0.15, s * ww * 0.85), hh * 0.9, t / 2 + 0.01, MATS.cabd, 63, 1)}))
	var bx := Box.new(minf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2 + 0.05)), y, minf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2 + 0.05)), maxf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2 + 0.05)), y + h, maxf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2 + 0.05)))
	var cab := {leaves = leaves, props = [], f = f, frame = func() -> Transform3D: return Transform3D(Basis(Vector3.UP, f.yaw), f.p(0, 0, 0)), front = null, hide = null, it = null, c = null}
	# 閉まっているときの前の当たり
	var a := f.p(-w / 2, 0, d / 2 - 0.02); var b := f.p(w / 2, 0, d / 2 + 0.03)
	cab.front = dyn_box(minf(a.x, b.x), y, minf(a.z, b.z), maxf(a.x, b.x), y + h, maxf(a.z, b.z), "wood", cab)
	if o.get("hide"):
		var out := f.p(0, 0, d / 2 + 0.55)
		cab.hide = mkHide({pos = f.p(0, 1.3, 0), yaw = f.yaw + PI, box = bx, cab = cab, name = o.get("name", "クローゼット"), out = {x = out.x, y = y + 0.02, z = out.z}})
	else:
		var c := mkCabinet(bx, leaves, o.get("name", "戸棚"), {onToggle = func(op): cab.front.on = not op})
		cab.it = c.it; cab.c = c
	return cab
# 冷蔵庫（上が冷凍庫）
func fridgeUnit(x: float, y: float, z: float, k: int) -> Dictionary:
	var f := XF(x, y, z, k); var w := 0.86; var d := 0.72; var h := 1.85
	f.box(-w / 2, 0, -d / 2, w / 2, h, d / 2 - 0.04, "fridge"); f.box(-w / 2 + 0.04, 0.04, -d / 2 + 0.06, w / 2 - 0.04, h - 0.04, d / 2 - 0.04, "fridgein", NS); f.box(-w / 2 + 0.04, 1.25, -d / 2 + 0.06, w / 2 - 0.04, 1.29, d / 2 - 0.05, "fridge", NS)
	f.box(-w / 2 + 0.06, 0.55, -d / 2 + 0.08, w / 2 - 0.06, 0.57, d / 2 - 0.06, "glass", NS)
	var ax := "z" if k % 2 else "x"; var fz := d / 2 - 0.02
	var mkL := func(y0: float, hh: float) -> Dictionary:
		var hp := f.p(-w / 2, 0, fz); var cp := f.p(0, 0, fz)
		var hs := sgn(hp.x - cp.x) if ax == "x" else sgn(hp.z - cp.z); var fr := f.dir(0, 1); var sw: float = sgn(fr[1]) if ax == "x" else sgn(fr[0])
		return mkLeaf({x = cp.x, y = y + y0, z = cp.z, w = w, h = hh, axis = ax, hinge = hs, swing = sw, mat = "fridge", t = 0.06, ang = PI * 0.55, ky = 0.5, km = "lgrey"})
	var low: Dictionary = mkL.call(0.02, 1.22); var top: Dictionary = mkL.call(1.27, 0.56)
	var bL := Box.new(minf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2 + 0.05)), y, minf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2 + 0.05)), maxf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2 + 0.05)), y + 1.25, maxf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2 + 0.05)))
	var bT := Box.new(bL.x0, y + 1.27, bL.z0, bL.x1, y + h, bL.z1)
	var cl := mkCabinet(bL, [low], "冷蔵庫", {snd = "fridge"}); var ct := mkCabinet(bT, [top], "冷凍庫", {snd = "fridge"})
	return {f = f, low = low, top = top, cl = cl, ct = ct, frame = func() -> Transform3D: return Transform3D(Basis(Vector3.UP, f.yaw), f.p(0, 0, 0)), props = []}
# コンロ
func stoveUnit(x: float, y: float, z: float, k: int) -> XFo:
	var f := XF(x, y, z, k); f.box(-0.32, 0, -0.3, 0.32, 0.88, 0.3, "fridge"); f.box(-0.33, 0.88, -0.31, 0.33, 0.92, 0.31, "black")
	for ab in [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]]: f.cyl(ab[0], 0.92, ab[1], 0.08, 0.01, "dgrey", 10)
	f.box(-0.26, 0.15, 0.3, 0.26, 0.65, 0.31, "black", NS); f.box(-0.32, 0.92, -0.31, 0.32, 1.15, -0.27, "fridge")
	for i in 4: f.cyl(-0.21 + i * 0.14, 1.0, -0.26, 0.025, 0.02, "black", 8, {axis = "z"})
	return f
