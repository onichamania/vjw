// ===================== 試合：体の動き・攻撃・TNT・CPU・試合の流れ =====================
const AR_MAX=100,AR_START=50,START_INV=5,PH=1.85,PR=.3,EYE=1.62,GRAV=24,JUMP_V=8.2,JUMP2_V=7.2,BASE_SP=7.2,MATCH_T=120,RESP_T=3,INV_T=1.5,HP_MAX=100,MSCALE=.925;
// mode: null（メニュー） / 'bot'（CPUと練習） / 'online'。phase: 'count' 'play' 'end'
const G={mode:null,phase:'idle',tl:MATCH_T,ct:0,paused:false,endT:0,res:null,shake:0,time:0};
function fighter(o){return Object.assign({x:0,y:0,z:0,vx:0,vz:0,vy:0,yaw:0,pitch:0,onG:true,jumps:0,hp:HP_MAX,ar:0,alive:true,respT:0,inv:0,slowT:0,burn:null,
  atkT:9,atkCD:0,hitT:-1,swingN:0,seq:0,arB:0,lastHead:false,w:'fists',wm:'fists',ws:'acr',cw:0,mag:0,res:0,relT:0,swT:0,scoped:false,shotT:9,sk:0,name:'',walk:0,spd:0,dd:0,sd:0,tk:0,model:null,tag:null,camY:0,stepD:0,deadT:0,killer:null,bot:false},o||{})}
let ME=fighter(),OPP=fighter();
const scoreOf=F=>(F===ME?OPP:ME).dd-F.sd,ptsOf=F=>Math.round((F===ME?OPP:ME).tk);
// ---------------- 体の動き（プレイヤーとCPUで同じ） ----------------
function speedOf(F){return BASE_SP/WEAPONS[F.w].weight*(F.slowT>0?WEAPONS.fists.slow.k:1)}
// 地面では入力どおりにすぐ動き・すぐ止まる（すべらない）。空中も素早く向きを変えられる
function moveBody(F,dt,wx,wz,jump){const sp=speedOf(F);
  if(F.onG&&!(F.kbT>0)){F.vx=wx*sp;F.vz=wz*sp}else{const k=Math.min(1,dt*(F.kbT>0?2:12));F.vx=lerp(F.vx,wx*sp,k);F.vz=lerp(F.vz,wz*sp,k)}if(F.kbT>0)F.kbT-=dt;
  const lad=onLadder(F.x,F.y,F.z);
  if(lad&&(wx*lad[6]+wz*lad[7]<-.3||jump)){F.vy=4;F.jumps=0;F.onG=false}   // はしごに向かって進むと登る
  else if(lad&&!F.onG){F.vy=Math.max(F.vy-GRAV*dt,-2.5)}
  else{if(jump){if(F.onG){F.vy=JUMP_V;F.jumps=1;F.onG=false;if(F===ME)SFX.jump()}else if(F.jumps<2){F.vy=JUMP2_V;F.jumps=2;if(F===ME)SFX.jump();puff(F.x,F.y,F.z)}}F.vy-=GRAV*dt}
  axisMove(F,0,F.vx*dt);axisMove(F,1,F.vz*dt);
  const ny=F.y+F.vy*dt;
  if(F.vy>0){if(hitsBox(F.x-PR+.03,F.y+PH,F.z-PR+.03,F.x+PR-.03,ny+PH,F.z+PR-.03))F.vy=0;else F.y=ny;F.onG=false}
  else{const g=groundAt(F.x,F.z,F.y,PR-.03);
    if(ny<=g||(F.onG&&g>=F.y-.45)){if(!F.onG&&F.vy<-7&&F===ME)SFX.land();F.y=g;F.vy=0;F.onG=true;F.jumps=0}
    else{if(F.onG&&F.jumps===0)F.jumps=1;F.y=ny;F.onG=false}}
  if(F.y<-5){F.y=groundAt(F.x,F.z,30,0);F.vy=0}
  F.spd=Math.hypot(F.vx,F.vz)}
// 横の動き。0.55までの段差は自動で上がる
function axisMove(F,ax,d){if(!d)return;const n=Math.ceil(Math.abs(d)/.25),sd=d/n;
  for(let i=0;i<n;i++){const nx=ax===0?F.x+sd:F.x,nz=ax===1?F.z+sd:F.z;
    let ok=!hitsBox(nx-PR,F.y+.56,nz-PR,nx+PR,F.y+PH,nz+PR);
    if(ok){const g=groundAt(nx,nz,F.y,PR-.03);if(g>F.y+.01){if(hitsBox(nx-PR,g+.05,nz-PR,nx+PR,g+PH,nz+PR))ok=false;else if(F.onG)F.y=g}}
    if(!ok){if(ax===0)F.vx=0;else F.vz=0;return}F.x=nx;F.z=nz}}
