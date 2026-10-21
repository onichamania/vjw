// ================= 星を組み立てる =================
const renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0c1236');
const camera=new THREE.PerspectiveCamera(42,1,.3,400);
const hemi=new THREE.HemisphereLight(0xffffff,0x4a6a9a,1.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dc,2.1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const SC=sun.shadow.camera;SC.left=-16;SC.right=16;SC.top=16;SC.bottom=-16;SC.near=1;SC.far=80;sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;scene.add(sun);scene.add(sun.target);
// ---- 宇宙（星と色のもや）----
(function(){const n=1400,p=new Float32Array(n*3),c=new Float32Array(n*3),r=mulberry(5);for(let i=0;i<n;i++){const u=r()*2-1,a=r()*Math.PI*2,s=Math.sqrt(1-u*u),d=300;p[i*3]=Math.cos(a)*s*d;p[i*3+1]=u*d;p[i*3+2]=Math.sin(a)*s*d;const w=.6+r()*.4,t=r();c[i*3]=w*(t<.2?.8:1);c[i*3+1]=w*(t>.8?.85:1);c[i*3+2]=w}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.6,vertexColors:true,sizeAttenuation:true,depthWrite:false})));
  const neb=(col,x,y,z,s)=>{const cv=document.createElement('canvas');cv.width=cv.height=128;const q=cv.getContext('2d'),gr=q.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=gr;q.fillRect(0,0,128,128);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.55}));sp.position.set(x,y,z);sp.scale.setScalar(s);scene.add(sp)};
  neb('rgba(140,70,220,.6)',-180,90,-160,260);neb('rgba(40,120,240,.55)',200,-60,-120,240);neb('rgba(230,80,170,.45)',60,180,180,220);neb('rgba(60,200,220,.4)',-160,-150,140,240)})();
// ---- 星（六角タイル）：どの星も同じ分け方（n=8）。タイルの配置は星ごとに入れかえる ----
const CELLS=makeHexSphere(GAIA_LAYOUT.n).map(c=>({i:c.i,c:V3(...c.c),cs:c.corners.map(v=>V3(...v)),nb:c.nb}));
CELLS.forEach(c=>{const [e1,e2]=tangentBasis([c.c.x,c.c.y,c.c.z]);c.e1=V3(...e1);c.e2=V3(...e2);c.t=-1;c.a=0;c.h=0;c.pc=-1});
const TILES=[];   // TILES[n] = {n,cell,a,cost,cont,par}（0 ははじめの島）
let NTILE=0,CUR=null,WD=null;   // いまいる星（WDEF の id とその中身）
function layoutWorld(id){WD=WDEF[id];CUR=id;AREA=WD.area;ROCK_BY_AREA=WD.rockBy;PORTAL_STEPS=WD.portal;
  CELLS.forEach(c=>{c.t=-1;c.a=0;c.h=0;c.pc=-1});TILES.length=0;
  WD.layout.cells.split(';').forEach((s,i)=>{if(!s)return;const [t,a,h,p]=s.split(',').map(Number);const c=CELLS[i];c.t=t;c.a=a;c.h=h/20;c.pc=p});
  TILES[0]={n:0,cells:[],a:1,cost:{},cont:[]};
  WD.tiles.forEach((row,k)=>{const n=k+1,[a,cs,ct]=row.split('|');const cost={};(cs||'').split(',').forEach(x=>{if(!x)return;const [r,v]=x.split(':');cost[r]=+v});TILES[n]={n,a:+a,cost,cont:(ct||'').split(' ').filter(Boolean)}});
  CELLS.forEach(c=>{if(c.t>0){TILES[c.t].cell=c.i;TILES[c.t].par=c.pc>=0?CELLS[c.pc].t:0}else if(c.t===0)TILES[0].cells.push(c.i)});
  // はじめの島のまん中を先頭に（ガイアは今までどおりセルの番号順）
  if(WD.ctrFirst){const S=TILES[0].cells,ctr=S.find(i=>CELLS[i].nb.every(j=>S.includes(j)));if(ctr!=null)TILES[0].cells=[ctr,...S.filter(i=>i!==ctr)]}
  NTILE=WD.tiles.length}
