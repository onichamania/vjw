// ===================== オンライン対戦（アーティファクトの room で 1対1） =====================
// ・ロビー（room 本体）の presence に {pd:{n,c,t,st}} を出して「部屋の一覧」にする
// ・部屋は room.join('pd-xxxxxx')。presence だけで同期する（イベント送信は閲覧者には使えないため）
//   みんな：名前・見た目・武器・位置・攻撃の回数・体力・やられた回数・当てた攻撃（h）・TNT（ex）
//   ホスト：試合の段階（ph）・ラウンド（rd）・残り時間（tl）・相手に決めた人（op）
// ・当たり判定は攻撃した側。やられた側が受け取って自分の体力をへらす
const NET={st:'off',room:null,game:null,code:'',title:'',host:false,myPeer:'',oppPeer:'',rd:0,rdy:0,ph:'wait',
  hits:[],ex:[],hseq:0,eseq:0,seenHit:-1,seenEx:-1,seenPeer:'',buf:[],lastA:-1,lastDD:0,lastSD:0,sendT:0,conn:false,lobby:[],gpeers:[],unsub:[],gunsub:[],errMsg:'',oppP:null,hostP:null,lostT:0,
  pushHit(dmg,head,w){this.hseq++;this.hits.push([this.hseq,Math.round(dmg*10)/10,head?1:0,WIDS.indexOf(w)]);if(this.hits.length>6)this.hits.shift();sendNow()},
  pushEx(id){this.eseq++;this.ex.push([this.eseq,id]);if(this.ex.length>4)this.ex.shift();sendNow()},
  oppUpdate(dt){oppUpdate(dt)}};
const CODE_RE=/^pd-[a-z0-9]{6}$/;
const cleanName=s=>String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g,'').trim().slice(0,14);
function claudeObj(){try{if(window.claude&&window.claude.use)return window.claude}catch(e){}try{if(window.parent&&window.parent!==window&&window.parent.claude&&window.parent.claude.use)return window.parent.claude}catch(e){}return null}
function netErr(e,game){const c=e&&e.code;if(game&&NET.game&&c!=='invalid_argument'){leaveRoom(true);tip('部屋との接続が切れました',3)}
  if(['revoked','not_granted','capability_disabled','capability_removed','transform_error'].includes(c)){NET.st='err';NET.errMsg=c==='not_granted'?'この開き方ではオンラインに接続できません。':'オンラインが使えなくなりました。';renderNet()}}
async function netInit(){if(NET.st!=='off'&&NET.st!=='none')return;NET.st='wait';renderNet();
  const C=claudeObj();let room=null;if(C){try{room=await C.use('room')}catch(e){room=null}}
  if(!room){NET.st='none';renderNet();return}
  NET.room=room;NET.st='ok';NET.conn=room.connected();
  NET.unsub.push(room.onPeers(ch=>{NET.lobby=ch.peers;renderRooms()},e=>netErr(e)));
  NET.unsub.push(room.onConnection(c=>{NET.conn=c;renderNet()},e=>netErr(e)));
  lobbyPresence(true);renderNet();renderRooms()}
// ロビーでの自分（部屋を開いているときだけ一覧に出る）
function lobbyPresence(on){if(!NET.room)return;const pd=on?{n:cleanName(SV.name),c:NET.code||'',t:NET.title||'',st:NET.game?(NET.host&&!NET.oppPeer?'wait':'play'):'look'}:null;NET.room.presence({pd}).catch(()=>{})}
function roomList(){const out=[];for(const p of NET.lobby){if(p.sameTab||p.kind!=='viewer')continue;const pd=p.presence&&p.presence.pd;if(!pd||typeof pd!=='object')continue;
  if(pd.st!=='wait'||typeof pd.c!=='string'||!CODE_RE.test(pd.c))continue;out.push({c:pd.c,n:cleanName(pd.n)||'???',t:cleanName(pd.t)||'部屋',guest:p.guest,mine:p.isMe})}return out}