// ---------------- 攻撃 ----------------
function aimDir(yaw,pitch){const c=Math.cos(pitch);return[-Math.sin(yaw)*c,Math.sin(pitch),-Math.cos(yaw)*c]}
function raySphere(ox,oy,oz,d,cx,cy,cz,r){const lx=cx-ox,ly=cy-oy,lz=cz-oz,tc=lx*d[0]+ly*d[1]+lz*d[2];if(tc<0)return null;const d2=lx*lx+ly*ly+lz*lz-tc*tc;if(d2>r*r)return null;return tc-Math.sqrt(r*r-d2)}
function rayBox(ox,oy,oz,d,b){let t0=0,t1=1e9;const o=[ox,oy,oz];for(let a=0;a<3;a++){if(Math.abs(d[a])<1e-9){if(o[a]<b[a]||o[a]>b[a+3])return null}else{let p=(b[a]-o[a])/d[a],q=(b[a+3]-o[a])/d[a];if(p>q)[p,q]=[q,p];t0=Math.max(t0,p);t1=Math.min(t1,q);if(t0>t1)return null}}return t0}
// A が B を殴れたか：{head, d}。頭は球、体は少し大きめの箱、近いときは向きだけでも当たる
function meleeHit(A,B,range,yaw,pitch){if(!B.alive)return null;const ex=A.x,ey=A.y+EYE,ez=A.z,d=aimDir(yaw==null?A.yaw:yaw,pitch==null?A.pitch:pitch);
  const hx=B.x,hy=B.y+1.62,hz=B.z;const th=raySphere(ex,ey,ez,d,hx,hy,hz,.27);
  if(th!=null&&th<=range+.1&&segFree(ex,ey,ez,hx,hy,hz))return{head:true,d:th};
  const g=.2,tb=rayBox(ex,ey,ez,d,[B.x-PR-g,B.y,B.z-PR-g,B.x+PR+g,B.y+1.4,B.z+PR+g]);
  if(tb!=null&&tb<=range){const px=ex+d[0]*tb,py=ey+d[1]*tb,pz=ez+d[2]*tb;if(segFree(ex,ey,ez,px,py,pz))return{head:false,d:tb}}
  const cy=clamp(ey,B.y+.3,B.y+1.3),vx=B.x-ex,vy=cy-ey,vz=B.z-ez,dist=Math.hypot(vx,vy,vz);if(dist-PR>range)return null;
  const cos=(vx*d[0]+vy*d[1]+vz*d[2])/Math.max(dist,1e-3);if(cos<(dist<1?.4:.9))return null;
  return segFree(ex,ey,ez,B.x,cy,B.z)?{head:false,d:dist}:null}
function startSwing(F){if(!F.alive||F.atkCD>0||F.swT>0||G.phase!=='play'||isSniper(F.w))return false;const W=WEAPONS[F.w];F.atkCD=W.rate;F.atkT=0;F.hitT=.1;F.swingN++;F.seq++;
  if(F===ME){VIEW.swingN=F.swingN;SFX.swing(F.w)}else if(Math.hypot(F.x-ME.x,F.z-ME.z)<14)SFX.swing(F.w);return true}
function resolveSwing(F){const W=WEAPONS[F.w],V=F===ME?OPP:ME;let yaw=F.yaw,pitch=F.pitch;if(F.bot){yaw+=rr(-.1,.1);pitch+=rr(-.08,.08)}
  const h=(V.alive&&(G.mode!=='online'||OPP.here))?meleeHit(F,V,W.range,yaw,pitch):null;
  if(h){const dmg=W.dmg*(h.head?W.head:1);
    if(F===ME){crossHit(h.head);SFX.hit(F.w,h.head)}
    if(G.mode==='online'&&F===ME){NET.pushHit(dmg,h.head,F.w);hitFx(V,F.w,h.head)}else applyHit(V,dmg,h.head,F.w,F);return}
  // TNT をたたいた
  const ex=F.x,ey=F.y+EYE,ez=F.z,d=aimDir(yaw,pitch);
  for(const t of TNTS){if(!t.alive||t.fuse>0)continue;const tb=rayBox(ex,ey,ez,d,[t.s[0]-.15,t.s[1]-.15,t.s[2]-.15,t.s[3]+.15,t.s[4]+.15,t.s[5]+.15]);
    if(tb!=null&&tb<=W.range+.2){t.s.off=true;const ok=segFree(ex,ey,ez,t.x,t.y+.45,t.z);t.s.off=false;if(ok){tntLight(t,F);if(F===ME&&G.mode==='online')NET.pushEx(t.id);SFX.hit('knife');return}}}}
// ---------------- スナイパー：撃つ・リロード・持ちかえ・スコープ ----------------
const ZOOM_FOV=z=>2*Math.atan(Math.tan(35*Math.PI/180)/(z*.45))*180/Math.PI;
function fillAmmo(F){const W=WEAPONS[F.ws];F.mag=W.cap;F.res=W.res}
function switchWeapon(F,slot){if(slot===F.cw||!F.alive)return;F.cw=slot;F.w=slot?F.ws:F.wm;F.swT=.4;F.relT=0;F.scoped=false;F.hitT=-1;
  if(F===ME){setViewWeapon(F.w);VIEW.drawK=1;buildWBar();SFX.draw()}}
