// ===================== 操作（PC・スマホ）とメインループ =====================
const KEY={};let jumpQ=false,mouseAtk=false,lockFail=false;const PEND={slot:null,scope:false,reload:false};const LAYM=()=>document.body.classList.contains('lay');
const inMenu=()=>[...document.querySelectorAll('.scr')].some(e=>e.classList.contains('on'));
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;
  if((e.code==='KeyT'||e.code==='Enter')&&!CHAT.open&&(G.mode&&!inMenu()||$('sWait').classList.contains('on'))){e.preventDefault();openChat();return}
  KEY[e.code]=true;
  if(e.code==='Space'){jumpQ=true;e.preventDefault()}
  if((e.code==='Escape'||e.code==='KeyP')&&G.mode&&G.phase!=='end'){if($('sPause').classList.contains('on'))resumeGame();else if(!inMenu())pauseGame()}
  if(e.code==='Digit1')PEND.slot=0;if(e.code==='Digit2')PEND.slot=1;if(e.code==='Digit3')PEND.slot=2;if(e.code==='Digit4')PEND.slot=3;if(e.code==='Digit5')PEND.slot=4;if(e.code==='Digit6')PEND.slot=5;if(e.code==='KeyQ')PEND.slot=(ME.cw+1)%SLOTS;
  if(e.code==='KeyE'&&!e.repeat)PEND.scope=true;if(e.code==='KeyR')PEND.reload=true});
