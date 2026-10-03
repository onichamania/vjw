extends Node
## Screenshot tour (needs a display / xvfb):
##   godot --path . -- --shots
## Saves PNGs to user://shots/ (or the folder given with --shotdir=PATH).

var main: Node
var outdir := "user://shots"


func _ready() -> void:
	main = get_parent()
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--shotdir="):
			outdir = a.substr(10)
	DirAccess.make_dir_recursive_absolute(outdir)
	_run()


func secs(t: float) -> void:
	await get_tree().create_timer(t).timeout


func shot(name: String) -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	img.save_png(outdir.path_join(name + ".png"))
	print("shot ", name)


func cam(pos: Vector3, look: Vector3) -> void:
	var c: Camera3D = main.cut_cam
	c.current = true
	c.global_position = pos
	c.look_at(look)


func _run() -> void:
	var h: NeighborHouse = main.house
	var n: Neighbor = main.neighbor
	main.hud.show_title(false)
	main.hud.set_game_hud_visible(false)
	main._orbit = false
	Game.mode = Game.Mode.CUTSCENE
	main.hud.set_fade(Color(0, 0, 0, 0))
	await secs(1.5)
	# Exterior views
	cam(Vector3(-2, 2.0, 9.0), Vector3(0, 6.0, -20))
	await shot("01_house_from_street")
	cam(Vector3(26, 14, 6), Vector3(0, 6, -21))
	await shot("02_house_aerial")
	cam(Vector3(-24, 6, -48), Vector3(0, 5, -22))
	await shot("03_house_back")
	cam(Vector3(10, 2.0, -8), Vector3(-8, 2.0, 16))
	await shot("04_player_house")
	# Neighbor close-up in the living room
	n.state = Neighbor.S.SCRIPTED
	n.global_position = h.gpos(Vector3(15.0, 0.31, 3.0))
	n.rotation.y = h.global_rotation.y
	n.script_anim("idle")
	cam(h.gpos(Vector3(15.0, 1.7, 5.4)), h.gpos(Vector3(15.0, 1.25, 3.0)))
	await secs(0.5)
	await shot("05_neighbor_closeup")
	n.script_anim("run")
	n.scripted_speed = 0.0
	cam(h.gpos(Vector3(13.4, 1.4, 6.6)), h.gpos(Vector3(15.0, 1.1, 3.0)))
	await secs(0.4)
	await shot("06_neighbor_living_room")
	# Interiors
	n.global_position = h.gpos(Vector3(3.5, 0.31, 3.5))
	cam(h.gpos(Vector3(13.0, 1.7, 3.0)), h.gpos(Vector3(17.0, 1.4, 7.8)))
	await shot("07_stairs_basement_door")
	cam(h.gpos(Vector3(6.2, 1.7, 6.0)), h.gpos(Vector3(1.5, 1.0, 2.0)))
	await shot("08_kitchen")
	cam(h.gpos(Vector3(6.4, 1.7, 12.6)), h.gpos(Vector3(3.0, 0.4, 16.0)))
	await shot("09_grave_room")
	cam(h.gpos(Vector3(19.4, 5.9, 8.8)), h.gpos(Vector3(15.5, 4.2, 3.0)))
	await shot("10_flooded_room")
	cam(h.gpos(Vector3(8.6, 1.6 + 4.3, 1.2)), h.gpos(Vector3(1.0, 5.0, 2.2)))
	await shot("11_rifle_range")
	cam(h.gpos(Vector3(12.4, 1.7 + 4.3, 8.4)), h.gpos(Vector3(5.2, 5.5, 6.0)))
	await shot("12_classroom")
	cam(h.gpos(Vector3(8.3, 1.7 + 4.3, 17.4)), h.gpos(Vector3(3.0, 4.6, 14.0)))
	await shot("13_children_room")
	cam(h.gpos(Vector3(21.0, 1.7, 4.0)), h.gpos(Vector3(23.4, 1.0, 7.0)))
	await shot("14_garage")
	cam(h.gpos(Vector3(19.0, 1.7, 14.2)), h.gpos(Vector3(22.5, 1.2, 16.0)))
	await shot("15_boiler_room")
	cam(h.gpos(Vector3(12.5, 1.6, 12.5)), h.gpos(Vector3(16.0, 0.8, 16.8)))
	await shot("16_bedroom")
	# HUD in play
	main.player.teleport(Transform3D(Basis(Vector3.UP, PI), Vector3(0, 0.1, 3.0)))
	main.player.cam.current = true
	main.hud.set_game_hud_visible(true)
	main.hud.set_objective("目標：お隣さんの家の地下室に入る")
	main.hud.show_message("お隣さんの地下室には何がある？", 5.0)
	await secs(0.6)
	await shot("17_gameplay_hud")
	# Carnival & grave
	main.special.set_active("carnival")
	main.set_night(true)
	cam(main.special.carnival.to_global(Vector3(0, 1.7, 6.5)), main.special.carnival.to_global(Vector3(0, 1.5, -5)))
	n.direct = true
	n.global_position = main.special.carnival.to_global(Vector3(0, 0.05, -2.5))
	n.rotation.y = 0.0
	n.model.set_sack(true)
	n.script_anim("idle")
	await secs(0.4)
	await shot("18_carnival")
	main.special.set_active("grave")
	cam(main.special.grave_cam.global_position, main.special.grave_neighbor.global_position + Vector3(0, 1.8, 0))
	n.model.set_sack(false)
	n.global_position = main.special.grave_neighbor.global_position
	n.rotation.y = PI
	n.script_anim("grab")
	await secs(0.4)
	await shot("19_grave")
	main.special.set_active("")
	main.set_night(false)
	# Title screen
	main.hud.set_game_hud_visible(false)
	main._show_menu()
	await secs(2.0)
	await shot("20_title")
	get_tree().quit()
