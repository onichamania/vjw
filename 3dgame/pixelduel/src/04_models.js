// ===================== 武器とキャラクターの見た目 =====================
// 武器の数値は Pixel Gun 3D Wiki の2018年7月ごろ（バージョン14〜15.0）の版から：
//  力の拳（Power Fists）      攻撃力 30・攻撃速度 89・機動力 85、相手を遅くする・アーマーがふえる
//  コンバットナイフ            攻撃力 5 ・攻撃速度 89・機動力 70
//  ダークフォースサーベル      攻撃力 14・攻撃速度 89・機動力 100、相手を燃やす
// 実際のダメージは「攻撃力×1.75」（体力100に対して、力の拳は2発）。重さは力の拳を1として、ナイフ1.1・サーベル0.9。
const WEAPONS={
 fists:{jp:'力の拳',en:'Power Fists',leth:30,dmg:52.5,head:1.39,rate:.5,range:2.7,weight:1,mob:85,slow:{k:.6,t:1.5},armor:25,col:'#2a52c8'},
 knife:{jp:'コンバットナイフ',en:'Combat Knife',leth:5,dmg:8.75,head:1.42,rate:.5,range:2.5,weight:1.1,mob:70,col:'#c8c8c8'},
 saber:{jp:'ダークフォースサーベル',en:'Dark Force Saber',leth:14,dmg:24.5,head:1.4,rate:.5,range:3,weight:.9,mob:100,burn:{n:3,dmg:3,iv:1},col:'#e02020'}};
const WIDS=Object.keys(WEAPONS);
const MC={};const mat=c=>MC[c]||(MC[c]=new THREE.MeshLambertMaterial({color:c}));
const emat=c=>MC['e'+c]||(MC['e'+c]=new THREE.MeshBasicMaterial({color:c}));
function bx(par,w,h,d,x,y,z,m){const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m);me.position.set(x,y,z);par.add(me);return me}
// ---- 武器の形（手に持ったときの向き：-zが前） ----
function gauntlet(side){const g=new THREE.Group();
  bx(g,.2,.2,.46,0,0,.12,'#1f3fb0');for(const z of[-.06,.12,.3])bx(g,.22,.06,.06,0,0,z,'#e8b830');bx(g,.24,.24,.06,0,0,.36,'#e8b830');   // うで
  bx(g,.06,.12,.24,side*.12,.02,.14,'#3ad8f0');   // 光る線
  bx(g,.26,.24,.24,0,.01,-.2,'#2448c0');for(let k=0;k<4;k++)bx(g,.055,.06,.06,-.09+k*.06,.1,-.3,'#f0c840');bx(g,.24,.05,.06,0,-.08,-.31,'#f0c840');   // こぶし
  bx(g,.1,.1,.03,0,.03,-.08,'#d82a2a');bx(g,.05,.05,.03,0,.03,-.06,'#ff8a8a');bx(g,.07,.16,.18,-side*.16,0,-.18,'#e8b830');   // 宝石と親指
  return g}
function knifeModel(){const g=new THREE.Group();bx(g,.06,.06,.24,0,0,.1,'#2a2a2e');bx(g,.07,.07,.03,0,0,.0,'#3a3a40');for(const z of[.04,.14])bx(g,.065,.02,.02,0,.032,z,'#e8e8e8');
  bx(g,.16,.04,.04,0,0,-.04,'#3a3a40');bx(g,.025,.07,.36,0,.01,-.24,'#c8ccd2');bx(g,.02,.025,.36,0,-.03,-.24,'#f2f4f6');bx(g,.02,.03,.08,0,.035,-.43,'#c8ccd2');
  for(let k=0;k<4;k++)bx(g,.03,.02,.025,0,.05,-.1-k*.06,'#5a5e64');return g}
function saberModel(){const g=new THREE.Group();bx(g,.07,.07,.14,0,0,.12,'#9a9aa0');bx(g,.075,.075,.14,0,0,-.02,'#1e1e22');for(const z of[.08,.15])bx(g,.03,.03,.03,.04,0,z,'#e82020');bx(g,.09,.04,.04,0,0,-.1,'#5a5a60');
  const bl=bx(g,.07,.07,.95,0,0,-.58,emat('#ff2a2a'));bx(g,.035,.035,.95,0,0,-.58,emat('#ffd0b0'));
  const glow=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,1.02),new THREE.MeshBasicMaterial({color:0xff2010,transparent:true,opacity:.28,depthWrite:false}));glow.position.set(0,0,-.58);g.add(glow);g.userData.glow=glow;return g}
