// ================= オンライン募集・対戦（アーティファクトの room。presence だけで同期する） =================
// ・ロビー（room 本体）の presence に {gr:{n,c,f,r,np,st}} を出して「募集中の部屋」の一覧にする（ホストだけ）
// ・部屋は room.join('gr-xxxxxx')。閲覧者はイベントを送れないので presence だけで同期する。presence は 4KiB までなので試合の様子は整数につめて送る
//   みんな：名前（n）・キャラ（bt）・パワー（lv）・スキン（sk）・装備（k）・入力（i：移動・ねらい・押しっぱなし・ボタンの命令）
//   ホスト：段階（ph）・試合の番号（rd）・形式（f：1v1/2v2/3v3/coop/br）・ルール（ru）・マップ（mp）・参加者（pl：試合の始めだけ）・試合の様子（S）
// ・試合の計算はホストだけがする（当たり判定もホスト）。ゲストは入力を送り、ホストの S を見て画面を作る
// ・赤チームのゲストは画面を180度まわして、自分のチームが下（青）に見えるようにする（マップは点対称）
const NET={st:'off',room:null,game:null,code:'',host:false,fmt:'3v3',rule:'gem',myPeer:'',lobby:[],gpeers:[],unsub:[],gunsub:[],conn:false,
  rd:0,ph:'wait',pl:[],mp:'',ru:'gem',sendT:0,cseq:0,cmds:[],hold:0,on:false,view:false,flip:false,hostP:null,joinT:0,npSent:-1,lastS:null,ex:[],exSeq:0,seenEx:0,
  gl:[],glSeq:0,seenG:0,shadow:null,seen:{},startT:0,myTeam:0,snapN:0,bots:null,botsIn:null};
const NET_FMT={'1v1':{name:'1対1',cap:2,n:1},'2v2':{name:'2対2',cap:4,n:2},'3v3':{name:'3対3',cap:6,n:3},coop:{name:'みんなでCPUと',cap:3,n:3},br:{name:'バトルロイヤル',cap:6,n:1}};
const NET_RULES=['gem','ball','heist','hotzone','bounty','knockout'],CODE_GR=/^gr-[a-z0-9]{6}$/;
const netFmtOk=f=>Object.prototype.hasOwnProperty.call(NET_FMT,f)?f:'3v3',netRuleOk=(f,r)=>f==='br'?'br':NET_RULES.includes(r)?r:'gem';
const netName=()=>cleanN(LS('gr-name','')||'プレイヤー'),cleanN=s=>String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿<>]/g,'').trim().slice(0,12);
const netTitle=(f,r)=>NET_FMT[f].name+(f==='br'?'':'・'+MODES[r].name);
function claudeObj(){try{if(window.claude&&window.claude.use)return window.claude}catch(e){}try{if(window.parent&&window.parent!==window&&window.parent.claude&&window.parent.claude.use)return window.parent.claude}catch(e){}return null}
async function netWhy(C){if(!C)return'nohost';try{const P=await C.use('permissions');if(P)return await P.state('room')}catch(e){}return'unavailable'}
async function netInit(){if(NET.room||NET.st==='wait')return;NET.st='wait';netRender();const C=claudeObj();let room=null;if(C){try{room=await C.use('room')}catch(e){room=null}}
  if(!room){NET.st='none';NET.why=await netWhy(C);netRender();return}NET.room=room;NET.st='ok';NET.conn=room.connected?room.connected():true;NET.okT=performance.now();setTimeout(netRender,8200);
  NET.unsub.push(room.onPeers(ch=>{NET.lobby=ch.peers;netRender()},e=>netErr(e)));if(room.onConnection)NET.unsub.push(room.onConnection(c=>{NET.conn=c;netRender()},e=>netErr(e)));netLobby();netRender()}
function netErr(e,inGame){const c=e&&e.code;if(inGame&&NET.game){netLeave(true);note('部屋との接続が切れました',3)}if(['revoked','not_granted','capability_disabled','capability_removed'].includes(c)){NET.st='err';NET.errMsg='オンラインが切れました（'+c+'）。アーティファクトを開き直してください。';netRender()}}
const netOthers=()=>NET.gpeers.filter(p=>!p.sameTab&&p.kind==='viewer'&&p.presence&&typeof p.presence.n==='string');
function netLobby(){if(!NET.room)return;const np=NET.game?netOthers().length+1:0;NET.npSent=np;
  const gr=NET.game&&NET.host?{n:netName(),c:NET.code,f:NET.fmt,r:NET.rule,np,st:NET.ph==='wait'&&np<NET_FMT[NET.fmt].cap?'wait':NET.ph==='wait'?'full':'play'}:null;NET.room.presence({gr}).catch(()=>{})}
function netRooms(){const out=[];for(const p of NET.lobby){if(p.sameTab||p.kind!=='viewer')continue;const g=p.presence&&p.presence.gr;if(!g||typeof g!=='object'||typeof g.c!=='string'||!CODE_GR.test(g.c))continue;
  const f=netFmtOk(g.f);out.push({c:g.c,n:cleanN(g.n)||'???',f,r:netRuleOk(f,g.r),np:clamp(g.np|0,1,NET_FMT[f].cap),st:['wait','full','play'].includes(g.st)?g.st:'play',mine:p.isMe})}
  return out.sort((a,b)=>(a.st==='wait'?0:1)-(b.st==='wait'?0:1))}
// ---- 部屋を作る・入る・出る ----
async function netCreate(){if(!NET.room||!NET.conn){note('まだオンラインにつながっていません',2.5);return}const code='gr-'+Array.from({length:6},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[Math.random()*36|0]).join('');await netEnter(code,true,NET.fmt,NET.rule)}
async function netEnter(code,host,fmt,rule){if(NET.game)await netLeave(true);let g=null;try{g=await NET.room.join(code)}catch(e){note(e&&e.code==='limit_reached'?'今は部屋に入れません。少し待ってからもう一度':'部屋に入れませんでした',3);return}
  const f=netFmtOk(fmt);Object.assign(NET,{game:g,code,host,fmt:f,rule:netRuleOk(f,rule),rd:0,ph:'wait',pl:[],hostP:null,joinT:performance.now(),lastS:null,cmds:[],cseq:0,seen:{},ex:[],seenEx:0,gl:[],seenG:0});
  NET.gunsub=[g.onPeers(ch=>{NET.gpeers=ch.peers;netPeers()},e=>netErr(e,true))];netSend();netLobby();netRender()}
async function netLeave(silent){const g=NET.game;NET.gunsub.forEach(u=>{try{u()}catch(e){}});NET.gunsub=[];NET.game=null;NET.code='';NET.pl=[];NET.hostP=null;NET.ph='wait';NET.host=false;
  if(NET.on){NET.on=false;NET.view=false;NET.flip=false;netClearProps();if(G.state!=='menu'&&G.state!=='result'){$('pause').classList.remove('on');clearMatch();showMenu()}}if(g){try{await g.leave()}catch(e){}}netLobby();if(!silent)netRender()}
