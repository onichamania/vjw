// ================= 3D の形（ローポリ。部品を1つのジオメトリにまとめ、色は頂点ごと）=================
const MATS={};
function lam(opt){return new THREE.MeshLambertMaterial(Object.assign({vertexColors:true,flatShading:true},opt||{}))}
const VCMAT=lam();                        // 頂点の色だけで描くふつうの材質
const VCMAT_GLOW=lam({emissive:0x000000});
// 部品を集めて 1 つにする
class MB{
  constructor(){this.pos=[];this.col=[]}
  add(geo,color,m){const g=geo.index?geo.toNonIndexed():geo.clone();if(m)g.applyMatrix4(m);const p=g.attributes.position.array,c=new THREE.Color(color);
    // 面ごとに少しだけ明るさを変える（ローポリらしく）
    for(let i=0;i<p.length;i+=9){const k=1+(Math.sin(i*12.9898+p[i]*78.233)*.5)*.06;for(let j=0;j<3;j++){this.pos.push(p[i+j*3],p[i+j*3+1],p[i+j*3+2]);this.col.push(c.r*k,c.g*k,c.b*k)}}
    g.dispose();return this}
  geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.col,3));g.computeVertexNormals();g.computeBoundingSphere();return g}}
// 位置・回転・大きさの行列
function T(x,y,z,rx,ry,rz,sx,sy,sz){const m=new THREE.Matrix4();m.compose(new THREE.Vector3(x||0,y||0,z||0),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx==null?1:sx,sy==null?(sx==null?1:sx):sy,sz==null?(sx==null?1:sx):sz));return m}
const G={
 box:(w,h,d)=>new THREE.BoxGeometry(w,h,d),
 cyl:(rt,rb,h,s)=>new THREE.CylinderGeometry(rt,rb,h,s||7),
 cone:(r,h,s)=>new THREE.ConeGeometry(r,h,s||7),
 ico:(r,d)=>new THREE.IcosahedronGeometry(r,d||0),
 dod:r=>new THREE.DodecahedronGeometry(r,0),
 oct:r=>new THREE.OctahedronGeometry(r,0),
 sph:(r,w,h)=>new THREE.SphereGeometry(r,w||8,h||6),
 hemi:(r,w)=>new THREE.SphereGeometry(r,w||9,4,0,Math.PI*2,0,Math.PI/2),
 tor:(r,t,a,s)=>new THREE.TorusGeometry(r,t,5,s||18,a||Math.PI*2)};
