extends SceneTree
# スマホの画面（タッチ操作のボタン）
func snap(name: String) -> void:
	for i in 3: await process_frame
	root.get_texture().get_image().save_png("%s/gt_%s.png" % [OS.get_cmdline_user_args()[0], name]); print("shot ", name)
func _initialize() -> void:
	var g = load("res://main.tscn").instantiate()
	root.add_child(g)
	while not g.BOOTED:
		await process_frame
	g.MANUAL = true; g.BODY.touch = true
	for i in 60:
		g.step(1.0 / 30); await process_frame
	await snap("title")
	g.store_set(g.SAVEKEY, null); g.newGame()
	for i in 40:
		for k in 30: g.step(1.0 / 30)
		if g.story.part == "move" and g.STATE == "play": break
	g.skipTutorial()
	for i in 40: g.step(1.0 / 30)
	var T = load("res://tests/T.gd").new(g)
	g.teleportPlayer(-8.3, 3.5, 15.6, 0); T.look(g.P.lockpick.p.x, g.P.lockpick.p.y, g.P.lockpick.p.z)
	for i in 30: g.step(1.0 / 30); await process_frame
	await snap("hud")
	g.pauseGame(); g.step(0.016)
	await snap("pause")
	g.resumeGame(); g.openSettings(); g.step(0.016)
	await snap("settings")
	g.showScreen("settings", false); g.showScreen("help", true); g.step(0.016)
	await snap("help")
	quit()
