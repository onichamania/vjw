// ===================== オンライン対戦（アーティファクトの room）：1対1とデスマッチ（8人まで） =====================
// ・ロビー（room 本体）の presence に {pd:{n,c,t,st,md,np}} を出して「部屋の一覧」にする（md：'duel' 1対1 / 'dm' デスマッチ、np：人数）
// ・部屋は room.join('pd-xxxxxx')。presence だけで同期する（イベント送信は閲覧者には使えないため）
//   みんな：名前・見た目・武器・位置・攻撃の回数・体力・やられた回数・だれにやられたか（kb）・あたえたダメージ（dl）
//           当てた攻撃（h：相手の peer つき）・TNT（ex）・ヘビーの弾（pj）・ポータル（pt）
//   ホスト：試合の段階（ph）・ラウンド（rd）・残り時間（tl）・この試合の参加者（pl）・ルール（md）・アイテム（it）
// ・当たり判定は攻撃した側。やられた側が受け取って自分の体力をへらし、だれにやられたかを kb に書く（キル数は全員の kb を足して出す）
// ・デスマッチはホストが「スタート」でラウンドを始める。試合中に来た人もとちゅうから入れる
const CAP={duel:2,dm:8};
const NET={st:'off',room:null,game:null,code:'',title:'',md:'duel',host:false,myPeer:'',rd:0,rdy:0,ph:'wait',pl:[],
  hits:[],ex:[],hseq:0,eseq:0,sendT:0,conn:false,lobby:[],gpeers:[],unsub:[],gunsub:[],errMsg:'',hostP:null,lostT:0,joinT:0,goT:0,npSent:-1,
  // V：当てた相手。kb：爆発で飛ばす向きと強さ、key：同じ弾（4発同時など）をまとめて90までにするための番号
  pushHit(V,dmg,head,w,kb,key){if(!V||!V.peer)return;this.lastHitHead=head;this.hseq++;const r=v=>Math.round(v*100)/100;if(!(V.inv>0)&&V.alive)ME.dealt+=Math.min(dmg,Math.max(0,V.hp+V.ar));
    this.hits.push([this.hseq,Math.round(dmg*10)/10,head?1:0,WIDS.indexOf(w),kb?r(kb[0]):0,kb?r(kb[1]):0,kb?r(kb[2]):0,key|0,V.peer]);if(this.hits.length>12)this.hits.shift();sendNow()},
  pushShot(w,segs){this.sseq=(this.sseq||0)+1;const r=v=>Math.round(v*100)/100,a=segs[0],b=segs[1];this.shot=[this.sseq,WIDS.indexOf(w),r(a[3]),r(a[4]),r(a[5])].concat(b?[r(b[3]),r(b[4]),r(b[5])]:[]);sendNow()},
  pushProj(w,x,y,z,d,c){this.pseq=(this.pseq||0)+1;const r=v=>Math.round(v*100)/100,q=v=>Math.round(v*1000)/1000;this.pj=(this.pj||[]).concat([[this.pseq,WIDS.indexOf(w),r(x),r(y),r(z),q(d[0]),q(d[1]),q(d[2]),Math.round((c||0)*100)]]).slice(-8);sendNow()},
  pushEx(id){this.eseq++;this.ex.push([this.eseq,id]);if(this.ex.length>4)this.ex.shift();sendNow()},
  oppUpdate(dt){foesUpdate(dt)}};
const CODE_RE=/^pd-[a-z0-9]{6}$/;
const cleanName=s=>String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g,'').trim().slice(0,14);
function claudeObj(){try{if(window.claude&&window.claude.use)return window.claude}catch(e){}try{if(window.parent&&window.parent!==window&&window.parent.claude&&window.parent.claude.use)return window.parent.claude}catch(e){}return null}
function netErr(e,game){const c=e&&e.code;if(game&&NET.game&&c!=='invalid_argument'){leaveRoom(true);tip('部屋との接続が切れました',3)}
  if(['revoked','not_granted','capability_disabled','capability_removed','transform_error'].includes(c)){NET.st='err';NET.errMsg=(c==='not_granted'?'この開き方ではオンラインに接続できません。\n'+NET_HOWTO:'共有の設定などが変わったので、このページのオンラインが切れました。アーティファクトを一度閉じて、開き直してください（ページを開き直すまで、もどりません）。')+'\n（しらべた結果：エラー '+c+'）';renderNet()}}
