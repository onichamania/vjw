class_name HousePuzzles
extends Node3D
## All Alpha 1 puzzles. Two ways into the basement (from the Alpha 1 guides):
##
## Lockpick method: furnace valve (back entrance) freezes the flooded room
##   and the Sharkotron -> cross the ice -> CCTV room lockpick ->
##   hammer (garage) or crowbar (under the bed) -> boards + copper lock.
## Copper key method: bell from the half-sunken drawer -> bell pole in the
##   grave room -> shovel -> dig -> coffin -> mannequin teacher -> classroom
##   (stops the paper planes) -> solve the sums with number magnets -> toy
##   rifle -> rifle range (needs electricity) -> silver key -> counter gate ->
##   storeroom -> jackhammer (upstairs bathroom) through the bricks ->
##   children room crib -> copper heart key.

const F1 := NeighborHouse.F1
const F2 := NeighborHouse.F2
const C1 := NeighborHouse.C1
const C2 := NeighborHouse.C2

var h: NeighborHouse

# boiler / power
var valve_wheel: Node3D
var fuse_lever: Node3D
var fuse_pos := Vector3(18.12, F1 + 1.45, 14.7)

# CCTV
var monitors: Array[MeshInstance3D] = []
var feeds: Array[SubViewport] = []
var feed_timer := 0.0

# grave
var bell_on_pole := false
var compartment_door: Node3D
var shovel: Item
var dirt_body: StaticBody3D
var dirt_shape: BoxShape3D
var dirt_mesh: MeshInstance3D
var mound: MeshInstance3D
var dirt_use: Usable
var dig_count := 0
var lid: Node3D
var lid_use: Usable
var lid_open := false
var teacher: Item

# classroom
var slots: Array = []
var teacher_placed := false
var class_solved := false
var disrupt_timer := 9.0
var reward_lid: Node3D
var rifle_reward: Item

# rifle range
var range_active := false
var stand_rifle: Node3D
var stand_has_rifle := false
var stand_rifle_item: Item
var score := 0
var key_given := false
var targets: Array[RangeTarget] = []
var score_label: Label3D
var gate_pivot: Node3D
var gate_body: AnimatableBody3D
var gate_locked := true
var range_lights: Array[Node3D] = []

# bricks
var brick_wall: Node3D
var brick_hits := 0

# basement door
var boards: Array[Node3D] = []
var board_uses: Array[Usable] = []
var lock_node: Node3D
var lock_open := false
var basement_door: Node3D
var basement_use: Usable

var _check_t := 0.0


func M(n: String) -> Material:
	return Mats.get_mat(n)


func setup(house: NeighborHouse) -> void:
	h = house
	_boiler_room()
	_garage_switch()
	_cctv_room()
	_grave_room()
	_classroom()
	_rifle_range()
	_brick_wall()
	_basement_door()
	_crib_key()
	Game.power_changed.connect(_on_power)
	# The Neighbor already has a couple of cameras out.
	call_deferred("_initial_cameras")


func _initial_cameras() -> void:
	SecurityCam.place(h.gpos(Vector3(10.4, F1, 0.7)), h.gpos(Vector3(9.0, F1, 9.0)))
	SecurityCam.place(h.gpos(Vector3(12.6, F2, 17.3)), h.gpos(Vector3(11.0, F2, 10.0)))


# ------------------------------------------------------------- boiler room --
func _boiler_room() -> void:
	# Valve on the large furnace.
	var vp := Vector3(21.98, F1 + 1.2, 15.4)
	F.pipe(self, Vector3(22.45, F1 + 1.2, 15.4), vp, 0.045, "copper")
	valve_wheel = Node3D.new()
	valve_wheel.position = vp
	add_child(valve_wheel)
	B.torus(valve_wheel, Vector3.ZERO, 0.13, 0.17, M("red"), Vector3(0, 0, PI / 2))
	for i in 3:
		var sp := B.box(valve_wheel, Vector3.ZERO, Vector3(0.02, 0.3, 0.02), M("red"), false)
		sp.rotation.x = i * PI / 3.0
	var u := Usable.make(self, vp, Vector3(0.2, 0.45, 0.45), "", _on_valve)
	u.prompt_fn = func(_p): return "バルブを戻す" if Game.water_frozen else "バルブを回す"
	# Fuse box / electrical panel on the wall.
	var fb := Node3D.new()
	fb.position = fuse_pos
	add_child(fb)
	B.box(fb, Vector3(0.06, 0, 0), Vector3(0.12, 0.7, 0.5), M("metal"), false)
	B.box(fb, Vector3(0.125, 0.0, 0), Vector3(0.01, 0.6, 0.42), M("metal_dark"), false)
	var warn := B.label(fb, Vector3(0.135, 0.22, 0), "DANGER", 28, Color(0.95, 0.85, 0.1), Vector3(0, PI / 2, 0), 6)
	warn.outline_modulate = Color.BLACK
	fuse_lever = Node3D.new()
	fuse_lever.position = Vector3(0.14, -0.05, 0.0)
	fb.add_child(fuse_lever)
	B.box(fuse_lever, Vector3(0.04, 0.09, 0), Vector3(0.04, 0.2, 0.05), M("black"), false)
	B.box(fuse_lever, Vector3(0.04, 0.2, 0), Vector3(0.06, 0.05, 0.12), M("red"), false)
	var fu := Usable.make(self, fuse_pos + Vector3(0.15, 0, 0), Vector3(0.18, 0.7, 0.5), "", _on_fuse)
	fu.prompt_fn = func(_p): return "電気を切る" if Game.power_on else "電気を入れる"


func _on_valve(_p: Node) -> void:
	var f := not Game.water_frozen
	Game.set_frozen(f)
	var tw := create_tween()
	tw.tween_property(valve_wheel, "rotation:x", valve_wheel.rotation.x + (TAU if f else -TAU), 1.0)
	Game.sfx3d("valve", h.gpos(valve_wheel.position), 0.0)
	Game.make_noise(h.gpos(valve_wheel.position), 5.0, "valve")
	if f:
		Game.sfx3d("freeze", h.gpos(Vector3(18.5, F2, 4.0)), 2.0, 1.0, 60.0)
		Game.hint("どこかで水が凍りつく音がした…", 3.5)
	# The Neighbor notices the tampering a little later. With the back door
	# left open he heads to the boiler room; closed, he goes the other way.
	get_tree().create_timer(randf_range(5.0, 8.0)).timeout.connect(_valve_suspicion)


