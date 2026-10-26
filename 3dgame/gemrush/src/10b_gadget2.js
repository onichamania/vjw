// ================= ガジェット（新しく足したキャラ） =================
// ---- ジジ ----
GAD.strings=u=>{u.strT=G.t+4;ring(u.x,u.z,TL(5.43),0xffc0e0,.4)};
GAD.tent=(u,g,ang,C)=>{addFire(u,u.x,u.z,TL(2),0,3,{col:0xff8ad8,pc:[1,.7,.9],ally:'invis'});const t=new THREE.Mesh(new THREE.ConeGeometry(1.2,1.6,8),MC(0xff5fa2));t.position.set(u.x,.8,u.z);scene.add(t);setTimeoutG(3,()=>scene.remove(t))};
// ---- ジャネット ----
GAD.bass=(u,g,ang,C)=>{for(const t of G.turrets.slice())if(t.speaker&&t.src===u)killTurret(t);const gg=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(.8,1.1,.7),MC(0x2b2d36));b.position.y=.55;b.castShadow=true;gg.add(b);
  for(const y of[.35,.8]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.05,14),MC(0xff7ab8));c.rotation.x=Math.PI/2;c.position.set(0,y,.36);gg.add(c)}
  const [x,z]=nearestOpen(u.x+C.dx,u.z+C.dz);gg.position.set(x,0,z);scene.add(gg);const hp=Math.round(1000*u.dm);
  const t={isTurret:true,speaker:true,bt:'turret',name:'スピーカー',team:u.team,src:u,x,z,hp,maxHp:hp,rad:.7,cool:0,decay:100*u.dm,dead:false,gems:0,pw:0,isMe:false,m:{g:gg},revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm,sup:0,dmg:0,tk:0,
    tick:(t2,dt)=>{t2.tk-=dt;if(t2.tk>0)return;t2.tk=.5;ring(t2.x,t2.z,TL(8),0xff7ab8,.12);for(const o of targets())if(!o.dead&&o.team!==t2.team&&Math.hypot(o.x-t2.x,o.z-t2.z)<TL(8))hurt(o,110*.5*t2.dm,t2.src,true,{sc:0})}};
  mkLabel(t);G.turrets.push(t)};
GAD.backstage=u=>{u.backstage=true;return'hold'};
// ---- スクイーク ----
GAD.windup=u=>{u.windup=true;return'hold'};
GAD.residue=u=>{u.residue=true;return'hold'};
// ---- ファング ----
GAD.cornfu=(u,g,ang,C)=>{for(let i=0;i<8;i++){const a=Math.PI/2+i*DEG(50),[x,z]=nearestOpen(u.x+Math.sin(a)*TL(5),u.z+Math.cos(a)*TL(5));
    lob(u,x,z,{T:.9,kind:'bomb',noMark:true,onLand:L=>{for(let k=0;k<3;k++){const b=k/3*TAU+rr(0,1),px=L.x1+Math.sin(b)*TL(2)*rr(.5,1),pz=L.z1+Math.cos(b)*TL(2)*rr(.5,1);if(!blockMove(cx(px),cz(pz)))addMine(u,px,pz,544*C.D,0,{kind:'corn',rad:TL(1.56),life:2,arm:.15})}}})}};
