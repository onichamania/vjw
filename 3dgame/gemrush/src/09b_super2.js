// ================= 必殺技（新しく足したキャラ） =================
// ---- ジジ：0.8秒後にワープ → 3秒以内にもう一度使うと戻りながら攻撃 ----
SUP.puppet=(u,s,ang,dist,C)=>{if((u.puppetT||0)>G.t){const [bx,bz]=u.puppetFrom,lx=u.x,lz=u.z;u.puppetT=0;u.sup=0;ring(lx,lz,s.rad,0xffa0d0,.35);explode(lx,lz,{rad:s.rad,dmg:s.dmg*C.D,team:u.team,src:u,isSup:true,col:0xffa0d0,pc:[1,.7,.9]});
    burst(u.x,1,u.z,20,[1,.7,.9],4,.6,.5,true);u.x=bx;u.z=bz;collide(u);burst(u.x,1,u.z,20,[1,.7,.9],4,.6,.5,true);return}
  const [x1,z1]=nearestOpen(C.px,C.pz),x0=u.x,z0=u.z;ring(x1,z1,TL(1),0xffa0d0,.8);
  u.act={type:'wind',t:0,T:s.delay,fire:()=>{burst(u.x,1,u.z,20,[1,.7,.9],4,.6,.5,true);u.x=x1;u.z=z1;collide(u);burst(u.x,1,u.z,20,[1,.7,.9],4,.6,.5,true);
    u.puppetFrom=[x0,z0];u.puppetT=G.t+s.win;u.sup=1;if(hasSP(u,'helping'))healU(u,u.maxHp*.293,u);
    if(C.H)explode(u.x,u.z,{rad:s.rad,dmg:s.dmg*dmgMul(u),team:u.team,src:u,isSup:true,col:0xffa0d0,pc:[1,.7,.9]})}}};
// ---- ジャネット：6秒間空を飛ぶ（ダメージを受けない）・0.76秒ごとに真下に爆弾 ----
SUP.fly=(u,s,ang,dist,C)=>{u.flyT=G.t+s.dur;u.flyDir=[C.dx,C.dz];u.flyH=C.H;u.flyBomb=s.gap;u.charging=false;burst(u.x,.5,u.z,20,[1,.7,.4],4,.6,.5,true)};
function flyTick(u,dt){if(!(u.flyT>G.t)){if(u.wasFly){u.wasFly=false;const [x,z]=nearestOpen(u.x,u.z);u.x=x;u.z=z;burst(u.x,.4,u.z,14,[1,.8,.5],4,.5,.4,true)}return}u.wasFly=true;
  const s=BT.janet.sup;u.flyBomb-=dt;if(u.flyBomb<=0){u.flyBomb=s.gap;const x=u.x,z=u.z;lob(u,x,z,{T:.25,rad:s.rad,low:true,x0:x,z0:z,onLand:L=>explode(L.x1,L.z1,{rad:s.rad,dmg:s.dmg*dmgMul(u),team:u.team,src:u,isSup:true})})}
  if(hasSP(u,'stageview'))for(const o of G.units)if(!o.dead&&o.team!==u.team&&Math.hypot(o.x-u.x,o.z-u.z)<TL(10))o.revealT=Math.max(o.revealT,.3)}
// ---- スクイーク：大きなブロブ → 6方向に小さなブロム（ハイパーは5マス跳ねてもう一度）----
SUP.bigblob=(u,s,ang,dist,C)=>{const D=C.D,blobs=(x,z)=>{explode(x,z,{rad:s.rad*1.4,dmg:s.dmg*D,team:u.team,src:u,isSup:true,col:0x6fd0ff,pc:[.5,.85,1]});
    for(let i=0;i<s.n;i++){const a=i/s.n*TAU,o={dmg:s.dmg*D,rad:s.rad,main:false,slow:hasSP(u,'supersticky')?4:0};shoot(u,a,PS(3000),s.dist,0,.22,[.45,.85,1],{isSup:true,stick:(b,t)=>addBlomb(u,b.x,b.z,t&&!t.isSafe?t:null,o),onEnd:b=>addBlomb(u,b.x,b.z,null,o)},x,z)}};
  lob(u,C.px,C.pz,{rad:s.rad*1.4,T:s.time,kind:'blob',isSup:true,onLand:L=>{blobs(L.x1,L.z1);if(C.H){const [x2,z2]=nearestOpen(L.x1+C.dx*TL(5),L.z1+C.dz*TL(5));lob(u,x2,z2,{rad:s.rad*1.4,T:.6,kind:'blob',x0:L.x1,z0:L.z1,onLand:L2=>blobs(L2.x1,L2.z1)})}}});SFX.shot('lob')};
