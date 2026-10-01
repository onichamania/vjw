
# ================= お話（アルファ1）=================
# イントロ（車で到着・双眼鏡）→ 引っ越し（電気・赤い鍵・箱・昼寝）→ 地下室の場面（夢）→ 本編 → エンディング（棺）
var P := {}
var story := {part = "", step = 0, flags = {}, stats = {time = 0.0, caught = 0, sleeps = 0}, usedEntry = null, obj = "", gen = 0, ht = [], boxN = -1, nearT = 0.0, inCarn = false,
	canSleep = null, sleepMsg = null, sleep = null, caught = null}
var CUT := {on = false, cam = null, skip = false}
# ---- 待つ（ゲームの時間で）----
class Waiter extends RefCounted:
	signal done
	var t := 0.0
	var fn = null
var WAITS := []
func wait(s: float) -> Signal:
	var w := Waiter.new(); w.t = GT + s; WAITS.append(w)
	return w.done
func after(s: float, fn: Callable) -> void:
	var w := Waiter.new(); w.t = GT + s; w.fn = fn; WAITS.append(w)
# JS の setTimeout（本当の時間で）
# テストで手動で進めているときは、進めた時間で数える
var LATERS := []
var RT := 0.0
func later(s: float, fn: Callable) -> void:
	if MANUAL: LATERS.append([RT + s, fn])
	else: get_tree().create_timer(s, true).timeout.connect(fn)
func updLaters(dt: float) -> void:
	RT += dt
	var i := 0
	while i < LATERS.size():
		if RT >= LATERS[i][0]:
			var f: Callable = LATERS[i][1]; LATERS.remove_at(i); f.call()
		else: i += 1
func updWaits() -> void:
	var i := WAITS.size() - 1
	while i >= 0:
		if i < WAITS.size() and (GT >= WAITS[i].t or CUT.skip):
			var w = WAITS[i]; WAITS.remove_at(i)
			if w.fn: w.fn.call()
			else: w.done.emit()
		i -= 1
# ---- カットシーン ----
func cutStart(skippable := true) -> void:
	CUT.on = true; CUT.skip = false; STATE = "cut"; ui_body("cut", true); ui_cls("skipCut", "on", skippable); ui_prompt(""); unlockPointer()
func cutEnd() -> void:
	CUT.on = false; CUT.cam = null; CUT.skip = false; STATE = "play"; ui_body("cut", false); ui_cls("skipCut", "on", false); lockPointer()
func camTo(px: float, py: float, pz: float, lx: float, ly: float, lz: float, snap := false) -> void:
	CUT.cam = {p = Vector3(px, py, pz), l = Vector3(lx, ly, lz), k = 3.0}
	if snap:
		camera.position = CUT.cam.p; camera.look_at(CUT.cam.l)
func updCutCam(dt: float) -> void:
	if not CUT.cam: return
	camera.position = camera.position.lerp(CUT.cam.p, 1 - exp(-CUT.cam.k * dt))
	if camera.position.distance_to(CUT.cam.l) < 0.001: return
	var want := Transform3D().looking_at(CUT.cam.l - camera.position, Vector3.UP).basis.get_rotation_quaternion()
	var q := camera.quaternion.slerp(want, 1 - exp(-4 * dt))
	camera.quaternion = q
