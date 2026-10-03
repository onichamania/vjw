// Procedural "uber" surface shader.
// Every pattern is generated in world space (or object space for moving
// props) with a box-style triplanar projection, so plain BoxMesh geometry
// gets siding, bricks, wallpaper, floor boards etc. without any UV work.
shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

// 0 solid, 1 siding, 2 brick, 3 stripes, 4 floral, 5 floor boards, 6 tiles,
// 7 grass, 8 asphalt, 9 shingles, 10 concrete, 11 "ear" wallpaper,
// 12 polka dots, 13 argyle, 14 brushed metal, 15 dirt, 16 plaster,
// 17 vertical planks, 18 wood grain, 19 checker, 20 damask, 21 carnival stripes
uniform int pattern = 0;
uniform vec4 color_a : source_color = vec4(0.8, 0.8, 0.8, 1.0);
uniform vec4 color_b : source_color = vec4(0.6, 0.6, 0.6, 1.0);
uniform vec4 color_c : source_color = vec4(0.3, 0.3, 0.3, 1.0);
uniform float scale = 1.0;
uniform float rough = 0.85;
uniform float metal = 0.0;
uniform float noise_amt = 0.06;
uniform float bump = 0.6;
uniform bool use_local = false;
uniform vec4 emission_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);
uniform float emission_energy = 0.0;

varying vec3 p_pos;
varying vec3 p_nrm;

float hash12(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float a = hash12(i);
	float b = hash12(i + vec2(1.0, 0.0));
	float c = hash12(i + vec2(0.0, 1.0));
	float d = hash12(i + vec2(1.0, 1.0));
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 4; i++) {
		v += a * vnoise(p);
		p *= 2.03;
		a *= 0.5;
	}
	return v;
}

void vertex() {
	if (use_local) {
		p_pos = VERTEX;
		p_nrm = NORMAL;
	} else {
		p_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
		p_nrm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
	}
}

// Box projection. For walls "up" is always world Y.
vec2 proj_uv(vec3 p, vec3 n, out float is_top) {
	vec3 a = abs(n);
	is_top = 0.0;
	if (a.y > a.x && a.y > a.z) {
		is_top = 1.0;
		return p.xz;
	} else if (a.x > a.z) {
		return vec2(p.z, p.y);
	}
	return vec2(p.x, p.y);
}

float line_mask(float v, float w) {
	float f = fract(v);
	float d = min(f, 1.0 - f);
	return 1.0 - smoothstep(w * 0.5, w, d);
}

