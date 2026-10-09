// ===================== 世界（地形・フィールド・建物） =====================
const G={t:0,dt:0,field:null,state:'boot',night:0,me:null};
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('c').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xa8d8f8,90,300);
const cam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,700);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()});
// ---- 光 ----
const hemi=new THREE.HemisphereLight(0xdff0ff,0x6a8a4a,.75);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff4e0,.85);sun.position.set(40,80,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
const SC=sun.shadow.camera;SC.left=-45;SC.right=45;SC.top=45;SC.bottom=-45;SC.near=1;SC.far=220;sun.shadow.bias=-.0008;scene.add(sun);scene.add(sun.target);
// 空（上が青く、下が白っぽいグラデーション）
const skyGeo=new THREE.SphereGeometry(600,24,12);{const c=[],p=skyGeo.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/600,k=clamp(y*1.6+.1,0,1);c.push(lerp(.78,.36,k),lerp(.9,.62,k),lerp(1,.98,k))}skyGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,3))}
const sky=new THREE.Mesh(skyGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(sky);
// ---- テクスチャ（キャンバスで描く） ----
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}t.anisotropy=4;return t}
const noise=(g,w,h,cols,n)=>{for(let i=0;i<n;i++){g.fillStyle=pick(cols);const s=rr(1,3);g.fillRect(Math.random()*w,Math.random()*h,s,s)}};
const grassTex=ctex(128,128,(g,w,h)=>{g.fillStyle='#5fbf4a';g.fillRect(0,0,w,h);noise(g,w,h,['#56b543','#6ac955','#4fa83e','#71cf5b'],900)},1);grassTex.repeat.set(160,160);
const fieldTex=ctex(64,64,(g,w,h)=>{g.fillStyle='#4f9e3a';g.fillRect(0,0,w,h);noise(g,w,h,['#46923a','#58a843','#3f8a34'],260);g.strokeStyle='#3d8530';g.lineWidth=1;g.strokeRect(.5,.5,w-1,h-1)},1);
const cliffTex=ctex(64,64,(g,w,h)=>{g.fillStyle='#8a6a48';g.fillRect(0,0,w,h);noise(g,w,h,['#7a5c3e','#9a7a56','#6e5236','#a5845e'],400);g.fillStyle='#5fbf4a';g.fillRect(0,0,w,6)},1);
const woodTex=ctex(64,64,(g,w,h)=>{g.fillStyle='#b07a45';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8){g.fillStyle=y%16?'#a06c3a':'#ba844c';g.fillRect(0,y,w,7)}noise(g,w,h,['#8a5a30','#c89058'],120)},1);
const stoneTex=ctex(64,64,(g,w,h)=>{g.fillStyle='#9aa0a8';g.fillRect(0,0,w,h);noise(g,w,h,['#8a9098','#aab0b8','#7a8088'],420)},1);
// 花（1つ・2つ・3つ）
function flowerTexN(n){return ctex(64,64,(g,w,h)=>{const P=n===1?[[32,32,15]]:n===2?[[21,24,12],[43,40,12]]:[[20,22,11],[44,22,11],[32,44,11]];
  for(const [x,y,r] of P){g.fillStyle='#ffffff';for(let k=0;k<6;k++){const a=k/6*TAU;g.beginPath();g.arc(x+Math.cos(a)*r*.62,y+Math.sin(a)*r*.62,r*.5,0,TAU);g.fill()}g.fillStyle='#ffe066';g.beginPath();g.arc(x,y,r*.38,0,TAU);g.fill()}})}
const FLTEX=[flowerTexN(1),flowerTexN(2),flowerTexN(3)];
const M=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
const MAT={grass:M(0xffffff,{map:grassTex}),cliff:M(0xffffff,{map:cliffTex}),wood:M(0xffffff,{map:woodTex}),stone:M(0xffffff,{map:stoneTex}),white:M(0xf4f4f4),dark:M(0x2b2b33),
  yellow:M(0xffc93c),black:M(0x1c1c22),red:M(0xd8343a),green:M(0x3fae3a),dgreen:M(0x2f7a2a),brown:M(0x7a5232),blue:M(0x3a7ae0),pink:M(0xff8ac0),orange:M(0xff8a2a),honey:M(0xffb320,{emissive:0x3a2200})};
