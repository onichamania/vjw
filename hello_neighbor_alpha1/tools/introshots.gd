extends Node
## Captures frames of the intro cut-scene:  godot --path . -- --introshots --shotdir=PATH
var outdir := "user://shots"

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--shotdir="):
			outdir = a.substr(10)
	DirAccess.make_dir_recursive_absolute(outdir)
	_run()

func _run() -> void:
	var main := get_parent()
	await get_tree().create_timer(1.0).timeout
	main._on_new_game()
	var t := 0.0
	var marks := [1.5, 5.0, 8.5, 10.5, 12.5, 14.0, 17.5, 20.5, 24.0, 28.0]
	var i := 0
	while i < marks.size():
		await get_tree().process_frame
		t += get_process_delta_time()
		if t >= marks[i]:
			await RenderingServer.frame_post_draw
			get_viewport().get_texture().get_image().save_png(outdir.path_join("intro_%02d.png" % i))
			print("intro frame ", i, " t=", t, " mode=", Game.mode)
			i += 1
	print("final mode ", Game.mode, " player in house ", main.phouse.contains(main.player.global_position))
	# pause menu
	main._pause()
	await get_tree().create_timer(0.3).timeout
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(outdir.path_join("pause.png"))
	main.hud._show_panel(main.hud.controls_panel)
	await get_tree().create_timer(0.3).timeout
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(outdir.path_join("controls.png"))
	get_tree().quit()
