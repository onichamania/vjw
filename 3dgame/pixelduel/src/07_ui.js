// ===================== 画面（メニュー・HUD・結果） =====================
function showScr(id){document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id===id))}
function showMenu(){showScr('sMenu');$('hello').textContent='ようこそ、'+cleanName(SV.name)+' さん';
  $('recTx').textContent='勝ち '+SV.wins+'　負け '+SV.loses+'　引き分け '+SV.draws+'　・　キル '+SV.kills+'\n使う武器：'+WEAPONS[SV.weapon].jp+' ＋ '+WEAPONS[SV.sniper].jp;$('recTx').style.whiteSpace='pre-line';
  if(NET.game)leaveRoom(true);lobbyPresence(false)}
function showName(){showScr('sName');$('nameIn').value=SV.name||'';setTimeout(()=>{try{$('nameIn').focus()}catch(e){}},50)}
function nameOk(){const n=cleanName($('nameIn').value);if(!n){tip('名前を入れてね');return}SV.name=n;saveSV();SFX.click();showMenu()}
// ---------------- 武器を選ぶ ----------------
const ICONS={};const icon=w=>SNIPER_ICON[w]||ICONS[w]||(ICONS[w]=iconURL(w,52,40));
function statRow(c,lb,v,mx,txt){const r=document.createElement('div');r.className='st';const sp=document.createElement('span');sp.textContent=lb+' '+(txt||v);const i=document.createElement('i');const u=document.createElement('u');u.style.width=clamp(v/mx*100,4,100)+'%';i.appendChild(u);r.appendChild(sp);r.appendChild(i);c.appendChild(r)}
function weaponCard(w,on,click){const W=WEAPONS[w],c=document.createElement('div');c.className='wc'+(on?' on':'');const im=document.createElement('img');im.src=icon(w);c.appendChild(im);
  const b=document.createElement('b');b.textContent=W.jp;c.appendChild(b);const en=document.createElement('div');en.className='note';en.style.margin='0';en.textContent=W.en+'　重さ '+W.weight.toFixed(2).replace(/0$/,'');c.appendChild(en);
  if(W.cat==='sniper'){const dm=document.createElement('div');dm.className='note';dm.style.cssText='margin:2px 0;color:#ffd23f;font-weight:800';dm.textContent='ダメージ 体'+W.dmg+'・頭'+Math.round(W.dmg*W.head);c.appendChild(dm);statRow(c,'攻撃力',W.dmg,160);statRow(c,'連射',W.rof,100);statRow(c,'装弾数',W.cap,12,W.cap+'/'+W.res);statRow(c,'機動力',W.mob,100)}
  else{statRow(c,'攻撃力',W.leth,35);statRow(c,'攻撃速度',89,100);statRow(c,'機動力',W.mob,100)}
  const ex=document.createElement('div');ex.className='note';ex.style.margin='4px 0 0';ex.textContent=W.cat==='sniper'?W.tag:w==='fists'?'当たると相手が遅くなる・アーマー+25':w==='saber'?'当たると相手が燃える':'軽くて手数で勝負';c.appendChild(ex);
  c.onclick=()=>{click();saveSV();SFX.click();showArmory()};return c}
function showArmory(){showScr('sArmory');const P=$('wpick'),Q=$('spick');P.textContent='';Q.textContent='';
  for(const w of MELEE)P.appendChild(weaponCard(w,SV.weapon===w,()=>{SV.weapon=w}));
  for(const w of SNIPERS)Q.appendChild(weaponCard(w,SV.sniper===w,()=>{SV.sniper=w}))}
// ---------------- 設定 ----------------
let setBack='sMenu';
function showSet(from){setBack=from||'sMenu';showScr('sSet');$('sSens').value=SET.sens;$('sSensV').textContent=SET.sens+'%';$('sSnd').textContent=SET.sound?'ON':'OFF';$('sShadow').textContent=SET.shadow?'ON':'OFF'}
function setShadow(on){SET.shadow=on;LSset('pgduel-shadow',on?'1':'0');renderer.shadowMap.enabled=on;scene.traverse(o=>{if(o.material){const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(x=>x.needsUpdate=true)}})}
// ---------------- HUD ----------------
const HC={};
function hudReset(){for(const k in HC)delete HC[k];const H=$('hearts'),A=$('armors');H.textContent='';A.textContent='';for(let i=0;i<9;i++){const h=document.createElement('div');h.className='ht';H.appendChild(h);const a=document.createElement('div');a.className='ar';A.appendChild(a)}
  $('feed').textContent='';msg('');$('coins').textContent=SV.coins;$('gems').textContent=SV.gems}
