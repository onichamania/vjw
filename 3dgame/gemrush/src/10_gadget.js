// ================= ガジェット（クールダウン制：使うとg.cd秒たてばまた使える） =================
// GAD[id](u,g,ang,C)：C={D,BG（ガジェットバフィー）,dx,dz,en（一番近い見えている敵と距離）}。falseを返すと使えない（クールダウンにならない）
const GAD={};
function gadget(u,ang){if(u.dead||G.over||u.kit.gad<0||u.stunT>0||silenced(u)||u.flyT>G.t)return false;const g=BT[u.bt].gad[u.kit.gad];
  // もう一度押すと使える効果（レオンの入れかわり・マックスのもどる・ガスのクーキーなど）
  if(u.reGad){const rf=u.reGad;u.reGad=null;if(rf(u)!==false)return true;u.reGad=rf}
  if(u.gadCD>0||u.act&&!u.act.canAtk)return false;
  ang=ang!=null?ang:(u.faceT!=null?u.faceT:u.face);const D=dmgMul(u),BG=hasBuf(u,'gad'),dx=Math.sin(ang),dz=Math.cos(ang);
  const en=()=>{let b=null,bd=1e9;for(const o of G.units)if(!o.dead&&o.team!==u.team&&visibleTo(u.team,o)){const d=Math.hypot(o.x-u.x,o.z-u.z);if(d<bd){bd=d;b=o}}return[b,bd]};
  const f=GAD[g.id];if(!f)return false;const r=f(u,g,ang,{D,BG,dx,dz,en});if(r===false)return false;
  u.gadCD=r==='hold'?999:r==='free'?0:gadCool(u,g);u.revealT=1;burst(u.x,1.4,u.z,12,BG?[1,.6,.85]:[.5,1,.55],3,.5,.4,true);SFX.gadget();if(u.isMe)note('ガジェット：'+g.name+(BG?' ✦':''),1.2);return true}
// 「次の攻撃」系のガジェット：攻撃で使ったときにクールダウンが始まる
const gadDone=(u,i)=>{u.gadCD=gadCool(u,BT[u.bt].gad[i])};
// ---- コルト ----
GAD.speedloader=(u,g,ang,C)=>{const steal=C.BG?(t=>{if(G.units.includes(t)){const k=Math.min(.5,t.ammo);t.ammo-=k;u.ammo=Math.min(maxAmmo(u),u.ammo+.5)}}):null;
  for(let i=0;i<2;i++)setTimeoutG(i*.12,()=>{if(!u.dead)shoot(u,ang,PS(4891),atkRange(u),320*C.D,.22,[.7,.9,1],{slow:.5,onHit:steal})});SFX.shot('snipe')};
GAD.silver=(u,g,ang,C)=>{if(u.ammo<1)return false;u.ammo-=1;shoot(u,ang,PS(3804),atkRange(u),600*C.D*(C.BG?1.67:1),C.BG?.42:.28,[.85,.9,1],{pierce:true,breakWalls:true,sc:C.BG?.25:.15});SFX.shot('snipe')};
// ---- ダイナマイク ----
GAD.spinner=(u,g,ang,C)=>{u.spinT=2;buf(u,'spd','spin',1.2,2);for(let i=0;i<20;i++)setTimeoutG(i*.1,()=>{if(u.dead)return;const a=-Math.PI/2+i*DEG(100),r2=TL(2.33)+i*TL(.33)*.5;lob(u,u.x+Math.sin(a)*r2,u.z+Math.cos(a)*r2,{rad:TL(1.5),dmg:1400*C.D,T:.6,kind:'stick',dj:false})})};
GAD.satchel=u=>{u.satchel=true};
// ---- ティック ----
GAD.minemania=u=>{u.mania=true};
GAD.hurrah=(u,g,ang,C)=>{buf(u,'red','hurrah',.5,1.05);setTimeoutG(1,()=>{if(!u.dead)explode(u.x,u.z,{rad:TL(2),dmg:680*C.D,team:u.team,src:u,knock:TL(3)})})};
// ---- 8ビット ----
GAD.cheat=(u,g,ang,C)=>{const b=myBooster(u);if(!b||Math.hypot(b.x-u.x,b.z-u.z)>TL(12))return false;burst(u.x,1,u.z,14,[.6,1,.7],4,.6,.4,true);[u.x,u.z]=nearestOpen(b.x+.8,b.z+.8);burst(u.x,1,u.z,14,[.6,1,.7],4,.6,.4,true);if(C.BG){b.hp=b.maxHp;healU(u,u.maxHp*.3462,u)}};
GAD.credits=(u,g,ang,C)=>{if(u.ammo<1)return false;u.ammo-=1;u.credits=true;ATK.burst(u,BT.piko.atk,ang,0,{D:C.D,R:atkRange(u),HB:false,dx:C.dx,dz:C.dz,px:-C.dz,pz:C.dx})};
// ---- エドガー ----
GAD.letsfly=(u,g,ang,C)=>{let tgt=null,bd=TL(6.67);for(const o of G.units){if(o.dead||o.team===u.team||!visibleTo(u.team,o))continue;const ddx=o.x-u.x,ddz=o.z-u.z,d=Math.hypot(ddx,ddz);if(d<bd&&Math.abs(angd(Math.atan2(ddx,ddz)-ang))<.45){bd=d;tgt=o}}
  let x1,z1;if(tgt){[x1,z1]=nearestOpen(tgt.x+(tgt.x-u.x)/Math.max(bd,.1)*1.2,tgt.z+(tgt.z-u.z)/Math.max(bd,.1)*1.2)}else{const w=rayWall(u.x,u.z,C.dx,C.dz,TL(6.67));if(w>=TL(6.6))return false;[x1,z1]=nearestOpen(u.x+C.dx*(w-.4),u.z+C.dz*(w-.4))}
  u.act={type:'jump',t:0,T:.6,x0:u.x,z0:u.z,x1,z1,vault:true,lf:true}};