# ================= 物を置く =================
func placeA1Props() -> void:
	# --- 自分の庭（引っ越し）---
	P.keyRed = spawnProp("key_red", -4.4, 0.02, -13.2, 0.4, {id = "key_red"})
	P.boxes = []
	for q in [[-2.6, -13.4, 0, 0.1], [-2, -12.8, 0, -0.2], [-2.9, -12.6, 0, 0.3], [-2.4, -13, 0.42, 0], [-1.4, -13.6, 0, 0.5]]: P.boxes.append(spawnProp("box", q[0], q[2], q[1], q[3], {id = "mbox%d" % P.boxes.size()}))
	spawnProp("broom", -1.2, 0, -12.3, 0.4); spawnProp("radio", -3.4, 0.42, -12.8, 0.2); P.binoc = spawnProp("binoculars", -3.6, 0, -14.2, 1, {id = "binoc"}); spawnProp("chair", 4, 0, -14.5, -0.4); spawnProp("suitcase", 3.4, 0, -13.2, 0.3)
	P.flash = spawnProp("flashlight", 5.3, 0.9, -22.8, 0, {id = "flash"})
	# --- おとなりさんの前庭のがらくた（窓を割るのに使う）---
	for q in [["tire", -4, 11.5], ["can", 3, 11], ["bottle", -6.5, 12], ["ball", 8, 10.8], ["can", -8.5, 10.4], ["trashcan", 10.6, 12.8], ["tire", 12.2, 12.6], ["can", 9.3, 11.8]]: spawnProp(q[0], q[1], 0, q[2], rr(0, 3))
	# --- 大事な物 ---
	P.hammer = spawnProp("hammer", -16.3, 1.01, 16.5, 0.4, {id = "hammer"}); P.hammer2 = spawnProp("hammer", 0, 0, 0, 0, {id = "hammer2", att = A.nstand.dr, lp = Vector3(0, 0.04, -0.2)})
	P.crowbar = spawnProp("crowbar", 8.7, F1 + 0.02, 24.3, PI / 2, {id = "crowbar"}); setPropHidden(P.crowbar, true)
	P.lockpick = spawnProp("lockpick", -8.3, F2 + 0.78, 14.5, 0.3, {id = "lockpick"})
	P.bell = spawnProp("bell", 0, 0, 0, 0, {id = "bell", att = A.floodDrawer, lp = Vector3(0, 0.04, -0.2)}); P.bell2 = spawnProp("bell", 9.5, F2 + 0.87, 22.3, 0, {id = "bell2"})
	P.shovel = spawnProp("shovel", -6.74, F1 + 0.44, 23.7, 0, {id = "shovel", noPick = true})
	P.teacher = spawnProp("mannequin", -4.5, -0.67, 25.3, 0, {id = "teacher", noPick = true}); P.teacher.lying = true; refreshSolid(P.teacher); placeProp(P.teacher)
	P.jack = spawnProp("jackhammer", 6.6, F2, 22.2, 0.3, {id = "jack"}); P.ckey = spawnProp("copperkey", 8, F2 + 0.46, 29.8, 0.5, {id = "ckey"})
	P.rifle = spawnProp("toyrifle", 8.55, F2 + 0.78, 16.5, PI / 2, {id = "rifle", noPick = true}); setPropHidden(P.rifle, true)
	P.skey = spawnProp("silverkey", 2.35, F2, 21.75, 0, {id = "skey", noPick = true}); setPropHidden(P.skey, true)
	# 数字のマグネット（先生の机の上と引き出し）
	P.mags = []
	var put := func(ch: String, x: float, y: float, z: float, att = null, lp = Vector3()) -> void:
		var pr: Dictionary
		if att: pr = spawnProp("mag_" + ch, 0, 0, 0, 0, {id = "mag%d" % P.mags.size(), att = att, lp = lp})
		else: pr = spawnProp("mag_" + ch, x, y, z, rr(-0.4, 0.4), {id = "mag%d" % P.mags.size()})
		P.mags.append(pr)
	put.call("5", 8.45, F2 + 0.78, 16.1); put.call("A", 8.6, F2 + 0.78, 16.9); put.call("F", 8.4, F2 + 0.78, 17.1); put.call("2", 8.7, F2 + 0.78, 15.9); put.call("3", 0, 0, 0, A.tdraw[0], Vector3(-0.1, 0.04, -0.2)); put.call("1", 0, 0, 0, A.tdraw[0], Vector3(0.1, 0.04, -0.25)); put.call("8", 0, 0, 0, A.tdraw[1], Vector3(0, 0.04, -0.2)); put.call("7", 0, 0, 0, A.tdraw[1], Vector3(0.12, 0.04, -0.3)); put.call("9", 3.4, F2 + 0.72, 15.2)
	# 目覚まし時計・バナナ・トラバサミ
	for q in [[-8.4, F2 + 0.9, 20.1], [9, F1 + 0.6, 22.3], [3, F1 + 0.9, 25.5], [-9.4, F1 + 0.9, 29]]: spawnProp("alarm", q[0], q[1], q[2], rr(0, 3))
	for q in [[6.4, 18.3], [5.9, 18.4], [6.8, 18.1]]: spawnProp("banana", q[0], F1 + 0.78, q[1], rr(0, 3))
	spawnProp("banana", 0.3, F1, 26.8, 1); spawnProp("banana", -4, F2, 24.8, 0)
	addBearTrap(-0.6, F1, 27.8, "pre1"); addBearTrap(-7, F2, 15.7, "pre2"); addBearTrap(4.8, F2, 15.3, "pre3")
	# 小物
	var deco := [["cup", 9.5, 1.2, 15.2], ["plate", 9.5, 1.2, 15.6], ["pot", 6.6, 1.22, 14.5], ["bottle", 9.5, 1.2, 19.6], ["plate", 6.4, 1.08, 18.1], ["cup", 5.8, 1.08, 18.5], ["book", -7.9, 0.72, 19.2], ["vase", 1.5, 1.2, 14.7], ["can", 3.5, 1.12, 25.6], ["can", 4.5, 1.12, 25.6], ["bottle", 4, 1.52, 25.6],
		["plate", -6.8, 1.08, 29.5], ["plate", -5.2, 1.08, 29.5], ["cup", -6, 1.08, 29.2], ["book", -4.6, F2 + 0.6, 15.2], ["clock", -9.5, F2 + 0.6, 16.8], ["duck", 9.3, F2 + 0.6, 25.8], ["ball", 8.8, F2, 31], ["can", -12, 0.1, 22], ["bottle", -16.2, 1.01, 17.2], ["can", 4.8, F2 + 0.9, 31.5], ["tire", -14, 0.1, 22.5]]
	for q in deco: spawnProp(q[0], q[1], q[2], q[3], rr(-0.3, 0.3))
	for q in [[5.6, 18.3, PI / 2], [6.8, 18.3, -PI / 2]]: spawnProp("chair", q[0], F1, q[1], q[2])
	# 墓の部屋の中のいす（2つのドアをふさぐ）
	P.gchair1 = spawnProp("chair", -5.8, F1, 26.4, 0, {id = "gch1"}); P.gchair2 = spawnProp("chair", -3.3, F1, 26.4, 0, {id = "gch2"})
	var gb := func(pr: Dictionary, x: float) -> Callable:
		return func():
			if pr.st == "rest" and Vector2(pr.p.x - x, pr.p.z - 26.4).length() < 0.7 and PL.p.z > 27: return "何かが中でつっかえていて開かない"
			return null
	A.gdin1.blockers.append(gb.call(P.gchair1, -5.8)); A.gdin2.blockers.append(gb.call(P.gchair2, -3.3))
