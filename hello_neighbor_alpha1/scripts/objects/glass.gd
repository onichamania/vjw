class_name Glass
extends StaticBody3D
## A breakable window pane. The Neighbor can see through it.

var size := Vector3.ONE
var broken := false


static func make(parent: Node, center: Vector3, sz: Vector3) -> Glass:
	var g := Glass.new()
	g.size = sz
	g.position = center
	g.collision_layer = 32
	g.collision_mask = 0
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = sz
	cs.shape = sh
	g.add_child(cs)
	var mi := MeshInstance3D.new()
	mi.mesh = B.box_mesh(sz)
	mi.material_override = Mats.get_mat("glass")
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	g.add_child(mi)
	parent.add_child(g)
	g.add_to_group("glass")
	return g


func break_glass(at: Vector3, vel := Vector3.ZERO) -> void:
	if broken:
		return
	broken = true
	Game.sfx3d("glass_break", at, 4.0, randf_range(0.9, 1.1), 60.0)
	Game.make_noise(at, 26.0, "glass")
	var mat := Mats.get_mat("glass")
	var gb := global_basis
	for i in 10:
		var shard := RigidBody3D.new()
		shard.collision_layer = 0
		shard.collision_mask = Game.L_WORLD
		shard.mass = 0.05
		var mi := MeshInstance3D.new()
		var s := Vector3(randf_range(0.08, 0.25), randf_range(0.08, 0.25), 0.012)
		mi.mesh = B.box_mesh(s)
		mi.material_override = mat
		shard.add_child(mi)
		var cs := CollisionShape3D.new()
		var sh := BoxShape3D.new()
		sh.size = s
		cs.shape = sh
		shard.add_child(cs)
		Game.main.add_child(shard)
		var local := Vector3(randf_range(-0.45, 0.45) * size.x, randf_range(-0.45, 0.45) * size.y, 0)
		shard.global_position = global_position + gb * local
		shard.rotation = Vector3(randf() * 3, randf() * 3, randf() * 3)
		shard.linear_velocity = vel * 0.25 + Vector3(randf_range(-1, 1), randf_range(0, 1.5), randf_range(-1, 1))
		shard.get_tree().create_timer(5.0).timeout.connect(shard.queue_free)
	queue_free()