const rnd0=mulberry(99);
// ---------------- 木・岩・結晶（node）----------------
const NODE_GEO={},STUMP_GEO={};
function treeTrunk(b,h,c,r){b.add(G.cyl((r||.17)*.75,r||.22,h,6),c||'#8a5a32',T(0,h/2,0))}
const NODE_BUILD={
 oak(b){treeTrunk(b,1.2);b.add(G.ico(.8,0),'#4cae3a',T(0,1.75,0));b.add(G.ico(.62,0),'#62c24a',T(.42,1.45,.2,.5,.3,0));b.add(G.ico(.58,0),'#58b844',T(-.38,1.5,-.25,.2,.8,0));b.add(G.ico(.5,0),'#6fcf55',T(.05,2.25,-.1,.3,0,.4))},
 pine(b){treeTrunk(b,.8,'#7a4a2a',.18);[[1.25,.95,1.1],[1.05,.78,1.75],[.8,.6,2.3],[.55,.4,2.75]].forEach(([h,r,y],i)=>b.add(G.cone(r,h,7),i%2?'#2f8f52':'#277f48',T(0,y,0,0,i*.4,0)))},
 magic(b){b.add(G.cyl(.14,.24,1.3,5),'#7a4a8a',T(0,.65,0,0,0,.12));b.add(G.ico(.7,0),'#e46fc4',T(.12,1.65,0));b.add(G.ico(.5,0),'#6fe0d0',T(-.45,1.35,.25));b.add(G.ico(.45,0),'#f0a0e0',T(.45,1.3,-.3));b.add(G.ico(.35,0),'#a070f0',T(0,2.2,.1))},
 shroom(b){b.add(G.cyl(.22,.3,.9,7),'#f6ead6',T(0,.45,0));b.add(G.hemi(.75,9),'#e8423a',T(0,.82,0,0,0,0,1,.75,1));[[.35,1.1,.2],[-.3,1.12,.25],[.05,1.3,-.3],[-.2,1.0,-.48],[.5,.95,-.2]].forEach(([x,y,z])=>b.add(G.sph(.1,5,4),'#ffffff',T(x,y,z)))},
 snowt(b){treeTrunk(b,.8,'#6a4a32',.18);[[1.3,1,1.1],[1.1,.82,1.8],[.85,.62,2.35],[.6,.42,2.8]].forEach(([h,r,y],i)=>{b.add(G.cone(r,h,7),'#3e7f6c',T(0,y,0,0,i*.4,0));b.add(G.cone(r*.75,h*.35,7),'#f4f8ff',T(0,y+h*.33,0,0,i*.4,0))})},
 dead(b){b.add(G.cyl(.12,.26,1.9,5),'#5a4a44',T(0,.95,0,0,0,.05));b.add(G.cyl(.06,.1,.9,4),'#5a4a44',T(.32,1.5,0,0,0,-.9));b.add(G.cyl(.05,.09,.8,4),'#5a4a44',T(-.28,1.75,.1,.2,0,.9));b.add(G.cyl(.04,.07,.6,4),'#5a4a44',T(.05,2.1,-.25,-.8,0,0))},
 palm(b){let x=0,y=0;for(let i=0;i<5;i++){b.add(G.cyl(.15,.19,.62,6),i%2?'#b88a52':'#a87a44',T(x,y+.31,0,0,0,-.1*i));x+=.06*i;y+=.58}
   for(let i=0;i<6;i++){const a=i/6*Math.PI*2;b.add(G.cone(.22,1.6,4),i%2?'#3fae4a':'#4fc05a',T(x+Math.cos(a)*.7,y-.05,Math.sin(a)*.7,Math.sin(a)*1.3,0,-Math.cos(a)*1.3,1,1,.35))}b.add(G.sph(.16,5,4),'#7a5a2a',T(x+.15,y-.15,.1));b.add(G.sph(.16,5,4),'#7a5a2a',T(x-.1,y-.15,-.15))},
 cact(b){b.add(G.cyl(.28,.3,1.8,7),'#3faa4a',T(0,.9,0));b.add(G.sph(.28,7,4),'#3faa4a',T(0,1.8,0));b.add(G.cyl(.16,.16,.6,6),'#3faa4a',T(.42,.9,0,0,0,Math.PI/2));b.add(G.cyl(.15,.15,.6,6),'#3faa4a',T(.62,1.2,0));b.add(G.cyl(.15,.15,.5,6),'#3faa4a',T(-.4,1.25,0,0,0,Math.PI/2));b.add(G.cyl(.14,.14,.5,6),'#3faa4a',T(-.6,1.5,0));b.add(G.sph(.12,6,4),'#f070a0',T(0,2.05,0))},
 rock(b){b.add(G.dod(.62),'#9aa3ad',T(0,.45,0,.3,.2,0,1,.8,1));b.add(G.dod(.4),'#b3bbc4',T(.5,.28,.25,.5,.8,0));b.add(G.dod(.32),'#8a939d',T(-.45,.22,-.2,.1,.4,.3))},
 crock(b){b.add(G.dod(.82),'#8c7a70',T(0,.6,0,.3,.2,0,1,.85,1));b.add(G.dod(.5),'#a08e84',T(.62,.35,.3,.5,.8,0));b.add(G.dod(.4),'#76665e',T(-.6,.3,-.25,.1,.4,.3))},
 snowr(b){b.add(G.dod(.8),'#8f99a8',T(0,.58,0,.3,.2,0,1,.85,1));b.add(G.dod(.62),'#f4f8ff',T(0,.88,0,.3,.2,0,1,.45,1));b.add(G.dod(.42),'#a6b0be',T(.6,.3,.3,.5,.8,0))},
 azr(b){b.add(G.dod(.5),'#8a939d',T(0,.25,0,0,0,0,1.2,.6,1.2));[[0,.75,0,.55,.3],[.45,.55,.2,.38,.8],[-.4,.5,-.2,.4,.2],[.1,.45,-.45,.32,1.1]].forEach(([x,y,z,s,r])=>b.add(G.box(s,s,s),'#2f7cf0',T(x,y,z,r,r*.7,.3)))},
 ame(b){b.add(G.dod(.45),'#6a5a7a',T(0,.2,0,0,0,0,1.2,.5,1.2));[[0,.8,0,.24,1.3,0],[.35,.6,.15,.18,1,.4],[-.32,.55,-.1,.18,.9,-.45],[.05,.5,-.38,.15,.8,.3]].forEach(([x,y,z,r,h,t])=>{b.add(G.cyl(r,r,h*.75,6),'#b25cf0',T(x,y,z,t*.5,0,t));b.add(G.cone(r,h*.35,6),'#d08cff',T(x+Math.sin(-t)*h*.5,y+h*.52,z,t*.5,0,t))})},
 dia(b){b.add(G.dod(.75),'#7c8794',T(0,.55,0,.3,.2,0,1,.85,1));[[.3,.95,.25,.28],[-.35,.85,-.2,.24],[.05,1.2,-.1,.3],[.5,.6,-.3,.2]].forEach(([x,y,z,s])=>b.add(G.oct(s),'#5ff0f0',T(x,y,z,.4,.6,0,1,1.3,1)))},
 sul(b){b.add(G.dod(.45),'#6a4a3a',T(0,.2,0,0,0,0,1.2,.5,1.2));[[0,.7,0,.28,.3],[.35,.5,.2,.22,-.5],[-.35,.5,-.15,.22,.6],[.1,.45,-.35,.18,-.3]].forEach(([x,y,z,s,t])=>b.add(G.oct(s),'#f2dc2a',T(x,y,z,0,0,t,1,2,1)))},
 ura(b){b.add(G.dod(.45),'#2a3040',T(0,.2,0,0,0,0,1.2,.5,1.2));[[0,.75,0,.22,1.1],[.38,.55,.15,.17,.8],[-.35,.5,-.18,.17,.75]].forEach(([x,y,z,r,h])=>{b.add(G.cyl(r,r,h,6),'#5ce04a',T(x,y,z));b.add(G.cyl(r*.6,r,.12,6),'#b6ff9a',T(x,y+h/2+.06,z))})},
 ruby(b){b.add(G.dod(.5),'#8a6a5a',T(0,.25,0,0,0,0,1.2,.6,1.2));[[0,.8,0,.3],[.4,.55,.2,.24],[-.38,.55,-.18,.24],[.1,.5,-.42,.2]].forEach(([x,y,z,s])=>b.add(G.oct(s),'#f0284a',T(x,y,z,.3,.5,0,1,1.5,1)))},
 chest(b){b.add(G.box(1,.55,.7),'#9a5a2a',T(0,.28,0));b.add(G.cyl(.35,.35,1,8,1,false),'#b06a32',T(0,.55,0,0,0,Math.PI/2,1,1,1));b.add(G.box(1.04,.1,.74),'#ffc21a',T(0,.5,0));b.add(G.box(.16,.22,.08),'#ffc21a',T(0,.5,.37))},
 sword(b){b.add(G.dod(.75),'#8a939d',T(0,.5,0,.3,.2,0,1.1,.75,1.1));b.add(G.box(.16,1.4,.06),'#dfe6ee',T(0,1.4,0,0,0,.08));b.add(G.box(.6,.1,.14),'#e0b030',T(.07,2.1,0,0,0,.08));b.add(G.cyl(.06,.06,.4,6),'#5a3a1a',T(.09,2.35,0,0,0,.08));b.add(G.sph(.1,6,4),'#e0b030',T(.1,2.58,0))},
 core(b){b.add(G.cyl(.5,.65,.5,6),'#8a939d',T(0,.25,0));b.add(G.cyl(.35,.5,.3,6),'#b3bbc4',T(0,.65,0));b.add(G.ico(.42,1),'#ff7af0',T(0,1.35,0))}};
