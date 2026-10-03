class_name NeighborHouse
extends Node3D
## Mr. Peterson's house as it was in Alpha 1 (Oct 2016):
## blue painted planks on a red brick foundation, six storeys of which only
## the first two are accessible, a red toy train circling the third floor,
## and the rooms listed for Alpha 1:
##   1F  Kitchen, Dining Room, Grave Room, Hallway(+elevator), Living Room
##       (+stairs, basement door), Bedroom, Bathroom, Boiler Room, Garage
##   2F  Flooded Room (Sharkotron), corridor, Rifle Range, Storeroom,
##       Children Room, Classroom, closet, upstairs hallway (blocked stairs to
##       3F, elevator), 2F Living Room, CCTV room, Bathroom (hole in floor)
## Local coordinates: x 0..24 (left->right seen from the street), z 0..18
## (front->back). The node itself is rotated so the front faces the street.

const F1 := 0.3     # ground floor level
const C1 := 3.3     # ground floor ceiling
const F2 := 4.3     # upstairs floor level
const C2 := 7.3     # upstairs ceiling
const POOL := 3.5   # flooded room pool bottom
const WATER := 4.2  # water surface
const DH := 2.2     # door height
const SKIN := 0.1
const EXT := 0.12

var openings: Array = []
var rooms := {}
var doors := {}
var windows: Array = []
var items_root: Node3D
var dyn_root: Node3D      # non-navmesh dynamic stuff
var water_mesh_nodes: Array[Node3D] = []
var ice_nodes: Array[Node3D] = []
var ice_bodies: Array[StaticBody3D] = []
var activity_spots: Array = []
var camera_spots: Array = []
var lamp_shades: Array = []
var puzzles: HousePuzzles
var train: Train
var elevator: Elevator
var shark: Sharkotron
var garage_door: GarageDoor


func M(n: String) -> Material:
	return Mats.get_mat(n)


func gpos(local: Vector3) -> Vector3:
	return to_global(local)


func build(dyn: Node3D) -> void:
	dyn_root = Node3D.new()
	dyn_root.name = "HouseDynamic"
	dyn.add_child(dyn_root)
	dyn_root.global_transform = global_transform
	items_root = dyn
	_define_rooms()
	_define_openings()
	_build_floors_and_ceilings()
	_build_room_skins()
	_build_exterior_walls()
	_build_openings()
	_build_elevator_shaft()
	_build_stairs()
	_build_flooded_room()
	_build_grave_pit()
	_build_exterior_details()
	_build_upper_floors()
	_build_yard()
	HouseProps.furnish(self)
	puzzles = HousePuzzles.new()
	puzzles.name = "Puzzles"
	puzzles.add_to_group("no_batch")
	add_child(puzzles)
	puzzles.setup(self)
	_build_train()
	_build_elevator()
	_build_sharkotron()
	_define_ai_spots()
	Game.power_changed.connect(_on_power)
	Game.water_changed.connect(_on_water)


# ------------------------------------------------------------------ rooms --
func _room(name: String, x0: float, z0: float, x1: float, z1: float, flr: int, wall: String, floor_m: String, ceil_m: String) -> void:
	rooms[name] = {"rect": Rect2(x0, z0, x1 - x0, z1 - z0), "floor": flr, "wall": wall, "fl": floor_m, "ce": ceil_m}


func _define_rooms() -> void:
	# Ground floor
	_room("kitchen", 0, 0, 7, 6.5, 1, "wp_kitchen_floral", "tiles_kitchen", "ceiling_white")
	_room("dining", 0, 6.5, 7, 12, 1, "wp_dining_floral", "tiles_dining", "ceiling_white")
	_room("grave", 0, 12, 7, 18, 1, "wp_grave_floral", "floor_wood_dark", "ceiling_white")
	_room("hall", 7, 0, 11, 18, 1, "wp_hall_damask", "floor_wood_dark", "ceiling_white")
	_room("living", 11, 0, 19, 9.5, 1, "wp_living_ears", "floor_polished", "ceiling_black")
	_room("bedroom", 11, 9.5, 18, 18, 1, "wp_bedroom_stripes", "floor_wood_dark", "ceiling_white")
	_room("garage", 19, 0, 24, 9.5, 1, "brick_exposed", "tiles_grey", "ceiling_black")
	_room("bath1", 18, 9.5, 24, 13.5, 1, "tiles_white", "tiles_bath", "ceiling_white")
	_room("boiler", 18, 13.5, 24, 18, 1, "brick_exposed", "tiles_boiler", "ceiling_dark")
	# Upstairs
	_room("rifle", 0, 0, 9, 4, 2, "panel_wood", "floor_wood_dark", "ceiling_dark")
	_room("c1", 9, 0, 13, 4, 2, "wp_hall2_stripes", "floor_wood_dark", "ceiling_white")
	_room("store", 0, 4, 5, 12, 2, "plaster_grey", "floor_wood_dark", "ceiling_dark")
	_room("classroom", 5, 4, 13, 9, 2, "plaster_cream", "floor_wood_light", "ceiling_white")
	_room("closet", 5, 9, 9, 12, 2, "plaster_grey", "floor_wood_dark", "ceiling_dark")
	_room("children", 0, 12, 9, 18, 2, "plaster_white", "carpet_kids", "ceiling_white")
	_room("hall2", 9, 9, 13, 18, 2, "wp_hall_damask", "floor_wood_dark", "ceiling_white")
	_room("flooded", 13, 0, 24, 9.5, 2, "wp_flooded", "tiles_grey", "ceiling_white")
	_room("living2", 13, 9.5, 20, 18, 2, "wp_living2_damask", "floor_wood_dark", "ceiling_white")
	_room("smallhall", 20, 9.5, 21.6, 18, 2, "wp_hall2_stripes", "floor_wood_dark", "ceiling_white")
	_room("cctv", 21.6, 9.5, 24, 14, 2, "plaster_dark", "tiles_grey", "ceiling_dark")
	_room("bath2", 21.6, 14, 24, 18, 2, "tiles_white", "tiles_bath", "ceiling_white")


# --------------------------------------------------------------- openings --
func _op(name: String, line: String, c: float, a: float, b: float, y0: float, y1: float, kind := "door") -> void:
	openings.append({"name": name, "line": line, "c": c, "a": a, "b": b, "y0": y0, "y1": y1, "kind": kind})


