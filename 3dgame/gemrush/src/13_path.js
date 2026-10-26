// ================= 道さがし（A*） =================
function astar(sc,sr,gc,gr){if(blockMove(gc,gr)){let best=null,bd=1e9;for(let r=gr-3;r<=gr+3;r++)for(let c=gc-3;c<=gc+3;c++)if(!blockMove(c,r)){const d=Math.hypot(c-gc,r-gr);if(d<bd){bd=d;best=[c,r]}}if(!best)return[];[gc,gr]=best}
  const N=MW*MH,id=(c,r)=>r*MW+c,gs=new Float32Array(N).fill(1e9),fs=new Float32Array(N).fill(1e9),came=new Int32Array(N).fill(-1),closed=new Uint8Array(N),open=[];
  const h=(c,r)=>{const dx=Math.abs(c-gc),dz=Math.abs(r-gr);return Math.max(dx,dz)+.414*Math.min(dx,dz)};
  const s=id(sc,sr);gs[s]=0;fs[s]=h(sc,sr);open.push(s);
  while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(fs[open[i]]<fs[open[bi]])bi=i;const cur=open[bi];open.splice(bi,1);if(closed[cur])continue;closed[cur]=1;
    const c=cur%MW,r=(cur-c)/MW;if(c===gc&&r===gr){const path=[];let k=cur;while(k!==-1&&k!==s){path.push([k%MW,(k-k%MW)/MW]);k=came[k]}return path.reverse()}
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const nc=c+dc,nr=r+dr;if(blockMove(nc,nr))continue;if(dr&&dc&&(blockMove(c+dc,r)||blockMove(c,r+dr)))continue;
      const n=id(nc,nr);if(closed[n])continue;const g=gs[cur]+(dr&&dc?1.414:1);if(g<gs[n]){gs[n]=g;fs[n]=g+h(nc,nr);came[n]=cur;open.push(n)}}}
  return[]}

