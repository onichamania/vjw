// ===================== 敵とボス =====================
const NOW=()=>Date.now()/1000;
const MOBLIST=[];
function mobModel(id){const g=new THREE.Group(),c=MOBS[id].col,s=MOBS[id].size;const add=(geo,mat,x,y,z)=>mesh(geo,mat,x,y,z,g);
  if(id==='ladybug'){const b=add(new THREE.SphereGeometry(.75,12,8,0,TAU,0,Math.PI/2),M(c),0,.15,0);for(let k=0;k<5;k++)add(new THREE.SphereGeometry(.14,6,5),MAT.black,Math.cos(k*1.3)*.45,.55,Math.sin(k*1.3)*.4);add(new THREE.SphereGeometry(.35,8,6),MAT.black,0,.3,-.75)}
  else if(id==='rhino'){add(new THREE.SphereGeometry(.8,12,8),M(c),0,.6,0).scale.set(1,.7,1.25);const h=add(new THREE.ConeGeometry(.2,.9,6),M(0x2a2a3a),0,1.1,-.8);h.rotation.x=-.6}
  else if(id==='spider'){add(new THREE.SphereGeometry(1,12,8),M(c),0,1.4,.4);add(new THREE.SphereGeometry(.6,10,8),M(c),0,1.3,-.8);for(let k=0;k<8;k++){const sx=k<4?-1:1,z=(k%4)*.45-.6;const l=add(new THREE.BoxGeometry(1.8,.12,.12),M(c),sx*1.1,1,z);l.rotation.z=sx*.6}
    for(const sx of[-1,1])add(new THREE.SphereGeometry(.12,6,5),MAT.red,sx*.2,1.5,-1.3)}
  else if(id==='mantis'){add(new THREE.BoxGeometry(.6,.6,2),M(c),0,1.2,0);add(new THREE.BoxGeometry(.5,1.2,.5),M(c),0,2,-.9);add(new THREE.SphereGeometry(.4,8,6),M(0x7ad050),0,2.8,-1);for(const sx of[-1,1]){const a=add(new THREE.BoxGeometry(.18,1.2,.18),M(c),sx*.45,2.1,-1.4);a.rotation.x=.9}}
  else if(id==='scorpion'){add(new THREE.SphereGeometry(.8,10,8),M(c),0,.7,0).scale.set(1,.6,1.4);const t=add(new THREE.CylinderGeometry(.15,.25,1.8,6),M(c),0,1.6,1.1);t.rotation.x=-.7;add(new THREE.ConeGeometry(.2,.5,6),MAT.black,0,2.3,.6);for(const sx of[-1,1])add(new THREE.BoxGeometry(.4,.3,.9),M(c),sx*.8,.6,-1.1)}
  else if(id==='werewolf'){add(new THREE.BoxGeometry(1.2,1.6,.8),M(c),0,2.2,0);add(new THREE.BoxGeometry(.9,.9,1),M(c),0,3.4,-.1);add(new THREE.BoxGeometry(.5,.4,.6),M(0x4a3a2a),0,3.3,-.8);for(const sx of[-1,1]){add(new THREE.BoxGeometry(.35,1.4,.4),M(c),sx*.8,2,0);add(new THREE.BoxGeometry(.45,1.4,.5),M(c),sx*.3,.7,0);add(new THREE.ConeGeometry(.15,.4,4),M(c),sx*.3,4,0);add(new THREE.SphereGeometry(.08,6,5),M(0xffd84a),sx*.22,3.55,-.62)}}
  else if(id==='kingbeetle'){add(new THREE.SphereGeometry(2,14,10),M(c),0,1.8,0).scale.set(1,.7,1.3);add(new THREE.SphereGeometry(1,10,8),M(0x1a2a6a),0,1.8,-2.4);const cr=add(new THREE.CylinderGeometry(.8,.6,.6,8),M(0xffd84a),0,3,-2.2)}
  else if(id==='tunnelbear'){const b=bearModel({col:c,snout:0x8a6a4a});b.scale.setScalar(1.6);g.add(b)}
  else if(id==='stumpsnail'){const sh=add(new THREE.SphereGeometry(3.5,16,12),M(0x9a7aa0),0,4,1);sh.scale.set(.8,1,1);add(new THREE.TorusGeometry(2.2,.5,8,20),M(0x7a5a80),.4,4,1).rotation.y=Math.PI/2;add(new THREE.BoxGeometry(2.4,1.6,8),M(0xb0d0a0),0,.8,-1);for(const sx of[-1,1])add(new THREE.CylinderGeometry(.15,.15,1.6,6),M(0xb0d0a0),sx*.6,2.2,-4.6)}
  else if(id==='coconutcrab'){add(new THREE.SphereGeometry(3,14,10),M(c),0,2.4,0).scale.set(1.3,.6,1);for(const sx of[-1,1]){add(new THREE.BoxGeometry(1.6,1.2,2.4),M(0xe07a3a),sx*3.6,2.2,-2.4);add(new THREE.SphereGeometry(.35,8,6),MAT.black,sx*.8,3.6,-2.2);for(let k=0;k<3;k++){const l=add(new THREE.BoxGeometry(2.4,.3,.3),M(c),sx*3.2,1,k*1.1-.8);l.rotation.z=sx*.5}}}
  else if(id==='mondochick'){add(new THREE.SphereGeometry(3,16,12),M(c),0,3.2,0);add(new THREE.SphereGeometry(2,14,10),M(c),0,6.2,-1);add(new THREE.ConeGeometry(.5,1,6),M(0xff8a2a),0,6.1,-3.2).rotation.x=-Math.PI/2;for(const sx of[-1,1])add(new THREE.SphereGeometry(.3,8,6),MAT.black,sx*.8,6.7,-2.7)}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(g);return g}