// ---- ファング：飛び蹴り。当たると7マス以内の次の敵へ（4人まで）----
SUP.chainkick=(u,s,ang,dist,C)=>{u.act={type:'mdash',t:0,t0:G.t,T:s.range/s.speed,dx:C.dx,dz:C.dz,spd:s.speed,hit:new Set(),dmg:s.dmg*C.D,isSup:true,fang:true,left:s.n,ghost:C.H,corn:C.H?0:-1}};
// ---- アッシュ：敵を追いかけて爆発するネズミロボ ----
SUP.rats=(u,s,ang,dist,C)=>{const n=C.H?10:s.n,d=Math.min(C.d,s.range);for(let i=0;i<n;i++){const a=i/n*TAU,[x,z]=nearestOpen(u.x+C.dx*d+Math.sin(a)*1.2,u.z+C.dz*d+Math.cos(a)*1.2);setTimeoutG(i*.05,()=>addRat(u,x,z))}};
function addRat(u,x,z){const S2=BT.ash.sup,g=new THREE.Group(),bm=MC(0x9aa3b5);const b=new THREE.Mesh(new THREE.SphereGeometry(.32,10,8),bm);b.scale.set(1,.7,1.4);b.position.y=.3;b.castShadow=true;g.add(b);
  const e=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),MC(0xff3b3b));e.position.set(0,.4,.42);g.add(e);const tl=new THREE.Mesh(new THREE.CylinderGeometry(.03,.02,.5,5),MC(0xff8ab0));tl.rotation.x=1.2;tl.position.set(0,.3,-.55);g.add(tl);
  g.position.set(x,0,z);scene.add(g);const hp=Math.round(S2.hp*u.dm);const r={isPet:true,rat:true,bt:'rat',name:'ネズミ',team:u.team,src:u,x,z,hp,maxHp:hp,dm:dmgMul(u),spd:S2.spd,dead:false,gems:0,pw:0,isMe:false,m:{g},revealT:9,inBush:false,inv:0,lv:u.lv,sup:0,dmg:0,rad:.5,life:12,
    tick:(p,dt)=>{p.life-=dt;if(p.life<=0){killPet(p);return}let best=null,bd=1e9;for(const o of G.units){if(o.dead||o.team===p.team)continue;const dd=Math.hypot(o.x-p.x,o.z-p.z);if(dd<bd){bd=dd;best=o}}
      if(best){const dd=Math.max(bd,.01);p.x+=(best.x-p.x)/dd*p.spd*dt;p.z+=(best.z-p.z)/dd*p.spd*dt;collide(p);p.m.g.rotation.y=Math.atan2(best.x-p.x,best.z-p.z);
        if(bd<1.1){explode(p.x,p.z,{rad:S2.rad,dmg:S2.dmg*p.dm,team:p.team,src:p.src,isSup:true,onHit:t=>{if(G.units.includes(t)&&!p.src.dead)p.src.rage=Math.min(1,(p.src.rage||0)+BT.ash.rage.sup)}});killPet(p);return}}
      p.m.g.position.set(p.x,Math.abs(Math.sin(G.t*20))*.06,p.z)}};
  mkLabel(r);G.pets.push(r)}
