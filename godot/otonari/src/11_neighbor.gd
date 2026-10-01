
# ================= おとなりさん（モデル・動き・AI）=================
var NB := {p = Vector3(), yaw = 0.0, state = "off", anim = "idle", ph = 0.0, animT = 0.0, path = [], pi = 0, task = null, taskT = 0.0, speed = 0.0, seeT = -99.0, lastSeen = Vector3(), alert = 0.0, stuck = 0.0, mode = "path",
	doorWait = 0.0, climb = null, jump = null, look = 0.0, voiceT = 0.0, stepD = 0.0, sit = null, hideTarget = null, catchT = 0.0, trapQ = [], repairQ = [], visible = true, lastNoiseT = 0.0, chaseT = 0.0, giveUp = 0.0, active = false, routineN = 0,
	blindT = 0.0, chaseMax = 16.0, sawHide = null, goalHide = null, goal = null, goalNode = null, goalOK = false, climbed = -1, inv = null, script = null, caughtDone = false, modeName = "", modeT = 0.0, pathT = 0.0, searchT = 0.0, dt = 0.016,
	goBoiler = false, noDoors = false, tq = null, tt = 0.0}
const NBH := 1.95
const NBR := 0.33
var NBM = null # モデル
func nbMats() -> Dictionary:
	var sm := func(col: String, rough: float) -> StandardMaterial3D: return std_mat({color = col, rough = rough})
	var vest := std_mat({map = tex("c90"), rough = 0.9}); vest.uv1_scale = Vector3(2, 2, 1)
	return {skin = sm.call("#eab494", 0.7), shirt = sm.call("#eec24a", 0.85), vest = vest, glove = sm.call("#18181c", 0.35), pants = sm.call("#b4502e", 0.85), shoe = sm.call("#5a3220", 0.5), hair = sm.call("#6a4028", 0.9),
		must = sm.call("#3a2618", 1.0), eye = sm.call("#ffffff", 0.3), pupil = sm.call("#1a1410", 0.2), belt = sm.call("#2a1a10", 0.5), nose = sm.call("#d89a78", 0.6)}
func nbg() -> Node3D:
	var n := Node3D.new(); n.rotation_order = EULER_ORDER_XYZ
	return n
func nbmesh(g: Geo, m: Material, x := 0.0, y := 0.0, z := 0.0, sx := 1.0, sy := 1.0, sz := 1.0) -> MeshInstance3D:
	var o := mesh(g, m, true); o.rotation_order = EULER_ORDER_XYZ; o.position = Vector3(x, y, z); o.scale = Vector3(sx, sy, sz)
	return o
func buildNeighbor() -> Dictionary:
	var Mt := nbMats()
	var S := func(r: float, s := 14) -> Geo: return G.sphere(r, s, maxi(8, int(s * 0.7)))
	var C := func(r: float, h: float, rt = null, s := 12) -> Geo: return G.cylinder(rt if rt != null else r, r, h, s)
	var B := func(w: float, h: float, d: float) -> Geo: return G.box(w, h, d)
	var CP := func(r: float, l: float) -> Geo: return G.capsule(r, l, 4, 10)
	var root := nbg(); var body := nbg(); root.add_child(body)
	var pelvis := nbg(); pelvis.position.y = 0.98; body.add_child(pelvis)
	pelvis.add_child(nbmesh(CP.call(0.2, 0.12), Mt.pants, 0, -0.02, 0, 1.05, 0.9, 0.8)); pelvis.add_child(nbmesh(C.call(0.215, 0.07, 0.215, 16), Mt.belt, 0, 0.1, 0, 1.02, 1, 0.82)); pelvis.add_child(nbmesh(B.call(0.07, 0.05, 0.02), Mt.nose, 0, 0.1, 0.18))
	var leg := func(s: float) -> Dictionary:
		var hip := nbg(); hip.position = Vector3(s * 0.11, -0.02, 0); pelvis.add_child(hip); hip.add_child(nbmesh(CP.call(0.085, 0.34), Mt.pants, 0, -0.24, 0)); var knee := nbg(); knee.position.y = -0.47; hip.add_child(knee)
		knee.add_child(nbmesh(CP.call(0.075, 0.34), Mt.pants, 0, -0.23, 0)); var foot := nbmesh(CP.call(0.07, 0.16), Mt.shoe, 0, -0.47, 0.06); foot.rotation.x = PI / 2; foot.scale = Vector3(1.1, 1, 0.8); knee.add_child(foot)
		return {hip = hip, knee = knee}
	var L: Dictionary = leg.call(-1); var R: Dictionary = leg.call(1)
	var spine := nbg(); spine.position.y = 1.04; body.add_child(spine)
	spine.add_child(nbmesh(CP.call(0.24, 0.28), Mt.vest, 0, 0.28, 0, 1.05, 1, 0.78)); spine.add_child(nbmesh(C.call(0.2, 0.12, 0.14, 14), Mt.shirt, 0, 0.64, 0, 1, 1, 0.8)) # 胸・肩
	spine.add_child(nbmesh(B.call(0.1, 0.26, 0.02), Mt.shirt, 0, 0.44, 0.19)) # えり元
	for s in [-1, 1]:
		var col := nbmesh(B.call(0.08, 0.05, 0.03), Mt.shirt, s * 0.05, 0.58, 0.17); col.rotation.z = s * 0.5; spine.add_child(col)
	var neck := nbg(); neck.position.y = 0.66; spine.add_child(neck); neck.add_child(nbmesh(C.call(0.075, 0.12), Mt.skin, 0, 0.05, 0))
	var head := nbg(); head.position.y = 0.24; neck.add_child(head)
	head.add_child(nbmesh(S.call(0.17, 18), Mt.skin, 0, 0, 0, 1, 1.12, 1.02)); head.add_child(nbmesh(B.call(0.25, 0.13, 0.2), Mt.skin, 0, -0.13, 0.035)); head.add_child(nbmesh(S.call(0.12, 12), Mt.skin, 0, -0.16, 0.05, 1.05, 0.7, 0.9)) # あご
	head.add_child(nbmesh(S.call(0.055, 12), Mt.nose, 0, -0.02, 0.18, 1, 1.15, 1.35)) # 鼻
	var mu := nbmesh(CP.call(0.035, 0.16), Mt.must, 0, -0.09, 0.17, 1, 1, 1); mu.rotation.z = PI / 2; head.add_child(mu)
	for s in [-1, 1]: head.add_child(nbmesh(S.call(0.04, 10), Mt.must, s * 0.1, -0.11, 0.155, 1, 0.9, 0.8))
	var brow := nbmesh(B.call(0.25, 0.045, 0.05), Mt.must, 0, 0.07, 0.16); brow.rotation.x = -0.2; head.add_child(brow)
	for s in [-1, 1]:
		head.add_child(nbmesh(S.call(0.028, 10), Mt.eye, s * 0.062, 0.02, 0.155, 1, 0.8, 0.6)); head.add_child(nbmesh(S.call(0.015, 8), Mt.pupil, s * 0.062, 0.02, 0.172)); head.add_child(nbmesh(S.call(0.045, 10), Mt.skin, s * 0.17, -0.01, 0, 0.45, 1, 0.8))
	# 髪（まわりだけ。てっぺんははげ）
	for i in 9:
		var a := PI * 0.2 + i / 8.0 * PI * 1.6; head.add_child(nbmesh(S.call(0.07, 10), Mt.hair, sin(a) * 0.15, 0.04 - absf(cos(a)) * 0.02, -cos(a) * 0.14, 1, 1.1, 0.9))
	head.add_child(nbmesh(S.call(0.16, 14), Mt.hair, 0, 0.1, -0.03, 1, 0.45, 1.02)) # 上の髪
	var curl := nbmesh(G.torus(0.045, 0.018, 6, 12, PI * 1.5), Mt.hair, 0, 0.2, 0.04); curl.rotation = Vector3(0, PI / 2, 0.5); head.add_child(curl)
	var arm := func(s: float) -> Dictionary:
		var sh := nbg(); sh.position = Vector3(s * 0.3, 0.56, 0); spine.add_child(sh); sh.add_child(nbmesh(S.call(0.1, 10), Mt.vest, 0, 0, 0, 1.1, 1, 1)); sh.add_child(nbmesh(CP.call(0.075, 0.2), Mt.shirt, 0, -0.17, 0)); sh.add_child(nbmesh(C.call(0.082, 0.06, 0.082, 10), Mt.shirt, 0, -0.31, 0))
		var el := nbg(); el.position.y = -0.33; sh.add_child(el); el.add_child(nbmesh(CP.call(0.062, 0.2), Mt.skin, 0, -0.15, 0)); el.add_child(nbmesh(C.call(0.085, 0.12, 0.07, 10), Mt.glove, 0, -0.27, 0))
		var hand := nbmesh(S.call(0.1, 10), Mt.glove, 0, -0.4, 0.02, 0.95, 1.2, 0.75); el.add_child(hand); el.add_child(nbmesh(S.call(0.045, 8), Mt.glove, s * -0.07, -0.36, 0.06))
		for i in 3: el.add_child(nbmesh(CP.call(0.022, 0.07), Mt.glove, -0.05 + i * 0.05, -0.52, 0.03))
		return {sh = sh, el = el, hand = hand}
	var AL: Dictionary = arm.call(-1); var AR: Dictionary = arm.call(1)
	scene.add_child(root)
	NBM = {root = root, body = body, pelvis = pelvis, spine = spine, neck = neck, head = head, L = L, R = R, AL = AL, AR = AR, M = Mt}
	return NBM
