class_name SecurityCam
extends Item
## Alpha 1 security camera: white/black body, red light, grey stand.
## It is sound-sensitive: noises near it make it buzz, which brings the
## Neighbor. Neutralised by cutting the electricity (then it can be picked
## up) or by the button in the CCTV room. The Neighbor places new ones where
## he has spotted or caught the player.

const HEAR := 8.5

var cooldown := 0.0
var neutralised := false
var led: MeshInstance3D
var blink := 0.0


static func place(pos: Vector3, look_pos: Vector3) -> SecurityCam:
	var c := SecurityCam.new()
	c.item_id = "cam"
	c.display_name = "監視カメラ"
	var v := Node3D.new()
	v.name = "Visual"
	c.add_child(v)
	c.visual = v
	Items._build_camera_visual(v)
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = Vector3(0.36, 0.56, 0.36)
	cs.shape = sh
	cs.position.y = 0.0
	c.add_child(cs)
	c.mass = 1.5
	c.view_scale = 0.8
	Game.main.items_root.add_child(c)
	c.global_position = pos + Vector3(0, 0.29, 0)
	var d := look_pos - pos
	c.global_rotation = Vector3(0, atan2(d.x, d.z), 0)
	c.freeze = true
	c.pickable = false
	c.add_to_group("security_cams")
	return c


func _ready() -> void:
	super._ready()
	led = visual.get_node_or_null("LED")
	Game.noise_made.connect(_on_noise)


func powered() -> bool:
	return Game.power_on and not Game.cameras_disabled and not neutralised


func _process(delta: float) -> void:
	cooldown -= delta
	pickable = not powered()
	if led:
		if powered():
			blink += delta
			led.visible = fmod(blink, 1.2) < 0.6 or cooldown > 3.5
		else:
			led.visible = false


func get_prompt(p: Node) -> String:
	if powered():
		return "監視カメラ（作動中）"
	return super.get_prompt(p)


func notify_picked() -> void:
	neutralised = true
	freeze = false
	super.notify_picked()


func _on_noise(pos: Vector3, radius: float, kind: String) -> void:
	if not powered() or cooldown > 0.0 or not is_inside_tree():
		return
	if kind in ["neighbor", "train"]:
		return
	var hear: float = minf(HEAR, maxf(radius, 3.0))
	if global_position.distance_to(pos) > hear:
		return
	cooldown = 6.0
	blink = 0.0
	Game.sfx3d("cam_buzz", global_position, 2.0, 1.0, 30.0)
	Game.raise_alert(pos, "camera")
	if Game.hud:
		Game.hud.flash_camera_alert()


static func spawn_near_player_route(pos: Vector3, look: Vector3) -> void:
	# Keep at most 6 cameras: the oldest is removed.
	var cams := Game.main.get_tree().get_nodes_in_group("security_cams")
	var live: Array = []
	for c in cams:
		if c is SecurityCam and not (c as SecurityCam).neutralised and c.is_inside_tree():
			live.append(c)
	if live.size() >= 6:
		live[0].queue_free()
	place(pos, look)