const STUMP_BUILD={
 tree(b){b.add(G.cyl(.2,.25,.3,6),'#8a5a32',T(0,.15,0));b.add(G.cyl(.2,.2,.02,6),'#e8b878',T(0,.31,0))},
 rock(b){b.add(G.dod(.25),'#8a939d',T(.15,.1,0));b.add(G.dod(.2),'#9aa3ad',T(-.2,.08,.15));b.add(G.dod(.15),'#7c8794',T(0,.06,-.25))},
 crystal(b){b.add(G.dod(.45),'#7c8794',T(0,.15,0,0,0,0,1.2,.4,1.2))},
 chest(b){b.add(G.box(1,.55,.7),'#7a4a22',T(0,.28,0));b.add(G.box(1,.08,.7),'#3a2410',T(0,.56,0))},
 shroom(b){b.add(G.cyl(.2,.26,.25,7),'#e6dac6',T(0,.12,0))}};
const STUMP_OF={oak:'tree',pine:'tree',magic:'tree',snowt:'tree',dead:'tree',palm:'tree',cact:'shroom',shroom:'shroom',rock:'rock',crock:'rock',snowr:'rock',azr:'crystal',ame:'crystal',dia:'rock',sul:'crystal',ura:'crystal',ruby:'crystal',chest:'chest',sword:'crystal',core:'crystal'};
function nodeGeo(k){if(!NODE_GEO[k]){const b=new MB();NODE_BUILD[k](b);const g=b.geo();if(!['chest','sword','core'].includes(k))g.scale(.82,.82,.82);NODE_GEO[k]=g}return NODE_GEO[k]}
function stumpGeo(k){if(!STUMP_GEO[k]){const b=new MB();STUMP_BUILD[k](b);STUMP_GEO[k]=b.geo()}return STUMP_GEO[k]}
// ---------------- 飾り（草・花・小石）----------------
const DECO_BUILD={
 grass(b){for(let i=0;i<4;i++)b.add(G.cone(.07,.35,3),i%2?'#5fb83a':'#73c94a',T((i-1.5)*.08,.17,(i%2)*.06,0,i,(i-1.5)*.25))},
 flower(b){b.add(G.cyl(.02,.02,.3,3),'#4a9a2a',T(0,.15,0));b.add(G.ico(.09,0),'#ffffff',T(0,.32,0));b.add(G.ico(.05,0),'#ffd21f',T(0,.36,.04))},
 flowerR(b){b.add(G.cyl(.02,.02,.28,3),'#4a9a2a',T(0,.14,0));b.add(G.ico(.09,0),'#ff5a7a',T(0,.3,0))},
 bush(b){b.add(G.ico(.32,0),'#4caf3c',T(0,.22,0));b.add(G.ico(.22,0),'#62c24a',T(.25,.16,.1))},
 pebble(b){b.add(G.dod(.14),'#a0a8b0',T(0,.06,0,0,0,0,1,.6,1));b.add(G.dod(.09),'#8a939d',T(.17,.04,.05))},
 snow(b){b.add(G.dod(.2),'#f4f8ff',T(0,.08,0,0,0,0,1.4,.5,1))},
 fern(b){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;b.add(G.cone(.08,.5,3),'#2f8f52',T(Math.cos(a)*.12,.18,Math.sin(a)*.12,Math.sin(a)*.8,0,-Math.cos(a)*.8))}},
 mush(b){b.add(G.cyl(.04,.05,.18,5),'#f6ead6',T(0,.09,0));b.add(G.hemi(.13,6),'#e070c0',T(0,.17,0))},
 glow(b){b.add(G.ico(.1,0),'#80fff0',T(0,.15,0))},
 ember(b){b.add(G.dod(.14),'#3a2a28',T(0,.06,0,0,0,0,1,.6,1));b.add(G.ico(.07,0),'#ff8a2a',T(.1,.1,.05))},
 bone(b){b.add(G.cyl(.04,.04,.4,4),'#f0ead8',T(0,.05,0,0,0,Math.PI/2));b.add(G.sph(.06,4,3),'#f0ead8',T(.2,.05,0));b.add(G.sph(.06,4,3),'#f0ead8',T(-.2,.05,0))},
 stal(b){b.add(G.cone(.15,.6,5),'#5a3a2e',T(0,.3,0))},
 crys(b){b.add(G.oct(.12),'#8af07a',T(0,.15,0,0,0,0,1,1.8,1))}};
