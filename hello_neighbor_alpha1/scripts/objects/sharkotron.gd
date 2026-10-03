class_name Sharkotron
extends Node3D
## Mechanical shark guarding the flooded room: motorised body, a fin above
## the water, a three-bladed propeller and a bear trap on its nose.
## Swims in circles; gets erratic when the player is at the water's edge and
## makes a beeline for anyone stepping into the water. Freezing the water
## (furnace valve) freezes the Sharkotron too.

const POOL_RECT := Rect2(13.35, 0.35, 10.3, 8.8)
const BLOCKS := [Rect2(18.5, 6.3, 4.0, 3.2), Rect2(20.9, 4.9, 1.4, 1.6), Rect2(12.9, 0.5, 1.6, 2.8),
	Rect2(14.3, 1.0, 1.6, 1.8), Rect2(14.2, 7.5, 4.5, 2.0), Rect2(15.0, 5.0, 1.2, 1.2)]

var h: NeighborHouse
var center := Vector2(18.6, 3.0)
var radius := 2.4
var ang := 0.0
var pos2 := Vector2(21.0, 3.0)
var heading := 0.0
var state := "patrol"
var model: Node3D
var prop: Node3D
var jaw_top: Node3D
var jaw_bot: Node3D
var eyes: Array[MeshInstance3D] = []
var motor: AudioStreamPlayer3D
var t := 0.0
var catch_cool := 0.0


func setup(house: NeighborHouse) -> void:
	h = house
	_build_model()
	motor = Game.loop3d("shark_motor", model, -8.0, 16.0)
	Game.water_changed.connect(_on_water)


func _build_model() -> void:
	model = Node3D.new()
	add_child(model)
	var body := Mats.solid(Color("8d969e"), 0.35, 0.7)
	var belly := Mats.solid(Color("d9dcd8"), 0.5, 0.2)
	var dark := Mats.get_mat("metal_dark")
	# body (forward = +x)
	B.capsule(model, Vector3(0, 0, 0), 0.32, 1.9, body, Vector3(0, 0, PI / 2), Vector3(1, 1, 0.85))
	B.capsule(model, Vector3(0.05, -0.12, 0), 0.25, 1.5, belly, Vector3(0, 0, PI / 2), Vector3(1, 0.7, 0.8))
	# rivets / panel lines
	for x: float in [-0.5, 0.0, 0.5]:
		B.torus(model, Vector3(x, 0, 0), 0.3, 0.33, dark, Vector3(0, 0, PI / 2))
	# dorsal fin (above water) and side fins
	var fin := B.prism(model, Vector3(-0.1, 0.55, 0), Vector3(0.7, 0.6, 0.06), body)
	fin.rotation.z = -0.2
	for s: int in [-1, 1]:
		var sf := B.prism(model, Vector3(0.2, -0.15, s * 0.35), Vector3(0.5, 0.06, 0.4), body)
		sf.rotation.x = s * 0.4
	# tail + propeller
	B.cyl(model, Vector3(-1.05, 0, 0), 0.08, 0.3, dark, false, 10).rotation.z = PI / 2
	prop = Node3D.new()
	prop.position = Vector3(-1.22, 0, 0)
	model.add_child(prop)
	for i in 3:
		var bl := B.box(prop, Vector3(0, 0.16, 0), Vector3(0.03, 0.32, 0.1), Mats.get_mat("chrome"), false)
		var holder := Node3D.new()
		prop.add_child(holder)
		bl.reparent(holder)
		holder.rotation.x = i * TAU / 3.0
	# red eyes
	for s: int in [-1, 1]:
		eyes.append(B.sphere(model, Vector3(0.78, 0.12, s * 0.18), 0.05, Mats.get_mat("red_light")))
	# bear trap jaws on the nose
	jaw_top = Node3D.new()
	jaw_top.position = Vector3(0.95, 0.0, 0)
	model.add_child(jaw_top)
	jaw_bot = Node3D.new()
	jaw_bot.position = Vector3(0.95, 0.0, 0)
	model.add_child(jaw_bot)
	for j: Node3D in [jaw_top, jaw_bot]:
		var sgn := 1.0 if j == jaw_top else -1.0
		B.torus(j, Vector3(0.18, 0, 0), 0.17, 0.2, Mats.get_mat("metal"), Vector3(0, 0, 0)).scale = Vector3(1, 1, 1)
		for k in 6:
			var a := -PI / 2 + k * PI / 5.0
			var tooth := B.prism(j, Vector3(0.18 + cos(a) * 0.17, -sgn * 0.04, sin(a) * 0.17), Vector3(0.04, 0.08, 0.03), Mats.get_mat("chrome"))
			tooth.rotation.z = PI if sgn > 0 else 0.0
		j.rotation.z = sgn * 0.5
	model.position = Vector3(pos2.x, NeighborHouse.WATER - 0.38, pos2.y)


