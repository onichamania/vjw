// ================= メニューの画面（モード・ガチバトル・トロフィーロード・パス・クエスト・プロフィール・バフィー・ショップ・トレーニング） =================
// ---- マップの小さな絵（上から見た図） ----
const MAPIMG={};
function mapImg(id){if(MAPIMG[id])return MAPIMG[id];const rows=mapRows(id),H=rows.length,W=rows[0].length,T=10,th=THEMES[MAPS[id].theme]||THEMES.sand,c=document.createElement('canvas');c.width=W*T;c.height=H*T;const g=c.getContext('2d');
  const hx=n=>'#'+(n>>>0).toString(16).padStart(6,'0').slice(-6);
  for(let r=0;r<H;r++)for(let x=0;x<W;x++){g.fillStyle=th.floor[(x+r)%2];g.fillRect(x*T,r*T,T,T)}
  for(let r=0;r<H;r++)for(let x=0;x<W;x++){const ch=rows[r][x],X=x*T,Y=r*T;
    if(ch==='#'){const wc=th.walls[(x*7+r*3)%th.walls.length];g.fillStyle=hx(wc[0]);g.fillRect(X,Y,T,T);g.fillStyle=hx(wc[1]);g.fillRect(X+1,Y+1,T-2,T-4)}
    else if(ch==='B'){g.fillStyle=hx(th.bush[0]);g.beginPath();g.arc(X+T/2,Y+T/2,T*.62,0,TAU);g.fill();g.fillStyle=hx(th.bush[1]);g.beginPath();g.arc(X+T*.4,Y+T*.4,T*.32,0,TAU);g.fill()}
    else if(ch==='~'){g.fillStyle='#3aa8ee';g.fillRect(X,Y,T,T)}
    else if(ch==='X'){g.fillStyle='#8a5a3a';g.fillRect(X+1,Y+1,T-2,T-2);g.fillStyle='#57d68d';g.fillRect(X+3,Y+3,T-6,T-6)}
    else if(ch==='F'){g.fillStyle='#a8743f';g.fillRect(X,Y+T*.35,T,T*.3)}
    else if(ch==='G'){g.fillStyle='#2a1640';g.beginPath();g.arc(X+T/2,Y+T/2,T*.9,0,TAU);g.fill();g.fillStyle='#c77dff';g.beginPath();g.arc(X+T/2,Y+T/2,T*.4,0,TAU);g.fill()}
    else if(ch==='K'){g.fillStyle=r<H/2?'#d0303a':'#2f6fd8';g.fillRect(X-T/2,Y-T/2,T*2,T*2)}
    else if(ch==='O'){g.fillStyle='rgba(255,255,255,.7)';g.fillRect(X,Y,T,T)}
    else if(ch==='1'||ch==='2'){g.fillStyle=ch==='1'?'#3aa0ff':'#ff4d5a';g.beginPath();g.arc(X+T/2,Y+T/2,T*.35,0,TAU);g.fill()}}
  return MAPIMG[id]=c.toDataURL('image/png')}
