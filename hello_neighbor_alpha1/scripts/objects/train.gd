class_name Train
extends Node3D
## The red train that randomly runs along its track circling the house at the
## third-floor level (Alpha 1). It was never meant to be ridden in this build.

const Y := 7.62
var path := PackedVector3Array()
var cum := PackedFloat32Array()
var total := 0.0
var dist := 0.0
var speed := 0.0
var target_speed := 3.2
var wait := 4.0
var run_left := 0.0
var cars: Array[Node3D] = []
var chug: AudioStreamPlayer3D
var whistle_t := 10.0


func build(h: NeighborHouse) -> void:
	_make_path(-2.5, -2.5, 26.5, 20.5, 3.0, 0.5)
	var bt := Batch.new()
	var wood := Mats.get_mat("track_wood")
	var rail := Mats.get_mat("rail")
	var post := Mats.get_mat("wood_post")
	var n := path.size()
	var tie_acc := 0.0
	var post_acc := 2.0
	for i in n:
		var a: Vector3 = path[i]
		var b: Vector3 = path[(i + 1) % n]
		var d := b - a
		var seg_len := d.length()
		var dir := d / seg_len
		var yaw := atan2(-dir.z, dir.x)
		var basis := Basis(Vector3.UP, yaw)
		var mid := (a + b) * 0.5
		bt.add_box(Transform3D(basis, mid + Vector3(0, -0.2, 0)), Vector3(seg_len + 0.06, 0.16, 1.7), wood)
		for s: float in [-0.48, 0.48]:
			var off := basis * Vector3(0, 0, s)
			bt.add_box(Transform3D(basis, mid + off + Vector3(0, 0.02, 0)), Vector3(seg_len + 0.02, 0.07, 0.06), rail)
		tie_acc += seg_len
		while tie_acc >= 0.55:
			tie_acc -= 0.55
			var tp := a + dir * (seg_len - tie_acc)
			bt.add_box(Transform3D(basis, tp + Vector3(0, -0.07, 0)), Vector3(0.18, 0.08, 1.35), wood)
		post_acc += seg_len
		if post_acc >= 4.6:
			var pp := mid
			var skip := (pp.z < 0 and ((pp.x > 7.0 and pp.x < 11.0) or (pp.x > 18.5 and pp.x < 24.5))) or (pp.z > 18 and pp.x > 18.3 and pp.x < 21.0)
			if not skip:
				post_acc = 0.0
				bt.add_box(Transform3D(basis, Vector3(pp.x, (Y - 0.28) * 0.5, pp.z)), Vector3(0.26, Y - 0.28, 0.26), post)
				# diagonal brace
				var br := Basis(Vector3.UP, yaw) * Basis(Vector3.RIGHT, 0.6)
				bt.add_box(Transform3D(br, Vector3(pp.x, Y * 0.6, pp.z)), Vector3(0.12, 3.0, 0.12), post)
				B.collider(self, Vector3(pp.x, (Y - 0.28) * 0.5, pp.z), Vector3(0.26, Y - 0.28, 0.26))
	bt.commit(self)
	# Cars: locomotive + two wagons
	cars.append(_make_loco())
	cars.append(_make_wagon(Mats.get_mat("train_red")))
	cars.append(_make_wagon(Mats.get_mat("car_yellow")))
	chug = Game.loop3d("train", cars[0], -2.0, 45.0)
	_place_cars()


func _make_path(x0: float, z0: float, x1: float, z1: float, r: float, step: float) -> void:
	var pts: Array[Vector3] = []
	var corners := [[Vector2(x1 - r, z0 + r), -PI / 2], [Vector2(x1 - r, z1 - r), 0.0], [Vector2(x0 + r, z1 - r), PI / 2], [Vector2(x0 + r, z0 + r), PI]]
	# Walk around: straight segments + quarter circles.
	var segs := []
	segs.append([Vector2(x0 + r, z0), Vector2(x1 - r, z0)])
	segs.append(corners[0])
	segs.append([Vector2(x1, z0 + r), Vector2(x1, z1 - r)])
	segs.append(corners[1])
	segs.append([Vector2(x1 - r, z1), Vector2(x0 + r, z1)])
	segs.append(corners[2])
	segs.append([Vector2(x0, z1 - r), Vector2(x0, z0 + r)])
	segs.append(corners[3])
	for sg in segs:
		if sg[0] is Vector2 and sg[1] is Vector2:
			var a: Vector2 = sg[0]
			var b: Vector2 = sg[1]
			var cnt: int = maxi(1, int(a.distance_to(b) / step))
			for k in cnt:
				var p := a.lerp(b, float(k) / cnt)
				pts.append(Vector3(p.x, Y, p.y))
		else:
			var c: Vector2 = sg[0]
			var start: float = sg[1]
			var cnt2 := 8
			for k in cnt2:
				var ang := start + (PI / 2) * float(k) / cnt2
				pts.append(Vector3(c.x + cos(ang) * r, Y, c.y + sin(ang) * r))
	path = PackedVector3Array(pts)
	cum.resize(path.size() + 1)
	total = 0.0
	for i in path.size():
		cum[i] = total
		total += path[i].distance_to(path[(i + 1) % path.size()])
	cum[path.size()] = total