// ---- R-T：頭と足に分かれる／もう一度で足のところへ戻る ----
const rtLegs=u=>G.turrets.find(t=>t.legs&&t.src===u&&!t.dead);
SUP.split=(u,s,ang,dist,C)=>{const L=placeLegs(u);setForm(u,'head',true);u.hp=Math.min(u.maxHp,u.hp);u.ammo=maxAmmo(u);u.supLeft=0;u.sup=1;u.rtH=C.H;if(C.H)rtRadars(u);burst(u.x,1,u.z,16,[.6,.7,1],4,.6,.5,true)};
SUP.merge=(u,s,ang,dist,C)=>{const L=rtLegs(u);const hp=u.hp;setForm(u,'rt',true);u.hp=Math.min(u.maxHp,hp);if(L){u.x=L.x;u.z=L.z;killTurret(L)}collide(u);const [x,z]=nearestOpen(u.x,u.z);u.x=x;u.z=z;healU(u,s.heal,u);u.ammo=Math.min(u.ammo,maxAmmo(u));burst(u.x,1,u.z,16,[.6,.7,1],4,.6,.5,true)};
function placeLegs(u){for(const t of G.turrets.slice())if(t.legs&&t.src===u)killTurret(t);const m=mkModel('rt',u.ringCol,false,u.sk,'legs');m.g.position.set(u.x,0,u.z);m.g.rotation.y=u.face;
  const hp=Math.round(BT.rt.sup.legHp*u.dm);const t={isTurret:true,legs:true,noCharge:true,bt:'rt',name:'R-Tの足',team:u.team,src:u,x:u.x,z:u.z,hp,maxHp:hp,rad:UR,cool:0,dead:false,gems:0,pw:0,isMe:false,m,revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm,sup:0,dmg:0,
    tick:(t2,dt)=>{t2.m.g.position.set(t2.x,0,t2.z);if(G.t-t2.src.lastHurt>3&&G.t-t2.src.lastAtk>3&&t2.hp<t2.maxHp)t2.hp=Math.min(t2.maxHp,t2.hp+t2.maxHp*.13*dt)},
    onDie:t2=>{const o=t2.src;if(!o.dead&&o.form==='head'){o.hp=0;killUnit(o,t2.lastBy||null)}}};
  mkLabel(t);G.turrets.push(t);return t}
// R-Tのハイパー：頭と足のまわりを回るレーダー
function rtRadars(u){const end=u.hyperT;const spin=()=>{if(u.dead||G.t>end)return;const pts=[[u.x,u.z]];const L=rtLegs(u);if(L)pts.push([L.x,L.z]);
    for(const [x,z] of pts)for(let k=0;k<4;k++){const a=G.t*4+k*Math.PI/2;for(const rr2 of[TL(1.6),TL(2.3)]){const px=x+Math.sin(a)*rr2,pz=z+Math.cos(a)*rr2;GLOW.add(px,1,pz,0,0,0,.45,[1,.35,.35],.12,0);
        for(const t of targets())if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-px,t.z-pz)<UR+.4&&G.t-((t._rdT||{})[u.name]||0)>.6){(t._rdT=t._rdT||{})[u.name]=G.t;hurt(t,700*dmgMul(u),u,true);markU(t,u)}}}
    setTimeoutG(.05,spin)};spin()}
// ---- アリー：7秒間 点滅する透明・次の攻撃にボーナス ----
SUP.stalk=(u,s,ang,dist,C)=>{u.stalkT=G.t+s.dur;u.stalkB=true;u.invisT=G.t+s.dur;burst(u.x,1,u.z,24,[.5,1,.5],4,.6,.6)};
// ---- アンジェロ：毒の沼（中で撃つ矢も毒になる）----
SUP.swamp=(u,s,ang,dist,C)=>{const q=addFire(u,u.x,u.z,s.rad,s.dps*C.D,s.dur,{col:0x6abf3a,pc:[.55,1,.3],tickT:1,swamp:true,follow:C.H?u:null,onHit:t=>{t.healCutT=Math.max(t.healCutT||0,G.t+1.2);t.healCut=.4}});
  if(hasSP(u,'empower'))q.onTick=q2=>{if(!u.dead&&Math.hypot(u.x-q2.x,u.z-q2.z)<q2.rad)healU(u,u.maxHp*.1,u)};burst(u.x,.5,u.z,26,[.5,1,.3],s.rad*2,.6,.6,true)};
