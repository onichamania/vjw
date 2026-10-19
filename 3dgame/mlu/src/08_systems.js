// ================= しくみ（資源・タイル・建物・敵・ポータル）=================
const OPT={yield:+LSget('lu-yield','1')||1};
// ---- 資源 ----
let HUD_DIRTY=true;const GAIN={};
function addRes(k,n){if(!n)return;PL.inv[k]=(PL.inv[k]||0)+n;HUD_DIRTY=true;if(n>0)GAIN[k]=(GAIN[k]||0)+n}
const has=(k,n)=>(PL.inv[k]||0)>=n;
function bonus(k){const b=skinOf().bonus;return b&&b[k]||1}
// ---- 飛ぶかけら ----
const PIECES=[],PIECE_POOL={};
function pieceMesh(k){const pool=PIECE_POOL[k]||(PIECE_POOL[k]=[]);const m=pool.pop()||new THREE.Mesh(pieceGeo(k),k==='core'?lam({emissive:0x802070}):VCMAT);m.visible=true;world.add(m);return m}
// 落ちる→プレイヤーへ吸いこまれる（val をプレイヤーに足す）
function dropPieces(k,total,from,up){if(total<=0)return;const n=Math.min(total,k==='coin'?6:5);let left=total;
  for(let i=0;i<n;i++){const v=i===n-1?left:Math.floor(total/n);left-=v;const m=pieceMesh(k);m.position.copy(from);const t=_t1.set(Math.random()-.5,Math.random()-.5,Math.random()-.5);tangent(t,up,t);
    PIECES.push({k,m,val:v,vel:t.multiplyScalar(2+Math.random()*2).addScaledVector(up,4+Math.random()*2),age:0,mode:'drop',spin:new THREE.Vector3(Math.random()*8,Math.random()*8,0)})}}
// プレイヤーから場所へ飛ぶ（見た目だけ）
function sendPieces(k,from,to){const m=pieceMesh(k);m.position.copy(from);PIECES.push({k,m,val:0,to:to.clone(),age:0,mode:'send',spin:new THREE.Vector3(6,4,0)})}
function updatePieces(dt){const pp=_t1.copy(PL.u).multiplyScalar(PL.r+.8);
  for(let i=PIECES.length-1;i>=0;i--){const p=PIECES[i];p.age+=dt;p.m.rotation.x+=p.spin.x*dt;p.m.rotation.y+=p.spin.y*dt;let done=false;
    if(p.mode==='drop'){if(p.age<.45){const up=_t2.copy(p.m.position).normalize();p.vel.addScaledVector(up,-14*dt);p.m.position.addScaledVector(p.vel,dt)}
      else{const k2=1-Math.exp(-dt*(8+p.age*14));p.m.position.lerp(pp,k2);if(p.m.position.distanceTo(pp)<.5||p.age>2.2){done=true;if(p.val>0&&PL.dead<=0){addRes(p.k,p.val);p.k==='coin'?SFX.coin():SFX.pick(i)}else if(p.val>0)addRes(p.k,p.val)}}}
    else{const k2=1-Math.exp(-dt*9);p.m.position.lerp(p.to,k2);if(p.m.position.distanceTo(p.to)<.4||p.age>1)done=true}
    if(done){world.remove(p.m);PIECE_POOL[p.k].push(p.m);PIECES.splice(i,1)}}}
// ---- 小さなつぶ（当たったときのくず）----
const SPARKS=[];const sparkGeo=new THREE.BoxGeometry(.12,.12,.12);
function sparks(pos,up,col,n){for(let i=0;i<n;i++){const m=new THREE.Mesh(sparkGeo,new THREE.MeshBasicMaterial({color:col}));m.position.copy(pos);const v=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5);tangent(v,up,v);world.add(m);
  SPARKS.push({m,v:v.multiplyScalar(2+Math.random()*3).addScaledVector(up,2+Math.random()*3),t:.5+Math.random()*.3})}}
