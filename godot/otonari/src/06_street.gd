
# ================= 町（通り・家の外まわりの部品）=================
# 三角の妻壁（屋根の下の三角）
func gable(x: float, z0: float, z1: float, y0: float, y1: float, mat, axis := "z", t := 0.3) -> void:
	var L := absf(z1 - z0)
	var g := G.extrude(PackedVector2Array([Vector2(0, 0), Vector2(L, 0), Vector2(L / 2, y1 - y0)]), t)
	var tr: Transform3D
	if axis == "z": tr = Transform3D(Basis(Vector3.UP, -PI / 2), Vector3(x + t / 2, y0, minf(z0, z1)))
	else: tr = Transform3D(Basis(), Vector3(minf(z0, z1), y0, x - t / 2))
	var m := M(mat); var uv := muv(m)
	W.geo(g, tr, m, 1.0 / uv, 1.0 / uv)
# 切妻屋根：棟がXにそう（z0..z1 の家、y0 からの高さ rise）
func roofX(x0: float, x1: float, z0: float, z1: float, y0: float, rise: float, mat, over := 0.5, th := 0.18) -> void:
	var zc := (z0 + z1) / 2; var half := (z1 - z0) / 2 + over; var ang := atan2(rise, (z1 - z0) / 2); var len := half / cos(ang)
	var cy := y0 + (rise - over * tan(ang)) / 2 + th / 2
	rbox((x0 + x1) / 2, cy, zc - half / 2, x1 - x0 + over * 2, th, len, -ang, 0, 0, mat)
	rbox((x0 + x1) / 2, cy, zc + half / 2, x1 - x0 + over * 2, th, len, ang, 0, 0, mat)
	box(x0 - over, y0 + rise - 0.02, zc - 0.12, x1 + over, y0 + rise + 0.2, zc + 0.12, "roof_dark", {solid = false})
	# 雨どい
	var ey := y0 - over * tan(ang)
	box(x0 - over, ey - 0.1, z0 - over - 0.08, x1 + over, ey, z0 - over + 0.04, "trim", {solid = false}); box(x0 - over, ey - 0.1, z1 + over - 0.04, x1 + over, ey, z1 + over + 0.08, "trim", {solid = false})
# 車（ベータ1：ドアもトランクのふたもない）
func carModel(x: float, z: float, k: int, body) -> Dictionary:
	var f := XF(x, 0, z, k) # ローカル：前が+Z
	var MT := {s = "metal"}
	f.box(-0.9, 0.3, -1.1, 0.9, 0.85, 2.1, body, MT); f.box(-0.9, 0.3, -2.1, 0.9, 0.55, -1.1, body, MT); f.box(-0.9, 0.55, -2.1, -0.8, 0.85, -1.1, body, MT); f.box(0.8, 0.55, -2.1, 0.9, 0.85, -1.1, body, MT); f.box(-0.9, 0.55, -2.1, 0.9, 0.85, -2.0, body, MT); f.box(-0.8, 0.55, -2.0, 0.8, 0.56, -1.1, "black", NS); f.box(-0.85, 0.85, -1.1, 0.85, 1.45, 0.9, body, MT); f.box(-0.8, 0.9, -1.05, 0.8, 1.4, 0.85, "dgrey", NS)
	# 窓（空いている）と柱
	for zz in [-1.05, 0.85]: f.box(-0.85, 0.85, zz, 0.85, 1.45, zz + 0.05, "glass", NS)
	f.box(-0.85, 1.4, -1.1, 0.85, 1.45, 0.9, body, NS)
	for xx in [-0.86, 0.8]:
		for zz in [-1.1, -0.1, 0.86]: f.box(xx, 0.85, zz, xx + 0.06, 1.45, zz + 0.06, body, NS)
	# ドアの穴（ベータ1）
	for s in [-1, 1]: f.box(s * 0.905 - 0.01, 0.4, -0.9, s * 0.905 + 0.01, 0.84, 0.5, "black", NS)
	# 座席
	f.box(-0.75, 0.35, -0.6, 0.75, 0.75, 0, "fab_w", NS); f.box(-0.75, 0.75, -0.62, 0.75, 1.15, -0.48, "fab_w", NS); f.box(-0.75, 0.35, 0.1, -0.05, 0.7, 0.55, "fab_w", NS); f.box(0.05, 0.35, 0.1, 0.75, 0.7, 0.55, "fab_w", NS)
	# ライト
	f.box(-0.8, 0.55, 2.1, -0.5, 0.72, 2.12, "bulb", NS); f.box(0.5, 0.55, 2.1, 0.8, 0.72, 2.12, "bulb", NS); f.box(-0.85, 0.55, -2.12, -0.6, 0.7, -2.1, "red", NS); f.box(0.6, 0.55, -2.12, 0.85, 0.7, -2.1, "red", NS)
	f.box(-0.95, 0.3, 2.05, 0.95, 0.45, 2.2, "chrome", NS); f.box(-0.95, 0.3, -2.2, 0.95, 0.45, -2.05, "chrome", NS)
	for ab in [[-0.85, -1.35], [0.85, -1.35], [-0.85, 1.35], [0.85, 1.35]]:
		f.cyl(ab[0], 0.36, ab[1], 0.36, 0.24, "tire", 14, {axis = "x", rot = f.yaw}); f.cyl(ab[0] * 1.02, 0.36, ab[1], 0.2, 0.25, "chrome", 10, {axis = "x", rot = f.yaw})
	# トランク（ふたなし）：くぼみ
	return {f = f, trunk = f.p(0, 0.55, -1.65)}
