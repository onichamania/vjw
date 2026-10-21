// ================= セーブ（この端末に保存・セーブコード）=================
const SAVE_KEY='lu-save';
// セーブ v2：{v:2, w:いまの星, worlds:{gaia:{…}, troll:{…}}, 持ち物・道具・キャラ・場所…}
// v1（ガイアだけ）のセーブは読むときに v2 になおす
let WSTATE={};   // いまいない星の状態（星の id → その星の状態）
function worldPart(){const nodes=[];for(const o of NODES)if(!o.alive&&!NODE[o.k].once)nodes.push([o.id,Math.max(0,Math.round(o.t))]);
  const b={};for(const B of BLDS)if(B.st&&Object.keys(B.st).length)b[B.key]=B.st;
  return{open:[...W.open],paid:W.paid,nodes,once:[...W.once],b,sword:W.sword||0,core:W.core||0,seen:[...AREA_SEEN],clear:W.clear||0,ts:Date.now()}}
function snapshot(){const worlds=Object.assign({},WSTATE,{[CUR]:worldPart()});
  return{v:2,w:CUR,worlds,inv:PL.inv,tools:PL.tools,hp:Math.round(PL.hp),skin:PL.skin,owned:PL.owned,pos:[PL.u.x,PL.u.y,PL.u.z].map(v=>+v.toFixed(4)),camf:[CAM.f.x,CAM.f.y,CAM.f.z].map(v=>+v.toFixed(4)),
    ts:Date.now(),play:Math.round(W.play||0),...(CLOUD.key?{cloud:CLOUD.key,cloudS:CLOUD.s}:{})}}
const WKEYS=['open','paid','nodes','once','b','sword','core','seen','clear'];
function upgradeSave(s){if(!s||typeof s!=='object')return null;if(s.v>=2&&s.worlds&&typeof s.worlds==='object')return s;
  const w={};WKEYS.forEach(k=>{if(s[k]!==undefined)w[k]=s[k]});w.ts=s.ts;const o=Object.assign({},s,{v:2,w:'gaia',worlds:{gaia:w}});WKEYS.forEach(k=>delete o[k]);return o}
// セーブの進み具合（いまの星の何%か）
function savePct(s){s=upgradeSave(s);const w=s&&s.worlds[s.w],D=WDEF[s&&s.w];return w&&D?Math.floor(((w.open||[]).length-1)/D.tiles.length*100):0}
// プレイヤーの分だけ（オンラインでほかの人の星にいるとき）
function playerPart(){return{inv:PL.inv,tools:PL.tools,skin:PL.skin,owned:PL.owned}}
let saveT=0;function saveSoon(){saveT=Math.min(saveT||1.5,1.5)}
function saveGame(){if(!GAME_READY)return;try{if(NET.on&&!NET.host){const old=JSON.parse(LSget(SAVE_KEY,'null'));if(old){Object.assign(old,playerPart());LSset(SAVE_KEY,JSON.stringify(old))}clAfterSave();return}
  LSset(SAVE_KEY,JSON.stringify(snapshot()))}catch(e){}clAfterSave()}
function loadSave(){try{return JSON.parse(LSget(SAVE_KEY,'null'))}catch(e){return null}}
// セーブを星にあてはめる（はじめからのときは null）。opt.worldOnly：星のようすだけ（オンラインのゲスト）
function applySave(s,opt){opt=opt||{};s=upgradeSave(s);const wid=s&&WDEF[s.w]?s.w:'gaia';
  if(!opt.worldOnly){WSTATE=s?JSON.parse(JSON.stringify(s.worlds)):{};W.play=s&&s.play||0;
    if(s){CLOUD.key=s.cloud||null;CLOUD.s=s.cloudS||null;PL.inv=Object.assign({},s.inv||{});PL.tools=Object.assign({axe:1,pick:1,weap:1},s.tools||{});PL.skin=s.skin||'stick';PL.owned=Object.assign({stick:1},s.owned||{})}
    else{CLOUD.key=null;CLOUD.s=null;PL.inv={};PL.tools={axe:1,pick:1,weap:1};PL.skin='stick';PL.owned={stick:1}}}
  if(CUR!==wid)buildWorld(wid);
  const ws=s&&s.worlds[wid]||null;const made=applyWorld(ws,{away:!opt.worldOnly&&s&&s.ts?(Date.now()-s.ts)/1000:0});
  setSkin(PL.skin);
  // 場所
  respawn();if(s&&Array.isArray(s.pos)&&!opt.worldOnly){const u=V3(...s.pos);if(u.lengthSq()>.5){u.normalize();const ci=cellAt(u,-1);if(groundKind(CELLS[ci])!=='water'){PL.u.copy(u);PL.cell=ci;PL.r=groundR(u,CELLS[ci])}}}
  if(s&&Array.isArray(s.camf))CAM.f.set(...s.camf);tangent(CAM.f,PL.u,CAM.f);PL.face.copy(CAM.f);CAM.ready=0;
  PL.hp=s&&s.hp>0&&!opt.worldOnly?Math.min(maxHp(),s.hp):maxHp();HUD_DIRTY=true;return made}
