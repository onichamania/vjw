// ===================== 画面（HUD・メニュー・お店・機械・会話） =====================
let uiDirtyF=true;function uiDirty(){uiDirtyF=true}
const CNAME={w:'白い',r:'赤い',b:'青い'};
// ---- HUD ----
let hudT=0,lastBuffKey='';
function updHud(dt){hudT-=dt;
  $('honey').textContent='🍯 '+fmt(ST.honey);const cap=capacity();$('pbar').querySelector('i').style.width=Math.min(100,ST.pollen/cap*100)+'%';$('pbar').querySelector('span').textContent=fmt(ST.pollen)+' / '+fmt(cap);$('pbar').classList.toggle('full',ST.pollen>=cap);
  const hpOn=PL.hp<PL.maxHp;$('hp').style.display=hpOn?'block':'none';if(hpOn)$('hp').firstChild.style.width=PL.hp/PL.maxHp*100+'%';
  if(hudT<=0){hudT=.25;const bs=[];for(const k in ST.buffs){const b=ST.buffs[k];if(b.until<G.t){delete ST.buffs[k];continue}bs.push([k,b])}
    const key=bs.map(([k,b])=>k+b.n+Math.ceil(b.until-G.t)).join();if(key!==lastBuffKey){lastBuffKey=key;$('buffs').innerHTML=bs.map(([k,b])=>{const d=BUFFS[k];return `<div class="bf" title="${d.jp}：${d.d}">${d.ic}${b.n>1?'<b>×'+b.n+'</b>':''}<u style="width:${clamp((b.until-G.t)/b.dur,0,1)*100}%"></u></div>`}).join('')
      +(G.field&&fieldBoost(G.field)?`<div class="bf" title="フィールドブースト">🌼<b>+${fieldBoost(G.field)*100}%</b></div>`:'')+(G.markP?`<div class="bf" title="花粉マーク">🎯<b>×${(1+.5*G.markP).toFixed(1)}</b></div>`:'')}
    recalcIfBuffChanged()}
  if(bigT>0){bigT-=dt;if(bigT<=0)$('big').style.display='none'}}
let lastBuffSig='';function recalcIfBuffChanged(){const s=Object.keys(ST.buffs).map(k=>k+ST.buffs[k].n).join();if(s!==lastBuffSig){lastBuffSig=s;calcStats()}}
function zoneText(){$('zone').textContent=G.field?'🌼 '+FIELDS[G.field].jp:PL.inRoom?'🚪 '+ROOMS[PL.inRoom].jp:''}
// 近くの「E」
let nearI=null;
function updPrompt(){let best=null,bd=1e9;
  const pad=HIVES[MY_HIVE];const onPad=Math.hypot(PL.x-pad.x,PL.z-HIVE_PADZ)<2.7&&PL.y<1.2;
  if(onPad)best={label:()=>G.converting?'ハチミツ作りをやめる':'ハチミツを作る',act:()=>{G.converting=!G.converting;if(G.converting){note('🍯 ハチミツを作っています…');calcStats()}}},bd=0;
  else if(G.converting&&!onPad){G.converting=false}
  if(!best)for(const o of INTER){const d=Math.hypot(PL.x-o.x,PL.z-o.z);if(d<o.r&&Math.abs(PL.y-o.y)<4&&d<bd){bd=d;best=o}}
  nearI=best;const p=$('prompt');if(best&&!PL.dead&&!panelOpen()&&$('dlg').style.display!=='block'){const t=(touchMode?'':'<kbd>E</kbd>')+best.label();if(p.innerHTML!==t)p.innerHTML=t;p.style.display='block';$('tUse').style.display=touchMode?'flex':'none'}else{p.style.display='none';$('tUse').style.display='none'}
  if(G.converting&&ST.pollen<=0){G.converting=false;note('🍯 ハチミツができた！')}}
function interact(){if(panelOpen()||$('dlg').style.display==='block')return;if(nearI)nearI.act()}
// ---- パネル ----
let PAN=null;
function panelOpen(){return $('dim').classList.contains('on')}
function openPanel(id,title,tabs,render,tab){PAN={id,title,tabs,render,tab:tab||(tabs&&tabs[0]&&tabs[0][0]),sel:null};$('dim').classList.add('on');drawPanel()}
function drawPanel(){if(!PAN)return;$('pt').textContent=PAN.title;$('ptabs').innerHTML=(PAN.tabs||[]).map(([k,t])=>`<div class="tab${k===PAN.tab?' on':''}" data-t="${k}">${t}</div>`).join('');
  $('ptabs').querySelectorAll('.tab').forEach(e=>e.onclick=()=>{PAN.tab=e.dataset.t;PAN.sel=null;drawPanel()});const st=$('pb').scrollTop;$('pb').innerHTML='';PAN.render($('pb'),PAN);$('pb').scrollTop=st}