func treeAt(x: float, z: float, s := 1.0, kind := 0) -> void:
	var r := mulberry(int((x * 31 + z * 17) * 100)); cyl(x, 0, z, 0.22 * s, 2.2 * s, "bark", 8, {solid = true, s = "wood"})
	if kind == 1:
		for i in 3: cyl(x, 1.6 * s + i * 1.1 * s, z, (2 - i * 0.5) * s, 1.6 * s, "leafm", 10, {rt = 0.1})
		return
	for i in 7:
		var a := r.next() * TAU; var d := r.next() * 1.1 * s
		W.sphere(x + cos(a) * d, 2.7 * s + r.next() * 1.6 * s, z + sin(a) * d, (1.1 + r.next() * 0.6) * s, MATS.leafm, 1, 0.85, 1, 9)
func bush(x: float, z: float, s := 1.0) -> void:
	var r := mulberry(int((x * 13 + z * 7) * 100))
	for i in 3: W.sphere(x + (r.next() - 0.5) * 0.6 * s, 0.35 * s, z + (r.next() - 0.5) * 0.6 * s, 0.5 * s, MATS.leafm, 1, 0.8, 1, 8)
	add_solid(x - 0.5 * s, 0, z - 0.5 * s, x + 0.5 * s, 0.8 * s, z + 0.5 * s, "grass")
func flowers(x0: float, z0: float, x1: float, z1: float) -> void:
	box(x0, 0, z0, x1, 0.12, z1, "dirt", {s = "dirt"}); var r := mulberry(int((x0 * 7 + z0) * 100))
	var x := x0 + 0.15
	while x < x1 - 0.1:
		var z := z0 + 0.15
		while z < z1 - 0.1:
			var c: String = ["red", "yellow", "pink", "orange", "cream", "blue"][int(r.next() * 6)]
			cyl(x + (r.next() - 0.5) * 0.1, 0.12, z + (r.next() - 0.5) * 0.1, 0.012, 0.25, "green", 4); W.sphere(x, 0.4, z, 0.06, MATS[c], 1, 0.7, 1, 6)
			z += 0.3
		x += 0.3
func picket(x0: float, z0: float, x1: float, z1: float, h := 0.95) -> void:
	var L := Vector2(x1 - x0, z1 - z0).length(); var n := floori(L / 0.18); var dx := (x1 - x0) / L; var dz := (z1 - z0) / L
	for i in n + 1:
		var x := x0 + dx * i * 0.18; var z := z0 + dz * i * 0.18; box(x - 0.04, 0, z - 0.04, x + 0.04, h, z + 0.04, "fence", {solid = false, uv = 1})
	box(minf(x0, x1) - 0.02, h * 0.3, minf(z0, z1) - 0.02, maxf(x0, x1) + 0.02, h * 0.38, maxf(z0, z1) + 0.02, "fence", {solid = false}); box(minf(x0, x1) - 0.02, h * 0.72, minf(z0, z1) - 0.02, maxf(x0, x1) + 0.02, h * 0.8, maxf(z0, z1) + 0.02, "fence", {solid = false})
	add_solid(minf(x0, x1) - 0.05, 0, minf(z0, z1) - 0.05, maxf(x0, x1) + 0.05, h, maxf(z0, z1) + 0.05, "wood")
func mailbox(x: float, z: float, col := "blue") -> void:
	cyl(x, 0, z, 0.05, 1, "wood_d", 6, {solid = true}); box(x - 0.14, 1, z - 0.25, x + 0.14, 1.25, z + 0.25, col, {s = "metal"}); box(x + 0.14, 1.1, z - 0.05, x + 0.17, 1.35, z, "red", {solid = false})
