// ================= 画面の大きさ・横画面 =================
// 画面の大きさ。--u は本家のように「横16:9の高さの1%」（UIの大きさの単位）。試合中は16:9より横長なら左右に黒い帯（本家と同じ）
function resize(){const w=VW(),h=VH();renderer.setSize(w,h,false);cam.aspect=w/h;cam.fov=camFov();cam.updateProjectionMatrix();
  const r=$('rot'),port=w<h,u=port?Math.min(w*.9,h*9/16)/100:Math.min(h,w*9/16)/100,bx=port?0:Math.max(0,(w-h*16/9)/2);r.style.setProperty('--u',u.toFixed(2)+'px');r.style.setProperty('--bx',bx.toFixed(1)+'px');document.body.classList.toggle('port',port)}
function applyRot(){const r=$('rot');r.style.width=VW()+'px';r.style.height=VH()+'px';r.style.transform=ROT?'rotate(90deg) translateY(-100%)':'none';resize()}
addEventListener('resize',applyRot);
addEventListener('message',e=>{const o=e.data&&e.data.h3dSet;if(!o)return;if(typeof o.land==='boolean'&&o.land!==ROT){ROT=o.land;applyRot()}if(typeof o.sound==='boolean')S.sound=o.sound;if(typeof o.vol==='number')S.vol=o.vol;if(master)master.gain.value=S.sound&&!paused?S.vol*.8:0});
if(matchMedia('(hover:none)').matches)document.body.classList.add('touch');
try{if(window.parent!==window)document.body.classList.add('inl')}catch(e){document.body.classList.add('inl')}
let last=performance.now();
// ループは先に次のフレームを予約し、途中でエラーが出ても止まらないようにする（固まる対策）
let errN=0;const PERF={acc:0,n:0,pr:renderer.getPixelRatio(),low:0};
function perf(dt){if(G.state!=='play')return;PERF.acc+=dt;PERF.n++;if(PERF.acc<2.5)return;const fps=PERF.n/PERF.acc;PERF.acc=0;PERF.n=0;
  if(fps<38){if(PERF.pr>.75){PERF.pr=Math.max(.75,PERF.pr-.2);renderer.setPixelRatio(PERF.pr);resize()}else if(sun.castShadow){sun.castShadow=false;PERF.low=1}}}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
  try{if(!paused)step(dt);perf(dt)}catch(e){if(errN++<5)console.error(e)}
  try{renderer.render(scene,cam)}catch(e){if(errN++<5)console.error(e)}}
// よく使う色や形を最初に一度描いておく（初めて出たときのカクつき対策）
{const w=new THREE.Group();w.position.set(0,-40,0);for(const m of[GMAT.bomb,GMAT.heal,GMAT.mk0,gemMat,cubeMat,aimMat,aimMatS])w.add(new THREE.Mesh(GEO.bomb,m));scene.add(w);try{renderer.compile(scene,cam)}catch(e){}setTimeout(()=>scene.remove(w),4000)}
buildArena('valley');applyRot();G.state='boot';requestAnimationFrame(frame);
// ---- 最初のロード画面 ----
{const tips=['ヒント：草むらに入ると相手から見えない','ヒント：攻撃を当てると必殺技がたまる','ヒント：トロフィーをためると新しいキャラが仲間になる','ヒント：スタードロップはタップするとレア度が上がることがある','ヒント：Lv7でガジェット、Lv9でスターパワーが買える','ヒント：ガジェットはクールダウン制。時間がたてば何回でも使える','ヒント：ハイパーチャージ中は速く・強くなって、体力も回復する','ヒント：バフィーでガジェット・スターパワー・ハイパーがもっと強くなる'];
  let p=0,ready=false;$('bootTip').textContent=tips[Math.floor(Math.random()*tips.length)];
  const tick=()=>{p=Math.min(100,p+rr(6,16));$('bootBar').style.width=p+'%';if(p<100)setTimeout(tick,rr(80,200));else{ready=true;$('bootTip').textContent=tips[Math.floor(Math.random()*tips.length)];$('bootTap').style.visibility='visible'}};setTimeout(tick,150);
  const go=()=>{if(!ready||$('boot').classList.contains('hide'))return;initAudio();SFX.superReady();$('boot').classList.add('hide');setTimeout(()=>$('boot').style.display='none',520);if(!LS('gr-tut',''))startMatch('tutorial');else showMenu()};
  $('boot').addEventListener('pointerdown',go);addEventListener('keydown',e=>{if($('boot').style.display!=='none'&&(e.code==='Enter'||e.code==='Space'))go()})}
