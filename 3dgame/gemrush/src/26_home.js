// ================= ホーム画面・キャラクター（本家の配置と見た目） =================
function portrait(id,SK){SK=SK||(typeof skinOf==='function'?skinOf(id):null)||{};const B=BT[id],hx=n=>'#'+n.toString(16).padStart(6,'0'),c=hx(SK.body||B.col),h=v=>SK.hair?hx(SK.hair):v;
  const face='<circle cx="40" cy="34" r="18" fill="#ffd2a8"/><circle cx="33" cy="35" r="4" fill="#fff"/><circle cx="47" cy="35" r="4" fill="#fff"/><circle cx="33" cy="36" r="2" fill="#222"/><circle cx="47" cy="36" r="2" fill="#222"/>';
  const body=`<rect x="24" y="44" width="32" height="30" rx="12" fill="${c}"/>`;
  const P={jack:body+face+`<path d="M22 30 Q40 8 58 30 L56 24 Q40 14 24 24Z" fill="${h('#8a3a1e')}"/><ellipse cx="42" cy="13" rx="14" ry="8" fill="${h('#8a3a1e')}"/><rect x="27" y="31" width="26" height="6" rx="3" fill="#111318"/>`,
   goro:body+face+`<path d="M22 30 Q40 4 58 30Z" fill="${h('#e8b43a')}"/><circle cx="40" cy="16" r="4" fill="#fff6b0"/><ellipse cx="40" cy="45" rx="13" ry="7" fill="#fff"/><rect x="58" y="46" width="4" height="16" fill="#d8343a"/>`,
   kachiko:`<rect x="30" y="52" width="20" height="20" rx="8" fill="${c}"/><circle cx="40" cy="36" r="19" fill="${h('#5a6070')}"/><circle cx="40" cy="37" r="6" fill="#ff3b3b"/><rect x="39" y="8" width="2" height="10" fill="#c9a36b"/><circle cx="40" cy="8" r="3" fill="#ffc53d"/>`,
   piko:`<rect x="22" y="46" width="36" height="28" rx="4" fill="${c}"/><rect x="21" y="14" width="38" height="32" rx="4" fill="${h('#4b3ab8')}"/><rect x="26" y="19" width="28" height="20" rx="2" fill="#0f1a14"/><rect x="31" y="24" width="5" height="5" fill="#5dff8a"/><rect x="44" y="24" width="5" height="5" fill="#5dff8a"/><rect x="33" y="32" width="14" height="3" fill="#5dff8a"/>`,
   kagerou:body+face+`<path d="M22 32 Q40 6 58 32 L58 28 Q40 14 22 28Z" fill="${h('#1c1a24')}"/><rect x="28" y="24" width="14" height="12" fill="${h('#1c1a24')}"/><rect x="24" y="48" width="32" height="7" rx="3" fill="#6f3fb0"/><rect x="50" y="52" width="16" height="5" rx="2" fill="#6f3fb0"/>`,
   ranran:`<rect x="14" y="58" width="52" height="16" rx="8" fill="#3a3f4d"/><circle cx="20" cy="72" r="7" fill="#8a5a2e"/><circle cx="60" cy="72" r="7" fill="#8a5a2e"/>`+`<rect x="28" y="42" width="24" height="18" rx="8" fill="${c}"/>`+face+`<path d="M22 32 Q40 6 58 32Z" fill="${h('#ff6fb5')}"/><path d="M22 26 12 14 26 20Z" fill="${h('#ff6fb5')}"/><path d="M58 26 68 14 54 20Z" fill="${h('#ff6fb5')}"/>`,
   vlad:body.replace('#ffd2a8','')+face.replace('#ffd2a8','#d8e0ea')+`<ellipse cx="40" cy="19" rx="22" ry="3" fill="${h('#1c1a24')}"/><rect x="29" y="1" width="22" height="18" rx="2" fill="${h('#1c1a24')}"/><rect x="29" y="14" width="22" height="3" fill="#b3262f"/><path d="M20 48 L12 74 L28 70Z" fill="#8a1a2a"/><path d="M60 48 L68 74 L52 70Z" fill="#8a1a2a"/>`,
   soda:body+`<path d="M22 12 H58 L54 50 H26Z" fill="#ffb13b" opacity=".9"/><rect x="21" y="10" width="38" height="6" rx="2" fill="${h('#2f8fe0')}"/><rect x="46" y="0" width="3" height="14" fill="#ff4d6d" transform="rotate(15 47 7)"/><circle cx="33" cy="30" r="5" fill="#fff"/><circle cx="47" cy="30" r="5" fill="#fff"/><circle cx="33" cy="31" r="2.5" fill="#222"/><circle cx="47" cy="31" r="2.5" fill="#222"/>`};
  Object.assign(P,{rico:body+face+`<path d="M22 32 Q40 8 58 32 L56 24 Q40 12 24 24Z" fill="${h('#ff8a3d')}"/><ellipse cx="60" cy="30" rx="6" ry="10" fill="${h('#ff8a3d')}"/><rect x="54" y="52" width="16" height="6" rx="2" fill="#9aa3b5"/>`,
   yuki:body+face+`<path d="M20 36 Q40 4 60 36 L58 26 Q40 10 22 26Z" fill="${h('#8a5a36')}"/><circle cx="24" cy="16" r="6" fill="${h('#8a5a36')}"/><circle cx="56" cy="16" r="6" fill="${h('#8a5a36')}"/><circle cx="24" cy="16" r="3" fill="#e0a57a"/><circle cx="56" cy="16" r="3" fill="#e0a57a"/>`,
   gai:`<rect x="16" y="44" width="48" height="32" rx="12" fill="${c}"/>`+face+`<rect x="36" y="4" width="8" height="18" rx="3" fill="${h('#2b2d36')}"/><circle cx="40" cy="44" r="3" fill="none" stroke="#c9ced8" stroke-width="1.6"/><path d="M32 29 38 31M48 29 42 31" stroke="#222" stroke-width="2"/>`,
   jet:body+face+`<path d="M22 30 Q40 8 58 30 L56 24 Q40 14 24 24Z" fill="${h('#2b2d36')}"/><rect x="25" y="31" width="30" height="7" rx="3" fill="#111318"/><rect x="58" y="48" width="18" height="6" rx="2" fill="#5a6070"/>`,
   riki:`<rect x="16" y="44" width="48" height="32" rx="12" fill="${c}"/><circle cx="40" cy="32" r="19" fill="${h('#2f6fd8')}"/><path d="M29 30 Q33 25 37 30 Q33 36 29 30ZM43 30 Q47 25 51 30 Q47 36 43 30Z" fill="#fff"/><circle cx="33" cy="30" r="2" fill="#222"/><circle cx="47" cy="30" r="2" fill="#222"/><path d="M40 13 36 22H44Z" fill="#ffd84d"/><rect x="33" y="41" width="14" height="4" rx="2" fill="#ffd2a8"/>`,
   carlo:body+`<circle cx="40" cy="34" r="18" fill="#f2eee4"/><circle cx="33" cy="33" r="4.5" fill="#222"/><circle cx="47" cy="33" r="4.5" fill="#222"/><rect x="33" y="43" width="14" height="3" fill="#222"/><path d="M22 26 Q40 10 58 26" stroke="${h('#3f8a5c')}" stroke-width="5" fill="none"/><rect x="58" y="44" width="6" height="22" rx="2" fill="#c9a36b"/>`,
   mimi:body+face+`<path d="M22 32 Q40 8 58 32 L56 24 Q40 12 24 24Z" fill="${h('#ff7a2e')}"/><circle cx="21" cy="28" r="6" fill="${h('#ff7a2e')}"/><circle cx="59" cy="28" r="6" fill="${h('#ff7a2e')}"/><rect x="30" y="12" width="20" height="5" rx="2" fill="#ffc53d"/>`,
   sumire:body+face+`<path d="M22 32 Q40 8 58 32 L56 24 Q40 12 24 24Z" fill="${h('#6a3a2a')}"/><ellipse cx="40" cy="17" rx="25" ry="4" fill="#d8c08a"/><rect x="29" y="5" width="22" height="12" rx="4" fill="#d8c08a"/><circle cx="33" cy="12" r="3" fill="#ff6fb5"/><circle cx="47" cy="12" r="3" fill="#ffd84d"/><circle cx="18" cy="60" r="8" fill="#4caf50"/><circle cx="62" cy="60" r="8" fill="#4caf50"/>`,
   tarubo:`<rect x="20" y="40" width="40" height="36" rx="6" fill="${c}"/><rect x="18" y="46" width="44" height="4" fill="#9aa3b5"/><rect x="18" y="66" width="44" height="4" fill="#9aa3b5"/><path d="M24 40 Q40 14 56 40Z" fill="#9aa3b5"/><rect x="31" y="30" width="18" height="5" rx="2" fill="#ff3b3b"/><path d="M26 22 L54 22 L40 10Z" fill="${h('#2b2d36')}"/><rect x="62" y="50" width="14" height="5" rx="2" fill="#5a6070"/><rect x="4" y="50" width="14" height="5" rx="2" fill="#5a6070"/>`,
   hatsue:`<rect x="16" y="44" width="48" height="32" rx="12" fill="${c}"/>`+face+`<circle cx="26" cy="20" r="8" fill="${h('#d8642a')}"/><circle cx="40" cy="15" r="9" fill="${h('#d8642a')}"/><circle cx="54" cy="20" r="8" fill="${h('#d8642a')}"/><circle cx="23" cy="31" r="6" fill="${h('#d8642a')}"/><circle cx="57" cy="31" r="6" fill="${h('#d8642a')}"/><circle cx="34" cy="26" r="5" fill="none" stroke="#9aa3b5" stroke-width="2"/><circle cx="46" cy="26" r="5" fill="none" stroke="#9aa3b5" stroke-width="2"/><rect x="58" y="50" width="16" height="10" rx="3" fill="#8a7a5a"/>`,
   gantetsu:`<rect x="16" y="44" width="48" height="32" rx="12" fill="${c}"/><circle cx="40" cy="33" r="19" fill="#9fb8a8"/><rect x="24" y="12" width="32" height="10" rx="2" fill="${h('#1c1d2a')}"/><circle cx="33" cy="34" r="4" fill="#fff"/><circle cx="47" cy="34" r="4" fill="#fff"/><circle cx="33" cy="35" r="2" fill="#222"/><circle cx="47" cy="35" r="2" fill="#222"/><rect x="18" y="31" width="5" height="3" fill="#9aa3b5"/><rect x="57" y="31" width="5" height="3" fill="#9aa3b5"/><rect x="64" y="20" width="3" height="40" fill="#6b4a2e"/><rect x="57" y="10" width="17" height="12" rx="2" fill="#9aa3b5"/>`,
   ayame:body+face+`<path d="M22 32 Q40 8 58 32 L56 24 Q40 12 24 24Z" fill="${h('#ffd27a')}"/><circle cx="40" cy="12" r="6" fill="${h('#ffd27a')}"/><path d="M50 8 Q66 -2 80 8Z" fill="${h('#ff8ac0')}"/><rect x="64" y="7" width="2" height="40" fill="#6b4a2e"/>`,
   shinobu:body+face+`<path d="M18 36 Q40 0 62 36 L58 28 Q40 12 22 28Z" fill="${h('#4caf50')}"/><circle cx="31" cy="13" r="6" fill="#fff"/><circle cx="49" cy="13" r="6" fill="#fff"/><circle cx="31" cy="14" r="3" fill="#222"/><circle cx="49" cy="14" r="3" fill="#222"/>`,
   sabo:`<rect x="24" y="46" width="32" height="28" rx="12" fill="${c}"/><ellipse cx="40" cy="32" rx="19" ry="21" fill="${h('#5cb83a')}"/><circle cx="33" cy="33" r="4" fill="#fff"/><circle cx="47" cy="33" r="4" fill="#fff"/><circle cx="33" cy="34" r="2" fill="#222"/><circle cx="47" cy="34" r="2" fill="#222"/><circle cx="40" cy="10" r="5" fill="#ff6fb5"/><path d="M20 26 14 24M20 38 14 40M60 26 66 24M60 38 66 40M28 16 25 11M52 16 55 11" stroke="#f2eedd" stroke-width="2"/><rect x="12" y="50" width="8" height="14" rx="4" fill="${h('#5cb83a')}"/><rect x="60" y="50" width="8" height="14" rx="4" fill="${h('#5cb83a')}"/>`,
   yotaka:`<rect x="24" y="46" width="32" height="28" rx="12" fill="${c}"/><circle cx="40" cy="34" r="19" fill="${h('#1c1d2a')}"/><circle cx="33" cy="32" r="4" fill="#fff"/><circle cx="47" cy="32" r="4" fill="#fff"/><circle cx="33" cy="32" r="2" fill="#d8343a"/><circle cx="47" cy="32" r="2" fill="#d8343a"/><path d="M34 38 L40 52 L46 38Z" fill="#ffc53d"/><path d="M30 16 40 4 50 16Z" fill="${h('#1c1d2a')}"/><path d="M20 50 L8 44 L22 60Z M60 50 L72 44 L58 60Z" fill="#b8c4d8"/>`});
  if(typeof portrait2==='function')Object.assign(P,portrait2(c,h,body,face));
  return `<svg viewBox="0 0 80 80">${P[id]||body+face}${SK.crown?'<path d="M28 6 32 -2 36 5 40 -4 44 5 48 -2 52 6Z" fill="#ffd84d" transform="translate(0 4)"/>':''}</svg>`}