func _valve_suspicion() -> void:
	var back: Door = h.doors["back"]
	if back.is_open:
		Game.raise_alert(h.gpos(Vector3(20.5, F1, 15.6)), "tamper")
	else:
		Game.raise_alert(h.gpos(Vector3(9.0, 0.0, -4.0)), "tamper")


func _on_fuse(_p: Node) -> void:
	Game.set_power(not Game.power_on)
	var tw := create_tween()
	tw.tween_property(fuse_lever, "rotation:z", 0.0 if Game.power_on else PI * 0.8, 0.2)
	Game.sfx3d("power_off" if not Game.power_on else "power_on", h.gpos(fuse_pos), 0.0)
	Game.make_noise(h.gpos(fuse_pos), 4.0, "switch")


# ------------------------------------------------------------------ garage --
func _garage_switch() -> void:
	h.garage_door = GarageDoor.make(h.dyn_root, Vector3(19.6, F1, 0.0), 3.8, 2.6)
	var sp := Vector3(19.15, F1 + 1.3, 1.1)
	B.box(self, sp, Vector3(0.06, 0.2, 0.12), M("white"), false)
	B.box(self, sp + Vector3(0.04, 0.03, 0), Vector3(0.03, 0.05, 0.04), M("red"), false)
	var u := Usable.make(self, sp + Vector3(0.06, 0, 0), Vector3(0.12, 0.3, 0.2), "", func(_p): h.garage_door.toggle())
	u.prompt_fn = func(_p): return "シャッターを閉める" if h.garage_door.is_open else "シャッターを開ける"


# --------------------------------------------------------------- CCTV room --
func _cctv_room() -> void:
	var u := F2
	for i in 3:
		var z := 10.9 + i * 0.9
		var mon := Node3D.new()
		mon.position = Vector3(23.5, u + 0.8, z)
		add_child(mon)
		B.box(mon, Vector3(0, 0.25, 0), Vector3(0.5, 0.45, 0.55), M("black"), false)
		var screen := MeshInstance3D.new()
		var pm := QuadMesh.new()
		pm.size = Vector2(0.44, 0.34)
		screen.mesh = pm
		screen.position = Vector3(-0.255, 0.27, 0)
		screen.rotation.y = -PI / 2
		mon.add_child(screen)
		monitors.append(screen)
	# Two live feeds + one static screen.
	var cams := [[Vector3(9.0, 3.2, -5.0), Vector3(9.0, 0.5, 4.0)], [Vector3(9.0, 3.0, 17.4), Vector3(9.0, 1.0, 2.0)]]
	for i in 2:
		var vp := SubViewport.new()
		vp.size = Vector2i(256, 192)
		vp.render_target_update_mode = SubViewport.UPDATE_DISABLED
		vp.world_3d = get_world_3d()
		add_child(vp)
		var cam := Camera3D.new()
		cam.fov = 80
		vp.add_child(cam)
		cam.global_position = h.gpos(cams[i][0])
		cam.look_at(h.gpos(cams[i][1]))
		feeds.append(vp)
		var mat := StandardMaterial3D.new()
		mat.albedo_texture = vp.get_texture()
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		mat.albedo_color = Color(0.75, 0.95, 0.8)
		monitors[i].material_override = mat
	monitors[2].material_override = M("screen_glow")
	# Kill switch for every camera in the house.
	var bp := Vector3(23.1, u + 0.82, 12.7)
	B.box(self, bp, Vector3(0.18, 0.05, 0.18), M("metal_dark"), false)
	var btn := B.cyl(self, bp + Vector3(0, 0.04, 0), 0.05, 0.04, M("red_light"), false, 16)
	btn.name = "KillButton"
	var bu := Usable.make(self, bp + Vector3(0, 0.05, 0), Vector3(0.25, 0.12, 0.25), "", _on_cctv_button)
	bu.prompt_fn = func(_p): return "" if Game.cameras_disabled else "監視カメラを全部止める"
	B.label(self, Vector3(23.75, u + 1.55, 11.8), "CCTV", 40, Color(0.7, 1.0, 0.7), Vector3(0, -PI / 2, 0))
	# The lockpick lies on the control room desk.
	HouseProps.item(h, "lockpick", Vector3(23.2, u + 0.8, 11.2), 0.4)


func _on_cctv_button(_p: Node) -> void:
	Game.cameras_disabled = true
	Game.sfx3d("switch", h.gpos(Vector3(23.1, F2 + 0.9, 12.7)))
	Game.sfx3d("power_off", h.gpos(Vector3(23.1, F2 + 0.9, 12.7)), -6.0)
	for m in monitors:
		m.material_override = M("screen_off")
	Game.hint("家じゅうの監視カメラが止まった", 3.0)


func _process(delta: float) -> void:
	_check_t -= delta
	if _check_t <= 0.0:
		_check_t = 0.5
		_check_jam_chair()
	# Live CCTV feeds only render when the player is close.
	if Game.player and feeds.size() > 0 and not Game.cameras_disabled and Game.power_on:
		var near: bool = Game.player.global_position.distance_to(h.gpos(Vector3(22.8, F2, 11.8))) < 7.0
		if near:
			feed_timer -= delta
			if feed_timer <= 0.0:
				feed_timer = 0.12
				for vp in feeds:
					vp.render_target_update_mode = SubViewport.UPDATE_ONCE
	_classroom_process(delta)


func _check_jam_chair() -> void:
	var d: Door = h.doors["class_hall2"]
	if not d.jammed:
		return
	var chair: Item = h.get_meta("jam_chair") if h.has_meta("jam_chair") else null
	var dc := d.center()
	if chair == null or not is_instance_valid(chair) or not chair.is_inside_tree() or chair.global_position.distance_to(dc) > 1.0:
		d.jammed = false


