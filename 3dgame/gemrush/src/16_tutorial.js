// ================= チュートリアル =================
MODES.tutorial={name:'チュートリアル',ic:'🎓',map:'gem',resp:1e9,time:0,d:'',hidden:true};
const TUT=[{t:'左側をなぞって移動しよう（PCは WASD）。光る円まで歩こう！'},{t:'攻撃しよう！ 右側をなぞって離す（タップで自動でねらう）。PCは左クリックかスペース。的をたおそう'},
  {t:'必殺技がたまった！ 黄色いボタン（PCは右クリックか E）で必殺技を使って、的をたおそう'},{t:'草むらに入ると敵から見えなくなる。光る草むらに入ろう'},{t:'ジェムを3つ拾おう。エメラルドハントではジェムを10個集めたチームが勝ち！'}];
let tutMark=null;
function tutMarker(x,z){if(!tutMark){tutMark=new THREE.Mesh(new THREE.RingGeometry(1.1,1.5,40),new THREE.MeshBasicMaterial({color:0xffd84d,transparent:true,opacity:.9,depthWrite:false}));tutMark.rotation.x=-Math.PI/2;tutMark.position.y=.1;scene.add(tutMark)}
  tutMark.visible=x!=null;if(x!=null)tutMark.position.set(x,.1,z)}
const tutOpen=(x,z)=>walkable(x,z)&&!BUSH[cx(x)+','+cz(z)];
function tutSpot(u,d0,d1){for(let d=d1;d>=d0;d-=.5)for(let i=0;i<16;i++){const a=-Math.PI/2+(i%2?1:-1)*Math.ceil(i/2)*TAU/16,x=u.x+Math.cos(a)*d,z=u.z+Math.sin(a)*d;if(tutOpen(x,z)&&los(u.x,u.z,x,z))return[x,z]}return nearestOpen(u.x,u.z-d0)}
function tutStart(){for(let dz=0;dz<10;dz++)for(let i=0;i<14;i++){const x=(i%2?1:-1)*Math.ceil(i/2)*1.5,z=HALFZ-5-dz;if(tutOpen(x,z)&&tutOpen(x,z-8)&&los(x,z,x,z-8))return[x,z]}return nearestOpen(0,HALFZ-6)}
function tutSetup(){const M2=G.M;M2.step=-1;M2.doneT=0;const u=G.me;[u.x,u.z]=tutStart();u.inv=0;for(const d of G.units)if(d.dummy){d.dead=true;d.m.g.visible=false}tutNext()}
function tutDummy(x,z){const d=G.units.find(q=>q.dummy&&q.dead);if(!d)return;[d.x,d.z]=nearestOpen(x,z);d.spawn=[d.x,d.z];d.dead=false;d.maxHp=1;calcStats(d);d.maxHp=1300;d.hp=1300;d.inv=0;d.m.g.visible=true;return d}
function tutNext(){const M2=G.M,u=G.me;M2.step++;if(M2.step>=TUT.length){tutFinish();return}const st=TUT[M2.step];$('tutStep').textContent=(M2.step+1)+'/'+TUT.length;$('tutText').textContent=st.t;
  const tb=$('tut');tb.classList.remove('pop');void tb.offsetWidth;tb.classList.add('pop');SFX.superReady();
  if(M2.step===0){M2.goal=tutSpot(u,6,8);tutMarker(...M2.goal)}
  if(M2.step===1){tutMarker(null);M2.d=tutDummy(...tutSpot(u,4,6))}
  if(M2.step===2){u.sup=1;M2.d=tutDummy(...tutSpot(u,4,6));M2.sup0=u.supUsed||0}
  if(M2.step===3){let best=null,bd=1e9;for(const k in BUSH){const [c,r]=k.split(',').map(Number),d=Math.hypot(tx(c)-u.x,tz(r)-u.z);if(d<bd){bd=d;best=[tx(c),tz(r)]}}M2.goal=best;tutMarker(...best)}
  if(M2.step===4){tutMarker(null);u.gems=0;const pts=[];for(let d=4;d>=2&&pts.length<3;d-=.5)for(let i=0;i<24&&pts.length<3;i++){const a=i/24*TAU,x=u.x+Math.cos(a)*d,z=u.z+Math.sin(a)*d;if(tutOpen(x,z)&&los(u.x,u.z,x,z)&&pts.every(q=>Math.hypot(q[0]-x,q[1]-z)>2.2))pts.push([x,z])}while(pts.length<3)pts.push(nearestOpen(u.x+pts.length,u.z));for(const [x,z] of pts)addItem('gem',u.x,u.z,x,z)}}
function tutStep(dt){const M2=G.M,u=G.me;if(M2.doneT>0){M2.doneT-=dt;if(M2.doneT<=0){M2.doneT=0;tutNext()}return}if(u.dead){u.dead=false;spawnAt(u)}
  if(tutMark)tutMark.scale.setScalar(1+Math.sin(G.t*5)*.1);
  const ok=M2.step===0?Math.hypot(u.x-M2.goal[0],u.z-M2.goal[1])<1.8:M2.step===1?M2.d&&M2.d.dead:M2.step===2?M2.d&&M2.d.dead&&(u.supUsed||0)>M2.sup0:M2.step===3?u.inBush:M2.step===4?u.gems>=3:false;
  if(M2.step===2&&M2.d&&!M2.d.dead&&u.sup<1&&(u.supUsed||0)<=M2.sup0)u.sup=1;
  if(ok){M2.doneT=1.1;big('OK！',.9,'#8fe39a');burst(u.x,1.5,u.z,20,[1,.9,.4],5,.6,.6,true)}}
function tutFinish(){G.over=true;tutMarker(null);LSset('gr-tut','1');const first=!LS('gr-tutrw','');if(first){LSset('gr-tutrw','1');addCoins(200);LSset('gr-sd',+LS('gr-sd',0)+1)}
  big('チュートリアル完了！',2.2,'#ffd84d');$('tutText').textContent=first?'ごほうび：🪙200 とスタードロップ！ ホームで開けよう':'おつかれさま！';SFX.end(true);setTimeout(()=>{document.body.classList.remove('tut');clearMatch();showMenu()},2600)}

