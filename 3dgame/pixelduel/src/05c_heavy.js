// ===================== ヘビー：飛んでいく弾・爆発・ロケットジャンプ・ポータル =====================
// 弾は目の高さから照準の方向へ飛ぶ（見た目だけ銃口から出て、すぐ照準の線に重なる）。
// 当たり判定は撃った側：CPU戦は自分の画面で全部、オンラインは自分の弾だけ（相手の弾は見た目だけ）。
const RJ_V=14,RJ_GRAV=.65,RJ_MAX=16,PROJ=[],PORTALS=[];let SHOTKEY=0;
// ---- 弾の形（+z が前） ----
function projMesh(kind,c){const g=new THREE.Group();
  if(kind==='rocket'){bx(g,.11,.11,.4,0,0,0,'#9aa0a6');bx(g,.08,.08,.1,0,0,.24,'#d82a2a');bx(g,.24,.02,.1,0,0,-.16,'#1a1a1a');bx(g,.02,.24,.1,0,0,-.16,'#1a1a1a');bx(g,.08,.08,.16,0,0,-.26,emat('#ffb030'));bx(g,.16,.16,.26,0,0,-.3,tmat('#ff7a10',.45))}
  else if(kind==='mini'){bx(g,.07,.07,.28,0,0,0,'#e8e8ec');bx(g,.05,.05,.07,0,0,.17,'#2ab0e0');bx(g,.05,.05,.12,0,0,-.19,emat('#a0f0ff'));bx(g,.11,.11,.2,0,0,-.22,tmat('#40c0ff',.45))}
  else if(kind==='missile'){bx(g,.09,.09,.52,0,0,0,'#eeeeee');for(const z of[-.12,.12])bx(g,.095,.095,.04,0,0,z,'#d02020');bx(g,.06,.06,.08,0,0,.3,'#d02020');bx(g,.07,.07,.2,0,0,-.34,emat('#ffd040'));bx(g,.15,.15,.32,0,0,-.4,tmat('#ff6a10',.45))}
  else if(kind==='tree'){const cn=new THREE.Mesh(new THREE.ConeGeometry(.17,.46,6),mat('#2a9a3a'));cn.rotation.x=Math.PI/2;g.add(cn);bx(g,.08,.08,.08,0,0,.26,emat('#ffe040'));bx(g,.07,.07,.08,0,0,-.27,'#6a4020');
    const L=['#ff3030','#ffd040','#40a0ff','#e040ff','#ffffff','#ff9a20'];for(let i=0;i<6;i++){const a=i*TAU/6,r=.1+(i%2)*.04;bx(g,.05,.05,.05,Math.cos(a)*r,Math.sin(a)*r,-.08+(i%3)*.08,emat(L[i]))}}
  else if(kind==='wave'){const t=new THREE.Mesh(new THREE.TorusGeometry(.55,.07,4,16,Math.PI),emat('#ff2020'));t.rotation.z=.5;g.add(t);const t2=new THREE.Mesh(new THREE.TorusGeometry(.55,.16,4,16,Math.PI),tmat('#ff3030',.35));t2.rotation.z=.5;g.add(t2)}
  else if(kind==='ice'){bx(g,.16,.16,.16,0,0,0,emat('#d0f8ff'));bx(g,.26,.26,.26,0,0,0,tmat('#60e0ff',.4));bx(g,.06,.06,.3,0,0,-.2,tmat('#a0f0ff',.5))}
  else if(kind==='terra'){bx(g,.12,.12,.12,0,0,0,emat('#a0ffc0'))}
  else if(kind==='nuke'){bx(g,.12,.12,.12,0,0,0,emat('#a0e0ff'));bx(g,.22,.22,.22,0,0,0,tmat('#3aa0ff',.4));bx(g,.08,.08,.3,0,0,-.2,tmat('#60c0ff',.35))}
  else if(kind==='orb'){const s=.6+.6*(c||0);g.add(new THREE.Mesh(new THREE.SphereGeometry(.15*s,10,8),emat('#b0ff80')));g.add(new THREE.Mesh(new THREE.SphereGeometry(.28*s,10,8),tmat('#40ff40',.35)))}
  else bx(g,.13,.13,.13,0,0,0,emat(pick(['#ff3030','#ffd040','#40a0ff','#ffffff','#30e060'])));
  return g}
