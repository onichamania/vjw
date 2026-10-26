// ================= 持ち物（トロフィー・コイン・パワーポイント・ジェム・レベル・ランク・クエスト・記録） =================
let PICK=BT[LS('gr-pick','rico')]?LS('gr-pick','rico'):'rico',PMODE=MODES[LS('gr-mode','gem')]&&LS('gr-mode','gem')!=='tutorial'?LS('gr-mode','gem'):'gem';
const trophies=id=>+LS('gr-tr-'+id,0),totalTr=()=>BT_IDS.reduce((s,i)=>s+trophies(i),0);
const level=id=>ADMIN?MAXLV:clamp(+LS('gr-lv-'+id,1)||1,1,MAXLV),realCoins=()=>+LS('gr-coins',200),coins=()=>ADMIN?1e9:realCoins(),coinTxt=()=>ADMIN?'∞':coins(),
  addCoins=n=>{if(ADMIN&&n<0)return;LSset('gr-coins',Math.max(0,realCoins()+n));if(n>0)try{coinFx(n)}catch(e){}};
// パワーポイント（キャラの強化に使う）とジェム（パス・スキン・ショップ）
const realPP=()=>+LS('gr-pp',0),pp=()=>ADMIN?1e9:realPP(),addPP=n=>{if(ADMIN&&n<0)return;LSset('gr-pp',Math.max(0,realPP()+n))};
const realGems=()=>+LS('gr-gem',0),gems=()=>ADMIN?1e9:realGems(),addGems=n=>{if(ADMIN&&n<0)return;LSset('gr-gem',Math.max(0,realGems()+n))};
const numTxt=n=>n>=1e9?'∞':n>=1e6?(n/1e6).toFixed(1)+'M':String(Math.floor(n));
// 本家と同じ強化の費用（Lv2〜11：パワーポイント＋コイン）
const UPPP=[20,30,50,80,130,210,340,550,890,1440],UPCOST=[20,35,75,140,290,480,800,1250,1875,2800];
const canUp=id=>{const lv=level(id);return isOwned(id)&&lv<MAXLV&&pp()>=UPPP[lv-1]&&coins()>=UPCOST[lv-1]};
function upgrade(id){const lv=level(id);if(lv>=MAXLV||!isOwned(id))return;const p=UPPP[lv-1],c=UPCOST[lv-1];if(pp()<p){note('パワーポイントが足りません',1.6);return}if(coins()<c){note('コインが足りません',1.6);return}
  addPP(-p);addCoins(-c);LSset('gr-lv-'+id,lv+1);SFX.superReady();lobbyEmote();drawChar();drawHome()}
