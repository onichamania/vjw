
# ================= 描画 =================
var camera: Camera3D
var env: Environment
var wenv: WorldEnvironment
var sun: DirectionalLight3D
var flash: SpotLight3D
var sky_mat: ShaderMaterial
var SKY_U := {uTop = Color("#3f7fd6"), uHor = Color("#cfe6f5"), uBot = Color("#9ab89a"), uSun = Vector3(0, 1, 0), uSunCol = Color("#fff6d8"), uNight = 0.0, uTime = 0.0, uCloudA = 1.0}
var HEMI := {color = Color("#bcd8f0"), ground = Color("#6f8a4a"), intensity = 1.05}
var AMB := {color = Color.WHITE, intensity = 0.12}
var FOG := {color = Color("#cfe3f2"), near = 45.0, far = 190.0}
var EXPOSURE := 1.05
const ACES_WHITE := 14.26
const ACES_K := (1.0 / 0.6) / 1.8
var grade_mat: ShaderMaterial
var grade_rect: ColorRect
var SKY_SHADER := """shader_type sky;
uniform vec3 uTop : source_color;
uniform vec3 uHor : source_color;
uniform vec3 uBot : source_color;
uniform vec3 uSun = vec3(0.0, 1.0, 0.0);
uniform vec3 uSunCol : source_color;
uniform sampler2D uCloud : source_color, repeat_enable, filter_linear_mipmap;
uniform float uNight = 0.0;
uniform float uTime = 0.0;
uniform float uCloudA = 1.0;
// 半球の光（three.js の HemisphereLight）と、まわりの光（AmbientLight）。まわりからの光の計算にだけ使う
uniform vec3 hemiSky = vec3(0.7);
uniform vec3 hemiGround = vec3(0.4);
uniform vec3 ambCol = vec3(0.05);
float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
void sky(){
	vec3 d = normalize(EYEDIR);
	if (AT_CUBEMAP_PASS) {
		// 方向で決まる光（three.js の半球の光とおなじ形。ぼかされると 2/3 になるので 1.5 倍）
		float t = clamp(d.y * 0.75 + 0.5, 0.0, 1.0);
		COLOR = mix(hemiGround, hemiSky, t) + ambCol;
	} else {
		float y = d.y;
		vec3 c = y > 0.0 ? mix(uHor, uTop, pow(clamp(y, 0.0, 1.0), 0.55)) : mix(uHor, uBot, clamp(-y * 4.0, 0.0, 1.0));
		float sd = max(dot(d, normalize(uSun)), 0.0);
		c += uSunCol * (pow(sd, 900.0) * 6.0 + pow(sd, 12.0) * 0.35 * (1.0 - uNight * 0.7));
		if (y > 0.0) {
			vec2 uv = vec2(atan(d.x, d.z) / 6.2832 + uTime * 0.002, clamp(y * 2.2, 0.0, 1.0));
			vec4 cl = texture(uCloud, uv);
			float a = cl.a * smoothstep(0.0, 0.12, y) * uCloudA;
			c = mix(c, mix(vec3(1.0), uSunCol, 0.25) * (1.0 - uNight * 0.85), a * 0.9);
		}
		if (uNight > 0.0 && y > 0.0) {
			vec3 q = floor(d * 300.0); float s = h(q);
			if (s > 0.997) c += vec3(1.0) * uNight * (s - 0.997) * 300.0 * smoothstep(0.0, 0.2, y);
		}
		COLOR = c;
	}
}
"""
var GRADE_SHADER := """shader_type canvas_item;
uniform sampler2D screen_tex : hint_screen_texture, filter_linear;
uniform float uTint = 0.0;
uniform float uSat = 1.12;
uniform float uVig = 0.9;
uniform float uFlash = 0.0;
uniform float uRed = 0.0;
vec3 to_lin(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }
vec3 to_srgb(vec3 c){ c = max(c, vec3(0.0)); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
void fragment(){
	// three.js 版は明るさの計算の途中（線形）で色をかえているので、ここでも線形にもどしてからかける
	vec3 c = to_lin(texture(screen_tex, SCREEN_UV).rgb);
	float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
	c = mix(vec3(l), c, uSat);
	c *= mix(vec3(1.0), vec3(1.07, 1.03, 0.8), uTint);
	vec2 d = SCREEN_UV - 0.5;
	c *= 1.0 - dot(d, d) * uVig;
	c = mix(c, vec3(l * 1.4, l * 0.2, l * 0.15), uRed);
	c += uFlash;
	COLOR = vec4(to_srgb(c), 1.0);
}
"""
func setup_render() -> void:
	IS_COMPAT = RenderingServer.get_current_rendering_method() == "gl_compatibility"
	camera = Camera3D.new(); camera.fov = CFG.fov; camera.near = 0.05; camera.far = 260; add_child(camera); camera.make_current()
	# ---- 光 ----
	sun = DirectionalLight3D.new(); sun.light_color = Color("#fff0d6"); sun.shadow_enabled = QUAL > 0
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS if not IS_COMPAT else DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 60.0 if not IS_COMPAT else 40.0
	sun.shadow_bias = 0.03; sun.shadow_normal_bias = 1.0; sun.shadow_blur = 1.2
	add_child(sun)
	flash = SpotLight3D.new(); flash.light_color = Color("#fff4d8"); flash.spot_range = 26; flash.spot_angle = rad_to_deg(0.42); flash.spot_angle_attenuation = 1.0; flash.spot_attenuation = 1.2; flash.shadow_enabled = false; li(flash, 0)
	add_child(flash)
	# ---- 空と まわりの光 ----
	sky_mat = ShaderMaterial.new(); var sh := Shader.new(); sh.code = SKY_SHADER; sky_mat.shader = sh
	sky_mat.set_shader_parameter("uCloud", tex("cloud"))
	var sk := Sky.new(); sk.sky_material = sky_mat; sk.radiance_size = Sky.RADIANCE_SIZE_32; sk.process_mode = Sky.PROCESS_MODE_INCREMENTAL
	env = Environment.new(); env.background_mode = Environment.BG_SKY; env.sky = sk
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY; env.ambient_light_sky_contribution = 1.0; env.ambient_light_energy = 1.0
	env.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	# three.js の ACES とそろえる：Godot は白を 1 にそろえる（明るくなる）ので、そろえない値にし、露出の係数も合わせる
	env.tonemap_mode = Environment.TONE_MAPPER_ACES; env.tonemap_white = ACES_WHITE; env.tonemap_exposure = EXPOSURE * ACES_K
	env.fog_enabled = true; env.fog_mode = Environment.FOG_MODE_DEPTH; env.fog_density = 1.0; env.fog_sky_affect = 0.0; env.fog_depth_curve = 1.0; env.fog_sun_scatter = 0.0; env.fog_aerial_perspective = 0.0
	if QUAL >= 2:
		env.glow_enabled = true; env.glow_intensity = 0.22; env.glow_bloom = 0.0; env.glow_hdr_threshold = 0.9; env.glow_hdr_scale = 1.0; env.glow_blend_mode = Environment.GLOW_BLEND_MODE_ADDITIVE; env.glow_strength = 1.0
		for i in 7: env.set_glow_level(i, [0.0, 0.6, 1.0, 0.8, 0.5, 0.0, 0.0][i])
	# Godot ならではの画質（パソコン版の Forward+ だけ）
	if not IS_COMPAT and QUAL >= 2:
		env.ssao_enabled = true; env.ssao_radius = 0.8; env.ssao_intensity = 1.6; env.ssao_power = 1.4
		env.ssil_enabled = QUAL >= 3
	wenv = WorldEnvironment.new(); wenv.environment = env; add_child(wenv)
	get_viewport().msaa_3d = Viewport.MSAA_4X if QUAL >= 2 else Viewport.MSAA_DISABLED
	# ---- 色味（ベータ1の黄色っぽさ）と画面のふち ----
	var gl := CanvasLayer.new(); gl.layer = 1; add_child(gl)
	grade_rect = ColorRect.new(); grade_rect.set_anchors_preset(Control.PRESET_FULL_RECT); grade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	grade_mat = ShaderMaterial.new(); var gs := Shader.new(); gs.code = GRADE_SHADER; grade_mat.shader = gs; grade_rect.material = grade_mat; gl.add_child(grade_rect)
	setup_hand()
