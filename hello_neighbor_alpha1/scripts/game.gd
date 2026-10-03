extends Node
## Global state, input map, audio manager and the noise/alert system.

signal power_changed(on: bool)
signal water_changed(frozen: bool)
signal noise_made(pos: Vector3, radius: float, kind: String)
signal alert(pos: Vector3, kind: String)

enum Mode { MENU, CUTSCENE, PLAYING, PAUSED }

# Physics layers (bit values)
const L_WORLD := 1
const L_PLAYER := 2
const L_NEIGHBOR := 4
const L_ITEM := 8
const L_DOOR := 16
const L_GLASS := 32
const L_USE := 64
const L_BARRIER := 128

var mode: int = Mode.MENU
var power_on := true
var water_frozen := false
var cameras_disabled := false
var captures := 0
var sleeps := 0
var tutorial_done := false
var game_time := 0.0

var settings := {
	"sens": 0.0022,
	"music": 0.75,
	"sfx": 1.0,
	"fov": 80.0,
	"hints": true,
	"invert_y": false,
	"quality": 1,
}

var main: Node
var player: Node
var neighbor: Node
var hud: Node
var house: Node
var player_house: Node

var _music_a: AudioStreamPlayer
var _music_b: AudioStreamPlayer
var _amb: AudioStreamPlayer
var _sfx_pool: Array[AudioStreamPlayer] = []
var _streams := {}
var current_music := ""
var current_amb := ""
var _music_tween: Tween


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_setup_input()
	_setup_buses()
	_load_settings()
	_music_a = _mk_player("Music")
	_music_b = _mk_player("Music")
	_amb = _mk_player("Ambience")
	for i in 10:
		_sfx_pool.append(_mk_player("SFX"))


func reset_state() -> void:
	power_on = true
	water_frozen = false
	cameras_disabled = false
	captures = 0
	sleeps = 0
	tutorial_done = false
	game_time = 0.0


func _process(delta: float) -> void:
	if mode == Mode.PLAYING:
		game_time += delta


# ---------------------------------------------------------------- input ----
func _setup_input() -> void:
	_key("move_forward", [KEY_W, KEY_UP])
	_key("move_back", [KEY_S, KEY_DOWN])
	_key("move_left", [KEY_A, KEY_LEFT])
	_key("move_right", [KEY_D, KEY_RIGHT])
	_key("jump", [KEY_SPACE])
	_key("sprint", [KEY_SHIFT])
	_key("crouch", [KEY_CTRL, KEY_C])
	_key("interact", [KEY_E, KEY_F])
	_key("drop", [KEY_Q])
	_key("pause", [KEY_ESCAPE, KEY_P])
	_key("slot_1", [KEY_1])
	_key("slot_2", [KEY_2])
	_key("slot_3", [KEY_3])
	_key("slot_4", [KEY_4])
	_key("skip", [KEY_ENTER, KEY_SPACE])
	_key("hint", [KEY_H])
	_mouse("use", MOUSE_BUTTON_LEFT)
	_mouse("throw", MOUSE_BUTTON_RIGHT)
	_mouse("prev_slot", MOUSE_BUTTON_WHEEL_UP)
	_mouse("next_slot", MOUSE_BUTTON_WHEEL_DOWN)


