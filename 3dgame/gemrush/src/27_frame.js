// ================= 毎フレームの処理 =================
const camP=new THREE.Vector3();
// 本家のカメラ：60度の見下ろし・ほぼ平行投影。横16:9で約25マスが見える（それより横長は左右に黒い帯）
const CAMF=22,CAMW=51;
const camFov=()=>VW()/VH()<1?38:CAMF;
function camDist(){const asp=VW()/VH(),port=asp<1,W=port?30:CAMW,V=port?W/asp*.62:W/Math.min(asp,16/9);return V*.5/Math.tan(cam.fov*Math.PI/360)}
let LOFF=0;function updCam(dt){const u=me();let tx0=u.x,tz0=u.z;
  if(G.state==='menu'){camP.set(0,0,LZ);const asp=VW()/VH(),back=asp<1?13:10.4;if(cam.fov!==30){cam.fov=30;cam.updateProjectionMatrix()}cam.position.set(0,2.5,LZ+back);cam.lookAt(0,asp<1?2.4:1.85,LZ);return}
  if(cam.fov!==camFov()){cam.fov=camFov();cam.updateProjectionMatrix()}
  if(G.state==='result'||!G.me){const a=performance.now()/1000*.12;tx0=Math.sin(a)*5;tz0=Math.sin(a*.7)*14}
  else if(SPEC.on){[tx0,tz0]=specCam()}
  const D=camDist()*ZOOM*(G.state==='result'?1.15:1),asp=VW()/VH(),vw=2*D*Math.tan(cam.fov*Math.PI/360)*Math.min(asp,16/9),vd=2*D*Math.tan(cam.fov*Math.PI/360)/.87;
  const mx=Math.max(0,HALFX+2.5-vw/2),mz=Math.max(0,HALFZ+3-vd/2);tx0=clamp(tx0,-mx,mx);tz0=clamp(tz0,-mz-1,mz+1);
  camP.x=lerp(camP.x,tx0,1-Math.exp(-dt*6));camP.z=lerp(camP.z,tz0,1-Math.exp(-dt*6));const sh=G.shake;G.shake=Math.max(0,G.shake-dt*1.5);
  const P=60*Math.PI/180;cam.position.set(camP.x+rr(-sh,sh)*.4,D*Math.sin(P),camP.z+D*Math.cos(P)+rr(-sh,sh)*.4);cam.lookAt(camP.x,0,camP.z-1);
  scene.fog.near=D+22;scene.fog.far=D+120}
function sepUnits(){const U=G.units;for(let i=0;i<U.length;i++)for(let j=i+1;j<U.length;j++){const a=U[i],b=U[j];if(a.dead||b.dead||a.act||b.act)continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),m=UR*1.6;
  if(d<m&&d>1e-4){const k=(m-d)/2/d;a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k;collide(a);collide(b)}}}