GAD.hardcore=(u,g,ang,C)=>{const sh=Math.round(u.maxHp*.5);u.shield=Math.max(u.shield,sh);u.shDec=sh*.05/.35;if(C.BG){u.ccT=1;u.slowT=u.stunT=0}};
// ---- ボニー ----
GAD.sugarrush=u=>{if(u.form!=='clyde')return false;buf(u,'spd','sugar',1.3,5);buf(u,'rel','sugar',1.3,5)};
GAD.crashtest=(u,g,ang,C)=>{if(u.form!=='bonnie')return false;u.act={type:'mdash',t:0,t0:G.t,T:.25,dx:C.dx,dz:C.dz,spd:TL(2)/.25,hit:new Set(),dmg:1160*C.D,knock:TL(2)}};
// ---- モーティス ----
GAD.spinner2=(u,g,ang,C)=>{explode(u.x,u.z,{rad:TL(2.67),dmg:1000*C.D,team:u.team,src:u,slash:true,low:C.BG?1.3:0})};
GAD.bats=(u,g,ang,C)=>{const d=TL(6),[x1,z1]=nearestOpen(u.x+C.dx*d,u.z+C.dz*d);u.act={type:'jump',t:0,T:.6,x0:u.x,z0:u.z,x1,z1,bats:true,bdmg:C.BG?760:0,hit:new Set()}};
// ---- サージ ----
GAD.powersurge=(u,g,ang,C)=>{buf(u,'sc','psurge',1.3,5);if(C.BG)buf(u,'rel','psurge',1.3,5)};
GAD.powershield=u=>{u.psT=G.t+2;u.psHit=false};
// ---- シェリー ----
GAD.fastforward=(u,g,ang,C)=>{u.ammo=maxAmmo(u);u.act={type:'mdash',t:0,t0:G.t,T:.22,dx:C.dx,dz:C.dz,spd:TL(2.67)/.22,hit:new Set(),dmg:0};if(C.BG)u.godT=G.t+.25};
GAD.clay=u=>{u.clay=3};
// ---- ニタ ----
const myBear=u=>G.pets.find(q=>q.src===u&&q.bear&&Math.hypot(q.x-u.x,q.z-u.z)<TL(12));
GAD.bearpaws=(u,g,ang,C)=>{const p=myBear(u);if(!p)return false;setTimeoutG(1,()=>{if(p.dead)return;ring(p.x,p.z,TL(3.33),0xffd08a,.35);for(const t of G.units)if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-p.x,t.z-p.z)<TL(3.33))hurt(t,0,u,true,{stun:.5});if(C.BG)p.pawT=true})};
GAD.fauxfur=(u,g,ang,C)=>{const p=myBear(u);if(!p)return false;p.redT=3;p.red=.35;if(C.BG){u.godT=G.t+.5;p.godT=G.t+.5}};
// ---- ブル ----
GAD.tbone=(u,g,ang,C)=>{shoot(u,ang,PS(3000),TL(7),800*C.D,.32,[1,.4,.3],{sc:.2,onHit:t=>{healU(u,800*C.D,u);if(C.BG&&G.units.includes(t)){t.tbBy=u;t.tbT=G.t+5}}})};
GAD.stomper=(u,g,ang,C)=>{ring(u.x,u.z,TL(2.67),0xffd08a,.35);let st=0;for(const t of G.units)if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-u.x,t.z-u.z)<TL(2.67)){if(t.slowT>0){hurt(t,0,u,true,{stun:1});st++}t.slowT=Math.max(t.slowT,1);t.slowP=Math.max(t.slowP||0,.5)}if(C.BG&&st)buf(u,'spd','stomp',1.3,3)};
// ---- ブロック ----
GAD.laces=(u,g,ang,C)=>{const boom=()=>{const n=explode(u.x,u.z,{rad:TL(2),dmg:500*C.D,team:u.team,src:u,knock:TL(1.5)});if(C.BG&&n)buf(u,'spd','laces',1.3,2)};boom();const [x1,z1]=nearestOpen(u.x+C.dx*TL(4),u.z+C.dz*TL(4));u.act={type:'jump',t:0,T:.7,x0:u.x,z0:u.z,x1,z1,land:()=>boom()}};
GAD.fuel=u=>{u.fuel=true};
// ---- エル・プリモ ----
GAD.suplex=(u,g,ang,C)=>{u.act={type:'mdash',t:0,t0:G.t,T:.25,dx:C.dx,dz:C.dz,spd:TL(2.67)/.25,hit:new Set(),dmg:0,hitFn:t=>{if(!G.units.includes(t)||t.ccT>0)return;const [x1,z1]=nearestOpen(u.x-C.dx*TL(2),u.z-C.dz*TL(2));t.act={type:'jump',t:0,T:.5,x0:t.x,z0:t.z,x1,z1,land:tt=>{if(C.BG)explode(tt.x,tt.z,{rad:TL(1.5),dmg:500*C.D,team:u.team,src:u})}};t.stunT=Math.max(t.stunT,.5)}}};
GAD.asteroid=(u,g,ang,C)=>{u.astT=G.t+1;u.astB=C.BG};
// ---- ポコ ----
GAD.tuning=(u,g,ang,C)=>{for(let i=0;i<3;i++)setTimeoutG(i*2+.01,()=>{if(u.dead)return;for(const t of G.units)if(!t.dead&&t.team===u.team&&Math.hypot(t.x-u.x,t.z-u.z)<TL(3.33)){healU(t,700*u.dm,u);if(C.BG)buf(t,'rel','tune',1.25,3)}ring(u.x,u.z,TL(3.33),0x8affb0,.4)})};
GAD.protect=(u,g,ang,C)=>{const R=TL(C.BG?4:3.33),dur=C.BG?6:4,[x,z]=nearestOpen(u.x+C.dx*TL(2),u.z+C.dz*TL(2));lob(u,x,z,{T:.4,noMark:true,onLand:L=>addFire(u,L.x1,L.z1,R,0,dur,{col:0x8affb0,pc:[.6,1,.7],ally:'cleanse'})})};
// ---- ジェシー ----
const myScrappy=u=>G.turrets.find(q=>q.scrappy&&q.src===u&&Math.hypot(q.x-u.x,q.z-u.z)<TL(12));
GAD.sparkplug=(u,g,ang,C)=>{const t0=myScrappy(u);if(!t0)return false;ring(t0.x,t0.z,TL(4.33),0x8ad0ff,.4);const sl=t=>{t.slowT=Math.max(t.slowT,3);t.slowP=Math.max(t.slowP||0,.45)};for(const t of G.units)if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-t0.x,t.z-t0.z)<TL(4.33))sl(t);
  setTimeoutG(1,()=>{for(const t of G.units)if(!t.dead&&t.team!==u.team&&Math.hypot(t.x-t0.x,t.z-t0.z)<TL(4.33)){t.slowT+=1}})};