func _define_openings() -> void:
	var d0 := F1
	var d1 := F1 + DH
	# --- 1F doors ---
	_op("front", "z", 0, 8.45, 9.55, d0, d1)
	_op("kitchen_hall", "x", 7, 2.2, 3.3, d0, d1)
	_op("kitchen_dining", "z", 6.5, 2.8, 4.3, d0, F1 + 2.4, "arch")
	_op("dining_hall", "x", 7, 8.6, 9.7, d0, d1)
	_op("dining_grave", "z", 12, 3.0, 4.1, d0, d1)
	_op("grave_hall", "x", 7, 14.8, 15.9, d0, d1)
	_op("grave_out", "x", 0, 15.0, 16.1, d0, d1)
	_op("hall_living", "x", 11, 2.2, 3.3, d0, d1)
	_op("hall_bedroom", "x", 11, 12.0, 13.1, d0, d1)
	_op("living_garage", "x", 19, 2.2, 3.3, d0, d1)
	_op("bedroom_bath", "x", 18, 10.8, 11.9, d0, d1)
	_op("bath_boiler", "z", 13.5, 20.5, 21.6, d0, d1)
	_op("back", "z", 18, 19.2, 20.3, d0, d1)
	_op("garage_door", "z", 0, 19.6, 23.4, d0, F1 + 2.6, "garage")
	# --- 1F windows ---
	_op("w_kitchen_front", "z", 0, 1.8, 4.8, 1.25, 2.55, "window")
	_op("w_kitchen_side", "x", 0, 2.6, 4.2, 1.25, 2.55, "window")
	_op("w_dining_side", "x", 0, 8.4, 10.6, 1.15, 2.55, "window")
	_op("w_living_triple", "z", 0, 12.2, 17.8, 0.95, 2.65, "window3")
	_op("w_bedroom_back", "z", 18, 13.0, 15.6, 1.2, 2.55, "window")
	_op("w_bath1", "x", 24, 11.0, 12.4, 1.7, 2.5, "window")
	_op("w_boiler", "x", 24, 15.1, 16.2, 1.8, 2.5, "window")
	_op("w_hall_l", "z", 0, 7.55, 8.15, 1.0, 2.45, "window")
	_op("w_hall_r", "z", 0, 9.85, 10.45, 1.0, 2.45, "window")
	_op("w_grave_back", "z", 18, 2.5, 4.5, 1.3, 2.5, "window")
	# --- 2F doors ---
	var u0 := F2
	var u1 := F2 + DH
	_op("c1_flooded", "x", 13, 1.4, 2.5, u0, u1)
	_op("c1_rifle", "x", 9, 1.4, 2.5, u0, u1)
	_op("c1_class", "z", 4, 10.5, 11.6, u0, u1)
	_op("rifle_store", "z", 4, 1.4, 2.5, u0, u1)
	_op("store_children", "z", 12, 1.4, 2.5, u0, u1)
	_op("class_hall2", "z", 9, 10.5, 11.6, u0, u1)
	_op("children_closet", "z", 12, 6.5, 7.6, u0, u1)
	_op("children_out", "x", 0, 14.6, 15.7, u0, u1)
	_op("hall2_living2", "x", 13, 16.4, 17.5, u0, u1)
	_op("living2_small", "x", 20, 10.6, 11.7, u0, u1)
	_op("small_cctv", "x", 21.6, 11.0, 12.1, u0, u1)
	_op("small_bath2", "x", 21.6, 15.6, 16.7, u0, u1)
	_op("bath2_overhang", "z", 18, 21.8, 23.8, u0, F2 + 2.5, "open")
	# --- 2F windows ---
	_op("w_fl_front1", "z", 0, 15.0, 17.0, 5.2, 6.6, "window")
	_op("w_fl_front2", "z", 0, 20.0, 22.0, 5.2, 6.6, "window")
	_op("w_fl_side", "x", 24, 3.0, 5.0, 5.2, 6.6, "window")
	_op("w_c1_front", "z", 0, 10.4, 11.6, 5.3, 6.5, "window")
	_op("w_store", "x", 0, 7.0, 8.2, 5.4, 6.4, "window")
	_op("w_children_back", "z", 18, 2.0, 4.6, 5.2, 6.6, "window")
	_op("w_living2_back", "z", 18, 15.0, 17.6, 5.2, 6.6, "window")
	_op("w_hall2_back", "z", 18, 11.4, 12.6, 5.3, 6.5, "window")
	_op("w_cctv", "x", 24, 11.6, 12.6, 5.6, 6.4, "window")
	_op("w_bath2", "x", 24, 15.4, 16.4, 5.6, 6.4, "window")


func _ops_on(line: String, c: float) -> Array:
	var res: Array = []
	for o in openings:
		if o.line == line and abs(o.c - c) < 0.02:
			res.append(o)
	return res


# ------------------------------------------------------- floors / ceilings --
func _build_floors_and_ceilings() -> void:
	var stair_hole := Rect2(14.4, 7.8, 4.2, 1.6)
	var shaft_hole := Rect2(9.0, 16.2, 2.0, 1.8)
	var grave_hole := Rect2(2.4, 13.8, 2.2, 2.8)
	for n in rooms:
		var r: Dictionary = rooms[n]
		var rc: Rect2 = r.rect
		var x0 := rc.position.x
		var z0 := rc.position.y
		var x1 := rc.end.x
		var z1 := rc.end.y
		if r.floor == 1:
			var hole := Rect2()
			if n == "grave":
				hole = grave_hole
			B.slab(self, x0, z0, x1, z1, 0.0, F1, M(r.fl), hole)
			var ch := Rect2()
			if n == "living":
				ch = stair_hole
			elif n == "hall":
				ch = shaft_hole
			B.slab(self, x0, z0, x1, z1, C1, C1 + 0.06, M(r.ce), ch)
		else:
			if n == "flooded":
				B.slab(self, x0, z0, x1, z1, C1 + 0.07, POOL, M(r.fl), stair_hole)
			else:
				var hole2 := Rect2()
				if n == "hall2":
					hole2 = shaft_hole
				B.slab(self, x0, z0, x1, z1, F2 - 0.3, F2, M(r.fl), hole2)
			B.slab(self, x0, z0, x1, z1, C2 - 0.06, C2, M(r.ce))
	# Floor of the 2F bathroom overhang (with the infamous hole)
	B.slab(self, 21.6, 18.0, 24.0, 19.6, F2 - 0.3, F2, M("tiles_bath"), Rect2(22.1, 18.25, 1.5, 1.1))
	B.slab(self, 21.6, 18.0, 24.0, 19.6, C2 - 0.06, C2, M("ceiling_white"))


