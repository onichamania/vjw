class_name Neighbor
extends CharacterBody3D
## Mr. Peterson's Alpha 1 AI.
##  * "Superman": while in attack mode he knows where you are, through walls,
##    wardrobes and beds - hiding only works if he hasn't started chasing.
##  * Uses shortcuts and predicts where you are going to cut you off.
##  * Not lured by thrown objects (unlike Alpha 2+).
##  * Slowest running speed of all versions, but faster after every capture.
##  * Places sound-sensitive cameras where he spotted/caught you, and
##    randomly to predict your movement.
##  * Opens doors in his way - but not the doors of your house, which is how
##    he can end up locked inside it.

enum S { IDLE, ROUTINE, INVESTIGATE, CHASE, SEARCH, PLACE, CATCH, SLIP, STUCK, SCRIPTED }

const VIEW_DIST := 23.0
const FOV_COS := 0.45
const CATCH_DIST := 1.2
const LOSE_DIST := 17.0

var state: int = S.IDLE
var model: NeighborModel
var agent: NavigationAgent3D
var anim := "idle"
var walk_speed := 2.0
var cur_speed := 0.0
var want_speed := 0.0
var move_target := Vector3.ZERO
var has_target := false
var activity: Dictionary = {}
var at_activity := false
var act_timer := 0.0
var last_act := -1
var invest_timer := 0.0
var search_timer := 0.0
var place_timer := 0.0
var place_pos := Vector3.ZERO
var cam_timer := 70.0
var lose_timer := 0.0
var unreach_timer := 0.0
var spot_timer := 0.0
var stuck_timer := 0.0
var slip_timer := 0.0
var slip_return: int = S.ROUTINE
var repath_timer := 0.0
var vision_timer := 0.0
var voice_cool := 0.0
var step_acc := 0.0
var last_known := Vector3.ZERO
var home_spot := Vector3.ZERO
var stuck_msg_shown := false
var nav_ready := false
var scripted_anim := "idle"
var scripted_target := Vector3.ZERO
var scripted_speed := 0.0
var scripted_face := Vector3.ZERO
var posed := false
var direct := false   # cut-scenes outside the navmesh: walk in a straight line
var _prev_pos := Vector3.ZERO
var _move_check := 0.0
var _prev_check_pos := Vector3.ZERO


func _ready() -> void:
	collision_layer = Game.L_NEIGHBOR
	# He walks "through" the swinging panels of his own doors (he opens them
	# anyway), but the doors of the player's house do stop him.
	collision_mask = Game.L_WORLD | Game.L_GLASS | Game.L_PDOOR
	floor_max_angle = deg_to_rad(50)
	floor_snap_length = 0.4
	var cs := CollisionShape3D.new()
	var sh := CapsuleShape3D.new()
	sh.radius = 0.34
	sh.height = 1.8
	cs.shape = sh
	cs.position.y = 0.9
	add_child(cs)
	model = NeighborModel.new()
	add_child(model)
	model.build()
	agent = NavigationAgent3D.new()
	agent.path_desired_distance = 0.55
	agent.target_desired_distance = 0.6
	agent.path_max_distance = 3.0
	agent.radius = 0.34
	agent.height = 1.8
	agent.avoidance_enabled = false
	add_child(agent)
	Game.noise_made.connect(_on_noise)
	Game.alert.connect(_on_alert)


func run_speed() -> float:
	# Alpha 1: slowest Neighbor of all versions (slower than the player's
	# walk), getting faster with every capture.
	return minf(3.45 + Game.captures * 0.35, 5.6)


func reset_to(pos: Vector3) -> void:
	global_position = pos
	velocity = Vector3.ZERO
	has_target = false
	at_activity = false
	act_timer = 0.0
	posed = false
	model.position = Vector3.ZERO
	model.rotation = Vector3.ZERO
	model.set_sack(false)
	model.hold_prop(null)
	state = S.ROUTINE
	_prev_check_pos = pos


