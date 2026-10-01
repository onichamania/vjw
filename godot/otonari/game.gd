extends Node3D
# ================= おとなりさん（アルファ1風）Godot版 =================
# three.js 版（3dgame/neighbor.html）と同じ作りを GDScript にうつしたもの。
# src/ の部品を tools/build.py でつなげて game.gd にする（部品どうしは同じクラスなので、そのまま呼び合える）。

const DEG := PI / 180.0
# 3dame の設定（横画面・音・画質・感度）とアバターの色
var S3 := {land = false, sound = true, vol = 0.7, quality = "high", sens = 1.0}
var AV := {head = "#f2c9a0", hair = "#3a2b22", torso = "#4f7fd8", hips = "#3b4252", armR = "#f2c9a0", armL = "#f2c9a0", legR = "#3b4252", legL = "#3b4252"}
var ROT := false
# ゲーム内の設定
var CFG := {sens = 1.0, inv = false, fov = 75.0, hints = true}
var QUAL := 2
var IS_WEB := OS.has_feature("web")
var IS_COMPAT := false

# ---- 保存（Webは localStorage、パソコンは user:// のファイル）----
var _store_cfg: ConfigFile = null
func store_get(key: String):
	if IS_WEB:
		var s = JavaScriptBridge.eval("(function(){try{return localStorage.getItem(%s)}catch(e){return null}})()" % JSON.stringify(key), true)
		return s if typeof(s) == TYPE_STRING else null
	if _store_cfg == null:
		_store_cfg = ConfigFile.new(); _store_cfg.load("user://store.cfg")
	return _store_cfg.get_value("s", key) if _store_cfg.has_section_key("s", key) else null
func store_set(key: String, val) -> void:
	if IS_WEB:
		if val == null: JavaScriptBridge.eval("try{localStorage.removeItem(%s)}catch(e){}" % JSON.stringify(key), true)
		else: JavaScriptBridge.eval("try{localStorage.setItem(%s,%s)}catch(e){}" % [JSON.stringify(key), JSON.stringify(val)], true)
		return
	if _store_cfg == null:
		_store_cfg = ConfigFile.new(); _store_cfg.load("user://store.cfg")
	if val == null:
		if _store_cfg.has_section_key("s", key): _store_cfg.erase_section_key("s", key)
	else: _store_cfg.set_value("s", key, val)
	_store_cfg.save("user://store.cfg")
func load_settings() -> void:
	var o = JSON.parse_string(str(store_get("3dame-settings"))) if store_get("3dame-settings") != null else null
	if o is Dictionary:
		for k in S3:
			if o.has(k) and typeof(o[k]) == typeof(S3[k]) or (o.has(k) and S3[k] is float and o[k] is float): S3[k] = o[k]
	var a = JSON.parse_string(str(store_get("idle-game-settings"))) if store_get("idle-game-settings") != null else null
	if a is Dictionary and a.get("colors") is Dictionary:
		for k in a.colors: AV[k] = a.colors[k]
	var c = JSON.parse_string(str(store_get("otonari-cfg"))) if store_get("otonari-cfg") != null else null
	if c is Dictionary:
		for k in CFG:
			if c.has(k) and (typeof(c[k]) == typeof(CFG[k]) or (CFG[k] is float and (c[k] is float or c[k] is int))): CFG[k] = c[k]
	QUAL = 0 if S3.quality == "eco" else 1 if S3.quality == "normal" else 3 if S3.quality == "max" else 2
func save_cfg() -> void:
	store_set("otonari-cfg", JSON.stringify(CFG))
func is_phone() -> bool:
	return DisplayServer.is_touchscreen_available() and min(DisplayServer.screen_get_size().x, DisplayServer.screen_get_size().y) < 1400 and (OS.has_feature("mobile") or OS.has_feature("web_android") or OS.has_feature("web_ios"))

# ---- 小道具 ----
func sat(v: float) -> float: return 0.0 if v < 0.0 else 1.0 if v > 1.0 else v
func smooth(t: float) -> float: return t * t * (3.0 - 2.0 * t)
func hypot(a: float, b: float, c := 0.0) -> float: return sqrt(a * a + b * b + c * c)
func sgn(v: float) -> float: return 1.0 if v > 0.0 else -1.0 if v < 0.0 else 0.0
func ang_diff(a: float, b: float) -> float:
	var d := fmod(b - a, TAU)
	if d > PI: d -= TAU
	if d < -PI: d += TAU
	return d
func damp_ang(a: float, b: float, k: float, dt: float) -> float: return a + ang_diff(a, b) * (1.0 - exp(-k * dt))
func damp(a: float, b: float, k: float, dt: float) -> float: return a + (b - a) * (1.0 - exp(-k * dt))
func V3(x := 0.0, y := 0.0, z := 0.0) -> Vector3: return Vector3(x, y, z)

