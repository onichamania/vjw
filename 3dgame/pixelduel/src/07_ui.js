// ===================== 画面（メニュー・HUD・結果） =====================
function showScr(id){document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id===id))}
function showMenu(){showScr('sMenu');$('hello').textContent='ようこそ、'+cleanName(SV.name)+' さん';
  $('recTx').textContent='勝ち '+SV.wins+'　負け '+SV.loses+'　引き分け '+SV.draws+'　・　キル '+SV.kills+'\n使う武器：'+WEAPONS[primOf(SV.primary)].jp+' ＋ '+WEAPONS[SV.weapon].jp+' ＋ '+WEAPONS[SV.sniper].jp+' ＋ '+WEAPONS[HEAVIES.includes(SV.heavy)?SV.heavy:'rjumper'].jp;$('recTx').style.whiteSpace='pre-line';
  if(NET.game)leaveRoom(true);lobbyPresence(false)}
function showName(){showScr('sName');$('nameIn').value=SV.name||'';setTimeout(()=>{try{$('nameIn').focus()}catch(e){}},50)}
function nameOk(){const n=cleanName($('nameIn').value);if(!n){tip('名前を入れてね');return}SV.name=n;saveSV();SFX.click();showMenu()}
// ---------------- 武器を選ぶ ----------------
const ICONS={};const icon=w=>SNIPER_ICON[w]||ICONS[w]||(ICONS[w]=iconURL(w,52,40));
function statRow(c,lb,v,mx,txt){const r=document.createElement('div');r.className='st';const sp=document.createElement('span');sp.textContent=lb+' '+(txt||v);const i=document.createElement('i');const u=document.createElement('u');u.style.width=clamp(v/mx*100,4,100)+'%';i.appendChild(u);r.appendChild(sp);r.appendChild(i);c.appendChild(r)}
function weaponCard(w,on,click){const W=WEAPONS[w],c=document.createElement('div');c.className='wc'+(on?' on':'');const im=document.createElement('img');im.src=icon(w);c.appendChild(im);
  const b=document.createElement('b');b.textContent=W.jp;c.appendChild(b);const en=document.createElement('div');en.className='note';en.style.margin='0';en.textContent=W.en+'　重さ '+W.weight.toFixed(2).replace(/0$/,'');c.appendChild(en);
  if(isGun(w)){const dm=document.createElement('div');dm.className='note';dm.style.cssText='margin:2px 0;color:#ffd23f;font-weight:800';
    dm.textContent=W.cat==='primary'?(W.pellets?'ダメージ 合計'+W.dmg+'（'+W.pellets+'粒）'+(W.poison?'＋毒'+W.poison.n*W.poison.dmg:W.bleed?'＋出血'+W.bleed.n*W.bleed.dmg:''):'ダメージ 体'+W.dmg+'・頭'+Math.round(W.dmg*W.head)+'（1発）'):W.cat==='sniper'?'ダメージ 体'+W.dmg+'・頭'+Math.round(W.dmg*W.head):W.multi?'範囲ダメージ '+W.dmg+'（'+W.multi+'発×'+(W.dmg/W.multi)+'）':W.cluster?'範囲ダメージ '+W.dmg+'（大'+Math.round(W.dmg*.6)+'＋小'+Math.round(W.dmg*.08)+'×'+W.cluster+'）':W.charge?'範囲ダメージ 最大'+W.dmg+'（ためうち）':'範囲ダメージ '+W.dmg;
    c.appendChild(dm);statRow(c,'攻撃力',W.cat==='primary'&&!W.pellets?W.dmg*7:W.dmg,170,W.dmg);statRow(c,'連射',W.rof,100);statRow(c,'装弾数',W.cap,W.cat==='primary'?50:12,W.cap+'/'+W.res);statRow(c,'機動力',W.mob,100)}
  else{statRow(c,'攻撃力',W.leth,35);statRow(c,'攻撃速度',89,100);statRow(c,'機動力',W.mob,100)}
  const ex=document.createElement('div');ex.className='note';ex.style.margin='4px 0 0';ex.textContent=isGun(w)?W.tag:w==='fists'?'当たると相手が遅くなる・アーマー+25':w==='saber'?'当たると相手が燃える':'軽くて手数で勝負';c.appendChild(ex);
  c.onclick=()=>{click();saveSV();SFX.click();showArmory()};return c}
function showArmory(){showScr('sArmory');const P=$('wpick'),Q=$('spick'),H=$('hpick'),R=$('ppick');P.textContent='';Q.textContent='';H.textContent='';R.textContent='';
  for(const w of PRIMARIES)R.appendChild(weaponCard(w,primOf(SV.primary)===w,()=>{SV.primary=w}));
  for(const w of HEAVIES)H.appendChild(weaponCard(w,(HEAVIES.includes(SV.heavy)?SV.heavy:'rjumper')===w,()=>{SV.heavy=w}));
  for(const w of MELEE)P.appendChild(weaponCard(w,SV.weapon===w,()=>{SV.weapon=w}));
  for(const w of SNIPERS)Q.appendChild(weaponCard(w,SV.sniper===w,()=>{SV.sniper=w}))}
