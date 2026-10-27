// ================= ドロップを開ける画面（スタードロップ：4回タップ／カオスドロップ：3回の猶予・分裂）と新キャラ入手 =================
let DS=null;
function dropSetRar(r,pop){const D=DRAR[r],sc=$('dropScr');sc.style.setProperty('--d0',D.bg[0]);sc.style.setProperty('--d1',D.bg[1]);sc.style.setProperty('--d2',D.bg[2]);sc.style.setProperty('--d3',D.bg[3]||'#05030c');sc.style.setProperty('--dg',D.c);
  const e=$('sdRar');e.textContent=D.n;e.style.setProperty('--rc',D.c);if(pop){e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}}
function dropDraw(cls){const n=DS.n,st=$('dStage');st.className='dStage n'+n;const svg=DS.type==='chaos'?chaosSvg(DS.r):starrSvg(DS.r);
  st.innerHTML=Array.from({length:n},(_,i)=>`<div class="dDrop ${cls}" style="animation-delay:${cls==='sSpl'?i*.04:0}s">${svg}</div>`).join('')}
function dropAnim(cls){for(const e of $('dStage').children){e.classList.remove('sIn','sIdle','sHit','sUp','sSpl','sShake','sOpen');void e.offsetWidth;e.classList.add(cls)}}
function dropPips(glow){const d=DS,max=d.type==='chaos'?3:4,left=max-(d.type==='chaos'?d.wt:d.taps);
  $('dPips').innerHTML=Array.from({length:max},(_,i)=>`<i class="${i<left?(glow?'g':''):'off'}"></i>`).join('');$('dHintT').textContent=left>0?'タップ！':'オープン！'}
function dropSparks(col,n,big){const fx=$('dFx'),R=VH()/100;for(let i=0;i<n;i++){const e=document.createElement('i'),a=Math.random()*TAU,dd=(big?30:18+Math.random()*10)*R*(0.6+Math.random()*.8);
    e.style.cssText=`--x:${Math.cos(a)*dd}px;--y:${Math.sin(a)*dd}px;--pc:${col};animation-delay:${Math.random()*.08}s;width:${big?1.6:1.1}vmin;height:${big?1.6:1.1}vmin`;fx.appendChild(e);setTimeout(()=>e.remove(),1000)}}
function dropFlash(o){const f=$('dFlash');f.style.setProperty('--fo',o||.9);f.classList.remove('fl');void f.offsetWidth;f.classList.add('fl')}
function dropFloat(t){const e=$('dFloat');e.textContent=t;e.classList.remove('fl');void e.offsetWidth;e.classList.add('fl')}
function dropStreaks(){const h=$('dStreaks');if(h.childElementCount)return;let s='';for(let i=0;i<34;i++)s+=`<i style="--a:${(i*137.5%360).toFixed(1)}deg;--sd:${(0.9+(i*7%10)/12).toFixed(2)}s;--dl:${(-(i*0.37)%1.6).toFixed(2)}s"></i>`;h.innerHTML=s}
function openDrop(type){type=type==='chaos'?'chaos':'starr';if(DS||dropN(type)<=0)return;addDrop(type,-1);const P=type==='chaos'?planChaos():planStarr();
  DS={type,r:type==='chaos'?1:0,n:1,taps:0,wt:0,nextAt:1+Math.floor(Math.random()*3),ev:P.ev?P.ev.slice():null,P,busy:true,phase:'in',rew:[],ri:0};
  const sc=$('dropScr');sc.classList.add('on');sc.classList.toggle('chaos',type==='chaos');$('dRew').classList.remove('on');$('dSum').classList.remove('on');$('dHint').style.display='';$('sdRar').style.display='';
  dropStreaks();dropSetRar(DS.r,true);dropDraw('sIn');dropPips();tn(160,.6,.12,'sine',700);nz(.5,.12,900,'bandpass');
  const d0=DS;setTimeout(()=>{if(DS!==d0||d0.phase!=='in')return;d0.phase='tap';dropAnim('sIdle');dropFree(d0)},820)}
