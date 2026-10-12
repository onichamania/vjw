// ===================== プライマリ（5丁）：究極点・バイキング・中性子パルセーター・酸の散弾銃・ゴールデンフレンド =====================
// 本家（Pixel Gun 3D Wiki）：究極点 Ultimatum（散弾・壁抜け・装弾1・連射42・機動50）、バイキング Viking（散弾・出血・装弾9・連射76・機動65）、
//  酸の散弾銃 Acid Shotgun（散弾・毒・装弾4・機動55）、ゴールデンフレンド Golden Friend（連射・4倍スコープ・装弾30・機動75）、
//  中性子パルセーター Neutron Pulsator（とても速い連射・4倍スコープ・透視・装弾50・機動100）。
// ゲームの数値は、たのまれた順番に合わせた：
//  ダメージ　　究極点 ＞ 酸の散弾銃 ＞ バイキング ＞ ゴールデンフレンド ＞ 中性子パルセーター（散弾は1発の合計）
//  連射　　　　中性子パルセーター ＞ ゴールデンフレンド ＞ バイキング ＞ 酸の散弾銃 ＞ 究極点
//  重さ　　　　究極点 ＞ 酸の散弾銃 ＝ バイキング ＞ ゴールデンフレンド ＞ 中性子パルセーター
//  リロード　　ダメージの順に遅い（究極点がいちばん遅い）
// 散弾は1粒ずつ当たりを調べて、同じ相手に当たった分を合わせて1回の攻撃にする（1回でへる体力は最大90のまま）。遠いと弱くなる（fall：[ここまで全部, ここで最小, 最小の割合]）
const PRIMARY_DATA={
 ultimatum:{jp:'究極点',en:'Ultimatum',short:'究極点',dmg:160,head:1.3,pellets:10,spread:.05,rof:42,cap:1,res:12,mob:50,reload:2.4,rate:.5,range:70,fall:[18,60,.45],
   wallbreak:true,pierce:true,beam:'#60e8ff',cross:'shotgun',col:'#7a6aa8',tag:'壁も相手もつきぬける散弾。1発ずつ（毎回リロード）・いちばん強い'},
 viking:{jp:'バイキング',en:'Viking',short:'バイキング',dmg:100,head:1.3,pellets:8,spread:.075,rof:76,cap:9,res:27,mob:65,reload:1.9,rate:.8,range:45,fall:[10,38,.3],
   bleed:{n:3,dmg:4,iv:1},beam:'#c070ff',pump:true,cross:'shotgun',col:'#e07a20',tag:'ポンプ式のプラズマ散弾・当たると出血（3秒）'},
 pulsator:{jp:'中性子パルセーター',en:'Neutron Pulsator',short:'パルセーター',dmg:9,head:1.4,rof:100,cap:50,res:150,mob:100,reload:1.3,rate:.075,range:120,auto:true,hip:.03,ads:.006,zoom:4,
   xray:true,beam:'#60ffd0',scope:'tri',cross:'rifle',col:'#e8701a',tag:'とても速い連射の青緑のレーザー・スコープ中は壁の向こうが見える（4倍）・いちばん軽い'},
 acid:{jp:'酸の散弾銃',en:'Acid Shotgun',short:'酸の散弾銃',dmg:120,head:1.3,pellets:8,spread:.085,rof:60,cap:4,res:16,mob:65,reload:2.1,rate:1.0,range:45,fall:[9,35,.3],
   poison:{n:4,dmg:5,iv:1},cross:'shotgun',col:'#30d040',tag:'4本の銃身の散弾・当たると毒（4秒）'},
 gfriend:{jp:'ゴールデンフレンド',en:'Golden Friend',short:'Gフレンド',dmg:13,head:1.4,rof:99,cap:30,res:90,mob:75,reload:1.6,rate:.1,range:120,auto:true,hip:.022,ads:.004,zoom:4,
   scope:'gold4x',cross:'rifle',col:'#f0c020',tag:'速い連射・緑のレンズの4倍スコープ'}};