// ---- 世界の状態（セーブするもの）----
const W={open:new Set([0]),paid:{},ts:0,once:new Set()};
const isLand=c=>c.t>=0&&W.open.has(c.t);
const tileOfCell=c=>c.t>=0?TILES[c.t]:null;
// 今買えるタイル：親が開いていて、自分はまだ。Wiki の順番から先に行きすぎないよう、
// まだ開いていないいちばん小さい番号から 6 枚先まで
let MINLOCK=1;function calcMinLock(){MINLOCK=1;while(MINLOCK<=NTILE&&W.open.has(MINLOCK))MINLOCK++}
function available(n){const T=TILES[n];return n>0&&!W.open.has(n)&&W.open.has(T.par)&&n<MINLOCK+6}
// 位置 → いちばん近いタイル（前のタイルからとなりへたどる）
function cellAt(u,hint){let i=hint!=null&&hint>=0?hint:0,best=CELLS[i].c.dot(u);
  if(hint==null||hint<0){for(const c of CELLS){const d=c.c.dot(u);if(d>best){best=d;i=c.i}}return i}
  for(let it=0;it<40;it++){let nx=-1;for(const j of CELLS[i].nb){const d=CELLS[j].c.dot(u);if(d>best){best=d;nx=j}}if(nx<0)break;i=nx}return i}
const topR=c=>SEA+c.h;
// 地面の点：タイルの平らな上面の上（u の向きで）
function groundAt(u,c){return topR(c)/Math.max(.2,u.dot(c.c))}
const world=new THREE.Group();scene.add(world);
let WG=new THREE.Group();world.add(WG);   // いまの星のもの（タイル・木や岩・建物・敵…）。星を移るとまるごと作り直す
// 海の底と海
const bed=new THREE.Mesh(new THREE.SphereGeometry(BED+.05,64,48),new THREE.MeshLambertMaterial({color:'#1371b8'}));bed.receiveShadow=true;world.add(bed);
const WAVE={value:0};
const waterMat=new THREE.MeshPhongMaterial({color:'#22b8f2',transparent:true,opacity:.8,shininess:40,specular:0x2a6a8a,depthWrite:false});
waterMat.onBeforeCompile=s=>{s.uniforms.uT=WAVE;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 nn=normalize(position);float w=sin(nn.x*40.+uT*1.3)*cos(nn.z*38.+uT*1.1)+sin(nn.y*44.-uT*1.7)*.6;transformed+=nn*w*.05;')};
const water=new THREE.Mesh(new THREE.SphereGeometry(SEA,128,96),waterMat);water.renderOrder=5;world.add(water);
// ---- 1 枚のタイルの形（面取りした六角柱）----
function tileGeo(c,col){const b=new MB();const top=topR(c),bev=.14,ins=.86,pos=[],cols=[];const n=c.cs.length;
  const proj=(v,r)=>v.clone().multiplyScalar(r/v.dot(c.c));
  const ctr=c.c.clone().multiplyScalar(top),outer=c.cs.map(v=>proj(v,top-bev)),inner=outer.map(v=>v.clone().sub(ctr).multiplyScalar(ins).add(ctr).addScaledVector(c.c,bev)),bot=c.cs.map(v=>v.clone().multiplyScalar(BED));
  const P=[],C=[];const tri=(a,b2,d,cl,cl2,cl3)=>{P.push(a.x,a.y,a.z,b2.x,b2.y,b2.z,d.x,d.y,d.z);for(const q of[cl,cl2||cl,cl3||cl2||cl])C.push(q.r,q.g,q.b)};
  const ct=new THREE.Color(col.top),cb=new THREE.Color(col.top).multiplyScalar(.86),cs=new THREE.Color(col.side),cd=new THREE.Color(col.side).multiplyScalar(.45);
  for(let k=0;k<n;k++){const k2=(k+1)%n;
    tri(ctr,inner[k],inner[k2],ct);                                   // 上
    tri(inner[k],outer[k],outer[k2],cb);tri(inner[k],outer[k2],inner[k2],cb);   // 面取り
    tri(outer[k],bot[k],bot[k2],cs,cd,cd);tri(outer[k],bot[k2],outer[k2],cs,cd,cs)} // 横（下ほど暗く）
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();g.computeBoundingSphere();return g}
const TILE_MESH={};   // セル番号 → メッシュ
function buildTileMesh(c){const A=AREA[c.a]||AREA[1];const top=(c.t*7+c.i)%3===0?A.top2:A.top;const m=new THREE.Mesh(tileGeo(c,{top,side:A.side}),VCMAT);m.castShadow=true;m.receiveShadow=true;WG.add(m);TILE_MESH[c.i]=m;return m}
// ---- 海の浅いところ（陸のとなりのタイルを水の中の砂に）と波打ち際の白い泡 ----
let shelfMesh=null,foamMesh=null;
const shelfMat=new THREE.MeshLambertMaterial({color:'#7fe0e8'}),foamMat=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.75,depthWrite:false});
function rebuildShore(){const P=[],F=[];
  for(const c of CELLS){const land=isLand(c);
    if(!land&&c.nb.some(j=>isLand(CELLS[j]))){const r=SEA-.75,ctr=c.c.clone().multiplyScalar(r);const cs=c.cs.map(v=>v.clone().multiplyScalar(r/v.dot(c.c)));for(let k=0;k<cs.length;k++){const a=cs[k],b2=cs[(k+1)%cs.length];P.push(ctr.x,ctr.y,ctr.z,a.x,a.y,a.z,b2.x,b2.y,b2.z)}}
    if(land){const n=c.cs.length;for(let k=0;k<n;k++){const a=c.cs[k],b2=c.cs[(k+1)%n];const mid=a.clone().add(b2).normalize();let nb=-1,bd=-2;for(const j of c.nb){const d=CELLS[j].c.dot(mid);if(d>bd){bd=d;nb=j}}
      if(isLand(CELLS[nb]))continue;const r=SEA+.03,out=mid.clone().sub(c.c).normalize().multiplyScalar(.28);const a1=a.clone().multiplyScalar(r/a.dot(c.c)),b1=b2.clone().multiplyScalar(r/b2.dot(c.c)),a3=a1.clone().add(out),b3=b1.clone().add(out);
      F.push(a1.x,a1.y,a1.z,a3.x,a3.y,a3.z,b3.x,b3.y,b3.z,a1.x,a1.y,a1.z,b3.x,b3.y,b3.z,b1.x,b1.y,b1.z)}}}
  const mk=(arr,mat,old)=>{if(old){WG.remove(old);old.geometry.dispose()}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mat);WG.add(m);return m};
  shelfMesh=mk(P,shelfMat,shelfMesh);shelfMesh.receiveShadow=true;foamMesh=mk(F,foamMat,foamMesh);foamMesh.renderOrder=6}
