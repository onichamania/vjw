class_name NeighborModel
extends Node3D
## Procedural Mr. Peterson (Alpha 1 look): a big man in his fifties with a
## blue argyle sweater vest (darker ridged edges, lighter diamonds, white
## dotted lines) over a pale yellow shirt with rolled sleeves, long dark
## blue-black gloves, dark navy trousers, brown shoes with white laces, a
## thick curled moustache, heavy eyebrows and a reddish rectangular nose.
## Forward is +Z. Animated procedurally (no skeleton).

var body: Node3D
var hips: Node3D
var spine: Node3D
var neck: Node3D
var head: Node3D
var leg_l: Node3D
var leg_r: Node3D
var knee_l: Node3D
var knee_r: Node3D
var sh_l: Node3D
var sh_r: Node3D
var el_l: Node3D
var el_r: Node3D
var hand_r: Node3D
var hand_l: Node3D
var sack: Node3D
var prop_holder: Node3D
var eyes: Array[Node3D] = []

var phase := 0.0
var t := 0.0
var blend_run := 0.0
var look_yaw := 0.0
var pose := "idle"
var pose_time := 0.0


func M(n: String) -> Material:
	return Mats.get_mat(n)


func build() -> void:
	body = Node3D.new()
	add_child(body)
	hips = _pivot(body, Vector3(0, 0.93, 0))
	# --- pelvis / trousers
	B.sphere(hips, Vector3(0, 0.0, 0), 0.2, M("n_pants"), Vector3(1.2, 0.75, 0.95))
	B.torus(hips, Vector3(0, 0.08, 0), 0.215, 0.255, M("n_shoe"), Vector3.ZERO).scale = Vector3(1.05, 1.0, 0.85)
	# --- legs
	leg_l = _pivot(hips, Vector3(-0.12, -0.02, 0))
	leg_r = _pivot(hips, Vector3(0.12, -0.02, 0))
	for leg: Node3D in [leg_l, leg_r]:
		B.capsule(leg, Vector3(0, -0.22, 0), 0.095, 0.5, M("n_pants"))
		var knee := _pivot(leg, Vector3(0, -0.44, 0))
		B.capsule(knee, Vector3(0, -0.21, 0), 0.08, 0.48, M("n_pants"))
		B.capsule(knee, Vector3(0, -0.4, 0.0), 0.085, 0.1, M("n_pants"), Vector3.ZERO, Vector3(1.0, 0.6, 1.0))
		var foot := _pivot(knee, Vector3(0, -0.45, 0))
		B.capsule(foot, Vector3(0, -0.02, 0.07), 0.07, 0.3, M("n_shoe"), Vector3(PI / 2, 0, 0), Vector3(1.1, 1.0, 0.8))
		B.box(foot, Vector3(0, -0.075, 0.07), Vector3(0.13, 0.03, 0.3), M("rubber"), false)
		for i in 3:
			B.box(foot, Vector3(0, 0.035, 0.06 + i * 0.035), Vector3(0.07, 0.008, 0.012), M("n_lace"), false)
		if leg == leg_l:
			knee_l = knee
		else:
			knee_r = knee
	# --- torso
	spine = _pivot(hips, Vector3(0, 0.05, 0))
	# shirt underneath (shows at the bottom and collar)
	B.capsule(spine, Vector3(0, 0.3, -0.005), 0.235, 0.72, M("n_shirt"), Vector3.ZERO, Vector3(1.24, 1.0, 0.82))
	B.capsule(spine, Vector3(0, 0.31, 0.0), 0.24, 0.66, M("n_vest"), Vector3.ZERO, Vector3(1.27, 1.0, 0.86))
	B.torus(spine, Vector3(0, 0.06, 0), 0.215, 0.255, M("n_vest_edge"), Vector3.ZERO).scale = Vector3(1.24, 0.7, 0.84)
	# V-neck: yellow shirt triangle + collar
	var v := B.prism(spine, Vector3(0, 0.55, 0.19), Vector3(0.18, 0.2, 0.04), M("n_shirt"))
	v.rotation = Vector3(-0.15, 0, PI)
	B.box(spine, Vector3(0, 0.61, 0.13), Vector3(0.2, 0.06, 0.1), M("n_shirt"), false)
	for s: int in [-1, 1]:
		B.box(spine, Vector3(s * 0.07, 0.6, 0.16), Vector3(0.09, 0.05, 0.08), M("n_shirt"), false).rotation = Vector3(0.3, s * 0.4, s * 0.5)
	# vest V edges
	for s: int in [-1, 1]:
		B.box(spine, Vector3(s * 0.06, 0.52, 0.205), Vector3(0.025, 0.2, 0.02), M("n_vest_edge"), false).rotation.z = s * 0.45
	# --- neck & head
	neck = _pivot(spine, Vector3(0, 0.62, 0.0))
	B.cyl(neck, Vector3(0, 0.04, 0.0), 0.075, 0.1, M("n_skin"), false, 12)
	head = _pivot(neck, Vector3(0, 0.07, 0.01))
	_build_head(head)
	head.scale = Vector3.ONE * 1.18
	# --- arms
	sh_l = _pivot(spine, Vector3(-0.37, 0.5, 0))
	sh_r = _pivot(spine, Vector3(0.37, 0.5, 0))
	B.sphere(spine, Vector3(-0.33, 0.51, 0), 0.085, M("n_shirt"), Vector3(1.0, 0.9, 1.0))
	B.sphere(spine, Vector3(0.33, 0.51, 0), 0.085, M("n_shirt"), Vector3(1.0, 0.9, 1.0))
	for sh: Node3D in [sh_l, sh_r]:
		B.capsule(sh, Vector3(0, -0.14, 0), 0.072, 0.32, M("n_shirt"))
		var el := _pivot(sh, Vector3(0, -0.29, 0))
		# rolled-up sleeve cuff
		B.torus(el, Vector3(0, 0.02, 0), 0.05, 0.085, M("n_shirt"))
		# long rubber glove up to the elbow
		B.capsule(el, Vector3(0, -0.14, 0), 0.06, 0.3, M("n_glove"))
		var hand := _pivot(el, Vector3(0, -0.3, 0))
		B.sphere(hand, Vector3(0, -0.04, 0.01), 0.065, M("n_glove"), Vector3(0.8, 1.15, 0.6))
		B.capsule(hand, Vector3(0.0, -0.1, 0.02), 0.022, 0.1, M("n_glove"))
		var thumb := B.capsule(hand, Vector3(0.0, -0.03, 0.05), 0.02, 0.08, M("n_glove"))
		thumb.rotation.x = -0.8
		if sh == sh_l:
			el_l = el
			hand_l = hand
		else:
			el_r = el
			hand_r = hand
	prop_holder = Node3D.new()
	prop_holder.position = Vector3(0, -0.12, 0.02)
	hand_r.add_child(prop_holder)


