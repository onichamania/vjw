class_name Item
extends RigidBody3D
## A physics prop the player can pick up, carry in the 4-slot inventory,
## drop and throw. Thrown items break windows.

signal picked_up(item: Item)

var item_id := ""
var display_name := ""
var large := false
var pickable := true
var noise_radius := 5.0
var view_scale := 1.0
var view_offset := Vector3.ZERO
var view_rot := Vector3.ZERO
var visual: Node3D
var on_ground_time := 0.0
var _prev_vel := Vector3.ZERO
var _last_hit := 0.0
var _age := 0.0


func _ready() -> void:
	collision_layer = Game.L_ITEM
	collision_mask = Game.L_WORLD | Game.L_ITEM | Game.L_DOOR | Game.L_GLASS
	contact_monitor = true
	max_contacts_reported = 4
	continuous_cd = true
	can_sleep = true
	if not body_entered.is_connected(_on_body):
		body_entered.connect(_on_body)
	add_to_group("items")


func _physics_process(delta: float) -> void:
	_prev_vel = linear_velocity
	_age += delta
	# Safety net: anything that falls through the world comes back.
	if global_position.y < -20.0:
		linear_velocity = Vector3.ZERO
		global_position = Vector3(0, 2, 7)


func get_prompt(_p: Node) -> String:
	if not pickable:
		return ""
	return "拾う： " + display_name


func interact(p: Node) -> void:
	if pickable:
		p.pick_up(self)


func notify_picked() -> void:
	picked_up.emit(self)


func _on_body(b: Node) -> void:
	var spd := _prev_vel.length()
	if b.has_method("break_glass") and spd > 3.5:
		b.break_glass(global_position, _prev_vel)
		linear_velocity = _prev_vel * 0.75
		return
	if spd > 2.2 and _age - _last_hit > 0.18:
		_last_hit = _age
		var vol: float = clampf(-18.0 + spd * 2.5, -18.0, 2.0)
		Game.sfx3d("impact_soft" if mass < 1.0 else "impact", global_position, vol, randf_range(0.85, 1.15))
		Game.make_noise(global_position, noise_radius * clampf(spd / 7.0, 0.3, 1.3), "impact")


## A copy of the visual for the first-person "held" view.
func make_view() -> Node3D:
	var v: Node3D = visual.duplicate()
	v.scale = Vector3.ONE * view_scale
	v.position = view_offset
	v.rotation = view_rot
	for c in v.find_children("*", "GeometryInstance3D", true, false):
		(c as GeometryInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return v