for(const k in PRIMARY_DATA){const d=PRIMARY_DATA[k];d.cat='primary';d.weight=+(1+(85-d.mob)/100).toFixed(2);WEAPONS[k]=d;WIDS.push(k)}
PRIMARY_DATA.acid.weight=PRIMARY_DATA.viking.weight;   // 酸の散弾銃とバイキングは同じ重さ
const PRIMARIES=Object.keys(PRIMARY_DATA);
const isPrimary=w=>!!WEAPONS[w]&&WEAPONS[w].cat==='primary';
const primOf=w=>PRIMARIES.includes(w)?w:'gfriend';
// ---- 形（-z が銃口の向き。グリップのあたりが原点） ----
// 究極点：紫がかった灰色の太い四角い銃。上に水色の窓、前は大きな四角い口（水色に光る）、うしろに水色と白のしまの筒
function ultimatumModel(){const g=new THREE.Group(),PU='#433d5e',PD='#221e32',PL='#76729a',BK='#0e0c16',CD='#1890b0',MG='#3e1c38',CY=emat('#40e8ff');
  for(let i=0;i<5;i++)bx(g,.15,.15,.055,-.01,.03,.34+i*.06,i%2?CY:'#b8b8cc');bx(g,.1,.1,.06,-.01,.03,.64,PD);   // うしろの筒
  bx(g,.2,.24,.5,0,.02,.04,PU);bx(g,.205,.05,.42,0,-.05,.04,PD);bx(g,.207,.035,.4,0,.03,.04,CD);   // 本体
  bx(g,.13,.03,.36,0,.155,.02,CY);for(let i=0;i<6;i++)bx(g,.135,.034,.022,0,.155,-.15+i*.068,PD);   // 上の水色の窓
  bx(g,.08,.19,.09,0,-.18,.2,MG);bx(g,.03,.05,.13,0,-.12,.12,BK);   // 握り
  bx(g,.26,.28,.5,0,.03,-.44,PU);bx(g,.265,.05,.5,0,.15,-.44,PL);bx(g,.27,.29,.04,0,.03,-.22,CY);bx(g,.13,.08,.3,0,-.14,-.38,PD);   // 前の太い所
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)bx(g,.268,.035,.035,0,.08-j*.07,-.32-i*.08,BK);   // 横の穴
  bx(g,.28,.3,.04,0,.03,-.7,PL);bx(g,.19,.21,.02,0,.03,-.722,CY);bx(g,.1,.12,.02,0,.03,-.732,BK);   // 四角い口
  g.userData.muzzle=new THREE.Vector3(0,.03,-.76);return g}
// バイキング：ポンプ式。前に大きな「L」の形の斧の刃（銀のふちに溶岩のオレンジ）、うしろは赤茶色の台じりに赤いリボン
function vikingModel(){const g=new THREE.Group(),SV='#a8acb4',SD='#6a6e76',DK='#1e2024',ST='#5a2214',RD='#d02020',GD='#d8a020';
  bx(g,.09,.14,.32,0,-.04,.42,ST);bx(g,.095,.04,.3,0,.03,.42,'#8a3a22');bx(g,.1,.07,.08,0,-.1,.57,RD);bx(g,.03,.14,.03,.03,-.2,.6,RD);bx(g,.03,.12,.03,-.02,-.19,.62,RD);   // 台じりとリボン
  bx(g,.12,.15,.4,0,0,.02,DK);bx(g,.122,.03,.3,0,.065,.02,GD);bx(g,.122,.025,.12,0,-.03,.12,GD);   // 本体
  bx(g,.07,.16,.08,0,-.14,.2,ST);bx(g,.03,.05,.1,0,-.09,.12,DK);   // 握り
  bx(g,.07,.07,.5,0,.03,-.42,DK);const pump=new THREE.Group();g.add(pump);bx(pump,.1,.1,.2,0,-.06,-.3,'#5a3a2a');for(let i=0;i<3;i++)bx(pump,.102,.012,.03,0,-.06,-.24-i*.06,'#3a2418');   // 銃身とポンプ
  bx(g,.09,.62,.17,0,-.08,-.66,SV);bx(g,.09,.17,.46,0,-.33,-.5,SV);bx(g,.095,.48,.08,0,-.07,-.66,emat('#ffb020'));bx(g,.095,.08,.34,0,-.33,-.48,emat('#ff7a10'));bx(g,.096,.03,.03,0,-.2,-.62,emat('#fff0a0'));   // 「L」の刃と溶岩
  bx(g,.1,.12,.18,0,.27,-.66,SD);bx(g,.07,.07,.07,0,.27,-.76,DK);   // 上の四角い所
  g.userData.muzzle=new THREE.Vector3(0,.03,-.7);g.userData.pump=pump;return g}