function updateSparks(dt){for(let i=SPARKS.length-1;i>=0;i--){const s=SPARKS[i];s.t-=dt;const up=_t1.copy(s.m.position).normalize();s.v.addScaledVector(up,-12*dt);s.m.position.addScaledVector(s.v,dt);s.m.scale.setScalar(Math.max(.01,s.t*2));if(s.t<=0){world.remove(s.m);s.m.material.dispose();SPARKS.splice(i,1)}}}
// ---- 木・岩をたたく ----
const NDIRTY=new Set();
function hitNode(o,dmg,mine){const N=NODE[o.k];if(!o.alive)return;o.hp-=dmg;o.shake=.25;NDIRTY.add(o);
  const top=_t1.copy(o.pos).addScaledVector(o.up,N.hh*.5).clone();
  if(N.tool==='axe')SFX.chop();else SFX.mine();sparks(top,o.up,N.res?RES[N.res].c:'#cccccc',4);
  // 体力に合わせて少しずつ出す
  if(N.res){const mult=(N.res==='coin'||N.res==='core'?1:OPT.yield)*bonus(N.res);const total=Math.round(N.amt*mult),done=Math.round(total*(1-Math.max(0,o.hp)/N.hp));const give=done-(o.given||0);o.given=done;
    if(give>0)dropPieces(N.res,give,top,o.up)}
  if(o.hp<=0){o.alive=false;o.t=N.rsp;o.given=0;SFX.fell();sparks(top,o.up,'#ffffff',6);
    if(o.k==='sword'){if(PL.tools.weap<9){PL.tools.weap=9;PL.hp=maxHp();SFX.level();banner('剣 Lv9 を手に入れた！','こうげき 15・体力 120')}W.sword=1}
    if(o.k==='core'){W.core=1;banner('ソースコアを手に入れた！','ポータルを動かすのに使います')}
    if(mine&&NET.on)NET.nodeGone(o)}}
function nodeDown(o,t){if(!o.alive&&!NODE[o.k].once)return;o.alive=false;o.hp=0;o.t=t==null?NODE[o.k].rsp:t;NDIRTY.add(o)}
function updateNodes(dt){for(const o of NODES){if(!o.alive&&!NODE[o.k].once){o.t-=dt;if(o.t<=0&&!o.hidden){o.alive=true;o.hp=NODE[o.k].hp;o.grow=0;NDIRTY.add(o)}}
    if(o.grow<1){o.grow=Math.min(1,o.grow+dt*2.5);NDIRTY.add(o)}if(o.shake>0){o.shake=Math.max(0,o.shake-dt);NDIRTY.add(o)}}
  for(const o of NDIRTY)drawNode(o);NDIRTY.clear()}
// ---- 敵 ----
const ENEMIES=[];
function makeEnemies(){for(const s of SPAWNS){const c=CELLS[s.cell],E=ENEMY[s.k];const home=c.c.clone();const e={k:s.k,n:s.n,cell:s.cell,home,u:home.clone(),face:c.e1.clone(),hp:E.hp,alive:true,t:0,st:'idle',atk:0,wind:0,r:E.r,id:ENEMIES.length,wT:Math.random()*3,
    wdir:c.e2.clone(),mesh:makeEnemy(s.k),vis:false,flash:0,walk:0,pos:new THREE.Vector3()};e.mesh.visible=false;world.add(e.mesh);ENEMIES.push(e)}}