// ================= 演出（気持ちよさアップ）=================
const FXL=document.createElement('div');FXL.id='fxl';$('rot').appendChild(FXL);
function fxEl(cls,html,css){const d=document.createElement('div');d.className=cls;if(html)d.innerHTML=html;if(css)d.style.cssText=css;FXL.appendChild(d);return d}
function fxFlash(col,a,dur,vign){const d=fxEl('fxflash'+(vign?' vign':''),'',(vign?`--c:${col};`:`background:${col};`)+`--a:${a};--d:${dur}s`);setTimeout(()=>d.remove(),dur*1000+60)}
let slamEl=null;function fxSlam(t,col,sub){if(slamEl)slamEl.remove();$('big').style.display='none';bigT=0;const e=slamEl=fxEl('fxslam',`<b style="color:${col}">${t}</b>${sub?'<small>'+sub+'</small>':''}`,`--c:${col}`);setTimeout(()=>e.remove(),1200)}
function confetti(x,y,n,opt){opt=opt||{};const cols=opt.cols||['#ffd84d','#ff4d6d','#5fb8ff','#3be07a','#c264ff','#ffffff'];n=Math.min(n,opt.max||80);const sp=opt.spread||280;
  for(let i=0;i<n;i++){const a=opt.down?rr(0,TAU):rr(-Math.PI*.92,-Math.PI*.08),v=rr(.35,1)*sp,dx=Math.cos(a)*v,dy=Math.sin(a)*v;
    const d=fxEl('cf'+(opt.coin?' coin':''),opt.coin?'🪙':'',`left:${x}px;top:${y}px;background:${cols[i%cols.length]};--x:${dx}px;--y1:${dy}px;--y2:${dy*.25+rr(160,340)}px;--r:${rr(-900,900)}deg;--t:${rr(.9,1.7)}s`);setTimeout(()=>d.remove(),1800)}}
// 押した場所からコインが飛んでいく
let LP=null;document.addEventListener('pointerdown',e=>{LP=[e.clientX,e.clientY]},true);
function coinFx(n){if(G.state!=='menu'||ROT||!LP)return;const tg=[$('dCoins'),$('shCoin'),$('coins')].find(e=>e&&e.offsetParent);if(!tg)return;const r=tg.getBoundingClientRect(),tx=r.left+r.width/2,ty=r.top+r.height/2,k=Math.min(14,4+Math.floor(n/40));
  for(let i=0;i<k;i++){const d=fxEl('cfly','🪙',`left:${LP[0]-11}px;top:${LP[1]-11}px`);const ox=rr(-50,50),oy=rr(-60,10);d.style.transform=`translate(0,0)`;
    setTimeout(()=>{d.style.transform=`translate(${ox}px,${oy}px) scale(1.2)`},10);
    setTimeout(()=>{d.style.transform=`translate(${tx-LP[0]}px,${ty-LP[1]}px) scale(.7)`;d.style.opacity='0'},180+i*45);
    setTimeout(()=>{d.remove();tn(1500+i*40,.06,.08,'square');const p=tg.parentElement||tg;p.classList.remove('bump');void p.offsetWidth;p.classList.add('bump')},180+i*45+720)}
  confetti(LP[0],LP[1],14,{coin:true,spread:160})}
