// ================= 集める・ふやす（キャラ解放・トロフィーロード・スタードロップ・スキン・バトルパス） =================
const J=(k,d)=>{try{const v=JSON.parse(LS(k,'null'));return v==null?d:v}catch(e){return d}},JS=(k,v)=>LSset(k,JSON.stringify(v));
// ---- キャラの解放（最初はヒナタだけ）----
// 管理者モード（設定から切りかえ）：全キャラで遊べる・レベルと装備は全部・コインは減らない。セーブはふだんの分を残したまま
let ADMIN=LS('gr-admin','0')==='1';
function owned(){return ADMIN?BT_IDS.slice():ownedReal()}
function ownedReal(){let o=J('gr-own',null);if(!o){o=['rico'];for(const id of BT_IDS)if(!o.includes(id)&&(+LS('gr-tr-'+id,0)>0||+LS('gr-lv-'+id,1)>1))o.push(id);JS('gr-own',o)}return o}
const isOwned=id=>owned().includes(id);
function unlockChar(id){const o=ownedReal();if(o.includes(id))return false;o.push(id);JS('gr-own',o);popUnlock('新しいキャラ！',BT[id].name+'（'+BT[id].role+'）',portrait(id));return true}
// ---- スキン ----
const SKINS={};for(const id of BT_IDS)SKINS[id]=[{id:'base',name:'ノーマル',rar:0},{id:'shadow',name:'シャドウ',rar:1,body:0x2b2d45,hair:0x8a5cff,gem:29},{id:'gold',name:'ゴールド',rar:2,body:0xffc53d,hair:0xfff1a0,crown:1,gem:79},{id:'s1',name:'シーズン1',rar:3,body:0x1fb5a8,hair:0xff5fa2,cape:1,pass:1}];
const SKRAR=['','スーパーレア','エピック','パス限定'];
const skinsOwned=id=>J('gr-sk-'+id,['base']),skinOf=id=>{const s=LS('gr-skin-'+id,'base');return SKINS[id].find(k=>k.id===s&&skinsOwned(id).includes(k.id))||SKINS[id][0]};
function giveSkin(id,sk){const o=skinsOwned(id);if(o.includes(sk))return false;o.push(sk);JS('gr-sk-'+id,o);const S2=SKINS[id].find(k=>k.id===sk);popUnlock('新しいスキン！',BT[id].name+'「'+S2.name+'」',portrait(id,S2));return true}
// ---- トロフィーロード（合計トロフィーで順番に受け取る）----
// キャラ解放の段（合計トロフィー）。早く仲間が増えるように低めにしてある
const ROAD_CHARS=[['yuki',5],['jack',15],['gai',30],['jet',45],['riki',60],['goro',80],['carlo',100],['kachiko',120],['mimi',140],['piko',165],['kagerou',190],['ranran',215],['yotaka',240],['vlad',270],['soda',300],['sumire',325],['tarubo',350],['hatsue',380],['gantetsu',410],['ayame',440],['shinobu',475],['sabo',510],
  ['ricochet',545],['gus',580],['bibi',615],['bo',650],['emz',690],['colette',730],['griff',770],['ash',810],['angelo',850],['shade',890],['max',935],['chuck',980],['gigi',1025],['janet',1070],['squeak',1115],['fang',1160],['rt',1210],['alli',1260],['meg',1310],['amber',1360]];
const ROAD=[];{const gifts=[{pp:100},{coins:200},{drop:1},{pp:150},{gems:10},{coins:250},{drop:1},{pp:200},{coins:300},{skin:1},{drop:2},{pp:250},{gems:15},{coins:400},{drop:2},{pp:300}];
  ROAD_CHARS.forEach(([id,t],i)=>{if(!BT[id])return;ROAD.push({t,char:id});const nx=ROAD_CHARS[i+1];ROAD.push(Object.assign({t:nx?Math.round((t+nx[1])/2):t+20},gifts[i%gifts.length]))});
  const last=ROAD[ROAD.length-1].t;for(let t=last+40,k=0;t<=last+2400;t+=60,k++)ROAD.push([{t,pp:100},{t,coins:200},{t,drop:1},{t,gems:10}][k%4])}