function updUnit(u,dt){if(u.dead){u.respT-=dt;if(u.respT<=0&&!G.over&&G.mode!=='br'){spawnAt(u);u.ai.path=[];u.ai.think=0}return}
  u.inv=Math.max(0,u.inv-dt);u.revealT-=dt;u.slowT=Math.max(0,u.slowT-dt);if(!u.streaming&&!(u.flyT>G.t)&&!(u.act&&u.act.noReload))u.ammo=Math.min(maxAmmo(u),u.ammo+dt/reloadOf(u));regen(u,dt);kitTick(u,dt);
  if(u.ccT>0){u.kx=u.kz=0;u.slowT=0;u.stunT=0}
  const ox=u.x,oz=u.z;if(u.act)updAct(u,dt);else if(u.stunT<=0){const sp=unitSpeed(u);u.x+=u.mx*sp*dt;u.z+=u.mz*sp*dt;if(BT[u.bt].moveSup){const g=Math.hypot(u.mx,u.mz)*sp*dt*BT[u.bt].moveSup*scMul(u);u.sup=Math.min(1,u.sup+g);if(u.kit.hyper&&!hyperOn(u))u.hyp=Math.min(1,u.hyp+g*BT[u.bt].hm)}if(u.slowT>0&&Math.random()<.3)GLOW.add(u.x+rr(-.4,.4),rr(.3,1.6),u.z+rr(-.4,.4),0,.5,0,.25,[.7,.9,1],.4,0)}
  if(Math.abs(u.kx)+Math.abs(u.kz)>.05){u.x+=u.kx*dt;u.z+=u.kz*dt;const k=Math.exp(-dt*7);u.kx*=k;u.kz*=k}
  if(!u.act||u.act.type!=='jump')collide(u);
  u.padCool=Math.max(0,(u.padCool||0)-dt);if(!u.act&&u.padCool<=0&&!(u.flyT>G.t)&&!(u.ghostT>G.t)){const pc=PADDIR[cell(cx(u.x),cz(u.z))];if(pc){const [x1,z1]=nearestOpen(u.x+pc[0]*10,u.z+pc[1]*10);u.act={type:'jump',t:0,T:.75,x0:u.x,z0:u.z,x1,z1,pad:true};SFX.superGo()}}
  u.vx=(u.x-ox)/Math.max(dt,1e-4);u.vz=(u.z-oz)/Math.max(dt,1e-4);u.inBush=isBush(u.x,u.z);
  if(Math.hypot(u.mx,u.mz)>.1&&G.t-u.lastAtk>.45&&!u.act)u.faceT=Math.atan2(u.mx,u.mz);else if(G.t-u.lastAtk<=.45)u.faceT=u.face;
  if(u.isMe){if(u.sup>=1&&!G.supWas){SFX.superReady();G.supWas=true;superFx(u)}if(u.sup<1)G.supWas=false}}
function poseUnit(u,dt){const m=u.m;if(u.dead){m.g.visible=false;return}
  const vis=visibleTo(0,u);m.g.visible=vis;if(!vis)return;m.g.position.set(u.x,(u.jy||0)+(u.flyT>G.t?2.6+Math.sin(G.t*3)*.15:0),u.z);if(u.streaming&&u.bt==='gigi')m.g.rotation.y+=dt*20;
  if(u.faceT!=null&&!(u.streaming&&u.bt==='gigi')){const cur=m.g.rotation.y;m.g.rotation.y=cur+angd(u.faceT-cur)*Math.min(1,dt*16)}
  const sp=Math.hypot(u.vx,u.vz);u.walkT+=dt*Math.min(sp,7)*2.3;const w=Math.min(1,sp/3);m.legL.rotation.x=Math.sin(u.walkT)*.8*w;m.legR.rotation.x=-Math.sin(u.walkT)*.8*w;
  m.torso.position.y=.5+Math.abs(Math.sin(u.walkT))*.08*w;u.atkAnim=Math.max(0,u.atkAnim-dt*5);m.torso.rotation.x=-u.atkAnim*.25;m.hR.position.z=.12+u.atkAnim*.25;
  if(u.act&&u.act.roll)m.torso.rotation.x=u.act.t*26;else if(u.act&&u.act.type==='wind')m.torso.rotation.x=.45*Math.min(1,u.act.t/u.act.T);
  u.flash=Math.max(0,u.flash-dt*6);const half=u.team===0&&(u.inBush||u.invisT>G.t)||u.ghostT>G.t;if(m.outl&&m._oh!==half){m._oh=half;for(const o of m.outl)o.visible=!half}for(const mt of m.mats){mt.emissive.setRGB(u.flash*.7,u.flash*.7,u.flash*.7);if(mt.transparent!==half){mt.transparent=half;mt.opacity=half?.5:1;mt.needsUpdate=true}}
  m.shield.visible=u.inv>0||u.redT>0||u.shield>0||(u.godT||0)>G.t||u.ccT>0||u.astT>G.t;m.shield.material.opacity=.15+Math.sin(G.t*14)*.06;m.hyp.visible=hyperOn(u);if(m.hyp.visible){m.hyp.rotation.z+=dt*6;m.hyp.material.opacity=.5+Math.sin(G.t*18)*.3}}