function closePanel(){$('dim').classList.remove('on');PAN=null;hideDlg()}
$('px').onclick=closePanel;$('dim').addEventListener('click',e=>{if(e.target.id==='dim')closePanel()});
function togglePanel(id){if(PAN&&PAN.id===id){closePanel();return}const f=PANELS[id];if(f)f()}
document.querySelectorAll('#menu .mb').forEach(e=>e.addEventListener('click',()=>togglePanel(e.dataset.p)));
const H=(t,a)=>{const d=document.createElement(t);if(a)Object.assign(d,a);return d};
function itemCost(price,items){const parts=[];if(price)parts.push('🍯'+fmt(price));for(const k in items||{}){const it=ITEMS[k];const ok=inv(k)>=items[k];parts.push(`<span style="color:${ok?'#9aff9a':'#ff8a8a'}">${it?it.ic:''}${it?it.jp:k}×${fmt(items[k])}</span>`)}return parts.join(' ')||'無料'}
const PANELS={
 inv(){openPanel('inv','🎒 持ち物',[['all','すべて'],['egg','卵・ゼリー'],['treat','おやつ'],['use','使える物'],['mat','素材']],(el,p)=>{
   const ids=Object.keys(ST.inv).filter(k=>ST.inv[k]>0&&ITEMS[k]).filter(k=>{const it=ITEMS[k];return p.tab==='all'||(p.tab==='egg'&&(it.egg||it.jelly))||(p.tab==='treat'&&it.bond)||(p.tab==='use'&&it.use)||(p.tab==='mat'&&!it.egg&&!it.jelly&&!it.bond&&!it.use)});
   el.appendChild(H('div',{className:'small',textContent:'🎟️ チケット '+fmt(inv('ticket'))+'　／　⚔️ バトルポイント '+fmt(ST.st.bp)}));
   const g=H('div',{className:'grid'});el.appendChild(g);if(!ids.length)g.innerHTML='<div class="small">なにもありません</div>';
   for(const k of ids){const it=ITEMS[k],c=H('div',{className:'it'+(p.sel===k?' sel':'')});c.innerHTML=`<div class="ic">${it.ic}</div><div class="nm">${it.jp}</div><div class="ct">×${fmt(ST.inv[k])}</div><div class="ds">${it.d}</div>`;c.onclick=()=>{p.sel=k;drawPanel()};g.appendChild(c)}
   if(p.sel&&inv(p.sel)>0){const it=ITEMS[p.sel],box=H('div',{className:'row'});box.style.marginTop='10px';el.appendChild(box);
     if(it.egg||it.jelly||it.bond)box.appendChild(btn('🐝 ハイブで使う（ハチをえらぶ）',()=>{PANELS.bees(p.sel)}));
     if(it.use)box.appendChild(btn('使う',()=>{useItem(p.sel);drawPanel()}))}})},
 bees(useItem_){openPanel('bees','🐝 ハチ（ハイブ）',null,(el,p)=>{
   const n=beeCount();el.appendChild(H('div',{className:'small',innerHTML:`ハチ ${n} / ${ST.slots}　・見つけた種類 ${ST.disc.length} / ${BEE_IDS.length}　・ハチの数で通れるゲートが増えます`}));
   if(p.use===undefined)p.use=useItem_||null;
   // 持ち物から使う物をえらぶ
   const usable=Object.keys(ST.inv).filter(k=>ST.inv[k]>0&&ITEMS[k]&&(ITEMS[k].egg||ITEMS[k].jelly||ITEMS[k].bond));
   const ub=H('div',{className:'row'});ub.innerHTML='<b>使う物：</b>';for(const k of usable){const b=btn(ITEMS[k].ic+ITEMS[k].jp+'×'+fmt(inv(k)),()=>{p.use=p.use===k?null:k;drawPanel()},p.use===k?'':'d');ub.appendChild(b)}if(!usable.length)ub.innerHTML+='<span class="small">（卵・おやつ・ゼリーがあるとここに出ます）</span>';el.appendChild(ub);
   if(p.use&&inv(p.use)>0){const it=ITEMS[p.use];el.appendChild(H('div',{className:'small',innerHTML:`👉 ${it.ic}${it.jp}を使うマスをタップしてください（${it.egg?'空いているマスで新しいハチ、ハチのいるマスは種類が変わります':it.jelly?'ハチの種類が変わります（レベルはそのまま）':'きずなが上がります'}）`}))}
   const hv=H('div',{className:'hive'});el.appendChild(hv);
   for(let r=Math.ceil(ST.slots/5)-1;r>=0;r--)for(let c=0;c<5;c++){const i=r*5+(4-c);if(i>=ST.slots){hv.appendChild(H('div'));continue}const d=ST.hive[i],cell=H('div',{className:'cell'+(d?'':' empty')+(p.sel===i?' sel':'')});
     if(d){const B=BEES[d.t];cell.style.background=RARITY_COL[B.rar];cell.innerHTML=`<span class="lv">Lv${d.lv}</span><img class="fc" src="${beeFaceURL(d.t)}" alt="">${d.g?'<span class="gf">★</span>':''}${(BEELIST.find(b=>b.slot===i)||{}).sleep>0?'<span class="zz">💤</span>':''}`}
     else cell.innerHTML='<span style="opacity:.6">＋</span>';
     cell.onclick=()=>{if(p.use){applyItem(p.use,i);drawPanel();return}p.sel=i;drawPanel()};hv.appendChild(cell)}
   if(p.sel!=null&&ST.hive[p.sel]){const d=ST.hive[p.sel],B=BEES[d.t],b={slot:p.sel};const need=bondForLv(d.lv+1)-bondForLv(d.lv),have=d.bond-bondForLv(d.lv);
     const info=H('div');info.style.marginTop='40px';info.innerHTML=`<h3 style="margin:4px 0">${d.g?'★ ':''}${B.jp} <span class="small">（${RARITY_JP[B.rar]}・${B.col==='w'?'色なし':B.col==='r'?'赤':'青'}）</span></h3>
       <div class="small">レベル ${d.lv}　きずな ${fmt(have)} / ${d.lv>=25?'MAX':fmt(need)}</div>
       <div class="stat"><span>エネルギー</span><b>${B.energy>1e9?'無限':Math.round(beeEnergyD(d))}</b><span>速さ</span><b>${(beeSpdD(d)*4).toFixed(1)}</b><span>攻撃</span><b>${beeAtkD(d).toFixed(1)}</b>
       <span>集める</span><b>${fmt(beeGatD(d))}花粉 / ${B.gt}秒</b><span>変換</span><b>${fmt(beeConvD(d))}ハチミツ / ${B.ct}秒</b>
       <span>能力</span><b>${B.tok.map(t=>{const g=t.endsWith('@g'),k=g?t.slice(0,-2):t;return TOK_INFO[k]?TOK_INFO[k][1]+TOK_INFO[k][0]+(g?'（ギフテッド）':''):k}).join('・')||'なし'}</b>
       <span>好きなフィールド</span><b>${B.likes.map(f=>FIELDS[f].jp).join('・')||'なし'}</b><span>きらいなフィールド</span><b>${B.dislikes.map(f=>FIELDS[f].jp).join('・')||'なし'}</b>
       <span>好物</span><b>${B.fav?ITEMS[B.fav].ic+ITEMS[B.fav].jp:'なし'}</b><span>ギフテッドのボーナス</span><b>${B.gift}${d.g?'（有効）':''}</b>${B.pas?`<span>パッシブ</span><b>${B.pas}</b>`:''}</div>`;el.appendChild(info);
     const row=H('div',{className:'row'});for(const k of['treat',B.fav,'royaljelly','starjelly','startreat'].filter((x,i,a)=>x&&a.indexOf(x)===i&&inv(x)>0)){const it=ITEMS[k];
       if(it.bond){row.appendChild(btn(it.ic+it.jp+'を1こ',()=>{feed(k,p.sel,1);drawPanel()},'d'));if(inv(k)>=10)row.appendChild(btn('×10',()=>{feed(k,p.sel,10);drawPanel()},'d'));
         row.appendChild(btn('レベルアップまで',()=>{const nb=Math.ceil((bondForLv(d.lv+1)-d.bond)/(it.bond*(B.fav===k?2:1)*(1+P.bondTreat/100)));feed(k,p.sel,Math.max(1,nb));drawPanel()},'d'))}
       else row.appendChild(btn(it.ic+it.jp+'を使う',()=>{applyItem(k,p.sel);drawPanel()},'d'))}el.appendChild(row)}})},
 quest(){openPanel('quest','📜 クエスト',null,(el)=>{let any=0;for(const k of['black','mother','brown','panda','science','polar']){const q=ST.q[k];if(!q||!q.cur)continue;any=1;
   const box=H('div',{className:'it'});box.style.marginBottom='8px';box.innerHTML=`<div class="nm">${BEARS[k].jp}：${q.cur.name}</div>`+q.cur.req.map((r,i)=>{const [v,n]=reqProg(r,q.cur.s0[i]);return `<div class="small">${v>=n?'✅':'⬜'} ${reqText(r)}　${fmt(Math.min(v,n))} / ${fmt(n)}</div><div style="height:6px;background:#0004;border-radius:3px;overflow:hidden"><i style="display:block;height:100%;width:${Math.min(100,v/n*100)}%;background:#5fd36a"></i></div>`}).join('')
     +`<div class="small" style="margin-top:4px">ごほうび：${rewText(q.cur.rw)}</div>`;el.appendChild(box)}
   if(!any)el.innerHTML='<div class="small">受けているクエストはありません。クマに話しかけてクエストをもらおう（ブラックベアはハイブのそば、マザーベアはヒマワリ畑の奥）。</div>'})},
 gear(){openPanel('gear','🧢 装備',Object.entries(SLOTS),(el,p)=>{const sl=p.tab;const list=sl==='tool'?TOOLS:sl==='bag'?BAGS:Object.fromEntries(Object.entries(GEAR).filter(([k,g])=>g.slot===sl));
   el.appendChild(H('div',{className:'small',textContent:'持っている物をえらんで装備します。お店で買うと自動で装備されます。'}));const g=H('div',{className:'grid'});el.appendChild(g);
   const own=Object.keys(list).filter(k=>ST.own[k]);if(sl!=='tool'&&sl!=='bag'){const c=H('div',{className:'it'+(!ST.equip[sl]?' sel':'')});c.innerHTML='<div class="ic">✖</div><div class="nm">はずす</div>';c.onclick=()=>{equip(sl,null);drawPanel()};g.appendChild(c)}
   for(const k of own){const it=list[k],c=H('div',{className:'it'+(ST.equip[sl]===k?' sel':'')});c.innerHTML=`<div class="nm">${it.jp}</div><div class="ds">${it.d}</div><div class="ds">${statText(it.st)}</div>`;c.onclick=()=>{equip(sl,k);drawPanel()};g.appendChild(c)}
   if(!own.length)g.innerHTML+='<div class="small">まだ持っていません</div>'})},
 stats(){calcStats();openPanel('stats','📊 能力',null,(el)=>{const r=[['容量',fmt(capacity())],['変換速度',`+${Math.round(P.conv)}% ×${P.convMul.toFixed(2)}`],['ハイブでの変換',`×${P.hiveMul.toFixed(2)}`],['すぐ変換',`${P.ic}%（白${P.icW}%・赤${P.icR}%・青${P.icB}%）`],
   ['花粉',`+${P.pollen}% ×${P.pollenMul.toFixed(2)}`],['白い花粉',`+${P.white}% ×${P.whiteMul.toFixed(2)}`],['赤い花粉',`+${P.red}% ×${P.redMul.toFixed(2)}`],['青い花粉',`+${P.blue}% ×${P.blueMul.toFixed(2)}`],
   ['ハチが集める花粉',`+${P.beeGather}% ×${P.beeGatherMul.toFixed(2)}`],['道具の花粉',`+${P.tool}% ×${P.toolMul.toFixed(2)}`],['ボムの花粉',`+${P.bomb}%`],['ハチの能力の出やすさ',`+${P.ability}%`],
   ['ハチの攻撃',`+${P.atk}（色なし+${P.atkW}・赤+${P.atkR}・青+${P.atkB}）+${P.atkPct}%`],['会心率',P.crit+'%'],['会心のダメージ','+'+P.critPow+'%'],['防御',P.def+'%'],['移動速度',(walkSpeed()*4).toFixed(1)],['ジャンプ',50+P.jump],
   ['運（ドロップ）','+'+P.loot+'%'],['トークンのハチミツ','+'+P.hft+'% ×'+P.hftMul.toFixed(2)],['ハチの変換量','+'+P.convAmt],['ハチのエネルギー','×'+P.energyMul.toFixed(2)],['歩いて集める',P.moveColl],
   ['サイエンスベアの強化',ST.sci+'（変換+'+25*ST.sci+'%）'],['ポーラーパワー',ST.polar+'（エネルギー×'+Math.pow(1.05,ST.polar).toFixed(2)+'）'],['タビーラブ',ST.tabby||0],['集めた花粉（合計）',fmt(ST.st.pollen)],['作ったハチミツ（合計）',fmt(ST.st.honey)]];
   el.innerHTML='<div class="stat">'+r.map(([a,b])=>`<span>${a}</span><b>${b}</b>`).join('')+'</div>'})},
 map(){openPanel('map','🗺️ 地図',null,(el)=>{const c=H('canvas');c.width=600;c.height=Math.round(600*(WB.z1-WB.z0)/(WB.x1-WB.x0));c.style.cssText='display:block;margin:0 auto;max-width:100%;max-height:60vh';el.appendChild(c);const g=c.getContext('2d');
   const X0=WB.x0,X1=WB.x1,Z0=WB.z0,Z1=WB.z1,sx=x=>(x-X0)/(X1-X0)*c.width,sz=z=>(z-Z0)/(Z1-Z0)*c.height;g.fillStyle='#63c247';g.fillRect(0,0,c.width,c.height);
   for(const [x0,x1,z0,z1,y,st] of PLAT){g.fillStyle='#'+PSTY[st].top.toString(16).padStart(6,'0');g.globalAlpha=1;g.fillRect(sx(x0),sz(z0),sx(x1)-sx(x0),sz(z1)-sz(z0))}
   for(const id in FIELDS){const f=FIELDS[id],ok=beeCount()>=f.zone;g.fillStyle=f.fc==='r'?'#e86a5a':f.fc==='b'?'#5a8ae8':f.fc==='w'?'#f4f0e0':'#c8a0e0';g.globalAlpha=ok?1:.45;g.fillRect(sx(f.x-f.w/2),sz(f.z-f.h/2),f.w/(X1-X0)*c.width,f.h/(Z1-Z0)*c.height);g.globalAlpha=1;
     g.fillStyle='#111';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText(f.jp+(f.zone?'('+f.zone+')':''),sx(f.x),sz(f.z)+4)}
   for(let k=0;k<6;k++){g.fillStyle=k===MY_HIVE?'#ffd84a':'#c89040';g.fillRect(sx(HIVE_X(k))-4,sz(HIVE_Z)-3,8,6)}
   for(const id in SHOPS){const s=SHOPS[id];g.fillStyle='#fff';g.fillRect(sx(s.x)-3,sz(s.z)-3,6,6)}for(const id in BEARS){const b=BEARS[id];g.fillStyle='#3a2a1a';g.beginPath();g.arc(sx(b.x),sz(b.z),4,0,TAU);g.fill()}
   for(const gt of GATES){g.fillStyle=beeCount()>=gt.n?'#9aff9a':'#ffb020';g.fillRect(sx((gt.x0+gt.x1)/2)-6,sz((gt.z0+gt.z1)/2)-6,12,12);g.fillStyle='#000';g.fillText(gt.n,sx((gt.x0+gt.x1)/2),sz((gt.z0+gt.z1)/2)+4)}
   g.fillStyle='#ff2a2a';g.beginPath();g.arc(sx(PL.x),sz(PL.z),6,0,TAU);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();const fx=-Math.sin(CAM.yaw),fz=-Math.cos(CAM.yaw),px=sx(PL.x),pz=sz(PL.z);g.beginPath();g.moveTo(px+fx*16,pz+fz*16);g.lineTo(px-fz*6+fx*6,pz+fx*6+fz*6);g.lineTo(px+fz*6+fx*6,pz-fx*6+fz*6);g.closePath();g.fillStyle='#fff';g.fill();
   el.appendChild(H('div',{className:'small',textContent:'上が山の方（ハイブの反対）。赤い点＝自分。フィールドの（数字）はそこへ行くのに必要なハチの数。黄色い四角＝ゲート、白い点＝お店、こげ茶の点＝クマ。'}))})},
 set(){openPanel('set','⚙️ 設定',null,(el)=>{
   const row=(t,b)=>{const r=H('div',{className:'row'});r.innerHTML='<span style="min-width:120px">'+t+'</span>';r.appendChild(b);el.appendChild(r)};
   row('音',btn(SET.sound?'オン':'オフ',()=>{SET.sound=!SET.sound;LSset('bss-sound',SET.sound?'1':'0');drawPanel()},'d'));
   const v=H('input',{type:'range',min:0,max:1,step:.05,value:SET.vol});v.oninput=()=>{SET.vol=+v.value;LSset('bss-vol',v.value)};row('音量',v);
   row('かげ',btn(SET.shadow?'オン':'オフ',()=>{SET.shadow=!SET.shadow;LSset('bss-shadow',SET.shadow?'1':'0');renderer.shadowMap.enabled=SET.shadow;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true});drawPanel()},'d'));
   el.appendChild(H('div',{className:'small',innerHTML:`<b>操作</b><br>パソコン：WASDで移動、スペースでジャンプ（空中でもう一度押すとパラシュート/グライダー）、左クリック長押しで道具、右ドラッグで見回す、ホイールでズーム、Eで話す・使う、I=持ち物・B=ハチ・Q=クエスト<br>スマホ：左のスティックで移動、右側をなぞって見回す、2本指でズーム、🥄ボタンで道具、Eボタンで話す・使う<br><br>
     <b>遊び方</b>：フィールドで花粉を集めて、カバンがいっぱいになったらハイブの前の黄色い台でハチミツを作ろう。ハチミツで道具やカバンを買い、卵でハチを増やすと、ゲートの先の新しいフィールドに行けます。<br>
     本家の数値（ハチ46種・道具・カバン・装備・敵・クエスト）はBee Swarm Simulator Wikiに合わせています。ビースマスなどのイベントは入れていません。`}));
   el.appendChild(H('div',{style:'height:10px'}));
   const rb=btn('データをリセット（最初から）',()=>{if(rb.dataset.ok){resetSave()}else{rb.dataset.ok=1;rb.textContent='もう一度押すとリセット'}},'r');el.appendChild(rb)})}};