// ---- 自分の presence ----
const kitPack=k=>[k.gad,k.sp,k.hyper?1:0,(k.buf&&k.buf.gad?1:0)|(k.buf&&k.buf.sp?2:0)|(k.buf&&k.buf.hyper?4:0)];
const kitUnpack=a=>Array.isArray(a)?{gad:clamp(a[0]|0,-1,1),sp:clamp(a[1]|0,-1,1),gears:[],hyper:!!a[2],buf:{gad:!!(a[3]&1),sp:!!(a[3]&2),hyper:!!(a[3]&4)}}:{gad:-1,sp:-1,gears:[],hyper:false,buf:{}};
const nq=(v,k)=>Math.round((+v||0)*k),FA=a=>NET.flip?a+Math.PI:a,FV=v=>NET.flip?-v:v;
function netState(){const u=G.me;const p={n:netName(),bt:PICK,lv:level(PICK),sk:skinOf(PICK).id,k:kitPack(myKit(PICK)),r:NET.rd,
    i:NET.view&&u?{mx:nq(FV(u.mx||0),100),mz:nq(FV(u.mz||0),100),a:nq(angd(FA(u.streamAng!=null&&NET.hold===1?u.streamAng:u.faceT||0)),100),h:NET.hold,c:NET.cmds}:null};
  if(NET.host){const early=NET.on&&performance.now()-NET.startT<7000;Object.assign(p,{ph:NET.ph,rd:NET.rd,f:NET.fmt,ru:NET.rule,mp:NET.mp,pl:early?NET.pl:null});
    if(NET.on){const lim=3850-JSON.stringify(p).length;p.S=netSnap(lim,early)}else p.S=null}
  return p}
function netSend(){if(!NET.game)return;NET.sendT=0;NET.game.presence(netState()).catch(e=>{if(e&&e.code==='invalid_argument')console.warn('net',e.message)})}
// ゲスト：ボタンを押した（ホストに命令として送る）
function netCmd(kind,ang,dist,auto){NET.cseq++;NET.cmds.push([NET.cseq,kind,nq(angd(FA(ang||0)),100),nq(dist,10),auto?1:0]);if(NET.cmds.length>6)NET.cmds.shift();netSend()}
// ---- 部屋の人が変わった ----
function netPeers(){const os=netOthers(),me=NET.gpeers.find(p=>p.sameTab);if(me)NET.myPeer=me.peer;
  if(!NET.host){const h=os.find(p=>typeof p.presence.ph==='string');
    if(!h){if(NET.hostP&&performance.now()-NET.joinT>1500){NET.hostP=null;netHostGone()}else if(!NET.hostP&&performance.now()-NET.joinT>12000){netLeave();note('部屋が見つかりませんでした',3)}}
    else{NET.hostP=h;netGuestFollow(h.presence)}}
  else{if(NET.on)for(const u of G.units)if(u.remote&&!os.some(p=>p.peer===u.remote)){u.remote=null;note(u.name+' が部屋を出ました（CPUが代わりに動きます）',2.5)}if(os.length+1!==NET.npSent)netLobby()}
  if(!NET.on)netRender()}
function netHostGone(){const was=NET.on;netLeave(true);note('ホストが部屋を出ました',3);if(!was)netRender()}
// ---- ホスト：試合を始める ----
function netStart(){if(!NET.host||NET.on)return;const F=NET_FMT[NET.fmt],os=netOthers().slice(0,F.cap-1);NET.rd++;
  const rule=NET.fmt==='br'?'br':NET.rule,ids=Object.keys(MAPS).filter(k=>MAPS[k].mode===MODES[rule].map);NET.mp=ids[Math.floor(Math.random()*ids.length)];NET.ru=rule;
  const hum=[{peer:NET.myPeer,bt:PICK,name:netName(),lv:level(PICK),sk:skinOf(PICK).id,k:kitPack(myKit(PICK))}].concat(os.map(p=>({peer:p.peer,bt:BT[p.presence.bt]?p.presence.bt:'rico',name:cleanN(p.presence.n)||'???',lv:clamp(p.presence.lv|0,1,MAXLV),sk:String(p.presence.sk||'base').slice(0,12),k:Array.isArray(p.presence.k)?p.presence.k.slice(0,4):[-1,-1,0,0]})));
  // チーム分け：対戦は交互（1チームの人数まで）、協力はみんな青、バトルロイヤルは1人ずつ
  const slot=[0,0];hum.forEach((h,i)=>{if(NET.fmt==='br'){h.team=i;return}let t=NET.fmt==='coop'?0:i%2;if(slot[t]>=F.n)t=1-t;h.team=t;slot[t]++});
  NET.pl=hum.map(h=>[h.peer,h.bt,h.team,h.name,h.lv,h.sk,h.k]);NET.ph='play';netStartLocal(true);netSend();netLobby()}
