// ガイアの配置を作る：Wiki の 2D マップ（tools/gaia_map.txt に色の記号で写したもの）を球に投影してエリアを決め、
// Wiki のタイルの順番どおりに、すでにあるタイルのとなりへ 1 枚ずつ置いていく。結果は src/03b_layout.js
// 使い方: node tools/layout.js
const fs=require('fs'),path=require('path');
const P=require('../src/02_planet.js');const {GAIA_TILES}=require('../src/03a_tiles.js');
const N=8,TMAX=125*Math.PI/180;
const C=P.makeHexSphere(N),NC=C.length;
const G=fs.readFileSync(path.join(__dirname,'gaia_map.txt'),'utf8').split('\n');
const F=P.nrm3([0.13,0.21,1]),Rt=P.nrm3(P.cross3([0,1,0],F)),U=P.cross3(F,Rt);
const proj=c=>{const th=Math.acos(Math.max(-1,Math.min(1,P.dot3(c,F))));const ph=Math.atan2(P.dot3(c,U),P.dot3(c,Rt));const r=th/TMAX*90;return[100+r*Math.cos(ph),100-r*Math.sin(ph)]};
const lab=(i,j)=>j<0||j>=200||i<0||i>=200?'.':G[j][i];
function norm(ch,i,j){if(ch==='r')return'4';if(ch==='y'||ch==='Y'){if(i<100&&j<80)return'T';if(i<75&&j>=80&&j<135)return'8';if(i>120&&j>=85&&j<145)return'5';return's'}return ch}
const AR={'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10};
const label=C.map(c=>{const [x,y]=proj(c.c);const cnt={},rad=3.2;
  for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){if(dx*dx+dy*dy>rad*rad)continue;const i=Math.round(x+dx),j=Math.round(y+dy);let ch=norm(lab(i,j),i,j);if(ch==='?'||ch==='b')continue;if(ch==='.')ch='s';cnt[ch]=(cnt[ch]||0)+1}
  let best='s',bv=-1;for(const k in cnt){const v=cnt[k]*(k==='s'?1:1.15);if(v>bv){bv=v;best=k}}return AR[best]||0});
// 印のごみ（アイコンの色など）を消す：エリアごとにいちばん大きいかたまりだけ残す
for(let a=1;a<=10;a++){const seen=new Set(),comps=[];C.forEach((c,i)=>{if(label[i]!==a||seen.has(i))return;const q=[i];seen.add(i);for(let h=0;h<q.length;h++)for(const j of C[q[h]].nb)if(label[j]===a&&!seen.has(j)){seen.add(j);q.push(j)}comps.push(q)});
  comps.sort((x,y)=>y.length-x.length);for(const q of comps.slice(1))for(const i of q)label[i]=0}
