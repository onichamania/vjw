// ================= トロルヘイムの形（Wiki の画像を見て）=================
// ---- 木・岩・結晶 ----
Object.assign(NODE_BUILD,{
 tpine(b){treeTrunk(b,.7,'#7a4a2a',.18);[[1.2,1,1.0],[1,.82,1.6],[.8,.62,2.15],[.55,.42,2.6]].forEach(([h,r,y],i)=>b.add(G.cyl(r*.55,r,h*.7,7),i%2?'#b8b030':'#a6a228',T(0,y,0,0,i*.4,0)))},
 redoak(b){b.add(G.cyl(.32,.48,1.6,6),'#6a3a1a',T(0,.8,0));b.add(G.cyl(.08,.14,.8,4),'#6a3a1a',T(.45,1.6,0,0,0,-.8));b.add(G.cyl(.08,.14,.8,4),'#6a3a1a',T(-.42,1.7,.1,.2,0,.8));
   b.add(G.ico(1.05,0),'#f08a1a',T(0,2.35,0,0,0,0,1.2,.75,1.2));b.add(G.ico(.75,0),'#f5a02a',T(.75,2.1,.3,.3,.4,0,1.1,.7,1.1));b.add(G.ico(.7,0),'#e07a10',T(-.75,2.15,-.2,0,.8,.2,1.1,.7,1.1));b.add(G.ico(.55,0),'#ffb840',T(0,2.85,.1))},
 wheat(b){for(let i=0;i<9;i++){const a=i/9*Math.PI*2,r=i?.32+(i%2)*.12:0;b.add(G.cone(.09,.9+(i%3)*.12,4),i%2?'#f0c040':'#e0a828',T(Math.cos(a)*r,.45,Math.sin(a)*r,(Math.random()-.5)*.2,0,(Math.random()-.5)*.2))}},
 crock2(b){b.add(G.dod(.8),'#8a7a72',T(0,.55,0,.3,.2,0,1,.8,1));b.add(G.dod(.5),'#9c8c84',T(.6,.32,.3,.5,.8,0));b.add(G.dod(.38),'#76665e',T(-.55,.28,-.25,.1,.4,.3))},
 azr2(b){b.add(G.dod(.55),'#5a6474',T(0,.28,0,0,0,0,1.2,.6,1.2));[[0,.85,0,.62,.3],[.5,.62,.25,.45,.8],[-.45,.55,-.25,.45,.2],[.15,.5,-.5,.38,1.1],[-.2,.6,.45,.35,.6]].forEach(([x,y,z,s,r])=>b.add(G.box(s,s,s),'#2f7cf0',T(x,y,z,r,r*.7,.3)))},
 arock(b){b.add(G.dod(.85),'#c8a888',T(0,.65,0,.3,.2,.1,.9,1.05,.9));b.add(G.dod(.48),'#d8b898',T(.62,.32,.3,.5,.8,0));b.add(G.dod(.36),'#b89878',T(-.6,.26,-.25,.1,.4,.3))},
 coal(b){b.add(G.dod(.8),'#4a5058',T(0,.6,0,.3,.2,0,1,.85,1));[[.4,.95,.2,.25],[-.35,.8,-.25,.22],[.05,1.15,-.15,.2],[.5,.5,-.3,.18]].forEach(([x,y,z,s])=>b.add(G.dod(s),'#1a1a20',T(x,y,z)));b.add(G.dod(.45),'#3a4048',T(-.6,.3,.3))},
 barna(b){b.add(G.dod(.85),'#7a8490',T(0,.6,0,.3,.2,0,1,.85,1));for(let i=0;i<8;i++){const a=i*.8,y=.3+(i%3)*.3;b.add(G.cone(.1,.14,5),'#f0ece0',T(Math.cos(a)*.7,y,Math.sin(a)*.7,Math.sin(a)*1.4,0,-Math.cos(a)*1.4))}},
 ame2(b){b.add(G.dod(.5),'#4a3a5a',T(0,.22,0,0,0,0,1.2,.5,1.2));[[0,.9,0,.27,1.5,0],[.38,.65,.18,.2,1.1,.45],[-.35,.6,-.12,.2,1,-.5],[.06,.55,-.42,.17,.9,.3],[-.1,.6,.4,.17,.95,-.3]].forEach(([x,y,z,r,h,t])=>{b.add(G.cyl(r,r,h*.75,6),'#b25cf0',T(x,y,z,t*.5,0,t));b.add(G.cone(r,h*.35,6),'#d08cff',T(x+Math.sin(-t)*h*.5,y+h*.52,z,t*.5,0,t))})},
 sdead(b){b.add(G.cyl(.14,.3,2,5),'#6a6a5e',T(0,1,0,0,0,.06));b.add(G.cyl(.07,.11,.9,4),'#6a6a5e',T(.34,1.55,0,0,0,-.9));b.add(G.cyl(.06,.1,.8,4),'#6a6a5e',T(-.3,1.8,.1,.2,0,.9));
   [[.62,1.62,0],[-.58,1.92,.12],[.1,2.1,-.3],[.3,1.2,.2]].forEach(([x,y,z])=>b.add(G.cyl(.03,.02,.5,3),'#a8c040',T(x,y-.25,z)))},
 outh(b){b.add(G.box(1,1.7,1),'#b8a078',T(0,.85,0));b.add(G.box(1.15,.12,1.15),'#8a7454',T(0,1.76,0,0,0,.08));b.add(G.box(.55,1.2,.04),'#a08a64',T(0,.65,.51));b.add(G.box(.5,.12,1.05),'#9ac040',T(0,1.6,0))},
 scrap(b){[[0,.2,0,0,0,.3],[.2,.3,.1,0,1.2,-.4],[-.25,.25,-.1,0,2.1,.2],[.1,.45,-.2,0,.6,.7]].forEach(([x,y,z,rx,ry,rz])=>b.add(G.box(1.5,.12,.3),'#8a5a3a',T(x,y,z,rx,ry,rz)));
   b.add(G.cyl(.42,.42,.12,10),'#c8d0dc',T(0,.7,0,Math.PI/2.4,0,.2));for(let i=0;i<8;i++){const a=i/8*Math.PI*2;b.add(G.box(.14,.14,.12),'#c8d0dc',T(Math.cos(a)*.48,.7+Math.sin(a)*.48*.42,Math.sin(a)*.48*.9,0,0,a))}b.add(G.box(.3,.5,.06),'#4a8ab0',T(-.4,.6,.3,0,.4,.3))},
 cblock(b){b.add(G.box(1.1,1.1,1.1),'#22222a',T(0,.6,0,.1,.3,.05));b.add(G.box(.6,.6,.6),'#2e2e38',T(.6,.3,.4,.3,.6,0));b.add(G.box(.45,.45,.45),'#1a1a22',T(-.55,.25,-.4,.2,.2,.4))},
 vrock(b){b.add(G.dod(.82),'#6a3a34',T(0,.6,0,.3,.2,0,1,.85,1));b.add(G.dod(.5),'#7a4a40',T(.6,.32,.3,.5,.8,0));b.add(G.ico(.12,0),'#ff8a2a',T(.2,1.05,.3));b.add(G.ico(.1,0),'#ff8a2a',T(-.3,.9,-.2))},
 amber(b){b.add(G.dod(.45),'#5a3a2a',T(0,.2,0,0,0,0,1.2,.5,1.2));[[0,.85,0,.3],[.38,.6,.2,.22],[-.35,.6,-.15,.22]].forEach(([x,y,z,s])=>b.add(G.oct(s),'#ffa020',T(x,y,z,0,.4,0,1,1.7,1)))},
 ura2(b){NODE_BUILD.ura(b);b.add(G.cyl(.15,.15,.7,6),'#5ce04a',T(.1,.45,-.4))},
 ruby2(b){NODE_BUILD.ruby(b);b.add(G.oct(.22),'#f0284a',T(-.1,.55,.45,.3,.5,0,1,1.5,1))},
 key(b){b.add(G.cyl(.45,.55,.45,6),'#8a939d',T(0,.22,0));b.add(G.tor(.22,.07,Math.PI*2,12),'#ffd21f',T(0,1.25,0));b.add(G.box(.1,.6,.08),'#ffd21f',T(0,.75,0));b.add(G.box(.22,.08,.08),'#ffd21f',T(.08,.55,0));b.add(G.box(.16,.08,.08),'#ffd21f',T(.06,.7,0))},
 icepick(b){b.add(G.box(1.1,1.2,1.1),'#bfe8ff',T(0,.6,0,0,.4,0));b.add(G.cyl(.05,.05,1.1,5),'#a8723e',T(0,1.3,0,0,0,.3));b.add(G.box(.08,.12,.8),'#5ff0f0',T(-.16,1.8,0,0,0,.3))}});