# ---- 動き ----
func animNB(dt: float) -> void:
	var m = NBM
	if not m: return
	var a: String = NB.anim; NB.animT += dt; var t: float = NB.animT; var sp: float = NB.speed; var run := sp > 3.6
	# 初期の姿勢
	var pY := 0.98; var bY := 0.0; var lean := 0.0; var thL := 0.0; var thR := 0.0; var kL := 0.0; var kR := 0.0; var shL := 0.08; var shR := 0.08; var shLz := 0.12; var shRz := -0.12; var elL := -0.25; var elR := -0.25; var hY := 0.0; var hX := 0.0; var spX := 0.0; var spZ := 0.0
	if a == "walk" or a == "run":
		NB.ph += dt * sp * (1.55 if run else 2.15); var ph: float = NB.ph; var am := 0.75 if run else 0.5
		thL = sin(ph) * am; thR = -sin(ph) * am; kL = maxf(0, -cos(ph)) * am * 1.6 + 0.1; kR = maxf(0, cos(ph)) * am * 1.6 + 0.1
		shL = -sin(ph) * am * 1.1; shR = sin(ph) * am * 1.1; elL = -0.4 - (0.9 if run else 0.1); elR = -0.4 - (0.9 if run else 0.1); bY = absf(cos(ph)) * (0.07 if run else 0.035); lean = 0.28 if run else 0.05; hX = -0.18 if run else 0.0
		if NB.state == "chase":
			shL = -1.2 + sin(ph) * 0.35; shR = -1.2 - sin(ph) * 0.35; elL = -0.3; elR = -0.3
	elif a == "idle":
		var b := sin(t * 1.8); bY = b * 0.006; shLz = 0.1 + b * 0.02; shRz = -0.1 - b * 0.02; hY = sin(t * 0.4) * 0.2
	elif a == "look":
		hY = sin(t * 1.3) * 0.9; spZ = sin(t * 1.3) * 0.08; hX = -0.1
	elif a == "reach":
		shL = -1.45; shR = -1.45; elL = -0.2; elR = -0.2; lean = 0.3; hX = -0.25; thL = 0.2; thR = -0.35; kL = 0.3; kR = 0.5
	elif a == "climb":
		NB.ph += dt * 3.2; var c: float = NB.ph; shL = -2.7 + sin(c) * 0.35; shR = -2.7 - sin(c) * 0.35; elL = -0.5 - maxf(0, sin(c)) * 0.6; elR = -0.5 - maxf(0, -sin(c)) * 0.6; thL = -0.7 + sin(c) * 0.5; thR = -0.7 - sin(c) * 0.5; kL = 0.9; kR = 0.9; hX = -0.3
	elif a == "crouch":
		pY = 0.55; thL = -1.25; thR = -1.25; kL = 2.0; kR = 2.0; lean = 0.55; shL = -0.9; shR = -0.9; elL = -0.4; elR = -0.4; var c := sin(t * 6); shR = -0.9 + c * 0.25
	elif a == "sit":
		pY = 0.5; thL = -1.5; thR = -1.5; kL = 1.45; kR = 1.45; shL = -0.5; shR = -0.5; elL = -1; elR = -1; lean = -0.1; hY = sin(t * 0.3) * 0.15
	elif a == "water":
		shR = -1.1; elR = -0.2; shL = -0.3; lean = 0.08; hX = 0.2; hY = sin(t * 0.5) * 0.3
	elif a == "cook":
		shL = -0.9; shR = -0.9; elL = -0.8 + sin(t * 5) * 0.15; elR = -0.8; lean = 0.12; hX = 0.35
	elif a == "work":
		shR = -1.5 + sin(t * 9) * 0.6; elR = -0.6; shL = -0.7; lean = 0.25; hX = 0.3
	elif a == "wave":
		shR = -2.7; shRz = -0.3 + sin(t * 7) * 0.3; elR = -0.3
	elif a == "check":
		shR = -1.2; elR = -0.5; hX = 0.25; lean = 0.15
	elif a == "binoc":
		shL = -2.2; shR = -2.2; shLz = 0.55; shRz = -0.55; elL = -1.9; elR = -1.9; hX = 0.05
	elif a == "cover":
		shL = -2.3; shR = -2.3; shLz = 0.45; shRz = -0.45; elL = -2.1; elR = -2.1; hX = 0.35; lean = 0.12; spZ = sin(t * 2) * 0.04
	elif a == "grab":
		shL = -1.55; shR = -1.55; elL = -0.05; elR = -0.05; lean = 0.35; hX = -0.35; shLz = 0.35; shRz = -0.35
	if NB.sit: pY = 0.5
	# 見ている方へ頭を向ける
	hY += NB.look
	m.pelvis.position.y = pY + bY; m.spine.position.y = pY + 0.06 + bY; m.body.rotation.x = 0.0; m.spine.rotation.x = lean + spX; m.spine.rotation.z = spZ; m.pelvis.rotation.x = 0.0
	m.L.hip.rotation.x = -thL; m.R.hip.rotation.x = -thR; m.L.knee.rotation.x = kL; m.R.knee.rotation.x = kR
	m.AL.sh.rotation.x = shL; m.AR.sh.rotation.x = shR; m.AL.sh.rotation.z = shLz; m.AR.sh.rotation.z = shRz; m.AL.el.rotation.x = elL; m.AR.el.rotation.x = elR
	m.head.rotation.y = clampf(hY, -1.2, 1.2); m.head.rotation.x = hX
	m.root.position = NB.p; m.root.rotation.y = NB.yaw
	# 足音
	if (a == "walk" or a == "run") and NB.visible:
		NB.stepD += sp * dt
		if NB.stepD > (1.3 if run else 0.95):
			NB.stepD = 0.0; sfxNbStep(NB.p, run)
# ================= 道すじ（ナビ）=================
var NODES := {}
var NLIST := []
func node(id: String, x: float, y: float, z: float) -> Dictionary:
	var n := {id = id, p = Vector3(x, y, z), e = [], pool = false, i = NLIST.size()}
	NODES[id] = n; NLIST.append(n)
	return n
func link(a: String, b: String, type := "w", door = null) -> void:
	var An = NODES.get(a); var Bn = NODES.get(b)
	if not An or not Bn:
		push_warning("link %s %s" % [a, b]); return
	var c: float = An.p.distance_to(Bn.p) * (2.5 if type == "l" else 1.0)
	An.e.append({to = Bn, type = type, door = door, c = c}); Bn.e.append({to = An, type = type, door = door, c = c})
func nav_filt(b) -> bool: return b.s != "trig" and b.s != "door" and not (b.ref is Dictionary and b.ref.has("type") and b.ref.has("d"))
func nearestNode(p: Vector3, los := true, maxDy := 1.3):
	var best = null; var bd := 1e9
	for n in NLIST:
		var dy: float = absf(n.p.y - p.y)
		if dy > maxDy: continue
		var d: float = Vector2(n.p.x - p.x, n.p.z - p.z).length() + dy * 3
		if d >= bd: continue
		if los and not los_clear(Vector3(p.x, p.y + 0.9, p.z), Vector3(n.p.x, n.p.y + 0.9, n.p.z), nav_filt): continue
		bd = d; best = n
	if not best and los: return nearestNode(p, false, maxDy + 2)
	return best
