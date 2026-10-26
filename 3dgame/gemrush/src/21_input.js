// ================= 操作 =================
const K={};let mouse={x:0,z:0,has:false,down:false,sup:false};
const me=()=>G.me||G.units[0]||{x:0,z:0};
addEventListener('keydown',e=>{initAudio();if(e.code==='KeyP'||e.code==='Escape'){if(G.state==='play'||G.state==='intro')setPause(!paused);return}
  if(G.state==='menu'&&(e.code==='Enter'||e.code==='Space')&&!document.querySelector('.dim.on')&&$('boot').style.display==='none'){e.preventDefault();startMatch();return}
  if(G.state==='result'&&e.code==='Enter'){startMatch();return}
  K[e.code]=true;if(/^(Arrow|Space)/.test(e.code))e.preventDefault();if(e.repeat||paused)return;
  if(e.code==='KeyF'){const u=me();gadget(u,mouse.has&&!document.body.classList.contains('touch')?Math.atan2(mouse.x-u.x,mouse.z-u.z):null);return}if(e.code==='KeyR'){hyperGo(me());return}
  if(e.code==='Space')autoAttack(false);else if(e.code==='KeyE'||e.code==='KeyQ'){if(mouse.has&&!document.body.classList.contains('touch')){const u=me();superAtk(u,Math.atan2(mouse.x-u.x,mouse.z-u.z),Math.hypot(mouse.x-u.x,mouse.z-u.z))}else autoAttack(true)}});
addEventListener('keyup',e=>{K[e.code]=false});
addEventListener('blur',()=>{for(const k in K)K[k]=false;mouse.down=false;STK.L=STK.A=STK.S=null});
// 近くの見えている敵を自動でねらう
function autoTarget(u,range){let best=null,bd=1e9;for(const o of G.units){if(o.team===u.team||!visibleTo(u.team,o))continue;const d=Math.hypot(o.x-u.x,o.z-u.z);if(d<bd&&d<range*1.15){bd=d;best=o}}return best}
function autoAttack(sup){const u=me();if(u.dead)return;const rng=sup?supRange(u):atkRange(u),t=autoTarget(u,rng);
  const ang=t?Math.atan2(t.x-u.x,t.z-u.z):u.face,d=t?Math.hypot(t.x-u.x,t.z-u.z):rng*.7;return sup?superAtk(u,ang,d,true):attack(u,ang,d)}
// 画面の座標（横画面の回転を考える）
const P=e=>ROT?{x:e.clientY,y:innerWidth-e.clientX}:{x:e.clientX,y:e.clientY};
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-1),_hit=new THREE.Vector3();
function groundAt(px,py){ray.setFromCamera({x:px/VW()*2-1,y:-(py/VH()*2-1)},cam);return ray.ray.intersectPlane(plane,_hit)?[_hit.x,_hit.z]:null}
// スティック：左半分＝移動、右半分＝攻撃（なぞって離すと撃つ・タップで自動）、必殺技ボタン
const STK={L:null,A:null,S:null};const SR=54;
function stickEl(id,s){const el=$(id);if(!s){el.classList.remove('on');return}el.classList.add('on');el.style.left=s.ox+'px';el.style.top=s.oy+'px';const dx=s.x-s.ox,dy=s.y-s.oy,d=Math.hypot(dx,dy),k=d>SR?SR/d:1;el.firstChild.style.transform=`translate(${dx*k}px,${dy*k}px)`}
const stickVec=s=>{const dx=s.x-s.ox,dy=s.y-s.oy,d=Math.hypot(dx,dy);return{dx,dy,d,m:Math.min(1,d/SR)}};
const R=$('rot');
R.addEventListener('pointerdown',e=>{initAudio();if(G.state==='menu'&&!e.target.closest('button,.dim,.bs,input,label,.dPop,#result')){if($('menu').classList.contains('on')&&$('menu').style.visibility!=='hidden')lobbyEmote();return}if(e.target.closest('button,.scr,#pause'))return;const p=P(e);
  if(e.pointerType!=='mouse'){document.body.classList.add('touch');if(G.state!=='play'&&G.state!=='intro')return;e.preventDefault();
    if(p.x<VW()*.45&&!STK.L)STK.L={id:e.pointerId,ox:p.x,oy:p.y,x:p.x,y:p.y};else if(!STK.A)STK.A={id:e.pointerId,ox:p.x,oy:p.y,x:p.x,y:p.y,t:performance.now()};
    try{R.setPointerCapture(e.pointerId)}catch(_){};return}
  if(G.state!=='play')return;const g=groundAt(p.x,p.y);if(g){mouse.x=g[0];mouse.z=g[1];mouse.has=true}
  if(e.button===2){const u=me();superAtk(u,Math.atan2(mouse.x-u.x,mouse.z-u.z),Math.hypot(mouse.x-u.x,mouse.z-u.z))}else if(e.button===0)mouse.down=true});