# ================= いろいろ =================
func setPropHot(_pr, _on) -> void: pass
func toggleSuitcase(_pr) -> void: pass
func setup_story_hooks() -> void:
	story.canSleep = func(): return story.step >= 3 if story.part == "move" else story.part == "main"
	story.sleepMsg = func(): return "まだやることがある" if story.part == "move" else ""
	story.sleep = func():
		if story.part == "move": napIntro()
		elif story.part == "main": napMain()
	story.onPower = func():
		if story.part == "move" and story.step == 0:
			toast("家に電気が通った！"); nextStep()
	story.onPick = func(pr):
		if story.part == "move":
			if is_same(pr, P.keyRed) and story.step == 1: toast("鍵を持って、玄関のドアに左クリック")
		if story.part == "main":
			var m := {lockpick = "ピッキング道具を手に入れた！", hammer = "ハンマーを手に入れた", hammer2 = "ハンマーを手に入れた", crowbar = "バールを手に入れた", bell = "ベルを手に入れた", bell2 = "ベルを手に入れた", shovel = "シャベルを手に入れた", teacher = "先生のマネキンを手に入れた", rifle = "おもちゃの銃を手に入れた", skey = "銀の鍵を手に入れた", jack = "削岩機を手に入れた", ckey = "ハートの銅の鍵を手に入れた！"}
			if m.has(pr.id): toast(m[pr.id])
			saveGame()
	story.onDrop = func(pr):
		if is_same(pr, P.teacher) and teacherPlaced():
			toast("先生が黒板の前に立った。紙くずが止まった"); sfx("ding")
	story.onBell = func(): saveGame()
	story.onDug = func(): saveGame()
	story.onCoffin = func():
		P.teacher.noPick = false; toast("中に先生のマネキンが入っている"); saveGame()
	story.onBoard = func(_b):
		var any := false
		for b in A.boards:
			if b.on: any = true
		toast("板を1枚はがした" if any else "板を全部はがした！"); saveGame()
	for k in ["onCopper", "onBricks", "onGate", "onRifle", "onBoard2"]: story[k] = func(): saveGame()
	story.onValve = func(_cold):
		if story.part == "main":
			NB.goBoiler = true; saveGame()
	story.caught = func(): caughtStory()
# 寝室のベッドの下に隠れると、バールが見つかる
func underBedFind() -> void:
	if story.part == "main" and P.crowbar.hidden and P.crowbar.st != "inv":
		later(0.7, func():
			if not PL.hide: return
			setPropHidden(P.crowbar, false); P.crowbar.noPick = false; var slot: int = PL.inv.find(null)
			if slot >= 0:
				propToInv(P.crowbar); PL.inv[slot] = P.crowbar; drawInv(); toast("ベッドの下にバールがあった！")
			else: toast("ベッドの下にバールがある（持ち物がいっぱい）"))
func nextStep() -> void:
	story.step += 1; moveObj(); saveGame()
# ================= イントロ =================
func runIntro() -> void:
	story.gen += 1; var g: int = story.gen; story.part = "intro"; cutStart(true); setEnv("evening"); homeLights(false); nbVisible(true); NB.active = false
	# 車が通りを走ってくる
	ui_fade_now(true); parkMyCar(-60, -2, PI / 2); await wait(0.2); ui_fade_now(false)
	camTo(-44, 2.2, -8.5, -40, 1.2, -2, true); sfx("car")
	await introDrive(-60, -12, -2, true)
	if not CUT.skip:
		camTo(9, 2.4, -7.5, 3, 1, -8); await introDrive(-12, 4, -2, false)
	# 車よせに入る
	if not CUT.skip:
		var t0 := GT
		while GT - t0 < 2.2 and not CUT.skip:
			var t := smooth((GT - t0) / 2.2); var a := PI / 2 + t * PI / 2; parkMyCar(4 + 1.6 * sin(t * PI / 2), -2 - 10 * t, a); await wait(0)
	parkMyCar(5.6, -12, PI); sfx("thud")
	# そのころ、おとなりさんは……双眼鏡で見ている
	if not CUT.skip:
		await fadeOut(0.5); nbTeleport(-7, F1, 15.2, PI); NB.anim = "look"; camTo(-4, 1.7, 16.8, -7, 1.7, 14.5, true); await fadeIn(0.5); subtitle("……", 1.5); await wait(1.6); NB.anim = "binoc"; nbBinoc(true); await wait(1.4)
		await fadeOut(0.5); nbTeleport(0, 13.6, 18.7, PI); NB.anim = "binoc"; li(A.peepL, 3.0 if QUAL else 1.5); camTo(0.8, 14.9, 16.4, 0, 15, 18.7, true); await fadeIn(0.5); sfxVoice("hmm", Vector3(0, 14, 18)); await wait(2.6)
		camTo(-2, 1.8, -9, 0, 14, 18); await wait(2.2)
	await fadeOut(0.6)
	if g != story.gen: return
	nbBinoc(false); li(A.peepL, 0); nbTeleport(0, 13.6, 20, 0); nbVisible(false); teleportPlayer(4.2, 0.02, -10.2, PI * 0.95); startMove(); CUT.cam = null; await fadeIn(0.8); cutEnd()
func introDrive(x0: float, x1: float, z: float, follow: bool) -> void:
	var t0 := GT
	while true:
		var t := minf(1, (GT - t0) / ((x1 - x0) / 10)); var xx := x0 + (x1 - x0) * smooth(t); parkMyCar(xx, z, PI / 2)
		if follow: camTo(xx + 10, 2, -9, xx, 1.2, -2)
		if t >= 1 or CUT.skip: break
		await wait(0)