func findPath(a, b):
	if not a or not b: return null
	if is_same(a, b): return [a]
	var N := NLIST.size()
	var g := {}; var f := {}; var from := {}; var closed := {}; var open := [a]; var inopen := {a.i: true}
	g[a.i] = 0.0; f[a.i] = a.p.distance_to(b.p)
	while open.size():
		var bi := 0
		for i in range(1, open.size()):
			if f[open[i].i] < f[open[bi].i]: bi = i
		var cur = open[bi]; open.remove_at(bi); inopen.erase(cur.i)
		if is_same(cur, b):
			var P := [cur]; var c = cur
			while from.has(c.i):
				c = from[c.i]; P.push_front(c)
			return P
		closed[cur.i] = true
		for e in cur.e:
			if closed.has(e.to.i): continue
			if e.type == "d" and NB.noDoors: continue
			var ng: float = g[cur.i] + e.c
			if ng < g.get(e.to.i, 1e9):
				from[e.to.i] = cur; g[e.to.i] = ng; f[e.to.i] = ng + e.to.p.distance_to(b.p)
				if not inopen.has(e.to.i):
					open.append(e.to); inopen[e.to.i] = true
	return null
func edgeBetween(a, b):
	for e in a.e:
		if is_same(e.to, b): return e
	return null
# ================= おとなりさんの道すじ（アルファ1の家）=================
func buildNavA1() -> void:
	var n := func(id: String, x: float, y: float, z: float) -> void: node(id, x, y, z)
	var L := func(a: String, b: String, type := "w", door = null) -> void: link(a, b, type, door)
	# 外
	n.call("st_w", -20, 0.02, 1.5); n.call("st_c", 0, 0.02, 1.5); n.call("st_e", 20, 0.02, 1.5); n.call("gate", 0, 0.06, 6.6); n.call("path", 0, 0.06, 10.4); n.call("porch", 0, 0.3, 12.9); n.call("yard_fw", -7, 0, 10.4); n.call("yard_fe", 7, 0, 10.4); n.call("drive", -11, 0.05, 8.6)
	n.call("west_f", -18.2, 0, 9.2); n.call("west_m", -18.2, 0, 20.5); n.call("west_b", -18.2, 0, 33); n.call("gar_side", -18.2, 0, 20.5); n.call("east_f", 14.5, 0, 12); n.call("east_m", 14.5, 0, 24); n.call("east_b", 14.5, 0, 35); n.call("back_e", 9, 0, 35); n.call("back_door", 4, 0.15, 33.4); n.call("back_c", -2, 0, 35.5); n.call("back_w", -12, 0, 35.5)
	L.call("st_w", "st_c"); L.call("st_c", "st_e"); L.call("st_c", "gate"); L.call("gate", "path"); L.call("path", "porch"); L.call("path", "yard_fw"); L.call("path", "yard_fe"); L.call("yard_fw", "drive"); L.call("drive", "st_w"); L.call("drive", "west_f"); L.call("west_f", "west_m"); L.call("west_m", "west_b")
	L.call("west_b", "back_w"); L.call("back_w", "back_c"); L.call("back_c", "back_door"); L.call("back_door", "back_e"); L.call("back_e", "east_b"); L.call("east_b", "east_m"); L.call("east_m", "east_f"); L.call("east_f", "yard_fe")
	# ガレージ
	n.call("gar_in", -16, 0.1, 20.5); n.call("gar_m", -13.5, 0.1, 18.5); n.call("gar_ld", -10.8, 0.1, 17); L.call("west_m", "gar_in", "d", func(): return A.garageSide); L.call("gar_in", "gar_m"); L.call("gar_m", "gar_ld")
	# 1階
	n.call("hall_f", 0, 0.3, 15.6); n.call("hall_m", 0, 0.3, 19.5); n.call("hall_n", 0, 0.3, 24.5); n.call("hall_b", 0, 0.3, 29); n.call("kit_d", 1.2, 0.3, 16); n.call("kit", 3, 0.3, 16); n.call("kit_m", 5.2, 0.3, 16.4); n.call("kit_e", 8.6, 0.3, 17.3)
	n.call("elev1", 1.1, 0.3, 20.2); n.call("cab1", 3.1, 0.3, 20.2); n.call("liv", -3.2, 0.3, 16.3); n.call("liv_m", -4.8, 0.3, 17.5); n.call("liv_n", -4.7, 0.3, 20.4); n.call("liv_base", -7.6, 0.3, 21.2); n.call("liv_gd", -9.1, 0.3, 17)
	n.call("stairs_b", -2.6, 0.3, 20.2); n.call("stairs_1", -2.6, 0.3, 21.4); n.call("stairs_t", -9.3, 3.5, 21.4)
	n.call("grave_d", -1.2, 0.3, 24.5); n.call("grave", -2.8, 0.3, 24.5); n.call("grave_s", -2.8, 0.3, 22.7); n.call("din_d", -1.2, 0.3, 29.5); n.call("din", -3, 0.3, 29.5); n.call("din_w", -8.8, 0.3, 27.8)
	n.call("pan_d", 1.2, 0.3, 23.5); n.call("pan", 3, 0.3, 23.5); n.call("pan_m", 4.2, 0.3, 24.2); n.call("boil_d", 1.2, 0.3, 29); n.call("boil", 3, 0.3, 29); n.call("boil_e", 5.3, 0.3, 29.2); n.call("boil_back", 4, 0.3, 31.3)
	n.call("bath1", 7, 0.3, 29); n.call("bath1_s", 8.5, 0.3, 27.2); n.call("bed1_d", 8.5, 0.3, 25.4); n.call("bed1", 7.3, 0.3, 22.4)
	L.call("porch", "hall_f", "d", func(): return A.front[0]); L.call("hall_f", "hall_m"); L.call("hall_m", "hall_n"); L.call("hall_n", "hall_b"); L.call("hall_f", "liv"); L.call("hall_f", "kit_d"); L.call("kit_d", "kit", "d", func(): return A.kitDoor); L.call("kit", "kit_m"); L.call("kit_m", "kit_e")
	L.call("hall_m", "elev1"); L.call("elev1", "cab1", "ew")
	L.call("liv", "liv_m"); L.call("liv_m", "liv_n"); L.call("liv_n", "liv_base"); L.call("liv_m", "liv_gd"); L.call("liv_gd", "gar_ld", "d", func(): return A.garageDoor); L.call("liv_m", "stairs_b"); L.call("stairs_b", "stairs_1"); L.call("stairs_1", "stairs_t")
	L.call("hall_n", "grave_d"); L.call("grave_d", "grave", "d", func(): return A.graveDoor); L.call("grave", "grave_s"); L.call("hall_b", "din_d"); L.call("din_d", "din", "d", func(): return A.dinDoor); L.call("din", "din_w")
	L.call("hall_n", "pan_d"); L.call("pan_d", "pan", "d", func(): return A.panDoor); L.call("pan", "pan_m"); L.call("hall_b", "boil_d"); L.call("boil_d", "boil", "d", func(): return A.boilDoor); L.call("boil", "boil_back"); L.call("boil_back", "back_door", "d", func(): return A.back)
	L.call("boil", "boil_e"); L.call("boil_e", "bath1", "d", func(): return A.bathDoor); L.call("bath1", "bath1_s"); L.call("bath1_s", "bed1_d", "d", func(): return A.bedDoor); L.call("bed1_d", "bed1")
	# 2階
	n.call("cab2", 3.1, 3.5, 20.2); n.call("h2_e", 1.1, 3.5, 20.2); n.call("h2_s", 0.8, 3.5, 15.5); n.call("h2_n", 0.4, 3.5, 24.5); n.call("h2_b", 0, 3.5, 30.9)
	n.call("liv2_d", -1.2, 3.5, 19.8); n.call("liv2", -3, 3.5, 19.8); n.call("liv2_m", -4.6, 3.5, 17.6); n.call("ante_d", -6.2, 3.5, 19.7); n.call("ante", -7.8, 3.5, 19.7); n.call("sec_d", -8.55, 3.5, 18.2); n.call("sec", -8.55, 3.5, 16.2); n.call("sec_panel", -7.75, 3.5, 15.75)
	n.call("class_d", 1.2, 3.5, 15.5); n.call("class", 2.7, 3.5, 15.5); n.call("class_n", 2.7, 3.5, 18.5); n.call("class_front", 7.8, 3.5, 18.5); n.call("class_d2", 9, 3.5, 18.5); n.call("corr", 9, 3.5, 20.2); n.call("corr_w", 5, 3.5, 20.2); n.call("bath2", 9, 3.5, 22.4)
	n.call("range_d", 1.2, 3.5, 23.5); n.call("range", 2.6, 3.5, 23.5)
	n.call("flood_x", -1.2, 3.5, 30.9); n.call("flood_exit", -2.7, 3.5, 30.9); n.call("pool_e", -4.6, 2.95, 30.4); n.call("pool_m", -4.8, 2.95, 25.8); n.call("pool_w", -9.2, 2.95, 24.4); n.call("flood_land", -9.3, 3.5, 22.6)
	for k in ["pool_e", "pool_m", "pool_w"]: NODES[k].pool = true
	L.call("cab1", "cab2", "e"); L.call("cab2", "h2_e", "ew"); L.call("h2_e", "h2_s"); L.call("h2_e", "h2_n"); L.call("h2_n", "h2_b"); L.call("h2_s", "class_d"); L.call("class_d", "class", "d", func(): return A.classDoor); L.call("class", "class_n"); L.call("class_n", "class_front"); L.call("class_front", "class_d2"); L.call("class_d2", "corr", "d", func(): return A.classDoor2); L.call("corr", "corr_w"); L.call("corr", "bath2", "d", func(): return A.bath2Door)
	L.call("h2_e", "liv2_d"); L.call("liv2_d", "liv2", "d", func(): return A.liv2Door); L.call("liv2", "liv2_m"); L.call("liv2", "ante_d"); L.call("ante_d", "ante", "d", func(): return A.anteDoor); L.call("ante", "sec_d"); L.call("sec_d", "sec", "d", func(): return A.secDoor); L.call("sec", "sec_panel")
	L.call("h2_n", "range_d"); L.call("range_d", "range", "d", func(): return A.rangeDoor)
	L.call("stairs_t", "flood_land"); L.call("flood_land", "pool_w"); L.call("pool_w", "pool_m"); L.call("pool_m", "pool_e"); L.call("pool_e", "flood_exit"); L.call("flood_exit", "flood_x", "d", func(): return A.floodDoor); L.call("flood_x", "h2_b")