function setC(k,v,fn){if(HC[k]===v)return;HC[k]=v;fn(v)}
let crossT=0,msgT=0;
function updHUD(dt){const hp=ME.alive?ME.hp:0;
  setC('hp',Math.ceil(hp/HP_MAX*18),v=>{[...$('hearts').children].forEach((e,i)=>e.className='ht'+(v>=i*2+2?'':v===i*2+1?' h':' e'))});
  setC('ar',ME.alive?Math.ceil(ME.ar/5):0,v=>{$('armors').style.display=v>0?'flex':'none';[...$('armors').children].forEach((e,i)=>e.className='ar'+(v>=i*2+1?' g':' e'))});
  setC('sB',scoreOf(ME),v=>$('sB').textContent=v);setC('sR',scoreOf(OPP),v=>$('sR').textContent=v);
  const t=Math.max(0,Math.ceil(G.tl));setC('tl',t,v=>$('sT').textContent=Math.floor(v/60)+':'+String(v%60).padStart(2,'0'));
  setC('coins',SV.coins,v=>$('coins').textContent=v);setC('gems',SV.gems,v=>$('gems').textContent=v);
  const st=(ME.burn?'🔥 燃えている　':'')+(ME.slowT>0?'🐢 遅くなっている':'');setC('st',st,v=>$('burn').textContent=v);
  if(crossT>0){crossT-=dt;if(crossT<=0)drawCross()}
  setC('cw',ME.cw+'|'+ME.w,()=>{[...$('wbar').children].forEach((e,i)=>e.classList.toggle('on',i===ME.cw));drawCross();drawScope();touchIcons()});
  setC('am',ME.mag+'/'+ME.res+(ME.relT>0?'r':''),v=>{const e=$('wbar').children[1];if(e&&e._am)e._am.textContent=ME.relT>0?'リロード':ME.mag+'/'+ME.res});
  const sc=ME.scoped&&ME.alive;setC('sc',sc,v=>{$('scope').classList.toggle('on',v);$('cross').style.display=v?'none':'';$('scopeTx').style.display=v&&WEAPONS[ME.w].scope==='tracking'?'block':'none';VIEW.g.visible=!v&&ME.alive})
  if(sc&&WEAPONS[ME.w].scope==='tracking'){const d=aimDir(ME.yaw,ME.pitch),r=rayWorld(ME.x,ME.y+EYE,ME.z,d,140);$('scopeTx').textContent=(r.t>=140?'RNG ----':'RNG '+r.t.toFixed(1)+'m')+'\nAZ  '+(((-ME.yaw*180/Math.PI)%360+360)%360).toFixed(0).padStart(3,'0')+'\nEL '+(ME.pitch*180/Math.PI).toFixed(1)}
  if(msgT>0){msgT-=dt;if(msgT<=0)msg('')}
  for(const e of[...$('feed').children]){e._t-=dt;if(e._t<=0)e.remove()}}