addEventListener('keyup',e=>{KEY[e.code]=false});
addEventListener('blur',()=>{for(const k in KEY)KEY[k]=false;mouseAtk=false});
function look(dx,dy,k){if(!ME.alive)return;const s=k*SET.sens/100*(ME.scoped?cam.fov/70*1.2:1);ME.yaw-=dx*s;ME.pitch=clamp(ME.pitch-dy*s,-1.45,1.45)}
// ---- マウス（クリックで視点を固定。できないときはドラッグで見回す） ----
function isTouchUI(){return document.body.classList.contains('touch')}
function lockFailed(){if(lockFail)return;lockFail=true;tip('この画面ではマウスを固定できません。右ボタンを押しながら動かすと見回せます（左ボタンで攻撃）',5)}
function lockPointer(){if(isTouchUI()||lockFail)return;try{const r=renderer.domElement.requestPointerLock();if(r&&r.catch)r.catch(lockFailed)}catch(e){lockFailed()}}
document.addEventListener('pointerlockerror',lockFailed);
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&G.mode&&G.phase!=='end'&&!inMenu()&&!CHAT.open)pauseGame()});
renderer.domElement.addEventListener('mousedown',e=>{if(!G.mode||isTouchUI())return;ac();if(!document.pointerLockElement&&!lockFail){lockPointer();return}if(e.button===0)mouseAtk=true;if(e.button===2&&document.pointerLockElement)PEND.scope=true});
addEventListener('wheel',e=>{if(G.mode&&!inMenu()&&Math.abs(e.deltaY)>4)PEND.slot=(ME.cw+(e.deltaY>0?1:SLOTS-1))%SLOTS},{passive:true});
addEventListener('mouseup',e=>{if(e.button===0)mouseAtk=false});
addEventListener('mousemove',e=>{if(!G.mode||G.paused||isTouchUI()||inMenu())return;if(document.pointerLockElement||(lockFail&&e.buttons))look(e.movementX||0,e.movementY||0,.0022)});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
// ---- タッチ：左のスティックで移動、右側をなぞって見回す、⚔で攻撃、↑でジャンプ ----
const TCH={stick:null,cx:0,cy:0,mx:0,my:0,look:null,lx:0,ly:0,atk:null};
if(matchMedia&&matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');
addEventListener('touchstart',()=>{if(!isTouchUI()){document.body.classList.add('touch');if(document.pointerLockElement)document.exitPointerLock()}},{passive:true,capture:true});
function stickSet(x,y){const dx=x-TCH.cx,dy=y-TCH.cy,l=Math.hypot(dx,dy),R=44,k=l>R?R/l:1;TCH.mx=dx*k/R;TCH.my=dy*k/R;$('stick').firstElementChild.style.transform='translate('+(dx*k)+'px,'+(dy*k)+'px)'}
$('stick').addEventListener('touchstart',e=>{if(LAYM())return;e.preventDefault();e.stopPropagation();ac();const t=e.changedTouches[0],r=$('stick').getBoundingClientRect();TCH.stick=t.identifier;TCH.cx=r.left+r.width/2;TCH.cy=r.top+r.height/2;stickSet(t.clientX,t.clientY)},{passive:false});
for(const id of['tAtk','tAtk2'])$(id).addEventListener('touchstart',e=>{if(LAYM())return;e.preventDefault();e.stopPropagation();ac();const t=e.changedTouches[0];TCH.atk=t.identifier;TCH.alx=t.clientX;TCH.aly=t.clientY},{passive:false});
$('tAim').addEventListener('touchstart',e=>{if(LAYM())return;e.preventDefault();e.stopPropagation();ac();PEND.scope=true;const t=e.changedTouches[0];if(TCH.look==null){TCH.look=t.identifier;TCH.lx=t.clientX;TCH.ly=t.clientY}},{passive:false});
$('tRel').addEventListener('touchstart',e=>{if(LAYM())return;e.preventDefault();e.stopPropagation();ac();PEND.reload=true},{passive:false});
$('tJump').addEventListener('touchstart',e=>{if(LAYM())return;e.preventDefault();e.stopPropagation();ac();jumpQ=true},{passive:false});
addEventListener('touchstart',e=>{if(!G.mode||inMenu())return;for(const t of e.changedTouches){if(t.target&&t.target.closest&&t.target.closest('#stick,#tAtk,#tAtk2,#tAim,#tRel,#tJump,#wbar,#pauseB'))continue;if(TCH.look==null&&t.clientX>innerWidth*.33){TCH.look=t.identifier;TCH.lx=t.clientX;TCH.ly=t.clientY}}},{passive:true});
addEventListener('touchmove',e=>{if(G.mode)e.preventDefault();for(const t of e.changedTouches){if(t.identifier===TCH.stick)stickSet(t.clientX,t.clientY);
  else if(t.identifier===TCH.look){look(t.clientX-TCH.lx,t.clientY-TCH.ly,.0055);TCH.lx=t.clientX;TCH.ly=t.clientY}
  else if(t.identifier===TCH.atk){look(t.clientX-TCH.alx,t.clientY-TCH.aly,.0055);TCH.alx=t.clientX;TCH.aly=t.clientY}}},{passive:false});
function touchEnd(e){for(const t of e.changedTouches){if(t.identifier===TCH.stick){TCH.stick=null;TCH.mx=TCH.my=0;$('stick').firstElementChild.style.transform=''}if(t.identifier===TCH.look)TCH.look=null;if(t.identifier===TCH.atk)TCH.atk=null}}
addEventListener('touchend',touchEnd);addEventListener('touchcancel',touchEnd);
// その瞬間の入力（テストでは __D.inp で上書きできる）
function readInput(){const P={slot:PEND.slot,scope:PEND.scope,reload:PEND.reload};PEND.slot=null;PEND.scope=PEND.reload=false;
  if(window.__D&&__D.inp){const i=__D.inp;const j=!!i.jump;i.jump=false;const o={f:i.f||0,s:i.s||0,jump:j,atk:!!i.atk,slot:i.slot!=null?i.slot:P.slot,scope:!!i.scope||P.scope,reload:!!i.reload||P.reload};i.slot=null;i.scope=i.reload=false;return o}
  let f=0,s=0;if(KEY.KeyW||KEY.ArrowUp)f+=1;if(KEY.KeyS||KEY.ArrowDown)f-=1;if(KEY.KeyD||KEY.ArrowRight)s+=1;if(KEY.KeyA||KEY.ArrowLeft)s-=1;
  if(TCH.stick!=null){f=-TCH.my;s=TCH.mx}const j=jumpQ;jumpQ=false;return{f,s,jump:j,atk:mouseAtk||TCH.atk!=null,slot:P.slot,scope:P.scope,reload:P.reload}}
// ---- メインループ ----
let last=performance.now();
function loop(now){requestAnimationFrame(loop);if(window.__D&&__D.noLoop){last=now;return}let dt=(now-last)/1000;last=now;if(!(dt>0))dt=1/60;dt=Math.min(dt,.05);step(dt);render()}
function step(dt){chatUpdate(dt);if(tipT>0){tipT-=dt;if(tipT<=0)$('tip').style.display='none'}tumbleUpdate(dt);
  if(G.mode){if(!G.paused)gameUpdate(dt)}else menuCam(dt);netTick(dt)}
// X線（監督）：スコープをのぞいている間だけ、壁にかくれた相手を青いシルエットで見せる
// 相手の材質は町や小物と共有なので書きかえない（上書き用の材質で別に描く）
// ①見えている部分にしるし（ステンシル）をつける ②しるしのない、かくれた部分だけを青くぬる
const XSC=new THREE.Scene(),
  XMARK=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false,stencilWrite:true,stencilRef:1,stencilFunc:THREE.AlwaysStencilFunc,stencilZPass:THREE.ReplaceStencilOp}),
  XBLUE=new THREE.MeshBasicMaterial({color:0x3a8cff,transparent:true,opacity:.75,depthWrite:false,depthFunc:THREE.GreaterDepth,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.ReplaceStencilOp});