function enemyGround(e){const c=CELLS[e.cell];return groundAt(e.u,c)}
const _eu=new THREE.Vector3();
function updateEnemies(dt){const host=!NET.on||NET.host;
  for(const e of ENEMIES){const open=W.open.has(e.n);e.vis=open&&e.alive;e.mesh.visible=e.vis||(open&&e.dying>0);
    if(!open)continue;
    if(e.dying>0){e.dying-=dt;e.mesh.scale.setScalar(ENEMY[e.k].sc*Math.max(.01,e.dying/.4));e.mesh.position.addScaledVector(e.u,dt*2);if(e.dying<=0)e.mesh.visible=false;continue}
    if(!e.alive){if(host){e.t-=dt;if(e.t<=0)reviveEnemy(e)}continue}
    if(e.flash>0)e.flash-=dt;
    if(host)enemyAI(e,dt);else netEnemyFollow(e,dt);
    // 見た目
    e.pos.copy(e.u).multiplyScalar(enemyGround(e));e.mesh.position.copy(e.pos);frameQuat(e.u,e.face,e.mesh.quaternion);
    const P=e.mesh.userData.P,w=e.mv?Math.sin(e.walk):0;e.walk+=dt*(e.mv?9:0);if(P.legL){P.legL.rotation.x=w*.7;P.legR.rotation.x=-w*.7}
    if(P.armR){P.armR.rotation.x=e.wind>0?-2.2*(1-e.wind/.5):e.atkAnim>0?(-2.2+2.8*(1-e.atkAnim/.2)):-w*.6;if(P.armL)P.armL.rotation.x=w*.6}
    if(e.atkAnim>0)e.atkAnim-=dt;
    if(e.flash>0)e.mesh.scale.setScalar(ENEMY[e.k].sc*(1+e.flash));else if(e.mesh.scale.x!==ENEMY[e.k].sc)e.mesh.scale.setScalar(ENEMY[e.k].sc)}}
function reviveEnemy(e){e.alive=true;e.hp=ENEMY[e.k].hp;e.u.copy(e.home);e.cell=cellAt(e.u,e.cell);e.st='idle';e.mesh.scale.setScalar(ENEMY[e.k].sc);if(NET.on&&NET.host)NET.enemyDirty=true}
function enemyAI(e,dt){const E=ENEMY[e.k];
  // いちばん近いプレイヤー（オンラインならほかの人も）
  let tgt=null,td=1e9;const cands=[{u:PL.u,ok:PL.dead<=0&&!PL.inWater,me:true}].concat(NET.on?NET.targets():[]);
  for(const c of cands){if(!c.ok)continue;const d=arcDist(e.u,c.u,SEA);if(d<td){td=d;tgt=c}}
  const homeD=arcDist(e.home,e.u,SEA);
  if(tgt&&(td<(E.boss?5.5:4.5)||(e.st==='chase'&&arcDist(e.home,tgt.u,SEA)<9)))e.st='chase';else if(e.st==='chase')e.st='return';
  let dir=null,spd=E.spd;e.mv=false;
  if(e.wind>0){e.wind-=dt;if(e.wind<=0){e.atk=1.1;e.atkAnim=.2;if(tgt&&td<1.5+e.r){if(tgt.me)damagePlayer(E.atk,'enemy');else NET.hitPlayer(tgt.peer,E.atk)}}}
  else if(e.st==='chase'&&tgt){if(td>1.0+e.r)dir=tangent(_eu.copy(tgt.u).sub(e.u),e.u,_t1);else{e.atk-=dt;if(e.atk<=0){e.wind=.5}const f=tangent(_eu.copy(tgt.u).sub(e.u),e.u,_t1);e.face.lerp(f,1-Math.exp(-dt*10)).normalize()}}
  else if(e.st==='return'){if(homeD>.3)dir=tangent(_eu.copy(e.home).sub(e.u),e.u,_t1);else e.st='idle'}
  else{e.wT-=dt;if(e.wT<=0){e.wT=2+Math.random()*3;e.wdir.set(Math.random()-.5,Math.random()-.5,Math.random()-.5);tangent(e.wdir,e.u,e.wdir);e.wGo=Math.random()<.6?1.2:0}if(e.wGo>0&&homeD<1.6){e.wGo-=dt;dir=e.wdir;spd*=.4}}
  if(dir){const nu=_t2.copy(e.u).addScaledVector(dir,spd*dt/SEA).normalize();const nc=cellAt(nu,e.cell);const C=CELLS[nc];
    if(isLand(C)&&C.a!==12){e.u.copy(nu);e.cell=nc;e.mv=true}e.face.lerp(dir,1-Math.exp(-dt*10));tangent(e.face,e.u,e.face)}
  // 仲間どうし・木や岩とぶつからない
  for(const o of ENEMIES)if(o!==e&&o.alive&&o.vis){const d=arcDist(o.u,e.u,SEA),need=o.r+e.r;if(d<need&&d>1e-4){const p=tangent(_eu.copy(e.u).sub(o.u),e.u,_t3);e.u.addScaledVector(p,(need-d)*.5/SEA).normalize()}}
  pushOut(e.u,e.r*.8,nearList(e.cell))}
