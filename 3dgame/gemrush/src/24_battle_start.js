// ================= バトル開始・終了 =================
function startTutorial(){clearMatch();G.rule='tutorial';G.mode='team';G.ranked=false;G.diff=0;buildArena('valley','tutorial');hideScreens();document.body.classList.add('playing');document.body.classList.remove('br');
  Object.assign(G,{t:0,mineT:999,time:0,cd:null,cdTeam:-1,state:'intro',introT:.1,over:false,shake:0,endT:0,supWas:false,safeR:999,poisonT:0,place:0});
  G.me=mkUnit('rico',0,true,'あなた',[0,HALFZ-6],1,null,{gad:-1,sp:-1,gears:[],hyper:false});G.units.push(G.me);
  for(let i=0;i<2;i++){const d=mkUnit('riki',1,false,'まと',[0,0],1,null);d.dummy=true;d.dead=true;d.respT=1e9;d.m.g.visible=false;G.units.push(d)}
  for(const u of G.units)mkLabel(u);G.M={};ZOOM=1;camP.set(G.me.x,0,G.me.z);tutSetup()}
const botKit=(b,lv)=>({gad:lv>=7?Math.floor(Math.random()*2):-1,sp:lv>=9?Math.floor(Math.random()*2):-1,gears:[],hyper:lv>=11,
  buf:BUF[b]?{gad:lv>=9&&Math.random()<.35,sp:lv>=10&&Math.random()<.35,hyper:lv>=11&&Math.random()<.5}:{}});
const botSkin=b=>{if(Math.random()>=.25)return null;const L=SKINS[b].filter(k=>k.id!=='base'&&!k.pass);return L[Math.floor(Math.random()*L.length)]};
function startMatch(mode){initAudio();if(!isOwned(PICK))PICK='rico';mode=mode||PMODE;if(!MODES[mode])mode='gem';document.body.classList.toggle('tut',mode==='tutorial');if(mode==='tutorial'){startTutorial();return}clearMatch();const ranked=mode==='ranked',rule=ranked?RANKED_MODES[Math.floor(Math.random()*RANKED_MODES.length)]:mode,rules=rule==='br'?'br':'gem';
  // ガチバトルはモードもマップもランダム、ほかはいまのマップ（時間で入れかわる）
  const ids=mapsOf(rule),mid=ranked?ids[Math.floor(Math.random()*ids.length)]:curMap(rule).id;G.friendly=false;
  G.rule=rule;G.mode=rule==='br'?'br':'team';G.ranked=ranked;const rk=rankOf(RPts());G.diff=ranked?Math.min(1,rk.div/20):clamp(totalTr()/2200,0,.55);G.rpBefore=RPts();
  buildArena(mid,rule);hideScreens();document.body.classList.add('playing');document.body.classList.toggle('br',rules==='br');
  const names=BOTNAMES.slice().sort(()=>Math.random()-.5),plv=level(PICK),base=Math.max(plv,1+Math.round(G.diff*10)),blv=()=>clamp(base+Math.round(rr(-1.3,.7)),1,MAXLV),pickBot=ex=>{const pool=BT_IDS.filter(i=>!ex.includes(i));return pool[Math.floor(Math.random()*pool.length)]||BT_IDS[0]};
  Object.assign(G,{t:0,mineT:3,time:150,cd:null,cdTeam:-1,state:'intro',introT:3.2,over:false,shake:0,endT:0,supWas:false,safeR:999,poisonT:0,place:0,brDead:0,specExit:0});
  if(rules==='gem'){const sp=(t,i)=>{const [c,r]=SPAWN[t][i];return[tx(c),tz(r)]};
    G.me=mkUnit(PICK,0,true,'あなた',sp(0,1),plv,skinOf(PICK),myKit(PICK));G.units.push(G.me);const used=[PICK];
    [0,2].forEach((i,k)=>{const b=pickBot(used);used.push(b);{const lv=blv();G.units.push(mkUnit(b,0,false,names[k],sp(0,i),lv,botSkin(b),botKit(b,lv)))}});
    const red=[];for(let i=0;i<3;i++){const b=pickBot(red);red.push(b);{const lv=blv();G.units.push(mkUnit(b,1,false,names[2+i],sp(1,i),lv,botSkin(b),botKit(b,lv)))}}}
  else{const R0=HALFX*.88;for(let i=0;i<10;i++){const a=Math.PI/2+i/10*TAU,[x,z]=nearestOpen(Math.cos(a)*R0,Math.sin(a)*R0);
      const bb=BT_IDS[Math.floor(Math.random()*BT_IDS.length)],lv2=blv(),u=i===0?mkUnit(PICK,0,true,'あなた',[x,z],plv,skinOf(PICK),myKit(PICK)):mkUnit(bb,i,false,names[i-1],[x,z],lv2,botSkin(bb),botKit(bb,lv2));G.units.push(u);if(i===0)G.me=u}
    G.safeR=Math.hypot(HALFX,HALFZ)+2;G.alive=10}
  for(const u of G.units)mkLabel(u);G.time=MODES[rule].time||150;modeInit();ZOOM=1;camP.set(me().x,0,me().z);
  // 相手のトロフィーは自分のトロフィーの近く（本家のマッチングのように）
  const myTr=G.ranked?null:trophies(PICK);for(const u of G.units)u.tr=myTr==null?null:u.isMe?myTr:Math.max(0,Math.round(myTr+rr(-60,60)));
  G._vsNote=(ranked?'ガチバトル・':'')+MODES[rule].name+'・'+MAPS[mid].name;showVS(rule,mid)}