const DECO_SETS={meadow:['grass','grass','flower','flowerR','bush','grass'],hills:['pebble','grass','pebble'],spruce:['fern','grass','fern','bush'],cave:['stal','pebble','pebble'],sand:['pebble','grass'],
 mystic:['mush','glow','mush','fern'],arctic:['snow','snow','pebble'],ash:['ember','pebble','ember'],ura:['crys','pebble','crys'],desert:['bone','pebble','grass'],none:[]};
const DECO_GEO={};function decoGeo(k){if(!DECO_GEO[k]){const b=new MB();DECO_BUILD[k](b);DECO_GEO[k]=b.geo()}return DECO_GEO[k]}
// ---------------- 建物 ----------------
function bldMesh(k){const b=new MB();(BLD_BUILD[k]||BLD_BUILD.deco)(b);const m=new THREE.Mesh(b.geo(),VCMAT);m.castShadow=true;m.receiveShadow=true;return m}
const workbench=(b,tool)=>{b.add(G.box(1.8,.7,1),'#b8452e',T(0,.35,0));b.add(G.box(2,.12,1.15),'#d0583a',T(0,.76,0));[[-.8,-.42],[.8,-.42],[-.8,.42],[.8,.42]].forEach(([x,z])=>b.add(G.box(.16,.7,.16),'#8a2e1e',T(x,.35,z)));
  b.add(G.cyl(.55,.55,.28,10),'#b8b0e8',T(-.4,1.3,0,Math.PI/2,0,0));b.add(G.box(.2,.6,.5),'#8a2e1e',T(-.4,1.0,0));b.add(G.cyl(.32,.32,.12,8),'#ff9a2a',T(.45,1.05,.45,Math.PI/2,0,0));
  if(tool==='axe'){b.add(G.cyl(.05,.05,1,5),'#c98a4c',T(.5,1.2,-.1,0,0,.6));b.add(G.box(.35,.3,.06),'#cfd6de',T(.78,1.55,-.1,0,0,.6))}
  else if(tool==='pick'){b.add(G.cyl(.05,.05,1,5),'#c98a4c',T(.5,1.2,-.1,0,0,.6));b.add(G.box(.75,.1,.08),'#cfd6de',T(.78,1.55,-.1,0,0,-.95))}
  else{b.add(G.box(.12,1,.04),'#dfe6ee',T(.5,1.35,-.1,0,0,.4));b.add(G.box(.4,.08,.12),'#e0b030',T(.32,.95,-.1,0,0,.4))}
  b.add(G.dod(.35),'#b8b0e8',T(-.9,.3,.6,.3,0,0,1,.7,1))};
const BLD_BUILD={
 plankR(b){b.add(G.box(.5,2.6,1.6),'#a8467e',T(-1.1,1.3,0));b.add(G.box(.5,2.6,1.6),'#a8467e',T(1.1,1.3,0));b.add(G.box(2.7,.55,1.6),'#b8528e',T(0,2.6,0));b.add(G.box(1.7,.25,1.5),'#c4462e',T(0,.13,0));
   for(let i=0;i<5;i++)b.add(G.box(1.7,.04,.12),'#e06040',T(0,.27,-.6+i*.3));b.add(G.cyl(.6,.6,.08,12),'#ffc21a',T(0,1.0,0,0,0,Math.PI/2));b.add(G.cyl(.15,.15,.12,6),'#8a5a10',T(0,1.0,0,0,0,Math.PI/2));
   b.add(G.dod(.35),'#c86aa0',T(-1.4,.25,.9));b.add(G.dod(.28),'#c86aa0',T(1.4,.2,-.9))},
 steelR(b){b.add(G.box(2.6,2.2,2),'#8a62b0',T(0,1.1,0));b.add(G.box(2.9,.35,2.3),'#9c74c4',T(0,2.35,0));b.add(G.box(1.3,1.4,.3),'#ffcf3a',T(0,.8,1.02));b.add(G.box(1.5,.2,.4),'#6a4a90',T(0,1.6,1.05));
   b.add(G.box(.5,1.4,.5),'#7a52a0',T(.75,3.1,-.4));b.add(G.box(.62,.2,.62),'#9c74c4',T(.75,3.85,-.4));b.add(G.cone(.25,.6,4),'#7a52a0',T(.75,4.2,-.4,0,Math.PI/4,0));
   b.add(G.box(1.2,.12,1.4),'#ffd84a',T(0,.06,1.6));b.add(G.dod(.4),'#9c74c4',T(-1.4,.3,.8))},
 axeR(b){workbench(b,'axe')},pickR(b){workbench(b,'pick')},weapR(b){workbench(b,'weap')},
 trade(b,col){b.add(G.box(1.8,.5,1.1),'#b8452e',T(0,.75,0));b.add(G.box(1.9,.1,1.2),'#d0583a',T(0,1.0,0));[[-.85],[.85]].forEach(([x])=>b.add(G.cyl(.42,.42,.12,10),'#a8352a',T(x*.7,.42,.62,Math.PI/2,0,0)));
   b.add(G.cyl(.42,.42,.12,10),'#a8352a',T(-.6,.42,-.62,Math.PI/2,0,0));b.add(G.cyl(.42,.42,.12,10),'#a8352a',T(.6,.42,-.62,Math.PI/2,0,0));b.add(G.box(.08,.08,1.6),'#7a2a1e',T(-1.2,.85,0,0,0,.3));
   for(let i=0;i<5;i++)b.add(G.cyl(.22,.22,.45,6),col,T(-.5+(i%3)*.5,1.3+(i>2?.35:0),(i%2?.2:-.2),Math.PI/2,i,0));
   // 商人（緑の服・黄色のめがね）
   b.add(G.cyl(.25,.3,.7,7),'#2fae4a',T(1.45,.85,.3));b.add(G.sph(.28,8,6),'#f2c08a',T(1.45,1.45,.3));b.add(G.cyl(.3,.32,.18,8),'#2a8a3a',T(1.45,1.7,.3));b.add(G.box(.42,.1,.06),'#ffd21f',T(1.45,1.48,.56));
   b.add(G.cyl(.08,.08,.5,5),'#3a2a1a',T(1.32,.25,.3));b.add(G.cyl(.08,.08,.5,5),'#3a2a1a',T(1.58,.25,.3))},
 woodT(b){BLD_BUILD.trade(b,'#b9773f')},rockT(b){BLD_BUILD.trade(b,'#9aa3ad')},azT(b){BLD_BUILD.trade(b,'#2f7cf0')},diaT(b){BLD_BUILD.trade(b,'#5ff0f0')},meatT(b){BLD_BUILD.trade(b,'#d9715a')},
 skin(b){b.add(G.tor(1.1,.18,Math.PI*2,20),'#ff7af0',T(0,1.4,0));b.add(G.tor(.9,.06,Math.PI*2,20),'#7af0ff',T(0,1.4,0));b.add(G.cyl(.9,1,.25,8),'#8a939d',T(0,.12,0));b.add(G.box(.2,.4,.2),'#8a939d',T(-1.1,.3,0));b.add(G.box(.2,.4,.2),'#8a939d',T(1.1,.3,0))},
 cave(b){b.add(G.dod(1),'#5a3a2e',T(-1.2,.9,0,.2,.3,0,1,1.4,1));b.add(G.dod(1),'#5a3a2e',T(1.2,.9,0,.4,.1,0,1,1.4,1));b.add(G.dod(.9),'#4e3226',T(0,2.1,0,.1,.5,.3,1.6,.7,1));b.add(G.box(1.2,1.8,.3),'#1a0e0a',T(0,.9,-.5))},
 bridge(b){for(let i=0;i<9;i++)b.add(G.box(.42,.12,1.6),i%2?'#c98a4c':'#b9773f',T(-1.9+i*.475,0,0,0,(i%3-1)*.03,0));[[-1.9],[1.9]].forEach(([x])=>{b.add(G.cyl(.08,.08,1.6,5),'#7a4a24',T(x,-.2,.8));b.add(G.cyl(.08,.08,1.6,5),'#7a4a24',T(x,-.2,-.8))});
   b.add(G.cyl(.04,.04,3.9,4),'#d9b48a',T(0,.6,.8,0,0,Math.PI/2));b.add(G.cyl(.04,.04,3.9,4),'#d9b48a',T(0,.6,-.8,0,0,Math.PI/2))},
 deco(b){b.add(G.box(.3,.3,.3),'#888',T(0,.15,0))}};