// 試合の準備（ホストもゲストも同じ参加者・同じマップ・同じ順番で作る）。ゲストはチームを入れかえて自分のチームを0（青）にする
function netStartLocal(asHost){initAudio();clearMatch();const mid=NET.mp,rule=NET.ru,br=rule==='br',F=NET_FMT[NET.fmt];
  G.rule=rule;G.mode=br?'br':'team';G.ranked=false;G.friendly=true;G.diff=.45;G.rpBefore=RPts();buildArena(mid,rule);hideScreens();$('netScr').classList.remove('on');document.body.classList.add('playing');document.body.classList.toggle('br',br);
  Object.assign(G,{t:0,mineT:3,time:150,cd:null,cdTeam:-1,state:'intro',introT:3.2,over:false,shake:0,endT:0,supWas:false,safeR:999,poisonT:0,place:0,brDead:0,specExit:0});
  const myT=asHost?0:(NET.pl.find(p=>p[0]===NET.myPeer)||[0,0,0])[2];NET.myTeam=myT;NET.flip=!asHost&&!br&&myT===1;
  const lt=t=>asHost?t:br?(t===myT?0:t===0?myT:t):(t===myT?0:1);NET.lt=lt;
  const n=br?1:F.n,cnt=[0,0],order=n===1?[1]:n===2?[0,2]:[1,0,2],names=BOTNAMES.slice().sort(()=>Math.random()-.5);
  // 位置はホストの世界で決めて、まわすゲストは裏返す
  const R0=HALFX*.88,pos=(t,i,k)=>{let x,z;if(br){const a=Math.PI/2+k/10*TAU;[x,z]=nearestOpen(Math.cos(a)*R0,Math.sin(a)*R0)}else{const [c,r]=SPAWN[t][order[Math.min(order.length-1,i)]];x=tx(c);z=tz(r)}return[FV(x),FV(z)]};
  let k=0;for(const p of NET.pl){const t=p[2],isMe=p[0]===NET.myPeer,bt=BT[p[1]]?p[1]:'rico',sk=SKINS[bt].find(s=>s.id===p[5])||null;
    const u=mkUnit(bt,lt(t),isMe,isMe?'あなた':p[3],pos(t,br?0:cnt[t]++,k++),p[4],sk&&sk.id!=='base'?sk:null,kitUnpack(p[6]));u.peer=p[0];if(asHost&&!isMe)u.remote=p[0];if(isMe)G.me=u;G.units.push(u)}
  // 足りない分はCPU（ホストが決めて、ゲストには S.bots で知らせる）
  if(asHost){const used=NET.pl.map(p=>p[1]),pick=()=>{const pool=BT_IDS.filter(i=>!used.includes(i)),b=pool[Math.floor(Math.random()*pool.length)]||'rico';used.push(b);return b};
    const addBot=t=>{const b=pick(),lv=clamp(Math.round(rr(7,11)),1,MAXLV),u=mkUnit(b,t,false,names[k%names.length],pos(t,br?0:cnt[t]++,k++),lv,botSkin(b),botKit(b,lv));G.units.push(u)};
    if(br){for(let t=NET.pl.length;t<10;t++)addBot(t)}else for(const t of[0,1])while(cnt[t]<n)addBot(t);
    NET.bots=G.units.filter(u=>!u.peer).map(u=>[u.bt,u.team,u.name,u.lv])}
  else for(const b of NET.botsIn||[]){if(!Array.isArray(b))continue;const t=b[1]|0,u=mkUnit(BT[b[0]]?b[0]:'rico',lt(t),false,cleanN(b[2])||'CPU',pos(t,br?0:cnt[t]++,k++),b[3]|0||1,null,{gad:-1,sp:-1,gears:[],hyper:false,buf:{}});G.units.push(u)}
  if(br){G.safeR=Math.hypot(HALFX,HALFZ)+2;G.alive=G.units.length}
  for(const u of G.units)mkLabel(u);G.time=MODES[rule].time||150;modeInit();ZOOM=1;camP.set(me().x,0,me().z);for(const u of G.units)u.tr=null;
  NET.on=true;NET.view=!asHost;NET.lastS=null;NET.startT=performance.now();NET.snapN=0;netClearProps();NET.cmds=[];NET.hold=0;NET.ex=[];NET.gl=[];NET.shadow=GRID.map(r=>r.slice());if(asHost)NET.seenEx=NET.seenG=0;
  G._vsNote='フレンドバトル・'+MAPS[mid].name;showVS(rule,mid)}
// ---- ゲスト：ホストについていく ----
function netGuestFollow(h){if(typeof h.rd!=='number')return;NET.fmt=netFmtOk(h.f);NET.rule=netRuleOk(NET.fmt,h.ru);const pl=Array.isArray(h.pl)?h.pl:null;
  if(h.ph==='play'&&pl&&h.rd>NET.rd&&h.S&&Array.isArray(h.S.bots)&&pl.some(p=>Array.isArray(p)&&p[0]===NET.myPeer)&&MAPS[h.mp]){
    NET.rd=h.rd;NET.pl=pl.filter(p=>Array.isArray(p)&&p.length>=7).slice(0,NET_FMT[NET.fmt].cap);NET.mp=h.mp;
    const mk=MAPS[h.mp].mode;NET.ru=NET.fmt==='br'||mk==='br'?'br':MODES[NET.rule]&&MODES[NET.rule].map===mk?NET.rule:mk==='ball'?'ball':mk==='heist'?'heist':'gem';
    NET.botsIn=h.S.bots;NET.seenEx=NET.seenG=0;netStartLocal(false)}
  if(NET.on&&NET.view&&h.rd===NET.rd&&h.S&&NET.lastS!==h.S&&G.state!=='result'){NET.lastS=h.S;try{netApplySnap(h.S)}catch(e){if(!netGuestFollow.err){netGuestFollow.err=1;console.error('net apply',e)}}}
  NET.ph=h.ph}
