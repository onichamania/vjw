// ================= 画面（HUD・値札・建物の説明・メニュー・タイトル）=================
let STATE='title';
function showScr(id){document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id===id));}
function toast(t){const e=$('toast');e.textContent=t;e.classList.remove('on');void e.offsetWidth;e.classList.add('on');clearTimeout(toast.T);toast.T=setTimeout(()=>e.classList.remove('on'),2600)}
function banner(a,b){const e=$('banner');e.innerHTML=`<b>${esc(a)}</b>${b?`<small>${esc(b)}</small>`:''}`;e.classList.remove('on');void e.offsetWidth;e.classList.add('on');clearTimeout(banner.T);banner.T=setTimeout(()=>e.classList.remove('on'),2800)}
function flashHurt(){const e=$('hurt');e.classList.remove('on');void e.offsetWidth;e.classList.add('on')}
function showLoading(t){$('loadTxt').textContent=t;showScr('loading')}
function hideLoading(){if($('loading').classList.contains('on'))showScr(STATE==='play'?'':'title')}
// ---- 浮かぶ文字（ダメージ・+数）----
const FLOATS=[];
function floatText(t,pos,col){const el=document.createElement('div');el.className='flt';el.textContent=t;el.style.color=col||'#fff';$('tags').appendChild(el);FLOATS.push({el,pos:pos.clone(),t:0})}
const _pj=new THREE.Vector3();
function toScreen(p){_pj.copy(p).project(camera);return _pj.z<1&&_pj.z>-1?[(_pj.x+1)/2*innerWidth,(1-_pj.y)/2*innerHeight]:null}
function updateFloats(dt){for(let i=FLOATS.length-1;i>=0;i--){const f=FLOATS[i];f.t+=dt;const up=_t1.copy(f.pos).normalize();const sp=toScreen(_t2.copy(f.pos).addScaledVector(up,f.t*1.2));
  if(!sp||f.t>.9){if(f.t>.9){f.el.remove();FLOATS.splice(i,1)}else f.el.style.display='none';continue}f.el.style.display='block';f.el.style.transform=`translate(${sp[0]}px,${sp[1]}px) translate(-50%,-50%) scale(${1+Math.max(0,.2-f.t)*2})`;f.el.style.opacity=String(1-Math.max(0,f.t-.5)/.4)}}
// ---- 左の資源の数 ----
let resKey='';
function drawRes(){const shown=RES_ORDER.filter(k=>(PL.inv[k]||0)>0);const key=shown.map(k=>k+(PL.inv[k]|0)).join();if(key===resKey)return;resKey=key;
  const el=$('res');const have=new Set([...el.children].map(c=>c.dataset.k));
  for(const c of [...el.children])if(!shown.includes(c.dataset.k))c.remove();
  shown.forEach((k,i)=>{let row=el.querySelector(`[data-k="${k}"]`);if(!row){row=document.createElement('div');row.className='rrow';row.dataset.k=k;row.innerHTML=`${iconImg(k)}<span></span>`;}
    if(el.children[i]!==row)el.insertBefore(row,el.children[i]||null);row.querySelector('span').textContent=fmt(PL.inv[k]);if(GAIN[k]&&have.has(k)){row.classList.remove('pop');void row.offsetWidth;row.classList.add('pop')}});
  for(const k in GAIN)delete GAIN[k]}
// ---- 上：星の進み具合・体力・道具 ----
let topKey='';
function drawTop(){const pct=Math.floor((W.open.size-1)/NTILE*100),hp=Math.ceil(PL.hp),mh=maxHp(),T=PL.tools;const key=[pct,hp,mh,T.axe,T.pick,T.weap,NET.on?1:0].join();if(key===topKey)return;topKey=key;
  $('pPct').textContent=pct+'%';$('pBar').style.width=pct+'%';$('hpTxt').textContent=hp+' / '+mh;$('hpBar').style.width=(hp/mh*100)+'%';
  $('tools').innerHTML=['axe','pick','weap'].map(t=>`<span>${iconImg(t)}<b>${T[t]}</b></span>`).join('')}