// エリアごとの中心
const cent={};for(let a=1;a<=10;a++){const s=[0,0,0];let n=0;C.forEach((c,i)=>{if(label[i]===a){s[0]+=c.c[0];s[1]+=c.c[1];s[2]+=c.c[2];n++}});cent[a]=n?P.nrm3(s):null}
const tile=new Array(NC).fill(-1),area=new Array(NC).fill(0);
// はじめの島：エリア1の中心にいちばん近いタイルと、そのまわり6つ
let s0=-1,bd=-9;C.forEach((c,i)=>{if(label[i]!==1)return;const d=P.dot3(c.c,cent[1]);if(d>bd){bd=d;s0=i}});
const start=[s0,...C[s0].nb];for(const i of start){tile[i]=0;area[i]=1}
// グラフの距離
function bfs(src,ok){const D=new Array(NC).fill(1e9),q=[];for(const s of src){D[s]=0;q.push(s)}for(let h=0;h<q.length;h++){const i=q[h];for(const j of C[i].nb)if(D[j]>D[i]+1&&(!ok||ok(j))){D[j]=D[i]+1;q.push(j)}}return D}
const entry={};const parent={};
const assigned=i=>tile[i]>=0;
// これから置くタイルがもうないエリアの印は海と同じにあつかう
const remain={};GAIA_TILES.forEach(r=>{const a=+r.split('|')[0];remain[a]=(remain[a]||0)+1});const lb=i=>remain[label[i]]>0?label[i]:0;
const adjAssigned=i=>C[i].nb.some(assigned);
for(let n=1;n<=GAIA_TILES.length;n++){const [ac,cs,ct]=GAIA_TILES[n-1].split('|');let a=+ac;remain[a]--;const cont=ct.split(' ').filter(Boolean);let pick=-1;
  if(a===0){
    if(cont.includes('bridge')){ // 北極（7）と灰の地（8）をつなぐ橋：7 のとなりの海で、8 の印にいちばん近いところ
      const D8=bfs(C.map((c,i)=>i).filter(i=>label[i]===8&&!assigned(i)));let bv=Infinity;C.forEach((c,i)=>{if(assigned(i)||!adjAssigned(i)||!C[i].nb.some(j=>area[j]===7))return;const v=D8[i]-(lb(i)===0?0.5:0);if(v<bv){bv=v;pick=i}});area[pick]=12}
    else{ // スキンポータル：エリア 3 か 1 のとなりの海
      let bv=-9;C.forEach((c,i)=>{if(assigned(i)||!adjAssigned(i)||lb(i)!==0)return;if(!C[i].nb.some(j=>area[j]===1||area[j]===3))return;const v=P.dot3(c.c,cent[1]);if(v>bv){bv=v;pick=i}});area[pick]=11}}
  else{
    let cand=C.map((c,i)=>i).filter(i=>!assigned(i)&&label[i]===a&&adjAssigned(i));
    if(!cand.length){ // そのエリアの印がもうとなりにない：エリアの残りか中心へいちばん近い、となりのタイルを広げる
      const rest=C.map((c,i)=>i).filter(i=>!assigned(i)&&label[i]===a);const D=rest.length?bfs(rest):null;let bv=Infinity;
      C.forEach((c,i)=>{if(assigned(i)||!adjAssigned(i))return;if(lb(i)!==0&&label[i]!==a)return;
        const nbA=C[i].nb.filter(j=>area[j]===a).length;const v=(D?D[i]:0)*3-P.dot3(c.c,cent[a])*4-nbA*2;if(v<bv){bv=v;pick=i}});
      if(pick<0)C.forEach((c,i)=>{if(pick>=0||assigned(i)||!adjAssigned(i))return;pick=i})}
    else{const E=entry[a]!==undefined?bfs([entry[a]],j=>label[j]===a||area[j]===a):null;let bv=Infinity;
      for(const i of cand){const nbA=C[i].nb.filter(j=>area[j]===a).length;const v=(E?E[i]:0)*2-nbA*1.2-P.dot3(C[i].c,cent[a])*0.5;if(v<bv){bv=v;pick=i}}}
    area[pick]=a;if(entry[a]===undefined)entry[a]=pick}
  if(pick<0){console.log("no cell for",n,ac,cont);process.exit(1)}
  tile[pick]=n;
  // 親：となりの置いたタイルのうち、同じエリアで番号がいちばん大きいもの（なければ番号がいちばん大きいもの）
  let pa=-1,pb=-1;for(const j of C[pick].nb){if(!(tile[j]>=0)||tile[j]>=n)continue;if(area[j]===area[pick]&&(pa<0||tile[j]>tile[pa]))pa=j;if(pb<0||tile[j]>tile[pb])pb=j}
  parent[n]=pa>=0?pa:pb}
// 高さ（エリアごと＋少しだけばらつき）
const BASE={1:.7,2:1.25,3:1.0,4:1.7,5:.75,6:1.05,7:1.35,8:1.55,9:1.95,10:.9,11:.7,12:.25};
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const hgt=C.map((c,i)=>area[i]?Math.round((BASE[area[i]]+(area[i]>=11?0:(rnd()-.5)*.3))*20)/20:0);
// 出力：1 タイル = 「タイル番号,エリア,高さ×20,親のタイル（セル番号）」
const cells=C.map((c,i)=>tile[i]<0?'':[tile[i],area[i],Math.round(hgt[i]*20),tile[i]>0?parent[tile[i]]:-1].join(','));
const js='// tools/layout.js が作ったガイアの配置（セル番号ごとに「タイル番号,エリア,高さ×20,親のセル」。空は海）\nconst GAIA_LAYOUT='+JSON.stringify({n:N,cells:cells.join(';')})+';\n';
fs.writeFileSync(path.join(__dirname,'..','src','03b_layout.js'),js);
const cnt={};area.forEach(a=>cnt[a]=(cnt[a]||0)+1);console.log('cells',NC,'areas',JSON.stringify(cnt),'start',start.length);
// 確認用の絵（2D マップと同じ投影）
const dump=C.map((c,i)=>({p:proj(c.c),a:area[i],t:tile[i],l:label[i]}));fs.writeFileSync(path.join(process.argv[2]||'/tmp','layout_dump.json'),JSON.stringify(dump));