// ---- ホスト：試合の様子を 4KiB 以内にまとめる ----
const hexOf=c=>c&&c.isColor?c.getHex():Array.isArray(c)?((c[0]*255|0)<<16)|((c[1]*255|0)<<8)|(c[2]*255|0):c|0;
function netSnap(lim,early){const pc=[],ci=c=>{const h=hexOf(c);let i=pc.indexOf(h);if(i<0){i=pc.length;pc.push(h)}return i};NET.snapN++;
  const S={st:G.state,w:G.win==null?-2:G.win,tm:Math.round(G.time),cd:[G.cdTeam,nq(G.cd||0,10)],
  u:G.units.map(u=>[nq(u.x,10),nq(u.z,10),nq(angd(u.faceT!=null?u.faceT:u.face),50),Math.round(u.hp),Math.round(u.maxHp),nq(u.ammo,10),nq(u.sup,100),nq(u.hyp,100),
    (u.dead?1:0)|(u.inv>0?2:0)|(u.stunT>0?4:0)|(u.invisT>G.t?8:0)|(u.inBush?16:0)|(hyperOn(u)?32:0)|(u.flyT>G.t?128:0)|(u.ghostT>G.t?256:0)|(u.revealT>0?512:0)|(u.atkAnim>.5?1024:0)|(u.streaming?2048:0)|(u.charging?4096:0),
    FORMS[u.bt]?FORMS[u.bt].indexOf(u.form):0,nq(u.jy||0,10),u.gems|0,u.supLeft||0,Math.round(u.shield||0),Math.ceil(u.gadCD||0),nq(Math.max(0,u.hyperT-G.t),10),nq(u.charge||0,100),nq(u.rage||0,100),u.bounty|0,u.pw|0])};
  if(NET.snapN%4===1||G.over)S.k=G.units.map(u=>[u.kills|0,u.deaths|0,Math.round((u.dmg||0)/10),u.gemsGot|0,u.cubes|0]);
  const M2=G.M||{};
  if(G.rule==='ball'&&M2.ball){const b=M2.ball;S.M=[nq(b.x,10),nq(b.z,10),nq(b.h,10),b.carrier?G.units.indexOf(b.carrier):-1,M2.score[0],M2.score[1],M2.pause>0?1:0]}
  else if(G.rule==='hotzone'&&M2.pct){const c=M2.fill.material.color.getHex();S.M=[nq(M2.pct[0],10),nq(M2.pct[1],10),c===0x3aa0ff?1:c===0xff4d5a?2:0]}
  else if(G.rule==='bounty'&&M2.stars)S.M=[M2.stars[0],M2.stars[1]];
  else if(G.rule==='knockout'&&M2.rounds)S.M=[M2.rounds[0],M2.rounds[1],M2.round,M2.between>0?1:0,nq(Math.min(G.safeR,999),10)];
  else if(G.rule==='heist'&&G.safes)S.M=[0,1].map(t=>{const s=G.safes.find(q=>q.team===t);return s?Math.round(s.hp):0});
  else if(G.mode==='br')S.M=[nq(Math.min(G.safeR,999),10)];
  S.e=NET.ex.slice(-10);S.g=NET.gl.slice(-36);if(early)S.bots=NET.bots;
  S.b=G.bullets.slice(-36).map(b=>[nq(b.x,10),nq(b.z,10),nq(angd(Math.atan2(b.dx,b.dz)),50),b.stopped?0:nq(b.spd,10),nq(b.r||.2,100),ci(b.col)]);
  S.l=G.lobs.slice(-12).map(L=>[nq(L.x0,10),nq(L.z0,10),nq(L.x1,10),nq(L.z1,10),nq(Math.min(1,L.t/L.T),100),nq(L.T,10)]);
  S.z=G.zones.slice(-14).map(q=>[nq(q.x,10),nq(q.z,10),nq(q.rad,10),ci(q.m.material.color),Math.round(q.m.material.opacity*100)]);
  S.p=G.turrets.concat(G.pets,G.heads).slice(-16).map(t=>[nq(t.x,10),nq(t.z,10),t.legs?'legs':t.isHead?'head':t.bear?'bear':t.rat?'rat':t.decoy?'d:'+t.bt:t.scrappy?'scrappy':t.booster?'booster':t.station?'station':t.plant?'plant':t.post?'post':t.speaker?'speaker':t.totem?'totem':t.vend?'vend':t.barrel?'barrel':'tur',
    Math.round(t.hp),Math.round(t.maxHp),t.team,nq(angd(t.m&&t.m.g?t.m.g.rotation.y:0),50),t.noTarget?1:0]);
  S.it=G.items.slice(-30).map(g=>[['gem','cube','ammo','spirit'].indexOf(g.kind),nq(g.m.position.x,10),nq(g.m.position.z,10)]);
  S.m=G.mines.slice(-14).map(q=>[nq(q.x,10),nq(q.z,10),q.team,q.hide&&q.trig==null?1:0]).concat(BLOMBS.slice(-6).map(q=>[nq(q.x,10),nq(q.z,10),q.team,2]));
  S.pc=pc;
  // 大きすぎたら、見た目だけのものから減らす
  let js=JSON.stringify(S);for(const key of['b','z','it','p','l','m','e']){while(js.length>lim&&S[key].length){S[key].length=Math.floor(S[key].length*.6);js=JSON.stringify(S)}if(js.length<=lim)break}
  return S}
// 爆発などの見た目をゲストにも（ホストの explode・ring を記録する）
function netFx(type,x,z,rad,col){if(!NET.on||!NET.host)return;NET.exSeq++;NET.ex.push([NET.exSeq,type,nq(x,10),nq(z,10),nq(rad,10),hexOf(col)]);if(NET.ex.length>14)NET.ex.shift()}
// こわれた壁・生えた草むらなど：前のフレームとちがうマスを番号つきで記録
function netGridScan(){const sh=NET.shadow;if(!sh)return;for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){const b=GRID[r][c];if(sh[r][c]!==b){sh[r][c]=b;NET.glSeq++;NET.gl.push([NET.glSeq,c,r,b]);if(NET.gl.length>60)NET.gl.shift()}}}
// ---- 毎フレーム（ホストはシミュレーションの中、ゲストは netView から） ----
function netStep(dt){if(!NET.game){NET.on=false;return}NET.sendT+=dt;if(NET.host){netGridScan();if(NET.sendT>=.12)netSend();netHostInputs()}else if(NET.sendT>=.08)netSend()}
// ホスト：ゲストの入力を自分のゲームのキャラに入れる（先にボタンの命令、そのあと押しっぱなし）
function netHostInputs(){const os=netOthers();for(const u of G.units){if(!u.remote)continue;const p=os.find(q=>q.peer===u.remote);if(!p)continue;const o=p.presence,I=o&&o.i;if(!I||o.r!==NET.rd||typeof I!=='object')continue;
  const mx=(+I.mx||0)/100,mz=(+I.mz||0)/100,n=Math.hypot(mx,mz);u.mx=n>1?mx/n:mx;u.mz=n>1?mz/n:mz;
  const last=NET.seen[u.remote]||0;if(Array.isArray(I.c))for(const c of I.c.slice(-6)){if(!Array.isArray(c)||!(c[0]>last)||c[0]>last+50)continue;NET.seen[u.remote]=c[0];const a=(+c[2]||0)/100,d=clamp((+c[3]||0)/10,0,40);
    if(c[1]==='a')attack(u,a,d);else if(c[1]==='s')superAtk(u,a,d,!!c[4]);else if(c[1]==='g')gadget(u,a);else if(c[1]==='h')hyperGo(u)}
  const a=(+I.a||0)/100;if(I.h===1){u.streamAng=a;u.faceT=a;streamStart(u)}else if(u.streaming)streamStop(u);
  if(I.h===2){if(!u.charging)chargeStart(u);u.faceT=a}else if(u.charging){u.charging=false;u.charge=0}}}