// 名前と体力のラベル
function mobLabel(m){const d=document.createElement('div');d.className='lab';d.innerHTML=`${MOBS[m.id].jp} <small>Lv${m.lv}</small><div class="hb"><i></i></div>`;document.body.appendChild(d);m.lab=d;m.labBar=d.querySelector('i')}
function spawnMob(id,lv,x,z,y,key,o){const B=MOBS[id],m=Object.assign({id,lv,hp:B.hp[lv],maxHp:B.hp[lv],x,y,z,hx:x,hz:z,size:B.size,key,dead:false,atkT:rr(1,2),wind:0,stun:0,face:0,m:mobModel(id),field:PL.inRoom?null:G.field,room:PL.inRoom},o||{});
  if(B.saveHp&&ST.snailHp>0)m.hp=ST.snailHp;mobLabel(m);MOBLIST.push(m);return m}
function removeMob(m){scene.remove(m.m);if(m.lab)m.lab.remove();const i=MOBLIST.indexOf(m);if(i>=0)MOBLIST.splice(i,1)}
// フィールドに入ったら敵を出す（復活までの時間は本家どおり・現実の時間）
function onEnterField(fid){zoneText();if(!fid)return;const f=FIELDS[fid];
  f.mobs.forEach(([id,n,l0,l1],j)=>{for(let i=0;i<n;i++){const key=fid+':'+j+':'+i;if(MOBLIST.some(m=>m.key===key))continue;if(NOW()<(ST.mob[key]||0))continue;
    spawnMob(id,Math.floor(rr(l0,l1+1)),f.x+rr(-f.w/3,f.w/3),f.z+rr(-f.h/3,f.h/3),f.y,key)}});
  if(fid==='stump'&&NOW()>=(ST.mob.stumpsnail||0)&&!MOBLIST.some(m=>m.id==='stumpsnail')){note('🐌 切り株カタツムリがいる！（体力は保存されます）');spawnMob('stumpsnail',6,f.x+8,f.z,f.y,'stumpsnail',{ang:0})}
  if(fid==='coconut'&&NOW()>=(ST.mob.coconutcrab||0)&&!MOBLIST.some(m=>m.id==='coconutcrab')){big('🦀 ココナッツクラブ！',1.6);spawnMob('coconutcrab',12,f.x,f.z+4,f.y,'coconutcrab')}
  if(fid==='mountaintop'&&mondoReady()&&!MOBLIST.some(m=>m.id==='mondochick')){big('🐤 モンドチック！',1.6);spawnMob('mondochick',8,f.x,f.z,f.y,'mondochick',{born:G.t})}}
