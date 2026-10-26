// ================= 通常攻撃（新しく足したキャラ） =================
// 振りかぶってから当てる（動ける）：アッシュ・ビビ・シェイド。スタンされると取り消し
function windup(u,T,fire){u.wind={t:0,T,fire}}
function windTick(u,dt){const w=u.wind;if(!w)return;if(u.dead||u.stunT>0||(u.fearT||0)>G.t){u.wind=null;return}w.t+=dt;if(w.t>=w.T){u.wind=null;w.fire()}}
// ---- 押している間撃ち続ける（ジジ・アンバー）----
function streamStart(u){if(curAtk(u).hold!=='stream'||u.dead||u.ammo<1)return false;if(!u.streaming){u.streaming=true;u.strT=0}return true}
function streamStop(u){u.streaming=false}
function streamTick(u,dt,ang){if(!u.streaming)return;if(u.dead||u.stunT>0||u.ammo<1||G.over||(u.fearT||0)>G.t||u.act){u.streaming=false;return}u.strT-=dt;if(u.strT>0)return;
  const a=curAtk(u),D=dmgMul(u),HB=bufH(u)&&hyperOn(u);u.ammo-=1;u.lastAtk=G.t;u.revealT=1.2;if(u.invisT>G.t)u.invisT=0;if(ang!=null){u.face=ang;u.faceT=ang}
  if(a.type==='spin'){u.strT=lerp(a.i1,a.i0,u.ammo/maxAmmo(u));spinHit(u,a,D)}
  else if(a.type==='flame'){u.strT=a.gap;flameShot(u,a,D,HB)}}
function spinHit(u,a,D){const R=atkRange(u);for(const t of targets())if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<R+(t.rad||UR)*.6)hurt(t,a.dmg*D,u,false);
  ring(u.x,u.z,R,0xffc0e0,.12);for(let i=0;i<4;i++){const an=G.t*14+i*Math.PI/2;GLOW.add(u.x+Math.sin(an)*R*.8,1,u.z+Math.cos(an)*R*.8,0,0,0,.5,[1,.75,.9],.25,0)}SFX.punch()}
function flameShot(u,a,D,HB){const an=(u.faceT!=null?u.faceT:u.face)+rr(-a.spread/2,a.spread/2);
  shoot(u,an,a.speed,atkRange(u),a.dmg*D,a.r,[1,rr(.4,.7),.15],{pierce:true,ignite:true,poison:HB?BT.amber.sup.dps*.5:0,ticks:(bufS(u,'siphon')?5:4),burn:HB});if(Math.random()<.4)SFX.shot('ice')}
ATK.spin=(u,a,ang,dist,C)=>{spinHit(u,a,C.D)};
ATK.flame=(u,a,ang,dist,C)=>{flameShot(u,a,C.D,C.HB)};
// ---- ねらい続けてためる（ジャネット・アンジェロ）----
function chargeStart(u){if(curAtk(u).hold!=='charge'||u.dead)return false;if(!u.charging){u.charging=true;u.charge=0}return true}
function chargeTick(u,dt){if(!u.charging)return;if(u.dead||u.stunT>0||Math.abs(u.kx)+Math.abs(u.kz)>2){u.charging=false;u.charge=0;return}if(u.ammo<1&&u.bt==='janet')return;const a=curAtk(u);u.charge=Math.min(1,u.charge+dt/(a.T*(hasSP(u,'warmup')?1/1.3:1)))}
ATK.focus=(u,a,ang,dist,C)=>{const k=focusK(u),arc=lerp(a.a0,a.a1,k),n=Math.max(3,Math.round(arc/DEG(8))+1),hit=new Set();u.charging=false;
  for(let i=0;i<n;i++)shoot(u,ang+(n>1?(i/(n-1)-.5)*arc:0),a.speed,C.R,a.dmg*C.D,.35,[1,.55,.85],{pierce:true,hit});SFX.shot('ice');
  if(u.backstage){u.backstage=false;u.gadCD=gadCool(u,BT.janet.gad[1]);const d=lerp(TL(2),TL(6),k),[x1,z1]=nearestOpen(u.x-C.dx*d,u.z-C.dz*d);u.act={type:'jump',t:0,T:.4+.4*k,x0:u.x,z0:u.z,x1,z1}}
  u.charge=0};