# ベータ1の黄色っぽさ：three.js では明るさを圧縮する前にかけているので、ここでは光・空・霧の色にかけておく
const TINT := Color(1.07, 1.03, 0.8)
func tint(c: Color) -> Color: return Color(c.r * TINT.r, c.g * TINT.g, c.b * TINT.b, c.a)
func tint_srgb(c: Color) -> Color: return tint(c.srgb_to_linear()).linear_to_srgb()
func apply_env_uniforms() -> void:
	for k in SKY_U:
		var v = SKY_U[k]
		if v is Color: v = tint_srgb(v)
		sky_mat.set_shader_parameter(k, v)
	# 半球の光の明るさ（three.js の物理的な強さ → Godot は π で割る）
	sky_mat.set_shader_parameter("hemiSky", _lin(HEMI.color) * HEMI.intensity / PI)
	sky_mat.set_shader_parameter("hemiGround", _lin(HEMI.ground) * HEMI.intensity / PI)
	sky_mat.set_shader_parameter("ambCol", _lin(AMB.color) * AMB.intensity / PI)
	# three.js は「奥行き」、Godot は「距離」で霧を計算するので、少し遠くからにする
	env.fog_light_color = FOG.color; env.fog_depth_begin = FOG.near * 1.1; env.fog_depth_end = FOG.far * 1.15
	env.tonemap_exposure = EXPOSURE * ACES_K