// ---- 3Dモデルから作るキャラの絵（カード・アイコン用。できるまでは SVG の絵） ----
const PIC={},PICQ=[];let PICR=null;
const picKey=(id,SK)=>id+'|'+(SK&&SK.id||'base');
function pic(id,SK){if(SK===undefined)SK=skinOf(id);const k=picKey(id,SK);if(k in PIC&&PIC[k])return `<img src="${PIC[k]}" alt="" draggable="false">`;
  if(!(k in PIC)&&!PICQ.some(q=>q.k===k))PICQ.push({k,id,SK});return `<span class="pk" data-pk="${k}">${portrait(id,SK||undefined)}</span>`}
function picRender(id,SK){const N=448,O=224;
  if(!PICR){const rt=new THREE.WebGLRenderTarget(N,N);rt.texture.encoding=THREE.sRGBEncoding;const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x8a7a9a,.8));const d=new THREE.DirectionalLight(0xffffff,1);d.position.set(-3,5,6);sc.add(d);
    const cv=document.createElement('canvas');cv.width=cv.height=N;const cv2=document.createElement('canvas');cv2.width=cv2.height=O;PICR={rt,sc,c:new THREE.PerspectiveCamera(26,1,.1,80),cv,cv2,buf:new Uint8Array(N*N*4)}}
  const R=PICR,m=mkModel(id,0xffd84d,false,SK&&SK.id!=='base'?SK:null);scene.remove(m.g);for(const o of[m.ringM,m.shield,m.hyp])if(o)o.visible=false;
  m.g.rotation.y=-.42;R.sc.add(m.g);m.g.updateMatrixWorld(true);const box=new THREE.Box3();m.g.traverse(o=>{if(o.isMesh&&o.visible&&o!==m.ringM&&o.material!==OUTLINE)box.expandByObject(o)});
  const h=box.max.y-box.min.y,cy=box.max.y-h*.36,vh=h*.78,dist=vh/2/Math.tan(13*Math.PI/180);R.c.position.set(.3,cy+.15,dist);R.c.lookAt(0,cy,0);
  const cc=renderer.getClearColor(new THREE.Color()),ca=renderer.getClearAlpha();renderer.setRenderTarget(R.rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(R.sc,R.c);renderer.readRenderTargetPixels(R.rt,0,0,N,N,R.buf);renderer.setRenderTarget(null);renderer.setClearColor(cc,ca);
  R.sc.remove(m.g);for(const mt of m.mats)mt.dispose();
  const g=R.cv.getContext('2d'),im=g.createImageData(N,N);for(let y=0;y<N;y++)im.data.set(R.buf.subarray((N-1-y)*N*4,(N-y)*N*4),y*N*4);g.putImageData(im,0,0);
  const g2=R.cv2.getContext('2d');g2.clearRect(0,0,O,O);g2.imageSmoothingQuality='high';g2.drawImage(R.cv,0,0,O,O);return R.cv2.toDataURL('image/png')}