let hudT=0;
function updHud(dt){const u=me(),b=teamGems(0),r=teamGems(1);const t=Math.max(0,Math.ceil(G.time));$('clock').textContent=G.rule==='knockout'&&G.M.round?'ラウンド'+G.M.round:Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
  const setI=(id,v)=>{const e=$(id);if(e._v!==v){e._v=v;e.innerHTML=v==='💎'?MODEIC.gem:v==='⚽'?MODEIC.ball:v==='⭐'?MODEIC.bounty:v==='🔥'?MODEIC.hotzone:v==='💰'?MODEIC.heist:v==='🥊'?MODEIC.knockout:v}},setT=(id,v)=>{const e=$(id);if(e._t!==v){e._t=v;e.textContent=v}};
  if(G.mode==='team'&&G.rule!=='gem'&&G.rule!=='tutorial'&&G.rule!=='training'&&G.M){const h=modeHud();setI('iB',h[0]);setT('gB',h[1]);setI('iR',h[2]);setT('gR',h[3])}else{setI('iB','💎');setI('iR','💎');setT('gB',String(b));setT('gR',String(r))}
  // ジェムのカウントダウン：数字が変わるたびに大きく出し、残り5秒からは音も鳴らす
  const cd=$('cdown');if(G.cdTeam>=0&&!G.over){const n=Math.max(0,Math.ceil(G.cd)),k=G.cdTeam+':'+n;if(G._cdK!==k){G._cdK=k;cd.style.display='block';
      cd.innerHTML=`<b>${n}</b><small>${G.cdTeam===0?'青チームがリード！ 守りきれ':'赤チームがリード！ ジェムをうばえ'}</small>`;cd.className=G.cdTeam?'r':'b';void cd.offsetWidth;cd.className+=' tick';if(n<=5&&n>0)SFX.beep(false)}}
  else{cd.style.display='none';G._cdK=null}
  // ガジェット：クールダウン中は残り秒数と円のゲージ
  const hasG=u.kit&&u.kit.gad>=0,gb=$('gadBtn');gb.style.display=hasG?'':'none';
  if(hasG){const g=BT[u.bt].gad[u.kit.gad],cd=u.gadCD>0,full=gadCool(u,g),txt=cd?String(Math.ceil(u.gadCD)):'OK';if($('gadN').textContent!==txt)$('gadN').textContent=txt;
    gb.classList.toggle('off',cd);gb.style.background=cd?`conic-gradient(#1f9a4a ${(1-u.gadCD/full)*360}deg,#2f3a33 0)`:'';
    if(!cd&&u._gcd){gb.classList.remove('bump');void gb.offsetWidth;gb.classList.add('bump')}u._gcd=cd}
  // ハイパー：たまるまでは紫のゲージ、使っている間は残り秒数
  const hb=$('hypBtn');hb.style.display=u.kit&&u.kit.hyper?'':'none';
  if(u.kit&&u.kit.hyper){const on=hyperOn(u),ht=on?'ハイパー中 '+Math.ceil(u.hyperT-G.t):'ハイパー';if(hb.textContent!==ht)hb.textContent=ht;hb.classList.toggle('on',on);hb.classList.toggle('ready',!on&&u.hyp>=1&&u.sup>=1);hb.style.background=on||u.hyp>=1?'':`conic-gradient(#c264ff ${u.hyp*360}deg,#2a2f3dcc 0)`}
  // PC：右下に同じ情報を文字で出す
  {const g=hasG?BT[u.bt].gad[u.kit.gad]:null,gs=g?`<b>F</b>${g.name}${hasBuf(u,'gad')?' ✦':''}　`+(u.gadCD>0?Math.ceil(u.gadCD)+'秒':'<span class="ok">OK</span>'):'',
    hs=u.kit&&u.kit.hyper?`<b>R</b>ハイパー　`+(hyperOn(u)?'<span class="hy">使用中 '+Math.ceil(u.hyperT-G.t)+'秒</span>':u.hyp>=1?(u.sup>=1?'<span class="hy">OK</span>':'必殺技がたまったら使える'):Math.floor(u.hyp*100)+'%'):'';
    if(G._pkG!==gs){G._pkG=gs;$('pkG').innerHTML=gs}if(G._pkH!==hs){G._pkH=hs;$('pkH').innerHTML=hs}}
  {const sb=$('supBtn'),rd=supReady(u);sb.classList.toggle('ready',rd);sb.style.background=rd?'':`conic-gradient(#ffc53d ${u.sup*360}deg,#2a2f3dcc 0)`;
    let bd=sb.querySelector('.uses');if(!bd){bd=document.createElement('em');bd.className='uses';sb.appendChild(bd)}const n=(u.supLeft||0)>0?'×'+(u.supLeft+(u.sup>=1?1:0)):u.puppetT>G.t?'もどる':'';if(bd.textContent!==n)bd.textContent=n;bd.style.display=n?'':'none'}
  {const ph=$('pcHint'),f=G.t>14;if(ph._f!==f){ph._f=f;ph.classList.toggle('fade',f)}}
  if(noteT>0){noteT-=dt;if(noteT<=0)$('note').textContent=''}
  if(G.mode==='br'){const n=G.units.filter(o=>!o.dead).length;$('alive').textContent=n;$('myPw').textContent=u.pw||0;$('alive2').textContent=n;$('myPw2').textContent=u.pw||0}
  if(bigT>0){bigT-=dt;if(bigT<=0)$('big').style.display='none'}
  stickEl('stL',STK.L);stickEl('stA',STK.A);stickEl('stS',STK.S)}
