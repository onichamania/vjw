class_name F
extends RefCounted
## Furniture & static props. Every function takes the parent, a position and a
## yaw (radians) and returns the root Node3D. Furniture collides on the WORLD
## layer, so it is also carved out of the Neighbor's navigation mesh.


static func _root(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := Node3D.new()
	r.position = pos
	r.rotation.y = yaw
	parent.add_child(r)
	return r


static func M(n: String) -> Material:
	return Mats.get_mat(n)


static func couch(parent: Node, pos: Vector3, yaw: float, fabric := "fabric_red", length := 2.0) -> Node3D:
	var r := _root(parent, pos, yaw)
	var f := M(fabric)
	B.box(r, Vector3(0, 0.25, 0), Vector3(length, 0.3, 0.85), f)
	B.box(r, Vector3(0, 0.62, -0.33), Vector3(length, 0.62, 0.22), f)
	for s: int in [-1, 1]:
		B.box(r, Vector3(s * (length * 0.5 - 0.1), 0.48, 0.02), Vector3(0.2, 0.36, 0.82), f)
	var cush := length / 2.0 - 0.15
	for i in 2:
		B.box(r, Vector3(-length * 0.25 + i * length * 0.5, 0.44, 0.05), Vector3(cush, 0.12, 0.66), f, false)
	for sx: int in [-1, 1]:
		for sz: int in [-1, 1]:
			B.cyl(r, Vector3(sx * (length * 0.5 - 0.1), 0.05, sz * 0.33), 0.035, 0.1, M("wood_dark"))
	return r


static func armchair(parent: Node, pos: Vector3, yaw: float, fabric := "fabric_green") -> Node3D:
	return couch(parent, pos, yaw, fabric, 1.0)


static func bed(parent: Node, pos: Vector3, yaw: float, blanket := "fabric_blue", w := 1.5, l := 2.1, high := false) -> Node3D:
	# Origin at the centre of the footprint. Head board at -z.
	var r := _root(parent, pos, yaw)
	var leg_h := 0.42 if high else 0.3
	var frame := M("wood_dark")
	B.box(r, Vector3(0, leg_h + 0.06, 0), Vector3(w, 0.12, l), frame)
	for sx: int in [-1, 1]:
		for sz: int in [-1, 1]:
			B.box(r, Vector3(sx * (w * 0.5 - 0.05), leg_h * 0.5, sz * (l * 0.5 - 0.05)), Vector3(0.08, leg_h, 0.08), frame, false)
	B.box(r, Vector3(0, leg_h + 0.22, 0), Vector3(w - 0.08, 0.2, l - 0.08), M("fabric_white"), false)
	B.box(r, Vector3(0, leg_h + 0.34, 0.25), Vector3(w - 0.02, 0.06, l * 0.7), M(blanket), false)
	B.box(r, Vector3(0, leg_h + 0.38, -l * 0.5 + 0.25), Vector3(w * 0.7, 0.12, 0.32), M("fabric_white"), false)
	B.box(r, Vector3(0, leg_h + 0.55, -l * 0.5 - 0.03), Vector3(w + 0.06, 1.0, 0.08), frame)
	B.box(r, Vector3(0, leg_h + 0.25, l * 0.5 + 0.03), Vector3(w + 0.06, 0.5, 0.06), frame)
	# Collider for the mattress area (blocks walking over the bed)
	B.collider(r, Vector3(0, leg_h + 0.25, 0), Vector3(w, 0.3, l))
	return r


## Returns the wardrobe root; the HideSpot is stored in meta "hide".
static func wardrobe(parent: Node, pos: Vector3, yaw: float, mat := "wood_dark", w := 1.1, h := 2.1, d := 0.6) -> Node3D:
	var r := _root(parent, pos, yaw)
	var wm := M(mat)
	# Back, sides, top, bottom (hollow so the camera can sit inside)
	B.box(r, Vector3(0, h * 0.5, -d * 0.5 + 0.02), Vector3(w, h, 0.04), wm)
	for s: int in [-1, 1]:
		B.box(r, Vector3(s * (w * 0.5 - 0.02), h * 0.5, 0), Vector3(0.04, h, d), wm)
	B.box(r, Vector3(0, h - 0.03, 0), Vector3(w + 0.06, 0.06, d + 0.04), wm)
	B.box(r, Vector3(0, 0.05, 0), Vector3(w, 0.1, d), wm)
	B.box(r, Vector3(0, h + 0.05, 0), Vector3(w + 0.1, 0.06, d + 0.08), wm, false)
	B.cyl(r, Vector3(0, h - 0.25, -0.05), 0.01, w - 0.1, M("metal"), false, 8).rotation.z = PI / 2
	# Collider in front (closed doors)
	B.collider(r, Vector3(0, h * 0.5, d * 0.5 - 0.02), Vector3(w, h, 0.04))
	var hs := HideSpot.make(r, Vector3(0, h * 0.5, d * 0.5 + 0.01), Vector3(w, h, 0.06), Vector3(0, 1.55 - h * 0.5, 0.07), Vector3(0, -h * 0.5 + 0.1, 0.75), "wardrobe")
	# Doors (visual, swing open when someone hides / the Neighbor checks)
	for s: int in [-1, 1]:
		var hinge := Node3D.new()
		hinge.position = Vector3(s * (w * 0.5 - 0.02), 0.1, d * 0.5)
		r.add_child(hinge)
		var door := MeshInstance3D.new()
		door.mesh = B.box_mesh(Vector3(w * 0.5 - 0.03, h - 0.18, 0.035))
		door.material_override = wm
		door.position = Vector3(-s * (w * 0.25 - 0.01), (h - 0.18) * 0.5, 0)
		hinge.add_child(door)
		# little slit window at eye height
		var slit := MeshInstance3D.new()
		slit.mesh = B.box_mesh(Vector3(w * 0.3, 0.025, 0.04))
		slit.material_override = M("black")
		slit.position = Vector3(-s * (w * 0.25 - 0.01), 1.45, 0.0)
		hinge.add_child(slit)
		var knob := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.025
		sm.height = 0.05
		knob.mesh = sm
		knob.material_override = M("gold")
		knob.position = Vector3(-s * (w * 0.5 - 0.1), 1.0, 0.03)
		hinge.add_child(knob)
		hs.doors.append(hinge)
	r.set_meta("hide", hs)
	return r


static func table(parent: Node, pos: Vector3, yaw: float, w := 1.6, d := 0.9, h := 0.78, mat := "wood") -> Node3D:
	var r := _root(parent, pos, yaw)
	var tm := M(mat)
	B.box(r, Vector3(0, h - 0.03, 0), Vector3(w, 0.06, d), tm)
	for sx: int in [-1, 1]:
		for sz: int in [-1, 1]:
			B.box(r, Vector3(sx * (w * 0.5 - 0.07), (h - 0.06) * 0.5, sz * (d * 0.5 - 0.07)), Vector3(0.07, h - 0.06, 0.07), tm)
	return r


static func chair(parent: Node, pos: Vector3, yaw: float, mat := "wood") -> Node3D:
	var r := _root(parent, pos, yaw)
	var cm := M(mat)
	B.box(r, Vector3(0, 0.46, 0), Vector3(0.45, 0.05, 0.45), cm)
	B.box(r, Vector3(0, 0.78, -0.2), Vector3(0.45, 0.6, 0.05), cm, false)
	for sx: int in [-1, 1]:
		for sz: int in [-1, 1]:
			B.box(r, Vector3(sx * 0.19, 0.22, sz * 0.19), Vector3(0.04, 0.44, 0.04), cm, false)
	return r


static func tv(parent: Node, pos: Vector3, yaw: float, on := true, stand := true) -> Node3D:
	# Old CRT on a low wooden stand. Screen faces +z.
	var r := _root(parent, pos, yaw)
	if stand:
		B.box(r, Vector3(0, 0.25, 0), Vector3(1.1, 0.5, 0.5), M("wood_dark"))
	B.box(r, Vector3(0, 0.82, -0.05), Vector3(0.72, 0.6, 0.55), M("black"))
	B.box(r, Vector3(0, 0.84, 0.226), Vector3(0.56, 0.44, 0.02), M("screen_glow") if on else M("screen_off"), false)
	B.box(r, Vector3(0.3, 0.6, 0.23), Vector3(0.04, 0.04, 0.02), M("red_light"), false)
	B.cyl(r, Vector3(-0.1, 1.2, -0.1), 0.006, 0.4, M("metal"), false, 6).rotation.z = 0.5
	B.cyl(r, Vector3(0.1, 1.2, -0.1), 0.006, 0.4, M("metal"), false, 6).rotation.z = -0.5
	if on:
		var l := B.omni(r, Vector3(0, 0.85, 0.6), Color(0.6, 0.75, 1.0), 0.6, 3.0)
		l.add_to_group("house_lights")
	return r


static func fridge(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.9, 0), Vector3(0.75, 1.8, 0.7), M("white"))
	B.box(r, Vector3(0, 1.32, 0.352), Vector3(0.73, 0.02, 0.01), M("metal_dark"), false)
	B.box(r, Vector3(0.3, 1.0, 0.37), Vector3(0.03, 0.4, 0.03), M("chrome"), false)
	B.box(r, Vector3(0.3, 1.55, 0.37), Vector3(0.03, 0.2, 0.03), M("chrome"), false)
	return r


