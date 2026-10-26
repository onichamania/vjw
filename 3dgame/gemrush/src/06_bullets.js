// ================= 弾 =================
const bulletGeo=new THREE.SphereGeometry(1,10,8);const bulletMats={};
function bmat(col){const k=col.join();return bulletMats[k]||(bulletMats[k]=new THREE.MeshBasicMaterial({color:new THREE.Color(col[0],col[1],col[2])}))}
// o: {pierce,isSup,slow,slowP,stun,poison,ticks,burn,cut,breakWalls,split,splitDmg,wallSplit,wallMore,endSplit,lifesteal,onHit,onEnd,back,backMul,backSpd,falloff,far,fade,near,grow,full,bonus,
//     home,curve,chain,boom,noWall,allyHeal,overheal,healTurret,dacapo,bounce,plus,r1,eats,sc,life,rehit,linger,karma,stick,ghostBack}
function shoot(u,ang,spd,range,dmg,r,col,o,x0,z0){o=o||{};const dx=Math.sin(ang),dz=Math.cos(ang),m=new THREE.Mesh(bulletGeo,bmat(col));m.scale.set(r,r,r*(spd>22?2.6:1.4));m.rotation.y=ang;
  const sx=x0!=null?x0:u.x+dx*.7,sz=z0!=null?z0:u.z+dz*.7;const b=Object.assign({x:sx,z:sz,dx,dz,spd,d:0,range,dmg,r,r0:r,col,team:u.team,src:u,hit:new Set(),m,age:0},o);m.position.set(b.x,1,b.z);scene.add(m);G.bullets.push(b);return b}
function splitAt(b,x,z,n,wall){const base=Math.atan2(b.dx,b.dz),angs=b.splitFixed?Array.from({length:n},(_,i)=>i/n*TAU):n>=6?Array.from({length:n},(_,i)=>i/n*TAU+(n>6?.2:0)+base):wall?[base+Math.PI*.75,base-Math.PI*.75]:[base+Math.PI/2,base-Math.PI/2];
  for(const a of angs){shoot(b.src,a,b.splitSpd||b.spd*.9,b.splitR||TL(2.3),b.dmg*b.splitDmg,b.splitW||b.r*.7,b.col,{hit:new Set(b.hit),isSup:b.isSup,curve:b.splitCurve||0,slow:b.splitSlow||0,sc:b.splitSc},x-Math.sin(a)*.05,z-Math.cos(a)*.05)}
  // トゥザマックスのバフィー：壁で跳ね返るとき30°の小さな弾がさらに2つ
  if(wall&&b.wallMore)for(const a of[base+Math.PI-.52,base+Math.PI+.52])shoot(b.src,a,b.spd*.9,TL(2),b.dmg*.35,b.r*.5,b.col,{hit:new Set(b.hit),isSup:b.isSup},x-Math.sin(a)*.05,z-Math.cos(a)*.05)}
// 弾のダメージ（遠くで弱く／近くで弱く・草むらから+など）
function bulletDmg(b,t){if(b.dmgFn)return b.dmgFn(t,b);const k=Math.min(1,b.d/b.range);let d=b.dmg*(b.falloff&&b.d>b.range*.5?b.falloff:1);
  if(b.far)d*=1+(b.far-1)*k;
  if(b.fade){const n=b.near||0;d*=k<=n?1:lerp(1,b.fade,(k-n)/(1-n))}
  if(b.grow){const f=b.full||1;d*=k>=f?1:lerp(b.grow,1,k/f)}
  if(b.karma&&t){const n=(b.kn=b.kn||new Map()).get(t)||0;b.kn.set(t,n+1);d*=1+.25*n}
  return d+(b.bonus||0)}
// カーブする弾・敵を追いかける弾
function steerBullet(b,dt){if(b.curve){const na=Math.atan2(b.dx,b.dz)+b.curve*dt;b.dx=Math.sin(na);b.dz=Math.cos(na);b.m.rotation.y=na}
  if(b.home){let best=null,bd=TL(4.5);for(const t of G.units){if(t.dead||t.team===b.team||b.hit.has(t)||!visibleTo(b.team,t))continue;const d=Math.hypot(t.x-b.x,t.z-b.z);if(d<bd){bd=d;best=t}}
    if(best){const ta=Math.atan2(best.x-b.x,best.z-b.z),ca=Math.atan2(b.dx,b.dz),na=ca+clamp(angd(ta-ca),-7*dt,7*dt);b.dx=Math.sin(na);b.dz=Math.cos(na);b.m.rotation.y=na}}}
