// トロルヘイムの配置を作る：Wiki の 2D マップ（tools/troll_map.txt）を球に投影してエリアを決め、タイルの順番どおりに置く。
// 地図にないダンジョン（アズライトの洞くつ・ストゥフルのすみか・スケリルのすみか）は入り口の近くの海に置く。
// 船（dockS）は、北の船着き場（dockN）から海をこえた南の大陸に置く。結果は src/03e_troll_layout.js
// 使い方: node tools/layout_troll.js
const fs=require('fs'),path=require('path');
const P=require('../src/02_planet.js');const {TROLL_TILES}=require('../src/03d_troll_tiles.js');
const N=8,TMAX=125*Math.PI/180;
const C=P.makeHexSphere(N),NC=C.length;
const G=fs.readFileSync(path.join(__dirname,'troll_map.txt'),'utf8').split('\n').map(r=>r.split(''));
// ダンジョンの印（地図の外の海に丸く描く）：9 アズライトの洞くつ 10 ストゥフルのすみか 11 スケリルのすみか
const blob=(ch,cx,cy,r)=>{for(let j=Math.max(0,cy-r);j<=Math.min(199,cy+r);j++)for(let i=Math.max(0,cx-r);i<=Math.min(199,cx+r);i++)if((i-cx)**2+(j-cy)**2<=r*r)G[j][i]=ch};
blob('a',18,118,13);blob('c',96,6,12);blob('e',78,188,10);
const F=P.nrm3([-0.31,0.42,1]),Rt=P.nrm3(P.cross3([0,1,0],F)),U=P.cross3(F,Rt);
const proj=c=>{const th=Math.acos(Math.max(-1,Math.min(1,P.dot3(c,F))));const ph=Math.atan2(P.dot3(c,U),P.dot3(c,Rt));const r=th/TMAX*90;return[100+r*Math.cos(ph),100-r*Math.sin(ph)]};
const lab=(i,j)=>j<0||j>=200||i<0||i>=200?'.':G[j][i];
const AR={'1':1,'2':2,'D':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'i':13,'a':9,'c':10,'e':11};
const norm=(ch,i,j)=>ch==='Y'?(j>140?'7':'1'):ch;
const label=C.map(c=>{const [x,y]=proj(c.c);const cnt={},rad=3.2;
  for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){if(dx*dx+dy*dy>rad*rad)continue;const i=Math.round(x+dx),j=Math.round(y+dy);let ch=norm(lab(i,j),i,j);if(!(ch in AR))ch='s';cnt[ch]=(cnt[ch]||0)+1}
  let best='s',bv=-1;for(const k in cnt){const v=cnt[k]*(k==='s'?1:1.15);if(v>bv){bv=v;best=k}}return AR[best]||0});
for(let a=1;a<=13;a++){const seen=new Set(),comps=[];C.forEach((c,i)=>{if(label[i]!==a||seen.has(i))return;const q=[i];seen.add(i);for(let h=0;h<q.length;h++)for(const j of C[q[h]].nb)if(label[j]===a&&!seen.has(j)){seen.add(j);q.push(j)}comps.push(q)});
  comps.sort((x,y)=>y.length-x.length);for(const q of comps.slice(1))for(const i of q)label[i]=0}
