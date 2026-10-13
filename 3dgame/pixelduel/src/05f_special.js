// ===================== 特殊：撃つ（赤い波・はね返るレーザー・吹き矢・氷の弾・石の爆発）・回復 =====================
// 弾の数だけ撃てるもの（single）はリロードしない。毒矢は押してから0.2秒後に矢が出る。
// 赤い波（大鎌）とテラモーフ・ネックレスの弾はヘビーと同じ「飛んでいく弾」のしくみ（オンラインでも見た目が出る）。
function fireSpecial(F,err){const W=WEAPONS[F.w];if(!F.alive||G.phase!=='play'||F.atkCD>0||F.relT>0||F.swT>0||!isSpecial(F.w)||F.preT>0)return false;
  if(F.mag<=0){if(F===ME&&F.atkCD<=0){SFX.empty();F.atkCD=.4;if(W.single)tip(W.jp+'の弾がもうありません（たおれて復活するともどります）',2)}if(!W.single)startReload(F);return false}
  F.atkCD=W.rate;if(W.pre){F.preT=W.pre;F.preErr=err||0;F.preW=F.w;if(F===ME)SFX.blow();return true}return shotSpecial(F,err)}
function shotSpecial(F,err){const W=WEAPONS[F.w];F.mag--;F.shotT=0;F.atkT=0;F.seq++;let yaw=F.yaw,pitch=F.pitch;if(err){yaw+=gauss()*err;pitch+=gauss()*err*.7}
  const sp=W.hip||0;yaw+=rr(-sp,sp);pitch+=rr(-sp,sp)*.6;const ex=F.x,ey=F.y+EYE,ez=F.z,d=aimDir(yaw,pitch),mz=muzzleOf(F);
  if(W.proj){spawnProj({w:F.w,owner:F,x:ex,y:ey,z:ez,d,off:[mz.x-ex,mz.y-ey,mz.z-ez],key:++SHOTKEY,dmg:W.dmg,rad:W.rad||0,c:0,life:W.life||4,hit:W.wave?new Set():null});if(F===ME&&G.mode==='online')NET.pushProj(F.w,ex,ey,ez,d,0)}
  else{const segs=[];traceShot(F,ex,ey,ez,d,W,W.range,W.bounce||0,segs,new Set());if(segs.length){segs[0][0]=mz.x;segs[0][1]=mz.y;segs[0][2]=mz.z}
    drawPrimShot(F.w,segs,false);if(F===ME&&G.mode==='online'&&segs.length)NET.pushShot(F.w,[segs[0]])}
  if(F===ME){SFX.pshot(F.w);G.shake=Math.max(G.shake,W.dmg>80?.15:.07)}else SFX.pshot(F.w,Math.hypot(F.x-ME.x,F.z-ME.z));
  if(F.mag<=0&&!W.single)setTimeout(()=>{if(F.mag<=0&&F.alive&&isSpecial(F.w))startReload(F)},380);return true}
// 毎コマ：毒矢の「ためてから出る」・テラモーフを持っている間の回復
function specialUpdate(F,dt){if(F.preT>0){F.preT-=dt;if(F.preT<=0){F.preT=0;if(F.alive&&F.w===F.preW&&G.phase==='play'&&F.mag>0)shotSpecial(F,F.preErr)}}
  const W=WEAPONS[F.w];if(W&&W.heal&&F.alive&&F.hp<HP_MAX&&(F===ME||G.mode!=='online')){F.hp=Math.min(HP_MAX,F.hp+W.heal*dt);if(Math.random()<dt*3)fx(F.x+rr(-.3,.3),F.y+rr(.4,1.5),F.z+rr(-.3,.3),pick(['#60ff90','#ff80f0']),1,.4,.6,.07,-1.5)}}
// 赤い波：相手をつきぬけて、1人に1回ずつ当たる（自分の弾だけダメージ）。壁で消える。当てた分の一部だけ自分が回復
function waveStep(p,d,len,wallT){const W=WEAPONS[p.w];if(!p.hit)p.hit=new Set();
  for(const V of ALL()){if(V===p.owner||!V.alive||!live(V)||p.hit.has(V))continue;const r=.3,t=rayBox(p.x,p.y,p.z,d,[V.x-PR-r,V.y-.1,V.z-PR-r,V.x+PR+r,V.y+PH+.2,V.z+PR+r]);if(t==null||t>Math.min(len,wallT))continue;
    p.hit.add(V);fx(V.x,V.y+1,V.z,'#ff3030',8,2.5,.4,.08,0);if(p.remote)continue;const F=p.owner,dmg=p.dmg;
    if(F===ME){crossHit(false);SFX.hitmark(false);if(G.mode==='online'){NET.pushHit(V,dmg,false,p.w);hitFx(V,p.w,false)}else applyHit(V,dmg,false,p.w,F)}else applyHit(V,dmg,false,p.w,F);
    if(W.steal&&F.alive&&!(V.inv>0)){F.hp=Math.min(HP_MAX,F.hp+dmg*W.steal);fx(F.x,F.y+1.2,F.z,'#ff6060',5,1,.5,.07,-2)}}
  if(wallT<len||p.t>=p.life){const h=Math.min(wallT,len);fx(p.x+d[0]*h,p.y+d[1]*h,p.z+d[2]*h,'#ff2a2a',10,2.2,.4,.09,2);return true}return false}