// ================= モード選択 =================
let MTAB='trophy';
function openModes(tab){openScr('modeScr');drawModes(tab||'trophy')}
function drawModes(tab){MTAB=tab;document.querySelectorAll('#modeTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));const h=$('modes');h.innerHTML='';
  const card=(k,o)=>{o=o||{};const m=MODES[k],c=o.map?{id:o.map,left:0}:curMap(k),mp=MAPS[c.id];
    return `<button class="mCard${o.tall?' tall':''}${PMODE===k&&!o.noSel?' on':''}" data-m="${k}" style="--mc:${MODECOL[k]}"><span class="mt">${o.top||`<span data-left="${k}">次のマップまで：${leftTxt(c.left)}</span>`}<i class="info" data-ic="info"></i></span>`+
      `<span class="mh"><span class="mi">${modeIcon(k)}</span><span><b class="tx">${o.name||m.name}</b><small class="tx">${o.sub||mp.name}</small></span></span><span class="mp"><img src="${mapImg(c.id)}" alt=""><span class="md">${o.d||m.d}</span></span></button>`};
  if(tab==='trophy'){$('modeTitle').textContent='トロフィーゲームモード';h.innerHTML=card('br',{tall:true})+['ball','knockout','gem','heist','bounty','hotzone'].map(k=>card(k)).join('')}
  else if(tab==='training'){$('modeTitle').textContent='トレーニング';h.innerHTML=card('gem',{map:'valley',name:'チュートリアル',sub:'はじめての人へ',top:'いつでも',d:'動き方・攻撃・必殺技・ガジェットを順番に練習します',noSel:true}).replace('data-m="gem"','data-m="tutorial"')+
      card('gem',{map:'valley',name:'トレーニング場',sub:'的あて',top:'いつでも',d:'動かない的に好きなだけ攻撃できます。いまのキャラ：'+BT[PICK].name,noSel:true}).replace('data-m="gem"','data-m="training"')}
  fillIcons(h);
  h.querySelectorAll('.mCard').forEach(b=>b.onclick=e=>{const k=b.dataset.m;if(e.target.closest('.info')){note(MODES[k]?MODES[k].d:'',3);return}
    if(k==='tutorial'){startMatch('tutorial');return}if(k==='training'){startTraining(PICK);return}PMODE=k;LSset('gr-mode',k);SFX.superReady();backHome()})}
document.querySelectorAll('#modeTabs button').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.t;if(t==='ranked'){openRanked();return}if(t==='friend'){openNet();return}SFX.gem();drawModes(t)}));
$('modeClose').addEventListener('click',()=>backHome());
// ================= ガチバトル =================
function openRanked(){openScr('rankScr');drawRanked()}
function drawRanked(){const p=RPts(),r=rankOf(p),best=Math.max(+LS('gr-rpbest',0),p),rb=rankOf(best),hist=J('gr-rh',[]);
  $('rkSub').textContent='シーズン '+BP_SEASON;$('rkEmb').innerHTML=emblem(r);$('rkName').textContent=r.pro?'プロ':r.tn;$('rankScr').style.setProperty('--rkc',r.col);
  $('rkL').innerHTML=`<h4 class="tx">ガチバトル</h4><div class="rs"><span class="emb">${emblem(r)}</span><span><small>現在</small><b class="tx">${r.name}</b><small>${p} ポイント</small></span></div>`+
    `<div class="rs"><span class="emb">${emblem(rb)}</span><span><small>最高</small><b class="tx">${rb.name}</b><small>${best} ポイント</small></span></div>`+
    `<div class="rs" style="flex-direction:column;align-items:flex-start"><small>最近の結果</small><div class="hist">${hist.slice(-10).map(x=>`<i class="${x}">${x==='w'?'勝':x==='l'?'負':'分'}</i>`).join('')||'<small>まだありません</small>'}</div></div>`;
  // そのランク（3段階）の中でどこまで来たか
  const base=r.pro?2100:r.tier*300,span=r.pro?400:300,k=clamp((p-base)/span,0,1);
  $('rkBar').innerHTML=`<i style="width:${k*100}%"></i>`+(r.pro?'':[1,2].map(i=>`<s style="left:${i/3*100}%"></s>`).join(''))+[0,1,2,3].filter(i=>!r.pro||i%3===0).map(i=>`<span style="left:${i/3*100}%">${base+i*(r.pro?133:100)}</span>`).join('')+`<em class="tx" style="left:${k*100}%">${p}</em>`;
  $('rkInfo').innerHTML='モードとマップは毎回ランダムで決まります<br><small style="color:#fff">'+RANKED_MODES.map(m=>MODES[m].name).join('・')+'</small>';
  const L=$('ladder');L.innerHTML='';const cur=r.div,bd=Math.floor(best/100);for(let d=0;d<=21;d++){const q=rankOf(d*100),e=document.createElement('div');e.className=d===cur?'cur':d>Math.max(cur,bd)?'lock':'';e.innerHTML=`<span class="emb">${emblem(q)}</span><span class="tx" style="color:${q.col}">${q.name}</span>`;L.appendChild(e)}}