# -------------------------------------------------------------- room skins --
func _build_room_skins() -> void:
	for n in rooms:
		var r: Dictionary = rooms[n]
		var rc: Rect2 = r.rect
		var x0 := rc.position.x
		var z0 := rc.position.y
		var x1 := rc.end.x
		var z1 := rc.end.y
		var y0 := F1 if r.floor == 1 else F2
		var y1 := C1 if r.floor == 1 else C2
		if n == "flooded":
			y0 = POOL
		var mat := M(r.wall)
		B.wall_x(self, z0 + SKIN * 0.5, x0, x1, y0, y1, SKIN, mat, _span_ops("z", z0))
		B.wall_x(self, z1 - SKIN * 0.5, x0, x1, y0, y1, SKIN, mat, _span_ops("z", z1))
		B.wall_z(self, x0 + SKIN * 0.5, z0, z1, y0, y1, SKIN, mat, _span_ops("x", x0))
		B.wall_z(self, x1 - SKIN * 0.5, z0, z1, y0, y1, SKIN, mat, _span_ops("x", x1))
		# Skirting boards
		var sk := M("wood_dark") if r.wall != "tiles_white" else M("tiles_white")
		B.wall_x(self, z0 + SKIN + 0.01, x0, x1, y0, y0 + 0.12, 0.02, sk, _span_ops("z", z0), false)
		B.wall_x(self, z1 - SKIN - 0.01, x0, x1, y0, y0 + 0.12, 0.02, sk, _span_ops("z", z1), false)
		B.wall_z(self, x0 + SKIN + 0.01, z0, z1, y0, y0 + 0.12, 0.02, sk, _span_ops("x", x0), false)
		B.wall_z(self, x1 - SKIN - 0.01, z0, z1, y0, y0 + 0.12, 0.02, sk, _span_ops("x", x1), false)
	# Overhang walls of the upstairs bathroom
	B.wall_z(self, 21.65, 18.0, 19.6, F2, C2, SKIN, M("tiles_white"))
	B.wall_z(self, 23.95, 18.0, 19.6, F2, C2, SKIN, M("tiles_white"))
	B.wall_x(self, 19.55, 21.6, 24.0, F2, C2, SKIN, M("tiles_white"), [{"a": 22.4, "b": 23.2, "y0": 5.5, "y1": 6.4}])


func _sill_cuts(line: String, c: float) -> Array:
	var res: Array = []
	for o in _ops_on(line, c):
		if o.kind in ["door", "garage"] and o.y0 < 1.0:
			res.append({"a": o.a, "b": o.b, "y0": F1, "y1": 0.7})
	return res


func _span_ops(line: String, c: float) -> Array:
	var res: Array = []
	for o in _ops_on(line, c):
		res.append({"a": o.a, "b": o.b, "y0": o.y0, "y1": o.y1})
	return res


# ---------------------------------------------------------- exterior walls --
func _build_exterior_walls() -> void:
	var sid := M("siding_blue")
	var sid2 := M("siding_blue_light")
	# 1F + 2F as one tall skin per side (0 .. 7.3)
	B.wall_x(self, -EXT * 0.5, -EXT, 24 + EXT, 0.6, C1 + 0.2, EXT, sid, _span_ops("z", 0))
	B.wall_x(self, -EXT * 0.5, -EXT, 24 + EXT, C1 + 0.2, C2 + 0.3, EXT, sid2, _span_ops("z", 0))
	B.wall_x(self, 18 + EXT * 0.5, -EXT, 24 + EXT, 0.6, C1 + 0.2, EXT, sid, _span_ops("z", 18))
	B.wall_x(self, 18 + EXT * 0.5, -EXT, 24 + EXT, C1 + 0.2, C2 + 0.3, EXT, sid2, _span_ops("z", 18))
	B.wall_z(self, -EXT * 0.5, 0, 18, 0.6, C1 + 0.2, EXT, sid, _span_ops("x", 0))
	B.wall_z(self, -EXT * 0.5, 0, 18, C1 + 0.2, C2 + 0.3, EXT, sid2, _span_ops("x", 0))
	B.wall_z(self, 24 + EXT * 0.5, 0, 18, 0.6, C1 + 0.2, EXT, sid, _span_ops("x", 24))
	B.wall_z(self, 24 + EXT * 0.5, 0, 18, C1 + 0.2, C2 + 0.3, EXT, sid2, _span_ops("x", 24))
	# Overhang exterior
	B.wall_z(self, 21.6 - EXT * 0.5, 18, 19.6 + EXT, C1 + 0.7, C2 + 0.3, EXT, sid2)
	B.wall_z(self, 24 + EXT * 0.5, 18, 19.6 + EXT, C1 + 0.7, C2 + 0.3, EXT, sid2)
	B.wall_x(self, 19.6 + EXT * 0.5, 21.6 - EXT, 24 + EXT, C1 + 0.7, C2 + 0.3, EXT, sid2, [{"a": 22.4, "b": 23.2, "y0": 5.5, "y1": 6.4}])
	B.slab(self, 21.6 - EXT, 18.0, 24 + EXT, 19.6 + EXT, C1 + 0.4, F2 - 0.3, sid2, Rect2(22.1, 18.25, 1.5, 1.1))
	for x: float in [21.75, 23.85]:
		B.box(self, Vector3(x, (C1 + 0.7) * 0.5, 19.45), Vector3(0.18, C1 + 0.7, 0.18), M("wood_post"))
	# Red brick foundation band (cut down to the sill where doors are)
	var br := M("brick_red")
	B.wall_x(self, -0.1, -0.2, 24.2, 0.0, 0.6, 0.2, br, _sill_cuts("z", 0))
	B.wall_x(self, 18.1, -0.2, 24.2, 0.0, 0.6, 0.2, br, _sill_cuts("z", 18))
	B.wall_z(self, -0.1, 0.0, 18.0, 0.0, 0.6, 0.2, br, _sill_cuts("x", 0))
	B.wall_z(self, 24.1, 0.0, 18.0, 0.0, 0.6, 0.2, br, _sill_cuts("x", 24))
	# White corner boards and floor band
	var tw := M("trim_white")
	for p: Vector2 in [Vector2(-0.14, -0.14), Vector2(24.14, -0.14), Vector2(-0.14, 18.14), Vector2(24.14, 18.14)]:
		B.box(self, Vector3(p.x, (C2 + 0.3) * 0.5 + 0.3, p.y), Vector3(0.22, C2, 0.22), tw, false)
	B.bmm(self, Vector3(-0.17, C1 + 0.05, -0.17), Vector3(24.17, C1 + 0.3, -0.1), tw, false)
	B.bmm(self, Vector3(-0.17, C1 + 0.05, 18.1), Vector3(24.17, C1 + 0.3, 18.17), tw, false)
	B.bmm(self, Vector3(-0.17, C1 + 0.05, -0.1), Vector3(-0.1, C1 + 0.3, 18.1), tw, false)
	B.bmm(self, Vector3(24.1, C1 + 0.05, -0.1), Vector3(24.17, C1 + 0.3, 18.1), tw, false)