// ---- ゲスト：ホストの S を画面に出す ----
const NETGEO={b:new THREE.SphereGeometry(1,8,6),lob:new THREE.SphereGeometry(.28,8,6),mine:new THREE.SphereGeometry(.24,8,6)};
const NP=v=>FV(v/10),NA=a=>FA(a/50);
function netApplySnap(S){if(!Array.isArray(S.u))return;const lt=NET.lt||(t=>t),pc=Array.isArray(S.pc)?S.pc:[],col=i=>pc[i]|0,br=G.mode==='br';
  S.u.forEach((a,i)=>{const u=G.units[i];if(!u||!Array.isArray(a))return;const f=a[8]|0,dead=!!(f&1);if(u._nh!=null&&a[3]<u._nh&&!dead)dmgNum(u,u._nh-a[3],u.isMe?'me':'');u._nh=a[3];
    u.nx=NP(a[0]);u.nz=NP(a[1]);u.nf=NA(a[2]);u.hp=a[3];u.maxHp=a[4];u.ammo=a[5]/10;u.sup=a[6]/100;u.hyp=a[7]/100;
    if(dead&&!u.dead){burst(u.x,1,u.z,26,u.team===0?[.35,.65,1]:[1,.35,.4],7,.7,.8,true);SFX.die();if(u.isMe)note('やられた…',2)}if(!dead&&u.dead){u.x=u.nx;u.z=u.nz}u.dead=dead;
    u.inv=f&2?1:0;u.stunT=f&4?.2:0;u.invisT=f&8?G.t+1:0;u.inBush=!!(f&16);u.hyperT=f&32?G.t+(a[15]/10||.2):-9;u.flyT=f&128?G.t+.3:0;u.ghostT=f&256?G.t+.3:0;u.revealT=f&512?.5:0;if(f&1024)u.atkAnim=1;u.streaming=!!(f&2048);if(!u.isMe)u.charging=!!(f&4096);
    const fm=FORMS[u.bt];if(fm&&fm[a[9]]&&u.form!==fm[a[9]]){setForm(u,fm[a[9]],true);u.hp=a[3]}u.jy=a[10]/10;u.gems=a[11];u.supLeft=a[12];u.shield=a[13];u.gadCD=a[14];u.charge=a[16]/100;u.rage=a[17]/100;u.bounty=a[18];u.pw=a[19]});
  if(Array.isArray(S.k))S.k.forEach((a,i)=>{const u=G.units[i];if(!u||!Array.isArray(a))return;u.kills=a[0];u.deaths=a[1];u.dmg=a[2]*10;u.gemsGot=a[3];u.cubes=a[4]});
  G.time=+S.tm||0;G.cdTeam=Array.isArray(S.cd)&&S.cd[0]>=0?lt(S.cd[0]):-1;G.cd=Array.isArray(S.cd)?(+S.cd[1]||0)/10:0;
  // ルールごとの様子
  const M2=G.M,A=Array.isArray(S.M)?S.M:null,sw=v=>NET.myTeam===1&&!br?[v[1],v[0]]:v;
  if(A&&G.rule==='ball'&&M2.ball){const b=M2.ball;b.x=NP(A[0]);b.z=NP(A[1]);b.h=A[2]/10;b.carrier=A[3]>=0?G.units[A[3]]||null:null;const sc=sw([A[4],A[5]]);if(M2.score&&(sc[0]>M2.score[0]||sc[1]>M2.score[1])){const w=sc[0]>M2.score[0]?0:1;big(w===0?'青チームのゴール！':'赤チームのゴール！',2,w===0?'#8cc8ff':'#ff9aa2');SFX.end(w===0)}M2.score=sc;b.m.position.set(b.x,.42+b.h,b.z)}
  if(A&&G.rule==='hotzone'&&M2.pct){M2.pct=sw([A[0]/10,A[1]/10]);const c=A[2]===0?0xffa53d:lt(A[2]-1)===0?0x3aa0ff:0xff4d5a;M2.fill.material.color.setHex(c)}
  if(A&&G.rule==='bounty'&&M2.stars)M2.stars=sw([A[0],A[1]]);
  if(A&&G.rule==='knockout'&&M2.rounds){const r=sw([A[0],A[1]]);if(r[0]>M2.rounds[0]||r[1]>M2.rounds[1]){const w=r[0]>M2.rounds[0]?0:1;big(w===0?'ラウンド勝利！':'ラウンド負け…',2,w===0?'#8cc8ff':'#ff9aa2')}if(A[2]>M2.round)big('ラウンド '+A[2],1.3);M2.rounds=r;M2.round=A[2];G.safeR=A[4]/10;POISON.material.uniforms.R.value=G.safeR}
  if(A&&G.rule==='heist'&&G.safes)[0,1].forEach(t=>{const s=G.safes.find(q=>q.team===lt(t));if(s){s.hp=A[t];updLabel(s)}});
  if(A&&br){G.safeR=A[0]/10;POISON.material.uniforms.R.value=G.safeR}
  // 試合の段階
  if(S.st==='play'&&(G.state==='vs'||G.state==='intro')){$('vs').classList.remove('on');G.state='play'}
  if((S.st==='end'||S.st==='result')&&!G.over){if(br){if(!G.me.dead)G.place=1;else if(!G.place)G.place=G.units.filter(o=>!o.dead).length+1;endMatch(G.me.dead?-1:0)}else{const w=S.w|0;endMatch(w<0?-1:lt(w))}}
  // 爆発など
  if(Array.isArray(S.e))for(const e of S.e){if(!Array.isArray(e)||!(e[0]>NET.seenEx))continue;NET.seenEx=e[0];const x=NP(e[2]),z=NP(e[3]),rad=e[4]/10,c=e[5]|0;
    if(e[1]===1){ring(x,z,rad,0xffc070,.35);burst(x,.6,z,20,[1,.62,.25],rad*2.4,.9,.55,true);SFX.boom(rad>4)}else ring(x,z,rad,c||0xffffff,.3)}
  // こわれた壁・草むら（番号つきで順番に）
  if(Array.isArray(S.g))for(const g of S.g){if(!Array.isArray(g)||!(g[0]>NET.seenG))continue;NET.seenG=g[0];let c=g[1]|0,r=g[2]|0;const ch=String(g[3]||'.');if(NET.flip){c=MW-1-c;r=MH-1-r}netCell(c,r,ch)}
  netSyncProps(S,col)}
function netCell(c,r,ch){if(c<0||r<0||c>=MW||r>=MH)return;const cur=GRID[r][c],k=c+','+r;if(cur===ch)return;
  if(cur==='#'){breakWall(c,r);GRID[r][c]=ch;return}
  if(cur==='X'||cur==='F'){if(BOXM[k]){ARENA.remove(BOXM[k]);delete BOXM[k]}GRID[r][c]=ch;burst(tx(c),.6,tz(r),16,[.7,.5,.3],5,.5,.9);return}
  if(cur==='B'){burnBush(c,r);GRID[r][c]=ch;return}
  if(ch==='B'){growOne(c,r);return}GRID[r][c]=ch}