# ------------------------------------------------------------- grave room --
func _grave_room() -> void:
	# Pole for the bell (next to the cross)
	var pole_pos := Vector3(5.5, F1, 16.9)
	B.cyl(self, pole_pos + Vector3(0, 1.05, 0), 0.05, 2.1, M("wood_dark"), true, 10)
	B.box(self, pole_pos + Vector3(0, 2.05, 0.15), Vector3(0.05, 0.05, 0.35), M("wood_dark"), false)
	B.torus(self, pole_pos + Vector3(0, 1.98, 0.3), 0.02, 0.035, M("metal"), Vector3(PI / 2, 0, 0))
	var pu := Usable.make(self, pole_pos + Vector3(0, 1.2, 0.1), Vector3(0.5, 2.2, 0.6), "", _on_pole)
	pu.prompt_fn = func(p): return "" if bell_on_pole else ("ベルを掛ける" if p.held_id() == "bell" else "フックのついた柱")
	# Wall compartment on the left wall holding the shovel
	var cx := 0.1
	var cz := 13.9
	# hollow cabinet: back, sides, top, bottom
	B.bmm(self, Vector3(cx, F1 + 0.35, cz - 0.4), Vector3(cx + 0.04, F1 + 2.05, cz + 0.4), M("black"), false)
	B.bmm(self, Vector3(cx, F1 + 0.35, cz - 0.4), Vector3(cx + 0.32, F1 + 2.05, cz - 0.36), M("wood_dark"), true)
	B.bmm(self, Vector3(cx, F1 + 0.35, cz + 0.36), Vector3(cx + 0.32, F1 + 2.05, cz + 0.4), M("wood_dark"), true)
	B.bmm(self, Vector3(cx, F1 + 2.01, cz - 0.4), Vector3(cx + 0.32, F1 + 2.05, cz + 0.4), M("wood_dark"), true)
	B.bmm(self, Vector3(cx, F1 + 0.35, cz - 0.4), Vector3(cx + 0.32, F1 + 0.4, cz + 0.4), M("wood_dark"), true)
	compartment_door = Node3D.new()
	compartment_door.position = Vector3(cx + 0.32, F1 + 0.38, cz - 0.38)
	add_child(compartment_door)
	B.box(compartment_door, Vector3(0.02, 0.82, 0.38), Vector3(0.03, 1.64, 0.76), M("wood"), false)
	B.sphere(compartment_door, Vector3(0.05, 0.82, 0.7), 0.025, M("gold"))
	var lockplate := B.box(compartment_door, Vector3(0.04, 1.2, 0.38), Vector3(0.02, 0.12, 0.12), M("metal_dark"), false)
	lockplate.name = "Plate"
	var door_col := B.collider(self, Vector3(cx + 0.33, F1 + 1.2, cz), Vector3(0.04, 1.64, 0.76), 1)
	door_col.name = "CompartmentCollider"
	var cu := Usable.make(self, Vector3(cx + 0.38, F1 + 1.2, cz), Vector3(0.08, 1.6, 0.76), "", func(_p): Game.message("開かない。何かの仕掛けで開くようだ", 2.5))
	cu.name = "CompartmentUse"
	shovel = HouseProps.item(h, "shovel", Vector3(cx + 0.18, F1 + 1.15, cz), 0.0)
	shovel.rotation = Vector3(0, h.global_rotation.y, PI / 2)
	shovel.freeze = true
	shovel.pickable = false
	# The grave: dirt filling the pit, a coffin underneath.
	var gx := 3.5
	var gz := 15.2
	F.coffin(self, Vector3(gx, -0.7, gz), 0)
	lid = Node3D.new()
	lid.position = Vector3(gx, -0.17, gz)
	add_child(lid)
	B.box(lid, Vector3.ZERO, Vector3(0.8, 0.07, 2.04), M("wood_dark"), false)
	B.box(lid, Vector3(0, 0.04, -0.4), Vector3(0.08, 0.02, 0.5), M("gold"), false)
	B.box(lid, Vector3(0, 0.04, -0.5), Vector3(0.3, 0.02, 0.08), M("gold"), false)
	# a little pipe & bell rope for the "safety coffin"
	F.pipe(self, Vector3(gx + 0.3, -0.15, gz - 0.9), Vector3(gx + 0.3, F1 + 0.2, gz - 0.9), 0.03, "metal")
	teacher = HouseProps.item(h, "teacher", Vector3(gx, -0.45, gz), 0.0)
	teacher.rotation = Vector3(-PI / 2, h.global_rotation.y, 0)
	teacher.freeze = true
	teacher.pickable = false
	dirt_body = StaticBody3D.new()
	dirt_body.collision_layer = 1
	dirt_body.position = Vector3(gx, 0.0, gz)
	add_child(dirt_body)
	var cs := CollisionShape3D.new()
	dirt_shape = BoxShape3D.new()
	dirt_shape.size = Vector3(2.2, 0.3, 2.8)
	cs.shape = dirt_shape
	cs.position.y = F1 - 0.15
	dirt_body.add_child(cs)
	dirt_mesh = MeshInstance3D.new()
	dirt_mesh.mesh = BoxMesh.new()
	(dirt_mesh.mesh as BoxMesh).size = Vector3(2.2, 0.45, 2.8)
	dirt_mesh.material_override = M("dirt")
	dirt_mesh.position.y = F1 - 0.225
	dirt_body.add_child(dirt_mesh)
	mound = B.sphere(dirt_body, Vector3(0, F1 - 0.05, 0), 1.0, M("dirt"), Vector3(0.95, 0.3, 1.25), 18)
	dirt_use = Usable.make(self, Vector3(gx, F1 + 0.15, gz), Vector3(2.2, 0.5, 2.8), "", _on_dig)
	dirt_use.prompt_fn = func(p): return "シャベルで掘る" if p.held_id() == "shovel" else "盛り土（掘れそうだ）"
	lid_use = Usable.make(self, Vector3(gx, -0.1, gz), Vector3(0.8, 0.2, 2.0), "棺のフタを開ける", _on_lid)
	lid_use.enabled = false


