// ================= 通常攻撃 =================
// ATK[type](u,a,ang,dist,C)：C={D（攻撃力の倍率）,R（射程）,HB（ハイパーバフィー中）,dx,dz,px,pz（右向き）,stun,full（弾が満タンだった）}
const ATK={};
function atkRange(u){const B=BT[u.bt];let r=altForm(u)&&B.range2?B.range2:B.range;if(hasSP(u,'magnum'))r*=1.11;
  if(u.bt==='soda'){const st=sodaStage(u);if(st>=4)r=TL(10.67);else if(st>=2)r=TL(8.67)}
  if(hyperOn(u)&&bufH(u)){if(u.bt==='yuki')r=TL(6.67);else if(u.bt==='gai')r=TL(4.67)}
  if(u.bt==='jet'&&bufS(u,'rocket4')&&u.r4T>=6)r+=TL(2);if(u.clay>0)r=TL(10);if(u.homing)r+=TL(1.67);if(u.windup)r*=2;if(u.longarms)r+=TL(1.67);
  if(u.bt==='janet')r=lerp(B.range0,B.range,focusK(u));if(u.bt==='fang')r=B.range+B.atk.shoe.range;return r}
// ジャネットの集中（0〜1）：ねらっている時間で細く遠くなる
const focusK=u=>u.bt!=='janet'?1:clamp(u.charge||0,0,1);
// 攻撃のあと次の攻撃まで（本家の「攻撃の完了まで」）
function atkCool(u,a){if(a.cd!=null)return a.cd;const t=a.type;return t==='burst'?a.n*a.gap*(u.credits?3:1)*.9+.1:t==='fists'?a.n*a.gap:t==='punch'?a.hits*a.gap:t==='scrap'?a.n*a.gap*2:t==='double'?a.gap+.27:
  t==='coins'?(a.rows+(hasSP(u,'keepchange')?1:0))*a.gap*.8:t==='bounce'?a.n*a.gap:t==='mbolts'?1:t==='blades'?.35:t==='snipe'?.5:t==='arrows'?.9:t==='steam'?.5:t==='bolts'?.4:.3}
function attack(u,ang,dist){if(u.dead||G.over||u.stunT>0||u.spinT>0||(u.fearT||0)>G.t||u.wind)return false;if(u.act&&!u.act.canAtk)return false;
  if(u.flyT>G.t)return false;
  if(G.rule==='ball'&&G.M.ball&&G.M.ball.carrier===u){if(G.t-u.lastAtk<.3)return false;kick(u,ang,21);return true}
  const a=curAtk(u);if(u.ammo<1||G.t-u.lastAtk<(u.atkCD||.3))return false;
  const D=dmgMul(u)*(u.smokeB?1.15:1),R=atkRange(u),HB=bufH(u)&&hyperOn(u);u.smokeB=false;const full=u.ammo>=maxAmmo(u)-.01;
  u.ammo-=1;const keepInvis=u.bt==='alli'&&u.stalkT>G.t||u.bt==='shinobu'&&hyperOn(u);if(u.invisT>G.t&&!keepInvis){u.invisT=0;if(bufS(u,'smoketrails'))u.smokeB=true}
  u.lastAtk=G.t;u.atkCD=atkCool(u,a);if(!(u.bt==='bo'&&bufS(u,'eagle')&&u.inBush))u.revealT=1.2;u.face=ang;u.faceT=ang;u.atkAnim=1;u.inv=0;
  const stun=u.satchel?1.5:0;u.satchel=false;const dx=Math.sin(ang),dz=Math.cos(ang),C={D,R,HB,dx,dz,px:-dz,pz:dx,stun,full};
  const f=ATK[a.type];if(f)f(u,a,ang,dist,C);
  if(['burst','cannon','split','spread','rocket','snipe','blades','bounce','bolts','mbolts','tax','balloon','mark','arrow','coins'].includes(a.type))burst(u.x+dx*.9,1,u.z+dz*.9,5,[1,.9,.6],3,.4,.15,true);
  // コレットのハイパーバフィー：小さい2発目
  if(HB&&u.bt==='colette')setTimeoutG(.18,()=>{if(!u.dead)ATK.tax(u,Object.assign({},a,{pct:.225,r:.22}),u.faceT,dist,C)});
  return true}
