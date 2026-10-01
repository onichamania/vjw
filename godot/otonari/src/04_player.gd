
# ================= プレイヤー（一人称）=================
const PR := 0.27
const H_ST := 1.6
const H_CR := 0.92
const STEP := 0.46
const GRAV := 18.0
const JUMPV := 6.5
var PL := {p = Vector3(), v = Vector3(), yaw = 0.0, pitch = 0.0, crouch = 0.0, wantCrouch = false, autoCrouch = 0.0, onGround = true, ground = null, h = H_ST, climb = null, hide = null, stuck = 0.0, fallTop = 0.0,
	inv = [null, null, null, null], sel = 0, charge = 0.0, charging = false, chargeT = 0.0, bob = 0.0, stepD = 0.0, zoom = 0.0, light = false, frozen = false, run = false, target = null, useTarget = null, lastLand = 0.0, hurtT = 0.0, swing = 0.0, inHouse = false,
	wet = false, slip = 0.0, climbSnd = 0.0, hideT = 0.0, spawn = null}
var IN := {f = 0.0, s = 0.0, run = false, jump = false, crouch = false, lookX = 0.0, lookY = 0.0, zoom = false}
func eyeH() -> float: return PL.h - 0.12
func camPos() -> Vector3: return Vector3(PL.p.x, PL.p.y + eyeH(), PL.p.z)
func lookDir() -> Vector3:
	var cp := cos(PL.pitch)
	return Vector3(-sin(PL.yaw) * cp, sin(PL.pitch), -cos(PL.yaw) * cp)
func held(): return PL.inv[PL.sel]
var bodyFilt := func(b): return b.s != "trig"
func canStand() -> bool:
	return not overlap_any(PL.p.x - PR, PL.p.y + 0.05, PL.p.z - PR, PL.p.x + PR, PL.p.y + H_ST, PL.p.z + PR, null, bodyFilt)
func teleportPlayer(x: float, y: float, z: float, yaw: float, pitch := 0.0) -> void:
	PL.p = Vector3(x, y, z); PL.v = Vector3(); PL.yaw = yaw; PL.pitch = pitch; PL.climb = null; PL.fallTop = y; PL.crouch = 0.0; PL.h = H_ST; PL.onGround = true
