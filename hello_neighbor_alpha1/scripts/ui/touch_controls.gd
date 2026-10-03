class_name TouchControls
extends Control
## On-screen controls for phones / tablets (browser build).
## Shown from the start on phones, or after the first touch elsewhere.
## Left side: drag to move (floating stick; push it to the rim to run).
## Right side: drag to look. Buttons: use / throw / jump / crouch / run /
## drop / pause. Tap an inventory slot to hold that item. In cutscenes a tap
## skips, on the credits it returns to the title.

const STICK_R := 92.0
const MIN_HOLD_MS := 90   # a tap shorter than this still reaches the physics step

var stick_home := Vector2.ZERO
var stick_center := Vector2.ZERO
var stick_vec := Vector2.ZERO
var stick_index := -1
var stick_run := false
var look_index := -1
var look_last := Vector2.ZERO
var skip_index := -1
var buttons: Array = []          # [{label, action, toggle, pos, r, held, on, t}]
var enabled := false
var _use_events: Array = []      # mouse bindings of "use", restored for keyboard play


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	visible = false
	if Game.touch_mode:
		activate.call_deferred()


func activate() -> void:
	if enabled:
		return
	enabled = true
	Game.touch_mode = true
	# A tap anywhere must not count as a left click ("use"); the button does that.
	for ev in InputMap.action_get_events("use"):
		if ev is InputEventMouseButton:
			_use_events.append(ev)
			InputMap.action_erase_event("use", ev)
	if Game.mode != Game.Mode.PLAYING or Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_layout()


## Back to keyboard & mouse (a touchscreen laptop whose owner started typing).
func deactivate() -> void:
	if not enabled or Game.mobile:
		return
	enabled = false
	Game.touch_mode = false
	for ev in _use_events:
		InputMap.action_add_event("use", ev)
	_use_events.clear()
	_release_all()
	visible = false


func _ui_scale() -> float:
	return clampf(size.y / 720.0, 0.8, 1.2)


func _layout() -> void:
	var s := size
	var k := _ui_scale()
	# Resting place of the stick: bottom-left, just above the inventory.
	stick_home = Vector2(56 + STICK_R * k, s.y - 96 - STICK_R * k)
	if stick_index < 0:
		stick_center = stick_home
	var br := Vector2(s.x, s.y)
	# [label, action, toggle, offset from bottom-right, radius]
	var defs := [
		["使う", "use", false, Vector2(-215, -130), 66.0],
		["ジャンプ", "jump", false, Vector2(-85, -215), 50.0],
		["しゃがむ", "crouch", true, Vector2(-85, -80), 44.0],
		["投げる", "throw", false, Vector2(-215, -285), 48.0],
		["捨てる", "drop", false, Vector2(-340, -75), 38.0],
		["ダッシュ", "sprint", true, Vector2(-340, -200), 40.0],
	]
	var old := buttons
	buttons = []
	for d in defs:
		var b := {"label": d[0], "action": d[1], "toggle": d[2], "pos": br + (d[3] as Vector2) * k,
			"r": float(d[4]) * k, "held": -1, "on": false, "t": 0}
		for o in old:
			if o.action == b.action:
				b.on = o.on
				b.held = o.held
		buttons.append(b)
	buttons.append({"label": "Ⅱ", "action": "pause", "toggle": false, "pos": Vector2(s.x - 60 * k, 140 * k),
		"r": 34.0 * k, "held": -1, "on": false, "t": 0})


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_layout()


func _process(_delta: float) -> void:
	var show := enabled and Game.mode == Game.Mode.PLAYING
	if visible != show:
		visible = show
		if not show:
			_release_all()
	# Deferred releases of very short taps.
	var now := Time.get_ticks_msec()
	for b in buttons:
		if b.held == -2 and now - int(b.t) >= MIN_HOLD_MS:
			b.held = -1
			_release(b)
	if visible:
		queue_redraw()


func _release_all() -> void:
	stick_index = -1
	look_index = -1
	stick_vec = Vector2.ZERO
	stick_center = stick_home
	_set_run_toggle(false)
	for b in buttons:
		if b.held != -1 and not b.toggle:
			_release(b)
		b.held = -1


