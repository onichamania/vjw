extends SceneTree
# 起動してタイトル → はじめから（イントロ）→ スキップ → 本編 を一通り動かし、エラーが出ないか見る
func _initialize() -> void:
	var g = load("res://main.tscn").instantiate()
	root.add_child(g)
	while not g.BOOTED:
		await process_frame
	print("STATE after boot: ", g.STATE)
	g.MANUAL = true
	for i in 60: g.step(1.0 / 30)
	g.newGame()
	for i in 90: g.step(1.0 / 30)
	print("intro: ", g.STATE, " part=", g.story.part)
	g.skipTutorial()
	for i in 60: g.step(1.0 / 30)
	print("main: ", g.STATE, " part=", g.story.part, " pl=", g.PL.p, " nb=", g.NB.state, " ", g.NB.p)
	for i in 600: g.step(1.0 / 30)
	print("after 20s: nb=", g.NB.state, " task=", g.NB.task.node if g.NB.task else null, " p=", g.NB.p)
	quit()