func nbBinoc(on: bool) -> void:
	if not NBM: return
	if on and not NBM.get("binoc"):
		var m := mkModel(PDEF.binoculars.mk); m.scale = Vector3(1.3, 1.3, 1.3); m.position = Vector3(0, 0.02, 0.16); m.rotation.y = PI; NBM.head.add_child(m); NBM.binoc = m
	if NBM.get("binoc"): NBM.binoc.visible = on
# ================= 引っ越し（チュートリアル）=================
func startMove() -> void:
	story.part = "move"; story.step = 0; setEnv("evening"); NB.active = false; nbVisible(false); objective(""); moveObj()
	for s in HINTTXT: s.queue_free()
	HINTTXT.clear()
	story.ht = [floatText("E で動かす", 1.9, 1.95, -21.3, 1, 1), floatText("E で拾う", -4.4, 0.9, -13.2, 0, 0.9), floatText("箱を家の中へ", -2.2, 1.5, -13, 0, 1), floatText("ここで昼寝", 4.6, 1.6, -28.6, 0, 0.9)]
	H1.front.lock = "key:key_red"
	H1.front.onUnlock = func():
		if story.part == "move" and story.step == 1:
			toast("鍵が開いた"); nextStep()
	H1.front.blockers = [func(): return "電気が来ていない……先に電気をつけよう" if story.part == "move" and story.step < 1 else null]
	moveObj(); saveGame()
func boxesInside() -> int:
	var n := 0
	for b in P.boxes:
		if b.st == "rest" and b.p.x > -6 and b.p.x < 6 and b.p.z > -30 and b.p.z < -22.1 and b.p.y < 2: n += 1
	return n
func moveObj() -> void:
	var s: int = story.step
	if story.part != "move": return
	var Hs: Array = story.ht
	for i in Hs.size(): Hs[i].visible = i == s or (s == 2 and i == 2)
	if s == 0: objective("ポーチの電気の箱で、電気をつける", "引っ越し")
	if s == 1: objective("庭の赤い取っ手の鍵を拾って、玄関の鍵を開ける", "引っ越し")
	if s == 2: objective("庭の箱をぜんぶ家の中に運ぶ（%d/5）" % boxesInside(), "引っ越し")
	if s == 3: objective("右のドアの寝室のベッドで昼寝する", "引っ越し")
func napIntro() -> void:
	story.gen += 1; var g: int = story.gen; story.part = "dream"; objective("")
	for s in HINTTXT: s.visible = false
	cutStart(true); await fadeOut(1.2); subtitle("……", 1.5, true); await wait(1.2); await basementDream()
	if g != story.gen: return
	startMain(false); await fadeIn(1.2); cutEnd(); subtitle("次の日", 2.5, true)
# ================= 地下室の場面（夢）=================
func dreamWalk(x: float, z: float, sp := 1.4) -> void:
	var tl := GT
	while not CUT.skip:
		var e := minf(0.1, GT - tl); tl = GT; var dx: float = x - NB.p.x; var dz: float = z - NB.p.z; var d := Vector2(dx, dz).length()
		if d < 0.08: break
		NB.yaw = damp_ang(NB.yaw, atan2(dx, dz), 8, e); var st := minf(d, sp * e); NB.p.x += dx / d * st; NB.p.z += dz / d * st; NB.anim = "walk"; NB.speed = sp; await wait(0)
	NB.anim = "idle"; NB.speed = 0.0
func basementDream() -> void:
	setEnv("night"); DREAM.g.visible = true; li(DREAM.L, 4.0 if QUAL else 2.0); nbVisible(true); NB.active = false; NB.state = "off"
	for b in A.boards: b.setOn.call(false)
	A.clock.g.visible = false; A.base.m.t = 0.0; A.base.m.tgt = 0.0; A.base.m.apply.call(0.0)
	nbTeleport(-4.6, F1, 17.4, PI); camTo(-3.2, 1.55, 16.2, -7.4, 1.2, 21.8, true); await fadeIn(1)
	await dreamWalk(-5.4, 20.2); await dreamWalk(-7.6, 21.1); NB.anim = "reach"; await wait(0.5); A.base.m.tgt = 1.0; sfx("creak"); await wait(1); await dreamWalk(-7.6, 23.4, 1.2); await dreamWalk(-8.3, 25, 1.2); nbVisible(false)
	await wait(0.8); sfx("carrev"); await wait(1.2); sfx("screech"); await wait(0.7); sfx("crash"); SHAKE = 0.6; await wait(0.8)
	# タイヤが転がって出てくる
	var W2: Node3D = DREAM.wheel; W2.visible = true; W2.rotation_order = EULER_ORDER_XYZ; var t0 := GT; var tl := GT
	while GT - t0 < 2.2 and not CUT.skip:
		var t := (GT - t0) / 2.2; W2.position = Vector3(-7.6 + sin(t * 3) * 0.2, F1 + 0.36, 23.8 - t * 5.5); W2.rotation.x -= 15 * (GT - tl); tl = GT; W2.rotation.z = 0.2; await wait(0)
	await wait(0.5); nbVisible(true); nbTeleport(-8, F1, 24.5, PI); await dreamWalk(-7.6, 21.3, 1.3); NB.yaw = 0.0; NB.anim = "reach"; await wait(0.4); A.base.m.tgt = 0.0; sfx("slam"); NB.anim = "idle"; await wait(0.6); NB.yaw = PI; NB.anim = "wave"; await wait(0.8)
	await dreamWalk(-5, 19.5, 1.4); await fadeOut(1.2); DREAM.g.visible = false; li(DREAM.L, 0); W2.visible = false; CUT.cam = null