ATK.arrow=(u,a,ang,dist,C)=>{const k=u.charge||0,dm=lerp(a.dmg,a.dmg2,k)*C.D,fl=u.fletcher,sw=inSwamp(u);u.fletcher=false;u.charging=false;u.charge=0;if(fl)u.gadCD=gadCool(u,BT.angelo.gad[1]);
  shoot(u,ang,a.speed,C.R,dm,a.r*(1+k*.6),k>.95?[1,.5,1]:[.6,1,.4],{pierce:fl,noWall:fl,poison:sw?dm*.125/u.dm:0,ticks:4,cut:sw?.4:0});SFX.shot('snipe')};
// ---- スクイーク：くっつくブロム（1.15秒後に壁ごしに爆発）----
const BLOMBS=[];const blombGeo=new THREE.SphereGeometry(.32,12,10),blombMat=M(0x6fd0ff,{emissive:0x1a6a9a});
function addBlomb(u,x,z,att,o){if(BLOMBS.length>=10){const q=BLOMBS.shift();scene.remove(q.m)}
  if(att&&o.main){const ex=BLOMBS.find(q=>q.att===att&&q.main&&q.src===u);if(ex){ex.t=0}}
  const m=new THREE.Mesh(blombGeo,blombMat);m.position.set(x,.5,z);scene.add(m);BLOMBS.push(Object.assign({x,z,att,src:u,team:u.team,t:o.fuse||BT.squeak.atk.fuse,m},o))}
function updBlombs(dt){for(let i=BLOMBS.length-1;i>=0;i--){const q=BLOMBS[i];q.t-=dt;if(q.att&&!q.att.dead){q.x=q.att.x;q.z=q.att.z}q.m.position.set(q.x,q.att?1.6:.5,q.z);q.m.scale.setScalar(1+Math.max(0,.4-q.t)*.8+Math.sin(G.t*20)*.05);
    if(q.t>0)continue;BLOMBS.splice(i,1);scene.remove(q.m);const u=q.src;let mul=1;
    if(q.main&&hasSP(u,'chainreact')){let n=0;for(const o of G.units)if(!o.dead&&o.team!==q.team&&Math.hypot(o.x-q.x,o.z-q.z)<q.rad)n++;mul=1+.15*Math.max(1,n)}
    explode(q.x,q.z,{rad:q.rad,dmg:q.dmg*mul,team:q.team,src:u,isSup:!q.main,slow:q.slow||0,slowP:.45,col:0x6fd0ff,pc:[.5,.85,1]});
    if(q.residue)addFire(u,q.x,q.z,TL(2.5),0,6,{col:0x4fb8ff,pc:[.5,.85,1],slow:1.05,slowP:.45,reveal:true})}}
ATK.blomb=(u,a,ang,dist,C)=>{const wu=u.windup,rs=u.residue;u.windup=false;u.residue=false;if(wu)u.gadCD=gadCool(u,BT.squeak.gad[0]);if(rs)u.gadCD=gadCool(u,BT.squeak.gad[1]);
  const dm=a.dmg*C.D*(wu?1.5:1),o={dmg:dm,rad:a.rad,main:true,residue:rs};
  shoot(u,ang,a.speed,C.R,0,a.r,[.45,.85,1],{stick:(b,t)=>addBlomb(u,b.x,b.z,t&&!t.isSafe?t:null,o),onEnd:b=>addBlomb(u,b.x,b.z,null,o)});SFX.shot('lob')};
// ---- ファング：キック（外れると靴が飛ぶ）----
ATK.kick=(u,a,ang,dist,C)=>{const s=a.shoe;shoot(u,ang,a.speed,BT.fang.range,a.dmg*C.D,a.r0,[1,.85,.4],{r1:a.r1,onEnd:(b,wall)=>{if(wall)return;shoot(u,Math.atan2(b.dx,b.dz),s.speed,s.range,s.dmg*C.D,s.r,[.9,.6,.3],{sc:.255},b.x,b.z)}});SFX.punch()};
// ---- アッシュ：ほうき（0.3秒ため）→ 貫く衝撃波。当てると怒りがたまる ----
ATK.broom=(u,a,ang,dist,C)=>{const fb=C.full&&hasSP(u,'firstbash');windup(u,a.wind,()=>{let first=true;const R=atkRange(u);
  shoot(u,u.faceT,a.speed,R,a.dmg*dmgMul(u),a.r,[.8,.8,.7],{pierce:true,onHit:t=>{if(!G.units.includes(t))return;u.rage=Math.min(1,(u.rage||0)+(fb&&first?.522:BT.ash.rage.atk));first=false;u.rageT=G.t}});SFX.punch();G.shake=Math.max(G.shake,.12)})};