$('rankGo').addEventListener('click',()=>{PMODE='ranked';LSset('gr-mode','ranked');startMatch('ranked')});$('rankClose').addEventListener('click',()=>backHome());
$('rankHelp').addEventListener('click',()=>$('rkLad').classList.add('on'));$('rkLadX').addEventListener('click',()=>$('rkLad').classList.remove('on'));
// ================= トロフィーロード =================
function openRoad(){openScr('roadScr');drawRoad(true)}
function drawRoad(scroll){const h=$('roadList'),got=roadGot(),tot=totalTr();$('roadTot').textContent=tot;$('roadWorld').textContent=WORLDS[worldOf(tot)][0];
  let meI=-1;ROAD.forEach((r,i)=>{if(tot>=r.t)meI=i});const html=[];
  ROAD.forEach((r,i)=>{const st=i<got?'got':i===got&&tot>=r.t?'ready':tot>=r.t?'wait':'lock',ri=rewardIcon(r);
    html.push(`<div class="rn ${st}${i===got?' next':''}" data-i="${i}">`+(ri.n!==''?`<span class="amt">${r.coins||r.pp||r.gems?`<i>${r.coins?ICON.coin:r.pp?ICON.pp:ICON.gem}</i>`:''}<b class="tx">${ri.n}</b></span>`:'')+
      `<span class="rw">${r.char?`<span class="pt" style="--rc:${RARC[BT[r.char].rar]};width:100%;height:100%;display:block">${pic(r.char)}</span>`:ri.ic}</span>`+(st==='got'?`<i class="ck">${ICON.check}</i>`:'')+
      `<span class="th">${r.t}</span>`+(r.char?`<b class="tx" style="font-size:calc(var(--u)*2.6)">${BT[r.char].name}</b>`:'')+(st==='ready'?`<button class="go yel claimB"><span class="tx">受け取る</span></button>`:'')+
      (i===got&&st!=='ready'?`<b class="nx tx">次の目標</b>`:'')+(i===meI?`<span class="me tx"><i>${ICON.trophy}</i>${tot}</span>`:'')+`</div>`)});
  h.innerHTML=html.join('');h.style.setProperty('--rw',ROAD.length*30+60+'%');h.querySelectorAll('.claimB').forEach(b=>b.onclick=e=>{e.stopPropagation();claimRoad()});
  // 次の大きな報酬（次に仲間になるキャラ）
  const nc=ROAD.find((r,i)=>i>=got&&r.char);$('roadNext').innerHTML=nc?`<span class="rh">次の豪華報酬</span><span class="art" style="--rc:${RARC[BT[nc.char].rar]}">${pic(nc.char)}</span><span><b>🏆${nc.t}</b><small>${BT[nc.char].name}（${RARN[BT[nc.char].rar]}）</small></span>`:'';$('roadNext').style.display=nc?'':'none';
  $('roadWorlds').innerHTML=WORLDS.map((w,i)=>`<button class="${i===worldOf(tot)?'on':i<worldOf(tot)?'got':''}" data-w="${i}">${i+1}</button>`).join('');
  $('roadWorlds').querySelectorAll('button').forEach(b=>b.onclick=()=>{const t=+b.dataset.w*250,i=Math.max(0,ROAD.findIndex(r=>r.t>=t));const e=h.children[i];if(e)h.scrollTo({left:e.offsetLeft-h.clientWidth/2+e.clientWidth/2,behavior:'smooth'})});
  if(scroll){const e=h.children[Math.max(0,got)];if(e)requestAnimationFrame(()=>{h.scrollLeft=e.offsetLeft-h.clientWidth/2+e.clientWidth/2})}}