// 草むらを1マスだけ生やす（ゲスト用）
function growOne(c,r){GRID[r][c]='B';const g=new THREE.Group();g.userData.m=[];const d=new THREE.Mesh(BUSHDOME,bushMat2);g.add(d);const bl=new THREE.Mesh(BUSHGEO[(c+r)%4],bushMat);g.add(bl);g.userData.m.push(bl,d);g.userData.ph=hash2(c+3,r+7)*TAU;g.position.set(tx(c),0,tz(r));ARENA.add(g);const k=c+','+r;BUSH[k]=g;BUSHL.push(g)}
// 弾・投げ物・エリア・スポーン物・アイテム・地雷のメッシュを S に合わせる
const NETPOOLS=['pb','pl2','pz','pp','pi','pm'];
function netClearProps(){for(const key of NETPOOLS){for(const o of NET[key]||[]){scene.remove(o.m);if(o.lab)o.lab.d.remove()}NET[key]=[]}}
function netSyncProps(S,col){const lt=NET.lt||(t=>t);
  const sync=(key,list,mk,set)=>{const pool=NET[key]||(NET[key]=[]);while(pool.length<list.length){const o=mk();scene.add(o.m);pool.push(o)}while(pool.length>list.length){const o=pool.pop();scene.remove(o.m);if(o.lab)o.lab.d.remove()}list.forEach((a,i)=>{if(Array.isArray(a))set(pool[i],a)})};
  sync('pb',Array.isArray(S.b)?S.b:[],()=>({m:new THREE.Mesh(NETGEO.b,new THREE.MeshBasicMaterial({color:0xffffff}))}),(o,a)=>{o.x=NP(a[0]);o.z=NP(a[1]);const an=NA(a[2]);o.dx=Math.sin(an);o.dz=Math.cos(an);o.spd=a[3]/10;o.m.scale.setScalar(Math.max(.1,a[4]/100));o.m.material.color.setHex(col(a[5]));o.m.position.set(o.x,1,o.z)});
  sync('pl2',Array.isArray(S.l)?S.l:[],()=>({m:new THREE.Mesh(NETGEO.lob,GMAT.bomb)}),(o,a)=>{o.a=[NP(a[0]),NP(a[1]),NP(a[2]),NP(a[3])];o.k=a[4]/100;o.T=a[5]/10});
  sync('pz',Array.isArray(S.z)?S.z:[],()=>{const m=new THREE.Mesh(fireGeo,new THREE.MeshBasicMaterial({transparent:true,opacity:.4,depthWrite:false}));m.renderOrder=2;return{m}},(o,a)=>{o.m.position.set(NP(a[0]),.09,NP(a[1]));o.m.scale.setScalar(a[2]/10);o.m.material.color.setHex(col(a[3]));o.m.material.opacity=(a[4]||40)/100});
  sync('pp',Array.isArray(S.p)?S.p:[],()=>({m:new THREE.Group(),kind:''}),(o,a)=>{const kind=String(a[2]),tm=lt(a[5]|0);if(o.kind!==kind||o.tm!==tm){o.kind=kind;o.tm=tm;o.m.clear();o.m.add(netPropModel(kind,tm));if(o.lab){o.lab.d.remove();o.lab=null;o.u=null}
      if(!a[7]){o.u={name:'',team:tm,isTurret:true,hp:a[3],maxHp:a[4],gems:0,pw:0,lv:1,m:{g:o.m},x:0,z:0};mkLabel(o.u);o.lab=o.u.lab}}
    const x=NP(a[0]),z=NP(a[1]);o.m.position.set(x,0,z);o.m.rotation.y=NA(a[6]);if(o.u){o.u.hp=a[3];o.u.maxHp=a[4];o.u.x=x;o.u.z=z;o.u.dead=false}});
  sync('pi',Array.isArray(S.it)?S.it:[],()=>({m:new THREE.Group(),ph:rr(0,TAU),kind:-1}),(o,a)=>{const k=a[0]|0;if(o.kind!==k){o.kind=k;o.m.clear();o.m.add(itemMesh(['gem','cube','ammo','spirit'][k]||'gem'))}o.x=NP(a[1]);o.z=NP(a[2])});
  sync('pm',Array.isArray(S.m)?S.m:[],()=>({m:new THREE.Mesh(NETGEO.mine,GMAT.mine)}),(o,a)=>{o.m.position.set(NP(a[0]),a[3]===2?1:.2,NP(a[1]));o.m.visible=!(a[3]===1&&lt(a[2])!==0);o.m.material=a[3]===2?blombMat:GMAT.mine})}
// スポーン物の見た目（ゲスト用・かんたんな形）
function netPropModel(kind,team){const g=new THREE.Group(),c=team===0?0x3aa0ff:0xff4d5a,add=(geo,col,y)=>{const m=new THREE.Mesh(geo,MC(col));m.position.y=y;m.castShadow=true;g.add(m);return m};
  try{if(kind==='bear'){const b=mkBear(team,false);scene.remove(b);return b}
    if(kind.startsWith('d:')){const bt=kind.slice(2);if(BT[bt]){const m=mkModel(bt,c,false,null);scene.remove(m.g);return m.g}}
    if(kind==='legs'){const m=mkModel('rt',c,false,null,'legs');scene.remove(m.g);return m.g}}catch(e){}
  if(kind==='rat'){add(new THREE.SphereGeometry(.32,10,8),0x9aa3b5,.3).scale.set(1,.7,1.4);return g}
  if(kind==='head'){add(new THREE.SphereGeometry(.5,12,10),0x5a6070,.55);return g}
  if(kind==='post'){add(GEO.post,0x8a5a33,.6);add(new THREE.BoxGeometry(.5,.2,.5),0xffd24d,1.25);return g}
  const col={scrappy:0xe07a2e,booster:0x6a4fd6,station:0xf2eee4,plant:0x5cb83a,speaker:0x2b2d36,totem:0xc9563a,vend:0xd84040,barrel:0x8a5a33}[kind]||0x5a5f6e;
  add(new THREE.CylinderGeometry(.5,.62,.5,10),0x5a5f6e,.25);add(new THREE.BoxGeometry(.7,.6,.7),col,.85);const rg=new THREE.RingGeometry(.75,.9,24);rg.rotateX(-Math.PI/2);const r=new THREE.Mesh(rg,MB(c,{transparent:true,opacity:.7,depthWrite:false}));r.position.y=.05;g.add(r);return g}
// ゲスト：毎フレーム（シミュレーションのかわりに）
function netView(dt){const u=G.me;if(!u)return;G.t+=dt;updTimers();if(!G.over)playerInput(dt);else showAim(null);netStep(dt);
  // なめらかに：前の位置から新しい位置へ
  const k=1-Math.exp(-dt*14);for(const v of G.units){if(v.nx==null)continue;const ox=v.x,oz=v.z;v.x=lerp(v.x,v.nx,k);v.z=lerp(v.z,v.nz,k);v.faceT=v.nf;v.vx=(v.x-ox)/Math.max(dt,1e-4);v.vz=(v.z-oz)/Math.max(dt,1e-4)}
  for(const o of NET.pb||[]){o.x+=o.dx*o.spd*dt;o.z+=o.dz*o.spd*dt;o.m.position.set(o.x,1,o.z)}
  for(const o of NET.pl2||[]){const a=o.a;o.k=Math.min(1,o.k+dt/Math.max(.1,o.T));const h=Math.max(2.6,Math.hypot(a[2]-a[0],a[3]-a[1])*.32);o.m.position.set(lerp(a[0],a[2],o.k),1+Math.sin(o.k*Math.PI)*h,lerp(a[1],a[3],o.k))}
  for(const o of NET.pi||[]){o.m.position.set(o.x,(o.kind===0?1:.55)+Math.sin(G.t*3+o.ph)*.15,o.z);o.m.rotation.y+=dt*2.2}
  for(const o of NET.pp||[])if(o.u)updLabel(o.u);
  if(G.rule==='ball'&&G.M.ball){const b=G.M.ball;if(b.carrier){const c=b.carrier,f=c.faceT||0;b.x=c.x+Math.sin(f)*.75;b.z=c.z+Math.cos(f)*.75}b.m.position.set(b.x,.42+b.h,b.z)}
  // バトルロイヤル：自分がやられたら順位を決める（ホストの試合はそのまま続く）
  if(G.mode==='br'&&!G.over){const alive=G.units.filter(o=>!o.dead);if(u.dead){if(!G.brDead){G.brDead=1;G.place=alive.length+1;$('big').style.display='none'}if(G.specExit)endMatch(-1)}}
  if(G.state==='end'){G.endT-=dt;if(G.endT<=0)showResult()}}
