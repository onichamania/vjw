// ===================== 世界（地形・フィールド・建物） =====================
// 本家（ふだんの状態）のマップを、Wiki の上から見た写真と動画のコマを見ながら並べた。
// 向き：ハイブを正面から見て右がマイナスX（本家と同じく、右はしがスロット1）。ハイブの反対（マイナスZ）にフィールドと山がある。
const G={t:0,dt:0,field:null,state:'boot',night:0,me:null};
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('c').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xcfe8ff,150,460);
const cam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,900);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()});
// ---- 光（Roblox のように明るく、影はやわらかく） ----
const hemi=new THREE.HemisphereLight(0xf2f8ff,0x88a870,.82);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfffaf0,.78);sun.position.set(40,80,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
const SC=sun.shadow.camera;SC.left=-45;SC.right=45;SC.top=45;SC.bottom=-45;SC.near=1;SC.far=240;sun.shadow.bias=-.0008;scene.add(sun);scene.add(sun.target);
// 空（上はこい青、地平線は白っぽい）
const skyGeo=new THREE.SphereGeometry(800,24,12);{const c=[],p=skyGeo.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/800,k=clamp(y*1.7+.05,0,1);c.push(lerp(.86,.38,k),lerp(.94,.66,k),lerp(1,.98,k))}skyGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,3))}
const sky=new THREE.Mesh(skyGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(sky);
// ---- 決まった乱数（毎回同じ並びにする） ----
let _sd=1;const sseed=s=>{_sd=(s>>>0)||1},srnd=()=>{_sd=(Math.imul(_sd,1664525)+1013904223)>>>0;return _sd/4294967296},srr=(a,b)=>a+srnd()*(b-a);
const hashS=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0};
// ---- テクスチャ（キャンバスで描く） ----
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}t.anisotropy=4;return t}
const noise=(g,w,h,cols,n)=>{for(let i=0;i<n;i++){g.fillStyle=pick(cols);const s=rr(1,3);g.fillRect(Math.random()*w,Math.random()*h,s,s)}};
const grassTex=ctex(128,128,(g,w,h)=>{g.fillStyle='#63c247';g.fillRect(0,0,w,h);noise(g,w,h,['#5fbd43','#68c84c','#5db942'],500)},1);grassTex.repeat.set(140,140);
const stoneTex=ctex(64,64,(g,w,h)=>{g.fillStyle='#aeb3ba';g.fillRect(0,0,w,h);noise(g,w,h,['#a2a7ae','#b9bec5','#9a9fa6'],380)},1);
const woodTex=ctex(64,64,(g,w,h)=>{g.fillStyle='#a8743f';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8){g.fillStyle=y%16?'#9a6835':'#b27d46';g.fillRect(0,y,w,7)}noise(g,w,h,['#87582c','#bf8a52'],100)},1);
const flowerTexN=n=>ctex(64,64,(g)=>{const P=n===1?[[32,32,1]]:n===2?[[22,24,.85],[42,40,.85]]:[[21,22,.78],[43,24,.78],[32,43,.78]];
  // 本家の小さな花（4まいの花びら＋まん中）
  for(const [x,y,s] of P){g.fillStyle='#ffffff';for(let k=0;k<4;k++){const a=k/4*TAU+Math.PI/4;g.beginPath();g.arc(x+Math.cos(a)*5.2*s,y+Math.sin(a)*5.2*s,4.6*s,0,TAU);g.fill()}
    g.fillStyle='#fff3b0';g.beginPath();g.arc(x,y,2.6*s,0,TAU);g.fill()}});
const FLTEX=[flowerTexN(1),flowerTexN(2),flowerTexN(3)];
FLTEX.forEach(t=>{t.magFilter=THREE.LinearFilter});
// マテリアル：M は毎回あたらしく作る（あとで色を変える物用）、MC は同じ色を使い回す（動かない物用）
const M=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
const _mc={};const MC=c=>_mc[c]||(_mc[c]=new THREE.MeshLambertMaterial({color:c}));
const MAT={grass:M(0xffffff,{map:grassTex}),stone:M(0xffffff,{map:stoneTex}),wood:M(0xffffff,{map:woodTex}),white:MC(0xf4f4f4),dark:MC(0x2b2b33),
  yellow:MC(0xffc93c),black:MC(0x1c1c22),red:MC(0xd8343a),green:MC(0x3fae3a),dgreen:MC(0x2f7a2a),brown:MC(0x7a5232),blue:MC(0x3a7ae0),pink:MC(0xff8ac0),orange:MC(0xff8a2a),honey:M(0xffb320,{emissive:0x3a2200})};
function mesh(geo,mat,x,y,z,par,shadow){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(shadow!==false){m.castShadow=true;m.receiveShadow=true}(par||scene).add(m);return m}
const box=(w,h,d,mat,x,y,z,par,sh)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,par,sh);
const cyl=(rt,rb,h,seg,mat,x,y,z,par,sh)=>mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat,x,y,z,par,sh);
const sph=(r,mat,x,y,z,par,sh)=>mesh(new THREE.SphereGeometry(r,12,9),mat,x,y,z,par,sh);
// 文字の看板（キャンバス）
function textSprite(text,o){o=o||{};const fs=o.fs||48,c=document.createElement('canvas'),g=c.getContext('2d');g.font='900 '+fs+'px sans-serif';const w=Math.ceil(g.measureText(text).width)+40,h=fs+28;c.width=w;c.height=h;
  g.font='900 '+fs+'px sans-serif';if(o.bg!==false){g.fillStyle=o.bg||'rgba(0,0,0,.55)';const r=18;g.beginPath();g.moveTo(r,0);g.arcTo(w,0,w,h,r);g.arcTo(w,h,0,h,r);g.arcTo(0,h,0,0,r);g.arcTo(0,0,w,0,r);g.fill()}
  g.fillStyle=o.col||'#fff';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText(text,w/2,h/2+2);g.fillText(text,w/2,h/2+2);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false,fog:false}));const k=(o.size||1)*.02;s.scale.set(w*k,h*k,1);if(o.pos)s.position.copy(o.pos);(o.par||scene).add(s);return s}
// 文字を描いた板（向きを決められる看板）
function textBoard(lines,w,h,o){o=o||{};const W=256,H=Math.round(256*h/w);const t=ctex(W,H,(g)=>{g.fillStyle=o.bg||'#8a5a2c';g.fillRect(0,0,W,H);g.strokeStyle=o.edge||'#5a3818';g.lineWidth=10;g.strokeRect(5,5,W-10,H-10);
  g.fillStyle=o.col||'#fff';g.textAlign='center';g.textBaseline='middle';const n=lines.length;for(let i=0;i<n;i++){const fs=Math.min(H/(n+.6)*.8,(o.fs||64));g.font='900 '+fs+'px sans-serif';g.lineWidth=5;g.strokeStyle='rgba(0,0,0,.45)';const y=H*(i+.5+.3*(n>1?0:0))/n+(n>1?0:2);g.strokeText(lines[i],W/2,y,W-24);g.fillText(lines[i],W/2,y,W-24)}});
  return new THREE.MeshLambertMaterial({map:t})}
// ================= 地形：台地・坂（当たり判定もこれで） =================
// SURF: 上に立てる面 {x0,x1,z0,z1,y, ramp?} / SOLID: 壁にもなる箱 {x0,x1,z0,z1,y0,y1}
const SURF=[],SOLID=[];
// [x0,x1,z0,z1,高さ,見た目] 見た目：g=芝生 y=黄色い床（5ハチのゾーン） s=石（山） b=青い壁
const PLAT=[
 [77,108,-47,-20,3,'g'],                       // クローバー畑の台（はしごで上る）
 [-2,110,-98,-64,8,'y'],                       // 5ハチのゾーン
 [-18,-2,-72,-64,8,'y'],                       // 15ハチのゲートの前
 [-10,-2,-98,-72,16,'b'],                      // 青い壁
 [-56,-18,-64,-14,16,'g'],[-18,-10,-40,-14,16,'g'],[-56,-18,-98,-64,16,'g'],[-56,21,-154,-98,16,'g'],   // 15ハチのゾーン
 [62,102,-160,-98,16,'g'],[112,140,-160,-98,16,'g'],[102,112,-160,-112,16,'g'],                     // 10ハチのゾーン
 [21,62,-158,-106,40,'s'],[21,27,-106,-98,40,'s'],                                                  // 山（てっぺん）
 [-75,20,22,76,6,'g'],                         // 35ハチのゾーン
 [24,50,28,74,4,'g']];                         // アリのゾーン
// 坂。st：y=黄色 l=はしご s=石 w=木 g=芝生
const RAMPS=[
 {x0:44,x1:54,z0:-64,z1:-41,ax:'z',a0:-41,y0:0,a1:-64,y1:8,st:'y'},
 {x0:71,x1:77,z0:-29,z1:-25,ax:'x',a0:71,y0:0,a1:77,y1:3,st:'l'},{x0:71,x1:77,z0:-43,z1:-39,ax:'x',a0:71,y0:0,a1:77,y1:3,st:'l'},
 {x0:102,x1:112,z0:-112,z1:-98,ax:'z',a0:-98,y0:8,a1:-112,y1:16,st:'g'},
 {x0:-18,x1:-10,z0:-64,z1:-40,ax:'z',a0:-64,y0:8,a1:-40,y1:16,st:'s'},{x0:-18,x1:-10,z0:-98,z1:-72,ax:'z',a0:-72,y0:8,a1:-98,y1:16,st:'s'},
 {x0:27,x1:62,z0:-106,z1:-98,ax:'x',a0:62,y0:16,a1:27,y1:40,st:'s'},
 {x0:-27,x1:-19,z0:12,z1:22,ax:'z',a0:12,y0:0,a1:22,y1:6,st:'w'},{x0:33,x1:41,z0:18,z1:28,ax:'z',a0:18,y0:0,a1:28,y1:4,st:'w'}];