Object.assign(STUMP_OF,{tpine:'tree',redoak:'tree',sdead:'tree',wheat:'shroom',outh:'chest',scrap:'rock',crock2:'rock',arock:'rock',coal:'rock',barna:'rock',vrock:'rock',cblock:'rock',azr2:'crystal',ame2:'crystal',amber:'crystal',ura2:'crystal',ruby2:'crystal',key:'crystal',icepick:'crystal'});
// ---- 飾り ----
Object.assign(DECO_BUILD,{
 leaf(b){for(let i=0;i<4;i++)b.add(G.ico(.1,0),i%2?'#f08a1a':'#e0b030',T((i-1.5)*.12,.04,(i%2)*.1,0,0,0,1,.25,1))},
 mushO(b){b.add(G.cyl(.04,.05,.18,5),'#f6ead6',T(0,.09,0));b.add(G.hemi(.13,6),'#f07a1a',T(0,.17,0))},
 bushO(b){b.add(G.ico(.3,0),'#d87a20',T(0,.2,0));b.add(G.ico(.2,0),'#f0a030',T(.22,.14,.1))},
 reed(b){for(let i=0;i<5;i++)b.add(G.cone(.04,.6,3),'#6a8a2a',T((i-2)*.06,.3,(i%2)*.05,0,0,(i-2)*.12));b.add(G.cyl(.03,.03,.12,4),'#6a4a2a',T(0,.6,0))},
 lily(b){b.add(G.cyl(.18,.18,.02,7),'#5a9a3a',T(0,.02,0));b.add(G.ico(.05,0),'#f0a0c0',T(.05,.06,.04))},
 shell(b){b.add(G.cone(.08,.14,6),'#f4e8e0',T(0,.05,0,Math.PI/2,0,0));b.add(G.hemi(.07,6),'#f0c0b0',T(.15,.02,.05))},
 plank(b){b.add(G.box(.55,.05,.14),'#9a6a40',T(0,.03,0,0,.4,0))},
 crysB(b){b.add(G.oct(.12),'#5aa0ff',T(0,.15,0,0,0,0,1,1.8,1))},
 crysR(b){b.add(G.oct(.12),'#ff4a5a',T(0,.15,0,0,0,0,1,1.8,1))}});