async function netInit(){if(NET.st!=='off'&&NET.st!=='none')return;NET.st='wait';renderNet();
  const C=claudeObj();let room=null,t0=performance.now(),ue='';if(C){try{room=await C.use('room')}catch(e){room=null;ue=String(e&&(e.code||e.message)||e).slice(0,40)}}
  if(!room){NET.st='none';NET.why=await netWhy(C);NET.diag='しらべた結果：claude '+(C?'あり':'なし')+'・room なし（'+Math.round(performance.now()-t0)+'ms'+(ue?'・'+ue:'')+'）・許可 '+NET.why+'・'+(window.top===window?'単独のページ':'枠の中');renderNet();return}
  NET.room=room;NET.st='ok';NET.conn=room.connected();NET.okT=performance.now();setTimeout(renderNet,8200);   // 8秒たってもつながらなければ、わけを出す
  NET.unsub.push(room.onPeers(ch=>{NET.lobby=ch.peers;renderRooms()},e=>netErr(e)));
  NET.unsub.push(room.onConnection(c=>{NET.conn=c;renderNet()},e=>netErr(e)));
  lobbyPresence(true);renderNet();renderRooms()}
// 部屋の中のほかの人
const others=()=>NET.gpeers.filter(p=>!p.sameTab&&p.kind==='viewer'&&p.presence&&typeof p.presence.n==='string');
// ロビーでの自分（ホストだけが部屋を一覧に出す。デスマッチは満員になるまで、試合中でも入れる）
function lobbyPresence(on){if(!NET.room)return;const np=NET.game?others().length+1:0;NET.npSent=np;
  const st=!NET.game?'look':!NET.host?'play':NET.md==='dm'?(np<CAP.dm?'wait':'full'):(np<2?'wait':'play');
  const pd=on?{n:cleanName(SV.name),c:NET.code||'',t:NET.title||'',st,md:NET.md,np}:null;NET.room.presence({pd}).catch(()=>{})}
function roomList(){const out=[];for(const p of NET.lobby){if(p.sameTab||p.kind!=='viewer')continue;const pd=p.presence&&p.presence.pd;if(!pd||typeof pd!=='object')continue;
  if(pd.st!=='wait'||typeof pd.c!=='string'||!CODE_RE.test(pd.c))continue;out.push({c:pd.c,n:cleanName(pd.n)||'???',t:cleanName(pd.t)||'部屋',md:pd.md==='dm'?'dm':'duel',np:clamp(pd.np|0,1,8),guest:p.guest,mine:p.isMe})}return out}
