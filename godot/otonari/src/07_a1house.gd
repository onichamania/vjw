
# ================= おとなりさんの家（アルファ1）=================
# 本体 x:-10..10 z:14..32、ガレージ x:-17..-10 z:14..24
# 1階の床 0.3 / 1階の天井 3.2（水びたしの部屋の下は 2.8）/ 2階の床 3.5 / 2階の天井 6.4
var A := {}
const F1 := 0.3
const C1 := 3.2
const F2 := 3.5
const C2 := 6.4
const F3 := 6.7
const PT := 2.8
const WS := 3.45 # PT:プールの底の下 WS:水面
func buildA1House() -> void:
	var T := 0.3; var t := 0.15
	# ================= 1階 =================
	# 床
	slab(-10, 14, -2, 22, F1, 0.3, "floor", null); slab(-2, 14, 2, 32, F1, 0.3, "floor_dark", null); slab(2, 14, 10, 21.4, F1, 0.3, "tile_k", null, {s = "tile"})
	slab(2, 21.4, 6, 26, F1, 0.3, "floor", null); slab(6, 21.4, 10, 26, F1, 0.3, "floor", null); slab(2, 26, 6, 32, F1, 0.3, "concrete", null, {s = "stone"}); slab(6, 26, 10, 32, F1, 0.3, "tile_w", null, {s = "tile"})
	slab(-10, 27, -2, 32, F1, 0.3, "floor", null); slab(-10, 22, -7, 22.9, F1, 0.3, "concrete", null, {s = "stone"})
	# 墓の部屋：まん中に穴
	slab(-7, 22, -2, 23.4, F1, 0.3, "floor_dark", null); slab(-7, 25.6, -2, 27, F1, 0.3, "floor_dark", null); slab(-7, 23.4, -5.6, 25.6, F1, 0.3, "floor_dark", null); slab(-3.4, 23.4, -2, 25.6, F1, 0.3, "floor_dark", null)
	box(-5.6, -1.2, 23.4, -3.4, -1, 25.6, "dirt", {s = "dirt"})
	for q in [[-5.6, 23.4, -5.5, 25.6], [-3.5, 23.4, -3.4, 25.6], [-5.6, 23.4, -3.4, 23.5], [-5.6, 25.5, -3.4, 25.6]]: box(q[0], -1.2, q[1], q[2], F1, q[3], "dirt", {s = "dirt"})
	# ガレージの床
	slab(-17, 14, -10, 24, 0.1, 0.1, "concrete", null, {s = "stone"})
	# 土台（外まわり）
	for q in [[-10.4, 13.6, 10.4, 13.85], [-10.4, 32.15, 10.4, 32.4], [-10.4, 24, -10.15, 32.15], [10.15, 13.85, 10.4, 32.15]]: box(q[0], 0, q[1], q[2], 0.32, q[3], "stone", {solid = false})
	# 外壁（1階）
	wallX(-10.15, -2, 14, 0, F2, T, "sid_orange", "wp_wine", [[-8.5, -6, 1.1, 2.3], [-5, -3, 1.1, 2.3]]); wallX(-2, 2, 14, 0, F2, T, "sid_orange", "wp_brown", [[-1.1, 1.1, F1, 2.6]]); wallX(2, 10.15, 14, 0, F2, T, "sid_orange", "wp_yellow", [[4, 6, 1.1, 2.3], [7.2, 9.2, 1.1, 2.3]])
	wallX(-10.15, -2, 32, 0, F2, T, "wp_leafblue", "sid_orange", [[-8, -5, 1.1, 2.2]]); wallX(-2, 2, 32, 0, F2, T, "wp_brown", "sid_orange", [[-0.8, 0.8, 1.2, 2.4]]); wallX(2, 6, 32, 0, F2, T, "concrete", "sid_orange", [[3.52, 4.48, F1, 2.5]]); wallX(6, 10.15, 32, 0, F2, T, "tile_b", "sid_orange", [[7.5, 8.5, 1.6, 2.4]])
	wallZ(14.15, 24, -10, 0, F2, T, "raw", "wp_wine", [[16.52, 17.48, F1, 2.4]]); wallZ(24, 27, -10, 0, F2, T, "sid_orange", "concrete"); wallZ(27, 31.85, -10, 0, F2, T, "sid_orange", "wp_leafblue", [[28.5, 30.5, 1.1, 2.2]])
	wallZ(14.15, 21.4, 10, 0, F2, T, "wp_yellow", "sid_orange", [[16, 18, 1.1, 2.3]]); wallZ(21.4, 26, 10, 0, F2, T, "wp_gstripe", "sid_orange", [[22.8, 24.6, 1.1, 2.3]]); wallZ(26, 31.85, 10, 0, F2, T, "tile_b", "sid_orange")
	# 中の壁（1階）
	wallZ(14.15, 22, -2, F1, C1, t, "wp_wine", "wp_brown", [[15, 17.5, F1, 2.9]]); wallZ(22, 27, -2, F1, C1, t, "wp_floral", "wp_brown", [[24.02, 24.98, F1, 2.45]]); wallZ(27, 31.85, -2, F1, C1, t, "wp_leafblue", "wp_brown", [[29.02, 29.98, F1, 2.45]])
	wallZ(14.15, 19, 2, F1, C1, t, "wp_brown", "wp_yellow", [[15.52, 16.48, F1, 2.45]]); wallZ(19, 21.4, 2, F1, C1, t, "wp_brown", "metal_dark", [[19.6, 20.8, F1, 2.55]]); wallZ(21.4, 26, 2, F1, C1, t, "wp_brown", "wp_teal", [[23.02, 23.98, F1, 2.45]]); wallZ(26, 31.85, 2, F1, C1, t, "wp_brown", "concrete", [[28.52, 29.48, F1, 2.45]])
	wallZ(19, 21.4, 4.2, F1, C1, t, "metal_dark", "wp_yellow"); wallX(2, 4.2, 19, F1, C1, t, "wp_yellow", "metal_dark"); wallX(2, 4.2, 21.4, F1, C1, t, "metal_dark", "wp_teal")
	wallX(4.2, 6, 21.4, F1, C1, t, "wp_yellow", "wp_teal"); wallX(6, 9.85, 21.4, F1, C1, t, "wp_yellow", "wp_gstripe"); wallZ(21.4, 26, 6, F1, C1, t, "wp_teal", "wp_gstripe"); wallZ(26, 31.85, 6, F1, C1, t, "concrete", "tile_b", [[28.52, 29.48, F1, 2.45]])
	wallX(2.075, 6, 26, F1, C1, t, "wp_teal", "concrete"); wallX(6, 9.85, 26, F1, C1, t, "wp_gstripe", "tile_b", [[8.02, 8.98, F1, 2.45]])
	wallX(-9.85, -7, 22, F1, C1, t, "wp_wine", "concrete", [[-8.1, -7.1, F1, 2.4]]); wallX(-7, -2.075, 22, F1, C1, t, "wp_wine", "wp_floral"); wallX(-8.6, -2.075, 22, C1, F2, t, "wp_wine", "tile_b"); wallZ(22.075, 27, -7, F1, PT, t, "concrete", "wp_floral")
	wallX(-9.85, -7, 27, F1, PT, t, "concrete", "wp_leafblue"); wallX(-7, -2.075, 27, F1, PT, t, "wp_floral", "wp_leafblue", [[-6.2, -5.4, F1, 2.35], [-3.7, -2.9, F1, 2.35]])
	# 幅木
	for q in [[-9.85, 14.15, -2.1, 14.22], [-1.9, 14.15, 1.9, 14.22], [2.1, 14.15, 9.85, 14.22], [-6.9, 22.08, -2.1, 22.15], [-9.85, 27.08, -2.1, 27.15], [6.1, 21.48, 9.85, 21.55]]: box(q[0], F1, q[1], q[2], F1 + 0.1, q[3], "trim", {solid = false})
	# 1階の天井（水びたしの部屋の下は低い）
	box(-10.15, C1, 14, 10.15, C1 + 0.01, 20.85, "white", {solid = false, f = 8}); box(-10.15, C1, 20.85, -8.6, C1 + 0.01, 22, "white", {solid = false, f = 8}); box(-2, C1, 20.85, 10.15, C1 + 0.01, 22, "white", {solid = false, f = 8}); box(-2, C1, 22, 10.15, C1 + 0.01, 32.15, "white", {solid = false, f = 8})
	# ================= 階段（居間の北の壁ぞい、東から西へ上がる）=================
	# 下に1mほどの踊り場（南から入って、西へ上る）
	var SX := -3.1; var SR := 0.34
	for i in 16:
		var x1 := SX - SR * i; var x0 := x1 - SR; var y := F1 + 0.2 * (i + 1); var low := y < 2.45
		box(x0, F1 if low else y - 0.25, 20.85, x1, y, 21.925, "floor", {uv = 1.2}); box(x0 - 0.02, y - 0.03, 20.83, x1, y, 21.93, "rail_o", {solid = false})
	# 手すり（オレンジ）
	rbox(SX - SR * 8, F1 + 1.6 + 0.95, 20.85, Vector2(SR * 16, 3.2).length(), 0.07, 0.07, 0, 0, atan2(3.2, SR * 16), "rail_o")
	for i in range(1, 16, 2):
		var x := SX - SR * (i + 0.5); box(x - 0.03, F1 + 0.2 * (i + 1), 20.84, x + 0.03, F1 + 0.2 * (i + 1) + 0.95, 20.9, "rail_o", {solid = false})
	box(SX - 0.08, F1, 20.8, SX + 0.07, F1 + 1.2, 20.95, "rail_o", {s = "wood"})
	# 地下室のドア（階段の下、EXIT の看板）
	A.base = mkDoor({x = -7.6, z = 22, y = F1, w = 0.96, h = 2.1, axis = "x", hinge = -1, swing = 1, mat = "doorc", panel = "doorc2", arch = true, name = "地下室のドア"})
	A.exitSign = signp(-7.6, 2.52, 21.92, 0.62, 0.22, "exit", PI); box(-7.95, 2.4, 21.9, -7.25, 2.64, 21.925, "black", {solid = false})
	A.exitLight = plight("#50ff80", 0, 3, 2); A.exitLight.position = Vector3(-7.6, 2.4, 21.6); scene.add_child(A.exitLight)
	# ================= 2階 =================
	slab(-10, 14, -2, 20.85, F2, 0.3, "floor", "white"); slab(-10, 20.85, -8.6, 22, F2, 0.3, "floor", "white"); slab(-2, 14, 2, 32, F2, 0.3, "floor_dark", "white"); slab(2, 14, 10, 19, F2, 0.3, "floor", "white"); slab(4.2, 19, 10, 21.4, F2, 0.3, "floor_dark", "white")
	slab(2, 21.4, 6, 27, F2, 0.3, "floor", "white"); slab(6, 21.4, 10, 23.2, F2, 0.3, "tile_w", "white", {s = "tile"}); slab(6, 24.8, 10, 27, F2, 0.3, "tile_w", "white", {s = "tile"}); slab(6, 23.2, 6.9, 24.8, F2, 0.3, "tile_w", "white", {s = "tile"}); slab(8.5, 23.2, 10, 24.8, F2, 0.3, "tile_w", "white", {s = "tile"})
	slab(2, 27, 6, 32, F2, 0.3, "floor_dark", "white"); slab(6, 27, 10, 32, F2, 0.3, "floor", "white")
	# 床の穴のふち（こわれた板）
	for q in [[6.9, 23.2, 7.1, 24.8], [8.3, 23.2, 8.5, 24.8]]: rbox((q[0] + q[2]) / 2, F2 - 0.05, (q[1] + q[3]) / 2, 0.2, 0.06, 1.6, 0.2, 0, 0.3, "floor")
	# 水びたしの部屋のプール（下の部屋の天井）
	slab(-10, 22, -2, 32, 2.95, 0.15, "tile_b", "white", {s = "tile"})
	slab(-10, 22, -8.6, 23.2, F2, 0.55, "floor", null); box(-10, 2.95, 23.2, -8.6, 3.2, 23.7, "floor", {}); slab(-3.4, 29.6, -2, 31.85, F2, 0.55, "floor", null); box(-3.9, 2.95, 29.6, -3.4, 3.2, 31.85, "floor", {})
	box(-10.15, C2, 13.85, 10.15, C2 + 0.3, 32.15, "white", {f = 8 | 1 | 2 | 16 | 32})
	# 外壁（2階）
	wallX(-10.15, -7, 14, F2, F3, T, "sid_yel2", "floor_dark", [[-9.2, -8, 4.5, 5.4]]); wallX(-7, -2, 14, F2, F3, T, "sid_yel2", "wp_leafblue", [[-5.5, -3.5, 4.4, 5.6]]); wallX(-2, 2, 14, F2, F3, T, "sid_yel2", "wp_brown", [[-0.8, 0.8, 4.4, 5.6]]); wallX(2, 10.15, 14, F2, F3, T, "sid_yel2", "plaster", [[3.5, 5, 4.6, 5.5], [7, 8.5, 4.6, 5.5]])
	wallX(-10.15, -2, 32, F2, F3, T, "wp_navy", "sid_yel2", [[-7, -5, 4.5, 5.7]]); wallX(-2, 2, 32, F2, F3, T, "wp_brown", "sid_yel2"); wallX(2, 6, 32, F2, F3, T, "raw", "sid_yel2"); wallX(6, 10.15, 32, F2, F3, T, "wp_kids2", "sid_yel2", [[7.2, 8.8, 4.4, 5.6]])
	wallZ(14.15, 17.5, -10, F2, F3, T, "sid_yel2", "floor_dark"); wallZ(17.5, 20.85, -10, F2, F3, T, "sid_yel2", "raw"); wallZ(20.85, 22, -10, F2, F3, T, "sid_yel2", "wp_wine"); wallZ(22, 31.85, -10, F2, F3, T, "sid_yel2", "wp_navy", [[26, 28, 4.5, 5.7]])
	wallZ(14.15, 19, 10, F2, F3, T, "plaster", "sid_yel2"); wallZ(19, 21.4, 10, F2, F3, T, "wp_brown", "sid_yel2"); wallZ(21.4, 27, 10, F2, F3, T, "tile_b", "sid_yel2", [[24, 25.5, 4.5, 5.5]]); wallZ(27, 31.85, 10, F2, F3, T, "wp_kids2", "sid_yel2", [[29.02, 29.98, F2, 5.6]])
	# 中の壁（2階）
	wallZ(14.15, 20.85, -2, F2, C2, t, "wp_leafblue", "wp_brown", [[19.32, 20.28, F2, 5.55]]); wallZ(20.85, 22, -2, F2, C2, t, "wp_wine", "wp_brown"); wallZ(22, 31.85, -2, F2, C2, t, "wp_navy", "wp_brown", [[30.42, 31.38, F2, 5.55]])
	wallX(-9.85, -2.075, 20.85, F2, C2, t, "raw", "wp_wine"); wallX(-9.85, -2.075, 22, F2, C2, t, "wp_wine", "wp_navy", [[-9.85, -8.6, F2, 5.8]])
	wallZ(14.15, 20.85, -7, F2, C2, t, "raw", "wp_leafblue", [[19.22, 20.18, F2, 5.55]]); wallX(-9.85, -7, 17.5, F2, C2, t, "floor_dark", "raw", [[-9.02, -8.08, F2, 5.55]])
	wallZ(14.15, 19, 2, F2, C2, t, "wp_brown", "plaster", [[15.02, 15.98, F2, 5.55]]); wallZ(19, 21.4, 2, F2, C2, t, "wp_brown", "metal_dark", [[19.6, 20.8, F2, 5.75]]); wallZ(21.4, 27, 2, F2, C2, t, "wp_brown", "brick", [[23.02, 23.98, F2, 5.55]]); wallZ(27, 31.85, 2, F2, C2, t, "wp_brown", "raw")
	wallZ(19, 21.4, 4.2, F2, C2, t, "metal_dark", "wp_brown"); wallX(2, 4.2, 19, F2, C2, t, "plaster", "metal_dark"); wallX(2, 4.2, 21.4, F2, C2, t, "metal_dark", "brick")
	wallX(4.2, 9.85, 19, F2, C2, t, "plaster", "wp_brown", [[8.52, 9.48, F2, 5.55]]); wallX(4.2, 6, 21.4, F2, C2, t, "wp_brown", "brick"); wallX(6, 9.85, 21.4, F2, C2, t, "wp_brown", "tile_b", [[8.52, 9.48, F2, 5.55]])
	wallZ(21.4, 27, 6, F2, C2, t, "brick", "tile_b"); wallX(2.075, 6, 27, F2, C2, t, "brick", "raw", [[4.42, 5.28, F2, 5.55]]); wallX(6, 9.85, 27, F2, C2, t, "tile_b", "wp_kids2")
	# 倉庫と子ども部屋のあいだ：れんがの壁（こわせる所あり）
	wallZ(27.075, 31.85, 6, F2, C2, t, "brick", "wp_kids2", [[28.8, 30.2, F2, 5.6]])
	# ================= ドア =================
	var D := func(o: Dictionary) -> Dictionary:
		var oo := {mat = "doorc", panel = "doorc2", arch = true, h = 2.1}; oo.merge(o, true)
		return mkDoor(oo)
	A.front = [mkDoor({x = -0.55, z = 14, y = F1, w = 1.08, h = 2.28, axis = "x", hinge = -1, swing = 1, mat = "door_b", panel = "door_bp", name = "玄関", inside = 1, lock = "outside"}), mkDoor({x = 0.55, z = 14, y = F1, w = 1.08, h = 2.28, axis = "x", hinge = 1, swing = 1, mat = "door_b", panel = "door_bp", name = "玄関", inside = 1, lock = "outside"})]
	A.back = D.call({x = 4, z = 32, y = F1, w = 0.96, axis = "x", hinge = 1, swing = -1, name = "裏口", inside = -1, h = 2.18})
	A.garageDoor = D.call({x = -10, z = 17, y = F1, w = 0.96, axis = "z", hinge = -1, swing = -1, name = "ガレージのドア"})
	A.garageSide = mkDoor({x = -17, z = 20.5, y = 0.1, w = 0.96, h = 2.1, axis = "z", hinge = -1, swing = 1, mat = "door_b", panel = "door_bp", name = "ガレージの勝手口", inside = 1, lock = "outside"})
	A.kitDoor = D.call({x = 2, z = 16, y = F1, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "台所のドア"}); A.panDoor = D.call({x = 2, z = 23.5, y = F1, w = 0.96, axis = "z", hinge = 1, swing = 1, name = "物置のドア"}); A.boilDoor = D.call({x = 2, z = 29, y = F1, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "ボイラー室のドア"})
	A.graveDoor = D.call({x = -2, z = 24.5, y = F1, w = 0.96, axis = "z", hinge = -1, swing = -1, name = "墓の部屋のドア"}); A.dinDoor = D.call({x = -2, z = 29.5, y = F1, w = 0.96, axis = "z", hinge = 1, swing = -1, name = "食堂のドア"})
	A.gdin1 = D.call({x = -5.8, z = 27, y = F1, w = 0.8, h = 2.05, axis = "x", hinge = -1, swing = -1, name = "ドア"}); A.gdin2 = D.call({x = -3.3, z = 27, y = F1, w = 0.8, h = 2.05, axis = "x", hinge = 1, swing = -1, name = "ドア"})
	A.bathDoor = D.call({x = 6, z = 29, y = F1, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "浴室のドア"}); A.bedDoor = D.call({x = 8.5, z = 26, y = F1, w = 0.96, axis = "x", hinge = -1, swing = -1, name = "寝室のドア"})
	A.liv2Door = D.call({x = -2, z = 19.8, y = F2, w = 0.96, axis = "z", hinge = 1, swing = -1, name = "ドア"}); A.anteDoor = D.call({x = -7, z = 19.7, y = F2, w = 0.96, axis = "z", hinge = 1, swing = -1, name = "ドア"}); A.secDoor = D.call({x = -8.55, z = 17.5, y = F2, w = 0.94, axis = "x", hinge = -1, swing = -1, name = "監視室のドア"})
	A.floodDoor = D.call({x = -2, z = 30.9, y = F2, w = 0.96, axis = "z", hinge = 1, swing = 1, name = "ドア"})
	A.classDoor = D.call({x = 2, z = 15.5, y = F2, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "教室のドア"}); A.classDoor2 = D.call({x = 9, z = 19, y = F2, w = 0.96, axis = "x", hinge = 1, swing = 1, name = "教室のドア"})
	A.bath2Door = D.call({x = 9, z = 21.4, y = F2, w = 0.96, axis = "x", hinge = 1, swing = 1, name = "浴室のドア"}); A.rangeDoor = D.call({x = 2, z = 23.5, y = F2, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "射的場のドア"}); A.storDoor = D.call({x = 4.85, z = 27, y = F2, w = 0.86, axis = "x", hinge = -1, swing = 1, name = "倉庫のドア"})
	A.sideDoor = mkDoor({x = 10, z = 29.5, y = F2, w = 0.96, h = 2.1, axis = "z", hinge = -1, swing = 1, mat = "doorc", panel = "doorc2", arch = true, name = "横のドア"})
	# ================= 窓 =================
	var WN := func(o: Dictionary) -> Dictionary:
		var oo := {frame = "trim"}; oo.merge(o, true)
		return mkWindow(oo)
	A.winLiv = WN.call({axis = "x", x = -7.25, z = 14, y0 = 1.1, w = 2.5, h = 1.2, breakable = true}); A.winLiv2 = WN.call({axis = "x", x = -4, z = 14, y0 = 1.1, w = 2, h = 1.2, breakable = true}); A.winKit = WN.call({axis = "x", x = 5, z = 14, y0 = 1.1, w = 2, h = 1.2, breakable = true}); A.winKit2 = WN.call({axis = "x", x = 8.2, z = 14, y0 = 1.1, w = 2, h = 1.2, breakable = true})
	A.winKitE = WN.call({axis = "z", x = 10, z = 17, y0 = 1.1, w = 2, h = 1.2, breakable = true}); A.winBedE = WN.call({axis = "z", x = 10, z = 23.7, y0 = 1.1, w = 1.8, h = 1.2, breakable = true}); A.winDinN = WN.call({axis = "x", x = -6.5, z = 32, y0 = 1.1, w = 3, h = 1.1, breakable = true}); A.winDinW = WN.call({axis = "z", x = -10, z = 29.5, y0 = 1.1, w = 2, h = 1.1, breakable = true})
	WN.call({axis = "x", x = 0, z = 32, y0 = 1.2, w = 1.6, h = 1.2}); WN.call({axis = "x", x = 8, z = 32, y0 = 1.6, w = 1, h = 0.8})
	WN.call({axis = "x", x = -8.6, z = 14, y0 = 4.5, w = 1.2, h = 0.9}); WN.call({axis = "x", x = -4.5, z = 14, y0 = 4.4, w = 2, h = 1.2}); WN.call({axis = "x", x = 0, z = 14, y0 = 4.4, w = 1.6, h = 1.2}); WN.call({axis = "x", x = 4.25, z = 14, y0 = 4.6, w = 1.5, h = 0.9}); WN.call({axis = "x", x = 7.75, z = 14, y0 = 4.6, w = 1.5, h = 0.9})
	WN.call({axis = "x", x = -6, z = 32, y0 = 4.5, w = 2, h = 1.2}); WN.call({axis = "x", x = 8, z = 32, y0 = 4.4, w = 1.6, h = 1.2}); WN.call({axis = "z", x = -10, z = 27, y0 = 4.5, w = 2, h = 1.2}); WN.call({axis = "z", x = 10, z = 24.75, y0 = 4.5, w = 1.5, h = 1})
	# ================= 部屋の中 =================
	furnishA1()
	# ================= 外観：高い塔・屋根・足場 =================
	exteriorA1()
	# ================= 庭 =================
	yardA1()
