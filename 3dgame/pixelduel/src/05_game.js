// ===================== 試合：体の動き・攻撃・TNT・CPU・試合の流れ =====================
const AR_MAX=100,AR_START=50,START_INV=5,ONE_HIT=90,PH=1.85,PR=.3,EYE=1.62,GRAV=13,JUMP_V=6.6,JUMP2_V=5.6,BASE_SP=7.2,MATCH_T=120,RESP_T=3,INV_T=1.5,HP_MAX=100,MSCALE=.925;
// 重力は弱め（ジャンプの滞空時間が長い）。ロケットジャンプ中はさらに弱く（RJ_GRAV）
// mode: null（メニュー） / 'bot'（CPUと練習） / 'online'。phase: 'count' 'play' 'end'
const G={mode:null,phase:'idle',tl:MATCH_T,ct:0,paused:false,endT:0,res:null,shake:0,time:0};
function fighter(o){return Object.assign({x:0,y:0,z:0,vx:0,vz:0,vy:0,yaw:0,pitch:0,onG:true,jumps:0,hp:HP_MAX,ar:0,alive:true,respT:0,inv:0,slowT:0,burn:null,
  atkT:9,atkCD:0,hitT:-1,swingN:0,seq:0,arB:0,kills:0,dealt:0,kb:{},lastHead:false,w:'gfriend',wp:'gfriend',wb:'oldrev',wx:'darts',burstN:0,preT:0,wm:'fists',ws:'acr',wh:'rjumper',psn:null,bld:null,stash:{},chg:0,rj:false,kbT:0,tpCD:0,cw:0,mag:0,res:0,relT:0,swT:0,scoped:false,shotT:9,sk:0,name:'',walk:0,spd:0,dd:0,sd:0,tk:0,model:null,tag:null,camY:0,stepD:0,deadT:0,killer:null,bot:false},o||{})}