const inSwamp=u=>G.zones.some(q=>q.swamp&&q.src===u&&Math.hypot(u.x-q.x,u.z-q.z)<q.rad);
// ---- EMZ：自分のまわりの毒の雲（敵を遅くする）----
SUP.caustic=(u,s,ang,dist,C)=>{if(G.zones.some(q=>q.caustic&&q.src===u))return false;if(bufS(u,'hype'))u.godT=G.t+.5;
  const q=addFire(u,u.x,u.z,s.rad,s.dps*C.D,s.dur,{col:0xa060e0,pc:[.8,.5,1],follow:u,caustic:true,slowAura:.4,slowP:s.slowP,tickT:.5,
    onTick:(q2,n)=>{if(hasSP(u,'hype')&&n&&!u.dead){let m=0;for(const o of G.units)if(!o.dead&&o.team!==u.team&&Math.hypot(o.x-q2.x,o.z-q2.z)<q2.rad)m++;healU(u,u.maxHp*.08*m*.5,u)}}});
  if(C.H){for(const t of G.units)if(!t.dead&&t.team!==u.team&&!(t.ccT>0)){const d=Math.hypot(t.x-u.x,t.z-u.z);if(d<TL(4)){t.kx=(t.x-u.x)/Math.max(d,.3)*(TL(4.5)-d)*3;t.kz=(t.z-u.z)/Math.max(d,.3)*(TL(4.5)-d)*3}}
    for(let i=0;i<18;i++)shoot(u,i/18*TAU,PS(1500),TL(5),241*C.D,.5,[.75,.45,.95],{pierce:true,karma:hasSP(u,'badkarma'),isSup:true},u.x,u.z)}};
// ---- ビビ：壁で跳ね返り続ける大きなガム（4秒・同じ敵にも0.5秒ごとに当たる）----
SUP.spitball=(u,s,ang,dist,C)=>{const H=C.H,mk=(a,x,z,split)=>shoot(u,a,s.speed,TL(40),s.dmg*C.D,s.r,[1,.55,.8],{pierce:true,isSup:true,bounce:true,rehit:.5,life:s.dur,onHit:(t,b)=>{if(G.units.includes(t)&&bufS(u,'stance'))buf(u,'red','bstance',.8,5);
      if(split&&!b.didSplit){b.didSplit=true;const ba=Math.atan2(b.dx,b.dz);for(const o of[-DEG(20),DEG(20)])mk(ba+o,b.x,b.z,false);b.dead=true}}},x,z);mk(ang,null,null,H);SFX.shot('spread')};
// ---- ボウ：見えない罠を3つ（ハイパーは5つ）----
SUP.foxmines=(u,s,ang,dist,C)=>{const n=C.H?5:s.n,sp=C.H?TL(2.33):s.dist,[x1,z1]=nearestOpen(C.px,C.pz),T=Math.max(.35,C.d/(s.speed*(bufS(u,'snare')?1.5:1)));
  lob(u,x1,z1,{T,kind:'stick',noMark:true,onLand:L=>{if(!C.H)for(const q of G.mines.slice())if(q.fox&&q.src===u&&!q.hyper){scene.remove(q.m);G.mines.splice(G.mines.indexOf(q),1)}
    for(let i=0;i<n;i++){const a=i/n*TAU+ang,[mx,mz]=nearestOpen(L.x1+Math.sin(a)*sp,L.z1+Math.cos(a)*sp);addMine(u,mx,mz,s.dmg*C.D,0,{fox:true,hyper:C.H,rad:s.rad,life:1e9,arm:.5,hide:true,fuse:s.fuse,isSup:true,breakWalls:true,knock:hasSP(u,'snare')?0:s.knock,stun:hasSP(u,'snare')?2:0})}}})};
