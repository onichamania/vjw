class_name PlayerHouse
extends Node3D
## The protagonist's new house across the street. In Alpha 1 only two rooms
## are accessible: the entry room and the bedroom.
## Local coords: x 0..10, z 0..8, front (door) at z = 0 facing the street.

const FL := 0.3
const CE := 2.9

var front_door: Door
var bedroom_door: Door
var bed_use: Usable
var respawn: Node3D
var hide: HideSpot


func M(n: String) -> Material:
	return Mats.get_mat(n)


func build(dyn: Node3D) -> void:
	var dyn_root := Node3D.new()
	dyn.add_child(dyn_root)
	dyn_root.global_transform = global_transform
	var rooms := [
		["entry", Rect2(0, 0, 10, 4.5), "wp_player_beige", "floor_wood_light"],
		["bed", Rect2(0, 4.5, 5, 3.5), "wp_player_blue", "floor_wood_light"],
		["other", Rect2(5, 4.5, 5, 3.5), "plaster_white", "floor_wood_light"],
	]
	var ops := [
		{"line": "z", "c": 0.0, "a": 4.45, "b": 5.55, "y0": FL, "y1": FL + 2.2, "k": "door"},
		{"line": "z", "c": 4.5, "a": 1.5, "b": 2.6, "y0": FL, "y1": FL + 2.2, "k": "door"},
		{"line": "z", "c": 4.5, "a": 7.0, "b": 8.1, "y0": FL, "y1": FL + 2.2, "k": "door"},
		{"line": "z", "c": 0.0, "a": 1.2, "b": 3.2, "y0": 1.1, "y1": 2.3, "k": "window"},
		{"line": "z", "c": 0.0, "a": 6.8, "b": 8.8, "y0": 1.1, "y1": 2.3, "k": "window"},
		{"line": "z", "c": 8.0, "a": 1.5, "b": 3.5, "y0": 1.2, "y1": 2.3, "k": "window"},
		{"line": "x", "c": 0.0, "a": 1.4, "b": 3.0, "y0": 1.2, "y1": 2.3, "k": "window"},
		{"line": "x", "c": 10.0, "a": 1.4, "b": 3.0, "y0": 1.2, "y1": 2.3, "k": "window"},
	]
	for r in rooms:
		var rc: Rect2 = r[1]
		var x0 := rc.position.x
		var z0 := rc.position.y
		var x1 := rc.end.x
		var z1 := rc.end.y
		B.bmm(self, Vector3(x0, 0, z0), Vector3(x1, FL, z1), M(r[3]))
		B.bmm(self, Vector3(x0, CE, z0), Vector3(x1, CE + 0.06, z1), M("ceiling_white"))
		var wm := M(r[2])
		B.wall_x(self, z0 + 0.05, x0, x1, FL, CE, 0.1, wm, _o(ops, "z", z0))
		B.wall_x(self, z1 - 0.05, x0, x1, FL, CE, 0.1, wm, _o(ops, "z", z1))
		B.wall_z(self, x0 + 0.05, z0, z1, FL, CE, 0.1, wm, _o(ops, "x", x0))
		B.wall_z(self, x1 - 0.05, z0, z1, FL, CE, 0.1, wm, _o(ops, "x", x1))
	# Exterior
	var sid := M("siding_cream")
	B.wall_x(self, -0.06, -0.12, 10.12, 0.5, CE + 0.2, 0.12, sid, _o(ops, "z", 0.0))
	B.wall_x(self, 8.06, -0.12, 10.12, 0.5, CE + 0.2, 0.12, sid, _o(ops, "z", 8.0))
	B.wall_z(self, -0.06, 0, 8, 0.5, CE + 0.2, 0.12, sid, _o(ops, "x", 0.0))
	B.wall_z(self, 10.06, 0, 8, 0.5, CE + 0.2, 0.12, sid, _o(ops, "x", 10.0))
	var cuts := [{"a": 4.45, "b": 5.55, "y0": FL, "y1": 0.6}]
	B.wall_x(self, -0.08, -0.15, 10.15, 0.0, 0.5, 0.16, M("brick_grey"), cuts)
	B.bmm(self, Vector3(-0.15, 0, 8.0), Vector3(10.15, 0.5, 8.16), M("brick_grey"))
	B.bmm(self, Vector3(-0.16, 0, 0), Vector3(0, 0.5, 8), M("brick_grey"))
	B.bmm(self, Vector3(10.0, 0, 0), Vector3(10.16, 0.5, 8), M("brick_grey"))
	B.bmm(self, Vector3(-0.2, CE + 0.06, -0.2), Vector3(10.2, CE + 0.22, 8.2), M("trim_white"))
	B.gable_roof(self, -0.2, -0.2, 10.2, 8.2, CE + 0.22, 1.9, M("roof_grey"), sid, "x", 0.45)
	B.box(self, Vector3(7.8, CE + 1.6, 5.8), Vector3(0.6, 1.8, 0.6), M("brick_red"), false)
	var tw := M("trim_white")
	for p: Vector2 in [Vector2(-0.1, -0.1), Vector2(10.1, -0.1), Vector2(-0.1, 8.1), Vector2(10.1, 8.1)]:
		B.box(self, Vector3(p.x, (CE + 0.2) * 0.5 + 0.25, p.y), Vector3(0.16, CE - 0.3, 0.16), tw, false)
	# Porch & steps
	B.bmm(self, Vector3(3.6, 0, -1.6), Vector3(6.4, FL, 0), M("floor_wood_dark"))
	B.ramp(self, Vector3(5.0, 0.0, -2.2), Vector3(5.0, FL, -1.6), 1.8)
	B.bmm(self, Vector3(4.1, 0, -2.2), Vector3(5.9, 0.15, -1.6), M("concrete"))
	B.bmm(self, Vector3(3.4, 2.65, -1.8), Vector3(6.6, 2.78, 0), M("roof_grey"))
	for x: float in [3.55, 6.45]:
		B.box(self, Vector3(x, 1.45, -1.65), Vector3(0.12, 2.4, 0.12), tw)
	B.bmm(self, Vector3(4.4, -0.02, -6.0), Vector3(5.6, 0.02, -2.2), M("concrete"))
	B.bmm(self, Vector3(10.8, -0.02, -6.0), Vector3(14.6, 0.02, 0.5), M("concrete"))
	F.mailbox(self, Vector3(3.6, 0, -5.4), 0, "red")
	F.bush(self, Vector3(1.4, 0, -0.9), 1.0)
	F.bush(self, Vector3(8.6, 0, -0.9), 1.0)
	F.picket_fence(self, Vector3(-2.5, 0, -5.8), Vector3(4.2, 0, -5.8))
	F.picket_fence(self, Vector3(5.8, 0, -5.8), Vector3(10.6, 0, -5.8))
	# Windows
	for o in ops:
		if o.k == "window":
			_window(dyn_root, o)
		else:
			_frame(o)
	# Doors (the Neighbor can't open these: that's how he gets stuck in here)
	front_door = Door.make(dyn_root, Vector3(4.45, FL, 0.0), 1.1, 2.2, 0.0, M("red"))
	front_door.player_only = true
	bedroom_door = Door.make(dyn_root, Vector3(1.5, FL, 4.5), 1.1, 2.2, 0.0, M("wood_white"), true)
	bedroom_door.player_only = true
	var locked := Door.make(dyn_root, Vector3(7.0, FL, 4.5), 1.1, 2.2, 0.0, M("wood_white"))
	locked.player_only = true
	locked.locked = true
	locked.lock_text = "まだ荷ほどきが終わっていない部屋だ"
	# Entry room furniture
	F.tv(self, Vector3(9.3, FL, 2.2), -PI / 2, true)
	F.couch(self, Vector3(6.6, FL, 2.2), PI / 2, "fabric_blue")
	F.rug(self, Vector3(8.0, FL, 2.2), 0, 2.2, 2.0, "carpet_blue")
	F.boxes(self, Vector3(0.7, FL, 0.7), 0.2, 3, 61)
	F.boxes(self, Vector3(1.6, FL, 0.6), -0.2, 2, 62)
	F.boxes(self, Vector3(0.7, FL, 3.7), 0.1, 2, 63)
	F.boxes(self, Vector3(3.6, FL, 3.9), 0.5, 1, 64)
	F.lamp(self, Vector3(9.4, FL, 3.9), true, false)
	F.painting(self, Vector3(5.0, FL + 1.7, 4.38), PI, 0.9, 0.6, 71)
	var l1 := B.omni(self, Vector3(5.0, CE - 0.3, 2.2), Color(1.0, 0.88, 0.7), 1.0, 7.0)
	l1.name = "EntryLight"
	B.cyl(self, Vector3(5.0, CE - 0.05, 2.2), 0.25, 0.08, M("lamp_on"), false, 16)
	# Bedroom
	F.bed(self, Vector3(1.0, FL, 6.85), PI / 2, "fabric_green", 1.3, 2.0)
	F.wardrobe(self, Vector3(4.3, FL, 7.6), PI, "wood")
	F.nightstand(self, Vector3(0.45, FL, 5.0), PI / 2)
	F.lamp(self, Vector3(0.45, FL + 0.6, 5.0), false, false)
	F.boxes(self, Vector3(3.2, FL, 5.0), 0.3, 2, 65)
	var l2 := B.omni(self, Vector3(2.5, CE - 0.3, 6.2), Color(1.0, 0.85, 0.65), 0.8, 5.0)
	l2.name = "BedLight"
	bed_use = Usable.make(self, Vector3(1.0, FL + 0.6, 6.85), Vector3(2.0, 0.6, 1.3), "ベッドで眠る", func(_p): Game.main.player_sleep())
	respawn = Node3D.new()
	respawn.position = Vector3(2.3, FL + 0.05, 6.6)
	respawn.rotation.y = PI * 0.75
	add_child(respawn)
	# Items to play with
	HouseProps_item(dyn, "box", Vector3(2.4, FL + 0.26, 1.6))
	HouseProps_item(dyn, "box", Vector3(3.2, FL + 0.26, 1.0))
	HouseProps_item(dyn, "apple", Vector3(6.6, FL + 0.55, 1.8))
	HouseProps_item(dyn, "mug", Vector3(0.45, FL + 0.61, 4.8))
	HouseProps_item(dyn, "book", Vector3(9.2, FL + 0.52, 3.2))