function hitEnemy(e,dmg,mine){if(!e.alive)return;SFX.slash();SFX.hit();e.flash=.15;const top=e.pos.clone().addScaledVector(e.u,1.2*ENEMY[e.k].sc);sparks(top,e.u,'#ffffff',5);floatText(String(dmg),top.clone().addScaledVector(e.u,.6),'#ffffff');
  if(NET.on&&!NET.host){NET.hitEnemy(e,dmg);return}
  e.hp-=dmg;e.st='chase';const kb=tangent(_t1.copy(e.u).sub(PL.u),e.u,_t1);e.u.addScaledVector(kb,.15/SEA).normalize();
  if(e.hp<=0)killEnemy(e,mine?'me':null);if(NET.on)NET.enemyDirty=true}
function killEnemy(e,who){e.alive=false;e.t=ENEMY[e.k].rsp;e.dying=.4;SFX.fell();const top=e.pos.clone().addScaledVector(e.u,1);sparks(top,e.u,'#ffd060',8);
  if(who==='me'){const D=ENEMY[e.k].drop;for(const k in D)dropPieces(k,Math.round(D[k]*(k==='coin'?1:OPT.yield)*bonus(k)),top,e.u);if(ENEMY[e.k].boss)banner(ENEMY[e.k].n+'をたおした！','')}
  else if(who&&NET.on)NET.giveDrop(who,e.k)}
// ---- タイルを買う ----
const GH_ON=new Set();let PAY={n:-1,t:0,cnt:0};
function payTick(dt){PAY.t-=dt;let on=-1;
  for(const n of GH_ON){const c=CELLS[TILES[n].cell];if(arcDist(PL.u,c.c,SEA)<1.55&&PL.dead<=0){on=n;break}}
  if(on!==PAY.n){PAY.n=on;PAY.cnt=0;PAY.t=.25}
  if(on<0||PAY.t>0)return;PAY.t=.055;const T=TILES[on],paid=W.paid[on]||(W.paid[on]={});let any=false,done=true;
  for(const k in T.cost){const need=T.cost[k]-(paid[k]||0);if(need<=0)continue;const have=PL.inv[k]||0;const step=Math.min(need,have,Math.max(1,Math.ceil(T.cost[k]*.07)));
    if(step>0){addRes(k,-step);paid[k]=(paid[k]||0)+step;any=true;PAY.cnt++;if(PAY.cnt%2===0)sendPieces(k,_t1.copy(PL.u).multiplyScalar(PL.r+.8),CELLS[T.cell].c.clone().multiplyScalar(SEA+.6));SFX.pay(PAY.cnt);if(NET.on)NET.pay(on,k,step)}
    if(paid[k]<T.cost[k])done=false}
  if(done&&(!NET.on||NET.host))unlockTile(on,true)}
// ---- タイルが開く ----
const RISING=[];let AREA_SEEN=new Set([1]);
function unlockTile(n,anim){if(W.open.has(n))return;W.open.add(n);delete W.paid[n];const T=TILES[n],c=CELLS[T.cell];
  showTile(c.i,anim);rebuildShore();refreshGhosts();
  if(anim){SFX.unlock();SFX.rise();sparks(c.c.clone().multiplyScalar(SEA+.5),c.c,'#ffffff',14);
    if(!AREA_SEEN.has(T.a)&&AREA[T.a]&&T.a<11){AREA_SEEN.add(T.a);banner(AREA[T.a].n,'新しい場所が見つかった！')}
    const bk=T.cont.find(k=>BLD[k]);if(bk&&BLD[bk].kind!=='deco')setTimeout(()=>toast(BLD[bk].n+'ができた！'),700);
    if(NET.on&&NET.host)NET.unlocked(n);saveSoon()}
  HUD_DIRTY=true}
