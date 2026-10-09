// ===================== ハチの見た目（本家と同じ「箱の体・しま・顔・大きな羽」を自分で描く） =====================
// b: 体のしま（後ろ→前） f: 顔の色 e: 目 m: 口 ec: 目と口の色 x: 頭のかざり xc: かざりの色 sz: 大きさ bl: ほっぺ
const BEE_STYLE={
 baby:{b:['#bfe6ff','#26324d','#bfe6ff'],f:'#26324d',e:'cute',m:'tiny',bl:1,sz:.72},
 basic:{b:['#ffd23f','#22283a','#ffd23f','#22283a'],f:'#22283a',e:'dot',m:'smile'},
 bear:{b:['#a8693a','#8a5228'],f:'#a8693a',e:'dot',m:'snout',ec:'#2a1a10',x:'ears',xc:'#8a5228'},
 bomber:{b:['#f2f2f2','#22283a','#f2f2f2'],f:'#f2f2f2',e:'shades',m:'smile',ec:'#22283a'},
 brave:{b:['#b9bcc2','#8d9097'],f:'#b9bcc2',e:'angry',m:'frown',ec:'#3a3d44'},
 bubble:{b:['#b3dcff','#7cb8f5'],f:'#b3dcff',e:'wide',m:'o',ec:'#2a5a9a'},
 bucko:{b:['#2a50b8','#22283a'],f:'#2a50b8',e:'angry',m:'grin',x:'fin',xc:'#4ac8f0'},
 bumble:{b:['#22283a','#4a7ad8','#22283a'],f:'#2a3a6a',e:'dot',m:'smile',ec:'#8ac0ff'},
 buoyant:{b:['#3a8ad8','#2a5ab0'],f:'#3a8ad8',e:'happy',m:'smile',x:'party',xc:'#7ae0d0'},
 carpenter:{b:['#8a5a3a','#d8a040','#8a5a3a'],f:'#8a5a3a',e:'goggles',m:'smile',ec:'#f2e2c0'},
 cobalt:{b:['#1a3ad8','#f4f4f4','#1a3ad8'],f:'#1a3ad8',e:'x',m:'grin',x:'horns',xc:'#f4f4f4'},
 commander:{b:['#ffe03a','#22283a','#ffe03a'],f:'#5ad86a',e:'visor',m:'smile',ec:'#22283a'},
 cool:{b:['#5a8ae8','#3a6ac8'],f:'#5a8ae8',e:'cool',m:'flat'},
 crimson:{b:['#e83a3a','#f4f4f4','#e83a3a'],f:'#e83a3a',e:'x',m:'grin',x:'horns',xc:'#f4f4f4'},
 demo:{b:['#22283a','#ffd23f','#22283a'],f:'#22283a',e:'goggles',m:'smile',ec:'#ffd23f'},
 demon:{b:['#22283a','#c8281a'],f:'#22283a',e:'angry',m:'fang',ec:'#ff4a2a',x:'flame',xc:'#ff8a2a'},
 diamond:{b:['#eaf6ff','#c2e2ff'],f:'#eaf6ff',e:'dot',m:'smile',ec:'#4a8ad8',x:'gem',xc:'#9ae8ff'},
 digital:{b:['#d8c8a0','#a89878'],f:'#2a4a2a',e:'pixel',m:'pixel',ec:'#5aff7a',x:'antenna',xc:'#5aff7a'},
 exhausted:{b:['#2a3448','#7a8498','#2a3448'],f:'#2a3448',e:'tired',m:'flat',ec:'#d8dce8'},
 festive:{b:['#e02a2a','#2aa03a','#e02a2a'],f:'#e02a2a',e:'happy',m:'smile',x:'bow',xc:'#e83a3a'},
 fire:{b:['#ff5a1a','#ffa020'],f:'#e8401a',e:'angry',m:'grin',ec:'#ffe03a',x:'flame',xc:'#ffb020'},
 frosty:{b:['#f4f8ff','#cfe4ff'],f:'#f4f8ff',e:'dot',m:'smile',ec:'#3a6ac8',x:'tophat',xc:'#1a1a1a'},
 fuzzy:{b:['#9a6a4a','#7a5034'],f:'#9a6a4a',e:'happy',m:'smile',ec:'#2a1a10',x:'flower',xc:'#fff4c0'},
 gummy:{b:['#b07ae0','#5ad8a0','#b07ae0'],f:'#b07ae0',e:'big',m:'smile'},
 hasty:{b:['#f4f4f4','#d0d0d0'],f:'#f4f4f4',e:'happy',m:'tiny',ec:'#22283a'},
 honey:{b:['#ffd23f','#22283a','#ffd23f'],f:'#ffd23f',e:'happy',m:'grin',ec:'#22283a'},
 lion:{b:['#c8803a','#8a5020'],f:'#e0a050',e:'angry',m:'snout',ec:'#3a2010',x:'mane',xc:'#8a5020'},
 looker:{b:['#2ad85a','#22283a','#2ad85a'],f:'#2ad85a',e:'big',m:'none'},
 music:{b:['#22283a','#f2f2f2','#22283a'],f:'#22283a',e:'note',m:'smile'},
 ninja:{b:['#22283a','#3a5ad8'],f:'#22283a',e:'mask',m:'none',mc:'#3a5ad8'},
 photon:{b:['#fff07a','#ffffff','#fff07a'],f:'#fff07a',e:'happy',m:'teeth',ec:'#22283a',glow:1},
 precise:{b:['#c82a2a','#3a3a3a'],f:'#c82a2a',e:'scope',m:'flat'},
 puppy:{b:['#e8c890','#8a5a32'],f:'#e8c890',e:'dot',m:'snout',ec:'#2a1a10',x:'ears',xc:'#6a4020'},
 rad:{b:['#f4f4f4','#e83a3a','#f4f4f4'],f:'#f4f4f4',e:'shades',m:'smile',ec:'#e83a3a'},
 rage:{b:['#ff6a3a','#e83a2a'],f:'#ff6a3a',e:'angry',m:'frown',ec:'#3a0a0a'},
 rascal:{b:['#22283a','#e83a3a','#22283a'],f:'#22283a',e:'angry',m:'grin',ec:'#ff5a4a'},
 riley:{b:['#e83a3a','#22283a'],f:'#22283a',e:'angry',m:'fang',ec:'#ff5a4a',x:'horns',xc:'#e83a3a'},
 shocked:{b:['#22283a','#f4f4f4','#22283a'],f:'#f4f4f4',e:'wide',m:'o',ec:'#22283a'},
 shy:{b:['#c8c8c8','#a8a8a8'],f:'#c8c8c8',e:'line',m:'tiny',ec:'#3a3a3a',bl:1},
 spicy:{b:['#c81a1a','#8a1010'],f:'#c81a1a',e:'angry',m:'grin',ec:'#ffd23f',x:'pepper',xc:'#3aa83a'},
 stubborn:{b:['#22283a','#ffd23f','#22283a'],f:'#22283a',e:'line',m:'frown'},
 tabby:{b:['#ff9a3a','#c8601a','#ff9a3a'],f:'#ff9a3a',e:'dot',m:'cat',ec:'#3a1a0a',x:'ears',xc:'#c8601a'},
 tadpole:{b:['#2ab08a','#1a6a6a'],f:'#2ab08a',e:'dot',m:'smile',sz:.7},
 vector:{b:['#e8e8f0','#a0a0b8'],f:'#e8e8f0',e:'tri',m:'flat',ec:'#5a3ad8'},
 vicious:{b:['#22283a','#3a4a7a'],f:'#22283a',e:'angry',m:'fang',x:'spikes',xc:'#e8f0ff'},
 windy:{b:['#f0f8ff','#c8dcec'],f:'#f0f8ff',e:'happy',m:'smile',ec:'#5a7a9a',x:'cloud',xc:'#ffffff'}};
