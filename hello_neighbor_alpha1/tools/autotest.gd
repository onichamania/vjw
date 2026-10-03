extends Node
## Automated smoke test. Run headless:
##   godot --headless --path . --fixed-fps 60 -- --autotest
## Checks navigation reachability, both puzzle routes, the Neighbor's AI
## (spot -> chase -> lose / catch) and the ending.

var main: Node
var fails := 0
var player: Player
var h: NeighborHouse
var n: Neighbor


func ok(cond: bool, msg: String) -> void:
	print(("  PASS  " if cond else "  FAIL  ") + msg)
	if not cond:
		fails += 1


func _ready() -> void:
	main = get_parent()
	process_mode = Node.PROCESS_MODE_ALWAYS
	_run()


func frames(c: int) -> void:
	for i in c:
		await get_tree().physics_frame


func secs(t: float) -> void:
	await get_tree().create_timer(t).timeout


func find_item(id: String) -> Item:
	for it in get_tree().get_nodes_in_group("items"):
		if it is Item and it.item_id == id and it.is_inside_tree():
			return it
	return null


func find_usable(substr: String) -> Usable:
	for u in main.find_children("*", "Usable", true, false):
		var pr: String = (u as Usable).get_prompt(player)
		if substr in pr:
			return u
	return null


func give(id: String) -> bool:
	var it := find_item(id)
	if it == null:
		print("    (item not found: %s)" % id)
		return false
	it.pickable = true
	player.pick_up(it)
	return player.held_id() == id


func use(substr: String) -> bool:
	var u := find_usable(substr)
	if u == null:
		print("    (usable not found: %s)" % substr)
		return false
	u.interact(player)
	return true


## Make the Neighbor stand still at `local`, looking along `dir` (house coords).
func stand_neighbor(local: Vector3, dir: Vector3) -> void:
	n.reset_to(h.gpos(local))
	n.state = Neighbor.S.ROUTINE
	var d: Vector3 = h.global_basis * dir
	n.activity = {"anim": "stand", "pos": h.gpos(local), "dir": d, "dur": 30.0, "w": 1.0}
	n.at_activity = true
	n.act_timer = 30.0
	n.rotation.y = atan2(d.x, d.z)


func put_player(local: Vector3) -> void:
	player.global_position = h.gpos(local)
	player.velocity = Vector3.ZERO


func _run() -> void:
	player = main.player
	h = main.house
	n = main.neighbor
	print("== AUTOTEST ==")
	var t := 0
	while not main.nav_baked and t < 1200:
		await frames(1)
		t += 1
	ok(main.nav_baked, "navigation baked")
	var map: RID = main.get_world_3d().navigation_map
	t = 0
	while t < 240 and NavigationServer3D.map_get_path(map, h.gpos(Vector3(15, 0.3, 4)), h.gpos(Vector3(3.5, 0.3, 3)), true).size() == 0:
		await frames(1)
		t += 1
	_test_paths()
	# start game without intro
	Game.reset_state()
	Game.set_meta("session_used", true)
	main.hud.show_title(false)
	main._orbit = false
	main.neighbor.script_mode(false)
	main.neighbor.reset_to(main.neighbor.home_spot)
	main.neighbor.state = Neighbor.S.IDLE
	main._start_play_in_bed("")
	await secs(2.0)
	ok(Game.mode == Game.Mode.PLAYING, "game is playing after wake-up")
	if "--routineonly" in OS.get_cmdline_user_args():
		await _test_ai()
		get_tree().quit()
		return
	if "--pathsonly" in OS.get_cmdline_user_args():
		get_tree().quit()
		return
	await _test_movement()
	await _test_puzzles_copper()
	await _test_ai()
	await _test_ending()
	print("== AUTOTEST DONE: %d failure(s) ==" % fails)
	get_tree().quit(1 if fails > 0 else 0)