// ---------------- 設定 ----------------
let setBack='sMenu';
function showSet(from){setBack=from||'sMenu';showScr('sSet');$('sSens').value=SET.sens;$('sSensV').textContent=SET.sens+'%';$('sSnd').textContent=SET.sound?'ON':'OFF';$('sShadow').textContent=SET.shadow?'ON':'OFF'}
function setShadow(on){SET.shadow=on;LSset('pgduel-shadow',on?'1':'0');renderer.shadowMap.enabled=on;scene.traverse(o=>{if(o.material){const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(x=>x.needsUpdate=true)}})}
// ---------------- HUD ----------------
const HC={};
function hudReset(){for(const k in HC)delete HC[k];const H=$('hearts'),A=$('armors');H.textContent='';A.textContent='';for(let i=0;i<9;i++){const h=document.createElement('div');h.className='ht';H.appendChild(h);const a=document.createElement('div');a.className='ar';A.appendChild(a)}
  $('feed').textContent='';msg('');$('coins').textContent=SV.coins;$('gems').textContent=SV.gems}
function setC(k,v,fn){if(HC[k]===v)return;HC[k]=v;fn(v)}
let crossT=0,msgT=0;
function updHUD(dt){const hp=ME.alive?ME.hp:0;
  setC('hp',Math.ceil(hp/HP_MAX*18),v=>{[...$('hearts').children].forEach((e,i)=>e.className='ht'+(v>=i*2+2?'':v===i*2+1?' h':' e'))});
  // シールド（アーマー）：9こ。拾ったアーマー（100まで）は水色、力の拳の+25はオレンジで重ねる
  setC('ar',ME.alive?Math.round(clamp(ME.ar+ME.arB,0,AR_MAX)):0,v=>{const cl=shieldClasses(v);[...$('armors').children].forEach((e,i)=>e.className='ar '+cl[i])});
  // 上のスコア：1対1は自分と相手、デスマッチは自分の得点だけ（順位は右に）
  const rk=G.dm?ranking():null,top=G.dm?rk.find(F=>F!==ME):OPP;setC('sB',scoreOf(ME),v=>$('sB').textContent=v);setC('sR',top?scoreOf(top):0,v=>$('sR').textContent=v);
  setC('dm',!!G.dm,v=>{$('rank').style.display=v?'block':'none';$('scR').style.display=v?'none':''});   // デスマッチは上に自分の得点だけ
  if(G.dm)setC('rk',rk.map(F=>(F===ME?'*':'')+F.name+':'+scoreOf(F)).join('|'),()=>{const R=$('rank');R.textContent='';const h=document.createElement('b');h.textContent='デスマッチ（'+DM_KILLS+'キルで勝ち）';R.appendChild(h);
    const row=(F,i)=>{const d=document.createElement('div');if(F===ME)d.className='me';d.textContent=(i+1)+'. '+(F.name||'???')+'　'+scoreOf(F);R.appendChild(d)};rk.slice(0,6).forEach(row);const mi=rk.indexOf(ME);if(mi>=6)row(ME,mi)});
  const t=Math.max(0,Math.ceil(G.tl));setC('tl',t,v=>$('sT').textContent=Math.floor(v/60)+':'+String(v%60).padStart(2,'0'));
  setC('coins',SV.coins,v=>$('coins').textContent=v);setC('gems',SV.gems,v=>$('gems').textContent=v);
  const st=(ME.burn?'🔥 燃えている　':'')+(ME.psn?'☠ 毒　':'')+(ME.bld?'🩸 出血　':'')+(ME.slowT>0?'🐢 遅くなっている':'');setC('st',st,v=>$('burn').textContent=v);
  if(crossT>0){crossT-=dt;if(crossT<=0)drawCross()}
  if(hmT>0){hmT-=dt;$('hitm').style.opacity=clamp(hmT/.12,0,1)}if(popT>0){popT-=dt;if(popT<=0)$('pop').classList.remove('on')}
  setC('cw',ME.cw+'|'+ME.w,()=>{[...$('wbar').children].forEach((e,i)=>e.classList.toggle('on',i===ME.cw));drawCross();drawScope();touchIcons()});
  // 弾数（スナイパーとヘビーの両方）
  const amT=w=>ME.w===w&&ME.relT>0?'リロード':ammoOf(ME,w).join('/');setC('am',amT(ME.wp)+'|'+amT(ME.ws)+'|'+amT(ME.wh),()=>{const ch=$('wbar').children;for(const [i,w] of[[0,ME.wp],[2,ME.ws],[3,ME.wh]]){const e=ch[i];if(e&&e._am)e._am.textContent=amT(w)}});
  setC('chg',Math.round(ME.chg*24),()=>drawCross());
  const sc=ME.scoped&&ME.alive;setC('sc',sc,v=>{$('scope').classList.toggle('on',v);$('cross').style.display=v?'none':'';$('scopeTx').style.display=v&&WEAPONS[ME.w].scope==='tracking'?'block':'none';VIEW.g.visible=!v&&ME.alive})
  if(sc&&WEAPONS[ME.w].scope==='tracking'){const d=aimDir(ME.yaw,ME.pitch),r=rayWorld(ME.x,ME.y+EYE,ME.z,d,140);$('scopeTx').textContent=(r.t>=140?'RNG ----':'RNG '+r.t.toFixed(1)+'m')+'\nAZ  '+(((-ME.yaw*180/Math.PI)%360+360)%360).toFixed(0).padStart(3,'0')+'\nEL '+(ME.pitch*180/Math.PI).toFixed(1)}
  if(msgT>0){msgT-=dt;if(msgT<=0)msg('')}
  for(const e of[...$('feed').children]){e._t-=dt;if(e._t<=0)e.remove()}}