// 壁で跳ね返る（リコ・トゥザマックスのサージ・ビビのガム）
function reflect(b,ox,oz){if((b.bounced||0)>=14){b.dead=true;return}const hx=blockShot(cx(b.x),cz(oz)),hz=blockShot(cx(ox),cz(b.z));if(hx||!hz&&!hx)b.dx=-b.dx;if(hz||!hz&&!hx)b.dz=-b.dz;b.x=ox;b.z=oz;b.m.rotation.y=Math.atan2(b.dx,b.dz);b.bounced=(b.bounced||0)+1;
  if(b.plus)b.range+=b.bounced<=8&&b.plusBig?b.plusBig:b.plus;if(b.superBouncy&&!b.charged){b.charged=true;b.bonus=(b.bonus||0)+b.superBouncy;b.m.material=bmat([1,1,.5])}}
const ENDFX=b=>{if(b.split&&b.endSplit)splitAt(b,b.x,b.z,b.split,false);if(b.onEnd)b.onEnd(b)};
function updBullets(dt){const T=targets(),GG=G.units.filter(u=>u.bt==='gigi'&&!u.dead);
  for(let i=G.bullets.length-1;i>=0;i--){const b=G.bullets[i];let dead=false;b.age+=dt;if(b.curve||b.home)steerBullet(b,dt);
    if(b.life!=null&&b.age>=b.life){dead=true;if(b.onEnd)b.onEnd(b)}
    const sp=b.stopped?0:b.spd,steps=Math.max(1,Math.ceil(sp*dt/.3)),st=sp*dt/steps;
    for(let s=0;s<steps&&!dead;s++){const ox=b.x,oz=b.z;b.x+=b.dx*st;b.z+=b.dz*st;b.d+=st;const c=cx(b.x),r=cz(b.z);if(b.r1)b.r=lerp(b.r0,b.r1,Math.min(1,b.d/b.range));
      if(blockShot(c,r)&&!b.noWall&&!(b.returned&&b.ghostBack)){if(b.breakWalls&&cell(c,r)==='#'){breakWall(c,r);continue}if(breakable(c,r)&&!b.bounce)hitBox(c,r,b.dmg);
        if(b.bounce){reflect(b,ox,oz);if(b.dead)break;continue}if(b.stick){b.x=ox;b.z=oz;b.stick(b,null);dead=true;break}
        if(b.split&&b.wallSplit)splitAt(b,b.x-b.dx*.5,b.z-b.dz*.5,b.split,true);if(b.onEnd)b.onEnd(b,true);dead=true;burst(b.x,1,b.z,5,[.9,.8,.6],3,.35,.35);break}
      // リコの自動販売機：自分の弾が跳ね返る
      if(b.bounce&&b.src&&b.src.bt==='ricochet')for(const t of G.turrets)if(t.vend&&t.src===b.src&&!t.dead&&Math.hypot(t.x-b.x,t.z-b.z)<1.1){const nx=(b.x-t.x),nz=(b.z-t.z),l=Math.hypot(nx,nz)||1,dot=b.dx*nx/l+b.dz*nz/l;if(dot<0&&(b.bounced||0)<14){b.dx-=2*dot*nx/l;b.dz-=2*dot*nz/l;b.x=t.x+nx/l*1.12;b.z=t.z+nz/l*1.12;b.bounced=(b.bounced||0)+1;if(b.plus)b.range+=b.plus;if(bufG(b.src,'multilauncher'))t.extra=Math.min(16,(t.extra||0)+1)}}
      // ジジの特性：近くを敵の弾が通ると必殺技がたまる
      for(const g of GG){if(g.team===b.team||b.gg&&b.gg.has(g))continue;const R=(g.strT||0)>G.t?TL(5.43):BT.gigi.dodge.rad;if(Math.hypot(g.x-b.x,g.z-b.z)<R){(b.gg||(b.gg=new Set())).add(g);const gn=((g.strT||0)>G.t?.05:BT.gigi.dodge.gain)*scMul(g);g.sup=Math.min(1,g.sup+gn);if(g.kit.hyper&&!hyperOn(g))g.hyp=Math.min(1,g.hyp+gn*BT.gigi.hm)}}
      // 弾を消す（エル・プリモのアステロイドベルト・フランケンの音波のバフィー）
      if(b.eats)for(let j=G.bullets.length-1;j>=0;j--){const q=G.bullets[j];if(q===b||q.team===b.team||q.eats)continue;if(Math.hypot(q.x-b.x,q.z-b.z)<b.r+q.r+.4){q.dead=true}}
      if(b.allyHeal)for(const t of G.units){if(t.dead||t.team!==b.team||t===b.src||b.hit.has(t))continue;if(Math.hypot(t.x-b.x,t.z-b.z)<UR+b.r+.1){b.hit.add(t);if(b.dacapo&&t.hp>=t.maxHp)buf(t,'sc','dacapo',1.1,3);if(b.overheal&&t.hp>=t.maxHp-1)overheal(t,b.allyHeal,b.allyHeal,.2);else healU(t,b.allyHeal,b.src);if(b.allyOnHit)b.allyOnHit(t,b)}}
      if(b.healTurret)for(const t of G.turrets){if(t.dead||t.src!==b.src||b.hit.has(t)||!t.scrappy)continue;if(Math.hypot(t.x-b.x,t.z-b.z)<1.2){b.hit.add(t);t.hp=Math.min(t.maxHp,t.hp+b.healTurret)}}
      for(const t of T){if(t.dead||t.team===b.team)continue;const rh=b.rehit&&b.hit.has(t)&&G.t-((b.ht&&b.ht.get(t))||0)>=b.rehit;if(b.hit.has(t)&&!rh)continue;
        if(Math.hypot(t.x-b.x,t.z-b.z)<(t.rad||UR)+b.r+.1){b.hit.add(t);if(b.rehit)(b.ht||(b.ht=new Map())).set(t,G.t);
          if(b.stick){b.stick(b,t);dead=true;break}
          const bd=bulletDmg(b,t);
          if(bd>0)hurt(t,bd,b.src,b.isSup,{slow:b.slow,slowP:b.slowP,stun:b.stun,poison:b.poison,ticks:b.ticks,burn:b.burn,cut:b.cut,sc:b.sc});
          if(b.src&&b.src.kit&&hasSP(b.src,'bearwithme')&&!b.isSup&&bd>0)for(const p of G.pets)if(p.src===b.src&&p.bear){if(bufS(b.src,'bearwithme'))overheal(p,bd*.57,2000,.2);else p.hp=Math.min(p.maxHp,p.hp+bd*.57)}
          if(b.lifesteal&&b.src&&!b.src.dead&&bd>0)healU(b.src,bd*b.lifesteal,b.src);if(b.onHit)b.onHit(t,b,bd);
          burst(b.x,1,b.z,7,b.col,4,.45,.35,true);if(b.split&&!b.noSplitHit){splitAt(b,b.x,b.z,b.split,false);dead=true;break}if(!b.pierce){dead=true;break}}}
      if(dead)break;
      if(b.d>=b.range){if(b.linger){if(!b.stopped){b.stopped=true;b.d=b.range}}
        else if(b.back&&!b.returned){if(b.hold&&!b.held){b.held=G.t;b.stopped=true;setTimeoutG(b.hold,()=>{b.stopped=false;b.returned=true;b.d=0;b.hit=new Set();if(b.backSpd)b.spd=b.backSpd;if(b.backMul)b.dmg*=b.backMul;if(b.onTurn)b.onTurn(b)});break}
          b.returned=true;b.d=0;b.hit=new Set();if(b.backSpd)b.spd=b.backSpd;if(b.backMul)b.dmg*=b.backMul;if(b.onTurn)b.onTurn(b)}
        else{ENDFX(b);dead=true}}
      // 戻ってくる弾（グリフのお札・ブーメラン）は撃った人に向かう
      if(b.returned&&b.homeSrc&&!b.src.dead){const ddx=b.src.x-b.x,ddz=b.src.z-b.z,l=Math.hypot(ddx,ddz);if(l<1){dead=true;if(b.onBack)b.onBack(b);break}b.dx=ddx/l;b.dz=ddz/l;b.d=Math.min(b.d,b.range-.01)}
      else if(b.returned&&!b.homeSrc&&b.d>=b.range){dead=true}}
    if(b.dead)dead=true;
    if(!dead&&Math.random()<.7)GLOW.add(b.x,1,b.z,0,0,0,b.r*2.2,b.col,.18,0);
    b.m.position.set(b.x,1,b.z);if(b.r1||b.grow2)b.m.scale.set(b.r,b.r,b.r*1.4);
    if(dead){if(b.boom){const B0=b.boom,x=b.x,z=b.z;explode(x,z,{rad:B0.rad,dmg:B0.dmg,team:b.team,src:b.src,breakWalls:b.breakWalls,isSup:b.isSup,sc:B0.sc});if(B0.fire)addFire(b.src,x,z,B0.fire.rad,B0.fire.dps,B0.fire.dur,{sc:.03});
        // ロケットフューエルのバフィー：4つの小さなロケットに分かれる
        if(B0.split)for(let k=0;k<B0.split;k++){const a=k/B0.split*TAU+.4,ex=x+Math.sin(a)*TL(1.3),ez=z+Math.cos(a)*TL(1.3);setTimeoutG(.12+k*.06,()=>explode(ex,ez,{rad:TL(.75),dmg:B0.dmg*.25,team:b.team,src:b.src}))}}
      scene.remove(b.m);G.bullets.splice(i,1)}}}