static func counter(parent: Node, pos: Vector3, yaw: float, length := 2.0, top := "white") -> Node3D:
	# Front faces +z.
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.44, 0), Vector3(length, 0.88, 0.6), M("wood_white"))
	B.box(r, Vector3(0, 0.9, 0.02), Vector3(length + 0.02, 0.05, 0.66), M(top))
	var n := int(length / 0.5)
	for i in n:
		var x := -length * 0.5 + 0.25 + i * (length / n)
		B.box(r, Vector3(x, 0.45, 0.302), Vector3(length / n - 0.04, 0.7, 0.01), M("wood_light"), false)
		B.box(r, Vector3(x, 0.72, 0.315), Vector3(0.1, 0.02, 0.02), M("chrome"), false)
	return r


static func upper_cabinets(parent: Node, pos: Vector3, yaw: float, length := 2.0) -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0, 0), Vector3(length, 0.7, 0.35), M("wood_white"))
	var n := int(length / 0.5)
	for i in n:
		var x := -length * 0.5 + 0.25 + i * (length / n)
		B.box(r, Vector3(x, 0, 0.177), Vector3(length / n - 0.04, 0.62, 0.01), M("wood_light"), false)
	return r


static func stove(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.45, 0), Vector3(0.76, 0.9, 0.64), M("white"))
	B.box(r, Vector3(0, 0.45, 0.322), Vector3(0.6, 0.45, 0.01), M("glass_dark"), false)
	for sx: float in [-0.18, 0.18]:
		for sz: float in [-0.14, 0.14]:
			B.cyl(r, Vector3(sx, 0.91, sz), 0.09, 0.02, M("black"), false)
	B.box(r, Vector3(0, 0.98, -0.3), Vector3(0.76, 0.16, 0.05), M("white"), false)
	# hood
	B.box(r, Vector3(0, 1.75, -0.08), Vector3(0.8, 0.25, 0.5), M("metal"), false)
	B.box(r, Vector3(0, 2.2, -0.2), Vector3(0.3, 0.7, 0.25), M("metal"), false)
	return r