# ---- 家具 ----
func furnishA1() -> void:
	# --- 玄関ホール ---
	coatRack(-1.5, F1, 14.7); box(1.3, F1, 14.3, 1.85, F1 + 0.9, 15.2, "wood_d"); rug(-1, 14.5, 1, 17.8, F1, "carpet_r"); picture(1.92, 1.8, 17.4, 3, 0.5, 0.6, 51); ceilLamp(0, C1, 16)
	# --- 廊下 ---
	rug(-0.6, 18.5, 0.6, 31, F1, "carpet_g"); ceilLamp(0, C1, 21); ceilLamp(0, C1, 27.5); picture(-1.92, 1.8, 21, 1, 0.6, 0.5, 53); picture(1.92, 1.8, 25, 3, 0.5, 0.5, 55); plant(-1.5, F1, 31.4, 1)
	# --- 居間 ---
	A.tv = tvSet(-9.55, F1, 17, 1); sofa(-6.1, F1, 17, 3, "sofa_g", 2.2); armchair(-7.7, F1, 15, 1, "sofa_r"); rug(-8.5, 15, -4.5, 19.4, F1, "carpet_g"); table(-7.9, F1, 17, 0.8, 0.5, 0.42, "wood_d", 1)
	shelf(-3.2, F1, 14.4, 0, 1.4, 1.9, 0.35, "wood_d"); lamp(-9.5, F1, 14.6, 1.5); lamp(-4.6, F1, 14.6, 1.4); picture(-6, 1.8, 14.16, 0, 0.9, 0.6, 57); picture(-9.84, 1.9, 19.3, 1, 0.5, 0.6, 59); ceilLamp(-6, C1, 17.5)
	A.livWard = wardrobe(-4.3, F1, 20.45, 2, {w = 1.1, d = 0.6, h = 2.05, mat = "wood_d", hide = true, name = "居間のクローゼット"})
	# --- 台所 ---
	counter(9.55, F1, 17.5, 3, 5.2, 0.62, 0.9); cyl(9.6, F1 + 0.9, 17.5, 0.02, 0.28, "chrome", 6); box(9.3, F1 + 0.8, 17, 9.85, F1 + 0.9, 18, "metal_dark", {solid = false}); upperCab(9.68, F1 + 1.55, 16.2, 3, 1.2)
	stoveUnit(6.6, F1, 14.5, 0); A.fridge = fridgeUnit(3, F1, 14.52, 0); table(6.2, F1, 18.3, 1.6, 0.9)
	A.kitSink = addIt({box = Box.new(9.2, F1 + 0.8, 16.9, 9.85, F1 + 1.3, 18.1), label = func(_it): return null, use = func(_it): return false, useLabel = func(_it): return null}); ceilLamp(6, C1, 17.5)
	# --- 物置 ---
	shelf(4, F1, 25.62, 2, 3, 2, 0.4, "wood_m", true); crate(2.7, F1, 22, 0.6); crate(5.3, F1, 22.1, 0.7); crate(5.35, F1 + 0.7, 22.1, 0.45, "patch")
	# --- 食堂 ---
	table(-6, F1, 29.5, 3.2, 1.2, 0.78, "wood_d")
	for x in [-7.2, -6, -4.8]:
		for z in [28.6, 30.4]: box(x - 0.22, F1, z - 0.22, x + 0.22, F1 + 0.46, z + 0.22, "wood_d", {solid = false})
	shelf(-9.6, F1, 29.5, 1, 2, 2, 0.45, "wood_d"); W.sphere(-6, F1 + 0.95, 29.5, 0.1, MATS.brass); cyl(-6, F1 + 0.78, 29.5, 0.08, 0.1, "brass", 8); picture(-2.09, 1.8, 28.2, 3, 0.6, 0.5, 61); ceilLamp(-6, PT, 29.5)
	A.dinWard = wardrobe(-3.1, F1, 31.52, 2, {w = 1.1, d = 0.6, h = 2, mat = "wood_d", hide = true, name = "食堂のクローゼット"})
	# --- 墓の部屋 ---
	buildGraveRoom()
	# --- ボイラー室 ---
	buildBoilerRoom()
	# --- 1階の浴室 ---
	toilet(9.55, F1, 31.4, 3); tub(7.2, F1, 31.4, 1); sinkUnit(9.6, F1, 27.4, 3)
	# --- 寝室（1階）---
	bed(8.7, F1, 24.3, 3, "bed_y", 1.2, 2.05); A.nstand = nightstand(8.9, F1, 22.3, 3); A.bedWard = wardrobe(6.45, F1, 23.4, 1, {w = 1.1, d = 0.6, h = 2.05, mat = "wood_d", hide = true, name = "寝室のクローゼット"})
	A.tv2 = tvSet(6.55, F1, 25.3, 1); rug(7, 22, 9.5, 25.6, F1, "carpet_b"); lamp(9.5, F1, 21.9, 1.2); ceilLamp(8, C1, 23.7)
	# --- ガレージ ---
	box(-16.8, 0.1, 15, -15.8, 1, 19, "wood_m"); shelf(-16.6, 0.1, 22.5, 1, 1.8, 2, 0.45, "raw", false)
	for xz in [[-12, 23.2], [-11, 23.4]]: cyl(xz[0], 0.1, xz[1], 0.35, 0.25, "tire", 14)
	cyl(-11.5, 0.35, 23.3, 0.35, 0.25, "tire", 14)
	barrel(-15.9, 0.1, 23.2, "red"); crate(-11, 0.1, 15, 0.7); box(-16.2, 0.1, 14.15, -10.8, 2.8, 14.17, "gdoor", {solid = false})
	ceilLamp(-13.5, 3.2, 19)
	# --- 2階の居間：ソファと、テレビを積んだ箱 ---
	sofa(-4.6, F2, 15.2, 0, "bed_b", 2); crate(-4.6, F2, 18.55, 0.9); crate(-4.6, F2 + 0.9, 18.55, 0.6); tvSet(-4.6, F2 + 1.5, 18.6, 2); rug(-6.2, 15.9, -3, 19, F2, "carpet_p"); lamp(-6.6, F2, 14.6, 1.4); shelf(-2.5, F2, 16, 3, 1.2, 1.8, 0.35, "wood_d"); ceilLamp(-4.5, C2, 17.5)
	# --- 物置（2階）---
	crate(-9.4, F2, 18.2, 0.8); crate(-8.4, F2, 20.3, 0.6); crate(-9.4, F2 + 0.8, 18.2, 0.5, "patch"); box(-9.8, F2, 19.3, -9, F2 + 1.9, 20.7, "wood_d")
	# --- 監視室 ---
	buildSecurityRoom()
	# --- 2階の廊下：3階への階段（家具でふさがれている）---
	for i in 12: box(-1.85, F2, 14.5 + 0.33 * i, -0.3, F2 + 0.2 * (i + 1), 14.5 + 0.33 * (i + 1), "floor_dark", {uv = 1.2})
	box(-1.85, F2 + 2.4, 17.4, -0.3, F2 + 2.9, 18.5, "floor_dark")
	crate(-1.2, F2 + 2.4, 17.8, 0.7); crate(-0.8, F2 + 2.4, 18.3, 0.5, "patch"); sofa(-1.1, F2 + 1.6, 16.6, 1, "sofa_r", 1.3) # 板を打ちつけてふさいである（見えるとおりの当たり判定）
	for k in 10:
		var z := 14.42 + k * 0.46; box(-0.33, F2, z - 0.09, -0.27, F2 + 2.3 - (k % 3) * 0.12, z + 0.09, "raw", {solid = false})
	for y in [0.45, 1.75]: rbox(-0.24, F2 + y, 16.45, 0.04, 0.16, 4.4, 0, 0, 0, "raw")
	add_solid(-0.34, F2, 14.2, -0.22, F2 + 2.5, 18.65, "wood")
	ceilLamp(0, C2, 24); ceilLamp(0, C2, 29); picture(1.92, 5, 27.5, 3, 0.6, 0.5, 63)
	# --- 教室 ---
	buildClassroom()
	# --- 射的場 ---
	buildRange()
	# --- 倉庫 ---
	crate(2.6, F2, 31.3, 0.8); crate(2.6, F2 + 0.8, 31.3, 0.5); crate(3.6, F2, 31.4, 0.6, "patch"); shelf(4.2, F2, 31.62, 2, 1.4, 1.9, 0.4, "raw", false); crate(5.4, F2, 28, 0.6); ceilLamp(4, C2, 29.5)
	# --- 子ども部屋 ---
	buildKidsRoom()
	# --- 2階の浴室（床に大きな穴）---
	tub(9.3, F2, 25.8, 0); toilet(6.45, F2, 26.6, 1); sinkUnit(9.6, F2, 22.3, 3)
	for i in 8: rbox(7.7 + rr(-0.8, 0.8), F2 - 0.02, 24 + rr(-0.8, 0.8), rr(0.2, 0.5), 0.05, rr(0.1, 0.2), 0, rr(0, 3), rr(-0.4, 0.4), "floor")
	# --- 水びたしの部屋 ---
	buildFloodRoom()
	# --- 地下室の階段（エンディング用）---
	for i in 10:
		var y := F1 - 0.25 * (i + 1); box(-9.85, -3, 22.9 + i * 0.4, -7.075, y, 22.9 + (i + 1) * 0.4, "concrete", {s = "stone"})
	A.baseLight = plight("#fff8e8", 0, 12, 1.2); A.baseLight.position = Vector3(-8.5, 1.5, 24); scene.add_child(A.baseLight)
