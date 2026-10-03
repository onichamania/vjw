class_name Door
extends Node3D
## Hinged door. The node itself is the hinge; the panel swings around it.
## The Neighbor opens doors of his own house as he walks through them.

var panel: AnimatableBody3D
var width := 1.1
var height := 2.2
var angle := 0.0
var target := 0.0
var is_open := false
var locked := false
var lock_text := "鍵がかかっている"
var key_id := ""            # item id that unlocks it (consumed: false)
var player_only := false    # the Neighbor can't open it (the player's house)
var jammed := false
var jam_text := "向こう側から何かでふさがれている"
var speed := 3.2
var on_opened: Callable


static func make(parent: Node, hinge: Vector3, w: float, h: float, yaw: float, mat: Material, start_open := false) -> Door:
	var d := Door.new()
	d.width = w
	d.height = h
	d.position = hinge
	d.rotation.y = yaw
	parent.add_child(d)
	d._build(mat)
	if start_open:
		d.angle = 1.5
		d.target = 1.5
		d.is_open = true
		d.panel.rotation.y = d.angle
	d.add_to_group("doors")
	return d


func _build(mat: Material) -> void:
	panel = AnimatableBody3D.new()
	panel.sync_to_physics = true
	panel.collision_layer = Game.L_DOOR
	panel.collision_mask = 0
	add_child(panel)
	var pw := width - 0.04
	var ph := height - 0.03
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = Vector3(pw, ph, 0.06)
	cs.shape = sh
	cs.position = Vector3(pw * 0.5 + 0.02, ph * 0.5, 0)
	panel.add_child(cs)
	var mi := MeshInstance3D.new()
	mi.mesh = B.box_mesh(Vector3(pw, ph, 0.055))
	mi.material_override = mat
	mi.position = cs.position
	panel.add_child(mi)
	# Raised panels for a bit of detail
	for zz: float in [-0.032, 0.032]:
		for py: float in [0.55, 1.45]:
			var pm := MeshInstance3D.new()
			pm.mesh = B.box_mesh(Vector3(pw * 0.62, 0.62, 0.012))
			pm.material_override = mat
			pm.position = Vector3(pw * 0.5 + 0.02, py * (ph / 2.17), zz)
			panel.add_child(pm)
		# handle
		var hn := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.035
		sm.height = 0.07
		hn.mesh = sm
		hn.material_override = Mats.get_mat("gold")
		hn.position = Vector3(pw - 0.08, 1.0, zz * 2.0)
		panel.add_child(hn)
	var kp := MeshInstance3D.new()
	kp.mesh = B.box_mesh(Vector3(0.05, 0.12, 0.07))
	kp.material_override = Mats.get_mat("metal_dark")
	kp.position = Vector3(pw - 0.08, 0.88, 0)
	panel.add_child(kp)


func _physics_process(delta: float) -> void:
	if abs(angle - target) > 0.001:
		angle = move_toward(angle, target, speed * delta)
		panel.rotation.y = angle


func get_prompt(p: Node) -> String:
	if is_open:
		return "ドアを閉める"
	if jammed:
		return "ドア（開かない）"
	if locked:
		if key_id != "" and p.held_id() == key_id:
			return "鍵を開ける"
		return "ドア（鍵がかかっている）"
	return "ドアを開ける"


func interact(p: Node) -> void:
	if is_open:
		close()
		return
	if jammed:
		Game.sfx3d("door_locked", global_position + Vector3.UP)
		Game.message(jam_text)
		return
	if locked:
		if key_id != "" and p.held_id() == key_id:
			locked = false
			Game.sfx3d("unlock", global_position + Vector3.UP)
			return
		Game.sfx3d("door_locked", global_position + Vector3.UP)
		Game.message(lock_text, 2.0)
		return
	open_from(p.global_position)


## Opens away from `from`.
func open_from(from: Vector3) -> void:
	if is_open:
		return
	var local := to_local(from)
	target = 1.55 if local.z > 0.0 else -1.55
	is_open = true
	Game.sfx3d("door_open", global_position + Vector3.UP, -4.0, randf_range(0.9, 1.1))
	Game.make_noise(global_position, 3.0, "door")
	if on_opened.is_valid():
		on_opened.call()


func close() -> void:
	if not is_open:
		return
	target = 0.0
	is_open = false
	Game.sfx3d("door_close", global_position + Vector3.UP, -3.0, randf_range(0.9, 1.1))
	Game.make_noise(global_position, 3.5, "door")


## Called by the Neighbor when a closed door is in his way.
func neighbor_open(from: Vector3) -> bool:
	if is_open:
		return true
	if player_only or jammed:
		return false
	open_from(from)
	return true


## World-space centre of the doorway (for proximity checks).
func center() -> Vector3:
	return global_transform * Vector3(width * 0.5, 1.0, 0)
