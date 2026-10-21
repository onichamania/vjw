// ================= オンライン（同じ星でいっしょに遊ぶ）=================
// アーティファクトの room の presence だけで同期する（イベントは編集者しか送れないため）
// ・ロビー（room 本体）の presence {lu:{n,c,np,p}} … ホストだけ出す部屋の一覧
// ・部屋（room.join('lu-xxxxxx')）の presence：
//   id・名前（n）・キャラ（sk）・位置と向き（s）・高さ（r）・道具を振る（sw）・泳ぎ（wt）・やられ（dd）
//   出来事の窓 ev（"番号|種類:…"）… g:木や岩がなくなった / p:タイルにはらった / h:敵をたたいた / q:ポータルにはらった / x:だれかにダメージ / d:だれかに落とし物
//   ホストだけ H：開いたタイル（o）・はらい中（pd）・敵（en）・ポータル（ps）・資源の量（y）
// ・タイルを開ける・敵を動かすのはホスト。木や岩は、なくした人が知らせる。持ち物と道具はそれぞれのもの
const NET={on:false,host:false,room:null,game:null,code:'',st:'off',peers:[],lobby:[],seq:0,ev:[],seen:{},avs:new Map(),enemyDirty:false,id:Math.random().toString(36).slice(2,8),unsub:[],gunsub:[],ready:false,
  targets(){const out=[];if(!this.on)return out;for(const q of this.others()){const o=q.presence,s=o.s;if(!Array.isArray(s)||s.length<3||o.wt||o.dd||o.w&&o.w!==CUR)continue;out.push({u:new THREE.Vector3(s[0],s[1],s[2]).normalize(),ok:true,peer:o.id})}return out},
  others(){return this.peers.filter(p=>!p.sameTab&&p.kind==='viewer'&&p.presence&&typeof p.presence.id==='string'&&p.presence.id!==this.id)},
  push(s){this.seq++;this.ev.push(this.seq+'|'+s);let len=this.ev.reduce((a,e)=>a+e.length+3,0);while(len>1100&&this.ev.length){len-=this.ev[0].length+3;this.ev.shift()}},
  nodeGone(o){this.push('g:'+o.id)},pay(n,k,a){if(!this.host)this.push('p:'+n+':'+k+':'+a)},portalPay(k,a){if(!this.host)this.push('q:'+k+':'+a)},
  hitEnemy(e,d){this.push('h:'+e.id+':'+d)},hitPlayer(peer,d){this.push('x:'+peer+':'+d)},giveDrop(peer,k){this.push('d:'+peer+':'+k)},unlocked(n){}};
const netClean=s=>String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g,'').trim();
const myName=()=>netClean(LSget('lu-name',''))||'プレイヤー';
function netClaude(){try{if(window.claude&&window.claude.use)return window.claude}catch(e){}try{if(window.parent&&window.parent!==window&&window.parent.claude&&window.parent.claude.use)return window.parent.claude}catch(e){}return null}
async function netWhy(C){if(!C)return'nohost';try{const P=await C.use('permissions');if(P){NET.perm=P;return await P.state('room')}}catch(e){}return'unavailable'}
async function netInit(){if(NET.room)return true;if(NET.st==='wait')return false;NET.st='wait';uiNet();const C=netClaude();let room=null;if(C){try{room=await C.use('room')}catch(e){room=null}}
  if(!room){NET.st='none';NET.why=await netWhy(C);uiNet();return false}NET.room=room;NET.st='ok';NET.conn=room.connected?room.connected():true;
  if(room.onConnection)NET.unsub.push(room.onConnection(c=>{NET.conn=c;uiNet()},()=>{}));
  NET.unsub.push(room.onPeers(ch=>{NET.lobby=ch.peers;uiNet()},()=>{NET.st='err';uiNet()}));netLobby();uiNet();return true}
function netLobby(){if(!NET.room)return;const lu=NET.on&&NET.host?{n:myName(),c:NET.code,np:NET.others().length+1,p:Math.round(W.open.size/(NTILE+1)*100),w:CUR}:null;NET.npSent=lu?lu.np:-1;NET.room.presence({lu}).catch(()=>{})}
function netRooms(){const out=[];for(const p of NET.lobby){if(p.sameTab||p.kind!=='viewer')continue;const b=p.presence&&p.presence.lu;if(!b||typeof b!=='object'||typeof b.c!=='string'||!/^lu-[a-z0-9]{6}$/.test(b.c))continue;
  out.push({c:b.c,n:netClean(b.n).slice(0,14)||'???',np:clamp(b.np|0,1,8),p:clamp(b.p|0,0,100),w:WDEF[b.w]?b.w:'gaia',mine:p.isMe})}return out}