func nightstand(x: float, y: float, z: float, k: int) -> Dictionary:
	var f := XF(x, y, z, k); f.box(-0.25, 0, -0.22, 0.25, 0.6, 0.22, "wood_m"); var dp := f.p(0, 0, 0.22)
	var dr := mkDrawer({x = dp.x, y = y + 0.35, z = dp.z, w = 0.44, h = 0.2, d = 0.38, dir = f.dir(0, 1), mat = "cabd", name = "引き出し"}); lamp2(f.p(0.1, 0.6, -0.05))
	return {f = f, dr = dr}
func lamp2(p: Vector3) -> void:
	cyl(p.x, p.y, p.z, 0.07, 0.02, "brass", 8); cyl(p.x, p.y, p.z, 0.012, 0.3, "brass", 6); cyl(p.x, p.y + 0.28, p.z, 0.14, 0.16, "lampshade", 10, {rt = 0.08})
# ---- 墓の部屋 ----
func buildGraveRoom() -> void: # 棒とベルをかける所
	cyl(-5.9, F1, 24.5, 0.04, 2.1, "pole", 8, {solid = true}); box(-5.9, F1 + 2.02, 24.46, -5.5, F1 + 2.06, 24.54, "pole", {solid = false}); box(-5.55, F1 + 1.9, 24.49, -5.52, F1 + 2.03, 24.51, "metal_dark", {solid = false})
	cyl(-4.5, F1 - 0.02, 24.5, 0.01, 1.6, "fab_w", 4) # ひも
	A.pole = {x = -5.52, y = F1 + 1.86, z = 24.5, has = false, bell = null, it = null}
	A.pole.it = addIt({box = Box.new(-6.1, F1 + 1.4, 24.2, -5.3, F1 + 2.2, 24.8), label = func(_it): return null if A.pole.has else {t = "ベルをかける所がある", k = "", n = "棒"},
		act = func():
			if not A.pole.has: toast("ベルがあれば、かけられそうだ"),
		use = func(it):
			if not A.pole.has and it.type == "bell":
				placeBell(); return true
			return false,
		useLabel = func(it): return "ベルをかける" if not A.pole.has and it.type == "bell" else null})
	# 壁の入れ物（左の壁）：中にシャベル
	box(-6.93, F1 + 0.4, 23.2, -6.9, F1 + 2, 24.2, "wood_d", {solid = false}); box(-6.93, F1 + 0.4, 23.2, -6.56, F1 + 0.44, 24.2, "wood_d"); box(-6.93, F1 + 1.96, 23.2, -6.56, F1 + 2, 24.2, "wood_d", {solid = false}); box(-6.93, F1 + 0.4, 23.18, -6.56, F1 + 2, 23.22, "wood_d", {solid = false}); box(-6.93, F1 + 0.4, 24.18, -6.56, F1 + 2, 24.22, "wood_d", {solid = false})
	A.boxDoor = mkLeaf({x = -6.54, y = F1 + 0.42, z = 23.7, w = 1, h = 1.56, axis = "z", hinge = -1, swing = 1, mat = "wood_m", t = 0.03, ang = PI * 0.7, knob = false})
	# 墓の土（掘ると下がる）
	A.dirt = {level = 3, m = null, col = null, it = null}
	var dm := mesh(G.box(2.2, 1.3, 2.2), MATS.dirt); dm.position = Vector3(-4.5, F1 - 0.65, 24.5); scene.add_child(dm); A.dirt.m = dm
	A.dirt.col = dyn_box(-5.6, -1, 23.4, -3.4, F1, 25.6, "dirt", null)
	A.dirt.it = addIt({box = Box.new(-5.6, -1.1, 23.4, -3.4, F1 + 0.05, 25.6), label = func(_it): return {t = "やわらかい土", k = "", n = "墓"} if A.dirt.level > 0 else null,
		act = func():
			if A.dirt.level > 0: toast("シャベルがあれば掘れそうだ"),
		use = func(it):
			if it.type == "shovel" and A.dirt.level > 0:
				digGrave(); return true
			return false,
		useLabel = func(it): return "土を掘る" if it.type == "shovel" and A.dirt.level > 0 else null})
	# 棺
	A.coffin = mkCoffin(-4.5, -1, 24.5, 0)
	signp(-2.09, 1.7, 23, 0.5, 0.62, "p_coffin", -PI / 2); cyl(-6.6, F1, 26.5, 0.18, 0.5, "brown", 10) # 花びん台
	# 十字架
	box(-4.55, F1, 25.65, -4.45, F1 + 1.3, 25.75, "wood_d", {solid = false}); box(-4.85, F1 + 0.9, 25.65, -4.15, F1 + 1, 25.75, "wood_d", {solid = false}); ceilLamp(-4.5, PT, 24.5)