// ---- 本家のキャラ（最初からいた23人） ----
ATK.burst=(u,a,ang,dist,C)=>{const cred=u.credits,n=cred?18:a.n,sp=cred?DEG(14):a.spread,spd=a.speed*(hasSP(u,'magnum')?1.11:1);u.credits=false;
  // コルトのバフィー：スリックブーツ（当てると速く）・マグナム（遠くで強い）・ハイパー（速く撃ちきる）／8ビット：エクストラクレジット（跳ね返る）／マックス
  const o={},hits=[];if(bufS(u,'slick'))hits.push(()=>buf(u,'spd','slick',1.2,.5));if(bufS(u,'magnum'))o.far=1.05;if(cred&&bufG(u,'credits')){o.chain=2;o.brange=TL(6.67);o.bmul=.6;o.onHit=chainNext}
  if(u.bt==='max'){if(bufS(u,'runngun'))hits.push(()=>buf(u,'spd','rng',1.2,1));if(hasSP(u,'supercharged'))hits.push(()=>{if(u.addSpdT>G.t)u.addSpdT+=.25});
    if(C.HB)hits.push(()=>{for(const o2 of G.units)if(!o2.dead&&o2.team===u.team&&Math.hypot(o2.x-u.x,o2.z-u.z)<TL(2.67))o2.sup=Math.min(1,o2.sup+.06)})}
  if(hits.length&&!o.onHit)o.onHit=t=>{if(G.units.includes(t))for(const h of hits)h()};
  const gap=u.bt==='piko'&&n>6?a.gap*.3:a.gap*(C.HB&&u.bt==='jack'?.5:1);
  for(let i=0;i<n;i++)setTimeoutG(i*gap,()=>{if(u.dead)return;const an=u.faceT!=null?u.faceT:ang,lane=a.lanes?(i%2?1:-1)*a.lanes:0,ldx=Math.cos(an),ldz=-Math.sin(an);
    shoot(u,an+rr(-sp,sp),spd,C.R,a.dmg*C.D,a.r,a.col,Object.assign({},o),u.x+Math.sin(an)*.7+ldx*lane,u.z+Math.cos(an)*.7+ldz*lane);if(i%2===0)SFX.shot(u.bt==='piko'?'tur':'snipe')})};
ATK.spread=(u,a,ang,dist,C)=>{const clay=u.clay>0;if(clay)u.clay--;const sp2=clay?a.spread*.5:a.spread;
  // クレイピジョンのバフィー：1粒ごとに遅くする時間がのびる／ハイパーバフィー：シェリーは弾が速い・ブルは全員を貫く
  const o={};if(clay&&bufG(u,'clay'))o.onHit=t=>{if(G.units.includes(t)){t.slowT=Math.min(4,(t.slowT>0?t.slowT:0)+.5);t.slowP=Math.max(t.slowP||0,.3)}};if(C.HB&&u.bt==='gai'){o.pierce=true;o.falloff=.65}
  const spd=a.speed*(clay?4300/3100:1)*(C.HB&&u.bt==='rico'?1.45:1)*(C.HB&&u.bt==='gai'?4200/2853:1);
  for(let i=0;i<a.n;i++)shoot(u,ang+(i/(a.n-1)-.5)*sp2+rr(-.02,.02),spd,C.R,a.dmg*C.D,a.r,a.col,Object.assign({},o));SFX.shot('spread')};
ATK.wave=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='yuki';shoot(u,ang,a.speed*(hb?3718/2718:1),C.R,a.dmg*C.D,a.r*(hb?1.5:1),a.col,{pierce:true});SFX.shot('ice')};
// ポコ：扇形の音波（当たった味方は回復）
ATK.arcwave=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='carlo',arc=hb?Math.PI:a.spread,n=hb?13:7,hit=new Set(),heal=u.maxHp*(hasSP(u,'dacapo')?.15:a.allyHeal||0);
  for(let i=0;i<n;i++)shoot(u,ang+(i/(n-1)-.5)*arc,a.speed,C.R,a.dmg*C.D,.5,a.col,{pierce:true,hit,allyHeal:heal,dacapo:bufS(u,'dacapo')});SFX.shot('ice')};
