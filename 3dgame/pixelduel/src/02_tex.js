// ===================== ピクセルのテクスチャ（キャンバスで描く） =====================
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=SET.shadow;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.autoClear=false;
$('c').appendChild(renderer.domElement);
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,600);
// 手に持った武器は別のシーン（壁にめりこまないように、あとから重ねて描く）
const vscene=new THREE.Scene(),vcam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.01,10);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=vcam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();vcam.updateProjectionMatrix()});
// 色の小道具
const hex=(c)=>{c=c.replace('#','');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]};
const css=(r,g,b)=>`rgb(${r|0},${g|0},${b|0})`;
const shadeC=(c,k)=>{const [r,g,b]=hex(c);return css(clamp(r*k,0,255),clamp(g*k,0,255),clamp(b*k,0,255))};
function ptex(w,h,draw,o){o=o||{};const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;draw(g,w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.magFilter=THREE.NearestFilter;t.minFilter=o.mip===false?THREE.NearestFilter:THREE.NearestMipmapLinearFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.image=c;return t}
// 板の壁（たて板・よこ板）。col: 基本の色
function planks(col,o){o=o||{};return ptex(16,16,(g)=>{sseed(o.seed||col.length*31);const vert=o.vert;for(let i=0;i<4;i++){const k=.86+srnd()*.22;for(let j=0;j<16;j++)for(let a=0;a<4;a++){const kk=k*(.94+srnd()*.1);g.fillStyle=shadeC(col,kk);if(vert)g.fillRect(i*4+a,j,1,1);else g.fillRect(j,i*4+a,1,1)}
    g.fillStyle=shadeC(col,.62);if(vert)g.fillRect(i*4+3,0,1,16);else g.fillRect(0,i*4+3,16,1);
    // 板の継ぎ目と釘
    const cut=(srnd()*16)|0;g.fillStyle=shadeC(col,.7);if(vert)g.fillRect(i*4,cut,3,1);else g.fillRect(cut,i*4,1,3);
    if(o.nails){g.fillStyle='#3a3530';if(vert){g.fillRect(i*4+1,2,1,1);g.fillRect(i*4+1,13,1,1)}else{g.fillRect(2,i*4+1,1,1);g.fillRect(13,i*4+1,1,1)}}}
   if(o.holes){for(let k=0;k<o.holes;k++){g.fillStyle='#1a1410';g.fillRect((srnd()*15)|0,(srnd()*15)|0,1,1)}}})}
function noiseTex(cols,o){o=o||{};return ptex(16,16,(g)=>{sseed(o.seed||cols.join('').length);for(let y=0;y<16;y++)for(let x=0;x<16;x++){g.fillStyle=cols[(srnd()*cols.length)|0];g.fillRect(x,y,1,1)}if(o.draw)o.draw(g)})}
const T={
 sand:noiseTex(['#e8c97a','#e2c072','#ecd086','#dcb868','#e6c676','#f0d690'],{seed:3}),
 road:noiseTex(['#d9b56a','#d2ad62','#ddbb72','#caa45a','#d6b068'],{seed:5}),
 track:noiseTex(['#b89048','#ae8842','#c09852'],{seed:9}),
 wood:planks('#8a6038',{nails:true,seed:11}),woodV:planks('#8a6038',{vert:true,nails:true,seed:12}),
 woodD:planks('#5e3e22',{seed:13}),woodL:planks('#a87a48',{seed:14}),
 gray:planks('#9a9288',{vert:true,nails:true,holes:3,seed:15}),grayH:planks('#8c847a',{holes:2,seed:16}),
 green:planks('#3f7a4a',{vert:true,nails:true,seed:17}),greenH:planks('#3a7044',{seed:18}),
 yellow:planks('#d8b23a',{nails:true,holes:2,seed:19}),yellowV:planks('#d0aa34',{vert:true,seed:20}),
 blue:planks('#5c7a9a',{nails:true,seed:21}),blueV:planks('#56728f',{vert:true,seed:22}),
 roof:ptex(16,16,(g)=>{sseed(23);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const row=y>>2,k=.85+srnd()*.2-(y%4===3?.25:0);g.fillStyle=shadeC('#8a4a2a',k);g.fillRect(x,y,1,1)}for(let r=0;r<4;r++){g.fillStyle='#5a2a14';g.fillRect((r%2)*4+2,r*4,1,4);g.fillRect((r%2)*4+10,r*4,1,4)}}),
 roofG:ptex(16,16,(g)=>{sseed(24);for(let y=0;y<16;y++)for(let x=0;x<16;x++){g.fillStyle=shadeC('#6a6a6a',.85+srnd()*.25-(y%4===3?.25:0));g.fillRect(x,y,1,1)}}),
 floor:planks('#7a5232',{seed:25}),floorD:planks('#5a3a20',{seed:26}),
 stone:noiseTex(['#8a8a8a','#7a7a7a','#959595','#6e6e6e','#a0a0a0'],{seed:27,draw:g=>{g.fillStyle='#555';for(let y=3;y<16;y+=4){g.fillRect(0,y,16,1);for(let x=(y%8===3?0:4);x<16;x+=8)g.fillRect(x,y-3,1,3)}}}),
 brick:noiseTex(['#9a4a3a','#8a4232','#a8564a'],{seed:28,draw:g=>{g.fillStyle='#d8c8b0';for(let y=3;y<16;y+=4){g.fillRect(0,y,16,1);for(let x=(y%8===3?2:6);x<16;x+=8)g.fillRect(x,y-3,1,3)}}}),
 metal:noiseTex(['#7a7e84','#868a90','#70747a'],{seed:29,draw:g=>{g.fillStyle='#4a4e54';g.fillRect(0,0,16,1);g.fillRect(0,0,1,16);g.fillStyle='#a8acb2';g.fillRect(2,2,1,1);g.fillRect(13,2,1,1);g.fillRect(2,13,1,1);g.fillRect(13,13,1,1)}}),
 dark:noiseTex(['#2a2420','#241e1a','#302a24'],{seed:30}),
 glass:ptex(16,16,(g)=>{g.fillStyle='#2a3a48';g.fillRect(0,0,16,16);g.fillStyle='#4a6a84';g.fillRect(2,2,5,12);g.fillRect(9,2,5,12);g.fillStyle='#8ab0cc';g.fillRect(3,3,1,4);g.fillRect(10,3,1,4);g.fillStyle='#4a3420';g.fillRect(0,0,16,1);g.fillRect(0,15,16,1);g.fillRect(0,0,1,16);g.fillRect(15,0,1,16);g.fillRect(7,0,2,16)}),
 cactus:noiseTex(['#4a9a3a','#3e8a32','#56a844','#2f7a2a'],{seed:31,draw:g=>{g.fillStyle='#e8e0a0';for(let i=0;i<8;i++)g.fillRect((i*5)%16,(i*7)%16,1,1)}}),
 rock:noiseTex(['#c89a5a','#b88a4a','#d4a868','#a87a40','#c0925a'],{seed:32}),
 rockD:noiseTex(['#a87a44','#9a6e3a','#b4864e'],{seed:33}),
 cloth:noiseTex(['#e8e0c8','#ddd4ba','#f0e8d4'],{seed:34}),
 hay:noiseTex(['#d8b84a','#c8a83a','#e4c45a','#b8982e'],{seed:35}),
 rope:noiseTex(['#b89a62','#a88a52'],{seed:36}),
 bars:ptex(16,16,(g)=>{g.clearRect(0,0,16,16);g.fillStyle='#3a3a3e';for(let x=1;x<16;x+=4)g.fillRect(x,0,2,16);g.fillRect(0,0,16,2);g.fillRect(0,14,16,2);g.fillStyle='#6a6a70';for(let x=1;x<16;x+=4)g.fillRect(x,0,1,16)},{mip:false}),
 grass:ptex(16,16,(g)=>{g.clearRect(0,0,16,16);sseed(37);for(let i=0;i<9;i++){const x=(srnd()*15)|0,h=6+(srnd()*9|0);g.fillStyle=pick(['#8a9a3a','#a0a848','#788a30']);g.fillRect(x,16-h,1,h)}},{mip:false}),
 tnt:ptex(16,16,(g)=>{g.fillStyle='#c8281e';g.fillRect(0,0,16,16);g.fillStyle='#e8e0d0';g.fillRect(0,5,16,6);g.fillStyle='#1a1a1a';g.font='bold 6px monospace';g.fillText('TNT',2,10);g.fillStyle='#8a1a14';g.fillRect(0,0,16,1);g.fillRect(0,15,16,1)},{mip:false}),
 barrel:ptex(16,16,(g)=>{for(let x=0;x<16;x++){g.fillStyle=shadeC('#8a5a30',x%4===3?.7:.95+Math.sin(x)*.05);g.fillRect(x,0,1,16)}g.fillStyle='#4a4a4e';g.fillRect(0,2,16,2);g.fillRect(0,12,16,2)}),
 crate:ptex(16,16,(g)=>{g.fillStyle='#a87a44';g.fillRect(0,0,16,16);g.fillStyle='#7a5228';g.fillRect(0,0,16,2);g.fillRect(0,14,16,2);g.fillRect(0,0,2,16);g.fillRect(14,0,2,16);for(let i=0;i<14;i++){g.fillRect(1+i,1+i,2,2)}}),
 money:noiseTex(['#5a9a4a','#6aaa5a','#4a8a3a','#e8e0c0'],{seed:38}),
 gold:noiseTex(['#ffd23f','#f0b820','#ffe26a','#d89a10'],{seed:39}),
 white:noiseTex(['#e8e8e8','#dedede','#f2f2f2'],{seed:40}),
 skull:ptex(16,16,(g)=>{g.clearRect(0,0,16,16);g.fillStyle='#f0e8d8';g.fillRect(4,4,8,8);g.fillRect(0,2,4,2);g.fillRect(12,2,4,2);g.fillRect(0,0,2,2);g.fillRect(14,0,2,2);g.fillStyle='#2a1a10';g.fillRect(5,6,2,2);g.fillRect(9,6,2,2);g.fillRect(7,10,2,1)},{mip:false})};
