// ===================== スナイパー（5丁） =====================
// ダメージは「当時（バージョン15のころ・体力100）」に合わせた値：
//  2018年7月のWikiにあるのは ワンショット（パワー33・連射49・装弾4・機動55・10倍）と
//  アンチチャンピオンライフル（パワー29・連射56・装弾6・機動65・10倍・壁抜け）。
//  どちらも当時は「強化すれば体に1発でたおせる（アーマーがあっても）」→ ワンショット150、ACRはパワーの比で132。
//  そのあと（15.7〜15.9）に出た ヘビースナイパーライフル・彗星（コメット）・監督（オーバーシアー）は、
//  ワンショットとACRの「当時÷最新」の倍率の平均（0.755）を最新のダメージにかけた
//  （最新：ワンショット181・ACR194、HSR130・彗星124・監督150。頭は体の1.4倍）。
//  連射の数字→1秒あたりの発射数は 60で0.545発・74で0.745発 から（Wikiの実測）。
//  重さは機動力から 1+(85−機動力)/100（力の拳が1。スナイパーは全体的に重め）。
const SNIPER_DATA={
 acr:{jp:'アンチチャンピオンライフル',en:'Anti-Champion Rifle',dmg:132,head:1.4,leth:29,rof:56,cap:6,mob:65,zoom:10,reload:2.5,
   wallbreak:true,pierce:true,beam:'#ff2020',scope:'acr',cross:'acr',col:'#d01818',tag:'壁抜け・貫通・10倍スコープ'},
 oneshot:{jp:'ワンショット',en:'One Shot',dmg:150,head:1.4,leth:33,rof:49,cap:4,mob:55,zoom:10,reload:3.0,
   scope:'screen',cross:'bullet',col:'#f08a1a',tag:'体に1発・画面のスコープ・10倍'},
 hsr:{jp:'ヘビースナイパーライフル',en:'Heavy Sniper Rifle',dmg:98,head:1.4,rof:71,cap:8,mob:50,zoom:8,reload:2.6,
   pierce:true,scope:'tracking',cross:'pierce',col:'#7a8a38',tag:'貫通・8倍スコープ（距離が出る）'},
 comet:{jp:'彗星',en:'Comet',dmg:94,head:1.4,rof:74,cap:10,mob:50,zoom:8,reload:2.3,
   pierce:true,ricochet:true,beam:'#d060ff',scope:'comet',cross:'laser',col:'#a050f0',tag:'貫通・はね返る（1回）・8倍'},
 overseer:{jp:'監督',en:'Overseer',dmg:113,head:1.4,rof:74,cap:10,mob:65,zoom:8,reload:2.4,
   xray:true,scope:'thermal',cross:'bullet',col:'#3a6ad8',tag:'スコープ中だけ、壁の向こうの敵が青いシルエットで見える・8倍'}};