// レア度が上がる（k段。スタードロップは1回のタップで一気に何段も上がることがある）
function dropUp(k,cb){const d=DS;let i=0;const one=()=>{if(DS!==d)return;d.r++;const D=DRAR[d.r];dropFlash(.85);dropSetRar(d.r,true);dropDraw('sUp');dropSparks(D.c,26+d.r*6);dropSparks('#ffffff',10);
    [523,659,784,1047,1319].slice(0,2+Math.min(3,d.r)).forEach((f,j)=>tn(f*(1+i*.12),.2,.14,'triangle',0,j*.05));nz(.25,.12,2400,'highpass');
    if(++i<k)setTimeout(one,300);else setTimeout(cb,520)};one()}
// 分裂（カオスドロップ）：2つ・4つ・8つ
function dropSplit(cb){const d=DS;dropAnim('sShake');tn(300,.35,.1,'sawtooth',900);
  setTimeout(()=>{if(DS!==d)return;d.n*=2;dropFlash(.9);dropDraw('sSpl');dropFloat('×'+d.n);dropSparks(DRAR[d.r].c,34);dropSparks('#ffffff',14);tn(1100,.14,.14,'square',500);tn(660,.3,.12,'triangle',1320,.08);nz(.3,.18,3000)},380);
  setTimeout(cb,1000)}
function dropHit(){dropAnim('sHit');dropSparks('#ffffff',7);const d=DS,k=d.type==='chaos'?d.wt:d.taps;tn(300+k*70,.09,.13,'square');nz(.06,.08,1800)}
function dropFree(d){if(DS!==d)return;d.busy=false;if(d.q&&d.phase==='tap'){d.q=0;setTimeout(tapDrop,60)}}
function tapDrop(){const d=DS;if(!d)return;if(d.busy){if(d.phase==='tap'||d.phase==='in')d.q=1;return}if(d.phase==='rew'){d.ri++;revealStep();return}if(d.phase!=='tap')return;
  if(d.type==='starr'){d.taps++;const k=d.P.at.filter(t=>t===d.taps).length;dropPips();d.busy=true;
    const after=()=>{if(DS!==d)return;if(d.taps>=4){d.phase='open';d.q=0;setTimeout(dropOpen,350)}else{dropAnim('sIdle');dropFree(d)}};
    if(k)dropUp(k,after);else{dropHit();setTimeout(after,200)}return}
  d.wt++;d.busy=true;
  if(d.ev.length&&d.wt>=d.nextAt){const e=d.ev.shift();d.wt=0;d.nextAt=1+Math.floor(Math.random()*3);dropPips();
    const done=()=>{if(DS!==d)return;dropPips(true);dropAnim('sIdle');dropFree(d)};if(e==='u')dropUp(1,done);else dropSplit(done);return}
  dropHit();dropPips();if(d.wt>=3){d.phase='open';d.q=0;setTimeout(dropOpen,450)}else setTimeout(()=>{if(DS!==d)return;dropAnim('sIdle');dropFree(d)},200)}
function dropOpen(){const d=DS;if(!d)return;d.phase='open';d.busy=true;$('dHint').style.display='none';dropAnim('sShake');tn(180,.75,.12,'sawtooth',1400);nz(.7,.1,600,'bandpass',2);
  // 中身はここで決めて、すぐにセーブへ入れる（途中で閉じても無くならない）
  const T=d.type==='chaos'?CD_TAB[d.r]:SD_TAB[d.r],cf=coinFx;coinFx=()=>{};try{for(let i=0;i<d.n;i++)d.rew.push(grantDrop(rollTab(T)))}finally{coinFx=cf}
  setTimeout(()=>{if(DS!==d)return;dropFlash(1);dropAnim('sOpen');dropSparks(DRAR[d.r].c,50,1);dropSparks('#ffffff',24,1);nz(.5,.3,3000);tn(880,.4,.14,'triangle',1760);
    setTimeout(()=>{if(DS!==d)return;$('dStage').innerHTML='';$('sdRar').style.display='none';d.phase='rew';d.ri=0;revealStep()},420)},760)}
