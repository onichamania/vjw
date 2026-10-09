// ===================== ハチ（見た目・動き・花粉集め・ハチミツ作り・育てる） =====================
// 体の色・しまの色（本家の見た目に近い色）
const BEECOL={basic:[0xffd84a,0x2b2b2b],bomber:[0x9aa0a8,0x3a3a3a],brave:[0xff9a3a,0x5a2a10],bumble:[0x5a7ad8,0xffd84a],cool:[0x7ad0ff,0x2a5a9a],hasty:[0xffe86a,0x3a8a3a],looker:[0xf0f0f0,0x2a6ad8],
 rad:[0xff6a5a,0x7a1a1a],rascal:[0xd83a3a,0x2b2b2b],stubborn:[0xb08050,0x3a2a1a],bubble:[0x6ab0ff,0xffffff],bucko:[0x3a6ad8,0x1a2a5a],commander:[0x8a8f6a,0x2b2b2b],demo:[0x7a7a80,0xff6a2a],
 exhausted:[0xa0a8b8,0x5a5a6a],fire:[0xff7a2a,0xffd84a],frosty:[0xc8f0ff,0x6ab0e0],honey:[0xffb320,0x7a4a00],rage:[0xd82a2a,0x3a0a0a],riley:[0xe83a3a,0x6a1010],shocked:[0xfff06a,0xa0a0a0],
 baby:[0xffb0d0,0xffffff],carpenter:[0xa07040,0xffd84a],demon:[0x8a1a1a,0x2b0a0a],diamond:[0x9ae8ff,0xffffff],lion:[0xe8b060,0x8a5020],music:[0xa070e0,0x3a2a6a],ninja:[0x2a3a8a,0x0a0a2a],shy:[0xff7aa0,0xffd0e0],
 buoyant:[0x8ad8ff,0x3a8ad8],fuzzy:[0xf8f8f8,0xd8d8d8],precise:[0xe04a3a,0x2b2b2b],spicy:[0xff4a2a,0xffa020],tadpole:[0x2a4a7a,0x6a9ad8],vector:[0xe8e8ff,0x8a4ae0],
 bear:[0x8a5a32,0xd8b080],cobalt:[0x2a5ae0,0x0a1a5a],crimson:[0xe02a3a,0x5a0a0a],digital:[0x4ae07a,0x0a3a1a],festive:[0xe02a2a,0x2aa03a],gummy:[0x5ad8c0,0x2a8a7a],photon:[0xfff8d0,0xffd84a],
 puppy:[0xd8b080,0x8a5a32],tabby:[0xff9a3a,0xa04a10],vicious:[0x2a3a6a,0xa0c0ff],windy:[0xf0f8ff,0xb0c8d8]};
const beeColHex=t=>(BEECOL[t]?BEECOL[t][0]:0xffd84a).toString(16).padStart(6,'0');
const BEELIST=[];
const beeGeo=new THREE.SphereGeometry(.32,12,10),wingGeo=new THREE.PlaneGeometry(.42,.24),stripeGeo=new THREE.TorusGeometry(.3,.05,4,14),eyeGeo=new THREE.SphereGeometry(.07,6,5);
const wingMat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.7,side:THREE.DoubleSide});
const BMATS={};function beeMat(hex){return BMATS[hex]||(BMATS[hex]=M(hex))}
function beeMesh(t,g){const [a,b]=BEECOL[t]||[0xffd84a,0x2b2b2b],G0=new THREE.Group(),body=new THREE.Mesh(beeGeo,beeMat(a));body.scale.set(1,.9,1.25);body.castShadow=true;G0.add(body);
  for(const z of[-.06,.18]){const s=new THREE.Mesh(stripeGeo,beeMat(b));s.position.z=z;s.scale.set(1,.92,1);G0.add(s)}
  for(const sx of[-1,1]){const e=new THREE.Mesh(eyeGeo,MAT.black);e.position.set(sx*.12,.07,-.36);G0.add(e)}
  const wl=new THREE.Mesh(wingGeo,wingMat),wr=new THREE.Mesh(wingGeo,wingMat);wl.position.set(-.25,.25,0);wr.position.set(.25,.25,0);wl.rotation.x=wr.rotation.x=-Math.PI/2;G0.add(wl,wr);
  if(t==='commander'||t==='tabby'||t==='puppy'||t==='bear'||t==='lion'){const ex=new THREE.Mesh(new THREE.SphereGeometry(.13,6,5),beeMat(b));ex.position.set(0,.3,-.1);G0.add(ex)}
  if(g){const s=new THREE.Mesh(new THREE.OctahedronGeometry(.1),M(0xfff07a,{emissive:0x6a5a00}));s.position.set(0,.45,0);G0.add(s)}
  G0.userData={wl,wr};scene.add(G0);return G0}