// 音
SFX.kill=n=>{const b=[523,659,784,1046,1318,1568];b.slice(0,3+Math.min(n,3)).forEach((f,i)=>tn(f,.16,.16,'square',0,i*.055));nz(.25,.25,3000,'highpass',1,.02)};
SFX.lvup=()=>{[392,523,659,784,1046].forEach((f,i)=>tn(f,.25,.16,'triangle',0,i*.08));tn(1568,.5,.12,'sine',0,.42)};
SFX.tick=i=>tn(900+i*18,.03,.06,'square');
// ヒットストップ（倒したときに一瞬スロー）
let HS=0;const _step=step;step=function(dt){if(HS>0){HS-=dt;dt*=.15}_step(dt)};
// 攻撃・ダメージ・撃破
let comboN=0,comboT=-9,streak=0,streakT=-99;
const _hurt=hurt;hurt=function(t,dmg,src,isSup,fx){const alive=!t.dead,hp0=t.hp,sh0=t.shield||0;_hurt(t,dmg,src,isSup,fx);if(!alive||G.state==='menu')return;
  const s0=src&&(src.isTurret||src.isHead||src.isPet)?src.src:src,d=hp0-t.hp+(sh0-(t.shield||0));
  if(s0&&s0.isMe&&d>0&&t.team!==s0.team){if(G.t-comboT<1)comboN=Math.min(comboN+1,14);else comboN=0;comboT=G.t;tn(560+comboN*55,.05,.07,'square',1100);
    burst(t.x,1.3,t.z,isSup?16:7,[1,.95,.55],isSup?6:3.5,isSup?.5:.35,.3,true);if(isSup)G.shake=Math.max(G.shake,.4)}
  if(t.isMe&&d>0&&!t.dead&&t.hp<t.maxHp*.35)fxFlash('#ff2030',.35,.4,true);
  if(t.dead&&G.units.includes(t))onKill(t,s0)};
function onKill(t,s){t.killedBy=s;if(s&&!s.isMe&&!s.dead&&Math.random()<.3)setTimeout(()=>{if(G.state==='play')showPin(s,'like')},rr(300,700));if(!t.isMe&&!s?.isMe&&Math.random()<.2){const al=G.units.filter(o=>!o.isMe&&!o.dead&&!o.dummy&&o.team===t.team&&G.mode!=='br');if(al.length)setTimeout(()=>{if(G.state==='play')showPin(al[0],'bad')},rr(400,900))}const [sx,sy]=scr(t.x,1.4,t.z);burst(t.x,1.2,t.z,34,[1,.85,.3],9,.8,.75,true);burst(t.x,.4,t.z,20,[1,1,1],6,.5,.5,true);
  if(s&&s.isMe){streak=G.t-streakT<8?streak+1:1;streakT=G.t;const T=['たおした！','ダブルキル！','トリプルキル！','ウルトラキル！','むそう！！'][Math.min(streak,5)-1];
    HS=.16;fxFlash('#ffffff',.3,.25);G.shake=Math.max(G.shake,.75);confetti(sx,sy,26+streak*12);SFX.kill(streak)}
  else if(t.isMe){fxFlash('#ff1a2a',.75,1,true);HS=.22;G.shake=.9}
  else if(s&&s.team===0)confetti(sx,sy,10,{spread:150})}