# JS の mulberry32 と同じ乱数（同じ並びになる）
class Mulberry:
	var a: int
	func _init(seed: int) -> void: a = seed & 0xFFFFFFFF
	static func imul(x: int, y: int) -> int:
		return ((x * (y & 0xFFFF)) + (((x * (y >> 16)) & 0xFFFF) << 16)) & 0xFFFFFFFF
	func next() -> float:
		a = (a + 0x6D2B79F5) & 0xFFFFFFFF
		var t := imul(a ^ (a >> 15), 1 | a)
		t = ((t + imul(t ^ (t >> 7), 61 | t)) & 0xFFFFFFFF) ^ t
		return float((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
var _rnd := Mulberry.new(20170725)
func RND() -> float: return _rnd.next()
func rr(a: float, b: float) -> float: return a + (b - a) * _rnd.next()
func mulberry(seed: int) -> Mulberry: return Mulberry.new(seed)
func mrand() -> float: return randf()   # JS の Math.random()

var GT := 0.0          # ゲームの時間（秒）
var STATE := "load"    # load / title / play / pause / cut / caught / ending

# ================= 素材とテクスチャ =================
var TX := {}       # 名前 -> Texture2D
var MATS := {}     # 名前 -> StandardMaterial3D
var TXINFO := {}
func tex(n: String) -> Texture2D:
	if TX.has(n): return TX[n]
	var p := "res://assets/tex/%s.png" % n
	if not ResourceLoader.exists(p): p = "res://assets/canvas/%s.png" % n
	var t: Texture2D = load(p)
	TX[n] = t
	return t
func std_mat(o: Dictionary) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color.html(o.get("color", "#ffffff"))
	m.roughness = o.get("rough", 1.0)
	m.metallic = o.get("metal", 0.0)
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	if o.get("map"):
		m.albedo_texture = o.map if o.map is Texture2D else tex(o.map)
		if TXINFO.has(str(o.map)) and not TXINFO[str(o.map)].rep: m.texture_repeat = false
	if o.get("emissive"):
		m.emission_enabled = true
		m.emission = Color.html(o.emissive)
		m.emission_energy_multiplier = o.get("ei", 1.0)
		if o.get("emap"):
			m.emission_texture = o.emap if o.emap is Texture2D else tex(o.emap)
			m.emission_operator = BaseMaterial3D.EMISSION_OP_MULTIPLY # three.js は「色×絵」
	if o.get("transparent"):
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.albedo_color.a = o.get("opacity", 1.0)
	if o.get("double"): m.cull_mode = BaseMaterial3D.CULL_DISABLED
	if o.get("back"): m.cull_mode = BaseMaterial3D.CULL_FRONT
	if o.get("basic"): m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	if o.get("nofog"): m.disable_fog = true
	m.set_meta("uv", float(o.get("uv", 1.0)))
	return m
func load_mats() -> void:
	var ti = JSON.parse_string(FileAccess.get_file_as_string("res://assets/tex.json"))
	for k in ti.tex: TXINFO[k] = ti.tex[k]
	var j = JSON.parse_string(FileAccess.get_file_as_string("res://assets/mats.json"))
	for k in j: MATS[k] = std_mat(j[k])
func M(n) -> Material:
	if n is Material: return n
	if not MATS.has(n):
		push_error("no mat " + str(n)); return MATS.white
	return MATS[n]
func muv(m: Material) -> float: return m.get_meta("uv", 1.0)

# ================= 形を作る道具（箱をまとめて1つのメッシュに）=================
# 面の向き： 1:+X 2:-X 4:+Y 8:-Y 16:+Z 32:-Z
# three.js は反時計まわり・Vが上向き。Godot は時計まわり・Vが下向き なので、ここでそろえる。
class MBuf:
	var p := PackedVector3Array()
	var n := PackedVector3Array()
	var u := PackedVector2Array()
	var i := PackedInt32Array()

# 形のデータ（three.js の BufferGeometry のかわり）
class Geo:
	var p := PackedVector3Array()
	var n := PackedVector3Array()
	var u := PackedVector2Array()
	var i := PackedInt32Array()

class MB:
	var bufs := {}
	var extra := []
	var streetLights = null
	func B(mat: Material) -> MBuf:
		var b = bufs.get(mat)
		if b == null:
			b = MBuf.new(); bufs[mat] = b
		return b
	func quad(b: MBuf, v0: Vector3, v1: Vector3, v2: Vector3, v3: Vector3, nn: Vector3, t0: Vector2, t1: Vector2, t2: Vector2, t3: Vector2) -> void:
		var o := b.p.size()
		b.p.append(v0); b.p.append(v1); b.p.append(v2); b.p.append(v3)
		b.n.append(nn); b.n.append(nn); b.n.append(nn); b.n.append(nn)
		b.u.append(Vector2(t0.x, 1.0 - t0.y)); b.u.append(Vector2(t1.x, 1.0 - t1.y)); b.u.append(Vector2(t2.x, 1.0 - t2.y)); b.u.append(Vector2(t3.x, 1.0 - t3.y))
		b.i.append(o); b.i.append(o + 2); b.i.append(o + 1); b.i.append(o); b.i.append(o + 3); b.i.append(o + 2)
	# 世界座標どおりのUV（となりの箱と模様がそろう）
	func box(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, mat: Material, faces := 63, uvS := 0.0, uo := 0.0, vo := 0.0) -> void:
		var b := B(mat)
		var s: float = 1.0 / (uvS if uvS else mat.get_meta("uv", 1.0))
		if faces & 1: quad(b, Vector3(x1, y0, z1), Vector3(x1, y0, z0), Vector3(x1, y1, z0), Vector3(x1, y1, z1), Vector3(1, 0, 0), Vector2(-z1 * s + uo, y0 * s + vo), Vector2(-z0 * s + uo, y0 * s + vo), Vector2(-z0 * s + uo, y1 * s + vo), Vector2(-z1 * s + uo, y1 * s + vo))
		if faces & 2: quad(b, Vector3(x0, y0, z0), Vector3(x0, y0, z1), Vector3(x0, y1, z1), Vector3(x0, y1, z0), Vector3(-1, 0, 0), Vector2(z0 * s + uo, y0 * s + vo), Vector2(z1 * s + uo, y0 * s + vo), Vector2(z1 * s + uo, y1 * s + vo), Vector2(z0 * s + uo, y1 * s + vo))
		if faces & 4: quad(b, Vector3(x0, y1, z1), Vector3(x1, y1, z1), Vector3(x1, y1, z0), Vector3(x0, y1, z0), Vector3(0, 1, 0), Vector2(x0 * s + uo, -z1 * s + vo), Vector2(x1 * s + uo, -z1 * s + vo), Vector2(x1 * s + uo, -z0 * s + vo), Vector2(x0 * s + uo, -z0 * s + vo))
		if faces & 8: quad(b, Vector3(x0, y0, z0), Vector3(x1, y0, z0), Vector3(x1, y0, z1), Vector3(x0, y0, z1), Vector3(0, -1, 0), Vector2(x0 * s + uo, z0 * s + vo), Vector2(x1 * s + uo, z0 * s + vo), Vector2(x1 * s + uo, z1 * s + vo), Vector2(x0 * s + uo, z1 * s + vo))
		if faces & 16: quad(b, Vector3(x0, y0, z1), Vector3(x1, y0, z1), Vector3(x1, y1, z1), Vector3(x0, y1, z1), Vector3(0, 0, 1), Vector2(x0 * s + uo, y0 * s + vo), Vector2(x1 * s + uo, y0 * s + vo), Vector2(x1 * s + uo, y1 * s + vo), Vector2(x0 * s + uo, y1 * s + vo))
		if faces & 32: quad(b, Vector3(x1, y0, z0), Vector3(x0, y0, z0), Vector3(x0, y1, z0), Vector3(x1, y1, z0), Vector3(0, 0, -1), Vector2(-x1 * s + uo, y0 * s + vo), Vector2(-x0 * s + uo, y0 * s + vo), Vector2(-x0 * s + uo, y1 * s + vo), Vector2(-x1 * s + uo, y1 * s + vo))
	# 回した箱（中心・大きさ・回転。回転は YXZ の順）
	func rbox(cx: float, cy: float, cz: float, sx: float, sy: float, sz: float, rx: float, ry: float, rz: float, mat: Material, uvS := 0.0, faces := 63) -> void:
		var b := B(mat)
		var s: float = 1.0 / (uvS if uvS else mat.get_meta("uv", 1.0))
		var tr := Transform3D(Basis.from_euler(Vector3(rx, ry, rz), EULER_ORDER_YXZ), Vector3(cx, cy, cz))
		var x0 := -sx / 2; var y0 := -sy / 2; var z0 := -sz / 2; var x1 := sx / 2; var y1 := sy / 2; var z1 := sz / 2
		var bs := tr.basis
		if faces & 1: quad(b, tr * Vector3(x1, y0, z1), tr * Vector3(x1, y0, z0), tr * Vector3(x1, y1, z0), tr * Vector3(x1, y1, z1), bs * Vector3(1, 0, 0), Vector2(-z1 * s, y0 * s), Vector2(-z0 * s, y0 * s), Vector2(-z0 * s, y1 * s), Vector2(-z1 * s, y1 * s))
		if faces & 2: quad(b, tr * Vector3(x0, y0, z0), tr * Vector3(x0, y0, z1), tr * Vector3(x0, y1, z1), tr * Vector3(x0, y1, z0), bs * Vector3(-1, 0, 0), Vector2(z0 * s, y0 * s), Vector2(z1 * s, y0 * s), Vector2(z1 * s, y1 * s), Vector2(z0 * s, y1 * s))
		if faces & 4: quad(b, tr * Vector3(x0, y1, z1), tr * Vector3(x1, y1, z1), tr * Vector3(x1, y1, z0), tr * Vector3(x0, y1, z0), bs * Vector3(0, 1, 0), Vector2(x0 * s, -z1 * s), Vector2(x1 * s, -z1 * s), Vector2(x1 * s, -z0 * s), Vector2(x0 * s, -z0 * s))
		if faces & 8: quad(b, tr * Vector3(x0, y0, z0), tr * Vector3(x1, y0, z0), tr * Vector3(x1, y0, z1), tr * Vector3(x0, y0, z1), bs * Vector3(0, -1, 0), Vector2(x0 * s, z0 * s), Vector2(x1 * s, z0 * s), Vector2(x1 * s, z1 * s), Vector2(x0 * s, z1 * s))
		if faces & 16: quad(b, tr * Vector3(x0, y0, z1), tr * Vector3(x1, y0, z1), tr * Vector3(x1, y1, z1), tr * Vector3(x0, y1, z1), bs * Vector3(0, 0, 1), Vector2(x0 * s, y0 * s), Vector2(x1 * s, y0 * s), Vector2(x1 * s, y1 * s), Vector2(x0 * s, y1 * s))
		if faces & 32: quad(b, tr * Vector3(x1, y0, z0), tr * Vector3(x0, y0, z0), tr * Vector3(x0, y1, z0), tr * Vector3(x1, y1, z0), bs * Vector3(0, 0, -1), Vector2(-x1 * s, y0 * s), Vector2(-x0 * s, y0 * s), Vector2(-x0 * s, y1 * s), Vector2(-x1 * s, y1 * s))
	# 形を足す（m で動かして）
	func geo(g: Geo, m: Transform3D, mat: Material, us := 1.0, vs := 1.0) -> void:
		var b := B(mat); var o := b.p.size(); var bs := m.basis
		for k in g.p.size():
			b.p.append(m * g.p[k])
			b.n.append((bs * g.n[k]).normalized())
			var t: Vector2 = g.u[k]
			b.u.append(Vector2(t.x * us, 1.0 - t.y * vs))
		var I := g.i
		for k in range(0, I.size(), 3):
			b.i.append(o + I[k]); b.i.append(o + I[k + 2]); b.i.append(o + I[k + 1])
	func cyl(x: float, y: float, z: float, r: float, h: float, mat: Material, seg := 12, rt = null, axis := "y", rot := 0.0) -> void:
		if rt is Dictionary:
			var o: Dictionary = rt; rt = o.get("rt"); axis = o.get("axis", axis); rot = o.get("rot", rot)
		var g := G.cylinder(rt if rt != null else r, r, h, seg)
		var uv: float = mat.get_meta("uv", 1.0)
		var bs := Basis()
		if axis == "x": bs = Basis(Vector3(0, 0, 1), PI / 2)
		elif axis == "z": bs = Basis(Vector3(1, 0, 0), PI / 2)
		if rot: bs = Basis(Vector3(0, 1, 0), rot) * bs
		geo(g, Transform3D(bs, Vector3(x, y, z)), mat, TAU * r / uv, h / uv)
	func sphere(x: float, y: float, z: float, r: float, mat: Material, sx := 1.0, sy := 1.0, sz := 1.0, seg := 10) -> void:
		var g := G.sphere(r, seg, maxi(6, int(seg * 0.7)))
		geo(g, Transform3D(Basis.from_scale(Vector3(sx, sy, sz)), Vector3(x, y, z)), mat, 2.0)
	func build(opt := {}) -> Node3D:
		var grp := Node3D.new()
		for mat in bufs:
			var b: MBuf = bufs[mat]
			if b.i.is_empty(): continue
			var arr := []; arr.resize(Mesh.ARRAY_MAX)
			arr[Mesh.ARRAY_VERTEX] = b.p; arr[Mesh.ARRAY_NORMAL] = b.n; arr[Mesh.ARRAY_TEX_UV] = b.u; arr[Mesh.ARRAY_INDEX] = b.i
			var am := ArrayMesh.new()
			am.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
			am.surface_set_material(0, mat)
			var mi := MeshInstance3D.new(); mi.mesh = am
			var transp: bool = mat is BaseMaterial3D and mat.transparency != BaseMaterial3D.TRANSPARENCY_DISABLED
			mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if (opt.get("shadow", true) != false and not transp) else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			grp.add_child(mi)
		bufs.clear()
		return grp

# ================= three.js と同じ形を作る =================
class G:
	static func cylinder(rt: float, rb: float, h: float, rs := 8, hs := 1, open := false, th0 := 0.0, thl := TAU) -> Geo:
		var g := Geo.new(); var hh := h / 2.0; var slope := (rb - rt) / h
		var grid := []
		for y in hs + 1:
			var row := []; var v := float(y) / hs; var radius := v * (rb - rt) + rt
			for x in rs + 1:
				var u := float(x) / rs; var th := u * thl + th0; var st := sin(th); var ct := cos(th)
				g.p.append(Vector3(radius * st, -v * h + hh, radius * ct)); g.n.append(Vector3(st, slope, ct).normalized()); g.u.append(Vector2(u, 1.0 - v))
				row.append(g.p.size() - 1)
			grid.append(row)
		for x in rs:
			for y in hs:
				var a: int = grid[y][x]; var b: int = grid[y + 1][x]; var c: int = grid[y + 1][x + 1]; var d: int = grid[y][x + 1]
				g.i.append_array([a, b, d, b, c, d])
		if not open:
			for top in [true, false]:
				var radius := rt if top else rb
				if radius <= 0: continue
				var sg := 1.0 if top else -1.0
				var cs := g.p.size()
				for x in rs:
					g.p.append(Vector3(0, hh * sg, 0)); g.n.append(Vector3(0, sg, 0)); g.u.append(Vector2(0.5, 0.5))
				var ce := g.p.size()
				for x in rs + 1:
					var u := float(x) / rs; var th := u * thl + th0; var ct := cos(th); var st := sin(th)
					g.p.append(Vector3(radius * st, hh * sg, radius * ct)); g.n.append(Vector3(0, sg, 0)); g.u.append(Vector2(ct * 0.5 + 0.5, st * 0.5 * sg + 0.5))
				for x in rs:
					var c := cs + x; var i := ce + x
					if top: g.i.append_array([i, i + 1, c])
					else: g.i.append_array([i + 1, i, c])
		return g
	static func sphere(r: float, ws := 32, hs := 16, ph0 := 0.0, phl := TAU, th0 := 0.0, thl := PI) -> Geo:
		var g := Geo.new(); var the := minf(th0 + thl, PI); var grid := []
		for iy in hs + 1:
			var row := []; var v := float(iy) / hs
			var uo := 0.0
			if iy == 0 and th0 == 0: uo = 0.5 / ws
			elif iy == hs and the == PI: uo = -0.5 / ws
			for ix in ws + 1:
				var u := float(ix) / ws
				var p := Vector3(-r * cos(ph0 + u * phl) * sin(th0 + v * thl), r * cos(th0 + v * thl), r * sin(ph0 + u * phl) * sin(th0 + v * thl))
				g.p.append(p); g.n.append(p.normalized() if p.length() > 0 else Vector3.UP); g.u.append(Vector2(u + uo, 1.0 - v))
				row.append(g.p.size() - 1)
			grid.append(row)
		for iy in hs:
			for ix in ws:
				var a: int = grid[iy][ix + 1]; var b: int = grid[iy][ix]; var c: int = grid[iy + 1][ix]; var d: int = grid[iy + 1][ix + 1]
				if iy != 0 or th0 > 0: g.i.append_array([a, b, d])
				if iy != hs - 1 or the < PI: g.i.append_array([b, c, d])
		return g
	static func box(w: float, h: float, d: float) -> Geo:
		var g := Geo.new()
		# three.js の BoxGeometry と同じ並び（+x,-x,+y,-y,+z,-z）
		var F := [[2, 1, 0, -1, -1, d, h, w, 1], [2, 1, 0, 1, -1, d, h, -w, -1], [0, 2, 1, 1, 1, w, d, h, 1], [0, 2, 1, 1, -1, w, d, -h, -1], [0, 1, 2, 1, -1, w, h, d, 1], [0, 1, 2, -1, -1, w, h, -d, -1]]
		for f in F:
			var ui: int = f[0]; var vi: int = f[1]; var wi: int = f[2]; var ud: float = f[3]; var vd: float = f[4]
			var wd: float = f[5]; var ht: float = f[6]; var dp: float = f[7]; var sg: float = f[8]
			var o := g.p.size()
			for iy in 2:
				var y := iy * ht - ht / 2
				for ix in 2:
					var x := ix * wd - wd / 2
					var p := Vector3(); p[ui] = x * ud; p[vi] = y * vd; p[wi] = dp / 2
					var n := Vector3(); n[wi] = 1.0 if dp > 0 else -1.0
					g.p.append(p); g.n.append(n); g.u.append(Vector2(ix, 1 - iy))
			g.i.append_array([o, o + 2, o + 1, o + 2, o + 3, o + 1])
		return g
	static func plane(w: float, h: float) -> Geo:
		var g := Geo.new()
		for iy in 2:
			for ix in 2:
				g.p.append(Vector3(ix * w - w / 2, -(iy * h - h / 2), 0)); g.n.append(Vector3(0, 0, 1)); g.u.append(Vector2(ix, 1 - iy))
		g.i.append_array([0, 2, 1, 2, 3, 1])
		return g
	# アーチ形の板（three.js の Shape + ExtrudeGeometry のかわり）
	# 平らな形を押し出す（three.js の ExtrudeGeometry と同じ向き：形は XY、厚みは +Z）
	static func extrude(pts: PackedVector2Array, depth: float, uvs := 1.0) -> Geo:
		var area := 0.0
		for k in pts.size():
			var a := pts[k]; var b := pts[(k + 1) % pts.size()]
			area += a.x * b.y - b.x * a.y
		if area < 0: pts.reverse()
		var tri := Geometry2D.triangulate_polygon(pts)
		var g := Geo.new()
		for side in [0, 1]:
			var z := depth if side else 0.0
			var o := g.p.size()
			for p in pts:
				g.p.append(Vector3(p.x, p.y, z)); g.n.append(Vector3(0, 0, 1 if side else -1)); g.u.append(p * uvs)
			for k in range(0, tri.size(), 3):
				var A := pts[tri[k]]; var B := pts[tri[k + 1]]; var C := pts[tri[k + 2]]
				var ccw := (B - A).cross(C - A) > 0
				if ccw == (side == 1): g.i.append_array([o + tri[k], o + tri[k + 1], o + tri[k + 2]])
				else: g.i.append_array([o + tri[k], o + tri[k + 2], o + tri[k + 1]])
		var n := pts.size()
		for k in n:
			var a := pts[k]; var b := pts[(k + 1) % n]
			var e := (b - a).normalized(); var nn := Vector3(e.y, -e.x, 0)
			var o := g.p.size(); var L := a.distance_to(b)
			g.p.append_array([Vector3(a.x, a.y, 0), Vector3(b.x, b.y, 0), Vector3(b.x, b.y, depth), Vector3(a.x, a.y, depth)])
			for j in 4: g.n.append(nn)
			g.u.append_array([Vector2(0, 0), Vector2(L * uvs, 0), Vector2(L * uvs, depth * uvs), Vector2(0, depth * uvs)])
			g.i.append_array([o, o + 1, o + 2, o, o + 2, o + 3])
		return g
	# アーチ形の板（ドアの飾り）
	static func arch(w: float, h: float, depth := 0.012) -> Geo:
		var r := w / 2.0
		var pts := PackedVector2Array([Vector2(-w / 2, -h / 2), Vector2(w / 2, -h / 2), Vector2(w / 2, h / 2 - r * 0.55)])
		var curves := [[Vector2(w / 2, h / 2 - r * 0.55), Vector2(w / 2, h / 2 + r * 0.1), Vector2(0, h / 2)], [Vector2(0, h / 2), Vector2(-w / 2, h / 2 + r * 0.1), Vector2(-w / 2, h / 2 - r * 0.55)]]
		for ci in 2:
			var cv: Array = curves[ci]
			var p0: Vector2 = cv[0]; var c: Vector2 = cv[1]; var p1: Vector2 = cv[2]
			for k in range(1, 13):
				if ci == 1 and k == 12: break
				var t := k / 12.0
				pts.append(p0 * (1 - t) * (1 - t) + c * 2 * (1 - t) * t + p1 * t * t)
		return extrude(pts, depth)
	static func circle(r: float, seg := 20) -> Geo:
		var g := Geo.new()
		g.p.append(Vector3()); g.n.append(Vector3(0, 0, 1)); g.u.append(Vector2(0.5, 0.5))
		for k in seg + 1:
			var a := float(k) / seg * TAU
			g.p.append(Vector3(r * cos(a), r * sin(a), 0)); g.n.append(Vector3(0, 0, 1)); g.u.append(Vector2(cos(a) * 0.5 + 0.5, sin(a) * 0.5 + 0.5))
		for k in range(1, seg + 1): g.i.append_array([k, k + 1, 0])
		return g
	# 線にそった管（電線など）。pts を Catmull-Rom でなめらかにつなぐ
	static func tube(pts: Array, segs: int, r: float, radial := 4) -> Geo:
		var g := Geo.new(); var P := []
		for k in segs + 1:
			var t := float(k) / segs * (pts.size() - 1); var i := mini(int(t), pts.size() - 2); var u := t - i
			var p0: Vector3 = pts[maxi(i - 1, 0)]; var p1: Vector3 = pts[i]; var p2: Vector3 = pts[i + 1]; var p3: Vector3 = pts[mini(i + 2, pts.size() - 1)]
			P.append(0.5 * ((2.0 * p1) + (-p0 + p2) * u + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * u * u + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * u * u * u))
		for k in segs + 1:
			var tg: Vector3 = (P[mini(k + 1, segs)] - P[maxi(k - 1, 0)]).normalized()
			var nn := tg.cross(Vector3.UP).normalized(); if nn.length() < 0.5: nn = Vector3.RIGHT
			var bb := tg.cross(nn).normalized()
			for j in radial + 1:
				var a := float(j) / radial * TAU; var d := nn * cos(a) + bb * sin(a)
				g.p.append(P[k] + d * r); g.n.append(d); g.u.append(Vector2(float(k) / segs, float(j) / radial))
		for k in segs:
			for j in radial:
				var a := k * (radial + 1) + j; var b := (k + 1) * (radial + 1) + j
				g.i.append_array([a, b, a + 1, b, b + 1, a + 1])
		return g
	static func capsule(r: float, l: float, cap_seg := 4, rad_seg := 8) -> Geo:
		# 円柱＋半球（向きは Y）
		var g := Geo.new(); var rows := []
		var total := cap_seg * 2 + 1
		for iy in total + 1:
			var row := []
			var y: float; var rr: float; var ny: float
			if iy <= cap_seg:
				var a := PI / 2 * (1.0 - float(iy) / cap_seg)
				y = l / 2 + sin(a) * r; rr = cos(a) * r; ny = sin(a)
			else:
				var a2 := PI / 2 * (float(iy - cap_seg - 1) / cap_seg)
				y = -l / 2 - sin(a2) * r; rr = cos(a2) * r; ny = -sin(a2)
			for ix in rad_seg + 1:
				var th := float(ix) / rad_seg * TAU
				g.p.append(Vector3(rr * sin(th), y, rr * cos(th))); g.n.append(Vector3(sin(th) * sqrt(max(0.0, 1 - ny * ny)), ny, cos(th) * sqrt(max(0.0, 1 - ny * ny))).normalized()); g.u.append(Vector2(float(ix) / rad_seg, 1.0 - float(iy) / total))
				row.append(g.p.size() - 1)
			rows.append(row)
		for iy in total:
			for ix in rad_seg:
				var a: int = rows[iy][ix]; var b: int = rows[iy + 1][ix]; var c: int = rows[iy + 1][ix + 1]; var d: int = rows[iy][ix + 1]
				g.i.append_array([a, b, d, b, c, d])
		return g

# 形 -> Godot の ArrayMesh（ひとつの素材）
func geo_mesh(g: Geo, mat: Material) -> ArrayMesh:
	var arr := []; arr.resize(Mesh.ARRAY_MAX)
	var uv := PackedVector2Array()
	for t in g.u: uv.append(Vector2(t.x, 1.0 - t.y))
	var ii := PackedInt32Array()
	for k in range(0, g.i.size(), 3): ii.append_array([g.i[k], g.i[k + 2], g.i[k + 1]])
	arr[Mesh.ARRAY_VERTEX] = g.p; arr[Mesh.ARRAY_NORMAL] = g.n; arr[Mesh.ARRAY_TEX_UV] = uv; arr[Mesh.ARRAY_INDEX] = ii
	var am := ArrayMesh.new(); am.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	if mat: am.surface_set_material(0, mat)
	return am
# three.js の new THREE.Mesh(geometry, material) のかわり
func mesh(g: Geo, mat, cast := false) -> MeshInstance3D:
	var mi := MeshInstance3D.new(); mi.mesh = geo_mesh(g, M(mat) if mat != null else null)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if cast else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi
func grp() -> Node3D: return Node3D.new()
# 中身のメッシュすべての影の設定
func set_cast(n: Node, on: bool) -> void:
	if n is GeometryInstance3D: n.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if on else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	for c in n.get_children(): set_cast(c, on)
# three.js の Box3().setFromObject のかわり（見た目の大きさ）
func node_aabb(n: Node3D) -> AABB:
	var out := AABB(); var first := true
	var stack := [n]
	while stack:
		var c = stack.pop_back()
		if c is MeshInstance3D and c.mesh:
			var a: AABB = c.global_transform * c.mesh.get_aabb() if c.is_inside_tree() else _local_xf(c, n) * c.mesh.get_aabb()
			if first: out = a; first = false
			else: out = out.merge(a)
		for k in c.get_children(): stack.append(k)
	return out
func _local_xf(c: Node3D, root: Node3D) -> Transform3D:
	var t := Transform3D()
	var x: Node = c
	while x and x != root:
		if x is Node3D: t = x.transform * t
		x = x.get_parent()
	if root: t = root.transform * t
	return t

# ---- 配列の中の「同じ物」をさがす（Dictionary の == は中身くらべなので使わない）----
func idx(a: Array, x) -> int:
	for i in a.size():
		if is_same(a[i], x): return i
	return -1
func has_ref(a: Array, x) -> bool: return idx(a, x) >= 0
func remove_ref(a: Array, x) -> void:
	var i := idx(a, x)
	if i >= 0: a.remove_at(i)

# ---- 光（three.js の PointLight のかわり）----
# three.js の明るさ（カンデラ）を Godot の energy にする係数。Godot は中で π をかけるので 1/π。
var LI_K := 1.0 / PI
func plight(col: String, inten: float, dist: float, decay: float) -> OmniLight3D:
	var L := OmniLight3D.new(); L.light_color = tint_srgb(Color.html(col)); L.omni_range = dist if dist > 0 else 500.0; L.omni_attenuation = decay
	L.shadow_enabled = false; li(L, inten)
	return L
func li(L: Light3D, v: float) -> void:
	L.set_meta("i", v); L.light_energy = v * LI_K; L.visible = v > 0
func lig(L: Light3D) -> float: return L.get_meta("i", 0.0)

# ================= 当たり判定 =================
class Box:
	var x0 := 0.0
	var y0 := 0.0
	var z0 := 0.0
	var x1 := 0.0
	var y1 := 0.0
	var z1 := 0.0
	var s := "wood"
	var tag = null
	var ref = null
	var on := true
	var st := 0
	func _init(a := 0.0, b := 0.0, c := 0.0, d := 0.0, e := 0.0, f := 0.0, ss := "wood") -> void:
		x0 = a; y0 = b; z0 = c; x1 = d; y1 = e; z1 = f; s = ss

var SOL: Array = []                 # 動かない箱
var DYN: Array = []                 # 動く箱（ドア・ガラス・置いた物）
var GRID := {}
const GC := 2.0
var STAMP := 0
func gk(i: int, k: int) -> int: return (i + 2000) * 4000 + (k + 2000)
func add_solid(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, s := "wood", tag = null) -> Box:
	if x0 > x1: var t := x0; x0 = x1; x1 = t
	if y0 > y1: var t := y0; y0 = y1; y1 = t
	if z0 > z1: var t := z0; z0 = z1; z1 = t
	var b := Box.new(x0, y0, z0, x1, y1, z1, s); b.tag = tag
	SOL.append(b)
	for i in range(floori(x0 / GC), floori((x1 - 1e-6) / GC) + 1):
		for k in range(floori(z0 / GC), floori((z1 - 1e-6) / GC) + 1):
			var key := gk(i, k)
			if not GRID.has(key): GRID[key] = []
			GRID[key].append(b)
	return b
func remove_solid(b: Box) -> void:
	var i := SOL.find(b)
	if i >= 0: SOL.remove_at(i)
	for a in GRID.values():
		var j: int = a.find(b)
		if j >= 0: a.remove_at(j)
func dyn_box(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, s := "wood", ref = null) -> Box:
	var b := Box.new(x0, y0, z0, x1, y1, z1, s); b.ref = ref; b.on = true
	DYN.append(b)
	return b
func set_box(b, x0: float, y0: float, z0: float, x1: float, y1: float, z1: float) -> void:
	b.x0 = minf(x0, x1); b.x1 = maxf(x0, x1); b.y0 = minf(y0, y1); b.y1 = maxf(y0, y1); b.z0 = minf(z0, z1); b.z1 = maxf(z0, z1)
# 範囲の中の箱を集める（同じ箱は1回だけ）
func gather(x0: float, z0: float, x1: float, z1: float, dyn := true) -> Array:
	STAMP += 1
	var out := []
	for i in range(floori(x0 / GC), floori(x1 / GC) + 1):
		for k in range(floori(z0 / GC), floori(z1 / GC) + 1):
			var a = GRID.get(gk(i, k))
			if a == null: continue
			for b in a:
				if b.st == STAMP: continue
				b.st = STAMP; out.append(b)
	if dyn:
		for b in DYN:
			if not b.on or b.x1 < x0 or b.x0 > x1 or b.z1 < z0 or b.z0 > z1: continue
			out.append(b)
	return out
# 範囲の中の箱をひとつずつ調べる（fnがtrueを返したら止める）
func each_solid(x0: float, z0: float, x1: float, z1: float, fn: Callable, dyn := true) -> bool:
	for b in gather(x0, z0, x1, z1, dyn):
		if fn.call(b): return true
	return false
func overlap_any(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, ign = null, filt = null) -> bool:
	for b in gather(x0, z0, x1, z1):
		if b == ign: continue
		if ign != null and ign.ref != null and b.ref == ign.ref: continue
		if filt != null and not filt.call(b): continue
		if b.x0 < x1 and b.x1 > x0 and b.y0 < y1 and b.y1 > y0 and b.z0 < z1 and b.z1 > z0: return true
	return false
# 動く体（足元中心 p、半分の幅 hx,hz、高さ h）を1軸ずつ動かす。新しい位置を返し、ぶつかった様子は HIT に入る
var HIT := {x = false, y = false, z = false, ground = null, ceil = false, box = null}
func move_body(p: Vector3, hx: float, h: float, hz: float, dx: float, dy: float, dz: float, ign = null, filt = null) -> Vector3:
	HIT.x = false; HIT.y = false; HIT.z = false; HIT.ceil = false; HIT.ground = null; HIT.box = null
	const E := 1e-4
	# はじめから深くめりこんでいる箱は無視する（閉まった門などで遠くへはじき飛ばされないように）
	const TOL := 0.3
	if dy:
		var oy := p.y; p.y += dy; var best = null
		for b in gather(p.x - hx, p.z - hz, p.x + hx, p.z + hz):
			if b == ign or (filt != null and not filt.call(b)): continue
			if b.x0 < p.x + hx and b.x1 > p.x - hx and b.z0 < p.z + hz and b.z1 > p.z - hz and b.y0 < p.y + h and b.y1 > p.y:
				if dy < 0:
					if b.y1 > oy + TOL: continue
					if best == null or b.y1 > best.y1: best = b
				else:
					if b.y0 < oy + h - TOL: continue
					if best == null or b.y0 < best.y0: best = b
		if best != null:
			HIT.y = true; HIT.box = best
			if dy < 0: p.y = best.y1 + E; HIT.ground = best
			else: p.y = best.y0 - h - E; HIT.ceil = true
	if dx:
		var ox := p.x; p.x += dx; var best = null
		for b in gather(p.x - hx, p.z - hz, p.x + hx, p.z + hz):
			if b == ign or (filt != null and not filt.call(b)): continue
			if b.x0 < p.x + hx and b.x1 > p.x - hx and b.z0 < p.z + hz and b.z1 > p.z - hz and b.y0 < p.y + h and b.y1 > p.y:
				if dx > 0:
					if b.x0 < ox + hx - TOL: continue
					if best == null or b.x0 < best.x0: best = b
				else:
					if b.x1 > ox - hx + TOL: continue
					if best == null or b.x1 > best.x1: best = b
		if best != null:
			HIT.x = true; HIT.box = best
			p.x = best.x0 - hx - E if dx > 0 else best.x1 + hx + E
	if dz:
		var oz := p.z; p.z += dz; var best = null
		for b in gather(p.x - hx, p.z - hz, p.x + hx, p.z + hz):
			if b == ign or (filt != null and not filt.call(b)): continue
			if b.x0 < p.x + hx and b.x1 > p.x - hx and b.z0 < p.z + hz and b.z1 > p.z - hz and b.y0 < p.y + h and b.y1 > p.y:
				if dz > 0:
					if b.z0 < oz + hz - TOL: continue
					if best == null or b.z0 < best.z0: best = b
				else:
					if b.z1 > oz - hz + TOL: continue
					if best == null or b.z1 > best.z1: best = b
		if best != null:
			HIT.z = true; HIT.box = best
			p.z = best.z0 - hz - E if dz > 0 else best.z1 + hz + E
	return p
# 光線と箱（いちばん近い t を返す。RAYBに当たった箱）
var RAYB = null
func ray_box(ox: float, oy: float, oz: float, ix: float, iy: float, iz: float, b, maxT: float) -> float:
	var t0 := 0.0; var t1 := maxT
	var a: float = (b.x0 - ox) * ix; var c: float = (b.x1 - ox) * ix
	if a > c: var t := a; a = c; c = t
	if a > t0: t0 = a
	if c < t1: t1 = c
	if t0 > t1: return -1.0
	a = (b.y0 - oy) * iy; c = (b.y1 - oy) * iy
	if a > c: var t := a; a = c; c = t
	if a > t0: t0 = a
	if c < t1: t1 = c
	if t0 > t1: return -1.0
	a = (b.z0 - oz) * iz; c = (b.z1 - oz) * iz
	if a > c: var t := a; a = c; c = t
	if a > t0: t0 = a
	if c < t1: t1 = c
	if t0 > t1: return -1.0
	return t0
func ray_cast(ox: float, oy: float, oz: float, dx: float, dy: float, dz: float, maxT: float, filt = null) -> float:
	RAYB = null
	var best := maxT
	var ix := 1.0 / (dx if dx else 1e-9); var iy := 1.0 / (dy if dy else 1e-9); var iz := 1.0 / (dz if dz else 1e-9)
	STAMP += 1
	for b in DYN:
		if not b.on: continue
		if filt != null and not filt.call(b): continue
		var t := ray_box(ox, oy, oz, ix, iy, iz, b, best)
		if t >= 0 and t < best: best = t; RAYB = b
	# 2次元のDDAでマスをたどる
	var i := floori(ox / GC); var k := floori(oz / GC)
	var si := 1 if dx > 0 else -1; var sk := 1 if dz > 0 else -1
	var tx := (((i + 1) * GC if dx > 0 else i * GC) - ox) / dx if dx else INF
	var tz := (((k + 1) * GC if dz > 0 else k * GC) - oz) / dz if dz else INF
	var ddx := GC / absf(dx) if dx else INF; var ddz := GC / absf(dz) if dz else INF
	var tc := 0.0
	for n in 400:
		var a = GRID.get(gk(i, k))
		if a != null:
			for b in a:
				if b.st == STAMP: continue
				b.st = STAMP
				if filt != null and not filt.call(b): continue
				var t := ray_box(ox, oy, oz, ix, iy, iz, b, best)
				if t >= 0 and t < best: best = t; RAYB = b
		if tc > best: break
		if tx < tz: tc = tx; tx += ddx; i += si
		else: tc = tz; tz += ddz; k += sk
		if tc > best or tc > maxT: break
	return best
func los_clear(a: Vector3, b: Vector3, filt = null) -> bool:
	var d := a.distance_to(b)
	if d < 1e-3: return true
	var v := (b - a) / d
	var t := ray_cast(a.x, a.y, a.z, v.x, v.y, v.z, d, filt)
	return t >= d - 1e-3

# ================= 世界の組み立て =================
var W: MB = null   # 今作っているまとまり
var NOSOLID := false  # true のあいだは当たり判定を作らない
func box(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, mat, o := {}) -> Box:
	if x0 > x1: var t := x0; x0 = x1; x1 = t
	if y0 > y1: var t := y0; y0 = y1; y1 = t
	if z0 > z1: var t := z0; z0 = z1; z1 = t
	var m: Material = M(mat) if mat != null else null
	if m: W.box(x0, y0, z0, x1, y1, z1, m, o.get("f", 63), o.get("uv", 0.0), o.get("uo", 0.0), o.get("vo", 0.0))
	if o.get("solid", true) != false and not NOSOLID: return add_solid(x0, y0, z0, x1, y1, z1, o.get("s", "wood"), o.get("tag"))
	return null
func rbox(cx: float, cy: float, cz: float, sx: float, sy: float, sz: float, rx: float, ry: float, rz: float, mat, o := {}) -> void:
	W.rbox(cx, cy, cz, sx, sy, sz, rx, ry, rz, M(mat), o.get("uv", 0.0), o.get("f", 63))
func cyl(x: float, y: float, z: float, r: float, h: float, mat, seg := 12, o := {}) -> void:
	W.cyl(x, y + h / 2, z, r, h, M(mat), seg, o.get("rt"), o.get("axis", "y"), o.get("rot", 0.0))
	if o.get("solid") and not NOSOLID: add_solid(x - r, y, z - r, x + r, y + h, z + r, o.get("s", "metal"))
# 壁：Xにそって（zの位置、厚みt）。mN は -Z側、mP は +Z側の面の素材。holes=[[a,b,y0,y1],...]
func wallX(x0: float, x1: float, z: float, y0: float, y1: float, t: float, mN, mP, holes := [], o := {}) -> void:
	var hs := holes.duplicate(); hs.sort_custom(func(a, b): return a[0] < b[0])
	var x := x0
	var seg := func(a: float, b: float, ya: float, yb: float) -> void:
		if b - a < 1e-3 or yb - ya < 1e-3: return
		if mN: box(a, ya, z - t / 2, b, yb, z, mN, {solid = false, f = o.get("fN", 1 | 2 | 4 | 8 | 32)})
		if mP: box(a, ya, z, b, yb, z + t / 2, mP, {solid = false, f = o.get("fP", 1 | 2 | 4 | 8 | 16)})
		if o.get("solid", true) != false: add_solid(a, ya, z - t / 2, b, yb, z + t / 2, o.get("s", "wood"))
	for h in hs:
		seg.call(x, h[0], y0, y1); seg.call(h[0], h[1], y0, h[2]); seg.call(h[0], h[1], h[3], y1); x = h[1]
	seg.call(x, x1, y0, y1)
func wallZ(z0: float, z1: float, x: float, y0: float, y1: float, t: float, mN, mP, holes := [], o := {}) -> void:
	var hs := holes.duplicate(); hs.sort_custom(func(a, b): return a[0] < b[0])
	var z := z0
	var seg := func(a: float, b: float, ya: float, yb: float) -> void:
		if b - a < 1e-3 or yb - ya < 1e-3: return
		if mN: box(x - t / 2, ya, a, x, yb, b, mN, {solid = false, f = o.get("fN", 2 | 4 | 8 | 16 | 32)})
		if mP: box(x, ya, a, x + t / 2, yb, b, mP, {solid = false, f = o.get("fP", 1 | 4 | 8 | 16 | 32)})
		if o.get("solid", true) != false: add_solid(x - t / 2, ya, a, x + t / 2, yb, b, o.get("s", "wood"))
	for h in hs:
		seg.call(z, h[0], y0, y1); seg.call(h[0], h[1], y0, h[2]); seg.call(h[0], h[1], h[3], y1); z = h[1]
	seg.call(z, z1, y0, y1)
# 床：上の面の素材と下（天井）の素材
func slab(x0: float, z0: float, x1: float, z1: float, y: float, t: float, mTop, mBot, o := {}) -> void:
	box(x0, y - t / 2, z0, x1, y, z1, mTop, {solid = false, f = 4 | 1 | 2 | 16 | 32})
	if mBot: box(x0, y - t, z0, x1, y - t / 2, z1, mBot, {solid = false, f = 8 | 1 | 2 | 16 | 32})
	if o.get("solid", true) != false: add_solid(x0, y - t, z0, x1, y, z1, o.get("s", "wood"))
# 見えない壁
func invis(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, s := "stone") -> Box:
	return add_solid(x0, y0, z0, x1, y1, z1, s, "inv")

# ================= さわれる物（ドア・引き出し・窓・スイッチ など）=================
var scene: Node3D = null
var ITS := []        # {box, label(item)->{t,k}|null, act(), use(item)->bool, useLabel(item)->str|null, on}
func addIt(o: Dictionary) -> Dictionary:
	o.on = o.get("on", true) != false
	for k in ["label", "act", "use", "useLabel", "door", "ownCol"]:
		if not o.has(k): o[k] = null
	ITS.append(o)
	return o
var NOISES := []     # 物音
func noise(x: float, y: float, z: float, r: float, kind: String) -> void:
	NOISES.append({x = x, y = y, z = z, r = r, kind = kind, t = GT})
	if NOISES.size() > 20: NOISES.pop_front()
# ---- 動く部品の共通 ----
var MOVERS := []     # {t (0..1), tgt, spd, apply(t), done()}
func addMover(m: Dictionary) -> Dictionary:
	m.t = m.get("t", 0.0); m.tgt = m.get("tgt", m.t); m.spd = m.get("spd", 3.0)
	if not m.has("done"): m.done = null
	MOVERS.append(m); m.apply.call(m.t)
	return m
func updMovers(dt: float) -> void:
	for m in MOVERS:
		if m.t == m.tgt: continue
		var d: float = m.tgt - m.t; var s: float = m.spd * dt
		m.t = m.tgt if absf(d) <= s else m.t + sgn(d) * s
		m.apply.call(smooth(m.t))
		if m.t == m.tgt and m.done: m.done.call()
# 看板（1枚の絵）
func signp(x: float, y: float, z: float, w: float, h: float, mat, yaw := 0.0, o := {}) -> MeshInstance3D:
	var m := mesh(G.plane(w, h), M(mat))
	m.position = Vector3(x, y, z); m.rotation.y = yaw
	if o.get("parent"): o.parent.add_child(m)
	else: scene.add_child(m)
	return m
# ---- ドア ----
var DOORS := []
# o: {x,z,y,w,h,axis:'x'|'z',hinge:-1|1,swing:-1|1,mat,lock,name,col,knob}
func mkDoor(o: Dictionary) -> Dictionary:
	var t: float = o.get("t", 0.06); var w: float = o.w; var h: float = o.h; var y: float = o.get("y", 0.0)
	var pivot := Node3D.new(); var leaf := MB.new(); var m := M(o.get("mat", "door"))
	var s: float = -o.hinge # 板がのびる向き（ローカルX）
	leaf.box(minf(0, s * w), 0, -t / 2, maxf(0, s * w), h, t / 2, m, 63, 1)
	# 飾り（パネルとノブ）。アルファ1のドアは上がアーチ形のパネル
	if o.get("arch"):
		var pm := M(o.get("panel", "doorc2")); var pw := w * 0.68; var cx := s * w / 2
		for side in [1, -1]:
			var bs := Basis() if side > 0 else Basis(Vector3.UP, PI)
			leaf.geo(G.arch(pw, h * 0.44), Transform3D(bs, Vector3(cx, h * 0.68, side * (t / 2))), pm, 1, 1)
			leaf.geo(G.box(pw, h * 0.26, 0.014), Transform3D(Basis(), Vector3(cx, h * 0.1 + h * 0.13, side * (t / 2 + 0.007))), pm, 1, 1)
	elif not o.get("plain"):
		var pm := M(o.get("panel", "doorp"))
		for ab in [[0.18, 0.42], [0.55, 0.9]]:
			leaf.box(minf(s * w * 0.15, s * w * 0.85), h * ab[0], -t / 2 - 0.012, maxf(s * w * 0.15, s * w * 0.85), h * ab[1], t / 2 + 0.012, pm, 63, 1)
	var kx := s * (w - 0.09); var km := M(o.get("knob", "brass"))
	if o.get("arch"):
		for side in [1, -1]:
			leaf.box(kx - 0.02, h * 0.45 - 0.07, t / 2 if side > 0 else -t / 2 - 0.012, kx + 0.02, h * 0.45 + 0.07, t / 2 + 0.012 if side > 0 else -t / 2, MATS.black)
			leaf.box(minf(kx, kx - s * 0.12), h * 0.45 - 0.012, t / 2 + 0.012 if side > 0 else -t / 2 - 0.04, maxf(kx, kx - s * 0.12), h * 0.45 + 0.012, t / 2 + 0.04 if side > 0 else -t / 2 - 0.012, MATS.black)
	else:
		leaf.sphere(kx, h * 0.47, t / 2 + 0.035, 0.035, km); leaf.sphere(kx, h * 0.47, -t / 2 - 0.035, 0.035, km)
		leaf.box(kx - 0.015, h * 0.47 - 0.015, -t / 2 - 0.03, kx + 0.015, h * 0.47 + 0.015, t / 2 + 0.03, km)
	pivot.add_child(leaf.build())
	var base := 0.0 if o.axis == "x" else -PI / 2
	var hx: float = o.x + o.hinge * w / 2 if o.axis == "x" else o.x
	var hz: float = o.z if o.axis == "x" else o.z + o.hinge * w / 2
	pivot.position = Vector3(hx, y, hz); pivot.rotation.y = base; scene.add_child(pivot)
	var lsw: float = o.swing if o.axis == "x" else -o.swing
	var d := {o = o, pivot = pivot, base = base, open = 0, lock = o.get("lock"), name = o.get("name", "ドア"), hx = hx, hz = hz, y = y, w = w, h = h, col = null, blockers = [], inside = o.get("inside", 0),
		onToggle = null, onUnlock = null, lockMsg = null, it = null, m = null}
	var cb := func(tt: float) -> void:
		var op := tt > 0.5
		if o.axis == "x":
			if not op: set_box(d.col, o.x - w / 2, y, o.z - 0.05, o.x + w / 2, y + h, o.z + 0.05)
			else: set_box(d.col, hx - 0.07, y, o.z, hx + 0.07, y + h, o.z + o.swing * (w - 0.05))
		else:
			if not op: set_box(d.col, o.x - 0.05, y, o.z - w / 2, o.x + 0.05, y + h, o.z + w / 2)
			else: set_box(d.col, o.x, y, hz - 0.07, o.x + o.swing * (w - 0.05), y + h, hz + 0.07)
		# 当たりの箱（見る用）も合わせる
		var c = d.col; set_box(d.it.box, c.x0, c.y0, c.z0, c.x1, c.y1, c.z1)
	d.col = dyn_box(0, 0, 0, 0, 0, 0, "door", d)
	d.it = addIt({box = Box.new(), door = d,
		label = func(_it): return {t = "閉める" if d.m.tgt > 0.5 else "開ける", k = "E", n = d.name},
		act = func(): toggleDoor(d, "player"),
		use = func(it): return doorUse(d, it), useLabel = func(it): return doorUseLabel(d, it)})
	d.m = addMover({t = 0.0, spd = o.get("spd", 2.6), apply = func(tt: float) -> void:
		pivot.rotation.y = base + tt * (PI / 2) * lsw * o.hinge
		cb.call(tt)})
	DOORS.append(d)
	return d
# 外側から鍵がかかっているドアで、プレイヤーが内側にいるか
func doorInside(d: Dictionary, px: float, pz: float) -> bool:
	var o: Dictionary = d.o
	if not d.inside: return false
	return int(sgn(pz - o.z)) == d.inside if o.axis == "x" else int(sgn(px - o.x)) == d.inside
func doorLockedFor(d: Dictionary, who: String) -> bool:
	if who == "npc": return false
	if not d.lock: return false
	if d.lock == "outside": return not doorInside(d, PL.p.x, PL.p.z)
	return true
func toggleDoor(d: Dictionary, who: String, force := false) -> bool:
	if not force and d.m.tgt < 0.5: # 開けようとしている
		if who == "player":
			for b in d.blockers:
				var r = b.call()
				if r:
					toast(r); sfx("locked"); return false
			if doorLockedFor(d, "player"):
				toast(d.lockMsg if d.lockMsg else lockMsg(d.lock)); sfx("locked"); noise(PL.p.x, PL.p.y, PL.p.z, 4, "rattle"); return false
			if d.lock == "outside":
				d.lock = null; sfx("unlock")
	d.m.tgt = 0.0 if d.m.tgt > 0.5 else 1.0
	sfxDoor(d, d.m.tgt > 0.5)
	# おとなりさんが自分で開けたドアの音は、自分では調べない
	if who != "npc": noise(d.hx, d.y + 1, d.hz, 3.0 if PL.crouch > 0.5 else 6.0, "door")
	if d.onToggle: d.onToggle.call(who)
	return true
func lockMsg(l) -> String:
	if not l: return ""
	if l.begins_with("key:"): return "鍵がかかっている"
	if l == "npc": return "鍵がかかっている。こちらからは開かない"
	if l == "outside": return "鍵がかかっている。中からなら開けられそう"
	return "開かない"
func doorUse(d: Dictionary, it) -> bool:
	if d.lock and d.lock.begins_with("key:") and it.type == d.lock.substr(4):
		d.lock = null; sfx("unlock"); toast("鍵を開けた"); consumeHeld()
		if d.onUnlock: d.onUnlock.call()
		return true
	return false
func doorUseLabel(d: Dictionary, it):
	if d.lock and d.lock.begins_with("key:") and it.type == d.lock.substr(4): return "鍵を開ける"
	return null
# ---- ちょうつがいの小さな扉（戸棚・冷蔵庫など）----
# o: {x,y,z,w,h,axis,hinge,swing,mat,t,col}
func mkLeaf(o: Dictionary) -> Dictionary:
	var t: float = o.get("t", 0.03); var w: float = o.w; var h: float = o.h
	var pivot := Node3D.new(); var mb := MB.new(); var s: float = -o.hinge
	mb.box(minf(0, s * w), 0, -t / 2, maxf(0, s * w), h, t / 2, M(o.mat), 63, o.get("uv", 1.0))
	if o.get("knob", true) != false:
		var kx := s * (w - 0.06); var ky: float = o.get("ky", 0.5)
		mb.box(kx - 0.012, h * ky - 0.05, t / 2, kx + 0.012, h * ky + 0.05, t / 2 + 0.03, M(o.get("km", "chrome")))
	if o.get("deco"): o.deco.call(mb, s, w, h, t)
	pivot.add_child(mb.build())
	var base := 0.0 if o.axis == "x" else -PI / 2
	pivot.position = Vector3(o.x + o.hinge * w / 2 if o.axis == "x" else o.x, o.y, o.z if o.axis == "x" else o.z + o.hinge * w / 2)
	pivot.rotation.y = base; scene.add_child(pivot)
	var lsw: float = o.swing if o.axis == "x" else -o.swing
	var L := {o = o, pivot = pivot, m = null}
	var ang: float = o.get("ang", PI * 0.6)
	L.m = addMover({t = 0.0, spd = o.get("spd", 3.0), apply = func(tt: float) -> void:
		pivot.rotation.y = base + tt * ang * lsw * o.hinge
		if o.get("onT"): o.onT.call(tt)})
	return L
# 開け閉めできる入れ物（戸棚・冷蔵庫）：leaves をまとめて1つの「開ける」
var CABS := []
func mkCabinet(bx, leaves: Array, name: String, o := {}) -> Dictionary:
	var c := {leaves = leaves, open = false, name = name, props = [], o = o, it = null}
	CABS.append(c)
	c.it = addIt({box = bx, label = func(_it): return {t = "閉める" if c.open else "開ける", k = "E", n = name},
		act = func():
			c.open = not c.open
			for L in leaves: L.m.tgt = 1.0 if c.open else 0.0
			sfx(o.get("snd", "cab"), c.open)
			if o.get("onToggle"): o.onToggle.call(c.open)
			noise(bx.x0, bx.y0, bx.z0, 3, "cab")})
	return c
# ---- 引き出し ----
# o: {x,y,z(前面のまん中),w,h,d,dir:[nx,nz] 前の向き,mat}
var DRAWERS := []
func mkDrawer(o: Dictionary) -> Dictionary:
	var g := Node3D.new(); var mb := MB.new(); var d: float = o.get("d", 0.45); var w: float = o.w; var h: float = o.h; var fm := M(o.get("mat", "wood_m"))
	# ローカル：+Z が前
	mb.box(-w / 2, 0, -0.02, w / 2, h, 0, fm, 63, 1); mb.box(-w / 2 + 0.03, 0.02, -d, w / 2 - 0.03, 0.03, -0.02, MATS.wood_d, 63, 1); mb.box(-w / 2 + 0.03, 0.02, -d, -w / 2 + 0.05, h - 0.04, -0.02, MATS.wood_d, 63, 1); mb.box(w / 2 - 0.05, 0.02, -d, w / 2 - 0.03, h - 0.04, -0.02, MATS.wood_d, 63, 1); mb.box(-w / 2 + 0.03, 0.02, -d, w / 2 - 0.03, h - 0.04, -d + 0.02, MATS.wood_d, 63, 1)
	mb.box(-0.06, h / 2 - 0.012, 0, 0.06, h / 2 + 0.012, 0.03, M(o.get("knob", "brass")), 63, 1); g.add_child(mb.build())
	var yaw := atan2(o.dir[0], o.dir[1]); g.rotation.y = yaw; g.position = Vector3(o.x, o.y, o.z); scene.add_child(g)
	var dr := {g = g, o = o, props = [], yaw = yaw, name = o.get("name", "引き出し"), m = null, it = null}
	var bx := func() -> Box:
		var tt: float = dr.m.t if dr.m else 0.0; var ex := tt * d * 0.8
		var cx: float = o.x + o.dir[0] * ex; var cz: float = o.z + o.dir[1] * ex
		var hw := 0.04 if absf(o.dir[0]) > 0.5 else w / 2; var hd := w / 2 if absf(o.dir[0]) > 0.5 else 0.04
		return Box.new(cx - hw, o.y, cz - hd, cx + hw, o.y + h, cz + hd)
	dr.frame = func() -> Transform3D: return g.global_transform
	dr.it = addIt({box = bx.call(), label = func(_it): return {t = "閉める" if dr.m.tgt > 0.5 else "開ける", k = "E", n = dr.name},
		act = func():
			dr.m.tgt = 0.0 if dr.m.tgt > 0.5 else 1.0
			sfx("drawer", dr.m.tgt > 0.5); noise(o.x, o.y, o.z, 3, "drawer")})
	dr.m = addMover({t = 0.0, spd = 3.5, apply = func(tt: float) -> void:
		var ex := tt * d * 0.8
		g.position = Vector3(o.x + o.dir[0] * ex, o.y, o.z + o.dir[1] * ex)
		var b: Box = bx.call(); set_box(dr.it.box, b.x0, b.y0, b.z0, b.x1, b.y1, b.z1)
		for p in dr.props: updAttached(p)})
	DRAWERS.append(dr)
	return dr
# ---- 窓 ----
var WINDOWS := []
# o: {axis,x,z,y0,w,h,frame:'trim',breakable,boarded,entry}
func mkWindow(o: Dictionary) -> Dictionary:
	var t := 0.1; var fw := 0.07; var fm := M(o.get("frame", "trim"))
	var ax: bool = o.axis == "x"; var c: float = o.x if ax else o.z; var p: float = o.z if ax else o.x; var y0: float = o.y0; var y1: float = o.y0 + o.h
	var bx := func(a0: float, b0: float, c0: float, a1: float, b1: float, c1: float, m) -> void:
		if ax: box(a0, b0, c0, a1, b1, c1, m, {solid = false})
		else: box(c0, b0, a0, c1, b1, a1, m, {solid = false})
	# 枠
	bx.call(c - o.w / 2 - fw, y0 - fw, p - t, c + o.w / 2 + fw, y0, p + t, fm); bx.call(c - o.w / 2 - fw, y1, p - t, c + o.w / 2 + fw, y1 + fw, p + t, fm); bx.call(c - o.w / 2 - fw, y0, p - t, c - o.w / 2, y1, p + t, fm); bx.call(c + o.w / 2, y0, p - t, c + o.w / 2 + fw, y1, p + t, fm)
	# 窓台
	bx.call(c - o.w / 2 - fw - 0.05, y0 - fw - 0.04, p - t - 0.08, c + o.w / 2 + fw + 0.05, y0 - fw, p + t + 0.08, fm)
	var wn := {o = o, broken = not not o.get("broken"), boarded = not not o.get("boarded"), glass = null, col = null, boards = null, bars = null, it = null, onBreak = null, breakGlass = null}
	# ガラス（動かせるメッシュ）
	var gm := mesh(G.plane(o.w, o.h), MATS.glass); gm.position = Vector3(c if ax else p, y0 + o.h / 2, p if ax else c)
	if not ax: gm.rotation.y = PI / 2
	scene.add_child(gm); wn.glass = gm
	# 桟
	var bars := Node3D.new()
	var vb := mesh(G.box(0.04 if ax else 0.05, o.h, 0.05 if ax else 0.04), fm); vb.position = gm.position; bars.add_child(vb)
	var hb := mesh(G.box(o.w if ax else 0.05, 0.04, 0.05 if ax else o.w), fm); hb.position = gm.position; bars.add_child(hb)
	scene.add_child(bars); wn.bars = bars
	wn.col = dyn_box(c - o.w / 2, y0, p - 0.04, c + o.w / 2, y1, p + 0.04, "glass", wn) if ax else dyn_box(p - 0.04, y0, c - o.w / 2, p + 0.04, y1, c + o.w / 2, "glass", wn)
	wn.breakGlass = func(pr) -> void:
		if wn.broken or wn.boarded or not o.get("breakable"): return
		setBroken(wn, true); spawnShards(gm.position.x, gm.position.y, gm.position.z, "#bfe4f4", 26); sfxGlass(gm.position, 1)
		noise(gm.position.x, gm.position.y, gm.position.z, 26, "glass")
		if pr: pr.v *= 0.45
		if wn.onBreak: wn.onBreak.call()
	wn.it = addIt({box = Box.new(c - o.w / 2, y0, p - 0.1, c + o.w / 2, y1, p + 0.1) if ax else Box.new(p - 0.1, y0, c - o.w / 2, p + 0.1, y1, c + o.w / 2),
		label = func(_it):
			if wn.boarded: return {t = "板が打ちつけてある", k = "", n = "窓"}
			if not wn.broken: return {t = "物を投げると割れそう", k = "", n = "窓"} if o.get("breakable") else null
			return null,
		act = func():
			if wn.boarded: toast("板はしっかり打ちつけてある。バールでもはがせない"),
		use = func(it):
			if it.type == "crowbar" and wn.boarded:
				toast("板はしっかり打ちつけてある。バールでもはがせない"); return true
			return false,
		useLabel = func(it): return "はがす？" if it.type == "crowbar" and wn.boarded else null})
	setBroken(wn, wn.broken)
	if wn.boarded: boardWindow(wn, true)
	WINDOWS.append(wn)
	return wn
func setBroken(w: Dictionary, b: bool) -> void:
	w.broken = b; w.glass.visible = not b; w.bars.visible = not b; w.col.on = not b or w.boarded; w.col.s = "wood" if w.boarded else "glass"
func boardWindow(w: Dictionary, on: bool) -> void:
	var o: Dictionary = w.o; var ax: bool = o.axis == "x"
	if on and not w.boards:
		var g := Node3D.new(); var c: float = o.x if ax else o.z; var p: float = o.z if ax else o.x
		for i in 3:
			var m := mesh(G.box(o.w + 0.3, 0.16, 0.04), MATS.raw, true)
			m.position = Vector3(c if ax else p + 0.1 * o.get("side", 1), o.y0 + o.h * (0.2 + 0.3 * i), p + 0.1 * o.get("side", 1) if ax else c)
			m.rotation_order = EULER_ORDER_XYZ
			m.rotation = Vector3(0, 0 if ax else PI / 2, (i - 1) * 0.12)
			g.add_child(m)
		scene.add_child(g); w.boards = g
	w.boarded = on
	if w.boards: w.boards.visible = on
	w.col.on = on or not w.broken; w.col.s = "wood" if on else "glass"
# ---- はしご ----
var LADDERS := []
# x0..x1,z0..z1 登れる範囲（はしごの前）、y0..y1、face=[nx,nz] はしごから外への向き
func mkLadder(x: float, z: float, y0: float, y1: float, face: Array, o := {}) -> Dictionary:
	var w := 0.5; var ax := absf(face[1]) > 0.5 # 壁がX方向にそっている
	var mat = o.get("mat", "metal_dark")
	var rail := func(dx: float, dz: float) -> void: box(x + dx - 0.03, y0, z + dz - 0.03, x + dx + 0.03, y1, z + dz + 0.03, mat, {solid = false})
	if ax:
		rail.call(-w / 2, 0); rail.call(w / 2, 0)
		var y := y0 + 0.3
		while y < y1:
			box(x - w / 2, y, z - 0.02, x + w / 2, y + 0.035, z + 0.02, mat, {solid = false}); y += 0.3
	else:
		rail.call(0, -w / 2); rail.call(0, w / 2)
		var y := y0 + 0.3
		while y < y1:
			box(x - 0.02, y, z - w / 2, x + 0.02, y + 0.035, z + w / 2, mat, {solid = false}); y += 0.3
	var L := {x = x, z = z, y0 = y0, y1 = y1, face = face, box = Box.new(
		x - (w / 2 if ax else 0.0) + (0.0 if ax else minf(0, face[0] * 0.6)), y0 - 0.1,
		z - (0.0 if ax else w / 2) + (minf(0, face[1] * 0.6) if ax else 0.0),
		x + (w / 2 if ax else 0.0) + (0.0 if ax else maxf(0, face[0] * 0.6)), y1 + 0.9,
		z + (0.0 if ax else w / 2) + (maxf(0, face[1] * 0.6) if ax else 0.0))}
	LADDERS.append(L)
	return L
# ---- 隠れる場所 ----
var HIDES := []
func mkHide(o: Dictionary) -> Dictionary:
	var h := {pos = o.pos, yaw = o.yaw, box = o.box, cab = o.get("cab"), name = o.get("name", "クローゼット"), out = o.out, under = o.get("under", false), nb = null, it = null}
	h.it = addIt({box = o.box, label = func(_it): return {t = "隠れる", k = "E", n = h.name}, act = func(): enterHide(h)})
	HIDES.append(h)
	return h
# ---- パーティクル ----
var PFX := {}
const PFX_N := 900
func initPFX() -> void:
	for k in ["n", "a"]:
		var sh := Shader.new()
		sh.code = """shader_type spatial;
render_mode unshaded, depth_draw_never, cull_disabled, %s;
varying vec4 vC;
void vertex(){
	vC = COLOR;
	float s = INSTANCE_CUSTOM.x;
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
	VERTEX *= s;
}
void fragment(){
	vec2 d = UV - 0.5; float r = length(d);
	if (r > 0.5) discard;
	ALBEDO = vC.rgb; ALPHA = vC.a * smoothstep(0.5, 0.15, r);
}""" % ("blend_add" if k == "a" else "blend_mix")
		var mat := ShaderMaterial.new(); mat.shader = sh
		var qm := QuadMesh.new(); qm.size = Vector2(1.38, 1.38); qm.material = mat
		var mm := MultiMesh.new(); mm.transform_format = MultiMesh.TRANSFORM_3D; mm.use_colors = true; mm.use_custom_data = true; mm.mesh = qm; mm.instance_count = PFX_N; mm.visible_instance_count = 0
		var mi := MultiMeshInstance3D.new(); mi.multimesh = mm; mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mi.custom_aabb = AABB(Vector3(-500, -500, -500), Vector3(1000, 1000, 1000))
		scene.add_child(mi)
		PFX[k] = {mi = mi, mm = mm, list = []}
func part(kind: String, x: float, y: float, z: float, vx: float, vy: float, vz: float, life: float, size: float, col, alpha := 1.0, grav := 0.0, grow := 0.0) -> void:
	var s = PFX.get(kind)
	if not s or s.list.size() >= PFX_N: return
	var c: Color = Color.html(col) if col is String else col
	s.list.append({x = x, y = y, z = z, vx = vx, vy = vy, vz = vz, life = life, t = 0.0, size = size, c = c, a = alpha, grav = grav, grow = grow, floor = -1e9})
func updPFX(dt: float) -> void:
	for k in ["n", "a"]:
		var s = PFX.get(k)
		if not s: continue
		var L: Array = s.list
		for i in range(L.size() - 1, -1, -1):
			var q = L[i]; q.t += dt
			if q.t >= q.life: L.remove_at(i)
		var n := 0; var mm: MultiMesh = s.mm
		for q in L:
			q.vy -= q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt
			if q.grav and q.y < q.floor:
				q.y = q.floor; q.vy *= -0.3; q.vx *= 0.5; q.vz *= 0.5
			var f: float = q.t / q.life
			mm.set_instance_transform(n, Transform3D(Basis(), Vector3(q.x, q.y, q.z)))
			var c: Color = q.c; c.a = q.a * (1 - f * f)
			mm.set_instance_color(n, c)
			mm.set_instance_custom_data(n, Color(q.size * (1 + q.grow * f), 0, 0, 0))
			n += 1
		mm.visible_instance_count = n
func spawnShards(x: float, y: float, z: float, col, n: int) -> void:
	for i in n:
		var a := RND() * TAU
		part("n", x + rr(-0.3, 0.3), y + rr(-0.3, 0.3), z + rr(-0.3, 0.3), cos(a) * rr(0.5, 3), rr(0, 3), sin(a) * rr(0.5, 3), rr(0.8, 1.6), rr(0.02, 0.05), col, 0.9, 12)
		if PFX.n.list.size(): PFX.n.list[-1].floor = groundAt(x, y, z)
func puff(x: float, y: float, z: float, col, n := 6, sz := 0.25, life := 1.2, up := 0.6) -> void:
	for i in n: part("n", x + rr(-0.1, 0.1), y + rr(-0.1, 0.1), z + rr(-0.1, 0.1), rr(-0.3, 0.3), rr(0.2, up), rr(-0.3, 0.3), rr(life * 0.6, life), sz * rr(0.7, 1.2), col, 0.55, 0, 1.5)
func flame(x: float, y: float, z: float, s := 1.0) -> void:
	part("a", x + rr(-0.08, 0.08) * s, y, z + rr(-0.08, 0.08) * s, rr(-0.2, 0.2), rr(0.8, 1.6) * s, rr(-0.2, 0.2), rr(0.3, 0.6), rr(0.12, 0.22) * s, "#ff9a30" if RND() < 0.5 else "#ff5a10", 0.9, 0, -0.5)
func groundAt(x: float, y: float, z: float) -> float:
	var best := -1.0
	for b in gather(x - 0.05, z - 0.05, x + 0.05, z + 0.05):
		if b.x0 <= x and b.x1 >= x and b.z0 <= z and b.z1 >= z and b.y1 <= y + 0.05 and b.y1 > best: best = b.y1
	return best

# ================= 拾える物 =================
# 形はすべて「底のまん中」が原点
var PDEF := {}
func pdef(type: String, o: Dictionary) -> void:
	o.type = type
	for k in ["solid", "tool", "key", "glass", "bouncy", "digit", "ch", "s"]:
		if not o.has(k): o[k] = null
	PDEF[type] = o
func mkModel(fn: Callable) -> Node3D:
	var mb := MB.new(); fn.call(mb); var g := mb.build({})
	for m in mb.extra: g.add_child(m.duplicate())
	return g
func initPropDefs() -> void:
	var M_ := func(n): return M(n)
	pdef("letter", {name = "手紙", hx = 0.12, h = 0.015, hz = 0.075, w = 0.1, mk = func(b: MB): b.box(-0.12, 0, -0.075, 0.12, 0.012, 0.075, M("cream")); b.box(-0.03, 0.012, -0.02, 0.03, 0.014, 0.02, M("red"))})
	pdef("key_house", {name = "新しい家の鍵", hx = 0.07, h = 0.02, hz = 0.03, w = 0.1, key = true, mk = func(b: MB): b.cyl(-0.045, 0, 0, 0.025, 0.012, M("brass"), 12); b.box(-0.02, 0, -0.007, 0.07, 0.012, 0.007, M("brass")); b.box(0.04, 0, 0.007, 0.05, 0.012, 0.02, M("brass")); b.box(0.058, 0, 0.007, 0.066, 0.012, 0.016, M("brass"))})
	pdef("suitcase", {name = "スーツケース", hx = 0.32, h = 0.24, hz = 0.22, w = 1.4, solid = true, mk = func(b: MB):
		var L: Material = MATS.brown; b.box(-0.31, 0, -0.21, 0.31, 0.12, 0.21, L); b.box(-0.31, 0.12, -0.21, 0.31, 0.23, 0.21, M("car_r")); b.box(-0.315, 0.11, -0.215, 0.315, 0.13, 0.215, M("black"))
		for x in [-0.16, 0.16]: b.box(x - 0.02, 0, -0.215, x + 0.02, 0.235, 0.215, M("cream"))
		b.box(-0.08, 0.1, 0.215, 0.08, 0.14, 0.25, M("black")); b.box(-0.03, 0.235, -0.05, 0.03, 0.26, 0.05, M("brass"))})
	pdef("crowbar", {name = "バール", hx = 0.4, h = 0.06, hz = 0.05, w = 0.9, mk = func(b: MB): b.box(-0.34, 0, -0.014, 0.34, 0.028, 0.014, M("red")); b.rbox(0.37, 0.03, 0, 0.1, 0.028, 0.028, 0, 0, 0.8, M("red")); b.rbox(-0.37, 0.012, -0.015, 0.08, 0.024, 0.028, 0, 0.5, 0, M("black")); b.box(-0.2, 0, -0.016, -0.05, 0.03, 0.016, M("black"))})
	pdef("box", {name = "段ボール箱", hx = 0.28, h = 0.42, hz = 0.24, w = 1.2, solid = true, mk = func(b: MB): b.box(-0.28, 0, -0.24, 0.28, 0.42, 0.24, M("cardboard")); b.box(-0.285, 0.405, -0.05, 0.285, 0.425, 0.05, M("tape")); b.box(-0.29, 0.3, -0.05, -0.28, 0.425, 0.05, M("tape")); b.box(0.28, 0.3, -0.05, 0.29, 0.425, 0.05, M("tape"))})
	pdef("trashcan", {name = "ゴミ箱", hx = 0.28, h = 0.8, hz = 0.28, w = 2, solid = true, mk = func(b: MB): b.cyl(0, 0, 0, 0.25, 0.78, M("corr"), 16, {rt = 0.28}); b.cyl(0, 0.74, 0, 0.29, 0.05, M("metal"), 16); b.box(-0.33, 0.55, -0.03, -0.27, 0.62, 0.03, M("metal")); b.box(0.27, 0.55, -0.03, 0.33, 0.62, 0.03, M("metal"))})
	pdef("lid", {name = "ゴミ箱のフタ", hx = 0.3, h = 0.1, hz = 0.3, w = 0.7, mk = func(b: MB): b.cyl(0, 0, 0, 0.3, 0.04, M("metal"), 18, {rt = 0.27}); b.cyl(0, 0.04, 0, 0.24, 0.03, M("metal"), 18, {rt = 0.1}); b.box(-0.08, 0.07, -0.015, 0.08, 0.1, 0.015, M("metal_dark"))})
	pdef("apple_core", {name = "りんごの芯", hx = 0.04, h = 0.1, hz = 0.04, w = 0.15, mk = func(b: MB): b.sphere(0, 0.022, 0, 0.034, M("apple"), 1, 0.7, 1, 10); b.cyl(0, 0.03, 0, 0.018, 0.04, M("applein"), 10); b.sphere(0, 0.078, 0, 0.032, M("apple"), 1, 0.6, 1, 10); b.cyl(0, 0.09, 0, 0.004, 0.03, M("brown"), 5)})
	pdef("keycard", {name = "カードキー", hx = 0.05, h = 0.01, hz = 0.035, w = 0.1, key = true, mk = func(b: MB): b.box(-0.05, 0, -0.032, 0.05, 0.005, 0.032, M("card")); b.box(-0.05, 0.005, 0.01, 0.05, 0.006, 0.02, M("black")); b.box(-0.04, 0.005, -0.025, -0.01, 0.006, -0.005, M("brass"))})
	pdef("watering_can", {name = "じょうろ", hx = 0.24, h = 0.3, hz = 0.12, w = 0.8, mk = func(b: MB): b.cyl(0, 0, 0, 0.12, 0.22, M("can_g"), 14); b.rbox(0.19, 0.16, 0, 0.2, 0.03, 0.03, 0, 0, 0.7, M("can_g")); b.cyl(0.26, 0.23, 0, 0.035, 0.03, M("can_g"), 10); b.rbox(-0.02, 0.27, 0, 0.2, 0.03, 0.03, 0, 0, 0, M("can_g")); b.box(-0.12, 0.2, -0.015, -0.1, 0.27, 0.015, M("can_g")); b.box(0.08, 0.2, -0.015, 0.1, 0.27, 0.015, M("can_g"))})
	pdef("chair", {name = "いす", hx = 0.24, h = 0.92, hz = 0.24, w = 2, solid = true, mk = func(b: MB):
		var w: Material = M("wood_m")
		for xz in [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]: b.box(xz[0] - 0.025, 0, xz[1] - 0.025, xz[0] + 0.025, 0.45, xz[1] + 0.025, w)
		b.box(-0.23, 0.45, -0.23, 0.23, 0.5, 0.23, w)
		b.box(-0.23, 0.5, -0.23, -0.18, 0.92, -0.18, w); b.box(0.18, 0.5, -0.23, 0.23, 0.92, -0.18, w); b.box(-0.23, 0.72, -0.235, 0.23, 0.88, -0.19, w); b.box(-0.21, 0.53, -0.22, 0.21, 0.56, -0.2, w)})
	pdef("binoculars", {name = "双眼鏡", hx = 0.09, h = 0.07, hz = 0.08, w = 0.4, tool = "binoc", mk = func(b: MB): b.cyl(-0.045, 0.035, 0, 0.032, 0.14, M("black"), 10, {axis = "z"}); b.cyl(0.045, 0.035, 0, 0.032, 0.14, M("black"), 10, {axis = "z"}); b.box(-0.02, 0.03, -0.03, 0.02, 0.05, 0.03, M("dgrey")); b.cyl(-0.045, 0.035, 0.07, 0.026, 0.01, M("glassb"), 10, {axis = "z"}); b.cyl(0.045, 0.035, 0.07, 0.026, 0.01, M("glassb"), 10, {axis = "z"})})
	pdef("flashlight", {name = "懐中電灯", hx = 0.04, h = 0.06, hz = 0.13, w = 0.3, tool = "light", mk = func(b: MB): b.cyl(0, 0.03, 0, 0.022, 0.2, M("yellow"), 10, {axis = "z"}); b.cyl(0, 0.03, 0.11, 0.035, 0.05, M("black"), 12, {axis = "z", rt = 0.026}); b.cyl(0, 0.03, 0.136, 0.03, 0.006, M("bulb"), 12, {axis = "z"})})
	pdef("cup", {name = "マグカップ", hx = 0.05, h = 0.1, hz = 0.05, w = 0.2, mk = func(b: MB): b.cyl(0, 0, 0, 0.045, 0.1, M("cup"), 12); b.box(0.045, 0.03, -0.008, 0.07, 0.08, 0.008, M("cup"))})
	pdef("plate", {name = "お皿", hx = 0.11, h = 0.02, hz = 0.11, w = 0.3, mk = func(b: MB): b.cyl(0, 0, 0, 0.11, 0.02, M("porcelain"), 16, {rt = 0.07})})
	pdef("bottle", {name = "びん", hx = 0.04, h = 0.26, hz = 0.04, w = 0.3, glass = true, mk = func(b: MB): b.cyl(0, 0, 0, 0.038, 0.17, M("bottle"), 10); b.cyl(0, 0.17, 0, 0.014, 0.07, M("bottle"), 8, {rt = 0.038}); b.cyl(0, 0.24, 0, 0.015, 0.02, M("red"), 8)})
	pdef("book", {name = "本", hx = 0.1, h = 0.04, hz = 0.14, w = 0.4, mk = func(b: MB): b.box(-0.1, 0, -0.14, 0.1, 0.04, 0.14, M("bookc")); b.box(-0.095, 0.004, -0.135, 0.1, 0.036, 0.138, M("cream"))})
	pdef("can", {name = "あき缶", hx = 0.035, h = 0.12, hz = 0.035, w = 0.1, mk = func(b: MB): b.cyl(0, 0, 0, 0.034, 0.12, M("canr"), 10)})
	pdef("ball", {name = "ボール", hx = 0.12, h = 0.24, hz = 0.12, w = 0.5, bouncy = true, mk = func(b: MB): b.sphere(0, 0.12, 0, 0.12, M("ball"), 1, 1, 1, 14)})
	pdef("duck", {name = "アヒルのおもちゃ", hx = 0.06, h = 0.1, hz = 0.07, w = 0.1, mk = func(b: MB): b.sphere(0, 0.035, 0, 0.05, M("yellow"), 1, 0.7, 1.2, 10); b.sphere(0, 0.08, 0.03, 0.03, M("yellow"), 1, 1, 1, 8); b.box(-0.012, 0.075, 0.055, 0.012, 0.085, 0.08, M("orange"))})
	pdef("clock", {name = "目覚まし時計", hx = 0.07, h = 0.15, hz = 0.05, w = 0.3, mk = func(b: MB): b.cyl(0, 0.075, 0, 0.065, 0.05, M("red"), 14, {axis = "z"}); b.cyl(0, 0.075, 0.026, 0.055, 0.004, M("cream"), 14, {axis = "z"}); b.sphere(-0.04, 0.14, 0, 0.025, M("chrome")); b.sphere(0.04, 0.14, 0, 0.025, M("chrome")); b.box(-0.05, 0, -0.01, -0.035, 0.03, 0.01, M("black")); b.box(0.035, 0, -0.01, 0.05, 0.03, 0.01, M("black"))})
	pdef("pot", {name = "なべ", hx = 0.14, h = 0.14, hz = 0.14, w = 0.8, mk = func(b: MB): b.cyl(0, 0, 0, 0.13, 0.12, M("metal"), 14); b.box(0.13, 0.09, -0.015, 0.26, 0.11, 0.015, M("black"))})
	pdef("vase", {name = "花びん", hx = 0.07, h = 0.28, hz = 0.07, w = 0.5, glass = true, mk = func(b: MB): b.cyl(0, 0, 0, 0.06, 0.1, M("vase"), 12, {rt = 0.08}); b.cyl(0, 0.1, 0, 0.08, 0.1, M("vase"), 12, {rt = 0.04}); b.cyl(0, 0.2, 0, 0.04, 0.08, M("vase"), 12, {rt = 0.05})})
	pdef("shoe", {name = "くつ", hx = 0.06, h = 0.09, hz = 0.13, w = 0.3, mk = func(b: MB): b.box(-0.05, 0, -0.12, 0.05, 0.02, 0.13, M("black")); b.box(-0.05, 0.02, -0.12, 0.05, 0.08, 0.02, M("shoe")); b.box(-0.05, 0.02, 0.02, 0.05, 0.05, 0.13, M("shoe"))})
	pdef("board", {name = "板", hx = 0.55, h = 0.03, hz = 0.08, w = 0.8, mk = func(b: MB): b.box(-0.55, 0, -0.075, 0.55, 0.03, 0.075, M("raw"), 63, 1)})
	pdef("radio", {name = "ラジオ", hx = 0.15, h = 0.16, hz = 0.07, w = 0.8, mk = func(b: MB): b.box(-0.15, 0, -0.06, 0.15, 0.14, 0.06, M("radio")); b.box(-0.12, 0.02, 0.06, 0.02, 0.12, 0.065, M("dgrey")); b.cyl(0.08, 0.07, 0.06, 0.03, 0.01, M("cream"), 10, {axis = "z"}); b.box(0.1, 0.14, -0.01, 0.105, 0.3, 0, M("chrome"))})
	pdef("banana", {name = "バナナの皮", hx = 0.08, h = 0.04, hz = 0.06, w = 0.1, mk = func(b: MB): b.rbox(0, 0.015, 0, 0.14, 0.025, 0.04, 0, 0.3, 0, M("yellow")); b.rbox(-0.05, 0.015, 0.03, 0.08, 0.02, 0.03, 0, 1.2, 0, M("yellow"))})
# ---- 置いてある物 ----
var PROPS := []
var PID := 1
func spawnProp(type: String, x: float, y: float, z: float, yaw := 0.0, o := {}) -> Dictionary:
	var d: Dictionary = PDEF[type]; var g := mkModel(d.mk); set_cast(g, true); g.rotation_order = EULER_ORDER_XYZ; scene.add_child(g)
	var pid: String = o.get("id", "")
	if pid == "":
		pid = "p%d" % PID; PID += 1
	var pr := {id = pid, type = type, d = d, grp = g, p = Vector3(x, y, z), v = Vector3(), yaw = yaw, spin = Vector3(), rot = Vector3(), st = "rest", data = o.get("data", {}).duplicate(), solid = null,
		home = {x = x, y = y, z = z, yaw = yaw}, sleep = 0.0, att = null, lp = null, onGround = true, hidden = false, noPick = not not o.get("noPick"), lying = false, thrown = false, cont = null, lid = null}
	PROPS.append(pr); placeProp(pr)
	if o.get("att"): attachProp(pr, o.att, o.get("lp", Vector3()))
	else: refreshSolid(pr)
	return pr
func propHX(pr: Dictionary) -> float:
	var q := absi(roundi(pr.yaw / (PI / 2))) % 2
	return pr.d.hz if q else pr.d.hx
func propHZ(pr: Dictionary) -> float:
	var q := absi(roundi(pr.yaw / (PI / 2))) % 2
	return pr.d.hx if q else pr.d.hz
func propBox(pr: Dictionary) -> Box:
	var hx := propHX(pr); var hz := propHZ(pr); var p: Vector3 = pr.p
	if pr.lying: return Box.new(p.x - hx, p.y - 0.25, p.z - pr.d.h, p.x + hx, p.y + 0.25, p.z)
	return Box.new(p.x - hx, p.y, p.z - hz, p.x + hx, p.y + pr.d.h, p.z + hz)
func placeProp(pr: Dictionary) -> void:
	var g: Node3D = pr.grp
	g.position = pr.p
	if pr.st == "fly":
		g.rotation_order = EULER_ORDER_XYZ
		g.rotation = Vector3(pr.rot.x, pr.yaw + pr.rot.y, pr.rot.z); g.position.y += pr.d.h / 2
		# 回転の中心を物のまん中に
		for m in g.get_children(): m.position = Vector3(0, -pr.d.h / 2, 0)
	else:
		g.rotation_order = EULER_ORDER_XYZ
		g.rotation = Vector3(-PI / 2 if pr.lying else 0.0, 0.0 if pr.lying else pr.yaw, 0)
		for m in g.get_children(): m.position = Vector3()
func refreshSolid(pr: Dictionary) -> void:
	var want: bool = pr.d.solid and pr.st == "rest" and not pr.hidden and not pr.lying
	if want:
		var b := propBox(pr)
		if not pr.solid: pr.solid = dyn_box(b.x0, b.y0, b.z0, b.x1, b.y1, b.z1, pr.d.s if pr.d.s else "wood", pr)
		else:
			set_box(pr.solid, b.x0, b.y0, b.z0, b.x1, b.y1, b.z1); pr.solid.on = true
	elif pr.solid: pr.solid.on = false
func attachProp(pr: Dictionary, obj: Dictionary, lp: Vector3) -> void:
	pr.st = "att"; pr.att = obj; pr.lp = lp
	if not obj.has("props"): obj.props = []
	obj.props.append(pr); refreshSolid(pr); updAttached(pr)
func detachProp(pr: Dictionary) -> void:
	if pr.att and pr.att.get("props") != null: remove_ref(pr.att.props, pr)
	pr.att = null; pr.lp = null
func updAttached(pr: Dictionary) -> void:
	var o = pr.att
	if not o: return
	var m: Transform3D = o.frame.call()
	var p: Vector3 = m * pr.lp
	pr.p = p
	var g: Node3D = pr.grp
	g.position = p
	g.basis = Basis(m.basis.get_rotation_quaternion()) * Basis(Vector3.UP, pr.yaw)
	for c in g.get_children(): c.position = Vector3()
func setPropHidden(pr: Dictionary, h: bool) -> void:
	pr.hidden = h; pr.grp.visible = not h; refreshSolid(pr)
func propToInv(pr: Dictionary) -> void:
	detachProp(pr); pr.st = "inv"; pr.grp.visible = false; refreshSolid(pr)
func propDropAt(pr: Dictionary, x: float, y: float, z: float, yaw: float, vel = null) -> void:
	pr.st = "fly"; pr.p = Vector3(x, y, z); pr.yaw = yaw; pr.grp.visible = not pr.hidden; pr.v = vel if vel != null else Vector3(); pr.rot = Vector3()
	pr.spin = Vector3(rr(-6, 6), rr(-4, 4), rr(-6, 6)) if vel != null else Vector3()
	pr.sleep = 0.0; pr.thrown = vel != null; refreshSolid(pr); placeProp(pr)
func propRestAt(pr: Dictionary, x: float, y: float, z: float, yaw: float) -> void:
	detachProp(pr); pr.st = "rest"; pr.p = Vector3(x, y, z); pr.yaw = yaw; pr.v = Vector3(); pr.grp.visible = not pr.hidden; refreshSolid(pr); placeProp(pr)
# 当たり（物が飛んでいるとき）
var TARGETS := []   # {box, hit(pr)} スイッチなど
var propHitHook = null
func updProps(dt: float) -> void:
	for pr in PROPS:
		if pr.st == "att":
			updAttached(pr); continue
		if pr.st == "rest":
			pr.sleep += dt
			if pr.sleep > 0.35:
				pr.sleep = 0.0; var b := propBox(pr)
				if not overlap_any(b.x0 + 0.02, b.y0 - 0.06, b.z0 + 0.02, b.x1 - 0.02, b.y0 + 0.01, b.z1 - 0.02, pr.solid, func(s): return not is_same(s.ref, pr) and s.s != "trig"):
					pr.st = "fly"; pr.v = Vector3(); pr.rot = Vector3(); pr.spin = Vector3(); pr.thrown = false; refreshSolid(pr)
			continue
		if pr.st != "fly": continue
		pr.v.y -= 18 * dt
		var sp: float = pr.v.length(); var n := maxi(1, ceili(sp * dt / 0.12)); var h := dt / n; var hx := propHX(pr); var hz := propHZ(pr)
		var filt := func(b): return not is_same(b.ref, pr) and b.s != "trig"
		var s := 0
		while s < n and pr.st == "fly":
			s += 1
			var vx: float = pr.v.x; var vy: float = pr.v.y; var vz: float = pr.v.z
			# 見えない当たり（スイッチなど）
			for t in TARGETS:
				var b = t.box
				if pr.p.x + hx > b.x0 and pr.p.x - hx < b.x1 and pr.p.y + pr.d.h > b.y0 and pr.p.y < b.y1 and pr.p.z + hz > b.z0 and pr.p.z - hz < b.z1 and pr.thrown and not t.get("done"): t.hit.call(pr)
			if propHitHook != null and pr.thrown and propHitHook.call(pr, hx, hz): continue
			pr.p = move_body(pr.p, hx, pr.d.h, hz, vx * h, vy * h, vz * h, null, filt)
			var hb = HIT.box; var impact := (absf(vx) if HIT.x else 0.0) + (absf(vy) if HIT.y else 0.0) + (absf(vz) if HIT.z else 0.0)
			if hb != null and hb.s == "glass" and impact > 2.5 and hb.ref != null and hb.ref.get("breakGlass"):
				hb.ref.breakGlass.call(pr); continue
			if hb != null and hb.ref != null and hb.ref.get("onPropHit"): hb.ref.onPropHit.call(pr, impact)
			var bo := 0.7 if pr.d.bouncy else 0.25
			if HIT.x: pr.v.x = -vx * bo
			if HIT.z: pr.v.z = -vz * bo
			if HIT.y:
				if vy < 0:
					if vy < -2.2:
						pr.v.y = -vy * bo; pr.v.x *= 0.7; pr.v.z *= 0.7
					else:
						pr.v.y = 0.0; pr.v.x *= pow(0.02, h); pr.v.z *= pow(0.02, h)
				else: pr.v.y = 0.0
			if impact > 2.2: propImpact(pr, impact, hb)
		pr.rot += pr.spin * dt
		# 止まったら置く
		var onG: bool = HIT.ground != null
		if onG: pr.spin *= pow(0.05, dt)
		if onG and absf(pr.v.y) < 0.5 and Vector2(pr.v.x, pr.v.z).length() < 0.35:
			pr.st = "rest"; pr.thrown = false; pr.v = Vector3(); pr.yaw = roundf((pr.yaw + pr.rot.y) / (PI / 2)) * (PI / 2) + rr(-0.12, 0.12); pr.rot = Vector3(); pr.spin = Vector3(); refreshSolid(pr)
		if pr.p.y < -30: propRestAt(pr, pr.home.x, pr.home.y, pr.home.z, pr.home.yaw)
		placeProp(pr)
var lastImpactT := 0.0
func propImpact(pr: Dictionary, sp: float, hb) -> void:
	if GT - lastImpactT < 0.05: return
	lastImpactT = GT
	var w: float = pr.d.w if pr.d.w else 0.5
	sfxImpact(pr, sp, hb.s if hb != null else "wood"); noise(pr.p.x, pr.p.y, pr.p.z, clampf(4 + sp * w * 2.2, 4, 20), "impact")
	if pr.d.glass and sp > 6: breakProp(pr)
func breakProp(pr: Dictionary) -> void:
	spawnShards(pr.p.x, pr.p.y + 0.1, pr.p.z, "#4a7ad0" if pr.d.type == "vase" else "#3f8a5a", 10); sfxGlass(pr.p, 0.6); noise(pr.p.x, pr.p.y, pr.p.z, 16, "glass")
	propRestAt(pr, pr.home.x, pr.home.y, pr.home.z, pr.home.yaw)
func propById(id: String):
	for p in PROPS:
		if p.id == id: return p
	return null
func propsInBox(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, type = null) -> Array:
	return PROPS.filter(func(p): return (p.st == "rest" or p.st == "fly") and (not type or p.type == type) and p.p.x > x0 and p.p.x < x1 and p.p.y > y0 and p.p.y < y1 and p.p.z > z0 and p.p.z < z1)

# ================= プレイヤー（一人称）=================
const PR := 0.27
const H_ST := 1.6
const H_CR := 0.92
const STEP := 0.46
const GRAV := 18.0
const JUMPV := 6.5
var PL := {p = Vector3(), v = Vector3(), yaw = 0.0, pitch = 0.0, crouch = 0.0, wantCrouch = false, autoCrouch = 0.0, onGround = true, ground = null, h = H_ST, climb = null, hide = null, stuck = 0.0, fallTop = 0.0,
	inv = [null, null, null, null], sel = 0, charge = 0.0, charging = false, chargeT = 0.0, bob = 0.0, stepD = 0.0, zoom = 0.0, light = false, frozen = false, run = false, target = null, useTarget = null, lastLand = 0.0, hurtT = 0.0, swing = 0.0, inHouse = false,
	wet = false, slip = 0.0, climbSnd = 0.0, hideT = 0.0, spawn = null}
var IN := {f = 0.0, s = 0.0, run = false, jump = false, crouch = false, lookX = 0.0, lookY = 0.0, zoom = false}
func eyeH() -> float: return PL.h - 0.12
func camPos() -> Vector3: return Vector3(PL.p.x, PL.p.y + eyeH(), PL.p.z)
func lookDir() -> Vector3:
	var cp := cos(PL.pitch)
	return Vector3(-sin(PL.yaw) * cp, sin(PL.pitch), -cos(PL.yaw) * cp)
func held(): return PL.inv[PL.sel]
var bodyFilt := func(b): return b.s != "trig"
func canStand() -> bool:
	return not overlap_any(PL.p.x - PR, PL.p.y + 0.05, PL.p.z - PR, PL.p.x + PR, PL.p.y + H_ST, PL.p.z + PR, null, bodyFilt)
func teleportPlayer(x: float, y: float, z: float, yaw: float, pitch := 0.0) -> void:
	PL.p = Vector3(x, y, z); PL.v = Vector3(); PL.yaw = yaw; PL.pitch = pitch; PL.climb = null; PL.fallTop = y; PL.crouch = 0.0; PL.h = H_ST; PL.onGround = true
func updatePlayer(dt: float) -> void:
	if PL.hurtT > 0: PL.hurtT -= dt
	if PL.hide or PL.frozen:
		PL.v = Vector3(); return
	if PL.stuck > 0:
		PL.stuck -= dt
		if PL.stuck <= 0:
			ui_cls("trapFx", "on", false); toast("トラバサミから足をぬいた")
		PL.v.x = 0.0; PL.v.z = 0.0
	# しゃがみ
	var wantC: bool = IN.crouch or PL.autoCrouch > 0
	if PL.autoCrouch > 0 and not IN.crouch:
		PL.autoCrouch -= dt
		if PL.autoCrouch <= 0 and not canStand(): PL.autoCrouch = 0.2
	var tgtC := 1.0 if wantC else (1.0 if PL.crouch > 0 and not canStand() else 0.0)
	PL.crouch = damp(PL.crouch, tgtC, 14, dt); PL.h = lerpf(H_ST, H_CR, PL.crouch)
	# 入力 → 向き
	var cs := cos(PL.yaw); var sn := sin(PL.yaw)
	var fx: float = -sn * IN.f + cs * IN.s; var fz: float = -cs * IN.f - sn * IN.s
	var il := Vector2(fx, fz).length()
	if il > 1:
		fx /= il; fz /= il
	var wet := playerInWater(); PL.wet = wet
	var running: bool = (IN.run or PL.run) and PL.crouch < 0.3 and IN.f > 0 and not wet
	var sp := (1.8 if PL.crouch > 0.5 else 5.9 if running else 3.5) * (0.5 if wet else 1.0)
	# はしご
	var lad = null
	for L in LADDERS:
		var b: Box = L.box
		if PL.p.x + PR > b.x0 and PL.p.x - PR < b.x1 and PL.p.z + PR > b.z0 and PL.p.z - PR < b.z1 and PL.p.y + 0.3 > b.y0 and PL.p.y < b.y1:
			lad = L; break
	if lad and not PL.climb:
		var tow: float = -(fx * lad.face[0] + fz * lad.face[1])
		if tow > 0.3 and IN.f > 0 and PL.stuck <= 0: PL.climb = lad
	if PL.climb and (not lad or IN.jump):
		if IN.jump and PL.climb:
			PL.v.x = PL.climb.face[0] * 3; PL.v.z = PL.climb.face[1] * 3; PL.v.y = 3.0; IN.jump = false
		PL.climb = null
	if PL.climb:
		var L = PL.climb
		var up: float = sgn(IN.f) * (-1.0 if PL.pitch < -0.5 else 1.0) if IN.f != 0 else 0.0
		PL.v.y = up * 2.7
		var tow: float = -(fx * L.face[0] + fz * L.face[1])
		PL.v.x = -L.face[0] * maxf(0, tow) * 1.2 + (fx + L.face[0] * tow) * 1.2; PL.v.z = -L.face[1] * maxf(0, tow) * 1.2 + (fz + L.face[1] * tow) * 1.2
		if up < 0 and PL.onGround and PL.p.y < L.y0 + 0.2: PL.climb = null
		PL.fallTop = PL.p.y; PL.climbSnd += absf(PL.v.y) * dt
		if PL.climbSnd > 0.55:
			PL.climbSnd = 0.0; sfx("ladder")
	else:
		var acc := 0.6 if PL.slip > 0 else 16.0 if PL.onGround else 4.0
		var tx := fx * sp; var tz := fz * sp
		if PL.stuck <= 0:
			PL.v.x = damp(PL.v.x, tx, acc, dt); PL.v.z = damp(PL.v.z, tz, acc, dt)
		PL.v.y -= GRAV * dt
		if PL.v.y < -30: PL.v.y = -30.0
		if IN.jump and PL.onGround and PL.stuck <= 0:
			PL.v.y = JUMPV; PL.onGround = false; sfxStep(PL.ground.s if PL.ground else "wood", 0.5)
	IN.jump = false
	# 動かす（細かく分けて）
	var wasG: bool = PL.onGround; var vy0: float = PL.v.y
	var n := maxi(1, ceili(PL.v.length() * dt / 0.2)); var h := dt / n; var grounded := false; var gnd = null
	for i in n:
		var ox: float = PL.p.x; var oz: float = PL.p.z
		PL.p = move_body(PL.p, PR, PL.h, PR, 0, PL.v.y * h, 0, null, bodyFilt)
		if HIT.y:
			if PL.v.y < 0:
				grounded = true; gnd = HIT.ground
			PL.v.y = 0.0
		var dx: float = PL.v.x * h; var dz: float = PL.v.z * h; var sy: float = PL.p.y
		PL.p = move_body(PL.p, PR, PL.h, PR, dx, 0, dz, null, bodyFilt)
		if (HIT.x or HIT.z) and (grounded or wasG or PL.climb): # 段差を上る
			var bx: float = PL.p.x; var bz: float = PL.p.z
			var p2 := move_body(Vector3(ox, sy, oz), PR, PL.h, PR, 0, STEP, 0, null, bodyFilt)
			var up := p2.y - sy
			if up > 0.05:
				p2 = move_body(p2, PR, PL.h, PR, dx, 0, dz, null, bodyFilt)
				var moved := Vector2(p2.x - ox, p2.z - oz).length(); var moved0 := Vector2(bx - ox, bz - oz).length()
				if moved > moved0 + 0.01:
					p2 = move_body(p2, PR, PL.h, PR, 0, -up - 0.02, 0, null, bodyFilt)
					if HIT.y:
						PL.p = p2; grounded = true; gnd = HIT.ground
		# 低い所に入るときは自動でしゃがむ
		if (HIT.x or HIT.z) and PL.crouch < 0.5 and IN.f > 0:
			var p3 := move_body(Vector3(ox, PL.p.y, oz), PR, H_CR, PR, dx, 0, dz, null, bodyFilt)
			if Vector2(p3.x - ox, p3.z - oz).length() > Vector2(PL.p.x - ox, PL.p.z - oz).length() + 0.005: PL.autoCrouch = 0.35
	# 立っているか確かめる
	if not grounded and PL.v.y <= 0:
		var g = groundBelow(PL.p, PR, 0.06)
		if g:
			grounded = true; gnd = g
	if grounded and not wasG:
		var fall: float = PL.fallTop - PL.p.y
		if fall > 1.2 or vy0 < -8:
			sfxStep(gnd.s if gnd else "wood", 1.4); noise(PL.p.x, PL.p.y, PL.p.z, clampf(fall * 2, 4, 12), "land"); PL.bob += 0.4
		if fall > 9.5 and not PL.climb: fallFaint()
	if not grounded and wasG: PL.fallTop = PL.p.y
	if not grounded: PL.fallTop = maxf(PL.fallTop, PL.p.y)
	PL.onGround = grounded; PL.ground = gnd
	if PL.onGround: PL.fallTop = PL.p.y
	if PL.p.y < -20:
		var sp2 = PL.spawn
		teleportPlayer(sp2.x if sp2 else 0.0, sp2.y if sp2 else 0.0, sp2.z if sp2 else 0.0, PL.yaw)
	# 足音
	var hs := Vector2(PL.v.x, PL.v.z).length()
	if PL.onGround and hs > 0.5:
		PL.stepD += hs * dt; var sl := 1.9 if running else 1.1 if PL.crouch > 0.5 else 1.45; PL.bob += hs * dt * (1.25 if running else 1.0)
		if PL.stepD > sl:
			PL.stepD = 0.0; var surf: String = "water" if PL.wet else PL.ground.s if PL.ground else "wood"
			sfxStep(surf, 0.25 if PL.crouch > 0.5 else 1.0 if running else 0.6)
			if PL.crouch < 0.5: noise(PL.p.x, PL.p.y, PL.p.z, 9.0 if running else 3.5, "step")
	# 双眼鏡
	var H = held(); var zoomOn: bool = IN.zoom and H and H.d.tool == "binoc"
	PL.zoom = damp(PL.zoom, 1.0 if zoomOn else 0.0, 10, dt); ui_cls("binoc", "on", PL.zoom > 0.5)
func groundBelow(p: Vector3, r: float, d: float):
	var best = null
	for b in gather(p.x - r, p.z - r, p.x + r, p.z + r):
		if b.s == "trig": continue
		if b.x0 < p.x + r and b.x1 > p.x - r and b.z0 < p.z + r and b.z1 > p.z - r and b.y1 <= p.y + 0.01 and b.y1 >= p.y - d:
			if best == null or b.y1 > best.y1: best = b
	return best
# 重なってしまったとき（ドアが閉まったなど）に押し出す。新しい位置を返す
func depenetrate(p: Vector3, r: float, h: float) -> Vector3:
	for b in DYN:
		if not b.on or b.s == "trig": continue
		if b.x0 < p.x + r and b.x1 > p.x - r and b.z0 < p.z + r and b.z1 > p.z - r and b.y0 < p.y + h and b.y1 > p.y + 0.05:
			var dx1: float = b.x1 - (p.x - r); var dx0: float = (p.x + r) - b.x0; var dz1: float = b.z1 - (p.z - r); var dz0: float = (p.z + r) - b.z0; var dy: float = b.y1 - p.y
			var m := minf(minf(dx1, dx0), minf(minf(dz1, dz0), dy if dy < 0.5 else 9.0))
			if m == dy: p.y = b.y1 + 0.001
			elif m == dx1: p.x += dx1
			elif m == dx0: p.x -= dx0
			elif m == dz1: p.z += dz1
			else: p.z -= dz0
	return p
# ---- ねらっている物 ----
func aabbRay(b, ox: float, oy: float, oz: float, dx: float, dy: float, dz: float, mx: float) -> float:
	return ray_box(ox, oy, oz, 1.0 / (dx if dx else 1e-9), 1.0 / (dy if dy else 1e-9), 1.0 / (dz if dz else 1e-9), b, mx)
func updTarget() -> void:
	PL.target = null; PL.useTarget = null
	if PL.hide or PL.frozen or STATE != "play":
		showPrompt(); return
	var ro := camPos(); var rd := lookDir(); var R := 2.35
	var best := R; var bt = null; var bk = null
	var ox := ro.x; var oy := ro.y; var oz := ro.z; var dx := rd.x; var dy := rd.y; var dz := rd.z
	var H0 = held()
	for it in ITS:
		if not it.on: continue
		var t := aabbRay(it.box, ox, oy, oz, dx, dy, dz, best)
		if t >= 0 and t < best:
			if it.label:
				var l = it.label.call(H0)
				if not (l and l.get("t")) and not (H0 and it.useLabel and it.useLabel.call(H0)): continue
			best = t; bt = it; bk = "it"
	for pr in PROPS:
		if (pr.st != "rest" and pr.st != "att" and pr.st != "fly") or pr.hidden or pr.noPick: continue
		var b := propBox(pr); var pad := 0.06
		var bb := Box.new(b.x0 - pad, b.y0 - pad, b.z0 - pad, b.x1 + pad, b.y1 + pad, b.z1 + pad)
		var t := aabbRay(bb, ox, oy, oz, dx, dy, dz, best)
		if t >= 0 and t < best:
			best = t; bt = pr; bk = "prop"
	if bt:
		# 壁の向こうは×
		var tgt = bt; var kind = bk
		var ts := ray_cast(ox, oy, oz, dx, dy, dz, best, func(b): return b.s != "trig" and not (kind == "it" and tgt.door and is_same(b.ref, tgt.door)) and not (kind == "prop" and is_same(b.ref, tgt)) and not (kind == "it" and tgt.ownCol and tgt.ownCol == b))
		if ts < best - 0.08: bt = null
	PL.target = {k = bk, o = bt, t = best} if bt else null
	# 手に持っている物が使えるか
	var H = held()
	if H and bt:
		if bk == "it" and bt.useLabel:
			var l = bt.useLabel.call(H)
			if l: PL.useTarget = {o = bt, l = l, prop = false}
		elif bk == "prop" and propUseLabel(H, bt): PL.useTarget = {o = bt, l = propUseLabel(H, bt), prop = true}
	showPrompt()
var lastPrompt := ""
func showPrompt() -> void:
	var s := ""; var T = PL.target; var H = held(); var touch := TOUCH
	if PL.hide: s = ""
	elif T:
		if T.k == "prop":
			var pl = propLabel(T.o)
			if pl: s = "[b]%s[/b]%s" % ["手" if touch else "E", pl]
		else:
			var l = T.o.label.call(H) if T.o.label else null
			if l and l.get("t"): s = ("[b]%s[/b]" % ("手" if touch else l.k) if l.k else "") + l.t + ("[small]%s[/small]" % l.n if l.get("n") else "")
		if PL.useTarget: s += ("\n" if s else "") + "[b]%s[/b]%s" % ["使う" if touch else "左クリック", PL.useTarget.l]
	if s != lastPrompt:
		ui_prompt(s); lastPrompt = s
	ui_cls("cross", "hot", not not T)
func propLabel(pr: Dictionary):
	if pr.data.get("frozen"): return null
	if pr.data.get("hot"): return "拾う　[color=#ff9a6a]" + pr.d.name + "（熱い！）[/color]"
	if pr.type == "suitcase" and pr.data.get("openable"): return "閉める　スーツケース" if pr.data.get("open") else "開ける　スーツケース"
	return "拾う　" + pr.d.name
func propUseLabel(H: Dictionary, pr: Dictionary):
	if H.type == "key_house" and pr.type == "suitcase" and pr.data.get("wantKey"): return "鍵をスーツケースに入れる"
	if H.type == "watering_can" and H.data.get("full") and pr.data.get("hot"): return "水をかけて冷やす"
	return null
# ---- 行動 ----
func doInteract() -> void:
	if STATE != "play": return
	if PL.hide:
		exitHide(); return
	var T = PL.target
	if not T: return
	if T.k == "prop":
		var pr = T.o
		if pr.type == "suitcase" and pr.data.get("openable"):
			toggleSuitcase(pr); return
		pickUp(pr)
	elif T.o.act: T.o.act.call()
func pickUp(pr: Dictionary) -> void:
	if pr.data.get("frozen"):
		toast("氷づけになっていて取れない"); return
	if pr.data.get("hot"):
		sfx("sizzle"); toast("あつっ！ 熱くて持てない！"); PL.hurtT = 0.4; ui_cls("hurt", "on", true); later(0.3, func(): ui_cls("hurt", "on", false)); noise(PL.p.x, PL.p.y, PL.p.z, 6, "yell")
		if pr.st == "att":
			detachProp(pr); propDropAt(pr, pr.p.x, pr.p.y, pr.p.z, pr.yaw, Vector3(rr(-0.5, 0.5), 0, rr(-0.5, 0.5)))
		if story.get("onHotTouch"): story.onHotTouch.call(pr)
		return
	var slot: int = PL.inv.find(null) if PL.inv[PL.sel] else PL.sel
	if slot < 0:
		toast("持ち物がいっぱい（Qで置けるよ）"); sfx("deny"); return
	if pr.st == "att" and pr.att and pr.att.get("onTake"): pr.att.onTake.call(pr)
	pr.lying = false; propToInv(pr); PL.inv[slot] = pr; PL.sel = slot; sfx("pick"); drawInv(); showIName()
	if story.get("onPick"): story.onPick.call(pr)
	PL.swing = 0.25
func consumeHeld() -> void:
	var H = held()
	if not H: return
	PL.inv[PL.sel] = null; H.st = "gone"; H.grp.visible = false; refreshSolid(H); drawInv()
func dropHeld() -> void:
	var H = held()
	if not H or PL.hide: return
	var ro := camPos(); var rd := lookDir(); var fw := Vector3(rd.x, 0, rd.z).normalized()
	var x: float = PL.p.x + fw.x * 0.7; var z: float = PL.p.z + fw.z * 0.7; var y: float = PL.p.y + PL.h * 0.6
	# 壁にめりこまないように
	var d := ray_cast(ro.x, ro.y, ro.z, fw.x, 0, fw.z, 0.9, bodyFilt)
	if d < 0.9:
		x = PL.p.x + fw.x * maxf(0, d - 0.35); z = PL.p.z + fw.z * maxf(0, d - 0.35)
	PL.inv[PL.sel] = null; propDropAt(H, x, y, z, roundf(PL.yaw / (PI / 2)) * (PI / 2), Vector3(fw.x * 0.5, 0, fw.z * 0.5)); H.thrown = false; sfx("drop"); drawInv()
	if story.get("onDrop"): story.onDrop.call(H)
func throwHeld(power: float) -> void:
	var H = held()
	if not H or PL.hide: return
	var ro := camPos(); var rd := lookDir(); var sp := 5 + power * 13
	var right := Vector3(cos(PL.yaw), 0, -sin(PL.yaw))
	var x := ro.x + rd.x * 0.35 + right.x * 0.12; var y := ro.y - 0.15 + rd.y * 0.3; var z := ro.z + rd.z * 0.35 + right.z * 0.12
	var d := ray_cast(ro.x, ro.y, ro.z, rd.x, rd.y, rd.z, 0.5, bodyFilt)
	if d < 0.5:
		x = ro.x + rd.x * (d - 0.25); y = ro.y + rd.y * (d - 0.25) - 0.1; z = ro.z + rd.z * (d - 0.25)
	PL.inv[PL.sel] = null; propDropAt(H, x, y - H.d.h / 2, z, PL.yaw, Vector3(rd.x * sp + PL.v.x * 0.5, rd.y * sp + 1.4 + power * 1.2, rd.z * sp + PL.v.z * 0.5)); sfx("throw", power); PL.swing = 0.35; drawInv(); noise(PL.p.x, PL.p.y, PL.p.z, 2, "throw")
	if story.get("onThrow"): story.onThrow.call(H)
func useHeldOnTarget() -> bool:
	var U = PL.useTarget; var H = held()
	if not U or not H: return false
	if U.prop:
		var pr = U.o
		if H.type == "key_house" and pr.type == "suitcase":
			PL.inv[PL.sel] = null; drawInv(); H.grp.visible = true; attachProp(H, pr.cont if pr.cont else pr, Vector3(0.05, 0.12, 0)); H.st = "att"; H.noPick = true; sfx("pick")
			if story.get("onKeyInCase"): story.onKeyInCase.call(pr, H)
			return true
		if H.type == "watering_can" and pr.data.get("hot"):
			pourWater(pr); return true
		return false
	if U.o.use:
		PL.swing = 0.3; return U.o.use.call(H)
	return false
func toolUse() -> bool:
	var H = held()
	if not H: return false
	if H.d.tool == "light":
		PL.light = not PL.light; sfx("click"); return true
	if H.d.tool == "alarm":
		armAlarm(H); return true
	if H.d.tool == "binoc": return true
	return false
func pourWater(pr: Dictionary) -> void:
	var H = held(); H.data.full = false; updCanLook(H); sfx("pour")
	for i in 30: later(i * 0.04, func(): puff(pr.p.x, pr.p.y + 0.1, pr.p.z, "#e8eef0", 2, 0.35, 1.6, 1.4))
	later(0.5, func():
		sfx("steam"); pr.data.hot = false; setPropHot(pr, false); toast("バールが冷えた")
		if story.get("onCool"): story.onCool.call(pr))
	drawInv()
# ---- 隠れる ----
func enterHide(h: Dictionary) -> void:
	if PL.stuck > 0: return
	nbNoteHide(h)
	PL.hide = h; PL.hideT = GT
	if h.cab:
		for L in h.cab.leaves: L.m.tgt = 0.0
	sfx("cloth" if h.under else "cab", false); ui_cls("hideView", "on", true); ui_cls("hideView", "under", not not h.under); PL.yaw = h.yaw; PL.pitch = 0.0
	if story.get("onHide"): story.onHide.call(h)
	noise(PL.p.x, PL.p.y, PL.p.z, 2, "cab")
func exitHide() -> void:
	var h = PL.hide
	if not h: return
	PL.hide = null; NB.sawHide = null; ui_cls("hideView", "on", false); teleportPlayer(h.out.x, h.out.y, h.out.z, h.yaw); sfx("cab", true)
	if h.cab:
		for L in h.cab.leaves: L.m.tgt = 1.0
		later(0.7, func():
			for L in h.cab.leaves: L.m.tgt = 0.0)
# ---- 持ち物の表示 ----
var ICONS := {}
func iconKey(it: Dictionary) -> String: return it.type + ("_full" if it.data.get("full") else "")
var inameT := 0.0
func showIName() -> void:
	var H = held()
	ui_iname((H.d.name + (("（水あり）" if H.data.get("full") else "（から）") if H.type == "watering_can" else "")) if H else "")
	inameT = 1.6
func selSlot(i: int) -> void:
	PL.sel = (i + 4) % 4; drawInv(); showIName(); sfx("tick")

# ================= 家具 =================
# XF：ローカル座標（前が+Z）を k*90° 回して置く。k: 0→前が+Z 1→+X 2→-Z 3→-X
class XFo:
	var g
	var k: int
	var ox: float
	var oy: float
	var oz: float
	var c: float
	var s: float
	var yaw: float
	func _init(game, x: float, y: float, z: float, kk: int) -> void:
		g = game; k = kk & 3; ox = x; oy = y; oz = z
		c = [1.0, 0.0, -1.0, 0.0][k]; s = [0.0, 1.0, 0.0, -1.0][k]; yaw = k * PI / 2
	func tx(x: float, z: float) -> float: return ox + x * c + z * s
	func tz(x: float, z: float) -> float: return oz - x * s + z * c
	func p(x: float, y: float, z: float) -> Vector3: return Vector3(tx(x, z), oy + y, tz(x, z))
	func dir(nx: float, nz: float) -> Array: return [nx * c + nz * s, -nx * s + nz * c]
	func box(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, mat, o := {}):
		var ax := tx(x0, z0); var az := tz(x0, z0); var bx := tx(x1, z1); var bz := tz(x1, z1)
		return g.box(minf(ax, bx), oy + y0, minf(az, bz), maxf(ax, bx), oy + y1, maxf(az, bz), mat, o)
	func cyl(x: float, y: float, z: float, r: float, h: float, mat, seg := 12, o := {}) -> void: g.cyl(tx(x, z), oy + y, tz(x, z), r, h, mat, seg, o)
	func sphere(x: float, y: float, z: float, r: float, mat, sx := 1.0, sy := 1.0, sz := 1.0) -> void:
		g.W.sphere(tx(x, z), oy + y, tz(x, z), r, g.M(mat), sz if k % 2 else sx, sy, sx if k % 2 else sz)
	func rbox(cx: float, cy: float, cz: float, sx: float, sy: float, sz: float, rx: float, ry: float, rz: float, mat, o := {}) -> void:
		g.rbox(tx(cx, cz), oy + cy, tz(cx, cz), sx, sy, sz, rx, ry + k * PI / 2, rz, mat, o)
func XF(ox: float, oy: float, oz: float, k := 0) -> XFo: return XFo.new(self, ox, oy, oz, k)
const NS := {solid = false}
# ---- 基本の家具 ----
func table(x: float, y: float, z: float, w: float, d: float, h := 0.76, mat = "wood_m", k := 0) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, h - 0.05, -d / 2, w / 2, h, d / 2, mat)
	for ab in [[-1, -1], [1, -1], [-1, 1], [1, 1]]: f.box(ab[0] * (w / 2 - 0.06) - 0.03, 0, ab[1] * (d / 2 - 0.06) - 0.03, ab[0] * (w / 2 - 0.06) + 0.03, h - 0.05, ab[1] * (d / 2 - 0.06) + 0.03, mat, NS)
	add_solid(minf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2)), y, minf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2)), maxf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2)), y + h - 0.05, maxf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2)), "wood", "under")
