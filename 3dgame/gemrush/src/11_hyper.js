// ================= ハイパーチャージ =================
function hyperGo(u){if(u.dead||!u.kit.hyper||u.hyp<1||!supReady(u)||silenced(u)||hyperOn(u))return false;u.hyp=0;u.hyperT=G.t+hyperTime(u);SFX.superReady();burst(u.x,1,u.z,30,[.8,.4,1],6,.7,.6,true);
  if(u.bt==='rt'&&u.form==='head')rtRadars(u);
  if(u.isMe){big('ハイパーチャージ！',1,'#d59bff');note('移動速度+20%・攻撃力+5%・ダメージ5%カット'+(bufH(u)?'（バフィーで+2秒）':''),2)}return true}
// 毎フレームの状態（時間で切れる効果など）
function kitTick(u,dt){const B=BT[u.bt];u.gadCD=Math.max(0,u.gadCD-dt);u.stunT=Math.max(0,u.stunT-dt);u.redT=Math.max(0,u.redT-dt);u.stageBoostT=Math.max(0,u.stageBoostT-dt);
  u.immuneT=Math.max(0,(u.immuneT||0)-dt);statusTick(u);
  for(const k of['ccT','mrT'])if(u[k]>0)u[k]=Math.max(0,u[k]-dt);
  windTick(u,dt);chargeTick(u,dt);streamTick(u,dt,u.streamAng);flyTick(u,dt);
  // シールドがだんだんへる
  if(u.shield>0&&u.shDec>0){u.shield=Math.max(0,u.shield-u.shDec*dt);if(u.shield<=0)u.shDec=0}
  // レオン：インビジヒール／ローサ：プラントライフ
  const iv=u.invisT>G.t&&!u.dead;if(iv&&hasSP(u,'invisiheal')&&u.bt==='shinobu')healU(u,u.maxHp*.2*dt,u);
  if(!u.dead&&u.inBush&&hasSP(u,'plantlife'))healU(u,u.maxHp*.05*dt,u);
  if(u.bt==='jet'&&bufS(u,'rocket4')&&!u.dead&&(u.r4T||0)<6){u.r4T=(u.r4T||0)+dt;if(u.r4T>=6&&u.isMe)note('ロケットNo.4：次の攻撃の射程+2マス',1)}
  if(u.spinT>0){u.spinT-=dt;u.m.g.rotation.y+=dt*18}
  // 時間でたまる必殺技（エドガー・ダリル毎秒3.3%）・ボニーの姿のとき（毎秒87.5%）
  if(B.autoSup&&!u.dead){u.sup=Math.min(1,u.sup+B.autoSup*dt*scMul(u));if(u.kit.hyper&&!hyperOn(u))u.hyp=Math.min(1,u.hyp+B.autoSup*dt*B.hm)}
  if(u.bt==='ranran'&&u.form==='bonnie'&&!u.dead)u.sup=Math.min(1,u.sup+dt*.875);
  // シェイド：6マス以内に敵がいると必殺技がたまる（毎秒2.869%×(人数+1)）
  if(B.near&&!u.dead){let n=0;for(const o of G.units)if(!o.dead&&o.team!==u.team&&Math.hypot(o.x-u.x,o.z-u.z)<B.near.rad)n++;if(n){const g=B.near.gain*(n+1)*dt;u.sup=Math.min(1,u.sup+g);if(u.kit.hyper&&!hyperOn(u))u.hyp=Math.min(1,u.hyp+g*B.hm)}}
  // モーティスの長い突進・ビビのホームランゲージ
  if(u.bt==='vlad')u.longT=(u.longT||0)+dt;if(u.bt==='bibi'&&!u.wind)u.hrT=Math.min(BT.bibi.atk.hr,(u.hrT||0)+dt);
  // アリー：体力50%以下の敵が見えると怒る（はなれても5秒続く）
  if(u.bt==='alli'&&!u.dead){for(const o of G.units)if(!o.dead&&o.team!==u.team&&o.hp<=o.maxHp*.5&&visibleTo(u.team,o)&&Math.hypot(o.x-u.x,o.z-u.z)<TL(14)){u.enrT=Math.max(u.enrT||0,G.t+5);break}
    if(enraged(u)&&Math.random()<.2)GLOW.add(u.x+rr(-.4,.4),2,u.z+rr(-.4,.4),0,1,0,.35,[1,.3,.3],.4,0)}
  // アッシュ：怒りは15秒で0までへる（攻撃していない・受けていないとき）
  if(u.bt==='ash'&&!u.dead&&G.t-Math.max(u.lastHurt,u.rageT||-9)>1.5)u.rage=Math.max(0,(u.rage||0)-dt/B.rage.decay);
  // ジジ：ワープしたあと3秒たつと必殺技がなくなる
  if(u.bt==='gigi'&&u.puppetT&&G.t>u.puppetT){u.puppetT=0;u.sup=0}
  // シェイド：必殺技が終わったら障害物の外へ／ハイパー：壁の中で回復
  if(u.ghostT){if(G.t>u.ghostT){u.ghostT=0;if(!walkable(u.x,u.z,true)){const [x,z]=nearestOpen(u.x,u.z,true);u.x=x;u.z=z}}else if(u.ghostH&&blockMove(cx(u.x),cz(u.z))&&cell(cx(u.x),cz(u.z))!=='~')healU(u,500*u.dm*dt,u)}
  // メグのリパーパス：6秒かけて必殺技がたまる
  if(u.repT>G.t)u.sup=Math.min(1,u.sup+dt/6);
  // マックスのスニーキースニーカー：3秒で印へもどる
  if(u.snkT&&G.t>=u.snkT)maxBlink(u);
  // ビビのビタミンブースター・メグのジョルティングボルト
  if(u.vitT>G.t)healU(u,u.maxHp*.1*dt,u);
  if(u.voltT>G.t){if(u.form==='mech')healU(u,u.maxHp*.07*dt,u);if(u.voltB)for(const o of G.units)if(!o.dead&&o.team===u.team&&o!==u&&Math.hypot(o.x-u.x,o.z-u.z)<TL(3))healU(o,o.maxHp*.11*dt,u)}
  // アンバーのダンシングフレイム
  if(u.danceT>G.t)danceTick(u,dt);
  // グリフのビジネスレジリエンス：2秒ごとにへっている体力の15%
  if(u.bt==='griff'&&hasSP(u,'resilience')&&!u.dead){u.resT=(u.resT||0)+dt;if(u.resT>=2){u.resT-=2;healU(u,(u.maxHp-u.hp)*.15,u)}}
  // こわがっている（シェイドのジャンプスケア）：にげる方へ動く
  if((u.fearT||0)>G.t){const dx=u.x-(u.fearX||0),dz=u.z-(u.fearZ||0),l=Math.hypot(dx,dz)||1;u.mx=dx/l;u.mz=dz/l}
  // コレットのナーアー：コレットの方へ歩かされる
  if((u.charmT||0)>G.t&&u.charmBy){const dx=u.charmBy.x-u.x,dz=u.charmBy.z-u.z,l=Math.hypot(dx,dz)||1;u.mx=dx/l;u.mz=dz/l}}