# ------------------------------------------------------------------ main --
func _physics_process(delta: float) -> void:
	if not nav_ready:
		nav_ready = NavigationServer3D.map_get_iteration_id(get_world_3d().navigation_map) > 0
	voice_cool -= delta
	var playing := Game.mode == Game.Mode.PLAYING
	match state:
		S.IDLE:
			want_speed = 0.0
			anim = "idle"
			has_target = false
		S.SCRIPTED:
			_scripted(delta)
		_:
			if playing:
				_perceive(delta)
				_think(delta)
			else:
				want_speed = 0.0
	_move(delta)
	var hv := Vector2(velocity.x, velocity.z).length()
	var a := anim
	if a in ["walk", "run"] and hv < 0.15:
		a = "idle"
	model.animate(delta, a, hv)
	_footsteps(delta, hv)


func _move(delta: float) -> void:
	var dir := Vector3.ZERO
	if has_target and want_speed > 0.01 and not posed:
		var next := move_target
		if nav_ready and not direct:
			repath_timer -= delta
			if repath_timer <= 0.0 or agent.target_position.distance_to(move_target) > 0.5:
				agent.target_position = move_target
				repath_timer = 0.25
			next = agent.get_next_path_position()
		var d := next - global_position
		d.y = 0.0
		if d.length() < 0.05 and nav_ready and not direct and not agent.is_navigation_finished():
			d = move_target - global_position
			d.y = 0.0
		if d.length() > 0.02:
			dir = d.normalized()
	var spd := want_speed
	if _in_water():
		spd *= 0.7
	cur_speed = move_toward(cur_speed, spd if dir != Vector3.ZERO else 0.0, delta * 8.0)
	var hvel := dir * cur_speed
	velocity.x = hvel.x
	velocity.z = hvel.z
	if is_on_floor():
		velocity.y = -0.5
	else:
		velocity.y -= 14.0 * delta
	if dir != Vector3.ZERO:
		var yaw := atan2(dir.x, dir.z)
		rotation.y = lerp_angle(rotation.y, yaw, minf(1.0, delta * 9.0))
	move_and_slide()
	_open_doors(dir)
	_check_stuck(delta, dir)
	if global_position.y < -10.0:
		_warp_home()


func _in_water() -> bool:
	if Game.water_frozen or Game.house == null:
		return false
	var lp: Vector3 = Game.house.to_local(global_position)
	return Sharkotron.POOL_RECT.has_point(Vector2(lp.x, lp.z)) and lp.y < NeighborHouse.WATER - 0.1 and lp.y > NeighborHouse.POOL - 0.3


func _footsteps(delta: float, hv: float) -> void:
	if hv < 0.3 or not is_on_floor():
		return
	step_acc += hv * delta
	var stride := 0.95 if anim == "run" else 0.75
	if step_acc >= stride:
		step_acc = 0.0
		var nm := "step_neighbor" if not _in_water() else "splash_step"
		Game.sfx3d(nm, global_position, -2.0 if anim == "run" else -7.0, randf_range(0.9, 1.08), 28.0)


func _open_doors(dir: Vector3) -> void:
	var fwd := dir if dir != Vector3.ZERO else global_basis.z
	for d in get_tree().get_nodes_in_group("doors"):
		if d.is_open:
			continue
		var c: Vector3 = d.center()
		var to := c - global_position
		if abs(to.y - 1.0) > 1.4:
			continue
		to.y = 0.0
		if to.length() < 1.7 and (to.length() < 0.9 or fwd.dot(to.normalized()) > 0.2):
			if not d.neighbor_open(global_position):
				_blocked_by_door(d)


func _blocked_by_door(_d: Node) -> void:
	pass


