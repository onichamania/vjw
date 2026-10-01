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
	static func torus(radius: float, tube: float, rs := 8, ts := 6, arc := TAU) -> Geo:
		var g := Geo.new()
		for j in rs + 1:
			for i in ts + 1:
				var u := float(i) / ts * arc; var v := float(j) / rs * TAU
				var p := Vector3((radius + tube * cos(v)) * cos(u), (radius + tube * cos(v)) * sin(u), tube * sin(v))
				g.p.append(p); g.n.append((p - Vector3(radius * cos(u), radius * sin(u), 0)).normalized()); g.u.append(Vector2(float(i) / ts, float(j) / rs))
		for j in range(1, rs + 1):
			for i in range(1, ts + 1):
				var a := (ts + 1) * j + i - 1; var b := (ts + 1) * (j - 1) + i - 1; var c := (ts + 1) * (j - 1) + i; var d := (ts + 1) * j + i
				g.i.append_array([a, b, d, b, c, d])
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
	var s := ""; var T = PL.target; var H = held(); var touch: bool = BODY.touch
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
	B.setOn = func(on: bool) -> void:
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
	B.setOn.call(false)
	return B
func pryBoard(B: Dictionary) -> void:
	sfx("pry"); PL.swing = 0.5; noise(B.x, B.y, B.z, 9, "pry")
	after(0.45, func():
		B.setOn.call(false); sfx("boardfall"); var p := spawnProp("board", B.x, B.y - 0.1, B.z - 0.25, 0); propDropAt(p, B.x, B.y - 0.1, B.z - 0.3, PI / 2, Vector3(0, 1, -1.2))
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

# ================= アルファ1の仕掛け =================
# ---- 新しい持ち物 ----
func initPropDefsA1() -> void:
	pdef("key_red", {name = "赤い取っ手の鍵", hx = 0.08, h = 0.03, hz = 0.04, w = 0.1, mk = func(b: MB): b.box(-0.08, 0, -0.03, -0.02, 0.025, 0.03, M("red")); b.box(-0.02, 0.005, -0.007, 0.08, 0.02, 0.007, M("brass")); b.box(0.05, 0.005, 0.007, 0.06, 0.02, 0.02, M("brass")); b.box(0.07, 0.005, 0.007, 0.075, 0.02, 0.016, M("brass"))})
	pdef("bell", {name = "ベル", hx = 0.07, h = 0.16, hz = 0.07, w = 0.4, mk = func(b: MB): b.cyl(0, 0.02, 0, 0.07, 0.1, M("brass"), 14, {rt = 0.035}); b.sphere(0, 0.12, 0, 0.035, M("brass")); b.cyl(0, 0.14, 0, 0.012, 0.03, M("wood_d"), 6); b.sphere(0, 0.005, 0, 0.02, M("metal_dark"))})
	pdef("shovel", {name = "シャベル", hx = 0.13, h = 1.1, hz = 0.05, w = 1.2, mk = func(b: MB):
		b.cyl(0, 0.32, 0, 0.018, 0.72, M("wood_m"), 6); b.box(-0.1, 1.02, -0.012, 0.1, 1.06, 0.012, M("black")); b.box(-0.1, 1.02, -0.01, -0.085, 1.1, 0.01, M("black")); b.box(0.085, 1.02, -0.01, 0.1, 1.1, 0.01, M("black")); b.box(-0.1, 1.08, -0.01, 0.1, 1.1, 0.01, M("black"))
		b.rbox(0, 0.14, 0, 0.22, 0.26, 0.02, 0, 0, 0, M("metal")); b.rbox(0, 0.02, 0, 0.16, 0.06, 0.02, 0, 0, 0, M("metal"))})
	pdef("mannequin", {name = "先生のマネキン", hx = 0.25, h = 1.65, hz = 0.2, w = 3, solid = true, mk = func(b: MB):
		b.cyl(0, 0, 0, 0.2, 0.04, M("wood_d"), 12); b.cyl(0, 0.04, 0, 0.025, 0.45, M("wood_d"), 6); b.cyl(0, 0.45, 0, 0.25, 0.5, M("brown"), 14, {rt = 0.18}); b.cyl(0, 0.95, 0, 0.19, 0.45, M("fab_w"), 14, {rt = 0.2})
		b.sphere(0, 1.46, 0, 0.1, M("skinm"), 1, 1.2, 1); b.sphere(0, 1.54, -0.06, 0.07, M("black")); b.cyl(0, 1.36, 0, 0.04, 0.08, M("skinm"), 6)
		for s in [-1, 1]:
			b.rbox(s * 0.24, 1.1, 0, 0.07, 0.4, 0.07, 0, 0, s * 0.25, M("fab_w")); b.rbox(s * 0.29, 0.85, 0.08, 0.06, 0.3, 0.06, -0.6, 0, s * 0.1, M("skinm"))})
	for cc in [["0", "#e04030"], ["1", "#30a050"], ["2", "#e0a020"], ["3", "#3070d0"], ["4", "#9040c0"], ["5", "#40c0c0"], ["6", "#e06090"], ["7", "#30a050"], ["8", "#e04030"], ["9", "#e0a020"], ["A", "#e04030"], ["F", "#e0a020"]]:
		var ch: String = cc[0]
		pdef("mag_" + ch, {name = "マグネット「" + ch + "」", hx = 0.09, h = 0.03, hz = 0.11, w = 0.15, digit = int(ch) if ch.is_valid_int() else null, ch = ch, mk = func(b: MB):
			var tm := digitMat(ch)
			# 上の面だけ数字の絵（three.js の箱の6面の素材のかわり）
			b.box(-0.09, 0, -0.11, 0.09, 0.03, 0.11, MATS.cab, 1 | 2 | 8 | 16 | 32)
			var g := G.plane(0.18, 0.22)
			b.geo(g, Transform3D(Basis(Vector3.RIGHT, -PI / 2), Vector3(0, 0.0301, 0)), tm, 1, 1)})
	pdef("toyrifle", {name = "おもちゃの銃", hx = 0.5, h = 0.12, hz = 0.06, w = 1, mk = func(b: MB): b.box(-0.5, 0.02, -0.035, -0.1, 0.1, 0.035, M("orange")); b.box(-0.1, 0.04, -0.02, 0.45, 0.08, 0.02, M("can_g")); b.box(-0.3, -0.06, -0.02, -0.22, 0.04, 0.02, M("orange")); b.cyl(0.45, 0.06, 0, 0.02, 0.04, M("red"), 8, {axis = "x"})})
	pdef("silverkey", {name = "銀の鍵", hx = 0.08, h = 0.02, hz = 0.04, w = 0.1, key = true, mk = func(b: MB): b.cyl(-0.05, 0, 0, 0.03, 0.012, M("silver"), 12); b.box(-0.02, 0, -0.008, 0.08, 0.012, 0.008, M("silver")); b.box(0.05, 0, 0.008, 0.06, 0.012, 0.022, M("silver"))})
	pdef("copperkey", {name = "ハートの銅の鍵", hx = 0.08, h = 0.02, hz = 0.05, w = 0.1, key = true, mk = func(b: MB):
		for s in [-1, 1]: b.cyl(-0.05, 0, s * 0.018, 0.026, 0.012, M("copper"), 12)
		b.rbox(-0.03, 0.006, 0, 0.04, 0.012, 0.04, 0, PI / 4, 0, M("copper")); b.box(-0.01, 0, -0.008, 0.08, 0.012, 0.008, M("copper")); b.box(0.05, 0, 0.008, 0.06, 0.012, 0.022, M("copper"))})
	pdef("lockpick", {name = "ピッキング道具", hx = 0.1, h = 0.02, hz = 0.03, w = 0.1, mk = func(b: MB): b.box(-0.1, 0, -0.02, -0.02, 0.02, 0.02, M("black")); b.box(-0.02, 0.008, -0.004, 0.1, 0.012, 0.004, M("chrome")); b.box(-0.02, 0.004, 0.008, 0.08, 0.008, 0.012, M("chrome"))})
	pdef("hammer", {name = "ハンマー", hx = 0.16, h = 0.05, hz = 0.08, w = 0.7, mk = func(b: MB): b.box(-0.16, 0.01, -0.015, 0.12, 0.04, 0.015, M("wood_m")); b.box(0.1, 0, -0.07, 0.16, 0.05, 0.05, M("metal_dark")); b.rbox(0.13, 0.025, 0.07, 0.04, 0.04, 0.05, 0, 0, 0, M("metal_dark"))})
	pdef("jackhammer", {name = "削岩機", hx = 0.2, h = 0.95, hz = 0.12, w = 2, mk = func(b: MB): b.cyl(0, 0.05, 0, 0.015, 0.25, M("chrome"), 6); b.cyl(0, 0.3, 0, 0.09, 0.4, M("red"), 12); b.box(-0.07, 0.7, -0.08, 0.07, 0.78, 0.08, M("black")); b.cyl(0, 0.84, 0, 0.02, 0.35, M("black"), 6, {axis = "x"}); b.box(-0.2, 0.8, -0.02, -0.15, 0.88, 0.02, M("black")); b.box(0.15, 0.8, -0.02, 0.2, 0.88, 0.02, M("black"))})
	pdef("alarm", {name = "目覚まし時計", hx = 0.07, h = 0.15, hz = 0.05, w = 0.3, tool = "alarm", mk = PDEF.clock.mk})
	pdef("paper", {name = "紙くず", hx = 0.04, h = 0.07, hz = 0.04, w = 0.05, mk = func(b: MB): b.sphere(0, 0.035, 0, 0.035, M("cream"), 1, 1, 1, 6)})
	pdef("tire", {name = "タイヤ", hx = 0.35, h = 0.25, hz = 0.35, w = 1.5, bouncy = true, mk = func(b: MB): b.cyl(0, 0, 0, 0.35, 0.25, M("tire"), 14); b.cyl(0, -0.01, 0, 0.16, 0.27, M("chrome"), 10)})
	pdef("broom", {name = "ほうき", hx = 0.12, h = 1.3, hz = 0.05, w = 0.6, mk = func(b: MB): b.cyl(0, 0.35, 0, 0.015, 0.95, M("wood_m"), 6); b.box(-0.12, 0, -0.03, 0.12, 0.35, 0.03, M("straw"))})
	pdef("bulb_w", {name = "電球（長い白）", hx = 0.03, h = 0.3, hz = 0.03, w = 0.1, glass = true, mk = func(b: MB): b.cyl(0, 0.03, 0, 0.025, 0.27, M("bulbw"), 8); b.cyl(0, 0, 0, 0.02, 0.04, M("chrome"), 8)})
	pdef("bulb_r", {name = "電球（赤）", hx = 0.03, h = 0.2, hz = 0.03, w = 0.1, glass = true, mk = func(b: MB): b.cyl(0, 0.03, 0, 0.025, 0.17, M("bulbr"), 8); b.cyl(0, 0, 0, 0.02, 0.04, M("chrome"), 8)})
var _dig := {}
func digitMat(ch: String) -> Material:
	if not _dig.has(ch): _dig[ch] = std_mat({map = load("res://assets/canvas/dig_%s.png" % ch), rough = 0.6})
	return _dig[ch]
# ================= 水とサメトロン =================
var SHARK := {p = Vector3(-6, WS - 0.25, 27), yaw = 0.0, ang = 0.0, g = null, prop = null, mode = "circle", cool = 0.0}
func buildShark() -> void:
	var g := Node3D.new(); var mb := MB.new() # 機械の胴体（水の下）
	mb.cyl(0, 0, 0, 0.36, 1.6, MATS.shark, 14, {axis = "z", rt = 0.24}); mb.sphere(0, 0, 0.8, 0.3, MATS.shark, 1, 0.9, 1.2); mb.box(-0.4, -0.08, -0.3, 0.4, 0.08, 0.3, MATS.metal_dark)
	# ひれ（水の上に出る）
	mb.rbox(0, 0.55, -0.1, 0.06, 0.7, 0.55, 0.45, 0, 0, MATS.shark); mb.rbox(0, 0.12, -0.95, 0.05, 0.5, 0.35, -0.5, 0, 0, MATS.shark)
	# 目（赤いランプ）
	mb.sphere(-0.18, 0.12, 1, 0.05, MATS.bulbr); mb.sphere(0.18, 0.12, 1, 0.05, MATS.bulbr); g.add_child(mb.build())
	# 前のトラバサミ
	var tr := MB.new(); tr.cyl(0, 0, 1.18, 0.22, 0.03, MATS.metal_dark, 14, null, "z")
	for i in 9:
		var a := i / 8.0 * PI; tr.box(cos(a) * 0.2 - 0.012, -0.04, 1.2 - 0.012, cos(a) * 0.2 + 0.012, 0.04 + sin(a) * 0.14, 1.2 + 0.012, MATS.metal)
	g.add_child(tr.build())
	# プロペラ
	var pr := Node3D.new(); var pm := MB.new()
	for i in 3: pm.rbox(0, 0, 0, 0.05, 0.42, 0.02, 0, 0, i * TAU / 3, MATS.brass)
	pr.add_child(pm.build()); pr.position.z = -1.05; g.add_child(pr); SHARK.prop = pr
	g.position = SHARK.p; scene.add_child(g); SHARK.g = g
const POOL := {x0 = -10.0, x1 = -2.0, z0 = 22.0, z1 = 32.0}
func inPool(x: float, z: float, m := 0.0) -> bool: return x > POOL.x0 + m and x < POOL.x1 - m and z > POOL.z0 + m and z < POOL.z1 - m
func playerInWater() -> bool: return not A.water.frozen and inPool(PL.p.x, PL.p.z) and PL.p.y < WS - 0.05 and PL.p.y > 2.5
func updShark(dt: float) -> void:
	if not SHARK.g: return
	var S := SHARK
	if A.water.frozen:
		S.g.position.y = damp(S.g.position.y, WS - 0.12, 3, dt); return
	S.prop.rotation.z += dt * 14; S.cool -= dt; var inW := playerInWater()
	var near: bool = not inW and absf(PL.p.y - F2) < 0.6 and Vector2(clampf(PL.p.x, POOL.x0, POOL.x1) - PL.p.x, clampf(PL.p.z, POOL.z0, POOL.z1) - PL.p.z).length() < 1.5 and inPool(PL.p.x, PL.p.z, -1.6)
	var tx: float; var tz: float; var sp: float
	if inW:
		tx = PL.p.x; tz = PL.p.z; sp = 4.6
		if S.mode != "hunt":
			S.mode = "hunt"; sfx("sharkgo")
	elif near:
		S.ang += dt * 1.6; tx = clampf(PL.p.x, POOL.x0 + 1, POOL.x1 - 1) + cos(S.ang * 2.3) * 1.2; tz = clampf(PL.p.z, POOL.z0 + 1, POOL.z1 - 1) + sin(S.ang * 1.7) * 1.2; sp = 3.2; S.mode = "near"
	else:
		S.ang += dt * 0.55; tx = -6 + cos(S.ang) * 2.6; tz = 27 + sin(S.ang) * 3.3; sp = 2.3; S.mode = "circle"
	var dx: float = tx - S.p.x; var dz: float = tz - S.p.z; var d := Vector2(dx, dz).length()
	if d > 0.05:
		var ty := atan2(dx, dz); S.yaw = damp_ang(S.yaw, ty, 6.0 if S.mode == "hunt" else 2.5, dt); var st := minf(d, sp * dt); S.p.x += sin(S.yaw) * st; S.p.z += cos(S.yaw) * st
	S.p.x = clampf(S.p.x, POOL.x0 + 0.7, POOL.x1 - 0.7); S.p.z = clampf(S.p.z, POOL.z0 + 0.9, POOL.z1 - 0.9); S.g.position = Vector3(S.p.x, WS - 0.3 + sin(GT * 3) * 0.03, S.p.z); S.g.rotation.y = S.yaw
	if RND() < dt * 6: part("n", S.p.x - sin(S.yaw) * 1.1, WS + 0.02, S.p.z - cos(S.yaw) * 1.1, rr(-0.3, 0.3), 0.4, rr(-0.3, 0.3), 0.6, 0.12, "#dff4ff", 0.7, 0, 1)
	if inW and Vector2(PL.p.x - S.p.x, PL.p.z - S.p.z).length() < 1.1 and S.cool <= 0 and STATE == "play":
		S.cool = 3.0; sharkCatch()
func sharkCatch() -> void:
	sfx("trap"); sfx("splash"); PL.frozen = true; ui_cls("trapFx", "on", true); toast("サメトロンにつかまった！", 2.5); await wait(0.8); await fadeOut(0.4); ui_cls("trapFx", "on", false)
	# おとなりさんの家から追い出される
	teleportPlayer(0, 0.07, 9.2, PI); PL.frozen = false; await wait(0.3); await fadeIn(0.5)
# 凍らせる
func setFrozen(f: bool) -> void:
	A.water.frozen = f; A.water.m.mesh.surface_set_material(0, MATS.ice2 if f else MATS.wtr); A.water.ice.on = f
	if f and playerInWater(): PL.p.y = 3.5
	if f: toast("水が凍った！ サメトロンが動けなくなった", 3)
	else: toast("氷がとけていく……")
# ================= エレベーター =================
var ELEV := {y = F1, floor = 1, tgt = 1, state = "idle", t = 0.0, g = null, col = null, doors = [], openT = 0.0, busy = false, calls = [], panelIt = null}
func buildElevator() -> void:
	var g := Node3D.new(); var mb := MB.new(); mb.box(2.1, 0, 19.1, 4.1, 0.1, 21.3, MATS.metal_dark); mb.box(4.05, 0.1, 19.1, 4.1, 2.4, 21.3, MATS.wood_d); mb.box(2.1, 0.1, 19.1, 4.1, 2.4, 19.15, MATS.wood_d); mb.box(2.1, 0.1, 21.25, 4.1, 2.4, 21.3, MATS.wood_d); mb.box(2.1, 2.4, 19.1, 4.1, 2.45, 21.3, MATS.wood_d)
	mb.box(4.02, 1.1, 20.9, 4.05, 1.5, 21.15, MATS.brass); var lg := mb.build(); g.add_child(lg)
	var lamp := mesh(G.box(0.5, 0.03, 0.5), MATS.bulb); lamp.position = Vector3(3.1, 2.39, 20.2); g.add_child(lamp)
	# ボタン
	var panel := mesh(G.plane(0.2, 0.3), std_mat({map = tex("c91"), emissive = "#403010", ei = 1.0})); panel.position = Vector3(4.015, 1.3, 21.02); panel.rotation.y = -PI / 2; g.add_child(panel)
	g.position.y = F1 - 0.1; scene.add_child(g); ELEV.g = g; ELEV.col = dyn_box(2.1, F1 - 0.1, 19.1, 4.1, F1, 21.3, "metal", null)
	# 各階の戸（引き戸）
	for fy in [[1, F1], [2, F2]]:
		var fl: int = fy[0]; var y: float = fy[1]
		var d := mesh(G.box(0.06, 2.25, 1.2), MATS.metal, true); d.position = Vector3(2.02, y + 1.125, 20.2); scene.add_child(d)
		var col := dyn_box(1.98, y, 19.6, 2.06, y + 2.25, 20.8, "metal", null); ELEV.doors.append({fl = fl, y = y, d = d, col = col, open = 0.0})
		# 呼びボタン
		box(1.9, y + 1.1, 20.95, 1.93, y + 1.4, 21.15, "brass", {solid = false})
		addIt({box = Box.new(1.7, y + 1, 20.85, 1.95, y + 1.5, 21.25), label = func(_it): return {t = "エレベーターを呼ぶ", k = "E", n = "%d階" % fl}, act = func():
			callElev(fl); sfx("click")})
		signp(1.93, y + 2.45, 20.2, 0.3, 0.18, "yellow", -PI / 2)
	ELEV.panelIt = addIt({box = Box.new(3.8, 0, 20.8, 4.1, 0, 21.25), label = func(_it): return {t = ("2" if ELEV.floor == 1 else "1") + "階へ", k = "E", n = "エレベーターのボタン"} if ELEV.state == "idle" else null,
		act = func():
			if ELEV.state == "idle":
				callElev(2 if ELEV.floor == 1 else 1); sfx("click")})
func callElev(fl: int) -> void:
	if ELEV.tgt == fl and ELEV.state != "idle": return
	if ELEV.floor == fl and ELEV.state == "idle":
		ELEV.openT = 4.0; return
	ELEV.tgt = fl; ELEV.state = "closing"; ELEV.t = 0.0
func updElevator(dt: float) -> void:
	var E := ELEV
	if not E.g: return
	if E.state == "closing":
		E.t += dt
		if E.t > 0.7:
			E.state = "moving"; sfx("elev")
	elif E.state == "moving":
		var ty := F1 if E.tgt == 1 else F2; var d: float = ty - E.y; var st := 1.1 * dt
		E.y = ty if absf(d) <= st else E.y + sgn(d) * st
		if E.y == ty:
			E.floor = E.tgt; E.state = "idle"; E.openT = 5.0; sfx("ding")
	elif E.state == "idle": E.openT -= dt
	E.g.position.y = E.y - 0.1; set_box(E.col, 2.1, E.y - 0.1, 19.1, 4.1, E.y, 21.3); E.panelIt.box.y0 = E.y + 1; E.panelIt.box.y1 = E.y + 1.6
	for D in E.doors:
		var want := 1.0 if E.state == "idle" and E.floor == D.fl else 0.0
		D.open = damp(D.open, want, 6, dt); D.d.position.z = 20.2 - D.open * 1.15; D.col.on = D.open < 0.6
# ================= 汽車（家のまわりを回る）=================
var TRAIN := {cars = [], s = 0.0, path = [], len = 0.0, seg = [], chuff = 0.0}
func buildTrain() -> void: # 線路（角の丸い四角）
	var x0 := -19.5; var x1 := 19.5; var z0 := 8.2; var z1 := 38.0; var r := 3.0; var P := []
	var arc := func(cx: float, cz: float, a0: float) -> void:
		for i in 7:
			var a := a0 + i / 6.0 * PI / 2; P.append(Vector3(cx + cos(a) * r, 0, cz + sin(a) * r))
	arc.call(x1 - r, z0 + r, -PI / 2); arc.call(x1 - r, z1 - r, 0); arc.call(x0 + r, z1 - r, PI / 2); arc.call(x0 + r, z0 + r, PI); P.append(P[0])
	TRAIN.path = P; var L := 0.0; TRAIN.seg = []
	for i in P.size() - 1:
		var l: float = P[i].distance_to(P[i + 1]); TRAIN.seg.append({a = P[i], b = P[i + 1], l = l, s = L}); L += l
	TRAIN.len = L
	for s in TRAIN.seg:
		var dx: float = s.b.x - s.a.x; var dz: float = s.b.z - s.a.z; var yaw := atan2(dx, dz); var n := maxi(1, roundi(s.l / 0.6))
		for i in n:
			var t := (i + 0.5) / n; rbox(s.a.x + dx * t, 0.04, s.a.z + dz * t, 1.2, 0.06, 0.16, 0, yaw, 0, "beam")
		var px := cos(yaw); var pz := -sin(yaw)
		for o in [-0.35, 0.35]: rbox((s.a.x + s.b.x) / 2 + px * o, 0.1, (s.a.z + s.b.z) / 2 + pz * o, 0.05, 0.06, s.l + 0.05, 0, yaw, 0, "metal_dark")
	var mk := func(kind: String) -> Dictionary:
		var g := Node3D.new(); var mb := MB.new()
		if kind == "loco":
			mb.box(-0.45, 0.25, -0.8, 0.45, 0.75, 0.8, MATS.red); mb.cyl(0, 0.9, 0.25, 0.35, 1.1, MATS.black, 12, {axis = "z"}); mb.box(-0.45, 0.75, -0.8, 0.45, 1.45, -0.2, MATS.red); mb.box(-0.5, 1.45, -0.85, 0.5, 1.52, -0.15, MATS.black); mb.cyl(0, 1.35, 0.55, 0.1, 0.35, MATS.black, 8); mb.box(-0.3, 0.9, -0.21, 0.3, 1.2, -0.19, MATS.glassd); mb.box(-0.5, 0.2, 0.8, 0.5, 0.35, 0.9, MATS.black)
		else:
			mb.box(-0.45, 0.25, -0.7, 0.45, 0.85, 0.7, MATS[kind]); mb.box(-0.47, 0.85, -0.72, 0.47, 0.9, 0.72, MATS.wood_d)
		for z in [-0.45, 0.45]:
			for x in [-0.47, 0.47]: mb.cyl(x, 0.2, z, 0.18, 0.08, MATS.black, 10, null, "x")
		g.add_child(mb.build()); set_cast(g, true); scene.add_child(g)
		return {g = g, col = dyn_box(0, 0, 0, 0, 0, 0, "metal", null)}
	TRAIN.cars = [mk.call("loco"), mk.call("yellow"), mk.call("blue")]
func trainAt(s: float) -> Vector2:
	s = fposmod(s, TRAIN.len)
	for g in TRAIN.seg:
		if s <= g.s + g.l:
			var t: float = (s - g.s) / g.l
			return Vector2(g.a.x + (g.b.x - g.a.x) * t, g.a.z + (g.b.z - g.a.z) * t)
	return Vector2()
func updTrain(dt: float) -> void:
	if not TRAIN.cars.size(): return
	TRAIN.s += dt * 2.3
	for i in TRAIN.cars.size():
		var c = TRAIN.cars[i]; var s: float = TRAIN.s - i * 1.9; var a := trainAt(s + 0.6); var b := trainAt(s - 0.6); var x := (a.x + b.x) / 2; var z := (a.y + b.y) / 2
		c.g.position = Vector3(x, 0, z); c.g.rotation.y = atan2(a.x - b.x, a.y - b.y); set_box(c.col, x - 0.6, 0, z - 0.6, x + 0.6, 1.5, z + 0.6)
	var L: Vector3 = TRAIN.cars[0].g.position; TRAIN.chuff += dt
	if TRAIN.chuff > 0.45:
		TRAIN.chuff = 0.0; sfxTrain(L)
	if RND() < dt * 0.03: sfxWhistle(L)
# ================= 教室：数字パズルと紙くず =================
func putSlot(S: Dictionary, it: Dictionary) -> void:
	PL.inv[PL.sel] = null; drawInv(); S.v = it; it.st = "att"; it.noPick = true; it.grp.visible = true; it.p = Vector3(9.74, S.y - 0.11, S.z); it.grp.position = Vector3(9.74, S.y, S.z); it.grp.rotation_order = EULER_ORDER_XYZ; it.grp.rotation = Vector3(0, 0, PI / 2)
	for c in it.grp.get_children(): c.position = Vector3()
	sfx("pick"); checkBoard()
func takeSlot(S: Dictionary) -> void:
	var it = S.v; S.v = null; it.noPick = false; it.st = "rest"; detachProp(it); pickUp(it)
func teacherPlaced() -> bool:
	var m = P.get("teacher")
	return m != null and m.st == "rest" and Vector2(m.p.x - A.teachSpot.x, m.p.z - A.teachSpot.z).length() < 2.6 and absf(m.p.y - F2) < 0.4
func slotsAll(fn: Callable) -> bool:
	for S in A.slots:
		if not fn.call(S): return false
	return true
func checkBoard() -> void:
	if A.get("rifleGiven"): return
	var ok := slotsAll(func(S): return S.v != null and S.v.d.digit == S.ans)
	if ok and teacherPlaced():
		A.rifleGiven = true; sfx("ding"); toast("正解！ ……先生の机に何か出てきた"); var r = P.rifle; setPropHidden(r, false); r.noPick = false; propRestAt(r, 8.55, F2 + 0.78, 16.5, PI / 2)
		if story.get("onBoard2"): story.onBoard2.call()
	elif slotsAll(func(S): return S.v != null):
		if not ok:
			sfx("deny"); toast("ちがうみたいだ……")
		else: toast("先生がいないと、答え合わせしてくれないみたいだ")
var paperT := 2.0
func updClassroom(dt: float) -> void:
	if not inClass(PL.p): return
	if not A.get("rifleGiven") and teacherPlaced():
		if slotsAll(func(S): return S.v != null): checkBoard()
	if teacherPlaced(): return
	paperT -= dt
	if paperT <= 0: # 紙くずが飛んでくる
		paperT = rr(1.2, 2.4)
		var sx := rr(3.2, 6.4); var sz := rr(14.8, 18); var sy := F2 + 1; var pr := spawnPaper(sx, sy, sz)
		var dx: float = PL.p.x - sx; var dy: float = PL.p.y + 1.3 - sy; var dz: float = PL.p.z - sz; var d := Vector2(dx, dz).length(); var T := d / 8
		propDropAt(pr, sx, sy, sz, 0, Vector3(dx / T, dy / T + 9 * T, dz / T)); pr.thrown = true; sfx("throw", 0.2)
func inClass(p: Vector3) -> bool: return p.x > 2 and p.x < 10 and p.z > 14 and p.z < 19 and p.y > 3.2 and p.y < 6.3
var PAPERS := []
func spawnPaper(x: float, y: float, z: float) -> Dictionary:
	var pr = null
	for p in PAPERS:
		if p.st == "rest" and p.get("pooled"):
			pr = p; break
	if pr == null:
		if PAPERS.size() >= 10: pr = PAPERS.pop_front()
		else:
			pr = spawnProp("paper", x, y, z, 0); pr.pooled = true
		PAPERS.append(pr)
	return pr
# ================= 射的場 =================
func nearStand() -> bool:
	return A.get("stand") != null and A.stand.has and absf(PL.p.y - F2) < 0.5 and PL.p.x > 2 and PL.p.x < 3.3 and absf(PL.p.z - 24.2) < 1.6
func updRange(dt: float) -> void:
	if not A.get("stand"): return
	for T in A.targets:
		if not A.stand.on: T.up = damp(T.up, 0, 5, dt)
		else:
			T.t -= dt
			if T.t <= 0:
				if T.get("state") == "up":
					T.state = "down"; T.t = rr(1, 3)
				else:
					T.state = "up"; T.hit = false; T.t = rr(1.4, 2.4); sfx("clack")
			T.up = damp(T.up, 1.0 if T.get("state") == "up" and not T.hit else 0.0, 10, dt)
		T.g.rotation.z = (1 - T.up) * PI / 2 * 0.98
func shootRange() -> void:
	if not A.stand.on:
		toast("電気が来ていない。分電盤を見てみよう"); return
	sfx("pop"); PL.swing = 0.3; var ro := camPos(); var rd := lookDir()
	if rd.x <= 0: return
	var t := (5.4 - ro.x) / rd.x; var y := ro.y + rd.y * t; var z := ro.z + rd.z * t
	for T in A.targets:
		if T.up > 0.8 and not T.hit and absf(z - T.z) < 0.24 and y > F2 + 0.2 and y < F2 + 1.18:
			T.hit = true; T.t = 0.6; A.stand.score += 100; drawScore(A.stand.score); sfx("ding"); part("n", 5.4, y, z, rr(-1, 0), 1, rr(-0.5, 0.5), 0.5, 0.05, "#e8c070", 1, 6)
			if A.stand.score >= 300 and not A.get("keyDropped"):
				A.keyDropped = true
				after(0.7, func():
					var k = P.skey; setPropHidden(k, false); k.noPick = false; propDropAt(k, 2.35, C2 - 1.3, 21.75, 0, Vector3(0, -1, 0.2)); sfx("clink"); toast("パイプから銀の鍵が落ちてきた！"))
			return
# ================= れんがの壁 =================
func buildBricks() -> void:
	var g := Node3D.new()
	for r in 7:
		for c in 5:
			var p := Vector3(6, F2 + 0.15 + r * 0.3, 28.95 + c * 0.28 + (0.14 if r % 2 else 0.0))
			if p.z > 30.15: continue
			var m := mesh(G.box(0.14, 0.28, 0.28), MATS.brick, true); m.position = p; g.add_child(m)
	scene.add_child(g)
	var B := {g = g, broken = false, t = 0.0, drilling = false, col = null, it = null}
	B.col = dyn_box(5.93, F2, 28.8, 6.07, F2 + 2.1, 30.2, "stone", B)
	B.it = addIt({box = Box.new(5.8, F2, 28.8, 6.2, F2 + 2.1, 30.2), label = func(_it): return null if B.broken else {t = "れんががむき出しの壁", k = "", n = "壁"},
		act = func():
			if not B.broken: toast("何か強い道具があれば、こわせそうだ"),
		use = func(it):
			if not B.broken and it.type == "jackhammer":
				drillBricks(B); return true
			return false,
		useLabel = func(it): return "削岩機でこわす" if not B.broken and it.type == "jackhammer" else null})
	A.bricks = B
func drillBricks(B: Dictionary) -> void:
	if B.drilling: return
	B.drilling = true; PL.frozen = true; sfx("drill")
	for i in 14:
		noise(6, F2, 29.5, 22, "drill"); puff(5.9, F2 + rr(0.2, 1.8), rr(28.9, 30.1), "#b86a4a", 2, 0.2, 0.6, 0.4); PL.swing = 0.2; await wait(0.12)
	B.broken = true; B.g.visible = false; B.col.on = false
	for i in 30: part("n", 6, F2 + rr(0, 2), rr(28.8, 30.2), rr(-2, 2), rr(0, 2), rr(-1, 1), 1.2, 0.07, "#a8583a", 1, 9)
	PL.frozen = false; toast("壁に穴があいた！")
	if story.get("onBricks"): story.onBricks.call()
# ================= 地下室のドア：板2枚と銅の錠 =================
func buildBaseLock() -> void:
	A.boards = [mkDoorBoard(-7.6, 1.0, 21.88, 0.35), mkDoorBoard(-7.6, 1.8, 21.88, -0.3)]
	for b in A.boards: b.setOn.call(true)
	var g := Node3D.new(); var mb := MB.new(); mb.box(-0.07, -0.09, -0.03, 0.07, 0.07, 0.03, MATS.copper); mb.cyl(0, 0.09, 0, 0.05, 0.02, MATS.copper, 10, null, "z"); g.add_child(mb.build()); g.position = Vector3(-7.2, 1.35, 21.85); scene.add_child(g)
	var L := {g = g, locked = true, it = null}
	L.it = addIt({box = Box.new(-7.35, 1.2, 21.75, -7.05, 1.5, 21.95), label = func(_it): return {t = "銅の錠がかかっている", k = "", n = "地下室のドア"} if L.locked else null,
		act = func():
			if L.locked:
				toast("銅の錠がかかっている"); sfx("locked"),
		use = func(it):
			if L.locked and (it.type == "copperkey" or it.type == "lockpick"):
				unlockCopper(it); return true
			return false,
		useLabel = func(it): return "銅の鍵で開ける" if L.locked and it.type == "copperkey" else "ピッキングで開ける" if L.locked and it.type == "lockpick" else null})
	A.clock = L
	A.base.blockers = [func():
		for b in A.boards:
			if b.on: return "板が打ちつけてあって開かない"
		return null, func(): return "銅の錠がかかっている" if A.clock.locked else null]
func unlockCopper(it: Dictionary) -> void:
	if it.type == "lockpick":
		PL.frozen = true; toast("カチャ……カチャ……", 1.5)
		for i in 5:
			sfx("click"); await wait(0.3)
		PL.frozen = false
	A.clock.locked = false; A.clock.g.visible = false; sfx("unlock"); toast("銅の錠が開いた！")
	if it.type == "copperkey": consumeHeld()
	if story.get("onCopper"): story.onCopper.call()
# ================= 棺のふた・マネキン =================
func updCoffin(dt: float) -> void:
	var C = A.get("coffin")
	if not C or not C.open or C.lidT >= 1: return
	C.lidT = minf(1, C.lidT + dt * 1.2); C.lid.position = Vector3(C.x - 0.95 * C.lidT, C.y + 0.53 + sin(C.lidT * PI) * 0.4, C.z); C.lid.rotation.z = C.lidT * 1.1
# ================= ベッドの下に隠れる =================
func mkBedHide(x: float, y: float, z: float, yaw: float, bx, out, name := "", onEnter = null) -> Dictionary:
	var h := {pos = Vector3(x, y + 0.28, z), yaw = yaw, box = bx, out = out, name = name if name else "ベッドの下", under = true, cab = null, nb = null, it = null}
	h.it = addIt({box = bx, label = func(_it): return {t = "ベッドの下に隠れる", k = "E", n = name if name else "ベッド"}, act = func():
		enterHide(h)
		if onEnter: onEnter.call()})
	HIDES.append(h)
	return h
# ================= 目覚まし時計 =================
var ALARMS := []
func armAlarm(pr: Dictionary) -> void:
	if pr.data.get("armed"): return
	pr.data.armed = true; pr.data.t = 5.0; ALARMS.append(pr); sfx("click"); toast("目覚ましをセットした（5秒後に鳴る）")
func updAlarms(dt: float) -> void:
	for i in range(ALARMS.size() - 1, -1, -1):
		var pr = ALARMS[i]; pr.data.t -= dt; var pos: Vector3 = PL.p if pr.st == "inv" else pr.p
		if pr.data.t > 0:
			if floori(pr.data.t * 2) != floori((pr.data.t + dt) * 2): sfxTick(pos)
		elif pr.data.t > -6:
			if floori(pr.data.t * 8) != floori((pr.data.t + dt) * 8): sfxRing(pos)
			if floori(pr.data.t) != floori(pr.data.t + dt): noise(pos.x, pos.y, pos.z, 26, "alarm")
		else:
			pr.data.armed = false; ALARMS.remove_at(i)
# ================= バナナ（すべる）=================
var slipT := 0.0
func updBananas(dt: float) -> void:
	slipT -= dt
	if slipT > 0:
		PL.slip = slipT; return
	PL.slip = 0.0
	if not PL.onGround or Vector2(PL.v.x, PL.v.z).length() < 1.5: return
	for pr in PROPS:
		if pr.type != "banana" or pr.st != "rest": continue
		if Vector2(pr.p.x - PL.p.x, pr.p.z - PL.p.z).length() < 0.3 and absf(pr.p.y - PL.p.y) < 0.3:
			slipT = 0.9; sfx("slip"); noise(PL.p.x, PL.p.y, PL.p.z, 8, "slip"); PL.v *= 1.6; toast("つるっ！", 1); propDropAt(pr, pr.p.x, pr.p.y + 0.1, pr.p.z, 0, Vector3(PL.v.x * 0.5, 1.5, PL.v.z * 0.5)); break
# ================= 監視カメラ（電気が必要）=================
func buildCamerasA1() -> void:
	for c in [[1.8, 3, 14.35, 0, 0.3, 19, "hall"], [-9.8, 2.95, 14.3, -7.6, 0.3, 21, "liv"], [1.8, 6.1, 31.7, 0, 3.5, 20, "hall2"], [-2.3, 6.1, 22.3, -7, 3, 29, "flood"], [9.8, 6.1, 18.8, 4, 3.5, 15.5, "class"], [-2.3, C1 - 0.2, 31.7, -2, 0.3, 23, "hallb"]]:
		addCamera(c.slice(0, 6), c[6])
	buildCamPanel()
# ================= 監視室：カメラのスイッチと、カメラの映像が映るモニター =================
var CAMV := {live = [], i = 0, t = 0.0, noSig = null}
const CAM_NAMES := ["1階のろうか", "居間", "2階のろうか", "水びたしの部屋", "教室", "1階のおく"]
const MON_LAYER := 1 << 10   # モニターだけの描画レイヤー（カメラの映像には写さない）
func camsWorking() -> bool: return A.get("power") != null and A.power.on and not A.get("camsOff")
func buildCamPanel() -> void:
	var CP := {}; A.camPanel = CP; var x := -7.075 # 東の壁（2階の居間側）に取りつける
	box(x - 0.13, F2 + 0.92, 14.75, x, F2 + 2.08, 16.55, "metal_dark", {solid = false}); box(x - 0.15, F2 + 2.02, 14.72, x - 0.1, F2 + 2.1, 16.58, "dgrey", {solid = false})
	# 文字の板
	signp(x - 0.135, F2 + 1.53, 15.35, 0.62, 0.93, std_mat({map = tex("c92"), rough = 0.7}), -PI / 2, {noShadow = true})
	# ランプ（カメラごと）
	CP.mG = std_mat({color = "#30ff60", emissive = "#20ff40", ei = 2.4}); CP.mOff = std_mat({color = "#1a1d20"}); CP.mR = std_mat({color = "#ff3020", emissive = "#ff2010", ei = 2.4})
	CP.leds = []
	for i in CAM_NAMES.size():
		var m := mesh(G.sphere(0.026, 10, 8), CP.mG); m.position = Vector3(x - 0.145, F2 + 1.53 + 0.465 - (100 + i * 46 - 8) / 384.0 * 0.93, 15.35 + 0.31 - 36 / 256.0 * 0.62); scene.add_child(m); CP.leds.append(m)
	# 大きなレバー
	var lv := Node3D.new(); var lm := MB.new(); lm.box(-0.3, -0.025, -0.025, 0, 0.025, 0.025, MATS.chrome); lm.sphere(-0.31, 0, 0, 0.05, MATS.red); lv.add_child(lm.build()); lv.position = Vector3(x - 0.14, F2 + 1.4, 16.15); scene.add_child(lv); CP.lever = lv
	box(x - 0.16, F2 + 1.18, 16.0, x - 0.13, F2 + 1.62, 16.3, "black", {solid = false})
	signp(x - 0.135, F2 + 1.74, 16.15, 0.3, 0.11, std_mat({map = tex("c93"), basic = true}), -PI / 2, {noShadow = true})
	CP.it = addIt({box = Box.new(x - 0.5, F2 + 1.1, 15.95, x, F2 + 1.7, 16.38), label = func(_it): return {t = "監視カメラを入れる" if A.get("camsOff") else "監視カメラを切る", k = "E", n = "（家の電気が切れている）" if A.get("power") and not A.power.on else "レバー"}, act = func(): setCamsOff(not A.get("camsOff"), "pl")})
	# 映らないときの画面
	CAMV.noSig = std_mat({map = tex("c94"), basic = true})
	# カメラの映像（画質がいちばん低いときは使わない）
	var mons := [A.mon0, A.mon1, A.mon2, A.mon3, A.monU[0], A.monU[1]]
	for m in A.monU + [A.mon0, A.mon1, A.mon2, A.mon3]: m.layers = MON_LAYER
	for i in mons.size():
		var mon = mons[i]
		if i >= CAMS.size(): continue
		var C = CAMS[i]; var L := {mon = mon, C = C, rt = null, cam = null, mat = null, fresh = false}
		if QUAL > 0:
			var vp := SubViewport.new(); vp.size = Vector2i(176, 132); vp.render_target_update_mode = SubViewport.UPDATE_DISABLED; vp.msaa_3d = Viewport.MSAA_DISABLED
			var cam := Camera3D.new(); cam.fov = 74; cam.near = 0.08; cam.far = 30; cam.cull_mask = 0xFFFFF & ~MON_LAYER
			vp.add_child(cam); add_child(vp)
			cam.position = Vector3(C.x + C.dx * 0.22, C.y + C.dy * 0.22, C.z + C.dz * 0.22); cam.look_at(Vector3(C.x + C.dx * 4, C.y + C.dy * 4, C.z + C.dz * 4))
			var mt := StandardMaterial3D.new(); mt.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED; mt.albedo_texture = vp.get_texture(); mt.albedo_color = Color("#dcefff")
			L.rt = vp; L.cam = cam; L.mat = mt
		CAMV.live.append(L)
	A.camsOff = false; A.camsCheckAt = 0.0; updCamLeds()
func updCamLeds() -> void:
	var on := camsWorking()
	for C in CAMS:
		if C.get("led"): C.led.visible = on and not C.broken
	var CP = A.get("camPanel")
	if not CP: return
	for i in CP.leds.size():
		var C = CAMS[i] if i < CAMS.size() else null
		CP.leds[i].mesh.surface_set_material(0, CP.mOff if not C else CP.mR if C.broken else CP.mG if on else CP.mOff)
	CP.lever.rotation.z = 0.65 if A.camsOff else -0.65
	for L in CAMV.live:
		L.mon.mesh.surface_set_material(0, CAMV.noSig if not on else MATS.monitor if L.C.broken or not L.mat else L.mat); L.fresh = false
	if A.monU.size() > 2: A.monU[2].mesh.surface_set_material(0, MATS.monitor if on else CAMV.noSig)
func setCamsOff(off: bool, who: String) -> void:
	if not A.get("camPanel"): return
	A.camsOff = off
	if who == "pl":
		sfx("click"); sfx("genoff" if off else "genon"); noise(-7.4, F2, 16, 6, "switch")
		if off:
			A.camsCheckAt = GT + rr(40, 70); toast("監視カメラを切った。……そのうち、おとなりさんが入れ直しに来るかも", 3.5)
		else:
			A.camsCheckAt = 0.0; toast("監視カメラを入れた", 2)
	elif who == "nb":
		sfx("genon"); A.camsCheckAt = 0.0
	updCamLeds()
	if story.get("onCams"): story.onCams.call(off)
# 監視室にいるときだけ、カメラの映像を順番に描く
func updCamFeeds(dt: float) -> void:
	if not CAMV.live.size() or NORENDER: return
	var r := roomAt(PL.p.x, PL.p.y + 0.1, PL.p.z)
	if r != "security" and r != "ante": return
	if not camsWorking(): return
	CAMV.t -= dt
	if CAMV.t > 0: return
	CAMV.t = 1.0 / 30
	for k in CAMV.live.size():
		var L = CAMV.live[CAMV.i % CAMV.live.size()]; CAMV.i += 1
		if not L.rt or L.C.broken: continue
		L.rt.render_target_update_mode = SubViewport.UPDATE_ONCE
		if not L.fresh:
			L.fresh = true; L.mon.mesh.surface_set_material(0, L.mat)
		break
# ================= 毎フレームの仕掛け =================
func a1Update(dt: float) -> void:
	updShark(dt); updCamFeeds(dt)
	# はじめて監視室に入ったとき
	if story.part == "main" and not story.flags.get("secSeen") and roomAt(PL.p.x, PL.p.y + 0.1, PL.p.z) == "security":
		story.flags.secSeen = 1; toast("監視室：右の壁のレバーで、家じゅうの監視カメラを切れる", 4.5)
	updElevator(dt); updTrain(dt); updRange(dt); updClassroom(dt); updCoffin(dt); updAlarms(dt); updBananas(dt)
	# 温度計の針と、凍る・とける
	if A.get("furn"):
		var F: Dictionary = A.furn; var tgtN := -1.9 if F.cold else 1.2
		F.needle.rotation.z = damp(F.needle.rotation.z, -tgtN, 0.8, dt); F.valve.rotation.z += ((1.0 if F.cold else 0.0) * 3 - F.valve.rotation.z) * minf(1, dt * 2); F.t += dt
		if F.cold and not A.water.frozen and F.t > 3: setFrozen(true)
		if not F.cold and A.water.frozen and F.t > 6: setFrozen(false)
	# 地下室のドアの明かり
	if A.get("exitLight"): li(A.exitLight, 0.8 if QUAL else 0.0)
	# 監視室のモニター（ちらつき）
	if A.get("mon0") and RND() < dt * 3: MATS.monitor.uv1_offset = Vector3(RND(), RND(), 0)

# ================= おとなりさん（モデル・動き・AI）=================
var NB := {p = Vector3(), yaw = 0.0, state = "off", anim = "idle", ph = 0.0, animT = 0.0, path = [], pi = 0, task = null, taskT = 0.0, speed = 0.0, seeT = -99.0, lastSeen = Vector3(), alert = 0.0, stuck = 0.0, mode = "path",
	doorWait = 0.0, climb = null, jump = null, look = 0.0, voiceT = 0.0, stepD = 0.0, sit = null, hideTarget = null, catchT = 0.0, trapQ = [], repairQ = [], visible = true, lastNoiseT = 0.0, chaseT = 0.0, giveUp = 0.0, active = false, routineN = 0,
	blindT = 0.0, chaseMax = 16.0, sawHide = null, goalHide = null, goal = null, goalNode = null, goalOK = false, climbed = -1, inv = null, script = null, caughtDone = false, modeName = "", modeT = 0.0, pathT = 0.0, searchT = 0.0, dt = 0.016,
	goBoiler = false, noDoors = false, tq = null, tt = 0.0}
const NBH := 1.95
const NBR := 0.33
var NBM = null # モデル
func nbMats() -> Dictionary:
	var sm := func(col: String, rough: float) -> StandardMaterial3D: return std_mat({color = col, rough = rough})
	var vest := std_mat({map = tex("c90"), rough = 0.9}); vest.uv1_scale = Vector3(2, 2, 1)
	return {skin = sm.call("#eab494", 0.7), shirt = sm.call("#eec24a", 0.85), vest = vest, glove = sm.call("#18181c", 0.35), pants = sm.call("#b4502e", 0.85), shoe = sm.call("#5a3220", 0.5), hair = sm.call("#6a4028", 0.9),
		must = sm.call("#3a2618", 1.0), eye = sm.call("#ffffff", 0.3), pupil = sm.call("#1a1410", 0.2), belt = sm.call("#2a1a10", 0.5), nose = sm.call("#d89a78", 0.6)}
func nbg() -> Node3D:
	var n := Node3D.new(); n.rotation_order = EULER_ORDER_XYZ
	return n
func nbmesh(g: Geo, m: Material, x := 0.0, y := 0.0, z := 0.0, sx := 1.0, sy := 1.0, sz := 1.0) -> MeshInstance3D:
	var o := mesh(g, m, true); o.rotation_order = EULER_ORDER_XYZ; o.position = Vector3(x, y, z); o.scale = Vector3(sx, sy, sz)
	return o
func buildNeighbor() -> Dictionary:
	var Mt := nbMats()
	var S := func(r: float, s := 14) -> Geo: return G.sphere(r, s, maxi(8, int(s * 0.7)))
	var C := func(r: float, h: float, rt = null, s := 12) -> Geo: return G.cylinder(rt if rt != null else r, r, h, s)
	var B := func(w: float, h: float, d: float) -> Geo: return G.box(w, h, d)
	var CP := func(r: float, l: float) -> Geo: return G.capsule(r, l, 4, 10)
	var root := nbg(); var body := nbg(); root.add_child(body)
	var pelvis := nbg(); pelvis.position.y = 0.98; body.add_child(pelvis)
	pelvis.add_child(nbmesh(CP.call(0.2, 0.12), Mt.pants, 0, -0.02, 0, 1.05, 0.9, 0.8)); pelvis.add_child(nbmesh(C.call(0.215, 0.07, 0.215, 16), Mt.belt, 0, 0.1, 0, 1.02, 1, 0.82)); pelvis.add_child(nbmesh(B.call(0.07, 0.05, 0.02), Mt.nose, 0, 0.1, 0.18))
	var leg := func(s: float) -> Dictionary:
		var hip := nbg(); hip.position = Vector3(s * 0.11, -0.02, 0); pelvis.add_child(hip); hip.add_child(nbmesh(CP.call(0.085, 0.34), Mt.pants, 0, -0.24, 0)); var knee := nbg(); knee.position.y = -0.47; hip.add_child(knee)
		knee.add_child(nbmesh(CP.call(0.075, 0.34), Mt.pants, 0, -0.23, 0)); var foot := nbmesh(CP.call(0.07, 0.16), Mt.shoe, 0, -0.47, 0.06); foot.rotation.x = PI / 2; foot.scale = Vector3(1.1, 1, 0.8); knee.add_child(foot)
		return {hip = hip, knee = knee}
	var L: Dictionary = leg.call(-1); var R: Dictionary = leg.call(1)
	var spine := nbg(); spine.position.y = 1.04; body.add_child(spine)
	spine.add_child(nbmesh(CP.call(0.24, 0.28), Mt.vest, 0, 0.28, 0, 1.05, 1, 0.78)); spine.add_child(nbmesh(C.call(0.2, 0.12, 0.14, 14), Mt.shirt, 0, 0.64, 0, 1, 1, 0.8)) # 胸・肩
	spine.add_child(nbmesh(B.call(0.1, 0.26, 0.02), Mt.shirt, 0, 0.44, 0.19)) # えり元
	for s in [-1, 1]:
		var col := nbmesh(B.call(0.08, 0.05, 0.03), Mt.shirt, s * 0.05, 0.58, 0.17); col.rotation.z = s * 0.5; spine.add_child(col)
	var neck := nbg(); neck.position.y = 0.66; spine.add_child(neck); neck.add_child(nbmesh(C.call(0.075, 0.12), Mt.skin, 0, 0.05, 0))
	var head := nbg(); head.position.y = 0.24; neck.add_child(head)
	head.add_child(nbmesh(S.call(0.17, 18), Mt.skin, 0, 0, 0, 1, 1.12, 1.02)); head.add_child(nbmesh(B.call(0.25, 0.13, 0.2), Mt.skin, 0, -0.13, 0.035)); head.add_child(nbmesh(S.call(0.12, 12), Mt.skin, 0, -0.16, 0.05, 1.05, 0.7, 0.9)) # あご
	head.add_child(nbmesh(S.call(0.055, 12), Mt.nose, 0, -0.02, 0.18, 1, 1.15, 1.35)) # 鼻
	var mu := nbmesh(CP.call(0.035, 0.16), Mt.must, 0, -0.09, 0.17, 1, 1, 1); mu.rotation.z = PI / 2; head.add_child(mu)
	for s in [-1, 1]: head.add_child(nbmesh(S.call(0.04, 10), Mt.must, s * 0.1, -0.11, 0.155, 1, 0.9, 0.8))
	var brow := nbmesh(B.call(0.25, 0.045, 0.05), Mt.must, 0, 0.07, 0.16); brow.rotation.x = -0.2; head.add_child(brow)
	for s in [-1, 1]:
		head.add_child(nbmesh(S.call(0.028, 10), Mt.eye, s * 0.062, 0.02, 0.155, 1, 0.8, 0.6)); head.add_child(nbmesh(S.call(0.015, 8), Mt.pupil, s * 0.062, 0.02, 0.172)); head.add_child(nbmesh(S.call(0.045, 10), Mt.skin, s * 0.17, -0.01, 0, 0.45, 1, 0.8))
	# 髪（まわりだけ。てっぺんははげ）
	for i in 9:
		var a := PI * 0.2 + i / 8.0 * PI * 1.6; head.add_child(nbmesh(S.call(0.07, 10), Mt.hair, sin(a) * 0.15, 0.04 - absf(cos(a)) * 0.02, -cos(a) * 0.14, 1, 1.1, 0.9))
	head.add_child(nbmesh(S.call(0.16, 14), Mt.hair, 0, 0.1, -0.03, 1, 0.45, 1.02)) # 上の髪
	var curl := nbmesh(G.torus(0.045, 0.018, 6, 12, PI * 1.5), Mt.hair, 0, 0.2, 0.04); curl.rotation = Vector3(0, PI / 2, 0.5); head.add_child(curl)
	var arm := func(s: float) -> Dictionary:
		var sh := nbg(); sh.position = Vector3(s * 0.3, 0.56, 0); spine.add_child(sh); sh.add_child(nbmesh(S.call(0.1, 10), Mt.vest, 0, 0, 0, 1.1, 1, 1)); sh.add_child(nbmesh(CP.call(0.075, 0.2), Mt.shirt, 0, -0.17, 0)); sh.add_child(nbmesh(C.call(0.082, 0.06, 0.082, 10), Mt.shirt, 0, -0.31, 0))
		var el := nbg(); el.position.y = -0.33; sh.add_child(el); el.add_child(nbmesh(CP.call(0.062, 0.2), Mt.skin, 0, -0.15, 0)); el.add_child(nbmesh(C.call(0.085, 0.12, 0.07, 10), Mt.glove, 0, -0.27, 0))
		var hand := nbmesh(S.call(0.1, 10), Mt.glove, 0, -0.4, 0.02, 0.95, 1.2, 0.75); el.add_child(hand); el.add_child(nbmesh(S.call(0.045, 8), Mt.glove, s * -0.07, -0.36, 0.06))
		for i in 3: el.add_child(nbmesh(CP.call(0.022, 0.07), Mt.glove, -0.05 + i * 0.05, -0.52, 0.03))
		return {sh = sh, el = el, hand = hand}
	var AL: Dictionary = arm.call(-1); var AR: Dictionary = arm.call(1)
	scene.add_child(root)
	NBM = {root = root, body = body, pelvis = pelvis, spine = spine, neck = neck, head = head, L = L, R = R, AL = AL, AR = AR, M = Mt}
	return NBM
# ---- 動き ----
func animNB(dt: float) -> void:
	var m = NBM
	if not m: return
	var a: String = NB.anim; NB.animT += dt; var t: float = NB.animT; var sp: float = NB.speed; var run := sp > 3.6
	# 初期の姿勢
	var pY := 0.98; var bY := 0.0; var lean := 0.0; var thL := 0.0; var thR := 0.0; var kL := 0.0; var kR := 0.0; var shL := 0.08; var shR := 0.08; var shLz := 0.12; var shRz := -0.12; var elL := -0.25; var elR := -0.25; var hY := 0.0; var hX := 0.0; var spX := 0.0; var spZ := 0.0
	if a == "walk" or a == "run":
		NB.ph += dt * sp * (1.55 if run else 2.15); var ph: float = NB.ph; var am := 0.75 if run else 0.5
		thL = sin(ph) * am; thR = -sin(ph) * am; kL = maxf(0, -cos(ph)) * am * 1.6 + 0.1; kR = maxf(0, cos(ph)) * am * 1.6 + 0.1
		shL = -sin(ph) * am * 1.1; shR = sin(ph) * am * 1.1; elL = -0.4 - (0.9 if run else 0.1); elR = -0.4 - (0.9 if run else 0.1); bY = absf(cos(ph)) * (0.07 if run else 0.035); lean = 0.28 if run else 0.05; hX = -0.18 if run else 0.0
		if NB.state == "chase":
			shL = -1.2 + sin(ph) * 0.35; shR = -1.2 - sin(ph) * 0.35; elL = -0.3; elR = -0.3
	elif a == "idle":
		var b := sin(t * 1.8); bY = b * 0.006; shLz = 0.1 + b * 0.02; shRz = -0.1 - b * 0.02; hY = sin(t * 0.4) * 0.2
	elif a == "look":
		hY = sin(t * 1.3) * 0.9; spZ = sin(t * 1.3) * 0.08; hX = -0.1
	elif a == "reach":
		shL = -1.45; shR = -1.45; elL = -0.2; elR = -0.2; lean = 0.3; hX = -0.25; thL = 0.2; thR = -0.35; kL = 0.3; kR = 0.5
	elif a == "climb":
		NB.ph += dt * 3.2; var c: float = NB.ph; shL = -2.7 + sin(c) * 0.35; shR = -2.7 - sin(c) * 0.35; elL = -0.5 - maxf(0, sin(c)) * 0.6; elR = -0.5 - maxf(0, -sin(c)) * 0.6; thL = -0.7 + sin(c) * 0.5; thR = -0.7 - sin(c) * 0.5; kL = 0.9; kR = 0.9; hX = -0.3
	elif a == "crouch":
		pY = 0.55; thL = -1.25; thR = -1.25; kL = 2.0; kR = 2.0; lean = 0.55; shL = -0.9; shR = -0.9; elL = -0.4; elR = -0.4; var c := sin(t * 6); shR = -0.9 + c * 0.25
	elif a == "sit":
		pY = 0.5; thL = -1.5; thR = -1.5; kL = 1.45; kR = 1.45; shL = -0.5; shR = -0.5; elL = -1; elR = -1; lean = -0.1; hY = sin(t * 0.3) * 0.15
	elif a == "water":
		shR = -1.1; elR = -0.2; shL = -0.3; lean = 0.08; hX = 0.2; hY = sin(t * 0.5) * 0.3
	elif a == "cook":
		shL = -0.9; shR = -0.9; elL = -0.8 + sin(t * 5) * 0.15; elR = -0.8; lean = 0.12; hX = 0.35
	elif a == "work":
		shR = -1.5 + sin(t * 9) * 0.6; elR = -0.6; shL = -0.7; lean = 0.25; hX = 0.3
	elif a == "wave":
		shR = -2.7; shRz = -0.3 + sin(t * 7) * 0.3; elR = -0.3
	elif a == "check":
		shR = -1.2; elR = -0.5; hX = 0.25; lean = 0.15
	elif a == "binoc":
		shL = -2.2; shR = -2.2; shLz = 0.55; shRz = -0.55; elL = -1.9; elR = -1.9; hX = 0.05
	elif a == "cover":
		shL = -2.3; shR = -2.3; shLz = 0.45; shRz = -0.45; elL = -2.1; elR = -2.1; hX = 0.35; lean = 0.12; spZ = sin(t * 2) * 0.04
	elif a == "grab":
		shL = -1.55; shR = -1.55; elL = -0.05; elR = -0.05; lean = 0.35; hX = -0.35; shLz = 0.35; shRz = -0.35
	if NB.sit: pY = 0.5
	# 見ている方へ頭を向ける
	hY += NB.look
	m.pelvis.position.y = pY + bY; m.spine.position.y = pY + 0.06 + bY; m.body.rotation.x = 0.0; m.spine.rotation.x = lean + spX; m.spine.rotation.z = spZ; m.pelvis.rotation.x = 0.0
	m.L.hip.rotation.x = -thL; m.R.hip.rotation.x = -thR; m.L.knee.rotation.x = kL; m.R.knee.rotation.x = kR
	m.AL.sh.rotation.x = shL; m.AR.sh.rotation.x = shR; m.AL.sh.rotation.z = shLz; m.AR.sh.rotation.z = shRz; m.AL.el.rotation.x = elL; m.AR.el.rotation.x = elR
	m.head.rotation.y = clampf(hY, -1.2, 1.2); m.head.rotation.x = hX
	m.root.position = NB.p; m.root.rotation.y = NB.yaw
	# 足音
	if (a == "walk" or a == "run") and NB.visible:
		NB.stepD += sp * dt
		if NB.stepD > (1.3 if run else 0.95):
			NB.stepD = 0.0; sfxNbStep(NB.p, run)
# ================= 道すじ（ナビ）=================
var NODES := {}
var NLIST := []
func node(id: String, x: float, y: float, z: float) -> Dictionary:
	var n := {id = id, p = Vector3(x, y, z), e = [], pool = false, i = NLIST.size()}
	NODES[id] = n; NLIST.append(n)
	return n
func link(a: String, b: String, type := "w", door = null) -> void:
	var An = NODES.get(a); var Bn = NODES.get(b)
	if not An or not Bn:
		push_warning("link %s %s" % [a, b]); return
	var c: float = An.p.distance_to(Bn.p) * (2.5 if type == "l" else 1.0)
	An.e.append({to = Bn, type = type, door = door, c = c}); Bn.e.append({to = An, type = type, door = door, c = c})
func nav_filt(b) -> bool: return b.s != "trig" and b.s != "door" and not (b.ref is Dictionary and b.ref.has("type") and b.ref.has("d"))
func nearestNode(p: Vector3, los := true, maxDy := 1.3):
	var best = null; var bd := 1e9
	for n in NLIST:
		var dy: float = absf(n.p.y - p.y)
		if dy > maxDy: continue
		var d: float = Vector2(n.p.x - p.x, n.p.z - p.z).length() + dy * 3
		if d >= bd: continue
		if los and not los_clear(Vector3(p.x, p.y + 0.9, p.z), Vector3(n.p.x, n.p.y + 0.9, n.p.z), nav_filt): continue
		bd = d; best = n
	if not best and los: return nearestNode(p, false, maxDy + 2)
	return best
func findPath(a, b):
	if not a or not b: return null
	if is_same(a, b): return [a]
	var N := NLIST.size()
	var g := {}; var f := {}; var from := {}; var closed := {}; var open := [a]; var inopen := {a.i: true}
	g[a.i] = 0.0; f[a.i] = a.p.distance_to(b.p)
	while open.size():
		var bi := 0
		for i in range(1, open.size()):
			if f[open[i].i] < f[open[bi].i]: bi = i
		var cur = open[bi]; open.remove_at(bi); inopen.erase(cur.i)
		if is_same(cur, b):
			var P := [cur]; var c = cur
			while from.has(c.i):
				c = from[c.i]; P.push_front(c)
			return P
		closed[cur.i] = true
		for e in cur.e:
			if closed.has(e.to.i): continue
			if e.type == "d" and NB.noDoors: continue
			var ng: float = g[cur.i] + e.c
			if ng < g.get(e.to.i, 1e9):
				from[e.to.i] = cur; g[e.to.i] = ng; f[e.to.i] = ng + e.to.p.distance_to(b.p)
				if not inopen.has(e.to.i):
					open.append(e.to); inopen[e.to.i] = true
	return null
func edgeBetween(a, b):
	for e in a.e:
		if is_same(e.to, b): return e
	return null
# ================= おとなりさんの道すじ（アルファ1の家）=================
func buildNavA1() -> void:
	var n := func(id: String, x: float, y: float, z: float) -> void: node(id, x, y, z)
	var L := func(a: String, b: String, type := "w", door = null) -> void: link(a, b, type, door)
	# 外
	n.call("st_w", -20, 0.02, 1.5); n.call("st_c", 0, 0.02, 1.5); n.call("st_e", 20, 0.02, 1.5); n.call("gate", 0, 0.06, 6.6); n.call("path", 0, 0.06, 10.4); n.call("porch", 0, 0.3, 12.9); n.call("yard_fw", -7, 0, 10.4); n.call("yard_fe", 7, 0, 10.4); n.call("drive", -11, 0.05, 8.6)
	n.call("west_f", -18.2, 0, 9.2); n.call("west_m", -18.2, 0, 20.5); n.call("west_b", -18.2, 0, 33); n.call("gar_side", -18.2, 0, 20.5); n.call("east_f", 14.5, 0, 12); n.call("east_m", 14.5, 0, 24); n.call("east_b", 14.5, 0, 35); n.call("back_e", 9, 0, 35); n.call("back_door", 4, 0.15, 33.4); n.call("back_c", -2, 0, 35.5); n.call("back_w", -12, 0, 35.5)
	L.call("st_w", "st_c"); L.call("st_c", "st_e"); L.call("st_c", "gate"); L.call("gate", "path"); L.call("path", "porch"); L.call("path", "yard_fw"); L.call("path", "yard_fe"); L.call("yard_fw", "drive"); L.call("drive", "st_w"); L.call("drive", "west_f"); L.call("west_f", "west_m"); L.call("west_m", "west_b")
	L.call("west_b", "back_w"); L.call("back_w", "back_c"); L.call("back_c", "back_door"); L.call("back_door", "back_e"); L.call("back_e", "east_b"); L.call("east_b", "east_m"); L.call("east_m", "east_f"); L.call("east_f", "yard_fe")
	# ガレージ
	n.call("gar_in", -16, 0.1, 20.5); n.call("gar_m", -13.5, 0.1, 18.5); n.call("gar_ld", -10.8, 0.1, 17); L.call("west_m", "gar_in", "d", func(): return A.garageSide); L.call("gar_in", "gar_m"); L.call("gar_m", "gar_ld")
	# 1階
	n.call("hall_f", 0, 0.3, 15.6); n.call("hall_m", 0, 0.3, 19.5); n.call("hall_n", 0, 0.3, 24.5); n.call("hall_b", 0, 0.3, 29); n.call("kit_d", 1.2, 0.3, 16); n.call("kit", 3, 0.3, 16); n.call("kit_m", 5.2, 0.3, 16.4); n.call("kit_e", 8.6, 0.3, 17.3)
	n.call("elev1", 1.1, 0.3, 20.2); n.call("cab1", 3.1, 0.3, 20.2); n.call("liv", -3.2, 0.3, 16.3); n.call("liv_m", -4.8, 0.3, 17.5); n.call("liv_n", -4.7, 0.3, 20.4); n.call("liv_base", -7.6, 0.3, 21.2); n.call("liv_gd", -9.1, 0.3, 17)
	n.call("stairs_b", -2.6, 0.3, 20.2); n.call("stairs_1", -2.6, 0.3, 21.4); n.call("stairs_t", -9.3, 3.5, 21.4)
	n.call("grave_d", -1.2, 0.3, 24.5); n.call("grave", -2.8, 0.3, 24.5); n.call("grave_s", -2.8, 0.3, 22.7); n.call("din_d", -1.2, 0.3, 29.5); n.call("din", -3, 0.3, 29.5); n.call("din_w", -8.8, 0.3, 27.8)
	n.call("pan_d", 1.2, 0.3, 23.5); n.call("pan", 3, 0.3, 23.5); n.call("pan_m", 4.2, 0.3, 24.2); n.call("boil_d", 1.2, 0.3, 29); n.call("boil", 3, 0.3, 29); n.call("boil_e", 5.3, 0.3, 29.2); n.call("boil_back", 4, 0.3, 31.3)
	n.call("bath1", 7, 0.3, 29); n.call("bath1_s", 8.5, 0.3, 27.2); n.call("bed1_d", 8.5, 0.3, 25.4); n.call("bed1", 7.3, 0.3, 22.4)
	L.call("porch", "hall_f", "d", func(): return A.front[0]); L.call("hall_f", "hall_m"); L.call("hall_m", "hall_n"); L.call("hall_n", "hall_b"); L.call("hall_f", "liv"); L.call("hall_f", "kit_d"); L.call("kit_d", "kit", "d", func(): return A.kitDoor); L.call("kit", "kit_m"); L.call("kit_m", "kit_e")
	L.call("hall_m", "elev1"); L.call("elev1", "cab1", "ew")
	L.call("liv", "liv_m"); L.call("liv_m", "liv_n"); L.call("liv_n", "liv_base"); L.call("liv_m", "liv_gd"); L.call("liv_gd", "gar_ld", "d", func(): return A.garageDoor); L.call("liv_m", "stairs_b"); L.call("stairs_b", "stairs_1"); L.call("stairs_1", "stairs_t")
	L.call("hall_n", "grave_d"); L.call("grave_d", "grave", "d", func(): return A.graveDoor); L.call("grave", "grave_s"); L.call("hall_b", "din_d"); L.call("din_d", "din", "d", func(): return A.dinDoor); L.call("din", "din_w")
	L.call("hall_n", "pan_d"); L.call("pan_d", "pan", "d", func(): return A.panDoor); L.call("pan", "pan_m"); L.call("hall_b", "boil_d"); L.call("boil_d", "boil", "d", func(): return A.boilDoor); L.call("boil", "boil_back"); L.call("boil_back", "back_door", "d", func(): return A.back)
	L.call("boil", "boil_e"); L.call("boil_e", "bath1", "d", func(): return A.bathDoor); L.call("bath1", "bath1_s"); L.call("bath1_s", "bed1_d", "d", func(): return A.bedDoor); L.call("bed1_d", "bed1")
	# 2階
	n.call("cab2", 3.1, 3.5, 20.2); n.call("h2_e", 1.1, 3.5, 20.2); n.call("h2_s", 0.8, 3.5, 15.5); n.call("h2_n", 0.4, 3.5, 24.5); n.call("h2_b", 0, 3.5, 30.9)
	n.call("liv2_d", -1.2, 3.5, 19.8); n.call("liv2", -3, 3.5, 19.8); n.call("liv2_m", -4.6, 3.5, 17.6); n.call("ante_d", -6.2, 3.5, 19.7); n.call("ante", -7.8, 3.5, 19.7); n.call("sec_d", -8.55, 3.5, 18.2); n.call("sec", -8.55, 3.5, 16.2); n.call("sec_panel", -7.75, 3.5, 15.75)
	n.call("class_d", 1.2, 3.5, 15.5); n.call("class", 2.7, 3.5, 15.5); n.call("class_n", 2.7, 3.5, 18.5); n.call("class_front", 7.8, 3.5, 18.5); n.call("class_d2", 9, 3.5, 18.5); n.call("corr", 9, 3.5, 20.2); n.call("corr_w", 5, 3.5, 20.2); n.call("bath2", 9, 3.5, 22.4)
	n.call("range_d", 1.2, 3.5, 23.5); n.call("range", 2.6, 3.5, 23.5)
	n.call("flood_x", -1.2, 3.5, 30.9); n.call("flood_exit", -2.7, 3.5, 30.9); n.call("pool_e", -4.6, 2.95, 30.4); n.call("pool_m", -4.8, 2.95, 25.8); n.call("pool_w", -9.2, 2.95, 24.4); n.call("flood_land", -9.3, 3.5, 22.6)
	for k in ["pool_e", "pool_m", "pool_w"]: NODES[k].pool = true
	L.call("cab1", "cab2", "e"); L.call("cab2", "h2_e", "ew"); L.call("h2_e", "h2_s"); L.call("h2_e", "h2_n"); L.call("h2_n", "h2_b"); L.call("h2_s", "class_d"); L.call("class_d", "class", "d", func(): return A.classDoor); L.call("class", "class_n"); L.call("class_n", "class_front"); L.call("class_front", "class_d2"); L.call("class_d2", "corr", "d", func(): return A.classDoor2); L.call("corr", "corr_w"); L.call("corr", "bath2", "d", func(): return A.bath2Door)
	L.call("h2_e", "liv2_d"); L.call("liv2_d", "liv2", "d", func(): return A.liv2Door); L.call("liv2", "liv2_m"); L.call("liv2", "ante_d"); L.call("ante_d", "ante", "d", func(): return A.anteDoor); L.call("ante", "sec_d"); L.call("sec_d", "sec", "d", func(): return A.secDoor); L.call("sec", "sec_panel")
	L.call("h2_n", "range_d"); L.call("range_d", "range", "d", func(): return A.rangeDoor)
	L.call("stairs_t", "flood_land"); L.call("flood_land", "pool_w"); L.call("pool_w", "pool_m"); L.call("pool_m", "pool_e"); L.call("pool_e", "flood_exit"); L.call("flood_exit", "flood_x", "d", func(): return A.floodDoor); L.call("flood_x", "h2_b")
# 切られた監視カメラを入れ直しにいく（ふだんは選ばない）
const TASK_CAMS := {node = "sec_panel", dur = 2.4, anim = "work", face = PI / 2, w = 0, camsOn = true}
var TASKS_A1 := [
	{node = "hall_m", dur = 3, anim = "look", w = 2}, {node = "liv_m", dur = 4, anim = "look", w = 2}, {node = "liv_m", dur = 12, anim = "sit", sit = {x = -6.15, z = 19.2, yaw = -PI / 2}, w = 2.5}, {node = "kit_e", dur = 7, anim = "cook", face = PI / 2, w = 2.5}, {node = "kit_m", dur = 4, anim = "idle", w = 1.5},
	{node = "din", dur = 5, anim = "look", w = 1.5}, {node = "grave", dur = 6, anim = "crouch", face = -PI / 2, w = 1.5}, {node = "pan_m", dur = 4, anim = "check", w = 1}, {node = "boil", dur = 6, anim = "check", face = PI / 2, w = 2.5, boil = true}, {node = "bed1", dur = 5, anim = "look", w = 1.5}, {node = "bath1", dur = 3, anim = "idle", w = 1},
	{node = "gar_m", dur = 7, anim = "work", face = -PI / 2, w = 1.5}, {node = "liv2_m", dur = 5, anim = "look", w = 1.5}, {node = "class_front", dur = 5, anim = "look", w = 1}, {node = "h2_n", dur = 3, anim = "look", w = 1}, {node = "range", dur = 4, anim = "look", w = 1}, {node = "sec", dur = 6, anim = "check", face = PI, w = 1.5},
	{node = "yard_fw", dur = 6, anim = "water", face = 0, w = 1.5}, {node = "yard_fe", dur = 5, anim = "look", w = 1}, {node = "back_c", dur = 5, anim = "look", w = 1}, {node = "back_e", dur = 4, anim = "idle", w = 1}, {node = "drive", dur = 4, anim = "look", w = 0.8}, {node = "flood_exit", dur = 3, anim = "look", w = 0.8}]
# ================= AI =================
# 家の中か（プレイヤー用）
func onNProperty(p) -> bool: return p.x > -20 and p.x < 20 and p.z > 6.2 and p.z < 48
func inNHouse(p: Vector3) -> bool: return (p.x > -10 and p.x < 10 and p.z > 14 and p.z < 32 and p.y > -3 and p.y < 6.5) or (p.x > -17 and p.x < -10 and p.z > 14 and p.z < 24 and p.y < 3.4)
func nodeY(n) -> float: return (3.47 if A.get("water") and A.water.frozen else 2.95) if n.pool else n.p.y
func nbSetPath(targetPos, nd = null) -> bool:
	var a = nearestNode(NB.p, true, 1.4); var b = nd if nd else nearestNode(targetPos, true, 1.6); var P = findPath(a, b)
	NB.path = P if P else []; NB.pi = 0; NB.climbed = -1; NB.goal = targetPos if targetPos != null else (b.p if b else null); NB.goalNode = b
	NB.goalOK = targetPos != null and b != null and los_clear(Vector3(b.p.x, b.p.y + 0.8, b.p.z), Vector3(targetPos.x, targetPos.y + 0.8, targetPos.z), nav_filt)
	return P != null
func nbTeleport(x: float, y: float, z: float, yaw: float) -> void:
	NB.p = Vector3(x, y, z); NB.yaw = yaw; NB.path = []; NB.climb = null; NB.jump = null; NB.sit = null; NB.speed = 0.0; NB.anim = "idle"
# 見えるか
func nbCanSee() -> bool:
	if PL.hide or not NB.visible: return false
	var ex: float = NB.p.x; var ey: float = NB.p.y + (1.4 if NB.sit else 1.82); var ez: float = NB.p.z
	var px: float = PL.p.x; var py: float = PL.p.y + PL.h * 0.8; var pz: float = PL.p.z
	var dx := px - ex; var dy := py - ey; var dz := pz - ez; var d := Vector3(dx, dy, dz).length()
	var range := 4.0 if NB.blindT > 0 else (13.0 if PL.crouch > 0.5 else 22.0)
	if d > range: return false
	var fa: float = NB.yaw + (NBM.head.rotation.y if NBM else 0.0); var fx := -sin(fa + PI); var fz := -cos(fa + PI)
	var dot := (dx * fx + dz * fz) / maxf(0.01, Vector2(dx, dz).length())
	if d > 2.2 and dot < (-0.2 if NB.state == "chase" else 0.28): return false
	var filt := func(b): return b.s != "trig" and b.s != "glass"
	if ray_cast(ex, ey, ez, dx / d, dy / d, dz / d, d - 0.3, filt) < d - 0.35: # 体のまん中も見る
		var py2: float = PL.p.y + PL.h * 0.45; var dy2 := py2 - ey; var d2 := Vector3(dx, dy2, dz).length()
		if ray_cast(ex, ey, ez, dx / d2, dy2 / d2, dz / d2, d2 - 0.3, filt) < d2 - 0.35: return false
	return true
# ---- 毎フレーム ----
var nbSeeAcc := 0.0
var nbVisionT := 0.0
func updNeighbor(dt: float) -> void:
	if not NBM: return
	if not NB.active:
		animNB(dt); return
	if NB.state == "script":
		if NB.script: NB.script.call(dt)
		animNB(dt); return
	if NB.state == "catch":
		updCatch(dt); animNB(dt); return
	NB.voiceT -= dt; NB.dt = dt; NB.blindT = maxf(0, NB.blindT - dt)
	# 見る
	nbVisionT -= dt
	if nbVisionT <= 0:
		nbVisionT = 0.1; var sees := nbCanSee(); var d: float = NB.p.distance_to(PL.p)
		if sees:
			nbSeeAcc += 0.1 * (6.0 if d < 5 else 3.0 if d < 10 else 1.4) * (0.6 if PL.crouch > 0.5 else 1.0)
			if NB.state == "chase" or nbSeeAcc >= 0.5:
				NB.lastSeen = PL.p; NB.seeT = GT
				if NB.state != "chase": startChase()
		else: nbSeeAcc = maxf(0, nbSeeAcc - 0.05)
	# 聞く
	for n in NOISES:
		if n.t <= NB.lastNoiseT: continue
		NB.lastNoiseT = maxf(NB.lastNoiseT, n.t)
		if NB.state == "chase": continue
		var d := Vector3(n.x - NB.p.x, n.y - NB.p.y, n.z - NB.p.z).length(); var r: float = n.r
		# 壁ごしは聞こえにくい
		if not los_clear(Vector3(NB.p.x, NB.p.y + 1.7, NB.p.z), Vector3(n.x, n.y + 0.3, n.z), bodyFilt): r *= 0.55
		if d < r and (n.kind != "step" or inNHouse(PL.p) or onNProperty(PL.p)): investigate(Vector3(n.x, n.y, n.z), n.kind)
	NOISES.clear()
	# 状態ごと
	if NB.state == "routine": updRoutine(dt)
	elif NB.state == "investigate": updInvestigate(dt)
	elif NB.state == "chase": updChase(dt)
	elif NB.state == "search": updSearch(dt)
	elif NB.state == "trap": updTrapTask(dt)
	# 捕まえる
	var dd := Vector2(PL.p.x - NB.p.x, PL.p.z - NB.p.z).length(); var dy: float = absf(PL.p.y - NB.p.y)
	if not PL.hide and NB.state == "chase" and dd < 1.15 and dy < 1.4 and not NB.climb and not NB.jump: startCatch()
	animNB(dt); updChaseMusic(dt)
func say(k: String) -> void:
	if NB.voiceT > 0: return
	NB.voiceT = 3.0; sfxVoice(k, NB.p)
func startChase() -> void:
	if NB.state == "chase": return
	NB.state = "chase"; setNbMode("attack"); NB.chaseT = 0.0; NB.chaseMax = 14 + RND() * 6; NB.sit = null; NB.path = []; NB.mode = "direct"; say("hey"); NB.giveUp = 0.0
	if story.get("onSpotted"): story.onSpotted.call()
func setNbMode(m: String) -> void:
	if NB.modeName == m: return
	NB.modeName = m
	if m == "attack": MUS.chaseTrack = 1 + int(RND() * 3)
func investigate(pos: Vector3, kind: String) -> void:
	if NB.state == "chase" or NB.state == "catch" or NB.state == "script": return
	if not inHouseArea(pos): return
	NB.state = "investigate"; setNbMode("hunt"); NB.inv = {pos = pos, kind = kind, t = 0.0, phase = "go", lt = 0.0}; NB.sit = null
	if not nbSetPath(pos): NB.path = []
	NB.speed = 0.0
	if kind == "glass" or kind == "alarm" or kind == "trap" or kind == "yell": say("hey")
	else: say("hmm")
func inHouseArea(p: Vector3) -> bool: return p.x > -22 and p.x < 22 and p.z > -1 and p.z < 42
# 道にそって進む（もどり値：着いたら true）
func followPath(dt: float, spd: float) -> bool:
	if NB.jump:
		var J = NB.jump; J.t += dt / 0.55; var t := minf(1, J.t); NB.p = J.a.lerp(J.b, t); NB.p.y += sin(t * PI) * 0.7
		if t >= 1:
			NB.jump = null; NB.pi += 1
		NB.anim = "walk"; NB.speed = 3.0; return false
	if NB.climb:
		var C = NB.climb; var dir := sgn(C.b.y - C.a.y); NB.p.y += dir * 2.1 * dt; NB.p.x = damp(NB.p.x, C.lx, 8, dt); NB.p.z = damp(NB.p.z, C.lz, 8, dt); NB.yaw = damp_ang(NB.yaw, C.yaw, 10, dt); NB.anim = "climb"; NB.speed = 0.0
		if RND() < dt * 3: sfx("ladderN")
		if (dir > 0 and NB.p.y >= C.b.y) or (dir < 0 and NB.p.y <= C.b.y):
			NB.p.y = C.b.y; NB.climb = null; NB.climbed = NB.pi
		return false
	if NB.doorWait > 0:
		NB.doorWait -= dt; NB.anim = "reach"; NB.speed = 0.0; return false
	var P: Array = NB.path
	if not P.size() or NB.pi >= P.size(): # 最後はまっすぐ目的の場所へ
		var Gl = NB.goal
		if Gl != null and NB.goalOK:
			var dx: float = Gl.x - NB.p.x; var dz: float = Gl.z - NB.p.z; var d := Vector2(dx, dz).length()
			if d > 0.4 and d < 9 and absf(Gl.y - NB.p.y) < 1:
				var st := minf(d, spd * dt); NB.p.x += dx / d * st; NB.p.z += dz / d * st; NB.yaw = damp_ang(NB.yaw, atan2(dx, dz), 10, dt); NB.anim = "run" if spd > 3.6 else "walk"; NB.speed = spd; return false
		return true
	var cur = P[NB.pi]; var prev = P[NB.pi - 1] if NB.pi > 0 else null; var e = edgeBetween(prev, cur) if prev else null
	# 特別な道
	if e and e.type == "j" and not NB.jump:
		NB.jump = {a = prev.p, b = cur.p, t = 0.0}; NB.yaw = atan2(-(cur.p.x - prev.p.x), -(cur.p.z - prev.p.z)); return false
	# エレベーター
	if e and (e.type == "ew" or e.type == "e"):
		var fl := 2 if prev.p.y > 2 else 1; var tf := 2 if cur.p.y > 2 else 1
		if e.type == "ew":
			var cabFl: int = (2 if cur.p.y > 2 else 1) if cur.id.begins_with("cab") else fl
			if not (ELEV.state == "idle" and ELEV.floor == cabFl):
				if ELEV.state == "idle": callElev(cabFl)
				NB.anim = "idle"; NB.speed = 0.0; return false
			ELEV.openT = maxf(ELEV.openT, 2)
		else:
			if ELEV.state == "idle" and ELEV.floor == fl:
				callElev(tf); NB.anim = "idle"; NB.speed = 0.0; NB.p.y = ELEV.y; return false
			if ELEV.state != "idle" or ELEV.floor != tf:
				NB.p.y = ELEV.y; NB.anim = "idle"; NB.speed = 0.0; return false
			NB.p.y = cur.p.y; NB.pi += 1; return false
	# ドア
	if e and e.type == "d":
		var dr = e.door.call()
		if dr and dr.m.tgt < 0.5:
			var dd := Vector2(dr.hx - NB.p.x, dr.hz - NB.p.z).length()
			if dd < 1.9:
				toggleDoor(dr, "npc", true); NB.doorWait = 0.45; return false
	var tx: float = cur.p.x; var tz: float = cur.p.z; var dx: float = tx - NB.p.x; var dz: float = tz - NB.p.z; var d := Vector2(dx, dz).length()
	if d < 0.25:
		NB.p.y = nodeY(cur); NB.pi += 1; return NB.pi >= P.size()
	var step := minf(d, spd * dt); NB.p.x += dx / d * step; NB.p.z += dz / d * step
	# 高さ（階段など）は道にそって
	if prev:
		var tot := Vector2(cur.p.x - prev.p.x, cur.p.z - prev.p.z).length()
		if tot == 0: tot = 1.0
		var f := 1 - clampf(Vector2(tx - NB.p.x, tz - NB.p.z).length() / tot, 0, 1); NB.p.y = lerpf(nodeY(prev), nodeY(cur), f)
	NB.yaw = damp_ang(NB.yaw, atan2(-dx, -dz) + PI, 10, dt); NB.anim = "run" if spd > 3.6 else "walk"; NB.speed = spd; return false
# ---- ふだんの暮らし ----
func pickTask() -> Dictionary:
	if A.get("camsOff") and A.get("camsCheckAt") and GT > A.camsCheckAt and story.part == "main":
		A.camsCheckAt = GT + 30; return TASK_CAMS
	if NB.goBoiler:
		NB.goBoiler = false
		for t in TASKS_A1:
			if t.get("boil"): return t
	var tot := 0.0
	for t in TASKS_A1:
		if not is_same(t, NB.task): tot += t.w
	var r := RND() * tot
	for t in TASKS_A1:
		if is_same(t, NB.task): continue
		r -= t.w
		if r <= 0: return t
	return TASKS_A1[0]
func updRoutine(dt: float) -> void:
	if not NB.task:
		var t := pickTask()
		if NB.state != "routine": return
		NB.task = t; NB.taskT = 0.0; NB.sit = null
		if not nbSetPath(null, NODES[t.node]):
			NB.task = null; return
	var T = NB.task
	if NB.pi < NB.path.size():
		followPath(dt, 1.75); return
	# 着いた
	if T.get("sit") and not NB.sit:
		NB.sit = T.sit; NB.p.x = T.sit.x; NB.p.z = T.sit.z; NB.yaw = T.sit.yaw
	if T.get("face") != null: NB.yaw = damp_ang(NB.yaw, T.face, 4, dt)
	NB.anim = T.anim; NB.speed = 0.0; NB.taskT += dt
	if NB.taskT > T.dur:
		if T.get("camsOn") and A.get("camsOff"): setCamsOff(false, "nb")
		if NB.sit:
			var n = NODES[T.node]; NB.p.x = n.p.x; NB.p.z = n.p.z; NB.sit = null
		NB.task = null; NB.routineN += 1
# ---- 物音を調べる ----
func updInvestigate(dt: float) -> void:
	var I = NB.inv; I.t += dt
	if NB.hideTarget:
		checkHide(NB.hideTarget); return
	if I.phase == "go":
		var done := followPath(dt, 2.6); var d := Vector2(I.pos.x - NB.p.x, I.pos.z - NB.p.z).length()
		if done or d < 1.2 or I.t > 25:
			I.phase = "look"; I.lt = 0.0
			# 何の音だったか
			if I.kind == "alarm":
				for pr in ALARMS:
					if pr.p.distance_to(NB.p) < 3: pr.data.t = -7.0
		return
	if I.phase == "look":
		I.lt += dt; NB.anim = "look"; NB.speed = 0.0
		if I.lt > 3: # 近くのクローゼットをのぞくことがある
			var h = null
			for hh in HIDES:
				if hh.nb and Vector2(hh.out.x - NB.p.x, hh.out.z - NB.p.z).length() < 5 and absf(hh.out.y - NB.p.y) < 1.5 and (not is_same(hh, PL.hide) or is_same(NB.sawHide, hh)):
					h = hh; break
			if h and RND() < 0.35:
				checkHide(h); return
			backToRoutine()
func backToRoutine() -> void:
	if NB.state == "investigate" or NB.state == "search": NB.goBoiler = true
	NB.state = "routine"; NB.task = null; NB.path = []; NB.inv = null; NB.hideTarget = null; setNbMode("idle")
# ---- 追いかける ----
func updChase(dt: float) -> void:
	NB.chaseT += dt; var d0 := Vector2(PL.p.x - NB.p.x, PL.p.z - NB.p.z).length()
	# 見えなくなってすぐ（1.2秒）は、曲がり角の先までついてくる。そのあとは最後に見た所へ
	var since: float = GT - NB.seeT
	if not PL.hide and since < 1.2 and d0 < 20: NB.lastSeen = PL.p
	# 長く追いかけるとつかれて見失う（すぐ目の前にいるときは別）
	if NB.chaseT > NB.chaseMax and d0 > 2.2:
		say("grr"); NB.blindT = 6.0; lostPlayer(); return
	# 隠れるところを近くで見られたときだけ、そこを開けにくる
	if PL.hide and is_same(NB.sawHide, PL.hide) and not NB.hideTarget: NB.hideTarget = PL.hide
	if NB.hideTarget:
		checkHide(NB.hideTarget); return
	if since > 1.2:
		var dl := Vector2(NB.lastSeen.x - NB.p.x, NB.lastSeen.z - NB.p.z).length()
		if dl < 1.1 or since > 9:
			say("grr"); lostPlayer(); return
	var lead := 0.5 if since < 1.2 else 0.0; var tgt := Vector3(NB.lastSeen.x + PL.v.x * lead, NB.lastSeen.y, NB.lastSeen.z + PL.v.z * lead)
	var dx: float = tgt.x - NB.p.x; var dz: float = tgt.z - NB.p.z; var d := Vector2(dx, dz).length(); var dy: float = tgt.y - NB.p.y; var sp := 3.15
	var direct: bool = absf(dy) < 1.1 and d < 14 and not NB.climb and not NB.jump and los_clear(Vector3(NB.p.x, NB.p.y + 1, NB.p.z), Vector3(PL.p.x, PL.p.y + 1, PL.p.z), nav_filt) and NB.mode != "path"
	if direct:
		NB.path = []; var mx := dx / d * minf(d, sp * dt); var mz := dz / d * minf(d, sp * dt); var ox: float = NB.p.x; var oz: float = NB.p.z
		var nf := func(b): return b.s != "trig" and not (b.ref is Dictionary and b.ref.has("type") and b.ref.has("d"))
		NB.p = move_body(NB.p, NBR, NBH, NBR, 0, -0.3, 0, null, nf); var gy: float = NB.p.y; NB.p = move_body(NB.p, NBR, NBH, NBR, mx, 0, mz, null, nf)
		if HIT.x or HIT.z:
			var hb = HIT.box
			if hb != null and hb.ref is Dictionary and hb.ref.has("m") and hb.ref.has("o") and hb.ref.m.tgt < 0.5:
				toggleDoor(hb.ref, "npc", true); NB.doorWait = 0.4
			var p2 := move_body(Vector3(ox, gy, oz), NBR, NBH, NBR, 0, 0.46, 0, null, nf); p2 = move_body(p2, NBR, NBH, NBR, mx, 0, mz, null, nf); p2 = move_body(p2, NBR, NBH, NBR, 0, -0.5, 0, null, nf)
			if Vector2(p2.x - ox, p2.z - oz).length() > Vector2(NB.p.x - ox, NB.p.z - oz).length() + 0.01: NB.p = p2
		var moved := Vector2(NB.p.x - ox, NB.p.z - oz).length()
		if moved < sp * dt * 0.3: NB.stuck += dt
		else: NB.stuck = 0.0
		NB.yaw = damp_ang(NB.yaw, atan2(dx, dz), 12, dt); NB.anim = "run"; NB.speed = sp
		if NB.stuck > 0.6:
			NB.stuck = 0.0; NB.mode = "path"; NB.modeT = GT; nbSetPath(tgt)
	else:
		if NB.mode == "path" and GT - NB.modeT > 2.5: NB.mode = "direct"
		if not NB.path.size() or NB.pi >= NB.path.size() or GT - NB.pathT > 1:
			nbSetPath(tgt); NB.pathT = GT
		followPath(dt, sp)
# 部屋の区切り（おとなりさんの家）。[名前, x0,x1, z0,z1, y0,y1]
const ROOMS := [["elev", 2, 4.2, 19, 21.4, -1, 7],
	# 1階
	["hall1", -2, 2, 14, 32, -1, 3.3], ["living", -10, -2, 14, 22, -1, 3.3], ["garage", -17, -10, 14, 24, -1, 3.3], ["kitchen", 2, 10, 14, 21.4, -1, 3.3], ["pantry", 2, 6, 21.4, 26, -1, 3.3], ["bed1", 6, 10, 21.4, 26, -1, 3.3],
	["grave", -7, -2, 22, 27, -1.5, 2.85], ["basestair", -10, -7, 22, 27, -1.5, 2.85], ["dining", -10, -2, 27, 32, -1, 2.85], ["boiler", 2, 6, 26, 32, -1, 3.3], ["bath1", 6, 10, 26, 32, -1, 3.3],
	# 2階
	["flood", -10, -2, 22, 32, 2.85, 6.5], ["stair2", -10, -2, 20.85, 22, 3.3, 6.5], ["liv2", -7, -2, 14, 20.85, 3.3, 6.5], ["ante", -10, -7, 17.5, 20.85, 3.3, 6.5], ["security", -10, -7, 14, 17.5, 3.3, 6.5],
	["hall2", -2, 2, 14, 32, 3.3, 6.5], ["class", 2, 10, 14, 19, 3.3, 6.5], ["corr", 4.2, 10, 19, 21.4, 3.3, 6.5], ["range", 2, 6, 21.4, 27, 3.3, 6.5], ["bath2", 6, 10, 21.4, 27, 3.3, 6.5], ["storage", 2, 6, 27, 32, 3.3, 6.5], ["kids", 6, 10, 27, 32, 3.3, 6.5]]
func roomAt(x: float, y: float, z: float) -> String:
	for r in ROOMS:
		if x >= r[1] and x < r[2] and z >= r[3] and z < r[4] and y >= r[5] and y < r[6]: return r[0]
	return ""
# 隠れた瞬間に、おとなりさんが同じ部屋にいたら見つかる（そこを開けにくる）
func nbNoteHide(h: Dictionary) -> void:
	NB.sawHide = null
	if not NB.active or NB.state == "script" or NB.state == "catch" or not NB.visible: return
	var rh := roomAt(h.out.x, h.out.y + 0.1, h.out.z); var rn := roomAt(NB.p.x, NB.p.y + 0.1, NB.p.z)
	if not rh or rh != rn: return
	NB.sawHide = h; NB.sit = null; NB.task = null; NB.path = []; NB.goalHide = null; NB.hideTarget = h
	if NB.state != "chase":
		NB.state = "investigate"; NB.inv = {pos = Vector3(h.out.x, h.out.y, h.out.z), kind = "hide", t = 0.0, phase = "go", lt = 0.0}; setNbMode("hunt")
	say("hmm")
func lostPlayer() -> void:
	NB.state = "search"; NB.searchT = 0.0; NB.path = []; NB.hideTarget = null; setNbMode("hunt")
func updSearch(dt: float) -> void:
	NB.searchT += dt; NB.anim = "look"; NB.speed = 0.0
	if NB.searchT > 3.5: backToRoutine()
# 隠れ場所を開ける
func checkHide(h: Dictionary) -> void:
	if NB.state != "chase" and NB.state != "investigate": NB.state = "investigate"
	NB.hideTarget = h; var d := Vector2(h.out.x - NB.p.x, h.out.z - NB.p.z).length()
	if d > 1.1 or absf(h.out.y - NB.p.y) > 1.2:
		if not NB.path.size() or NB.pi >= NB.path.size() or not is_same(NB.goalHide, h):
			nbSetPath(Vector3(h.out.x, h.out.y, h.out.z)); NB.goalHide = h
		var done := followPath(NB.dt if NB.dt else 0.016, 3.15 if NB.state == "chase" else 2.6)
		if not done: return
		if Vector2(h.out.x - NB.p.x, h.out.z - NB.p.z).length() > 1.3:
			var dx: float = h.out.x - NB.p.x; var dz: float = h.out.z - NB.p.z; var dd := Vector2(dx, dz).length(); var ee: float = NB.dt if NB.dt else 1.0 / 60
			NB.p.x += dx / dd * minf(dd, 3 * ee); NB.p.z += dz / dd * minf(dd, 3 * ee); return
	# 開ける
	NB.goalHide = null; NB.hideTarget = null
	if h.cab:
		for L in h.cab.leaves: L.m.tgt = 1.0
	sfx("cab", true); NB.yaw = h.yaw + PI
	if is_same(PL.hide, h): startCatch(true)
	else:
		later(0.9, func():
			if h.cab and not is_same(PL.hide, h):
				for L in h.cab.leaves: L.m.tgt = 0.0)
		NB.state = "search"; NB.searchT = 1.5
# ---- つかまえる ----
func startCatch(fromHide := false) -> void:
	if NB.state == "catch": return
	NB.state = "catch"; NB.catchT = 0.0; NB.anim = "grab"; NB.speed = 0.0; PL.frozen = true
	if fromHide: exitHideForCatch()
	say("gotcha"); sfx("catch")
	if story.get("onCaughtStart"): story.onCaughtStart.call()
func exitHideForCatch() -> void:
	var h = PL.hide
	if not h: return
	PL.hide = null; ui_cls("hideView", "on", false); teleportPlayer(h.out.x - sin(h.yaw) * 0.1, h.out.y, h.out.z - cos(h.yaw) * 0.1, h.yaw + PI); PL.frozen = true
func updCatch(dt: float) -> void:
	NB.catchT += dt; var t: float = NB.catchT # プレイヤーの方へ
	var dx: float = PL.p.x - NB.p.x; var dz: float = PL.p.z - NB.p.z; var d := Vector2(dx, dz).length(); NB.yaw = damp_ang(NB.yaw, atan2(-dx, -dz) + PI, 12, dt)
	if d > 0.9:
		NB.p.x += dx / d * minf(d - 0.9, 4 * dt); NB.p.z += dz / d * minf(d - 0.9, 4 * dt)
	# カメラをおとなりさんの顔に向ける
	var hx: float = NB.p.x; var hy: float = NB.p.y + 1.8; var hz: float = NB.p.z; var c := camPos()
	var ty := atan2(-(hx - c.x), -(hz - c.z)); var tp := atan2(hy - c.y, Vector2(hx - c.x, hz - c.z).length()); PL.yaw = damp_ang(PL.yaw, ty, 8, dt); PL.pitch = damp(PL.pitch, tp, 8, dt)
	NB.anim = "grab"
	if t > 1.3 and not NB.caughtDone:
		NB.caughtDone = true; story.caught.call()
func resetNeighborAfterCatch() -> void:
	NB.caughtDone = false; NB.sawHide = null; NB.blindT = 0.0; NB.state = "routine"; setNbMode("idle"); NB.task = null; NB.path = []; NB.hideTarget = null; NB.inv = null; nbSeeAcc = 0.0
	var n = NODES.hall_m; nbTeleport(n.p.x, n.p.y, n.p.z, 0)
# ================= 学習：罠・カメラ・板 =================
var TRAPS := []
var CAMS := []
# アルファ1：入ってきた所を覚えて、つかまえたあと「いす」でふさぐ（窓の下にはトラバサミ）
var ENTRY := {front = {box = [-1.2, 0, 13.5, 1.2, 2.7, 14.6], chair = [0, 0.3, 15.2, PI], doors = func(): return A.front}, back = {box = [3.4, 0, 31.4, 4.6, 2.6, 32.6], chair = [4, 0.3, 31.1, 0], doors = func(): return [A.back]},
	garageSide = {box = [-17.5, 0, 19.9, -16.5, 2.4, 21.1], chair = [-16.3, 0.1, 20.5, -PI / 2], doors = func(): return [A.garageSide]},
	winLiv = {box = [-8.6, 0.9, 13.5, -5.9, 2.4, 14.6], trap = [-7.2, 0.3, 14.8]}, winLiv2 = {box = [-5.1, 0.9, 13.5, -2.9, 2.4, 14.6], trap = [-4, 0.3, 14.8]}, winKit = {box = [3.9, 0.9, 13.5, 6.1, 2.4, 14.6], trap = [5, 0.3, 15.3]}, winKit2 = {box = [7.1, 0.9, 13.5, 9.3, 2.4, 14.6], trap = [8.2, 0.3, 15.3]},
	winKitE = {box = [9.5, 0.9, 15.9, 10.6, 2.4, 18.1], trap = [8.7, 0.3, 17]}, winBedE = {box = [9.5, 0.9, 22.7, 10.6, 2.4, 24.7], trap = [9.3, 0.3, 25.2]}, winDinN = {box = [-8.1, 0.9, 31.4, -4.9, 2.3, 32.6], trap = [-6.5, 0.3, 31.4]}, winDinW = {box = [-10.6, 0.9, 28.4, -9.5, 2.3, 30.6], trap = [-9.3, 0.3, 29.5]}}
var LEARN := {}
var lastEntry = null
var lastEntryT := -9.0
var wasInside := false
func updLearning(dt: float) -> void:
	if not NB.active: return
	var p: Vector3 = PL.p
	for k in ENTRY:
		var b: Array = ENTRY[k].box
		if p.x > b[0] and p.x < b[3] and p.y + 0.5 > b[1] and p.y < b[4] and p.z > b[2] and p.z < b[5]:
			lastEntry = k; lastEntryT = GT
	var ins := inNHouse(p)
	if ins and not wasInside and lastEntry and GT - lastEntryT < 3:
		LEARN[lastEntry] = LEARN.get(lastEntry, 0) + 1; story.usedEntry = lastEntry
	wasInside = ins
	# トラバサミ
	for T in TRAPS:
		if not T.armed: continue
		if Vector2(p.x - T.x, p.z - T.z).length() < 0.38 and absf(p.y - T.y) < 0.3 and not PL.climb: snapTrap(T, true)
	# 監視カメラ（電気が入っているときだけ）
	if not A.get("power") or not A.power.on or A.get("camsOff"): return
	for C in CAMS:
		if C.broken or C.k == "carn": continue
		C.cool -= dt
		if C.cool > 0: continue
		var dx: float = p.x - C.x; var dy: float = p.y + 1.2 - C.y; var dz: float = p.z - C.z; var d := Vector3(dx, dy, dz).length()
		if d > 13 or PL.hide: continue
		var dot: float = (dx * C.dx + dy * C.dy + dz * C.dz) / d
		if dot < 0.74: continue
		if ray_cast(C.x, C.y, C.z, dx / d, dy / d, dz / d, d - 0.2, func(b): return b.s != "trig" and b.s != "glass") < d - 0.25: continue
		C.cool = 6.0; sfx("alarm"); ui_cls("alarm", "on", true); later(1.8, func(): ui_cls("alarm", "on", false)); NB.lastSeen = p
		if NB.state != "chase" and NB.state != "catch" and NB.active and NB.state != "script":
			NB.state = "investigate"; setNbMode("hunt"); NB.inv = {pos = p, kind = "alarm", t = 0.0, phase = "go", lt = 0.0}; nbSetPath(p); say("hmm")
# つかまえたあと：最後に入ってきた所をふさぐ
func learnFromCatch():
	var k = story.usedEntry
	if not k: return null
	var E: Dictionary = ENTRY[k]; story.usedEntry = null
	if E.get("chair"):
		for d in E.doors.call(): d.m.tgt = 0.0
		if E.get("chairProp") and E.chairProp.st != "gone": propRestAt(E.chairProp, E.chair[0], E.chair[1], E.chair[2], E.chair[3])
		else: E.chairProp = spawnProp("chair", E.chair[0], E.chair[1], E.chair[2], E.chair[3], {id = "bchair_" + k})
		if not E.get("blk"):
			E.blk = true
			for d in E.doors.call():
				var dd = d
				d.blockers.append(func():
					var c = E.get("chairProp")
					if c and c.st == "rest" and Vector2(c.p.x - E.chair[0], c.p.z - E.chair[2]).length() < 0.8 and not doorInside(dd, PL.p.x, PL.p.z): return "何かが中でつっかえていて開かない"
					return null)
		return "chair"
	if E.get("trap"):
		for t in TRAPS:
			if t.k == k: return null
		addBearTrap(E.trap[0], E.trap[1], E.trap[2], k); return "trap"
	return null
func updTrapTask(dt: float) -> void:
	if NB.pi < NB.path.size():
		followPath(dt, 2.4); return
	NB.tt += dt; NB.anim = "work" if NB.tq.kind == "cam" else "crouch"; NB.speed = 0.0
	if RND() < dt * 4: sfx("hammer", 0.5)
	if NB.tt > 2.2:
		placeTrapNow(NB.tq); NB.trapQ.pop_front(); backToRoutine()
func placeTrapNow(q: Dictionary) -> void:
	if q.kind == "repair":
		var C = q.cam; C.broken = false; C.led.visible = true; C.g.rotate_object_local(Vector3.RIGHT, -0.6); return
	if q.kind == "board":
		boardWindow(q.win, true); sfx("hammer")
	elif q.kind == "trap": addBearTrap(q.pos[0], q.pos[1], q.pos[2], q.k)
	elif q.kind == "cam": addCamera(q.cam, q.k)
func placeAllPendingTraps() -> void: NB.trapQ.clear()
func addBearTrap(x: float, y: float, z: float, k) -> Dictionary:
	var g := Node3D.new(); var mb := MB.new(); mb.cyl(0, 0, 0, 0.26, 0.02, MATS.metal_dark, 16); mb.box(-0.04, 0.02, -0.04, 0.04, 0.05, 0.04, MATS.metal); g.add_child(mb.build())
	var jaw := func(s: float) -> Node3D:
		var j := Node3D.new(); var jm := MB.new()
		for i in 7:
			var a := i / 6.0 * PI; jm.box(cos(a) * 0.24 - 0.015, 0, sin(a) * 0.24 * s - 0.015, cos(a) * 0.24 + 0.015, 0.09, sin(a) * 0.24 * s + 0.015, MATS.metal)
		j.add_child(jm.build()); g.add_child(j)
		return j
	var j1: Node3D = jaw.call(1); var j2: Node3D = jaw.call(-1); g.position = Vector3(x, y + 0.005, z); scene.add_child(g)
	var T := {x = x, y = y, z = z, k = k, g = g, j1 = j1, j2 = j2, armed = true}; j1.rotation.x = -1.3; j2.rotation.x = 1.3; TRAPS.append(T)
	return T
func snapTrap(T: Dictionary, player: bool) -> void:
	T.armed = false; T.j1.rotation.x = -0.05; T.j2.rotation.x = 0.05; sfx("trap"); noise(T.x, T.y, T.z, 24, "trap")
	if player:
		PL.stuck = 3.2; PL.v = Vector3(); ui_cls("trapFx", "on", true); toast("トラバサミだ！ 動けない！"); sfx("hurt")
		if story.get("onTrap"): story.onTrap.call()
func addCamera(c: Array, k) -> Dictionary:
	var x: float = c[0]; var y: float = c[1]; var z: float = c[2]; var tx: float = c[3]; var ty: float = c[4]; var tz: float = c[5]
	var g := Node3D.new(); var mb := MB.new(); mb.box(-0.07, -0.07, -0.18, 0.07, 0.07, 0.12, MATS.fridge); mb.cyl(0, 0, 0.14, 0.045, 0.05, MATS.black, 10, null, "z"); mb.box(-0.02, -0.02, -0.3, 0.02, 0.02, -0.18, MATS.dgrey); g.add_child(mb.build())
	var led := mesh(G.sphere(0.018, 6, 4), std_mat({color = "#ff2010", emissive = "#ff1000", ei = 3})); led.position = Vector3(0.04, 0.05, 0.1); g.add_child(led)
	scene.add_child(g); g.position = Vector3(x, y, z)
	# three.js の lookAt（物は +Z を向ける）と同じ向き
	var fwd := Vector3(tx - x, ty - y, tz - z).normalized()
	g.basis = Basis.looking_at(-fwd, Vector3.UP if absf(fwd.y) < 0.99 else Vector3.FORWARD)
	var d := Vector3(tx - x, ty - y, tz - z).length()
	var C := {x = x, y = y, z = z, dx = (tx - x) / d, dy = (ty - y) / d, dz = (tz - z) / d, g = g, led = led, broken = false, cool = 0.0, k = k, box = Box.new(x - 0.2, y - 0.2, z - 0.2, x + 0.2, y + 0.2, z + 0.2)}
	CAMS.append(C)
	return C
func breakCamera(C: Dictionary) -> void:
	if C.broken: return
	C.broken = true; C.led.visible = false; updCamLeds(); C.g.rotate_object_local(Vector3.RIGHT, 0.6); sfx("spark")
	for i in 14: part("a", C.x, C.y, C.z, rr(-2, 2), rr(0, 2), rr(-2, 2), 0.5, 0.04, "#ffd060", 1, 9)
	noise(C.x, C.y, C.z, 14, "impact")
	later(15.0, func():
		if C.broken and NB.active: NB.repairQ.append(C))
# 投げた物がおとなりさん・カメラ・トラバサミに当たったか
func nbPropHit(pr, hx: float, hz: float) -> bool:
	for C in CAMS:
		if C.broken: continue
		var b: Box = C.box
		if pr.p.x + hx > b.x0 and pr.p.x - hx < b.x1 and pr.p.y + pr.d.h > b.y0 and pr.p.y < b.y1 and pr.p.z + hz > b.z0 and pr.p.z - hz < b.z1:
			breakCamera(C); pr.v *= -0.3; return false
	for T in TRAPS:
		if T.armed and Vector2(pr.p.x - T.x, pr.p.z - T.z).length() < 0.35 and absf(pr.p.y - T.y) < 0.25:
			snapTrap(T, false); return false
	if NB.active and NB.visible and NBM and pr.v.length() > 4:
		var dx: float = pr.p.x - NB.p.x; var dz: float = pr.p.z - NB.p.z
		if Vector2(dx, dz).length() < 0.45 and pr.p.y > NB.p.y and pr.p.y < NB.p.y + 2.05:
			pr.v = Vector3(-pr.v.x * 0.2, 1, -pr.v.z * 0.2); sfx("bonk"); say("ow")
			if NB.state != "chase" and NB.state != "catch" and NB.state != "script":
				NB.lastSeen = PL.p; NB.seeT = GT; startChase()
			return false
	return false
# ---- 姿を見せる・かくす ----
func nbVisible(v: bool) -> void:
	NB.visible = v
	if NBM: NBM.root.visible = v

# ================= 音 =================
# three.js 版は WebAudio でその場で作っていた音を、前もって WAV にしてある（tools の書き出し道具で作成）。
# ここでは それを鳴らすだけ。位置のある音は距離で小さくし、左右は Godot が決める。
var AU := {ready = false, streams = {}, players = {}, pool3d = [], loops = {}}
const LOOP_PEAK := {furn = 2.456, hum = 1.779, fire = 1.428, tvnoise = 1.0, wind = 1.0}
const SFX_GAIN := 1.0          # 効果音（書き出しのときに 0.9 をかけてある）
const AMB_GAIN := 0.5 / 0.9    # まわりの音
const MUS_GAIN := 0.55 / 0.9   # 音楽
func au_stream(name: String) -> AudioStream:
	if AU.streams.has(name): return AU.streams[name]
	var p := "res://assets/audio/%s.wav" % name
	var s: AudioStream = load(p) if ResourceLoader.exists(p) else null
	AU.streams[name] = s
	return s
func initAudio() -> void:
	if AU.ready: return
	AU.ready = true
	var master := AudioServer.get_bus_index("Master")
	var comp := AudioEffectCompressor.new(); comp.threshold = -10; comp.ratio = 4
	AudioServer.add_bus_effect(master, comp)
	applyVol()
func applyVol() -> void:
	var master := AudioServer.get_bus_index("Master")
	var v: float = S3.vol if S3.sound else 0.0
	AudioServer.set_bus_volume_db(master, linear_to_db(maxf(v, 0.0001)))
	AudioServer.set_bus_mute(master, v <= 0.0)
func ok() -> bool: return S3.sound
# ---- 位置のない音 ----
func play2d(name: String, vol := 1.0, pitch := 1.0) -> void:
	if not ok() or vol <= 0.0005: return
	var s := au_stream(name)
	if s == null: return
	var p: AudioStreamPlayer = AU.players.get(name)
	if p == null:
		p = AudioStreamPlayer.new(); p.stream = s; p.max_polyphony = 6; add_child(p); AU.players[name] = p
	p.volume_db = linear_to_db(vol); p.pitch_scale = pitch; p.play()
# ---- 位置のある音（距離で小さく）----
func spatialV(pos: Vector3, near := 2.0, far := 30.0) -> float:
	var c := camPos(); var d := pos.distance_to(c)
	var v := 1.0 if d < near else maxf(0.0, 1.0 - (d - near) / (far - near))
	return v * v
func play3d(name: String, pos: Vector3, vol := 1.0, near := 2.0, far := 30.0, pitch := 1.0) -> void:
	if not ok(): return
	var v := spatialV(pos, near, far) * vol
	if v < 0.003: return
	var s := au_stream(name)
	if s == null: return
	var pl: AudioStreamPlayer3D = null
	for q in AU.pool3d:
		if not q.playing:
			pl = q; break
	if pl == null:
		if AU.pool3d.size() >= 24: pl = AU.pool3d[0]
		else:
			pl = AudioStreamPlayer3D.new(); pl.attenuation_model = AudioStreamPlayer3D.ATTENUATION_DISABLED; pl.panning_strength = 0.8; pl.max_db = 6; pl.doppler_tracking = AudioStreamPlayer3D.DOPPLER_TRACKING_DISABLED
			scene.add_child(pl); AU.pool3d.append(pl)
	pl.stream = s; pl.global_position = pos; pl.volume_db = linear_to_db(v); pl.pitch_scale = pitch; pl.play()
func rnd3() -> int: return randi() % 3
# ---- 効果音 ----
func sfxStep(s: String, v := 0.6) -> void:
	var k := "wood"
	if s == "grass" or s == "metal" or s == "carpet" or s == "water" or s == "ice" or s == "dirt": k = s
	elif s == "stone" or s == "tile": k = "stone"
	play2d("step_%s_%d" % [k, rnd3()], v * 0.9)
func sfxNbStep(pos: Vector3, run: bool) -> void:
	var grass := groundAt(pos.x, pos.y + 0.2, pos.z) <= -1
	play3d("nbstep_wood_%s_%d" % ["run" if run else "walk", randi() % 2], pos, 1.0 if not grass else 0.8, 2, 32, 1.6 if grass else 1.0)
func sfxDoor(d: Dictionary, open: bool) -> void:
	play3d("door_%s_%d" % ["open" if open else "close", randi() % 2], Vector3(d.hx, d.y + 1, d.hz), 1.0, 2, 25)
func sfxGlass(pos: Vector3, v := 1.0) -> void: play3d("glass_%d" % (randi() % 2), pos, v, 3, 40)
func sfxImpact(pr: Dictionary, sp: float, s: String) -> void:
	var v := clampf(sp / 10, 0.15, 1) * (1.0 if pr.d.w > 1 else 0.7); var t: String = pr.type; var k := "soft_grass" if s == "grass" else "soft"
	if t == "trashcan" or t == "lid" or t == "crowbar" or t == "pot" or t == "can" or t == "watering_can": k = "metal"
	elif pr.d.glass or t == "plate" or t == "cup": k = "glass"
	elif t == "ball": k = "ball"
	play3d("impact_%s_%d" % [k, randi() % 2], pr.p, v, 2, 30)
func sfxVoice(k: String, pos: Vector3) -> void: play3d("voice_" + k, pos, 1.0, 3, 40)
func sfxTrain(pos: Vector3) -> void: play3d("train", pos, 1.0, 3, 34)
func sfxWhistle(pos: Vector3) -> void: play3d("whistle", pos, 1.0, 4, 60)
func sfxTick(pos: Vector3) -> void: play3d("tickpos", pos, 1.0, 1.5, 14)
func sfxRing(pos: Vector3) -> void: play3d("ring", pos, 1.0, 2, 30)
func sfx(k: String, a = null) -> void:
	if not ok(): return
	match k:
		"throw": play2d("throw", (0.18 + (a if a != null else 0.0) * 0.2) / 0.28)
		"hammer": play2d("hammer", a if a != null else 1.0)
		"drawer": play2d("drawer_o" if a else "drawer_c")
		"cab": play2d("cab_c" if a is bool and a == false else "cab_o")
		"ladder": play2d("ladder_%d" % rnd3())
		"ladderN": play3d("ladder_%d" % rnd3(), NB.p, 0.12 / 0.07, 2, 25, 0.9)
		"crash": play2d("crash", 1.241)
		_: play2d(k)
# ---- ずっと鳴る音（発電機・冷蔵庫・火・テレビ）----
func setLoop(key: String, pos, vol: float, near := 2.0, far := 22.0, dt := 0.016) -> void:
	var L = AU.loops.get(key)
	if L == null:
		var s := au_stream("loop_" + key)
		if s == null: return
		var pl
		if pos == null:
			pl = AudioStreamPlayer.new()
		else:
			pl = AudioStreamPlayer3D.new(); pl.attenuation_model = AudioStreamPlayer3D.ATTENUATION_DISABLED; pl.panning_strength = 0.7; pl.max_db = 12
		pl.stream = s; pl.volume_db = -80
		if pos == null: add_child(pl)
		else: scene.add_child(pl)
		L = {pl = pl, v = 0.0}; AU.loops[key] = L
	var v := vol
	if pos != null and vol > 0:
		L.pl.global_position = pos; v *= spatialV(pos, near, far)
	v *= LOOP_PEAK.get(key, 1.0)
	L.v = L.v + (v - L.v) * (1.0 - exp(-dt / 0.15))
	if not ok(): L.v = 0.0
	if L.v > 0.0005:
		if not L.pl.playing: L.pl.play()
		L.pl.volume_db = linear_to_db(L.v)
	elif L.pl.playing: L.pl.stop()
func updLoops(dt: float) -> void:
	var furn = A.get("furn")
	setLoop("furn", Vector3(5, 1.2, 27.2), 0.03 if furn and furn.cold else 0.12, 2, 14, dt); setLoop("fire", Vector3(5, 0.8, 27.2), 0.12 if furn and not furn.cold else 0.0, 1.5, 10, dt)
	setLoop("hum", null, 0.05 if PL.inHouse and STATE == "play" else 0.0, 2, 22, dt); setLoop("tvnoise", Vector3(-9.5, 1, 19.2), 0.25 if A.get("tvOn") else 0.0, 2, 18, dt)
# ---- まわりの音 ----
var birdT := 0.0
func updAmbience(dt: float) -> void:
	if not ok(): return
	birdT -= dt; var outside: bool = not PL.inHouse
	if birdT <= 0:
		birdT = 1.5 + randf() * 4; var T: String = ENV.mode
		if T == "day" and outside: play2d("amb_bird_%d" % (randi() % 4), AMB_GAIN, 1.0 + randf() * 0.2)
		elif T == "night": play2d("amb_night", AMB_GAIN)
		elif T == "dusk":
			play2d("amb_dusk", AMB_GAIN)
			if randf() < 0.3: play2d("amb_dusk2", AMB_GAIN)
	setLoop("wind", null, (0.12 if outside else 0.03) * AMB_GAIN, 2, 22, dt)
# ================= 音楽 =================
# 曲は1周ぶんを録音してあり、つなぎ目なくくり返す
var MUS := {cur = null, want = null, vol = 0.0, chaseTrack = 1, players = {}}
func setMusic(name) -> void: MUS.want = name
func updMusic(dt: float) -> void:
	if MUS.want != MUS.cur: # フェードして切りかえ
		MUS.vol = maxf(0, MUS.vol - dt * (0.8 if MUS.cur == "chase" else 1.5))
		if MUS.vol <= 0 or MUS.cur == null:
			if MUS.cur != null and MUS.players.has(MUS.cur): MUS.players[MUS.cur].stop()
			MUS.cur = MUS.want
			if MUS.cur != null:
				var p: AudioStreamPlayer = MUS.players.get(MUS.cur)
				if p == null:
					p = AudioStreamPlayer.new(); p.stream = au_stream("music_" + MUS.cur); add_child(p); MUS.players[MUS.cur] = p
				if p.stream: p.play(0.0)
	else: MUS.vol = minf(1, MUS.vol + dt * (4.0 if MUS.cur == "chase" else 0.5))
	if MUS.cur != null and MUS.players.has(MUS.cur):
		var v: float = MUS.vol * (0.8 if MUS.cur == "sneak" else 1.0) * MUS_GAIN
		MUS.players[MUS.cur].volume_db = linear_to_db(maxf(v, 0.00001))
func updChaseMusic(_dt: float) -> void: pass
func updAudio(dt: float) -> void:
	if not AU.ready: return
	updMusic(dt); updLoops(dt); updAmbience(dt)

# ================= お話（アルファ1）=================
# イントロ（車で到着・双眼鏡）→ 引っ越し（電気・赤い鍵・箱・昼寝）→ 地下室の場面（夢）→ 本編 → エンディング（棺）
var P := {}
var story := {part = "", step = 0, flags = {}, stats = {time = 0.0, caught = 0, sleeps = 0}, usedEntry = null, obj = "", gen = 0, ht = [], boxN = -1, nearT = 0.0, inCarn = false,
	canSleep = null, sleepMsg = null, sleep = null, caught = null}
var CUT := {on = false, cam = null, skip = false}
# ---- 待つ（ゲームの時間で）----
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
# JS の setTimeout（本当の時間で）
# テストで手動で進めているときは、進めた時間で数える
var LATERS := []
var RT := 0.0
func later(s: float, fn: Callable) -> void:
	if MANUAL: LATERS.append([RT + s, fn])
	else: get_tree().create_timer(s, true).timeout.connect(fn)
func updLaters(dt: float) -> void:
	RT += dt
	var i := 0
	while i < LATERS.size():
		if RT >= LATERS[i][0]:
			var f: Callable = LATERS[i][1]; LATERS.remove_at(i); f.call()
		else: i += 1
func updWaits() -> void:
	var i := WAITS.size() - 1
	while i >= 0:
		if i < WAITS.size() and (GT >= WAITS[i].t or CUT.skip):
			var w = WAITS[i]; WAITS.remove_at(i)
			if w.fn: w.fn.call()
			else: w.done.emit()
		i -= 1
# ---- カットシーン ----
func cutStart(skippable := true) -> void:
	CUT.on = true; CUT.skip = false; STATE = "cut"; ui_body("cut", true); ui_cls("skipCut", "on", skippable); ui_prompt(""); unlockPointer()
func cutEnd() -> void:
	CUT.on = false; CUT.cam = null; CUT.skip = false; STATE = "play"; ui_body("cut", false); ui_cls("skipCut", "on", false); lockPointer()
func camTo(px: float, py: float, pz: float, lx: float, ly: float, lz: float, snap := false) -> void:
	CUT.cam = {p = Vector3(px, py, pz), l = Vector3(lx, ly, lz), k = 3.0}
	if snap:
		camera.position = CUT.cam.p; camera.look_at(CUT.cam.l)
func updCutCam(dt: float) -> void:
	if not CUT.cam: return
	camera.position = camera.position.lerp(CUT.cam.p, 1 - exp(-CUT.cam.k * dt))
	if camera.position.distance_to(CUT.cam.l) < 0.001: return
	var want := Transform3D().looking_at(CUT.cam.l - camera.position, Vector3.UP).basis.get_rotation_quaternion()
	var q := camera.quaternion.slerp(want, 1 - exp(-4 * dt))
	camera.quaternion = q
# ================= 物を置く =================
func placeA1Props() -> void:
	# --- 自分の庭（引っ越し）---
	P.keyRed = spawnProp("key_red", -4.4, 0.02, -13.2, 0.4, {id = "key_red"})
	P.boxes = []
	for q in [[-2.6, -13.4, 0, 0.1], [-2, -12.8, 0, -0.2], [-2.9, -12.6, 0, 0.3], [-2.4, -13, 0.42, 0], [-1.4, -13.6, 0, 0.5]]: P.boxes.append(spawnProp("box", q[0], q[2], q[1], q[3], {id = "mbox%d" % P.boxes.size()}))
	spawnProp("broom", -1.2, 0, -12.3, 0.4); spawnProp("radio", -3.4, 0.42, -12.8, 0.2); P.binoc = spawnProp("binoculars", -3.6, 0, -14.2, 1, {id = "binoc"}); spawnProp("chair", 4, 0, -14.5, -0.4); spawnProp("suitcase", 3.4, 0, -13.2, 0.3)
	P.flash = spawnProp("flashlight", 5.3, 0.9, -22.8, 0, {id = "flash"})
	# --- おとなりさんの前庭のがらくた（窓を割るのに使う）---
	for q in [["tire", -4, 11.5], ["can", 3, 11], ["bottle", -6.5, 12], ["ball", 8, 10.8], ["can", -8.5, 10.4], ["trashcan", 10.6, 12.8], ["tire", 12.2, 12.6], ["can", 9.3, 11.8]]: spawnProp(q[0], q[1], 0, q[2], rr(0, 3))
	# --- 大事な物 ---
	P.hammer = spawnProp("hammer", -16.3, 1.01, 16.5, 0.4, {id = "hammer"}); P.hammer2 = spawnProp("hammer", 0, 0, 0, 0, {id = "hammer2", att = A.nstand.dr, lp = Vector3(0, 0.04, -0.2)})
	P.crowbar = spawnProp("crowbar", 8.7, F1 + 0.02, 24.3, PI / 2, {id = "crowbar"}); setPropHidden(P.crowbar, true)
	P.lockpick = spawnProp("lockpick", -8.3, F2 + 0.78, 14.5, 0.3, {id = "lockpick"})
	P.bell = spawnProp("bell", 0, 0, 0, 0, {id = "bell", att = A.floodDrawer, lp = Vector3(0, 0.04, -0.2)}); P.bell2 = spawnProp("bell", 9.5, F2 + 0.87, 22.3, 0, {id = "bell2"})
	P.shovel = spawnProp("shovel", -6.74, F1 + 0.44, 23.7, 0, {id = "shovel", noPick = true})
	P.teacher = spawnProp("mannequin", -4.5, -0.67, 25.3, 0, {id = "teacher", noPick = true}); P.teacher.lying = true; refreshSolid(P.teacher); placeProp(P.teacher)
	P.jack = spawnProp("jackhammer", 6.6, F2, 22.2, 0.3, {id = "jack"}); P.ckey = spawnProp("copperkey", 8, F2 + 0.46, 29.8, 0.5, {id = "ckey"})
	P.rifle = spawnProp("toyrifle", 8.55, F2 + 0.78, 16.5, PI / 2, {id = "rifle", noPick = true}); setPropHidden(P.rifle, true)
	P.skey = spawnProp("silverkey", 2.35, F2, 21.75, 0, {id = "skey", noPick = true}); setPropHidden(P.skey, true)
	# 数字のマグネット（先生の机の上と引き出し）
	P.mags = []
	var put := func(ch: String, x: float, y: float, z: float, att = null, lp = Vector3()) -> void:
		var pr: Dictionary
		if att: pr = spawnProp("mag_" + ch, 0, 0, 0, 0, {id = "mag%d" % P.mags.size(), att = att, lp = lp})
		else: pr = spawnProp("mag_" + ch, x, y, z, rr(-0.4, 0.4), {id = "mag%d" % P.mags.size()})
		P.mags.append(pr)
	put.call("5", 8.45, F2 + 0.78, 16.1); put.call("A", 8.6, F2 + 0.78, 16.9); put.call("F", 8.4, F2 + 0.78, 17.1); put.call("2", 8.7, F2 + 0.78, 15.9); put.call("3", 0, 0, 0, A.tdraw[0], Vector3(-0.1, 0.04, -0.2)); put.call("1", 0, 0, 0, A.tdraw[0], Vector3(0.1, 0.04, -0.25)); put.call("8", 0, 0, 0, A.tdraw[1], Vector3(0, 0.04, -0.2)); put.call("7", 0, 0, 0, A.tdraw[1], Vector3(0.12, 0.04, -0.3)); put.call("9", 3.4, F2 + 0.72, 15.2)
	# 目覚まし時計・バナナ・トラバサミ
	for q in [[-8.4, F2 + 0.9, 20.1], [9, F1 + 0.6, 22.3], [3, F1 + 0.9, 25.5], [-9.4, F1 + 0.9, 29]]: spawnProp("alarm", q[0], q[1], q[2], rr(0, 3))
	for q in [[6.4, 18.3], [5.9, 18.4], [6.8, 18.1]]: spawnProp("banana", q[0], F1 + 0.78, q[1], rr(0, 3))
	spawnProp("banana", 0.3, F1, 26.8, 1); spawnProp("banana", -4, F2, 24.8, 0)
	addBearTrap(-0.6, F1, 27.8, "pre1"); addBearTrap(-7, F2, 15.7, "pre2"); addBearTrap(4.8, F2, 15.3, "pre3")
	# 小物
	var deco := [["cup", 9.5, 1.2, 15.2], ["plate", 9.5, 1.2, 15.6], ["pot", 6.6, 1.22, 14.5], ["bottle", 9.5, 1.2, 19.6], ["plate", 6.4, 1.08, 18.1], ["cup", 5.8, 1.08, 18.5], ["book", -7.9, 0.72, 19.2], ["vase", 1.5, 1.2, 14.7], ["can", 3.5, 1.12, 25.6], ["can", 4.5, 1.12, 25.6], ["bottle", 4, 1.52, 25.6],
		["plate", -6.8, 1.08, 29.5], ["plate", -5.2, 1.08, 29.5], ["cup", -6, 1.08, 29.2], ["book", -4.6, F2 + 0.6, 15.2], ["clock", -9.5, F2 + 0.6, 16.8], ["duck", 9.3, F2 + 0.6, 25.8], ["ball", 8.8, F2, 31], ["can", -12, 0.1, 22], ["bottle", -16.2, 1.01, 17.2], ["can", 4.8, F2 + 0.9, 31.5], ["tire", -14, 0.1, 22.5]]
	for q in deco: spawnProp(q[0], q[1], q[2], q[3], rr(-0.3, 0.3))
	for q in [[5.6, 18.3, PI / 2], [6.8, 18.3, -PI / 2]]: spawnProp("chair", q[0], F1, q[1], q[2])
	# 墓の部屋の中のいす（2つのドアをふさぐ）
	P.gchair1 = spawnProp("chair", -5.8, F1, 26.4, 0, {id = "gch1"}); P.gchair2 = spawnProp("chair", -3.3, F1, 26.4, 0, {id = "gch2"})
	var gb := func(pr: Dictionary, x: float) -> Callable:
		return func():
			if pr.st == "rest" and Vector2(pr.p.x - x, pr.p.z - 26.4).length() < 0.7 and PL.p.z > 27: return "何かが中でつっかえていて開かない"
			return null
	A.gdin1.blockers.append(gb.call(P.gchair1, -5.8)); A.gdin2.blockers.append(gb.call(P.gchair2, -3.3))
# ================= いろいろ =================
func setPropHot(_pr, _on) -> void: pass
func toggleSuitcase(_pr) -> void: pass
func setup_story_hooks() -> void:
	story.canSleep = func(): return story.step >= 3 if story.part == "move" else story.part == "main"
	story.sleepMsg = func(): return "まだやることがある" if story.part == "move" else ""
	story.sleep = func():
		if story.part == "move": napIntro()
		elif story.part == "main": napMain()
	story.onPower = func():
		if story.part == "move" and story.step == 0:
			toast("家に電気が通った！"); nextStep()
	story.onPick = func(pr):
		if story.part == "move":
			if is_same(pr, P.keyRed) and story.step == 1: toast("鍵を持って、玄関のドアに左クリック")
		if story.part == "main":
			var m := {lockpick = "ピッキング道具を手に入れた！", hammer = "ハンマーを手に入れた", hammer2 = "ハンマーを手に入れた", crowbar = "バールを手に入れた", bell = "ベルを手に入れた", bell2 = "ベルを手に入れた", shovel = "シャベルを手に入れた", teacher = "先生のマネキンを手に入れた", rifle = "おもちゃの銃を手に入れた", skey = "銀の鍵を手に入れた", jack = "削岩機を手に入れた", ckey = "ハートの銅の鍵を手に入れた！"}
			if m.has(pr.id): toast(m[pr.id])
			saveGame()
	story.onDrop = func(pr):
		if is_same(pr, P.teacher) and teacherPlaced():
			toast("先生が黒板の前に立った。紙くずが止まった"); sfx("ding")
	story.onBell = func(): saveGame()
	story.onDug = func(): saveGame()
	story.onCoffin = func():
		P.teacher.noPick = false; toast("中に先生のマネキンが入っている"); saveGame()
	story.onBoard = func(_b):
		var any := false
		for b in A.boards:
			if b.on: any = true
		toast("板を1枚はがした" if any else "板を全部はがした！"); saveGame()
	for k in ["onCopper", "onBricks", "onGate", "onRifle", "onBoard2"]: story[k] = func(): saveGame()
	story.onValve = func(_cold):
		if story.part == "main":
			NB.goBoiler = true; saveGame()
	story.caught = func(): caughtStory()
# 寝室のベッドの下に隠れると、バールが見つかる
func underBedFind() -> void:
	if story.part == "main" and P.crowbar.hidden and P.crowbar.st != "inv":
		later(0.7, func():
			if not PL.hide: return
			setPropHidden(P.crowbar, false); P.crowbar.noPick = false; var slot: int = PL.inv.find(null)
			if slot >= 0:
				propToInv(P.crowbar); PL.inv[slot] = P.crowbar; drawInv(); toast("ベッドの下にバールがあった！")
			else: toast("ベッドの下にバールがある（持ち物がいっぱい）"))
func nextStep() -> void:
	story.step += 1; moveObj(); saveGame()
# ================= イントロ =================
func runIntro() -> void:
	story.gen += 1; var g: int = story.gen; story.part = "intro"; cutStart(true); setEnv("evening"); homeLights(false); nbVisible(true); NB.active = false
	# 車が通りを走ってくる
	ui_fade_now(true); parkMyCar(-60, -2, PI / 2); await wait(0.2); ui_fade_now(false)
	camTo(-44, 2.2, -8.5, -40, 1.2, -2, true); sfx("car")
	await introDrive(-60, -12, -2, true)
	if not CUT.skip:
		camTo(9, 2.4, -7.5, 3, 1, -8); await introDrive(-12, 4, -2, false)
	# 車よせに入る
	if not CUT.skip:
		var t0 := GT
		while GT - t0 < 2.2 and not CUT.skip:
			var t := smooth((GT - t0) / 2.2); var a := PI / 2 + t * PI / 2; parkMyCar(4 + 1.6 * sin(t * PI / 2), -2 - 10 * t, a); await wait(0)
	parkMyCar(5.6, -12, PI); sfx("thud")
	# そのころ、おとなりさんは……双眼鏡で見ている
	if not CUT.skip:
		await fadeOut(0.5); nbTeleport(-7, F1, 15.2, PI); NB.anim = "look"; camTo(-4, 1.7, 16.8, -7, 1.7, 14.5, true); await fadeIn(0.5); subtitle("……", 1.5); await wait(1.6); NB.anim = "binoc"; nbBinoc(true); await wait(1.4)
		await fadeOut(0.5); nbTeleport(0, 13.6, 18.7, PI); NB.anim = "binoc"; li(A.peepL, 3.0 if QUAL else 1.5); camTo(0.8, 14.9, 16.4, 0, 15, 18.7, true); await fadeIn(0.5); sfxVoice("hmm", Vector3(0, 14, 18)); await wait(2.6)
		camTo(-2, 1.8, -9, 0, 14, 18); await wait(2.2)
	await fadeOut(0.6)
	if g != story.gen: return
	nbBinoc(false); li(A.peepL, 0); nbTeleport(0, 13.6, 20, 0); nbVisible(false); teleportPlayer(4.2, 0.02, -10.2, PI * 0.95); startMove(); CUT.cam = null; await fadeIn(0.8); cutEnd()
func introDrive(x0: float, x1: float, z: float, follow: bool) -> void:
	var t0 := GT
	while true:
		var t := minf(1, (GT - t0) / ((x1 - x0) / 10)); var xx := x0 + (x1 - x0) * smooth(t); parkMyCar(xx, z, PI / 2)
		if follow: camTo(xx + 10, 2, -9, xx, 1.2, -2)
		if t >= 1 or CUT.skip: break
		await wait(0)
func nbBinoc(on: bool) -> void:
	if not NBM: return
	if on and not NBM.get("binoc"):
		var m := mkModel(PDEF.binoculars.mk); m.scale = Vector3(1.3, 1.3, 1.3); m.position = Vector3(0, 0.02, 0.16); m.rotation.y = PI; NBM.head.add_child(m); NBM.binoc = m
	if NBM.get("binoc"): NBM.binoc.visible = on
# ================= 引っ越し（チュートリアル）=================
func startMove() -> void:
	story.part = "move"; story.step = 0; setEnv("evening"); NB.active = false; nbVisible(false); objective(""); moveObj()
	for s in HINTTXT: s.queue_free()
	HINTTXT.clear()
	story.ht = [floatText("E で動かす", 1.9, 1.95, -21.3, 1, 1), floatText("E で拾う", -4.4, 0.9, -13.2, 0, 0.9), floatText("箱を家の中へ", -2.2, 1.5, -13, 0, 1), floatText("ここで昼寝", 4.6, 1.6, -28.6, 0, 0.9)]
	H1.front.lock = "key:key_red"
	H1.front.onUnlock = func():
		if story.part == "move" and story.step == 1:
			toast("鍵が開いた"); nextStep()
	H1.front.blockers = [func(): return "電気が来ていない……先に電気をつけよう" if story.part == "move" and story.step < 1 else null]
	moveObj(); saveGame()
func boxesInside() -> int:
	var n := 0
	for b in P.boxes:
		if b.st == "rest" and b.p.x > -6 and b.p.x < 6 and b.p.z > -30 and b.p.z < -22.1 and b.p.y < 2: n += 1
	return n
func moveObj() -> void:
	var s: int = story.step
	if story.part != "move": return
	var Hs: Array = story.ht
	for i in Hs.size(): Hs[i].visible = i == s or (s == 2 and i == 2)
	if s == 0: objective("ポーチの電気の箱で、電気をつける", "引っ越し")
	if s == 1: objective("庭の赤い取っ手の鍵を拾って、玄関の鍵を開ける", "引っ越し")
	if s == 2: objective("庭の箱をぜんぶ家の中に運ぶ（%d/5）" % boxesInside(), "引っ越し")
	if s == 3: objective("右のドアの寝室のベッドで昼寝する", "引っ越し")
func napIntro() -> void:
	story.gen += 1; var g: int = story.gen; story.part = "dream"; objective("")
	for s in HINTTXT: s.visible = false
	cutStart(true); await fadeOut(1.2); subtitle("……", 1.5, true); await wait(1.2); await basementDream()
	if g != story.gen: return
	startMain(false); await fadeIn(1.2); cutEnd(); subtitle("次の日", 2.5, true)
# ================= 地下室の場面（夢）=================
func dreamWalk(x: float, z: float, sp := 1.4) -> void:
	var tl := GT
	while not CUT.skip:
		var e := minf(0.1, GT - tl); tl = GT; var dx: float = x - NB.p.x; var dz: float = z - NB.p.z; var d := Vector2(dx, dz).length()
		if d < 0.08: break
		NB.yaw = damp_ang(NB.yaw, atan2(dx, dz), 8, e); var st := minf(d, sp * e); NB.p.x += dx / d * st; NB.p.z += dz / d * st; NB.anim = "walk"; NB.speed = sp; await wait(0)
	NB.anim = "idle"; NB.speed = 0.0
func basementDream() -> void:
	setEnv("night"); DREAM.g.visible = true; li(DREAM.L, 4.0 if QUAL else 2.0); nbVisible(true); NB.active = false; NB.state = "off"
	for b in A.boards: b.setOn.call(false)
	A.clock.g.visible = false; A.base.m.t = 0.0; A.base.m.tgt = 0.0; A.base.m.apply.call(0.0)
	nbTeleport(-4.6, F1, 17.4, PI); camTo(-3.2, 1.55, 16.2, -7.4, 1.2, 21.8, true); await fadeIn(1)
	await dreamWalk(-5.4, 20.2); await dreamWalk(-7.6, 21.1); NB.anim = "reach"; await wait(0.5); A.base.m.tgt = 1.0; sfx("creak"); await wait(1); await dreamWalk(-7.6, 23.4, 1.2); await dreamWalk(-8.3, 25, 1.2); nbVisible(false)
	await wait(0.8); sfx("carrev"); await wait(1.2); sfx("screech"); await wait(0.7); sfx("crash"); SHAKE = 0.6; await wait(0.8)
	# タイヤが転がって出てくる
	var W2: Node3D = DREAM.wheel; W2.visible = true; W2.rotation_order = EULER_ORDER_XYZ; var t0 := GT; var tl := GT
	while GT - t0 < 2.2 and not CUT.skip:
		var t := (GT - t0) / 2.2; W2.position = Vector3(-7.6 + sin(t * 3) * 0.2, F1 + 0.36, 23.8 - t * 5.5); W2.rotation.x -= 15 * (GT - tl); tl = GT; W2.rotation.z = 0.2; await wait(0)
	await wait(0.5); nbVisible(true); nbTeleport(-8, F1, 24.5, PI); await dreamWalk(-7.6, 21.3, 1.3); NB.yaw = 0.0; NB.anim = "reach"; await wait(0.4); A.base.m.tgt = 0.0; sfx("slam"); NB.anim = "idle"; await wait(0.6); NB.yaw = PI; NB.anim = "wave"; await wait(0.8)
	await dreamWalk(-5, 19.5, 1.4); await fadeOut(1.2); DREAM.g.visible = false; li(DREAM.L, 0); W2.visible = false; CUT.cam = null
# ================= 本編 =================
func startMain(load: bool) -> void:
	story.part = "main"; setEnv("day"); homeLights(true); H1.front.lock = null; H1.front.blockers = []
	for s in HINTTXT: s.visible = false
	if not load:
		for b in A.boards: b.setOn.call(true)
		A.clock.locked = true; A.clock.g.visible = true; A.base.m.t = 0.0; A.base.m.tgt = 0.0; A.base.m.apply.call(0.0); teleportPlayer(3.4, 0.31, -28, PI * 0.2); var n = NODES.liv_m; nbTeleport(n.p.x, n.p.y, n.p.z, 0)
	PL.spawn = Vector3(3.4, 0.31, -27.5); nbVisible(true); NB.active = true; NB.state = "routine"; setNbMode("idle"); NB.task = null; NB.path = []; objective("となりの家の地下室に入る", "もくひょう"); ui_body("main", true)
	if not load:
		later(3.2, func():
			if story.part == "main": toast("こまったら「？ヒント」（Hキー）" if CFG.hints else "地下室には何がある……？", 3.5))
	saveGame()
func napMain() -> void:
	story.stats.sleeps += 1; cutStart(false); await fadeOut(1); var carn: bool = story.stats.sleeps % 3 == 0
	if carn: await carnival()
	else:
		subtitle("少し眠った……", 1.8, true); await wait(1.5); resetNeighborAfterCatch(); NB.goBoiler = false
	teleportPlayer(3.4, 0.31, -28, PI * 0.2); setEnv("day"); await fadeIn(1); cutEnd(); saveGame()
# ---- つかまった ----
func caughtStory() -> void:
	if story.part != "main": return
	story.stats.caught += 1; STATE = "caught"; showScreen("caught", true); await wait(1.4); await fadeOut(0.5); showScreen("caught", false)
	# 持っていた物はつかまった場所に落ちる
	var dp: Vector3 = PL.p
	for i in 4:
		var it = PL.inv[i]
		if it:
			PL.inv[i] = null; propDropAt(it, dp.x + rr(-0.4, 0.4), dp.y + 0.3, dp.z + rr(-0.4, 0.4), rr(0, TAU), Vector3(rr(-1, 1), 1, rr(-1, 1))); it.thrown = false
	drawInv()
	var learned = learnFromCatch()
	for d in A.front: d.m.tgt = 0.0
	PL.stuck = 0.0; ui_cls("trapFx", "on", false); resetNeighborAfterCatch(); PL.frozen = false
	if story.stats.caught == 1:
		STATE = "cut"; await carnival()
	teleportPlayer(3.4, 0.31, -28, PI * 0.2); cutEnd(); STATE = "play"; setEnv("day")
	subtitle("……おとなりさんは、入ってきた所をふさいだようだ" if learned == "chair" else "……おとなりさんは、入ってきた窓の下に何かしかけたようだ" if learned == "trap" else "持っていた物は、つかまった場所に落ちている" if story.stats.caught == 1 else "つかまってしまった（%d回目）" % story.stats.caught, 3.5)
	saveGame(); await wait(0.3); await fadeIn(0.8)
func fallFaint() -> void: PL.v = Vector3()
# ================= 悪夢：遊園地のかくれんぼ =================
func carnival() -> void:
	var ox: float = CARN.ox; var oz: float = CARN.oz; story.inCarn = true; setEnv("night")
	for L in CARN.lights: li(L, 9.0 if QUAL else 6.0)
	setMusic("carnival")
	var nbWas: bool = NB.active; NB.active = true; NB.state = "script"; NB.script = null; nbVisible(true); nbTeleport(ox, 0, oz + 22, 0); NB.anim = "cover"
	for tries in 5:
		teleportPlayer(ox, 0.02, oz - 1.5, PI); PL.hide = null; ui_cls("hideView", "on", false)
		for L in CARN.ward.leaves: L.m.tgt = 0.0
		nbTeleport(ox + 7, 0, oz + 22, PI * 0.75); NB.anim = "cover"; await fadeIn(0.8); cutEnd(); STATE = "play"; CARN.active = true; subtitle("かくれろ！（ベッドの下か、たんすの中）", 3)
		for i in range(1, 6):
			subtitle("%d……" % i, 0.9, true); sfxVoice("count", NB.p); await wait(1)
		# 数え終わった
		NB.anim = "idle"; sfxVoice("hmm", NB.p); var hid = PL.hide; var other := "ward" if is_same(hid, CARN.bedHide) else "bed"
		var tgt: Vector3 = (Vector3(ox - 5, 0, oz + 10.3) if other == "bed" else Vector3(ox + 5, 0, oz + 10.8)) if hid else PL.p
		# おとなりさんが探しにくる
		var caught := false; var t0 := GT; var tl := GT
		while GT - t0 < 9:
			var e := minf(0.1, GT - tl); tl = GT; var gp: Vector3 = tgt if hid else PL.p; var dx: float = gp.x - NB.p.x; var dz: float = gp.z - NB.p.z; var d := Vector2(dx, dz).length()
			if d > 0.8:
				var sp := 2.2 if hid else 3.1; NB.p.x += dx / d * sp * e; NB.p.z += dz / d * sp * e; NB.yaw = atan2(dx, dz); NB.anim = "walk" if hid else "run"; NB.speed = sp
			else: break
			if not hid and not PL.hide and Vector2(PL.p.x - NB.p.x, PL.p.z - NB.p.z).length() < 1.1:
				caught = true; break
			if not hid and PL.hide: break
			await wait(0)
		if hid or PL.hide: # もう一方の場所を調べて、見つけられない
			NB.anim = "crouch"
			if other == "ward":
				for L in CARN.ward.leaves: L.m.tgt = 1.0
			sfx("cab", true); await wait(1.6); NB.anim = "look"; sfxVoice("grr", NB.p); await wait(1.2)
			if not hid and PL.hide: caught = true # 後から隠れても見られていた
		if not caught:
			cutStart(false); await fadeOut(1.2, true); break
		# 見つかった：もう一度
		cutStart(false); sfx("catch"); NB.anim = "grab"; await wait(1); subtitle("見つかった……もう一度", 2, true); await fadeOut(0.8)
	CARN.active = false; story.inCarn = false
	for L in CARN.lights: li(L, 0)
	setMusic(null); ui_cls("hideView", "on", false); PL.hide = null; NB.active = nbWas; NB.state = "routine"; setNbMode("idle"); var n = NODES.hall_m; nbTeleport(n.p.x, n.p.y, n.p.z, 0); ui_fade_white(false)
# ================= ヒント =================
func hintDone(i: int) -> bool:
	match i:
		0: return A.water.frozen or P.lockpick.st == "inv" or not A.clock.locked
		1: return P.lockpick.st == "inv" or not A.clock.locked
		2:
			for b in A.boards:
				if b.on:
					for p in [P.hammer, P.hammer2, P.crowbar]:
						if p.st == "inv": return true
					return false
			return true
	return false
const HINTS := ["裏口からボイラー室に入って、大きなかまどの赤いバルブを回してみよう（E）",
	"居間の階段を上ると水びたしの部屋。凍っていればわたれる（エレベーターでも2階へ行ける）。2階の居間の左のドア、さらにその先のドアが監視室。机にピッキング道具",
	"ハンマーはガレージの作業台か、寝室のナイトテーブルの引き出し。バールは寝室のベッドの下に隠れると見つかる",
	"居間の階段の下、EXITの看板の地下室のドア：ハンマーかバールで板をはがし（左クリック）、ピッキング道具で銅の錠を開けよう。もうひとつの方法は、ベル→墓の部屋→教室→射的場→子ども部屋の「銅の鍵」"]
func showHint() -> void:
	if story.part == "move":
		toast("左上の「やること」をしよう"); return
	if story.part != "main": return
	for i in HINTS.size():
		if not hintDone(i):
			subtitle("ヒント：" + HINTS[i], 7); return
# ================= エンディング =================
func startEnding() -> void:
	if story.part != "main": return
	story.part = "end"; NB.active = false; setMusic(null); cutStart(false); PL.frozen = true
	# 扉がゆっくり開いて、まぶしい光
	var cp := camPos(); camTo(cp.x, cp.y, cp.z, -7.6, 1.3, 23, true); li(A.baseLight, 0)
	var t0 := GT
	while GT - t0 < 1.6:
		li(A.baseLight, (GT - t0) / 1.6 * 30); await wait(0)
	li(A.baseLight, 30); sfx("sting"); await wait(1.2)
	# おとなりさんが扉をしめて、おそってくる
	nbVisible(true); nbTeleport(-6.6, F1, 20.3, -PI / 2); NB.anim = "reach"; await wait(0.3); A.base.m.tgt = 0.0; li(A.baseLight, 0); sfx("slam"); SHAKE = 0.5; await wait(0.5)
	NB.yaw = atan2(PL.p.x - NB.p.x, PL.p.z - NB.p.z); NB.anim = "run"; camTo(cp.x, cp.y, cp.z, NB.p.x, 1.7, NB.p.z); sfxVoice("hey", NB.p)
	t0 = GT; var tl := GT
	while GT - t0 < 0.6:
		var e := GT - tl; tl = GT; var dx: float = PL.p.x - NB.p.x; var dz: float = PL.p.z - NB.p.z; var d := Vector2(dx, dz).length()
		if d < 0.9: break
		var st := minf(d - 0.9, 6 * e); NB.p.x += dx / d * st; NB.p.z += dz / d * st; await wait(0)
	NB.anim = "grab"; sfx("catch"); SHAKE = 1.0; await wait(0.35); ui_fade_now(true); await wait(1.6)
	# 棺の中で目がさめる
	setEnv("evening"); EXPOSURE = 1.15; apply_env_uniforms(); nbTeleport(GRAVE.ox + 1.15, 0, GRAVE.oz + 0.3, -PI / 2); NB.anim = "look"; NB.look = 0.0
	camTo(GRAVE.ox - 0.1, -1.72, GRAVE.oz + 0.3, GRAVE.ox + 0.5, 1.3, GRAVE.oz + 0.3, true); CUT.cam.k = 1.0
	var lid: Node3D = GRAVE.lid; lid.visible = true; lid.position = Vector3(GRAVE.ox - 1.45, 0.04, GRAVE.oz); lid.rotation = Vector3(); await fadeIn(2.5); await wait(1.2); sfxVoice("hmm", NB.p); await wait(1.6)
	NB.anim = "reach"; await wait(0.4)
	t0 = GT
	while true:
		var t := minf(1, (GT - t0) / 1.0); lid.position = Vector3(GRAVE.ox - 1.45 + 1.45 * t, lerpf(0.04, -1.465, t * t) + sin(t * PI) * 0.55, GRAVE.oz); lid.rotation.z = -sin(t * PI) * 0.5
		if t >= 1: break
		await wait(0)
	sfx("thud"); ui_fade_now(true); await wait(0.1)
	await wait(1.8); setMusic("ending"); var tt: float = story.stats.time; var m := floori(tt / 60); var s := floori(fmod(tt, 60))
	ui_ending("THE END", "地下室には、何があったのだろう……\n（アルファ1はここでおしまい）\n\nかかった時間：%d分%d秒　つかまった回数：%d回" % [m, s, story.stats.caught])
	showScreen("ending", true); STATE = "ending"; cutEnd(); STATE = "ending"; unlockPointer(); store_set(SAVEKEY, null); store_set("otonari-a1-clear", "1")
# ================= 毎フレーム =================
var autoSaveT := 15.0
func updStory(dt: float) -> void:
	if story.part == "main" and STATE == "play": story.stats.time += dt
	PL.inHouse = (PL.p.x > -6 and PL.p.x < 6 and PL.p.z > -30 and PL.p.z < -22) or inNHouse(PL.p)
	if story.part == "move":
		if story.step == 2:
			var n := boxesInside()
			if n != story.boxN:
				story.boxN = n; moveObj()
			if n >= 5:
				toast("荷物を運び終えた！"); nextStep()
		if story.step == 1 and not H1.front.lock: nextStep()
	if story.part == "main":
		var anyBoard := false
		for b in A.boards:
			if b.on: anyBoard = true
		if A.base.m.tgt > 0.5 and not anyBoard and not A.clock.locked: startEnding()
		# 音楽：追いかけられているとき
		if NB.state == "chase": setMusic("chase%d" % MUS.chaseTrack)
		elif MUS.want != null and str(MUS.want).begins_with("chase") and GT - NB.seeT > 3: setMusic(null)
		# おとなりさんが近い（口笛のような音）
		story.nearT -= dt
		if NB.state != "chase" and story.nearT <= 0 and NB.p.distance_to(PL.p) < 9 and inNHouse(PL.p):
			story.nearT = 9.0; sfx("near")
		autoSaveT -= dt
		if autoSaveT <= 0:
			autoSaveT = 15.0; saveGame()
# ================= セーブ =================
const SAVEKEY := "otonari-a1-save"
func r3(v: float) -> float: return snappedf(v, 0.001)
func saveGame() -> void:
	if STATE == "title" or not (story.part == "move" or story.part == "main"): return
	var d := {v = 2, part = story.part, step = story.step, flags = story.flags, stats = story.stats}
	if story.part == "main":
		d.pl = {x = PL.p.x, y = PL.p.y, z = PL.p.z, yaw = PL.yaw}; d.inv = PL.inv.map(func(p): return p.id if p else null); d.props = {}
		var re := RegEx.new(); re.compile("^p\\d+$")
		for p in PROPS:
			if not p.id or re.search(p.id) != null and not p.get("moved"): continue
			d.props[p.id] = {x = r3(p.p.x), y = r3(p.p.y), z = r3(p.p.z), yaw = r3(p.yaw), st = p.st, h = p.hidden, np = p.noPick, ly = not not p.lying, data = p.data}
		d.doors = DOORS.map(func(x): return [1 if x.m.tgt > 0.5 else 0, x.lock]); d.win = WINDOWS.map(func(w): return [1 if w.broken else 0, 1 if w.boarded else 0]); d.traps = TRAPS.map(func(t): return [t.x, t.y, t.z, t.k, 1 if t.armed else 0]); d.cams = CAMS.map(func(c): return 1 if c.broken else 0)
		var chairs := []
		for k in ENTRY:
			if ENTRY[k].get("chairProp"): chairs.append(k)
		d.m = {cold = A.furn.cold, power = A.power.on, camsOff = not not A.get("camsOff"), camsLeft = maxf(5, A.camsCheckAt - GT) if A.get("camsCheckAt") else 0.0, bell = (A.pole.bell.id if A.pole.bell else "bell") if A.pole.has else false, dirt = A.dirt.level, coffin = A.coffin.open,
			slots = A.slots.map(func(S): return S.v.id if S.v else null), rifleGiven = not not A.get("rifleGiven"), stand = A.stand.has, score = A.stand.score, keyDropped = not not A.get("keyDropped"), gate = [A.gate.locked, A.gate.open], bricks = A.bricks.broken, boards = A.boards.map(func(b): return b.on), clock = A.clock.locked, learn = LEARN, chairs = chairs}
	store_set(SAVEKEY, JSON.stringify(d))
func hasSave() -> bool: return store_get(SAVEKEY) != null
func loadGame() -> bool:
	var raw = store_get(SAVEKEY)
	if raw == null: return false
	var d = JSON.parse_string(raw)
	if not d is Dictionary: return false
	story.flags = d.get("flags", {}); story.stats = {time = 0.0, caught = 0, sleeps = 0}; story.stats.merge(d.get("stats", {}), true)
	story.stats.caught = int(story.stats.caught); story.stats.sleeps = int(story.stats.sleeps)
	if d.part == "move":
		teleportPlayer(4.2, 0.02, -10.2, PI * 0.95); parkMyCar(5.6, -12, PI); startMove(); return true
	parkMyCar(5.6, -12, PI)
	for b in P.boxes: propRestAt(b, rr(-4, -1), 0.31, rr(-27, -24), 0)
	H1.ebox.on = true; H1.ebox.open = true; H1.eboxLid.m.tgt = 1.0; H1.ebox.sw.rotation.x = -0.7
	var Mm: Dictionary = d.get("m", {})
	for k in Mm.get("chairs", []):
		if ENTRY.has(k):
			story.usedEntry = k; learnFromCatch()
	for id in d.get("props", {}):
		var pr = propById(id)
		if not pr: continue
		var s: Dictionary = d.props[id]; pr.data.merge(s.get("data", {}), true); pr.noPick = not not s.get("np"); pr.lying = not not s.get("ly")
		if s.st == "inv" or s.st == "att":
			if s.get("h") != null: setPropHidden(pr, s.h)
			continue
		detachProp(pr); propRestAt(pr, s.x, s.y, s.z, s.yaw)
		if s.get("h") != null: setPropHidden(pr, s.h)
	PL.inv = [null, null, null, null]
	var inv: Array = d.get("inv", [])
	for i in inv.size():
		var pr = propById(inv[i]) if inv[i] else null
		if pr:
			detachProp(pr); propToInv(pr); PL.inv[i] = pr
	var ds: Array = d.get("doors", [])
	for i in ds.size():
		if i >= DOORS.size(): break
		var x = DOORS[i]; x.lock = ds[i][1]; x.m.t = float(ds[i][0]); x.m.tgt = float(ds[i][0]); x.m.apply.call(float(ds[i][0]))
	var ws: Array = d.get("win", [])
	for i in ws.size():
		if i >= WINDOWS.size(): break
		if ws[i][0]: setBroken(WINDOWS[i], true)
		if ws[i][1]: boardWindow(WINDOWS[i], true)
	for t in d.get("traps", []):
		var T = null
		for x in TRAPS:
			if x.k == t[3]: T = x
		if not T: T = addBearTrap(t[0], t[1], t[2], t[3])
		if not t[4] and T.armed: snapTrap(T, false)
	var cs: Array = d.get("cams", [])
	for i in cs.size():
		if cs[i] and i < CAMS.size(): breakCamera(CAMS[i])
	if Mm.get("cold"):
		A.furn.cold = true; A.furn.t = 9.0; setFrozen(true)
	setPower(Mm.get("power", true) != false, false)
	if Mm.get("camsOff"):
		A.camsOff = true; A.camsCheckAt = GT + (Mm.get("camsLeft", 40) if Mm.get("camsLeft", 0) else 40)
	updCamLeds()
	if Mm.get("bell") and not A.pole.has:
		var b = propById(Mm.bell if Mm.bell is String else "bell"); P.shovel.noPick = false; b.p = Vector3(A.pole.x, A.pole.y - 0.12, A.pole.z); A.pole.has = true; A.pole.bell = b; b.st = "att"; b.noPick = true; b.grp.position = b.p
		A.boxDoor.m.t = 1.0; A.boxDoor.m.tgt = 1.0; A.boxDoor.m.apply.call(1.0)
	var dl: int = int(Mm.get("dirt", 3))
	while A.dirt.level > dl:
		A.dirt.level -= 1; var lv: float = A.dirt.level / 3.0; A.dirt.m.position.y = -1 + 1.3 * lv - 0.65; A.dirt.col.y1 = -1 + 1.3 * lv; A.dirt.m.visible = A.dirt.level > 0
		if A.dirt.level <= 0: A.dirt.col.on = false
	if Mm.get("coffin"):
		A.coffin.open = true; A.coffin.lidT = 1.0; A.coffin.lidCol.on = false; A.coffin.lid.position = Vector3(A.coffin.x - 0.95, A.coffin.y + 0.53, A.coffin.z); A.coffin.lid.rotation.z = 1.1
	var sl: Array = Mm.get("slots", [])
	for i in sl.size():
		var pr = propById(sl[i]) if sl[i] else null
		if pr:
			var S = A.slots[i]; S.v = pr; pr.st = "att"; pr.noPick = true; pr.grp.visible = true; pr.grp.position = Vector3(9.74, S.y, S.z); pr.grp.rotation_order = EULER_ORDER_XYZ; pr.grp.rotation = Vector3(0, 0, PI / 2)
	A.rifleGiven = Mm.get("rifleGiven", false)
	if Mm.get("stand"):
		var r = propById("rifle"); A.stand.has = true; A.stand.rifle = r; r.st = "att"; r.noPick = true; r.grp.visible = true; r.grp.position = Vector3(3.4, F2 + 1.3, 24.2); r.grp.rotation = Vector3(0, PI / 2, 0)
	A.stand.score = int(Mm.get("score", 0)); drawScore(A.stand.score); A.keyDropped = Mm.get("keyDropped", false); updRangePower()
	if Mm.get("gate"):
		if not Mm.gate[0]:
			A.gate.locked = false; A.gate.lock.visible = false
		if Mm.gate[1]: setGate(A.gate, true)
	if Mm.get("bricks"):
		A.bricks.broken = true; A.bricks.g.visible = false; A.bricks.col.on = false
	var bo: Array = Mm.get("boards", [])
	for i in bo.size():
		if i < A.boards.size(): A.boards[i].setOn.call(bo[i])
	A.clock.locked = Mm.get("clock", true) != false; A.clock.g.visible = A.clock.locked; LEARN.merge(Mm.get("learn", {}), true)
	startMain(true)
	if d.get("pl"): teleportPlayer(d.pl.x, d.pl.y + 0.02, d.pl.z, d.pl.yaw)
	drawInv()
	return true

# ================= 画面（HUD・メニュー）と操作 =================
# three.js 版の HTML/CSS の画面を、Godot の Control で作りなおしたもの
var UI := {}
var ui_layer: CanvasLayer
var BODY := {play = false, main = false, cut = false, touch = false, nohint = false}
var FONT_R: Font
var FONT_B: Font
var FONT_H: Font
const YEL := Color("#ffcf3a")
func _font(path: String) -> Font:
	if ResourceLoader.exists(path): return load(path)
	return ThemeDB.fallback_font
func lset(size: int, col := Color.WHITE, font: Font = null, shadow := true) -> LabelSettings:
	var s := LabelSettings.new(); s.font = font if font else FONT_B; s.font_size = size; s.font_color = col
	if shadow:
		s.shadow_color = Color(0, 0, 0, 0.55); s.shadow_offset = Vector2(0, 2); s.shadow_size = 2
	return s
func sbox(bg: Color, radius := 12, border := Color(0, 0, 0, 0), bw := 0) -> StyleBoxFlat:
	var s := StyleBoxFlat.new(); s.bg_color = bg; s.set_corner_radius_all(radius)
	if bw > 0:
		s.border_color = border; s.set_border_width_all(bw)
	return s
func mklabel(parent: Control, text: String, settings: LabelSettings, align := HORIZONTAL_ALIGNMENT_CENTER) -> Label:
	var l := Label.new(); l.text = text; l.label_settings = settings; l.horizontal_alignment = align; l.mouse_filter = Control.MOUSE_FILTER_IGNORE; parent.add_child(l)
	return l
# 画面のどこに置くか（中心 cx,cy は 0..1、大きさ w,h）
func place(c: Control, ax: float, ay: float, ox: float, oy: float, w := -1.0, h := -1.0, grow_x := Control.GROW_DIRECTION_BOTH) -> void:
	c.anchor_left = ax; c.anchor_right = ax; c.anchor_top = ay; c.anchor_bottom = ay
	c.offset_left = ox; c.offset_top = oy
	if w >= 0: c.offset_right = ox + w
	if h >= 0: c.offset_bottom = oy + h
	c.grow_horizontal = grow_x
	c.grow_vertical = Control.GROW_DIRECTION_END if ay == 0 else Control.GROW_DIRECTION_BEGIN if ay == 1 else Control.GROW_DIRECTION_BOTH
func mkbtn(parent: Control, text: String, kind := "", cb = null) -> Button:
	var b := Button.new(); b.text = text; b.focus_mode = Control.FOCUS_NONE
	var bg := YEL; var fg := Color("#2a1a08"); var sh := Color("#7a4e10")
	if kind == "sub":
		bg = Color("#fff5dc"); sh = Color("#8a7a5a")
	elif kind == "red":
		bg = Color("#e0503c"); fg = Color.WHITE; sh = Color("#7a2012")
	for st in ["normal", "hover", "pressed", "disabled", "focus"]:
		var s := sbox(bg if st != "hover" else bg.lightened(0.08), 14, Color("#2a1a08"), 3)
		s.shadow_color = sh; s.shadow_size = 0; s.shadow_offset = Vector2(0, 5) if st != "pressed" else Vector2(0, 2)
		s.content_margin_top = 12; s.content_margin_bottom = 12; s.content_margin_left = 18; s.content_margin_right = 18
		if st == "disabled": s.bg_color.a = 0.45
		b.add_theme_stylebox_override(st, s)
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]: b.add_theme_color_override(c, fg)
	b.add_theme_color_override("font_disabled_color", Color(fg, 0.5))
	b.add_theme_font_override("font", FONT_H); b.add_theme_font_size_override("font_size", 19)
	if cb: b.pressed.connect(cb)
	parent.add_child(b)
	return b