function picTick(){if(!PICQ.length||G.state==='play'||G.state==='intro')return;const t0=performance.now();
  while(PICQ.length&&performance.now()-t0<14){const q=PICQ.shift();let u='';try{u=picRender(q.id,q.SK)}catch(e){if(!picTick.err){picTick.err=1;console.warn('pic',e)}}PIC[q.k]=u;
    if(u)document.querySelectorAll('[data-pk="'+q.k+'"]').forEach(e=>{e.outerHTML=`<img src="${u}" alt="" draggable="false">`})}}
setInterval(picTick,40);
// ---- 画面の切りかえ ----
const SCRS=['menu','result','charScr','modeScr','rankScr','roadScr','passScr','dropScr','setScr','questScr','profScr','bufScr','shopScr','netScr','popScr'];
function hideScreens(){$('charScr').classList.remove('det');$('menu').style.visibility='';for(const id of SCRS){const e=$(id);if(e)e.classList.remove('on')}LOBBY.userData.det=false}
function openScr(id){hideScreens();$('menu').classList.add('on');$('menu').style.visibility='hidden';$(id).classList.add('on');fillIcons($(id));SFX.gem()}
function backHome(){hideScreens();showMenu()}
// レア度（本家の日本語の呼び名と色）
const RARC={'スタート':'#62c8ff','トロフィーロード':'#62c8ff','レア':'#3fc35a','スーパーレア':'#2f8cff','エピック':'#b04cf5','ミシック':'#ff3d55','レジェンダリー':'#ffd21f'},RARO=Object.keys(RARC);
const RARN={'スタート':'スタート','トロフィーロード':'トロフィーロード','レア':'レア','スーパーレア':'スーパーレア','エピック':'ハイパーレア','ミシック':'ウルトラレア','レジェンダリー':'レジェンドレア'};
const ROLEIC={'ダメージディーラー':'💥','タンク':'🛡','アサシン':'🗡','サポート':'➕','コントローラー':'🎯','スナイパー':'🔭','投げキャラ':'💣'};
const playerLv=()=>1+Math.floor(Math.sqrt(stats().games*3+totalTr()/6));
const favs=()=>J('gr-fav',[]);
// ================= ホーム =================
function drawHome(){fillIcons($('menu'));const r=rankOf(RPts());$('rankEmb').innerHTML=emblem(r);
  const tot=totalTr(),ri=roadGot(),nr=ROAD[ri],prev=ri?ROAD[ri-1].t:0;$('totTr').textContent=tot;$('roadIc').innerHTML=roadIcon(tot);
  if(nr){const ready=tot>=nr.t;$('roadBar').style.width=clamp((tot-prev)/Math.max(1,nr.t-prev),0,1)*100+'%';$('roadRw').innerHTML=rewardIcon(nr).ic;$('roadBtn').classList.toggle('on',ready)}else{$('roadBar').style.width='100%';$('roadRw').innerHTML='';$('roadBtn').classList.remove('on')}
  $('ppN').textContent=numTxt(pp());$('coins').textContent=numTxt(coins());$('gemN').textContent=numTxt(gems());$('adminTag').style.display=ADMIN?'block':'none';
  $('hLv').textContent=playerLv();$('hAv').innerHTML=pic(LS('gr-icon','')&&BT[LS('gr-icon','')]?LS('gr-icon',''):PICK);$('hNm').textContent=myName();
  const ups=owned().filter(canUp).length;$('upN').textContent=ADMIN?'':ups||'';$('bufN').textContent=bufFree()?'1':'';
  drawDropBtns();
  const B2=bp(),t=bpTier(B2);$('passSm').textContent='Tier '+t+(B2.prem?'　ブロスタパス+':'');$('passXpT').textContent=t>=BP_T?'MAX':(B2.xp%BP_XP)+'/'+BP_XP;$('passXpB').style.width=(t>=BP_T?100:(B2.xp%BP_XP)/BP_XP*100)+'%';
  $('qN').textContent=questReady()||'';$('hPow').textContent=level(PICK);const ko=kitOwn(PICK);$('kitN').textContent='';$('hKit').querySelector('i').innerHTML=myKit(PICK).gad>=0?ICON.gadget:myKit(PICK).sp>=0?ICON.spow:ICON.gadget;
  const rooms=NET.st==='ok'?netRooms().filter(r=>r.st==='wait'&&!r.mine).length:0;$('onN').textContent=rooms||'';
  $('shopNew').style.display=shopDay().bought.includes('free')?'none':'';
  drawModeBox()}