# 切られた監視カメラを入れ直しにいく（ふだんは選ばない）
const TASK_CAMS := {node = "sec_panel", dur = 2.4, anim = "work", face = PI / 2, w = 0, camsOn = true}
var TASKS_A1 := [
	{node = "hall_m", dur = 3, anim = "look", w = 2}, {node = "liv_m", dur = 4, anim = "look", w = 2}, {node = "liv_m", dur = 12, anim = "sit", sit = {x = -6.15, z = 19.2, yaw = -PI / 2}, w = 2.5}, {node = "kit_e", dur = 7, anim = "cook", face = PI / 2, w = 2.5}, {node = "kit_m", dur = 4, anim = "idle", w = 1.5},
	{node = "din", dur = 5, anim = "look", w = 1.5}, {node = "grave", dur = 6, anim = "crouch", face = -PI / 2, w = 1.5}, {node = "pan_m", dur = 4, anim = "check", w = 1}, {node = "boil", dur = 6, anim = "check", face = PI / 2, w = 2.5, boil = true}, {node = "bed1", dur = 5, anim = "look", w = 1.5}, {node = "bath1", dur = 3, anim = "idle", w = 1},
	{node = "gar_m", dur = 7, anim = "work", face = -PI / 2, w = 1.5}, {node = "liv2_m", dur = 5, anim = "look", w = 1.5}, {node = "class_front", dur = 5, anim = "look", w = 1}, {node = "h2_n", dur = 3, anim = "look", w = 1}, {node = "range", dur = 4, anim = "look", w = 1}, {node = "sec", dur = 6, anim = "check", face = PI, w = 1.5},
	{node = "yard_fw", dur = 6, anim = "water", face = 0, w = 1.5}, {node = "yard_fe", dur = 5, anim = "look", w = 1}, {node = "back_c", dur = 5, anim = "look", w = 1}, {node = "back_e", dur = 4, anim = "idle", w = 1}, {node = "drive", dur = 4, anim = "look", w = 0.8}, {node = "flood_exit", dur = 3, anim = "look", w = 0.8}]
# ================= AI =================
# 家の中か（プレイヤー用）
func onNProperty(p) -> bool: return p.x > -20 and p.x < 20 and p.z > 6.2 and p.z < 48
func inNHouse(p: Vector3) -> bool: return (p.x > -10 and p.x < 10 and p.z > 14 and p.z < 32 and p.y > -3 and p.y < 6.5) or (p.x > -17 and p.x < -10 and p.z > 14 and p.z < 24 and p.y < 3.4)
func nodeY(n) -> float: return (3.47 if A.get("water") and A.water.frozen else 2.95) if n.pool else n.p.y
func nbSetPath(targetPos, nd = null) -> bool:
	var a = nearestNode(NB.p, true, 1.4); var b = nd if nd else nearestNode(targetPos, true, 1.6); var P = findPath(a, b)
	NB.path = P if P else []; NB.pi = 0; NB.climbed = -1; NB.goal = targetPos if targetPos != null else (b.p if b else null); NB.goalNode = b
	NB.goalOK = targetPos != null and b != null and los_clear(Vector3(b.p.x, b.p.y + 0.8, b.p.z), Vector3(targetPos.x, targetPos.y + 0.8, targetPos.z), nav_filt)
	return P != null
func nbTeleport(x: float, y: float, z: float, yaw: float) -> void:
	NB.p = Vector3(x, y, z); NB.yaw = yaw; NB.path = []; NB.climb = null; NB.jump = null; NB.sit = null; NB.speed = 0.0; NB.anim = "idle"
# 見えるか
func nbCanSee() -> bool:
	if PL.hide or not NB.visible: return false
	var ex: float = NB.p.x; var ey: float = NB.p.y + (1.4 if NB.sit else 1.82); var ez: float = NB.p.z
	var px: float = PL.p.x; var py: float = PL.p.y + PL.h * 0.8; var pz: float = PL.p.z
	var dx := px - ex; var dy := py - ey; var dz := pz - ez; var d := Vector3(dx, dy, dz).length()
	var range := 4.0 if NB.blindT > 0 else (13.0 if PL.crouch > 0.5 else 22.0)
	if d > range: return false
	var fa: float = NB.yaw + (NBM.head.rotation.y if NBM else 0.0); var fx := -sin(fa + PI); var fz := -cos(fa + PI)
	var dot := (dx * fx + dz * fz) / maxf(0.01, Vector2(dx, dz).length())
	if d > 2.2 and dot < (-0.2 if NB.state == "chase" else 0.28): return false
	var filt := func(b): return b.s != "trig" and b.s != "glass"
	if ray_cast(ex, ey, ez, dx / d, dy / d, dz / d, d - 0.3, filt) < d - 0.35: # 体のまん中も見る
		var py2: float = PL.p.y + PL.h * 0.45; var dy2 := py2 - ey; var d2 := Vector3(dx, dy2, dz).length()
		if ray_cast(ex, ey, ez, dx / d2, dy2 / d2, dz / d2, d2 - 0.3, filt) < d2 - 0.35: return false
	return true