// ポータル：石の台・2本の柱・6つのかけらでできた輪（まだのかけらはうすい影）・動くと紫のうず
function portalModel(cols){const g=new THREE.Group();const base=new MB();base.add(G.cyl(2.0,2.25,.3,10),'#8a939d',T(0,.15,0));base.add(G.cyl(1.6,1.8,.22,10),'#a3acb6',T(0,.4,0));
  [[-2.15],[2.15]].forEach(([x])=>{base.add(G.box(.55,3.6,.6),'#7c8794',T(x,1.9,0));base.add(G.box(.75,.3,.8),'#9aa3ad',T(x,3.8,0));base.add(G.box(.75,.3,.8),'#9aa3ad',T(x,.35,0))});
  base.add(G.dod(.35),'#9aa3ad',T(-1.6,.5,1.2));base.add(G.dod(.28),'#8a939d',T(1.7,.45,-1.1));
  const bm=new THREE.Mesh(base.geo(),VCMAT);bm.castShadow=bm.receiveShadow=true;g.add(bm);
  cols=cols||['#9aa3ad','#2f7cf0','#b25cf0','#5ff0f0','#5ce04a','#f0284a'];const Y=2.25,RR=1.75;const pieces=[],ghosts=[];
  const ghostM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.22,depthWrite:false});
  for(let i=0;i<6;i++){const a0=-Math.PI/2-Math.PI/6+i*Math.PI/3+.03;const geo=new THREE.TorusGeometry(RR,.3,6,8,Math.PI/3-.06);geo.rotateZ(a0);
    const b=new MB();b.add(geo,cols[i]);if(i){const mid=a0+Math.PI/6;b.add(G.oct(.32),cols[i],T(Math.cos(mid)*RR,Math.sin(mid)*RR,.25,0,0,0,1,1.3,.6))}
    const m=new THREE.Mesh(b.geo(),i&&i!==4?VCMAT:i===4?lam({emissive:0x1a5a10}):VCMAT);m.position.y=Y;m.castShadow=true;m.visible=false;g.add(m);pieces.push(m);
    const gh=new THREE.Mesh(geo,ghostM);gh.position.y=Y;g.add(gh);ghosts.push(gh)}
  const swirl=new THREE.Mesh(new THREE.CircleGeometry(RR-.2,32),new THREE.MeshBasicMaterial({color:0xa060ff,transparent:true,opacity:.85,side:THREE.DoubleSide}));swirl.position.y=Y;swirl.visible=false;g.add(swirl);
  const sw2=new THREE.Mesh(new THREE.RingGeometry(.35,1.25,5,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.4,side:THREE.DoubleSide}));sw2.position.set(0,Y,.03);sw2.visible=false;g.add(sw2);
  g.userData={pieces,ghosts,swirl,sw2};return g}