func _check_stuck(delta: float, dir: Vector3) -> void:
	_move_check += delta
	if _move_check < 1.0:
		return
	var moved := global_position.distance_to(_prev_check_pos)
	_prev_check_pos = global_position
	_move_check = 0.0
	if dir != Vector3.ZERO and want_speed > 0.5 and moved < 0.25 and not posed:
		stuck_timer += 1.0
	else:
		stuck_timer = maxf(0.0, stuck_timer - 1.0)
	if stuck_timer >= 4.0:
		stuck_timer = 0.0
		match state:
			S.CHASE:
				if not Game.player_house.contains(global_position):
					_lose_player()
			S.ROUTINE:
				at_activity = false
				act_timer = 0.0
				_next_activity()
			S.INVESTIGATE, S.SEARCH:
				_back_to_routine()
		# last resort: snap onto the navmesh
		if nav_ready:
			var p := NavigationServer3D.map_get_closest_point(get_world_3d().navigation_map, global_position)
			if p.distance_to(global_position) > 0.6 and p.distance_to(global_position) < 4.0:
				global_position = p + Vector3(0, 0.1, 0)


func _warp_home() -> void:
	global_position = home_spot
	velocity = Vector3.ZERO
	_back_to_routine()


# ----------------------------------------------------------- perception --
func _perceive(delta: float) -> void:
	vision_timer -= delta
	if vision_timer > 0.0:
		return
	vision_timer = 0.12
	if state in [S.CHASE, S.CATCH, S.SLIP]:
		return
	if can_see_player():
		_spot_player()


func can_see_player() -> bool:
	var p: Player = Game.player
	if p == null or p.hidden_in != null or not p.visible_to_neighbor:
		return false
	var eye := global_position + Vector3(0, 1.72, 0)
	if posed and anim == "lie":
		eye = model.global_position + Vector3(0, 0.6, 0)
	var head: Vector3 = p.cam.global_position
	var to := head - eye
	var dist := to.length()
	var view := VIEW_DIST * (0.55 if anim == "lie" else 1.0)
	if p.crouching:
		view *= 0.8
	if dist > view:
		return false
	var fwd := global_basis.z
	if dist > 1.6 and fwd.dot(to / dist) < FOV_COS:
		return false
	var space := get_world_3d().direct_space_state
	for target: Vector3 in [head, p.global_position + Vector3(0, 0.6, 0)]:
		var q := PhysicsRayQueryParameters3D.create(eye, target, Game.L_WORLD | Game.L_DOOR)
		q.exclude = [get_rid()]
		var hit := space.intersect_ray(q)
		if hit.is_empty():
			return true
	return false


func _spot_player() -> void:
	posed = false
	model.position = Vector3.ZERO
	model.rotation = Vector3.ZERO
	state = S.CHASE
	spot_timer = 0.45
	lose_timer = 0.0
	unreach_timer = 0.0
	last_known = Game.player.global_position
	if voice_cool <= 0.0:
		Game.sfx3d("n_spot", global_position + Vector3(0, 1.7, 0), 4.0, randf_range(0.95, 1.05), 40.0)
		voice_cool = 6.0
	if Game.main:
		Game.main.on_chase_start()


func _on_noise(pos: Vector3, radius: float, kind: String) -> void:
	if state in [S.IDLE, S.SCRIPTED, S.CHASE, S.CATCH, S.SLIP]:
		return
	if Game.mode != Game.Mode.PLAYING:
		return
	# Alpha 1: thrown objects no longer attract him.
	if kind == "impact":
		return
	if global_position.distance_to(pos) > radius:
		return
	_investigate(pos, kind)


func _on_alert(pos: Vector3, kind: String) -> void:
	if state in [S.IDLE, S.SCRIPTED, S.CHASE, S.CATCH, S.SLIP]:
		return
	_investigate(pos, kind)


func _investigate(pos: Vector3, _kind: String) -> void:
	if state == S.STUCK:
		return
	posed = false
	model.position = Vector3.ZERO
	model.rotation = Vector3.ZERO
	at_activity = false
	state = S.INVESTIGATE
	invest_timer = 0.0
	move_target = _snap(pos)
	has_target = true
	if voice_cool <= 0.0:
		Game.sfx3d("n_huh", global_position + Vector3(0, 1.7, 0), 0.0, randf_range(0.95, 1.05), 30.0)
		voice_cool = 5.0