# ---- 毎フレーム ----
var nbSeeAcc := 0.0
var nbVisionT := 0.0
func updNeighbor(dt: float) -> void:
	if not NBM: return
	if not NB.active:
		animNB(dt); return
	if NB.state == "script":
		if NB.script: NB.script.call(dt)
		animNB(dt); return
	if NB.state == "catch":
		updCatch(dt); animNB(dt); return
	NB.voiceT -= dt; NB.dt = dt; NB.blindT = maxf(0, NB.blindT - dt)
	# 見る
	nbVisionT -= dt
	if nbVisionT <= 0:
		nbVisionT = 0.1; var sees := nbCanSee(); var d: float = NB.p.distance_to(PL.p)
		if sees:
			nbSeeAcc += 0.1 * (6.0 if d < 5 else 3.0 if d < 10 else 1.4) * (0.6 if PL.crouch > 0.5 else 1.0)
			if NB.state == "chase" or nbSeeAcc >= 0.5:
				NB.lastSeen = PL.p; NB.seeT = GT
				if NB.state != "chase": startChase()
		else: nbSeeAcc = maxf(0, nbSeeAcc - 0.05)
	# 聞く
	for n in NOISES:
		if n.t <= NB.lastNoiseT: continue
		NB.lastNoiseT = maxf(NB.lastNoiseT, n.t)
		if NB.state == "chase": continue
		var d := Vector3(n.x - NB.p.x, n.y - NB.p.y, n.z - NB.p.z).length(); var r: float = n.r
		# 壁ごしは聞こえにくい
		if not los_clear(Vector3(NB.p.x, NB.p.y + 1.7, NB.p.z), Vector3(n.x, n.y + 0.3, n.z), bodyFilt): r *= 0.55
		if d < r and (n.kind != "step" or inNHouse(PL.p) or onNProperty(PL.p)): investigate(Vector3(n.x, n.y, n.z), n.kind)
	NOISES.clear()
	# 状態ごと
	if NB.state == "routine": updRoutine(dt)
	elif NB.state == "investigate": updInvestigate(dt)
	elif NB.state == "chase": updChase(dt)
	elif NB.state == "search": updSearch(dt)
	elif NB.state == "trap": updTrapTask(dt)
	# 捕まえる
	var dd := Vector2(PL.p.x - NB.p.x, PL.p.z - NB.p.z).length(); var dy: float = absf(PL.p.y - NB.p.y)
	if not PL.hide and NB.state == "chase" and dd < 1.15 and dy < 1.4 and not NB.climb and not NB.jump: startCatch()
	animNB(dt); updChaseMusic(dt)
func say(k: String) -> void:
	if NB.voiceT > 0: return
	NB.voiceT = 3.0; sfxVoice(k, NB.p)
func startChase() -> void:
	if NB.state == "chase": return
	NB.state = "chase"; setNbMode("attack"); NB.chaseT = 0.0; NB.chaseMax = 14 + RND() * 6; NB.sit = null; NB.path = []; NB.mode = "direct"; say("hey"); NB.giveUp = 0.0
	if story.get("onSpotted"): story.onSpotted.call()
func setNbMode(m: String) -> void:
	if NB.modeName == m: return
	NB.modeName = m
	if m == "attack": MUS.chaseTrack = 1 + int(RND() * 3)
func investigate(pos: Vector3, kind: String) -> void:
	if NB.state == "chase" or NB.state == "catch" or NB.state == "script": return
	if not inHouseArea(pos): return
	NB.state = "investigate"; setNbMode("hunt"); NB.inv = {pos = pos, kind = kind, t = 0.0, phase = "go", lt = 0.0}; NB.sit = null
	if not nbSetPath(pos): NB.path = []
	NB.speed = 0.0
	if kind == "glass" or kind == "alarm" or kind == "trap" or kind == "yell": say("hey")
	else: say("hmm")
func inHouseArea(p: Vector3) -> bool: return p.x > -22 and p.x < 22 and p.z > -1 and p.z < 42
# 道にそって進む（もどり値：着いたら true）
func followPath(dt: float, spd: float) -> bool:
	if NB.jump:
		var J = NB.jump; J.t += dt / 0.55; var t := minf(1, J.t); NB.p = J.a.lerp(J.b, t); NB.p.y += sin(t * PI) * 0.7
		if t >= 1:
			NB.jump = null; NB.pi += 1
		NB.anim = "walk"; NB.speed = 3.0; return false
	if NB.climb:
		var C = NB.climb; var dir := sgn(C.b.y - C.a.y); NB.p.y += dir * 2.1 * dt; NB.p.x = damp(NB.p.x, C.lx, 8, dt); NB.p.z = damp(NB.p.z, C.lz, 8, dt); NB.yaw = damp_ang(NB.yaw, C.yaw, 10, dt); NB.anim = "climb"; NB.speed = 0.0
		if RND() < dt * 3: sfx("ladderN")
		if (dir > 0 and NB.p.y >= C.b.y) or (dir < 0 and NB.p.y <= C.b.y):
			NB.p.y = C.b.y; NB.climb = null; NB.climbed = NB.pi
		return false
	if NB.doorWait > 0:
		NB.doorWait -= dt; NB.anim = "reach"; NB.speed = 0.0; return false
	var P: Array = NB.path
	if not P.size() or NB.pi >= P.size(): # 最後はまっすぐ目的の場所へ
		var Gl = NB.goal
		if Gl != null and NB.goalOK:
			var dx: float = Gl.x - NB.p.x; var dz: float = Gl.z - NB.p.z; var d := Vector2(dx, dz).length()
			if d > 0.4 and d < 9 and absf(Gl.y - NB.p.y) < 1:
				var st := minf(d, spd * dt); NB.p.x += dx / d * st; NB.p.z += dz / d * st; NB.yaw = damp_ang(NB.yaw, atan2(dx, dz), 10, dt); NB.anim = "run" if spd > 3.6 else "walk"; NB.speed = spd; return false
		return true
	var cur = P[NB.pi]; var prev = P[NB.pi - 1] if NB.pi > 0 else null; var e = edgeBetween(prev, cur) if prev else null
	# 特別な道
	if e and e.type == "j" and not NB.jump:
		NB.jump = {a = prev.p, b = cur.p, t = 0.0}; NB.yaw = atan2(-(cur.p.x - prev.p.x), -(cur.p.z - prev.p.z)); return false
	# エレベーター
	if e and (e.type == "ew" or e.type == "e"):
		var fl := 2 if prev.p.y > 2 else 1; var tf := 2 if cur.p.y > 2 else 1
		if e.type == "ew":
			var cabFl: int = (2 if cur.p.y > 2 else 1) if cur.id.begins_with("cab") else fl
			if not (ELEV.state == "idle" and ELEV.floor == cabFl):
				if ELEV.state == "idle": callElev(cabFl)
				NB.anim = "idle"; NB.speed = 0.0; return false
			ELEV.openT = maxf(ELEV.openT, 2)
		else:
			if ELEV.state == "idle" and ELEV.floor == fl:
				callElev(tf); NB.anim = "idle"; NB.speed = 0.0; NB.p.y = ELEV.y; return false
			if ELEV.state != "idle" or ELEV.floor != tf:
				NB.p.y = ELEV.y; NB.anim = "idle"; NB.speed = 0.0; return false
			NB.p.y = cur.p.y; NB.pi += 1; return false
	# ドア
	if e and e.type == "d":
		var dr = e.door.call()
		if dr and dr.m.tgt < 0.5:
			var dd := Vector2(dr.hx - NB.p.x, dr.hz - NB.p.z).length()
			if dd < 1.9:
				toggleDoor(dr, "npc", true); NB.doorWait = 0.45; return false
	var tx: float = cur.p.x; var tz: float = cur.p.z; var dx: float = tx - NB.p.x; var dz: float = tz - NB.p.z; var d := Vector2(dx, dz).length()
	if d < 0.25:
		NB.p.y = nodeY(cur); NB.pi += 1; return NB.pi >= P.size()
	var step := minf(d, spd * dt); NB.p.x += dx / d * step; NB.p.z += dz / d * step
	# 高さ（階段など）は道にそって
	if prev:
		var tot := Vector2(cur.p.x - prev.p.x, cur.p.z - prev.p.z).length()
		if tot == 0: tot = 1.0
		var f := 1 - clampf(Vector2(tx - NB.p.x, tz - NB.p.z).length() / tot, 0, 1); NB.p.y = lerpf(nodeY(prev), nodeY(cur), f)
	NB.yaw = damp_ang(NB.yaw, atan2(-dx, -dz) + PI, 10, dt); NB.anim = "run" if spd > 3.6 else "walk"; NB.speed = spd; return false
# ---- ふだんの暮らし ----
func pickTask() -> Dictionary:
	if A.get("camsOff") and A.get("camsCheckAt") and GT > A.camsCheckAt and story.part == "main":
		A.camsCheckAt = GT + 30; return TASK_CAMS
	if NB.goBoiler:
		NB.goBoiler = false
		for t in TASKS_A1:
			if t.get("boil"): return t
	var tot := 0.0
	for t in TASKS_A1:
		if not is_same(t, NB.task): tot += t.w
	var r := RND() * tot
	for t in TASKS_A1:
		if is_same(t, NB.task): continue
		r -= t.w
		if r <= 0: return t
	return TASKS_A1[0]
