// ================= プレイヤー・カメラ・操作 =================
const PL={u:new THREE.Vector3(0,1,0),r:SEA+1,f:new THREE.Vector3(0,0,1),face:new THREE.Vector3(0,0,1),cell:0,
  inv:{},tools:{axe:1,pick:1,weap:1},hp:40,hurtT:9,dead:0,swimT:0,inWater:false,walk:0,spd:0,swing:0,swingK:null,target:null,hitDone:false,skin:'stick',owned:{stick:1},name:''};
const CAM={f:new THREE.Vector3(0,0,1),dist:17,pitch:.98,map:false,mapQ:new THREE.Quaternion(),mapDist:78};
const pTag=document.createElement('div');pTag.className='hpTag';
function skinOf(){return SKINS.find(s=>s.id===PL.skin)||SKINS[0]}
// 体力：剣のレベル＋かぶと・よろい（Wiki「Helmets」「Armor」）
function maxHp(){return Math.round((WHP[PL.tools.weap]+ARMHP[PL.tools.helm||0]+ARMHP[PL.tools.arm||0])*(skinOf().hp||1))}
let PLAYER_MESH=makeChar('stick');scene.add(PLAYER_MESH);
function setSkin(id){PL.skin=id;const old=PLAYER_MESH;PLAYER_MESH=makeChar(id);PLAYER_MESH.position.copy(old.position);PLAYER_MESH.quaternion.copy(old.quaternion);scene.remove(old);scene.add(PLAYER_MESH)}
// ---- はじめの場所 ----
function spawnPoint(){const c=CELLS[TILES[0].cells[0]];return{u:c.c.clone(),cell:c.i}}
function respawn(){const s=spawnPoint();PL.u.copy(s.u);PL.cell=s.cell;PL.r=groundAt(PL.u,CELLS[s.cell]);PL.hp=maxHp();PL.dead=0;PL.swimT=0;PL.inWater=false;if(!CAM.init){CAM.init=1;upBasis(PL.u,_t1,CAM.f)}}
// ---- 入力 ----
const IN={x:0,y:0,keys:{},stick:null,pinch:null};
const stickEl=$('stick'),knobEl=$('knob');
function stickShow(x,y){stickEl.style.display='block';stickEl.style.left=x+'px';stickEl.style.top=y+'px';knobEl.style.transform='translate(-50%,-50%)'}
function stickMove(dx,dy){const R2=52,l=Math.hypot(dx,dy),k=l>R2?R2/l:1;knobEl.style.transform=`translate(calc(-50% + ${dx*k}px),calc(-50% + ${dy*k}px))`;
  // 少しだけ動かしたときは無視、半分より外は全速
  const mag=l<6?0:Math.min(1,(l-6)/(R2*.6));IN.x=l?dx/l*mag:0;IN.y=l?-dy/l*mag:0}
function stickOff(){IN.stick=null;IN.x=IN.y=0;stickEl.style.display='none'}
const uiHit=e=>e.target&&e.target.closest&&e.target.closest('.ui,button,input,textarea,.panel,#res,#topbar');
const gameEl=$('game');
gameEl.addEventListener('touchstart',e=>{if(uiHit(e))return;if(STATE!=='play')return;e.preventDefault();ac();
  for(const t of e.changedTouches){if(CAM.map){IN.mapT={id:t.identifier,x:t.clientX,y:t.clientY};continue}if(!IN.stick){IN.stick={id:t.identifier,x:t.clientX,y:t.clientY};stickShow(t.clientX,t.clientY)}}
  if(e.touches.length===2){const [a,b]=e.touches;IN.pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),z:CAM.map?CAM.mapDist:CAM.dist}}},{passive:false});
gameEl.addEventListener('touchmove',e=>{if(STATE!=='play')return;e.preventDefault();
  if(e.touches.length>=2&&IN.pinch){const [a,b]=e.touches;const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);const z=IN.pinch.z*IN.pinch.d/Math.max(20,d);if(CAM.map)CAM.mapDist=clamp(z,40,130);else CAM.dist=clamp(z,8,24);return}
  for(const t of e.changedTouches){if(IN.mapT&&t.identifier===IN.mapT.id){mapDrag(t.clientX-IN.mapT.x,t.clientY-IN.mapT.y);IN.mapT.x=t.clientX;IN.mapT.y=t.clientY}if(IN.stick&&t.identifier===IN.stick.id)stickMove(t.clientX-IN.stick.x,t.clientY-IN.stick.y)}},{passive:false});
