// ================= いろいろなルール =================
const MODES={
 gem:{name:'エメラルドハント',ic:'💎',map:'gem',resp:5,time:150,per:2,d:'3対3。中央から出るジェムを10個集めて、15秒守りきったチームの勝ち'},
 ball:{name:'ブロストライカー',ic:'⚽',map:'ball',resp:5,time:150,per:3,d:'3対3のサッカー。ボールを運ぶか蹴って、相手のゴールに2点入れたら勝ち'},
 heist:{name:'強奪',ic:'💰',map:'heist',resp:5,time:150,per:4,d:'相手の金庫をこわしたら勝ち。自分の金庫は守ろう'},
 hotzone:{name:'ホットゾーン',ic:'🔥',map:'gem',resp:5,time:150,per:3,d:'中央のゾーンに自分のチームだけが入っていると%が増える。100%で勝ち'},
 bounty:{name:'賞金稼ぎ',ic:'⭐',map:'gem',resp:3.5,time:120,per:5,d:'倒すと星がもらえる。連続で倒している相手ほど星が多い'},
 knockout:{name:'ノックアウト',ic:'🥊',map:'gem',resp:0,time:0,per:6,d:'復活なし。相手チームを全員倒したらラウンド勝利、2本先取'},
 br:{name:'バトルロイヤル',ic:'☠',map:'br',resp:0,time:0,per:2,d:'10人のサバイバル。箱をこわしてパワーキューブを集め、最後の1人をめざす'},
 ranked:{name:'ガチバトル',ic:'🏅',map:'gem',resp:5,time:150,d:'モードとマップは毎回ランダム。勝ってランクを上げ、ブロンズからプロをめざそう'}};
const RANKED_MODES=['gem','ball','heist','hotzone','bounty','knockout'];
// 本家のように、モードごとのマップは時間で入れかわる（per 時間ごと）
function mapsOf(mode){return Object.keys(MAPS).filter(k=>MAPS[k].mode===MODES[mode].map)}
function curMap(mode){const ids=mapsOf(mode),per=(MODES[mode].per||2)*36e5,now=Date.now(),off=(mode.length*7919)%per,slot=Math.floor((now+off)/per);return{id:ids[slot%ids.length],left:per-((now+off)%per)}}
const leftTxt=ms=>{const m=Math.max(0,Math.floor(ms/6e4)),h=Math.floor(m/60);return h>=24?Math.floor(h/24)+'日'+(h%24)+'時間':h?h+'時間'+(m%60)+'分':m+'分'+Math.floor(ms/1000%60)+'秒'};
const respawnTime=()=>G.mode==='br'?1e9:(MODES[G.rule]||MODES.gem).resp||1e9;
// ---- ボール ----
const ballTex=ctex(128,64,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#222';for(let i=0;i<6;i++){const x=(i%3)*44+10+(i>2?22:0),y=i>2?44:14;g.beginPath();for(let k=0;k<5;k++){const a=k/5*TAU;g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9)}g.fill()}});
function modeInit(){const M2={};G.M=M2;const R=G.rule;
  if(R==='ball'){const m=new THREE.Mesh(new THREE.SphereGeometry(.42,18,14),new THREE.MeshLambertMaterial({map:ballTex}));m.castShadow=true;ARENA.add(m);M2.ball={x:0,z:0,vx:0,vz:0,h:0,vh:0,carrier:null,last:null,lastT:-9,m};M2.score=[0,0];M2.pause=0;
    const post=MC(0xf4f4f4),net=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,side:THREE.DoubleSide,wireframe:true});
    for(const zs of[-1,1]){const cols=[];for(let c=0;c<MW;c++)if(cell(c,zs<0?0:MH-1)==='O')cols.push(c);const x0=tx(cols[0])-TS/2,x1=tx(cols[cols.length-1])+TS/2,z=zs*(HALFZ-.15);
      for(const x of[x0,x1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,2.2,10),post);p.position.set(x,1.1,z);p.castShadow=true;ARENA.add(p)}
      const bar=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,x1-x0,10),post);bar.rotation.z=Math.PI/2;bar.position.set((x0+x1)/2,2.2,z);ARENA.add(bar);
      const n=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,2.2,8,4),net);n.position.set((x0+x1)/2,1.1,z+zs*.6);ARENA.add(n)}}
  if(R==='heist'){G.safes=[];for(const s of SAFES){const g=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.6,1.8),MC(s.team?0xb3363f:0x2f6fc4));b.position.y=.8;b.castShadow=true;g.add(b);
      const d=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.1,20),MC(0xffd84d));d.rotation.x=Math.PI/2;d.position.set(0,.85,s.team?.92:-.92);g.add(d);g.position.set(tx(s.c),0,tz(s.r));ARENA.add(g);
      const sf={isSafe:true,bt:'safe',name:s.team?'赤の金庫':'青の金庫',team:s.team,x:tx(s.c),z:tz(s.r),rad:1.2,hp:36000,maxHp:36000,dead:false,gems:0,pw:0,isMe:false,m:{g},revealT:9,inBush:false,inv:0,lv:1,dm:1,sup:0,dmg:0,flash:0};mkLabel(sf);G.safes.push(sf)}}
  if(R==='hotzone'){M2.pct=[0,0];M2.zr=3.8;const z=new THREE.Mesh(new THREE.RingGeometry(M2.zr-.25,M2.zr,48),new THREE.MeshBasicMaterial({color:0xffa53d,transparent:true,opacity:.8,depthWrite:false}));z.rotation.x=-Math.PI/2;z.position.y=.08;ARENA.add(z);
    const f=new THREE.Mesh(new THREE.CircleGeometry(M2.zr,48),new THREE.MeshBasicMaterial({color:0xffa53d,transparent:true,opacity:.14,depthWrite:false}));f.rotation.x=-Math.PI/2;f.position.y=.07;ARENA.add(f);M2.fill=f}
  if(R==='bounty'){M2.stars=[0,0];for(const u of G.units)u.bounty=2}
  if(R==='knockout'){M2.rounds=[0,0];M2.round=1;M2.t0=0;M2.between=0}
  POISON.visible=G.mode==='br'||R==='knockout';POISON.material.uniforms.R.value=999}