func updatePlayer(dt: float) -> void:
	if PL.hurtT > 0: PL.hurtT -= dt
	if PL.hide or PL.frozen:
		PL.v = Vector3(); return
	if PL.stuck > 0:
		PL.stuck -= dt
		if PL.stuck <= 0:
			ui_cls("trapFx", "on", false); toast("トラバサミから足をぬいた")
		PL.v.x = 0.0; PL.v.z = 0.0
	# しゃがみ
	var wantC: bool = IN.crouch or PL.autoCrouch > 0
	if PL.autoCrouch > 0 and not IN.crouch:
		PL.autoCrouch -= dt
		if PL.autoCrouch <= 0 and not canStand(): PL.autoCrouch = 0.2
	var tgtC := 1.0 if wantC else (1.0 if PL.crouch > 0 and not canStand() else 0.0)
	PL.crouch = damp(PL.crouch, tgtC, 14, dt); PL.h = lerpf(H_ST, H_CR, PL.crouch)
	# 入力 → 向き
	var cs := cos(PL.yaw); var sn := sin(PL.yaw)
	var fx: float = -sn * IN.f + cs * IN.s; var fz: float = -cs * IN.f - sn * IN.s
	var il := Vector2(fx, fz).length()
	if il > 1:
		fx /= il; fz /= il
	var wet := playerInWater(); PL.wet = wet
	var running: bool = (IN.run or PL.run) and PL.crouch < 0.3 and IN.f > 0 and not wet
	var sp := (1.8 if PL.crouch > 0.5 else 5.9 if running else 3.5) * (0.5 if wet else 1.0)
	# はしご
	var lad = null
	for L in LADDERS:
		var b: Box = L.box
		if PL.p.x + PR > b.x0 and PL.p.x - PR < b.x1 and PL.p.z + PR > b.z0 and PL.p.z - PR < b.z1 and PL.p.y + 0.3 > b.y0 and PL.p.y < b.y1:
			lad = L; break
	if lad and not PL.climb:
		var tow: float = -(fx * lad.face[0] + fz * lad.face[1])
		if tow > 0.3 and IN.f > 0 and PL.stuck <= 0: PL.climb = lad
	if PL.climb and (not lad or IN.jump):
		if IN.jump and PL.climb:
			PL.v.x = PL.climb.face[0] * 3; PL.v.z = PL.climb.face[1] * 3; PL.v.y = 3.0; IN.jump = false
		PL.climb = null
	if PL.climb:
		var L = PL.climb
		var up: float = sgn(IN.f) * (-1.0 if PL.pitch < -0.5 else 1.0) if IN.f != 0 else 0.0
		PL.v.y = up * 2.7
		var tow: float = -(fx * L.face[0] + fz * L.face[1])
		PL.v.x = -L.face[0] * maxf(0, tow) * 1.2 + (fx + L.face[0] * tow) * 1.2; PL.v.z = -L.face[1] * maxf(0, tow) * 1.2 + (fz + L.face[1] * tow) * 1.2
		if up < 0 and PL.onGround and PL.p.y < L.y0 + 0.2: PL.climb = null
		PL.fallTop = PL.p.y; PL.climbSnd += absf(PL.v.y) * dt
		if PL.climbSnd > 0.55:
			PL.climbSnd = 0.0; sfx("ladder")
	else:
		var acc := 0.6 if PL.slip > 0 else 16.0 if PL.onGround else 4.0
		var tx := fx * sp; var tz := fz * sp
		if PL.stuck <= 0:
			PL.v.x = damp(PL.v.x, tx, acc, dt); PL.v.z = damp(PL.v.z, tz, acc, dt)
		PL.v.y -= GRAV * dt
		if PL.v.y < -30: PL.v.y = -30.0
		if IN.jump and PL.onGround and PL.stuck <= 0:
			PL.v.y = JUMPV; PL.onGround = false; sfxStep(PL.ground.s if PL.ground else "wood", 0.5)
	IN.jump = false
	# 動かす（細かく分けて）
	var wasG: bool = PL.onGround; var vy0: float = PL.v.y
	var n := maxi(1, ceili(PL.v.length() * dt / 0.2)); var h := dt / n; var grounded := false; var gnd = null
	for i in n:
		var ox: float = PL.p.x; var oz: float = PL.p.z
		PL.p = move_body(PL.p, PR, PL.h, PR, 0, PL.v.y * h, 0, null, bodyFilt)
		if HIT.y:
			if PL.v.y < 0:
				grounded = true; gnd = HIT.ground
			PL.v.y = 0.0
		var dx: float = PL.v.x * h; var dz: float = PL.v.z * h; var sy: float = PL.p.y
		PL.p = move_body(PL.p, PR, PL.h, PR, dx, 0, dz, null, bodyFilt)
		if (HIT.x or HIT.z) and (grounded or wasG or PL.climb): # 段差を上る
			var bx: float = PL.p.x; var bz: float = PL.p.z
			var p2 := move_body(Vector3(ox, sy, oz), PR, PL.h, PR, 0, STEP, 0, null, bodyFilt)
			var up := p2.y - sy
			if up > 0.05:
				p2 = move_body(p2, PR, PL.h, PR, dx, 0, dz, null, bodyFilt)
				var moved := Vector2(p2.x - ox, p2.z - oz).length(); var moved0 := Vector2(bx - ox, bz - oz).length()
				if moved > moved0 + 0.01:
					p2 = move_body(p2, PR, PL.h, PR, 0, -up - 0.02, 0, null, bodyFilt)
					if HIT.y:
						PL.p = p2; grounded = true; gnd = HIT.ground
		# 低い所に入るときは自動でしゃがむ
		if (HIT.x or HIT.z) and PL.crouch < 0.5 and IN.f > 0:
			var p3 := move_body(Vector3(ox, PL.p.y, oz), PR, H_CR, PR, dx, 0, dz, null, bodyFilt)
			if Vector2(p3.x - ox, p3.z - oz).length() > Vector2(PL.p.x - ox, PL.p.z - oz).length() + 0.005: PL.autoCrouch = 0.35
	# 立っているか確かめる
	if not grounded and PL.v.y <= 0:
		var g = groundBelow(PL.p, PR, 0.06)
		if g:
			grounded = true; gnd = g
	if grounded and not wasG:
		var fall: float = PL.fallTop - PL.p.y
		if fall > 1.2 or vy0 < -8:
			sfxStep(gnd.s if gnd else "wood", 1.4); noise(PL.p.x, PL.p.y, PL.p.z, clampf(fall * 2, 4, 12), "land"); PL.bob += 0.4
		if fall > 9.5 and not PL.climb: fallFaint()
	if not grounded and wasG: PL.fallTop = PL.p.y
	if not grounded: PL.fallTop = maxf(PL.fallTop, PL.p.y)
	PL.onGround = grounded; PL.ground = gnd
	if PL.onGround: PL.fallTop = PL.p.y
	if PL.p.y < -20:
		var sp2 = PL.spawn
		teleportPlayer(sp2.x if sp2 else 0.0, sp2.y if sp2 else 0.0, sp2.z if sp2 else 0.0, PL.yaw)
	# 足音
	var hs := Vector2(PL.v.x, PL.v.z).length()
	if PL.onGround and hs > 0.5:
		PL.stepD += hs * dt; var sl := 1.9 if running else 1.1 if PL.crouch > 0.5 else 1.45; PL.bob += hs * dt * (1.25 if running else 1.0)
		if PL.stepD > sl:
			PL.stepD = 0.0; var surf: String = "water" if PL.wet else PL.ground.s if PL.ground else "wood"
			sfxStep(surf, 0.25 if PL.crouch > 0.5 else 1.0 if running else 0.6)
			if PL.crouch < 0.5: noise(PL.p.x, PL.p.y, PL.p.z, 9.0 if running else 3.5, "step")
	# 双眼鏡
	var H = held(); var zoomOn: bool = IN.zoom and H and H.d.tool == "binoc"
	PL.zoom = damp(PL.zoom, 1.0 if zoomOn else 0.0, 10, dt); ui_cls("binoc", "on", PL.zoom > 0.5)