ATK.rocket=(u,a,ang,dist,C)=>{const fuel=u.fuel;u.fuel=false;if(u.bt==='jet'&&bufS(u,'rocket4')&&u.r4T>=6){u.r4T=0;burst(u.x,1.2,u.z,10,[1,.7,.3],3,.4,.3,true)}
  const dm=a.dmg*C.D*(fuel?1000/1160:1);shoot(u,ang,fuel?PS(3500):a.speed,C.R,0,fuel?.4:a.r,a.col,{breakWalls:fuel,boom:{rad:a.rad*(fuel?1.2:1),dmg:dm,split:fuel&&bufG(u,'fuel')?4:0,fire:fuel?null:{rad:a.fire.rad,dur:a.fire.dur,dps:a.dmg*C.D*a.fire.dps}}});
  if(C.HB)for(const sd of[-1,1])shoot(u,ang,a.speed,C.R,0,a.r*.7,a.col,{boom:{rad:a.rad*.75,dmg:a.dmg*C.D*.4}},u.x+Math.sin(ang)*.7+C.px*sd*.8,u.z+Math.cos(ang)*.7+C.pz*sd*.8);SFX.shot('lob')};
ATK.chain=(u,a,ang,dist,C)=>{const b=shoot(u,ang,a.speed,C.R,a.dmg*C.D,a.r,a.col,{chain:a.bounces-1,brange:a.brange,bmul:.75,healTurret:hasSP(u,'energize')?a.dmg*C.D*.5:0});b.onHit=chainNext;SFX.shot('ice')};
ATK.dagger=(u,a,ang,dist,C)=>{const hb=C.HB&&u.bt==='yotaka';for(let i=0;i<a.n;i++)shoot(u,ang+(i-1)*a.spread*.5,a.speed,C.R,a.dmg*C.D,a.r,a.col,{poison:a.poison,ticks:a.ticks,cut:.5,pierce:hb,back:hb,backMul:.7});SFX.shot('snipe')};
ATK.dyna=(u,a,ang,dist,C)=>{const d=clamp(dist,2,C.R);for(const s of[-1,1])lob(u,u.x+C.dx*d+C.px*s*.55,u.z+C.dz*d+C.pz*s*.55,{rad:a.rad,dmg:a.dmg*C.D,T:a.time,kind:'stick',stun:C.stun});SFX.shot('lob')};
ATK.mines=(u,a,ang,dist,C)=>{const n=u.mania?6:a.n;u.mania=false;const d=clamp(dist,2,C.R),sp0=a.gap*(1+.9*clamp((d-2)/(C.R-2),0,1));
  for(let i=0;i<n;i++){const aa=i/n*TAU+ang,rad=n>3?sp0*1.3:sp0,tx0=u.x+C.dx*d+Math.sin(aa)*rad,tz0=u.z+C.dz*d+Math.cos(aa)*rad;
    lob(u,tx0,tz0,{T:a.time+i*.04,kind:'mine',onLand:L=>{if(blockMove(cx(L.x1),cz(L.z1)))return;addMine(u,L.x1,L.z1,a.dmg*C.D,0)}})}SFX.shot('lob')};
// エドガー・エル・プリモ：短い距離を飛ぶ、貫くパンチ（だんだん大きくなる）
ATK.fists=(u,a,ang,dist,C)=>{const riki=u.bt==='riki',big=C.HB&&riki?2:1,ed=u.bt==='kagerou',heal=ed?(hasSP(u,'fisticuffs')?.455:a.heal):0;
  const oh=riki?(t=>{if(!G.units.includes(t))return;if(bufS(u,'elfuego')&&t.poison&&t.poison.kind==='burn'&&t.poison.src===u)t.poison.until=Math.max(t.poison.until,G.t+4);if(big>1)poisonU(t,900*u.dm/4,2,u,'burn')}):null;
  const n=a.n+(C.HB&&ed?2:0);
  for(let i=0;i<n;i++)setTimeoutG(i*a.gap,()=>{if(u.dead)return;const an=u.faceT!=null?u.faceT:ang,ext=i>=a.n,off=riki?(i%2?.35:-.35):0;
    shoot(u,an,ext?PS(7000):a.speed,ext?TL(4):C.R,a.dmg*C.D*(ext?.5:1),a.r0*big,a.col,{pierce:true,r1:a.r1*big,lifesteal:heal,onHit:oh},u.x+Math.sin(an)*.5+C.px*off,u.z+Math.cos(an)*.5+C.pz*off);SFX.punch()})};
