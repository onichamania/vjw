
# ================= テレビ =================
func setTV(on: bool) -> void:
	A.tvOn = on; var m: StandardMaterial3D = A.tv.mesh.surface_get_material(0)
	m.albedo_color = Color("#9ac8f0") if on else Color("#101418"); m.emission_enabled = on; m.emission = Color("#5a90c8"); m.emission_energy_multiplier = 1.0 if on else 0.0
var tvNoiseT := 0.0
# ================= 毎フレーム =================
var FROZEN := false        # テストのとき：時間を止める
var NORENDER := false
var MANUAL := false        # テストのとき：自分で step を呼ぶ
func _process(delta: float) -> void:
	if MANUAL: return
	var dt := minf(delta, 0.05)
	if FROZEN: dt = 0.0
	step(dt)
func step(dt: float) -> void:
	if STATE == "load": return
	var playing := STATE == "play" or STATE == "cut" or STATE == "caught"
	if playing or STATE == "title" or STATE == "ending": GT += dt
	updWaits(); updTexts(dt)
	if playing:
		updCharge(dt)
		if STATE == "play": updatePlayer(dt)
		PL.p = depenetrate(PL.p, PR, PL.h); updProps(dt); updMovers(dt); updNeighbor(dt); updLearning(dt); updStory(dt)
		if STATE == "play": updTarget()
		else:
			ui_prompt(""); lastPrompt = ""
		a1Update(dt)
		if A.get("tvOn"):
			tvNoiseT -= dt
			if tvNoiseT <= 0:
				tvNoiseT = 3.0; noise(-9.5, 1, 19.2, 15, "tv")
	elif STATE == "title":
		NB.anim = "wave" if int(floor(GT / 6)) % 3 == 2 else "idle"; NB.look = sin(GT * 0.3) * 0.4; animNB(dt); updMovers(dt); updTrain(dt)
		var a := GT * 0.05; camera.position = Vector3(sin(a) * 4 - 2, 1.8 + sin(GT * 0.2) * 0.2, -9 + cos(a) * 1.5); camera.look_at(Vector3(-1, 6.5, 22))
	else: updMovers(0)
	updPFX(dt); updCamera(dt)
	if CUT.cam: updCutCam(dt)
	updHand(dt)
	updAudio(dt)
	# 画面の効果
	if grade_mat:
		GRADE.red = damp(GRADE.red, 0.5 if NB.state == "catch" else 0.0, 4, dt); GRADE.vig = damp(GRADE.vig, 1.5 if NB.state == "chase" else 0.9, 3, dt)
		grade_mat.set_shader_parameter("uRed", GRADE.red); grade_mat.set_shader_parameter("uVig", GRADE.vig); grade_mat.set_shader_parameter("uFlash", GRADE.flash)
	ui_cls("hurt", "on", PL.hurtT > 0)
var GRADE := {red = 0.0, vig = 0.9, flash = 0.0}
# ================= はじまり =================
var BOOTED := false
func _ready() -> void:
	load_settings()
	ROT = S3.land
	scene = Node3D.new(); scene.name = "World"; add_child(scene)
	load_mats()
	setup_render()
	setup_ui()
	boot()
func boot() -> void:
	TOUCH = is_phone()
	setLoad(0.1); await get_tree().process_frame
	initPropDefs(); initPropDefsA1(); setLoad(0.25); await get_tree().process_frame
	# 世界
	W = MB.new(); buildA1Street(); buildA1Home(); buildA1House(); var g1 := W.build(); scene.add_child(g1); setLoad(0.55); await get_tree().process_frame; W = MB.new()
	buildDreamSet(); buildCarnival(); buildGraveEnd(); W = MB.new()
	initPFX(); buildNeighbor(); buildNavA1(); buildShark(); buildElevator(); buildTrain(); buildBricks(); buildBaseLock(); buildCamerasA1(); buildMyCar(); parkMyCar(5.6, -12, PI); placeA1Props()
	# ベッドの下に隠れる（おとなりさんの寝室。バールが見つかる）
	A.bedHide = mkBedHide(8.7, F1, 24.3, PI / 2, Box.new(7.6, F1, 23.6, 9.8, F1 + 0.9, 25), {x = 7.1, y = F1, z = 24.3}, "ベッド", underBedFind)
	for h in HIDES: h.nb = onNProperty(h.out)
	# テレビ
	addIt({box = Box.new(-9.9, 0.3, 18.5, -9.1, 1.4, 19.9), label = func(_it): return {t = "テレビを消す" if A.get("tvOn") else "テレビをつける", k = "E", n = "テレビ"},
		act = func():
			setTV(not A.get("tvOn")); sfx("click")
			if A.tvOn: noise(-9.5, 1, 19.2, 15, "tv")})
	# ここまでに作った小物（エレベーターのボタン・汽車の線路・監視室のパネルなど）をまとめて描く
	var g2 := W.build(); scene.add_child(g2); W = MB.new()
	setTV(false); buildHand(); setLoad(0.8); await get_tree().process_frame
	setEnv("evening"); drawInv()
	setLoad(1.0); await get_tree().process_frame
	showScreen("loading", false); toTitle(); BOOTED = true
	var auto = store_get("otonari-a1-auto")
	if auto != null:
		store_set("otonari-a1-auto", null)
		if auto == "new": newGame()
		elif auto == "cont": contGame()
