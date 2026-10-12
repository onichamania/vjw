// ===================== プライマリ：撃つ（散弾・連射）・弾の光・音 =====================
// 連射の銃は押している間ずっと撃つ（gunInput が毎コマ呼ぶ）。散弾は粒ごとに当たりを調べて、同じ相手の分をまとめて1回の攻撃にする。
// 遠いほど弱い（W.fall）。壁抜け（究極点）は壁の向こうの相手には半分。
function fallK(W,d){const f=W.fall;if(!f||d<=f[0])return 1;return Math.max(f[2],1-(1-f[2])*(d-f[0])/(f[1]-f[0]))}
function firePrimary(F,err){const W=WEAPONS[F.w];if(!F.alive||G.phase!=='play'||F.atkCD>0||F.relT>0||F.swT>0||!isPrimary(F.w))return false;
  if(F.mag<=0){if(F===ME&&F.atkCD<=0){SFX.empty();F.atkCD=.3}startReload(F);return false}
  F.mag--;F.atkCD=W.rate;F.shotT=0;F.atkT=0;F.seq++;let yaw=F.yaw,pitch=F.pitch;if(err){yaw+=gauss()*err;pitch+=gauss()*err*.7}
  const ex=F.x,ey=F.y+EYE,ez=F.z,segs=[];
  if(W.pellets){const acc=new Map();for(let i=0;i<W.pellets;i++){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*W.spread;pellet(F,ex,ey,ez,aimDir(yaw+Math.cos(a)*r,pitch+Math.sin(a)*r*.8),W,acc,segs)}
    for(const [V,h] of acc)deliverShot(F,V,h.dmg,h.head,F.w)}
  else{const sp=F.scoped?W.ads:W.hip;traceShot(F,ex,ey,ez,aimDir(yaw+rr(-sp,sp),pitch+rr(-sp,sp)*.6),W,W.range,0,segs,new Set())}
  const mz=muzzleOf(F);for(const s of segs){s[0]=mz.x;s[1]=mz.y;s[2]=mz.z}
  drawPrimShot(F.w,segs,F===ME&&F.scoped);
  if(F===ME){SFX.pshot(F.w);G.shake=Math.max(G.shake,W.auto?.03:W.cap===1?.16:.1);if(W.auto)ME.pitch=Math.min(1.45,ME.pitch+(F.scoped?.0015:.003));if(G.mode==='online'&&segs.length)NET.pushShot(F.w,[segs[0]])}
  else SFX.pshot(F.w,Math.hypot(F.x-ME.x,F.z-ME.z));
  if(F.mag<=0)setTimeout(()=>{if(F.mag<=0&&F.alive&&isPrimary(F.w))startReload(F)},W.cap===1?250:350);return true}
// 散弾の1粒：当たった相手（acc にたす）・TNT・壁のつぶ
function pellet(F,ox,oy,oz,d,W,acc,segs){const max=W.range,wall=rayWorld(ox,oy,oz,d,max),stop=W.wallbreak?max:wall.t,hs=[];
  for(const V of enemiesOf(F)){const th=raySphere(ox,oy,oz,d,V.x,V.y+1.62,V.z,.27),tb=rayBox(ox,oy,oz,d,[V.x-.34,V.y,V.z-.34,V.x+.34,V.y+1.42,V.z+.34]);
    let t=null,head=false;if(th!=null&&(tb==null||th<=tb+.2)){t=th;head=true}else if(tb!=null)t=tb;if(t!=null&&t<stop)hs.push({V,t,head})}
  hs.sort((a,b)=>a.t-b.t);const use=W.pierce?hs:hs.slice(0,1);
  for(const q of use){const thru=W.wallbreak&&q.t>wall.t+.05,a=acc.get(q.V)||{dmg:0,head:false};a.dmg+=W.dmg/W.pellets*(q.head?W.head:1)*(thru?.5:1)*fallK(W,q.t);a.head=a.head||q.head;acc.set(q.V,a)}
  const blocked=use.length&&!W.pierce,end=blocked?use[0].t:wall.t;segs.push([ox,oy,oz,ox+d[0]*end,oy+d[1]*end,oz+d[2]*end]);
  if(blocked||wall.t>=max)return;const px=ox+d[0]*wall.t,py=oy+d[1]*wall.t,pz=oz+d[2]*wall.t;
  if(wall.s){const t=TNTS.find(q=>q.s===wall.s);if(t&&t.alive&&t.fuse<=0){tntLight(t,F);t.fuse=Math.min(t.fuse,.12);if(F===ME&&G.mode==='online')NET.pushEx(t.id)}}
  if(wall.n&&Math.random()<.45)fx(px+wall.n[0]*.05,py+wall.n[1]*.05,pz+wall.n[2]*.05,W.beam||'#d8c8a0',3,1.3,.3,.06,6)}
