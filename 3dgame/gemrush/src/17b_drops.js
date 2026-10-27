// ================= スタードロップ・カオスドロップ（本家の確率と中身）・クレジット・ブリング・ピンなど =================
// レア度：0レア 1スーパーレア 2ハイパーレア 3ウルトラレア 4レジェンドレア 5ウルトラ（カオスドロップだけ）
const DRAR=[{n:'レア',c:'#3fc35a',bg:['#a8ff6a','#2fbf3a','#0b4a1a']},{n:'スーパーレア',c:'#2f8cff',bg:['#8fe8ff','#1f7ae8','#0a1f6a']},
  {n:'ハイパーレア',c:'#b04cf5',bg:['#ffa8ff','#a53aee','#3a0f7a']},{n:'ウルトラレア',c:'#ff3d55',bg:['#ffb08a','#ef2f45','#6a0a1f']},
  {n:'レジェンドレア',c:'#ffc21a',bg:['#fffad0','#ffc21a','#c86a00']},{n:'ウルトラ',c:'#ffe8fa',bg:['#fffef0','#ffe08a','#ff8ac8','#ff7a4a']}];
// 本家の公式の確率（Supercellサポート「Starr Drop Chances」「Chaos Drop Chances」）
const SD_RAR=[50,28,15,5,2],CD_RAR=[0,52,28,12,6,2],CD_SPLIT=[[1,70],[2,20],[4,8],[8,2]];
const SD_TAB=[
  [[2.33,{bl:20}],[41.86,{coins:50}],[2.33,{cr:10}],[32.56,{pp:25}],[20.93,{xpd:100}]],
  [[3.31,{bl:50}],[42.38,{coins:100}],[3.31,{cr:30}],[33.11,{pp:50}],[13.25,{xpd:100}],[3.31,{pin:0}],[1.32,{spray:1}]],
  [[21.05,{coins:200}],[5.26,{cr:150}],[21.05,{pp:100}],[10.53,{xpd:100}],[5.26,{skin:0}],[15.79,{pin:0}],[5.26,{pin:1}],[15.79,{spray:1}]],
  [[11.11,{coins:500}],[7.41,{cr:150}],[22.22,{pp:200}],[10.37,{brawler:'エピック'}],[2.96,{brawler:'ミシック'}],[1.48,{skin:1}],[7.41,{pin:1}],[3.70,{pin:2}],[18.52,{kit:'gad'}],[7.41,{spray:1}],[7.41,{icon:1}]],
  [[18.29,{brawler:'エピック'}],[6.10,{brawler:'ミシック'}],[2.44,{brawler:'レジェンダリー'}],[12.20,{skin:2}],[42.68,{kit:'sp'}],[18.29,{kit:'hyper'}]]];
const CD_TAB=[null,
  [[51.61,{coins:100}],[40.32,{pp:50}],[4.03,{cr:30}],[4.03,{bl:50}]],
  [[40,{coins:200}],[40,{pp:100}],[10,{cr:150}],[10,{skin:0}]],
  [[15,{coins:500}],[25,{kit:'gad'}],[30,{pp:200}],[10,{cr:150}],[14,{brawler:'エピック'}],[4,{brawler:'ミシック'}],[2,{skin:1}]],
  [[42.68,{kit:'sp'}],[18.29,{kit:'hyper'}],[18.29,{brawler:'エピック'}],[6.10,{brawler:'ミシック'}],[2.44,{brawler:'レジェンダリー'}],[12.20,{skin:2}]],
  [[26.74,{kit:'hyper'}],[26.74,{brawler:'ミシック'}],[10.70,{brawler:'レジェンダリー'}],[0.53,{brawler:'ウルトラレジェンダリー'}],[5.35,{skin:2}],[2.14,{skin:3}],[1.07,{skin:4}],[26.74,{buffy:1}]]];
