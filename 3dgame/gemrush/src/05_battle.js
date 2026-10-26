// ================= 戦闘の状態 =================
const G={t:0,units:[],bullets:[],lobs:[],items:[],turrets:[],zones:[],safes:[],heads:[],mines:[],pets:[],rule:'gem',M:{},mineT:3,time:150,cd:null,cdTeam:-1,state:'menu',over:false,shake:0,mode:'gem',safeR:999,alive:0};
const UR=.62;
// 姿が2つあるキャラ（[ふだん, もう1つ]）。もう1つの姿のときは atk2・sup2・hp2・spd2・reload2・range2・ammo2 を使う
const FORMS={ranran:['clyde','bonnie'],meg:['meg','mech'],rt:['rt','head']};
const altForm=u=>!!FORMS[u.bt]&&u.form===FORMS[u.bt][1];
const curAtk=u=>{const B=BT[u.bt];return altForm(u)&&B.atk2?B.atk2:B.atk},curSup=u=>{const B=BT[u.bt];return altForm(u)&&B.sup2?B.sup2:B.sup};
// kit = {gad:0/1/-1, sp:0/1/-1, hyper:true/false, buf:{gad,sp,hyper}}
function mkUnit(bt,team,isMe,name,spawn,lv,skin,kit){const B=BT[bt];const u={bt,team,isMe,name,spawn,lv:lv||1,pw:0,x:0,z:0,mx:0,mz:0,vx:0,vz:0,kx:0,kz:0,face:0,
  hp:1,maxHp:1,dm:1,ammo:3,sup:0,hyp:0,hyperT:-9,lastHurt:-9,lastAtk:-9,dead:false,respT:0,gems:0,revealT:0,inv:0,act:null,walkT:0,flash:0,atkAnim:0,slowT:0,slowP:.45,stunT:0,place:0,
  kills:0,deaths:0,dmg:0,gemsGot:0,kit:kit||{gad:-1,sp:-1,hyper:false},gadCD:0,shield:0,shDec:0,gshield:0,redT:0,red:0,stage:0,stageBoostT:0,form:FORMS[bt]?FORMS[bt][0]:'',spinT:0,outT:-9,bf:{},
  ai:{path:[],pt:0,think:0,tgt:null,see:0,fireT:0,strafe:rr(0,TAU),mode:'',stuck:0,lx:0,lz:0},seen:true};
  u.kit.gears=[];const ring=G.mode==='br'?0xff4d5a:TEAMCOL[team];u.sk=skin;u.ringCol=ring;
  // 姿ごとの見た目
  if(FORMS[bt]){u.forms={};for(const f of FORMS[bt]){u.forms[f]=mkModel(bt,ring,isMe,skin,f);u.forms[f].g.visible=false}u.m1=u.forms[FORMS[bt][0]];u.m2=u.forms[FORMS[bt][1]];u.m=u.m1;u.m.g.visible=true}
  else u.m=mkModel(bt,ring,isMe,skin);
  // 本家の画面と同じくらいの大きさに（1マスくらいの幅）
  for(const m of u.forms?Object.values(u.forms):[u.m])m.g.scale.multiplyScalar(BSCALE);
  u.kit.buf=u.kit.buf||{};if(!BUF[bt])u.kit.buf={};calcStats(u);spawnAt(u);if(B.startSup)u.sup=1;return u}