# ------------------------------------------------------------- thinking --
func _think(delta: float) -> void:
	_check_banana()
	match state:
		S.ROUTINE:
			_routine(delta)
		S.INVESTIGATE:
			_investigate_tick(delta)
		S.CHASE:
			_chase(delta)
		S.SEARCH:
			_search(delta)
		S.PLACE:
			_place(delta)
		S.SLIP:
			want_speed = 0.0
			anim = "slip"
			slip_timer -= delta
			if slip_timer <= 0.0:
				state = slip_return
				anim = "idle"
		S.STUCK:
			_stuck(delta)
		S.CATCH:
			want_speed = 0.0
			anim = "grab"


func _routine(delta: float) -> void:
	if Game.player_house and Game.player_house.contains(global_position) and not Game.player_house.front_door.is_open:
		state = S.STUCK
		return
	cam_timer -= delta
	if not at_activity:
		if activity.is_empty():
			_next_activity()
		anim = "walk"
		want_speed = walk_speed
		has_target = true
		move_target = activity.pos
		var d := Vector2(global_position.x - move_target.x, global_position.z - move_target.z).length()
		if d < 0.8 and abs(global_position.y - move_target.y) < 1.2 or (nav_ready and agent.is_navigation_finished() and d < 2.2):
			at_activity = true
			act_timer = activity.dur
			has_target = false
			want_speed = 0.0
			rotation.y = atan2(activity.dir.x, activity.dir.z)
			_apply_pose(activity)
	else:
		act_timer -= delta
		anim = activity.anim if activity.anim != "stand" else "idle"
		want_speed = 0.0
		if act_timer <= 0.0:
			_clear_pose()
			at_activity = false
			if cam_timer <= 0.0:
				cam_timer = randf_range(70.0, 120.0)
				_start_place(Game.house.camera_spots[randi() % Game.house.camera_spots.size()])
				return
			_next_activity()


func _next_activity() -> void:
	var spots: Array = Game.house.activity_spots
	var total := 0.0
	for i in spots.size():
		if i != last_act:
			total += spots[i].w
	var r := randf() * total
	for i in spots.size():
		if i == last_act:
			continue
		r -= spots[i].w
		if r <= 0.0:
			last_act = i
			activity = spots[i]
			return
	last_act = 0
	activity = spots[0]


func _apply_pose(act: Dictionary) -> void:
	var a: String = act.anim
	if a == "fridge":
		Game.sfx3d("fridge", global_position + Vector3(0, 1, 0), -4.0)
	var house: NeighborHouse = Game.house
	var lp: Vector3 = house.to_local(global_position)
	var pose_local := Vector3.INF
	var face_rot := 0.0
	match a:
		"tv":
			pose_local = Vector3(13.65, NeighborHouse.F1 + 0.0, 5.2)
		"sit":
			if lp.y > 3.0:
				pose_local = Vector3(16.6, NeighborHouse.F2, 13.2)
			else:
				pose_local = Vector3(3.5, NeighborHouse.F1, 8.35)
		"lie":
			pose_local = Vector3(15.0, NeighborHouse.F1 + 0.78, 16.95)
			face_rot = 0.0
	if pose_local != Vector3.INF:
		posed = true
		var gp := house.to_global(pose_local)
		model.global_position = gp
		model.global_rotation = Vector3(0, atan2(act.dir.x, act.dir.z) + face_rot, 0)
		if a == "lie":
			# head towards the headboard (back wall of the bedroom)
			model.global_rotation = Vector3(0, house.global_rotation.y + PI, 0)
	if a == "mop":
		var br := Items.make("broom")
		var v: Node3D = br.visual.duplicate()
		br.free()
		v.rotation = Vector3(0, 0, -PI / 2)
		v.position = Vector3(0, -0.2, 0.1)
		model.hold_prop(v)
	elif a == "look":
		var bn := Items.make("binoculars")
		var v2: Node3D = bn.visual.duplicate()
		bn.free()
		v2.rotation = Vector3(0, PI / 2, 0)
		model.hold_prop(v2)