// ローサ：広い3連パンチ（必殺技中はトゲトゲグローブで+30%）
ATK.punch=(u,a,ang,dist,C)=>{const ros=u.bt==='sumire'&&G.t<u.strongT;
  for(let i=0;i<a.hits;i++)setTimeoutG(i*(a.gap||.14),()=>{if(u.dead)return;const dd=a.dmg*C.D*(ros&&hasSP(u,'thorny')?1.3:1);melee(u,u.faceT!=null?u.faceT:ang,C.R,a.arc,dd,ros?0x8aff8a:0xc7a8ff)})};
ATK.cannon=(u,a,ang,dist,C)=>{shoot(u,ang,a.speed,C.R,a.dmg*C.D,a.r,a.col,{onHit:hasSP(u,'wisdom')?((t,b)=>{const ba=Math.atan2(b.dx,b.dz);for(const k of[1,3,5,7]){const an=ba+k*Math.PI/4;shoot(u,an,PS(3261),TL(2),a.dmg*C.D*.25,.11,[.95,.95,.9],{hit:new Set(b.hit)},b.x,b.z)}}):null});SFX.shot('spread')};
ATK.bomber=(u,a,ang,dist,C)=>{for(let i=0;i<a.n;i++)setTimeoutG(i*.06,()=>{if(u.dead)return;const an=(u.faceT!=null?u.faceT:ang)+(i/(a.n-1)-.5)*a.spread;shoot(u,an,a.speed,C.R,0,a.r,[1,.5,.6],{boom:{rad:a.rad,dmg:a.dmg*C.D}});SFX.shot('lob')})};
// モーティス：突進（4.5秒攻撃しないと次の突進が2マス長い）
ATK.dash=(u,a,ang,dist,C)=>{const lng=u.longT>=(hasSP(u,'coiled')?2.5:a.longT),dd=a.dist+(lng?a.longD:0);u.longT=0;u.act={type:'mdash',t:0,t0:G.t,T:dd/a.speed,dx:C.dx,dz:C.dz,spd:a.speed,hit:new Set(),dmg:a.dmg*C.D,long:lng,phantom:C.HB,x0:u.x,z0:u.z};SFX.punch()};
ATK.split=(u,a,ang,dist,C)=>{const st=sodaStage(u),o={split:st>=3?6:2,splitDmg:.5,splitR:a.splitR,bounce:hasSP(u,'tothemax')?1:0,wallMore:bufS(u,'tothemax')};shoot(u,ang,a.speed,C.R,a.dmg*C.D,a.r,a.col,o);
  if(C.HB)setTimeoutG(.14,()=>{if(!u.dead)shoot(u,u.faceT,a.speed,C.R,a.dmg*C.D*.5,a.r*.8,a.col,Object.assign({},o))});SFX.shot('ice')};
ATK.double=(u,a,ang,dist,C)=>{for(let k=0;k<2;k++)setTimeoutG(k*a.gap,()=>{if(u.dead)return;const an=u.faceT!=null?u.faceT:ang;
    for(let i=0;i<a.n;i++)shoot(u,an+(i/(a.n-1)-.5)*a.spread+rr(-.02,.02),a.speed,C.R,a.dmg*C.D,a.r,a.col,{});SFX.shot('spread')})};
// パム：左右に2回はらうスクラップ（スクラップサッカー：敵の弾を25%うばう）
ATK.scrap=(u,a,ang,dist,C)=>{const suck=u.suck;u.suck=false;
  for(let i=0;i<a.n*2;i++)setTimeoutG(i*a.gap,()=>{if(u.dead)return;const ph=(i%a.n)/(a.n-1),an=(u.faceT!=null?u.faceT:ang)+(i<a.n?ph-.5:.5-ph)*a.spread+rr(-.03,.03);
    shoot(u,an,a.speed,C.R,a.dmg*C.D,a.r,a.col,{onHit:t=>{if(!G.units.includes(t))return;if(hasSP(u,'hug'))hugHeal(u);if(suck){const k=maxAmmo(t)*.25,got=Math.min(k,t.ammo);t.ammo-=got;u.ammo=Math.min(maxAmmo(u),u.ammo+got*.5)}}});if(i%3===0)SFX.shot('tur')})};