function kick(u,ang,power){const b=G.M.ball;b.carrier=null;b.last=u;b.lastT=G.t;b.vx=Math.sin(ang)*power;b.vz=Math.cos(ang)*power;b.vh=4;u.lastAtk=G.t;u.revealT=1;u.face=u.faceT=ang;u.atkAnim=1;SFX.punch()}
function ballReset(){const b=G.M.ball;Object.assign(b,{x:0,z:0,vx:0,vz:0,h:2,vh:0,carrier:null});for(const u of G.units){if(u.dead)u.dead=false;spawnAt(u);u.ai.path=[];u.ai.think=0}G.bullets.forEach(q=>scene.remove(q.m));G.bullets.length=0;clearSummons()}
function ballStep(dt){const b=G.M.ball,M2=G.M;if(M2.pause>0){M2.pause-=dt;if(M2.pause<=0){if(M2.score[0]>=2||M2.score[1]>=2)endMatch(M2.score[0]>=2?0:1);else ballReset()}b.m.position.set(b.x,.42+b.h,b.z);return}
  if(b.carrier){const u=b.carrier;if(u.dead){b.carrier=null}else{const f=u.faceT!=null?u.faceT:u.face;b.x=u.x+Math.sin(f)*.75;b.z=u.z+Math.cos(f)*.75;b.h=0;b.vx=b.vz=0}}
  if(!b.carrier){const nx=b.x+b.vx*dt,nz=b.z+b.vz*dt;if(blockMove(cx(nx),cz(b.z))&&cell(cx(nx),cz(b.z))!=='~'||Math.abs(nx)>HALFX-.4){b.vx*=-.6}else b.x=nx;
    if(blockMove(cx(b.x),cz(nz))&&cell(cx(b.x),cz(nz))!=='~'||Math.abs(nz)>HALFZ-.4){b.vz*=-.6}else b.z=nz;
    if(cell(cx(b.x),cz(b.z))==='~'){b.vx*=-1;b.vz*=-1;b.x+=b.vx*dt*2;b.z+=b.vz*dt*2}
    const k=Math.exp(-dt*1.4);b.vx*=k;b.vz*=k;b.vh-=22*dt;b.h+=b.vh*dt;if(b.h<0){b.h=0;b.vh=-b.vh*.35}
    for(const u of G.units){if(u.dead||u.act)continue;if(b.last===u&&G.t-b.lastT<.35)continue;if(b.h<1.2&&Math.hypot(u.x-b.x,u.z-b.z)<1.1){b.carrier=u;if(u.isMe)SFX.gem();break}}}
  b.m.position.set(b.x,.42+b.h,b.z);b.m.rotation.x+=b.vz*dt*1.5;b.m.rotation.z-=b.vx*dt*1.5;
  const c=cx(b.x),r=cz(b.z);if(cell(c,r)==='O'){const scorer=r===0?0:1;M2.score[scorer]++;M2.pause=2.2;b.carrier=null;big(scorer===0?'青チームのゴール！':'赤チームのゴール！',2,scorer===0?'#8cc8ff':'#ff9aa2');SFX.end(scorer===0);burst(b.x,1,b.z,40,[1,1,.6],8,.8,.8,true)}}