# ================= 本編 =================
func startMain(load: bool) -> void:
	story.part = "main"; setEnv("day"); homeLights(true); H1.front.lock = null; H1.front.blockers = []
	for s in HINTTXT: s.visible = false
	if not load:
		for b in A.boards: b.setOn.call(true)
		A.clock.locked = true; A.clock.g.visible = true; A.base.m.t = 0.0; A.base.m.tgt = 0.0; A.base.m.apply.call(0.0); teleportPlayer(3.4, 0.31, -28, PI * 0.2); var n = NODES.liv_m; nbTeleport(n.p.x, n.p.y, n.p.z, 0)
	PL.spawn = Vector3(3.4, 0.31, -27.5); nbVisible(true); NB.active = true; NB.state = "routine"; setNbMode("idle"); NB.task = null; NB.path = []; objective("となりの家の地下室に入る", "もくひょう"); ui_body("main", true)
	if not load:
		later(3.2, func():
			if story.part == "main": toast("こまったら「？ヒント」（Hキー）" if CFG.hints else "地下室には何がある……？", 3.5))
	saveGame()
func napMain() -> void:
	story.stats.sleeps += 1; cutStart(false); await fadeOut(1); var carn: bool = story.stats.sleeps % 3 == 0
	if carn: await carnival()
	else:
		subtitle("少し眠った……", 1.8, true); await wait(1.5); resetNeighborAfterCatch(); NB.goBoiler = false
	teleportPlayer(3.4, 0.31, -28, PI * 0.2); setEnv("day"); await fadeIn(1); cutEnd(); saveGame()
# ---- つかまった ----
func caughtStory() -> void:
	if story.part != "main": return
	story.stats.caught += 1; STATE = "caught"; showScreen("caught", true); await wait(1.4); await fadeOut(0.5); showScreen("caught", false)
	# 持っていた物はつかまった場所に落ちる
	var dp: Vector3 = PL.p
	for i in 4:
		var it = PL.inv[i]
		if it:
			PL.inv[i] = null; propDropAt(it, dp.x + rr(-0.4, 0.4), dp.y + 0.3, dp.z + rr(-0.4, 0.4), rr(0, TAU), Vector3(rr(-1, 1), 1, rr(-1, 1))); it.thrown = false
	drawInv()
	var learned = learnFromCatch()
	for d in A.front: d.m.tgt = 0.0
	PL.stuck = 0.0; ui_cls("trapFx", "on", false); resetNeighborAfterCatch(); PL.frozen = false
	if story.stats.caught == 1:
		STATE = "cut"; await carnival()
	teleportPlayer(3.4, 0.31, -28, PI * 0.2); cutEnd(); STATE = "play"; setEnv("day")
	subtitle("……おとなりさんは、入ってきた所をふさいだようだ" if learned == "chair" else "……おとなりさんは、入ってきた窓の下に何かしかけたようだ" if learned == "trap" else "持っていた物は、つかまった場所に落ちている" if story.stats.caught == 1 else "つかまってしまった（%d回目）" % story.stats.caught, 3.5)
	saveGame(); await wait(0.3); await fadeIn(0.8)
func fallFaint() -> void: PL.v = Vector3()
# ================= 悪夢：遊園地のかくれんぼ =================
func carnival() -> void:
	var ox: float = CARN.ox; var oz: float = CARN.oz; story.inCarn = true; setEnv("night")
	for L in CARN.lights: li(L, 9.0 if QUAL else 6.0)
	setMusic("carnival")
	var nbWas: bool = NB.active; NB.active = true; NB.state = "script"; NB.script = null; nbVisible(true); nbTeleport(ox, 0, oz + 22, 0); NB.anim = "cover"
	for tries in 5:
		teleportPlayer(ox, 0.02, oz - 1.5, PI); PL.hide = null; ui_cls("hideView", "on", false)
		for L in CARN.ward.leaves: L.m.tgt = 0.0
		nbTeleport(ox + 7, 0, oz + 22, PI * 0.75); NB.anim = "cover"; await fadeIn(0.8); cutEnd(); STATE = "play"; CARN.active = true; subtitle("かくれろ！（ベッドの下か、たんすの中）", 3)
		for i in range(1, 6):
			subtitle("%d……" % i, 0.9, true); sfxVoice("count", NB.p); await wait(1)
		# 数え終わった
		NB.anim = "idle"; sfxVoice("hmm", NB.p); var hid = PL.hide; var other := "ward" if is_same(hid, CARN.bedHide) else "bed"
		var tgt: Vector3 = (Vector3(ox - 5, 0, oz + 10.3) if other == "bed" else Vector3(ox + 5, 0, oz + 10.8)) if hid else PL.p
		# おとなりさんが探しにくる
		var caught := false; var t0 := GT; var tl := GT
		while GT - t0 < 9:
			var e := minf(0.1, GT - tl); tl = GT; var gp: Vector3 = tgt if hid else PL.p; var dx: float = gp.x - NB.p.x; var dz: float = gp.z - NB.p.z; var d := Vector2(dx, dz).length()
			if d > 0.8:
				var sp := 2.2 if hid else 3.1; NB.p.x += dx / d * sp * e; NB.p.z += dz / d * sp * e; NB.yaw = atan2(dx, dz); NB.anim = "walk" if hid else "run"; NB.speed = sp
			else: break
			if not hid and not PL.hide and Vector2(PL.p.x - NB.p.x, PL.p.z - NB.p.z).length() < 1.1:
				caught = true; break
			if not hid and PL.hide: break
			await wait(0)
		if hid or PL.hide: # もう一方の場所を調べて、見つけられない
			NB.anim = "crouch"
			if other == "ward":
				for L in CARN.ward.leaves: L.m.tgt = 1.0
			sfx("cab", true); await wait(1.6); NB.anim = "look"; sfxVoice("grr", NB.p); await wait(1.2)
			if not hid and PL.hide: caught = true # 後から隠れても見られていた
		if not caught:
			cutStart(false); await fadeOut(1.2, true); break
		# 見つかった：もう一度
		cutStart(false); sfx("catch"); NB.anim = "grab"; await wait(1); subtitle("見つかった……もう一度", 2, true); await fadeOut(0.8)
	CARN.active = false; story.inCarn = false
	for L in CARN.lights: li(L, 0)
	setMusic(null); ui_cls("hideView", "on", false); PL.hide = null; NB.active = nbWas; NB.state = "routine"; setNbMode("idle"); var n = NODES.hall_m; nbTeleport(n.p.x, n.p.y, n.p.z, 0); ui_fade_white(false)