// ---- 値札（買えるタイルの上）----
const PTAGS={};
function drawPriceTags(){const cam=camera.position;const list=[...GH_ON].map(n=>{const c=CELLS[TILES[n].cell];return{n,c,d:cam.distanceTo(_t1.copy(c.c).multiplyScalar(SEA))}}).sort((a,b)=>a.d-b.d);
  const keep=new Set();for(const it of list.slice(0,CAM.map?40:14)){if(it.d>(CAM.map?200:40))continue;const sp=toScreen(_t1.copy(it.c.c).multiplyScalar(SEA+1.4));if(!sp)continue;
    // 星の裏側は出さない
    if(_t2.copy(it.c.c).dot(_t3.copy(cam).normalize())<.15)continue;
    keep.add(it.n);let e=PTAGS[it.n];if(!e){e=PTAGS[it.n]=document.createElement('div');e.className='ptag';$('tags').appendChild(e)}
    const T=TILES[it.n],pd=W.paid[it.n]||{};const html=Object.keys(T.cost).map(k=>{const left=T.cost[k]-(pd[k]||0);return left>0?`<span class="${(PL.inv[k]||0)>=left?'ok':''}">${iconImg(k)}${fmt(left)}</span>`:''}).join('')+(T.cont.includes('yetiBig')?'<i>通せんぼ</i>':T.cont.includes('cave')?'<i>トロルの通行料</i>':'');
    if(e._h!==html){e.innerHTML=html;e._h=html}e.style.display='flex';e.style.transform=`translate(${sp[0]}px,${sp[1]}px) translate(-50%,-100%) scale(${CAM.map?.7:clamp(28/it.d,.7,1.15)})`;e.classList.toggle('here',PAY.n===it.n)}
  for(const n in PTAGS)if(!keep.has(+n))PTAGS[n].style.display='none'}
