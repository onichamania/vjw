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
