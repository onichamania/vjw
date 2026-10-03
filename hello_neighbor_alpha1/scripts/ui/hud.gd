class_name Hud
extends CanvasLayer
## In-game HUD, menus and screen fades. Built in code.

signal menu_new_game
signal menu_resume
signal menu_quit_to_title

var root: Control
var crosshair: Control
var prompt_label: Label
var extra_label: Label
var message_label: Label
var objective_label: Label
var slots: Array[Panel] = []
var slot_labels: Array[Label] = []
var inv_box: HBoxContainer
var fade: ColorRect
var hide_overlay: Control
var chase_vignette: ColorRect
var cam_alert: Label
var subtitle: Label
var charge_bar: ProgressBar
var title_screen: Control
var pause_menu: Control
var settings_panel: Control
var controls_panel: Control
var credits: Control
var skip_label: Label
var hint_label: Label
var _msg_t := 0.0
var _alert_t := 0.0
var _chase := false
var _chase_t := 0.0
var _hide_kind := ""


func _ready() -> void:
	layer = 10
	process_mode = Node.PROCESS_MODE_ALWAYS
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	_build_game_hud()
	_build_overlays()
	_build_title()
	_build_pause()
	_build_settings()
	_build_controls()
	_build_credits()
	var touch := TouchControls.new()
	touch.name = "Touch"
	root.add_child(touch)
	fade = ColorRect.new()
	fade.color = Color(0, 0, 0, 0)
	fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(fade)
	skip_label = _label("Space / Enter：スキップ", 16, Color(1, 1, 1, 0.6))
	skip_label.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	skip_label.position = Vector2(-260, -40)
	skip_label.visible = false
	root.add_child(skip_label)


func _label(text: String, size: int, col := Color.WHITE, outline := 6) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_constant_override("outline_size", outline)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _button(text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(320, 52)
	b.add_theme_font_size_override("font_size", 24)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.1, 0.14, 0.82)
	sb.border_color = Color(0.95, 0.85, 0.55, 0.6)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(6)
	var sh := sb.duplicate() as StyleBoxFlat
	sh.bg_color = Color(0.75, 0.2, 0.15, 0.9)
	sh.border_color = Color(1, 0.9, 0.6, 1)
	b.add_theme_stylebox_override("normal", sb)
	b.add_theme_stylebox_override("hover", sh)
	b.add_theme_stylebox_override("focus", sh)
	b.add_theme_stylebox_override("pressed", sh)
	b.add_theme_color_override("font_color", Color(1, 0.95, 0.85))
	b.pressed.connect(func():
		Game.sfx("click", -6.0)
		cb.call())
	b.mouse_entered.connect(func(): Game.sfx("hover", -14.0))
	return b


# ------------------------------------------------------------ game HUD ----
func _build_game_hud() -> void:
	crosshair = Control.new()
	crosshair.set_anchors_preset(Control.PRESET_CENTER)
	crosshair.mouse_filter = Control.MOUSE_FILTER_IGNORE
	crosshair.draw.connect(_draw_crosshair)
	root.add_child(crosshair)
	prompt_label = _label("", 22, Color(1, 0.97, 0.85))
	prompt_label.set_anchors_preset(Control.PRESET_CENTER)
	prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_label.size = Vector2(600, 30)
	prompt_label.position = Vector2(-300, 26)
	root.add_child(prompt_label)
	extra_label = _label("", 16, Color(0.85, 0.9, 1.0, 0.85))
	extra_label.set_anchors_preset(Control.PRESET_CENTER)
	extra_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	extra_label.size = Vector2(600, 24)
	extra_label.position = Vector2(-300, 56)
	root.add_child(extra_label)
	message_label = _label("", 24, Color(1, 1, 1))
	message_label.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message_label.size = Vector2(1000, 36)
	message_label.position = Vector2(-500, -150)
	root.add_child(message_label)
	objective_label = _label("", 17, Color(1, 0.92, 0.7, 0.85), 5)
	objective_label.position = Vector2(22, 18)
	root.add_child(objective_label)
	hint_label = _label("H：ヒント表示の切替　Esc：ポーズ", 14, Color(1, 1, 1, 0.45), 4)
	hint_label.position = Vector2(22, 44)
	root.add_child(hint_label)
	inv_box = HBoxContainer.new()
	inv_box.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	inv_box.position = Vector2(-4 * 132 - 24, -112)
	inv_box.add_theme_constant_override("separation", 8)
	inv_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(inv_box)
	for i in 4:
		var p := Panel.new()
		p.custom_minimum_size = Vector2(124, 84)
		p.mouse_filter = Control.MOUSE_FILTER_IGNORE
		inv_box.add_child(p)
		var num := _label(str(i + 1), 15, Color(1, 1, 1, 0.6), 3)
		num.position = Vector2(8, 4)
		p.add_child(num)
		var l := _label("", 15, Color.WHITE, 4)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		l.position = Vector2(4, 18)
		l.size = Vector2(116, 62)
		p.add_child(l)
		slots.append(p)
		slot_labels.append(l)
	charge_bar = ProgressBar.new()
	charge_bar.set_anchors_preset(Control.PRESET_CENTER)
	charge_bar.position = Vector2(-60, 90)
	charge_bar.size = Vector2(120, 8)
	charge_bar.show_percentage = false
	charge_bar.max_value = 1.0
	charge_bar.visible = false
	root.add_child(charge_bar)
	update_inventory([null, null, null, null], 0)