// 弾の光：連射は細く短く、レーザー（パルセーター）・プラズマ（バイキング）・水色の散弾（究極点）は光る。銃口の光も
const PSHOT={gfriend:[.022,'#fff2a0',.07,0],pulsator:[.045,'#60ffd0',.12,.13],ultimatum:[.05,'#60e8ff',.2,.15],viking:[.04,'#c070ff',.18,.12],acid:[.022,'#d8ffa0',.09,0]};
function drawPrimShot(w,segs,scoped){const P=PSHOT[w]||PSHOT.gfriend;
  for(const g of segs){const a=new THREE.Vector3(g[0],g[1],g[2]),b=new THREE.Vector3(g[3],g[4],g[5]),len=a.distanceTo(b);if(len<.05)continue;
    for(const [th,o] of P[3]?[[P[0],.95],[P[3],.3]]:[[P[0],.85]]){const m=new THREE.Mesh(SGEO,new THREE.MeshBasicMaterial({color:P[1],transparent:true,opacity:o,depthWrite:false,blending:THREE.AdditiveBlending}));
      m.position.copy(a).lerp(b,.5);m.lookAt(b);m.scale.set(th,th,len);scene.add(m);SHOTS.push({m,t:0,life:P[2],o})}
    if(w==='viking'&&Math.random()<.5){const p=a.clone().lerp(b,Math.random()*.5);fx(p.x,p.y,p.z,pick(['#9a60d0','#6a4a8a']),1,.4,.6,.1,-.5)}}
  if(segs.length&&!scoped){const s=segs[0],c=w==='acid'?'#a0ff60':w==='gfriend'?'#ffd040':P[1];fx(s[0],s[1],s[2],c,w==='gfriend'||w==='pulsator'?2:5,1.2,.1,.07,0);
    if(w==='viking'||w==='ultimatum')fx(s[0],s[1],s[2],w==='viking'?'#8a5ab0':'#5ab8d8',4,.5,.7,.12,-1)}}   // 撃ったあとのけむり（バイキングは紫）
// オンライン：相手のプライマリの弾（最後の1発の行き先と、何発撃ったか）を見た目と音だけ出す
function remotePrimShot(F,w,end,n){const W=WEAPONS[w],m=muzzleOf(F);for(let k=0;k<n;k++)setTimeout(()=>{if(!F.alive)return;const dist=Math.hypot(F.x-ME.x,F.z-ME.z),segs=[];
    if(W.pellets){const dx=end[0]-m.x,dy=end[1]-m.y,dz=end[2]-m.z,L=Math.hypot(dx,dy,dz)||1,yaw=Math.atan2(-dx,-dz),pitch=Math.asin(clamp(dy/L,-1,1));
      for(let i=0;i<W.pellets;i++){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*W.spread,d=aimDir(yaw+Math.cos(a)*r,pitch+Math.sin(a)*r*.8),t=W.wallbreak?L:Math.min(L,rayWorld(m.x,m.y,m.z,d,L+2).t);segs.push([m.x,m.y,m.z,m.x+d[0]*t,m.y+d[1]*t,m.z+d[2]*t])}}
    else segs.push([m.x,m.y,m.z,end[0],end[1],end[2]]);drawPrimShot(w,segs,false);SFX.pshot(w,dist)},k*W.rate*1000)}
