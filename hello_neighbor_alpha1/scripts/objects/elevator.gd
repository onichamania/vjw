class_name Elevator
extends Node3D
## Alpha 1 was the only version with a working elevator: in the main hallway,
## buttons 1-4 on the panel but only floors 1 and 2 actually work.
## Local coordinates are the house's (this node shares its transform).

const LEVELS := [NeighborHouse.F1, NeighborHouse.F2]
const SHAFT_X := 10.0
const SHAFT_Z := 17.1

var h: NeighborHouse
var cab: AnimatableBody3D
var level := 0
var target_level := 0
var moving := false
var leave_timer := 0.0
var door_panels: Array = []     # per level: [left, right]
var door_amount := [0.0, 0.0]
var door_target := [0.0, 0.0]
var motor: AudioStreamPlayer3D
var cab_light: OmniLight3D
var display: Label3D


func build(house: NeighborHouse) -> void:
	h = house
	var wall := Mats.get_mat("metal")
	var dark := Mats.get_mat("metal_dark")
	cab = AnimatableBody3D.new()
	cab.collision_layer = Game.L_DOOR
	cab.collision_mask = 0
	cab.position = Vector3(SHAFT_X, LEVELS[0], SHAFT_Z)
	add_child(cab)
	_cab_box(Vector3(0, -0.06, 0), Vector3(1.8, 0.12, 1.7), Mats.get_mat("tiles_grey"))
	_cab_box(Vector3(0, 1.2, 0.83), Vector3(1.8, 2.4, 0.04), wall)
	_cab_box(Vector3(-0.88, 1.2, 0), Vector3(0.04, 2.4, 1.7), wall)
	_cab_box(Vector3(0.88, 1.2, 0), Vector3(0.04, 2.4, 1.7), wall)
	_cab_box(Vector3(0, 2.42, 0), Vector3(1.8, 0.04, 1.7), dark)
	B.box(cab, Vector3(0, 0.95, 0.78), Vector3(1.5, 0.04, 0.05), Mats.get_mat("chrome"), false)
	cab_light = B.omni(cab, Vector3(0, 2.2, 0), Color(1.0, 0.95, 0.85), 0.8, 3.0)
	B.box(cab, Vector3(0, 2.38, 0), Vector3(0.6, 0.03, 0.3), Mats.get_mat("lamp_on"), false)
	# Button panel on the right wall
	var panel_pos := Vector3(0.84, 1.25, -0.45)
	B.box(cab, panel_pos, Vector3(0.03, 0.55, 0.22), dark, false)
	display = B.label(cab, panel_pos + Vector3(-0.02, 0.22, 0), "1", 48, Color(1, 0.5, 0.2), Vector3(0, -PI / 2, 0))
	for i in 4:
		var bp := panel_pos + Vector3(-0.025, 0.1 - i * 0.1, 0)
		B.cyl(cab, bp, 0.03, 0.02, Mats.get_mat("chrome"), false, 12).rotation.z = PI / 2
		B.label(cab, bp + Vector3(-0.015, 0, -0.06), str(i + 1), 28, Color.WHITE, Vector3(0, -PI / 2, 0))
		var u := Usable.make(cab, bp, Vector3(0.06, 0.08, 0.1), "%d階のボタン" % (i + 1), Callable())
		var lvl := i
		u.action = func(_p): press(lvl)
	# Landing doors on each floor (sliding) + call buttons
	for li in 2:
		var y: float = LEVELS[li]
		var pair: Array = []
		for s: int in [-1, 1]:
			var d := AnimatableBody3D.new()
			d.collision_layer = Game.L_DOOR
			d.collision_mask = 0
			d.position = Vector3(SHAFT_X + s * 0.275, y + 1.1, 16.2)
			add_child(d)
			var cs := CollisionShape3D.new()
			var sh := BoxShape3D.new()
			sh.size = Vector3(0.55, 2.2, 0.05)
			cs.shape = sh
			d.add_child(cs)
			B.box(d, Vector3.ZERO, Vector3(0.55, 2.2, 0.05), Mats.get_mat("chrome"), false)
			pair.append(d)
		door_panels.append(pair)
		var cp := Vector3(10.8, y + 1.2, 16.13)
		B.box(self, cp, Vector3(0.12, 0.2, 0.02), dark, false)
		B.cyl(self, cp + Vector3(0, 0, -0.015), 0.025, 0.02, Mats.get_mat("red_light"), false, 10).rotation.x = PI / 2
		var cu := Usable.make(self, cp + Vector3(0, 0, -0.04), Vector3(0.15, 0.25, 0.06), "エレベーターを呼ぶ", Callable())
		var target := li
		cu.action = func(_p): call_to(target)
		B.label(self, Vector3(10.0, y + 2.45, 16.12), "▲▼", 32, Color(1, 0.6, 0.2), Vector3(0, PI, 0))
	motor = Game.loop3d("elevator_motor", cab, -4.0, 20.0)
	door_target[0] = 0.0
	Game.power_changed.connect(func(on): cab_light.visible = on)