const tEnd=e=>{for(const t of e.changedTouches){if(IN.stick&&t.identifier===IN.stick.id)stickOff();if(IN.mapT&&t.identifier===IN.mapT.id)IN.mapT=null}if(e.touches.length<2)IN.pinch=null;
  // 指がもう1本もないのにスティックが残っていたら消す（はりつき防止）
  if(e.touches.length===0){stickOff();IN.mapT=null}else if(IN.stick&&![...e.touches].some(t=>t.identifier===IN.stick.id))stickOff()};
gameEl.addEventListener('touchend',tEnd);gameEl.addEventListener('touchcancel',tEnd);
let mouseDown=null;
gameEl.addEventListener('mousedown',e=>{if(uiHit(e)||STATE!=='play')return;ac();mouseDown={x:e.clientX,y:e.clientY};if(!CAM.map)stickShow(e.clientX,e.clientY)});
addEventListener('mousemove',e=>{if(!mouseDown)return;if(CAM.map){mapDrag(e.clientX-mouseDown.x,e.clientY-mouseDown.y);mouseDown.x=e.clientX;mouseDown.y=e.clientY}else stickMove(e.clientX-mouseDown.x,e.clientY-mouseDown.y)});
addEventListener('mouseup',()=>{if(mouseDown){mouseDown=null;stickOff()}});
gameEl.addEventListener('wheel',e=>{if(STATE!=='play')return;if(CAM.map)CAM.mapDist=clamp(CAM.mapDist*(1+Math.sign(e.deltaY)*.1),40,130);else CAM.dist=clamp(CAM.dist*(1+Math.sign(e.deltaY)*.08),8,24)},{passive:true});
addEventListener('keydown',e=>{if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;IN.keys[e.code]=true;if(e.code==='KeyM'&&STATE==='play')toggleMap();if(e.code==='Escape'&&STATE==='play')openMenu()});
addEventListener('keyup',e=>{IN.keys[e.code]=false});
const inputReset=()=>{stickOff();IN.keys={};mouseDown=null;IN.pinch=null;IN.mapT=null};
addEventListener('blur',inputReset);document.addEventListener('visibilitychange',()=>{if(document.hidden){inputReset();saveGame();clAfterSave(true)}});
function moveInput(){let x=IN.x,y=IN.y;const K=IN.keys;if(K.KeyW||K.ArrowUp)y+=1;if(K.KeyS||K.ArrowDown)y-=1;if(K.KeyA||K.ArrowLeft)x-=1;if(K.KeyD||K.ArrowRight)x+=1;const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}return[x,y]}
// ---- 地面の種類 ----
// 'land'：開いたタイル / 'ghost'：今買えるタイルの光る板 / 'bridge'：橋 / 'water'：海
function groundKind(c){if(c.t>=0&&W.open.has(c.t))return c.a===12?'bridge':'land';if(c.t>0&&available(c.t))return'ghost';return'water'}
function groundR(u,c,k){k=k||groundKind(c);return k==='land'?groundAt(u,c):k==='bridge'?SEA+.4:k==='ghost'?SEA+.1:SEA-.42}
// ---- ぶつかるもの（木・岩・建物・敵）----
const _d=new THREE.Vector3();
// まだ開いていないタイルの建物・木や岩（見えないもの）にはぶつからない
function pushOut(u,rad,list){for(const o of list){const ou=o.u||o.up;if(!ou)continue;const orad=o.isB?o.r:o.k&&NODE[o.k]?NODE[o.k].r:o.r||0;if(!orad)continue;if(o.k&&NODE[o.k]&&(!o.alive||o.hidden))continue;
    if(o.cell!=null&&!isLand(CELLS[o.cell]))continue;if(o.isB&&o.m&&!o.m.visible)continue;
    const p=o.isB?o.pos:o.pos;_d.copy(u).multiplyScalar(SEA).sub(_t2.copy(p).normalize().multiplyScalar(SEA));const dd=_d.length(),need=rad+orad;
    if(dd<need&&dd>1e-5){tangent(_d,u,_d);u.addScaledVector(_d,(need-dd)/SEA).normalize()}}}