// ---- R-T：マークをつける弾／分かれたときはまわりへの電波 ----
const markDur=u=>BT.rt.atk.mark+(hasSP(u,'quickmaths')?3:0);
function markU(t,u){if(!G.units.includes(t))return;t.mark={by:u,t:G.t+markDur(u)};GLOW.add(t.x,2.6,t.z,0,.6,0,.7,[1,.3,.3],.5,0)}
ATK.mark=(u,a,ang,dist,C)=>{shoot(u,ang,a.speed,C.R,a.dmg*C.D,a.r,a.col,{onHit:t=>markU(t,u)});SFX.shot('snipe')};
ATK.signal=(u,a,ang,dist,C)=>{const pts=[[u.x,u.z]];const L=rtLegs(u);if(L)pts.push([L.x,L.z]);
  for(const [x,z] of pts){explode(x,z,{rad:a.rad,dmg:a.dmg*C.D,team:u.team,src:u,col:0xff6060,pc:[1,.4,.4],onHit:t=>markU(t,u)})}SFX.shot('ice')};
// ---- アリー：ひっかき突進（草むら・水の中ではジャンプ）----
function alliHit(u,t,base){let d=base;if(u.stalkB&&!u._sbUsed){const B=BT.alli.sup,k=LVM(u.lv)*(dmgMul(u)/u.dm);const sp=!G.units.includes(t);let bonus=sp?B.max*k:clamp((hyperOn(u)?t.maxHp:t.hp)*B.pct,B.min*LVM(u.lv),B.max*LVM(u.lv))*(dmgMul(u)/u.dm);d+=bonus;u._sbUsed=true}
  hurt(t,d,u,false);if(u.gators)healU(u,d,u);if(hyperOn(u))healU(u,d*.2,u)}
ATK.swipe=(u,a,ang,dist,C)=>{const jm=u.inBush||inWater(u);u._sbUsed=false;const gat=u.gatorsN>0;if(gat)u.gatorsN=0;
  const fin=()=>{if(u.stalkB&&u._sbUsed)u.stalkB=false;if(gat){u.gators=false;u.gadCD=gadCool(u,BT.alli.gad[0])}};u.gators=gat;
  if(jm){const d=clamp(dist,1,a.jump),[x1,z1]=nearestOpen(u.x+C.dx*d,u.z+C.dz*d,true);u.act={type:'jump',t:0,T:a.jair,x0:u.x,z0:u.z,x1,z1,land:()=>{const D=dmgMul(u);for(const t of targets())if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<a.jrad+UR*.5)alliHit(u,t,a.dmg*D);ring(u.x,u.z,a.jrad,0x9dff6a,.3);fin()}}}
  else u.act={type:'mdash',t:0,t0:G.t,T:a.dist/a.speed,dx:C.dx,dz:C.dz,spd:a.speed,hit:new Set(),dmg:a.dmg*C.D,hitFn:(t,dd)=>alliHit(u,t,dd),onEnd:fin,swim:true};SFX.punch()};