# ----------------------------------------------------- doors / windows ----
func _build_openings() -> void:
	var tw := M("trim_white")
	for o in openings:
		var kind: String = o.kind
		if kind == "window" or kind == "window3":
			_make_window(o)
			continue
		# Door casing (both sides of the wall)
		_frame(o, tw, kind == "garage")
		if kind == "door":
			var mat := M("wood")
			if o.name == "front":
				mat = M("trim_dark")
			elif o.name in ["back", "children_out", "grave_out"]:
				mat = M("wood_dark")
			var hinge: Vector3
			var yaw := 0.0
			if o.line == "z":
				hinge = Vector3(o.a, o.y0, o.c)
			else:
				hinge = Vector3(o.c, o.y0, o.a)
				yaw = -PI / 2
			var d := Door.make(dyn_root, hinge, o.b - o.a, o.y1 - o.y0, yaw, mat)
			doors[o.name] = d
	# Door states
	doors["grave_hall"].jammed = true
	doors["grave_hall"].jam_text = "反対側が家具でふさがれている"
	doors["grave_out"].jammed = true
	doors["grave_out"].jam_text = "反対側が家具でふさがれている"
	doors["class_hall2"].jammed = true
	doors["class_hall2"].jam_text = "イスがはさまっていて開かない。イスをどかそう"
	doors["class_hall2"].neighbor_unjam = true


func _frame(o: Dictionary, mat: Material, wide := false) -> void:
	var t := 0.3
	var w := 0.09
	if o.line == "z":
		B.bmm(self, Vector3(o.a - w, o.y0, o.c - t * 0.5), Vector3(o.a, o.y1 + w, o.c + t * 0.5), mat, false)
		B.bmm(self, Vector3(o.b, o.y0, o.c - t * 0.5), Vector3(o.b + w, o.y1 + w, o.c + t * 0.5), mat, false)
		B.bmm(self, Vector3(o.a - w, o.y1, o.c - t * 0.5), Vector3(o.b + w, o.y1 + w, o.c + t * 0.5), mat, false)
	else:
		B.bmm(self, Vector3(o.c - t * 0.5, o.y0, o.a - w), Vector3(o.c + t * 0.5, o.y1 + w, o.a), mat, false)
		B.bmm(self, Vector3(o.c - t * 0.5, o.y0, o.b), Vector3(o.c + t * 0.5, o.y1 + w, o.b + w), mat, false)
		B.bmm(self, Vector3(o.c - t * 0.5, o.y1, o.a - w), Vector3(o.c + t * 0.5, o.y1 + w, o.b + w), mat, false)


func _make_window(o: Dictionary) -> void:
	var tw := M("trim_white")
	var t := 0.3
	var w := 0.08
	var a: float = o.a
	var b: float = o.b
	var c: float = o.c
	var y0: float = o.y0
	var y1: float = o.y1
	var panes := 3 if o.kind == "window3" else (2 if b - a > 1.9 else 1)
	_frame(o, tw)
	# sill
	if o.line == "z":
		B.bmm(self, Vector3(a - 0.12, y0 - w, c - t * 0.5 - 0.06), Vector3(b + 0.12, y0, c + t * 0.5 + 0.03), tw, false)
	else:
		B.bmm(self, Vector3(c - t * 0.5 - 0.06, y0 - w, a - 0.12), Vector3(c + t * 0.5 + 0.03, y0, b + 0.12), tw, false)
	var pw := (b - a) / panes
	for i in panes:
		var pa := a + i * pw
		var pb := pa + pw
		if i > 0:
			if o.line == "z":
				B.bmm(self, Vector3(pa - 0.04, y0, c - 0.06), Vector3(pa + 0.04, y1, c + 0.06), tw, false)
			else:
				B.bmm(self, Vector3(c - 0.06, y0, pa - 0.04), Vector3(c + 0.06, y1, pa + 0.04), tw, false)
		# horizontal muntin
		var my := y0 + (y1 - y0) * 0.55
		var g: Glass
		if o.line == "z":
			B.bmm(self, Vector3(pa, my - 0.025, c - 0.03), Vector3(pb, my + 0.025, c + 0.03), tw, false)
			g = Glass.make(dyn_root, Vector3((pa + pb) * 0.5, (y0 + y1) * 0.5, c), Vector3(pw - 0.06, y1 - y0 - 0.04, 0.02))
		else:
			B.bmm(self, Vector3(c - 0.03, my - 0.025, pa), Vector3(c + 0.03, my + 0.025, pb), tw, false)
			g = Glass.make(dyn_root, Vector3(c, (y0 + y1) * 0.5, (pa + pb) * 0.5), Vector3(0.02, y1 - y0 - 0.04, pw - 0.06))
		g.set_meta("window", o.name)
		windows.append(g)
	# Shutters on the outside of exterior windows
	if o.line == "z" and (c < 0.01 or c > 17.99) or o.line == "x" and (c < 0.01 or c > 23.99):
		var out := -1.0 if (c < 0.01) else 1.0
		var sh := M("trim_dark") if int(a * 10) % 2 == 0 else M("siding_teal")
		var sw: float = minf((b - a) * 0.3, 0.5)
		if o.line == "z":
			for x: float in [a - 0.12 - sw * 0.5, b + 0.12 + sw * 0.5]:
				B.box(self, Vector3(x, (y0 + y1) * 0.5, c + out * (EXT + 0.04)), Vector3(sw, y1 - y0 + 0.1, 0.04), sh, false)
		else:
			for z: float in [a - 0.12 - sw * 0.5, b + 0.12 + sw * 0.5]:
				B.box(self, Vector3(c + out * (EXT + 0.04), (y0 + y1) * 0.5, z), Vector3(0.04, y1 - y0 + 0.1, sw), sh, false)


# ---------------------------------------------------------- elevator shaft --
func _build_elevator_shaft() -> void:
	var wm := M("metal_dark")
	var front := [
		{"a": 9.45, "b": 10.55, "y0": F1, "y1": F1 + DH},
		{"a": 9.45, "b": 10.55, "y0": F2, "y1": F2 + DH},
	]
	B.wall_x(self, 16.2 - 0.05, 9.0, 11.0, F1, C2, 0.1, M("wp_hall_damask"), front)
	B.wall_z(self, 9.05, 16.2, 18.0, F1, C2, 0.1, wm)
	B.wall_z(self, 10.95, 16.2, 18.0, F1, C2, 0.1, wm)
	B.slab(self, 9.0, 16.2, 11.0, 18.0, C2 - 0.06, C2, wm)
	for o in front:
		_frame({"line": "z", "c": 16.15, "a": o.a, "b": o.b, "y0": o.y0, "y1": o.y1}, M("metal"))