func mkCoffin(x: float, y: float, z: float, _k: int) -> Dictionary:
	var g := Node3D.new(); var mb := MB.new(); mb.box(-0.4, 0, -1.05, 0.4, 0.08, 1.05, MATS.wood_d)
	for q in [[-0.4, -1.05, -0.33, 1.05], [0.33, -1.05, 0.4, 1.05], [-0.4, -1.05, 0.4, -0.98], [-0.4, 0.98, 0.4, 1.05]]: mb.box(q[0], 0, q[1], q[2], 0.5, q[3], MATS.wood_d)
	mb.box(-0.33, 0.08, -0.98, 0.33, 0.12, 0.98, MATS.fab_r)
	g.add_child(mb.build()); g.position = Vector3(x, y, z); scene.add_child(g)
	var lid := mesh(G.box(0.84, 0.06, 2.14), MATS.wood_m, true); lid.position = Vector3(x, y + 0.53, z); scene.add_child(lid)
	var C := {g = g, lid = lid, open = false, x = x, y = y, z = z, lidT = 0.0, lidCol = null, it = null}
	for q in [[x - 0.42, z - 1.07, x - 0.33, z + 1.07], [x + 0.33, z - 1.07, x + 0.42, z + 1.07], [x - 0.42, z - 1.07, x + 0.42, z - 0.98], [x - 0.42, z + 0.98, x + 0.42, z + 1.07]]: add_solid(q[0], y, q[1], q[2], y + 0.5, q[3], "wood")
	add_solid(x - 0.42, y, z - 1.07, x + 0.42, y + 0.08, z + 1.07, "wood"); C.lidCol = dyn_box(x - 0.42, y + 0.5, z - 1.07, x + 0.42, y + 0.56, z + 1.07, "wood", null)
	C.it = addIt({box = Box.new(x - 0.45, y, z - 1.1, x + 0.45, y + 0.6, z + 1.1), label = func(_it): return null if C.open else (null if A.dirt.level > 0 else {t = "ふたを開ける", k = "E", n = "棺"}),
		act = func():
			if not C.open and A.dirt.level <= 0:
				C.open = true; sfx("coffin"); C.lidCol.on = false; C.lidT = 0.0
				if story.get("onCoffin"): story.onCoffin.call()})
	return C