// ---- EMZ：その場にしばらく残るスプレーの霧（0.35秒ごとに当たる）----
ATK.spray=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='emz',arc=hb?DEG(45):a.spread,acid=u.acid;u.acid=false;if(acid)u.gadCD=gadCool(u,BT.emz.gad[1]);
  const sh={hit:new Set(),ht:new Map()},life=C.R/a.speed+.75,karma=hasSP(u,'badkarma');
  for(let i=0;i<3;i++){const b=shoot(u,ang+(i-1)*arc/3,a.speed,C.R,a.dmg*C.D,.9,[.75,.45,.95],{pierce:true,rehit:a.tick,linger:true,life,karma,noWall:acid,sc:acid?.14:undefined,poison:hb?60:0,ticks:4,
      onHit:t=>{if(!G.units.includes(t))return;if(acid&&bufG(u,'acidspray')){t.slowT=Math.max(t.slowT,3);t.slowP=Math.max(t.slowP||0,.3)}if(bufS(u,'badkarma'))t.weakT=G.t+4}});b.hit=sh.hit;b.ht=sh.ht;b.m.material=new THREE.MeshBasicMaterial({color:0xc08aff,transparent:true,opacity:.35,depthWrite:false})}SFX.shot('ice')};
// ---- ビビ：バット（0.6秒ため・ホームランゲージが満タンならふき飛ばす）----
ATK.bat=(u,a,ang,dist,C)=>{const W=hyperOn(u)&&bufH(u)?.2:a.wind;windup(u,W,()=>{const hr=u.hrT>=a.hr,vit=u.vitB;u.vitB=false;const dd=a.dmg*dmgMul(u)*(hr&&bufS(u,'homerun')?1.15:1);
  melee(u,u.faceT,atkRange(u),a.arc,dd,hr?0x6ab8ff:0xff9ad0,(t,core,d)=>{if(vit)healU(u,d*.5,u)},{knock:hr?a.knock:0});if(hr){u.hrT=0;SFX.boom(false)}})};
// ---- ボウ：爆発する矢を3本（左から右へ）----
ATK.arrows=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='bo',n=hb?4:a.n,rad=hb?TL(1.33):a.rad,gap=a.gap*(hb?.75:1);
  for(let i=0;i<n;i++)setTimeoutG(i*gap,()=>{if(u.dead)return;const an=(u.faceT!=null?u.faceT:ang)+(i/(n-1)-.5)*a.spread;shoot(u,an,a.speed,C.R,0,a.r,[1,.75,.35],{boom:{rad,dmg:a.dmg*C.D}});SFX.shot('snipe')})};
// ---- コレット：今の体力の39%（最低{500}）。スポーン物などには決まったダメージ ----
const special=t=>!G.units.includes(t);
function taxDmg(u,t,pct,min,spec){const k=dmgMul(u)/u.dm;if(special(t))return spec*LVM(u.lv)*k;const base=t.shield>0?t.maxHp:t.hp;return Math.max(min*LVM(u.lv),pct*base)*k}
ATK.tax=(u,a,ang,dist,C)=>{shoot(u,ang,a.speed,C.R,1,a.r,[1,.45,.7],{dmgFn:t=>taxDmg(u,t,a.pct,a.min,a.spec)});SFX.shot('snipe')};
// ---- グリフ：コインを3列（キープ・ザ・チェンジで4列・広い）----
ATK.coins=(u,a,ang,dist,C)=>{const kc=hasSP(u,'keepchange'),rows=a.rows+(kc?1:0),sp=a.spread*(kc?1.775:1),gap=a.gap*(kc?.75:1),mega=C.full&&bufS(u,'keepchange'),pierce=C.HB&&u.bt==='griff';
  for(let r=0;r<rows;r++)setTimeoutG(r*gap,()=>{if(u.dead)return;const an=u.faceT!=null?u.faceT:ang;for(let i=0;i<a.n;i++){const mid=i===1&&mega&&r===0;shoot(u,an+(i-1)*sp/2+rr(-.02,.02),a.speed,C.R,a.dmg*C.D*(mid?1.5:1),a.r*(mid?1.6:1),[1,.85,.3],{pierce})}SFX.shot('tur')})};
// ---- リコ：壁で跳ね返る弾（跳ね返るたびに+1.67マス）----
ATK.bounce=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='ricochet',n=hb?7:a.n,spd=a.speed*(hb?1.3:1),sb=hasSP(u,'superbouncy')?120*u.dm:0;
  for(let i=0;i<n;i++)setTimeoutG(i*a.gap*(hb?.7:1),()=>{if(u.dead)return;const an=(u.faceT!=null?u.faceT:ang)+rr(-a.spread,a.spread)/2;
    shoot(u,an,spd,C.R,a.dmg*C.D,a.r,[.9,.9,1],{bounce:true,plus:a.plus,superBouncy:sb,onHit:(t,b)=>{if(b.bounced&&bufS(u,'superbouncy')&&G.units.includes(t))u.sup=Math.min(1,u.sup+.0064)}});if(i%2===0)SFX.shot('snipe')})};
