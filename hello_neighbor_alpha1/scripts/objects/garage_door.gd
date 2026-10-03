class_name GarageDoor
extends Node3D
## Roll-up garage door operated by the switch inside the garage.

var body: AnimatableBody3D
var visual: Node3D
var width := 3.8
var height := 2.6
var is_open := false
var t := 0.0
var target := 0.0
var player_only := false
var jammed := false


static func make(parent: Node, pos: Vector3, w: float, h: float) -> GarageDoor:
	var g := GarageDoor.new()
	g.width = w
	g.height = h
	g.position = pos
	parent.add_child(g)
	g._build()
	g.add_to_group("doors")
	return g


func _build() -> void:
	body = AnimatableBody3D.new()
	body.collision_layer = Game.L_DOOR
	body.collision_mask = 0
	body.position = Vector3(width * 0.5, height, 0)
	add_child(body)
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = Vector3(width, height, 0.08)
	cs.shape = sh
	cs.position.y = -height * 0.5
	body.add_child(cs)
	visual = Node3D.new()
	body.add_child(visual)
	var white := Mats.get_mat("white")
	var n := 5
	for i in n:
		var ph := height / n
		B.box(visual, Vector3(0, -ph * (i + 0.5), 0), Vector3(width - 0.02, ph - 0.02, 0.06), white, false)
		for j in 4:
			B.box(visual, Vector3(-width * 0.375 + j * width * 0.25, -ph * (i + 0.5), -0.035), Vector3(width * 0.2, ph * 0.55, 0.01), Mats.get_mat("trim_white"), false)
	B.box(visual, Vector3(0, -height + 0.25, -0.05), Vector3(0.3, 0.04, 0.04), Mats.get_mat("metal_dark"), false)
	# roller drum
	B.cyl(self, Vector3(width * 0.5, height + 0.12, 0.2), 0.15, width, Mats.get_mat("metal_dark"), false).rotation.z = PI / 2


func _physics_process(delta: float) -> void:
	if abs(t - target) > 0.001:
		t = move_toward(t, target, delta * 0.45)
		visual.scale.y = lerpf(1.0, 0.06, t)
		body.collision_layer = 0 if t > 0.8 else Game.L_DOOR


func toggle() -> void:
	target = 0.0 if target > 0.5 else 1.0
	is_open = target > 0.5
	Game.sfx3d("garage_door", global_position + Vector3(width * 0.5, 1.5, 0), 0.0)
	Game.make_noise(global_position + Vector3(width * 0.5, 1.0, 0), 9.0, "garage")


func open_from(_from: Vector3) -> void:
	if not is_open:
		toggle()


func neighbor_open(_from: Vector3) -> bool:
	if not is_open:
		toggle()
	return t > 0.8


func center() -> Vector3:
	return global_transform * Vector3(width * 0.5, 1.0, 0)