// ---- ハチの能力値 ----
const beeData=b=>ST.hive[b.slot];
function beeSpd(b){const d=beeData(b),B=BEES[d.t];return B.spd/4*(1+.03*(d.lv-1))*(1+P.beeMs/100)*P.beeMsMul}
function beeGat(b){const d=beeData(b),B=BEES[d.t];return B.ga*(1+.05*(d.lv-1))*(d.g?1.5:1)*(1+P.beeGather/100)*P.beeGatherMul*(d.g?1+P.giftPollen/100:1)}
function beeConv(b){const d=beeData(b),B=BEES[d.t];return (B.cv*(1+.1*(d.lv-1))*(d.g?1.5:1)+P.convAmt)*(1+P.conv/100)*P.convMul*P.hiveMul}
function beeEnergy(b){const d=beeData(b),B=BEES[d.t];return B.energy*(1+.05*(d.lv-1))*P.energyMul}
function beeAtk(b){const d=beeData(b),B=BEES[d.t];let a=B.atk+P.atk+(B.col==='w'?P.atkW:B.col==='r'?P.atkR:P.atkB);a*=(1+P.atkPct/100)*(B.col==='r'?1+P.atkRpct/100:1)*(d.g?1.5:1);return a}
// 巣のマスの場所（ハイブの正面）
function slotPos(i){const r=9-Math.floor(i/5),c=i%5,u=256/5.2*(c+.6),v=448/10.6*(r+.55)+(c%2?448/10.6/2:0);return[HIVE_X(MY_HIVE)+3.8-u/256*7.6,7+6.65-v/448*13.3,HIVE_Z-.9]}
// ハイブの中身が変わったら、飛んでいるハチを作り直す
function syncBees(){const want=new Map();ST.hive.forEach((d,i)=>{if(d&&i<ST.slots)want.set(i,d)});
  for(let i=BEELIST.length-1;i>=0;i--){const b=BEELIST[i];if(b.temp)continue;const d=want.get(b.slot);if(!d||d.t!==b.t||!!d.g!==b.g){scene.remove(b.m);BEELIST.splice(i,1)}else want.delete(b.slot)}
  for(const [i,d] of want){const [x,y,z]=slotPos(i);const b={slot:i,t:d.t,g:!!d.g,x,y,z,st:'follow',timer:rr(0,1),energy:0,sleep:0,tok:{},m:beeMesh(d.t,d.g),ph:rr(0,TAU),flower:null,mob:null};b.energy=beeEnergy(b);BEELIST.push(b)}
  drawHive(MY_HIVE);gatesUpdate();calcStats()}
