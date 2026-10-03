class_name HouseProps
extends RefCounted
## Furniture and loose items for every room of the Alpha 1 house.
## (Room contents follow the Alpha 1 room descriptions: blue "ear" wallpaper
## and black ceiling in the living room, pink floral grave room, striped
## light blue bedroom with the crowbar under the bed, brick garage with the
## hammer, lawn mower, toolbox, watering can, binoculars and a bear trap...)

const F1 := NeighborHouse.F1
const F2 := NeighborHouse.F2


static func item(h: NeighborHouse, id: String, p: Vector3, yaw := 0.0, n := 0) -> Item:
	var it := Items.make(id, n)
	h.items_root.add_child(it)
	it.global_position = h.gpos(p)
	it.global_rotation = Vector3(0, h.global_rotation.y + yaw, 0)
	return it


static func lamp(h: NeighborHouse, x: float, z: float, flr: int, rng := 7.0, energy := 1.1) -> void:
	var y := NeighborHouse.C1 if flr == 1 else NeighborHouse.C2
	F.ceiling_lamp(h, Vector3(x, y - 0.06, z), rng, energy)


static func furnish(h: NeighborHouse) -> void:
	_kitchen(h)
	_dining(h)
	_grave(h)
	_hall(h)
	_living(h)
	_bedroom(h)
	_garage(h)
	_bath1(h)
	_boiler(h)
	_upstairs(h)


static func _kitchen(h: NeighborHouse) -> void:
	F.sink_counter(h, Vector3(3.3, F1, 0.42), 0, 2.0)
	F.counter(h, Vector3(5.75, F1, 0.42), 0, 1.5)
	F.upper_cabinets(h, Vector3(5.75, F1 + 1.75, 0.3), 0, 1.5)
	F.stove(h, Vector3(0.45, F1, 1.25), PI / 2)
	F.counter(h, Vector3(0.42, F1, 4.95), PI / 2, 0.8)
	F.fridge(h, Vector3(0.48, F1, 5.85), PI / 2)
	F.table(h, Vector3(4.3, F1, 3.6), 0, 1.0, 0.8)
	F.chair(h, Vector3(4.3, F1, 4.4), PI)
	# microwave & kettle on the counter
	B.box(h, Vector3(6.1, F1 + 1.06, 0.38), Vector3(0.5, 0.28, 0.36), F.M("white"), false)
	B.box(h, Vector3(6.02, F1 + 1.06, 0.565), Vector3(0.32, 0.2, 0.01), F.M("glass_dark"), false)
	B.cyl(h, Vector3(5.3, F1 + 1.02, 0.4), 0.08, 0.2, F.M("chrome"), false, 12, 0.06)
	lamp(h, 3.5, 3.2, 1, 6.5)
	item(h, "apple", Vector3(0.45, F1 + 0.96, 4.8))
	item(h, "apple", Vector3(0.45, F1 + 0.96, 5.05))
	item(h, "milk", Vector3(0.48, F1 + 1.85, 5.75))
	item(h, "radio", Vector3(0.5, F1 + 1.85, 6.05), PI / 2)
	item(h, "plate", Vector3(2.6, F1 + 0.95, 0.4))
	item(h, "mug", Vector3(4.2, F1 + 0.8, 3.5))
	item(h, "banana", Vector3(2.2, F1 + 0.02, 2.4), 0.4)
	item(h, "banana", Vector3(5.1, F1 + 0.02, 5.4), 1.4)
	item(h, "milk", Vector3(1.9, F1 + 0.05, 4.4), 0.0).rotation.x = PI / 2
	item(h, "broom", Vector3(6.6, F1 + 0.6, 5.9), 0.0).rotation.z = 1.35
	item(h, "bucket", Vector3(6.3, F1 + 0.02, 5.2))
	# garbage bag
	B.sphere(h, Vector3(6.4, F1 + 0.3, 1.6), 0.32, F.M("black"), Vector3(1, 0.9, 1), 12)
	F.painting(h, Vector3(6.88, F1 + 1.7, 4.5), -PI / 2, 0.6, 0.45, 3)


