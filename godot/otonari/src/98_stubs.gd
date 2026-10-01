
# ---- 仮の部品（あとで本物に入れかえる）----
var TOUCH := false
var story := {part = "", step = 0, flags = {}, stats = {time = 0, caught = 0, sleeps = 0}, usedEntry = null, obj = "",
	canSleep = func(): return false, sleepMsg = func(): return "", sleep = func(): pass}
var P := {}
var CUT := {on = false, cam = null, skip = false}
var NB := {state = "idle", anim = "idle", look = 0.0, sawHide = null, p = Vector3()}
func sfx(_k: String, _a = null) -> void: pass
func sfxStep(_s: String, _v := 0.6) -> void: pass
func sfxGlass(_p: Vector3, _v := 1.0) -> void: pass
func sfxImpact(_pr, _sp, _s) -> void: pass
func sfxDoor(_d, _o) -> void: pass
func toast(s: String, _t := 2.2) -> void: print("TOAST ", s)
func ui_cls(_id: String, _c: String, _on: bool) -> void: pass
func ui_prompt(_s: String) -> void: pass
func ui_iname(_s: String) -> void: pass
func drawInv() -> void: pass
func setLoad(_p: float) -> void: pass
func setup_ui() -> void: pass
func showScreen(_n: String, _on: bool) -> void: pass
func toTitle() -> void: STATE = "title"
func newGame() -> void: pass
func contGame() -> void: pass
class Waiter extends RefCounted:
	signal done
	var t := 0.0
	var fn = null
var WAITS := []
func wait(s: float) -> Signal:
	var w := Waiter.new(); w.t = GT + s; WAITS.append(w)
	return w.done
func after(s: float, fn: Callable) -> void:
	var w := Waiter.new(); w.t = GT + s; w.fn = fn; WAITS.append(w)
func later(s: float, fn: Callable) -> void:
	get_tree().create_timer(s, true).timeout.connect(fn)
func updWaits() -> void:
	for i in range(WAITS.size() - 1, -1, -1):
		if i >= WAITS.size(): continue
		if GT >= WAITS[i].t or CUT.skip:
			var w = WAITS[i]; WAITS.remove_at(i)
			if w.fn: w.fn.call()
			else: w.done.emit()
func updTexts(_dt: float) -> void: pass
func updStory(_dt: float) -> void: pass
func updNeighbor(_dt: float) -> void: pass
func updLearning(_dt: float) -> void: pass
func updCutCam(_dt: float) -> void: pass
func updCharge(_dt: float) -> void: pass
func updCamLeds() -> void: pass
func updAudio(_dt: float) -> void: pass
func updTrain(_dt: float) -> void: pass
func animNB(_dt: float) -> void: pass
func a1Update(_dt: float) -> void: pass
func toggleSuitcase(_pr) -> void: pass
func takeSlot(_s) -> void: pass
func putSlot(_s, _it) -> void: pass
func setPropHot(_pr, _on) -> void: pass
func playerInWater() -> bool: return false
func placeA1Props() -> void: pass
func onNProperty(_o) -> bool: return false
func nbNoteHide(_h) -> void: pass
func initPropDefsA1() -> void: pass
func fallFaint() -> void: pass
func buildTrain() -> void: pass
func buildShark() -> void: pass
func buildNeighbor() -> void: pass
func buildNavA1() -> void: pass
func buildElevator() -> void: pass
func buildCamerasA1() -> void: pass
func buildBricks() -> void: pass
func buildBaseLock() -> void: pass
func armAlarm(_pr) -> void: pass
func underBedFind() -> void: pass
func mkBedHide(x: float, y: float, z: float, yaw: float, bx, out, name := "", onEnter = null) -> Dictionary:
	var h := {pos = Vector3(x, y + 0.28, z), yaw = yaw, box = bx, out = out, name = name if name else "ベッドの下", under = true, cab = null, nb = null, it = null}
	h.it = addIt({box = bx, label = func(_it): return {t = "ベッドの下に隠れる", k = "E", n = name if name else "ベッド"}, act = func():
		enterHide(h)
		if onEnter: onEnter.call()})
	HIDES.append(h)
	return h
