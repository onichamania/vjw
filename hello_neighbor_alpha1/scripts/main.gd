extends Node3D
## Director: builds the world, bakes navigation, runs menus and cut-scenes.

var env: Environment
var night_env: Environment
var world_env: WorldEnvironment
var sun: DirectionalLight3D
var sky_mat: ShaderMaterial
var nav_region: NavigationRegion3D
var items_root: Node3D
var house: NeighborHouse
var phouse: PlayerHouse
var special: SpecialAreas
var player: Player
var neighbor: Neighbor
var hud: Hud
var cut_cam: Camera3D
var menu_t := 0.0
var busy := false
var skip_requested := false
var chasing := false
var intro_car: Node3D
var nav_baked := false
var _orbit := true


func _ready() -> void:
	Game.main = self
	_make_environment()
	nav_region = NavigationRegion3D.new()
	nav_region.name = "Navigation"
	add_child(nav_region)
	items_root = Node3D.new()
	items_root.name = "Dynamic"
	add_child(items_root)
	# World
	var street_root := Node3D.new()
	street_root.name = "Street"
	nav_region.add_child(street_root)
	Street.build(street_root)
	house = NeighborHouse.new()
	house.name = "NeighborHouse"
	house.position = Vector3(12, 0, -12)
	house.rotation.y = PI
	nav_region.add_child(house)
	Game.house = house
	phouse = PlayerHouse.new()
	phouse.name = "PlayerHouse"
	phouse.position = Vector3(-5, 0, 12)
	nav_region.add_child(phouse)
	Game.player_house = phouse
	house.build(items_root)
	phouse.build(items_root)
	special = SpecialAreas.new()
	special.name = "Special"
	add_child(special)
	special.build()
	_nav_links()
	# Actors
	player = Player.new()
	player.name = "Player"
	add_child(player)
	Game.player = player
	neighbor = Neighbor.new()
	neighbor.name = "Neighbor"
	add_child(neighbor)
	Game.neighbor = neighbor
	neighbor.home_spot = house.gpos(Vector3(15.0, NeighborHouse.F1 + 0.05, 4.0))
	neighbor.reset_to(neighbor.home_spot)
	neighbor.state = Neighbor.S.IDLE
	cut_cam = Camera3D.new()
	cut_cam.name = "CutCam"
	cut_cam.far = 400.0
	add_child(cut_cam)
	hud = Hud.new()
	hud.name = "HUD"
	add_child(hud)
	Game.hud = hud
	hud.menu_new_game.connect(_on_new_game)
	hud.menu_resume.connect(_resume)
	hud.menu_quit_to_title.connect(_quit_to_title)
	apply_quality()
	_bake_nav()
	Game.play_ambience("amb_suburb")
	if "--autotest" in OS.get_cmdline_user_args():
		add_child(load("res://tools/autotest.gd").new())
		return
	if Game.has_meta("autostart") and Game.get_meta("autostart"):
		Game.set_meta("autostart", false)
		call_deferred("_on_new_game")
	else:
		_show_menu()


# ---------------------------------------------------------- environment --
func _make_environment() -> void:
	sky_mat = ShaderMaterial.new()
	sky_mat.shader = load("res://shaders/sky.gdshader")
	var sky := Sky.new()
	sky.sky_material = sky_mat
	sky.radiance_size = Sky.RADIANCE_SIZE_128
	env = Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 1.0
	env.ambient_light_energy = 0.75
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.05
	env.tonemap_white = 6.0
	env.glow_enabled = true
	env.glow_intensity = 0.35
	env.glow_bloom = 0.04
	env.glow_hdr_threshold = 1.3
	env.fog_enabled = true
	env.fog_light_color = Color(0.72, 0.82, 0.93)
	env.fog_density = 0.0035
	env.fog_aerial_perspective = 0.4
	env.fog_sky_affect = 0.15
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.12
	env.adjustment_contrast = 1.04
	world_env = WorldEnvironment.new()
	world_env.environment = env
	add_child(world_env)
	sun = DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-48, -38, 0)
	sun.light_color = Color(1.0, 0.95, 0.86)
	sun.light_energy = 1.3
	sun.shadow_enabled = true
	sun.shadow_blur = 1.2
	sun.directional_shadow_max_distance = 80.0
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.shadow_bias = 0.03
	sun.shadow_normal_bias = 1.2
	add_child(sun)
	# Night variant for the nightmare and the grave.
	var nsky_mat := ShaderMaterial.new()
	nsky_mat.shader = sky_mat.shader
	nsky_mat.set_shader_parameter("night", 1.0)
	var nsky := Sky.new()
	nsky.sky_material = nsky_mat
	night_env = Environment.new()
	night_env.background_mode = Environment.BG_SKY
	night_env.sky = nsky
	night_env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	night_env.ambient_light_color = Color(0.18, 0.2, 0.32)
	night_env.ambient_light_energy = 0.6
	night_env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	night_env.glow_enabled = true
	night_env.glow_intensity = 0.8
	night_env.glow_bloom = 0.1
	night_env.fog_enabled = true
	night_env.fog_light_color = Color(0.05, 0.05, 0.1)
	night_env.fog_density = 0.03
	night_env.adjustment_enabled = true
	night_env.adjustment_saturation = 1.2