func updRoutine(dt: float) -> void:
	if not NB.task:
		var t := pickTask()
		if NB.state != "routine": return
		NB.task = t; NB.taskT = 0.0; NB.sit = null
		if not nbSetPath(null, NODES[t.node]):
			NB.task = null; return
	var T = NB.task
	if NB.pi < NB.path.size():
		followPath(dt, 1.75); return
	# 着いた
	if T.get("sit") and not NB.sit:
		NB.sit = T.sit; NB.p.x = T.sit.x; NB.p.z = T.sit.z; NB.yaw = T.sit.yaw
	if T.get("face") != null: NB.yaw = damp_ang(NB.yaw, T.face, 4, dt)
	NB.anim = T.anim; NB.speed = 0.0; NB.taskT += dt
	if NB.taskT > T.dur:
		if T.get("camsOn") and A.get("camsOff"): setCamsOff(false, "nb")
		if NB.sit:
			var n = NODES[T.node]; NB.p.x = n.p.x; NB.p.z = n.p.z; NB.sit = null
		NB.task = null; NB.routineN += 1
# ---- 物音を調べる ----
func updInvestigate(dt: float) -> void:
	var I = NB.inv; I.t += dt
	if NB.hideTarget:
		checkHide(NB.hideTarget); return
	if I.phase == "go":
		var done := followPath(dt, 2.6); var d := Vector2(I.pos.x - NB.p.x, I.pos.z - NB.p.z).length()
		if done or d < 1.2 or I.t > 25:
			I.phase = "look"; I.lt = 0.0
			# 何の音だったか
			if I.kind == "alarm":
				for pr in ALARMS:
					if pr.p.distance_to(NB.p) < 3: pr.data.t = -7.0
		return
	if I.phase == "look":
		I.lt += dt; NB.anim = "look"; NB.speed = 0.0
		if I.lt > 3: # 近くのクローゼットをのぞくことがある
			var h = null
			for hh in HIDES:
				if hh.nb and Vector2(hh.out.x - NB.p.x, hh.out.z - NB.p.z).length() < 5 and absf(hh.out.y - NB.p.y) < 1.5 and (not is_same(hh, PL.hide) or is_same(NB.sawHide, hh)):
					h = hh; break
			if h and RND() < 0.35:
				checkHide(h); return
			backToRoutine()
func backToRoutine() -> void:
	if NB.state == "investigate" or NB.state == "search": NB.goBoiler = true
	NB.state = "routine"; NB.task = null; NB.path = []; NB.inv = null; NB.hideTarget = null; setNbMode("idle")
# ---- 追いかける ----
func updChase(dt: float) -> void:
	NB.chaseT += dt; var d0 := Vector2(PL.p.x - NB.p.x, PL.p.z - NB.p.z).length()
	# 見えなくなってすぐ（1.2秒）は、曲がり角の先までついてくる。そのあとは最後に見た所へ
	var since: float = GT - NB.seeT
	if not PL.hide and since < 1.2 and d0 < 20: NB.lastSeen = PL.p
	# 長く追いかけるとつかれて見失う（すぐ目の前にいるときは別）
	if NB.chaseT > NB.chaseMax and d0 > 2.2:
		say("grr"); NB.blindT = 6.0; lostPlayer(); return
	# 隠れるところを近くで見られたときだけ、そこを開けにくる
	if PL.hide and is_same(NB.sawHide, PL.hide) and not NB.hideTarget: NB.hideTarget = PL.hide
	if NB.hideTarget:
		checkHide(NB.hideTarget); return
	if since > 1.2:
		var dl := Vector2(NB.lastSeen.x - NB.p.x, NB.lastSeen.z - NB.p.z).length()
		if dl < 1.1 or since > 9:
			say("grr"); lostPlayer(); return
	var lead := 0.5 if since < 1.2 else 0.0; var tgt := Vector3(NB.lastSeen.x + PL.v.x * lead, NB.lastSeen.y, NB.lastSeen.z + PL.v.z * lead)
	var dx: float = tgt.x - NB.p.x; var dz: float = tgt.z - NB.p.z; var d := Vector2(dx, dz).length(); var dy: float = tgt.y - NB.p.y; var sp := 3.15
	var direct: bool = absf(dy) < 1.1 and d < 14 and not NB.climb and not NB.jump and los_clear(Vector3(NB.p.x, NB.p.y + 1, NB.p.z), Vector3(PL.p.x, PL.p.y + 1, PL.p.z), nav_filt) and NB.mode != "path"
	if direct:
		NB.path = []; var mx := dx / d * minf(d, sp * dt); var mz := dz / d * minf(d, sp * dt); var ox: float = NB.p.x; var oz: float = NB.p.z
		var nf := func(b): return b.s != "trig" and not (b.ref is Dictionary and b.ref.has("type") and b.ref.has("d"))
		NB.p = move_body(NB.p, NBR, NBH, NBR, 0, -0.3, 0, null, nf); var gy: float = NB.p.y; NB.p = move_body(NB.p, NBR, NBH, NBR, mx, 0, mz, null, nf)
		if HIT.x or HIT.z:
			var hb = HIT.box
			if hb != null and hb.ref is Dictionary and hb.ref.has("m") and hb.ref.has("o") and hb.ref.m.tgt < 0.5:
				toggleDoor(hb.ref, "npc", true); NB.doorWait = 0.4
			var p2 := move_body(Vector3(ox, gy, oz), NBR, NBH, NBR, 0, 0.46, 0, null, nf); p2 = move_body(p2, NBR, NBH, NBR, mx, 0, mz, null, nf); p2 = move_body(p2, NBR, NBH, NBR, 0, -0.5, 0, null, nf)
			if Vector2(p2.x - ox, p2.z - oz).length() > Vector2(NB.p.x - ox, NB.p.z - oz).length() + 0.01: NB.p = p2
		var moved := Vector2(NB.p.x - ox, NB.p.z - oz).length()
		if moved < sp * dt * 0.3: NB.stuck += dt
		else: NB.stuck = 0.0
		NB.yaw = damp_ang(NB.yaw, atan2(dx, dz), 12, dt); NB.anim = "run"; NB.speed = sp
		if NB.stuck > 0.6:
			NB.stuck = 0.0; NB.mode = "path"; NB.modeT = GT; nbSetPath(tgt)
	else:
		if NB.mode == "path" and GT - NB.modeT > 2.5: NB.mode = "direct"
		if not NB.path.size() or NB.pi >= NB.path.size() or GT - NB.pathT > 1:
			nbSetPath(tgt); NB.pathT = GT
		followPath(dt, sp)
# 部屋の区切り（おとなりさんの家）。[名前, x0,x1, z0,z1, y0,y1]
const ROOMS := [["elev", 2, 4.2, 19, 21.4, -1, 7],
	# 1階
	["hall1", -2, 2, 14, 32, -1, 3.3], ["living", -10, -2, 14, 22, -1, 3.3], ["garage", -17, -10, 14, 24, -1, 3.3], ["kitchen", 2, 10, 14, 21.4, -1, 3.3], ["pantry", 2, 6, 21.4, 26, -1, 3.3], ["bed1", 6, 10, 21.4, 26, -1, 3.3],
	["grave", -7, -2, 22, 27, -1.5, 2.85], ["basestair", -10, -7, 22, 27, -1.5, 2.85], ["dining", -10, -2, 27, 32, -1, 2.85], ["boiler", 2, 6, 26, 32, -1, 3.3], ["bath1", 6, 10, 26, 32, -1, 3.3],
	# 2階
	["flood", -10, -2, 22, 32, 2.85, 6.5], ["stair2", -10, -2, 20.85, 22, 3.3, 6.5], ["liv2", -7, -2, 14, 20.85, 3.3, 6.5], ["ante", -10, -7, 17.5, 20.85, 3.3, 6.5], ["security", -10, -7, 14, 17.5, 3.3, 6.5],
	["hall2", -2, 2, 14, 32, 3.3, 6.5], ["class", 2, 10, 14, 19, 3.3, 6.5], ["corr", 4.2, 10, 19, 21.4, 3.3, 6.5], ["range", 2, 6, 21.4, 27, 3.3, 6.5], ["bath2", 6, 10, 21.4, 27, 3.3, 6.5], ["storage", 2, 6, 27, 32, 3.3, 6.5], ["kids", 6, 10, 27, 32, 3.3, 6.5]]
func roomAt(x: float, y: float, z: float) -> String:
	for r in ROOMS:
		if x >= r[1] and x < r[2] and z >= r[3] and z < r[4] and y >= r[5] and y < r[6]: return r[0]
	return ""