const hasSP=(u,id)=>!!u&&!!u.kit&&u.kit.sp>=0&&!!BT[u.bt]&&!!BT[u.bt].sp&&BT[u.bt].sp[u.kit.sp]&&BT[u.bt].sp[u.kit.sp].id===id,hasGear=()=>false,hyperOn=u=>!!u&&G.t<u.hyperT;
// バフィー：bufG=そのガジェットのバフィー、bufS=そのスターパワーのバフィー、bufH=ハイパーバフィー
const hasBuf=(u,k)=>!!(u&&u.kit&&u.kit.buf&&u.kit.buf[k]&&BUF[u.bt]);
const bufG=(u,id)=>hasBuf(u,'gad')&&u.kit.gad>=0&&BT[u.bt].gad[u.kit.gad].id===id,bufS=(u,id)=>hasBuf(u,'sp')&&hasSP(u,id),bufH=u=>hasBuf(u,'hyper')&&u.kit.hyper;
const hasGad=(u,id)=>!!u&&!!u.kit&&u.kit.gad>=0&&BT[u.bt].gad[u.kit.gad].id===id;
const hyperTime=u=>HYP.time+(bufH(u)?2:0),silenced=u=>(u.silT||0)>G.t||(u.fearT||0)>G.t;
const gadCool=(u,g)=>g.cd;
// ---- 時間つきの効果（kind: spd=移動速度の倍率 / rel=リロードの速さの倍率 / dmg=攻撃力の倍率 / red=受けるダメージの倍率 / sc=必殺技のたまりの倍率）----
function buf(u,kind,key,v,dur){if(!u||u.dead)return;(u.bf||(u.bf={}))[kind+':'+key]={kind,v,t:G.t+dur}}
function bufMul(u,kind){let m=1;const f=u.bf;if(!f)return 1;for(const k in f){const b=f[k];if(b.t<G.t){delete f[k];continue}if(b.kind===kind)m*=b.v}return m}
const bufOn=(u,kind,key)=>{const b=u.bf&&u.bf[kind+':'+key];return!!b&&b.t>=G.t};
const baseHp=u=>{const B=BT[u.bt];return altForm(u)&&B.hp2?B.hp2:B.hp};
function calcStats(u){const k=LVM(u.lv);const mh=Math.round((Math.round(baseHp(u)*k)*(u.kit&&hasSP(u,'sponge')?1.1:1)+u.pw*400)*(1+.0625*(u.hvN||0))),r=u.maxHp>1?u.hp/u.maxHp:1;u.maxHp=mh;u.hp=Math.min(mh,Math.max(1,Math.round(mh*r)));u.dm=k*(1+.1*u.pw)}
function spawnAt(u){const B=BT[u.bt];[u.x,u.z]=u.spawn;u.poison=null;u.invisT=0;u.strongT=0;u.pgT=0;u.glT=0;u.bandT=0;u.hvN=0;u.godT=0;u.ccT=0;u.silT=0;u.fearT=0;u.rootT=0;u.charmT=0;u.bf={};u.supLeft=0;u.flyT=0;u.ghostT=0;u.rage=0;u.mark=null;
  u.healCutT=0;u.weakT=0;u.addSpdT=0;u.shDec=0;u.stalk=false;u.charge=0;u.charging=false;u.focusT=0;u.streaming=false;u.hrT=0;u.dsT=0;u.longT=0;u.enrT=0;u.jumpMode=false;
  if(FORMS[u.bt]&&u.form!==FORMS[u.bt][0])setForm(u,FORMS[u.bt][0],true);
  if(u.bt==='meg'){setForm(u,'mech',true);u.megHp=null}
  u.maxHp=1;calcStats(u);u.hp=u.maxHp;u.ammo=maxAmmo(u);u.dead=false;u.inv=G.mode==='br'?0:1.6;u.act=null;u.kx=u.kz=0;u.slowT=u.stunT=0;
  u.stage=0;if(hasSP(u,'icecold'))u.sup=1;u.shield=0;u.redT=0;u.spinT=0;u.face=u.z>0?Math.PI:0;u.faceT=u.face;u.m.g.rotation.y=u.face;u.m.g.visible=true}
// 姿を変える（quiet=見た目だけ）。体力は「へっている分」をそのまま引きつぐ
function setForm(u,f,quiet){if(u.form===f)return;const miss=u.maxHp>1?u.maxHp-u.hp:0;u.form=f;if(u.m)u.m.g.visible=false;u.m=u.forms&&u.forms[f]||u.m;u.m.g.visible=!u.dead;u.m.g.position.set(u.x,0,u.z);u.m.g.rotation.y=u.face||0;
  u.maxHp=1;calcStats(u);if(!quiet)u.hp=clamp(u.maxHp-miss,1,u.maxHp);else u.hp=u.maxHp;u.ammo=Math.min(u.ammo,maxAmmo(u))}
