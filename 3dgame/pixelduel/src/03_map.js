// ===================== マップ：ゴーストタウン（2018年ごろのデュエル版） =====================
// 道（z方向）をはさんで、+x側に刑務所（手前）と酒場（奥）、-x側に青い家（手前）と銀行（奥）。
// 銀行の奥に給水塔、酒場の奥に絞首台、青い家の手前に墓地。まわりは木の柵、道の両はしに「Welcome to the GHOST TOWN」の門。
const MAP={x0:-30,x1:30,z0:-45,z1:45};
// ---- 光と空 ----
scene.fog=new THREE.Fog(0xe8d8b0,70,230);
const hemi=new THREE.HemisphereLight(0xfff4dc,0xb89a68,.72);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d0,.82);sun.position.set(-30,60,-20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
{const s=sun.shadow.camera;s.left=-60;s.right=60;s.top=60;s.bottom=-60;s.near=1;s.far=180}sun.shadow.bias=-.0006;scene.add(sun);scene.add(sun.target);
const sky=new THREE.Mesh(new THREE.SphereGeometry(400,24,12),new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(sky);
skyTex.repeat.set(3,1);
// ---- まとめて描く箱（材質ごとに1つのメッシュにする） ----
const TS={sand:2,road:2,track:1,wood:2,woodV:2,woodD:2,woodL:2,gray:2,grayH:2,green:2,greenH:2,yellow:2,yellowV:2,blue:2,blueV:2,roof:2,roofG:2,floor:2,floorD:2,stone:2,brick:2,metal:1,dark:2,glass:1,cactus:1,rock:4,rockD:4,cloth:1,hay:1,rope:.5,bars:1,grass:1,tnt:1,barrel:1,crate:1,money:1,gold:1,white:1,skull:1};
const GB={};
function gbuf(t){return GB[t]||(GB[t]={p:[],n:[],u:[],i:[]})}
const SOL=[],LAD=[];   // 当たり判定の箱 [x0,y0,z0,x1,y1,z1]、はしご
const _v=new THREE.Vector3(),_n=new THREE.Vector3();
// 箱。o.solid（既定 true）、o.ts（テクスチャの大きさ m）、o.m（回す行列。指定するとローカル座標の箱）
function box(t,x0,y0,z0,x1,y1,z1,o){o=o||{};if(x0>x1)[x0,x1]=[x1,x0];if(y0>y1)[y0,y1]=[y1,y0];if(z0>z1)[z0,z1]=[z1,z0];
  const B=gbuf(t),ts=o.ts||TS[t]||2,m=o.m,nm=m?new THREE.Matrix3().getNormalMatrix(m):null;
  const F=[[[1,0,0],[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],'zy'],[[-1,0,0],[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],'zy'],
    [[0,1,0],[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],'xz'],[[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],'xz'],
    [[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],'xy'],[[0,0,-1],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],'xy']];
  for(let f=0;f<6;f++){if(f===3&&y0<=.01&&!m)continue;if(o.skip&&o.skip.includes(f))continue;const [nn,vs,ax]=F[f],base=B.p.length/3;
    for(const v of vs){let uu,vv;if(ax==='zy'){uu=v[2];vv=v[1]}else if(ax==='xz'){uu=v[0];vv=v[2]}else{uu=v[0];vv=v[1]}
      if(m){_v.set(v[0],v[1],v[2]).applyMatrix4(m);B.p.push(_v.x,_v.y,_v.z)}else B.p.push(v[0],v[1],v[2]);
      if(nm){_n.set(nn[0],nn[1],nn[2]).applyMatrix3(nm).normalize();B.n.push(_n.x,_n.y,_n.z)}else B.n.push(nn[0],nn[1],nn[2]);
      B.u.push(uu/ts,vv/ts)}
    B.i.push(base,base+1,base+2,base,base+2,base+3)}
  if(o.solid!==false&&!m){const s=[x0,y0,z0,x1,y1,z1];SOL.push(s);return s}return null}
// 回した箱（飾り。当たり判定なし）：中心・大きさ・回転
function rbox(t,cx,cy,cz,sx,sy,sz,ry,rz,rx){const m=new THREE.Matrix4().compose(new THREE.Vector3(cx,cy,cz),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'YZX')),new THREE.Vector3(1,1,1));
  box(t,-sx/2,-sy/2,-sz/2,sx/2,sy/2,sz/2,{m,solid:false})}