func HouseProps_item(dyn: Node3D, id: String, p: Vector3) -> Item:
	var it := Items.make(id)
	dyn.add_child(it)
	it.global_position = to_global(p)
	return it


func _o(ops: Array, line: String, c: float) -> Array:
	var res: Array = []
	for o in ops:
		if o.line == line and abs(o.c - c) < 0.02:
			res.append({"a": o.a, "b": o.b, "y0": o.y0, "y1": o.y1})
	return res


func _frame(o: Dictionary) -> void:
	var tw := M("trim_white")
	var t := 0.32
	var w := 0.08
	if o.line == "z":
		B.bmm(self, Vector3(o.a - w, o.y0, o.c - t * 0.5), Vector3(o.a, o.y1 + w, o.c + t * 0.5), tw, false)
		B.bmm(self, Vector3(o.b, o.y0, o.c - t * 0.5), Vector3(o.b + w, o.y1 + w, o.c + t * 0.5), tw, false)
		B.bmm(self, Vector3(o.a - w, o.y1, o.c - t * 0.5), Vector3(o.b + w, o.y1 + w, o.c + t * 0.5), tw, false)
	else:
		B.bmm(self, Vector3(o.c - t * 0.5, o.y0, o.a - w), Vector3(o.c + t * 0.5, o.y1 + w, o.a), tw, false)
		B.bmm(self, Vector3(o.c - t * 0.5, o.y0, o.b), Vector3(o.c + t * 0.5, o.y1 + w, o.b + w), tw, false)
		B.bmm(self, Vector3(o.c - t * 0.5, o.y1, o.a - w), Vector3(o.c + t * 0.5, o.y1 + w, o.b + w), tw, false)