// 移動速度・リロード・攻撃力の倍率
const inWater=u=>cell(cx(u.x),cz(u.z))==='~';
const enraged=u=>u.bt==='alli'&&(u.enrT||0)>G.t;
function unitSpeed(u){const B=BT[u.bt];let s=altForm(u)&&B.spd2?B.spd2:B.spd;
  if(u.bt==='soda'){const st=sodaStage(u);if(st>=4)s=SPD(984);else if(st>=1)s=SPD(855)}
  if(u.bt==='ash'){const r=u.rage||0;if(r>=2/3)s=SPD(850);else if(r>=1/3)s=SPD(800)}
  if(u.flyT>G.t)s=B.sup.spd||s;
  if(u.addSpdT>G.t)s+=u.addSpd||0;
  if(hasSP(u,'slick'))s*=1.13;if(hyperOn(u))s*=1+HYP.spd;s*=bufMul(u,'spd');
  if(u.bt==='gigi'&&u.streaming)s*=1+B.atk.spdUp;
  if(u.ghostT>G.t)s*=1+B.sup.spd;
  if(u.bt==='alli'&&enraged(u)){const t=autoTarget(u,TL(14));if(t&&(u.mx*(t.x-u.x)+u.mz*(t.z-u.z))>0)s*=1.3}
  if(u.bt==='angelo'&&hasSP(u,'flow')&&inWater(u))s*=1.25;
  if(u.bt==='bibi'&&hasSP(u,'homerun')&&u.hrT>=BT.bibi.atk.hr)s*=1.12;
  if(u.bt==='ricochet'&&hasSP(u,'roboretreat')){const f=u.hp/u.maxHp;if(bufS(u,'roboretreat')){if(f<.4)s*=1.35+(.15*clamp((.4-f)/.3,0,1))}else if(f<.4)s*=1.35}
  if(hasSP(u,'plugged')&&myBooster(u)&&Math.hypot(myBooster(u).x-u.x,myBooster(u).z-u.z)<TL(7))s*=1.25;
  else{const b=boosterFor(u);if(b&&b.src!==u&&bufS(b.src,'plugged'))s*=1.1}
  if(u.invisT>G.t&&hasSP(u,'smoketrails'))s*=1.3;
  if(u.bt==='meg'&&bufS(u,'forcefield')&&bufOn(u,'red','ff'))s*=1.2;
  if(u.bt==='amber'&&bufS(u,'wildflames')&&nearOil(u))s*=1.1;
  if(u.slowT>0)s*=1-(u.slowP||.45);if(u.fearT>G.t)s*=.6;if(u.rootT>G.t)s=0;return s}
function reloadOf(u){const B=BT[u.bt];let r=altForm(u)&&B.reload2?B.reload2:B.reload;
  if(u.bt==='alli'&&u.jumpMode)r=B.reload2;
  if(hasSP(u,'berserker')&&u.hp<u.maxHp*.6)r/=2;if(hasSP(u,'autoreload'))r*=.91;r/=bufMul(u,'rel');
  if(u.stageBoostT>0&&bufG(u,'powersurge'))r/=1.3;if(u.bt==='kagerou'&&u.outT>G.t)r/=1.5;
  if(u.bt==='ash'&&hasSP(u,'madasheck'))r/=1+.4*(u.rage||0);
  if(enraged(u)&&hasSP(u,'betterrun'))r/=1.25;
  if(u.bt==='max'&&hasSP(u,'runngun')&&Math.hypot(u.mx,u.mz)>.2)r/=1.1538;
  if(hyperOn(u)&&bufH(u)){if(u.bt==='piko')r=.1;else if(u.bt==='jack')r=1.4;else if(u.bt==='griff')r=1.7}
  return r}
function dmgMul(u){if(!u||u.isTurret||u.isHead||u.isPet)return u&&u.dm||1;let m=u.dm;
  if(u.poison&&u.poison.src&&hasSP(u.poison.src,'extratoxic')&&G.t<=u.poison.until)m*=.85;if((u.weakT||0)>G.t)m*=.85;
  if(hyperOn(u))m*=1+HYP.dmg;if(u.pgT>G.t)m*=1.15;m*=bufMul(u,'dmg');const b=boosterFor(u);if(b)m*=1+b.boost;
  if(bufS(u,'extratoxic')){let n=0;for(const o of G.units)if(!o.dead&&o.poison&&o.poison.src===u&&G.t<=o.poison.until)n++;m*=1+.05*n}
  if(u.bt==='ash'){const r=u.rage||0;m*=r>=2/3?2:r>=1/3?1.5:1}return m}
