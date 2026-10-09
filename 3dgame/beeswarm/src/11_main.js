// ===================== 起動とメインループ =====================
let saveT=0,regT=0,dayT=0;
function boot(){load();calcStats();
  buildTerrain();buildPaths();for(const id of FIELD_IDS)buildField(id);buildHives();buildPlaces();buildRooms();
  syncBees();refreshLook();gatesUpdate();renderer.shadowMap.enabled=SET.shadow;
  teleport(HIVE_X(MY_HIVE),HIVE_PADZ);
  $('bootBar').style.width='100%';$('bootTx').textContent='準備ができました';$('bootGo').style.visibility='visible';
  $('bootGo').onclick=start;G.state='ready'}
function start(){ac();$('boot').style.display='none';G.state='play';
  if(!ST.tut){ST.tut=1;big('🐝 ようこそ！',2.2);setTimeout(()=>note('🎒 持ち物の「ベーシックエッグ」をハイブで使って、最初のハチをかえそう（🐝ボタン）'),800);setTimeout(()=>note('🌻 ハチがいたら、ヒマワリ畑で左クリック長押し（スマホは🥄ボタン）で花粉を集めよう'),3500);setTimeout(()=>note('🐻 ブラックベア（ハイブの右）に話しかけるとクエストがもらえる'),6500);save()}}
// 昼と夜（本家のように時間がたつと夜になる）
function dayNight(dt){dayT+=dt;const cyc=900,ph=(dayT%cyc)/cyc,night=ph>.78?Math.min(1,(ph-.78)/.04)*(ph>.96?(1-ph)/.04:1):0;G.night=night;
  sun.intensity=lerp(.78,.15,night);hemi.intensity=lerp(.82,.35,night);sky.material.color.setRGB(lerp(1,.25,night),lerp(1,.3,night),lerp(1,.55,night));scene.fog.color.setRGB(lerp(.81,.12,night),lerp(.91,.15,night),lerp(1,.3,night))}
function step(dt){G.t+=dt;G.dt=dt;updTimers();
  if(!updFlying(dt))updPlayer(dt);updBees(dt);updMobs(dt);updTokens(dt);updBubbles(dt);updFlames(dt);updMarks(dt);updObjs(dt);
  regT+=dt;if(regT>.5){regrowFlowers(regT);regT=0}flushFlowers();updFx(dt);dayNight(dt);
  saveT+=dt;if(saveT>15){saveT=0;save()}}
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
  if(G.state==='play'){step(dt);updPrompt();updHud(dt)}
  if(!window.__camOverride)updCam(dt);renderer.render(scene,cam)}
addEventListener('beforeunload',()=>{if(G.state==='play')save()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.state==='play')save()});
// テスト用
window.__B={G,ST:()=>ST,P:()=>P,PL,FL,BEES,BEELIST,MOBLIST,TOKENS,FIELDS,teleport,step,start,give,hatch,feed,useJelly,syncBees,calcStats,capacity,useTool,talkBear,acceptQuest,nextQuest,finishQuest,questDone,
  openShop,useMachine,PANELS,closePanel,enterRoom,killMob,hurtMob,ability,spawnToken,collectToken,equip,pay,save,load,resetState:()=>{ST=newState()},setST:s=>{ST=s},KEY,CAM,interact,nearI:()=>nearI,cam,scene,renderer,
  setMouse:v=>{mouseL=v},updCam,SURF,SOLID,INTER,groundAt,blocked,GATEWALL,gatesUpdate,updPrompt,updHud,onEnterField,beeCount,addFieldBoost,brownP,BROWN_TABLE,QUEST_TABLE,eggPrice,useItem,cannonFly,fieldAt};
try{boot()}catch(e){console.error(e);$('bootTx').textContent='エラー：'+e.message}
requestAnimationFrame(frame);