func _input(event: InputEvent) -> void:
	if event is InputEventKey and (event as InputEventKey).pressed and enabled and not Game.mobile:
		deactivate()
		return
	if event is InputEventScreenTouch and not enabled:
		activate()
	if not enabled:
		return
	if event is InputEventScreenTouch:
		_touch(event as InputEventScreenTouch)
	elif event is InputEventScreenDrag and visible:
		_drag(event as InputEventScreenDrag)


func _touch(t: InputEventScreenTouch) -> void:
	# Cutscenes / credits: a tap skips.
	if Game.mode == Game.Mode.CUTSCENE:
		if t.pressed and skip_index < 0:
			skip_index = t.index
			_action_event("skip", true)
		elif not t.pressed and t.index == skip_index:
			skip_index = -1
			_action_event("skip", false)
		return
	if skip_index >= 0 and not t.pressed and t.index == skip_index:
		skip_index = -1
		_action_event("skip", false)
	if not visible:
		return
	if t.pressed:
		for b in buttons:
			if t.position.distance_to(b.pos) <= b.r * 1.12:
				b.held = t.index
				b.t = Time.get_ticks_msec()
				_press(b)
				get_viewport().set_input_as_handled()
				return
		var slot := _slot_at(t.position)
		if slot >= 0:
			if Game.player:
				Game.player.select_slot(slot)
			get_viewport().set_input_as_handled()
			return
		if t.position.x < size.x * 0.4 and t.position.y > size.y * 0.3 and stick_index < 0:
			stick_index = t.index
			stick_center = t.position
			stick_vec = Vector2.ZERO
			_apply_stick()
		elif look_index < 0:
			look_index = t.index
			look_last = t.position
		get_viewport().set_input_as_handled()
	else:
		if t.index == stick_index:
			stick_index = -1
			stick_vec = Vector2.ZERO
			stick_center = stick_home
			_apply_stick()
			_set_run_toggle(false)
		if t.index == look_index:
			look_index = -1
		for b in buttons:
			if b.held == t.index:
				if b.toggle:
					b.held = -1
				elif Time.get_ticks_msec() - int(b.t) < MIN_HOLD_MS:
					b.held = -2   # released from _process
				else:
					b.held = -1
					_release(b)
		get_viewport().set_input_as_handled()


func _drag(d: InputEventScreenDrag) -> void:
	if d.index == stick_index:
		var raw := (d.position - stick_center) / (STICK_R * _ui_scale())
		# Let the stick base follow a thumb that slides far past the rim.
		if raw.length() > 1.6:
			stick_center = d.position - raw.normalized() * 1.6 * STICK_R * _ui_scale()
			raw = raw.normalized() * 1.6
		stick_vec = raw.limit_length(1.0)
		stick_run = raw.length() > 1.3 and raw.y < -0.8
		_apply_stick()
		get_viewport().set_input_as_handled()
	elif d.index == look_index:
		var rel := d.position - look_last
		look_last = d.position
		if Game.player:
			Game.player.look_delta(rel * 1.5)
		get_viewport().set_input_as_handled()


func _slot_at(p: Vector2) -> int:
	if Game.hud == null or not Game.hud.inv_box.visible:
		return -1
	for i in Game.hud.slots.size():
		var r: Rect2 = (Game.hud.slots[i] as Control).get_global_rect().grow(6)
		if r.has_point(p):
			return i
	return -1


func _apply_stick() -> void:
	var v := stick_vec
	_set_axis("move_left", maxf(0.0, -v.x))
	_set_axis("move_right", maxf(0.0, v.x))
	_set_axis("move_forward", maxf(0.0, -v.y))
	_set_axis("move_back", maxf(0.0, v.y))
	var run_btn := _button("sprint")
	var run: bool = stick_run and stick_index >= 0
	if run_btn and run_btn.on:
		run = true
	if run:
		Input.action_press("sprint")
	else:
		Input.action_release("sprint")