// ---- 建物の名前・カギ・敵の体力 ----
const BTAG={};let lockEl=null;const EBAR=[];
function drawWorldTags(){const cam=camera.position;
  for(const B of BLDS){const D=BLD[B.k];let e=BTAG[B.n];const show=W.open.has(B.n)&&D.kind!=='deco'&&!CAM.map&&arcDist(PL.u,_t1.copy(B.pos).normalize(),SEA)<9;
    if(!show){if(e)e.style.display='none';continue}if(!e){e=BTAG[B.n]=document.createElement('div');e.className='btag';$('tags').appendChild(e)}
    const sp=toScreen(_t1.copy(B.pos).addScaledVector(B.up,B.k==='portal'?4.4:3.2));if(!sp){e.style.display='none';continue}
    const S=B.st||{};let h=`<b>${D.n}</b>`;
    if(D.kind==='ref'){const ink=Object.keys(D.inp)[0];h+=`<div>${iconImg(ink)}×${D.inp[ink]} → ${iconImg(D.out)}×1</div>`;if(S.q)h+=`<div class="sm">入っている ${fmt(S.q)}</div>`;if(S.out)h+=`<div class="sm">できた ${fmt(S.out)}（緑の丸へ）</div>`}
    else if(D.kind==='trade'){const ink=Object.keys(D.inp)[0];h+=`<div>${iconImg(ink)}×${D.inp[ink]} → ${iconImg('coin')}×${D.k}</div>`}
    else if(D.kind==='eq'){const lv=PL.tools[D.tool];h+=S.craft>0?`<div>${iconImg(D.tool)} Lv${S.lv} を作っています… ${Math.ceil(S.craft)}秒</div>`:`<div>${iconImg(D.tool)} Lv${lv}${(D.tool==='weap'?lv>=8:lv>=8)?'（ここでは最大）':' → Lv'+(lv+1)}</div>`}
    else if(D.kind==='portal'){const st=S.step||0;h+=st>=7?'<div>動いている！ 中に入ろう</div>':`<div>${st}/7　${PORTAL_STEPS[st].n}</div>`}
    else if(D.kind==='skin')h+='<div>キャラクターを変える</div>';
    if(e._h!==h){e.innerHTML=h;e._h=h}e.style.display='block';e.style.transform=`translate(${sp[0]}px,${sp[1]}px) translate(-50%,-100%)`}
  // 道具が足りない木や岩
  if(!lockEl){lockEl=document.createElement('div');lockEl.className='lock';$('tags').appendChild(lockEl)}
  const L=LOCK_SHOW;if(L&&!CAM.map){const N=NODE[L.k];const sp=toScreen(_t1.copy(L.pos).addScaledVector(L.up,N.hh+.4));if(sp){const h=`${iconImg('lock')}${iconImg(N.tool)} Lv${N.lv}`;if(lockEl._h!==h){lockEl.innerHTML=h;lockEl._h=h}lockEl.style.display='flex';lockEl.style.transform=`translate(${sp[0]}px,${sp[1]}px) translate(-50%,-100%)`}else lockEl.style.display='none'}else lockEl.style.display='none';
  // 敵の体力
  let k=0;if(!CAM.map)for(const e of ENEMIES){if(!e.vis||e.hp>=ENEMY[e.k].hp&&!ENEMY[e.k].boss)continue;if(arcDist(PL.u,e.u,SEA)>14)continue;const sp=toScreen(_t1.copy(e.pos).addScaledVector(e.u,1.9*ENEMY[e.k].sc));if(!sp)continue;
    let b=EBAR[k];if(!b){b=EBAR[k]=document.createElement('div');b.className='ebar';b.innerHTML='<i></i>';$('tags').appendChild(b)}b.style.display='block';b.style.transform=`translate(${sp[0]}px,${sp[1]}px) translate(-50%,-100%)`;b.firstChild.style.width=clamp(e.hp/ENEMY[e.k].hp*100,0,100)+'%';b.classList.toggle('boss',!!ENEMY[e.k].boss);k++}
  for(;k<EBAR.length;k++)EBAR[k].style.display='none';
  // 自分の体力（へったときだけ）
  const me=toScreen(_t1.copy(PL.u).multiplyScalar(PL.r+1.9));const hb=$('meBar');if(me&&PL.hp<maxHp()&&!CAM.map&&PL.dead<=0){hb.style.display='block';hb.style.transform=`translate(${me[0]}px,${me[1]}px) translate(-50%,-100%)`;hb.firstChild.style.width=(PL.hp/maxHp()*100)+'%'}else hb.style.display='none';
  // サメまでの時間
  const sw=$('swimT');if(PL.inWater&&PL.swimT>.5&&PL.swimT<4&&me){sw.style.display='block';sw.textContent='🦈 '+Math.ceil(4-PL.swimT);sw.style.transform=`translate(${me[0]}px,${me[1]-30}px) translate(-50%,-100%)`}else sw.style.display='none'}