function btn(t,f,cls){const b=H('button',{className:'btn '+(cls||''),innerHTML:t});b.onclick=e=>{e.stopPropagation();f()};return b}
const STNAME={cap:'容量+',capMul:'容量×',conv:'変換速度+%',hiveMul:'ハイブでの変換×',ic:'すぐ変換+%',icW:'白すぐ変換+%',icR:'赤すぐ変換+%',icB:'青すぐ変換+%',icFlame:'炎すぐ変換+%',pollen:'花粉+%',white:'白い花粉+%',red:'赤い花粉+%',blue:'青い花粉+%',
 whiteMul:'白い花粉×',redMul:'赤い花粉×',blueMul:'青い花粉×',beeGather:'ハチの花粉+%',bomb:'ボムの花粉+%',redBomb:'赤ボム+%',blueBomb:'青ボム+%',bubbleMul:'泡の花粉×',ability:'能力の出やすさ+%',def:'防御+%',ms:'移動速度+',msMul:'移動速度×',jump:'ジャンプ+',moveColl:'歩いて集める+',
 atk:'ハチの攻撃+',atkW:'色なしの攻撃+',atkR:'赤の攻撃+',atkB:'青の攻撃+',atkPct:'ハチの攻撃+%',atkRpct:'赤の攻撃+%',crit:'会心率+%',critPow:'会心ダメージ+%',loot:'運+%',hft:'トークンのハチミツ+%',convAmt:'変換量+',beeMs:'ハチの速さ+%',glide:'グライダー'};
