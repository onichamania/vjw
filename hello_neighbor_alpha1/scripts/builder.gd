class_name B
extends RefCounted
## Geometry helpers: boxes, cylinders, walls with openings, ramps...
## All sizes are metres. Collision layers follow Game.L_* constants.

static var _box_meshes := {}


static func box_mesh(size: Vector3) -> BoxMesh:
	var k := "%.3f|%.3f|%.3f" % [size.x, size.y, size.z]
	if _box_meshes.has(k):
		return _box_meshes[k]
	var m := BoxMesh.new()
	m.size = size
	_box_meshes[k] = m
	return m


## Box centred at `center`. Returns the StaticBody3D (or MeshInstance3D when
## collide == false).
static func box(parent: Node, center: Vector3, size: Vector3, mat: Material, collide := true, layer := 1, shadow := true) -> Node3D:
	var mi := MeshInstance3D.new()
	mi.mesh = box_mesh(size)
	mi.material_override = mat
	if not shadow:
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	if collide:
		var sb := StaticBody3D.new()
		sb.position = center
		sb.collision_layer = layer
		sb.collision_mask = 0
		var cs := CollisionShape3D.new()
		var sh := BoxShape3D.new()
		sh.size = size
		cs.shape = sh
		sb.add_child(cs)
		sb.add_child(mi)
		parent.add_child(sb)
		return sb
	mi.position = center
	parent.add_child(mi)
	return mi


## Box from min/max corners.
static func bmm(parent: Node, a: Vector3, b: Vector3, mat: Material, collide := true, layer := 1) -> Node3D:
	var mn := Vector3(minf(a.x, b.x), minf(a.y, b.y), minf(a.z, b.z))
	var mx := Vector3(maxf(a.x, b.x), maxf(a.y, b.y), maxf(a.z, b.z))
	return box(parent, (mn + mx) * 0.5, mx - mn, mat, collide, layer)


## Invisible collider.
static func collider(parent: Node, center: Vector3, size: Vector3, layer := 1, rot := Vector3.ZERO) -> StaticBody3D:
	var sb := StaticBody3D.new()
	sb.position = center
	sb.rotation = rot
	sb.collision_layer = layer
	sb.collision_mask = 0
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = size
	cs.shape = sh
	sb.add_child(cs)
	parent.add_child(sb)
	return sb


## Rotated box (euler radians).
static func rbox(parent: Node, center: Vector3, size: Vector3, rot: Vector3, mat: Material, collide := true, layer := 1) -> Node3D:
	var n := box(parent, center, size, mat, collide, layer)
	n.rotation = rot
	return n


static func cyl(parent: Node, center: Vector3, radius: float, height: float, mat: Material, collide := false, segments := 20, top_radius := -1.0, layer := 1) -> Node3D:
	var mi := MeshInstance3D.new()
	var m := CylinderMesh.new()
	m.bottom_radius = radius
	m.top_radius = radius if top_radius < 0.0 else top_radius
	m.height = height
	m.radial_segments = segments
	m.rings = 1
	mi.mesh = m
	mi.material_override = mat
	if collide:
		var sb := StaticBody3D.new()
		sb.position = center
		sb.collision_layer = layer
		sb.collision_mask = 0
		var cs := CollisionShape3D.new()
		var sh := CylinderShape3D.new()
		sh.radius = maxf(radius, top_radius)
		sh.height = height
		cs.shape = sh
		sb.add_child(cs)
		sb.add_child(mi)
		parent.add_child(sb)
		return sb
	mi.position = center
	parent.add_child(mi)
	return mi


static func sphere(parent: Node, center: Vector3, radius: float, mat: Material, scl := Vector3.ONE, segments := 24) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var m := SphereMesh.new()
	m.radius = radius
	m.height = radius * 2.0
	m.radial_segments = segments
	m.rings = int(segments / 2.0)
	mi.mesh = m
	mi.material_override = mat
	mi.position = center
	mi.scale = scl
	parent.add_child(mi)
	return mi


static func capsule(parent: Node, center: Vector3, radius: float, height: float, mat: Material, rot := Vector3.ZERO, scl := Vector3.ONE) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var m := CapsuleMesh.new()
	m.radius = radius
	m.height = maxf(height, radius * 2.0)
	m.radial_segments = 20
	m.rings = 6
	mi.mesh = m
	mi.material_override = mat
	mi.position = center
	mi.rotation = rot
	mi.scale = scl
	parent.add_child(mi)
	return mi