func sofa(x: float, y: float, z: float, k: int, mat = "sofa_g", w := 2.0) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0.12, -0.45, w / 2, 0.45, 0.45, mat); f.box(-w / 2, 0.45, -0.45, w / 2, 0.95, -0.2, mat); f.box(-w / 2, 0.45, -0.45, -w / 2 + 0.2, 0.7, 0.45, mat); f.box(w / 2 - 0.2, 0.45, -0.45, w / 2, 0.7, 0.45, mat)
	f.box(-w / 2 + 0.2, 0.45, -0.2, -0.02, 0.58, 0.42, mat, NS); f.box(0.02, 0.45, -0.2, w / 2 - 0.2, 0.58, 0.42, mat, NS); f.box(-w / 2 + 0.05, 0, -0.4, w / 2 - 0.05, 0.12, 0.4, "wood_d", NS)
func armchair(x: float, y: float, z: float, k: int, mat = "sofa_r") -> void: sofa(x, y, z, k, mat, 0.95)
func bed(x: float, y: float, z: float, k: int, mat = "bed_b", w := 1.1, l := 2.05) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -l / 2, w / 2, 0.35, l / 2, "wood_d"); f.box(-w / 2 + 0.03, 0.35, -l / 2 + 0.03, w / 2 - 0.03, 0.55, l / 2 - 0.03, "sheet"); f.box(-w / 2 + 0.02, 0.4, -l / 2 + 0.5, w / 2 - 0.02, 0.6, l / 2 - 0.02, mat, NS)
	f.box(-w / 2, 0, -l / 2 - 0.06, w / 2, 1.05, -l / 2, "wood_d"); f.box(-w / 2, 0, l / 2, w / 2, 0.7, l / 2 + 0.06, "wood_d"); f.box(-w / 2 + 0.12, 0.55, -l / 2 + 0.1, w / 2 - 0.12, 0.72, -l / 2 + 0.45, "sheet", NS)
