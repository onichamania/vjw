// ================= 星（六角タイルの球）=================
// 正二十面体を n 分割した点を球にのせ、その双対（点のまわりの三角形の重心）を六角形（12こだけ五角形）のタイルにする
let RELAX=40;
function makeHexSphere(n){
  const t=(1+Math.sqrt(5))/2;
  const V0=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v=>nrm3(v));
  const F0=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const P=[],key=new Map(),tris=[];
  const vid=v=>{const k=Math.round(v[0]*1e5)+','+Math.round(v[1]*1e5)+','+Math.round(v[2]*1e5);let i=key.get(k);if(i===undefined){i=P.length;P.push(v);key.set(k,i)}return i};
  for(const [a,b,c] of F0){const A=V0[a],B=V0[b],C=V0[c],id=[];
    for(let i=0;i<=n;i++){id.push([]);for(let j=0;j<=n-i;j++){const k=n-i-j;id[i].push(vid(nrm3([(A[0]*k+B[0]*i+C[0]*j)/n,(A[1]*k+B[1]*i+C[1]*j)/n,(A[2]*k+B[2]*i+C[2]*j)/n])))}}
    for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){tris.push([id[i][j],id[i+1][j],id[i][j+1]]);if(j<n-i-1)tris.push([id[i+1][j],id[i+1][j+1],id[i][j+1]])}}
  const inc=P.map(()=>[]),nb=P.map(()=>new Set());
  tris.forEach((tr,ti)=>{for(let k=0;k<3;k++){inc[tr[k]].push(ti);nb[tr[k]].add(tr[(k+1)%3]);nb[tr[k]].add(tr[(k+2)%3])}});
  // ならす（タイルの大きさをそろえる）：辺の長さが同じになるようにばねで引っぱる
  const L0=2*Math.asin(1/(2*Math.sin(2*Math.PI/5)))/n*1.02;
  for(let it=0;it<RELAX;it++){const D=P.map(()=>[0,0,0]);for(let i=0;i<P.length;i++)for(const j of nb[i]){if(j<i)continue;const a=P[i],b=P[j],d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],l=Math.hypot(d[0],d[1],d[2]),f=(l-L0)/l*.25;for(let k=0;k<3;k++){D[i][k]+=d[k]*f;D[j][k]-=d[k]*f}}
    for(let i=0;i<P.length;i++)P[i]=nrm3([P[i][0]+D[i][0],P[i][1]+D[i][1],P[i][2]+D[i][2]])}
  const cen=tris.map(tr=>nrm3([P[tr[0]][0]+P[tr[1]][0]+P[tr[2]][0],P[tr[0]][1]+P[tr[1]][1]+P[tr[2]][1],P[tr[0]][2]+P[tr[1]][2]+P[tr[2]][2]]));
  const cells=P.map((p,i)=>{const [e1,e2]=tangentBasis(p);
    const ang=v=>{const d=[v[0]-p[0],v[1]-p[1],v[2]-p[2]];return Math.atan2(dot3(d,e2),dot3(d,e1))};
    const cs=inc[i].map(ti=>cen[ti]).sort((a,b)=>ang(a)-ang(b));
    const ns=[...nb[i]].sort((a,b)=>ang(P[a])-ang(P[b]));
    return{i,c:p,corners:cs,nb:ns}});
  return cells}
function nrm3(v){const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}
function dot3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross3(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function tangentBasis(p){const up=Math.abs(p[1])<.9?[0,1,0]:[1,0,0];const e1=nrm3(cross3(up,p));const e2=cross3(p,e1);return[e1,e2]}
// 球をまわす（見せたい場所を前に）
function rotate3(v,axis,a){const c=Math.cos(a),s=Math.sin(a),d=dot3(axis,v),x=cross3(axis,v);return[v[0]*c+x[0]*s+axis[0]*d*(1-c),v[1]*c+x[1]*s+axis[1]*d*(1-c),v[2]*c+x[2]*s+axis[2]*d*(1-c)]}
if(typeof module!=='undefined')module.exports={setRelax:v=>RELAX=v,makeHexSphere,nrm3,dot3,cross3,tangentBasis,rotate3};