// もう持っているときの代わり（本家の「フォールバック報酬」）
const FB_BRAWL={'エピック':500,'ミシック':1000,'レジェンダリー':1000,'ウルトラレジェンダリー':1500},FB_SKIN=[100,200,500,500,1000],FB_KIT={gad:500,sp:1000,hyper:1000};
// クレジットでキャラを解放（本家のスターロードと同じ値段）
const CR_COST={'レア':160,'スーパーレア':430,'エピック':925,'ミシック':1900,'レジェンダリー':3800};
// ---- 新しい通貨：クレジット・ブリング・XPダブラー ----
const cr=()=>+LS('gr-cr',0),addCr=n=>LSset('gr-cr',Math.max(0,cr()+n)),bl=()=>+LS('gr-bl',0),addBl=n=>LSset('gr-bl',Math.max(0,bl()+n)),xpd=()=>+LS('gr-xpd',0),addXpd=n=>LSset('gr-xpd',Math.max(0,xpd()+n));
const dropN=t=>+LS(t==='chaos'?'gr-cd':'gr-sd',0),addDrop=(t,n)=>LSset(t==='chaos'?'gr-cd':'gr-sd',Math.max(0,dropN(t)+(n==null?1:n)));
// ---- ピン（キャラごとに ノーマル5・レア2・ハイパーレア1）・スプレー・プレイヤーアイコン ----
const PINK=[{n:'ハッピー',e:'😄',t:0},{n:'かなしい',e:'😢',t:0},{n:'おこ',e:'😠',t:0},{n:'ありがとう',e:'🙏',t:0},{n:'GG',e:'GG',t:0},{n:'わはは',e:'🤣',t:1},{n:'ドヤ',e:'😎',t:1},{n:'スペシャル',e:'⭐',t:2}];
const PINT=['ノーマル','レア','ハイパーレア'];
const pinsOf=id=>J('gr-pins',{})[id]||[],sprays=()=>J('gr-spr',[]),picons=()=>J('gr-ico',[]);
function addPin(id,i){const P=J('gr-pins',{});(P[id]=P[id]||[]).push(i);JS('gr-pins',P)}
function pinArt(id,i,big){const p=PINK[i],ring=['#ffffff','#5fb8ff','#c264ff'][p.t];
  return `<span class="pinA${big?' big':''}" style="--pr:${ring}"><span class="pf">${portrait(id)}</span><b class="${p.e==='GG'?'gg tx':''}">${p.e}</b></span>`}
function sprayArt(id){return `<span class="sprA" style="--rc:${RARC[BT[id].rar]}"><svg viewBox="0 0 100 100"><path d="M50 4c9 8 20 2 26 12s-2 18 8 26 10 22 0 30-22 4-30 14-22 6-30-4-4-22-14-30S2 38 12 30s20-4 22-16S41-4 50 4z" fill="var(--rc)" stroke="#000" stroke-width="4"/></svg><span class="pf">${portrait(id)}</span></span>`}
function iconArt(id){return `<span class="icoA" style="--rc:${RARC[BT[id].rar]}">${pic(id)}</span>`}
// ---- アイコン（スタードロップ・カオスドロップ・クレジット・ブリング・XPダブラー） ----
function starrSvg(r){const C=100,Y=106,pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,R=i%2?47:94;pts.push([C+Math.cos(a)*R,Y+Math.sin(a)*R])}
  let fac='';for(let i=0;i<10;i++){const a=pts[i],b=pts[(i+1)%10],m=Math.atan2((a[1]+b[1])/2-Y,(a[0]+b[0])/2-C),k=(Math.cos(m+2.3)+1)/2;
    fac+=`<path d="M${C} ${Y}L${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}Z" fill="${k>.62?'#ffe45a':k>.3?'#ffc21a':'#f09a12'}"/>`}
  const P='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z';
  const face=[`<ellipse cx="86" cy="98" rx="7" ry="10"/><ellipse cx="114" cy="98" rx="7" ry="10"/><path d="M82 113Q100 136 118 113Z"/>`,
    `<ellipse cx="86" cy="97" rx="7.5" ry="10.5"/><ellipse cx="114" cy="97" rx="7.5" ry="10.5"/><circle cx="88.5" cy="93" r="2.6" fill="#fff"/><circle cx="116.5" cy="93" r="2.6" fill="#fff"/><path d="M80 111Q100 140 120 111Z"/>`,
    `<path d="M78 100Q86 88 94 100M106 100Q114 88 122 100" stroke="#16110a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M82 112Q100 134 118 112Z"/>`,
    `<ellipse cx="86" cy="96" rx="8" ry="10"/><ellipse cx="114" cy="96" rx="8" ry="10"/><circle cx="88.5" cy="92" r="2.8" fill="#fff"/><circle cx="116.5" cy="92" r="2.8" fill="#fff"/><ellipse cx="100" cy="121" rx="8" ry="10"/>`,
    `<path d="M86 86l3.4 7 7.6 1-5.5 5.3 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6-5.5-5.3 7.6-1zM114 86l3.4 7 7.6 1-5.5 5.3 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6-5.5-5.3 7.6-1z" fill="#16110a"/><path d="M79 112Q100 142 121 112Z"/><path d="M90 124Q100 132 110 124Q100 120 90 124Z" fill="#ff6a7a"/>`][Math.min(4,r||0)];
  return `<svg viewBox="0 0 200 200"><path d="${P}" fill="#000" transform="translate(0 6)" opacity=".35"/>${fac}<path d="${P}" fill="none" stroke="#16110a" stroke-width="7" stroke-linejoin="round"/>`+
    `<circle cx="100" cy="106" r="38" fill="#ffcf2e" stroke="#16110a" stroke-width="6"/><path d="M68 100a32 32 0 0 1 52-26" stroke="#fff6b0" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>`+
    `<g fill="#16110a">${face}</g><ellipse cx="94" cy="44" rx="4.5" ry="12" fill="#fff" opacity=".8" transform="rotate(22 94 44)"/><ellipse cx="44" cy="74" rx="9" ry="4" fill="#fff" opacity=".55" transform="rotate(-8 44 74)"/></svg>`}