const sodaStage=u=>u.bt!=='soda'?0:Math.min(3,u.stage+(u.stageBoostT>0?1:0))+(hyperOn(u)?1:0);
const myBooster=u=>G.turrets.find(t=>t.booster&&t.src===u&&!t.dead);
function boosterFor(u){for(const t of G.turrets)if(t.booster&&!t.dead&&t.team===u.team&&Math.hypot(t.x-u.x,t.z-u.z)<t.effR)return t;return null}

// ---- 壁や水との当たり判定（円とタイルの四角）----
// 水の上を動けるキャラ（アリー・アンジェロ・シェイド・分かれたR-Tの頭）／障害物をすり抜ける（シェイドの必殺技・空を飛ぶジャネット）
const canSwim=u=>!!u&&(!!(BT[u.bt]&&BT[u.bt].swim)||u.bt==='rt'&&u.form==='head'||(u.flyT||0)>G.t);
const ghostly=u=>!!u&&((u.ghostT||0)>G.t||(u.flyT||0)>G.t);
function collide(u,swim){const sw=swim||canSwim(u);if(!ghostly(u)){const c0=cx(u.x),r0=cz(u.z);for(let r=r0-1;r<=r0+1;r++)for(let c=c0-1;c<=c0+1;c++){if(!blockMove(c,r))continue;if(sw&&cell(c,r)==='~')continue;
    const x0=tx(c)-TS/2,x1=x0+TS,z0=tz(r)-TS/2,z1=z0+TS,px=clamp(u.x,x0,x1),pz=clamp(u.z,z0,z1),dx=u.x-px,dz=u.z-pz,d=Math.hypot(dx,dz);
    if(d<UR){if(d>1e-4){u.x=px+dx/d*UR;u.z=pz+dz/d*UR}else{const ex=[u.x-x0,x1-u.x,u.z-z0,z1-u.z],m=Math.min(...ex),k=ex.indexOf(m);if(k===0)u.x=x0-UR;else if(k===1)u.x=x1+UR;else if(k===2)u.z=z0-UR;else u.z=z1+UR}}}}
  u.x=clamp(u.x,-HALFX+UR,HALFX-UR);u.z=clamp(u.z,-HALFZ+UR,HALFZ-UR)}
function walkable(x,z,swim){const c=cx(x),r=cz(z);return (!blockMove(c,r)||swim&&cell(c,r)==='~')&&Math.abs(x)<HALFX-.5&&Math.abs(z)<HALFZ-.5}
function nearestOpen(x,z,swim){if(walkable(x,z,swim))return[x,z];for(let rad=1;rad<8;rad++)for(let a=0;a<16;a++){const nx=x+Math.cos(a/16*TAU)*rad*1.2,nz=z+Math.sin(a/16*TAU)*rad*1.2;if(walkable(nx,nz,swim))return[nx,nz]}return[x,z]}
const enemy=(a,b)=>a.team!==b.team;
function targets(){return G.turrets.length||G.safes.length||G.heads.length||G.pets.length?G.units.concat(G.turrets.filter(t=>!t.noTarget),G.safes,G.heads,G.pets):G.units}
// 空中（ジャンプ・飛行）にいるとダメージを受けない
const airborne=t=>!!(t.act&&t.act.type==='jump')||(t.flyT||0)>G.t;