func tvSet(x: float, y: float, z: float, k: int) -> MeshInstance3D:
	var f := XF(x, y, z, k); f.box(-0.6, 0, -0.22, 0.6, 0.5, 0.22, "wood_d"); f.box(-0.45, 0.5, -0.2, 0.45, 1.02, 0.18, "dgrey")
	# 画面（動く素材）
	var p := f.p(0, 0.76, 0.185); var m := mesh(G.plane(0.78, 0.44), MATS.tvscreen.duplicate()); m.position = p; m.rotation.y = f.yaw; scene.add_child(m); f.box(-0.12, 1.02, -0.05, 0.12, 1.06, 0.05, "black", NS)
	f.cyl(0.1, 1.06, 0, 0.006, 0.3, "chrome", 4); f.cyl(-0.1, 1.06, 0, 0.006, 0.3, "chrome", 4)
	return m
func shelf(x: float, y: float, z: float, k: int, w := 1.2, h := 1.8, d := 0.35, mat = "wood_d", fill := true) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, mat); f.box(-w / 2, 0, -d / 2, -w / 2 + 0.04, h, d / 2, mat, NS); f.box(w / 2 - 0.04, 0, -d / 2, w / 2, h, d / 2, mat, NS)
	add_solid(minf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2)), y, minf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2)), maxf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2)), y + h, maxf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2)), "wood")
	var n := roundi(h / 0.45)
	for i in n + 1:
		var yy := i * h / n; f.box(-w / 2 + 0.04, yy, -d / 2, w / 2 - 0.04, yy + 0.03, d / 2, mat, NS)
		if fill and i < n:
			var xx := -w / 2 + 0.08; var r := mulberry(int((x * 7 + z * 13 + i) * 1000))
			while xx < w / 2 - 0.12:
				var bw := 0.03 + r.next() * 0.05; var bh := 0.2 + r.next() * 0.16; var col: String = ["bookc", "red", "blue", "green", "yellow", "brown", "teal", "cream"][int(r.next() * 8)]
				f.box(xx, yy + 0.03, -d / 2 + 0.05, xx + bw, yy + 0.03 + bh, d / 2 - 0.04, col, NS); xx += bw + (0.12 if r.next() < 0.15 else 0.005)
func counter(x: float, y: float, z: float, k: int, w: float, d := 0.62, h := 0.9, top = "lgrey", body = "cab") -> XFo:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -d / 2, w / 2, h - 0.04, d / 2 - 0.02, body); f.box(-w / 2 - 0.02, h - 0.04, -d / 2, w / 2 + 0.02, h, d / 2 + 0.02, top); f.box(-w / 2, 0, d / 2 - 0.06, w / 2, 0.1, d / 2 - 0.02, "black", NS)
	return f
func upperCab(x: float, y: float, z: float, k: int, w: float, mat = "cab") -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -0.17, w / 2, 0.7, 0.17, mat)
	var xx := -w / 2
	while xx < w / 2 - 0.01:
		f.box(xx + 0.02, 0.04, 0.17, xx + 0.48, 0.66, 0.19, "cabd", NS); xx += 0.5
func lamp(x: float, y: float, z: float, h := 1.5) -> void:
	cyl(x, y, z, 0.16, 0.03, "dgrey", 10); cyl(x, y, z, 0.02, h, "chrome", 6); cyl(x, y + h - 0.05, z, 0.22, 0.32, "lamp", 12, {rt = 0.12}); add_solid(x - 0.12, y, z - 0.12, x + 0.12, y + h, z + 0.12, "metal")
func ceilLamp(x: float, y: float, z: float) -> void:
	cyl(x, y - 0.3, z, 0.01, 0.3, "black", 4); W.sphere(x, y - 0.38, z, 0.13, MATS.bulb, 1, 0.7, 1); cyl(x, y - 0.36, z, 0.2, 0.12, "lamp", 12, {rt = 0.06})
func rug(x0: float, z0: float, x1: float, z1: float, y: float, mat = "carpet_r") -> void:
	box(x0, y, z0, x1, y + 0.015, z1, mat, {solid = false, uv = maxf(x1 - x0, z1 - z0)})
func picture(x: float, y: float, z: float, k: int, w := 0.6, h := 0.45, seed := 1) -> void:
	var f := XF(x, y, z, k); f.box(-w / 2, 0, -0.02, w / 2, h, 0.02, "wood_d", NS); var r := mulberry(seed * 991); var cols := ["sid_blue", "green", "yellow", "blue", "pink", "teal", "orange"]
	f.box(-w / 2 + 0.05, 0.05, 0.02, w / 2 - 0.05, h - 0.05, 0.025, ["cream", "lgrey"][seed % 2], NS); f.box(-w / 2 + 0.08, 0.08, 0.025, w / 2 - 0.08, h * 0.45, 0.03, cols[int(r.next() * 7)], NS); f.box(-w / 2 + 0.08, h * 0.45, 0.025, w / 2 - 0.08, h - 0.08, 0.028, ["sid_blue", "teal", "cream"][seed % 3], NS)
	f.sphere(w * (r.next() - 0.5) * 0.5, h * 0.62, 0.03, 0.05, "yellow", 1, 1, 0.2)
func plant(x: float, y: float, z: float, s := 1.0) -> void:
	cyl(x, y, z, 0.16 * s, 0.3 * s, "pot_c", 10, {rt = 0.2 * s})
	for i in 5:
		var a := i / 5.0 * TAU; W.sphere(x + cos(a) * 0.1 * s, y + 0.45 * s + (i % 2) * 0.1 * s, z + sin(a) * 0.1 * s, 0.16 * s, MATS.leafm, 1, 1.2, 1)
	add_solid(x - 0.18 * s, y, z - 0.18 * s, x + 0.18 * s, y + 0.7 * s, z + 0.18 * s, "wood")
