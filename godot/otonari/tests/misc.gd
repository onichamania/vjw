extends "res://tests/boot.gd"
# エレベーター・サメトロン・遊園地・セーブ（three.js 版 nbmisc.js と同じ手順）
func S(tag: String) -> void:
	var p: Vector3 = g.NB.p
	print(tag, " ", T.st2(), " prompt=", g.UI.prompt.text.replace("\n", " "), " toast=", g.UI.toast.text if g.UI.toast.modulate.a > 0 else "", " nb=[%s,%s,%.1f,%.1f,%.1f] caught=%d carn=%s hide=%s" % [g.NB.state, g.NB.mode, p.x, p.y, p.z, g.story.stats.caught, g.story.inCarn, not not g.PL.hide])
func elev() -> String:
	var E = g.ELEV
	return "st=%s fl=%d doors=%s" % [E.state, E.floor, str(E.doors.map(func(d): return snappedf(d.open, 0.01)))]
func _initialize() -> void:
	await boot_main()
	# エレベーター
	g.NB.active = false; g.nbTeleport(14.5, 0, 35, 0); g.teleportPlayer(0.4, 0.31, 20.2, -PI / 2); T.sim(0.3)
	print("call ", T.lookIt("エレベーターを呼ぶ"), " ", T.E()); T.sim(4); print("elev ", elev())
	print(T.walk([[3.1, 20.2]])); g.PL.yaw = -PI / 2; print("panel ", T.lookIt("階へ"), " ", T.E())
	T.sim(9); S("in elev"); print("elev ", elev())
	print(T.walk([[1.1, 20.2], [0.4, 22]])); S("2F out")
	# サメトロン
	g.teleportPlayer(-6, 3.2, 29, PI); T.sim(0.5); S("in water")
	for i in 10:
		T.sim(1)
		if g.PL.p.z < 12: break
	S("after shark")
	# つかまる → 遊園地
	g.NB.active = true; g.NB.state = "routine"; g.nbTeleport(-3.2, 0.3, 16.3, 0); g.teleportPlayer(-4.8, 0.31, 19.5, PI); g.PL.yaw = atan2(1.6, 3.2)
	for i in 30:
		T.sim(0.5)
		if i % 4 == 0: print("nb ", [g.NB.state, g.STATE, g.story.inCarn])
		if g.story.inCarn: break
	S("carnival?"); T.sim(1); print("bedHide ", not not g.CARN.bedHide)
	g.enterHide(g.CARN.bedHide); T.sim(8)
	for i in 20:
		T.sim(1)
		if not g.story.inCarn and g.STATE == "play": break
	S("after carnival")
	# セーブ・ロード
	g.pickUp(g.P.lockpick); g.saveGame(); var inv0 = g.PL.inv.map(func(p): return p.id if p else null)
	g.store_set("otonari-a1-auto", "cont"); g.queue_free(); await process_frame
	g = load("res://main.tscn").instantiate(); root.add_child(g)
	for i in 600:
		await process_frame
		if g.BOOTED and g.STATE == "play": break
	g.MANUAL = true; g.NORENDER = true; T = load("res://tests/T.gd").new(g); T.sim(0.5)
	S("loaded"); print("inv before ", inv0)
	quit()