const WB={x0:-62,x1:144,z0:-168,z1:80};   // 遊べる広さ（まわりは青い壁）
const WORLD=Object.assign({},WB);
function rampY(r,x,z){const a=r.ax==='x'?x:z,k=clamp((a-r.a0)/(r.a1-r.a0),0,1);return lerp(r.y0,r.y1,k)}
function surfTop(s,x,z){return s.ramp?rampY(s.ramp,x,z):s.y}
// (x,z)で、今の高さyから上れる（段差0.65以内）いちばん高い床
function groundAt(x,z,y,rad){let best=0;for(const s of SURF){if(x<s.x0||x>s.x1||z<s.z0||z>s.z1)continue;const t=surfTop(s,x,z);if(t<=y+.65&&t>best)best=t}
  for(const b of SOLID){if(b.off||x<b.x0||x>b.x1||z<b.z0||z>b.z1)continue;if(b.y1<=y+.65&&b.y1>best)best=b.y1}return best}
// 動けるか（壁：上れない高さの床・建物）
function blocked(x,z,y,r){r=r||.4;if(x<WORLD.x0||x>WORLD.x1||z<WORLD.z0||z>WORLD.z1)return true;
  for(const s of SURF){if(x+r<s.x0||x-r>s.x1||z+r<s.z0||z-r>s.z1)continue;const t=surfTop(s,clamp(x,s.x0,s.x1),clamp(z,s.z0,s.z1));if(t>y+.65&&!s.ramp)return true}
  for(const b of SOLID){if(b.off)continue;if(x+r<b.x0||x-r>b.x1||z+r<b.z0||z-r>b.z1)continue;if(b.y1>y+.65&&b.y0<y+1.8)return true}return false}
function addSolid(x,z,w,d,y0,h,o){const b=Object.assign({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0,y1:y0+h},o||{});SOLID.push(b);return b}
const PSTY={g:{top:0x63c247,side:0x4f9e38,tex:1},y:{top:0xf6cf2c,side:0xe2b31c},s:{top:0xc4c8ce,side:0xa3a8b0,tex:2},b:{top:0x3d78d6,side:0x2f64c0}};
function platMats(st,w,h,d){const S=PSTY[st];const top=S.tex===1?(()=>{const t=grassTex.clone();t.needsUpdate=true;t.repeat.set(w/8,d/8);return M(0xffffff,{map:t})})():S.tex===2?(()=>{const t=stoneTex.clone();t.needsUpdate=true;t.repeat.set(w/6,d/6);return M(0xffffff,{map:t})})():MC(S.top);
  const sd=S.tex===2?(()=>{const t=stoneTex.clone();t.needsUpdate=true;t.repeat.set(Math.max(w,d)/6,h/6);return M(0xdddddd,{map:t})})():MC(S.side);return[sd,sd,top,sd,sd,sd]}
function buildTerrain(){
  const g=mesh(new THREE.PlaneGeometry(WORLD.x1-WORLD.x0+500,WORLD.z1-WORLD.z0+500),MAT.grass,(WORLD.x0+WORLD.x1)/2,0,(WORLD.z0+WORLD.z1)/2,scene,false);g.rotation.x=-Math.PI/2;g.receiveShadow=true;
  for(const [x0,x1,z0,z1,y,st] of PLAT){SURF.push({x0,x1,z0,z1,y});const w=x1-x0,d=z1-z0;const m=mesh(new THREE.BoxGeometry(w,y,d),platMats(st,w,y,d),(x0+x1)/2,y/2,(z0+z1)/2,scene,false);m.receiveShadow=true;
    // ふちに少し明るい線（本家の台のふちのように）
    if(st!=='b'){const e=MC(st==='y'?0xffe066:st==='s'?0xd8dce0:0x74d058);box(w,.12,.25,e,(x0+x1)/2,y+.02,z0+.12,scene,false);box(w,.12,.25,e,(x0+x1)/2,y+.02,z1-.12,scene,false)}}
  for(const r of RAMPS){SURF.push({x0:r.x0,x1:r.x1,z0:r.z0,z1:r.z1,ramp:r});buildRamp(r)}
  boundary()}
function buildRamp(r){const y=(x,z)=>rampY(r,x,z);
  if(r.st==='l'){ // はしご（木の柱と横木）
    const len=Math.hypot(r.x1-r.x0,r.y1-r.y0),ang=Math.atan2(r.y1-r.y0,r.x1-r.x0),cz=(r.z0+r.z1)/2,g=new THREE.Group();g.position.set((r.x0+r.x1)/2,(r.y0+r.y1)/2,cz);g.rotation.z=ang;scene.add(g);
    for(const s of[-1,1])box(len+.4,.25,.25,MAT.wood,0,.15,s*1.6,g);for(let k=-len/2+.4;k<len/2;k+=.7)box(.18,.18,3.4,MAT.wood,k,.15,0,g);return}
  const geo=new THREE.BufferGeometry(),X=[r.x0,r.x1],Z=[r.z0,r.z1],v=[];const P=[[X[0],Z[0]],[X[1],Z[0]],[X[1],Z[1]],[X[0],Z[1]]];
  const top=P.map(([x,z])=>[x,y(x,z),z]),bot=P.map(([x,z])=>[x,0,z]);const quad=(a,b,c,d)=>v.push(...a,...b,...c,...a,...c,...d);
  quad(top[0],top[3],top[2],top[1]);quad(bot[0],bot[1],top[1],top[0]);quad(bot[1],bot[2],top[2],top[1]);quad(bot[2],bot[3],top[3],top[2]);quad(bot[3],bot[0],top[0],top[3]);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.computeVertexNormals();
  const col={y:0xf6cf2c,s:0xbfc3c9,w:0xb07a44,g:0x63c247}[r.st]||0xc9a26a;const m=new THREE.Mesh(geo,M(col,{side:THREE.DoubleSide}));m.receiveShadow=true;m.castShadow=true;scene.add(m);
  if(r.st==='w'){ // 木の坂は板のすじ
    const L=r.ax==='z'?Math.abs(r.z1-r.z0):Math.abs(r.x1-r.x0);for(let k=1;k<L;k+=1.2){const a=lerp(r.a0,r.a1,k/L),px=r.ax==='x'?a:(r.x0+r.x1)/2,pz=r.ax==='z'?a:(r.z0+r.z1)/2;box(r.ax==='z'?r.x1-r.x0:.12,.06,r.ax==='z'?.12:r.z1-r.z0,MC(0x8a5a30),px,y(px,pz)+.03,pz,scene,false)}}}
// 世界のふち：本家のような高い青い壁と、その外の山
function boundary(){const W=WB,h=40,t=3,cx=(W.x0+W.x1)/2,cz=(W.z0+W.z1)/2,wall=MC(0x4b8ce0),lip=MC(0x8ec0f4);
  for(const [x,z,w,d] of[[cx,W.z0-t/2,W.x1-W.x0+2*t,t],[cx,W.z1+t/2,W.x1-W.x0+2*t,t],[W.x0-t/2,cz,t,W.z1-W.z0],[W.x1+t/2,cz,t,W.z1-W.z0]]){box(w,h,d,wall,x,h/2,z,scene,false);box(w+.6,1.2,d+.6,lip,x,h,z,scene,false);addSolid(x,z,w,d,-5,300)}
  sseed(77);const rock=MC(0x9aa6b4),snow=MC(0xf4f8ff);for(let i=0;i<34;i++){const a=i/34*TAU,R=srr(330,420),x=cx+Math.cos(a)*R*1.05,z=cz+Math.sin(a)*R*.95,r=srr(50,90),hh=srr(80,170);
    const m=mesh(new THREE.ConeGeometry(r,hh,5),rock,x,hh/2-6,z,scene,false);m.rotation.y=srr(0,TAU);if(hh>140)mesh(new THREE.ConeGeometry(r*.32,hh*.3,5),snow,x,hh*.86-6,z,scene,false).rotation.y=m.rotation.y}}