const nb=(t,x0,y0,z0,x1,y1,z1,o)=>box(t,x0,y0,z0,x1,y1,z1,Object.assign({solid:false},o||{}));
function buildMeshes(){for(const t in GB){const B=GB[t];if(!B.i.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(B.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(B.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(B.u,2));g.setIndex(B.i);const cut=t==='bars'||t==='grass';
  const mm=new THREE.MeshLambertMaterial({map:T[t],alphaTest:cut?.5:0,side:cut?THREE.DoubleSide:THREE.FrontSide});const me=new THREE.Mesh(g,mm);me.castShadow=!cut;me.receiveShadow=true;me.name='map_'+t;scene.add(me)}}
// 看板などの絵（1枚の板）
function plate(tex,x,y,z,w,h,ry,o){o=o||{};const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex,transparent:!!o.cut,alphaTest:o.cut?.5:0,side:o.two?THREE.DoubleSide:THREE.FrontSide}));m.position.set(x,y,z);m.rotation.y=ry||0;m.receiveShadow=true;scene.add(m);return m}
// 壁（x一定 または z一定）に、ドアや窓の穴をあける。holes: [[a0,a1,y0,y1],...]（aは壁にそった座標）
function wall(ax,c,a0,a1,y0,y1,th,t,holes,o){holes=holes||[];const cuts=new Set([a0,a1]);for(const h of holes){cuts.add(clamp(h[0],a0,a1));cuts.add(clamp(h[1],a0,a1))}const xs=[...cuts].sort((p,q)=>p-q);
  for(let k=0;k<xs.length-1;k++){const s0=xs[k],s1=xs[k+1];if(s1-s0<1e-3)continue;const mid=(s0+s1)/2;let ys=[[y0,y1]];
    for(const h of holes){if(mid<=h[0]||mid>=h[1])continue;const nx=[];for(const [p,q] of ys){if(h[3]<=p||h[2]>=q){nx.push([p,q]);continue}if(h[2]>p)nx.push([p,h[2]]);if(h[3]<q)nx.push([h[3],q])}ys=nx}
    for(const [p,q] of ys){if(q-p<1e-3)continue;if(ax==='x')box(t,c-th/2,p,s0,c+th/2,q,s1,o);else box(t,s0,p,c-th/2,s1,q,c+th/2,o)}}
  // 窓とドアのわく
  for(const h of holes){const fr=(o&&o.frame)||'woodD';if(ax==='x'){nb(fr,c-th/2-.06,h[2]-.08,h[0]-.08,c+th/2+.06,h[2],h[1]+.08);nb(fr,c-th/2-.06,h[3],h[0]-.08,c+th/2+.06,h[3]+.08,h[1]+.08);nb(fr,c-th/2-.06,h[2],h[0]-.08,c+th/2+.06,h[3],h[0]);nb(fr,c-th/2-.06,h[2],h[1],c+th/2+.06,h[3],h[1]+.08)}
    else{nb(fr,h[0]-.08,h[2]-.08,c-th/2-.06,h[1]+.08,h[2],c+th/2+.06);nb(fr,h[0]-.08,h[3],c-th/2-.06,h[1]+.08,h[3]+.08,c+th/2+.06);nb(fr,h[0]-.08,h[2],c-th/2-.06,h[0],h[3],c+th/2+.06);nb(fr,h[1],h[2],c-th/2-.06,h[1]+.08,h[3],c+th/2+.06)}}}
// 階段（a方向に上がる）。x0..x1 × z0..z1 の範囲、dir: '+x' '-x' '+z' '-z'
function stairs(t,x0,x1,z0,z1,y0,y1,dir){const n=Math.max(2,Math.round((y1-y0)/.38));for(let k=0;k<n;k++){const a=k/n,b=(k+1)/n,yt=y0+(y1-y0)*b;
  if(dir==='+x')box(t,lerp(x0,x1,a),y0,z0,lerp(x0,x1,b),yt,z1);else if(dir==='-x')box(t,lerp(x1,x0,b),y0,z0,lerp(x1,x0,a),yt,z1);
  else if(dir==='+z')box(t,x0,y0,lerp(z0,z1,a),x1,yt,lerp(z0,z1,b));else box(t,x0,y0,lerp(z1,z0,b),x1,yt,lerp(z1,z0,a))}}
// 柵（x方向かz方向）
function fence(ax,c,a0,a1,h,gap){const n=Math.max(1,Math.round((a1-a0)/2.6));for(let k=0;k<=n;k++){const a=lerp(a0,a1,k/n);if(gap&&a>gap[0]&&a<gap[1])continue;if(ax==='x')nb('woodV',a-.15,0,c-.15,a+.15,h+.2,c+.15);else nb('woodV',c-.15,0,a-.15,c+.15,h+.2,a+.15)}
  const segs=gap?[[a0,gap[0]],[gap[1],a1]]:[[a0,a1]];for(const [p,q] of segs)for(const y of[h*.45,h*.9]){if(ax==='x')nb('wood',p,y-.1,c-.06,q,y+.1,c+.06);else nb('wood',c-.06,y-.1,p,c+.06,y+.1,q)}}
function barrel(x,z,y){y=y||0;const m=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,1,10),new THREE.MeshLambertMaterial({map:T.barrel}));m.position.set(x,y+.5,z);m.castShadow=m.receiveShadow=true;scene.add(m);SOL.push([x-.4,y,z-.4,x+.4,y+1,z+.4])}
function crate(x,z,y,s){y=y||0;s=s||1;box('crate',x-s/2,y,z-s/2,x+s/2,y+s,z+s/2)}
function cactus(x,z,h){box('cactus',x-.35,0,z-.35,x+.35,h,z+.35,{solid:Math.abs(x)<31&&Math.abs(z)<46});const s=srnd()<.5?-1:1;nb('cactus',x+s*.35,h*.45,z-.22,x+s*1,h*.45+.45,z+.22);nb('cactus',x+s*.7,h*.45,z-.22,x+s*1.05,h*.8,z+.22)}
function chair(x,z,ry){rbox('woodD',x,.45,z,.5,.08,.5,ry);rbox('woodD',x+Math.sin(ry)*.22,.85,z+Math.cos(ry)*.22,.5,.8,.08,ry);for(const [a,b] of[[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]])nb('woodD',x+a-.04,0,z+b-.04,x+a+.04,.45,z+b+.04)}
function table(x0,z0,x1,z1,y){y=y||0;box('woodL',x0,y+.8,z0,x1,y+.9,z1);for(const [a,b] of[[x0+.1,z0+.1],[x1-.2,z0+.1],[x0+.1,z1-.2],[x1-.2,z1-.2]])nb('woodD',a,y,b,a+.1,y+.8,b+.1);SOL.push([x0,y,z0,x1,y+.9,z1])}
// ---- 建物の外側（屋根つきの縁側） ----
function porch(side,xr,z0,z1,y,roofY,wallTex){// side: +1 なら建物が+x側（縁側は xr-2..xr）
  const xa=side>0?xr-2:xr,xb=side>0?xr:xr+2;box('woodL',xa,0,z0,xb,y,z1);
  if(roofY){box('roof',xa-(side>0?.2:0),roofY,z0-.2,xb+(side>0?0:.2),roofY+.18,z1+.2);const px=side>0?xa+.15:xb-.15;for(let z=z0+.2;z<=z1-.1;z+=(z1-z0-.4)/Math.max(1,Math.round((z1-z0)/3.2)))nb('woodV',px-.12,y,z-.12,px+.12,roofY,z+.12)}}
