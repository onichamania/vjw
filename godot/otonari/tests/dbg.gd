extends SceneTree
func _initialize() -> void:
	var g = load("res://main.tscn").instantiate()
	root.add_child(g)
	while not g.BOOTED:
		await process_frame
	for n in ["monitor", "landscape", "exit"]:
		var m: StandardMaterial3D = g.MATS[n]
		print(n, " emis=", m.emission_enabled, " col=", m.emission, " e=", m.emission_energy_multiplier, " etex=", m.emission_texture, " alb=", m.albedo_texture, " op=", m.emission_operator)
		var img: Image = m.emission_texture.get_image()
		print("  img ", img.get_size(), " fmt ", img.get_format(), " px(10,10)=", img.get_pixel(10, 10))
	quit()