func _on_pole(p: Node) -> void:
	if bell_on_pole or p.held_id() != "bell":
		return
	var bell: Item = p.take_held()
	h.items_root.add_child(bell)
	bell.freeze = true
	bell.pickable = false
	bell.global_position = h.gpos(Vector3(5.5, F1 + 1.72, 17.2))
	bell.global_rotation = Vector3(0, h.global_rotation.y, 0)
	bell_on_pole = true
	Game.sfx3d("bell", bell.global_position, 2.0, 1.0, 40.0)
	Game.make_noise(bell.global_position, 12.0, "bell")
	var tw := create_tween()
	tw.tween_interval(1.0)
	tw.tween_callback(func(): Game.sfx3d("door_open", h.gpos(Vector3(0.4, F1 + 1.2, 13.9)), 0.0, 0.7))
	tw.tween_property(compartment_door, "rotation:y", -1.9, 0.8)
	tw.tween_callback(func():
		shovel.pickable = true
		var col := get_node_or_null("CompartmentCollider")
		if col:
			col.queue_free()
		var cu := get_node_or_null("CompartmentUse")
		if cu:
			cu.queue_free()
		Game.hint("壁の扉が開いた", 2.5))


func _on_dig(p: Node) -> void:
	if p.held_id() != "shovel":
		Game.message("素手では掘れない", 2.0)
		return
	dig_count += 1
	var pos := h.gpos(Vector3(3.5, F1, 15.2))
	Game.sfx3d("dig", pos, 2.0, randf_range(0.9, 1.1))
	Game.make_noise(pos, 7.0, "dig")
	if Game.player:
		Game.player.shake(0.15)
	for i in 4:
		var clump := RigidBody3D.new()
		clump.collision_layer = 0
		clump.collision_mask = 1
		var mi := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.08
		sm.height = 0.14
		mi.mesh = sm
		mi.material_override = M("dirt")
		clump.add_child(mi)
		var c := CollisionShape3D.new()
		var ss := SphereShape3D.new()
		ss.radius = 0.07
		c.shape = ss
		clump.add_child(c)
		h.items_root.add_child(clump)
		clump.global_position = pos + Vector3(randf_range(-0.6, 0.6), 0.4, randf_range(-0.8, 0.8))
		clump.linear_velocity = Vector3(randf_range(-2, 2), 3.0, randf_range(-2, 2))
		get_tree().create_timer(3.0).timeout.connect(clump.queue_free)
	match dig_count:
		1:
			mound.scale = Vector3(0.95, 0.12, 1.25)
		2:
			mound.visible = false
			dirt_shape.size.y = 0.3
			dirt_body.get_child(0).position.y = -0.0
			dirt_mesh.position.y = -0.02
			(dirt_mesh.mesh as BoxMesh).size = Vector3(2.2, 0.25, 2.8)
			dirt_use.position.y = 0.0
		_:
			dirt_body.queue_free()
			dirt_use.queue_free()
			lid_use.enabled = true
			Game.hint("棺が出てきた", 2.5)


func _on_lid(_p: Node) -> void:
	if lid_open:
		return
	lid_open = true
	lid_use.queue_free()
	Game.sfx3d("coffin_open", h.gpos(Vector3(3.5, 0, 15.2)), 2.0)
	Game.make_noise(h.gpos(Vector3(3.5, 0, 15.2)), 6.0, "coffin")
	var tw := create_tween().set_parallel(true)
	tw.tween_property(lid, "position", lid.position + Vector3(0.95, 0.75, 0.0), 0.9)
	tw.tween_property(lid, "rotation:z", 1.2, 0.9)
	teacher.pickable = true


# --------------------------------------------------------------- classroom --
func _classroom() -> void:
	var u := F2
	F.blackboard(self, Vector3(5.16, u + 1.6, 6.5), PI / 2, 3.0, 1.3)
	var chalk := Color(0.93, 0.95, 0.88)
	var eqs := [["3 +", "= 8", 5], ["–  4 = 3", "", 7], ["2 ×", "= 8", 4]]
	# Row 2 has the blank first: "□ − 4 = 3"
	for i in 3:
		var y := u + 2.0 - i * 0.4
		var e: Array = eqs[i]
		var slot_z := 6.6
		if i == 1:
			slot_z = 7.3
			B.label(self, Vector3(5.22, y, 6.35), "−  4  =  3", 72, chalk, Vector3(0, PI / 2, 0))
		else:
			B.label(self, Vector3(5.22, y, 7.35), e[0], 72, chalk, Vector3(0, PI / 2, 0))
			B.label(self, Vector3(5.22, y, 5.85), e[1], 72, chalk, Vector3(0, PI / 2, 0))
		# chalk square
		for s: int in [-1, 1]:
			B.box(self, Vector3(5.205, y + s * 0.14, slot_z), Vector3(0.005, 0.015, 0.3), M("chalk"), false)
			B.box(self, Vector3(5.205, y, slot_z + s * 0.14), Vector3(0.005, 0.3, 0.015), M("chalk"), false)
		var su := Usable.make(self, Vector3(5.26, y, slot_z), Vector3(0.1, 0.32, 0.32), "", Callable())
		var slot := {"use": su, "answer": e[2], "item": null, "pos": Vector3(5.24, y, slot_z)}
		slots.append(slot)
		su.action = func(p): _on_slot(slot, p)
		su.prompt_fn = func(p): return _slot_prompt(slot, p)
	B.label(self, Vector3(5.22, u + 2.38, 6.5), "さんすう", 56, chalk, Vector3(0, PI / 2, 0))
	# Teacher's desk with two drawers; magnets hidden around the room.
	F.desk(self, Vector3(6.75, u, 6.4), -PI / 2, 1.4, 0.7)
	var drawers := [[u + 0.55, [7, 1]], [u + 0.25, [4, 9]]]
	for d in drawers:
		var front := Node3D.new()
		front.position = Vector3(7.11, d[0], 5.95)
		add_child(front)
		B.box(front, Vector3.ZERO, Vector3(0.02, 0.24, 0.42), M("wood_light"), false)
		B.box(front, Vector3(0.02, 0, 0), Vector3(0.03, 0.03, 0.12), M("gold"), false)
		var inside: Array[Item] = []
		for k in d[1].size():
			var mg := HouseProps.item(h, "magnet_%d" % d[1][k], Vector3(6.8, d[0] + 0.02, 5.85 + k * 0.2), 0.0, d[1][k])
			mg.freeze = true
			mg.pickable = false
			mg.visible = false
			inside.append(mg)
		var du := Usable.make(self, Vector3(7.16, d[0], 5.95), Vector3(0.1, 0.24, 0.42), "引き出しを開ける", Callable())
		du.action = func(_p):
			du.enabled = false
			Game.sfx3d("drawer", h.gpos(front.position))
			var tw := create_tween()
			tw.tween_property(front, "position:x", front.position.x + 0.35, 0.3)
			for mg2 in inside:
				mg2.visible = true
				mg2.pickable = true
				mg2.global_position = h.gpos(Vector3(7.35, d[0] + 0.04, 5.85 + inside.find(mg2) * 0.2))
	var top := HouseProps.item(h, "magnet_5", Vector3(6.8, u + 0.81, 6.9), 0.2, 5)
	top.freeze = true
	var sd := HouseProps.item(h, "magnet_2", Vector3(9.9, u + 0.75, 6.5), 0.0, 2)
	sd.freeze = true
	# Student desks (students face the blackboard)
	for sx: float in [8.6, 10.1, 11.6]:
		for sz: float in [5.0, 6.5, 8.0]:
			F.student_desk(self, Vector3(sx, u, sz), PI / 2)
	# Spot to stand the mannequin teacher next to the blackboard
	var spot := Vector3(6.0, u, 4.65)
	B.box(self, spot + Vector3(0, 0.08, 0), Vector3(0.9, 0.16, 0.7), M("wood_dark"))
	var tu := Usable.make(self, spot + Vector3(0, 0.9, 0), Vector3(0.9, 1.6, 0.7), "", _on_teacher_spot)
	tu.prompt_fn = func(p): return "" if teacher_placed else ("先生のマネキンを立てる" if p.held_id() == "teacher" else "教壇")
	# Posters & bulletin board
	F.painting(self, Vector3(12.88, u + 1.7, 6.5), -PI / 2, 1.2, 0.8, 51)
	B.box(self, Vector3(9.0, u + 1.6, 8.88), Vector3(1.6, 1.0, 0.03), M("cardboard"), false)
	for i in 5:
		B.box(self, Vector3(8.5 + i * 0.25, u + 1.6 + randf_range(-0.25, 0.25), 8.86), Vector3(0.2, 0.26, 0.005), M("paper"), false)
	# Reward crate under the blackboard (toy rifle inside)
	var crate := Vector3(5.6, u, 7.4)
	B.bmm(self, crate + Vector3(-0.25, 0, -0.55), crate + Vector3(0.25, 0.32, 0.55), M("wood"), true)
	reward_lid = Node3D.new()
	reward_lid.position = crate + Vector3(-0.25, 0.32, 0)
	add_child(reward_lid)
	B.box(reward_lid, Vector3(0.25, 0.02, 0), Vector3(0.52, 0.04, 1.12), M("wood_dark"), false)
	B.label(self, crate + Vector3(0.26, 0.18, 0), "?", 64, Color(1, 0.9, 0.4), Vector3(0, PI / 2, 0))
	rifle_reward = HouseProps.item(h, "toy_rifle", crate + Vector3(0, 0.38, 0), PI / 2)
	rifle_reward.freeze = true
	rifle_reward.pickable = false
	rifle_reward.visible = false
	lamp_room(9.0, 6.5)


