// ================= 放置モード（自動で歩いて、えらんだものを切る・掘る・たおす）=================
// ・えらべるのは「開いたタイルで見つけた、いまの道具で取れるもの」だけ
// ・道は陸と橋だけを通る（海は泳がない・買えるタイルの板にはのらない）。台（精錬所・商人など）の上でも何もしない
// ・体力が3割を切ったら、はじめの島へもどって休む。スティックを動かすとしばらく手動になる
const AUTO={on:false,sel:new Set(),tgt:null,path:[],manualT:0,moving:false,dir:new THREE.Vector3(),st:'',think:0,skip:new Map(),stuckT:0,stuckN:0,lastD:1e9,rest:false,got:{},wake:null};
try{const s=JSON.parse(LSget('lu-auto','null'));if(Array.isArray(s))s.forEach(k=>AUTO.sel.add(k));else AUTO.first=true}catch(e){AUTO.first=true}
const autoActive=()=>AUTO.on&&AUTO.manualT<=0&&STATE==='play'&&!CAM.map;
// 見つけた・取れるもの（node は道具が足りるもの、敵は開いたタイルにいるもの）
function autoKinds(){const L=[];const seen={};
  for(const o of NODES){const N=NODE[o.k];if(N.once||!isLand(CELLS[o.cell]))continue;const id='n:'+o.k;if(!seen[id]){seen[id]={id,k:o.k,type:'node',n:0,ok:toolLv(N.tool)>=N.lv};L.push(seen[id])}seen[id].n++}
  for(const e of ENEMIES){if(!W.open.has(e.n))continue;const id='e:'+e.k;if(!seen[id]){seen[id]={id,k:e.k,type:'enemy',n:0,ok:true};L.push(seen[id])}seen[id].n++}
  const ord=Object.keys(NODE).concat(Object.keys(ENEMY));return L.filter(x=>x.ok).sort((a,b)=>(a.type===b.type?0:a.type==='node'?-1:1)||ord.indexOf(a.k)-ord.indexOf(b.k))}
// ---- 道さがし（セルのつながりを幅優先で）----
const walkable=c=>{const k=groundKind(c);return k==='land'||k==='bridge'};
const cellH=c=>c.a===12?.4:c.h;
function autoBFS(from){const D=new Float32Array(CELLS.length).fill(Infinity),P=new Int32Array(CELLS.length).fill(-1),q=[from];D[from]=0;
  for(let h=0;h<q.length;h++){const i=q[h],ci=CELLS[i];for(const j of ci.nb){if(D[j]!==Infinity)continue;const cj=CELLS[j];if(!walkable(cj))continue;if(walkable(ci)&&cellH(cj)-cellH(ci)>1.5)continue;D[j]=D[i]+1;P[j]=i;q.push(j)}}return{D,P}}
function autoPath(P,to){const out=[];for(let i=to;i>=0;i=P[i])out.push(i);return out.reverse()}
const nodeU=o=>_t1.copy(o.pos).normalize();
function autoValid(T){if(!T)return false;if(T.type==='enemy')return T.o.alive&&T.o.vis;if(!isLand(CELLS[T.o.cell]))return false;return T.wait?true:T.o.alive}
// ---- 次の相手をえらぶ ----
function autoPick(){const now=performance.now();const {D,P}=autoBFS(PL.cell);let best=null,bs=Infinity,wait=null,ws=Infinity;
  const skip=o=>{const t=AUTO.skip.get(o);return t&&t>now};
  for(const o of NODES){if(!AUTO.sel.has('n:'+o.k)||o.hidden||!isLand(CELLS[o.cell]))continue;const N=NODE[o.k];if(N.once||toolLv(N.tool)<N.lv||skip(o))continue;const d=D[o.cell];if(d===Infinity)continue;
    const sc=d*2.2+arcDist(PL.u,nodeU(o),SEA)*.3;if(o.alive){if(sc<bs){bs=sc;best={type:'node',o,cell:o.cell}}}else{const w=o.t+d*.6;if(w<ws){ws=w;wait={type:'node',o,cell:o.cell,wait:true}}}}
  for(const e of ENEMIES){if(!AUTO.sel.has('e:'+e.k)||!e.alive||!e.vis||skip(e))continue;const d=D[e.cell];if(d===Infinity)continue;const sc=d*2.2+arcDist(PL.u,e.u,SEA)*.3-1;if(sc<bs){bs=sc;best={type:'enemy',o:e,cell:e.cell}}}
  const T=best||wait;AUTO.tgt=T;AUTO.stuckN=0;AUTO.lastD=1e9;AUTO.stuckT=0;AUTO.think=T&&T.wait?1.5:4;AUTO.path=T?autoPath(P,T.cell):[];
  AUTO.st=T?'':AUTO.sel.size?'えらんだものが、歩いて行けるところにありません':'取るものをえらんでください'}