function playerInput(dt){const u=me();if(!u||u.dead)return;let mx=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0),mz=(K.KeyS||K.ArrowDown?1:0)-(K.KeyW||K.ArrowUp?1:0);
  if(STK.L){const v=stickVec(STK.L);if(v.d>8){mx=v.dx/Math.max(v.d,SR);mz=v.dy/Math.max(v.d,SR)}}const l=Math.hypot(mx,mz);u.mx=l>1?mx/l:mx;u.mz=l>1?mz/l:mz;
  const hold=curAtk(u).hold,mAng=mouse.has?Math.atan2(mouse.x-u.x,mouse.z-u.z):u.face;
  if(hold==='stream'){if(mouse.down&&mouse.has){u.streamAng=mAng;streamStart(u)}else if(STK.A){const v=stickVec(STK.A);if(v.d>=16){u.streamAng=Math.atan2(v.dx,v.dy);streamStart(u)}}else if(!K.Space)streamStop(u)}
  else if(hold==='charge'){if(mouse.down&&mouse.has)chargeStart(u);else if(STK.A){const v=stickVec(STK.A);if(v.d>=16)chargeStart(u)}}
  else if(mouse.down&&mouse.has)attack(u,mAng,Math.hypot(mouse.x-u.x,mouse.z-u.z));
  // ジャネットの空：さわらないと前へまっすぐ飛ぶ（ハイパーなら自由に動ける）
  if(u.flyT>G.t&&!u.flyH){if(Math.hypot(u.mx,u.mz)>.2)u.flyDir=[u.mx,u.mz];else{u.mx=u.flyDir[0];u.mz=u.flyDir[1]}}
  // ねらいの表示
  if(STK.S){const v=stickVec(STK.S);if(v.d>=16)showAim(u,Math.atan2(v.dx,v.dy),v.m,true);else showAim(null)}
  else if(STK.A){const v=stickVec(STK.A);if(v.d>=16)showAim(u,Math.atan2(v.dx,v.dy),v.m,false);else showAim(null)}
  else if(mouse.has&&!document.body.classList.contains('touch')){const d=Math.hypot(mouse.x-u.x,mouse.z-u.z);showAim(u,Math.atan2(mouse.x-u.x,mouse.z-u.z),d/atkRange(u),false)}
  else showAim(null)}