func shader_rect(code: String) -> ColorRect:
	var r := ColorRect.new(); r.set_anchors_preset(Control.PRESET_FULL_RECT); r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new(); var s := Shader.new(); s.code = "shader_type canvas_item;\n" + code; m.shader = s; r.material = m
	return r
func setup_ui() -> void:
	FONT_R = _font("res://fonts/ui_500.ttf"); FONT_B = _font("res://fonts/ui_800.ttf"); FONT_H = _font("res://fonts/ui_900.ttf")
	var th := Theme.new(); th.default_font = FONT_B; th.default_font_size = 16
	ui_layer = CanvasLayer.new(); ui_layer.layer = 5; add_child(ui_layer)
	var root := Control.new(); root.set_anchors_preset(Control.PRESET_FULL_RECT); root.mouse_filter = Control.MOUSE_FILTER_IGNORE; root.theme = th; ui_layer.add_child(root); UI.root = root
	# ---------- HUD ----------
	var hud := Control.new(); hud.set_anchors_preset(Control.PRESET_FULL_RECT); hud.mouse_filter = Control.MOUSE_FILTER_IGNORE; root.add_child(hud); UI.hud = hud; hud.visible = false
	var hm := Control.new(); hm.set_anchors_preset(Control.PRESET_FULL_RECT); hm.mouse_filter = Control.MOUSE_FILTER_IGNORE; hud.add_child(hm); UI.hudMain = hm
	var hide := shader_rect("""uniform float under = 0.0;
void fragment(){
	vec2 uv = UV; vec4 c;
	if (under < 0.5) {
		float px = uv.y * 540.0; float m = mod(px, 34.0);
		c = m < 22.0 ? vec4(0.094, 0.055, 0.024, 0.97) : vec4(0.0);
		float e = length(max(abs(uv - 0.5) * 2.0 - 0.55, 0.0)) * 1.6; c = mix(c, vec4(0.07, 0.04, 0.016, 1.0), clamp(e, 0.0, 1.0));
	} else {
		c = uv.y < 0.38 ? vec4(0.078, 0.055, 0.031, 0.98) : uv.y < 0.42 ? mix(vec4(0.078, 0.055, 0.031, 0.98), vec4(0.078, 0.055, 0.031, 0.6), (uv.y - 0.38) / 0.04) : uv.y < 0.55 ? mix(vec4(0.078, 0.055, 0.031, 0.6), vec4(0.0), (uv.y - 0.42) / 0.13) : vec4(0.0);
		c.a = max(c.a, smoothstep(0.8, 1.0, uv.y) * 0.7);
	}
	COLOR = c;
}"""); hm.add_child(hide); UI.hideView = hide; hide.visible = false
	UI.hideTip = mklabel(hm, "隠れています　E / 手ボタンで出る", lset(17)); place(UI.hideTip, 0.5, 0.82, -200, -12, 400, 24); UI.hideTip.visible = false
	var binoc := shader_rect("""void fragment(){
	vec2 p = (UV - 0.5) * vec2(1.0 / SCREEN_PIXEL_SIZE.x * SCREEN_PIXEL_SIZE.y, 1.0);
	float r = 0.26; float a = length(p - vec2(-0.13 * (1.0 / SCREEN_PIXEL_SIZE.x * SCREEN_PIXEL_SIZE.y) * 0.0 - 0.0, 0.0));
	vec2 asp = vec2(SCREEN_PIXEL_SIZE.y / SCREEN_PIXEL_SIZE.x, 1.0);
	vec2 q = (UV - 0.5) * vec2((1.0 / SCREEN_PIXEL_SIZE.x) / (1.0 / SCREEN_PIXEL_SIZE.y), 1.0);
	float w = (1.0 / SCREEN_PIXEL_SIZE.x) / (1.0 / SCREEN_PIXEL_SIZE.y);
	float d1 = length(q - vec2((0.37 - 0.5) * w, 0.0)); float d2 = length(q - vec2((0.63 - 0.5) * w, 0.0));
	float inside = max(1.0 - smoothstep(0.26, 0.263, d1), 1.0 - smoothstep(0.26, 0.263, d2));
	COLOR = vec4(0.0, 0.0, 0.0, 1.0 - inside);
}"""); hm.add_child(binoc); UI.binoc = binoc; binoc.visible = false
	var hurt := shader_rect("""void fragment(){ float d = length((UV - 0.5) * vec2(1.0, 1.0)) * 2.0; COLOR = vec4(1.0, 0.235, 0.078, smoothstep(0.45, 1.0, d) * 0.55); }"""); hm.add_child(hurt); UI.hurt = hurt; hurt.modulate.a = 0
	var trap := shader_rect("""void fragment(){ vec2 e = min(UV, 1.0 - UV); float d = min(e.x * 1.6, e.y); COLOR = vec4(0.63, 0.078, 0.04, (1.0 - smoothstep(0.0, 0.22, d)) * 0.7); }"""); hm.add_child(trap); UI.trapFx = trap; trap.modulate.a = 0
	var cross := Panel.new(); cross.add_theme_stylebox_override("panel", sbox(Color(1, 1, 1, 0.85), 5, Color(0, 0, 0, 0.35), 1)); place(cross, 0.5, 0.5, -4, -4, 8, 8); cross.pivot_offset = Vector2(4, 4); cross.mouse_filter = Control.MOUSE_FILTER_IGNORE; hm.add_child(cross); UI.cross = cross
	var pr := RichTextLabel.new(); pr.bbcode_enabled = true; pr.fit_content = true; pr.scroll_active = false; pr.autowrap_mode = TextServer.AUTOWRAP_OFF; pr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	pr.add_theme_font_override("normal_font", FONT_B); pr.add_theme_font_override("bold_font", FONT_H); pr.add_theme_font_size_override("normal_font_size", 18); pr.add_theme_font_size_override("bold_font_size", 18)
	pr.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.6)); pr.add_theme_constant_override("shadow_offset_y", 2); pr.add_theme_constant_override("shadow_offset_x", 0); pr.add_theme_constant_override("line_separation", 2)
	place(pr, 0.5, 0.5, -300, 30, 600, 80); pr.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; hm.add_child(pr); UI.prompt = pr
	var ch := Panel.new(); ch.add_theme_stylebox_override("panel", sbox(Color(0, 0, 0, 0.4), 4)); place(ch, 0.5, 0.5, -42, 21, 84, 7); hm.add_child(ch); UI.charge = ch; ch.visible = false
	var chf := ColorRect.new(); chf.color = Color("#ffb04a"); chf.position = Vector2(0, 0); chf.size = Vector2(0, 7); ch.add_child(chf); UI.chargeFill = chf
	# やること
	var obj := PanelContainer.new(); var os := sbox(Color(0.078, 0.1, 0.133, 0.55), 12); os.border_color = YEL; os.border_width_left = 5; os.content_margin_left = 14; os.content_margin_right = 14; os.content_margin_top = 9; os.content_margin_bottom = 9
	obj.add_theme_stylebox_override("panel", os); place(obj, 0, 0, 64, 14, -1, -1, Control.GROW_DIRECTION_END); obj.custom_minimum_size = Vector2(0, 0); hm.add_child(obj); UI.obj = obj; obj.visible = false
	var ov := VBoxContainer.new(); ov.add_theme_constant_override("separation", 0); obj.add_child(ov)
	UI.objSm = mklabel(ov, "やること", lset(13, Color(1, 1, 1, 0.8), FONT_R), HORIZONTAL_ALIGNMENT_LEFT)
	UI.objT = mklabel(ov, "", lset(17), HORIZONTAL_ALIGNMENT_LEFT)
	UI.toast = mklabel(hm, "", lset(20)); place(UI.toast, 0.5, 0.22, -400, -14, 800, 30); UI.toast.modulate.a = 0
	UI.alarm = mklabel(hm, "● 監視カメラに見つかった！", lset(18, Color("#ff5a4a"), FONT_H)); place(UI.alarm, 0.5, 0.12, -300, -12, 600, 26); UI.alarm.visible = false
	UI.iname = mklabel(hm, "", lset(15), HORIZONTAL_ALIGNMENT_LEFT); place(UI.iname, 0, 1, 20, -112, 400, 22); UI.iname.modulate.a = 0
	# 持ち物
	var inv := HBoxContainer.new(); inv.add_theme_constant_override("separation", 9); place(inv, 0, 1, 18, -86, -1, 70, Control.GROW_DIRECTION_END); hm.add_child(inv); UI.inv = inv; UI.slots = []
	for i in 4:
		var sl := Panel.new(); sl.custom_minimum_size = Vector2(66, 66); sl.add_theme_stylebox_override("panel", sbox(Color(0.118, 0.118, 0.133, 0.62), 13, Color(1, 1, 1, 0.12), 2)); inv.add_child(sl)
		var img := TextureRect.new(); img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE; img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED; img.position = Vector2(4, 4); img.size = Vector2(58, 58); img.mouse_filter = Control.MOUSE_FILTER_IGNORE; sl.add_child(img)
		var n := mklabel(sl, str(i + 1), lset(12, Color(1, 1, 1, 0.7), FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); n.position = Vector2(6, 2)
		var ii := i
		sl.gui_input.connect(func(ev):
			if (ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT) or (ev is InputEventScreenTouch and ev.pressed):
				selSlot(ii); sl.accept_event())
		UI.slots.append({p = sl, img = img, key = ""})
	# ボタン
	UI.hintBtn = mkpill(hm, "？ ヒント", func(): showHint()); place(UI.hintBtn, 1, 0, -170, 12, -1, -1, Control.GROW_DIRECTION_BEGIN); UI.hintBtn.visible = false
	UI.pauseBtn = mkpill(hm, "II", func():
		if STATE == "play": pauseGame()
		elif STATE == "pause": resumeGame()); place(UI.pauseBtn, 1, 0, -56, 10, 46, 46, Control.GROW_DIRECTION_BEGIN)
	# タッチ操作
	var touch := Control.new(); touch.set_anchors_preset(Control.PRESET_FULL_RECT); touch.mouse_filter = Control.MOUSE_FILTER_IGNORE; hm.add_child(touch); UI.touch = touch; touch.visible = false
	var stick := Panel.new(); stick.add_theme_stylebox_override("panel", sbox(Color(1, 1, 1, 0.1), 64, Color(1, 1, 1, 0.28), 2)); stick.size = Vector2(128, 128); place(stick, 0, 1, 34, -170, 128, 128); stick.mouse_filter = Control.MOUSE_FILTER_IGNORE; touch.add_child(stick); UI.stick = stick
	var knob := Panel.new(); knob.add_theme_stylebox_override("panel", sbox(Color(1, 1, 1, 0.35), 27, Color(1, 1, 1, 0.55), 2)); knob.size = Vector2(54, 54); knob.position = Vector2(37, 37); knob.mouse_filter = Control.MOUSE_FILTER_IGNORE; stick.add_child(knob); UI.knob = knob
	UI.tbtns = {}
	for b in [["tRun", "走る", 0, 1, 176, -94, 56], ["tJump", "ジャンプ", 1, 1, -96, -176, 66], ["tCrouch", "しゃが\nむ", 1, 1, -178, -194, 66], ["tUse", "手", 1, 1, -188, -122, 80], ["tThrow", "使う\n投げる", 1, 1, -100, -104, 80], ["tDrop", "置く", 1, 1, -240, -80, 56]]:
		var tb := Button.new(); tb.text = b[1]; tb.focus_mode = Control.FOCUS_NONE; var sz: int = b[6]
		tb.add_theme_stylebox_override("normal", sbox(Color(0.078, 0.1, 0.133, 0.45), int(sz / 2.0), Color(1, 1, 1, 0.45), 2)); tb.add_theme_stylebox_override("pressed", sbox(Color(1, 0.81, 0.23, 0.55), int(sz / 2.0), Color("#ffe066"), 2)); tb.add_theme_stylebox_override("hover", tb.get_theme_stylebox("normal"))
		tb.add_theme_font_override("font", FONT_H); tb.add_theme_font_size_override("font_size", 14 if sz > 60 else 13)
		place(tb, b[2], b[3], b[4], b[5], sz, sz); touch.add_child(tb); UI.tbtns[b[0]] = tb
		var id: String = b[0]
		tb.button_down.connect(func(): touch_btn(id, true)); tb.button_up.connect(func(): touch_btn(id, false))
	UI.sub = mklabel(hud, "", lset(21)); place(UI.sub, 0.5, 0.78, -480, -30, 960, 60); UI.sub.autowrap_mode = TextServer.AUTOWRAP_ARBITRARY; UI.sub.modulate.a = 0; UI.sub.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	UI.skipCut = mkpill(root, "スキップ ▶", func(): CUT.skip = true); place(UI.skipCut, 1, 1, -150, -56, -1, -1, Control.GROW_DIRECTION_BEGIN); UI.skipCut.visible = false
	# ---------- 暗転 ----------
	var fade := ColorRect.new(); fade.color = Color.BLACK; fade.set_anchors_preset(Control.PRESET_FULL_RECT); fade.mouse_filter = Control.MOUSE_FILTER_IGNORE; fade.modulate.a = 0; root.add_child(fade); UI.fade = fade
	# ---------- 画面 ----------
	UI.screens = {}
	# つかまった
	var caught := screen("caught"); var cb := shader_rect("""void fragment(){ float d = length(UV - 0.5) * 1.6; COLOR = vec4(0.0, 0.0, 0.0, mix(0.2, 0.9, clamp(d, 0.0, 1.0))); }"""); caught.add_child(cb); caught.move_child(cb, 0)
	var cv := centerbox(caught); mklabel(cv, "GAME OVER", lset(60, Color("#ff5a4a"), FONT_H)); mklabel(cv, "つかまった！", lset(22))
	# タイトル
	var title := screen("title"); var tg := shader_rect("""void fragment(){ COLOR = vec4(0.04, 0.03, 0.016, smoothstep(0.4, 1.0, UV.y) * 0.55); }"""); title.add_child(tg)
	var logo := VBoxContainer.new(); place(logo, 0.5, 0.09, -400, 0, 800, 200); logo.alignment = BoxContainer.ALIGNMENT_BEGIN; title.add_child(logo); logo.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h1 := RichTextLabel.new(); h1.bbcode_enabled = true; h1.fit_content = true; h1.scroll_active = false; h1.autowrap_mode = TextServer.AUTOWRAP_OFF; h1.mouse_filter = Control.MOUSE_FILTER_IGNORE; h1.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	h1.add_theme_font_override("normal_font", FONT_H); h1.add_theme_font_size_override("normal_font_size", 92); h1.add_theme_color_override("default_color", Color("#fff5dc"))
	h1.add_theme_constant_override("outline_size", 10); h1.add_theme_color_override("font_outline_color", Color("#5a1f0c")); h1.add_theme_color_override("font_shadow_color", Color("#7a2e14")); h1.add_theme_constant_override("shadow_offset_y", 7); h1.add_theme_constant_override("shadow_offset_x", 0)
	h1.text = "おとなり[color=#ffcf3a]さん[/color]"; h1.rotation = -0.05; h1.pivot_offset = Vector2(400, 60); logo.add_child(h1)
	var tag := RichTextLabel.new(); tag.bbcode_enabled = true; tag.fit_content = true; tag.scroll_active = false; tag.autowrap_mode = TextServer.AUTOWRAP_OFF; tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; tag.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tag.add_theme_font_override("normal_font", FONT_H); tag.add_theme_font_size_override("normal_font_size", 20); tag.add_theme_color_override("font_shadow_color", Color.BLACK); tag.add_theme_constant_override("shadow_offset_y", 2)
	tag.text = "となりの地下室には、なにがある？ [bgcolor=#d8402a]  ALPHA 1  [/bgcolor]"; logo.add_child(tag)
	var menu := VBoxContainer.new(); menu.add_theme_constant_override("separation", 12); place(menu, 0.5, 1, -170, -330, 340, 300); title.add_child(menu)
	UI.bNew = mkbtn(menu, "はじめから", "", func(): initAudio(); newGame()); UI.bCont = mkbtn(menu, "つづきから", "sub", func(): initAudio(); contGame())
	mkbtn(menu, "あそびかた", "sub", func(): showScreen("help", true)); mkbtn(menu, "設定", "sub", func(): openSettings())
	var ver := mklabel(title, "おとなりさん アルファ1（Godot版）", lset(13, Color(1, 1, 1, 0.7), FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); place(ver, 0, 1, 14, -28, 400, 20)
	# あそびかた
	var help := screen("help"); var hp := panel(help, 640, 560)
	hp.add_child(ptitle("あそびかた"))
	var ht := RichTextLabel.new(); ht.bbcode_enabled = true; ht.fit_content = false; ht.custom_minimum_size = Vector2(0, 380); ht.size_flags_vertical = Control.SIZE_EXPAND_FILL; ht.add_theme_font_override("normal_font", FONT_R); ht.add_theme_font_override("bold_font", FONT_H); ht.add_theme_font_size_override("normal_font_size", 15); ht.add_theme_font_size_override("bold_font_size", 15)
	ht.text = HELP_TEXT; hp.add_child(ht)
	var hb := mkbtn(hp, "もどる", "", func(): showScreen("help", false)); hb.size_flags_horizontal = Control.SIZE_SHRINK_CENTER; hb.custom_minimum_size = Vector2(240, 0)
	# 設定
	var sett := screen("settings"); var sp := panel(sett, 560, 0)
	sp.add_child(ptitle("設定"))
	UI.sSens = srow(sp, "視点の感度", 30, 250, 10, func(v): CFG.sens = v / 100.0; save_cfg())
	UI.sInv = crow(sp, "上下反転", func(v): CFG.inv = v; save_cfg())
	UI.sFov = srow(sp, "視野の広さ", 60, 95, 1, func(v): CFG.fov = v; save_cfg())
	var qr := HBoxContainer.new(); sp.add_child(qr); var ql := mklabel(qr, "画質", lset(16, Color.WHITE, FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); ql.size_flags_horizontal = Control.SIZE_EXPAND_FILL; UI.sQ = mklabel(qr, "", lset(16, YEL, FONT_B, false))
	UI.sHints = crow(sp, "ヒントを出す", func(v): CFG.hints = v; save_cfg(); BODY.nohint = not v)
	var sn := mklabel(sp, "音の大きさ・横画面は、左上の⚙（3dameの設定）から変えられます。", lset(13, Color(1, 1, 1, 0.7), FONT_R, false), HORIZONTAL_ALIGNMENT_LEFT); sn.autowrap_mode = TextServer.AUTOWRAP_ARBITRARY
	var sb := mkbtn(sp, "もどる", "", func(): showScreen("settings", false)); sb.size_flags_horizontal = Control.SIZE_SHRINK_CENTER; sb.custom_minimum_size = Vector2(240, 0)
	# ポーズ
	var pause := screen("pause"); var pbg := ColorRect.new(); pbg.color = Color(0, 0, 0, 0.5); pbg.set_anchors_preset(Control.PRESET_FULL_RECT); pause.add_child(pbg); pause.move_child(pbg, 0)
	var pp := panel(pause, 400, 0); pp.add_child(ptitle("ポーズ"))
	mkbtn(pp, "つづける", "", func(): resumeGame()); mkbtn(pp, "あそびかた", "sub", func(): showScreen("help", true)); mkbtn(pp, "設定", "sub", func(): openSettings())
	UI.bSkip = mkbtn(pp, "チュートリアルをとばす", "sub", func():
		showScreen("pause", false); skipTutorial())
	mkbtn(pp, "3dameの設定", "sub", func(): post_parent({h3dOpenPanel = 1}))
	mkbtn(pp, "タイトルへ", "red", func():
		saveGame(); showScreen("pause", false); toTitle())
	# おわり
	var ending := screen("ending"); var eb := ColorRect.new(); eb.color = Color.BLACK; eb.set_anchors_preset(Control.PRESET_FULL_RECT); ending.add_child(eb); ending.move_child(eb, 0)
	var ev := centerbox(ending); UI.endT = mklabel(ev, "THE END", lset(48, YEL, FONT_H)); UI.endP = mklabel(ev, "", lset(16, Color(1, 1, 1, 0.9), FONT_B, false))
	var ebn := mkbtn(ev, "タイトルへ", "", func():
		showScreen("ending", false); toTitle()); ebn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER; ebn.custom_minimum_size = Vector2(240, 0)
	# よみこみ中
	var loading := screen("loading"); var lb := ColorRect.new(); lb.color = Color("#1a140c"); lb.set_anchors_preset(Control.PRESET_FULL_RECT); loading.add_child(lb); loading.move_child(lb, 0)
	var lv := centerbox(loading); mklabel(lv, "よみこみ中…", lset(17, Color.WHITE, FONT_B, false))
	var bar := Panel.new(); bar.custom_minimum_size = Vector2(220, 7); bar.add_theme_stylebox_override("panel", sbox(Color(1, 1, 1, 0.15), 4)); lv.add_child(bar); var bf := ColorRect.new(); bf.color = YEL; bf.size = Vector2(0, 7); bar.add_child(bf); UI.loadBar = bf
	showScreen("loading", true)
	# はじめから？
	var cf := ConfirmationDialog.new(); cf.dialog_text = "はじめからにしますか？（今のセーブは消えます）"; cf.ok_button_text = "はい"; cf.cancel_button_text = "いいえ"; cf.title = "おとなりさん"; root.add_child(cf); UI.confirm = cf
	cf.confirmed.connect(func(): newGameReally())
	BODY.nohint = not CFG.hints
	setup_web_bridge()
const HELP_TEXT := """引っ越した先のお向かいさんは、どうも様子がおかしい。あの家の[b]地下室[/b]には何があるのだろう？ 見つからないように忍びこんで、地下室のドアを開けよう。2階の監視室のレバーで監視カメラを切れる。見つかったら走って逃げ、見えない所でクローゼットやベッドの下に隠れればやりすごせる（おとなりさんと同じ部屋で隠れると見つかる）。長く追いかけると、おとなりさんはつかれて見失う。

[color=#ffe066][b]WASD[/b][/color]　移動（Shiftで走る）
[color=#ffe066][b]マウス[/b][/color]　見回す
[color=#ffe066][b]E / F[/b][/color]　拾う・開ける・押す・隠れる（ベッドの下にも）
[color=#ffe066][b]左クリック[/b][/color]　持っている物を使う（鍵・ハンマー・シャベルなど）。長押しして離すと投げる
[color=#ffe066][b]右クリック[/b][/color]　ズーム／目覚まし時計をセットする
[color=#ffe066][b]Q[/b][/color]　持っている物を置く
[color=#ffe066][b]1〜4 / ホイール[/b][/color]　持ち物を選ぶ（4つまで）
[color=#ffe066][b]スペース[/b][/color]　ジャンプ
[color=#ffe066][b]C / Ctrl[/b][/color]　しゃがむ（せまい所を通れる）
[color=#ffe066][b]H[/b][/color]　ヒント
[color=#ffe066][b]Esc[/b][/color]　ポーズ

スマホ：左側をなぞって移動、右側をなぞって見回す。「手」で拾う・開ける、「使う/投げる」を押しっぱなしにして離すと投げる。

おとなりさんは物音を聞きつけてやってくる。見つかると追いかけてくる（追いかけ中は壁ごしでも居場所がばれて、隠れてもむだ）。おとなりさんはこちらより足がおそいので、まずは走って逃げよう。つかまると、入ってきた所をいすでふさがれる。

地下室への道は2つ。ボイラー室のバルブで水を凍らせて監視室のピッキング道具を取る方法と、ベル・シャベル・先生・数字の問題・射的・削岩機で「ハートの銅の鍵」を手に入れる方法。"""
func mkpill(parent: Control, text: String, cb: Callable) -> Button:
	var b := Button.new(); b.text = text; b.focus_mode = Control.FOCUS_NONE
	for st in ["normal", "hover", "pressed", "focus"]:
		var s := sbox(Color(0.078, 0.1, 0.133, 0.55), 100, Color(1, 1, 1, 0.42), 2); s.content_margin_left = 14; s.content_margin_right = 14; s.content_margin_top = 7; s.content_margin_bottom = 7
		b.add_theme_stylebox_override(st, s)
	b.add_theme_font_override("font", FONT_H); b.add_theme_font_size_override("font_size", 15); b.pressed.connect(cb); parent.add_child(b)
	return b
func screen(id: String) -> Control:
	var c := Control.new(); c.set_anchors_preset(Control.PRESET_FULL_RECT); c.visible = false; c.mouse_filter = Control.MOUSE_FILTER_IGNORE; UI.root.add_child(c); UI.screens[id] = c
	return c
func centerbox(parent: Control) -> VBoxContainer:
	var cc := CenterContainer.new(); cc.set_anchors_preset(Control.PRESET_FULL_RECT); cc.mouse_filter = Control.MOUSE_FILTER_IGNORE; parent.add_child(cc)
	var v := VBoxContainer.new(); v.add_theme_constant_override("separation", 10); v.alignment = BoxContainer.ALIGNMENT_CENTER; cc.add_child(v)
	return v
func panel(parent: Control, w: int, h: int) -> VBoxContainer:
	var cc := CenterContainer.new(); cc.set_anchors_preset(Control.PRESET_FULL_RECT); parent.add_child(cc)
	var pc := PanelContainer.new(); var s := sbox(Color(0.11, 0.086, 0.055, 0.92), 18, Color(1, 0.81, 0.23, 0.6), 3); s.content_margin_left = 26; s.content_margin_right = 26; s.content_margin_top = 22; s.content_margin_bottom = 22
	pc.add_theme_stylebox_override("panel", s); pc.custom_minimum_size = Vector2(w, h); cc.add_child(pc)
	var v := VBoxContainer.new(); v.add_theme_constant_override("separation", 12); pc.add_child(v)
	return v
func ptitle(t: String) -> Label:
	var l := Label.new(); l.text = t; l.label_settings = lset(26, YEL, FONT_H, false); l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return l
func srow(parent: Control, name: String, mn: float, mx: float, stp: float, cb: Callable) -> HSlider:
	var r := HBoxContainer.new(); parent.add_child(r); var l := mklabel(r, name, lset(16, Color.WHITE, FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var s := HSlider.new(); s.min_value = mn; s.max_value = mx; s.step = stp; s.custom_minimum_size = Vector2(260, 24); s.focus_mode = Control.FOCUS_NONE; r.add_child(s); s.value_changed.connect(cb)
	return s
func crow(parent: Control, name: String, cb: Callable) -> CheckBox:
	var r := HBoxContainer.new(); parent.add_child(r); var l := mklabel(r, name, lset(16, Color.WHITE, FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var c := CheckBox.new(); c.focus_mode = Control.FOCUS_NONE; r.add_child(c); c.toggled.connect(cb)
	return c
# ---------- 画面の部品をかえる ----------
func showScreen(id: String, on := true) -> void:
	if UI.screens.has(id): UI.screens[id].visible = on
func setLoad(p: float) -> void:
	if UI.has("loadBar"): UI.loadBar.size.x = 220 * p
var TOAST_T := 0.0
var SUB_T := 0.0
func toast(s: String, t := 2.2) -> void:
	UI.toast.text = s; UI.toast.modulate.a = 1.0; TOAST_T = t
func subtitle(s: String, t := 3.0, big := false) -> void:
	var l: Label = UI.sub; l.text = s; l.label_settings = lset(40 if big else 21)
	if big: place(l, 0.5, 0.42, -480, -40, 960, 80)
	else: place(l, 0.5, 0.78, -480, -60, 960, 60)
	var tw := create_tween(); tw.tween_property(l, "modulate:a", 1.0, 0.4); SUB_T = t
func objective(s: String, sm = null) -> void:
	if not s:
		UI.obj.visible = false; story.obj = ""; return
	if story.obj != s:
		var st: StyleBoxFlat = UI.obj.get_theme_stylebox("panel"); st.bg_color = Color(1, 0.81, 0.23, 0.8)
		var tw := create_tween(); tw.tween_method(func(v: float): st.bg_color = Color(1, 0.81, 0.23, 0.8).lerp(Color(0.078, 0.1, 0.133, 0.55), v), 0.0, 1.0, 0.9); sfx("tick")
	story.obj = s; UI.objSm.text = sm if sm else "やること"; UI.objT.text = s; UI.obj.visible = true; UI.obj.reset_size()
func updTexts(dt: float) -> void:
	if TOAST_T > 0:
		TOAST_T -= dt
		if TOAST_T <= 0: create_tween().tween_property(UI.toast, "modulate:a", 0.0, 0.25)
	if SUB_T > 0:
		SUB_T -= dt
		if SUB_T <= 0: create_tween().tween_property(UI.sub, "modulate:a", 0.0, 0.4)
	if inameT > 0:
		inameT -= dt
		if inameT <= 0: create_tween().tween_property(UI.iname, "modulate:a", 0.0, 0.3)
	# HUD の見え方（body のクラスのかわり）
	UI.hud.visible = BODY.play; UI.hudMain.visible = not BODY.cut
	UI.hintBtn.visible = BODY.main; UI.touch.visible = BODY.touch
	UI.skipCut.visible = BODY.cut and UI.skipCut.get_meta("on", false)
	UI.alarm.modulate.a = 1.0 if int(Time.get_ticks_msec() / 250) % 2 == 0 else 0.0
	if PL.charging: UI.chargeFill.size.x = 84 * PL.charge
func ui_body(cls: String, on: bool) -> void: BODY[cls] = on
func ui_cls(id: String, cls: String, on: bool) -> void:
	match id:
		"cross":
			UI.cross.scale = Vector2(1.9, 1.9) if on else Vector2.ONE
			(UI.cross.get_theme_stylebox("panel") as StyleBoxFlat).bg_color = Color("#ffe066") if on else Color(1, 1, 1, 0.85)
		"hideView":
			if cls == "on":
				UI.hideView.visible = on; UI.hideTip.visible = on
			elif cls == "under": UI.hideView.material.set_shader_parameter("under", 1.0 if on else 0.0)
		"binoc": UI.binoc.visible = on
		"hurt": UI.hurt.modulate.a = 1.0 if on else 0.0
		"trapFx": create_tween().tween_property(UI.trapFx, "modulate:a", 1.0 if on else 0.0, 0.2)
		"alarm": UI.alarm.visible = on
		"skipCut": UI.skipCut.set_meta("on", on)
		"charge": UI.charge.visible = on
func ui_prompt(s: String) -> void:
	var t := s.replace("[b]", "[bgcolor=#ffe066][color=#2a2110][b] ").replace("[/b]", " [/b][/color][/bgcolor] ").replace("[small]", "\n[font_size=14][color=#ffffffd8]").replace("[/small]", "[/color][/font_size]")
	UI.prompt.text = "[center]" + t + "[/center]"
func ui_iname(s: String) -> void:
	UI.iname.text = s; UI.iname.modulate.a = 1.0
func drawInv() -> void:
	for i in 4:
		var S = UI.slots[i]; var it = PL.inv[i]
		var st := sbox(Color(0.196, 0.196, 0.22, 0.75) if i == PL.sel else Color(0.118, 0.118, 0.133, 0.62), 13, Color(1, 1, 1, 0.9) if i == PL.sel else Color(1, 1, 1, 0.12), 2)
		S.p.add_theme_stylebox_override("panel", st)
		var key: String = iconKey(it) if it else ""
		if S.key != key:
			S.key = key; S.img.texture = makeIcon(it) if it else null
func ui_fade_now(on: bool) -> void:
	if UI.has("fadeTw") and UI.fadeTw: UI.fadeTw.kill()
	UI.fade.modulate.a = 1.0 if on else 0.0
func ui_fade_white(white: bool) -> void: UI.fade.color = Color.WHITE if white else Color.BLACK
func fadeOut(s := 0.6, white := false) -> void:
	ui_fade_white(white)
	if UI.get("fadeTw"): UI.fadeTw.kill()
	UI.fadeTw = create_tween(); UI.fadeTw.tween_property(UI.fade, "modulate:a", 1.0, 0.6)
	await wait(s)
func fadeIn(s := 0.6) -> void:
	if UI.get("fadeTw"): UI.fadeTw.kill()
	UI.fadeTw = create_tween(); UI.fadeTw.tween_property(UI.fade, "modulate:a", 0.0, 0.6)
	await wait(s)
func ui_ending(t: String, p: String) -> void:
	UI.endT.text = t; UI.endP.text = p
# ================= 操作 =================
var lockOn := false
func lockPointer() -> void:
	if BODY.touch or STATE != "play" or MANUAL: return
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED; lockOn = true
func unlockPointer() -> void:
	if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED: Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	lockOn = false
func pauseGame() -> void:
	if STATE != "play": return
	STATE = "pause"; showScreen("pause", true); UI.bSkip.visible = story.part == "move" or story.part == "intro"; IN.f = 0.0; IN.s = 0.0; KEYS.clear(); endCharge(false); unlockPointer()
func resumeGame() -> void:
	showScreen("pause", false); showScreen("help", false); showScreen("settings", false); STATE = "cut" if CUT.on else "play"; lockPointer()
var KEYS := {}
func kdown(k: int) -> bool: return KEYS.has(k)
func keyAxis() -> void:
	if BODY.touch and TOUCHS.stick: return
	IN.f = (1.0 if kdown(KEY_W) or kdown(KEY_UP) else 0.0) - (1.0 if kdown(KEY_S) or kdown(KEY_DOWN) else 0.0)
	IN.s = (1.0 if kdown(KEY_D) or kdown(KEY_RIGHT) else 0.0) - (1.0 if kdown(KEY_A) or kdown(KEY_LEFT) else 0.0)
	IN.run = kdown(KEY_SHIFT); IN.crouch = kdown(KEY_C) or kdown(KEY_CTRL) or TOUCHS.crouch
var lmbT := 0.0
var lmbDown := false
func _input(ev: InputEvent) -> void:
	if not BOOTED or MANUAL: return
	if ev is InputEventKey:
		var k: int = ev.physical_keycode
		if ev.pressed:
			initAudio()
			if STATE == "pause2": return
			if k == KEY_ESCAPE:
				if STATE == "pause": resumeGame()
				elif STATE == "play": pauseGame()
				return
			if STATE == "cut" and (k == KEY_SPACE or k == KEY_ENTER) and UI.skipCut.get_meta("on", false):
				CUT.skip = true; return
			if STATE != "play": return
			BODY.touch = false
			if ev.echo and k != KEY_W: return
			KEYS[k] = true; keyAxis()
			if k == KEY_SPACE: IN.jump = true
			if k == KEY_E or k == KEY_F: doInteract()
			if k == KEY_Q or k == KEY_G: dropHeld()
			if k == KEY_H: showHint()
			if k == KEY_F:
				var H = held()
				if H and H.d.tool == "light": toolUse()
			if k >= KEY_1 and k <= KEY_4: selSlot(k - KEY_1)
		else:
			KEYS.erase(k); keyAxis()
	elif ev is InputEventMouseButton:
		if BODY.touch and ev.device == -1: return
		if ev.pressed:
			initAudio()
			if STATE != "play": return
			if ev.button_index == MOUSE_BUTTON_WHEEL_DOWN: selSlot(PL.sel + 1); return
			if ev.button_index == MOUSE_BUTTON_WHEEL_UP: selSlot(PL.sel - 1); return
			if _over_ui(ev.position): return
			if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
				lockPointer(); return
			if ev.button_index == MOUSE_BUTTON_LEFT: useDown()
			if ev.button_index == MOUSE_BUTTON_RIGHT:
				var H = held()
				if H and H.d.tool == "alarm": armAlarm(H)
				else: IN.zoom = true
		else:
			if ev.button_index == MOUSE_BUTTON_LEFT: useUp()
			if ev.button_index == MOUSE_BUTTON_RIGHT: IN.zoom = false
	elif ev is InputEventMouseMotion:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED or STATE != "play" or PL.frozen: return
		var k: float = 0.0022 * CFG.sens * S3.sens * (1 - PL.zoom * 0.8)
		PL.yaw -= ev.relative.x * k; PL.pitch -= ev.relative.y * k * (-1.0 if CFG.inv else 1.0); PL.pitch = clampf(PL.pitch, -1.5, 1.5)
	elif ev is InputEventScreenTouch or ev is InputEventScreenDrag:
		touch_input(ev)
func _over_ui(p: Vector2) -> bool:
	for k in ["pauseBtn", "hintBtn", "skipCut"]:
		var c: Control = UI[k]
		if c.is_visible_in_tree() and c.get_global_rect().has_point(p): return true
	for s in UI.slots:
		if s.p.is_visible_in_tree() and s.p.get_global_rect().has_point(p): return true
	return false
func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		KEYS.clear(); keyAxis()
# マウスのロックがはずれたら（Esc など）ポーズ
func updPointer() -> void:
	if lockOn and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		lockOn = false
		if STATE == "play" and not BODY.touch: pauseGame()
# 使う・投げる（左クリック／使うボタン）
func useDown() -> void:
	if PL.hide or PL.frozen: return
	lmbDown = true; lmbT = GT
	if nearStand() and not PL.useTarget:
		shootRange(); lmbDown = false; return
	if PL.useTarget:
		useHeldOnTarget(); lmbDown = false; return
	var H = held()
	if not H:
		if PL.target: doInteract()
		lmbDown = false; return
	if H.d.tool: PL.toolPending = true
	else: startCharge()
func useUp() -> void:
	if not lmbDown: return
	lmbDown = false
	if PL.get("toolPending"):
		PL.toolPending = false
		if GT - lmbT < 0.3:
			toolUse(); return
	if PL.charging: endCharge(true)
func startCharge() -> void:
	PL.charging = true; PL.charge = 0.0; ui_cls("charge", "on", true)
func endCharge(doThrow: bool) -> void:
	if not PL.charging: return
	PL.charging = false; ui_cls("charge", "on", false)
	if doThrow: throwHeld(PL.charge)
func updCharge(dt: float) -> void:
	updPointer()
	if PL.get("toolPending") and lmbDown and GT - lmbT > 0.3:
		PL.toolPending = false; startCharge()
	if PL.charging:
		PL.charge = minf(1, PL.charge + dt * 1.1)
		if not held(): endCharge(false)
# ---- タッチ ----
var TOUCHS := {stick = null, look = null, crouch = false, run = false}
func touch_input(ev: InputEvent) -> void:
	initAudio(); BODY.touch = true
	if STATE != "play": return
	var W := get_viewport().get_visible_rect().size.x
	if ev is InputEventScreenTouch:
		if ev.pressed:
			if _over_touch_btn(ev.position): return
			if ev.position.x < W * 0.42 and not TOUCHS.stick:
				TOUCHS.stick = {id = ev.index, x0 = ev.position.x, y0 = ev.position.y}; UI.stick.position = ev.position - Vector2(64, 64)
			elif not TOUCHS.look:
				TOUCHS.look = {id = ev.index, x = ev.position.x, y = ev.position.y, t0 = GT, moved = 0.0}
		else:
			if TOUCHS.stick and ev.index == TOUCHS.stick.id:
				TOUCHS.stick = null; IN.f = 0.0; IN.s = 0.0; IN.run = TOUCHS.run; UI.knob.position = Vector2(37, 37); place(UI.stick, 0, 1, 34, -170, 128, 128)
			if TOUCHS.look and ev.index == TOUCHS.look.id:
				if TOUCHS.look.moved < 10 and GT - TOUCHS.look.t0 < 0.3 and STATE == "play": doInteract() # 軽くタップしたら「手」
				TOUCHS.look = null
	elif ev is InputEventScreenDrag:
		if TOUCHS.stick and ev.index == TOUCHS.stick.id:
			var dx: float = ev.position.x - TOUCHS.stick.x0; var dy: float = ev.position.y - TOUCHS.stick.y0; var l := Vector2(dx, dy).length(); var m := 52.0
			if l > m:
				dx *= m / l; dy *= m / l
			UI.knob.position = Vector2(37 + dx, 37 + dy); IN.f = -dy / m; IN.s = dx / m
			if absf(IN.f) < 0.15: IN.f = 0.0
			if absf(IN.s) < 0.15: IN.s = 0.0
			IN.run = TOUCHS.run or (l >= m * 0.98 and -dy / m > 0.85)
		if TOUCHS.look and ev.index == TOUCHS.look.id:
			var d: Vector2 = ev.position - Vector2(TOUCHS.look.x, TOUCHS.look.y); TOUCHS.look.x = ev.position.x; TOUCHS.look.y = ev.position.y; TOUCHS.look.moved += absf(d.x) + absf(d.y)
			if STATE == "play" and not PL.frozen:
				var k: float = 0.0048 * CFG.sens * S3.sens * (1 - PL.zoom * 0.8); PL.yaw -= d.x * k; PL.pitch -= d.y * k * (-1.0 if CFG.inv else 1.0); PL.pitch = clampf(PL.pitch, -1.5, 1.5)
func _over_touch_btn(p: Vector2) -> bool:
	for k in UI.tbtns:
		if UI.tbtns[k].get_global_rect().has_point(p): return true
	return _over_ui(p)
func touch_btn(id: String, down: bool) -> void:
	initAudio()
	if STATE != "play": return
	match id:
		"tJump":
			if down: IN.jump = true
		"tUse":
			if down: doInteract()
		"tThrow":
			if down: useDown()
			else: useUp()
		"tDrop":
			if down: dropHeld()
		"tCrouch":
			if down:
				TOUCHS.crouch = not TOUCHS.crouch; IN.crouch = TOUCHS.crouch
		"tRun":
			if down:
				TOUCHS.run = not TOUCHS.run; PL.run = TOUCHS.run
# ---- 設定 ----
func openSettings() -> void:
	showScreen("settings", true); UI.sSens.set_value_no_signal(roundf(CFG.sens * 100)); UI.sInv.set_pressed_no_signal(CFG.inv); UI.sFov.set_value_no_signal(CFG.fov); UI.sHints.set_pressed_no_signal(CFG.hints)
	UI.sQ.text = {eco = "省電力", normal = "標準", high = "高", max = "最高"}.get(S3.quality, "高")
# ---- タイトル ----
var DIRTY := false
func toTitle() -> void:
	STATE = "title"; unlockPointer(); showScreen("title", true); BODY.play = false; BODY.main = false; BODY.cut = false; UI.bCont.disabled = not hasSave(); setMusic("title"); objective(""); NB.active = false
	setEnv("evening"); nbVisible(true); nbTeleport(-3, 0, 10.6, PI); NB.anim = "idle"; NB.state = "off"; NB.look = 0.0; ui_cls("hideView", "on", false); PL.hide = null
func freshStart(mode: String) -> void:
	store_set("otonari-a1-auto", mode); get_tree().reload_current_scene()
func newGame() -> void:
	if hasSave():
		UI.confirm.popup_centered(); return
	newGameReally()
func newGameReally() -> void:
	store_set(SAVEKEY, null)
	if DIRTY:
		freshStart("new"); return
	DIRTY = true; showScreen("title", false); BODY.play = true; STATE = "play"; story.flags = {}; story.stats = {time = 0.0, caught = 0, sleeps = 0}; runIntro()
func contGame() -> void:
	if DIRTY:
		freshStart("cont"); return
	DIRTY = true; showScreen("title", false); BODY.play = true; STATE = "play"
	if not loadGame():
		runIntro(); return
	lockPointer()
func skipTutorial() -> void:
	ui_fade_now(false); story.gen += 1; STATE = "play"; BODY.cut = false; CUT.on = false; CUT.cam = null; CUT.skip = true; later(0.08, func(): CUT.skip = false)
	for i in 4:
		var it = PL.inv[i]
		if it:
			PL.inv[i] = null; propRestAt(it, it.home.x, it.home.y, it.home.z, it.home.yaw)
	H1.ebox.on = true; H1.ebox.open = true; H1.eboxLid.m.tgt = 1.0; H1.ebox.sw.rotation.x = -0.7
	for b in P.boxes: propRestAt(b, rr(-4, -1), 0.31, rr(-27, -24), 0)
	parkMyCar(5.6, -12, PI); nbBinoc(false); startMain(false); lockPointer()
# ---- 3dame（ランチャー）とのやりとり（Web のとき）----
var _js_cb = null
func setup_web_bridge() -> void:
	if not IS_WEB: return
	_js_cb = JavaScriptBridge.create_callback(_on_web_message)
	var w = JavaScriptBridge.get_interface("window")
	w.addEventListener("message", _js_cb)
func _on_web_message(args) -> void:
	var e = args[0]; var d = e.data
	if d == null: return
	var o = d.h3dSet
	if o:
		if typeof(o.sound) == TYPE_BOOL: S3.sound = o.sound
		if typeof(o.vol) == TYPE_FLOAT or typeof(o.vol) == TYPE_INT: S3.vol = float(o.vol)
		if typeof(o.sens) == TYPE_FLOAT or typeof(o.sens) == TYPE_INT: S3.sens = float(o.sens)
		applyVol()
func post_parent(msg: Dictionary) -> void:
	if not IS_WEB: return
	JavaScriptBridge.eval("try{parent.postMessage(%s,'*')}catch(e){}" % JSON.stringify(msg), true)

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
	if MANUAL: updLaters(dt)
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
	setup_story_hooks(); propHitHook = nbPropHit
	setup_render()
	setup_ui()
	boot()
func boot() -> void:
	BODY.touch = is_phone()
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