func _test_paths() -> void:
	var map: RID = main.get_world_3d().navigation_map
	var from: Vector3 = h.gpos(Vector3(15, 0.3, 4))
	var pts := {
		"kitchen": Vector3(3.5, 0.3, 3), "dining": Vector3(3.5, 0.3, 11), "grave": Vector3(1.5, 0.3, 13),
		"boiler": Vector3(20, 0.3, 16), "garage": Vector3(21, 0.3, 5), "bedroom": Vector3(13, 0.3, 13),
		"bath1": Vector3(20, 0.3, 11.5), "landing2": Vector3(19.5, 4.3, 8), "pool": Vector3(18, 3.5, 3),
		"c1": Vector3(11, 4.3, 2), "rifle": Vector3(8, 4.3, 2), "classroom": Vector3(11.6, 4.3, 6.5),
		"hall2": Vector3(10, 4.3, 13), "living2": Vector3(16, 4.3, 15), "cctv": Vector3(22.5, 4.3, 12),
		"bath2": Vector3(22.5, 4.3, 16), "front_yard": Vector3(9, 0, -4), "backyard": Vector3(14, 0, 23),
	}
	for k in pts:
		var to: Vector3 = h.gpos(pts[k])
		var path := NavigationServer3D.map_get_path(map, from, to, true)
		var reach := path.size() > 0 and path[path.size() - 1].distance_to(to) < 1.2
		var length := 0.0
		for i in range(1, path.size()):
			length += path[i - 1].distance_to(path[i])
		ok(reach, "nav path living room -> %s (%.1f m)" % [k, length])
		if not reach and path.size() > 0:
			print("      ends at ", h.to_local(path[path.size() - 1]), "  closest to target: ", h.to_local(NavigationServer3D.map_get_closest_point(map, to)))
	var street := NavigationServer3D.map_get_path(map, from, Vector3(0, 0, 0), true)
	ok(street.size() > 0 and street[street.size() - 1].distance_to(Vector3(0, 0, 0)) < 1.2, "nav path to the street")
	var ph := NavigationServer3D.map_get_path(map, from, Vector3(0, 0.3, 14.0), true)
	ok(ph.size() > 0 and ph[ph.size() - 1].distance_to(Vector3(0, 0.3, 14.0)) < 1.2, "nav path into the player's house")


func _test_movement() -> void:
	# Walk up the living room stairs into the flooded room.
	n.state = Neighbor.S.IDLE
	n.global_position = h.gpos(Vector3(3.5, 0.35, 3.5))
	put_player(Vector3(12.6, 0.35, 8.6))
	var fwd: Vector3 = h.global_basis * Vector3(1, 0, 0)
	player.set_look(atan2(-fwd.x, -fwd.z), 0.0)
	await frames(5)
	Input.action_press("move_forward")
	await secs(2.6)
	Input.action_release("move_forward")
	await secs(0.5)
	var lp := h.to_local(player.global_position)
	ok(lp.y > 4.0, "player climbs the stairs (y=%.2f, x=%.2f)" % [lp.y, lp.x])
	# Water: player wading -> the Sharkotron throws them out.
	put_player(Vector3(17.5, 3.6, 5.5))
	await secs(4.0)
	lp = h.to_local(player.global_position)
	ok(lp.z < -1.0, "Sharkotron ejects the player from the house (z=%.1f)" % lp.z)
	await secs(2.0)
	ok(Game.mode == Game.Mode.PLAYING, "playing again after ejection")