func toilet(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.2, 0, -0.35, 0.2, 0.42, 0.15, "porcelain"); f.box(-0.22, 0.42, -0.36, 0.22, 0.46, 0.18, "porcelain", NS); f.box(-0.24, 0.4, -0.42, 0.24, 0.85, -0.26, "porcelain")
func tub(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.4, 0, -0.85, 0.4, 0.55, 0.85, "porcelain"); f.box(-0.33, 0.3, -0.78, 0.33, 0.52, 0.78, "water", NS); f.cyl(0, 0.55, -0.8, 0.02, 0.25, "chrome", 6)
func sinkUnit(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.3, 0, -0.22, 0.3, 0.8, 0.22, "cab"); f.box(-0.32, 0.8, -0.24, 0.32, 0.86, 0.24, "porcelain"); f.cyl(0, 0.86, -0.14, 0.02, 0.18, "chrome", 6); f.box(-0.25, 1.2, -0.24, 0.25, 1.75, -0.22, "mirror", NS)
func washer(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.3, 0, -0.3, 0.3, 0.88, 0.3, "fridge"); f.cyl(0, 0.45, 0.3, 0.2, 0.02, "glassb", 16, {axis = "z"}); f.box(-0.25, 0.78, 0.3, 0.25, 0.84, 0.31, "lgrey", NS)
func crate(x: float, y: float, z: float, s := 0.6, mat = "raw") -> void:
	box(x - s / 2, y, z - s / 2, x + s / 2, y + s, z + s / 2, mat, {uv = s}); box(x - s / 2 - 0.01, y + s * 0.4, z - s / 2 - 0.01, x + s / 2 + 0.01, y + s * 0.55, z + s / 2 + 0.01, "beam", {solid = false, uv = s})
func barrel(x: float, y: float, z: float, mat = "rust") -> void:
	cyl(x, y, z, 0.3, 0.9, mat, 12, {solid = true, s = "metal"}); cyl(x, y + 0.2, z, 0.31, 0.05, "metal_dark", 12); cyl(x, y + 0.65, z, 0.31, 0.05, "metal_dark", 12)
func fireplace(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.8, 0, -0.3, 0.8, 1.1, 0.25, "brick"); f.box(-0.45, 0, 0.0, 0.45, 0.7, 0.26, "black", NS); f.box(-0.9, 1.1, -0.32, 0.9, 1.18, 0.32, "wood_d"); f.box(-0.5, 1.18, -0.3, 0.5, 2.8, 0.1, "brick")
func desk(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.box(-0.7, 0.72, -0.35, 0.7, 0.77, 0.35, "wood_m"); f.box(-0.7, 0, -0.35, -0.25, 0.72, 0.35, "wood_m"); f.box(0.62, 0, -0.35, 0.7, 0.72, 0.35, "wood_m")
	f.box(-0.65, 0.2, 0.35, -0.3, 0.66, 0.36, "cabd", NS); f.box(-0.2, 0.77, -0.2, 0.15, 0.8, 0.1, "cream", NS)
func coatRack(x: float, y: float, z: float) -> void:
	cyl(x, y, z, 0.03, 1.8, "wood_d", 6); cyl(x, y, z, 0.2, 0.03, "wood_d", 8)
	for i in 4:
		var a := i / 4.0 * TAU; cyl(x + cos(a) * 0.12, y + 1.65, z + sin(a) * 0.12, 0.02, 0.12, "wood_d", 4)
	W.sphere(x + 0.12, y + 1.45, z, 0.13, MATS.fab_r, 1, 2.5, 1)
func clockWall(x: float, y: float, z: float, k: int) -> void:
	var f := XF(x, y, z, k); f.cyl(0, 0, 0, 0.18, 0.04, "cream", 16, {axis = "z"})
# ---- 開け閉めできる家具 ----
# 戸棚（両開き）：ローカルで前が+Z。中に物を入れられる。hide=true なら隠れられる
func wardrobe(x: float, y: float, z: float, k: int, o := {}) -> Dictionary:
	var w: float = o.get("w", 1.1); var d: float = o.get("d", 0.6); var h: float = o.get("h", 2.0); var mat = o.get("mat", "wood_d"); var f := XF(x, y, z, k)
	# 箱（前はあいている）
	f.box(-w / 2, 0, -d / 2, w / 2, 0.08, d / 2, mat, {s = "wood"}); f.box(-w / 2, h - 0.06, -d / 2, w / 2, h, d / 2, mat); f.box(-w / 2, 0, -d / 2, -w / 2 + 0.04, h, d / 2, mat); f.box(w / 2 - 0.04, 0, -d / 2, w / 2, h, d / 2, mat)
	if not o.get("noBack"): f.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, mat)
	if o.get("shelf"): f.box(-w / 2 + 0.04, o.shelf, -d / 2 + 0.03, w / 2 - 0.04, o.shelf + 0.04, d / 2 - 0.02, mat)
	if not o.get("noRod") and not o.get("shelf"):
		f.cyl(0, h - 0.25, 0, 0.015, w - 0.1, "chrome", 6, {axis = "x", rot = f.yaw})
		for i in 3:
			var hx := -w / 2 + 0.2 + i * (w - 0.4) / 2; f.box(hx - 0.2, h - 0.9, -0.03, hx + 0.2, h - 0.28, 0.03, ["fab_r", "fab_b", "fab_y"][i], NS)
	# 扉2枚
	var leaves := []; var ax := "z" if k % 2 else "x"; var fz := d / 2 + 0.015
	for side in [-1, 1]:
		var hp := f.p(side * w / 2, 0, fz); var cp := f.p(side * w / 4, 0, fz)
		var hs := sgn(hp.x - cp.x) if ax == "x" else sgn(hp.z - cp.z); var fr := f.dir(0, 1); var sw: float = sgn(fr[1]) if ax == "x" else sgn(fr[0])
		leaves.append(mkLeaf({x = cp.x, y = y + 0.04, z = cp.z, w = w / 2 - 0.01, h = h - 0.08, axis = ax, hinge = hs, swing = sw, mat = o.get("lm", mat), t = 0.03, ang = PI * 0.62,
			deco = func(mb: MB, s: float, ww: float, hh: float, t: float) -> void:
				mb.box(minf(s * ww * 0.15, s * ww * 0.85), hh * 0.1, t / 2, maxf(s * ww * 0.15, s * ww * 0.85), hh * 0.45, t / 2 + 0.01, MATS.cabd, 63, 1)
				mb.box(minf(s * ww * 0.15, s * ww * 0.85), hh * 0.55, t / 2, maxf(s * ww * 0.15, s * ww * 0.85), hh * 0.9, t / 2 + 0.01, MATS.cabd, 63, 1)}))
	var bx := Box.new(minf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2 + 0.05)), y, minf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2 + 0.05)), maxf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2 + 0.05)), y + h, maxf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2 + 0.05)))
	var cab := {leaves = leaves, props = [], f = f, frame = func() -> Transform3D: return Transform3D(Basis(Vector3.UP, f.yaw), f.p(0, 0, 0)), front = null, hide = null, it = null, c = null}
	# 閉まっているときの前の当たり
	var a := f.p(-w / 2, 0, d / 2 - 0.02); var b := f.p(w / 2, 0, d / 2 + 0.03)
	cab.front = dyn_box(minf(a.x, b.x), y, minf(a.z, b.z), maxf(a.x, b.x), y + h, maxf(a.z, b.z), "wood", cab)
	if o.get("hide"):
		var out := f.p(0, 0, d / 2 + 0.55)
		cab.hide = mkHide({pos = f.p(0, 1.3, 0), yaw = f.yaw + PI, box = bx, cab = cab, name = o.get("name", "クローゼット"), out = {x = out.x, y = y + 0.02, z = out.z}})
	else:
		var c := mkCabinet(bx, leaves, o.get("name", "戸棚"), {onToggle = func(op): cab.front.on = not op})
		cab.it = c.it; cab.c = c
	return cab
# 冷蔵庫（上が冷凍庫）
func fridgeUnit(x: float, y: float, z: float, k: int) -> Dictionary:
	var f := XF(x, y, z, k); var w := 0.86; var d := 0.72; var h := 1.85
	f.box(-w / 2, 0, -d / 2, w / 2, h, d / 2 - 0.04, "fridge"); f.box(-w / 2 + 0.04, 0.04, -d / 2 + 0.06, w / 2 - 0.04, h - 0.04, d / 2 - 0.04, "fridgein", NS); f.box(-w / 2 + 0.04, 1.25, -d / 2 + 0.06, w / 2 - 0.04, 1.29, d / 2 - 0.05, "fridge", NS)
	f.box(-w / 2 + 0.06, 0.55, -d / 2 + 0.08, w / 2 - 0.06, 0.57, d / 2 - 0.06, "glass", NS)
	var ax := "z" if k % 2 else "x"; var fz := d / 2 - 0.02
	var mkL := func(y0: float, hh: float) -> Dictionary:
		var hp := f.p(-w / 2, 0, fz); var cp := f.p(0, 0, fz)
		var hs := sgn(hp.x - cp.x) if ax == "x" else sgn(hp.z - cp.z); var fr := f.dir(0, 1); var sw: float = sgn(fr[1]) if ax == "x" else sgn(fr[0])
		return mkLeaf({x = cp.x, y = y + y0, z = cp.z, w = w, h = hh, axis = ax, hinge = hs, swing = sw, mat = "fridge", t = 0.06, ang = PI * 0.55, ky = 0.5, km = "lgrey"})
	var low: Dictionary = mkL.call(0.02, 1.22); var top: Dictionary = mkL.call(1.27, 0.56)
	var bL := Box.new(minf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2 + 0.05)), y, minf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2 + 0.05)), maxf(f.tx(-w / 2, -d / 2), f.tx(w / 2, d / 2 + 0.05)), y + 1.25, maxf(f.tz(-w / 2, -d / 2), f.tz(w / 2, d / 2 + 0.05)))
	var bT := Box.new(bL.x0, y + 1.27, bL.z0, bL.x1, y + h, bL.z1)
	var cl := mkCabinet(bL, [low], "冷蔵庫", {snd = "fridge"}); var ct := mkCabinet(bT, [top], "冷凍庫", {snd = "fridge"})
	return {f = f, low = low, top = top, cl = cl, ct = ct, frame = func() -> Transform3D: return Transform3D(Basis(Vector3.UP, f.yaw), f.p(0, 0, 0)), props = []}
# コンロ
func stoveUnit(x: float, y: float, z: float, k: int) -> XFo:
	var f := XF(x, y, z, k); f.box(-0.32, 0, -0.3, 0.32, 0.88, 0.3, "fridge"); f.box(-0.33, 0.88, -0.31, 0.33, 0.92, 0.31, "black")
	for ab in [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]]: f.cyl(ab[0], 0.92, ab[1], 0.08, 0.01, "dgrey", 10)
	f.box(-0.26, 0.15, 0.3, 0.26, 0.65, 0.31, "black", NS); f.box(-0.32, 0.92, -0.31, 0.32, 1.15, -0.27, "fridge")
	for i in 4: f.cyl(-0.21 + i * 0.14, 1.0, -0.26, 0.025, 0.02, "black", 8, {axis = "z"})
	return f

# ================= 町（通り・家の外まわりの部品）=================
# 三角の妻壁（屋根の下の三角）
func gable(x: float, z0: float, z1: float, y0: float, y1: float, mat, axis := "z", t := 0.3) -> void:
	var L := absf(z1 - z0)
	var g := G.extrude(PackedVector2Array([Vector2(0, 0), Vector2(L, 0), Vector2(L / 2, y1 - y0)]), t)
	var tr: Transform3D
	if axis == "z": tr = Transform3D(Basis(Vector3.UP, -PI / 2), Vector3(x + t / 2, y0, minf(z0, z1)))
	else: tr = Transform3D(Basis(), Vector3(minf(z0, z1), y0, x - t / 2))
	var m := M(mat); var uv := muv(m)
	W.geo(g, tr, m, 1.0 / uv, 1.0 / uv)
# 切妻屋根：棟がXにそう（z0..z1 の家、y0 からの高さ rise）
func roofX(x0: float, x1: float, z0: float, z1: float, y0: float, rise: float, mat, over := 0.5, th := 0.18) -> void:
	var zc := (z0 + z1) / 2; var half := (z1 - z0) / 2 + over; var ang := atan2(rise, (z1 - z0) / 2); var len := half / cos(ang)
	var cy := y0 + (rise - over * tan(ang)) / 2 + th / 2
	rbox((x0 + x1) / 2, cy, zc - half / 2, x1 - x0 + over * 2, th, len, -ang, 0, 0, mat)
	rbox((x0 + x1) / 2, cy, zc + half / 2, x1 - x0 + over * 2, th, len, ang, 0, 0, mat)
	box(x0 - over, y0 + rise - 0.02, zc - 0.12, x1 + over, y0 + rise + 0.2, zc + 0.12, "roof_dark", {solid = false})
	# 雨どい
	var ey := y0 - over * tan(ang)
	box(x0 - over, ey - 0.1, z0 - over - 0.08, x1 + over, ey, z0 - over + 0.04, "trim", {solid = false}); box(x0 - over, ey - 0.1, z1 + over - 0.04, x1 + over, ey, z1 + over + 0.08, "trim", {solid = false})
# 車（ベータ1：ドアもトランクのふたもない）
func carModel(x: float, z: float, k: int, body) -> Dictionary:
	var f := XF(x, 0, z, k) # ローカル：前が+Z
	var MT := {s = "metal"}
	f.box(-0.9, 0.3, -1.1, 0.9, 0.85, 2.1, body, MT); f.box(-0.9, 0.3, -2.1, 0.9, 0.55, -1.1, body, MT); f.box(-0.9, 0.55, -2.1, -0.8, 0.85, -1.1, body, MT); f.box(0.8, 0.55, -2.1, 0.9, 0.85, -1.1, body, MT); f.box(-0.9, 0.55, -2.1, 0.9, 0.85, -2.0, body, MT); f.box(-0.8, 0.55, -2.0, 0.8, 0.56, -1.1, "black", NS); f.box(-0.85, 0.85, -1.1, 0.85, 1.45, 0.9, body, MT); f.box(-0.8, 0.9, -1.05, 0.8, 1.4, 0.85, "dgrey", NS)
	# 窓（空いている）と柱
	for zz in [-1.05, 0.85]: f.box(-0.85, 0.85, zz, 0.85, 1.45, zz + 0.05, "glass", NS)
	f.box(-0.85, 1.4, -1.1, 0.85, 1.45, 0.9, body, NS)
	for xx in [-0.86, 0.8]:
		for zz in [-1.1, -0.1, 0.86]: f.box(xx, 0.85, zz, xx + 0.06, 1.45, zz + 0.06, body, NS)
	# ドアの穴（ベータ1）
	for s in [-1, 1]: f.box(s * 0.905 - 0.01, 0.4, -0.9, s * 0.905 + 0.01, 0.84, 0.5, "black", NS)
	# 座席
	f.box(-0.75, 0.35, -0.6, 0.75, 0.75, 0, "fab_w", NS); f.box(-0.75, 0.75, -0.62, 0.75, 1.15, -0.48, "fab_w", NS); f.box(-0.75, 0.35, 0.1, -0.05, 0.7, 0.55, "fab_w", NS); f.box(0.05, 0.35, 0.1, 0.75, 0.7, 0.55, "fab_w", NS)
	# ライト
	f.box(-0.8, 0.55, 2.1, -0.5, 0.72, 2.12, "bulb", NS); f.box(0.5, 0.55, 2.1, 0.8, 0.72, 2.12, "bulb", NS); f.box(-0.85, 0.55, -2.12, -0.6, 0.7, -2.1, "red", NS); f.box(0.6, 0.55, -2.12, 0.85, 0.7, -2.1, "red", NS)
	f.box(-0.95, 0.3, 2.05, 0.95, 0.45, 2.2, "chrome", NS); f.box(-0.95, 0.3, -2.2, 0.95, 0.45, -2.05, "chrome", NS)
	for ab in [[-0.85, -1.35], [0.85, -1.35], [-0.85, 1.35], [0.85, 1.35]]:
		f.cyl(ab[0], 0.36, ab[1], 0.36, 0.24, "tire", 14, {axis = "x", rot = f.yaw}); f.cyl(ab[0] * 1.02, 0.36, ab[1], 0.2, 0.25, "chrome", 10, {axis = "x", rot = f.yaw})
	# トランク（ふたなし）：くぼみ
	return {f = f, trunk = f.p(0, 0.55, -1.65)}
func treeAt(x: float, z: float, s := 1.0, kind := 0) -> void:
	var r := mulberry(int((x * 31 + z * 17) * 100)); cyl(x, 0, z, 0.22 * s, 2.2 * s, "bark", 8, {solid = true, s = "wood"})
	if kind == 1:
		for i in 3: cyl(x, 1.6 * s + i * 1.1 * s, z, (2 - i * 0.5) * s, 1.6 * s, "leafm", 10, {rt = 0.1})
		return
	for i in 7:
		var a := r.next() * TAU; var d := r.next() * 1.1 * s
		W.sphere(x + cos(a) * d, 2.7 * s + r.next() * 1.6 * s, z + sin(a) * d, (1.1 + r.next() * 0.6) * s, MATS.leafm, 1, 0.85, 1, 9)
func bush(x: float, z: float, s := 1.0) -> void:
	var r := mulberry(int((x * 13 + z * 7) * 100))
	for i in 3: W.sphere(x + (r.next() - 0.5) * 0.6 * s, 0.35 * s, z + (r.next() - 0.5) * 0.6 * s, 0.5 * s, MATS.leafm, 1, 0.8, 1, 8)
	add_solid(x - 0.5 * s, 0, z - 0.5 * s, x + 0.5 * s, 0.8 * s, z + 0.5 * s, "grass")
func flowers(x0: float, z0: float, x1: float, z1: float) -> void:
	box(x0, 0, z0, x1, 0.12, z1, "dirt", {s = "dirt"}); var r := mulberry(int((x0 * 7 + z0) * 100))
	var x := x0 + 0.15
	while x < x1 - 0.1:
		var z := z0 + 0.15
		while z < z1 - 0.1:
			var c: String = ["red", "yellow", "pink", "orange", "cream", "blue"][int(r.next() * 6)]
			cyl(x + (r.next() - 0.5) * 0.1, 0.12, z + (r.next() - 0.5) * 0.1, 0.012, 0.25, "green", 4); W.sphere(x, 0.4, z, 0.06, MATS[c], 1, 0.7, 1, 6)
			z += 0.3
		x += 0.3
func picket(x0: float, z0: float, x1: float, z1: float, h := 0.95) -> void:
	var L := Vector2(x1 - x0, z1 - z0).length(); var n := floori(L / 0.18); var dx := (x1 - x0) / L; var dz := (z1 - z0) / L
	for i in n + 1:
		var x := x0 + dx * i * 0.18; var z := z0 + dz * i * 0.18; box(x - 0.04, 0, z - 0.04, x + 0.04, h, z + 0.04, "fence", {solid = false, uv = 1})
	box(minf(x0, x1) - 0.02, h * 0.3, minf(z0, z1) - 0.02, maxf(x0, x1) + 0.02, h * 0.38, maxf(z0, z1) + 0.02, "fence", {solid = false}); box(minf(x0, x1) - 0.02, h * 0.72, minf(z0, z1) - 0.02, maxf(x0, x1) + 0.02, h * 0.8, maxf(z0, z1) + 0.02, "fence", {solid = false})
	add_solid(minf(x0, x1) - 0.05, 0, minf(z0, z1) - 0.05, maxf(x0, x1) + 0.05, h, maxf(z0, z1) + 0.05, "wood")
func mailbox(x: float, z: float, col := "blue") -> void:
	cyl(x, 0, z, 0.05, 1, "wood_d", 6, {solid = true}); box(x - 0.14, 1, z - 0.25, x + 0.14, 1.25, z + 0.25, col, {s = "metal"}); box(x + 0.14, 1.1, z - 0.05, x + 0.17, 1.35, z, "red", {solid = false})
# 飾りの家
func fakeHouse(x: float, z: float, k: int, sid, roof, seed: int) -> void:
	var f := XF(x, 0, z, k); var r := mulberry(seed); var w := 8 + r.next() * 3; var d := 7 + r.next() * 2; var h := 3.0 + (3.0 if r.next() < 0.5 else 0.0)
	f.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, sid, {s = "wood"}); f.box(-w / 2 - 0.1, 0, -d / 2 - 0.1, w / 2 + 0.1, 0.3, d / 2 + 0.1, "stone", NS)
	# 窓とドア
	for xx in [-w / 4, w / 4]:
		var yy := 1.1
		while yy < h - 0.5:
			f.box(xx - 0.6, yy, d / 2, xx + 0.6, yy + 1.1, d / 2 + 0.05, "winf", NS); f.box(xx - 0.5, yy + 0.1, d / 2 + 0.05, xx + 0.5, yy + 1, d / 2 + 0.06, "glassd", NS)
			yy += 3
	f.box(-0.5, 0.3, d / 2, 0.5, 2.4, d / 2 + 0.06, "door_r", NS)
	var c := f.p(0, 0, 0); var rise := 2.2; var over := 0.6; var ang := atan2(rise, d / 2); var L := (d / 2 + over) / cos(ang); var cy := h + (rise - over * tan(ang)) / 2 + 0.1
	if k % 2 == 0:
		rbox(c.x, cy, c.z - (d / 2 + over) / 2, w + 1, 0.2, L, -ang, 0, 0, roof); rbox(c.x, cy, c.z + (d / 2 + over) / 2, w + 1, 0.2, L, ang, 0, 0, roof)
		gable(c.x - w / 2, c.z - d / 2, c.z + d / 2, h, h + rise, sid, "z", 0.1); gable(c.x + w / 2, c.z - d / 2, c.z + d / 2, h, h + rise, sid, "z", 0.1)
	else:
		rbox(c.x - (d / 2 + over) / 2, cy, c.z, L, 0.2, w + 1, 0, 0, ang, roof); rbox(c.x + (d / 2 + over) / 2, cy, c.z, L, 0.2, w + 1, 0, 0, -ang, roof)
		gable(c.z - w / 2, c.x - d / 2, c.x + d / 2, h, h + rise, sid, "x", 0.1); gable(c.z + w / 2, c.x - d / 2, c.x + d / 2, h, h + rise, sid, "x", 0.1)
