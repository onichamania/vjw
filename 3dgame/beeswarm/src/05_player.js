// ===================== プレイヤー（見た目・操作・カメラ・道具） =====================
const PL={x:HIVE_X(MY_HIVE),y:0,z:-1,vy:0,yaw:Math.PI,face:Math.PI,onGround:true,hp:100,maxHp:100,hurtT:-9,swingT:0,swingN:0,glideOn:false,walkT:0,lastCell:'',dead:0,inRoom:null};
// ---- 見た目（ロブロックス風の四角い体） ----
const pg=new THREE.Group();scene.add(pg);
const skinM=M(0xffd36a),shirtM=M(0x3a7ae0),pantsM=M(0x2a3a5a);
const pTorso=box(.9,.9,.45,shirtM,0,1.15,0,pg),pHead=box(.55,.55,.55,skinM,0,1.95,0,pg);
box(.12,.1,.02,MAT.black,-.12,2,-.28,pg);box(.12,.1,.02,MAT.black,.12,2,-.28,pg);box(.28,.06,.02,MAT.black,0,1.84,-.28,pg);
const armL=new THREE.Group(),armR=new THREE.Group();armL.position.set(-.62,1.55,0);armR.position.set(.62,1.55,0);pg.add(armL,armR);
box(.38,.88,.42,skinM,0,-.42,0,armL);box(.38,.88,.42,skinM,0,-.42,0,armR);
const legL=new THREE.Group(),legR=new THREE.Group();legL.position.set(-.23,.72,0);legR.position.set(.23,.72,0);pg.add(legL,legR);
box(.42,.72,.44,pantsM,0,-.36,0,legL);box(.42,.72,.44,pantsM,0,-.36,0,legR);
const toolHold=new THREE.Group();toolHold.position.set(0,-.85,-.15);armR.add(toolHold);
const bagHold=new THREE.Group();bagHold.position.set(0,1.15,.3);pg.add(bagHold);
const hatHold=new THREE.Group();hatHold.position.set(0,2.25,0);pg.add(hatHold);
const glideG=new THREE.Group();glideG.position.set(0,3.2,0);glideG.visible=false;pg.add(glideG);
pg.traverse(o=>{if(o.isMesh)o.castShadow=true});
// 道具の見た目
function toolModel(id){toolHold.clear();const g=toolHold,c=id==='scythe'||id==='darkscythe'?0xd8343a:id==='bubblewand'||id==='tidepopper'?0x3a8ae0:id==='goldenrake'?0xffc93c:id==='porcelaindipper'?0xf4f4ff:id==='petalwand'?0xff9ad0:0x9aa3b5;
  box(.08,1.1,.08,MAT.wood,0,-.2,0,g);
  if(id==='scooper'||id==='superscooper')box(.4,.08,.5,M(c),0,-.8,-.15,g);
  else if(id==='rake'||id==='goldenrake'){box(.7,.08,.12,M(c),0,-.78,0,g);for(let k=-3;k<=3;k++)box(.04,.2,.04,M(c),k*.1,-.9,0,g)}
  else if(id==='clippers'||id==='scissors'){box(.06,.5,.06,M(c),-.06,-.9,0,g).rotation.z=.3;box(.06,.5,.06,M(c),.06,-.9,0,g).rotation.z=-.3}
  else if(id==='magnet'||id==='electromagnet'){box(.4,.12,.12,M(0xd8343a),0,-.8,0,g);box(.1,.3,.12,M(0xd8343a),-.15,-.95,0,g);box(.1,.3,.12,M(0xd8343a),.15,-.95,0,g)}
  else if(id==='scythe'||id==='darkscythe'){box(.7,.1,.06,M(c),.3,-.75,0,g).rotation.z=-.3}
  else mesh(new THREE.SphereGeometry(.22,10,8),M(c),0,-.82,0,g);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true})}