static func sink_counter(parent: Node, pos: Vector3, yaw: float, length := 1.4) -> Node3D:
	var r := counter(parent, pos, yaw, length)
	B.box(r, Vector3(0, 0.88, 0.02), Vector3(0.6, 0.06, 0.42), M("chrome"), false)
	B.box(r, Vector3(0, 0.86, 0.02), Vector3(0.52, 0.03, 0.34), M("metal_dark"), false)
	B.cyl(r, Vector3(0, 1.05, -0.2), 0.02, 0.3, M("chrome"), false, 8)
	B.box(r, Vector3(0, 1.18, -0.12), Vector3(0.03, 0.03, 0.18), M("chrome"), false)
	return r


static func toilet(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	var p := M("porcelain")
	B.cyl(r, Vector3(0, 0.2, 0.05), 0.17, 0.4, p, true, 16, 0.2)
	B.cyl(r, Vector3(0, 0.42, 0.06), 0.21, 0.04, p, false)
	B.box(r, Vector3(0, 0.62, -0.2), Vector3(0.42, 0.4, 0.18), p)
	B.box(r, Vector3(0, 0.83, -0.2), Vector3(0.44, 0.04, 0.2), p, false)
	return r


static func bathtub(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	var p := M("porcelain")
	B.box(r, Vector3(0, 0.08, 0), Vector3(0.75, 0.16, 1.7), p)
	for s: int in [-1, 1]:
		B.box(r, Vector3(s * 0.34, 0.32, 0), Vector3(0.07, 0.48, 1.7), p)
		B.box(r, Vector3(0, 0.32, s * 0.82), Vector3(0.75, 0.48, 0.07), p)
	B.box(r, Vector3(0, 0.3, 0), Vector3(0.6, 0.02, 1.55), M("tiles_bath"), false)
	B.cyl(r, Vector3(0, 0.7, -0.8), 0.02, 0.25, M("chrome"), false, 8)
	return r


static func bath_sink(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	var p := M("porcelain")
	B.cyl(r, Vector3(0, 0.4, 0), 0.07, 0.8, p, true, 12)
	B.box(r, Vector3(0, 0.85, 0.02), Vector3(0.55, 0.14, 0.42), p, false)
	B.cyl(r, Vector3(0, 1.0, -0.15), 0.015, 0.2, M("chrome"), false, 8)
	B.box(r, Vector3(0, 1.45, -0.19), Vector3(0.5, 0.6, 0.02), M("chrome"), false)
	return r


static func boiler(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	# Big old furnace with a tank and pipes. Front faces +z.
	var r := _root(parent, pos, yaw)
	B.cyl(r, Vector3(0, 1.1, -0.05), 0.62, 2.2, M("metal_rust"), true, 24)
	B.box(r, Vector3(0, 0.35, 0.45), Vector3(0.9, 0.7, 0.4), M("metal_dark"))
	B.box(r, Vector3(0, 0.4, 0.66), Vector3(0.5, 0.35, 0.02), M("black"), false)
	B.box(r, Vector3(0, 0.4, 0.67), Vector3(0.36, 0.12, 0.01), M("orange"), false)
	for i in 3:
		B.torus(r, Vector3(0, 0.4 + i * 0.7, -0.05), 0.6, 0.66, M("metal_dark"))
	B.cyl(r, Vector3(0.3, 2.6, -0.05), 0.08, 1.0, M("metal_dark"), false)
	B.cyl(r, Vector3(-0.35, 2.4, -0.05), 0.06, 0.8, M("copper"), false)
	B.cyl(r, Vector3(-0.35, 2.8, 0.4), 0.05, 0.9, M("copper"), false).rotation.x = PI / 2
	# gauge
	B.cyl(r, Vector3(0.25, 1.65, 0.57), 0.08, 0.04, M("white"), false).rotation.x = PI / 2
	B.box(r, Vector3(0.25, 1.67, 0.6), Vector3(0.01, 0.06, 0.005), M("red"), false)
	var l := B.omni(r, Vector3(0, 0.4, 0.9), Color(1.0, 0.5, 0.2), 0.8, 2.5)
	l.add_to_group("house_lights")
	return r


static func crib(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	var wm := M("wood_white")
	B.box(r, Vector3(0, 0.45, 0), Vector3(1.3, 0.08, 0.7), wm)
	B.box(r, Vector3(0, 0.52, 0), Vector3(1.24, 0.08, 0.64), M("fabric_pink"), false)
	for sx: int in [-1, 1]:
		for sz: int in [-1, 1]:
			B.box(r, Vector3(sx * 0.62, 0.5, sz * 0.32), Vector3(0.05, 1.0, 0.05), wm)
	for s: int in [-1, 1]:
		B.box(r, Vector3(0, 0.98, s * 0.32), Vector3(1.24, 0.04, 0.04), wm, false)
		B.box(r, Vector3(s * 0.62, 0.98, 0), Vector3(0.04, 0.04, 0.64), wm, false)
		for i in 9:
			B.box(r, Vector3(-0.56 + i * 0.14, 0.75, s * 0.32), Vector3(0.025, 0.45, 0.025), wm, false)
		for i in 4:
			B.box(r, Vector3(s * 0.62, 0.75, -0.24 + i * 0.16), Vector3(0.025, 0.45, 0.025), wm, false)
	B.collider(r, Vector3(0, 0.75, 0), Vector3(1.3, 0.5, 0.7))
	return r


static func blackboard(parent: Node, pos: Vector3, yaw: float, w := 3.0, h := 1.3) -> Node3D:
	# Faces +z.
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0, 0), Vector3(w + 0.12, h + 0.12, 0.05), M("wood_dark"), false)
	B.box(r, Vector3(0, 0, 0.03), Vector3(w, h, 0.02), M("blackboard"), false)
	B.box(r, Vector3(0, -h * 0.5 - 0.08, 0.08), Vector3(w, 0.03, 0.12), M("wood_dark"), false)
	return r


static func desk(parent: Node, pos: Vector3, yaw: float, w := 1.4, d := 0.7, h := 0.78) -> Node3D:
	var r := _root(parent, pos, yaw)
	var dm := M("wood")
	B.box(r, Vector3(0, h - 0.03, 0), Vector3(w, 0.06, d), dm)
	B.box(r, Vector3(-w * 0.5 + 0.25, (h - 0.06) * 0.5, 0), Vector3(0.48, h - 0.06, d - 0.04), dm)
	B.box(r, Vector3(w * 0.5 - 0.04, (h - 0.06) * 0.5, 0), Vector3(0.06, h - 0.06, d - 0.04), dm)
	return r


static func student_desk(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.7, 0), Vector3(0.7, 0.04, 0.5), M("wood_light"))
	for sx: int in [-1, 1]:
		B.box(r, Vector3(sx * 0.3, 0.34, 0), Vector3(0.04, 0.68, 0.45), M("metal_dark"), false)
	chair(r, Vector3(0, 0, 0.5), PI, "wood_light")
	return r


static func shelf(parent: Node, pos: Vector3, yaw: float, w := 1.2, h := 1.9, d := 0.4, fill := true) -> Node3D:
	var r := _root(parent, pos, yaw)
	var sm := M("wood")
	for s: int in [-1, 1]:
		B.box(r, Vector3(s * (w * 0.5 - 0.02), h * 0.5, 0), Vector3(0.04, h, d), sm)
	B.box(r, Vector3(0, h * 0.5, -d * 0.5 + 0.01), Vector3(w, h, 0.02), sm, false)
	var n := 4
	for i in n + 1:
		var y := 0.05 + i * (h - 0.1) / n
		B.box(r, Vector3(0, y, 0), Vector3(w - 0.04, 0.03, d), sm, i == 0)
		if fill and i < n:
			var x := -w * 0.5 + 0.12
			while x < w * 0.5 - 0.15:
				var bw := randf_range(0.08, 0.3)
				var bh := randf_range(0.12, (h - 0.1) / n - 0.06)
				var mats := ["cardboard", "fabric_red", "fabric_blue", "metal", "fabric_green", "wood_light"]
				B.box(r, Vector3(x + bw * 0.5, y + 0.015 + bh * 0.5, randf_range(-0.04, 0.04)), Vector3(bw, bh, d * 0.7), M(mats[randi() % mats.size()]), false)
				x += bw + randf_range(0.02, 0.1)
	B.collider(r, Vector3(0, h * 0.5, 0), Vector3(w, h, d))
	return r


static func nightstand(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.3, 0), Vector3(0.5, 0.6, 0.42), M("wood_dark"))
	B.box(r, Vector3(0, 0.45, 0.212), Vector3(0.42, 0.18, 0.01), M("wood"), false)
	B.box(r, Vector3(0, 0.45, 0.225), Vector3(0.1, 0.02, 0.02), M("gold"), false)
	return r


static func lamp(parent: Node, pos: Vector3, floor_lamp := true, light := true) -> Node3D:
	var r := _root(parent, pos, 0)
	var h := 1.55 if floor_lamp else 0.45
	B.cyl(r, Vector3(0, 0.02, 0), 0.16 if floor_lamp else 0.09, 0.04, M("metal_dark"), false)
	B.cyl(r, Vector3(0, h * 0.5, 0), 0.015, h, M("metal_dark"), false, 8)
	B.cyl(r, Vector3(0, h + 0.1, 0), 0.25 if floor_lamp else 0.14, 0.28 if floor_lamp else 0.18, M("fabric_mustard"), false, 16, 0.15 if floor_lamp else 0.08)
	if light:
		var l := B.omni(r, Vector3(0, h, 0), Color(1.0, 0.82, 0.58), 0.9, 4.0)
		l.add_to_group("house_lights")
	return r


static func ceiling_lamp(parent: Node, pos: Vector3, rng := 7.0, energy := 1.2, col := Color(1.0, 0.86, 0.66)) -> Node3D:
	# pos = point on the ceiling
	var r := _root(parent, pos, 0)
	B.cyl(r, Vector3(0, -0.2, 0), 0.006, 0.4, M("black"), false, 6)
	B.cyl(r, Vector3(0, -0.45, 0), 0.22, 0.14, M("lamp_on"), false, 16, 0.08)
	var l := B.omni(r, Vector3(0, -0.6, 0), col, energy, rng)
	l.add_to_group("house_lights")
	r.add_to_group("lamp_shades")
	return r


static func painting(parent: Node, pos: Vector3, yaw: float, w := 0.8, h := 0.6, seed_val := 0) -> Node3D:
	# Faces +z, hung on a wall.
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0, 0), Vector3(w, h, 0.04), M("wood_dark"), false)
	var cols := [Color("d9a441"), Color("4e7fb5"), Color("b54e4e"), Color("5b9a59"), Color("e6d8b8"), Color("6a4f8e")]
	var rs := RandomNumberGenerator.new()
	rs.seed = seed_val
	var bg := Mats.solid(cols[rs.randi() % cols.size()], 0.8)
	B.box(r, Vector3(0, 0, 0.022), Vector3(w - 0.1, h - 0.1, 0.005), bg, false)
	for i in 3:
		var sm := Mats.solid(cols[rs.randi() % cols.size()], 0.8)
		var s := Vector3(rs.randf_range(0.1, w * 0.4), rs.randf_range(0.1, h * 0.4), 0.004)
		B.box(r, Vector3(rs.randf_range(-w * 0.25, w * 0.25), rs.randf_range(-h * 0.2, h * 0.2), 0.027), s, sm, false)
	return r