GAD.roundhouse=(u,g,ang,C)=>{u.spinT=.4;ring(u.x,u.z,TL(2.33),0xffd060,.35);for(const t of G.units)if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<TL(2.33)&&los(u.x,u.z,t.x,t.z))hurt(t,0,u,true,{stun:.5})};
// ---- アッシュ ----
GAD.chillpill=u=>{if(!(u.rage>0))return false;healU(u,u.maxHp*.3*u.rage,u);u.rage=0;burst(u.x,1.4,u.z,16,[.6,.9,1],3,.6,.5,true)};
GAD.banana=u=>{if(u.hp<2)return false;u.hp=Math.max(1,u.hp-u.hp*.05);u.rage=Math.min(1,(u.rage||0)+.4);u.rageT=G.t};
// ---- R-T ----
GAD.outofline=u=>{if(u.sup>=1)return false;u.sup=1};
GAD.hacks=(u,g,ang,C)=>{const ms=G.units.filter(t=>!t.dead&&t.team!==u.team&&t.mark&&t.mark.by===u&&t.mark.t>G.t);if(!ms.length)return false;for(const t of ms){t.mark=null;hurt(t,BT.rt.atk.dmg*LVM(u.lv),u,true,{mark:true});burst(t.x,2,t.z,12,[1,.3,.3],3,.5,.4,true)}};
// ---- アリー ----
GAD.gators=u=>{u.gatorsN=1;return'hold'};
GAD.coldblood=u=>{if(!G.units.some(o=>!o.dead&&o.team!==u.team&&visibleTo(u.team,o)))return false;u.enrT=Math.max(u.enrT||0,G.t+4)};
// ---- アンジェロ ----
GAD.stinging=(u,g,ang,C)=>{u.charging=false;u.charge=0;for(const t of G.units)if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<TL(2.33)){const d=330*C.D;hurt(t,d,u,false);healU(u,d,u)}
  const dir=Math.hypot(u.mx,u.mz)>.1?Math.atan2(u.mx,u.mz):ang,[x1,z1]=nearestOpen(u.x+Math.sin(dir)*TL(6),u.z+Math.cos(dir)*TL(6));u.act={type:'jump',t:0,T:1,x0:u.x,z0:u.z,x1,z1}};
GAD.fletcher=u=>{u.fletcher=true;return'hold'};
// ---- EMZ ----
GAD.friendzoner=(u,g,ang,C)=>{const hit=new Set();for(let i=-2;i<=2;i++){const off=i*.6;shoot(u,ang,PS(1500),TL(5),250*C.D,.5,[.8,.5,1],{pierce:true,hit,onHit:(t,b)=>{if(t.isTurret||t.isSafe||t.isHead||t.ccT>0)return;const k=C.BG?14:10;t.kx=b.dx*k;t.kz=b.dz*k;
    if(C.BG)setTimeoutG(.15,()=>{if(!t.dead&&blockMove(cx(t.x+b.dx*1),cz(t.z+b.dz*1)))hurt(t,0,u,true,{stun:1})})}},u.x+C.dx*.6-C.dz*off,u.z+C.dz*.6+C.dx*off)}SFX.shot('ice')};
GAD.acidspray=u=>{u.acid=true;return'hold'};
// ---- ビビ ----
GAD.vitamin=(u,g,ang,C)=>{u.vitT=G.t+4;if(C.BG){u.hrT=BT.bibi.atk.hr;u.vitB=true}};
GAD.sticky=(u,g,ang,C)=>{const [t,dd]=C.en(),d=t&&dd<TL(5.67)?dd:TL(4),an=t&&dd<TL(5.67)?Math.atan2(t.x-u.x,t.z-u.z):ang;
  lob(u,u.x+Math.sin(an)*d,u.z+Math.cos(an)*d,{rad:TL(2.5),T:.6,kind:'blob',onLand:L=>{const q=addFire(u,L.x1,L.z1,TL(2.5),0,3.9,{col:0xff8ac0,pc:[1,.6,.85],slowAura:C.BG?1:.1,slowP:.2});if(C.BG)q.onTick=q2=>{q2.slowP=q2.t>3?.4:q2.t>2?.3:.2}}})};