$('roadClose').addEventListener('click',()=>backHome());
// ================= ブロスタパス =================
function openPass(){openScr('passScr');drawPass(true)}
function drawPass(scroll){const b=bp(),t=bpTier(b),h=$('passList'),day=Date.now()/864e5-20300,left=(56-(day%56))*864e5;
  $('passSeason').textContent='シーズン'+BP_SEASON;$('passLeft').textContent='残り '+leftTxt(left);$('passGems').textContent=numTxt(gems());
  $('passXPT').textContent=t>=BP_T?'MAX':(b.xp%BP_XP)+'/'+BP_XP;$('passXP').style.width=(t>=BP_T?100:(b.xp%BP_XP)/BP_XP*100)+'%';$('passTier').textContent=t;
  const sb=BT_IDS[(BP_SEASON*7)%BT_IDS.length];
  $('psL').innerHTML=`<div class="art">${pic(sb,SKINS[sb][3])}</div>`+(b.prem?`<div class="pst tx">✔ ブロスタパス+有効</div>`:`<button class="go yel" id="passBuy"><span class="tx">ブロスタパス+</span><i>${ICON.gem}</i><span class="tx">${BP_COST}</span></button>`)+`<small class="tx" style="font-size:calc(var(--u)*2.4)">Tier ${t} / ${BP_T}</small>`;
  const pb=$('passBuy');if(pb)pb.onclick=bpBuy;
  const cell=(i,prem)=>{const r=bpReward(i,prem),L=prem?b.p:b.f,got=L.includes(i),can=i<=t&&!got&&(!prem||b.prem),ri=rewardIcon(r);
    return `<button class="psR${prem?'':' fr'}${got?' got':''}${can?' can':''}" data-i="${i}" data-p="${prem?1:0}"><span class="ri">${r.buf?ICON.buffy:ri.ic}</span><b class="tx">${r.buf?'バフィー':r.char?BT[r.char].name:ri.n||rewardTxt(r).split(' + ')[0]}</b>${got?`<i class="ck">${ICON.check}</i>`:''}${prem&&!b.prem?`<i class="lk">${ICON.lock}</i>`:''}</button>`};
  let html='';for(let i=1;i<=BP_T;i++)html+=`<div class="psC">${cell(i,true)}<span class="psN${i<=t?'':' off'} tx">${i}</span>${cell(i,false)}</div>`;h.innerHTML=html;h.style.setProperty('--tw',BP_T*31+8+'%');
  h.querySelectorAll('.psR').forEach(e=>e.onclick=()=>{const i=+e.dataset.i,pr=e.dataset.p==='1';if(e.classList.contains('can'))bpClaim(i,pr);else if(pr&&!b.prem)note('ブロスタパス+で受け取れます',1.8);else if(i>t)note('Tier '+i+' で受け取れます（バトルとクエストでXPがたまります）',2)});
  if(scroll){const e=h.children[Math.max(0,Math.min(BP_T-1,(b.f.length?Math.min(...[...Array(BP_T)].map((_,i)=>i+1).filter(i=>!b.f.includes(i))):1)-1))];if(e)requestAnimationFrame(()=>{h.scrollLeft=e.offsetLeft-20})}}
$('passClose').addEventListener('click',()=>backHome());
// ================= クエスト =================
function openQuests(){openScr('questScr');drawQuests()}
function drawQuests(){if(!$('questScr').classList.contains('on'))return;const now=new Date(),mid=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)-now,wk=((weekId()+1)*7-3)*864e5-Date.now();
  $('qDayT').textContent=leftTxt(mid);$('qSeaT').textContent=leftTxt(wk);const prem=bp().prem;
  const qic={win:modeIcon('ranked'),kills:modeIcon('knockout'),gems:modeIcon('gem'),dmg:ICON.spow,sup:ICON.skull,top3:modeIcon('br'),cube:ICON.box,ranked:modeIcon('ranked'),play:ICON.star,tro:ICON.trophy,again:ICON.buffy,heal:ICON.hyper};
  const card=(it,i,season)=>{const done=it.p>=it.n&&!it.got,lock=it.prem&&!prem;return `<div class="qC${done?' done':''}${it.got?' got':''}">${it.prem?'<span class="newT" style="left:calc(var(--u)*14);right:auto;top:calc(var(--u)*-2);background:#ffb514;color:#000">ブロスタパス限定</span>':''}`+
    `<span class="qi">${it.mode?modeIcon(it.mode):qic[it.k]||ICON.quest}</span><span class="qt tx">${qText(it)}${it.sub?'<br><small style="font-size:.85em">'+it.sub+'</small>':''}</span>`+
    `<span class="qb"><i style="width:${it.p/it.n*100}%"></i><b class="tx">${it.n>=10000?Math.floor(it.p/1000)+'k/'+it.n/1000+'k':it.p+'/'+it.n}</b></span><span class="qx"><i class="xpI">XP</i><b class="tx">${it.xp}</b></span>`+
    (it.got?`<i style="position:absolute;right:calc(var(--u)*2);top:calc(var(--u)*1.4);width:calc(var(--u)*6);height:calc(var(--u)*6)">${ICON.check}</i>`:done&&!lock?`<button class="go yel" data-q="${i}" data-s="${season?1:0}"><span class="tx">受け取る</span></button>`:'')+`</div>`};
  $('qDaily').innerHTML=quests().list.map((it,i)=>card(it,i,false)).join('');$('qSeason').innerHTML=squests().list.map((it,i)=>card(it,i,true)).join('');
  $('questScr').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>questClaim(+b.dataset.q,b.dataset.s==='1'))}
