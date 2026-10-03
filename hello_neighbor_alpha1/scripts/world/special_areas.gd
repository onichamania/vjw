class_name SpecialAreas
extends Node3D
## Out-of-bounds sets used by cut-scenes (Alpha 1 also built these as
## duplicated areas outside the map):
##  * the carnival nightmare tutorial (hide in the wardrobe or under the bed)
##  * the grave where the player wakes up in an open coffin (ending)

const CARNIVAL := Vector3(400, 0, 0)
const GRAVE := Vector3(-400, 0, 0)

var carnival: Node3D
var grave: Node3D
var carn_wardrobe: HideSpot
var carn_bed: HideSpot
var carn_player_spawn: Node3D
var carn_neighbor_spawn: Node3D
var coffin_lid: Node3D
var grave_cam: Node3D
var grave_neighbor: Node3D
var carousel: Node3D
var wheel: Node3D


func M(n: String) -> Material:
	return Mats.get_mat(n)


func build() -> void:
	_build_carnival()
	_build_grave()
	set_active("")


func set_active(which: String) -> void:
	carnival.visible = which == "carnival"
	grave.visible = which == "grave"


func _process(delta: float) -> void:
	if carnival.visible:
		carousel.rotation.y += delta * 0.6
		wheel.rotation.z += delta * 0.15


# -------------------------------------------------------------- carnival --
func _build_carnival() -> void:
	carnival = Node3D.new()
	carnival.position = CARNIVAL
	add_child(carnival)
	var c := carnival
	B.box(c, Vector3(0, -0.25, 0), Vector3(60, 0.5, 60), M("dirt"))
	B.box(c, Vector3(0, 0.005, 0), Vector3(14, 0.01, 14), Mats.surf(19, Color("2a2a30"), Color("d8d2c0"), Color(), 1.4, 0.8), false)
	# Big circus tent (we stand inside it)
	var tent := Node3D.new()
	c.add_child(tent)
	var n := 16
	for i in n:
		if i == 11 or i == 12:
			continue  # entrance (the Neighbor comes in here)
		var a0 := i * TAU / n
		var a1 := (i + 1) * TAU / n
		var p := Vector3(cos((a0 + a1) * 0.5), 0, sin((a0 + a1) * 0.5)) * 9.0
		var w := 2.0 * 9.0 * sin(PI / n) + 0.05
		var panel := B.box(tent, p + Vector3(0, 2.5, 0), Vector3(w, 5.0, 0.12), M("carnival_red") if i % 2 == 0 else M("carnival_blue"), true)
		panel.rotation.y = -((a0 + a1) * 0.5) + PI / 2
	var roof := B.cyl(tent, Vector3(0, 7.0, 0), 9.3, 4.0, M("carnival_red"), false, 16, 0.2)
	(roof as MeshInstance3D).material_override = Mats.surf(21, Color("c62f2f"), Color("f1ece2"), Color(), 1.3, 0.8)
	B.cyl(tent, Vector3(0, 4.5, 0), 0.15, 9.0, M("wood_dark"), true, 10)
	B.box(tent, Vector3(0, 9.3, 0), Vector3(0.05, 1.2, 0.8), M("red"), false)
	# Entrance gap: remove nothing, just a doorway marker - the neighbour spawns inside.
	# String lights
	for i in 24:
		var a := i * TAU / 24.0
		for r: float in [3.0, 6.0]:
			var lp := Vector3(cos(a) * r, 5.5 + (9.0 - r) * 0.3, sin(a) * r)
			B.sphere(tent, lp, 0.07, M("string_bulb"), Vector3.ONE, 8)
	var l1 := B.omni(c, Vector3(0, 5.5, 0), Color(1.0, 0.65, 0.35), 2.2, 16.0, true)
	l1.name = "TentLight"
	B.omni(c, Vector3(4, 2.5, 4), Color(0.6, 0.2, 0.9), 1.2, 8.0)
	B.omni(c, Vector3(-4, 2.5, -4), Color(0.2, 0.5, 1.0), 1.0, 8.0)
	# Carousel horses circling
	carousel = Node3D.new()
	carousel.position = Vector3(0, 0, 0)
	c.add_child(carousel)
	B.cyl(carousel, Vector3(0, 0.15, 0), 2.2, 0.3, M("carnival_blue"), true, 24)
	for i in 6:
		var a := i * TAU / 6.0
		var hp := Vector3(cos(a) * 1.7, 0, sin(a) * 1.7)
		B.cyl(carousel, hp + Vector3(0, 1.8, 0), 0.03, 3.3, M("gold"), false, 8)
		var horse := Node3D.new()
		horse.position = hp + Vector3(0, 1.1, 0)
		horse.rotation.y = -a
		carousel.add_child(horse)
		B.capsule(horse, Vector3.ZERO, 0.18, 0.8, M("white"), Vector3(0, 0, PI / 2))
		B.capsule(horse, Vector3(0.4, 0.25, 0), 0.1, 0.4, M("white"), Vector3(0, 0, 0.5))
		for lx: float in [-0.25, 0.25]:
			B.cyl(horse, Vector3(lx, -0.3, 0), 0.04, 0.45, M("white"), false, 6)
	B.cyl(carousel, Vector3(0, 3.5, 0), 2.4, 0.4, M("carnival_red"), false, 24, 0.5)
	# Ferris wheel silhouette seen through the tent opening (outside)
	wheel = Node3D.new()
	wheel.position = Vector3(0, 9, -20)
	c.add_child(wheel)
	B.torus(wheel, Vector3.ZERO, 6.8, 7.0, M("metal_dark"), Vector3(PI / 2, 0, 0))
	for i in 12:
		var a := i * TAU / 12.0
		var sp := B.box(wheel, Vector3(cos(a) * 3.5, sin(a) * 3.5, 0), Vector3(7.0, 0.08, 0.08), M("metal_dark"), false)
		sp.rotation.z = a
		B.sphere(wheel, Vector3(cos(a) * 6.9, sin(a) * 6.9, 0), 0.25, M("string_bulb"), Vector3.ONE, 8)
	# Hiding places: a wardrobe and a bed on opposite sides
	var wr := F.wardrobe(c, Vector3(-5.5, 0, 3.5), PI / 2, "wood_dark")
	carn_wardrobe = wr.get_meta("hide")
	var bd := F.bed(c, Vector3(5.2, 0, 3.2), -PI / 2, "fabric_red", 1.5, 2.1, true)
	carn_bed = HideSpot.make(c, Vector3(5.2, 0.25, 3.2), Vector3(0.08, 0.5, 1.5), Vector3(0.25, 0.0, 0.0), Vector3(-0.8, -0.2, 0.0), "bed")
	carn_bed.position = Vector3(4.1, 0.25, 3.2)
	carn_bed.view_point.position = Vector3(0.35, 0.0, 0.0)
	carn_bed.exit_point.position = Vector3(-0.7, -0.2, 0.0)
	bd.name = "CarnivalBed"
	F.boxes(c, Vector3(-3.0, 0, -5.0), 0.3, 3, 81)
	F.boxes(c, Vector3(4.0, 0, -4.5), 0.6, 2, 82)
	# balloons
	for i in 7:
		var bp := Vector3(randf_range(-6, 6), randf_range(2.5, 4.5), randf_range(-6, 6))
		B.sphere(c, bp, 0.22, Mats.emissive(Color.from_hsv(randf(), 0.7, 0.9), 0.4), Vector3(1, 1.15, 1), 12)
	carn_player_spawn = Node3D.new()
	carn_player_spawn.position = Vector3(0, 0.05, 5.5)
	carn_player_spawn.rotation.y = 0.0
	c.add_child(carn_player_spawn)
	carn_neighbor_spawn = Node3D.new()
	carn_neighbor_spawn.position = Vector3(0, 0.05, -11.0)
	c.add_child(carn_neighbor_spawn)