// 前のセーブ（コインだけの時代）からの引っこし：パワーポイントとジェムを少し配る
(function(){if(LS('gr-mig4',''))return;LSset('gr-mig4','1');if(LS('gr-coins',null)!=null||LS('gr-tut','')){addPP(300);addGems(30)}})();
// ---- ランク（ブロンズI 〜 マスターズIII、その先がプロ）----
const TIERS=[['ブロンズ','#c98a55'],['シルバー','#b9c3d1'],['ゴールド','#ffcc3d'],['ダイヤモンド','#3fb5ff'],['ミシック','#c264ff'],['レジェンダリー','#ff3b5c'],['マスターズ','#ffb020']],ROMAN=['I','II','III'];
const RPts=()=>Math.max(0,+LS('gr-rp',0));
function rankOf(p){const d=Math.floor(p/100);if(d>=21)return{pro:true,name:'プロ',col:'#5dffb0',div:21,tier:7,prog:Math.min(1,(p-2100)/400)};const t=Math.floor(d/3);return{tier:t,div:d,name:TIERS[t][0]+' '+ROMAN[d%3],tn:TIERS[t][0],col:TIERS[t][1],prog:(p%100)/100}}
// 本家風のランクのマーク（角の生えたドクロの仮面。段階が上がるほど角が増える）
function emblem(r){const c=r.col,t=r.pro?7:r.tier,n=r.pro?3:r.div%3+1,dk=r.pro?'#1d8a5a':'#0003',spikes=[[24,2],[14,8],[34,8],[6,16],[42,16]].slice(0,Math.min(5,1+Math.floor(t/1.5)));
  const sp=spikes.map(([x,y])=>`<path d="M${x-5} ${y+12} L${x} ${y} L${x+5} ${y+12}Z" fill="${c}" stroke="#14101c" stroke-width="2" stroke-linejoin="round"/>`).join('');
  const bars=Array.from({length:n},(_,i)=>`<rect x="${24-n*3.5+i*7}" y="47" width="5" height="6" rx="1" fill="#fff" stroke="#14101c" stroke-width="1.5"/>`).join('');
  return `<svg viewBox="0 0 48 56">${sp}<path d="M24 10C13 10 7 17 7 26c0 7 4 12 9 14l1 7h14l1-7c5-2 9-7 9-14 0-9-6-16-17-16z" fill="${c}" stroke="#14101c" stroke-width="2.6" stroke-linejoin="round"/>
   <path d="M24 13c-8 0-13 5-14 11 3-4 8-6 14-6s11 2 14 6c-1-6-6-11-14-11z" fill="#ffffff55"/><path d="M12 27l8 2-1 5-6-2zM36 27l-8 2 1 5 6-2z" fill="#14101c"/><path d="M14 29l4 1M34 29l-4 1" stroke="#fff" stroke-width="1.4"/>
   <path d="M20 37h8M21 40v5M24 40v5M27 40v5" stroke="${dk}" stroke-width="2"/>${r.pro?'<path d="M24 16l2 4 4 .4-3 3 1 4-4-2-4 2 1-4-3-3 4-.4z" fill="#fff"/>':''}${bars}</svg>`}