// ---- コレット：往復ダッシュ（敵の最大体力の22%）----
SUP.collect=(u,s,ang,dist,C)=>{const spd=s.speed*(bufS(u,'pushit')?1.5:1),L=rayWall(u.x,u.z,C.dx,C.dz,s.range),x0=u.x,z0=u.z,hitN={n:0},D=C.D;
  const dmgF=t=>(special(t)?s.spec*LVM(u.lv):Math.max(s.min*LVM(u.lv),s.pct*t.maxHp))*(D/u.dm);
  const back=()=>{u.act={type:'mdash',t:0,t0:G.t,T:Math.hypot(u.x-x0,u.z-z0)/spd,dx:(x0-u.x)/Math.max(.01,Math.hypot(u.x-x0,u.z-z0)),dz:(z0-u.z)/Math.max(.01,Math.hypot(u.x-x0,u.z-z0)),spd,hit:new Set(),dmgFn:dmgF,isSup:true,collect:true,swim:true,
      onHit:t=>{hitN.n++;colSteal(u,t)},onEnd:()=>{if(hitN.n&&hasSP(u,'masstax'))buf(u,'red','mt',.7,3)}}};
  u.act={type:'mdash',t:0,t0:G.t,T:Math.max(.05,L/spd),dx:C.dx,dz:C.dz,spd,hit:new Set(),dmgFn:dmgF,isSup:true,collect:true,swim:true,drag:hasSP(u,'pushit')?new Set():null,onHit:t=>{hitN.n++;colSteal(u,t)},
    onEnd:a=>{if(a.drag)for(const t of a.drag)if(!t.dead){hurt(t,0,u,true,{stun:.2})}back()}};
  if(C.H){const pts=[];for(let k=0;k<=12;k++)pts.push([x0+C.dx*L*k/12,z0+C.dz*L*k/12]);let k=0;const sp2=()=>{if(k>24)return;const p=k<=12?pts[k]:pts[24-k];k++;GLOW.add(p[0],1,p[1],0,.5,0,.9,[1,.5,.8],.4,0);
      for(const t of targets())if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-p[0],t.z-p[1])<1.2&&!(t._spT>G.t)){t._spT=G.t+.4;hurt(t,special(t)?s.spec*dmgMul(u):s.min*u.dm,u,true)}setTimeoutG(L/12/(spd*.66),sp2)};setTimeoutG(.1,sp2)}};
function colSteal(u,t){if(bufS(u,'masstax')&&G.units.includes(t)){const k=Math.min(t.ammo,maxAmmo(t)/3);t.ammo-=k;u.ammo=Math.min(maxAmmo(u),u.ammo+k)}}
// ---- グリフ：お札を投げる（遠いほど強い）→ 1秒回ってから戻ってくる ----
SUP.cashback=(u,s,ang,dist,C)=>{const H=C.H,res=bufS(u,'resilience');const note=(a,x,z,delay)=>{const b=shoot(u,a,H?PS(4500):s.speed,s.range,s.dmg*C.D,.3,[.55,.9,.5],{pierce:true,isSup:true,noWall:H,back:true,homeSrc:true,ghostBack:true,backSpd:s.back,hold:delay!=null?delay:s.hold,
      onBack:()=>{if(res&&!u.dead)healU(u,(u.maxHp-u.hp)*.05,u)},onTurn:bb=>{bb.dmg=s.dmg2*C.D}},x,z);b.grow2=true;return b};
  for(let i=0;i<s.n;i++){const a=ang+(i/(s.n-1)-.5)*s.spread;note(a);if(H){const ex=u.x+Math.sin(a)*s.range,ez=u.z+Math.cos(a)*s.range;setTimeoutG(s.range/PS(4500),()=>{if(!u.dead){const b2=note(a+Math.PI,ex,ez,0);b2.returned=true;b2.dmg=s.dmg2*C.D;b2.range=1e9}})}}SFX.shot('spread')};
// ---- リコ：敵を貫いて跳ね返る12連射 ----
SUP.trick=(u,s,ang,dist,C)=>{const sb=hasSP(u,'superbouncy')?120*u.dm:0;u.act={type:'wind',t:0,T:s.n*s.gap,canMove:true,fire:()=>{}};
  for(let i=0;i<s.n;i++)setTimeoutG(i*s.gap,()=>{if(u.dead)return;shoot(u,(u.faceT!=null?u.faceT:ang)+rr(-s.spread,s.spread)/2,s.speed,s.range,s.dmg*C.D,s.r,[1,1,.75],{pierce:true,isSup:true,bounce:true,plus:s.plus,plusBig:C.H?TL(6):0,superBouncy:sb});if(i%2===0)SFX.shot('snipe')})};
