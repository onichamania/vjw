// ================= 必殺技 =================
// SUP[type](u,s,ang,dist,C)：C={D,H（ハイパーチャージ中）,R,d,dx,dz,px,pz（ねらった地点）,auto（タップ）} falseを返すと使わなかったことになる
const SUP={};
function supRange(u){const s=curSup(u);let r=s.range||atkRange(u);if(hasSP(u,'blackpowder')&&s.type==='launch')r=TL(10);const H=hyperOn(u);
  if(H){if(s.type==='surge')r*=1.6;else if(s.type==='bigblob')r=TL(13.33);else if(s.type==='steel')r+=TL(2.33);else if(s.type==='quake')r=TL(7)}return r}
// 必殺技が使えるか（たまっている・または複数回の残り）
const supReady=u=>u.sup>=1||(u.supLeft||0)>0||(u.puppetT||0)>G.t;
function superAtk(u,ang,dist,auto){if(u.dead||G.over||u.stunT>0||silenced(u)||!supReady(u))return false;if(u.act&&!(u.act.supOk))return false;
  if(u.flyT>G.t||u.wind)return false;
  if(G.rule==='ball'&&G.M.ball&&G.M.ball.carrier===u){u.sup=0;kick(u,ang,31);SFX.superGo();return true}
  const s=curSup(u),D=dmgMul(u),H=hyperOn(u),R=supRange(u),d=clamp(dist,1,R),dx=Math.sin(ang),dz=Math.cos(ang);
  const C={D,H,R,d,dx,dz,px:u.x+dx*d,pz:u.z+dz*d,auto:!!auto};
  const f=SUP[s.type];if(!f)return false;
  // 使う分をへらす（ダリル2回・チャック4回）
  const sv=[u.sup,u.supLeft];if((u.puppetT||0)>G.t&&s.type==='puppet'){}else if(u.supLeft>0)u.supLeft--;else{u.sup=0;if(s.uses>1)u.supLeft=s.uses-1}
  if(f(u,s,ang,dist,C)===false){[u.sup,u.supLeft]=sv;return false}
  if(u.invisT>G.t&&s.type!=='smoke'&&s.type!=='stalk')u.invisT=0;u.supUsed=(u.supUsed||0)+1;u.lastAtk=G.t;u.revealT=1.5;u.face=ang;u.faceT=ang;u.atkAnim=1;u.inv=0;SFX.superGo();
  if(u.bt==='kagerou'&&H)u.outT=u.hyperT;
  return true}
// ---- 最初からいたキャラ ----
SUP.barrage=(u,s,ang,dist,C)=>{const lane=C.H?.73:.33;for(let i=0;i<s.n;i++)setTimeoutG(i*s.gap,()=>{if(u.dead)return;const an=u.faceT,l=(i%2?1:-1)*lane,ldx=Math.cos(an),ldz=-Math.sin(an);
  shoot(u,an+rr(-.012,.012),s.speed,s.range,s.dmg*C.D,s.r,[1,.9,.35],{pierce:true,isSup:true,breakWalls:true},u.x+Math.sin(an)*.7+ldx*l,u.z+Math.cos(an)*.7+ldz*l);if(i%2===0)SFX.shot('snipe')})};
SUP.barrel=(u,s,ang,dist,C)=>{const dmg=(s.dmg+(hasSP(u,'demolition')?800:0))*C.D;lob(u,C.px,C.pz,{rad:s.rad,dmg,T:s.time,big:true,isSup:true,onLand:L=>{explode(L.x1,L.z1,{rad:s.rad,dmg,team:u.team,src:u,big:true,breakWalls:true,knock:s.knock,isSup:true});
    if(C.H)for(let i=0;i<8;i++){const a=i/8*TAU;setTimeoutG(.25+i*.05,()=>explode(L.x1+Math.cos(a)*s.rad,L.z1+Math.sin(a)*s.rad,{rad:TL(1.2),dmg:dmg*.3,team:u.team,src:u,isSup:true}))}}});SFX.shot('lob')};
