extends "res://tests/boot.gd"
# 400秒ほうっておいて、おとなりさんが引っかからないか（three.js 版 nbsoak.js と同じ手順）
func _initialize() -> void:
	await boot_main()
	var last = null; var stuckT := 0.0; var maxStuck := 0.0; var where := ""; var tasks := {}
	for i in 30 * 400:
		g.step(1.0 / 30)
		var p: Vector3 = g.NB.p
		if last != null and Vector2(p.x - last.x, p.z - last.z).length() < 0.002 and g.NB.state != "routine_do" and (g.NB.anim == "walk" or g.NB.anim == "run"):
			stuckT += 1.0 / 30
			if stuckT > maxStuck:
				maxStuck = stuckT; where = "%.1f,%.1f,%.1f %s %s" % [p.x, p.y, p.z, g.NB.state, str(g.NB.task.node if g.NB.task else null)]
		else: stuckT = 0.0
		last = p
		if g.NB.task: tasks[g.NB.task.node] = 1
		if i % (30 * 20) == 0: print("%ds %s %s %.1f,%.1f,%.1f task=%s" % [i / 30, g.NB.state, g.NB.anim, p.x, p.y, p.z, str(g.NB.task.node if g.NB.task else null)])
	print("maxStuck %.1f at %s" % [maxStuck, where]); print("tasks ", ",".join(tasks.keys()))
	quit()
