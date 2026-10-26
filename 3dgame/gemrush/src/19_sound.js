// ================= 音 =================
let AC=null,master=null,NB=null;
function initAudio(){if(AC){if(AC.resume)AC.resume();return}try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=S.sound?S.vol*.8:0;master.connect(AC.destination);
  NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}catch(e){AC=null}}
function nz(dur,vol,f,type,q,delay){if(!AC)return;const t=AC.currentTime+(delay||0),s=AC.createBufferSource();s.buffer=NB;const fl=AC.createBiquadFilter();fl.type=type||'lowpass';fl.frequency.value=f;fl.Q.value=q||1;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(master);s.start(t,Math.random()*.5);s.stop(t+dur+.05)}
function tn(f,dur,vol,type,f2,delay){if(!AC)return;const t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05)}
let hitCool=0;
const SFX={shot(k){if(k==='spread'){nz(.18,.5,1800);tn(160,.1,.25,'square',60)}else if(k==='snipe'){nz(.12,.35,4000,'highpass');tn(900,.15,.15,'sawtooth',200)}else if(k==='ice'){tn(1400,.18,.1,'triangle',600);nz(.12,.15,5000,'highpass')}else if(k==='tur'){nz(.06,.22,2500);tn(300,.05,.08,'square',150)}else{tn(300,.25,.12,'triangle',700);nz(.2,.12,900,'bandpass',2)}},
  hit(big){if(G.t<hitCool)return;hitCool=G.t+.04;tn(big?520:420,.07,big?.2:.1,'square',180)},punch(){nz(.12,.45,700);tn(110,.12,.35,'sine',50)},
  boom(big){nz(big?.9:.55,big?.9:.6,big?500:800);tn(90,big?.6:.4,.5,'sine',35)},die(){tn(600,.4,.2,'triangle',120);nz(.3,.2,1200)},
  gem(){tn(1320,.12,.15,'sine');tn(1760,.18,.12,'sine',0,.07)},gemSpawn(){tn(880,.2,.06,'sine',1320)},
  superGo(){tn(220,.3,.25,'sawtooth',880);nz(.3,.25,2500,'bandpass',3)},superReady(){tn(660,.12,.15,'square');tn(990,.2,.15,'square',0,.1)},
  heal(){tn(660,.25,.1,'sine',990);tn(990,.3,.08,'sine',1320,.08)},
  gadget(){tn(760,.12,.14,'square',1200);nz(.15,.12,3000,'bandpass',4)},
  beep(go){tn(go?880:520,go?.5:.18,.2,'square')},end(win){const n=win?[523,659,784,1046]:[440,392,330,262];n.forEach((f,i)=>tn(f,.3,.18,'triangle',0,i*.16))}};