const TRAIL={wave:'#ff4040',ice:'#c0f0ff',terra:'#ff90f0',nuke:'#80c8ff',rocket:'#b4b4b4',missile:'#c8c8c8',mini:'#c8f0ff',tree:'#ffe080',orb:'#80ff80',bomb:'#ffd040'};
function projReset(){for(const p of PROJ)dropMesh(p.m);PROJ.length=0;for(const q of PORTALS.slice())removePortal(q)}
function dropMesh(m){scene.remove(m);m.traverse(o=>{if(o.isMesh)o.geometry.dispose()})}
// o: {w, owner, x,y,z, d:[向き], off:[見た目のずれ], key, dmg, rad, c, remote, kind, sp, grav, life}
function spawnProj(o){const W=WEAPONS[o.w],kind=o.kind||W.proj,sp=o.sp||W.speed,m=projMesh(kind,o.c);scene.add(m);
  const p=Object.assign({kind,t:0,life:o.life||4,grav:o.grav||0,off:[0,0,0],trT:0,m},o,{vx:o.d[0]*sp,vy:o.d[1]*sp,vz:o.d[2]*sp});PROJ.push(p);if(PROJ.length>40){dropMesh(PROJ[0].m);PROJ.shift()}placeProj(p);return p}
function placeProj(p){const e=Math.exp(-p.t*9),x=p.x+p.off[0]*e,y=p.y+p.off[1]*e,z=p.z+p.off[2]*e;p.m.position.set(x,y,z);
  if(p.kind==='bomb'||p.kind==='orb')p.m.rotation.y+=.2;else p.m.lookAt(x+p.vx,y+p.vy,z+p.vz)}
function projUpdate(dt){for(let i=PROJ.length-1;i>=0;i--){const p=PROJ[i];p.t+=dt;if(p.grav)p.vy-=p.grav*dt;
  const sp=Math.hypot(p.vx,p.vy,p.vz)||1e-3,d=[p.vx/sp,p.vy/sp,p.vz/sp],len=sp*dt;let hitT=len,direct=null;
  const wr=rayWorld(p.x,p.y,p.z,d,len);if(wr.t<hitT)hitT=wr.t;
  if(p.kind==='wave'){if(waveStep(p,d,len,wr.t)){PROJ.splice(i,1);dropMesh(p.m);continue}}   // 赤い波（つきぬける）
  else{if(p.kind!=='bomb')for(const V of ALL()){if(V===p.owner||!V.alive||!live(V))continue;const r=.12,t=rayBox(p.x,p.y,p.z,d,[V.x-PR-r,V.y,V.z-PR-r,V.x+PR+r,V.y+PH+.1,V.z+PR+r]);if(t!=null&&t<hitT){hitT=t;direct=V}}
  if(hitT<len||p.t>=p.life){const h=Math.max(0,Math.min(hitT,len)-.05);PROJ.splice(i,1);dropMesh(p.m);blast(p,p.x+d[0]*h,p.y+d[1]*h,p.z+d[2]*h,direct,d);continue}}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;placeProj(p);
  p.trT-=dt;if(p.trT<=0){p.trT=.03;const q=p.m.position;fx(q.x-d[0]*.3,q.y-d[1]*.3,q.z-d[2]*.3,TRAIL[p.kind]||'#c0c0c0',1,.25,p.kind==='bomb'?.25:.55,p.kind==='mini'?.08:.13,-.6)}}}