// 一時的なハチ（インフェルノのファイアビーなど）
function tempBee(t,lv,g,dur,x,z){const slot=-1-BEELIST.length,b={slot,temp:{t,lv,g,bond:0},t,g,x,y:PL.y+2,z,st:'follow',timer:0,energy:1e9,sleep:0,tok:{},m:beeMesh(t,g),ph:rr(0,TAU),ttl:dur};BEELIST.push(b);return b}
const _beeData=beeData;
function beeD(b){return b.temp||ST.hive[b.slot]}
// ---- ハチの毎フレーム ----
function updBees(dt){const conv=G.converting&&ST.pollen>0,full=ST.pollen>=capacity();
  for(let i=BEELIST.length-1;i>=0;i--){const b=BEELIST[i],d=beeD(b);if(!d){scene.remove(b.m);BEELIST.splice(i,1);continue}
    if(b.temp){b.ttl-=dt;if(b.ttl<=0){scene.remove(b.m);BEELIST.splice(i,1);continue}}
    const B=BEES[b.t],sp=beeSpdD(d)*(b.st==='toHive'||b.st==='return'?1.6:1);b.ph+=dt*9;
    const [hx,hy,hz]=b.temp?[PL.x,PL.y+2,PL.z]:slotPos(b.slot);
    if(b.sleep>0){b.sleep-=dt;b.st='sleep';if(Math.hypot(b.x-hx,b.z-hz)>40){b.x=hx;b.y=hy;b.z=hz}fly(b,hx,hy,hz,sp*2,dt);if(b.sleep<=0){b.energy=beeEnergyD(d);b.st='follow'}b.m.visible=Math.hypot(b.x-hx,b.z-hz)>.6;continue}
    b.m.visible=true;
    if(PL.dead){b.sleep=15;continue}
    // エネルギーが切れたら巣で休む（30秒、ショックドビーは半分）
    if(b.energy<=0&&!b.temp){b.sleep=b.t==='shocked'?15:30;note('💤 '+B.jp+'はエネルギー切れ。巣で休みます');continue}
    // ハチミツを作る
    if(conv&&!b.temp){if(b.st!=='toHive'&&b.st!=='convert'){b.st='toHive';b.timer=0}
      if(b.st==='toHive'){if(fly(b,hx,hy,hz,sp*1.6,dt)<.35){b.st='convert';b.timer=B.ct}continue}
      b.timer-=dt;b.x=hx+Math.sin(b.ph*.3)*.08;b.y=hy;b.z=hz;if(b.timer<=0){b.timer=B.ct;const n=convertPollen(beeConvD(d));if(n>0)fx.honeyFly(hx,hy,hz)}continue}
    if(b.st==='toHive'||b.st==='convert')b.st='follow';
    // 敵と戦う
    const mob=targetMob(b);
    if(mob&&beeAtkD(d)>0){if(b.st!=='attack'||b.mob!==mob){b.st='attack';b.mob=mob;b.timer=rr(.3,1)}
      const a=b.ph*.4+i,ox=Math.cos(a)*mob.size*.9,oz=Math.sin(a)*mob.size*.9;fly(b,mob.x+ox,mob.y+mob.size*.8+.6,mob.z+oz,sp*1.3,dt);
      b.timer-=dt;if(b.timer<=0){b.timer=1.6/Math.max(.6,sp/3.5);beeHit(b,d,mob);b.energy--;tryTokens(b,d,'battle')}continue}
    if(b.st==='attack'){b.st='follow';b.mob=null}
    // 花粉を集める
    if(G.field&&!full){const D=FL[G.field];
      if(b.st==='gather'){b.timer-=dt;b.y=D.y+.45+Math.abs(Math.sin(b.ph))*.06;if(b.timer<=0){finishGather(b,d,D);b.st='follow';b.timer=rr(.05,.4)}continue}
      if(b.st==='toFlower'&&b.flower&&b.flower.fid===G.field){const k=b.flower.k;if(fly(b,D.x[k],D.y+.5,D.z[k],sp,dt)<.25){b.st='gather';b.timer=B.gt}continue}
      b.timer-=dt;if(b.timer<=0){const k=pickFlower(D,PL.x,PL.z,7);if(k>=0){b.flower={fid:G.field,k};b.st='toFlower'}else b.timer=.5}}
    else if(b.st==='gather'||b.st==='toFlower')b.st='follow';
    // プレイヤーについていく
    if(b.st==='follow'){const a=b.ph*.12+i*2.4,r=2.2+(i%5)*.45;fly(b,PL.x+Math.cos(a)*r,PL.y+2.3+Math.sin(b.ph*.5+i)*.4,PL.z+Math.sin(a)*r,sp*1.2,dt)}}}
