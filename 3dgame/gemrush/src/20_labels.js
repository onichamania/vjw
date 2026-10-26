// ================= 画面の表示（名前・体力・ダメージの数字） =================
const OV=$('ov');
function mkLabel(u){const d=document.createElement('div');d.className='hb'+(u.isMe?' me':u.team?' red':'');
  const na=u.kit?(BT[u.bt].bar?1:maxAmmo(u)):0;
  d.innerHTML='<div class="gm"></div><div class="nm"></div><div class="bar"><i></i><b class="sh"></b><span></span></div>'+(u.isMe?'<div class="am'+(BT[u.bt].bar?' strm':'')+'">'+'<b><i></i></b>'.repeat(Math.max(1,na))+'</div><div class="sb"><i></i></div>':'');
  const nb=u.kit&&u.kit.buf&&BUF[u.bt]?['gad','sp','hyper'].filter(k=>u.kit.buf[k]).length:0;   // バフィーは試合でも見える
  d.querySelector('.nm').innerHTML=(u.isTurret||u.isSafe||u.isPet||u.isHead?'':'<small>Lv'+u.lv+'</small>')+u.name.replace(/</g,'')+(nb?'<em>✦'+nb+'</em>':'');OV.appendChild(d);u.lab={d,gm:d.querySelector('.gm'),bar:d.querySelector('.bar i'),sh:d.querySelector('.bar .sh'),hp:d.querySelector('.bar span'),am:[...d.querySelectorAll('.am i')],sb:d.querySelector('.sb'),na:Math.max(1,na),last:''}}
// 弾のゲージの下の黄色いゲージ（キャラごとの特別なゲージ：怒り・ホームラン・長い突進・ためなど）
function subBar(u){const B=BT[u.bt];if(u.charging)return[u.charge,u.charge>=.99?'#ff6bff':'#ffd24d'];if(u.bt==='ash')return[u.rage||0,'#ff5a3a'];if(u.bt==='bibi')return[(u.hrT||0)/B.atk.hr,(u.hrT||0)>=B.atk.hr?'#6ab8ff':'#ffd24d'];
  if(u.bt==='vlad')return[Math.min(1,(u.longT||0)/(hasSP(u,'coiled')?2.5:B.atk.longT)),'#ffd24d'];if(u.bt==='fang'&&hasSP(u,'divinesoles'))return[Math.min(1,(G.t-(u.dsT||0))/3),'#ff5a5a'];if(u.bt==='gus')return[(u.gusBar||0)/3,'#a8d8f0'];
  if(u.bt==='gigi'&&u.puppetT>G.t)return[(u.puppetT-G.t)/BT.gigi.sup.win,'#ffd24d'];if(u.bt==='jet'&&bufS(u,'rocket4'))return[Math.min(1,(u.r4T||0)/6),'#ffd24d'];if(hasSP(u,'bandaid'))return[Math.min(1,1-((u.bandT||0)-G.t)/15),'#7dff7a'];return null}
const _v=new THREE.Vector3();
function scr(x,y,z){_v.set(x,y,z).project(cam);return[( _v.x*.5+.5)*VW(),(-_v.y*.5+.5)*VH(),_v.z<1]}
function updLabel(u){const L=u.lab;if(!L)return;if(u.dead||!u.m.g.visible){L.d.classList.add('hide');return}L.d.classList.remove('hide');
  const [sx,sy]=scr(u.x,(u.jy||0)+(u.isPet?3.0:u.isTurret?2.2:u.isSafe?2.6:(u.bt==='gai'||u.bt==='riki'?3.6:3.0)*(u.dummy&&!G.rule?1:1.18)),u.z);L.d.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-100%)`;
  const k=Math.round(u.hp)+'|'+u.gems+'|'+u.pw+'|'+u.maxHp+'|'+(u.bt==='soda'?sodaStage(u):'')+(u.stunT>0)+(u.silT>G.t)+'|'+(u.bounty||0)+'|'+(G.M.ball&&G.M.ball.carrier===u);if(k!==L.last){L.last=k;L.bar.style.width=(u.hp/u.maxHp*100)+'%';L.hp.textContent=Math.ceil(u.hp);L.gm.textContent=u.gems?'◆'+u.gems:u.pw?'⚡'+u.pw:u.bt==='soda'&&sodaStage(u)?'▲'.repeat(Math.min(3,sodaStage(u))):u.stunT>0?'💫':u.silT>G.t?'🔇':G.rule==='bounty'&&u.bounty?'⭐'+u.bounty:G.rule==='ball'&&G.M.ball&&G.M.ball.carrier===u?'⚽':''}
  if(u.isMe){const ma=maxAmmo(u);if(L.na>1&&L.am.length!==ma){const am=L.d.querySelector('.am');am.innerHTML='<b><i></i></b>'.repeat(ma);L.am=[...am.querySelectorAll('i')];L.na=ma}
    if(L.na===1&&BT[u.bt].bar)L.am[0].style.width=clamp(u.ammo/ma,0,1)*100+'%';else L.am.forEach((e,i)=>e.style.width=clamp(u.ammo-i,0,1)*100+'%');
    const sb=subBar(u);if(L.sb){L.sb.style.display=sb?'':'none';if(sb){L.sb.firstChild.style.width=clamp(sb[0],0,1)*100+'%';L.sb.firstChild.style.background=sb[1]}}}
  if(L.sh){const s=u.shield>0?Math.min(1,u.shield/u.maxHp):0;L.sh.style.width=s*100+'%'}}
const DN=[];function dmgNum(u,v,cls){if(!u.m.g.visible&&!u.isMe)return;const d=document.createElement('div');d.className='dmg '+(cls||'');d.textContent=v;OV.appendChild(d);DN.push({d,x:u.x+rr(-.4,.4),z:u.z,t:0});if(DN.length>24){const o=DN.shift();o.d.remove()}}
function updDN(dt){for(let i=DN.length-1;i>=0;i--){const n=DN[i];n.t+=dt;if(n.t>.9){n.d.remove();DN.splice(i,1);continue}const [sx,sy]=scr(n.x,2.4+n.t*1.6,n.z);n.d.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-50%) scale(${n.t<.1?1+n.t*4:1.4-Math.min(.4,n.t*.5)})`;n.d.style.opacity=1-Math.max(0,n.t-.55)/.35}}
function feed(a,b){const d=document.createElement('div');const col=t=>t.team?'r':'b';d.innerHTML=a?`<span class="${col(a)}">${a.name}</span> ▶ <span class="${col(b)}">${b.name}</span>`:`<span class="${col(b)}">${b.name}</span> がやられた`;
  $('feed').prepend(d);setTimeout(()=>d.remove(),4200);while($('feed').children.length>4)$('feed').lastChild.remove();if(b.isMe&&G.mode!=='br'){const rt=respawnTime();note(rt<1e8?'やられた…　'+(Math.round(rt*10)/10)+'秒で復活':'やられた…　味方を応援しよう',2.2)}}
let noteT=0;function note(t,s){$('note').textContent=t;noteT=s||2}
let bigT=0;function big(t,s,col){const b=$('big');b.textContent=t;b.style.color=col||'#fff';b.style.display='block';bigT=s||1;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}