// ================= プロフィール =================
function openProfile(){openScr('profScr');drawProfile()}
function drawProfile(){const icon=LS('gr-icon','')&&BT[LS('gr-icon','')]?LS('gr-icon',''):PICK,s=stats(),tot=totalTr(),own=owned(),best=Math.max(+LS('gr-rpbest',0),RPts());
  $('pfAv').innerHTML=pic(icon);$('pfName').value=LS('gr-name','');$('pfTag').textContent=pTag()+'　レベル '+playerLv();
  const top=own.slice().sort((a,b)=>trophies(b)-trophies(a)),fav=top[0]||PICK,B=BT[fav];
  $('pfCard').style.setProperty('--rc',RARC[B.rar]);$('pfCard').innerHTML=`<span class="art">${pic(fav)}</span><span class="cb"><b class="tx">${myName().replace(/[<>&]/g,'')}</b><small>${B.name}使い・${B.role}</small></span>`;
  $('pfR').innerHTML=`<div class="pfBox pfTro"><span class="tic">${roadIcon(tot)}</span><span><small class="tx">トロフィー目標</small><span class="big"><i>${ICON.trophy}</i><b class="tx">${tot}</b></span><small class="tx">最高 ${Math.max(s.bestTr,tot)}</small></span></div>`+
    `<div class="pfBox"><h4 class="tx"><span>キャラクター</span><span>${own.length}/${BT_IDS.length}個入手済み</span></h4><div class="pfBr">${top.slice(0,10).map(id=>`<div style="--rc:${RARC[BT[id].rar]}">${pic(id)}<b class="tx">${trophies(id)}</b></div>`).join('')}</div></div>`+
    `<div class="pfBox pfSt"><div class="c"><h4 class="tx" style="margin:0">勝利数</h4><small>バトルロイヤル</small><span class="row"><i>${modeIcon('br')}</i><b class="tx">${s.wbr}</b></span><small>3対3 勝利数</small><span class="row"><i>${modeIcon('ranked')}</i><b class="tx">${s.w3}</b></span></div>`+
    `<div class="c"><h4 class="tx" style="margin:0">ガチバトル</h4><div style="display:flex;gap:calc(var(--u)*3)"><span class="c"><span class="emb">${emblem(rankOf(RPts()))}</span><small>現在</small><b class="tx">${RPts()}</b></span><span class="c"><span class="emb">${emblem(rankOf(best))}</span><small>最高</small><b class="tx">${best}</b></span></div></div></div>`+
    `<div class="pfBox pfSt"><div class="c"><small>最大連勝</small><b class="tx">${s.best}</b></div><div class="c"><small>プレイした試合</small><b class="tx">${s.games}</b></div></div>`;
  $('pfAv').onclick=()=>{const L=own,i=L.indexOf(icon);const n=L[(i+1)%L.length];LSset('gr-icon',n);drawProfile();SFX.gem()}}