// ---- 部屋を作る・入る・出る ----
async function netHost(){if(NET.on)return;await netInit();if(!NET.room){toast('この画面ではオンラインに入れません');return}const code='lu-'+Array.from({length:6},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[Math.random()*36|0]).join('');
  let g=null;try{g=await NET.room.join(code)}catch(e){toast('部屋を作れませんでした');return}Object.assign(NET,{on:true,host:true,game:g,code,ready:true,joinT:performance.now()});netStart();toast('部屋を開きました。ほかの人は「オンライン」から入れます（8人まで）');uiNet()}
async function netJoin(r){if(NET.on)return;if(r.np>=8){toast('この部屋は満員です');return}saveGame();let g=null;try{g=await NET.room.join(r.c)}catch(e){toast('部屋に入れませんでした');return}
  Object.assign(NET,{on:true,host:false,game:g,code:r.c,ready:false,joinT:performance.now(),hostName:r.n});netStart();showLoading('ホスト（'+r.n+'）の星を受け取っています…');uiNet()}
function netStart(){NET.gunsub=[NET.game.onPeers(ch=>{NET.peers=ch.peers;netPeers()},()=>{toast('部屋との接続が切れました');netLeave()})];NET.seen={};NET.ev=[];NET.known=new Set();NET.send(true);netLobby()}
async function netLeave(){if(!NET.on)return;const g=NET.game,guest=!NET.host;NET.gunsub.forEach(u=>{try{u()}catch(e){}});NET.gunsub=[];NET.on=false;NET.host=false;NET.game=null;NET.ready=false;
  for(const [,a] of NET.avs)dropAv(a);NET.avs.clear();netLobby();if(g){try{await g.leave()}catch(e){}}
  for(const e of ENEMIES)e.remote=false;
  if(guest){// 自分の星にもどる（持ち物と道具はそのまま持って帰る）
    const mine=playerPart();const s=loadSave();applySave(s);Object.assign(PL,{inv:mine.inv,tools:mine.tools,owned:mine.owned});setSkin(mine.skin);saveGame();hideLoading();toast('自分の星にもどりました')}uiNet()}
// ---- 自分の presence（毎秒10回）----
const n3=v=>Math.round(v*1000)/1000;
NET.send=function(){if(!this.on||!this.game)return;const sw=PL.swingK?{axe:'a',pick:'p',weap:'w'}[PL.swingK]+Math.floor(PL.swing*8):'';
  const p={id:this.id,w:CUR,n:myName(),sk:PL.skin,s:[n3(PL.u.x),n3(PL.u.y),n3(PL.u.z),n3(PL.face.x),n3(PL.face.y),n3(PL.face.z)],r:Math.round(PL.r*100),sw,tl:[PL.tools.axe,PL.tools.pick,PL.tools.weap],wt:PL.inWater?1:0,dd:PL.dead>0?1:0,in:this.ready?1:0,ev:this.ev};
  if(this.host)p.H=hostState();
  const sz=()=>new TextEncoder().encode(JSON.stringify(p)).length;while(sz()>3900&&p.H&&p.H.en&&p.H.en.length){p.H.en.pop()}while(sz()>3900&&p.ev.length>2)p.ev=p.ev.slice(1);
  this.game.presence(p).catch(()=>{})};
// ホストの星の状態
function hostState(){let bits='';for(let n=0;n<=NTILE;n+=6){let v=0;for(let k=0;k<6;k++)if(W.open.has(n+k))v|=1<<k;bits+='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'[v]}
  const pd={};for(const n in W.paid){if(!available(+n))continue;const s=Object.entries(W.paid[n]).filter(([,v])=>v>0).map(([k,v])=>k+':'+v).join(',');if(s)pd['t'+n]=s}
  // 敵：だれかの近く（25 以内）の敵だけ
  const near=[PL.u].concat(NET.targets().map(t=>t.u));const en=[];let cur='';
  for(const e of ENEMIES){if(!W.open.has(e.n))continue;if(!near.some(u=>arcDist(u,e.u,SEA)<25))continue;const s=[e.id.toString(36),e.alive?1:0,n3(e.u.x),n3(e.u.y),n3(e.u.z),Math.max(0,Math.round(e.hp)),e.wind>0?1:e.atkAnim>0?2:0].join(',');
    if(cur.length+s.length>900){en.push(cur);cur=''}cur+=(cur?';':'')+s}if(cur)en.push(cur);
  const PB=portalB();const ps=PB&&PB.st?(PB.st.step||0)+'|'+Object.entries(PB.st.paid||{}).map(([k,v])=>k+':'+v).join(','):'0|';
  return{w:CUR,o:bits,pd,en,ps,y:OPT.yield}}