// ---- メグ：生身の2連射／メカの16連射 ----
ATK.bolts=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='meg',n=hb?3:a.n;for(let i=0;i<n;i++)setTimeoutG(i*a.gap,()=>{if(u.dead)return;shoot(u,u.faceT!=null?u.faceT:ang,a.speed*(hb?.8:1),C.R,a.dmg*C.D,a.r,a.col,{home:hb});SFX.shot('snipe')})};
ATK.mbolts=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='meg';for(let i=0;i<a.n;i++)setTimeoutG(i*a.gap,()=>{if(u.dead||u.form!=='mech')return;const an=(u.faceT!=null?u.faceT:ang)+(i%2?1:-1)*a.spread/2*((i>>1)%4)/3,side=(i%2?1:-1)*.4;
    shoot(u,an,a.speed,C.R,a.dmg*C.D,a.r,a.col,hb?{boom:{rad:TL(.67),dmg:200*u.dm}}:{},u.x+Math.sin(an)*.8+Math.cos(an)*side,u.z+Math.cos(an)*.8-Math.sin(an)*side);if(i%3===0)SFX.shot('tur')})};
// ---- ガス：風船（3回当てると次で魂が出る）----
ATK.balloon=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='gus';shoot(u,ang,a.speed,C.R,a.dmg*C.D,a.r*(hb?1.5:1),a.col,{noWall:hb,onHit:t=>{if(!(G.units.includes(t)||t.isPet))return;if((u.gusBar||0)>=3){u.gusBar=0;addSpirit(u,t.x,t.z)}else u.gusBar=(u.gusBar||0)+1}});SFX.shot('ice')};
function addSpirit(u,x,z){const own=G.items.filter(g=>g.kind==='spirit'&&g.src===u);if(own.length>=10){const o=own[0];scene.remove(o.m);G.items.splice(G.items.indexOf(o),1)}
  const [gx,gz]=nearestOpen(x,z),it=addItem('spirit',x,z,gx,gz);it.team=u.team;it.src=u;it.heal=BT.gus.atk.heal*(hasSP(u,'bonanza')?1.75:1);it.follow=bufS(u,'bonanza');return it}
// ---- チャック：帽子から3つの蒸気（貫く・だんだん大きくなる）----
ATK.steam=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='chuck';for(let i=0;i<a.n;i++)setTimeoutG(i*a.gap,()=>{if(u.dead)return;const an=u.faceT!=null?u.faceT:ang;
    for(const o of hb?[-DEG(20),0,DEG(20)]:[0])shoot(u,an+o,a.speed,C.R,a.dmg*C.D,a.r0,[.95,.95,.95],{pierce:true,r1:a.r1});SFX.shot('ice')})};
// ---- シェイド：壁ごしにも届くハグ（まん中は2倍）----
ATK.hug=(u,a,ang,dist,C)=>{const la=u.longarms;u.longarms=false;if(la)u.gadCD=gadCool(u,BT.shade.gad[0]);const R=atkRange(u)+(la?TL(1.67):0);
  windup(u,a.wind,()=>{const hb=hyperOn(u)&&bufH(u),coreArc=a.core*(hb?1.5:1),cm=2*(hb?1.15:1);let hitAny=false;
    melee(u,u.faceT,R,a.arc,a.dmg*dmgMul(u),0xb8a0ff,(t,core)=>{hitAny=true;if(core&&hasSP(u,'speedster'))buf(u,'spd','sp'+Math.random(),1.2,2);if(la&&bufG(u,'longarms')&&!t.isTurret&&!(t.ccT>0)){const an=u.faceT,cxp=u.x+Math.sin(an)*R*.5,czp=u.z+Math.cos(an)*R*.5;t.kx=(cxp-t.x)*2;t.kz=(czp-t.z)*2}},{thru:true,core:{arc:coreArc,mul:cm}});
    if(hitAny&&bufS(u,'speedster'))u.gadCD*=.85})};