$('pfName').addEventListener('change',e=>{LSset('gr-name',cleanName(e.target.value));drawProfile()});$('pfName').addEventListener('keydown',e=>e.stopPropagation());
// ================= バフィー（3人ずつのセット・クレーンゲーム） =================
const BTRIOS=[];{const ks=Object.keys(BUF);for(let i=0;i<ks.length;i+=3)BTRIOS.push(ks.slice(i,i+3))}
let BTRIO=0,BSEL=null;
const bufName={gad:'ガジェットバフィー',sp:'スターバフィー',hyper:'ハイパーバフィー'},bufIc={gad:ICON.gadget,sp:ICON.spow,hyper:ICON.hyper};
function openBuffy(id){openScr('bufScr');if(id){const i=BTRIOS.findIndex(t=>t.includes(id));if(i>=0){BTRIO=i;BSEL=[id,'gad']}}drawBuffy()}
function trioGot(t){return t.reduce((s,id)=>s+['gad','sp','hyper'].filter(k=>bufOwn(id)[k]).length,0)}
function giveBuffy(id,k){const b=J('gr-bf-'+id,{gad:false,sp:false,hyper:false});if(b[k])return false;b[k]=true;JS('gr-bf-'+id,b);return true}
function freeBuffy(){const all=[];for(const id of Object.keys(BUF))for(const k of['gad','sp','hyper'])if(!J('gr-bf-'+id,{})[k])all.push([id,k]);if(!all.length)return null;const [id,k]=all[Math.floor(Math.random()*all.length)];giveBuffy(id,k);popUnlock('バフィー！',BT[id].name+'の'+bufName[k],pic(id));return[id,k]}
function drawBuffy(){const t=BTRIOS[BTRIO]||BTRIOS[0];if(!BSEL||!t.includes(BSEL[0]))BSEL=[t[0],'gad'];$('bfPP').textContent=numTxt(pp());$('bfCoin').textContent=numTxt(coins());
  $('bfList').innerHTML=BTRIOS.map((tr,i)=>`<button class="bp bfTrio${i===BTRIO?' on':''}" data-t="${i}">${tr.map(id=>`<span>${pic(id)}${trioGot([id])===3?`<i>${ICON.check}</i>`:''}</span>`).join('')}</button>`).join('');
  $('bfList').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{BTRIO=+b.dataset.t;BSEL=null;SFX.gem();drawBuffy()});
  $('bfGrid').innerHTML=t.map(id=>`<span class="hd">${pic(id)}</span>`).join('')+['gad','sp','hyper'].map(k=>t.map(id=>{const has=bufOwn(id)[k];return `<button class="${has?'':'no'}${BSEL[0]===id&&BSEL[1]===k?' sel':''}" data-id="${id}" data-k="${k}"><i class="b">${bufIc[k]}</i>${has?`<i class="ck">${ICON.check}</i>`:''}</button>`}).join('')).join('');
  $('bfGrid').querySelectorAll('button').forEach(b=>b.onclick=()=>{BSEL=[b.dataset.id,b.dataset.k];SFX.gem();drawBuffy()});
  const got=trioGot(t);$('bfGot').textContent='入手済み：'+got+'/9';const free=bufFree();
  const balls=Array.from({length:14},(_,i)=>`<span class="ball" style="left:${(i*37)%86}%;bottom:${(i%3)*12+Math.floor(i/5)*6}%">${ICON.buffy}</span>`).join('');
  $('bfMach').innerHTML=`<div class="mach"><span class="top">${ICON.star}</span><div class="glass"><div class="claw" id="bfClaw"><svg viewBox="0 0 40 40"><path d="M6 4 L14 30 M34 4 L26 30 M20 0 V22" stroke="#4b5266" stroke-width="5" fill="none" stroke-linecap="round"/></svg></div>${balls}</div>`+
    (got>=9?`<b class="tx" style="margin-bottom:calc(var(--u)*3);font-size:calc(var(--u)*3.4)">ぜんぶ入手済み！</b>`:`<button class="go grn pay" id="bfPay">${free?'<span class="tx">無料！</span>':`<i>${ICON.pp}</i><span class="tx">${BUFCOST.pp}</span><span class="tx">+</span><i>${ICON.coin}</i><span class="tx">${BUFCOST.coins}</span>`}</button>`)+`</div>`;
  const pay=$('bfPay');if(pay)pay.onclick=()=>clawGo(t);
  // 右：選んだバフィーの説明
  const [id,k]=BSEL,B=BT[id],X=BUF[id],lv=level(id),o=kitOwn(id),has=bufOwn(id)[k],need=k==='hyper'?o.hyper:o[k].length>0;
  const txt=k==='gad'?B.gad.map((g,i)=>`<u>${g.name}</u>：${fmtLv(X.gad[i],lv)}`).join('<br>'):k==='sp'?B.sp.map((g,i)=>`<u>${g.name}</u>：${fmtLv(X.sp[i],lv)}`).join('<br>'):`ハイパーチャージが2秒長くなる<br><u>${B.hyper.name}</u>：${fmtLv(X.hyper,lv)}`;
  $('bfCards').innerHTML=`<div class="bfCard ${k}"><span class="pt">${pic(id)}</span><span class="bi">${bufIc[k]}</span><b class="tx">${B.name}の<br>${bufName[k]}</b><p>${txt}</p>`+
    (has?`<span class="need tx"><i>${ICON.check}</i>入手済み（自動で装備）</span>`:'')+(!need?`<span class="need tx"><i>${ICON.lock}</i>${B.name}の${k==='gad'?'ガジェット':k==='sp'?'スターパワー':'ハイパーチャージ'}が必要です</span>`:'')+`</div>`}