func lamp_room(x: float, z: float) -> void:
	F.ceiling_lamp(self, Vector3(x, C2 - 0.06, z), 7.0, 1.1)


func _slot_prompt(slot: Dictionary, p: Node) -> String:
	if class_solved:
		return ""
	if slot.item != null:
		return "マグネットを外す"
	if p.held_id().begins_with("magnet_"):
		return "マグネットを貼る"
	return "黒板の空欄"


func _on_slot(slot: Dictionary, p: Node) -> void:
	if class_solved:
		return
	if slot.item != null:
		var it: Item = slot.item
		slot.item = null
		it.freeze = false
		it.pickable = true
		p.pick_up(it)
		return
	if not p.held_id().begins_with("magnet_"):
		return
	var mg: Item = p.take_held()
	h.items_root.add_child(mg)
	mg.freeze = true
	mg.pickable = false
	mg.global_position = h.gpos(slot.pos)
	mg.global_basis = h.global_basis * Basis(Vector3(0, 0, -1), Vector3(1, 0, 0), Vector3(0, -1, 0))
	slot.item = mg
	Game.sfx3d("magnet", mg.global_position)
	_check_board()


func _check_board() -> void:
	for s in slots:
		if s.item == null or int(s.item.get_meta("number", -1)) != s.answer:
			return
	class_solved = true
	Game.sfx("solve", 0.0)
	Game.hint("正解！ 黒板の下の箱が開いた", 3.0)
	var tw := create_tween()
	tw.tween_property(reward_lid, "rotation:z", 1.9, 0.6)
	rifle_reward.visible = true
	rifle_reward.pickable = true


func _on_teacher_spot(p: Node) -> void:
	if teacher_placed or p.held_id() != "teacher":
		return
	var t: Item = p.take_held()
	h.items_root.add_child(t)
	t.freeze = true
	t.pickable = false
	t.global_position = h.gpos(Vector3(6.0, F2 + 0.16 + 0.85, 4.65))
	t.global_rotation = Vector3(0, h.global_rotation.y + PI / 2, 0)
	teacher_placed = true
	Game.sfx3d("impact", t.global_position, -4.0)
	Game.hint("先生が見張っているので、もう誰もいたずらしない", 3.5)


func _classroom_process(delta: float) -> void:
	if teacher_placed or class_solved:
		return
	var any := false
	for s in slots:
		if s.item != null:
			any = true
	if not any:
		return
	disrupt_timer -= delta
	if disrupt_timer > 0.0:
		return
	disrupt_timer = randf_range(6.0, 10.0)
	_throw_paper()


func _throw_paper() -> void:
	# An invisible pupil at the back throws a paper plane / paper ball.
	var plane := Node3D.new()
	add_child(plane)
	var start := Vector3(12.6, F2 + 1.4, randf_range(5.0, 8.0))
	plane.position = start
	if randf() < 0.5:
		var pm := B.prism(plane, Vector3.ZERO, Vector3(0.25, 0.06, 0.32), M("paper"))
		pm.rotation = Vector3(0, PI / 2, PI)
	else:
		B.sphere(plane, Vector3.ZERO, 0.05, M("paper"), Vector3(1, 0.9, 1), 10)
	plane.look_at(to_global(Vector3(5.3, F2 + 1.6, 6.6)))
	Game.sfx3d("paper", h.gpos(start), -2.0)
	var tw := create_tween()
	tw.tween_property(plane, "position", Vector3(5.35, F2 + 1.6, randf_range(6.0, 7.2)), 1.1).set_trans(Tween.TRANS_SINE)
	tw.tween_callback(func():
		Game.sfx3d("impact_soft", h.gpos(plane.position), 0.0)
		for s in slots:
			if s.item != null:
				var it: Item = s.item
				s.item = null
				it.freeze = false
				it.pickable = true
				it.apply_central_impulse(h.global_basis * Vector3(0.25, 0.1, randf_range(-0.1, 0.1)))
		Game.message("紙飛行機が飛んできて、マグネットが落ちた！", 2.5)
		plane.queue_free())