// ---- ダメージ・回復・倒れる ----
// fx: {slow,slowP,stun,poison,ticks,burn,sc（必殺技のたまりを固定）,mark（R-Tのマークの追加分）,noMark}
function hurt(t,dmg,src,isSup,fx){if(t.dead||t.inv>0||G.over)return;if(airborne(t)&&!(fx&&fx.dot))return;
  if((t.godT||0)>G.t){if(Math.random()<.4)burst(t.x,1.2,t.z,4,[1,1,.8],2,.35,.25,true);return}fx=fx||{};const s0=src&&(src.isTurret||src.isHead||src.isPet)?src.src:src;const raw=dmg;
  if(s0&&s0.kit&&hasSP(s0,'carrion')&&t.hp<=t.maxHp*.5)dmg*=1.3;
  if(t.immuneT>0){fx=Object.assign({},fx,{slow:0,stun:0,poison:0})}if(t.ccT>0)fx=Object.assign({},fx,{slow:0,stun:0});
  if(t.kit)dmg*=bufRed(t);if(t.legs)dmg*=1-(hasSP(t.src,'recording')?.55:BT.rt.sup.legRed);dmg=Math.round(dmg);
  // ファングのディバインソールズ：3秒ごとに次の攻撃を90%カット（最大で最大体力の10%）
  if(t.kit&&hasSP(t,'divinesoles')&&G.t-(t.dsT||0)>=3&&dmg>0){const cut=Math.min(dmg*.9,t.maxHp*.1);dmg=Math.round(dmg-cut);t.dsT=G.t;GLOW.add(t.x,1.4,t.z,0,.8,0,.8,[1,.9,.4],.4,0)}
  let shown=dmg;
  if(t.psT>G.t&&!t.psHit&&dmg>0){t.psHit=true;dmg=Math.round(dmg*.5);shown=dmg;t.ammo=Math.min(maxAmmo(t),t.ammo+1);if(bufG(t,'powershield')){t.gadCD*=.5;if(t.isMe)note('パワーシールド：クールダウン半分！',1.2)}}
  if(t.shield>0){const a=Math.min(t.shield,dmg);t.shield-=a;dmg-=a;if(t.shield<=0)t.shDec=0}
  t.hp-=dmg;t.lastHurt=G.t;t.flash=1;t.revealT=Math.max(t.revealT||0,.6);if(t.charging&&(fx.stun||fx.knock)){t.charging=false;t.charge=0}
  if(fx.slow&&!t.isTurret&&!t.isSafe){t.slowT=Math.max(t.slowT||0,fx.slow);t.slowP=Math.max(fx.slowP||.45,t.slowT>fx.slow?t.slowP||0:0)}
  if(fx.stun&&!t.isTurret&&!t.isSafe){t.stunT=Math.max(t.stunT||0,fx.stun);if(t.act&&t.act.type!=='jump')t.act=null;burst(t.x,2.2,t.z,6,[1,1,.5],2,.3,.5,true)}
  const s=s0;if(fx.poison)poisonU(t,fx.poison,(fx.ticks||4)+(s&&bufS(s,'carrion')?1:0),s,fx.burn?'burn':'poison',fx.cut);
  // 受けたダメージで必殺技がたまる（タンク・アッシュ）・アッシュの怒り
  if(t.kit&&s&&s.team!==t.team&&shown>0){const TB=BT[t.bt];if(TB.tank){const g=shown/(TB.tank*t.maxHp);t.sup=Math.min(1,t.sup+g);if(t.kit.hyper&&!hyperOn(t))t.hyp=Math.min(1,t.hyp+g*(TB.hm||.3))}
    if(t.bt==='ash')t.rage=Math.min(1,(t.rage||0)+shown/(TB.rage.hurt*t.maxHp))}
  // 攻撃した側の必殺技・ハイパーチャージ
  if(s&&!s.isTurret&&s.kit){s.dmg+=shown;if(!s.dead&&!t.noCharge&&!fx.mark&&!fx.dot){const SB=BT[s.bt];let gn=0;
      if(fx.sc!=null)gn=fx.sc;else if(isSup){gn=SB.fixS!=null?SB.fixS:SB.superDmgS?raw/(SB.superDmgS*(s.dm||1)):0}else{const basis=altForm(s)&&SB.superDmg2?SB.superDmg2:SB.superDmg;gn=SB.fixA!=null?SB.fixA:basis?raw/(basis*(s.dm||1)):0}
      gn*=scMul(s);if(gn>0){s.sup=Math.min(1,s.sup+gn);if(s.kit.hyper&&!hyperOn(s))s.hyp=Math.min(1,s.hyp+gn*(SB.hm||.3))}}
    if(!s.dead&&t.tbBy===s&&G.t<t.tbT&&shown>0)healU(s,shown*.25,s)}
  if(shown>0)dmgNum(t,shown,t.isMe?'me':isSup?'big':s&&s.isMe?'mine':'');SFX.hit(t.isMe||(s&&s.isMe));
  // R-Tのマーク：マークされた敵に当てると追加ダメージ
  if(!fx.mark&&!fx.noMark&&t.mark&&t.mark.t>G.t&&s&&s.team===t.mark.by.team&&shown>0){const m=t.mark;const by=m.by;if(s!==by)t.mark=null;setTimeoutG(0,()=>{if(!t.dead)hurt(t,BT.rt.atk.dmg*LVM(by.lv),by,true,{mark:true});burst(t.x,2,t.z,10,[1,.3,.3],3,.4,.4,true)})}
  if(t.isTurret){t.lastBy=s;if(t.hp<=0)killTurret(t);return}
  if(t.isSafe){safeHit(t);return}
  if(t.isHead){if(t.hp<=0)killHead(t,false);return}
  if(t.isPet){if(t.hp<=0)killPet(t);return}
  if(t.kit&&hasSP(t,'bandaid')&&t.hp>0&&t.hp<t.maxHp*.4&&G.t>(t.bandT||0)){t.bandT=G.t+15;healU(t,t.maxHp*.3,t);burst(t.x,1.4,t.z,14,[.5,1,.6],3,.6,.5,true);if(bufS(t,'bandaid'))buf(t,'spd','band',1.15,3)}
  // メグのメカがこわれた → 生身にもどる
  if(t.hp<=0&&t.bt==='meg'&&t.form==='mech'){mechBreak(t);return}
  if(t.hp<=0)killUnit(t,s)}