function statText(st){return Object.entries(st||{}).map(([k,v])=>{const n=STNAME[k]||k;if(n.endsWith('×'))return n+v;if(n.endsWith('+%'))return n.slice(0,-1)+(Number.isInteger(v)?v:v.toFixed(1))+'%';return n+fmt(v)}).join('・')}
// ---- 装備する ----
function equip(slot,id){if(id&&!ST.own[id])return;ST.equip[slot]=id;calcStats();refreshLook();save()}
// ---- お店 ----
function shopItems(id){const L=[];for(const [k,t] of Object.entries(TOOLS))if(t.shop===id)L.push(['tool',k,t]);for(const [k,b] of Object.entries(BAGS))if(b.shop===id)L.push(['bag',k,b]);for(const [k,g] of Object.entries(GEAR))if(g.shop===id)L.push([g.slot,k,g]);return L}
function openShop(id){const S=SHOPS[id];
  if(S.need==='blue4'&&discColor('b')<4){note('🔵 青いハチを4種類見つけるとブルーHQに入れます（いま'+discColor('b')+'種類）','#9ac8ff');return}
  if(S.need==='red4'&&discColor('r')<4){note('🔴 赤いハチを4種類見つけるとレッドHQに入れます（いま'+discColor('r')+'種類）','#ff9a8a');return}
  openPanel('shop:'+id,'🛒 '+S.jp+'（'+S.keeper+'）',null,(el)=>{const L=shopItems(id);
   if(id==='mtn'){const n=ST.slots-25,price=slotCost(n);const c=H('div',{className:'it'});c.innerHTML=`<div class="nm">🍯 ハイブのスロット（${ST.slots}→${ST.slots+1}）</div><div class="ds">ハチをもう1匹入れられる。最大50</div><div class="ds cost">🍯${fmt(price)}</div>`;
     if(ST.slots<50)c.appendChild(btn('買う',()=>{if(pay(price)){ST.slots++;ST.cnt.slot++;SFX.buy();note('🍯 ハイブのスロットがふえた（'+ST.slots+'）');syncBees();save();drawPanel()}else note('ハチミツがたりない','#ff8a8a')}));el.appendChild(c)}
   const g=H('div',{className:'grid'});el.appendChild(g);
   for(const [slot,k,it] of L){const own=!!ST.own[k],eq=ST.equip[slot]===k,c=H('div',{className:'it'+(eq?' sel':'')});
     c.innerHTML=`<div class="nm">${it.jp}</div><div class="small">${SLOTS[slot]}</div><div class="ds">${it.d}</div>${it.st?'<div class="ds">'+statText(it.st)+'</div>':''}<div class="ds">${own?'<b>持っている</b>':itemCost(it.price,it.items)}</div>`+(it.need?'<div class="ds" style="color:#ff9a8a">必要：'+(it.need==='giftedbucko250'?'ギフテッドバッコビーのクエスト250回':'ギフテッドライリービーのクエスト250回')+'（この版では未実装）</div>':'');
     if(own)c.appendChild(btn(eq?'装備中':'装備する',()=>{equip(slot,k);drawPanel()},eq?'d':'g'));
     else c.appendChild(btn('買う',()=>{if(it.need){note('この道具の条件はこの版ではまだ満たせません','#ff9a8a');return}if(pay(it.price,it.items)){ST.own[k]=1;equip(slot,k);SFX.buy();note('🛒 '+it.jp+'を買った！');drawPanel()}else note('ハチミツか素材がたりない','#ff8a8a')}));
     g.appendChild(c)}})}
