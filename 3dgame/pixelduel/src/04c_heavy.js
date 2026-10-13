// ===================== ヘビー（5丁）：ロケットランチャーなど =====================
// ダメージは「当時（バージョン15のころ・体力100）」に合わせた値：
//  2018年のWikiにある デモリションスケルトン（Demolition Exoskeleton・パワー33）・破壊システム（Destruction System・37）・
//  ラストクリスマス（Christmas Ultimatum・30）は、スナイパーと同じ「パワー×4.55」（ワンショット33→150 と同じ割合）。
//  ロケットジャンパー（2018年はレアの最初の形）と、あと（16.5）に出たポータルキャノンは「最新×0.755」（スナイパーと同じ倍率）
//  （ロケットジャンパー レア73→55、ポータルキャノン 222→168）。連射・装弾数・機動力も2018年の版（ないものは最新）。
//  ロケットジャンプ：ロケットジャンパーとデモリションスケルトンは自分にダメージなし、破壊システムとラストクリスマスは少しだけ。
//  ポータルキャノンはロケットジャンプなし（ためきるとポータル）。1回の攻撃でへる体力は最大90のまま（4発同時も合わせて90まで）。
const HEAVY_DATA={
 rjumper:{jp:'ロケットジャンパー',en:'Rocket Jumper',short:'ロケジャン',dmg:55,rof:87,cap:12,mob:100,reload:2.2,speed:34,rad:2.8,rj:1,self:0,proj:'rocket',col:'#d82a2a',cross:'rocket',
   tag:'ロケットジャンプがいちばん高い（自分はダメージなし）・範囲ダメージ・速い連射'},
 demo:{jp:'デモリションスケルトン',en:'Demolition Exoskeleton',short:'デモリション',dmg:150,multi:4,rof:75,cap:8,mob:75,reload:2.8,speed:30,rad:2.2,rj:.85,self:0,proj:'mini',zoom:2,scope:'exo',col:'#2ab0e0',cross:'rocket',
   tag:'両肩から4発同時のロケット・ロケットジャンプ（自分はダメージなし）・2倍スコープ'},
 destr:{jp:'破壊システム',en:'Destruction System',short:'破壊システム',dmg:168,rof:60,cap:6,mob:65,reload:3,speed:58,rad:3.2,rj:.8,self:.06,proj:'missile',zoom:4,scope:'destr',col:'#d8a820',cross:'rocket',
   tag:'スコープつきの速いミサイル・ロケットジャンプ（少しダメージ）・4倍スコープ'},
 xmas:{jp:'ラストクリスマス',en:'Christmas Ultimatum',short:'ラスクリ',dmg:137,rof:54,cap:8,mob:50,reload:3,speed:26,rad:3,rj:.8,self:.1,proj:'tree',cluster:5,col:'#2a8a3a',cross:'rocket',
   tag:'ツリーの弾が当たると、まわりに小さな爆発が広がる・ロケットジャンプ（少しダメージ）'},
 portal:{jp:'ポータルキャノン',en:'Portal Cannon',short:'ポータル',dmg:168,rof:67,cap:100,mob:50,reload:2.6,speed:32,rad:2.6,rj:0,self:.06,proj:'orb',charge:1.2,col:'#40e040',cross:'portal',
   tag:'おしっぱなしでためうち。ためきると当たった所にポータルができ、2つ出すと行き来できる'}};
