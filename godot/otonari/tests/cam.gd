extends "res://tests/boot.gd"
# 監視カメラのレバーのテスト（three.js 版 nbcam.js と同じ手順）
func alarmFrames() -> int:
	var a := 0
	for i in 90:
		g.step(1.0 / 30)
		if g.NB.state == "investigate": a += 1
	return a
func _initialize() -> void:
	await boot_main()
	g.NB.active = false; g.nbTeleport(14.5, 0, 35, 0)
	T.tp(-8.55, 3.5, 16.8, PI); T.sim(0.6)
	print("lever ", T.lookIt("監視カメラを切る"))
	print("E ", T.E(), " off= ", g.A.camsOff, " toast ", g.UI.toast.text)
	# カメラの前に立っても鳴らない
	g.NB.active = true; g.NB.sit = null; g.NB.task = null; g.NB.state = "routine"; g.nbTeleport(14.5, 0, 35, 0); g.teleportPlayer(0, 0.31, 17, 0)
	print("alarm frames while off ", alarmFrames())
	# おとなりさんが入れ直しに来る
	g.teleportPlayer(3.4, 0.31, -28, 0); g.A.camsCheckAt = g.GT + 0.5; g.NB.task = null; g.NB.state = "routine"; g.NB.sit = null; g.nbTeleport(0, 0.3, 19.5, 0)
	var res := "never"
	for i in 60:
		T.sim(1)
		var p: Vector3 = g.NB.p; var tk = g.NB.task.node if g.NB.task else null
		if not g.A.camsOff:
			res = "turned on after %ds at %.1f,%.1f,%.1f" % [i + 1, p.x, p.y, p.z]; break
		if i % 10 == 0: print(" nb off=%s task=%s p=%.1f,%.1f,%.1f" % [g.A.camsOff, str(tk), p.x, p.y, p.z])
	print("NB ", res)
	# カメラがまた動く
	g.NB.active = true; g.NB.state = "routine"; g.NB.task = null; g.nbTeleport(14.5, 0, 35, 0); g.teleportPlayer(0, 0.31, 17, 0)
	print("alarm frames after on ", alarmFrames())
	# セーブ・ロード（切った状態）
	g.teleportPlayer(-8.55, 3.5, 16.8, PI); T.sim(0.3); T.lookIt("監視カメラを切る"); T.E(); T.sim(0.2); g.saveGame()
	g.store_set("otonari-a1-auto", "cont"); g.queue_free(); await process_frame
	g = load("res://main.tscn").instantiate(); root.add_child(g)
	for i in 600:
		await process_frame
		if g.BOOTED and g.STATE == "play": break
	g.MANUAL = true; g.NORENDER = true; T = load("res://tests/T.gd").new(g)
	print("after load st=", g.STATE, " off= ", g.A.camsOff, " checkIn %.1f" % (g.A.camsCheckAt - g.GT), " ", T.st2())
	quit()