function setScope(F,on){if(on&&(!isSniper(F.w)||F.relT>0||F.swT>0||!F.alive))return;if(F.scoped===on)return;F.scoped=on;if(F===ME)SFX.zoom(on)}
function startReload(F){const W=WEAPONS[F.ws];if(!isSniper(F.w)||F.relT>0||F.mag>=W.cap||F.res<=0||!F.alive)return;F.relT=W.reload;F.relMax=W.reload;F.scoped=false;if(F===ME)SFX.reload()}
// 撃つ。err: CPUのねらいのずれ（ラジアン）
function fireSniper(F,err){const W=WEAPONS[F.w];if(!F.alive||G.phase!=='play'||F.atkCD>0||F.relT>0||F.swT>0)return false;
  if(F.mag<=0){if(F===ME&&F.atkCD<=0){SFX.empty();F.atkCD=.3}startReload(F);return false}
  F.mag--;F.atkCD=W.rate;F.shotT=0;F.atkT=0;F.seq++;let yaw=F.yaw,pitch=F.pitch;
  const sp=F.scoped?0:W.hip;yaw+=rr(-sp,sp);pitch+=rr(-sp,sp)*.6;if(err){yaw+=gauss()*err;pitch+=gauss()*err*.7}
  const d=aimDir(yaw,pitch),segs=[];traceShot(F,F.x,F.y+EYE,F.z,d,W,W.range,W.ricochet?1:0,segs,{});
  const mz=muzzleOf(F);if(segs.length){segs[0][0]=mz.x;segs[0][1]=mz.y;segs[0][2]=mz.z}
  drawShot(F.w,segs,F===ME&&F.scoped);if(F===ME){SFX.shot(F.w);G.shake=Math.max(G.shake,.08);if(G.mode==='online')NET.pushShot(F.w,segs)}
  else SFX.shot(F.w,Math.hypot(F.x-ME.x,F.z-ME.z));
  if(F.mag<=0)setTimeout(()=>{if(F.mag<=0&&F.alive&&isSniper(F.w))startReload(F)},450);return true}
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v)}
// 銃口の位置（見た目の弾道の始まり）
function muzzleOf(F){const f=aimDir(F.yaw,F.pitch),r=[Math.cos(F.yaw),0,-Math.sin(F.yaw)];let a=.2,b=-.18,c=.9;if(F===ME&&F.scoped){a=0;b=-.25;c=.5}else if(F!==ME){a=.15;b=-.25;c=.75}
  return new THREE.Vector3(F.x+r[0]*a+f[0]*c,F.y+EYE+b+f[1]*c,F.z+r[2]*a+f[2]*c)}
// 光線と世界（いちばん近い箱か地面）：{t, n:面の向き, s:箱}
function rayWorld(ox,oy,oz,d,max){let best=max,n=null,hs=null;const ex=ox+d[0]*max,ez=oz+d[2]*max,O=[ox,oy,oz];
  nearSol(Math.min(ox,ex),Math.min(oz,ez),Math.max(ox,ex),Math.max(oz,ez),s=>{let t0=0,t1=best,ax=-1,sg=0;
    for(let a=0;a<3;a++){const o=O[a],dd=d[a],lo=s[a],hi=s[a+3];if(Math.abs(dd)<1e-9){if(o<lo||o>hi)return}else{let p=(lo-o)/dd,q=(hi-o)/dd,g=-1;if(p>q){const tt=p;p=q;q=tt;g=1}if(p>t0){t0=p;ax=a;sg=g}if(q<t1)t1=q;if(t0>t1)return}}
    if(t0<best&&ax>=0){best=t0;n=[0,0,0];n[ax]=sg;hs=s}});
  if(d[1]<-1e-6){const tg=-oy/d[1];if(tg<best){best=tg;n=[0,1,0];hs=null}}return{t:best,n,s:hs}}
// 弾の道すじ：相手に当たったか・TNT・はね返り
function traceShot(F,ox,oy,oz,d,W,max,bounce,segs,done){const V=F===ME?OPP:ME;
  const wall=W.wallbreak?{t:max,n:null,s:null}:rayWorld(ox,oy,oz,d,max);let hit=null;
  if(!done.v&&V.alive&&(G.mode!=='online'||F!==ME||OPP.here)){const th=raySphere(ox,oy,oz,d,V.x,V.y+1.62,V.z,.27),tb=rayBox(ox,oy,oz,d,[V.x-.34,V.y,V.z-.34,V.x+.34,V.y+1.42,V.z+.34]);
    let t=null,head=false;if(th!=null&&(tb==null||th<=tb+.2)){t=th;head=true}else if(tb!=null)t=tb;if(t!=null&&t<wall.t)hit={t,head}}
  if(hit){done.v=1;const thru=W.wallbreak&&rayWorld(ox,oy,oz,d,hit.t).t<hit.t-.05;deliverShot(F,V,W.dmg*(hit.head?W.head:1)*(thru?.5:1),hit.head,F.w)}
  const end=hit&&!W.pierce?hit.t:wall.t;segs.push([ox,oy,oz,ox+d[0]*end,oy+d[1]*end,oz+d[2]*end]);
  if(hit&&!W.pierce)return;
  const px=ox+d[0]*wall.t,py=oy+d[1]*wall.t,pz=oz+d[2]*wall.t;
  if(wall.s){const t=TNTS.find(q=>q.s===wall.s);if(t&&t.alive){tntLight(t,F);t.fuse=Math.min(t.fuse,.12);if(F===ME&&G.mode==='online')NET.pushEx(t.id)}}
  if(wall.n&&wall.t<max){fx(px+wall.n[0]*.05,py+wall.n[1]*.05,pz+wall.n[2]*.05,W.beam||'#d8c8a0',W.beam?6:5,1.6,.35,.07,6);
    if(bounce>0){const k=2*(d[0]*wall.n[0]+d[1]*wall.n[1]+d[2]*wall.n[2]),nd=[d[0]-k*wall.n[0],d[1]-k*wall.n[1],d[2]-k*wall.n[2]];traceShot(F,px+wall.n[0]*.02,py+wall.n[1]*.02,pz+wall.n[2]*.02,nd,W,max-wall.t,bounce-1,segs,done)}}}