// 爆発：見た目と音・TNT・ダメージ（自分の弾だけ）・ロケットジャンプ・ポータル
function blast(p,x,y,z,direct,d){const W=WEAPONS[p.w],R=p.rad,dist=Math.hypot(ME.x-x,ME.y-y,ME.z-z);
  boomFx(x,y,z,R/4.8,p.kind==='orb'?'green':p.kind==='bomb'?'party':p.kind==='nuke'?'blue':p.kind==='ice'?'ice':p.kind==='terra'?'terra':'fire');SFX.blast(R/3,dist);G.shake=Math.max(G.shake,Math.max(0,.4*R/3-dist*.03));
  if(p.kind==='tree')for(let i=0;i<(W.cluster||5);i++){const a=i*TAU/(W.cluster||5)+rr(-.3,.3),s=rr(4,6.5);
    spawnProj({w:p.w,owner:p.owner,x,y:y+.3,z,d:[Math.cos(a)*.75,.65,Math.sin(a)*.75],sp:s,kind:'bomb',grav:14,life:rr(.35,.6),key:p.key,dmg:W.dmg*.08,rad:1.8,remote:p.remote})}
  if(p.remote)return;
  if(p.kind==='orb'&&p.c>=.999)makePortal(p.owner,x,y,z,d);
  for(const t of TNTS){if(!t.alive||t.fuse>0)continue;if(Math.hypot(t.x-x,t.y+.45-y,t.z-z)<R+.4){tntLight(t,p.owner);t.fuse=Math.min(t.fuse,.15);if(p.owner===ME&&G.mode==='online')NET.pushEx(t.id)}}
  const ox=x-d[0]*.15,oy=y-d[1]*.15,oz=z-d[2]*.15;
  for(const V of ALL()){if(!V.alive||!live(V))continue;
    const cx=clamp(x,V.x-PR,V.x+PR),cy=clamp(y,V.y,V.y+PH),cz=clamp(z,V.z-PR,V.z+PR),dd=V===direct?0:Math.hypot(cx-x,cy-y,cz-z);if(dd>R)continue;
    if(V!==direct&&!segFree(ox,oy,oz,V.x,V.y+1,V.z)&&!segFree(ox,oy,oz,cx,cy,cz))continue;   // 壁の向こうには届かない
    const k=1-dd/R,ux=V.x-x,uy=V.y+.9-y,uz=V.z-z,ul=Math.hypot(ux,uy,uz)||1;
    if(V===p.owner){if(p.kind==='bomb')continue;if(W.self>0)applyDamage(V,p.dmg*W.self*(.4+.6*k),V,p.key);if(W.rj>0)rocketPush(V,ux/ul,uy/ul,uz/ul,k,W.rj,p.key);continue}
    const dmg=p.dmg*(V===direct?1:.35+.65*k),kb=[ux/ul*(2.5+4*k),1.5+4.5*k,uz/ul*(2.5+4*k)];
    if(p.owner===ME){crossHit(false);SFX.hitmark(false)}
    if(G.mode==='online'&&p.owner===ME&&V!==ME){NET.pushHit(V,dmg,false,p.w,kb,p.key);hitFx(V,p.w,false)}else{applyHit(V,dmg,false,p.w,p.owner,p.key);knock(V,kb)}}}
function knock(V,kb){if(!V.alive)return;V.vx=kb[0];V.vz=kb[2];V.vy=Math.max(V.vy,kb[1]);V.onG=false;V.kbT=Math.max(V.kbT||0,.45)}
// ロケットジャンプ：爆発から遠ざかる向きに飛ばす（下で爆発すれば上へ）。同じ弾の爆発（4発同時など）は重ねない
function rocketPush(F,ux,uy,uz,k,rj,key){const m=RJ_V*rj*(.55+.45*k);
  if(F.rjK===key){if(uy>0)F.vy=Math.min(RJ_MAX,Math.max(F.vy,uy*m));return}F.rjK=key;
  F.vx=F.vx*.8+ux*m*.95;F.vz=F.vz*.8+uz*m*.95;F.vy=Math.min(RJ_MAX,uy>0?Math.max(F.vy,0)+uy*m:F.vy+uy*m*.5);   // 走っていた勢いも残す
  F.onG=false;F.rj=true;F.kbT=.8;F.jumps=Math.min(F.jumps||1,1)}
// ---- 撃つ ----
function podPos(F,i){const f=aimDir(F.yaw,F.pitch),r=[Math.cos(F.yaw),0,-Math.sin(F.yaw)],s=i%2?1:-1,up=i<2?.12:-.02,a=F===ME?.55:.38,b=F===ME?.12+up:up,c=F===ME?.6:.3;
  return new THREE.Vector3(F.x+r[0]*a*s+f[0]*c,F.y+EYE+b+f[1]*c,F.z+r[2]*a*s+f[2]*c)}