# 飾りの家
func fakeHouse(x: float, z: float, k: int, sid, roof, seed: int) -> void:
	var f := XF(x, 0, z, k); var r := mulberry(seed); var w := 8 + r.next() * 3; var d := 7 + r.next() * 2; var h := 3.0 + (3.0 if r.next() < 0.5 else 0.0)
	f.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, sid, {s = "wood"}); f.box(-w / 2 - 0.1, 0, -d / 2 - 0.1, w / 2 + 0.1, 0.3, d / 2 + 0.1, "stone", NS)
	# 窓とドア
	for xx in [-w / 4, w / 4]:
		var yy := 1.1
		while yy < h - 0.5:
			f.box(xx - 0.6, yy, d / 2, xx + 0.6, yy + 1.1, d / 2 + 0.05, "winf", NS); f.box(xx - 0.5, yy + 0.1, d / 2 + 0.05, xx + 0.5, yy + 1, d / 2 + 0.06, "glassd", NS)
			yy += 3
	f.box(-0.5, 0.3, d / 2, 0.5, 2.4, d / 2 + 0.06, "door_r", NS)
	var c := f.p(0, 0, 0); var rise := 2.2; var over := 0.6; var ang := atan2(rise, d / 2); var L := (d / 2 + over) / cos(ang); var cy := h + (rise - over * tan(ang)) / 2 + 0.1
	if k % 2 == 0:
		rbox(c.x, cy, c.z - (d / 2 + over) / 2, w + 1, 0.2, L, -ang, 0, 0, roof); rbox(c.x, cy, c.z + (d / 2 + over) / 2, w + 1, 0.2, L, ang, 0, 0, roof)
		gable(c.x - w / 2, c.z - d / 2, c.z + d / 2, h, h + rise, sid, "z", 0.1); gable(c.x + w / 2, c.z - d / 2, c.z + d / 2, h, h + rise, sid, "z", 0.1)
	else:
		rbox(c.x - (d / 2 + over) / 2, cy, c.z, L, 0.2, w + 1, 0, 0, ang, roof); rbox(c.x + (d / 2 + over) / 2, cy, c.z, L, 0.2, w + 1, 0, 0, -ang, roof)
		gable(c.z - w / 2, c.x - d / 2, c.x + d / 2, h, h + rise, sid, "x", 0.1); gable(c.z + w / 2, c.x - d / 2, c.x + d / 2, h, h + rise, sid, "x", 0.1)
func beam(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, s := 0.2, mat = "beam") -> void:
	var dx := x1 - x0; var dy := y1 - y0; var dz := z1 - z0; var L := Vector3(dx, dy, dz).length(); var yaw := atan2(dx, dz); var pit := -atan2(dy, Vector2(dx, dz).length())
	rbox((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, s, s, L, pit, yaw, 0, mat)
# 打ちつけた板（ハンマーかバールではがす）
func mkDoorBoard(x: float, y: float, z: float, ang: float) -> Dictionary:
	var m := mesh(G.box(1.35, 0.18, 0.05), MATS.raw, true); m.position = Vector3(x, y, z); m.rotation.z = ang; scene.add_child(m)
	var nails := []
	for s in [-1, 1]:
		var n := mesh(G.cylinder(0.015, 0.015, 0.03, 6), MATS.metal_dark); n.rotation.x = PI / 2; n.position = Vector3(x + s * 0.58 * cos(ang), y + s * 0.58 * sin(ang), z - 0.03); scene.add_child(n); nails.append(n)
	var B := {m = m, nails = nails, on = false, x = x, y = y, z = z, it = null}
	B.setOn = func(on: bool) -> void:
		B.on = on; m.visible = on
		for n in nails: n.visible = on
	B.it = addIt({box = Box.new(x - 0.62, y - 0.3, z - 0.08, x + 0.62, y + 0.3, z + 0.04), label = func(_it): return {t = "板が打ちつけてある", k = "", n = "板"} if B.on else null,
		act = func():
			if B.on: toast("ハンマーかバールがあればはがせそう"),
		use = func(it):
			if B.on and (it.type == "crowbar" or it.type == "hammer"):
				pryBoard(B); return true
			return false,
		useLabel = func(it): return "バールで板をはがす" if B.on and it.type == "crowbar" else "ハンマーで板をはがす" if B.on and it.type == "hammer" else null})
	B.setOn.call(false)
	return B
func pryBoard(B: Dictionary) -> void:
	sfx("pry"); PL.swing = 0.5; noise(B.x, B.y, B.z, 9, "pry")
	after(0.45, func():
		B.setOn.call(false); sfx("boardfall"); var p := spawnProp("board", B.x, B.y - 0.1, B.z - 0.25, 0); propDropAt(p, B.x, B.y - 0.1, B.z - 0.3, PI / 2, Vector3(0, 1, -1.2))
		if story.get("onBoard"): story.onBoard.call(B))