function clawGo(t){const free=bufFree();if(!free&&(pp()<BUFCOST.pp||coins()<BUFCOST.coins)){note('パワーポイントかコインが足りません',2);return}
  const pool=[];for(const id of t)for(const k of['gad','sp','hyper'])if(!bufOwn(id)[k])pool.push([id,k]);if(!pool.length)return;
  if(free)LSset('gr-bffree','1');else{addPP(-BUFCOST.pp);addCoins(-BUFCOST.coins)}const [id,k]=pool[Math.floor(Math.random()*pool.length)];
  const cl=$('bfClaw'),pay=$('bfPay');if(pay)pay.disabled=true;cl.classList.add('down');SFX.gem();
  setTimeout(()=>{cl.classList.remove('down');tn(523,.15,.12,'triangle');setTimeout(()=>{giveBuffy(id,k);BSEL=[id,k];SFX.superReady();try{fxSlam(bufName[k]+'！','#ff9ad5',BT[id].name);confetti(VW()/2,VH()*.5,60)}catch(e){}drawBuffy();drawHome()},650)},700)}
// ================= ショップ =================
function openShop(){openScr('shopScr');drawShop()}
function shopDay(){const d=new Date().toDateString();let s=J('gr-shop',null);if(!s||s.day!==d){s={day:d,bought:[]};JS('gr-shop',s)}return s}
function drawShop(){const S=shopDay(),day=Math.floor(Date.now()/864e5);$('shPP').textContent=numTxt(pp());$('shCoin').textContent=numTxt(coins());$('shGem').textContent=numTxt(gems());
  const items=[];const it=(sec,key,o)=>items.push(Object.assign({sec,key},o));
  // デイリーディール（毎日入れかわる）
  const gift=[{pp:25,n:'パワーポイント',ic:ICON.pp},{coins:60,n:'コイン',ic:ICON.coin},{drop:1,n:'スタードロップ',ic:ICON.star}][day%3];
  it('デイリーディール','free',{name:'無料ギフト',r:gift,cost:null,cl:'g',ic:gift.ic,amt:(gift.pp||gift.coins||gift.drop),tag:'無料'});
  it('デイリーディール','d1',{name:'パワーポイント',r:{pp:200},cost:{coins:300},cl:'p',ic:ICON.pp,amt:200,tag:'お得'});
  it('デイリーディール','d2',{name:'スタードロップ',r:{drop:2},cost:{gems:19},cl:'v',ic:ICON.star,amt:2});
  // 資源
  it('資源','c1',{name:'コイン',r:{coins:300},cost:{gems:30},cl:'y',ic:ICON.coin,amt:300,many:1});it('資源','c2',{name:'コイン',r:{coins:1200},cost:{gems:99},cl:'y',ic:ICON.coin,amt:1200,many:1});
  it('資源','p1',{name:'パワーポイント',r:{pp:250},cost:{gems:25},cl:'p',ic:ICON.pp,amt:250,many:1});it('資源','p2',{name:'パワーポイント',r:{pp:1000},cost:{gems:89},cl:'p',ic:ICON.pp,amt:1000,many:1});
  it('資源','s1',{name:'スタードロップ',r:{drop:5},cost:{gems:45},cl:'v',ic:ICON.star,amt:5,many:1});it('資源','g1',{name:'ジェム',r:{gems:10},cost:{coins:500},cl:'g',ic:ICON.gem,amt:10,many:1});
  // スキン（持っているキャラのまだ持っていないスキン、毎日6つ）
  const sk=[];for(const id of owned())for(const s of SKINS[id])if(s.gem&&!skinsOwned(id).includes(s.id))sk.push([id,s]);sk.sort((a,b)=>hash2(BT_IDS.indexOf(a[0])+day,a[1].rar)-hash2(BT_IDS.indexOf(b[0])+day,b[1].rar));
  for(const [id,s] of sk.slice(0,6))it('スキン','sk-'+id+'-'+s.id,{name:BT[id].name+'\n'+s.name,skin:[id,s.id],cost:{gems:s.gem},cl:'',ic:pic(id,s),amt:'',once:1});
  if(!bp().prem)it('ブロスタパス','bp',{name:'ブロスタパス+',cost:{gems:BP_COST},cl:'y',ic:ICON.pass,amt:'',pass:1});
  const secs=[...new Set(items.map(i=>i.sec))];
  $('shopList').innerHTML=secs.map(sec=>{const L=items.filter(i=>i.sec===sec);return `<div class="shSec"><h3 class="tx">${sec}</h3><div class="shItems${L.length<=2?' one':''}">`+L.map(i=>{const sold=!i.many&&S.bought.includes(i.key),c=i.cost;
    return `<div class="shI ${i.cl}${sold?' sold':''}">${i.tag?`<span class="tag tx">${i.tag}</span>`:''}<b class="tx">${i.name.replace('\n','<br>')}</b><span class="ii">${i.ic}</span>${i.amt!==''?`<b class="tx">×${i.amt}</b>`:''}`+
      `<button class="go ${c?'grn':'yel'}" data-k="${i.key}" ${sold?'disabled':''}>${sold?'<span class="tx">購入済み</span>':c?`<i>${c.gems?ICON.gem:c.coins?ICON.coin:ICON.pp}</i><span class="tx">${c.gems||c.coins||c.pp}</span>`:'<span class="tx">無料</span>'}</button></div>`}).join('')+`</div></div>`}).join('');
  $('shopList').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const i=items.find(x=>x.key===b.dataset.k);if(!i)return;const c=i.cost||{};
    if(c.gems&&gems()<c.gems){note('ジェムが足りません',1.6);return}if(c.coins&&coins()<c.coins){note('コインが足りません',1.6);return}if(c.pp&&pp()<c.pp){note('パワーポイントが足りません',1.6);return}
    if(i.pass){bpBuy();drawShop();return}if(c.gems)addGems(-c.gems);if(c.coins)addCoins(-c.coins);if(c.pp)addPP(-c.pp);
    if(i.skin)giveSkin(i.skin[0],i.skin[1]);else giveReward(i.r);if(!i.many){const S2=shopDay();S2.bought.push(i.key);JS('gr-shop',S2)}SFX.superReady();try{confetti(VW()/2,VH()*.5,30)}catch(e){}drawShop();drawHome()})}