// ---- マックス：自分とまわりの味方の移動速度を4秒間 +300 ----
SUP.letsgo=(u,s,ang,dist,C)=>{ring(u.x,u.z,s.rad,0xffd060,.4);for(const o of G.units)if(!o.dead&&o.team===u.team&&Math.hypot(o.x-u.x,o.z-u.z)<s.rad){o.addSpd=s.spd;o.addSpdT=G.t+s.dur;if(bufS(u,'supercharged'))buf(o,'red','maxsh',.75,4)}
  if(C.H)for(const o of G.units)if(!o.dead&&o.team===u.team){o.addSpd=SPD(200);o.addSpdT=G.t+10;o.sup=Math.min(1,o.sup+.25);burst(o.x,1.6,o.z,10,[1,.85,.3],3,.5,.4,true)}};
// ---- メグ：1秒後にメカに乗る（着地でまわりにダメージ）／メカのフィール・ザ・スティール ----
SUP.mecha=(u,s,ang,dist,C)=>{u.act={type:'wind',t:0,T:s.delay,fire:()=>{u.megHp=u.hp;setForm(u,'mech',true);u.hp=u.maxHp;u.ammo=maxAmmo(u);
    explode(u.x,u.z,{rad:s.rad,dmg:s.dmg*u.dm,team:u.team,src:u,isSup:true,knock:s.knock,slow:C.H?1:0,big:true});burst(u.x,1,u.z,30,[1,.6,.3],5,.7,.6,true)}}};
SUP.steel=(u,s,ang,dist,C)=>{windup(u,s.wind,()=>{melee(u,u.faceT,supRange(u),s.arc,s.dmg*dmgMul(u),0xffb060,(t,core,d)=>{if(hasSP(u,'heavymetal')&&u.form==='mech')healU(u,d*.7059,u);if(bufS(u,'heavymetal')&&G.units.includes(t)&&t.ammo>=1){t.ammo-=1;u.ammo=Math.min(maxAmmo(u),u.ammo+1)}},{thru:true,isSup:true});G.shake=Math.max(G.shake,.25)})};
// メカがこわれる → 生身にもどる
function mechBreak(u){const hp=u.megHp;setForm(u,'meg',true);u.hp=clamp(hp||u.maxHp,1,u.maxHp);u.sup=0;u.supLeft=0;u.act=null;u.wind=null;burst(u.x,1,u.z,30,[1,.5,.2],6,.8,.7,true);SFX.boom(true);if(hasSP(u,'forcefield'))buf(u,'red','ff',.7,5);if(u.isMe)note('メカがこわれた！',1.4)}
// ---- アンバー：油のびんを投げる（炎で火をつけると燃える）----
const OILS=[];
SUP.flask=(u,s,ang,dist,C)=>{const H=C.H,x0=u.x,z0=u.z;lob(u,C.px,C.pz,{T:Math.max(.35,C.d/s.speed),kind:'flask',noMark:true,onFly:(L,k)=>{const n=Math.floor(k*8);if(n>(L.tr||0)){L.tr=n;const px=lerp(L.x0,L.x1,k),pz=lerp(L.z0,L.z1,k);if(cell(cx(px),cz(pz))!=='~')addOil(u,px,pz,s.trail,H)}},
    onLand:L=>addOil(u,L.x1,L.z1,s.rad*(H?2:1),H)});SFX.shot('lob')};
