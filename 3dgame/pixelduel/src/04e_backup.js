// ===================== バックアップ（5丁）：旧式レボルバー・エクスタミネーター・チャンピオン傭兵・レーザーサイクラー・ニュークリアレボルバー =====================
// 本家（Pixel Gun 3D Wiki）：
//  旧式レボルバー Old Revolver（単発・装弾6・連射93）…いちばん最初のピストル。たのまれたとおり強め（34 → 1.4倍の48）
//  エクスタミネーター Exterminator（単発・壁抜け・レーザー・2倍スコープ・連射74・装弾6・機動55）…スナイパーのような強い1発
//  チャンピオン傭兵 Champion Mercenary（1回で5発の連射・燃やす・装弾35・機動75）
//  レーザーサイクラー Laser Cycler（貫通・はね返る（5回）・相手を25%遅く・2倍スコープ・連射87・装弾12・機動85）
//  ニュークリアレボルバー Nuclear Revolver（単発・範囲ダメージ・4倍スコープ・装弾6・機動65・青いガスの爆発）…自分はダメージなしでロケットジャンプできる
// ダメージは、ほかの武器と同じ「体力100・1回でへるのは最大90」に合わせた数字。
const BACKUP_DATA={
 oldrev:{jp:'旧式レボルバー',en:'Old Revolver',short:'旧式レボルバー',dmg:48,head:1.5,rof:93,rate:.42,cap:6,res:30,mob:80,reload:1.7,range:110,hip:.012,
   cross:'bullet',col:'#c8ccd2',tag:'ふつうより少し強いレボルバー・頭は1.5倍'},
 exterm:{jp:'エクスタミネーター',en:'Exterminator',short:'エクスタミネーター',dmg:78,head:1.4,rof:74,rate:1.2,cap:6,res:18,mob:55,reload:2.2,range:140,hip:.004,zoom:2,
   wallbreak:true,pierce:true,beam:'#40c8ff',scope:'ext',cross:'pierce',col:'#e0b020',tag:'壁も相手もつきぬけるレーザーの強い1発・2倍スコープ'},
 merc:{jp:'チャンピオン傭兵',en:'Champion Mercenary',short:'チャンピオン傭兵',dmg:8,head:1.4,rof:99,rate:.0875,burst:5,cool:.333,cap:35,res:105,mob:75,reload:1.5,range:100,hip:.018,
   burn:{n:2,dmg:4,iv:1},cross:'rifle',col:'#d02020',tag:'1回で5発の連射・当たると燃える'},
 cycler:{jp:'レーザーサイクラー',en:'Laser Cycler',short:'サイクラー',dmg:26,head:1.4,rof:87,rate:.63,cap:12,res:36,mob:85,reload:1.6,range:120,hip:.006,zoom:2,
   pierce:true,ricochet:true,bounce:5,slow:{k:.75,t:2},beam:'#40e0ff',scope:'holo',cross:'laser',col:'#2ab8e8',tag:'貫通して壁で5回はね返るレーザー・当たると25%遅くなる・2倍スコープ'},
 nuke:{jp:'ニュークリアレボルバー',en:'Nuclear Revolver',short:'ニュークリア',dmg:46,head:1,rof:87,rate:.65,cap:6,res:24,mob:65,reload:2.0,range:140,zoom:4,
   proj:'nuke',speed:300,rad:2.4,rj:.8,self:0,scope:'nuke4x',cross:'rocket',col:'#5a7a3a',tag:'青いガスの爆発（範囲ダメージ）・足もとを撃つと自分はダメージなしでロケットジャンプ・4倍スコープ'}};
