# Wiki（Bee Swarm Simulator Wiki）から取ってきた表を、ゲームで使う JS のデータにする
# 使い方: python3 tools/gen_data.py <wikiの生データのフォルダ> <quests.json> > src/01_gen.js
import sys,re,json
RAW,QJ=sys.argv[1],sys.argv[2]
F={'Sunflower Field':'sunflower','Dandelion Field':'dandelion','Mushroom Field':'mushroom','Blue Flower Field':'blueflower','Clover Field':'clover','Strawberry Field':'strawberry',
 'Spider Field':'spider','Bamboo Field':'bamboo','Pineapple Patch':'pineapple','Pineapple patch':'pineapple','Pineapple Field':'pineapple','Stump Field':'stump','Cactus Field':'cactus','Pumpkin Patch':'pumpkin','Pumpkin Field':'pumpkin',
 'Pine Tree Forest':'pinetree','Pine Tree Field':'pinetree','Rose Field':'rose','Mountain Top Field':'mountaintop','Pepper Patch':'pepper','Coconut Field':'coconut','Ant Field':'ant'}
TOK={'Buzz Bomb':'buzzbomb','Buzz Bomb+':'buzzbomb2','Blue Bomb':'bluebomb','Blue Bomb+':'bluebomb2','Red Bomb':'redbomb','Red Bomb+':'redbomb2','Blue Boost':'blueboost','Red Boost':'redboost','White Boost':'whiteboost',
 'Haste':'haste','Focus':'focus','Pollen Mark':'pollenmark','Pollen Mark+':'pollenmark2','Honey Mark':'honeymark','Honey Mark+':'honeymark2','Token Link':'tokenlink','Rage':'rage','Honey Gift':'honeygift','Honey Gift+':'honeygift2',
 'Baby Love':'babylove','Melody':'melody','Inflate Balloon':'balloon','Surprise Party':'party','Fuzz Bombs':'fuzzbomb','Pollen Haze':'haze','Target Practice':'target','Inferno':'inferno','Flame Fuel':'flamefuel',
 'Summon Frog':'frog','Triangulate':'triangulate','Mark Surge':'marksurge','Bear Morph':'bearmorph','Blue Pulse':'bluepulse','Red Pulse':'redpulse','Blue Bomb Sync':'bluesync','Red Bomb Sync':'redsync',
 'Glitch':'glitch','Mind Hack':'mindhack','Map Corruption':'corrupt','Festive Gift':'festivegift','Festive Mark':'festivemark','Glob':'glob','Gumdrop Barrage':'barrage','Beamstorm':'beamstorm',
 'Puppy Love':'puppylove','Fetch':'fetch','Scratch':'scratch','Tabby Love':'tabbylove','Impale':'impale','Rain Cloud':'raincloud','Tornado':'tornado'}
t=open(RAW+'/Template_Bee Stats Table.txt').read()
rows=t.split('\n|-\n')[2:]
def clean(s):
    s=re.sub(r'\[\[File:[^\]]*\]\]','',s);s=re.sub(r'\{\{Cost\|Honey\|([^}|]*)[^}]*\}\}',r'\1',s);s=re.sub(r'\{\{Cost\|([^}|]*)[^}]*\}\}',r'\1',s)
    s=re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]',r'\1',s);s=re.sub(r'\[\[([^\]]*)\]\]',r'\1',s);s=re.sub(r'<br>',' ',s);s=re.sub(r'</li>\s*<li>','|',s);s=re.sub(r'</?li>','',s);s=re.sub(r'data-sort-value=[^|]*\|','',s)
    return re.sub(r'\s+',' ',s).strip()