func _set_axis(action: String, strength: float) -> void:
	if strength > 0.08:
		Input.action_press(action, strength)
	else:
		Input.action_release(action)


func _set_run_toggle(on: bool) -> void:
	stick_run = false
	var b := _button("sprint")
	if b:
		b.on = on
	_apply_stick()


func _button(action: String) -> Dictionary:
	for b in buttons:
		if b.action == action:
			return b
	return {}


func _action_event(action: String, pressed: bool) -> void:
	var ev := InputEventAction.new()
	ev.action = action
	ev.pressed = pressed
	Input.parse_input_event(ev)


func _press(b: Dictionary) -> void:
	var a: String = b.action
	if b.toggle:
		b.on = not b.on
		if a == "sprint":
			_apply_stick()
		elif b.on:
			Input.action_press(a)
		else:
			Input.action_release(a)
		return
	b.on = true
	if a == "pause":
		_action_event(a, true)
	else:
		Input.action_press(a)


func _release(b: Dictionary) -> void:
	var a: String = b.action
	b.on = false
	if a == "pause":
		_action_event(a, false)
	else:
		Input.action_release(a)


## What the use button does right now.
func _use_label() -> Array:
	var p := Game.player
	if p == null:
		return ["使う", false]
	if p.hidden_in:
		return ["出る", true]
	if p.target:
		return ["使う", true]
	match p.held_id():
		"toy_rifle":
			return ["撃つ", true]
		"flashlight":
			return ["ライト", true]
		"binoculars":
			return ["のぞく", true]
		"apple":
			return ["食べる", true]
	return ["使う", false]


func _draw() -> void:
	var k := _ui_scale()
	var ring := Color(1, 0.92, 0.7, 0.55)
	var font := get_theme_default_font()
	# stick
	var active := stick_index >= 0
	draw_circle(stick_center, STICK_R * k, Color(1, 1, 1, 0.12 if active else 0.07))
	draw_arc(stick_center, STICK_R * k, 0, TAU, 48, Color(ring, 0.55 if active else 0.3), 2.0)
	var knob := Color(1, 0.5, 0.35, 0.6) if (stick_run and active) else Color(1, 0.95, 0.85, 0.45 if active else 0.25)
	draw_circle(stick_center + stick_vec * STICK_R * k, 34 * k, knob)
	if not active:
		_text(font, stick_center - Vector2(0, STICK_R * k + 18 * k), "移動", int(16 * k), Color(1, 1, 1, 0.45))
	var has_item: bool = Game.player != null and Game.player.held_item() != null
	var use: Array = _use_label()
	for b in buttons:
		var label: String = b.label
		var live := true
		match b.action:
			"use":
				label = use[0]
				live = use[1]
			"throw", "drop":
				live = has_item
		var on: bool = b.on or b.held != -1
		var fill := Color(0.75, 0.2, 0.15, 0.65) if on else Color(0.05, 0.06, 0.08, 0.45 if live else 0.25)
		draw_circle(b.pos, b.r, fill)
		var rc := ring if live else Color(1, 1, 1, 0.2)
		if b.action == "use" and live and not on:
			rc = Color(1, 0.85, 0.4, 0.6 + 0.35 * sin(Time.get_ticks_msec() * 0.008))
		draw_arc(b.pos, b.r, 0, TAU, 40, rc, 3.0 if b.action == "use" else 2.0)
		var fs := int(clampf(b.r * 0.42, 14 * k, 26 * k))
		_text(font, b.pos, label, fs, Color(1, 0.97, 0.9, 1.0 if live else 0.45))


func _text(font: Font, center: Vector2, s: String, fs: int, col: Color) -> void:
	var w := font.get_string_size(s, HORIZONTAL_ALIGNMENT_CENTER, -1, fs).x
	draw_string_outline(font, center + Vector2(-w * 0.5, fs * 0.35), s, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 4, Color(0, 0, 0, 0.6 * col.a))
	draw_string(font, center + Vector2(-w * 0.5, fs * 0.35), s, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, col)
