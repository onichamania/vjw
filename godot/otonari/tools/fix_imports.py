# 取りこみ設定：3D用の絵はミップマップあり・軽い圧縮。くり返す音はループ。
import glob,re,os
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def setp(path,kv):
    s=open(path).read()
    for k,v in kv.items():
        if re.search(r'^'+re.escape(k)+'=.*$',s,re.M): s=re.sub(r'^'+re.escape(k)+'=.*$',f'{k}={v}',s,flags=re.M)
        else: s=s.rstrip('\n')+f'\n{k}={v}\n'
    open(path,'w').write(s)
n=0
for d in ('tex','canvas'):
    for p in glob.glob(f'{D}/assets/{d}/*.png.import'):
        setp(p,{'compress/mode':'1','compress/lossy_quality':'0.88','mipmaps/generate':'true','detect_3d/compress_to':'0'});n+=1
for p in glob.glob(f'{D}/assets/audio/*.wav.import'):
    b=os.path.basename(p)
    if b.startswith('loop_') or b.startswith('music_'): setp(p,{'edit/loop_mode':'2','edit/loop_begin':'0','edit/loop_end':'-1'});n+=1
print('patched',n)
