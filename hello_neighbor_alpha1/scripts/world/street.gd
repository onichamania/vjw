class_name Street
extends RefCounted
## Suburban street: road, sidewalks, neighbouring houses, trees, lamps and the
## invisible boundaries of the playable area.


static func M(n: String) -> Material:
	return Mats.get_mat(n)


static func build(root: Node3D) -> void:
	# Ground (one big collider) + visual layers on top.
	B.box(root, Vector3(0, -0.25, -10), Vector3(220, 0.5, 180), M("grass"))
	B.box(root, Vector3(0, 0.003, 0), Vector3(220, 0.006, 8.0), M("asphalt"), false)
	B.box(root, Vector3(0, 0.012, 5.0), Vector3(220, 0.012, 2.0), M("concrete"), false)
	B.box(root, Vector3(0, 0.012, -5.0), Vector3(220, 0.012, 2.0), M("concrete"), false)
	for s: int in [-1, 1]:
		B.box(root, Vector3(0, 0.03, s * 4.05), Vector3(220, 0.06, 0.15), M("curb"), false)
	# Dashed centre line
	var bt := Batch.new()
	var x := -108.0
	while x < 108.0:
		bt.add_box_mm(Vector3(x, 0.006, -0.06), Vector3(x + 2.4, 0.009, 0.06), M("road_line"))
		x += 5.0
	bt.commit(root, false)
	# Street lamps
	for lx: float in [-40.0, -22.0, -4.0, 14.0, 32.0]:
		F.street_lamp(root, Vector3(lx, 0, 4.6), PI / 2 + PI)
		F.street_lamp(root, Vector3(lx + 9.0, 0, -4.6), PI / 2)
	# Neighbouring houses (closed)
	_house(root, Vector3(-34, 0, -16), PI, 14, 10, "siding_yellow", "roof_brown")
	_house(root, Vector3(34, 0, -16), PI, 13, 10, "siding_pink", "roof_grey")
	_house(root, Vector3(-22, 0, 17), 0.0, 12, 9, "siding_green", "roof_grey")
	_house(root, Vector3(21, 0, 17), 0.0, 12, 9, "siding_white", "roof_red")
	_house(root, Vector3(-58, 0, -16), PI, 13, 10, "siding_grey", "roof_red")
	_house(root, Vector3(58, 0, -16), PI, 13, 10, "siding_teal", "roof_brown")
	_house(root, Vector3(-50, 0, 17), 0.0, 12, 9, "siding_cream", "roof_brown")
	_house(root, Vector3(50, 0, 17), 0.0, 12, 9, "siding_yellow", "roof_grey")
	# Trees along the street and in yards
	var tp := [Vector3(-12, 0, 7.8), Vector3(12.5, 0, 7.6), Vector3(-30, 0, 7.6), Vector3(30, 0, 7.4),
		Vector3(-19, 0, -8.0), Vector3(22, 0, -8.5), Vector3(-45, 0, -8.0), Vector3(45, 0, -8.0),
		Vector3(-10, 0, 26), Vector3(10, 0, 27), Vector3(-30, 0, 28), Vector3(30, 0, 28),
		Vector3(-26, 0, -34), Vector3(26, 0, -36), Vector3(-40, 0, 9), Vector3(40, 0, 9), Vector3(0, 0, -52)]
	var sd := 100
	for p in tp:
		F.tree(root, p, randf_range(5.5, 8.0), sd)
		sd += 1
	for p: Vector3 in [Vector3(-8, 0, 7.0), Vector3(8.5, 0, 22), Vector3(-17, 0, -7.2), Vector3(18, 0, -7.0), Vector3(-28, 0, -7), Vector3(27, 0, -7)]:
		F.bush(root, p, 1.2)
	# Hedges between lots
	for hx: float in [-16.5, 16.5]:
		B.box(root, Vector3(hx, 0.6, 18), Vector3(0.9, 1.2, 12), M("hedge"))
	F.hydrant(root, Vector3(-6.5, 0, 4.5))
	F.mailbox(root, Vector3(-27, 0, -6.4), 0, "red")
	F.mailbox(root, Vector3(28, 0, 6.4), PI, "green")
	F.car(root, Vector3(-24, 0, -2.4), 0.0, "car_blue")
	F.car(root, Vector3(40, 0, 2.6), PI, "car_yellow")
	# A distant ring of trees to close the view
	var rs := RandomNumberGenerator.new()
	rs.seed = 7
	for i in 46:
		var a := i * TAU / 46.0
		var p := Vector3(cos(a) * 85.0, 0, sin(a) * 65.0 - 8.0)
		if abs(p.z) < 8.0:
			continue
		F.tree(root, p + Vector3(rs.randf_range(-6, 6), 0, rs.randf_range(-6, 6)), rs.randf_range(7, 11), 300 + i)
	# Invisible boundaries
	B.collider(root, Vector3(-46, 5, -10), Vector3(1, 10, 120))
	B.collider(root, Vector3(46, 5, -10), Vector3(1, 10, 120))
	B.collider(root, Vector3(0, 5, 31), Vector3(94, 10, 1))
	B.collider(root, Vector3(0, 5, -50), Vector3(94, 10, 1))


static func _house(root: Node3D, pos: Vector3, yaw: float, w: float, d: float, siding: String, roof: String) -> void:
	var r := Node3D.new()
	r.position = pos
	r.rotation.y = yaw
	root.add_child(r)
	var hw := w * 0.5
	var hd := d * 0.5
	B.box(r, Vector3(0, 0.3, 0), Vector3(w + 0.3, 0.6, d + 0.3), M("brick_grey"))
	B.box(r, Vector3(0, 0.6 + 1.6, 0), Vector3(w, 3.2, d), M(siding))
	B.gable_roof(r, -hw, -hd, hw, hd, 3.8, 2.2, M(roof), M(siding), "x", 0.5)
	var tw := M("trim_white")
	# front faces local -z (yaw PI for houses north of the road)
	for i in 3:
		var wx := -hw + w * (i + 0.5) / 3.0
		if i == 1:
			B.box(r, Vector3(wx, 1.65, -hd - 0.03), Vector3(1.1, 2.1, 0.06), M("trim_dark"), false)
			B.box(r, Vector3(wx, 1.65, -hd - 0.05), Vector3(1.3, 2.25, 0.02), tw, false)
			B.box(r, Vector3(wx, 0.35, -hd - 0.9), Vector3(2.4, 0.7, 1.6), M("concrete"))
			continue
		B.box(r, Vector3(wx, 2.0, -hd - 0.03), Vector3(1.6, 1.2, 0.04), M("glass_dark"), false)
		B.box(r, Vector3(wx, 2.0, -hd - 0.05), Vector3(1.75, 1.35, 0.02), tw, false)
		B.box(r, Vector3(wx, 1.35, -hd - 0.1), Vector3(1.9, 0.08, 0.15), tw, false)
	for s: int in [-1, 1]:
		B.box(r, Vector3(s * (hw + 0.03), 2.0, 0), Vector3(0.04, 1.2, 1.4), M("glass_dark"), false)
	B.box(r, Vector3(hw * 0.5, 5.2, 0), Vector3(0.7, 2.0, 0.7), M("brick_red"), false)