func _clear_pose() -> void:
	posed = false
	model.position = Vector3.ZERO
	model.rotation = Vector3.ZERO
	model.hold_prop(null)


func _back_to_routine() -> void:
	_clear_pose()
	state = S.ROUTINE
	at_activity = false
	activity = {}
	has_target = false


func _investigate_tick(delta: float) -> void:
	anim = "walk"
	want_speed = walk_speed * 1.45
	has_target = true
	var d := Vector2(global_position.x - move_target.x, global_position.z - move_target.z).length()
	if d < 1.0 or (nav_ready and agent.is_navigation_finished() and d < 3.0):
		has_target = false
		want_speed = 0.0
		anim = "search"
		invest_timer += delta
		if invest_timer > 4.5:
			_back_to_routine()


func _chase(delta: float) -> void:
	var p: Player = Game.player
	if spot_timer > 0.0:
		spot_timer -= delta
		anim = "spot"
		want_speed = 0.0
		has_target = false
		var to := p.global_position - global_position
		rotation.y = lerp_angle(rotation.y, atan2(to.x, to.z), minf(1.0, delta * 10.0))
		return
	anim = "run"
	want_speed = run_speed()
	has_target = true
	# In attack mode he always knows where you are (Alpha 1).
	last_known = p.global_position
	var to_p := p.global_position - global_position
	var dist := to_p.length()
	var tgt := p.global_position
	if p.hidden_in != null:
		tgt = (p.hidden_in as HideSpot).exit_point.global_position
	elif dist > 4.0:
		# Predict where the player is heading and cut them off.
		var lead: float = clampf(dist / run_speed(), 0.4, 1.4)
		var pv: Vector3 = p.velocity
		pv.y = 0.0
		var pred: Vector3 = p.global_position + pv * lead * 0.85
		var snapped := _snap(pred)
		if snapped.distance_to(pred) < 1.5 and abs(snapped.y - p.global_position.y) < 1.5:
			tgt = snapped
	move_target = tgt
	# Hidden player: open the wardrobe / look under the bed and grab them.
	if p.hidden_in != null:
		var hs: HideSpot = p.hidden_in
		if global_position.distance_to(hs.exit_point.global_position) < 1.1:
			hs.set_doors_open(true)
			p.unhide(true)
			_catch()
			return
	# Catch
	if dist < CATCH_DIST + 0.15 and abs(to_p.y) < 1.4 and p.hidden_in == null:
		_catch()
		return
	# Locked out of the player's house
	if Game.player_house.contains(p.global_position) and not Game.player_house.contains(global_position) and not Game.player_house.front_door.is_open:
		lose_timer += delta
		if lose_timer > 5.0:
			_lose_player()
		return
	if dist > LOSE_DIST:
		lose_timer += delta
		if lose_timer > 3.5:
			_lose_player()
			return
	else:
		lose_timer = maxf(0.0, lose_timer - delta)
	if nav_ready and not agent.is_target_reachable() and dist > 3.0:
		unreach_timer += delta
		if unreach_timer > 6.0:
			_lose_player()
	else:
		unreach_timer = 0.0


func _catch() -> void:
	state = S.CATCH
	want_speed = 0.0
	has_target = false
	anim = "grab"
	if Game.main:
		Game.main.on_player_caught(self)


func _lose_player() -> void:
	state = S.SEARCH
	search_timer = 0.0
	move_target = _snap(last_known)
	has_target = true
	if Game.main:
		Game.main.on_chase_end()


func _search(delta: float) -> void:
	anim = "walk"
	want_speed = walk_speed * 1.3
	has_target = true
	var d := Vector2(global_position.x - move_target.x, global_position.z - move_target.z).length()
	if d < 1.2 or (nav_ready and agent.is_navigation_finished() and d < 3.0):
		has_target = false
		want_speed = 0.0
		anim = "search"
		search_timer += delta
		if search_timer > 5.0:
			# Place a camera where he lost the player.
			_start_place(global_position)