R.addEventListener('pointermove',e=>{const p=P(e);if(e.pointerType==='mouse'){if(!document.body.classList.contains('touch')){const g=groundAt(p.x,p.y);if(g){mouse.x=g[0];mouse.z=g[1];mouse.has=true}}return}
  for(const k of['L','A','S'])if(STK[k]&&STK[k].id===e.pointerId){STK[k].x=p.x;STK[k].y=p.y}});
const relStick=e=>{const u=me();if(e.pointerType==='mouse'){if(mouse.down&&u&&!u.dead&&curAtk(u).hold==='charge'&&u.charging&&mouse.has)attack(u,Math.atan2(mouse.x-u.x,mouse.z-u.z),Math.hypot(mouse.x-u.x,mouse.z-u.z));if(u)streamStop(u);mouse.down=false;return}
  if(STK.L&&STK.L.id===e.pointerId)STK.L=null;
  for(const k of['A','S']){const s=STK[k];if(!s||s.id!==e.pointerId)continue;STK[k]=null;const v=stickVec(s),sup=k==='S';
    const hold=!sup&&curAtk(u).hold;if(hold==='stream'){const was=u.streaming;streamStop(u);if(v.d<16&&!was)autoAttack(false);continue}
    if(v.d<16)autoAttack(sup);else{const rng=sup?supRange(u):atkRange(u),ang=Math.atan2(v.dx,v.dy);sup?superAtk(u,ang,v.m*rng):attack(u,ang,v.m*rng)}}};
R.addEventListener('pointerup',relStick);R.addEventListener('pointercancel',relStick);
R.addEventListener('contextmenu',e=>e.preventDefault());
$('gadBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();initAudio();const u=me(),t=autoTarget(u,atkRange(u)*1.2);gadget(u,t?Math.atan2(t.x-u.x,t.z-u.z):null)});
$('hypBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();hyperGo(me())});
$('supBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();initAudio();document.body.classList.add('touch');const p=P(e),r=$('supBtn').getBoundingClientRect();
  const c=ROT?{x:(r.top+r.bottom)/2,y:innerWidth-(r.left+r.right)/2}:{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};STK.S={id:e.pointerId,ox:c.x,oy:c.y,x:p.x,y:p.y};try{R.setPointerCapture(e.pointerId)}catch(_){}});
// ズーム（ホイール・2本指）
let ZOOM=1,pinch=null;
R.addEventListener('wheel',e=>{e.preventDefault();ZOOM=clamp(ZOOM+e.deltaY*.0008,.75,1.5)},{passive:false});

// ---- ねらいの表示（地面に出る白い形） ----
const aimMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide}),aimMatS=aimMat.clone();aimMatS.color.setHex(0xffd23d);aimMatS.opacity=.4;
const AIM={};
function aimMesh(kind,arc){const key=kind+arc;if(AIM[key])return AIM[key];let g;
  if(kind==='sector'){g=new THREE.CircleGeometry(1,28,Math.PI/2-arc/2,arc);g.rotateX(Math.PI/2)}
  else if(kind==='strip'){g=new THREE.PlaneGeometry(1,1);g.translate(0,.5,0);g.rotateX(Math.PI/2)}
  else{g=new THREE.RingGeometry(.86,1,40);g.rotateX(-Math.PI/2);const inner=new THREE.CircleGeometry(.86,40);inner.rotateX(-Math.PI/2)}
  const m=new THREE.Mesh(g,aimMat);m.visible=false;m.renderOrder=2;scene.add(m);return AIM[key]=m}