function nearList(ci){const L=[];const add=i=>{const b=BY_CELL[i];if(b)for(const o of b)L.push(o)};add(ci);for(const j of CELLS[ci].nb)add(j);return L}
// ---- 毎コマ：動く ----
const _mv=new THREE.Vector3(),_rt=new THREE.Vector3();
function updatePlayer(dt){
  if(PL.dead>0){PL.dead-=dt;if(PL.dead<=0)respawn();return}
  tangent(CAM.f,PL.u,CAM.f);_rt.crossVectors(CAM.f,PL.u).normalize();
  const [ix,iy]=CAM.map?[0,0]:moveInput();const m=Math.hypot(ix,iy);
  // 放置モード：スティックを動かしたら少しのあいだ手動、そうでなければ自動の向きへ
  if(m>.05&&AUTO.on)AUTO.manualT=1.5;const autoMv=autoActive()&&AUTO.moving&&m<=.05;
  const c0=CELLS[PL.cell],k0=groundKind(c0);PL.inWater=k0==='water';
  const spd=(PL.inWater?2.7:4.6)*(autoMv?1:m>0?m:0);
  if(m>.05||autoMv){if(autoMv)_mv.copy(AUTO.dir);else _mv.copy(CAM.f).multiplyScalar(iy).addScaledVector(_rt,ix).normalize();PL.face.lerp(_mv,1-Math.exp(-dt*14));tangent(PL.face,PL.u,PL.face);
    const nu=PL.u.clone().addScaledVector(_mv,spd*dt/PL.r).normalize();const nc=cellAt(nu,PL.cell),nk=groundKind(CELLS[nc]);
    // 高すぎる段は登れない（海から陸へは上がれる）
    const tr=groundR(nu,CELLS[nc],nk);if(nk!=='water'&&tr-PL.r>1.6&&!PL.inWater){}else if(autoMv&&(nk==='water'||nk==='ghost')&&!PL.inWater){}else{PL.u.copy(nu);PL.cell=nc}}
  pushOut(PL.u,.32,nearList(PL.cell));for(const e of ENEMIES)if(e.alive&&e.vis)pushOut(PL.u,.3,[{pos:e.pos,u:e.u,r:e.r*.8}]);
  PL.cell=cellAt(PL.u,PL.cell);const c=CELLS[PL.cell],k=groundKind(c);const tr=groundR(PL.u,c,k);
  PL.r+=(tr-PL.r)*(1-Math.exp(-dt*(tr>PL.r?16:10)));
  PL.spd=spd;PL.walk+=dt*spd*2.2;
  // 泳ぐ・サメ（Wiki の shark delay：ガイア 4 秒・トロルヘイム 0.5 秒）
  const wet=k==='water';if(wet&&!PL.inWater)SFX.splash();PL.inWater=wet;
  if(wet){PL.swimT+=dt;if(PL.swimT>WD.shark)sharkTick(dt)}else{PL.swimT=0;sharkGone()}
  // 体力の回復（4 秒こうげきされなかったら）
  PL.hurtT+=dt;if(PL.hurtT>4&&PL.hp<maxHp())PL.hp=Math.min(maxHp(),PL.hp+maxHp()*.12*dt);
  autoAction(dt)}
// ---- 自動で切る・掘る・たたかう ----
function toolLv(t){return PL.tools[t]||1}
function findTarget(){let best=null,bd=1e9,lock=null,ld=1e9;
  for(const e of ENEMIES){if(!e.alive||!e.vis)continue;const d=arcDist(PL.u,e.u,SEA)-e.r;if(d<1.25&&d<bd){bd=d;best={type:'enemy',o:e}}}
  if(best)return{t:best,lock:null};
  const only=autoActive()?AUTO.sel:null;
  for(const o of nearList(PL.cell)){if(!o.k||!NODE[o.k]||!o.alive||o.hidden||!isLand(CELLS[o.cell]))continue;if(only&&!only.has('n:'+o.k)&&o!==AUTO.clear)continue;const N=NODE[o.k];const d=arcDist(PL.u,_t1.copy(o.pos).normalize(),SEA)-N.r;
    if(d>.75)continue;if(toolLv(N.tool)<N.lv){if(d<ld){ld=d;lock=o}continue}if(d<bd){bd=d;best={type:'node',o}}}
  return{t:best,lock}}