function fireHeavy(F,err,c){const W=WEAPONS[F.w];if(!F.alive||G.phase!=='play'||F.atkCD>0||F.relT>0||F.swT>0||!isHeavy(F.w))return false;
  c=W.charge?clamp(c||0,0,1):0;const cost=W.charge?Math.round(6+14*c):1;
  if(F.mag<cost){if(F===ME){SFX.empty();F.atkCD=.3}startReload(F);return false}
  F.mag-=cost;F.atkCD=W.rate;F.shotT=0;F.atkT=0;F.seq++;const key=++SHOTKEY;let yaw=F.yaw,pitch=F.pitch;if(err){yaw+=gauss()*err;pitch+=gauss()*err*.7}
  const n=W.multi||1,ex=F.x,ey=F.y+EYE,ez=F.z,cm=W.charge?.25+.75*c:1;
  for(let i=0;i<n;i++){const s=n>1?.022:0,d=aimDir(yaw+rr(-s,s),pitch+rr(-s,s)*.7),mz=n>1?podPos(F,i):muzzleOf(F);
    spawnProj({w:F.w,owner:F,x:ex,y:ey,z:ez,d,off:[mz.x-ex,mz.y-ey,mz.z-ez],key,dmg:W.dmg/n*cm*(W.cluster?.6:1),rad:W.rad*(W.charge?.5+.5*c:1),c});
    if(F===ME&&G.mode==='online')NET.pushProj(F.w,ex,ey,ez,d,c)}
  SFX.launch(F.w,F===ME?null:Math.hypot(F.x-ME.x,F.z-ME.z));if(F===ME)G.shake=Math.max(G.shake,.12);
  const low=W.charge?6:1;if(F.mag<low)setTimeout(()=>{if(F.alive&&isHeavy(F.w)&&F.mag<low)startReload(F)},450);return true}
// 自分の攻撃ボタン：接近武器はふる、銃は撃つ、ポータルキャノンはおしている間ためて、はなすと撃つ
function gunInput(F,atk,dt){const W=WEAPONS[F.w];
  if(W.charge){const ready=F.alive&&G.phase==='play'&&F.atkCD<=0&&F.relT<=0&&F.swT<=0;
    if(atk&&ready){if(F.mag<6){if(F.chg<=0){startReload(F);if(F===ME&&F.atkCD<=0){SFX.empty();F.atkCD=.3}}return}if(F.chg<=0&&F===ME)SFX.charge(true,W.charge);F.chg=Math.min(1,F.chg+dt/W.charge)}
    else if(F.chg>0){const c=F.chg;F.chg=0;if(F===ME)SFX.charge(false);fireHeavy(F,0,c)}return}
  if(!atk)return;if(isSniper(F.w))fireSniper(F);else if(isHeavy(F.w))fireHeavy(F,0);else if(isPrimary(F.w))firePrimary(F);else if(isBackup(F.w))fireBackup(F);else if(isSpecial(F.w))fireSpecial(F);else startSwing(F)}
// ---- ポータル（ポータルキャノンをためきって撃つと、当たった所にできる。2つで行き来、25秒で消える） ----
function portalMesh(opp){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.TorusGeometry(.62,.09,8,28),emat(opp?'#ff8a30':'#40ff70')));
  const ad=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  g.add(new THREE.Mesh(new THREE.CircleGeometry(.56,28),ad(opp?0xff6a20:0x30ff90)));const sw=new THREE.Mesh(new THREE.RingGeometry(.15,.5,16,1,0,Math.PI*1.3),ad(0xffffff));g.add(sw);g.userData.sw=sw;g.scale.set(1,1.45,1);return g}
