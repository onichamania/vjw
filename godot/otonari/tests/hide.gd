extends "res://tests/boot.gd"
# 隠れる・見失うのテスト（three.js 版 nbhidetest.js と同じ手順）
func ST() -> String:
	var p: Vector3 = g.NB.p
	return "%s %.1f,%.1f,%.1f caught=%d blind=%.1f saw=%s" % [g.NB.state, p.x, p.y, p.z, g.story.stats.caught, g.NB.get("blindT", 0.0), str(not not g.NB.get("sawHide"))]
func nearHide() -> Dictionary:
	var best = g.HIDES[0]
	for b in g.HIDES:
		if Vector2(b.out.x - 7.2, b.out.z - 23.2).length() < Vector2(best.out.x - 7.2, best.out.z - 23.2).length(): best = b
	return best
func _initialize() -> void:
	await boot_main()
	var hs := []
	for i in g.HIDES.size():
		var h = g.HIDES[i]
		hs.append("%d:%s[%.1f,%.1f,%.1f] nb=%s%s" % [i, h.get("name", ""), h.out.x, h.out.y, h.out.z, str(h.get("nb")), " under" if h.get("under") else ""])
	print(" | ".join(hs))
	# A：つかれて見失う
	g.NB.active = true; g.NB.sit = null; g.NB.task = null; g.NB.path = []; g.nbTeleport(-12, 0, 10.5, PI / 2); g.NB.state = "routine"; g.teleportPlayer(-6, 0, 10.5, PI / 2)
	var first = null; var r := "never lost; state="
	for i in 30 * 30:
		var nb: Vector3 = g.NB.p; var dir := signf(g.PL.p.x - nb.x); if dir == 0: dir = 1
		var tx := nb.x + dir * 6
		if tx > 16 or tx < -16: tx = nb.x - dir * 6
		g.teleportPlayer(tx, 0, 10.5, 0); g.step(1.0 / 30)
		if g.NB.state == "chase" and first == null: first = i / 30.0
		if first != null and g.NB.state != "chase":
			r = "chase start %.1fs, lost after %.1fs state=%s blind=%.1f" % [first, i / 30.0 - first, g.NB.state, g.NB.blindT]; break
	if r.begins_with("never"): r += g.NB.state
	print("A ", r); T.sim(5); print("A after ", ST())
	# B：見えない所へ逃げる
	for k in 3:
		g.NB.state = "routine"; g.NB.blindT = 0.0; g.nbTeleport(0, 0.3, 19.5, 0); g.teleportPlayer(0, 0.31, 23, PI)
		for i in 20:
			T.sim(0.2)
			if g.NB.state == "chase": break
		g.teleportPlayer(7.2, 0.31, 23.2, 0); T.sim(1.6)
		var h := nearHide(); g.enterHide(h)
		print("B%d hid in %s saw=%s" % [k, h.get("name", ""), str(not not g.NB.get("sawHide"))])
		for i in 12: T.sim(1)
		print("B%d after 12s %s" % [k, ST()]); g.exitHide(); T.sim(0.3)
	# C：目の前で隠れる
	g.NB.active = true; g.NB.sit = null; g.NB.task = null; g.NB.path = []; g.NB.state = "routine"; g.NB.blindT = 0.0
	var hc := nearHide(); g.teleportPlayer(hc.out.x, hc.out.y, hc.out.z, 0); g.nbTeleport(8.6, 0.3, 21.9, atan2(hc.out.x - 8.6, hc.out.z - 21.9))
	for i in 10:
		T.sim(0.2)
		if g.NB.state == "chase": break
	g.enterHide(hc); print("C saw=", not not g.NB.get("sawHide"))
	for i in 8:
		T.sim(1)
		if g.NB.state == "catch" or g.STATE == "caught": break
	print("C after ", ST(), " ", g.STATE)
	quit()
