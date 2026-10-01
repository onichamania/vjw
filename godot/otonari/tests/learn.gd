extends "res://tests/boot.gd"
# 学習：入った所をふさぐ（three.js 版 nblearn.js と同じ手順）
func _initialize() -> void:
	await boot_main()
	g.nbTeleport(14.5, 0, 35, 0); g.NB.state = "routine"
	T.tp(4, 0.15, 34.2, 0); T.sim(0.3); print("back ", T.door()); print(T.walk([[4, 31], [3.2, 29]]))
	print("used ", g.story.usedEntry, " ", g.LEARN)
	g.story.caught.call(); T.sim(3); g.enterHide(g.CARN.bedHide)
	for i in 40:
		T.sim(1)
		if g.STATE == "play" and not g.story.inCarn: break
	print("after ", T.st2(), " sub ", g.UI.sub.text)
	g.NB.active = false; g.nbTeleport(14.5, 0, 35, 0)
	T.tp(4, 0.15, 34.2, 0); T.sim(0.3); print("back again ", T.door(), " ", g.UI.toast.text)
	quit()