// ---- ボウ ----
GAD.totem=(u,g,ang,C)=>{for(const t of G.turrets.slice())if(t.totem&&t.src===u)killTurret(t);const gg=new THREE.Group();for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.28,.3,.4,8),MC([0xc9563a,0x3a8ac9,0xe0b030][i]));b.position.y=.2+i*.4;b.castShadow=true;gg.add(b)}
  const rad=TL(C.BG?7:5.33),rg=new THREE.RingGeometry(rad-.15,rad,48);rg.rotateX(-Math.PI/2);const ring3=new THREE.Mesh(rg,MB(C.BG?0xffd24d:0x8affb0,{transparent:true,opacity:.4,depthWrite:false}));ring3.position.y=.05;gg.add(ring3);
  const [x,z]=nearestOpen(u.x,u.z);gg.position.set(x,0,z);scene.add(gg);const hp=Math.round(2000*u.dm);const t={isTurret:true,totem:true,bt:'turret',name:'トーテム',team:u.team,src:u,x,z,hp,maxHp:hp,rad:.6,effR:rad,cool:0,decay:100*u.dm,dead:false,gems:0,pw:0,isMe:false,m:{g:gg},revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm,sup:0,dmg:0,tick:()=>{}};
  mkLabel(t);G.turrets.push(t)};
GAD.tripwire=(u,g,ang,C)=>{const ms=G.mines.filter(q=>q.fox&&q.src===u);if(!ms.length)return false;for(const q of ms){const dx=q.x-u.x,dz=q.z-u.z,L=Math.hypot(dx,dz)||1;shoot(u,Math.atan2(dx,dz),PS(5000),L,720*C.D,.25,[1,.85,.4],{pierce:true,noWall:true,isSup:true,stun:hasSP(u,'snare')?2:0});
    if(C.BG)q.rad*=2;q.trig=Math.min(q.trig==null?L/PS(5000):q.trig,L/PS(5000))}};
// ---- コレット ----
GAD.naah=(u,g,ang,C)=>{if(u.ammo<1)return false;u.ammo-=1;shoot(u,ang,PS(4000),TL(8.33),0,.3,[1,.6,.85],{pierce:C.BG,noWall:C.BG,onHit:t=>{if(G.units.includes(t)&&!(t.ccT>0)){t.charmT=G.t+.5;t.charmBy=u}}});SFX.shot('snipe')};
GAD.gotcha=(u,g,ang,C)=>{if(u.ammo<1)return false;u.ammo-=1;const a=BT.colette.atk;shoot(u,ang,a.speed,TL(8.33),1,a.r,[1,.3,.5],{dmgFn:t=>taxDmg(u,t,a.pct,a.min,a.min),onHit:(t,b,d)=>{const h=d*.8;if(C.BG)overheal(u,h,1000,.333);else healU(u,h,u)}});SFX.shot('snipe');
  u.gotN=(u.gotN||0)+1;if(u.gotN<3){u.reGad=uu=>{if(uu.ammo<1)return false;return GAD.gotcha(uu,g,uu.faceT,Object.assign({},C,{dx:Math.sin(uu.faceT),dz:Math.cos(uu.faceT)}))};return'hold'}u.gotN=0;u.gadCD=gadCool(u,g)};
// ---- グリフ ----
GAD.piggy=(u,g,ang,C)=>{const [t,dd]=C.en(),d=Math.min(TL(7.33),t&&dd<TL(7.33)?dd:TL(5)),an=t&&dd<TL(7.33)?Math.atan2(t.x-u.x,t.z-u.z):ang;
  lob(u,u.x+Math.sin(an)*d,u.z+Math.cos(an)*d,{T:.6,kind:'piggy',rad:TL(2),onLand:L=>{const pg=new THREE.Mesh(GEO.piggy,GMAT.piggy);pg.position.set(L.x1,.4,L.z1);scene.add(pg);const k=C.BG?1.5:1;
    setTimeoutG(2.5,()=>{scene.remove(pg);explode(L.x1,L.z1,{rad:TL(2)*(C.BG?1.3:1),dmg:800*C.D*k,team:u.team,src:u,knock:TL(1.5),breakWalls:true,sc:C.BG?0:.2,big:true})})}})};