// ---- 下：台の上にいるときの説明 ----
let padKey='';
function drawPadUI(){const P=PADUI,el=$('padui');if(!P||CAM.map){if(padKey){el.classList.remove('on');padKey=''}return}
  const B=P.B,D=BLD[B.k],S=B.st||{};let h='';
  if(P.type==='ref'){const ink=Object.keys(D.inp)[0];h=`<b>${D.n}</b><div>${iconImg(ink)}${fmt(PL.inv[ink]||0)} を入れています → ${iconImg(D.out)}（${D.t}秒で1つ）</div><div class="sm">入っている ${fmt(S.q||0)}・できた ${fmt(S.out||0)}　できたものは緑の丸で受け取ろう</div>`}
  else if(P.type==='trade'){const ink=Object.keys(D.inp)[0];h=`<b>${D.n}</b><div>${iconImg(ink)}×${D.inp[ink]} を ${iconImg('coin')}×${D.k} にかえます（持っている ${fmt(PL.inv[ink]||0)}）</div>`}
  else if(P.type==='eq'){const t=P.t,lv=P.lv;if(S.craft>0)h=`<b>${D.n}</b><div>${iconImg(t)} Lv${S.lv} を作っています… あと${Math.ceil(S.craft)}秒</div>`;
    else if(!P.cost||lv>=8)h=`<b>${D.n}</b><div>${iconImg(t)} Lv${lv}：この星で作れるいちばん上です${t==='weap'&&lv<9?'（Lv9 の剣は山の岩にささっています）':''}</div>`;
    else{const pd=S.paid||{};h=`<b>${D.n}　${TOOLN[t]} Lv${lv} → Lv${lv+1}</b><div class="cost">${Object.keys(P.cost).map(k=>{const left=P.cost[k]-(pd[k]||0);return`<span class="${(PL.inv[k]||0)>=left?'ok':'lack'}">${iconImg(k)}${fmt(Math.max(0,left))}</span>`}).join('')}</div><div class="sm">${t==='weap'?'こうげき '+WPOW[lv]+'→'+WPOW[lv+1]+'・体力 '+WHP[lv]+'→'+WHP[lv+1]:'切れるもの・掘れるものがふえる'}</div>`}}
  else if(P.type==='portal'){const st=S.step||0;if(st>=7)h='<b>ポータル</b><div>そのまま立っていると、次の星へ…</div>';else{const c=PORTAL_STEPS[st].c,pd=S.paid||{};h=`<b>ポータル ${st}/7：${PORTAL_STEPS[st].n}</b><div class="cost">${Object.keys(c).map(k=>{const left=c[k]-(pd[k]||0);return`<span class="${(PL.inv[k]||0)>=left?'ok':'lack'}">${iconImg(k)}${fmt(Math.max(0,left))}</span>`}).join('')}</div>`}}
  else if(P.type==='skin')h='<b>キャラクターポータル</b><div>キャラクターを選べます</div>';
  if(h!==padKey){el.innerHTML=h;padKey=h;el.classList.add('on')}}