function crossHit(head){crossT=head?.3:.18;drawCross(head?2:1)}
// 照準（武器ごとの形。当たると赤くなってヒットマーカーが出る）
function drawCross(hit){const cv=$('cross'),g=cv.getContext('2d');g.clearRect(0,0,64,64);const st=WEAPONS[ME.w].cross||'melee',c=hit?'#ff2a1a':'#ffffff';
  const R=(x,y,w,h)=>{g.fillStyle='#000';g.fillRect(x-1,y-1,w+2,h+2);g.fillStyle=c;g.fillRect(x,y,w,h)};
  const H=(x,y,w,h)=>{g.fillStyle='#000';g.fillRect(x-1,y-1,w+2,h+2);g.fillStyle=c;g.fillRect(x,y,w,h);g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x+1,y+1,w-2,h-2)};
  if(st==='melee'){R(31,22,2,3);R(31,39,2,3);R(22,31,3,2);R(39,31,3,2)}
  else if(st==='acr'){H(30,30,4,4);H(18,30,8,4);H(38,30,8,4);H(25,16,14,4);H(28,22,8,4);H(28,38,8,4);H(25,44,14,4)}
  else if(st==='bullet'){R(31,31,2,2);for(const s of[-1,1]){const x=s<0?19:43;R(x,26,2,12);R(x+(s<0?2:-2),25,2,2);R(x+(s<0?2:-2),37,2,2)}}
  else if(st==='laser'){R(31,31,2,2);R(19,31,6,2);R(39,31,6,2);R(31,19,2,6);R(31,39,2,6);R(26,31,2,2);R(36,31,2,2);R(31,26,2,2);R(31,36,2,2)}
  else if(st==='pierce'){for(const s of[-1,1]){const x=s<0?14:48;R(x,24,2,16);R(x+(s<0?2:-3),24,3,2);R(x+(s<0?2:-3),38,3,2)}R(31,31,2,2)}
  if(hit){g.strokeStyle='#000';g.lineWidth=hit>1?5:4;const a=hit>1?6:8,b=hit>1?16:14;for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){g.beginPath();g.moveTo(32+sx*a,32+sy*a);g.lineTo(32+sx*b,32+sy*b);g.stroke()}
    g.strokeStyle=hit>1?'#ff2a1a':'#ffffff';g.lineWidth=hit>1?3:2;for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){g.beginPath();g.moveTo(32+sx*a,32+sy*a);g.lineTo(32+sx*b,32+sy*b);g.stroke()}}}
