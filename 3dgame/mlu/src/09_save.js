// ================= セーブ（この端末に保存・セーブコード）=================
const SAVE_KEY='lu-save';
function snapshot(){const nodes=[];for(const o of NODES)if(!o.alive)nodes.push([o.id,Math.max(0,Math.round(o.t))]);
  const b={};for(const B of BLDS)if(B.st&&Object.keys(B.st).length)b[B.n]=B.st;
  return{v:1,w:'gaia',open:[...W.open],paid:W.paid,inv:PL.inv,tools:PL.tools,hp:Math.round(PL.hp),skin:PL.skin,owned:PL.owned,pos:[PL.u.x,PL.u.y,PL.u.z].map(v=>+v.toFixed(4)),camf:[CAM.f.x,CAM.f.y,CAM.f.z].map(v=>+v.toFixed(4)),
    nodes,b,sword:W.sword||0,core:W.core||0,seen:[...AREA_SEEN],ts:Date.now(),clear:W.clear||0,play:Math.round(W.play||0),...(CLOUD.key?{cloud:CLOUD.key,cloudS:CLOUD.s}:{})}}
// プレイヤーの分だけ（オンラインでほかの人の星にいるとき）
function playerPart(){return{inv:PL.inv,tools:PL.tools,skin:PL.skin,owned:PL.owned}}
let saveT=0;function saveSoon(){saveT=Math.min(saveT||1.5,1.5)}
function saveGame(){if(!GAME_READY)return;try{if(NET.on&&!NET.host){const old=JSON.parse(LSget(SAVE_KEY,'null'));if(old){Object.assign(old,playerPart());LSset(SAVE_KEY,JSON.stringify(old))}clAfterSave();return}
  LSset(SAVE_KEY,JSON.stringify(snapshot()))}catch(e){}clAfterSave()}
function loadSave(){try{return JSON.parse(LSget(SAVE_KEY,'null'))}catch(e){return null}}
// セーブを星にあてはめる（はじめからのときは null）
function applySave(s,opt){opt=opt||{};
  // いったん全部しめる
  const oldCells=[...W.open].flatMap(n=>n===0?TILES[0].cells:[TILES[n].cell]);
  for(const n of [...W.open])if(n!==0){W.open.delete(n)}W.paid={};
  for(const ci in TILE_MESH)TILE_MESH[ci].visible=false;for(const B of BLDS){B.m.visible=false;B.st={};if(B.pads){B.pads.forEach(m=>{world.remove(m)});B.pads=null}if(B.pile){B.pile.forEach(m=>world.remove(m));B.pile=[]}}
  if(s){for(const n of s.open||[])if(TILES[n])W.open.add(n);W.paid=s.paid&&typeof s.paid==='object'?s.paid:{};W.sword=s.sword||0;W.core=s.core||0;W.clear=s.clear||0;W.play=s.play||0;
    if(!opt.worldOnly){CLOUD.key=s.cloud||null;CLOUD.s=s.cloudS||null;PL.inv=Object.assign({},s.inv||{});PL.tools=Object.assign({axe:1,pick:1,weap:1},s.tools||{});PL.skin=s.skin||'stick';PL.owned=Object.assign({stick:1},s.owned||{})}
    AREA_SEEN=new Set(s.seen||[1])}
  else{W.sword=0;W.core=0;W.clear=0;W.play=0;if(!opt.worldOnly){CLOUD.key=null;CLOUD.s=null;PL.inv={};PL.tools={axe:1,pick:1,weap:1};PL.skin='stick';PL.owned={stick:1}}AREA_SEEN=new Set([1])}
  oldCells.forEach(drawDecoCell);
  for(const n of W.open){const T=TILES[n];if(n===0)T.cells.forEach(ci=>showTile(ci,false));else showTile(T.cell,false)}
  // 木・岩
  for(const o of NODES){o.alive=true;o.hp=NODE[o.k].hp;o.t=0;o.given=0;o.grow=1;o.hidden=false;if(o.k==='sword'&&W.sword){o.alive=false}if(o.k==='core'&&W.core){o.alive=false}}
  if(s&&Array.isArray(s.nodes))for(const [id,t] of s.nodes){const o=NODES[id];if(o&&!NODE[o.k].once){o.alive=false;o.t=t}}
  NODES.forEach(o=>NDIRTY.add(o));
  // 建物（オフラインのあいだも精錬が進む：最大8時間）
  const away=s&&s.ts&&!opt.worldOnly?clamp((Date.now()-s.ts)/1000,0,8*3600):0;
  for(const B of BLDS){const st=s&&s.b&&s.b[B.n];B.st=st&&typeof st==='object'?JSON.parse(JSON.stringify(st)):{};B.went=0;
    if(away>0){const D=BLD[B.k];if(D.kind==='ref'&&B.st.q){const per=Object.values(D.inp)[0];const made=Math.min(Math.floor(B.st.q/per),Math.floor(away/D.t));B.st.q-=made*per;B.st.out=(B.st.out||0)+made;B.awayMade=made}
      if(D.kind==='eq'&&B.st.craft>0)B.st.craft=Math.max(.01,B.st.craft-away)}}
  for(const e of ENEMIES){e.alive=true;e.hp=ENEMY[e.k].hp;e.u.copy(e.home);e.cell=cellAt(e.u,e.cell);e.st='idle';e.dying=0;e.mesh.scale.setScalar(ENEMY[e.k].sc)}
  setSkin(PL.skin);rebuildShore();refreshGhosts();
  // 場所
  respawn();if(s&&Array.isArray(s.pos)&&!opt.worldOnly){const u=V3(...s.pos);if(u.lengthSq()>.5){u.normalize();const ci=cellAt(u,-1);if(groundKind(CELLS[ci])!=='water'){PL.u.copy(u);PL.cell=ci;PL.r=groundR(u,CELLS[ci])}}}
  if(s&&Array.isArray(s.camf))CAM.f.set(...s.camf);tangent(CAM.f,PL.u,CAM.f);PL.face.copy(CAM.f);CAM.ready=0;
  PL.hp=s&&s.hp>0&&!opt.worldOnly?Math.min(maxHp(),s.hp):maxHp();HUD_DIRTY=true;
  const made=BLDS.reduce((a,B)=>a+(B.awayMade||0),0);BLDS.forEach(B=>B.awayMade=0);return made}
// ---- セーブコード（JSON を縮めて文字に）----
async function packCode(o){const txt=JSON.stringify(o);try{if(window.CompressionStream){const cs=new Blob([txt]).stream().pipeThrough(new CompressionStream('deflate-raw'));const buf=new Uint8Array(await new Response(cs).arrayBuffer());let bin='';for(const b of buf)bin+=String.fromCharCode(b);return'LU1.'+btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}}catch(e){}
  return'LU0.'+btoa(unescape(encodeURIComponent(txt))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function unpackCode(code){code=String(code||'').replace(/\s+/g,'');const m=/^LU([01])\.([A-Za-z0-9_-]+)$/.exec(code);if(!m)throw new Error('code');let b=m[2].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';const bin=atob(b);
  if(m[1]==='0')return JSON.parse(decodeURIComponent(escape(bin)));const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);const ds=new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return JSON.parse(await new Response(ds).text())}
function validSave(o){return o&&typeof o==='object'&&o.w==='gaia'&&Array.isArray(o.open)}