// シールド9こ：0〜25%は銅がふえる、25〜50%は銀におきかわる、50〜100%は金におきかわる
function shieldClasses(p){const r=[];for(let i=0;i<9;i++){if(p<=25)r.push(i<Math.round(p/25*9)?'br':'e');else if(p<=50)r.push(i<Math.round((p-25)/25*9)?'si':'br');else r.push(i<Math.round((p-50)/50*9)?'go':'si')}return r}
function crossHit(head){crossT=head?.3:.18;drawCross(head?2:1);hitMark(head)}
// 照準（Wikiの照準画像の形と寸法どおり。当たると赤くなる）
const crossScale=()=>clamp(innerHeight/760,.7,1.35);
function drawCross(hit){const cv=$('cross'),g=cv.getContext('2d'),S=128,c=64;if(cv.width!==S){cv.width=cv.height=S}const k=crossScale();cv.style.width=cv.style.height=Math.round(S*k)+'px';
  g.clearRect(0,0,S,S);const st=WEAPONS[ME.w].cross||'melee',col=hit?'#ff2a1a':'#ffffff';
  const R=(x,y,w,h)=>{g.fillStyle='rgba(0,0,0,.75)';g.fillRect(c+x-1,c+y-1,w+2,h+2);g.fillStyle=col;g.fillRect(c+x,c+y,w,h)};
  const B=(x,y,w,h,t)=>{g.fillStyle='rgba(20,20,20,.85)';g.fillRect(c+x,c+y,w,h);g.fillStyle=col;g.fillRect(c+x+t,c+y+t,w-2*t,h-2*t)};
  const brk=(x,dir,h)=>{R(x,-h,2,2*h);R(x+dir*2,-h-2,2,2);R(x+dir*2,h,2,2)};   // （ と ）
  if(st==='melee'){R(-22,-1,7,2);R(16,-1,7,2);R(-1,-23,2,8);R(-1,15,2,8);R(-1,-1,2,2)}
  else if(st==='bullet'){brk(-34,1,7);brk(32,-1,7);R(-1,-1,2,2)}
  else if(st==='pierce'){brk(-36,1,8);brk(34,-1,8)}
  else if(st==='laser'){for(const s of[-1,1]){R(s<0?-24:17,-1,7,2);R(s<0?-13:10,-1,3,2);R(-1,s<0?-24:17,2,7);R(-1,s<0?-13:10,2,3)}R(-1,-1,2,2)}
  else if(st==='rocket'){for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){R(sx<0?-19:12,sy<0?-19:17,7,2);R(sx<0?-19:17,sy<0?-17:10,2,7)}R(-1,-1,2,2)}   // ヘビー：四すみのかぎ
  else if(st==='shotgun'){for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){R(sx<0?-26:17,sy<0?-26:24,10,2);R(sx<0?-26:24,sy<0?-24:15,2,10)}R(-1,-1,2,2)}
  else if(st==='rifle'){R(-15,-1,7,2);R(9,-1,7,2);R(-1,-15,2,7);R(-1,9,2,7);R(-1,-1,2,2)}
  else if(st==='portal'){for(let i=0;i<8;i++){const a=i*TAU/8;R(Math.round(Math.cos(a)*16)-1,Math.round(Math.sin(a)*16)-1,3,3)}R(-1,-1,2,2)}
  else if(st==='acr'){const q=.78,Q=(x,y,w,h,t)=>B(Math.round(x*q),Math.round(y*q),Math.round(w*q),Math.round(h*q),t);Q(-15,-47,30,12,3);Q(-8,-35,15,12,3);Q(-43,-7,25,14,3);Q(18,-7,25,14,3);Q(-4,-3,8,6,2);Q(-8,23,15,12,3);Q(-15,35,30,12,3)}
  // ためうちの量（照準のまわりの緑の輪）
  if(ME.chg>0){g.lineWidth=4;g.strokeStyle='rgba(0,0,0,.7)';g.beginPath();g.arc(c,c,26,-Math.PI/2,-Math.PI/2+ME.chg*TAU);g.stroke();g.lineWidth=2.5;g.strokeStyle=ME.chg>=1?'#c0ff60':'#40e040';g.beginPath();g.arc(c,c,26,-Math.PI/2,-Math.PI/2+ME.chg*TAU);g.stroke()}}
// ヒットマーカー（スコープ中も出る）：白い×、頭なら赤
let hmT=0;function hitMark(head){const cv=$('hitm'),g=cv.getContext('2d');cv.width=cv.height=96;const k=crossScale();cv.style.width=cv.style.height=Math.round(96*k)+'px';g.clearRect(0,0,96,96);
  const a=head?9:10,b=head?21:18;for(const [w,cl] of[[head?6:5,'rgba(0,0,0,.8)'],[head?3:2.5,head?'#ff2a1a':'#ffffff']]){g.strokeStyle=cl;g.lineWidth=w;g.lineCap='square';for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){g.beginPath();g.moveTo(48+sx*a,48+sy*a);g.lineTo(48+sx*b,48+sy*b);g.stroke()}}
  cv.style.opacity=1;hmT=head?.35:.22}
// キルの得点表示（照準の下）
let popT=0;function killPop(head){const e=$('pop');e.textContent='';const n=document.createElement('b');n.textContent=String(100+(head?30:0));e.appendChild(n);
  for(const t of['+100 キル'].concat(head?['+30 ヘッドショット']:[])){const d=document.createElement('div');d.textContent=t;e.appendChild(d)}e.classList.add('on');popT=1.6}
