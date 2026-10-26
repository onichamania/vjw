// ================= バトルの流れ =================
let paused=false;
function setPause(on){paused=on;$('pause').classList.toggle('on',on);for(const k in K)K[k]=false;mouse.down=false;STK.L=STK.A=STK.S=null;if(master)master.gain.value=S.sound&&!on?S.vol*.8:0}
$('pauseBtn').addEventListener('click',()=>setPause(true));$('pzGo').addEventListener('click',()=>setPause(false));
$('pzQuit').addEventListener('click',()=>{setPause(false);clearMatch();showMenu()});
$('pzHome').addEventListener('click',()=>{try{parent.postMessage({h3dOpenPanel:1},'*')}catch(e){}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.state==='play')setPause(true)});
function clearMatch(){for(const u of G.units){scene.remove(u.m.g);if(u.forms)for(const k in u.forms)scene.remove(u.forms[k].g);if(u.orbs)for(const o of u.orbs)scene.remove(o);if(u.snk)scene.remove(u.snk.m);if(u.lab)u.lab.d.remove()}for(const q of BLOMBS)scene.remove(q.m);BLOMBS.length=0;for(const q of G.mines)scene.remove(q.m);G.mines=[];for(const h of G.heads){scene.remove(h.m.g);h.lab.d.remove()}G.heads=[];for(const q of G.pets){scene.remove(q.m.g);if(q.lab)q.lab.d.remove()}G.pets=[];for(const t of G.turrets){scene.remove(t.m.g);if(t.lab)t.lab.d.remove()}for(const b of G.bullets)scene.remove(b.m);for(const l of G.lobs){scene.remove(l.m);if(l.mk)scene.remove(l.mk)}
  for(const g of G.items)scene.remove(g.m);for(const z of G.zones)scene.remove(z.m);
  for(const s of G.safes)s.lab.d.remove();G.safes=[];G.M={};
  $('vs').classList.remove('on');G.units=[];G.bullets=[];G.lobs=[];G.items=[];G.turrets=[];G.zones=[];TIMERS.length=0;G.me=null;G._pw=0;DN.forEach(n=>n.d.remove());DN.length=0;$('feed').innerHTML='';showAim(null)}