static func rug(parent: Node, pos: Vector3, yaw: float, w: float, d: float, mat := "carpet_red") -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.006, 0), Vector3(w, 0.012, d), M(mat), false)
	return r


static func boxes(parent: Node, pos: Vector3, yaw: float, count := 3, seed_val := 1) -> Node3D:
	var r := _root(parent, pos, yaw)
	var rs := RandomNumberGenerator.new()
	rs.seed = seed_val
	var y := 0.0
	for i in count:
		var s := Vector3(rs.randf_range(0.45, 0.75), rs.randf_range(0.35, 0.55), rs.randf_range(0.45, 0.7))
		var off := Vector3(rs.randf_range(-0.08, 0.08), 0, rs.randf_range(-0.08, 0.08))
		var b := B.box(r, Vector3(off.x, y + s.y * 0.5, off.z), s, M("cardboard"))
		b.rotation.y = rs.randf_range(-0.3, 0.3)
		B.box(b, Vector3(0, s.y * 0.5 + 0.001, 0), Vector3(s.x + 0.005, 0.004, 0.07), Mats.solid(Color("d8c39a"), 0.5), false)
		y += s.y
	return r


static func workbench(parent: Node, pos: Vector3, yaw: float, w := 2.0) -> Node3D:
	var r := table(parent, pos, yaw, w, 0.7, 0.9, "wood")
	B.box(r, Vector3(0, 0.25, 0), Vector3(w - 0.1, 0.03, 0.65), M("wood"), false)
	B.box(r, Vector3(0, 1.5, -0.33), Vector3(w, 1.1, 0.03), M("wood_light"), false)
	for i in 6:
		B.box(r, Vector3(-w * 0.4 + i * w * 0.16, 1.55, -0.3), Vector3(0.03, 0.25, 0.02), M("metal_dark"), false)
	return r