// ---- 置き物の位置（タイルの上の平らな面で、中心から x,z）----
function tilePoint(c,x,z,out){out=out||new THREE.Vector3();return out.copy(c.c).multiplyScalar(topR(c)).addScaledVector(c.e1,x).addScaledVector(c.e2,z)}
const _pe1=new THREE.Vector3(),_pe2=new THREE.Vector3(),_pf=new THREE.Vector3(),_ps=new THREE.Vector3();
function placeMatrix(pos,up,yaw,s,out){upBasis(up,_pe1,_pe2);_pf.copy(_pe1).multiplyScalar(Math.cos(yaw)).addScaledVector(_pe2,Math.sin(yaw));frameQuat(up,_pf,_q1);return(out||new THREE.Matrix4()).compose(pos,_q1,_ps.set(s,s,s))}
// ---- 木や岩（たくさんあるので InstancedMesh）----
const NODES=[],NODE_IM={},STUMP_IM={},BLDS=[],DECO_IM={},SPAWNS=[];
const BY_CELL={};   // セル番号 → そこの木・岩・建物
const nodeKind=(k,a)=>k==='rock'?(ROCK_BY_AREA[a]||'rock'):k;
function planTile(n){const T=TILES[n];if(n===0){// はじめの島（星ごとに WDEF の start）
    for(const s of WD.start){const ci=T.cells[s.j];if(ci==null)continue;if(s.n)planNodes(ci,s.n,s.c,s.j);else if(s.b)BLDS.push({k:s.b,n:0,cell:ci,yaw:0,key:'s'+s.j});else if(s.e)SPAWNS.push({k:s.e,n:0,cell:ci})}return}
  const c=CELLS[T.cell],r=mulberry(n*7919+3);const bk=T.cont.find(k=>BLD[k]);const nodes=T.cont.filter(k=>NODE[nodeKind(k,T.a)]),ens=T.cont.filter(k=>ENEMY[k]);
  if(bk){BLDS.push({k:bk,n,cell:c.i,yaw:0,key:String(n)});}
  for(const k0 of nodes){const k=nodeKind(k0,T.a);let cnt=NODE_PER[k]||2;if(bk&&cnt>1)cnt=k==='chest'?1:2;if(nodes.length>1&&cnt>2)cnt=2;planNodes(c.i,k,cnt,n,bk?1.25:null,nodes.indexOf(k0))}
  for(const k of ens)SPAWNS.push({k,n,cell:c.i})}