for(const k in HEAVY_DATA){const d=HEAVY_DATA[k];d.cat='heavy';d.head=1;d.rate=1/(.545+(d.rof-60)*.01429);d.weight=+(1+(85-d.mob)/100).toFixed(2);d.res=d.cap*3;d.range=140;WEAPONS[k]=d;WIDS.push(k)}
const HEAVIES=Object.keys(HEAVY_DATA);
const isHeavy=w=>!!WEAPONS[w]&&WEAPONS[w].cat==='heavy',isGun=w=>isSniper(w)||isHeavy(w)||isPrimary(w)||isBackup(w)||isSpecial(w);   // isPrimary は 04d_primary
// ---- 形（-z が銃口の向き。グリップのあたりが原点） ----
// ロケットジャンパー：うしろが赤、前に灰色の大きな四角い筒（角に黄色と黒のしま、口の奥に赤い光）
function rjumperModel(){const g=new THREE.Group(),R='#c81e1e',RD='#8a1414',GR='#8e9298',GD='#55595f',BK='#151517',Y='#f0c820';
  bx(g,.15,.2,.34,0,-.02,.36,R);bx(g,.155,.05,.3,0,.07,.36,RD);for(const z of[.26,.38,.48])bx(g,.16,.03,.03,0,-.02,z,BK);bx(g,.16,.2,.04,0,-.02,.54,BK);   // うしろの赤い本体
  bx(g,.07,.19,.09,0,-.17,.24,GD);bx(g,.04,.06,.04,0,-.1,.17,BK);bx(g,.1,.18,.13,0,-.17,.02,RD);bx(g,.105,.04,.135,0,-.1,.02,BK);   // 握り・引き金・赤いマガジン
  bx(g,.2,.2,.08,0,.07,.18,'#c8ccd0');bx(g,.14,.14,.02,0,.07,.225,BK);   // うしろの銀の口
  bx(g,.3,.3,.74,0,.07,-.24,GR);bx(g,.305,.05,.74,0,.205,-.24,GD);bx(g,.305,.05,.74,0,-.065,-.24,GD);bx(g,.31,.31,.04,0,.07,.12,BK);   // 灰色の筒
  for(const sx of[-1,1])for(const sy of[-1,1])for(let i=0;i<3;i++)bx(g,.04,.04,.07,sx*.14,.07+sy*.14,-.52+i*.08,i%2?BK:Y);   // 角の黄色と黒のしま
  bx(g,.34,.34,.08,0,.07,-.64,BK);bx(g,.24,.24,.02,0,.07,-.685,'#2a2a2e');bx(g,.08,.08,.02,0,.07,-.695,emat('#ff2a2a'));   // 前の口
  g.userData.muzzle=new THREE.Vector3(0,.07,-.72);return g}
// デモリションスケルトン：手に持つコントローラー、背中の箱、両肩の発射台（それぞれ2本の白い筒）
function exoPod(){const p=new THREE.Group(),B='#1a1c24',C='#2ab0e0',W='#e8e8ec';
  bx(p,.24,.5,.46,0,0,0,B);bx(p,.25,.07,.46,0,.255,0,C);bx(p,.25,.07,.46,0,-.255,0,C);for(const s of[-1,1])bx(p,.02,.3,.3,s*.125,0,.04,C);
  for(const y of[.125,-.125]){bx(p,.2,.2,.2,0,y,-.32,W);bx(p,.13,.13,.02,0,y,-.425,'#0e0e10');bx(p,.205,.03,.03,0,y+.085,-.26,'#5a5e66')}
  bx(p,.255,.04,.12,0,0,-.17,'#f0c820');for(let i=0;i<3;i++)bx(p,.256,.04,.03,0,0,-.21+i*.04,'#151517');bx(p,.04,.04,.02,.06,.17,.235,emat('#ff3030'));bx(p,.04,.04,.02,-.04,.17,.235,emat('#30e060'));return p}
function demoModel(){const g=new THREE.Group(),C='#2ab0e0',GY='#9a9ea6',B='#1a1c24';
  const ctrl=new THREE.Group();g.add(ctrl);bx(ctrl,.34,.1,.16,0,-.02,0,GY);bx(ctrl,.35,.04,.17,0,.04,0,B);
  for(const s of[-1,1]){bx(ctrl,.08,.14,.12,s*.19,-.07,.02,B);bx(ctrl,.04,.05,.13,s*.15,.01,0,C)}
  for(let i=0;i<3;i++)for(let j=0;j<2;j++)bx(ctrl,.035,.02,.035,-.05+i*.05,.065,-.03+j*.05,(i+j)%2?'#151517':'#f0c820');bx(ctrl,.03,.03,.03,.11,.07,0,emat('#ff3030'));
  const pack=new THREE.Group();g.add(pack);pack.position.set(0,.3,.5);   // 背中の箱
  bx(pack,.42,.46,.2,0,0,0,'#3a3e46');bx(pack,.3,.3,.21,0,.02,0,GY);for(let i=0;i<4;i++)for(let j=0;j<3;j++)bx(pack,.04,.04,.22,-.09+i*.06,-.06+j*.06,0,B);bx(pack,.06,.04,.22,0,.18,0,emat('#ff3030'));bx(pack,.43,.06,.21,0,-.2,0,C);
  const arms=new THREE.Group();g.add(arms);for(const s of[-1,1]){bx(arms,.08,.08,.3,s*.36,.3,.32,B);bx(arms,.09,.09,.09,s*.36,.3,.18,C)}   // 箱と発射台をつなぐ腕
  const podL=exoPod(),podR=exoPod();podL.position.set(-.52,.42,.12);podR.position.set(.52,.42,.12);g.add(podL);g.add(podR);
  g.userData.parts={ctrl,pack,arms,podL,podR};g.userData.muzzle=new THREE.Vector3(.52,.42,-.33);return g}
