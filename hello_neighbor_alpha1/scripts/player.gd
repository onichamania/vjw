class_name Player
extends CharacterBody3D
## First-person player. Alpha 1 had no visible player model, a 4-slot
## inventory, crouching, jumping, throwing and hiding in wardrobes/under beds.

const WALK := 4.0
const SPRINT := 6.0
const CROUCH := 2.0
const JUMP_V := 4.7
const GRAVITY := 12.5
const STAND_H := 1.75
const CROUCH_H := 1.05
const EYE := 1.6
const EYE_CROUCH := 0.9
const REACH := 2.7

var head: Node3D
var cam: Camera3D
var hold: Node3D
var ray: RayCast3D
var shape: CapsuleShape3D
var col: CollisionShape3D
var flashlight: SpotLight3D

var inventory: Array = [null, null, null, null]
var slot := 0
var held_view: Node3D
var controls := false
var visible_to_neighbor := true
var hidden_in: HideSpot = null
var crouching := false
var yaw := 0.0
var pitch := 0.0
var throw_charge := -1.0
var step_acc := 0.0
var bob := 0.0
var shake_amt := 0.0
var was_on_floor := true
var fall_start := 0.0
var target: Node = null
var flash_on := false
var zoom := false
var rifle_cool := 0.0
var _hold_bob := 0.0


func _ready() -> void:
	collision_layer = Game.L_PLAYER
	collision_mask = Game.L_WORLD | Game.L_DOOR | Game.L_GLASS | Game.L_ITEM | Game.L_BARRIER
	floor_max_angle = deg_to_rad(50)
	floor_snap_length = 0.35
	floor_stop_on_slope = true
	floor_constant_speed = true
	shape = CapsuleShape3D.new()
	shape.radius = 0.32
	shape.height = STAND_H
	col = CollisionShape3D.new()
	col.shape = shape
	col.position.y = STAND_H * 0.5
	add_child(col)
	head = Node3D.new()
	head.position.y = EYE
	add_child(head)
	cam = Camera3D.new()
	cam.fov = Game.settings.fov
	cam.near = 0.04
	cam.far = 400.0
	head.add_child(cam)
	hold = Node3D.new()
	hold.position = Vector3(0.32, -0.28, -0.55)
	cam.add_child(hold)
	ray = RayCast3D.new()
	ray.target_position = Vector3(0, 0, -REACH)
	ray.collision_mask = Game.L_WORLD | Game.L_ITEM | Game.L_DOOR | Game.L_GLASS | Game.L_USE
	ray.enabled = true
	cam.add_child(ray)
	ray.add_exception(self)
	flashlight = SpotLight3D.new()
	flashlight.spot_range = 18.0
	flashlight.spot_angle = 28.0
	flashlight.light_energy = 2.5
	flashlight.shadow_enabled = true
	flashlight.visible = false
	flashlight.position = Vector3(0.2, -0.15, 0)
	cam.add_child(flashlight)


func set_look(y: float, p: float) -> void:
	yaw = y
	pitch = p
	rotation.y = yaw
	head.rotation.x = pitch


func teleport(xf: Transform3D) -> void:
	global_position = xf.origin
	velocity = Vector3.ZERO
	var fwd := -xf.basis.z
	set_look(atan2(-fwd.x, -fwd.z), 0.0)