bees=[]
for r in rows:
    r=r.split('\n|}')[0];cells=[]
    for line in r.split('\n'):
        line=line.strip()
        if not line.startswith('|'):
            if cells:cells[-1]+=' '+line
            continue
        cells+=line[1:].split('||')
    c=[clean(x) for x in cells]
    if len(c)<16:continue
    name,rar,col,en,spd,atk,ga,gt,cv,ct,other,gift,toks,pas,likes,dis=c[:16]
    num=lambda s:float(re.findall(r'[\d.]+',s)[0]) if re.findall(r'[\d.]+',s) else 0
    tk=[]
    for x in toks.split('|'):
        x=x.strip()
        if not x or x=='-':continue
        m=re.match(r'([^()]+?)\s*(\((Gifted|Festive Wreath|Reindeer Antlers)\))?\s*$',x)
        nm=m.group(1).strip() if m else x
        for part in nm.split(' / '):
            part=part.strip()
            if part in TOK:tk.append(TOK[part]+('@g' if m and m.group(3)=='Gifted' else '' ) if not (m and m.group(3) in ('Festive Wreath','Reindeer Antlers')) else None)
    tk=[x for x in tk if x]
    lk=[F.get(x.strip()) for x in likes.split('|') if F.get(x.strip())]
    dk=[F.get(x.strip()) for x in dis.split('|') if F.get(x.strip())]
    bees.append(dict(en=name.replace(' Bee',''),rar=rar,col={'Colorless':'w','Red':'r','Blue':'b'}[col],energy=(1e12 if en=='Unlimited' else num(en)),spd=num(spd),atk=num(atk),
        ga=num(ga),gt=num(gt),cv=num(cv),ct=num(ct),gift=gift,tok=tk,pas=('' if pas=='-' else pas),likes=lk,dislikes=dk))
print('// 自動生成（tools/gen_data.py）: Bee Swarm Simulator Wiki の Bee Stats Table より')
print('const BEE_TABLE='+json.dumps(bees,ensure_ascii=False)+';')
# ---- クエスト ----
Q=json.load(open(QJ))
MOB={'Ladybug':'ladybug','Rhino Beetle':'rhino','Spider':'spider','Mantis':'mantis','Mantise':'mantis','Scorpion':'scorpion','Werewolf':'werewolf','Werewolve':'werewolf','Werewolfs':'werewolf'}
ITEM={'Treat':'treat','Treats':'treat','Sunflower Seed':'sunflowerseed','Sunflower Seeds':'sunflowerseed','Strawberry':'strawberry','Strawberries':'strawberry','Pineapple':'pineapple','Pineapples':'pineapple',
 'Blueberry':'blueberry','Blueberries':'blueberry','Royal Jelly':'royaljelly','Royal Jellies':'royaljelly','Ticket':'ticket','Silver Egg':'silveregg','Gold Egg':'goldegg','Diamond Egg':'diamondegg','Star Egg':'staregg',
 'Star Treat':'startreat','Gumdrops':'gumdrops','Field Dice':'fielddice','Star Jelly':'starjelly','Moon Charm':'mooncharm','Stinger':'stinger','Magic Bean':'magicbean','Glue':'glue','Oil':'oil','Enzymes':'enzymes',
 'Glitter':'glitter','Red Extract':'redextract','Blue Extract':'blueextract','Micro-Converter':'microconverter','Bitterberry':'bitterberry','Neonberry':'neonberry','Atomic Treat':'atomictreat','Tropical Drink':'tropicaldrink',
 'Smooth Dice':'smoothdice','Loaded Dice':'loadeddice','Soft Wax':'softwax','Hard Wax':'hardwax','Whirligig':'whirligig','Mythic Egg':'mythicegg','Honeysuckle':'honeysuckle','Purple Potion':'purplepotion','Super Smoothie':'supersmoothie',
 'Night Bell':'nightbell','Jelly Beans':'jellybeans','Coconut':'coconut','Spirit Petal':'spiritpetal'}
