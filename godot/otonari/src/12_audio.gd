
# ================= 音 =================
# three.js 版は WebAudio でその場で作っていた音を、前もって WAV にしてある（tools の書き出し道具で作成）。
# ここでは それを鳴らすだけ。位置のある音は距離で小さくし、左右は Godot が決める。
var AU := {ready = false, streams = {}, players = {}, pool3d = [], loops = {}}
const LOOP_PEAK := {furn = 2.456, hum = 1.779, fire = 1.428, tvnoise = 1.0, wind = 1.0}
const SFX_GAIN := 1.0          # 効果音（書き出しのときに 0.9 をかけてある）
const AMB_GAIN := 0.5 / 0.9    # まわりの音
const MUS_GAIN := 0.55 / 0.9   # 音楽
func au_stream(name: String) -> AudioStream:
	if AU.streams.has(name): return AU.streams[name]
	var p := "res://assets/audio/%s.wav" % name
	var s: AudioStream = load(p) if ResourceLoader.exists(p) else null
	AU.streams[name] = s
	return s
func initAudio() -> void:
	if AU.ready: return
	AU.ready = true
	var master := AudioServer.get_bus_index("Master")
	var comp := AudioEffectCompressor.new(); comp.threshold = -10; comp.ratio = 4
	AudioServer.add_bus_effect(master, comp)
	applyVol()
func applyVol() -> void:
	var master := AudioServer.get_bus_index("Master")
	var v: float = S3.vol if S3.sound else 0.0
	AudioServer.set_bus_volume_db(master, linear_to_db(maxf(v, 0.0001)))
	AudioServer.set_bus_mute(master, v <= 0.0)
func ok() -> bool: return S3.sound
# ---- 位置のない音 ----
func play2d(name: String, vol := 1.0, pitch := 1.0) -> void:
	if not ok() or vol <= 0.0005: return
	var s := au_stream(name)
	if s == null: return
	var p: AudioStreamPlayer = AU.players.get(name)
	if p == null:
		p = AudioStreamPlayer.new(); p.stream = s; p.max_polyphony = 6; add_child(p); AU.players[name] = p
	p.volume_db = linear_to_db(vol); p.pitch_scale = pitch; p.play()
# ---- 位置のある音（距離で小さく）----
func spatialV(pos: Vector3, near := 2.0, far := 30.0) -> float:
	var c := camPos(); var d := pos.distance_to(c)
	var v := 1.0 if d < near else maxf(0.0, 1.0 - (d - near) / (far - near))
	return v * v
func play3d(name: String, pos: Vector3, vol := 1.0, near := 2.0, far := 30.0, pitch := 1.0) -> void:
	if not ok(): return
	var v := spatialV(pos, near, far) * vol
	if v < 0.003: return
	var s := au_stream(name)
	if s == null: return
	var pl: AudioStreamPlayer3D = null
	for q in AU.pool3d:
		if not q.playing:
			pl = q; break
	if pl == null:
		if AU.pool3d.size() >= 24: pl = AU.pool3d[0]
		else:
			pl = AudioStreamPlayer3D.new(); pl.attenuation_model = AudioStreamPlayer3D.ATTENUATION_DISABLED; pl.panning_strength = 0.8; pl.max_db = 6; pl.doppler_tracking = AudioStreamPlayer3D.DOPPLER_TRACKING_DISABLED
			scene.add_child(pl); AU.pool3d.append(pl)
	pl.stream = s; pl.global_position = pos; pl.volume_db = linear_to_db(v); pl.pitch_scale = pitch; pl.play()
func rnd3() -> int: return randi() % 3
# ---- 効果音 ----
func sfxStep(s: String, v := 0.6) -> void:
	var k := "wood"
	if s == "grass" or s == "metal" or s == "carpet" or s == "water" or s == "ice" or s == "dirt": k = s
	elif s == "stone" or s == "tile": k = "stone"
	play2d("step_%s_%d" % [k, rnd3()], v * 0.9)
func sfxNbStep(pos: Vector3, run: bool) -> void:
	var grass := groundAt(pos.x, pos.y + 0.2, pos.z) <= -1
	play3d("nbstep_wood_%s_%d" % ["run" if run else "walk", randi() % 2], pos, 1.0 if not grass else 0.8, 2, 32, 1.6 if grass else 1.0)
func sfxDoor(d: Dictionary, open: bool) -> void:
	play3d("door_%s_%d" % ["open" if open else "close", randi() % 2], Vector3(d.hx, d.y + 1, d.hz), 1.0, 2, 25)
func sfxGlass(pos: Vector3, v := 1.0) -> void: play3d("glass_%d" % (randi() % 2), pos, v, 3, 40)
func sfxImpact(pr: Dictionary, sp: float, s: String) -> void:
	var v := clampf(sp / 10, 0.15, 1) * (1.0 if pr.d.w > 1 else 0.7); var t: String = pr.type; var k := "soft_grass" if s == "grass" else "soft"
	if t == "trashcan" or t == "lid" or t == "crowbar" or t == "pot" or t == "can" or t == "watering_can": k = "metal"
	elif pr.d.glass or t == "plate" or t == "cup": k = "glass"
	elif t == "ball": k = "ball"
	play3d("impact_%s_%d" % [k, randi() % 2], pr.p, v, 2, 30)