// 看板：文字（ピクセル風に小さく描いてから大きくする）
function signTex(text,o){o=o||{};const W=o.w||64,H=o.h||16;return ptex(W,H,(g)=>{g.fillStyle=o.bg||'#7a5232';g.fillRect(0,0,W,H);g.fillStyle=o.edge||'#4a3018';g.fillRect(0,0,W,1);g.fillRect(0,H-1,W,1);g.fillRect(0,0,1,H);g.fillRect(W-1,0,1,H);
  g.font=(o.bold===false?'':'bold ')+(o.fs||10)+'px '+(o.font||'monospace');g.textAlign='center';g.textBaseline='middle';if(o.shadow){g.fillStyle=o.shadow;g.fillText(text,W/2+1,H/2+1)}g.fillStyle=o.col||'#f0d070';g.fillText(text,W/2,H/2+.5);if(o.draw)o.draw(g,W,H)},{mip:false})}
function wantedTex(reward,face){return ptex(24,32,(g)=>{g.fillStyle='#e8dcb8';g.fillRect(0,0,24,32);g.fillStyle='#c8b890';g.fillRect(0,0,24,1);g.fillRect(0,31,24,1);g.fillStyle='#3a2a1a';g.font='bold 6px monospace';g.textAlign='center';g.fillText('WANTED',12,6);
  g.fillStyle=face||'#7a6a5a';g.fillRect(7,8,10,10);g.fillStyle='#2a1a10';g.fillRect(5,7,14,3);g.fillRect(9,11,2,2);g.fillRect(13,11,2,2);g.fillRect(6,19,12,6);g.fillStyle='#4ab8ff';g.fillRect(6,27,3,3);g.fillStyle='#3a2a1a';g.fillText(reward,15,30)},{mip:false})}
// 空：青空にピクセルの雲
const skyTex=ptex(256,128,(g,W,H)=>{for(let y=0;y<H;y++){const k=y/H;g.fillStyle=css(lerp(96,214,k),lerp(170,226,k),lerp(226,236,k));g.fillRect(0,y,W,1)}
  sseed(41);for(let i=0;i<46;i++){const cx=srnd()*W,cy=srnd()*H*.75,w=8+srnd()*26,h=2+srnd()*4;for(let k=0;k<4;k++){const x=cx+srr(-w*.4,w*.4),y=cy+srr(-2,2);g.fillStyle=k<2?'#fff6dc':'#ffe6b4';g.fillRect(x|0,y|0,(w*srr(.4,.9))|0,(h)|0)}}},{mip:false});
skyTex.wrapT=THREE.ClampToEdgeWrapping;