func _on_water(frozen: bool) -> void:
	state = "frozen" if frozen else "patrol"
	if motor:
		if frozen:
			motor.stop()
		elif motor.stream:
			motor.play()
	for e in eyes:
		e.material_override = Mats.get_mat("black") if frozen else Mats.get_mat("red_light")


func _physics_process(delta: float) -> void:
	t += delta
	if motor and not motor.playing and state != "frozen" and motor.stream:
		motor.play()
	if state == "frozen":
		return
	catch_cool -= delta
	var target := Vector2.ZERO
	var spd := 1.6
	var pl := Vector3.ZERO
	var in_water := false
	var at_edge := false
	if Game.player and Game.mode == Game.Mode.PLAYING and not Game.player.hidden_in:
		pl = h.to_local(Game.player.global_position)
		var p2 := Vector2(pl.x, pl.z)
		var inside := POOL_RECT.grow(0.2).has_point(p2) and pl.y > NeighborHouse.POOL - 0.4 and pl.y < NeighborHouse.F2 + 1.0
		in_water = inside and pl.y < NeighborHouse.WATER - 0.08 and not _blocked(p2)
		at_edge = inside and not in_water
	if in_water:
		state = "chase"
		target = Vector2(pl.x, pl.z)
		spd = 6.0
	elif at_edge:
		state = "agitated"
		var p := _clamp(Vector2(pl.x, pl.z))
		target = p + Vector2(sin(t * 7.0), cos(t * 5.3)) * 0.8
		spd = 3.4
	else:
		state = "patrol"
		ang += delta * 0.65
		target = center + Vector2(cos(ang), sin(ang)) * radius
	var d := target - pos2
	if d.length() > 0.05:
		var step: float = minf(d.length(), spd * delta)
		pos2 += d.normalized() * step
		var desired := atan2(-d.y, d.x)
		heading = lerp_angle(heading, desired, minf(1.0, delta * (9.0 if state != "patrol" else 3.0)))
	pos2 = _clamp(pos2)
	var bob := sin(t * 2.3) * 0.03 + (sin(t * 23.0) * 0.02 if state == "agitated" else 0.0)
	model.position = Vector3(pos2.x, NeighborHouse.WATER - 0.38 + bob, pos2.y)
	model.rotation = Vector3(sin(t * 1.7) * 0.05, heading, sin(t * 2.1) * 0.04)
	prop.rotation.x += delta * (35.0 if state != "patrol" else 14.0)
	var bite := 0.5 + (sin(t * 18.0) * 0.4 if state == "chase" else 0.0)
	jaw_top.rotation.z = bite
	jaw_bot.rotation.z = -bite
	if motor:
		motor.pitch_scale = 1.5 if state == "chase" else (1.2 if state == "agitated" else 1.0)
	if state == "chase" and catch_cool <= 0.0:
		var dist := Vector2(pl.x, pl.z).distance_to(pos2)
		if dist < 0.95:
			catch_cool = 4.0
			Game.sfx3d("shark_bite", Game.player.global_position, 6.0)
			Game.sfx3d("splash", Game.player.global_position, 3.0)
			if Game.main:
				Game.main.player_ejected()


func _blocked(p: Vector2) -> bool:
	for r in BLOCKS:
		if (r as Rect2).has_point(p):
			return true
	return false


func _clamp(p: Vector2) -> Vector2:
	var q := Vector2(clampf(p.x, POOL_RECT.position.x, POOL_RECT.end.x), clampf(p.y, POOL_RECT.position.y, POOL_RECT.end.y))
	for r in BLOCKS:
		var rr: Rect2 = (r as Rect2).grow(0.45)
		if rr.has_point(q):
			var dl := q.x - rr.position.x
			var dr := rr.end.x - q.x
			var du := q.y - rr.position.y
			var dd := rr.end.y - q.y
			var m: float = minf(minf(dl, dr), minf(du, dd))
			if m == dl:
				q.x = rr.position.x
			elif m == dr:
				q.x = rr.end.x
			elif m == du:
				q.y = rr.position.y
			else:
				q.y = rr.end.y
	return q