// 休む場所（はじめの島）へ
function autoHome(){const home=TILES[0].cells[0];if(PL.cell===home||TILES[0].cells.includes(PL.cell))return null;const {P}=autoBFS(PL.cell);return autoPath(P,home)}
// 道をたどる向き
function autoFollow(path,goal){let idx=path.indexOf(PL.cell);if(idx<0){return false}
  const next=idx+1<path.length?CELLS[path[idx+1]].c:goal;tangent(_t2.copy(next).sub(PL.u),PL.u,AUTO.dir);AUTO.moving=true;return true}
function autoTick(dt){if(!AUTO.on)return;AUTO.manualT=Math.max(0,AUTO.manualT-dt);AUTO.moving=false;
  if(PL.dead>0){AUTO.tgt=null;AUTO.st='やられた…はじめの島からやりなおします';return}
  if(AUTO.manualT>0){AUTO.st='手で動かしています（はなすと放置にもどる）';return}
  // 体力が少ない → はじめの島で休む
  if(!AUTO.rest&&PL.hp<maxHp()*.3){AUTO.rest=true;AUTO.tgt=null;AUTO.homePath=autoHome()}
  if(AUTO.rest){if(PL.hp>=maxHp()*.95){AUTO.rest=false}else{AUTO.st='体力を回復しています';const p=AUTO.homePath;if(p&&p.length&&!TILES[0].cells.includes(PL.cell)){if(!autoFollow(p,CELLS[p[p.length-1]].c))AUTO.homePath=autoHome()}return}}
  AUTO.think-=dt;if(!autoValid(AUTO.tgt)||AUTO.think<=0&&(AUTO.tgt.wait||AUTO.tgt.type==='enemy'))autoPick();
  const T=AUTO.tgt;if(!T)return;
  const goal=T.type==='enemy'?T.o.u:nodeU(T.o).clone();const reach=T.type==='enemy'?T.o.r+.9:NODE[T.o.k].r+.45;const d=arcDist(PL.u,goal,SEA);
  const name=T.type==='enemy'?ENEMY[T.o.k].n:NODE[T.o.k].n;
  if(T.wait){if(d<1.7){AUTO.st=name+'の復活を待っています（あと'+Math.max(1,Math.ceil(T.o.t))+'秒）';return}}
  else if(d<reach){AUTO.st=(T.type==='enemy'?name+'とたたかっています':NODE[T.o.k].tool==='axe'?name+'を切っています':name+'を掘っています');AUTO.stuckN=0;return}
  AUTO.st=name+'へ向かっています';
  if(T.type==='enemy'&&T.o.cell!==AUTO.path[AUTO.path.length-1]){const {P}=autoBFS(PL.cell);AUTO.path=autoPath(P,T.o.cell)}
  if(PL.cell===T.cell||!autoFollow(AUTO.path,goal)){if(PL.cell===T.cell){tangent(_t2.copy(goal).sub(PL.u),PL.u,AUTO.dir);AUTO.moving=true}else{const {P}=autoBFS(PL.cell);AUTO.path=autoPath(P,T.cell);if(!autoFollow(AUTO.path,goal)){AUTO.tgt=null;return}}}
  // 進んでいないなら、しばらくその相手をあとまわし
  AUTO.stuckT+=dt;if(AUTO.stuckT>1.5){AUTO.stuckT=0;if(d>AUTO.lastD-.25){if(++AUTO.stuckN>=3){AUTO.skip.set(T.o,performance.now()+25000);AUTO.tgt=null}}else AUTO.stuckN=0;AUTO.lastD=d}}
// ---- はじめる・やめる ----
async function autoWake(on){try{if(on&&navigator.wakeLock&&!AUTO.wake)AUTO.wake=await navigator.wakeLock.request('screen');else if(!on&&AUTO.wake){await AUTO.wake.release();AUTO.wake=null}}catch(e){AUTO.wake=null}}
function autoStart(){if(!AUTO.sel.size){toast('取るものをえらんでください');return false}AUTO.on=true;AUTO.tgt=null;AUTO.got={};AUTO.rest=false;AUTO.manualT=0;AUTO.skip.clear();inputReset();document.body.classList.add('auto');autoWake(true);SFX.level();uiAuto();return true}
function autoStop(){if(!AUTO.on)return;AUTO.on=false;AUTO.tgt=null;AUTO.moving=false;document.body.classList.remove('auto');autoWake(false);const g=Object.keys(AUTO.got).filter(k=>AUTO.got[k]>0);
  if(g.length)toast('放置で集めたもの：'+g.map(k=>RES[k].n+' '+fmt(AUTO.got[k])).join('・'));uiAuto()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AUTO.on)autoWake(true)});