let hsT=0;function headshotMsg(){const e=$('hs');e.classList.add('on');clearTimeout(hsT);hsT=setTimeout(()=>e.classList.remove('on'),700)}
// スコープの画面：黒いわくの四角い窓。ACRはWikiの画像、監督は送ってもらった画像どおり。ほかは同じころの本家のスコープに合わせた
function drawScope(){const cv=$('scope'),dpr=Math.min(devicePixelRatio||1,2),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const g=cv.getContext('2d');g.clearRect(0,0,W,H);if(!isGun(ME.w)||!WEAPONS[ME.w].zoom)return;const st=WEAPONS[ME.w].scope,cx=W/2,cy=H/2;
  const ln=(x,y,w,h,c,o)=>{g.fillStyle='rgba(0,0,0,'+(o==null?.55:o)+')';const e=Math.max(1,H/700);g.fillRect(x-e,y-e,w+2*e,h+2*e);g.fillStyle=c;g.fillRect(x,y,w,h)};
  // 四角いわく：外の黒・内側のぼかし
  const square=(S,bdr,soft,tint,edge)=>{const x0=cx-S/2,y0=cy-S/2;g.fillStyle=edge||'#050505';g.fillRect(x0,y0,S,S);const b=S*bdr;g.clearRect(x0+b,y0+b,S-2*b,S-2*b);
    const sw=S*soft,ix=x0+b,iy=y0+b,iw=S-2*b;for(const [gx0,gy0,gx1,gy1,rx,ry,rw,rh] of[[ix,0,ix+sw,0,ix,iy,sw,iw],[ix+iw,0,ix+iw-sw,0,ix+iw-sw,iy,sw,iw],[0,iy,0,iy+sw,ix,iy,iw,sw],[0,iy+iw,0,iy+iw-sw,ix,iy+iw-sw,iw,sw]]){const gr=g.createLinearGradient(gx0,gy0,gx1,gy1);gr.addColorStop(0,'rgba(0,0,0,.82)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(rx,ry,rw,rh)}
    if(tint){g.fillStyle=tint;g.fillRect(ix,iy,iw,iw)}return{ix,iy,iw}};
  const ladder=(c,u)=>{const L=100*u,gap=30*u,t=2*u;ln(cx-gap-L,cy-t/2,L,t,c);ln(cx+gap,cy-t/2,L,t,c);for(let i=0;i<3;i++){ln(cx-gap-L+(50+i*15)*u,cy-7*u,t,6*u,c);ln(cx+gap+(35+i*15)*u,cy-7*u,t,6*u,c)}
    for(let i=0;i<4;i++){ln(cx-9*u,cy-(32+i*17)*u,18*u,t,c);ln(cx-9*u,cy+(30+i*17)*u,18*u,t,c)}ln(cx-t,cy-t,2*t,2*t,c);ln(cx-t/2,cy-82*u,t,50*u,c);ln(cx-t/2,cy+30*u,t,52*u,c)};
  if(st==='acr'){   // Wikiのアンチチャンピオンのスコープ（横長の窓・太い黒わく）
    const u=H/506,ow=580*u,iw=450*u,x0=cx-ow/2,y0=30*u,ix0=cx-iw/2,iy0=80*u,ih=345*u;g.fillStyle='#050505';g.fillRect(x0,y0,ow,H-y0);g.clearRect(ix0,iy0,iw,ih);
    g.fillStyle='rgba(0,0,0,.38)';const bd=10*u;g.fillRect(ix0,iy0,iw,bd);g.fillRect(ix0,iy0+ih-bd,iw,bd);g.fillRect(ix0,iy0+bd,bd,ih-2*bd);g.fillRect(ix0+iw-bd,iy0+bd,bd,ih-2*bd);ladder('#ece4cc',u)}
  else if(st==='thermal'){   // 監督（送ってもらった画像）：細い黒わく＋ぼかし、長い白線、白い角かっこ、中に赤い角かっこと赤い点
    const S=H*.97,{ix,iy,iw}=square(S,.026,.07,'rgba(40,24,8,.12)'),t=Math.max(2,S*.0055),w='#f4f4f4';
    ln(cx-S*.364,cy-t/2,S*.252,t,w,.35);ln(cx+S*.105,cy-t/2,S*.252,t,w,.35);ln(cx-t/2,cy-S*.369,t,S*.216,w,.35);ln(cx-t/2,cy+S*.108,t,S*.216,w,.35);
    const cor=(h,a,c)=>{for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){const X=cx+sx*h,Y=cy+sy*h;ln(sx<0?X:X-a,Y-t/2,a,t,c,.35);ln(X-t/2,sy<0?Y:Y-a,t,a,c,.35)}};
    cor(S*.112,S*.036,w);cor(S*.058,S*.022,'#e02020');ln(cx-t,cy-t,2*t,2*t,'#e02020',.35)}
  else if(st==='screen'){   // ワンショット：画面のスコープ（水色の画面と格子）
    const S=H*.95,{ix,iy,iw}=square(S,.03,.05,'rgba(40,200,230,.14)'),u=S/506;g.fillStyle='rgba(120,240,255,.2)';for(let x=ix+(cx-ix)%(40*u);x<ix+iw;x+=40*u)g.fillRect(x,iy,u,iw);for(let y=iy+(cy-iy)%(40*u);y<iy+iw;y+=40*u)g.fillRect(ix,y,iw,u);
    g.fillStyle='rgba(0,0,0,.08)';for(let y=iy;y<iy+iw;y+=3*u)g.fillRect(ix,y,iw,u);ladder('#7ff4ff',u);g.fillStyle='#7ff4ff';g.font='bold '+Math.round(13*u)+'px "Courier New",monospace';g.fillText('ZOOM 10X',ix+14*u,iy+24*u);g.fillText('▮▮▮▯',ix+iw-60*u,iy+24*u)}
  else if(st==='tracking'){   // ヘビースナイパー：だいだい色のはしご目盛り（同じころの本家のスコープ）と距離の表示
    const S=H*.95,{ix,iy,iw}=square(S,.03,.06,'rgba(255,200,80,.05)'),u=S/506;ladder('#ffc23a',u);g.fillStyle='#ffc23a';g.font='bold '+Math.round(12*u)+'px "Courier New",monospace';g.fillText('8X',ix+14*u,iy+22*u);
    const e=$('scopeTx');e.style.color='#ffc23a';e.style.fontSize=Math.round(12*u/dpr)+'px';e.style.transform='translate('+Math.round(70*u/dpr)+'px,'+Math.round(55*u/dpr)+'px)'}
  else if(st==='comet'){   // 彗星：紫のふち、細い線の十字
    const S=H*.95,{ix,iy,iw}=square(S,.03,.08,'rgba(150,60,220,.08)','#12061e'),t=Math.max(2,S*.004),c='#ffa8ff';
    ln(cx-S*.4,cy-t/2,S*.36,t,c,.4);ln(cx+S*.04,cy-t/2,S*.36,t,c,.4);ln(cx-t/2,cy-S*.4,t,S*.36,c,.4);ln(cx-t/2,cy+S*.04,t,S*.36,c,.4);ln(cx-t,cy-t,2*t,2*t,'#ffffff',.4)}
  else if(st==='destr'){   // 破壊システム：濃い灰色のわくに黄色の印、白い十字
    const S=H*.92,{ix,iy,iw}=square(S,.04,.07,'rgba(255,220,120,.05)','#1e1e22'),t=Math.max(3,S*.008),w='#f4f4f4',Y='#f0c820',u=S/506;
    ln(cx-S*.38,cy-t/2,S*.33,t,w,.5);ln(cx+S*.05,cy-t/2,S*.33,t,w,.5);ln(cx-t/2,cy-S*.38,t,S*.33,w,.5);ln(cx-t/2,cy+S*.05,t,S*.33,w,.5);ln(cx-t,cy-t,2*t,2*t,'#ff3030',.5);
    for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){const X=cx+sx*S*.4,Y0=cy+sy*S*.4;ln(sx<0?X:X-30*u,Y0-2*u,30*u,4*u,Y,.5);ln(X-2*u,sy<0?Y0:Y0-30*u,4*u,30*u,Y,.5)}
    g.fillStyle=Y;g.font='bold '+Math.round(12*u)+'px "Courier New",monospace';g.fillText('4X',ix+14*u,iy+22*u)}
  else if(st==='gold4x'){   // ゴールデンフレンド：ドットの丸い窓（外は黒）、細い黒の十字と目盛り、金のふちと緑のレンズ
    const R0=H*.46,px=Math.max(2,Math.round(H/90));g.fillStyle='#050505';g.fillRect(0,0,W,H);
    for(let y=-R0;y<R0;y+=px){const hw=Math.floor(Math.sqrt(Math.max(0,R0*R0-(y+px/2)*(y+px/2)))/px)*px;g.clearRect(cx-hw,cy+y,hw*2,px);g.fillStyle='rgba(200,150,30,.85)';g.fillRect(cx-hw,cy+y,px,px);g.fillRect(cx+hw-px,cy+y,px,px)}
    g.fillStyle='rgba(60,220,90,.1)';g.beginPath();g.arc(cx,cy,R0,0,TAU);g.fill();
    const t=Math.max(1,Math.round(H/400)),k='rgba(10,10,10,.9)';g.fillStyle=k;g.fillRect(cx-R0,cy-t/2,R0*2,t);g.fillRect(cx-t/2,cy-R0,t,R0*2);
    for(let i=1;i<=4;i++){const s=i*R0*.17;g.fillRect(cx-s-t/2,cy-px*1.5,t,px*3);g.fillRect(cx+s-t/2,cy-px*1.5,t,px*3);g.fillRect(cx-px*1.5,cy+s-t/2,px*3,t)}
    g.fillStyle='#d02020';g.fillRect(cx-t*1.5,cy-t*1.5,t*3,t*3);g.fillStyle='#e8c040';g.font='bold '+Math.round(H/40)+'px "Courier New",monospace';g.fillText('4X',cx+R0*.55,cy-R0*.62)}
  else if(st==='tri'){   // 中性子パルセーター：まわりは暗くしない。水色と白の太いしまの大きな三角（上がとがる）と、下の横のしま、まん中に小さな十字
    const u=H/506,top=cy-232*u,bl=[cx-176*u,cy+96*u],br=[cx+176*u,cy+96*u],th=30*u,cols=['#9af0ff','#2ac8f0','#1aa0d8','#2ac8f0'];
    const bar=(a,b,n)=>{for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,x0=lerp(a[0],b[0],t0),y0=lerp(a[1],b[1],t0),x1=lerp(a[0],b[0],t1),y1=lerp(a[1],b[1],t1),dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),nx=-dy/L*th/2,ny=dx/L*th/2;
      g.fillStyle=i===0||i===n-1?'#e8fcff':cols[i%cols.length];g.globalAlpha=.92;g.beginPath();g.moveTo(x0+nx,y0+ny);g.lineTo(x1+nx,y1+ny);g.lineTo(x1-nx,y1-ny);g.lineTo(x0-nx,y0-ny);g.closePath();g.fill()}g.globalAlpha=1};
    bar([cx,top],bl,5);bar([cx,top],br,5);const by=cy+138*u;for(let i=0;i<6;i++){g.fillStyle=i===0||i===5?'#e8fcff':cols[i%cols.length];g.globalAlpha=.9;g.fillRect(cx-150*u+i*50*u,by,50*u,26*u)}g.globalAlpha=1;
    const c='#7ff0ff',t=Math.max(2,2*u);ln(cx-26*u,cy-t/2,16*u,t,c,.45);ln(cx+10*u,cy-t/2,16*u,t,c,.45);ln(cx-t/2,cy-26*u,t,16*u,c,.45);ln(cx-t/2,cy+10*u,t,16*u,c,.45);ln(cx-t,cy-t,2*t,2*t,'#ffffff',.45);
    for(const s of[-1,1]){ln(cx+s*34*u-(s<0?0:t),cy-12*u,t,24*u,c,.45)}}
  else if(st==='exo'){   // デモリションスケルトン：わくなし、水色のかぎと目盛り
    const u=H/506,c='#40d8ff',t=Math.max(2,2*u);for(const [sx,sy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){const X=cx+sx*120*u,Y0=cy+sy*80*u;ln(sx<0?X:X-36*u,Y0-t/2,36*u,t,c,.4);ln(X-t/2,sy<0?Y0:Y0-26*u,t,26*u,c,.4)}
    for(let i=-3;i<=3;i++)if(i)ln(cx+i*22*u-t/2,cy+44*u,t,(i%2?6:10)*u,c,.4);ln(cx-18*u,cy-t/2,12*u,t,c,.4);ln(cx+6*u,cy-t/2,12*u,t,c,.4);ln(cx-t/2,cy-18*u,t,12*u,c,.4);ln(cx-t/2,cy+6*u,t,12*u,c,.4)}}