let hsT=0;function headshotMsg(){const e=$('hs');e.classList.add('on');clearTimeout(hsT);hsT=setTimeout(()=>e.classList.remove('on'),700)}
// スコープの画面（黒いわく＋武器ごとの目盛り）
function drawScope(){const cv=$('scope'),dpr=Math.min(devicePixelRatio||1,2),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const g=cv.getContext('2d');g.clearRect(0,0,W,H);if(!isSniper(ME.w))return;const st=WEAPONS[ME.w].scope,u=H/506,cx=W/2,cy=H/2;
  const fw=Math.min(W*.66,H*1.25),x0=cx-fw/2,x1=cx+fw/2,y0=H*.05,iw=fw*.78,ix0=cx-iw/2,ix1=cx+iw/2,iy0=y0+H*.1,iy1=H*.86;
  const frame=st==='comet'?'#1c0a2c':'#050505';g.fillStyle=frame;g.fillRect(x0,y0,fw,H-y0);g.clearRect(ix0,iy0,iw,iy1-iy0);
  g.fillStyle=st==='comet'?'rgba(170,70,230,.35)':'rgba(0,0,0,.42)';const bd=iw*.035;g.fillRect(ix0,iy0,iw,bd);g.fillRect(ix0,iy1-bd,iw,bd);g.fillRect(ix0,iy0+bd,bd,iy1-iy0-2*bd);g.fillRect(ix1-bd,iy0+bd,bd,iy1-iy0-2*bd);
  const ln=(x,y,w,h,c)=>{g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x-u,y-u,w+2*u,h+2*u);g.fillStyle=c;g.fillRect(x,y,w,h)};
  const ladder=c=>{const L=100*u,gap=30*u,t=2*u;ln(cx-gap-L,cy-t/2,L,t,c);ln(cx+gap,cy-t/2,L,t,c);for(let i=0;i<3;i++){ln(cx-gap-L+(50+i*15)*u,cy-7*u,t,6*u,c);ln(cx+gap+(35+i*15)*u,cy-7*u,t,6*u,c)}
    for(let i=0;i<4;i++){ln(cx-9*u,cy-(32+i*17)*u,18*u,t,c);ln(cx-9*u,cy+(30+i*17)*u,18*u,t,c)}ln(cx-t,cy-t,2*t,2*t,c);ln(cx-t/2,cy-82*u,t,50*u,c);ln(cx-t/2,cy+30*u,t,52*u,c)};
  if(st==='acr')ladder('#ece4cc');
  else if(st==='screen'){g.fillStyle='rgba(40,200,230,.13)';g.fillRect(ix0+bd,iy0+bd,iw-2*bd,iy1-iy0-2*bd);g.fillStyle='rgba(120,240,255,.2)';for(let x=cx%(40*u);x<W;x+=40*u)if(x>ix0+bd&&x<ix1-bd)g.fillRect(x,iy0+bd,u,iy1-iy0-2*bd);for(let y=cy%(40*u);y<H;y+=40*u)if(y>iy0+bd&&y<iy1-bd)g.fillRect(ix0+bd,y,iw-2*bd,u);
    g.fillStyle='rgba(0,0,0,.09)';for(let y=iy0+bd;y<iy1-bd;y+=3*u)g.fillRect(ix0+bd,y,iw-2*bd,u);ladder('#7ff4ff');g.fillStyle='#7ff4ff';g.font='bold '+Math.round(13*u)+'px "Courier New",monospace';g.fillText('ONE SHOT  10X',ix0+bd+8*u,iy0+bd+18*u);g.fillText('▮▮▮▯',ix1-bd-50*u,iy0+bd+18*u)}
  else if(st==='tracking'){g.fillStyle='rgba(120,200,60,.08)';g.fillRect(ix0+bd,iy0+bd,iw-2*bd,iy1-iy0-2*bd);const c='#a8ff6a',t=2*u;ln(cx-150*u,cy-t/2,120*u,t,c);ln(cx+30*u,cy-t/2,120*u,t,c);ln(cx-t/2,cy-130*u,t,100*u,c);ln(cx-t/2,cy+30*u,t,100*u,c);
    for(let i=1;i<=4;i++){ln(cx-(30+i*24)*u-t,cy-t*2,2*t,4*t,c);ln(cx+(30+i*24)*u-t,cy-t*2,2*t,4*t,c);ln(cx-t*2,cy+(30+i*20)*u-t,4*t,2*t,c)}ln(cx-t,cy-t,2*t,2*t,c);
    for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){const X=cx+sx*60*u,Y=cy+sy*45*u;ln(Math.min(X,X-sx*16*u),Y-t/2,16*u,t,c);ln(X-t/2,Math.min(Y,Y-sy*16*u),t,16*u,c)}
    g.fillStyle=c;g.font='bold '+Math.round(12*u)+'px "Courier New",monospace';g.fillText('HSR  8X  TRK',ix0+bd+8*u,iy0+bd+18*u);const e=$('scopeTx');e.style.color=c;e.style.fontSize=Math.round(12*u)+'px';e.style.transform='translate('+Math.round(70*u)+'px,'+Math.round(55*u)+'px)'}
  else if(st==='comet'){const c='#ff9cff';g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=4*u;g.beginPath();g.arc(cx,cy,34*u,0,TAU);g.stroke();g.strokeStyle=c;g.lineWidth=2*u;g.beginPath();g.arc(cx,cy,34*u,0,TAU);g.stroke();
    const t=2*u;ln(cx-130*u,cy-t/2,90*u,t,c);ln(cx+40*u,cy-t/2,90*u,t,c);ln(cx-t/2,cy-120*u,t,80*u,c);ln(cx-t/2,cy+40*u,t,80*u,c);ln(cx-t,cy-t,2*t,2*t,'#ffffff');
    g.fillStyle='rgba(255,190,255,.8)';for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){const X=cx+sx*(iw/2-bd-22*u),Y=cy+sy*((iy1-iy0)/2-bd-20*u);g.fillRect(X-6*u,Y-u,12*u,2*u);g.fillRect(X-u,Y-6*u,2*u,12*u)}}
  else if(st==='thermal'){g.fillStyle='rgba(30,70,170,.16)';g.fillRect(ix0+bd,iy0+bd,iw-2*bd,iy1-iy0-2*bd);ladder('#f0f0f0');g.fillStyle='#ffb040';g.font='bold '+Math.round(12*u)+'px "Courier New",monospace';g.fillText('X-RAY',ix0+bd+8*u,iy0+bd+18*u);g.fillText('8X',ix1-bd-30*u,iy0+bd+18*u)}}