# ================= ヒント =================
func hintDone(i: int) -> bool:
	match i:
		0: return A.water.frozen or P.lockpick.st == "inv" or not A.clock.locked
		1: return P.lockpick.st == "inv" or not A.clock.locked
		2:
			for b in A.boards:
				if b.on:
					for p in [P.hammer, P.hammer2, P.crowbar]:
						if p.st == "inv": return true
					return false
			return true
	return false
const HINTS := ["裏口からボイラー室に入って、大きなかまどの赤いバルブを回してみよう（E）",
	"居間の階段を上ると水びたしの部屋。凍っていればわたれる（エレベーターでも2階へ行ける）。2階の居間の左のドア、さらにその先のドアが監視室。机にピッキング道具",
	"ハンマーはガレージの作業台か、寝室のナイトテーブルの引き出し。バールは寝室のベッドの下に隠れると見つかる",
	"居間の階段の下、EXITの看板の地下室のドア：ハンマーかバールで板をはがし（左クリック）、ピッキング道具で銅の錠を開けよう。もうひとつの方法は、ベル→墓の部屋→教室→射的場→子ども部屋の「銅の鍵」"]
func showHint() -> void:
	if story.part == "move":
		toast("左上の「やること」をしよう"); return
	if story.part != "main": return
	for i in HINTS.size():
		if not hintDone(i):
			subtitle("ヒント：" + HINTS[i], 7); return
# ================= エンディング =================
func startEnding() -> void:
	if story.part != "main": return
	story.part = "end"; NB.active = false; setMusic(null); cutStart(false); PL.frozen = true
	# 扉がゆっくり開いて、まぶしい光
	var cp := camPos(); camTo(cp.x, cp.y, cp.z, -7.6, 1.3, 23, true); li(A.baseLight, 0)
	var t0 := GT
	while GT - t0 < 1.6:
		li(A.baseLight, (GT - t0) / 1.6 * 30); await wait(0)
	li(A.baseLight, 30); sfx("sting"); await wait(1.2)
	# おとなりさんが扉をしめて、おそってくる
	nbVisible(true); nbTeleport(-6.6, F1, 20.3, -PI / 2); NB.anim = "reach"; await wait(0.3); A.base.m.tgt = 0.0; li(A.baseLight, 0); sfx("slam"); SHAKE = 0.5; await wait(0.5)
	NB.yaw = atan2(PL.p.x - NB.p.x, PL.p.z - NB.p.z); NB.anim = "run"; camTo(cp.x, cp.y, cp.z, NB.p.x, 1.7, NB.p.z); sfxVoice("hey", NB.p)
	t0 = GT; var tl := GT
	while GT - t0 < 0.6:
		var e := GT - tl; tl = GT; var dx: float = PL.p.x - NB.p.x; var dz: float = PL.p.z - NB.p.z; var d := Vector2(dx, dz).length()
		if d < 0.9: break
		var st := minf(d - 0.9, 6 * e); NB.p.x += dx / d * st; NB.p.z += dz / d * st; await wait(0)
	NB.anim = "grab"; sfx("catch"); SHAKE = 1.0; await wait(0.35); ui_fade_now(true); await wait(1.6)
	# 棺の中で目がさめる
	setEnv("evening"); EXPOSURE = 1.15; apply_env_uniforms(); nbTeleport(GRAVE.ox + 1.15, 0, GRAVE.oz + 0.3, -PI / 2); NB.anim = "look"; NB.look = 0.0
	camTo(GRAVE.ox - 0.1, -1.72, GRAVE.oz + 0.3, GRAVE.ox + 0.5, 1.3, GRAVE.oz + 0.3, true); CUT.cam.k = 1.0
	var lid: Node3D = GRAVE.lid; lid.visible = true; lid.position = Vector3(GRAVE.ox - 1.45, 0.04, GRAVE.oz); lid.rotation = Vector3(); await fadeIn(2.5); await wait(1.2); sfxVoice("hmm", NB.p); await wait(1.6)
	NB.anim = "reach"; await wait(0.4)
	t0 = GT
	while true:
		var t := minf(1, (GT - t0) / 1.0); lid.position = Vector3(GRAVE.ox - 1.45 + 1.45 * t, lerpf(0.04, -1.465, t * t) + sin(t * PI) * 0.55, GRAVE.oz); lid.rotation.z = -sin(t * PI) * 0.5
		if t >= 1: break
		await wait(0)
	sfx("thud"); ui_fade_now(true); await wait(0.1)
	await wait(1.8); setMusic("ending"); var tt: float = story.stats.time; var m := floori(tt / 60); var s := floori(fmod(tt, 60))
	ui_ending("THE END", "地下室には、何があったのだろう……\n（アルファ1はここでおしまい）\n\nかかった時間：%d分%d秒　つかまった回数：%d回" % [m, s, story.stats.caught])
	showScreen("ending", true); STATE = "ending"; cutEnd(); STATE = "ending"; unlockPointer(); store_set(SAVEKEY, null); store_set("otonari-a1-clear", "1")