// ---- 中身の見せ方 ----
function pileArt(ic,n){const c=n>=1000?11:n>=500?9:n>=200?7:n>=100?5:n>=50?4:3,P=[[50,58],[36,64],[64,64],[44,44],[58,44],[24,72],[76,72],[50,30],[30,50],[70,50],[50,76]].slice(0,c).sort((a,b)=>a[1]-b[1]);
  return `<span class="pile">${P.map(([x,y],i)=>`<i style="left:${x}%;top:${y}%;--r:${(i*47%34)-17}deg;animation-delay:${.05+i*.035}s">${ic}</i>`).join('')}</span>`}
function rewArt(R,small){switch(R.k){case 'coins':case 'pp':case 'cr':case 'bl':return small?`<span class="one">${R.ic}</span>`:pileArt(R.ic,R.n);case 'xpd':return `<span class="one">${R.ic}</span>`;
    case 'kit':return `<span class="kitA"><i>${ICON[R.K==='gad'?'gadget':R.K==='sp'?'spow':'hyper']}</i><span class="pb">${pic(R.id)}</span></span>`;
    case 'buf':return `<span class="kitA"><i>${ICON.buffy}</i><span class="pb">${pic(R.id)}</span></span>`;
    case 'pin':return pinArt(R.id,R.i,!small);case 'spray':return sprayArt(R.id);case 'icon':return iconArt(R.id);
    case 'char':return `<span class="one pic">${pic(R.id)}</span>`;case 'skin':return `<span class="one pic">${pic(R.id,skinById(R.id,R.sk))}</span>`}return ''}
const rewAmt=R=>R.n?'x'+numTxt(R.n):'';
const rewShort=R=>rewAmt(R)||({char:BT[R.id]&&BT[R.id].name,skin:R.sk&&skinById(R.id,R.sk).name,kit:{gad:'ガジェット',sp:'スターパワー',hyper:'ハイパー'}[R.K],buf:'バフィー',pin:'ピン',spray:'スプレー',icon:'アイコン'})[R.k]||R.title;
function revealStep(){const d=DS;if(!d)return;const R=d.rew[d.ri];if(!R){dropSummary();return}
  if(R.show){$('dRew').classList.remove('on');d.busy=true;unlockShow(Object.assign({},R.show,{done:()=>{if(DS!==d)return;d.busy=false;d.ri++;revealStep()}}));return}
  const w=$('dRew');$('rwCnt').textContent=d.n>1?(d.ri+1)+'/'+d.n:'';$('rwTitle').textContent=R.title;$('rwArt').innerHTML=rewArt(R);$('rwAmt').textContent=rewAmt(R);
  $('rwSub').textContent=R.sub||'';$('rwNote').textContent=R.note?R.note+'（すでに持っているため）':'';$('rwNote').style.display=R.note?'':'none';
  w.classList.remove('on');void w.offsetWidth;w.classList.add('on');d.busy=true;setTimeout(()=>{if(DS===d)d.busy=false},420);
  if(R.n){const el=$('rwAmt'),t0=performance.now(),N=R.n;const f=()=>{const k=Math.min(1,(performance.now()-t0)/600);el.textContent='x'+numTxt(Math.round(N*k*k*(3-2*k)));if(k<1&&DS===d)requestAnimationFrame(f)};requestAnimationFrame(f)}
  SFX.gem();tn(660,.12,.12,'triangle',990,.05);if(R.k==='kit'||R.k==='pin'||R.k==='spray'||R.k==='icon')SFX.superReady()}
function dropSummary(){const d=DS;$('dRew').classList.remove('on');const more=dropN(d.type);
  if(d.rew.length<=1&&!more){dropClose();return}
  $('sumG').className='sumG n'+Math.min(8,d.rew.length);$('sumG').innerHTML=d.rew.map((R,i)=>`<div class="sT" style="animation-delay:${i*.05}s"><span class="sA">${rewArt(R,1)}</span><b class="tx">${rewShort(R)}</b></div>`).join('');
  $('sumNext').style.display=more?'':'none';$('sumNext').innerHTML=`<span class="tx">次を開ける（あと${more}）</span>`;$('dSum').classList.add('on');d.phase='sum';d.busy=false;fillIcons($('dSum'))}