function mesh(geo,mat,x,y,z,par,shadow){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(shadow!==false){m.castShadow=true;m.receiveShadow=true}(par||scene).add(m);return m}
const box=(w,h,d,mat,x,y,z,par,sh)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,par,sh);
// 文字の看板（キャンバス）
function textSprite(text,o){o=o||{};const fs=o.fs||48,c=document.createElement('canvas'),g=c.getContext('2d');g.font='900 '+fs+'px sans-serif';const w=Math.ceil(g.measureText(text).width)+40,h=fs+28;c.width=w;c.height=h;
  g.font='900 '+fs+'px sans-serif';if(o.bg!==false){g.fillStyle=o.bg||'rgba(0,0,0,.55)';const r=18;g.beginPath();g.moveTo(r,0);g.arcTo(w,0,w,h,r);g.arcTo(w,h,0,h,r);g.arcTo(0,h,0,0,r);g.arcTo(0,0,w,0,r);g.fill()}
  g.fillStyle=o.col||'#fff';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText(text,w/2,h/2+2);g.fillText(text,w/2,h/2+2);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false,fog:false}));const k=(o.size||1)*.02;s.scale.set(w*k,h*k,1);if(o.pos)s.position.copy(o.pos);(o.par||scene).add(s);return s}
// ================= 地形：台地・坂・建物（当たり判定もこれで） =================
// SURF: 上に立てる面 {x0,x1,z0,z1,y, ramp?} / SOLID: 壁にもなる箱 {x0,x1,z0,z1,y0,y1}
const SURF=[],SOLID=[];
const PLAT=[[-112,20,-112,-74,8],[-176,-88,-162,-112,16],[-24,70,-165,-112,24],[18,72,-112,-40,24],[-88,-50,-205,-146,48],[14,58,34,68,6],[78,118,54,94,14]];
const RAMPS=[{x0:-60,x1:-52,z0:-74,z1:-62,ax:'z',a0:-62,y0:0,a1:-74,y1:8},{x0:-110,x1:-102,z0:-112,z1:-98,ax:'z',a0:-98,y0:8,a1:-112,y1:16},
 {x0:10,x1:18,z0:-112,z1:-86,ax:'z',a0:-86,y0:8,a1:-112,y1:24},{x0:-50,x1:-24,z0:-160,z1:-150,ax:'x',a0:-24,y0:24,a1:-50,y1:48},
 {x0:24,x1:32,z0:14,z1:34,ax:'z',a0:14,y0:0,a1:34,y1:6},{x0:58,x1:78,z0:56,z1:64,ax:'x',a0:58,y0:6,a1:78,y1:14}];
const WORLD={x0:-196,x1:136,z0:-224,z1:108};
function rampY(r,x,z){const a=r.ax==='x'?x:z,k=clamp((a-r.a0)/(r.a1-r.a0),0,1);return lerp(r.y0,r.y1,k)}
function surfTop(s,x,z){return s.ramp?rampY(s.ramp,x,z):s.y}
// (x,z)で、今の高さyから上れる（段差0.6以内）いちばん高い床
function groundAt(x,z,y,rad){let best=0;for(const s of SURF){if(x<s.x0||x>s.x1||z<s.z0||z>s.z1)continue;const t=surfTop(s,x,z);if(t<=y+.65&&t>best)best=t}
  for(const b of SOLID){if(x<b.x0||x>b.x1||z<b.z0||z>b.z1)continue;if(b.y1<=y+.65&&b.y1>best)best=b.y1}return best}
// 動けるか（壁：上れない高さの床・建物）
function blocked(x,z,y,r){r=r||.4;if(x<WORLD.x0||x>WORLD.x1||z<WORLD.z0||z>WORLD.z1)return true;
  for(const s of SURF){if(x+r<s.x0||x-r>s.x1||z+r<s.z0||z-r>s.z1)continue;const t=surfTop(s,clamp(x,s.x0,s.x1),clamp(z,s.z0,s.z1));if(t>y+.65&&!s.ramp)return true}
  for(const b of SOLID){if(b.off)continue;if(x+r<b.x0||x-r>b.x1||z+r<b.z0||z-r>b.z1)continue;if(b.y1>y+.65&&b.y0<y+1.8)return true}return false}