func apply_quality() -> void:
	var q := int(Game.settings.quality)
	var forward := RenderingServer.get_current_rendering_method() == "forward_plus"
	env.ssao_enabled = forward and q >= 1
	env.ssao_radius = 1.2
	env.ssao_intensity = 1.6
	env.ssil_enabled = forward and q >= 2
	env.sdfgi_enabled = forward and q >= 2
	env.sdfgi_use_occlusion = true
	env.glow_enabled = q >= 1 or not forward
	sun.directional_shadow_max_distance = 60.0 if q == 0 else 90.0
	RenderingServer.directional_shadow_atlas_set_size(2048 if q == 0 else 4096, true)


func set_night(on: bool) -> void:
	world_env.environment = night_env if on else env
	sun.visible = not on
	var moon := special.grave.get_node_or_null("Moon")
	if moon:
		moon.visible = on


# ------------------------------------------------------------ navigation --
func _bake_nav() -> void:
	var nm := NavigationMesh.new()
	nm.geometry_parsed_geometry_type = NavigationMesh.PARSED_GEOMETRY_STATIC_COLLIDERS
	nm.geometry_collision_mask = 1
	nm.cell_size = 0.1
	nm.cell_height = 0.1
	nm.agent_height = 1.8
	nm.agent_radius = 0.4
	nm.agent_max_climb = 0.3
	nm.agent_max_slope = 46.0
	nm.region_min_size = 4.0
	nm.edge_max_error = 1.2
	nm.filter_baking_aabb = AABB(Vector3(-24, -1.5, -46), Vector3(48, 8.3, 70))
	nav_region.navigation_mesh = nm
	NavigationServer3D.map_set_cell_size(get_world_3d().navigation_map, 0.1)
	NavigationServer3D.map_set_cell_height(get_world_3d().navigation_map, 0.1)
	nav_region.bake_finished.connect(func():
		nav_baked = true
		for b in get_tree().get_nodes_in_group("nav_blockers"):
			(b as CollisionObject3D).collision_layer = 0
		print("Navigation baked: ", nm.get_polygon_count(), " polygons"))
	nav_region.bake_navigation_mesh(true)


func _nav_links() -> void:
	# One-way shortcuts the Neighbor may use: jumping down through the hole in
	# the upstairs bathroom and out of the children's room side door.
	var links := [
		[Vector3(22.85, NeighborHouse.F2, 17.4), Vector3(22.85, 0.0, 20.6)],
		[Vector3(0.7, NeighborHouse.F2, 15.15), Vector3(-1.9, 0.0, 15.15)],
	]
	for l in links:
		var nl := NavigationLink3D.new()
		nl.bidirectional = false
		add_child(nl)
		nl.start_position = house.gpos(l[0])
		nl.end_position = house.gpos(l[1])


# ----------------------------------------------------------------- menu ---
func _show_menu() -> void:
	Game.mode = Game.Mode.MENU
	hud.show_title(true)
	hud.set_fade(Color(0, 0, 0, 1))
	hud.fade_in(1.5)
	cut_cam.current = true
	_orbit = true
	Game.play_music("menu", 1.0)
	neighbor.state = Neighbor.S.IDLE
	neighbor.reset_to(house.gpos(Vector3(11.0, NeighborHouse.F2, 0.75)))
	neighbor.state = Neighbor.S.SCRIPTED
	neighbor.rotation.y = house.global_rotation.y + PI
	neighbor.script_anim("look")
	neighbor.model.hold_prop(_binoculars_prop())
	player.controls = false
	player.global_position = phouse.respawn.global_position