# ----------------------------------------------------------------- stairs --
func _build_stairs() -> void:
	# Living room stairs along the back wall, rising towards +x into the
	# flooded room ("a large room at the top of the stairs").
	var x0 := 13.2
	var x1 := 18.6
	var z0 := 7.8
	var z1 := 9.4
	var steps := 20
	var run := (x1 - x0) / steps
	var rise := (F2 - F1) / steps
	var wood := M("floor_wood_dark")
	for i in steps:
		var sx := x0 + i * run
		var top := F1 + (i + 1) * rise
		if sx + run < 15.2:
			# solid lower steps
			B.bmm(self, Vector3(sx, F1, z0), Vector3(sx + run + 0.01, top, z1), wood, false)
		else:
			B.bmm(self, Vector3(sx, top - 0.06, z0), Vector3(sx + run + 0.02, top, z1), wood, false)
			B.bmm(self, Vector3(sx, top - rise, z0 + 0.01), Vector3(sx + 0.03, top, z1 - 0.01), M("wood_dark"), false)
		B.bmm(self, Vector3(sx - 0.01, top - 0.025, z0 - 0.02), Vector3(sx + run + 0.02, top + 0.005, z1), M("wood_dark"), false)
	B.ramp(self, Vector3(x0 - 0.15, F1, (z0 + z1) * 0.5), Vector3(x1, F2, (z0 + z1) * 0.5), z1 - z0)
	# Stringer / under-stair wall with the basement door in it.
	var wall_m := M("wp_living_ears")
	var cuts := [13.8, 14.4, 15.0, 15.6, 16.2, 16.6, 17.6, 18.0, 18.6]
	for i in cuts.size() - 1:
		var xx: float = cuts[i]
		var nx: float = cuts[i + 1]
		var h_under := F1 + (xx - x0) / (x1 - x0) * (F2 - F1) - 0.05
		if is_equal_approx(xx, 16.6):
			# doorway for the basement door (x 16.6 .. 17.6), lintel above
			B.bmm(self, Vector3(xx, F1 + 2.35, z0 - 0.1), Vector3(nx, h_under, z0), wall_m)
		else:
			B.bmm(self, Vector3(xx, F1, z0 - 0.1), Vector3(nx, h_under, z0), wall_m)
	# Banister
	var bm := M("wood_dark")
	var post_count := 8
	for i in post_count + 1:
		var px := x0 + 0.2 + i * (x1 - x0 - 0.4) / post_count
		var py := F1 + (px - x0) / (x1 - x0) * (F2 - F1)
		B.box(self, Vector3(px, py + 0.45, z0 + 0.04), Vector3(0.05, 0.9, 0.05), bm, false)
	var rail_len := sqrt(pow(x1 - x0, 2) + pow(F2 - F1, 2))
	var rail := B.box(self, Vector3((x0 + x1) * 0.5, (F1 + F2) * 0.5 + 0.92, z0 + 0.04), Vector3(rail_len, 0.06, 0.08), bm, false)
	rail.rotation.z = atan2(F2 - F1, x1 - x0)
	var rc := B.collider(self, Vector3((x0 + x1) * 0.5, (F1 + F2) * 0.5 + 0.5, z0 + 0.04), Vector3(rail_len, 1.0, 0.08), 1, Vector3(0, 0, atan2(F2 - F1, x1 - x0)))
	rc.name = "BanisterCollider"
	# Basement door alcove behind the door: stairs going down into bright light.
	B.bmm(self, Vector3(16.5, F1 - 0.01, z0), Vector3(17.7, F1, z1), M("black"), false)
	var glow := B.box(self, Vector3(17.1, F1 + 0.6, (z0 + z1) * 0.5 + 0.3), Vector3(1.0, 1.2, 0.05), M("bright_light"), false)
	glow.name = "BasementGlow"
	# Stairs to the 3rd floor in the upstairs hall (blocked with furniture).
	var sx0 := 10.0
	var sx1 := 15.0
	for i in 16:
		var sz := sx0 + i * (sx1 - sx0) / 16.0
		var top2 := F2 + (i + 1) * 0.2
		B.bmm(self, Vector3(11.6, F2, sz), Vector3(12.9, top2, sz + (sx1 - sx0) / 16.0 + 0.01), wood)
	B.ramp(self, Vector3(12.25, F2, sx0), Vector3(12.25, F2 + 3.2, sx1), 1.3)


# ---------------------------------------------------------- flooded room --
func _build_flooded_room() -> void:
	var plank := M("floor_wood_dark")
	# Landing at the top of the stairs
	B.bmm(self, Vector3(18.6, POOL, 6.4), Vector3(22.4, F2, 9.4), plank)
	# ramp from landing down into the water
	B.ramp(self, Vector3(21.6, POOL, 5.0), Vector3(21.6, F2, 6.4), 1.2, 1, plank)
	# Ledge in front of the far door
	B.bmm(self, Vector3(13.0, POOL, 0.6), Vector3(14.4, F2, 3.2), plank)
	B.ramp(self, Vector3(15.8, POOL, 1.9), Vector3(14.4, F2, 1.9), 1.6, 1, plank)
	# Stairwell parapet so nobody falls back down the stairs from the water
	var pm := M("wp_flooded")
	B.bmm(self, Vector3(14.3, POOL, 7.62), Vector3(18.6, F2 + 0.95, 7.8), pm)
	B.bmm(self, Vector3(14.3, POOL, 7.62), Vector3(14.45, F2 + 0.95, 9.4), pm)
	B.bmm(self, Vector3(14.25, F2 + 0.95, 7.58), Vector3(18.6, F2 + 1.0, 7.84), M("wood_dark"), false)
	# Water surface (three pieces around the stair hole)
	var wmat := ShaderMaterial.new()
	wmat.shader = load("res://shaders/water.gdshader")
	var pieces := [Rect2(13.1, 0.1, 10.8, 7.5), Rect2(13.1, 7.6, 1.2, 1.8), Rect2(18.6, 7.6, 5.3, 1.8)]
	for rc in pieces:
		var mi := MeshInstance3D.new()
		var pm2 := PlaneMesh.new()
		pm2.size = rc.size
		pm2.subdivide_width = 4
		pm2.subdivide_depth = 4
		mi.mesh = pm2
		mi.material_override = wmat
		mi.position = Vector3(rc.get_center().x, WATER, rc.get_center().y)
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mi)
		mi.add_to_group("no_batch")
		water_mesh_nodes.append(mi)
		# Ice slab (hidden + non-colliding until the valve is turned)
		var ice := B.box(dyn_root, Vector3(rc.get_center().x, WATER - 0.05, rc.get_center().y), Vector3(rc.size.x, 0.1, rc.size.y), M("water_ice"), true, 0)
		ice.visible = false
		ice_bodies.append(ice as StaticBody3D)
	# Murky light from above
	var l := B.omni(self, Vector3(18.5, 6.8, 4.5), Color(0.75, 0.95, 0.9), 1.0, 8.0)
	l.add_to_group("house_lights")