// ---------------- 大きな通せんぼ（トロル・大イエティ）----------------
function bigTroll(sk,sk2,cl){sk=sk||'#8fd23a';sk2=sk2||'#9ae042';cl=cl||'#a0522d';const b=new MB();b.add(G.sph(1.1,8,6),sk,T(0,1.6,0,0,0,0,1,1.1,.9));b.add(G.sph(.7,8,6),sk2,T(0,2.9,.15));b.add(G.cone(.25,.9,4),sk,T(-.85,3.05,0,0,0,1.3));b.add(G.cone(.25,.9,4),sk,T(.85,3.05,0,0,0,-1.3));
  b.add(G.box(.5,.1,.1),'#2a3a10',T(-.25,3.05,.75));b.add(G.box(.5,.1,.1),'#2a3a10',T(.25,3.05,.75));b.add(G.cone(.16,.5,4),'#7ac030',T(0,2.85,.85,Math.PI/2,0,0));
  b.add(G.cyl(1.05,1.15,.6,8),cl,T(0,.85,0));b.add(G.cyl(.3,.25,1.3,6),sk,T(-1.2,1.5,.2,0,0,.4));b.add(G.cyl(.3,.25,1.3,6),sk,T(1.2,1.5,.2,0,0,-.4));b.add(G.cyl(.32,.3,.8,6),sk,T(-.5,.35,0));b.add(G.cyl(.32,.3,.8,6),sk,T(.5,.35,0));
  const m=new THREE.Mesh(b.geo(),VCMAT);m.castShadow=true;return m}
function bigYeti(){const b=new MB();b.add(G.sph(1.2,8,6),'#f2f4fa',T(0,1.7,0,0,0,0,1,1.15,.95));b.add(G.sph(.75,8,6),'#f2f4fa',T(0,3.05,.1));b.add(G.sph(.55,8,6),'#f4a8c8',T(0,2.95,.45,0,0,0,1,.8,.6));
  b.add(G.sph(.2,6,5),'#ffffff',T(0,3.15,.8));b.add(G.sph(.1,5,4),'#30307a',T(0,3.15,.97));b.add(G.cone(.18,.7,5),'#4aa8f0',T(0,3.9,0));
  b.add(G.cyl(.35,.3,1.5,6),'#f2f4fa',T(-1.35,1.6,.2,0,0,.3));b.add(G.cyl(.35,.3,1.5,6),'#f2f4fa',T(1.35,1.6,.2,0,0,-.3));b.add(G.sph(.3,6,4),'#f4a8c8',T(-1.55,.85,.3));b.add(G.sph(.3,6,4),'#f4a8c8',T(1.55,.85,.3));
  b.add(G.cyl(.4,.35,.8,6),'#f2f4fa',T(-.55,.4,0));b.add(G.cyl(.4,.35,.8,6),'#f2f4fa',T(.55,.4,0));b.add(G.box(.5,.15,.6),'#f4a8c8',T(-.55,.07,.15));b.add(G.box(.5,.15,.6),'#f4a8c8',T(.55,.07,.15));
  const m=new THREE.Mesh(b.geo(),VCMAT);m.castShadow=true;return m}
// ---------------- 人（プレイヤー・ほかの人）と道具 ----------------
function partMesh(fn){const b=new MB();fn(b);const m=new THREE.Mesh(b.geo(),VCMAT);m.castShadow=true;return m}
function toolMesh(k,lv){const metal=lv>=9?'#ff9ae0':lv>=7?'#5ff0f0':lv>=5?'#ffc21a':lv>=3?'#dfe6ee':'#b8c0c8';
  return partMesh(b=>{if(k==='axe'){b.add(G.cyl(.04,.045,.75,5),'#a8723e',T(0,-.3,0));b.add(G.box(.06,.28,.3),metal,T(0,-.6,.15))}
    else if(k==='pick'){b.add(G.cyl(.04,.045,.75,5),'#a8723e',T(0,-.3,0));b.add(G.box(.07,.09,.75),metal,T(0,-.62,0));b.add(G.cone(.05,.12,4),metal,T(0,-.62,.42,Math.PI/2,0,0));b.add(G.cone(.05,.12,4),metal,T(0,-.62,-.42,-Math.PI/2,0,0))}
    else{b.add(G.cyl(.035,.035,.22,5),'#5a3a1a',T(0,-.08,0));b.add(G.box(.24,.05,.07),'#e0b030',T(0,-.2,0));b.add(G.box(.05,.65,.1),metal,T(0,-.55,0));b.add(G.cone(.05,.12,4),metal,T(0,-.93,0,Math.PI,0,0))}})}