function readBits(s){const set=new Set([0]);const A='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';for(let i=0;i<s.length;i++){const v=A.indexOf(s[i]);if(v<0)continue;for(let k=0;k<6;k++)if(v&(1<<k)){const n=i*6+k;if(n<=NTILE)set.add(n)}}return set}
// ---- 毎コマ ----
NET.tick=function(dt){if(!this.on)return;this.sendT=(this.sendT||0)+dt;if(this.sendT>=.1){this.sendT=0;this.send()}updateAvatars(dt)};
// ---- 部屋の人が変わった ----
function netPeers(){const os=NET.others();
  if(!NET.host){const h=os.find(q=>q.presence.H&&typeof q.presence.H==='object');
    if(!h){if(NET.hostP&&performance.now()-NET.joinT>1500){NET.hostP=null;toast('ホストが部屋を閉じました');netLeave()}else if(!NET.hostP&&performance.now()-NET.joinT>15000){netLeave();toast('部屋が見つかりませんでした')}return}
    NET.hostP=h;readHost(h.presence)}
  for(const q of os){readEvents(q.presence);avatarState(q);if(q.presence.in===1&&!NET.known.has(q.presence.id)){NET.known.add(q.presence.id);if(NET.ready)toast((netClean(q.presence.n).slice(0,14)||'だれか')+' が入りました')}}
  for(const id of [...NET.known])if(!os.some(q=>q.presence.id===id)){NET.known.delete(id);const a=NET.avs.get(id);toast((a?a.name:'だれか')+' が出ました');if(a){dropAv(a);NET.avs.delete(id)}}
  if(NET.host&&os.length+1!==NET.npSent)netLobby();uiNetBox()}
// ゲスト：ホストの星を読む
function readHost(o){const H=o.H;if(typeof H.o!=='string')return;const hw=WDEF[H.w]?H.w:'gaia';
  if(NET.ready&&hw!==CUR){NET.ready=false;showLoading('ホストといっしょに '+WDEF[hw].n+' へ…')}
  if(!NET.ready&&hw!==CUR){buildWorld(hw)}
  const open=readBits(H.o);
  if(!NET.ready){// はじめて：ホストの星をそのまま
    const paid={};for(const k in H.pd||{}){const n=+k.slice(1);paid[n]={};String(H.pd[k]).split(',').forEach(x=>{const [r,v]=x.split(':');if(RES[r])paid[n][r]=+v||0})}
    const pb=portalB();const b={};if(pb&&typeof H.ps==='string'){const [st,pp]=H.ps.split('|');const pd2={};(pp||'').split(',').filter(Boolean).forEach(x=>{const [r,v]=x.split(':');pd2[r]=+v||0});b[pb.n]={step:+st||0,paid:pd2}}
    applySave({v:2,w:hw,worlds:{[hw]:{open:[...open],paid,b,nodes:[],seen:[...AREA_SEEN]}}},{worldOnly:true});
    if(Array.isArray(o.s)&&o.s.length>=3){const u=V3(o.s[0],o.s[1],o.s[2]).normalize();const ci=cellAt(u,-1);PL.u.copy(u);PL.cell=ci;PL.r=groundR(u,CELLS[ci]);CAM.ready=0}
    NET.ready=true;OPT.hostYield=H.y;STATE='play';hideLoading();toast((NET.hostName||'ホスト')+' の星（'+WD.n+'）に来ました');for(const q of NET.others())if(q.presence.in===1)NET.known.add(q.presence.id);return}
  for(const n of open)if(!W.open.has(n))unlockTile(n,true);
  for(const k in H.pd||{}){const n=+k.slice(1);const cur=W.paid[n]||(W.paid[n]={});String(H.pd[k]).split(',').forEach(x=>{const [r,v]=x.split(':');if(RES[r])cur[r]=Math.max(cur[r]||0,+v||0)})}
  const pb=portalB();if(pb&&typeof H.ps==='string'){const [st,pp]=H.ps.split('|');const S=pb.st||(pb.st={});const step=+st||0;if(step>(S.step||0)){S.step=step;S.paid={};if(step>=7){SFX.portal();banner('ポータルが動いた！','')}}
    (pp||'').split(',').filter(Boolean).forEach(x=>{const [r,v]=x.split(':');S.paid=S.paid||{};S.paid[r]=Math.max(S.paid[r]||0,+v||0)})}
  // 敵
  const seen=new Set();for(const chunk of H.en||[])String(chunk).split(';').forEach(s=>{const a=s.split(',');if(a.length<7)return;const e=ENEMIES[parseInt(a[0],36)];if(!e)return;seen.add(e);e.remote=true;
    e.netU=e.netU||new THREE.Vector3();e.netU.set(+a[2],+a[3],+a[4]).normalize();const alive=a[1]==='1';if(e.alive&&!alive){e.alive=false;e.dying=.4;SFX.fell()}else if(!e.alive&&alive){e.alive=true;e.u.copy(e.netU);e.cell=cellAt(e.u,e.cell);e.mesh.scale.setScalar(ENEMY[e.k].sc)}
    e.hp=+a[5];e.wind=a[6]==='1'?.3:0;if(a[6]==='2')e.atkAnim=.2});
  for(const e of ENEMIES)e.remote=true}