func _sample(d: float) -> Array:
	d = fposmod(d, total)
	var lo := 0
	var hi := path.size() - 1
	while lo < hi:
		var mid := (lo + hi + 1) >> 1
		if cum[mid] <= d:
			lo = mid
		else:
			hi = mid - 1
	var a: Vector3 = path[lo]
	var b: Vector3 = path[(lo + 1) % path.size()]
	var seg := cum[lo + 1] - cum[lo]
	var t := (d - cum[lo]) / maxf(seg, 0.0001)
	return [a.lerp(b, t), (b - a).normalized()]


func _make_loco() -> Node3D:
	var r := Node3D.new()
	add_child(r)
	var red := Mats.get_mat("train_red")
	var blk := Mats.get_mat("train_black")
	B.box(r, Vector3(0, 0.25, 0), Vector3(2.6, 0.14, 1.1), blk, false)
	B.cyl(r, Vector3(0.35, 0.72, 0), 0.4, 1.6, red, false, 18).rotation.z = PI / 2
	B.box(r, Vector3(-0.85, 0.85, 0), Vector3(0.9, 1.15, 1.1), red, false)
	B.box(r, Vector3(-0.85, 1.48, 0), Vector3(1.05, 0.1, 1.25), blk, false)
	for s: int in [-1, 1]:
		B.box(r, Vector3(-0.85, 1.0, s * 0.551), Vector3(0.5, 0.4, 0.01), Mats.get_mat("glass_dark"), false)
	B.cyl(r, Vector3(0.85, 1.32, 0), 0.12, 0.45, blk, false, 12, 0.18)
	B.cyl(r, Vector3(0.3, 1.18, 0), 0.13, 0.2, Mats.get_mat("gold"), false, 12)
	B.cyl(r, Vector3(1.16, 0.72, 0), 0.22, 0.05, Mats.get_mat("lamp_on"), false, 12).rotation.z = PI / 2
	B.prism(r, Vector3(1.3, 0.28, 0), Vector3(0.5, 0.3, 1.0), blk, Vector3(0, PI / 2, PI))
	for x: float in [-0.9, -0.2, 0.5, 1.0]:
		for s: int in [-1, 1]:
			B.cyl(r, Vector3(x, 0.2, s * 0.5), 0.2 if x < 0.7 else 0.14, 0.06, red, false, 14).rotation.x = PI / 2
	return r


func _make_wagon(mat: Material) -> Node3D:
	var r := Node3D.new()
	add_child(r)
	var blk := Mats.get_mat("train_black")
	B.box(r, Vector3(0, 0.25, 0), Vector3(2.4, 0.14, 1.1), blk, false)
	B.box(r, Vector3(0, 0.55, 0), Vector3(2.3, 0.5, 1.05), mat, false)
	B.box(r, Vector3(0, 0.55, 0), Vector3(2.1, 0.52, 0.85), blk, false)
	for x: float in [-0.8, 0.8]:
		for s: int in [-1, 1]:
			B.cyl(r, Vector3(x, 0.2, s * 0.5), 0.16, 0.06, mat, false, 14).rotation.x = PI / 2
	return r


func _place_cars() -> void:
	for i in cars.size():
		var s := _sample(dist - i * 2.85)
		var p: Vector3 = s[0]
		var t: Vector3 = s[1]
		cars[i].position = p
		cars[i].rotation.y = atan2(-t.z, t.x)


func _process(delta: float) -> void:
	if wait > 0.0:
		wait -= delta
		speed = move_toward(speed, 0.0, delta * 2.0)
		if wait <= 0.0:
			run_left = randf_range(60.0, 200.0)
			Game.sfx3d("train_whistle", cars[0].global_position, 2.0, 1.0, 70.0)
	else:
		speed = move_toward(speed, target_speed, delta * 0.8)
		run_left -= speed * delta
		if run_left <= 0.0:
			wait = randf_range(8.0, 25.0)
	dist += speed * delta
	_place_cars()
	if chug:
		if speed > 0.2:
			if not chug.playing and chug.stream:
				chug.play()
			chug.pitch_scale = clampf(0.6 + speed / target_speed * 0.5, 0.5, 1.2)
			chug.volume_db = -14.0 + speed / target_speed * 10.0
		elif chug.playing:
			chug.stop()