# ------------------------------------------------------------------ input --
func _unhandled_input(event: InputEvent) -> void:
	if not controls:
		return
	# In a browser the pointer lock can be refused; then plain mouse movement
	# still turns the view.
	var web_free := OS.has_feature("web") and not Game.touch_mode
	if event is InputEventMouseMotion and (Input.mouse_mode == Input.MOUSE_MODE_CAPTURED or web_free):
		var m := event as InputEventMouseMotion
		var sens: float = Game.settings.sens * Game.hub_sens * (0.35 if zoom else 1.0)
		yaw -= m.relative.x * sens
		pitch -= m.relative.y * sens * (-1.0 if Game.settings.invert_y else 1.0)
		pitch = clampf(pitch, -1.5, 1.5)
		if hidden_in:
			yaw = clampf(yaw, _hide_yaw - 0.9, _hide_yaw + 0.9)
			pitch = clampf(pitch, -0.5, 0.4)
		rotation.y = yaw
		head.rotation.x = pitch
	if event.is_action_pressed("slot_1"):
		select_slot(0)
	elif event.is_action_pressed("slot_2"):
		select_slot(1)
	elif event.is_action_pressed("slot_3"):
		select_slot(2)
	elif event.is_action_pressed("slot_4"):
		select_slot(3)
	elif event.is_action_pressed("next_slot"):
		select_slot((slot + 1) % 4)
	elif event.is_action_pressed("prev_slot"):
		select_slot((slot + 3) % 4)


var _hide_yaw := 0.0


## Look by a screen-space delta (touch drag).
func look_delta(rel: Vector2) -> void:
	if not controls:
		return
	var sens: float = Game.settings.sens * Game.hub_sens * (0.35 if zoom else 1.0)
	yaw -= rel.x * sens
	pitch -= rel.y * sens * (-1.0 if Game.settings.invert_y else 1.0)
	pitch = clampf(pitch, -1.5, 1.5)
	if hidden_in:
		yaw = clampf(yaw, _hide_yaw - 0.9, _hide_yaw + 0.9)
		pitch = clampf(pitch, -0.5, 0.4)
	rotation.y = yaw
	head.rotation.x = pitch


# ---------------------------------------------------------------- physics --
func _physics_process(delta: float) -> void:
	rifle_cool -= delta
	if hidden_in:
		_update_target()
		if controls and (Input.is_action_just_pressed("interact") or Input.is_action_just_pressed("use") or Input.is_action_just_pressed("jump")):
			unhide()
		_camera_fx(delta, 0.0)
		return
	var input := Vector2.ZERO
	if controls:
		input = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	# crouch
	var want_crouch := controls and Input.is_action_pressed("crouch")
	if want_crouch != crouching:
		if want_crouch or _can_stand():
			crouching = want_crouch
			shape.height = CROUCH_H if crouching else STAND_H
			col.position.y = shape.height * 0.5
	head.position.y = lerpf(head.position.y, EYE_CROUCH if crouching else EYE, minf(1.0, delta * 10.0))
	var sprint := controls and Input.is_action_pressed("sprint") and not crouching and input.y < 0.1
	var speed := CROUCH if crouching else (SPRINT if sprint else WALK)
	var in_water := _in_water()
	if in_water:
		speed *= 0.55
	var dir := (global_basis * Vector3(input.x, 0, input.y))
	dir.y = 0
	if dir.length() > 1.0:
		dir = dir.normalized()
	var accel := 12.0 if is_on_floor() else 3.0
	velocity.x = move_toward(velocity.x, dir.x * speed, accel * delta * speed)
	velocity.z = move_toward(velocity.z, dir.z * speed, accel * delta * speed)
	if not is_on_floor():
		velocity.y -= GRAVITY * delta
	elif controls and Input.is_action_just_pressed("jump"):
		velocity.y = JUMP_V * (0.75 if in_water else 1.0)
		Game.make_noise(global_position, 3.0, "step")
	move_and_slide()
	_push_items()
	# landing
	if is_on_floor() and not was_on_floor:
		var fall := fall_start - global_position.y
		if fall > 0.6:
			Game.sfx3d("land", global_position, -6.0 + minf(fall, 4.0) * 2.0)
			Game.make_noise(global_position, 3.0 + minf(fall * 2.0, 8.0), "step")
			shake(minf(fall * 0.08, 0.4))
	if not is_on_floor() and was_on_floor:
		fall_start = global_position.y
	if not is_on_floor():
		fall_start = maxf(fall_start, global_position.y)
	was_on_floor = is_on_floor()
	# footsteps
	var hv := Vector2(velocity.x, velocity.z).length()
	if is_on_floor() and hv > 0.5:
		step_acc += hv * delta
		var stride := 1.9 if sprint else 1.55
		if step_acc > stride:
			step_acc = 0.0
			var vol := -14.0 if crouching else (-4.0 if sprint else -9.0)
			Game.sfx3d("splash_step" if in_water else _step_sound(), global_position, vol, randf_range(0.9, 1.1), 18.0)
			if not crouching:
				Game.make_noise(global_position, 7.5 if sprint else 2.5, "step")
	if global_position.y < -15.0:
		global_position = Vector3(0, 1, 8)
		velocity = Vector3.ZERO
	_update_target()
	_handle_actions(delta)
	_camera_fx(delta, hv)