function drawModeBox(){const m=PMODE,rk=m==='ranked';$('modeBtn').style.setProperty('--mc',MODECOL[m]||'#a040f0');$('modeIc').innerHTML=modeIcon(m);$('modeName').textContent=MODES[m].name;
  if(rk){$('mapName').textContent='ランダムモード';$('mapTime').textContent='ランク：'+rankOf(RPts()).name}else{const c=curMap(m);$('mapName').textContent=MAPS[c.id].name;$('mapTime').textContent='次のマップまで：'+leftTxt(c.left)}$('modeNew').classList.toggle('on',rk)}
setInterval(()=>{if(G.state==='menu'&&$('menu').classList.contains('on'))drawModeBox();if($('modeScr').classList.contains('on'))document.querySelectorAll('#modes [data-left]').forEach(e=>{const c=curMap(e.dataset.left);e.textContent='次のマップまで：'+leftTxt(c.left)})},1000);
// ================= キャラクター一覧 =================
let CVIEW=null,CSORT=+LS('gr-csort',0)||0,CFIND='';const CSORTN=['パワーレベル順','トロフィー順','レア度順','解放順','お気に入り'];
function spdTxt(B){const v=Math.round(B.spd*150);return v+'（'+(v>=855?'とても速い':v>=800?'速い':v>=700?'ふつう':v>=650?'遅い':'とても遅い')+'）'}
function rngTxt(r){const t=r/2;return t<4.5?'短い':t<7.3?'ふつう':t<9.3?'長い':'とても長い'}
function rlTxt(s){return s<=1.3?'とても速い':s<=1.5?'速い':s<=1.8?'ふつう':s<=2.1?'遅い':'とても遅い'}
// 本家の表示と同じ「攻撃のダメージ」「必殺技のダメージ」（k=レベルの倍率）
function atkInfo(B,k){const a=B.atk,n=a.n||a.hits||(a.rows?a.rows*a.n:1),t=a.type,v=x=>Math.round(x*k).toLocaleString();if(t==='tax')return v(a.min)+'〜（今の体力の39%）';if(t==='arrow')return v(a.dmg)+'〜'+v(a.dmg2);if(t==='spin'||t==='flame')return v(a.dmg)+'／1回';
  return n>1?n+' x '+v(a.dmg):v(a.dmg)}
function supInfo(B,k){const s=B.sup,v=x=>Math.round(x*k).toLocaleString();if(s.type==='station')return '回復 毎秒'+v(s.heal*B.hp);if(s.heal)return '回復 '+v(s.heal);if(s.hp)return '体力 '+v(s.hp)+(s.dmg?'・'+v(s.dmg):'');if(s.shield)return 'シールド '+v(s.shield);if(s.dps)return v(s.dps)+'／秒';if(s.type==='collect')return '最大体力の22%';
  if(s.dmg)return s.n>1?s.n+' x '+v(s.dmg):v(s.dmg);if(s.red)return 'ダメージ'+Math.round(s.red*100)+'%カット';if(s.legHp)return '足の体力 '+v(s.legHp);if(s.dur)return s.dur+'秒';return '—'}
