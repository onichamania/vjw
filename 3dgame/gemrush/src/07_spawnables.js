// ================= 追加キャラの仕組み（毒・跳ね返り・クマ・タレット・突進など） =================
// 弾の数：キャラごと（ボニーは大砲1発・マックス4発・ジジとアンバーはゲージ）、ブロックのロケットNo.4で4発
const maxAmmo=u=>{const B=BT[u.bt];if(!B)return 3;if(hasSP(u,'rocket4'))return 4;return(altForm(u)&&B.ammo2?B.ammo2:B.ammo)||3};
// 毒・やけど（ticks回・1秒ごと）。cut=回復をへらす割合（クロウ50%・アンジェロ40%）
function poisonU(t,dps,ticks,src,kind,cut){if(t.dead||t.isTurret||t.isSafe||t.isHead||t.immuneT>0)return;t.poison={dps,until:G.t+ticks+.05,src,next:G.t+1,kind:kind||'poison'};if(cut){t.healCutT=Math.max(t.healCutT||0,G.t+4);t.healCut=cut}}
function statusTick(u){const p=u.poison;if(!p)return;if(G.t>p.until){u.poison=null;return}if(G.t>=p.next){p.next+=1;hurt(u,p.dps*(p.src?p.src.dm:1),p.src,true,{dot:true,sc:p.sc||0});GLOW.add(u.x,1.6,u.z,0,1,0,.4,p.kind==='burn'?[1,.5,.2]:[.5,1,.35],.5,0)}}
// ---- クマ（ニタの必殺技）----
function addBear(u,x,z){for(const p of G.pets.slice())if(p.src===u&&p.bear)killPet(p);const S2=BT.yuki.sup,H=hyperOn(u),g=mkBear(u.team,H),hp=Math.round(S2.hp*LVM(u.lv)*(H?1.2:1));const [px,pz]=nearestOpen(x,z);g.position.set(px,0,pz);
  const b={isPet:true,bear:true,bt:'bear',name:'ブルース',team:u.team,src:u,x:px,z:pz,hp,maxHp:hp,dm:LVM(u.lv),cool:.5,spd:S2.spd*(H?1.15:1),dead:false,gems:0,pw:0,isMe:false,m:{g},revealT:0,inBush:false,inv:0,lv:u.lv,sup:0,dmg:0,redT:0,red:0,vx:0,vz:0,rad:.9};
  mkLabel(b);G.pets.push(b);burst(px,1,pz,20,[.9,.7,.4],5,.7,.6,true)}
function killPet(p){if(p.dead&&!G.pets.includes(p))return;if(p.onDie&&!G.over)p.onDie(p);p.dead=true;scene.remove(p.m.g);if(p.lab)p.lab.d.remove();G.pets.splice(G.pets.indexOf(p),1);burst(p.x,1,p.z,16,[.8,.6,.4],4,.6,.6)}
function updPets(dt){for(const p of G.pets.slice()){if(p.src.dead&&G.mode==='br'){killPet(p);continue}if(p.tick){p.tick(p,dt);continue}if(p.decoy){decoyTick(p,dt);continue}p.cool-=dt;p.redT=Math.max(0,p.redT-dt);
    let best=null,bd=1e9;for(const o of G.units){if(o.dead||o.team===p.team)continue;const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<bd&&d<TL(9)){bd=d;best=o}}
    let gx=p.src.x+1.5,gz=p.src.z+1.5;if(best){gx=best.x;gz=best.z}const d=Math.hypot(gx-p.x,gz-p.z),ox=p.x,oz=p.z;if(d>(best?1.3:2.5)){p.x+=(gx-p.x)/d*p.spd*dt;p.z+=(gz-p.z)/d*p.spd*dt;collide(p)}
    p.vx=(p.x-ox)/dt;p.vz=(p.z-oz)/dt;if(best&&bd<2.2&&p.cool<=0){p.cool=hasSP(p.src,'hyperbear')?.24:BT.yuki.sup.delay;const mul=p.pawT?1.5:1;p.pawT=false;const dd=BT.yuki.sup.dmg*p.dm*mul;hurt(best,dd,p.src,true);burst(best.x,1,best.z,mul>1?16:8,[1,.8,.5],4,.5,.3,true);SFX.punch();
      if(hasSP(p.src,'bearwithme')&&G.units.includes(best)){if(bufS(p.src,'bearwithme'))overheal(p.src,dd*1.37,2000*p.src.dm,.2);else healU(p.src,dd*1.37,p.src)}}
    p.m.g.position.set(p.x,0,p.z);if(Math.hypot(p.vx,p.vz)>.2)p.m.g.rotation.y=Math.atan2(p.vx,p.vz)}}