SNIPER_DATA.oneshot.dmg=170;   // ワンショットはいちばん強い（シールド50%の体にも1発）
for(const k in SNIPER_DATA){const d=SNIPER_DATA[k];d.cat='sniper';d.rate=1/(.545+(d.rof-60)*.01429);d.weight=+(1+(85-d.mob)/100).toFixed(2);d.res=d.cap*3;d.range=140;d.hip=0;WEAPONS[k]=d;WIDS.push(k)}
SNIPER_DATA.oneshot.weight=1.45;   // いちばん重い
const MELEE=['fists','knife','saber'],SNIPERS=Object.keys(SNIPER_DATA);
Object.assign(WEAPONS.fists,{short:'力の拳'});Object.assign(WEAPONS.knife,{short:'ナイフ'});Object.assign(WEAPONS.saber,{short:'サーベル'});
Object.assign(SNIPER_DATA.acr,{short:'アンチチャンプ'});Object.assign(SNIPER_DATA.oneshot,{short:'ワンショット'});Object.assign(SNIPER_DATA.hsr,{short:'ヘビースナイパー'});Object.assign(SNIPER_DATA.comet,{short:'彗星'});Object.assign(SNIPER_DATA.overseer,{short:'監督'});
for(const k of MELEE)WEAPONS[k].cat='melee';
const isSniper=w=>!!WEAPONS[w]&&WEAPONS[w].cat==='sniper';
// ---- 形（-z が銃口の向き。グリップのあたりが原点） ----
const TMC={};const tmat=(c,o)=>TMC[c+o]||(TMC[c+o]=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false}));
function leg(g,x,z,len,ang,c){const p=new THREE.Group();p.position.set(x,-.06,z);p.rotation.set(ang,0,x>0?.25:-.25);g.add(p);bx(p,.025,len,.025,0,-len/2,0,c||'#4a4e54');bx(p,.04,.03,.04,0,-len,0,'#2a2a2e');return p}
function acrModel(){const g=new THREE.Group();
  bx(g,.1,.17,.26,0,-.01,.42,'#151515');bx(g,.104,.07,.18,0,.03,.42,'#e8e8e8');bx(g,.106,.03,.08,0,-.06,.47,'#d01818');bx(g,.1,.05,.04,0,-.09,.56,'#151515');   // ストック
  bx(g,.15,.21,.52,0,.02,.04,'#141414');bx(g,.155,.09,.4,0,.06,.06,'#ececec');bx(g,.157,.025,.38,0,.0,.06,'#d01818');
  for(let i=0;i<5;i++)bx(g,.158,.02,.02,0,.1,-.1+i*.07,'#141414');for(const z of[-.12,.16])bx(g,.16,.04,.04,0,-.05,z,emat('#ff2a2a'));   // 本体
  bx(g,.07,.17,.08,0,-.15,.22,'#1a1a1a');bx(g,.085,.19,.11,0,-.16,-.04,'#1a1a1a');bx(g,.088,.05,.115,0,-.13,-.04,'#ececec');bx(g,.09,.05,.06,0,-.2,-.04,emat('#ff3030'));   // 握りとマガジン
  bx(g,.085,.09,.32,0,.18,.05,'#101010');bx(g,.09,.095,.05,0,.18,.17,'#ececec');bx(g,.09,.095,.05,0,.18,-.06,'#ececec');bx(g,.07,.07,.02,0,.18,-.115,emat('#ff3a3a'));bx(g,.03,.06,.04,0,.12,.05,'#101010');   // スコープ
  bx(g,.13,.15,.24,0,.02,-.32,'#1c1c1c');bx(g,.135,.04,.24,0,.08,-.32,'#ececec');bx(g,.14,.16,.04,0,.02,-.43,'#d01818');   // 銃身の根もと
  for(const [x,y] of[[-.05,.07],[.05,.07],[-.05,-.04],[.05,-.04]])bx(g,.018,.018,.16,x,y,-.5,'#0c0c0c');   // コード
  const cr=new THREE.Group();g.add(cr);cr.position.set(0,.03,-.47);   // 赤い結晶の銃身（光る）
  for(const [w,h,d,x,y,z] of[[.17,.17,.22,0,0,-.13],[.13,.14,.2,.02,.01,-.33],[.11,.11,.18,-.01,0,-.51],[.08,.08,.16,.01,.01,-.67],[.07,.08,.1,.06,.07,-.2],[.06,.07,.1,-.06,-.06,-.42],[.05,.05,.08,.05,-.05,-.58]])bx(cr,w,h,d,x,y,z,tmat('#ff2424',.82));
  bx(cr,.06,.06,.7,0,0,-.35,emat('#ffb0a0'));g.userData.muzzle=new THREE.Vector3(0,.03,-1.2);g.userData.glow=cr;return g}