addEventListener('resize',()=>{if(G.mode)drawScope()});
// 撃つボタンの絵（接近武器はナイフ、銃は弾）
const ICON_MELEE='<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 2l8 8-2 2L2 4zM20 2l-8 8 2 2 8-8zM9 13l2 2-6 6-2-2zM15 13l-2 2 6 6 2-2z"/></svg>',ICON_GUN='<svg viewBox="0 0 24 24" fill="#fff"><path d="M10 3h4v3h-4zM9 7h6v12H9zM5 4l2 3M19 4l-2 3M4 12h3M17 12h3M5 20l2-3M19 20l-2-3" stroke="#fff" stroke-width="1.5"/></svg>';
function touchIcons(){const sn=isGun(ME.w);$('tAtk').innerHTML=sn?ICON_GUN:ICON_MELEE;$('tAim').classList.toggle('dim',!(sn&&WEAPONS[ME.w].zoom));$('tRel').classList.toggle('dim',!sn)}
// 画面の真ん中の大きな文字
function msg(t,small,dur){const k=t+'|'+(small||'');if(msg.k===k)return;msg.k=k;const e=$('msg');e.textContent=t||'';if(small){const s=document.createElement('small');s.textContent=small;e.appendChild(s)}msgT=dur||0}
// キルの表示（右上）
function addFeed(K,V,w,head){const F=$('feed'),d=document.createElement('div');const a=document.createElement('span');a.textContent=K.name||'???';a.style.color=K===ME?'#7ab8ff':'#ff8a8a';d.appendChild(a);
  if(w==='tnt'){const b=document.createElement('span');b.textContent=' 💥 ';d.appendChild(b)}else{const im=document.createElement('img');im.src=icon(w,26,20);im.style.cssText='width:26px;height:20px;vertical-align:middle;margin:0 5px;image-rendering:pixelated';d.appendChild(im)}
  if(K!==V){const c=document.createElement('span');c.textContent=V.name||'???';c.style.color=V===ME?'#7ab8ff':'#ff8a8a';d.appendChild(c)}else{const c=document.createElement('span');c.textContent='（自爆）';d.appendChild(c)}
  d._t=5;F.appendChild(d);while(F.children.length>4)F.firstChild.remove()}