// 破壊システム：黒い長い体に金のふちと赤い線、灰色の前、上にスコープと青い結晶
function destrModel(){const g=new THREE.Group(),BK='#1c1c20',GO='#d8a820',RE='#d02020',GY='#8e9298',WH='#e8e8ec';
  bx(g,.14,.2,.42,0,-.01,.34,BK);bx(g,.145,.03,.42,0,.09,.34,GO);bx(g,.145,.03,.42,0,-.1,.34,GO);bx(g,.15,.22,.04,0,-.01,.56,GO);   // ストック
  bx(g,.07,.18,.09,0,-.17,.18,'#2a2a2e');bx(g,.03,.05,.03,0,-.1,.11,RE);   // 握りと赤い引き金
  bx(g,.2,.24,.66,0,.02,-.2,BK);bx(g,.205,.03,.66,0,.145,-.2,GO);bx(g,.206,.045,.6,0,-.04,-.22,RE);bx(g,.205,.03,.66,0,-.1,-.2,GO);   // 本体
  bx(g,.15,.08,.34,0,-.14,-.28,GY);for(let i=0;i<4;i++)bx(g,.155,.02,.02,0,-.14,-.16-i*.08,'#4a4e54');   // 下の機械
  bx(g,.15,.17,.36,0,.03,-.7,GY);bx(g,.155,.03,.36,0,.125,-.7,GO);bx(g,.16,.04,.3,0,-.02,-.7,BK);   // 前
  bx(g,.11,.11,.05,0,.03,-.9,'#2a2a2e');bx(g,.07,.07,.12,0,.03,-.96,WH);bx(g,.072,.025,.04,0,.03,-.99,RE);   // ミサイルの先
  bx(g,.09,.1,.34,0,.2,-.12,'#2a2a2e');bx(g,.095,.02,.34,0,.255,-.12,GO);bx(g,.1,.11,.04,0,.2,-.3,'#151517');bx(g,.07,.07,.02,0,.2,-.32,tmat('#80c8ff',.7));   // スコープ
  const cr=new THREE.Group();g.add(cr);cr.position.set(0,.31,.1);cr.rotation.set(.6,.6,0);bx(cr,.09,.09,.09,0,0,0,tmat('#40c8ff',.85));bx(cr,.05,.05,.05,0,0,0,emat('#d0f4ff'));g.userData.gem=cr;   // 青い結晶
  g.userData.muzzle=new THREE.Vector3(0,.03,-1.02);return g}
// ラストクリスマス：緑の体、うしろはキャンディの赤白、光る電球、木の握り
function xmasModel(){const g=new THREE.Group(),GN='#2a8a3a',GD='#1c5e28';
  bx(g,.22,.22,.46,0,0,.22,GN);for(let i=0;i<6;i++)bx(g,.23,.23,.04,0,0,.47-i*.045,i%2?'#ffffff':'#e02020');   // うしろ
  for(let i=0;i<6;i++)bx(g,.06,.03,.05,0,.125,.3-i*.06,i%2?'#ffffff':'#e02020');   // 上のしま
  bx(g,.07,.19,.09,0,-.18,.12,'#8a5a2a');bx(g,.03,.05,.03,0,-.11,.06,'#e02020');bx(g,.12,.16,.08,0,-.12,.5,'#8e9298');   // 木の握り・引き金・肩あて
  bx(g,.27,.27,.56,0,.02,-.32,GD);bx(g,.275,.04,.56,0,-.08,-.32,GN);for(const s of[-1,1])bx(g,.01,.02,.5,s*.14,.06,-.3,'#151517');   // 前の筒とコード
  for(const [c,z] of[['#3a7aff',-.12],['#e040ff',-.26],['#ff4aa0',-.4],['#ff9a20',-.54]]){bx(g,.11,.11,.11,0,.19,z,emat(c));bx(g,.06,.06,.06,.15,.02,z+.05,emat(c));bx(g,.06,.06,.06,-.15,.06,z-.03,emat(c))}   // 電球
  bx(g,.3,.3,.06,0,.02,-.62,'#14401c');bx(g,.2,.2,.02,0,.02,-.655,'#060806');g.userData.muzzle=new THREE.Vector3(0,.02,-.7);return g}