for(const k in BACKUP_DATA)BACKUP_DATA[k].dmg=Math.round(BACKUP_DATA[k].dmg*1.3);   // 調整：弱かったので全部1.3倍（旧式62・エクスタミネーター101・傭兵10×5・サイクラー34・ニュークリア60）
for(const k in BACKUP_DATA){const d=BACKUP_DATA[k];d.cat='backup';d.weight=+(1+(85-d.mob)/100).toFixed(2);WEAPONS[k]=d;WIDS.push(k)}
const BACKUPS=Object.keys(BACKUP_DATA);
const isBackup=w=>!!WEAPONS[w]&&WEAPONS[w].cat==='backup';
const bkOf=w=>BACKUPS.includes(w)?w:'oldrev';
// ---- 形（-z が銃口の向き。グリップのあたりが原点） ----
const ring=(par,r,t,c,x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,20),c);m.position.set(x,y,z);m.rotation.y=ry||0;par.add(m);return m};
// 旧式レボルバー：銀の長い銃身と回転弾倉、赤茶色の木のグリップ
function oldrevModel(){const g=new THREE.Group(),SV='#c8ccd2',SD='#9aa0a6',DK='#5a5e64',WD='#b8501a';
  bx(g,.06,.07,.5,0,.06,-.33,SV);bx(g,.04,.02,.5,0,.1,-.33,'#f0f2f4');bx(g,.02,.03,.02,0,.12,-.56,DK);   // 銃身
  bx(g,.1,.11,.13,0,.04,-.02,'#b0b4ba');for(const y of[.0,.08])bx(g,.102,.012,.13,0,y,-.02,DK);   // 回転弾倉
  bx(g,.08,.12,.16,0,.04,.08,SD);bx(g,.03,.05,.05,0,.11,.15,DK);bx(g,.03,.05,.1,0,-.05,.05,DK);   // わく・撃鉄・引き金
  bx(g,.07,.2,.09,0,-.13,.15,WD);bx(g,.072,.12,.04,0,-.12,.15,'#8a3a12');bx(g,.075,.03,.1,0,-.24,.15,SD);   // グリップ
  g.userData.muzzle=new THREE.Vector3(0,.06,-.59);return g}
// エクスタミネーター：金と青。2本のレール（中は青く光る）、青い弾の入れ物、金のサイトに青い十字、先は水色、木のグリップの下は金
function extermModel(){const g=new THREE.Group(),GO='#c8960c',GD='#8a6406',BL=emat('#3a7aff'),LB=emat('#a0d8ff');
  bx(g,.12,.17,.28,0,.01,0,GO);bx(g,.122,.08,.09,0,.0,.04,emat('#40a0ff'));bx(g,.09,.08,.08,0,.06,.17,GD);   // 本体・弾の入れ物
  bx(g,.1,.05,.5,0,.07,-.37,GO);bx(g,.1,.05,.5,0,-.05,-.37,GO);for(let i=0;i<8;i++)bx(g,.07,.07,.03,0,.01,-.16-i*.06,i%2?BL:LB);   // 2本のレール
  bx(g,.11,.17,.04,0,.01,-.63,GD);bx(g,.05,.06,.06,0,.13,-.6,emat('#40f0e0'));   // 先
  bx(g,.06,.07,.13,0,.15,0,GO);bx(g,.05,.05,.02,0,.15,-.07,tmat('#60c0ff',.85));bx(g,.006,.04,.021,0,.15,-.08,emat('#1a4aff'));bx(g,.04,.006,.021,0,.15,-.08,emat('#1a4aff'));   // 金のサイトと青い十字
  bx(g,.07,.2,.09,0,-.15,.12,'#6a3a1a');bx(g,.075,.04,.1,0,-.26,.12,GO);   // 木のグリップ
  g.userData.muzzle=new THREE.Vector3(0,.01,-.66);return g}
// チャンピオン傭兵：銀のスライドに赤い線、黒いわく、赤いパネルのグリップ、下に赤いレーザー
function mercModel(){const g=new THREE.Group(),SV='#d8dadf',BK='#141416',RD='#d01818',DG='#3a3c42';
  bx(g,.1,.1,.52,0,.06,-.12,SV);for(const z of[.0,-.1,-.2])bx(g,.102,.03,.05,0,.1,z,RD);bx(g,.102,.02,.4,0,.03,-.12,RD);bx(g,.06,.06,.04,0,.06,-.385,DG);   // スライド
  bx(g,.1,.08,.38,0,-.03,-.16,BK);bx(g,.102,.03,.12,0,-.02,-.05,DG);   // わく
  bx(g,.08,.22,.1,0,-.17,.08,BK);bx(g,.082,.1,.06,0,-.16,.08,RD);bx(g,.03,.05,.1,0,-.08,.0,DG);   // グリップと引き金
  bx(g,.06,.06,.14,0,-.09,-.3,BK);bx(g,.02,.02,.02,0,-.09,-.375,emat('#ff2020'));   // レーザー
  g.userData.muzzle=new THREE.Vector3(0,.06,-.41);return g}
