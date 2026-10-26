// ================= ボットの考え =================
const MELEE=['punch','fists','spin','kick','swipe','bat','hug','broom','dash','signal'];
function prefDist(u){const t=curAtk(u).type,R=atkRange(u);return MELEE.includes(t)?(t==='broom'||t==='kick'?R*.4:t==='dash'||t==='swipe'?R*.5:0):t==='spread'?R*.45:t==='double'||t==='steam'?R*.45:t==='bomber'||t==='blades'||t==='hammer'||t==='spray'?R*.6:t==='split'||t==='scrap'||t==='coins'?R*.7:t==='cannon'||t==='snipe'||t==='arrow'||t==='mark'?R*.85:t==='focus'?BT.janet.range*.7:R*.75}
function aiThink(u){const A=u.ai,B=BT[u.bt],br=G.mode==='br';
  let tgt=null,td=1e9;for(const o of G.pets.length?G.units.concat(G.pets.filter(p=>p.decoy)):G.units){if(o.team===u.team||!visibleTo(u.team,o))continue;const d=Math.hypot(o.x-u.x,o.z-u.z);if(d<td){td=d;tgt=o}}
  if(G.rule==='ball'&&G.M.ball.carrier&&G.M.ball.carrier.team!==u.team&&visibleTo(u.team,G.M.ball.carrier)){tgt=G.M.ball.carrier;td=Math.hypot(tgt.x-u.x,tgt.z-u.z)}
  if(tgt!==A.tgt){A.tgt=tgt;A.see=G.t}A.box=null;A.mg=null;
  const hpR=u.hp/u.maxHp;let gx,gz,mode;const pref=prefDist(u);
  if(br&&Math.hypot(u.x,u.z)>G.safeR-2.5){mode='safe';const k=Math.max(0,G.safeR-5)/Math.max(1,Math.hypot(u.x,u.z));gx=u.x*k;gz=u.z*k}
  else if(A.mode==='flee'&&hpR<.8||hpR<.33&&tgt&&td<14){mode='flee';if(br){if(!tgt){const a0=A.strafe;gx=u.x*.5+Math.sin(a0)*4;gz=u.z*.5+Math.cos(a0)*4}else{const d=Math.max(td,.1);gx=u.x+(u.x-tgt.x)/d*8;gz=u.z+(u.z-tgt.z)/d*8}if(Math.hypot(gx,gz)>G.safeR-3){gx*=.6;gz*=.6}}else{const h=SPAWN[u.team][1];gx=tx(h[0])+rr(-4,4);gz=tz(h[1])+(u.team?4:-4)}}
  else if((A.mg=aiModeGoal(u,tgt,td))){mode=A.mg.mode;gx=A.mg.gx;gz=A.mg.gz}
  else if(!br&&G.cdTeam===u.team&&u.gems>0){mode='hold';const h=SPAWN[u.team][1];gx=tx(h[0])+rr(-5,5);gz=tz(h[1])+(u.team?7:-7)}
  else{let it=null,gd=1e9;for(const g of G.items){if(g.t<.5||g.kind==='ammo')continue;const d=Math.hypot(g.x-u.x,g.z-u.z);if(d<gd){gd=d;it=g}}
    if(it&&(!tgt||gd<td*.8||td>atkRange(u)*1.6)&&gd<(br?16:99)){mode='item';gx=it.x;gz=it.z}
    else if(tgt&&(!br||td<(G.t<35?atkRange(u)*.8:atkRange(u)*1.25+2)||G.t-u.lastHurt<2.5||G.t>75)){mode='fight';const d=Math.max(td,.1),ux=(u.x-tgt.x)/d,uz=(u.z-tgt.z)/d,side=Math.sin(A.strafe+G.t*.7)*(br?4:2.5);gx=tgt.x+ux*pref-uz*side;gz=tgt.z+uz*pref+ux*side}
    else if(br){let bx=null,bd=1e9;for(const k in BOXM){const [c,r]=k.split(',').map(Number);if(cell(c,r)!=='X')continue;const x=tx(c),z=tz(r),d=Math.hypot(x-u.x,z-u.z);if(d<bd&&Math.hypot(x,z)<G.safeR-1){bd=d;bx=[x,z,c,r]}}
      if(bx&&bd<12&&G.t<50&&G.t-(A.boxT||0)<9){mode='box';if(A.mode!=='box')A.boxT=G.t;A.box=bx;const want=Math.min(atkRange(u)*.7,Math.max(2.4,pref*.6)),a0=Math.atan2(u.x-bx[0],u.z-bx[1])+(A.strafe>Math.PI?1.3:-1.3);gx=bx[0]+Math.sin(a0)*want;gz=bx[1]+Math.cos(a0)*want}
      else{let e=null,ed=1e9;for(const o of G.units)if(!o.dead&&o.team!==u.team){const d=Math.hypot(o.x-u.x,o.z-u.z);if(d<ed){ed=d;e=o}}
        if(e&&(G.t>18||!bx)){mode='hunt';const a0=A.strafe+G.t*.3;gx=e.x+Math.sin(a0)*Math.min(pref,4);gz=e.z+Math.cos(a0)*Math.min(pref,4)}else{mode='roam';const a0=rr(0,TAU);gx=Math.cos(a0)*G.safeR*.5;gz=Math.sin(a0)*G.safeR*.5}}}
    else if(G.rule==='gem'&&(teamGems(1-u.team)>teamGems(u.team)+2||teamGems(1-u.team)>=7)){mode='hunt';let far=null;for(const o of G.units)if(o.team!==u.team&&!o.dead&&(!far||o.gems>far.gems))far=o;gx=far?far.x:MX;gz=far?far.z:MZ}
    else{mode='mine';gx=MX+Math.cos(A.strafe)*4;gz=MZ+Math.sin(A.strafe)*3+(u.team?-3:3)}}
  A.mode=mode;A.gx=gx;A.gz=gz;A.path=astar(cx(u.x),cz(u.z),cx(gx),cz(gz));A.pt=0}