function deliverShot(F,V,dmg,head,w){if(F===ME){crossHit(head);SFX.hitmark(head);if(head)headshotMsg();if(G.mode==='online'){NET.pushHit(dmg,head,w);hitFx(V,w,head)}else applyHit(V,dmg,head,w,F)}else applyHit(V,dmg,head,w,F)}
// 弾の光・線
const SHOTS=[],SGEO=new THREE.BoxGeometry(1,1,1);
function drawShot(w,segs,scoped){const W=WEAPONS[w];for(const g of segs){const a=new THREE.Vector3(g[0],g[1],g[2]),b=new THREE.Vector3(g[3],g[4],g[5]),len=a.distanceTo(b);if(len<.05)continue;
    const layers=W.beam?[[w==='acr'?.09:.07,W.beam,.95],[w==='acr'?.26:.2,W.beam,.32]]:[[.025,'#fff2a0',.9]];
    for(const [th,c,o] of layers){const m=new THREE.Mesh(SGEO,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,blending:THREE.AdditiveBlending}));
      m.position.copy(a).lerp(b,.5);m.lookAt(b);m.scale.set(th,th,len);scene.add(m);SHOTS.push({m,t:0,life:W.beam?.38:.13,o})}
    if(w==='comet')for(let i=0;i<10;i++){const p=a.clone().lerp(b,Math.random());fx(p.x,p.y,p.z,pick(['#f0a0ff','#c060ff','#ffffff']),1,.6,.5,.06,0)}}
  if(segs.length&&!scoped){const s=segs[0];fx(s[0],s[1],s[2],W.beam||'#ffd040',4,1.2,.12,.08,0)}}
function shotsUpdate(dt){for(let i=SHOTS.length-1;i>=0;i--){const s=SHOTS[i];s.t+=dt;s.m.material.opacity=s.o*Math.max(0,1-s.t/s.life);if(s.t>=s.life){scene.remove(s.m);s.m.material.dispose();SHOTS.splice(i,1)}}}
// ダメージ（アーマーが先にへる）。たおしたら true
function applyDamage(V,dmg,by){if(!V.alive||V.inv>0||dmg<=0)return false;let d=dmg;if(V.arB>0){const a=Math.min(V.arB,d);V.arB-=a;d-=a}if(V.ar>0){const a=Math.min(V.ar,d);V.ar-=a;d-=a}
  const real=Math.min(V.hp,d)+(dmg-d);V.hp-=d;if(by&&by!==V)V.tk+=real;
  if(V===ME){$('dmg').style.opacity=1;setTimeout(()=>$('dmg').style.opacity=0,120);G.shake=Math.max(G.shake,.18);SFX.hurt()}
  if(V.hp<=.001){V.hp=0;killFighter(V,by);return true}return false}
function applyHit(V,dmg,head,w,by){if(!V.alive||V.inv>0)return;const W=WEAPONS[w];hitFx(V,w,head);V.lastHead=head;
  if(!applyDamage(V,dmg,by)){if(W.slow)V.slowT=W.slow.t;if(W.burn)V.burn={n:W.burn.n,t:W.burn.iv,by,dmg:W.burn.dmg}}}
function killFighter(V,by){V.alive=false;V.scoped=false;V.relT=0;V.respT=RESP_T;V.deadT=0;V.burn=null;V.slowT=0;V.hitT=-1;V.killer=by&&by!==V?by:null;
  if(V.killer)V.dd++;else V.sd++;if(V.killer===ME&&V!==ME)killPop(V.lastHead);
  addFeed(V.killer||V,V,V.killer?V.killer.w:'tnt',false);
  if(V===ME){SFX.die();VIEW.g.visible=false}else{SFX.kill();fx(V.x,V.y+1,V.z,'#c81e1e',22,5,.9,.12)}
  if(V.model)V.model.visible=false}
function respawn(F){const sp=pickSpawn(F===ME?OPP:ME,F.bot);F.x=sp[0];F.z=sp[2];F.y=groundAt(sp[0],sp[2],sp[1]+.2,PR-.03);F.yaw=sp[3];F.pitch=0;F.vx=F.vz=F.vy=0;
  fillAmmo(F);F.relT=0;F.scoped=false;F.swT=0;F.hp=HP_MAX;F.ar=Math.min(AR_MAX,AR_START+(WEAPONS[F.wm].armor||0));F.arB=0;F.alive=true;F.inv=INV_T;F.slowT=0;F.burn=null;F.atkCD=0;F.atkT=9;F.hitT=-1;F.onG=true;F.jumps=0;F.camY=F.y;
  if(F===ME)VIEW.g.visible=true;if(F.model)F.model.visible=true}
// 相手からいちばん遠い出現地点（上位3つからランダム）
function pickSpawn(other,needNav){const c=(needNav?SPAWNS.filter(s=>nearestNode(s[0],s[1]+.1,s[2])>=0):SPAWNS).map(s=>({s,d:other&&other.alive!==undefined?Math.hypot(s[0]-other.x,s[2]-other.z)+(Math.abs(s[1]-other.y)>2?6:0):rr(0,9)}));c.sort((a,b)=>b.d-a.d);return c[Math.floor(Math.random()*Math.min(3,c.length))].s}
// ---------------- 状態（遅い・燃える・無敵） ----------------
function statusUpdate(F,dt){if(F.swT>0)F.swT-=dt;F.shotT+=dt;
  if(F.relT>0){F.relT-=dt;if(F.relT<=0){F.relT=0;const W=WEAPONS[F.ws],n=Math.min(W.cap-F.mag,F.res);F.mag+=n;F.res-=n;if(F===ME)SFX.reloadEnd()}}
  if(F.inv>0)F.inv-=dt;if(F.slowT>0)F.slowT-=dt;if(F.atkCD>0)F.atkCD-=dt;F.atkT+=dt;
  if(F.hitT>=0){F.hitT-=dt;if(F.hitT<0)resolveSwing(F)}
  if(F.burn&&F.alive){F.burn.t-=dt;if(Math.random()<dt*14)fx(F.x+rr(-.3,.3),F.y+rr(.3,1.6),F.z+rr(-.3,.3),pick(['#ff7a1a','#ffd23f','#ff3a1a']),1,1,.5,.1,-2);
    if(F.burn.t<=0){F.burn.t=1;F.burn.n--;if(F===ME)SFX.burn();const by=F.burn.by,dm=F.burn.dmg;if(F.burn.n<=0)F.burn=null;applyDamage(F,dm,by)}}}
