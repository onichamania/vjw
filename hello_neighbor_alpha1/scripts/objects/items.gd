class_name Items
extends RefCounted
## Factory for every pick-up-able prop in the game.

const NAMES := {
	"bell": "ベル",
	"shovel": "シャベル",
	"teacher": "先生のマネキン",
	"toy_rifle": "おもちゃのライフル",
	"silver_key": "銀の鍵",
	"jackhammer": "削岩機",
	"copper_key": "銅のハートの鍵",
	"lockpick": "ピッキングツール",
	"hammer": "ハンマー",
	"crowbar": "バール",
	"apple": "リンゴ",
	"banana": "バナナの皮",
	"milk": "牛乳パック",
	"box": "段ボール箱",
	"chair": "イス",
	"remote": "テレビのリモコン",
	"hat": "帽子",
	"flashlight": "懐中電灯",
	"binoculars": "双眼鏡",
	"broom": "ほうき",
	"bucket": "バケツ",
	"watering_can": "じょうろ",
	"radio": "ラジオ",
	"teddy": "テディベア",
	"block": "積み木",
	"cam": "監視カメラ",
	"mug": "マグカップ",
	"book": "本",
	"plate": "お皿",
	"toolbox": "工具箱",
	"paper_ball": "紙くず",
}

static var _mats := {}


static func m(col: Color, rough := 0.6, metal := 0.0) -> Material:
	var k := "%s|%.2f|%.2f" % [col.to_html(), rough, metal]
	if not _mats.has(k):
		_mats[k] = Mats.solid(col, rough, metal, true)
	return _mats[k]


