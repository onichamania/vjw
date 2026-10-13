// ===================== 特殊（5つ）：アニメの大鎌・レーザーバウンサー・毒矢・アイスキングのネックレス・テラモーフストーン =====================
// 本家（Pixel Gun 3D Wiki）：みんな「特殊（Special）」の枠。
//  アニメの大鎌 Anime Scythe：ふると赤い波が飛ぶ（飛んでいく・つきぬける・吸血）。連射67・機動75
//  レーザーバウンサー Laser Bouncer：オレンジのレーザー（つきぬける・壁で4回はね返る）。1.53秒ごと・装弾6・機動65
//  毒矢 Poison Darts：吹き矢。少し間をおいて矢が出る（すぐ届く）・毒（4回）・相手を遅くする・とても身軽
//  アイスキングのネックレス Necklace of the Ice King：氷の弾・小さい範囲ダメージ・1.53秒ごと・機動55
//  テラモーフストーン Terramorphing Stone：ねらった所がすぐ大きく爆発（小さい範囲）・3.1秒ごと・持っている間少しずつ回復・近くの壁だと自分もダメージ
// 特殊は「弾の数だけ撃てる（リロードなし）」もの（single）と、マガジンがあるもの（バウンサー）。たおれて復活すると弾はもどる。
const SPECIAL_DATA={
 scythe:{jp:'アニメの大鎌',en:'Anime Scythe',short:'アニメの大鎌',dmg:55,head:1,rof:67,rate:1.0,cap:20,res:0,single:true,mob:75,reload:0,range:42,
   proj:'wave',wave:true,speed:28,life:1.5,steal:.3,cross:'melee',col:'#d01818',tag:'ふると赤い波が飛ぶ・相手をつきぬける・当てたダメージの30%だけ自分が回復'},
 bouncer:{jp:'レーザーバウンサー',en:'Laser Bouncer',short:'バウンサー',dmg:60,head:1.4,rof:67,rate:1.5,cap:6,res:18,mob:65,reload:2.2,range:140,hip:.004,
   pierce:true,ricochet:true,bounce:4,beam:'#ff8a20',cross:'laser',col:'#3ab040',tag:'オレンジのレーザー・相手をつきぬけ、壁で4回はね返る'},
 darts:{jp:'毒矢',en:'Poison Darts',short:'毒矢',dmg:45,head:1.6,rof:70,rate:.85,cap:12,res:0,single:true,mob:95,reload:0,range:90,hip:.002,pre:.2,
   poison:{n:4,dmg:6,iv:1},slow:{k:.7,t:2},cross:'bullet',col:'#7a5a2a',tag:'吹き矢（少し間をおいて出る）・毒（4秒）と遅くする・とても身軽'},
 icenk:{jp:'アイスキングのネックレス',en:'Necklace of the Ice King',short:'アイスキング',dmg:62,head:1,rof:67,rate:1.5,cap:10,res:0,single:true,mob:55,reload:0,range:140,
   proj:'ice',speed:45,rad:1.7,rj:0,self:0,cross:'rocket',col:'#60e0f0',tag:'氷の弾・当たった所の小さい範囲にダメージ'},
 terra:{jp:'テラモーフストーン',en:'Terramorphing Stone',short:'テラモーフ',dmg:95,head:1,rof:31,rate:3.1,cap:8,res:0,single:true,mob:75,reload:0,range:60,
   proj:'terra',speed:400,life:.15,rad:1.8,rj:0,self:.3,heal:4,cross:'portal',col:'#40e070',tag:'ねらった所がすぐ大きく爆発・持っている間は1秒に4回復・近くの壁に撃つと自分もダメージ'}};
