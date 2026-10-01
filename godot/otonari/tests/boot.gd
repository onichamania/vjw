extends SceneTree
# テストのはじまり：ゲームを読みこんで、本編まで進める
var g
var T
func boot_main() -> void:
	g = load("res://main.tscn").instantiate()
	root.add_child(g)
	while not g.BOOTED:
		await process_frame
	g.MANUAL = true; g.NORENDER = true
	T = load("res://tests/T.gd").new(g)
	g.store_set(g.SAVEKEY, null)
	g.newGame()
	for i in 30:
		T.sim(2)
		if g.story.part == "move" and g.STATE == "play": break
	g.skipTutorial(); T.sim(1)
	print("main ", T.st2())