func _lin(c: Color) -> Vector3:
	var l := c.srgb_to_linear()
	return Vector3(l.r, l.g, l.b)
# ---- 時間帯 ----
var ENV := {mode = "day", sunDir = Vector3(-0.45, 0.64, -0.62).normalized()}
var SHAKE := 0.0
var SUN_I := 2.6
func sun_set(col: String, i: float) -> void:
	sun.light_color = tint_srgb(Color(col)); SUN_I = i; sun.light_energy = i / PI
func setEnv(mode: String) -> void:
	ENV.mode = mode
	if mode == "day":
		sun_set("#ffe6bc", 2.9); ENV.sunDir = Vector3(-0.45, 0.64, -0.62).normalized(); HEMI.color = Color("#c4d8ec"); HEMI.ground = Color("#9a8a72"); HEMI.intensity = 1.0; AMB.intensity = 0.16
		SKY_U.uTop = Color("#3f7fd6"); SKY_U.uHor = Color("#d4e8f4"); SKY_U.uBot = Color("#9ab89a"); SKY_U.uSunCol = Color("#fff6d8"); SKY_U.uNight = 0.0; SKY_U.uCloudA = 1.0; FOG.color = Color("#d0e4f2"); FOG.near = 45.0; FOG.far = 190.0; EXPOSURE = 1.05
	elif mode == "dusk":
		sun_set("#ff9a58", 1.6); ENV.sunDir = Vector3(0.25, 0.22, -0.94).normalized(); HEMI.color = Color("#7a78a8"); HEMI.ground = Color("#3a2c28"); HEMI.intensity = 0.55; AMB.intensity = 0.08
		SKY_U.uTop = Color("#2a3a78"); SKY_U.uHor = Color("#f0a070"); SKY_U.uBot = Color("#3a2a30"); SKY_U.uSunCol = Color("#ffb070"); SKY_U.uNight = 0.2; SKY_U.uCloudA = 0.6; FOG.color = Color("#b88878"); FOG.near = 40.0; FOG.far = 170.0; EXPOSURE = 1.1
	elif mode == "evening":
		sun_set("#ffb070", 1.8); ENV.sunDir = Vector3(-0.7, 0.3, -0.62).normalized(); HEMI.color = Color("#b0a8c8"); HEMI.ground = Color("#7a6450"); HEMI.intensity = 0.8; AMB.intensity = 0.12
		SKY_U.uTop = Color("#3a5aa0"); SKY_U.uHor = Color("#f4c090"); SKY_U.uBot = Color("#6a6050"); SKY_U.uSunCol = Color("#ffc080"); SKY_U.uNight = 0.05; SKY_U.uCloudA = 0.8; FOG.color = Color("#e0b89a"); FOG.near = 40.0; FOG.far = 180.0; EXPOSURE = 1.08
	elif mode == "night":
		sun_set("#8aa4ff", 0.4); ENV.sunDir = Vector3(0.3, 0.8, -0.5).normalized(); HEMI.color = Color("#304870"); HEMI.ground = Color("#141418"); HEMI.intensity = 0.42; AMB.intensity = 0.06
		SKY_U.uTop = Color("#060a1a"); SKY_U.uHor = Color("#1a2440"); SKY_U.uBot = Color("#0a0a10"); SKY_U.uSunCol = Color("#c0d0ff"); SKY_U.uNight = 1.0; SKY_U.uCloudA = 0.25; FOG.color = Color("#141a2c"); FOG.near = 30.0; FOG.far = 150.0; EXPOSURE = 1.2
	SKY_U.uSun = ENV.sunDir
	var night := mode == "night"
	for L in STREET_LIGHTS: li(L, (14.0 if QUAL > 1 else 9.0) if (night or mode == "evening") and QUAL else 0.0)
	if H1.power: homeLights(true)
	apply_env_uniforms()
	# 太陽の向き（光は太陽から来る）
	sun.basis = Basis.looking_at(-ENV.sunDir, Vector3.UP if absf(ENV.sunDir.y) < 0.99 else Vector3.FORWARD)