GAD.recoil=u=>{const t0=myScrappy(u);if(!t0)return false;t0.fastT=5};
// ---- クロウ ----
GAD.instapoison=(u,g,ang,C)=>{let tot=0,n=0;for(const t of G.units)if(!t.dead&&t.poison&&t.poison.src===u&&t.poison.until>G.t){const left=Math.max(1,Math.ceil(t.poison.until-G.t)),dd=t.poison.dps*u.dm*left;hurt(t,dd,u,true,{dot:true});tot+=dd;n++;
    if(C.BG)t.poison.until=G.t+3+(bufS(u,'carrion')?1:0);else t.poison=null;GLOW.add(t.x,1.8,t.z,0,1,0,.6,[.5,1,.35],.5,0)}
  if(!n)return false;u.shield=Math.max(u.shield,Math.round(tot*1.5));u.shDec=u.shield*.15};
GAD.slowtoxin=(u,g,ang,C)=>{const b=shoot(u,ang,PS(3261),atkRange(u),600*C.D,.22,[.55,1,.4],{poison:100,ticks:3,cut:.5,slow:2,slowP:.3,chain:C.BG?2:0,brange:TL(6.67),bmul:1});if(C.BG)b.onHit=chainNext;SFX.shot('snipe')};
// ---- ローサ ----
GAD.growlight=u=>{growBushes(u);burst(u.x,.6,u.z,20,[.5,1,.5],4,.6,.5,true)};
GAD.unfriendly=(u,g,ang,C)=>{for(const t of G.units)if(!t.dead&&t.team!==u.team&&t.inBush){hurt(t,150*C.D,u,false,{slow:3,slowP:.45});burst(t.x,.8,t.z,12,[.5,1,.4],4,.5,.4,true)}
  for(const k in BUSH){const b=BUSH[k];GLOW.add(b.position.x,.8,b.position.z,0,1,0,.7,[.8,.4,1],.4,0)}};