// 中性子パルセーター：オレンジと灰色の長い銃。白いしまと緑の光る線、下に筒のマガジン（水色のしま）、上に水色の三角の照準が3つ
function pulsatorModel(){const g=new THREE.Group(),OR='#d0601a',WH='#e0e0e0',GY='#50545a',DK='#1e2024',CY=emat('#60e0ff'),GN=emat('#40ff60');
  bx(g,.09,.15,.24,0,-.03,.44,DK);bx(g,.095,.05,.22,0,.04,.44,OR);bx(g,.1,.17,.04,0,-.02,.57,DK);   // ストック
  bx(g,.13,.17,.5,0,0,.04,GY);bx(g,.135,.08,.5,0,.07,.02,OR);for(let i=0;i<4;i++)bx(g,.137,.03,.04,0,.08,-.16+i*.1,WH);bx(g,.137,.02,.44,0,-.02,.02,GN);   // 本体
  bx(g,.07,.17,.08,0,-.15,.22,DK);   // 握り
  bx(g,.12,.13,.38,0,.03,-.42,OR);bx(g,.122,.03,.38,0,.085,-.42,WH);bx(g,.123,.02,.36,0,-.01,-.42,GN);for(let i=0;i<3;i++)bx(g,.124,.03,.03,0,.04,-.3-i*.09,DK);   // 前
  bx(g,.1,.12,.3,0,-.12,-.26,GY);bx(g,.102,.03,.3,0,-.12,-.26,CY);for(const z of[-.13,-.39])bx(g,.105,.125,.03,0,-.12,z,OR);   // 筒のマガジン
  bx(g,.08,.08,.1,0,.03,-.66,DK);bx(g,.05,.05,.02,0,.03,-.72,emat('#60ffd0'));bx(g,.03,.03,.08,0,-.06,-.58,WH);   // 銃口と白いレーザー
  const tri=new THREE.Group();g.add(tri);for(const z of[.14,-.08,-.3]){bx(tri,.09,.02,.02,0,.13,z,CY);bx(tri,.055,.02,.02,0,.15,z,CY);bx(tri,.022,.02,.02,0,.17,z,CY)}   // 三角の照準
  g.userData.muzzle=new THREE.Vector3(0,.03,-.74);g.userData.glow=tri;return g}
// 酸の散弾銃：黒い四角い本体に明るい緑。上に酸の入った緑の筒、前に2×2の4本の銃身、赤いレーザー
function acidModel(){const g=new THREE.Group(),BK='#0a0c0b',DG='#26292e',LG='#5e5e7c',BR='#2a2418',GN=emat('#30e040');
  bx(g,.09,.15,.28,0,-.03,.44,BR);bx(g,.095,.04,.26,0,.05,.44,'#2a3a20');bx(g,.1,.17,.04,0,-.02,.59,BK);   // 台じり
  bx(g,.14,.18,.42,0,0,.04,BK);bx(g,.142,.04,.06,0,.03,.12,GN);bx(g,.142,.04,.06,0,-.04,-.04,GN);bx(g,.142,.03,.3,0,.07,.02,LG);   // 本体
  bx(g,.1,.1,.22,0,.15,.08,tmat('#a0ffa0',.85));bx(g,.06,.06,.18,0,.15,.08,emat('#70ff70'));for(const z of[-.04,.2])bx(g,.11,.11,.03,0,.15,z,DG);   // 酸の筒
  for(const x of[.03,-.03])bx(g,.02,.02,.22,x,.13,-.12,'#60c060');   // 管
  bx(g,.07,.16,.08,0,-.15,.22,BK);   // 握り
  for(const [x,y] of[[-.05,.06],[.05,.06],[-.05,-.04],[.05,-.04]]){bx(g,.085,.085,.6,x,y,-.44,BK);for(const z of[-.26,-.56])bx(g,.09,.09,.04,x,y,z,GN);bx(g,.05,.05,.02,x,y,-.745,emat('#60ff60'))}   // 4本の銃身
  bx(g,.2,.03,.48,0,.115,-.42,LG);bx(g,.2,.03,.48,0,-.095,-.42,LG);bx(g,.21,.06,.18,0,-.13,-.3,DG);   // わく
  bx(g,.03,.03,.08,.11,-.1,-.4,BK);bx(g,.02,.02,.02,.11,-.1,-.445,emat('#ff3010'));   // レーザー
  g.userData.muzzle=new THREE.Vector3(0,.01,-.76);return g}