func _window(dyn_root: Node3D, o: Dictionary) -> void:
	_frame(o)
	var tw := M("trim_white")
	if o.line == "z":
		B.bmm(self, Vector3(o.a - 0.1, o.y0 - 0.07, o.c - 0.22), Vector3(o.b + 0.1, o.y0, o.c + 0.12), tw, false)
		B.bmm(self, Vector3((o.a + o.b) * 0.5 - 0.03, o.y0, o.c - 0.04), Vector3((o.a + o.b) * 0.5 + 0.03, o.y1, o.c + 0.04), tw, false)
		Glass.make(dyn_root, Vector3((o.a + o.b) * 0.5, (o.y0 + o.y1) * 0.5, o.c), Vector3(o.b - o.a - 0.04, o.y1 - o.y0 - 0.04, 0.02))
	else:
		B.bmm(self, Vector3(o.c - 0.22, o.y0 - 0.07, o.a - 0.1), Vector3(o.c + 0.12, o.y0, o.b + 0.1), tw, false)
		Glass.make(dyn_root, Vector3(o.c, (o.y0 + o.y1) * 0.5, (o.a + o.b) * 0.5), Vector3(0.02, o.y1 - o.y0 - 0.04, o.b - o.a - 0.04))


## Is a world position inside the player's house?
func contains(p: Vector3) -> bool:
	var lp := to_local(p)
	return lp.x > 0.0 and lp.x < 10.0 and lp.z > 0.0 and lp.z < 8.0 and lp.y < 3.5
