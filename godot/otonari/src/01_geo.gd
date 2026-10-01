
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