// ---- 投げる（ダイナマイト・地雷・爆弾）----
const GEO={bomb:new THREE.SphereGeometry(.26,12,10),bigbomb:new THREE.SphereGeometry(.46,12,10),stick:new THREE.CylinderGeometry(.07,.07,.5,8),mine:new THREE.SphereGeometry(.22,10,8),ring:new THREE.RingGeometry(.9,1,36),disc:new THREE.CircleGeometry(1,40),
  blob:new THREE.SphereGeometry(.5,14,10),flask:new THREE.CylinderGeometry(.16,.22,.42,10),post:new THREE.CylinderGeometry(.12,.12,1.2,8),piggy:new THREE.SphereGeometry(.38,12,10)},
  GMAT={bomb:M(0x2b2d36),stick:M(0xd8343a),mine:M(0x5a6070),heal:M(0xfff1a0,{emissive:0xc9a020}),blob:M(0x6fd0ff,{emissive:0x1a5a80}),flask:M(0xffa030,{emissive:0x803000}),post:M(0x8a5a33),piggy:M(0xff9ac0),
    mk0:new THREE.MeshBasicMaterial({color:0x3aa0ff,transparent:true,opacity:.5,depthWrite:false}),mk1:new THREE.MeshBasicMaterial({color:0xff4d5a,transparent:true,opacity:.5,depthWrite:false})};