func _test_puzzles_copper() -> void:
	var pz: HousePuzzles = h.puzzles
	# Valve freezes the water
	put_player(Vector3(20.8, 0.35, 15.4))
	await frames(3)
	ok(use("バルブを回す"), "valve usable found")
	await frames(2)
	ok(Game.water_frozen, "water frozen by the valve")
	# Walk onto the ice
	put_player(Vector3(17.0, 4.6, 3.0))
	await secs(1.0)
	ok(h.to_local(player.global_position).y > 4.1, "player stands on the ice")
	# Bell -> pole -> shovel
	ok(give("bell"), "picked the bell")
	put_player(Vector3(5.5, 0.35, 15.6))
	await frames(3)
	ok(use("ベルを掛ける"), "bell placed on pole")
	await secs(3.0)
	ok(pz.shovel.pickable, "compartment opened, shovel available")
	ok(give("shovel"), "picked the shovel")
	for i in 3:
		ok(use("シャベルで掘る"), "dig %d" % (i + 1))
		await frames(3)
	await frames(5)
	ok(use("棺のフタを開ける"), "coffin lid opened")
	await secs(1.0)
	player.select_slot((player.slot + 1) % 4)
	ok(give("teacher"), "picked the mannequin teacher")
	put_player(Vector3(7.0, 4.35, 5.5))
	await frames(3)
	ok(use("先生のマネキンを立てる"), "teacher placed")
	ok(pz.teacher_placed, "teacher_placed flag")
	# Drawers & magnets
	while use("引き出しを開ける"):
		await secs(0.4)
	for num in [5, 7, 4]:
		player.select_slot((player.slot + 1) % 4)
		ok(give("magnet_%d" % num), "picked magnet %d" % num)
		var placed := false
		for s in pz.slots:
			if s.item == null and s.answer == num:
				s.use.interact(player)
				placed = true
				break
		ok(placed, "placed magnet %d" % num)
		await frames(2)
	ok(pz.class_solved, "math puzzle solved")
	await secs(1.0)
	player.select_slot((player.slot + 1) % 4)
	ok(give("toy_rifle"), "picked the toy rifle")
	# Rifle range
	put_player(Vector3(7.6, 4.35, 1.5))
	await frames(3)
	ok(use("ライフルを台に置く"), "rifle placed on the stand")
	ok(pz.range_active, "range active (power on)")
	await frames(3)
	ok(use("ライフルを取る"), "rifle taken back")
	for i in 3:
		await secs(0.5)
		pz.targets[i].on_shot(player)
	await secs(2.0)
	ok(pz.key_given, "score 300 -> prize")
	var key := find_item("silver_key")
	ok(key != null, "silver key dropped")
	if key:
		ok(h.to_local(key.global_position).y > 4.0, "silver key landed on the 2F floor (y=%.2f)" % h.to_local(key.global_position).y)
	player.select_slot((player.slot + 1) % 4)
	ok(give("silver_key"), "picked silver key")
	put_player(Vector3(7.4, 4.35, 3.2))
	await frames(3)
	ok(use("銀の鍵で開ける"), "gate unlocked")
	ok(not pz.gate_locked, "gate open")
	# Jackhammer through the bricks
	player.select_slot((player.slot + 1) % 4)
	if player.held_item():
		player.throw_held(-1.0)
	ok(give("jackhammer"), "picked jackhammer")
	put_player(Vector3(1.95, 4.35, 10.8))
	await frames(3)
	for i in 3:
		ok(use("削岩機でレンガを壊す"), "jackhammer %d" % (i + 1))
		await frames(3)
	ok(not is_instance_valid(pz.brick_wall), "brick wall destroyed")
	player.throw_held(-1.0)
	ok(give("copper_key"), "picked copper heart key")
	# Basement door
	player.select_slot((player.slot + 1) % 4)
	if player.held_item():
		player.throw_held(-1.0)
	ok(give("hammer"), "picked hammer")
	put_player(Vector3(17.1, 0.35, 6.6))
	await frames(3)
	for i in 3:
		ok(use("板をはがす"), "board %d removed" % (i + 1))
		await frames(2)
	for i in 4:
		if player.held_id() == "copper_key":
			break
		player.select_slot((player.slot + 1) % 4)
	ok(use("銅のハートの鍵で開ける"), "copper lock opened")
	await secs(1.0)
	ok(pz.lock_open and pz._basement_ready(), "basement door ready")