func _cab_box(pos: Vector3, size: Vector3, mat: Material) -> void:
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = size
	cs.shape = sh
	cs.position = pos
	cab.add_child(cs)
	B.box(cab, pos, size, mat, false)


func call_to(li: int) -> void:
	if not Game.power_on:
		Game.message("反応がない。電気が来ていないようだ", 2.0)
		Game.sfx3d("switch", h.gpos(Vector3(10.8, LEVELS[li] + 1.2, 16.1)))
		return
	Game.sfx3d("switch", h.gpos(Vector3(10.8, LEVELS[li] + 1.2, 16.1)), -6.0)
	if level == li and not moving:
		_open(li)
	else:
		_go(li)


func press(li: int) -> void:
	if not Game.power_on:
		Game.message("反応がない。電気が来ていないようだ", 2.0)
		return
	Game.sfx3d("switch", cab.global_position + Vector3(0, 1.2, 0), -6.0)
	if li >= 2:
		Game.sfx3d("door_locked", cab.global_position + Vector3(0, 1.2, 0), -6.0)
		Game.message("%d階のボタンは押しても光らない" % (li + 1), 2.0)
		return
	if li == level and not moving:
		_open(li)
		return
	_go(li)


func _go(li: int) -> void:
	if moving:
		return
	target_level = li
	_close_all()
	leave_timer = 1.0


func _open(li: int) -> void:
	door_target[li] = 1.0
	Game.sfx3d("elevator_door", h.gpos(Vector3(SHAFT_X, LEVELS[li] + 1.0, 16.2)), -4.0)


func _close_all() -> void:
	for i in 2:
		if door_target[i] > 0.0:
			Game.sfx3d("elevator_door", h.gpos(Vector3(SHAFT_X, LEVELS[i] + 1.0, 16.2)), -4.0)
		door_target[i] = 0.0


func _physics_process(delta: float) -> void:
	for i in 2:
		if abs(door_amount[i] - door_target[i]) > 0.001:
			door_amount[i] = move_toward(door_amount[i], door_target[i], delta * 1.6)
			var pair: Array = door_panels[i]
			(pair[0] as Node3D).position.x = SHAFT_X - 0.275 - door_amount[i] * 0.5
			(pair[1] as Node3D).position.x = SHAFT_X + 0.275 + door_amount[i] * 0.5
	if leave_timer > 0.0:
		leave_timer -= delta
		if leave_timer <= 0.0:
			moving = true
			if motor and motor.stream:
				motor.play()
	if moving:
		if not Game.power_on:
			return
		var ty: float = LEVELS[target_level]
		cab.position.y = move_toward(cab.position.y, ty, delta * 1.0)
		display.text = "1" if cab.position.y < (LEVELS[0] + LEVELS[1]) * 0.5 else "2"
		if abs(cab.position.y - ty) < 0.001:
			moving = false
			level = target_level
			if motor:
				motor.stop()
			var p := cab.global_position + Vector3(0, 1.5, 0)
			Game.sfx3d("elevator_ding", p, 0.0, 1.0, 40.0)
			Game.make_noise(p, 10.0, "elevator")
			_open(level)