function planNodes(ci,k,cnt,seed,ring,slot){const c=CELLS[ci],r=mulberry(ci*131+seed*17+(slot||0)*977);const base=r()*Math.PI*2+(slot||0)*1.3;
  for(let j=0;j<cnt;j++){const a=base+j/cnt*Math.PI*2+(r()-.5)*.5,rad=ring||(cnt===1?(k==='sword'||k==='core'||k==='chest'?0:.4):.75+r()*.45);const x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    const o={k,cell:ci,x,z,yaw:r()*6.28,s:.9+r()*.25,hp:NODE[k].hp,alive:true,t:0,shake:0,grow:1,pos:new THREE.Vector3(),idx:0,id:NODES.length};NODES.push(o);(BY_CELL[ci]||(BY_CELL[ci]=[])).push(o)}}
function buildNodes(){for(let n=0;n<=NTILE;n++)planTile(n);
  const cnt={},scnt={};NODES.forEach(o=>{o.idx=cnt[o.k]=(cnt[o.k]||0);cnt[o.k]++;const sk=STUMP_OF[o.k];o.sidx=scnt[sk]=(scnt[sk]||0);scnt[sk]++});
  const hid=new THREE.Matrix4().makeScale(0,0,0);
  for(const k in cnt){const im=new THREE.InstancedMesh(nodeGeo(k),NODE_GLOW[k]?lam({emissive:NODE_GLOW[k]}):VCMAT,cnt[k]);im.castShadow=true;im.receiveShadow=true;for(let i=0;i<cnt[k];i++)im.setMatrixAt(i,hid);im.frustumCulled=false;WG.add(im);NODE_IM[k]=im}
  for(const k in scnt){const im=new THREE.InstancedMesh(stumpGeo(k),VCMAT,scnt[k]);im.receiveShadow=true;for(let i=0;i<scnt[k];i++)im.setMatrixAt(i,hid);im.frustumCulled=false;WG.add(im);STUMP_IM[k]=im}
  NODES.forEach(o=>{const c=CELLS[o.cell];tilePoint(c,o.x,o.z,o.pos);o.up=c.c.clone()})}
const _mx=new THREE.Matrix4(),HIDE=new THREE.Matrix4().makeScale(0,0,0);
// 見た目を今の状態に（ゆれ・生えてくる・切り株）
function drawNode(o){const im=NODE_IM[o.k],sm=STUMP_IM[STUMP_OF[o.k]];const shown=isLand(CELLS[o.cell])&&!o.hidden;
  if(!shown){im.setMatrixAt(o.idx,HIDE);sm.setMatrixAt(o.sidx,HIDE)}
  else if(o.alive){const g=o.grow,sh=o.shake>0?Math.sin(o.shake*60)*o.shake*.5:0;placeMatrix(o.pos,o.up,o.yaw+sh,o.s*(g<1?.2+.8*easeOutBack(g):1)*(1+(o.shake>0?o.shake*.3:0)),_mx);im.setMatrixAt(o.idx,_mx);sm.setMatrixAt(o.sidx,HIDE)}
  else{im.setMatrixAt(o.idx,HIDE);if(NODE[o.k].once)sm.setMatrixAt(o.sidx,HIDE);else{placeMatrix(o.pos,o.up,o.yaw,o.s,_mx);sm.setMatrixAt(o.sidx,_mx)}}
  im.instanceMatrix.needsUpdate=true;sm.instanceMatrix.needsUpdate=true}
