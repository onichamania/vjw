// ---- 見た目：丸い体と大きな頭、キャラごとの頭・武器（SK=スキン、form=ランランの姿） ----
const G_leg=new THREE.CylinderGeometry(.13,.15,.5,8),G_body=new THREE.CylinderGeometry(.36,.46,.72,14),G_head=new THREE.SphereGeometry(.42,18,14),G_eye=new THREE.SphereGeometry(.085,10,8),G_pup=new THREE.SphereGeometry(.045,8,6),G_hand=new THREE.SphereGeometry(.13,10,8);
function mkModel(bt,ringCol,isMe,SK,form){SK=SK||{};const B=BT[bt],g=new THREE.Group(),mats=[];const mm=(hex,o)=>{const gl=hex===SK.body&&SK.glowB||hex===SK.hair&&SK.glowH;if(gl&&!(o&&o.emissive))o=Object.assign({},o,{emissive:gl});const m=M(hex,o);mats.push(m);return m};const HC=h=>SK.hair||h;
  const robot=bt==='kachiko'||bt==='piko'||bt==='soda'||bt==='yotaka'||bt==='tarubo';
  const skin=mm(robot?0xc7ccd6:bt==='vlad'?0xd8e0ea:bt==='gantetsu'?0x9fb8a8:bt==='sabo'?0x5cb83a:0xffd2a8),body=mm(SK.body||B.col),dark=mm(0x2b2d36),white=mm(0xffffff),metal=mm(0x9aa3b5);
  const add=(geo,mat,x,y,z,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(par||g).add(m);return m};
  const rig=new THREE.Group();g.add(rig);rig.scale.setScalar(1.3);
  const legL=add(G_leg,dark,-.17,.25,0,rig),legR=add(G_leg,dark,.17,.25,0,rig);
  const torso=new THREE.Group();torso.position.y=.5;rig.add(torso);
  const bodyM=add(bt==='piko'?new THREE.BoxGeometry(.8,.8,.6):G_body,body,0,.36,0,torso);const head=new THREE.Group();head.position.y=1.08;torso.add(head);
  const hL=add(G_hand,skin,-.46,.4,.1,torso),hR=add(G_hand,skin,.46,.4,.12,torso);
  const eyes=(y,z,s)=>{for(const sx of[-1,1]){add(G_eye,white,sx*.15,y,z,head).scale.setScalar(s||1);add(G_pup,dark,sx*.15,y,z+.07,head)}};
  if(bt==='jack'){add(G_head,skin,0,0,0,head);eyes(.05,.36);const hair=mm(HC(0x8a3a1e));add(new THREE.SphereGeometry(.45,16,10,0,TAU,0,Math.PI*.5),hair,0,.05,-.04,head);add(new THREE.SphereGeometry(.26,14,10),hair,0,.38,.22,head).scale.set(1.2,.8,1.3);
    add(new THREE.BoxGeometry(.5,.08,.06),mm(0x111318),0,.06,.4,head);for(const sx of[-1,1]){const gun=new THREE.Group();gun.position.set(sx*.48,.36,.3);torso.add(gun);add(new THREE.BoxGeometry(.1,.14,.36),metal,0,0,0,gun);add(new THREE.BoxGeometry(.08,.16,.1),mm(0x6b4a2e),0,-.1,-.12,gun)}}
  if(bt==='goro'){add(G_head,skin,0,0,0,head);eyes(.1,.36);add(new THREE.SphereGeometry(.34,14,10),white,0,-.2,.18,head).scale.set(1.1,.8,.8);
    add(new THREE.SphereGeometry(.46,16,10,0,TAU,0,Math.PI*.5),mm(HC(0xe8b43a)),0,.08,0,head);add(new THREE.CylinderGeometry(.1,.12,.12,12),mm(0xfff6b0,{emissive:0xb89a20}),0,.3,.38,head).rotation.x=Math.PI/2;
    for(const o of[-.05,.05])add(new THREE.CylinderGeometry(.05,.05,.4,8),mm(0xd8343a),.48+o,.45,.15,torso)}
  if(bt==='kachiko'){add(new THREE.SphereGeometry(.44,18,14),mm(HC(0x5a6070)),0,0,0,head);add(new THREE.SphereGeometry(.14,12,10),mm(0xff3b3b,{emissive:0xa01010}),0,.02,.38,head);
    add(new THREE.CylinderGeometry(.04,.04,.25,6),mm(0xc9a36b),0,.52,0,head);add(new THREE.SphereGeometry(.07,8,6),mm(0xffc53d,{emissive:0xa06000}),0,.66,0,head);bodyM.scale.set(.8,.7,.8)}
  if(bt==='piko'){const hd=add(new THREE.BoxGeometry(.78,.66,.62),mm(HC(0x4b3ab8)),0,0,0,head);add(new THREE.BoxGeometry(.6,.42,.05),mm(0x0f1a14,{emissive:0x103018}),0,.02,.32,head);
    for(const sx of[-1,1])add(new THREE.BoxGeometry(.1,.1,.02),mm(0x5dff8a,{emissive:0x2aa050}),sx*.14,.06,.35,head);add(new THREE.BoxGeometry(.3,.05,.02),mm(0x5dff8a,{emissive:0x2aa050}),0,-.1,.35,head);
    const gun=new THREE.Group();gun.position.set(.5,.36,.28);torso.add(gun);add(new THREE.BoxGeometry(.18,.18,.5),metal,0,0,0,gun);add(new THREE.CylinderGeometry(.06,.06,.3,8),mm(0x5dff8a,{emissive:0x2aa050}),0,0,.35,gun).rotation.x=Math.PI/2}
  if(bt==='kagerou'){add(G_head,skin,0,0,0,head);eyes(.05,.36);const hair=mm(HC(0x1c1a24));add(new THREE.SphereGeometry(.46,16,10,0,TAU,0,Math.PI*.55),hair,0,.03,-.03,head);add(new THREE.BoxGeometry(.3,.28,.12),hair,-.14,.04,.36,head);
    const sc=mm(0x6f3fb0);add(new THREE.TorusGeometry(.3,.1,8,16),sc,0,-.34,0,head).rotation.x=Math.PI/2;const tail=add(new THREE.BoxGeometry(.16,.06,.8),sc,.2,-.36,-.5,head);tail.rotation.x=.3}
  if(bt==='ranran'){add(G_head,skin,0,0,0,head);eyes(.05,.36);const hair=mm(HC(0xff6fb5));add(new THREE.SphereGeometry(.45,16,10,0,TAU,0,Math.PI*.55),hair,0,.03,-.03,head);
    for(const sx of[-1,1])add(new THREE.ConeGeometry(.12,.4,8),hair,sx*.34,.2,-.1,head).rotation.z=sx*-.9;
    if(form!=='bonnie'){const cn=new THREE.Group();cn.position.set(0,.05,0);g.add(cn);const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.44,1.3,16),mm(0x3a3f4d));barrel.rotation.x=Math.PI/2-.35;barrel.position.set(0,.75,.3);barrel.castShadow=true;cn.add(barrel);
      for(const sx of[-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.12,16),mm(0x8a5a2e));w.rotation.z=Math.PI/2;w.position.set(sx*.5,.34,0);cn.add(w)}rig.position.y=.62;rig.position.z=-.25}}
  if(bt==='vlad'){add(G_head,skin,0,0,0,head);eyes(.05,.36);const hat=mm(HC(0x1c1a24));add(new THREE.CylinderGeometry(.5,.5,.05,20),hat,0,.3,0,head);add(new THREE.CylinderGeometry(.3,.3,.55,16),hat,0,.58,0,head);
    add(new THREE.BoxGeometry(.3,.08,.02),mm(0xb3262f),0,.38,.3,head);const cape=add(new THREE.PlaneGeometry(.9,1.0),mm(0x8a1a2a,{side:THREE.DoubleSide}),0,.3,-.4,torso);cape.rotation.x=.2;
    const sh=new THREE.Group();sh.position.set(.5,.4,.2);torso.add(sh);add(new THREE.CylinderGeometry(.035,.035,1.1,6),mm(0x6b4a2e),0,0,.3,sh).rotation.x=Math.PI/2;add(new THREE.BoxGeometry(.3,.04,.34),metal,0,0,.95,sh)}
  if(bt==='soda'){const cup=add(new THREE.CylinderGeometry(.42,.34,.7,18),mm(0xffb13b,{transparent:true,opacity:.85}),0,.05,0,head);add(new THREE.CylinderGeometry(.44,.44,.08,18),mm(HC(0x2f8fe0)),0,.42,0,head);
    add(new THREE.CylinderGeometry(.04,.04,.6,6),mm(0xff4d6d),.12,.66,0,head).rotation.z=-.3;eyes(.05,.4,1.1);for(const sx of[-1,1])add(new THREE.BoxGeometry(.2,.3,.2),mm(HC(0x2f8fe0)),sx*.5,.4,.1,torso)}
  if(bt==='rico'){add(G_head,skin,0,0,0,head);eyes(.05,.36);const hair=mm(HC(0xff8a3d));add(new THREE.SphereGeometry(.45,16,10,0,TAU,0,Math.PI*.55),hair,0,.03,-.03,head);add(new THREE.SphereGeometry(.2,12,10),hair,0,.05,-.5,head).scale.set(.8,1.4,.8);
    add(new THREE.CylinderGeometry(.44,.46,.12,16),mm(0x2b2d36),0,.3,0,head);add(new THREE.BoxGeometry(.5,.05,.28),mm(0x2b2d36),0,.27,.34,head);
    const gun=new THREE.Group();gun.position.set(.46,.36,.3);torso.add(gun);add(new THREE.BoxGeometry(.16,.2,.4),mm(0x6b4a2e),0,0,-.05,gun);add(new THREE.CylinderGeometry(.08,.08,.55,10),metal,0,.05,.35,gun).rotation.x=Math.PI/2}
  if(bt==='yuki'){add(G_head,skin,0,0,0,head);eyes(.0,.36);const fur=mm(HC(0x8a5a36));add(new THREE.SphereGeometry(.5,16,12,0,TAU,0,Math.PI*.62),fur,0,.02,-.06,head);for(const sx of[-1,1])add(new THREE.SphereGeometry(.14,10,8),fur,sx*.3,.42,-.05,head);
    add(new THREE.TorusGeometry(.32,.08,8,16),mm(0xf2e6d0),0,-.05,.1,head).rotation.x=.2}
  if(bt==='gai'){rig.scale.set(1.55,1.4,1.55);add(G_head,skin,0,0,0,head);eyes(.05,.36);add(new THREE.BoxGeometry(.1,.3,.6),mm(HC(0x2b2d36)),0,.4,0,head);add(new THREE.TorusGeometry(.06,.02,6,10),metal,0,-.12,.4,head);
    const gun=new THREE.Group();gun.position.set(.46,.3,.3);torso.add(gun);for(const sx of[-1,1])add(new THREE.CylinderGeometry(.07,.07,.5,8),metal,sx*.07,0,.25,gun).rotation.x=Math.PI/2}
  if(bt==='jet'){add(G_head,skin,0,0,0,head);add(new THREE.BoxGeometry(.52,.1,.1),mm(0x111318),0,.05,.37,head);const hair=mm(HC(0x2b2d36));add(new THREE.SphereGeometry(.45,16,10,0,TAU,0,Math.PI*.45),hair,0,.05,-.03,head);
    const rl=add(new THREE.CylinderGeometry(.18,.18,1.1,12),mm(0x4f7a3a),.45,.75,.05,torso);rl.rotation.x=Math.PI/2;add(new THREE.CylinderGeometry(.13,.13,.05,12),mm(0x111318),.45,.75,.61,torso).rotation.x=Math.PI/2}
  if(bt==='riki'){rig.scale.set(1.5,1.45,1.5);add(G_head,mm(HC(0x2f6fd8)),0,0,0,head);for(const sx of[-1,1]){add(G_eye,white,sx*.15,.05,.36,head);add(G_pup,dark,sx*.15,.05,.43,head)}
    add(new THREE.BoxGeometry(.3,.06,.1),mm(0xffd84d),0,.2,.38,head);hL.scale.setScalar(1.8);hR.scale.setScalar(1.8);hL.material=hR.material=mm(0xd8343a)}
  if(bt==='carlo'){add(G_head,mm(0xf2eee4),0,0,0,head);for(const sx of[-1,1])add(new THREE.SphereGeometry(.1,10,8),dark,sx*.15,.05,.35,head);add(new THREE.BoxGeometry(.3,.05,.05),dark,0,-.18,.4,head);
    add(new THREE.CylinderGeometry(.7,.7,.04,20),mm(HC(0xc9a36b)),0,.3,0,head);add(new THREE.ConeGeometry(.32,.4,16),mm(HC(0xc9a36b)),0,.5,0,head);
    const gt=new THREE.Group();gt.position.set(0,.3,.45);torso.add(gt);add(new THREE.SphereGeometry(.3,14,10),mm(0x8a5a2e),0,0,0,gt).scale.set(1,1.1,.4);add(new THREE.BoxGeometry(.08,.7,.05),mm(0x3a2a1a),.1,.4,0,gt).rotation.z=-.4}
  if(bt==='mimi'){add(G_head,skin,0,0,0,head);eyes(.05,.36);const hair=mm(HC(0xff7a2e));add(new THREE.SphereGeometry(.45,16,10,0,TAU,0,Math.PI*.55),hair,0,.03,-.03,head);for(const sx of[-1,1])add(new THREE.SphereGeometry(.15,10,8),hair,sx*.38,.05,-.1,head);
    add(new THREE.TorusGeometry(.2,.05,6,14),metal,-.14,.3,.26,head);add(new THREE.TorusGeometry(.2,.05,6,14),metal,.14,.3,.26,head);add(new THREE.BoxGeometry(.1,.5,.1),metal,.5,.5,.2,torso)}
  if(bt==='yotaka'){add(new THREE.SphereGeometry(.44,16,12),mm(HC(0x1c1d2a)),0,0,0,head);add(new THREE.ConeGeometry(.12,.45,10),mm(0xffc53d),0,-.05,.5,head).rotation.x=Math.PI/2;
    for(const sx of[-1,1])add(new THREE.SphereGeometry(.09,10,8),mm(0x9dff6a,{emissive:0x3a8a20}),sx*.16,.1,.36,head);add(new THREE.ConeGeometry(.1,.4,6),mm(HC(0x1c1d2a)),0,.45,-.1,head).rotation.x=-.5;
    for(const sx of[-1,1])add(new THREE.ConeGeometry(.05,.35,4),mm(0x9dff6a),sx*.46,.5,.2,torso).rotation.x=Math.PI/2}
  if(bt==='sumire'){add(G_head,skin,0,0,0,head);eyes(.05,.36);const hair=mm(HC(0x6a3a2a));add(new THREE.SphereGeometry(.45,16,10,0,TAU,0,Math.PI*.55),hair,0,.03,-.03,head);
    add(new THREE.CylinderGeometry(.62,.62,.05,20),mm(0xd8c08a),0,.3,0,head);add(new THREE.CylinderGeometry(.32,.38,.22,16),mm(0xd8c08a),0,.42,0,head);
    for(const [sx,c] of[[-.25,0xff6fb5],[.2,0xffd84d]])add(new THREE.SphereGeometry(.09,8,6),mm(c),sx,.42,.3,head);hL.scale.setScalar(1.7);hR.scale.setScalar(1.7);hL.material=hR.material=mm(0x4caf50)}
  if(bt==='tarubo'){bodyM.visible=false;const bar=add(new THREE.CylinderGeometry(.5,.5,1.0,16),body,0,.36,0,torso);for(const y of[.05,.66])add(new THREE.CylinderGeometry(.52,.52,.07,16),metal,0,y,0,torso);
    add(new THREE.SphereGeometry(.36,14,10,0,TAU,0,Math.PI*.5),metal,0,-.2,0,head);add(new THREE.BoxGeometry(.4,.1,.06),mm(0xff3b3b,{emissive:0xa01010}),0,-.08,.33,head);
    add(new THREE.CylinderGeometry(.4,.4,.06,16),mm(HC(0x2b2d36)),0,.05,0,head);add(new THREE.ConeGeometry(.28,.3,3),mm(HC(0x2b2d36)),0,.2,0,head).rotation.y=Math.PI;
    for(const sx of[-1,1]){const gun=new THREE.Group();gun.position.set(sx*.58,.4,.25);torso.add(gun);add(new THREE.CylinderGeometry(.07,.07,.55,8),metal,0,0,.2,gun).rotation.x=Math.PI/2;add(new THREE.BoxGeometry(.12,.16,.22),mm(0x6b4a2e),0,-.04,-.12,gun)}}
  if(bt==='hatsue'){rig.scale.set(1.4,1.3,1.4);add(G_head,skin,0,0,0,head);eyes(.05,.36);const hair=mm(HC(0xd8642a));for(let i=0;i<7;i++){const a=i/7*TAU;add(new THREE.SphereGeometry(.2,10,8),hair,Math.cos(a)*.34,.22+Math.sin(i*2)*.05,Math.sin(a)*.3-.05,head)}
    add(new THREE.TorusGeometry(.13,.04,6,12),metal,-.14,.18,.33,head);add(new THREE.TorusGeometry(.13,.04,6,12),metal,.14,.18,.33,head);
    const gun=new THREE.Group();gun.position.set(.55,.36,.25);torso.add(gun);add(new THREE.BoxGeometry(.28,.3,.55),mm(0x8a7a5a),0,0,0,gun);add(new THREE.CylinderGeometry(.1,.14,.3,8),metal,0,0,.4,gun).rotation.x=Math.PI/2}
  if(bt==='gantetsu'){rig.scale.set(1.6,1.45,1.6);add(G_head,skin,0,0,0,head).scale.set(1,1.05,1);for(const sx of[-1,1]){add(G_eye,white,sx*.15,.02,.36,head);add(G_pup,dark,sx*.15,.02,.43,head)}
    add(new THREE.BoxGeometry(.7,.24,.6),mm(HC(0x1c1d2a)),0,.36,0,head);for(const sx of[-1,1])add(new THREE.CylinderGeometry(.05,.05,.25,6),metal,sx*.44,-.05,0,head).rotation.z=Math.PI/2;
    const hm=new THREE.Group();hm.position.set(.5,.4,.2);torso.add(hm);add(new THREE.CylinderGeometry(.05,.05,1.2,6),mm(0x6b4a2e),0,.3,.1,hm);add(new THREE.BoxGeometry(.5,.36,.36),metal,0,.95,.1,hm)}
  if(bt==='ayame'){add(G_head,skin,0,0,0,head);eyes(.05,.36);const hair=mm(HC(0xffd27a));add(new THREE.SphereGeometry(.45,16,10,0,TAU,0,Math.PI*.55),hair,0,.03,-.03,head);add(new THREE.SphereGeometry(.2,12,10),hair,0,.38,-.3,head);
    add(new THREE.ConeGeometry(.42,.5,14),body,0,-.15,0,torso);const um=new THREE.Group();um.position.set(.45,.4,.25);torso.add(um);add(new THREE.CylinderGeometry(.03,.03,.5,6),mm(0x6b4a2e),0,0,-.1,um).rotation.x=Math.PI/2;
    add(new THREE.ConeGeometry(.13,.8,10),mm(HC(0xff8ac0)),0,0,.5,um).rotation.x=Math.PI/2;add(new THREE.TorusGeometry(.08,.025,6,10,Math.PI),mm(0x6b4a2e),0,-.06,-.36,um)}
  if(bt==='shinobu'){add(G_head,skin,0,-.02,0,head);eyes(.0,.36);const hood=mm(HC(0x4caf50));add(new THREE.SphereGeometry(.5,16,12,0,TAU,0,Math.PI*.6),hood,0,.04,-.05,head);
    for(const sx of[-1,1]){add(new THREE.SphereGeometry(.16,12,10),white,sx*.2,.42,.18,head);add(new THREE.SphereGeometry(.07,8,6),dark,sx*.2,.46,.31,head)}
    add(new THREE.TorusGeometry(.18,.06,6,14,Math.PI*1.5),hood,0,.2,-.62,torso);add(new THREE.ConeGeometry(.05,.3,4),metal,.5,.4,.3,torso).rotation.x=Math.PI/2}
  if(bt==='sabo'){add(new THREE.SphereGeometry(.46,16,12),mm(HC(0x5cb83a)),0,0,0,head).scale.set(1,1.1,1);eyes(.05,.36);const sp=mm(0xf2eedd);
    for(let i=0;i<10;i++){const a=i/10*TAU,yy=(i%2?.2:-.05);const c=add(new THREE.ConeGeometry(.04,.18,4),sp,Math.cos(a)*.44,yy,Math.sin(a)*.44,head);c.rotation.z=-Math.cos(a)*Math.PI/2;c.rotation.x=Math.sin(a)*Math.PI/2}
    add(new THREE.SphereGeometry(.14,10,8),mm(0xff6fb5),0,.52,0,head);for(const sx of[-1,1])add(new THREE.CylinderGeometry(.12,.12,.4,8),skin,sx*.55,.6,0,torso)}
  if(typeof mkModel2==='function')mkModel2(bt,form,{g,add,mm,head,torso,rig,bodyM,hL,hR,legL,legR,skin,body,dark,white,metal,HC,eyes,SK});
  if(SK.crown){const cr=new THREE.Mesh(new THREE.CylinderGeometry(.28,.24,.2,8,1,true),mm(0xffd84d,{emissive:0x7a5a00,side:THREE.DoubleSide}));cr.position.y=.62;head.add(cr)}
  if(SK.cape&&bt!=='vlad'){const cp=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.0),mm(0xff5fa2,{side:THREE.DoubleSide}));cp.position.set(0,.3,-.42);cp.rotation.x=.18;torso.add(cp)}
  // 本家のような黒い輪郭線（すき通る物・うすい板にはつけない）
  const outl=[],ms=[];g.traverse(o=>{if(o.isMesh&&!o.material.transparent&&o.geometry.type!=='PlaneGeometry'&&o.material.side!==THREE.DoubleSide)ms.push(o)});for(const o of ms){const h=new THREE.Mesh(o.geometry,OUTLINE);h.raycast=()=>{};o.add(h);outl.push(h)}
  const rg=new THREE.RingGeometry(isMe?.6:.62,isMe?.86:.78,36);rg.rotateX(-Math.PI/2);const ringM=MB(isMe?0x7dff7a:ringCol,{transparent:true,opacity:.9,depthWrite:false});
  const ringMesh=new THREE.Mesh(rg,ringM);ringMesh.position.y=.04;g.add(ringMesh);
  const shield=new THREE.Mesh(new THREE.SphereGeometry(1.05,18,12),new THREE.MeshBasicMaterial({color:0x9fe0ff,transparent:true,opacity:.22,depthWrite:false}));shield.position.y=.9;shield.visible=false;g.add(shield);
  const hyp=new THREE.Mesh(new THREE.TorusGeometry(.9,.07,8,32),new THREE.MeshBasicMaterial({color:0xc264ff,transparent:true,opacity:.8}));hyp.rotation.x=Math.PI/2;hyp.position.y=.2;hyp.visible=false;g.add(hyp);
  scene.add(g);return{g,rig,torso,legL,legR,head,hL,hR,mats,ringM,shield,hyp,outl}}

// ユキのクマ
function mkBear(team,big){const g=new THREE.Group(),fur=MC(0x7a4a26),light=MC(0xc9a07a);const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
  add(new THREE.SphereGeometry(.75,16,12),fur,0,.8,0).scale.set(1,1.05,1.1);add(new THREE.SphereGeometry(.5,14,10),fur,0,1.55,.35);add(new THREE.SphereGeometry(.22,10,8),light,0,1.45,.78);
  for(const sx of[-1,1]){add(new THREE.SphereGeometry(.16,10,8),fur,sx*.34,1.95,.3);add(new THREE.SphereGeometry(.07,8,6),MC(0x111111),sx*.18,1.65,.78);add(new THREE.SphereGeometry(.26,10,8),fur,sx*.6,.55,.45)}
  const rg=new THREE.RingGeometry(.9,1.05,32);rg.rotateX(-Math.PI/2);const ring=new THREE.Mesh(rg,MB(team===0?0x3aa0ff:0xff4d5a,{transparent:true,opacity:.8,depthWrite:false}));ring.position.y=.04;g.add(ring);
  g.scale.setScalar(big?1.25:1);scene.add(g);return g}