function showTile(ci,anim){const c=CELLS[ci];if(c.a!==12){const m=TILE_MESH[ci]||buildTileMesh(c);m.visible=true;if(anim)RISING.push({m,c,t:0})}
  for(const o of BY_CELL[ci]||[]){if(o.isB){o.m.visible=true;if(anim)RISING.push({m:o.m,c,t:0,base:o.m.position.clone()});if(!o.pads)makePads(o)}else{if(anim){o.grow=0}NDIRTY.add(o)}}
  drawDecoCell(ci)}
function updateRising(dt){for(let i=RISING.length-1;i>=0;i--){const r=RISING[i];r.t+=dt*1.6;const k=Math.min(1,r.t);const off=(1-easeOutBack(k))*-(r.c.h+2.4);
  if(r.base)r.m.position.copy(r.base).addScaledVector(r.c.c,off);else r.m.position.copy(r.c.c).multiplyScalar(off);if(k>=1){if(r.base)r.m.position.copy(r.base);else r.m.position.set(0,0,0);RISING.splice(i,1)}}}
// 買える目印を作り直す
function refreshGhosts(){calcMinLock();for(const n in GHOST){if(!available(+n)){GHOST[n].visible=false;GH_ON.delete(+n)}}
  for(let n=1;n<=NTILE;n++)if(available(n)){ghostOf(n).visible=true;GH_ON.add(n)}
  for(const k of TOLLS)k.m.visible=k.show()}
// ---- 通せんぼ（大きなトロル・大イエティ）----
const TOLLS=[];
function makeTolls(){for(let n=1;n<=NTILE;n++){const T=TILES[n];const c=CELLS[T.cell];
  if(T.cont.includes('troll')){const ch=TILES.findIndex((t,i)=>i>0&&t.par===n&&t.cont.includes('cave'));const m=bigTroll();world.add(m);const tt={n,m,show:()=>W.open.has(n)&&!(ch>0&&W.open.has(ch)),c,on:true};TOLLS.push(tt);placeToll(tt,0)}
  if(T.cont.includes('yetiBig')){const m=bigYeti();world.add(m);const tt={n,m,show:()=>available(n),c,ghost:true};TOLLS.push(tt);placeToll(tt,0)}}}
function placeToll(tt,ph){const c=tt.c;const r=tt.ghost?SEA+.1:topR(c);const pos=c.c.clone().multiplyScalar(r).addScaledVector(c.e1,tt.ghost?0:.4);tt.m.position.copy(pos);frameQuat(c.c,c.e2,tt.m.quaternion);tt.m.rotateY(Math.sin(ph)*.1);tt.m.scale.setScalar(1+Math.sin(ph*2)*.02)}
// ---- 建物の台 ----
function makePads(B){const kind=BLD[B.k].kind;B.pads=[];if(kind==='deco')return;const up=B.up;
  B.pads.push(...padMesh(B.pIn,up,.95,kind==='trade'?'#ffd84a':kind==='eq'?'#7ae0ff':kind==='portal'||kind==='skin'?'#ff8af0':'#ffffff'));
  if(B.pOut)B.pads.push(...padMesh(B.pOut,up,.95,'#8aff8a'));B.st=B.st||{}}