for(const k in SPECIAL_DATA){const d=SPECIAL_DATA[k];d.cat='special';d.weight=+(1+(85-d.mob)/100).toFixed(2);WEAPONS[k]=d;WIDS.push(k)}
const SPECIALS=Object.keys(SPECIAL_DATA);
const isSpecial=w=>!!WEAPONS[w]&&WEAPONS[w].cat==='special';
const spOf=w=>SPECIALS.includes(w)?w:'darts';
// ---- 形（-z が前。グリップのあたりが原点） ----
// アニメの大鎌：銀の柄（ばね）、黒と赤のとげのある石突き、白い目のある黒赤の根もと、黒赤の大きな刃（白いふち）
function scytheModel(){const g=new THREE.Group(),RD='#c81818',BK='#1a1012',SV='#d8dadf';
  bx(g,.05,.05,.7,0,0,.05,SV);for(let i=0;i<7;i++)bx(g,.06,.06,.02,0,0,-.05+i*.04,'#8a8e96');bx(g,.07,.07,.12,0,0,.44,BK);bx(g,.05,.05,.08,0,0,.52,RD);   // 柄
  const hd=new THREE.Group();g.add(hd);hd.position.set(0,0,-.36);bx(hd,.08,.16,.14,0,.02,0,BK);bx(hd,.082,.06,.06,0,.03,0,'#ffffff');bx(hd,.084,.03,.03,0,.03,0,'#141414');   // 根もとと白い目
  for(let i=0;i<9;i++){const t=i/8,a=t*1.5,r=.55;bx(hd,.05,.12-t*.06,.12,0,.08+Math.sin(a)*r*.5,-.08+(Math.cos(a)-1)*-r*.35-t*.05,i%3===1?BK:RD);bx(hd,.052,.025,.1,0,.03+Math.sin(a)*r*.5-(.06-t*.03),-.08+(Math.cos(a)-1)*-r*.35-t*.05,'#ffffff')}   // 刃
  const glow=new THREE.Mesh(new THREE.BoxGeometry(.12,.5,.5),tmat('#ff2020',.18));glow.position.set(0,.25,-.5);g.add(glow);g.userData.glow=glow;g.userData.muzzle=new THREE.Vector3(0,.2,-.6);return g}
// レーザーバウンサー：緑の四角い本体に白いわく、黒いストックとサイト、オレンジの光る部分とうしろのオレンジのマガジン（電気のしるし）
function bouncerModel(){const g=new THREE.Group(),GN='#2a8a3a',GD='#1e6a2a',WH='#eaeaea',BK='#141414',OR=emat('#ff8a20');
  bx(g,.09,.15,.24,0,-.02,.44,BK);bx(g,.1,.12,.12,0,.02,.3,emat('#ff9a30'));bx(g,.102,.04,.04,0,.02,.3,'#141414');   // ストックとマガジン
  bx(g,.16,.2,.5,0,0,.0,GN);bx(g,.165,.04,.5,0,.1,.0,WH);bx(g,.165,.04,.5,0,-.1,.0,WH);for(const z of[-.15,.0,.15])bx(g,.166,.03,.04,0,.0,z,GD);   // 本体と白いわく
  bx(g,.16,.18,.36,0,.02,-.43,GN);bx(g,.165,.04,.36,0,.11,-.43,WH);bx(g,.165,.04,.36,0,-.07,-.43,WH);bx(g,.06,.06,.5,0,.02,-.4,OR);bx(g,.12,.12,.04,0,.02,-.62,WH);   // 前とオレンジの光
  bx(g,.07,.07,.2,0,.17,.02,BK);bx(g,.05,.05,.02,0,.17,-.09,emat('#ff8a20'));bx(g,.07,.17,.08,0,-.17,.18,BK);   // サイト・握り
  g.userData.muzzle=new THREE.Vector3(0,.02,-.65);return g}