func _pivot(parent: Node3D, pos: Vector3) -> Node3D:
	var p := Node3D.new()
	p.position = pos
	parent.add_child(p)
	return p


func _build_head(hd: Node3D) -> void:
	var skin := M("n_skin")
	# cranium + big rounded chin
	B.sphere(hd, Vector3(0, 0.14, 0), 0.135, skin, Vector3(1.0, 1.12, 1.05))
	B.sphere(hd, Vector3(0, 0.04, 0.045), 0.115, skin, Vector3(1.12, 0.82, 1.0))
	B.sphere(hd, Vector3(0, -0.02, 0.09), 0.06, skin, Vector3(1.3, 0.8, 0.9))
	# ears
	for s: int in [-1, 1]:
		B.sphere(hd, Vector3(s * 0.135, 0.12, -0.005), 0.035, skin, Vector3(0.5, 1.0, 0.8))
	# reddish rectangular nose
	B.box(hd, Vector3(0, 0.105, 0.145), Vector3(0.075, 0.085, 0.07), M("n_nose"), false)
	B.sphere(hd, Vector3(0, 0.085, 0.17), 0.032, M("n_nose"), Vector3(1.15, 0.85, 0.8))
	# eyes
	for s: int in [-1, 1]:
		var e := Node3D.new()
		e.position = Vector3(s * 0.05, 0.16, 0.118)
		hd.add_child(e)
		B.sphere(e, Vector3.ZERO, 0.03, M("n_eye"), Vector3(1.0, 1.0, 0.7))
		B.sphere(e, Vector3(0, 0, 0.018), 0.016, M("n_iris"), Vector3(1.0, 1.0, 0.5))
		B.sphere(e, Vector3(0, 0, 0.024), 0.008, M("n_pupil"), Vector3(1.0, 1.0, 0.5))
		eyes.append(e)
		# thick dark eyebrows (a little angry)
		var br := B.box(hd, Vector3(s * 0.052, 0.205, 0.128), Vector3(0.075, 0.026, 0.03), M("n_brow"), false)
		br.rotation = Vector3(0.2, 0, -s * 0.22)
	# The moustache: thick in the middle, curled up at the sides.
	B.capsule(hd, Vector3(0, 0.055, 0.15), 0.032, 0.17, M("n_mustache"), Vector3(0, 0, PI / 2), Vector3(1.0, 1.0, 0.9))
	for s: int in [-1, 1]:
		B.capsule(hd, Vector3(s * 0.085, 0.06, 0.135), 0.024, 0.08, M("n_mustache"), Vector3(0, -s * 0.5, PI / 2 - s * 0.6))
		B.torus(hd, Vector3(s * 0.118, 0.085, 0.118), 0.008, 0.03, M("n_mustache"), Vector3(0, s * 0.6, PI / 2))
	# mouth
	B.box(hd, Vector3(0, 0.02, 0.155), Vector3(0.06, 0.012, 0.02), M("black"), false)
	# Reddish-brown hair, greying at the sides, cowlick curling up in front.
	B.sphere(hd, Vector3(0, 0.205, -0.02), 0.137, M("n_hair"), Vector3(1.03, 0.72, 1.06))
	for s: int in [-1, 1]:
		B.sphere(hd, Vector3(s * 0.118, 0.14, -0.035), 0.06, M("n_hair_grey"), Vector3(0.55, 1.0, 1.2))
	B.sphere(hd, Vector3(0, 0.15, -0.115), 0.09, M("n_hair_grey"), Vector3(1.2, 0.9, 0.5))
	# cowlick: a wave of hair swept up and curling back over the forehead
	B.capsule(hd, Vector3(0, 0.29, 0.06), 0.032, 0.13, M("n_hair"), Vector3(-0.5, 0, 0))
	B.capsule(hd, Vector3(0, 0.335, 0.085), 0.024, 0.09, M("n_hair"), Vector3(0.9, 0, 0))
	B.sphere(hd, Vector3(0, 0.33, 0.045), 0.022, M("n_hair"))
	# sack used in the carnival nightmare ("his face covered")
	sack = Node3D.new()
	hd.add_child(sack)
	B.sphere(sack, Vector3(0, 0.14, 0.01), 0.17, M("n_sack"), Vector3(1.05, 1.25, 1.1))
	B.cyl(sack, Vector3(0, -0.04, 0.0), 0.12, 0.08, M("n_sack"), false, 12, 0.15)
	B.torus(sack, Vector3(0, -0.02, 0.0), 0.12, 0.14, M("rubber"))
	for s: int in [-1, 1]:
		B.sphere(sack, Vector3(s * 0.055, 0.17, 0.165), 0.022, M("black"), Vector3(1.0, 1.3, 0.4))
	sack.visible = false