function drawChar(){if(!$('charScr').classList.contains('on'))return;if($('charScr').classList.contains('det')){drawDetail(CVIEW||PICK);return}
  const h=$('cards');h.innerHTML='';$('cSort').textContent=CSORTN[CSORT];const fv=favs();
  let ids=BT_IDS.slice();const key=[id=>-level(id),id=>-trophies(id),id=>-RARO.indexOf(BT[id].rar),id=>BT_IDS.indexOf(id),id=>fv.includes(id)?0:1][CSORT];
  ids.sort((a,b)=>(isOwned(b)-isOwned(a))||key(a)-key(b)||-trophies(a)+trophies(b)||BT_IDS.indexOf(a)-BT_IDS.indexOf(b));
  if(CFIND)ids=ids.filter(id=>BT[id].name.includes(CFIND)||(BT[id].en||'').toLowerCase().includes(CFIND.toLowerCase()));
  $('cCnt').textContent=owned().length+'/'+BT_IDS.length;const html=[];
  ids.forEach((id,n)=>{const B=BT[id],own=isOwned(id),rd=ROAD.find(r=>r.char===id),lv=level(id),k=myKit(id),o=kitOwn(id);
    html.push(`<div class="bcard${lv>=MAXLV&&own?' mx':''}${id===PICK?' on':''}${own?'':' locked'}" data-id="${id}" style="--rc:${RARC[B.rar]};animation-delay:${Math.min(n,30)*.018}s"><div class="art">${pic(id)}</div><b class="nm tx">${B.name}</b>`+
      `<div class="bt">${own?`<span class="tro"><i data-ic="trophy">${ICON.trophy}</i><b class="tx">${trophies(id)}</b></span>`:`<span class="tro">${ICON.lock.replace('<svg','<svg style="width:2.2em;height:2.2em"')}<b class="tx">${rd?'🏆'+rd.t:'ドロップ'}</b></span>`}</div>`+
      `<div class="strip"><span class="pwc">${own?lv:'?'}</span><i class="k${o.gad.length?'':' no'}">${ICON.gadget}</i><i class="k${o.sp.length?'':' no'}">${ICON.spow}</i><i class="k${o.hyper?'':' no'}">${ICON.hyper}</i></div>${own&&canUp(id)&&!ADMIN?'<span class="up">↑</span>':''}${fv.includes(id)?'<span class="lk">❤</span>':''}</div>`)});
  h.innerHTML=html.join('');
  h.querySelectorAll('.bcard').forEach(d=>d.onclick=()=>{const id=d.dataset.id;if(!isOwned(id)){SFX.gem();crPop(id);return}
    SFX.gem();CVIEW=id;$('charScr').classList.add('det');LOBBY.userData.det=true;lobbyModel(id);lobbyEmote();drawDetail(id)})}
function openChars(){CVIEW=null;hideScreens();const c=$('charScr');c.classList.add('on');$('menu').classList.add('on');$('menu').style.visibility='hidden';fillIcons(c);drawChar()}
function openDetail(id){openChars();CVIEW=id;$('charScr').classList.add('det');LOBBY.userData.det=true;lobbyModel(id);drawDetail(id)}
function closeChars(){$('charScr').classList.remove('on','det');CVIEW=null;LOBBY.userData.det=false;$('menu').style.visibility='';lobbyModel();drawHome();lobbyEmote();if(NET.backTo){NET.backTo=false;openNet()}}
// ================= キャラの詳細 =================
function drawDetail(id){const B=BT[id],lv=level(id),k=LVM(lv),rc=RARC[B.rar],o=kitOwn(id),e=kitEq(id),sk=skinOf(id),bo=bufOwn(id);fillIcons($('cDetV'));
  $('dPP').textContent=numTxt(pp());$('dCoins').textContent=numTxt(coins());$('dSkinN').textContent=skinsOwned(id).length+'/'+SKINS[id].length;
  $('dSkinName').textContent=sk.id==='base'?'':sk.name;$('dBan').style.setProperty('--rc',rc);$('dName').textContent=B.name;$('dRole').innerHTML=`<span>${ROLEIC[B.role]||'⭐'}</span>${B.role}`;$('dRar').textContent=RARN[B.rar]||B.rar;
  $('dTro').innerHTML=`<span class="tb"><i>${ICON.trophy}</i><b class="tx">${trophies(id)}</b></span>`;
  $('dDesc').innerHTML=B.desc.replace(/\{([\d.]+)\}/g,(_,n)=>Math.round(+n*k))+(B.trait?`<span class="trait">特性：${B.trait}</span>`:'');
  $('dBufN').innerHTML=BUF[id]?['gad','sp','hyper'].map(x=>`<i style="width:calc(var(--u)*4.4);height:calc(var(--u)*4.4);${bo[x]?'':'filter:brightness(.35)'}">${ICON.buffy}</i>`).join(''):'';
  const fv=favs().includes(id);$('dFav').classList.toggle('on',fv);
  const sel=$('dSel');sel.classList.toggle('cur',id===PICK);sel.innerHTML=`<span class="tx">${id===PICK?'選択中':'選択'}</span>`;
  // 右：装備の枠・パワー・数値
  const slot=(kind,ic,cnt,need,has,eqName)=>`<button class="kSlot${lv<need?' lk':has?'':' no'}" data-k="${kind}" title="${eqName||''}"><i>${ic}</i>${lv<need?'':`<small class="tx">${cnt}</small>`}${!has&&lv>=need?'<span class="plus">＋</span>':''}</button>`;
  let html=`<div class="kSlots">`+slot('gad',ICON.gadget,o.gad.length+'/2',KITLV.gad,o.gad.length>0,e.gad>=0?B.gad[e.gad].name:'')+slot('sp',ICON.spow,o.sp.length+'/2',KITLV.sp,o.sp.length>0,e.sp>=0?B.sp[e.sp].name:'')+slot('hyper',ICON.hyper,o.hyper?'1/1':'0/1',KITLV.hyper,o.hyper,B.hyper.name)+
    (BUF[id]?slot('buf',ICON.buffy,['gad','sp','hyper'].filter(x=>bo[x]).length+'/3',1,['gad','sp','hyper'].some(x=>bo[x]),'バフィー'):'')+`</div>`;
  html+=`<div class="pwPan"><div class="pwHd"><span class="pwc">${lv}</span><b class="tx">パワー</b><small>最大${MAXLV}</small></div><div class="pwSeg">${Array.from({length:MAXLV},(_,i)=>`<i class="${i<lv?'f':''}"></i>`).join('')}</div>`+
    `<div class="stRow" data-st="1"><span class="si hp">❤</span><span><small>HP</small><b class="tx">${Math.round(B.hp*k).toLocaleString()}${B.hp2?' / '+Math.round(B.hp2*k).toLocaleString():''}</b></span></div>`+
    `<div class="stRow" data-st="1"><span class="si at">✸</span><span><small>通常攻撃</small><b class="tx">${atkInfo(B,k)}</b></span></div>`+
    `<div class="stRow" data-st="1"><span class="si su">☠</span><span><small>必殺技</small><b class="tx">${B.sup.name||supInfo(B,k)}</b></span></div>`+
    (lv>=MAXLV?`<div class="maxTx tx">レベル最大！</div>`:`<button class="go grn upBtn" id="upBtn" ${pp()<UPPP[lv-1]||coins()<UPCOST[lv-1]?'disabled':''}><span class="tx">アップグレード</span><span class="cost"><span><i>${ICON.pp}</i><b class="tx">${UPPP[lv-1]}</b></span><span><i>${ICON.coin}</i><b class="tx">${UPCOST[lv-1]}</b></span></span></button>`)+`</div>`;
  $('detail').innerHTML=html;
  $('detail').querySelectorAll('.kSlot').forEach(b=>b.onclick=()=>kitPop(id,b.dataset.k));$('detail').querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>statPop(id));
  const ub=$('upBtn');if(ub)ub.onclick=()=>upgrade(id)}