// ---------------- TNT ----------------
function tntLight(t,by){if(!t.alive||t.fuse>0)return;t.fuse=.6;t.by=by;SFX.beep(true)}
function tntUpdate(dt){for(const t of TNTS){if(t.alive&&t.fuse>0){t.fuse-=dt;t.m.scale.setScalar(1.04+Math.sin(t.fuse*45)*.06);t.m.material=(Math.floor(t.fuse*12)%2)?TNTMAT:whiteMat();if(t.fuse<=0)explode(t)}
  else if(!t.alive){t.back-=dt;if(t.back<=0){const near=[ME,OPP].some(F=>F.alive&&Math.abs(F.x-t.x)<1&&Math.abs(F.z-t.z)<1&&F.y<t.y+1&&F.y+PH>t.y);if(!near){t.alive=true;t.m.visible=true;t.s.off=false;t.m.scale.setScalar(1);t.m.material=TNTMAT}}}}}
let WMAT=null;const whiteMat=()=>WMAT||(WMAT=new THREE.MeshBasicMaterial({color:0xffffff}));
function explode(t){t.alive=false;t.fuse=0;t.m.visible=false;t.s.off=true;t.back=25;t.m.material=TNTMAT;SFX.boom();boomFx(t.x,t.y+.45,t.z);
  const cx=t.x,cy=t.y+.45,cz=t.z;G.shake=Math.max(G.shake,Math.max(0,.6-Math.hypot(ME.x-cx,ME.z-cz)*.03));
  const hurt=F=>{if(!F.alive)return;const dx=F.x-cx,dy=F.y+.9-cy,dz=F.z-cz,d=Math.hypot(dx,dy,dz);if(d>5)return;const dmg=d<2?60:60*(5-d)/3;
    const l=Math.max(.3,Math.hypot(dx,dz));F.vx+=dx/l*7;F.vz+=dz/l*7;F.vy=Math.max(F.vy,6);F.onG=false;F.kbT=.5;applyDamage(F,dmg,t.by)};
  hurt(ME);if(G.mode==='bot')hurt(OPP);
  for(const o of TNTS)if(o!==t&&o.alive&&o.fuse<=0&&Math.hypot(o.x-t.x,o.y-t.y,o.z-t.z)<3.2){o.fuse=.25;o.by=t.by}}
function resetTNT(){for(const t of TNTS){t.alive=true;t.fuse=0;t.back=0;t.m.visible=true;t.s.off=false;t.m.scale.setScalar(1);t.m.material=TNTMAT}}
// ---------------- つぶ（血・火花・爆発） ----------------
const FX=[],FXG=new THREE.BoxGeometry(1,1,1);
function fx(x,y,z,col,n,sp,life,size,grav){for(let i=0;i<n;i++){if(FX.length>260)return;const m=new THREE.Mesh(FXG,new THREE.MeshBasicMaterial({color:col,transparent:true}));m.position.set(x,y,z);const s=size*rr(.6,1.2);m.scale.setScalar(s);scene.add(m);
  FX.push({m,vx:rr(-1,1)*sp,vy:rr(.2,1.2)*sp,vz:rr(-1,1)*sp,life:life*rr(.6,1),max:life,g:grav==null?14:grav,s})}}
function fxUpdate(dt){for(let i=FX.length-1;i>=0;i--){const p=FX[i];p.life-=dt;if(p.life<=0){scene.remove(p.m);p.m.material.dispose();FX.splice(i,1);continue}
  p.vy-=p.g*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;if(p.m.position.y<0){p.m.position.y=0;p.vy*=-.3;p.vx*=.6;p.vz*=.6}
  p.m.material.opacity=Math.min(1,p.life/p.max*2);p.m.rotation.x+=dt*4;p.m.rotation.y+=dt*3}}
function hitFx(V,w,head){const y=V.y+(head?1.62:1.0);fx(V.x,y,V.z,'#c81e1e',head?10:7,3,.5,.09);if(w==='saber')fx(V.x,y,V.z,'#ff5a1a',6,3,.4,.07,0);if(w==='fists')fx(V.x,y,V.z,'#3ad8f0',5,4,.35,.06,0)}
function puff(x,y,z){fx(x,y+.05,z,'#e8d8b0',6,1.5,.4,.12,1)}
const BOOMS=[];function boomFx(x,y,z){fx(x,y,z,'#ff8a1a',26,7,.8,.25,6);fx(x,y,z,'#ffd23f',14,5,.5,.18,2);fx(x,y,z,'#4a4a4a',16,3,1.4,.4,-1.5);
  const m=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xffb030,transparent:true,opacity:.8,depthWrite:false}));m.position.set(x,y,z);scene.add(m);BOOMS.push({m,t:0})}