SUP.head=(u,s,ang,dist,C)=>{const [x1,z1]=nearestOpen(u.x+C.dx*Math.min(C.d,s.range),u.z+C.dz*Math.min(C.d,s.range));lob(u,x1,z1,{T:.45,kind:'mine',noMark:true,onLand:L=>addHead(u,L.x1,L.z1)})};
SUP.booster=u=>{placeBooster(u)};
SUP.vault=(u,s,ang,dist,C)=>{const [x1,z1]=nearestOpen(C.px,C.pz);u.act={type:'jump',t:0,T:s.air,x0:u.x,z0:u.z,x1,z1,vault:true}};
SUP.launch=(u,s,ang,dist,C)=>{const [x1,z1]=nearestOpen(C.px,C.pz);if(C.H)bonnieDare(u);u.act={type:'jump',t:0,T:s.air,x0:u.x,z0:u.z,x1,z1,launch:true}};
// ボニーのハイパー：まわりをスタンさせ、6方向に歯をとばす
function bonnieDare(u){explode(u.x,u.z,{rad:TL(2.67),dmg:0,team:u.team,src:u,stun:1,noFx:true});ring(u.x,u.z,TL(2.67),0xffe0a0,.3);for(let i=0;i<6;i++)shoot(u,i/6*TAU,PS(3000),TL(6.67),300*u.dm,.2,[1,1,.9],{isSup:true},u.x+Math.sin(i/6*TAU)*TL(1.67),u.z+Math.cos(i/6*TAU)*TL(1.67))}
SUP.return=(u,s)=>{u.act={type:'wind',t:0,T:s.delay,fire:()=>{const B=BT.ranran,miss=u.maxHp-u.hp;setForm(u,'clyde',true);u.hp=clamp(u.maxHp-miss+u.maxHp*s.heal,1,u.maxHp);u.ammo=maxAmmo(u)/3;burst(u.x,1,u.z,16,[1,.6,.8],4,.6,.5,true)}}};
SUP.shell=(u,s,ang,dist,C)=>{const k=C.H?1.33:1,n=C.H?12:s.n;if(bufS(u,'shellshock'))for(let j=1;j<=3;j++){const fd=Math.min(s.range*j/3.4,rayWall(u.x,u.z,C.dx,C.dz,s.range*j/3.4));setTimeoutG(.12*j,()=>addFire(u,u.x+C.dx*fd,u.z+C.dz*fd,TL(1),260*C.D,3))}
  for(let i=0;i<n;i++)shoot(u,ang+(i/(n-1)-.5)*s.spread*k,s.speed,s.range,s.dmg*C.D,.3,[1,.8,.4],{isSup:true,breakWalls:true,slow:hasSP(u,'shellshock')?2:0,slowP:.55,onHit:(t,b)=>{if(!t.isTurret&&!t.isSafe&&!t.isHead&&!(t.ccT>0)){t.kx=b.dx*9;t.kz=b.dz*9}}});SFX.shot('spread')};
SUP.bear=(u,s,ang,dist,C)=>{addBear(u,u.x+C.dx*Math.min(C.d,s.range),u.z+C.dz*Math.min(C.d,s.range));if(bufS(u,'hyperbear'))buf(u,'rel','hb',1.25,3)};
SUP.charge=(u,s,ang,dist,C)=>{u.act={type:'charge',t:0,T:Math.max(.25,C.d/s.speed),dx:C.dx,dz:C.dz,spd:s.speed,hit:new Set(),dmg:s.dmg*C.D}};
SUP.rain=(u,s,ang,dist,C)=>{if(bufS(u,'morerockets'))buf(u,'spd','mr',1.3,2.3);const mr=hasSP(u,'morerockets'),n=C.H?28:mr?13:s.n,gap=s.gap*(mr?.75:1),area=s.area*(C.H?1.5:1),dmg=(C.H?400:s.dmg)*C.D,px=C.px,pz=C.pz;
  for(let i=0;i<n;i++){const a2=rr(0,TAU),r2=Math.sqrt(Math.random())*area,wave=C.H?Math.floor(i/7):0;setTimeoutG(C.H?wave*.45+(i%7)*.04:i*gap,()=>{if(u.dead&&G.mode==='br')return;const x=px+Math.cos(a2)*r2,z=pz+Math.sin(a2)*r2;
    lob(u,x,z,{rad:s.rad,dmg,T:.55,isSup:true,onLand:L=>explode(L.x1,L.z1,{rad:s.rad,dmg,team:u.team,src:u,isSup:true,breakWalls:true})});if(i%2===0)SFX.shot('lob')})}};
SUP.elbow=(u,s,ang,dist,C)=>{const [x1,z1]=nearestOpen(C.px,C.pz);u.act={type:'jump',t:0,T:.4+.5*C.d/s.range,x0:u.x,z0:u.z,x1,z1,elbow:true}};
SUP.encore=(u,s,ang,dist,C)=>{const heal=s.heal*u.dm,scr=hasSP(u,'screech'),hit=new Set();healU(u,heal,u);if(C.H&&u.hp>=u.maxHp-1)overheal(u,heal,heal,.2);
  for(let i=0;i<9;i++)shoot(u,ang+(i/8-.5)*s.spread,s.speed,s.range,scr?760*C.D:0,1,[.6,1,.7],{pierce:true,isSup:true,noWall:true,hit,allyHeal:heal,overheal:C.H,onHit:bufS(u,'screech')?(t=>{if(G.units.includes(t)){t.silT=G.t+.5;GLOW.add(t.x,2.4,t.z,0,.6,0,.6,[.7,.8,1],.5,0)}}):null})};