let LOCK_SHOW=null;
function autoAction(dt){const {t,lock}=findTarget();LOCK_SHOW=lock;
  if(!t){PL.swing=Math.max(0,PL.swing-dt*3);if(PL.swing<=0)PL.swingK=null;PL.target=null;return}
  const tool=t.type==='enemy'?'weap':NODE[t.o.k].tool;
  if(PL.target!==t.o||PL.swingK!==tool){PL.target=t.o;if(PL.swingK!==tool){PL.swing=0;PL.hitDone=false}PL.swingK=tool}
  const per=tool==='weap'?.46:.4;PL.swing+=dt/per;
  if(PL.swing>=.55&&!PL.hitDone){PL.hitDone=true;if(t.type==='enemy')hitEnemy(t.o,Math.round(WPOW[PL.tools.weap]*(skinOf().dmg||1)),true);else hitNode(t.o,toolLv(tool),true)}
  if(PL.swing>=1){PL.swing-=1;PL.hitDone=false}
  // 相手のほうを向く
  const to=tangent(_t1.copy(t.type==='enemy'?t.o.u:_t2.copy(t.o.pos).normalize()).sub(PL.u),PL.u,_t3);if(PL.spd<.5)PL.face.lerp(to,1-Math.exp(-dt*12)).normalize()}
// ---- 見た目（歩く・振る）----
function drawPlayer(dt){const pm=PLAYER_MESH,P=pm.userData.P;pm.visible=STATE==='play'||STATE==='title';
  const pos=_t1.copy(PL.u).multiplyScalar(PL.r);pm.position.copy(pos);frameQuat(PL.u,PL.face,pm.quaternion);
  const w=PL.spd>.3?Math.sin(PL.walk):0,a=PL.spd>.3?.7:0;
  if(PL.dead>0){pm.rotateX(-Math.min(1.4,(2-PL.dead)*3));}
  P.legL.rotation.x=w*a;P.legR.rotation.x=-w*a;P.armL.rotation.x=-w*a*.8;P.body.position.y=.62+(PL.spd>.3?Math.abs(Math.cos(PL.walk))*.05:0);P.head.position.y=.82+(PL.spd>.3?Math.abs(Math.cos(PL.walk))*.05:0);
  if(PL.inWater){P.legL.rotation.x=Math.sin(PL.walk*1.5)*.5;P.legR.rotation.x=-Math.sin(PL.walk*1.5)*.5;P.armL.rotation.x=-1.2+Math.sin(PL.walk*1.5)*.6}
  if(PL.swingK){const s=PL.swing;const ang=s<.55?-2.4*(s/.55):-2.4+2.9*Math.min(1,(s-.55)/.2);P.armR.rotation.x=ang;P.armR.rotation.z=-.2;setHeld(pm,PL.swingK,PL.tools[PL.swingK])}
  else{P.armR.rotation.x=w*a*.8;P.armR.rotation.z=0;setHeld(pm,null)}}