func _on_water(frozen: bool) -> void:
	for mi in water_mesh_nodes:
		mi.visible = not frozen
	for ice in ice_bodies:
		ice.visible = frozen
		ice.collision_layer = 1 if frozen else 0


# ---------------------------------------------------------------- grave ---
func _build_grave_pit() -> void:
	var dirt := M("dirt")
	var x0 := 2.4
	var x1 := 4.6
	var z0 := 13.8
	var z1 := 16.6
	var bottom := -0.7
	B.bmm(self, Vector3(x0, bottom - 0.2, z0), Vector3(x1, bottom, z1), dirt)
	B.bmm(self, Vector3(x0 - 0.2, bottom, z0 - 0.2), Vector3(x1 + 0.2, F1, z0), dirt)
	B.bmm(self, Vector3(x0 - 0.2, bottom, z1), Vector3(x1 + 0.2, F1, z1 + 0.2), dirt)
	B.bmm(self, Vector3(x0 - 0.2, bottom, z0), Vector3(x0, F1, z1), dirt)
	B.bmm(self, Vector3(x1, bottom, z0), Vector3(x1 + 0.2, F1, z1), dirt)


# ------------------------------------------------------ exterior details --
func _build_exterior_details() -> void:
	var tw := M("trim_white")
	var deck := M("floor_wood_dark")
	# Front porch
	B.bmm(self, Vector3(7.3, 0, -2.3), Vector3(10.7, F1, 0), deck)
	B.bmm(self, Vector3(8.0, 0, -2.75), Vector3(10.0, 0.15, -2.3), M("concrete"), false)  # the ramp carries walkers
	B.ramp(self, Vector3(9.0, 0.0, -3.0), Vector3(9.0, F1, -2.3), 2.0)
	for x: float in [7.45, 10.55]:
		B.box(self, Vector3(x, 1.7, -2.15), Vector3(0.16, 2.8, 0.16), tw)
	B.bmm(self, Vector3(7.1, 3.0, -2.5), Vector3(10.9, 3.15, 0), M("roof_grey"))
	B.bmm(self, Vector3(7.1, 2.95, -2.5), Vector3(10.9, 3.0, 0), tw, false)
	# railings
	for x: float in [7.45, 10.55]:
		B.bmm(self, Vector3(x - 0.04, 0.9, -2.15), Vector3(x + 0.04, 0.96, -0.1), tw, false)
		for i in 6:
			B.box(self, Vector3(x, 0.6, -2.0 + i * 0.36), Vector3(0.04, 0.6, 0.04), tw, false)
	B.collider(self, Vector3(7.45, 0.8, -1.15), Vector3(0.1, 1.0, 2.0))
	B.collider(self, Vector3(10.55, 0.8, -1.15), Vector3(0.1, 1.0, 2.0))
	# Back steps
	B.bmm(self, Vector3(18.8, 0, 18.0), Vector3(20.7, 0.15, 18.9), M("concrete"), false)
	B.ramp(self, Vector3(19.75, 0.0, 19.3), Vector3(19.75, F1, 18.0), 1.8)
	B.bmm(self, Vector3(18.7, 2.7, 18.0), Vector3(20.8, 2.82, 19.0), M("roof_grey"))
	# Garage ramp lip
	B.ramp(self, Vector3(21.5, 0.0, -1.2), Vector3(21.5, F1, 0.0), 3.9)
	# Children-room side door: a little stub of a balcony (you jump from here)
	B.bmm(self, Vector3(-0.9, F2 - 0.15, 14.4), Vector3(0.0, F2, 15.9), deck)
	for z: float in [14.45, 15.85]:
		B.box(self, Vector3(-0.85, F2 + 0.45, z), Vector3(0.05, 0.9, 0.05), tw, false)
	# Gutters & downspouts
	var gm := M("metal")
	for p: Vector2 in [Vector2(-0.25, -0.25), Vector2(24.25, -0.25), Vector2(24.25, 18.25), Vector2(-0.25, 18.25)]:
		B.cyl(self, Vector3(p.x, C2 * 0.5 + 0.2, p.y), 0.05, C2 + 0.2, gm, false, 8)
	# Outside wall lamp next to the front door
	B.box(self, Vector3(10.85, 2.3, -0.2), Vector3(0.15, 0.25, 0.15), M("lamp_off"), false)