// ---- トロフィーロードのアイコン（合計トロフィーで変わる丸いマーク） ----
const WORLDS=[['スターター','#5fb8ff'],['ブロスタの町','#ffb514'],['サボテン砂漠','#ff8a3d'],['こおりの山','#8ce0ff'],['ジャングル','#3fdc5a'],['ネオン街','#ff4fd8'],['海の底','#1fa8e8'],['お化け屋敷','#a040f0'],['宇宙','#5a3ad8'],['トゥモローワールド','#3a2f7a']];
const worldOf=t=>Math.min(WORLDS.length-1,Math.floor(t/250));
function roadIcon(t){const w=worldOf(t),[,c]=WORLDS[w];return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="${c}" stroke="#14101c" stroke-width="3.4"/><circle cx="32" cy="32" r="21" fill="#ffffff30"/>
  <path d="M32 12c8 6 11 14 9 24l-4 6H27l-4-6c-2-10 1-18 9-24z" fill="#fff" stroke="#14101c" stroke-width="2.6"/><circle cx="32" cy="27" r="4" fill="${c}" stroke="#14101c" stroke-width="2"/><path d="M27 42l-5 8 7-3M37 42l5 8-7-3" fill="#ff5a3a" stroke="#14101c" stroke-width="2"/>
  <rect x="24" y="52" width="16" height="9" rx="2" fill="#14101c"/><text x="32" y="59.5" text-anchor="middle" font-size="8" font-weight="900" fill="#fff" font-family="sans-serif">${ROMAN[w%3]||'I'}</text></svg>`}
// ---- クエスト（デイリー：毎日3つ・200XP／シーズン：毎週6つ・500XP）----
const QT=[{k:'win',t:'バトルに{n}回勝利する',n:[2,3]},{k:'kills',t:'敵を{n}体倒す',n:[6,10]},{k:'gems',t:'ジェムを{n}個拾う',n:[10,16]},{k:'dmg',t:'{n}ダメージを与える',n:[15000,25000]},{k:'sup',t:'必殺技を{n}回使う',n:[4,8]},
  {k:'top3',t:'バトルロイヤルで{n}回3位以内',n:[1,2]},{k:'cube',t:'パワーキューブを{n}個拾う',n:[5,8]},{k:'ranked',t:'ガチバトルを{n}回プレイする',n:[2,3]},{k:'play',t:'バトルを{n}回プレイする',n:[3,5]}];
const SQT=[{k:'win',t:'バトルに{n}回勝利する',sub:'モード：ガチバトル',mode:'ranked',n:5},{k:'tro',t:'トロフィーを{n}個獲得する',n:80},{k:'again',t:'「もう一度」機能を{n}回使用する',n:10},{k:'kills',t:'敵を{n}体倒す',n:40},
  {k:'dmg',t:'{n}ダメージを与える',n:100000},{k:'gems',t:'ジェムを{n}個拾う',n:50},{k:'sup',t:'必殺技を{n}回使う',n:30},{k:'win',t:'バトルに{n}回勝利する',sub:'モード：バトルロイヤル',mode:'br',n:3},
  {k:'win',t:'バトルに{n}回勝利する',sub:'モード：ブロストライカー',mode:'ball',n:3},{k:'win',t:'バトルに{n}回勝利する',sub:'モード：エメラルドハント',mode:'gem',n:4},{k:'heal',t:'体力を{n}回復する',n:30000},{k:'play',t:'バトルを{n}回プレイする',n:15}];
const QXP=200,SQXP=500,weekId=()=>Math.floor((Date.now()/864e5+3)/7);
const qText=it=>it.t.replace('{n}',it.n>=10000?(it.n/1000)+'k':it.n);
function quests(){const day=new Date().toDateString();let q=null;try{q=JSON.parse(LS('gr-q','null'))}catch(e){}
  if(!q||q.day!==day||!q.v){const pool=QT.slice().sort(()=>Math.random()-.5).slice(0,3);q={v:2,day,list:pool.map(o=>({k:o.k,t:o.t,n:o.n[Math.floor(Math.random()*o.n.length)],xp:QXP,p:0,got:false}))};LSset('gr-q',JSON.stringify(q))}return q}
function squests(){const w=weekId();let q=null;try{q=JSON.parse(LS('gr-sq','null'))}catch(e){}
  if(!q||q.w!==w){const pool=SQT.slice().sort(()=>Math.random()-.5).slice(0,6);q={w,list:pool.map(o=>({k:o.k,t:o.t,sub:o.sub||'',mode:o.mode||'',n:o.n,xp:SQXP,p:0,got:false,prem:false}))};q.list[2].prem=true;LSset('gr-sq',JSON.stringify(q))}return q}
function questAdd(vals){const msgs=[];for(const [key,q] of[['gr-q',quests()],['gr-sq',squests()]]){for(const it of q.list){if(it.got||!vals[it.k])continue;if(it.mode&&it.mode!==vals.mode)continue;const was=it.p;it.p=Math.min(it.n,it.p+vals[it.k]);if(it.p>=it.n&&was<it.n)msgs.push('クエスト達成：'+qText(it))}LSset(key,JSON.stringify(q))}return msgs}
function questClaim(i,season){const key=season?'gr-sq':'gr-q',q=season?squests():quests(),it=q.list[i];if(!it||it.got||it.p<it.n)return;if(it.prem&&!bp().prem){note('ブロスタパス限定のクエストです',2);return}
  it.got=true;LSset(key,JSON.stringify(q));const up=addXP(it.xp);SFX.superReady();note('パスXP +'+it.xp+(up?'　Tier '+bpTier(bp())+'！':''),2);drawQuests();drawHome()}
const questReady=()=>quests().list.concat(squests().list).filter(it=>!it.got&&it.p>=it.n&&!(it.prem&&!bp().prem)).length;
// ---- 記録（プロフィール用）----
const stats=()=>J('gr-st',{w3:0,wbr:0,wsolo:0,streak:0,best:0,games:0,bestTr:0,rpBest:0});
function statAdd(won,mode){const s=stats();s.games++;if(won){if(mode==='br')s.wbr++;else s.w3++;s.streak++;s.best=Math.max(s.best,s.streak)}else if(mode!=='br')s.streak=0;s.bestTr=Math.max(s.bestTr,totalTr());s.rpBest=Math.max(s.rpBest,RPts());JS('gr-st',s)}
const pTag=()=>{let t=LS('gr-tag','');if(!t){t='#'+Array.from({length:9},()=>'0289PYLQGRJCUV'[Math.random()*14|0]).join('');LSset('gr-tag',t)}return t};
const myName=()=>cleanName(LS('gr-name','')||'プレイヤー'),cleanName=s=>String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f<>]/g,'').trim().slice(0,12);