// 自分（ME）と相手たち（FOES）。1対1では FOES=[OPP]、デスマッチでは何人も。OPP はいつも FOES[0]（いなければ空の人）
let ME=fighter(),OPP=fighter(),FOES=[OPP];const NOBODY=fighter({alive:false,here:false,name:'???'});
const ALL=()=>[ME].concat(FOES),live=V=>V===ME||G.mode!=='online'||!!V.here,enemiesOf=F=>ALL().filter(V=>V!==F&&V.alive&&live(V));
// 得点：キル数−自爆。ポイント：あたえたダメージ（同じキル数のときに使う）
const scoreOf=F=>(F.kills|0)-(F.sd|0),ptsOf=F=>Math.round(F.dealt||0);
const DM_BOTS=5,DM_KILLS=15,DM_T=180;   // デスマッチ：CPU5人・15キルか3分で終わり
// ---------------- 体の動き（プレイヤーとCPUで同じ） ----------------
function speedOf(F){return BASE_SP/WEAPONS[F.w].weight*(F.slowT>0?(F.slowK||WEAPONS.fists.slow.k):1)}
// 地面では入力どおりにすぐ動き・すぐ止まる（すべらない）。空中も素早く向きを変えられる
function moveBody(F,dt,wx,wz,jump){const sp=speedOf(F);
  if(F.onG&&!(F.kbT>0)){F.vx=wx*sp;F.vz=wz*sp}else{const k=Math.min(1,dt*(F.kbT>0?2:F.rj?4:12));/* ロケットジャンプ中は勢いが残る */F.vx=lerp(F.vx,wx*sp,k);F.vz=lerp(F.vz,wz*sp,k)}if(F.kbT>0)F.kbT-=dt;
  const lad=onLadder(F.x,F.y,F.z);
  if(lad&&(wx*lad[6]+wz*lad[7]<-.3||jump)){F.vy=4;F.jumps=0;F.onG=false}   // はしごに向かって進むと登る
  else if(lad&&!F.onG){F.vy=Math.max(F.vy-GRAV*dt,-2.5)}
  else{if(jump){if(F.onG){F.vy=JUMP_V;F.jumps=1;F.onG=false;if(F===ME)SFX.jump()}else if(F.jumps<2){F.vy=Math.max(F.vy,JUMP2_V);F.jumps=2;if(F===ME)SFX.jump();puff(F.x,F.y,F.z)}}F.vy-=GRAV*(F.rj?RJ_GRAV:1)*dt}
  axisMove(F,0,F.vx*dt);axisMove(F,1,F.vz*dt);
  const ny=F.y+F.vy*dt;
  if(F.vy>0){if(hitsBox(F.x-PR+.03,F.y+PH,F.z-PR+.03,F.x+PR-.03,ny+PH,F.z+PR-.03))F.vy=0;else F.y=ny;F.onG=false}
  else{const g=groundAt(F.x,F.z,F.y,PR-.03);
    if(ny<=g||(F.onG&&g>=F.y-.45)){if(!F.onG&&F.vy<-7&&F===ME)SFX.land();F.y=g;F.vy=0;F.onG=true;F.jumps=0;if(F.rj){F.rj=false;F.kbT=0}}
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
function startSwing(F){if(!F.alive||F.atkCD>0||F.swT>0||G.phase!=='play'||isGun(F.w))return false;const W=WEAPONS[F.w];F.atkCD=W.rate;F.atkT=0;F.hitT=.1;F.swingN++;F.seq++;
  if(F===ME){VIEW.swingN=F.swingN;SFX.swing(F.w)}else{const dd=Math.hypot(F.x-ME.x,F.z-ME.z);if(dd<16)SFX.swing(F.w,clamp(1-dd/16,.2,.8))}return true}
function resolveSwing(F){const W=WEAPONS[F.w];let yaw=F.yaw,pitch=F.pitch;if(F.bot){yaw+=rr(-.1,.1);pitch+=rr(-.08,.08)}
  let V=null,h=null;for(const E of enemiesOf(F)){const q=meleeHit(F,E,W.range,yaw,pitch);if(q&&(!h||q.d<h.d)){h=q;V=E}}
  if(h){const dmg=W.dmg*(h.head?W.head:1);
    if(F===ME){crossHit(h.head);SFX.hit(F.w,h.head)}
    if(G.mode==='online'&&F===ME){NET.pushHit(V,dmg,h.head,F.w);hitFx(V,F.w,h.head)}else applyHit(V,dmg,h.head,F.w,F);return}
  // TNT をたたいた
  const ex=F.x,ey=F.y+EYE,ez=F.z,d=aimDir(yaw,pitch);
  for(const t of TNTS){if(!t.alive||t.fuse>0)continue;const tb=rayBox(ex,ey,ez,d,[t.s[0]-.15,t.s[1]-.15,t.s[2]-.15,t.s[3]+.15,t.s[4]+.15,t.s[5]+.15]);
    if(tb!=null&&tb<=W.range+.2){t.s.off=true;const ok=segFree(ex,ey,ez,t.x,t.y+.45,t.z);t.s.off=false;if(ok){tntLight(t,F);if(F===ME&&G.mode==='online')NET.pushEx(t.id);SFX.hit('knife');return}}}}
// ---------------- スナイパー：撃つ・リロード・持ちかえ・スコープ ----------------
const ZOOM_FOV=z=>2*Math.atan(Math.tan(35*Math.PI/180)/(z*.45))*180/Math.PI;
// 武器の枠（本家と同じ順）：0 プライマリ・1 バックアップ・2 接近武器・3 特殊・4 スナイパー・5 ヘビー
// 弾数は銃ごと（接近武器のほか全部）。持っている銃の分は F.mag / F.res、ほかは F.stash にしまっておく
const SLOTS=6,slotW=(F,s)=>s===0?F.wp:s===1?F.wb:s===2?F.wm:s===3?F.wx:s===4?F.ws:F.wh;
function fillAmmo(F){F.stash={};for(const w of[F.wp,F.wb,F.wx,F.ws,F.wh]){const W=WEAPONS[w];if(W)F.stash[w]=[W.cap,W.res]}if(isGun(F.w)){F.mag=F.stash[F.w][0];F.res=F.stash[F.w][1]}}
const ammoOf=(F,w)=>F.w===w?[F.mag,F.res]:(F.stash[w]||[0,0]);
// 持ちかえたらすぐ撃てる（どの武器も、持ちかえたら待ち時間なし。前に撃った武器の「次に撃てるまで」も持ちこさない）
function switchWeapon(F,slot){if(slot===F.cw||!F.alive||slot<0||slot>=SLOTS)return;if(isGun(F.w))F.stash[F.w]=[F.mag,F.res];
  F.cw=slot;F.w=slotW(F,slot);if(isGun(F.w)){const a=F.stash[F.w]||[WEAPONS[F.w].cap,WEAPONS[F.w].res];F.mag=a[0];F.res=a[1]}F.atkCD=0;F.swT=0;F.drawT=.22;F.relT=0;F.scoped=false;F.hitT=-1;F.chg=0;F.burstN=0;F.preT=0;
  if(F===ME){SFX.charge(false);stopReloadSnd();setViewWeapon(F.w);VIEW.drawK=1;buildWBar();SFX.draw(F.w);if((isHeavy(F.w)||isBackup(F.w))&&WEAPONS[F.w].rj&&!F.rjTip){F.rjTip=1;tip('足もとを撃つとロケットジャンプ！',2.5)}}}
function setScope(F,on){if(on&&(!isGun(F.w)||!WEAPONS[F.w].zoom||F.relT>0||F.swT>0||!F.alive))return;if(F.scoped===on)return;F.scoped=on;if(F===ME)SFX.zoom(on)}
function startReload(F){const W=WEAPONS[F.w];if(!isGun(F.w)||F.relT>0||F.mag>=W.cap||F.res<=0||!F.alive)return;F.relT=W.reload;F.relMax=W.reload;F.scoped=false;F.chg=0;if(F===ME){SFX.charge(false);SFX.reload(F.w,W.reload,1,true)}else{const dd=Math.hypot(F.x-ME.x,F.z-ME.z);if(dd<20)SFX.reload(F.w,W.reload,clamp(1-dd/20,.2,.6))}}
// 撃つ。err: CPUのねらいのずれ（ラジアン）
function fireSniper(F,err){const W=WEAPONS[F.w];if(!F.alive||G.phase!=='play'||F.atkCD>0||F.relT>0||F.swT>0)return false;
  if(F.mag<=0){if(F===ME&&F.atkCD<=0){SFX.empty();F.atkCD=.3}startReload(F);return false}
  F.mag--;F.atkCD=W.rate;F.shotT=0;F.atkT=0;F.seq++;let yaw=F.yaw,pitch=F.pitch;
  const sp=F.scoped?0:W.hip;yaw+=rr(-sp,sp);pitch+=rr(-sp,sp)*.6;if(err){yaw+=gauss()*err;pitch+=gauss()*err*.7}
  const d=aimDir(yaw,pitch),segs=[];traceShot(F,F.x,F.y+EYE,F.z,d,W,W.range,W.ricochet?1:0,segs,new Set());
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
function traceShot(F,ox,oy,oz,d,W,max,bounce,segs,done){
  const wall=W.wallbreak?{t:max,n:null,s:null}:rayWorld(ox,oy,oz,d,max);const hs=[];
  for(const V of enemiesOf(F)){if(done.has(V))continue;const th=raySphere(ox,oy,oz,d,V.x,V.y+1.62,V.z,.27),tb=rayBox(ox,oy,oz,d,[V.x-.34,V.y,V.z-.34,V.x+.34,V.y+1.42,V.z+.34]);
    let t=null,head=false;if(th!=null&&(tb==null||th<=tb+.2)){t=th;head=true}else if(tb!=null)t=tb;if(t!=null&&t<wall.t)hs.push({V,t,head})}
  hs.sort((a,b)=>a.t-b.t);const use=W.pierce?hs:hs.slice(0,1),hit=use[0]||null;   // 貫通する弾は線上の敵みんなに当たる
  for(const q of use){done.add(q.V);const thru=W.wallbreak&&rayWorld(ox,oy,oz,d,q.t).t<q.t-.05;deliverShot(F,q.V,W.dmg*(q.head?W.head:1)*(thru?.5:1),q.head,F.w)}
  const end=hit&&!W.pierce?hit.t:wall.t;segs.push([ox,oy,oz,ox+d[0]*end,oy+d[1]*end,oz+d[2]*end]);
  if(hit&&!W.pierce)return;
  const px=ox+d[0]*wall.t,py=oy+d[1]*wall.t,pz=oz+d[2]*wall.t;
  if(wall.s){const t=TNTS.find(q=>q.s===wall.s);if(t&&t.alive){tntLight(t,F);t.fuse=Math.min(t.fuse,.12);if(F===ME&&G.mode==='online')NET.pushEx(t.id)}}
  if(wall.n&&wall.t<max){fx(px+wall.n[0]*.05,py+wall.n[1]*.05,pz+wall.n[2]*.05,W.beam||'#d8c8a0',W.beam?6:5,1.6,.35,.07,6);
    if(bounce>0){const k=2*(d[0]*wall.n[0]+d[1]*wall.n[1]+d[2]*wall.n[2]),nd=[d[0]-k*wall.n[0],d[1]-k*wall.n[1],d[2]-k*wall.n[2]];traceShot(F,px+wall.n[0]*.02,py+wall.n[1]*.02,pz+wall.n[2]*.02,nd,W,max-wall.t,bounce-1,segs,done)}}}
function deliverShot(F,V,dmg,head,w){if(F===ME){crossHit(head);SFX.hitmark(head);if(head)headshotMsg();if(G.mode==='online'){NET.pushHit(V,dmg,head,w);hitFx(V,w,head)}else applyHit(V,dmg,head,w,F)}else applyHit(V,dmg,head,w,F)}
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
function applyDamage(V,dmg,by,key,nocap){if(!V.alive||V.inv>0||dmg<=0)return false;let d=dmg;if(V.arB>0){const a=Math.min(V.arB,d);V.arB-=a;d-=a}if(V.ar>0){const a=Math.min(V.ar,d);V.ar-=a;d-=a}
  const ab=dmg-d;let cap=ONE_HIT;if(nocap)cap=Infinity;else if(key!=null){if(V.hk!==key){V.hk=key;V.hkA=0}cap=Math.max(0,ONE_HIT-V.hkA)}d=Math.min(d,cap);if(key!=null&&!nocap)V.hkA+=d;   // 1回の攻撃でへる体力は最大90（4発同時なども合わせて）：シールドがなくても1発ではたおれない。究極点（nocap）だけは上限なし
  const real=Math.min(V.hp,d)+ab;V.hp-=d;if(by&&by!==V)by.dealt=(by.dealt||0)+real;
  if(V===ME){$('dmg').style.opacity=1;setTimeout(()=>$('dmg').style.opacity=0,120);G.shake=Math.max(G.shake,.18);SFX.hurt()}
  if(V.hp<=.001){V.hp=0;killFighter(V,by);return true}return false}
// 毒と出血は、もとの攻撃と同じ番号でへらす（攻撃とあとのダメージを合わせても最大90：シールドがなければ1発でたおれない、のまま）
let HITK=0;
function applyHit(V,dmg,head,w,by,key){if(!V.alive||V.inv>0)return;const W=WEAPONS[w];hitFx(V,w,head);V.lastHead=head;if(key==null&&(W.poison||W.bleed))key='h'+(++HITK);
  if(!applyDamage(V,dmg,by,key,W.nocap)){if(W.slow){V.slowT=W.slow.t;V.slowK=W.slow.k}if(W.burn)V.burn={n:W.burn.n,t:W.burn.iv,by,dmg:W.burn.dmg};
    if(W.poison)V.psn={n:W.poison.n,t:W.poison.iv,by,dmg:W.poison.dmg,key};if(W.bleed)V.bld={n:W.bleed.n,t:W.bleed.iv,by,dmg:W.bleed.dmg,key}}}
function killFighter(V,by){if(V===ME){stopReloadSnd();SFX.charge(false)}clearPortals(V);V.chg=0;V.rj=false;V.alive=false;V.scoped=false;V.relT=0;V.respT=RESP_T;V.deadT=0;V.burstN=0;V.preT=0;V.burn=V.psn=V.bld=null;V.slowT=0;V.hitT=-1;V.killer=by&&by!==V?by:null;
  if(V.killer){V.dd++;V.killer.kills=(V.killer.kills|0)+1;if(V===ME&&V.killer.peer)ME.kb[V.killer.peer]=(ME.kb[V.killer.peer]|0)+1}else V.sd++;if(V.killer===ME&&V!==ME)killPop(V.lastHead);
  addFeed(V.killer||V,V,V.killer?V.killer.w:'tnt',false);
  if(V===ME){SFX.die();VIEW.g.visible=false}else{if(V.killer===ME)SFX.kill();fx(V.x,V.y+1,V.z,'#c81e1e',22,5,.9,.12)}
  if(V.model)V.model.visible=false}
function respawn(F){const sp=pickSpawn(F,F.bot);F.x=sp[0];F.z=sp[2];F.y=groundAt(sp[0],sp[2],sp[1]+.2,PR-.03);F.yaw=sp[3];F.pitch=0;F.vx=F.vz=F.vy=0;
  fillAmmo(F);F.relT=0;F.scoped=false;F.swT=0;F.drawT=0;F.chg=0;F.rj=false;F.kbT=0;F.hp=HP_MAX;F.ar=Math.min(AR_MAX,AR_START+(WEAPONS[F.wm].armor||0));F.arB=0;F.alive=true;F.inv=INV_T;F.slowT=0;F.burn=F.psn=F.bld=null;F.atkCD=0;F.atkT=9;F.hitT=-1;F.onG=true;F.jumps=0;F.camY=F.y;
  if(F===ME)VIEW.g.visible=true;if(F.model)F.model.visible=true}
// 相手からいちばん遠い出現地点（上位3つからランダム）
function pickSpawn(F,needNav){const os=ALL().filter(o=>o!==F&&o.alive&&live(o));const c=(needNav?SPAWNS.filter(s=>nearestNode(s[0],s[1]+.1,s[2])>=0):SPAWNS).map(s=>({s,d:os.length?Math.min(...os.map(o=>Math.hypot(s[0]-o.x,s[2]-o.z)+(Math.abs(s[1]-o.y)>2?6:0))):rr(0,9)}));c.sort((a,b)=>b.d-a.d);return c[Math.floor(Math.random()*Math.min(3,c.length))].s}
// ---------------- 状態（遅い・燃える・無敵） ----------------
function statusUpdate(F,dt){if(F.swT>0)F.swT-=dt;if(F.drawT>0)F.drawT-=dt;F.shotT+=dt;burstUpdate(F,dt);specialUpdate(F,dt);
  if(F.relT>0){F.relT-=dt;if(F.relT<=0){F.relT=0;if(isGun(F.w)){const W=WEAPONS[F.w],n=Math.min(W.cap-F.mag,F.res);F.mag+=n;F.res-=n;if(F===ME)SFX.reloadEnd(F.w);else{const dd=Math.hypot(F.x-ME.x,F.z-ME.z);if(dd<20)SFX.reloadEnd(F.w,clamp(1-dd/20,.2,.6))}}}}
  if(F.inv>0)F.inv-=dt;if(F.slowT>0)F.slowT-=dt;if(F.atkCD>0)F.atkCD-=dt;F.atkT+=dt;
  if(F.hitT>=0){F.hitT-=dt;if(F.hitT<0)resolveSwing(F)}
  if(F.burn&&F.alive){F.burn.t-=dt;if(Math.random()<dt*14)fx(F.x+rr(-.3,.3),F.y+rr(.3,1.6),F.z+rr(-.3,.3),pick(['#ff7a1a','#ffd23f','#ff3a1a']),1,1,.5,.1,-2);
    if(F.burn.t<=0){F.burn.t=1;F.burn.n--;if(F===ME)SFX.burn();const by=F.burn.by,dm=F.burn.dmg;if(F.burn.n<=0)F.burn=null;applyDamage(F,dm,by)}}
  // 毒（緑のあわ）と出血（赤いしずく）：1秒ごとに少しずつへる
  for(const k of['psn','bld']){const D=F[k];if(!D||!F.alive)continue;D.t-=dt;dotFx(F,k,dt);if(D.t<=0){D.t=1;D.n--;if(F===ME)SFX.burn();const by=D.by,dm=D.dmg;if(D.n<=0)F[k]=null;applyDamage(F,dm,by,D.key)}}}
function dotFx(F,k,dt){if(Math.random()<dt*(k==='psn'?12:8))fx(F.x+rr(-.3,.3),F.y+rr(.4,1.6),F.z+rr(-.3,.3),k==='psn'?pick(['#60ff40','#a0ff60','#30c030']):pick(['#c81e1e','#8a1010']),1,k==='psn'?.6:.3,.6,.08,k==='psn'?-1.5:6)}
// ---------------- TNT ----------------
function tntLight(t,by){if(!t.alive||t.fuse>0)return;t.fuse=.6;t.by=by;SFX.beep(true)}
function tntUpdate(dt){for(const t of TNTS){if(t.alive&&t.fuse>0){t.fuse-=dt;t.m.scale.setScalar(1.04+Math.sin(t.fuse*45)*.06);t.m.material=(Math.floor(t.fuse*12)%2)?TNTMAT:whiteMat();if(t.fuse<=0)explode(t)}
  else if(!t.alive){t.back-=dt;if(t.back<=0){const near=ALL().some(F=>F.alive&&Math.abs(F.x-t.x)<1&&Math.abs(F.z-t.z)<1&&F.y<t.y+1&&F.y+PH>t.y);if(!near){t.alive=true;t.m.visible=true;t.s.off=false;t.m.scale.setScalar(1);t.m.material=TNTMAT}}}}}
let WMAT=null;const whiteMat=()=>WMAT||(WMAT=new THREE.MeshBasicMaterial({color:0xffffff}));
function explode(t){t.alive=false;t.fuse=0;t.m.visible=false;t.s.off=true;t.back=25;t.m.material=TNTMAT;SFX.boom();boomFx(t.x,t.y+.45,t.z);
  const cx=t.x,cy=t.y+.45,cz=t.z;G.shake=Math.max(G.shake,Math.max(0,.6-Math.hypot(ME.x-cx,ME.z-cz)*.03));
  const hurt=F=>{if(!F.alive)return;const dx=F.x-cx,dy=F.y+.9-cy,dz=F.z-cz,d=Math.hypot(dx,dy,dz);if(d>5)return;const dmg=d<2?60:60*(5-d)/3;
    const l=Math.max(.3,Math.hypot(dx,dz));F.vx+=dx/l*7;F.vz+=dz/l*7;F.vy=Math.max(F.vy,6);F.onG=false;F.kbT=.5;applyDamage(F,dmg,t.by)};
  for(const F of ALL())if(F===ME||F.bot)hurt(F);
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
const BOOMS=[];function boomFx(x,y,z,s,pal){s=s||1;const P=pal==='green'?['#60ff60','#c0ffc0','#208a40',0x60ff80]:pal==='blue'?['#40a0ff','#a0e0ff','#2a5a9a',0x60c0ff]:pal==='ice'?['#c0f0ff','#ffffff','#6aa8c8',0xa0f0ff]:pal==='terra'?['#40ff80','#ff60e0','#a0ffc0',0xd0ffe0]:pal==='party'?['#ff3030','#ffd040','#40e060',0xffe060]:['#ff8a1a','#ffd23f','#4a4a4a',0xffb030];
  fx(x,y,z,P[0],Math.round(26*s),7*s,.8,.25*s,6);fx(x,y,z,P[1],Math.round(14*s),5*s,.5,.18*s,2);fx(x,y,z,P[2],Math.round(16*s),3*s,1.4,.4*s,-1.5);
  const m=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:P[3],transparent:true,opacity:.8,depthWrite:false}));m.position.set(x,y,z);scene.add(m);BOOMS.push({m,t:0,s})}
function boomUpdate(dt){for(let i=BOOMS.length-1;i>=0;i--){const b=BOOMS[i];b.t+=dt;b.m.scale.setScalar((1+b.t*12)*(b.s||1));b.m.material.opacity=Math.max(0,.8-b.t*2.6);if(b.t>.32){scene.remove(b.m);b.m.geometry.dispose();b.m.material.dispose();BOOMS.splice(i,1)}}}
// ---------------- 相手の見た目 ----------------
function makeOppModel(F,col){if(F.model){scene.remove(F.model)}F.model=charModel(F.sk,F.w);F.model.scale.setScalar(MSCALE);F.tag=nameTag(F.name||'???',col||'#ff7a7a');F.tag.position.y=2.4;F.model.add(F.tag);scene.add(F.model)}
function updModel(F,dt){const m=F.model;if(!m)return;m.visible=F.alive&&!(F.inv>0&&Math.floor(G.time*12)%2);if(!F.alive)return;m.position.set(F.x,F.y,F.z);m.rotation.y=F.yaw;
  F.walk+=dt*Math.min(F.spd,9)*1.25;if(F.spd<.5)F.walk=lerp(F.walk,Math.round(F.walk/Math.PI)*Math.PI,Math.min(1,dt*10));animChar(m,F.walk,F.atkT,F.pitch);
  if(m.userData.P.w!==F.w)setCharWeapon(m.userData.P,F.w)}
// ---------------- CPU（練習相手） ----------------
const BOT={itT:0,ig:-1,distT:0,dist:null,goal:-1,wander:-1,react:.3,strafeT:0,strafeS:1,stuckT:0,lx:0,lz:0,aimHead:false};
// CPUの強さ（設定で選ぶ）。err：ねらいのずれ、wait：ねらう時間と反応の速さ、turn：向きを変える速さ、head：頭をねらう割合（「つよい」がこれまでの強さ）
const BOT_LV=[{n:'かんたん',err:2.4,wait:1.9,turn:.55,head:.3},{n:'ふつう',err:1.5,wait:1.3,turn:.8,head:.7},{n:'つよい',err:1,wait:1,turn:1,head:1},{n:'鬼',err:.5,wait:.6,turn:1.5,head:1.8}];
const botLv=()=>BOT_LV[clamp(SET.botLv|0,0,BOT_LV.length-1)];
const BOT_NAMES=['ならず者ボット','保安官ボット','カウボーイボット','さすらいボット','ガンマンボット'];
const newAI=()=>({itT:0,ig:-1,distT:0,dist:null,goal:-1,wander:-1,react:.4,strafeT:0,strafeS:1,stuckT:0,stuckN:0,lx:0,lz:0,aimHead:false,aimT:0,aimNeed:1,wT:0,lostT:0,tgt:null,tgtT:0,escT:0});
// ねらう相手：近くて見えている敵（デスマッチではCPUどうしも戦う）
function botTarget(F,dt){const A=F.ai;A.tgtT-=dt;if(A.tgtT<=0||!A.tgt||!A.tgt.alive){A.tgtT=.6;let best=null,bs=1e9;
  for(const V of ALL()){if(V===F||!V.alive||!live(V))continue;const d=Math.hypot(V.x-F.x,V.z-F.z)+Math.abs(V.y-F.y)*2,sc=d*(segFree(F.x,F.y+EYE,F.z,V.x,V.y+1.2,V.z)?1:2.2)*(V===A.tgt?.8:1);if(sc<bs){bs=sc;best=V}}A.tgt=best}
  return A.tgt||NOBODY}
function botUpdate(F,dt){const A=F.ai,T=botTarget(F,dt);if(!F.alive)return;let wx=0,wz=0,jump=false;
  const dx=T.x-F.x,dz=T.z-F.z,hd=Math.hypot(dx,dz)||1e-3,dy=T.y-F.y;
  const see=T.alive&&hd<60&&segFree(F.x,F.y+EYE,F.z,T.x,T.y+1.2,T.z);
  // 近い（〜3m）＝接近武器、プライマリの届く所（散弾〜13m・連射〜26m）＝プライマリ（バックアップ好きのCPUはバックアップ）、中くらい（〜24m）＝ヘビー、遠い（30m〜）＝スナイパー
  // 行ったり来たりしないように幅をもたせる。見えないあいだは身軽な接近武器で走る
  A.wT=(A.wT||0)-dt;if(F.swT<=0&&F.relT<=0&&F.chg<=0&&A.wT<=0){let want=F.cw;const pr=WEAPONS[F.wp].pellets?13:26;
    const none=w=>{const a=ammoOf(F,w);return a[0]<=0&&a[1]<=0},gp=A.useSp&&!none(F.wx)?3:A.useBk?1:0;
    if(see)want=hd<3?2:hd<pr?gp:hd<24?(A.useHv||pr<20?5:gp):hd>30?4:F.cw===2?gp:F.cw;else if(A.lostT>2.5)want=2;
    if(want===5&&none(F.wh))want=gp;if(want===3&&none(F.wx))want=0;if(want===0&&none(F.wp))want=1;if(want===1&&none(F.wb))want=hd>30?4:2;if(want!==F.cw){switchWeapon(F,want);A.wT=1.2}}
  A.lostT=see?0:(A.lostT||0)+dt;const W=WEAPONS[F.w],snip=isSniper(F.w),hv=isHeavy(F.w),prim=isPrimary(F.w)||isBackup(F.w)||isSpecial(F.w),gun=snip||hv||prim,K=botLv();
  // 体力が少ない・相手が見えないときはアイテムを取りに行く（近くの相手は無視しない）
  A.itT-=dt;if(A.itT<=0){A.itT=.5;A.ig=(hd>6&&(F.hp<45||!see))?botItemGoal(F):-1}const seek=A.ig>=0;
  if(seek){if(F.cw!==2&&F.swT<=0&&F.relT<=0&&F.chg<=0&&!see)switchWeapon(F,2)}
  else if(gun&&see){   // 狙う：少し横に動きながら止まって撃つ
    A.strafeT-=dt;if(A.strafeT<=0){A.strafeT=rr(.6,1.6);A.strafeS=pick([-1,1,0,0,0])}wx=-dz/hd*A.strafeS*.45;wz=dx/hd*A.strafeS*.45;
    if(prim&&W.pellets&&hd>8&&Math.abs(dy)<1.5){wx+=dx/hd*.8;wz+=dz/hd*.8}}   // 散弾は近づく
  else if(!gun&&see&&hd<14&&Math.abs(dy)<1.2){if(hd>W.range*.65){wx=dx/hd;wz=dz/hd}
    A.strafeT-=dt;if(A.strafeT<=0){A.strafeT=rr(.4,1.1);A.strafeS=pick([-1,1,0,0])}
    if(hd<5){wx+=-dz/hd*A.strafeS*.7;wz+=dx/hd*A.strafeS*.7}}
  if(seek||!(gun&&see)&&!(!gun&&see&&hd<14&&Math.abs(dy)<1.2)){A.distT-=dt;if(A.distT<=0||!A.dist){A.distT=.45;let goal=seek?A.ig:T.alive?nearestNode(T.x,T.y,T.z):-1;
      if(goal<0){if(A.wander<0||Math.random()<.08)A.wander=(Math.random()*NAV.nodes.length)|0;goal=A.wander}
      if(goal!==A.goal||!A.dist){A.goal=goal;A.dist=flowTo(goal)}}
    const cur=nearestNode(F.x,F.y,F.z);
    if(cur>=0&&A.dist&&A.dist[cur]>0){let n=cur;for(let s=0;s<3;s++){let bn=-1,bd=A.dist[n];for(const o of NAV.out[n]){const d=A.dist[o];if(d>=0&&d<bd){bd=d;bn=o}}if(bn<0)break;
        if(s>0){const N=NAV.nodes[bn];if(Math.abs(N.y-F.y)>.3||!segFree(F.x,F.y+.7,F.z,N.x,N.y+.7,N.z))break}n=bn}
      const N=NAV.nodes[n],ddx=N.x-F.x,ddz=N.z-F.z,l=Math.hypot(ddx,ddz);if(l>.05){wx=ddx/l;wz=ddz/l}}
    else{   // 道の外にいる：いちばん近い道の点へ向かう
      A.farT=(A.farT||0)-dt;if(A.farT<=0||A.far==null){A.farT=.6;let b=-1,bd=1e9;for(let i=0;i<NAV.nodes.length;i++){const q=NAV.nodes[i],d=Math.hypot(q.x-F.x,q.z-F.z)+Math.abs(q.y-F.y)*3;if(d<bd){bd=d;b=i}}A.far=b}
      if(A.far>=0){const N=NAV.nodes[A.far],ddx=N.x-F.x,ddz=N.z-F.z,l=Math.hypot(ddx,ddz);if(l>.5){wx=ddx/l;wz=ddz/l}else if(!(A.escT>0)){A.far=null;A.farT=1;A.escT=1;A.escA=Math.random()*TAU}}else if(T.alive){wx=dx/hd;wz=dz/hd}}}
  // ヘビーは足もとを、動いている相手は少し先をねらう
  let wantYaw=F.yaw,wantPitch=0;if(see&&(gun||hd<14)){if(hv){const tof=hd/W.speed,tx=T.x+(T.vx||0)*tof*.8,tz=T.z+(T.vz||0)*tof*.8,ty=T.y+(T.onG?.3:.9),ax=tx-F.x,az=tz-F.z;wantYaw=Math.atan2(-ax,-az);wantPitch=Math.atan2(ty-(F.y+EYE),Math.hypot(ax,az))}
    else{wantYaw=Math.atan2(-dx,-dz);wantPitch=Math.atan2(T.y+(A.aimHead?1.62:1.0)-(F.y+EYE),hd)}}else if(wx||wz)wantYaw=Math.atan2(-wx,-wz);
  F.yaw+=clamp(angDiff(F.yaw,wantYaw),-(gun?4:7)*K.turn*dt,(gun?4:7)*K.turn*dt);F.pitch=lerp(F.pitch,wantPitch,Math.min(1,dt*6));
  A.stuckT+=dt;if(A.stuckT>.45){const stk=Math.hypot(F.x-A.lx,F.z-A.lz)<.2&&(wx||wz)&&!(gun&&see);if(stk){jump=true;A.stuckN=(A.stuckN||0)+1}else A.stuckN=0;A.lx=F.x;A.lz=F.z;A.stuckT=0;
    if(A.stuckN>=4){A.stuckN=0;A.wander=(Math.random()*NAV.nodes.length)|0;A.goal=-2;A.dist=null;A.ig=-1;A.itT=3;A.escT=.9;A.escA=Math.random()*TAU}}
  if(A.escT>0){A.escT-=dt;wx=Math.cos(A.escA);wz=Math.sin(A.escA)}
  if(!gun&&see&&hd<7&&Math.random()<dt*.35)jump=true;
  const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl}
  if(G.phase!=='play'){wx=wz=0;jump=false}
  moveBody(F,dt,wx,wz,jump);
  if(snip){F.scoped=see&&F.relT<=0;
    if(see&&Math.abs(angDiff(F.yaw,wantYaw))<.08){A.aimT+=dt;if(A.aimT>A.aimNeed&&F.atkCD<=0&&F.relT<=0&&F.swT<=0){if(F.mag>0){fireSniper(F,(.012+hd*.0007)*K.err);A.aimT=0;A.aimNeed=rr(.6,1.3)*K.wait;A.aimHead=Math.random()<.3*K.head}else startReload(F)}}
    else A.aimT=Math.max(0,A.aimT-dt*2);
    if(!see&&F.mag<WEAPONS[F.w].cap&&F.relT<=0)startReload(F)}
  else if(prim){F.scoped=!!W.zoom&&see&&hd>14&&F.relT<=0;
    if(see&&Math.abs(angDiff(F.yaw,wantYaw))<(W.pellets?.12:.08)){A.aimT+=dt;if(A.aimT>A.aimNeed&&F.atkCD<=0&&F.relT<=0&&F.swT<=0){
        if(F.mag>0){fireGun2(F,((W.pellets?.012:F.scoped?.012:.02)+hd*.0006)*K.err);if(W.auto){A.burst=(A.burst||0)+W.rate;if(A.burst>(A.burstLen||.6)){A.burst=0;A.burstLen=rr(.35,1);A.aimT=0;A.aimNeed=rr(.15,.45)*K.wait;A.aimHead=Math.random()<.25*K.head}}else{A.aimT=0;A.aimNeed=rr(.05,.3)*K.wait+(W.dmg>60?.3*K.wait:0);A.aimHead=Math.random()<.25*K.head}}
        else startReload(F)}}
    else A.aimT=Math.max(0,A.aimT-dt*2);
    if(!see&&F.mag<W.cap&&F.relT<=0)startReload(F)}
  else if(hv){F.scoped=false;   // ヘビー：近すぎると自分もまきこむので撃たない。ポータルキャノンはためてから
    if(see&&hd>4.5&&Math.abs(angDiff(F.yaw,wantYaw))<.07){A.aimT+=dt;const ok=F.atkCD<=0&&F.relT<=0&&F.swT<=0;
      if(W.charge){if(F.chg>0||(A.aimT>A.aimNeed&&ok)){if(F.mag<6){if(F.chg<=0)startReload(F)}else{if(F.chg<=0)A.chgWant=rr(.45,1);F.chg=Math.min(1,F.chg+dt/W.charge);if(F.chg>=A.chgWant){const c=F.chg;F.chg=0;fireHeavy(F,(.02+hd*.0008)*K.err,c);A.aimT=0;A.aimNeed=rr(.5,1.1)*K.wait}}}}
      else if(A.aimT>A.aimNeed&&ok){if(F.mag>0){fireHeavy(F,(.02+hd*.0008)*K.err);A.aimT=0;A.aimNeed=rr(.35,.9)*K.wait}else startReload(F)}}
    else{A.aimT=Math.max(0,A.aimT-dt*2);if(F.chg>0){const c=F.chg;F.chg=0;if(see&&hd>4.5)fireHeavy(F,.03,c)}}
    if(!see&&F.mag<W.cap&&F.relT<=0&&F.chg<=0)startReload(F)}
  else if(see&&Math.hypot(dx,dy*.6,dz)<W.range+.25&&Math.abs(angDiff(F.yaw,wantYaw))<.35){A.react-=dt;if(A.react<=0&&F.atkCD<=0&&startSwing(F)){A.aimHead=Math.random()<.22*K.head;A.react=rr(0,.12)*K.wait}}else A.react=rr(.18,.4)*K.wait}
