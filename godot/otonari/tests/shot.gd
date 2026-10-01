extends SceneTree
# 見比べ用のスクリーンショット：three.js 版と同じ場所・向きで撮る
# 使い方: godot --path . -s res://tests/shot.gd -- <出力フォルダ> [名前,...]
var VIEWS := [
	["lawn", Vector3(-2, 1.6, -12), Vector3(-1, 7, 24)], ["front", Vector3(0, 1.7, 4), Vector3(0, 6, 20)], ["side_w", Vector3(-26, 5, 6), Vector3(-8, 5, 22)], ["back", Vector3(6, 3, 44), Vector3(0, 5, 24)], ["aerial", Vector3(34, 32, -14), Vector3(0, 4, 24)],
	["myhouse", Vector3(3, 1.7, -8), Vector3(0, 2, -24)], ["living", Vector3(-3, 1.7, 15), Vector3(-8, 1.5, 21.5)], ["hall", Vector3(0, 1.7, 15), Vector3(0, 1.5, 30)], ["kitchen", Vector3(3, 1.7, 20), Vector3(8, 1.2, 15)], ["boiler", Vector3(3, 1.7, 31), Vector3(5, 1.3, 27)],
	["grave", Vector3(-2.6, 1.7, 26.5), Vector3(-5, 0, 23.5)], ["bedroom", Vector3(6.5, 1.7, 25.5), Vector3(9, 0.8, 22)], ["flood", Vector3(-9.3, 5.1, 22.8), Vector3(-4, 3.4, 30)], ["class", Vector3(3, 5.2, 18.5), Vector3(9.8, 4.8, 16.2)], ["range", Vector3(2.3, 5.1, 21.8), Vector3(5.5, 4.4, 25.5)], ["kids", Vector3(6.5, 5.2, 31.5), Vector3(9, 4, 29)], ["sec", Vector3(-7.4, 5.1, 17.2), Vector3(-9, 4.3, 14.4)], ["garage", Vector3(-11, 1.7, 23), Vector3(-16, 1, 15)],
	["mon", Vector3(-8.7, 4.6, 15.8), Vector3(-8.7, 4.55, 14.6)], ["rangeposter", Vector3(3.6, 5.0, 24.2), Vector3(5.8, 5.0, 24.2)]]
func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out: String = args[0] if args.size() > 0 else "/tmp"
	var only: Array = Array(args[1].split(",")) if args.size() > 1 else []
	var envm: String = args[2] if args.size() > 2 else "day"
	var g = load("res://main.tscn").instantiate()
	root.add_child(g)
	var t0 := Time.get_ticks_msec()
	while not g.BOOTED:
		await process_frame
	print("boot ms ", Time.get_ticks_msec() - t0)
	g.MANUAL = true; g.STATE = "shot"; g.setEnv(envm)
	var tweak: String = args[3] if args.size() > 3 else ""
	if "noglow" in tweak: g.env.glow_enabled = false
	if "nofog" in tweak: g.env.fog_enabled = false
	if "fogfar" in tweak: g.env.fog_depth_begin = 150.0
	if "fogexp" in tweak: g.env.fog_density = 0.3
	print("fog mode=", g.env.fog_mode, " begin=", g.env.fog_depth_begin, " end=", g.env.fog_depth_end, " curve=", g.env.fog_depth_curve, " dens=", g.env.fog_density, " hd=", g.env.fog_height_density)
	if "nograde" in tweak: g.grade_rect.visible = false
	for kv in tweak.split("+"):
		if kv.begins_with("sunK="): g.sun.light_energy = g.SUN_I * float(kv.substr(5))
		if kv.begins_with("white="): g.env.tonemap_white = float(kv.substr(6))
		if kv.begins_with("exp="): g.env.tonemap_exposure = float(kv.substr(4))
		if kv == "sunonly": g.env.ambient_light_energy = 0.0
		if kv == "ambonly": g.sun.light_energy = 0.0
		if kv.begins_with("ambE="): g.env.ambient_light_energy = float(kv.substr(5))
		if kv.begins_with("skyamb="):
			var f := float(kv.substr(7))
			for u in ["hemiSky", "hemiGround", "ambCol"]: g.sky_mat.set_shader_parameter(u, g.sky_mat.get_shader_parameter(u) * f)
	for i in 60: await process_frame
	var tag: String = ("_" + tweak.replace("=", "").replace("+", "_")) if tweak else ""
	for v in VIEWS:
		if only.size() and not (v[0] in only): continue
		g.camera.position = v[1]; g.camera.look_at(v[2]); g.step(0.016)
		for i in 4: await process_frame
		var img: Image = root.get_texture().get_image()
		img.save_png("%s/gd_%s%s.png" % [out, v[0], tag])
		print("shot ", v[0])
	quit()