function addSolid(x,z,w,d,y0,h,o){const b=Object.assign({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0,y1:y0+h},o||{});SOLID.push(b);return b}
function buildTerrain(){
  const g=mesh(new THREE.PlaneGeometry(WORLD.x1-WORLD.x0+60,WORLD.z1-WORLD.z0+60),MAT.grass,(WORLD.x0+WORLD.x1)/2,0,(WORLD.z0+WORLD.z1)/2,scene,false);g.rotation.x=-Math.PI/2;g.receiveShadow=true;
  for(const [x0,x1,z0,z1,y] of PLAT){SURF.push({x0,x1,z0,z1,y});const w=x1-x0,d=z1-z0;
    // 側面は崖、上は芝生
    const side=MAT.cliff.clone();side.map=cliffTex.clone();side.map.needsUpdate=true;side.map.repeat.set(w/8,y/8);
    const mats=[side,side,MAT.grass,MAT.grass,side,side];const m=mesh(new THREE.BoxGeometry(w,y,d),mats,(x0+x1)/2,y/2,(z0+z1)/2,scene,false);m.receiveShadow=true}
  for(const r of RAMPS){SURF.push({x0:r.x0,x1:r.x1,z0:r.z0,z1:r.z1,ramp:r});
    // 坂の形（くさび）
    const geo=new THREE.BufferGeometry(),X=[r.x0,r.x1],Z=[r.z0,r.z1],v=[];const y=(x,z)=>rampY(r,x,z);
    const P=[[X[0],Z[0]],[X[1],Z[0]],[X[1],Z[1]],[X[0],Z[1]]];
    const top=P.map(([x,z])=>[x,y(x,z),z]),bot=P.map(([x,z])=>[x,0,z]);
    const quad=(a,b,c,d)=>v.push(...a,...b,...c,...a,...c,...d);
    quad(top[0],top[3],top[2],top[1]);quad(bot[0],bot[1],top[1],top[0]);quad(bot[1],bot[2],top[2],top[1]);quad(bot[2],bot[3],top[3],top[2]);quad(bot[3],bot[0],top[0],top[3]);
    geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,M(0xc9a26a,{side:THREE.DoubleSide}));m.receiveShadow=true;scene.add(m);
    // 坂の手すり
    for(const s of[0,1]){const xs=r.ax==='z'?(s?r.x1:r.x0):null,zs=r.ax==='x'?(s?r.z1:r.z0):null;for(let k=0;k<=6;k++){const t=k/6,a=lerp(r.a0,r.a1,t),px=xs!=null?xs:a,pz=zs!=null?zs:a;box(.25,1.2,.25,MAT.white,px,y(px,pz)+.6,pz)}}}
  // 世界のふち：山の壁
  // 遊べる範囲（-196..136, -224..108）のすぐ外を、岩山でかこむ
  const rock=M(0x8a8f98),EX0=-196,EX1=136,EZ0=-224,EZ1=108;for(let i=0;i<64;i++){const t=i/64,per=2*((EX1-EX0)+(EZ1-EZ0));let d=t*per,x,z;
    if(d<EX1-EX0){x=EX0+d;z=EZ1}else if((d-=EX1-EX0)<EZ1-EZ0){x=EX1;z=EZ1-d}else if((d-=EZ1-EZ0)<EX1-EX0){x=EX1-d;z=EZ0}else{d-=EX1-EX0;x=EX0;z=EZ0+d}
    const r=rr(26,40),out=r+rr(2,8),cx0=(EX0+EX1)/2,cz0=(EZ0+EZ1)/2,nx=x+(x<=EX0?-out:x>=EX1?out:0),nz=z+(z<=EZ0?-out:z>=EZ1?out:0),h=rr(50,120);
    if(x>EX0&&x<EX1&&z>EZ0&&z<EZ1)continue;mesh(new THREE.ConeGeometry(r,h,6),rock,nx,h/2-4,nz,scene,false)}
  // 大きな山（山頂の畑の後ろ）
  mesh(new THREE.ConeGeometry(70,120,7),M(0x9aa4b0),-70,40,-260,scene,false);mesh(new THREE.ConeGeometry(30,30,7),M(0xffffff),-70,95,-260,scene,false)}
// ================= フィールドと花 =================
const FL={};   // フィールドごとの花のデータ
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_p=new THREE.Vector3(),_e=new THREE.Euler(-Math.PI/2,0,0);
const COLS=[new THREE.Color(1,1,1),new THREE.Color(1,.32,.3),new THREE.Color(.35,.58,1)];
function buildField(id){const f=FIELDS[id],x0=f.x-f.w/2,z0=f.z-f.h/2,pts=[];
  for(let j=0;j<f.h;j++)for(let i=0;i<f.w;i++){const x=x0+i+.5,z=z0+j+.5;if(f.round&&Math.hypot(x-f.x,z-f.z)>f.w/2)continue;pts.push([x,z,i,j])}
  const n=pts.length,D={id,f,n,x:new Float32Array(n),z:new Float32Array(n),c:new Uint8Array(n),s:new Uint8Array(n),fill:new Float32Array(n),goo:new Float32Array(n),flame:new Float32Array(n),idx:{},meshes:[],dirty:new Set(),y:f.y};
  const cs=f.c,ss=f.s,cum=(a,r)=>{let t=0;for(let k=0;k<a.length;k++){t+=a[k];if(r<t)return k}return a.length-1};
  const csum=cs[0]+cs[1]+cs[2],ssum=ss[0]+ss[1]+ss[2];
  pts.forEach(([x,z,i,j],k)=>{D.x[k]=x;D.z[k]=z;D.c[k]=cum(cs,Math.random()*csum);D.s[k]=1+cum(ss,Math.random()*ssum);D.fill[k]=1;D.idx[i+','+j]=k});
  D.x0=x0;D.z0=z0;
  // 地面
  const gm=mesh(new THREE.PlaneGeometry(f.w,f.h),M(0xffffff,{map:fieldTex.clone()}),f.x,f.y+.01,f.z,scene,false);gm.material.map.repeat.set(f.w/4,f.h/4);gm.material.map.needsUpdate=true;gm.rotation.x=-Math.PI/2;gm.receiveShadow=true;
  if(f.round){gm.geometry=new THREE.CircleGeometry(f.w/2,40)}
  const geo=new THREE.PlaneGeometry(.92,.92);
  for(let t=0;t<3;t++){const im=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({map:FLTEX[t],alphaTest:.45}),n);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.receiveShadow=true;
    for(let k=0;k<n;k++)im.setColorAt(k,COLS[D.c[k]]);im.instanceColor.needsUpdate=true;scene.add(im);D.meshes.push(im)}
  for(let k=0;k<n;k++)flowerMat(D,k,true);for(const im of D.meshes)im.instanceMatrix.needsUpdate=true;
  FL[id]=D;
  // 看板
  textSprite(f.jp+(f.zone?'（'+f.zone+'ハチ）':''),{pos:new THREE.Vector3(f.x,f.y+4.5,f.z+f.h/2+1.5),size:.9});
  decorate(id)}