static func lawnmower(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.25, 0), Vector3(0.5, 0.2, 0.6), M("red"))
	B.cyl(r, Vector3(0, 0.38, 0), 0.12, 0.12, M("metal_dark"), false)
	for sx: float in [-0.27, 0.27]:
		for sz: float in [-0.25, 0.25]:
			B.cyl(r, Vector3(sx, 0.1, sz), 0.1, 0.05, M("tire"), false).rotation.z = PI / 2
	B.box(r, Vector3(0, 0.75, -0.55), Vector3(0.45, 0.03, 0.03), M("metal"), false)
	for s: float in [-0.2, 0.2]:
		B.box(r, Vector3(s, 0.55, -0.45), Vector3(0.03, 0.03, 0.55), M("metal"), false).rotation.x = 0.8
	return r


static func coffin(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	# Coffin box without lid; length along z.
	var r := _root(parent, pos, yaw)
	var cm := M("wood_dark")
	B.box(r, Vector3(0, 0.04, 0), Vector3(0.75, 0.08, 2.0), cm)
	for s: int in [-1, 1]:
		B.box(r, Vector3(s * 0.35, 0.25, 0), Vector3(0.05, 0.5, 2.0), cm)
		B.box(r, Vector3(0, 0.25, s * 0.98), Vector3(0.75, 0.5, 0.05), cm)
	B.box(r, Vector3(0, 0.1, 0), Vector3(0.64, 0.04, 1.9), M("fabric_red"), false)
	return r


static func cross(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.6, 0), Vector3(0.1, 1.2, 0.08), M("wood_dark"))
	B.box(r, Vector3(0, 0.88, 0), Vector3(0.6, 0.1, 0.08), M("wood_dark"), false)
	return r