// ---- タレット（ジェシーの必殺技）----
function placeScrappy(u,x,z){for(const t of G.turrets.slice())if(t.src===u&&t.scrappy)killTurret(t);const S2=BT.mimi.sup,H=hyperOn(u),g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.45,.6,.4,10),MC(0x5a5f6e));base.position.y=.2;base.castShadow=true;g.add(base);const top=new THREE.Group();top.position.y=.65;g.add(top);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(.38,12,10),MC(0xe07a2e));hd.castShadow=true;top.add(hd);const br=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.6,8),MC(0x3a3f4d));br.rotation.x=Math.PI/2;br.position.z=.4;top.add(br);
  const [px,pz]=nearestOpen(x,z);g.position.set(px,0,pz);scene.add(g);const hp=Math.round(S2.hp*u.dm*(H?1.5:1));
  const t={isTurret:true,scrappy:true,bt:'turret',name:'スクラッピー',team:u.team,src:u,x:px,z:pz,hp,maxHp:hp,rad:.8,cool:.5,fastT:0,dead:false,gems:0,pw:0,isMe:false,m:{g},top,revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm*(H?1.2:1),sup:0,dmg:0};
  mkLabel(t);G.turrets.push(t);burst(px,.6,pz,14,[1,.8,.4],4,.6,.5,true)}
function scrappyTick(t,dt){t.fastT=Math.max(0,t.fastT-dt);const S2=BT.mimi.sup;let best=null,bd=1e9;for(const o of G.units.concat(G.pets)){if(o.dead||o.team===t.team||!visibleTo(t.team,o))continue;const d=Math.hypot(o.x-t.x,o.z-t.z);if(d<S2.trange&&d<bd&&los(t.x,t.z,o.x,o.z)){bd=d;best=o}}
  if(best){const a=Math.atan2(best.x-t.x,best.z-t.z);t.top.rotation.y=a;if(t.cool<=0){t.cool=S2.rate/(t.fastT>0?2:1);const sh=hasSP(t.src,'shocky');const b=shoot(t,a+rr(-.13,.13),sh?PS(2000):S2.speed,S2.trange,S2.dmg*t.dm,.18,[1,.8,.35],{isSup:true},t.x,t.z);if(sh){b.chain=1;b.onHit=chainNext}SFX.shot('tur')}}}
// ---- パムの回復ステーション ----
function placeStation(u,x,z){for(const t of G.turrets.slice())if(t.src===u&&t.station)killTurret(t);const S2=BT.hatsue.sup,H=hyperOn(u),g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.5,.62,.5,10),MC(0x6b5a4a));base.position.y=.25;base.castShadow=true;g.add(base);const top=new THREE.Group();top.position.y=.85;g.add(top);
  const box=new THREE.Mesh(new THREE.BoxGeometry(.7,.5,.7),MC(0xf2eee4));box.castShadow=true;top.add(box);for(const [w,h] of[[.5,.14],[.14,.5]]){const c=new THREE.Mesh(new THREE.BoxGeometry(w,h,.72),MC(0x3fd35a));top.add(c)}
  const hr=S2.rad,rg=new THREE.RingGeometry(hr-.15,hr,48);rg.rotateX(-Math.PI/2);const ring2=new THREE.Mesh(rg,MB(0x6aff8a,{transparent:true,opacity:.45,depthWrite:false}));ring2.position.y=.05;g.add(ring2);
  const [px,pz]=nearestOpen(x,z);g.position.set(px,0,pz);scene.add(g);const hp=Math.round(S2.hp*u.dm*(H?4500/3300:1));
  const t={isTurret:true,station:true,bt:'turret',name:'ステーション',team:u.team,src:u,x:px,z:pz,hp,maxHp:hp,rad:.8,hr,heal:S2.heal*u.maxHp,love:H,tick:null,tk:.5,cool:0,dead:false,gems:0,pw:0,isMe:false,m:{g},top,revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm,sup:0,dmg:0};
  mkLabel(t);G.turrets.push(t);burst(px,.6,pz,14,[.6,1,.7],4,.6,.5,true);
  if(H)for(const o of G.units)if(!o.dead&&o.team===t.team&&Math.hypot(o.x-t.x,o.z-t.z)<t.hr)healU(o,t.heal*1.5,u)}