Object.assign(DECO_SETS,{autumn:['leaf','leaf','grass','mushO','bushO'],swamp:['reed','reed','lily','mush'],beach:['shell','plank','pebble','shell'],dungeon:['stal','crysB','pebble','stal'],dungeonR:['stal','ember','crysR']});
const DECO_GLOW={glow:0x208070,ember:0x802000,crys:0x206010,crysB:0x1a3a90,crysR:0x801020};
// ---- 建物 ----
Object.assign(BLD_BUILD,{
 mill(b){b.add(G.cyl(.85,1.15,2.8,8),'#e8dcc4',T(0,1.4,0));b.add(G.cone(1.15,1.1,8),'#e0b040',T(0,3.35,0));b.add(G.box(.6,1,.1),'#8a5a3a',T(0,.5,1.08));b.add(G.cyl(.15,.15,.4,6),'#8a5a3a',T(0,2.4,1.1,Math.PI/2,0,0));
   for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;b.add(G.box(.32,1.7,.06),'#f4ecd8',T(Math.cos(a)*.95,2.4+Math.sin(a)*.95,1.3,0,0,a-Math.PI/2))}b.add(G.ico(.16,0),'#7ae0ff',T(0,2.4,1.33))},
 barn(b){b.add(G.box(2,1.4,1.5),'#c43a2a',T(0,.7,0));b.add(G.box(1.2,.12,1.7),'#8a2a1e',T(-.45,1.62,0,0,0,.6));b.add(G.box(1.2,.12,1.7),'#8a2a1e',T(.45,1.62,0,0,0,-.6));
   b.add(G.box(.8,1,.08),'#f4ecd8',T(0,.5,.76));b.add(G.box(.6,.8,.06),'#a8281e',T(0,.5,.79));[[-1.3],[1.3]].forEach(([x])=>b.add(G.box(.08,.5,1.6),'#c89a60',T(x,.25,0)));
   b.add(G.ico(.32,1),'#f4f0e8',T(1.35,.45,.9));b.add(G.sph(.14,6,5),'#3a3a3a',T(1.62,.55,.95))},
 coalT(b){BLD_BUILD.trade(b,'#3a3a48')},
 tailorR(b){b.add(G.box(2,.12,1.1),'#a8704a',T(0,.82,0));[[-.85,-.45],[.85,-.45],[-.85,.45],[.85,.45]].forEach(([x,z])=>b.add(G.box(.12,.8,.12),'#7a4a2a',T(x,.4,z)));
   b.add(G.cyl(.32,.32,.1,10),'#8a5a3a',T(.55,1.25,0,Math.PI/2,0,0));b.add(G.box(.5,.25,.35),'#3a7ab0',T(-.4,1.0,0));
   b.add(G.cyl(.04,.04,2.4,5),'#7a4a2a',T(-1.2,1.2,-.6));b.add(G.cyl(.04,.04,2.4,5),'#7a4a2a',T(1.2,1.2,-.6));b.add(G.cyl(.015,.015,2.4,3),'#f0f0f0',T(0,2.3,-.6,0,0,Math.PI/2));
   b.add(G.box(.45,.5,.04),'#ffd21f',T(-.5,2.0,-.6));b.add(G.box(.35,.55,.04),'#4a8af0',T(.2,1.98,-.6));b.add(G.box(.12,.4,.04),'#4a8af0',T(.1,1.65,-.6));b.add(G.box(.12,.4,.04),'#4a8af0',T(.3,1.65,-.6));
   b.add(G.box(.4,.25,.02),'#e04a3a',T(-1.2,2.3,-.45))},
 dockN(b){BLD_BUILD.dock(b)},dockS(b){BLD_BUILD.dock(b)},
 dock(b){for(let i=0;i<6;i++)b.add(G.box(.42,.1,1.6),i%2?'#c98a4c':'#b9773f',T(-1.25+i*.5,.12,0));[[-1.4,-.7],[1.4,-.7],[-1.4,.7],[1.4,.7]].forEach(([x,z])=>b.add(G.cyl(.08,.08,.8,5),'#7a4a24',T(x,0,z)));
   // 船
   b.add(G.box(2.4,.45,1),'#8a4a24',T(0,.55,-1.4));b.add(G.box(.9,.4,.75),'#8a4a24',T(1.45,.6,-1.4,0,Math.PI/4,0,1,1,.75));b.add(G.box(2.2,.08,.85),'#c98a4c',T(0,.8,-1.4));
   b.add(G.cyl(.06,.06,2.4,5),'#6a3a1a',T(-.1,2,-1.4));b.add(G.box(1.2,1.3,.04),'#f4ecd8',T(.45,2.1,-1.4,0,0,0));b.add(G.box(.4,.25,.02),'#e04a3a',T(-.1,3.25,-1.4))}});