// モンドチックは毎時0分から出てくる（本家と同じ）
function mondoReady(){const d=new Date(),h=Math.floor(Date.now()/3600000);return d.getMinutes()<15&&(ST.mob.mondoHour||0)!==h}
// ボスの部屋に入る
function enterRoom(id){const R=ROOMS[id];PL.inRoom=id;teleport(R.x,R.z+R.d/2-5,0);note('🚪 '+R.jp);
  if(id==='kblair'&&NOW()>=(ST.mob.kingbeetle||0)&&!MOBLIST.some(m=>m.id==='kingbeetle')){big('🪲 キングビートル！',1.6);spawnMob('kingbeetle',7,R.x,R.z-6,0,'kingbeetle')}
  if(id==='tunnel'&&NOW()>=(ST.mob.tunnelbear||0)&&!MOBLIST.some(m=>m.id==='tunnelbear')){big('🐻 トンネルベア！（一撃でやられる）',2);spawnMob('tunnelbear',9,R.x,R.z+R.d/2-16,0,'tunnelbear')}
  if((id==='kblair'&&NOW()<(ST.mob.kingbeetle||0))||(id==='tunnel'&&NOW()<(ST.mob.tunnelbear||0)))note('まだ復活していない（あと'+fmtT((id==='kblair'?ST.mob.kingbeetle:ST.mob.tunnelbear)-NOW())+'）')}
// ハチがねらう敵（プレイヤーの近くで、こちらに向かってくる敵）
function targetMob(b){let best=null,bd=1e9;for(const m of MOBLIST){if(m.dead)continue;const dp=Math.hypot(m.x-PL.x,m.z-PL.z);if(dp>(m.size>3?26:16))continue;if(m.room?m.room!==PL.inRoom:(m.field!==G.field||PL.inRoom))continue;const d=Math.hypot(m.x-b.x,m.z-b.z);if(d<bd){bd=d;best=m}}return best}
// ハチの攻撃：レベルが低いと外れる（1/2^(敵のレベル−ハチのレベル)）、会心あり
function beeHit(b,d,m){const diff=m.lv-d.lv;if(diff>0&&Math.random()>1/Math.pow(2,diff)){fx.dmgNum(m.x,m.y+m.size*2,m.z,'MISS','#aaa');return}
  let dmg=beeAtkD(d);const crit=Math.random()*100<P.crit;if(crit)dmg*=1+P.critPow/100;if(m.hacked>G.t)dmg*=1.25;hurtMob(m,dmg,b,crit);addBond(b,.2)}
function hurtMob(m,dmg,src,crit){if(m.dead)return;m.hp-=dmg;fx.dmgNum(m.x+rr(-.5,.5),m.y+m.size*1.8,m.z,(crit?'💥':'')+Math.round(dmg),crit?'#ffe07a':'#fff');SFX.hit();
  if(MOBS[m.id].saveHp)ST.snailHp=Math.max(1,m.hp);if(m.hp<=0)killMob(m)}
function killMob(m){const B=MOBS[m.id];m.dead=true;removeMob(m);fx.burst(m.x,m.y+1,m.z,[1,1,.6],24);
  ST.st.kill[m.id]=(ST.st.kill[m.id]||0)+1;ST.st.bp+=B.bp;note('⚔️ '+B.jp+'をたおした！');
  ST.mob[m.key]=NOW()+B.resp*(1+P.respawn/100);if(m.id==='stumpsnail')ST.snailHp=0;if(m.id==='mondochick')ST.mob.mondoHour=Math.floor(Date.now()/3600000);
  // きずな（全部のハチ）
  if(B.bond)for(const b of BEELIST)addBond(b,B.bond);
  // 落とし物：輪になって落ちる
  const drops=[];if(B.honey)drops.push(['honey',B.honey]);const luck=1+P.loot/100;
  for(const [id,ch,ns] of B.drops)if(Math.random()<ch*luck)drops.push([id,pick(ns)]);
  if(m.id==='tunnelbear'&&ST.firstTB){ST.firstTB=0;drops.push([pick(['giftedsilveregg','giftedgoldegg','gifteddiamondegg','staregg']),1])}
  drops.forEach(([id,n],i)=>{const a=i/drops.length*TAU,r=m.size+1.5;id==='honey'?spawnToken('honey',m.x+Math.cos(a)*r,m.z+Math.sin(a)*r,m.y,{v:n},30):spawnToken('item',m.x+Math.cos(a)*r,m.z+Math.sin(a)*r,m.y,{id,n},30)});
  save()}