// ================= フィールドと花 =================
const FL={};   // フィールドごとの花のデータ
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_p=new THREE.Vector3(),_e=new THREE.Euler(-Math.PI/2,0,0);
const COLS=[new THREE.Color(1,1,1),new THREE.Color(.96,.22,.2),new THREE.Color(.28,.45,1)];
// フィールドの土台（1マスごとに少しずつちがう緑）
function fieldGroundTex(f){const W=f.w*4,H=f.h*4;const t=ctex(W,H,(g)=>{for(let j=0;j<f.h;j++)for(let i=0;i<f.w;i++){g.fillStyle=['#3c9c44','#40a148','#399742','#3e9f46'][(Math.random()*4)|0];g.fillRect(i*4,j*4,4,4)}});t.magFilter=THREE.NearestFilter;return t}
function buildField(id){const f=FIELDS[id],x0=f.x-f.w/2,z0=f.z-f.h/2,pts=[];
  for(let j=0;j<f.h;j++)for(let i=0;i<f.w;i++){const x=x0+i+.5,z=z0+j+.5;if(f.round&&Math.hypot(x-f.x,z-f.z)>f.w/2)continue;pts.push([x,z,i,j])}
  const top=f.y+.25,n=pts.length,D={id,f,n,x:new Float32Array(n),z:new Float32Array(n),c:new Uint8Array(n),s:new Uint8Array(n),fill:new Float32Array(n),goo:new Float32Array(n),flame:new Float32Array(n),idx:{},meshes:[],dirty:new Set(),y:top};
  const cs=f.c,ss=f.s,cum=(a,r)=>{let t=0;for(let k=0;k<a.length;k++){t+=a[k];if(r<t)return k}return a.length-1};
  const csum=cs[0]+cs[1]+cs[2],ssum=ss[0]+ss[1]+ss[2];
  pts.forEach(([x,z,i,j],k)=>{D.x[k]=x;D.z[k]=z;D.c[k]=cum(cs,Math.random()*csum);D.s[k]=1+cum(ss,Math.random()*ssum);D.fill[k]=1;D.idx[i+','+j]=k});
  D.x0=x0;D.z0=z0;
  // 土台：少し高い板（上はこい緑のマス、ふちはもっとこい緑）
  const gt=fieldGroundTex(f),topM=M(0xffffff,{map:gt}),side=MC(0x2f7d36);
  if(f.round){const r=f.w/2+.3,c=mesh(new THREE.CylinderGeometry(r,r,.6,48),[side,topM,side],f.x,f.y-.05,f.z,scene,false);c.receiveShadow=true;gt.repeat.set(1,1)}
  else{const b=mesh(new THREE.BoxGeometry(f.w+.5,.6,f.h+.5),[side,side,topM,side,side,side],f.x,f.y-.05,f.z,scene,false);b.receiveShadow=true}
  SURF.push({x0:x0-.25,x1:x0+f.w+.25,z0:z0-.25,z1:z0+f.h+.25,y:top});
  const geo=new THREE.PlaneGeometry(.92,.92);
  for(let t=0;t<3;t++){const im=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({map:FLTEX[t],alphaTest:.4}),n);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.receiveShadow=true;
    for(let k=0;k<n;k++)im.setColorAt(k,COLS[D.c[k]]);im.instanceColor.needsUpdate=true;scene.add(im);D.meshes.push(im)}
  for(let k=0;k<n;k++)flowerMat(D,k,true);for(const im of D.meshes)im.instanceMatrix.needsUpdate=true;
  FL[id]=D;
  fieldSign(f);decorate(id)}
// 花1つの見た目（大きさと高さ）。集めると小さく低くなり、時間で元にもどる
function flowerMat(D,k,init){const s=D.s[k],t=Math.min(3,s)-1,fill=D.fill[k],sc=(.45+.55*fill)*(s>=4?1.2:1);
  _p.set(D.x[k],D.y+.02+fill*.06,D.z[k]);_q.setFromEuler(_e);
  for(let m=0;m<3;m++){_s.setScalar(m===t?sc:0);_m4.compose(_p,_q,_s);D.meshes[m].setMatrixAt(k,_m4)}
  if(!init)D.dirty.add(k)}
function flushFlowers(){for(const id in FL){const D=FL[id];if(D.dirty.size){for(const im of D.meshes)im.instanceMatrix.needsUpdate=true;D.dirty.clear()}}}
// 花のマス番号（フィールドの中ならその花、外なら-1）
function flowerAt(D,x,z){const i=Math.floor(x-D.x0),j=Math.floor(z-D.z0),k=D.idx[i+','+j];return k==null?-1:k}
function fieldAt(x,z,y){for(const id in FL){const f=FIELDS[id];if(Math.abs(x-f.x)<=f.w/2&&Math.abs(z-f.z)<=f.h/2&&Math.abs(y-f.y)<3.5){if(f.round&&Math.hypot(x-f.x,z-f.z)>f.w/2+.5)continue;return id}}return null}
// 花の回復（大きい花ほど早い）
function regrowFlowers(dt){for(const id in FL){const D=FL[id];for(let k=0;k<D.n;k++){if(D.goo[k]>0)D.goo[k]=Math.max(0,D.goo[k]-dt);if(D.flame[k]>0)D.flame[k]=Math.max(0,D.flame[k]-dt);
  const f=D.fill[k];if(f<1){const nf=Math.min(1,f+dt*(.035+.012*D.s[k]));if(Math.floor(nf*12)!==Math.floor(f*12)||nf===1){D.fill[k]=nf;flowerMat(D,k)}else D.fill[k]=nf}}}}
// フィールドの名前の立て札
function fieldSign(f){const g=new THREE.Group(),x=f.x+(f.round?0:f.w/2-1.5),z=f.z+f.h/2+1.6;g.position.set(x,f.y,z);scene.add(g);
  box(.3,2.6,.3,MAT.wood,0,1.3,0,g);const b=box(4.6,1.6,.25,[MAT.wood,MAT.wood,MAT.wood,MAT.wood,textBoard([f.jp],4.6,1.6),textBoard([f.jp],4.6,1.6)],0,2.7,0,g);
  if(f.zone)textSprite(f.zone+'ハチ',{pos:new THREE.Vector3(0,4,0),par:g,size:.5,bg:'rgba(30,60,140,.8)'})}
// ================= 作り物（本家の大きなかざり） =================
const tex1=(w,h,draw)=>{const t=ctex(w,h,draw);return t};
// キノコのかさ（赤に白いもよう）
const mushTopTex=tex1(128,128,(g,w,h)=>{g.fillStyle='#d8232e';g.fillRect(0,0,w,h);g.fillStyle='#ffffff';for(const [x,y,rx,ry,a] of[[64,64,22,15,0],[26,40,13,9,.6],[100,36,14,9,-.5],[30,96,12,8,-.3],[98,96,14,9,.4],[64,16,10,6,0],[64,114,10,6,0]]){g.beginPath();g.ellipse(x,y,rx,ry,a,0,TAU);g.fill()}});
const mushSideTex=tex1(256,32,(g,w,h)=>{g.fillStyle='#d8232e';g.fillRect(0,0,w,h);g.fillStyle='#ffffff';for(let x=10;x<w;x+=48){g.beginPath();g.ellipse(x,h/2,14,7,0,0,TAU);g.fill()}});
const pineTexP=tex1(64,64,(g,w,h)=>{g.fillStyle='#e0b041';g.fillRect(0,0,w,h);g.strokeStyle='#9a6a1a';g.lineWidth=3;for(let i=-64;i<128;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i+64,64);g.stroke();g.beginPath();g.moveTo(i+64,0);g.lineTo(i,64);g.stroke()}});
const pumpTex=tex1(64,32,(g,w,h)=>{g.fillStyle='#ff8a1a';g.fillRect(0,0,w,h);g.fillStyle='#e06a0a';for(let x=0;x<w;x+=8)g.fillRect(x,0,3,h)});
const strawTex=tex1(64,64,(g,w,h)=>{g.fillStyle='#d8262e';g.fillRect(0,0,w,h);g.fillStyle='#ffe27a';for(let y=4;y<h;y+=10)for(let x=(y%20?3:8);x<w;x+=10){g.beginPath();g.ellipse(x,y,1.6,2.4,0,0,TAU);g.fill()}});
const webTex=tex1(128,128,(g,w,h)=>{g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=3;const c=64;for(let k=0;k<8;k++){const a=k/8*TAU;g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.cos(a)*62,c+Math.sin(a)*62);g.stroke()}
  for(let r=12;r<62;r+=12){g.beginPath();for(let k=0;k<=8;k++){const a=k/8*TAU;g.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r)}g.stroke()}});
const trunkTex=tex1(32,64,(g,w,h)=>{g.fillStyle='#c8955a';g.fillRect(0,0,w,h);g.fillStyle='#a87240';for(let y=0;y<h;y+=10)g.fillRect(0,y,w,3)});
const barkTex=tex1(128,32,(g,w,h)=>{g.fillStyle='#7a4e28';g.fillRect(0,0,w,h);g.fillStyle='#5e3a1c';for(let x=0;x<w;x+=9)g.fillRect(x,0,3,h)});
barkTex.wrapS=THREE.RepeatWrapping;barkTex.repeat.set(6,1);
function stem(x,y,z,h,r,col,par){return cyl(r,r*1.25,h,6,MC(col||0x2f9a3a),x,y+h/2,z,par)}
function sunflowerDeco(x,y,z,h,face){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);stem(0,0,0,h,.22,0x3a9a3a,g);
  const hd=new THREE.Group();hd.position.set(0,h,0);hd.rotation.y=face;hd.rotation.x=-.35;g.add(hd);
  cyl(1.05,1.05,.45,16,MC(0x7a4a1c),0,0,0,hd).rotation.x=Math.PI/2;for(let k=0;k<12;k++){const a=k/12*TAU;const p=box(.8,1.25,.22,MC(0xffd21a),Math.cos(a)*1.55,Math.sin(a)*1.55,-.05,hd);p.rotation.z=a-Math.PI/2}
  const lf=box(1.6,.12,.7,MC(0x3aa83a),.7,h*.45,0,g);lf.rotation.z=.4}