// レーザーサイクラー：黒い本体に水色に光る丸（両横に大きな輪と小さな輪）、上に浮いた水色の輪のサイト、下に赤い光
function cyclerModel(){const g=new THREE.Group(),BK='#121418',DG='#2a2e36',CY=emat('#3ad8ff');
  bx(g,.18,.22,.36,0,.02,-.05,BK);bx(g,.1,.1,.2,0,.03,-.32,DG);bx(g,.06,.06,.02,0,.03,-.425,CY);   // 本体・銃身
  for(const s of[-1,1]){ring(g,.085,.014,CY,s*.093,.03,-.12,Math.PI/2);ring(g,.05,.01,CY,s*.093,.0,.09,Math.PI/2);bx(g,.004,.1,.1,s*.091,.03,-.12,'#0a0a0e')}   // 両横の輪
  bx(g,.182,.03,.08,0,-.08,.05,emat('#ff3030'));bx(g,.08,.18,.09,0,-.17,.08,BK);bx(g,.082,.02,.09,0,-.12,.08,CY);   // 赤い光・グリップ
  const holo=ring(g,.045,.008,tmat('#60e8ff',.75),0,.22,-.02,0);bx(g,.03,.06,.03,0,.15,-.02,DG);   // 浮いた輪のサイト
  g.userData.muzzle=new THREE.Vector3(0,.03,-.44);g.userData.glow=holo;return g}
// ニュークリアレボルバー：こい緑のずんぐりした体、太い短い銃身、水色の画面、黄色と黒のしまのスコープ、赤い光、木のグリップ
function nukeModel(){const g=new THREE.Group(),OG='#4a5a32',OD='#33402a',OL='#6a7a48',CY=emat('#40e0ff');
  bx(g,.13,.16,.3,0,.02,.02,OG);bx(g,.15,.15,.14,0,.03,-.06,OD);bx(g,.152,.05,.06,0,.04,-.06,CY);   // わく・回転弾倉と画面
  bx(g,.17,.17,.34,0,.05,-.33,OG);bx(g,.13,.13,.02,0,.05,-.505,'#141414');bx(g,.172,.06,.09,0,.09,-.36,CY);for(const [y,z] of[[-.0,-.22],[.11,-.44],[-.02,-.42]])bx(g,.174,.04,.05,0,y,z,OL);   // 太い銃身
  bx(g,.1,.1,.26,0,.19,-.06,OD);for(let i=0;i<5;i++)bx(g,.102,.03,.03,0,.245,-.16+i*.05,i%2?'#1a1a1a':'#e8c020');bx(g,.07,.07,.02,0,.19,-.195,tmat('#60ff80',.7));bx(g,.03,.03,.03,.05,.25,.07,emat('#ff3030'));   // スコープ
  bx(g,.07,.2,.09,0,-.15,.13,'#7a4a2a');bx(g,.03,.05,.1,0,-.06,.03,OD);   // 木のグリップ・引き金
  g.userData.muzzle=new THREE.Vector3(0,.05,-.52);return g}
function backupModel(w){const m=w==='exterm'?extermModel():w==='merc'?mercModel():w==='cycler'?cyclerModel():w==='nuke'?nukeModel():oldrevModel();m.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.castShadow=true});return m}
// ---- 手に持ったバックアップ（画面の右下。プライマリと同じく色を少し暗くする） ----
function setViewBackup(w){const m=backupModel(w),hand=new THREE.Group();hand.add(m);m.scale.setScalar(.55);
  m.traverse(o=>{if(o.isMesh&&o.material.isMeshLambertMaterial){const k=o.material.uuid;if(!VDARK[k]){VDARK[k]=o.material.clone();VDARK[k].color.multiplyScalar(.62)}o.material=VDARK[k]}});
  bx(m,.1,.11,.12,0,-.14,.16,'#e8b88a');hand.userData.base=[.22,-.22,-.5,.2];const b=hand.userData.base;hand.position.set(b[0],b[1],b[2]);hand.rotation.set(.03,b[3],0);VIEW.g.add(hand);VIEW.parts.r=hand;VIEW.parts.m=m}
function updViewBackup(dt,P,shotT,relK,drawK){const W=WEAPONS[VIEW.w],k=Math.exp(-shotT*(W.burst?20:9))*(shotT<1?1:0)*(W.burst?.5:1),r=Math.sin(relK*Math.PI),b=P.r.userData.base;
  P.r.position.set(b[0]+r*.04,b[1]-r*.15-drawK*.38+k*.03,b[2]+k*.1);P.r.rotation.set(.03+k*.4-r*.6+drawK*-.6,b[3]+r*.5,r*.4);
  const u=P.m.userData;if(u.glow){u.glow.rotation.z+=dt*1.5}}