function killUnit(t,s){t.hp=0;t.dead=true;t.deaths++;t.m.g.visible=false;t.act=null;t.respT=respawnTime();t.hyperT=-9;t.spinT=0;t.supLeft=0;t.flyT=0;t.ghostT=0;t.streaming=false;t.charging=false;
  for(const p of G.turrets.slice())if(p.src===t&&p.legs)killTurret(p);
  burst(t.x,1,t.z,26,t.team===0?[.35,.65,1]:[1,.35,.4],7,.7,.8,true);burst(t.x,.6,t.z,18,[.9,.9,.9],4,.9,1);SFX.die();
  const drop=(kind,n)=>{for(let i=0;i<n;i++){const a=rr(0,TAU),d=rr(.6,2.6);const [gx,gz]=nearestOpen(t.x+Math.cos(a)*d,t.z+Math.sin(a)*d);addItem(kind,t.x,t.z,gx,gz)}};
  if(t.gems>0){drop('gem',t.gems);t.gems=0}
  if(G.mode==='br'){drop('cube',Math.max(1,t.pw));G.alive=G.units.filter(u=>!u.dead).length;t.place=G.alive+1}
  const killer=s&&s.isTurret?s.src:s;modeKill(t,killer);if(killer&&killer.kit){killer.kills++;feed(killer,t);if(hasSP(killer,'harvest'))healU(killer,killer.maxHp*.2,killer);killBuf(killer,t)}else feed(null,t)}
// 受けるダメージの倍率（ダメージカット）
function bufRed(t){let m=1-(hyperOn(t)?HYP.red:0);m*=bufMul(t,'red');if(t.redT>0)m*=1-t.red;
  if(hasSP(t,'toughguy')&&t.hp<t.maxHp*.3)m*=.7;if(t.act&&t.act.type==='charge'&&hyperOn(t))m*=.2;
  if(t.mrT>0&&bufS(t,'meteorrush'))m*=.85;if(t.act&&t.act.long&&bufS(t,'coiled')&&G.t-t.act.t0<.5)m*=.65;
  if(bufS(t,'sponge')&&t.hp>t.maxHp*.5)m*=.9;if(t.bt==='bibi'&&hasSP(t,'stance')&&t.hrT>=BT.bibi.atk.hr)m*=.8;
  if(t.ghostT>G.t&&hasSP(t,'hoodie'))m*=.7;if(t.act&&t.act.collect&&hasSP(t,'masstax'))m*=.4;
  if(t.bt==='rt'&&t.form==='head'&&hasSP(t,'recording'))m*=.75;if(t.act&&t.act.chuck)m*=.65;return m}
// 必殺技のたまりの倍率
function scMul(s){let m=bufMul(s,'sc');if(s.stageBoostT>0)m*=1.3;if(s.bt==='kagerou'&&s.outT>G.t)m*=2.5;
  if(s.bt==='gigi'&&hasSP(s,'plie')&&G.t-s.lastHurt>=2)m*=1.3;
  for(const t of G.turrets)if(t.totem&&!t.dead&&t.team===s.team&&Math.hypot(t.x-s.x,t.z-s.z)<t.effR){m*=1.5;break}return m}