// ---- ダリル ----
GAD.rotator=(u,g,ang,C)=>{u.spinT=1;for(let i=0;i<15;i++)setTimeoutG(i*.066,()=>{if(u.dead)return;shoot(u,i/15*TAU*2.2,PS(4000),TL(8.33),300*C.D,.2,[1,.65,.3],{sc:.25},u.x,u.z);if(i%3===0)SFX.shot('spread')})};
GAD.tar=(u,g,ang,C)=>{addFire(u,u.x,u.z,TL(2.33),0,4,{col:0x231a14,pc:[.25,.2,.15],follow:u,slowAura:1,slowP:.45})};
// ---- パム ----
GAD.pulse=(u,g,ang,C)=>{const st=G.turrets.find(q=>q.station&&q.src===u&&Math.hypot(q.x-u.x,q.z-u.z)<TL(12));if(!st)return false;ring(st.x,st.z,st.hr,0x8affb0,.45);for(const o of G.units)if(!o.dead&&o.team===u.team&&Math.hypot(o.x-st.x,o.z-st.z)<st.hr)healU(o,1000*u.dm,u)};
GAD.scrapsucker=u=>{u.suck=true};
// ---- フランケン ----
GAD.noise=(u,g,ang,C)=>{u.ccT=3.5;u.slowT=u.stunT=0;u.kx=u.kz=0;shoot(u,ang,PS(5000),TL(6),600*C.D,C.BG?.6:.3,[.7,.8,1],{pierce:true,eats:C.BG});SFX.punch()};
GAD.attraction=u=>{u.attract=true};
// ---- エリザベス ----
GAD.autoaimer=(u,g,ang,C)=>{const [t,dd]=C.en();if(!t||dd>TL(7))return false;const an=Math.atan2(t.x-u.x,t.z-u.z);shoot(u,an,PS(4000),TL(7),90*C.D,.2,[1,.85,.95],{onHit:(o,b)=>{if(!o.isTurret&&!o.isSafe&&!o.isHead&&!(o.ccT>0)){o.kx=b.dx*9;o.kz=b.dz*9}}});SFX.shot('spread')};
GAD.homemade=u=>{u.homing=true};
// ---- レオン ----
GAD.clone=(u,g,ang,C)=>{const p=addClone(u);if(C.BG)u.reGad=uu=>{if(p.dead)return false;const x=uu.x,z=uu.z;uu.x=p.x;uu.z=p.z;p.x=x;p.z=z;burst(x,1,z,12,[.6,1,.5],3,.5,.4,true);burst(uu.x,1,uu.z,12,[.6,1,.5],3,.5,.4,true)}};
GAD.lollipop=(u,g,ang,C)=>{addFire(u,u.x,u.z,TL(4.33),0,10,{col:0xff8ad8,pc:[1,.6,.9],ally:'invis',buf:C.BG})};
// ---- スパイク ----
GAD.pincushion=(u,g,ang,C)=>{const hitN=new Map();for(let i=0;i<5;i++){const off=(i-2)*.55;shoot(u,ang,PS(3261),TL(7.67),500*C.D,.18,[.55,.9,.35],{grow:.6,onHit:t=>{if(!C.BG||!G.units.includes(t))return;const n=(hitN.get(t)||0)+1;hitN.set(t,n);if(n===2)t.rootT=G.t+1}},u.x+C.dx*.6-C.dz*off,u.z+C.dz*.6+C.dx*off)}SFX.shot('snipe')};
GAD.lifeplant=(u,g,ang,C)=>{const [x,z]=nearestOpen(u.x+C.dx*TL(1.5),u.z+C.dz*TL(1.5));lob(u,x,z,{T:.4,noMark:true,onLand:L=>placePlant(u,L.x1,L.z1)})};
