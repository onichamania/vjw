// ================= アイコン（資源・道具。キャンバスで描く）=================
const ICON={};
function shade(hex,k){const c=new THREE.Color(hex);if(k>1)c.lerp(new THREE.Color('#ffffff'),k-1);else c.multiplyScalar(k);return'#'+c.getHexString()}
function iconCanvas(draw,S){S=S||64;const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');g.scale(S/64,S/64);g.lineJoin='round';g.lineCap='round';draw(g);return c}
function poly(g,pts,fill,stroke,lw){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke!==false){g.strokeStyle=stroke||'#2a1a10';g.lineWidth=lw||3;g.stroke()}}
function gem(g,col,pts,top){poly(g,pts,col);if(top)poly(g,top,shade(col,1.35),false)}
const ICON_DRAW={
 wood(g){g.save();g.translate(32,34);g.rotate(-.35);poly(g,[[-22,-9],[16,-9],[16,9],[-22,9]],'#b9773f');g.fillStyle='#9a5f30';g.fillRect(-18,-3,28,2);g.fillRect(-14,3,20,2);
   g.beginPath();g.ellipse(17,0,7,10,0,0,7);g.fillStyle='#e8b878';g.fill();g.strokeStyle='#2a1a10';g.lineWidth=3;g.stroke();g.beginPath();g.ellipse(17,0,3,5,0,0,7);g.strokeStyle='#b9773f';g.lineWidth=2;g.stroke();g.restore()},
 plank(g){g.save();g.translate(32,34);g.rotate(-.3);poly(g,[[-24,-7],[24,-7],[24,7],[-24,7]],'#e3b36a');g.fillStyle='#c99550';g.fillRect(-20,-2,40,2);poly(g,[[-24,-7],[24,-7],[22,-11],[-22,-11]],'#f0c88a');g.restore()},
 rock(g){poly(g,[[12,44],[8,30],[20,16],[38,12],[54,24],[56,42],[44,52],[22,52]],'#9aa3ad');poly(g,[[20,16],[38,12],[46,22],[30,28],[14,30]],'#c3cad2',false);poly(g,[[30,28],[46,22],[54,30],[48,40],[34,40]],'#aeb6bf',false)},
 steel(g){poly(g,[[10,40],[20,24],[54,24],[44,40]],'#b8c4d0');poly(g,[[10,40],[44,40],[44,48],[10,48]],'#8a96a4');poly(g,[[44,40],[54,24],[54,32],[44,48]],'#6e7a88');g.strokeStyle='#ffffff';g.lineWidth=2;g.beginPath();g.moveTo(24,28);g.lineTo(46,28);g.stroke()},
 azr(g){poly(g,[[14,24],[32,14],[50,24],[50,44],[32,54],[14,44]],'#2f7cf0');poly(g,[[14,24],[32,14],[50,24],[32,34]],'#6fb0ff',false);poly(g,[[32,34],[50,24],[50,44],[32,54]],'#1f5cc0',false);g.strokeStyle='#0c2a60';g.lineWidth=3;poly(g,[[14,24],[32,14],[50,24],[50,44],[32,54],[14,44]],null,'#0c2a60')},
 ame(g){poly(g,[[20,10],[44,10],[54,30],[44,54],[20,54],[10,30]],'#b25cf0','#3a1060');poly(g,[[20,10],[44,10],[38,24],[26,24]],'#e0a8ff',false);poly(g,[[26,24],[38,24],[44,40],[32,48],[20,40]],'#c47cf8',false)},
 shroom(g){poly(g,[[26,36],[38,36],[40,54],[24,54]],'#f6ead6');g.beginPath();g.ellipse(32,32,24,16,0,Math.PI,0);g.closePath();g.fillStyle='#e8423a';g.fill();g.strokeStyle='#4a1010';g.lineWidth=3;g.stroke();
   g.fillStyle='#fff';[[22,24,4],[36,20,5],[44,28,3]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill()})},
 meat(g){g.beginPath();g.ellipse(28,30,18,14,-.6,0,7);g.fillStyle='#d9715a';g.fill();g.strokeStyle='#4a1a10';g.lineWidth=3;g.stroke();g.beginPath();g.ellipse(24,26,8,5,-.6,0,7);g.fillStyle='#f0a088';g.fill();
   poly(g,[[38,40],[50,52],[46,56],[34,44]],'#f4ecdc');g.beginPath();g.arc(50,55,5,0,7);g.arc(54,51,5,0,7);g.fillStyle='#f4ecdc';g.fill();g.stroke()},
 dia(g){gem(g,'#5ff0f0',[[12,24],[22,12],[42,12],[52,24],[32,54]],[[22,12],[42,12],[46,24],[18,24]]);poly(g,[[12,24],[22,12],[42,12],[52,24],[32,54]],null,'#0a4050');g.strokeStyle='#0a4050';g.lineWidth=2;g.beginPath();g.moveTo(12,24);g.lineTo(52,24);g.moveTo(26,24);g.lineTo(32,54);g.lineTo(38,24);g.stroke()},
 sul(g){poly(g,[[16,50],[12,28],[24,12],[30,30]],'#f2dc2a','#5a4a00');poly(g,[[28,52],[26,24],[38,8],[44,26],[40,52]],'#ffe84a','#5a4a00');poly(g,[[40,52],[44,30],[54,22],[54,46]],'#d8c018','#5a4a00')},
 ura(g){poly(g,[[20,12],[44,12],[48,20],[48,48],[44,56],[20,56],[16,48],[16,20]],'#5ce04a','#0e3a08');g.fillStyle='#b6ff9a';g.fillRect(22,18,6,32);g.fillStyle='#2a8a1a';g.fillRect(16,30,32,4)},
 cact(g){poly(g,[[26,56],[26,14],[30,8],[36,8],[40,14],[40,56]],'#3faa4a','#0e3a10');poly(g,[[26,36],[14,36],[12,22],[18,22],[18,30],[26,30]],'#3faa4a','#0e3a10');poly(g,[[40,30],[50,30],[50,18],[56,18],[56,36],[40,36]],'#3faa4a','#0e3a10');g.fillStyle='#8ae08a';g.fillRect(30,14,3,36)},
 ruby(g){poly(g,[[18,12],[46,12],[56,30],[32,56],[8,30]],'#f0284a','#4a0010');poly(g,[[18,12],[46,12],[40,24],[24,24]],'#ff8aa0',false);poly(g,[[8,30],[24,24],[40,24],[56,30],[32,56]],'#d0183a',false);poly(g,[[18,12],[46,12],[56,30],[32,56],[8,30]],null,'#4a0010')},
 coin(g){g.beginPath();g.arc(32,32,22,0,7);g.fillStyle='#ffc21a';g.fill();g.strokeStyle='#6a4200';g.lineWidth=3;g.stroke();g.beginPath();g.arc(32,32,15,0,7);g.strokeStyle='#e09a00';g.lineWidth=3;g.stroke();
   g.fillStyle='#fff3b0';g.beginPath();g.ellipse(24,22,5,3,-.7,0,7);g.fill()},
 core(g){const r=g.createRadialGradient(28,26,2,32,32,24);r.addColorStop(0,'#ffffff');r.addColorStop(.4,'#ffb0f8');r.addColorStop(1,'#c030c0');g.beginPath();g.arc(32,32,22,0,7);g.fillStyle=r;g.fill();g.strokeStyle='#501050';g.lineWidth=3;g.stroke()},
 axe(g){g.strokeStyle='#2a1a10';g.lineWidth=9;g.beginPath();g.moveTo(16,54);g.lineTo(42,14);g.stroke();g.strokeStyle='#c98a4c';g.lineWidth=5;g.stroke();poly(g,[[34,12],[52,6],[56,26],[42,26]],'#cfd6de','#2a1a10')},
 pick(g){g.strokeStyle='#2a1a10';g.lineWidth=9;g.beginPath();g.moveTo(18,56);g.lineTo(40,16);g.stroke();g.strokeStyle='#c98a4c';g.lineWidth=5;g.stroke();g.beginPath();g.moveTo(14,22);g.quadraticCurveTo(38,0,58,24);g.strokeStyle='#2a1a10';g.lineWidth=9;g.stroke();g.strokeStyle='#cfd6de';g.lineWidth=5;g.stroke()},
 weap(g){poly(g,[[40,8],[48,8],[48,12],[26,40],[20,34]],'#dfe6ee','#2a1a10');poly(g,[[14,34],[30,50],[26,54],[10,38]],'#e0b030','#2a1a10');g.strokeStyle='#2a1a10';g.lineWidth=8;g.beginPath();g.moveTo(18,46);g.lineTo(10,54);g.stroke();g.strokeStyle='#8a5a30';g.lineWidth=4;g.stroke()},
 heart(g){g.beginPath();g.moveTo(32,54);g.bezierCurveTo(4,34,10,8,32,22);g.bezierCurveTo(54,8,60,34,32,54);g.fillStyle='#ff4060';g.fill();g.strokeStyle='#5a0a1a';g.lineWidth=3;g.stroke()},
 lock(g){g.strokeStyle='#2a1a10';g.lineWidth=9;g.beginPath();g.arc(32,26,11,Math.PI,0);g.stroke();g.strokeStyle='#cfd6de';g.lineWidth=5;g.stroke();poly(g,[[16,28],[48,28],[48,54],[16,54]],'#ffc21a','#2a1a10');g.fillStyle='#2a1a10';g.fillRect(30,36,4,10)}};
function iconURL(k){if(!ICON[k]){const d=ICON_DRAW[k];ICON[k]=d?iconCanvas(d,64).toDataURL():''}return ICON[k]}
const iconImg=(k,cls)=>`<img class="${cls||'ic'}" src="${iconURL(k)}" alt="">`;
// 費用の並び（アイコン＋数）
function costHTML(c,inv){return Object.keys(c).map(k=>`<span class="cst${inv&&(inv[k]||0)<c[k]?' lack':''}">${iconImg(k)}${fmt(c[k])}</span>`).join('')}