func set_sack(on: bool) -> void:
	sack.visible = on


func hold_prop(n: Node3D) -> void:
	for c in prop_holder.get_children():
		c.queue_free()
	if n:
		prop_holder.add_child(n)


## Called every frame. `mode`: idle walk run sit tv lie mop look fridge search
## place grab slip open cheer.  `speed` in m/s for the locomotion modes.
func animate(delta: float, mode: String, speed: float) -> void:
	t += delta
	if mode != pose:
		pose = mode
		pose_time = 0.0
	pose_time += delta
	var walkish := mode in ["walk", "run", "idle", "search", "open"]
	var target_run := 1.0 if mode == "run" else 0.0
	blend_run = move_toward(blend_run, target_run, delta * 3.0)
	# defaults
	var hy := 0.93
	var spine_x := 0.0
	var spine_z := 0.0
	var head_x := 0.0
	var head_y := 0.0
	var ll := 0.0
	var lr := 0.0
	var kl := 0.0
	var kr := 0.0
	var al := Vector3(0, 0, 0.12)
	var ar := Vector3(0, 0, -0.12)
	var el := 0.15
	var er := 0.15
	var body_rot := Vector3.ZERO
	var body_pos := Vector3.ZERO
	if walkish and speed > 0.1:
		var rate := speed * (2.6 if mode == "run" else 2.9)
		phase += delta * rate
		var sw := sin(phase)
		var amp: float = lerpf(0.45, 0.8, blend_run)
		ll = sw * amp
		lr = -sw * amp
		kl = maxf(0.0, -sin(phase - 0.6)) * lerpf(0.6, 1.25, blend_run) + 0.05
		kr = maxf(0.0, sin(phase - 0.6)) * lerpf(0.6, 1.25, blend_run) + 0.05
		hy = 0.93 + abs(cos(phase)) * lerpf(0.035, 0.06, blend_run) - 0.02
		spine_x = lerpf(0.04, 0.22, blend_run)
		spine_z = sin(phase) * 0.04
		# arms: normal swing when walking, reaching forward when chasing
		var swing := sin(phase) * lerpf(0.35, 0.25, blend_run)
		al = Vector3(lerpf(-swing, -1.25 + swing * 0.6, blend_run), 0, 0.12)
		ar = Vector3(lerpf(swing, -1.25 - swing * 0.6, blend_run), 0, -0.12)
		el = lerpf(0.25, 0.15, blend_run)
		er = el
		head_x = lerpf(0.0, -0.15, blend_run)
	else:
		# breathing
		hy = 0.93 + sin(t * 1.7) * 0.004
		spine_x = sin(t * 1.7) * 0.01
	match mode:
		"sit", "tv":
			hy = 0.5
			ll = -1.45
			lr = -1.45
			kl = 1.45
			kr = 1.45
			al = Vector3(-0.5, 0, 0.15)
			ar = Vector3(-0.5, 0, -0.15)
			el = 0.9
			er = 0.9
			spine_x = -0.08
			if mode == "tv" and fmod(t, 9.0) < 1.2:
				spine_x = -0.08 + sin(t * 30.0) * 0.03
		"lie":
			hy = 0.0
			body_rot = Vector3(-PI / 2, 0, 0)
			body_pos = Vector3(0, 0.0, 0)
			al = Vector3(0, 0, 0.25)
			ar = Vector3(0, 0, -0.25)
			kl = 0.1
			kr = 0.1
			if fmod(t, 7.0) < 0.3:
				kr = 0.5
		"mop":
			al = Vector3(-0.9, 0.3, 0.3)
			ar = Vector3(-0.7, -0.3, -0.3)
			el = 0.6
			er = 0.7
			spine_z = sin(t * 2.0) * 0.15
			spine_x = 0.25
			head_x = 0.35
		"look":
			al = Vector3(-1.6, 0.4, 0.35)
			ar = Vector3(-1.6, -0.4, -0.35)
			el = 1.7
			er = 1.7
			head_y = sin(t * 0.5) * 0.25
		"fridge":
			ar = Vector3(-1.2, 0, -0.1)
			er = 0.3
			spine_x = 0.2
			head_x = 0.2
			if pose_time > 2.5:
				ar = Vector3(-2.3, -0.2, -0.3)
				er = 2.0
				head_x = -0.5
		"search":
			head_y = sin(pose_time * 1.6) * 0.9
			head_x = 0.05
			al = Vector3(0.0, 0, 0.35)
			ar = Vector3(0.0, 0, -0.35)
			el = 1.2
			er = 1.2
		"place":
			hy = 0.6
			ll = -1.0
			lr = -0.3
			kl = 1.9
			kr = 1.3
			spine_x = 0.55
			al = Vector3(-1.2, 0, 0.1)
			ar = Vector3(-1.2, 0, -0.1)
			el = 0.3
			er = 0.3
			head_x = 0.4
		"grab":
			al = Vector3(-1.9, -0.25, 0.3)
			ar = Vector3(-1.9, 0.25, -0.3)
			el = 0.25
			er = 0.25
			spine_x = 0.3
			head_x = 0.2
		"spot":
			al = Vector3(-0.6, 0, 0.6)
			ar = Vector3(-0.6, 0, -0.6)
			el = 1.2
			er = 1.2
			spine_x = -0.1
			head_x = -0.1
		"open":
			ar = Vector3(-1.3, 0, -0.1)
			er = 0.2
		"slip":
			var k: float = clampf(pose_time / 0.35, 0.0, 1.0)
			hy = lerpf(0.93, 0.2, k)
			body_rot = Vector3(lerpf(0.0, PI / 2.2, k), 0, 0)
			ll = lerpf(0.0, -1.2, k)
			lr = lerpf(0.0, -0.9, k)
			al = Vector3(lerpf(0.0, -2.6, k), 0, 0.5)
			ar = Vector3(lerpf(0.0, -2.6, k), 0, -0.5)
		"cheer":
			al = Vector3(-2.8, 0, 0.3)
			ar = Vector3(-2.8, 0, -0.3)
			el = 0.3
			er = 0.3
	var f: float = minf(1.0, delta * 12.0)
	hips.position.y = lerpf(hips.position.y, hy, f)
	body.rotation = body.rotation.lerp(body_rot, f)
	body.position = body.position.lerp(body_pos, f)
	spine.rotation.x = lerp_angle(spine.rotation.x, spine_x, f)
	spine.rotation.z = lerp_angle(spine.rotation.z, spine_z, f)
	head.rotation.x = lerp_angle(head.rotation.x, head_x, f)
	head.rotation.y = lerp_angle(head.rotation.y, head_y + look_yaw, f)
	leg_l.rotation.x = lerp_angle(leg_l.rotation.x, ll, f)
	leg_r.rotation.x = lerp_angle(leg_r.rotation.x, lr, f)
	knee_l.rotation.x = lerp_angle(knee_l.rotation.x, kl, f)
	knee_r.rotation.x = lerp_angle(knee_r.rotation.x, kr, f)
	sh_l.rotation = sh_l.rotation.lerp(al, f)
	sh_r.rotation = sh_r.rotation.lerp(ar, f)
	el_l.rotation.x = lerp_angle(el_l.rotation.x, -el, f)
	el_r.rotation.x = lerp_angle(el_r.rotation.x, -er, f)
	# blink
	var blink := fmod(t, 4.3) < 0.12
	for e in eyes:
		e.scale.y = 0.1 if blink else 1.0