static func torus(parent: Node, center: Vector3, inner: float, outer: float, mat: Material, rot := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var m := TorusMesh.new()
	m.inner_radius = inner
	m.outer_radius = outer
	m.rings = 24
	m.ring_segments = 10
	mi.mesh = m
	mi.material_override = mat
	mi.position = center
	mi.rotation = rot
	parent.add_child(mi)
	return mi


## Triangular prism (gable roof). Ridge runs along Z, width along X.
static func prism(parent: Node, center: Vector3, size: Vector3, mat: Material, rot := Vector3.ZERO, collide := false) -> Node3D:
	var mi := MeshInstance3D.new()
	var m := PrismMesh.new()
	m.size = size
	mi.mesh = m
	mi.material_override = mat
	if collide:
		var sb := StaticBody3D.new()
		sb.position = center
		sb.rotation = rot
		sb.collision_layer = 1
		sb.collision_mask = 0
		var cs := CollisionShape3D.new()
		var sh := ConvexPolygonShape3D.new()
		sh.points = PackedVector3Array([
			Vector3(-size.x / 2, -size.y / 2, -size.z / 2), Vector3(size.x / 2, -size.y / 2, -size.z / 2), Vector3(0, size.y / 2, -size.z / 2),
			Vector3(-size.x / 2, -size.y / 2, size.z / 2), Vector3(size.x / 2, -size.y / 2, size.z / 2), Vector3(0, size.y / 2, size.z / 2)])
		cs.shape = sh
		sb.add_child(cs)
		sb.add_child(mi)
		parent.add_child(sb)
		return sb
	mi.position = center
	mi.rotation = rot
	parent.add_child(mi)
	return mi


## Gable roof made of two sloped shingle slabs + gable end triangles.
## Ridge along `axis` ("x" or "z").
static func gable_roof(parent: Node, x0: float, z0: float, x1: float, z1: float, y: float, rise: float, mat: Material, end_mat: Material, axis := "z", overhang := 0.35) -> void:
	var w: float
	var l: float
	if axis == "z":
		w = x1 - x0
		l = z1 - z0
	else:
		w = z1 - z0
		l = x1 - x0
	var half := w * 0.5 + overhang
	var slope_len := sqrt(half * half + rise * rise)
	var ang := atan2(rise, half)
	var cx := (x0 + x1) * 0.5
	var cz := (z0 + z1) * 0.5
	var t := 0.12
	for side: float in [-1.0, 1.0]:
		var off := (half * 0.5) * side
		var ctr: Vector3
		var size: Vector3
		var rot: Vector3
		if axis == "z":
			ctr = Vector3(cx + off, y + rise * 0.5 + t * 0.5, cz)
			size = Vector3(slope_len, t, l + overhang * 2.0)
			rot = Vector3(0, 0, -ang * side)
		else:
			ctr = Vector3(cx, y + rise * 0.5 + t * 0.5, cz + off)
			size = Vector3(l + overhang * 2.0, t, slope_len)
			rot = Vector3(ang * side, 0, 0)
		rbox(parent, ctr, size, rot, mat, true)
	# Gable fill (triangle cross-section extruded along the ridge).
	var yaw := 0.0 if axis == "z" else PI / 2.0
	prism(parent, Vector3(cx, y + rise * 0.5, cz), Vector3(w, rise, l), end_mat, Vector3(0, yaw, 0), true)


## Wall running along X (constant z). Openings: [{a, b, y0, y1}] with a,b on X.
static func wall_x(parent: Node, z: float, x0: float, x1: float, y0: float, y1: float, thick: float, mat: Material, openings := [], collide := true, layer := 1) -> void:
	_wall(parent, "x", z, x0, x1, y0, y1, thick, mat, openings, collide, layer)


## Wall running along Z (constant x). Openings use a,b on Z.
static func wall_z(parent: Node, x: float, z0: float, z1: float, y0: float, y1: float, thick: float, mat: Material, openings := [], collide := true, layer := 1) -> void:
	_wall(parent, "z", x, z0, z1, y0, y1, thick, mat, openings, collide, layer)


static func _wall(parent: Node, along: String, c: float, s0: float, s1: float, y0: float, y1: float, thick: float, mat: Material, openings: Array, collide: bool, layer: int) -> void:
	var ops: Array = []
	for o in openings:
		var a: float = maxf(o.a, s0)
		var b: float = minf(o.b, s1)
		if b - a > 0.01:
			ops.append({"a": a, "b": b, "y0": maxf(o.y0, y0), "y1": minf(o.y1, y1)})
	ops.sort_custom(func(p, q): return p.a < q.a)
	var cur := s0
	for o in ops:
		if o.a > cur + 0.005:
			_wall_piece(parent, along, c, cur, o.a, y0, y1, thick, mat, collide, layer)
		if o.y0 > y0 + 0.005:
			_wall_piece(parent, along, c, o.a, o.b, y0, o.y0, thick, mat, collide, layer)
		if o.y1 < y1 - 0.005:
			_wall_piece(parent, along, c, o.a, o.b, o.y1, y1, thick, mat, collide, layer)
		cur = maxf(cur, o.b)
	if s1 > cur + 0.005:
		_wall_piece(parent, along, c, cur, s1, y0, y1, thick, mat, collide, layer)


static func _wall_piece(parent: Node, along: String, c: float, s0: float, s1: float, y0: float, y1: float, thick: float, mat: Material, collide: bool, layer: int) -> void:
	if along == "x":
		bmm(parent, Vector3(s0, y0, c - thick * 0.5), Vector3(s1, y1, c + thick * 0.5), mat, collide, layer)
	else:
		bmm(parent, Vector3(c - thick * 0.5, y0, s0), Vector3(c + thick * 0.5, y1, s1), mat, collide, layer)


## Floor slab with an optional rectangular hole (Rect2 in XZ).
static func slab(parent: Node, x0: float, z0: float, x1: float, z1: float, y0: float, y1: float, mat: Material, hole := Rect2(), collide := true) -> void:
	if hole.size == Vector2.ZERO:
		bmm(parent, Vector3(x0, y0, z0), Vector3(x1, y1, z1), mat, collide)
		return
	var hx0: float = clampf(hole.position.x, x0, x1)
	var hz0: float = clampf(hole.position.y, z0, z1)
	var hx1: float = clampf(hole.end.x, x0, x1)
	var hz1: float = clampf(hole.end.y, z0, z1)
	if hz0 > z0 + 0.01:
		bmm(parent, Vector3(x0, y0, z0), Vector3(x1, y1, hz0), mat, collide)
	if z1 > hz1 + 0.01:
		bmm(parent, Vector3(x0, y0, hz1), Vector3(x1, y1, z1), mat, collide)
	if hx0 > x0 + 0.01:
		bmm(parent, Vector3(x0, y0, hz0), Vector3(hx0, y1, hz1), mat, collide)
	if x1 > hx1 + 0.01:
		bmm(parent, Vector3(hx1, y0, hz0), Vector3(x1, y1, hz1), mat, collide)


## Smooth collision ramp from p0 (bottom centre) to p1 (top centre), width w.
## Used under stairs so the player and the navmesh get a clean slope.
static func ramp(parent: Node, p0: Vector3, p1: Vector3, width: float, layer := 1, mat: Material = null) -> Node3D:
	var d := p1 - p0
	var horiz := Vector2(d.x, d.z)
	var length := sqrt(horiz.length_squared() + d.y * d.y)
	var t := 0.12
	var yaw := atan2(-d.z, d.x)
	var pitch := atan2(d.y, horiz.length())
	var mid := (p0 + p1) * 0.5
	var basis := Basis(Vector3.UP, yaw) * Basis(Vector3.BACK, pitch)
	var center := mid - basis.y * (t * 0.5)
	var n: Node3D
	if mat:
		n = box(parent, center, Vector3(length, t, width), mat, true, layer)
	else:
		n = collider(parent, center, Vector3(length, t, width), layer)
	n.basis = basis
	return n


static var _font: Font


static func font() -> Font:
	if _font == null and ResourceLoader.exists("res://fonts/NotoSansJP-Bold.ttf"):
		_font = load("res://fonts/NotoSansJP-Bold.ttf")
	return _font


static func label(parent: Node, pos: Vector3, text: String, size := 64, col := Color.WHITE, rot := Vector3.ZERO, outline := 0) -> Label3D:
	var l := Label3D.new()
	if font():
		l.font = font()
	l.text = text
	l.font_size = size
	l.pixel_size = 0.0025
	l.modulate = col
	l.outline_size = outline
	l.position = pos
	l.rotation = rot
	l.shaded = false
	l.double_sided = false
	parent.add_child(l)
	return l


static func omni(parent: Node, pos: Vector3, col: Color, energy: float, rng: float, shadow := false) -> OmniLight3D:
	var l := OmniLight3D.new()
	l.position = pos
	l.light_color = col
	l.light_energy = energy
	l.omni_range = rng
	l.omni_attenuation = 1.2
	l.shadow_enabled = shadow
	l.light_specular = 0.3
	parent.add_child(l)
	return l