// ---- カメラ ----
const _cp=new THREE.Vector3(),_cl=new THREE.Vector3();
function updateCamera(dt){
  if(CAM.map){const q=CAM.mapQ;_cp.set(0,0,CAM.mapDist).applyQuaternion(q);camera.position.lerp(_cp,1-Math.exp(-dt*6));camera.up.set(0,1,0).applyQuaternion(q);camera.lookAt(0,0,0);
    sun.position.copy(camera.position).add(_t1.set(30,40,20).applyQuaternion(q));sun.target.position.set(0,0,0);SC.left=SC.bottom=-32;SC.right=SC.top=32;SC.far=200;SC.updateProjectionMatrix();return}
  const up=PL.u,P0=_cl.copy(PL.u).multiplyScalar(Math.max(PL.r,SEA));
  const want=_cp.copy(P0).addScaledVector(up,CAM.dist*Math.sin(CAM.pitch)).addScaledVector(CAM.f,-CAM.dist*Math.cos(CAM.pitch));
  if(!CAM.ready){camera.position.copy(want);CAM.ready=1}else camera.position.lerp(want,1-Math.exp(-dt*8));
  camera.up.copy(up);camera.lookAt(P0.addScaledVector(up,.6));
  // 日の光：カメラから見て左上から（影がいつも見えるように）
  _rt.crossVectors(CAM.f,up).normalize();sun.position.copy(PL.u).multiplyScalar(PL.r).addScaledVector(up,30).addScaledVector(_rt,-14).addScaledVector(CAM.f,8);sun.target.position.copy(PL.u).multiplyScalar(PL.r);
  if(SC.right!==16){SC.left=SC.bottom=-16;SC.right=SC.top=16;SC.far=80;SC.updateProjectionMatrix()}}
function mapDrag(dx,dy){const q=CAM.mapQ;const ax=new THREE.Vector3(1,0,0).applyQuaternion(q),ay=new THREE.Vector3(0,1,0).applyQuaternion(q);q.premultiply(_q1.setFromAxisAngle(ay,-dx*.006));q.premultiply(_q1.setFromAxisAngle(ax,-dy*.006));q.normalize()}
function toggleMap(on){CAM.map=on==null?!CAM.map:on;inputReset();if(CAM.map){// 今いる場所を前に
    const z=PL.u.clone(),y=tangent(CAM.f.clone(),z);const x=new THREE.Vector3().crossVectors(y,z);_m1.makeBasis(x,y,z);CAM.mapQ.setFromRotationMatrix(_m1);CAM.mapDist=78}
  else CAM.ready=0;document.body.classList.toggle('mapv',CAM.map);uiMap()}
// ---- サメ ----
let SHARK=null;
function sharkModel(){const b=new MB();b.add(G.cone(.35,1,4),'#7c8ca0',T(0,.4,0,0,0,0,.3,1,1));b.add(G.sph(.5,8,5),'#7c8ca0',T(0,-.35,0,0,0,0,.8,.6,2.2));b.add(G.cone(.3,.8,4),'#7c8ca0',T(0,-.35,-1.2,-Math.PI/2,0,0,1,1,.3));
  const m=new THREE.Mesh(b.geo(),VCMAT);return m}
function sharkTick(dt){if(!SHARK){SHARK={m:sharkModel(),a:0,bite:1.2};world.add(SHARK.m);SFX.shark();toast('サメだ！ 陸にもどろう')}
  const S=SHARK;S.a+=dt*2.2;const rr=Math.max(.9,2.6-PL.swimT*.25);_t1.crossVectors(PL.u,CAM.f).normalize();const off=_t2.copy(CAM.f).multiplyScalar(Math.cos(S.a)*rr).addScaledVector(_t1,Math.sin(S.a)*rr);
  const p=_t3.copy(PL.u).multiplyScalar(SEA).add(off);p.normalize().multiplyScalar(SEA);S.m.position.copy(p);const fwd=tangent(_t1.copy(off).cross(PL.u).negate(),PL.u);frameQuat(p.clone().normalize(),fwd,S.m.quaternion);
  S.bite-=dt;if(S.bite<=0){S.bite=1.2;damagePlayer(Math.ceil(maxHp()*.34),'shark')}}
function sharkGone(){if(SHARK){world.remove(SHARK.m);SHARK=null}}
function damagePlayer(d,by){if(PL.dead>0)return;PL.hp-=d;PL.hurtT=0;SFX.hurt();floatText('-'+d,PL.u.clone().multiplyScalar(PL.r+1.8),'#ff5050');flashHurt();
  if(PL.hp<=0){PL.hp=0;PL.dead=2;SFX.die();sharkGone();toast(by==='shark'?'サメに食べられた…（はじめの島にもどります）':'やられた…（はじめの島にもどります）')}}