const xrayOn=()=>G.mode&&ME.alive&&ME.scoped&&WEAPONS[ME.w].xray;
function render(){renderer.clear();renderer.render(scene,cam);
  if(xrayOn())for(const F of FOES){if(!F.alive||!F.model||!F.model.visible||!live(F))continue;const m=F.model,par=m.parent||scene,tv=F.tag?F.tag.visible:false;if(F.tag)F.tag.visible=false;
    XSC.add(m);XSC.overrideMaterial=XMARK;renderer.render(XSC,cam);XSC.overrideMaterial=XBLUE;renderer.render(XSC,cam);XSC.overrideMaterial=null;par.add(m);if(F.tag)F.tag.visible=tv}
  if(G.mode&&ME.alive&&VIEW.g.visible){renderer.clearDepth();renderer.render(vscene,vcam)}}
function boot(){bindUI();$('bootTx').textContent='ゴーストタウンをつくっています…';
  setTimeout(()=>{buildMap();$('bootTx').textContent='道を調べています…';
    setTimeout(()=>{buildNav();renderSniperIcons();applyLayout();hudReset();VIEW.g.visible=false;if(!SV.name)showName();else showMenu();last=performance.now();requestAnimationFrame(loop)},20)},20)}
// テスト用
window.__D={G,ME,get OPP(){return OPP},get FOES(){return FOES},ranking,hostStart,NET,SV,SET,BOT,TNTS,SPAWNS,NAV,LAD,SOL,WEAPONS,cam,scene,renderer,startMatch,endMatch,quitMatch,toMenu,again,showRooms,createRoom,enterRoom,leaveRoom,roomList,
  meleeHit,startSwing,fireSniper,fireHeavy,firePrimary,PRIMARIES,fireBackup,BACKUPS,fireSpecial,SPECIALS,BOT_LV,gunInput,PROJ,PORTALS,switchWeapon,setScope,startReload,traceShot,rayWorld,showLayout,PEND,get LAY(){return LAY},SNIPER_ICON,applyHit,explode,tntLight,respawn,step,render,scoreOf,ptsOf,groundAt,hitsBox,nearestNode,flowTo,moveBody,inp:null};
boot();