// ---------------- 試合の流れ ----------------
function setupFighter(F,o){Object.assign(F,fighter(),o)}
function startMatch(mode,o){o=o||{};G.mode=mode;G.phase='count';G.ct=3;G.tl=MATCH_T;G.paused=false;G.res=null;G.endT=0;G.lastCt=4;
  for(const p of FX)scene.remove(p.m);FX.length=0;resetTNT();clearFeed();
  setupFighter(ME,{name:SV.name,w:primOf(SV.primary),wp:primOf(SV.primary),wb:bkOf(SV.backup),wx:spOf(SV.special),wm:SV.weapon,ws:SV.sniper,wh:HEAVIES.includes(SV.heavy)?SV.heavy:'rjumper',sk:SV.skin});
  G.dm=!!o.dm;if(G.dm)G.tl=DM_T;clearFoes();
  // 相手：CPU戦の1対1はひとり、デスマッチはCPU5人（CPUどうしも戦う）。オンラインは部屋の人が来たら足す（06_net）
  if(mode==='bot'){const names=G.dm?BOT_NAMES.slice().sort(()=>Math.random()-.5):[pick(BOT_NAMES)],n=G.dm?DM_BOTS:1;
    for(let i=0;i<n;i++){const om=!G.dm&&o.oppW||pick(MELEE),op=!G.dm&&o.oppWp||pick(PRIMARIES),ob=!G.dm&&o.oppWb||pick(BACKUPS),ox=!G.dm&&o.oppWx||pick(SPECIALS),F=fighter();setupFighter(F,{name:names[i%names.length],w:op,wp:op,wb:ob,wx:ox,wm:om,ws:!G.dm&&o.oppWs||pick(SNIPERS),wh:!G.dm&&o.oppWh||pick(HEAVIES),sk:i===0&&o.oppSk!=null?o.oppSk:(SV.skin+1+i+Math.floor(Math.random()*5))%6,bot:true,here:true});
      F.ai=i===0?Object.assign(BOT,newAI()):newAI();F.ai.useHv=Math.random()<.5;F.ai.useBk=Math.random()<.35;F.ai.useSp=Math.random()<.3;makeOppModel(F);FOES.push(F)}}
  OPP=FOES[0]||NOBODY;
  // 出現地点：1対1は向かい合わせ、デスマッチはばらばら
  const sp=i=>SPAWNS[((o.side|0)+i)%SPAWNS.length];
  ALL().forEach((F,i)=>{const s=G.dm||i>1?sp(i):SPAWNS[(o.side===1)===(i===0)?1:0];F.x=s[0];F.z=s[2];F.y=groundAt(s[0],s[2],s[1]+.2,PR-.03);F.yaw=s[3];F.ar=Math.min(AR_MAX,AR_START+(WEAPONS[F.wm].armor||0));F.arB=0;F.camY=F.y;fillAmmo(F)});for(const q of SHOTS)scene.remove(q.m);SHOTS.length=0;itemsReset();projReset();SFX.charge(false);
  setViewWeapon(ME.w);VIEW.g.visible=true;buildWBar();
  document.body.classList.add('play');showScr(null);hudReset();if(mode==='bot')botSay(pick(['よろしく！','よろしくお願いします！','勝負だ！']),2200)}
