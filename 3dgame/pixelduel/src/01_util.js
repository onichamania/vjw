// ===================== 共通（数学・保存・設定・音） =====================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2,rr=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const LSget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},LSset=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
// 決まった乱数（マップの飾りを毎回同じにする）
let _sd=7;const sseed=s=>{_sd=s>>>0||1},srnd=()=>{_sd=(Math.imul(_sd,1664525)+1013904223)>>>0;return _sd/4294967296},srr=(a,b)=>a+srnd()*(b-a);
// ---- セーブ（名前・武器・成績・コイン） ----
const SAVE_KEY='pgduel-save-1';
const SV=Object.assign({name:'',weapon:'fists',sniper:'acr',wins:0,loses:0,draws:0,kills:0,coins:0,gems:0,skin:Math.floor(Math.random()*6)},(()=>{try{return JSON.parse(LSget(SAVE_KEY,'{}'))||{}}catch(e){return{}}})());
function saveSV(){LSset(SAVE_KEY,JSON.stringify(SV))}
// ---- 設定 ----
const SET={sens:+LSget('pgduel-sens',100),sound:LSget('pgduel-sound','1')==='1',shadow:LSget('pgduel-shadow','1')==='1'};
// ---- 音（WebAudioで作る） ----
let AC=null,MASTER=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=SET.homeMute?0:.5*HOME_VOL;MASTER.connect(AC.destination)}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
let NOISE=null;function noiseBuf(){if(!NOISE){const a=ac();NOISE=a.createBuffer(1,a.sampleRate*.6,a.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return NOISE}
// リロードの音はまとめておき、途中で持ちかえたり倒れたりしたら止める
let GRP=null,VOLK=1;const RELOAD_SND=[];
const loud=(k,f)=>{VOLK=k;try{f()}finally{VOLK=1}};   // しばらくの間だけ音を大きくする
function stopReloadSnd(){for(const n of RELOAD_SND)try{n.stop()}catch(e){}RELOAD_SND.length=0}
function tone(f,dur,type,vol,slide,delay){if(!SET.sound)return;const a=ac();if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);
  g.gain.setValueAtTime((vol||.15)*VOLK,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(MASTER);o.start(t);o.stop(t+dur+.02);if(GRP)GRP.push(o)}
function noise(dur,f0,f1,vol,delay,q){if(!SET.sound)return;const a=ac();if(!a)return;const t=a.currentTime+(delay||0),s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf();fl.type='bandpass';fl.Q.value=q||1.2;
  fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+dur);g.gain.setValueAtTime((vol||.3)*VOLK,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(MASTER);s.start(t);s.stop(t+dur+.02);if(GRP)GRP.push(s)}
// カチッ（金属）・ガチャ（はめる）・シャッ（すべらせる）
const clk=(v,dl)=>{tone(2600,.025,'square',.1*v,.7,dl);noise(.04,5000,3000,.4*v,dl,6)},
  clunk=(v,dl)=>{noise(.1,900,330,.75*v,dl,2);tone(170,.08,'square',.14*v,.6,dl);clk(v*.7,dl+.03)},
  slide=(v,dl,up)=>noise(.16,up?1300:2800,up?2800:1300,.35*v,dl,3);
const SFX={
 // 接近武器：ふる・当たる・持つ。v は音の大きさ（相手が遠いと小さく）
 swing(w,v){v=v==null?1:v;loud(3.5,()=>{if(w==='saber'){tone(110,.32,'sawtooth',.13*v,1.9);tone(222,.3,'sawtooth',.07*v,1.7);noise(.28,2200,600,.4*v,0,1.5)}
   else if(w==='fists'){noise(.2,750,240,.8*v,0,1.4);noise(.1,1600,600,.25*v,.02,2)}
   else{noise(.15,5200,1800,.42*v,0,2.5);tone(3300,.07,'sine',.03*v,.6)}})},
 hit(w,head){loud(w==='fists'?1:1.6,()=>{if(w==='saber'){tone(180,.24,'sawtooth',.17,.5);noise(.26,3500,800,.6,0,1.5);tone(90,.2,'square',.1,.7);noise(.3,6000,2500,.15,.08,2)}
   else if(w==='fists'){tone(150,.15,'sine',.7,.35);noise(.13,600,150,.9,0,1);noise(.05,2500,1200,.3)}
   else{noise(.12,2800,700,.7,0,2);tone(260,.08,'square',.12,.5);noise(.06,6000,3000,.3,.02,3)}});if(head)tone(1200,.08,'square',.07)},
 draw(w){loud(3,()=>{if(w==='saber'){tone(70,.45,'sawtooth',.16,2.4);tone(140,.4,'sawtooth',.06,2.2,.05);noise(.4,800,2400,.25,0,2)}
   else if(w==='knife'){noise(.28,4000,9000,.35,0,6);tone(4200,.25,'sine',.035,.9)}
   else if(w==='fists'){tone(120,.09,'sine',.45,.5);noise(.1,500,250,.4,0,1.5);tone(120,.09,'sine',.4,.5,.12);noise(.1,500,250,.35,.12,1.5)}
   else{slide(1,0,true);clk(1,.14)}})},
 hurt(){tone(300,.15,'square',.1,.5)},die(){tone(400,.5,'square',.12,.2)},kill(){tone(660,.1,'square',.1);tone(990,.18,'square',.1,1,.1)},
 jump(){tone(260,.1,'square',.05,1.6)},land(){noise(.06,300,100,.12)},step(){noise(.05,500,200,.05)},
 beep(hi){tone(hi?990:550,.15,'square',.12)},
 // スナイパー：ビーム（ACR）・彗星・弾（ほか）。dist で遠いほど小さく
 shot(w,dist){const v=dist==null?1:clamp(1-dist/90,.15,1);if(w==='acr'){tone(1100,.32,'sawtooth',.12*v,.12);noise(.3,4000,300,.35*v);tone(80,.35,'sine',.3*v,.5)}
   else if(w==='comet'){tone(260,.3,'sine',.14*v,6);tone(520,.28,'triangle',.08*v,3);noise(.35,6000,800,.25*v)}
   else{noise(.45,2600,160,.75*v,0,.7);tone(62,.4,'sine',.4*v,.45);noise(.15,5000,2500,.25*v)}},
 hitmark(head){tone(head?1500:1900,.05,'square',.08);if(head)tone(2300,.12,'triangle',.12,1,.06)},
 empty(){clk(2,0);tone(900,.03,'square',.06,1,.05)},
 // リロード（T 秒）：マガジンを外す→（エネルギー武器はためる）→はめる→ボルトを引く。終わりは reloadEnd
 reload(w,T,v,mine){v=(v==null?1:v)*2.5;T=T||2;if(mine){stopReloadSnd();GRP=RELOAD_SND}
   clk(v,0);slide(v,.06,false);noise(.12,700,300,.3*v,.2,2);
   if(w==='acr'||w==='comet'){for(let i=0;i<3;i++)tone(w==='acr'?180:300,T*.15,w==='acr'?'sawtooth':'sine',.06*v,2.2,T*(.22+i*.12))}
   slide(v,T*.45,true);clunk(v,T*.5);slide(v*.9,T*.72,true);clk(v,T*.72+.15);GRP=null},
 reloadEnd(w,v){v=(v==null?1:v)*2.5;noise(.08,3000,1400,.6*v,0,4);clk(v,.03);tone(620,.05,'square',.06*v,1,.12)},
 pickup(){tone(880,.08,'square',.08);tone(1320,.14,'square',.08,1,.07);tone(1760,.12,'triangle',.06,1,.14)},
 zoom(on){tone(on?1300:900,.04,'square',.05);noise(.05,on?4000:2500,on?2500:4000,.15,0,4)},boom(){noise(.9,600,40,.8,0,.6);tone(60,.6,'sine',.4,.4)},click(){tone(700,.04,'square',.06)},burn(){noise(.2,900,300,.06)}};
// ランチャー（3dgame）の設定：音を出す・音量
let HOME_VOL=1;function applyHome(o){if(!o||typeof o!=='object')return;if(typeof o.sound==='boolean')SET.homeMute=!o.sound;if(typeof o.vol==='number')HOME_VOL=clamp(o.vol,0,1);if(MASTER)MASTER.gain.value=SET.homeMute?0:.5*HOME_VOL}
try{applyHome(JSON.parse(LSget('3dame-settings','null')))}catch(e){}
addEventListener('message',e=>{if(e.data&&e.data.h3dSet)applyHome(e.data.h3dSet)});
// ---- お知らせ ----
let tipT=0;function tip(t,s){const e=$('tip');e.textContent=t;e.style.display='block';tipT=s||2.5}