// ---------------- 部屋 ----------------
async function createRoom(){if(!NET.room)return;const code='pd-'+Array.from({length:6},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('');
  await enterRoom(code,true,cleanName($('roomIn').value)||(cleanName(SV.name)+'の部屋'))}
async function enterRoom(code,host,title){if(NET.game)await leaveRoom(true);$('rMake').disabled=true;let g=null;
  try{g=await NET.room.join(code)}catch(e){$('rMake').disabled=false;tip(e&&e.code==='limit_reached'?'今は部屋に入れません。少し待ってからもう一度':'部屋に入れませんでした',3);return}
  $('rMake').disabled=false;Object.assign(NET,{game:g,code,host,title,oppPeer:'',rd:0,rdy:1,ph:'wait',seenPeer:'',buf:[],oppP:null,hostP:null,joinT:performance.now()});
  NET.gunsub=[g.onPeers(ch=>{NET.gpeers=ch.peers;gamePeers()},e=>netErr(e,true))];
  sendNow();lobbyPresence(true);showWait()}
async function leaveRoom(silent){const g=NET.game;NET.gunsub.forEach(u=>{try{u()}catch(e){}});NET.gunsub=[];NET.game=null;NET.code='';NET.oppPeer='';NET.oppP=null;NET.hostP=null;OPP.here=false;
  if(g){try{await g.leave()}catch(e){}}lobbyPresence(true);if(!silent)showRooms()}
// 自分の presence（毎秒20回まで）
function myState(){const p={n:cleanName(SV.name),sk:SV.skin,w:SV.weapon,rdy:NET.rdy,r:NET.rd,
  s:[+ME.x.toFixed(2),+ME.y.toFixed(2),+ME.z.toFixed(2),+ME.yaw.toFixed(3),+ME.pitch.toFixed(3)],a:ME.seq,al:ME.alive?1:0,hp:Math.round(ME.hp),ar:Math.round(ME.ar),
  dd:ME.dd,sd:ME.sd,tk:Math.round(ME.tk),h:NET.hits,ex:NET.ex,iv:ME.inv>0?1:0,bn:ME.burn?1:0,ig:G.mode==='online'?1:0};
  if(NET.host)Object.assign(p,{ph:NET.ph,rd:NET.rd,tl:+Math.max(0,G.tl).toFixed(1),ct:+Math.max(0,G.ct).toFixed(1),op:NET.oppPeer,t:NET.title});return p}
function sendNow(){if(!NET.game)return;NET.sendT=0;NET.game.presence(myState()).catch(e=>{if(e&&e.code==='invalid_argument')console.warn(e)})}
function netTick(dt){if(!NET.game)return;NET.sendT+=dt;if(NET.sendT>=.05)sendNow();
  if(!NET.conn&&G.mode==='online'){NET.lostT+=dt}else NET.lostT=0;const n=$('net');
  if(G.mode==='online'&&NET.lostT>2){n.style.display='block';n.textContent='接続が切れています…'}else n.style.display='none';
  if(NET.host)hostLogic(dt)}
// 部屋の人が変わった
function gamePeers(){const others=NET.gpeers.filter(p=>!p.sameTab&&p.kind==='viewer'&&p.presence&&typeof p.presence.n==='string');const me=NET.gpeers.find(p=>p.sameTab);if(me)NET.myPeer=me.peer;
  if(NET.host){if(NET.oppPeer&&!others.some(p=>p.peer===NET.oppPeer)){oppLeft();NET.oppPeer=''}
    if(!NET.oppPeer&&others.length){NET.oppPeer=others[0].peer;lobbyPresence(true);sendNow()}
    NET.oppP=others.find(p=>p.peer===NET.oppPeer)||null}
  else{const h=others.find(p=>typeof p.presence.ph==='string');
    if(!h){if(NET.hostP&&performance.now()-NET.joinT>1500){NET.hostP=null;NET.oppP=null;oppLeft(true)}else if(!NET.hostP&&performance.now()-NET.joinT>12000){leaveRoom();tip('部屋が見つかりませんでした',3)}}
    else{NET.hostP=h;NET.oppP=h;NET.oppPeer=h.peer;if(h.presence.op&&NET.myPeer&&h.presence.op!==NET.myPeer){leaveRoom();tip('この部屋はもう対戦中です',3);return}guestLogic()}}
  readOpp();if($('sWait').classList.contains('on'))showWait()}
function oppLeft(hostGone){OPP.here=false;if(G.mode==='online'&&G.phase!=='end'){endMatch('left')}else if(hostGone&&!G.mode){leaveRoom();tip('ホストが部屋を出ました',3);return}
  NET.ph='wait';if(!G.mode&&$('sWait').classList.contains('on'))showWait()}
// ホスト：ふたりとも準備できたら次のラウンドを始める。試合中は段階を出す
function hostLogic(dt){const o=NET.oppP&&NET.oppP.presence;
  if(G.mode==='online'){NET.ph=G.phase==='count'?'count':G.phase==='play'?'play':'end';NET.goT=0}
  else if(o&&NET.rdy===NET.rd+1&&o.rdy===NET.rd+1){NET.goT=(NET.goT||0)+dt;if(NET.goT>1.6){NET.goT=0;NET.rd++;NET.ph='count';beginOnline(0,o);sendNow()}}else NET.goT=0}
// ゲスト：ホストの段階についていく
function guestLogic(){const h=NET.hostP.presence;if(typeof h.rd!=='number')return;
  if(h.op===NET.myPeer&&h.rd>NET.rd&&(h.ph==='count'||h.ph==='play')&&NET.rdy===h.rd){NET.rd=h.rd;beginOnline(1,h)}
  if(G.mode==='online'&&h.rd===NET.rd){if(typeof h.tl==='number')G.tl=h.tl;if(h.ph==='count'&&typeof h.ct==='number')G.ct=h.ct;if(h.ph==='play'&&G.phase==='count')G.ct=0;if(h.ph==='end'&&G.phase==='play')endMatch()}}
function beginOnline(side,o){startMatch('online',{side,oppName:cleanName(o.n)||'???',oppW:WIDS.includes(o.w)?o.w:'fists',oppSk:(o.sk|0)%6});NET.buf=[];NET.lastA=typeof o.a==='number'?o.a:-1;NET.lastDD=0;NET.lastSD=0;OPP.here=false;sendNow()}
// 相手の presence を読む
function readOpp(){const P=NET.oppP;if(!P)return;const o=P.presence;
  if(P.peer!==NET.seenPeer){NET.seenPeer=P.peer;NET.seenHit=maxSeq(o.h);NET.seenEx=maxSeq(o.ex);NET.lastA=typeof o.a==='number'?o.a:-1}
  if(G.mode!=='online')return;const same=o.r===NET.rd&&o.ig===1;OPP.here=same;if(!same)return;
  if(WIDS.includes(o.w))OPP.w=o.w;OPP.alive=!!o.al;OPP.hp=+o.hp||0;OPP.ar=+o.ar||0;OPP.inv=o.iv?1:0;OPP.netBurn=!!o.bn;OPP.tk=+o.tk||0;
  const s=o.s;if(Array.isArray(s)&&s.length===5&&s.every(Number.isFinite)){const L=NET.buf[NET.buf.length-1];if(!L||L.s.some((v,i)=>v!==s[i]))NET.buf.push({t:performance.now(),s:s.slice()});if(NET.buf.length>30)NET.buf.shift()}
  if(typeof o.a==='number'&&o.a!==NET.lastA){if(o.a>NET.lastA){OPP.atkT=0;if(Math.hypot(OPP.x-ME.x,OPP.z-ME.z)<14)SFX.swing(OPP.w)}NET.lastA=o.a}
  // やられた回数（キルの表示）
  const dd=o.dd|0,sd=o.sd|0;if(dd>NET.lastDD){addFeed(ME,OPP,ME.w,false);SFX.kill();fx(OPP.x,OPP.y+1,OPP.z,'#c81e1e',22,5,.9,.12)}if(sd>NET.lastSD)addFeed(OPP,OPP,'tnt',false);NET.lastDD=dd;NET.lastSD=sd;OPP.dd=dd;OPP.sd=sd;
  // 相手の攻撃が自分に当たった
  if(Array.isArray(o.h))for(const h of o.h){if(!Array.isArray(h)||!(h[0]>NET.seenHit))continue;NET.seenHit=h[0];const w=WIDS[h[3]],W=WEAPONS[w];if(!W)continue;
    const dmg=Math.min(+h[1]||0,W.dmg*W.head+.5);if(G.phase==='play'&&Math.hypot(OPP.x-ME.x,OPP.y-ME.y,OPP.z-ME.z)<W.range+3.5)applyHit(ME,dmg,!!h[2],w,OPP)}
  if(Array.isArray(o.ex))for(const e of o.ex){if(!Array.isArray(e)||!(e[0]>NET.seenEx))continue;NET.seenEx=e[0];const t=TNTS[e[1]|0];if(t)tntLight(t,OPP)}}
const maxSeq=a=>Array.isArray(a)?a.reduce((m,h)=>Array.isArray(h)&&h[0]>m?h[0]:m,-1):-1;
// 相手の位置：0.1秒前の位置をなめらかにつなぐ
function oppUpdate(dt){readOpp();const B=NET.buf;if(!B.length)return;const rt=performance.now()-110;let a=B[0],b=B[0];
  for(let i=0;i<B.length;i++){if(B[i].t<=rt)a=B[i];if(B[i].t>=rt){b=B[i];break}b=B[i]}
  const k=b.t>a.t?clamp((rt-a.t)/(b.t-a.t),0,1):1;const px=OPP.x,pz=OPP.z;
  OPP.x=lerp(a.s[0],b.s[0],k);OPP.y=lerp(a.s[1],b.s[1],k);OPP.z=lerp(a.s[2],b.s[2],k);OPP.yaw=a.s[3]+angDiff(a.s[3],b.s[3])*k;OPP.pitch=lerp(a.s[4],b.s[4],k);
  OPP.spd=lerp(OPP.spd,Math.hypot(OPP.x-px,OPP.z-pz)/Math.max(dt,1e-3),Math.min(1,dt*10));OPP.atkT+=dt;
  if(OPP.netBurn&&OPP.alive&&Math.random()<dt*14)fx(OPP.x+rr(-.3,.3),OPP.y+rr(.3,1.6),OPP.z+rr(-.3,.3),pick(['#ff7a1a','#ffd23f','#ff3a1a']),1,1,.5,.1,-2)}
// ---------------- 画面 ----------------
function renderNet(){const e=$('netState');if(!e)return;let t='';
  if(NET.st==='wait')t='オンラインに接続しています…';
  else if(NET.st==='none')t='オンライン対戦は、Claude のアーティファクトとして開いたときに使えます（このページだけでは CPU と練習できます）。';
  else if(NET.st==='err')t=NET.errMsg;
  else if(NET.st==='ok')t=(NET.conn?'🟢 接続中・このページを開いている人：'+NET.lobby.filter(p=>p.kind==='viewer').length+'人':'🟡 接続を待っています…')+'\n参加できるのは、このアーティファクトを開ける人（同じ組織のメンバーか招待された人）です。';
  e.textContent=t;e.style.whiteSpace='pre-line';$('rMake').disabled=NET.st!=='ok';$('roomIn').disabled=NET.st!=='ok'}
function renderRooms(){renderNet();const L=$('rlist');if(!L)return;L.textContent='';const rs=NET.st==='ok'?roomList():[];
  if(!rs.length){const d=document.createElement('div');d.className='note';d.style.textAlign='center';d.textContent=NET.st==='ok'?'まだ部屋がありません。部屋を作って相手を待とう！':'—';L.appendChild(d);return}
  for(const r of rs){const d=document.createElement('div');d.className='ri';const b=document.createElement('b');b.textContent=r.t;const s=document.createElement('small');s.textContent='ホスト：'+r.n+(r.mine?'（あなたの別のタブ）':'')+(r.guest?'（ゲスト）':'');
    const box=document.createElement('div');box.style.flex='1';box.appendChild(b);box.appendChild(document.createElement('br'));box.appendChild(s);const j=document.createElement('button');j.className='pb b';j.style.minWidth='90px';j.style.padding='6px 12px';j.textContent='参加';
    j.onclick=()=>{SFX.click();enterRoom(r.c,false,r.t)};d.appendChild(box);d.appendChild(j);L.appendChild(d)}}
function showRooms(){showScr('sRooms');netInit();lobbyPresence(true);renderRooms()}
function showWait(){showScr('sWait');const o=NET.oppP&&NET.oppP.presence;$('podAn').textContent=cleanName(SV.name);drawPodium($('podA'),SV.skin,SV.weapon);
  if(o){$('podBn').textContent=cleanName(o.n)||'???';drawPodium($('podB'),(o.sk|0)%6,WIDS.includes(o.w)?o.w:'fists')}else{$('podBn').textContent='？？？';$('podB').getContext('2d').clearRect(0,0,60,85)}
  $('wTitle').textContent=o?'まもなく対戦がはじまります':'対戦相手を待っています…';
  $('wNote').textContent=(NET.host?'部屋「'+NET.title+'」を作りました。'+(o?'':'相手がこの部屋に入るのを待っています。'):'部屋「'+NET.title+'」に入りました。'+(o?'':'ホストを待っています…'))+(o&&o.rdy!==NET.rd+1&&NET.rd>0?'（相手が「もう一度」をおすのを待っています）':'')}
// ページを閉じたら部屋を出る（ランチャーで別のゲームに切りかえたときも）
addEventListener('pagehide',()=>{try{NET.gunsub.forEach(u=>u());NET.unsub.forEach(u=>u());if(NET.game)NET.game.leave().catch(()=>{});if(NET.room)NET.room.presence({pd:null}).catch(()=>{})}catch(e){}});