function oneShotModel(){const g=new THREE.Group();
  bx(g,.16,.18,.16,0,-.01,.34,'#9aa0a6');for(let i=0;i<3;i++)bx(g,.165,.02,.12,0,.04-i*.04,.34,'#5a6068');bx(g,.03,.14,.03,.05,.12,.4,'#f08a1a');bx(g,.03,.03,.12,.05,.19,.35,'#f08a1a');bx(g,.03,.1,.03,.05,.13,.3,'#f08a1a');   // うしろ・オレンジの取っ手
  bx(g,.22,.25,.46,0,0,0,'#e6e8ea');bx(g,.2,.06,.32,0,.15,.02,'#3a3e44');bx(g,.225,.045,.34,0,.07,0,'#f08a1a');for(let i=0;i<8;i++)bx(g,.226,.035,.03,0,-.06,-.12+i*.035,i%2?'#1a1a1a':'#f0c820');   // 本体
  bx(g,.226,.03,.03,0,.02,-.18,emat('#ff2020'));bx(g,.226,.03,.03,0,.02,-.12,emat('#ff2020'));bx(g,.2,.08,.12,0,-.16,.12,'#d0d4d8');bx(g,.07,.15,.08,0,-.17,.24,'#3a3e44');   // 赤い光・下
  bx(g,.04,.12,.04,0,.22,.06,'#3a3e44');bx(g,.18,.13,.025,0,.33,.06,tmat('#40e0ff',.55));bx(g,.19,.015,.03,0,.4,.06,'#3a3e44');for(let i=0;i<3;i++)bx(g,.12,.006,.028,0,.29+i*.03,.06,emat('#a0ffff'));   // 画面のスコープ
  bx(g,.12,.12,.16,0,.03,-.29,'#9aa0a6');bx(g,.07,.07,.56,0,.04,-.62,'#5a6068');bx(g,.11,.11,.15,0,.04,-.92,'#3a3e44');bx(g,.115,.03,.03,0,.04,-.85,'#f08a1a');   // 銃身
  leg(g,.05,-.5,.32,.5);leg(g,-.05,-.5,.32,.5);g.userData.muzzle=new THREE.Vector3(0,.04,-1);return g}
function hsrModel(){const g=new THREE.Group();const O='#7a8a38',D='#5a6a28',L='#9aaa50';
  bx(g,.1,.17,.3,0,-.02,.45,D);bx(g,.105,.18,.04,0,-.02,.61,'#1a1a1a');bx(g,.06,.06,.14,0,.08,.42,O);   // ストック
  bx(g,.13,.17,.52,0,0,.05,O);for(const [x,y,z] of[[.066,.03,.12],[.066,-.04,-.05],[-.066,.04,-.1],[-.066,-.03,.18],[.066,.05,.3]])bx(g,.006,.05,.08,x,y,z,(z>0?D:L));   // 迷彩
  bx(g,.07,.16,.08,0,-.15,.22,'#1a1a1a');bx(g,.085,.17,.11,0,-.15,0,'#2a2a2a');   // 握り・マガジン
  bx(g,.12,.13,.42,0,0,-.4,O);for(let i=0;i<4;i++)bx(g,.122,.02,.05,0,-.03,-.25-i*.09,'#2a2a2a');bx(g,.065,.065,.5,0,.02,-.85,O);bx(g,.15,.1,.15,0,.02,-1.13,D);for(const s of[-1,1])bx(g,.152,.05,.03,0,.02,-1.13+s*.035,'#1a1a1a');   // 銃身・大きなマズル
  bx(g,.09,.09,.36,0,.17,.05,'#1a1a1a');bx(g,.1,.1,.06,0,.17,-.14,'#1a1a1a');bx(g,.07,.07,.02,0,.17,-.175,tmat('#60a0ff',.7));bx(g,.035,.035,.035,.06,.2,-.06,emat('#ff2020'));bx(g,.035,.035,.035,-.06,.2,-.06,emat('#3a7aff'));bx(g,.04,.07,.04,0,.1,.05,'#1a1a1a');   // スコープ
  bx(g,.03,.09,.03,0,.11,-.42,'#1a1a1a');bx(g,.03,.03,.2,0,.16,-.42,'#1a1a1a');   // 取っ手
  leg(g,.05,-.55,.34,.45,'#6a6e74');leg(g,-.05,-.55,.34,.45,'#6a6e74');g.userData.muzzle=new THREE.Vector3(0,.02,-1.22);return g}