// フランケン：振り上げ（体力がへるほど速い・ハイパーバフィーは0.2秒）→ 扇形の衝撃波
ATK.hammer=(u,a,ang,dist,C)=>{const W=C.HB?.2:a.wind*(1-.6*(1-u.hp/u.maxHp)),att=u.attract;u.attract=false;
  u.act={type:'wind',t:0,T:W,fire:()=>{const an=u.faceT;
    if(att){shoot(u,an,PS(5000),TL(6),1240*C.D,.3,[.7,.8,1],{pierce:true,onHit:t=>{if(t.isTurret||t.isSafe||t.ccT>0)return;t.kx=(u.x-t.x)*2.4;t.kz=(u.z-t.z)*2.4;if(bufG(u,'attraction')){t.slowT=Math.max(t.slowT,2);t.slowP=Math.max(t.slowP||0,.7)}}});SFX.punch();return}
    const hit=new Set();for(let i=0;i<5;i++)shoot(u,an+(i/4-.5)*a.arc,a.speed,C.R,a.dmg*C.D,a.r,[.75,.85,1],{pierce:true,hit});ring(u.x+Math.sin(an)*1.4,u.z+Math.cos(an)*1.4,1.4,0xc8d8ff,.25);G.shake=Math.max(G.shake,.15);SFX.punch()}}};
ATK.snipe=(u,a,ang,dist,C)=>{const hm=u.homing,amb=hasSP(u,'ambush')&&u.inBush;u.homing=false;
  shoot(u,ang,a.speed,C.R,a.dmg*C.D*(amb?1.35:1),a.r,a.col,{grow:hm?.25:a.grow,full:a.full,home:hm,onHit:t=>{if(G.units.includes(t)&&hasSP(u,'snappy'))u.ammo=Math.min(maxAmmo(u),u.ammo+.4)}});SFX.shot('snipe')};
ATK.blades=(u,a,ang,dist,C)=>{const fade=C.HB&&u.bt==='shinobu'?.75:a.fade;for(let i=0;i<a.n;i++)setTimeoutG(i*a.gap,()=>{if(u.dead)return;const an=(u.faceT!=null?u.faceT:ang)+(i/(a.n-1)-.5)*a.spread;shoot(u,an,a.speed,C.R,a.dmg*C.D,a.r,a.col,{fade,near:a.near})});SFX.shot('snipe')};
// スパイク：トゲ玉が当たる（か届く・壁に当たる）とまわり1マスにダメージ、6方向（向きは固定）にトゲがとぶ。ハイパーバフィーは0.6秒後にもう一度
ATK.needle=(u,a,ang,dist,C)=>{const cv=hasSP(u,'curveball')?2.4:0,dm=a.dmg*C.D,HB=C.HB;
  const pop=(x,z,ex)=>{const b0={src:u,team:u.team,dx:0,dz:1,spd:a.splitSpd,dmg:dm,r:.33,col:a.col,hit:new Set(ex?[ex]:[]),isSup:false,splitFixed:true,splitDmg:1,splitCurve:cv,splitR:a.splitR*(cv&&bufS(u,'curveball')?1.3:1),splitSpd:a.splitSpd,splitW:.11};
    splitAt(b0,x,z,a.n,false);explode(x,z,{rad:TL(1),dmg:dm,team:u.team,src:u,noFx:true});burst(x,1,z,10,[.55,.9,.35],3,.4,.35,true)};
  const go=(x,z,ex)=>{pop(x,z,ex);if(HB)setTimeoutG(.6,()=>pop(x,z,null))};
  shoot(u,ang,a.speed,Math.min(C.R,Math.max(2,dist)),0,a.r,a.col,{stick:(b,t)=>go(b.x,b.z,t),onEnd:b=>go(b.x,b.z,null)});SFX.shot('lob')};