func groundBelow(p: Vector3, r: float, d: float):
	var best = null
	for b in gather(p.x - r, p.z - r, p.x + r, p.z + r):
		if b.s == "trig": continue
		if b.x0 < p.x + r and b.x1 > p.x - r and b.z0 < p.z + r and b.z1 > p.z - r and b.y1 <= p.y + 0.01 and b.y1 >= p.y - d:
			if best == null or b.y1 > best.y1: best = b
	return best
# 重なってしまったとき（ドアが閉まったなど）に押し出す。新しい位置を返す
func depenetrate(p: Vector3, r: float, h: float) -> Vector3:
	for b in DYN:
		if not b.on or b.s == "trig": continue
		if b.x0 < p.x + r and b.x1 > p.x - r and b.z0 < p.z + r and b.z1 > p.z - r and b.y0 < p.y + h and b.y1 > p.y + 0.05:
			var dx1: float = b.x1 - (p.x - r); var dx0: float = (p.x + r) - b.x0; var dz1: float = b.z1 - (p.z - r); var dz0: float = (p.z + r) - b.z0; var dy: float = b.y1 - p.y
			var m := minf(minf(dx1, dx0), minf(minf(dz1, dz0), dy if dy < 0.5 else 9.0))
			if m == dy: p.y = b.y1 + 0.001
			elif m == dx1: p.x += dx1
			elif m == dx0: p.x -= dx0
			elif m == dz1: p.z += dz1
			else: p.z -= dz0
	return p