# 隠れた瞬間に、おとなりさんが同じ部屋にいたら見つかる（そこを開けにくる）
func nbNoteHide(h: Dictionary) -> void:
	NB.sawHide = null
	if not NB.active or NB.state == "script" or NB.state == "catch" or not NB.visible: return
	var rh := roomAt(h.out.x, h.out.y + 0.1, h.out.z); var rn := roomAt(NB.p.x, NB.p.y + 0.1, NB.p.z)
	if not rh or rh != rn: return
	NB.sawHide = h; NB.sit = null; NB.task = null; NB.path = []; NB.goalHide = null; NB.hideTarget = h
	if NB.state != "chase":
		NB.state = "investigate"; NB.inv = {pos = Vector3(h.out.x, h.out.y, h.out.z), kind = "hide", t = 0.0, phase = "go", lt = 0.0}; setNbMode("hunt")
	say("hmm")
func lostPlayer() -> void:
	NB.state = "search"; NB.searchT = 0.0; NB.path = []; NB.hideTarget = null; setNbMode("hunt")
func updSearch(dt: float) -> void:
	NB.searchT += dt; NB.anim = "look"; NB.speed = 0.0
	if NB.searchT > 3.5: backToRoutine()
# 隠れ場所を開ける
func checkHide(h: Dictionary) -> void:
	if NB.state != "chase" and NB.state != "investigate": NB.state = "investigate"
	NB.hideTarget = h; var d := Vector2(h.out.x - NB.p.x, h.out.z - NB.p.z).length()
	if d > 1.1 or absf(h.out.y - NB.p.y) > 1.2:
		if not NB.path.size() or NB.pi >= NB.path.size() or not is_same(NB.goalHide, h):
			nbSetPath(Vector3(h.out.x, h.out.y, h.out.z)); NB.goalHide = h
		var done := followPath(NB.dt if NB.dt else 0.016, 3.15 if NB.state == "chase" else 2.6)
		if not done: return
		if Vector2(h.out.x - NB.p.x, h.out.z - NB.p.z).length() > 1.3:
			var dx: float = h.out.x - NB.p.x; var dz: float = h.out.z - NB.p.z; var dd := Vector2(dx, dz).length(); var ee: float = NB.dt if NB.dt else 1.0 / 60
			NB.p.x += dx / dd * minf(dd, 3 * ee); NB.p.z += dz / dd * minf(dd, 3 * ee); return
	# 開ける
	NB.goalHide = null; NB.hideTarget = null
	if h.cab:
		for L in h.cab.leaves: L.m.tgt = 1.0
	sfx("cab", true); NB.yaw = h.yaw + PI
	if is_same(PL.hide, h): startCatch(true)
	else:
		later(0.9, func():
			if h.cab and not is_same(PL.hide, h):
				for L in h.cab.leaves: L.m.tgt = 0.0)
		NB.state = "search"; NB.searchT = 1.5
# ---- つかまえる ----
func startCatch(fromHide := false) -> void:
	if NB.state == "catch": return
	NB.state = "catch"; NB.catchT = 0.0; NB.anim = "grab"; NB.speed = 0.0; PL.frozen = true
	if fromHide: exitHideForCatch()
	say("gotcha"); sfx("catch")
	if story.get("onCaughtStart"): story.onCaughtStart.call()
func exitHideForCatch() -> void:
	var h = PL.hide
	if not h: return
	PL.hide = null; ui_cls("hideView", "on", false); teleportPlayer(h.out.x - sin(h.yaw) * 0.1, h.out.y, h.out.z - cos(h.yaw) * 0.1, h.yaw + PI); PL.frozen = true
func updCatch(dt: float) -> void:
	NB.catchT += dt; var t: float = NB.catchT # プレイヤーの方へ
	var dx: float = PL.p.x - NB.p.x; var dz: float = PL.p.z - NB.p.z; var d := Vector2(dx, dz).length(); NB.yaw = damp_ang(NB.yaw, atan2(-dx, -dz) + PI, 12, dt)
	if d > 0.9:
		NB.p.x += dx / d * minf(d - 0.9, 4 * dt); NB.p.z += dz / d * minf(d - 0.9, 4 * dt)
	# カメラをおとなりさんの顔に向ける
	var hx: float = NB.p.x; var hy: float = NB.p.y + 1.8; var hz: float = NB.p.z; var c := camPos()
	var ty := atan2(-(hx - c.x), -(hz - c.z)); var tp := atan2(hy - c.y, Vector2(hx - c.x, hz - c.z).length()); PL.yaw = damp_ang(PL.yaw, ty, 8, dt); PL.pitch = damp(PL.pitch, tp, 8, dt)
	NB.anim = "grab"
	if t > 1.3 and not NB.caughtDone:
		NB.caughtDone = true; story.caught.call()
func resetNeighborAfterCatch() -> void:
	NB.caughtDone = false; NB.sawHide = null; NB.blindT = 0.0; NB.state = "routine"; setNbMode("idle"); NB.task = null; NB.path = []; NB.hideTarget = null; NB.inv = null; nbSeeAcc = 0.0
	var n = NODES.hall_m; nbTeleport(n.p.x, n.p.y, n.p.z, 0)
# ================= 学習：罠・カメラ・板 =================
var TRAPS := []
var CAMS := []
# アルファ1：入ってきた所を覚えて、つかまえたあと「いす」でふさぐ（窓の下にはトラバサミ）
var ENTRY := {front = {box = [-1.2, 0, 13.5, 1.2, 2.7, 14.6], chair = [0, 0.3, 15.2, PI], doors = func(): return A.front}, back = {box = [3.4, 0, 31.4, 4.6, 2.6, 32.6], chair = [4, 0.3, 31.1, 0], doors = func(): return [A.back]},
	garageSide = {box = [-17.5, 0, 19.9, -16.5, 2.4, 21.1], chair = [-16.3, 0.1, 20.5, -PI / 2], doors = func(): return [A.garageSide]},
	winLiv = {box = [-8.6, 0.9, 13.5, -5.9, 2.4, 14.6], trap = [-7.2, 0.3, 14.8]}, winLiv2 = {box = [-5.1, 0.9, 13.5, -2.9, 2.4, 14.6], trap = [-4, 0.3, 14.8]}, winKit = {box = [3.9, 0.9, 13.5, 6.1, 2.4, 14.6], trap = [5, 0.3, 15.3]}, winKit2 = {box = [7.1, 0.9, 13.5, 9.3, 2.4, 14.6], trap = [8.2, 0.3, 15.3]},
	winKitE = {box = [9.5, 0.9, 15.9, 10.6, 2.4, 18.1], trap = [8.7, 0.3, 17]}, winBedE = {box = [9.5, 0.9, 22.7, 10.6, 2.4, 24.7], trap = [9.3, 0.3, 25.2]}, winDinN = {box = [-8.1, 0.9, 31.4, -4.9, 2.3, 32.6], trap = [-6.5, 0.3, 31.4]}, winDinW = {box = [-10.6, 0.9, 28.4, -9.5, 2.3, 30.6], trap = [-9.3, 0.3, 29.5]}}
var LEARN := {}
var lastEntry = null
var lastEntryT := -9.0
var wasInside := false
func updLearning(dt: float) -> void:
	if not NB.active: return
	var p: Vector3 = PL.p
	for k in ENTRY:
		var b: Array = ENTRY[k].box
		if p.x > b[0] and p.x < b[3] and p.y + 0.5 > b[1] and p.y < b[4] and p.z > b[2] and p.z < b[5]:
			lastEntry = k; lastEntryT = GT
	var ins := inNHouse(p)
	if ins and not wasInside and lastEntry and GT - lastEntryT < 3:
		LEARN[lastEntry] = LEARN.get(lastEntry, 0) + 1; story.usedEntry = lastEntry
	wasInside = ins
	# トラバサミ
	for T in TRAPS:
		if not T.armed: continue
		if Vector2(p.x - T.x, p.z - T.z).length() < 0.38 and absf(p.y - T.y) < 0.3 and not PL.climb: snapTrap(T, true)
	# 監視カメラ（電気が入っているときだけ）
	if not A.get("power") or not A.power.on or A.get("camsOff"): return
	for C in CAMS:
		if C.broken or C.k == "carn": continue
		C.cool -= dt
		if C.cool > 0: continue
		var dx: float = p.x - C.x; var dy: float = p.y + 1.2 - C.y; var dz: float = p.z - C.z; var d := Vector3(dx, dy, dz).length()
		if d > 13 or PL.hide: continue
		var dot: float = (dx * C.dx + dy * C.dy + dz * C.dz) / d
		if dot < 0.74: continue
		if ray_cast(C.x, C.y, C.z, dx / d, dy / d, dz / d, d - 0.2, func(b): return b.s != "trig" and b.s != "glass") < d - 0.25: continue
		C.cool = 6.0; sfx("alarm"); ui_cls("alarm", "on", true); later(1.8, func(): ui_cls("alarm", "on", false)); NB.lastSeen = p
		if NB.state != "chase" and NB.state != "catch" and NB.active and NB.state != "script":
			NB.state = "investigate"; setNbMode("hunt"); NB.inv = {pos = p, kind = "alarm", t = 0.0, phase = "go", lt = 0.0}; nbSetPath(p); say("hmm")