function easeOutBack(t){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
// ---- 飾り（草・花など）----
const DECOS=[];
function buildDeco(){const cnt={};const r=mulberry(4242);
  for(const c of CELLS){if(c.t<0)continue;const A=AREA[c.a]||AREA[1],set=DECO_SETS[A.deco]||[];if(!set.length)continue;const used=(BY_CELL[c.i]||[]).map(o=>[o.x,o.z]);const hasB=BLDS.some(b=>b.cell===c.i);
    const m=4+Math.floor(r()*4);for(let j=0;j<m;j++){const a=r()*Math.PI*2,rad=.35+r()*1.35,x=Math.cos(a)*rad,z=Math.sin(a)*rad;if(used.some(([ux,uz])=>Math.hypot(ux-x,uz-z)<.75))continue;if(hasB&&rad<1.5)continue;
      const k=set[Math.floor(r()*set.length)];DECOS.push({k,cell:c.i,x,z,yaw:r()*6.28,s:.8+r()*.5,idx:cnt[k]=(cnt[k]||0)});cnt[k]++}}
  for(const k in cnt){const im=new THREE.InstancedMesh(decoGeo(k),DECO_GLOW[k]?lam({emissive:DECO_GLOW[k]}):VCMAT,cnt[k]);for(let i=0;i<cnt[k];i++)im.setMatrixAt(i,HIDE);im.frustumCulled=false;im.receiveShadow=true;WG.add(im);DECO_IM[k]=im}}
function drawDecoCell(ci){const c=CELLS[ci];for(const d of DECOS){if(d.cell!==ci)continue;const im=DECO_IM[d.k];if(isLand(c))im.setMatrixAt(d.idx,placeMatrix(tilePoint(c,d.x,d.z),c.c,d.yaw,d.s,_mx));else im.setMatrixAt(d.idx,HIDE);im.instanceMatrix.needsUpdate=true}}
// ---- 建物 ----
function buildBuildings(){for(const B of BLDS){const c=CELLS[B.cell];
  // 前（台のある向き）は、親のタイル（来た方）へ向ける
  // はじめの島の建物は島のまん中へ向ける
  const T=TILES[B.n];let pc=T.par>0?CELLS[TILES[T.par].cell]:CELLS[TILES[0].cells[0]];if(pc.i===c.i)pc=CELLS[c.nb[0]];
  // 親がとなりにない（船で着く島）ときは、となりのいちばん番号の小さいタイルへ向ける
  if(T.par>0&&!c.nb.includes(pc.i)){const q=c.nb.map(j=>CELLS[j]).filter(q=>q.t>0).sort((a,b)=>a.t-b.t)[0];if(q)pc=q}const f=tangent(pc.c.clone().sub(c.c),c.c);B.f=f;B.up=c.c.clone();B.pos=tilePoint(c,0,0);
  const D=BLD[B.k];let m;if(B.k==='portal')m=portalModel(WD.portalCol);else if(D.kind==='warp'){m=portalModel(WDEF[D.to].portalCol);const U=m.userData;U.pieces.forEach(p=>p.visible=true);U.ghosts.forEach(p=>p.visible=false);U.swirl.visible=U.sw2.visible=true}
  else if(D.kind==='npc')m=makeNpc(B.k);else m=bldMesh(B.k);
  if(B.k==='tailorR'){const nm=makeNpc('tailor');nm.position.set(1.4,0,.35);nm.rotation.y=-.5;m.add(nm)}
  m.position.copy(B.pos);frameQuat(c.c,f,m.quaternion);if(B.k==='bridge'){m.position.copy(c.c).multiplyScalar(SEA+.32)}
  m.visible=false;WG.add(m);B.m=m;(BY_CELL[B.cell]||(BY_CELL[B.cell]=[])).push(B);B.isB=true;B.r=({bridge:0,portal:1.6,rportal:1.6,cave:0,dockN:0,dockS:0,farmer:.4,captain:.4})[B.k];if(B.r==null)B.r=1.15;
  // 台（足をのせる丸）：精錬所・商人は前、ポータルとキャラは前
  const rt=new THREE.Vector3().crossVectors(c.c,f).normalize();B.rt=rt;const pad=(dx,dz)=>c.c.clone().multiplyScalar(topR(c)).addScaledVector(f,dz).addScaledVector(rt,dx);
  // 台は正面（来た方＝開いているタイルの側）に置く。精錬所は「入れる丸」と「受け取る緑の丸」を並べる
  if(D.kind==='ref'){B.pIn=pad(-.95,1.72);B.pOut=pad(.95,1.72);B.padR=.72}else if(D.tools){B.pIn=pad(-.95,1.72);B.pIn2=pad(.95,1.72);B.padR=.72}else{B.pIn=pad(0,2.05);B.padR=.95}}}
// 足元の丸（台）
const padMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false});
function padMesh(pos,up,r,col){const g=new THREE.RingGeometry(r*.78,r,28);const m=new THREE.Mesh(g,padMat.clone());m.material.color.set(col||'#ffffff');m.position.copy(pos).addScaledVector(up,.04);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),up);m.renderOrder=7;WG.add(m);
  const inner=new THREE.Mesh(new THREE.CircleGeometry(r*.78,28),new THREE.MeshBasicMaterial({color:col||'#ffffff',transparent:true,opacity:.18,depthWrite:false}));inner.position.copy(m.position);inner.quaternion.copy(m.quaternion);inner.renderOrder=7;WG.add(inner);return[m,inner]}