const beeStyle=t=>BEE_STYLE[t]||BEE_STYLE.basic;
const beeColHex=t=>beeStyle(t).b[0].slice(1);
const lumOf=h=>{const n=parseInt(h.slice(1),16);return ((n>>16&255)*.3+(n>>8&255)*.59+(n&255)*.11)/255};
// 顔（64×64）
function drawBeeFace(g,t,W){const S=beeStyle(t);W=W||64;const k=W/64;g.save();g.scale(k,k);
  g.fillStyle=S.f;g.fillRect(0,0,64,64);const ec=S.ec||(lumOf(S.f)<.5?'#ffffff':'#22283a');g.fillStyle=ec;g.strokeStyle=ec;g.lineCap='round';g.lineJoin='round';g.lineWidth=4.5;
  const ell=(x,y,rx,ry,col)=>{if(col)g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();g.fillStyle=ec},line=(a,b,c,d)=>{g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke()};
  switch(S.e){
   case 'dot':ell(22,27,3.6,6);ell(42,27,3.6,6);break;
   case 'cute':ell(22,29,3,4.5);ell(42,29,3,4.5);break;
   case 'happy':g.beginPath();g.arc(22,30,6,Math.PI*1.15,Math.PI*1.85);g.stroke();g.beginPath();g.arc(42,30,6,Math.PI*1.15,Math.PI*1.85);g.stroke();break;
   case 'angry':ell(22,29,4,4.5);ell(42,29,4,4.5);line(14,19,27,24);line(50,19,37,24);break;
   case 'tired':line(16,28,28,30);line(36,30,48,28);ell(22,32,3.5,2);ell(42,32,3.5,2);break;
   case 'line':line(16,28,27,28);line(37,28,48,28);break;
   case 'shades':g.fillStyle='#111';g.fillRect(10,21,44,5);ell(21,28,9,7,'#111');ell(43,28,9,7,'#111');g.fillStyle='rgba(255,255,255,.35)';g.fillRect(15,24,5,3);g.fillRect(37,24,5,3);g.fillStyle=ec;break;
   case 'wide':g.lineWidth=3.5;g.beginPath();g.arc(22,27,6,0,TAU);g.stroke();g.beginPath();g.arc(42,27,6,0,TAU);g.stroke();ell(22,27,2.4,2.4);ell(42,27,2.4,2.4);g.lineWidth=4.5;break;
   case 'big':ell(21,27,8,9,'#ffffff');ell(43,27,8,9,'#ffffff');ell(23,28,3.5,4.5,'#111');ell(45,28,3.5,4.5,'#111');break;
   case 'x':line(16,21,27,32);line(27,21,16,32);line(37,21,48,32);line(48,21,37,32);break;
   case 'mask':g.fillStyle=S.mc;g.fillRect(0,18,64,18);ell(22,27,4.5,3,'#ffffff');ell(42,27,4.5,3,'#ffffff');break;
   case 'goggles':g.lineWidth=4;g.beginPath();g.arc(21,27,8,0,TAU);g.stroke();g.beginPath();g.arc(43,27,8,0,TAU);g.stroke();line(29,27,35,27);ell(21,27,3,3);ell(43,27,3,3);g.lineWidth=4.5;break;
   case 'visor':g.fillStyle='#22283a';g.fillRect(8,19,48,15);ell(22,26,4,3,'#7ae0ff');ell(42,26,4,3,'#7ae0ff');break;
   case 'cool':g.fillRect(14,25,13,6);g.fillRect(37,25,13,6);break;
   case 'pixel':for(const [x,y] of[[18,22],[42,22],[18,28],[42,28]])g.fillRect(x,y,5,5);break;
   case 'note':ell(20,30,4,3.5);g.fillRect(22,16,3,15);ell(42,27,3.6,6);break;
   case 'scope':g.lineWidth=3;g.beginPath();g.arc(42,27,8,0,TAU);g.stroke();line(42,17,42,37);line(32,27,52,27);ell(22,27,3.6,5);g.lineWidth=4.5;break;
   case 'tri':g.beginPath();g.moveTo(16,32);g.lineTo(22,21);g.lineTo(28,32);g.closePath();g.fill();g.beginPath();g.moveTo(36,32);g.lineTo(42,21);g.lineTo(48,32);g.closePath();g.fill();break}
  switch(S.m){
   case 'smile':g.beginPath();g.arc(32,36,9,Math.PI*.18,Math.PI*.82);g.stroke();break;
   case 'grin':g.beginPath();g.moveTo(20,40);g.quadraticCurveTo(32,54,44,40);g.closePath();g.fill();break;
   case 'tiny':g.beginPath();g.arc(32,40,4,Math.PI*.15,Math.PI*.85);g.stroke();break;
   case 'frown':g.beginPath();g.arc(32,52,9,Math.PI*1.2,Math.PI*1.8);g.stroke();break;
   case 'flat':line(25,45,39,45);break;
   case 'o':ell(32,45,4,5);break;
   case 'fang':g.beginPath();g.arc(32,38,10,Math.PI*.15,Math.PI*.85);g.stroke();g.beginPath();g.moveTo(26,46);g.lineTo(29,52);g.lineTo(31,46);g.fill();break;
   case 'teeth':g.fillRect(22,40,20,9);g.fillStyle=S.f;for(let x=26;x<42;x+=5)g.fillRect(x,40,1.5,9);g.fillStyle=ec;break;
   case 'snout':ell(32,44,9,7,'rgba(255,240,220,.85)');ell(32,41,3.5,2.5,'#2a1a10');g.lineWidth=2.5;g.beginPath();g.arc(32,44,4,Math.PI*.2,Math.PI*.8);g.stroke();g.lineWidth=4.5;break;
   case 'cat':g.lineWidth=3;g.beginPath();g.arc(28,42,4,0,Math.PI);g.stroke();g.beginPath();g.arc(36,42,4,0,Math.PI);g.stroke();ell(32,40,2.5,2);g.lineWidth=4.5;break;
   case 'pixel':g.fillRect(22,42,20,4);g.fillRect(18,38,4,4);g.fillRect(42,38,4,4);break}
  if(S.bl){ell(14,38,5,3,'rgba(255,120,150,.75)');ell(50,38,5,3,'rgba(255,120,150,.75)')}
  g.restore()}
