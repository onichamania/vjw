// ================= ステージ =================
// # 壁（弾を止める）  B 草むら（中に入ると見えない）  ~ 水（通れないが弾は通る）  X パワーボックス（こわすとパワーキューブ）
// 2 赤チームの出発点  G ジェム鉱山
// ^ v < > ジャンプ台（その向きへ飛ばす）  F 木の柵（こわせる）
const MAPS={
 valley:{name:'ジェムの谷',mode:'gem',theme:'sand',top:[
 'BBB...........BBB','BB....2.2.2....BB','B...............B','...##.......##...','...##..BBB..##...','........B........','~~.....#.#.....~~',
 '~~..BB.....BB..~~','....BB.###.BB....','..#............#.','..#...BB.BB...#..','BB.....#.#.....BB','BB..##.....##..BB','......B...B......','BB...#..G..#...BB']},
 fort:{name:'こおりのとりで',mode:'gem',theme:'snow',top:[
 'BBB....~~~....BBB','.....2.2.2.......','.................','..FFF.......FFF..','..#.....B.....#..','BB#....BBB....#BB','BB.....FFF.....BB',
 '....v.......v....','~~.....#.#.....~~','~~..BB.....BB..~~','.....FF...FF.....','.##.....B.....##.','.##...BBBBB...##.','.................','BB...F..G..F...BB']},
 jungle:{name:'ジャンプの森',mode:'gem',theme:'forest',top:[
 'BBBBB.......BBBBB','BB....2.2.2....BB','B...............B','....##.....##....','.v..##.BBB.##..v.','.......BBB.......','###...........###',
 'BBB...#...#...BBB','BBB...#.v.#...BBB','.....FF...FF.....','..B.........B....','.BB..~~...~~..BB.','.....~~...~~.....','.#.............#.','BB....#.G.#....BB']},
 pitch:{name:'スタジアム',mode:'ball',theme:'pitch',top:[
 'BB##..OOOOO..##BB','......2.2.2......','.................','BB....#...#....BB','BB....#...#....BB','.................','..##.........##..',
 '..BB...BBB...BB..','.................','#......###......#','.................','..BBB.......BBB..','.................']},
 pitch2:{name:'ビーチコート',mode:'ball',theme:'desert',top:[
 '~~##..OOOOO..##~~','......2.2.2......','.................','...FF.......FF...','.................','.BB....###....BB.','.BB...........BB.',
 '.....v.....v.....','~~.............~~','~~...BB...BB...~~','.......#.#.......','..#...........#..','.................']},
 bank:{name:'ぎんこう通り',mode:'heist',theme:'sand',top:[
 '..2.....2.....2..','.................','......##K##......','BB.............BB','BB...#.....#...BB','.....#.BBB.#.....','..F...........F..',
 '..F...~~~~~...F..','.................','.##...BB.BB...##.','.##...........##.','......#...#......','BBB...........BBB','BBB....#.#....BBB','.......v.^.......']},
 meadow:{name:'パワーの草原',mode:'br',theme:'grass',q:[
 'BBB....BB....','BX.........X.','B..##..~~....','...##..~~..BB','..........BB.','.~~..X.......','.~~....##....',
 'BB.....##..X.','BB..B.......~','....BB..X...~','..#......BB..','.X#...~..BB..','....B..~....X']},
 desert:{name:'サボテン砂漠',mode:'br',theme:'desert',q:[
 '.....BBB.....','.X.........X.','...##...F....','...##...F..BB','.>..........B','..BB..X...##.','..BB......##.',
 '.....FFF.....','BB.......X...','BB..##.......','....##..BB..v','.X.......BB..','....~~...F..X']}};