GAD.coinshower=(u,g,ang,C)=>{const [t,dd]=C.en(),d=Math.min(TL(7.33),t&&dd<TL(7.33)?dd:TL(5)),an=t&&dd<TL(7.33)?Math.atan2(t.x-u.x,t.z-u.z):ang;
  const q=addFire(u,u.x+Math.sin(an)*d,u.z+Math.cos(an)*d,TL(2.4),300*C.D,6,{col:0xffd24d,pc:[1,.9,.3],tickT:1,isSup:false});if(C.BG){q.grow=TL(4);q.growR=TL(1.6)/6}};
// ---- リコ ----
GAD.multilauncher=(u,g,ang,C)=>{for(const t of G.turrets.slice())if(t.vend&&t.src===u)killTurret(t);const gg=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(1,1.6,.8),MC(0xd84040));b.position.y=.8;b.castShadow=true;gg.add(b);
  const w=new THREE.Mesh(new THREE.BoxGeometry(.7,.8,.05),MC(0x9fe0ff));w.position.set(0,1,.41);gg.add(w);const [x,z]=nearestOpen(u.x+C.dx*1.6,u.z+C.dz*1.6);gg.position.set(x,0,z);gg.rotation.y=ang;scene.add(gg);const hp=Math.round(u.maxHp*.6667);
  const t={isTurret:true,vend:true,bt:'turret',name:'自動販売機',team:u.team,src:u,x,z,hp,maxHp:hp,rad:.9,cool:0,dead:false,gems:0,pw:0,isMe:false,m:{g:gg},revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm,sup:0,dmg:0,extra:0,tick:()=>{},
    onDie:t2=>{const n=16+(t2.extra||0);for(let i=0;i<n;i++)shoot(t2.src,i/n*TAU,PS(4891),TL(11.67),400*dmgMul(t2.src),.22,[1,1,.75],{pierce:true,bounce:true,isSup:true},t2.x,t2.z)}};
  mkLabel(t);G.turrets.push(t)};
GAD.multiball=(u,g,ang,C)=>{const sl=C.BG?1.5:0,dm=900*C.D,sp=b=>{const ba=Math.atan2(b.dx,b.dz);for(const o of[-.5,0,.5])shoot(u,ba+Math.PI+o,PS(3478),TL(4),dm,.22,[1,1,.8],{bounce:true,slow:sl,hit:new Set(b.hit)},b.x-b.dx*.3,b.z-b.dz*.3)};
  shoot(u,ang,PS(3478),atkRange(u),dm,.45,[1,1,.8],{slow:sl,onHit:(t,b)=>{if(G.units.includes(t))sp(b)},onEnd:(b,wall)=>{if(wall)sp(b)}});SFX.shot('snipe')};
// ---- マックス ----
GAD.phase=(u,g,ang,C)=>{const dash=dir=>{u.act={type:'mdash',t:0,t0:G.t,T:.2,dx:Math.sin(dir),dz:Math.cos(dir),spd:TL(3.33)/.2,hit:new Set(),dmg:0};u.godT=G.t+.5};dash(ang);
  if(C.BG){u.reGad=uu=>{if(G.t-uu.phT>2)return false;dash(uu.faceT!=null&&Math.hypot(uu.mx,uu.mz)<.1?uu.faceT:Math.atan2(uu.mx,uu.mz));uu.gadCD=gadCool(uu,g)};u.phT=G.t;setTimeoutG(2,()=>{if(u.reGad&&G.t-u.phT>=2){u.reGad=null;u.gadCD=gadCool(u,g)}});return'hold'}};
GAD.sneakers=(u,g,ang,C)=>{const [x,z]=nearestOpen(u.x+C.dx*TL(2),u.z+C.dz*TL(2));const m=new THREE.Mesh(new THREE.OctahedronGeometry(.4),MB(0xffd24d));m.position.set(x,1,z);scene.add(m);u.snk={x,z,hp:u.hp,m,BG:C.BG};u.snkT=G.t+3;u.reGad=uu=>{maxBlink(uu)};return'hold'};
function maxBlink(u){const s=u.snk;u.snkT=0;u.reGad=null;if(!s)return;u.snk=null;scene.remove(s.m);u.gadCD=gadCool(u,BT.max.gad[1]);if(u.dead)return;burst(u.x,1,u.z,14,[1,.85,.3],3,.5,.4,true);u.x=s.x;u.z=s.z;collide(u);const h=Math.max(0,s.hp-u.hp);if(h>0){u.hp=Math.min(u.maxHp,s.hp);dmgNum(u,'+'+Math.round(h),'heal')}
  if(s.BG){u.ammo=maxAmmo(u);for(const o of G.units)if(!o.dead&&o.team===u.team&&o!==u&&Math.hypot(o.x-u.x,o.z-u.z)<TL(3))healU(o,h,u)}burst(u.x,1,u.z,14,[1,.85,.3],3,.5,.4,true)}