function weaponModel(w){return w==='fists'?null:w==='knife'?knifeModel():saberModel()}
// ---- 手に持った武器（画面の右下） ----
const VIEW={g:new THREE.Group(),w:null,parts:{},swing:0,swingN:0,bob:0,shotT:9,relK:0,drawK:0};
vscene.add(VIEW.g);vscene.add(new THREE.HemisphereLight(0xfff4dc,0x8a7a5a,.9));{const d=new THREE.DirectionalLight(0xffffff,.6);d.position.set(1,2,1);vscene.add(d)}
function setViewWeapon(w){VIEW.g.clear();VIEW.w=w;VIEW.parts={};
  if(WEAPONS[w].cat==='sniper')setViewSniper(w);
  else if(WEAPONS[w].cat==='heavy')setViewHeavy(w);
  else if(WEAPONS[w].cat==='primary')setViewPrimary(w);
  else if(w==='fists'){for(const s of[-1,1]){const gg=gauntlet(s);gg.scale.setScalar(.62);gg.position.set(s*.36,-.3,-.66);gg.rotation.set(.18,s*.22,0);VIEW.g.add(gg);VIEW.parts[s<0?'l':'r']=gg}}
  else{const m=weaponModel(w),hand=new THREE.Group(),piv=new THREE.Group();piv.rotation.order='ZXY';piv.add(m);bx(piv,.1,.1,.13,0,-.01,w==='knife'?.1:.06,'#e8b88a');hand.add(piv);VIEW.g.add(hand);VIEW.parts.r=hand;VIEW.parts.p=piv;
    if(w==='knife'){hand.position.set(.3,-.3,-.55);piv.rotation.set(1.1,0,.35)}else{hand.position.set(.32,-.42,-.62);piv.rotation.set(1.0,0,.45)}}}
// 攻撃・歩くゆれの動き（毎フレーム）
function updView(dt,moving,attackT){VIEW.bob+=dt*(moving?9:2);const b=Math.sin(VIEW.bob)*(moving?.018:.004),bc=Math.abs(Math.cos(VIEW.bob))*(moving?.012:.002);
  VIEW.g.position.set(b,bc,0);const w=VIEW.w,P=VIEW.parts,a=clamp(attackT/.3,0,1),s=Math.sin(a*Math.PI);
  if(WEAPONS[w].cat==='sniper'){if(P.r)updViewSniper(dt,P,VIEW.shotT,VIEW.relK,VIEW.drawK);return}
  if(WEAPONS[w].cat==='heavy'){if(P.r)updViewHeavy(dt,P,VIEW.shotT,VIEW.relK,VIEW.drawK);return}
  if(WEAPONS[w].cat==='primary'){if(P.r)updViewPrimary(dt,P,VIEW.shotT,VIEW.relK,VIEW.drawK);return}
  if(w==='fists'){for(const k of['l','r']){const p=P[k];if(!p)continue;const act=(VIEW.swingN%2===0)===(k==='r');const base=k==='r'?.36:-.36;p.position.set(base*(act?1-s*.6:1),-.3+(act?s*.12:0),-.66-(act?s*.5:0))}}
  else if(w==='knife'&&P.r){P.r.position.set(.3-s*.18,-.3+s*.06,-.55-s*.3);P.p.rotation.set(1.1-s*.95,0,.35-s*.25)}
  else if(w==='saber'&&P.r){P.r.position.set(.32-s*.36,-.42+s*.14,-.62-s*.1);P.p.rotation.set(1.0-s*.45,0,.45-s*1.5)}
  VIEW.g.position.y-=VIEW.drawK*.4}
// ---- キャラクター（ピクセルガン風の四角い体） ----
const SKINS=[{n:'ピクセルマン',skin:'#e8b88a',hair:'#5a3a1a',shirt:'#3a6ad8',pants:'#2a2a4a',shoe:'#3a2a1a'},{n:'カウボーイ',skin:'#d8a070',hair:'#7a4a20',shirt:'#c84a2a',pants:'#3a4a7a',shoe:'#5a3a1a',hat:'#7a4a20'},
 {n:'シェリフ',skin:'#e8c098',hair:'#3a2a1a',shirt:'#e8d8a8',pants:'#4a3a2a',shoe:'#2a1a10',hat:'#3a2a1a',star:1},{n:'ニンジャ',skin:'#e0b080',hair:'#1a1a1a',shirt:'#2a2a2e',pants:'#1e1e22',shoe:'#111',mask:'#1a1a1a'},
 {n:'ゾンビ',skin:'#7ab06a',hair:'#3a5a2a',shirt:'#5a7a8a',pants:'#3a4a3a',shoe:'#2a2a2a'},{n:'ロボ',skin:'#a8b0b8',hair:'#6a7078',shirt:'#5a6a7a',pants:'#3a4048',shoe:'#2a2e34',visor:1}];