const SECT={};const sectGeo=(range,arc)=>{const k=range.toFixed(1)+'|'+arc.toFixed(2);if(!SECT[k]){SECT[k]=new THREE.CircleGeometry(range,20,-arc/2,arc);SECT[k].rotateX(-Math.PI/2)}return SECT[k]};
// o: {rad,dmg,T,big,kind('stick'|'mine'|'bomb'|'blob'|'flask'|'post'|'piggy'),onLand}
function lob(u,x1,z1,o){const kd=o.kind,geo=GEO[kd]||(o.big?GEO.bigbomb:GEO.bomb),mat=GMAT[kd]||GMAT.bomb;
  const m=new THREE.Mesh(geo,mat);m.castShadow=true;scene.add(m);let mk=null;if(o.rad&&kd!=='mine'&&!o.noMark){mk=new THREE.Mesh(GEO.ring,u.team===0?GMAT.mk0:GMAT.mk1);mk.scale.setScalar(o.rad);mk.rotation.x=-Math.PI/2;mk.position.set(x1,.06,z1);scene.add(mk)}
  G.lobs.push(Object.assign({x0:o.x0!=null?o.x0:u.x,z0:o.z0!=null?o.z0:u.z,x1,z1,t:0,team:u.team,src:u,m,mk},o))}
function updLobs(dt){for(let i=G.lobs.length-1;i>=0;i--){const L=G.lobs[i];L.t+=dt;const k=Math.min(1,L.t/L.T),h=L.low?1.2:Math.max(2.6,Math.hypot(L.x1-L.x0,L.z1-L.z0)*.32);
    L.m.position.set(lerp(L.x0,L.x1,k),1+Math.sin(k*Math.PI)*h,lerp(L.z0,L.z1,k));L.m.rotation.x+=dt*9;if(Math.random()<.5)GLOW.add(L.m.position.x,L.m.position.y+.3,L.m.position.z,0,0,0,.25,[1,.7,.3],.2,0);
    if(L.onFly)L.onFly(L,k);
    if(k>=1){scene.remove(L.m);if(L.mk)scene.remove(L.mk);G.lobs.splice(i,1);if(L.onLand)L.onLand(L);else explode(L.x1,L.z1,L)}}}