function clearFeed(){$('feed').textContent=''}
// 武器のバー（下の真ん中）：接近武器・スナイパー・ヘビー（銃は弾数も）
function buildWBar(){const B=$('wbar');B.textContent='';
  [[ME.wp,WEAPONS[ME.wp].short,false],[ME.wm,WEAPONS[ME.wm].short,false],[ME.ws,WEAPONS[ME.ws].short,false],[ME.wh,WEAPONS[ME.wh].short,false]].forEach(([k,lb,lock],i)=>{const s=document.createElement('div');s.className='ws'+(lock?' lk':'')+(i===ME.cw?' on':'');
    if(!lock){const im=document.createElement('img');im.src=icon(k);s.appendChild(im)}else{const l=document.createElement('div');l.className='lock';l.textContent='🔒';s.appendChild(l)}
    const sm=document.createElement('small');sm.textContent=lb;s.appendChild(sm);if(i!==1){sm.style.bottom='9px';const am=document.createElement('div');am.className='am';s.appendChild(am);s._am=am}
    s.onclick=e=>{e.stopPropagation();if(LAYM())return;if(lock)tip(lb+'は準備中です');else PEND.slot=i};s.ontouchstart=e=>{e.stopPropagation();if(LAYM())return;if(!lock){e.preventDefault();PEND.slot=i}};B.appendChild(s)});
  for(const k of['cw','am','sc'])delete HC[k]}