// 突進・ジャンプ中の動き
function updAct(u,dt){const a=u.act;a.t+=dt;
  // 振り上げ（フランケン・メグ・ジジ・ボニーの変身）：動けない（canMove以外）。スタンされると止まる
  if(a.type==='wind'){if(u.stunT>0&&!(u.ccT>0)){u.act=null;return}if(a.canMove){const sp=unitSpeed(u);u.x+=u.mx*sp*dt;u.z+=u.mz*sp*dt;collide(u)}if(a.t>=a.T){u.act=null;a.fire()}return}
  if(a.type==='charge'){const ox=u.x,oz=u.z;u.x+=a.dx*a.spd*dt;u.z+=a.dz*a.spd*dt;const c=cx(u.x),r=cz(u.z);if(cell(c,r)==='#'||breakable(c,r)){if(cell(c,r)==='#')breakWall(c,r);else hitBox(c,r,99999)}
      if(cell(c,r)==='~'||Math.abs(u.x)>HALFX-UR||Math.abs(u.z)>HALFZ-UR){u.x=ox;u.z=oz;a.t=a.T}FX.add(u.x,.4,u.z,rr(-1,1),rr(.5,1.5),rr(-1,1),.8,[.9,.8,.7],.5,2);
    for(const t of targets()){if(t.dead||t.team===u.team||a.hit.has(t))continue;if(Math.hypot(t.x-u.x,t.z-u.z)<UR*2+.4){a.hit.add(t);hurt(t,a.dmg,u,true);if(!t.isTurret&&!t.isSafe&&!(t.ccT>0)){t.kx=a.dx*12;t.kz=a.dz*12}SFX.punch()}}
    if(a.t>=a.T){u.act=null;collide(u);for(const t of G.units)if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<BT.gai.sup.endSlow){t.slowT=Math.max(t.slowT,2.5);t.slowP=Math.max(t.slowP||0,.45)}}return}
  if(a.type==='mdash'){const ox=u.x,oz=u.z;u.x+=a.dx*a.spd*dt;u.z+=a.dz*a.spd*dt;
    if(!a.ghost){const c=cx(u.x),r=cz(u.z),bl=blockMove(c,r)&&!((a.swim||canSwim(u))&&cell(c,r)==='~');
      if(bl){if(a.bounce){const hx=blockMove(cx(u.x),cz(oz)),hz=blockMove(cx(ox),cz(u.z));if(hx||!hz)a.dx=-a.dx;if(hz||!hx)a.dz=-a.dz;u.x=ox;u.z=oz}else{u.x=ox;u.z=oz;a.t=a.T}}
      else collide(u,a.swim)}
    u.x=clamp(u.x,-HALFX+UR,HALFX-UR);u.z=clamp(u.z,-HALFZ+UR,HALFZ-UR);
    FX.add(u.x,.4,u.z,rr(-1,1),rr(.5,1.5),rr(-1,1),.7,a.ghost?[.6,.5,1]:[.8,.7,.9],.45,2);
    if(a.corn!=null&&a.corn>=0){a.corn+=a.spd*dt;if(a.corn>2.4){a.corn=0;addMine(u,u.x,u.z,750*u.dm*(dmgMul(u)/u.dm),0,{kind:'corn',rad:TL(1.56),life:2,arm:.15,isSup:true})}}
    if(a.fire){a.fz=(a.fz||0)+a.spd*dt;if(a.fz>1.5){a.fz=0;addFire(u,u.x,u.z,TL(.7),200*u.dm,3,{tickT:1})}}
    if(a.drag)for(const t of a.drag)if(!t.dead&&!(t.ccT>0)){t.x=u.x+a.dx*1.3;t.z=u.z+a.dz*1.3;collide(t,true)}
    for(const t of targets()){if(t.dead||t.team===u.team||a.hit.has(t)||t.inv>0)continue;if(Math.hypot(t.x-u.x,t.z-u.z)<UR*2+.3){a.hit.add(t);const dd=a.dmgFn?a.dmgFn(t):a.dmg;
        if(a.hitFn)a.hitFn(t,dd);else if(dd>0)hurt(t,dd,u,!!a.isSup,{stun:a.stun,sc:a.sc});if(a.onHit)a.onHit(t,dd);if(a.drag&&G.units.includes(t))a.drag.add(t);
        if(a.knock&&!t.isTurret&&!t.isSafe&&!(t.ccT>0)){t.kx=a.dx*a.knock*3;t.kz=a.dz*a.knock*3}burst(t.x,1,t.z,12,[1,.6,.5],5,.6,.4,true);
        // ファング：次の敵へ（7マス以内・4人まで）
        if(a.fang){a.left--;let nx=null,bd=1e9;if(a.left>0)for(const o of G.units){if(o.dead||o.team===u.team||a.hit.has(o)||o.inv>0||!visibleTo(u.team,o))continue;const d=Math.hypot(o.x-u.x,o.z-u.z);if(d<BT.fang.sup.chain&&d<bd&&(a.ghost||los(u.x,u.z,o.x,o.z))){bd=d;nx=o}}
          if(nx){a.dx=(nx.x-u.x)/bd;a.dz=(nx.z-u.z)/bd;a.t=0;a.T=bd/a.spd+.08;u.faceT=Math.atan2(a.dx,a.dz)}else a.t=a.T;break}}}
    if(a.t>=a.T){u.act=null;if(a.ghost||a.swim){if(!walkable(u.x,u.z,canSwim(u))&&!(u.ghostT>G.t)){const [x,z]=nearestOpen(u.x,u.z,canSwim(u));u.x=x;u.z=z}}else collide(u);
      if(a.fang&&a.fresh)u.sup=1;if(a.phantom)phantom(u,a.x0,a.z0,u.x,u.z,a.dmg*.5);if(a.roll)rollEnd(u);if(a.onEnd)a.onEnd(a)}return}
  const k=Math.min(1,a.t/a.T);u.x=lerp(a.x0,a.x1,k);u.z=lerp(a.z0,a.z1,k);u.jy=Math.sin(k*Math.PI)*(a.pad?3:Math.min(4.2,1.5+a.T*2.5));
  if(a.bats){for(const t of targets())if(!t.dead&&t.team!==u.team&&!a.hit.has(t)&&Math.hypot(t.x-u.x,t.z-u.z)<1.6){a.hit.add(t);if(a.bdmg){const dd=a.bdmg*dmgMul(u);hurt(t,dd,u,true);healU(u,dd,u)}}GLOW.add(u.x,1+u.jy,u.z,0,0,0,.6,[.6,.2,.8],.3,0)}
  if(k<1)return;u.jy=0;u.act=null;collide(u);const D=dmgMul(u);
  if(a.land){a.land(u);return}
  if(a.pad){u.padCool=.6;burst(u.x,.3,u.z,10,[1,.85,.4],3,.5,.4,true);return}
  if(a.vault){if(!a.lf){u.addSpd=SPD(200);u.addSpdT=G.t+2.5}else if(bufG(u,'letsfly'))buf(u,'spd','lf',1.25,2.5);
    if(hasSP(u,'hardlanding')){const R2=TL(3),dm=745*D*(a.lf?.5:1);explode(u.x,u.z,{rad:R2,dmg:t=>Math.hypot(t.x-u.x,t.z-u.z)<TL(1.17)+UR&&!a.lf?dm*2:dm,team:u.team,src:u,isSup:true,
      onHit:(t,d)=>{if(bufS(u,'hardlanding')&&!a.lf&&d<TL(1.17)+UR&&G.units.includes(t))u.sup=Math.min(1,u.sup+.25)}})}else burst(u.x,.3,u.z,12,[.8,.7,1],4,.5,.4,true);return}
  if(a.elbow){const S2=BT.riki.sup,H=hyperOn(u);explode(u.x,u.z,{rad:S2.rad,dmg:S2.dmg*D,team:u.team,src:u,isSup:true,knock:H?0:S2.knock,pull:H?TL(2):0,breakWalls:true,big:true,
      onHit:t=>{if(hasSP(u,'elfuego')&&G.units.includes(t))poisonU(t,900/4,4,u,'burn')}});if(hasSP(u,'meteorrush')){buf(u,'spd','mr',1.25,3);u.mrT=3}return}
  if(a.swoop){ring2(u,BT.yotaka.sup);return}
  if(a.launch){const S2=BT.ranran.sup;setForm(u,'bonnie');u.ammo=maxAmmo(u);explode(u.x,u.z,{rad:S2.rad,dmg:S2.dmg*D,team:u.team,src:u,isSup:true,sc:0});if(hyperOn(u))bonnieDare(u);return}
  if(a.surge){const S2=BT.soda.sup;explode(u.x,u.z,{rad:S2.rad,dmg:S2.dmg*D,team:u.team,src:u,isSup:true,knock:S2.knock});
    if(u.stage<3){u.stage++;if(u.isMe)note('強化 段階'+u.stage+'：'+['','移動が速くなった','射程がのびた','弾が6つに分かれる'][u.stage],1.6)}
    if(a.hyper)for(let i=0;i<8;i++)shoot(u,i/8*TAU,PS(3000),TL(4),BT.soda.atk.dmg*D*.5,.22,[1,.6,.2],{},u.x,u.z);return}
  if(a.poppin){if(a.hyper)explode(u.x,u.z,{rad:TL(3),dmg:0,team:u.team,src:u,knock:TL(4),breakWalls:true,isSup:true});burst(u.x,.4,u.z,14,[1,.8,.9],4,.5,.4,true);return}}

