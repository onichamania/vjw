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
	# Gather first, then build one merged mesh at a time: a SurfaceTool holds
	# ~200 bytes per vertex, so keeping them all open at once made a large
	# memory peak at start-up (bad for phone browsers).
	var groups := {}
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
		if not groups.has(key):
			groups[key] = [mi.material_override, mi.cast_shadow, []]
		(groups[key][2] as Array).append([mi.mesh, xf])
		mi.get_parent().remove_child(mi)
		mi.queue_free()
		count += 1
	for key in groups:
		var g: Array = groups[key]
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		for item: Array in g[2]:
			st.append_from(item[0], 0, item[1])
		var m := MeshInstance3D.new()
		m.mesh = st.commit()
		st.clear()
		m.material_override = g[0]
		m.cast_shadow = g[1]
		out_parent.add_child(m)
		(g[2] as Array).clear()
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


## Every static body costs the physics engine (Jolt) about 25 KB, and the
## builders make thousands of them: a phone browser can run out of memory.
## Plain ones (auto-named, no script, group, meta, signal, nothing interactive
## above them, not held in any script variable) give their shapes to one compound body per
## (layers, 16 m cell) under `out_parent`. Shapes keep their exact transforms.
static func merge_colliders(root: Node3D, out_parent: Node3D) -> int:
	var cand := {}
	for n in root.find_children("*", "StaticBody3D", true, false):
		var sb := n as StaticBody3D
		if sb.get_class() != "StaticBody3D" or sb.get_script() != null or not sb.get_groups().is_empty():
			continue
		if not String(sb.name).begins_with("@"):   # named bodies may be looked up by name
			continue
		if not sb.get_meta_list().is_empty() or sb.physics_material_override != null or sb.get_child_count() == 0:
			continue
		if not sb.global_transform.basis.get_scale().is_equal_approx(Vector3.ONE):
			continue
		var plain := true
		for c in sb.get_children():
			if not (c is CollisionShape3D) or (c as CollisionShape3D).disabled or c.get_child_count() > 0 \
					or not c.get_groups().is_empty():
				plain = false
				break
		if plain and not _connected(sb) and not _near_interactive(sb):
			cand[sb.get_instance_id()] = sb
	_drop_referenced(root.get_tree().root, cand)
	var bodies := {}
	for id in cand:
		var sb: StaticBody3D = cand[id]
		var c := sb.global_position
		var key := "%d|%d|%d|%d" % [sb.collision_layer, sb.collision_mask, int(floor(c.x / 16.0)), int(floor(c.z / 16.0))]
		if not bodies.has(key):
			var nb := StaticBody3D.new()
			nb.name = "Colliders"
			nb.collision_layer = sb.collision_layer
			nb.collision_mask = sb.collision_mask
			out_parent.add_child(nb)
			bodies[key] = nb
		var body: StaticBody3D = bodies[key]
		for cs in sb.get_children():
			var g: Transform3D = (cs as Node3D).global_transform
			sb.remove_child(cs)
			body.add_child(cs)
			(cs as Node3D).global_transform = g
		sb.get_parent().remove_child(sb)
		sb.free()
	return cand.size()


static func _connected(o: Object) -> bool:
	for s in o.get_signal_list():
		if not o.get_signal_connection_list(s.name).is_empty():
			return true
	return false


## The interaction / shooting rays look for these methods on the hit body and
## up to three of its parents.
static func _near_interactive(sb: Node) -> bool:
	var n := sb.get_parent()
	for i in 3:
		if n == null:
			return false
		if n.has_method("get_prompt") or n.has_method("on_shot") or n.has_method("break_glass"):
			return true
		n = n.get_parent()
	return false


## Leave alone any body a script keeps in a variable (directly or in an
## array / dictionary).
static func _drop_referenced(tree_root: Node, cand: Dictionary) -> void:
	var stack: Array[Node] = [tree_root]
	while not stack.is_empty():
		var n: Node = stack.pop_back()
		for c in n.get_children():
			stack.append(c)
		if n.get_script() == null:
			continue
		for p in n.get_property_list():
			if p.usage & PROPERTY_USAGE_SCRIPT_VARIABLE == 0:
				continue
			_drop_value(n.get(p.name), cand)


static func _drop_value(v: Variant, cand: Dictionary) -> void:
	match typeof(v):
		TYPE_OBJECT:
			if is_instance_valid(v):
				cand.erase((v as Object).get_instance_id())
		TYPE_ARRAY:
			for e in v:
				_drop_value(e, cand)
		TYPE_DICTIONARY:
			for e in (v as Dictionary).values():
				_drop_value(e, cand)