function beeSpdD(d){const B=BEES[d.t];return B.spd/4*(1+.03*(d.lv-1))*(1+P.beeMs/100)*P.beeMsMul}
function beeEnergyD(d){return BEES[d.t].energy*(1+.05*(d.lv-1))*P.energyMul}
function beeConvD(d){const B=BEES[d.t];return (B.cv*(1+.1*(d.lv-1))*(d.g?1.5:1)+P.convAmt)*(1+P.conv/100)*P.convMul*P.hiveMul}
function beeGatD(d){const B=BEES[d.t];return B.ga*(1+.05*(d.lv-1))*(d.g?1.5:1)*(1+P.beeGather/100)*P.beeGatherMul*(d.g?1+P.giftPollen/100:1)}
function beeAtkD(d){const B=BEES[d.t];let a=B.atk+P.atk+(B.col==='w'?P.atkW:B.col==='r'?P.atkR:P.atkB);return a*(1+P.atkPct/100)*(B.col==='r'?1+P.atkRpct/100:1)*(d.g?1.5:1)}
// 目的地へ飛ぶ（残りの距離を返す）
function fly(b,x,y,z,sp,dt){const dx=x-b.x,dy=y-b.y,dz=z-b.z,l=Math.hypot(dx,dy,dz);if(l>.001){const s=Math.min(l,sp*dt);b.x+=dx/l*s;b.y+=dy/l*s;b.z+=dz/l*s;if(Math.hypot(dx,dz)>.05)b.face=Math.atan2(-dx,-dz)}
  // とても遠いとワープ（本家でも遠いとプレイヤーのところへ飛んでくる）
  if(l>60&&b.st!=='toHive'&&b.st!=='sleep'){b.x=PL.x+rr(-2,2);b.y=PL.y+3;b.z=PL.z+rr(-2,2)}
  const m=b.m;m.position.set(b.x,b.y+Math.sin(b.ph)*.05,b.z);if(b.face!=null)m.rotation.y=b.face;const w=Math.sin(b.ph*4)*.6;m.userData.wl.rotation.y=w;m.userData.wr.rotation.y=-w;return l}
function pickFlower(D,x,z,r){let best=-1,bs=-1;for(let t=0;t<10;t++){const k=flowerAt(D,x+rr(-r,r),z+rr(-r,r));if(k<0)continue;const s=D.fill[k]*D.s[k]+Math.random()*.3;if(s>bs){bs=s;best=k}}return best}
function finishGather(b,d,D){const k=b.flower.k,B=BEES[b.t];
  const v=collectFlower(D,k,beeGatD(d),null,'bee',B.col);b.energy--;
  if(v>0)fx.pollenPop(D.x[k],D.y+.6,D.z[k],D.c[k]);
  // きずな（好きなフィールドは多め、きらいなフィールドは少なめ）
  const like=B.likes.includes(D.id)?2:B.dislikes.includes(D.id)?.25:1;addBond(b,1*like);
  // 集めているときに出す泡・炎（パッシブ）
  if(b.t==='bubble'&&Math.random()<.25||b.t==='tadpole'&&Math.random()<.35)spawnBubble(D.id,D.x[k]+rr(-2,2),D.z[k]+rr(-2,2));
  if(b.t==='fire'&&Math.random()<.25||b.t==='demon'&&Math.random()<.35)spawnFlame(D.id,D.x[k],D.z[k]);
  tryTokens(b,d,'gather')}