function addOil(u,x,z,rad,hyper){const q=addFire(u,x,z,rad,0,1e9,{col:0x3a2a10,pc:[.3,.2,.1],oil:true,hyper,isSup:true});OILS.push(q);return q}
const nearOil=u=>G.zones.some(q=>q.oil&&q.team===u.team&&Math.hypot(u.x-q.x,u.z-q.z)<q.rad+TL(1));
// 炎が油にふれると燃え広がる
function oilTick(){for(const q of G.zones){if(!q.oil||q.lit)continue;for(const b of G.bullets)if(b.ignite&&b.team===q.team&&Math.hypot(b.x-q.x,b.z-q.z)<q.rad){igniteOil(q);break}}}
function igniteOil(q){if(q.lit)return;q.lit=true;const u=q.src,dur=q.hyper?2:.5,burnT=bufS(u,'siphon')?5:4;q.T=q.t+dur;q.oil=false;q.m.material.color.setHex(0xff6a1a);q.pc=[1,.5,.15];q.dps=0;
  q.onTick=q2=>{for(const t of G.units)if(!t.dead&&t.team!==q2.team&&Math.hypot(t.x-q2.x,t.z-q2.z)<q2.rad+UR*.5){if(!(t.poison&&t.poison.kind==='burn'&&t.poison.src===u&&t.poison.until>G.t+burnT-.6)){poisonU(t,BT.amber.sup.dps*(q.hyper?1.1:1),burnT,u,'burn');if(t.poison)t.poison.sc=BT.amber.sup.dps/BT.amber.superDmgS;
        if(hasSP(u,'siphon'))u.ammo=Math.min(maxAmmo(u),u.ammo+maxAmmo(u)*.07)}}};q.tickT=.25;
  for(let r=cz(q.z)-3;r<=cz(q.z)+3;r++)for(let c=cx(q.x)-3;c<=cx(q.x)+3;c++)if(Math.hypot(tx(c)-q.x,tz(r)-q.z)<q.rad)burnBush(c,r);
  for(const o of G.zones)if(o.oil&&!o.lit&&o.team===q.team&&Math.hypot(o.x-q.x,o.z-q.z)<o.rad+q.rad)setTimeoutG(.08,()=>igniteOil(o))}
// ---- ガス：味方（自分）にシールド・まわりの敵を押しのける ----
SUP.spooky=(u,s,ang,dist,C)=>{let tgt=u;if(!C.auto){let bd=1e9;for(const o of G.units){if(o.dead||o.team!==u.team||o===u)continue;const dx=o.x-u.x,dz=o.z-u.z,d=Math.hypot(dx,dz);if(d>s.range)continue;const off=Math.abs(dx*C.dz-dz*C.dx);if(off<TL(1.2)&&dx*C.dx+dz*C.dz>0&&d<bd){bd=d;tgt=o}}}
  const give=t=>{const sh=s.shield*u.dm;t.shield=Math.max(t.shield||0,sh);t.shDec=sh*.1;if(hasSP(u,'spiritanimal'))buf(t,'dmg','spa',1.25,5);if(bufS(u,'spiritanimal'))buf(t,'spd','spa',1.15,5);
    for(const o of G.units)if(!o.dead&&o.team!==u.team&&!(o.ccT>0)){const d=Math.hypot(o.x-t.x,o.z-t.z);if(d<TL(2)){o.kx=(o.x-t.x)/Math.max(d,.3)*s.knock*3;o.kz=(o.z-t.z)/Math.max(d,.3)*s.knock*3}}ring(t.x,t.z,TL(2),0xa8d8f0,.35);
    if(C.H)for(let i=0;i<10;i++){const a=i/10*TAU;shoot(u,a,PS(3000),TL(10),BT.gus.atk.dmg*C.D,.3,[.7,.9,1],{pierce:true,isSup:true,sc:.045,curve:t!==u?1.2:0,allyHeal:BT.gus.atk.heal},t.x+Math.sin(a)*TL(1.67),t.z+Math.cos(a)*TL(1.67))}};
  if(tgt===u)give(u);else{const b=shoot(u,Math.atan2(tgt.x-u.x,tgt.z-u.z),s.speed,s.range,0,.4,[.7,.9,1],{noWall:true,pierce:true,isSup:true});const go=()=>{if(b.dead||!G.bullets.includes(b)){return}if(Math.hypot(b.x-tgt.x,b.z-tgt.z)<1.2){b.dead=true;give(tgt);return}setTimeoutG(.02,go)};go()}};