function slotCost(n){if(n<SLOT_COST.length)return SLOT_COST[n];return Math.min(2169203229760,Math.round(SLOT_COST[SLOT_COST.length-1]*Math.pow(1.36,n-SLOT_COST.length+1)))}
// ---- 機械・小さなお店 ----
function eggPrice(n){let c=1000;for(let i=0;i<n;i++)c=1.5*c+1000/(i+1);return Math.min(10000000,Math.round(c))}
const treatPrice=n=>Math.min(10000,100+100*n),rjPrice=n=>Math.min(1000000,250000+10000*n),ticketPrice=n=>Math.round(n<500?100000+1000*Math.pow(n,1.2):100000+1000*Math.pow(n,1.7));
function machineLabel(id){const m=MACHINES[id];if(m.cd){const t=(ST.mach[id]||0)-NOW();if(t>0)return m.jp+'（あと'+fmtT(t)+'）'}return m.jp+'を使う'}
function cdReady(id){return NOW()>=(ST.mach[id]||0)}
function setCd(id){ST.mach[id]=NOW()+MACHINES[id].cd;save()}
function useMachine(id){const m=MACHINES[id];
  if(id==='kblair'||id==='tunnel'){enterRoom(id);return}
  if(id.endsWith('cannon')){openPanel('cannon','🎯 '+m.jp+'（どこへ飛ぶ？）',null,(el)=>{const g=H('div',{className:'grid'});el.appendChild(g);for(const f of CANNON_DEST){const F=FIELDS[f],ok=beeCount()>=F.zone;const c=H('div',{className:'it'+(ok?'':' lock')});
      c.innerHTML=`<div class="nm">${F.jp}</div><div class="ds">${F.zone?F.zone+'ハチ以上':'だれでも'}</div>`;c.onclick=()=>{if(!ok){note('ハチが'+F.zone+'匹以上必要','#ff8a8a');return}closePanel();cannonFly(F.x,F.z+F.h/2-2,F.y)};g.appendChild(c)}});return}
  if(id.startsWith('converter')){if(ST.pollen<=0){note('カバンに花粉がありません');return}if(cdReady(id)){setCd(id);const n=instantConvert(ST.pollen);note('⚡ '+fmt(n)+'の花粉をハチミツにした！')}else if(take('ticket',1)){const n=instantConvert(ST.pollen);note('⚡ チケット1枚で '+fmt(n)+'の花粉をハチミツにした')}else note('次は'+fmtT(ST.mach[id]-NOW())+'後（チケット1枚ならすぐ使える）');return}
  if(m.cd&&!cdReady(id)){note(m.jp+'は あと'+fmtT(ST.mach[id]-NOW())+'で使えます');return}
  if(id==='wealthclock'){setCd(id);give('ticket',1);addHoney(1000*Math.max(1,beeCount()));addBuff('wealth');note('⏰ ウェルスクロック：ハチミツとチケット');return}
  if(id==='blueberrydis'){setCd(id);give('blueberry',Math.floor(rr(5,16)));addBuff('boost_b',3);return}
  if(id==='strawberrydis'){setCd(id);give('strawberry',Math.floor(rr(5,16)));addBuff('boost_r',3);return}
  if(id==='treatdis'){setCd(id);give('treat',Math.floor(rr(5,16)));addBuff('haste');return}
  if(id==='rjdis'){setCd(id);give('royaljelly',1);addBuff('haste',10);return}
  if(id==='gluedis'){setCd(id);give('glue',1);return}
  if(id==='coconutdis'){setCd(id);give('coconut',Math.floor(rr(5,16)));addFieldBoost('coconut',1);return}
  if(id.startsWith('booster_')){setCd(id);const f=pick(m.fields);addFieldBoost(f,3);const o=pick(m.fields.filter(x=>x!==f));if(o)addFieldBoost(o,1);return}
  const buyRow=(label,price,cur,fn,nums)=>{const c=H('div',{className:'it'});c.innerHTML=`<div class="nm">${label}</div>`;for(const n of nums||[1]){c.appendChild(btn('×'+n+'（'+(cur==='ticket'?'🎟️':'🍯')+fmt(price(n))+'）',()=>{const p=price(n);if(cur==='ticket'?take('ticket',p):pay(p)){fn(n);SFX.buy();drawPanel()}else note((cur==='ticket'?'チケット':'ハチミツ')+'がたりない','#ff8a8a')},'d'))}return c};
  const sumP=(f,c0)=>n=>{let s=0;for(let i=0;i<n;i++)s+=f(c0+i);return s};
  openPanel('mach:'+id,m.ic+' '+m.jp,null,(el)=>{
   if(id==='eggshop')el.appendChild(buyRow('🥚 ベーシックエッグ（買うたびに高くなる・最大1000万）',n=>eggPrice(ST.cnt.eggBuy||0),'honey',()=>{ST.cnt.eggBuy=(ST.cnt.eggBuy||0)+1;give('basicegg',1)}));
   if(id==='treatshop')el.appendChild(buyRow('🍪 おやつ（1こ100から。最大1万）',sumP(treatPrice,ST.cnt.treat),'honey',n=>{ST.cnt.treat+=n;give('treat',n)},[1,10,100]));
   if(id==='rjshop')el.appendChild(buyRow('👑 ロイヤルゼリー（25万から。最大100万）',sumP(rjPrice,ST.cnt.rj2||0),'honey',n=>{ST.cnt.rj2=(ST.cnt.rj2||0)+n;give('royaljelly',n)},[1,10]));
   if(id==='ticketshop')el.appendChild(buyRow('🎟️ チケット（10万から）',sumP(ticketPrice,ST.cnt.ticket),'honey',n=>{ST.cnt.ticket+=n;give('ticket',n)},[1,10,100]));
   if(id==='gumdropshop')el.appendChild(buyRow('🍬 ガムドロップ ×3',n=>n,'ticket',n=>give('gumdrops',n*3),[1,10,100]));
   if(id==='stingershop')el.appendChild(buyRow('🗡️ スティンガー',n=>n*10,'ticket',n=>give('stinger',n),[1,10,100]));
   if(id==='tickettent'){for(const [k,p] of[['silveregg',50],['goldegg',100],['diamondegg',400],['mythicegg',2500],['puppyegg',500],['photonegg',500],['tabbyegg',500],['festiveegg',500],['crimsonegg',250],['cobaltegg',250],['startreat',1000]])
       el.appendChild(buyRow(ITEMS[k].ic+' '+ITEMS[k].jp+'<div class="ds">'+ITEMS[k].d+'</div>',n=>p*n,'ticket',n=>give(k,n)))}
   if(id==='blender'){el.appendChild(H('div',{className:'small',textContent:'材料を入れて素材を作ります（本家と同じレシピ。この版では待ち時間なしで作れます）'}));const g=H('div',{className:'grid'});el.appendChild(g);
     for(const [out,ing] of BLENDER){const c=H('div',{className:'it'});c.innerHTML=`<div class="ic">${ITEMS[out].ic}</div><div class="nm">${ITEMS[out].jp}</div><div class="ds">${itemCost(0,ing)}</div>`;
       c.appendChild(btn('作る',()=>{if(pay(0,ing)){give(out,1);SFX.buy();drawPanel()}else note('材料がたりない','#ff8a8a')},'d'));g.appendChild(c)}}})}