func _step_sound() -> String:
	var lp := global_position
	if Game.house and Game.house.room_at(lp) != "":
		return "step_wood"
	if Game.player_house and Game.player_house.contains(lp):
		return "step_wood"
	return "step_grass"


func _in_water() -> bool:
	if Game.water_frozen or Game.house == null:
		return false
	var lp: Vector3 = Game.house.to_local(global_position)
	return Sharkotron.POOL_RECT.has_point(Vector2(lp.x, lp.z)) and lp.y < NeighborHouse.WATER - 0.08 and lp.y > NeighborHouse.POOL - 0.3


func _can_stand() -> bool:
	var params := PhysicsShapeQueryParameters3D.new()
	var s := CapsuleShape3D.new()
	s.radius = 0.3
	s.height = STAND_H
	params.shape = s
	params.transform = Transform3D(Basis(), global_position + Vector3(0, STAND_H * 0.5 + 0.05, 0))
	params.collision_mask = Game.L_WORLD | Game.L_DOOR
	params.exclude = [get_rid()]
	return get_world_3d().direct_space_state.intersect_shape(params, 1).is_empty()


func _push_items() -> void:
	for i in get_slide_collision_count():
		var c := get_slide_collision(i)
		var o := c.get_collider()
		if o is RigidBody3D and not (o as RigidBody3D).freeze:
			var n := -c.get_normal()
			n.y = 0
			(o as RigidBody3D).apply_central_impulse(n * 0.35)


func _camera_fx(delta: float, hv: float) -> void:
	if is_on_floor() and hv > 0.5:
		bob += delta * hv * 2.2
	var by := sin(bob * 2.0) * 0.025 * minf(hv / 4.0, 1.4)
	var bx := cos(bob) * 0.015 * minf(hv / 4.0, 1.4)
	shake_amt = maxf(0.0, shake_amt - delta * 1.5)
	var sx := randf_range(-1, 1) * shake_amt * 0.05
	var sy := randf_range(-1, 1) * shake_amt * 0.05
	cam.position = Vector3(bx + sx, by + sy, 0)
	cam.fov = lerpf(cam.fov, 22.0 if zoom else float(Game.settings.fov), minf(1.0, delta * 8.0))
	if hold:
		_hold_bob += delta
		hold.position = Vector3(0.32 + bx * 0.6, -0.28 + by * 0.6 + sin(_hold_bob * 1.3) * 0.004, -0.55)
		if throw_charge >= 0.0:
			hold.position.z += throw_charge * 0.18


func shake(a: float) -> void:
	shake_amt = maxf(shake_amt, a)


# --------------------------------------------------------- interaction ----
func _update_target() -> void:
	target = null
	var prompt := ""
	ray.force_raycast_update()
	if ray.is_colliding():
		var c: Object = ray.get_collider()
		var n: Node = c as Node
		var depth := 0
		while n and depth < 4:
			if n.has_method("get_prompt"):
				var pr: String = n.get_prompt(self)
				if pr != "":
					target = n
					prompt = pr
				break
			n = n.get_parent()
			depth += 1
	if Game.hud:
		var extra := ""
		var hid := held_id()
		if target == null and hid != "":
			match hid:
				"toy_rifle":
					extra = Game.ctl("左クリック：撃つ", "「撃つ」ボタンで撃つ")
				"flashlight":
					extra = Game.ctl("左クリック：ライトのON/OFF", "「ライト」ボタンでON/OFF")
				"binoculars":
					extra = Game.ctl("左クリック長押し：のぞく", "「のぞく」ボタン長押しでのぞく")
		Game.hud.set_prompt(prompt, extra)