const _bfc={};function beeFaceCanvas(t){if(_bfc[t])return _bfc[t];const c=document.createElement('canvas');c.width=c.height=64;drawBeeFace(c.getContext('2d'),t);return _bfc[t]=c}
const _bfu={};function beeFaceURL(t){return _bfu[t]||(_bfu[t]=beeFaceCanvas(t).toDataURL())}
// しま（体のまわりを一周する帯）。dir: 0=横（後ろ→前）1=横（前→後ろ）2=上（前が上）3=下（後ろが上）
function bandCanvas(t,dir){const S=beeStyle(t),c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),n=S.b.length;
  for(let i=0;i<n;i++){const k=dir===1||dir===2?n-1-i:i;g.fillStyle=S.b[k];if(dir<2)g.fillRect(i*32/n,0,32/n+1,32);else g.fillRect(0,i*32/n,32,32/n+1)}
  g.fillStyle='rgba(0,0,0,.08)';if(dir<2)g.fillRect(0,30,32,2);return c}
const _bmat={};
function beeMats(t){if(_bmat[t])return _bmat[t];const S=beeStyle(t);const tx=c=>{const x=new THREE.CanvasTexture(c);x.encoding=THREE.sRGBEncoding;x.magFilter=THREE.NearestFilter;return x};
  const mk=c=>new THREE.MeshLambertMaterial({map:tx(c),emissive:S.glow?0x5a5a20:0x000000});
  const face=document.createElement('canvas');face.width=face.height=64;drawBeeFace(face.getContext('2d'),t);
  return _bmat[t]=[mk(bandCanvas(t,0)),mk(bandCanvas(t,1)),mk(bandCanvas(t,2)),mk(bandCanvas(t,3)),new THREE.MeshLambertMaterial({color:S.b[0]}),mk(face)]}