// ---- チャック：柱を投げる／柱から柱へダッシュ（4回使える）----
const myPosts=u=>G.turrets.filter(t=>t.post&&t.src===u&&!t.dead);
SUP.post=(u,s,ang,dist,C)=>{const ghost=(u.gtT||0)>G.t,ps=myPosts(u),see=p=>ghost||los(u.x,u.z,p.x,p.z);let first=null,bd=1e9;for(const p of ps){const d=Math.hypot(p.x-u.x,p.z-u.z);if(d<s.dash&&d<bd&&see(p)){bd=d;first=p}}
  if(C.auto&&first){chuckDash(u,first,new Set(),ghost);return}
  if(ps.length>=s.max)killTurret(ps[0]);const [x1,z1]=nearestOpen(C.px,C.pz);lob(u,x1,z1,{T:Math.max(.35,C.d/PS(1500)),kind:'post',noMark:true,onLand:L=>{const D=dmgMul(u);explode(L.x1,L.z1,{rad:s.rad,dmg:s.dmg*D,team:u.team,src:u,isSup:true,sc:s.scPost,slow:hasSP(u,'pitstop')?2:0,slowP:.3});
    if(bufS(u,'pitstop'))addFire(u,L.x1,L.z1,s.rad,50*D,4,{tickT:1});placePost(u,L.x1,L.z1)}})};
function placePost(u,x,z){const g=new THREE.Group(),p=new THREE.Mesh(GEO.post,GMAT.post);p.position.y=.6;p.castShadow=true;g.add(p);const top=new THREE.Mesh(new THREE.BoxGeometry(.5,.2,.5),MC(0xffd24d));top.position.y=1.25;g.add(top);
  g.position.set(x,0,z);scene.add(g);const t={isTurret:true,post:true,noTarget:true,bt:'turret',name:'柱',team:u.team,src:u,x,z,hp:1e9,maxHp:1e9,rad:.4,cool:0,dead:false,gems:0,pw:0,isMe:false,m:{g},revealT:9,inBush:false,inv:99,lv:u.lv,dm:u.dm,sup:0,dmg:0,tick:()=>{}};G.turrets.push(t);return t}
function chuckDash(u,p,done,ghost){done.add(p);const spd=BT.chuck.sup.speed*(bufS(u,'tickets')?1.25:1),dx=p.x-u.x,dz=p.z-u.z,L=Math.max(.05,Math.hypot(dx,dz));
  u.act={type:'mdash',t:0,t0:G.t,T:L/spd,dx:dx/L,dz:dz/L,spd,hit:new Set(),dmg:BT.chuck.sup.dashDmg*dmgMul(u),isSup:true,sc:BT.chuck.sup.scDash,chuck:true,ghost,fire:ghost&&bufG(u,'ghosttrain'),
    onHit:t=>{if(hasSP(u,'tickets')&&G.units.includes(t)){const k=Math.min(t.ammo,maxAmmo(t)/3);t.ammo-=k;u.ammo=Math.min(maxAmmo(u),u.ammo+k)}},
    onEnd:()=>{u.x=p.x;u.z=p.z;if(hyperOn(u))explode(p.x,p.z,{rad:TL(2),dmg:800*dmgMul(u),team:u.team,src:u,isSup:true});let nx=null,bd=1e9;for(const q of myPosts(u)){if(done.has(q))continue;const d=Math.hypot(q.x-u.x,q.z-u.z);if(d<BT.chuck.sup.chain&&d<bd&&(ghost||los(u.x,u.z,q.x,q.z))){bd=d;nx=q}}
      if(nx)chuckDash(u,nx,done,ghost);else{const [x,z]=nearestOpen(u.x,u.z);u.x=x;u.z=z}}}}
// ---- シェイド：障害物をすり抜けるダッシュ → 6秒間すり抜けて速く動ける ----
SUP.ghost=(u,s,ang,dist,C)=>{u.ghostT=G.t+s.dur+(bufS(u,'hoodie')?1:0);u.ghostH=C.H;u.act={type:'mdash',t:0,t0:G.t,T:s.dash/s.speed,dx:C.dx,dz:C.dz,spd:s.speed,hit:new Set(),dmg:0,ghost:true};burst(u.x,1,u.z,20,[.7,.6,1],4,.6,.5)};
