class_name HideSpot
extends StaticBody3D
## Wardrobe / under-the-bed hiding place.
## In Alpha 1 hiding works unless the Neighbor is in "attack mode".

var view_point: Node3D      # where the camera sits while hidden
var exit_point: Node3D      # where the player is put back
var label_text := "隠れる"
var kind := "wardrobe"      # wardrobe | bed
var doors: Array[Node3D] = []
var occupied := false


static func make(parent: Node, center: Vector3, size: Vector3, view_local: Vector3, exit_local: Vector3, k := "wardrobe") -> HideSpot:
	var h := HideSpot.new()
	h.kind = k
	h.label_text = "タンスに隠れる" if k == "wardrobe" else "ベッドの下に隠れる"
	h.collision_layer = 64
	h.collision_mask = 0
	h.position = center
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = size
	cs.shape = sh
	h.add_child(cs)
	h.view_point = Node3D.new()
	h.view_point.position = view_local
	h.add_child(h.view_point)
	h.exit_point = Node3D.new()
	h.exit_point.position = exit_local
	h.add_child(h.exit_point)
	parent.add_child(h)
	h.add_to_group("hide_spots")
	return h


func get_prompt(_p: Node) -> String:
	return label_text


func interact(p: Node) -> void:
	p.hide_in(self)


func set_doors_open(o: bool) -> void:
	for i in doors.size():
		var d: Node3D = doors[i]
		var s := -1.0 if i == 0 else 1.0
		var tw := d.create_tween()
		tw.tween_property(d, "rotation:y", s * 1.4 if o else 0.0, 0.25)
