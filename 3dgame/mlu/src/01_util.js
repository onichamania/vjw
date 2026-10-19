// ================= 道具（数学・乱数・保存・音）=================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const LSget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}};
const LSset=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// 数の表示（1.2K・3.4M）
function fmt(n){n=Math.floor(n);if(n<1000)return String(n);if(n<1e6)return(n/1000).toFixed(n<1e4?1:0).replace(/\.0$/,'')+'K';return(n/1e6).toFixed(n<1e7?1:0).replace(/\.0$/,'')+'M'}
// ---- 球の上のベクトル（THREE.Vector3 を使う）----
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const _t1=new THREE.Vector3(),_t2=new THREE.Vector3(),_t3=new THREE.Vector3(),_q1=new THREE.Quaternion(),_m1=new THREE.Matrix4();
// 単位ベクトル u の接平面へ v を落として長さ1に
function tangent(v,u,out){out=out||new THREE.Vector3();out.copy(v).addScaledVector(u,-v.dot(u));const l=out.length();if(l<1e-6){out.set(1,0,0).addScaledVector(u,-u.x);out.normalize()}else out.multiplyScalar(1/l);return out}
// 表面の点（u）で、上が u・前が f になる向き（形は +Y が上、+Z が前）
const _fq1=new THREE.Vector3(),_fq2=new THREE.Vector3(),_fm=new THREE.Matrix4();
function frameQuat(u,f,out){const r=_fq1.crossVectors(u,f).normalize();const fw=_fq2.crossVectors(r,u);_fm.makeBasis(r,u,fw);return(out||new THREE.Quaternion()).setFromRotationMatrix(_fm)}
// u の接平面の基準の2本（右・前）
function upBasis(u,e1,e2){e1.set(0,1,0);if(Math.abs(u.y)>.9)e1.set(1,0,0);e1.crossVectors(e1,u).normalize();e2.crossVectors(u,e1);return e1}
// u から f の方向へ d（弧の長さ/半径）だけ進む
function walkOn(u,f,d){u.addScaledVector(f,d).normalize()}
// 2点の弧の距離（半径 R の球の上）
const arcDist=(a,b,R)=>Math.acos(clamp(a.dot(b),-1,1))*R;

