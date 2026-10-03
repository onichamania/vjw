class_name RangeTarget
extends StaticBody3D
## Pop-up target in the rifle range. Hit with the toy rifle.

var on_hit: Callable
var phase := 0.0
var z_min := 0.6
var z_max := 3.4
var base: Vector3
var active := false
var down_time := 0.0
var pivot: Node3D


static func make(parent: Node3D, pos: Vector3, ph: float) -> RangeTarget:
	var holder := Node3D.new()
	holder.position = pos
	parent.add_child(holder)
	var t := RangeTarget.new()
	t.collision_layer = 64
	t.collision_mask = 0
	t.phase = ph
	t.base = pos
	t.pivot = holder
	holder.add_child(t)
	var cs := CollisionShape3D.new()
	var sh := CylinderShape3D.new()
	sh.radius = 0.24
	sh.height = 0.04
	cs.shape = sh
	cs.rotation.z = PI / 2
	cs.position.y = 0.3
	t.add_child(cs)
	var cols := [Color("d52b25"), Color("f4f1e8"), Color("d52b25"), Color("f4f1e8"), Color("e8c22c")]
	for i in 5:
		var r := 0.24 - i * 0.05
		var d := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = r
		cm.bottom_radius = r
		cm.height = 0.02 + i * 0.004
		cm.radial_segments = 24
		d.mesh = cm
		d.material_override = Mats.solid(cols[i], 0.5, 0.0, true)
		d.rotation.z = PI / 2
		d.position.y = 0.3
		t.add_child(d)
	var stick := MeshInstance3D.new()
	stick.mesh = B.box_mesh(Vector3(0.03, 0.3, 0.03))
	stick.material_override = Mats.get_mat("metal_dark")
	stick.position.y = 0.05
	t.add_child(stick)
	t.rotation.z = -PI / 2
	return t


func _physics_process(delta: float) -> void:
	var target_rot := 0.0 if (active and down_time <= 0.0) else -PI / 2
	if down_time > 0.0:
		down_time -= delta
	rotation.z = lerp_angle(rotation.z, target_rot, minf(1.0, delta * 8.0))
	if active:
		phase += delta * 0.7
		var z: float = lerpf(z_min, z_max, 0.5 + 0.5 * sin(phase))
		pivot.position.z = z


func on_shot(_p: Node) -> void:
	if not active or down_time > 0.0:
		Game.sfx3d("impact_soft", global_position)
		return
	down_time = 2.2
	Game.sfx3d("target_hit", global_position, 0.0)
	if on_hit.is_valid():
		on_hit.call()