function faceTex(sk){return ptex(8,8,(g)=>{g.fillStyle=sk.skin;g.fillRect(0,0,8,8);g.fillStyle=sk.hair;g.fillRect(0,0,8,2);g.fillRect(0,2,1,2);g.fillRect(7,2,1,2);
  if(sk.visor){g.fillStyle='#3ad8f0';g.fillRect(1,3,6,2)}else{g.fillStyle='#fff';g.fillRect(1,3,2,2);g.fillRect(5,3,2,2);g.fillStyle='#2a3a8a';g.fillRect(2,3,1,2);g.fillRect(5,3,1,2)}
  if(sk.mask){g.fillStyle=sk.mask;g.fillRect(0,5,8,3)}else{g.fillStyle=shadeC(sk.skin,.7);g.fillRect(3,5,2,1);g.fillStyle='#7a3a2a';g.fillRect(2,6,4,1)}},{mip:false})}
function charModel(si,w){const sk=SKINS[si%SKINS.length],g=new THREE.Group(),P={};const M=c=>mat(c);
  const fm=[M(sk.skin),M(sk.skin),M(sk.hair),M(sk.skin),M(sk.skin),new THREE.MeshLambertMaterial({map:faceTex(sk)})];// +x -x +y -y +z -z（顔は-z）
  P.head=new THREE.Group();P.head.position.set(0,1.5,0);g.add(P.head);const hd=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),fm);hd.position.y=.25;P.head.add(hd);
  if(sk.hat){bx(P.head,.78,.06,.78,0,.5,0,sk.hat);bx(P.head,.48,.22,.48,0,.62,0,sk.hat)}
  P.body=bx(g,.5,.75,.26,0,1.125,0,sk.shirt);if(sk.star)bx(g,.12,.12,.02,-.12,1.3,-.14,'#f0c840');
  for(const s of[-1,1]){const a=new THREE.Group();a.position.set(s*.375,1.5,0);g.add(a);bx(a,.25,.75,.26,0,-.375,0,sk.shirt);bx(a,.25,.2,.26,0,-.65,0,sk.skin);P[s<0?'armL':'armR']=a;
    const l=new THREE.Group();l.position.set(s*.125,.75,0);g.add(l);bx(l,.25,.6,.26,0,-.3,0,sk.pants);bx(l,.26,.16,.28,0,-.68,0,sk.shoe);P[s<0?'legL':'legR']=l}
  // 持っている武器
  P.wep=new THREE.Group();P.armR.add(P.wep);P.wep.position.set(0,-.72,-.06);P.gun=new THREE.Group();P.gun.position.set(0,1.36,0);g.add(P.gun);setCharWeapon(P,w);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true}});g.userData.P=P;return g}
function setCharWeapon(P,w){P.wep.clear();P.gun.clear();P.w=w;if(isGun(w)){for(const k of['armL','armR'])P[k].children.filter(c=>c.name==='gl').forEach(c=>P[k].remove(c));const m=gunModel(w);m.scale.setScalar(.62);m.position.set(.13,-.06,-.32);if(isHeavy(w))placeCharHeavy(m,w);P.gun.add(m);P.gun.userData.m=m}
  else if(w==='fists'){for(const k of['armL','armR']){const gg=gauntlet(k==='armL'?-1:1);gg.scale.setScalar(1.15);gg.rotation.x=-Math.PI/2;gg.position.set(0,-.62,0);gg.name='gl';P[k].children.filter(c=>c.name==='gl').forEach(c=>P[k].remove(c));P[k].add(gg)}}
  else{for(const k of['armL','armR'])P[k].children.filter(c=>c.name==='gl').forEach(c=>P[k].remove(c));const m=weaponModel(w);m.scale.setScalar(1.2);m.rotation.x=.3;P.wep.add(m)}}
// 歩き・攻撃の動き
function animChar(g,walk,att,pitch){const P=g.userData.P,s=Math.sin(walk)*.7*Math.min(1,Math.abs(walk)>0?1:0);
  P.legL.rotation.x=s;P.legR.rotation.x=-s;P.armL.rotation.x=-s*.8;P.head.rotation.x=clamp(-pitch,-.6,.6);
  const a=clamp(att/.3,0,1),k=Math.sin(a*Math.PI);P.armL.rotation.z=0;P.armR.rotation.z=0;
  if(isGun(P.w)){const p=clamp(pitch,-.9,.9),r=Math.exp(-att*9)*(att<1?1:0);P.gun.rotation.x=p+r*.25;P.armR.rotation.x=1.45+p;P.armL.rotation.x=1.55+p;P.armL.rotation.z=.42;P.armR.rotation.z=-.12}
  else if(P.w==='fists'){P.armR.rotation.x=k*1.6+s*.4*(1-k);P.armL.rotation.x=.25-s*.4}else P.armR.rotation.x=.4+k*1.8}