func _draw_crosshair() -> void:
	var has := prompt_label.text != ""
	if has:
		crosshair.draw_circle(Vector2.ZERO, 7.0, Color(1, 1, 1, 0.25))
		crosshair.draw_arc(Vector2.ZERO, 7.0, 0, TAU, 24, Color(1, 0.95, 0.7, 0.95), 2.0)
	crosshair.draw_circle(Vector2.ZERO, 2.5, Color(1, 1, 1, 0.9))


func set_prompt(text: String, extra := "") -> void:
	if prompt_label.text != text:
		prompt_label.text = text
		crosshair.queue_redraw()
	extra_label.text = extra


func update_inventory(inv: Array, sel: int) -> void:
	for i in 4:
		var it: Item = inv[i]
		slot_labels[i].text = it.display_name if it else ""
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0.05, 0.06, 0.08, 0.55) if i != sel else Color(0.45, 0.12, 0.08, 0.7)
		sb.border_color = Color(1, 0.85, 0.5, 0.95) if i == sel else Color(1, 1, 1, 0.25)
		sb.set_border_width_all(3 if i == sel else 1)
		sb.set_corner_radius_all(6)
		slots[i].add_theme_stylebox_override("panel", sb)


func show_message(text: String, dur := 3.0) -> void:
	message_label.text = text
	message_label.modulate.a = 1.0
	_msg_t = dur


func set_objective(text: String) -> void:
	objective_label.text = text


func flash_camera_alert() -> void:
	_alert_t = 1.6


func set_chase(on: bool) -> void:
	_chase = on


func set_game_hud_visible(v: bool) -> void:
	for n: Control in [crosshair, prompt_label, extra_label, inv_box, objective_label, hint_label, charge_bar]:
		n.visible = v
	if not v:
		chase_vignette.visible = false


# ------------------------------------------------------------- overlays ---
func _build_overlays() -> void:
	chase_vignette = ColorRect.new()
	chase_vignette.set_anchors_preset(Control.PRESET_FULL_RECT)
	chase_vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
