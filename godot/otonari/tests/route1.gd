extends "res://tests/boot.gd"
# 攻略ルート1：ボイラーで凍らせる → 監視室のピッキング道具 → ハンマー → 地下室
func _initialize() -> void:
	await boot_main()
	g.NB.active = false; g.nbTeleport(14.5, 0, 35, 0)
	T.tp(4, 0.15, 34.2, 0); T.sim(0.3); print("backdoor ", T.door())
	print(T.walk([[4, 31], [3.2, 29]]))
	var vp: Vector3 = g.A.furn.valve.global_position
	print("look valve ", T.look(vp.x, vp.y, vp.z), " E ", T.E())
	T.sim(4); print("frozen ", g.A.water.frozen)
	T.tp(-3.2, 0.31, 16.3, 0); T.sim(0.2)
	print(T.walk([[-4.8, 17.5], [-2.6, 20.2], [-2.6, 21.4], [-9.3, 21.4], [-9.3, 22.6]])); print("top ", T.st2())
	print(T.walk([[-9.2, 24.4], [-4.8, 25.8], [-4.6, 30.4], [-2.7, 30.9]])); print("crossed ", T.st2())
	print("flood door ", T.door())
	print(T.walk([[-0.6, 30.9], [0.4, 24.5], [1.1, 20.2], [0, 19.8]])); print("2f hall ", T.st2())
	print("liv2 door ", T.door())
	print(T.walk([[-1.4, 19.8], [-3, 19.8], [-5.5, 19.7]])); print("ante door ", T.door())
	print(T.walk([[-7.8, 19.7], [-8.55, 18.9]])); print("sec door ", T.door())
	print(T.walk([[-8.55, 16.4]])); print("sec ", T.st2())
	var lp: Vector3 = g.P.lockpick.p
	print("look ", T.look(lp.x, lp.y + 0.03, lp.z), " E ", T.E()); print("got lockpick ", T.st2())
	var hm: Vector3 = g.P.hammer.p
	T.tp(hm.x + 1.2, 0.12, hm.z, PI / 2); T.sim(0.3); print("look ", T.look(hm.x, hm.y + 0.03, hm.z), " E ", T.E()); print("hammer ", T.st2())
	T.tp(-7.6, 0.31, 20.2, 0); T.sim(0.3)
	T.sel("hammer")
	for bb in [[-7.6, 1.0], [-7.6, 1.8]]:
		print("look board ", T.look(bb[0], bb[1], 21.88), " use ", T.use()); T.sim(1.5)
	print("boards ", g.A.boards.map(func(b): return b.on))
	T.sel("lockpick"); print("look lock ", T.look(-7.2, 1.35, 21.85), " use ", T.use()); T.sim(3); print("lock ", g.A.clock.locked)
	print("look door ", T.look(-7.6, 1.1, 22), " E ", T.E()); T.sim(1); print("open ", T.st2())
	T.sim(3); T.sim(6); T.sim(8); print("ending ", T.st2()); T.sim(10); print("ending2 ", T.st2())
	print("RESULT ", "PASS" if g.STATE == "ending" else "FAIL")
	quit()