function clearFoes(){for(const F of FOES){if(F.model)scene.remove(F.model);F.model=null;clearPortals(F)}FOES=[];OPP=NOBODY}
// 順位（得点→ポイント）
const ranking=()=>ALL().slice().sort((a,b)=>scoreOf(b)-scoreOf(a)||ptsOf(b)-ptsOf(a));
function endMatch(why){if(G.phase==='end')return;G.phase='end';G.endT=0;const a=scoreOf(ME),b=scoreOf(OPP),pa=ptsOf(ME),pb=ptsOf(OPP),rk=ranking(),place=rk.indexOf(ME)+1;
  let r;if(G.dm){const top=rk[0]===ME?rk[1]:rk[0],tie=top&&scoreOf(top)===a&&ptsOf(top)===pa;r=why==='quit'?'lose':place===1?(tie?'draw':'win'):'lose'}
  else{r=a>b?'win':a<b?'lose':pa>pb?'win':pa<pb?'lose':'draw';if(why==='left')r='win';if(why==='quit')r='lose'}
  G.res={r,a,b,pa,pb,why,dm:G.dm,place,on:OPP.name||'???',osk:OPP.sk|0,ow:OPP.w||'fists',n:rk.length,rank:rk.map(F=>({name:F.name||'???',me:F===ME,k:scoreOf(F),p:ptsOf(F)}))};
  const coins=G.dm?(why==='quit'?2:[20,12,8][place-1]||4):r==='win'?15:r==='draw'?6:3;SV.coins+=coins;if(r==='win'){SV.wins++;SV.gems+=1}else if(r==='lose')SV.loses++;else SV.draws++;SV.kills+=Math.max(0,ME.kills|0);saveSV();G.res.coins=coins;
  msg(why==='kills'?(rk[0]===ME?'あなたが':(rk[0].name||'???')+' が')+DM_KILLS+'キル！':why==='left'?(G.dm?'ホストが退出しました':'相手が退出しました'):why==='quit'?'':'TIME UP!');if(why==='quit')G.endT=9}