// ---- 人（つかまった人たちとガイアへのポータル）----
function makeNpc(k){const C={farmer:{shirt:'#e04a3a',pants:'#3a7ad0',hat:'#8a5a2a'},tailor:{shirt:'#a05ad0',pants:'#5a3a8a',hat:null,glass:1},captain:{shirt:'#2a4a8a',pants:'#2a2a34',hat:'#1a2a4a',cap:1}}[k];
  return partMesh(b=>{b.add(G.cyl(.22,.26,.55,8),C.shirt,T(0,.85,0));b.add(G.cyl(.09,.08,.45,6),C.pants,T(-.1,.35,0));b.add(G.cyl(.09,.08,.45,6),C.pants,T(.1,.35,0));b.add(G.sph(.27,8,6),'#f4f0ec',T(0,1.38,0));
    b.add(G.cyl(.07,.06,.42,6),C.shirt,T(-.3,.85,0,0,0,.3));b.add(G.cyl(.07,.06,.42,6),C.shirt,T(.3,.85,0,0,0,-.3));
    if(C.hat){b.add(G.cyl(.42,.42,.04,10),C.hat,T(0,1.6,0));b.add(G.cyl(.22,.26,.25,8),C.hat,T(0,1.72,0))}if(C.cap)b.add(G.box(.5,.06,.2),'#ffd21f',T(0,1.66,.18));if(C.glass)b.add(G.box(.36,.08,.04),'#ffd21f',T(0,1.4,.26))})}