# ------------------------------------------------------------- rifle range --
func _rifle_range() -> void:
	var u := F2
	# Counter + bars between the shooter and the targets.
	B.bmm(self, Vector3(6.4, u, 0.1), Vector3(6.8, u + 1.05, 2.9), M("wood"))
	B.bmm(self, Vector3(6.35, u + 1.05, 0.05), Vector3(6.85, u + 1.1, 2.95), M("wood_dark"))
	var z := 0.2
	while z < 2.9:
		B.box(self, Vector3(6.6, (u + 1.1 + C2) * 0.5, z), Vector3(0.025, C2 - u - 1.1, 0.025), M("metal"), false)
		z += 0.25
	B.collider(self, Vector3(6.6, (u + 1.1 + C2) * 0.5, 1.5), Vector3(0.1, C2 - u - 1.1, 2.8), Game.L_BARRIER)
	# Gate in the counter (silver lock)
	gate_pivot = Node3D.new()
	gate_pivot.position = Vector3(6.6, u, 3.9)
	gate_pivot.rotation.y = PI / 2
	add_child(gate_pivot)
	gate_body = AnimatableBody3D.new()
	gate_body.collision_layer = Game.L_DOOR
	gate_body.collision_mask = 0
	gate_pivot.add_child(gate_body)
	var gcs := CollisionShape3D.new()
	var gsh := BoxShape3D.new()
	gsh.size = Vector3(0.98, C2 - u - 0.1, 0.08)
	gcs.shape = gsh
	gcs.position = Vector3(0.5, (C2 - u - 0.1) * 0.5, 0)
	gate_body.add_child(gcs)
	B.box(gate_body, Vector3(0.5, 0.52, 0), Vector3(0.96, 1.04, 0.06), M("wood"), false)
	var gz := 0.1
	while gz < 0.95:
		B.box(gate_body, Vector3(gz, (1.1 + C2 - u) * 0.5, 0), Vector3(0.025, C2 - u - 1.15, 0.025), M("metal"), false)
		gz += 0.22
	var padlock := Node3D.new()
	padlock.position = Vector3(0.88, 0.9, 0.06)
	gate_body.add_child(padlock)
	B.box(padlock, Vector3.ZERO, Vector3(0.1, 0.1, 0.04), M("silver"), false)
	B.torus(padlock, Vector3(0, 0.07, 0), 0.025, 0.04, M("silver"), Vector3(PI / 2, 0, 0))
	var gu := Usable.make(self, Vector3(6.66, u + 0.9, 3.0), Vector3(0.3, 0.3, 0.3), "", func(p): _on_gate(p, padlock))
	gu.prompt_fn = func(p): return "" if not gate_locked else ("銀の鍵で開ける" if p.held_id() == "silver_key" else "銀の錠がかかっている")
	# Rifle stand on the counter
	var stand := Vector3(6.6, u + 1.1, 1.3)
	B.box(self, stand + Vector3(0, 0.04, -0.3), Vector3(0.12, 0.08, 0.06), M("wood_dark"), false)
	B.box(self, stand + Vector3(0, 0.04, 0.3), Vector3(0.12, 0.08, 0.06), M("wood_dark"), false)
	stand_rifle = Node3D.new()
	stand_rifle.position = stand + Vector3(0, 0.1, 0)
	stand_rifle.rotation.y = PI / 2
	stand_rifle.visible = false
	add_child(stand_rifle)
	var su := Usable.make(self, stand + Vector3(0.1, 0.1, 0), Vector3(0.4, 0.3, 0.9), "", _on_stand)
	su.prompt_fn = func(p): return "ライフルを取る" if stand_has_rifle else ("ライフルを台に置く" if p.held_id() == "toy_rifle" else "ライフル台")
	# Targets (move side to side when the range is running)
	for i in 4:
		var t := RangeTarget.make(self, Vector3(0.6 + i * 0.05, u + 1.0 + (i % 2) * 0.55, 0.6 + i * 0.9), i * 1.7)
		t.on_hit = _on_target_hit
		targets.append(t)
	# Score board & the pipe that drops the prize
	score_label = B.label(self, Vector3(0.14, u + 2.4, 2.0), "SCORE  000", 90, Color(1.0, 0.3, 0.2), Vector3(0, PI / 2, 0), 10)
	score_label.outline_modulate = Color(0.1, 0.0, 0.0)
	B.label(self, Vector3(0.14, u + 2.75, 2.0), "★ 300 = PRIZE ★", 48, Color(1.0, 0.85, 0.3), Vector3(0, PI / 2, 0))
	F.pipe(self, Vector3(8.6, u + 1.25, 0.35), Vector3(8.6, C2, 0.35), 0.09, "metal_rust")
	F.pipe(self, Vector3(0.2, C2 - 0.25, 1.0), Vector3(8.9, C2 - 0.25, 1.0), 0.07, "metal_dark")
	F.pipe(self, Vector3(0.2, C2 - 0.3, 3.0), Vector3(8.9, C2 - 0.3, 3.0), 0.07, "metal_dark")
	# Lots of lamps (only bright while the range is running)
	for i in 5:
		for j in 2:
			var lp := Vector3(1.0 + i * 1.5, C2 - 0.06, 1.0 + j * 2.0)
			var ln := Node3D.new()
			ln.position = lp
			add_child(ln)
			B.cyl(ln, Vector3(0, -0.15, 0), 0.006, 0.3, M("black"), false, 6)
			B.cyl(ln, Vector3(0, -0.33, 0), 0.14, 0.12, M("lamp_off"), false, 12, 0.05)
			var l := B.omni(ln, Vector3(0, -0.45, 0), Color(1.0, 0.9, 0.7), 0.9, 4.0)
			l.visible = false
			range_lights.append(ln)
	var dim := B.omni(self, Vector3(7.8, C2 - 0.6, 2.0), Color(1.0, 0.85, 0.65), 0.6, 4.0)
	dim.add_to_group("house_lights")