function dPop(html){const p=$('dPop');p.innerHTML=`<div class="dPopIn">${html}<button class="bsX" data-x>✕</button></div>`;p.classList.add('on');fillIcons(p);p.querySelector('[data-x]').onclick=()=>p.classList.remove('on');p.onclick=e=>{if(e.target===p)p.classList.remove('on')}}
// 装備を選ぶ（ガジェット・スターパワー・ハイパー・バフィー）
function kitPop(id,kind){const B=BT[id],lv=level(id),o=kitOwn(id),e=kitEq(id),bo=bufOwn(id),X=BUF[id];
  if(kind==='buf'){if(!X)return;const nm={gad:'ガジェットバフィー',sp:'スターバフィー',hyper:'ハイパーバフィー'},
      tx={gad:B.gad.map((g,i)=>`<u>${g.name}</u>：${fmtLv(X.gad[i],lv)}`).join('<br>'),sp:B.sp.map((g,i)=>`<u>${g.name}</u>：${fmtLv(X.sp[i],lv)}`).join('<br>'),hyper:`ハイパーチャージが2秒長くなる<br><u>${B.hyper.name}</u>：${fmtLv(X.hyper,lv)}`};
    dPop(`<h3 class="tx">${B.name}のバフィー</h3><div class="kOpts">`+['gad','sp','hyper'].map(x=>`<div class="kOpt${bo[x]?' on':''}"><div class="kh"><i>${ICON.buffy}</i><b class="tx">${nm[x]}</b></div><p>${tx[x]}</p>${bo[x]?'<b class="tx" style="align-self:flex-end;color:#7dff6a">入手済み・自動で装備</b>':`<button class="go yel" data-bf><span class="tx">バフィーへ</span></button>`}</div>`).join('')+`</div>`);
    $('dPop').querySelectorAll('[data-bf]').forEach(b=>b.onclick=()=>{$('dPop').classList.remove('on');openBuffy(id)});return}
  if(kind==='hyper'){const H=B.hyper;dPop(`<h3 class="tx">ハイパーチャージ</h3><div class="kOpts"><div class="kOpt${o.hyper?' on':''}"><div class="kh"><i>${ICON.hyper}</i><b class="tx">${H.name}</b></div><p>${fmtLv(H.d,lv)}<br>ハイパー中（${HYP.time}秒）：移動速度+${HYP.spd*100}%・攻撃力+${HYP.dmg*100}%・受けるダメージ-${HYP.red*100}%</p>`+
      (o.hyper?'<b class="tx" style="align-self:flex-end;color:#7dff6a">装備中</b>':lv<KITLV.hyper?`<b class="tx" style="align-self:flex-end">パワー${KITLV.hyper}で解放</b>`:`<button class="go yel" data-buy><i>${ICON.coin}</i><span class="tx">${KITCOST.hyper}</span></button>`)+`</div></div>`);
    const b=$('dPop').querySelector('[data-buy]');if(b)b.onclick=()=>{kitAct(id,'hyper',1);kitPop(id,'hyper');drawDetail(id)};return}
  const list=kind==='gad'?B.gad:B.sp,need=kind==='gad'?KITLV.gad:KITLV.sp,cost=kind==='gad'?KITCOST.gad:KITCOST.sp,ic=kind==='gad'?ICON.gadget:ICON.spow;
  dPop(`<h3 class="tx">${kind==='gad'?'ガジェット':'スターパワー'}</h3><div class="kOpts">`+list.map((g,i)=>{const has=o[kind].includes(i),on=e[kind]===i;
    return `<div class="kOpt${on?' on':''}"><div class="kh"><i>${ic}</i><b class="tx">${g.name}</b></div><p>${fmtLv(g.d,lv)}${kind==='gad'?`<br>⏱ クールダウン ${g.cd}秒`:''}</p>`+
      (lv<need?`<b class="tx" style="align-self:flex-end">パワー${need}で解放</b>`:on?'<b class="tx" style="align-self:flex-end;color:#7dff6a">装備中</b>':has?`<button class="go blu" data-eq="${i}"><span class="tx">装備する</span></button>`:`<button class="go yel" data-eq="${i}"><i>${ICON.coin}</i><span class="tx">${cost}</span></button>`)+`</div>`}).join('')+`</div>`);
  $('dPop').querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>{kitAct(id,kind,+b.dataset.eq);kitPop(id,kind);drawDetail(id)})}
// くわしい数値
function statPop(id){const B=BT[id],lv=level(id),k=LVM(lv),st=(t,v,w)=>`<div${w?' class="w"':''}><small>${t}</small><b class="tx">${v}</b></div>`;
  dPop(`<h3 class="tx">${B.name}（パワー${lv}）</h3><div class="stGrid">${st('体力',Math.round(B.hp*k).toLocaleString()+(B.hp2?' / '+Math.round(B.hp2*k).toLocaleString():''))}${st('通常攻撃',atkInfo(B,k))}${st('必殺技「'+(B.sup.name||'')+'」',supInfo(B,k))}${st('移動速度',spdTxt(B))}`+
    `${st('射程',(B.range/2).toFixed(2).replace(/\.?0+$/,'')+'マス（'+rngTxt(B.range)+'）')}${st('リロード',B.reload+'秒（'+rlTxt(B.reload)+'）')}${st('弾数',B.bar?B.ammo+'（ゲージ）':(B.ammo||3))}${st('ハイパー倍率',Math.round((B.hm||.3)*100)+'%')}${st('役割',B.role)}${st('レア度',RARN[B.rar])}`+
    (B.trait?st('特性',B.trait,1):'')+`</div>`)}