SUP.scrappy=(u,s,ang,dist,C)=>{const d=Math.min(C.d,s.range),[x1,z1]=nearestOpen(u.x+C.dx*d,u.z+C.dz*d);lob(u,x1,z1,{T:.5,kind:'bomb',noMark:true,onLand:L=>placeScrappy(u,L.x1,L.z1)})};
SUP.swoop=(u,s,ang,dist,C)=>{const [x1,z1]=nearestOpen(C.px,C.pz);ring2(u,s);u.act={type:'jump',t:0,T:s.air,x0:u.x,z0:u.z,x1,z1,swoop:true}};
SUP.bats=(u,s,ang,dist,C)=>{shoot(u,ang,s.speed,s.range,s.dmg*C.D,s.r,[.55,.2,.7],{pierce:true,isSup:true,noWall:true,lifesteal:1,back:C.H,homeSrc:C.H})};
SUP.surge=(u,s,ang,dist,C)=>{if(bufS(u,'icecold')&&sodaStage(u)>=2)buf(u,'spd','ice',1.5,2);const [x1,z1]=nearestOpen(C.px,C.pz);u.act={type:'jump',t:0,T:s.air,x0:u.x,z0:u.z,x1,z1,surge:true,hyper:C.H}};
SUP.strong=(u,s,ang,dist,C)=>{u.redT=s.dur;u.red=s.red;u.strongT=G.t+s.dur;if(C.H)addFire(u,u.x,u.z,TL(4.33),0,s.dur,{col:0x4caf50,pc:[.5,1,.4],follow:u,slowAura:.3,slowP:.45});burst(u.x,1.2,u.z,24,[.5,1,.5],5,.6,.5,true)};
SUP.roll=(u,s,ang,dist,C)=>{u.redT=.9;u.red=.5;u.act={type:'mdash',t:0,t0:G.t,T:s.range/s.speed,dx:C.dx,dz:C.dz,spd:s.speed,hit:new Set(),dmg:s.dmg*C.D,knock:TL(1.5),isSup:true,roll:true,bounce:true};
  if(C.H)for(let i=0;i<15;i++)setTimeoutG(i*.03,()=>{if(!u.dead)shoot(u,i/15*TAU,PS(4000),TL(4.33),300*C.D,.2,[1,.65,.3],{sc:.12},u.x,u.z)})};
SUP.station=(u,s,ang,dist,C)=>{const d=Math.min(C.d,s.range),[x1,z1]=nearestOpen(u.x+C.dx*d,u.z+C.dz*d);lob(u,x1,z1,{T:.5,kind:'bomb',noMark:true,onLand:L=>placeStation(u,L.x1,L.z1)})};
SUP.quake=(u,s,ang,dist,C)=>{u.act={type:'wind',t:0,T:s.wind,fire:()=>{const hit=new Set(),H=hyperOn(u)||C.H,n=H?24:7,arc=H?TAU:s.arc;
    for(let i=0;i<n;i++)shoot(u,u.faceT+(H?i/n*TAU:(i/(n-1)-.5)*arc),s.speed,s.range,s.dmg*C.D,s.r,[1,.85,.4],{pierce:true,isSup:true,breakWalls:true,stun:s.stun,hit});G.shake=Math.max(G.shake,.5);SFX.boom(true)}}};
SUP.poppin=(u,s,ang,dist,C)=>{const [x1,z1]=nearestOpen(C.px,C.pz),n=C.H?6:s.n,x0=u.x,z0=u.z;for(let i=0;i<n;i++){const a2=i/n*TAU+rr(-.3,.3),r2=TL(1.2);
    lob(u,x0+Math.sin(a2)*r2,z0+Math.cos(a2)*r2,{rad:s.rad,dmg:s.dmg*C.D,T:.6+i*.05,isSup:true,onLand:L=>setTimeoutG(.3,()=>explode(L.x1,L.z1,{rad:s.rad,dmg:s.dmg*C.D,team:u.team,src:u,isSup:true,knock:s.knock,breakWalls:true}))})}
  u.act={type:'jump',t:0,T:C.H?1.2:s.air,x0:u.x,z0:u.z,x1,z1,poppin:true,hyper:C.H}};
SUP.smoke=(u,s,ang,dist,C)=>{u.invisT=G.t+s.dur+(bufS(u,'invisiheal')?1:0);burst(u.x,1,u.z,30,[.8,.95,.8],5,.8,.8)};
SUP.cactus=(u,s,ang,dist,C)=>{const rad=s.rad*(C.H?1.2:1),T=Math.max(.35,C.d/(s.speed*(bufS(u,'fertilize')?1.3:1)));lob(u,C.px,C.pz,{rad,T,onLand:L=>{burst(L.x1,.6,L.z1,24,[.6,1,.4],rad*2,.6,.6,true);SFX.boom(false);
      addFire(u,L.x1,L.z1,rad,s.dps*C.D,s.dur,{col:0x6fc23f,pc:[.65,1,.45],slow:s.slow,slowP:s.slowP,fert:true,tickT:.9})}})};