func _key(action: String, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for k in keys:
		var ev := InputEventKey.new()
		ev.physical_keycode = k
		InputMap.action_add_event(action, ev)


func _mouse(action: String, button: int) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	var ev := InputEventMouseButton.new()
	ev.button_index = button
	InputMap.action_add_event(action, ev)


# ----------------------------------------------------------------- audio ---
func _setup_buses() -> void:
	for bus_name: String in ["Music", "SFX", "Ambience"]:
		if AudioServer.get_bus_index(bus_name) == -1:
			AudioServer.add_bus()
			var idx := AudioServer.bus_count - 1
			AudioServer.set_bus_name(idx, bus_name)
			AudioServer.set_bus_send(idx, "Master")


func apply_volumes() -> void:
	var mi := AudioServer.get_bus_index("Music")
	var si := AudioServer.get_bus_index("SFX")
	var ai := AudioServer.get_bus_index("Ambience")
	AudioServer.set_bus_volume_db(mi, linear_to_db(maxf(settings.music, 0.0001)))
	AudioServer.set_bus_volume_db(si, linear_to_db(maxf(settings.sfx, 0.0001)))
	AudioServer.set_bus_volume_db(ai, linear_to_db(maxf(settings.sfx * 0.9, 0.0001)))


func _mk_player(bus: String) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.bus = bus
	add_child(p)
	return p


func stream(path: String) -> AudioStream:
	if _streams.has(path):
		return _streams[path]
	var full := "res://audio/%s.ogg" % path
	var s: AudioStream = null
	if ResourceLoader.exists(full):
		s = load(full)
	_streams[path] = s
	return s


func play_music(track: String, fade := 1.2, loop := true) -> void:
	if track == current_music:
		return
	current_music = track
	if _music_tween and _music_tween.is_valid():
		_music_tween.kill()
	var old := _music_a
	_music_a = _music_b
	_music_b = old
	if _music_b.playing:
		_music_tween = create_tween()
		_music_tween.tween_property(_music_b, "volume_db", -60.0, maxf(fade, 0.05))
		_music_tween.tween_callback(_music_b.stop)
	if track == "":
		return
	var s := stream("music/" + track)
	if s == null:
		return
	if s is AudioStreamOggVorbis:
		(s as AudioStreamOggVorbis).loop = loop
	_music_a.stream = s
	_music_a.volume_db = -50.0 if fade > 0.05 else 0.0
	_music_a.play()
	if fade > 0.05:
		create_tween().tween_property(_music_a, "volume_db", 0.0, fade * 0.7)


func stop_music(fade := 1.5) -> void:
	play_music("", fade)


func play_ambience(track: String) -> void:
	if track == current_amb:
		return
	current_amb = track
	if track == "":
		_amb.stop()
		return
	var s := stream("sfx/" + track)
	if s is AudioStreamOggVorbis:
		(s as AudioStreamOggVorbis).loop = true
	_amb.stream = s
	_amb.volume_db = -6.0
	_amb.play()


## Non-positional sound.
func sfx(name: String, vol_db := 0.0, pitch := 1.0) -> void:
	var s := stream("sfx/" + name)
	if s == null:
		return
	for p in _sfx_pool:
		if not p.playing:
			p.stream = s
			p.volume_db = vol_db
			p.pitch_scale = pitch
			p.play()
			return
	_sfx_pool[0].stream = s
	_sfx_pool[0].play()


## Positional sound at a world position.
func sfx3d(name: String, pos: Vector3, vol_db := 0.0, pitch := 1.0, max_dist := 40.0) -> AudioStreamPlayer3D:
	var s := stream("sfx/" + name)
	if s == null or main == null:
		return null
	var p := AudioStreamPlayer3D.new()
	p.stream = s
	p.bus = "SFX"
	p.volume_db = vol_db
	p.pitch_scale = pitch
	p.max_distance = max_dist
	p.unit_size = 4.0
	p.attenuation_filter_cutoff_hz = 9000.0
	main.add_child(p)
	p.global_position = pos
	p.play()
	p.finished.connect(p.queue_free)
	return p


## Looping positional emitter attached to a node.
func loop3d(name: String, parent: Node3D, vol_db := 0.0, max_dist := 30.0) -> AudioStreamPlayer3D:
	var s := stream("sfx/" + name)
	var p := AudioStreamPlayer3D.new()
	if s is AudioStreamOggVorbis:
		s = (s as AudioStreamOggVorbis).duplicate()
		(s as AudioStreamOggVorbis).loop = true
	p.stream = s
	p.bus = "SFX"
	p.volume_db = vol_db
	p.max_distance = max_dist
	p.unit_size = 3.0
	parent.add_child(p)
	return p


# ----------------------------------------------------------------- noise ---
## Something audible happened. The Neighbor and the security cameras listen.
func make_noise(pos: Vector3, radius: float, kind := "generic") -> void:
	noise_made.emit(pos, radius, kind)


func raise_alert(pos: Vector3, kind := "camera") -> void:
	alert.emit(pos, kind)


func set_power(on: bool) -> void:
	if power_on == on:
		return
	power_on = on
	power_changed.emit(on)


func set_frozen(f: bool) -> void:
	if water_frozen == f:
		return
	water_frozen = f
	water_changed.emit(f)


func message(text: String, dur := 3.0) -> void:
	if hud:
		hud.show_message(text, dur)


func hint(text: String, dur := 4.0) -> void:
	if hud and settings.hints:
		hud.show_message(text, dur)


# -------------------------------------------------------------- settings ---
func save_settings() -> void:
	var cf := ConfigFile.new()
	for k in settings:
		cf.set_value("settings", k, settings[k])
	cf.save("user://settings.cfg")


func _load_settings() -> void:
	var cf := ConfigFile.new()
	if cf.load("user://settings.cfg") == OK:
		for k in settings:
			settings[k] = cf.get_value("settings", k, settings[k])
	apply_volumes()