func _on_gate(p: Node, padlock: Node3D) -> void:
	if not gate_locked:
		return
	if p.held_id() != "silver_key":
		Game.sfx3d("door_locked", h.gpos(Vector3(6.6, F2 + 0.9, 3.0)))
		return
	p.take_held().queue_free()
	gate_locked = false
	Game.sfx3d("unlock", h.gpos(Vector3(6.6, F2 + 0.9, 3.0)))
	padlock.visible = false
	var tw := create_tween()
	tw.tween_interval(0.3)
	tw.tween_property(gate_pivot, "rotation:y", PI, 0.8)


func _on_stand(p: Node) -> void:
	if stand_has_rifle:
		stand_has_rifle = false
		stand_rifle.visible = false
		var it := stand_rifle_item
		stand_rifle_item = null
		h.items_root.add_child(it)
		it.global_position = h.gpos(stand_rifle.position)
		p.pick_up(it)
		return
	if p.held_id() != "toy_rifle":
		return
	stand_rifle_item = p.take_held()
	for c in stand_rifle.get_children():
		c.queue_free()
	var v := stand_rifle_item.visual.duplicate()
	stand_rifle.add_child(v)
	stand_rifle.visible = true
	stand_has_rifle = true
	Game.sfx3d("impact_soft", h.gpos(stand_rifle.position))
	if Game.power_on:
		_set_range(true)
		Game.hint("射撃場の明かりがついた！ ライフルを取って的を撃とう", 3.5)
	else:
		Game.sfx3d("switch", h.gpos(stand_rifle.position))
		Game.message("…何も起きない。電気が来ていないようだ", 3.0)


func _set_range(on: bool) -> void:
	range_active = on
	for t in targets:
		t.active = on
	for ln in range_lights:
		for c in ln.get_children():
			if c is OmniLight3D:
				c.visible = on and Game.power_on
			elif c is MeshInstance3D and c.position.y < -0.25:
				(c as MeshInstance3D).material_override = M("lamp_on") if on else M("lamp_off")
	if on:
		Game.sfx3d("power_on", h.gpos(Vector3(4.5, F2 + 2.0, 2.0)), 0.0)


func _on_target_hit() -> void:
	score += 100
	score_label.text = "SCORE  %03d" % score
	if score >= 300 and not key_given:
		key_given = true
		Game.sfx3d("solve", h.gpos(Vector3(8.6, F2 + 1.5, 0.35)), 0.0)
		var tw := create_tween()
		tw.tween_interval(0.8)
		tw.tween_callback(func():
			var k := HouseProps.item(h, "silver_key", Vector3(8.6, F2 + 1.15, 0.35), 0.0)
			k.linear_velocity = Vector3(0, -1.5, 0)
			Game.sfx3d("key_drop", k.global_position, 0.0)
			Game.hint("パイプから何かが落ちてきた！", 3.0))


func _on_power(on: bool) -> void:
	if not on and range_active:
		_set_range(false)
	elif on and stand_has_rifle and not range_active:
		_set_range(true)
	for m in monitors:
		if not Game.cameras_disabled:
			m.visible = on


# ------------------------------------------------------------- brick wall --
func _brick_wall() -> void:
	brick_wall = Node3D.new()
	brick_wall.position = Vector3(1.95, F2, 11.84)
	add_child(brick_wall)
	B.box(brick_wall, Vector3(0, 1.2, 0), Vector3(1.5, 2.4, 0.12), M("brick_exposed"), true)
	var bu := Usable.make(self, Vector3(1.95, F2 + 1.2, 11.72), Vector3(1.5, 2.3, 0.12), "", _on_bricks)
	bu.name = "BrickUse"
	bu.prompt_fn = func(p): return "削岩機でレンガを壊す" if p.held_id() == "jackhammer" else "むき出しのレンガの壁"


func _on_bricks(p: Node) -> void:
	if p.held_id() != "jackhammer":
		Game.message("素手では壊せない。何か道具が要る", 2.5)
		return
	brick_hits += 1
	var pos := h.gpos(Vector3(1.95, F2 + 1.2, 11.7))
	Game.sfx3d("jackhammer", pos, 6.0, 1.0, 60.0)
	Game.make_noise(pos, 32.0, "jackhammer")
	p.shake(0.5)
	if brick_hits < 3:
		Game.message("ガガガガッ！ もう少しだ… (%d/3)" % brick_hits, 1.5)
		return
	get_node("BrickUse").queue_free()
	brick_wall.queue_free()
	Game.sfx3d("bricks", pos, 6.0)
	for i in 28:
		var b := RigidBody3D.new()
		b.collision_layer = 0
		b.collision_mask = 1
		b.mass = 0.5
		var mi := MeshInstance3D.new()
		mi.mesh = B.box_mesh(Vector3(0.24, 0.085, 0.11))
		mi.material_override = Mats.solid(Color("8f4b36"), 0.95)
		b.add_child(mi)
		var cs := CollisionShape3D.new()
		var sh := BoxShape3D.new()
		sh.size = Vector3(0.24, 0.085, 0.11)
		cs.shape = sh
		b.add_child(cs)
		h.items_root.add_child(b)
		b.global_position = h.gpos(Vector3(1.3 + randf() * 1.3, F2 + 0.2 + randf() * 2.1, 11.84))
		b.linear_velocity = h.global_basis * Vector3(randf_range(-1, 1), randf_range(0, 2), randf_range(-3.5, -1.0))
		b.angular_velocity = Vector3(randf(), randf(), randf()) * 4.0
		get_tree().create_timer(8.0 + randf() * 3.0).timeout.connect(b.queue_free)