# ------------------------------------------------------------ upper floors --
func _build_upper_floors() -> void:
	# Roof deck over the 2nd floor
	B.bmm(self, Vector3(-0.35, C2, -0.35), Vector3(24.35, C2 + 0.25, 18.35), M("roof_grey"))
	B.bmm(self, Vector3(21.5, C2, 18.35), Vector3(24.35, C2 + 0.25, 19.9), M("roof_grey"))
	var tw := M("trim_white")
	for e: Array in [[Vector3(-0.4, C2 + 0.25, -0.4), Vector3(24.4, C2 + 0.55, -0.3)],
			[Vector3(-0.4, C2 + 0.25, 18.3), Vector3(24.4, C2 + 0.55, 18.4)],
			[Vector3(-0.4, C2 + 0.25, -0.3), Vector3(-0.3, C2 + 0.55, 18.3)],
			[Vector3(24.3, C2 + 0.25, -0.3), Vector3(24.4, C2 + 0.55, 18.3)]]:
		B.bmm(self, e[0], e[1], tw, false)
	var y3 := C2 + 0.25
	# 3rd floor
	_block(1.5, 1.5, 19.5, 15.5, y3, y3 + 2.9, "siding_blue_light", 3)
	# Odd box sticking out on stilts
	_block(19.5, 4.0, 22.8, 9.0, y3 + 0.5, y3 + 2.7, "siding_raw", 1)
	for p: Vector2 in [Vector2(22.6, 4.2), Vector2(22.6, 8.8)]:
		B.box(self, Vector3(p.x, y3 + 0.25, p.y), Vector3(0.14, 0.5, 0.14), M("wood_post"), false)
	B.gable_roof(self, 19.4, 3.9, 22.9, 9.1, y3 + 2.7, 1.0, M("roof_brown"), M("siding_raw"), "z")
	# Gables over the parts of the 3rd floor not covered by the 4th
	var y4 := y3 + 2.9
	B.gable_roof(self, 1.4, 1.4, 5.0, 15.6, y4, 1.6, M("roof_red"), M("siding_blue_light"), "z")
	B.gable_roof(self, 15.0, 1.4, 19.6, 15.6, y4, 1.4, M("roof_red"), M("siding_blue_light"), "z")
	B.bmm(self, Vector3(5.0, y4, 1.4), Vector3(15.0, y4 + 0.15, 15.6), M("roof_grey"))
	# 4th floor
	_block(5.0, 3.5, 15.0, 13.5, y4, y4 + 2.6, "siding_raw", 2)
	# balcony at the front of the 4th floor
	B.bmm(self, Vector3(6.5, y4, 2.3), Vector3(11.5, y4 + 0.12, 3.5), M("floor_wood_dark"))
	for i in 11:
		B.box(self, Vector3(6.6 + i * 0.48, y4 + 0.5, 2.35), Vector3(0.05, 0.9, 0.05), tw, false)
	B.bmm(self, Vector3(6.5, y4 + 0.95, 2.3), Vector3(11.5, y4 + 1.02, 2.4), tw, false)
	var y5 := y4 + 2.6
	B.bmm(self, Vector3(4.8, y5, 3.3), Vector3(15.2, y5 + 0.15, 13.7), M("roof_grey"))
	# 5th floor
	_block(7.5, 5.0, 12.5, 11.0, y5, y5 + 2.4, "siding_teal", 1)
	var y6 := y5 + 2.4
	B.bmm(self, Vector3(7.3, y6, 4.8), Vector3(12.7, y6 + 0.15, 11.2), M("roof_grey"))
	# 6th floor attic with a gable roof
	_block(8.2, 6.0, 11.8, 10.0, y6, y6 + 1.6, "siding_blue", 1)
	B.gable_roof(self, 8.0, 5.8, 12.0, 10.2, y6 + 1.6, 1.6, M("roof_red"), M("siding_blue"), "x")
	# round attic window
	B.cyl(self, Vector3(10.0, y6 + 0.9, 5.96), 0.35, 0.06, M("trim_white"), false, 20).rotation.x = PI / 2
	B.cyl(self, Vector3(10.0, y6 + 0.9, 5.93), 0.28, 0.02, M("glass_dark"), false, 20).rotation.x = PI / 2
	# Turret with a cone roof on the corner of the 4th floor
	B.cyl(self, Vector3(14.6, y5 + 1.1, 4.0), 0.95, 2.2, M("siding_blue"), true, 18)
	B.cyl(self, Vector3(14.6, y5 + 3.0, 4.0), 1.15, 1.6, M("roof_red"), false, 18, 0.02)
	for i in 4:
		var a := i * PI / 2.0 + 0.4
		B.box(self, Vector3(14.6 + cos(a) * 0.96, y5 + 1.3, 4.0 + sin(a) * 0.96), Vector3(0.3, 0.6, 0.3), M("glass_dark"), false).rotation.y = -a
	# Chimney + antenna + weather vane
	B.box(self, Vector3(13.6, y5 + 2.0, 11.8), Vector3(0.8, 4.0, 0.8), M("brick_red"))
	B.box(self, Vector3(13.6, y5 + 4.05, 11.8), Vector3(0.95, 0.15, 0.95), M("brick_grey"), false)
	B.cyl(self, Vector3(10.0, y6 + 4.2, 8.0), 0.02, 2.0, M("metal"), false, 6)
	for i in 4:
		B.box(self, Vector3(10.0, y6 + 3.6 + i * 0.3, 8.0), Vector3(1.2 - i * 0.2, 0.02, 0.02), M("metal"), false)
	B.box(self, Vector3(2.0, y4 + 2.0, 8.5), Vector3(0.05, 1.0, 0.05), M("metal_dark"), false)


## A closed box "room" seen only from outside (siding + dark windows).
func _block(x0: float, z0: float, x1: float, z1: float, y0: float, y1: float, mat: String, win_rows: int) -> void:
	B.bmm(self, Vector3(x0, y0, z0), Vector3(x1, y1, z1), M(mat))
	var tw := M("trim_white")
	var h := y1 - y0
	var wy := y0 + h * 0.55
	var wh: float = minf(1.1, h * 0.45)
	# windows along front/back
	for side: float in [z0, z1]:
		var n := int((x1 - x0) / 3.0)
		for i in n:
			var cx := x0 + (i + 0.5) * (x1 - x0) / n
			var out := -0.02 if side == z0 else 0.02
			var lit := (int(cx * 7 + side * 3) % 5) == 0
			B.box(self, Vector3(cx, wy, side + out), Vector3(0.9, wh, 0.04), M("window_lit") if lit else M("glass_dark"), false)
			B.box(self, Vector3(cx, wy, side + out * 2), Vector3(1.04, 0.07, 0.05), tw, false).position.y = wy + wh * 0.5
			B.box(self, Vector3(cx, wy - wh * 0.5, side + out * 3), Vector3(1.1, 0.07, 0.1), tw, false)
	for side: float in [x0, x1]:
		var n2 := int((z1 - z0) / 3.5)
		for i in n2:
			var cz := z0 + (i + 0.5) * (z1 - z0) / n2
			var out2 := -0.02 if side == x0 else 0.02
			B.box(self, Vector3(side + out2, wy, cz), Vector3(0.04, wh, 0.9), M("glass_dark"), false)
			B.box(self, Vector3(side + out2 * 3, wy - wh * 0.5, cz), Vector3(0.1, 0.07, 1.1), tw, false)
	# corner trims
	for p: Vector2 in [Vector2(x0, z0), Vector2(x1, z0), Vector2(x0, z1), Vector2(x1, z1)]:
		B.box(self, Vector3(p.x, (y0 + y1) * 0.5, p.y), Vector3(0.18, h, 0.18), tw, false)