function clearSummons(){for(const p of G.pets.slice())killPet(p);for(const t of G.turrets.slice())if(!t.safe)killTurret(t)}
function roundReset(){G.M.round++;G.M.t0=G.t;G.M.between=0;for(const u of G.units){u.dead=false;spawnAt(u);u.m.g.visible=true;u.ai.path=[];u.ai.think=0}
  for(const q of G.bullets)scene.remove(q.m);G.bullets.length=0;for(const l of G.lobs){scene.remove(l.m);if(l.mk)scene.remove(l.mk)}G.lobs.length=0;for(const q of G.mines)scene.remove(q.m);G.mines.length=0;for(const h of G.heads.slice())killHead(h,false);for(const z of G.zones)scene.remove(z.m);G.zones.length=0;clearSummons();big('ラウンド '+G.M.round,1.3);POISON.material.uniforms.R.value=999}
function modeStep(dt){const R=G.rule,M2=G.M;
  if(R==='ball')ballStep(dt);
  if(R==='hotzone'){const inZ=[0,0];for(const u of G.units)if(!u.dead&&Math.hypot(u.x,u.z)<M2.zr)inZ[u.team]++;if(inZ[0]>0&&!inZ[1])M2.pct[0]+=dt*1.25;else if(inZ[1]>0&&!inZ[0])M2.pct[1]+=dt*1.25;
    M2.fill.material.color.setHex(inZ[0]&&!inZ[1]?0x3aa0ff:inZ[1]&&!inZ[0]?0xff4d5a:0xffa53d);for(const t of[0,1])if(M2.pct[t]>=100){M2.pct[t]=100;endMatch(t)}}
  if(R==='knockout'){if(M2.between>0){M2.between-=dt;if(M2.between<=0){if(M2.rounds[0]>=2||M2.rounds[1]>=2)endMatch(M2.rounds[0]>=2?0:1);else roundReset()}return}
    const alive=[0,1].map(t=>G.units.filter(u=>u.team===t&&!u.dead).length);
    if(!alive[0]||!alive[1]){const w=alive[0]?0:1;M2.rounds[w]++;M2.between=2.4;big(w===0?'ラウンド勝利！':'ラウンド負け…',2,w===0?'#8cc8ff':'#ff9aa2');return}
    const rt=G.t-M2.t0,k=clamp((rt-40)/35,0,1),R0=Math.hypot(HALFX,HALFZ)+2;G.safeR=rt>40?lerp(R0,4,k):999;POISON.material.uniforms.R.value=G.safeR;
    G.poisonT-=dt;if(G.poisonT<=0){G.poisonT=.5;for(const u of G.units)if(!u.dead&&Math.hypot(u.x,u.z)>G.safeR)hurt(u,500,null,true)}}
  if(MODES[R].time){G.time-=dt;if(G.time<=0){const v=modeScore();endMatch(v[0]>v[1]?0:v[1]>v[0]?1:-1)}}}