// ---- 買えるタイルの目印（水の上の光る六角）----
const ghostMat=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.28,depthWrite:false}),ghostLine=new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.95});
const GHOST={};
function ghostOf(n){if(GHOST[n])return GHOST[n];const c=CELLS[TILES[n].cell],r=SEA+.08;const ctr=c.c.clone().multiplyScalar(r),cs=c.cs.map(v=>v.clone().multiplyScalar(r/v.dot(c.c)).sub(ctr).multiplyScalar(.9).add(ctr));
  const P=[];for(let k=0;k<cs.length;k++){const a=cs[k],b=cs[(k+1)%cs.length];P.push(ctr.x,ctr.y,ctr.z,a.x,a.y,a.z,b.x,b.y,b.z)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
  const grp=new THREE.Group();const m=new THREE.Mesh(g,ghostMat);m.renderOrder=8;grp.add(m);const lp=[];cs.forEach(v=>lp.push(v.x,v.y,v.z));lp.push(cs[0].x,cs[0].y,cs[0].z);const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));const ln=new THREE.Line(lg,ghostLine);ln.renderOrder=9;grp.add(ln);
  WG.add(grp);return GHOST[n]=grp}
// ---- 星を作り直す（星を移るとき・セーブを読むとき）----
function clearWorld(){world.remove(WG);const keep=new Set([...Object.values(NODE_GEO),...Object.values(STUMP_GEO),...Object.values(DECO_GEO),...Object.values(PIECE_GEO)]);
  WG.traverse(o=>{if(o.geometry&&!keep.has(o.geometry))o.geometry.dispose()});WG=new THREE.Group();world.add(WG);
  NODES.length=BLDS.length=SPAWNS.length=DECOS.length=ENEMIES.length=TOLLS.length=RISING.length=0;
  for(const o of [BY_CELL,TILE_MESH,GHOST,NODE_IM,STUMP_IM,DECO_IM])for(const k in o)delete o[k];GH_ON.clear();NDIRTY.clear();shelfMesh=foamMesh=null;
  for(const o of [PTAGS,BTAG])for(const k in o){o[k].remove();delete o[k]}
  for(const p of PIECES){world.remove(p.m);PIECE_POOL[p.k].push(p.m);if(p.val>0)addRes(p.k,p.val)}PIECES.length=0;
  PAY.n=-1;DW.key=DW.cur=null;AUTO.tgt=null;AUTO.clear=null;AUTO.path=[];AUTO.skip.clear();PADUI=null;LOCK_SHOW=null;sharkGone()}
function buildWorld(id){clearWorld();layoutWorld(id);waterMat.color.set(WD.water);bed.material.color.set(WD.bed);shelfMat.color.set(WD.shelf);
  W.open=new Set([0]);W.paid={};W.once=new Set();buildNodes();buildDeco();buildBuildings();makeEnemies();makeTolls()}