# ----------------------------------------------------------------- grave --
func _build_grave() -> void:
	grave = Node3D.new()
	grave.position = GRAVE
	add_child(grave)
	var g := grave
	# The pit: dirt walls around an open coffin, night sky above.
	B.box(g, Vector3(0, -2.2, 0), Vector3(3.0, 0.2, 4.0), M("dirt"))
	for s: int in [-1, 1]:
		B.box(g, Vector3(s * 0.75, -1.1, 0), Vector3(0.3, 2.4, 4.0), M("dirt"))
		B.box(g, Vector3(0, -1.1, s * 1.6), Vector3(1.8, 2.4, 0.3), M("dirt"))
	B.slab(g, -10, -10, 10, 10, 0.0, 0.1, M("grass"), Rect2(-0.9, -1.75, 1.8, 3.5), false)
	B.slab(g, -10, -10, 10, 10, -0.2, 0.0, M("dirt"), Rect2(-0.9, -1.75, 1.8, 3.5), false)
	F.coffin(g, Vector3(0, -2.1, 0), 0)
	coffin_lid = Node3D.new()
	g.add_child(coffin_lid)
	B.box(coffin_lid, Vector3.ZERO, Vector3(0.8, 0.07, 2.04), M("wood_dark"), false)
	B.box(coffin_lid, Vector3(0, -0.04, -0.4), Vector3(0.08, 0.02, 0.5), M("gold"), false)
	coffin_lid.position = Vector3(0.95, 0.95, 1.95)
	coffin_lid.rotation = Vector3(-1.35, 0.0, 0.25)
	grave_cam = Node3D.new()
	grave_cam.position = Vector3(0, -1.85, 0.55)
	g.add_child(grave_cam)
	grave_neighbor = Node3D.new()
	grave_neighbor.position = Vector3(0, 0.1, 2.05)
	g.add_child(grave_neighbor)
	# moon
	B.sphere(g, Vector3(10, 30, -25), 2.0, Mats.emissive(Color(0.9, 0.92, 1.0), 2.5), Vector3.ONE, 16)
	var moon := DirectionalLight3D.new()
	moon.light_color = Color(0.55, 0.62, 0.9)
	moon.light_energy = 0.4
	moon.rotation_degrees = Vector3(-60, 20, 0)
	moon.name = "Moon"
	moon.visible = false
	g.add_child(moon)
	var lamp := B.omni(g, Vector3(0.6, 0.9, 1.6), Color(1.0, 0.75, 0.4), 1.4, 6.0)
	lamp.name = "Lantern"
	for i in 5:
		F.tree(g, Vector3(randf_range(-9, 9), 0, randf_range(-9, -4)), randf_range(6, 9), 500 + i)
	F.cross(g, Vector3(-2.0, 0.0, -2.2), 0.2)
	F.cross(g, Vector3(2.5, 0.0, -2.8), -0.1)