function makeChar(skin){const S=SKINS.find(s=>s.id===skin)||SKINS[0];const g=new THREE.Group(),P={};
  const pivot=(name,mesh,x,y,z)=>{const p=new THREE.Group();p.position.set(x,y,z);p.add(mesh);g.add(p);P[name]=p;return p};
  const body=partMesh(b=>{b.add(G.cyl(.2,.24,.5,8),S.body,T(0,0,0));b.add(G.sph(.24,8,4),S.body,T(0,-.22,0,0,0,0,1,.5,1));if(S.id==='astro'){b.add(G.box(.32,.36,.18),'#cfd6de',T(0,.02,-.25))}if(S.id==='stick'){b.add(G.box(.3,.34,.16),'#4a8af0',T(0,.02,-.24))}});
  pivot('body',body,0,.62,0);
  const head=partMesh(b=>{b.add(G.sph(.32,10,8),S.head,T(0,.3,0));b.add(G.sph(.055,5,4),'#1a1a2a',T(-.11,.36,.28));b.add(G.sph(.055,5,4),'#1a1a2a',T(.11,.36,.28));b.add(G.box(.12,.03,.03),'#a0402a',T(0,.22,.3));
    if(S.acc==='shroom'){b.add(G.hemi(.48,10),'#e8423a',T(0,.5,0,0,0,0,1,.55,1));[[.2,.66,.2],[-.22,.64,.15],[0,.72,-.22]].forEach(([x,y,z])=>b.add(G.sph(.07,5,4),'#ffffff',T(x,y,z)))}
    if(S.acc==='helmet'){b.add(G.tor(.34,.05,Math.PI*2,14),'#cfd6de',T(0,.3,0,Math.PI/2,0,0,1,1,1));b.add(G.cyl(.05,.05,.25,4),'#cfd6de',T(.15,.75,0));b.add(G.sph(.06,5,4),'#ff4060',T(.15,.88,0))}});
  pivot('head',head,0,.82,0);
  const limb=(r,h,c)=>partMesh(b=>{b.add(G.cyl(r,r*.9,h,6),c,T(0,-h/2,0));b.add(G.sph(r*1.15,6,4),c,T(0,-h,0))});
  pivot('armL',limb(.07,.38,S.body),-.27,.8,0);pivot('armR',limb(.07,.38,S.body),.27,.8,0);pivot('legL',limb(.085,.38,S.id==='stick'?'#ffc400':S.body),-.1,.4,0);pivot('legR',limb(.085,.38,S.id==='stick'?'#ffc400':S.body),.1,.4,0);
  const hand=new THREE.Group();hand.position.set(0,-.38,0);P.armR.add(hand);P.hand=hand;
  g.userData={P,tools:{},cur:null,skin:S.id};return g}
function setHeld(ch,k,lv){const U=ch.userData;const key=k?k+lv:null;if(U.cur===key)return;if(U.curMesh){U.P.hand.remove(U.curMesh)}U.cur=key;U.curMesh=null;if(!k)return;
  const m=U.tools[key]||(U.tools[key]=toolMesh(k,lv));m.rotation.set(Math.PI/2,0,0);m.position.set(0,0,0);U.P.hand.add(m);U.curMesh=m}