uniform float amount = 0.0;
void fragment() {
	vec2 d = UV - vec2(0.5);
	float v = smoothstep(0.35, 0.75, length(d * vec2(1.3, 1.0)));
	COLOR = vec4(0.6, 0.0, 0.0, v * amount);
}
"""
	var sm := ShaderMaterial.new()
	sm.shader = sh
	sm.set_shader_parameter("amount", 0.0)
	chase_vignette.material = sm
	chase_vignette.visible = false
	root.add_child(chase_vignette)
	hide_overlay = Control.new()
	hide_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	hide_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hide_overlay.draw.connect(_draw_hide)
	hide_overlay.visible = false
	root.add_child(hide_overlay)
	cam_alert = _label("● REC  監視カメラが反応した！", 22, Color(1, 0.25, 0.2))
	cam_alert.set_anchors_preset(Control.PRESET_CENTER_TOP)
	cam_alert.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cam_alert.size = Vector2(600, 30)
	cam_alert.position = Vector2(-300, 60)
	cam_alert.visible = false
	root.add_child(cam_alert)
	subtitle = _label("", 26, Color(1, 1, 1))
	subtitle.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.size = Vector2(1100, 40)
	subtitle.position = Vector2(-550, -90)
	root.add_child(subtitle)


func _draw_hide() -> void:
	var s := hide_overlay.size
	var dark := Color(0.01, 0.01, 0.01, 0.97)
	if _hide_kind == "wardrobe":
		# Looking out through the gap between the wardrobe doors.
		var gw := s.x * 0.16
		var gh := s.y * 0.62
		var cx := s.x * 0.5
		var cy := s.y * 0.48
		hide_overlay.draw_rect(Rect2(0, 0, cx - gw * 0.5, s.y), dark)
		hide_overlay.draw_rect(Rect2(cx + gw * 0.5, 0, s.x - cx - gw * 0.5, s.y), dark)
		hide_overlay.draw_rect(Rect2(cx - gw * 0.5, 0, gw, cy - gh * 0.5), dark)
		hide_overlay.draw_rect(Rect2(cx - gw * 0.5, cy + gh * 0.5, gw, s.y - cy - gh * 0.5), dark)
		hide_overlay.draw_rect(Rect2(cx - gw * 0.5 - 6, cy - gh * 0.5, 6, gh), Color(0.18, 0.11, 0.06))
		hide_overlay.draw_rect(Rect2(cx + gw * 0.5, cy - gh * 0.5, 6, gh), Color(0.18, 0.11, 0.06))
	else:
		# Under the bed: a wide low strip between the floor and the frame.
		var top := s.y * 0.36
		var bot := s.y * 0.72
		hide_overlay.draw_rect(Rect2(0, 0, s.x, top), dark)
		hide_overlay.draw_rect(Rect2(0, bot, s.x, s.y - bot), Color(0.05, 0.04, 0.03, 0.95))
		hide_overlay.draw_rect(Rect2(0, top, s.x, 10), Color(0.25, 0.25, 0.3))


func set_hidden(on: bool, kind: String) -> void:
	_hide_kind = kind
	hide_overlay.visible = on
	hide_overlay.queue_redraw()
	if on:
		show_message("E / クリック：出る", 2.0)


## Fade the screen to `col` (alpha 1) over `dur` seconds.
func fade_to(col: Color, dur: float) -> Tween:
	var c := col
	c.a = fade.color.a
	fade.color = c
	var tw := create_tween()
	tw.tween_property(fade, "color:a", 1.0, dur)
	return tw


func fade_in(dur: float) -> Tween:
	var tw := create_tween()
	tw.tween_property(fade, "color:a", 0.0, dur)
	return tw


func set_fade(col: Color) -> void:
	fade.color = col


func set_subtitle(text: String) -> void:
	subtitle.text = text


func _process(delta: float) -> void:
	if _msg_t > 0.0:
		_msg_t -= delta
		if _msg_t < 0.6:
			message_label.modulate.a = maxf(0.0, _msg_t / 0.6)
		if _msg_t <= 0.0:
			message_label.text = ""
	if _alert_t > 0.0:
		_alert_t -= delta
		cam_alert.visible = fmod(_alert_t, 0.4) > 0.15
	else:
		cam_alert.visible = false
	var m := chase_vignette.material as ShaderMaterial
	if _chase:
		_chase_t += delta
		chase_vignette.visible = true
		m.set_shader_parameter("amount", 0.35 + 0.2 * sin(_chase_t * 7.0))
	else:
		var a: float = m.get_shader_parameter("amount")
		a = maxf(0.0, a - delta * 0.6)
		m.set_shader_parameter("amount", a)
		chase_vignette.visible = a > 0.01
	var p: Player = Game.player
	if p and p.throw_charge >= 0.0 and Game.mode == Game.Mode.PLAYING:
		charge_bar.visible = true
		charge_bar.value = p.throw_charge
	else:
		charge_bar.visible = false


# ---------------------------------------------------------------- menus ---
func _panel_bg(c: Control, alpha := 0.0) -> void:
	var bg := ColorRect.new()
	bg.color = Color(0, 0, 0, alpha)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.add_child(bg)


func _build_title() -> void:
	title_screen = Control.new()
	title_screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(title_screen)
	var grad := ColorRect.new()
	grad.set_anchors_preset(Control.PRESET_FULL_RECT)
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
void fragment() {
	float l = smoothstep(0.0, 0.62, UV.x);
	COLOR = vec4(0.0, 0.0, 0.02, 0.78 * (1.0 - l));
}
"""
	var sm := ShaderMaterial.new()
	sm.shader = sh
	grad.material = sm
	grad.mouse_filter = Control.MOUSE_FILTER_IGNORE
	title_screen.add_child(grad)
	var t1 := _label("HELLO", 92, Color(0.98, 0.96, 0.9), 14)
	t1.position = Vector2(70, 60)
	title_screen.add_child(t1)
	var t2 := _label("NEIGHBOR", 92, Color(0.86, 0.17, 0.12), 14)
	t2.position = Vector2(70, 150)
	title_screen.add_child(t2)
	var t3 := _label("ALPHA 1  ―  ファンメイド再現版", 26, Color(1, 0.9, 0.55), 8)
	t3.position = Vector2(78, 262)
	title_screen.add_child(t3)
	var vb := VBoxContainer.new()
	vb.position = Vector2(78, 330)
	vb.add_theme_constant_override("separation", 12)
	title_screen.add_child(vb)
	vb.add_child(_button("ニューゲーム", func(): menu_new_game.emit()))
	vb.add_child(_button("操作方法", func(): _show_panel(controls_panel)))
	vb.add_child(_button("設定", func(): _show_panel(settings_panel)))
	vb.add_child(_button("終了", func(): get_tree().quit()))
	var note := _label("非公式のファンメイド作品です（2016年 Alpha 1 版の再現）。tinyBuild / Dynamic Pixels とは無関係です。\n音楽・効果音・モデルはすべてこのプロジェクト用のオリジナルです。", 14, Color(1, 1, 1, 0.6), 4)
	note.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	note.position = Vector2(24, -60)
	title_screen.add_child(note)