addEventListener('resize',()=>{if(G.mode)drawScope()});
// 撃つボタンの絵（接近武器はナイフ、銃は弾）
const ICON_MELEE='<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 2l8 8-2 2L2 4zM20 2l-8 8 2 2 8-8zM9 13l2 2-6 6-2-2zM15 13l-2 2 6 6 2-2z"/></svg>',ICON_GUN='<svg viewBox="0 0 24 24" fill="#fff"><path d="M10 3h4v3h-4zM9 7h6v12H9zM5 4l2 3M19 4l-2 3M4 12h3M17 12h3M5 20l2-3M19 20l-2-3" stroke="#fff" stroke-width="1.5"/></svg>';
function touchIcons(){const sn=isSniper(ME.w);$('tAtk').innerHTML=sn?ICON_GUN:ICON_MELEE;$('tAim').classList.toggle('dim',!sn);$('tRel').classList.toggle('dim',!sn)}
// 画面の真ん中の大きな文字
function msg(t,small,dur){const k=t+'|'+(small||'');if(msg.k===k)return;msg.k=k;const e=$('msg');e.textContent=t||'';if(small){const s=document.createElement('small');s.textContent=small;e.appendChild(s)}msgT=dur||0}
// キルの表示（右上）
function addFeed(K,V,w,head){const F=$('feed'),d=document.createElement('div');const a=document.createElement('span');a.textContent=K.name||'???';a.style.color=K===ME?'#7ab8ff':'#ff8a8a';d.appendChild(a);
  if(w==='tnt'){const b=document.createElement('span');b.textContent=' 💥 ';d.appendChild(b)}else{const im=document.createElement('img');im.src=icon(w,26,20);im.style.cssText='width:26px;height:20px;vertical-align:middle;margin:0 5px;image-rendering:pixelated';d.appendChild(im)}
  if(K!==V){const c=document.createElement('span');c.textContent=V.name||'???';c.style.color=V===ME?'#7ab8ff':'#ff8a8a';d.appendChild(c)}else{const c=document.createElement('span');c.textContent='（自爆）';d.appendChild(c)}
  d._t=5;F.appendChild(d);while(F.children.length>4)F.firstChild.remove()}
function clearFeed(){$('feed').textContent=''}
// 武器のバー（下の真ん中）：接近武器だけ使える。スナイパーとヘビーは準備中
function buildWBar(){const B=$('wbar');B.textContent='';
  [[ME.wm,WEAPONS[ME.wm].short,false],[ME.ws,WEAPONS[ME.ws].short,false],['heavy','ヘビー',true]].forEach(([k,lb,lock],i)=>{const s=document.createElement('div');s.className='ws'+(lock?' lk':'')+(i===ME.cw?' on':'');
    if(!lock){const im=document.createElement('img');im.src=icon(k);s.appendChild(im)}else{const l=document.createElement('div');l.className='lock';l.textContent='🔒';s.appendChild(l)}
    const sm=document.createElement('small');sm.textContent=lb;s.appendChild(sm);if(i===1){sm.style.bottom='9px';const am=document.createElement('div');am.className='am';s.appendChild(am);s._am=am}
    s.onclick=e=>{e.stopPropagation();if(lock)tip(lb+'は準備中です');else PEND.slot=i};s.ontouchstart=e=>{e.stopPropagation();if(!lock){e.preventDefault();PEND.slot=i}};B.appendChild(s)});
  for(const k of['cw','am','sc'])delete HC[k]}