// ---------------- ポーズ・結果 ----------------
function pauseGame(){if(!G.mode||G.phase==='end')return;if(G.mode==='bot')G.paused=true;$('pNote').textContent=G.mode==='online'?'オンライン対戦中は試合が止まりません。':'';showScr('sPause');if(document.pointerLockElement)document.exitPointerLock()}
function resumeGame(){G.paused=false;showScr(null);lockPointer()}
function showResult(){const R=G.res;if(!R)return;if(document.pointerLockElement)document.exitPointerLock();showScr('sResult');msg('');$('resPod').style.display=R.dm?'none':'';$('resList').style.display=R.dm?'':'none';
  $('resT').textContent=R.dm?(R.r==='win'?'1位！':R.place+'位'+(R.r==='draw'?'（同点）':'')):R.r==='win'?'勝利！':R.r==='lose'?'敗北…':'引き分け';$('resT').style.color=R.r==='win'?'#ffd23f':R.r==='lose'?'#ff8a8a':'#fff';
  if(R.dm){const T=$('resList');T.textContent='';const hd=T.insertRow();for(const t of['順位','名前','キル','ポイント'])hd.insertCell().textContent=t;
    R.rank.forEach((q,i)=>{const tr=T.insertRow();if(q.me)tr.className='me';for(const t of[(i+1)+'位',q.name+(q.me?'（あなた）':''),q.k,q.p])tr.insertCell().textContent=t});
    $('resNote').textContent=(R.why==='left'?'ホストが退出したので試合が終わりました。　':R.why==='quit'?'試合をやめました。　':'')+R.n+'人中 '+R.place+'位　・　キル '+R.a+'　・　コイン +'+R.coins+(R.r==='win'?'　ジェム +1':'')}
  else{$('resAn').textContent=ME.name;$('resBn').textContent=R.on;drawPodium($('resA'),ME.sk,ME.w);drawPodium($('resB'),R.osk,R.ow);$('resK').textContent=R.a+' - '+R.b;
    $('resNote').textContent=(R.why==='left'?'相手が退出したので勝ちになりました。　':R.why==='quit'?'試合をやめました。　':'')+'ポイント '+R.pa+' - '+R.pb+'　・　コイン +'+R.coins+(R.r==='win'?'　ジェム +1':'')}
  $('resAgain').style.display=(G.mode==='online'&&(!NET.game||(!NET.host&&!NET.hostP)))?'none':''}
function cleanupMatch(){$('scope').classList.remove('on');ME.scoped=false;G.mode=null;G.phase='idle';G.paused=false;document.body.classList.remove('play');clearFoes();VIEW.g.visible=false;msg('')}
function again(){SFX.click();if(G.mode==='online'){cleanupMatch();NET.rdy=NET.rd+1;sendNow();showWait()}else{const dm=G.dm;cleanupMatch();startMatch('bot',{dm});lockPointer()}}
function toMenu(){SFX.click();const on=G.mode==='online';cleanupMatch();if(on||NET.game){leaveRoom(true)}showMenu()}
function quitMatch(){SFX.click();if(G.phase!=='end'&&G.mode){endMatch('quit');showResult()}else toMenu()}
// ---------------- ボタン ----------------
function bindUI(){const on=(id,f)=>$(id).addEventListener('click',e=>{e.stopPropagation();ac();f(e)});
  on('nameOk',nameOk);$('nameIn').addEventListener('keydown',e=>{if(e.key==='Enter')nameOk();e.stopPropagation()});$('roomIn').addEventListener('keydown',e=>{if(e.key==='Enter')createRoom('duel');e.stopPropagation()});
  on('mOnline',()=>{SFX.click();showRooms()});on('mBot',()=>{SFX.click();startMatch('bot');lockPointer()});on('mDm',()=>{SFX.click();startMatch('bot',{dm:true});lockPointer()});on('mArmory',()=>{SFX.click();showArmory()});on('mName',()=>{SFX.click();showName()});on('mSet',()=>{SFX.click();showSet('sMenu')});
  on('aOk',()=>{SFX.click();showMenu()});on('rMake',()=>{SFX.click();createRoom('duel')});on('rMakeDm',()=>{SFX.click();createRoom('dm')});on('wStart',()=>{SFX.click();hostStart()});on('rBack',()=>{SFX.click();showMenu()});on('wLeave',()=>{SFX.click();leaveRoom()});
  on('resAgain',again);on('resMenu',toMenu);on('pBack',()=>{SFX.click();resumeGame()});on('pSet',()=>{SFX.click();showSet('sPause')});on('pQuit',quitMatch);
  on('sOk',()=>{SFX.click();if(setBack==='sPause')showScr('sPause');else showMenu()});
  $('sSens').addEventListener('input',e=>{SET.sens=+e.target.value;LSset('pgduel-sens',SET.sens);$('sSensV').textContent=SET.sens+'%'});
  on('sSnd',()=>{SET.sound=!SET.sound;LSset('pgduel-sound',SET.sound?'1':'0');showSet(setBack);SFX.click()});on('sShadow',()=>{setShadow(!SET.shadow);showSet(setBack)});
  $('pauseB').addEventListener('click',e=>{e.stopPropagation();pauseGame()});$('pauseB').addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();pauseGame()},{passive:false});
  bindChat();on('sLayB',()=>{SFX.click();showLayout()});on('layOk',()=>{SFX.click();endLayout()});on('layReset',()=>{SFX.click();LAY=JSON.parse(JSON.stringify(LAY_DEF));layoutSave();applyLayout();laySel(null)});on('layHide',()=>{if(LSEL&&LAY_HIDE.includes(LSEL)){LAY[LSEL].hide=!LAY[LSEL].hide;layoutSave();applyLayout();laySel(LSEL)}});
  $('laySize').addEventListener('input',e=>{if(LSEL){LAY[LSEL].s=+e.target.value;applyLayout();layoutSave()}})}