// カオスドロップの色（スーパーレア〜ウルトラ）：星・中の玉・目
const CPAL=[null,['#0f4a8a','#1f6ad0','#07234a','#5fe8ff','#2a9aff'],['#4a157a','#7a2ac0','#22073a','#ff7af0','#c03aff'],['#6a0f22','#b0203a','#33050f','#ff8a7a','#ff3a4a'],['#9a5a00','#e0a020','#4a2a00','#fff36a','#ffb020'],['#aab4d8','#eef2ff','#6a74a0','#9ae8ff','#58c8ff']];
function chaosSvg(r){r=clamp(r||1,1,5);const [s1,s2,s3,eye,glow]=CPAL[r],C=100,pts=[];for(let i=0;i<12;i++){const a=-Math.PI/2+i*Math.PI/6,R=i%2?66:96;pts.push([C+Math.cos(a)*R,C+Math.sin(a)*R])}
  let fac='';for(let i=0;i<12;i++){const a=pts[i],b=pts[(i+1)%12],m=Math.atan2((a[1]+b[1])/2-C,(a[0]+b[0])/2-C),k=(Math.cos(m+2.3)+1)/2;
    fac+=`<path d="M${C} ${C}L${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}Z" fill="${k>.62?s2:k>.3?s1:s3}"/>`}
  const P='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z';
  return `<svg viewBox="0 0 200 200"><path d="${P}" fill="#000" transform="translate(0 6)" opacity=".35"/>${fac}<path d="${P}" fill="none" stroke="#0a0a12" stroke-width="7" stroke-linejoin="round"/>`+
    `<circle cx="100" cy="100" r="50" fill="${s3}"/><circle cx="96" cy="96" r="45" fill="${s1}"/><circle cx="90" cy="88" r="32" fill="${s2}" opacity=".6"/><circle cx="100" cy="100" r="50" fill="none" stroke="#0a0a12" stroke-width="7"/>`+
    `<g stroke="#0a0a12" stroke-width="3" stroke-linejoin="round"><path d="M60 92l-12-10 4 12-10 4 14 4z" fill="#ffe35a"/><path d="M140 92l12-10-4 12 10 4-14 4z" fill="#ffe35a"/>`+
    `<path d="M60 92Q78 92 95 104Q82 118 66 108Z" fill="${eye}"/><path d="M140 92Q122 92 105 104Q118 118 134 108Z" fill="${eye}"/></g>`+
    `<circle cx="80" cy="104" r="5" fill="${s3}"/><circle cx="120" cy="104" r="5" fill="${s3}"/><path d="M62 84L94 96M138 84L106 96" stroke="#0a0a12" stroke-width="6" stroke-linecap="round"/>`+
    `<path d="M84 126Q100 136 116 126" stroke="${eye}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="80" cy="72" rx="12" ry="7" fill="#fff" opacity=".7" transform="rotate(-25 80 72)"/>`+
    `<circle cx="100" cy="100" r="50" fill="none" stroke="${glow}" stroke-width="2" opacity=".6"/></svg>`}