# ---- 手（一人称）----
var vview: SubViewport
var vcont: SubViewportContainer
var vCam: Camera3D
var HAND := {g = null, arm = null, item = null, itemType = "", cache = {}}
func setup_hand() -> void:
	vcont = SubViewportContainer.new(); vcont.stretch = true; vcont.set_anchors_preset(Control.PRESET_FULL_RECT); vcont.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var hl := CanvasLayer.new(); hl.layer = 0; add_child(hl); hl.add_child(vcont)
	vview = SubViewport.new(); vview.transparent_bg = true; vview.own_world_3d = true; vview.msaa_3d = Viewport.MSAA_4X if QUAL >= 2 else Viewport.MSAA_DISABLED
	vcont.add_child(vview)
	vCam = Camera3D.new(); vCam.fov = 52; vCam.near = 0.01; vCam.far = 10; vview.add_child(vCam)
	var ve := Environment.new(); ve.background_mode = Environment.BG_CLEAR_COLOR; ve.background_color = Color(0, 0, 0, 0)
	ve.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; ve.ambient_light_color = Color("#fff4e0").lerp(Color("#6a5a4a"), 0.35); ve.ambient_light_energy = 1.5 / PI * 1.2
	ve.tonemap_mode = Environment.TONE_MAPPER_ACES; ve.tonemap_exposure = 1.05
	var vw := WorldEnvironment.new(); vw.environment = ve; vview.add_child(vw)
	var vs := DirectionalLight3D.new(); vs.light_energy = 1.6 / PI; vs.position = Vector3(1, 2, 1.5); vview.add_child(vs); vs.look_at_from_position(Vector3(1, 2, 1.5), Vector3.ZERO)
	HAND.g = Node3D.new(); vview.add_child(HAND.g)
	HAND.g.rotation_order = EULER_ORDER_XYZ
func buildHand() -> void:
	if HAND.arm: HAND.arm.queue_free()
	var g := Node3D.new()
	var skin := StandardMaterial3D.new(); skin.albedo_color = Color(AV.armR); skin.roughness = 0.6
	var sl := StandardMaterial3D.new(); sl.albedo_color = Color(AV.torso); sl.roughness = 0.85
	var sleeve := mesh(G.cylinder(0.055, 0.065, 0.42, 12), sl); sleeve.rotation.x = PI / 2; sleeve.position = Vector3(0, 0, 0.2); g.add_child(sleeve)
	var cuff := mesh(G.cylinder(0.058, 0.058, 0.04, 12), sl); cuff.rotation.x = PI / 2; cuff.position = Vector3(0, 0, -0.01); g.add_child(cuff)
	var palm := mesh(G.box(0.085, 0.035, 0.1), skin); palm.position = Vector3(0, 0, -0.07); g.add_child(palm)
	for i in 4:
		var f := mesh(G.capsule(0.011, 0.045, 3, 6), skin); f.rotation.x = PI / 2 - 0.5; f.position = Vector3(-0.03 + i * 0.02, -0.012, -0.13); g.add_child(f)
	var th := mesh(G.capsule(0.012, 0.04, 3, 6), skin); th.rotation_order = EULER_ORDER_XYZ; th.rotation = Vector3(PI / 2, 0, -0.8); th.position = Vector3(-0.05, 0, -0.07); g.add_child(th)
	HAND.arm = g; HAND.g.add_child(g)
func handItem(pr) -> void:
	var key: String = (pr.type + ("1" if pr.data.get("full") else "")) if pr else ""
	if key == HAND.itemType: return
	HAND.itemType = key
	if HAND.item:
		HAND.item.queue_free(); HAND.item = null
	if not pr: return
	var m := mkModel(pr.d.mk)
	if pr.type == "watering_can" and pr.data.get("full"): addCanWater(m)
	var bx := node_aabb(m); var sz := bx.size; var s := minf(1.4, 0.24 / maxf(maxf(sz.x, sz.y), maxf(sz.z, 0.06)))
	m.scale = Vector3(s, s, s); var hold := Node3D.new(); hold.add_child(m)
	m.position = Vector3(-(bx.position.x + bx.end.x) / 2 * s, -(bx.position.y) * s - 0.02, -(bx.position.z + bx.end.z) / 2 * s)
	hold.position = Vector3(0, 0.02, -0.13); hold.rotation.y = PI / 2 if pr.type == "crowbar" else 0.3; HAND.item = hold; HAND.g.add_child(hold)