function bagModel(id){bagHold.clear();const cap=(BAGS[id]||BAGS.pouch).st.cap,s=clamp(.35+Math.log10(cap)*.09,.35,.95);
  const col=id.includes('blue')?0x3a7ae0:id.includes('red')?0xd8343a:id.includes('porcelain')?0xf4f4ff:id.includes('coconut')?0x8a5a32:0xffc93c;
  box(.7*s,.8*s,.4*s,M(col),0,0,.05,bagHold);if(id.includes('hive'))box(.5*s,.5*s,.05,MAT.honey,0,0,.28*s,bagHold);bagHold.traverse(o=>{if(o.isMesh)o.castShadow=true})}
function hatModel(id){hatHold.clear();if(!id)return;const c={helmet:0xffc93c,propellerhat:0x3a7ae0,beekeepermask:0xf4f4f4,bubblemask:0x6ab8ff,firemask:0xff6a3a,honeymask:0xffb320,demonmask:0x6a1a1a,diamondmask:0x9ae8ff,gummymask:0x5ad8c0}[id]||0xffffff;
  box(.62,.25,.62,M(c),0,0,0,hatHold);if(id==='propellerhat')box(.9,.04,.12,M(0xff4a4a),0,.25,0,hatHold);if(id==='beekeepermask')box(.7,.5,.05,M(0x222222,{transparent:true,opacity:.5}),0,-.35,-.32,hatHold)}
function glideModel(id){glideG.clear();if(!id)return;const c=id==='glider'?0x3a7ae0:0xff6a5a;const p=mesh(new THREE.SphereGeometry(1.6,14,6,0,TAU,0,Math.PI/2.4),M(c,{side:THREE.DoubleSide}),0,0,0,glideG);p.scale.y=.45}
function refreshLook(){toolModel(ST.equip.tool);bagModel(ST.equip.bag);hatModel(ST.equip.hat);glideModel(ST.equip.glide)}
// ---- 入力 ----
const KEY={};let mouseL=false,camDrag=null,touchMode=false;
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;KEY[e.code]=true;if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Space'){e.preventDefault();if(!e.repeat)jumpPress()}
  if(e.code==='Escape'||e.code==='KeyM')closePanel();if(e.code==='KeyI'&&!e.repeat)togglePanel('inv');if(e.code==='KeyB'&&!e.repeat)togglePanel('bees');if(e.code==='KeyQ'&&!e.repeat)togglePanel('quest')});
addEventListener('keyup',e=>{KEY[e.code]=false});
addEventListener('blur',()=>{for(const k in KEY)KEY[k]=false;mouseL=false;camDrag=null});
const cv=renderer.domElement;
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('mousedown',e=>{if(e.button===0)mouseL=true;if(e.button===2)camDrag={x:e.clientX,y:e.clientY}});
addEventListener('mouseup',e=>{if(e.button===0)mouseL=false;if(e.button===2)camDrag=null});
addEventListener('mousemove',e=>{if(camDrag){CAM.yaw-=(e.clientX-camDrag.x)*.006;CAM.pitch=clamp(CAM.pitch+(e.clientY-camDrag.y)*.005,-.2,1.35);camDrag={x:e.clientX,y:e.clientY}}});
cv.addEventListener('wheel',e=>{CAM.dist=clamp(CAM.dist*(e.deltaY>0?1.1:.9),4,60)},{passive:true});
// スマホ：左＝スティック、右のあいているところ＝カメラ、ボタン＝道具・ジャンプ・E
const STK={id:null,x:0,y:0,dx:0,dy:0},CT={};let pinch=null;
function setTouch(on){touchMode=on;document.body.classList.toggle('touch',on)}
addEventListener('touchstart',()=>{if(!touchMode)setTouch(true)},{passive:true,capture:true});
$('stick').addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0],r=$('stick').getBoundingClientRect();STK.id=t.identifier;STK.x=r.left+r.width/2;STK.y=r.top+r.height/2;stickMove(t)},{passive:false});
function stickMove(t){let dx=t.clientX-STK.x,dy=t.clientY-STK.y;const l=Math.hypot(dx,dy),m=55;if(l>m){dx*=m/l;dy*=m/l}STK.dx=dx/m;STK.dy=dy/m;$('stick').firstChild.style.transform=`translate(${dx}px,${dy}px)`}
cv.addEventListener('touchstart',e=>{for(const t of e.changedTouches)CT[t.identifier]={x:t.clientX,y:t.clientY};if(Object.keys(CT).length===2){const a=Object.values(CT);pinch={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),dist:CAM.dist}}},{passive:true});
addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===STK.id){stickMove(t);continue}const c=CT[t.identifier];if(!c)continue;
    if(pinch&&Object.keys(CT).length>=2){c.x=t.clientX;c.y=t.clientY;const a=Object.values(CT);const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);CAM.dist=clamp(pinch.dist*pinch.d/Math.max(d,1),4,60);continue}
    CAM.yaw-=(t.clientX-c.x)*.008;CAM.pitch=clamp(CAM.pitch+(t.clientY-c.y)*.006,-.2,1.35);c.x=t.clientX;c.y=t.clientY}},{passive:true});