static func _dining(h: NeighborHouse) -> void:
	F.table(h, Vector3(3.5, F1, 9.2), 0, 1.9, 1.0)
	F.chair(h, Vector3(3.5, F1, 8.35), 0)
	F.chair(h, Vector3(3.5, F1, 10.05), PI)
	F.chair(h, Vector3(2.15, F1, 9.2), PI / 2)
	F.shelf(h, Vector3(0.32, F1, 11.0), PI / 2, 1.2, 1.9, 0.4)
	F.painting(h, Vector3(0.12, F1 + 1.75, 9.5), PI / 2, 1.0, 0.7, 7)
	F.rug(h, Vector3(3.5, F1, 9.2), 0, 3.0, 2.2, "carpet_red")
	lamp(h, 3.5, 9.2, 1, 6.0)
	item(h, "banana", Vector3(3.1, F1 + 0.8, 9.1), 0.6)
	item(h, "banana", Vector3(4.0, F1 + 0.8, 9.4), 2.0)
	item(h, "plate", Vector3(3.5, F1 + 0.79, 8.9))
	item(h, "mug", Vector3(2.8, F1 + 0.79, 9.3))


static func _grave(h: NeighborHouse) -> void:
	# Furniture blocking the other two doorways from the inside.
	F.wardrobe(h, Vector3(6.6, F1, 15.35), -PI / 2, "wood")
	F.shelf(h, Vector3(0.35, F1, 15.55), PI / 2, 1.3, 1.9, 0.45)
	F.chair(h, Vector3(1.0, F1, 14.4), 0.7)
	F.cross(h, Vector3(3.5, F1, 17.15), 0)
	F.painting(h, Vector3(3.5, F1 + 2.1, 17.88), PI, 0.7, 0.5, 21)
	# Instructions for the safety coffin
	var sign := Node3D.new()
	sign.position = Vector3(0.12, F1 + 1.55, 13.4)
	sign.rotation.y = PI / 2
	h.add_child(sign)
	B.box(sign, Vector3.ZERO, Vector3(0.7, 0.5, 0.01), F.M("paper"), false)
	B.label(sign, Vector3(0, 0.15, 0.01), "SAFETY COFFIN", 34, Color(0.15, 0.1, 0.1))
	B.label(sign, Vector3(0, 0.0, 0.01), "1. ベルを柱にかける\n2. シャベルで掘る\n3. フタを開ける", 22, Color(0.2, 0.15, 0.12))
	lamp(h, 3.5, 15.0, 1, 6.0, 0.9)


static func _hall(h: NeighborHouse) -> void:
	F.rug(h, Vector3(9.0, F1, 8.0), 0, 1.6, 12.0, "carpet_blue")
	F.table(h, Vector3(7.35, F1, 5.8), PI / 2, 0.9, 0.4, 0.8, "wood_dark")
	F.painting(h, Vector3(7.12, F1 + 1.7, 11.0), PI / 2, 0.8, 0.6, 5)
	F.painting(h, Vector3(10.88, F1 + 1.7, 7.0), -PI / 2, 0.6, 0.8, 9)
	F.painting(h, Vector3(10.88, F1 + 1.7, 15.0), -PI / 2, 0.7, 0.5, 13)
	# coat rack
	B.cyl(h, Vector3(10.6, F1 + 0.9, 0.6), 0.03, 1.8, F.M("wood_dark"), true, 8)
	for i in 4:
		var a := i * PI / 2
		B.box(h, Vector3(10.6 + cos(a) * 0.12, F1 + 1.7, 0.6 + sin(a) * 0.12), Vector3(0.2, 0.03, 0.03), F.M("wood_dark"), false).rotation.y = -a
	item(h, "hat", Vector3(10.6, F1 + 1.85, 0.6))
	item(h, "book", Vector3(7.35, F1 + 0.82, 5.6))
	lamp(h, 9.0, 3.5, 1, 6.0, 1.0)
	lamp(h, 9.0, 10.5, 1, 6.0, 1.0)


