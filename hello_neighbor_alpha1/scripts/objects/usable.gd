class_name Usable
extends StaticBody3D
## Generic "press E here" fixture (valves, switches, puzzle slots...).
## Lives on the USE physics layer so only the interaction ray sees it.

var prompt := ""
var prompt_fn: Callable
var action: Callable
var enabled := true
var hold_time := 0.0  # > 0: the player must hold the button this long


static func make(parent: Node, center: Vector3, size: Vector3, prompt_text: String, act: Callable) -> Usable:
	var u := Usable.new()
	u.collision_layer = 64
	u.collision_mask = 0
	u.position = center
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = size
	cs.shape = sh
	u.add_child(cs)
	u.prompt = prompt_text
	u.action = act
	parent.add_child(u)
	return u


func get_prompt(p: Node) -> String:
	if not enabled:
		return ""
	if prompt_fn.is_valid():
		return prompt_fn.call(p)
	return prompt


func interact(p: Node) -> void:
	if enabled and action.is_valid():
		action.call(p)
