extends "res://tests/boot.gd"
# つかまる → 遊園地の悪夢 → もどったあと、スマホのボタンが見えるか（three.js 版 nbcarnbtn.js と同じ手順）
func vis_on(c: Control) -> bool:
	while c:
		if not c.visible: return false
		c = c.get_parent() as Control
	return true
func vis() -> String:
	var n := 0
	for b in g.UI.tbtns.values() + [g.UI.hintBtn, g.UI.pauseBtn]:
		if vis_on(b): n += 1
	return "cut=%s st=%s use=%s btns=%d" % [g.BODY.cut, g.STATE, vis_on(g.UI.tbtns.tUse), n]
func _initialize() -> void:
	await boot_main()
	g.BODY.touch = true; T.sim(1); print("before ", vis())
	for round in [1, 2]:
		g.NB.active = true; g.NB.state = "routine"; g.nbTeleport(-3.2, 0.3, 16.3, 0); g.teleportPlayer(-4.8, 0.31, 19.5, PI); g.PL.yaw = atan2(1.6, 3.2)
		for i in 40:
			T.sim(0.5)
			if g.story.stats.caught >= round and (g.story.get("inCarn") or round > 1): break
		print(" caught=", g.story.stats.caught, " inCarn=", g.story.get("inCarn"), " st=", g.STATE)
		if g.story.get("inCarn"):
			T.sim(2); g.enterHide(g.CARN.bedHide)
		for i in 40:
			T.sim(1)
			if not g.story.get("inCarn") and g.STATE == "play": break
		T.sim(1); print("after round ", round, " ", vis(), " ", T.st2())
	quit()
