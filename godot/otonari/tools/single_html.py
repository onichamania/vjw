# Godot の Web 書き出し（build/web）を、HTML ファイル1つにまとめる
#  - index.js・音のワークレット・画像は中に入れる
#  - index.wasm / index.pck は gzip して base64 で中に入れ、ブラウザの中で元に戻して Godot に渡す
# 使い方: python3 tools/single_html.py build/web 出力.html
import sys, os, gzip, base64

src, out = sys.argv[1], sys.argv[2]
rd = lambda n: open(os.path.join(src, n), 'rb').read()
txt = lambda n: rd(n).decode('utf-8')
b64 = lambda b: base64.b64encode(b).decode('ascii')

html = txt('index.html')
sizes = {n: len(rd(n)) for n in ('index.wasm', 'index.pck')}
blobs = ''.join('<script type="application/octet-stream" id="gz-%s">%s</script>\n' % (n, b64(gzip.compress(rd(n), 9))) for n in sizes)
# script の中に入れても閉じタグにならないように
js = lambda s: s.replace('</script', '<\\/script')
worklets = {n: js(txt(n)) for n in ('index.audio.worklet.js', 'index.audio.position.worklet.js')}

shim = '''<script>
// まとめて入れた .wasm / .pck を、ブラウザの中で元に戻して Godot に渡す（ネットにつながなくても動く）
(function () {
  const SIZES = %s;
  async function unpack(name) {
    const b = document.getElementById('gz-' + name).textContent.trim();
    let gz;
    try { gz = (await fetch('data:application/octet-stream;base64,' + b)).body; }
    catch (e) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); gz = new Blob([u]).stream(); }
    return gz.pipeThrough(new DecompressionStream('gzip'));
  }
  const orig = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const name = url.split('?')[0].split('/').pop();
    if (SIZES[name]) return unpack(name).then((body) => new Response(body, { status: 200, headers: {
      'Content-Type': name.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream', 'Content-Length': String(SIZES[name]) } }));
    return orig(input, init);
  };
  // ファイルを直接開いたときは、Godot が調べる service worker が使えないので、無いことにする
  if (location.protocol === 'file:' && navigator.serviceWorker) {
    try { navigator.serviceWorker.getRegistration = () => Promise.resolve(undefined); } catch (e) {}
  }
  // 音のワークレットも中に入れたものを使う
  const W = %s;
  if (window.AudioWorklet) {
    const add = AudioWorklet.prototype.addModule;
    AudioWorklet.prototype.addModule = function (url, opt) {
      const name = String(url).split('?')[0].split('/').pop();
      const code = W[name] || W[name.replace(/^godot\\./, 'index.')];
      // ファイルを直接開いたとき（file://）は blob: が使えないので data: にする
      if (code) url = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(code);
      return add.call(this, url, opt);
    };
  }
})();
</script>''' % (repr(sizes).replace("'", '"'), '{%s}' % ','.join('"%s": %s' % (k, json_str) for k, json_str in ((k, __import__('json').dumps(v)) for k, v in worklets.items())))

for n, mime in (('index.png', 'image/png'), ('index.icon.png', 'image/png'), ('index.apple-touch-icon.png', 'image/png')):
    html = html.replace('"%s"' % n, '"data:%s;base64,%s"' % (mime, b64(rd(n))))
html = html.replace('<script src="index.js"></script>', blobs + shim + '\n<script>\n' + js(txt('index.js')) + '\n</script>', 1)
html = html.replace('<html lang="en">', '<html lang="ja">', 1)
assert 'src="index.js"' not in html
open(out, 'w', encoding='utf-8').write(html)
print(out, os.path.getsize(out))