// ダリル：転がりおわったとき
function rollEnd(u){if(hasSP(u,'hoops'))buf(u,'red','hoops',.75,2);if(hasSP(u,'rollreload'))buf(u,'rel','rr',2,5);burst(u.x,.4,u.z,12,[.9,.75,.5],4,.5,.5,true)}
// モーティスのハイパーバフィー：突進した道に、少しおくれて幻の攻撃
function phantom(u,x0,z0,x1,z1,dmg){const L=Math.max(.01,Math.hypot(x1-x0,z1-z0));setTimeoutG(.45,()=>{if(u.dead&&G.mode==='br')return;
  for(let k=0;k<=8;k++)GLOW.add(lerp(x0,x1,k/8),.8,lerp(z0,z1,k/8),0,.6,0,.9,[.65,.3,.95],.4,0);
  for(const t of targets()){if(t.dead||t.team===u.team)continue;const k=clamp(((t.x-x0)*(x1-x0)+(t.z-z0)*(z1-z0))/(L*L),0,1),d=Math.hypot(t.x-lerp(x0,x1,k),t.z-lerp(z0,z1,k));if(d<1.4){hurt(t,dmg,u,false);burst(t.x,1,t.z,8,[.7,.35,1],4,.5,.35,true)}}})}
// クロウの必殺技：飛び立つときと着地のときにナイフの輪
function ring2(u,s){const D=dmgMul(u),H=hyperOn(u);for(let i=0;i<s.n;i++)shoot(u,i/s.n*TAU,PS(3261),s.range,s.dmg*D,.18,[.55,1,.4],{poison:s.poison,ticks:3,isSup:true,pierce:H,back:H,backMul:.8,homeSrc:H},u.x,u.z);SFX.shot('snipe')}