const BEE_BOX=new THREE.BoxGeometry(.56,.5,.62),BEE_WING=new THREE.PlaneGeometry(.72,.38);
const WING_MAT=new THREE.MeshLambertMaterial({color:0xdcecff,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false});
function beeExtra(G0,S){const c=S.xc?M(parseInt(S.xc.slice(1),16)):MAT.white,add=(geo,x,y,z,rx,rz)=>{const m=new THREE.Mesh(geo,c);m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(rz)m.rotation.z=rz;G0.add(m);return m};
  switch(S.x){
   case 'horns':add(new THREE.ConeGeometry(.06,.24,5),-.16,.36,-.12,0,.35);add(new THREE.ConeGeometry(.06,.24,5),.16,.36,-.12,0,-.35);break;
   case 'ears':add(new THREE.BoxGeometry(.14,.14,.08),-.19,.31,-.12);add(new THREE.BoxGeometry(.14,.14,.08),.19,.31,-.12);break;
   case 'party':add(new THREE.ConeGeometry(.12,.3,8),.05,.4,-.05,0,-.2);break;
   case 'tophat':add(new THREE.CylinderGeometry(.15,.15,.22,10),0,.38,-.04);add(new THREE.CylinderGeometry(.24,.24,.03,12),0,.27,-.04);break;
   case 'fin':add(new THREE.BoxGeometry(.04,.22,.3),0,.34,0,0,0).rotation.x=-.4;break;
   case 'antenna':add(new THREE.CylinderGeometry(.015,.015,.22,4),0,.36,0);add(new THREE.SphereGeometry(.05,6,5),0,.48,0);break;
   case 'bow':add(new THREE.BoxGeometry(.32,.08,.1),0,.29,-.05);add(new THREE.BoxGeometry(.1,.12,.12),0,.3,-.05);break;
   case 'flame':for(const [x,h] of[[-.12,.3],[.08,.4],[.18,.26]])add(new THREE.ConeGeometry(.07,h,5),x,.25+h/2,0);break;
   case 'spikes':for(const x of[-.16,0,.16])add(new THREE.ConeGeometry(.05,.22,4),x,.36,-.06);break;
   case 'pepper':add(new THREE.ConeGeometry(.05,.16,5),.1,.33,0,0,-.4);break;
   case 'flower':for(const x of[-.14,.12])add(new THREE.SphereGeometry(.05,6,5),x,.27,-.1);break;
   case 'mane':add(new THREE.BoxGeometry(.66,.6,.08),0,0,-.28);break;
   case 'gem':add(new THREE.OctahedronGeometry(.08),0,.36,0);break;
   case 'cloud':for(const x of[-.12,.06,.18])add(new THREE.SphereGeometry(.09,6,5),x,.3,.05);break}}