function quitToMenu(){G.mode=null;G.phase='idle';document.body.classList.remove('play');clearFoes();VIEW.g.visible=false;msg('');if(document.pointerLockElement)document.exitPointerLock();showMenu()}
// 試合の1コマ
function gameUpdate(dt){G.time+=dt;
  if(G.phase==='count'){if(G.mode!=='online'||NET.host){G.ct-=dt}const c=Math.ceil(G.ct);if(c!==G.lastCt){G.lastCt=c;if(c>0){msg(String(c));SFX.beep(false)}}if(G.ct<=0){G.phase='play';msg('FIGHT!',null,1);SFX.beep(true);ME.inv=START_INV;if(G.mode==='bot')for(const F of FOES)F.inv=START_INV}}
  else if(G.phase==='play'){if(G.mode!=='online'||NET.host)G.tl-=dt;else G.tl=Math.max(0,G.tl-dt);if(G.tl<=0&&(G.mode!=='online'||NET.host)){G.tl=0;endMatch()}
    else if(G.dm&&(G.mode!=='online'||NET.host)&&ALL().some(F=>scoreOf(F)>=DM_KILLS))endMatch('kills')}   // デスマッチは15キルで終わり
  else if(G.phase==='end'){G.endT+=dt;if(G.endT>2.2&&!$('sResult').classList.contains('on'))showResult()}
  // 自分
  const canAct=G.phase==='play'||G.phase==='count';
  if(ME.alive){const inp=readInput();let wx=0,wz=0;if(G.phase==='play'){const f=inp.f,s=inp.s,sy=Math.sin(ME.yaw),cy=Math.cos(ME.yaw);wx=-sy*f+cy*s;wz=-cy*f-sy*s;const l=Math.hypot(wx,wz);if(l>1){wx/=l;wz/=l}}
    if(inp.slot!=null)switchWeapon(ME,inp.slot);if(inp.scope)setScope(ME,!ME.scoped);if(inp.reload)startReload(ME);
    moveBody(ME,dt,wx,wz,G.phase==='play'&&inp.jump);gunInput(ME,inp.atk&&G.phase==='play',dt);
    if(ME.onG&&ME.spd>1){ME.stepD+=ME.spd*dt;if(ME.stepD>2.3){ME.stepD=0;SFX.step()}}}
  else if(G.phase!=='end'){ME.deadT+=dt;ME.respT-=dt;const k=ME.killer&&ME.killer.alive?ME.killer.name:'';msg('やられた！',(k?k+' にたおされた　':'')+Math.max(1,Math.ceil(ME.respT))+'秒後に復活');if(ME.respT<=0){respawn(ME);msg('')}}
  statusUpdate(ME,dt);
  // 相手
  if(G.mode==='bot')for(const F of FOES){if(F.alive){if(!BOT.frozen)botUpdate(F,dt)}else if(G.phase!=='end'){F.respT-=dt;if(F.respT<=0)respawn(F)}statusUpdate(F,dt)}
  else if(G.mode==='online')NET.oppUpdate(dt);
  for(const F of FOES)updModel(F,dt);tntUpdate(dt);projUpdate(dt);portalUpdate(dt);fxUpdate(dt);boomUpdate(dt);shotsUpdate(dt);itemsUpdate(dt);
  VIEW.shotT=ME.shotT;VIEW.relK=ME.relT>0?1-ME.relT/ME.relMax:0;VIEW.drawK=Math.max(0,(ME.drawT||0)/.22);   // 持ちかえの動き（撃つのはじゃましない）
  updView(dt,ME.onG&&ME.spd>1,ME.atkT);updCam(dt);updHUD(dt)}