// スキン
function skinPop(id){const cur=skinOf(id).id,own=skinsOwned(id);
  dPop(`<h3 class="tx">${BT[id].name}のスキン</h3><div class="skGrid">`+SKINS[id].map(S2=>{const has=own.includes(S2.id);return `<button class="skC${S2.id===cur?' on':''}" data-sk="${S2.id}"><span class="art">${pic(id,S2.id==='base'?null:S2)}</span><b class="tx">${S2.name}</b><span class="pr">`+
    (S2.id===cur?'<b class="tx" style="color:#7dff6a">使用中</b>':has?'<b class="tx">使う</b>':S2.pass?'<b class="tx">パス限定</b>':`<i>${ICON.gem}</i><b class="tx">${S2.gem}</b>`+(S2.bl?`<i>${ICON.bling}</i><b class="tx">${S2.bl}</b>`:''))+`</span>`+(S2.t>=0?`<em class="skR" style="--rc:${DRAR[S2.t].c}">${DRAR[S2.t].n}</em>`:'')+`</button>`}).join('')+`</div><p class="skHave"><i>${ICON.gem}</i><b class="tx">${numTxt(gems())}</b><i>${ICON.bling}</i><b class="tx">${numTxt(bl())}</b>　ブリングがあればブリングで買います</p>`);
  $('dPop').querySelectorAll('[data-sk]').forEach(b=>b.onclick=()=>{const S2=SKINS[id].find(s=>s.id===b.dataset.sk),has=own.includes(S2.id);
    if(has){LSset('gr-skin-'+id,S2.id);lobbyModel(id);lobbyEmote();skinPop(id);drawDetail(id);return}if(S2.pass){note('ブロスタパスの報酬でもらえます',2.2);return}
    if(S2.bl&&bl()>=S2.bl)addBl(-S2.bl);else if(gems()>=S2.gem)addGems(-S2.gem);else{note('ジェム（またはブリング）が足りません',1.8);return}const o=own.slice();o.push(S2.id);JS('gr-sk-'+id,o);LSset('gr-skin-'+id,S2.id);SFX.superReady();lobbyModel(id);lobbyEmote();confetti(VW()/2,VH()*.5,40);skinPop(id);drawDetail(id)})}