func addCanWater(m: Node3D) -> MeshInstance3D:
	var w := mesh(G.cylinder(0.105, 0.105, 0.01, 14), MATS.water); w.position.y = 0.19; m.add_child(w)
	return w
func updCanLook(pr: Dictionary) -> void:
	if pr.type != "watering_can": return
	var has = pr.grp.get_meta("water", null)
	if pr.data.get("full") and not has:
		pr.grp.set_meta("water", addCanWater(pr.grp))
	elif not pr.data.get("full") and has:
		has.queue_free(); pr.grp.set_meta("water", null)
	HAND.itemType = ""
var lastYaw := 0.0
var lastPitch := 0.0
var swayX := 0.0
var swayY := 0.0
func updHand(dt: float) -> void:
	var H = held(); handItem(H); HAND.g.visible = STATE == "play" and not PL.hide and PL.zoom < 0.3
	var bob: float = PL.bob * TAU; var moving: bool = Vector2(PL.v.x, PL.v.z).length() > 0.4 and PL.onGround
	var by := absf(sin(bob)) * 0.012 if moving else sin(GT * 1.6) * 0.003; var bx := cos(bob) * 0.01 if moving else 0.0
	swayX = damp(swayX, clampf(ang_diff(lastYaw, PL.yaw) * 3, -0.08, 0.08), 10, dt); swayY = damp(swayY, clampf((PL.pitch - lastPitch) * 3, -0.06, 0.06), 10, dt); lastYaw = PL.yaw; lastPitch = PL.pitch
	PL.swing = maxf(0, PL.swing - dt); var sw := sin(minf(1, PL.swing / 0.35) * PI); var ch: float = PL.charge if PL.charging else 0.0
	HAND.g.position = Vector3(0.2 + bx + swayX, -0.2 + by - swayY - ch * 0.04 + (0.0 if H else -0.02), -0.32 + ch * 0.08 - sw * 0.1)
	HAND.g.rotation = Vector3(-0.1 + ch * 0.5 - sw * 0.6, -0.25 + swayX, 0.1)
# ---- アイコン（持ち物の絵）----
func makeIcon(pr: Dictionary) -> Texture2D:
	var k := iconKey(pr)
	if ICONS.has(k): return ICONS[k]
	var p := "res://assets/icons/%s.png" % k
	if not ResourceLoader.exists(p): p = "res://assets/icons/%s.png" % pr.type
	ICONS[k] = load(p) if ResourceLoader.exists(p) else null
	return ICONS[k]
# ---- カメラと影 ----
func updCamera(dt: float) -> void:
	if STATE == "play" or STATE == "cut" or STATE == "caught":
		if SHAKE > 0: SHAKE = maxf(0, SHAKE - dt * 1.5)
		if PL.hide:
			camera.position = PL.hide.pos; camera.rotation = Vector3(PL.pitch, PL.yaw + sin(GT * 0.7) * 0.03, 0)
		elif not CUT.cam:
			var p := camPos(); var bob: float = PL.bob * TAU; var moving: bool = Vector2(PL.v.x, PL.v.z).length() > 0.4 and PL.onGround and not PL.climb
			p.y += absf(sin(bob)) * 0.035 if moving else 0.0
			camera.position = p
			camera.rotation = Vector3(PL.pitch, PL.yaw, cos(bob) * 0.004 if moving else 0.0)
			if PL.stuck > 0: camera.rotation.z += sin(GT * 30) * 0.01
	var fov := lerpf(CFG.fov, 14, PL.zoom)
	if absf(camera.fov - fov) > 0.01: camera.fov = fov
	if SHAKE > 0:
		camera.position.x += rr(-1, 1) * SHAKE * 0.06; camera.position.y += rr(-1, 1) * SHAKE * 0.06
	if PL.slip > 0 and STATE == "play": camera.rotation.z += sin(PL.slip * 9) * 0.08 * PL.slip
	SKY_U.uTime = GT; sky_mat.set_shader_parameter("uTime", GT)
	# 懐中電灯
	var H = held(); var on: bool = PL.light and H and H.d.tool == "light" and STATE == "play"
	li(flash, 28.0 if on else 0.0)
	if on:
		flash.position = camera.position; var d := lookDir(); flash.look_at(camera.position + d * 5, Vector3.UP if absf(d.y) < 0.99 else Vector3.FORWARD)