addEventListener('touchend',e=>{for(const t of e.changedTouches){if(t.identifier===STK.id){STK.id=null;STK.dx=STK.dy=0;$('stick').firstChild.style.transform=''}delete CT[t.identifier]}if(Object.keys(CT).length<2)pinch=null},{passive:true});
let toolTouch=false;
$('tTool').addEventListener('touchstart',e=>{e.preventDefault();toolTouch=true},{passive:false});$('tTool').addEventListener('touchend',e=>{e.preventDefault();toolTouch=false},{passive:false});
$('tJump').addEventListener('touchstart',e=>{e.preventDefault();jumpPress();KEY.Space=true},{passive:false});$('tJump').addEventListener('touchend',e=>{e.preventDefault();KEY.Space=false},{passive:false});
$('tUse').addEventListener('touchstart',e=>{e.preventDefault();interact()},{passive:false});
$('prompt').addEventListener('click',()=>interact());
// ---- カメラ ----
const CAM={yaw:Math.PI,pitch:.42,dist:14};
// (x,z)でいちばん高い床・建物の上
function topAt(x,z){let best=0;for(const s of SURF){if(x<s.x0||x>s.x1||z<s.z0||z>s.z1)continue;const t=surfTop(s,x,z);if(t>best)best=t}
  for(const b of SOLID){if(b.off||x<b.x0||x>b.x1||z<b.z0||z>b.z1)continue;if(b.y1>best)best=b.y1}return best}
let camD=14;
function updCam(dt){const tx=PL.x,ty=PL.y+1.8,tz=PL.z;
  // 崖や建物にカメラがうまらないよう、間にあるときは近づける（本家のカメラと同じ）
  const ux=Math.sin(CAM.yaw)*Math.cos(CAM.pitch),uy=Math.sin(CAM.pitch),uz=Math.cos(CAM.yaw)*Math.cos(CAM.pitch);let d=CAM.dist;
  for(let i=1;i<=16;i++){const f=i/16*CAM.dist;if(topAt(tx+ux*f,tz+uz*f)>ty+uy*f-.5){d=Math.max(1.5,f-1);break}}
  camD=d<camD?d:lerp(camD,d,Math.min(1,dt*4));d=camD;
  const cx=tx+ux*d,cy=ty+uy*d,cz=tz+uz*d;
  cam.position.set(cx,Math.max(cy,groundAt(cx,cz,cy+50)+.6),cz);cam.lookAt(tx,ty,tz);
  sun.position.set(PL.x+40,PL.y+80,PL.z+20);sun.target.position.set(PL.x,PL.y,PL.z);sky.position.set(PL.x,0,PL.z)}