function cageMesh(){const b=new MB();b.add(G.cyl(.85,.85,.12,10),'#5a5a62',T(0,.06,0));b.add(G.cyl(.85,.85,.12,10),'#5a5a62',T(0,2.1,0));for(let i=0;i<10;i++){const a=i/10*Math.PI*2;b.add(G.cyl(.04,.04,2.1,4),'#8a8a94',T(Math.cos(a)*.82,1.08,Math.sin(a)*.82))}b.add(G.box(.3,.3,.1),'#ffd21f',T(0,1.0,.86));const m=new THREE.Mesh(b.geo(),VCMAT);m.castShadow=true;return m}
// ---- 敵 ----
function rig(){const g=new THREE.Group(),P={};return{g,P,add(n,mesh,x,y,z){const p=new THREE.Group();p.position.set(x,y,z);p.add(mesh);g.add(p);P[n]=p;return p}}}
const limbM=(r,h,c)=>partMesh(b=>{b.add(G.cyl(r,r*.85,h,6),c,T(0,-h/2,0))});
function trollModel(sk,cl,o){o=o||{};const R=rig();
  R.add('body',partMesh(b=>{b.add(G.sph(.55,8,6),sk,T(0,0,0,0,0,0,1,1.1,.9));b.add(G.cyl(.56,.6,.35,8),cl,T(0,-.35,0));if(o.belt)b.add(G.cyl(.57,.57,.08,8),o.belt,T(0,-.15,0))}),0,1.05,0);
  R.add('head',partMesh(b=>{b.add(G.sph(.36,8,6),sk,T(0,.25,0));b.add(G.cone(.1,.42,4),sk,T(-.4,.35,0,0,0,1.3));b.add(G.cone(.1,.42,4),sk,T(.4,.35,0,0,0,-1.3));b.add(G.cone(.09,.25,4),sk,T(0,.2,.36,Math.PI/2,0,0));
    b.add(G.box(.42,.07,.06),'#2a2a2a',T(0,.38,.32));b.add(G.sph(.05,4,3),'#ffffff',T(-.12,.3,.32));b.add(G.sph(.05,4,3),'#ffffff',T(.12,.3,.32));
    if(o.hair)b.add(G.cone(.12,.4,5),o.hair,T(0,.68,0));if(o.horn){b.add(G.cone(.07,.35,5),o.horn,T(-.22,.6,0,0,0,.4));b.add(G.cone(.07,.35,5),o.horn,T(.22,.6,0,0,0,-.4))}if(o.helm)b.add(G.hemi(.4,9),o.helm,T(0,.32,0))}),0,1.65,0);
  R.add('armL',limbM(.15,.75,sk),-.62,1.45,0);R.add('armR',limbM(.15,.75,sk),.62,1.45,0);R.add('legL',limbM(.17,.6,sk),-.25,.65,0);R.add('legR',limbM(.17,.6,sk),.25,.65,0);
  if(o.club){const w=partMesh(b=>{b.add(G.cyl(.08,.16,.9,6),o.club,T(0,-.45,0))});w.position.y=-.75;w.rotation.x=Math.PI/2;R.P.armR.add(w)}return R}