function dandelionDeco(x,y,z,h,r){stem(x,y,z,h,.13,0x2f7a3a);const p=sph(r,MC(0xf6f6f6),x,y+h+r*.7,z);p.scale.set(1,.88,1)}
function mushroomDeco(x,y,z,r,h,solid){cyl(r*.28,r*.34,h,10,MC(0xf0e2c4),x,y+h/2,z);const cap=mesh(new THREE.CylinderGeometry(r,r,r*.42,24),[M(0xffffff,{map:mushSideTex}),M(0xffffff,{map:mushTopTex}),MC(0xf0e2c4)],x,y+h+r*.2,z);cap.rotation.y=srr(0,TAU);
  if(solid){addSolid(x,z,r*.6,r*.6,y,h);SURF.push({x0:x-r*.7,x1:x+r*.7,z0:z-r*.7,z1:z+r*.7,y:y+h+r*.42})}}
function blueFlowerDeco(x,y,z,h,s,face){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);stem(0,0,0,h,.16,0x2f8a3a,g);const hd=new THREE.Group();hd.position.set(0,h,0);hd.rotation.set(-.5,face,0);g.add(hd);
  for(let k=0;k<8;k++){const a=k/8*TAU;const p=sph(.55*s,MC(0x1f3fd0),Math.cos(a)*1.05*s,Math.sin(a)*1.05*s,0,hd);p.scale.set(1,.42,.25);p.rotation.z=a}cyl(.55*s,.55*s,.3,14,MC(0xe8b81a),0,0,.05,hd).rotation.x=Math.PI/2}
function cloverDeco(x,y,z,h,s){stem(x,y,z,h,.12,0x2f8a3a);for(let k=0;k<4;k++){const a=k/4*TAU+.4;for(const o of[-.32,.32]){const l=sph(.6*s,MC(0x3aa848),x+Math.cos(a)*s*.95+Math.cos(a+Math.PI/2)*o*s,y+h,z+Math.sin(a)*s*.95+Math.sin(a+Math.PI/2)*o*s);l.scale.set(1,.18,1)}}}
function bushDeco(x,y,z,s){const c=MC(0x2c6e2c);box(2.6*s,1.8*s,2.6*s,c,x,y+.9*s,z);box(1.8*s,1*s,1.8*s,c,x+.3*s,y+2.2*s,z-.2*s);addSolid(x,z,2.6*s,2.6*s,y,1.8*s)}
function strawberryDeco(x,y,z,s){const b=mesh(new THREE.SphereGeometry(s,16,12),M(0xffffff,{map:strawTex}),x,y+s*.75,z);b.scale.set(1,.95,1);for(let k=0;k<5;k++){const a=k/5*TAU;const l=box(.9*s,.08,.35*s,MC(0x2f9a3a),x+Math.cos(a)*.4*s,y+s*1.65,z+Math.sin(a)*.4*s);l.rotation.y=-a;l.rotation.z=.3}cyl(.08*s,.1*s,.5*s,5,MC(0x2f9a3a),x,y+s*1.9,z)}
function webDeco(x,y,z,s,ry){const w=mesh(new THREE.PlaneGeometry(4*s,4*s),new THREE.MeshBasicMaterial({map:webTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}),x,y+2.4*s,z,scene,false);w.rotation.y=ry}
function caveDeco(x,y,z,s,ry){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;scene.add(g);const r=MC(0x8a8e96);
  const a=mesh(new THREE.TorusGeometry(3.2*s,1.3*s,6,10,Math.PI),r,0,0,0,g);box(4.6*s,3*s,.3,MC(0x2a2a30),0,1.4*s,-.4,g)}
function bambooDeco(x,y,z,h){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);cyl(.38,.4,h,8,MC(0x7cc85a),0,h/2,0,g);for(let k=1.6;k<h;k+=2.2)cyl(.45,.45,.25,8,MC(0x5aa83a),0,k,0,g,false);
  for(let k=0;k<2;k++){const l=box(.9,.06,.25,MC(0x5aa83a),.5,h*srr(.4,.9),0,g);l.rotation.y=srr(0,TAU);l.rotation.z=-.4}}
function pineappleDeco(x,y,z,s){const b=mesh(new THREE.SphereGeometry(s,14,12),M(0xffffff,{map:pineTexP}),x,y+s*1.2,z);b.scale.set(1,1.3,1);for(let k=0;k<7;k++){const a=k/7*TAU;const c=mesh(new THREE.ConeGeometry(.28*s,1.3*s,4),MC(0x2f8a3a),x+Math.cos(a)*.25*s,y+s*2.9,z+Math.sin(a)*.25*s);c.rotation.z=Math.cos(a)*.6;c.rotation.x=Math.sin(a)*.6}}
function cactusDeco(x,y,z,h){const c=MC(0x2fa83a);cyl(.6,.6,h,8,c,x,y+h/2,z);sph(.6,c,x,y+h,z);const s=srnd()<.5?-1:1;
  cyl(.38,.38,1.2,8,c,x+s*.9,y+h*.55,z).rotation.z=Math.PI/2;cyl(.38,.38,1.4,8,c,x+s*1.4,y+h*.55+.7,z);sph(.38,c,x+s*1.4,y+h*.55+1.4,z);addSolid(x,z,1.2,1.2,y,h)}
function pumpkinDeco(x,y,z,s){const b=mesh(new THREE.SphereGeometry(s,16,10),M(0xffffff,{map:pumpTex}),x,y+s*.65,z);b.scale.set(1,.72,1);cyl(.15*s,.2*s,.6*s,6,MC(0x5a7a2a),x,y+s*1.35,z)}
function pineDeco(x,y,z,s){cyl(.35*s,.45*s,2.2*s,6,MC(0x6a4426),x,y+1.1*s,z);for(let k=0;k<4;k++){const c=mesh(new THREE.ConeGeometry((2.5-k*.5)*s,2.4*s,7),MC(k%2?0x2a6a34:0x2f7438),x,y+(2.2+k*1.35)*s,z);c.rotation.y=k*.4}addSolid(x,z,.9*s,.9*s,y,4*s)}
function roseDeco(x,y,z,h,s){stem(x,y,z,h,.14,0x2f7a3a);const r=MC(0xc8102e);sph(.7*s,r,x,y+h+.3*s,z);for(let k=0;k<6;k++){const a=k/6*TAU;const p=sph(.6*s,r,x+Math.cos(a)*.6*s,y+h,z+Math.sin(a)*.6*s);p.scale.set(.6,.9,.6)}
  const l=box(1.2,.08,.5,MC(0x3a9a3a),x+.6,y+h*.5,z);l.rotation.z=.4}
function rockDeco(x,y,z,s){const r=mesh(new THREE.DodecahedronGeometry(s,0),M(0xffffff,{map:stoneTex,flatShading:true}),x,y+s*.6,z);r.rotation.set(srr(0,3),srr(0,3),0);r.scale.y=.75;addSolid(x,z,s*1.4,s*1.4,y,s)}
function palmDeco(x,y,z,h){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);const n=Math.round(h/1.1),lean=srr(-.12,.12);
  for(let k=0;k<n;k++){const sg=cyl(.42-k*.012,.5-k*.012,1.05,8,M(0xffffff,{map:trunkTex}),lean*k*1.1,k*1.1+.5,0,g)}
  const top=new THREE.Group();top.position.set(lean*n*1.1,n*1.1+.4,0);g.add(top);for(let k=0;k<7;k++){const a=k/7*TAU;const l=new THREE.Group();l.rotation.y=a;top.add(l);const lf=box(3.8,.1,1,MC(k%2?0x3aa848:0x48b854),1.9,-.5,0,l);lf.rotation.z=-.35}
  for(let k=0;k<3;k++)sph(.4,MC(0x6a4426),Math.cos(k*2)*.5,-.4,Math.sin(k*2)*.5,top)}
function pepperDeco(x,y,z,s,col){const p=mesh(new THREE.SphereGeometry(s,12,10),MC(col),x,y+s,z);p.scale.set(.5,.5,1.7);p.rotation.y=srr(0,TAU);p.rotation.x=.25;const st=cyl(.12*s,.15*s,.8*s,5,MC(0x3a9a3a),x,y+s*1.4,z)}
// フィールドのまわりの場所（ふちの外）。side: 0=手前 1=奥 2=右 3=左
function edgePt(f,side,t,off){const x0=f.x-f.w/2,x1=f.x+f.w/2,z0=f.z-f.h/2,z1=f.z+f.h/2;off=off||1.6;
  return side===0?[lerp(x0,x1,t),z1+off]:side===1?[lerp(x0,x1,t),z0-off]:side===2?[x0-off,lerp(z0,z1,t)]:[x1+off,lerp(z0,z1,t)]}