func _binoculars_prop() -> Node3D:
	var bn := Items.make("binoculars")
	var v: Node3D = bn.visual.duplicate()
	bn.free()
	v.rotation = Vector3(0, PI / 2, 0)
	return v


func _process(delta: float) -> void:
	if Game.mode == Game.Mode.MENU and _orbit:
		menu_t += delta * 0.12
		var c := Vector3(0, 6, -20)
		var ang := sin(menu_t) * 1.05
		var p := c + Vector3(sin(ang) * 28.0, 3.0 + sin(menu_t * 0.7) * 1.5, cos(ang) * 28.0 + 4.0)
		cut_cam.global_position = p
		cut_cam.look_at(c + Vector3(0, -1.5, 0))
	if Game.mode == Game.Mode.PLAYING:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED and not get_tree().paused:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		# indoor/outdoor ambience
		var inside := house.room_at(player.global_position) != "" or phouse.contains(player.global_position)
		Game.play_ambience("amb_house" if inside else "amb_suburb")


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if Game.mode == Game.Mode.PLAYING:
			_pause()
		elif Game.mode == Game.Mode.PAUSED:
			_resume()
	if event.is_action_pressed("skip") and Game.mode == Game.Mode.CUTSCENE:
		skip_requested = true
	if event.is_action_pressed("hint") and Game.mode == Game.Mode.PLAYING:
		Game.settings.hints = not Game.settings.hints
		hud.show_message("ヒント：" + ("ON" if Game.settings.hints else "OFF"), 1.5)
	if event is InputEventMouseButton and Game.mode == Game.Mode.PLAYING:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _pause() -> void:
	Game.mode = Game.Mode.PAUSED
	get_tree().paused = true
	hud.show_pause(true)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _resume() -> void:
	hud.show_pause(false)
	get_tree().paused = false
	Game.mode = Game.Mode.PLAYING
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	player.cam.fov = Game.settings.fov


func _quit_to_title() -> void:
	get_tree().paused = false
	Game.reset_state()
	Game.stop_music(0.2)
	get_tree().reload_current_scene()


func _on_new_game() -> void:
	if Game.has_meta("session_used") and Game.get_meta("session_used"):
		Game.set_meta("autostart", true)
		Game.set_meta("session_used", false)
		Game.reset_state()
		get_tree().reload_current_scene()
		return
	Game.set_meta("session_used", true)
	Game.reset_state()
	hud.show_title(false)
	_orbit = false
	_intro()


# ----------------------------------------------------------- cut-scenes ---
func _wait(t: float) -> bool:
	var left := t
	while left > 0.0:
		if skip_requested:
			return true
		await get_tree().process_frame
		left -= get_process_delta_time()
	return skip_requested


func _cam_to(pos: Vector3, look: Vector3, dur: float) -> void:
	if dur <= 0.0:
		cut_cam.global_position = pos
		cut_cam.look_at(look)
		return
	var start_pos := cut_cam.global_position
	var start_q := cut_cam.global_basis.get_rotation_quaternion()
	var end_xf := Transform3D(Basis(), pos).looking_at(look)
	var end_q := end_xf.basis.get_rotation_quaternion()
	var tw := create_tween()
	tw.tween_method(func(k: float):
		var e := k * k * (3.0 - 2.0 * k)
		cut_cam.global_position = start_pos.lerp(pos, e)
		cut_cam.global_basis = Basis(start_q.slerp(end_q, e)), 0.0, 1.0, dur)