// ---- 動き ----
const GRAV=49;
function walkSpeed(){if(buffStack('bearmorph'))return 24/4*(1+P.msPct/100)*P.msMul;return (16+P.ms)/4*(1+P.msPct/100)*P.msMul}
function jumpPress(){if(PL.dead)return;if(PL.onGround){PL.vy=(buffStack('bearmorph')?65:50+P.jump)/4*1.06;PL.onGround=false;PL.glideOn=false}else if(ST.equip.glide&&!PL.glideOn&&PL.vy<4){PL.glideOn=true;note('🪂 '+GEAR[ST.equip.glide].jp+'を開いた')}}
function teleport(x,z,y){PL.x=x;PL.z=z;PL.y=y!=null?y:groundAt(x,z,200);PL.vy=0;for(const b of BEELIST){b.x=x+rr(-2,2);b.y=PL.y+2;b.z=z+rr(-2,2)}}
function updPlayer(dt){if(PL.dead>0){PL.dead-=dt;if(PL.dead<=0){PL.hp=PL.maxHp;PL.inRoom=null;G.field=null;teleport(HIVE_X(MY_HIVE),-1,0);note('ハイブにもどった')}return}
  let mx=(KEY.KeyD||KEY.ArrowRight?1:0)-(KEY.KeyA||KEY.ArrowLeft?1:0),mz=(KEY.KeyS||KEY.ArrowDown?1:0)-(KEY.KeyW||KEY.ArrowUp?1:0);
  if(STK.id!=null){mx=STK.dx;mz=STK.dy}const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml}
  // カメラの向きに合わせる
  const s=Math.sin(CAM.yaw),c=Math.cos(CAM.yaw),wx=mx*c+mz*s,wz=-mx*s+mz*c;
  let sp=walkSpeed();if(PL.glideOn)sp*=ST.equip.glide==='glider'?2.2:1.3;
  const nx=PL.x+wx*sp*dt,nz=PL.z+wz*sp*dt;
  if(!blocked(nx,PL.z,PL.y))PL.x=nx;if(!blocked(PL.x,nz,PL.y))PL.z=nz;
  if(Math.hypot(wx,wz)>.05){PL.face=Math.atan2(-wx,-wz);PL.walkT+=dt*sp*1.6}
  // 重力・着地
  PL.vy-=GRAV*dt;if(PL.glideOn)PL.vy=Math.max(PL.vy,ST.equip.glide==='glider'?-2.2:-3.2);
  PL.y+=PL.vy*dt;const gy=groundAt(PL.x,PL.z,PL.y);if(PL.y<=gy){PL.y=gy;PL.vy=0;PL.onGround=true;PL.glideOn=false}else PL.onGround=PL.y-gy<.05;
  if(PL.y<-30)teleport(HIVE_X(MY_HIVE),-1,0);
  if(KEY.Space&&PL.onGround)jumpPress();
  // 見た目
  pg.position.set(PL.x,PL.y,PL.z);pg.rotation.y=lerpAng(pg.rotation.y,PL.face,Math.min(1,dt*14));
  const w=Math.sin(PL.walkT)*(ml>.05&&PL.onGround?.7:0);legL.rotation.x=w;legR.rotation.x=-w;armL.rotation.x=-w*.8;
  PL.swingT=Math.max(0,PL.swingT-dt);armR.rotation.x=PL.swingT>0?-1.6*Math.sin((1-PL.swingT/swingTime())*Math.PI):w*.8;glideG.visible=PL.glideOn;
  // 体力
  if(G.t-PL.hurtT>4)PL.hp=Math.min(PL.maxHp,PL.hp+PL.maxHp*.03*dt);
  // フィールド
  const fid=PL.inRoom?null:fieldAt(PL.x,PL.z,PL.y);if(fid!==G.field){G.field=fid;onEnterField(fid)}
  // 道具
  if((mouseL||toolTouch)&&!panelOpen()&&!PL.dead){toolTimer-=dt;if(toolTimer<=0){toolTimer=swingTime();useTool()}}else toolTimer=Math.max(0,toolTimer-dt);
  // ブーツ：歩くと花粉
  if(G.field&&P.moveColl>0&&PL.onGround){const D=FL[G.field],k=flowerAt(D,PL.x,PL.z),key=G.field+k;if(k>=0&&key!==PL.lastCell){PL.lastCell=key;collectFlower(D,k,P.moveColl,null,'move')}}}