// ゲスト：ホストから来た敵の位置へなめらかに
function netEnemyFollow(e,dt){if(!e.netU)return;const before=_t1.copy(e.u);e.u.lerp(e.netU,1-Math.exp(-dt*10)).normalize();e.cell=cellAt(e.u,e.cell);const mv=_t2.copy(e.u).sub(before);e.mv=mv.lengthSq()>1e-9;if(e.mv){tangent(mv,e.u,mv);e.face.lerp(mv,1-Math.exp(-dt*10)).normalize()}}
// 出来事を読む
function readEvents(o){const L=Array.isArray(o.ev)?o.ev:[];const id=o.id;let last=NET.seen[id];
  const parsed=L.map(s=>{const i=String(s).indexOf('|');return[parseInt(s,10),String(s).slice(i+1)]}).filter(x=>Number.isFinite(x[0]));const mx=parsed.reduce((m,x)=>Math.max(m,x[0]),0);
  if(last===undefined||o.w&&o.w!==CUR){NET.seen[id]=Math.max(last||0,mx);return}
  for(const [q,s] of parsed){if(q<=last)continue;const a=s.split(':');
    if(a[0]==='g'){const nd=NODES[+a[1]];if(nd)nodeDown(nd)}
    else if(a[0]==='p'&&NET.host){const n=+a[1],k=a[2],v=+a[3];if(TILES[n]&&RES[k]&&available(n)&&v>0){const pd=W.paid[n]||(W.paid[n]={});pd[k]=Math.min(TILES[n].cost[k]||0,(pd[k]||0)+v);if(Object.keys(TILES[n].cost).every(r=>(pd[r]||0)>=TILES[n].cost[r]))unlockTile(n,true)}}
    else if(a[0]==='q'&&NET.host){const B=portalB();const k=a[1],v=+a[2];if(B&&B.st&&(B.st.step||0)<7&&RES[k]&&v>0){const st=PORTAL_STEPS[B.st.step||0];B.st.paid=B.st.paid||{};B.st.paid[k]=Math.min(st.c[k]||0,(B.st.paid[k]||0)+v);if(Object.keys(st.c).every(r=>(B.st.paid[r]||0)>=st.c[r]))portalStepDone(B)}}
    else if(a[0]==='h'&&NET.host){const e=ENEMIES[+a[1]];const d=Math.min(40,+a[2]||0);if(e&&e.alive&&d>0){e.hp-=d;e.st='chase';e.flash=.15;if(e.hp<=0)killEnemy(e,id)}}
    else if(a[0]==='x'&&a[1]===NET.id){damagePlayer(Math.min(200,+a[2]||0),'enemy')}
    else if(a[0]==='d'&&a[1]===NET.id){const k=a[2];const e=ENEMIES.find(x=>x.k===k&&x.netU&&arcDist(x.netU,PL.u,SEA)<6)||null;const D=ENEMY[k]&&ENEMY[k].drop;if(D){const top=e?e.pos.clone().addScaledVector(e.u,1):PL.u.clone().multiplyScalar(PL.r+1);const y=OPT.hostYield||1;for(const r in D)dropPieces(r,Math.round(D[r]*(r==='coin'?1:y)*bonus(r)),top,e?e.u:PL.u)}}}
  NET.seen[id]=Math.max(last,mx)}