function stationTick(t,dt){t.top.rotation.y+=dt*.8;t.tk-=dt;if(t.tk>0)return;t.tk=.5;const s=t.src;
  for(const o of G.units)if(!o.dead&&o.team===t.team&&Math.hypot(o.x-t.x,o.z-t.z)<t.hr){if(t.love&&o.hp>=o.maxHp-1)overheal(o,t.heal*.5*.8,3000*t.dm,.1);else if(o.hp<o.maxHp){healU(o,t.heal*.5,s);GLOW.add(o.x,1.6,o.z,0,1.2,0,.4,[.5,1,.6],.5,0)}}
  if(hasSP(s,'squeeze'))for(const o of targets())if(!o.dead&&o.team!==t.team&&Math.hypot(o.x-t.x,o.z-t.z)<t.hr)hurt(o,s.maxHp*.1*.5,s,true)}
// ママのハグ：当てるたびに4マス以内の自分と味方を最大体力の1%回復
function hugHeal(u){const v=u.maxHp*.01;for(const o of G.units)if(!o.dead&&o.team===u.team&&Math.hypot(o.x-u.x,o.z-u.z)<TL(4))healU(o,v,u)}
// ---- スパイクのライフプラント（サボテン）----
function placePlant(u,x,z){for(const t of G.turrets.slice())if(t.src===u&&t.plant)killTurret(t);const g=new THREE.Group(),gm=MC(0x5cb83a);
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,1.5,10),gm);b.position.y=.75;b.castShadow=true;g.add(b);
  for(const sx of[-1,1]){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.6,8),gm);arm.position.set(sx*.55,1.05,0);arm.castShadow=true;g.add(arm)}
  const fl=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),MC(0xff6fb5));fl.position.y=1.6;g.add(fl);
  const [px,pz]=nearestOpen(x,z);g.position.set(px,0,pz);scene.add(g);const hp=Math.round(u.maxHp*.583);
  const t={isTurret:true,plant:true,bt:'turret',name:'サボテン',team:u.team,src:u,x:px,z:pz,hp,maxHp:hp,rad:.8,cool:0,dead:false,gems:0,pw:0,isMe:false,m:{g},revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm,buf:bufG(u,'lifeplant'),heal:u.maxHp*.3,sup:0,dmg:0};
  mkLabel(t);G.turrets.push(t);burst(px,.6,pz,14,[.6,1,.4],4,.6,.5,true)}
function plantPop(t){ring(t.x,t.z,TL(3.33),0x8affb0,.4);for(const o of G.units)if(!o.dead&&o.team===t.team&&Math.hypot(o.x-t.x,o.z-t.z)<TL(3.33))healU(o,t.heal,t.src);
  if(t.buf)explode(t.x,t.z,{rad:TL(2),dmg:600*t.dm,team:t.team,src:t.src,knock:TL(1.5)})}
// ---- レオンの分身（敵のボットはこれもねらう）----
function addClone(u){for(const p of G.pets.slice())if(p.src===u&&p.decoy)killPet(p);const f=u.faceT!=null?u.faceT:u.face,mm=mkModel(u.bt,G.mode==='br'?0xff4d5a:TEAMCOL[u.team],false,u.sk),[px,pz]=nearestOpen(u.x+Math.sin(f)*1.4,u.z+Math.cos(f)*1.4);
  mm.g.position.set(px,0,pz);mm.g.rotation.y=f;const hp=Math.round(u.maxHp*.5);
  const b={isPet:true,decoy:true,bt:u.bt,name:u.name,team:u.team,src:u,x:px,z:pz,hp,maxHp:hp,dm:u.dm,cool:0,spd:unitSpeed(u),dead:false,gems:0,pw:0,isMe:false,m:mm,revealT:0,inBush:false,inv:0,lv:u.lv,sup:0,dmg:0,redT:0,red:0,vx:0,vz:0,rad:UR,life:10,walkT:0,face:f};
  mkLabel(b);G.pets.push(b);burst(px,1,pz,14,[.6,1,.5],4,.6,.4,true);return b}