const inPt=(f,m)=>[srr(f.x-f.w/2+m,f.x+f.w/2-m),srr(f.z-f.h/2+m,f.z+f.h/2-m)];
function decorate(id){const f=FIELDS[id],y=f.y,d=f.deco;sseed(hashS(id));const face=(x,z)=>Math.atan2(f.x-x,f.z-z)+Math.PI;
  if(d==='sunflower'){for(const [s,t] of[[1,.1],[1,.45],[1,.9],[0,.2],[0,.8],[2,.15],[3,.55],[3,.95]]){const [x,z]=edgePt(f,s,t,.8);sunflowerDeco(x,y,z,srr(5,8),face(x,z))}}
  if(d==='dandelion'){for(let i=0;i<7;i++){const [x,z]=edgePt(f,3,i/6,.6);dandelionDeco(x,y,z,srr(5,9),srr(1.2,1.8))}for(let i=0;i<5;i++){const [x,z]=inPt(f,3);dandelionDeco(x,y,z,srr(3,7),srr(1,1.5))}}
  if(d==='mushroom'){mushroomDeco(f.x-f.w/2+4,y,f.z+f.h/2-4,3.6,4.5,true);mushroomDeco(f.x+f.w/2-5,y,f.z-f.h/2+5,3.2,5.5,true);for(let i=0;i<6;i++){const [x,z]=inPt(f,2);mushroomDeco(x,y,z,srr(.9,1.6),srr(.8,1.6))}
    for(let i=0;i<4;i++){const [x,z]=edgePt(f,i%4,srr(.2,.8),2.5);mushroomDeco(x,y,z,srr(2.2,3.2),srr(3,6),true)}}
  if(d==='blueflower'){for(const [s,t] of[[0,.15],[0,.6],[1,.3],[1,.85],[2,.5],[3,.5]]){const [x,z]=edgePt(f,s,t,.9);blueFlowerDeco(x,y,z,srr(3.5,6),srr(.9,1.4),face(x,z))}}
  if(d==='clover'){for(let i=0;i<8;i++){const [x,z]=edgePt(f,i%4,srr(.1,.9),.8);cloverDeco(x,y,z,srr(1.5,3.5),srr(1,1.6))}bushDeco(f.x-f.w/2+2,y,f.z-f.h/2+2,1.1);bushDeco(f.x+f.w/2-2,y,f.z+f.h/2-2,1)}
  if(d==='strawberry'){for(const [s,t] of[[0,.1],[0,.9],[1,.2],[1,.75],[2,.5],[3,.4]]){const [x,z]=edgePt(f,s,t,1.8);strawberryDeco(x,y,z,srr(1.6,2.6))}}
  if(d==='spider'){caveDeco(f.x,y,f.z-f.h/2-2.5,1.4,0);webDeco(f.x-8,y,f.z-f.h/2-1,1.3,0);webDeco(f.x+9,y,f.z-f.h/2-1.2,1.1,.3);webDeco(f.x-f.w/2-1,y,f.z+3,1.2,Math.PI/2)}
  if(d==='bamboo'){for(let i=0;i<16;i++){const [x,z]=edgePt(f,1,i/15,srr(.8,2.2));bambooDeco(x,y,z,srr(9,15))}for(let i=0;i<5;i++){const [x,z]=edgePt(f,2,i/4,srr(.8,2));bambooDeco(x,y,z,srr(8,13))}
    box(f.w+6,9,1.2,MC(0x4f9e38),f.x,y+4.5,f.z-f.h/2-3.2)}
  if(d==='pineapple'){for(const [s,t] of[[0,.05],[0,.95],[1,.08],[1,.92],[2,.5]]){const [x,z]=edgePt(f,s,t,2);pineappleDeco(x,y,z,srr(1.8,2.8))}}
  if(d==='stump'){const r=f.w/2+.6;const ring=mesh(new THREE.CylinderGeometry(r+1.2,r+1.6,1.4,40,1,true),M(0xffffff,{map:barkTex,side:THREE.DoubleSide}),f.x,y+.5,f.z);
    mesh(new THREE.TorusGeometry(r+.6,.55,6,40),MC(0xc89458),f.x,y+1.2,f.z,scene,false).rotation.x=Math.PI/2;caveDeco(f.x,y,f.z-r-2,1.3,0)}
  if(d==='cactus'){for(let i=0;i<5;i++){const [x,z]=inPt(f,3);cactusDeco(x,y,z,srr(3,5.5))}for(let i=0;i<6;i++){const [x,z]=edgePt(f,i%4,srr(.1,.9),1.4);cactusDeco(x,y,z,srr(3.5,6.5))}}
  if(d==='pumpkin'){for(let i=0;i<7;i++){const [x,z]=edgePt(f,i%4,srr(.05,.95),1.8);pumpkinDeco(x,y,z,srr(1.4,2.6))}rockDeco(f.x-f.w/2-3,y,f.z,3)}
  if(d==='pinetree'){for(let i=0;i<7;i++){const [x,z]=inPt(f,3);pineDeco(x,y,z,srr(1.1,1.6))}for(let i=0;i<12;i++){const [x,z]=edgePt(f,i%4,srr(.05,.95),2);pineDeco(x,y,z,srr(1.4,2.1))}}
  if(d==='rose'){for(let i=0;i<8;i++){const [x,z]=edgePt(f,i%4,srr(.1,.9),1);roseDeco(x,y,z,srr(3,6),srr(1.2,1.8))}}
  if(d==='mountain'){for(let i=0;i<8;i++){const [x,z]=edgePt(f,i%4,srr(.05,.95),2.6);rockDeco(x,y,z,srr(1.4,2.6))}}
  if(d==='pepper'){for(const [s,t,c] of[[1,.2,0xd8202a],[1,.7,0xf2d24a],[2,.4,0xd8202a],[3,.6,0xd8202a],[0,.5,0xf2d24a]]){const [x,z]=edgePt(f,s,t,3.4);pepperDeco(x,y,z,srr(1.3,1.8),c)}}
  if(d==='coconut'){for(const [s,t] of[[1,.08],[1,.92],[0,.05],[0,.95],[2,.5]]){const [x,z]=edgePt(f,s,t,1.6);palmDeco(x,y,z,srr(8,11))}caveDeco(f.x,y,f.z+f.h/2+3,1.4,Math.PI);
    for(const [x,z] of[[f.x-f.w/2+2,f.z-f.h/2-1.5],[f.x+f.w/2-2,f.z+f.h/2+1.2]]){const c=mesh(new THREE.SphereGeometry(1.4,12,8,0,TAU,0,Math.PI/2),MC(0x6a4426),x,y,z)}}
  if(d==='ant'){const m=mesh(new THREE.ConeGeometry(4,3,10),MC(0xa06a3a),f.x+f.w/2+5,y+1.5,f.z);textSprite('アントチャレンジ（この版ではまだ）',{pos:new THREE.Vector3(f.x,y+4,f.z-f.h/2-2),size:.5})}}
// ================= 道・柵・飛び石（本家のスタート地点のように） =================
const _inst=[];
function instBoxes(list,w,h,d,col,shadow){if(!list.length)return;const im=new THREE.InstancedMesh(new THREE.BoxGeometry(w,h,d),MC(col),list.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),s=new THREE.Vector3(1,1,1),p=new THREE.Vector3();
  list.forEach(([x,y,z,ry,sx,sz],i)=>{e.set(0,ry||0,0);q.setFromEuler(e);s.set(sx||1,1,sz||1);p.set(x,y,z);m4.compose(p,q,s);im.setMatrixAt(i,m4)});im.receiveShadow=true;if(shadow)im.castShadow=true;scene.add(im);_inst.push(im);return im}
// 白いピケットフェンス（ax:'x' か 'z' の向きに a0→a1）
const FENCE_POSTS=[],FENCE_RAILS=[];
function fence(ax,c,a0,a1,y,gap){const n=Math.max(1,Math.round(Math.abs(a1-a0)/.9));for(let i=0;i<=n;i++){const a=lerp(a0,a1,i/n);if(gap&&a>gap[0]&&a<gap[1])continue;FENCE_POSTS.push(ax==='x'?[a,y+.8,c,0]:[c,y+.8,a,0])}
  const segs=gap?[[a0,gap[0]],[gap[1],a1]]:[[a0,a1]];for(const [b0,b1] of segs){const L=Math.abs(b1-b0);if(L<.5)continue;const m=(b0+b1)/2;for(const h of[.55,1.15])FENCE_RAILS.push(ax==='x'?[m,y+h,c,0,L/1,1]:[c,y+h,m,Math.PI/2,L/1,1]);
    if(ax==='x')addSolid(m,c,L,.3,y,1.4);else addSolid(c,m,.3,L,y,1.4)}}