// ---- ゲストの操作はホストへの命令に・ホストの爆発は記録・オンライン中は止めない ----
{const guest=u=>NET.view&&u&&u.isMe;
  const _a=attack;attack=function(u,ang,dist){if(guest(u)){if(G.over||u.dead||u.stunT>0)return false;const h=curAtk(u).hold;if(!h&&u.ammo<1)return false;if(h==='charge'){u.charging=false;NET.hold=0}netCmd('a',ang,dist);u.face=u.faceT=ang;u.atkAnim=1;return true}return _a.apply(this,arguments)};
  const _s=superAtk;superAtk=function(u,ang,dist,auto){if(guest(u)){if(G.over||u.dead||!supReady(u))return false;netCmd('s',ang,dist,auto);SFX.superReady();return true}return _s.apply(this,arguments)};
  const _g=gadget;gadget=function(u,ang){if(guest(u)){if(G.over||u.dead||!u.kit||u.kit.gad<0||u.gadCD>0)return false;netCmd('g',ang!=null?ang:u.faceT||0,0);return true}return _g.apply(this,arguments)};
  const _h=hyperGo;hyperGo=function(u){if(guest(u)){if(u.dead||!u.kit||!u.kit.hyper||u.hyp<1)return false;netCmd('h',0,0);return true}return _h.apply(this,arguments)};
  const _ss=streamStart;streamStart=function(u){if(guest(u)){if(curAtk(u).hold!=='stream'||u.dead)return false;NET.hold=1;u.streaming=true;return true}return _ss.apply(this,arguments)};
  const _st=streamStop;streamStop=function(u){if(guest(u)){if(NET.hold===1)NET.hold=0;u.streaming=false;return}return _st.apply(this,arguments)};
  const _cs=chargeStart;chargeStart=function(u){if(guest(u)){if(curAtk(u).hold!=='charge'||u.dead)return false;NET.hold=2;u.charging=true;return true}return _cs.apply(this,arguments)};
  const _ai=aiAct;aiAct=function(u,dt){if(u.remote)return;return _ai(u,dt)};
  const _ex=explode;explode=function(x,z,o){if(NET.on&&NET.host)netFx(1,x,z,o&&o.rad||2,0);NET._inEx=1;try{return _ex.apply(this,arguments)}finally{NET._inEx=0}};
  const _rg=ring;ring=function(x,z,r,c,T){if(NET.on&&NET.host&&!NET._inEx)netFx(2,x,z,r,c);return _rg.apply(this,arguments)};
  const _sp=setPause;setPause=function(on){if(NET.on){$('pause').classList.toggle('on',!!on);paused=false;return}return _sp(on)};
  const _sr=showResult;showResult=function(){const was=NET.on;_sr();if(!NET.game||!was)return;NET.on=false;NET.view=false;NET.flip=false;netClearProps();if(NET.host){NET.ph='wait';netSend();netLobby()}
    $('againBtn').innerHTML='<span class="tx">'+(NET.host?'もう一度（同じ部屋で）':'ホストを待っています…')+'</span>';$('againBtn').disabled=!NET.host;$('againBtn').style.display='';$('toMenu').innerHTML='<span class="tx">部屋にもどる</span>'};
  // 結果画面・一時停止のボタン（オンラインの部屋にいるとき）
  $('result').addEventListener('click',e=>{if(!NET.game)return;if(e.target.closest('#againBtn')){e.stopPropagation();if(NET.host)netStart()}else if(e.target.closest('#toMenu')){e.stopPropagation();clearMatch();openNet()}},true);
  $('pause').addEventListener('click',e=>{if(NET.on&&e.target.closest('#pzQuit')){e.stopPropagation();$('pause').classList.remove('on');netLeave()}},true)}
// ---- 画面（オンライン募集）----
let NETSEL={fmt:netFmtOk(LS('gr-nf','3v3')),rule:'gem'};NETSEL.rule=netRuleOk(NETSEL.fmt,LS('gr-nr','gem'));
function openNet(){hideScreens();$('netScr').classList.add('on');$('menu').style.visibility='hidden';$('netNameIn').value=LS('gr-name','');netInit();netRender()}
function closeNet(){$('netScr').classList.remove('on');$('menu').style.visibility='';showMenu()}
function netChips(inRoom){const f=inRoom?NET.fmt:NETSEL.fmt,r=inRoom?NET.rule:NETSEL.rule,dis=inRoom&&!NET.host;
  return `<div class="nChips">${Object.entries(NET_FMT).map(([k,v])=>`<button class="nChip${k===f?' on':''}" data-f="${k}" ${dis?'disabled':''}><b>${v.name}</b><small>${v.cap}人まで</small></button>`).join('')}</div>`+
   (f==='br'?'':`<div class="nChips m">${NET_RULES.map(k=>`<button class="nChip md${k===r?' on':''}" data-r="${k}" ${dis?'disabled':''} style="--mc:${MODECOL[k]}"><span class="mi">${modeIcon(k)}</span><b>${MODES[k].name}</b></button>`).join('')}</div>`)}
