// ===================== 画面（メニュー・HUD・結果） =====================
function showScr(id){document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id===id))}
function showMenu(){showScr('sMenu');$('hello').textContent='ようこそ、'+cleanName(SV.name)+' さん';
  $('recTx').textContent='勝ち '+SV.wins+'　負け '+SV.loses+'　引き分け '+SV.draws+'　・　キル '+SV.kills+'\n使う武器：'+WEAPONS[SV.weapon].jp;$('recTx').style.whiteSpace='pre-line';
  if(NET.game)leaveRoom(true);lobbyPresence(false)}
function showName(){showScr('sName');$('nameIn').value=SV.name||'';setTimeout(()=>{try{$('nameIn').focus()}catch(e){}},50)}
function nameOk(){const n=cleanName($('nameIn').value);if(!n){tip('名前を入れてね');return}SV.name=n;saveSV();SFX.click();showMenu()}
// ---------------- 武器を選ぶ ----------------
const ICONS={};const icon=w=>ICONS[w]||(ICONS[w]=iconURL(w,52,40));
function showArmory(){showScr('sArmory');const P=$('wpick');P.textContent='';
  for(const w of WIDS){const W=WEAPONS[w],c=document.createElement('div');c.className='wc'+(SV.weapon===w?' on':'');const im=document.createElement('img');im.src=icon(w,120,90);c.appendChild(im);
    const b=document.createElement('b');b.textContent=W.jp;c.appendChild(b);const en=document.createElement('div');en.className='note';en.style.margin='0';en.textContent=W.en+'　重さ '+W.weight.toFixed(1);c.appendChild(en);
    for(const [lb,v,mx] of[['攻撃力',W.leth,35],['攻撃速度',89,100],['機動力',W.mob,100]]){const r=document.createElement('div');r.className='st';const s=document.createElement('span');s.textContent=lb+' '+v;const i=document.createElement('i');const u=document.createElement('u');u.style.width=clamp(v/mx*100,4,100)+'%';i.appendChild(u);r.appendChild(s);r.appendChild(i);c.appendChild(r)}
    const ex=document.createElement('div');ex.className='note';ex.style.margin='4px 0 0';ex.textContent=w==='fists'?'当たると相手が遅くなる・アーマー+25':w==='saber'?'当たると相手が燃える':'軽くて手数で勝負';c.appendChild(ex);
    c.onclick=()=>{SV.weapon=w;saveSV();SFX.click();showArmory()};P.appendChild(c)}}
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
  if(crossT>0){crossT-=dt;if(crossT<=0)$('cross').classList.remove('hit')}
  if(msgT>0){msgT-=dt;if(msgT<=0)msg('')}
  for(const e of[...$('feed').children]){e._t-=dt;if(e._t<=0)e.remove()}}
function crossHit(head){$('cross').classList.add('hit');crossT=head?.25:.15}
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
  for(const [k,lb,lock] of[[ME.w,WEAPONS[ME.w].jp,false],['sniper','スナイパー',true],['heavy','ヘビー',true]]){const s=document.createElement('div');s.className='ws'+(lock?' lk':' on');
    if(!lock){const im=document.createElement('img');im.src=icon(k,52,40);s.appendChild(im)}else{const l=document.createElement('div');l.className='lock';l.textContent='🔒';s.appendChild(l)}
    const sm=document.createElement('small');sm.textContent=lb;s.appendChild(sm);s.onclick=e=>{e.stopPropagation();if(lock)tip(lb+'は準備中です')};B.appendChild(s)}}
// ---------------- ポーズ・結果 ----------------
function pauseGame(){if(!G.mode||G.phase==='end')return;if(G.mode==='bot')G.paused=true;$('pNote').textContent=G.mode==='online'?'オンライン対戦中は試合が止まりません。':'';showScr('sPause');if(document.pointerLockElement)document.exitPointerLock()}
function resumeGame(){G.paused=false;showScr(null);lockPointer()}
function showResult(){const R=G.res;if(!R)return;if(document.pointerLockElement)document.exitPointerLock();showScr('sResult');msg('');
  $('resT').textContent=R.r==='win'?'勝利！':R.r==='lose'?'敗北…':'引き分け';$('resT').style.color=R.r==='win'?'#ffd23f':R.r==='lose'?'#ff8a8a':'#fff';
  $('resAn').textContent=ME.name;$('resBn').textContent=OPP.name;drawPodium($('resA'),ME.sk,ME.w);drawPodium($('resB'),OPP.sk,OPP.w);$('resK').textContent=R.a+' - '+R.b;
  $('resNote').textContent=(R.why==='left'?'相手が退出したので勝ちになりました。　':R.why==='quit'?'試合をやめました。　':'')+'ポイント '+R.pa+' - '+R.pb+'　・　コイン +'+R.coins+(R.r==='win'?'　ジェム +1':'');
  $('resAgain').style.display=(G.mode==='online'&&(!NET.game||!NET.oppP))?'none':''}
function cleanupMatch(){G.mode=null;G.phase='idle';G.paused=false;document.body.classList.remove('play');if(OPP.model){scene.remove(OPP.model);OPP.model=null}OPP.here=false;VIEW.g.visible=false;msg('')}
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
  $('chatB').style.pointerEvents='none'}
