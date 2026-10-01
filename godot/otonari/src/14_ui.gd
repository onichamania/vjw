
# ================= 画面（HUD・メニュー）と操作 =================
# three.js 版の HTML/CSS の画面を、Godot の Control で作りなおしたもの
var UI := {}
var ui_layer: CanvasLayer
var BODY := {play = false, main = false, cut = false, touch = false, nohint = false}
var FONT_R: Font
var FONT_B: Font
var FONT_H: Font
const YEL := Color("#ffcf3a")
func _font(path: String) -> Font:
	if ResourceLoader.exists(path): return load(path)
	return ThemeDB.fallback_font
func lset(size: int, col := Color.WHITE, font: Font = null, shadow := true) -> LabelSettings:
	var s := LabelSettings.new(); s.font = font if font else FONT_B; s.font_size = size; s.font_color = col
	if shadow:
		s.shadow_color = Color(0, 0, 0, 0.55); s.shadow_offset = Vector2(0, 2); s.shadow_size = 2
	return s
func sbox(bg: Color, radius := 12, border := Color(0, 0, 0, 0), bw := 0) -> StyleBoxFlat:
	var s := StyleBoxFlat.new(); s.bg_color = bg; s.set_corner_radius_all(radius)
	if bw > 0:
		s.border_color = border; s.set_border_width_all(bw)
	return s
func mklabel(parent: Control, text: String, settings: LabelSettings, align := HORIZONTAL_ALIGNMENT_CENTER) -> Label:
	var l := Label.new(); l.text = text; l.label_settings = settings; l.horizontal_alignment = align; l.mouse_filter = Control.MOUSE_FILTER_IGNORE; parent.add_child(l)
	return l
# 画面のどこに置くか（中心 cx,cy は 0..1、大きさ w,h）
func place(c: Control, ax: float, ay: float, ox: float, oy: float, w := -1.0, h := -1.0, grow_x := Control.GROW_DIRECTION_BOTH) -> void:
	c.anchor_left = ax; c.anchor_right = ax; c.anchor_top = ay; c.anchor_bottom = ay
	c.offset_left = ox; c.offset_top = oy
	if w >= 0: c.offset_right = ox + w
	if h >= 0: c.offset_bottom = oy + h
	c.grow_horizontal = grow_x
	c.grow_vertical = Control.GROW_DIRECTION_END if ay == 0 else Control.GROW_DIRECTION_BEGIN if ay == 1 else Control.GROW_DIRECTION_BOTH
var BTNS := []
func mkbtn(parent: Control, text: String, kind := "", cb = null) -> Button:
	var b := Button.new(); b.text = text; b.focus_mode = Control.FOCUS_NONE
	var bg := YEL; var fg := Color("#2a1a08"); var sh := Color("#7a4e10")
	if kind == "sub":
		bg = Color("#fff5dc"); sh = Color("#8a7a5a")
	elif kind == "red":
		bg = Color("#e0503c"); fg = Color.WHITE; sh = Color("#7a2012")
	for st in ["normal", "hover", "pressed", "disabled", "focus"]:
		var s := sbox(bg if st != "hover" else bg.lightened(0.08), 14, Color("#2a1a08"), 3)
		s.shadow_color = sh; s.shadow_size = 0; s.shadow_offset = Vector2(0, 5) if st != "pressed" else Vector2(0, 2)
		s.content_margin_top = 12; s.content_margin_bottom = 12; s.content_margin_left = 18; s.content_margin_right = 18
		if st == "disabled": s.bg_color.a = 0.45
		b.add_theme_stylebox_override(st, s)
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]: b.add_theme_color_override(c, fg)
	b.add_theme_color_override("font_disabled_color", Color(fg, 0.5))
	b.add_theme_font_override("font", FONT_H); b.add_theme_font_size_override("font_size", 19)
	if cb: b.pressed.connect(cb)
	parent.add_child(b); BTNS.append(b)
	return b
func shader_rect(code: String) -> ColorRect:
	var r := ColorRect.new(); r.set_anchors_preset(Control.PRESET_FULL_RECT); r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new(); var s := Shader.new(); s.code = "shader_type canvas_item;\n" + code; m.shader = s; r.material = m
	return r
