class_name TouchControls
extends Control
## On-screen controls for phones / tablets (browser build).
## Appears after the first touch. Left: move stick. Right side: drag to look,
## buttons for use / throw / jump / crouch / run / drop / next item / pause.

const STICK_R := 74.0

var stick_center := Vector2.ZERO
var stick_vec := Vector2.ZERO
var stick_index := -1
var look_index := -1
var look_last := Vector2.ZERO
var buttons: Array = []          # [{rect, label, action, toggle, held_index, on}]
var crouch_on := false
var run_on := false
var enabled := false


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	visible = false


func activate() -> void:
	if enabled:
		return
	enabled = true
	Game.touch_mode = true
	# A tap anywhere must not count as a left click ("use").
	for ev in InputMap.action_get_events("use"):
		if ev is InputEventMouseButton:
			InputMap.action_erase_event("use", ev)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _layout() -> void:
	var s := size
	var r := 46.0 * _ui_scale()
	stick_center = Vector2(150, s.y - 150) * Vector2(1, 1)
	stick_center.x = 40 + STICK_R * _ui_scale() + 40
	stick_center.y = s.y - (STICK_R * _ui_scale() + 60)
	var bx := s.x - 90.0 * _ui_scale()
	var by := s.y - 90.0 * _ui_scale()
	var defs := [
		["使う", "interact", false, Vector2(bx, by - 150 * _ui_scale()), 1.25],
		["投げる", "throw_touch", false, Vector2(bx - 120 * _ui_scale(), by - 60 * _ui_scale()), 1.0],
		["ジャンプ", "jump", false, Vector2(bx, by), 1.0],
		["しゃがむ", "crouch", true, Vector2(bx - 120 * _ui_scale(), by + 50 * _ui_scale()), 0.85],
		["ダッシュ", "sprint", true, Vector2(stick_center.x + 150 * _ui_scale(), stick_center.y + 40 * _ui_scale()), 0.85],
		["捨てる", "drop", false, Vector2(bx - 230 * _ui_scale(), by + 50 * _ui_scale()), 0.75],
		["持ち物", "next_slot", false, Vector2(bx - 230 * _ui_scale(), by - 50 * _ui_scale()), 0.75],
		["Ⅱ", "pause", false, Vector2(s.x - 48 * _ui_scale(), 100 * _ui_scale()), 0.7],
	]
	var old := buttons
	buttons = []
	for d in defs:
		var b := {"label": d[0], "action": d[1], "toggle": d[2], "pos": d[3], "r": r * d[4], "held": -1, "on": false}
		for o in old:
			if o.action == b.action:
				b.on = o.on
		buttons.append(b)


func _ui_scale() -> float:
	return clampf(size.y / 720.0, 0.75, 1.6)


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_layout()


func _process(_delta: float) -> void:
	var show := enabled and Game.mode == Game.Mode.PLAYING
	if visible != show:
		visible = show
		if not show:
			_release_all()
	if visible:
		queue_redraw()


func _release_all() -> void:
	stick_index = -1
	look_index = -1
	stick_vec = Vector2.ZERO
	_apply_stick()
	for b in buttons:
		if b.held >= 0 and not b.toggle:
			_release(b)
		b.held = -1


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch and not enabled:
		activate()
		_layout()
	if not visible:
		return
	if event is InputEventScreenTouch:
		var t := event as InputEventScreenTouch
		if t.pressed:
			# buttons first
			for b in buttons:
				if t.position.distance_to(b.pos) <= b.r * 1.15:
					b.held = t.index
					_press(b)
					get_viewport().set_input_as_handled()
					return
			if t.position.x < size.x * 0.42 and t.position.y > size.y * 0.35:
				stick_index = t.index
				stick_center = t.position
				stick_vec = Vector2.ZERO
				_apply_stick()
			else:
				look_index = t.index
				look_last = t.position
			get_viewport().set_input_as_handled()
		else:
			if t.index == stick_index:
				stick_index = -1
				stick_vec = Vector2.ZERO
				_apply_stick()
				_layout()
			if t.index == look_index:
				look_index = -1
			for b in buttons:
				if b.held == t.index:
					b.held = -1
					if not b.toggle:
						_release(b)
			get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag:
		var d := event as InputEventScreenDrag
		if d.index == stick_index:
			var v := (d.position - stick_center) / (STICK_R * _ui_scale())
			stick_vec = v.limit_length(1.0)
			_apply_stick()
			get_viewport().set_input_as_handled()
		elif d.index == look_index:
			var rel := d.position - look_last
			look_last = d.position
			if Game.player:
				Game.player.look_delta(rel * 1.6)
			get_viewport().set_input_as_handled()


func _apply_stick() -> void:
	var v := stick_vec
	_set_axis("move_left", maxf(0.0, -v.x))
	_set_axis("move_right", maxf(0.0, v.x))
	_set_axis("move_forward", maxf(0.0, -v.y))
	_set_axis("move_back", maxf(0.0, v.y))


func _set_axis(action: String, strength: float) -> void:
	if strength > 0.08:
		Input.action_press(action, strength)
	else:
		Input.action_release(action)


func _press(b: Dictionary) -> void:
	var a: String = b.action
	if b.toggle:
		b.on = not b.on
		if b.on:
			Input.action_press(a)
		else:
			Input.action_release(a)
		return
	match a:
		"pause", "next_slot":
			var ev := InputEventAction.new()
			ev.action = a
			ev.pressed = true
			Input.parse_input_event(ev)
		"throw_touch":
			Input.action_press("throw")
		_:
			Input.action_press(a)
	b.on = true


func _release(b: Dictionary) -> void:
	var a: String = b.action
	b.on = false
	match a:
		"pause", "next_slot":
			var ev := InputEventAction.new()
			ev.action = a
			ev.pressed = false
			Input.parse_input_event(ev)
		"throw_touch":
			Input.action_release("throw")
		_:
			Input.action_release(a)


func _draw() -> void:
	var sc := _ui_scale()
	var base_col := Color(1, 1, 1, 0.12)
	var ring := Color(1, 0.92, 0.7, 0.55)
	# stick
	draw_circle(stick_center, STICK_R * sc, base_col)
	draw_arc(stick_center, STICK_R * sc, 0, TAU, 40, ring, 2.0)
	draw_circle(stick_center + stick_vec * STICK_R * sc, 30 * sc, Color(1, 0.95, 0.85, 0.45))
	var font := get_theme_default_font()
	for b in buttons:
		var on: bool = b.on or b.held >= 0
		var fill := Color(0.75, 0.2, 0.15, 0.6) if on else Color(0.05, 0.06, 0.08, 0.45)
		draw_circle(b.pos, b.r, fill)
		draw_arc(b.pos, b.r, 0, TAU, 40, ring, 2.0)
		var fs := int(18 * sc * (1.0 if b.r > 40 * sc else 0.85))
		var w := font.get_string_size(b.label, HORIZONTAL_ALIGNMENT_CENTER, -1, fs).x
		draw_string(font, b.pos + Vector2(-w * 0.5, fs * 0.35), b.label, HORIZONTAL_ALIGNMENT_CENTER, -1, fs, Color(1, 0.97, 0.9))