const lerpAng=(a,b,t)=>{let d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI;return a+d*t};
let toolTimer=0;
const swingTime=()=>{const t=TOOLS[ST.equip.tool];return t.t};
// ---- 道具で集める形 ----
const PAT_CACHE={};
function circOffsets(n){const k='c'+n;if(PAT_CACHE[k])return PAT_CACHE[k];const o=[];for(let dz=-6;dz<=6;dz++)for(let dx=-6;dx<=6;dx++)o.push([dx,dz,dx*dx+dz*dz]);o.sort((a,b)=>a[2]-b[2]);return PAT_CACHE[k]=o.slice(0,n)}
function toolCells(t,super_){const pat=t.pat,out=[],fx=-Math.sin(PL.face),fz=-Math.cos(PL.face),rx=-fz,rz=fx,cx=PL.x,cz=PL.z;
  if(pat[0]==='line'||pat[0]==='single'){const n=pat[1];for(let k=1;k<=n;k++)out.push([cx+fx*k,cz+fz*k])}
  else if(pat[0]==='rect'){const w=pat[1],d=super_?12:pat[2];for(let i=0;i<w;i++)for(let k=1;k<=d;k++){const l=i-(w-1)/2;out.push([cx+fx*k+rx*l,cz+fz*k+rz*l])}}
  else if(pat[0]==='sq'){for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)out.push([cx+dx,cz+dz])}
  else if(pat[0]==='dia'){const r=pat[1]<=13?2:3;for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++)if(Math.abs(dx)+Math.abs(dz)<=r)out.push([cx+dx,cz+dz])}
  else if(pat[0]==='ring'){for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){const d=dx*dx+dz*dz;if(d>=4&&d<=8)out.push([cx+dx,cz+dz])}}
  else if(pat[0]==='circ')for(const [dx,dz] of circOffsets(pat[1]))out.push([cx+dx,cz+dz]);
  else if(pat[0]==='top3'){const D=FL[G.field];const c=[];for(let dz=-4;dz<=4;dz++)for(let dx=-4;dx<=4;dx++){const k=flowerAt(D,cx+dx,cz+dz);if(k>=0)c.push([cx+dx,cz+dz,D.fill[k]*FLOWER_POLLEN[D.s[k]]])}c.sort((a,b)=>b[2]-a[2]);for(const q of c.slice(0,3))out.push(q)}
  return out}
function useTool(){const t=TOOLS[ST.equip.tool];PL.swingT=t.t*.9;SFX.swing();if(!G.field)return;const D=FL[G.field];PL.swingN++;
  const sp=t.sp,n=PL.swingN,superR=sp==='super5'&&n%5===0;
  const cells=toolCells(t,superR);let got=0;const seen=new Set();
  for(const [x,z] of cells){const k=flowerAt(D,x,z);if(k<0||seen.has(k))continue;seen.add(k);got+=collectFlower(D,k,t.amt,t.col,'tool')}
  if(superR)fx.burst(PL.x,PL.y+1,PL.z,[1,.9,.3],20);
  if(sp==='bubble'&&n%10===0)spawnBubble(G.field,PL.x+rr(-5,5),PL.z+rr(-5,5));
  if(sp==='flame'&&n%20===0)spawnFlame(G.field,PL.x-Math.sin(PL.face)*2,PL.z-Math.cos(PL.face)*2);
  if(sp==='pillar'&&n%10===0){fx.pillar(PL.x,PL.y,PL.z);for(const [dx,dz] of circOffsets(81)){const k=flowerAt(D,PL.x+dx,PL.z+dz);if(k>=0)collectFlower(D,k,15,{w:1.5},'tool')}}
  if(sp==='shuriken'&&n%3===0){for(const b of BEELIST)if(b.st==='gather'||b.st==='toFlower')instantConvert(10000+beeConvD(beeD(b))*.06,'tool')}
  if(sp==='wave'&&n%3===0){for(let k=2;k<9;k++){const kk=flowerAt(D,PL.x-Math.sin(PL.face)*k,PL.z-Math.cos(PL.face)*k);if(kk>=0)collectFlower(D,kk,10,t.col,'tool')}}}