// 自分の攻撃に少し反動
const _attack=attack;attack=function(u){const r=_attack.apply(this,arguments);if(u&&u.isMe&&G.state==='play')G.shake=Math.max(G.shake,.07);return r};
const _superAtk=superAtk;superAtk=function(u){const s0=u&&u.sup,r=_superAtk.apply(this,arguments);if(u&&u.isMe&&u.sup<s0){fxFlash('#ffd84d',.28,.35);G.shake=Math.max(G.shake,.35);burst(u.x,1,u.z,30,[1,.85,.3],7,.6,.5,true)}return r};
function superFx(u){burst(u.x,1,u.z,36,[1,.85,.3],6,.6,.6,true);const b=$('supBtn');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');if(!document.body.classList.contains('touch'))note('必殺技OK！（右クリック / E）',1.2)}
function gemFx(u){dmgNum(u,'+1 💎','gem');tn(880+Math.min(u.gems,12)*80,.1,.14,'sine')}
// パワーアップ
const _upgrade=upgrade;upgrade=function(id){const l0=level(id);_upgrade(id);if(level(id)>l0){fxSlam('パワー '+level(id)+'！','#b58cff','体力と攻撃力アップ');confetti(VW()*.27,VH()*.55,60);SFX.lvup()}};
// キャラ解放・ランクアップ
const _nextPop=nextPop;nextPop=function(){_nextPop();if($('unlockScr').classList.contains('on')){confetti(VW()/2,VH()*.45,70);setTimeout(()=>confetti(VW()*.3,VH()*.5,40),300);setTimeout(()=>confetti(VW()*.7,VH()*.5,40),500);SFX.lvup()}};
// 結果画面：数字がカウントアップ、勝ったら紙ふぶき
const _showResult=showResult;showResult=function(){_showResult();const t=$('rTitle');t.classList.remove('slam');void t.offsetWidth;t.classList.add('slam');
  const win=t.className.includes('win');if(win){fxFlash('#fff6b0',.35,.5);confetti(VW()/2,VH()*.25,80);setTimeout(()=>confetti(VW()*.2,VH()*.3,50),350);setTimeout(()=>confetti(VW()*.8,VH()*.3,50),650)}
  document.querySelectorAll('#rSub .cu').forEach((e,j)=>{const to=+e.dataset.v,pre=e.dataset.p||'',t0=performance.now()+300+j*250,D=900;e.textContent=pre+'0';let i=0;
    const f=now=>{const k=clamp((now-t0)/D,0,1),v=Math.round(to*(1-Math.pow(1-k,3)));e.textContent=pre+(to<0?v:v);if(k>0&&k<1&&i++%3===0)SFX.tick(i);if(k<1)requestAnimationFrame(f);else{e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump');if(to>0){const r=e.getBoundingClientRect();if(!ROT)confetti(r.left+r.width/2,r.top,18,{coin:pre.includes('🪙'),spread:150})}}};requestAnimationFrame(f)})};
// ================= 観戦（やられている間はカメラを自由に動かせる）=================
const SPEC={on:false,tgt:null,free:false,x:0,z:0,drag:null};
const specing=()=>{const u=G.me;return !!u&&u.dead&&(G.state==='play'||G.state==='end')&&G.rule!=='tutorial'};
function specList(){const u=G.me;return G.units.filter(o=>!o.dead&&!o.isMe&&!o.dummy&&(G.mode==='br'||o.team===u.team))}
function specStart(){const u=G.me;SPEC.on=true;SPEC.free=false;SPEC.drag=null;SPEC.x=u.x;SPEC.z=u.z;SPEC.tgt=null;
  const L=specList(),k=u.killedBy;if(respawnTime()>1e8){SPEC.tgt=k&&!k.dead&&L.includes(k)?k:L[0]||null}
  document.body.classList.add('spec');specDraw()}
function specStop(){SPEC.on=false;SPEC.tgt=null;SPEC.drag=null;document.body.classList.remove('spec');$('specCd').innerHTML='';if(/復活|やられた/.test($('note').textContent)){$('note').textContent='';noteT=0}}
function specNext(dir){const L=specList();if(!L.length){SPEC.tgt=null;SPEC.free=true;specDraw();return}let i=L.indexOf(SPEC.tgt);i=i<0?(dir>0?0:L.length-1):(i+dir+L.length)%L.length;SPEC.tgt=L[i];SPEC.free=false;tn(700,.05,.1,'square',900);specDraw()}
function specDraw(){const t=SPEC.tgt;$('specName').textContent=SPEC.free||!t?'フリーカメラ':t.name+(G.mode==='br'?'':t.team===G.me.team?'（味方）':'');$('specName').style.color=!t||SPEC.free?'#fff':t.team===G.me.team?'#8cc8ff':'#ff8b8b'}
function specTick(dt){const on=specing();if(on&&!SPEC.on)specStart();if(!on&&SPEC.on)specStop();if(!SPEC.on)return;const u=G.me;
  if(SPEC.tgt&&SPEC.tgt.dead){const L=specList();SPEC.tgt=L[0]||null;if(!SPEC.tgt&&respawnTime()>1e8)SPEC.free=true;specDraw()}
  const kx=(K.KeyD?1:0)-(K.KeyA?1:0),kz=(K.KeyS?1:0)-(K.KeyW?1:0);if(kx||kz){if(!SPEC.free){SPEC.free=true;specDraw()}SPEC.x+=kx*dt*16;SPEC.z+=kz*dt*16}
  SPEC.x=clamp(SPEC.x,-HALFX,HALFX);SPEC.z=clamp(SPEC.z,-HALFZ,HALFZ);
  const rt=respawnTime(),cd=$('specCd');
  if(G.mode==='br')cd.innerHTML=`<b>${G.place||'-'}位</b><small>やられた… 最後まで観戦できるよ</small>`;
  else if(rt<1e8)cd.innerHTML=`<small>復活まで</small><b>${Math.max(1,Math.ceil(u.respT))}</b>`;
  else cd.innerHTML=`<b style="font-size:26px">観戦中</b><small>次のラウンドまで待とう</small>`}
// カメラの目標（updCam から呼ぶ）
function specCam(){const u=G.me;if(SPEC.tgt&&!SPEC.free){SPEC.x=SPEC.tgt.x;SPEC.z=SPEC.tgt.z}
  else if(!SPEC.free&&G.mode!=='br'&&respawnTime()<1e8){const [sx,sz]=u.spawn,k=clamp(1-u.respT/Math.max(1,respawnTime()),0,1);SPEC.x=lerp(u.x,sx,k);SPEC.z=lerp(u.z,sz,k)}
  return[SPEC.x,SPEC.z]}
function specPx(){return 2*Math.tan(cam.fov*Math.PI/360)*camDist()*ZOOM/VH()}
R.addEventListener('pointerdown',e=>{if(!SPEC.on||e.target.closest('button,.scr,#pause'))return;const p=P(e);SPEC.drag={id:e.pointerId,x:p.x,y:p.y};e.preventDefault();e.stopPropagation();try{R.setPointerCapture(e.pointerId)}catch(_){}},true);
R.addEventListener('pointermove',e=>{const d=SPEC.drag;if(!d||d.id!==e.pointerId)return;const p=P(e),k=specPx(),dx=p.x-d.x,dy=p.y-d.y;if(!SPEC.free&&Math.hypot(dx,dy)>4){SPEC.free=true;specDraw()}if(SPEC.free){SPEC.x-=dx*k;SPEC.z-=dy*k*1.15}d.x=p.x;d.y=p.y});
const specUp=e=>{if(SPEC.drag&&SPEC.drag.id===e.pointerId)SPEC.drag=null};R.addEventListener('pointerup',specUp);R.addEventListener('pointercancel',specUp);
$('specL').addEventListener('click',()=>specNext(-1));$('specR').addEventListener('click',()=>specNext(1));
$('specExit').addEventListener('click',()=>{G.specExit=1});
addEventListener('keydown',e=>{if(!SPEC.on||e.repeat)return;if(e.code==='ArrowLeft'||e.code==='ArrowRight'){specNext(e.code==='ArrowRight'?1:-1);e.preventDefault()}else if(e.code==='Enter'&&G.mode==='br')G.specExit=1});
// ================= ピン（試合中に頭の上に出すエモート）=================
const PINS={like:{name:'いいね',f:'#2f7df0',f2:'#1b56b8',in:'#4fa3ff',hi:'#bfe0ff',down:false},bad:{name:'バッド',f:'#e83a3a',f2:'#a81c1c',in:'#ff5f5f',hi:'#ffd0d0',down:true}};
function pinSvg(k){const p=PINS[k];
  const hand=`<g stroke="#101010" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"><rect x="23" y="46" width="14" height="31" rx="3" fill="#fff"/><path d="M40 48 L50 30 Q53 21 59 24 Q64 27 61 38 L59 46 L73 46 Q80 47 78 54 Q77 57 74 58 Q79 60 77 65 Q75 68 72 68 Q75 71 72 75 Q70 78 66 78 L41 78 Z" fill="#fff"/></g><path d="M63 58 H72 M62 68 H70" stroke="#101010" stroke-width="3" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100"><circle cx="50" cy="54" r="46" fill="#0008"/><circle cx="50" cy="50" r="46" fill="#101010"/><circle cx="50" cy="50" r="41.5" fill="${p.f}"/><circle cx="50" cy="52" r="33" fill="${p.f2}"/><circle cx="50" cy="50" r="32" fill="${p.in}"/><ellipse cx="50" cy="31" rx="24" ry="11" fill="${p.hi}" opacity=".45"/><path d="M17 42 A34 34 0 0 1 34 18" stroke="#fff" stroke-opacity=".7" stroke-width="5" fill="none" stroke-linecap="round"/><g transform="${p.down?'rotate(180 50 52) translate(0 -2)':'translate(0 -2)'}">${hand}</g></svg>`}
const PINL=[];let pinCD=0;
SFX.pin=()=>{tn(520,.07,.2,'sine',1040);tn(1040,.14,.14,'triangle',0,.06);tn(1560,.1,.07,'sine',0,.12)};
function showPin(u,k){if(!u||u.dead||!PINS[k])return;const o=PINL.find(p=>p.u===u);if(o){o.d.remove();PINL.splice(PINL.indexOf(o),1)}
  const d=document.createElement('div');d.className='pin';d.innerHTML=`<div class="pinB"><div class="pinI">${pinSvg(k)}</div></div>`;OV.appendChild(d);PINL.push({u,d,t:0,k});if(u.isMe||visibleTo(0,u))SFX.pin()}
function updPins(dt){const live=G.state==='play'||G.state==='end'||G.state==='intro';for(let i=PINL.length-1;i>=0;i--){const p=PINL[i],u=p.u;p.t+=dt;
    if(!live||p.t>2.5||u.dead){p.d.remove();PINL.splice(i,1);continue}if(!u.isMe&&!u.m.g.visible){p.d.style.display='none';continue}p.d.style.display='';
    const [sx,sy]=scr(u.x,(u.jy||0)+(u.bt==='gai'||u.bt==='riki'?3.6:3.0),u.z);p.d.style.transform=`translate(${sx}px,${sy}px)`;if(p.t>2.2&&!p.out){p.out=1;p.d.classList.add('out')}}
  pinCD=Math.max(0,pinCD-dt);const b=$('pinBtn');b.classList.toggle('cd',pinCD>0);b.style.setProperty('--cd',(pinCD/2.5*360)+'deg')}
function usePin(k){const u=G.me;if(!u||u.dead||G.state!=='play'||pinCD>0)return;$('pinTray').classList.remove('on');showPin(u,k);pinCD=2.5;
  // 味方のボットがときどき返してくれる
  if(k==='like'){const al=G.units.filter(o=>!o.isMe&&!o.dead&&!o.dummy&&o.team===u.team);if(al.length&&Math.random()<.45){const a=al[Math.floor(Math.random()*al.length)];setTimeout(()=>{if(G.state==='play')showPin(a,'like')},rr(600,1100))}}}
$('pinBtn').addEventListener('click',e=>{e.stopPropagation();if(G.state!=='play')return;$('pinTray').classList.toggle('on');tn(800,.04,.08,'square')});
for(const b of document.querySelectorAll('#pinTray button')){b.innerHTML=pinSvg(b.dataset.pin)+`<small>${PINS[b.dataset.pin].name}</small>`;b.addEventListener('click',e=>{e.stopPropagation();usePin(b.dataset.pin)})}
$('pinBtn').innerHTML=`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#ffd84d" stroke="#101010" stroke-width="7"/><circle cx="36" cy="42" r="6" fill="#101010"/><circle cx="64" cy="42" r="6" fill="#101010"/><path d="M30 60 Q50 80 70 60" stroke="#101010" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`;
addEventListener('keydown',e=>{if(e.repeat||G.state!=='play'||paused)return;if(e.code==='Digit1')usePin('like');else if(e.code==='Digit2')usePin('bad');else if(e.code==='KeyT')$('pinTray').classList.toggle('on')});
const _step3=step;step=function(dt){_step3(dt);specTick(dt);updPins(dt)};
window.__A={shoot,explode,setForm,canSwim,collide,cell,tx,tz,cx,cz,supReady,chargeStart,streamStart,streamStop,BLOMBS,killUnit,curAtk,curSup,atkRange,supRange,maxAmmo,fmtLv,bufRed,scMul,myPosts,rtLegs,inWater,LVM,walkable,los,grid:()=>GRID,bushes:()=>BUSH,unitSpeed,dmgMul,reloadOf,HYP,BUF,myKit,kitAct,bufOwn,mkUnit,hyperOn,drawChar,openChars,mkLabel,hurt:(...a)=>hurt(...a),SPEC,usePin,specNext,autoAttack,setPick:id=>{PICK=id},gadget,hyperGo,superAtk2:superAtk,buildArenaTest:id=>{buildArena(id)},rankOf,RPts,quests,questAdd,drawHome,MAPS,aiAct,buildArena,coins,level,upgrade,trophies,LSset,showMenu,G,BT,me,startMatch,step,attack,superAtk,autoAttack,cam,scene,renderer,teamGems,visibleTo,astar,MAP,GRID,endMatch,setZoom:z=>ZOOM=z,K,STK};