function decoyTick(p,dt){p.life-=dt;p.cool-=dt;if(p.life<=0){killPet(p);return}let best=null,bd=TL(9);for(const o of G.units){if(o.dead||o.team===p.team)continue;const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<bd){bd=d;best=o}}
  const ox=p.x,oz=p.z,a=best?Math.atan2(best.x-p.x,best.z-p.z):p.face;if(!best||bd>TL(3)){p.x+=Math.sin(a)*p.spd*dt;p.z+=Math.cos(a)*p.spd*dt;collide(p)}p.face=a;
  if(best&&bd<TL(6)&&p.cool<=0&&los(p.x,p.z,best.x,best.z)){p.cool=1.9;for(let i=0;i<4;i++)shoot(p,a+(i/3-.5)*DEG(17.5),PS(3500),TL(9.67),100*p.dm,.18,[.6,1,.5],{fade:.35,near:.15,isSup:true},p.x,p.z)}
  p.vx=(p.x-ox)/Math.max(dt,1e-4);p.vz=(p.z-oz)/Math.max(dt,1e-4);const sp=Math.hypot(p.vx,p.vz),m=p.m;p.walkT+=dt*Math.min(sp,7)*2.3;const w=Math.min(1,sp/3);
  m.legL.rotation.x=Math.sin(p.walkT)*.8*w;m.legR.rotation.x=-Math.sin(p.walkT)*.8*w;m.g.position.set(p.x,0,p.z);m.g.rotation.y=a}
// ---- ローサのグローライト（草むらを生やす。本家と同じくずっと残る）----
function growBushes(u){const c0=cx(u.x),r0=cz(u.z),made=[];for(let r=r0-1;r<=r0+1;r++)for(let c=c0-1;c<=c0+1;c++){if(cell(c,r)!=='.')continue;
    GRID[r][c]='B';const g=new THREE.Group();g.userData.m=[];const d=new THREE.Mesh(BUSHDOME,bushMat2);d.castShadow=true;g.add(d);const bl=new THREE.Mesh(BUSHGEO[(c+r)%4],bushMat);bl.castShadow=true;g.add(bl);
    g.userData.m.push(bl,d);g.userData.ph=hash2(c+3,r+7)*TAU;g.position.set(tx(c),0,tz(r));g.scale.setScalar(.2);ARENA.add(g);const k=c+','+r;BUSH[k]=g;BUSHL.push(g);made.push([c,r,k,g])}
  let gr=0;const grow=()=>{gr+=.1;for(const m of made)m[3].scale.setScalar(Math.min(1,.2+gr));if(gr<.8)setTimeoutG(.03,grow)};grow()}
// 草むらをこわす（アンバーの火）
function burnBush(c,r){const k=c+','+r;if(cell(c,r)!=='B'||!BUSH[k])return;GRID[r][c]='.';const g=BUSH[k];ARENA.remove(g);delete BUSH[k];const i=BUSHL.indexOf(g);if(i>=0)BUSHL.splice(i,1);bushSeeThrough.delete(k);burst(tx(c),.6,tz(r),8,[1,.6,.2],3,.5,.5,true)}
// ---- 跳ね返る弾（ジェシー）：6.67マス以内の次の敵へ、1回ごとに25%へる ----
function chainNext(t,b){if(!b.chain)return;let best=null,bd=1e9;for(const o of targets()){if(o.dead||o.team===b.team||o===t||b.hit.has(o))continue;const d=Math.hypot(o.x-t.x,o.z-t.z);if(d<(b.brange||TL(6.67))&&d<bd){bd=d;best=o}}
  if(!best)return;const a=Math.atan2(best.x-t.x,best.z-t.z);const nb=shoot(b.src,a,b.spd*.8,bd+1,b.dmg*(b.bmul||.75),b.r,b.col,{chain:b.chain-1,hit:new Set(b.hit),brange:b.brange,bmul:b.bmul,isSup:b.isSup,sc:b.sc,noWall:true},t.x,t.z);nb.onHit=chainNext}