// ハチの横に出るレベルの数字（本家のように、いつも見える）
const _lvm={};function lvMat(n){if(_lvm[n])return _lvm[n];const t=ctex(64,64,(g)=>{g.fillStyle='rgba(20,22,30,.85)';g.fillRect(8,8,48,48);g.fillStyle='#fff';g.font='900 '+(n>=100?26:n>=10?34:40)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(n,32,35)});
  return _lvm[n]=new THREE.SpriteMaterial({map:t,depthWrite:false})}
function beeLvTag(b,lv){b.lvS=lv;let s=b.m.userData.tag;if(!s){s=new THREE.Sprite(lvMat(lv));s.position.set(.4,.4,0);s.scale.set(.22,.22,1);b.m.add(s);b.m.userData.tag=s}else s.material=lvMat(lv)}
function beeMesh(t,g){const S=beeStyle(t),G0=new THREE.Group(),body=new THREE.Mesh(BEE_BOX,beeMats(t));body.castShadow=true;G0.add(body);
  const wl=new THREE.Group(),wr=new THREE.Group();wl.position.set(-.26,.2,.04);wr.position.set(.26,.2,.04);
  for(const [p,s] of[[wl,-1],[wr,1]]){const w=new THREE.Mesh(BEE_WING,WING_MAT);w.rotation.x=-Math.PI/2;w.position.x=s*.36;p.add(w);G0.add(p)}
  beeExtra(G0,S);
  if(g){const s=new THREE.Mesh(new THREE.OctahedronGeometry(.1),M(0xfff07a,{emissive:0x6a5a00}));s.position.set(0,.55,0);G0.add(s)}
  if(S.sz)G0.scale.setScalar(S.sz);
  G0.userData={wl,wr};scene.add(G0);return G0}