let aimShown=[];const put0=(u,mat)=>{const m=aimMesh('circle',0);m.material=mat;m.visible=true;m.position.set(u.x,.07,u.z);m.scale.set(1.6,1,1.6);aimShown.push(m)};
function showAim(u,ang,m,sup){for(const o of aimShown)o.visible=false;aimShown=[];if(!u||u.dead)return;const spec=sup?curSup(u):curAtk(u),type=spec.type,rng=sup?supRange(u):atkRange(u),mat=sup?aimMatS:aimMat;
  if(['booster','return','smoke','strong','split','merge','stalk','swamp','caustic','letsgo','mecha','fly','spin','signal'].includes(type)){const rr2=type==='swamp'||type==='caustic'||type==='letsgo'||type==='signal'?spec.rad:type==='spin'?rng:1.6;
    const m2=aimMesh('circle',0);m2.material=mat;m2.visible=true;m2.position.set(u.x,.07,u.z);m2.scale.set(rr2,1,rr2);aimShown.push(m2);return}
  const put=(mesh,x,z,sx,sz,rot)=>{mesh.material=mat;mesh.visible=true;mesh.position.set(x,.07,z);mesh.scale.set(sx,1,sz);mesh.rotation.y=rot||0;aimShown.push(mesh)};
  if(type==='bat'||type==='hug'||type==='steel'){put(aimMesh('sector',spec.arc),u.x,u.z,rng,rng,ang);return}
  if(type==='focus'){const k=focusK(u),arc=lerp(spec.a0,spec.a1,k);put(aimMesh('sector',arc),u.x,u.z,rng,rng,ang);return}
  if(type==='arcwave'||type==='encore'||type==='spray'||type==='cashback'||type==='coins'){put(aimMesh('sector',(spec.spread||.6)+.1),u.x,u.z,rng,rng,ang);return}
  if(['kick','broom','mark','swipe','arrow','tax','bounce','trick','bolts','mbolts','balloon','steam','chainkick','collect','ghost','spitball','arrows','blomb','flame','bomber','spooky'].includes(type)){const len=['trick','bounce','chainkick','ghost','spitball','spooky'].includes(type)?rng:rayWall(u.x,u.z,Math.sin(ang),Math.cos(ang),rng);
    put(aimMesh('strip',0),u.x,u.z,type==='broom'?1.1:type==='collect'||type==='chainkick'?1.4:type==='spitball'?1.1:.6,len,ang);if(type==='arrow'&&u.charging){aimShown[aimShown.length-1].scale.x=.3+(u.charge||0)*.9}return}
  if(type==='punch'||type==='hammer'||type==='quake'){const k=type==='quake'&&hyperOn(u)?1.3:1;put(aimMesh('sector',spec.arc*k+(type==='punch'?0:.3)),u.x,u.z,rng,rng,ang)}
  else if(type==='spread'||type==='shell'||type==='double'||type==='scrap'||type==='blades'){const k=type==='shell'&&hyperOn(u)?1.33:1;put(aimMesh('sector',(spec.spread+.12)*k),u.x,u.z,rng*k,rng*k,ang)}
  else if(type==='wave'||type==='rocket'||type==='chain'||type==='dagger'||type==='charge'||type==='encore'||type==='needle'||type==='roll'||type==='snipe'){const wall=type==='charge'||type==='encore';const len=wall?rng:rayWall(u.x,u.z,Math.sin(ang),Math.cos(ang),rng);put(aimMesh('strip',0),u.x,u.z,type==='encore'?3.2:type==='wave'?(spec.r||.6)*2:type==='charge'||type==='roll'?1.6:type==='snipe'?.45:.7,len,ang)}
  else if(type==='burst'||type==='barrage'||type==='cannon'||type==='split'||type==='bats'||type==='dash'){const wall=type==='barrage'||type==='bats'||type==='dash';const len=wall?rng:rayWall(u.x,u.z,Math.sin(ang),Math.cos(ang),rng);put(aimMesh('strip',0),u.x,u.z,type==='bats'?1.9:type==='barrage'?(hyperOn(u)?2.6:1.1):type==='dash'?1.4:.7,len,ang)}
  else{const d=clamp(m*rng,2,rng),x=u.x+Math.sin(ang)*d,z=u.z+Math.cos(ang)*d,rad=spec.rad||1.2;put(aimMesh('circle',0),x,z,rad,rad,0);put(aimMesh('strip',1),u.x,u.z,.18,d,ang)}}