function quadModel(k){const R=rig();
  if(k==='bear'){const c='#a8683a';R.add('body',partMesh(b=>{b.add(G.sph(.6,8,6),c,T(0,0,0,0,0,0,1,.85,1.35));b.add(G.sph(.36,8,6),c,T(0,.25,.78));b.add(G.sph(.17,6,5),'#d8a878',T(0,.15,1.08));b.add(G.sph(.05,4,3),'#1a1a1a',T(0,.2,1.24));
      b.add(G.sph(.1,5,4),c,T(-.24,.55,.7));b.add(G.sph(.1,5,4),c,T(.24,.55,.7));b.add(G.sph(.04,4,3),'#1a1a1a',T(-.13,.35,1.08));b.add(G.sph(.04,4,3),'#1a1a1a',T(.13,.35,1.08))}),0,.78,0);
    R.add('armL',limbM(.14,.55,c),-.3,.55,.5);R.add('armR',limbM(.14,.55,c),.3,.55,.5);R.add('legL',limbM(.15,.5,c),-.3,.5,-.5);R.add('legR',limbM(.15,.5,c),.3,.5,-.5)}
  else{const c='#8ab040';R.add('body',partMesh(b=>{b.add(G.box(.7,.38,1.4),c,T(0,0,0));b.add(G.box(.55,.28,.8),c,T(0,0,.95));b.add(G.box(.5,.08,.7),'#e04a3a',T(0,-.06,1.0));b.add(G.cone(.28,1.1,5),c,T(0,0,-1.2,-Math.PI/2,0,0));
      for(let i=0;i<4;i++)b.add(G.cone(.07,.2,4),'#6a9030',T(0,.25,.5-i*.35));b.add(G.sph(.08,4,3),'#ffe040',T(-.2,.18,.75));b.add(G.sph(.08,4,3),'#ffe040',T(.2,.18,.75))}),0,.42,0);
    R.add('armL',limbM(.1,.3,c),-.4,.3,.45);R.add('armR',limbM(.1,.3,c),.4,.3,.45);R.add('legL',limbM(.1,.3,c),-.4,.3,-.45);R.add('legR',limbM(.1,.3,c),.4,.3,-.45)}return R}
function spiderModel(q){const R=rig(),c=q?'#6a5a66':'#6e6668',acc=q?'#c050f0':'#40d8f0';
  R.add('body',partMesh(b=>{b.add(G.sph(.42,8,6),c,T(0,0,.25));b.add(G.sph(.55,8,6),c,T(0,.15,-.5,0,0,0,1,.85,1.1));b.add(G.sph(.4,8,5),acc,T(0,.35,-.55,0,0,0,1,.5,1));
    b.add(G.sph(.1,5,4),acc,T(-.15,.12,.6));b.add(G.sph(.1,5,4),acc,T(.15,.12,.6));b.add(G.cone(.07,.3,4),acc,T(-.1,-.15,.65,.6,0,0));b.add(G.cone(.07,.3,4),acc,T(.1,-.15,.65,.6,0,0));
    for(let i=0;i<4;i++){const z=.35-i*.25;b.add(G.cyl(.05,.05,.9,4),c,T(-.7,.1,z,0,0,1.1-i*.05));b.add(G.cyl(.05,.05,.9,4),c,T(.7,.1,z,0,0,-1.1+i*.05))}}),0,.7,0);
  R.add('armL',limbM(.06,.6,c),-.45,.55,.45);R.add('armR',limbM(.06,.6,c),.45,.55,.45);R.add('legL',limbM(.06,.6,c),-.45,.55,-.3);R.add('legR',limbM(.06,.6,c),.45,.55,-.3);return R}
function golemModel(lava){const R=rig(),c=lava?'#6a4a3a':'#8a7a6a';
  R.add('body',partMesh(b=>{b.add(G.dod(.55),c,T(0,0,0,0,0,0,1.1,1,.9));b.add(G.dod(.3),c,T(-.4,.25,0));b.add(G.dod(.3),c,T(.4,.25,0))}),0,1.0,0);
  R.add('head',partMesh(b=>{b.add(G.dod(.3),c,T(0,.2,0));if(lava){b.add(G.cone(.22,.55,6),'#ffc21a',T(0,.6,0));b.add(G.cone(.12,.35,5),'#ff6a1a',T(0,.55,.08))}b.add(G.sph(.05,4,3),lava?'#ffe080':'#1a1a1a',T(-.1,.22,.26));b.add(G.sph(.05,4,3),lava?'#ffe080':'#1a1a1a',T(.1,.22,.26))}),0,1.55,0);
  R.add('armL',limbM(.18,.7,c),-.65,1.3,0);R.add('armR',limbM(.18,.7,c),.65,1.3,0);R.add('legL',limbM(.18,.5,c),-.25,.55,0);R.add('legR',limbM(.18,.5,c),.25,.55,0);return R}