// 爆発 o={rad,dmg,team,src,big,knock,stun,slow,slowP,pull,fear,breakWalls,isSup,noFx,low,sc,only}　当たったキャラの数を返す（爆発は壁ごしにも当たる）
function explode(x,z,o){const rad=o.rad;let hitN=0;
  if(!o.noFx){if(o.slash){ring(x,z,rad,0xb58aff,.3);burst(x,1,z,24,[.75,.55,1],rad*2.4,.6,.4,true);SFX.punch()}
    else{ring(x,z,rad,o.col||0xffc070,.35);burst(x,.6,z,o.big?40:20,o.pc||[1,.62,.25],rad*2.4,.9,.55,true);burst(x,.5,z,o.big?26:10,[.5,.45,.42],rad*1.6,1.2,1.1);SFX.boom(o.big)}}
  const mm=me(),d0=Math.hypot(x-mm.x,z-mm.z);G.shake=Math.max(G.shake,clamp(1-d0/22,0,1)*(o.big?.6:.3));
  for(const t of targets()){if(t.dead)continue;const d=Math.hypot(t.x-x,t.z-z);if(d>=rad+UR*.6)continue;if(o.only&&!o.only(t))continue;
    if(t.team===o.team){if(t===o.src&&hasSP(t,'dynajump')&&!t.act&&!t.isTurret&&o.dj!==false){const f=t.faceT!=null?t.faceT:t.face,J=o.isSup?TL(5):TL(3);const [x1,z1]=nearestOpen(t.x+Math.sin(f)*J,t.z+Math.cos(f)*J);t.act={type:'jump',t:0,T:.55,x0:t.x,z0:t.z,x1,z1,pad:true,dj:true}}continue}
    if(G.units.includes(t))hitN++;const dmg=(typeof o.dmg==='function'?o.dmg(t):o.dmg)*(o.low&&t.hp<t.maxHp*.5?o.low:1);
    hurt(t,dmg,o.src,o.isSup,{stun:o.stun,slow:o.slow,slowP:o.slowP,sc:o.sc,knock:o.knock});if(o.onHit)o.onHit(t,d);
    if(o.fear&&G.units.includes(t)&&!(t.ccT>0)){t.fearT=G.t+o.fear;t.fearX=x;t.fearZ=z}
    if(o.knock&&!t.isTurret&&!t.isSafe&&!t.isHead&&!(t.ccT>0)){const k=Math.max(d,.3);t.kx=(t.x-x)/k*o.knock*3.2;t.kz=(t.z-z)/k*o.knock*3.2}
    if(o.pull&&!t.isTurret&&!t.isSafe&&!t.isHead&&!(t.ccT>0)){const k=Math.max(d,.3),p=Math.min(d,o.pull);t.kx=-(t.x-x)/k*p*3.2;t.kz=-(t.z-z)/k*p*3.2}}
  for(let r=cz(z)-4;r<=cz(z)+4;r++)for(let c=cx(x)-4;c<=cx(x)+4;c++){if(Math.hypot(tx(c)-x,tz(r)-z)>=rad+.6)continue;if(breakable(c,r))hitBox(c,r,typeof o.dmg==='function'?600:o.dmg);else if(o.breakWalls)breakWall(c,r)}return hitN}
// 近接（扇形）o={thru（壁ごしにも当たる）,core:{arc,mul}（まん中は強い）,knock,isSup,sc,onAll}
function melee(u,ang,range,arc,dmg,col,onHit,o){o=o||{};const s=new THREE.Mesh(sectGeo(range,arc),new THREE.MeshBasicMaterial({color:col||0xffe6a0,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide}));
  s.rotation.y=ang-Math.PI/2;s.position.set(u.x,.12,u.z);scene.add(s);FADE.push({m:s,t:0,T:.16});let tot=0,n=0;
  for(const t of targets()){if(t.dead||t.team===u.team)continue;const dx=t.x-u.x,dz=t.z-u.z,d=Math.hypot(dx,dz);if(d>range+(t.rad||UR))continue;const da=Math.abs(angd(Math.atan2(dx,dz)-ang));if(da>arc/2+.3)continue;
    if(!o.thru&&!los(u.x,u.z,t.x,t.z))continue;const core=o.core&&da<o.core.arc/2,dd=dmg*(core?o.core.mul:1);
    hurt(t,dd,u,!!o.isSup,{sc:o.sc,knock:o.knock});tot+=dd;n++;if(onHit)onHit(t,core,dd);if(o.knock&&!t.isTurret&&!t.isSafe&&!t.isHead&&!(t.ccT>0)){const k=Math.max(d,.3);t.kx=dx/k*o.knock*3.2;t.kz=dz/k*o.knock*3.2}burst(t.x,1,t.z,8,[1,.85,.5],4,.5,.35,true)}
  for(let k=1;k<=2;k++){const c=cx(u.x+Math.sin(ang)*k*1.4),r=cz(u.z+Math.cos(ang)*k*1.4);if(breakable(c,r)){hitBox(c,r,dmg);break}if(blockShot(c,r))break}
  SFX.punch();if(o.onAll)o.onAll(n,tot);return tot}