static func _box(v: Node3D, pos: Vector3, size: Vector3, mat: Material, rot := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = B.box_mesh(size)
	mi.material_override = mat
	mi.position = pos
	mi.rotation = rot
	v.add_child(mi)
	return mi


static func _cyl(v: Node3D, pos: Vector3, r: float, h: float, mat: Material, rot := Vector3.ZERO, top := -1.0) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.bottom_radius = r
	cm.top_radius = r if top < 0 else top
	cm.height = h
	cm.radial_segments = 16
	cm.rings = 1
	mi.mesh = cm
	mi.material_override = mat
	mi.position = pos
	mi.rotation = rot
	v.add_child(mi)
	return mi


static func _sph(v: Node3D, pos: Vector3, r: float, mat: Material, scl := Vector3.ONE) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = r
	sm.height = r * 2
	sm.radial_segments = 16
	sm.rings = 8
	mi.mesh = sm
	mi.material_override = mat
	mi.position = pos
	mi.scale = scl
	v.add_child(mi)
	return mi


static func make(id: String, magnet_number := 0) -> Item:
	var it := Item.new()
	it.item_id = id
	it.display_name = NAMES.get(id, id)
	var v := Node3D.new()
	v.name = "Visual"
	it.add_child(v)
	it.visual = v
	var shape: Shape3D
	var mass := 1.0
	var wood := m(Color("8a5a32"), 0.7)
	var steel := m(Color("9aa0a6"), 0.3, 0.9)
	var dark := m(Color("222326"), 0.5)
	match id:
		"bell":
			var brass := m(Color("d4a43a"), 0.25, 1.0)
			_cyl(v, Vector3(0, 0.06, 0), 0.09, 0.12, brass, Vector3.ZERO, 0.05)
			_sph(v, Vector3(0, 0.12, 0), 0.05, brass)
			_cyl(v, Vector3(0, 0.19, 0), 0.012, 0.08, wood)
			_sph(v, Vector3(0, 0.0, 0), 0.025, brass)
			shape = _cyl_shape(0.09, 0.24)
			mass = 0.8
			it.view_scale = 1.3
		"shovel":
			_cyl(v, Vector3(0, 0, 0), 0.02, 1.0, wood, Vector3(0, 0, PI / 2))
			_box(v, Vector3(0.6, 0, 0), Vector3(0.24, 0.02, 0.2), steel)
			_box(v, Vector3(-0.52, 0, 0), Vector3(0.05, 0.03, 0.14), dark)
			shape = _box_shape(Vector3(1.3, 0.06, 0.22))
			mass = 2.0
			it.view_scale = 0.55
			it.view_rot = Vector3(0, PI / 2 + 0.3, 0.4)
		"teacher":
			_build_mannequin(v, true)
			shape = _box_shape(Vector3(0.5, 1.6, 0.3))
			mass = 8.0
			it.large = true
			it.view_scale = 0.55
			it.view_offset = Vector3(0, -0.35, 0)
		"toy_rifle":
			var red := m(Color("c43a2c"), 0.4)
			_box(v, Vector3(0, 0, 0), Vector3(0.75, 0.05, 0.05), m(Color("6b4a2a"), 0.5))
			_cyl(v, Vector3(0.45, 0.02, 0), 0.022, 0.5, steel, Vector3(0, 0, PI / 2))
			_box(v, Vector3(-0.35, -0.05, 0), Vector3(0.22, 0.14, 0.05), red)
			_box(v, Vector3(-0.05, -0.07, 0), Vector3(0.05, 0.1, 0.04), red)
			_sph(v, Vector3(0.71, 0.02, 0), 0.025, m(Color("f1e3b0"), 0.8))
			shape = _box_shape(Vector3(1.0, 0.18, 0.07))
			mass = 1.2
			it.view_scale = 0.6
			it.view_rot = Vector3(0, PI / 2, 0)
			it.view_offset = Vector3(0, 0, 0)
		"silver_key", "copper_key":
			var km := m(Color("cfd3d8"), 0.2, 1.0) if id == "silver_key" else m(Color("c46d38"), 0.3, 1.0)
			if id == "copper_key":
				# Heart shaped bow
				_sph(v, Vector3(-0.045, 0.02, -0.025), 0.028, km)
				_sph(v, Vector3(-0.045, 0.02, 0.025), 0.028, km)
				_box(v, Vector3(-0.07, 0.02, 0), Vector3(0.04, 0.025, 0.045), km, Vector3(0, PI / 4, 0))
			else:
				_cyl(v, Vector3(-0.05, 0.02, 0), 0.035, 0.015, km)
			_box(v, Vector3(0.04, 0.02, 0), Vector3(0.12, 0.015, 0.018), km)
			_box(v, Vector3(0.085, 0.02, 0.018), Vector3(0.025, 0.015, 0.025), km)
			shape = _box_shape(Vector3(0.2, 0.04, 0.08))
			mass = 0.1
			it.view_scale = 2.0
			it.view_rot = Vector3(0.8, 0.6, 0)
		"lockpick":
			_box(v, Vector3(0, 0.01, 0), Vector3(0.16, 0.012, 0.012), steel)
			_box(v, Vector3(0.0, 0.01, 0.03), Vector3(0.14, 0.012, 0.012), steel, Vector3(0, 0.2, 0))
			_box(v, Vector3(-0.09, 0.012, 0.015), Vector3(0.05, 0.02, 0.05), m(Color("2c2c2c"), 0.6))
			shape = _box_shape(Vector3(0.2, 0.04, 0.08))
			mass = 0.1
			it.view_scale = 2.2
			it.view_rot = Vector3(0.6, 0.8, 0)
		"hammer":
			_cyl(v, Vector3(0, 0, 0), 0.018, 0.36, wood, Vector3(0, 0, PI / 2))
			_box(v, Vector3(0.18, 0, 0), Vector3(0.05, 0.05, 0.16), steel)
			shape = _box_shape(Vector3(0.42, 0.06, 0.17))
			mass = 0.9
			it.view_scale = 1.1
			it.view_rot = Vector3(0, PI / 2, 0.3)
		"crowbar":
			var cr := m(Color("b9312a"), 0.4, 0.6)
			_cyl(v, Vector3(0, 0, 0), 0.016, 0.8, cr, Vector3(0, 0, PI / 2))
			_box(v, Vector3(0.42, 0.04, 0), Vector3(0.03, 0.1, 0.03), cr, Vector3(0, 0, 0.5))
			_box(v, Vector3(-0.41, -0.02, 0), Vector3(0.07, 0.02, 0.03), cr, Vector3(0, 0, -0.3))
			shape = _box_shape(Vector3(0.9, 0.12, 0.05))
			mass = 1.5
			it.view_scale = 0.7
			it.view_rot = Vector3(0, PI / 2, 0.5)
		"apple":
			_sph(v, Vector3(0, 0.045, 0), 0.045, m(Color("c3261f"), 0.35))
			_cyl(v, Vector3(0, 0.1, 0), 0.004, 0.03, m(Color("4a2f1a")))
			shape = _sphere_shape(0.045)
			mass = 0.2
			it.view_scale = 1.6
		"banana":
			var y := m(Color("e7c63a"), 0.6)
			for i in 3:
				var a := i * 2.1
				_box(v, Vector3(cos(a) * 0.04, 0.01, sin(a) * 0.04), Vector3(0.1, 0.012, 0.03), y, Vector3(0, -a, 0))
			_cyl(v, Vector3(0, 0.02, 0), 0.012, 0.04, m(Color("5d4a22")))
			shape = _box_shape(Vector3(0.2, 0.03, 0.2))
			mass = 0.1
			it.view_scale = 1.6
		"milk":
			_box(v, Vector3(0, 0.1, 0), Vector3(0.08, 0.2, 0.08), m(Color("f2f1ec"), 0.6))
			_box(v, Vector3(0, 0.1, 0.041), Vector3(0.07, 0.08, 0.002), m(Color("3d6ab5"), 0.6))
			_box(v, Vector3(0, 0.215, 0), Vector3(0.08, 0.03, 0.02), m(Color("f2f1ec"), 0.6))
			shape = _box_shape(Vector3(0.08, 0.23, 0.08))
			mass = 0.4
			it.view_scale = 1.4
		"box":
			_box(v, Vector3.ZERO, Vector3(0.6, 0.5, 0.6), m(Color("b88b55"), 0.95))
			_box(v, Vector3(0, 0.251, 0), Vector3(0.62, 0.005, 0.08), m(Color("d9c08e"), 0.5))
			shape = _box_shape(Vector3(0.6, 0.5, 0.6))
			mass = 3.0
			it.large = true
			it.view_scale = 0.75
			it.view_offset = Vector3(0, -0.1, 0)
		"chair":
			var cw := m(Color("7a4b2a"), 0.7)
			_box(v, Vector3(0, 0.0, 0), Vector3(0.45, 0.05, 0.45), cw)
			_box(v, Vector3(0, 0.3, -0.2), Vector3(0.45, 0.6, 0.05), cw)
			for sx: float in [-0.19, 0.19]:
				for sz: float in [-0.19, 0.19]:
					_box(v, Vector3(sx, -0.23, sz), Vector3(0.04, 0.44, 0.04), cw)
			shape = _box_shape(Vector3(0.46, 1.05, 0.46))
			it.center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM
			it.center_of_mass = Vector3(0, -0.1, 0)
			for c in v.get_children():
				c.position.y += 0.07
			mass = 3.0
			it.large = true
			it.view_scale = 0.75
		"remote":
			_box(v, Vector3(0, 0.012, 0), Vector3(0.17, 0.024, 0.05), dark)
			for i in 4:
				_box(v, Vector3(-0.05 + i * 0.03, 0.026, 0), Vector3(0.015, 0.006, 0.015), m(Color("c23b2f")))
			shape = _box_shape(Vector3(0.17, 0.03, 0.05))
			mass = 0.15
			it.view_scale = 1.8
		"hat":
			var hm := m(Color("4b3a2e"), 0.9)
			_cyl(v, Vector3(0, 0.01, 0), 0.17, 0.02, hm)
			_cyl(v, Vector3(0, 0.08, 0), 0.1, 0.13, hm, Vector3.ZERO, 0.09)
			_cyl(v, Vector3(0, 0.035, 0), 0.102, 0.025, m(Color("1d1d1d")))
			shape = _cyl_shape(0.17, 0.15)
			mass = 0.2
			it.view_scale = 1.0
		"flashlight":
			_cyl(v, Vector3(0, 0, 0), 0.025, 0.2, m(Color("2a2a2e"), 0.4), Vector3(0, 0, PI / 2))
			_cyl(v, Vector3(0.12, 0, 0), 0.04, 0.06, m(Color("b9bcc0"), 0.3, 0.8), Vector3(0, 0, PI / 2), 0.028)
			shape = _box_shape(Vector3(0.26, 0.08, 0.08))
			mass = 0.3
			it.view_scale = 1.2
			it.view_rot = Vector3(0, PI / 2, 0)
		"binoculars":
			for s: float in [-0.045, 0.045]:
				_cyl(v, Vector3(0, 0, s), 0.035, 0.14, dark, Vector3(0, 0, PI / 2))
			_box(v, Vector3(0, 0, 0), Vector3(0.06, 0.03, 0.06), dark)
			shape = _box_shape(Vector3(0.15, 0.08, 0.17))
			mass = 0.5
			it.view_scale = 1.4
			it.view_rot = Vector3(0, PI / 2, 0)
		"broom":
			_cyl(v, Vector3(0, 0, 0), 0.018, 1.2, m(Color("c99a5a"), 0.6), Vector3(0, 0, PI / 2))
			_box(v, Vector3(0.66, 0, 0), Vector3(0.14, 0.08, 0.3), m(Color("c9a245"), 1.0))
			shape = _box_shape(Vector3(1.4, 0.1, 0.3))
			mass = 0.8
			it.view_scale = 0.5
			it.view_rot = Vector3(0, PI / 2 + 0.3, 0.6)
		"bucket":
			var bm := m(Color("8f969c"), 0.35, 0.8)
			_cyl(v, Vector3(0, 0.13, 0), 0.14, 0.26, bm, Vector3.ZERO, 0.16)
			B.torus(v, Vector3(0, 0.27, 0), 0.15, 0.17, bm, Vector3(PI / 2, 0, 0))
			shape = _cyl_shape(0.16, 0.27)
			mass = 1.0
			it.view_scale = 0.9
		"watering_can":
			var gm := m(Color("4b8b4e"), 0.4, 0.4)
			_cyl(v, Vector3(0, 0.12, 0), 0.11, 0.24, gm)
			_cyl(v, Vector3(0.17, 0.15, 0), 0.02, 0.28, gm, Vector3(0, 0, -0.9))
			B.torus(v, Vector3(-0.02, 0.26, 0), 0.07, 0.09, gm, Vector3(PI / 2, 0, 0))
			shape = _box_shape(Vector3(0.45, 0.32, 0.22))
			mass = 1.0
			it.view_scale = 0.9
		"radio":
			_box(v, Vector3(0, 0.1, 0), Vector3(0.32, 0.2, 0.12), m(Color("7a4a2b"), 0.5))
			_cyl(v, Vector3(-0.07, 0.1, 0.061), 0.06, 0.01, m(Color("d9c9a5"), 0.8), Vector3(PI / 2, 0, 0))
			_box(v, Vector3(0.09, 0.12, 0.061), Vector3(0.1, 0.06, 0.005), m(Color("e8d8a8"), 0.4))
			_cyl(v, Vector3(0.12, 0.3, -0.03), 0.004, 0.25, steel, Vector3(0, 0, -0.3))
			shape = _box_shape(Vector3(0.32, 0.2, 0.12))
			mass = 1.2
			it.view_scale = 1.0
		"teddy":
			var tb := m(Color("9b6a3c"), 1.0)
			_sph(v, Vector3(0, 0.1, 0), 0.09, tb, Vector3(1, 1.15, 0.9))
			_sph(v, Vector3(0, 0.24, 0), 0.07, tb)
			_sph(v, Vector3(-0.05, 0.3, 0), 0.025, tb)
			_sph(v, Vector3(0.05, 0.3, 0), 0.025, tb)
			_sph(v, Vector3(0, 0.23, 0.06), 0.025, m(Color("d8b48a"), 1.0))
			for s: int in [-1, 1]:
				_sph(v, Vector3(0.08 * s, 0.13, 0.02), 0.035, tb, Vector3(1, 1.5, 1))
				_sph(v, Vector3(0.05 * s, 0.02, 0.04), 0.035, tb)
			shape = _box_shape(Vector3(0.22, 0.36, 0.18))
			mass = 0.4
			it.view_scale = 1.0
		"block":
			var cols := [Color("d9402f"), Color("3a74c9"), Color("e8c43a"), Color("4c9a4a")]
			_box(v, Vector3.ZERO, Vector3(0.1, 0.1, 0.1), m(cols[randi() % cols.size()], 0.5))
			shape = _box_shape(Vector3(0.1, 0.1, 0.1))
			mass = 0.15
			it.view_scale = 1.6
		"cam":
			_build_camera_visual(v)
			shape = _box_shape(Vector3(0.3, 0.55, 0.3))
			mass = 1.5
			it.view_scale = 0.8
		"mug":
			_cyl(v, Vector3(0, 0.05, 0), 0.04, 0.1, m(Color("e9e4d8"), 0.3))
			B.torus(v, Vector3(0.05, 0.05, 0), 0.02, 0.03, m(Color("e9e4d8"), 0.3), Vector3(PI / 2, 0, 0))
			shape = _cyl_shape(0.045, 0.1)
			mass = 0.25
			it.view_scale = 1.6
		"book":
			var bc := [Color("7a2f2a"), Color("2f4f7a"), Color("3f6b3a")]
			_box(v, Vector3(0, 0.02, 0), Vector3(0.16, 0.04, 0.22), m(bc[randi() % 3], 0.7))
			_box(v, Vector3(0.005, 0.02, 0), Vector3(0.152, 0.034, 0.212), m(Color("efe8d6"), 0.9))
			shape = _box_shape(Vector3(0.16, 0.04, 0.22))
			mass = 0.4
			it.view_scale = 1.3
		"plate":
			_cyl(v, Vector3(0, 0.01, 0), 0.11, 0.02, m(Color("f3f1ea"), 0.2), Vector3.ZERO, 0.12)
			shape = _cyl_shape(0.12, 0.02)
			mass = 0.3
			it.view_scale = 1.4
		"toolbox":
			_box(v, Vector3(0, 0.08, 0), Vector3(0.45, 0.16, 0.2), m(Color("b8302a"), 0.4, 0.5))
			_box(v, Vector3(0, 0.2, 0), Vector3(0.25, 0.03, 0.03), dark)
			shape = _box_shape(Vector3(0.45, 0.2, 0.2))
			mass = 3.0
			it.view_scale = 0.8
		"paper_ball":
			_sph(v, Vector3.ZERO, 0.04, m(Color("f2efe4"), 1.0), Vector3(1, 0.85, 0.9))
			shape = _sphere_shape(0.04)
			mass = 0.02
		"jackhammer":
			var jy := m(Color("e0b331"), 0.4, 0.3)
			_cyl(v, Vector3(0, 0.25, 0), 0.08, 0.4, jy)
			_cyl(v, Vector3(0, -0.12, 0), 0.025, 0.36, steel)
			_box(v, Vector3(0, 0.5, 0), Vector3(0.5, 0.05, 0.05), dark)
			_box(v, Vector3(0, 0.43, 0), Vector3(0.12, 0.1, 0.12), dark)
			shape = _box_shape(Vector3(0.5, 0.95, 0.2))
			mass = 6.0
			it.view_scale = 0.6
			it.view_offset = Vector3(0, -0.1, 0)
		_:
			if id.begins_with("magnet_"):
				var col: Color = [Color("d9402f"), Color("3a74c9"), Color("e8a83a"), Color("4c9a4a"), Color("9a4cc9")][magnet_number % 5]
				_box(v, Vector3(0, 0.02, 0), Vector3(0.11, 0.04, 0.13), m(col, 0.4))
				var l := Label3D.new()
				l.text = str(magnet_number)
				l.font_size = 96
				l.pixel_size = 0.0012
				l.position = Vector3(0, 0.041, 0)
				l.rotation = Vector3(-PI / 2, 0, 0)
				l.modulate = Color.WHITE
				l.outline_size = 8
				l.outline_modulate = Color(0, 0, 0, 0.6)
				v.add_child(l)
				shape = _box_shape(Vector3(0.11, 0.04, 0.13))
				mass = 0.15
				it.display_name = "数字マグネット「%d」" % magnet_number
				it.set_meta("number", magnet_number)
				it.view_scale = 1.8
				it.view_rot = Vector3(0.9, 0, 0)
			else:
				_box(v, Vector3.ZERO, Vector3(0.2, 0.2, 0.2), m(Color.MAGENTA))
				shape = _box_shape(Vector3(0.2, 0.2, 0.2))
	var cs := CollisionShape3D.new()
	cs.shape = shape
	it.add_child(cs)
	it.mass = mass
	it.noise_radius = clampf(3.0 + mass * 1.2, 3.0, 9.0)
	var pm := PhysicsMaterial.new()
	pm.friction = 0.8
	pm.bounce = 0.15
	it.physics_material_override = pm
	return it


static func _box_shape(s: Vector3) -> BoxShape3D:
	var sh := BoxShape3D.new()
	sh.size = s
	return sh


static func _cyl_shape(r: float, h: float) -> CylinderShape3D:
	var sh := CylinderShape3D.new()
	sh.radius = r
	sh.height = h
	return sh


static func _sphere_shape(r: float) -> SphereShape3D:
	var sh := SphereShape3D.new()
	sh.radius = r
	return sh


static func _build_mannequin(v: Node3D, teacher := false) -> void:
	var skin := m(Color("e1c39b"), 0.4)
	_sph(v, Vector3(0, 0.66, 0), 0.11, skin, Vector3(0.95, 1.1, 1.0))
	_cyl(v, Vector3(0, 0.53, 0), 0.04, 0.08, skin)
	_sph(v, Vector3(0, 0.25, 0), 0.17, skin, Vector3(1.05, 1.5, 0.75))
	_sph(v, Vector3(0, -0.08, 0), 0.15, skin, Vector3(1.1, 0.8, 0.85))
	for s: int in [-1, 1]:
		_cyl(v, Vector3(0.2 * s, 0.22, 0), 0.04, 0.5, skin, Vector3(0, 0, 0.12 * s))
		_cyl(v, Vector3(0.08 * s, -0.45, 0), 0.055, 0.7, skin)
	if teacher:
		# Teacher: glasses, bun, a long skirt and a pointer stick.
		var hair := m(Color("6b4a2e"), 0.9)
		_sph(v, Vector3(0, 0.73, -0.04), 0.115, hair, Vector3(1, 0.8, 1))
		_sph(v, Vector3(0, 0.76, -0.12), 0.05, hair)
		for s: int in [-1, 1]:
			B.torus(v, Vector3(0.04 * s, 0.67, 0.1), 0.022, 0.03, m(Color("1a1a1a"), 0.3), Vector3(PI / 2, 0, 0))
		_cyl(v, Vector3(0, -0.4, 0), 0.16, 0.7, m(Color("5a3d5c"), 0.9), Vector3.ZERO, 0.21)
		_sph(v, Vector3(0, 0.22, 0.01), 0.175, m(Color("e7d9b9"), 0.9), Vector3(1.06, 1.45, 0.78))
		_cyl(v, Vector3(0.28, 0.1, 0.1), 0.008, 0.6, m(Color("6b4a2a")), Vector3(0.6, 0, 0.2))
	# stand
	_cyl(v, Vector3(0, -0.82, 0), 0.18, 0.03, m(Color("333333"), 0.5))


static func _build_camera_visual(v: Node3D) -> void:
	var grey := m(Color("8d9196"), 0.4, 0.6)
	var white := m(Color("ecebe6"), 0.4)
	var blk := m(Color("18191b"), 0.3)
	for i in 3:
		var a := i * TAU / 3.0
		_cyl(v, Vector3(cos(a) * 0.08, -0.12, sin(a) * 0.08), 0.012, 0.32, grey, Vector3(sin(a) * 0.45, 0, -cos(a) * 0.45))
	_cyl(v, Vector3(0, 0.08, 0), 0.02, 0.14, grey)
	_box(v, Vector3(0, 0.2, 0.0), Vector3(0.12, 0.11, 0.24), white)
	_box(v, Vector3(0, 0.2, 0.0), Vector3(0.122, 0.04, 0.242), blk)
	_cyl(v, Vector3(0, 0.2, 0.15), 0.035, 0.07, blk, Vector3(PI / 2, 0, 0))
	var led := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.012
	sm.height = 0.024
	led.mesh = sm
	led.material_override = Mats.get_mat("red_light")
	led.position = Vector3(0.04, 0.25, 0.12)
	led.name = "LED"
	v.add_child(led)