function scareModel(){const R=rig();R.add('body',partMesh(b=>{b.add(G.cyl(.24,.28,.55,7),'#e04a3a',T(0,.05,0));b.add(G.box(.5,.25,.3),'#3a6ac0',T(0,-.15,0))}),0,.78,0);
  R.add('head',partMesh(b=>{b.add(G.sph(.3,8,6),'#f0c030',T(0,.3,0,0,0,0,1,1.15,1));b.add(G.cone(.08,.25,5),'#f0c030',T(0,.68,0));b.add(G.box(.08,.08,.04),'#2a1a0a',T(-.12,.35,.27));b.add(G.box(.08,.08,.04),'#2a1a0a',T(.12,.35,.27));b.add(G.box(.22,.04,.04),'#2a1a0a',T(0,.18,.28))}),0,1.05,0);
  R.add('armL',limbM(.07,.42,'#e04a3a'),-.33,1.0,0);R.add('armR',limbM(.07,.42,'#e04a3a'),.33,1.0,0);R.add('legL',limbM(.09,.45,'#3a6ac0'),-.12,.5,0);R.add('legR',limbM(.09,.45,'#3a6ac0'),.12,.5,0);
  const w=partMesh(b=>{b.add(G.cyl(.03,.03,.8,4),'#8a5a3a',T(0,-.4,0));b.add(G.box(.05,.3,.18),'#cfd6de',T(0,-.82,.08))});w.position.y=-.42;w.rotation.x=Math.PI/2;R.P.armR.add(w);return R}
const ENEMY_EXTRA={
 ctroll:()=>trollModel('#8aa8c8','#3a4a6a',{hair:'#4a8af0',club:'#5a4a3a'}),mtroll:()=>trollModel('#d8a878','#e07a2a',{hair:'#e05a1a',belt:'#8a4a24',club:'#6a4a2a'}),
 stroll:()=>trollModel('#c8c840','#6a8a30',{hair:'#8aa030',club:'#5a6a30'}),stufur:()=>trollModel('#7a6a8a','#2a2a34',{horn:'#e02a2a',helm:'#3a3a44',club:'#3a3a44'}),
 skellir:()=>trollModel('#d88a5a','#7a2a1a',{horn:'#f0ead8',helm:'#5a2a1a',club:'#3a2a1a',belt:'#ffd21f'}),
 bear:()=>quadModel('bear'),croc:()=>quadModel('croc'),spider:()=>spiderModel(false),squeen:()=>spiderModel(true),rockm:()=>golemModel(false),lava:()=>golemModel(true),scare:()=>scareModel()};