func _handle_actions(delta: float) -> void:
	if not controls:
		return
	var use := Input.is_action_just_pressed("use")
	var inter := Input.is_action_just_pressed("interact")
	if inter or use:
		if target:
			target.interact(self)
			use = false
			inter = false
	var hid := held_id()
	zoom = hid == "binoculars" and Input.is_action_pressed("use") and target == null
	if use and hid != "":
		match hid:
			"toy_rifle":
				_shoot()
			"flashlight":
				flash_on = not flash_on
				flashlight.visible = flash_on
				Game.sfx("switch", -6.0)
			"apple":
				Game.sfx("eat", -2.0)
				_consume_held()
	# throw (hold right mouse to charge)
	if Input.is_action_just_pressed("throw") and held_item() != null:
		throw_charge = 0.0
	if throw_charge >= 0.0:
		throw_charge = minf(1.0, throw_charge + delta * 1.4)
		if Input.is_action_just_released("throw") or not Input.is_action_pressed("throw"):
			throw_held(throw_charge)
			throw_charge = -1.0
	if Input.is_action_just_pressed("drop") and held_item() != null:
		throw_held(-1.0)
	if hid != "flashlight" and flash_on:
		flash_on = false
		flashlight.visible = false


func _shoot() -> void:
	if rifle_cool > 0.0:
		return
	rifle_cool = 0.45
	Game.sfx3d("rifle_shot", cam.global_position, 0.0)
	Game.make_noise(global_position, 6.0, "shot")
	shake(0.12)
	var from := cam.global_position
	var to := from - cam.global_basis.z * 45.0
	var q := PhysicsRayQueryParameters3D.create(from, to, Game.L_WORLD | Game.L_DOOR | Game.L_GLASS | Game.L_USE | Game.L_ITEM)
	q.exclude = [get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(q)
	if hit.is_empty():
		return
	var c: Object = hit.collider
	if c.has_method("on_shot"):
		c.on_shot(self)
	elif c.has_method("break_glass"):
		c.break_glass(hit.position, -cam.global_basis.z * 8.0)
	elif c is RigidBody3D:
		(c as RigidBody3D).apply_impulse(-cam.global_basis.z * 1.5, hit.position - (c as Node3D).global_position)
		Game.sfx3d("impact_soft", hit.position, -4.0)
	else:
		Game.sfx3d("impact_soft", hit.position, -6.0)
	# little cork pellet puff
	var puff := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.04
	sm.height = 0.08
	puff.mesh = sm
	puff.material_override = Mats.get_mat("paper")
	Game.main.add_child(puff)
	puff.global_position = hit.position
	var tw := puff.create_tween()
	tw.tween_property(puff, "scale", Vector3.ONE * 0.1, 0.4)
	tw.tween_callback(puff.queue_free)


# --------------------------------------------------------------- inventory --
func held_item() -> Item:
	return inventory[slot]


func held_id() -> String:
	var it: Item = inventory[slot]
	return it.item_id if it else ""


func select_slot(i: int) -> void:
	slot = i
	_refresh_view()
	Game.sfx("slot", -12.0)


func pick_up(it: Item) -> void:
	if it == null or not it.pickable:
		return
	var idx := -1
	if inventory[slot] == null:
		idx = slot
	else:
		for i in 4:
			if inventory[i] == null:
				idx = i
				break
	if idx == -1:
		Game.message(Game.ctl("持ち物がいっぱい（Qで捨てる / 右クリックで投げる）", "持ち物がいっぱい（「捨てる」か「投げる」で手放す）"), 2.5)
		return
	if it.get_parent():
		it.get_parent().remove_child(it)
	it.freeze = false
	it.linear_velocity = Vector3.ZERO
	it.angular_velocity = Vector3.ZERO
	inventory[idx] = it
	slot = idx
	it.notify_picked()
	Game.sfx("pickup", -4.0)
	_refresh_view()


## Puts an item straight into the inventory (or drops it at the feet if full).
func give(it: Item) -> void:
	pick_up(it)


func take_held() -> Item:
	var it: Item = inventory[slot]
	inventory[slot] = null
	_refresh_view()
	return it


func _consume_held() -> void:
	var it := take_held()
	if it:
		it.queue_free()


func throw_held(charge: float) -> void:
	var it := take_held()
	if it == null:
		return
	Game.main.items_root.add_child(it)
	var fwd := -cam.global_basis.z
	var start := cam.global_position + fwd * 0.45 + Vector3(0, -0.1, 0)
	# don't spawn inside a wall
	var q := PhysicsRayQueryParameters3D.create(cam.global_position, start + fwd * 0.3, Game.L_WORLD | Game.L_DOOR)
	q.exclude = [get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(q)
	if not hit.is_empty():
		start = cam.global_position + fwd * 0.05
	it.global_position = start
	it.global_rotation = Vector3(0, yaw, 0)
	if charge < 0.0:
		it.linear_velocity = velocity * 0.5 + fwd * 1.0
	else:
		var force: float = lerpf(4.5, 14.0, charge) / maxf(1.0, sqrt(it.mass) * 0.7)
		it.linear_velocity = velocity * 0.5 + fwd * force + Vector3(0, 1.0, 0)
		it.angular_velocity = Vector3(randf_range(-4, 4), randf_range(-4, 4), randf_range(-4, 4))
		Game.sfx("throw", -4.0)


func _refresh_view() -> void:
	if held_view:
		held_view.queue_free()
		held_view = null
	var it: Item = inventory[slot]
	if it:
		held_view = it.make_view()
		hold.add_child(held_view)
		if it.large:
			held_view.position += Vector3(-0.32, -0.05, -0.35)
	if Game.hud:
		Game.hud.update_inventory(inventory, slot)


func clear_inventory() -> void:
	for i in 4:
		if inventory[i]:
			inventory[i].queue_free()
		inventory[i] = null
	_refresh_view()


# ------------------------------------------------------------------ hiding --
func hide_in(spot: HideSpot) -> void:
	if hidden_in or spot.occupied:
		return
	hidden_in = spot
	spot.occupied = true
	spot.set_doors_open(true)
	Game.sfx3d("wardrobe" if spot.kind == "wardrobe" else "cloth", spot.global_position, -2.0)
	col.disabled = true
	velocity = Vector3.ZERO
	var tw := create_tween()
	tw.tween_interval(0.25)
	tw.tween_callback(func():
		spot.set_doors_open(false)
		global_position = spot.view_point.global_position - Vector3(0, EYE, 0)
		var to := spot.exit_point.global_position - spot.view_point.global_position
		_hide_yaw = atan2(-to.x, -to.z)
		set_look(_hide_yaw, -0.05 if spot.kind == "wardrobe" else 0.0)
		head.position.y = EYE)
	if Game.hud:
		Game.hud.set_hidden(true, spot.kind)


func unhide(forced := false) -> void:
	if hidden_in == null:
		return
	var spot := hidden_in
	hidden_in = null
	spot.occupied = false
	spot.set_doors_open(true)
	if not forced:
		var tw := create_tween()
		tw.tween_interval(0.5)
		tw.tween_callback(func(): spot.set_doors_open(false))
	global_position = spot.exit_point.global_position + Vector3(0, 0.05, 0)
	col.disabled = false
	velocity = Vector3.ZERO
	if Game.hud:
		Game.hud.set_hidden(false, "")