const TNTS=[],SPAWNS=[],TUMBLE=[];
// TNT（爆発で消えるので1つずつの箱）
let TNTGEO=null,TNTMAT=null;
function tnt(x,y,z){if(!TNTGEO){TNTGEO=new THREE.BoxGeometry(.9,.9,.9);TNTMAT=new THREE.MeshLambertMaterial({map:T.tnt})}const m=new THREE.Mesh(TNTGEO,TNTMAT);m.position.set(x,y+.45,z);m.castShadow=m.receiveShadow=true;scene.add(m);
  const s=[x-.45,y,z-.45,x+.45,y+.9,z+.45];SOL.push(s);TNTS.push({id:TNTS.length,x,y,z,s,m,alive:true,fuse:0,back:0})}
function buildMap(){sseed(101);
  // 地面（砂）と道
  box('sand',-200,-.5,-200,200,0,200,{ts:2,solid:false});
  box('road',-6,0,MAP.z0-60,6,.02,MAP.z1+60,{solid:false});for(const x of[-1.7,1.7])box('track',x-.3,.02,MAP.z0-60,x+.3,.035,MAP.z1+60,{solid:false});
  // ---- まわりの柵と門 ----
  fence('x',MAP.z0+1,MAP.x0,MAP.x1,1.2,[-6,6]);fence('x',MAP.z1-1,MAP.x0,MAP.x1,1.2,[-6,6]);fence('z',MAP.x0,MAP.z0+1,MAP.z1-1,1.2);fence('z',MAP.x1,MAP.z0+1,MAP.z1-1,1.2);
  for(const s of[-1,1]){const z=s>0?MAP.z1-1:MAP.z0+1;for(const x of[-6.4,6.4])box('woodD',x-.4,0,z-.4,x+.4,7.2,z+.4);box('woodD',-7.6,6.2,z-.35,7.6,7,z+.35);
    // 門の扉（閉じている）
    for(let k=0;k<5;k++){const x=lerp(-6,6,k/4);nb('woodV',x-.12,0,z-.12,x+.12,1.6,z+.12)}nb('wood',-6,.5,z-.08,6,.75,z+.08);nb('wood',-6,1.2,z-.08,6,1.45,z+.08);rbox('wood',-3,.98,z,6.4,.22,.12,0,.18);rbox('wood',3,.98,z,6.4,.22,.12,0,-.18);
    const sg=signTex('',{w:96,h:32,bg:'#8a6038',edge:'#4a3018',draw:(g,W,H)=>{g.fillStyle='#3a2410';g.font='italic bold 9px serif';g.textAlign='center';g.fillText('Welcome to the',W/2,11);g.font='bold 14px monospace';g.fillStyle='#2a1808';g.fillText('GHOST TOWN',W/2,26)}});
    box('wood',-5.2,7,z-.25,5.2,9.6,z+.25);plate(sg,0,8.3,z-s*.27,10.2,2.5,s>0?Math.PI:0);plate(sg,0,8.3,z+s*.27,10.2,2.5,s>0?0:Math.PI)}
  // 見えない壁（外に出られない）
  for(const [x0,z0,x1,z1] of[[MAP.x0-1,MAP.z0-1,MAP.x1+1,MAP.z0+1.2],[MAP.x0-1,MAP.z1-1.2,MAP.x1+1,MAP.z1+1],[MAP.x0-1,MAP.z0,MAP.x0+.2,MAP.z1],[MAP.x1-.2,MAP.z0,MAP.x1+1,MAP.z1]])SOL.push([x0,-5,z0,x1,60,z1]);
  // ================= 刑務所（+x・手前） =================
  {const X0=8,X1=20,Z0=-34,Z1=-20,H=4.2;box('floor',X0,0,Z0,X1,.3,Z1);
    wall('x',X0,Z0,Z1,.3,H,.25,'gray',[[-28,-26.4,.3,2.7],[-32.5,-30.5,1.2,2.5],[-23.5,-21.5,1.2,2.5]]);wall('x',X1,Z0,Z1,.3,H,.25,'gray',[[-30,-28.8,.3,1.4]]);
    wall('z',Z0,X0,X1,.3,H,.25,'gray',[[11,13,1.2,2.4]]);wall('z',Z1,X0,X1,.3,H,.25,'gray',[[16,18,1.2,2.4]]);
    box('roofG',X0-.4,H,Z0-.4,X1+.4,H+.25,Z1+.4);box('gray',X0-.3,H+.25,Z0-.3,X0+.05,H+1.4,Z1+.3);   // 正面の高い板
    porch(1,X0,Z0,Z1,.3,3.2);
    const js=signTex('JAIL',{w:48,h:16,bg:'#e8e4dc',edge:'#5a5048',col:'#c0201a',fs:12});box('wood',X0-.35,3.5,-30.5,X0-.15,5.2,-24);plate(js,X0-.37,4.35,-27.25,6.2,1.55,-Math.PI/2);
    // 中：事務所（手前）と牢屋（奥）。牢屋の鉄格子は x=14
    for(let z=Z0+.2;z<Z1;z+=.25){if(z>-27.6&&z<-25.8)continue;nb('bars',14-.02,.3,z,14+.02,H,z+.25)}SOL.push([13.95,.3,Z0,14.05,H,-27.6]);SOL.push([13.95,.3,-25.8,14.05,H,Z1]);
    rbox('bars',15.2,1.5,-27.2,1.6,2.4,.05,1.1);   // 開いた牢屋の扉
    table(10,-31.5,12.4,-29.8);chair(11.2,-28.9,Math.PI);nb('dark',10.8,.9+.02,-31,11.6,1,-30.4);   // 机と帽子
    nb('woodD',11,.9,-31,11.4,1.15,-30.6);plate(signTex('',{w:16,h:12,bg:'#f0e8d0',edge:'#8a7050'}),8.16,2.4,-30.5,.8,.6,Math.PI/2);plate(signTex('',{w:16,h:12,bg:'#f0e8d0',edge:'#8a7050'}),8.16,2.4,-29.4,.8,.6,Math.PI/2);
    rbox('woodD',12.5,2.2,-33.8,1.4,.12,.12,0,.05);   // 壁のスナイパーライフル（飾り）
    nb('cloth',16,.3,-33.8,19.6,.8,-32.6);nb('dark',19.7,.3,-30,19.95,1.4,-28.8);   // ベッドと抜け穴
    plate(wantedTex('50'),X0-.14,1.9,-33.2,.9,1.2,-Math.PI/2,{cut:true});plate(wantedTex('100','#8a6a4a'),X0-.14,1.9,-21.2,.9,1.2,-Math.PI/2,{cut:true});
    plate(wantedTex('500'),X0+.14,1.9,-25,.9,1.2,Math.PI/2,{cut:true});
    SPAWNS.push([11,.3,-24,Math.PI/2])}
  // ================= 酒場（+x・奥、2階建て） =================
  {const X0=8,X1=22,Z0=0,Z1=18,F2=3.8,H=7.8;box('floorD',X0,0,Z0,X1,.3,Z1);
    wall('x',X0,Z0,Z1,.3,F2,.25,'green',[[8,10,.3,2.9],[2,4,1.3,2.8],[14,16,1.3,2.8]]);wall('x',X0,Z0,Z1,F2,H,.25,'green',[[8.2,9.8,F2,F2+2.4],[2.5,4.5,F2+1,F2+2.6],[13.5,15.5,F2+1,F2+2.6]]);
    wall('x',X1,Z0,Z1,.3,H,.25,'greenH');wall('z',Z0,X0,X1,.3,H,.25,'green',[[11,13,1.4,2.8],[17,19,F2+1,F2+2.6]]);wall('z',Z1,X0,X1,.3,H,.25,'green',[[11,13,1.4,2.8],[17,19,F2+1,F2+2.6]]);
    box('roofG',X0-.3,H,Z0-.3,X1+.3,H+.25,Z1+.3);
    // 正面の高いかざり（フォールスフロント）と看板
    box('green',X0-.32,H,Z0-.3,X0-.05,H+1.6,Z1+.3);box('green',X0-.32,H+1.6,Z0+3,X0-.05,H+2.4,Z1-3);
    const ss=signTex('',{w:80,h:24,bg:'#7a4a28',edge:'#3a2010',draw:(g,W,H)=>{g.fillStyle='#e8c870';g.font='bold 13px monospace';g.textAlign='center';g.fillText('SALOON',W/2,17);for(const x of[4,W-6])g.fillRect(x,10,2,2)}});
    box('wood',X0-.55,5.9,4.2,X0-.32,7.6,13.8);plate(ss,X0-.56,6.75,9,9.2,1.6,-Math.PI/2);plate(T.skull,X0-.4,9.2,9,1.6,1.6,-Math.PI/2,{cut:true});
    // 縁側と2階のバルコニー
    porch(1,X0,Z0,Z1,.3,0);box('woodL',X0-2,F2-.2,Z0,X0,F2,Z1);for(let z=Z0+.2;z<=Z1;z+=3.6)nb('woodV',X0-1.85,.3,z-.12,X0-1.6,F2-.2,z+.12);
    for(let z=Z0+.1;z<Z1;z+=.5)nb('woodV',X0-1.98,F2,z,X0-1.88,F2+1,z+.1);nb('wood',X0-2.02,F2+1,Z0,X0-1.84,F2+1.12,Z1);SOL.push([X0-2.05,F2,Z0,X0-1.82,F2+1.1,Z1]);
    // スイングドア
    for(const z of[8.05,9.05])rbox('woodL',X0-.1,1.3,z+.45,.06,1.2,.85,0);
    // 1階：カウンター・酒の棚・ピアノ・的・テーブル
    box('woodD',13,.3,15.2,21.6,1.4,16.2);box('woodL',12.9,1.4,15.1,21.7,1.5,16.3);box('woodD',13,.3,17.3,21.7,3.4,17.75);
    for(let k=0;k<3;k++){box('woodL',13.2,1.4+k*.65,16.95,21.5,1.48+k*.65,17.3,{solid:false});for(let x=13.4;x<21.3;x+=.32){const c=pick(['#3a8a3a','#8a3a2a','#e8d8a0','#5a3a8a','#c8a050']);const b=new THREE.Mesh(new THREE.BoxGeometry(.14,.42,.14),new THREE.MeshLambertMaterial({color:c}));b.position.set(x,1.7+k*.65,17.12);scene.add(b)}}
    box('dark',16.5,.3,.35,19.5,1.6,1.5);nb('white',16.6,1.1,.3,19.4,1.25,.4);for(let x=16.65;x<19.4;x+=.2)nb('dark',x,1.18,.28,x+.08,1.26,.32);   // ピアノ
    plate(signTex('',{w:16,h:16,bg:'#c8a050',edge:'#3a2010',draw:g=>{g.fillStyle='#c0201a';g.fillRect(4,4,8,8);g.fillStyle='#f0e8d0';g.fillRect(6,6,4,4);g.fillStyle='#c0201a';g.fillRect(7,7,2,2)}}),X1-.14,2.2,4,.8,.8,-Math.PI/2);
    rbox('woodD',X1-.15,2.6,7.5,.12,.12,1.6,0,0,.6);rbox('woodD',X1-.15,2.6,7.5,.12,.12,1.6,0,0,-.6);   // 交差したライフル
    table(10.5,3,12,4.6);chair(11.2,2.4,0);chair(11.2,5.2,Math.PI);table(10.5,11.8,12,13.4);chair(11.2,11.2,0);chair(11.2,14,Math.PI);table(16,6.5,17.6,8.1);chair(16.8,5.9,0);
    // 階段（奥の壁ぞい、+x方向に上がる）
    stairs('woodL',13,19.6,Z0+.25,Z0+1.55,.3,F2,'+x');
    // 2階の床（階段の穴をあける）
    box('floor',X0,F2-.2,Z0,X1,F2,Z0+.2);box('floor',X0,F2-.2,Z0+1.6,X1,F2,Z1);box('floor',X0,F2-.2,Z0+.2,13,F2,Z0+1.6);box('floor',19.6,F2-.2,Z0+.2,X1,F2,Z0+1.6);
    nb('woodL',13,F2,Z0+1.6,19.6,F2+1,Z0+1.7);SOL.push([13,F2,Z0+1.55,19.6,F2+1,Z0+1.75]);
    // 2階：奥に3つの部屋（x=16で区切る、z=6・12で仕切り）
    wall('x',16,Z0+1.8,Z1,F2,H,.2,'woodD',[[3.5,5,F2,F2+2.3],[8.5,10,F2,F2+2.3],[14,15.5,F2,F2+2.3]]);for(const z of[6,12])wall('z',z,16,X1,F2,H,.2,'woodD');
    for(const z0 of[2,6.5,12.5]){nb('cloth',19.6,F2,z0+.4,21.6,F2+.5,z0+2.4);table(17,z0+3.5,18,z0+4.4,F2)}
    crate(23,4);crate(23,4,1);crate(23.2,6,0,1.2);
    tnt(20.6,.3,13.6);SPAWNS.push([12,.3,8,Math.PI/2]);SPAWNS.push([12,F2,9,Math.PI/2])}
  // ================= 絞首台（酒場の奥） =================
  {const x0=10,x1=18,z0=23,z1=29,h=1.6;box('woodL',x0,0,z0,x1,h,z1);for(const [x,z] of[[x0+.2,z0+.2],[x1-.4,z0+.2],[x0+.2,z1-.4],[x1-.4,z1-.4]])nb('woodD',x,0,z,x+.2,h,z+.2);
    stairs('woodL',x0+.5,x0+2.5,z0-2,z0,0,h,'+z');box('woodD',15.6,h,25.6,16,h+4.4,26);box('woodD',13,h+4,25.6,16,h+4.4,26);rbox('woodD',15.2,h+3.6,25.8,.2,1.4,.2,0,.78);
    nb('rope',13.4,h+2.4,25.75,13.5,h+4,25.85);nb('rope',13.1,h+1.7,25.75,13.8,h+1.8,25.85);nb('rope',13.1,h+2.4,25.75,13.8,h+2.5,25.85);nb('rope',13.1,h+1.7,25.75,13.2,h+2.5,25.85);nb('rope',13.7,h+1.7,25.75,13.8,h+2.5,25.85);
    for(let x=x0;x<=x1;x+=.6)nb('woodV',x,h,z1-.08,x+.12,h+1,z1+.04);nb('wood',x0,h+.9,z1-.1,x1,h+1.02,z1+.06)}
  // ================= 青い家（-x・手前、2階建て） =================
  {const X0=-20,X1=-8,Z0=-32,Z1=-18,F2=3.6,H=7.2;box('floor',X0,0,Z0,X1,.3,Z1);
    wall('x',X1,Z0,Z1,.3,F2,.25,'blue',[[-26,-24.4,.3,2.7],[-30.5,-28.5,1.2,2.5],[-22,-20,1.2,2.5]]);wall('x',X1,Z0,Z1,F2,H,.25,'blue',[[-25.8,-24.4,F2,F2+2.3],[-30,-28.4,F2+.9,F2+2.3],[-22,-20.4,F2+.9,F2+2.3]]);
    wall('x',X0,Z0,Z1,.3,H,.25,'blueV',[[-27,-25,1.2,2.5],[-27,-25,F2+.9,F2+2.3]]);wall('z',Z0,X0,X1,.3,H,.25,'blueV',[[-15,-13,1.2,2.5],[-15,-13,F2+.9,F2+2.3]]);wall('z',Z1,X0,X1,.3,H,.25,'blueV',[[-17,-15,1.2,2.5],[-12,-10,F2+.9,F2+2.3]]);
    box('roof',X0-.5,H,Z0-.5,X1+.5,H+.25,Z1+.5);box('roof',X0+1,H+.25,Z0+1,X1-1,H+.9,Z1-1);
    porch(-1,X1,Z0,Z1,.3,0);box('woodL',X1,F2-.2,Z0,X1+2,F2,Z1);for(let z=Z0+.2;z<=Z1;z+=3.4)nb('woodV',X1+1.6,.3,z-.12,X1+1.85,F2-.2,z+.12);
    for(let z=Z0+.1;z<Z1;z+=.5)nb('woodV',X1+1.88,F2,z,X1+1.98,F2+1,z+.1);nb('wood',X1+1.84,F2+1,Z0,X1+2.02,F2+1.12,Z1);SOL.push([X1+1.82,F2,Z0,X1+2.05,F2+1.1,Z1]);
    // 1階：食堂と居間
    table(-16,-30,-13.5,-27.6);chair(-14.7,-31,0);chair(-14.7,-26.8,Math.PI);table(-12,-22,-10.6,-20.6);box('cloth',-19.6,.3,-21,-17.8,1,-19);   // ソファ
    for(let k=0;k<3;k++){box('woodL',-19.6,1.2+k*.6,-31.8,-17,1.28+k*.6,-31.4,{solid:false})}
    stairs('woodL',-19.6,-18.2,-29.5,-21.4,.3,F2,'+z');
    box('floor',X0,F2-.2,Z0,X1,F2,-29.5);box('floor',-18.2,F2-.2,-29.5,X1,F2,Z1);box('floor',X0,F2-.2,-21.4,-18.2,F2,Z1);
    // 2階：寝室（ベッドの上にライフル）
    box('woodD',-17.6,F2,-31.7,-15.2,F2+.5,-29);nb('cloth',-17.5,F2+.5,-31.6,-15.3,F2+.65,-29.1);rbox('woodD',-16.4,F2+1.9,-31.8,1.8,.12,.12);
    table(-12,-24,-10.5,-22.6,F2);crate(-9.2,-31.2,F2,.8);
    SPAWNS.push([-11,.3,-26,-Math.PI/2])}
  // ================= 墓地（青い家の手前） =================
  {sseed(202);for(let k=0;k<7;k++){const x=srr(-21,-10),z=srr(-42.5,-35.5);nb('woodD',x-.08,0,z-.08,x+.08,1.2,z+.08);nb('woodD',x-.38,.75,z-.07,x+.38,.9,z+.07);nb('dark',x-.5,0,z+.2,x+.5,.15,z+1.4)}
    for(let k=0;k<2;k++)rbox('woodD',-24+k*1.2,.6,-36+k*.6,.7,1.9,.35,.3,.35);fence('x',-34.5,-22,-8,.8);fence('z',-8,-42.5,-34.5,.8,[-40,-38])}
  // ================= 銀行（-x・奥） =================
  {const X0=-22,X1=-8,Z0=2,Z1=18,H=4.4;box('floor',X0,0,Z0,X1,.3,Z1);
    wall('x',X1,Z0,Z1,.3,H,.25,'yellow',[[9.2,10.8,.3,2.7],[4,6,1.2,2.5],[14,16,1.2,2.5]]);wall('x',X0,Z0,Z1,.3,H,.25,'yellowV',[[8.2,11.2,.3,2.6]]);
    wall('z',Z0,X0,X1,.3,H,.25,'yellowV',[[-14,-12,1.2,2.5]]);wall('z',Z1,X0,X1,.3,H,.25,'yellowV',[[-14,-12,1.2,2.5]]);
    box('roof',X0-.4,H,Z0-.4,X1+.4,H+.25,Z1+.4);box('yellow',X1+.05,H+.25,Z0-.3,X1+.32,H+1.5,Z1+.3);porch(-1,X1,Z0,Z1,.3,3.2);
    const bs=signTex('BANK',{w:48,h:16,bg:'#5a3418',edge:'#2a1808',col:'#f0c040',fs:11});box('wood',X1+.15,3.5,7,X1+.35,5,13);plate(bs,X1+.37,4.25,10,5.8,1.45,Math.PI/2);
    // 中：受付と金庫（奥 x<-17、石の壁）
    box('woodD',-13,.3,4,-12.2,1.3,12);box('woodL',-13.1,1.3,3.9,-12.1,1.4,12.1);
    wall('x',-17,Z0,Z1,.3,H,.3,'stone',[[9,11,.3,2.6]]);wall('z',Z0+.15,X0,-17,.3,H,.3,'stone');wall('z',Z1-.15,X0,-17,.3,H,.3,'stone');
    box('metal',-20.6,.3,3.4,-19,1.9,4.8);nb('dark',-20.4,.6,4.8,-19.2,1.6,4.85);nb('gold',-20.3,.7,4.7,-19.3,.9,4.75);   // 開いた金庫
    for(let k=0;k<6;k++){const x=srr(-21.3,-18),z=srr(5,16);nb('money',x,.3,z,x+.5,.3+srr(.1,.35),z+.3)}nb('gold',-20,.3,14,-18.6,.55,15.2);
    // 裏の壁の吹き飛んだ穴のまわりのがれき
    for(let k=0;k<8;k++){const z=srr(7.5,12),x=srr(-24,-22.4);nb('stone',x,0,z,x+.4,srr(.15,.4),z+.4)}
    tnt(-23.8,0,13.2);tnt(-24.8,0,13.6);SPAWNS.push([-11,.3,10,-Math.PI/2])}
  // ================= 給水塔（銀行の奥） =================
  {const cx=-15,cz=25,P=8;for(const [dx,dz] of[[-2,-2],[2,-2],[-2,2],[2,2]])box('woodD',cx+dx-.25,0,cz+dz-.25,cx+dx+.25,P,cz+dz+.25);
    for(const s of[-1,1]){rbox('woodD',cx,P*.35,cz+s*2,.15,5.4,.15,0,.62);rbox('woodD',cx,P*.35,cz+s*2,.15,5.4,.15,0,-.62);rbox('woodD',cx+s*2,P*.7,cz,.15,5.4,.15,Math.PI/2,.62);rbox('woodD',cx+s*2,P*.7,cz,.15,5.4,.15,Math.PI/2,-.62)}
    box('woodL',cx-3,P,cz-3,cx+3,P+.25,cz+3);const tk=new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.3,3.6,12),new THREE.MeshLambertMaterial({map:T.woodV}));tk.position.set(cx,P+2.05,cz);tk.castShadow=true;tk.receiveShadow=true;scene.add(tk);
    const rf=new THREE.Mesh(new THREE.ConeGeometry(2.6,1.4,12),new THREE.MeshLambertMaterial({map:T.roofG}));rf.position.set(cx,P+4.55,cz);rf.castShadow=true;scene.add(rf);
    SOL.push([cx-2.2,P+.25,cz-2.2,cx+2.2,P+3.85,cz+2.2]);for(let k=0;k<4;k++)nb('metal',cx-2.32,P+.6+k*.9,cz-2.32,cx+2.32,P+.7+k*.9,cz+2.32);
    // はしご（道の側の脚）
    const lx=cx+3.25;for(let y=.3;y<P;y+=.45)nb('woodL',lx-.06,y,cz-.5,lx+.06,y+.08,cz+.5);nb('woodD',lx-.06,0,cz-.6,lx+.06,P+1,cz-.5);nb('woodD',lx-.06,0,cz+.5,lx+.06,P+1,cz+.6);
    LAD.push([lx-.45,0,cz-.6,lx+.55,P+1.3,cz+.6,1,0]);SOL.push([lx-.08,0,cz-.6,lx+.08,P,cz+.6]);for(let x=cx-3;x<=cx+3;x+=.6){nb('woodV',x,P+.25,cz-3.05,x+.1,P+1.1,cz-2.95);nb('woodV',x,P+.25,cz+2.95,x+.1,P+1.1,cz+3.05)}}
  // ================= 荷馬車（爆薬つき、銀行の裏） =================
  {const x=-26.5,z=-4;box('woodL',x-1.2,.8,z-2.2,x+1.2,1.1,z+2.2);for(const s of[-1,1]){nb('woodD',x+s*1.15,1.1,z-2.2,x+s*1.25,1.6,z+2.2)}for(const [a,b] of[[-1.35,-1.3],[1.35,-1.3],[-1.35,1.3],[1.35,1.3]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.15,12),new THREE.MeshLambertMaterial({map:T.woodD}));w.rotation.z=Math.PI/2;w.position.set(x+a,.75,z+b);w.castShadow=true;scene.add(w)}
    SOL.push([x-1.4,0,z-2.2,x+1.4,1.6,z+2.2]);barrel(x-.5,z-1,1.1);barrel(x+.5,z-1,1.1);tnt(x,1.1,z+1)}
  // ================= 小物：樽・木箱・水おけ・草・タンブルウィード =================
  for(const [x,z] of[[5.2,-36],[5.3,-21],[-5.3,1],[-5.4,-12],[5,22],[-5.2,30],[24,-6],[-25,22],[-24,-28],[24,30]])barrel(x,z);
  for(const [x,z,y,s] of[[23.5,-24,0,1],[23.5,-22.8,0,1],[23.5,-23.4,1,1],[-24,-14,0,1.2],[24,-12,0,1],[-5,40,0,1],[5.2,-40,0,1],[-25,32,0,1.2]])crate(x,z,y,s);
  for(const [x,z] of[[5.6,-30.5],[-5.6,6]]){tnt(x,0,z)}
  for(const [x,z] of[[-5.6,-36],[5.6,-6]]){box('woodD',x-.4,0,z-1.2,x+.4,.7,z+1.2)}   // 水おけ
  for(let k=0;k<40;k++){const x=srr(-29,29),z=srr(-44,44);if(Math.abs(x)<6.5)continue;const s=srr(.5,.9);rbox('grass',x,s/2,z,s,s,.02,srr(0,3));rbox('grass',x,s/2,z,s,s,.02,srr(0,3)+1.57)}
  // ================= 外：砂漠・サボテン・岩山 =================
  sseed(303);for(let k=0;k<26;k++){const a=srnd()*TAU,R=srr(50,110),x=Math.cos(a)*R*1.1,z=Math.sin(a)*R*1.3;cactus(x,z,srr(2,4.5))}
  for(const [x,z] of[[-27,-42],[27,40],[-28,38],[28,-41],[27,12]])cactus(x,z,srr(1.6,2.6));
  for(let k=0;k<14;k++){const a=k/14*TAU+srr(-.2,.2),R=srr(140,220),cx=Math.cos(a)*R,cz=Math.sin(a)*R*1.2,w=srr(30,70),h=srr(20,55);
    for(let l=0;l<4;l++){const f=1-l*.22;box(l%2?'rockD':'rock',cx-w*f/2,l*h/4,cz-w*f*.4,cx+w*f/2,(l+1)*h/4,cz+w*f*.4,{solid:false})}}
  for(let k=0;k<12;k++){const a=srnd()*TAU,R=srr(55,95),cx=Math.cos(a)*R,cz=Math.sin(a)*R*1.25;box('sand',cx-srr(6,14),0,cz-srr(5,10),cx+srr(6,14),srr(1,3),cz+srr(5,10),{solid:false})}
  // タンブルウィード
  for(let k=0;k<2;k++){const g=new THREE.Group();for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.9),new THREE.MeshLambertMaterial({map:T.hay,transparent:true,opacity:.85}));m.rotation.set(i,i*2,i*3);m.scale.setScalar(.7+i*.05);g.add(m)}scene.add(g);TUMBLE.push({g,t:k*12,z:0})}
  SPAWNS.unshift([0,0,-38,Math.PI],[0,0,38,0]);
  buildMeshes();buildGrid()}