func placeBell() -> void:
	var H = held(); PL.inv[PL.sel] = null; drawInv(); H.st = "att"; A.pole.has = true; A.pole.bell = H; H.noPick = true; H.grp.visible = true; H.p = Vector3(A.pole.x, A.pole.y - 0.12, A.pole.z); H.grp.position = H.p; H.grp.rotation = Vector3()
	for c in H.grp.get_children(): c.position = Vector3()
	sfx("bell")
	after(0.9, func():
		A.boxDoor.m.tgt = 1.0; P.shovel.noPick = false; sfx("cab", true); toast("カチッ……壁の入れ物が開いた。シャベルがある"))
	if story.get("onBell"): story.onBell.call()
func digGrave() -> void:
	var D: Dictionary = A.dirt; D.level -= 1; sfx("dig"); PL.swing = 0.5; noise(-4.5, F1, 24.5, 8, "dig"); puff(-4.5, F1 + 0.1, 24.5, "#6e4f33", 8, 0.25, 0.8, 0.6)
	var lv: float = D.level / 3.0; D.m.position.y = -1 + 1.3 * lv - 0.65; D.col.y1 = -1 + 1.3 * lv; D.m.visible = D.level > 0
	if D.level <= 0:
		D.col.on = false; toast("棺が出てきた！")
		if story.get("onDug"): story.onDug.call()
# ---- ボイラー室：大きな黒いかまど・赤いバルブ・温度計・電気のスイッチ ----
func buildBoilerRoom() -> void:
	var x := 5.0; var z := 27.2; var mb := MB.new()
	mb.cyl(0, 0.9, 0, 0.75, 1.8, MATS.black, 16); mb.cyl(0, 1.85, 0, 0.5, 0.3, MATS.black, 14); mb.cyl(0, 2.3, 0, 0.18, 1.2, MATS.metal_dark, 10); mb.box(-0.3, 0.2, 0.7, 0.3, 1.6, 0.8, MATS.black)
	for i in 3: mb.cyl(0, 0.4 + i * 0.55, 0, 0.77, 0.06, MATS.metal_dark, 16)
	mb.box(-0.78, 0.3, -0.25, -0.74, 0.7, 0.25, MATS.black); var g := mb.build(); g.position = Vector3(x, F1, z); scene.add_child(g); add_solid(x - 0.8, F1, z - 0.8, x + 0.8, F1 + 2.1, z + 0.8, "metal")
	# パイプ（天井へ）
	box(x - 0.08, F1 + 2.6, 26.2, x + 0.08, F1 + 2.76, z, "metal_dark", {solid = false}); box(2.2, F1 + 2.6, 26.2, x, F1 + 2.76, 26.36, "metal_dark", {solid = false})
	# 温度計（西の面）
	var gauge := Node3D.new(); var gm := MB.new(); gm.cyl(0, 0, 0, 0.16, 0.04, MATS.cream, 16, null, "z"); gm.cyl(0, 0, -0.02, 0.18, 0.03, MATS.brass, 16, null, "z"); gauge.add_child(gm.build())
	var ng := G.box(0.012, 0.13, 0.01)
	for k in ng.p.size(): ng.p[k] += Vector3(0, 0.06, 0)
	var needle := mesh(ng, MATS.red); needle.position.z = 0.03; gauge.add_child(needle)
	var face := mesh(G.circle(0.15, 20), std_mat({map = tex("c88")})); face.position.z = 0.025; gauge.add_child(face); gauge.position = Vector3(x - 0.79, F1 + 1.55, z - 0.25); gauge.rotation.y = -PI / 2; scene.add_child(gauge)
	# 赤いバルブ（西の面）
	var valve := Node3D.new(); var vm := MB.new(); vm.cyl(0, 0, 0, 0.2, 0.04, MATS.red, 16, null, "z")
	for i in 4: vm.rbox(0, 0, 0, 0.36, 0.04, 0.04, 0, 0, i * PI / 4, MATS.red)
	vm.cyl(0, 0, 0.05, 0.05, 0.1, MATS.metal_dark, 8, null, "z"); valve.add_child(vm.build()); valve.position = Vector3(x - 0.86, F1 + 1.05, z + 0.25); valve.rotation.y = -PI / 2; scene.add_child(valve)
	A.furn = {valve = valve, needle = needle, cold = false, t = 0.0, it = null}
	A.furn.it = addIt({box = Box.new(x - 1.1, F1 + 0.8, z - 0.05, x - 0.72, F1 + 1.3, z + 0.55), label = func(_it): return {t = "バルブを戻す" if A.furn.cold else "バルブを回す", k = "E", n = "かまどのバルブ"}, act = func(): turnValve(not A.furn.cold)})
	# 電気のスイッチ（分電盤）
	box(2.08, F1 + 1.2, 27, 2.25, F1 + 1.9, 27.6, "metal_dark", {solid = false})
	var lg := G.box(0.06, 0.26, 0.05)
	for k in lg.p.size(): lg.p[k] += Vector3(0, 0.12, 0)
	var lev := mesh(lg, MATS.red); lev.position = Vector3(2.28, F1 + 1.5, 27.3); scene.add_child(lev); signp(2.26, F1 + 1.75, 27.3, 0.16, 0.1, "yellow", PI / 2)
	A.power = {on = true, lev = lev, it = null}
	A.power.it = addIt({box = Box.new(2.05, F1 + 1.15, 26.95, 2.45, F1 + 1.95, 27.65), label = func(_it): return {t = "電気を切る" if A.power.on else "電気を入れる", k = "E", n = "分電盤"}, act = func(): setPower(not A.power.on, true)})
	crate(5.4, F1, 31.3, 0.6); barrel(2.6, F1, 31.3); ceilLamp(4, C1, 28.5)
func turnValve(cold: bool) -> void:
	A.furn.cold = cold; sfx("valve"); noise(4.2, F1, 30.9, 9, "valve"); toast("温度計の針が下がっていく……ゴゴゴ……" if cold else "温度計の針が上がっていく"); A.furn.t = 0.0
	if story.get("onValve"): story.onValve.call(cold)
func setPower(on: bool, snd := false) -> void:
	A.power.on = on; A.power.lev.rotation.z = 0.0 if on else PI * 0.9
	if snd:
		sfx("genon" if on else "genoff"); noise(2.2, F1, 27.3, 8, "power"); toast("電気を入れた" if on else "電気を切った。カメラが止まった")
	updCamLeds(); updRangePower()
# ---- 監視室：机・モニター・ピッキング道具 ----
func buildSecurityRoom() -> void:
	desk(-8.5, F2, 14.55, 0)
	for i in 4:
		var x := -9.5 + i * 0.65; box(x - 0.28, F2 + 0.8, 14.25, x + 0.28, F2 + 1.3, 14.6, "dgrey", {solid = false}); A["mon%d" % i] = signp(x, F2 + 1.05, 14.61, 0.48, 0.36, "monitor", 0, {noShadow = true})
	box(-9.8, F2 + 1.4, 14.2, -7.2, F2 + 1.45, 14.7, "dgrey", {solid = false}); A.monU = []
	for i in 3:
		var x := -9.3 + i * 0.8; box(x - 0.28, F2 + 1.45, 14.25, x + 0.28, F2 + 1.85, 14.55, "dgrey", {solid = false}); A.monU.append(signp(x, F2 + 1.65, 14.56, 0.48, 0.32, "monitor", 0, {noShadow = true}))
	crate(-7.5, F2, 16.9, 0.5); picture(-9.84, 5, 16, 1, 0.5, 0.4, 65); ceilLamp(-8.5, C2, 15.8)