// ---- メグ ----
GAD.volts=(u,g,ang,C)=>{if(u.form!=='mech')return false;u.voltT=G.t+(C.BG?6:5);u.voltB=C.BG};
GAD.repurpose=(u,g,ang,C)=>{if(u.form!=='mech')return false;const dm=800*C.D;setForm(u,'meg',true);u.hp=clamp(u.megHp||u.maxHp,1,u.maxHp);u.sup=0;u.repT=G.t+6;if(hasSP(u,'forcefield'))buf(u,'red','ff',.7,5);
  shoot(u,ang,PS(3000),TL(6),dm,.9,[1,.55,.25],{pierce:true,isSup:true,onEnd:b=>explode(b.x,b.z,{rad:TL(2),dmg:dm,team:u.team,src:u,knock:TL(1.5),isSup:true}),
    onHit:null});if(C.BG){let k=0;const tr=()=>{if(k>10)return;const px=u.x+C.dx*TL(6)*k/10,pz=u.z+C.dz*TL(6)*k/10;k++;addFire(u,px,pz,TL(.7),dm*.3/3,3,{tickT:1});setTimeoutG(.04,tr)};tr()}};
// ---- アンバー ----
GAD.firestarters=(u,g,ang,C)=>{const d=TL(4.33),[x,z]=nearestOpen(u.x+C.dx*d,u.z+C.dz*d);lob(u,x,z,{T:.6,kind:'flask',noMark:true,onLand:L=>{const gg=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,1,12),MC(0x8a5a33));b.position.y=.5;b.castShadow=true;gg.add(b);gg.position.set(L.x1,0,L.z1);scene.add(gg);
    const hp=Math.round(u.maxHp*.3824),t={isTurret:true,barrel:true,bt:'turret',name:'油のたる',team:u.team,src:u,x:L.x1,z:L.z1,hp,maxHp:hp,rad:.7,cool:0,decay:hp*.12,dead:false,gems:0,pw:0,isMe:false,m:{g:gg},revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm,sup:0,dmg:0,tick:()=>{},onDie:t2=>addOil(t2.src,t2.x,t2.z,TL(1.6),false)};mkLabel(t);G.turrets.push(t)}});
  if(C.BG){u.fsN=(u.fsN||0)+1;if(u.fsN<2)return'free';u.fsN=0}};
GAD.dancing=(u,g,ang,C)=>{u.danceT=G.t+5;u.danceB=C.BG;u.danceHit=new Map();for(const t of targets())if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<TL(2.67))hurt(t,950*C.D,u,false);if(C.BG)buf(u,'spd','dance',1.2,5);
  if(!u.orbs){u.orbs=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8),MB(0xff8a2a));scene.add(m);u.orbs.push(m)}}for(const m of u.orbs)m.visible=true};
function danceTick(u,dt){const R=TL(2.67),end=u.danceT-G.t<=dt;u.orbs.forEach((m,i)=>{const a=G.t*3+i/3*TAU,x=u.x+Math.sin(a)*R,z=u.z+Math.cos(a)*R;m.position.set(x,1,z);m.visible=!end&&!u.dead;GLOW.add(x,1,z,0,.5,0,.4,[1,.6,.2],.25,0);
  for(const t of targets())if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-x,t.z-z)<UR+.5&&G.t-(u.danceHit.get(t)||-9)>1){u.danceHit.set(t,G.t);hurt(t,950*dmgMul(u),u,false)}});
  if(u.danceB){u.dbT=(u.dbT||0)+dt;if(u.dbT>=1){u.dbT=0;for(const t of targets())if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<R)hurt(t,200*dmgMul(u),u,false)}}}