// 花1つの見た目（大きさと高さ）
function flowerMat(D,k,init){const s=D.s[k],t=Math.min(3,s)-1,fill=D.fill[k],sc=(.42+.58*fill)*(s>=4?1.25:1);
  _p.set(D.x[k],D.y+.04+fill*.22,D.z[k]);_q.setFromEuler(_e);
  for(let m=0;m<3;m++){_s.setScalar(m===t?sc:0);_m4.compose(_p,_q,_s);D.meshes[m].setMatrixAt(k,_m4)}
  if(!init)D.dirty.add(k)}
function flushFlowers(){for(const id in FL){const D=FL[id];if(D.dirty.size){for(const im of D.meshes)im.instanceMatrix.needsUpdate=true;D.dirty.clear()}}}
// 花のマス番号（フィールドの中ならその花、外なら-1）
function flowerAt(D,x,z){const i=Math.floor(x-D.x0),j=Math.floor(z-D.z0),k=D.idx[i+','+j];return k==null?-1:k}
function fieldAt(x,z,y){for(const id in FL){const f=FIELDS[id];if(Math.abs(x-f.x)<=f.w/2&&Math.abs(z-f.z)<=f.h/2&&Math.abs(y-f.y)<3.5){if(f.round&&Math.hypot(x-f.x,z-f.z)>f.w/2+.5)continue;return id}}return null}
// 花の回復（大きい花ほど早い）
function regrowFlowers(dt){for(const id in FL){const D=FL[id];for(let k=0;k<D.n;k++){if(D.goo[k]>0)D.goo[k]=Math.max(0,D.goo[k]-dt);if(D.flame[k]>0)D.flame[k]=Math.max(0,D.flame[k]-dt);
  const f=D.fill[k];if(f<1){const nf=Math.min(1,f+dt*(.035+.012*D.s[k]));if(Math.floor(nf*12)!==Math.floor(f*12)||nf===1){D.fill[k]=nf;flowerMat(D,k)}else D.fill[k]=nf}}}}
