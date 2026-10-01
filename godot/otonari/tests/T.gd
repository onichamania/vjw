extends RefCounted
# テスト用の道具（three.js 版の nbtest.js の PAGE_T と同じもの）
var g
var log_lines := []
func _init(game) -> void: g = game
func st(n: int) -> void:
	for i in n: g.step(1.0 / 30)
func sim(sec: float) -> void: st(int(sec * 30))
func walk(pts: Array, lim := 25.0, run := false, jump := false) -> String:
	for q in pts:
		var x: float = q[0]; var z: float = q[1]; var t := 0.0; var best := 1e9; var bestT := 0.0
		while t < lim:
			var p: Vector3 = g.PL.p; var dx := x - p.x; var dz := z - p.z; var d := Vector2(dx, dz).length()
			if d < 0.3: break
			if d < best - 0.05:
				best = d; bestT = t
			if t - bestT > 3:
				g.IN.f = 0.0; return "stuck %s at %s" % [str(q), str(p)]
			g.PL.yaw = atan2(-dx, -dz); g.IN.f = 1.0; g.IN.run = run
			if jump: g.IN.jump = true
			g.step(1.0 / 30); t += 1.0 / 30
		g.IN.f = 0.0; g.IN.run = false
		if t >= lim: return "timeout %s at %s" % [str(q), str(g.PL.p)]
	return "ok %s" % str(g.PL.p)
func desc(t) -> String:
	if not t: return "none"
	if t.k == "prop": return "prop:" + str(t.o.id)
	var l = t.o.label.call(g.held()) if t.o.label else null
	return "it:" + (str(l.get("t")) if l else "?")
func look(x: float, y: float, z: float) -> String:
	g.step(0)
	var c: Vector3 = g.camPos(); var dx := x - c.x; var dy := y - c.y; var dz := z - c.z
	g.PL.yaw = atan2(-dx, -dz); g.PL.pitch = atan2(dy, Vector2(dx, dz).length())
	g.step(0); g.updTarget()
	return desc(g.PL.target)
func E() -> String:
	g.updTarget(); var t = g.PL.target; g.doInteract()
	return desc(t)
func use() -> String:
	g.updTarget(); var u = g.PL.useTarget; g.useDown(); g.useUp()
	return ("use:" + str(u.l)) if u else "nouse"
func door() -> String:
	var p: Vector3 = g.PL.p; var best = null; var bd := 2.6
	for d in g.DOORS:
		var dd := Vector2(d.o.x - p.x, d.o.z - p.z).length()
		if dd < bd and absf(d.y - p.y) < 1.5 and d.m.tgt < 0.5:
			bd = dd; best = d
	if not best: return "nodoor"
	var r := look(best.o.x, best.y + 1.1, best.o.z); var e := E(); st(25)
	return "%s -> %s open=%.2f lock=%s" % [r, e, best.m.t, str(best.lock)]
func lookIt(re: String) -> String:
	var rx := RegEx.new(); rx.compile(re); var H = g.held(); var p: Vector3 = g.PL.p; var best = null; var bd := 1e9
	for it in g.ITS:
		if not it.on or not it.box: continue
		var l = it.label.call(H) if it.label else null
		var u = it.useLabel.call(H) if H and it.useLabel else null
		var txt := "%s|%s|%s" % [str(l.get("t")) if l else "", str(l.get("n")) if l else "", str(u) if u else ""]
		if rx.search(txt) == null: continue
		var b = it.box; var cx: float = (b.x0 + b.x1) / 2; var cy: float = (b.y0 + b.y1) / 2; var cz: float = (b.z0 + b.z1) / 2
		var d := Vector3(cx - p.x, cy - p.y - 1.5, cz - p.z).length()
		if d < bd:
			bd = d; best = [cx, cy, cz]
	if not best: return "notfound"
	return look(best[0], best[1], best[2]) + " d=%.2f" % bd
func lookP(id: String, dy := 0.0) -> String:
	var pr = g.propById(id)
	if not pr: return "noprop"
	if pr.lying: return look(pr.p.x, pr.p.y + dy, pr.p.z - pr.d.h / 2)
	return look(pr.p.x, pr.p.y + pr.d.h / 2 + dy, pr.p.z)
func tp(x: float, y: float, z: float, yaw := 0.0) -> void: g.teleportPlayer(x, y, z, yaw)
func sel(id: String) -> int:
	for i in 4:
		if g.PL.inv[i] and g.PL.inv[i].id == id:
			g.selSlot(i); return i
	return -1
func st2() -> String:
	return "st=%s part=%s pl=%s inv=%s" % [g.STATE, g.story.part, str(g.PL.p.snapped(Vector3(0.01, 0.01, 0.01))), str(g.PL.inv.map(func(p): return p.id if p else null))]