func sfxVoice(k: String, pos: Vector3) -> void: play3d("voice_" + k, pos, 1.0, 3, 40)
func sfxTrain(pos: Vector3) -> void: play3d("train", pos, 1.0, 3, 34)
func sfxWhistle(pos: Vector3) -> void: play3d("whistle", pos, 1.0, 4, 60)
func sfxTick(pos: Vector3) -> void: play3d("tickpos", pos, 1.0, 1.5, 14)
func sfxRing(pos: Vector3) -> void: play3d("ring", pos, 1.0, 2, 30)
func sfx(k: String, a = null) -> void:
	if not ok(): return
	match k:
		"throw": play2d("throw", (0.18 + (a if a != null else 0.0) * 0.2) / 0.28)
		"hammer": play2d("hammer", a if a != null else 1.0)
		"drawer": play2d("drawer_o" if a else "drawer_c")
		"cab": play2d("cab_c" if a is bool and a == false else "cab_o")
		"ladder": play2d("ladder_%d" % rnd3())
		"ladderN": play3d("ladder_%d" % rnd3(), NB.p, 0.12 / 0.07, 2, 25, 0.9)
		"crash": play2d("crash", 1.241)
		_: play2d(k)
# ---- ずっと鳴る音（発電機・冷蔵庫・火・テレビ）----
func setLoop(key: String, pos, vol: float, near := 2.0, far := 22.0, dt := 0.016) -> void:
	var L = AU.loops.get(key)
	if L == null:
		var s := au_stream("loop_" + key)
		if s == null: return
		var pl
		if pos == null:
			pl = AudioStreamPlayer.new()
		else:
			pl = AudioStreamPlayer3D.new(); pl.attenuation_model = AudioStreamPlayer3D.ATTENUATION_DISABLED; pl.panning_strength = 0.7; pl.max_db = 12
		pl.stream = s; pl.volume_db = -80
		if pos == null: add_child(pl)
		else: scene.add_child(pl)
		L = {pl = pl, v = 0.0}; AU.loops[key] = L
	var v := vol
	if pos != null and vol > 0:
		L.pl.global_position = pos; v *= spatialV(pos, near, far)
	v *= LOOP_PEAK.get(key, 1.0)
	L.v = L.v + (v - L.v) * (1.0 - exp(-dt / 0.15))
	if not ok(): L.v = 0.0
	if L.v > 0.0005:
		if not L.pl.playing: L.pl.play()
		L.pl.volume_db = linear_to_db(L.v)
	elif L.pl.playing: L.pl.stop()
func updLoops(dt: float) -> void:
	var furn = A.get("furn")
	setLoop("furn", Vector3(5, 1.2, 27.2), 0.03 if furn and furn.cold else 0.12, 2, 14, dt); setLoop("fire", Vector3(5, 0.8, 27.2), 0.12 if furn and not furn.cold else 0.0, 1.5, 10, dt)
	setLoop("hum", null, 0.05 if PL.inHouse and STATE == "play" else 0.0, 2, 22, dt); setLoop("tvnoise", Vector3(-9.5, 1, 19.2), 0.25 if A.get("tvOn") else 0.0, 2, 18, dt)
# ---- まわりの音 ----
var birdT := 0.0
func updAmbience(dt: float) -> void:
	if not ok(): return
	birdT -= dt; var outside: bool = not PL.inHouse
	if birdT <= 0:
		birdT = 1.5 + randf() * 4; var T: String = ENV.mode
		if T == "day" and outside: play2d("amb_bird_%d" % (randi() % 4), AMB_GAIN, 1.0 + randf() * 0.2)
		elif T == "night": play2d("amb_night", AMB_GAIN)
		elif T == "dusk":
			play2d("amb_dusk", AMB_GAIN)
			if randf() < 0.3: play2d("amb_dusk2", AMB_GAIN)
	setLoop("wind", null, (0.12 if outside else 0.03) * AMB_GAIN, 2, 22, dt)
# ================= 音楽 =================
# 曲は1周ぶんを録音してあり、つなぎ目なくくり返す
var MUS := {cur = null, want = null, vol = 0.0, chaseTrack = 1, players = {}}
func setMusic(name) -> void: MUS.want = name
func updMusic(dt: float) -> void:
	if MUS.want != MUS.cur: # フェードして切りかえ
		MUS.vol = maxf(0, MUS.vol - dt * (0.8 if MUS.cur == "chase" else 1.5))
		if MUS.vol <= 0 or MUS.cur == null:
			if MUS.cur != null and MUS.players.has(MUS.cur): MUS.players[MUS.cur].stop()
			MUS.cur = MUS.want
			if MUS.cur != null:
				var p: AudioStreamPlayer = MUS.players.get(MUS.cur)
				if p == null:
					p = AudioStreamPlayer.new(); p.stream = au_stream("music_" + MUS.cur); add_child(p); MUS.players[MUS.cur] = p
				if p.stream: p.play(0.0)
	else: MUS.vol = minf(1, MUS.vol + dt * (4.0 if MUS.cur == "chase" else 0.5))
	if MUS.cur != null and MUS.players.has(MUS.cur):
		var v: float = MUS.vol * (0.8 if MUS.cur == "sneak" else 1.0) * MUS_GAIN
		MUS.players[MUS.cur].volume_db = linear_to_db(maxf(v, 0.00001))
func updChaseMusic(_dt: float) -> void: pass
func updAudio(dt: float) -> void:
	if not AU.ready: return
	updMusic(dt); updLoops(dt); updAmbience(dt)