// ポータルキャノン：白い体、光る緑の芯、上に緑のタンク、前に黒いつめ（ためると回る）
function portalModel(){const g=new THREE.Group(),W='#e8eaee',S='#b4b8c0';
  bx(g,.16,.2,.46,0,0,.18,W);bx(g,.165,.04,.46,0,.08,.18,S);bx(g,.005,.06,.12,.083,0,.28,emat('#60ff60'));bx(g,.17,.06,.06,0,-.05,.4,S);
  bx(g,.07,.18,.09,0,-.17,.24,S);bx(g,.03,.05,.03,0,-.1,.17,'#e02020');bx(g,.06,.04,.06,0,-.12,-.02,'#3a8aff');
  bx(g,.12,.12,.2,0,0,-.14,emat('#9aff60'));bx(g,.19,.19,.24,0,0,-.14,tmat('#a0ff80',.35));
  bx(g,.22,.22,.08,0,0,-.3,W);bx(g,.1,.12,.24,0,.19,.06,tmat('#40e040',.75));bx(g,.12,.03,.26,0,.26,.06,S);bx(g,.12,.03,.26,0,.12,.06,S);
  for(const s of[-1,1])bx(g,.03,.03,.36,s*.1,.05,.02,emat('#60f060'));
  const cl=new THREE.Group();cl.position.set(0,0,-.36);g.add(cl);for(let i=0;i<3;i++){const a=new THREE.Group();a.rotation.z=i*TAU/3;cl.add(a);bx(a,.05,.2,.05,0,.12,-.06,'#1a1a1a');bx(a,.05,.05,.16,0,.21,-.15,'#1a1a1a');bx(a,.05,.09,.05,0,.17,-.24,'#1a1a1a')}
  g.userData.spin=cl;g.userData.muzzle=new THREE.Vector3(0,0,-.5);return g}
function heavyModel(w){const m=w==='rjumper'?rjumperModel():w==='demo'?demoModel():w==='destr'?destrModel():w==='xmas'?xmasModel():portalModel();m.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.castShadow=true});return m}
function gunModel(w){return isHeavy(w)?heavyModel(w):isPrimary(w)?primaryModel(w):isBackup(w)?backupModel(w):isSpecial(w)?specialModel(w):sniperModel(w)}
// ---- 手に持ったヘビー（画面の右下。デモリションは手にコントローラー、発射台は画面の上の左右） ----
function setViewHeavy(w){const m=heavyModel(w),hand=new THREE.Group();hand.add(m);VIEW.g.add(hand);VIEW.parts.r=hand;VIEW.parts.m=m;m.scale.setScalar(.5);
  if(w==='demo'){const P=m.userData.parts;P.pack.visible=false;P.arms.visible=false;bx(P.ctrl,.1,.1,.1,-.19,-.1,.06,'#e8b88a');bx(P.ctrl,.1,.1,.1,.19,-.1,.06,'#e8b88a');
    for(const [p,s] of[[P.podL,-1],[P.podR,1]]){p.position.set(s*2.35-.28,1.1,-1.0);p.rotation.set(.04,s*.18,s*-.06);p.scale.setScalar(.85);p.userData.y=p.position.y}hand.userData.base=[.14,-.24,-.6,0]}
  else{bx(m,.11,.12,.13,0,-.13,.2,'#e8b88a');bx(m,.11,.11,.12,.02,-.1,-.2,'#e8b88a');hand.userData.base=[.27,-.27,-.62,.08]}
  const b=hand.userData.base;hand.position.set(b[0],b[1],b[2])}
function updViewHeavy(dt,P,shotT,relK,drawK){const k=Math.exp(-shotT*7)*(shotT<1?1:0),r=Math.sin(relK*Math.PI),b=P.r.userData.base;
  P.r.position.set(b[0]+r*.05,b[1]-r*.18-drawK*.45+k*.02,b[2]+k*.16);P.r.rotation.set(.03+k*.18-r*.45+drawK*-.6,b[3]+r*.35,r*.3);
  const u=P.m.userData;if(u.spin)u.spin.rotation.z+=dt*(1.5+ME.chg*22);if(u.gem)u.gem.rotation.y+=dt*1.5;
  if(u.parts)for(const p of[u.parts.podL,u.parts.podR])p.position.y=p.userData.y+k*.08-drawK*.6-r*.3}
// 体に持たせる（3人称）。デモリションは発射台を肩の上、箱を背中に
function placeCharHeavy(m,w){m.scale.setScalar(.62);m.position.set(.13,-.06,-.32);if(w!=='demo')return;const P=m.userData.parts;m.position.set(0,-.08,-.28);
  P.pack.position.set(0,.15,.95);P.arms.position.set(0,.02,.43);P.podL.position.set(-.62,.45,.6);P.podR.position.set(.62,.45,.6)}