static func mannequin(parent: Node, pos: Vector3, yaw: float, holding_teddy := false) -> Node3D:
	var r := _root(parent, pos, yaw)
	var v := Node3D.new()
	v.position.y = 0.85
	r.add_child(v)
	Items._build_mannequin(v, false)
	if holding_teddy:
		var t := Items.make("teddy")
		var tv_node: Node3D = t.visual.duplicate()
		tv_node.position = Vector3(0, 0.05, 0.18)
		v.add_child(tv_node)
		t.free()
	B.collider(r, Vector3(0, 0.85, 0), Vector3(0.45, 1.7, 0.35))
	return r


static func drawing(parent: Node, pos: Vector3, yaw: float, seed_val := 0) -> Node3D:
	# Child's crayon drawing pinned to a wall: a house, a sun, stick people.
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3.ZERO, Vector3(0.42, 0.3, 0.004), M("paper"), false)
	var rs := RandomNumberGenerator.new()
	rs.seed = seed_val
	var crayon := [Color("e0402f"), Color("2f62c9"), Color("2f9a3f"), Color("e8b82f"), Color("7a3fb5")]
	B.box(r, Vector3(-0.08, -0.06, 0.004), Vector3(0.12, 0.1, 0.002), Mats.solid(crayon[rs.randi() % 5]), false)
	B.box(r, Vector3(-0.08, 0.02, 0.004), Vector3(0.14, 0.04, 0.002), Mats.solid(crayon[rs.randi() % 5]), false).rotation.z = 0.0
	B.cyl(r, Vector3(0.12, 0.08, 0.004), 0.035, 0.002, Mats.solid(Color("f0c330")), false, 10).rotation.x = PI / 2
	for i in 2:
		var x := 0.05 + i * 0.07
		B.box(r, Vector3(x, -0.07, 0.004), Vector3(0.01, 0.08, 0.002), Mats.solid(crayon[rs.randi() % 5]), false)
		B.cyl(r, Vector3(x, -0.02, 0.004), 0.015, 0.002, Mats.solid(crayon[rs.randi() % 5]), false, 8).rotation.x = PI / 2
	B.box(r, Vector3(0, 0.13, 0.006), Vector3(0.02, 0.02, 0.006), M("red"), false)
	return r