// 毒矢：茶色の筒に緑の葉、先にオレンジ・紫・水色の羽
function dartsModel(){const g=new THREE.Group(),BR='#7a4a22',BD='#5a3416';
  bx(g,.07,.07,.9,0,0,-.2,BR);for(let i=0;i<6;i++)bx(g,.075,.075,.03,0,0,.18-i*.13,BD);bx(g,.09,.09,.06,0,0,.25,BD);   // 筒
  for(const [z,x,y] of[[.1,.04,.02],[-.05,-.04,.03],[-.2,.03,-.04],[-.35,-.03,.03]])bx(g,.02,.06,.09,x,y,z,'#3a8a2a');   // 葉
  for(const [c,x,y,r] of[['#ff8a20',.05,.08,.3],['#a040e0',-.04,.1,-.2],['#40c8ff',.0,.12,0]]){const f=bx(g,.03,.14,.05,x,y,-.62,c);f.rotation.z=r}   // 羽
  for(let i=0;i<4;i++)bx(g,.05,.05,.05,.0,-.06-i*.05,-.45+i*.02,i%2?'#e8c040':'#c83020');   // ひも
  g.userData.muzzle=new THREE.Vector3(0,0,-.66);return g}
// アイスキングのネックレス：骨の持ち手の先に、氷のひげと水色の角のある氷のどくろ（中に光る水色の目）
function icenkModel(){const g=new THREE.Group(),IC='#7aa8c8',ID='#4a7090',BN='#b8ccd8',CY=emat('#40f0e0');
  bx(g,.05,.05,.3,0,-.05,.15,BN);bx(g,.09,.08,.06,0,-.05,.3,BN);bx(g,.09,.08,.06,0,-.05,.0,BN);   // 骨の持ち手
  bx(g,.26,.24,.24,0,.1,-.12,IC);bx(g,.27,.06,.25,0,.2,-.12,ID);for(const s of[-1,1]){bx(g,.06,.06,.02,s*.06,.11,-.245,CY);bx(g,.04,.12,.04,s*.12,.3,-.1,CY);bx(g,.04,.06,.04,s*.14,.38,-.08,emat('#a0fff0'))}   // どくろ・目・角
  bx(g,.12,.05,.02,0,.03,-.245,'#203040');for(let i=0;i<4;i++)bx(g,.03,.08+i%2*.04,.03,-.06+i*.04,-.05,-.22,tmat('#c0f0ff',.85));   // 口と氷のひげ
  for(const s of[-1,1])bx(g,.04,.12,.04,s*.08,-.12,-.12,tmat('#c0f8ff',.6));   // 下の氷
  g.userData.muzzle=new THREE.Vector3(0,.1,-.28);return g}
// テラモーフストーン：白いパワーグローブ（紫・緑）2つと、その前にうかぶ緑とピンクの石、間に稲妻
function terraModel(){const g=new THREE.Group(),WH='#e8e8f0',PU='#7a3a9a',DK='#2a2a34';
  const glove=s=>{const q=new THREE.Group();q.position.set(s*.32,-.05,.05);g.add(q);bx(q,.18,.14,.22,0,0,0,DK);bx(q,.19,.06,.2,0,.06,0,WH);bx(q,.19,.03,.06,0,-.04,-.06,emat(s<0?'#40ff80':'#ff60e0'));
    for(let i=0;i<4;i++)bx(q,.04,.05,.12,-.06+i*.04,.0,-.16,i%2?WH:PU);return q};
  const L=glove(-1),R=glove(1);const st=new THREE.Group();st.position.set(0,.18,-.32);g.add(st);
  for(const [w,h,d,x,y,c] of[[.12,.3,.1,-.04,0,'#30e060'],[.12,.3,.1,.04,0,'#f060e0'],[.08,.14,.08,-.03,.2,'#60ff90'],[.08,.14,.08,.03,.2,'#ff80f0'],[.06,.1,.06,0,-.2,'#a0ffc0']])bx(st,w,h,d,x,y,0,tmat(c,.9));
  const bolt=new THREE.Group();g.add(bolt);for(const s of[-1,1])for(let i=0;i<4;i++)bx(bolt,.02,.02,.12,s*(.28-i*.07),.0+i*.05,-.05-i*.07,emat(s<0?'#a0ffb0':'#ffb0ff'));
  g.userData.muzzle=new THREE.Vector3(0,.18,-.36);g.userData.glow=st;g.userData.bolt=bolt;g.userData.gl=[L,R];return g}