// ---- ほかの人の姿 ----
function avatarState(q){const o=q.presence,id=o.id;let a=NET.avs.get(id);const name=netClean(o.n).slice(0,14)||'???',sk=SKINS.some(s=>s.id===o.sk)?o.sk:'stick';
  if(!a){a={id,name,buf:[],m:null,sk:'',el:document.createElement('div'),u:new THREE.Vector3(),f:new THREE.Vector3(),r:SEA,walk:0,spd:0};a.el.className='nameTag';$('tags').appendChild(a.el);NET.avs.set(id,a)}
  a.name=name;a.el.textContent=name;if(a.sk!==sk){if(a.m)scene.remove(a.m);a.m=makeChar(sk);scene.add(a.m);a.sk=sk}
  a.in=o.in===1&&(!o.w||o.w===CUR);a.wt=o.wt===1;a.dd=o.dd===1;a.sw=typeof o.sw==='string'?o.sw:'';a.tl=Array.isArray(o.tl)?o.tl:[1,1,1];
  const s=o.s;if(Array.isArray(s)&&s.length===6&&s.every(Number.isFinite)){const L=a.buf[a.buf.length-1];if(!L||L.s.some((v,i)=>v!==s[i])||L.r!==o.r)a.buf.push({t:performance.now(),s:s.slice(),r:(+o.r||2600)/100});if(a.buf.length>20)a.buf.shift()}}
function dropAv(a){if(a.m)scene.remove(a.m);if(a.el)a.el.remove()}
const _av=new THREE.Vector3(),_avf=new THREE.Vector3();
function updateAvatars(dt){const rt=performance.now()-130,W2=innerWidth,H2=innerHeight;
  for(const [,a] of NET.avs){const show=a.in&&NET.ready&&a.m&&a.buf.length>0&&STATE==='play';if(a.m)a.m.visible=!!show;if(!show){a.el.style.display='none';continue}
    const B=a.buf;let p=B[0],n=B[0];for(let i=0;i<B.length;i++){if(B[i].t<=rt)p=B[i];if(B[i].t>=rt){n=B[i];break}n=B[i]}const k=n.t>p.t?clamp((rt-p.t)/(n.t-p.t),0,1):1;
    const prev=_avf.copy(a.u);a.u.set(lerp(p.s[0],n.s[0],k),lerp(p.s[1],n.s[1],k),lerp(p.s[2],n.s[2],k)).normalize();a.f.set(lerp(p.s[3],n.s[3],k),lerp(p.s[4],n.s[4],k),lerp(p.s[5],n.s[5],k));tangent(a.f,a.u,a.f);a.r=lerp(p.r,n.r,k);
    a.spd=lerp(a.spd,prev.distanceTo(a.u)*SEA/Math.max(dt,1e-3),Math.min(1,dt*8));a.walk+=dt*Math.min(a.spd,6)*2.2;
    const M=a.m,P=M.userData.P;M.position.copy(a.u).multiplyScalar(a.r);frameQuat(a.u,a.f,M.quaternion);if(a.dd)M.rotateX(-1.3);
    const w=a.spd>.3?Math.sin(a.walk):0,am=a.spd>.3?.7:0;P.legL.rotation.x=w*am;P.legR.rotation.x=-w*am;P.armL.rotation.x=-w*am*.8;
    if(a.sw){const tk={a:'axe',p:'pick',w:'weap'}[a.sw[0]],ph=(+a.sw.slice(1)||0)/8;const ang=ph<.55?-2.4*(ph/.55):-2.4+2.9*Math.min(1,(ph-.55)/.2);P.armR.rotation.x=ang;setHeld(M,tk,a.tl[{axe:0,pick:1,weap:2}[tk]]||1)}else{P.armR.rotation.x=w*am*.8;setHeld(M,null)}
    _av.copy(a.u).multiplyScalar(a.r+2.1).project(camera);if(_av.z>1){a.el.style.display='none';continue}a.el.style.display='block';a.el.style.left=((_av.x+1)/2*W2)+'px';a.el.style.top=((1-_av.y)/2*H2)+'px'}}
addEventListener('pagehide',()=>{try{if(NET.game)NET.game.leave().catch(()=>{});if(NET.room)NET.room.presence({lu:null}).catch(()=>{})}catch(e){}});