function netPick(el,inRoom){el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const f=b.dataset.f;if(inRoom){if(!NET.host)return;if(netOthers().length+1>NET_FMT[f].cap){note('人数が多すぎてこの形式にできません',2);return}NET.fmt=f;NET.rule=netRuleOk(f,NET.rule==='br'?'gem':NET.rule);netSend();netLobby()}else{NETSEL.fmt=f;NETSEL.rule=netRuleOk(f,NETSEL.rule==='br'?'gem':NETSEL.rule);LSset('gr-nf',f)}SFX.gem();netRender()});
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const r=b.dataset.r;if(inRoom){if(!NET.host)return;NET.rule=r;netSend();netLobby()}else{NETSEL.rule=r;LSset('gr-nr',r)}SFX.gem();netRender()})}
function netRender(){const e=$('netState');if(!e||!$('netScr').classList.contains('on'))return;let t='';
  if(NET.st==='wait')t='オンラインに接続しています…';
  else if(NET.st==='none')t=NET.why==='nohost'?'このページは claude.ai の外で開かれています。claude.ai でアーティファクトを開くとオンラインで遊べます（CPU とは遊べます）。':NET.why==='denied'?'このアーティファクトのオンラインの許可がオフになっています。アーティファクトの許可の設定からオンにしてください。':'この画面ではオンラインに入れませんでした。claude.ai にログインして、このアーティファクトを開ける人どうしで遊べます。';
  else if(NET.st==='err')t=NET.errMsg;
  else if(NET.st==='ok')t=NET.conn?'接続中・このページを開いている人：'+NET.lobby.filter(p=>p.kind==='viewer').length+'人':performance.now()-(NET.okT||0)>8000?'オンラインのサーバーにつながりません。別のネットワークやブラウザで試してください。':'接続中…';
  e.textContent=t;e.className='nState '+(NET.st==='ok'&&NET.conn?'ok':NET.st==='wait'||NET.st==='ok'?'wait':'bad');const ok=NET.st==='ok'&&NET.conn;
  $('netMy').innerHTML=`<span class="pic">${portrait(PICK)}</span><span class="nmT"><b>${BT[PICK].name}</b><small><i class="pwc">${level(PICK)}</i> 🏆${trophies(PICK)}</small></span>`;
  $('netLobbyV').style.display=NET.game?'none':'';$('netRoomV').style.display=NET.game?'':'none';
  if(!NET.game){$('netSel').innerHTML=netChips(false);netPick($('netSel'),false);$('netMk').disabled=!ok;
    const L=$('netRooms');L.textContent='';const rs=ok?netRooms():[];
    if(!rs.length){const d=document.createElement('div');d.className='netNone';d.textContent=ok?'まだ募集中の部屋がありません。形式とモードを選んで「募集する」！':'—';L.appendChild(d)}
    for(const r of rs){const b=document.createElement('button');b.className='netRoomB'+(r.st!=='wait'?' off':'');b.style.setProperty('--mc',MODECOL[r.r]);
      b.innerHTML=`<span class="mi">${modeIcon(r.r)}</span><span class="rt"><b>${netTitle(r.f,r.r)}</b><small>ホスト：${r.n.replace(/[<>&]/g,'')}${r.mine?'（あなたの別のタブ）':''}</small></span><span class="np">${r.np}/${NET_FMT[r.f].cap}</span><span class="jn">${r.st==='wait'?'参加':r.st==='full'?'満員':'試合中'}</span>`;
      if(r.st==='wait')b.onclick=()=>{SFX.gem();netEnter(r.c,false,r.f,r.r)};L.appendChild(b)}return}
  // 部屋の中
  const os=netOthers(),hostName=NET.host?netName():(NET.hostP?cleanN(NET.hostP.presence.n):'…'),F=NET_FMT[NET.fmt],mk=NET.fmt==='br'?'br':NET.rule;
  $('netRoomT').innerHTML=`<span class="mi" style="--mc:${MODECOL[mk]}">${modeIcon(mk)}</span><span class="rt"><b>${netTitle(NET.fmt,NET.rule)}</b><small>ホスト：${hostName.replace(/[<>&]/g,'')}　${os.length+1}/${F.cap}人</small></span>`;
  $('netRoomSel').innerHTML=netChips(true);netPick($('netRoomSel'),true);
  const mem=[{n:netName(),bt:PICK,lv:level(PICK),me:true}].concat(os.map(p=>({n:cleanN(p.presence.n)||'???',bt:BT[p.presence.bt]?p.presence.bt:'rico',lv:clamp(p.presence.lv|0,1,MAXLV)})));
  // チームの並び（スタートしたときと同じ分け方で見せる）
  const card=m=>m?`<div class="netM${m.me?' me':''}"><span class="pic">${portrait(m.bt)}</span><b>${m.n.replace(/[<>&]/g,'')}${m.me?'（あなた）':''}</b><small>${BT[m.bt].name}・<i class="pwc">${m.lv}</i></small></div>`:`<div class="netM cpu"><span class="pic">🤖</span><b>CPU</b><small>空いている席</small></div>`;
  let html='';if(NET.fmt==='br'){html=`<div class="nTeam br">${mem.map(card).join('')}<div class="nCpu">＋ CPU ${10-mem.length}人</div></div>`}
  else{const T=[[],[]],slot=[0,0];mem.forEach((m,i)=>{let t=NET.fmt==='coop'?0:i%2;if(slot[t]>=F.n)t=1-t;T[t].push(m);slot[t]++});
    html=[0,1].map(t=>`<div class="nTeam ${t?'r':'b'}"><h5>${t?'赤チーム':'青チーム'}</h5>${Array.from({length:F.n},(_,i)=>card(T[t][i])).join('')}</div>`).join('<div class="nVs">VS</div>')}
  $('netTeams').innerHTML=html;$('netGo').style.display=NET.host?'':'none';
  $('netWaitT').textContent=NET.ph==='play'&&!NET.host?'いま試合中です。次の試合から参加できます':NET.host?(os.length?'そろったら「スタート」！（空いている席はCPUが入ります）':'友だちが入るのを待っています…（ひとりでもスタートできます）'):'ホストがスタートするのを待っています…'}
$('netNameIn').addEventListener('change',e=>{LSset('gr-name',cleanN(e.target.value));netSend();netLobby();try{drawHome()}catch(x){}});$('netNameIn').addEventListener('keydown',e=>e.stopPropagation());
$('netMk').addEventListener('click',()=>{NET.fmt=NETSEL.fmt;NET.rule=NETSEL.rule;SFX.superReady();netCreate()});$('netGo').addEventListener('click',()=>netStart());
$('netLeave').addEventListener('click',()=>netLeave());$('netClose').addEventListener('click',()=>closeNet());$('netHome').addEventListener('click',()=>closeNet());
$('netChar').addEventListener('click',()=>{$('netScr').classList.remove('on');NET.backTo=true;openChars()});
setInterval(()=>{if(NET.game&&!NET.on)netSend();if(!NET.on)netRender()},1000);
addEventListener('pagehide',()=>{try{NET.gunsub.forEach(u=>u());NET.unsub.forEach(u=>u());if(NET.game)NET.game.leave().catch(()=>{});if(NET.room)NET.room.presence({gr:null}).catch(()=>{})}catch(e){}});
// テスト用
Object.assign(window.__A,{attack,superAtk,gadget,hyperGo,streamStart,chargeStart,openChars,openDetail,kitPop,statPop,skinPop,openModes,openRanked,openRoad,openPass,openQuests,openProfile,openBuffy,openShop,openNet,startTraining,NET,PIC,PICQ,netSnap,netApplySnap,netStartLocal,netState,camDist,addPP,addGems,pp,gems,clawGo,BTRIOS,mapImg,curMap,ROAD,bp,addXP,quests,squests,stats,HALFX:()=>HALFX,HALFZ:()=>HALFZ});
})();