static func toy_blocks(parent: Node, pos: Vector3) -> Node3D:
	var r := _root(parent, pos, 0)
	var cols := [Color("d9402f"), Color("3a74c9"), Color("e8c43a"), Color("4c9a4a")]
	var y := 0.05
	for i in 4:
		B.box(r, Vector3(randf_range(-0.03, 0.03), y, randf_range(-0.03, 0.03)), Vector3(0.1, 0.1, 0.1), Mats.solid(cols[i % 4], 0.5), false).rotation.y = randf() * PI
		y += 0.1
	B.box(r, Vector3(0.3, 0.05, 0.1), Vector3(0.1, 0.1, 0.1), Mats.solid(cols[1], 0.5), false)
	B.box(r, Vector3(-0.2, 0.05, 0.25), Vector3(0.1, 0.1, 0.1), Mats.solid(cols[2], 0.5), false)
	return r


static func pipe(parent: Node, a: Vector3, b: Vector3, r := 0.06, mat := "metal_dark") -> Node3D:
	var d := b - a
	var n := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = r
	cm.bottom_radius = r
	cm.height = d.length()
	cm.radial_segments = 12
	n.mesh = cm
	n.material_override = M(mat)
	parent.add_child(n)
	n.position = (a + b) * 0.5
	var up := d.normalized()
	var side := up.cross(Vector3.FORWARD if abs(up.dot(Vector3.FORWARD)) < 0.9 else Vector3.RIGHT).normalized()
	n.basis = Basis(side, up, side.cross(up)).orthonormalized()
	return n


static func car(parent: Node, pos: Vector3, yaw: float, paint := "car_red") -> Node3D:
	# 1970s style sedan, length along x, front at +x.
	var r := _root(parent, pos, yaw)
	var body := M(paint)
	B.box(r, Vector3(0, 0.55, 0), Vector3(4.4, 0.55, 1.75), body)
	B.box(r, Vector3(-0.2, 1.05, 0), Vector3(2.3, 0.5, 1.6), body)
	B.box(r, Vector3(0.95, 1.05, 0), Vector3(0.05, 0.42, 1.45), M("glass_dark"), false).rotation.z = 0.5
	B.box(r, Vector3(-1.35, 1.05, 0), Vector3(0.05, 0.42, 1.45), M("glass_dark"), false).rotation.z = -0.4
	for s: int in [-1, 1]:
		B.box(r, Vector3(-0.2, 1.07, s * 0.802), Vector3(2.0, 0.36, 0.01), M("glass_dark"), false)
		for x: float in [-1.4, 1.35]:
			var w := B.cyl(r, Vector3(x, 0.35, s * 0.8), 0.35, 0.25, M("tire"), false, 18)
			w.rotation.x = PI / 2
			var hub := B.cyl(r, Vector3(x, 0.35, s * 0.93), 0.17, 0.02, M("chrome"), false, 12)
			hub.rotation.x = PI / 2
	B.box(r, Vector3(2.22, 0.45, 0), Vector3(0.08, 0.15, 1.8), M("chrome"), false)
	B.box(r, Vector3(-2.22, 0.45, 0), Vector3(0.08, 0.15, 1.8), M("chrome"), false)
	for s: int in [-1, 1]:
		B.box(r, Vector3(2.21, 0.65, s * 0.6), Vector3(0.04, 0.14, 0.3), M("lamp_on"), false)
		B.box(r, Vector3(-2.21, 0.65, s * 0.65), Vector3(0.04, 0.12, 0.25), M("red_light"), false)
	return r


static func tree(parent: Node, pos: Vector3, h := 6.0, seed_val := 0) -> Node3D:
	var r := _root(parent, pos, 0)
	var rs := RandomNumberGenerator.new()
	rs.seed = seed_val
	B.cyl(r, Vector3(0, h * 0.3, 0), 0.22, h * 0.6, M("bark"), true, 10, 0.16)
	var leaf := M("leaves") if rs.randf() > 0.4 else M("leaves_dark")
	for i in 9:
		var a := rs.randf() * TAU
		var d := rs.randf_range(0.4, 1.6)
		var y := h * rs.randf_range(0.55, 0.95)
		var rad := rs.randf_range(1.0, 1.7)
		B.sphere(r, Vector3(cos(a) * d, y, sin(a) * d), rad, leaf, Vector3(1, 0.85, 1), 14)
	B.sphere(r, Vector3(0, h, 0), 1.5, leaf, Vector3(1, 0.9, 1), 14)
	return r


static func bush(parent: Node, pos: Vector3, s := 1.0) -> Node3D:
	var r := _root(parent, pos, 0)
	for i in 4:
		B.sphere(r, Vector3(randf_range(-0.4, 0.4) * s, 0.45 * s, randf_range(-0.4, 0.4) * s), randf_range(0.45, 0.65) * s, M("hedge"), Vector3(1, 0.8, 1), 12)
	return r


