# src の中身を1つの HTML（3dgame/gemrush.html）にまとめる
# 使い方: python3 tools/build.py
import os
HERE=os.path.dirname(os.path.abspath(__file__));SRC=os.path.join(HERE,'..','src');OUT=os.path.join(HERE,'..','..','gemrush.html')
fs=sorted(os.listdir(SRC))
parts=[open(os.path.join(SRC,'00_head.html'),encoding='utf-8').read()]
for f in fs:
    if f.endswith('.js'):
        js=open(os.path.join(SRC,f),encoding='utf-8').read()
        assert '</script' not in js,f
        parts.append(js)
parts.append(open(os.path.join(SRC,'99_tail.html'),encoding='utf-8').read())
html=''.join(parts)
open(OUT,'w',encoding='utf-8').write(html)
print(os.path.relpath(OUT),len(html))