// ================= 起動時のボタン =================
function showMenu(){if(!isOwned(PICK)){PICK='rico';LSset('gr-pick',PICK)}G.state='menu';document.body.classList.remove('playing','br');hideScreens();$('menu').classList.add('on');lobbyModel();drawHome()}
$('goBtn').addEventListener('click',()=>{if(PMODE==='ranked'){openRanked();return}startMatch()});
$('modeBtn').addEventListener('click',()=>openModes(PMODE==='ranked'?'ranked':'trophy'));
$('charBtn').addEventListener('click',()=>openChars());$('charOk').addEventListener('click',()=>closeChars());
$('detBack').addEventListener('click',()=>{$('dPop').classList.remove('on');$('charScr').classList.remove('det');LOBBY.userData.det=false;CVIEW=null;lobbyModel();drawChar()});
$('cSort').addEventListener('click',()=>{CSORT=(CSORT+1)%CSORTN.length;LSset('gr-csort',CSORT);drawChar()});
$('cFind').addEventListener('input',e=>{CFIND=e.target.value.trim();drawChar()});$('cFind').addEventListener('keydown',e=>e.stopPropagation());
$('dSel').addEventListener('click',()=>{const id=CVIEW||PICK;PICK=id;LSset('gr-pick',id);SFX.superReady();closeChars()});
$('dTry').addEventListener('click',()=>startTraining(CVIEW||PICK));$('dInfo').addEventListener('click',()=>statPop(CVIEW||PICK));
$('dSkinB').addEventListener('click',()=>skinPop(CVIEW||PICK));$('dSkins').addEventListener('click',()=>skinPop(CVIEW||PICK));
$('dFav').addEventListener('click',()=>{const id=CVIEW||PICK,f=favs(),i=f.indexOf(id);if(i<0)f.push(id);else f.splice(i,1);JS('gr-fav',f);SFX.gem();drawDetail(id)});
$('hPow').addEventListener('click',()=>openDetail(PICK));$('hKit').addEventListener('click',()=>{openDetail(PICK);setTimeout(()=>kitPop(PICK,'gad'),30)});
$('skinBtn').addEventListener('click',()=>{openDetail(PICK);setTimeout(()=>skinPop(PICK),30)});
$('slotL').addEventListener('click',()=>openNet());$('slotR').addEventListener('click',()=>openNet());$('onBtn').addEventListener('click',()=>openNet());
$('roadPill').addEventListener('click',()=>openRoad());$('rankPill').addEventListener('click',()=>openRanked());$('passBtn').addEventListener('click',()=>openPass());
$('questBtn').addEventListener('click',()=>openQuests());$('profBtn').addEventListener('click',()=>openProfile());$('bufBtn').addEventListener('click',()=>openBuffy());$('shopBtn').addEventListener('click',()=>openShop());
document.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',()=>backHome()));document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>backHome()));
// 設定（歯車）
$('homeSet').addEventListener('click',()=>{$('setName').value=LS('gr-name','');$('setScr').classList.add('on');fillIcons($('setScr'))});$('setClose').addEventListener('click',()=>{$('setScr').classList.remove('on');drawHome()});
$('setName').addEventListener('change',e=>{LSset('gr-name',cleanName(e.target.value));drawHome()});$('setName').addEventListener('keydown',e=>e.stopPropagation());
function drawAdmin(){const b=$('setAdmin');b.innerHTML='<span class="tx">管理者モード：'+(ADMIN?'オン':'オフ')+'</span>';b.className='go '+(ADMIN?'yel':'blu')}
$('setAdmin').addEventListener('click',()=>{ADMIN=!ADMIN;LSset('gr-admin',ADMIN?'1':'0');if(!isOwned(PICK))PICK='rico';drawAdmin();drawHome();SFX.gem();note(ADMIN?'管理者モード：全キャラ・資源無限':'管理者モードを切りました',1.8)});drawAdmin();
$('setTut').addEventListener('click',()=>{$('setScr').classList.remove('on');startMatch('tutorial')});$('setHome').addEventListener('click',()=>{try{parent.postMessage({h3dOpenPanel:1},'*')}catch(e){}});
$('setReset').addEventListener('click',()=>{if(!confirm('トロフィー・コイン・キャラなど、すべてのデータを消して最初からにします。よろしいですか？'))return;resetAll();LSset('gr-ver','6');location.reload()});
$('tutSkip').addEventListener('click',()=>{if(G.rule==='tutorial'&&!G.over){G.M.step=TUT.length-1;tutNext()}});
fillIcons(document);
// ---- ロビー（ホーム画面の3D：本家のホームのような部屋に選んだキャラ）----
const LZ=400,LOBBY=new THREE.Group();LOBBY.position.set(0,0,LZ);scene.add(LOBBY);
{const wallT=ctex(1024,512,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#c9327f');gr.addColorStop(.55,'#e0559a');gr.addColorStop(1,'#a8286a');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,255,255,.06)';for(let i=0;i<60;i++){const x=Math.random()*w,y=Math.random()*h*.8;g.beginPath();g.moveTo(x,y-14);g.lineTo(x+10,y);g.lineTo(x,y+14);g.lineTo(x-10,y);g.fill()}
    // 真ん中の大きなアーチの戸口と窓
    const arch=(x,y,ww,hh,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(x-ww/2,y);g.lineTo(x-ww/2,y-hh+ww/2);g.arc(x,y-hh+ww/2,ww/2,Math.PI,0);g.lineTo(x+ww/2,y);g.closePath();g.fill()};
    arch(w/2,h,300,420,'#8a1f57');arch(w/2,h,250,380,'#f7c6e0');const gl=g.createRadialGradient(w/2,h*.75,10,w/2,h*.75,200);gl.addColorStop(0,'rgba(255,255,255,.95)');gl.addColorStop(1,'rgba(255,220,240,0)');g.fillStyle=gl;g.fillRect(w/2-140,h*.25,280,h*.75);
    arch(w/2,h*.36,150,150,'#8a1f57');arch(w/2,h*.35,130,135,'#ffd8ea');g.strokeStyle='#8a1f57';g.lineWidth=8;g.beginPath();g.moveTo(w/2,h*.35);g.lineTo(w/2,h*.35-135);g.moveTo(w/2-65,h*.35-60);g.lineTo(w/2+65,h*.35-60);g.stroke();
    // 両わきの額と棚
    g.fillStyle='#a8286a';for(const x of[150,880]){g.fillRect(x-60,140,120,110);g.fillStyle='#e87ab5';g.fillRect(x-45,155,90,80);g.fillStyle='#a8286a'}
    g.fillStyle='#7a1a4a';g.fillRect(40,300,190,24);g.fillRect(800,300,190,24);g.fillStyle='#2f9a8a';for(const x of[70,120,170,830,880,930]){g.beginPath();g.arc(x,288,16,0,TAU);g.fill()}});
  const floorT=ctex(512,512,(g,w,h)=>{const gr=g.createRadialGradient(256,230,20,256,256,300);gr.addColorStop(0,'#3fb5a0');gr.addColorStop(.5,'#1f7a6e');gr.addColorStop(1,'#0f3a3a');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(0,0,0,.12)';g.lineWidth=3;for(let i=0;i<12;i++){g.beginPath();g.moveTo(0,i*44);g.lineTo(w,i*44);g.stroke()}});
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(40,24),new THREE.MeshBasicMaterial({map:floorT}));fl.rotation.x=-Math.PI/2;fl.position.z=-2;LOBBY.add(fl);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(30,15),new THREE.MeshBasicMaterial({map:wallT}));wall.position.set(0,6.8,-8);LOBBY.add(wall);
  // キャラの詳細のときの青い背景
  const detT=ctex(512,512,(g,w,h)=>{const gr=g.createRadialGradient(256,300,20,256,256,360);gr.addColorStop(0,'#3fd0d8');gr.addColorStop(.5,'#2378d8');gr.addColorStop(1,'#16328a');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,255,255,.07)';for(let y=0;y<h;y+=80)for(let x=(y/80%2)*40;x<w;x+=80){g.beginPath();g.arc(x,y,16,0,TAU);g.fill()}});
  const det=new THREE.Mesh(new THREE.PlaneGeometry(36,20),new THREE.MeshBasicMaterial({map:detT}));det.position.set(0,6,-6);det.visible=false;LOBBY.add(det);LOBBY.userData.detBg=det;LOBBY.userData.wall=wall;
  const sh=new THREE.Mesh(new THREE.CircleGeometry(1.3,32),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.32,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.02;LOBBY.add(sh)}
let lobbyChar=null,lobbyId='',emoteT=0;
function lobbyModel(id){id=id||PICK;const key=id+'|'+skinOf(id).id;if(lobbyId===key&&lobbyChar)return;if(lobbyChar)scene.remove(lobbyChar.g);lobbyChar=mkModel(id,0xffd84d,false,skinOf(id));lobbyChar.g.remove(lobbyChar.shield);if(lobbyChar.ringM)lobbyChar.ringM.visible=false;lobbyChar.g.position.set(0,0,LZ);lobbyChar.g.scale.setScalar(1.3);lobbyId=key;emoteT=.01}
function lobbyEmote(){emoteT=1;SFX.gem()}
function updLobby(dt){const t=performance.now()/1000;const det=!!LOBBY.userData.det;LOBBY.userData.detBg.visible=det;LOBBY.userData.wall.visible=!det;
  if(!lobbyChar)return;const c=lobbyChar;c.g.visible=G.state==='menu';if(!c.g.visible)return;
  if(emoteT>0){emoteT=Math.max(0,emoteT-dt*1.4);const k=1-emoteT;c.g.position.y=Math.sin(k*Math.PI)*1.1;c.g.rotation.y=k*TAU;c.torso.rotation.x=0}
  else{c.g.position.y=0;c.g.rotation.y=Math.sin(t*.6)*.3;c.torso.position.y=.5+Math.sin(t*2.4)*.04;c.hR.position.y=.4+Math.sin(t*2.4)*.05}}