func beam(x0: float, y0: float, z0: float, x1: float, y1: float, z1: float, s := 0.2, mat = "beam") -> void:
	var dx := x1 - x0; var dy := y1 - y0; var dz := z1 - z0; var L := Vector3(dx, dy, dz).length(); var yaw := atan2(dx, dz); var pit := -atan2(dy, Vector2(dx, dz).length())
	rbox((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, s, s, L, pit, yaw, 0, mat)
# 打ちつけた板（ハンマーかバールではがす）
func mkDoorBoard(x: float, y: float, z: float, ang: float) -> Dictionary:
	var m := mesh(G.box(1.35, 0.18, 0.05), MATS.raw, true); m.position = Vector3(x, y, z); m.rotation.z = ang; scene.add_child(m)
	var nails := []
	for s in [-1, 1]:
		var n := mesh(G.cylinder(0.015, 0.015, 0.03, 6), MATS.metal_dark); n.rotation.x = PI / 2; n.position = Vector3(x + s * 0.58 * cos(ang), y + s * 0.58 * sin(ang), z - 0.03); scene.add_child(n); nails.append(n)
	var B := {m = m, nails = nails, on = false, x = x, y = y, z = z, it = null}
	B.set = func(on: bool) -> void:
		B.on = on; m.visible = on
		for n in nails: n.visible = on
	B.it = addIt({box = Box.new(x - 0.62, y - 0.3, z - 0.08, x + 0.62, y + 0.3, z + 0.04), label = func(_it): return {t = "板が打ちつけてある", k = "", n = "板"} if B.on else null,
		act = func():
			if B.on: toast("ハンマーかバールがあればはがせそう"),
		use = func(it):
			if B.on and (it.type == "crowbar" or it.type == "hammer"):
				pryBoard(B); return true
			return false,
		useLabel = func(it): return "バールで板をはがす" if B.on and it.type == "crowbar" else "ハンマーで板をはがす" if B.on and it.type == "hammer" else null})
	B.set.call(false)
	return B
func pryBoard(B: Dictionary) -> void:
	sfx("pry"); PL.swing = 0.5; noise(B.x, B.y, B.z, 9, "pry")
	after(0.45, func():
		B.set.call(false); sfx("boardfall"); var p := spawnProp("board", B.x, B.y - 0.1, B.z - 0.25, 0); propDropAt(p, B.x, B.y - 0.1, B.z - 0.3, PI / 2, Vector3(0, 1, -1.2))
		if story.get("onBoard"): story.onBoard.call(B))

# ================= おとなりさんの家（アルファ1）=================
# 本体 x:-10..10 z:14..32、ガレージ x:-17..-10 z:14..24
# 1階の床 0.3 / 1階の天井 3.2（水びたしの部屋の下は 2.8）/ 2階の床 3.5 / 2階の天井 6.4
var A := {}
const F1 := 0.3
const C1 := 3.2
const F2 := 3.5
const C2 := 6.4
const F3 := 6.7
const PT := 2.8
const WS := 3.45 # PT:プールの底の下 WS:水面
func buildA1House() -> void:
	var T := 0.3; var t := 0.15
	# ================= 1階 =================
	# 床
	slab(-10, 14, -2, 22, F1, 0.3, "floor", null); slab(-2, 14, 2, 32, F1, 0.3, "floor_dark", null); slab(2, 14, 10, 21.4, F1, 0.3, "tile_k", null, {s = "tile"})
	slab(2, 21.4, 6, 26, F1, 0.3, "floor", null); slab(6, 21.4, 10, 26, F1, 0.3, "floor", null); slab(2, 26, 6, 32, F1, 0.3, "concrete", null, {s = "stone"}); slab(6, 26, 10, 32, F1, 0.3, "tile_w", null, {s = "tile"})
	slab(-10, 27, -2, 32, F1, 0.3, "floor", null); slab(-10, 22, -7, 22.9, F1, 0.3, "concrete", null, {s = "stone"})
	# 墓の部屋：まん中に穴
	slab(-7, 22, -2, 23.4, F1, 0.3, "floor_dark", null); slab(-7, 25.6, -2, 27, F1, 0.3, "floor_dark", null); slab(-7, 23.4, -5.6, 25.6, F1, 0.3, "floor_dark", null); slab(-3.4, 23.4, -2, 25.6, F1, 0.3, "floor_dark", null)
	box(-5.6, -1.2, 23.4, -3.4, -1, 25.6, "dirt", {s = "dirt"})
	for q in [[-5.6, 23.4, -5.5, 25.6], [-3.5, 23.4, -3.4, 25.6], [-5.6, 23.4, -3.4, 23.5], [-5.6, 25.5, -3.4, 25.6]]: box(q[0], -1.2, q[1], q[2], F1, q[3], "dirt", {s = "dirt"})
	# ガレージの床
	slab(-17, 14, -10, 24, 0.1, 0.1, "concrete", null, {s = "stone"})
	# 土台（外まわり）
	for q in [[-10.4, 13.6, 10.4, 13.85], [-10.4, 32.15, 10.4, 32.4], [-10.4, 24, -10.15, 32.15], [10.15, 13.85, 10.4, 32.15]]: box(q[0], 0, q[1], q[2], 0.32, q[3], "stone", {solid = false})
	# 外壁（1階）
	wallX(-10.15, -2, 14, 0, F2, T, "sid_orange", "wp_wine", [[-8.5, -6, 1.1, 2.3], [-5, -3, 1.1, 2.3]]); wallX(-2, 2, 14, 0, F2, T, "sid_orange", "wp_brown", [[-1.1, 1.1, F1, 2.6]]); wallX(2, 10.15, 14, 0, F2, T, "sid_orange", "wp_yellow", [[4, 6, 1.1, 2.3], [7.2, 9.2, 1.1, 2.3]])
	wallX(-10.15, -2, 32, 0, F2, T, "wp_leafblue", "sid_orange", [[-8, -5, 1.1, 2.2]]); wallX(-2, 2, 32, 0, F2, T, "wp_brown", "sid_orange", [[-0.8, 0.8, 1.2, 2.4]]); wallX(2, 6, 32, 0, F2, T, "concrete", "sid_orange", [[3.52, 4.48, F1, 2.5]]); wallX(6, 10.15, 32, 0, F2, T, "tile_b", "sid_orange", [[7.5, 8.5, 1.6, 2.4]])
	wallZ(14.15, 24, -10, 0, F2, T, "raw", "wp_wine", [[16.52, 17.48, F1, 2.4]]); wallZ(24, 27, -10, 0, F2, T, "sid_orange", "concrete"); wallZ(27, 31.85, -10, 0, F2, T, "sid_orange", "wp_leafblue", [[28.5, 30.5, 1.1, 2.2]])
	wallZ(14.15, 21.4, 10, 0, F2, T, "wp_yellow", "sid_orange", [[16, 18, 1.1, 2.3]]); wallZ(21.4, 26, 10, 0, F2, T, "wp_gstripe", "sid_orange", [[22.8, 24.6, 1.1, 2.3]]); wallZ(26, 31.85, 10, 0, F2, T, "tile_b", "sid_orange")
	# 中の壁（1階）
	wallZ(14.15, 22, -2, F1, C1, t, "wp_wine", "wp_brown", [[15, 17.5, F1, 2.9]]); wallZ(22, 27, -2, F1, C1, t, "wp_floral", "wp_brown", [[24.02, 24.98, F1, 2.45]]); wallZ(27, 31.85, -2, F1, C1, t, "wp_leafblue", "wp_brown", [[29.02, 29.98, F1, 2.45]])
	wallZ(14.15, 19, 2, F1, C1, t, "wp_brown", "wp_yellow", [[15.52, 16.48, F1, 2.45]]); wallZ(19, 21.4, 2, F1, C1, t, "wp_brown", "metal_dark", [[19.6, 20.8, F1, 2.55]]); wallZ(21.4, 26, 2, F1, C1, t, "wp_brown", "wp_teal", [[23.02, 23.98, F1, 2.45]]); wallZ(26, 31.85, 2, F1, C1, t, "wp_brown", "concrete", [[28.52, 29.48, F1, 2.45]])
	wallZ(19, 21.4, 4.2, F1, C1, t, "metal_dark", "wp_yellow"); wallX(2, 4.2, 19, F1, C1, t, "wp_yellow", "metal_dark"); wallX(2, 4.2, 21.4, F1, C1, t, "metal_dark", "wp_teal")
	wallX(4.2, 6, 21.4, F1, C1, t, "wp_yellow", "wp_teal"); wallX(6, 9.85, 21.4, F1, C1, t, "wp_yellow", "wp_gstripe"); wallZ(21.4, 26, 6, F1, C1, t, "wp_teal", "wp_gstripe"); wallZ(26, 31.85, 6, F1, C1, t, "concrete", "tile_b", [[28.52, 29.48, F1, 2.45]])
	wallX(2.075, 6, 26, F1, C1, t, "wp_teal", "concrete"); wallX(6, 9.85, 26, F1, C1, t, "wp_gstripe", "tile_b", [[8.02, 8.98, F1, 2.45]])
	wallX(-9.85, -7, 22, F1, C1, t, "wp_wine", "concrete", [[-8.1, -7.1, F1, 2.4]]); wallX(-7, -2.075, 22, F1, C1, t, "wp_wine", "wp_floral"); wallX(-8.6, -2.075, 22, C1, F2, t, "wp_wine", "tile_b"); wallZ(22.075, 27, -7, F1, PT, t, "concrete", "wp_floral")
	wallX(-9.85, -7, 27, F1, PT, t, "concrete", "wp_leafblue"); wallX(-7, -2.075, 27, F1, PT, t, "wp_floral", "wp_leafblue", [[-6.2, -5.4, F1, 2.35], [-3.7, -2.9, F1, 2.35]])
	# 幅木
	for q in [[-9.85, 14.15, -2.1, 14.22], [-1.9, 14.15, 1.9, 14.22], [2.1, 14.15, 9.85, 14.22], [-6.9, 22.08, -2.1, 22.15], [-9.85, 27.08, -2.1, 27.15], [6.1, 21.48, 9.85, 21.55]]: box(q[0], F1, q[1], q[2], F1 + 0.1, q[3], "trim", {solid = false})
	# 1階の天井（水びたしの部屋の下は低い）
	box(-10.15, C1, 14, 10.15, C1 + 0.01, 20.85, "white", {solid = false, f = 8}); box(-10.15, C1, 20.85, -8.6, C1 + 0.01, 22, "white", {solid = false, f = 8}); box(-2, C1, 20.85, 10.15, C1 + 0.01, 22, "white", {solid = false, f = 8}); box(-2, C1, 22, 10.15, C1 + 0.01, 32.15, "white", {solid = false, f = 8})
	# ================= 階段（居間の北の壁ぞい、東から西へ上がる）=================
	# 下に1mほどの踊り場（南から入って、西へ上る）
	var SX := -3.1; var SR := 0.34
	for i in 16:
		var x1 := SX - SR * i; var x0 := x1 - SR; var y := F1 + 0.2 * (i + 1); var low := y < 2.45
		box(x0, F1 if low else y - 0.25, 20.85, x1, y, 21.925, "floor", {uv = 1.2}); box(x0 - 0.02, y - 0.03, 20.83, x1, y, 21.93, "rail_o", {solid = false})
	# 手すり（オレンジ）
	rbox(SX - SR * 8, F1 + 1.6 + 0.95, 20.85, Vector2(SR * 16, 3.2).length(), 0.07, 0.07, 0, 0, atan2(3.2, SR * 16), "rail_o")
	for i in range(1, 16, 2):
		var x := SX - SR * (i + 0.5); box(x - 0.03, F1 + 0.2 * (i + 1), 20.84, x + 0.03, F1 + 0.2 * (i + 1) + 0.95, 20.9, "rail_o", {solid = false})
	box(SX - 0.08, F1, 20.8, SX + 0.07, F1 + 1.2, 20.95, "rail_o", {s = "wood"})
	# 地下室のドア（階段の下、EXIT の看板）
	A.base = mkDoor({x = -7.6, z = 22, y = F1, w = 0.96, h = 2.1, axis = "x", hinge = -1, swing = 1, mat = "doorc", panel = "doorc2", arch = true, name = "地下室のドア"})
	A.exitSign = signp(-7.6, 2.52, 21.92, 0.62, 0.22, "exit", PI); box(-7.95, 2.4, 21.9, -7.25, 2.64, 21.925, "black", {solid = false})
	A.exitLight = plight("#50ff80", 0, 3, 2); A.exitLight.position = Vector3(-7.6, 2.4, 21.6); scene.add_child(A.exitLight)
	# ================= 2階 =================
	slab(-10, 14, -2, 20.85, F2, 0.3, "floor", "white"); slab(-10, 20.85, -8.6, 22, F2, 0.3, "floor", "white"); slab(-2, 14, 2, 32, F2, 0.3, "floor_dark", "white"); slab(2, 14, 10, 19, F2, 0.3, "floor", "white"); slab(4.2, 19, 10, 21.4, F2, 0.3, "floor_dark", "white")
	slab(2, 21.4, 6, 27, F2, 0.3, "floor", "white"); slab(6, 21.4, 10, 23.2, F2, 0.3, "tile_w", "white", {s = "tile"}); slab(6, 24.8, 10, 27, F2, 0.3, "tile_w", "white", {s = "tile"}); slab(6, 23.2, 6.9, 24.8, F2, 0.3, "tile_w", "white", {s = "tile"}); slab(8.5, 23.2, 10, 24.8, F2, 0.3, "tile_w", "white", {s = "tile"})
	slab(2, 27, 6, 32, F2, 0.3, "floor_dark", "white"); slab(6, 27, 10, 32, F2, 0.3, "floor", "white")
	# 床の穴のふち（こわれた板）
	for q in [[6.9, 23.2, 7.1, 24.8], [8.3, 23.2, 8.5, 24.8]]: rbox((q[0] + q[2]) / 2, F2 - 0.05, (q[1] + q[3]) / 2, 0.2, 0.06, 1.6, 0.2, 0, 0.3, "floor")
	# 水びたしの部屋のプール（下の部屋の天井）
	slab(-10, 22, -2, 32, 2.95, 0.15, "tile_b", "white", {s = "tile"})
	slab(-10, 22, -8.6, 23.2, F2, 0.55, "floor", null); box(-10, 2.95, 23.2, -8.6, 3.2, 23.7, "floor", {}); slab(-3.4, 29.6, -2, 31.85, F2, 0.55, "floor", null); box(-3.9, 2.95, 29.6, -3.4, 3.2, 31.85, "floor", {})
	box(-10.15, C2, 13.85, 10.15, C2 + 0.3, 32.15, "white", {f = 8 | 1 | 2 | 16 | 32})
	# 外壁（2階）
	wallX(-10.15, -7, 14, F2, F3, T, "sid_yel2", "floor_dark", [[-9.2, -8, 4.5, 5.4]]); wallX(-7, -2, 14, F2, F3, T, "sid_yel2", "wp_leafblue", [[-5.5, -3.5, 4.4, 5.6]]); wallX(-2, 2, 14, F2, F3, T, "sid_yel2", "wp_brown", [[-0.8, 0.8, 4.4, 5.6]]); wallX(2, 10.15, 14, F2, F3, T, "sid_yel2", "plaster", [[3.5, 5, 4.6, 5.5], [7, 8.5, 4.6, 5.5]])
	wallX(-10.15, -2, 32, F2, F3, T, "wp_navy", "sid_yel2", [[-7, -5, 4.5, 5.7]]); wallX(-2, 2, 32, F2, F3, T, "wp_brown", "sid_yel2"); wallX(2, 6, 32, F2, F3, T, "raw", "sid_yel2"); wallX(6, 10.15, 32, F2, F3, T, "wp_kids2", "sid_yel2", [[7.2, 8.8, 4.4, 5.6]])
	wallZ(14.15, 17.5, -10, F2, F3, T, "sid_yel2", "floor_dark"); wallZ(17.5, 20.85, -10, F2, F3, T, "sid_yel2", "raw"); wallZ(20.85, 22, -10, F2, F3, T, "sid_yel2", "wp_wine"); wallZ(22, 31.85, -10, F2, F3, T, "sid_yel2", "wp_navy", [[26, 28, 4.5, 5.7]])
	wallZ(14.15, 19, 10, F2, F3, T, "plaster", "sid_yel2"); wallZ(19, 21.4, 10, F2, F3, T, "wp_brown", "sid_yel2"); wallZ(21.4, 27, 10, F2, F3, T, "tile_b", "sid_yel2", [[24, 25.5, 4.5, 5.5]]); wallZ(27, 31.85, 10, F2, F3, T, "wp_kids2", "sid_yel2", [[29.02, 29.98, F2, 5.6]])
	# 中の壁（2階）
	wallZ(14.15, 20.85, -2, F2, C2, t, "wp_leafblue", "wp_brown", [[19.32, 20.28, F2, 5.55]]); wallZ(20.85, 22, -2, F2, C2, t, "wp_wine", "wp_brown"); wallZ(22, 31.85, -2, F2, C2, t, "wp_navy", "wp_brown", [[30.42, 31.38, F2, 5.55]])
	wallX(-9.85, -2.075, 20.85, F2, C2, t, "raw", "wp_wine"); wallX(-9.85, -2.075, 22, F2, C2, t, "wp_wine", "wp_navy", [[-9.85, -8.6, F2, 5.8]])
	wallZ(14.15, 20.85, -7, F2, C2, t, "raw", "wp_leafblue", [[19.22, 20.18, F2, 5.55]]); wallX(-9.85, -7, 17.5, F2, C2, t, "floor_dark", "raw", [[-9.02, -8.08, F2, 5.55]])
	wallZ(14.15, 19, 2, F2, C2, t, "wp_brown", "plaster", [[15.02, 15.98, F2, 5.55]]); wallZ(19, 21.4, 2, F2, C2, t, "wp_brown", "metal_dark", [[19.6, 20.8, F2, 5.75]]); wallZ(21.4, 27, 2, F2, C2, t, "wp_brown", "brick", [[23.02, 23.98, F2, 5.55]]); wallZ(27, 31.85, 2, F2, C2, t, "wp_brown", "raw")
	wallZ(19, 21.4, 4.2, F2, C2, t, "metal_dark", "wp_brown"); wallX(2, 4.2, 19, F2, C2, t, "plaster", "metal_dark"); wallX(2, 4.2, 21.4, F2, C2, t, "metal_dark", "brick")
	wallX(4.2, 9.85, 19, F2, C2, t, "plaster", "wp_brown", [[8.52, 9.48, F2, 5.55]]); wallX(4.2, 6, 21.4, F2, C2, t, "wp_brown", "brick"); wallX(6, 9.85, 21.4, F2, C2, t, "wp_brown", "tile_b", [[8.52, 9.48, F2, 5.55]])
	wallZ(21.4, 27, 6, F2, C2, t, "brick", "tile_b"); wallX(2.075, 6, 27, F2, C2, t, "brick", "raw", [[4.42, 5.28, F2, 5.55]]); wallX(6, 9.85, 27, F2, C2, t, "tile_b", "wp_kids2")
	# 倉庫と子ども部屋のあいだ：れんがの壁（こわせる所あり）
	wallZ(27.075, 31.85, 6, F2, C2, t, "brick", "wp_kids2", [[28.8, 30.2, F2, 5.6]])
	# ================= ドア =================
	var D := func(o: Dictionary) -> Dictionary:
		var oo := {mat = "doorc", panel = "doorc2", arch = true, h = 2.1}; oo.merge(o, true)
		return mkDoor(oo)
	A.front = [mkDoor({x = -0.55, z = 14, y = F1, w = 1.08, h = 2.28, axis = "x", hinge = -1, swing = 1, mat = "door_b", panel = "door_bp", name = "玄関", inside = 1, lock = "outside"}), mkDoor({x = 0.55, z = 14, y = F1, w = 1.08, h = 2.28, axis = "x", hinge = 1, swing = 1, mat = "door_b", panel = "door_bp", name = "玄関", inside = 1, lock = "outside"})]
	A.back = D.call({x = 4, z = 32, y = F1, w = 0.96, axis = "x", hinge = 1, swing = -1, name = "裏口", inside = -1, h = 2.18})
	A.garageDoor = D.call({x = -10, z = 17, y = F1, w = 0.96, axis = "z", hinge = -1, swing = -1, name = "ガレージのドア"})
	A.garageSide = mkDoor({x = -17, z = 20.5, y = 0.1, w = 0.96, h = 2.1, axis = "z", hinge = -1, swing = 1, mat = "door_b", panel = "door_bp", name = "ガレージの勝手口", inside = 1, lock = "outside"})
	A.kitDoor = D.call({x = 2, z = 16, y = F1, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "台所のドア"}); A.panDoor = D.call({x = 2, z = 23.5, y = F1, w = 0.96, axis = "z", hinge = 1, swing = 1, name = "物置のドア"}); A.boilDoor = D.call({x = 2, z = 29, y = F1, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "ボイラー室のドア"})
	A.graveDoor = D.call({x = -2, z = 24.5, y = F1, w = 0.96, axis = "z", hinge = -1, swing = -1, name = "墓の部屋のドア"}); A.dinDoor = D.call({x = -2, z = 29.5, y = F1, w = 0.96, axis = "z", hinge = 1, swing = -1, name = "食堂のドア"})
	A.gdin1 = D.call({x = -5.8, z = 27, y = F1, w = 0.8, h = 2.05, axis = "x", hinge = -1, swing = -1, name = "ドア"}); A.gdin2 = D.call({x = -3.3, z = 27, y = F1, w = 0.8, h = 2.05, axis = "x", hinge = 1, swing = -1, name = "ドア"})
	A.bathDoor = D.call({x = 6, z = 29, y = F1, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "浴室のドア"}); A.bedDoor = D.call({x = 8.5, z = 26, y = F1, w = 0.96, axis = "x", hinge = -1, swing = -1, name = "寝室のドア"})
	A.liv2Door = D.call({x = -2, z = 19.8, y = F2, w = 0.96, axis = "z", hinge = 1, swing = -1, name = "ドア"}); A.anteDoor = D.call({x = -7, z = 19.7, y = F2, w = 0.96, axis = "z", hinge = 1, swing = -1, name = "ドア"}); A.secDoor = D.call({x = -8.55, z = 17.5, y = F2, w = 0.94, axis = "x", hinge = -1, swing = -1, name = "監視室のドア"})
	A.floodDoor = D.call({x = -2, z = 30.9, y = F2, w = 0.96, axis = "z", hinge = 1, swing = 1, name = "ドア"})
	A.classDoor = D.call({x = 2, z = 15.5, y = F2, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "教室のドア"}); A.classDoor2 = D.call({x = 9, z = 19, y = F2, w = 0.96, axis = "x", hinge = 1, swing = 1, name = "教室のドア"})
	A.bath2Door = D.call({x = 9, z = 21.4, y = F2, w = 0.96, axis = "x", hinge = 1, swing = 1, name = "浴室のドア"}); A.rangeDoor = D.call({x = 2, z = 23.5, y = F2, w = 0.96, axis = "z", hinge = -1, swing = 1, name = "射的場のドア"}); A.storDoor = D.call({x = 4.85, z = 27, y = F2, w = 0.86, axis = "x", hinge = -1, swing = 1, name = "倉庫のドア"})
	A.sideDoor = mkDoor({x = 10, z = 29.5, y = F2, w = 0.96, h = 2.1, axis = "z", hinge = -1, swing = 1, mat = "doorc", panel = "doorc2", arch = true, name = "横のドア"})
	# ================= 窓 =================
	var WN := func(o: Dictionary) -> Dictionary:
		var oo := {frame = "trim"}; oo.merge(o, true)
		return mkWindow(oo)
	A.winLiv = WN.call({axis = "x", x = -7.25, z = 14, y0 = 1.1, w = 2.5, h = 1.2, breakable = true}); A.winLiv2 = WN.call({axis = "x", x = -4, z = 14, y0 = 1.1, w = 2, h = 1.2, breakable = true}); A.winKit = WN.call({axis = "x", x = 5, z = 14, y0 = 1.1, w = 2, h = 1.2, breakable = true}); A.winKit2 = WN.call({axis = "x", x = 8.2, z = 14, y0 = 1.1, w = 2, h = 1.2, breakable = true})
	A.winKitE = WN.call({axis = "z", x = 10, z = 17, y0 = 1.1, w = 2, h = 1.2, breakable = true}); A.winBedE = WN.call({axis = "z", x = 10, z = 23.7, y0 = 1.1, w = 1.8, h = 1.2, breakable = true}); A.winDinN = WN.call({axis = "x", x = -6.5, z = 32, y0 = 1.1, w = 3, h = 1.1, breakable = true}); A.winDinW = WN.call({axis = "z", x = -10, z = 29.5, y0 = 1.1, w = 2, h = 1.1, breakable = true})
	WN.call({axis = "x", x = 0, z = 32, y0 = 1.2, w = 1.6, h = 1.2}); WN.call({axis = "x", x = 8, z = 32, y0 = 1.6, w = 1, h = 0.8})
	WN.call({axis = "x", x = -8.6, z = 14, y0 = 4.5, w = 1.2, h = 0.9}); WN.call({axis = "x", x = -4.5, z = 14, y0 = 4.4, w = 2, h = 1.2}); WN.call({axis = "x", x = 0, z = 14, y0 = 4.4, w = 1.6, h = 1.2}); WN.call({axis = "x", x = 4.25, z = 14, y0 = 4.6, w = 1.5, h = 0.9}); WN.call({axis = "x", x = 7.75, z = 14, y0 = 4.6, w = 1.5, h = 0.9})
	WN.call({axis = "x", x = -6, z = 32, y0 = 4.5, w = 2, h = 1.2}); WN.call({axis = "x", x = 8, z = 32, y0 = 4.4, w = 1.6, h = 1.2}); WN.call({axis = "z", x = -10, z = 27, y0 = 4.5, w = 2, h = 1.2}); WN.call({axis = "z", x = 10, z = 24.75, y0 = 4.5, w = 1.5, h = 1})
	# ================= 部屋の中 =================
	furnishA1()
	# ================= 外観：高い塔・屋根・足場 =================
	exteriorA1()
	# ================= 庭 =================
	yardA1()
# ---- 家具 ----
func furnishA1() -> void:
	# --- 玄関ホール ---
	coatRack(-1.5, F1, 14.7); box(1.3, F1, 14.3, 1.85, F1 + 0.9, 15.2, "wood_d"); rug(-1, 14.5, 1, 17.8, F1, "carpet_r"); picture(1.92, 1.8, 17.4, 3, 0.5, 0.6, 51); ceilLamp(0, C1, 16)
	# --- 廊下 ---
	rug(-0.6, 18.5, 0.6, 31, F1, "carpet_g"); ceilLamp(0, C1, 21); ceilLamp(0, C1, 27.5); picture(-1.92, 1.8, 21, 1, 0.6, 0.5, 53); picture(1.92, 1.8, 25, 3, 0.5, 0.5, 55); plant(-1.5, F1, 31.4, 1)
	# --- 居間 ---
	A.tv = tvSet(-9.55, F1, 17, 1); sofa(-6.1, F1, 17, 3, "sofa_g", 2.2); armchair(-7.7, F1, 15, 1, "sofa_r"); rug(-8.5, 15, -4.5, 19.4, F1, "carpet_g"); table(-7.9, F1, 17, 0.8, 0.5, 0.42, "wood_d", 1)
	shelf(-3.2, F1, 14.4, 0, 1.4, 1.9, 0.35, "wood_d"); lamp(-9.5, F1, 14.6, 1.5); lamp(-4.6, F1, 14.6, 1.4); picture(-6, 1.8, 14.16, 0, 0.9, 0.6, 57); picture(-9.84, 1.9, 19.3, 1, 0.5, 0.6, 59); ceilLamp(-6, C1, 17.5)
	A.livWard = wardrobe(-4.3, F1, 20.45, 2, {w = 1.1, d = 0.6, h = 2.05, mat = "wood_d", hide = true, name = "居間のクローゼット"})
	# --- 台所 ---
	counter(9.55, F1, 17.5, 3, 5.2, 0.62, 0.9); cyl(9.6, F1 + 0.9, 17.5, 0.02, 0.28, "chrome", 6); box(9.3, F1 + 0.8, 17, 9.85, F1 + 0.9, 18, "metal_dark", {solid = false}); upperCab(9.68, F1 + 1.55, 16.2, 3, 1.2)
	stoveUnit(6.6, F1, 14.5, 0); A.fridge = fridgeUnit(3, F1, 14.52, 0); table(6.2, F1, 18.3, 1.6, 0.9)
	A.kitSink = addIt({box = Box.new(9.2, F1 + 0.8, 16.9, 9.85, F1 + 1.3, 18.1), label = func(_it): return null, use = func(_it): return false, useLabel = func(_it): return null}); ceilLamp(6, C1, 17.5)
	# --- 物置 ---
	shelf(4, F1, 25.62, 2, 3, 2, 0.4, "wood_m", true); crate(2.7, F1, 22, 0.6); crate(5.3, F1, 22.1, 0.7); crate(5.35, F1 + 0.7, 22.1, 0.45, "patch")
	# --- 食堂 ---
	table(-6, F1, 29.5, 3.2, 1.2, 0.78, "wood_d")
	for x in [-7.2, -6, -4.8]:
		for z in [28.6, 30.4]: box(x - 0.22, F1, z - 0.22, x + 0.22, F1 + 0.46, z + 0.22, "wood_d", {solid = false})
	shelf(-9.6, F1, 29.5, 1, 2, 2, 0.45, "wood_d"); W.sphere(-6, F1 + 0.95, 29.5, 0.1, MATS.brass); cyl(-6, F1 + 0.78, 29.5, 0.08, 0.1, "brass", 8); picture(-2.09, 1.8, 28.2, 3, 0.6, 0.5, 61); ceilLamp(-6, PT, 29.5)
	A.dinWard = wardrobe(-3.1, F1, 31.52, 2, {w = 1.1, d = 0.6, h = 2, mat = "wood_d", hide = true, name = "食堂のクローゼット"})
	# --- 墓の部屋 ---
	buildGraveRoom()
	# --- ボイラー室 ---
	buildBoilerRoom()
	# --- 1階の浴室 ---
	toilet(9.55, F1, 31.4, 3); tub(7.2, F1, 31.4, 1); sinkUnit(9.6, F1, 27.4, 3)
	# --- 寝室（1階）---
	bed(8.7, F1, 24.3, 3, "bed_y", 1.2, 2.05); A.nstand = nightstand(8.9, F1, 22.3, 3); A.bedWard = wardrobe(6.45, F1, 23.4, 1, {w = 1.1, d = 0.6, h = 2.05, mat = "wood_d", hide = true, name = "寝室のクローゼット"})
	A.tv2 = tvSet(6.55, F1, 25.3, 1); rug(7, 22, 9.5, 25.6, F1, "carpet_b"); lamp(9.5, F1, 21.9, 1.2); ceilLamp(8, C1, 23.7)
	# --- ガレージ ---
	box(-16.8, 0.1, 15, -15.8, 1, 19, "wood_m"); shelf(-16.6, 0.1, 22.5, 1, 1.8, 2, 0.45, "raw", false)
	for xz in [[-12, 23.2], [-11, 23.4]]: cyl(xz[0], 0.1, xz[1], 0.35, 0.25, "tire", 14)
	cyl(-11.5, 0.35, 23.3, 0.35, 0.25, "tire", 14)
	barrel(-15.9, 0.1, 23.2, "red"); crate(-11, 0.1, 15, 0.7); box(-16.2, 0.1, 14.15, -10.8, 2.8, 14.17, "gdoor", {solid = false})
	ceilLamp(-13.5, 3.2, 19)
	# --- 2階の居間：ソファと、テレビを積んだ箱 ---
	sofa(-4.6, F2, 15.2, 0, "bed_b", 2); crate(-4.6, F2, 18.55, 0.9); crate(-4.6, F2 + 0.9, 18.55, 0.6); tvSet(-4.6, F2 + 1.5, 18.6, 2); rug(-6.2, 15.9, -3, 19, F2, "carpet_p"); lamp(-6.6, F2, 14.6, 1.4); shelf(-2.5, F2, 16, 3, 1.2, 1.8, 0.35, "wood_d"); ceilLamp(-4.5, C2, 17.5)
	# --- 物置（2階）---
	crate(-9.4, F2, 18.2, 0.8); crate(-8.4, F2, 20.3, 0.6); crate(-9.4, F2 + 0.8, 18.2, 0.5, "patch"); box(-9.8, F2, 19.3, -9, F2 + 1.9, 20.7, "wood_d")
	# --- 監視室 ---
	buildSecurityRoom()
	# --- 2階の廊下：3階への階段（家具でふさがれている）---
	for i in 12: box(-1.85, F2, 14.5 + 0.33 * i, -0.3, F2 + 0.2 * (i + 1), 14.5 + 0.33 * (i + 1), "floor_dark", {uv = 1.2})
	box(-1.85, F2 + 2.4, 17.4, -0.3, F2 + 2.9, 18.5, "floor_dark")
	crate(-1.2, F2 + 2.4, 17.8, 0.7); crate(-0.8, F2 + 2.4, 18.3, 0.5, "patch"); sofa(-1.1, F2 + 1.6, 16.6, 1, "sofa_r", 1.3) # 板を打ちつけてふさいである（見えるとおりの当たり判定）
	for k in 10:
		var z := 14.42 + k * 0.46; box(-0.33, F2, z - 0.09, -0.27, F2 + 2.3 - (k % 3) * 0.12, z + 0.09, "raw", {solid = false})
	for y in [0.45, 1.75]: rbox(-0.24, F2 + y, 16.45, 0.04, 0.16, 4.4, 0, 0, 0, "raw")
	add_solid(-0.34, F2, 14.2, -0.22, F2 + 2.5, 18.65, "wood")
	ceilLamp(0, C2, 24); ceilLamp(0, C2, 29); picture(1.92, 5, 27.5, 3, 0.6, 0.5, 63)
	# --- 教室 ---
	buildClassroom()
	# --- 射的場 ---
	buildRange()
	# --- 倉庫 ---
	crate(2.6, F2, 31.3, 0.8); crate(2.6, F2 + 0.8, 31.3, 0.5); crate(3.6, F2, 31.4, 0.6, "patch"); shelf(4.2, F2, 31.62, 2, 1.4, 1.9, 0.4, "raw", false); crate(5.4, F2, 28, 0.6); ceilLamp(4, C2, 29.5)
	# --- 子ども部屋 ---
	buildKidsRoom()
	# --- 2階の浴室（床に大きな穴）---
	tub(9.3, F2, 25.8, 0); toilet(6.45, F2, 26.6, 1); sinkUnit(9.6, F2, 22.3, 3)
	for i in 8: rbox(7.7 + rr(-0.8, 0.8), F2 - 0.02, 24 + rr(-0.8, 0.8), rr(0.2, 0.5), 0.05, rr(0.1, 0.2), 0, rr(0, 3), rr(-0.4, 0.4), "floor")
	# --- 水びたしの部屋 ---
	buildFloodRoom()
	# --- 地下室の階段（エンディング用）---
	for i in 10:
		var y := F1 - 0.25 * (i + 1); box(-9.85, -3, 22.9 + i * 0.4, -7.075, y, 22.9 + (i + 1) * 0.4, "concrete", {s = "stone"})
	A.baseLight = plight("#fff8e8", 0, 12, 1.2); A.baseLight.position = Vector3(-8.5, 1.5, 24); scene.add_child(A.baseLight)
func nightstand(x: float, y: float, z: float, k: int) -> Dictionary:
	var f := XF(x, y, z, k); f.box(-0.25, 0, -0.22, 0.25, 0.6, 0.22, "wood_m"); var dp := f.p(0, 0, 0.22)
	var dr := mkDrawer({x = dp.x, y = y + 0.35, z = dp.z, w = 0.44, h = 0.2, d = 0.38, dir = f.dir(0, 1), mat = "cabd", name = "引き出し"}); lamp2(f.p(0.1, 0.6, -0.05))
	return {f = f, dr = dr}
func lamp2(p: Vector3) -> void:
	cyl(p.x, p.y, p.z, 0.07, 0.02, "brass", 8); cyl(p.x, p.y, p.z, 0.012, 0.3, "brass", 6); cyl(p.x, p.y + 0.28, p.z, 0.14, 0.16, "lampshade", 10, {rt = 0.08})
# ---- 墓の部屋 ----
func buildGraveRoom() -> void: # 棒とベルをかける所
	cyl(-5.9, F1, 24.5, 0.04, 2.1, "pole", 8, {solid = true}); box(-5.9, F1 + 2.02, 24.46, -5.5, F1 + 2.06, 24.54, "pole", {solid = false}); box(-5.55, F1 + 1.9, 24.49, -5.52, F1 + 2.03, 24.51, "metal_dark", {solid = false})
	cyl(-4.5, F1 - 0.02, 24.5, 0.01, 1.6, "fab_w", 4) # ひも
	A.pole = {x = -5.52, y = F1 + 1.86, z = 24.5, has = false, bell = null, it = null}
	A.pole.it = addIt({box = Box.new(-6.1, F1 + 1.4, 24.2, -5.3, F1 + 2.2, 24.8), label = func(_it): return null if A.pole.has else {t = "ベルをかける所がある", k = "", n = "棒"},
		act = func():
			if not A.pole.has: toast("ベルがあれば、かけられそうだ"),
		use = func(it):
			if not A.pole.has and it.type == "bell":
				placeBell(); return true
			return false,
		useLabel = func(it): return "ベルをかける" if not A.pole.has and it.type == "bell" else null})
	# 壁の入れ物（左の壁）：中にシャベル
	box(-6.93, F1 + 0.4, 23.2, -6.9, F1 + 2, 24.2, "wood_d", {solid = false}); box(-6.93, F1 + 0.4, 23.2, -6.56, F1 + 0.44, 24.2, "wood_d"); box(-6.93, F1 + 1.96, 23.2, -6.56, F1 + 2, 24.2, "wood_d", {solid = false}); box(-6.93, F1 + 0.4, 23.18, -6.56, F1 + 2, 23.22, "wood_d", {solid = false}); box(-6.93, F1 + 0.4, 24.18, -6.56, F1 + 2, 24.22, "wood_d", {solid = false})
	A.boxDoor = mkLeaf({x = -6.54, y = F1 + 0.42, z = 23.7, w = 1, h = 1.56, axis = "z", hinge = -1, swing = 1, mat = "wood_m", t = 0.03, ang = PI * 0.7, knob = false})
	# 墓の土（掘ると下がる）
	A.dirt = {level = 3, m = null, col = null, it = null}
	var dm := mesh(G.box(2.2, 1.3, 2.2), MATS.dirt); dm.position = Vector3(-4.5, F1 - 0.65, 24.5); scene.add_child(dm); A.dirt.m = dm
	A.dirt.col = dyn_box(-5.6, -1, 23.4, -3.4, F1, 25.6, "dirt", null)
	A.dirt.it = addIt({box = Box.new(-5.6, -1.1, 23.4, -3.4, F1 + 0.05, 25.6), label = func(_it): return {t = "やわらかい土", k = "", n = "墓"} if A.dirt.level > 0 else null,
		act = func():
			if A.dirt.level > 0: toast("シャベルがあれば掘れそうだ"),
		use = func(it):
			if it.type == "shovel" and A.dirt.level > 0:
				digGrave(); return true
			return false,
		useLabel = func(it): return "土を掘る" if it.type == "shovel" and A.dirt.level > 0 else null})
	# 棺
	A.coffin = mkCoffin(-4.5, -1, 24.5, 0)
	signp(-2.09, 1.7, 23, 0.5, 0.62, "p_coffin", -PI / 2); cyl(-6.6, F1, 26.5, 0.18, 0.5, "brown", 10) # 花びん台
	# 十字架
	box(-4.55, F1, 25.65, -4.45, F1 + 1.3, 25.75, "wood_d", {solid = false}); box(-4.85, F1 + 0.9, 25.65, -4.15, F1 + 1, 25.75, "wood_d", {solid = false}); ceilLamp(-4.5, PT, 24.5)
func mkCoffin(x: float, y: float, z: float, _k: int) -> Dictionary:
	var g := Node3D.new(); var mb := MB.new(); mb.box(-0.4, 0, -1.05, 0.4, 0.08, 1.05, MATS.wood_d)
	for q in [[-0.4, -1.05, -0.33, 1.05], [0.33, -1.05, 0.4, 1.05], [-0.4, -1.05, 0.4, -0.98], [-0.4, 0.98, 0.4, 1.05]]: mb.box(q[0], 0, q[1], q[2], 0.5, q[3], MATS.wood_d)
	mb.box(-0.33, 0.08, -0.98, 0.33, 0.12, 0.98, MATS.fab_r)
	g.add_child(mb.build()); g.position = Vector3(x, y, z); scene.add_child(g)
	var lid := mesh(G.box(0.84, 0.06, 2.14), MATS.wood_m, true); lid.position = Vector3(x, y + 0.53, z); scene.add_child(lid)
	var C := {g = g, lid = lid, open = false, x = x, y = y, z = z, lidT = 0.0, lidCol = null, it = null}
	for q in [[x - 0.42, z - 1.07, x - 0.33, z + 1.07], [x + 0.33, z - 1.07, x + 0.42, z + 1.07], [x - 0.42, z - 1.07, x + 0.42, z - 0.98], [x - 0.42, z + 0.98, x + 0.42, z + 1.07]]: add_solid(q[0], y, q[1], q[2], y + 0.5, q[3], "wood")
	add_solid(x - 0.42, y, z - 1.07, x + 0.42, y + 0.08, z + 1.07, "wood"); C.lidCol = dyn_box(x - 0.42, y + 0.5, z - 1.07, x + 0.42, y + 0.56, z + 1.07, "wood", null)
	C.it = addIt({box = Box.new(x - 0.45, y, z - 1.1, x + 0.45, y + 0.6, z + 1.1), label = func(_it): return null if C.open else (null if A.dirt.level > 0 else {t = "ふたを開ける", k = "E", n = "棺"}),
		act = func():
			if not C.open and A.dirt.level <= 0:
				C.open = true; sfx("coffin"); C.lidCol.on = false; C.lidT = 0.0
				if story.get("onCoffin"): story.onCoffin.call()})
	return C
func placeBell() -> void:
	var H = held(); PL.inv[PL.sel] = null; drawInv(); H.st = "att"; A.pole.has = true; A.pole.bell = H; H.noPick = true; H.grp.visible = true; H.p = Vector3(A.pole.x, A.pole.y - 0.12, A.pole.z); H.grp.position = H.p; H.grp.rotation = Vector3()
	for c in H.grp.get_children(): c.position = Vector3()
	sfx("bell")
	after(0.9, func():
		A.boxDoor.m.tgt = 1.0; P.shovel.noPick = false; sfx("cab", true); toast("カチッ……壁の入れ物が開いた。シャベルがある"))
	if story.get("onBell"): story.onBell.call()
func digGrave() -> void:
	var D: Dictionary = A.dirt; D.level -= 1; sfx("dig"); PL.swing = 0.5; noise(-4.5, F1, 24.5, 8, "dig"); puff(-4.5, F1 + 0.1, 24.5, "#6e4f33", 8, 0.25, 0.8, 0.6)
	var lv: float = D.level / 3.0; D.m.position.y = -1 + 1.3 * lv - 0.65; D.col.y1 = -1 + 1.3 * lv; D.m.visible = D.level > 0
	if D.level <= 0:
		D.col.on = false; toast("棺が出てきた！")
		if story.get("onDug"): story.onDug.call()
# ---- ボイラー室：大きな黒いかまど・赤いバルブ・温度計・電気のスイッチ ----
func buildBoilerRoom() -> void:
	var x := 5.0; var z := 27.2; var mb := MB.new()
	mb.cyl(0, 0.9, 0, 0.75, 1.8, MATS.black, 16); mb.cyl(0, 1.85, 0, 0.5, 0.3, MATS.black, 14); mb.cyl(0, 2.3, 0, 0.18, 1.2, MATS.metal_dark, 10); mb.box(-0.3, 0.2, 0.7, 0.3, 1.6, 0.8, MATS.black)
	for i in 3: mb.cyl(0, 0.4 + i * 0.55, 0, 0.77, 0.06, MATS.metal_dark, 16)
	mb.box(-0.78, 0.3, -0.25, -0.74, 0.7, 0.25, MATS.black); var g := mb.build(); g.position = Vector3(x, F1, z); scene.add_child(g); add_solid(x - 0.8, F1, z - 0.8, x + 0.8, F1 + 2.1, z + 0.8, "metal")
	# パイプ（天井へ）
	box(x - 0.08, F1 + 2.6, 26.2, x + 0.08, F1 + 2.76, z, "metal_dark", {solid = false}); box(2.2, F1 + 2.6, 26.2, x, F1 + 2.76, 26.36, "metal_dark", {solid = false})
	# 温度計（西の面）
	var gauge := Node3D.new(); var gm := MB.new(); gm.cyl(0, 0, 0, 0.16, 0.04, MATS.cream, 16, null, "z"); gm.cyl(0, 0, -0.02, 0.18, 0.03, MATS.brass, 16, null, "z"); gauge.add_child(gm.build())
	var ng := G.box(0.012, 0.13, 0.01)
	for k in ng.p.size(): ng.p[k] += Vector3(0, 0.06, 0)
	var needle := mesh(ng, MATS.red); needle.position.z = 0.03; gauge.add_child(needle)
	var face := mesh(G.circle(0.15, 20), std_mat({map = tex("c88")})); face.position.z = 0.025; gauge.add_child(face); gauge.position = Vector3(x - 0.79, F1 + 1.55, z - 0.25); gauge.rotation.y = -PI / 2; scene.add_child(gauge)
	# 赤いバルブ（西の面）
	var valve := Node3D.new(); var vm := MB.new(); vm.cyl(0, 0, 0, 0.2, 0.04, MATS.red, 16, null, "z")
	for i in 4: vm.rbox(0, 0, 0, 0.36, 0.04, 0.04, 0, 0, i * PI / 4, MATS.red)
	vm.cyl(0, 0, 0.05, 0.05, 0.1, MATS.metal_dark, 8, null, "z"); valve.add_child(vm.build()); valve.position = Vector3(x - 0.86, F1 + 1.05, z + 0.25); valve.rotation.y = -PI / 2; scene.add_child(valve)
	A.furn = {valve = valve, needle = needle, cold = false, t = 0.0, it = null}
	A.furn.it = addIt({box = Box.new(x - 1.1, F1 + 0.8, z - 0.05, x - 0.72, F1 + 1.3, z + 0.55), label = func(_it): return {t = "バルブを戻す" if A.furn.cold else "バルブを回す", k = "E", n = "かまどのバルブ"}, act = func(): turnValve(not A.furn.cold)})
	# 電気のスイッチ（分電盤）
	box(2.08, F1 + 1.2, 27, 2.25, F1 + 1.9, 27.6, "metal_dark", {solid = false})
	var lg := G.box(0.06, 0.26, 0.05)
	for k in lg.p.size(): lg.p[k] += Vector3(0, 0.12, 0)
	var lev := mesh(lg, MATS.red); lev.position = Vector3(2.28, F1 + 1.5, 27.3); scene.add_child(lev); signp(2.26, F1 + 1.75, 27.3, 0.16, 0.1, "yellow", PI / 2)
	A.power = {on = true, lev = lev, it = null}
	A.power.it = addIt({box = Box.new(2.05, F1 + 1.15, 26.95, 2.45, F1 + 1.95, 27.65), label = func(_it): return {t = "電気を切る" if A.power.on else "電気を入れる", k = "E", n = "分電盤"}, act = func(): setPower(not A.power.on, true)})
	crate(5.4, F1, 31.3, 0.6); barrel(2.6, F1, 31.3); ceilLamp(4, C1, 28.5)
func turnValve(cold: bool) -> void:
	A.furn.cold = cold; sfx("valve"); noise(4.2, F1, 30.9, 9, "valve"); toast("温度計の針が下がっていく……ゴゴゴ……" if cold else "温度計の針が上がっていく"); A.furn.t = 0.0
	if story.get("onValve"): story.onValve.call(cold)
func setPower(on: bool, snd := false) -> void:
	A.power.on = on; A.power.lev.rotation.z = 0.0 if on else PI * 0.9
	if snd:
		sfx("genon" if on else "genoff"); noise(2.2, F1, 27.3, 8, "power"); toast("電気を入れた" if on else "電気を切った。カメラが止まった")
	updCamLeds(); updRangePower()
# ---- 監視室：机・モニター・ピッキング道具 ----
func buildSecurityRoom() -> void:
	desk(-8.5, F2, 14.55, 0)
	for i in 4:
		var x := -9.5 + i * 0.65; box(x - 0.28, F2 + 0.8, 14.25, x + 0.28, F2 + 1.3, 14.6, "dgrey", {solid = false}); A["mon%d" % i] = signp(x, F2 + 1.05, 14.61, 0.48, 0.36, "monitor", 0, {noShadow = true})
	box(-9.8, F2 + 1.4, 14.2, -7.2, F2 + 1.45, 14.7, "dgrey", {solid = false}); A.monU = []
	for i in 3:
		var x := -9.3 + i * 0.8; box(x - 0.28, F2 + 1.45, 14.25, x + 0.28, F2 + 1.85, 14.55, "dgrey", {solid = false}); A.monU.append(signp(x, F2 + 1.65, 14.56, 0.48, 0.32, "monitor", 0, {noShadow = true}))
	crate(-7.5, F2, 16.9, 0.5); picture(-9.84, 5, 16, 1, 0.5, 0.4, 65); ceilLamp(-8.5, C2, 15.8)
# ---- 教室 ----
const CHALK_SLOTS := [[16.011959838867188, 5.599609375], [17.476286315917967, 5.599609375], [17.020999145507812, 5.015625]]
func buildClassroom() -> void: # 壁の下半分は薄い色
	box(2.08, F2, 14.16, 9.85, F2 + 1.1, 14.2, "cab", {solid = false}); box(2.08, F2, 18.8, 9.85, F2 + 1.1, 18.84, "cab", {solid = false})
	# 黒板（東の壁）
	box(9.8, F2 + 1.1, 15.1, 9.85, F2 + 2.5, 17.9, "wood_d", {solid = false}); A.board = signp(9.79, F2 + 1.8, 16.5, 2.7, 1.3, "chalk", -PI / 2); box(9.62, F2 + 1.05, 15.1, 9.85, F2 + 1.1, 17.9, "wood_d", {solid = false})
	# 答えを置く所
	A.slots = []
	var ans := [5, 3, 8]
	for i in 3: A.slots.append({z = CHALK_SLOTS[i][0], y = CHALK_SLOTS[i][1], ans = ans[i], v = null, m = null, it = null})
	for S in A.slots:
		var m := signp(9.78, S.y, S.z, 0.24, 0.24, std_mat({color = "#3a6a50", emissive = "#204030", ei = 0.3}), -PI / 2); S.m = m
		S.it = addIt({box = Box.new(9.5, S.y - 0.16, S.z - 0.16, 9.85, S.y + 0.16, S.z + 0.16), label = func(_it): return {t = "数字をはがす", k = "E", n = "黒板"} if S.v else {t = "ここに答えの数字をはる", k = "", n = "黒板"},
			act = func():
				if S.v: takeSlot(S)
				else: toast("数字のマグネットを持って、左クリックではろう"),
			use = func(it):
				if not S.v and it.d.digit != null:
					putSlot(S, it); return true
				return false,
			useLabel = func(it): return "数字をはる" if not S.v and it.d.digit != null else null})
	# 先生の机（引き出しに数字）
	var f := XF(8.55, F2, 16.5, 3); f.box(-0.7, 0.72, -0.35, 0.7, 0.77, 0.35, "wood_m"); f.box(-0.7, 0, -0.35, -0.62, 0.72, 0.35, "wood_m"); f.box(0.62, 0, -0.35, 0.7, 0.72, 0.35, "wood_m"); f.box(-0.62, 0.1, -0.33, -0.1, 0.72, 0.35, "wood_m")
	var p1 := f.p(-0.36, 0, 0.35); var p2 := f.p(-0.36, 0, 0.35)
	A.tdraw = [mkDrawer({x = p1.x, y = F2 + 0.45, z = p1.z, w = 0.5, h = 0.22, d = 0.5, dir = f.dir(0, 1), mat = "cabd", name = "先生の机の引き出し"}), mkDrawer({x = p2.x, y = F2 + 0.15, z = p2.z, w = 0.5, h = 0.22, d = 0.5, dir = f.dir(0, 1), mat = "cabd", name = "先生の机の引き出し"})]
	# 生徒の机（水色のいす）
	for r in 3:
		for c in 3: schoolDesk(3.4 + r * 1.45, F2, 15 + c * 1.45)
	signp(6, F2 + 1.9, 18.79, 2.2, 1.1, "worldmap", PI); signp(2.09, F2 + 2.2, 16.5, 2.4, 0.6, "alpha", PI / 2); box(2.08, F2 + 1.3, 15, 2.12, F2 + 2.4, 16.2, "cork", {solid = false})
	for i in 4: box(2.12, F2 + 1.45 + (i % 2) * 0.4, 15.1 + i * 0.25, 2.13, F2 + 1.75 + (i % 2) * 0.4, 15.3 + i * 0.25, ["cream", "pink", "yellow", "lgrey"][i], {solid = false})
	ceilLamp(4.5, C2, 16.5); ceilLamp(8, C2, 16.5)
	# 先生を置く場所の目印（黒板の前）
	A.teachSpot = {x = 9, z = 15.4}
func schoolDesk(x: float, y: float, z: float) -> void:
	var f := XF(x, y, z, 1); f.box(-0.25, 0.42, -0.22, 0.25, 0.46, 0.22, "teal")
	for ab in [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]: f.box(ab[0] - 0.02, 0, ab[1] - 0.02, ab[0] + 0.02, 0.42, ab[1] + 0.02, "metal_dark", NS)
	f.box(-0.25, 0.46, -0.24, 0.25, 0.9, -0.2, "teal", NS)
	f.box(-0.3, 0.7, 0.2, 0.3, 0.74, 0.58, "wood_m", NS); f.box(0.28, 0.44, 0.2, 0.3, 0.72, 0.24, "metal_dark", NS)
# ---- 射的場 ----
func buildRange() -> void: # カウンター（x=3.4）と、はね上げの門
	box(3.25, F2, 21.55, 3.55, F2 + 1, 26.0, "wood_m", {uv = 1}); box(3.2, F2 + 1, 21.55, 3.6, F2 + 1.06, 26, "wood_d")
	# 金あみ（カウンターを乗りこえられないように）
	for i in 17:
		var z := 21.6 + i * 0.275
		if absf(z - 24.2) < 0.45: continue
		box(3.39, F2 + 1.06, z - 0.012, 3.41, F2 + 2.35, z + 0.012, "metal_dark", {solid = false})
	for y in [1.7, 2.3]: box(3.39, F2 + y - 0.012, 21.55, 3.41, F2 + y + 0.012, 26, "metal_dark", {solid = false})
	add_solid(3.3, F2 + 1.06, 21.55, 3.5, F2 + 2.4, 26, "metal")
	# 日よけ（しま）
	for i in 10: box(3.1, F2 + 2.35, 21.5 + i * 0.55, 3.8, F2 + 2.45, 21.5 + (i + 1) * 0.55, "white" if i % 2 else "red", {solid = false})
	A.gate = mkGate(3.4, F2, 26.42)
	# 銃の台
	var st := MB.new(); st.box(-0.18, 0, -0.25, 0.18, 0.03, 0.25, MATS.teal); st.cyl(0, 0.03, 0, 0.02, 0.22, MATS.yellow, 6); var sg := st.build(); sg.position = Vector3(3.4, F2 + 1.06, 24.2); scene.add_child(sg)
	A.stand = {x = 3.4, y = F2 + 1.06, z = 24.2, has = false, score = 0, on = false, rifle = null, it = null}
	A.stand.it = addIt({box = Box.new(3.1, F2 + 1, 23.8, 3.7, F2 + 1.5, 24.6), label = func(_it): return ({t = "左クリックで撃つ", k = "", n = "射的"} if A.stand.on else {t = "電気が来ていないみたい", k = "", n = "射的"}) if A.stand.has else {t = "銃を置く台", k = "", n = "台"},
		act = func():
			if not A.stand.has: toast("おもちゃの銃を置けそうだ"),
		use = func(it):
			if not A.stand.has and it.type == "toyrifle":
				placeRifle(); return true
			return false,
		useLabel = func(it): return "銃を台に置く" if not A.stand.has and it.type == "toyrifle" else null})
	# 背景の絵・点数板
	signp(5.84, F2 + 1.5, 24.2, 5.2, 1.9, "landscape", -PI / 2)
	A.scoreSign = signp(5.83, F2 + 2.7, 24.2, 1.1, 0.4, std_mat({color = "#141414", emissive = "#141414", ei = 1.0}), -PI / 2)
	var lb := Label3D.new(); lb.text = "000"; lb.font_size = 76; lb.pixel_size = 0.004; lb.modulate = Color("#ff4020"); lb.outline_size = 0; lb.position = Vector3(0, -0.02, 0.005); lb.double_sided = false; lb.shaded = false
	lb.font = load("res://fonts/mono.ttf") if ResourceLoader.exists("res://fonts/mono.ttf") else null
	A.scoreSign.add_child(lb); A.scoreLabel = lb; drawScore(0)
	# 的（兵隊）
	A.targets = []
	for i in 4:
		var z := 22.2 + i * 1.25; var g := Node3D.new(); var tm := MB.new()
		tm.box(-0.03, 0, -0.22, 0.03, 0.9, 0.22, MATS.board_w); tm.sphere(0, 1.02, 0, 0.13, MATS.board_w, 0.4, 1, 1); tm.box(-0.035, 0.3, -0.18, 0.035, 0.7, 0.18, MATS.green); tm.box(-0.035, 0.95, -0.13, 0.035, 1.1, 0.13, MATS.dgreen); tm.cyl(0, 0.5, 0, 0.1, 0.01, MATS.red, 12, null, "x")
		g.add_child(tm.build()); g.position = Vector3(5.4, F2, z); g.rotation.z = PI / 2 * 0.98; scene.add_child(g); A.targets.append({g = g, z = z, up = 0.0, t = rr(1, 3), hit = false})
	# 天井のパイプ（鍵が落ちてくる）
	box(2.25, C2 - 0.3, 21.6, 2.45, C2 - 0.1, 26.5, "metal", {solid = false}); box(3.9, C2 - 0.25, 21.6, 4.1, C2 - 0.05, 26.5, "metal", {solid = false}); cyl(2.35, C2 - 0.9, 21.75, 0.1, 0.6, "metal", 10)
	# ポスター（ろうか側の壁）
	signp(2.09, F2 + 1.7, 22.4, 0.7, 1.4, "p_rifle", PI / 2); signp(2.09, F2 + 1.7, 25.9, 0.7, 1.4, "p_prize", PI / 2)
	A.rangeLights = []
	for z in [22.5, 24.5, 26]:
		var L := plight("#fff0c8", 0, 6, 1.6); L.position = Vector3(4.7, C2 - 0.4, z); scene.add_child(L); A.rangeLights.append(L); ceilLamp(4.7, C2, z)
func drawScore(n: int) -> void:
	A.scoreLabel.text = "%03d" % n
func mkGate(x: float, y: float, z: float) -> Dictionary: # カウンターのはね上げ部分（銀の錠）：南のはしを軸に上へはね上がる
	var pv := Node3D.new(); pv.position = Vector3(x, y + 1.03, z - 0.42); scene.add_child(pv)
	var top := mesh(G.box(0.4, 0.06, 0.84), MATS.wood_d, true); top.position = Vector3(0, 0, 0.42); pv.add_child(top)
	var low := mesh(G.box(0.3, 0.97, 0.8), MATS.wood_m, true); low.position = Vector3(x, y + 0.485, z); scene.add_child(low)
	var lock := Node3D.new(); var lm := MB.new(); lm.box(-0.06, -0.08, -0.03, 0.06, 0.06, 0.03, MATS.silver); lm.cyl(0, 0.08, 0, 0.045, 0.02, MATS.silver, 10, null, "z"); lock.add_child(lm.build()); lock.position = Vector3(x - 0.2, y + 0.9, z - 0.3); lock.rotation.y = PI / 2; scene.add_child(lock)
	var Gt := {pv = pv, low = low, lock = lock, locked = true, open = false, x = x, y = y, z = z, col = null, it = null}
	Gt.col = dyn_box(x - 0.2, y, z - 0.42, x + 0.2, y + 2.35, z + 0.42, "wood", Gt)
	Gt.it = addIt({box = Box.new(x - 0.25, y, z - 0.45, x + 0.25, y + 1.2, z + 0.45), label = func(_it): return {t = "銀の錠がかかっている", k = "", n = "カウンターの門"} if Gt.locked else {t = "閉める" if Gt.open else "開ける", k = "E", n = "カウンターの門"},
		act = func():
			if Gt.locked:
				toast("銀の錠がかかっている"); sfx("locked"); return
			setGate(Gt, not Gt.open),
		use = func(it):
			if Gt.locked and it.type == "silverkey":
				Gt.locked = false; lock.visible = false; consumeHeld(); sfx("unlock"); toast("銀の錠が開いた")
				if story.get("onGate"): story.onGate.call()
				return true
			return false,
		useLabel = func(it): return "銀の鍵を使う" if Gt.locked and it.type == "silverkey" else null})
	return Gt
func setGate(Gt: Dictionary, op: bool) -> void:
	Gt.open = op; Gt.low.visible = not op; Gt.col.on = not op; Gt.pv.rotation.x = -1.45 if op else 0.0; sfx("cab", op)
func placeRifle() -> void:
	var H = held(); PL.inv[PL.sel] = null; drawInv(); H.st = "att"; H.noPick = true; H.grp.visible = true; H.p = Vector3(3.4, F2 + 1.3, 24.2); H.grp.position = H.p; H.grp.rotation = Vector3(0, PI / 2, 0)
	for c in H.grp.get_children(): c.position = Vector3()
	A.stand.has = true; A.stand.rifle = H; sfx("pick"); updRangePower(); toast("明かりがついた！ 的をねらって左クリック" if A.stand.on else "電気が来ていないみたいだ")
	if story.get("onRifle"): story.onRifle.call()
func updRangePower() -> void:
	if not A.get("stand"): return
	A.stand.on = A.stand.has and A.power.on
	for L in A.rangeLights: li(L, 5.0 if A.stand.on and QUAL else 0.0)
# ---- 子ども部屋 ----
func buildKidsRoom() -> void:
	signp(9.84, F2 + 1.7, 28.4, 1.4, 0.7, "drawings", -PI / 2); signp(6.09, F2 + 1.9, 31, 1.3, 0.65, "drawings", PI / 2)
	# ベビーベッド
	var x := 8.0; var z := 29.8; box(x - 0.5, F2, z - 0.8, x + 0.5, F2 + 0.35, z + 0.8, "white"); box(x - 0.45, F2 + 0.35, z - 0.75, x + 0.45, F2 + 0.45, z + 0.75, "bed_b", {solid = false})
	for i in 9:
		var zz := z - 0.78 + i * 0.195
		for s in [-1, 1]: box(x + s * 0.5 - 0.02, F2 + 0.35, zz - 0.015, x + s * 0.5 + 0.02, F2 + 0.88, zz + 0.015, "white", {solid = false})
	for s in [-1, 1]: box(x + s * 0.5 - 0.03, F2 + 0.86, z - 0.8, x + s * 0.5 + 0.03, F2 + 0.9, z + 0.8, "white", {solid = false})
	for s in [-1, 1]: box(x - 0.52, F2, z + s * 0.8 - 0.03, x + 0.52, F2 + 1.15, z + s * 0.8 + 0.03, "white", {solid = false})
	add_solid(x - 0.53, F2, z - 0.83, x + 0.53, F2 + 0.45, z + 0.83, "wood")
	for s in [-1, 1]:
		add_solid(x + s * 0.5 - 0.03, F2 + 0.45, z - 0.83, x + s * 0.5 + 0.03, F2 + 0.9, z + 0.83, "wood"); add_solid(x - 0.53, F2 + 0.45, z + s * 0.8 - 0.03, x + 0.53, F2 + 1.15, z + s * 0.8 + 0.03, "wood")
	# くま・マネキン・積み木
	var tb := MB.new(); tb.sphere(0, 0.25, 0, 0.2, MATS.brown, 1, 1.1, 0.9); tb.sphere(0, 0.55, 0, 0.15, MATS.brown); tb.sphere(-0.1, 0.66, 0, 0.05, MATS.brown); tb.sphere(0.1, 0.66, 0, 0.05, MATS.brown); tb.sphere(0, 0.52, 0.12, 0.05, MATS.cream); var tg := tb.build(); tg.position = Vector3(9.4, F2, 31.4); tg.rotation.y = -2.4; scene.add_child(tg)
	var mq := MB.new(); mq.cyl(0, 0, 0, 0.12, 0.03, MATS.wood_d, 10); mq.cyl(0, 0.03, 0, 0.02, 0.6, MATS.wood_d, 6); mq.sphere(0, 0.85, 0, 0.2, MATS.fab_w, 1, 1.4, 0.8); mq.sphere(0, 1.2, 0, 0.1, MATS.fab_w); var mg := mq.build(); mg.position = Vector3(6.5, F2, 27.6); scene.add_child(mg); add_solid(6.3, F2, 27.4, 6.7, F2 + 1.3, 27.8, "wood")
	for i in 7:
		var b := MB.new(); b.box(-0.07, 0, -0.07, 0.07, 0.14, 0.07, MATS[["red", "blue", "yellow", "green"][i % 4]]); var g := b.build(); g.position = Vector3(6.8 + rr(0, 1.2), F2 + (0.14 if i > 4 else 0.0), 30.8 + rr(0, 0.8)); g.rotation.y = rr(0, 1); scene.add_child(g)
	rug(6.6, 28.2, 9.4, 31.4, F2, "carpet_p"); ceilLamp(8, C2, 29.5)
# ---- 水びたしの部屋 ----
func buildFloodRoom() -> void: # 水面
	var wg := G.plane(8, 10)
	for k in wg.p.size():
		var p: Vector3 = wg.p[k]; wg.p[k] = Vector3(p.x, 0, -p.y); wg.n[k] = Vector3.UP
	var wm := mesh(wg, MATS.wtr); wm.position = Vector3(-6, WS, 27); wm.sorting_offset = 2; scene.add_child(wm); A.water = {m = wm, frozen = false, ice = null}
	A.water.ice = dyn_box(-10, 3.2, 22, -2, 3.47, 32, "ice", null); A.water.ice.on = false # 凍ったら上を歩ける
	# 半分しずんだたんす（ベル）
	var f := XF(-6.3, 2.95, 26.8, 1); f.box(-0.6, 0, -0.3, 0.6, 0.95, 0.3, "wood_d"); f.box(-0.62, 0.95, -0.32, 0.62, 1, 0.32, "wood_d")
	A.floodDrawer = mkDrawer({x = f.p(0, 0, 0.3).x, y = 2.95 + 0.62, z = f.p(0, 0, 0.3).z, w = 0.9, h = 0.26, d = 0.45, dir = f.dir(0, 1), mat = "cabd", name = "しずみかけた引き出し"})
	# うかんだ家具
	rbox(-8.5, 3.3, 29.5, 0.5, 0.9, 0.5, 0.5, 0.3, 1.3, "wood_m"); rbox(-4.6, 3.35, 24.2, 1.2, 0.3, 0.6, 0.1, 0.6, 0.05, "sofa_r"); rbox(-3.3, 3.4, 27.3, 0.5, 0.1, 0.5, 0, 0.4, 0, "wood_d")
	# サメの着ぐるみが入ったたんす（ちょっとしたおまけ）
	A.sharkWard = wardrobe(-9.52, 2.95, 30.4, 1, {w = 1.1, d = 0.6, h = 2.1, mat = "door_r", lm = "door_r", noRod = true, name = "たんす"})
	picture(-9.84, 4.9, 24.5, 1, 0.8, 0.6, 67); picture(-5, 5, 31.84, 2, 0.6, 0.5, 69); ceilLamp(-6, C2, 25); ceilLamp(-6, C2, 29.5)
# ================= 外観 =================
func exteriorA1() -> void: # 2階の上の屋根（平ら）
	box(-10.4, F3 - 0.02, 13.7, 10.4, F3 + 0.08, 32.4, "roof_brown", {uv = 2.4, f = 4 | 1 | 2 | 16 | 32}); box(-10.4, F3, 13.7, 10.4, F3 + 0.35, 13.9, "trim", {solid = false}); box(-10.4, F3, 32.2, 10.4, F3 + 0.35, 32.4, "trim", {solid = false}); box(-10.4, F3, 13.9, -10.2, F3 + 0.35, 32.2, "trim", {solid = false}); box(10.2, F3, 13.9, 10.4, F3 + 0.35, 32.2, "trim", {solid = false})
	# 水色の高い塔（3〜5階、入れない）
	var tw := func(x0: float, x1: float, z0: float, z1: float, y0: float, y1: float, mat) -> void:
		box(x0, y0, z0, x1, y1, z1, mat, {uv = 2})
		for ab in [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]: box(ab[0] - 0.12, y0, ab[1] - 0.12, ab[0] + 0.12, y1, ab[1] + 0.12, "trim", {solid = false})
		box(x0 - 0.1, y1 - 0.2, z0 - 0.1, x1 + 0.1, y1, z1 + 0.1, "trim", {solid = false})
	tw.call(-6, 6, 16, 30, F3, 10.2, "sid_teal"); tw.call(-6, 6, 16, 30, 10.2, 13.6, "sid_teal")
	# 5階：おとなりさんが双眼鏡でのぞく部屋（中は空洞）
	var y0 := 13.6; var y1 := 16.6
	box(-4.4, y0 - 0.2, 18, 4.4, y0, 28, "floor_dark", {solid = false}); box(-4.4, y1 - 0.2, 18, 4.4, y1, 28, "white", {solid = false})
	wallX(-4.55, 4.55, 18, y0, y1, 0.3, "sid_teal", "wp_brown", [[-0.6, 0.6, 14.3, 15.6]], {solid = false}); wallX(-4.55, 4.55, 28, y0, y1, 0.3, "wp_brown", "sid_teal", [], {solid = false}); wallZ(18.15, 27.85, -4.4, y0, y1, 0.3, "sid_teal", "wp_brown", [], {solid = false}); wallZ(18.15, 27.85, 4.4, y0, y1, 0.3, "wp_brown", "sid_teal", [], {solid = false})
	for ab in [[-4.4, 18], [4.4, 18], [-4.4, 28], [4.4, 28]]: box(ab[0] - 0.12, y0, ab[1] - 0.12, ab[0] + 0.12, y1, ab[1] + 0.12, "trim", {solid = false})
	box(-4.5, y1 - 0.2, 17.9, 4.5, y1, 28.1, "trim", {solid = false})
	mkWindow({axis = "x", x = 0, z = 18, y0 = 14.3, w = 1.2, h = 1.3}); A.peepL = plight("#ffd9a0", 0, 6, 1.5); A.peepL.position = Vector3(0, 15.8, 20); scene.add_child(A.peepL)
	roofX(-4.4, 4.4, 18, 28, 16.6, 3, "roof_brown", 0.5); gable(-4.4, 18, 28, 16.6, 19.6, "sid_teal"); gable(4.4, 18, 28, 16.6, 19.6, "sid_teal")
	box(-6.3, 10.1, 15.7, 6.3, 10.3, 30.3, "roof_brown", {solid = false}); box(-6.3, 13.5, 15.7, 6.3, 13.7, 30.3, "roof_brown", {solid = false})
	# 塔の窓
	var win := func(x: float, y: float, z: float, w: float, h: float, ax: String) -> void:
		if ax == "x":
			box(x - w / 2 - 0.08, y - 0.08, z - 0.06, x + w / 2 + 0.08, y + h + 0.08, z + 0.06, "trim", {solid = false}); box(x - w / 2, y, z - 0.07, x + w / 2, y + h, z + 0.07, "glassd", {solid = false})
		else:
			box(x - 0.06, y - 0.08, z - w / 2 - 0.08, x + 0.06, y + h + 0.08, z + w / 2 + 0.08, "trim", {solid = false}); box(x - 0.07, y, z - w / 2, x + 0.07, y + h, z + w / 2, "glassd", {solid = false})
	for y in [7.6, 11]:
		for x in [-4, -1.3, 1.3, 4]:
			win.call(x, y, 16, 1, 1.4, "x"); win.call(x, y, 30, 1, 1.4, "x")
	for y in [7.6, 11]:
		for z in [18.5, 23, 27.5]:
			win.call(-6, y, z, 1.2, 1.4, "z"); win.call(6, y, z, 1.2, 1.4, "z")
	for x in [-2.8, 2.8]: win.call(x, 14.4, 18, 0.9, 1.3, "x")
	win.call(0, 17.3, 18, 0.8, 0.9, "x")
	# 上の窓から双眼鏡でのぞく窓（イントロ）
	A.peepWin = {x = 0, y = 14.4, z = 17.9}
	# 西の黄色い部分と、東のオレンジの部分
	box(-10, F3, 18, -6, 10, 28, "sid_yel2", {uv = 2}); box(-10.3, 10, 17.7, -5.8, 10.25, 28.3, "roof_brown", {solid = false}); win.call(-10, 8, 21, 1.2, 1.3, "z"); win.call(-10, 8, 25, 1.2, 1.3, "z")
	box(6, F3, 20, 10, 9.4, 30, "sid_orange", {uv = 2}); box(5.8, 9.4, 19.8, 10.2, 9.6, 30.2, "roof_brown", {solid = false}); win.call(10, 7.6, 23, 1.2, 1.2, "z"); win.call(10, 7.6, 27, 1.2, 1.2, "z")
	# 西側の木の足場（階段つき）
	for z in [16, 21, 26, 31]:
		for x in [-13, -10.6]: box(x - 0.12, 0, z - 0.12, x + 0.12, 13.8, z + 0.12, "beam", {solid = false})
	for y in [F3, 10.2, 13.6]:
		box(-13.2, y - 0.15, 15.8, -10.4, y, 31.2, "raw", {solid = false}); box(-13.2, y, 15.8, -13.1, y + 1, 31.2, "beam", {solid = false})
	for q in [[0, F3, 24, 31], [F3, 10.2, 16, 22], [10.2, 13.6, 24, 30]]: beam(-11.8, q[0], q[2], -11.8, q[1], q[3], 0.3, "raw")
	for z in [16, 21, 26, 31]: beam(-13, 0.5, z, -13, F3, z + (4.8 if z < 30 else -4.8), 0.14)
	# えんとつ
	box(3, F3, 24, 3.8, F3 + 5.5, 24.8, "brick", {solid = false})
	# 玄関ポーチ（二枚扉）
	box(-3.2, 0, 11.6, 3.2, F1, 14, "wood_m", {s = "wood"}); box(-2.4, 0, 11.2, 2.4, 0.15, 11.6, "wood_m", {s = "wood"})
	for x in [-3, 3]: box(x - 0.1, F1, 11.7, x + 0.1, 3.3, 11.9, "trim", {s = "wood"})
	box(-3.5, 3.3, 11.3, 3.5, 3.55, 14, "roof_brown", {s = "wood"})
	for x in [-3.0, 3.0]: box(minf(x, x * 0.4), F1 + 0.8, 11.72, maxf(x, x * 0.4), F1 + 0.9, 11.8, "trim", {solid = false})
	signp(0, 2.95, 13.84, 0.9, 0.3, "trim", PI)
	# 裏口の階段
	box(3, 0, 32.15, 5, 0.15, 33, "wood_m", {s = "wood"})
	# ガレージの外（ピンク）
	wallX(-17.15, -10, 14, 0, 3.4, 0.3, "sid_pinkg", "raw"); wallX(-17.15, -10, 24, 0, 3.4, 0.3, "raw", "sid_pinkg"); wallZ(14.15, 24, -17, 0, 3.4, 0.3, "sid_pinkg", "raw", [[20.02, 20.98, 0.1, 2.2]])
	box(-17.4, 3.4, 13.7, -9.9, 3.65, 24.3, "roof_brown", {s = "wood"}); box(-16.2, 0.02, 13.84, -10.8, 2.8, 13.86, "gdoor", {solid = false})
	mkWindow({axis = "z", x = -17, z = 17, y0 = 1.2, w = 1.6, h = 0.9})
# ================= 庭 =================
func yardA1() -> void: # 前の柵・門・ガレージ前
	picket(-21, 7, -16.6, 7); picket(-10.4, 7, -1.1, 7); picket(1.1, 7, 21, 7); picket(-21, 7, -21, 40); picket(21, 7, 21, 40); picket(-21, 40, 21, 40)
	box(-0.9, 0, 7, 0.9, 0.06, 11.2, "walk", {s = "stone", uv = 1}); box(-16.5, 0, 6.5, -10.5, 0.05, 14, "concrete", {s = "stone"})
	carModel(-13.5, 9.6, 2, "car_r"); mailbox(1.7, 6.6, "red"); flowers(-9.6, 12.6, -3.6, 13.7); flowers(3.6, 12.6, 9.6, 13.7); bush(12, 13.5, 1.1); bush(-19, 12, 1)
	treeAt(-19, 30, 1.4); treeAt(17, 36, 1.5); treeAt(17, 16, 1.2); treeAt(-6, 37, 1.1); treeAt(14, 10, 1)
	# がらくた（窓をわるのに使える）
	A.junk = []
	# 電柱と電線（通りぞい）
	for x in [-40, -20, 0, 20, 40]:
		cyl(x + 5, 0, 5.2, 0.13, 9, "pole", 8, {solid = true, s = "wood"}); box(x + 4, 8.4, 5.12, x + 6, 8.52, 5.28, "pole", {solid = false})
	var x := -35
	while x < 45:
		for dz in [-0.9, 0.9]:
			var g := G.tube([Vector3(x, 8.45, 5.2 + dz * 0.9), Vector3(x + 10, 7.9, 5.2 + dz * 0.9), Vector3(x + 20, 8.45, 5.2 + dz * 0.9)], 8, 0.015, 4)
			scene.add_child(mesh(g, MATS.black))
		x += 20

# ================= 自分の家と通り（アルファ1）=================
# 家 x:-6..6 z:-30..-22（玄関は z=-22、通りの方を向く）。前には広い庭
var H1 := {lights = [], power = false}
var STREET_LIGHTS := []
func buildA1Street() -> void:
	# 地面（墓の部屋の穴の所だけあけておく）
	for q in [[-90, -70, 90, 23.4], [-90, 25.6, 90, 90], [-90, 23.4, -5.6, 25.6], [-3.4, 23.4, 90, 25.6]]: box(q[0], -0.5, q[1], q[2], 0, q[3], "grass", {s = "grass", uv = 3})
	box(-90, 0, -4, 90, 0.02, 4, "asphalt", {s = "stone", uv = 6})
	var x := -88
	while x < 88:
		box(x, 0.02, -0.08, x + 2, 0.03, 0.08, "road_y", {solid = false}); x += 4
	box(-90, 0, -6.4, 90, 0.14, -4, "sidewalk", {s = "stone"}); box(-90, 0, 4, 90, 0.14, 6.4, "sidewalk", {s = "stone"}); box(-90, 0, -4.12, 90, 0.16, -4, "concrete", {s = "stone"}); box(-90, 0, 4, 90, 0.16, 4.12, "concrete", {s = "stone"})
	# 反りかえった街灯
	var SL := []
	for xx in [-42, -12, 12, 42]:
		SL.append(curvedLamp(xx, -5.9, 0)); SL.append(curvedLamp(xx + 15, 5.9, 2))
	W.streetLights = SL; STREET_LIGHTS = SL
	# まわりの家
	fakeHouse(-24, -24, 0, "sid_white", "roof_dark", 21); fakeHouse(24, -24, 0, "sid_yellow", "roof_brown", 22); fakeHouse(-46, -22, 0, "sid_pink", "roof", 23); fakeHouse(46, -22, 0, "sid_white", "roof_dark", 24)
	fakeHouse(-38, 22, 2, "brick", "roof_dark", 25); fakeHouse(38, 22, 2, "sid_white", "roof", 26); fakeHouse(-60, 24, 2, "sid_cream", "roof_brown", 27); fakeHouse(60, 24, 2, "brick_y", "roof_dark", 28)
	for xz in [[-30, -9], [30, -9], [-52, -10], [52, -10], [-30, 10], [30, 10], [-50, 12], [50, 12], [-10, -34], [12, -35]]:
		treeAt(xz[0], xz[1], 1 + fposmod_js(xz[0] * xz[1], 3) * 0.12)
	var a := 0.0
	while a < TAU:
		var R := 84 + sin(a * 5) * 5; treeAt(cos(a) * R, 8 + sin(a) * R, 2.3, 1 if int(a * 10) % 3 == 0 else 0); a += TAU / 50
	invis(-70, -5, -50, 70, 40, -49); invis(-70, -5, 70, 70, 40, 71); invis(-71, -5, -50, -70, 40, 71); invis(70, -5, -50, 71, 40, 71)
# JS の % と同じ（負の数は負のまま）
func fposmod_js(a: float, b: float) -> float: return fmod(a, b)
func curvedLamp(x: float, z: float, k: int) -> OmniLight3D:
	var f := XF(x, 0, z, k); cyl(x, 0, z, 0.09, 4.6, "pole", 8, {solid = true, s = "wood"}); f.rbox(0, 4.75, 0.35, 0.08, 0.08, 0.9, -0.5, 0, 0, "pole"); f.box(-0.18, 4.6, 0.7, 0.18, 4.72, 1.05, "lamp", NS)
	var p := f.p(0, 4.4, 0.85); var L := plight("#ffd890", 0, 15, 1.6); L.position = p; scene.add_child(L)
	return L
func buildA1Home() -> void:
	var FY := 0.3; var CY := 3.0; var WT := 0.3
	# 床と天井
	slab(-6, -30, -2, -22, FY, 0.3, "floor", null); slab(-2, -30, 2, -22, FY, 0.3, "floor_dark", null); slab(2, -30, 6, -22, FY, 0.3, "carpet_b", null, {s = "carpet"}); box(-6.2, CY, -30.2, 6.2, CY + 0.3, -21.8, "white", {f = 8 | 1 | 2 | 16 | 32})
	wallX(-6.15, 6.15, -30, 0, CY + 0.3, WT, "sid_lav", "wp_kid")
	wallX(-6.15, -2, -22, 0, CY + 0.3, WT, "wp_beige", "sid_lav", [[-5, -3, 1.1, 2.2]]); wallX(-2, 2, -22, 0, CY + 0.3, WT, "wp_brown", "sid_lav", [[-0.5, 0.5, FY, 2.45]]); wallX(2, 6.15, -22, 0, CY + 0.3, WT, "wp_kid", "sid_lav", [[3, 5, 1.1, 2.2]])
	wallZ(-29.85, -22.15, -6, 0, CY + 0.3, WT, "sid_lav", "wp_beige"); wallZ(-29.85, -22.15, 6, 0, CY + 0.3, WT, "wp_kid", "sid_lav")
	wallZ(-29.85, -22.15, -2, FY, CY, 0.12, "wp_beige", "wp_brown", [[-26.4, -24.4, FY, 2.7]]); wallZ(-29.85, -22.15, 2, FY, CY, 0.12, "wp_brown", "wp_kid", [[-24.5, -23.5, FY, 2.42]])
	roofX(-6.15, 6.15, -30.15, -21.85, CY + 0.3, 2, "roof_dark", 0.5); gable(-6.15, -30.15, -21.85, CY + 0.3, CY + 2.3, "sid_lav"); gable(6.15, -30.15, -21.85, CY + 0.3, CY + 2.3, "sid_lav")
	box(-6.4, 0, -30.4, 6.4, 0.3, -29.85, "stone", {solid = false}); box(-6.4, 0, -22.15, 6.4, 0.3, -21.6, "stone", {solid = false})
	# ドア：玄関と、右の寝室
	H1.front = mkDoor({x = 0, z = -22, y = FY, w = 0.96, h = 2.13, axis = "x", hinge = 1, swing = -1, mat = "door_r", panel = "door_rp", name = "玄関", inside = -1, lock = "key:key_red"})
	H1.bedDoor = mkDoor({x = 2, z = -24, y = FY, w = 0.96, h = 2.1, axis = "z", hinge = -1, swing = 1, mat = "doorc", panel = "doorc2", arch = true, name = "寝室のドア"})
	H1.winBed = mkWindow({axis = "x", x = 4, z = -22, y0 = 1.1, w = 2, h = 1.1, breakable = true}); mkWindow({axis = "x", x = -4, z = -22, y0 = 1.1, w = 2, h = 1.1})
	# ポーチと電気の箱
	box(-2.6, 0, -21.85, 2.6, FY, -20.4, "wood_m", {s = "wood"}); box(-1.6, 0, -20.4, 1.6, 0.15, -20, "wood_m", {s = "wood"})
	for xx in [-2.45, 2.45]: box(xx - 0.08, FY, -20.55, xx + 0.08, 2.9, -20.4, "trim", {s = "wood"})
	box(-2.8, 2.9, -21.85, 2.8, 3.1, -20.2, "roof_dark", {s = "wood"})
	var eb := MB.new(); eb.box(-0.2, -0.25, -0.06, 0.2, 0.25, 0, MATS.metal); eb.box(-0.08, 0.05, 0.0, 0.08, 0.18, 0.005, MATS.yellow); var ebg := eb.build(); ebg.position = Vector3(1.4, 1.35, -21.84); scene.add_child(ebg)
	H1.eboxLid = mkLeaf({x = 1.4, y = 1.1, z = -21.83, w = 0.4, h = 0.5, axis = "x", hinge = -1, swing = 1, mat = "metal", t = 0.02, ang = PI * 0.6, knob = false})
	var sg := G.box(0.05, 0.14, 0.05)
	for k in sg.p.size(): sg.p[k] += Vector3(0, 0.05, 0)
	var sw := mesh(sg, MATS.red); sw.position = Vector3(1.4, 1.33, -21.83); sw.rotation.x = 0.7; scene.add_child(sw)
	H1.ebox = {open = false, on = false, sw = sw, it = null}
	H1.ebox.it = addIt({box = Box.new(1.15, 1.05, -21.9, 1.65, 1.65, -21.6), label = func(_it): return {t = "電気が通っている", k = "", n = "電気の箱"} if H1.ebox.on else {t = "スイッチを入れる" if H1.ebox.open else "開ける", k = "E", n = "電気の箱"},
		act = func():
			var E: Dictionary = H1.ebox
			if E.on: return
			if not E.open:
				E.open = true; H1.eboxLid.m.tgt = 1.0; sfx("cab", true); return
			E.on = true; sw.rotation.x = -0.7; sfx("switch"); homeLights(true)
			if story.get("onPower"): story.onPower.call()})
	# 中の家具
	bed(4.6, FY, -28.6, 0, "bed_b", 1.1, 2); H1.ward = wardrobe(2.5, FY, -29.5, 0, {w = 1, d = 0.6, h = 2, mat = "wood_m", hide = true, name = "クローゼット"}); lamp(5.6, FY, -22.6, 1.3); rug(2.5, -27, 5.5, -23, FY, "carpet_p")
	H1.bedIt = addIt({box = Box.new(4.05, FY, -29.6, 5.15, 1.1, -27.6), label = func(_it): return {t = "昼寝する", k = "E", n = "ベッド"} if story.canSleep.call() else {t = story.sleepMsg.call(), k = "", n = "ベッド"},
		act = func():
			if story.canSleep.call(): story.sleep.call()})
	coatRack(-1.5, FY, -22.6); picture(-1.94, 1.7, -27, 1, 0.5, 0.5, 71); sofa(-4, FY, -28.8, 0, "sofa_g", 2); H1.tv = tvSet(-4, FY, -22.6, 2); ceilLamp(0, CY, -26); ceilLamp(4, CY, -26); ceilLamp(-4, CY, -26)
	for xz in [[0, -26], [4, -26], [-4, -26]]:
		var L := plight("#ffd9a0", 0, 8, 1.4); L.position = Vector3(xz[0], CY - 0.5, xz[1]); scene.add_child(L); H1.lights.append(L)
	# 庭：柵・車よせ
	picket(-20, -6.6, -1, -6.6); picket(1, -6.6, 3.6, -6.6); picket(7.6, -6.6, 20, -6.6); picket(-20, -6.6, -20, -34); picket(20, -6.6, 20, -34); picket(-20, -34, 20, -34)
	box(-0.8, 0, -20, 0.8, 0.05, -6.6, "walk", {s = "stone", uv = 1}); box(3.6, 0, -19, 7.6, 0.04, -4, "concrete", {s = "stone"})
	bush(-5.5, -21, 1); bush(5.8, -20.8, 0.9); flowers(-5, -21.4, -3, -20.6); treeAt(-12, -14, 1.3); treeAt(13, -24, 1.2); treeAt(-14, -28, 1.1); mailbox(-1.6, -6.2, "blue")
func homeLights(on: bool) -> void:
	H1.power = on
	for L in H1.lights: li(L, (1.5 if ENV.mode == "day" else 5.0) if on and QUAL else 0.0)
# ---- 自分の車（屋根に荷物）----
var MYCAR = null
func buildMyCar() -> Dictionary:
	var g := Node3D.new(); var saveW := W; W = MB.new(); NOSOLID = true; carModel(0, 0, 0, "car_y"); NOSOLID = false # ローカルに作ってからグループへ
	var bb := W.build(); g.add_child(bb); W = saveW
	# 屋根の荷物
	var mb := MB.new(); mb.box(-0.55, 1.47, -0.9, 0.55, 1.49, 0.7, MATS.black); mb.box(-0.5, 1.49, -0.8, 0.3, 1.9, -0.1, MATS.cardboard); mb.box(-0.3, 1.49, 0, 0.45, 1.75, 0.6, MATS.brown); mb.box(-0.25, 1.9, -0.7, 0.15, 2.2, -0.3, MATS.cardboard)
	# いす
	mb.box(-0.2, 1.75, 0.1, 0.3, 1.8, 0.5, MATS.wood_m); mb.box(0.25, 1.8, 0.1, 0.3, 2.25, 0.5, MATS.wood_m)
	for ab in [[-0.18, 0.12], [-0.18, 0.48], [0.28, 0.12]]: mb.box(ab[0] - 0.02, 1.8, ab[1] - 0.02, ab[0] + 0.02, 2.05, ab[1] + 0.02, MATS.wood_m)
	mb.box(-0.6, 1.6, -0.95, 0.6, 1.62, -0.93, MATS.red); g.add_child(mb.build()); set_cast(g, true); scene.add_child(g)
	MYCAR = {g = g, col = [], body = null}
	return MYCAR
func parkMyCar(x: float, z: float, yaw: float) -> void:
	var C = MYCAR; C.g.position = Vector3(x, 0, z); C.g.rotation.y = yaw
	for b in C.col: b.on = false
	var c := absf(sin(yaw)) > 0.5
	var hx := 2.1 if c else 0.9; var hz := 0.9 if c else 2.1
	if not C.body: C.body = dyn_box(0, 0, 0, 0, 0, 0, "metal", null)
	set_box(C.body, x - hx, 0, z - hz, x + hx, 1.4, z + hz); C.body.on = true
# ---- 空に浮かぶ手書きの説明 ----
var HINTTXT := []
func floatText(txt: String, x: float, y: float, z: float, arrow := 0, size := 1.0) -> Label3D:
	var s := Label3D.new(); s.text = txt + ("\n→" if arrow > 0 else "\n←" if arrow < 0 else "")
	s.font_size = 58; s.outline_size = 10; s.outline_modulate = Color(0.08, 0.08, 0.08, 0.55); s.modulate = Color.WHITE
	s.pixel_size = 1.6 * size / 512.0; s.billboard = BaseMaterial3D.BILLBOARD_ENABLED; s.shaded = false; s.double_sided = true; s.render_priority = 6
	s.position = Vector3(x, y, z); scene.add_child(s); HINTTXT.append(s)
	return s
# ================= 夢：地下室の中は「町の通り」=================
var DREAM := {g = null, L = null, wheel = null}
func buildDreamSet() -> void:
	var saveW := W; W = MB.new() # 地下室の階段のところに置く（ふだんは見えない）
	box(-9.85, F1 - 0.02, 22.1, -7.1, F1, 26.9, "asphalt", {solid = false, uv = 3}); box(-9.84, F1, 26.8, -7.12, 3, 26.85, "citynight", {solid = false, uv = 3}); box(-9.84, F1, 22.1, -9.8, 3, 26.8, "citynight", {solid = false, uv = 4}); box(-7.14, F1, 22.1, -7.1, 3, 26.8, "citynight", {solid = false, uv = 4})
	var z := 22.6
	while z < 26.6:
		box(-8.55, F1, z, -8.45, F1 + 0.01, z + 0.6, "road_y", {solid = false}); z += 1.2
	cyl(-9.4, F1, 25.8, 0.05, 2.6, "dgrey", 6); box(-9.5, F1 + 2.5, 25.6, -9.1, F1 + 2.6, 26, "lamp", {solid = false})
	var g := W.build({shadow = false}); W = saveW; g.visible = false; scene.add_child(g); DREAM.g = g
	var L := plight("#ffd080", 0, 8, 1.5); L.position = Vector3(-9.2, 2.6, 25.7); scene.add_child(L); DREAM.L = L
	var wheel := MB.new(); wheel.cyl(0, 0, 0, 0.36, 0.22, MATS.tire, 16, null, "x"); wheel.cyl(0, 0, 0, 0.2, 0.24, MATS.chrome, 10, null, "x"); DREAM.wheel = wheel.build(); DREAM.wheel.visible = false; scene.add_child(DREAM.wheel)
# ================= 悪夢：遊園地（かくれんぼの練習）=================
var CARN := {g = null, ox = 600.0, oz = 0.0, ward = null, wheel = null, lights = [], sign = null, bedHide = null}
func buildCarnival() -> void:
	var saveW := W; W = MB.new(); var ox: float = CARN.ox; var oz: float = CARN.oz
	box(ox - 120, -0.5, oz - 120, ox + 120, 0, oz + 120, "concrete", {s = "stone", uv = 8})
	# はじめの囲い
	for q in [[-3, -3, 3, -2.8], [-3, -3, -2.8, 3], [2.8, -3, 3, 3]]: box(ox + q[0], 0, oz + q[1], ox + q[2], 1.4, oz + q[3], "red", {s = "metal"})
	box(ox - 3, 0, oz + 2.8, ox - 1, 1.4, oz + 3, "red", {s = "metal"}); box(ox + 1, 0, oz + 2.8, ox + 3, 1.4, oz + 3, "red", {s = "metal"})
	box(ox - 1.1, 0, oz + 2.85, ox - 0.95, 3.2, oz + 3, "yellow", {s = "metal"}); box(ox + 0.95, 0, oz + 2.85, ox + 1.1, 3.2, oz + 3, "yellow", {s = "metal"})
	# かくれる所：ベッドとたんす
	bed(ox - 5, 0, oz + 12, 1, "bed_b", 1.1, 2); CARN.ward = wardrobe(ox + 5, 0, oz + 12, 3, {w = 1.1, d = 0.6, h = 2.1, mat = "wood_d", hide = true, name = "たんす"})
	box(ox - 4.4, 0, oz + 10.6, ox - 4.3, 2, oz + 10.7, "wood_d", {solid = false}); box(ox + 4.3, 0, oz + 10.6, ox + 4.4, 2, oz + 10.7, "wood_d", {solid = false})
	# 観覧車（遠く）
	var fw := Node3D.new(); var fm := MB.new()
	for i in 16:
		var a := i / 16.0 * TAU; fm.rbox(cos(a) * 7, sin(a) * 7, 0, 0.2, 14, 0.2, 0, 0, a + PI / 2, MATS.white); fm.rbox(cos(a) * 14, sin(a) * 14, 0, 0.3, 0.3, 0.3, 0, 0, 0, MATS.bulbr)
	for i in 32:
		var a := i / 32.0 * TAU; fm.rbox(cos(a) * 14, sin(a) * 14, 0, 0.25, 2.8, 0.25, 0, 0, a, MATS.white)
	for i in 8:
		var a := i / 8.0 * TAU; fm.box(cos(a) * 14 - 0.6, sin(a) * 14 - 1.6, -0.6, cos(a) * 14 + 0.6, sin(a) * 14 - 0.4, 0.6, MATS[["red", "yellow", "blue", "green"][i % 4]])
	fw.add_child(fm.build()); fw.position = Vector3(ox + 10, 16, oz + 70); scene.add_child(fw); CARN.wheel = fw
	for s in [-1, 1]: rbox(ox + 10 + s * 5, 8, oz + 70, 0.4, 17, 0.4, 0, 0, s * 0.3, "white")
	# テント・屋台
	for q in [[-30, 50, "red"], [-18, 58, "yellow"], [28, 48, "blue"], [40, 60, "red"]]:
		cyl(ox + q[0], 0, oz + q[1], 3.5, 3, q[2], 12); cyl(ox + q[0], 3, oz + q[1], 3.6, 2.5, "white", 12, {rt = 0.1})
	var g := W.build(); W = saveW; scene.add_child(g); CARN.g = g; CARN.lights = []
	for xz in [[0, 6], [-5, 12], [5, 12]]:
		var L := plight("#ffe0a0", 0, 16, 1.4); L.position = Vector3(ox + xz[0], 4, oz + xz[1]); scene.add_child(L); CARN.lights.append(L)
	CARN.sign = signp(ox, 2.8, oz + 2.92, 1.9, 0.6, "tall", PI); signp(ox - 5, 2.2, oz + 10.72, 1, 0.38, "hidehere", PI); signp(ox + 5, 2.2, oz + 10.72, 1, 0.38, "hidehere", PI)
	CARN.bedHide = mkBedHide(ox - 5, 0, oz + 12, 0, Box.new(ox - 6.1, 0, oz + 11.4, ox - 3.9, 0.9, oz + 12.6), {x = ox - 5, y = 0, z = oz + 10.3}, "ベッド")
# ================= 最後：棺の中から見上げる =================
var GRAVE := {g = null, ox = 900.0, oz = 0.0, lid = null}
func buildGraveEnd() -> void:
	var saveW := W; W = MB.new(); var ox: float = GRAVE.ox; var oz: float = GRAVE.oz
	for q in [[-40, -40, 40, -1.6], [-40, 1.6, 40, 40], [-40, -1.6, -1, 1.6], [1, -1.6, 40, 1.6]]: box(ox + q[0], -0.5, oz + q[1], ox + q[2], 0, oz + q[3], "grass", {uv = 3})
	box(ox - 1, -2.2, oz - 1.6, ox + 1, -2, oz + 1.6, "dirt", {solid = false})
	for q in [[-1, -1.6, -0.8, 1.6], [0.8, -1.6, 1, 1.6], [-1, -1.6, 1, -1.4], [-1, 1.4, 1, 1.6]]: box(ox + q[0], -2.2, oz + q[1], ox + q[2], 0, oz + q[3], "dirt", {solid = false})
	var cf := MB.new(); cf.box(-0.42, 0, -1.1, 0.42, 0.08, 1.1, MATS.wood_d)
	for q in [[-0.42, -1.1, -0.34, 1.1], [0.34, -1.1, 0.42, 1.1], [-0.42, -1.1, 0.42, -1.02], [-0.42, 1.02, 0.42, 1.1]]: cf.box(q[0], 0, q[1], q[2], 0.5, q[3], MATS.wood_d)
	cf.box(-0.34, 0.08, -1.02, 0.34, 0.14, 1.02, MATS.fab_r); var cg := cf.build(); cg.position = Vector3(ox, -2, oz); scene.add_child(cg)
	box(ox - 0.06, 0, oz - 2.2, ox + 0.06, 1.6, oz - 2.08, "wood_d", {solid = false}); box(ox - 0.45, 1.05, oz - 2.2, ox + 0.45, 1.17, oz - 2.08, "wood_d", {solid = false}) # 十字架
	for i in 7:
		var a := i / 7.0 * TAU + 0.4; var r := rr(8, 14); treeAt(ox + cos(a) * r, oz + sin(a) * r, 1.2)
	var g := W.build(); W = saveW; scene.add_child(g); GRAVE.g = g
	var lid := mesh(G.box(0.86, 0.07, 2.2), MATS.wood_m, true); scene.add_child(lid); GRAVE.lid = lid; lid.visible = false

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

# ---- 仮の部品（あとで本物に入れかえる）----
var TOUCH := false
var story := {part = "", step = 0, flags = {}, stats = {time = 0, caught = 0, sleeps = 0}, usedEntry = null, obj = "",
	canSleep = func(): return false, sleepMsg = func(): return "", sleep = func(): pass}
var P := {}
var CUT := {on = false, cam = null, skip = false}
var NB := {state = "idle", anim = "idle", look = 0.0, sawHide = null, p = Vector3()}
func sfx(_k: String, _a = null) -> void: pass
func sfxStep(_s: String, _v := 0.6) -> void: pass
func sfxGlass(_p: Vector3, _v := 1.0) -> void: pass
func sfxImpact(_pr, _sp, _s) -> void: pass
func sfxDoor(_d, _o) -> void: pass
func toast(s: String, _t := 2.2) -> void: print("TOAST ", s)
func ui_cls(_id: String, _c: String, _on: bool) -> void: pass
func ui_prompt(_s: String) -> void: pass
func ui_iname(_s: String) -> void: pass
func drawInv() -> void: pass
func setLoad(_p: float) -> void: pass
func setup_ui() -> void: pass
func showScreen(_n: String, _on: bool) -> void: pass
func toTitle() -> void: STATE = "title"
func newGame() -> void: pass
func contGame() -> void: pass
class Waiter extends RefCounted:
	signal done
	var t := 0.0
	var fn = null
var WAITS := []
func wait(s: float) -> Signal:
	var w := Waiter.new(); w.t = GT + s; WAITS.append(w)
	return w.done
func after(s: float, fn: Callable) -> void:
	var w := Waiter.new(); w.t = GT + s; w.fn = fn; WAITS.append(w)
func later(s: float, fn: Callable) -> void:
	get_tree().create_timer(s, true).timeout.connect(fn)
func updWaits() -> void:
	for i in range(WAITS.size() - 1, -1, -1):
		if i >= WAITS.size(): continue
		if GT >= WAITS[i].t or CUT.skip:
			var w = WAITS[i]; WAITS.remove_at(i)
			if w.fn: w.fn.call()
			else: w.done.emit()
func updTexts(_dt: float) -> void: pass
func updStory(_dt: float) -> void: pass
func updNeighbor(_dt: float) -> void: pass
func updLearning(_dt: float) -> void: pass
func updCutCam(_dt: float) -> void: pass
func updCharge(_dt: float) -> void: pass
func updCamLeds() -> void: pass
func updAudio(_dt: float) -> void: pass
func updTrain(_dt: float) -> void: pass
func animNB(_dt: float) -> void: pass
func a1Update(_dt: float) -> void: pass
func toggleSuitcase(_pr) -> void: pass
func takeSlot(_s) -> void: pass
func putSlot(_s, _it) -> void: pass
func setPropHot(_pr, _on) -> void: pass
func playerInWater() -> bool: return false
func placeA1Props() -> void: pass
func onNProperty(_o) -> bool: return false
func nbNoteHide(_h) -> void: pass
func initPropDefsA1() -> void: pass
func fallFaint() -> void: pass
func buildTrain() -> void: pass
func buildShark() -> void: pass
func buildNeighbor() -> void: pass
func buildNavA1() -> void: pass
func buildElevator() -> void: pass
func buildCamerasA1() -> void: pass
func buildBricks() -> void: pass
func buildBaseLock() -> void: pass
func armAlarm(_pr) -> void: pass
func underBedFind() -> void: pass
func mkBedHide(x: float, y: float, z: float, yaw: float, bx, out, name := "", onEnter = null) -> Dictionary:
	var h := {pos = Vector3(x, y + 0.28, z), yaw = yaw, box = bx, out = out, name = name if name else "ベッドの下", under = true, cab = null, nb = null, it = null}
	h.it = addIt({box = bx, label = func(_it): return {t = "ベッドの下に隠れる", k = "E", n = name if name else "ベッド"}, act = func():
		enterHide(h)
		if onEnter: onEnter.call()})
	HIDES.append(h)
	return h

# ================= テレビ =================
func setTV(on: bool) -> void:
	A.tvOn = on; var m: StandardMaterial3D = A.tv.mesh.surface_get_material(0)
	m.albedo_color = Color("#9ac8f0") if on else Color("#101418"); m.emission_enabled = on; m.emission = Color("#5a90c8"); m.emission_energy_multiplier = 1.0 if on else 0.0
var tvNoiseT := 0.0
# ================= 毎フレーム =================
var FROZEN := false        # テストのとき：時間を止める
var NORENDER := false
var MANUAL := false        # テストのとき：自分で step を呼ぶ
func _process(delta: float) -> void:
	if MANUAL: return
	var dt := minf(delta, 0.05)
	if FROZEN: dt = 0.0
	step(dt)
func step(dt: float) -> void:
	if STATE == "load": return
	var playing := STATE == "play" or STATE == "cut" or STATE == "caught"
	if playing or STATE == "title" or STATE == "ending": GT += dt
	updWaits(); updTexts(dt)
	if playing:
		updCharge(dt)
		if STATE == "play": updatePlayer(dt)
		PL.p = depenetrate(PL.p, PR, PL.h); updProps(dt); updMovers(dt); updNeighbor(dt); updLearning(dt); updStory(dt)
		if STATE == "play": updTarget()
		else:
			ui_prompt(""); lastPrompt = ""
		a1Update(dt)
		if A.get("tvOn"):
			tvNoiseT -= dt
			if tvNoiseT <= 0:
				tvNoiseT = 3.0; noise(-9.5, 1, 19.2, 15, "tv")
	elif STATE == "title":
		NB.anim = "wave" if int(floor(GT / 6)) % 3 == 2 else "idle"; NB.look = sin(GT * 0.3) * 0.4; animNB(dt); updMovers(dt); updTrain(dt)
		var a := GT * 0.05; camera.position = Vector3(sin(a) * 4 - 2, 1.8 + sin(GT * 0.2) * 0.2, -9 + cos(a) * 1.5); camera.look_at(Vector3(-1, 6.5, 22))
	else: updMovers(0)
	updPFX(dt); updCamera(dt)
	if CUT.cam: updCutCam(dt)
	updHand(dt)
	updAudio(dt)
	# 画面の効果
	if grade_mat:
		GRADE.red = damp(GRADE.red, 0.5 if NB.state == "catch" else 0.0, 4, dt); GRADE.vig = damp(GRADE.vig, 1.5 if NB.state == "chase" else 0.9, 3, dt)
		grade_mat.set_shader_parameter("uRed", GRADE.red); grade_mat.set_shader_parameter("uVig", GRADE.vig); grade_mat.set_shader_parameter("uFlash", GRADE.flash)
	ui_cls("hurt", "on", PL.hurtT > 0)
var GRADE := {red = 0.0, vig = 0.9, flash = 0.0}
# ================= はじまり =================
var BOOTED := false
func _ready() -> void:
	load_settings()
	ROT = S3.land
	scene = Node3D.new(); scene.name = "World"; add_child(scene)
	load_mats()
	setup_render()
	setup_ui()
	boot()
func boot() -> void:
	TOUCH = is_phone()
	setLoad(0.1); await get_tree().process_frame
	initPropDefs(); initPropDefsA1(); setLoad(0.25); await get_tree().process_frame
	# 世界
	W = MB.new(); buildA1Street(); buildA1Home(); buildA1House(); var g1 := W.build(); scene.add_child(g1); setLoad(0.55); await get_tree().process_frame; W = MB.new()
	buildDreamSet(); buildCarnival(); buildGraveEnd(); W = MB.new()
	initPFX(); buildNeighbor(); buildNavA1(); buildShark(); buildElevator(); buildTrain(); buildBricks(); buildBaseLock(); buildCamerasA1(); buildMyCar(); parkMyCar(5.6, -12, PI); placeA1Props()
	# ベッドの下に隠れる（おとなりさんの寝室。バールが見つかる）
	A.bedHide = mkBedHide(8.7, F1, 24.3, PI / 2, Box.new(7.6, F1, 23.6, 9.8, F1 + 0.9, 25), {x = 7.1, y = F1, z = 24.3}, "ベッド", underBedFind)
	for h in HIDES: h.nb = onNProperty(h.out)
	# テレビ
	addIt({box = Box.new(-9.9, 0.3, 18.5, -9.1, 1.4, 19.9), label = func(_it): return {t = "テレビを消す" if A.get("tvOn") else "テレビをつける", k = "E", n = "テレビ"},
		act = func():
			setTV(not A.get("tvOn")); sfx("click")
			if A.tvOn: noise(-9.5, 1, 19.2, 15, "tv")})
	# ここまでに作った小物（エレベーターのボタン・汽車の線路・監視室のパネルなど）をまとめて描く
	var g2 := W.build(); scene.add_child(g2); W = MB.new()
	setTV(false); buildHand(); setLoad(0.8); await get_tree().process_frame
	setEnv("evening"); drawInv()
	setLoad(1.0); await get_tree().process_frame
	showScreen("loading", false); toTitle(); BOOTED = true
	var auto = store_get("otonari-a1-auto")
	if auto != null:
		store_set("otonari-a1-auto", null)
		if auto == "new": newGame()
		elif auto == "cont": contGame()