static func _living(h: NeighborHouse) -> void:
	F.couch(h, Vector3(13.6, F1, 5.2), PI / 2, "fabric_red")
	F.tv(h, Vector3(18.45, F1, 5.2), -PI / 2, true)
	F.rug(h, Vector3(16.0, F1, 5.0), 0, 3.6, 2.6, "carpet_red")
	F.nightstand(h, Vector3(13.5, F1, 3.4), PI / 2)
	F.lamp(h, Vector3(13.5, F1 + 0.6, 3.4), false, true)
	F.armchair(h, Vector3(16.2, F1, 2.0), PI, "fabric_mustard")
	F.boxes(h, Vector3(11.7, F1, 0.75), 0.2, 3, 3)
	F.boxes(h, Vector3(12.5, F1, 0.6), -0.3, 2, 4)
	F.boxes(h, Vector3(18.3, F1, 1.2), 0.1, 2, 5)
	F.boxes(h, Vector3(11.8, F1, 6.9), 0.4, 3, 6)
	F.painting(h, Vector3(11.12, F1 + 1.8, 6.0), PI / 2, 0.9, 0.7, 2)
	lamp(h, 15.5, 4.0, 1, 7.5, 1.2)
	item(h, "remote", Vector3(13.65, F1 + 0.52, 4.8), 0.3)
	item(h, "hat", Vector3(13.6, F1 + 0.55, 5.8))
	item(h, "flashlight", Vector3(13.4, F1 + 0.63, 3.3))
	item(h, "box", Vector3(17.2, F1 + 0.26, 6.8))
	item(h, "box", Vector3(14.6, F1 + 0.26, 7.0))
	item(h, "book", Vector3(16.2, F1 + 0.5, 2.0))


static func _bedroom(h: NeighborHouse) -> void:
	F.bed(h, Vector3(15.0, F1, 16.85), PI, "fabric_blue", 1.5, 2.1, true)
	var hs := HideSpot.make(h, Vector3(15.0, F1 + 0.25, 15.72), Vector3(1.5, 0.5, 0.08), Vector3(0, 0.0, 0.2), Vector3(0, -0.2, -0.75), "bed")
	hs.rotation.y = 0.0
	F.nightstand(h, Vector3(13.75, F1, 17.6), PI)
	F.nightstand(h, Vector3(16.25, F1, 17.6), PI)
	F.lamp(h, Vector3(16.25, F1 + 0.6, 17.6), false, true)
	F.wardrobe(h, Vector3(12.1, F1, 17.55), PI, "wood_dark")
	F.rug(h, Vector3(15.0, F1, 14.6), 0, 2.4, 1.6, "carpet_blue")
	F.shelf(h, Vector3(17.6, F1, 15.0), -PI / 2, 1.0, 1.4, 0.4)
	F.painting(h, Vector3(15.0, F1 + 2.2, 17.88), PI, 0.9, 0.5, 17)
	lamp(h, 14.8, 13.5, 1, 7.0, 1.0)
	item(h, "binoculars", Vector3(13.75, F1 + 0.65, 17.6))
	# the crowbar is under the bed
	item(h, "crowbar", Vector3(14.15, F1 + 0.04, 16.2), 1.3)


