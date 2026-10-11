// ===================== 共通（数学・保存・設定・音） =====================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2,rr=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const LSget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},LSset=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
// 決まった乱数（マップの飾りを毎回同じにする）
let _sd=7;const sseed=s=>{_sd=s>>>0||1},srnd=()=>{_sd=(Math.imul(_sd,1664525)+1013904223)>>>0;return _sd/4294967296},srr=(a,b)=>a+srnd()*(b-a);
// ---- セーブ（名前・武器・成績・コイン） ----
const SAVE_KEY='pgduel-save-1';
const SV=Object.assign({name:'',weapon:'fists',wins:0,loses:0,draws:0,kills:0,coins:0,gems:0,skin:Math.floor(Math.random()*6)},(()=>{try{return JSON.parse(LSget(SAVE_KEY,'{}'))||{}}catch(e){return{}}})());
function saveSV(){LSset(SAVE_KEY,JSON.stringify(SV))}
// ---- 設定 ----
const SET={sens:+LSget('pgduel-sens',100),sound:LSget('pgduel-sound','1')==='1',shadow:LSget('pgduel-shadow','1')==='1'};
// ---- 音（WebAudioで作る） ----
let AC=null,MASTER=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=SET.homeMute?0:.5*HOME_VOL;MASTER.connect(AC.destination)}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
let NOISE=null;function noiseBuf(){if(!NOISE){const a=ac();NOISE=a.createBuffer(1,a.sampleRate*.6,a.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return NOISE}
function tone(f,dur,type,vol,slide,delay){if(!SET.sound)return;const a=ac();if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);
  g.gain.setValueAtTime(vol||.15,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(MASTER);o.start(t);o.stop(t+dur+.02)}
function noise(dur,f0,f1,vol,delay,q){if(!SET.sound)return;const a=ac();if(!a)return;const t=a.currentTime+(delay||0),s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf();fl.type='bandpass';fl.Q.value=q||1.2;
  fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+dur);g.gain.setValueAtTime(vol||.3,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(MASTER);s.start(t);s.stop(t+dur+.02)}
const SFX={
 swing(w){if(w==='saber'){tone(140,.28,'sawtooth',.07,1.8);noise(.25,1800,500,.12)}else if(w==='fists')noise(.14,900,300,.2);else noise(.13,3000,1200,.16)},
 hit(w,head){if(w==='saber'){noise(.18,2500,600,.25);tone(220,.15,'sawtooth',.08,.6)}else if(w==='fists'){noise(.12,400,120,.45);tone(90,.12,'square',.12,.6)}else{noise(.08,3500,1500,.3)}if(head)tone(1200,.08,'square',.06)},
 hurt(){tone(300,.15,'square',.1,.5)},die(){tone(400,.5,'square',.12,.2)},kill(){tone(660,.1,'square',.1);tone(990,.18,'square',.1,1,.1)},
 jump(){tone(260,.1,'square',.05,1.6)},land(){noise(.06,300,100,.12)},step(){noise(.05,500,200,.05)},
 beep(hi){tone(hi?990:550,.15,'square',.12)},boom(){noise(.9,600,40,.8,0,.6);tone(60,.6,'sine',.4,.4)},click(){tone(700,.04,'square',.06)},burn(){noise(.2,900,300,.06)}};
// ランチャー（3dgame）の設定：音を出す・音量
let HOME_VOL=1;function applyHome(o){if(!o||typeof o!=='object')return;if(typeof o.sound==='boolean')SET.homeMute=!o.sound;if(typeof o.vol==='number')HOME_VOL=clamp(o.vol,0,1);if(MASTER)MASTER.gain.value=SET.homeMute?0:.5*HOME_VOL}
try{applyHome(JSON.parse(LSget('3dame-settings','null')))}catch(e){}
addEventListener('message',e=>{if(e.data&&e.data.h3dSet)applyHome(e.data.h3dSet)});
// ---- お知らせ ----
let tipT=0;function tip(t,s){const e=$('tip');e.textContent=t;e.style.display='block';tipT=s||2.5}