// ---------------- 敵 ----------------
function makeEnemy(k){if(ENEMY_EXTRA[k]){const R=ENEMY_EXTRA[k]();R.g.scale.setScalar(ENEMY[k].sc);R.g.userData={P:R.P,k};return R.g}
  const g=new THREE.Group(),P={};const add=(n,mesh,x,y,z)=>{const p=new THREE.Group();p.position.set(x,y,z);p.add(mesh);g.add(p);P[n]=p};
  const limb=(r,h,c)=>partMesh(b=>{b.add(G.cyl(r,r*.85,h,6),c,T(0,-h/2,0))});
  if(k==='gob'||k==='red'||k==='master'||k==='skel'||k==='crim'||k==='skelb'){const hum=k==='crim'?'master':k==='skelb'?'skel':k;
    const skinC={gob:'#8fd23a',red:'#e8c09a',master:'#e8c09a',skel:'#f0ead8',crim:'#e8302a',skelb:'#f0ead8'}[k],cloth={gob:'#a0522d',red:'#c8302a',master:'#2a2a34',skel:'#3a3a4a',crim:'#2a2a34',skelb:'#5a5040'}[k];
    add('body',partMesh(b=>{b.add(G.cyl(.24,.28,.55,7),cloth,T(0,0,0));if(hum==='red'||hum==='master'){b.add(G.box(.55,.2,.35),'#8a8f9a',T(0,.2,0))}if(hum==='skel'){for(let i=0;i<3;i++)b.add(G.box(.42,.04,.3),'#f0ead8',T(0,.15-i*.12,.02))}}),0,.72,0);
    add('head',partMesh(b=>{b.add(G.sph(.3,8,6),skinC,T(0,.3,0));b.add(G.sph(.06,5,4),k==='skel'?'#1a1a1a':'#1a1a1a',T(-.11,.35,.25));b.add(G.sph(.06,5,4),'#1a1a1a',T(.11,.35,.25));
      if(k==='gob'){b.add(G.cone(.1,.45,4),skinC,T(-.38,.38,0,0,0,1.3));b.add(G.cone(.1,.45,4),skinC,T(.38,.38,0,0,0,-1.3));b.add(G.cone(.07,.2,4),'#7ac030',T(0,.28,.32,Math.PI/2,0,0))}
      if(hum==='red'||hum==='master'){const hc=k==='crim'?'#4a1414':k==='master'?'#1a1a22':'#3a3a44';b.add(G.hemi(.36,9),hc,T(0,.32,0));b.add(G.box(.5,.08,.1),'#1a1a1a',T(0,.32,.28));b.add(G.cone(.08,.35,4),'#e02a2a',T(-.32,.62,0,0,0,.6));b.add(G.cone(.08,.35,4),'#e02a2a',T(.32,.62,0,0,0,-.6))}
      if(hum==='skel'){if(k==='skel')b.add(G.hemi(.33,9),'#d0303a',T(0,.36,0,-.2,0,0));b.add(G.box(.18,.06,.04),'#1a1a1a',T(0,.18,.28))}}),0,1.0,0);
    add('armL',limb(.08,.42,skinC),-.33,.95,0);add('armR',limb(.08,.42,skinC),.33,.95,0);add('legL',limb(.1,.45,k==='gob'?skinC:cloth),-.12,.48,0);add('legR',limb(.1,.45,k==='gob'?skinC:cloth),.12,.48,0);
    const w=partMesh(b=>{if(k==='gob'){b.add(G.cyl(.05,.09,.6,5),'#7a4a24',T(0,-.3,0))}else if(hum==='skel'){b.add(G.box(.06,.6,.12),'#cfd6de',T(0,-.35,.05));b.add(G.tor(.08,.02,Math.PI,6),'#e0b030',T(0,-.05,.05))}else{b.add(G.box(.06,.75,.1),'#cfd6de',T(0,-.4,0));b.add(G.box(.25,.05,.08),'#e0b030',T(0,-.05,0))}});
    w.position.y=-.42;w.rotation.x=Math.PI/2;P.armR.add(w)}
  else if(k==='log'){add('body',partMesh(b=>{b.add(G.cyl(.4,.42,1.1,8),'#8a5a32',T(0,0,0));b.add(G.cyl(.38,.38,.02,8),'#e8b878',T(0,.56,0));b.add(G.sph(.1,5,4),'#ffffff',T(-.15,.15,.38));b.add(G.sph(.1,5,4),'#ffffff',T(.15,.15,.38));b.add(G.sph(.05,4,3),'#1a1a1a',T(-.15,.15,.46));b.add(G.sph(.05,4,3),'#1a1a1a',T(.15,.15,.46));b.add(G.box(.25,.05,.05),'#3a1a0a',T(0,-.08,.42));b.add(G.ico(.25,0),'#4cae3a',T(.2,.65,0))}),0,1.0,0);
    add('armL',limb(.07,.4,'#7a4a2a'),-.45,1.1,0);add('armR',limb(.07,.4,'#7a4a2a'),.45,1.1,0);add('legL',limb(.09,.45,'#7a4a2a'),-.18,.48,0);add('legR',limb(.09,.45,'#7a4a2a'),.18,.48,0)}
  else if(k==='fung'){add('body',partMesh(b=>{b.add(G.cyl(.3,.36,.7,8),'#f4e6cc',T(0,0,0));b.add(G.sph(.06,5,4),'#1a1a1a',T(-.12,.15,.3));b.add(G.sph(.06,5,4),'#1a1a1a',T(.12,.15,.3));b.add(G.box(.18,.04,.04),'#5a2a1a',T(0,0,.33))}),0,.85,0);
    add('head',partMesh(b=>{b.add(G.hemi(.62,10),'#c84a8a',T(0,0,0,0,0,0,1,.6,1));[[.3,.25,.25],[-.25,.28,.22],[0,.35,-.3],[.35,.2,-.25]].forEach(([x,y,z])=>b.add(G.sph(.08,5,4),'#ffe0f0',T(x,y,z)))}),0,1.2,0);
    add('armL',limb(.07,.38,'#f4e6cc'),-.36,1.0,0);add('armR',limb(.07,.38,'#f4e6cc'),.36,1.0,0);add('legL',limb(.1,.42,'#e6d4b4'),-.14,.45,0);add('legR',limb(.1,.42,'#e6d4b4'),.14,.45,0)}
  else if(k==='yeti'){add('body',partMesh(b=>{b.add(G.sph(.55,8,6),'#f2f4fa',T(0,0,0,0,0,0,1,1.15,.9))}),0,1.0,0);
    add('head',partMesh(b=>{b.add(G.sph(.38,8,6),'#f2f4fa',T(0,.3,0));b.add(G.sph(.28,8,6),'#f4a8c8',T(0,.26,.2,0,0,0,1,.8,.6));b.add(G.sph(.1,5,4),'#ffffff',T(0,.36,.38));b.add(G.sph(.05,4,3),'#30307a',T(0,.36,.46));b.add(G.cone(.09,.38,5),'#4aa8f0',T(0,.78,0))}),0,1.5,0);
    add('armL',limb(.15,.7,'#f2f4fa'),-.62,1.35,0);add('armR',limb(.15,.7,'#f2f4fa'),.62,1.35,0);add('legL',limb(.17,.5,'#f2f4fa'),-.25,.55,0);add('legR',limb(.17,.5,'#f2f4fa'),.25,.55,0)}
  g.scale.setScalar(ENEMY[k].sc);g.userData={P,k};return g}
// ---------------- 飛ぶ資源のかけら ----------------
const PIECE_GEO={};function pieceGeo(k){if(PIECE_GEO[k])return PIECE_GEO[k];const b=new MB(),c=RES[k].c;
  (({wood:()=>{b.add(G.cyl(.13,.13,.5,6),c,T(0,0,0,0,0,Math.PI/2));b.add(G.cyl(.12,.12,.02,6),'#e8b878',T(.26,0,0,0,0,Math.PI/2))},plank:()=>b.add(G.box(.55,.1,.22),c),rock:()=>b.add(G.dod(.2),c),steel:()=>b.add(G.box(.42,.14,.2),c),
   azr:()=>b.add(G.box(.26,.26,.26),c),ame:()=>b.add(G.cyl(.1,.1,.35,6),c),shroom:()=>{b.add(G.hemi(.2,7),c);b.add(G.cyl(.07,.08,.15,5),'#f6ead6',T(0,-.07,0))},meat:()=>b.add(G.sph(.17,6,5),c,T(0,0,0,0,0,0,1.3,1,1)),
   dia:()=>b.add(G.oct(.18),c),sul:()=>b.add(G.oct(.17),c,T(0,0,0,0,0,0,1,1.6,1)),ura:()=>b.add(G.cyl(.11,.11,.3,6),c),cact:()=>b.add(G.cyl(.1,.1,.35,6),c),ruby:()=>b.add(G.oct(.18),c,T(0,0,0,0,0,0,1,1.4,1)),
   coin:()=>b.add(G.cyl(.18,.18,.05,10),c,T(0,0,0,Math.PI/2,0,0)),core:()=>b.add(G.ico(.2,1),c)})[k]||PIECE_EXTRA[k]&&(()=>PIECE_EXTRA[k](b,c))||(()=>b.add(G.dod(.18),c)))();return PIECE_GEO[k]=b.geo()}