function buildPaths(){
  // ハイブの前の、こい灰色の板
  sseed(5);const slabs=[];for(let i=0;i<30;i++){const x=srr(-4,60),z=srr(-15,-7.5);slabs.push([x,.04,z,srr(-.5,.5),srr(1,1.4),srr(1.6,2.4)])}instBoxes(slabs,1.6,.08,1,0x4a4c52);
  // 茶色い飛び石（タンポポ畑のまわり）
  const st=[];for(let z=-16;z>=-38;z-=2.3)st.push([23,.05,z,srr(-.3,.3),1,1]);for(let x=24;x<=58;x+=2.4)st.push([x,.05,-39.6,srr(-.3,.3),1,1]);for(let k=0;k<5;k++)st.push([-1+k*.8,.05,-14-k*1.4,.3,1,1]);
  for(let z=-21;z>=-37;z-=2.4)st.push([65,.05,z,srr(-.3,.3),1,1]);
  instBoxes(st,1.9,.1,1.1,0x6e4a2e);
  // 白い柵
  fence('x',-19.3,25,61,0,[40.5,45.5]);fence('z',61.6,-19.5,-38.5,0);fence('z',12.2,-19.5,-53.5,0,[-36,-31]);fence('x',-19.3,-8.5,12.2,0,[-1,4]);
  fence('x',-20.2,13,22,0,[16,19.5]);fence('x',-19,66,86,0,[70,74]);fence('x',-30,62,70,0);
  instBoxes(FENCE_POSTS,.32,1.6,.18,0xf4f4f4,true);
  const rails=[];for(const [x,y,z,ry,L] of FENCE_RAILS)rails.push([x,y,z,ry,L,1]);instBoxes(rails,1,.16,.1,0xf4f4f4,true);
  // 黒っぽい緑の植え込み
  for(const [x,z,s] of[[74,-22,1],[63,-50,1.1],[10,-60,1],[-4,-18,.8],[110,-18,1]])bushDeco(x,0,z,s);
  // ハチミツのランキング板（タンポポ畑のそば）
  const lb=new THREE.Group();lb.position.set(26,0,-17.6);scene.add(lb);for(const s of[-1,1])box(.3,3.2,.3,MAT.wood,s*2.2,1.6,0,lb);
  const lt=ctex(256,200,(g,w,h)=>{g.fillStyle='#3a2410';g.fillRect(0,0,w,h);g.fillStyle='#ffd23f';g.fillRect(8,8,w-16,34);g.fillStyle='#3a2410';g.font='900 24px sans-serif';g.textAlign='center';g.fillText('ハチミツランキング',w/2,34);
    g.font='bold 18px sans-serif';g.textAlign='left';for(let i=0;i<5;i++){g.fillStyle=i%2?'#e8d8b0':'#ffffff';g.fillText((i+1)+'.  ？？？',20,74+i*26)}});
  const bm=new THREE.MeshLambertMaterial({map:lt});box(4.8,3.6,.25,[MAT.wood,MAT.wood,MAT.wood,MAT.wood,bm,bm],0,3.6,0,lb)}
// ================= ハイブ =================
// 本家：黄色い大きなハイブが6つ横にならび、あいだはこげ茶の柱。前に黄色い台と白い丸（ここでハチミツを作る）
const HIVE_X=k=>5.9+9.2*k,HIVE_Z=4.9,HIVE_FRONT=2.2,HIVE_PADZ=-1.6,MY_HIVE=2;
const HFW=6,HFH=11.2,HFY=.9;   // 正面のハチの巣の絵（幅・高さ・下のはしの高さ）
const HIVES=[];
// スロットiのマスの場所（絵の左上が0,0）。スロット1は下の段の右はし
function hiveCellUV(i){const row=Math.floor(i/5),col=4-i%5,cw=1/5.3,ch=1/10.9;return[cw*(col+.65),1-(ch*(row+.72)+(col%2?ch*.5:0))]}
function buildHives(){const yel=MC(0xf2c230),yel2=MC(0xffd84a),brn=MC(0x4a2c12);
  for(let k=0;k<6;k++){const x=HIVE_X(k),g=new THREE.Group();g.position.set(x,0,0);scene.add(g);
    box(6.4,12.4,5.4,yel,0,6.2,HIVE_Z,g);box(6.8,.5,5.8,yel2,0,12.6,HIVE_Z,g);
    box(2.8,13.2,5.8,brn,4.6,6.6,HIVE_Z,g);addSolid(x+4.6,HIVE_Z,2.8,5.8,0,13.2);if(k===0){box(2.8,13.2,5.8,brn,-4.6,6.6,HIVE_Z,g);addSolid(x-4.6,HIVE_Z,2.8,5.8,0,13.2)}
    const c=document.createElement('canvas');c.width=240;c.height=448;const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
    const face=mesh(new THREE.PlaneGeometry(HFW,HFH),new THREE.MeshLambertMaterial({map:t}),0,HFY+HFH/2,HIVE_FRONT-.02,g,false);face.rotation.y=Math.PI;
    // 前の台（黄色いD字の台に白いだ円）
    box(6.4,.4,2.7,yel,0,.2,HIVE_FRONT-1.35,g);const half=mesh(new THREE.CylinderGeometry(3.4,3.4,.4,28,1,false,Math.PI/2,Math.PI),yel,0,.2,HIVE_FRONT-2.7,g);
    const pad=mesh(new THREE.CircleGeometry(2.5,32),M(0xfafafa),0,.41,HIVE_PADZ,g,false);pad.rotation.x=-Math.PI/2;pad.scale.set(1,.8,1);
    const ring=mesh(new THREE.RingGeometry(2.5,2.75,32),MC(0xffd84a),0,.42,HIVE_PADZ,g,false);ring.rotation.x=-Math.PI/2;ring.scale.set(1,.8,1);
    SURF.push({x0:x-3.2,x1:x+3.2,z0:HIVE_FRONT-6,z1:HIVE_FRONT,y:.4});addSolid(x,HIVE_Z,6.4,5.4,0,12.4);
    HIVES.push({x,z:HIVE_Z,g,c,t,pad});drawHive(k)}
  // 自分のハイブの名札
  const nb=box(5,1.3,.2,[MC(0x8a5a2c),MC(0x8a5a2c),MC(0x8a5a2c),MC(0x8a5a2c),textBoard(['あなた'],5,1.3,{bg:'#ffd84a',edge:'#c8901a',col:'#3a2400'}),textBoard(['あなた'],5,1.3,{bg:'#ffd84a',edge:'#c8901a',col:'#3a2400'})],HIVE_X(MY_HIVE),13.7,HIVE_FRONT+.2)}
// ハイブの正面の絵（ハチのいるマスにはハチの顔）
function drawHive(k){const H=HIVES[k];if(!H)return;const g=H.c.getContext('2d'),W=H.c.width,Hh=H.c.height,mine=k===MY_HIVE;g.fillStyle='#eab52a';g.fillRect(0,0,W,Hh);
  const cw=W/5.3,ch=Hh/10.9,R=Math.min(cw*.62,ch*.56);
  for(let i=0;i<50;i++){const [u,v]=hiveCellUV(i),x=u*W,y=v*Hh,b=mine?ST.hive[i]:null,open=mine?i<ST.slots:i<25;
    if(!open&&!mine)continue;g.beginPath();for(let a=0;a<6;a++){const t=a/6*TAU;g.lineTo(x+Math.cos(t)*R,y+Math.sin(t)*R*1.02)}g.closePath();
    g.fillStyle=!open?'rgba(160,100,20,.35)':b?'#86def4':'#c8851a';g.fill();g.lineWidth=b?5:3;g.strokeStyle=!open?'rgba(120,70,10,.4)':b?(b.g?'#ffe25a':'#3aa8d0'):'#9a5e10';g.stroke();
    if(b){const fc=beeFaceCanvas(b.t),s=R*1.05;g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x-s/2+2,y-s/2+3,s,s);g.drawImage(fc,x-s/2,y-s/2,s,s);
      g.fillStyle='#fff';g.font='bold 16px sans-serif';g.lineWidth=3;g.strokeStyle='#000';g.strokeText(b.lv,x-R*.95,y+R*.75);g.fillText(b.lv,x-R*.95,y+R*.75);if(b.g){g.fillStyle='#fff7a0';g.fillText('★',x+R*.35,y-R*.45)}}}
  H.t.needsUpdate=true}
// ================= 建物・クマ・機械・ゲート =================
const INTER=[];  // 近づくと「E」で使えるもの {x,y,z,r,label,act,zone}
function addInter(o){INTER.push(o);return o}
const FACE_DIR={px:[1,0],nx:[-1,0],pz:[0,1],nz:[0,-1]};
// 正面の絵（店の名前・まど・ドア）
function facadeMat(title,col,w,h,o){o=o||{};const W=512,H=Math.round(512*h/w);const t=ctex(W,H,(g)=>{const c='#'+col.toString(16).padStart(6,'0');g.fillStyle=c;g.fillRect(0,0,W,H);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,0,W,10);g.fillRect(0,H-10,W,10);
  g.fillStyle='rgba(255,255,255,.9)';g.font='900 '+Math.min(H*.2,W/Math.max(3,title.length)*1.25)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=8;g.strokeStyle='rgba(0,0,0,.35)';g.strokeText(title,W/2,H*.22,W-30);g.fillText(title,W/2,H*.22,W-30);
  g.fillStyle='rgba(170,220,255,.85)';for(const x of[W*.08,W*.72]){g.fillRect(x,H*.42,W*.2,H*.3);g.fillStyle='rgba(255,255,255,.4)';g.fillRect(x+6,H*.44,W*.05,H*.26);g.fillStyle='rgba(170,220,255,.85)'}
  if(o.hq){g.fillStyle='#3aa83a';g.beginPath();g.moveTo(W*.34,H);g.lineTo(W*.34,H*.55);g.arc(W*.5,H*.55,W*.16,Math.PI,0);g.lineTo(W*.66,H);g.fill();g.fillStyle='#fff';g.font='900 '+H*.16+'px sans-serif';g.fillText('HQ',W/2,H*.68)}
  else{g.fillStyle='#3a2a1a';g.fillRect(W*.38,H*.5,W*.24,H*.5);g.fillStyle='#c8301a';g.fillRect(W*.36,H*.96,W*.28,H*.04)}});return new THREE.MeshLambertMaterial({map:t})}