function boomUpdate(dt){for(let i=BOOMS.length-1;i>=0;i--){const b=BOOMS[i];b.t+=dt;b.m.scale.setScalar(1+b.t*12);b.m.material.opacity=Math.max(0,.8-b.t*2.6);if(b.t>.32){scene.remove(b.m);b.m.geometry.dispose();b.m.material.dispose();BOOMS.splice(i,1)}}}
// ---------------- 相手の見た目 ----------------
function makeOppModel(F,col){if(F.model){scene.remove(F.model)}F.model=charModel(F.sk,F.w);F.model.scale.setScalar(MSCALE);F.tag=nameTag(F.name||'???',col||'#ff7a7a');F.tag.position.y=2.4;F.model.add(F.tag);scene.add(F.model)}
function updModel(F,dt){const m=F.model;if(!m)return;m.visible=F.alive&&!(F.inv>0&&Math.floor(G.time*12)%2);if(!F.alive)return;m.position.set(F.x,F.y,F.z);m.rotation.y=F.yaw;
  F.walk+=dt*Math.min(F.spd,9)*1.25;if(F.spd<.5)F.walk=lerp(F.walk,Math.round(F.walk/Math.PI)*Math.PI,Math.min(1,dt*10));animChar(m,F.walk,F.atkT,F.pitch);
  if(m.userData.P.w!==F.w)setCharWeapon(m.userData.P,F.w)}
// ---------------- CPU（練習相手） ----------------
const BOT={itT:0,ig:-1,distT:0,dist:null,goal:-1,wander:-1,react:.3,strafeT:0,strafeS:1,stuckT:0,lx:0,lz:0,aimHead:false};
const BOT_NAMES=['ならず者ボット','保安官ボット','カウボーイボット','さすらいボット','ガンマンボット'];
function botUpdate(dt){const F=OPP,T=ME;if(!F.alive)return;let wx=0,wz=0,jump=false;
  const dx=T.x-F.x,dz=T.z-F.z,hd=Math.hypot(dx,dz)||1e-3,dy=T.y-F.y;
  const see=T.alive&&hd<60&&segFree(F.x,F.y+EYE,F.z,T.x,T.y+1.2,T.z);
  // 遠くに見えたらスナイパー、近いと接近武器（行ったり来たりしないように幅をもたせる）
  if(F.swT<=0&&F.relT<=0){if(F.cw===0&&see&&hd>11)switchWeapon(F,1);else if(F.cw===1&&(hd<6.5||(!see&&BOT.lostT>2.5)))switchWeapon(F,0)}
  BOT.lostT=see?0:(BOT.lostT||0)+dt;const W=WEAPONS[F.w],snip=isSniper(F.w);
  // 体力が少ない・相手が見えないときはアイテムを取りに行く（近くの相手は無視しない）
  BOT.itT-=dt;if(BOT.itT<=0){BOT.itT=.5;BOT.ig=(hd>6&&(F.hp<45||!see))?botItemGoal(F):-1}const seek=BOT.ig>=0;
  if(seek){if(F.cw===1&&F.swT<=0&&F.relT<=0&&!see)switchWeapon(F,0)}
  else if(snip&&see){   // 狙う：少し横に動きながら止まって撃つ
    BOT.strafeT-=dt;if(BOT.strafeT<=0){BOT.strafeT=rr(.6,1.6);BOT.strafeS=pick([-1,1,0,0,0])}wx=-dz/hd*BOT.strafeS*.45;wz=dx/hd*BOT.strafeS*.45}
  else if(!snip&&see&&hd<14&&Math.abs(dy)<1.2){if(hd>W.range*.65){wx=dx/hd;wz=dz/hd}
    BOT.strafeT-=dt;if(BOT.strafeT<=0){BOT.strafeT=rr(.4,1.1);BOT.strafeS=pick([-1,1,0,0])}
    if(hd<5){wx+=-dz/hd*BOT.strafeS*.7;wz+=dx/hd*BOT.strafeS*.7}}
  if(seek||!(snip&&see)&&!(!snip&&see&&hd<14&&Math.abs(dy)<1.2)){BOT.distT-=dt;if(BOT.distT<=0||!BOT.dist){BOT.distT=.45;let goal=seek?BOT.ig:T.alive?nearestNode(T.x,T.y,T.z):-1;
      if(goal<0){if(BOT.wander<0||Math.random()<.08)BOT.wander=(Math.random()*NAV.nodes.length)|0;goal=BOT.wander}
      if(goal!==BOT.goal||!BOT.dist){BOT.goal=goal;BOT.dist=flowTo(goal)}}
    const cur=nearestNode(F.x,F.y,F.z);
    if(cur>=0&&BOT.dist&&BOT.dist[cur]>0){let n=cur;for(let s=0;s<3;s++){let bn=-1,bd=BOT.dist[n];for(const o of NAV.out[n]){const d=BOT.dist[o];if(d>=0&&d<bd){bd=d;bn=o}}if(bn<0)break;
        if(s>0){const N=NAV.nodes[bn];if(Math.abs(N.y-F.y)>.3||!segFree(F.x,F.y+.7,F.z,N.x,N.y+.7,N.z))break}n=bn}
      const N=NAV.nodes[n],ddx=N.x-F.x,ddz=N.z-F.z,l=Math.hypot(ddx,ddz);if(l>.05){wx=ddx/l;wz=ddz/l}}
    else{   // 道の外にいる：いちばん近い道の点へ向かう
      BOT.farT=(BOT.farT||0)-dt;if(BOT.farT<=0||BOT.far==null){BOT.farT=.6;let b=-1,bd=1e9;for(let i=0;i<NAV.nodes.length;i++){const q=NAV.nodes[i],d=Math.hypot(q.x-F.x,q.z-F.z)+Math.abs(q.y-F.y)*3;if(d<bd){bd=d;b=i}}BOT.far=b}
      if(BOT.far>=0){const N=NAV.nodes[BOT.far],ddx=N.x-F.x,ddz=N.z-F.z,l=Math.hypot(ddx,ddz);if(l>.5){wx=ddx/l;wz=ddz/l}else if(!(BOT.escT>0)){BOT.far=null;BOT.farT=1;BOT.escT=1;BOT.escA=Math.random()*TAU}}else if(T.alive){wx=dx/hd;wz=dz/hd}}}
  let wantYaw=F.yaw,wantPitch=0;if(see&&(snip||hd<14)){wantYaw=Math.atan2(-dx,-dz);wantPitch=Math.atan2(T.y+(BOT.aimHead?1.62:1.0)-(F.y+EYE),hd)}else if(wx||wz)wantYaw=Math.atan2(-wx,-wz);
  F.yaw+=clamp(angDiff(F.yaw,wantYaw),-(snip?4:7)*dt,(snip?4:7)*dt);F.pitch=lerp(F.pitch,wantPitch,Math.min(1,dt*6));
  BOT.stuckT+=dt;if(BOT.stuckT>.45){const stk=Math.hypot(F.x-BOT.lx,F.z-BOT.lz)<.2&&(wx||wz)&&!(snip&&see);if(stk){jump=true;BOT.stuckN=(BOT.stuckN||0)+1}else BOT.stuckN=0;BOT.lx=F.x;BOT.lz=F.z;BOT.stuckT=0;
    if(BOT.stuckN>=4){BOT.stuckN=0;BOT.wander=(Math.random()*NAV.nodes.length)|0;BOT.goal=-2;BOT.dist=null;BOT.ig=-1;BOT.itT=3;BOT.escT=.9;BOT.escA=Math.random()*TAU}}
  if(BOT.escT>0){BOT.escT-=dt;wx=Math.cos(BOT.escA);wz=Math.sin(BOT.escA)}
  if(!snip&&see&&hd<7&&Math.random()<dt*.35)jump=true;
  const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl}
  if(G.phase!=='play'){wx=wz=0;jump=false}
  moveBody(F,dt,wx,wz,jump);
  if(snip){F.scoped=see&&F.relT<=0;
    if(see&&Math.abs(angDiff(F.yaw,wantYaw))<.08){BOT.aimT+=dt;if(BOT.aimT>BOT.aimNeed&&F.atkCD<=0&&F.relT<=0&&F.swT<=0){if(F.mag>0){fireSniper(F,.012+hd*.0007);BOT.aimT=0;BOT.aimNeed=rr(.6,1.3);BOT.aimHead=Math.random()<.3}else startReload(F)}}
    else BOT.aimT=Math.max(0,BOT.aimT-dt*2);
    if(!see&&F.mag<WEAPONS[F.ws].cap&&F.relT<=0)startReload(F)}
  else if(see&&Math.hypot(dx,dy*.6,dz)<W.range+.25&&Math.abs(angDiff(F.yaw,wantYaw))<.35){BOT.react-=dt;if(BOT.react<=0&&F.atkCD<=0&&startSwing(F)){BOT.aimHead=Math.random()<.22;BOT.react=rr(0,.12)}}else BOT.react=rr(.18,.4)}