// ---------------- 部屋 ----------------
async function createRoom(md){if(!NET.room)return;if(!NET.conn){tip('まだオンラインにつながっていません（上の説明を見てね）',3);renderNet();return}const code='pd-'+Array.from({length:6},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('');md=md==='dm'?'dm':'duel';
  await enterRoom(code,true,cleanName($('roomIn').value)||(cleanName(SV.name)+(md==='dm'?'のデスマッチ':'の部屋')),md)}
async function enterRoom(code,host,title,md){if(NET.game)await leaveRoom(true);for(const b of['rMake','rMakeDm'])$(b).disabled=true;let g=null;
  try{g=await NET.room.join(code)}catch(e){for(const b of['rMake','rMakeDm'])$(b).disabled=false;tip(e&&e.code==='limit_reached'?'今は部屋に入れません。少し待ってからもう一度':'部屋に入れませんでした（'+(e&&e.code||'?')+'）',3);return}
  for(const b of['rMake','rMakeDm'])$(b).disabled=false;Object.assign(NET,{game:g,code,host,title,md:md==='dm'?'dm':'duel',rd:0,rdy:1,ph:'wait',pl:[],hostP:null,joinT:performance.now(),goT:0});
  NET.gunsub=[g.onPeers(ch=>{NET.gpeers=ch.peers;gamePeers()},e=>netErr(e,true))];
  sendNow();lobbyPresence(true);showWait()}
async function leaveRoom(silent){const g=NET.game;NET.gunsub.forEach(u=>{try{u()}catch(e){}});NET.gunsub=[];NET.game=null;NET.code='';NET.pl=[];NET.hostP=null;
  if(g){try{await g.leave()}catch(e){}}lobbyPresence(true);if(!silent)showRooms()}
// 自分の presence（毎秒20回まで）
function myState(){const p={n:cleanName(SV.name),sk:SV.skin,w:G.mode==='online'?ME.w:primOf(SV.primary),wp:primOf(SV.primary),wm:SV.weapon,ws:SV.sniper,wh:HEAVIES.includes(SV.heavy)?SV.heavy:'rjumper',sc:ME.scoped?1:0,sh:NET.shot||null,pj:NET.pj||[],pt:G.mode==='online'?myPortals():[],rdy:NET.rdy,r:NET.rd,
  s:[+ME.x.toFixed(2),+ME.y.toFixed(2),+ME.z.toFixed(2),+ME.yaw.toFixed(3),+ME.pitch.toFixed(3)],a:ME.seq,al:ME.alive?1:0,hp:Math.round(ME.hp),ar:Math.round(ME.ar),po:ME.psn?1:0,bl:ME.bld?1:0,
  dd:ME.dd,sd:ME.sd,kb:ME.kb,dl:Math.round(ME.dealt||0),cm:CHAT.out,gt:G.mode==='online'?IT.got:[],h:NET.hits,ex:NET.ex,iv:ME.inv>0?1:0,bn:ME.burn?1:0,ig:G.mode==='online'?1:0};
  if(NET.host)Object.assign(p,{it:G.mode==='online'?itemsList():[],ph:NET.ph,rd:NET.rd,tl:+Math.max(0,G.tl).toFixed(1),ct:+Math.max(0,G.ct).toFixed(1),pl:NET.pl,md:NET.md,t:NET.title});return p}
function sendNow(){if(!NET.game)return;NET.sendT=0;NET.game.presence(myState()).catch(e=>{if(e&&e.code==='invalid_argument')console.warn(e)})}
function netTick(dt){if(!NET.game)return;NET.sendT+=dt;if(NET.sendT>=.05)sendNow();
  if(!NET.conn&&G.mode==='online'){NET.lostT+=dt}else NET.lostT=0;const n=$('net');
  if(G.mode==='online'&&NET.lostT>2){n.style.display='block';n.textContent='接続が切れています…'}else n.style.display='none';
  if(NET.host)hostLogic(dt)}
// 部屋の人が変わった
function gamePeers(){const os=others(),me=NET.gpeers.find(p=>p.sameTab);if(me)NET.myPeer=me.peer;
  if(!NET.host){const h=os.find(p=>typeof p.presence.ph==='string');
    if(!h){if(NET.hostP&&performance.now()-NET.joinT>1500){NET.hostP=null;hostGone()}else if(!NET.hostP&&performance.now()-NET.joinT>12000){leaveRoom();tip('部屋が見つかりませんでした',3)}}
    else{NET.hostP=h;if(h.presence.md==='dm'||h.presence.md==='duel')NET.md=h.presence.md;guestLogic();if(!NET.game)return}}
  for(const p of os)readChat(p.peer,p.presence);
  syncFoes(os);for(const F of FOES){const p=os.find(q=>q.peer===F.peer);if(p)readFoe(F,p.presence)}tallyKills();
  if(!NET.host&&NET.hostP&&G.mode==='online'&&NET.hostP.presence.rd===NET.rd)itemsFromHost(NET.hostP.presence.it);
  if(NET.host&&os.length+1!==NET.npSent)lobbyPresence(true);
  if($('sWait').classList.contains('on'))showWait()}
// ホストがいなくなった
function hostGone(){if(G.mode==='online'&&G.phase!=='end'){endMatch('left');return}if(!G.mode){leaveRoom();tip('ホストが部屋を出ました',3)}}
// ホスト：1対1はふたりとも準備できたら自動で、デスマッチは「スタート」で始める。試合中は段階を出し、デスマッチはとちゅう参加を受け入れる
const wantsIn=o=>(o.rdy|0)>(o.r|0);
function hostLogic(dt){const os=others();
  if(G.mode==='online'){NET.ph=G.phase==='count'?'count':G.phase==='play'?'play':'end';NET.goT=0;
    if(NET.md==='dm'&&G.phase!=='end')for(const p of os){if(!NET.pl.includes(p.peer)&&NET.pl.length<CAP.dm&&wantsIn(p.presence))NET.pl.push(p.peer)}}
  else if(NET.md==='duel'){const p=os[0],o=p&&p.presence;if(o&&NET.rdy>NET.rd&&wantsIn(o)){NET.goT+=dt;if(NET.goT>1.6){NET.goT=0;hostStart()}}else NET.goT=0}}
function hostStart(){if(!NET.host||G.mode)return false;const os=others().filter(p=>wantsIn(p.presence));if(!os.length){tip('いっしょに遊ぶ人がまだいません',2);return false}
  NET.rdy=Math.max(NET.rdy,NET.rd+1);NET.rd++;NET.ph='count';NET.pl=[NET.myPeer].concat(os.slice(0,CAP[NET.md]-1).map(p=>p.peer));beginOnline();sendNow();lobbyPresence(true);return true}
// ゲスト：ホストの段階についていく
function guestLogic(){const h=NET.hostP.presence;if(typeof h.rd!=='number')return;const pl=Array.isArray(h.pl)?h.pl:[],inPl=pl.includes(NET.myPeer),going=h.ph==='count'||h.ph==='play';
  if(going&&inPl&&h.rd>NET.rd&&NET.rdy>NET.rd&&G.mode!=='online'){NET.rd=h.rd;beginOnline()}
  else if(going&&!inPl&&!G.mode&&NET.myPeer&&performance.now()-NET.joinT>2500){if(NET.md==='duel'&&pl.length>=2){leaveRoom();tip('この部屋はもう対戦中です',3);return}if(NET.md==='dm'&&pl.length>=CAP.dm){leaveRoom();tip('この部屋は満員です',3);return}}
  if(G.mode==='online'&&h.rd===NET.rd){if(typeof h.tl==='number')G.tl=h.tl;if(h.ph==='count'&&typeof h.ct==='number')G.ct=h.ct;if(h.ph==='play'&&G.phase==='count')G.ct=0;if(h.ph==='end'&&G.phase==='play')endMatch()}}
function beginOnline(){const side=Math.max(0,NET.pl.indexOf(NET.myPeer));startMatch('online',{side,dm:NET.md==='dm'});sendNow()}
// ---------------- 相手たち（同じラウンドで試合中の人） ----------------
const maxSeq=a=>Array.isArray(a)?a.reduce((m,h)=>Array.isArray(h)&&h[0]>m?h[0]:m,-1):-1;
const cleanKB=kb=>{const o={};if(kb&&typeof kb==='object')for(const k in kb){const n=kb[k]|0;if(n>0&&k.length<=80)o[k]=Math.min(n,999)}return o};
function syncFoes(os){if(G.mode!=='online')return;
  for(const p of os){const o=p.presence;if(o.r===NET.rd&&o.ig===1&&!FOES.some(F=>F.peer===p.peer)&&FOES.length<CAP[NET.md]-1)addFoe(p.peer,o)}
  for(const F of FOES.slice())if(!os.some(p=>p.peer===F.peer))removeFoe(F)}
function addFoe(peer,o){const wp=primOf(o.wp),wm=MELEE.includes(o.wm)?o.wm:'fists',ws=SNIPERS.includes(o.ws)?o.ws:'acr',wh=HEAVIES.includes(o.wh)?o.wh:'rjumper';
  const F=fighter({peer,name:cleanName(o.n)||'???',w:wp,wp,wm,ws,wh,sk:(o.sk|0)%6,here:true,rpk:'',kb:cleanKB(o.kb),
    net:{buf:[],seenHit:maxSeq(o.h),seenEx:maxSeq(o.ex),seenPj:maxSeq(o.pj),lastShot:Array.isArray(o.sh)?o.sh[0]:-1,lastA:typeof o.a==='number'?o.a:-1,lastSD:o.sd|0}});
  if(Array.isArray(o.s)&&o.s.length===5&&o.s.every(Number.isFinite)){F.x=o.s[0];F.y=o.s[1];F.z=o.s[2];F.yaw=o.s[3]}
  makeOppModel(F);FOES.push(F);OPP=FOES[0];return F}
function removeFoe(F){const i=FOES.indexOf(F);if(i<0)return;if(G.mode==='online'&&G.phase!=='end'&&!G.dm)endMatch('left');FOES.splice(i,1);if(F.model)scene.remove(F.model);F.model=null;clearPortals(F);OPP=FOES[0]||NOBODY;
  if(G.mode==='online'&&G.phase!=='end'&&G.dm){{tip((F.name||'???')+' が部屋を出ました',2);if(!FOES.length&&!NET.host)endMatch('left')}}}
// ひとりの presence を読む
function readFoe(F,o){const N=F.net,same=o.r===NET.rd&&o.ig===1;F.here=same;if(!same)return;
  if(PRIMARIES.includes(o.wp))F.wp=o.wp;if(MELEE.includes(o.wm))F.wm=o.wm;if(SNIPERS.includes(o.ws))F.ws=o.ws;if(HEAVIES.includes(o.wh))F.wh=o.wh;if(o.w===F.wp||o.w===F.wm||o.w===F.ws||o.w===F.wh)F.w=o.w;F.scoped=!!o.sc;
  if(Array.isArray(o.sh)&&o.sh[0]!==N.lastShot&&o.sh.length>=5&&o.sh.every(Number.isFinite)){const nShot=clamp(o.sh[0]-N.lastShot,1,4);N.lastShot=o.sh[0];const w=WIDS[o.sh[1]];if(isPrimary(w))remotePrimShot(F,w,[o.sh[2],o.sh[3],o.sh[4]],nShot);else if(isSniper(w)){const m=muzzleOf(F),segs=[[m.x,m.y,m.z,o.sh[2],o.sh[3],o.sh[4]]];if(o.sh.length>=8)segs.push([o.sh[2],o.sh[3],o.sh[4],o.sh[5],o.sh[6],o.sh[7]]);drawShot(w,segs,false);SFX.shot(w,Math.hypot(F.x-ME.x,F.z-ME.z))}}
  if(Array.isArray(o.pj))for(const e of o.pj){if(!Array.isArray(e)||e.length<9||!e.every(Number.isFinite)||!(e[0]>N.seenPj))continue;N.seenPj=e[0];spawnRemoteProj(F,e)}
  syncRemotePortals(F,o.pt);
  F.alive=!!o.al;F.hp=+o.hp||0;F.ar=+o.ar||0;F.inv=o.iv?1:0;F.netBurn=!!o.bn;F.netPsn=!!o.po;F.netBld=!!o.bl;F.dealt=+o.dl||0;F.dd=o.dd|0;F.sd=o.sd|0;
  const s=o.s;if(Array.isArray(s)&&s.length===5&&s.every(Number.isFinite)){const L=N.buf[N.buf.length-1];if(!L||L.s.some((v,i)=>v!==s[i]))N.buf.push({t:performance.now(),s:s.slice()});if(N.buf.length>30)N.buf.shift()}
  if(typeof o.a==='number'&&o.a!==N.lastA){if(o.a>N.lastA){F.atkT=0;const dd=Math.hypot(F.x-ME.x,F.z-ME.z);if(!isGun(F.w)&&dd<16)SFX.swing(F.w,clamp(1-dd/16,.2,.8))}N.lastA=o.a}
  // アイテム：ホストは取られたものを消す
  if(NET.host)itemsTakenBy(o.gt);
  // だれにやられたか（ふえた分をキルの表示に）
  const kb=cleanKB(o.kb);for(const k in kb){const add=kb[k]-(F.kb[k]|0);if(add>0){const K=k===NET.myPeer?ME:FOES.find(x=>x.peer===k);if(K){addFeed(K,F,K.w,false);if(K===ME){SFX.kill();killPop(!!NET.lastHitHead)}}fx(F.x,F.y+1,F.z,'#c81e1e',22,5,.9,.12)}}F.kb=kb;
  if(F.sd>N.lastSD)addFeed(F,F,'tnt',false);N.lastSD=F.sd;
  // 自分あての攻撃
  if(Array.isArray(o.h))for(const h of o.h){if(!Array.isArray(h)||!(h[0]>N.seenHit))continue;N.seenHit=h[0];if(h[8]!==NET.myPeer)continue;const w=WIDS[h[3]],W=WEAPONS[w];if(!W)continue;
    const dmg=Math.min(+h[1]||0,W.dmg*W.head+.5);if(G.phase==='play'&&Math.hypot(F.x-ME.x,F.y-ME.y,F.z-ME.z)<W.range+3.5){const kb=[h[4],h[5],h[6]].map(v=>clamp(+v||0,-12,12));
      applyHit(ME,dmg,!!h[2],w,F,h[7]?F.peer+':'+(h[7]|0):undefined);   /* 同じ弾の番号があるときだけまとめて90まで */if(ME.alive&&kb.some(v=>v))knock(ME,kb)}}
  if(Array.isArray(o.ex))for(const e of o.ex){if(!Array.isArray(e)||!(e[0]>N.seenEx))continue;N.seenEx=e[0];const t=TNTS[e[1]|0];if(t)tntLight(t,F)}}
// キル数：みんなの「だれにやられたか」を足す
function tallyKills(){if(G.mode!=='online')return;ME.kills=FOES.reduce((a,F)=>a+(F.kb[NET.myPeer]|0),0);for(const F of FOES)F.kills=(ME.kb[F.peer]|0)+FOES.reduce((a,V)=>a+(V!==F?V.kb[F.peer]|0:0),0)}
// 相手の位置：0.1秒前の位置をなめらかにつなぐ
function foesUpdate(dt){for(const F of FOES){const B=F.net&&F.net.buf;if(!B||!B.length)continue;const rt=performance.now()-110;let a=B[0],b=B[0];
  for(let i=0;i<B.length;i++){if(B[i].t<=rt)a=B[i];if(B[i].t>=rt){b=B[i];break}b=B[i]}
  const k=b.t>a.t?clamp((rt-a.t)/(b.t-a.t),0,1):1;const px=F.x,pz=F.z;
  F.x=lerp(a.s[0],b.s[0],k);F.y=lerp(a.s[1],b.s[1],k);F.z=lerp(a.s[2],b.s[2],k);F.yaw=a.s[3]+angDiff(a.s[3],b.s[3])*k;F.pitch=lerp(a.s[4],b.s[4],k);
  F.spd=lerp(F.spd,Math.hypot(F.x-px,F.z-pz)/Math.max(dt,1e-3),Math.min(1,dt*10));F.atkT+=dt;
  if(F.netBurn&&F.alive&&Math.random()<dt*14)fx(F.x+rr(-.3,.3),F.y+rr(.3,1.6),F.z+rr(-.3,.3),pick(['#ff7a1a','#ffd23f','#ff3a1a']),1,1,.5,.1,-2);
  if(F.alive){if(F.netPsn)dotFx(F,'psn',dt);if(F.netBld)dotFx(F,'bld',dt)}}}
// ---------------- 画面 ----------------
// つながらなかったわけ（room がもらえないとき）：claude.ai の外・許可がオフ・それ以外（ログインしていない／公開リンクで開いた／招待されていない）
async function netWhy(C){if(!C)return'nohost';try{const P=await C.use('permissions');if(P){NET.perm=P;return await P.state('room')}}catch(e){}return'unavailable'}
const NET_HOWTO='オンライン対戦できるのは、claude.ai にログインして、このアーティファクトを作った人の組織のメンバーか、作った人に共有メニューで招待されたアカウントで開いたときです。だれでも見られる公開リンクから開いた人や、ログインしていない人はオンラインに入れません（CPU とは遊べます）。';
function renderNet(){const e=$('netState');if(!e)return;let t='';const fix=$('netFix'),bad=NET.st==='none'||NET.st==='err';if(fix){fix.style.display=bad?'':'none';$('netPerm').style.display=bad&&NET.perm?'':'none'}for(const b of['rMake','rMakeDm'])if($(b))$(b).disabled=NET.st!=='ok';
  if(NET.st==='wait')t='オンラインに接続しています…';
  else if(NET.st==='none')t=NET.why==='nohost'?'このページは claude.ai の外で開かれています。claude.ai でアーティファクトを開くとオンライン対戦できます（CPU とは遊べます）。':NET.why==='denied'?'このアーティファクトのオンライン（ほかの人とつながる機能）の許可がオフになっています。「許可の設定を開く」からオンにしてください。':'この画面ではオンラインに入れませんでした。\n'+NET_HOWTO;
  if(NET.st==='none'&&NET.diag)t+='\n（'+NET.diag+'）';
  else if(NET.st==='err')t=NET.errMsg;
  else if(NET.st==='ok')t=NET.conn?'🟢 接続中・このページを開いている人：'+NET.lobby.filter(p=>p.kind==='viewer').length+'人\n参加できるのは、claude.ai にログインしてこのアーティファクトを開ける人（作った人の組織のメンバーか招待された人）です。':performance.now()-(NET.okT||0)>8000?'🟡 オンラインのサーバーにつながりません。\n学校や会社のネットワークや、アプリの中のブラウザ（フィルターつきのブラウザなど）では、オンラインの通信がふさがれて、つながらないことがあります。Safari や Chrome、Claude アプリで開くか、別のネットワーク（家の Wi-Fi など）で試してください。':'🟡 接続を待っています…';
  e.textContent=t;e.style.whiteSpace='pre-line';for(const b of['rMake','rMakeDm'])$(b).disabled=NET.st!=='ok';$('roomIn').disabled=NET.st!=='ok'}
function renderRooms(){renderNet();const L=$('rlist');if(!L)return;L.textContent='';const rs=NET.st==='ok'?roomList():[];
  if(!rs.length){const d=document.createElement('div');d.className='note';d.style.textAlign='center';d.textContent=NET.st==='ok'?'まだ部屋がありません。部屋を作って相手を待とう！':'—';L.appendChild(d);return}
  for(const r of rs){const d=document.createElement('div');d.className='ri';const b=document.createElement('b');b.textContent=(r.md==='dm'?'【デスマッチ '+r.np+'/'+CAP.dm+'人】':'【1対1】')+r.t;const s=document.createElement('small');s.textContent='ホスト：'+r.n+(r.mine?'（あなたの別のタブ）':'')+(r.guest?'（ゲスト）':'');
    const box=document.createElement('div');box.style.flex='1';box.appendChild(b);box.appendChild(document.createElement('br'));box.appendChild(s);const j=document.createElement('button');j.className='pb b';j.style.minWidth='90px';j.style.padding='6px 12px';j.textContent='参加';
    j.onclick=()=>{SFX.click();enterRoom(r.c,false,r.t,r.md)};d.appendChild(box);d.appendChild(j);L.appendChild(d)}}
function showRooms(){showScr('sRooms');netInit();lobbyPresence(true);renderRooms()}
// 待合室：1対1は表彰台、デスマッチは参加者の一覧（ホストは「スタート」）
function showWait(){showScr('sWait');const os=others(),dm=NET.md==='dm';$('wPod').style.display=dm?'none':'';$('wList').style.display=dm?'':'none';$('wStart').style.display=dm&&NET.host?'':'none';
  if(dm){const L=$('wList');L.textContent='';const going=NET.hostP&&(NET.hostP.presence.ph==='count'||NET.hostP.presence.ph==='play');
    for(const [n,me] of[[SV.name,true]].concat(os.map(p=>[p.presence.n,false]))){const d=document.createElement('div');d.className='wl'+(me?' me':'');d.textContent=(cleanName(n)||'???')+(me?'（あなた）':'');L.appendChild(d)}
    $('wTitle').textContent='デスマッチ（'+(os.length+1)+'/'+CAP.dm+'人）';$('wStart').disabled=!os.some(p=>wantsIn(p.presence));
    $('wNote').textContent=NET.host?'人が集まったら「スタート」。試合中に来た人も、とちゅうから入れます。':going?'試合中です。まもなく参加します…':'ホストがスタートするのを待っています…';return}
  const o=os[0]&&os[0].presence;$('podAn').textContent=cleanName(SV.name);drawPodium($('podA'),SV.skin,SV.weapon);
  if(o){$('podBn').textContent=cleanName(o.n)||'???';drawPodium($('podB'),(o.sk|0)%6,MELEE.includes(o.wm)?o.wm:'fists')}else{$('podBn').textContent='？？？';$('podB').getContext('2d').clearRect(0,0,60,85)}
  $('wTitle').textContent=o?'まもなく対戦がはじまります':'対戦相手を待っています…';
  $('wNote').textContent=(NET.host?'部屋「'+NET.title+'」を作りました。'+(o?'':'相手がこの部屋に入るのを待っています。'):'部屋「'+NET.title+'」に入りました。'+(o?'':'ホストを待っています…'))+(o&&!wantsIn(o)&&NET.rd>0?'（相手が「もう一度」をおすのを待っています）':'')}
// ページを閉じたら部屋を出る（ランチャーで別のゲームに切りかえたときも）
addEventListener('pagehide',()=>{try{NET.gunsub.forEach(u=>u());NET.unsub.forEach(u=>u());if(NET.game)NET.game.leave().catch(()=>{});if(NET.room)NET.room.presence({pd:null}).catch(()=>{})}catch(e){}});