func _start_place(pos: Vector3) -> void:
	state = S.PLACE
	place_pos = _snap(pos)
	place_timer = 0.0
	move_target = place_pos
	has_target = true


func _place(delta: float) -> void:
	var d := Vector2(global_position.x - place_pos.x, global_position.z - place_pos.z).length()
	if d > 1.0 and place_timer == 0.0:
		anim = "walk"
		want_speed = walk_speed * 1.2
		has_target = true
		if nav_ready and agent.is_navigation_finished() and d < 3.0:
			place_timer = 0.001
		return
	has_target = false
	want_speed = 0.0
	anim = "place"
	place_timer += delta
	if place_timer > 1.3:
		var fwd := global_basis.z
		SecurityCam.spawn_near_player_route(global_position + fwd * 0.8, global_position + fwd * 5.0)
		Game.sfx3d("place_cam", global_position + fwd * 0.8, -4.0)
		_back_to_routine()


func _stuck(delta: float) -> void:
	var ph: PlayerHouse = Game.player_house
	if ph.front_door.is_open or not ph.contains(global_position):
		stuck_msg_shown = false
		_back_to_routine()
		return
	if not stuck_msg_shown and Game.player and not ph.contains(Game.player.global_position):
		stuck_msg_shown = true
		Game.hint("お隣さんがあなたの家に閉じ込められた！", 4.0)
	act_timer -= delta
	if act_timer <= 0.0 or not has_target:
		act_timer = randf_range(2.5, 5.0)
		move_target = ph.to_global(Vector3(randf_range(1.0, 9.0), PlayerHouse.FL, randf_range(1.0, 3.6)))
		has_target = true
	anim = "walk"
	want_speed = walk_speed
	if can_see_player():
		state = S.CHASE
		spot_timer = 0.2


func _check_banana() -> void:
	if state in [S.SLIP, S.CATCH] or cur_speed < 1.0:
		return
	for b in get_tree().get_nodes_in_group("items"):
		var it := b as Item
		if it == null or it.item_id != "banana" or not it.is_inside_tree():
			continue
		var d := it.global_position - global_position
		if abs(d.y) < 0.4 and Vector2(d.x, d.z).length() < 0.45:
			slip_return = state if state != S.CHASE else S.CHASE
			state = S.SLIP
			slip_timer = 2.6
			it.apply_central_impulse(global_basis.z * 0.6 + Vector3(0, 0.3, 0))
			Game.sfx3d("slip", global_position + Vector3(0, 1, 0), 2.0)
			Game.sfx3d("n_fall", global_position + Vector3(0, 1, 0), 2.0)
			return


func _snap(p: Vector3) -> Vector3:
	if not nav_ready:
		return p
	return NavigationServer3D.map_get_closest_point(get_world_3d().navigation_map, p)


# --------------------------------------------------------------- scripted --
## Used by cut-scenes: walk/run to a point or just play an animation.
func script_mode(on: bool) -> void:
	if on:
		_clear_pose()
		state = S.SCRIPTED
		scripted_speed = 0.0
		has_target = false
	else:
		_back_to_routine()


func script_go(p: Vector3, speed: float, a := "walk") -> void:
	scripted_target = p
	scripted_speed = speed
	scripted_anim = a
	has_target = true
	move_target = p


func script_anim(a: String, face := Vector3.ZERO) -> void:
	scripted_anim = a
	scripted_speed = 0.0
	has_target = false
	scripted_face = face


func _scripted(delta: float) -> void:
	anim = scripted_anim
	want_speed = scripted_speed
	if has_target:
		var d := Vector2(global_position.x - move_target.x, global_position.z - move_target.z).length()
		if d < 0.4:
			has_target = false
			want_speed = 0.0
	elif scripted_face != Vector3.ZERO:
		var to := scripted_face - global_position
		rotation.y = lerp_angle(rotation.y, atan2(to.x, to.z), minf(1.0, delta * 8.0))