# つかまえたあと：最後に入ってきた所をふさぐ
func learnFromCatch():
	var k = story.usedEntry
	if not k: return null
	var E: Dictionary = ENTRY[k]; story.usedEntry = null
	if E.get("chair"):
		for d in E.doors.call(): d.m.tgt = 0.0
		if E.get("chairProp") and E.chairProp.st != "gone": propRestAt(E.chairProp, E.chair[0], E.chair[1], E.chair[2], E.chair[3])
		else: E.chairProp = spawnProp("chair", E.chair[0], E.chair[1], E.chair[2], E.chair[3], {id = "bchair_" + k})
		if not E.get("blk"):
			E.blk = true
			for d in E.doors.call():
				var dd = d
				d.blockers.append(func():
					var c = E.get("chairProp")
					if c and c.st == "rest" and Vector2(c.p.x - E.chair[0], c.p.z - E.chair[2]).length() < 0.8 and not doorInside(dd, PL.p.x, PL.p.z): return "何かが中でつっかえていて開かない"
					return null)
		return "chair"
	if E.get("trap"):
		for t in TRAPS:
			if t.k == k: return null
		addBearTrap(E.trap[0], E.trap[1], E.trap[2], k); return "trap"
	return null
func updTrapTask(dt: float) -> void:
	if NB.pi < NB.path.size():
		followPath(dt, 2.4); return
	NB.tt += dt; NB.anim = "work" if NB.tq.kind == "cam" else "crouch"; NB.speed = 0.0
	if RND() < dt * 4: sfx("hammer", 0.5)
	if NB.tt > 2.2:
		placeTrapNow(NB.tq); NB.trapQ.pop_front(); backToRoutine()
func placeTrapNow(q: Dictionary) -> void:
	if q.kind == "repair":
		var C = q.cam; C.broken = false; C.led.visible = true; C.g.rotate_object_local(Vector3.RIGHT, -0.6); return
	if q.kind == "board":
		boardWindow(q.win, true); sfx("hammer")
	elif q.kind == "trap": addBearTrap(q.pos[0], q.pos[1], q.pos[2], q.k)
	elif q.kind == "cam": addCamera(q.cam, q.k)
func placeAllPendingTraps() -> void: NB.trapQ.clear()
func addBearTrap(x: float, y: float, z: float, k) -> Dictionary:
	var g := Node3D.new(); var mb := MB.new(); mb.cyl(0, 0, 0, 0.26, 0.02, MATS.metal_dark, 16); mb.box(-0.04, 0.02, -0.04, 0.04, 0.05, 0.04, MATS.metal); g.add_child(mb.build())
	var jaw := func(s: float) -> Node3D:
		var j := Node3D.new(); var jm := MB.new()
		for i in 7:
			var a := i / 6.0 * PI; jm.box(cos(a) * 0.24 - 0.015, 0, sin(a) * 0.24 * s - 0.015, cos(a) * 0.24 + 0.015, 0.09, sin(a) * 0.24 * s + 0.015, MATS.metal)
		j.add_child(jm.build()); g.add_child(j)
		return j
	var j1: Node3D = jaw.call(1); var j2: Node3D = jaw.call(-1); g.position = Vector3(x, y + 0.005, z); scene.add_child(g)
	var T := {x = x, y = y, z = z, k = k, g = g, j1 = j1, j2 = j2, armed = true}; j1.rotation.x = -1.3; j2.rotation.x = 1.3; TRAPS.append(T)
	return T
func snapTrap(T: Dictionary, player: bool) -> void:
	T.armed = false; T.j1.rotation.x = -0.05; T.j2.rotation.x = 0.05; sfx("trap"); noise(T.x, T.y, T.z, 24, "trap")
	if player:
		PL.stuck = 3.2; PL.v = Vector3(); ui_cls("trapFx", "on", true); toast("トラバサミだ！ 動けない！"); sfx("hurt")
		if story.get("onTrap"): story.onTrap.call()
func addCamera(c: Array, k) -> Dictionary:
	var x: float = c[0]; var y: float = c[1]; var z: float = c[2]; var tx: float = c[3]; var ty: float = c[4]; var tz: float = c[5]
	var g := Node3D.new(); var mb := MB.new(); mb.box(-0.07, -0.07, -0.18, 0.07, 0.07, 0.12, MATS.fridge); mb.cyl(0, 0, 0.14, 0.045, 0.05, MATS.black, 10, null, "z"); mb.box(-0.02, -0.02, -0.3, 0.02, 0.02, -0.18, MATS.dgrey); g.add_child(mb.build())
	var led := mesh(G.sphere(0.018, 6, 4), std_mat({color = "#ff2010", emissive = "#ff1000", ei = 3})); led.position = Vector3(0.04, 0.05, 0.1); g.add_child(led)
	scene.add_child(g); g.position = Vector3(x, y, z)
	# three.js の lookAt（物は +Z を向ける）と同じ向き
	var fwd := Vector3(tx - x, ty - y, tz - z).normalized()
	g.basis = Basis.looking_at(-fwd, Vector3.UP if absf(fwd.y) < 0.99 else Vector3.FORWARD)
	var d := Vector3(tx - x, ty - y, tz - z).length()
	var C := {x = x, y = y, z = z, dx = (tx - x) / d, dy = (ty - y) / d, dz = (tz - z) / d, g = g, led = led, broken = false, cool = 0.0, k = k, box = Box.new(x - 0.2, y - 0.2, z - 0.2, x + 0.2, y + 0.2, z + 0.2)}
	CAMS.append(C)
	return C
func breakCamera(C: Dictionary) -> void:
	if C.broken: return
	C.broken = true; C.led.visible = false; updCamLeds(); C.g.rotate_object_local(Vector3.RIGHT, 0.6); sfx("spark")
	for i in 14: part("a", C.x, C.y, C.z, rr(-2, 2), rr(0, 2), rr(-2, 2), 0.5, 0.04, "#ffd060", 1, 9)
	noise(C.x, C.y, C.z, 14, "impact")
	later(15.0, func():
		if C.broken and NB.active: NB.repairQ.append(C))
# 投げた物がおとなりさん・カメラ・トラバサミに当たったか
func nbPropHit(pr, hx: float, hz: float) -> bool:
	for C in CAMS:
		if C.broken: continue
		var b: Box = C.box
		if pr.p.x + hx > b.x0 and pr.p.x - hx < b.x1 and pr.p.y + pr.d.h > b.y0 and pr.p.y < b.y1 and pr.p.z + hz > b.z0 and pr.p.z - hz < b.z1:
			breakCamera(C); pr.v *= -0.3; return false
	for T in TRAPS:
		if T.armed and Vector2(pr.p.x - T.x, pr.p.z - T.z).length() < 0.35 and absf(pr.p.y - T.y) < 0.25:
			snapTrap(T, false); return false
	if NB.active and NB.visible and NBM and pr.v.length() > 4:
		var dx: float = pr.p.x - NB.p.x; var dz: float = pr.p.z - NB.p.z
		if Vector2(dx, dz).length() < 0.45 and pr.p.y > NB.p.y and pr.p.y < NB.p.y + 2.05:
			pr.v = Vector3(-pr.v.x * 0.2, 1, -pr.v.z * 0.2); sfx("bonk"); say("ow")
			if NB.state != "chase" and NB.state != "catch" and NB.state != "script":
				NB.lastSeen = PL.p; NB.seeT = GT; startChase()
			return false
	return false
# ---- 姿を見せる・かくす ----
func nbVisible(v: bool) -> void:
	NB.visible = v
	if NBM: NBM.root.visible = v