// ---- ガス ----
GAD.kooky=(u,g,ang,C)=>{const sp=G.items.filter(it=>it.kind==='spirit'&&it.src===u&&Math.hypot(it.x-u.x,it.z-u.z)<TL(14));if(!sp.length)return false;
  for(const it of sp){scene.remove(it.m);G.items.splice(G.items.indexOf(it),1);explode(it.x,it.z,{rad:TL(2),dmg:1080*C.D,team:u.team,src:u,col:0xa8d8f0,pc:[.7,.9,1],onHit:t=>{if(C.BG&&G.units.includes(t))t.ammo=Math.max(0,t.ammo-1)}})}};
GAD.kbspirit=(u,g,ang,C)=>{shoot(u,ang,PS(4000),TL(6.67),540*C.D,.4,[.7,.9,1],{pierce:true,onHit:(t,b)=>{if(!t.isTurret&&!t.isSafe&&!(t.ccT>0)){t.kx=b.dx*10;t.kz=b.dz*10}if(C.BG&&(G.units.includes(t)||t.isPet))addSpirit(u,t.x,t.z)},onEnd:b=>addSpirit(u,b.x,b.z)})};
// ---- チャック ----
GAD.rerouting=(u,g,ang,C)=>{if(u.sup>=1)return false;let p=null,bd=TL(6.67);for(const q of myPosts(u)){const d=Math.hypot(q.x-u.x,q.z-u.z);if(d<bd&&los(u.x,u.z,q.x,q.z)){bd=d;p=q}}if(!p)return false;killTurret(p);u.sup=Math.min(1,u.sup+.5);if(C.BG)buf(u,'red','rr',.8,5)};
GAD.ghosttrain=(u,g,ang,C)=>{if(!supReady(u))return false;u.gtT=G.t+8};
// ---- シェイド ----
GAD.longarms=u=>{u.longarms=true;return'hold'};
GAD.jumpscare=(u,g,ang,C)=>{const dir=Math.hypot(u.mx,u.mz)>.1?Math.atan2(u.mx,u.mz):ang,[x1,z1]=(u.ghostT>G.t)?[u.x+Math.sin(dir)*TL(3.67),u.z+Math.cos(dir)*TL(3.67)]:nearestOpen(u.x+Math.sin(dir)*TL(3.67),u.z+Math.cos(dir)*TL(3.67),true);
  u.act={type:'jump',t:0,T:.55,x0:u.x,z0:u.z,x1,z1,land:uu=>{explode(uu.x,uu.z,{rad:TL(2),dmg:0,team:uu.team,src:uu,fear:1,noFx:true});ring(uu.x,uu.z,TL(2),0x8a6aff,.35);if(C.BG){const sh=uu.maxHp*.27;uu.shield=Math.max(uu.shield,sh);uu.shDec=uu.maxHp*.05/.5}}}};
// ---- エル・プリモのアステロイドベルト：近くに来た敵の弾を消す ----
function asteroidTick(){for(const u of G.units){if(!(u.astT>G.t)||u.dead)continue;GLOW.add(u.x+Math.sin(G.t*9)*1.4,1.2,u.z+Math.cos(G.t*9)*1.4,0,0,0,.5,[1,.7,.3],.15,0);
  for(const b of G.bullets){if(b.team===u.team||b.dead)continue;if(Math.hypot(b.x-u.x,b.z-u.z)<UR+1.1){b.dead=true;b.boom=null;burst(b.x,1,b.z,6,[1,.8,.4],3,.3,.3,true);if(u.astB){const g=(b.dmg||0)*1.5/(2.4*u.maxHp);u.sup=Math.min(1,u.sup+g)}}}}}
