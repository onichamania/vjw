# game.gd の行番号 -> src の部品と行番号
import sys,os
D=os.path.dirname(os.path.abspath(__file__))
M=[(int(a),b) for a,b in (l.split() for l in open(os.path.join(D,'linemap.txt')) if l.strip())]
for x in sys.argv[1:]:
    n=int(x);best=None
    for a,b in M:
        if a<=n:best=(a,b)
    print(x,'->',best[1],n-best[0]+1)
