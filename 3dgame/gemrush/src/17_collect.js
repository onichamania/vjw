// ================= 集める・ふやす（キャラ解放・トロフィーロード・スタードロップ・スキン・バトルパス） =================
const J=(k,d)=>{try{const v=JSON.parse(LS(k,'null'));return v==null?d:v}catch(e){return d}},JS=(k,v)=>LSset(k,JSON.stringify(v));
// ---- キャラの解放（最初はヒナタだけ）----
// 管理者モード（設定から切りかえ）：全キャラで遊べる・レベルと装備は全部・コインは減らない。セーブはふだんの分を残したまま
let ADMIN=LS('gr-admin','0')==='1';
function owned(){return ADMIN?BT_IDS.slice():ownedReal()}
function ownedReal(){let o=J('gr-own',null);if(!o){o=['rico'];for(const id of BT_IDS)if(!o.includes(id)&&(+LS('gr-tr-'+id,0)>0||+LS('gr-lv-'+id,1)>1))o.push(id);JS('gr-own',o)}return o}
const isOwned=id=>owned().includes(id);
function unlockChar(id){const o=ownedReal();if(o.includes(id))return false;o.push(id);JS('gr-own',o);unlockShow({kind:'char',id});return true}
// ---- スキン（本家のレア度：レア29・スーパーレア79・ハイパーレア149・ウルトラレア199・レジェンドレア299ジェム。ブリングでも買える）----
function hueRot(hex,deg){let r=(hex>>16&255)/255,g=(hex>>8&255)/255,b=(hex&255)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s2=0;
  if(d){s2=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}h=(h+deg/360)%1;s2=Math.max(s2,.55);
  const f=n=>{const k=(n+h*12)%12,a=s2*Math.min(l,1-l);return Math.round((l-a*Math.max(-1,Math.min(k-3,9-k,1)))*255)};return f(0)<<16|f(8)<<8|f(4)}
const SKINS={};for(const id of BT_IDS)SKINS[id]=[{id:'base',name:'ノーマル',t:-1},{id:'color',name:'トロピカル',t:0,body:hueRot(BT[id].col,150),gem:29,bl:1000},
  {id:'shadow',name:'シャドウ',t:1,body:0x2b2d45,hair:0x8a5cff,gem:79,bl:2750},{id:'gold',name:'ゴールド',t:2,body:0xffc53d,hair:0xfff1a0,crown:1,gem:149,bl:5000},
  {id:'neon',name:'ネオン',t:3,body:0x1b1640,hair:0xff3df0,glowH:0xb0108a,glowB:0x14062a,gem:199},{id:'diamond',name:'ダイヤモンド',t:4,body:0x9ff0ff,hair:0xffffff,crown:1,glowB:0x13607a,gem:299},
  {id:'s1',name:'シーズン1',t:-2,body:0x1fb5a8,hair:0xff5fa2,cape:1,pass:1}];
const skinById=(id,sk)=>SKINS[id].find(k=>k.id===sk)||SKINS[id][0];
const skinsOwned=id=>J('gr-sk-'+id,['base']),skinOf=id=>{const s=LS('gr-skin-'+id,'base');return SKINS[id].find(k=>k.id===s&&skinsOwned(id).includes(k.id))||SKINS[id][0]};
function giveSkin(id,sk){const o=skinsOwned(id);if(o.includes(sk))return false;o.push(sk);JS('gr-sk-'+id,o);unlockShow({kind:'skin',id,sk});return true}
// ---- トロフィーロード（合計トロフィーで順番に受け取る）----
// キャラ解放の段（合計トロフィー）。早く仲間が増えるように低めにしてある
const ROAD_CHARS=[['yuki',5],['jack',15],['gai',30],['jet',45],['riki',60],['goro',80],['carlo',100],['kachiko',120],['mimi',140],['piko',165],['kagerou',190],['ranran',215],['yotaka',240],['vlad',270],['soda',300],['sumire',325],['tarubo',350],['hatsue',380],['gantetsu',410],['ayame',440],['shinobu',475],['sabo',510],
  ['ricochet',545],['gus',580],['bibi',615],['bo',650],['emz',690],['colette',730],['griff',770],['ash',810],['angelo',850],['shade',890],['max',935],['chuck',980],['gigi',1025],['janet',1070],['squeak',1115],['fang',1160],['rt',1210],['alli',1260],['meg',1310],['amber',1360]];
const ROAD=[];{const gifts=[{pp:100},{coins:200},{drop:1},{pp:150},{gems:10},{coins:250},{drop:1},{pp:200},{coins:300},{skin:1},{cdrop:1},{pp:250},{gems:15},{coins:400},{drop:2},{pp:300}];
  ROAD_CHARS.forEach(([id,t],i)=>{if(!BT[id])return;ROAD.push({t,char:id});const nx=ROAD_CHARS[i+1];ROAD.push(Object.assign({t:nx?Math.round((t+nx[1])/2):t+20},gifts[i%gifts.length]))});
  const last=ROAD[ROAD.length-1].t;for(let t=last+40,k=0;t<=last+2400;t+=60,k++)ROAD.push([{t,pp:100},{t,coins:200},{t,drop:1},{t,gems:10},{t,pp:100},{t,coins:200},{t,drop:1},{t,cdrop:1}][k%8])}
