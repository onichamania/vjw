extends SceneTree
# 画面の見た目：タイトル・HUD・おとなりさん
func snap(name: String) -> void:
	for i in 3: await process_frame
	root.get_texture().get_image().save_png("%s/gu_%s.png" % [OS.get_cmdline_user_args()[0], name]); print("shot ", name)
func _initialize() -> void:
	var g = load("res://main.tscn").instantiate()
	root.add_child(g)
	while not g.BOOTED:
		await process_frame
	g.MANUAL = true
	for i in 60:
		g.step(1.0 / 30); await process_frame
	await snap("title")
	g.store_set(g.SAVEKEY, null); g.newGame()
	for i in 90: g.step(1.0 / 30)
	await snap("intro")
	for i in 40:
		for k in 30: g.step(1.0 / 30)
		if g.story.part == "move" and g.STATE == "play": break
	g.skipTutorial()
	for i in 40: g.step(1.0 / 30)
	g.toast("テストのお知らせ")
	g.step(0.016)
	await snap("hud")
	# おとなりさんを目の前に
	g.NB.active = false; g.nbTeleport(-5.5, 0.3, 17.5, PI / 2); g.NB.anim = "idle"; g.teleportPlayer(-2.6, 0.3, 17.5, PI / 2)
	var T = load("res://tests/T.gd").new(g); T.look(-5.5, 1.5, 17.5)
	for i in 30: g.step(1.0 / 30)
	await snap("nb")
	g.NB.anim = "run"; g.NB.speed = 4.0; g.NB.state = "chase"
	for i in 7: g.step(1.0 / 30)
	await snap("nbrun")
	# 持ち物
	g.teleportPlayer(-8.3, 3.5, 15.6, 0); T.look(g.P.lockpick.p.x, g.P.lockpick.p.y, g.P.lockpick.p.z)
	g.step(0.016)
	await snap("prompt")
	T.E(); for i in 15: g.step(1.0 / 30)
	await snap("inv")
	g.pauseGame(); g.step(0.016)
	await snap("pause")
	g.resumeGame(); g.openSettings(); g.step(0.016)
	await snap("settings")
	quit()