static func street_lamp(parent: Node, pos: Vector3, yaw: float) -> Node3D:
	var r := _root(parent, pos, yaw)
	B.cyl(r, Vector3(0, 2.6, 0), 0.08, 5.2, M("metal_dark"), true, 10, 0.06)
	B.box(r, Vector3(0.6, 5.15, 0), Vector3(1.2, 0.08, 0.08), M("metal_dark"), false)
	B.box(r, Vector3(1.2, 5.05, 0), Vector3(0.45, 0.14, 0.28), M("metal_dark"), false)
	B.box(r, Vector3(1.2, 4.97, 0), Vector3(0.38, 0.03, 0.22), M("lamp_off"), false)
	return r


static func mailbox(parent: Node, pos: Vector3, yaw: float, col := "blue") -> Node3D:
	var r := _root(parent, pos, yaw)
	B.box(r, Vector3(0, 0.55, 0), Vector3(0.08, 1.1, 0.08), M("wood_dark"))
	B.box(r, Vector3(0, 1.18, 0), Vector3(0.28, 0.25, 0.5), M(col), false)
	B.cyl(r, Vector3(0, 1.3, 0), 0.14, 0.5, M(col), false, 12).rotation.x = PI / 2
	B.box(r, Vector3(0.16, 1.32, -0.1), Vector3(0.02, 0.2, 0.05), M("red"), false)
	return r


static func trash_can(parent: Node, pos: Vector3) -> Node3D:
	var r := _root(parent, pos, 0)
	B.cyl(r, Vector3(0, 0.45, 0), 0.3, 0.9, M("metal"), true, 16, 0.32)
	B.cyl(r, Vector3(0, 0.93, 0), 0.34, 0.06, M("metal"), false, 16)
	B.box(r, Vector3(0, 1.0, 0), Vector3(0.18, 0.04, 0.04), M("metal_dark"), false)
	for i in 4:
		B.torus(r, Vector3(0, 0.15 + i * 0.22, 0), 0.3, 0.32, M("metal_dark"))
	return r


static func hydrant(parent: Node, pos: Vector3) -> Node3D:
	var r := _root(parent, pos, 0)
	B.cyl(r, Vector3(0, 0.35, 0), 0.13, 0.7, M("red"), true, 12)
	B.sphere(r, Vector3(0, 0.72, 0), 0.13, M("red"), Vector3.ONE, 12)
	for s: int in [-1, 1]:
		B.cyl(r, Vector3(s * 0.16, 0.45, 0), 0.06, 0.1, M("red"), false, 8).rotation.z = PI / 2
	return r


static func picket_fence(parent: Node, a: Vector3, b: Vector3, h := 0.95, mat := "fence_white", spacing := 0.16) -> void:
	# Low white picket fence between two points (horizontal).
	var d := b - a
	var length := d.length()
	var dir := d / length
	var yaw := atan2(-dir.z, dir.x)
	var r := _root(parent, a, yaw)
	var fm := M(mat)
	for y: float in [0.25, h - 0.2]:
		B.box(r, Vector3(length * 0.5, y, 0), Vector3(length, 0.07, 0.04), fm, false)
	var n := int(length / spacing)
	for i in n + 1:
		var x := i * spacing
		B.box(r, Vector3(x, h * 0.5, 0.03), Vector3(0.08, h, 0.025), fm, false)
		B.prism(r, Vector3(x, h + 0.04, 0.03), Vector3(0.08, 0.08, 0.025), fm)
	var posts := int(length / 2.0)
	for i in posts + 1:
		B.box(r, Vector3(i * length / maxf(posts, 1), h * 0.55, -0.02), Vector3(0.1, h * 1.1, 0.1), fm, false)
	B.collider(r, Vector3(length * 0.5, h * 0.5, 0), Vector3(length, h, 0.12))


static func board_fence(parent: Node, a: Vector3, b: Vector3, h := 1.9) -> void:
	var d := b - a
	var length := d.length()
	var dir := d / length
	var yaw := atan2(-dir.z, dir.x)
	var r := _root(parent, a, yaw)
	B.box(r, Vector3(length * 0.5, h * 0.5, 0), Vector3(length, h, 0.06), M("fence_wood"))
	var posts := int(length / 2.4)
	for i in posts + 1:
		B.box(r, Vector3(i * length / maxf(posts, 1), h * 0.5, -0.06), Vector3(0.1, h, 0.1), M("wood_post"), false)
	B.box(r, Vector3(length * 0.5, h * 0.75, -0.05), Vector3(length, 0.08, 0.04), M("wood_post"), false)
	B.box(r, Vector3(length * 0.5, h * 0.2, -0.05), Vector3(length, 0.08, 0.04), M("wood_post"), false)