const roadGot=()=>+LS('gr-road2',0);
try{const o=ownedReal();let ch=false;for(let i=0;i<Math.min(roadGot(),ROAD.length);i++){const r=ROAD[i];if(r.char&&!o.includes(r.char)){o.push(r.char);ch=true}}if(ch)JS('gr-own',o)}catch(e){}
const rewardTxt=(r,sep)=>[r.char&&BT[r.char].name+' 解放',r.pskin&&BT[r.pskin].name+'の限定スキン',r.skin&&'スキン',r.drop&&'スタードロップ×'+r.drop,r.cdrop&&'カオスドロップ×'+r.cdrop,r.cr&&'クレジット '+r.cr,r.bl&&'ブリング '+r.bl,r.coins&&'コイン '+r.coins,r.pp&&'パワーポイント '+r.pp,r.gems&&'ジェム '+r.gems,r.buf&&'バフィー',r.xp&&'パスXP '+r.xp].filter(Boolean).join(sep||' + ');
// 報酬のアイコン（いちばん大きいものを1つ）と数
function rewardIcon(r){if(r.char)return{ic:pic(r.char),n:'',char:1};if(r.pskin||r.skin)return{ic:pic(r.pskin||PICK,r.pskin?skinById(r.pskin,'s1'):skinById(PICK,'shadow')),n:'スキン'};if(r.cdrop)return{ic:ICON.chaos,n:r.cdrop>1?'×'+r.cdrop:''};if(r.drop)return{ic:ICON.star,n:r.drop>1?'×'+r.drop:''};if(r.cr)return{ic:ICON.credit,n:r.cr};if(r.bl)return{ic:ICON.bling,n:r.bl};if(r.gems)return{ic:ICON.gem,n:r.gems};if(r.pp)return{ic:ICON.pp,n:r.pp};if(r.coins)return{ic:ICON.coin,n:r.coins};if(r.buf)return{ic:ICON.buffy,n:''};if(r.xp)return{ic:ICON.pass,n:r.xp};return{ic:ICON.box,n:''}}
function giveReward(r){if(r.char){if(!unlockChar(r.char))addCoins(200)}if(r.coins)addCoins(r.coins);if(r.pp)addPP(r.pp);if(r.gems)addGems(r.gems);if(r.drop)addDrop('starr',r.drop);if(r.cdrop)addDrop('chaos',r.cdrop);if(r.cr)addCr(r.cr);if(r.bl)addBl(r.bl);
  if(r.skin){const L=['color','shadow','gold'],c=ownedReal().filter(id=>L.some(k=>!skinsOwned(id).includes(k)));const id=c.length?c[Math.floor(Math.random()*c.length)]:null;if(id)giveSkin(id,L.find(k=>!skinsOwned(id).includes(k)));else addCoins(300)}
  if(r.pskin){if(!giveSkin(r.pskin,'s1'))addCoins(300)}if(r.xp)addXP(r.xp)}
function claimRoad(){const i=roadGot(),r=ROAD[i];if(!r||totalTr()<r.t)return;LSset('gr-road2',i+1);giveReward(r);SFX.superReady();drawRoad();drawHome()}
// ---- ブロスタパス（30段・無料と有料。有料はジェムで買う）----
const BP_T=30,BP_XP=300,BP_COST=169,BP_SEASON=1+Math.floor((Date.now()/864e5-20300)/56);
const bp=()=>J('gr-bp',{xp:0,f:[],p:[],prem:false}),bpSave=b=>JS('gr-bp',b),bpTier=b=>Math.min(BP_T,Math.floor(b.xp/BP_XP));
// 本家のパスのような報酬：コイン・パワーポイント・スタードロップ・ジェム、ところどころにスキンとバフィー
function bpReward(i,prem){if(!prem){const c=[{coins:300},{pp:150},{drop:1},{coins:400},{gems:10}][i%5];const r=Object.assign({},c);if(i===10||i===20)r.skin=1;if(i===30)Object.assign(r,{drop:5,coins:1500,skin:1});return r}
  const c=[{coins:500},{pp:300},{drop:2},{gems:20},{coins:800},{pp:500}][i%6];const r=Object.assign({},c);if(i%5===4)r.cdrop=1;if(i===1)Object.assign(r,{pskin:PICK});if(i===15)Object.assign(r,{buf:1});if(i===30)Object.assign(r,{pskin:BT_IDS[(BT_IDS.indexOf(PICK)+1)%BT_IDS.length],coins:2500,drop:5,cdrop:3});return r}
function addXP(x){const b=bp();const t0=bpTier(b);b.xp+=x;bpSave(b);return bpTier(b)>t0}
function bpClaim(i,prem){const b=bp();if(bpTier(b)<i)return;const L=prem?b.p:b.f;if(L.includes(i)||prem&&!b.prem)return;L.push(i);bpSave(b);const r=bpReward(i,prem);if(r.buf){const g=freeBuffy();if(!g)addCoins(1000)}giveReward(r);SFX.gem();drawPass();drawHome()}
function bpBuy(){const b=bp();if(b.prem)return;if(gems()<BP_COST){note('ジェムが足りません（'+BP_COST+'）',2);return}addGems(-BP_COST);b.prem=true;bpSave(b);SFX.superReady();try{fxSlam('ブロスタパス+','#ffd23f','プレミアムの報酬がもらえる！');confetti(VW()/2,VH()*.5,60)}catch(e){}drawPass();drawHome()}
