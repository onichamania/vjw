extends "res://tests/boot.gd"
# 攻略ルート2：ベル → 墓 → 先生 → 黒板 → 射的 → 銀の鍵 → 削岩機 → 銅の鍵 → 地下室
func _initialize() -> void:
	await boot_main()
	g.NB.active = false; g.nbTeleport(14.5, 0, 35, 0)
	T.tp(8.6, 3.5, 22.1); T.sim(0.3); print("bell2 ", T.lookP("bell2"), " ", T.E()); print("bell ", T.st2())
	T.tp(-5, 0.31, 23, 0); T.sim(0.3); T.sel("bell2"); print("pole ", T.lookIt("ベルをかける"), " ", T.use()); T.sim(1.5)
	print("shovel ", T.lookP("shovel"), " ", T.E()); print("shovel ", T.st2())
	for i in 3:
		print("dig ", T.lookIt("土を掘る"), " ", T.use()); T.sim(0.6)
	T.sim(0.5); T.tp(-4.5, -0.4, 23.9, PI); T.sim(0.6); print("in pit ", T.st2()); print("coffin ", T.lookIt("ふたを開ける"), " ", T.E()); T.sim(1.5)
	print("teacher ", T.lookP("teacher"), " ", T.E()); print("teacher ", T.st2())
	print(T.walk([[-4.5, 22.9]], 6, false, true)); print("climb ", T.st2())
	T.tp(3, 3.5, 15.5, -PI / 2); T.sim(0.3); print(T.walk([[8.4, 15.3]])); g.PL.yaw = -PI / 2; T.sel("teacher"); g.dropHeld(); T.sim(1.2)
	print("teacherPlaced ", g.teacherPlaced())
	T.tp(7.6, 3.5, 16.5, -PI / 2); T.sim(0.3)
	print("mag5 ", T.lookP("mag0"), " ", T.E())
	print("drawer1 ", T.lookIt("先生の机の引き出し"), " ", T.E()); T.sim(0.8); print("mag3 ", T.lookP("mag4"), " ", T.E()); print("mags ", T.st2())
	g.A.tdraw[0].it.act.call(); T.sim(0.6)
	var b = g.A.tdraw[1].it.box
	print("drawer2 ", T.look((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2), " ", T.E()); T.sim(0.8); print("mag8 ", T.lookP("mag6"), " ", T.E()); print("mags2 ", T.st2())
	T.tp(8.9, 3.5, 16.5, -PI / 2); T.sim(0.3)
	var ids := ["mag0", "mag4", "mag6"]
	for i in 3:
		T.sel(ids[i]); var S = g.A.slots[i]; print("slot ", i, " ", T.look(9.78, S.y, S.z), " ", T.use()); T.sim(0.3)
	T.sim(1); print("rifleGiven ", g.A.get("rifleGiven"))
	print("rifle ", T.lookP("rifle"), " ", T.E()); print("rifle ", T.st2())
	T.tp(2.7, 3.5, 24.2, -PI / 2); T.sim(0.3); T.sel("rifle"); print("stand ", T.lookIt("銃を台に置く"), " ", T.use()); T.sim(0.5); print("stand has=", g.A.stand.has, " on=", g.A.stand.on, " near=", g.nearStand())
	for k in 80:
		var T0 = null
		for t in g.A.targets:
			if t.up > 0.9 and not t.hit:
				T0 = t; break
		if T0:
			T.look(5.4, 3.5 + 0.75, T0.z); g.useDown(); g.useUp()
		T.sim(0.3)
		if g.A.stand.score >= 300: break
	print("score ", g.A.stand.score)
	T.sim(1.5); var kk = g.P.skey; print("skey ", kk.p, " hidden=", kk.hidden, " np=", kk.noPick)
	T.tp(2.7, 3.5, 22.6, PI); T.sim(0.3); print("skey ", T.lookP("skey"), " ", T.E()); print("skey ", T.st2())
	T.tp(2.8, 3.5, 25.9, PI); T.sim(0.3); T.sel("skey"); print("gate ", T.lookIt("銀"), " ", T.use()); T.sim(0.5); print("gate open ", T.lookIt("開ける|通る|門"), " ", T.E()); T.sim(0.8)
	print(T.walk([[3.4, 26.9]]), " ", T.door()); print(T.walk([[3.6, 28.5], [5.2, 29.5]])); print("storage ", T.st2())
	T.tp(7.6, 3.5, 22.2, -PI / 2); T.sim(0.3); print("jack ", T.lookP("jack"), " ", T.E())
	T.tp(5.2, 3.5, 29.5, -PI / 2); T.sim(0.3); T.sel("jack"); print("bricks ", T.lookIt("削岩機"), " ", T.use()); T.sim(3); print("broken ", g.A.bricks.broken)
	print(T.walk([[6.8, 29.5], [7.4, 29.5]])); print("ckey ", T.lookP("ckey"), " ", T.E()); print("ckey ", T.st2())
	T.tp(-7.6, 0.31, 20.2, 0); T.sim(0.3)
	var hm: Vector3 = g.P.hammer.p; T.tp(hm.x + 1.2, 0.12, hm.z, PI / 2); T.sim(0.3); print("hammer ", T.lookP("hammer"), " ", T.E())
	T.tp(-7.6, 0.31, 20.2, 0); T.sim(0.3); T.sel("hammer")
	for bb in [[-7.6, 1.0], [-7.6, 1.8]]:
		print("board ", T.look(bb[0], bb[1], 21.88), " ", T.use()); T.sim(1)
	T.sel("ckey"); print("lock ", T.lookIt("銅の鍵"), " ", T.use()); T.sim(1); print("door ", T.lookIt("開ける"), " ", T.E()); T.sim(2); print("end ", T.st2())
	T.sim(30); print("final ", T.st2())
	print("RESULT ", "PASS" if g.STATE == "ending" else "FAIL")
	quit()
