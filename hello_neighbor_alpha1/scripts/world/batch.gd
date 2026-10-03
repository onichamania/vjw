class_name Batch
extends RefCounted
## Merges many static boxes into one mesh per material (fewer draw calls).
## Used for repetitive geometry: the train track, pickets, siding battens...

var _tools := {}   # Material -> SurfaceTool
var _mats := {}


func add_box(xf: Transform3D, size: Vector3, mat: Material) -> void:
	var st: SurfaceTool
	if not _tools.has(mat):
		st = SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		_tools[mat] = st
	st = _tools[mat]
	var h := size * 0.5
	var faces := [
		[Vector3(1, 0, 0), Vector3(0, 1, 0), Vector3(0, 0, 1)],
		[Vector3(-1, 0, 0), Vector3(0, 1, 0), Vector3(0, 0, -1)],
		[Vector3(0, 1, 0), Vector3(0, 0, 1), Vector3(1, 0, 0)],
		[Vector3(0, -1, 0), Vector3(0, 0, -1), Vector3(1, 0, 0)],
		[Vector3(0, 0, 1), Vector3(0, 1, 0), Vector3(-1, 0, 0)],
		[Vector3(0, 0, -1), Vector3(0, 1, 0), Vector3(1, 0, 0)],
	]
	for f in faces:
		var n: Vector3 = f[0]
		var u: Vector3 = f[1]
		var v: Vector3 = f[2]
		var c := n * h
		var du := u * h
		var dv := v * h
		var p0 := c - du - dv
		var p1 := c + du - dv
		var p2 := c + du + dv
		var p3 := c - du + dv
		var wn := (xf.basis * n).normalized()
		# Godot treats clockwise triangles (seen from outside) as front faces.
		var tri := [p0, p1, p2, p0, p2, p3]
		if (p1 - p0).cross(p2 - p0).dot(n) > 0.0:
			tri = [p0, p2, p1, p0, p3, p2]
		for p in tri:
			st.set_normal(wn)
			st.add_vertex(xf * p)


func add_box_mm(a: Vector3, b: Vector3, mat: Material) -> void:
	var mn := Vector3(minf(a.x, b.x), minf(a.y, b.y), minf(a.z, b.z))
	var mx := Vector3(maxf(a.x, b.x), maxf(a.y, b.y), maxf(a.z, b.z))
	add_box(Transform3D(Basis(), (mn + mx) * 0.5), mx - mn, mat)


func commit(parent: Node, shadows := true) -> void:
	for mat in _tools:
		var st: SurfaceTool = _tools[mat]
		var mi := MeshInstance3D.new()
		mi.mesh = st.commit()
		mi.material_override = mat
		if not shadows:
			mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		parent.add_child(mi)
	_tools.clear()