// ---- 確認・入力（claude.ai の枠の中では prompt/confirm が使えないことがあるので自前で）----
function ask(title,msg,opt){opt=opt||{};return new Promise(res=>{const back=document.querySelector('.scr.on');const backId=back?back.id:'';$('dlgT').textContent=title;$('dlgM').textContent=msg||'';const inp=$('dlgIn');inp.style.display=opt.input!=null?'':'none';inp.value=opt.input||'';
  $('dlgOk').textContent=opt.ok||'OK';const done=v=>{$('dlgOk').onclick=$('dlgNo').onclick=null;showScr(backId);res(v)};$('dlgOk').onclick=()=>{SFX.click();done(opt.input!=null?inp.value:true)};$('dlgNo').onclick=()=>{SFX.click();done(null)};
  inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')$('dlgOk').click()};showScr('dlg');if(opt.input!=null)setTimeout(()=>{try{inp.focus()}catch(e){}},50)})}
// ---- メニュー ----
function openMenu(){if(STATE!=='play')return;inputReset();saveGame();clAfterSave(true);$('mYield').textContent='資源の量：×'+OPT.yield+(OPT.yield===1?'（本家どおり）':'');$('mSound').textContent='音：'+(SET.sound?'オン':'オフ');$('mName').textContent='名前：'+myName();
  $('mOnline').textContent=NET.on?(NET.host?'オンラインの部屋を閉じる':'部屋から出て自分の星にもどる'):'オンライン（いっしょに遊ぶ）';showScr('menu')}
function closeMenu(){showScr('');SFX.click()}
$('bMenu').onclick=()=>{SFX.click();openMenu()};
$('bMap').onclick=()=>{SFX.click();toggleMap()};
$('mClose').onclick=closeMenu;
$('mYield').onclick=()=>{SFX.click();OPT.yield=OPT.yield===1?2:OPT.yield===2?5:1;LSset('lu-yield',String(OPT.yield));openMenu()};
$('mSound').onclick=()=>{SET.sound=!SET.sound;LSset('lu-sound',SET.sound?'1':'0');SFX.click();openMenu()};
$('mSkin').onclick=()=>{SFX.click();openSkins(true)};
// セーブコードの画面：ずっと使えるコード（LUC-…）があればそれを、なければ長いコード（いまの内容だけ）
let codeMode='';
const codeBig=on=>{const t=$('codeTa').style;t.height=on?'52px':'';t.fontSize=on?'22px':'';t.textAlign=on?'center':'';t.fontWeight=on?'800':''};
function codeLong(){codeMode='long';codeBig(false);$('codeTa').value='作っています…';saveGame();packCode(snapshot()).then(c=>{if(codeMode==='long')$('codeTa').value=c});
  $('codeCloud').textContent=CLOUD.key?'ずっと使えるコードを出す':'ずっと使えるコードを作る';
  $('codeMsg').textContent=CLOUD.key?'これは「いまの内容だけ」の長いコードです。このあと遊んだ分は入りません（ずっと使えるコードのほうが便利です）。':'このコードをメモしておくと、ほかの端末やあとで同じところから遊べます（いまの内容だけ）。「ずっと使えるコードを作る」と、セーブのたびに上書きされる短いコードになります。'}
function codeCloudShow(fresh){codeMode='cloud';$('codeTa').value=clShow(CLOUD.key);codeBig(true);$('codeCloud').textContent='長いコード（いまの内容だけ）を出す';
  $('codeMsg').textContent='このコードは、セーブするたびに最新の内容に上書きされます。ずっとこのコードで続きから遊べます（「セーブコードで遊ぶ」にはりつける）。最新にしています…';
  const done=()=>{if(codeMode==='cloud')$('codeMsg').textContent=$('codeMsg').textContent.replace('最新にしています…',CL.conf?'（別の場所で新しくなっているので、この端末のぶんは上書きしていません。コードを読みこみなおすと最新で遊べます）':CL.bad?'（いまは上書きできません）':'いま最新になっています。')};
  if(fresh)done();else{saveGame();clSync().then(done,done)}}
$('mCode').onclick=()=>{SFX.click();$('codeCloud').style.display='';showScr('codeScr');if(CLOUD.key)codeCloudShow();else codeLong()};
$('codeCloud').onclick=async()=>{SFX.click();if(codeMode==='cloud'){codeLong();return}if(CLOUD.key){codeCloudShow();return}
  $('codeMsg').textContent='ずっと使えるコードを作っています…';try{await clMake();codeCloudShow(true)}catch(e){$('codeMsg').textContent='作れませんでした：'+clErr(e)}};
$('codeCopy').onclick=()=>{SFX.click();const t=$('codeTa');t.select();try{navigator.clipboard.writeText(t.value).then(()=>toast('コピーしました'),()=>{document.execCommand('copy');toast('コピーしました')})}catch(e){document.execCommand('copy');toast('コピーしました')}};
$('codeLoad').onclick=async()=>{SFX.click();const txt=$('codeTa').value;const key=clKey(txt);let o=null;
  if(key){if(CLOUD.key===key&&codeMode==='cloud'&&STATE==='play'){$('codeMsg').textContent='いま遊んでいるコードです';return}$('codeMsg').textContent='ずっと使えるコードの中身を受け取っています…';try{o=await clLoad(key)}catch(e){$('codeMsg').textContent='読みこめませんでした：'+clErr(e);return}}
  else{try{o=await unpackCode(txt)}catch(e){o=null}if(!validSave(o)){$('codeMsg').textContent='コードが読めませんでした。全部はりつけたか確かめてね。';return}delete o.cloud;delete o.cloudS}
  if(NET.on)await netLeave();LSset(SAVE_KEY,JSON.stringify(o));applySave(o);toast(key?'ずっと使えるコード '+clShow(key)+' で遊びます':'セーブコードを読みこみました');startPlay()};
$('codeBack').onclick=()=>{SFX.click();showScr(STATE==='play'?'menu':'title')};
$('mOnline').onclick=async()=>{SFX.click();if(NET.on){if(NET.host){await netLeave();toast('部屋を閉じました')}else await netLeave();openMenu();return}openOnline()};
$('mName').onclick=async()=>{SFX.click();const n=await ask('名前','オンラインでほかの人に見える名前です（14文字まで）',{input:myName()});if(n!=null){const v=netClean(n).slice(0,14);if(v)LSset('lu-name',v)}openMenu()};
$('mTitle').onclick=()=>{SFX.click();saveGame();clAfterSave(true);toTitle()};
// ---- キャラクター ----
function openSkins(fromMenu){inputReset();const el=$('skinList');el.innerHTML='';
  for(const S of SKINS){const own=PL.owned[S.id],can=S.cost&&Object.keys(S.cost).every(k=>(PL.inv[k]||0)>=S.cost[k]);const d=document.createElement('div');d.className='skin'+(PL.skin===S.id?' sel':'');
    d.innerHTML=`<canvas width="96" height="110"></canvas><b>${S.n}</b><small>${S.note}</small>${own?(PL.skin===S.id?'<em>使っている</em>':'<button>これにする</button>'):`<div class="cost">${costHTML(S.cost,PL.inv)}</div><button ${can?'':'disabled'}>手に入れる</button>`}`;
    const bt=d.querySelector('button');if(bt)bt.onclick=()=>{SFX.click();if(!own){if(!fromMenu&&!can)return;if(!can){toast('資源が足りません');return}for(const k in S.cost)addRes(k,-S.cost[k]);PL.owned[S.id]=1;SFX.level()}setSkin(S.id);saveSoon();openSkins(fromMenu)};
    el.appendChild(d);drawSkinPreview(d.querySelector('canvas'),S.id)}
  $('skinNote').textContent=fromMenu?'持っているキャラクターに変えられます（新しいキャラクターはキャラクターポータルで手に入れよう）':'資源をはらって新しいキャラクターを手に入れよう';
  el.querySelectorAll('.skin').forEach((d,i)=>{const S=SKINS[i];if(fromMenu&&!PL.owned[S.id]){const b=d.querySelector('button');if(b)b.disabled=true}});showScr('skins')}
$('skinBack').onclick=()=>{SFX.click();showScr(STATE==='play'?'':'title')};
let PREV=null;function drawSkinPreview(cv,id){if(!PREV){PREV={r:new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true}),s:new THREE.Scene(),c:new THREE.PerspectiveCamera(30,96/110,.1,20)};PREV.r.setSize(96,110);PREV.s.add(new THREE.HemisphereLight(0xffffff,0x6080a0,1.6));const dl=new THREE.DirectionalLight(0xffffff,1.8);dl.position.set(2,3,4);PREV.s.add(dl);PREV.c.position.set(0,1.0,4.2);PREV.c.lookAt(0,.75,0)}
  const ch=makeChar(id);ch.rotation.y=.4;PREV.s.add(ch);PREV.r.render(PREV.s,PREV.c);PREV.s.remove(ch);cv.getContext('2d').drawImage(PREV.r.domElement,0,0)}
// ---- オンライン ----
function openOnline(){showScr('online');netInit().then(uiNet);uiNet()}
function uiNet(){const st=$('nState');if(!st)return;const rs=NET.st==='ok'?netRooms():[];
  st.textContent=NET.st==='wait'?'オンラインに接続しています…':NET.st==='none'?(NET.why==='nohost'?'このページは claude.ai の外で開かれています。claude.ai でアーティファクトを開くといっしょに遊べます。':NET.why==='denied'?'オンラインの許可がオフになっています。アーティファクトの「権限」からオンにしてください。':'この画面ではオンラインに入れませんでした。claude.ai にログインして、作った人の組織のメンバーか、共有で招待されたアカウントで開いてください（公開リンクからは入れません）。'):NET.st==='err'?'つながりが切れました。もう一度ためしてね。':NET.on?(NET.host?'部屋を開いています（'+(NET.others().length+1)+'人）':'部屋に入っています'):'部屋に入るか、自分の星で部屋を開こう';
  $('nHost').disabled=NET.st!=='ok'||NET.on;$('nHost').textContent=NET.on&&NET.host?'部屋を開いています':'自分の星で部屋を開く';
  const L=$('nRooms');L.innerHTML='';if(!rs.length){L.innerHTML=`<div class="empty">${NET.st==='ok'?'まだ部屋がありません':'—'}</div>`}
  for(const r of rs){const d=document.createElement('div');d.className='room';d.innerHTML=`<b>${esc(r.n)} の星</b><small>${r.p}% ・ ${r.np}/8人${r.mine?'（あなたの別のタブ）':''}</small>`;d.onclick=()=>{SFX.click();if(NET.on){toast('いまは別の部屋にいます');return}if(STATE!=='play'){startPlay(true)}netJoin(r)};L.appendChild(d)}
  uiNetBox()}
function uiNetBox(){const e=$('netbox');if(!NET.on){e.style.display='none';return}const os=NET.others();e.style.display='block';e.textContent='🌐 '+(NET.host?'ホスト':'ゲスト')+'・'+(os.length+1)+'人'}
$('nHost').onclick=async()=>{SFX.click();if(STATE!=='play'){const s=loadSave();if(s)applySave(s);startPlay(true)}await netHost();showScr('');};
$('nBack').onclick=()=>{SFX.click();showScr(STATE==='play'?'menu':'title')};
// ---- 地図 ----
function uiMap(){$('bMap').classList.toggle('act',CAM.map);$('mapInfo').style.display=CAM.map?'block':'none';if(CAM.map){const pct=Math.floor((W.open.size-1)/NTILE*100);$('mapInfo').innerHTML=`<b>ガイア</b><span>${pct}% ・ タイル ${W.open.size-1}/${NTILE}</span><small>ドラッグで回す・もう一度🌍でもどる</small>`}}
// ---- タイトル ----
function toTitle(){if(NET.on)netLeave();autoStop();STATE='title';document.body.classList.remove('playing');CAM.map=true;document.body.classList.add('mapv');showScr('title');const s=loadSave();$('tCont').style.display=s?'':'none';$('tNew').textContent=s?'はじめから':'はじめる'}
function startPlay(keepScr){STATE='play';MUSIC.on=true;document.body.classList.add('playing');CAM.map=false;document.body.classList.remove('mapv');CAM.ready=0;if(!keepScr)showScr('');uiMap();HUD_DIRTY=true;resKey='';topKey=''}
$('tCont').onclick=async()=>{SFX.click();ac();let s=loadSave();
  if(s&&s.cloud){let h=null;try{h=await Promise.race([clHead(s.cloud),new Promise(r=>setTimeout(()=>r(undefined),4000))])}catch(e){h=undefined}
    if(h&&h.s&&h.s!==s.cloudS){const yes=await ask('ずっと使えるコード','コード '+clShow(s.cloud)+' は、別の場所で新しくなっています（'+(h.p|0)+'%）。最新の中身を読みこみますか？',{ok:'最新を読みこむ'});
      if(yes){try{s=await clLoad(s.cloud);LSset(SAVE_KEY,JSON.stringify(s))}catch(e){toast('読みこめませんでした：'+clErr(e))}}else{CL.conf=true;toast('この端末のぶんで続けます（コードには上書きしません）')}}}
  const made=applySave(s);startPlay();if(made>0)setTimeout(()=>toast('いないあいだに精錬所が '+made+' こ作っていました'),400)};
$('tNew').onclick=async()=>{SFX.click();ac();const old=loadSave();if(old&&!(await ask('はじめから','いまのセーブを消して、はじめからにしますか？'+(old.cloud?'（ずっと使えるコード '+clShow(old.cloud)+' の中身はそのまま残ります。新しいゲームはそのコードには上書きしません）':'（消す前にメニューのセーブコードでとっておけます）'),{ok:'はじめからにする'})))return;applySave(null);LSset(SAVE_KEY,JSON.stringify(snapshot()));startPlay();setTimeout(()=>banner('ガイア','木に近づくと自動で切れるよ'),500)};
$('tOnline').onclick=()=>{SFX.click();ac();openOnline()};
$('tCode').onclick=()=>{SFX.click();codeMode='';$('codeCloud').style.display='none';codeBig(false);$('codeTa').value='';$('codeMsg').textContent='セーブコード（長いコードか、ずっと使えるコード LUC-…）をはりつけて「このコードを読みこむ」を押してね';showScr('codeScr')};
// ---- エンディング ----
function goPortal(){SFX.portal();W.clear=1;saveGame();const t=Math.round(W.play||0);$('endStat').innerHTML=`遊んだ時間 ${Math.floor(t/3600)}時間${Math.floor(t%3600/60)}分<br>開いたタイル ${W.open.size-1}/${NTILE}`;showScr('ending');STATE='ending';document.body.classList.remove('playing')}
$('endBack').onclick=()=>{SFX.click();const B=portalB();if(B)B.went=0;respawn();startPlay()};

// ---- 放置モードの画面 ----
function openAuto(){inputReset();const L=autoKinds();if(AUTO.first){AUTO.first=false;L.filter(x=>x.type==='node').forEach(x=>AUTO.sel.add(x.id));autoSaveSel()}
  const el=$('autoList');el.innerHTML='';
  for(const x of L){const d=document.createElement('div');d.className='ai'+(x.type==='enemy'?' en':'')+(AUTO.sel.has(x.id)?' on':'');
    const N=x.type==='node'?NODE[x.k]:null;d.innerHTML=x.type==='node'?`${iconImg(N.res)}<span>${N.n}</span><small>${RES[N.res].n}・${x.n}こ</small>`:`${iconImg('weap')}<span>${ENEMY[x.k].n}</span><small>たおす・${x.n}ひき</small>`;
    d.onclick=()=>{SFX.click();if(AUTO.sel.has(x.id))AUTO.sel.delete(x.id);else AUTO.sel.add(x.id);d.classList.toggle('on',AUTO.sel.has(x.id));autoSaveSel();autoNote(L)};el.appendChild(d)}
  if(!L.length)el.innerHTML='<div class="empty">まだ取れるものがありません</div>';autoNote(L);$('autoGo').textContent=AUTO.on?'この内容で続ける':'放置をはじめる';showScr('autoScr')}
function autoNote(L){const n=L.filter(x=>AUTO.sel.has(x.id)).length;$('autoNote').textContent=n?n+'つえらんでいます'+(L.some(x=>x.type==='enemy'&&AUTO.sel.has(x.id))?'（敵もたおしに行きます。体力が少なくなったら、はじめの島で休みます）':''):'取るものを1つ以上えらんでください'}
function autoSaveSel(){LSset('lu-auto',JSON.stringify([...AUTO.sel]))}
$('bAuto').onclick=()=>{SFX.click();openAuto()};
$('autoSet').onclick=()=>{SFX.click();openAuto()};
$('autoOff').onclick=()=>{SFX.click();autoStop()};
$('autoAll').onclick=()=>{SFX.click();autoKinds().forEach(x=>AUTO.sel.add(x.id));autoSaveSel();openAuto()};
$('autoNone').onclick=()=>{SFX.click();autoKinds().forEach(x=>AUTO.sel.delete(x.id));autoSaveSel();openAuto()};
$('autoGo').onclick=()=>{SFX.click();if(!autoKinds().some(x=>AUTO.sel.has(x.id))){toast('取るものをえらんでください');return}if(!AUTO.on&&!autoStart())return;AUTO.tgt=null;showScr('')};
$('autoBack').onclick=()=>{SFX.click();showScr('')};
function uiAuto(){$('bAuto').classList.toggle('act',AUTO.on)}
let autoKey='';function drawAutoBar(){if(!AUTO.on)return;const g=Object.keys(AUTO.got).filter(k=>AUTO.got[k]>0).map(k=>RES[k].n+'+'+fmt(AUTO.got[k])).join(' ');const k=AUTO.st+'|'+g;if(k===autoKey)return;autoKey=k;$('autoTxt').textContent=AUTO.st||'さがしています…';$('autoGot').textContent=g?'集めたもの：'+g:''}