# ---- ねらっている物 ----
func aabbRay(b, ox: float, oy: float, oz: float, dx: float, dy: float, dz: float, mx: float) -> float:
	return ray_box(ox, oy, oz, 1.0 / (dx if dx else 1e-9), 1.0 / (dy if dy else 1e-9), 1.0 / (dz if dz else 1e-9), b, mx)
func updTarget() -> void:
	PL.target = null; PL.useTarget = null
	if PL.hide or PL.frozen or STATE != "play":
		showPrompt(); return
	var ro := camPos(); var rd := lookDir(); var R := 2.35
	var best := R; var bt = null; var bk = null
	var ox := ro.x; var oy := ro.y; var oz := ro.z; var dx := rd.x; var dy := rd.y; var dz := rd.z
	var H0 = held()
	for it in ITS:
		if not it.on: continue
		var t := aabbRay(it.box, ox, oy, oz, dx, dy, dz, best)
		if t >= 0 and t < best:
			if it.label:
				var l = it.label.call(H0)
				if not (l and l.get("t")) and not (H0 and it.useLabel and it.useLabel.call(H0)): continue
			best = t; bt = it; bk = "it"
	for pr in PROPS:
		if (pr.st != "rest" and pr.st != "att" and pr.st != "fly") or pr.hidden or pr.noPick: continue
		var b := propBox(pr); var pad := 0.06
		var bb := Box.new(b.x0 - pad, b.y0 - pad, b.z0 - pad, b.x1 + pad, b.y1 + pad, b.z1 + pad)
		var t := aabbRay(bb, ox, oy, oz, dx, dy, dz, best)
		if t >= 0 and t < best:
			best = t; bt = pr; bk = "prop"
	if bt:
		# 壁の向こうは×
		var tgt = bt; var kind = bk
		var ts := ray_cast(ox, oy, oz, dx, dy, dz, best, func(b): return b.s != "trig" and not (kind == "it" and tgt.door and is_same(b.ref, tgt.door)) and not (kind == "prop" and is_same(b.ref, tgt)) and not (kind == "it" and tgt.ownCol and tgt.ownCol == b))
		if ts < best - 0.08: bt = null
	PL.target = {k = bk, o = bt, t = best} if bt else null
	# 手に持っている物が使えるか
	var H = held()
	if H and bt:
		if bk == "it" and bt.useLabel:
			var l = bt.useLabel.call(H)
			if l: PL.useTarget = {o = bt, l = l, prop = false}
		elif bk == "prop" and propUseLabel(H, bt): PL.useTarget = {o = bt, l = propUseLabel(H, bt), prop = true}
	showPrompt()
var lastPrompt := ""
func showPrompt() -> void:
	var s := ""; var T = PL.target; var H = held(); var touch := TOUCH
	if PL.hide: s = ""
	elif T:
		if T.k == "prop":
			var pl = propLabel(T.o)
			if pl: s = "[b]%s[/b]%s" % ["手" if touch else "E", pl]
		else:
			var l = T.o.label.call(H) if T.o.label else null
			if l and l.get("t"): s = ("[b]%s[/b]" % ("手" if touch else l.k) if l.k else "") + l.t + ("[small]%s[/small]" % l.n if l.get("n") else "")
		if PL.useTarget: s += ("\n" if s else "") + "[b]%s[/b]%s" % ["使う" if touch else "左クリック", PL.useTarget.l]
	if s != lastPrompt:
		ui_prompt(s); lastPrompt = s
	ui_cls("cross", "hot", not not T)
func propLabel(pr: Dictionary):
	if pr.data.get("frozen"): return null
	if pr.data.get("hot"): return "拾う　[color=#ff9a6a]" + pr.d.name + "（熱い！）[/color]"
	if pr.type == "suitcase" and pr.data.get("openable"): return "閉める　スーツケース" if pr.data.get("open") else "開ける　スーツケース"
	return "拾う　" + pr.d.name