func show_title(on: bool) -> void:
	title_screen.visible = on
	if on:
		set_game_hud_visible(false)
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _build_pause() -> void:
	pause_menu = Control.new()
	pause_menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	pause_menu.visible = false
	root.add_child(pause_menu)
	_panel_bg(pause_menu, 0.6)
	var t := _label("ポーズ", 48, Color(1, 0.95, 0.85), 10)
	t.position = Vector2(80, 80)
	pause_menu.add_child(t)
	var vb := VBoxContainer.new()
	vb.position = Vector2(80, 170)
	vb.add_theme_constant_override("separation", 12)
	pause_menu.add_child(vb)
	vb.add_child(_button("再開", func(): menu_resume.emit()))
	vb.add_child(_button("操作方法", func(): _show_panel(controls_panel)))
	vb.add_child(_button("設定", func(): _show_panel(settings_panel)))
	vb.add_child(_button("タイトルへ戻る", func(): menu_quit_to_title.emit()))


func show_pause(on: bool) -> void:
	pause_menu.visible = on
	if not on:
		settings_panel.visible = false
		controls_panel.visible = false


func _show_panel(p: Control) -> void:
	settings_panel.visible = p == settings_panel
	controls_panel.visible = p == controls_panel


func _side_panel() -> PanelContainer:
	var pc := PanelContainer.new()
	pc.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
	pc.position = Vector2(-620, -270)
	pc.size = Vector2(560, 540)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.05, 0.06, 0.09, 0.92)
	sb.border_color = Color(0.95, 0.85, 0.55, 0.5)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(8)
	sb.content_margin_left = 24
	sb.content_margin_right = 24
	sb.content_margin_top = 18
	sb.content_margin_bottom = 18
	pc.add_theme_stylebox_override("panel", sb)
	pc.visible = false
	root.add_child(pc)
	return pc