func setup_ui() -> void:
	FONT_R = _font("res://fonts/ui_500.ttf"); FONT_B = _font("res://fonts/ui_800.ttf"); FONT_H = _font("res://fonts/ui_900.ttf")
	var th := Theme.new(); th.default_font = FONT_B; th.default_font_size = 16
	ui_layer = CanvasLayer.new(); ui_layer.layer = 5; add_child(ui_layer)
	fit_ui(); get_window().size_changed.connect(fit_ui)
	var root := Control.new(); root.set_anchors_preset(Control.PRESET_FULL_RECT); root.mouse_filter = Control.MOUSE_FILTER_IGNORE; root.theme = th; ui_layer.add_child(root); UI.root = root
	# ---------- HUD ----------
	var hud := Control.new(); hud.set_anchors_preset(Control.PRESET_FULL_RECT); hud.mouse_filter = Control.MOUSE_FILTER_IGNORE; root.add_child(hud); UI.hud = hud; hud.visible = false
	var hm := Control.new(); hm.set_anchors_preset(Control.PRESET_FULL_RECT); hm.mouse_filter = Control.MOUSE_FILTER_IGNORE; hud.add_child(hm); UI.hudMain = hm
	var hide := shader_rect("""uniform float under = 0.0;
void fragment(){
	vec2 uv = UV; vec4 c;
	if (under < 0.5) {
		float px = uv.y * 540.0; float m = mod(px, 34.0);
		c = m < 22.0 ? vec4(0.094, 0.055, 0.024, 0.97) : vec4(0.0);
		float e = length(max(abs(uv - 0.5) * 2.0 - 0.55, 0.0)) * 1.6; c = mix(c, vec4(0.07, 0.04, 0.016, 1.0), clamp(e, 0.0, 1.0));
	} else {
		c = uv.y < 0.38 ? vec4(0.078, 0.055, 0.031, 0.98) : uv.y < 0.42 ? mix(vec4(0.078, 0.055, 0.031, 0.98), vec4(0.078, 0.055, 0.031, 0.6), (uv.y - 0.38) / 0.04) : uv.y < 0.55 ? mix(vec4(0.078, 0.055, 0.031, 0.6), vec4(0.0), (uv.y - 0.42) / 0.13) : vec4(0.0);
		c.a = max(c.a, smoothstep(0.8, 1.0, uv.y) * 0.7);
	}
	COLOR = c;
}"""); hm.add_child(hide); UI.hideView = hide; hide.visible = false
	UI.hideTip = mklabel(hm, "隠れています　E / 手ボタンで出る", lset(17)); place(UI.hideTip, 0.5, 0.82, -200, -12, 400, 24); UI.hideTip.visible = false
	var binoc := shader_rect("""void fragment(){
	vec2 p = (UV - 0.5) * vec2(1.0 / SCREEN_PIXEL_SIZE.x * SCREEN_PIXEL_SIZE.y, 1.0);
	float r = 0.26; float a = length(p - vec2(-0.13 * (1.0 / SCREEN_PIXEL_SIZE.x * SCREEN_PIXEL_SIZE.y) * 0.0 - 0.0, 0.0));
	vec2 asp = vec2(SCREEN_PIXEL_SIZE.y / SCREEN_PIXEL_SIZE.x, 1.0);
	vec2 q = (UV - 0.5) * vec2((1.0 / SCREEN_PIXEL_SIZE.x) / (1.0 / SCREEN_PIXEL_SIZE.y), 1.0);
	float w = (1.0 / SCREEN_PIXEL_SIZE.x) / (1.0 / SCREEN_PIXEL_SIZE.y);
	float d1 = length(q - vec2((0.37 - 0.5) * w, 0.0)); float d2 = length(q - vec2((0.63 - 0.5) * w, 0.0));
	float inside = max(1.0 - smoothstep(0.26, 0.263, d1), 1.0 - smoothstep(0.26, 0.263, d2));
	COLOR = vec4(0.0, 0.0, 0.0, 1.0 - inside);
}"""); hm.add_child(binoc); UI.binoc = binoc; binoc.visible = false
	var hurt := shader_rect("""void fragment(){ float d = length((UV - 0.5) * vec2(1.0, 1.0)) * 2.0; COLOR = vec4(1.0, 0.235, 0.078, smoothstep(0.45, 1.0, d) * 0.55); }"""); hm.add_child(hurt); UI.hurt = hurt; hurt.modulate.a = 0
	var trap := shader_rect("""void fragment(){ vec2 e = min(UV, 1.0 - UV); float d = min(e.x * 1.6, e.y); COLOR = vec4(0.63, 0.078, 0.04, (1.0 - smoothstep(0.0, 0.22, d)) * 0.7); }"""); hm.add_child(trap); UI.trapFx = trap; trap.modulate.a = 0
	var cross := Panel.new(); cross.add_theme_stylebox_override("panel", sbox(Color(1, 1, 1, 0.85), 5, Color(0, 0, 0, 0.35), 1)); place(cross, 0.5, 0.5, -4, -4, 8, 8); cross.pivot_offset = Vector2(4, 4); cross.mouse_filter = Control.MOUSE_FILTER_IGNORE; hm.add_child(cross); UI.cross = cross
	var pr := RichTextLabel.new(); pr.bbcode_enabled = true; pr.fit_content = true; pr.scroll_active = false; pr.autowrap_mode = TextServer.AUTOWRAP_OFF; pr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	pr.add_theme_font_override("normal_font", FONT_B); pr.add_theme_font_override("bold_font", FONT_H); pr.add_theme_font_size_override("normal_font_size", 18); pr.add_theme_font_size_override("bold_font_size", 18)
	pr.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.6)); pr.add_theme_constant_override("shadow_offset_y", 2); pr.add_theme_constant_override("shadow_offset_x", 0); pr.add_theme_constant_override("line_separation", 2)
	place(pr, 0.5, 0.5, -300, 30, 600, 80); pr.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; hm.add_child(pr); UI.prompt = pr
	var ch := Panel.new(); ch.add_theme_stylebox_override("panel", sbox(Color(0, 0, 0, 0.4), 4)); place(ch, 0.5, 0.5, -42, 21, 84, 7); hm.add_child(ch); UI.charge = ch; ch.visible = false
	var chf := ColorRect.new(); chf.color = Color("#ffb04a"); chf.position = Vector2(0, 0); chf.size = Vector2(0, 7); ch.add_child(chf); UI.chargeFill = chf
	# やること
	var obj := PanelContainer.new(); var os := sbox(Color(0.078, 0.1, 0.133, 0.55), 12); os.border_color = YEL; os.border_width_left = 5; os.content_margin_left = 14; os.content_margin_right = 14; os.content_margin_top = 9; os.content_margin_bottom = 9
	obj.add_theme_stylebox_override("panel", os); place(obj, 0, 0, 64, 14, -1, -1, Control.GROW_DIRECTION_END); obj.custom_minimum_size = Vector2(0, 0); hm.add_child(obj); UI.obj = obj; obj.visible = false
	var ov := VBoxContainer.new(); ov.add_theme_constant_override("separation", 0); obj.add_child(ov)
	UI.objSm = mklabel(ov, "やること", lset(13, Color(1, 1, 1, 0.8), FONT_R), HORIZONTAL_ALIGNMENT_LEFT)
	UI.objT = mklabel(ov, "", lset(17), HORIZONTAL_ALIGNMENT_LEFT)
	UI.toast = mklabel(hm, "", lset(20)); place(UI.toast, 0.5, 0.22, -400, -14, 800, 30); UI.toast.modulate.a = 0
	UI.alarm = mklabel(hm, "● 監視カメラに見つかった！", lset(18, Color("#ff5a4a"), FONT_H)); place(UI.alarm, 0.5, 0.12, -300, -12, 600, 26); UI.alarm.visible = false
	UI.iname = mklabel(hm, "", lset(15), HORIZONTAL_ALIGNMENT_LEFT); place(UI.iname, 0, 1, 20, -112, 400, 22); UI.iname.modulate.a = 0
	# 持ち物
	var inv := HBoxContainer.new(); inv.add_theme_constant_override("separation", 8); place(inv, 0, 1, 16, -72, -1, 58, Control.GROW_DIRECTION_END); hm.add_child(inv); UI.inv = inv; UI.slots = []
	for i in 4:
		var sl := Panel.new(); sl.custom_minimum_size = Vector2(58, 58); sl.add_theme_stylebox_override("panel", sbox(Color(0.118, 0.118, 0.133, 0.62), 12, Color(1, 1, 1, 0.12), 2)); inv.add_child(sl)
		var img := TextureRect.new(); img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE; img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED; img.set_anchors_preset(Control.PRESET_CENTER); img.custom_minimum_size = Vector2(52, 52); img.grow_horizontal = Control.GROW_DIRECTION_BOTH; img.grow_vertical = Control.GROW_DIRECTION_BOTH; img.mouse_filter = Control.MOUSE_FILTER_IGNORE; sl.add_child(img)
		var n := mklabel(sl, str(i + 1), lset(12, Color(1, 1, 1, 0.7), FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); n.position = Vector2(6, 2)
		var ii := i
		sl.gui_input.connect(func(ev):
			if (ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT) or (ev is InputEventScreenTouch and ev.pressed):
				selSlot(ii); sl.accept_event())
		UI.slots.append({p = sl, img = img, key = ""})
	# ボタン
	UI.hintBtn = mkpill(hm, "？ ヒント", func(): showHint()); place(UI.hintBtn, 1, 0, -58, 10, 0, -1, Control.GROW_DIRECTION_BEGIN); UI.hintBtn.visible = false
	UI.pauseBtn = mkpill(hm, "II", func():
		if STATE == "play": pauseGame()
		elif STATE == "pause": resumeGame()); place(UI.pauseBtn, 1, 0, -50, 8, 40, 40, Control.GROW_DIRECTION_BEGIN)
	# タッチ操作
	var touch := Control.new(); touch.set_anchors_preset(Control.PRESET_FULL_RECT); touch.mouse_filter = Control.MOUSE_FILTER_IGNORE; hm.add_child(touch); UI.touch = touch; touch.visible = false
	var stick := Panel.new(); stick.add_theme_stylebox_override("panel", sbox(Color(1, 1, 1, 0.1), 64, Color(1, 1, 1, 0.28), 2)); stick.size = Vector2(128, 128); place(stick, 0, 1, 34, -170, 128, 128); stick.mouse_filter = Control.MOUSE_FILTER_IGNORE; touch.add_child(stick); UI.stick = stick
	var knob := Panel.new(); knob.add_theme_stylebox_override("panel", sbox(Color(1, 1, 1, 0.35), 27, Color(1, 1, 1, 0.55), 2)); knob.size = Vector2(54, 54); knob.position = Vector2(37, 37); knob.mouse_filter = Control.MOUSE_FILTER_IGNORE; stick.add_child(knob); UI.knob = knob
	UI.tbtns = {}
	for b in [["tRun", "走る", 0, 1, 176, -94, 56], ["tJump", "ジャンプ", 1, 1, -96, -176, 66], ["tCrouch", "しゃが\nむ", 1, 1, -178, -194, 66], ["tUse", "手", 1, 1, -188, -122, 80], ["tThrow", "使う\n投げる", 1, 1, -100, -104, 80], ["tDrop", "置く", 1, 1, -240, -80, 56]]:
		var tb := Button.new(); tb.text = b[1]; tb.focus_mode = Control.FOCUS_NONE; var sz: int = b[6]
		tb.add_theme_stylebox_override("normal", sbox(Color(0.078, 0.1, 0.133, 0.45), int(sz / 2.0), Color(1, 1, 1, 0.45), 2)); tb.add_theme_stylebox_override("pressed", sbox(Color(1, 0.81, 0.23, 0.55), int(sz / 2.0), Color("#ffe066"), 2)); tb.add_theme_stylebox_override("hover", tb.get_theme_stylebox("normal"))
		tb.add_theme_font_override("font", FONT_H); tb.add_theme_font_size_override("font_size", 14 if sz > 60 else 13)
		place(tb, b[2], b[3], b[4], b[5], sz, sz); touch.add_child(tb); UI.tbtns[b[0]] = tb
		var id: String = b[0]
		tb.button_down.connect(func(): touch_btn(id, true)); tb.button_up.connect(func(): touch_btn(id, false))
	UI.sub = mklabel(hud, "", lset(21)); place(UI.sub, 0.5, 0.78, -480, -30, 960, 60); UI.sub.autowrap_mode = TextServer.AUTOWRAP_ARBITRARY; UI.sub.modulate.a = 0; UI.sub.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	UI.skipCut = mkpill(root, "スキップ ▶", func(): CUT.skip = true); place(UI.skipCut, 1, 1, -14, -14, 0, 0, Control.GROW_DIRECTION_BEGIN); UI.skipCut.visible = false
	# ---------- 暗転 ----------
	var fade := ColorRect.new(); fade.color = Color.BLACK; fade.set_anchors_preset(Control.PRESET_FULL_RECT); fade.mouse_filter = Control.MOUSE_FILTER_IGNORE; fade.modulate.a = 0; root.add_child(fade); UI.fade = fade
	# ---------- 画面 ----------
	UI.screens = {}
	# つかまった
	var caught := screen("caught"); var cb := shader_rect("""void fragment(){ float d = length(UV - 0.5) * 1.6; COLOR = vec4(0.0, 0.0, 0.0, mix(0.2, 0.9, clamp(d, 0.0, 1.0))); }"""); caught.add_child(cb); caught.move_child(cb, 0)
	var cv := centerbox(caught); mklabel(cv, "GAME OVER", lset(60, Color("#ff5a4a"), FONT_H)); mklabel(cv, "つかまった！", lset(22))
	# タイトル
	var title := screen("title"); var tg := shader_rect("""void fragment(){ COLOR = vec4(0.04, 0.03, 0.016, smoothstep(0.4, 1.0, UV.y) * 0.55); }"""); title.add_child(tg)
	var logo := VBoxContainer.new(); place(logo, 0.5, 0.09, -400, 0, 800, 200); logo.alignment = BoxContainer.ALIGNMENT_BEGIN; title.add_child(logo); logo.mouse_filter = Control.MOUSE_FILTER_IGNORE; UI.logo = logo
	var h1 := RichTextLabel.new(); h1.bbcode_enabled = true; h1.fit_content = true; h1.scroll_active = false; h1.autowrap_mode = TextServer.AUTOWRAP_OFF; h1.mouse_filter = Control.MOUSE_FILTER_IGNORE; h1.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	h1.add_theme_font_override("normal_font", FONT_H); h1.add_theme_font_size_override("normal_font_size", 92); h1.add_theme_color_override("default_color", Color("#fff5dc"))
	h1.add_theme_constant_override("outline_size", 10); h1.add_theme_color_override("font_outline_color", Color("#5a1f0c")); h1.add_theme_color_override("font_shadow_color", Color("#7a2e14")); h1.add_theme_constant_override("shadow_offset_y", 7); h1.add_theme_constant_override("shadow_offset_x", 0)
	h1.text = "おとなり[color=#ffcf3a]さん[/color]"; h1.rotation = -0.05; h1.pivot_offset = Vector2(400, 60); logo.add_child(h1); UI.h1 = h1
	var tag := RichTextLabel.new(); tag.bbcode_enabled = true; tag.fit_content = true; tag.scroll_active = false; tag.autowrap_mode = TextServer.AUTOWRAP_OFF; tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; tag.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tag.add_theme_font_override("normal_font", FONT_H); tag.add_theme_font_size_override("normal_font_size", 20); tag.add_theme_color_override("font_shadow_color", Color.BLACK); tag.add_theme_constant_override("shadow_offset_y", 2)
	tag.text = "となりの地下室には、なにがある？ [bgcolor=#d8402a]  ALPHA 1  [/bgcolor]"; logo.add_child(tag); UI.tag = tag
	var menu := GridContainer.new(); menu.columns = 1; menu.add_theme_constant_override("v_separation", 12); menu.add_theme_constant_override("h_separation", 10); title.add_child(menu); UI.tmenu = menu
	UI.bNew = mkbtn(menu, "はじめから", "", func(): initAudio(); newGame()); UI.bCont = mkbtn(menu, "つづきから", "sub", func(): initAudio(); contGame())
	mkbtn(menu, "あそびかた", "sub", func(): showScreen("help", true)); mkbtn(menu, "設定", "sub", func(): openSettings())
	for b in menu.get_children(): b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var ver := mklabel(title, "おとなりさん アルファ1（Godot版）", lset(13, Color(1, 1, 1, 0.7), FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); place(ver, 0, 1, 14, -28, 400, 20)
	# あそびかた
	var help := screen("help"); var hp := panel(help, 640, 560)
	hp.add_child(ptitle("あそびかた"))
	var ht := RichTextLabel.new(); ht.bbcode_enabled = true; ht.fit_content = false; ht.custom_minimum_size = Vector2(0, 380); ht.size_flags_vertical = Control.SIZE_EXPAND_FILL; ht.add_theme_font_override("normal_font", FONT_R); ht.add_theme_font_override("bold_font", FONT_H); ht.add_theme_font_size_override("normal_font_size", 15); ht.add_theme_font_size_override("bold_font_size", 15)
	ht.text = HELP_TEXT; hp.add_child(ht); UI.helpText = ht
	var hb := mkbtn(hp, "もどる", "", func(): showScreen("help", false)); hb.size_flags_horizontal = Control.SIZE_SHRINK_CENTER; hb.custom_minimum_size = Vector2(240, 0)
	# 設定
	var sett := screen("settings"); var sp := panel(sett, 560, 0)
	sp.add_child(ptitle("設定"))
	UI.sSens = srow(sp, "視点の感度", 30, 250, 10, func(v): CFG.sens = v / 100.0; save_cfg())
	UI.sInv = crow(sp, "上下反転", func(v): CFG.inv = v; save_cfg())
	UI.sFov = srow(sp, "視野の広さ", 60, 95, 1, func(v): CFG.fov = v; save_cfg())
	var qr := HBoxContainer.new(); sp.add_child(qr); var ql := mklabel(qr, "画質", lset(16, Color.WHITE, FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); ql.size_flags_horizontal = Control.SIZE_EXPAND_FILL; UI.sQ = mklabel(qr, "", lset(16, YEL, FONT_B, false))
	UI.sHints = crow(sp, "ヒントを出す", func(v): CFG.hints = v; save_cfg(); BODY.nohint = not v)
	var sn := mklabel(sp, "音の大きさ・横画面は、左上の⚙（3dameの設定）から変えられます。", lset(13, Color(1, 1, 1, 0.7), FONT_R, false), HORIZONTAL_ALIGNMENT_LEFT); sn.autowrap_mode = TextServer.AUTOWRAP_ARBITRARY
	var sb := mkbtn(sp, "もどる", "", func(): showScreen("settings", false)); sb.size_flags_horizontal = Control.SIZE_SHRINK_CENTER; sb.custom_minimum_size = Vector2(240, 0)
	# ポーズ
	var pause := screen("pause"); var pbg := ColorRect.new(); pbg.color = Color(0, 0, 0, 0.5); pbg.set_anchors_preset(Control.PRESET_FULL_RECT); pause.add_child(pbg); pause.move_child(pbg, 0)
	var pp := panel(pause, 400, 0); pp.add_child(ptitle("ポーズ"))
	mkbtn(pp, "つづける", "", func(): resumeGame()); mkbtn(pp, "あそびかた", "sub", func(): showScreen("help", true)); mkbtn(pp, "設定", "sub", func(): openSettings())
	UI.bSkip = mkbtn(pp, "チュートリアルをとばす", "sub", func():
		showScreen("pause", false); skipTutorial())
	mkbtn(pp, "3dameの設定", "sub", func(): post_parent({h3dOpenPanel = 1}))
	mkbtn(pp, "タイトルへ", "red", func():
		saveGame(); showScreen("pause", false); toTitle())
	# おわり
	var ending := screen("ending"); var eb := ColorRect.new(); eb.color = Color.BLACK; eb.set_anchors_preset(Control.PRESET_FULL_RECT); ending.add_child(eb); ending.move_child(eb, 0)
	var ev := centerbox(ending); UI.endT = mklabel(ev, "THE END", lset(48, YEL, FONT_H)); UI.endP = mklabel(ev, "", lset(16, Color(1, 1, 1, 0.9), FONT_B, false))
	var ebn := mkbtn(ev, "タイトルへ", "", func():
		showScreen("ending", false); toTitle()); ebn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER; ebn.custom_minimum_size = Vector2(240, 0)
	# よみこみ中
	var loading := screen("loading"); var lb := ColorRect.new(); lb.color = Color("#1a140c"); lb.set_anchors_preset(Control.PRESET_FULL_RECT); loading.add_child(lb); loading.move_child(lb, 0)
	var lv := centerbox(loading); mklabel(lv, "よみこみ中…", lset(17, Color.WHITE, FONT_B, false))
	var bar := Panel.new(); bar.custom_minimum_size = Vector2(220, 7); bar.add_theme_stylebox_override("panel", sbox(Color(1, 1, 1, 0.15), 4)); lv.add_child(bar); var bf := ColorRect.new(); bf.color = YEL; bf.size = Vector2(0, 7); bar.add_child(bf); UI.loadBar = bf
	showScreen("loading", true)
	# はじめから？
	var cf := ConfirmationDialog.new(); cf.dialog_text = "はじめからにしますか？（今のセーブは消えます）"; cf.ok_button_text = "はい"; cf.cancel_button_text = "いいえ"; cf.title = "おとなりさん"; root.add_child(cf); UI.confirm = cf
	cf.confirmed.connect(func(): newGameReally())
	BODY.nohint = not CFG.hints
	setup_web_bridge(); layoutTitle()
const HELP_TEXT := """引っ越した先のお向かいさんは、どうも様子がおかしい。あの家の[b]地下室[/b]には何があるのだろう？ 見つからないように忍びこんで、地下室のドアを開けよう。2階の監視室のレバーで監視カメラを切れる。見つかったら走って逃げ、見えない所でクローゼットやベッドの下に隠れればやりすごせる（おとなりさんと同じ部屋で隠れると見つかる）。長く追いかけると、おとなりさんはつかれて見失う。

[color=#ffe066][b]WASD[/b][/color]　移動（Shiftで走る）
[color=#ffe066][b]マウス[/b][/color]　見回す
[color=#ffe066][b]E / F[/b][/color]　拾う・開ける・押す・隠れる（ベッドの下にも）
[color=#ffe066][b]左クリック[/b][/color]　持っている物を使う（鍵・ハンマー・シャベルなど）。長押しして離すと投げる
[color=#ffe066][b]右クリック[/b][/color]　ズーム／目覚まし時計をセットする
[color=#ffe066][b]Q[/b][/color]　持っている物を置く
[color=#ffe066][b]1〜4 / ホイール[/b][/color]　持ち物を選ぶ（4つまで）
[color=#ffe066][b]スペース[/b][/color]　ジャンプ
[color=#ffe066][b]C / Ctrl[/b][/color]　しゃがむ（せまい所を通れる）
[color=#ffe066][b]H[/b][/color]　ヒント
[color=#ffe066][b]Esc[/b][/color]　ポーズ

スマホ：左側をなぞって移動、右側をなぞって見回す。「手」で拾う・開ける、「使う/投げる」を押しっぱなしにして離すと投げる。

おとなりさんは物音を聞きつけてやってくる。見つかると追いかけてくる（追いかけ中は壁ごしでも居場所がばれて、隠れてもむだ）。おとなりさんはこちらより足がおそいので、まずは走って逃げよう。つかまると、入ってきた所をいすでふさがれる。

地下室への道は2つ。ボイラー室のバルブで水を凍らせて監視室のピッキング道具を取る方法と、ベル・シャベル・先生・数字の問題・射的・削岩機で「ハートの銅の鍵」を手に入れる方法。"""
func mkpill(parent: Control, text: String, cb: Callable) -> Button:
	var b := Button.new(); b.text = text; b.focus_mode = Control.FOCUS_NONE
	for st in ["normal", "hover", "pressed", "focus"]:
		var s := sbox(Color(0.078, 0.1, 0.133, 0.55), 100, Color(1, 1, 1, 0.42), 2); s.content_margin_left = 14; s.content_margin_right = 14; s.content_margin_top = 7; s.content_margin_bottom = 7
		b.add_theme_stylebox_override(st, s)
	b.add_theme_font_override("font", FONT_H); b.add_theme_font_size_override("font_size", 15); b.pressed.connect(cb); parent.add_child(b)
	return b
func screen(id: String) -> Control:
	var c := Control.new(); c.set_anchors_preset(Control.PRESET_FULL_RECT); c.visible = false; c.mouse_filter = Control.MOUSE_FILTER_IGNORE; UI.root.add_child(c); UI.screens[id] = c
	return c
func centerbox(parent: Control) -> VBoxContainer:
	var cc := CenterContainer.new(); cc.set_anchors_preset(Control.PRESET_FULL_RECT); cc.mouse_filter = Control.MOUSE_FILTER_IGNORE; parent.add_child(cc)
	var v := VBoxContainer.new(); v.add_theme_constant_override("separation", 10); v.alignment = BoxContainer.ALIGNMENT_CENTER; cc.add_child(v)
	return v
func panel(parent: Control, w: int, h: int) -> VBoxContainer:
	var cc := CenterContainer.new(); cc.set_anchors_preset(Control.PRESET_FULL_RECT); parent.add_child(cc)
	var pc := PanelContainer.new(); var s := sbox(Color(0.11, 0.086, 0.055, 0.92), 18, Color(1, 0.81, 0.23, 0.6), 3); s.content_margin_left = 26; s.content_margin_right = 26; s.content_margin_top = 22; s.content_margin_bottom = 22
	pc.add_theme_stylebox_override("panel", s); pc.custom_minimum_size = Vector2(w, h); cc.add_child(pc)
	var v := VBoxContainer.new(); v.add_theme_constant_override("separation", 12); pc.add_child(v)
	return v
func ptitle(t: String) -> Label:
	var l := Label.new(); l.text = t; l.label_settings = lset(26, YEL, FONT_H, false); l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return l
func srow(parent: Control, name: String, mn: float, mx: float, stp: float, cb: Callable) -> HSlider:
	var r := HBoxContainer.new(); parent.add_child(r); var l := mklabel(r, name, lset(16, Color.WHITE, FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var s := HSlider.new(); s.min_value = mn; s.max_value = mx; s.step = stp; s.custom_minimum_size = Vector2(260, 24); s.focus_mode = Control.FOCUS_NONE; r.add_child(s); s.value_changed.connect(cb)
	return s
func crow(parent: Control, name: String, cb: Callable) -> CheckBox:
	var r := HBoxContainer.new(); parent.add_child(r); var l := mklabel(r, name, lset(16, Color.WHITE, FONT_B, false), HORIZONTAL_ALIGNMENT_LEFT); l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var c := CheckBox.new(); c.focus_mode = Control.FOCUS_NONE; r.add_child(c); c.toggled.connect(cb)
	return c
# ---------- 画面の部品をかえる ----------
func showScreen(id: String, on := true) -> void:
	if UI.screens.has(id): UI.screens[id].visible = on
func setLoad(p: float) -> void:
	if UI.has("loadBar"): UI.loadBar.size.x = 220 * p
var TOAST_T := 0.0
var SUB_T := 0.0
func toast(s: String, t := 2.2) -> void:
	UI.toast.text = s; UI.toast.modulate.a = 1.0; TOAST_T = t
func subtitle(s: String, t := 3.0, big := false) -> void:
	var l: Label = UI.sub; l.text = s; l.label_settings = lset(40 if big else 21)
	if big: place(l, 0.5, 0.42, -480, -40, 960, 80)
	else: place(l, 0.5, 0.78, -480, -60, 960, 60)
	var tw := create_tween(); tw.tween_property(l, "modulate:a", 1.0, 0.4); SUB_T = t
func objective(s: String, sm = null) -> void:
	if not s:
		UI.obj.visible = false; story.obj = ""; return
	if story.obj != s:
		var st: StyleBoxFlat = UI.obj.get_theme_stylebox("panel"); st.bg_color = Color(1, 0.81, 0.23, 0.8)
		var tw := create_tween(); tw.tween_method(func(v: float): st.bg_color = Color(1, 0.81, 0.23, 0.8).lerp(Color(0.078, 0.1, 0.133, 0.55), v), 0.0, 1.0, 0.9); sfx("tick")
	story.obj = s; UI.objSm.text = sm if sm else "やること"; UI.objT.text = s; UI.obj.visible = true; UI.obj.reset_size()
func updTexts(dt: float) -> void:
	if TOAST_T > 0:
		TOAST_T -= dt
		if TOAST_T <= 0: create_tween().tween_property(UI.toast, "modulate:a", 0.0, 0.25)
	if SUB_T > 0:
		SUB_T -= dt
		if SUB_T <= 0: create_tween().tween_property(UI.sub, "modulate:a", 0.0, 0.4)
	if inameT > 0:
		inameT -= dt
		if inameT <= 0: create_tween().tween_property(UI.iname, "modulate:a", 0.0, 0.3)
	# HUD の見え方（body のクラスのかわり）
	UI.hud.visible = BODY.play; UI.hudMain.visible = not BODY.cut
	UI.hintBtn.visible = BODY.main; UI.touch.visible = BODY.touch
	if UI.get("touchLay") != BODY.touch: touchLayout()
	UI.skipCut.visible = BODY.cut and UI.skipCut.get_meta("on", false)
	UI.alarm.modulate.a = 1.0 if int(Time.get_ticks_msec() / 250) % 2 == 0 else 0.0
	if PL.charging: UI.chargeFill.size.x = 84 * PL.charge
# スマホのときは持ち物を少し小さく・下へ（three.js 版の body.touch と同じ）
func touchLayout() -> void:
	UI.touchLay = BODY.touch; var t: bool = BODY.touch; var sz := 52.0 if t else 58.0
	place(UI.inv, 0, 1, 16, -sz - (8 if t else 14), -1, sz, Control.GROW_DIRECTION_END)
	for S in UI.slots:
		S.p.custom_minimum_size = Vector2(sz, sz); S.img.custom_minimum_size = Vector2(42, 42) if t else Vector2(52, 52)
# 画面の大きさ：three.js 版（CSS のピクセル）と同じ見た目の大きさにする。
# 3D の細かさも three.js 版と同じく「画質」で上限を決める（省電力 0.75・標準 1・高 1.5・最高 2 倍まで）
func fit_ui() -> void:
	var w := get_window(); var f := DisplayServer.screen_get_scale()
	if OS.has_feature("web"):
		var iw = JavaScriptBridge.eval("window.innerWidth", true)
		if iw and float(iw) > 0: f = float(w.size.x) / float(iw)
	f = clampf(f, 0.5, 4.0); w.content_scale_factor = f
	var pr: float = minf(f, [0.75, 1.0, 1.5, 2.0][QUAL])
	get_viewport().scaling_3d_scale = clampf(pr / f, 0.25, 2.0)
	if vview:
		var hs := Vector2i((Vector2(w.size) * pr / f).round()); vcont.stretch = false; vcont.set_anchors_preset(Control.PRESET_TOP_LEFT)
		vview.size = hs; vcont.size = Vector2(hs); vcont.scale = Vector2.ONE / pr
	layoutTitle()
# タイトル：three.js 版と同じく、画面の大きさで文字とボタンの並びを変える（高さ 540 より低いと 2列）
func layoutTitle() -> void:
	if not UI.has("tmenu"): return
	var sz := get_viewport().get_visible_rect().size; var W := sz.x; var H := sz.y; var short := H < 540
	var hf := clampf(W * 0.07, 34, 60) if short else clampf(W * 0.1, 46, 96)
	UI.h1.add_theme_font_size_override("normal_font_size", int(hf * 0.96)); UI.h1.add_theme_constant_override("shadow_offset_y", int(hf * 0.075)); UI.h1.add_theme_constant_override("outline_size", int(hf * 0.1))
	UI.tag.add_theme_font_size_override("normal_font_size", 13 if short else int(clampf(W * 0.024, 13, 18) * 1.1))
	place(UI.logo, 0.5, 0.03 if short else 0.09, -W / 2, 0, W, 200); UI.h1.pivot_offset = Vector2(W / 2, hf * 0.6)
	var m: GridContainer = UI.tmenu; m.columns = 2 if short else 1; m.add_theme_constant_override("v_separation", 9 if short else 12)
	var mw := minf(520, W * 0.8) if short else minf(340, W * 0.8)
	for b in BTNS:
		b.add_theme_font_size_override("font_size", 16 if short else 19)
		for st in ["normal", "hover", "pressed", "disabled", "focus"]:
			var bs: StyleBoxFlat = b.get_theme_stylebox(st); bs.content_margin_top = 9 if short else 12; bs.content_margin_bottom = 9 if short else 12
	m.reset_size(); place(m, 0.5, 1, -mw / 2, -H * (0.05 if short else 0.07), mw, 0)
	# あそびかた：画面に収まるように（three.js 版は max-height:88vh でスクロール）
	var ht: RichTextLabel = UI.helpText; var hpc: Control = ht.get_parent().get_parent()
	hpc.custom_minimum_size = Vector2(minf(640, W * 0.92), minf(560, H * 0.88)); ht.custom_minimum_size.y = maxf(80, minf(560, H * 0.88) - (150 if short else 180))
func ui_body(cls: String, on: bool) -> void: BODY[cls] = on
func ui_cls(id: String, cls: String, on: bool) -> void:
	match id:
		"cross":
			UI.cross.scale = Vector2(1.9, 1.9) if on else Vector2.ONE
			(UI.cross.get_theme_stylebox("panel") as StyleBoxFlat).bg_color = Color("#ffe066") if on else Color(1, 1, 1, 0.85)
		"hideView":
			if cls == "on":
				UI.hideView.visible = on; UI.hideTip.visible = on
			elif cls == "under": UI.hideView.material.set_shader_parameter("under", 1.0 if on else 0.0)
		"binoc": UI.binoc.visible = on
		"hurt": UI.hurt.modulate.a = 1.0 if on else 0.0
		"trapFx": create_tween().tween_property(UI.trapFx, "modulate:a", 1.0 if on else 0.0, 0.2)
		"alarm": UI.alarm.visible = on
		"skipCut": UI.skipCut.set_meta("on", on)
		"charge": UI.charge.visible = on
func ui_prompt(s: String) -> void:
	var t := s.replace("[b]", "[bgcolor=#ffe066][color=#2a2110][b] ").replace("[/b]", " [/b][/color][/bgcolor] ").replace("[small]", "\n[font_size=14][color=#ffffffd8]").replace("[/small]", "[/color][/font_size]")
	UI.prompt.text = "[center]" + t + "[/center]"
func ui_iname(s: String) -> void:
	UI.iname.text = s; UI.iname.modulate.a = 1.0
func drawInv() -> void:
	for i in 4:
		var S = UI.slots[i]; var it = PL.inv[i]
		var st := sbox(Color(0.196, 0.196, 0.22, 0.75) if i == PL.sel else Color(0.118, 0.118, 0.133, 0.62), 13, Color(1, 1, 1, 0.9) if i == PL.sel else Color(1, 1, 1, 0.12), 2)
		S.p.add_theme_stylebox_override("panel", st)
		var key: String = iconKey(it) if it else ""
		if S.key != key:
			S.key = key; S.img.texture = makeIcon(it) if it else null
func ui_fade_now(on: bool) -> void:
	if UI.has("fadeTw") and UI.fadeTw: UI.fadeTw.kill()
	UI.fade.modulate.a = 1.0 if on else 0.0
func ui_fade_white(white: bool) -> void: UI.fade.color = Color.WHITE if white else Color.BLACK
func fadeOut(s := 0.6, white := false) -> void:
	ui_fade_white(white)
	if UI.get("fadeTw"): UI.fadeTw.kill()
	UI.fadeTw = create_tween(); UI.fadeTw.tween_property(UI.fade, "modulate:a", 1.0, 0.6)
	await wait(s)
func fadeIn(s := 0.6) -> void:
	if UI.get("fadeTw"): UI.fadeTw.kill()
	UI.fadeTw = create_tween(); UI.fadeTw.tween_property(UI.fade, "modulate:a", 0.0, 0.6)
	await wait(s)
func ui_ending(t: String, p: String) -> void:
	UI.endT.text = t; UI.endP.text = p
# ================= 操作 =================
var lockOn := false
func lockPointer() -> void:
	if BODY.touch or STATE != "play" or MANUAL: return
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED; lockOn = true
func unlockPointer() -> void:
	if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED: Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	lockOn = false
func pauseGame() -> void:
	if STATE != "play": return
	STATE = "pause"; showScreen("pause", true); UI.bSkip.visible = story.part == "move" or story.part == "intro"; IN.f = 0.0; IN.s = 0.0; KEYS.clear(); endCharge(false); unlockPointer()
func resumeGame() -> void:
	showScreen("pause", false); showScreen("help", false); showScreen("settings", false); STATE = "cut" if CUT.on else "play"; lockPointer()
var KEYS := {}
func kdown(k: int) -> bool: return KEYS.has(k)
func keyAxis() -> void:
	if BODY.touch and TOUCHS.stick: return
	IN.f = (1.0 if kdown(KEY_W) or kdown(KEY_UP) else 0.0) - (1.0 if kdown(KEY_S) or kdown(KEY_DOWN) else 0.0)
	IN.s = (1.0 if kdown(KEY_D) or kdown(KEY_RIGHT) else 0.0) - (1.0 if kdown(KEY_A) or kdown(KEY_LEFT) else 0.0)
	IN.run = kdown(KEY_SHIFT); IN.crouch = kdown(KEY_C) or kdown(KEY_CTRL) or TOUCHS.crouch
var lmbT := 0.0
var lmbDown := false
func _input(ev: InputEvent) -> void:
	if not BOOTED or MANUAL: return
	if ev is InputEventKey:
		var k: int = ev.physical_keycode
		if ev.pressed:
			initAudio()
			if STATE == "pause2": return
			if k == KEY_ESCAPE:
				if STATE == "pause": resumeGame()
				elif STATE == "play": pauseGame()
				return
			if STATE == "cut" and (k == KEY_SPACE or k == KEY_ENTER) and UI.skipCut.get_meta("on", false):
				CUT.skip = true; return
			if STATE != "play": return
			BODY.touch = false
			if ev.echo and k != KEY_W: return
			KEYS[k] = true; keyAxis()
			if k == KEY_SPACE: IN.jump = true
			if k == KEY_E or k == KEY_F: doInteract()
			if k == KEY_Q or k == KEY_G: dropHeld()
			if k == KEY_H: showHint()
			if k == KEY_F:
				var H = held()
				if H and H.d.tool == "light": toolUse()
			if k >= KEY_1 and k <= KEY_4: selSlot(k - KEY_1)
		else:
			KEYS.erase(k); keyAxis()
	elif ev is InputEventMouseButton:
		if BODY.touch and ev.device == -1: return
		if ev.pressed:
			initAudio()
			if STATE != "play": return
			if ev.button_index == MOUSE_BUTTON_WHEEL_DOWN: selSlot(PL.sel + 1); return
			if ev.button_index == MOUSE_BUTTON_WHEEL_UP: selSlot(PL.sel - 1); return
			if _over_ui(ev.position): return
			if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
				lockPointer(); return
			if ev.button_index == MOUSE_BUTTON_LEFT: useDown()
			if ev.button_index == MOUSE_BUTTON_RIGHT:
				var H = held()
				if H and H.d.tool == "alarm": armAlarm(H)
				else: IN.zoom = true
		else:
			if ev.button_index == MOUSE_BUTTON_LEFT: useUp()
			if ev.button_index == MOUSE_BUTTON_RIGHT: IN.zoom = false
	elif ev is InputEventMouseMotion:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED or STATE != "play" or PL.frozen: return
		var k: float = 0.0022 * CFG.sens * S3.sens * (1 - PL.zoom * 0.8)
		PL.yaw -= ev.relative.x * k; PL.pitch -= ev.relative.y * k * (-1.0 if CFG.inv else 1.0); PL.pitch = clampf(PL.pitch, -1.5, 1.5)
	elif ev is InputEventScreenTouch or ev is InputEventScreenDrag:
		touch_input(ev)
func _over_ui(p: Vector2) -> bool:
	for k in ["pauseBtn", "hintBtn", "skipCut"]:
		var c: Control = UI[k]
		if c.is_visible_in_tree() and c.get_global_rect().has_point(p): return true
	for s in UI.slots:
		if s.p.is_visible_in_tree() and s.p.get_global_rect().has_point(p): return true
	return false
func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		KEYS.clear(); keyAxis()
# マウスのロックがはずれたら（Esc など）ポーズ
func updPointer() -> void:
	if lockOn and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		lockOn = false
		if STATE == "play" and not BODY.touch: pauseGame()
# 使う・投げる（左クリック／使うボタン）
func useDown() -> void:
	if PL.hide or PL.frozen: return
	lmbDown = true; lmbT = GT
	if nearStand() and not PL.useTarget:
		shootRange(); lmbDown = false; return
	if PL.useTarget:
		useHeldOnTarget(); lmbDown = false; return
	var H = held()
	if not H:
		if PL.target: doInteract()
		lmbDown = false; return
	if H.d.tool: PL.toolPending = true
	else: startCharge()
func useUp() -> void:
	if not lmbDown: return
	lmbDown = false
	if PL.get("toolPending"):
		PL.toolPending = false
		if GT - lmbT < 0.3:
			toolUse(); return
	if PL.charging: endCharge(true)
func startCharge() -> void:
	PL.charging = true; PL.charge = 0.0; ui_cls("charge", "on", true)
func endCharge(doThrow: bool) -> void:
	if not PL.charging: return
	PL.charging = false; ui_cls("charge", "on", false)
	if doThrow: throwHeld(PL.charge)
func updCharge(dt: float) -> void:
	updPointer()
	if PL.get("toolPending") and lmbDown and GT - lmbT > 0.3:
		PL.toolPending = false; startCharge()
	if PL.charging:
		PL.charge = minf(1, PL.charge + dt * 1.1)
		if not held(): endCharge(false)
# ---- タッチ ----
var TOUCHS := {stick = null, look = null, crouch = false, run = false}
func touch_input(ev: InputEvent) -> void:
	initAudio(); BODY.touch = true
	if STATE != "play": return
	var W := get_viewport().get_visible_rect().size.x
	if ev is InputEventScreenTouch:
		if ev.pressed:
			if _over_touch_btn(ev.position): return
			if ev.position.x < W * 0.42 and not TOUCHS.stick:
				TOUCHS.stick = {id = ev.index, x0 = ev.position.x, y0 = ev.position.y}; UI.stick.position = ev.position - Vector2(64, 64)
			elif not TOUCHS.look:
				TOUCHS.look = {id = ev.index, x = ev.position.x, y = ev.position.y, t0 = GT, moved = 0.0}
		else:
			if TOUCHS.stick and ev.index == TOUCHS.stick.id:
				TOUCHS.stick = null; IN.f = 0.0; IN.s = 0.0; IN.run = TOUCHS.run; UI.knob.position = Vector2(37, 37); place(UI.stick, 0, 1, 34, -170, 128, 128)
			if TOUCHS.look and ev.index == TOUCHS.look.id:
				if TOUCHS.look.moved < 10 and GT - TOUCHS.look.t0 < 0.3 and STATE == "play": doInteract() # 軽くタップしたら「手」
				TOUCHS.look = null
	elif ev is InputEventScreenDrag:
		if TOUCHS.stick and ev.index == TOUCHS.stick.id:
			var dx: float = ev.position.x - TOUCHS.stick.x0; var dy: float = ev.position.y - TOUCHS.stick.y0; var l := Vector2(dx, dy).length(); var m := 52.0
			if l > m:
				dx *= m / l; dy *= m / l
			UI.knob.position = Vector2(37 + dx, 37 + dy); IN.f = -dy / m; IN.s = dx / m
			if absf(IN.f) < 0.15: IN.f = 0.0
			if absf(IN.s) < 0.15: IN.s = 0.0
			IN.run = TOUCHS.run or (l >= m * 0.98 and -dy / m > 0.85)
		if TOUCHS.look and ev.index == TOUCHS.look.id:
			var d: Vector2 = ev.position - Vector2(TOUCHS.look.x, TOUCHS.look.y); TOUCHS.look.x = ev.position.x; TOUCHS.look.y = ev.position.y; TOUCHS.look.moved += absf(d.x) + absf(d.y)
			if STATE == "play" and not PL.frozen:
				var k: float = 0.0048 * CFG.sens * S3.sens * (1 - PL.zoom * 0.8); PL.yaw -= d.x * k; PL.pitch -= d.y * k * (-1.0 if CFG.inv else 1.0); PL.pitch = clampf(PL.pitch, -1.5, 1.5)
func _over_touch_btn(p: Vector2) -> bool:
	for k in UI.tbtns:
		if UI.tbtns[k].get_global_rect().has_point(p): return true
	return _over_ui(p)
func touch_btn(id: String, down: bool) -> void:
	initAudio()
	if STATE != "play": return
	match id:
		"tJump":
			if down: IN.jump = true
		"tUse":
			if down: doInteract()
		"tThrow":
			if down: useDown()
			else: useUp()
		"tDrop":
			if down: dropHeld()
		"tCrouch":
			if down:
				TOUCHS.crouch = not TOUCHS.crouch; IN.crouch = TOUCHS.crouch
		"tRun":
			if down:
				TOUCHS.run = not TOUCHS.run; PL.run = TOUCHS.run
# ---- 設定 ----
func openSettings() -> void:
	showScreen("settings", true); UI.sSens.set_value_no_signal(roundf(CFG.sens * 100)); UI.sInv.set_pressed_no_signal(CFG.inv); UI.sFov.set_value_no_signal(CFG.fov); UI.sHints.set_pressed_no_signal(CFG.hints)
	UI.sQ.text = {eco = "省電力", normal = "標準", high = "高", max = "最高"}.get(S3.quality, "高")
# ---- タイトル ----
var DIRTY := false
func toTitle() -> void:
	STATE = "title"; unlockPointer(); showScreen("title", true); BODY.play = false; BODY.main = false; BODY.cut = false; UI.bCont.disabled = not hasSave(); setMusic("title"); objective(""); NB.active = false
	setEnv("evening"); nbVisible(true); nbTeleport(-3, 0, 10.6, PI); NB.anim = "idle"; NB.state = "off"; NB.look = 0.0; ui_cls("hideView", "on", false); PL.hide = null
func freshStart(mode: String) -> void:
	store_set("otonari-a1-auto", mode); get_tree().reload_current_scene()
func newGame() -> void:
	if hasSave():
		UI.confirm.popup_centered(); return
	newGameReally()
func newGameReally() -> void:
	store_set(SAVEKEY, null)
	if DIRTY:
		freshStart("new"); return
	DIRTY = true; showScreen("title", false); BODY.play = true; STATE = "play"; story.flags = {}; story.stats = {time = 0.0, caught = 0, sleeps = 0}; runIntro()
func contGame() -> void:
	if DIRTY:
		freshStart("cont"); return
	DIRTY = true; showScreen("title", false); BODY.play = true; STATE = "play"
	if not loadGame():
		runIntro(); return
	lockPointer()
func skipTutorial() -> void:
	ui_fade_now(false); story.gen += 1; STATE = "play"; BODY.cut = false; CUT.on = false; CUT.cam = null; CUT.skip = true; later(0.08, func(): CUT.skip = false)
	for i in 4:
		var it = PL.inv[i]
		if it:
			PL.inv[i] = null; propRestAt(it, it.home.x, it.home.y, it.home.z, it.home.yaw)
	H1.ebox.on = true; H1.ebox.open = true; H1.eboxLid.m.tgt = 1.0; H1.ebox.sw.rotation.x = -0.7
	for b in P.boxes: propRestAt(b, rr(-4, -1), 0.31, rr(-27, -24), 0)
	parkMyCar(5.6, -12, PI); nbBinoc(false); startMain(false); lockPointer()
# ---- 3dame（ランチャー）とのやりとり（Web のとき）----
var _js_cb = null
func setup_web_bridge() -> void:
	if not IS_WEB: return
	_js_cb = JavaScriptBridge.create_callback(_on_web_message)
	var w = JavaScriptBridge.get_interface("window")
	w.addEventListener("message", _js_cb)
func _on_web_message(args) -> void:
	var e = args[0]; var d = e.data
	if d == null: return
	var o = d.h3dSet
	if o:
		if typeof(o.sound) == TYPE_BOOL: S3.sound = o.sound
		if typeof(o.vol) == TYPE_FLOAT or typeof(o.vol) == TYPE_INT: S3.vol = float(o.vol)
		if typeof(o.sens) == TYPE_FLOAT or typeof(o.sens) == TYPE_INT: S3.sens = float(o.sens)
		applyVol()
func post_parent(msg: Dictionary) -> void:
	if not IS_WEB: return
	JavaScriptBridge.eval("try{parent.postMessage(%s,'*')}catch(e){}" % JSON.stringify(msg), true)