# ---------------------------------------------------------- basement door --
func _basement_door() -> void:
	basement_door = Node3D.new()
	basement_door.position = Vector3(16.6, F1, 7.74)
	add_child(basement_door)
	var panel := B.box(basement_door, Vector3(0.5, 1.15, 0), Vector3(1.0, 2.3, 0.07), Mats.surf(17, Color("7a2c22"), Color("6a241c"), Color("2a0d08"), 1.0, 0.7), true)
	panel.name = "Panel"
	_frame_basement()
	# Three boards nailed across
	for i in 3:
		var bd := B.box(self, Vector3(17.1, F1 + 0.55 + i * 0.7, 7.66), Vector3(1.35, 0.18, 0.04), M("wood_light"), false)
		bd.rotation.z = [0.12, -0.08, 0.15][i]
		for s: int in [-1, 1]:
			B.box(bd, Vector3(s * 0.55, 0, 0.025), Vector3(0.03, 0.03, 0.01), M("metal_dark"), false)
		boards.append(bd)
		var bu := Usable.make(self, Vector3(17.1, F1 + 0.55 + i * 0.7, 7.62), Vector3(1.3, 0.25, 0.08), "", Callable())
		bu.prompt_fn = func(p): return "板をはがす" if p.held_id() in ["hammer", "crowbar"] else "板が打ち付けてある（ハンマーかバールが要る）"
		var idx := i
		bu.action = func(p): _on_board(idx, p)
		board_uses.append(bu)
	# Copper padlock + hasp
	lock_node = Node3D.new()
	lock_node.position = Vector3(17.5, F1 + 1.05, 7.64)
	add_child(lock_node)
	B.box(lock_node, Vector3(0, 0, 0), Vector3(0.12, 0.13, 0.05), M("copper"), false)
	B.torus(lock_node, Vector3(0, 0.09, 0), 0.03, 0.045, M("copper"), Vector3(PI / 2, 0, 0))
	B.box(self, Vector3(17.62, F1 + 1.1, 7.69), Vector3(0.12, 0.05, 0.02), M("metal_dark"), false)
	var lu := Usable.make(self, Vector3(17.5, F1 + 1.05, 7.6), Vector3(0.22, 0.25, 0.1), "", _on_lock)
	lu.name = "LockUse"
	lu.prompt_fn = func(p):
		if lock_open:
			return ""
		var hid: String = p.held_id()
		if hid == "copper_key":
			return "銅のハートの鍵で開ける"
		if hid == "lockpick":
			return "ピッキングする"
		return "銅の錠（鍵が必要）"
	basement_use = Usable.make(self, Vector3(16.9, F1 + 1.6, 7.6), Vector3(0.6, 0.6, 0.08), "地下室のドア", _on_basement)
	basement_use.prompt_fn = func(_p): return "地下室のドアを開ける" if _basement_ready() else ""
	B.label(self, Vector3(17.1, F1 + 2.45, 7.66), "KEEP OUT", 36, Color(0.95, 0.85, 0.3), Vector3(0, PI, 0))


func _frame_basement() -> void:
	var tw := M("trim_white")
	B.bmm(self, Vector3(16.5, F1, 7.6), Vector3(16.6, F1 + 2.4, 7.75), tw, false)
	B.bmm(self, Vector3(17.6, F1, 7.6), Vector3(17.7, F1 + 2.4, 7.75), tw, false)
	B.bmm(self, Vector3(16.5, F1 + 2.3, 7.6), Vector3(17.7, F1 + 2.4, 7.75), tw, false)


func _on_board(idx: int, p: Node) -> void:
	var bd: Node3D = boards[idx]
	if bd == null or not is_instance_valid(bd) or not bd.visible:
		return
	if not (p.held_id() in ["hammer", "crowbar"]):
		Game.message("板が打ち付けてある。ハンマーかバールがあれば…", 2.5)
		return
	Game.sfx3d("board_pry", h.gpos(bd.position), 2.0, randf_range(0.9, 1.1))
	Game.make_noise(h.gpos(bd.position), 8.0, "board")
	bd.visible = false
	board_uses[idx].queue_free()
	# drop a loose board on the floor
	var plank := RigidBody3D.new()
	plank.collision_layer = 0
	plank.collision_mask = 1
	var mi := MeshInstance3D.new()
	mi.mesh = B.box_mesh(Vector3(1.35, 0.18, 0.04))
	mi.material_override = Mats.solid(Color("c9a575"), 0.7, 0.0, true)
	plank.add_child(mi)
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = Vector3(1.35, 0.18, 0.04)
	cs.shape = sh
	plank.add_child(cs)
	h.items_root.add_child(plank)
	plank.global_position = h.gpos(bd.position + Vector3(0, 0, -0.2))
	plank.linear_velocity = h.global_basis * Vector3(0, 0.5, -1.2)
	if _boards_left() == 0:
		Game.hint("板を全部はがした", 2.0)


func _boards_left() -> int:
	var n := 0
	for bd in boards:
		if bd.visible:
			n += 1
	return n


func _on_lock(p: Node) -> void:
	if lock_open:
		return
	var hid: String = p.held_id()
	if hid == "copper_key" or hid == "lockpick":
		lock_open = true
		Game.sfx3d("lockpick" if hid == "lockpick" else "unlock", h.gpos(lock_node.position), 0.0)
		var tw := create_tween()
		tw.tween_property(lock_node, "position:y", lock_node.position.y - 0.9, 0.5).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
		tw.tween_callback(lock_node.hide)
		get_node("LockUse").queue_free()
		Game.hint("錠が外れた", 2.0)
	else:
		Game.sfx3d("door_locked", h.gpos(lock_node.position))
		Game.message("銅の錠がかかっている", 2.0)


func _basement_ready() -> bool:
	return lock_open and _boards_left() == 0


func _on_basement(_p: Node) -> void:
	if not _basement_ready():
		if _boards_left() > 0:
			Game.message("板が打ち付けてあって開かない", 2.0)
		else:
			Game.message("鍵がかかっている", 2.0)
		return
	basement_use.enabled = false
	Game.main.start_ending()


func open_basement_door_anim(dur := 2.5) -> void:
	var tw := create_tween()
	tw.tween_property(basement_door, "rotation:y", 1.3, dur).set_trans(Tween.TRANS_SINE)


func slam_basement_door() -> void:
	var tw := create_tween()
	tw.tween_property(basement_door, "rotation:y", 0.0, 0.12)
	Game.sfx3d("slam", h.gpos(basement_door.position + Vector3(0.5, 1, 0)), 6.0)


# --------------------------------------------------------------- crib key --
func _crib_key() -> void:
	var k := HouseProps.item(h, "copper_key", Vector3(4.5, F2 + 0.6, 15.2), 0.3)
	k.freeze = true