TK2={'Red Boost':'redboost','Blue Boost':'blueboost','Haste':'haste','Focus':'focus','Bomb':'bomb','Buzz Bomb':'buzzbomb','Melody':'melody','Pollen Mark':'pollenmark','Honey Mark':'honeymark','Token Link':'tokenlink','Rage':'rage','Baby Love':'babylove','Ability':'any','Honey':'honeytok','Treat':'treattok'}
def n_(s):return int(float(s.replace(',','')))
def preq(s):
    s=s.strip().rstrip('.').replace('the ','')
    m=re.match(r'Collect ([\d,]+) (?:(White|Red|Blue) )?Pollen(?: from ([A-Za-z ]+))?$',s)
    if m:
        o={'t':'pollen','n':n_(m.group(1))}
        if m.group(2):o['c']=m.group(2)[0].lower()
        if m.group(3):
            f=F.get(m.group(3).strip())
            if not f:return None
            o['f']=f
        return o
    m=re.match(r'Defeat ([\d,]+) ([A-Za-z ]+?)s?$',s)
    if m:
        k=m.group(2).strip()
        mob=MOB.get(k) or MOB.get(k.rstrip('s'))
        if not mob:return None
        return {'t':'kill','n':n_(m.group(1)),'m':mob}
    m=re.match(r'Feed ([\d,]+) ([A-Za-z ]+?) to your Bees$',s)
    if m:
        it=ITEM.get(m.group(2).strip())
        return {'t':'feed','n':n_(m.group(1)),'i':it} if it else None
    m=re.match(r'Raise (a|[\d,]+) Bees? to Level (\d+)$',s)
    if m:return {'t':'level','n':1 if m.group(1)=='a' else n_(m.group(1)),'l':int(m.group(2))}
    m=re.match(r'Use ([\d,]+) Royal Jell(y|ies)$',s)
    if m:return {'t':'use','n':n_(m.group(1)),'i':'royaljelly'}
    m=re.match(r'Discover ([\d,]+) Bee Types$',s)
    if m:return {'t':'discover','n':n_(m.group(1))}
    m=re.match(r'Collect ([\d,]+) ([A-Za-z ]+?) Tokens$',s)
    if m and TK2.get(m.group(2)):return {'t':'token','n':n_(m.group(1)),'k':TK2[m.group(2)]}
    return None
def prew(arr):
    out=[];start=[]
    for r in arr:
        acc='when quest accepted' in r;r=re.sub(r'\(.*?\)','',r).strip()
        m=re.match(r'([\d,]+)\s*x?\s*honey$',r,re.I)
        if m:out.append(['honey',n_(m.group(1))]);continue
        m=re.match(r'([\d,]+)\s*x?\s*(.+)$',r)
        if not m:continue
        nm=m.group(2).strip()
        if nm=='Science Enhancement':out.append(['science',1]);continue
        if nm=='Polar Power':out.append(['polar',1]);continue
        it=ITEM.get(nm)
        if not it:continue
        (start if acc else out).append([it,n_(m.group(1))])
    return out,start
QOUT={}
for npc,key,limit in [('Black Bear','black',None),('Mother Bear','mother',14),('Panda Bear','panda',None),('Science Bear','science',None),('Polar Bear','polar',20)]:
    L=[]
    for q in Q[npc][:limit] if limit else Q[npc]:
        if 'Egg Hunt' in q['name'] or 'before nerf' in q['name'] or 'Drive' in q['name']:continue
        reqs=[preq(r) for r in q['req']]
        if not reqs or any(r is None for r in reqs):continue
        rw,st=prew(q['reward'])
        L.append({'name':q['name'].replace('Polar Bear: ',''),'req':reqs,'rw':rw,'st':st})
    QOUT[key]=L
print('const QUEST_TABLE='+json.dumps(QOUT,ensure_ascii=False)+';')
# Brown Bear（ずっと続くクエスト）
t=open(RAW+'/Brown Bear.txt').read();i=t.find('=== Possible quests');seg=t[i:i+9000]
BB=[]
for nm,minb,body in re.findall(r'\|(Brown Bear: [^\n]+)\n\|(\d+)\n\|\n((?:\* [^\n]+\n?)+)',seg):
    reqs=[]
    for x,col,f in re.findall(r'P\(([\d.]+)\)</math> (?:(White|Red|Blue) )?Pollen from (?:the )?([^.\n]+?)\.',body):
        o={'t':'pollen','x':float(x),'f':F[f.strip()]}
        if col:o['c']=col[0].lower()
        reqs.append(o)
    for x,col in re.findall(r'P\(([\d.]+)\)</math> (White|Red|Blue) Pollen\.',body):
        reqs.append({'t':'pollen','x':float(x),'c':col[0].lower()})
    BB.append({'name':nm.replace('Brown Bear: ',''),'min':int(minb),'req':reqs})
print('const BROWN_TABLE='+json.dumps(BB,ensure_ascii=False)+';')
sys.stderr.write('bees %d quests %s brown %d\n'%(len(bees),{k:len(v) for k,v in QOUT.items()},len(BB)))
