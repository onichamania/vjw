// ===================== 操作（PC・スマホ）とメインループ =====================
const KEY={};let jumpQ=false,mouseAtk=false,lockFail=false;
const inMenu=()=>[...document.querySelectorAll('.scr')].some(e=>e.classList.contains('on'));
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;KEY[e.code]=true;
  if(e.code==='Space'){jumpQ=true;e.preventDefault()}
  if((e.code==='Escape'||e.code==='KeyP')&&G.mode&&G.phase!=='end'){if($('sPause').classList.contains('on'))resumeGame();else if(!inMenu())pauseGame()}
  if(e.code==='Digit2'||e.code==='Digit3')tip((e.code==='Digit2'?'スナイパー':'ヘビー')+'は準備中です')});
addEventListener('keyup',e=>{KEY[e.code]=false});
addEventListener('blur',()=>{for(const k in KEY)KEY[k]=false;mouseAtk=false});
function look(dx,dy,k){if(!ME.alive)return;const s=k*SET.sens/100;ME.yaw-=dx*s;ME.pitch=clamp(ME.pitch-dy*s,-1.45,1.45)}
// ---- マウス（クリックで視点を固定。できないときはドラッグで見回す） ----
function isTouchUI(){return document.body.classList.contains('touch')}
function lockFailed(){if(lockFail)return;lockFail=true;tip('この画面ではマウスを固定できません。右ボタンを押しながら動かすと見回せます（左ボタンで攻撃）',5)}
function lockPointer(){if(isTouchUI()||lockFail)return;try{const r=renderer.domElement.requestPointerLock();if(r&&r.catch)r.catch(lockFailed)}catch(e){lockFailed()}}
document.addEventListener('pointerlockerror',lockFailed);
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&G.mode&&G.phase!=='end'&&!inMenu())pauseGame()});
renderer.domElement.addEventListener('mousedown',e=>{if(!G.mode||isTouchUI())return;ac();if(!document.pointerLockElement&&!lockFail){lockPointer();return}if(e.button===0)mouseAtk=true});
addEventListener('mouseup',e=>{if(e.button===0)mouseAtk=false});
addEventListener('mousemove',e=>{if(!G.mode||G.paused||isTouchUI()||inMenu())return;if(document.pointerLockElement||(lockFail&&e.buttons))look(e.movementX||0,e.movementY||0,.0022)});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
// ---- タッチ：左のスティックで移動、右側をなぞって見回す、⚔で攻撃、↑でジャンプ ----
const TCH={stick:null,cx:0,cy:0,mx:0,my:0,look:null,lx:0,ly:0,atk:null};
if(matchMedia&&matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');
addEventListener('touchstart',()=>{if(!isTouchUI()){document.body.classList.add('touch');if(document.pointerLockElement)document.exitPointerLock()}},{passive:true,capture:true});
function stickSet(x,y){const dx=x-TCH.cx,dy=y-TCH.cy,l=Math.hypot(dx,dy),R=44,k=l>R?R/l:1;TCH.mx=dx*k/R;TCH.my=dy*k/R;$('stick').firstElementChild.style.transform='translate('+(dx*k)+'px,'+(dy*k)+'px)'}
$('stick').addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();ac();const t=e.changedTouches[0],r=$('stick').getBoundingClientRect();TCH.stick=t.identifier;TCH.cx=r.left+r.width/2;TCH.cy=r.top+r.height/2;stickSet(t.clientX,t.clientY)},{passive:false});
$('tAtk').addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();ac();const t=e.changedTouches[0];TCH.atk=t.identifier;TCH.alx=t.clientX;TCH.aly=t.clientY},{passive:false});
$('tJump').addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();ac();jumpQ=true},{passive:false});
addEventListener('touchstart',e=>{if(!G.mode||inMenu())return;for(const t of e.changedTouches){if(t.target&&t.target.closest&&t.target.closest('#stick,#tAtk,#tJump,#wbar,#pauseB'))continue;if(TCH.look==null&&t.clientX>innerWidth*.33){TCH.look=t.identifier;TCH.lx=t.clientX;TCH.ly=t.clientY}}},{passive:true});
addEventListener('touchmove',e=>{if(G.mode)e.preventDefault();for(const t of e.changedTouches){if(t.identifier===TCH.stick)stickSet(t.clientX,t.clientY);
  else if(t.identifier===TCH.look){look(t.clientX-TCH.lx,t.clientY-TCH.ly,.0055);TCH.lx=t.clientX;TCH.ly=t.clientY}
  else if(t.identifier===TCH.atk){look(t.clientX-TCH.alx,t.clientY-TCH.aly,.0055);TCH.alx=t.clientX;TCH.aly=t.clientY}}},{passive:false});
function touchEnd(e){for(const t of e.changedTouches){if(t.identifier===TCH.stick){TCH.stick=null;TCH.mx=TCH.my=0;$('stick').firstElementChild.style.transform=''}if(t.identifier===TCH.look)TCH.look=null;if(t.identifier===TCH.atk)TCH.atk=null}}
addEventListener('touchend',touchEnd);addEventListener('touchcancel',touchEnd);
// その瞬間の入力（テストでは __D.inp で上書きできる）
function readInput(){if(window.__D&&__D.inp){const i=__D.inp;const j=!!i.jump;i.jump=false;return{f:i.f||0,s:i.s||0,jump:j,atk:!!i.atk}}
  let f=0,s=0;if(KEY.KeyW||KEY.ArrowUp)f+=1;if(KEY.KeyS||KEY.ArrowDown)f-=1;if(KEY.KeyD||KEY.ArrowRight)s+=1;if(KEY.KeyA||KEY.ArrowLeft)s-=1;
  if(TCH.stick!=null){f=-TCH.my;s=TCH.mx}const j=jumpQ;jumpQ=false;return{f,s,jump:j,atk:mouseAtk||TCH.atk!=null}}
// ---- メインループ ----
let last=performance.now();
function loop(now){requestAnimationFrame(loop);if(window.__D&&__D.noLoop){last=now;return}let dt=(now-last)/1000;last=now;if(!(dt>0))dt=1/60;dt=Math.min(dt,.05);step(dt);render()}
function step(dt){if(tipT>0){tipT-=dt;if(tipT<=0)$('tip').style.display='none'}tumbleUpdate(dt);
  if(G.mode){if(!G.paused)gameUpdate(dt)}else menuCam(dt);netTick(dt)}
function render(){renderer.clear();renderer.render(scene,cam);if(G.mode&&ME.alive&&VIEW.g.visible){renderer.clearDepth();renderer.render(vscene,vcam)}}
function boot(){bindUI();$('bootTx').textContent='ゴーストタウンをつくっています…';
  setTimeout(()=>{buildMap();$('bootTx').textContent='道を調べています…';
    setTimeout(()=>{buildNav();hudReset();VIEW.g.visible=false;if(!SV.name)showName();else showMenu();last=performance.now();requestAnimationFrame(loop)},20)},20)}
// テスト用
window.__D={G,ME,get OPP(){return OPP},NET,SV,SET,BOT,TNTS,SPAWNS,NAV,LAD,SOL,WEAPONS,cam,scene,renderer,startMatch,endMatch,quitMatch,toMenu,again,showRooms,createRoom,enterRoom,leaveRoom,roomList,
  meleeHit,startSwing,applyHit,explode,tntLight,respawn,step,render,scoreOf,ptsOf,groundAt,hitsBox,nearestNode,flowTo,moveBody,inp:null};
boot();