function updCam(dt){const fov=ME.alive&&ME.scoped?ZOOM_FOV(WEAPONS[ME.w].zoom):70;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
  if(ME.alive){if(ME.y>ME.camY)ME.camY=lerp(ME.camY,ME.y,1-Math.exp(-dt*16));else ME.camY=ME.y;cam.position.set(ME.x,ME.camY+EYE,ME.z);cam.rotation.set(ME.pitch,ME.yaw,0,'YXZ')}
  else{const up=Math.min(2.5,ME.deadT*2);cam.position.set(ME.x,ME.y+EYE+up,ME.z);const K=ME.killer;if(K&&K.alive){const q=cam.quaternion.clone();cam.lookAt(K.x,K.y+1.2,K.z);const q2=cam.quaternion.clone();cam.quaternion.copy(q).slerp(q2,Math.min(1,dt*4))}else cam.rotation.set(-.6,ME.yaw,Math.min(.4,ME.deadT*.3),'YXZ')}
  if(G.shake>0){G.shake=Math.max(0,G.shake-dt);const s=G.shake*.25;cam.position.x+=rr(-s,s);cam.position.y+=rr(-s,s);cam.position.z+=rr(-s,s)}}
// メニューの背景：町の上をゆっくり回る
let menuA=0;function menuCam(dt){if(cam.fov!==70){cam.fov=70;cam.updateProjectionMatrix()}menuA+=dt*.06;cam.position.set(Math.sin(menuA)*26,13+Math.sin(menuA*.7)*2,Math.cos(menuA)*36);cam.lookAt(0,2,0);fxUpdate(dt);boomUpdate(dt)}
// タンブルウィード（通りをころがる）
function tumbleUpdate(dt){for(const T of TUMBLE){T.t+=dt;const k=(T.t%24)/24;const x=lerp(MAP.x0-6,MAP.x1+6,k)*(T.g.id%2?1:-1),z=(T.g.id%2?-14:16)+Math.sin(T.t*.7)*3;T.g.position.set(x,.45+Math.abs(Math.sin(T.t*3.2))*.5,z);T.g.rotation.z-=dt*4*(T.g.id%2?1:-1);T.g.rotation.x+=dt}}