function dropClose(){$('dropScr').classList.remove('on','chaos');$('dSum').classList.remove('on');$('dRew').classList.remove('on');DS=null;lobbyModel();drawHome()}
function drawDropBtns(){const ns=dropN('starr'),nc=dropN('chaos');$('dropSm').textContent=ns>0?'スタードロップ ×'+ns:'スタードロップ';$('dropBtn').classList.toggle('has',ns>0);
  $('cdropSm').textContent='カオスドロップ ×'+nc;$('cdropBtn').style.display=nc>0?'':'none'}
$('dropScr').addEventListener('click',e=>{if(e.target.closest('button'))return;tapDrop()});
$('sumOk').addEventListener('click',e=>{e.stopPropagation();dropClose()});
$('sumNext').addEventListener('click',e=>{e.stopPropagation();const t=DS&&DS.type;DS=null;$('dSum').classList.remove('on');openDrop(t)});
$('dropBtn').addEventListener('click',()=>{if(dropN('starr')<=0){note('スタードロップは勝利ボーナス・トロフィーロード・パス・ショップでもらえます',2.6);return}openDrop('starr')});
$('cdropBtn').addEventListener('click',()=>openDrop('chaos'));
addEventListener('keydown',e=>{if(e.repeat)return;if(DS&&(e.code==='Space'||e.code==='Enter')&&!$('unlockScr').classList.contains('on')){e.preventDefault();if(DS.phase==='sum')dropClose();else tapDrop()}});
// ================= 新キャラ・新スキン・バフィーの入手（本家風：レア度の色の背景・キャラが飛びこんでくる・名前の帯・説明） =================
const UNQ=[];let UNL=null,UNL3=null;
function popUnlock(title,sub,svg){unlockShow({kind:'gen',title,sub,svg})}
function unlockShow(it){UNQ.push(it);if(!UNL)nextPop()}
function unl3d(){if(UNL3)return UNL3;const g=new THREE.Group();g.position.set(0,0,-6);LOBBY.add(g);
  const bgM=new THREE.MeshBasicMaterial({color:0xffffff}),bg=new THREE.Mesh(new THREE.PlaneGeometry(46,28),bgM);g.add(bg);
  const rayT=ctex(512,512,(c,w,h)=>{c.translate(w/2,h/2);for(let i=0;i<16;i++){c.rotate(TAU/16);const gr=c.createLinearGradient(0,0,0,-w/2);gr.addColorStop(0,'rgba(255,255,255,.34)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.beginPath();c.moveTo(0,0);c.lineTo(-38,-w/2);c.lineTo(38,-w/2);c.fill()}});
  const ray=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshBasicMaterial({map:rayT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));ray.position.z=.05;g.add(ray);
  g.visible=false;UNL3={g,bg,bgM,ray,tex:{}};return UNL3}
function unlTex(col){const U=unl3d();if(U.tex[col])return U.tex[col];
  U.tex[col]=ctex(640,384,(c,w,h)=>{const gr=c.createRadialGradient(w*.5,h*.5,10,w*.5,h*.5,w*.62);gr.addColorStop(0,'#fff');gr.addColorStop(.1,col);gr.addColorStop(1,col);c.fillStyle=gr;c.fillRect(0,0,w,h);
    c.fillStyle='rgba(0,0,0,.22)';c.fillRect(0,0,w,h);const g2=c.createRadialGradient(w*.5,h*.5,10,w*.5,h*.5,w*.36);g2.addColorStop(0,'rgba(255,255,255,.75)');g2.addColorStop(.45,'rgba(255,255,255,.18)');g2.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g2;c.fillRect(0,0,w,h);
    c.fillStyle='rgba(0,0,0,.07)';for(let y=20;y<h;y+=58)for(let x=(y/58%2)*34+14;x<w;x+=68){c.beginPath();c.arc(x,y,13,Math.PI,0);c.lineTo(x+13,y+8);c.lineTo(x+7,y+8);c.lineTo(x+7,y+15);c.lineTo(x-7,y+15);c.lineTo(x-7,y+8);c.lineTo(x-13,y+8);c.fill()}});return U.tex[col]}
function unlModel(id,SK){if(lobbyChar)scene.remove(lobbyChar.g);lobbyChar=mkModel(id,0xffd84d,false,SK&&SK.id!=='base'?SK:null);lobbyChar.g.remove(lobbyChar.shield);if(lobbyChar.ringM)lobbyChar.ringM.visible=false;
  lobbyChar.g.position.set(0,0,LZ);lobbyId='unl';emoteT=0}
function nextPop(){const prev=UNL;if(prev&&prev.done){const f=prev.done;prev.done=null;UNL=null;f();if(UNL)return}
  const it=UNQ.shift();if(!it){unlockEnd();return}UNL=it;it.t0=performance.now();
  const B=BT[it.id],isGen=it.kind==='gen',sk=it.kind==='skin'?skinById(it.id,it.sk):null;
  const col=isGen?'#ffc21a':sk?DRAR[Math.max(0,sk.t)].c:it.kind==='buf'?'#e84fc0':RARC[B.rar]||'#62c8ff';
  document.body.classList.add('unl');const sc=$('unlockScr');sc.style.setProperty('--rc',col);sc.classList.remove('on','gen');void sc.offsetWidth;sc.classList.add('on');sc.classList.toggle('gen',isGen);
  const U=unl3d();U.bgM.map=unlTex(col);U.bgM.needsUpdate=true;
  if(!isGen)unlModel(it.id,sk||(it.kind==='char'?null:skinOf(it.id)));
  let nw,nm,role,cnt,desc,sel=null;
  if(it.kind==='char'){const L=BT_IDS.filter(x=>BT[x].rar===B.rar),k=L.filter(x=>ownedReal().includes(x)).length;nw='新キャラクター！';nm=B.name;role=B.role;
    cnt=`${k}/${L.length} <span>${RARN[B.rar]||B.rar}</span>キャラクター`;desc=B.desc.replace(/\{([\d.]+)\}/g,(_,n)=>Math.round(+n))+(B.trait?'<br><b>特性：</b>'+B.trait:'');sel='選択'}
  else if(it.kind==='skin'){const own=skinsOwned(it.id).length;nw='新しいスキン！';nm=sk.name+' '+B.name;role=B.name+'のスキン';cnt=`<span>${sk.t>=0?DRAR[sk.t].n:'パス限定'}</span>スキン（${own}/${SKINS[it.id].length}）`;desc=B.name+'の「'+sk.name+'」スキンを手に入れました！';sel='つける'}
  else if(it.kind==='buf'){nw='バフィー！';nm=bufName[it.k];role=B.name;const X=BUF[it.id],lv=level(it.id);cnt=`${['gad','sp','hyper'].filter(x=>J('gr-bf-'+it.id,{})[x]).length}/3 <span>バフィー</span>`;
    desc=it.k==='hyper'?`ハイパーチャージが2秒長くなる<br>${fmtLv(X.hyper,lv)}`:B[it.k].map((g,i)=>`<b>${g.name}</b>：${fmtLv(X[it.k][i],lv)}`).join('<br>')}
  else{nw=it.title;nm=it.sub;role='';cnt='';desc=''}
  $('unNew').textContent=nw;$('unName').textContent=nm;$('unName').style.fontSize='calc(var(--u)*'+Math.max(4.4,Math.min(8.6,52/Math.max(1,nm.length))).toFixed(2)+')';$('unRole').textContent=role;$('unCnt').innerHTML=cnt;$('unDesc').innerHTML=desc;$('unPic').innerHTML=isGen?it.svg:'';
  $('unSel').style.display=sel?'':'none';$('unSel').innerHTML=`<span class="tx">${sel||''}</span>`;
  SFX.lvup();nz(.4,.2,1800,'bandpass');setTimeout(()=>{if(UNL===it){confetti(VW()*.3,VH()*.55,60);setTimeout(()=>confetti(VW()*.7,VH()*.4,40),260)}},420)}
function unlockEnd(){UNL=null;document.body.classList.remove('unl');$('unlockScr').classList.remove('on');if(UNL3)UNL3.g.visible=false;if(LOBBY.userData.hid){for(const [o,v] of LOBBY.userData.hid)o.visible=v;LOBBY.userData.hid=null}
  lobbyId='';const det=$('charScr').classList.contains('det');lobbyModel(det?CVIEW:undefined);if(det)drawDetail(CVIEW);if($('charScr').classList.contains('on')&&!det)drawChar();drawHome()}
$('unOk').addEventListener('click',e=>{e.stopPropagation();nextPop()});
$('unSel').addEventListener('click',e=>{e.stopPropagation();const it=UNL;if(!it)return;if(it.kind==='char'){PICK=it.id;LSset('gr-pick',it.id)}else if(it.kind==='skin')LSset('gr-skin-'+it.id,it.sk);SFX.superReady();nextPop()});
// 3D：背景をレア度の色にして、キャラが上から飛びこんでくる
const _updLobby=updLobby;updLobby=function(dt){_updLobby(dt);const it=UNL;if(!it||!UNL3)return;
  if(!LOBBY.userData.hid){LOBBY.userData.hid=LOBBY.children.map(o=>[o,o.visible])}for(const o of LOBBY.children)o.visible=o===UNL3.g;
  const asp=VW()/VH(),port=asp<1,x0=port?0:-1.28*Math.min(asp,2.2),y0=port?1.7:-.55,sc=port?1.25:1.5,t=(performance.now()-it.t0)/1000;
  const bx=x0*1.58,by=2.5+(y0+2-2.5)*1.58;UNL3.ray.position.set(bx,by,.05);UNL3.bg.position.set(bx,by,0);UNL3.ray.rotation.z=-t*.25;UNL3.ray.scale.setScalar(port?.8:1);const ry=port?0:.4;
  const c=lobbyChar;if(!c||it.kind==='gen'){if(c)c.g.visible=false;return}c.g.visible=true;
  if(t<.42){const k=t/.42;c.g.position.set(x0,y0+(1-k*k)*7,LZ);c.g.rotation.y=ry-(1-k)*TAU*1.5;c.g.scale.set(sc,sc,sc)}
  else if(t<.78){const k=(t-.42)/.36,sq=Math.sin(k*Math.PI)*.16;c.g.position.set(x0,y0,LZ);c.g.rotation.y=ry;c.g.scale.set(sc*(1+sq),sc*(1-sq),sc*(1+sq))}
  else{const k=t-.78;c.g.position.set(x0,y0+Math.abs(Math.sin(k*2.2))*.06,LZ);c.g.rotation.y=ry+Math.sin(k*.9)*.22;c.g.scale.set(sc,sc,sc);c.torso.position.y=.5+Math.sin(k*2.4)*.04;c.hR.position.y=.4+Math.sin(k*2.4)*.05}};
// ---- クレジットでキャラを解放 ----
function crPop(id){const B=BT[id],cost=CR_COST[B.rar],rd=ROAD.find(r=>r.char===id),ok=cost&&cr()>=cost;
  dPop(`<h3 class="tx">${B.name}</h3><div class="crPop" style="--rc:${RARC[B.rar]}"><span class="art">${pic(id)}</span><div><b class="tx rar">${RARN[B.rar]}・${B.role}</b>`+
    `<p>${rd?'トロフィーロード（合計トロフィー '+rd.t+'）・':''}スタードロップ・カオスドロップからも出ます</p><p class="have"><i>${ICON.credit}</i><b class="tx">${numTxt(cr())}</b> クレジット</p>`+
    (cost?`<button class="go ${ok?'grn':'blu'}" id="crBuy" ${ok?'':'disabled'}><span class="tx">解放する</span><i>${ICON.credit}</i><b class="tx">${cost}</b></button>`:'')+`</div></div>`);
  const b=$('crBuy');if(b)b.onclick=()=>{if(cr()<cost)return;addCr(-cost);$('dPop').classList.remove('on');unlockChar(id);drawChar()}}