const ON_PAD=(B,p)=>p&&arcDist(PL.u,_t1.copy(p).normalize(),SEA)<.95&&PL.dead<=0;
let PADUI=null;
function updateBuildings(dt,rdt){let ui=null;rdt=rdt||dt;
  for(const B of BLDS){if(!W.open.has(B.n))continue;const D=BLD[B.k],S=B.st||(B.st={});
    if(D.kind==='ref'){// 精錬所：入れたぶんを順番に（オフラインでも進む）
      const ink=Object.keys(D.inp)[0],per=D.inp[ink];S.q=S.q||0;S.out=S.out||0;S.tm=S.tm||0;
      if(S.q>=per){S.tm+=rdt;while(S.tm>=D.t&&S.q>=per){S.tm-=D.t;S.q-=per;S.out++}}else S.tm=0;
      if(ON_PAD(B,B.pIn)){ui={B,type:'ref'};B.pt=(B.pt||0)-dt;if(B.pt<=0&&has(ink,1)&&S.q<900){B.pt=.05;const n=Math.min(PL.inv[ink],Math.max(per,Math.ceil(PL.inv[ink]*.08)),900-S.q);addRes(ink,-n);S.q+=n;sendPieces(ink,_t1.copy(PL.u).multiplyScalar(PL.r+.8),B.pos.clone().addScaledVector(B.up,1));SFX.pay(3)}}
      if(ON_PAD(B,B.pOut)&&S.out>0){dropPieces(D.out,S.out,B.pOut.clone().addScaledVector(B.up,.6),B.up);S.out=0}
      drawOutPile(B,D.out,S.out)}
    else if(D.kind==='eq'){const t=D.tool,lv=PL.tools[t],nx=lv+1,cost=(t==='axe'?AXE:t==='pick'?PICK:WEAP)[nx];
      if(S.craft>0){S.craft-=rdt;if(S.craft<=0){S.craft=0;PL.tools[t]=Math.max(PL.tools[t],S.lv);S.paid={};SFX.level();banner(TOOLN[t]+' Lv'+S.lv+'！',t==='weap'?'こうげき '+WPOW[S.lv]+'・体力 '+WHP[S.lv]:'力 '+S.lv);if(t==='weap')PL.hp=maxHp();saveSoon()}}
      if(ON_PAD(B,B.pIn)){ui={B,type:'eq',t,lv,cost,nx};
        if(cost&&!(S.craft>0)&&!(t==='weap'&&lv>=8)){S.paid=S.paid||{};B.pt=(B.pt||0)-dt;if(B.pt<=0){B.pt=.06;let done=true;for(const k in cost){const need=cost[k]-(S.paid[k]||0);if(need<=0)continue;const st=Math.min(need,PL.inv[k]||0,Math.max(1,Math.ceil(cost[k]*.06)));if(st>0){addRes(k,-st);S.paid[k]=(S.paid[k]||0)+st;sendPieces(k,_t1.copy(PL.u).multiplyScalar(PL.r+.8),B.pos.clone().addScaledVector(B.up,1));SFX.pay(5)}if(S.paid[k]<cost[k])done=false}
          if(done){S.craft=CRAFT_T[nx]||5;S.lv=nx;S.ct=S.craft;SFX.craft()}}}}}
    else if(D.kind==='trade'){if(ON_PAD(B,B.pIn)){ui={B,type:'trade'};const ink=Object.keys(D.inp)[0],per=D.inp[ink];B.pt=(B.pt||0)-dt;if(B.pt<=0&&has(ink,per)){B.pt=.12;const times=Math.max(1,Math.min(Math.floor(PL.inv[ink]/per),Math.ceil(PL.inv[ink]/per*.05)));addRes(ink,-per*times);sendPieces(ink,_t1.copy(PL.u).multiplyScalar(PL.r+.8),B.pos.clone().addScaledVector(B.up,1.2));dropPieces('coin',D.k*times,B.pos.clone().addScaledVector(B.up,1.8),B.up)}}}
    else if(D.kind==='portal'){portalTick(B,dt);if(ON_PAD(B,B.pIn))ui={B,type:'portal'}}
    else if(D.kind==='skin'){if(ON_PAD(B,B.pIn)){ui={B,type:'skin'};if(!B.was){B.was=1;openSkins()}}else B.was=0}}
  for(const tt of TOLLS)if(tt.m.visible)placeToll(tt,performance.now()/700);
  PADUI=ui}
// 精錬所の前の、できたものの山
function drawOutPile(B,k,n){const want=Math.min(12,n);B.pile=B.pile||[];while(B.pile.length<want){const m=new THREE.Mesh(pieceGeo(k),VCMAT);m.castShadow=true;world.add(m);B.pile.push(m)}while(B.pile.length>want){world.remove(B.pile.pop())}
  B.pile.forEach((m,i)=>{m.position.copy(B.pOut).addScaledVector(B.up,.1+Math.floor(i/3)*.14).addScaledVector(B.f,(i%3-1)*.25);frameQuat(B.up,B.f,m.quaternion)})}
