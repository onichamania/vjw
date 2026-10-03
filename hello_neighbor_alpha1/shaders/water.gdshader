// Murky flooded-room water. When frozen the script swaps to an ice material.
shader_type spatial;
render_mode blend_mix, depth_draw_always, cull_back, specular_schlick_ggx;

uniform vec4 deep_color : source_color = vec4(0.08, 0.22, 0.24, 0.86);
uniform vec4 shallow_color : source_color = vec4(0.22, 0.42, 0.40, 0.7);
uniform float wave_speed = 0.6;

varying vec3 wp;

float h(vec2 p, float t) {
	return sin(p.x * 3.1 + t * 1.3) * 0.5 + sin(p.y * 2.7 - t * 1.1) * 0.5
		+ sin((p.x + p.y) * 5.3 + t * 2.1) * 0.25 + sin((p.x - p.y) * 7.9 - t * 1.7) * 0.15;
}

void vertex() {
	wp = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float t = TIME * wave_speed;
	float e = 0.05;
	float c = h(wp.xz, t);
	float dx = h(wp.xz + vec2(e, 0.0), t) - c;
	float dz = h(wp.xz + vec2(0.0, e), t) - c;
	vec3 n_world = normalize(vec3(-dx * 0.35, 1.0, -dz * 0.35));
	NORMAL = normalize((VIEW_MATRIX * vec4(n_world, 0.0)).xyz);
	float fres = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 3.0);
	vec4 col = mix(deep_color, shallow_color, 0.5 + 0.5 * c * 0.3);
	ALBEDO = col.rgb;
	ALPHA = clamp(col.a + fres * 0.2, 0.0, 1.0);
	ROUGHNESS = 0.05;
	SPECULAR = 0.6;
}
