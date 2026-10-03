class_name StaticBatcher
extends RefCounted
## Merges the thousands of little static MeshInstances the builders create
## into one mesh per (material, 12 m cell, shadow mode). Collisions are kept;
## only the visual instances are replaced. Anything animated or swapped at
## runtime is tagged with the "no_batch" group and left alone.

const CELL := 20.0


static func _skip(mi: MeshInstance3D, root: Node) -> bool:
	var n: Node = mi
	while n and n != root:
		if n.is_in_group("no_batch") or n.is_in_group("lamp_shades"):
			return true
		n = n.get_parent()
	return false


static func merge(root: Node3D, out_parent: Node3D) -> int:
	var groups := {}
	var mats := {}
	var count := 0
	for node in root.find_children("*", "MeshInstance3D", true, false):
		var mi := node as MeshInstance3D
		if mi == null or not mi.is_visible_in_tree() or mi.material_override == null:
			continue
		if not (mi.mesh is PrimitiveMesh):
			continue
		if _skip(mi, root):
			continue
		var xf := mi.global_transform
		var c := xf.origin
		var cell := Vector3i(int(floor(c.x / CELL)), int(floor(c.y / 8.0)), int(floor(c.z / CELL)))
		var key := "%d|%s|%d" % [mi.material_override.get_instance_id(), str(cell), mi.cast_shadow]
		var st: SurfaceTool
		if not groups.has(key):
			st = SurfaceTool.new()
			st.begin(Mesh.PRIMITIVE_TRIANGLES)
			groups[key] = st
			mats[key] = [mi.material_override, mi.cast_shadow]
		st = groups[key]
		st.append_from(mi.mesh, 0, xf)
		mi.get_parent().remove_child(mi)
		mi.queue_free()
		count += 1
	for key in groups:
		var st: SurfaceTool = groups[key]
		var m := MeshInstance3D.new()
		m.mesh = st.commit()
		m.material_override = mats[key][0]
		m.cast_shadow = mats[key][1]
		out_parent.add_child(m)
	return count


## Merge every primitive mesh below `node` into one mesh per material,
## expressed in `node`'s local space (for moving things like door panels).
static func merge_local(node: Node3D) -> void:
	var groups := {}
	var mats := {}
	var inv := node.global_transform.affine_inverse() if node.is_inside_tree() else Transform3D()
	for c in node.find_children("*", "MeshInstance3D", true, false):
		var mi := c as MeshInstance3D
		if mi.material_override == null or not (mi.mesh is PrimitiveMesh):
			continue
		var xf: Transform3D
		if node.is_inside_tree():
			xf = inv * mi.global_transform
		else:
			xf = _rel(node, mi)
		var key := mi.material_override.get_instance_id()
		if not groups.has(key):
			var st := SurfaceTool.new()
			st.begin(Mesh.PRIMITIVE_TRIANGLES)
			groups[key] = st
			mats[key] = mi.material_override
		(groups[key] as SurfaceTool).append_from(mi.mesh, 0, xf)
		mi.get_parent().remove_child(mi)
		mi.free()
	for key in groups:
		var m := MeshInstance3D.new()
		m.mesh = (groups[key] as SurfaceTool).commit()
		m.material_override = mats[key]
		node.add_child(m)


static func _rel(root: Node3D, n: Node3D) -> Transform3D:
	var xf := n.transform
	var p := n.get_parent()
	while p and p != root:
		if p is Node3D:
			xf = (p as Node3D).transform * xf
		p = p.get_parent()
	return xf