const cent={};for(let a=1;a<=13;a++){const s=[0,0,0];let n=0;C.forEach((c,i)=>{if(label[i]===a){s[0]+=c.c[0];s[1]+=c.c[1];s[2]+=c.c[2];n++}});cent[a]=n?P.nrm3(s):null}
const tile=new Array(NC).fill(-1),area=new Array(NC).fill(0);
let s0=-1,bd=-9;C.forEach((c,i)=>{if(label[i]!==1)return;const d=P.dot3(c.c,cent[1]);if(d>bd){bd=d;s0=i}});
const start=[s0,...C[s0].nb];for(const i of start){tile[i]=0;area[i]=1}
function bfs(src,ok){const D=new Array(NC).fill(1e9),q=[];for(const s of src){D[s]=0;q.push(s)}for(let h=0;h<q.length;h++){const i=q[h];for(const j of C[i].nb)if(D[j]>D[i]+1&&(!ok||ok(j))){D[j]=D[i]+1;q.push(j)}}return D}
const entry={},parent={};const assigned=i=>tile[i]>=0;const adjAssigned=i=>C[i].nb.some(assigned);
const rows=TROLL_TILES.map(r=>{const [a,cs,ct]=r.split('|');return{a:+a,cont:ct.split(' ').filter(Boolean)}});
const remain={};rows.forEach(r=>remain[r.a]=(remain[r.a]||0)+1);const lb=i=>remain[label[i]]>0?label[i]:0;
let dockN=-1;
for(let n=1;n<=rows.length;n++){const R=rows[n-1];let a=R.a;remain[a]--;let pick=-1,forcedParent=-1;
  if(R.cont.includes('bridge')){ // 次のタイルのエリアへ向かう海の上の橋
    const nx=rows[n]?rows[n].a:a;const D=bfs(C.map((c,i)=>i).filter(i=>label[i]===nx&&!assigned(i)));let bv=Infinity;
    C.forEach((c,i)=>{if(assigned(i)||!adjAssigned(i))return;if(lb(i)!==0&&label[i]!==nx)return;const v=D[i]-(lb(i)===0?.5:0);if(v<bv){bv=v;pick=i}});a=12}
  else if(R.cont.includes('dockS')){ // 船で行く南の大陸：dockN にいちばん近い、そのエリアの印のタイル（となりでなくてよい）
    let bv=-9;C.forEach((c,i)=>{if(assigned(i)||label[i]!==a)return;const v=P.dot3(c.c,C[dockN].c);if(v>bv){bv=v;pick=i}});forcedParent=dockN}
  else{
    let cand=C.map((c,i)=>i).filter(i=>!assigned(i)&&label[i]===a&&adjAssigned(i));
    if(!cand.length){const rest=C.map((c,i)=>i).filter(i=>!assigned(i)&&label[i]===a);const D=rest.length?bfs(rest):null;let bv=Infinity;
      C.forEach((c,i)=>{if(assigned(i)||!adjAssigned(i))return;if(lb(i)!==0&&label[i]!==a)return;const nbA=C[i].nb.filter(j=>area[j]===a).length;const v=(D?D[i]:0)*3-(cent[a]?P.dot3(c.c,cent[a])*4:0)-nbA*2;if(v<bv){bv=v;pick=i}});
      if(pick<0)C.forEach((c,i)=>{if(pick>=0||assigned(i)||!adjAssigned(i))return;pick=i})}
    else{const E=entry[a]!==undefined?bfs([entry[a]],j=>label[j]===a||area[j]===a):null;let bv=Infinity;
      for(const i of cand){const nbA=C[i].nb.filter(j=>area[j]===a).length;const v=(E?E[i]:0)*2-nbA*1.2-(cent[a]?P.dot3(C[i].c,cent[a])*.5:0);if(v<bv){bv=v;pick=i}}}}
  if(pick<0){console.log('no cell for',n,R);process.exit(1)}
  area[pick]=a;if(entry[a]===undefined)entry[a]=pick;tile[pick]=n;if(R.cont.includes('dockN'))dockN=pick;
  if(forcedParent>=0){parent[n]=forcedParent;continue}
  let pa=-1,pb=-1;for(const j of C[pick].nb){if(!(tile[j]>=0)||tile[j]>=n)continue;if(area[j]===area[pick]&&(pa<0||tile[j]>tile[pa]))pa=j;if(pb<0||tile[j]>tile[pb])pb=j}
  parent[n]=pa>=0?pa:pb}
const BASE={1:.75,2:1.0,3:1.35,4:1.6,5:.6,6:.55,7:1.3,8:1.7,9:1.1,10:1.25,11:1.4,12:.25,13:1.5};
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const hgt=C.map((c,i)=>area[i]?Math.round((BASE[area[i]]+(area[i]===12?0:(rnd()-.5)*.3))*20)/20:0);
const cells=C.map((c,i)=>tile[i]<0?'':[tile[i],area[i],Math.round(hgt[i]*20),tile[i]>0?parent[tile[i]]:-1].join(','));
const js='// tools/layout_troll.js が作ったトロルヘイムの配置（セル番号ごとに「タイル番号,エリア,高さ×20,親のセル」。空は海）\nconst TROLL_LAYOUT='+JSON.stringify({n:N,cells:cells.join(';')})+';\n';
fs.writeFileSync(path.join(__dirname,'..','src','03e_troll_layout.js'),js);
const cnt={};area.forEach(a=>cnt[a]=(cnt[a]||0)+1);console.log('cells',NC,'areas',JSON.stringify(cnt));
fs.writeFileSync(path.join(process.argv[2]||'/tmp','troll_dump.json'),JSON.stringify(C.map((c,i)=>({p:proj(c.c),a:area[i],t:tile[i],l:label[i]}))));