const FADE=[];function updFade(dt){for(let i=FADE.length-1;i>=0;i--){const f=FADE[i];f.t+=dt;f.m.material.opacity=.55*(1-f.t/f.T);if(f.t>=f.T){scene.remove(f.m);f.m.material.dispose();FADE.splice(i,1)}}}

// ---- 地雷（ティック・ボウの罠・ファングのポップコーン）----
// o={rad,life,arm,hide（敵に見えない）,fuse（ふまれてから爆発まで）,knock,stun,col,isSup,sc,kind}
function addMine(u,x,z,dmg,slow,o){o=o||{};const m=new THREE.Mesh(GEO.mine,o.kind==='corn'?M(0xfff4c0):GMAT.mine);m.position.set(x,.2,z);if(o.kind==='corn')m.scale.setScalar(.7);scene.add(m);const l=new THREE.Mesh(GEO.bomb,new THREE.MeshBasicMaterial({color:u.team===0?0x3aa0ff:0xff4d5a}));l.scale.setScalar(.25);l.position.y=.22;m.add(l);
  const q=Object.assign({x,z,team:u.team,src:u,dmg,slow:slow||0,arm:.35,life:BT.kachiko.atk.life,rad:BT.kachiko.atk.rad,m},o);G.mines.push(q);return q}
function updMines(dt){for(let i=G.mines.length-1;i>=0;i--){const q=G.mines[i];q.arm-=dt;q.life-=dt;q.m.children[0].visible=Math.sin(G.t*14)>0;q.m.visible=!q.hide||q.team===0||q.trig!=null;let go=q.life<=0;
    if(q.trig!=null){q.trig-=dt;q.m.children[0].visible=Math.sin(G.t*30)>0;go=q.trig<=0}
    else if(q.arm<=0&&!go)for(const t of targets())if(!t.dead&&t.team!==q.team&&!airborne(t)&&Math.hypot(t.x-q.x,t.z-q.z)<1.1){if(q.fuse){q.trig=q.fuse;tn(900,.06,.08,'square')}else go=true;break}
    if(go){scene.remove(q.m);G.mines.splice(i,1);explode(q.x,q.z,{rad:q.rad,dmg:q.dmg,team:q.team,src:q.src,slow:q.slow,stun:q.stun,knock:q.knock,isSup:q.isSup,sc:q.sc,breakWalls:q.breakWalls});if(q.src&&q.src.kit&&bufS(q.src,'autoreload')&&!q.src.dead)q.src.ammo=Math.min(maxAmmo(q.src),q.src.ammo+.1)}}}
// ---- ティックの頭（必殺技）----
function addHead(u,x,z){const S2=BT.kachiko.sup,g=new THREE.Group(),h=new THREE.Mesh(new THREE.SphereGeometry(.5,16,12),MC(0x5a6070));h.position.y=.55;h.castShadow=true;g.add(h);
  const e=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),MC(0xff3b3b));e.position.set(0,.6,.42);g.add(e);for(const sx of[-1,1]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.4,6),MC(0x9aa3b5));l.position.set(sx*.25,.15,0);g.add(l)}
  g.position.set(x,0,z);scene.add(g);const hp=Math.round(S2.hp*u.dm);const hd={isHead:true,bt:'head',name:'頭',team:u.team,src:u,x,z,hp,maxHp:hp,t:0,life:5,dead:false,gems:0,pw:0,isMe:false,m:{g},revealT:9,inBush:false,inv:0,lv:u.lv,dm:dmgMul(u),sup:0,dmg:0,hyper:hyperOn(u)};
  mkLabel(hd);G.heads.push(hd)}
function killHead(h,boom){if(h.dead&&!boom)return;h.dead=true;scene.remove(h.m.g);h.lab.d.remove();G.heads.splice(G.heads.indexOf(h),1);
  if(boom){const S2=BT.kachiko.sup;explode(h.x,h.z,{rad:S2.rad,dmg:S2.dmg*h.dm,team:h.team,src:h.src,isSup:true,big:true,knock:S2.knock,breakWalls:true});if(h.hyper)for(let i=0;i<6;i++){const a=i/6*TAU;addMine(h.src,h.x+Math.cos(a)*TL(2.67),h.z+Math.sin(a)*TL(2.67),BT.kachiko.atk.dmg*h.dm)}}}