function shopBuilding(s,id){const w=s.w||12,h=s.h||8,d=s.d||10,face=s.face||'nz',[fx,fz]=FACE_DIR[face];const g=new THREE.Group();g.position.set(s.x,s.y,s.z);scene.add(g);
  const sideM=MC(s.col),fm=facadeMat(s.jp,s.col,face==='px'||face==='nx'?d:w,h,{hq:/HQ/.test(s.jp)}),mats=[sideM,sideM,MC(0x5a5a62),sideM,sideM,sideM];mats[{px:0,nx:1,pz:4,nz:5}[face]]=fm;
  box(w,h,d,mats,0,h/2,0,g);box(w+1,.6,d+1,MC(0x4a4a52),0,h+.3,0,g);addSolid(s.x,s.z,w,d,s.y,h);
  const half=(face==='px'||face==='nx')?w/2:d/2;return[s.x+fx*(half+2.2),s.z+fz*(half+2.2)]}
function bearModel(B){const g=new THREE.Group(),c=M(B.col),s=M(B.snout);
  if(B.bee){const m=beeMesh('honey');scene.remove(m);m.scale.setScalar(4.5);m.position.y=2.4;g.add(m);return g}
  box(2.2,2.4,1.5,c,0,2.6,0,g);box(2,2,1.9,c,0,4.8,0,g);box(1,.7,.5,s,0,4.5,-1.15,g);box(.35,.3,.2,MAT.black,0,4.75,-1.42,g);
  for(const sx of[-1,1]){box(.6,.6,.4,c,sx*.8,6,0,g);box(.22,.22,.1,MAT.black,sx*.45,5.15,-.96,g);box(.7,1.4,.7,c,sx*.55,.7,0,g);box(.6,1.8,.6,c,sx*1.45,2.8,0,g)}
  if(B.panda){for(const sx of[-1,1])box(.5,.5,.1,MAT.black,sx*.45,5.15,-.97,g);for(const sx of[-1,1])box(.6,.6,.4,MAT.black,sx*.8,6,0,g)}
  if(B.goggles){box(1.6,.3,.1,M(0x6ad0ff),0,5.2,-.98,g)}if(B.bow)box(1,.5,.3,MAT.pink,.6,5.95,-.2,g);
  if(B.ghost)g.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.75}});
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
// 機械（本家の自動販売機のような箱、白い台に色のついた輪）
function iconTex(ic,bg){return ctex(64,64,(g)=>{g.fillStyle=bg;g.fillRect(0,0,64,64);g.font='40px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(ic,32,36)})}
function vending(m,ring,awning){const g=new THREE.Group();g.position.set(m.x,m.y,m.z);scene.add(g);
  const base=mesh(new THREE.CylinderGeometry(2.6,2.6,.25,28),MC(0xf6f6f6),0,.12,0,g,false);const r=mesh(new THREE.TorusGeometry(2.6,.18,6,32),MC(ring),0,.25,0,g,false);r.rotation.x=Math.PI/2;
  const fr=new THREE.MeshLambertMaterial({map:iconTex(m.ic,'#'+ring.toString(16).padStart(6,'0'))});box(1.8,2.6,1.4,[MC(0x9a9ca4),MC(0x9a9ca4),MC(0x9a9ca4),MC(0x9a9ca4),MC(0x9a9ca4),fr],0,1.55,0,g);box(1.9,.3,1.5,MC(0x7a7c84),0,2.95,0,g);
  if(awning){const a=mesh(new THREE.BoxGeometry(3.2,.15,1.6),M(0xffffff,{map:ctex(64,16,(c)=>{for(let x=0;x<64;x+=8){c.fillStyle=x%16?'#ffffff':'#e02a2a';c.fillRect(x,0,8,16)}})}),0,3.6,-.6,g);a.rotation.x=.25}
  addSolid(m.x,m.z,1.8,1.4,m.y,3);return g}
function jar(m,col){const g=new THREE.Group();g.position.set(m.x,m.y,m.z);scene.add(g);cyl(1,1.05,2.2,16,MC(col),0,1.1,0,g);cyl(.75,.75,.35,16,MC(0xe8e8e8),0,2.35,0,g);cyl(.5,.5,.3,12,MC(0xe8e8e8),0,2.65,0,g);
  const l=mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshLambertMaterial({map:iconTex(m.ic,'#ffffff'),transparent:true}),0,1.1,-1.06,g,false);l.rotation.y=Math.PI;addSolid(m.x,m.z,2,2,m.y,2.8)}
function buildPlaces(){
  for(const id in SHOPS){const s=SHOPS[id];if(id==='demon'||id==='diamond'){const p=cyl(1.2,1.4,1.4,8,MC(s.col),s.x,s.y+.7,s.z);textSprite(s.jp,{pos:new THREE.Vector3(s.x,s.y+3.4,s.z),size:.6});
      addInter({x:s.x,y:s.y,z:s.z,r:3.5,label:()=>s.jp+'を見る',act:()=>openShop(id)});continue}
    const dim={noob:[16,10,12],bluehq:[13,10,20],redhq:[14,10,14],pro:[12,9,12],mtn:[12,8,10],guild:[10,8,10],coconut:[12,8,8],petal:[10,7,8],gummy:[10,7,8]}[id]||[10,8,9];
    const S2=Object.assign({},s,{w:dim[0],h:dim[1],d:dim[2]});
    if(id==='coconut'){caveDeco(s.x,s.y,s.z,1.6,0);addInter({x:s.x,y:s.y,z:s.z-3,r:4.5,label:()=>s.jp+'に入る',act:()=>openShop(id)});continue}
    const [ix,iz]=shopBuilding(S2,id);addInter({x:ix,y:s.y,z:iz,r:4.2,label:()=>s.jp+'に入る',act:()=>openShop(id)})}
  for(const id in MACHINES){const m=MACHINES[id];let lh=4.2;
    if(id.endsWith('cannon')){const g=new THREE.Group();g.position.set(m.x,m.y,m.z);scene.add(g);box(2.4,1.2,2.4,MAT.dark,0,.6,0,g);const b=mesh(new THREE.CylinderGeometry(.9,1.1,3.6,12),id==='redcannon'?MAT.red:id==='yellowcannon'?MAT.yellow:MAT.blue,0,2.2,0,g);b.rotation.x=-.7}
    else if(id==='kblair'||id==='tunnel'){caveDeco(m.x,m.y,m.z+(id==='kblair'?-1.2:0),1.1,0)}
    else if(/shop$/.test(id)){vending(m,{eggshop:0xe02a2a,treatshop:0xff8a2a,ticketshop:0xe02a2a,gumdropshop:0x3ac85a,stingershop:0x5a5a62,rjshop:0xd8a020}[id]||0xe02a2a,id==='eggshop'||id==='treatshop')}
    else if(id==='tickettent'){const g=new THREE.Group();g.position.set(m.x,m.y,m.z);scene.add(g);const tt=ctex(128,32,(c)=>{for(let x=0;x<128;x+=16){c.fillStyle=x%32?'#ffffff':'#e02a2a';c.fillRect(x,0,16,32)}});
      mesh(new THREE.ConeGeometry(4,3,16,1,true),M(0xffffff,{map:tt,side:THREE.DoubleSide}),0,4.5,0,g);for(let k=0;k<4;k++)cyl(.15,.15,3,6,MAT.white,Math.cos(k*Math.PI/2+.8)*3.4,1.5,Math.sin(k*Math.PI/2+.8)*3.4,g);lh=6.6}
    else if(id.startsWith('converter')){const g=new THREE.Group();g.position.set(m.x,m.y,m.z);scene.add(g);cyl(1.4,1.6,2.8,20,MC(0xf2f2f2),0,1.4,0,g);const r=mesh(new THREE.TorusGeometry(.9,.18,8,24),M(0x2ae0ff,{emissive:0x0a8aa0}),0,1.6,-1.45,g,false);
      cyl(1,1,.3,16,M(0x2ae0ff,{emissive:0x0a6a80}),0,2.95,0,g);addSolid(m.x,m.z,2.6,2.6,m.y,3)}
    else if(id.endsWith('dis'))jar(m,{blueberrydis:0x3a5ad8,strawberrydis:0xe02a3a,treatdis:0xc8905a,rjdis:0xf4f4f4,gluedis:0xb0a080,coconutdis:0x8a5a32}[id]||0xffc93c);
    else if(id.startsWith('booster')){const g=new THREE.Group();g.position.set(m.x,m.y,m.z);scene.add(g);box(2.4,1.6,2.4,MC(0x8a8a9a),0,.8,0,g);const col={booster_b:0x3a7ae0,booster_r:0xe0303a,booster_w:0xf0f0f0}[id];
      mesh(new THREE.SphereGeometry(1.2,16,10,0,TAU,0,Math.PI/2),M(col,{transparent:true,opacity:.8,emissive:col,emissiveIntensity:.25}),0,1.6,0,g);addSolid(m.x,m.z,2.4,2.4,m.y,2.6)}
    else if(id==='wealthclock'){box(2,3,1,MC(0x8a5a2c),m.x,m.y+1.5,m.z);const cf=mesh(new THREE.CircleGeometry(.8,24),new THREE.MeshLambertMaterial({map:iconTex('⏰','#fff8e0')}),m.x,m.y+2,m.z-.52,scene,false);cf.rotation.y=Math.PI;addSolid(m.x,m.z,2,1,m.y,3)}
    else if(id==='blender'){cyl(1.3,1.3,1.2,16,MC(0x5a5a62),m.x,m.y+.6,m.z);cyl(1,.8,2.2,16,M(0xc8f0ff,{transparent:true,opacity:.55}),m.x,m.y+2.3,m.z);addSolid(m.x,m.z,2.4,2.4,m.y,3.4)}
    else{box(2.2,2.6,2.2,MC(0xe8e0d0),m.x,m.y+1.3,m.z);box(1.8,.6,1.8,MC(0xffc93c),m.x,m.y+2.9,m.z)}
    textSprite(m.ic+' '+m.jp,{pos:new THREE.Vector3(m.x,m.y+lh,m.z),size:.5});
    addInter({x:m.x,y:m.y,z:m.z,r:3.6,label:()=>machineLabel(id),act:()=>useMachine(id)})}
  for(const id in BEARS){const B=BEARS[id],g=bearModel(B);g.position.set(B.x,B.y,B.z);g.rotation.y=Math.atan2(HIVE_X(MY_HIVE)-B.x,-5-B.z)+Math.PI;scene.add(g);B.g=g;
    textSprite(B.jp,{pos:new THREE.Vector3(B.x,B.y+7.6,B.z),size:.7,col:'#ffe27a'});addInter({x:B.x,y:B.y,z:B.z,r:4.2,label:()=>B.jp+'と話す',act:()=>talkBear(id)})}
  buildGates();buildZoneProps();
  // 雲
  sseed(9);for(let i=0;i<24;i++){const g=new THREE.Group();g.position.set(srr(WORLD.x0-80,WORLD.x1+80),srr(80,110),srr(WORLD.z0-80,WORLD.z1+80));for(let k=0;k<5;k++)mesh(new THREE.SphereGeometry(srr(5,9),8,6),M(0xffffff,{emissive:0x8a8a8a}),srr(-9,9),srr(-1,2),srr(-4,4),g,false);g.scale.y=.6;scene.add(g)}}
// ---- ゲート：青い壁に緑のアーチ、まん中に大きな数字（本家のハチの数のゲート） ----
const GATEWALL=[];
function numTex(n,bg,fg,ring){return ctex(128,128,(g)=>{if(ring){g.fillStyle=ring;g.beginPath();g.arc(64,64,63,0,TAU);g.fill();g.fillStyle=bg;g.beginPath();g.arc(64,64,52,0,TAU);g.fill()}else{g.fillStyle=bg;g.fillRect(0,0,128,128)}
  g.fillStyle=fg;g.font='900 '+(n>=10?70:84)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(n,64,70)})}
// 扉の絵：上が丸い赤い扉に、白い大きな数字
function doorTex(n){return ctex(128,160,(g,W,H)=>{const r=W/2-4;g.fillStyle='#a8361a';g.beginPath();g.moveTo(4,H);g.lineTo(4,r+4);g.arc(W/2,r+4,r,Math.PI,0);g.lineTo(W-4,H);g.fill();
  g.fillStyle='#dc5a30';g.beginPath();g.moveTo(12,H);g.lineTo(12,r+4);g.arc(W/2,r+4,r-8,Math.PI,0);g.lineTo(W-12,H);g.fill();
  g.fillStyle='#ffffff';g.font='900 '+(n>=10?62:76)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(n,W/2,H*.52);g.fillStyle='#ffd23f';g.beginPath();g.arc(W/2,H*.84,7,0,TAU);g.fill()})}
function buildGates(){for(const gt of GATES){const alongX=gt.x1-gt.x0>=gt.z1-gt.z0,span=alongX?gt.x1-gt.x0:gt.z1-gt.z0,cx=(gt.x0+gt.x1)/2,cz=(gt.z0+gt.z1)/2,y=gt.y;
    const g=new THREE.Group();g.position.set(cx,y,cz);if(!alongX)g.rotation.y=Math.PI/2;scene.add(g);const blue=MC(0x2f62d6),red=MC(0xc8452a),H=8.5,oh=5.6,e=gt.ext||[5,5];
    // 左右の壁と上
    // ローカルの+xは、横向きのゲート（Z方向）では世界の-Zになる
    for(const [s,L] of[[-1,e[0]],[1,e[1]]])if(L>0){box(L,H,1.2,blue,s*(span/2+L/2),H/2,0,g);if(alongX)addSolid(cx+s*(span/2+L/2),cz,L,1.2,y,H);else addSolid(cx,cz-s*(span/2+L/2),1.2,L,y,H)}
    box(span,H-oh,1.2,blue,0,oh+(H-oh)/2,0,g);
    // 出入り口のわく（赤いアーチ）
    for(const s of[-1,1])box(.5,oh,1.3,red,s*(span/2-.25),oh/2,0,g);box(span,.6,1.3,red,0,oh-.3,0,g);
    // 上の数字（両面）
    const nm=new THREE.MeshLambertMaterial({map:numTex(gt.n,'#2f62d6','#ffffff')});for(const s of[-1,1]){const p=mesh(new THREE.PlaneGeometry(2.4,2.4),nm,0,oh+1.4,s*.62,g,false);if(s<0)p.rotation.y=Math.PI}
    // 扉（ハチが足りないあいだは閉まっている。白い数字つき）
    const door=new THREE.Group();g.add(door);const dm=new THREE.MeshLambertMaterial({map:doorTex(gt.n),transparent:true,alphaTest:.5});
    for(const s of[-1,1]){const p=mesh(new THREE.PlaneGeometry(span-1,oh-.6),dm,0,(oh-.6)/2,s*.3,door,false);if(s<0)p.rotation.y=Math.PI}
    // 地面の丸い看板（白い丸に青いふちと数字）と、ハチの像
    const sd=gt.sd||1;   // 近づいてくる側（ローカルのz）
    const sign=mesh(new THREE.CircleGeometry(1.6,28),new THREE.MeshLambertMaterial({map:numTex(gt.n,'#ffffff','#2f62d6','#2f62d6')}),0,.06,sd*3.2,g,false);sign.rotation.x=-Math.PI/2;sign.rotation.z=sd>0?Math.PI:0;
    const st=beeMesh(gt.st||'basic');scene.remove(st);st.scale.setScalar(2.4);st.position.set(span/2+1.8,1.6,sd*2.2);st.rotation.y=sd>0?0:Math.PI;g.add(st);box(1.6,.6,1.6,MC(0xd8d8d8),span/2+1.8,.3,sd*2.2,g);
    gt.sol=addSolid(cx,cz,alongX?span:1.2,alongX?1.2:span,y,H);gt.wall=door;GATEWALL.push(gt)}}
function gatesUpdate(){const n=beeCount();for(const gt of GATEWALL){const ok=n>=gt.n;gt.sol.off=ok;gt.wall.visible=!ok}}
// ---- ゾーンごとの、ふちの壁や小物 ----
function buildZoneProps(){
  // スタート地点：赤い大砲の台、ハイブの後ろの道
  box(14,.4,10,MC(0xc8a070),-4,.2,3,scene,false);SURF.push({x0:-11,x1:3,z0:-2,z1:8,y:.4});
  // 10ハチのゾーン：パイナップル畑の後ろの黄色い壁
  box(14,9,1.2,MC(0xf2c230),104,20.5,-148,scene,false);
  // 山：まわりに大きな岩
  sseed(31);for(let i=0;i<9;i++){const x=srr(22,61),z=srr(-157,-108);if(x>28&&x<56&&z>-148&&z<-116)continue;rockDeco(x,40,z,srr(1.6,3))}
}
// ================= ボスの部屋（キングビートルのすみか・ホワイトトンネル） =================
const ROOMS={kblair:{x:330,z:0,w:34,d:34,exit:[68,-57,0],jp:'キングビートルのすみか'},tunnel:{x:330,z:-140,w:16,d:120,exit:[96,-151,16],jp:'ホワイトトンネル'}};
function buildRooms(){for(const id in ROOMS){const R=ROOMS[id],x0=R.x-R.w/2,z0=R.z-R.d/2;SURF.push({x0,x1:x0+R.w,z0,z1:z0+R.d,y:0});
  const fl=mesh(new THREE.PlaneGeometry(R.w,R.d),id==='kblair'?MAT.stone:M(0xf0f0f0),R.x,.02,R.z,scene,false);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  for(const [x,z,w,d] of[[R.x,z0-.5,R.w+2,1],[R.x,z0+R.d+.5,R.w+2,1],[x0-.5,R.z,1,R.d],[x0+R.w+.5,R.z,1,R.d]]){box(w,10,d,id==='kblair'?MAT.stone:M(0xffffff),x,5,z,scene,false);addSolid(x,z,w,d,0,10)}
  const ex=mesh(new THREE.CircleGeometry(1.6,20),M(0x5fd36a),R.x,.05,z0+R.d-3,scene,false);ex.rotation.x=-Math.PI/2;
  addInter({x:R.x,y:0,z:z0+R.d-3,r:2.6,label:()=>'外に出る',act:()=>{PL.inRoom=null;teleport(R.exit[0],R.exit[1],R.exit[2]);}})}
}
WORLD.x1=380;   // 部屋のぶんだけ世界を広げる（ふちの壁は広げる前の大きさ WB で作る）