// ---- フィールドのかざり（本家と同じ大きな作り物） ----
function decorate(id){const f=FIELDS[id],x0=f.x-f.w/2,x1=f.x+f.w/2,z0=f.z-f.h/2,z1=f.z+f.h/2,y=f.y;const edge=(n,fn)=>{for(let i=0;i<n;i++){const s=i%4,t=rr(.05,.95);let x,z;
  if(s===0){x=lerp(x0,x1,t);z=z0-1.5}else if(s===1){x=lerp(x0,x1,t);z=z1+1.5}else if(s===2){x=x0-1.5;z=lerp(z0,z1,t)}else{x=x1+1.5;z=lerp(z0,z1,t)}
  if(Math.abs(x-f.x)<3&&s===1)continue;fn(x,z)}};
  const d=f.deco;
  if(d==='sunflower')edge(8,(x,z)=>{const h=rr(5,8);mesh(new THREE.CylinderGeometry(.18,.25,h,6),MAT.green,x,y+h/2,z);const hd=mesh(new THREE.CylinderGeometry(1.6,1.6,.3,14),MAT.yellow,x,y+h,z);hd.rotation.x=1.2;const c=mesh(new THREE.CylinderGeometry(.8,.8,.34,12),MAT.brown,x,y+h,z+.05);c.rotation.x=1.2});
  if(d==='dandelion')edge(8,(x,z)=>{const h=rr(4,7);mesh(new THREE.CylinderGeometry(.15,.2,h,6),MAT.green,x,y+h/2,z);mesh(new THREE.SphereGeometry(1.3,10,8),M(0xffffff,{transparent:true,opacity:.85}),x,y+h,z)});
  if(d==='mushroom')edge(9,(x,z)=>{const h=rr(2.5,6),r=rr(1.6,3);mesh(new THREE.CylinderGeometry(.5,.7,h,8),M(0xf2e6d0),x,y+h/2,z);const cap=mesh(new THREE.SphereGeometry(r,14,8,0,TAU,0,Math.PI/2),MAT.red,x,y+h-.2,z);
    for(let k=0;k<5;k++){const a=rr(0,TAU),b=rr(.3,1.1);mesh(new THREE.SphereGeometry(r*.16,6,5),MAT.white,x+Math.cos(a)*Math.sin(b)*r*.95,y+h-.2+Math.cos(b)*r*.95,z+Math.sin(a)*Math.sin(b)*r*.95,scene,false)}});
  if(d==='blueflower')edge(8,(x,z)=>{const h=rr(3,6);mesh(new THREE.CylinderGeometry(.15,.2,h,6),MAT.green,x,y+h/2,z);for(let k=0;k<5;k++){const a=k/5*TAU;mesh(new THREE.SphereGeometry(.7,8,6),MAT.blue,x+Math.cos(a)*.9,y+h,z+Math.sin(a)*.9)}mesh(new THREE.SphereGeometry(.5,8,6),MAT.yellow,x,y+h+.1,z)});
  if(d==='clover')edge(8,(x,z)=>{const h=rr(2,4);mesh(new THREE.CylinderGeometry(.12,.15,h,6),MAT.green,x,y+h/2,z);for(let k=0;k<3;k++){const a=k/3*TAU;const l=mesh(new THREE.SphereGeometry(.9,8,6),MAT.green,x+Math.cos(a)*.8,y+h,z+Math.sin(a)*.8);l.scale.y=.3}});
  if(d==='strawberry')edge(8,(x,z)=>{const s=rr(1.4,2.4);const b=mesh(new THREE.SphereGeometry(s,10,8),MAT.red,x,y+s,z);b.scale.y=1.2;mesh(new THREE.ConeGeometry(s*.8,s*.5,6),MAT.green,x,y+s*2.3,z)});
  if(d==='spider'){edge(6,(x,z)=>{const w=mesh(new THREE.PlaneGeometry(4,4),M(0xffffff,{transparent:true,opacity:.35,side:THREE.DoubleSide}),x,y+2.5,z,scene,false)});const cv=mesh(new THREE.SphereGeometry(6,12,8,0,TAU,0,Math.PI/2),M(0x6a6a72),f.x,y,z0-4)}
  if(d==='bamboo')edge(18,(x,z)=>{const h=rr(8,14);mesh(new THREE.CylinderGeometry(.35,.35,h,7),M(0x8ac850),x,y+h/2,z);for(let k=2;k<h;k+=2.5)mesh(new THREE.CylinderGeometry(.42,.42,.2,7),M(0x6aa83a),x,y+k,z,scene,false)});
  if(d==='pineapple')edge(7,(x,z)=>{const s=rr(1.6,2.6);const b=mesh(new THREE.SphereGeometry(s,10,8),M(0xd8a83a),x,y+s*1.2,z);b.scale.y=1.4;for(let k=0;k<5;k++){const c=mesh(new THREE.ConeGeometry(.35,s*1.4,4),MAT.dgreen,x+Math.cos(k)*.3,y+s*3,z+Math.sin(k)*.3);c.rotation.z=Math.cos(k*1.3)*.5}});
  if(d==='stump'){const r=f.w/2+1;const st=mesh(new THREE.CylinderGeometry(r+1.5,r+2.5,2,28,1,true),M(0x8a5a32,{side:THREE.DoubleSide}),f.x,y+.6,f.z);mesh(new THREE.TorusGeometry(r+.8,.6,6,32),M(0xc8945a),f.x,y+1.6,f.z).rotation.x=Math.PI/2}
  if(d==='cactus')edge(10,(x,z)=>{const h=rr(3,6);mesh(new THREE.CylinderGeometry(.7,.8,h,8),MAT.dgreen,x,y+h/2,z);const a=mesh(new THREE.CylinderGeometry(.4,.4,2,6),MAT.dgreen,x+.9,y+h*.6,z);a.rotation.z=.6});
  if(d==='pumpkin')edge(10,(x,z)=>{const s=rr(1.2,2.2);const b=mesh(new THREE.SphereGeometry(s,12,8),MAT.orange,x,y+s*.8,z);b.scale.y=.75;mesh(new THREE.CylinderGeometry(.2,.25,.8,6),MAT.brown,x,y+s*1.6,z)});
  if(d==='pinetree'){edge(12,(x,z)=>pineTree(x,y,z,rr(1,1.6)));for(let k=0;k<4;k++)pineTree(rr(x0+3,x1-3),y,rr(z0+3,z1-3),.9)}
  if(d==='rose')edge(9,(x,z)=>{const h=rr(3,6);mesh(new THREE.CylinderGeometry(.15,.2,h,6),MAT.green,x,y+h/2,z);const r=mesh(new THREE.SphereGeometry(1,10,8),MAT.red,x,y+h,z);r.scale.y=.8});
  if(d==='mountain')edge(10,(x,z)=>{mesh(new THREE.DodecahedronGeometry(rr(1,2.2)),MAT.stone,x,y+.8,z)});
  if(d==='pepper')edge(9,(x,z)=>{const s=rr(1,1.8);const b=mesh(new THREE.SphereGeometry(s,8,8),Math.random()<.7?MAT.red:M(0xffd84a),x,y+s*1.8,z);b.scale.set(.7,1.8,.7)});
  if(d==='coconut')edge(9,(x,z)=>{const h=rr(7,11);mesh(new THREE.CylinderGeometry(.3,.45,h,7),M(0x9a7a4a),x,y+h/2,z);for(let k=0;k<6;k++){const l=mesh(new THREE.BoxGeometry(3.4,.12,.9),MAT.green,x+Math.cos(k)*1.5,y+h,z+Math.sin(k)*1.5);l.rotation.y=-k;l.rotation.z=-.35}
    for(let k=0;k<3;k++)mesh(new THREE.SphereGeometry(.4,8,6),MAT.brown,x+Math.cos(k*2)*.5,y+h-.5,z+Math.sin(k*2)*.5)});
  if(d==='ant'){mesh(new THREE.ConeGeometry(4,3,10),M(0xa06a3a),f.x-f.w/2-4,y+1.5,f.z)}}