function updHeads(dt){for(const h of G.heads.slice()){h.t+=dt;let best=null,bd=1e9;for(const o of G.units){if(o.dead||o.team===h.team)continue;const d=Math.hypot(o.x-h.x,o.z-h.z);if(d<bd){bd=d;best=o}}
    if(best){const sp=h.hyper?SPD(1500):SPD(810),d=Math.max(bd,.01);h.x+=(best.x-h.x)/d*sp*dt;h.z+=(best.z-h.z)/d*sp*dt;collide(h);h.m.g.rotation.y=Math.atan2(best.x-h.x,best.z-h.z);if(bd<1.3){killHead(h,true);continue}}
    h.m.g.position.set(h.x,Math.abs(Math.sin(h.t*14))*.15,h.z);if(h.t>=h.life)killHead(h,true)}}
// ---- 8ビットのダメージブースター ----
function placeBooster(u){const old=myBooster(u);if(old)killTurret(old);const S2=BT.piko.sup,H=hyperOn(u),g=new THREE.Group(),bm=MC(0x3a3f4d);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.5,.65,.6,10),bm);base.position.y=.3;base.castShadow=true;g.add(base);const top=new THREE.Group();top.position.y=.9;g.add(top);
  const sc=new THREE.Mesh(new THREE.BoxGeometry(.8,.55,.5),MC(0x6a4fd6));sc.castShadow=true;top.add(sc);const scr=new THREE.Mesh(new THREE.BoxGeometry(.6,.35,.05),MC(0x5dff8a));scr.position.z=.26;top.add(scr);
  const rad=S2.rad*(hasSP(u,'boosted')?1.5:1),rg=new THREE.RingGeometry(rad-.15,rad,48);rg.rotateX(-Math.PI/2);const ring2=new THREE.Mesh(rg,MB(u.team===0?0x3aa0ff:0xff4d5a,{transparent:true,opacity:.45,depthWrite:false}));ring2.position.y=.05;g.add(ring2);
  const [x,z]=nearestOpen(u.x,u.z);g.position.set(x,0,z);scene.add(g);const hp=Math.round(S2.hp*u.dm*(H?3700/2800:1));
  const t={isTurret:true,booster:true,bt:'turret',name:'ブースター',team:u.team,src:u,x,z,hp,maxHp:hp,rad:.8,effR:rad,boost:S2.boost+(hasSP(u,'boosted')?.15:0),cool:.5,laser:H,dead:false,gems:0,pw:0,isMe:false,m:{g},top,revealT:9,inBush:false,inv:0,lv:u.lv,dm:u.dm,sup:0,dmg:0};
  mkLabel(t);G.turrets.push(t);burst(x,.6,z,14,[.6,1,.7],4,.6,.5,true)}
function killTurret(t){if(t.dead&&!G.turrets.includes(t))return;if(t.plant&&!G.over)plantPop(t);if(t.onDie&&!G.over)t.onDie(t);t.dead=true;scene.remove(t.m.g);if(t.lab)t.lab.d.remove();burst(t.x,.8,t.z,20,[1,.7,.3],5,.7,.6,true);const i=G.turrets.indexOf(t);if(i>=0)G.turrets.splice(i,1)}
function updTurrets(dt){for(const t of G.turrets.slice()){if(t.src.dead&&(G.mode==='br'||t.legs)){killTurret(t);continue}t.cool-=dt;if(t.decay){t.hp-=t.decay*dt;if(t.hp<=0){killTurret(t);continue}}if(t.tick){t.tick(t,dt);continue}
    if(t.scrappy){scrappyTick(t,dt);continue}if(t.station){stationTick(t,dt);continue}if(t.plant)continue;if(t.top)t.top.rotation.y+=dt*.8;
    if(t.booster&&bufS(t.src,'boosted')){t.ammoT=(t.ammoT==null?5:t.ammoT)-dt;if(t.ammoT<=0){t.ammoT=5;const a=rr(0,TAU),[gx,gz]=nearestOpen(t.x+Math.cos(a)*1.6,t.z+Math.sin(a)*1.6),it=addItem('ammo',t.x,t.z,gx,gz);it.team=t.team;it.life=8}}
    if(t.booster&&t.laser&&t.cool<=0){let best=null,bd=1e9;for(const o of G.units){if(o.team===t.team||!visibleTo(t.team,o))continue;const d=Math.hypot(o.x-t.x,o.z-t.z);if(d<TL(9)&&d<bd&&los(t.x,t.z,o.x,o.z)){bd=d;best=o}}
      if(best){t.cool=.25;shoot(t,Math.atan2(best.x-t.x,best.z-t.z),PS(4500),TL(9),115*t.dm,.14,[.4,1,.6],{isSup:true,sc:.0545},t.x,t.z);SFX.shot('tur')}}}}