// ---------------- ボタン配置（ドラッグで動かす・大きさ・かくす）。武器欄（下の武器のバー）はPCでも大きさと場所を変えられる ----------------
// 武器欄の s は大きさ（%）。x が null のあいだは下の真ん中のまま大きさだけ変わる
const LAY_DEF={stick:{x:.13,y:.74,s:120},tAtk:{x:.76,y:.77,s:88},tJump:{x:.92,y:.83,s:70},tAim:{x:.88,y:.44,s:62},tRel:{x:.95,y:.61,s:54},tAtk2:{x:.2,y:.42,s:68,hide:false},wbar:{x:null,y:null,s:100}};
const LAY_NAME={stick:'移動スティック',tAtk:'攻撃（撃つ）',tJump:'ジャンプ',tAim:'スコープ',tRel:'リロード',tAtk2:'左の攻撃ボタン',wbar:'武器欄'},LAY_HIDE=['tAim','tRel','tAtk2'];
const WBAR_MIN=60,WBAR_MAX=220;
let LAY=(()=>{const d=JSON.parse(JSON.stringify(LAY_DEF));try{const o=JSON.parse(LSget('pgduel-layout','null'));if(o)for(const k in d){const q=o[k];if(!q)continue;
  if(k==='wbar'){d.wbar.s=clamp(+q.s||100,WBAR_MIN,WBAR_MAX);if(typeof q.x==='number'&&typeof q.y==='number'){d.wbar.x=clamp(q.x,0,1);d.wbar.y=clamp(q.y,0,1)}}
  else if(typeof q.x==='number'){d[k].x=clamp(q.x,0,1);d[k].y=clamp(q.y,0,1);d[k].s=clamp(+q.s||d[k].s,40,170);d[k].hide=!!q.hide}}}catch(e){}return d})();
let LSEL=null,LDRAG=null;
function layoutSave(){LSset('pgduel-layout',JSON.stringify(LAY))}
function placeWBar(){const e=$('wbar'),L=LAY.wbar,sc=L.s/100;
  if(L.x==null){e.style.left='50%';e.style.top='auto';e.style.bottom='';e.style.transformOrigin='50% 100%';e.style.transform='translateX(-50%) scale('+sc+')'}
  else{const w=e.offsetWidth*sc/2,h=e.offsetHeight*sc/2;e.style.left=clamp(L.x*innerWidth,w,Math.max(w,innerWidth-w))+'px';e.style.top=clamp(L.y*innerHeight,h,Math.max(h,innerHeight-h))+'px';e.style.bottom='auto';e.style.transformOrigin='50% 50%';e.style.transform='translate(-50%,-50%) scale('+sc+')'}}
function applyLayout(){for(const k in LAY){if(k==='wbar'){placeWBar();continue}const e=$(k),L=LAY[k],s=L.s;e.style.left=clamp(L.x*innerWidth-s/2,0,innerWidth-s)+'px';e.style.top=clamp(L.y*innerHeight-s/2,0,innerHeight-s)+'px';e.style.right=e.style.bottom='auto';e.style.width=e.style.height=s+'px';e.classList.toggle('off',!!L.hide&&!document.body.classList.contains('lay'));e.style.opacity=L.hide?'.3':''}
  const k=$('stick').firstElementChild,ks=LAY.stick.s*.38;k.style.width=k.style.height=ks+'px';k.style.left=k.style.top=(LAY.stick.s-ks)/2-3+'px'}
addEventListener('resize',applyLayout);
function laySel(k){LSEL=k;for(const id in LAY)$(id).classList.toggle('sel',id===k);$('layName').textContent=k?LAY_NAME[k]+'の大きさ':'ボタンか武器欄をえらんでね';const sl=$('laySize');sl.disabled=!k;
  if(k==='wbar'){sl.min=WBAR_MIN;sl.max=WBAR_MAX;sl.step=5}else{sl.min=40;sl.max=170;sl.step=2}if(k)sl.value=LAY[k].s;
  $('layHide').disabled=!(k&&LAY_HIDE.includes(k));$('layHide').textContent=k&&LAY[k].hide?'表示する':'かくす'}
function showLayout(){LAYBACK=document.querySelector('.scr.on')?document.querySelector('.scr.on').id:'sMenu';document.body.classList.add('lay');
  if(!G.mode){Object.assign(ME,{wp:primOf(SV.primary),wm:SV.weapon,ws:SV.sniper,wh:HEAVIES.includes(SV.heavy)?SV.heavy:'rjumper',w:primOf(SV.primary),cw:0});buildWBar()}/* メニューから開いたときも武器欄を見せる */showScr('sLay');applyLayout();laySel(null)}
let LAYBACK='sMenu';function endLayout(){document.body.classList.remove('lay');laySel(null);applyLayout();if(LAYBACK==='sSet')showSet(setBack);else showScr(LAYBACK)}
for(const id in LAY_DEF){const e=$(id);e.addEventListener('pointerdown',ev=>{if(!document.body.classList.contains('lay'))return;ev.preventDefault();ev.stopPropagation();laySel(id);const r=e.getBoundingClientRect();LDRAG={id,dx:ev.clientX-(r.left+r.width/2),dy:ev.clientY-(r.top+r.height/2),pid:ev.pointerId};try{e.setPointerCapture(ev.pointerId)}catch(x){}});
  e.addEventListener('pointermove',ev=>{if(!LDRAG||LDRAG.id!==id)return;LAY[id].x=clamp((ev.clientX-LDRAG.dx)/innerWidth,0,1);LAY[id].y=clamp((ev.clientY-LDRAG.dy)/innerHeight,0,1);applyLayout()});
  e.addEventListener('pointerup',()=>{if(LDRAG&&LDRAG.id===id){LDRAG=null;layoutSave()}})}
