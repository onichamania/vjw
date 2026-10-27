// ================= 試合前の VS 画面（本家のロード画面のように：両チームのキャラ・名前・レベル・トロフィー） =================
function vsCard(u,o){o=o||{};const B=BT[u.bt];return `<div class="vsC${u.isMe?' me':''}${o.star?' star':''}" style="--rc:${RARC[B.rar]||'#7fd8ff'}${o.d!=null?';animation-delay:'+o.d+'s':''}"><span class="lv pwc">${u.lv}</span>${o.star?'<span class="st">⭐</span>':''}<div class="pic">${pic(u.bt,u.sk||null)}</div><b>${u.name.replace(/</g,'')}</b><small>${o.sub!=null?o.sub:u.tr==null?B.name:'🏆'+u.tr}</small></div>`}
function showVS(mode,mid){const v=$('vs'),br=G.mode==='br';$('vsMode').textContent=MODES[mode].name;$('vsMap').textContent=MAPS[mid].name;v.classList.toggle('br',br);
  $('vsB').innerHTML=G.units.filter(u=>br||u.team===0).map(vsCard).join('');$('vsR').innerHTML=br?'':G.units.filter(u=>u.team===1).map(vsCard).join('');
  for(const e of v.querySelectorAll('.vsRow,.vsMid')){e.style.animation='none';void e.offsetWidth;e.style.animation=''}
  v.classList.add('on');G.state='vs';G.vsT=2.6;SFX.superGo()}
function vsEnd(){$('vs').classList.remove('on');if(G.state!=='vs')return;G.state='intro';G._n=null;if(G._vsNote)note(G._vsNote,2.6)}
$('vs').addEventListener('pointerdown',()=>{if(G.state==='vs'&&G.vsT<2.1)G.vsT=0});
function endMatch(win){if(G.over)return;G.over=true;G.win=win;G.endT=2.4;G.state='end';$('cdown').style.display='none';
  if(G.mode==='br'){const p=G.place;big(p===1?'1位！':p+'位',2.4,p===1?'#ffd84d':p<=4?'#8fe39a':'#fff');SFX.end(p<=4)}
  else{big(win===0?'勝利！':win===1?'敗北…':'引き分け',2.4,win===0?'#ffd84d':win===1?'#ff7b7b':'#fff');SFX.end(win===0)}}