// ---------------- 試合の流れ ----------------
function setupFighter(F,o){Object.assign(F,fighter(),o)}
function startMatch(mode,o){o=o||{};G.mode=mode;G.phase='count';G.ct=3;G.tl=MATCH_T;G.paused=false;G.res=null;G.endT=0;G.lastCt=4;
  for(const p of FX)scene.remove(p.m);FX.length=0;resetTNT();clearFeed();
  setupFighter(ME,{name:SV.name,w:SV.weapon,wm:SV.weapon,ws:SV.sniper,sk:SV.skin});
  if(OPP.model)scene.remove(OPP.model);
  const om=o.oppW||pick(MELEE);setupFighter(OPP,{name:o.oppName||pick(BOT_NAMES),w:om,wm:om,ws:o.oppWs||pick(SNIPERS),sk:o.oppSk!=null?o.oppSk:(SV.skin+1+Math.floor(Math.random()*5))%6,bot:mode==='bot',here:mode==='bot'});
  makeOppModel(OPP);
  const sA=SPAWNS[o.side===1?1:0],sB=SPAWNS[o.side===1?0:1];
  for(const [F,s] of[[ME,sA],[OPP,sB]]){F.x=s[0];F.z=s[2];F.y=groundAt(s[0],s[2],s[1]+.2,PR-.03);F.yaw=s[3];F.ar=Math.min(AR_MAX,AR_START+(WEAPONS[F.wm].armor||0));F.arB=0;F.camY=F.y;fillAmmo(F)}
  Object.assign(BOT,{distT:0,dist:null,goal:-1,react:.4,aimT:0,aimNeed:1});for(const q of SHOTS)scene.remove(q.m);SHOTS.length=0;itemsReset();
  setViewWeapon(ME.w);VIEW.g.visible=true;buildWBar();
  document.body.classList.add('play');showScr(null);hudReset();if(mode==='bot')botSay(pick(['よろしく！','よろしくお願いします！','勝負だ！']),2200)}
function endMatch(why){if(G.phase==='end')return;G.phase='end';G.endT=0;const a=scoreOf(ME),b=scoreOf(OPP),pa=ptsOf(ME),pb=ptsOf(OPP);
  let r=a>b?'win':a<b?'lose':pa>pb?'win':pa<pb?'lose':'draw';if(why==='left')r='win';if(why==='quit')r='lose';
  G.res={r,a,b,pa,pb,why};const coins=r==='win'?15:r==='draw'?6:3;SV.coins+=coins;if(r==='win'){SV.wins++;SV.gems+=1}else if(r==='lose')SV.loses++;else SV.draws++;SV.kills+=Math.max(0,OPP.dd);saveSV();G.res.coins=coins;
  msg(why==='left'?'相手が退出しました':why==='quit'?'':'TIME UP!');if(why==='quit')G.endT=9}