func _test_ai() -> void:
	Game.set_power(true)
	# Let him live his routine for a while (player safe at home).
	player.global_position = Vector3(-3.0, 0.4, 17.5)
	main.phouse.front_door.close()
	main.phouse.bedroom_door.close()
	n.reset_to(n.home_spot)
	n.state = Neighbor.S.ROUTINE
	var seen := {}
	var last := n.global_position
	var idle_samples := 0
	for i in 240:
		await secs(1.0)
		if n.at_activity:
			seen[str(n.activity.get("anim", "?")) + "@" + str(Vector3i(n.activity.pos))] = true
		if i % 5 != 4:
			continue
		if "--verbose" in OS.get_cmdline_user_args():
			print("      t=%3d st=%d at=%s act=%s pos=%s" % [i, n.state, str(n.at_activity), str(n.activity.get("anim", "")) + str(Vector3i(h.to_local(n.activity.get("pos", Vector3.ZERO)))), str(Vector3i(h.to_local(n.global_position)))])
		var moved := n.global_position.distance_to(last)
		if moved < 0.3 and not n.at_activity and n.state == Neighbor.S.ROUTINE:
			idle_samples += 1
		last = n.global_position
	print("    routine activities reached: %d -> %s" % [seen.size(), str(seen.keys())])
	ok(seen.size() >= 4, "Neighbor walks around his routine (%d spots in 4 min)" % seen.size())
	ok(idle_samples <= 4, "Neighbor rarely gets stuck (%d stuck samples)" % idle_samples)
	# Put the Neighbor in his routine and stand in front of him.
	n.reset_to(h.gpos(Vector3(15.0, 0.35, 3.0)))
	n.state = Neighbor.S.ROUTINE
	n.activity = {"anim": "look", "pos": h.gpos(Vector3(15.0, 0.3, 3.0)), "dir": h.global_basis * Vector3(0, 0, -1), "dur": 30.0, "w": 1.0}
	n.at_activity = true
	n.act_timer = 30.0
	n.rotation.y = h.global_rotation.y + PI
	put_player(Vector3(15.0, 0.35, 7.0))
	await secs(1.5)
	ok(n.state == Neighbor.S.ROUTINE, "not noticed while behind his back (state=%d)" % n.state)
	n.rotation.y = h.global_rotation.y
	await secs(1.0)
	ok(n.state == Neighbor.S.CHASE, "Neighbor spots the player and chases (state=%d)" % n.state)
	ok(main.chasing, "chase music/flag on")
	# Run away: teleport far into the player's house and shut the door.
	player.global_position = Vector3(0, 0.4, 14.5)
	main.phouse.front_door.close()
	await secs(12.0)
	ok(n.state != Neighbor.S.CHASE, "Neighbor loses the player (state=%d)" % n.state)
	ok(not main.chasing, "chase ended")
	await secs(10.0)
	var cams := get_tree().get_nodes_in_group("security_cams").size()
	print("    cameras placed: %d" % cams)
	# Catch
	var caps := Game.captures
	stand_neighbor(Vector3(9.0, 0.35, 6.0), Vector3(0, 0, 1))
	put_player(Vector3(9.0, 0.35, 8.0))
	await secs(0.5)
	print("    catch test: state=%d mode=%d sees=%s hidden=%s" % [n.state, Game.mode, str(n.can_see_player()), str(player.hidden_in)])
	await secs(3.5)
	ok(Game.captures == caps + 1, "Neighbor catches the player (captures=%d)" % Game.captures)
	await secs(4.0)
	ok(main.phouse.contains(player.global_position), "player wakes up in their own house")
	ok(n.run_speed() > 3.45, "Neighbor got faster (%.2f m/s)" % n.run_speed())
	# Second catch triggers the carnival nightmare.
	stand_neighbor(Vector3(9.0, 0.35, 6.0), Vector3(0, 0, 1))
	put_player(Vector3(9.0, 0.35, 8.0))
	await secs(0.5)
	print("    catch2: state=%d mode=%d busy=%s sees=%s ctrl=%s" % [n.state, Game.mode, str(main.busy), str(n.can_see_player()), str(player.controls)])
	await secs(3.5)
	print("    after 2nd catch attempt: captures=%d state=%d mode=%d dist=%.1f" % [Game.captures, n.state, Game.mode, n.global_position.distance_to(player.global_position)])
	ok(Game.tutorial_done, "carnival nightmare started after the 2nd capture")
	await secs(3.0)
	var sp: SpecialAreas = main.special
	if player.hidden_in == null:
		sp.carn_wardrobe.interact(player)
	await secs(1.0)
	ok(player.hidden_in != null, "player hides in the carnival wardrobe")
	await secs(30.0)
	ok(main.phouse.contains(player.global_position) and Game.mode == Game.Mode.PLAYING, "back home after the nightmare")


func _test_ending() -> void:
	var pz: HousePuzzles = h.puzzles
	n.reset_to(n.home_spot)
	put_player(Vector3(17.1, 0.35, 6.6))
	await frames(3)
	ok(pz._basement_ready(), "still ready for the ending")
	main.start_ending()
	await secs(22.0)
	ok(main.hud.credits.visible, "ending reached the credits")
