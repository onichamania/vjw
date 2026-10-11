// ===================== 回復アイテム（体力・アーマー）：決まった5か所のどこかに30秒ごと =====================
// 赤い十字＝体力半分・救急箱＝体力全回復、アーマー 銅＝25%・銀＝50%・金＝全回復
const ITEM_SPOTS=[[0,1,0],[-12.45,22.45,8.3],[12.5,12,3.8],[14.5,-29,.3],[-19.5,9.5,.3]];   // x, z, 高さの目安（通りの真ん中・給水塔の上・サルーン2階・保安官事務所・銀行の金庫）
const ITEM_KIND={hp:{n:'体力 +50',hp:.5,w:30,c:'#e82020'},kit:{n:'救急箱：体力 全回復',hp:1,w:15,c:'#ffffff'},
  ab:{n:'銅のアーマー +25%',ar:.25,w:25,c:'#c8783a'},as:{n:'銀のアーマー +50%',ar:.5,w:20,c:'#d4d8e0'},ag:{n:'金のアーマー：全回復',ar:1,w:10,c:'#ffcf2a'}};
const ITEM_KEYS=Object.keys(ITEM_KIND),ITEMS=[],IT={t:0,nid:1,got:[]};
let SPOT_POS=null;
function spotPos(){return SPOT_POS||(SPOT_POS=ITEM_SPOTS.map(([x,z,yh])=>({x,z,y:groundAt(x,z,yh+.3,.25)})))}
function pickKind(){let r=Math.random()*ITEM_KEYS.reduce((a,k)=>a+ITEM_KIND[k].w,0);for(const k of ITEM_KEYS){r-=ITEM_KIND[k].w;if(r<=0)return k}return 'hp'}
// 見た目（くるくる回って上下する）
function itemMesh(kind){const g=new THREE.Group(),K=ITEM_KIND[kind],B=c=>new THREE.MeshBasicMaterial({color:c}),add=(w,h,d,x,y,z,m)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);me.position.set(x,y,z);g.add(me);return me};
  if(kind==='hp'){add(.56,.2,.2,0,0,0,B('#ffffff'));add(.2,.56,.2,0,0,0,B('#ffffff'));add(.48,.14,.22,0,0,0,B('#e82020'));add(.14,.48,.22,0,0,0,B('#e82020'))}
  else if(kind==='kit'){add(.52,.38,.3,0,0,0,mat('#f4f4f4'));for(const z of[-.152,.152]){add(.26,.08,.01,0,0,z,B('#e82020'));add(.08,.26,.01,0,0,z,B('#e82020'))}add(.2,.05,.06,0,.24,0,mat('#3a3a3a'));add(.04,.08,.06,-.09,.21,0,mat('#3a3a3a'));add(.04,.08,.06,.09,.21,0,mat('#3a3a3a'))}
  else{const c=K.c,d=shadeC(c,.62);add(.46,.44,.1,0,.03,0,mat(c));add(.34,.12,.1,0,-.24,0,mat(c));add(.16,.1,.1,0,-.33,0,mat(c));add(.5,.05,.12,0,.26,0,mat(d));add(.05,.5,.12,-.25,.02,0,mat(d));add(.05,.5,.12,.25,.02,0,mat(d));
    add(.14,.2,.12,0,.02,0,mat(d));add(.04,.04,.13,-.12,.14,0,B('#ffffff'))}
  const ring=new THREE.Mesh(new THREE.RingGeometry(.42,.56,20),new THREE.MeshBasicMaterial({color:K.c,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.name='ring';
  const root=new THREE.Group();root.add(g);root.add(ring);root.userData.spin=g;return root}
function itemsReset(){for(const it of ITEMS)scene.remove(it.mesh);ITEMS.length=0;IT.t=0;IT.got=[];IT.nid=1}
function spawnItem(spot,kind,id){const P=spotPos()[spot];if(!P||ITEMS.some(i=>i.id===id))return;const m=itemMesh(kind);m.position.set(P.x,P.y,P.z);scene.add(m);ITEMS.push({id,spot,kind,mesh:m,x:P.x,y:P.y,z:P.z})}
function removeItem(it){scene.remove(it.mesh);const i=ITEMS.indexOf(it);if(i>=0)ITEMS.splice(i,1)}
const itemBoss=()=>G.mode!=='online'||NET.host;   // アイテムを出すのは、CPU戦なら自分、オンラインならホスト
const canTake=(F,kind)=>ITEM_KIND[kind].hp?F.hp<HP_MAX-.5:F.ar<AR_MAX-.5;
function takeItem(F,it){const K=ITEM_KIND[it.kind];if(K.hp)F.hp=Math.min(HP_MAX,F.hp+K.hp*HP_MAX);if(K.ar)F.ar=Math.min(AR_MAX,F.ar+K.ar*AR_MAX);
  fx(it.x,it.y+.7,it.z,K.c,14,2.5,.6,.08,2);removeItem(it);
  if(F===ME){tip(K.n,1.6);SFX.pickup();if(G.mode==='online'){IT.got.push(it.id);if(IT.got.length>8)IT.got.shift();sendNow()}}}
function itemsUpdate(dt){
  if(G.phase==='play'&&itemBoss()){IT.t+=dt;if(IT.t>=30){IT.t-=30;const free=[0,1,2,3,4].filter(i=>!ITEMS.some(it=>it.spot===i));if(free.length){spawnItem(pick(free),pickKind(),IT.nid++);if(G.mode==='online')sendNow()}}}
  for(const it of ITEMS){const s=it.mesh.userData.spin;s.rotation.y+=dt*2.2;s.position.y=.75+Math.sin(G.time*3+it.id)*.12}
  for(const F of G.mode==='bot'?ALL():[ME]){if(!F.alive)continue;for(const it of ITEMS.slice())if(Math.hypot(F.x-it.x,F.z-it.z)<1&&Math.abs(F.y-it.y)<1.4&&canTake(F,it.kind))takeItem(F,it)}}
// オンライン：ホストの一覧（[id, 場所, 種類]）に合わせる。自分が取ったものは出さない
function itemsFromHost(list){if(!Array.isArray(list))return;const ids=new Set();for(const e of list){if(!Array.isArray(e)||e.length<3)continue;const [id,sp,ki]=e;if(!Number.isInteger(id)||!(sp>=0&&sp<5)||!ITEM_KEYS[ki])continue;ids.add(id);if(!IT.got.includes(id))spawnItem(sp,ITEM_KEYS[ki],id)}
  for(const it of ITEMS.slice())if(!ids.has(it.id))removeItem(it)}
function itemsTakenBy(ids){if(!Array.isArray(ids))return;for(const it of ITEMS.slice())if(ids.includes(it.id))removeItem(it)}
const itemsList=()=>ITEMS.map(it=>[it.id,it.spot,ITEM_KEYS.indexOf(it.kind)]);
// CPU：体力かアーマーが少なく、相手が見えないときはアイテムを取りに行く
function botItemGoal(F){if(!ITEMS.length||(F.hp>70&&F.ar>40))return -1;let best=null,bd=1e9;for(const it of ITEMS){if(!canTake(F,it.kind))continue;const d=Math.hypot(it.x-F.x,it.z-F.z)+Math.abs(it.y-F.y)*3;if(d<bd){bd=d;best=it}}return best?nearestNode(best.x,best.y,best.z):-1}