const THEMES={
 sand:{floor:['#c99f5f','#bd9353'],ground:0x5c9e3c,walls:[[0xb57c46,0xdca468],[0x8c96ab,0xb3bccd],[0xa66b3f,0xd09460]],bush:[0x2e8f3a,0x43a845],leaf:[0x3f9b3c,0x56b04a,0x2f8a45],sky:0x7cc4ef},
 snow:{floor:['#d6e0ea','#c9d5e1'],ground:0xdfe9f1,walls:[[0x8fb6d6,0xd5ecff],[0x9aa6b8,0xe8f0f8],[0x7fa6c8,0xc9e6ff]],bush:[0x2f7a5a,0x3f9470],leaf:[0xf2f7fb,0xdde9f2,0x2f6f55],sky:0x9fc6e6},
 forest:{floor:['#9fb36a','#92a75e'],ground:0x3f7f34,walls:[[0x7a5a3a,0xa27a52],[0x6f7d6a,0x98a893],[0x86603c,0xb08658]],bush:[0x1f7a33,0x2f9142],leaf:[0x2f7f30,0x3d8f3a,0x246d2c],sky:0x86c8e8},
 grass:{floor:['#b9c77a','#adbc6f'],ground:0x5c9e3c,walls:[[0xb57c46,0xdca468],[0x8c96ab,0xb3bccd],[0xa66b3f,0xd09460]],bush:[0x2e8f3a,0x43a845],leaf:[0x3f9b3c,0x56b04a,0x2f8a45],sky:0x7cc4ef},
 pitch:{floor:['#6fbf5a','#63b04f'],ground:0x4f9a3c,walls:[[0x8c96ab,0xb3bccd],[0x7a8496,0xa6afc0],[0x9aa3b5,0xc0c8d6]],bush:[0x2e8f3a,0x43a845],leaf:[0x3f9b3c,0x56b04a,0x2f8a45],sky:0x7cc4ef},
 desert:{floor:['#e2b97c','#d6ac6d'],ground:0xc9a066,walls:[[0xc98a52,0xe8b27a],[0xb8927a,0xd8b8a0],[0xa8744a,0xd09460]],bush:[0x6f9a3a,0x86b04a],leaf:[0x5f9a45,0x6fae52,0x4f8a3a],sky:0x8fcbf0}};
const SWAP=(ch,h,v)=>h&&ch==='<'?'>':h&&ch==='>'?'<':v&&ch==='^'?'v':v&&ch==='v'?'^':ch;
// 本家の大きさに近づける：3対3は横21マス（左右に2マスずつ足す）、バトルロイヤルは33×33（外側に4マス足す）
function padQuarter(q,P){const n=q.length,N=n+P,out=[];for(let r=0;r<N;r++){let row='';for(let c=0;c<N;c++){if(r>=P&&c>=P){row+=q[r-P][c-P];continue}
    const k=hash2(c*31+7,r*17+3),cl=hash2(Math.floor(c/2)+11,Math.floor(r/2)+5);row+=cl<.3&&k<.85?'B':k<.07?'X':cl>.86&&k<.5?'#':'.'}out.push(row)}return out}
function mapRows(id){const D=MAPS[id];
  if(D.q){const q=padQuarter(D.q,4),n=q.length,N=n*2-1,rows=[];for(let r=0;r<N;r++){const r0=r<n?r:N-1-r;let s='';for(let c=0;c<N;c++){const c0=c<n?c:N-1-c;s+=SWAP(q[r0][c0],c>=n,r>=n)}rows.push(s)}return rows}
  const pad=ch=>ch==='B'||ch==='~'?ch+ch:'..',top=D.top.map(r=>r.includes('O')||r.includes('2')&&r.indexOf('2')<3?'..'+r+'..':pad(r[0])+r+pad(r[r.length-1]));
  const rows=top.slice();for(let i=top.length-2;i>=0;i--)rows.push([...top[i]].reverse().map(ch=>SWAP(ch,1,1)).join('').replace(/2/g,'1'));return rows}
const PADDIR={'^':[0,-1],'v':[0,1],'<':[-1,0],'>':[1,0]};
let MAP,MW,MH,GRID,SPAWN,MINE,HALFX,HALFZ,MX=0,MZ=0,MODE='gem',MAPID='valley',TH=THEMES.sand;const TS=2;
const tx=c=>(c-(MW-1)/2)*TS,tz=r=>(r-(MH-1)/2)*TS;          // タイル→座標
const cx=x=>Math.floor(x/TS+MW/2),cz=z=>Math.floor(z/TS+MH/2); // 座標→タイル
const cell=(c,r)=>c<0||r<0||c>=MW||r>=MH?'#':GRID[r][c];
const blockMove=(c,r)=>{const ch=cell(c,r);return ch==='#'||ch==='~'||ch==='X'||ch==='F'||ch==='K'};
const blockShot=(c,r)=>{const ch=cell(c,r);return ch==='#'||ch==='X'||ch==='F'};
const breakable=(c,r)=>{const ch=cell(c,r);return ch==='X'||ch==='F'};
const isBush=(x,z)=>cell(cx(x),cz(z))==='B';
// 弾が通るか（壁にぶつかるまでの距離）
function rayWall(x,z,dx,dz,maxd){const st=.25;for(let d=st;d<=maxd;d+=st){if(blockShot(cx(x+dx*d),cz(z+dz*d)))return d-st}return maxd}
const los=(ax,az,bx,bz)=>{const d=Math.hypot(bx-ax,bz-az);return d<.01||rayWall(ax,az,(bx-ax)/d,(bz-az)/d,d)>=d-.3};