function aiAct(u,dt){const A=u.ai,B=BT[u.bt];A.think-=dt;if(A.think<=0){A.think=rr(.3,.5);try{aiThink(u)}catch(e){A.path=[];A.pt=0;A.gx=null;A.mode='roam';if(!aiAct.err){aiAct.err=1;console.error('ai',e&&e.message,e&&e.stack)}}}
  let mx=0,mz=0;const fin=A.pt>=A.path.length;
  if(!fin){const [c,r]=A.path[A.pt],px=tx(c),pz=tz(r),d=Math.hypot(px-u.x,pz-u.z);if(d<.7)A.pt++;else{mx=(px-u.x)/d;mz=(pz-u.z)/d}}
  else if(A.gx!=null){const d=Math.hypot(A.gx-u.x,A.gz-u.z);if(d>.4){mx=(A.gx-u.x)/d;mz=(A.gz-u.z)/d}}
  const t=A.tgt&&!A.tgt.dead&&visibleTo(u.team,A.tgt)?A.tgt:null;
  if(t&&A.mode==='fight'){const d=Math.hypot(t.x-u.x,t.z-u.z)||1,sx=-(t.z-u.z)/d,sz=(t.x-u.x)/d,w=Math.sin(G.t*2.1+A.strafe);mx+=sx*w*.7;mz+=sz*w*.7}
  const l=Math.hypot(mx,mz);u.mx=l>1?mx/l:mx;u.mz=l>1?mz/l:mz;
  if(Math.hypot(u.x-A.lx,u.z-A.lz)<.02&&l>.1){A.stuck+=dt;if(A.stuck>.6){A.stuck=0;A.strafe=rr(0,TAU);A.think=0}}else A.stuck=0;A.lx=u.x;A.lz=u.z;
  const a=curAtk(u),R=atkRange(u),lobT=a.type==='dyna'||a.type==='mines';
  // 金庫をねらう
  if(!t&&A.mg&&A.mg.shoot&&u.ammo>=1&&G.t>=A.fireT){const s=A.mg.shoot,d=Math.hypot(s.x-u.x,s.z-u.z);if(d<R+1&&(lobT||los(u.x,u.z,s.x,s.z))){attack(u,Math.atan2(s.x-u.x,s.z-u.z),d);A.fireT=G.t+rr(.4,.7)}return}
  if(G.rule==='ball'&&G.M.ball.carrier===u)return;
  // 箱をこわす
  if(!t&&A.mode==='box'&&A.box&&u.ammo>=1&&G.t>=A.fireT){const [bx,bz,c,r]=A.box;if(cell(c,r)!=='X'){A.box=null;A.think=0;return}const d=Math.hypot(bx-u.x,bz-u.z);
    if(d<R*.95+1&&rayWall(u.x,u.z,(bx-u.x)/d,(bz-u.z)/d,d)>=d-1.3){attack(u,Math.atan2(bx-u.x,bz-u.z),d);A.fireT=G.t+rr(.35,.6)}return}
  if(u.bt==='ranran'&&u.form==='bonnie'&&u.sup>=1&&(!t||u.hp<u.maxHp*.45)){superAtk(u,0,0);return}
  if(u.bt==='rt'&&u.form==='head'&&supReady(u)&&(!t||u.hp<u.maxHp*.4)&&Math.random()<dt*2){superAtk(u,0,0,true);return}
  if(u.bt==='gigi'&&u.puppetT>G.t&&(u.puppetT-G.t<1.2||u.hp<u.maxHp*.4)){superAtk(u,0,0);return}
  if(u.bt==='meg'&&u.form==='meg'&&u.sup>=1&&!u.act){superAtk(u,0,0);return}
  if(!t){streamStop(u);if(u.charging&&Math.random()<dt)u.charging=false;}

  if(!t||G.t-A.see<lerp(.7,.2,G.diff))return;const dx=t.x-u.x,dz=t.z-u.z,d=Math.hypot(dx,dz),ang0=Math.atan2(dx,dz);
  // ハイパーチャージ・ガジェット
  if(u.hyp>=1&&supReady(u)&&d<R*1.2&&Math.random()<dt*3)hyperGo(u);
  if(u.kit.gad>=0&&u.gadCD<=0&&Math.random()<dt*.45){const g=BT[u.bt].gad[u.kit.gad].id,def=['hardcore','hurrah','powershield','noise','chillpill','vitamin','sneakers','phase','volts','fauxfur','tent','stinging','roundhouse','jumpscare','asteroid'].includes(g);if(def?u.hp<u.maxHp*.55&&G.t-u.lastHurt<1.2:g==='lollipop'||g==='growlight'?d<R*1.4&&u.hp<u.maxHp*.7:g==='outofline'?u.sup<.5:g==='coldblood'?d<TL(8):d<R*1.1)gadget(u,ang0)}
  // 必殺技
  if(supReady(u)&&!(u.puppetT>G.t)){const s=curSup(u),SR=supRange(u),ty=s.type;let go=false;
    if(ty==='barrage'||ty==='bats')go=d<SR*.9&&(ty==='barrage'||los(u.x,u.z,t.x,t.z));
    else if(ty==='barrel')go=d<SR*.95;else if(ty==='head')go=d<TL(8);else if(ty==='booster')go=d<R;
    else if(ty==='vault'||ty==='launch'||ty==='surge'||ty==='elbow'||ty==='swoop')go=d<SR*1.05&&d>1.5;
    else if(ty==='shell')go=d<SR*.7&&los(u.x,u.z,t.x,t.z);else if(ty==='bear')go=d<TL(8);else if(ty==='charge')go=d<SR*.8&&d>2;else if(ty==='rain')go=d<SR;else if(ty==='scrappy')go=d<R*1.1;
    else if(ty==='encore')go=u.hp<u.maxHp*.6||G.units.some(o=>!o.dead&&o.team===u.team&&o!==u&&o.hp<o.maxHp*.5&&Math.hypot(o.x-u.x,o.z-u.z)<SR);
    else if(ty==='strong')go=d<TL(4)||u.hp<u.maxHp*.6;else if(ty==='roll')go=d<SR*.85&&d>1.5;
    else if(ty==='station')go=d<R||u.hp<u.maxHp*.7||G.units.some(o=>!o.dead&&o.team===u.team&&o!==u&&o.hp<o.maxHp*.6&&Math.hypot(o.x-u.x,o.z-u.z)<TL(4));
    else if(ty==='quake')go=d<SR*.85&&los(u.x,u.z,t.x,t.z);else if(ty==='smoke')go=d<R*1.3||u.hp<u.maxHp*.45;else if(ty==='cactus')go=d<SR*.95;
    else if(ty==='poppin'){if(d<TL(3.5)||u.hp<u.maxHp*.4&&d<R){superAtk(u,ang0+Math.PI+rr(-.4,.4),SR);return}}
    else if(ty==='puppet')go=d<SR*.9&&d>TL(2);else if(ty==='fly')go=d<R*1.6;else if(ty==='bigblob'||ty==='foxmines'||ty==='cashback'||ty==='flask')go=d<SR*.95;
    else if(ty==='chainkick'||ty==='collect'||ty==='trick')go=d<SR*.85&&los(u.x,u.z,t.x,t.z);else if(ty==='rats')go=d<TL(8);else if(ty==='split')go=d<TL(5);else if(ty==='merge')go=false;
    else if(ty==='stalk')go=d<TL(8)||u.hp<u.maxHp*.4;else if(ty==='swamp')go=d<R;else if(ty==='caustic')go=d<s.rad*.8;else if(ty==='spitball')go=d<TL(10);
    else if(ty==='letsgo')go=d<R*1.3||u.hp<u.maxHp*.4;else if(ty==='mecha')go=true;else if(ty==='steel')go=d<SR;
    else if(ty==='spooky'){if(u.hp<u.maxHp*.6&&G.t-u.lastHurt<2){superAtk(u,0,0,true);return}const al=G.units.find(o=>!o.dead&&o.team===u.team&&o!==u&&o.hp<o.maxHp*.6&&Math.hypot(o.x-u.x,o.z-u.z)<SR);if(al){superAtk(u,Math.atan2(al.x-u.x,al.z-u.z),Math.hypot(al.x-u.x,al.z-u.z));return}}
    else if(ty==='post'){const n=myPosts(u).length;if(n<2||Math.random()<.4){superAtk(u,ang0+rr(-.3,.3),Math.min(d,SR));return}else{superAtk(u,0,0,true);return}}
    else if(ty==='ghost')go=d<SR*2.5||u.hp<u.maxHp*.35;
    else go=d<SR*.9;
    if(go){superAtk(u,ang0+rr(-.05,.05),d);return}}
  if(a.hold==='stream'){if(d<R*(a.type==='spin'?1.05:.95)&&(a.type==='spin'||los(u.x,u.z,t.x,t.z))){u.streamAng=ang0+rr(-.05,.05);streamStart(u)}else streamStop(u);return}
  if(a.hold==='charge'){const want=a.type==='focus'?clamp((d-BT.janet.range0)/(BT.janet.range-BT.janet.range0),0,1):u._cw||(u._cw=rr(.45,1));
    if(!u.charging){if(d<(a.type==='focus'?BT.janet.range:R)*1.05&&u.ammo>=1&&G.t>=A.fireT)chargeStart(u);return}
    if(u.charge>=want&&los(u.x,u.z,t.x,t.z)&&d<atkRange(u)*1.02){const lead=d/a.speed*rr(.3,.9)*lerp(.6,1.1,G.diff);attack(u,Math.atan2(t.x+t.vx*lead-u.x,t.z+t.vz*lead-u.z)+rr(-.08,.08)*lerp(1.4,.45,G.diff),d);u._cw=0;A.fireT=G.t+rr(.3,.7)}return}
  const thru=a.type==='spin'||a.type==='signal'||a.type==='hug'||a.type==='blomb';
  if(u.ammo<1||G.t<A.fireT)return;if(d>R*(MELEE.includes(a.type)?1.1:.95))return;if(!lobT&&!thru&&!los(u.x,u.z,t.x,t.z))return;
  const spd=a.speed||d/(a.time||.25),lead=d/spd*rr(.3,.9)*lerp(.6,1.1,G.diff),px=t.x+t.vx*lead,pz=t.z+t.vz*lead,err=rr(-.13,.13)*lerp(1.4,.45,G.diff);
  attack(u,Math.atan2(px-u.x,pz-u.z)+err,Math.hypot(px-u.x,pz-u.z));A.fireT=G.t+rr(.45,.9)*lerp(1.2,.55,G.diff)}