function quitToMenu(){G.mode=null;G.phase='idle';document.body.classList.remove('play');if(OPP.model){scene.remove(OPP.model);OPP.model=null}VIEW.g.visible=false;msg('');if(document.pointerLockElement)document.exitPointerLock();showMenu()}
// 試合の1コマ
function gameUpdate(dt){G.time+=dt;
  if(G.phase==='count'){if(G.mode!=='online'||NET.host){G.ct-=dt}const c=Math.ceil(G.ct);if(c!==G.lastCt){G.lastCt=c;if(c>0){msg(String(c));SFX.beep(false)}}if(G.ct<=0){G.phase='play';msg('FIGHT!',null,1);SFX.beep(true);ME.inv=START_INV;if(G.mode==='bot')OPP.inv=START_INV}}
  else if(G.phase==='play'){if(G.mode!=='online'||NET.host)G.tl-=dt;else G.tl=Math.max(0,G.tl-dt);if(G.tl<=0&&(G.mode!=='online'||NET.host)){G.tl=0;endMatch()}}
  else if(G.phase==='end'){G.endT+=dt;if(G.endT>2.2&&!$('sResult').classList.contains('on'))showResult()}
  // 自分
  const canAct=G.phase==='play'||G.phase==='count';
  if(ME.alive){const inp=readInput();let wx=0,wz=0;if(G.phase==='play'){const f=inp.f,s=inp.s,sy=Math.sin(ME.yaw),cy=Math.cos(ME.yaw);wx=-sy*f+cy*s;wz=-cy*f-sy*s;const l=Math.hypot(wx,wz);if(l>1){wx/=l;wz/=l}}
    if(inp.slot!=null)switchWeapon(ME,inp.slot);if(inp.scope)setScope(ME,!ME.scoped);if(inp.reload)startReload(ME);
    moveBody(ME,dt,wx,wz,G.phase==='play'&&inp.jump);if(inp.atk&&G.phase==='play'){if(isSniper(ME.w))fireSniper(ME);else startSwing(ME)}
    if(ME.onG&&ME.spd>1){ME.stepD+=ME.spd*dt;if(ME.stepD>2.3){ME.stepD=0;SFX.step()}}}
  else if(G.phase!=='end'){ME.deadT+=dt;ME.respT-=dt;const k=ME.killer&&ME.killer.alive?ME.killer.name:'';msg('やられた！',(k?k+' にたおされた　':'')+Math.max(1,Math.ceil(ME.respT))+'秒後に復活');if(ME.respT<=0){respawn(ME);msg('')}}
  statusUpdate(ME,dt);
  // 相手
  if(G.mode==='bot'){if(OPP.alive){if(!BOT.frozen)botUpdate(dt)}else if(G.phase!=='end'){OPP.respT-=dt;if(OPP.respT<=0)respawn(OPP)}statusUpdate(OPP,dt)}
  else if(G.mode==='online')NET.oppUpdate(dt);
  updModel(OPP,dt);tntUpdate(dt);fxUpdate(dt);boomUpdate(dt);shotsUpdate(dt);itemsUpdate(dt);
  VIEW.shotT=ME.shotT;VIEW.relK=ME.relT>0?1-ME.relT/ME.relMax:0;VIEW.drawK=Math.max(0,ME.swT/.4);
  updView(dt,ME.onG&&ME.spd>1,ME.atkT);updCam(dt);updHUD(dt)}
function updCam(dt){const fov=ME.alive&&ME.scoped?ZOOM_FOV(WEAPONS[ME.w].zoom):70;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
  if(ME.alive){if(ME.y>ME.camY)ME.camY=lerp(ME.camY,ME.y,1-Math.exp(-dt*16));else ME.camY=ME.y;cam.position.set(ME.x,ME.camY+EYE,ME.z);cam.rotation.set(ME.pitch,ME.yaw,0,'YXZ')}
  else{const up=Math.min(2.5,ME.deadT*2);cam.position.set(ME.x,ME.y+EYE+up,ME.z);const K=ME.killer;if(K&&K.alive){const q=cam.quaternion.clone();cam.lookAt(K.x,K.y+1.2,K.z);const q2=cam.quaternion.clone();cam.quaternion.copy(q).slerp(q2,Math.min(1,dt*4))}else cam.rotation.set(-.6,ME.yaw,Math.min(.4,ME.deadT*.3),'YXZ')}
  if(G.shake>0){G.shake=Math.max(0,G.shake-dt);const s=G.shake*.25;cam.position.x+=rr(-s,s);cam.position.y+=rr(-s,s);cam.position.z+=rr(-s,s)}}
// メニューの背景：町の上をゆっくり回る
let menuA=0;function menuCam(dt){if(cam.fov!==70){cam.fov=70;cam.updateProjectionMatrix()}menuA+=dt*.06;cam.position.set(Math.sin(menuA)*26,13+Math.sin(menuA*.7)*2,Math.cos(menuA)*36);cam.lookAt(0,2,0);fxUpdate(dt);boomUpdate(dt)}
// タンブルウィード（通りをころがる）
function tumbleUpdate(dt){for(const T of TUMBLE){T.t+=dt;const k=(T.t%24)/24;const x=lerp(MAP.x0-6,MAP.x1+6,k)*(T.g.id%2?1:-1),z=(T.g.id%2?-14:16)+Math.sin(T.t*.7)*3;T.g.position.set(x,.45+Math.abs(Math.sin(T.t*3.2))*.5,z);T.g.rotation.z-=dt*4*(T.g.id%2?1:-1);T.g.rotation.x+=dt}}
