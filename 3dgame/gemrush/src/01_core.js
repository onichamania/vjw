(()=>{
'use strict';
const $=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2,rr=(a,b)=>a+Math.random()*(b-a);
const angd=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a};
let _sd=777;const srnd=()=>(_sd=(_sd*16807)%2147483647)/2147483647;
function hash2(a,b){let n=(a*374761393+b*668265263)|0;n=(n^(n>>>13))*1274126177|0;return((n^(n>>>16))>>>0)/4294967295}

// ---- 3dame の設定（横画面・音・画質） ----
const S={land:false,sound:true,vol:.7,quality:'high'};
try{const o=JSON.parse(localStorage.getItem('3dame-settings'));if(o)for(const k in S)if(typeof o[k]===typeof S[k])S[k]=o[k]}catch(e){}
const Q={eco:{pr:.8,sh:1024},normal:{pr:1.1,sh:1536},high:{pr:1.5,sh:2048},max:{pr:2,sh:2048}}[S.quality]||{pr:1.5,sh:2048};
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}};
const LSset=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
let ROT=S.land;
const VW=()=>ROT?innerHeight:innerWidth,VH=()=>ROT?innerWidth:innerHeight;

// ---- 描画 ----
const renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,Q.pr));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x7cc4ef);scene.fog=new THREE.Fog(0x9fd3ef,70,150);
const cam=new THREE.PerspectiveCamera(36,1,.5,300);
const hemi=new THREE.HemisphereLight(0xdcefff,0x6b5a40,.5);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1dc,1.15);sun.position.set(-16,40,22);sun.castShadow=true;
sun.shadow.mapSize.set(Q.sh,Q.sh);const sc=sun.shadow.camera;sc.left=-38;sc.right=38;sc.top=38;sc.bottom=-38;sc.near=1;sc.far=120;sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;
scene.add(sun);scene.add(sun.target);
// トゥーン（アニメ調の段階的な陰影）
const gradTex=new THREE.DataTexture(new Uint8Array([90,90,90,255,160,160,160,255,235,235,235,255]),3,1,THREE.RGBAFormat);gradTex.minFilter=gradTex.magFilter=THREE.NearestFilter;gradTex.needsUpdate=true;
const M=(hex,o)=>{const m=new THREE.MeshToonMaterial(Object.assign({color:hex,gradientMap:gradTex},o||{}));m.color.convertSRGBToLinear();if(m.emissive)m.emissive.convertSRGBToLinear();return m};
const MB=(hex,o)=>{const m=new THREE.MeshBasicMaterial(Object.assign({color:hex},o||{}));m.color.convertSRGBToLinear();return m};
const ctex=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t};
// ---- 本家風の見た目：黒い輪郭線（裏返した面を少しふくらませて描く）----
const OUTLINE=new THREE.MeshBasicMaterial({color:0x14121c,side:THREE.BackSide});
OUTLINE.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed=vec3(position)+normal*0.032;')};
const OUTLINE_BOX=new THREE.MeshBasicMaterial({color:0x2a1f18,side:THREE.BackSide});
// ---- 壁のテクスチャ（木箱・石・氷・丸太・砂岩）。白っぽく描いて、テーマの色をかけて使う ----
const WTEX={};
function noiseDots(g,w,h,n,a){for(let i=0;i<n;i++){g.fillStyle=Math.random()<.5?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a*1.2})`;g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5)}}
function shadeBottom(g,w,h){const gr=g.createLinearGradient(0,h*.55,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=gr;g.fillRect(0,0,w,h)}
function wallTex(kind){if(WTEX[kind])return WTEX[kind];const S=128;let side,top;
  if(kind==='crate'){
    side=ctex(S,S,(g)=>{g.fillStyle='#eeeeee';g.fillRect(0,0,S,S);for(let i=1;i<4;i++){g.fillStyle='#9c9c9c';g.fillRect(0,i*S/4-1,S,3)}for(let i=0;i<40;i++){g.fillStyle='rgba(120,120,120,.18)';g.fillRect(Math.random()*S,Math.random()*S,10+Math.random()*30,1)}
      g.save();g.translate(S/2,S/2);g.rotate(Math.atan2(S,S));g.fillStyle='#d8d8d8';g.fillRect(-S*.75,-9,S*1.5,18);g.fillStyle='#8a8a8a';g.fillRect(-S*.75,-10,S*1.5,2);g.fillRect(-S*.75,8,S*1.5,2);g.restore();
      g.lineWidth=12;g.strokeStyle='#c4c4c4';g.strokeRect(6,6,S-12,S-12);g.lineWidth=2;g.strokeStyle='#7e7e7e';g.strokeRect(12,12,S-24,S-24);g.strokeRect(1,1,S-2,S-2);
      g.fillStyle='#6a6a6a';for(const [x,y] of[[9,9],[S-9,9],[9,S-9],[S-9,S-9]]){g.beginPath();g.arc(x,y,2.5,0,TAU);g.fill()}noiseDots(g,S,S,500,.06);shadeBottom(g,S,S)});
    top=ctex(S,S,(g)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);for(let i=1;i<4;i++){g.fillStyle='#b4b4b4';g.fillRect(i*S/4-1,0,3,S)}for(let i=0;i<30;i++){g.fillStyle='rgba(140,140,140,.18)';g.fillRect(Math.random()*S,Math.random()*S,1,10+Math.random()*30)}
      g.lineWidth=12;g.strokeStyle='#d6d6d6';g.strokeRect(6,6,S-12,S-12);g.lineWidth=2;g.strokeStyle='#8e8e8e';g.strokeRect(12,12,S-24,S-24);g.strokeRect(1,1,S-2,S-2);noiseDots(g,S,S,400,.05)})}
  else if(kind==='log'){
    side=ctex(S,S,(g)=>{for(let i=0;i<3;i++){const y=i*S/3,gr=g.createLinearGradient(0,y,0,y+S/3);gr.addColorStop(0,'#cfcfcf');gr.addColorStop(.35,'#f2f2f2');gr.addColorStop(1,'#8e8e8e');g.fillStyle=gr;g.fillRect(0,y,S,S/3);
      for(let k=0;k<6;k++){g.strokeStyle='rgba(90,90,90,.25)';g.lineWidth=1;g.beginPath();const yy=y+6+Math.random()*(S/3-12);g.moveTo(0,yy);g.bezierCurveTo(S*.3,yy+3,S*.6,yy-3,S,yy);g.stroke()}g.fillStyle='#6e6e6e';g.fillRect(0,y+S/3-2,S,2)}noiseDots(g,S,S,300,.05);shadeBottom(g,S,S)});
    top=ctex(S,S,(g)=>{g.fillStyle='#e8e8e8';g.fillRect(0,0,S,S);for(let r=0;r<3;r++){const cx=S/2,cy=r*S/3+S/6;for(let k=5;k>0;k--){g.fillStyle=k%2?'#f6f6f6':'#cdcdcd';g.beginPath();g.ellipse(cx,cy,S*.48*k/5,S/6*k/5,0,0,TAU);g.fill()}}g.lineWidth=3;g.strokeStyle='#8e8e8e';g.strokeRect(1.5,1.5,S-3,S-3)})}
  else if(kind==='ice'){
    side=ctex(S,S,(g)=>{const gr=g.createLinearGradient(0,0,0,S);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#c9d7e2');g.fillStyle=gr;g.fillRect(0,0,S,S);g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=6;for(let i=0;i<3;i++){g.beginPath();const x=Math.random()*S;g.moveTo(x,0);g.lineTo(x-40,S);g.stroke()}
      g.strokeStyle='rgba(110,140,170,.45)';g.lineWidth=1.5;for(let i=0;i<5;i++){g.beginPath();let x=Math.random()*S,y=Math.random()*S;g.moveTo(x,y);for(let k=0;k<4;k++){x+=rr(-18,18);y+=rr(-18,18);g.lineTo(x,y)}g.stroke()}g.lineWidth=3;g.strokeStyle='#9fb6c8';g.strokeRect(1.5,1.5,S-3,S-3);shadeBottom(g,S,S)});
    top=ctex(S,S,(g)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);for(let i=0;i<60;i++){g.fillStyle='rgba(200,225,245,.5)';g.beginPath();g.arc(Math.random()*S,Math.random()*S,2+Math.random()*5,0,TAU);g.fill()}g.lineWidth=10;g.strokeStyle='rgba(215,232,245,1)';g.strokeRect(5,5,S-10,S-10);g.lineWidth=2;g.strokeStyle='#a9c0d2';g.strokeRect(1,1,S-2,S-2)})}
  else{// 石・砂岩：ずらして積んだブロック
    const sand=kind==='sandstone',rows=sand?3:4;
    side=ctex(S,S,(g)=>{g.fillStyle='#8f8f8f';g.fillRect(0,0,S,S);const bh=S/rows;for(let r=0;r<rows;r++){const n=sand?2:3,bw=S/n,off=r%2?bw/2:0;for(let i=-1;i<=n;i++){const x=i*bw+off,y=r*bh,v=200+Math.floor(Math.random()*40);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x+2,y+2,bw-4,bh-4);
        g.fillStyle='rgba(255,255,255,.55)';g.fillRect(x+2,y+2,bw-4,3);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x+2,y+bh-5,bw-4,3)}}noiseDots(g,S,S,700,.07);shadeBottom(g,S,S)});
    top=ctex(S,S,(g)=>{g.fillStyle='#f4f4f4';g.fillRect(0,0,S,S);g.fillStyle='#d2d2d2';g.fillRect(0,S/2-1.5,S,3);if(!sand)g.fillRect(S/2-1.5,0,3,S);g.lineWidth=10;g.strokeStyle='#e2e2e2';g.strokeRect(5,5,S-10,S-10);g.lineWidth=2.5;g.strokeStyle='#9a9a9a';g.strokeRect(1.25,1.25,S-2.5,S-2.5);noiseDots(g,S,S,500,.06)})}
  return WTEX[kind]={side,top}}
const THEME_WALLS={sand:['crate','stone','crate'],grass:['crate','stone','crate'],snow:['ice','stone','ice'],forest:['log','stone','crate'],pitch:['stone','stone','stone'],desert:['crate','sandstone','crate']};
// 壁の形：4つの横の面＋上の面（材料2つで描く回数を少なく）
function wallGeo(w,h){const g=new THREE.BufferGeometry(),P=[],N=[],U=[],I=[];const x=w/2,z=w/2;
  const quad=(a,b,c,d,n)=>{const o=P.length/3;P.push(...a,...b,...c,...d);for(let i=0;i<4;i++)N.push(...n);U.push(0,0,1,0,1,1,0,1);I.push(o,o+1,o+2,o,o+2,o+3)};
  quad([-x,0,z],[x,0,z],[x,h,z],[-x,h,z],[0,0,1]);quad([x,0,-z],[-x,0,-z],[-x,h,-z],[x,h,-z],[0,0,-1]);quad([x,0,z],[x,0,-z],[x,h,-z],[x,h,z],[1,0,0]);quad([-x,0,-z],[-x,0,z],[-x,h,z],[-x,h,-z],[-1,0,0]);
  const sideN=I.length;quad([-x,h,z],[x,h,z],[x,h,-z],[-x,h,-z],[0,1,0]);
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
  g.addGroup(0,sideN,0);g.addGroup(sideN,6,1);return g}
// ---- 草むら：とがった葉をたくさん（1つの形にまとめる）。根元は暗く、先は明るい ----
function bushGeo(seed){let sd=seed*9301+49297;const rn=()=>(sd=(sd*9301+49297)%233280)/233280;const P=[],C=[];
  const n=34;for(let i=0;i<n;i++){const a=rn()*TAU,d=Math.sqrt(rn())*.86,bx=Math.cos(a)*d,bz=Math.sin(a)*d,h=.85+rn()*.6-d*.25,lean=.22+rn()*.28,tx2=bx+Math.cos(a)*lean,tz2=bz+Math.sin(a)*lean,w=.16+rn()*.08,ro=rn()*TAU;
    const base=[0,1,2].map(k=>[bx+Math.cos(ro+k*TAU/3)*w,0,bz+Math.sin(ro+k*TAU/3)*w]),tip=[tx2,h,tz2];
    for(let k=0;k<3;k++){const p=base[k],q=base[(k+1)%3];P.push(...p,...q,...tip);C.push(.42,.42,.42,.42,.42,.42,1.18,1.18,1.18)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();return g}
const BUSHGEO=[0,1,2,3].map(bushGeo),BUSHDOME=new THREE.SphereGeometry(.98,16,8,0,TAU,0,Math.PI/2);BUSHDOME.scale(1,.78,1);
let BUSHL=[];
// ---- 水：さざ波（動かす）----
const waterTex=ctex(128,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#46b6f2');gr.addColorStop(1,'#2f8fe0');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=3;g.lineCap='round';for(let i=0;i<14;i++){const x=Math.random()*w,y=Math.random()*h,l=10+Math.random()*18;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+l/2,y-4,x+l,y);g.stroke()}});
waterTex.wrapS=waterTex.wrapT=THREE.RepeatWrapping;