const ARENA=new THREE.Group();scene.add(ARENA);
// まわりの芝生
const grassTex=ctex(256,256,(g,w,h)=>{g.fillStyle='#dcdcdc';g.fillRect(0,0,w,h);for(let i=0;i<4000;i++){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.14)':'rgba(255,255,255,.22)';g.fillRect(Math.random()*w,Math.random()*h,2,3)}});
grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;grassTex.repeat.set(40,40);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshLambertMaterial({map:grassTex}));ground.rotation.x=-Math.PI/2;ground.position.y=-.03;ground.receiveShadow=true;scene.add(ground);
let wallMats=[];const matCache={};const MC=h=>matCache[h]||(matCache[h]=M(h));
const wallG=new THREE.BoxGeometry(TS,1.55,TS),capG=new THREE.BoxGeometry(TS*.9,.16,TS*.9),plankG=new THREE.BoxGeometry(TS*1.002,.08,TS*1.002);
const bushMat=M(0x2e8f3a,{vertexColors:true}),bushMat2=M(0x43a845),bushT=bushMat.clone(),bushT2=bushMat2.clone();bushT.transparent=bushT2.transparent=true;bushT.opacity=bushT2.opacity=.38;bushT.depthWrite=bushT2.depthWrite=false;
const fenceMat=M(0xa8743f),fenceTop=M(0xd9a064),padMat=M(0xffc53d,{emissive:0x7a4a00}),padBase=M(0x4a4f5e);
const fenceG=new THREE.BoxGeometry(TS*.94,.9,.28),postG=new THREE.BoxGeometry(.22,1.15,.22);
const bG=new THREE.IcosahedronGeometry(1,1);
const waterMat=new THREE.MeshPhongMaterial({color:0xffffff,map:waterTex,specular:0xffffff,shininess:90,transparent:true,opacity:.9});waterMat.color.convertSRGBToLinear();
const waterG=new THREE.PlaneGeometry(TS,TS);waterG.rotateX(-Math.PI/2);
const boxMat=M(0x6b4a8a),boxCap=M(0x57d68d,{emissive:0x1f6b3c}),boxG=new THREE.BoxGeometry(TS*.86,1.3,TS*.86),boxTopG=new THREE.BoxGeometry(TS*.5,.3,TS*.5);
let WALLM={},BUSH={},BOXM={},BOXHP={},bushSeeThrough=new Set(),PADS=[],SAFES=[];
const WALL_H=1.62,WALLGEO=wallGeo(TS,WALL_H),WALLHULL=new THREE.BoxGeometry(TS*1.035,WALL_H*1.03,TS*1.035);WALLHULL.translate(0,WALL_H*1.03/2-.01,0);
function buildWall(c,r){const k=hash2(c,r)<.55?0:hash2(r,c)<.5?1:2,g=new THREE.Group();
  const m=new THREE.Mesh(WALLGEO,wallMats[k]);m.castShadow=m.receiveShadow=true;g.add(m);const o=new THREE.Mesh(WALLHULL,OUTLINE_BOX);g.add(o);
  g.position.set(tx(c),0,tz(r));ARENA.add(g);WALLM[c+','+r]=g}
function buildBox(c,r){const g=new THREE.Group();const m=new THREE.Mesh(boxG,boxMat);m.position.y=.65;m.castShadow=true;g.add(m);const t=new THREE.Mesh(boxTopG,boxCap);t.position.y=1.4;g.add(t);
  g.position.set(tx(c),0,tz(r));ARENA.add(g);BOXM[c+','+r]=g;BOXHP[c+','+r]=3200}
function buildFence(c,r){const g=new THREE.Group(),horiz=cell(c-1,r)==='F'||cell(c+1,r)==='F'||!(cell(c,r-1)==='F'||cell(c,r+1)==='F');
  for(const o of[-.6,.6]){const f=new THREE.Mesh(fenceG,fenceMat);f.position.set(0,.3+(o>0?.4:0),0);f.scale.y=.45;f.castShadow=true;g.add(f)}
  for(const o of[-.85,0,.85]){const p=new THREE.Mesh(postG,fenceTop);p.position.set(o,.58,0);p.castShadow=true;g.add(p)}
  if(!horiz)g.rotation.y=Math.PI/2;g.position.set(tx(c),0,tz(r));ARENA.add(g);BOXM[c+','+r]=g;BOXHP[c+','+r]=1500}
function buildPad(c,r,ch){const g=new THREE.Group(),[dx,dz]=PADDIR[ch];const b=new THREE.Mesh(new THREE.CylinderGeometry(.85,.95,.14,24),padBase);b.position.y=.07;g.add(b);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.66,.66,.06,24),padMat);t.position.y=.16;g.add(t);
  const ar=new THREE.Mesh(new THREE.ConeGeometry(.34,.62,3),MB(0xffffff));ar.rotation.x=Math.PI/2;ar.position.y=.22;ar.scale.y=.25;const ag=new THREE.Group();ag.add(ar);ag.rotation.y=Math.atan2(dx,dz);g.add(ag);
  g.position.set(tx(c),0,tz(r));ARENA.add(g);PADS.push({c,r,dx,dz,t,ag})}