function pineTree(x,y,z,s){mesh(new THREE.CylinderGeometry(.35*s,.45*s,2*s,6),MAT.brown,x,y+s,z);for(let k=0;k<3;k++)mesh(new THREE.ConeGeometry((2.4-k*.6)*s,2.6*s,8),MAT.dgreen,x,y+(2.2+k*1.6)*s,z)}
// ================= ハイブ =================
const HIVE_X=k=>-(9.2*(k+1)-4)-1,HIVE_Z=7,MY_HIVE=2;   // 6つのハイブ（左から）、自分は3番目
const HIVES=[];
function buildHives(){for(let k=0;k<6;k++){const x=HIVE_X(k),g=new THREE.Group();g.position.set(x,0,HIVE_Z);scene.add(g);
    box(8.4,14,3,MAT.wood,0,7,1.2,g);box(9,1,3.6,MAT.wood,0,14.3,1.2,g);
    const c=document.createElement('canvas');c.width=256;c.height=448;const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
    const face=mesh(new THREE.PlaneGeometry(7.6,13.3),new THREE.MeshLambertMaterial({map:t}),0,7,-.32,g,false);face.rotation.y=Math.PI;
    // 前の台（ここに立つとハチミツを作れる）
    const pad=mesh(new THREE.CircleGeometry(2.2,24),M(k===MY_HIVE?0xffd84a:0xd8c8a0),0,.03,-5.5,g,false);pad.rotation.x=-Math.PI/2;
    addSolid(x,HIVE_Z+1.2,8.4,3,0,14);
    HIVES.push({x,z:HIVE_Z,g,c,t,pad});drawHive(k)}
  textSprite('あなたのハイブ',{pos:new THREE.Vector3(HIVE_X(MY_HIVE),15.5,HIVE_Z-1),size:1,col:'#ffe27a'})}
// ハイブの正面の絵（ハチのいるマス）
function drawHive(k){const H=HIVES[k],g=H.c.getContext('2d'),W=H.c.width,Hh=H.c.height;g.fillStyle='#8a5a28';g.fillRect(0,0,W,Hh);
  const cw=W/5.2,ch=Hh/10.6;for(let r=0;r<10;r++)for(let c=0;c<5;c++){const i=(9-r)*5+c,x=cw*(c+.6),y=ch*(r+.55)+(c%2?ch/2:0),mine=k===MY_HIVE;
    const b=mine?ST.hive[i]:null,open=mine&&i<ST.slots;g.fillStyle=b?'#'+beeColHex(b.t):open?'#c8902a':'#5a3a18';g.beginPath();
    for(let a=0;a<6;a++){const t=a/6*TAU+Math.PI/6;g.lineTo(x+Math.cos(t)*cw*.52,y+Math.sin(t)*ch*.52)}g.closePath();g.fill();g.strokeStyle='#3a2208';g.lineWidth=3;g.stroke();
    if(b){g.fillStyle='#111';g.beginPath();g.arc(x-cw*.14,y-ch*.05,3.5,0,TAU);g.arc(x+cw*.14,y-ch*.05,3.5,0,TAU);g.fill();if(b.g){g.fillStyle='#fff7a0';g.font='14px sans-serif';g.fillText('★',x-6,y+ch*.32)}}}
  H.t.needsUpdate=true}