# ------------------------------------------------------------------- yard --
func _build_yard() -> void:
	# Concrete path from porch to the sidewalk and the driveway.
	B.bmm(self, Vector3(8.4, -0.02, -6.0), Vector3(9.6, 0.02, -2.75), M("concrete"))
	B.bmm(self, Vector3(19.2, -0.02, -6.0), Vector3(23.8, 0.02, -1.2), M("concrete"))
	# Low white picket fence along the front (gaps for path and driveway)
	F.picket_fence(self, Vector3(-4.0, 0, -5.7), Vector3(8.2, 0, -5.7))
	F.picket_fence(self, Vector3(9.8, 0, -5.7), Vector3(19.0, 0, -5.7))
	F.picket_fence(self, Vector3(24.0, 0, -5.7), Vector3(28.0, 0, -5.7))
	# Side and back fences (taller boards)
	F.board_fence(self, Vector3(-4.0, 0, -5.7), Vector3(-4.0, 0, 30.0))
	F.board_fence(self, Vector3(28.0, 0, 30.0), Vector3(28.0, 0, -5.7))
	F.board_fence(self, Vector3(-4.0, 0, 30.0), Vector3(28.0, 0, 30.0))
	# Pile of furniture behind the house (as in the earliest builds)
	var pile := Node3D.new()
	pile.position = Vector3(6.0, 0, 23.5)
	add_child(pile)
	F.couch(pile, Vector3(0, 0, 0), 0.3, "fabric_green")
	F.wardrobe(pile, Vector3(1.6, 0, -0.4), -0.5, "wood")
	F.table(pile, Vector3(-1.2, 0.0, 1.0), 0.7)
	F.chair(pile, Vector3(-0.6, 0.85, 0.2), 1.2)
	F.boxes(pile, Vector3(2.4, 0, 1.2), 0, 3, 11)
	F.boxes(pile, Vector3(-2.0, 0, -0.6), 0.4, 2, 12)
	# Trees & bushes
	F.tree(self, Vector3(-2.2, 0, 24.0), 6.5, 3)
	F.tree(self, Vector3(26.0, 0, 26.0), 7.0, 4)
	F.tree(self, Vector3(1.5, 0, -3.8), 5.5, 5)
	F.bush(self, Vector3(4.0, 0, -0.9), 1.0)
	F.bush(self, Vector3(13.0, 0, -0.9), 1.1)
	F.bush(self, Vector3(16.5, 0, -0.9), 1.0)
	F.bush(self, Vector3(25.5, 0, 12.0), 1.2)
	F.bush(self, Vector3(-2.0, 0, 5.0), 1.2)
	F.trash_can(self, Vector3(18.4, 0, -4.8))
	F.mailbox(self, Vector3(7.9, 0, -5.3), PI, "blue")
	# The Neighbor's car parked in front of the garage
	F.car(self, Vector3(21.5, 0, -3.6), PI / 2, "car_green")


# ------------------------------------------------------------- train/etc --
func _build_train() -> void:
	train = Train.new()
	train.name = "Train"
	dyn_root.add_child(train)
	train.build(self)


func _build_elevator() -> void:
	elevator = Elevator.new()
	elevator.name = "Elevator"
	dyn_root.add_child(elevator)
	elevator.build(self)


func _build_sharkotron() -> void:
	shark = Sharkotron.new()
	shark.name = "Sharkotron"
	dyn_root.add_child(shark)
	shark.setup(self)


# ---------------------------------------------------------------- AI data --
func _define_ai_spots() -> void:
	# anim: tv | sit | lie | mop | look | stand | fridge
	var sp := [
		["tv", Vector3(13.9, F1, 5.2), Vector3(1, 0, 0), 22.0, 3.0],
		["look", Vector3(15.0, F1, 0.9), Vector3(0, 0, -1), 10.0, 2.0],
		["sit", Vector3(3.5, F1, 8.6), Vector3(0, 0, 1), 14.0, 2.0],
		["lie", Vector3(15.0, F1, 16.6), Vector3(0, 0, -1), 18.0, 1.0],
		["mop", Vector3(3.5, F1, 3.4), Vector3(1, 0, 0), 14.0, 2.0],
		["fridge", Vector3(1.4, F1, 5.0), Vector3(-1, 0, 0), 6.0, 1.5],
		["stand", Vector3(21.5, F1, 5.5), Vector3(0, 0, -1), 6.0, 1.0],
		["stand", Vector3(21.0, F1, 15.5), Vector3(1, 0, 0), 6.0, 1.0],
		["stand", Vector3(9.0, 0.0, -4.2), Vector3(0, 0, -1), 9.0, 2.0],
		["stand", Vector3(14.0, 0.0, 23.0), Vector3(0, 0, 1), 7.0, 1.0],
		["stand", Vector3(-2.0, 0.0, 9.0), Vector3(-1, 0, 0), 6.0, 1.0],
		["stand", Vector3(11.0, F2, 12.5), Vector3(0, 0, 1), 6.0, 1.2],
		["sit", Vector3(16.6, F2, 13.6), Vector3(0, 0, 1), 12.0, 1.2],
		["stand", Vector3(11.0, F2, 2.0), Vector3(-1, 0, 0), 5.0, 1.0],
		["stand", Vector3(9.0, F1, 10.0), Vector3(0, 0, 1), 4.0, 1.0],
	]
	for s in sp:
		var dir: Vector3 = (global_basis * s[2]).normalized()
		activity_spots.append({"anim": s[0], "pos": gpos(s[1]), "dir": dir, "dur": s[3], "w": s[4]})
	for p: Vector3 in [Vector3(9.0, F1, 1.6), Vector3(9.0, F1, 10.5), Vector3(15.5, F1, 3.0), Vector3(3.5, F1, 9.5),
			Vector3(21.0, F1, 15.8), Vector3(11.0, F2, 12.0), Vector3(11.0, F2, 2.0), Vector3(4.0, 0.0, -3.0),
			Vector3(20.0, 0.0, 21.5), Vector3(17.0, F2, 14.5), Vector3(14.0, F1, 13.0), Vector3(21.5, F1, 6.0)]:
		camera_spots.append(gpos(p))


func _on_power(on: bool) -> void:
	for l in get_tree().get_nodes_in_group("house_lights"):
		if is_ancestor_of(l) or dyn_root.is_ancestor_of(l):
			l.visible = on
	for s in get_tree().get_nodes_in_group("lamp_shades"):
		if is_ancestor_of(s):
			for c in s.get_children():
				if c is MeshInstance3D and (c as MeshInstance3D).material_override in [M("lamp_on"), M("lamp_off")]:
					(c as MeshInstance3D).material_override = M("lamp_on") if on else M("lamp_off")


## Point inside the house in local coords -> which room?
func room_at(world_pos: Vector3) -> String:
	var lp := to_local(world_pos)
	var flr := 1 if lp.y < 3.9 else 2
	for n in rooms:
		var r: Dictionary = rooms[n]
		if r.floor == flr and (r.rect as Rect2).has_point(Vector2(lp.x, lp.z)):
			return n
	return ""