// ================= トレーニング（動かない的を相手に練習） =================
MODES.training={name:'トレーニング場',ic:'🎯',map:'gem',resp:1.5,time:0,hidden:true,d:'的あて'};
function startTraining(id){initAudio();if(!isOwned(id))id=PICK;clearMatch();G.rule='training';G.mode='team';G.ranked=false;G.friendly=true;G.diff=0;buildArena('valley','training');hideScreens();document.body.classList.add('playing');document.body.classList.remove('br','tut');
  Object.assign(G,{t:0,mineT:999,time:0,cd:null,cdTeam:-1,state:'intro',introT:1.2,over:false,shake:0,endT:0,supWas:false,safeR:999,poisonT:0,place:0,brDead:0,specExit:0});
  G.me=mkUnit(id,0,true,'あなた',[0,HALFZ-8],level(id),skinOf(id),myKit(id));G.units.push(G.me);
  [[-6,-2],[0,-6],[6,-2]].forEach(([x,z],i)=>{const d=mkUnit(['riki','gai','jack'][i],1,false,'まと',[x,z],level(id),null);d.dummy=true;G.units.push(d)});
  for(const u of G.units)mkLabel(u);G.M={};ZOOM=1;camP.set(G.me.x,0,G.me.z);G._vsNote='トレーニング場：ポーズ（Ⅱ）からいつでも終われます';note(G._vsNote,3)}