func _intro() -> void:
	busy = true
	Game.mode = Game.Mode.CUTSCENE
	skip_requested = false
	hud.set_game_hud_visible(false)
	hud.skip_label.visible = true
	Input.mouse_mode = Input.MOUSE_MODE_HIDDEN
	hud.set_fade(Color(0, 0, 0, 1))
	Game.play_music("intro", 0.5, false)
	# 1) Driving to the new house
	intro_car = F.car(items_root, Vector3(-75, 0, 2.2), 0.0, "car_red")
	cut_cam.current = true
	var skipped := false
	cut_cam.global_position = intro_car.global_position + Vector3(-0.15, 1.28, 0.35)
	cut_cam.look_at(cut_cam.global_position + Vector3(1, -0.05, 0))
	hud.fade_in(1.5)
	hud.set_subtitle("新しい家への引っ越しの日。")
	var drive := create_tween()
	drive.tween_property(intro_car, "position:x", -4.0, 9.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	var t := 0.0
	while t < 9.0 and not skip_requested:
		await get_tree().process_frame
		t += get_process_delta_time()
		var look_side := smoothstep(5.0, 8.5, t)
		cut_cam.global_position = intro_car.global_position + Vector3(-0.15, 1.28, 0.35)
		var fwd := Vector3(1, -0.05, 0).lerp(Vector3(0.35, 0.05, -1.0), look_side * 0.85)
		cut_cam.look_at(cut_cam.global_position + fwd)
	skipped = skip_requested
	drive.kill()
	# 2) The Neighbor notices, grabs his binoculars and goes upstairs
	if not skipped:
		hud.set_subtitle("")
		neighbor.reset_to(house.gpos(Vector3(15.0, NeighborHouse.F1 + 0.05, 1.0)))
		neighbor.script_mode(true)
		neighbor.rotation.y = house.global_rotation.y + PI
		neighbor.script_anim("look")
		_cam_to(house.gpos(Vector3(17.6, 1.9, 4.6)), house.gpos(Vector3(15.0, 1.4, 1.0)), 0.0)
		skipped = await _wait(1.6)
	if not skipped:
		neighbor.script_anim("place")
		skipped = await _wait(1.0)
	if not skipped:
		neighbor.model.hold_prop(_binoculars_prop())
		neighbor.script_go(house.gpos(Vector3(13.4, NeighborHouse.F1, 6.6)), 2.4, "walk")
		_cam_to(house.gpos(Vector3(17.0, 2.2, 3.0)), house.gpos(Vector3(13.6, 1.2, 7.0)), 2.4)
		skipped = await _wait(2.6)
	if not skipped:
		neighbor.reset_to(house.gpos(Vector3(11.0, NeighborHouse.F2, 0.75)))
		neighbor.script_mode(true)
		neighbor.rotation.y = house.global_rotation.y + PI
		neighbor.script_anim("look")
		neighbor.model.hold_prop(_binoculars_prop())
		_cam_to(house.gpos(Vector3(11.0, NeighborHouse.F2 + 1.6, -4.0)), house.gpos(Vector3(11.0, NeighborHouse.F2 + 1.6, 0.6)), 0.0)
		_cam_to(house.gpos(Vector3(11.0, NeighborHouse.F2 + 1.7, -2.4)), house.gpos(Vector3(11.0, NeighborHouse.F2 + 1.6, 0.6)), 4.0)
		hud.set_subtitle("…誰かが見ている。")
		skipped = await _wait(4.0)
	# 3) Moving in
	if not skipped:
		hud.set_subtitle("")
		intro_car.position = Vector3(1.7, 0, 9.0)
		intro_car.rotation.y = PI / 2
		_cam_to(Vector3(3.2, 1.65, 7.0), phouse.front_door.global_position + Vector3(0.5, 1.4, 0), 0.0)
		_cam_to(Vector3(0.5, 1.65, 10.4), phouse.front_door.global_position + Vector3(0.5, 1.4, 1.0), 2.5)
		skipped = await _wait(2.6)
	if not skipped:
		Game.sfx("unlock", 0.0)
		phouse.front_door.open_from(Vector3(0.5, 1, 9))
		skipped = await _wait(1.0)
	if not skipped:
		hud.fade_to(Color.BLACK, 0.8)
		skipped = await _wait(1.0)
		hud.set_subtitle("荷物を運び入れて、ひと眠りすることにした…")
		if not skipped:
			skipped = await _wait(2.5)
	# 4) Wake up in bed
	if intro_car and is_instance_valid(intro_car):
		intro_car.position = Vector3(7.75, 0, 9.0)
		intro_car.rotation.y = -PI / 2
	hud.set_fade(Color(0, 0, 0, 1))
	hud.set_subtitle("")
	hud.skip_label.visible = false
	skip_requested = false
	if phouse.front_door.is_open:
		phouse.front_door.close()
	neighbor.script_mode(false)
	neighbor.reset_to(neighbor.home_spot)
	_start_play_in_bed("お隣さんの地下室には何がある？　見つからずに確かめよう。")


func _start_play_in_bed(msg: String) -> void:
	player.teleport(phouse.respawn.global_transform)
	player.controls = false
	player.cam.current = true
	Game.stop_music(2.0)
	hud.set_game_hud_visible(true)
	hud.set_objective("目標：お隣さんの家の地下室に入る")
	await get_tree().create_timer(0.6).timeout
	Game.sfx("wake", -4.0)
	hud.fade_in(1.6)
	await get_tree().create_timer(0.8).timeout
	Game.mode = Game.Mode.PLAYING
	player.controls = true
	busy = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if msg != "":
		hud.show_message(msg, 5.0)


# ------------------------------------------------------------------ chase --
func on_chase_start() -> void:
	if chasing:
		return
	chasing = true
	Game.play_music("chase%d" % randi_range(1, 3), 0.15)
	hud.set_chase(true)


func on_chase_end() -> void:
	if not chasing:
		return
	chasing = false
	Game.stop_music(3.0)
	hud.set_chase(false)
	Game.hint("お隣さんを振り切った", 2.5)


# ---------------------------------------------------------------- caught --
func on_player_caught(n: Neighbor) -> void:
	if busy:
		return
	busy = true
	Game.mode = Game.Mode.CUTSCENE
	player.controls = false
	if player.hidden_in:
		player.unhide(true)
	hud.set_game_hud_visible(false)
	hud.set_chase(false)
	chasing = false
	var catch_pos := player.global_position
	var catch_dir := n.global_position - player.global_position
	# Turn to face him: he grabs you.
	n.script_mode(true)
	n.script_anim("grab", player.global_position)
	var head := n.global_position + Vector3(0, 1.55, 0)
	var to := head - player.cam.global_position
	var target_yaw := atan2(-to.x, -to.z)
	var target_pitch := atan2(to.y, Vector2(to.x, to.z).length())
	var tw := create_tween()
	tw.tween_method(func(k: float): player.set_look(lerp_angle(player.yaw, target_yaw, k), lerpf(player.pitch, target_pitch, k)), 0.0, 1.0, 0.25)
	Game.stop_music(0.1)
	Game.sfx("caught", 4.0)
	player.shake(0.8)
	await get_tree().create_timer(0.75).timeout
	hud.fade_to(Color.BLACK, 0.2)
	await get_tree().create_timer(0.9).timeout
	Game.captures += 1
	# He puts a camera where he caught you.
	var flat := Vector3(catch_dir.x, 0, catch_dir.z).normalized()
	SecurityCam.spawn_near_player_route(_snap(catch_pos - flat * 0.6), catch_pos + flat * 4.0)
	n.script_mode(false)
	n.reset_to(n.home_spot)
	if Game.captures >= 2 and not Game.tutorial_done:
		await _carnival()
		return
	_start_play_in_bed("…ベッドの上で目が覚めた。お隣さんは手ごわくなっている。")


func _snap(p: Vector3) -> Vector3:
	if not nav_baked:
		return p
	return NavigationServer3D.map_get_closest_point(get_world_3d().navigation_map, p)


func player_ejected() -> void:
	if busy:
		return
	busy = true
	Game.mode = Game.Mode.CUTSCENE
	player.controls = false
	hud.set_game_hud_visible(false)
	hud.fade_to(Color.BLACK, 0.3)
	await get_tree().create_timer(0.6).timeout
	player.teleport(Transform3D(Basis(Vector3.UP, 0.0), Vector3(-3.0, 0.1, -3.0)))
	await get_tree().create_timer(0.5).timeout
	hud.set_game_hud_visible(true)
	hud.fade_in(0.8)
	Game.mode = Game.Mode.PLAYING
	player.controls = true
	busy = false
	hud.show_message("シャーコトロンにつかまって、家の外に放り出された！", 3.5)


func player_sleep() -> void:
	if busy:
		return
	busy = true
	Game.mode = Game.Mode.CUTSCENE
	player.controls = false
	hud.set_game_hud_visible(false)
	hud.fade_to(Color.BLACK, 0.8)
	Game.sfx("cloth", -4.0)
	await get_tree().create_timer(1.6).timeout
	Game.sleeps += 1
	if Game.sleeps >= 2 and not Game.tutorial_done:
		await _carnival()
		return
	_start_play_in_bed("少し眠った。")


# ------------------------------------------------- carnival nightmare -----
func _carnival() -> void:
	Game.tutorial_done = true
	Game.mode = Game.Mode.CUTSCENE
	special.set_active("carnival")
	set_night(true)
	player.teleport(special.carn_player_spawn.global_transform)
	player.cam.current = true
	neighbor.script_mode(true)
	neighbor.direct = true
	neighbor.reset_to(special.carn_neighbor_spawn.global_position)
	neighbor.script_mode(true)
	neighbor.model.set_sack(true)
	neighbor.rotation.y = 0.0
	Game.play_music("carnival", 1.0)
	await get_tree().create_timer(0.8).timeout
	hud.fade_in(1.5)
	hud.set_game_hud_visible(true)
	hud.set_objective("悪夢")
	Game.mode = Game.Mode.PLAYING
	player.controls = true
	busy = false
	hud.show_message("何かが来る！　隠れろ！（タンス か ベッドの下）", 6.0)
	# Give the player time to hide.
	var t := 0.0
	while t < 9.0 and player.hidden_in == null:
		await get_tree().process_frame
		t += get_process_delta_time()
	await get_tree().create_timer(1.5).timeout
	# He walks in...
	Game.sfx3d("n_huh", neighbor.global_position + Vector3(0, 1.7, 0), 2.0)
	neighbor.script_go(special.carnival.to_global(Vector3(0, 0.05, -2.0)), 1.6, "walk")
	t = 0.0
	while t < 6.0:
		await get_tree().process_frame
		t += get_process_delta_time()
	var hs: HideSpot = player.hidden_in
	if hs == null:
		# Not hidden: he gets you anyway, the dream ends.
		neighbor.script_go(player.global_position, 2.6, "run")
		Game.play_music("chase1", 0.1)
		t = 0.0
		while t < 6.0 and neighbor.global_position.distance_to(player.global_position) > 1.4:
			await get_tree().process_frame
			t += get_process_delta_time()
		player.controls = false
		neighbor.script_anim("grab", player.global_position)
		Game.sfx("caught", 4.0)
		hud.fade_to(Color.WHITE, 0.6)
		await get_tree().create_timer(1.2).timeout
		_end_carnival("隠れるのが遅すぎた…目が覚めた。")
		return
	# He checks the OTHER hiding place, finds nothing.
	var other: HideSpot = special.carn_bed if hs == special.carn_wardrobe else special.carn_wardrobe
	neighbor.script_go(other.exit_point.global_position, 1.6, "walk")
	t = 0.0
	while t < 7.0 and neighbor.global_position.distance_to(other.exit_point.global_position) > 0.6:
		await get_tree().process_frame
		t += get_process_delta_time()
	neighbor.script_anim("search", other.global_position)
	other.set_doors_open(true)
	Game.sfx3d("wardrobe", other.global_position, 0.0)
	await get_tree().create_timer(2.5).timeout
	other.set_doors_open(false)
	Game.sfx3d("n_huh", neighbor.global_position + Vector3(0, 1.7, 0), 2.0, 0.85)
	await get_tree().create_timer(1.2).timeout
	neighbor.script_go(special.carn_neighbor_spawn.global_position, 1.6, "walk")
	await get_tree().create_timer(1.5).timeout
	player.controls = false
	hud.fade_to(Color.WHITE, 2.0)
	await get_tree().create_timer(2.4).timeout
	_end_carnival("…変な夢だった。")


func _end_carnival(msg: String) -> void:
	if player.hidden_in:
		player.unhide(true)
	special.set_active("")
	set_night(false)
	neighbor.direct = false
	neighbor.model.set_sack(false)
	neighbor.script_mode(false)
	neighbor.reset_to(neighbor.home_spot)
	Game.stop_music(1.0)
	Game.mode = Game.Mode.CUTSCENE
	busy = true
	hud.set_fade(Color(1, 1, 1, 1))
	hud.fade_to(Color.BLACK, 0.8)
	await get_tree().create_timer(0.9).timeout
	_start_play_in_bed(msg)


# ---------------------------------------------------------------- ending --
func start_ending() -> void:
	if busy:
		return
	busy = true
	Game.mode = Game.Mode.CUTSCENE
	player.controls = false
	hud.set_game_hud_visible(false)
	hud.set_chase(false)
	Game.stop_music(0.5)
	var door_world := house.gpos(Vector3(17.1, NeighborHouse.F1 + 1.3, 7.7))
	# Look at the basement door from the player's eyes
	cut_cam.global_transform = player.cam.global_transform
	cut_cam.current = true
	_cam_to(house.gpos(Vector3(17.1, NeighborHouse.F1 + 1.55, 6.3)), door_world, 1.0)
	await get_tree().create_timer(1.0).timeout
	Game.sfx3d("basement_creak", door_world, 4.0)
	house.puzzles.open_basement_door_anim(3.0)
	var glow := B.omni(house, Vector3(17.1, NeighborHouse.F1 + 1.3, 8.4), Color(1.0, 0.97, 0.9), 0.0, 6.0)
	var gt := create_tween()
	gt.tween_property(glow, "light_energy", 6.0, 3.0)
	Game.sfx("ending_light", 0.0)
	await get_tree().create_timer(2.2).timeout
	# He appears and slams the door shut.
	neighbor.script_mode(true)
	neighbor.reset_to(house.gpos(Vector3(14.0, NeighborHouse.F1 + 0.05, 5.5)))
	neighbor.script_mode(true)
	neighbor.script_go(house.gpos(Vector3(16.2, NeighborHouse.F1, 7.0)), 5.0, "run")
	Game.sfx3d("n_spot", neighbor.global_position + Vector3(0, 1.7, 0), 6.0)
	_cam_to(house.gpos(Vector3(17.6, NeighborHouse.F1 + 1.55, 5.6)), house.gpos(Vector3(15.5, NeighborHouse.F1 + 1.4, 6.6)), 0.4)
	await get_tree().create_timer(0.75).timeout
	house.puzzles.slam_basement_door()
	gt.kill()
	glow.light_energy = 0.0
	player.shake(0.8)
	neighbor.script_anim("grab", cut_cam.global_position)
	neighbor.script_go(house.gpos(Vector3(17.3, NeighborHouse.F1, 5.9)), 4.5, "run")
	await get_tree().create_timer(0.55).timeout
	Game.sfx("caught", 6.0)
	hud.set_fade(Color(0, 0, 0, 1))
	glow.queue_free()
	await get_tree().create_timer(2.5).timeout
	# Wake up in an open coffin, buried in the ground.
	special.set_active("grave")
	set_night(true)
	neighbor.direct = true
	neighbor.reset_to(special.grave_neighbor.global_position)
	neighbor.script_mode(true)
	neighbor.rotation.y = PI
	neighbor.script_anim("cheer")
	cut_cam.global_position = special.grave_cam.global_position
	cut_cam.look_at(special.grave_cam.global_position + Vector3(0, 1, 0.12), Vector3(0, 0, -1))
	Game.play_music("ending", 0.5, false)
	hud.fade_in(3.0)
	await get_tree().create_timer(2.0).timeout
	_cam_to(special.grave_cam.global_position, special.grave_neighbor.global_position + Vector3(0, 1.8, 0), 1.8)
	await get_tree().create_timer(3.0).timeout
	Game.sfx3d("n_laugh", neighbor.global_position + Vector3(0, 1.7, 0), 4.0)
	await get_tree().create_timer(1.2).timeout
	var lid := special.coffin_lid
	var lt := create_tween()
	lt.tween_property(lid, "position", Vector3(0, -1.72, 0), 0.55).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	lt.parallel().tween_property(lid, "rotation", Vector3.ZERO, 0.55)
	await get_tree().create_timer(0.5).timeout
	Game.sfx("coffin_slam", 6.0)
	hud.set_fade(Color(0, 0, 0, 1))
	await get_tree().create_timer(2.5).timeout
	hud.show_credits("HELLO NEIGHBOR  ALPHA 1\nファンメイド再現版\n\nTHE END\n\n\nクリアおめでとう！\n捕まった回数： %d\n\nEsc / クリックでタイトルへ" % Game.captures)
	hud.fade_in(1.5)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	await get_tree().create_timer(2.0).timeout
	while not (Input.is_action_pressed("pause") or Input.is_action_pressed("use") or Input.is_action_pressed("skip")):
		await get_tree().process_frame
	hud.hide_credits()
	_quit_to_title()
