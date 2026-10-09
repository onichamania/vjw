// ===================== 共通の仕組み（セーブ・数字・能力値・持ち物） =====================
const $=id=>document.getElementById(id);
const rr=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},LSset=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
// 数字：1万・1.2億・3兆…（ハチミツは大きくなるので日本語の単位で）
function fmt(n){n=Math.floor(n||0);const a=Math.abs(n);if(a<10000)return n.toLocaleString('ja-JP');
  const U=[[1e20,'垓'],[1e16,'京'],[1e12,'兆'],[1e8,'億'],[1e4,'万']];for(const [v,s] of U)if(a>=v){const x=n/v;return (x>=1000?Math.floor(x).toLocaleString('ja-JP'):x>=100?x.toFixed(0):x>=10?x.toFixed(1):x.toFixed(2))+s}return ''+n}
const fmtT=s=>{s=Math.max(0,Math.ceil(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+'時間'+m+'分':m?m+'分'+(x?x+'秒':''):x+'秒'};
// ---- ハチの種類 ----
const BEES={};for(const b of BEE_TABLE){const id=b.en.toLowerCase();BEES[id]=Object.assign({id,jp:BEE_JP[b.en]||b.en},b);
  for(const [it,list] of Object.entries(FAV))if(list.includes(b.en))BEES[id].fav=it}
BEES.puppy.tok.push('fetch');
const BEE_IDS=Object.keys(BEES);
const byRar=r=>BEE_IDS.filter(id=>BEES[id].rar===r);
// ---- セーブ ----
const SAVE_KEY='bss-save-1';
function newState(){return{v:1,honey:0,pollen:0,inv:{basicegg:1},hive:Array(50).fill(null),slots:25,
  equip:{tool:'scooper',bag:'pouch',hat:null,belt:null,boots:null,lg:null,rg:null,glide:null},own:{scooper:1,pouch:1},disc:[],
  cnt:{egg:0,rj:0,treat:0,ticket:0,slot:0},q:{},qs:{},st:{pollen:0,c:[0,0,0],f:{},fc:{},kill:{},feed:{},tok:{},use:{},honey:0,bp:0},
  mob:{},mach:{},buffs:{},fb:{},sci:0,polar:0,brownN:0,tabby:0,time:0,snailHp:0,firstTB:1,tut:0,clock:0}}
let ST=newState();
function load(){try{const s=JSON.parse(LS(SAVE_KEY,'null'));if(s&&s.v===1){ST=Object.assign(newState(),s);ST.st=Object.assign(newState().st,s.st||{});while(ST.hive.length<50)ST.hive.push(null)}}catch(e){console.warn('save',e)}}
function save(){ST.time=G.t;LSset(SAVE_KEY,JSON.stringify(ST))}
function resetSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}ST=newState();location.reload()}
// ---- 持ち物 ----
const inv=id=>ST.inv[id]||0;
function give(id,n,silent){if(!n)return;if(id==='honey'){addHoney(n,silent);return}ST.inv[id]=(ST.inv[id]||0)+n;if(!silent){const it=ITEMS[id];note((it?it.ic+' '+it.jp:id)+' ×'+fmt(n)+' を手に入れた')}if(typeof uiDirty==='function')uiDirty()}
function take(id,n){if(id==='honey'){if(ST.honey<n)return false;ST.honey-=n;return true}if(inv(id)<n)return false;ST.inv[id]-=n;if(!ST.inv[id])delete ST.inv[id];return true}
function addHoney(n,silent){n=Math.floor(n);if(!(n>0))return;ST.honey+=n;ST.st.honey+=n}
function canPay(price,items){if(ST.honey<price)return false;for(const k in items||{})if(inv(k)<items[k])return false;return true}
function pay(price,items){if(!canPay(price,items))return false;ST.honey-=price;for(const k in items||{})take(k,items[k]);return true}
// ---- ハチの数・見つけた種類 ----
const hiveBees=()=>ST.hive.slice(0,ST.slots).filter(Boolean);
const beeCount=()=>hiveBees().length;
function discover(t){if(!ST.disc.includes(t)){ST.disc.push(t);note('🐝 新しいハチを見つけた：'+BEES[t].jp)}}
const discColor=c=>ST.disc.filter(t=>BEES[t].col===c).length;
// ---- 能力値（装備・ギフテッドのボーナス・バフをまとめる） ----
// 足し算（%）と掛け算（Mul）を分けて持つ
function baseStats(){return{cap:0,capMul:1,capBlueF:0,capRedF:0,capWhiteF:0,conv:0,convMul:1,hiveMul:1,ic:0,icW:0,icR:0,icB:0,icBomb:0,icFlame:0,
  pollen:0,pollenMul:1,white:0,red:0,blue:0,whiteMul:1,redMul:1,blueMul:1,beeGather:0,beeGatherMul:1,tool:0,toolMul:1,bomb:0,redBomb:0,blueBomb:0,bombMul:1,buzzMul:1,redBombMul:1,blueBombMul:1,bombPow:1,
  bubbleMul:1,flameMul:1,ability:0,life:0,def:0,ms:0,msMul:1,msPct:0,jump:0,moveColl:0,atk:0,atkW:0,atkR:0,atkB:0,atkPct:0,atkRpct:0,crit:5,critPow:50,scrit:0,loot:0,hft:0,hftMul:1,convAmt:0,
  beeMs:0,beeMsMul:1,energyMul:1,bondTreat:0,hpp:0,hppMul:1,giftPollen:0,abilityPollen:0,flameDur:0,bubbleDur:0,markDur:0,dup:0,respawn:0,glide:0}}