function specialModel(w){const m=w==='scythe'?scytheModel():w==='bouncer'?bouncerModel():w==='darts'?dartsModel():w==='icenk'?icenkModel():terraModel();m.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.castShadow=true});return m}
// ---- 手に持った特殊（画面の右下。大鎌は右から左へふる、ネックレスは手を上げる、ストーンは両手の前に石） ----
function setViewSpecial(w){const m=specialModel(w),hand=new THREE.Group();hand.add(m);
  if(w!=='icenk'&&w!=='terra')m.traverse(o=>{if(o.isMesh&&o.material.isMeshLambertMaterial){const k=o.material.uuid;if(!VDARK[k]){VDARK[k]=o.material.clone();VDARK[k].color.multiplyScalar(.62)}o.material=VDARK[k]}});   // 氷と石は明るい色のまま
  if(w==='terra'){m.scale.setScalar(.55);hand.userData.base=[0,-.13,-.5,0];for(const q of m.userData.gl)bx(q,.12,.1,.14,0,-.02,.12,'#e8b88a')}
  else if(w==='scythe'){m.scale.setScalar(.55);hand.userData.base=[.3,-.3,-.55,.25];bx(m,.09,.1,.11,0,0,.25,'#e8b88a')}
  else if(w==='icenk'){m.scale.setScalar(.6);m.rotation.y=2.6;hand.userData.base=[.3,-.08,-.62,.1];bx(m,.1,.11,.12,0,-.05,.18,'#e8b88a')}
  else if(w==='darts'){m.scale.setScalar(.55);hand.userData.base=[.1,-.22,-.45,.05];bx(m,.1,.1,.12,0,-.07,.1,'#e8b88a');bx(m,.1,.1,.12,.0,-.07,-.25,'#e8b88a')}
  else{m.scale.setScalar(.5);hand.userData.base=[.25,-.25,-.6,.18];bx(m,.11,.12,.13,0,-.13,.2,'#e8b88a');bx(m,.11,.11,.12,.02,-.08,-.3,'#e8b88a')}
  const b=hand.userData.base;hand.position.set(b[0],b[1],b[2]);hand.rotation.set(.03,b[3],0);VIEW.g.add(hand);VIEW.parts.r=hand;VIEW.parts.m=m}
function updViewSpecial(dt,P,shotT,relK,drawK){const w=VIEW.w,b=P.r.userData.base,u=P.m.userData,r=Math.sin(relK*Math.PI);
  if(w==='scythe'){const a=clamp(shotT/.35,0,1),s=shotT<.35?Math.sin(a*Math.PI):0;P.r.position.set(b[0]-s*.45,b[1]+s*.1-drawK*.4,b[2]-s*.12);P.r.rotation.set(.03-s*.4,b[3]+s*.5,-s*1.3);if(u.glow)u.glow.material.opacity=.18+s*.5;return}
  const k=Math.exp(-shotT*8)*(shotT<1?1:0);
  P.r.position.set(b[0],b[1]-drawK*.4-r*.15+(w==='icenk'?k*-.06:k*.02),b[2]+k*(w==='icenk'?.18:.1));P.r.rotation.set(.03+k*(w==='terra'?.05:.3)-r*.5+drawK*-.6,b[3]+r*.4,0);
  if(u.glow){u.glow.rotation.y+=dt*1.2;const s=1+Math.sin(G.time*5)*.04+k*.3;u.glow.scale.setScalar(s)}if(u.bolt)u.bolt.visible=Math.random()<.7}