// ゴールデンフレンド：金色のサブマシンガン（固定ストック・曲がったマガジン）、上に緑のレンズのスコープ、下に緑のレーザー
function gfriendModel(){const g=new THREE.Group(),GO='#c8960c',GD='#8a6406',BK='#141414',DK='#26262a';
  bx(g,.08,.15,.26,0,-.02,.42,GO);bx(g,.085,.04,.24,0,.06,.42,GD);bx(g,.09,.2,.04,0,-.03,.56,BK);   // ストック
  bx(g,.12,.16,.46,0,0,.02,GO);bx(g,.08,.03,.4,0,.095,.02,BK);bx(g,.122,.03,.3,0,-.03,.0,GD);bx(g,.124,.04,.06,0,.02,.14,'#d02020');   // 本体
  bx(g,.07,.17,.08,0,-.15,.2,BK);bx(g,.06,.14,.07,0,-.14,-.06,BK);bx(g,.06,.1,.07,0,-.25,-.1,BK);   // 握りと曲がったマガジン
  bx(g,.11,.12,.26,0,-.01,-.32,GO);for(let i=0;i<4;i++)bx(g,.112,.02,.03,0,-.04,-.23-i*.05,GD);bx(g,.05,.05,.2,0,.02,-.54,BK);bx(g,.07,.07,.05,0,.02,-.65,DK);bx(g,.03,.07,.03,0,.1,-.42,BK);   // 前・銃身
  bx(g,.08,.08,.26,0,.16,0,BK);for(const z of[-.1,.1])bx(g,.09,.09,.03,0,.16,z,GO);bx(g,.07,.07,.02,0,.16,-.135,tmat('#40ff60',.8));bx(g,.07,.07,.02,0,.16,.135,tmat('#40ff60',.6));bx(g,.03,.05,.04,0,.1,0,BK);   // スコープ
  bx(g,.04,.04,.1,0,-.09,-.4,BK);bx(g,.02,.02,.02,0,-.09,-.455,emat('#80ff80'));   // レーザー
  g.userData.muzzle=new THREE.Vector3(0,.02,-.68);return g}
function primaryModel(w){const m=w==='ultimatum'?ultimatumModel():w==='viking'?vikingModel():w==='pulsator'?pulsatorModel():w==='acid'?acidModel():gfriendModel();m.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.castShadow=true});return m}
// ---- 手に持ったプライマリ（画面の右下） ----
// 手もとの絵は明るい光で照らすので、プライマリは色を少し暗くして本家の色に近づける（材質はほかと共有なので、暗くした写しをおぼえて使う）
const VDARK={};
function setViewPrimary(w){const m=primaryModel(w),hand=new THREE.Group();hand.add(m);m.scale.setScalar(.5);
  m.traverse(o=>{if(o.isMesh&&o.material.isMeshLambertMaterial){const k=o.material.uuid;if(!VDARK[k]){VDARK[k]=o.material.clone();VDARK[k].color.multiplyScalar(.62)}o.material=VDARK[k]}});bx(m,.11,.12,.13,0,-.13,.2,'#e8b88a');bx(m,.11,.11,.12,.02,-.08,-.3,'#e8b88a');
  const big=w==='ultimatum';hand.userData.base=big?[.27,-.27,-.6,.16]:w==='viking'?[.26,-.24,-.62,.3]:[.25,-.25,-.6,.18];const b=hand.userData.base;hand.position.set(b[0],b[1],b[2]);hand.rotation.set(.03,b[3],0);VIEW.g.add(hand);VIEW.parts.r=hand;VIEW.parts.m=m}
// 撃った反動（連射は小さく速く、散弾は大きく）・ポンプ・リロード・持ちかえ
function updViewPrimary(dt,P,shotT,relK,drawK){const W=WEAPONS[VIEW.w],au=!!W.auto,k=Math.exp(-shotT*(au?22:8))*(shotT<1?1:0)*(au?.45:1),r=Math.sin(relK*Math.PI),b=P.r.userData.base;
  P.r.position.set(b[0]+r*.05+(au?rr(-1,1)*k*.01:0),b[1]-r*.17-drawK*.4+k*.03,b[2]+k*(au?.06:.14));P.r.rotation.set(.03+k*(au?.08:.3)-r*.5+drawK*-.6,b[3]+r*.4,r*.35);
  const u=P.m.userData;if(u.pump){const t=shotT-.18,p=t>0&&t<.45?Math.sin(t/.45*Math.PI):0;u.pump.position.z=p*.16}
  if(u.glow){const s=1+Math.sin(G.time*7)*.05;u.glow.scale.set(1,s,1)}}