function addPortal(F,x,y,z,fx_,fz_,remote){const m=portalMesh(F!==ME);m.position.set(x,y+1.05,z);m.rotation.y=Math.atan2(fx_,fz_);scene.add(m);const q={owner:F,x,y,z,fx:fx_,fz:fz_,m,life:25,remote:!!remote};PORTALS.push(q);return q}
function removePortal(q){const i=PORTALS.indexOf(q);if(i>=0)PORTALS.splice(i,1);scene.remove(q.m);q.m.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.blending===THREE.AdditiveBlending)o.material.dispose()}})}
function clearPortals(F){for(const q of PORTALS.slice())if(q.owner===F)removePortal(q)}
function makePortal(F,x,y,z,d){const fl=Math.hypot(d[0],d[2])||1,fx_=-d[0]/fl,fz_=-d[2]/fl;let px=x+fx_*.6,pz=z+fz_*.6,gy=groundAt(px,pz,y+.3,.25);
  for(let i=0;i<10&&hitsBox(px-.3,gy+.1,pz-.3,px+.3,gy+1.8,pz+.3);i++){px+=fx_*.3;pz+=fz_*.3;gy=groundAt(px,pz,y+.3,.25)}
  const mine=PORTALS.filter(q=>q.owner===F&&!q.remote);if(mine.length>=2)removePortal(mine[0]);
  addPortal(F,px,gy,pz,fx_,fz_);SFX.portal(Math.hypot(ME.x-px,ME.z-pz));fx(px,gy+1,pz,'#80ff90',14,2.5,.6,.1,0);
  if(F===ME&&G.mode==='online')sendNow()}
function portalUpdate(dt){for(const q of PORTALS.slice()){q.m.userData.sw.rotation.z-=dt*4;if(!q.remote){q.life-=dt;if(q.life<=0)removePortal(q)}}
  for(const F of G.mode==='bot'?ALL():[ME]){if(F.tpCD>0)F.tpCD-=dt;if(!F.alive||F.tpCD>0)continue;const mine=PORTALS.filter(q=>q.owner===F&&!q.remote);if(mine.length<2)continue;
    for(const [A,B] of[[mine[0],mine[1]],[mine[1],mine[0]]]){if(Math.hypot(F.x-A.x,F.z-A.z)>.75||F.y<A.y-.6||F.y>A.y+1.6)continue;
      let tx=B.x+B.fx*.9,tz=B.z+B.fz*.9,ty=groundAt(tx,tz,B.y+.5,PR);if(hitsBox(tx-PR,ty+.05,tz-PR,tx+PR,ty+PH,tz+PR)){tx=B.x;tz=B.z;ty=B.y}
      fx(F.x,F.y+1,F.z,'#80ff90',12,2,.5,.1,0);F.x=tx;F.z=tz;F.y=ty;F.vy=0;F.tpCD=1.2;F.camY=F.y;fx(tx,ty+1,tz,'#80ff90',12,2,.5,.1,0);
      if(F===ME){SFX.teleport();if(G.mode==='online')sendNow()}break}}}
// ---- オンライン：自分の弾とポータルを presence にのせる・相手のものを見た目だけ出す ----
const myPortals=()=>PORTALS.filter(q=>q.owner===ME&&!q.remote).map(q=>[+q.x.toFixed(2),+q.y.toFixed(2),+q.z.toFixed(2),+q.fx.toFixed(2),+q.fz.toFixed(2)]);
function spawnRemoteProj(F,e){const w=WIDS[e[1]];if(!WEAPONS[w]||!WEAPONS[w].proj||!F.alive)return;const W=WEAPONS[w],l=Math.hypot(e[5],e[6],e[7])||1,d=[e[5]/l,e[6]/l,e[7]/l],c=clamp(e[8]/100,0,1);
  const mz=W.multi?podPos(F,(e[0]%4+4)%4):muzzleOf(F);spawnProj({w,owner:F,x:e[2],y:e[3],z:e[4],d,off:[mz.x-e[2],mz.y-e[3],mz.z-e[4]],key:0,dmg:0,rad:W.rad*(W.charge?.5+.5*c:1),c,remote:true});
  if(isBackup(w)||isSpecial(w))SFX.pshot(w,Math.hypot(F.x-ME.x,F.z-ME.z));else if(!W.multi||e[0]%4===0)SFX.launch(w,Math.hypot(F.x-ME.x,F.z-ME.z))}
// 相手ひとりずつのポータル（F.rpk に前の形をおぼえて、変わったときだけ作りなおす）
function syncRemotePortals(F,list){const ok=Array.isArray(list)?list.filter(a=>Array.isArray(a)&&a.length===5&&a.every(Number.isFinite)).slice(0,2):[];const k=JSON.stringify(ok);if(k===F.rpk)return;F.rpk=k;
  for(const q of PORTALS.slice())if(q.remote&&q.owner===F)removePortal(q);for(const a of ok)addPortal(F,a[0],a[1],a[2],a[3],a[4],true)}
