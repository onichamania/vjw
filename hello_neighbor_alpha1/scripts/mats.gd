class_name Mats
extends RefCounted
## Material library. Everything is procedural (see shaders/surface.gdshader),
## so the project ships without any texture files.

static var _cache := {}
static var _shader: Shader


static func _surface_shader() -> Shader:
	if _shader == null:
		_shader = load("res://shaders/surface.gdshader")
	return _shader


static func surf(pattern: int, a: Color, b := Color(0.5, 0.5, 0.5), c := Color(0.2, 0.2, 0.2), scale := 1.0, rough := 0.85, extra := {}) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = _surface_shader()
	m.set_shader_parameter("pattern", pattern)
	m.set_shader_parameter("color_a", a)
	m.set_shader_parameter("color_b", b)
	m.set_shader_parameter("color_c", c)
	m.set_shader_parameter("scale", scale)
	m.set_shader_parameter("rough", rough)
	for k in extra:
		m.set_shader_parameter(k, extra[k])
	return m


static func solid(col: Color, rough := 0.8, metal := 0.0, local := false) -> ShaderMaterial:
	return surf(0, col, col, col, 1.0, rough, {"metal": metal, "noise_amt": 0.04, "bump": 0.0, "use_local": local})


static func std(col: Color, rough := 0.6, metal := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.roughness = rough
	m.metallic = metal
	return m


static func emissive(col: Color, energy := 2.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.emission_enabled = true
	m.emission = col
	m.emission_energy_multiplier = energy
	return m


static func glass(tint := Color(0.75, 0.88, 0.95, 0.28)) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.albedo_color = tint
	m.roughness = 0.04
	m.metallic = 0.2
	m.specular = 0.9
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


static func get_mat(name: String) -> Material:
	if _cache.has(name):
		return _cache[name]
	var m := _make(name)
	_cache[name] = m
	return m


static func _make(name: String) -> Material:
	match name:
		# --- Exterior -----------------------------------------------------
		"siding_blue":
			return surf(1, Color("4b7aa9"), Color("5a8bbd"), Color("2a4360"), 1.0, 0.8)
		"siding_blue_light":
			return surf(1, Color("7aa3c8"), Color("88b0d3"), Color("3f5f7e"), 1.0, 0.8)
		"siding_teal":
			return surf(1, Color("4f8f93"), Color("5c9fa2"), Color("2b5154"), 1.0, 0.8)
		"siding_raw":
			return surf(17, Color("8a6a4a"), Color("6f5236"), Color("2e2015"), 1.0, 0.9)
		"siding_grey":
			return surf(1, Color("8d9399"), Color("9aa0a6"), Color("4b5054"), 1.0, 0.85)
		"siding_cream":
			return surf(1, Color("e7dcc2"), Color("f0e6cf"), Color("9c8f75"), 1.0, 0.8)
		"siding_yellow":
			return surf(1, Color("d9bf6a"), Color("e3cc7c"), Color("8a7535"), 1.0, 0.8)
		"siding_green":
			return surf(1, Color("7f9f6b"), Color("8dae77"), Color("455a37"), 1.0, 0.8)
		"siding_pink":
			return surf(1, Color("d39c9a"), Color("dfaeac"), Color("8a5654"), 1.0, 0.8)
		"siding_white":
			return surf(1, Color("e9e9e4"), Color("f4f4ef"), Color("9a9a94"), 1.0, 0.8)
		"brick_red":
			return surf(2, Color("9b3f2b"), Color("b8ac9b"), Color("6c2a1c"), 1.0, 0.9)
		"brick_exposed":
			return surf(2, Color("8f4b36"), Color("9c9284"), Color("6a3324"), 1.0, 0.95)
		"brick_grey":
			return surf(2, Color("7b7772"), Color("a29d95"), Color("5a5753"), 1.0, 0.95)
		"trim_white":
			return solid(Color("f1efe7"), 0.55)
		"trim_dark":
			return solid(Color("3a2a1e"), 0.7)
		"roof_red":
			return surf(9, Color("6b2a22"), Color("84392d"), Color("2a0f0b"), 1.0, 0.9)
		"roof_grey":
			return surf(9, Color("4a4e56"), Color("5c6169"), Color("1f2124"), 1.0, 0.9)
		"roof_brown":
			return surf(9, Color("5b4330"), Color("6e523b"), Color("2a1d12"), 1.0, 0.9)
		"roof_green":
			return surf(9, Color("3f5a45"), Color("4c6b52"), Color("1b261d"), 1.0, 0.9)
		"grass":
			return surf(7, Color("4f8a31"), Color("63a23b"), Color("8bb34b"), 1.0, 0.95, {"bump": 0.3})
		"asphalt":
			return surf(8, Color("3a3c3f"), Color("46494d"), Color("bdb8a6"), 1.0, 0.92)
		"concrete":
			return surf(10, Color("b9b6ad"), Color("a6a299"), Color("7c7972"), 1.0, 0.9)
		"curb":
			return surf(16, Color("a9a59c"), Color(), Color(), 1.0, 0.9)
		"dirt":
			return surf(15, Color("5a3e27"), Color("71512f"), Color("2e1f12"), 1.0, 1.0, {"bump": 1.0})
		"road_line":
			return solid(Color("e8d77a"), 0.7)
		"road_white":
			return solid(Color("ecebe5"), 0.7)
		"fence_white":
			return surf(17, Color("f0eee6"), Color("e6e3da"), Color("a8a49b"), 1.0, 0.7)
		"fence_wood":
			return surf(17, Color("7c5a3a"), Color("6a4b2f"), Color("2b1d10"), 1.0, 0.9)
		"wood_post":
			return surf(18, Color("6b4a2c"), Color("5a3c22"), Color(), 1.0, 0.9)
		"track_wood":
			return surf(18, Color("5e4630"), Color("4a3524"), Color(), 1.0, 0.9)
		"rail":
			return solid(Color("6f7378"), 0.35, 0.8)
		# --- Interior walls ---------------------------------------------
		"wp_living_ears":
			return surf(11, Color("3c6aa8"), Color("6d98cf"), Color("23426f"), 1.0, 0.85)
		"wp_kitchen_floral":
			return surf(4, Color("a7c3dc"), Color("e399b3"), Color("5f86ad"), 1.0, 0.85)
		"wp_dining_floral":
			return surf(4, Color("efebe2"), Color("d6ccbd"), Color("b5a58a"), 1.0, 0.85)
		"wp_grave_floral":
			return surf(4, Color("e6a7b6"), Color("f4d2da"), Color("8b4c5c"), 1.0, 0.85)
		"wp_bedroom_stripes":
			return surf(3, Color("bad4e9"), Color("a0c1dd"), Color("7a9ec0"), 1.0, 0.85)
		"wp_hall_damask":
			return surf(20, Color("c9c19a"), Color("b4ab82"), Color("8e865e"), 1.0, 0.85)
		"wp_hall2_stripes":
			return surf(3, Color("c7b79a"), Color("b8a684"), Color("8d7c5c"), 1.0, 0.85)
		"wp_living2_damask":
			return surf(20, Color("b79aa6"), Color("a4848f"), Color("6f5560"), 1.0, 0.85)
		"wp_flooded":
			return surf(20, Color("8aa597"), Color("7b9688"), Color("4f6659"), 1.0, 0.9)
		"wp_dots_green":
			return surf(12, Color("9fbf9a"), Color("d8e6c9"), Color(), 1.0, 0.85)
		"wp_player_beige":
			return surf(3, Color("e6dcc6"), Color("ddd1b8"), Color("c4b79b"), 1.0, 0.85)
		"wp_player_blue":
			return surf(12, Color("9fb9d4"), Color("c4d6e8"), Color(), 1.0, 0.85)
		"plaster_white":
			return surf(16, Color("eeebe3"), Color(), Color(), 1.0, 0.9)
		"plaster_cream":
			return surf(16, Color("ece2c9"), Color(), Color(), 1.0, 0.9)
		"plaster_grey":
			return surf(16, Color("a7a49d"), Color(), Color(), 1.0, 0.9)
		"plaster_dark":
			return surf(16, Color("4a4d50"), Color(), Color(), 1.0, 0.9)
		"panel_wood":
			return surf(17, Color("6d4a2d"), Color("5d3e25"), Color("23160c"), 1.0, 0.75)
		"tiles_white":
			return surf(6, Color("f0eee8"), Color("e3e1db"), Color("b2afa8"), 1.0, 0.35)
		"ceiling_black":
			return solid(Color("1d1c1f"), 0.9)
		"ceiling_white":
			return surf(16, Color("e8e5dd"), Color(), Color(), 1.0, 0.95)
		"ceiling_dark":
			return surf(16, Color("55524d"), Color(), Color(), 1.0, 0.95)
		# --- Floors ------------------------------------------------------
		"floor_polished":
			return surf(5, Color("b2652b"), Color("c97c3a"), Color("3a2010"), 1.0, 0.45)
		"floor_wood_dark":
			return surf(5, Color("6d4529"), Color("845535"), Color("26160b"), 1.0, 0.6)
		"floor_wood_light":
			return surf(5, Color("b88f5f"), Color("c9a271"), Color("5a3f22"), 1.0, 0.6)
		"tiles_kitchen":
			return surf(6, Color("ebe8e0"), Color("86aac2"), Color("9a978f"), 1.0, 0.4)
		"tiles_dining":
			return surf(6, Color("d9c7a5"), Color("c2ab84"), Color("8a7a5e"), 1.0, 0.5)
		"tiles_grey":
			return surf(6, Color("8a8c8e"), Color("7f8183"), Color("5a5c5e"), 1.0, 0.7)
		"tiles_bath":
			return surf(6, Color("f1efe9"), Color("dfe9ee"), Color("b7b5af"), 1.0, 0.35)
		"tiles_boiler":
			return surf(6, Color("9b8b77"), Color("877865"), Color("4c443b"), 1.0, 0.75)
		"carpet_red":
			return surf(16, Color("8e2f2b"), Color(), Color(), 1.0, 1.0)
		"carpet_blue":
			return surf(16, Color("3d4f7a"), Color(), Color(), 1.0, 1.0)
		"carpet_kids":
			return surf(19, Color("e8d26f"), Color("8fc0e0"), Color(), 4.0, 1.0)
		# --- Furniture / props -------------------------------------------
		"wood":
			return surf(18, Color("9a6b40"), Color("7c5330"), Color(), 1.0, 0.65)
		"wood_dark":
			return surf(18, Color("5a3a22"), Color("47301b"), Color(), 1.0, 0.6)
		"wood_light":
			return surf(18, Color("c9a575"), Color("b28c5c"), Color(), 1.0, 0.65)
		"wood_white":
			return solid(Color("ecebe4"), 0.5)
		"fabric_red":
			return surf(16, Color("9b2d2a"), Color(), Color(), 1.0, 1.0)
		"fabric_green":
			return surf(16, Color("4d6e3f"), Color(), Color(), 1.0, 1.0)
		"fabric_brown":
			return surf(16, Color("7a5a3c"), Color(), Color(), 1.0, 1.0)
		"fabric_blue":
			return surf(16, Color("4c6a9a"), Color(), Color(), 1.0, 1.0)
		"fabric_mustard":
			return surf(16, Color("c49a3c"), Color(), Color(), 1.0, 1.0)
		"fabric_white":
			return surf(16, Color("f2efe8"), Color(), Color(), 1.0, 1.0)
		"fabric_pink":
			return surf(16, Color("e5a8c0"), Color(), Color(), 1.0, 1.0)
		"cardboard":
			return surf(16, Color("b88c56"), Color(), Color(), 1.0, 0.95)
		"metal":
			return surf(14, Color("9da3a8"), Color(), Color(), 1.0, 0.35, {"metal": 0.85})
		"metal_dark":
			return surf(14, Color("4a4e53"), Color(), Color(), 1.0, 0.45, {"metal": 0.7})
		"metal_rust":
			return surf(15, Color("7a4a2c"), Color("5d3a25"), Color("3a2a20"), 1.0, 0.8, {"metal": 0.3})
		"chrome":
			return solid(Color("d8dde2"), 0.12, 1.0)
		"copper":
			return solid(Color("c4703c"), 0.3, 0.95)
		"silver":
			return solid(Color("d0d4d8"), 0.2, 1.0)
		"gold":
			return solid(Color("e3b23c"), 0.25, 1.0)
		"black":
			return solid(Color("17181a"), 0.5)
		"white":
			return solid(Color("f4f3ef"), 0.45)
		"red":
			return solid(Color("b8262a"), 0.5)
		"red_toy":
			return solid(Color("c8302c"), 0.35)
		"yellow":
			return solid(Color("e8c33a"), 0.5)
		"green":
			return solid(Color("3f8f46"), 0.5)
		"blue":
			return solid(Color("2f62b5"), 0.5)
		"orange":
			return solid(Color("e07b28"), 0.5)
		"porcelain":
			return solid(Color("f5f5f2"), 0.15)
		"blackboard":
			return surf(16, Color("273a2e"), Color(), Color(), 1.0, 0.9)
		"chalk":
			return solid(Color("e8eadf"), 0.9)
		"paper":
			return solid(Color("f5f1e4"), 0.95)
		"mannequin":
			return solid(Color("e3c9a3"), 0.45)
		"screen_off":
			return solid(Color("101215"), 0.15)
		"rubber":
			return solid(Color("1a1b1e"), 0.9)
		"tire":
			return solid(Color("202124"), 0.95)
		"car_red":
			return solid(Color("a8231f"), 0.3, 0.3)
		"car_yellow":
			return solid(Color("e2b23a"), 0.3, 0.3)
		"car_blue":
			return solid(Color("3b5f8f"), 0.3, 0.3)
		"car_green":
			return solid(Color("4f7a52"), 0.3, 0.3)
		"train_red":
			return solid(Color("c0302a"), 0.35, 0.25)
		"train_black":
			return solid(Color("1e1f22"), 0.45, 0.5)
		"leaves":
			return surf(15, Color("2f6b2a"), Color("3f7f31"), Color("1d4a1c"), 0.6, 0.9, {"bump": 0.8})
		"leaves_dark":
			return surf(15, Color("27552a"), Color("336633"), Color("173c19"), 0.6, 0.9, {"bump": 0.8})
		"bark":
			return surf(17, Color("5a4330"), Color("4a3626"), Color("2a1e14"), 0.5, 0.95)
		"hedge":
			return surf(15, Color("2f5f27"), Color("3d732f"), Color("1b3d17"), 0.5, 0.95, {"bump": 1.0})
		"water_ice":
			var ice := StandardMaterial3D.new()
			ice.albedo_color = Color(0.78, 0.92, 0.98, 0.9)
			ice.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			ice.roughness = 0.12
			ice.metallic = 0.1
			return ice
		"glass":
			return glass()
		"glass_dark":
			return glass(Color(0.12, 0.16, 0.2, 0.75))
		"lamp_on":
			return emissive(Color(1.0, 0.86, 0.6), 3.0)
		"lamp_off":
			return solid(Color("d9d2c0"), 0.4)
		"red_light":
			return emissive(Color(1.0, 0.1, 0.08), 4.0)
		"green_light":
			return emissive(Color(0.2, 1.0, 0.3), 3.0)
		"screen_glow":
			return emissive(Color(0.55, 0.75, 0.9), 1.2)
		"window_lit":
			return emissive(Color(1.0, 0.82, 0.5), 1.2)
		"bright_light":
			return emissive(Color(1.0, 0.98, 0.9), 12.0)
		"string_bulb":
			return emissive(Color(1.0, 0.75, 0.35), 5.0)
		"carnival_red":
			return surf(21, Color("c62f2f"), Color("f1ece2"), Color(), 1.0, 0.8)
		"carnival_blue":
			return surf(21, Color("2f5fc6"), Color("f2d64a"), Color(), 1.0, 0.8)
		# --- The Neighbor ------------------------------------------------
		"n_skin":
			return solid(Color("e6b08f"), 0.6, 0.0, true)
		"n_nose":
			return solid(Color("d9806b"), 0.55, 0.0, true)
		"n_hair":
			return surf(18, Color("4d2d1f"), Color("3c2318"), Color(), 0.3, 0.8, {"use_local": true})
		"n_hair_grey":
			return solid(Color("7d7068"), 0.8, 0.0, true)
		"n_mustache":
			return surf(18, Color("3a2016"), Color("2c170f"), Color(), 0.2, 0.9, {"use_local": true})
		"n_vest":
			return surf(13, Color("2d5a99"), Color("4f84c9"), Color("f1f1ee"), 1.0, 0.95, {"use_local": true, "bump": 0.4})
		"n_vest_edge":
			return solid(Color("1e3a66"), 0.95, 0.0, true)
		"n_shirt":
			return solid(Color("ead98e"), 0.85, 0.0, true)
		"n_glove":
			return solid(Color("1c2232"), 0.35, 0.0, true)
		"n_pants":
			return solid(Color("24314f"), 0.9, 0.0, true)
		"n_shoe":
			return solid(Color("5b3a22"), 0.6, 0.0, true)
		"n_lace":
			return solid(Color("f2f2ee"), 0.8, 0.0, true)
		"n_eye":
			return solid(Color("f6f4ee"), 0.25, 0.0, true)
		"n_iris":
			return solid(Color("3d8a4a"), 0.25, 0.0, true)
		"n_pupil":
			return solid(Color("0d0d0d"), 0.2, 0.0, true)
		"n_brow":
			return solid(Color("2b1a12"), 0.9, 0.0, true)
		"n_sack":
			return surf(16, Color("b49a6a"), Color(), Color(), 1.0, 1.0, {"use_local": true})
	push_warning("Unknown material: " + name)
	return solid(Color(1, 0, 1))