// いまの星に、その星の状態をあてはめる（away：いなかった秒数。そのぶん精錬所が進む・最大8時間）
function applyWorld(ws,o){o=o||{};
  // いったん全部しめる
  const oldCells=[...W.open].flatMap(n=>n===0?TILES[0].cells:[TILES[n].cell]);
  for(const n of [...W.open])if(n!==0)W.open.delete(n);W.paid={};W.once=new Set();
  for(const ci in TILE_MESH)TILE_MESH[ci].visible=false;for(const B of BLDS){B.m.visible=false;B.st={};if(B.pads){B.pads.forEach(m=>WG.remove(m));B.pads=null}if(B.pile){B.pile.forEach(m=>WG.remove(m));B.pile=[]}}
  if(ws){for(const n of ws.open||[])if(TILES[n])W.open.add(n);W.paid=ws.paid&&typeof ws.paid==='object'?JSON.parse(JSON.stringify(ws.paid)):{};W.sword=ws.sword||0;W.core=ws.core||0;W.clear=ws.clear||0;
    if(Array.isArray(ws.once))ws.once.forEach(id=>W.once.add(id));AREA_SEEN=new Set(ws.seen||[1])}
  else{W.sword=0;W.core=0;W.clear=0;AREA_SEEN=new Set([1])}
  oldCells.forEach(drawDecoCell);
  for(const n of W.open){const T=TILES[n];if(n===0)T.cells.forEach(ci=>showTile(ci,false));else showTile(T.cell,false)}
  // 木・岩（一度きりのもの：剣・ソースコア・カギ・氷づけのつるはし）
  for(const o2 of NODES){o2.alive=true;o2.hp=NODE[o2.k].hp;o2.t=0;o2.given=0;o2.grow=1;o2.hidden=false;if(W.once.has(o2.id)||CUR==='gaia'&&(o2.k==='sword'&&W.sword||o2.k==='core'&&W.core)){o2.alive=false;W.once.add(o2.id)}}
  if(ws&&Array.isArray(ws.nodes))for(const [id,t] of ws.nodes){const nd=NODES[id];if(nd&&!NODE[nd.k].once){nd.alive=false;nd.t=t}}
  NODES.forEach(nd=>NDIRTY.add(nd));
  const away=clamp(o.away||0,0,8*3600);
  for(const B of BLDS){const st=ws&&ws.b&&ws.b[B.key];B.st=st&&typeof st==='object'?JSON.parse(JSON.stringify(st)):{};B.went=0;
    if(away>0){const D=BLD[B.k];if(D.kind==='ref'&&B.st.q){const per=Object.values(D.inp)[0];const made=Math.min(Math.floor(B.st.q/per),Math.floor(away/D.t));B.st.q-=made*per;B.st.out=(B.st.out||0)+made;B.awayMade=made}
      if(D.kind==='eq')for(const S2 of D.tools?D.tools.map(t=>B.st[t]).filter(Boolean):[B.st])if(S2.craft>0)S2.craft=Math.max(.01,S2.craft-away)}}
  for(const e of ENEMIES){e.alive=true;e.hp=ENEMY[e.k].hp;e.u.copy(e.home);e.cell=cellAt(e.u,e.cell);e.st='idle';e.dying=0;e.mesh.scale.setScalar(ENEMY[e.k].sc)}
  rebuildShore();refreshGhosts();
  const made=BLDS.reduce((a,B)=>a+(B.awayMade||0),0);BLDS.forEach(B=>B.awayMade=0);return made}
// ---- 星から星へ（ポータル・ガイアへのポータル）----
function portalGo(){if(WD.next){W.clear=1;travelTo(WD.next,'portal')}else goEnding()}
function travelTo(id,how){if(!WDEF[id]||id===CUR||STATE!=='play')return;if(NET.on&&!NET.host){toast('星を移動できるのはホストだけです');return}
  const first=!WSTATE[id];const was=AUTO.on;autoStop();inputReset();
  WSTATE[CUR]=worldPart();saveGame();SFX.portal();showLoading(WDEF[id].n+'へ向かっています…');STATE='travel';
  setTimeout(()=>{buildWorld(id);const ws=WSTATE[id]||null;const made=applyWorld(ws,{away:ws&&ws.ts?(Date.now()-ws.ts)/1000:0});delete WSTATE[id];
    respawn();
    // ガイアへもどるときは、ガイアのポータルの前に着く
    if(how==='warp'){const B=portalB();if(B&&W.open.has(B.n)){const u=B.pIn.clone().addScaledVector(B.f,1.4).normalize();const ci=cellAt(u,B.cell);if(groundKind(CELLS[ci])==='land'){PL.u.copy(u);PL.cell=ci;PL.r=groundR(u,CELLS[ci]);CAM.f.copy(B.f)}}}
    tangent(CAM.f,PL.u,CAM.f);PL.face.copy(CAM.f);CAM.ready=0;
    STATE='play';startPlay();banner(WD.n,first?'新しい星にやってきた！':'もどってきた');if(made>0)setTimeout(()=>toast('いないあいだに精錬所が '+made+' こ作っていました'),900);
    saveGame();if(NET.on&&NET.host){NET.send();netLobby()}},80)}
// ---- セーブコード（JSON を縮めて文字に）----
async function packCode(o){const txt=JSON.stringify(o);try{if(window.CompressionStream){const cs=new Blob([txt]).stream().pipeThrough(new CompressionStream('deflate-raw'));const buf=new Uint8Array(await new Response(cs).arrayBuffer());let bin='';for(const b of buf)bin+=String.fromCharCode(b);return'LU1.'+btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}}catch(e){}
  return'LU0.'+btoa(unescape(encodeURIComponent(txt))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function unpackCode(code){code=String(code||'').replace(/\s+/g,'');const m=/^LU([01])\.([A-Za-z0-9_-]+)$/.exec(code);if(!m)throw new Error('code');let b=m[2].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';const bin=atob(b);
  if(m[1]==='0')return JSON.parse(decodeURIComponent(escape(bin)));const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);const ds=new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return JSON.parse(await new Response(ds).text())}
function validSave(o){return !!(o&&typeof o==='object'&&WDEF[o.w]&&(Array.isArray(o.open)||o.worlds&&typeof o.worlds==='object'&&o.worlds[o.w]))}
