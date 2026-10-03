// Bright cartoon afternoon sky with soft drifting clouds.
shader_type sky;

uniform vec3 top_color : source_color = vec3(0.30, 0.52, 0.86);
uniform vec3 horizon_color : source_color = vec3(0.74, 0.85, 0.95);
uniform vec3 ground_color : source_color = vec3(0.38, 0.42, 0.36);
uniform vec3 cloud_color : source_color = vec3(1.0, 1.0, 1.0);
uniform float cloud_cover = 0.48;
uniform float night = 0.0;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 5; i++) {
		v += a * noise(p);
		p = p * 2.02 + vec2(1.7, 9.2);
		a *= 0.5;
	}
	return v;
}

void sky() {
	vec3 d = EYEDIR;
	float h = d.y;
	vec3 col;
	if (h >= 0.0) {
		col = mix(horizon_color, top_color, pow(clamp(h, 0.0, 1.0), 0.55));
	} else {
		col = mix(horizon_color * 0.9, ground_color, clamp(-h * 4.0, 0.0, 1.0));
	}
	// Sun disc and glow.
	if (LIGHT0_ENABLED) {
		float sd = dot(d, LIGHT0_DIRECTION);
		col += LIGHT0_COLOR * (pow(max(sd, 0.0), 600.0) * 6.0 + pow(max(sd, 0.0), 12.0) * 0.18) * (1.0 - night);
	}
	// Clouds on a virtual plane.
	if (h > 0.02 && !AT_CUBEMAP_PASS) {
		vec2 cp = d.xz / (h + 0.12) * 1.6 + vec2(TIME * 0.006, TIME * 0.002);
		float c = fbm(cp);
		float m = smoothstep(cloud_cover, cloud_cover + 0.22, c);
		vec3 cc = mix(cloud_color * 0.82, cloud_color, smoothstep(cloud_cover, cloud_cover + 0.4, fbm(cp + vec2(0.07, 0.05))));
		col = mix(col, cc, m * smoothstep(0.02, 0.2, h) * 0.9);
	} else if (h > 0.02) {
		vec2 cp = d.xz / (h + 0.12) * 1.6;
		float c = fbm(cp);
		col = mix(col, cloud_color * 0.92, smoothstep(cloud_cover, cloud_cover + 0.22, c) * 0.6);
	}
	// Night: dark blue with stars.
	if (night > 0.0) {
		vec3 nc = mix(vec3(0.01, 0.015, 0.04), vec3(0.03, 0.04, 0.09), clamp(h, 0.0, 1.0));
		float st = step(0.9975, hash(floor(d.xz / (abs(h) + 0.3) * 300.0))) * step(0.0, h);
		nc += vec3(st);
		col = mix(col, nc, night);
	}
	COLOR = col;
}