void fragment() {
	float top;
	vec2 uv = proj_uv(p_pos, p_nrm, top) / max(scale, 0.0001);
	vec3 col = color_a.rgb;
	float h = 0.0;       // pseudo height for bump mapping
	float r = rough;
	float n = fbm(uv * 7.0);

	if (pattern == 1) {
		// Horizontal painted siding planks with a shadowed lip.
		float ph = 0.19;
		float row = floor(uv.y / ph);
		float fy = fract(uv.y / ph);
		float var = hash12(vec2(row, 3.0)) - 0.5;
		col = mix(color_a.rgb, color_b.rgb, 0.5 + var * 0.8);
		col *= mix(0.72, 1.0, smoothstep(0.0, 0.16, fy));
		col *= 0.94 + 0.12 * fbm(vec2(uv.x * 1.5, uv.y * 30.0));
		float seam = line_mask(uv.x / 2.4 + hash12(vec2(row, 7.0)), 0.004);
		col = mix(col, color_c.rgb, seam * 0.6);
		h = smoothstep(0.0, 0.2, fy) - seam * 0.5;
	} else if (pattern == 2) {
		// Running bond bricks.
		vec2 bs = vec2(0.24, 0.085);
		vec2 b = uv / bs;
		float row = floor(b.y);
		b.x += mod(row, 2.0) * 0.5;
		vec2 id = floor(b);
		vec2 f = fract(b);
		float mx = min(f.x, 1.0 - f.x) * bs.x;
		float my = min(f.y, 1.0 - f.y) * bs.y;
		float mortar = 1.0 - smoothstep(0.006, 0.011, min(mx, my));
		float v = hash12(id);
		vec3 brick = mix(color_a.rgb, color_c.rgb, v * 0.7);
		brick *= 0.85 + 0.25 * fbm(uv * 25.0);
		col = mix(brick, color_b.rgb, mortar);
		h = 1.0 - mortar;
	} else if (pattern == 3) {
		// Vertical wallpaper stripes.
		float s = fract(uv.x / 0.16);
		col = s < 0.5 ? color_a.rgb : color_b.rgb;
		col = mix(col, color_c.rgb, line_mask(uv.x / 0.16, 0.025) * 0.7);
		col *= 0.96 + 0.06 * n;
	} else if (pattern == 4) {
		// Floral wallpaper: little five petal flowers on a diamond lattice.
		vec2 g = uv / 0.22;
		vec2 id = floor(g);
		vec2 f = fract(g) - 0.5;
		if (mod(id.x + id.y, 2.0) > 0.5) f = fract(g + 0.5) - 0.5;
		float ang = atan(f.y, f.x);
		float rad = length(f);
		float petal = 0.17 + 0.08 * cos(ang * 5.0);
		float flower = 1.0 - smoothstep(petal - 0.02, petal, rad);
		float center = 1.0 - smoothstep(0.045, 0.06, rad);
		float leaf = 1.0 - smoothstep(0.03, 0.05, abs(length(f - vec2(0.24, -0.2)) - 0.0) - 0.03);
		col = color_a.rgb;
		col = mix(col, color_b.rgb, flower);
		col = mix(col, color_c.rgb, center + leaf * 0.5);
		col *= 0.95 + 0.07 * n;
	} else if (pattern == 5) {
		// Floor boards running along X.
		vec2 q = top > 0.5 ? uv : uv.yx;
		float w = 0.16;
		float row = floor(q.y / w);
		float len = 1.6 + hash12(vec2(row, 1.0)) * 1.2;
		float off = hash12(vec2(row, 2.0)) * 3.0;
		float col_id = floor((q.x + off) / len);
		float v = hash12(vec2(row, col_id));
		vec3 wood = mix(color_a.rgb, color_b.rgb, v);
		float grain = fbm(vec2((q.x + off) * 2.0, q.y * 60.0 + v * 10.0));
		wood *= 0.82 + 0.3 * grain;
		float gap = max(line_mask(q.y / w, 0.04), line_mask((q.x + off) / len, 0.006));
		col = mix(wood, color_c.rgb, gap * 0.85);
		h = 1.0 - gap;
		r = rough - 0.15 * (1.0 - gap);
	} else if (pattern == 6) {
		// Square tiles with grout.
		vec2 t = uv / 0.3;
		vec2 id = floor(t);
		float chk = mod(id.x + id.y, 2.0);
		col = mix(color_a.rgb, color_b.rgb, chk);
		col *= 0.95 + 0.08 * hash12(id);
		float grout = max(line_mask(t.x, 0.035), line_mask(t.y, 0.035));
		col = mix(col, color_c.rgb, grout);
		h = 1.0 - grout;
		r = mix(rough * 0.5, 0.95, grout);
	} else if (pattern == 7) {
		// Grass.
		float g1 = fbm(uv * 0.35);
		float g2 = fbm(uv * 3.0);
		float g3 = vnoise(uv * 40.0);
		col = mix(color_a.rgb, color_b.rgb, smoothstep(0.3, 0.7, g1));
		col = mix(col, color_c.rgb, smoothstep(0.62, 0.8, g2) * 0.5);
		col *= 0.85 + 0.3 * g3;
		h = g3;
	} else if (pattern == 8) {
		// Asphalt.
		float s = vnoise(uv * 60.0);
		col = mix(color_a.rgb, color_b.rgb, fbm(uv * 0.5));
		col *= 0.85 + 0.3 * s;
		col = mix(col, color_c.rgb, smoothstep(0.92, 0.97, vnoise(uv * 90.0)) * 0.6);
		h = s;
	} else if (pattern == 9) {
		// Roof shingles.
		vec2 s = vec2(uv.x / 0.32, uv.y / 0.14);
		float row = floor(s.y);
		s.x += hash12(vec2(row, 4.0)) * 0.7 + mod(row, 2.0) * 0.5;
		vec2 id = floor(s);
		vec2 f = fract(s);
		float v = hash12(id);
		col = mix(color_a.rgb, color_b.rgb, v);
		float edge = smoothstep(0.0, 0.18, f.y) * (1.0 - line_mask(s.x, 0.03));
		col *= mix(0.55, 1.0, edge);
		col *= 0.9 + 0.2 * fbm(uv * 12.0);
		h = edge;
	} else if (pattern == 10) {
		// Concrete slabs.
		col = mix(color_a.rgb, color_b.rgb, fbm(uv * 1.3));
		col *= 0.9 + 0.12 * vnoise(uv * 50.0);
		float seam = max(line_mask(uv.x / 1.5, 0.008), line_mask(uv.y / 1.5, 0.008));
		col = mix(col, color_c.rgb, seam);
		h = 1.0 - seam;
	} else if (pattern == 11) {
		// The Alpha 1 living room wallpaper: rows of little ear shapes.
		vec2 g = uv / vec2(0.2, 0.26);
		vec2 id = floor(g);
		vec2 f = fract(g) - 0.5;
		if (mod(id.y, 2.0) > 0.5) { f.x = fract(g.x + 0.5) - 0.5; }
		f.x *= 1.35;
		float outer = abs(length(f) - 0.25) - 0.045;
		float cut = f.x + 0.06;
		float ear = (1.0 - smoothstep(0.0, 0.015, outer)) * step(-0.12, cut);
		float lobe = 1.0 - smoothstep(0.06, 0.075, length(f - vec2(0.02, -0.18)));
		float inner = 1.0 - smoothstep(0.0, 0.012, abs(length(f - vec2(0.03, 0.02)) - 0.11) - 0.02);
		inner *= step(0.0, f.x);
		col = color_a.rgb;
		col = mix(col, color_b.rgb, clamp(ear + lobe, 0.0, 1.0));
		col = mix(col, color_c.rgb, inner * 0.8);
		col *= 0.95 + 0.07 * n;
	} else if (pattern == 12) {
		vec2 g = uv / 0.14;
		vec2 f = fract(g) - 0.5;
		float d = 1.0 - smoothstep(0.17, 0.2, length(f));
		col = mix(color_a.rgb, color_b.rgb, d);
	} else if (pattern == 13) {
		// Argyle knit: diamonds, lighter diamonds and white dotted diagonals.
		vec2 g = uv / vec2(0.11, 0.15);
		vec2 dg = vec2(g.x + g.y, g.x - g.y) * 0.5;
		vec2 id = floor(dg);
		float chk = mod(id.x + id.y, 2.0);
		col = mix(color_a.rgb, color_b.rgb, chk);
		vec2 fd = fract(dg);
		float diag = min(min(fd.x, 1.0 - fd.x), min(fd.y, 1.0 - fd.y));
		float dots = step(0.5, fract((g.x) * 4.0)) ;
		float line = (1.0 - smoothstep(0.015, 0.035, diag)) * dots;
		col = mix(col, color_c.rgb, line);
		col *= 0.92 + 0.12 * vnoise(uv * 300.0);
		h = vnoise(uv * 300.0);
	} else if (pattern == 14) {
		float s = vnoise(vec2(uv.x * 2.0, uv.y * 200.0));
		col = color_a.rgb * (0.85 + 0.25 * s);
		h = s * 0.3;
	} else if (pattern == 15) {
		float d1 = fbm(uv * 2.5);
		float d2 = vnoise(uv * 30.0);
		col = mix(color_a.rgb, color_b.rgb, d1);
		col = mix(col, color_c.rgb, smoothstep(0.75, 0.9, d2) * 0.5);
		h = d1 + d2 * 0.4;
	} else if (pattern == 16) {
		col = color_a.rgb * (0.93 + 0.1 * fbm(uv * 4.0));
		h = vnoise(uv * 80.0) * 0.3;
	} else if (pattern == 17) {
		// Vertical planks (fences, sheds, boards).
		float w = 0.14;
		float c = floor(uv.x / w);
		float v = hash12(vec2(c, 9.0));
		col = mix(color_a.rgb, color_b.rgb, v);
		col *= 0.85 + 0.25 * fbm(vec2(uv.x * 40.0, uv.y * 2.0));
		float gap = line_mask(uv.x / w, 0.06);
		col = mix(col, color_c.rgb, gap * 0.8);
		h = 1.0 - gap;
	} else if (pattern == 18) {
		float g = fbm(vec2(uv.x * 3.0, uv.y * 40.0));
		col = mix(color_a.rgb, color_b.rgb, g);
		h = g * 0.5;
	} else if (pattern == 19) {
		vec2 t = floor(uv / 0.25);
		col = mod(t.x + t.y, 2.0) > 0.5 ? color_a.rgb : color_b.rgb;
	} else if (pattern == 20) {
		// Damask-ish wallpaper.
		vec2 g = uv / vec2(0.3, 0.4);
		vec2 f = fract(g) - 0.5;
		if (mod(floor(g.y), 2.0) > 0.5) f.x = fract(g.x + 0.5) - 0.5;
		float d = abs(f.x) * 1.6 + abs(f.y);
		float m = 1.0 - smoothstep(0.26, 0.29, d);
		float m2 = 1.0 - smoothstep(0.13, 0.16, d);
		col = mix(color_a.rgb, color_b.rgb, m - m2 * 0.7);
		col = mix(col, color_c.rgb, m2 * 0.6);
		col *= 0.95 + 0.07 * n;
	} else if (pattern == 21) {
		float s = fract(uv.x / 0.5);
		col = s < 0.5 ? color_a.rgb : color_b.rgb;
	}

	if (pattern == 0) {
		col *= 1.0 - noise_amt + noise_amt * 2.0 * n;
	} else {
		col *= 1.0 - noise_amt * 0.5 + noise_amt * n;
	}

	ALBEDO = col;
	ROUGHNESS = clamp(r, 0.04, 1.0);
	METALLIC = metal;
	EMISSION = emission_color.rgb * emission_energy;

	// Derivative based bump mapping (no tangents needed).
	if (bump > 0.0) {
		vec3 dpdx = dFdx(VERTEX);
		vec3 dpdy = dFdy(VERTEX);
		float dhdx = dFdx(h);
		float dhdy = dFdy(h);
		vec3 r1 = cross(dpdy, NORMAL);
		vec3 r2 = cross(NORMAL, dpdx);
		float det = dot(dpdx, r1);
		vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
		NORMAL = normalize(abs(det) * NORMAL - bump * 0.0025 * grad);
	}
}