const roadGot=()=>+LS('gr-road2',0);
try{const o=ownedReal();let ch=false;for(let i=0;i<Math.min(roadGot(),ROAD.length);i++){const r=ROAD[i];if(r.char&&!o.includes(r.char)){o.push(r.char);ch=true}}if(ch)JS('gr-own',o)}catch(e){}
const rewardTxt=(r,sep)=>[r.char&&BT[r.char].name+' 解放',r.pskin&&BT[r.pskin].name+'の限定スキン',r.skin&&'スキン',r.drop&&'スタードロップ×'+r.drop,r.coins&&'コイン '+r.coins,r.pp&&'パワーポイント '+r.pp,r.gems&&'ジェム '+r.gems,r.buf&&'バフィー',r.xp&&'パスXP '+r.xp].filter(Boolean).join(sep||' + ');
// 報酬のアイコン（いちばん大きいものを1つ）と数
function rewardIcon(r){if(r.char)return{ic:pic(r.char),n:'',char:1};if(r.pskin||r.skin)return{ic:pic(r.pskin||PICK,r.pskin?SKINS[r.pskin][3]:SKINS[PICK][1]),n:'スキン'};if(r.drop)return{ic:ICON.star,n:r.drop>1?'×'+r.drop:''};if(r.gems)return{ic:ICON.gem,n:r.gems};if(r.pp)return{ic:ICON.pp,n:r.pp};if(r.coins)return{ic:ICON.coin,n:r.coins};if(r.buf)return{ic:ICON.buffy,n:''};if(r.xp)return{ic:ICON.pass,n:r.xp};return{ic:ICON.box,n:''}}
function giveReward(r){if(r.char){if(!unlockChar(r.char))addCoins(200)}if(r.coins)addCoins(r.coins);if(r.pp)addPP(r.pp);if(r.gems)addGems(r.gems);if(r.drop)LSset('gr-sd',+LS('gr-sd',0)+r.drop);
  if(r.skin){const c=owned().filter(id=>skinsOwned(id).length<3);const id=c.length?c[Math.floor(Math.random()*c.length)]:null;if(id){const sk=skinsOwned(id).includes('shadow')?'gold':'shadow';giveSkin(id,sk)}else addCoins(300)}
  if(r.pskin){if(!giveSkin(r.pskin,'s1'))addCoins(300)}if(r.xp)addXP(r.xp)}
function claimRoad(){const i=roadGot(),r=ROAD[i];if(!r||totalTr()<r.t)return;LSset('gr-road2',i+1);giveReward(r);SFX.superReady();drawRoad();drawHome()}
// ---- スタードロップ ----
const DROP=[{name:'レア',col:'#3fc35a'},{name:'スーパーレア',col:'#2f8cff'},{name:'ハイパーレア',col:'#b04cf5'},{name:'ウルトラレア',col:'#ff3d55'},{name:'レジェンドレア',col:'#ffd21f'}];
let dropState=null;
function starSvg(col){return `<svg viewBox="0 0 100 100"><defs><radialGradient id="sg" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="${col}"/><stop offset="1" stop-color="${col}" stop-opacity=".85"/></radialGradient></defs>
  <path d="M50 3 63 35 97 37 71 59 80 95 50 75 20 95 29 59 3 37 37 35Z" fill="url(#sg)" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M50 16 58 38 80 39 63 53 69 76 50 63 31 76 37 53 20 39 42 38Z" fill="#ffffff30"/><circle cx="38" cy="30" r="6" fill="#fff" opacity=".7"/></svg>`}
function sparks(col,n){const fx=$('dropFx');for(let i=0;i<n;i++){const e=document.createElement('i'),a=Math.random()*TAU,d=120+Math.random()*220;e.style.setProperty('--x',Math.cos(a)*d+'px');e.style.setProperty('--y',Math.sin(a)*d+'px');e.style.setProperty('--pc',col);e.style.animationDelay=Math.random()*.1+'s';fx.appendChild(e);setTimeout(()=>e.remove(),950)}}
function anim(el,cls){el.classList.remove('enter','idle','hit','up','open');void el.offsetWidth;el.classList.add(cls)}
function openDrop(){const n=+LS('gr-sd',0);if(n<=0)return;LSset('gr-sd',n-1);const x=Math.random();const r0=x<.5?0:x<.78?1:x<.93?2:x<.98?3:4;dropState={r:r0,taps:0,phase:'tap'};
  $('dropScr').classList.add('on');$('dropStar').style.display='';$('dropCard').classList.remove('show');$('dropOk').style.display='none';$('dropTap').style.display='';drawDrop(false);anim($('dropStar'),'enter');setTimeout(()=>dropState&&dropState.phase==='tap'&&anim($('dropStar'),'idle'),720);tn(200,.5,.12,'sine',600)}
function drawDrop(pop){const d=dropState,D=DROP[d.r];$('dropScr').style.setProperty('--dc',D.col);$('dropStar').innerHTML=starSvg(D.col);$('dropStar').style.filter=`drop-shadow(0 0 ${16+d.r*10}px ${D.col})`;
  const rr2=$('dropRar');rr2.textContent=D.name;rr2.style.color=D.col;if(pop){rr2.classList.remove('pop');void rr2.offsetWidth;rr2.classList.add('pop')}
  $('dropTap').textContent=d.phase==='tap'?(d.taps<3?'タップ！（あと'+(3-d.taps)+'回）':'タップして開ける！'):''}