// ---------------- ポーズ・結果 ----------------
function pauseGame(){if(!G.mode||G.phase==='end')return;if(G.mode==='bot')G.paused=true;$('pNote').textContent=G.mode==='online'?'オンライン対戦中は試合が止まりません。':'';showScr('sPause');if(document.pointerLockElement)document.exitPointerLock()}
function resumeGame(){G.paused=false;showScr(null);lockPointer()}
function showResult(){const R=G.res;if(!R)return;if(document.pointerLockElement)document.exitPointerLock();showScr('sResult');msg('');
  $('resT').textContent=R.r==='win'?'勝利！':R.r==='lose'?'敗北…':'引き分け';$('resT').style.color=R.r==='win'?'#ffd23f':R.r==='lose'?'#ff8a8a':'#fff';
  $('resAn').textContent=ME.name;$('resBn').textContent=OPP.name;drawPodium($('resA'),ME.sk,ME.w);drawPodium($('resB'),OPP.sk,OPP.w);$('resK').textContent=R.a+' - '+R.b;
  $('resNote').textContent=(R.why==='left'?'相手が退出したので勝ちになりました。　':R.why==='quit'?'試合をやめました。　':'')+'ポイント '+R.pa+' - '+R.pb+'　・　コイン +'+R.coins+(R.r==='win'?'　ジェム +1':'');
  $('resAgain').style.display=(G.mode==='online'&&(!NET.game||!NET.oppP))?'none':''}
function cleanupMatch(){$('scope').classList.remove('on');ME.scoped=false;G.mode=null;G.phase='idle';G.paused=false;document.body.classList.remove('play');if(OPP.model){scene.remove(OPP.model);OPP.model=null}OPP.here=false;VIEW.g.visible=false;msg('')}
function again(){SFX.click();if(G.mode==='online'){cleanupMatch();NET.rdy=NET.rd+1;sendNow();showWait()}else{cleanupMatch();startMatch('bot');lockPointer()}}
function toMenu(){SFX.click();const on=G.mode==='online';cleanupMatch();if(on||NET.game){leaveRoom(true)}showMenu()}
function quitMatch(){SFX.click();if(G.phase!=='end'&&G.mode){endMatch('quit');showResult()}else toMenu()}
// ---------------- ボタン ----------------
function bindUI(){const on=(id,f)=>$(id).addEventListener('click',e=>{e.stopPropagation();ac();f(e)});
  on('nameOk',nameOk);$('nameIn').addEventListener('keydown',e=>{if(e.key==='Enter')nameOk();e.stopPropagation()});$('roomIn').addEventListener('keydown',e=>{if(e.key==='Enter')createRoom();e.stopPropagation()});
  on('mOnline',()=>{SFX.click();showRooms()});on('mBot',()=>{SFX.click();startMatch('bot');lockPointer()});on('mArmory',()=>{SFX.click();showArmory()});on('mName',()=>{SFX.click();showName()});on('mSet',()=>{SFX.click();showSet('sMenu')});
  on('aOk',()=>{SFX.click();showMenu()});on('rMake',()=>{SFX.click();createRoom()});on('rBack',()=>{SFX.click();showMenu()});on('wLeave',()=>{SFX.click();leaveRoom()});
  on('resAgain',again);on('resMenu',toMenu);on('pBack',()=>{SFX.click();resumeGame()});on('pSet',()=>{SFX.click();showSet('sPause')});on('pQuit',quitMatch);
  on('sOk',()=>{SFX.click();if(setBack==='sPause')showScr('sPause');else showMenu()});
  $('sSens').addEventListener('input',e=>{SET.sens=+e.target.value;LSset('pgduel-sens',SET.sens);$('sSensV').textContent=SET.sens+'%'});
  on('sSnd',()=>{SET.sound=!SET.sound;LSset('pgduel-sound',SET.sound?'1':'0');showSet(setBack);SFX.click()});on('sShadow',()=>{setShadow(!SET.shadow);showSet(setBack)});
  $('pauseB').addEventListener('click',e=>{e.stopPropagation();pauseGame()});$('pauseB').addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();pauseGame()},{passive:false});
  $('chatB').style.pointerEvents='none';on('sLayB',()=>{SFX.click();showLayout()});on('layOk',()=>{SFX.click();endLayout()});on('layReset',()=>{SFX.click();LAY=JSON.parse(JSON.stringify(LAY_DEF));layoutSave();applyLayout();laySel(null)});on('layHide',()=>{if(LSEL&&LAY_HIDE.includes(LSEL)){LAY[LSEL].hide=!LAY[LSEL].hide;layoutSave();applyLayout();laySel(LSEL)}});
  $('laySize').addEventListener('input',e=>{if(LSEL){LAY[LSEL].s=+e.target.value;applyLayout();layoutSave()}})}
