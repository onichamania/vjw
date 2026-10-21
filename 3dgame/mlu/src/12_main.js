// ================= はじまり・毎コマ =================
let GAME_READY=false;
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?55:42;camera.updateProjectionMatrix()}
addEventListener('resize',resize);
function init(){resize();
  // セーブの星を作ってあてはめる（はじめてならガイア）
  applySave(loadSave());GAME_READY=true;toTitle();requestAnimationFrame(frame);
  // 少しずつ自動セーブ
  setInterval(()=>{if(STATE==='play')saveGame()},20000);addEventListener('pagehide',saveGame)}
let last=performance.now(),ghostT=0;
// 1コマぶんの動き（絵をかく前まで）
function tick(dt,rdt){WAVE.value+=dt;ghostT+=dt;
  if(STATE==='play'){autoTick(dt);updatePlayer(dt);payTick(dt);updateBuildings(dt,rdt);dwellStep(dt);updateGuide(dt);W.play=(W.play||0)+rdt;if(saveT>0){saveT-=dt;if(saveT<=0){saveT=0;saveGame()}}}
  else{if(GUIDE)GUIDE.visible=false}
  if(STATE==='title'){CAM.mapQ.premultiply(_q1.setFromAxisAngle(_t1.set(0,1,0).applyQuaternion(CAM.mapQ),dt*.08));CAM.mapDist=lerp(CAM.mapDist,innerWidth<innerHeight?95:72,dt*2)}
  updateNodes(dt);if(STATE==='play')updateEnemies(dt);updatePieces(dt);updateSparks(dt);updateRising(dt)}
function frame(t){requestAnimationFrame(frame);let dt=(t-last)/1000;last=t;if(!(dt>0))dt=1/60;const rdt=Math.min(dt,10);dt=Math.min(dt,.05);
  tick(dt,rdt);
  ghostMat.opacity=.22+Math.sin(ghostT*3)*.1;ghostLine.opacity=.7+Math.sin(ghostT*3)*.25;
  updateCamera(dt);drawPlayer(dt);NET.tick(dt);
  renderer.render(scene,camera);
  if(STATE==='play'){if(HUD_DIRTY){drawRes();HUD_DIRTY=false}drawTop();drawPriceTags();drawWorldTags();drawPadUI();drawAutoBar();updateFloats(dt)}
  else{for(const n in PTAGS)PTAGS[n].style.display='none'}}
init();
// テスト用
window.__L={THREE,makeEnemy,makeNpc,cageMesh,get WG(){return WG},camera,step(n,dt){for(let i=0;i<n;i++)tick(dt||.05,dt||.05)},travelTo,buildWorld,applyWorld,worldPart,upgradeSave,validSave,WDEF,get CUR(){return CUR},get WD(){return WD},get NTILE(){return NTILE},get WSTATE(){return WSTATE},autoBlockers,nearList,AUTO,autoStart,autoStop,autoKinds,CLOUD,CL,clMake,clSync,clLoad,clShow,renderer,scene,netHost,netJoin,netRooms,netInit,netLeave,PL,W,CAM,CELLS,TILES,NODES,ENEMIES,BLDS,NET,OPT,IN,unlockTile,addRes,applySave,snapshot,toggleMap,setSkin,refreshGhosts,saveGame,loadSave,packCode,unpackCode,hitNode,hitEnemy,portalB,groundKind,available,get STATE(){return STATE},get PADUI(){return PADUI}};