// 花から集める（1つの花）。amt: 数 or 'all'、col: 道具の色の倍率、src: tool/bee/ability/move
function collectFlower(D,k,amt,col,src,beeCol,mult){const s=D.s[k],fill=D.fill[k],cap=FLOWER_POLLEN[s];if(fill<.02)return 0;
  let raw=amt==='all'?cap*fill:Math.min(amt*s*(.3+.7*fill),cap*fill+amt*.2);if(!(raw>0))return 0;
  const c=D.c[k],ck=c===0?'w':c===1?'r':'b';let v=raw*(col&&col[ck]||1)*(mult||1)*pollenMult(c)*(1+fieldBoost(D.id));
  if(src==='tool'||src==='move')v*=(1+P.tool/100)*P.toolMul;
  if(beeCol&&beeCol===ck&&ck!=='w')v*=1.5;v*=1+.5*(G.markP||0);
  // グー（グミ）をとるとハチミツ
  if(D.goo[k]>0){addHoney(v*.5);D.goo[k]=0}
  D.fill[k]=Math.max(0,fill-raw/cap*(src==='bee'?.55:.8));flowerMat(D,k);
  // フィールドのトークン（アイテム）
  if(src==='tool'&&Math.random()<.004)fieldDrop(D,D.x[k],D.z[k]);
  addPollen(v,c,D.id,src);return v}
// カバンに花粉を入れる（いっぱいならあふれる）。すぐ変換の分はハチミツに
function addPollen(v,c,fid,src){if(!(v>0))return 0;const cap=capacity();
  let ic=P.ic+(c===0?P.icW:c===1?P.icR:P.icB);if(src==='bomb')ic+=P.icBomb;if(src==='flame')ic+=P.icFlame;ic=Math.min(100,ic);
  const inst=v*ic/100,rest=v-inst;if(inst>0)addHoney(inst*(1+P.hpp/100)*P.hppMul);
  const room=Math.max(0,cap-ST.pollen),add=Math.min(room,rest);ST.pollen+=add;
  const used=inst+add;ST.st.pollen+=used;ST.st.c[c]+=used;ST.st.f[fid]=(ST.st.f[fid]||0)+used;const fk=fid+c;ST.st.fc[fk]=(ST.st.fc[fk]||0)+used;
  if(add<rest&&!G.fullNoted){G.fullNoted=1;note('カバンがいっぱい！ハイブにもどってハチミツを作ろう','#ff9a8a')}if(ST.pollen<cap)G.fullNoted=0;
  return used}
function instantConvert(v,src){const n=Math.min(v,ST.pollen);if(n<=0)return 0;ST.pollen-=n;addHoney(n*(1+P.hpp/100)*P.hppMul);return n}
// プレイヤーのダメージ
function hurtPlayer(d,src){if(PL.dead||G.t<PL.inv)return;d*=Math.max(0,1-P.def/100);PL.hp-=d;PL.hurtT=G.t;fx.dmgNum(PL.x,PL.y+2.6,PL.z,'-'+Math.round(d),'#ff6a5a');SFX.hurt();
  if(PL.hp<=0){PL.hp=0;PL.dead=4;big('やられた…',2);for(const b of BEELIST)b.sleep=Math.max(b.sleep,15);G.converting=false}}