// ================= 音（WebAudio で作る）=================
let AC=null,MASTER=null;const SET={sound:LSget('lu-sound','1')!=='0',homeMute:false};
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=SET.homeMute?0:.5*HOME_VOL;MASTER.connect(AC.destination)}catch(e){AC=null}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});return AC}
function tone(f,d,type,v,slide,delay){if(!SET.sound)return;const a=ac();if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.1,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(MASTER);o.start(t);o.stop(t+d+.02)}
let NOISEBUF=null;function noise(d,f1,f2,v,delay,q){if(!SET.sound)return;const a=ac();if(!a)return;if(!NOISEBUF){NOISEBUF=a.createBuffer(1,a.sampleRate,a.sampleRate);const D=NOISEBUF.getChannelData(0);for(let i=0;i<D.length;i++)D[i]=Math.random()*2-1}
  const t=a.currentTime+(delay||0),s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();s.buffer=NOISEBUF;fl.type='bandpass';fl.Q.value=q||1;fl.frequency.setValueAtTime(f1,t);fl.frequency.exponentialRampToValueAtTime(Math.max(30,f2),t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(MASTER);s.start(t);s.stop(t+d+.02)}
let sfxT={};const lim=(k,s)=>{const n=performance.now();if(sfxT[k]&&n-sfxT[k]<s*1000)return false;sfxT[k]=n;return true};
const SFX={
 chop(){noise(.09,1800,600,.35,0,2);tone(180,.07,'square',.06,.6)},
 mine(){tone(1200,.05,'square',.07,.5);noise(.07,4000,2500,.25,0,3);tone(2400,.06,'triangle',.05,.9,.01)},
 slash(){noise(.12,3000,900,.22,0,1.5)},
 hit(){tone(220,.08,'square',.09,.5);noise(.06,1200,500,.25,0,1)},
 hurt(){tone(320,.15,'sawtooth',.1,.5);noise(.1,900,300,.2)},
 fell(){noise(.3,700,150,.3,0,1);tone(110,.25,'sine',.2,.6)},
 pick(i){if(!lim('pick',.035))return;tone(700+(i||0)*40,.05,'triangle',.05,1.3)},
 pay(i){if(!lim('pay',.045))return;tone(500+Math.min(i||0,30)*25,.05,'square',.035,1.1)},
 unlock(){tone(523,.12,'triangle',.12);tone(659,.12,'triangle',.12,1,.09);tone(784,.2,'triangle',.12,1,.18);tone(1047,.3,'triangle',.1,1,.28);noise(.4,2000,6000,.12,.05,1)},
 rise(){noise(.5,300,900,.18,0,.8);tone(90,.4,'sine',.15,1.8)},
 coin(){if(!lim('coin',.05))return;tone(1320,.06,'square',.05);tone(1760,.1,'square',.05,1,.05)},
 level(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,.18,'triangle',.11,1,i*.08))},
 click(){tone(800,.04,'square',.05)},
 splash(){noise(.35,900,250,.25,0,.7)},
 shark(){tone(70,.6,'sawtooth',.12,.7);noise(.3,500,200,.2,.1,1)},
 die(){tone(440,.5,'triangle',.12,.3);tone(220,.6,'sine',.12,.4,.15)},
 portal(){tone(200,1.2,'sine',.2,4);tone(300,1.2,'triangle',.08,3,.1);noise(1,400,4000,.12,0,1.5)},
 craft(){tone(392,.08,'square',.05);tone(523,.1,'square',.05,1,.08)},
 roar(){noise(.6,400,120,.35,0,.8);tone(95,.6,'sawtooth',.12,.6)}};
// ランチャー（3dgame）の設定：音を出す・音量
let HOME_VOL=1;function applyHome(o){if(!o||typeof o!=='object')return;if(typeof o.sound==='boolean')SET.homeMute=!o.sound;if(typeof o.vol==='number')HOME_VOL=clamp(o.vol,0,1);if(MASTER)MASTER.gain.value=SET.homeMute?0:.5*HOME_VOL}
try{applyHome(JSON.parse(LSget('3dame-settings','null')))}catch(e){}
addEventListener('message',e=>{if(e.data&&e.data.h3dSet)applyHome(e.data.h3dSet)});

// ---- BGM（やさしい木琴のくり返し。音がオンのときだけ）----
const MUSIC={on:false,t:0,step:0,bar:0};
const CHORDS=[[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]];   // C Am F G
function marimba(m,t,v){const a=AC;const f=440*Math.pow(2,(m-69)/12);const o=a.createOscillator(),o2=a.createOscillator(),g=a.createGain();o.type='sine';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*4;
  const g2=a.createGain();g2.gain.value=.12;o2.connect(g2);g2.connect(g);o.connect(g);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.9);g.connect(MASTER);o.start(t);o2.start(t);o.stop(t+1);o2.stop(t+1)}
function musicTick(){if(!SET.sound||!MUSIC.on||!AC||AC.state!=='running')return;const a=AC;if(MUSIC.t<a.currentTime)MUSIC.t=a.currentTime+.05;
  while(MUSIC.t<a.currentTime+.4){const ch=CHORDS[MUSIC.bar%4],s=MUSIC.step%8;
    if(s===0)marimba(ch[0]-12,MUSIC.t,.05);if(s===4)marimba(ch[1]-12,MUSIC.t,.035);
    const r=Math.sin(MUSIC.bar*7.1+s*3.3)*.5+.5;if(s%2===0&&r>.35||r>.85)marimba(ch[(s*3+MUSIC.bar)%4]+(r>.7?12:0),MUSIC.t,.025);
    MUSIC.t+=.24;MUSIC.step++;if(MUSIC.step%8===0)MUSIC.bar++}}
setInterval(musicTick,120);