// 敵を倒したときの効果
function killBuf(k,victim){if(!k||k.dead||!k.kit)return;
  if(hasSP(k,'powergrab')){k.pgT=G.t+12;if(bufS(k,'powergrab'))for(let i=1;i<=6;i++)setTimeoutG(i*.5,()=>healU(k,2240*k.dm/6,k));if(k.isMe)note('パワーグラブ：12秒間 攻撃力アップ！',1.2)}
  if(bufS(k,'berserker')&&k.hp<k.maxHp*.6){k.sup=1;if(k.isMe)note('バーサーカー：必殺技が満タン！',1.2)}
  if(bufS(k,'toughguy')&&k.hp<k.maxHp*.3)k.godT=G.t+.5;
  if(bufS(k,'fisticuffs'))healU(k,k.maxHp*.2,k);
  if(bufS(k,'harvest')){k.hvN=(k.hvN||0)+1;calcStats(k);if(k.isMe)note('クリーピーハーベスト：最大体力アップ×'+k.hvN,1.2)}
  if(k.bt==='fang'&&hasSP(k,'freshkicks')&&k.act&&k.act.fang){k.sup=1;k.act.fresh=true;if(k.isMe)note('フレッシュキックス：必殺技が満タン！',1.2)}}
function healU(t,v,src){if(t.dead||t.isHead||t.isSafe||t.hp>=t.maxHp)return;if((t.healCutT||0)>G.t)v*=1-(t.healCut||.5);const h=Math.min(Math.round(v),t.maxHp-t.hp);if(h<1)return;t.hp+=h;const hs=src||t;hs.healed=(hs.healed||0)+h;dmgNum(t,'+'+h,'heal')}
// 体力をこえた回復（あまりはシールドになる・最大cap・decay=1秒にへる量の割合）
function overheal(t,v,cap,decay){if(t.dead)return;if((t.healCutT||0)>G.t)v*=1-(t.healCut||.5);const h=Math.max(0,Math.min(v,t.maxHp-t.hp));if(h>=1){t.hp+=h;dmgNum(t,'+'+Math.round(h),'heal')}const over=v-h;
  if(over>0){t.shield=Math.min(cap,(t.shield||0)+Math.round(over));t.shDec=Math.max(t.shDec||0,t.shield*(decay||.2))}}
// 自然回復：3秒（ティックのウェルオイルドは1秒・怒ったアリーのリザードリムズは1.5秒）攻撃も被弾もしないと毎秒13%
function regen(u,dt){if(u.dead)return;const wait=hasSP(u,'welloiled')?1:enraged(u)&&hasSP(u,'lizard')?1.5:3,on=G.t-u.lastHurt>wait&&G.t-u.lastAtk>wait&&!u.charging&&!(u.flyT>G.t);
  if(on&&!u._rg&&bufS(u,'welloiled'))healU(u,500*u.dm,u);u._rg=on;if(on&&u.hp<u.maxHp)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.13*dt*((u.healCutT||0)>G.t?1-(u.healCut||.5):1))}