function modeScore(){const R=G.rule,M2=G.M;if(R==='ball')return M2.score;if(R==='heist')return G.safes.slice().sort((a,b)=>a.team-b.team).map(s=>1-s.hp/s.maxHp).reverse();
  if(R==='hotzone')return M2.pct;if(R==='bounty')return M2.stars;if(R==='knockout')return M2.rounds;return[teamGems(0),teamGems(1)]}
function modeHud(){const R=G.rule,M2=G.M,v=modeScore();
  if(R==='heist'){const s=G.safes.slice().sort((a,b)=>a.team-b.team);return['💰',Math.ceil(s[0].hp/s[0].maxHp*100)+'%','💰',Math.ceil(s[1].hp/s[1].maxHp*100)+'%']}
  const ic={ball:'⚽',hotzone:'🔥',bounty:'⭐',knockout:'🥊'}[R]||'💎';return[ic,R==='hotzone'?Math.floor(v[0])+'%':v[0],ic,R==='hotzone'?Math.floor(v[1])+'%':v[1]]}
function modeKill(t,killer){if(G.rule==='bounty'&&killer&&t.bounty){G.M.stars[killer.team]+=t.bounty;killer.bounty=Math.min(7,(killer.bounty||2)+1);t.bounty=2}
  if(G.rule==='ball'&&G.M.ball.carrier===t)G.M.ball.carrier=null}
function safeHit(s){if(s.hp<=0&&!G.over){s.hp=0;s.dead=true;burst(s.x,1.2,s.z,50,[1,.85,.3],8,1,1,true);endMatch(1-s.team)}}
// ---- ボットの目的（ルールごと）----
function aiModeGoal(u,tgt,td){const R=G.rule,M2=G.M;
  if(R==='ball'){const b=M2.ball,gz=u.team===0?-HALFZ+1.2:HALFZ-1.2;
    if(b.carrier===u){const d=Math.hypot(u.x,u.z-gz);if(d<11&&los(u.x,u.z,0,gz)){kick(u,Math.atan2(-u.x+rr(-1.5,1.5),gz-u.z),24)}return{gx:rr(-2,2),gz,mode:'carry'}}
    if(!b.carrier||b.carrier.team!==u.team){let best=null,bd=1e9;for(const o of G.units)if(o.team===u.team&&!o.dead){const d=Math.hypot(o.x-b.x,o.z-b.z);if(d<bd){bd=d;best=o}}
      if(best===u||b.carrier&&b.carrier.team!==u.team&&td>6)return{gx:b.x,gz:b.z,mode:'ball'}}
    if(b.carrier&&b.carrier.team===u.team&&!tgt)return{gx:b.x+rr(-4,4),gz:b.z+(u.team===0?-5:5),mode:'escort'};return null}
  if(R==='heist'){const es=G.safes.find(s=>s.team!==u.team),ms=G.safes.find(s=>s.team===u.team);
    if(tgt&&td<9)return null;const def=u.ai.strafe<1.2&&ms;if(def)return{gx:ms.x+rr(-3,3),gz:ms.z+(u.team?4:-4),mode:'guard'};
    const d=Math.hypot(es.x-u.x,es.z-u.z),want=Math.max(1.8,prefDist(u)*.8),k=want/Math.max(d,.1);return{gx:es.x+(u.x-es.x)*k,gz:es.z+(u.z-es.z)*k,mode:'siege',shoot:es}}
  if(R==='hotzone'){if(Math.hypot(u.x,u.z)>M2.zr-.8||!tgt)return{gx:Math.cos(u.ai.strafe)*2,gz:Math.sin(u.ai.strafe)*2,mode:'zone'};return null}
  if(R==='knockout'&&Math.hypot(u.x,u.z)>G.safeR-2.5){const k=Math.max(0,G.safeR-5)/Math.max(1,Math.hypot(u.x,u.z));return{gx:u.x*k,gz:u.z*k,mode:'safe'}}
  return null}