function cometModel(){const g=new THREE.Group();const B='#2c2c44',P='#6a3aa8',C='#3ad8f0';
  bx(g,.12,.19,.24,0,-.02,.42,B);bx(g,.125,.03,.2,0,.04,.42,emat(C));bx(g,.125,.05,.05,0,-.08,.5,P);   // ストック
  bx(g,.14,.18,.46,0,0,.05,'#3a3a56');bx(g,.145,.07,.34,0,.04,.04,P);for(let i=0;i<3;i++)bx(g,.147,.025,.03,0,-.04,-.08+i*.08,emat(C));   // 本体と矢印
  bx(g,.07,.16,.08,0,-.15,.22,'#1e1e2e');bx(g,.08,.12,.09,0,-.13,-.03,emat(C));   // 握り・マガジン
  bx(g,.09,.09,.32,0,.18,.05,B);bx(g,.07,.07,.02,0,.18,-.12,emat(C));bx(g,.05,.06,.05,0,.25,.02,tmat('#e070ff',.8));bx(g,.03,.06,.04,0,.12,.05,B);   // スコープと結晶
  bx(g,.09,.09,.2,0,.03,-.27,emat('#60c8f0'));bx(g,.11,.11,.04,0,.03,-.36,'#3a3a56');   // 青い銃身
  const cm=new THREE.Group();g.add(cm);cm.position.set(0,.03,-.4);   // 彗星
  for(const [w,h,d,x,y,z,c,o] of[[.2,.2,.26,0,0,-.15,'#c050ff',.78],[.16,.16,.26,0,.01,-.38,'#d870ff',.8],[.11,.12,.2,0,0,-.58,'#f090ff',.85],[.06,.06,.34,.08,.08,-.12,'#9040e0',.55],[.05,.05,.3,-.08,.05,-.2,'#a050f0',.5],[.05,.05,.26,.06,-.08,-.25,'#b060ff',.5],[.04,.04,.22,-.06,-.07,-.35,'#e080ff',.5]])bx(cm,w,h,d,x,y,z,tmat(c,o));
  bx(cm,.06,.06,.6,0,0,-.32,emat('#ffd0ff'));bx(g,.07,.07,.03,0,.03,-1.08,emat(C));g.userData.muzzle=new THREE.Vector3(0,.03,-1.1);g.userData.glow=cm;return g}
function overseerModel(){const g=new THREE.Group();const G1='#7a7e86',G2='#5a5e66',BL='#3a6ad8';
  bx(g,.04,.12,.04,0,-.02,.52,'#2a2a2e');bx(g,.08,.04,.28,0,.05,.42,'#2a2a2e');bx(g,.08,.04,.28,0,-.07,.42,'#2a2a2e');bx(g,.09,.15,.04,0,-.01,.57,'#1a1a1a');   // 折りたたみストック
  bx(g,.13,.17,.48,0,0,.05,G1);bx(g,.135,.07,.22,0,.03,.1,BL);bx(g,.136,.02,.02,0,.06,-.12,emat('#f0d020'));bx(g,.136,.02,.02,0,.06,-.08,emat('#ff3030'));bx(g,.136,.02,.02,0,.06,-.04,emat('#30e060'));   // 本体と光
  bx(g,.07,.17,.08,0,-.15,.24,'#1a1a1a');bx(g,.085,.19,.1,0,-.16,0,'#2a2a2e');bx(g,.05,.03,.1,.08,.06,.22,'#1a1a1a');   // 握り・マガジン・ボルト
  bx(g,.11,.12,.3,0,.0,-.33,G2);bx(g,.055,.055,.62,0,.03,-.72,'#1e1e22');bx(g,.11,.09,.13,0,.03,-1.05,BL);bx(g,.02,.05,.02,0,.1,-1.05,emat('#ff2020'));   // 銃身・青いマズル
  bx(g,.09,.09,.34,0,.16,.06,G2);bx(g,.1,.1,.05,0,.16,-.12,'#2a2a2e');bx(g,.07,.07,.02,0,.16,-.15,tmat('#80b0ff',.7));bx(g,.04,.06,.04,0,.1,.06,'#2a2a2e');bx(g,.03,.03,.03,.05,.19,.06,emat('#f0d020'));   // スコープ
  bx(g,.05,.05,.13,.08,-.03,-.34,'#2a2a2a');bx(g,.045,.045,.02,.08,-.03,-.41,emat('#fff4c0'));   // ライト
  for(let i=0;i<6;i++){const t=i/5;bx(g,.03,.03,.16,-.06,-.1-Math.sin(t*Math.PI)*.12,.42-t*.78,'#8a5a2a')}   // 革のスリング
  leg(g,.05,-.45,.32,.5);leg(g,-.05,-.45,.32,.5);g.userData.muzzle=new THREE.Vector3(0,.03,-1.12);return g}
