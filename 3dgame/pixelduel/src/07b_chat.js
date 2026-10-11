// ===================== チャット（左上の吹き出しボタン・待合室） =====================
// オンラインは presence の cm に最新3つ [番号, 文] をのせる。CPU戦ではCPUが返事をする
const CHAT={open:false,seq:0,out:[],seen:-1,peer:''};
const QUICK=['よろしく！','GG','ナイス！','まって！','ありがとう','おしい！'];
const cleanText=s=>String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g,'').trim().slice(0,60);
function openChat(){if(CHAT.open)return;CHAT.open=true;for(const k in KEY)KEY[k]=false;mouseAtk=false;$('chatBox').classList.add('on');if(document.pointerLockElement)document.exitPointerLock();setTimeout(()=>{try{$('chatIn').focus()}catch(e){}},30)}
function closeChat(){CHAT.open=false;$('chatBox').classList.remove('on');try{$('chatIn').blur()}catch(e){}if(G.mode&&!inMenu())lockPointer()}
function sendChat(t){t=cleanText(t);if(!t)return;chatLine(cleanName(SV.name)||'あなた',t,true);SFX.click();
  if(NET.game){CHAT.seq++;CHAT.out.push([CHAT.seq,t]);if(CHAT.out.length>3)CHAT.out.shift();sendNow()}else if(G.mode==='bot')botReply(t)}
function chatLine(name,text,mine){const L=$('chatLog'),d=document.createElement('div'),n=document.createElement('b');n.textContent=name+'：';n.style.color=mine?'#7ab8ff':'#ff8a8a';d.appendChild(n);d.appendChild(document.createTextNode(text));d._t=9;L.appendChild(d);while(L.children.length>6)L.firstChild.remove()}
function chatUpdate(dt){for(const e of[...$('chatLog').children]){e._t-=dt;if(e._t<=0)e.remove();else e.style.opacity=Math.min(1,e._t)}}
// 相手の presence から新しい文を読む（はじめて見る相手の古い文は出さない）
function readChat(peer,p){const cm=p&&p.cm;if(!Array.isArray(cm))return;if(peer!==CHAT.peer){CHAT.peer=peer;CHAT.seen=cm.reduce((m,e)=>Array.isArray(e)&&e[0]>m?e[0]:m,-1);return}
  for(const e of cm){if(!Array.isArray(e)||!(e[0]>CHAT.seen))continue;CHAT.seen=e[0];const t=cleanText(e[1]);if(t){chatLine(cleanName(p.n)||'???',t,false);SFX.click()}}}
// CPUの返事
function botSay(t,delay){setTimeout(()=>{if(G.mode==='bot')chatLine(OPP.name,t,false)},delay||0)}
function botReply(t){const r=/よろしく|宜しく|hi|hello/i.test(t)?'よろしく！':/gg/i.test(t)?'GG!':/ナイス|nice/i.test(t)?'ありがとう！':/まって|待って/.test(t)?'まてないｗ':pick(['ｗ','まけないよ！','いい勝負！','そっちこそ！']);botSay(r,1200+Math.random()*1200)}
function bindChat(){const box=$('chatQuick');box.textContent='';for(const q of QUICK){const b=document.createElement('button');b.className='pb g';b.textContent=q;b.onclick=e=>{e.stopPropagation();sendChat(q);closeChat()};box.appendChild(b)}
  $('chatB').addEventListener('click',e=>{e.stopPropagation();openChat()});$('chatB').addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();openChat()},{passive:false});
  $('wChat').addEventListener('click',e=>{e.stopPropagation();openChat()});
  $('chatSend').addEventListener('click',e=>{e.stopPropagation();sendChat($('chatIn').value);$('chatIn').value='';closeChat()});
  $('chatClose').addEventListener('click',e=>{e.stopPropagation();closeChat()});
  $('chatIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&!e.isComposing){sendChat($('chatIn').value);$('chatIn').value='';closeChat()}else if(e.key==='Escape')closeChat()})}