# ================= 毎フレーム =================
var autoSaveT := 15.0
func updStory(dt: float) -> void:
	if story.part == "main" and STATE == "play": story.stats.time += dt
	PL.inHouse = (PL.p.x > -6 and PL.p.x < 6 and PL.p.z > -30 and PL.p.z < -22) or inNHouse(PL.p)
	if story.part == "move":
		if story.step == 2:
			var n := boxesInside()
			if n != story.boxN:
				story.boxN = n; moveObj()
			if n >= 5:
				toast("荷物を運び終えた！"); nextStep()
		if story.step == 1 and not H1.front.lock: nextStep()
	if story.part == "main":
		var anyBoard := false
		for b in A.boards:
			if b.on: anyBoard = true
		if A.base.m.tgt > 0.5 and not anyBoard and not A.clock.locked: startEnding()
		# 音楽：追いかけられているとき
		if NB.state == "chase": setMusic("chase%d" % MUS.chaseTrack)
		elif MUS.want != null and str(MUS.want).begins_with("chase") and GT - NB.seeT > 3: setMusic(null)
		# おとなりさんが近い（口笛のような音）
		story.nearT -= dt
		if NB.state != "chase" and story.nearT <= 0 and NB.p.distance_to(PL.p) < 9 and inNHouse(PL.p):
			story.nearT = 9.0; sfx("near")
		autoSaveT -= dt
		if autoSaveT <= 0:
			autoSaveT = 15.0; saveGame()
# ================= セーブ =================
const SAVEKEY := "otonari-a1-save"
func r3(v: float) -> float: return snappedf(v, 0.001)
func saveGame() -> void:
	if STATE == "title" or not (story.part == "move" or story.part == "main"): return
	var d := {v = 2, part = story.part, step = story.step, flags = story.flags, stats = story.stats}
	if story.part == "main":
		d.pl = {x = PL.p.x, y = PL.p.y, z = PL.p.z, yaw = PL.yaw}; d.inv = PL.inv.map(func(p): return p.id if p else null); d.props = {}
		var re := RegEx.new(); re.compile("^p\\d+$")
		for p in PROPS:
			if not p.id or re.search(p.id) != null and not p.get("moved"): continue
			d.props[p.id] = {x = r3(p.p.x), y = r3(p.p.y), z = r3(p.p.z), yaw = r3(p.yaw), st = p.st, h = p.hidden, np = p.noPick, ly = not not p.lying, data = p.data}
		d.doors = DOORS.map(func(x): return [1 if x.m.tgt > 0.5 else 0, x.lock]); d.win = WINDOWS.map(func(w): return [1 if w.broken else 0, 1 if w.boarded else 0]); d.traps = TRAPS.map(func(t): return [t.x, t.y, t.z, t.k, 1 if t.armed else 0]); d.cams = CAMS.map(func(c): return 1 if c.broken else 0)
		var chairs := []
		for k in ENTRY:
			if ENTRY[k].get("chairProp"): chairs.append(k)
		d.m = {cold = A.furn.cold, power = A.power.on, camsOff = not not A.get("camsOff"), camsLeft = maxf(5, A.camsCheckAt - GT) if A.get("camsCheckAt") else 0.0, bell = (A.pole.bell.id if A.pole.bell else "bell") if A.pole.has else false, dirt = A.dirt.level, coffin = A.coffin.open,
			slots = A.slots.map(func(S): return S.v.id if S.v else null), rifleGiven = not not A.get("rifleGiven"), stand = A.stand.has, score = A.stand.score, keyDropped = not not A.get("keyDropped"), gate = [A.gate.locked, A.gate.open], bricks = A.bricks.broken, boards = A.boards.map(func(b): return b.on), clock = A.clock.locked, learn = LEARN, chairs = chairs}
	store_set(SAVEKEY, JSON.stringify(d))
