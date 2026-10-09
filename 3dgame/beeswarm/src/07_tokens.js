// ===================== トークン・能力・泡・炎・マーク・演出・音 =====================
// ---- 演出（つぶ・数字） ----
const PART=[];const partGeo=new THREE.SphereGeometry(.09,5,4);const PMATS={};
function pmat(c){const k=c.join();return PMATS[k]||(PMATS[k]=new THREE.MeshBasicMaterial({color:new THREE.Color(c[0],c[1],c[2])}))}
const fx={
 burst(x,y,z,c,n){for(let i=0;i<(n||10);i++){const m=new THREE.Mesh(partGeo,pmat(c));m.position.set(x,y,z);scene.add(m);PART.push({m,vx:rr(-3,3),vy:rr(1,5),vz:rr(-3,3),t:0,T:rr(.4,.8)})}},
 pollenPop(x,y,z,c){if(Math.random()<.6)fx.burst(x,y,z,c===0?[1,1,.85]:c===1?[1,.45,.4]:[.45,.7,1],3)},
 honeyFly(x,y,z){if(Math.random()<.7)fx.burst(x,y,z,[1,.75,.15],2)},
 pillar(x,y,z){const m=new THREE.Mesh(new THREE.CylinderGeometry(3,3,30,16,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));m.position.set(x,y+15,z);scene.add(m);PART.push({m,vx:0,vy:0,vz:0,t:0,T:1,fade:1})},
 ring(x,y,z,r,col){const m=new THREE.Mesh(new THREE.RingGeometry(r-.25,r,32),new THREE.MeshBasicMaterial({color:col||0xffffff,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y+.15,z);scene.add(m);PART.push({m,vx:0,vy:0,vz:0,t:0,T:.6,fade:1,grow:1})},
 dmgNum(x,y,z,t,col){const d=document.createElement('div');d.className='dn';d.textContent=t;d.style.color=col||'#fff';document.body.appendChild(d);DNUM.push({d,x,y,z,t:0})}};
const DNUM=[];const _v3=new THREE.Vector3();
function toScreen(x,y,z){_v3.set(x,y,z).project(cam);return[(_v3.x*.5+.5)*innerWidth,(-_v3.y*.5+.5)*innerHeight,_v3.z<1]}
function updFx(dt){for(let i=PART.length-1;i>=0;i--){const p=PART[i];p.t+=dt;if(p.fade){p.m.material.opacity=.6*(1-p.t/p.T);if(p.grow)p.m.scale.setScalar(1+p.t*3)}else{p.vy-=12*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt}
    if(p.t>=p.T){scene.remove(p.m);if(p.fade)p.m.material.dispose();PART.splice(i,1)}}
  for(let i=DNUM.length-1;i>=0;i--){const n=DNUM[i];n.t+=dt;const [sx,sy,ok]=toScreen(n.x,n.y+n.t*1.5,n.z);n.d.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-50%)`;n.d.style.opacity=ok?1-Math.max(0,n.t-.5)/.4:0;if(n.t>.9){n.d.remove();DNUM.splice(i,1)}}}
// ---- 音（小さな電子音） ----
let AC=null;function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d,type,v,slide){const a=ac();if(!a||!SET.sound)return;const o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,a.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(slide,a.currentTime+d);
  g.gain.setValueAtTime((v||.08)*SET.vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d+.02)}
const SFX={swing:()=>tone(520,.06,'triangle',.03,380),token:()=>{tone(880,.08,'sine',.07);setTimeout(()=>tone(1320,.1,'sine',.06),60)},hurt:()=>tone(180,.2,'sawtooth',.08,90),
 levelup:()=>{tone(660,.1);setTimeout(()=>tone(990,.15),90)},hatch:()=>{tone(523,.12);setTimeout(()=>tone(659,.12),100);setTimeout(()=>tone(784,.2),200)},buy:()=>tone(990,.12,'square',.05),hit:()=>tone(300,.05,'square',.03),bomb:()=>tone(140,.25,'sawtooth',.07,60)};
const SET={sound:LS('bss-sound','1')==='1',vol:+LS('bss-vol','.8'),shadow:LS('bss-shadow','1')==='1'};
// ---- トークン ----
const TOKENS=[],TOKTEX={};
const tokGeo=new THREE.CircleGeometry(.62,22);
function tokTex(ic,ring){const k=ic+ring;if(TOKTEX[k])return TOKTEX[k];return TOKTEX[k]=ctex(96,96,(g,w,h)=>{g.fillStyle=ring;g.beginPath();g.arc(48,48,46,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(48,48,38,0,TAU);g.fill();
  g.font='50px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(ic,48,52)})}
// kind: ab=ハチの能力 / honey=ハチミツ / item=アイテム。dataに中身
function spawnToken(kind,x,z,y,data,ttl){const ic=kind==='honey'?'🍯':kind==='item'?(ITEMS[data.id]||{ic:'❔'}).ic:TOK_INFO[data.id][1];
  const ring=kind==='ab'?(data.col==='r'?'#e0453a':data.col==='b'?'#3a7ae0':'#e8e8e8'):'#ffc93c';
  const m=new THREE.Mesh(tokGeo,new THREE.MeshBasicMaterial({map:tokTex(ic,ring),side:THREE.DoubleSide,transparent:true}));m.position.set(x,y+.9,z);scene.add(m);
  const t={kind,x,y,z,data,ttl:(ttl||(kind==='ab'?8:15))*(1+P.life/100),t:0,m,field:fieldAt(x,z,y)};TOKENS.push(t);return t}
function updTokens(dt){for(let i=TOKENS.length-1;i>=0;i--){const t=TOKENS[i];t.t+=dt;t.m.rotation.y+=dt*2.5;t.m.position.y=t.y+.9+Math.sin(t.t*3)*.12;
  if(t.ttl-t.t<2)t.m.visible=Math.sin(t.t*20)>0;
  if(t.t>=t.ttl){scene.remove(t.m);TOKENS.splice(i,1);continue}
  if(!PL.dead&&Math.hypot(t.x-PL.x,t.z-PL.z)<1.5&&Math.abs(t.y-PL.y)<3){collectToken(t);TOKENS.splice(i,1)}}}
function collectToken(t){scene.remove(t.m);SFX.token();const d=t.data;
  if(t.kind==='honey'){const v=d.v*(1+P.hft/100)*P.hftMul;addHoney(v);fx.dmgNum(t.x,t.y+1.6,t.z,'+'+fmt(v),'#ffd84a');ST.st.tok.honeytok=(ST.st.tok.honeytok||0)+1;return}
  if(t.kind==='item'){give(d.id,d.n);if(d.id==='treat')ST.st.tok.treattok=(ST.st.tok.treattok||0)+1;return}
  ST.st.tok[d.id]=(ST.st.tok[d.id]||0)+1;ST.st.tok.any=(ST.st.tok.any||0)+1;if(/bomb/.test(d.id))ST.st.tok.bomb=(ST.st.tok.bomb||0)+1;
  ability(d.id,d,t.x,t.z,t.y,t.field);
  // デジタルビーの汚染：トークンがふえることがある
  if((buffStack('corrupt')||P.dup)&&Math.random()<(buffStack('corrupt')?.08:0)+P.dup/100&&!d.dup){const c=Object.assign({},d,{dup:1});ability(d.id,c,t.x,t.z,t.y,t.field)}}
// トークンの効果（ハチの能力）。d={id,lv,col,g,bee}
function ability(id,d,x,z,y,fid){const lv=d.lv||1,D=fid&&FL[fid];const say=s=>fx.dmgNum(x,y+2,z,s,'#fff7a0');
  switch(id){
  case 'redboost':addBuff('boost_r');break;case 'blueboost':addBuff('boost_b');break;case 'whiteboost':addBuff('boost_w');break;
  case 'haste':addBuff('haste');break;case 'focus':addBuff('focus');break;case 'melody':addBuff('melody');break;case 'rage':addBuff('rage');break;
  case 'babylove':addBuff('babylove');break;case 'bearmorph':addBuff('bearmorph');big('🐻 ベアモーフ！',1.2);break;case 'bluesync':addBuff('bluesync');break;case 'redsync':addBuff('redsync');break;
  case 'buzzbomb':case 'buzzbomb2':case 'redbomb':case 'redbomb2':case 'bluebomb':case 'bluebomb2':{if(!D)break;const plus=id.endsWith('2'),ty=id.startsWith('buzz')?'w':id.startsWith('red')?'r':'b';
    const per=(ty==='w'?7:10)*(1+.1*(lv-1)),bm=(1+P.bomb/100)*P.bombMul*(ty==='w'?P.buzzMul:ty==='r'?(1+P.redBomb/100)*P.redBombMul:(1+P.blueBomb/100)*P.blueBombMul)*P.bombPow*Math.pow(1.25,buffStack('bombcombo'));
    const sync=ty==='r'?buffStack('redsync'):ty==='b'?buffStack('bluesync'):0;let tot=0;
    for(const [dx,dz] of circOffsets(plus?29:13)){const k=flowerAt(D,x+dx,z+dz);if(k<0)continue;const c=D.c[k];if(ty==='r'&&c!==1&&!(sync&&c===0))continue;if(ty==='b'&&c!==2&&!(sync&&c===0))continue;tot+=collectFlower(D,k,per,null,'bomb',null,bm)}
    addBuff('bombcombo');fx.ring(x,D.y,z,plus?3.2:2.2,ty==='r'?0xff6a5a:ty==='b'?0x6aa0ff:0xffffff);SFX.bomb();if(tot>0)say('+'+fmt(tot));break}
  case 'pollenmark':case 'pollenmark2':case 'honeymark':case 'honeymark2':{if(!D)break;const hm=id.startsWith('honey');addMark(fid,x+rr(-4,4),z+rr(-4,4),hm?'honey':'pollen',(12+.5*lv)*(1+P.markDur/100)*(id.endsWith('2')?1.3:1),id.endsWith('2')?5.5:4.5);break}
  case 'tokenlink':{let n=0;for(let i=TOKENS.length-1;i>=0;i--){const t=TOKENS[i];if(t.field!==fid||(t.kind==='ab'&&t.data.id==='tokenlink'))continue;TOKENS.splice(i,1);collectToken(t);n++}
    if(n){addHoney(n*(25+10*lv));say('🔗×'+n)}break}
  case 'honeygift':case 'honeygift2':{const v=(id==='honeygift2'?250:100)*lv*lv*(1+P.hft/100)*P.hftMul;addHoney(v);say('+'+fmt(v)+' 🍯');break}
  case 'balloon':if(D)addBalloon(fid,x,z,20+2*lv);break;
  case 'party':for(let i=0;i<10;i++){const a=rr(0,TAU),r=rr(1,5);spawnToken('ab',PL.x+Math.cos(a)*r,PL.z+Math.sin(a)*r,PL.y,{id:pick(['blueboost','whiteboost','bluebomb','buzzbomb','pollenmark','honeymark','haste','melody']),lv,col:'b'})}big('🎉 サプライズパーティー！',1.4);break;
  case 'fuzzbomb':if(D)for(let i=0;i<2+Math.floor(lv/5);i++)addFuzz(fid,x+rr(-2,2),z+rr(-2,2),lv);break;
  case 'haze':if(D)addHaze(fid);break;
  case 'target':if(D)addTargets(fid,x,z,lv,d.g);break;
  case 'inferno':if(D){for(let i=0;i<6;i++){const a=i/6*TAU;spawnFlame(fid,x+Math.cos(a)*2.5,z+Math.sin(a)*2.5)}for(let i=0;i<2;i++)tempBee('fire',Math.max(1,lv-2),d.g&&Math.random()<.1+.01*lv,15+lv,x,z);say('🔥 インフェルノ')}break;
  case 'flamefuel':for(const f of FLAMES)f.ttl+=1.5;instantConvert(50000+ST.pollen*.1,'flame');break;
  case 'frog':if(D)addFrog(fid,x,z,20+2*lv,d.g);break;
  case 'triangulate':if(D)addTriangle(fid,[x,z],[d.bee?d.bee.x:x+3,d.bee?d.bee.z:z],[PL.x,PL.z],lv);break;
  case 'marksurge':for(const m of MARKS){const MD=FL[m.fid];for(const [dx,dz] of circOffsets(49)){const k=flowerAt(MD,m.x+dx,m.z+dz);if(k>=0&&Math.hypot(dx,dz)<=m.r)collectFlower(MD,k,7*(1+.1*lv),null,'ability')}m.ttl+=1+.1*lv}break;
  case 'bluepulse':case 'redpulse':{const c=id==='bluepulse'?'b':'r';let hop=0;for(const b of BEELIST){if(BEES[b.t].col!==c||!G.field)continue;const PD=FL[G.field];hop++;
      for(const [dx,dz] of circOffsets(9)){const k=flowerAt(PD,b.x+dx,b.z+dz);if(k>=0)collectFlower(PD,k,4*(1+.1*(lv-1))*(1+hop*.1),null,'ability')}fx.burst(b.x,b.y,b.z,c==='b'?[.4,.6,1]:[1,.4,.4],6)}break}
  case 'glitch':addBuff('corrupt',1,20+lv);break;case 'corrupt':addBuff('corrupt',1,180+15*lv);note('👾 フィールドが汚染された');break;
  case 'mindhack':for(const m of MOBLIST)if(!m.dead&&Math.hypot(m.x-x,m.z-z)<10){m.stun=3+.1*lv;m.hacked=G.t+3+.1*lv}say('🧠');break;
  case 'festivegift':for(let i=0;i<6;i++){const a=i/6*TAU;const r=Math.random();if(r<.4)spawnToken('honey',PL.x+Math.cos(a)*3,PL.z+Math.sin(a)*3,PL.y,{v:500*lv});else spawnToken('item',PL.x+Math.cos(a)*3,PL.z+Math.sin(a)*3,PL.y,{id:pick(['treat','treat','ticket','strawberry','blueberry','pineapple','sunflowerseed','royaljelly','gumdrops']),n:1})}big('🎁 フェスティブギフト！',1.2);break;
  case 'glob':if(D){for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){const k=flowerAt(D,x+dx,z+dz);if(k>=0)D.goo[k]=10}fx.ring(x,D.y,z,3,0x5ad8c0)}break;
  case 'barrage':if(D){for(let i=0;i<120;i++){const k=Math.floor(Math.random()*D.n);D.goo[k]=10}fx.ring(PL.x,D.y,PL.z,6,0x5ad8c0)}break;
  case 'beamstorm':if(D){let n=25+2*lv;for(let i=0;i<n;i++)setTimeoutG(i*.05,()=>{const k=flowerAt(D,x+rr(-7,7),z+rr(-7,7));if(k<0)return;const v=collectFlower(D,k,'all',null,'ability',null,2*(d.g&&D.c[k]===0?3:1));if(d.g)instantConvert(v,'ability');fx.pillarSmall(D.x[k],D.y,D.z[k])})}break;
  case 'puppylove':{addBuff('puppylove',1,10+lv);const avg=hiveBees().reduce((s,b)=>s+b.lv,0)/Math.max(1,beeCount());const near=BEELIST.filter(b=>!b.temp).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z)).slice(0,10);for(const b of near)addBond(b,30+10*avg);say('🐶 きずな+'+Math.round(30+10*avg));break}
  case 'fetch':if(D)addBall(fid,PL.x,PL.z);break;
  case 'scratch':if(D){const ang=rr(0,TAU),fx2=Math.cos(ang),fz2=Math.sin(ang);for(let l=-1;l<=1;l++)for(let k=0;k<4;k++){const kk=flowerAt(D,x+fx2*(k-1.5)-fz2*l*1.2,z+fz2*(k-1.5)+fx2*l*1.2);if(kk>=0)collectFlower(D,kk,(7+lv)*(1+(ST.tabby||0)/100),null,'ability')}fx.ring(x,D.y,z,2,0xffa040)}break;
  case 'tabbylove':ST.tabby=Math.min(1000,(ST.tabby||0)+1);if(ST.tabby>=1000)addBuff('tabby',1,20+2*lv);say('💗 タビーラブ '+ST.tabby);break;
  case 'impale':{let n=0;for(const m of MOBLIST)if(!m.dead&&Math.hypot(m.x-x,m.z-z)<12){for(let k=0;k<Math.min(lv,8);k++)hurtMob(m,Math.min(1000,m.hp*.05+5),null);n++;spawnToken('honey',m.x,m.z,m.y,{v:50+50*lv})}if(n)say('🗡️');break}
  case 'raincloud':if(D)addCloud(fid,x,z,15+lv,d.g);break;
  case 'tornado':{if(!D)break;const h=buffStack('haste');delete ST.buffs.haste;calcStats();addTornado(fid,x,z,6+h*1.5,lv);break}}}
// フォトンビームの細い柱
fx.pillarSmall=(x,y,z)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,16,8,1,true),new THREE.MeshBasicMaterial({color:0xfff2a0,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));m.position.set(x,y+8,z);scene.add(m);PART.push({m,vx:0,vy:0,vz:0,t:0,T:.35,fade:1})};
// ゲーム内の時間で動くタイマー
const TIMERS=[];function setTimeoutG(d,fn){TIMERS.push({t:G.t+d,fn})}
function updTimers(){for(let i=TIMERS.length-1;i>=0;i--)if(G.t>=TIMERS[i].t){const f=TIMERS[i].fn;TIMERS.splice(i,1);try{f()}catch(e){console.error(e)}}}
// ハチがトークンを出す（ギフテッド専用は @g）
function tryTokens(b,d,mode){const B=BEES[b.t];if(!B.tok.length||!G.field)return;const rate=1+P.ability/100;
  for(const tk0 of B.tok){const g=tk0.endsWith('@g'),tk=g?tk0.slice(0,-2):tk0;if(g&&!d.g)continue;const R=TOK_RATE[tk];if(!R)continue;
    const battleOnly=R[2]==='battle';if(mode==='gather'&&battleOnly)continue;if(mode==='battle'&&!battleOnly&&!['rage','focus','haste','redboost','blueboost','whiteboost','melody','tokenlink','babylove'].includes(tk))continue;
    if((b.tok[tk]||0)>G.t)continue;if(Math.random()<R[1]*rate){b.tok[tk]=G.t+R[0]/rate;const D=FL[G.field],x=b.x+rr(-1.5,1.5),z=b.z+rr(-1.5,1.5);
      spawnToken('ab',x,z,D.y,{id:tk,lv:d.lv,col:B.col,g:d.g,bee:b});b.m.rotation.y+=Math.PI}else b.tok[tk]=G.t+R[0]*.25/rate}}
// フィールドで拾えるアイテム（花から出る）
function fieldDrop(D,x,z){const f=D.f,r=Math.random();
  if(r<.42)spawnToken('honey',x,z,D.y,{v:Math.round(rr(5,40)*(1+D.f.zone/5))});
  else if(r<.58)spawnToken('item',x,z,D.y,{id:'treat',n:1});
  else if(r<.76){const k=flowerAt(D,x,z),c=k>=0?D.c[k]:0;spawnToken('ab',x,z,D.y,{id:c===1?'redboost':c===2?'blueboost':pick(['redboost','blueboost']),lv:1,col:c===1?'r':'b'})}
  else if(r<.97&&f.drop.length){const [id]=pick(f.drop);spawnToken('item',x,z,D.y,{id,n:1})}
  else spawnToken('item',x,z,D.y,{id:'ticket',n:1})}
// ---- 泡（シャボン玉）：さわるとまわりの花粉 ----
const BUBBLES=[];const bubGeo=new THREE.SphereGeometry(.7,14,10),bubMat=new THREE.MeshLambertMaterial({color:0x9ad8ff,transparent:true,opacity:.45,emissive:0x204060});
function spawnBubble(fid,x,z){const D=FL[fid];if(!D||flowerAt(D,x,z)<0)return;const m=new THREE.Mesh(bubGeo,bubMat);m.position.set(x,D.y+.8,z);scene.add(m);BUBBLES.push({fid,x,z,m,ttl:10*(1+P.bubbleDur/100),t:0})}
function updBubbles(dt){for(let i=BUBBLES.length-1;i>=0;i--){const b=BUBBLES[i];b.t+=dt;b.m.scale.setScalar(Math.min(1,b.t*3));if(b.t>b.ttl||(G.field===b.fid&&Math.hypot(PL.x-b.x,PL.z-b.z)<1.3)){
    if(b.t<=b.ttl){const D=FL[b.fid];for(const [dx,dz] of circOffsets(29)){const k=flowerAt(D,b.x+dx,b.z+dz);if(k>=0)collectFlower(D,k,D.c[k]===2?8:D.c[k]===0?6:4,null,'ability',null,P.bubbleMul)}fx.burst(b.x,D.y+.8,b.z,[.6,.85,1],8)}
    scene.remove(b.m);BUBBLES.splice(i,1)}}}
// ---- 炎：毎秒まわりの花粉を集める（赤が多い） ----
const FLAMES=[];const flGeo=new THREE.ConeGeometry(.45,1.3,8),flMat=new THREE.MeshBasicMaterial({color:0xff7a2a,transparent:true,opacity:.85});
function spawnFlame(fid,x,z){const D=FL[fid];if(!D||flowerAt(D,x,z)<0)return;const m=new THREE.Mesh(flGeo,flMat);m.position.set(x,D.y+.65,z);scene.add(m);FLAMES.push({fid,x,z,m,ttl:3*(1+P.flameDur/100),t:0,tick:1})}
function updFlames(dt){for(let i=FLAMES.length-1;i>=0;i--){const f=FLAMES[i];f.t+=dt;f.tick-=dt;f.m.scale.set(1,.8+Math.sin(f.t*20)*.2,1);
    if(f.tick<=0){f.tick=1;const D=FL[f.fid];for(const [dx,dz] of circOffsets(9)){const k=flowerAt(D,f.x+dx,f.z+dz);if(k>=0)collectFlower(D,k,D.c[k]===1?4:D.c[k]===0?2:1,null,'flame',null,P.flameMul)}
      for(const m of MOBLIST)if(!m.dead&&Math.hypot(m.x-f.x,m.z-f.z)<1.5)hurtMob(m,5,null)}
    if(G.field===f.fid&&Math.hypot(PL.x-f.x,PL.z-f.z)<2.5&&Math.random()<dt*2)addBuff('flameheat');
    if(f.t>f.ttl){scene.remove(f.m);FLAMES.splice(i,1)}}}
// ---- マーク（花粉マーク・ハニーマーク） ----
const MARKS=[];
function addMark(fid,x,z,kind,ttl,r){const D=FL[fid];const m=new THREE.Mesh(new THREE.RingGeometry(r-.3,r,36),new THREE.MeshBasicMaterial({color:kind==='honey'?0xffc93c:0x7aff7a,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(x,D.y+.12,z);scene.add(m);MARKS.push({fid,x,z,kind,ttl,r,m,t:0,tick:1})}
function updMarks(dt){G.markP=0;for(let i=MARKS.length-1;i>=0;i--){const k=MARKS[i];k.t+=dt;const inside=G.field===k.fid&&Math.hypot(PL.x-k.x,PL.z-k.z)<k.r;k.m.material.opacity=inside?.95:.5;
  if(inside){if(k.kind==='pollen')G.markP++;else{k.tick-=dt;if(k.tick<=0){k.tick=1;let conv=0;const links=hiveBees().length?2:0;for(let n=0;n<links;n++){const b=pick(hiveBees());conv+=beeConvD(b)*1.25}if(conv)convertPollen(conv)}}}
  if(k.t>k.ttl){scene.remove(k.m);MARKS.splice(i,1)}}G.markP=Math.min(3,G.markP)}
// ---- ふうせん・ファズボム・ターゲット・カエル・トライアングル・雲・竜巻・ボール ----
const OBJS=[];
function addObj(o){OBJS.push(o);return o}
function addBalloon(fid,x,z,ttl){const D=FL[fid];const m=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),M(0x5aa0ff,{transparent:true,opacity:.85}));m.position.set(x,D.y+5,z);scene.add(m);addObj({k:'balloon',fid,x,z,ttl,m,t:0})}
function addFuzz(fid,x,z,lv){const D=FL[fid];const m=new THREE.Mesh(new THREE.SphereGeometry(.6,10,8),M(0xf4f4f4));m.position.set(x,D.y+.6,z);scene.add(m);addObj({k:'fuzz',fid,x,z,ttl:8,m,t:0,lv,a:rr(0,TAU)})}
function addHaze(fid){addObj({k:'haze',fid,ttl:30,t:0,tick:1})}
function addTargets(fid,x,z,lv,g){const D=FL[fid];const a=rr(0,TAU);for(let i=0;i<3;i++){const px=x+Math.cos(a)*i*4,pz=z+Math.sin(a)*i*4;if(flowerAt(D,px,pz)<0)continue;
  const m=new THREE.Mesh(new THREE.RingGeometry(.5,1.4,24),new THREE.MeshBasicMaterial({color:g&&i===2?0xa04aff:0xff4a4a,side:THREE.DoubleSide,transparent:true,opacity:.85}));m.rotation.x=-Math.PI/2;m.position.set(px,D.y+.15,pz);scene.add(m);
  addObj({k:'target',fid,x:px,z:pz,ttl:8,m,t:0,lv,hit:false})}}
function addFrog(fid,x,z,ttl,g){const D=FL[fid];const m=new THREE.Mesh(new THREE.SphereGeometry(.6,10,8),M(g?0xffd84a:0x4ac83a));m.scale.y=.7;m.position.set(x,D.y+.4,z);scene.add(m);addObj({k:'frog',fid,x,z,ttl,m,t:0,hop:0})}
function addTriangle(fid,a,b,c,lv){const D=FL[fid];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([a[0],D.y+.2,a[1],b[0],D.y+.2,b[1],c[0],D.y+.2,c[1]],3));
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xc080ff,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));scene.add(m);addObj({k:'tri',fid,pts:[a,b,c],ttl:3,m,t:0,lv})}
function addCloud(fid,x,z,ttl,g){const D=FL[fid];const m=new THREE.Group();for(let i=0;i<4;i++)mesh(new THREE.SphereGeometry(rr(1.2,2),8,6),M(0xe8eef8),rr(-1.5,1.5),0,rr(-1,1),m,false);m.position.set(x,D.y+7,z);scene.add(m);addObj({k:'cloud',fid,x,z,ttl,m,t:0,tick:1,g})}
function addTornado(fid,x,z,ttl,lv){const D=FL[fid];const m=new THREE.Mesh(new THREE.ConeGeometry(2,7,12,1,true),new THREE.MeshBasicMaterial({color:0xd8e8f0,transparent:true,opacity:.55,side:THREE.DoubleSide}));m.rotation.x=Math.PI;m.position.set(x,D.y+3.5,z);scene.add(m);addObj({k:'tornado',fid,x,z,ttl,m,t:0,tick:1,lv,a:rr(0,TAU)})}
function addBall(fid,x,z){const D=FL[fid];const m=new THREE.Mesh(new THREE.SphereGeometry(.45,12,10),M(0xd8f04a));m.position.set(x,D.y+.45,z);scene.add(m);addObj({k:'ball',fid,x:x+2,z,vx:0,vz:0,ttl:5,m,t:0,combo:0})}
function inTri(px,pz,[a,b,c]){const s=(p,q,r)=>(p[0]-r[0])*(q[1]-r[1])-(q[0]-r[0])*(p[1]-r[1]),P0=[px,pz];const d1=s(P0,a,b),d2=s(P0,b,c),d3=s(P0,c,a);return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))}
function updObjs(dt){let bal=0;for(let i=OBJS.length-1;i>=0;i--){const o=OBJS[i],D=FL[o.fid];o.t+=dt;let done=o.t>o.ttl;
  if(o.k==='balloon'){o.m.position.y=D.y+5+Math.sin(o.t)*.3;if(G.field===o.fid&&Math.hypot(PL.x-o.x,PL.z-o.z)<6)bal++}
  if(o.k==='fuzz'){o.a+=rr(-3,3)*dt;const nx=o.x+Math.cos(o.a)*2*dt,nz=o.z+Math.sin(o.a)*2*dt;if(flowerAt(D,nx,nz)>=0){o.x=nx;o.z=nz}else o.a+=Math.PI;o.m.position.set(o.x,D.y+.6,o.z);
    if(G.field===o.fid&&Math.hypot(PL.x-o.x,PL.z-o.z)<1.2){for(const [dx,dz] of circOffsets(29)){const k=flowerAt(D,o.x+dx,o.z+dz);if(k<0)continue;collectFlower(D,k,7*(1+.1*o.lv),null,'bomb',null,P.bombPow);if(Math.random()<.15&&D.s[k]<5){D.s[k]++;flowerMat(D,k)}}addBuff('bombcombo');fx.ring(o.x,D.y,o.z,3,0xffffff);done=true}}
  if(o.k==='haze'){o.tick-=dt;if(o.tick<=0){o.tick=1;for(let n=0;n<30;n++){const k=Math.floor(Math.random()*D.n);if(D.s[k]<5){D.s[k]++;flowerMat(D,k)}}}}
  if(o.k==='target'){if(!o.hit&&G.field===o.fid&&Math.hypot(PL.x-o.x,PL.z-o.z)<1.4){o.hit=true;o.m.material.color.setHex(0xffffff);o.ttl=o.t+2.5}
    if(done&&o.hit){for(const [dx,dz] of circOffsets(29)){const k=flowerAt(D,o.x+dx,o.z+dz);if(k>=0)collectFlower(D,k,10*(1+.1*o.lv),null,'ability',null,2)}spawnToken('ab',o.x,o.z,D.y,{id:'focus',lv:o.lv,col:'r'});fx.pillarSmall(o.x,D.y,o.z)}}
  if(o.k==='frog'){o.hop-=dt;if(o.hop<=0){o.hop=1.2;const nx=o.x+rr(-2.5,2.5),nz=o.z+rr(-2.5,2.5);if(flowerAt(D,nx,nz)>=0){o.x=nx;o.z=nz}spawnBubble(o.fid,o.x,o.z)}o.m.position.set(o.x,D.y+.4+Math.max(0,Math.sin(o.hop/1.2*Math.PI))*.8,o.z)}
  if(o.k==='tri'&&done){for(let k=0;k<D.n;k++)if(inTri(D.x[k],D.z[k],o.pts))collectFlower(D,k,10+2*o.lv,null,'ability');for(let j=TOKENS.length-1;j>=0;j--){const t=TOKENS[j];if(t.field===o.fid&&inTri(t.x,t.z,o.pts)){TOKENS.splice(j,1);collectToken(t)}}}
  if(o.k==='cloud'){o.x+=Math.sin(o.t*.5)*dt;o.m.position.set(o.x,D.y+7,o.z);o.tick-=dt;if(o.tick<=0){o.tick=1;for(let n=0;n<10;n++){const k=flowerAt(D,o.x+rr(-4,4),o.z+rr(-4,4));if(k>=0)collectFlower(D,k,5,null,'ability')}
      if(Math.random()<(o.g?.3:.15))spawnToken('ab',o.x+rr(-3,3),o.z+rr(-3,3),D.y,{id:'whiteboost',lv:1,col:'w'})}}
  if(o.k==='tornado'){o.a+=rr(-2,2)*dt;const nx=o.x+Math.cos(o.a)*4*dt,nz=o.z+Math.sin(o.a)*4*dt;if(flowerAt(D,nx,nz)>=0){o.x=nx;o.z=nz}else o.a+=Math.PI;o.m.position.set(o.x,D.y+3.5,o.z);o.m.rotation.y+=dt*8;
    o.tick-=dt;if(o.tick<=0){o.tick=1;for(const [dx,dz] of circOffsets(49)){const k=flowerAt(D,o.x+dx,o.z+dz);if(k>=0)collectFlower(D,k,3*(1+.1*o.lv),null,'ability')}for(const m of MOBLIST)if(!m.dead&&Math.hypot(m.x-o.x,m.z-o.z)<4)hurtMob(m,10+o.lv,null)}
    for(let j=TOKENS.length-1;j>=0;j--){const t=TOKENS[j];if(t.field===o.fid&&Math.hypot(t.x-o.x,t.z-o.z)<3){TOKENS.splice(j,1);collectToken(t)}}}
  if(o.k==='ball'){if(G.field===o.fid&&Math.hypot(PL.x-o.x,PL.z-o.z)<1.2&&o.t-(o.kick||-9)>.6){const a=Math.atan2(o.x-PL.x,o.z-PL.z);o.vx=Math.sin(a)*9;o.vz=Math.cos(a)*9;o.kick=o.t;o.combo++;o.ttl=o.t+5;SFX.hit()}
    const nx=o.x+o.vx*dt,nz=o.z+o.vz*dt;if(flowerAt(D,nx,nz)>=0){o.x=nx;o.z=nz}else{o.vx*=-1;o.vz*=-1}o.vx*=Math.exp(-dt*1.2);o.vz*=Math.exp(-dt*1.2);o.m.position.set(o.x,D.y+.45,o.z);
    if(Math.hypot(o.vx,o.vz)>.5){const k=flowerAt(D,o.x,o.z);if(k>=0)collectFlower(D,k,6,null,'ability')}
    if(done&&o.combo){const n=Math.min(256,Math.pow(2,Math.min(8,o.combo-1)));give('treat',n)}}
  if(done){if(o.m)scene.remove(o.m);OBJS.splice(i,1)}}
  if(bal){ST.buffs.balloon={n:Math.min(10,bal*2),until:G.t+1,dur:1}}}