# ---- 教室 ----
const CHALK_SLOTS := [[16.011959838867188, 5.599609375], [17.476286315917967, 5.599609375], [17.020999145507812, 5.015625]]
func buildClassroom() -> void: # 壁の下半分は薄い色
	box(2.08, F2, 14.16, 9.85, F2 + 1.1, 14.2, "cab", {solid = false}); box(2.08, F2, 18.8, 9.85, F2 + 1.1, 18.84, "cab", {solid = false})
	# 黒板（東の壁）
	box(9.8, F2 + 1.1, 15.1, 9.85, F2 + 2.5, 17.9, "wood_d", {solid = false}); A.board = signp(9.79, F2 + 1.8, 16.5, 2.7, 1.3, "chalk", -PI / 2); box(9.62, F2 + 1.05, 15.1, 9.85, F2 + 1.1, 17.9, "wood_d", {solid = false})
	# 答えを置く所
	A.slots = []
	var ans := [5, 3, 8]
	for i in 3: A.slots.append({z = CHALK_SLOTS[i][0], y = CHALK_SLOTS[i][1], ans = ans[i], v = null, m = null, it = null})
	for S in A.slots:
		var m := signp(9.78, S.y, S.z, 0.24, 0.24, std_mat({color = "#3a6a50", emissive = "#204030", ei = 0.3}), -PI / 2); S.m = m
		S.it = addIt({box = Box.new(9.5, S.y - 0.16, S.z - 0.16, 9.85, S.y + 0.16, S.z + 0.16), label = func(_it): return {t = "数字をはがす", k = "E", n = "黒板"} if S.v else {t = "ここに答えの数字をはる", k = "", n = "黒板"},
			act = func():
				if S.v: takeSlot(S)
				else: toast("数字のマグネットを持って、左クリックではろう"),
			use = func(it):
				if not S.v and it.d.digit != null:
					putSlot(S, it); return true
				return false,
			useLabel = func(it): return "数字をはる" if not S.v and it.d.digit != null else null})
	# 先生の机（引き出しに数字）
	var f := XF(8.55, F2, 16.5, 3); f.box(-0.7, 0.72, -0.35, 0.7, 0.77, 0.35, "wood_m"); f.box(-0.7, 0, -0.35, -0.62, 0.72, 0.35, "wood_m"); f.box(0.62, 0, -0.35, 0.7, 0.72, 0.35, "wood_m"); f.box(-0.62, 0.1, -0.33, -0.1, 0.72, 0.35, "wood_m")
	var p1 := f.p(-0.36, 0, 0.35); var p2 := f.p(-0.36, 0, 0.35)
	A.tdraw = [mkDrawer({x = p1.x, y = F2 + 0.45, z = p1.z, w = 0.5, h = 0.22, d = 0.5, dir = f.dir(0, 1), mat = "cabd", name = "先生の机の引き出し"}), mkDrawer({x = p2.x, y = F2 + 0.15, z = p2.z, w = 0.5, h = 0.22, d = 0.5, dir = f.dir(0, 1), mat = "cabd", name = "先生の机の引き出し"})]
	# 生徒の机（水色のいす）
	for r in 3:
		for c in 3: schoolDesk(3.4 + r * 1.45, F2, 15 + c * 1.45)
	signp(6, F2 + 1.9, 18.79, 2.2, 1.1, "worldmap", PI); signp(2.09, F2 + 2.2, 16.5, 2.4, 0.6, "alpha", PI / 2); box(2.08, F2 + 1.3, 15, 2.12, F2 + 2.4, 16.2, "cork", {solid = false})
	for i in 4: box(2.12, F2 + 1.45 + (i % 2) * 0.4, 15.1 + i * 0.25, 2.13, F2 + 1.75 + (i % 2) * 0.4, 15.3 + i * 0.25, ["cream", "pink", "yellow", "lgrey"][i], {solid = false})
	ceilLamp(4.5, C2, 16.5); ceilLamp(8, C2, 16.5)
	# 先生を置く場所の目印（黒板の前）
	A.teachSpot = {x = 9, z = 15.4}
func schoolDesk(x: float, y: float, z: float) -> void:
	var f := XF(x, y, z, 1); f.box(-0.25, 0.42, -0.22, 0.25, 0.46, 0.22, "teal")
	for ab in [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]: f.box(ab[0] - 0.02, 0, ab[1] - 0.02, ab[0] + 0.02, 0.42, ab[1] + 0.02, "metal_dark", NS)
	f.box(-0.25, 0.46, -0.24, 0.25, 0.9, -0.2, "teal", NS)
	f.box(-0.3, 0.7, 0.2, 0.3, 0.74, 0.58, "wood_m", NS); f.box(0.28, 0.44, 0.2, 0.3, 0.72, 0.24, "metal_dark", NS)
# ---- 射的場 ----
func buildRange() -> void: # カウンター（x=3.4）と、はね上げの門
	box(3.25, F2, 21.55, 3.55, F2 + 1, 26.0, "wood_m", {uv = 1}); box(3.2, F2 + 1, 21.55, 3.6, F2 + 1.06, 26, "wood_d")
	# 金あみ（カウンターを乗りこえられないように）
	for i in 17:
		var z := 21.6 + i * 0.275
		if absf(z - 24.2) < 0.45: continue
		box(3.39, F2 + 1.06, z - 0.012, 3.41, F2 + 2.35, z + 0.012, "metal_dark", {solid = false})
	for y in [1.7, 2.3]: box(3.39, F2 + y - 0.012, 21.55, 3.41, F2 + y + 0.012, 26, "metal_dark", {solid = false})
	add_solid(3.3, F2 + 1.06, 21.55, 3.5, F2 + 2.4, 26, "metal")
	# 日よけ（しま）
	for i in 10: box(3.1, F2 + 2.35, 21.5 + i * 0.55, 3.8, F2 + 2.45, 21.5 + (i + 1) * 0.55, "white" if i % 2 else "red", {solid = false})
	A.gate = mkGate(3.4, F2, 26.42)
	# 銃の台
	var st := MB.new(); st.box(-0.18, 0, -0.25, 0.18, 0.03, 0.25, MATS.teal); st.cyl(0, 0.03, 0, 0.02, 0.22, MATS.yellow, 6); var sg := st.build(); sg.position = Vector3(3.4, F2 + 1.06, 24.2); scene.add_child(sg)
	A.stand = {x = 3.4, y = F2 + 1.06, z = 24.2, has = false, score = 0, on = false, rifle = null, it = null}
	A.stand.it = addIt({box = Box.new(3.1, F2 + 1, 23.8, 3.7, F2 + 1.5, 24.6), label = func(_it): return ({t = "左クリックで撃つ", k = "", n = "射的"} if A.stand.on else {t = "電気が来ていないみたい", k = "", n = "射的"}) if A.stand.has else {t = "銃を置く台", k = "", n = "台"},
		act = func():
			if not A.stand.has: toast("おもちゃの銃を置けそうだ"),
		use = func(it):
			if not A.stand.has and it.type == "toyrifle":
				placeRifle(); return true
			return false,
		useLabel = func(it): return "銃を台に置く" if not A.stand.has and it.type == "toyrifle" else null})
	# 背景の絵・点数板
	signp(5.84, F2 + 1.5, 24.2, 5.2, 1.9, "landscape", -PI / 2)
	A.scoreSign = signp(5.83, F2 + 2.7, 24.2, 1.1, 0.4, std_mat({color = "#141414", emissive = "#141414", ei = 1.0}), -PI / 2)
	var lb := Label3D.new(); lb.text = "000"; lb.font_size = 76; lb.pixel_size = 0.004; lb.modulate = Color("#ff4020"); lb.outline_size = 0; lb.position = Vector3(0, -0.02, 0.005); lb.double_sided = false; lb.shaded = false
	lb.font = load("res://fonts/mono.ttf") if ResourceLoader.exists("res://fonts/mono.ttf") else null
	A.scoreSign.add_child(lb); A.scoreLabel = lb; drawScore(0)
	# 的（兵隊）
	A.targets = []
	for i in 4:
		var z := 22.2 + i * 1.25; var g := Node3D.new(); var tm := MB.new()
		tm.box(-0.03, 0, -0.22, 0.03, 0.9, 0.22, MATS.board_w); tm.sphere(0, 1.02, 0, 0.13, MATS.board_w, 0.4, 1, 1); tm.box(-0.035, 0.3, -0.18, 0.035, 0.7, 0.18, MATS.green); tm.box(-0.035, 0.95, -0.13, 0.035, 1.1, 0.13, MATS.dgreen); tm.cyl(0, 0.5, 0, 0.1, 0.01, MATS.red, 12, null, "x")
		g.add_child(tm.build()); g.position = Vector3(5.4, F2, z); g.rotation.z = PI / 2 * 0.98; scene.add_child(g); A.targets.append({g = g, z = z, up = 0.0, t = rr(1, 3), hit = false})
	# 天井のパイプ（鍵が落ちてくる）
	box(2.25, C2 - 0.3, 21.6, 2.45, C2 - 0.1, 26.5, "metal", {solid = false}); box(3.9, C2 - 0.25, 21.6, 4.1, C2 - 0.05, 26.5, "metal", {solid = false}); cyl(2.35, C2 - 0.9, 21.75, 0.1, 0.6, "metal", 10)
	# ポスター（ろうか側の壁）
	signp(2.09, F2 + 1.7, 22.4, 0.7, 1.4, "p_rifle", PI / 2); signp(2.09, F2 + 1.7, 25.9, 0.7, 1.4, "p_prize", PI / 2)
	A.rangeLights = []
	for z in [22.5, 24.5, 26]:
		var L := plight("#fff0c8", 0, 6, 1.6); L.position = Vector3(4.7, C2 - 0.4, z); scene.add_child(L); A.rangeLights.append(L); ceilLamp(4.7, C2, z)
func drawScore(n: int) -> void:
	A.scoreLabel.text = "%03d" % n