// ---- ポータル（7つの段階）----
function portalTick(B,dt){const S=B.st;S.step=S.step||0;const U=B.m.userData;U.pieces.forEach((p,i)=>{p.visible=i<S.step;U.ghosts[i].visible=i>=S.step});U.swirl.visible=U.sw2.visible=S.step>=7;if(S.step>=7){U.sw2.rotation.z+=dt*2;U.swirl.material.opacity=.7+Math.sin(performance.now()/300)*.15}
  if(!ON_PAD(B,B.pIn)||PL.dead>0){B.inT=0;return}
  if(S.step>=7){B.inT=(B.inT||0)+dt;if(B.inT>1.2&&!B.went){B.went=1;goPortal()}return}
  const st=PORTAL_STEPS[S.step];S.paid=S.paid||{};B.pt=(B.pt||0)-dt;if(B.pt>0)return;B.pt=.06;let done=true;
  for(const k in st.c){const need=st.c[k]-(S.paid[k]||0);if(need<=0)continue;const s2=Math.min(need,PL.inv[k]||0,Math.max(1,Math.ceil(st.c[k]*.06)));if(s2>0){addRes(k,-s2);S.paid[k]=(S.paid[k]||0)+s2;sendPieces(k,_t1.copy(PL.u).multiplyScalar(PL.r+.8),B.pos.clone().addScaledVector(B.up,2));SFX.pay(4);if(NET.on)NET.portalPay(k,s2)}if(S.paid[k]<st.c[k])done=false}
  if(done&&(!NET.on||NET.host))portalStepDone(B)}
function portalStepDone(B){const S=B.st;S.step++;S.paid={};SFX.unlock();sparks(B.pos.clone().addScaledVector(B.up,2),B.up,'#ff8af0',16);
  if(S.step>=7){SFX.portal();banner('ポータルが動いた！','光の中に入ると…')}else toast('ポータル：'+PORTAL_STEPS[S.step-1].n+' ができた（'+S.step+'/7）');if(NET.on&&NET.host)NET.enemyDirty=true;saveSoon()}
function portalB(){return BLDS.find(b=>b.k==='portal')}
// ---- 次に開けるタイルへの矢印（いちばん番号の小さい、買えるタイル）----
let GUIDE=null;
function guideMesh(){const s=new THREE.Shape();s.moveTo(0,.55);s.lineTo(.42,.05);s.lineTo(.16,.05);s.lineTo(.16,-.4);s.lineTo(-.16,-.4);s.lineTo(-.16,.05);s.lineTo(-.42,.05);s.closePath();
  const g=new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);g.rotateY(Math.PI);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:'#ffe25a',transparent:true,opacity:.9,depthWrite:false}));m.renderOrder=10;
  const o=new THREE.Mesh(new THREE.ShapeGeometry(s).rotateX(-Math.PI/2).rotateY(Math.PI).scale(1.25,1,1.25),new THREE.MeshBasicMaterial({color:'#5a2aa0',transparent:true,opacity:.75,depthWrite:false}));o.position.y=-.01;o.renderOrder=9;
  const grp=new THREE.Group();grp.add(o);grp.add(m);world.add(grp);return grp}
function updateGuide(dt){if(!GUIDE)GUIDE=guideMesh();let best=-1;for(const n of GH_ON)if(best<0||n<best)best=n;
  if(best<0||PL.dead>0||PL.swingK||CAM.map){GUIDE.visible=false;return}const c=CELLS[TILES[best].cell];const d=arcDist(PL.u,c.c,SEA);if(d<3.2){GUIDE.visible=false;return}
  GUIDE.visible=true;const dir=tangent(_t1.copy(c.c).sub(PL.u),PL.u,_t1);const k=1.5+Math.sin(performance.now()/200)*.15;const pos=_t2.copy(PL.u).multiplyScalar(PL.r+.08).addScaledVector(dir,k);GUIDE.position.copy(pos);frameQuat(PL.u,dir,GUIDE.quaternion)}