// ---- 敵の動き ----
let fallingCoco=[];
function updMobs(dt){for(let i=MOBLIST.length-1;i>=0;i--){const m=MOBLIST[i],B=MOBS[m.id];if(m.dead)continue;
  // フィールドの敵は、プレイヤーがはなれてしばらくすると消える
  const away=m.room?PL.inRoom!==m.room:(!!PL.inRoom||m.field!==G.field);m.away=away?(m.away||0)+dt:0;if(m.away>15&&!B.saveHp){removeMob(m);continue}if(m.away>15&&B.saveHp){removeMob(m);continue}
  m.stun=Math.max(0,m.stun-dt);
  if(m.id==='mondochick'){m.hp-=333*dt;if(m.hp<=0){killMob(m);continue}if(new Date().getMinutes()>=15&&m.hp>0){note('モンドチックは帰っていった');removeMob(m);continue}}
  const f=m.field&&FIELDS[m.field],dx=PL.x-m.x,dz=PL.z-m.z,d=Math.hypot(dx,dz),spd=m.id==='tunnelbear'?3.5:m.id==='stumpsnail'?1.2:B.size>3?2.2:3.4;
  let tx=m.x,tz=m.z;
  if(m.id==='stumpsnail'){m.ang+=dt*.06;tx=f.x+Math.cos(m.ang)*9;tz=f.z+Math.sin(m.ang)*9;m.face=Math.atan2(-(tx-m.x),-(tz-m.z))}
  else if(!away&&!PL.dead&&m.stun<=0){tx=PL.x;tz=PL.z;m.face=Math.atan2(-dx,-dz)}else{tx=m.hx;tz=m.hz}
  // 攻撃：ためてから飛びかかる
  if(m.wind>0){m.wind-=dt;if(m.wind<=0){const r=m.size+1.1;if(Math.hypot(PL.x-m.x,PL.z-m.z)<r+.6)hurtPlayer(B.dmg,m);m.lunge=.25}}
  else if(!away&&m.stun<=0&&d<m.size+1.6&&m.id!=='stumpsnail'){m.atkT-=dt;if(m.atkT<=0){m.atkT=m.id==='tunnelbear'?2.2:1.8;m.wind=.55}}
  else{const td=Math.hypot(tx-m.x,tz-m.z);if(td>m.size*.6+.4&&m.stun<=0){const s=Math.min(td,spd*dt*(m.lunge>0?3:1));let nx=m.x+(tx-m.x)/td*s,nz=m.z+(tz-m.z)/td*s;
      if(f&&!B.boss){nx=clamp(nx,f.x-f.w/2,f.x+f.w/2);nz=clamp(nz,f.z-f.h/2,f.z+f.h/2)}m.x=nx;m.z=nz}}
  if(m.lunge>0)m.lunge-=dt;
  if(m.id==='stumpsnail'&&d<3.5&&Math.random()<dt)hurtPlayer(B.dmg,m);
  // ココナッツクラブ：ココナッツを降らせる
  if(m.id==='coconutcrab'&&!away){m.coco=(m.coco||3)-dt;if(m.coco<=0){m.coco=2.2;for(let k=0;k<3;k++){const x=PL.x+rr(-6,6),z=PL.z+rr(-6,6);const cm=mesh(new THREE.SphereGeometry(.6,8,6),MAT.brown,x,m.y+18,z);fallingCoco.push({x,z,y:m.y+18,m:cm,gy:m.y})}}}
  m.y=m.room?0:(f?f.y:m.y);m.m.position.set(m.x,m.y+(m.wind>0?Math.sin(G.t*40)*.05:0),m.z);m.m.rotation.y=lerpAng(m.m.rotation.y,m.face,Math.min(1,dt*6));
  // ラベル
  const [sx,sy,ok]=toScreen(m.x,m.y+m.size*2.2+1,m.z);m.lab.style.display=ok&&Math.hypot(cam.position.x-m.x,cam.position.z-m.z)<80?'':'none';m.lab.style.left=sx+'px';m.lab.style.top=sy+'px';m.labBar.style.width=Math.max(0,m.hp/m.maxHp*100)+'%'}
  for(let i=fallingCoco.length-1;i>=0;i--){const c=fallingCoco[i];c.y-=18*dt;c.m.position.y=c.y;if(c.y<=c.gy+.6){if(Math.hypot(PL.x-c.x,PL.z-c.z)<1.6)hurtPlayer(150);fx.burst(c.x,c.gy+.5,c.z,[.7,.5,.3],8);scene.remove(c.m);fallingCoco.splice(i,1);
    if(Math.random()<.5)spawnToken('item',c.x,c.z,c.gy,{id:'coconut',n:1})}}}
