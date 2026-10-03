#!/usr/bin/env python3
"""Package the Web export for hosting as a single page plus a few files.

usage: python3 tools/package_web.py EXPORT_DIR OUT_DIR [--hub PLATFORM_JS]

EXPORT_DIR is where the "Web" preset wrote index.html/js/wasm/pck.
OUT_DIR receives:
  page.html                      the loading page (web/page.html with sizes filled in)
  index.js                       Godot's loader, patched so touches and mouse
                                 motion are mapped back when the page turns the
                                 canvas 90° (window.__gdRot, the launcher's
                                 sideways mode), and without its English
                                 "context lost" alert (the page has its own)
  engine-gz.wasm                 index.wasm, gzip-compressed (unpacked in the browser)
  game-pck.wasm                  index.pck
  index.audio*.worklet.js        audio worklets
With --hub, page.html also becomes a complete document with the launcher's
frame-rate limiter (PLATFORM_JS, a file with the script) at the top, for
serving inside the "3dgame" launcher.
"""
import gzip
import pathlib
import re
import shutil
import sys

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
hub = sys.argv[4] if len(sys.argv) > 4 and sys.argv[3] == "--hub" else None
out.mkdir(parents=True, exist_ok=True)

js = (src / "index.js").read_text(encoding="utf-8")
pos_old = "computePosition:function(evt,rect){const canvas=GodotConfig.canvas;"
pos_new = pos_old + ("if(window.__gdRot){return[(evt.clientY-rect.y)/rect.height*canvas.width,"
                     "(1-(evt.clientX-rect.x)/rect.width)*canvas.height]}")
mov_old = ("const rw=canvas.width/rect.width;const rh=canvas.height/rect.height;"
           "const rel_pos_x=evt.movementX*rw;const rel_pos_y=evt.movementY*rh;")
mov_new = ("const rot=!!window.__gdRot;const rw=canvas.width/(rot?rect.height:rect.width);"
           "const rh=canvas.height/(rot?rect.width:rect.height);"
           "const rel_pos_x=(rot?evt.movementY:evt.movementX)*rw;"
           "const rel_pos_y=(rot?-evt.movementX:evt.movementY)*rh;")
# the page shows its own (Japanese) message with a reload button instead
lost_old = 'alert("WebGL context lost, please reload the page");'
lost_new = ''
for old, new in ((pos_old, pos_new), (mov_old, mov_new), (lost_old, lost_new)):
    assert js.count(old) == 1, old
    js = js.replace(old, new)
(out / "index.js").write_text(js, encoding="utf-8")

wasm = (src / "index.wasm").read_bytes()
(out / "engine-gz.wasm").write_bytes(gzip.compress(wasm, 9))
shutil.copy(src / "index.pck", out / "game-pck.wasm")
for w in ("index.audio.worklet.js", "index.audio.position.worklet.js"):
    shutil.copy(src / w, out / w)

page = (root / "web" / "page.html").read_text(encoding="utf-8")
sizes = {"WASM_GZ_SIZE": (out / "engine-gz.wasm").stat().st_size,
         "WASM_SIZE": len(wasm),
         "PCK_SIZE": (src / "index.pck").stat().st_size}
for k, v in sizes.items():
    page, n = re.subn(r"var %s = \d+;" % k, "var %s = %d;" % (k, v), page)
    assert n == 1, k
if hub:
    platform = pathlib.Path(hub).read_text(encoding="utf-8")
    page = ('<!DOCTYPE html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
            "<script>" + platform + "</script>\n" + page + "\n</html>\n")
(out / "page.html").write_text(page, encoding="utf-8")
print(sizes)