Object.assign(ICON,{star:starrSvg(0),chaos:chaosSvg(1),
  credit:SVG(`<circle cx="32" cy="33" r="25" fill="#7a3df0" ${OL}/><circle cx="32" cy="31" r="19" fill="#a46aff"/><path d="M32 17l4 9 10 1-7.5 6.8 2.2 9.7L32 38.4l-8.7 5.1 2.2-9.7L18 27l10-1z" fill="#fff" stroke="#16131d" stroke-width="2.5" stroke-linejoin="round"/>`),
  bling:SVG(`<path d="M32 6l20 18-20 34L12 24z" fill="#ffd21f" ${OL}/><path d="M12 24h40L32 58z" fill="#ffb514"/><path d="M22 24l10-18 10 18z" fill="#fff3a0"/><path d="M12 24h40" stroke="#16131d" stroke-width="3"/><path d="M50 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff"/>`),
  xpd:SVG(`<rect x="6" y="14" width="52" height="38" rx="10" fill="#2f8cff" ${OL}/><rect x="10" y="18" width="44" height="14" rx="6" fill="#6fc0ff"/><text x="32" y="44" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" stroke="#16131d" stroke-width="3" paint-order="stroke" font-family="Lilita One,sans-serif">XP×2</text>`),
  pin:SVG(`<circle cx="32" cy="32" r="24" fill="#ffd84d" ${OL}/><circle cx="25" cy="28" r="3.6" fill="#16131d"/><circle cx="39" cy="28" r="3.6" fill="#16131d"/><path d="M22 38q10 9 20 0" stroke="#16131d" stroke-width="3.4" fill="none" stroke-linecap="round"/>`),
  spray:SVG(`<rect x="20" y="20" width="24" height="38" rx="6" fill="#ff5fa2" ${OL}/><rect x="26" y="8" width="12" height="12" rx="3" fill="#c8ccd8" ${OL}/><circle cx="48" cy="12" r="3" fill="#ff5fa2"/><circle cx="54" cy="18" r="2.4" fill="#ff5fa2"/><circle cx="52" cy="6" r="2" fill="#ff5fa2"/><rect x="24" y="30" width="16" height="12" rx="3" fill="#fff"/>`),
  picon:SVG(`<rect x="8" y="8" width="48" height="48" rx="8" fill="#2fbf4a" ${OL}/><circle cx="32" cy="27" r="9" fill="#fff"/><path d="M16 52c2-10 8-14 16-14s14 4 16 14z" fill="#fff"/>`)});
// ---- 抽選 ----
const pickW=w=>{let x=Math.random()*w.reduce((s,v)=>s+v,0);for(let i=0;i<w.length;i++){x-=w[i];if(x<0&&w[i]>0)return i}let i=w.length-1;while(i>0&&!w[i])i--;return i};
const pickR=L=>L[Math.floor(Math.random()*L.length)];
const rollTab=T=>T[pickW(T.map(e=>e[0]))][1];
// スタードロップ：最後のレア度を本家の確率で先に決め、4回のタップのどこで上がるかを割りふる（同じタップに重なると一気に上がる）
function planStarr(){const fin=pickW(SD_RAR),at=[];for(let i=0;i<fin;i++)at.push(i&&Math.random()<.4?at[i-1]:1+Math.floor(Math.random()*4));at.sort((a,b)=>a-b);return{fin,at}}
// カオスドロップ：最後のレア度と分かれる数を本家の確率で決め、「ランクアップ」「分裂」を順番にならべる（1回ごとに3回の猶予が戻る）
function planChaos(){const fin=pickW(CD_RAR),sp=CD_SPLIT[pickW(CD_SPLIT.map(e=>e[1]))][0],ev=[];for(let i=1;i<fin;i++)ev.push('u');for(let n=1;n<sp;n*=2)ev.push('s');
  for(let i=ev.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ev[i],ev[j]]=[ev[j],ev[i]]}return{fin,sp,ev}}