// 名前の札
function nameTag(text,col){const c=document.createElement('canvas');c.width=256;c.height=48;const g=c.getContext('2d');g.font='bold 30px sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='#000';g.strokeText(text,128,26);g.fillStyle=col||'#ff6a6a';g.fillText(text,128,26);
  const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:true,depthWrite:false,transparent:true}));s.scale.set(1.25,.234,1);s.renderOrder=10;return s}
// ---- 武器のアイコン（ピクセル画、HUDとメニュー用） ----
function iconURL(w,W,H){if(SNIPER_ICON[w])return SNIPER_ICON[w];W=W||52;H=H||40;const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const p=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
  if(w==='fists'){for(const o of[0,22]){p(4+o,16,18,16,'#000');p(5+o,17,16,14,'#2448c0');p(6+o,17,14,3,'#f0c840');p(5+o,24,16,2,'#e8b830');p(10+o,20,5,4,'#d82a2a');p(6+o,28,4,3,'#3ad8f0');p(8+o,10,10,7,'#000');p(9+o,11,8,6,'#1f3fb0');p(9+o,13,8,1,'#e8b830')}}
  else if(w==='knife'){for(let i=0;i<20;i++){p(10+i,30-i,3,3,'#000')}for(let i=0;i<19;i++){p(11+i,30-i,2,2,i<6?'#2a2a2e':'#d8dce2')}p(15,23,6,3,'#000');p(16,24,4,1,'#5a5a60');for(let i=8;i<18;i+=3)p(12+i,26-i,1,1,'#5a5e64')}
  else if(w==='saber'){for(let i=0;i<26;i++)p(8+i,34-i,4,4,'#000');for(let i=0;i<7;i++)p(9+i,34-i,3,3,i%3?'#2a2a2e':'#9a9aa0');for(let i=7;i<26;i++){p(9+i,34-i,3,3,'#ff2a2a');p(10+i,34-i,1,1,'#ffd0b0')}p(11,30,2,2,'#e82020')}
  else{p(8,14,36,12,'rgba(0,0,0,.5)')}return c.toDataURL()}
// ---- 表彰台の絵（2Dで正面の姿） ----
function drawPodium(cv,si,w){const g=cv.getContext('2d'),sk=SKINS[si%SKINS.length];g.clearRect(0,0,cv.width,cv.height);g.imageSmoothingEnabled=false;const p=(x,y,ww,h,c)=>{g.fillStyle=c;g.fillRect(x,y,ww,h)};
  const X=18,Y=8;p(X,Y,24,24,sk.skin);p(X,Y,24,7,sk.hair);if(sk.visor)p(X+3,Y+11,18,5,'#3ad8f0');else{p(X+4,Y+11,6,5,'#fff');p(X+14,Y+11,6,5,'#fff');p(X+7,Y+11,3,5,'#2a3a8a');p(X+14,Y+11,3,5,'#2a3a8a')}if(sk.mask)p(X,Y+16,24,8,sk.mask);
  if(sk.hat){p(X-5,Y-2,34,4,sk.hat);p(X+2,Y-9,20,8,sk.hat)}p(X,Y+24,24,30,sk.shirt);p(X-12,Y+24,12,30,sk.shirt);p(X+24,Y+24,12,30,sk.shirt);p(X-12,Y+46,12,8,sk.skin);p(X+24,Y+46,12,8,sk.skin);
  p(X,Y+54,12,22,sk.pants);p(X+12,Y+54,12,22,sk.pants);p(X,Y+72,12,5,sk.shoe);p(X+12,Y+72,12,5,sk.shoe);
  if(w==='fists'){p(X-14,Y+44,16,12,'#2448c0');p(X+22,Y+44,16,12,'#2448c0');p(X-14,Y+44,16,3,'#f0c840');p(X+22,Y+44,16,3,'#f0c840')}
  else if(w==='saber'){p(X+28,Y+10,4,38,'#ff2a2a');p(X+29,Y+10,2,38,'#ffd0b0');p(X+27,Y+46,6,8,'#2a2a2e')}else if(w==='knife'){p(X+29,Y+36,3,14,'#d8dce2');p(X+28,Y+48,5,6,'#2a2a2e')}}
