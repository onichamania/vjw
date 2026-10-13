// ===================== バックアップ：撃つ（単発・5発の連射・はね返るレーザー・青いガスの爆発） =====================
// チャンピオン傭兵は1回押すと5発（0.0875秒ごと）、そのあと少し待つ。押しっぱなしなら続けて撃つ。
// ニュークリアレボルバーはとても速い弾（ヘビーと同じしくみ）で、当たった所が爆発する（自分はダメージなしでロケットジャンプ）。
function fireBackup(F,err){const W=WEAPONS[F.w];if(!F.alive||G.phase!=='play'||F.atkCD>0||F.relT>0||F.swT>0||!isBackup(F.w)||F.burstN>0)return false;
  if(F.mag<=0){if(F===ME&&F.atkCD<=0){SFX.empty();F.atkCD=.3}startReload(F);return false}
  if(W.burst){F.burstN=W.burst;F.burstT=0;F.burstErr=err||0;F.atkCD=W.burst*W.rate+W.cool;burstUpdate(F,0);return true}
  F.atkCD=W.rate;return shotBackup(F,err)}
function burstUpdate(F,dt){if(!(F.burstN>0))return;if(!F.alive||!isBackup(F.w)||F.relT>0||G.phase!=='play'){F.burstN=0;return}F.burstT-=dt;
  while(F.burstN>0&&F.burstT<=0){if(F.mag<=0){F.burstN=0;startReload(F);break}shotBackup(F,F.burstErr);F.burstN--;F.burstT+=WEAPONS[F.w].rate}
  if(F.burstN<=0&&F.mag<=0&&F.alive&&F.relT<=0)startReload(F)}
// 1発
function shotBackup(F,err){const W=WEAPONS[F.w];F.mag--;F.shotT=0;F.atkT=0;F.seq++;let yaw=F.yaw,pitch=F.pitch;if(err){yaw+=gauss()*err;pitch+=gauss()*err*.7}
  const sp=F.scoped?0:(W.hip||0);yaw+=rr(-sp,sp);pitch+=rr(-sp,sp)*.6;const ex=F.x,ey=F.y+EYE,ez=F.z,d=aimDir(yaw,pitch),mz=muzzleOf(F);
  if(W.proj){spawnProj({w:F.w,owner:F,x:ex,y:ey,z:ez,d,off:[mz.x-ex,mz.y-ey,mz.z-ez],key:++SHOTKEY,dmg:W.dmg,rad:W.rad,c:0});if(F===ME&&G.mode==='online')NET.pushProj(F.w,ex,ey,ez,d,0);fx(mz.x,mz.y,mz.z,'#60c0ff',4,1,.15,.08,0)}
  else{const segs=[];traceShot(F,ex,ey,ez,d,W,W.range,W.bounce||0,segs,new Set());if(segs.length){segs[0][0]=mz.x;segs[0][1]=mz.y;segs[0][2]=mz.z}
    drawPrimShot(F.w,segs,F===ME&&F.scoped);if(F===ME&&G.mode==='online'&&segs.length)NET.pushShot(F.w,[segs[0]])}
  if(F===ME){SFX.pshot(F.w);G.shake=Math.max(G.shake,W.burst?.03:W.dmg>60?.12:.07)}else SFX.pshot(F.w,Math.hypot(F.x-ME.x,F.z-ME.z));
  if(F.mag<=0&&!W.burst)setTimeout(()=>{if(F.mag<=0&&F.alive&&isBackup(F.w))startReload(F)},380);return true}
// 撃つ（プライマリかバックアップか）：CPU も使う
function fireGun2(F,err){return isBackup(F.w)?fireBackup(F,err):firePrimary(F,err)}