function buildArena(id,rule){rule=rule||MAPS[id].mode;MAPID=id;const kind=MAPS[id].mode;MODE=kind;TH=THEMES[MAPS[id].theme];wallMats=TH.walls.map(([a,b],i)=>{const kn=(THEME_WALLS[MAPS[id].theme]||THEME_WALLS.sand)[i],T2=wallTex(kn),ky=a+':'+kn;return matCache['w'+ky]||(matCache['w'+ky]=[M(a,{map:T2.side}),M(b,{map:T2.top})])});bushMat.color.setHex(TH.bush[0]).convertSRGBToLinear();bushMat2.color.setHex(TH.bush[1]).convertSRGBToLinear();bushT.color.copy(bushMat.color);bushT2.color.copy(bushMat2.color);ground.material.color.setHex(TH.ground).convertSRGBToLinear();scene.background.setHex(TH.sky);while(ARENA.children.length){const o=ARENA.children.pop();o.traverse(q=>{const mt=q.material;if(mt&&mt.isMaterial&&mt.map&&mt.map.isTexture&&mt.map!==grassTex&&mt.map!==waterTex)mt.map.dispose()})}
  WALLM={};BUSH={};BOXM={};BOXHP={};bushSeeThrough=new Set();PADS=[];BUSHL=[];
  MAP=mapRows(id);MW=MAP[0].length;MH=MAP.length;for(const row of MAP)if(row.length!==MW)throw new Error('map row '+row);
  GRID=MAP.map(r=>[...r]);SPAWN=[[],[]];MINE=null;HALFX=MW*TS/2;HALFZ=MH*TS/2;
  for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){const ch=GRID[r][c];if(ch==='1'){SPAWN[0].push([c,r]);GRID[r][c]='.'}else if(ch==='2'){SPAWN[1].push([c,r]);GRID[r][c]='.'}else if(ch==='G'){MINE=[c,r];GRID[r][c]='.'}}
  if(MINE){MX=tx(MINE[0]);MZ=tz(MINE[1]);if(rule!=='gem')MINE=null}else{MX=MZ=0}
  SAFES=[];for(let r=0;r<MH;r++)for(let c=0;c<MW;c++)if(GRID[r][c]==='K')SAFES.push({c,r,team:r<MH/2?1:0});
  const T=64,isW=(c,r)=>cell(c,r)==='#',isWater=(c,r)=>c>=0&&r>=0&&c<MW&&r<MH&&GRID[r][c]==='~',grassy=['grass','forest','pitch'].includes(MAPS[id].theme),snowy=MAPS[id].theme==='snow';
  const floorTex=ctex(MW*T,MH*T,(g,w,h)=>{
    g.fillStyle='rgba(0,0,0,1)';g.fillRect(0,0,w,h);
    // タイル1枚ずつ：少し色をゆらし、上と左を明るく、下と右を暗くしてふちを出す
    for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){const x=c*T,y=r*T,base=new THREE.Color(TH.floor[(c+r)%2]);const v=(hash2(c*7,r*3)-.5)*.06;base.offsetHSL(0,0,v);
      g.fillStyle='#'+base.getHexString();g.fillRect(x,y,T,T);g.fillStyle='rgba(0,0,0,.20)';g.fillRect(x,y+T-3,T,3);g.fillRect(x+T-3,y,3,T);g.fillStyle='rgba(255,255,255,.20)';g.fillRect(x,y,T,3);g.fillRect(x,y,3,T);
      // 小石・ひび・草・雪
      const k=hash2(c*13+5,r*17+3);if(k<.22){g.fillStyle='rgba(0,0,0,.14)';for(let i=0;i<3;i++){g.beginPath();g.ellipse(x+10+hash2(c+i,r)*44,y+10+hash2(r+i,c)*44,3+i,2+i*.6,0,0,TAU);g.fill()}g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.ellipse(x+20+k*80,y+30,2.5,1.6,0,0,TAU);g.fill()}
      else if(k<.32){g.strokeStyle='rgba(0,0,0,.16)';g.lineWidth=1.5;g.beginPath();let px=x+8+hash2(c,r+9)*48,py=y+8;g.moveTo(px,py);for(let i=0;i<4;i++){px+=(hash2(c+i,r*2)-.5)*18;py+=12;g.lineTo(px,py)}g.stroke()}
      else if(k<.48&&grassy){g.strokeStyle='rgba(40,110,40,.55)';g.lineWidth=2;for(let i=0;i<3;i++){const gx=x+12+hash2(c*3+i,r)*40,gy=y+16+hash2(r*3+i,c)*36;g.beginPath();g.moveTo(gx-4,gy-8);g.lineTo(gx,gy);g.lineTo(gx+4,gy-9);g.stroke()}}
      else if(k<.5&&snowy){g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.arc(x+32,y+32,5,0,TAU);g.fill()}}
    if(kind==='ball'){g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=8;g.strokeRect(12,12,w-24,h-24);g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();g.beginPath();g.arc(w/2,h/2,140,0,TAU);g.stroke();for(const y0 of[0,h-4*T]){g.strokeRect((MW-9)/2*T,y0+(y0?0:12),9*T,4*T-12)}
      for(let r=0;r<MH;r++)for(let c=0;c<MW;c++)if(GRID[r][c]==='O'){g.fillStyle='rgba(255,255,255,.35)';g.fillRect(c*T,r*T,T,T)}}
    if(kind!=='br'){const zone=(r0,r1,col)=>{g.fillStyle=col;g.fillRect(0,r0*T,w,(r1-r0)*T)};zone(0,4,'rgba(255,80,90,.16)');zone(MH-4,MH,'rgba(60,150,255,.18)')}
    // 壁ぎわの影（壁が地面に立っているように）
    for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){if(isW(c,r)||isWater(c,r))continue;const x=c*T,y=r*T,sh=(x0,y0,x1,y1,gx0,gy0,gx1,gy1)=>{const gr=g.createLinearGradient(gx0,gy0,gx1,gy1);gr.addColorStop(0,'rgba(0,0,0,.28)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x0,y0,x1-x0,y1-y0)};
      if(isW(c,r-1))sh(x,y,x+T,y+18,x,y,x,y+18);if(isW(c-1,r))sh(x,y,x+18,y+T,x,y,x+18,y);if(isW(c+1,r))sh(x+T-12,y,x+T,y+T,x+T,y,x+T-12,y);if(isW(c,r+1))sh(x,y+T-10,x+T,y+T,x,y+T,x,y+T-10)}
    // 水ぎわの白い泡
    for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){if(!isWater(c,r))continue;const x=c*T,y=r*T;g.fillStyle='rgba(235,250,255,.85)';
      if(!isWater(c,r-1))g.fillRect(x,y-5,T,7);if(!isWater(c,r+1))g.fillRect(x,y+T-2,T,7);if(!isWater(c-1,r))g.fillRect(x-5,y,7,T);if(!isWater(c+1,r))g.fillRect(x+T-2,y,7,T)}
    if(MINE){g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=5;g.setLineDash([16,12]);g.beginPath();g.moveTo(0,MH*T/2);g.lineTo(w,MH*T/2);g.stroke();g.setLineDash([])}});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(MW*TS,MH*TS),new THREE.MeshLambertMaterial({map:floorTex}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;ARENA.add(floor);
  // 木
  _sd=id.length*131+7;const trunk=MC(0x8a5a33),leaf=TH.leaf.map(MC),cactus=MC(0x4f8f45);const tg=new THREE.CylinderGeometry(.25,.35,1.4,6),cg=new THREE.ConeGeometry(1.5,3.2,7),bg2=new THREE.IcosahedronGeometry(1.4,0);
  for(let i=0;i<170;i++){const x=(srnd()*2-1)*(HALFX+32),z=(srnd()*2-1)*(HALFZ+34);if(Math.abs(x)<HALFX+2.5&&Math.abs(z)<HALFZ+2.5)continue;if(z>0&&Math.abs(x)<HALFX+16)continue;const s=.8+srnd()*.7,t=new THREE.Group();
    if(MAPS[id].theme==='desert'&&srnd()<.7){const cb=new THREE.Mesh(new THREE.CylinderGeometry(.35,.4,3,8),cactus);cb.position.y=1.5;t.add(cb);for(const sd of[-1,1]){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,1.2,8),cactus);arm.position.set(sd*.6,1.8+sd*.3,0);t.add(arm)}}
    else{const tr=new THREE.Mesh(tg,trunk);tr.position.y=.7;t.add(tr);const lf=new THREE.Mesh(srnd()<.5||MAPS[id].theme==='snow'?cg:bg2,leaf[i%3]);lf.position.y=2.6;t.add(lf)}
    t.position.set(x,0,z);t.scale.setScalar(s);t.rotation.y=srnd()*TAU;t.traverse(o=>{if(o.isMesh)o.castShadow=true});ARENA.add(t)}
  // 外周の柵
  {const fm=M(0x9a6b42),pm=M(0xc48a55);const add=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.9,d),fm);m.position.set(x,.45,z);m.castShadow=m.receiveShadow=true;ARENA.add(m);
      const t=new THREE.Mesh(new THREE.BoxGeometry(w+.1,.12,d+.1),pm);t.position.set(x,.95,z);ARENA.add(t)};
    add(0,-HALFZ-.3,MW*TS+1.2,.6);add(0,HALFZ+.3,MW*TS+1.2,.6);add(-HALFX-.3,0,.6,MH*TS);add(HALFX+.3,0,.6,MH*TS)}
  for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){const ch=GRID[r][c];
    if(ch==='#')buildWall(c,r);else if(ch==='X')buildBox(c,r);else if(ch==='F')buildFence(c,r);else if(PADDIR[ch])buildPad(c,r,ch);
    else if(ch==='~'){const m=new THREE.Mesh(waterG,waterMat);m.position.set(tx(c),.03,tz(r));m.receiveShadow=true;ARENA.add(m)}
    else if(ch==='B'){const g=new THREE.Group();g.userData.m=[];const d=new THREE.Mesh(BUSHDOME,bushMat2);d.castShadow=true;g.add(d);const bl=new THREE.Mesh(BUSHGEO[Math.floor(hash2(c,r)*4)%4],bushMat);bl.castShadow=true;bl.rotation.y=hash2(r,c)*TAU;g.add(bl);
      g.userData.m.push(bl,d);g.userData.ph=hash2(c+3,r+7)*TAU;g.position.set(tx(c),0,tz(r));ARENA.add(g);BUSH[c+','+r]=g;BUSHL.push(g)}}
  if(MINE){const pit=new THREE.Mesh(new THREE.CircleGeometry(1.15,32),new THREE.MeshBasicMaterial({map:ctex(128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'#05030a');gr.addColorStop(.7,'#2a1640');gr.addColorStop(1,'#5a3a7a');g.fillStyle=gr;g.fillRect(0,0,w,h)})}));
    pit.rotation.x=-Math.PI/2;pit.position.set(MX,.025,MZ);ARENA.add(pit);
    const glow=new THREE.Mesh(new THREE.CircleGeometry(2.2,32),new THREE.MeshBasicMaterial({map:ctex(128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,10,64,64,64);gr.addColorStop(0,'rgba(200,120,255,.55)');gr.addColorStop(1,'rgba(200,120,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    glow.rotation.x=-Math.PI/2;glow.position.set(MX,.04,MZ);ARENA.add(glow);
    const wood=M(0x8a5a33),wood2=M(0xb07a45);for(let i=0;i<4;i++){const bm=new THREE.Mesh(new THREE.BoxGeometry(2.7,.22,.36),i%2?wood:wood2);bm.position.set(MX+(i===1?1.2:i===3?-1.2:0),.12,MZ+(i===0?1.2:i===2?-1.2:0));bm.rotation.y=i%2?Math.PI/2:0;bm.castShadow=true;ARENA.add(bm)}
    for(const [sx,sz] of[[1,1],[1,-1],[-1,1],[-1,-1]]){const p=new THREE.Mesh(new THREE.BoxGeometry(.32,.5,.32),wood);p.position.set(MX+sx*1.2,.25,MZ+sz*1.2);p.castShadow=true;ARENA.add(p)}
    const rim={};
    const cm=M(0xc77dff,{emissive:0x5a1f8a});for(let i=0;i<5;i++){const cr=new THREE.Mesh(new THREE.OctahedronGeometry(rr(.22,.4),0),cm);const a=i/5*TAU;cr.position.set(MX+Math.cos(a)*.95,.25,MZ+Math.sin(a)*.95);cr.rotation.set(rr(0,1),rr(0,3),rr(0,1));ARENA.add(cr)}}
  POISON.visible=kind==='br';POISON.material.uniforms.R.value=999}
function breakWall(c,r){const k=c+','+r;if(GRID[r]&&GRID[r][c]==='#'&&WALLM[k]){GRID[r][c]='.';ARENA.remove(WALLM[k]);delete WALLM[k];
  for(let i=0;i<14;i++)FX.add(tx(c)+rr(-.8,.8),rr(.3,1.4),tz(r)+rr(-.8,.8),rr(-4,4),rr(3,7),rr(-4,4),rr(.35,.6),[.75,.55,.35],1.1,14)}}
// パワーボックスへのダメージ（こわれるとキューブが出る）
function hitBox(c,r,dmg){const k=c+','+r,ch=cell(c,r);if(!breakable(c,r)||!BOXM[k])return false;BOXHP[k]-=dmg;const g=BOXM[k];g.scale.setScalar(.9);setTimeout(()=>g.scale.setScalar(1),60);
  if(BOXHP[k]<=0){GRID[r][c]='.';ARENA.remove(g);delete BOXM[k];if(ch==='X'){burst(tx(c),.8,tz(r),20,[.5,.95,.6],6,.6,.6,true);burst(tx(c),.6,tz(r),12,[.45,.35,.55],4,.8,.9);addItem('cube',tx(c),tz(r),tx(c),tz(r))}else burst(tx(c),.6,tz(r),16,[.7,.5,.3],5,.5,.9)}return true}
function setBushSee(keys){for(const k of bushSeeThrough)if(!keys.has(k)&&BUSH[k])BUSH[k].userData.m.forEach((m,i)=>m.material=i%2?bushMat2:bushMat);
  for(const k of keys)if(BUSH[k])BUSH[k].userData.m.forEach((m,i)=>m.material=i%2?bushT2:bushT);bushSeeThrough=keys}
// 毒の雲（バトルロイヤル）：安全な円の外を緑にする
const POISON=new THREE.Mesh(new THREE.PlaneGeometry(420,420),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{R:{value:999},T:{value:0}},
  vertexShader:'varying vec2 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float R,T;varying vec2 vP;void main(){float d=length(vP);if(d<R)discard;float n=sin(vP.x*.35+T*1.3)*sin(vP.y*.3-T)*.5+.5;float e=smoothstep(R,R+1.5,d);gl_FragColor=vec4(mix(vec3(.25,.75,.3),vec3(.45,.95,.4),n),(.35+n*.15)*e+(1.-e)*.75);}'}));
POISON.rotation.x=-Math.PI/2;POISON.position.y=1.3;POISON.renderOrder=3;scene.add(POISON);