// ---------------- スマホのボタン配置（ドラッグで動かす・大きさ・かくす） ----------------
const LAY_DEF={stick:{x:.13,y:.74,s:120},tAtk:{x:.76,y:.77,s:88},tJump:{x:.92,y:.83,s:70},tAim:{x:.88,y:.44,s:62},tRel:{x:.95,y:.61,s:54},tAtk2:{x:.2,y:.42,s:68,hide:false}};
const LAY_NAME={stick:'移動スティック',tAtk:'攻撃（撃つ）',tJump:'ジャンプ',tAim:'スコープ',tRel:'リロード',tAtk2:'左の攻撃ボタン'},LAY_HIDE=['tAim','tRel','tAtk2'];
let LAY=(()=>{const d=JSON.parse(JSON.stringify(LAY_DEF));try{const o=JSON.parse(LSget('pgduel-layout','null'));if(o)for(const k in d)if(o[k]&&typeof o[k].x==='number'){d[k].x=clamp(o[k].x,0,1);d[k].y=clamp(o[k].y,0,1);d[k].s=clamp(+o[k].s||d[k].s,40,170);d[k].hide=!!o[k].hide}}catch(e){}return d})();
let LSEL=null,LDRAG=null;
function layoutSave(){LSset('pgduel-layout',JSON.stringify(LAY))}
function applyLayout(){for(const k in LAY){const e=$(k),L=LAY[k],s=L.s;e.style.left=clamp(L.x*innerWidth-s/2,0,innerWidth-s)+'px';e.style.top=clamp(L.y*innerHeight-s/2,0,innerHeight-s)+'px';e.style.right=e.style.bottom='auto';e.style.width=e.style.height=s+'px';e.classList.toggle('off',!!L.hide&&!document.body.classList.contains('lay'));e.style.opacity=L.hide?'.3':''}
  const k=$('stick').firstElementChild,ks=LAY.stick.s*.38;k.style.width=k.style.height=ks+'px';k.style.left=k.style.top=(LAY.stick.s-ks)/2-3+'px'}
addEventListener('resize',applyLayout);
function laySel(k){LSEL=k;for(const id in LAY)$(id).classList.toggle('sel',id===k);$('layName').textContent=k?LAY_NAME[k]+'の大きさ':'ボタンをえらんでね';$('laySize').disabled=!k;if(k)$('laySize').value=LAY[k].s;
  $('layHide').disabled=!(k&&LAY_HIDE.includes(k));$('layHide').textContent=k&&LAY[k].hide?'表示する':'かくす'}
function showLayout(){LAYBACK=document.querySelector('.scr.on')?document.querySelector('.scr.on').id:'sMenu';document.body.classList.add('lay');showScr('sLay');applyLayout();laySel(null)}
let LAYBACK='sMenu';function endLayout(){document.body.classList.remove('lay');laySel(null);applyLayout();if(LAYBACK==='sSet')showSet(setBack);else showScr(LAYBACK)}
for(const id in LAY_DEF){const e=$(id);e.addEventListener('pointerdown',ev=>{if(!document.body.classList.contains('lay'))return;ev.preventDefault();ev.stopPropagation();laySel(id);const r=e.getBoundingClientRect();LDRAG={id,dx:ev.clientX-(r.left+r.width/2),dy:ev.clientY-(r.top+r.height/2),pid:ev.pointerId};try{e.setPointerCapture(ev.pointerId)}catch(x){}});
  e.addEventListener('pointermove',ev=>{if(!LDRAG||LDRAG.id!==id)return;LAY[id].x=clamp((ev.clientX-LDRAG.dx)/innerWidth,0,1);LAY[id].y=clamp((ev.clientY-LDRAG.dy)/innerHeight,0,1);applyLayout()});
  e.addEventListener('pointerup',()=>{if(LDRAG&&LDRAG.id===id){LDRAG=null;layoutSave()}})}