const BR_TR=[10,8,6,4,2,0,-1,-2,-3,-4],BR_COIN=[80,70,60,50,42,35,30,26,22,20];
function showResult(){G.state='result';document.body.classList.remove('playing');const u=G.me,t0=trophies(PICK);let d,c,title,cls,won;
  if(G.mode==='br'){const p=G.place;d=BR_TR[p-1];c=BR_COIN[p-1];title=p+'位';cls=p===1?'win':p<=4?'draw':'lose';won=p===1}
  else{const w=G.win;won=w===0;d=w===0?8:w===1?-3:0;c=w===0?60:w===1?25:35;title=w===0?'勝利！':w===1?'敗北…':'引き分け';cls=w===0?'win':w===1?'lose':'draw'}
  if(d<0&&t0<100)d=0;                       // 100トロフィーまでは負けても減らない
  if(G.friendly){d=0;c=0}                   // フレンドバトル・トレーニングはトロフィーもコインも動かない（本家と同じ）
  let html='';
  // スタープレイヤー：勝ったチーム（引き分けなら全員）でいちばん活躍した人（倒した数・ジェム・ダメージ）
  let star=null;if(G.mode!=='br'){const sc=v=>v.kills*2+v.gemsGot*2+v.dmg/1500;for(const v of G.units)if(!v.dummy&&(G.win<0||v.team===G.win)&&(!star||sc(v)>sc(star)))star=v}
  if(star&&star.isMe){c+=10;html+=`<div class="starTag">⭐ スタープレイヤー！　🪙+10</div>`}
  if(G.ranked){const r0=rankOf(G.rpBefore),g=G.win===0?Math.max(14,36-r0.div):G.win===1?-Math.min(26,5+r0.div):0,floor=r0.pro?2100:r0.tier*300;
    const rp1=Math.max(Math.min(G.rpBefore,floor),G.rpBefore+g);LSset('gr-rp',rp1);const r1=rankOf(rp1),best=+LS('gr-rpbest',0);d=0;
    html+=`<div style="margin:6px 0;font-size:18px;font-weight:900">🏅 ランク ${g>=0?'+':''}${rp1-G.rpBefore}　<span style="color:${r1.col}">${r1.name}</span></div>`;
    if(r1.div>Math.floor(best/100)&&r1.div>r0.div){const bonus=25+r1.tier*15;c+=bonus;html+=`<div style="font-size:22px;font-weight:900;color:${r1.col}">${r1.pro?'ついにプロに到達！':r1.name+' に昇格！'}　🪙+${bonus}</div>`;SFX.superReady()}
    if(rp1>best)LSset('gr-rpbest',rp1)}
  const t1=Math.max(0,t0+d);LSset('gr-tr-'+PICK,t1);addCoins(c);if(!G.friendly)statAdd(won,G.mode==='br'?'br':G.rule);
  if(G.ranked){const h=J('gr-rh',[]);h.push(G.win===0?'w':G.win===1?'l':'d');JS('gr-rh',h.slice(-20))}
  const msgs=G.friendly?[]:questAdd({win:won?1:0,kills:u.kills,gems:u.gemsGot,dmg:u.dmg,sup:u.supUsed||0,top3:G.mode==='br'&&G.place<=3?1:0,cube:u.cubes||0,ranked:G.ranked?1:0,play:1,tro:Math.max(0,d),heal:Math.round(u.healed||0),mode:G.ranked?'ranked':G.mode==='br'?'br':G.rule});
  const xp=G.friendly?0:G.mode==='br'?[90,76,64,54,46,40,34,30,26,22][G.place-1]:(G.win===0?60:G.win===-1?40:30)+Math.min(50,u.kills*6),dbl=Math.min(xp,xpd());if(dbl)addXpd(-dbl);const up=addXP(xp+dbl);
  const day=new Date().toDateString(),dw=J('gr-dw',{day:'',n:0});if(dw.day!==day){dw.day=day;dw.n=0}let gotDrop=false;if(won&&!G.friendly&&dw.n<4){dw.n++;addDrop(dw.n<4?'starr':'chaos');gotDrop=true}JS('gr-dw',dw);
  html+=`<div style="margin-top:4px;font-weight:900">🎟 パスXP +${xp}${dbl?'　<span style="color:#7fd0ff">XPダブラー +'+dbl+'</span>':''}${up?'　<span style="color:#ffd84d">Tier '+bpTier(bp())+' に到達！</span>':''}</div>`+(gotDrop?`<div style="font-weight:900;color:#ffd84d">⭐ 今日の勝利ボーナス：${dw.n<4?'スタードロップ':'カオスドロップ'} ×1（${dw.n}/4）</div>`:'');
  $('rTitle').textContent=title;$('rTitle').className=cls;$('result').classList.toggle('lose',cls==='lose');
  $('againBtn').innerHTML='<span class="tx">もう一度</span>';$('againBtn').disabled=false;$('toMenu').innerHTML='<span class="tx">終了</span>';$('againBtn').style.display=G.rule==='training'?'none':'';
  {const sub=v=>'⚔'+v.kills+(G.rule==='gem'?'　💎'+v.gemsGot:''),row=(t,cl)=>`<div class="vsRow ${cl}">`+G.units.filter(v=>!v.dummy&&v.team===t).map((v,i)=>vsCard(v,{star:v===star,sub:sub(v),d:.15+i*.08})).join('')+'</div>';
    $('rTeam').innerHTML=G.mode==='br'?'':row(0,'b')+row(1,'r op')+(star?`<div class="starTag">⭐ スタープレイヤー：${star.name.replace(/</g,'')}（${BT[star.bt].name}）</div>`:'')}
  $('rSub').innerHTML=(G.ranked?'':`<span style="font-size:26px;font-weight:900;color:#ffd84d" class="cu" data-v="${d}" data-p="🏆 ${d>=0?'+':''}">🏆 ${d>=0?'+':''}${d}</span>　`)+`<span style="font-size:26px;font-weight:900;color:#ffe9a8" class="cu" data-v="${c}" data-p="🪙 +">🪙 +${c}</span>`+html+(G.ranked?'':`<br>${BT[PICK].name} のトロフィー ${t1}・合計 ${totalTr()}`)+msgs.map(m=>`<div style="color:#8fe39a;font-weight:900">✔ ${m}</div>`).join('');
  $('rStats').innerHTML=`<span>倒した数</span><span>${u.kills}</span><span>倒された数</span><span>${u.deaths}</span>`+(G.mode==='br'?`<span>パワーキューブ</span><span>${u.pw}</span>`:`<span>拾ったジェム</span><span>${u.gemsGot}</span>`)+`<span>与えたダメージ</span><span>${u.dmg.toLocaleString()}</span>`;
  $('result').classList.add('on')}
$('againBtn').addEventListener('click',()=>{questAdd({again:1});startMatch(G.ranked?'ranked':G.rule==='br'?'br':MODES[PMODE]&&PMODE!=='ranked'?PMODE:G.rule)});$('toMenu').addEventListener('click',()=>{clearMatch();showMenu()});