function step(dt){updLobby(dt);{const t=performance.now()/1000;waterTex.offset.set(t*.03,t*.012);for(const b of BUSHL){b.rotation.z=Math.sin(t*1.5+b.userData.ph)*.035;b.rotation.x=Math.cos(t*1.2+b.userData.ph)*.03}}POISON.material.uniforms.T.value=performance.now()/1000;FX.upd(dt);GLOW.upd(dt);updRings(dt);updFade(dt);updDN(dt);waterMat.opacity=.78+Math.sin(performance.now()/600)*.05;
  if(G.state==='vs'){G.vsT-=dt;if(G.vsT<=0)vsEnd()}
  if(G.state==='intro'){const n=Math.ceil(G.introT-.2);G.introT-=dt;if(n!==G._n){G._n=n;if(n>0){big(String(n),.9);SFX.beep(false)}else{big('ファイト！',.9,'#ffd84d');SFX.beep(true)}}if(G.introT<=0)G.state='play'}
  if(NET.view){if(G.state==='play'||G.state==='end')netView(dt)}
  else if(G.state==='play'||G.state==='end'){const sdt=dt*(G.over?.3:1);G.t+=sdt;updTimers();if(!G.over)playerInput(sdt);else showAim(null);
    for(const u of G.units)if(!u.isMe&&!u.dead&&!G.over&&!u.dummy)aiAct(u,sdt);else if(u.dummy){u.mx=u.mz=0}else if(!u.isMe||G.over){u.mx=u.mz=0}
    for(const u of G.units)updUnit(u,sdt);sepUnits();asteroidTick();updBullets(sdt);updLobs(sdt);updItems(sdt);updTurrets(sdt);updMines(sdt);updBlombs(sdt);updHeads(sdt);updPets(sdt);updZones(sdt);oilTick();if(NET.on)netStep(sdt);
    if(!G.over&&G.rule==='tutorial')tutStep(sdt);else if(!G.over&&G.mode==='team'&&G.rule!=='gem')modeStep(sdt);
    if(!G.over&&G.rule==='gem'){const b=teamGems(0),r=teamGems(1);let lead=-1;if(b>=10&&b>r)lead=0;else if(r>=10&&r>b)lead=1;if(lead!==G.cdTeam){G.cdTeam=lead;G.cd=15;if(lead>=0)note(lead===0?'青チームがリード！ 15秒守りきろう':'赤チームがリード！ ジェムを取り返そう',2.5)}
      if(lead>=0){G.cd-=sdt;if(G.cd<=0)endMatch(lead)}G.time-=sdt;if(G.time<=0)endMatch(b>r?0:r>b?1:-1)}
    if(!G.over&&G.mode==='br'){const R0=Math.hypot(HALFX,HALFZ)+2,k=clamp((G.t-25)/110,0,1);G.safeR=lerp(R0,4.5,k);if(G.t>20&&!G._pw){G._pw=1;note('もうすぐ毒の雲がせまってくる！',2.5)}
      POISON.material.uniforms.R.value=G.safeR;G.poisonT-=sdt;if(G.poisonT<=0){G.poisonT=.5;for(const u of G.units)if(!u.dead&&Math.hypot(u.x,u.z)>G.safeR)hurt(u,(650+G.t*6)*.5,null,true)}
      const alive=G.units.filter(u=>!u.dead);if(G.me.dead){if(!G.brDead){G.brDead=1;G.place=G.me.place||alive.length+1;$('big').style.display='none'}if(alive.length<=1||G.specExit)endMatch(-1)}else if(alive.length<=1){G.place=1;endMatch(0)}}
    if(G.state==='end'){G.endT-=dt;if(G.endT<=0)showResult()}}
  if(G.state==='intro'||G.state==='play'||G.state==='end'){for(const u of G.units){poseUnit(u,dt);updLabel(u)}for(const t of G.turrets)updLabel(t);for(const h of G.heads)updLabel(h);for(const q of G.pets)updLabel(q);for(const s of G.safes)updLabel(s);updHud(dt);
    const u=me(),keys=new Set();if(u&&!u.dead&&u.inBush){for(let r=cz(u.z)-2;r<=cz(u.z)+2;r++)for(let c=cx(u.x)-2;c<=cx(u.x)+2;c++)if(cell(c,r)==='B'&&Math.hypot(tx(c)-u.x,tz(r)-u.z)<3.2)keys.add(c+','+r)}setBushSee(keys)}
  updCam(dt);sun.position.set(camP.x-16,40,camP.z+22);sun.target.position.set(camP.x,0,camP.z);
  FX.mat.uniforms.scale.value=GLOW.mat.uniforms.scale.value=VH()*renderer.getPixelRatio()*.5/Math.tan(cam.fov*Math.PI/360)}

