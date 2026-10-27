// ================= ドロップで集めたキャラのピン（試合中のピンの箱に、使っているキャラの分を足す） =================
const _pinSvg=pinSvg;pinSvg=function(k){const p=PINS[k];return p&&p.bt?pinArt(p.bt,p.i).replace('class="pinA"','class="pinA fill"'):_pinSvg(k)};
function pinTrayFill(){const tr=$('pinTray');tr.querySelectorAll('[data-bp]').forEach(b=>b.remove());const u=G.me;if(!u)return;
  for(const i of pinsOf(u.bt).slice().sort((a,b)=>a-b).slice(0,4)){const k='b-'+u.bt+'-'+i;PINS[k]={name:PINK[i].n,bt:u.bt,i};
    const b=document.createElement('button');b.dataset.bp=k;b.innerHTML=pinSvg(k)+`<small>${PINK[i].n}</small>`;b.addEventListener('click',e=>{e.stopPropagation();usePin(k)});tr.appendChild(b)}}
$('pinBtn').addEventListener('click',()=>{if($('pinTray').classList.contains('on'))pinTrayFill()});