func mkGate(x: float, y: float, z: float) -> Dictionary: # カウンターのはね上げ部分（銀の錠）：南のはしを軸に上へはね上がる
	var pv := Node3D.new(); pv.position = Vector3(x, y + 1.03, z - 0.42); scene.add_child(pv)
	var top := mesh(G.box(0.4, 0.06, 0.84), MATS.wood_d, true); top.position = Vector3(0, 0, 0.42); pv.add_child(top)
	var low := mesh(G.box(0.3, 0.97, 0.8), MATS.wood_m, true); low.position = Vector3(x, y + 0.485, z); scene.add_child(low)
	var lock := Node3D.new(); var lm := MB.new(); lm.box(-0.06, -0.08, -0.03, 0.06, 0.06, 0.03, MATS.silver); lm.cyl(0, 0.08, 0, 0.045, 0.02, MATS.silver, 10, null, "z"); lock.add_child(lm.build()); lock.position = Vector3(x - 0.2, y + 0.9, z - 0.3); lock.rotation.y = PI / 2; scene.add_child(lock)
	var Gt := {pv = pv, low = low, lock = lock, locked = true, open = false, x = x, y = y, z = z, col = null, it = null}
	Gt.col = dyn_box(x - 0.2, y, z - 0.42, x + 0.2, y + 2.35, z + 0.42, "wood", Gt)
	Gt.it = addIt({box = Box.new(x - 0.25, y, z - 0.45, x + 0.25, y + 1.2, z + 0.45), label = func(_it): return {t = "銀の錠がかかっている", k = "", n = "カウンターの門"} if Gt.locked else {t = "閉める" if Gt.open else "開ける", k = "E", n = "カウンターの門"},
		act = func():
			if Gt.locked:
				toast("銀の錠がかかっている"); sfx("locked"); return
			setGate(Gt, not Gt.open),
		use = func(it):
			if Gt.locked and it.type == "silverkey":
				Gt.locked = false; lock.visible = false; consumeHeld(); sfx("unlock"); toast("銀の錠が開いた")
				if story.get("onGate"): story.onGate.call()
				return true
			return false,
		useLabel = func(it): return "銀の鍵を使う" if Gt.locked and it.type == "silverkey" else null})
	return Gt
func setGate(Gt: Dictionary, op: bool) -> void:
	Gt.open = op; Gt.low.visible = not op; Gt.col.on = not op; Gt.pv.rotation.x = -1.45 if op else 0.0; sfx("cab", op)
func placeRifle() -> void:
	var H = held(); PL.inv[PL.sel] = null; drawInv(); H.st = "att"; H.noPick = true; H.grp.visible = true; H.p = Vector3(3.4, F2 + 1.3, 24.2); H.grp.position = H.p; H.grp.rotation = Vector3(0, PI / 2, 0)
	for c in H.grp.get_children(): c.position = Vector3()
	A.stand.has = true; A.stand.rifle = H; sfx("pick"); updRangePower(); toast("明かりがついた！ 的をねらって左クリック" if A.stand.on else "電気が来ていないみたいだ")
	if story.get("onRifle"): story.onRifle.call()
func updRangePower() -> void:
	if not A.get("stand"): return
	A.stand.on = A.stand.has and A.power.on
	for L in A.rangeLights: li(L, 5.0 if A.stand.on and QUAL else 0.0)
# ---- 子ども部屋 ----
func buildKidsRoom() -> void:
	signp(9.84, F2 + 1.7, 28.4, 1.4, 0.7, "drawings", -PI / 2); signp(6.09, F2 + 1.9, 31, 1.3, 0.65, "drawings", PI / 2)
	# ベビーベッド
	var x := 8.0; var z := 29.8; box(x - 0.5, F2, z - 0.8, x + 0.5, F2 + 0.35, z + 0.8, "white"); box(x - 0.45, F2 + 0.35, z - 0.75, x + 0.45, F2 + 0.45, z + 0.75, "bed_b", {solid = false})
	for i in 9:
		var zz := z - 0.78 + i * 0.195
		for s in [-1, 1]: box(x + s * 0.5 - 0.02, F2 + 0.35, zz - 0.015, x + s * 0.5 + 0.02, F2 + 0.88, zz + 0.015, "white", {solid = false})
	for s in [-1, 1]: box(x + s * 0.5 - 0.03, F2 + 0.86, z - 0.8, x + s * 0.5 + 0.03, F2 + 0.9, z + 0.8, "white", {solid = false})
	for s in [-1, 1]: box(x - 0.52, F2, z + s * 0.8 - 0.03, x + 0.52, F2 + 1.15, z + s * 0.8 + 0.03, "white", {solid = false})
	add_solid(x - 0.53, F2, z - 0.83, x + 0.53, F2 + 0.45, z + 0.83, "wood")
	for s in [-1, 1]:
		add_solid(x + s * 0.5 - 0.03, F2 + 0.45, z - 0.83, x + s * 0.5 + 0.03, F2 + 0.9, z + 0.83, "wood"); add_solid(x - 0.53, F2 + 0.45, z + s * 0.8 - 0.03, x + 0.53, F2 + 1.15, z + s * 0.8 + 0.03, "wood")
	# くま・マネキン・積み木
	var tb := MB.new(); tb.sphere(0, 0.25, 0, 0.2, MATS.brown, 1, 1.1, 0.9); tb.sphere(0, 0.55, 0, 0.15, MATS.brown); tb.sphere(-0.1, 0.66, 0, 0.05, MATS.brown); tb.sphere(0.1, 0.66, 0, 0.05, MATS.brown); tb.sphere(0, 0.52, 0.12, 0.05, MATS.cream); var tg := tb.build(); tg.position = Vector3(9.4, F2, 31.4); tg.rotation.y = -2.4; scene.add_child(tg)
	var mq := MB.new(); mq.cyl(0, 0, 0, 0.12, 0.03, MATS.wood_d, 10); mq.cyl(0, 0.03, 0, 0.02, 0.6, MATS.wood_d, 6); mq.sphere(0, 0.85, 0, 0.2, MATS.fab_w, 1, 1.4, 0.8); mq.sphere(0, 1.2, 0, 0.1, MATS.fab_w); var mg := mq.build(); mg.position = Vector3(6.5, F2, 27.6); scene.add_child(mg); add_solid(6.3, F2, 27.4, 6.7, F2 + 1.3, 27.8, "wood")
	for i in 7:
		var b := MB.new(); b.box(-0.07, 0, -0.07, 0.07, 0.14, 0.07, MATS[["red", "blue", "yellow", "green"][i % 4]]); var g := b.build(); g.position = Vector3(6.8 + rr(0, 1.2), F2 + (0.14 if i > 4 else 0.0), 30.8 + rr(0, 0.8)); g.rotation.y = rr(0, 1); scene.add_child(g)
	rug(6.6, 28.2, 9.4, 31.4, F2, "carpet_p"); ceilLamp(8, C2, 29.5)
# ---- 水びたしの部屋 ----
func buildFloodRoom() -> void: # 水面
	var wg := G.plane(8, 10)
	for k in wg.p.size():
		var p: Vector3 = wg.p[k]; wg.p[k] = Vector3(p.x, 0, -p.y); wg.n[k] = Vector3.UP
	var wm := mesh(wg, MATS.wtr); wm.position = Vector3(-6, WS, 27); wm.sorting_offset = 2; scene.add_child(wm); A.water = {m = wm, frozen = false, ice = null}
	A.water.ice = dyn_box(-10, 3.2, 22, -2, 3.47, 32, "ice", null); A.water.ice.on = false # 凍ったら上を歩ける
	# 半分しずんだたんす（ベル）
	var f := XF(-6.3, 2.95, 26.8, 1); f.box(-0.6, 0, -0.3, 0.6, 0.95, 0.3, "wood_d"); f.box(-0.62, 0.95, -0.32, 0.62, 1, 0.32, "wood_d")
	A.floodDrawer = mkDrawer({x = f.p(0, 0, 0.3).x, y = 2.95 + 0.62, z = f.p(0, 0, 0.3).z, w = 0.9, h = 0.26, d = 0.45, dir = f.dir(0, 1), mat = "cabd", name = "しずみかけた引き出し"})
	# うかんだ家具
	rbox(-8.5, 3.3, 29.5, 0.5, 0.9, 0.5, 0.5, 0.3, 1.3, "wood_m"); rbox(-4.6, 3.35, 24.2, 1.2, 0.3, 0.6, 0.1, 0.6, 0.05, "sofa_r"); rbox(-3.3, 3.4, 27.3, 0.5, 0.1, 0.5, 0, 0.4, 0, "wood_d")
	# サメの着ぐるみが入ったたんす（ちょっとしたおまけ）
	A.sharkWard = wardrobe(-9.52, 2.95, 30.4, 1, {w = 1.1, d = 0.6, h = 2.1, mat = "door_r", lm = "door_r", noRod = true, name = "たんす"})
	picture(-9.84, 4.9, 24.5, 1, 0.8, 0.6, 67); picture(-5, 5, 31.84, 2, 0.6, 0.5, 69); ceilLamp(-6, C2, 25); ceilLamp(-6, C2, 29.5)