func propUseLabel(H: Dictionary, pr: Dictionary):
	if H.type == "key_house" and pr.type == "suitcase" and pr.data.get("wantKey"): return "鍵をスーツケースに入れる"
	if H.type == "watering_can" and H.data.get("full") and pr.data.get("hot"): return "水をかけて冷やす"
	return null
# ---- 行動 ----
func doInteract() -> void:
	if STATE != "play": return
	if PL.hide:
		exitHide(); return
	var T = PL.target
	if not T: return
	if T.k == "prop":
		var pr = T.o
		if pr.type == "suitcase" and pr.data.get("openable"):
			toggleSuitcase(pr); return
		pickUp(pr)
	elif T.o.act: T.o.act.call()
func pickUp(pr: Dictionary) -> void:
	if pr.data.get("frozen"):
		toast("氷づけになっていて取れない"); return
	if pr.data.get("hot"):
		sfx("sizzle"); toast("あつっ！ 熱くて持てない！"); PL.hurtT = 0.4; ui_cls("hurt", "on", true); later(0.3, func(): ui_cls("hurt", "on", false)); noise(PL.p.x, PL.p.y, PL.p.z, 6, "yell")
		if pr.st == "att":
			detachProp(pr); propDropAt(pr, pr.p.x, pr.p.y, pr.p.z, pr.yaw, Vector3(rr(-0.5, 0.5), 0, rr(-0.5, 0.5)))
		if story.get("onHotTouch"): story.onHotTouch.call(pr)
		return
	var slot: int = PL.inv.find(null) if PL.inv[PL.sel] else PL.sel
	if slot < 0:
		toast("持ち物がいっぱい（Qで置けるよ）"); sfx("deny"); return
	if pr.st == "att" and pr.att and pr.att.get("onTake"): pr.att.onTake.call(pr)
	pr.lying = false; propToInv(pr); PL.inv[slot] = pr; PL.sel = slot; sfx("pick"); drawInv(); showIName()
	if story.get("onPick"): story.onPick.call(pr)
	PL.swing = 0.25
func consumeHeld() -> void:
	var H = held()
	if not H: return
	PL.inv[PL.sel] = null; H.st = "gone"; H.grp.visible = false; refreshSolid(H); drawInv()
func dropHeld() -> void:
	var H = held()
	if not H or PL.hide: return
	var ro := camPos(); var rd := lookDir(); var fw := Vector3(rd.x, 0, rd.z).normalized()
	var x: float = PL.p.x + fw.x * 0.7; var z: float = PL.p.z + fw.z * 0.7; var y: float = PL.p.y + PL.h * 0.6
	# 壁にめりこまないように
	var d := ray_cast(ro.x, ro.y, ro.z, fw.x, 0, fw.z, 0.9, bodyFilt)
	if d < 0.9:
		x = PL.p.x + fw.x * maxf(0, d - 0.35); z = PL.p.z + fw.z * maxf(0, d - 0.35)
	PL.inv[PL.sel] = null; propDropAt(H, x, y, z, roundf(PL.yaw / (PI / 2)) * (PI / 2), Vector3(fw.x * 0.5, 0, fw.z * 0.5)); H.thrown = false; sfx("drop"); drawInv()
	if story.get("onDrop"): story.onDrop.call(H)