// ---- 中身を渡す（本当のセーブに書く。管理者モードでも、ふだんのセーブの持ち物で判定）----
const realLv=id=>clamp(+LS('gr-lv-'+id,1)||1,1,MAXLV),realKit=id=>{const o=J('gr-ko-'+id,{gad:[],sp:[],hyper:false});o.gad=o.gad||[];o.sp=o.sp||[];return o};
const KITN={gad:'ガジェット',sp:'スターパワー',hyper:'ハイパーチャージ'};
function grantCur(r,note){const k=Object.keys(r)[0],n=r[k];({coins:addCoins,pp:addPP,cr:addCr,bl:addBl,xpd:addXpd})[k](n);
  return{k,n,note:note||'',title:{coins:'コイン',pp:'パワーポイント',cr:'クレジット',bl:'ブリング',xpd:'XPダブラー'}[k],ic:ICON[{coins:'coin',pp:'pp',cr:'credit',bl:'bling',xpd:'xpd'}[k]]}}
function grantDrop(S){const own=ownedReal();
  if(S.brawler){const c=BT_IDS.filter(id=>BT[id].rar===S.brawler&&!own.includes(id));
    if(!c.length)return grantCur({cr:FB_BRAWL[S.brawler]},(S.brawler==='ウルトラレジェンダリー'?'ウルトラレジェンドレア':RARN[S.brawler])+'キャラのかわり');
    const id=pickR(c);own.push(id);JS('gr-own',own);return{k:'char',id,title:'新キャラクター！',show:{kind:'char',id}}}
  if(S.skin!=null){const c=[];for(const id of own)for(const s of SKINS[id])if(s.t===S.skin&&!skinsOwned(id).includes(s.id))c.push([id,s]);
    if(!c.length)return grantCur({bl:FB_SKIN[S.skin]},DRAR[S.skin].n+'スキンのかわり');
    const [id,s]=pickR(c),o=skinsOwned(id);o.push(s.id);JS('gr-sk-'+id,o);return{k:'skin',id,sk:s.id,title:'新しいスキン！',show:{kind:'skin',id,sk:s.id}}}
  if(S.pin!=null){const c=[];for(const id of own)PINK.forEach((p,i)=>{if(p.t===S.pin&&!pinsOf(id).includes(i))c.push([id,i])});
    if(!c.length)return grantCur({bl:50},PINT[S.pin]+'ピンのかわり');const [id,i]=pickR(c);addPin(id,i);return{k:'pin',id,i,title:PINT[S.pin]+'ピン',sub:BT[id].name+'「'+PINK[i].n+'」'}}
  if(S.spray){const sp=sprays(),c=own.filter(id=>!sp.includes(id));if(!c.length)return grantCur({bl:50},'スプレーのかわり');const id=pickR(c);sp.push(id);JS('gr-spr',sp);return{k:'spray',id,title:'スプレー',sub:BT[id].name+'のスプレー'}}
  if(S.icon){const ic=picons(),c=own.filter(id=>!ic.includes(id));if(!c.length)return grantCur({bl:50},'プレイヤーアイコンのかわり');const id=pickR(c);ic.push(id);JS('gr-ico',ic);return{k:'icon',id,title:'プレイヤーアイコン',sub:BT[id].name}}
  if(S.kit){const K=S.kit,c=[];for(const id of own){if(realLv(id)<KITLV[K])continue;const o=realKit(id);if(K==='hyper'){if(!o.hyper)c.push([id,0])}else BT[id][K].forEach((x,i)=>{if(!o[K].includes(i))c.push([id,i])})}
    if(!c.length)return grantCur({coins:FB_KIT[K]},KITN[K]+'のかわり');const [id,i]=pickR(c),o=realKit(id);if(K==='hyper')o.hyper=true;else o[K].push(i);JS('gr-ko-'+id,o);
    if(K!=='hyper'){const e=kitEq(id);if(e[K]<0){e[K]=i;JS('gr-ke-'+id,e)}}
    return{k:'kit',K,id,i,title:KITN[K],sub:K==='hyper'?BT[id].hyper.name:BT[id][K][i].name}}
  if(S.buffy){const c=[];for(const id of own)if(BUF[id]){const b=J('gr-bf-'+id,{});for(const k of['gad','sp','hyper'])if(!b[k])c.push([id,k])}
    if(!c.length)return grantCur({pp:1000},'バフィーのかわり');const [id,k]=pickR(c);giveBuffy(id,k);return{k:'buf',id,bk:k,title:'バフィー！',show:{kind:'buf',id,k}}}
  return grantCur(S)}