// ---- ジェムとパワーキューブ ----
// 本家のエメラルドハントのジェム：大きな紫の宝石（上が平らな六角のカット）。黒いふちと光で遠くからでも見える
const BSCALE=1.28;
const gemGeo=(()=>{const P=[],top=.36,gird=.62,yt=.34,yb=-.78,n=6;const v=(a,r,y)=>[Math.cos(a)*r,y,Math.sin(a)*r];
  for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU,T0=v(a0,top,yt),T1=v(a1,top,yt),G0=v(a0,gird,0),G1=v(a1,gird,0);P.push([0,yt,0],T1,T0, T0,T1,G1, T0,G1,G0, G0,G1,[0,yb,0])}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P.flat(),3));g.computeVertexNormals();return g})(),
  gemMat=M(0xb44dff,{emissive:0x6a1fb0,flatShading:true}),gemOut=new THREE.MeshBasicMaterial({color:0x1a0a2a,side:THREE.BackSide}),
  gemGlowT=ctex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'rgba(230,170,255,.95)');r.addColorStop(.45,'rgba(190,90,255,.45)');r.addColorStop(1,'rgba(160,60,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)}),
  gemGlowM=new THREE.SpriteMaterial({map:gemGlowT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),cubeGeo=new THREE.BoxGeometry(.5,.5,.5),cubeMat=M(0x57d68d,{emissive:0x1f7a45}),ammoMat=M(0xffc53d,{emissive:0x7a5200}),spiritMat=M(0xbfefff,{emissive:0x5aa0c0,transparent:true,opacity:.85});
const spiritGeo=new THREE.SphereGeometry(.32,12,10);
// kind: gem / cube / ammo（8ビットのブースターが出す弾薬：同じチームだけ拾える・8秒で消える）/ spirit（ガスの魂：同じチームが拾うと回復）
function itemMesh(kind){const m=new THREE.Mesh(kind==='gem'?gemGeo:kind==='spirit'?spiritGeo:cubeGeo,kind==='gem'?gemMat:kind==='ammo'?ammoMat:kind==='spirit'?spiritMat:cubeMat);m.castShadow=true;if(kind==='gem'){const o=new THREE.Mesh(gemGeo,gemOut);o.scale.setScalar(1.14);m.add(o);const gl=new THREE.Sprite(gemGlowM);gl.scale.setScalar(2.6);gl.renderOrder=3;m.add(gl);m.scale.setScalar(1.3)}if(kind==='ammo')m.scale.set(.6,.9,.6);return m}
function addItem(kind,x0,z0,x1,z1){const m=itemMesh(kind);scene.add(m);const it={kind,x:x1,z:z1,x0,z0,t:0,m,ph:rr(0,TAU)};G.items.push(it);return it}
function updItems(dt){if(!G.over&&G.rule==='gem'){G.mineT-=dt;if(G.mineT<=0&&G.items.filter(g=>g.kind==='gem').length<29){G.mineT=7;const a=rr(0,TAU),d=rr(1.6,3.2);const [gx,gz]=nearestOpen(MX+Math.cos(a)*d,MZ+Math.sin(a)*d);addItem('gem',MX,MZ,gx,gz);burst(MX,.8,MZ,12,[.8,.5,1],4,.5,.6,true);SFX.gemSpawn()}}
  for(let i=G.items.length-1;i>=0;i--){const g=G.items[i];g.t+=dt;const k=Math.min(1,g.t/.5);
    if(g.kind==='spirit'&&g.follow&&k>=1){let best=null,bd=1e9;for(const o of G.units)if(!o.dead&&o.team===g.team){const d=Math.hypot(o.x-g.x,o.z-g.z);if(d<bd){bd=d;best=o}}if(best&&bd>.3){g.x+=(best.x-g.x)/bd*2*dt;g.z+=(best.z-g.z)/bd*2*dt}}
    const x=lerp(g.x0,g.x,k),z=lerp(g.z0,g.z,k),y=(g.kind==='gem'?1:.55)+Math.sin(k*Math.PI)*1.6+Math.sin(G.t*3+g.ph)*(g.kind==='gem'?.18:.12);
    g.m.position.set(k>=1?g.x:x,y,k>=1?g.z:z);g.m.rotation.y+=dt*2.2;if(g.kind==='cube')g.m.rotation.x+=dt*1.3;
    if(g.life!=null&&g.t>g.life){scene.remove(g.m);G.items.splice(i,1);continue}if(k<1)continue;
    for(const u of G.units){if(u.dead)continue;if(g.kind==='ammo'&&(u.team!==g.team||u.ammo>=maxAmmo(u)-.02))continue;if(g.kind==='spirit'&&(u.team!==g.team||u.hp>=u.maxHp))continue;if(Math.hypot(u.x-g.x,u.z-g.z)<1.15){scene.remove(g.m);G.items.splice(i,1);
      if(g.kind==='ammo'){u.ammo=Math.min(maxAmmo(u),u.ammo+1);if(u.isMe)tn(1200,.08,.1,'square');burst(g.x,.8,g.z,6,[1,.8,.3],3,.35,.35,true);break}
      if(g.kind==='spirit'){healU(u,g.heal||800,g.src);burst(g.x,.8,g.z,12,[.7,.95,1],3,.45,.45,true);break}
      if(g.kind==='gem'){u.gems++;u.gemsGot++;if(u.team===0)SFX.gem();if(u.isMe)gemFx(u);burst(g.x,.8,g.z,8,[.85,.55,1],3,.4,.4,true)}
      else{u.pw++;u.cubes=(u.cubes||0)+1;u.hp+=400;calcStats(u);if(u.isMe){SFX.gem();note('パワーアップ！ 体力と攻撃力が上がった',1.4)}burst(g.x,.8,g.z,10,[.5,1,.6],3,.5,.45,true)}break}}}}
const teamGems=t=>G.units.reduce((s,u)=>s+(u.team===t?u.gems:0),0);