func _build_controls() -> void:
	controls_panel = _side_panel()
	var vb := VBoxContainer.new()
	controls_panel.add_child(vb)
	vb.add_child(_label("操作方法", 30, Color(1, 0.9, 0.6)))
	var txt := """WASD / 矢印キー　移動
マウス　視点
Shift　ダッシュ（足音が大きい）
Ctrl / C　しゃがむ（足音を消す）
Space　ジャンプ
E / 左クリック　拾う・使う・ドア・隠れる
右クリック長押し　投げる（窓ガラスを割れる）
Q　捨てる
1〜4 / ホイール　持ち物の切り替え
Esc　ポーズ

目的：お隣さんの家の地下室に入ること。
地下室のドアはリビングの階段の下。
板をはがす道具と、銅の錠を開ける手段が要る。
お隣さんに見つかったら走って逃げよう。
追跡中の彼には隠れても無駄…距離を取れ！"""
	vb.add_child(_label(txt, 18, Color(0.95, 0.95, 0.95), 3))
	vb.add_child(_button("閉じる", func(): controls_panel.visible = false))


func _build_settings() -> void:
	settings_panel = _side_panel()
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 10)
	settings_panel.add_child(vb)
	vb.add_child(_label("設定", 30, Color(1, 0.9, 0.6)))
	vb.add_child(_slider("マウス感度", 0.0006, 0.006, Game.settings.sens, func(v): Game.settings.sens = v))
	vb.add_child(_slider("視野角 (FOV)", 60, 100, Game.settings.fov, func(v): Game.settings.fov = v))
	vb.add_child(_slider("音楽の音量", 0, 1, Game.settings.music, func(v):
		Game.settings.music = v
		Game.apply_volumes()))
	vb.add_child(_slider("効果音の音量", 0, 1, Game.settings.sfx, func(v):
		Game.settings.sfx = v
		Game.apply_volumes()))
	var hints := CheckBox.new()
	hints.text = "ヒントを表示する"
	hints.button_pressed = Game.settings.hints
	hints.add_theme_font_size_override("font_size", 20)
	hints.toggled.connect(func(b): Game.settings.hints = b)
	vb.add_child(hints)
	var inv := CheckBox.new()
	inv.text = "上下の視点操作を反転"
	inv.button_pressed = Game.settings.invert_y
	inv.add_theme_font_size_override("font_size", 20)
	inv.toggled.connect(func(b): Game.settings.invert_y = b)
	vb.add_child(inv)
	var q := OptionButton.new()
	q.add_item("画質：標準")
	q.add_item("画質：高（SSAO / グロー）")
	q.add_item("画質：最高（+ SDFGI）")
	q.selected = int(Game.settings.quality)
	q.add_theme_font_size_override("font_size", 20)
	q.item_selected.connect(func(i):
		Game.settings.quality = i
		if Game.main:
			Game.main.apply_quality())
	vb.add_child(q)
	vb.add_child(_button("閉じる", func():
		Game.save_settings()
		settings_panel.visible = false))


func _slider(text: String, mn: float, mx: float, val: float, cb: Callable) -> Control:
	var vb := VBoxContainer.new()
	vb.add_child(_label(text, 18, Color(0.95, 0.95, 0.95), 2))
	var s := HSlider.new()
	s.min_value = mn
	s.max_value = mx
	s.step = (mx - mn) / 100.0
	s.value = val
	s.custom_minimum_size = Vector2(480, 24)
	s.value_changed.connect(cb)
	vb.add_child(s)
	return vb


func _build_credits() -> void:
	credits = Control.new()
	credits.set_anchors_preset(Control.PRESET_FULL_RECT)
	credits.visible = false
	root.add_child(credits)
	_panel_bg(credits, 1.0)
	var l := _label("", 30, Color(1, 0.95, 0.85), 6)
	l.name = "Text"
	l.set_anchors_preset(Control.PRESET_FULL_RECT)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	credits.add_child(l)


func show_credits(text: String) -> void:
	credits.visible = true
	(credits.get_node("Text") as Label).text = text


func hide_credits() -> void:
	credits.visible = false