// ================= 当たり判定（格子で速く調べる） =================
const GRID=new Map(),GC=4;
function buildGrid(){GRID.clear();SOL.forEach((s,i)=>{for(let gx=Math.floor(s[0]/GC);gx<=Math.floor(s[3]/GC);gx++)for(let gz=Math.floor(s[2]/GC);gz<=Math.floor(s[5]/GC);gz++){const k=gx+','+gz;let a=GRID.get(k);if(!a)GRID.set(k,a=[]);a.push(i)}})}
function nearSol(x0,z0,x1,z1,fn){const seen=new Set();for(let gx=Math.floor(x0/GC);gx<=Math.floor(x1/GC);gx++)for(let gz=Math.floor(z0/GC);gz<=Math.floor(z1/GC);gz++){const a=GRID.get(gx+','+gz);if(!a)continue;for(const i of a){if(seen.has(i))continue;seen.add(i);const s=SOL[i];if(s.off)continue;if(fn(s)===false)return}}}
// 箱 [x0,y0,z0,x1,y1,z1] がどれかとぶつかるか
function hitsBox(x0,y0,z0,x1,y1,z1){let hit=null;nearSol(x0,z0,x1,z1,s=>{if(x1>s[0]&&x0<s[3]&&y1>s[1]&&y0<s[4]&&z1>s[2]&&z0<s[5]){hit=s;return false}});return hit}
// 足もと（x,z）で、高さ y から上れる（0.6まで）いちばん高い床
function groundAt(x,z,y,r){r=r||0;let best=-1e9;nearSol(x-r,z-r,x+r,z+r,s=>{if(x+r>s[0]&&x-r<s[3]&&z+r>s[2]&&z-r<s[5]&&s[4]<=y+.6&&s[4]>best)best=s[4]});return best<-1e8?0:Math.max(best,0)}
// 線分と箱：見えているか（ttt：見る人と見られる人の間に壁がないか）
function segFree(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az;let free=true;
  nearSol(Math.min(ax,bx),Math.min(az,bz),Math.max(ax,bx),Math.max(az,bz),s=>{let t0=0,t1=1;for(const [o,d,lo,hi] of[[ax,dx,s[0],s[3]],[ay,dy,s[1],s[4]],[az,dz,s[2],s[5]]]){if(Math.abs(d)<1e-9){if(o<lo||o>hi)return}else{let a=(lo-o)/d,b=(hi-o)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return}}if(t0<1&&t1>0){free=false;return false}});return free}