// 燃える・毒・回復のエリア
const fireGeo=new THREE.CircleGeometry(1,32);fireGeo.rotateX(-Math.PI/2);
// o: {col,pc（つぶの色）,slow,slowP,ally:'invis'|'heal'|'cleanse',buf,fert（スパイクのファーティライズ）,pull,follow（ついていく相手）,tickT,burnT（燃やす秒）,sc,grow,isSup,poisonArrow,reveal,oil}
function addFire(u,x,z,rad,dps,dur,o){o=o||{};const m=new THREE.Mesh(fireGeo,new THREE.MeshBasicMaterial({color:o.col||0xff7a2e,transparent:true,opacity:.45,depthWrite:false}));m.scale.setScalar(rad);m.position.set(x,.09,z);m.renderOrder=2;scene.add(m);
  const q=Object.assign({x,z,rad,dps,t:0,T:dur,tick:.25,tickT:o.tickT||.5,team:u.team,src:u,m,pc:[1,.55,.2],isSup:o.isSup!=null?o.isSup:true},o);G.zones.push(q);return q}
function updZones(dt){for(let i=G.zones.length-1;i>=0;i--){const q=G.zones[i];q.t+=dt;q.tick-=dt;if(q.follow&&!q.follow.dead){q.x=q.follow.x;q.z=q.follow.z;q.m.position.set(q.x,.09,q.z)}
    if(q.grow){q.rad=Math.min(q.grow,q.rad+q.growR*dt);q.m.scale.setScalar(q.rad)}
    q.m.material.opacity=(q.oil?.55:(.35+Math.sin(G.t*18+i)*.1))*Math.min(1,(q.T-q.t)*2);
    if(Math.random()<(q.oil?.08:.6))GLOW.add(q.x+rr(-q.rad,q.rad)*.8,.3,q.z+rr(-q.rad,q.rad)*.8,0,1.2,0,.35,q.pc,.45,0);
    const inQ=t=>Math.hypot(t.x-q.x,t.z-q.z)<q.rad+UR*.5;
    if(q.ally==='invis')for(const o of G.units)if(!o.dead&&o.team===q.team&&inQ(o)){o.invisT=Math.max(o.invisT||0,G.t+.3);if(q.buf)buf(o,'spd','lolli',1.15,.3)}
    if(q.ally==='cleanse')for(const o of G.units)if(!o.dead&&o.team===q.team&&inQ(o)){o.slowT=o.stunT=0;o.poison=null;o.immuneT=Math.max(o.immuneT||0,.3)}
    if(q.pull)for(const t of G.units)if(!t.dead&&t.team!==q.team&&inQ(t)&&!(t.ccT>0)){t.kx=(q.x-t.x)*1.2;t.kz=(q.z-t.z)*1.2}
    if(q.slowAura)for(const t of G.units)if(!t.dead&&t.team!==q.team&&inQ(t)){t.slowT=Math.max(t.slowT,q.slowAura);t.slowP=Math.max(q.slowP||.45,t.slowP||0)}
    if(q.fert&&!q.src.dead&&inQ(q.src)&&bufS(q.src,'fertilize'))q.src.fzT=G.t+.15;
    if(q.reveal)for(const t of G.units)if(!t.dead&&t.team!==q.team&&inQ(t))t.revealT=Math.max(t.revealT,.3);
    if(q.tick<=0){q.tick=q.tickT;let n=0;for(const t of targets())if(!t.dead&&t.team!==q.team&&inQ(t)){n++;if(q.dps>0){const d=q.dps*q.tickT;hurt(t,d,q.src,q.isSup,{slow:q.slow,slowP:q.slowP,sc:q.sc,poison:q.burnT?d/q.tickT:0,ticks:q.burnT,burn:!!q.burnT});if(q.fert&&!q.src.dead&&hasSP(q.src,'fertilize'))healU(q.src,d*.75,q.src);if(q.onHit)q.onHit(t,q)}
        else if(q.slow&&G.units.includes(t)){t.slowT=Math.max(t.slowT,q.slow);t.slowP=Math.max(q.slowP||.45,t.slowP||0)}}
      if(q.ally==='heal')for(const o of G.units)if(!o.dead&&o.team===q.team&&inQ(o))healU(o,q.heal*q.tickT,q.src);
      if(q.onTick)q.onTick(q,n)}
    if(q.t>=q.T){if(q.onEnd)q.onEnd(q);scene.remove(q.m);q.m.material.dispose();G.zones.splice(i,1)}}}
const TIMERS=[];function setTimeoutG(d,fn){TIMERS.push({t:G.t+d,fn})}
function updTimers(){for(let i=TIMERS.length-1;i>=0;i--)if(G.t>=TIMERS[i].t){const f=TIMERS[i].fn;TIMERS.splice(i,1);f()}}