static func _garage(h: NeighborHouse) -> void:
	F.workbench(h, Vector3(23.55, F1, 6.2), -PI / 2, 2.4)
	F.lawnmower(h, Vector3(20.0, F1, 8.4), 0.3)
	F.shelf(h, Vector3(21.8, F1, 9.15), PI, 1.6, 2.0, 0.45)
	F.boxes(h, Vector3(19.6, F1, 6.3), 0.1, 3, 8)
	F.boxes(h, Vector3(23.4, F1, 8.8), 0.0, 2, 9)
	# bear trap (decor)
	var bt := Node3D.new()
	bt.position = Vector3(20.6, F1 + 0.02, 4.2)
	h.add_child(bt)
	B.cyl(bt, Vector3.ZERO, 0.18, 0.03, F.M("metal_dark"), false, 16)
	B.torus(bt, Vector3(0, 0.05, 0), 0.16, 0.2, F.M("metal"), Vector3(0.6, 0, 0))
	B.torus(bt, Vector3(0, 0.05, 0), 0.16, 0.2, F.M("metal"), Vector3(-0.6, 0, 0))
	var hang := F.ceiling_lamp(h, Vector3(21.5, NeighborHouse.C1 - 0.06, 4.5), 7.0, 1.0)
	hang.name = "GarageLamp"
	item(h, "hammer", Vector3(23.4, F1 + 0.94, 6.6), 0.4)
	item(h, "toolbox", Vector3(23.4, F1 + 0.95, 5.5))
	item(h, "watering_can", Vector3(19.8, F1 + 0.02, 1.4))
	item(h, "bucket", Vector3(20.4, F1 + 0.02, 1.0))
	item(h, "broom", Vector3(19.5, F1 + 0.6, 2.4)).rotation.z = 1.4
	item(h, "flashlight", Vector3(23.4, F1 + 0.95, 7.3))
	item(h, "binoculars", Vector3(21.4, F1 + 0.95, 9.1))
	item(h, "box", Vector3(19.8, F1 + 0.26, 4.0))
	item(h, "box", Vector3(23.0, F1 + 0.26, 2.0))


static func _bath1(h: NeighborHouse) -> void:
	F.bathtub(h, Vector3(21.5, F1, 9.98), PI / 2)
	F.toilet(h, Vector3(23.55, F1, 12.6), -PI / 2)
	F.bath_sink(h, Vector3(19.4, F1, 13.15), PI)
	F.rug(h, Vector3(21.0, F1, 11.8), 0, 1.4, 0.8, "carpet_blue")
	lamp(h, 21.0, 11.5, 1, 5.0, 0.9)
	item(h, "mug", Vector3(19.4, F1 + 0.95, 13.05))


static func _boiler(h: NeighborHouse) -> void:
	F.boiler(h, Vector3(22.85, F1, 16.0), -PI / 2)
	F.pipe(h, Vector3(18.2, NeighborHouse.C1 - 0.25, 14.0), Vector3(23.8, NeighborHouse.C1 - 0.25, 14.0), 0.07)
	F.pipe(h, Vector3(18.2, NeighborHouse.C1 - 0.45, 17.6), Vector3(22.4, NeighborHouse.C1 - 0.45, 17.6), 0.05, "copper")
	F.shelf(h, Vector3(18.35, F1, 17.2), PI / 2, 1.0, 1.5, 0.4)
	lamp(h, 20.5, 15.5, 1, 5.5, 0.8)
	item(h, "bucket", Vector3(19.3, F1 + 0.02, 14.2))