// 大砲で飛ぶ（ふわっと飛んで着地）
function cannonFly(x,z,y){const sx=PL.x,sz=PL.z,sy=PL.y,T=2.2;let t=0;G.flying={sx,sz,sy,x,z,y,T,t:0};big('🎯 発射！',.8)}
function updFlying(dt){const f=G.flying;if(!f)return false;f.t+=dt;const k=Math.min(1,f.t/f.T);PL.x=lerp(f.sx,f.x,k);PL.z=lerp(f.sz,f.z,k);PL.y=lerp(f.sy,f.y,k)+Math.sin(k*Math.PI)*40;PL.vy=0;pg.position.set(PL.x,PL.y,PL.z);
  if(k>=1){G.flying=null;teleport(f.x,f.z,f.y)}return true}
// ---- 使えるアイテム ----
function useItem(k){const it=ITEMS[k];if(!it||!it.use||inv(k)<1)return;const u=it.use;
  const need=()=>{if(!G.field){note('フィールドの中で使ってください');return false}return true};
  if(u==='gumdrop'){if(!need())return;take(k,1);const D=FL[G.field];for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){const i=flowerAt(D,PL.x+dx,PL.z+dz);if(i>=0)D.goo[i]=12}fx.ring(PL.x,D.y,PL.z,3,0x5ad8c0);return}
  if(u==='glitter'){if(!need())return;take(k,1);addFieldBoost(G.field,1);return}
  if(u==='dice'){take(k,1);const f=k==='loadeddice'&&G.field?G.field:pick(FIELD_IDS.filter(x=>x!=='ant'));addFieldBoost(f,k==='fielddice'?1:2);return}
  if(u==='micro'){if(ST.pollen<=0){note('カバンに花粉がありません');return}take(k,1);note('🔋 '+fmt(instantConvert(ST.pollen))+'の花粉をハチミツにした');return}
  if(u==='suckle'){take(k,1);note('🌼 '+fmt(instantConvert(ST.pollen*.3+5000))+'の花粉をハチミツにした');return}
  if(u==='whirl'){take(k,1);PL.inRoom=null;teleport(HIVE_X(MY_HIVE),HIVE_PADZ);return}
  if(u==='beans'){take(k,1);addBuff(pick(['haste','focus','boost_r','boost_b','boost_w','babylove','melody','rage']),3);return}
  const buffMap={stinger:'stinger',redextract:'redextract',blueextract:'blueextract',enzymes:'enzymes',oil:'oil',glue:'glue',tropical:'tropical',purple:'purple',smoothie:'smoothie'};
  if(buffMap[u]){take(k,1);addBuff(buffMap[u]);note(it.ic+' '+it.jp+'を使った')}}
// ハチのマスにアイテムを使う
function applyItem(k,slot){const it=ITEMS[k];if(!it)return;if(it.egg){if(!hatch(k,slot))note('このマスには使えません');return}if(it.jelly){if(!ST.hive[slot]){note('ハチのいるマスをえらんでください');return}useJelly(k,slot);return}
  if(it.bond){if(!ST.hive[slot]){note('ハチのいるマスをえらんでください');return}feed(k,slot,1)}}
// ---- 会話 ----
function showDlg(who,text,buttons){const d=$('dlg');d.querySelector('.who').textContent=who;d.querySelector('.tx').innerHTML=text;const b=d.querySelector('.bt');b.innerHTML='';for(const [t,f,c] of buttons||[['とじる',hideDlg,'d']])b.appendChild(btn(t,()=>{f()},c));d.style.display='block'}
function hideDlg(){$('dlg').style.display='none'}