// ---- アイコン（新しい資源・かぶと・よろい）----
Object.assign(ICON_DRAW,{
 wheat(g){for(let i=0;i<5;i++){g.save();g.translate(32,56);g.rotate((i-2)*.18);g.strokeStyle='#8a6a1a';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(0,-34);g.stroke();g.beginPath();g.ellipse(0,-40,5,10,0,0,7);g.fillStyle='#f0c040';g.fill();g.strokeStyle='#6a4a0a';g.lineWidth=2;g.stroke();g.restore()}},
 coal(g){poly(g,[[12,44],[10,28],[24,14],[42,12],[54,26],[54,44],[40,54],[22,54]],'#3a3a48','#0a0a10');poly(g,[[24,14],[42,12],[44,24],[28,28]],'#5a5a6a',false)},
 wool(g){[[22,34,12],[34,26,13],[44,36,12],[32,42,13]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fillStyle='#f8f4ec';g.fill();g.strokeStyle='#8a8070';g.lineWidth=2.5;g.stroke()});g.beginPath();g.arc(32,36,12,0,7);g.fillStyle='#f8f4ec';g.fill()},
 leather(g){poly(g,[[14,16],[26,10],[38,10],[50,16],[52,30],[46,50],[32,56],[18,50],[12,30]],'#a8683a','#4a2a10');g.strokeStyle='#d8a070';g.setLineDash([3,3]);g.lineWidth=2;g.beginPath();g.moveTo(20,22);g.lineTo(44,22);g.lineTo(42,44);g.lineTo(22,44);g.closePath();g.stroke();g.setLineDash([])},
 gear(g){g.save();g.translate(32,32);g.fillStyle='#b8c0cc';g.strokeStyle='#3a4250';g.lineWidth=3;g.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=i%2?18:24;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();g.stroke();g.beginPath();g.arc(0,0,7,0,7);g.fillStyle='#5a6270';g.fill();g.restore()},
 crock(g){poly(g,[[20,10],[34,10],[38,34],[50,42],[50,50],[18,50],[16,40]],'#7ab04a','#2a4a10');[[22,52],[32,54],[42,54]].forEach(([x,y])=>poly(g,[[x-3,y-4],[x+3,y-4],[x,y+5]],'#f4f0e8','#2a4a10',2))},
 bone(g){g.save();g.translate(32,32);g.rotate(-.7);g.fillStyle='#f0ead8';g.strokeStyle='#6a5a40';g.lineWidth=3;g.beginPath();g.rect(-16,-5,32,10);g.fill();g.stroke();[[-18,-6],[-18,6],[18,-6],[18,6]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,7,0,7);g.fill();g.stroke()});g.restore()},
 amber(g){g.beginPath();g.moveTo(32,8);g.bezierCurveTo(48,28,52,40,32,56);g.bezierCurveTo(12,40,16,28,32,8);g.fillStyle='#ffa020';g.fill();g.strokeStyle='#6a3a00';g.lineWidth=3;g.stroke();g.beginPath();g.ellipse(26,36,4,8,-.3,0,7);g.fillStyle='#ffe0a0';g.fill()},
 key(g){g.strokeStyle='#6a4a00';g.lineWidth=3;g.beginPath();g.arc(20,24,11,0,7);g.fillStyle='#ffd21f';g.fill();g.stroke();g.beginPath();g.arc(20,24,4,0,7);g.fillStyle='#6a4a00';g.fill();poly(g,[[28,30],[54,48],[50,54],[44,50],[42,54],[36,50],[24,36]],'#ffd21f','#6a4a00')},
 helm(g){g.beginPath();g.arc(32,36,20,Math.PI,0);g.closePath();g.fillStyle='#b8c0cc';g.fill();g.strokeStyle='#2a3240';g.lineWidth=3;g.stroke();g.fillStyle='#8a94a4';g.fillRect(12,36,40,8);g.strokeRect(12,36,40,8);g.fillStyle='#e04a3a';g.fillRect(29,10,6,10)},
 arm(g){poly(g,[[18,12],[28,16],[36,16],[46,12],[54,22],[48,28],[46,54],[18,54],[16,28],[10,22]],'#b8c0cc','#2a3240');g.fillStyle='#8a94a4';g.fillRect(22,30,20,4);g.fillRect(22,40,20,4)}});
// ---- 新しい資源の飛ぶかけら・光る木や岩 ----
const PIECE_EXTRA={
 wheat(b,c){b.add(G.cone(.09,.4,4),c);b.add(G.cyl(.02,.02,.3,3),'#8a6a1a',T(0,-.3,0))},coal(b,c){b.add(G.dod(.18),c)},wool(b,c){b.add(G.ico(.2,1),c)},
 leather(b,c){b.add(G.box(.4,.06,.3),c)},gear(b,c){b.add(G.cyl(.18,.18,.07,8),c,T(0,0,0,Math.PI/2,0,0))},crock(b,c){b.add(G.box(.2,.14,.36),c)},
 bone(b,c){b.add(G.cyl(.05,.05,.4,5),c,T(0,0,0,0,0,Math.PI/2));b.add(G.sph(.08,5,4),c,T(.2,0,0));b.add(G.sph(.08,5,4),c,T(-.2,0,0))},
 amber(b,c){b.add(G.oct(.18),c,T(0,0,0,0,0,0,1,1.4,1))},key(b,c){b.add(G.tor(.1,.04,Math.PI*2,8),c);b.add(G.box(.06,.3,.05),c,T(0,-.22,0))}};
const NODE_GLOW={core:0x802070,ura:0x206010,ura2:0x206010,amber:0x4a2800,icepick:0x10304a};
