# ホーム画面に追加して全画面で遊べる版（GitHub Pages 用）を作る
#  - ランチャー（3dgame/index.html）に、ホーム画面からアプリのように開くための設定を足す
#  - アイコン・manifest・Godot版おとなりさんのファイルをいっしょに置く
# 使い方: python3 3dgame/make_site.py 出力フォルダ [Godot版のWeb書き出し（webgz）のフォルダ]
import sys, os, shutil, json

HERE = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1]
godot = sys.argv[2] if len(sys.argv) > 2 else None
os.makedirs(out, exist_ok=True)

html = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()
meta = '''<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="3dgame">
<meta name="theme-color" content="#000000">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" href="icon-192.png">
'''
key = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
assert html.count(key) == 1
html = html.replace(key, key + meta, 1)
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html)

manifest = {
    'name': '3dgame', 'short_name': '3dgame', 'lang': 'ja',
    'start_url': './', 'scope': './',
    'display': 'fullscreen', 'display_override': ['fullscreen', 'standalone'],
    'orientation': 'any', 'background_color': '#000000', 'theme_color': '#000000',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'}],
}
json.dump(manifest, open(os.path.join(out, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for n in ('icon-180.png', 'icon-192.png', 'icon-512.png'):
    shutil.copy(os.path.join(HERE, 'site', n), os.path.join(out, n))
open(os.path.join(out, '.nojekyll'), 'w').close()

if godot:
    dst = os.path.join(out, 'otonari-godot')
    if os.path.exists(dst): shutil.rmtree(dst)
    shutil.copytree(godot, dst)

open(os.path.join(out, 'README.md'), 'w', encoding='utf-8').write(
    '# 3dgame\n\nスマホのホーム画面に追加して、全画面で遊べるゲーム集です。\n\n'
    'https://onichamania.github.io/3dgame/ を Safari などで開き、共有ボタン →「ホーム画面に追加」。\n')
for n in sorted(os.listdir(out)): print(n)