function addSt(P,st){for(const k in st){const v=st[k];if(k.endsWith('Mul')||k==='bombPow')P[k]*=v;else P[k]=(P[k]||0)+v}}
let P=baseStats();
function calcStats(){const p=baseStats();
  const bag=BAGS[ST.equip.bag];if(bag)addSt(p,bag.st);
  for(const s of['hat','belt','boots','lg','rg','glide']){const g=ST.equip[s]&&GEAR[ST.equip[s]];if(g)addSt(p,g.st)}
  // ギフテッドのボーナス（同じ種類は重ならない）
  const done=new Set();for(const b of hiveBees())if(b.g&&!done.has(b.t)){done.add(b.t);const gs=GIFT_ST[BEES[b.t].en];if(gs)addSt(p,gs)}
  p.conv+=25*ST.sci;p.energyMul*=Math.pow(1.05,ST.polar);
  // バフ
  const B=k=>buffStack(k);
  p.redMul*=Math.pow(1.2,B('boost_r'));p.blueMul*=Math.pow(1.2,B('boost_b'));p.whiteMul*=Math.pow(1.2,B('boost_w'));
  p.msMul*=Math.pow(1.1,B('haste'));p.crit+=3*B('focus');if(B('melody'))p.critPow+=100;p.atk+=B('rage');
  if(B('babylove')){p.pollenMul*=2;p.loot+=50}if(B('bearmorph'))p.pollenMul*=2;if(B('puppylove')){p.beeMs+=10;p.beeGather+=50}
  if(B('bluesync'))p.blue+=10;if(B('redsync'))p.red+=10;if(B('tabby')){p.critPow+=25;p.crit+=1}
  p.pollenMul*=Math.pow(1.02,B('balloon'));p.redMul*=Math.pow(1.2,B('flameheat'));p.atkPct+=5*B('flameheat');
  if(B('stinger'))p.atkPct+=50;if(B('oil')){p.msMul*=1.2;p.beeMsMul*=1.2}if(B('enzymes')){p.convMul*=1.25;p.ic+=10}
  if(B('redextract'))p.redMul*=1.25;if(B('blueextract'))p.blueMul*=1.25;if(B('glue')){p.beeGatherMul*=1.25;p.toolMul*=1.25}
  if(B('tropical')){p.whiteMul*=1.25;p.ic+=10;p.crit+=5}if(B('purple')){p.capMul*=1.25;p.redMul*=1.5;p.blueMul*=1.5;p.beeGatherMul*=1.3;p.toolMul*=1.3}
  if(B('smoothie')){p.capMul*=1.5;p.redMul*=1.6;p.blueMul*=1.6;p.whiteMul*=1.6;p.beeGatherMul*=1.4;p.toolMul*=1.4;p.convMul*=2;p.hiveMul*=1.5;p.ic+=12;p.crit+=7;p.beeMsMul*=1.25;p.msMul*=1.25;p.scrit+=1}
  p.hppMul*=Math.pow(1.01,B('wealth'));
  P=p;return p}
// 今いるフィールドでの容量
function capacity(){const f=G.field&&FIELDS[G.field];let c=P.cap*P.capMul;if(f){if(f.fc==='b')c*=1+P.capBlueF/100;if(f.fc==='r')c*=1+P.capRedF/100;if(f.fc==='w')c*=1+P.capWhiteF/100}return Math.floor(c)}
// 花粉の倍率（色ごと）
function pollenMult(col){const cm=col===0?(1+P.white/100)*P.whiteMul:col===1?(1+P.red/100)*P.redMul:(1+P.blue/100)*P.blueMul;return (1+P.pollen/100)*P.pollenMul*cm}
// ---- バフ ----
function buffStack(k){const b=ST.buffs[k];if(!b)return 0;if(b.until<G.t){delete ST.buffs[k];return 0}return b.n}
function addBuff(k,n,dur){const d=BUFFS[k];if(!d)return;const b=ST.buffs[k];const now=G.t;dur=dur||d.dur;
  if(b&&b.until>now){b.n=Math.min(d.max,b.n+(n||1));b.until=now+dur;b.dur=dur}else ST.buffs[k]={n:Math.min(d.max,n||1),until:now+dur,dur};calcStats()}
// ---- フィールドのブースト ----
function fieldBoost(f){const b=ST.fb[f];if(!b||b.until<G.t)return 0;return b.n}
function addFieldBoost(f,n){const b=ST.fb[f];if(b&&b.until>G.t){b.n=Math.min(4,b.n+n);b.until=G.t+900}else ST.fb[f]={n:Math.min(4,n),until:G.t+900};note('🌼 '+FIELDS[f].jp+'の花粉 +'+fieldBoost(f)*100+'%（15分）')}
// ---- お知らせ ----
function note(t,col){const d=document.createElement('div');d.className='nt';d.textContent=t;if(col)d.style.color=col;$('notes').appendChild(d);setTimeout(()=>d.remove(),4500);while($('notes').children.length>7)$('notes').firstChild.remove()}
let bigT=0;function big(t,s){const b=$('big');b.textContent=t;b.style.display='block';bigT=s||2}