// ================= 建物・クマ・機械・ゲート =================
const INTER=[];  // 近づくと「E」で使えるもの {x,y,z,r,label,act,zone}
function addInter(o){INTER.push(o);return o}
function building(x,y,z,w,h,d,col,title,o){o=o||{};const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  box(w,h,d,M(col),0,h/2,0,g);const roof=mesh(new THREE.ConeGeometry(Math.max(w,d)*.75,3,4),M(o.roof||0x8a3a2a),0,h+1.5,0,g);roof.rotation.y=Math.PI/4;
  box(w*.35,h*.55,.3,MAT.dark,0,h*.28,d/2+.05,g);textSprite(title,{pos:new THREE.Vector3(0,h+4,d/2),par:g,size:.8,col:o.tcol||'#fff'});
  addSolid(x,z,w,d,y,h);return g}
function bearModel(B){const g=new THREE.Group(),c=M(B.col),s=M(B.snout);
  if(B.bee){const b=mesh(new THREE.SphereGeometry(1.4,14,10),MAT.yellow,0,2.4,0,g);b.scale.set(1,1,1.3);for(const z of[-.5,.4])box(2.9,.5,.5,MAT.black,0,2.4,z,g);for(const sx of[-1,1]){const w=mesh(new THREE.SphereGeometry(.9,8,6),M(0xffffff,{transparent:true,opacity:.6}),sx*1.1,3.6,0,g);w.scale.set(1,.2,.6)}return g}
  box(2.2,2.4,1.5,c,0,2.6,0,g);box(2,2,1.9,c,0,4.8,0,g);box(1,.7,.5,s,0,4.5,-1.15,g);box(.35,.3,.2,MAT.black,0,4.75,-1.42,g);
  for(const sx of[-1,1]){box(.6,.6,.4,c,sx*.8,6,0,g);box(.22,.22,.1,MAT.black,sx*.45,5.15,-.96,g);box(.7,1.4,.7,c,sx*.55,.7,0,g);box(.6,1.8,.6,c,sx*1.45,2.8,0,g)}
  if(B.panda){for(const sx of[-1,1])box(.5,.5,.1,MAT.black,sx*.45,5.15,-.97,g);for(const sx of[-1,1])box(.6,.6,.4,MAT.black,sx*.8,6,0,g)}
  if(B.goggles){box(1.6,.3,.1,M(0x6ad0ff),0,5.2,-.98,g)}if(B.bow)box(1,.5,.3,MAT.pink,.6,5.95,-.2,g);
  if(B.ghost)g.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.75}});
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
const GATEWALL=[];
function buildPlaces(){
  for(const id in SHOPS){const s=SHOPS[id];if(id==='demon'||id==='diamond'){const p=box(2,1.5,2,M(s.col),s.x,s.y+.75,s.z);textSprite(s.jp,{pos:new THREE.Vector3(s.x,s.y+3.4,s.z),size:.6});
      addInter({x:s.x,y:s.y,z:s.z,r:3.5,label:()=>s.jp+'を見る',act:()=>openShop(id)});continue}
    building(s.x,s.y,s.z,9,7,8,s.col,s.jp);addInter({x:s.x,y:s.y,z:s.z+5,r:4.5,label:()=>s.jp+'に入る',act:()=>openShop(id)})}
  for(const id in MACHINES){const m=MACHINES[id];
    if(id.endsWith('cannon')){const g=new THREE.Group();g.position.set(m.x,m.y,m.z);scene.add(g);box(2.4,1.2,2.4,MAT.dark,0,.6,0,g);const b=mesh(new THREE.CylinderGeometry(.9,1.1,3.6,12),id==='redcannon'?MAT.red:id==='yellowcannon'?MAT.yellow:MAT.blue,0,2.2,0,g);b.rotation.x=-.7}
    else if(id==='kblair'||id==='tunnel'){const p=mesh(new THREE.CircleGeometry(1.8,20),M(0x111111),m.x,m.y+1.8,m.z,scene,false);p.rotation.y=id==='kblair'?0:Math.PI/2}
    else{box(2.2,2.6,2.2,M(id.startsWith('booster')?0x8a8a9a:0xe8e0d0),m.x,m.y+1.3,m.z);box(1.8,.6,1.8,M(0xffc93c),m.x,m.y+2.9,m.z)}
    textSprite(m.ic+' '+m.jp,{pos:new THREE.Vector3(m.x,m.y+4.2,m.z),size:.55});
    addInter({x:m.x,y:m.y,z:m.z,r:3.6,label:()=>machineLabel(id),act:()=>useMachine(id)})}
  for(const id in BEARS){const B=BEARS[id],g=bearModel(B);g.position.set(B.x,B.y,B.z);scene.add(g);B.g=g;
    textSprite(B.jp,{pos:new THREE.Vector3(B.x,B.y+7.6,B.z),size:.7,col:'#ffe27a'});addInter({x:B.x,y:B.y,z:B.z,r:4.2,label:()=>B.jp+'と話す',act:()=>talkBear(id)})}
  // ゲート（ハチが足りないと通れない）
  for(const gt of GATES){const w=gt.x1-gt.x0,d=gt.z1-gt.z0,cx=(gt.x0+gt.x1)/2,cz=(gt.z0+gt.z1)/2,big=Math.max(w,d);
    const mat=new THREE.MeshLambertMaterial({color:0xffc93c,transparent:true,opacity:.45});const wall=box(Math.max(w,.4),4,Math.max(d,.4),mat,cx,gt.y+2,cz,scene,false);
    const fr=w>d?[[gt.x0,cz],[gt.x1,cz]]:[[cx,gt.z0],[cx,gt.z1]];for(const [x,z] of fr)box(.8,5.5,.8,MAT.wood,x,gt.y+2.75,z);
    const top=box(w>d?w+1:.9,1.2,w>d?.9:d+1,MAT.wood,cx,gt.y+5.6,cz);
    textSprite(gt.n+'',{pos:new THREE.Vector3(cx,gt.y+7.4,cz),size:1.4,bg:'rgba(255,190,40,.9)',col:'#3a2400'});
    gt.sol=addSolid(cx,cz,Math.max(w,.4),Math.max(d,.4),gt.y,4);gt.wall=wall;GATEWALL.push(gt)}
  // スタート地点の目じるし
  textSprite('🐝 Bee Swarm Simulator 再現版',{pos:new THREE.Vector3(-24,20,8),size:1.3,col:'#ffe27a'});
  // 雲
  for(let i=0;i<26;i++){const g=new THREE.Group();g.position.set(rr(WORLD.x0,WORLD.x1),rr(70,95),rr(WORLD.z0,WORLD.z1));for(let k=0;k<4;k++)mesh(new THREE.SphereGeometry(rr(5,9),8,6),M(0xffffff,{emissive:0x666666}),rr(-8,8),rr(-1,2),rr(-4,4),g,false);scene.add(g)}}