function tapDrop(){const d=dropState;if(!d||d.phase!=='tap')return;const st=$('dropStar');
  if(d.taps<3){d.taps++;if(d.r<4&&Math.random()<.36){d.r++;anim(st,'up');sparks(DROP[d.r].col,26);drawDrop(true);[523,659,784,988,1318].slice(0,d.r+1).forEach((f,i)=>tn(f,.18,.14,'triangle',0,i*.05));G.shake=0}
    else{anim(st,'hit');sparks('#ffffff',8);drawDrop(false);tn(300+d.taps*80,.1,.12,'square')}setTimeout(()=>d.phase==='tap'&&anim(st,'idle'),520);return}
  d.phase='open';$('dropTap').style.display='none';anim(st,'open');tn(400,.7,.14,'sawtooth',1600);
  setTimeout(()=>{$('dropFlash').classList.remove('go');void $('dropFlash').offsetWidth;$('dropFlash').classList.add('go');sparks(DROP[d.r].col,40);nz(.4,.3,3000);
    $('dropStar').style.display='none';const res=dropReward(d.r);$('dropIcon').innerHTML=res.icon;$('dropMsg').textContent=res.msg;$('dropCard').classList.add('show');$('dropOk').style.display='inline-block';SFX.end(true);d.phase='done'},720)}
function dropReward(r){const locked=BT_IDS.filter(id=>!isOwned(id)),ownSk=owned().filter(id=>skinsOwned(id).length<3);
  if(r>=3&&locked.length&&Math.random()<(r===4?1:.5)){const id=locked[Math.floor(Math.random()*locked.length)];const o=ownedReal();o.push(id);JS('gr-own',o);return{icon:pic(id),msg:'新キャラ「'+BT[id].name+'」！'}}
  if(r>=2&&ownSk.length&&Math.random()<(r===2?.35:.55)){const id=ownSk[Math.floor(Math.random()*ownSk.length)],sk=skinsOwned(id).includes('shadow')?'gold':'shadow';const o=skinsOwned(id);o.push(sk);JS('gr-sk-'+id,o);const S2=SKINS[id].find(k=>k.id===sk);return{icon:pic(id,S2),msg:BT[id].name+'のスキン「'+S2.name+'」'}}
  const k=Math.random();
  if(k<.38){const n=[25,50,100,250,500][r]+Math.floor(Math.random()*10);addPP(n);return{icon:ICON.pp,msg:'パワーポイント '+n}}
  if(k<.48){const n=[2,5,10,25,50][r];addGems(n);return{icon:ICON.gem,msg:'ジェム '+n}}
  if(k<.58&&r<=1){const x=r?150:60;addXP(x);return{icon:ICON.pass,msg:'パスXP +'+x}}
  const c=[50,100,200,500,1000][r]+Math.floor(Math.random()*30);addCoins(c);return{icon:ICON.coin,msg:'コイン '+c}}
// ---- ブロスタパス（30段・無料と有料。有料はジェムで買う）----
const BP_T=30,BP_XP=300,BP_COST=169,BP_SEASON=1+Math.floor((Date.now()/864e5-20300)/56);
const bp=()=>J('gr-bp',{xp:0,f:[],p:[],prem:false}),bpSave=b=>JS('gr-bp',b),bpTier=b=>Math.min(BP_T,Math.floor(b.xp/BP_XP));
// 本家のパスのような報酬：コイン・パワーポイント・スタードロップ・ジェム、ところどころにスキンとバフィー
function bpReward(i,prem){if(!prem){const c=[{coins:300},{pp:150},{drop:1},{coins:400},{gems:10}][i%5];const r=Object.assign({},c);if(i===10||i===20)r.skin=1;if(i===30)Object.assign(r,{drop:5,coins:1500,skin:1});return r}
  const c=[{coins:500},{pp:300},{drop:2},{gems:20},{coins:800},{pp:500}][i%6];const r=Object.assign({},c);if(i===1)Object.assign(r,{pskin:PICK});if(i===15)Object.assign(r,{buf:1});if(i===30)Object.assign(r,{pskin:BT_IDS[(BT_IDS.indexOf(PICK)+1)%BT_IDS.length],coins:2500,drop:5});return r}
function addXP(x){const b=bp();const t0=bpTier(b);b.xp+=x;bpSave(b);return bpTier(b)>t0}
function bpClaim(i,prem){const b=bp();if(bpTier(b)<i)return;const L=prem?b.p:b.f;if(L.includes(i)||prem&&!b.prem)return;L.push(i);bpSave(b);const r=bpReward(i,prem);if(r.buf){const g=freeBuffy();if(!g)addCoins(1000)}giveReward(r);SFX.gem();drawPass();drawHome()}
function bpBuy(){const b=bp();if(b.prem)return;if(gems()<BP_COST){note('ジェムが足りません（'+BP_COST+'）',2);return}addGems(-BP_COST);b.prem=true;bpSave(b);SFX.superReady();try{fxSlam('ブロスタパス+','#ffd23f','プレミアムの報酬がもらえる！');confetti(VW()/2,VH()*.5,60)}catch(e){}drawPass();drawHome()}
// ---- 画面 ----
function popUnlock(title,sub,svg){UNQ.push({title,sub,svg});if(!$('unlockScr').classList.contains('on'))nextPop()}
const UNQ=[];function nextPop(){const p=UNQ.shift();if(!p){$('unlockScr').classList.remove('on');return}$('unTitle').textContent=p.title;$('unSub').textContent=p.sub;$('unPic').innerHTML=p.svg;$('unlockScr').classList.add('on');SFX.end(true)}