function rayDist(ax,ay,az,dx,dy,dz,max){let best=max;nearSol(Math.min(ax,ax+dx*max),Math.min(az,az+dz*max),Math.max(ax,ax+dx*max),Math.max(az,az+dz*max),s=>{let t0=0,t1=best;for(const [o,d,lo,hi] of[[ax,dx,s[0],s[3]],[ay,dy,s[1],s[4]],[az,dz,s[2],s[5]]]){if(Math.abs(d)<1e-9){if(o<lo||o>hi)return}else{let a=(lo-o)/d,b=(hi-o)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return}}if(t0<best)best=t0});return best}
function onLadder(x,y,z){for(const l of LAD)if(x>l[0]&&x<l[3]&&z>l[2]&&z<l[5]&&y>=l[1]-.1&&y<l[4])return l;return null}
// ================= CPUが歩くための道しるべ（歩いて行ける場所を広さ優先でさがす） =================
const NAV={nodes:[],key:new Map(),out:[],inn:[]};
function blockedAt(x,z,y){return !!hitsBox(x-.22,y+.58,z-.22,x+.22,y+1.7,z+.22)}
function buildNav(){const S=1,q=[];const add=(i,j,y)=>{const k=i+','+j+','+Math.round(y*4);let id=NAV.key.get(k);if(id!=null)return id;id=NAV.nodes.length;NAV.nodes.push({i,j,x:i*S,z:j*S,y});NAV.key.set(k,id);NAV.out.push([]);NAV.inn.push([]);q.push(id);return id};
  const start=add(0,-38,0);let qh=0;
  while(qh<q.length){const id=q[qh++],n=NAV.nodes[id];for(const [di,dj] of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=n.i+di,nj=n.j+dj,nx=ni*S,nz=nj*S;if(nx<MAP.x0+1||nx>MAP.x1-1||nz<MAP.z0+2||nz>MAP.z1-2)continue;
    // 途中（半分の所）の床も見る：階段の段（0.4m）を1段ずつ上がれるように
    const mx=(n.x+nx)/2,mz=(n.z+nz)/2,gm=groundAt(mx,mz,n.y,.15),ny=groundAt(nx,nz,Math.max(n.y,gm),.15);if(gm>n.y+.6||ny>Math.max(n.y,gm)+.6||blockedAt(nx,nz,ny)||blockedAt(mx,mz,Math.max(gm,Math.min(n.y,ny))))continue;const to=add(ni,nj,ny);if(!NAV.out[id].includes(to)){NAV.out[id].push(to);NAV.inn[to].push(id)}}}}
function nearestNode(x,y,z){let best=-1,bd=1e9;const i0=Math.round(x),j0=Math.round(z);for(let di=-2;di<=2;di++)for(let dj=-2;dj<=2;dj++)for(let yk=-12;yk<=12;yk++){const id=NAV.key.get((i0+di)+','+(j0+dj)+','+(Math.round(y*4)+yk));if(id==null)continue;const n=NAV.nodes[id],d=Math.hypot(n.x-x,n.z-z)+Math.abs(n.y-y)*2;if(d<bd){bd=d;best=id}}return best}
// 目的地への距離の表（逆向きにたどる）
function flowTo(target){const N=NAV.nodes.length,dist=new Int32Array(N).fill(-1);if(target<0)return dist;const q=new Int32Array(N);let h=0,e=0;q[e++]=target;dist[target]=0;while(h<e){const id=q[h++];for(const p of NAV.inn[id])if(dist[p]<0){dist[p]=dist[id]+1;q[e++]=p}}return dist}