# ================= 外観 =================
func exteriorA1() -> void: # 2階の上の屋根（平ら）
	box(-10.4, F3 - 0.02, 13.7, 10.4, F3 + 0.08, 32.4, "roof_brown", {uv = 2.4, f = 4 | 1 | 2 | 16 | 32}); box(-10.4, F3, 13.7, 10.4, F3 + 0.35, 13.9, "trim", {solid = false}); box(-10.4, F3, 32.2, 10.4, F3 + 0.35, 32.4, "trim", {solid = false}); box(-10.4, F3, 13.9, -10.2, F3 + 0.35, 32.2, "trim", {solid = false}); box(10.2, F3, 13.9, 10.4, F3 + 0.35, 32.2, "trim", {solid = false})
	# 水色の高い塔（3〜5階、入れない）
	var tw := func(x0: float, x1: float, z0: float, z1: float, y0: float, y1: float, mat) -> void:
		box(x0, y0, z0, x1, y1, z1, mat, {uv = 2})
		for ab in [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]: box(ab[0] - 0.12, y0, ab[1] - 0.12, ab[0] + 0.12, y1, ab[1] + 0.12, "trim", {solid = false})
		box(x0 - 0.1, y1 - 0.2, z0 - 0.1, x1 + 0.1, y1, z1 + 0.1, "trim", {solid = false})
	tw.call(-6, 6, 16, 30, F3, 10.2, "sid_teal"); tw.call(-6, 6, 16, 30, 10.2, 13.6, "sid_teal")
	# 5階：おとなりさんが双眼鏡でのぞく部屋（中は空洞）
	var y0 := 13.6; var y1 := 16.6
	box(-4.4, y0 - 0.2, 18, 4.4, y0, 28, "floor_dark", {solid = false}); box(-4.4, y1 - 0.2, 18, 4.4, y1, 28, "white", {solid = false})
	wallX(-4.55, 4.55, 18, y0, y1, 0.3, "sid_teal", "wp_brown", [[-0.6, 0.6, 14.3, 15.6]], {solid = false}); wallX(-4.55, 4.55, 28, y0, y1, 0.3, "wp_brown", "sid_teal", [], {solid = false}); wallZ(18.15, 27.85, -4.4, y0, y1, 0.3, "sid_teal", "wp_brown", [], {solid = false}); wallZ(18.15, 27.85, 4.4, y0, y1, 0.3, "wp_brown", "sid_teal", [], {solid = false})
	for ab in [[-4.4, 18], [4.4, 18], [-4.4, 28], [4.4, 28]]: box(ab[0] - 0.12, y0, ab[1] - 0.12, ab[0] + 0.12, y1, ab[1] + 0.12, "trim", {solid = false})
	box(-4.5, y1 - 0.2, 17.9, 4.5, y1, 28.1, "trim", {solid = false})
	mkWindow({axis = "x", x = 0, z = 18, y0 = 14.3, w = 1.2, h = 1.3}); A.peepL = plight("#ffd9a0", 0, 6, 1.5); A.peepL.position = Vector3(0, 15.8, 20); scene.add_child(A.peepL)
	roofX(-4.4, 4.4, 18, 28, 16.6, 3, "roof_brown", 0.5); gable(-4.4, 18, 28, 16.6, 19.6, "sid_teal"); gable(4.4, 18, 28, 16.6, 19.6, "sid_teal")
	box(-6.3, 10.1, 15.7, 6.3, 10.3, 30.3, "roof_brown", {solid = false}); box(-6.3, 13.5, 15.7, 6.3, 13.7, 30.3, "roof_brown", {solid = false})
	# 塔の窓
	var win := func(x: float, y: float, z: float, w: float, h: float, ax: String) -> void:
		if ax == "x":
			box(x - w / 2 - 0.08, y - 0.08, z - 0.06, x + w / 2 + 0.08, y + h + 0.08, z + 0.06, "trim", {solid = false}); box(x - w / 2, y, z - 0.07, x + w / 2, y + h, z + 0.07, "glassd", {solid = false})
		else:
			box(x - 0.06, y - 0.08, z - w / 2 - 0.08, x + 0.06, y + h + 0.08, z + w / 2 + 0.08, "trim", {solid = false}); box(x - 0.07, y, z - w / 2, x + 0.07, y + h, z + w / 2, "glassd", {solid = false})
	for y in [7.6, 11]:
		for x in [-4, -1.3, 1.3, 4]:
			win.call(x, y, 16, 1, 1.4, "x"); win.call(x, y, 30, 1, 1.4, "x")
	for y in [7.6, 11]:
		for z in [18.5, 23, 27.5]:
			win.call(-6, y, z, 1.2, 1.4, "z"); win.call(6, y, z, 1.2, 1.4, "z")
	for x in [-2.8, 2.8]: win.call(x, 14.4, 18, 0.9, 1.3, "x")
	win.call(0, 17.3, 18, 0.8, 0.9, "x")
	# 上の窓から双眼鏡でのぞく窓（イントロ）
	A.peepWin = {x = 0, y = 14.4, z = 17.9}
	# 西の黄色い部分と、東のオレンジの部分
	box(-10, F3, 18, -6, 10, 28, "sid_yel2", {uv = 2}); box(-10.3, 10, 17.7, -5.8, 10.25, 28.3, "roof_brown", {solid = false}); win.call(-10, 8, 21, 1.2, 1.3, "z"); win.call(-10, 8, 25, 1.2, 1.3, "z")
	box(6, F3, 20, 10, 9.4, 30, "sid_orange", {uv = 2}); box(5.8, 9.4, 19.8, 10.2, 9.6, 30.2, "roof_brown", {solid = false}); win.call(10, 7.6, 23, 1.2, 1.2, "z"); win.call(10, 7.6, 27, 1.2, 1.2, "z")
	# 西側の木の足場（階段つき）
	for z in [16, 21, 26, 31]:
		for x in [-13, -10.6]: box(x - 0.12, 0, z - 0.12, x + 0.12, 13.8, z + 0.12, "beam", {solid = false})
	for y in [F3, 10.2, 13.6]:
		box(-13.2, y - 0.15, 15.8, -10.4, y, 31.2, "raw", {solid = false}); box(-13.2, y, 15.8, -13.1, y + 1, 31.2, "beam", {solid = false})
	for q in [[0, F3, 24, 31], [F3, 10.2, 16, 22], [10.2, 13.6, 24, 30]]: beam(-11.8, q[0], q[2], -11.8, q[1], q[3], 0.3, "raw")
	for z in [16, 21, 26, 31]: beam(-13, 0.5, z, -13, F3, z + (4.8 if z < 30 else -4.8), 0.14)
	# えんとつ
	box(3, F3, 24, 3.8, F3 + 5.5, 24.8, "brick", {solid = false})
	# 玄関ポーチ（二枚扉）
	box(-3.2, 0, 11.6, 3.2, F1, 14, "wood_m", {s = "wood"}); box(-2.4, 0, 11.2, 2.4, 0.15, 11.6, "wood_m", {s = "wood"})
	for x in [-3, 3]: box(x - 0.1, F1, 11.7, x + 0.1, 3.3, 11.9, "trim", {s = "wood"})
	box(-3.5, 3.3, 11.3, 3.5, 3.55, 14, "roof_brown", {s = "wood"})
	for x in [-3.0, 3.0]: box(minf(x, x * 0.4), F1 + 0.8, 11.72, maxf(x, x * 0.4), F1 + 0.9, 11.8, "trim", {solid = false})
	signp(0, 2.95, 13.84, 0.9, 0.3, "trim", PI)
	# 裏口の階段
	box(3, 0, 32.15, 5, 0.15, 33, "wood_m", {s = "wood"})
	# ガレージの外（ピンク）
	wallX(-17.15, -10, 14, 0, 3.4, 0.3, "sid_pinkg", "raw"); wallX(-17.15, -10, 24, 0, 3.4, 0.3, "raw", "sid_pinkg"); wallZ(14.15, 24, -17, 0, 3.4, 0.3, "sid_pinkg", "raw", [[20.02, 20.98, 0.1, 2.2]])
	box(-17.4, 3.4, 13.7, -9.9, 3.65, 24.3, "roof_brown", {s = "wood"}); box(-16.2, 0.02, 13.84, -10.8, 2.8, 13.86, "gdoor", {solid = false})
	mkWindow({axis = "z", x = -17, z = 17, y0 = 1.2, w = 1.6, h = 0.9})
# ================= 庭 =================
func yardA1() -> void: # 前の柵・門・ガレージ前
	picket(-21, 7, -16.6, 7); picket(-10.4, 7, -1.1, 7); picket(1.1, 7, 21, 7); picket(-21, 7, -21, 40); picket(21, 7, 21, 40); picket(-21, 40, 21, 40)
	box(-0.9, 0, 7, 0.9, 0.06, 11.2, "walk", {s = "stone", uv = 1}); box(-16.5, 0, 6.5, -10.5, 0.05, 14, "concrete", {s = "stone"})
	carModel(-13.5, 9.6, 2, "car_r"); mailbox(1.7, 6.6, "red"); flowers(-9.6, 12.6, -3.6, 13.7); flowers(3.6, 12.6, 9.6, 13.7); bush(12, 13.5, 1.1); bush(-19, 12, 1)
	treeAt(-19, 30, 1.4); treeAt(17, 36, 1.5); treeAt(17, 16, 1.2); treeAt(-6, 37, 1.1); treeAt(14, 10, 1)
	# がらくた（窓をわるのに使える）
	A.junk = []
	# 電柱と電線（通りぞい）
	for x in [-40, -20, 0, 20, 40]:
		cyl(x + 5, 0, 5.2, 0.13, 9, "pole", 8, {solid = true, s = "wood"}); box(x + 4, 8.4, 5.12, x + 6, 8.52, 5.28, "pole", {solid = false})
	var x := -35
	while x < 45:
		for dz in [-0.9, 0.9]:
			var g := G.tube([Vector3(x, 8.45, 5.2 + dz * 0.9), Vector3(x + 10, 7.9, 5.2 + dz * 0.9), Vector3(x + 20, 8.45, 5.2 + dz * 0.9)], 8, 0.015, 4)
			scene.add_child(mesh(g, MATS.black))
		x += 20
