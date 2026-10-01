# src/*.gd をつなげて game.gd を作る（部品どうしは同じクラスになる）
import os,glob,sys
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parts=sorted(glob.glob(os.path.join(D,'src','*.gd')))
out=[];lines=0;MAP=[]
for p in parts:
    s=open(p,encoding='utf-8').read().rstrip('\n')+'\n'
    MAP.append((lines+1,os.path.basename(p)))
    out.append(s);lines+=s.count('\n')
open(os.path.join(D,'game.gd'),'w',encoding='utf-8').write(''.join(out))
open(os.path.join(D,'tools','linemap.txt'),'w').write('\n'.join(f'{a} {b}' for a,b in MAP))
print('game.gd',lines,'lines from',len(parts),'parts')