// ハチミツにする（カバンの花粉から）
function convertPollen(n){n=Math.min(n,ST.pollen);if(n<=0)return 0;ST.pollen-=n;addHoney(n*(1+P.hpp/100)*P.hppMul);return n}
// ---- きずなとレベル ----
function addBond(b,n){const d=b.temp?null:ST.hive[b.slot];if(!d)return;giveBond(d,n,b.slot)}
function bondForLv(lv){let s=0;for(let i=2;i<=lv;i++)s+=BOND_LV[i];return s}
function giveBond(d,n,slot){d.bond=(d.bond||0)+n;let up=false;while(d.lv<25&&d.bond>=bondForLv(d.lv+1)){d.lv++;up=true}
  if(up){note('⬆ '+BEES[d.t].jp+'が レベル'+d.lv+' になった！','#9aff9a');SFX.levelup();const b=BEELIST.find(x=>x.slot===slot);if(b)fx.burst(b.x,b.y,b.z,[.6,1,.6],16)}}
// ---- 卵・ロイヤルゼリー・おやつ ----
function rollRarity(tab){let r=Math.random()*tab.reduce((s,x)=>s+x[1],0);for(const [k,w] of tab){if(r<w)return k;r-=w}return tab[tab.length-1][0]}
function hatch(item,slot){const it=ITEMS[item];if(!it||!it.egg)return false;if(slot>=ST.slots)return false;
  let t,g=!!it.g;if(it.egg[0]==='='){t=it.egg.slice(1)}else{const r=rollRarity(EGG_ODDS[it.egg]);t=r==='Common'?'basic':pick(byRar(r));if(it.egg==='star')g=true;else if(!g&&Math.random()<1/287)g=true}
  if(!take(item,1))return false;const old=ST.hive[slot];if(old){old.t=t;old.g=g}else ST.hive[slot]={t,lv:1,bond:0,g};
  ST.cnt.egg++;discover(t);syncBees();SFX.hatch();big((g?'★ ギフテッド ':'')+BEES[t].jp+'！',2.2);note('🥚 '+BEES[t].jp+'（'+RARITY_JP[BEES[t].rar]+'）が生まれた'+(g?'（ギフテッド）':''));save();return true}
function useJelly(item,slot){const d=ST.hive[slot];if(!d||!take(item,1))return false;const star=item==='starjelly';const r=rollRarity(JELLY_ODDS);let t=pick(byRar(r));
  d.t=t;d.g=star?true:Math.random()<1/250;ST.st.use[item]=(ST.st.use[item]||0)+1;if(item==='royaljelly')ST.cnt.rj++;discover(t);syncBees();SFX.hatch();
  big((d.g?'★ ギフテッド ':'')+BEES[t].jp+'！',2);note('👑 '+BEES[t].jp+'（'+RARITY_JP[BEES[t].rar]+'）に変わった'+(d.g?'（ギフテッド）':''));save();return true}
const GIFT_CHANCE={Common:1/12000,Rare:1/8000,Epic:1/10000,Legendary:1/12000,Mythic:1/24000,Event:0};
function feed(item,slot,n){const d=ST.hive[slot],it=ITEMS[item];if(!d||!it||!it.bond)return false;n=Math.min(n||1,inv(item));if(n<=0)return false;take(item,n);
  const B=BEES[d.t],fav=B.fav===item;let bond=it.bond*(fav?2:1)*(1+P.bondTreat/100)*n;
  if(it.gift&&!d.g){d.g=true;big('★ '+B.jp+'がギフテッドになった！',2.4)}
  else if(fav&&!d.g){const ch=GIFT_CHANCE[B.rar]||0;if(Math.random()<1-Math.pow(1-ch,n)){d.g=true;big('★ '+B.jp+'がギフテッドになった！',2.4)}}
  ST.st.feed[item]=(ST.st.feed[item]||0)+n;giveBond(d,bond,slot);note('🍪 '+B.jp+'に'+it.jp+'×'+n+'（きずな+'+fmt(bond)+(fav?'・好物！':'')+'）');syncBees();save();return true}