func throwHeld(power: float) -> void:
	var H = held()
	if not H or PL.hide: return
	var ro := camPos(); var rd := lookDir(); var sp := 5 + power * 13
	var right := Vector3(cos(PL.yaw), 0, -sin(PL.yaw))
	var x := ro.x + rd.x * 0.35 + right.x * 0.12; var y := ro.y - 0.15 + rd.y * 0.3; var z := ro.z + rd.z * 0.35 + right.z * 0.12
	var d := ray_cast(ro.x, ro.y, ro.z, rd.x, rd.y, rd.z, 0.5, bodyFilt)
	if d < 0.5:
		x = ro.x + rd.x * (d - 0.25); y = ro.y + rd.y * (d - 0.25) - 0.1; z = ro.z + rd.z * (d - 0.25)
	PL.inv[PL.sel] = null; propDropAt(H, x, y - H.d.h / 2, z, PL.yaw, Vector3(rd.x * sp + PL.v.x * 0.5, rd.y * sp + 1.4 + power * 1.2, rd.z * sp + PL.v.z * 0.5)); sfx("throw", power); PL.swing = 0.35; drawInv(); noise(PL.p.x, PL.p.y, PL.p.z, 2, "throw")
	if story.get("onThrow"): story.onThrow.call(H)
func useHeldOnTarget() -> bool:
	var U = PL.useTarget; var H = held()
	if not U or not H: return false
	if U.prop:
		var pr = U.o
		if H.type == "key_house" and pr.type == "suitcase":
			PL.inv[PL.sel] = null; drawInv(); H.grp.visible = true; attachProp(H, pr.cont if pr.cont else pr, Vector3(0.05, 0.12, 0)); H.st = "att"; H.noPick = true; sfx("pick")
			if story.get("onKeyInCase"): story.onKeyInCase.call(pr, H)
			return true
		if H.type == "watering_can" and pr.data.get("hot"):
			pourWater(pr); return true
		return false
	if U.o.use:
		PL.swing = 0.3; return U.o.use.call(H)
	return false
func toolUse() -> bool:
	var H = held()
	if not H: return false
	if H.d.tool == "light":
		PL.light = not PL.light; sfx("click"); return true
	if H.d.tool == "alarm":
		armAlarm(H); return true
	if H.d.tool == "binoc": return true
	return false
func pourWater(pr: Dictionary) -> void:
	var H = held(); H.data.full = false; updCanLook(H); sfx("pour")
	for i in 30: later(i * 0.04, func(): puff(pr.p.x, pr.p.y + 0.1, pr.p.z, "#e8eef0", 2, 0.35, 1.6, 1.4))
	later(0.5, func():
		sfx("steam"); pr.data.hot = false; setPropHot(pr, false); toast("バールが冷えた")
		if story.get("onCool"): story.onCool.call(pr))
	drawInv()
# ---- 隠れる ----
func enterHide(h: Dictionary) -> void:
	if PL.stuck > 0: return
	nbNoteHide(h)
	PL.hide = h; PL.hideT = GT
	if h.cab:
		for L in h.cab.leaves: L.m.tgt = 0.0
	sfx("cloth" if h.under else "cab", false); ui_cls("hideView", "on", true); ui_cls("hideView", "under", not not h.under); PL.yaw = h.yaw; PL.pitch = 0.0
	if story.get("onHide"): story.onHide.call(h)
	noise(PL.p.x, PL.p.y, PL.p.z, 2, "cab")
func exitHide() -> void:
	var h = PL.hide
	if not h: return
	PL.hide = null; NB.sawHide = null; ui_cls("hideView", "on", false); teleportPlayer(h.out.x, h.out.y, h.out.z, h.yaw); sfx("cab", true)
	if h.cab:
		for L in h.cab.leaves: L.m.tgt = 1.0
		later(0.7, func():
			for L in h.cab.leaves: L.m.tgt = 0.0)
# ---- 持ち物の表示 ----
var ICONS := {}
func iconKey(it: Dictionary) -> String: return it.type + ("_full" if it.data.get("full") else "")
var inameT := 0.0
func showIName() -> void:
	var H = held()
	ui_iname((H.d.name + (("（水あり）" if H.data.get("full") else "（から）") if H.type == "watering_can" else "")) if H else "")
	inameT = 1.6
func selSlot(i: int) -> void:
	PL.sel = (i + 4) % 4; drawInv(); showIName(); sfx("tick")