function sniperModel(w){const m=w==='acr'?acrModel():w==='oneshot'?oneShotModel():w==='hsr'?hsrModel():w==='comet'?cometModel():overseerModel();m.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.castShadow=true});return m}
// ---- 手に持ったスナイパー（画面の右下） ----
function setViewSniper(w){const m=sniperModel(w),hand=new THREE.Group();hand.add(m);m.scale.setScalar(.5);bx(m,.11,.12,.13,.0,-.13,.24,'#e8b88a');bx(m,.11,.11,.12,.02,-.07,-.3,'#e8b88a');
  hand.position.set(.25,-.25,-.6);hand.rotation.set(.03,.1,0);VIEW.g.add(hand);VIEW.parts.r=hand;VIEW.parts.m=m}
// 撃った反動・リロード・持ちかえ
function updViewSniper(dt,P,shotT,relK,drawK){const k=Math.exp(-shotT*9)*(shotT<1?1:0),r=Math.sin(relK*Math.PI);
  P.r.position.set(.25+r*.05,-.25-r*.16-drawK*.4+k*.03,-.6+k*.12);P.r.rotation.set(.03+k*.25-r*.5+drawK*-.6,.1+r*.4,r*.35);
  if(P.m.userData.glow){const s=1+Math.sin(G.time*8)*.03;P.m.userData.glow.scale.set(s,s,1)}}
// ---- アイコン（3Dの形を斜めから写して、黒いふちどり） ----
const SNIPER_ICON={};
function renderSniperIcons(){const W=208,H=160,rt=new THREE.WebGLRenderTarget(W,H);rt.texture.encoding=THREE.sRGBEncoding;const buf=new Uint8Array(W*H*4);
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x6a6a7a,.62));const dl=new THREE.DirectionalLight(0xffffff,.5);dl.position.set(1,2,3);sc.add(dl);
  for(const w of SNIPERS.concat(HEAVIES)){const outer=new THREE.Group(),m=gunModel(w);outer.add(m);m.rotation.set(.05,-Math.PI/2+.42,0);outer.rotation.z=.5;sc.add(outer);
    outer.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(outer),c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());
    const s=Math.max(sz.x/W*H,sz.y)*.56,cam=new THREE.OrthographicCamera(-s*W/H,s*W/H,s,-s,-10,10);cam.position.set(c.x,c.y,c.z+5);cam.lookAt(c);
    renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(sc,cam);renderer.readRenderTargetPixels(rt,0,0,W,H,buf);renderer.setRenderTarget(null);
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),id=g.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=((H-1-y)*W+x)*4,o=(y*W+x)*4;for(let k=0;k<4;k++)id.data[o+k]=buf[i+k]}
    // ふちどり
    const a=id.data,out=new Uint8ClampedArray(a);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const o=(y*W+x)*4;if(a[o+3]>40)continue;let n=0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]])if(a[((y+dy)*W+x+dx)*4+3]>120)n++;if(n){out[o]=out[o+1]=out[o+2]=0;out[o+3]=255}}
    id.data.set(out);g.putImageData(id,0,0);SNIPER_ICON[w]=cv.toDataURL();sc.remove(outer)}
  renderer.setClearColor(0x000000,1);rt.dispose()}