static func _upstairs(h: NeighborHouse) -> void:
	var u := F2
	# --- Corridor (c1)
	F.table(h, Vector3(12.6, u, 3.2), PI / 2, 0.8, 0.4, 0.8, "wood_dark")
	F.painting(h, Vector3(9.12, u + 1.8, 3.2), PI / 2, 0.5, 0.6, 31)
	lamp(h, 11.0, 2.0, 2, 4.5, 0.9)
	item(h, "book", Vector3(12.6, u + 0.82, 3.0))
	# --- Storeroom
	F.shelf(h, Vector3(0.32, u, 5.2), PI / 2, 1.6, 2.1, 0.45)
	F.shelf(h, Vector3(0.32, u, 10.4), PI / 2, 1.6, 2.1, 0.45)
	F.shelf(h, Vector3(4.65, u, 7.0), -PI / 2, 1.6, 2.1, 0.45)
	F.boxes(h, Vector3(3.8, u, 10.6), 0.3, 3, 21)
	F.boxes(h, Vector3(4.2, u, 4.8), 0.1, 2, 22)
	F.couch(h, Vector3(2.6, u, 9.0), 0.1, "fabric_brown", 1.6)
	lamp(h, 2.5, 8.0, 2, 6.0, 0.7)
	item(h, "box", Vector3(1.4, u + 0.26, 7.6))
	item(h, "box", Vector3(1.6, u + 0.26, 6.4))
	item(h, "radio", Vector3(2.5, u + 0.5, 9.0))
	# --- Closet
	F.wardrobe(h, Vector3(7.0, u, 9.45), 0, "wood")
	F.boxes(h, Vector3(8.4, u, 11.4), 0, 3, 23)
	F.boxes(h, Vector3(5.6, u, 11.4), 0, 2, 24)
	# --- Children room
	F.crib(h, Vector3(4.5, u, 15.2), 0.15)
	F.mannequin(h, Vector3(7.9, u, 16.9), -2.4, true)
	F.toy_blocks(h, Vector3(1.6, u, 13.6))
	F.toy_blocks(h, Vector3(7.6, u, 13.4))
	F.table(h, Vector3(1.6, u, 16.6), 0, 0.9, 0.7, 0.5, "wood_white")
	F.chair(h, Vector3(1.6, u, 17.3), PI, "wood_white")
	F.shelf(h, Vector3(8.6, u, 14.6), -PI / 2, 1.0, 1.2, 0.35)
	F.rug(h, Vector3(4.5, u, 15.2), 0, 3.0, 2.4, "carpet_red")
	var seed_v := 40
	for p: Array in [[Vector3(2.0, u + 1.6, 12.12), 0.0], [Vector3(3.2, u + 1.4, 12.12), 0.0], [Vector3(5.0, u + 1.7, 17.88), PI],
			[Vector3(6.4, u + 1.5, 17.88), PI], [Vector3(8.88, u + 1.6, 16.6), -PI / 2], [Vector3(8.88, u + 1.4, 13.2), -PI / 2],
			[Vector3(0.12, u + 1.7, 13.4), PI / 2], [Vector3(0.12, u + 1.4, 17.0), PI / 2], [Vector3(7.5, u + 1.8, 12.12), 0.0]]:
		F.drawing(h, p[0], p[1], seed_v)
		seed_v += 1
	lamp(h, 4.5, 15.0, 2, 6.5, 1.0)
	item(h, "teddy", Vector3(2.4, u + 0.02, 14.4))
	item(h, "block", Vector3(3.0, u + 0.06, 13.4))
	item(h, "block", Vector3(6.0, u + 0.06, 17.0))
	# --- Upstairs hall: stairs to the 3rd floor blocked by furniture
	var pile := Node3D.new()
	pile.position = Vector3(12.25, u, 9.9)
	h.add_child(pile)
	F.wardrobe(pile, Vector3(-0.1, 0, 0.6), 0.25, "wood")
	F.couch(pile, Vector3(0.0, 0.0, -0.1), 0.1, "fabric_green", 1.4)
	F.boxes(pile, Vector3(0.5, 0.9, 0.0), 0.3, 2, 25)
	F.chair(pile, Vector3(-0.3, 0.9, 0.0), 2.1)
	F.painting(h, Vector3(9.12, u + 1.8, 13.0), PI / 2, 0.8, 0.6, 33)
	F.rug(h, Vector3(10.3, u, 13.0), 0, 1.4, 5.0, "carpet_blue")
	lamp(h, 10.5, 12.5, 2, 6.0, 1.0)
	# chair jammed against the classroom door
	var jam := item(h, "chair", Vector3(11.05, u + 0.6, 9.55), PI)
	jam.set_meta("jam_chair", true)
	h.set_meta("jam_chair", jam)
	# --- 2F living room
	F.couch(h, Vector3(16.6, u, 13.15), 0, "fabric_brown")
	F.armchair(h, Vector3(18.7, u, 14.6), -PI / 2, "fabric_green")
	B.box(h, Vector3(16.6, u + 0.24, 16.95), Vector3(0.8, 0.48, 0.6), F.M("cardboard"))
	B.box(h, Vector3(16.55, u + 0.68, 16.97), Vector3(0.74, 0.4, 0.56), F.M("cardboard"))
	F.tv(h, Vector3(16.6, u + 0.38, 16.95), PI, true, false)
	F.wardrobe(h, Vector3(14.1, u, 10.0), 0, "wood_dark")
	F.painting(h, Vector3(19.88, u + 1.8, 12.9), -PI / 2, 0.5, 0.7, 35)
	F.painting(h, Vector3(13.12, u + 1.8, 13.5), PI / 2, 0.9, 0.6, 36)
	F.rug(h, Vector3(16.6, u, 14.8), 0, 3.0, 2.0, "carpet_red")
	lamp(h, 16.5, 14.0, 2, 7.0, 1.0)
	item(h, "remote", Vector3(16.2, u + 0.52, 13.2))
	item(h, "mug", Vector3(18.9, u + 0.5, 15.2))
	item(h, "box", Vector3(19.2, u + 0.26, 17.2))
	# --- Small hall
	F.painting(h, Vector3(21.48, u + 1.7, 14.0), -PI / 2, 0.5, 0.6, 37)
	lamp(h, 20.8, 14.0, 2, 4.0, 0.7)
	# --- CCTV room
	F.desk(h, Vector3(23.4, u, 11.8), -PI / 2, 2.4, 0.7, 0.8)
	F.chair(h, Vector3(22.6, u, 11.8), -PI / 2)
	lamp(h, 22.8, 11.8, 2, 4.0, 0.6)
	# --- 2F bathroom
	F.toilet(h, Vector3(23.55, u, 14.55), -PI / 2)
	F.bath_sink(h, Vector3(22.2, u, 14.35), 0)
	F.pipe(h, Vector3(21.8, u + 0.4, 17.9), Vector3(23.8, u + 0.4, 17.9), 0.05)
	lamp(h, 22.8, 16.0, 2, 5.0, 0.8)
	item(h, "jackhammer", Vector3(22.3, u + 0.5, 16.8))
	# Debris around the hole
	for i in 5:
		B.box(h, Vector3(22.0 + randf() * 1.8, u + 0.03, 18.05 + randf() * 0.2), Vector3(0.15, 0.06, 0.1), F.M("tiles_bath"), false).rotation.y = randf() * PI
	# --- Flooded room: half-sunken drawer with the bell, wardrobe on the landing
	var dr := Node3D.new()
	dr.position = Vector3(15.6, NeighborHouse.POOL, 5.6)
	dr.rotation = Vector3(0.12, 0.5, -0.2)
	h.add_child(dr)
	B.box(dr, Vector3(0, 0.55, 0), Vector3(1.0, 1.1, 0.55), F.M("wood_dark"))
	for i in 3:
		B.box(dr, Vector3(0, 0.25 + i * 0.32, 0.28), Vector3(0.9, 0.26, 0.02), F.M("wood"), false)
	var bell := item(h, "bell", Vector3(15.6, NeighborHouse.POOL + 1.22, 5.6))
	bell.freeze = true
	F.wardrobe(h, Vector3(20.0, u, 9.05), PI, "wood")
	F.painting(h, Vector3(13.12, u + 1.4, 6.0), PI / 2, 1.0, 0.7, 41).rotation.z = 0.15
	F.painting(h, Vector3(23.88, u + 1.6, 7.5), -PI / 2, 0.8, 0.6, 42).rotation.z = -0.1
	# floating junk
	B.box(h, Vector3(20.5, NeighborHouse.WATER - 0.1, 1.2), Vector3(0.6, 0.35, 0.5), F.M("cardboard"), false).rotation.y = 0.5
	B.box(h, Vector3(22.8, NeighborHouse.WATER - 0.2, 4.6), Vector3(0.45, 0.6, 0.45), F.M("wood"), false).rotation = Vector3(0.4, 0.2, 0.7)
	F.chair(h, Vector3(17.2, NeighborHouse.POOL, 1.0), 0.8)
	lamp(h, 18.5, 4.5, 2, 9.0, 0.6)