func hasSave() -> bool: return store_get(SAVEKEY) != null
func loadGame() -> bool:
	var raw = store_get(SAVEKEY)
	if raw == null: return false
	var d = JSON.parse_string(raw)
	if not d is Dictionary: return false
	story.flags = d.get("flags", {}); story.stats = {time = 0.0, caught = 0, sleeps = 0}; story.stats.merge(d.get("stats", {}), true)
	story.stats.caught = int(story.stats.caught); story.stats.sleeps = int(story.stats.sleeps)
	if d.part == "move":
		teleportPlayer(4.2, 0.02, -10.2, PI * 0.95); parkMyCar(5.6, -12, PI); startMove(); return true
	parkMyCar(5.6, -12, PI)
	for b in P.boxes: propRestAt(b, rr(-4, -1), 0.31, rr(-27, -24), 0)
	H1.ebox.on = true; H1.ebox.open = true; H1.eboxLid.m.tgt = 1.0; H1.ebox.sw.rotation.x = -0.7
	var Mm: Dictionary = d.get("m", {})
	for k in Mm.get("chairs", []):
		if ENTRY.has(k):
			story.usedEntry = k; learnFromCatch()
	for id in d.get("props", {}):
		var pr = propById(id)
		if not pr: continue
		var s: Dictionary = d.props[id]; pr.data.merge(s.get("data", {}), true); pr.noPick = not not s.get("np"); pr.lying = not not s.get("ly")
		if s.st == "inv" or s.st == "att":
			if s.get("h") != null: setPropHidden(pr, s.h)
			continue
		detachProp(pr); propRestAt(pr, s.x, s.y, s.z, s.yaw)
		if s.get("h") != null: setPropHidden(pr, s.h)
	PL.inv = [null, null, null, null]
	var inv: Array = d.get("inv", [])
	for i in inv.size():
		var pr = propById(inv[i]) if inv[i] else null
		if pr:
			detachProp(pr); propToInv(pr); PL.inv[i] = pr
	var ds: Array = d.get("doors", [])
	for i in ds.size():
		if i >= DOORS.size(): break
		var x = DOORS[i]; x.lock = ds[i][1]; x.m.t = float(ds[i][0]); x.m.tgt = float(ds[i][0]); x.m.apply.call(float(ds[i][0]))
	var ws: Array = d.get("win", [])
	for i in ws.size():
		if i >= WINDOWS.size(): break
		if ws[i][0]: setBroken(WINDOWS[i], true)
		if ws[i][1]: boardWindow(WINDOWS[i], true)
	for t in d.get("traps", []):
		var T = null
		for x in TRAPS:
			if x.k == t[3]: T = x
		if not T: T = addBearTrap(t[0], t[1], t[2], t[3])
		if not t[4] and T.armed: snapTrap(T, false)
	var cs: Array = d.get("cams", [])
	for i in cs.size():
		if cs[i] and i < CAMS.size(): breakCamera(CAMS[i])
	if Mm.get("cold"):
		A.furn.cold = true; A.furn.t = 9.0; setFrozen(true)
	setPower(Mm.get("power", true) != false, false)
	if Mm.get("camsOff"):
		A.camsOff = true; A.camsCheckAt = GT + (Mm.get("camsLeft", 40) if Mm.get("camsLeft", 0) else 40)
	updCamLeds()
	if Mm.get("bell") and not A.pole.has:
		var b = propById(Mm.bell if Mm.bell is String else "bell"); P.shovel.noPick = false; b.p = Vector3(A.pole.x, A.pole.y - 0.12, A.pole.z); A.pole.has = true; A.pole.bell = b; b.st = "att"; b.noPick = true; b.grp.position = b.p
		A.boxDoor.m.t = 1.0; A.boxDoor.m.tgt = 1.0; A.boxDoor.m.apply.call(1.0)
	var dl: int = int(Mm.get("dirt", 3))
	while A.dirt.level > dl:
		A.dirt.level -= 1; var lv: float = A.dirt.level / 3.0; A.dirt.m.position.y = -1 + 1.3 * lv - 0.65; A.dirt.col.y1 = -1 + 1.3 * lv; A.dirt.m.visible = A.dirt.level > 0
		if A.dirt.level <= 0: A.dirt.col.on = false
	if Mm.get("coffin"):
		A.coffin.open = true; A.coffin.lidT = 1.0; A.coffin.lidCol.on = false; A.coffin.lid.position = Vector3(A.coffin.x - 0.95, A.coffin.y + 0.53, A.coffin.z); A.coffin.lid.rotation.z = 1.1
	var sl: Array = Mm.get("slots", [])
	for i in sl.size():
		var pr = propById(sl[i]) if sl[i] else null
		if pr:
			var S = A.slots[i]; S.v = pr; pr.st = "att"; pr.noPick = true; pr.grp.visible = true; pr.grp.position = Vector3(9.74, S.y, S.z); pr.grp.rotation_order = EULER_ORDER_XYZ; pr.grp.rotation = Vector3(0, 0, PI / 2)
	A.rifleGiven = Mm.get("rifleGiven", false)
	if Mm.get("stand"):
		var r = propById("rifle"); A.stand.has = true; A.stand.rifle = r; r.st = "att"; r.noPick = true; r.grp.visible = true; r.grp.position = Vector3(3.4, F2 + 1.3, 24.2); r.grp.rotation = Vector3(0, PI / 2, 0)
	A.stand.score = int(Mm.get("score", 0)); drawScore(A.stand.score); A.keyDropped = Mm.get("keyDropped", false); updRangePower()
	if Mm.get("gate"):
		if not Mm.gate[0]:
			A.gate.locked = false; A.gate.lock.visible = false
		if Mm.gate[1]: setGate(A.gate, true)
	if Mm.get("bricks"):
		A.bricks.broken = true; A.bricks.g.visible = false; A.bricks.col.on = false
	var bo: Array = Mm.get("boards", [])
	for i in bo.size():
		if i < A.boards.size(): A.boards[i].setOn.call(bo[i])
	A.clock.locked = Mm.get("clock", true) != false; A.clock.g.visible = A.clock.locked; LEARN.merge(Mm.get("learn", {}), true)
	startMain(true)
	if d.get("pl"): teleportPlayer(d.pl.x, d.pl.y + 0.02, d.pl.z, d.pl.yaw)
	drawInv()
	return true