function gatesUpdate(){const n=beeCount();for(const gt of GATEWALL){const ok=n>=gt.n;gt.sol.off=ok;gt.wall.material.opacity=ok?.12:.5;gt.wall.material.color.setHex(ok?0x9aff9a:0xffc93c)}}
// ================= ボスの部屋（キングビートルのすみか・ホワイトトンネル） =================
const ROOMS={kblair:{x:-320,z:0,w:34,d:34,exit:[-100,-46,0],jp:'キングビートルのすみか'},tunnel:{x:-320,z:-140,w:16,d:120,exit:[-156,-116,16],jp:'ホワイトトンネル'}};
function buildRooms(){for(const id in ROOMS){const R=ROOMS[id],x0=R.x-R.w/2,z0=R.z-R.d/2;SURF.push({x0,x1:x0+R.w,z0,z1:z0+R.d,y:0});
  const fl=mesh(new THREE.PlaneGeometry(R.w,R.d),id==='kblair'?MAT.stone:M(0xf0f0f0),R.x,.02,R.z,scene,false);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;
  for(const [x,z,w,d] of[[R.x,z0-.5,R.w+2,1],[R.x,z0+R.d+.5,R.w+2,1],[x0-.5,R.z,1,R.d],[x0+R.w+.5,R.z,1,R.d]]){box(w,10,d,id==='kblair'?MAT.stone:M(0xffffff),x,5,z,scene,false);addSolid(x,z,w,d,0,10)}
  const ex=mesh(new THREE.CircleGeometry(1.6,20),M(0x5fd36a),R.x,.05,z0+R.d-3,scene,false);ex.rotation.x=-Math.PI/2;
  addInter({x:R.x,y:0,z:z0+R.d-3,r:2.6,label:()=>'外に出る',act:()=>{PL.inRoom=null;teleport(R.exit[0],R.exit[1],R.exit[2]);}})}
  addSolid(-202,(WORLD.z0+WORLD.z1)/2,4,WORLD.z1-WORLD.z0+40,0,200)}
WORLD.x0=-360;   // 部屋のぶんだけ世界を広げる
