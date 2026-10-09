// ===================== クマのクエスト =====================
const BLACK_MAIN=QUEST_TABLE.black.filter(q=>!q.name.startsWith('Black Bear:')),BLACK_REP=QUEST_TABLE.black.filter(q=>q.name.startsWith('Black Bear:')).map(q=>Object.assign({},q,{name:q.name.replace('Black Bear: ','')}));
const CI={w:0,r:1,b:2};
function reqVal(r){switch(r.t){
  case 'pollen':{const ci=r.c?CI[r.c]:null;if(r.f&&ci!=null)return ST.st.fc[r.f+ci]||0;if(r.f)return ST.st.f[r.f]||0;if(ci!=null)return ST.st.c[ci];return ST.st.pollen}
  case 'kill':return ST.st.kill[r.m]||0;case 'feed':return ST.st.feed[r.i]||0;case 'use':return ST.st.use[r.i]||0;case 'token':return ST.st.tok[r.k]||0;
  case 'level':return hiveBees().filter(b=>b.lv>=r.l).length;case 'discover':return ST.disc.length}return 0}
const absReq=r=>r.t==='level'||r.t==='discover';
function reqProg(r,s0){const v=absReq(r)?reqVal(r):reqVal(r)-(s0||0);return[Math.max(0,v),r.n]}
function reqText(r){switch(r.t){
  case 'pollen':return (r.f?FIELDS[r.f].jp+'で':'')+(r.c?CNAME[r.c]:'')+'花粉を集める';case 'kill':return MOBS[r.m].jp+'をたおす';
  case 'feed':return 'ハチに'+(ITEMS[r.i]?ITEMS[r.i].jp:r.i)+'をあげる';case 'use':return (ITEMS[r.i]?ITEMS[r.i].jp:r.i)+'を使う';
  case 'level':return (r.n===1?'ハチ1匹':'ハチ'+r.n+'匹')+'をレベル'+r.l+'以上にする';case 'discover':return 'ハチを'+r.n+'種類見つける';
  case 'token':return (r.k==='any'?'能力':r.k==='bomb'?'ボム':r.k==='honeytok'?'ハチミツ':r.k==='treattok'?'おやつ':TOK_INFO[r.k]?TOK_INFO[r.k][0]:r.k)+'のトークンを集める'}return '?'}
function rewText(rw){return rw.map(([k,n])=>k==='honey'?'🍯'+fmt(n):k==='science'?'🔬サイエンスの強化':k==='polar'?'❄️ポーラーパワー':(ITEMS[k]?ITEMS[k].ic+ITEMS[k].jp:k)+'×'+fmt(n)).join('・')}
function questDone(cur){return cur.req.every((r,i)=>{const [v,n]=reqProg(r,cur.s0[i]);return v>=n})}
// ブラウンベア：本家と同じ計算で、こなした数が多いほど集める量が増える
function brownP(x,cnt){const r100=v=>Math.floor((v+.5)/100)*100;const base=r100(2500*x),inc=r100(5000*x),max=r100(1e13*x);const bp=base+cnt*inc;const s=cnt/1000<1?Math.pow(cnt/1000,4):Math.pow(cnt/1000,2);
  const req=bp+(max-bp)*s,iv=Math.pow(10,Math.max(Math.floor(Math.log10(Math.max(req,1)))-1,1));return Math.floor(req/iv+.5)*iv}
const BROWN_RJ=[[5,1],[15,2],[25,3],[30,5],[40,10],[50,20],[60,30],[75,50],[100,100],[110,125],[120,150],[125,250],[150,500],[200,750]];
const BROWN_MILE={5:[['fielddice',3]],10:[['microconverter',5]],15:[['fielddice',5]],20:[['bitterberry',25]],25:[['silveregg',1]],30:[['microconverter',5]],35:[['oil',1]],40:[['bitterberry',50]],45:[['enzymes',1]],50:[['goldegg',1]],55:[['magicbean',1]],60:[['bitterberry',50]],65:[['fielddice',5]],70:[['microconverter',5]],75:[['diamondegg',1]],80:[['microconverter',10]],85:[['tropicaldrink',1]],90:[['starjelly',1]],95:[['gumdrops',100]],100:[['mythicegg',1]]};
function brownQuest(cnt){const n=beeCount(),pool=BROWN_TABLE.filter(q=>q.min<=n&&q.req.every(r=>!r.f||FIELDS[r.f].zone<=n));const q=pick(pool.length?pool:BROWN_TABLE.slice(0,5));
  const req=q.req.map(r=>{const o={t:'pollen',n:brownP(r.x,cnt)};if(r.f)o.f=r.f;if(r.c)o.c=r.c;return o});
  const rj=(BROWN_RJ.find(([m])=>cnt<=m)||[0,1000])[1],honey=Math.round(req.reduce((s,r)=>s+r.n,0)*.35);
  const rw=[['honey',honey],['ticket',1],['royaljelly',rj]];if((cnt+1)%3===0)rw.push(['jellybeans',3]);for(const x of BROWN_MILE[cnt+1]||[])rw.push(x);
  return{name:q.name,req,rw,st:[]}}
function nextQuest(bear){const q=ST.q[bear]||(ST.q[bear]={i:0,cur:null,done:0});
  if(bear==='brown')return brownQuest(q.done);if(bear==='polar')return JSON.parse(JSON.stringify(pick(QUEST_TABLE.polar)));
  const L=bear==='black'?BLACK_MAIN:QUEST_TABLE[bear];if(!L)return null;if(q.i<L.length)return JSON.parse(JSON.stringify(L[q.i]));
  if(bear==='black')return JSON.parse(JSON.stringify(pick(BLACK_REP)));return null}
function acceptQuest(bear,cur){const q=ST.q[bear];cur.s0=cur.req.map(r=>absReq(r)?0:reqVal(r));q.cur=cur;for(const [k,n] of cur.st||[])give(k,n);note('📜 クエスト「'+cur.name+'」を受けた');save()}
function giveRewards(rw){for(const [k,n] of rw){if(k==='honey'){addHoney(n);note('🍯 +'+fmt(n))}else if(k==='science'){ST.sci++;note('🔬 サイエンスの強化：変換速度+25%（合計'+ST.sci+'）')}else if(k==='polar'){ST.polar++;note('❄️ ポーラーパワー：ハチのエネルギー×1.05')}else give(k,n)}calcStats()}
function finishQuest(bear){const q=ST.q[bear];giveRewards(q.cur.rw);q.done++;q.i++;q.cur=null;big('✅ クエスト完了！',1.6);SFX.levelup();save()}
const BEAR_TALK={black:['やあ、ビーキーパー！ぼくはブラックベア。花粉集めのことなら、まかせてよ。','いい集めっぷりだね！その調子でいこう。'],
 mother:['いらっしゃい。ハチたちと仲良くなるには、おやつをあげるのがいちばんよ。','ハチはきずなが深まるとレベルが上がるの。'],
 brown:['わしの頼みはいつも花粉集めだ。いくらやっても終わりはないぞ。','ふむ、どんどん頼むぞ。'],
 panda:['フィールドを荒らす虫たちをやっつけてくれないか。','ハチのレベルが敵より低いと、攻撃がはずれやすいぞ。'],
 science:['研究のために、いろいろなデータが必要なんだ。','ハチの種類をたくさん見つけてくれたまえ。'],
 polar:['料理の材料を集めてきてくれないか？ごほうびはポーラーパワーだ。','おいしいのができそうだ。']};
function talkBear(id){const B=BEARS[id];
  if(!BEAR_TALK[id]){showDlg(B.jp,id==='spirit'?'……風の声が聞こえる？（この版ではスピリットベアのクエストはまだ入っていません）':'ブーン！（この版ではハニービーのクエストはまだ入っていません）');return}
  const q=ST.q[id]||(ST.q[id]={i:0,cur:null,done:0});const T=BEAR_TALK[id];
  if(q.cur){const prog=q.cur.req.map((r,i)=>{const [v,n]=reqProg(r,q.cur.s0[i]);return `${v>=n?'✅':'⬜'} ${reqText(r)}　${fmt(Math.min(v,n))} / ${fmt(n)}`}).join('<br>');
    if(questDone(q.cur))showDlg(B.jp,'「'+q.cur.name+'」ができたね！ありがとう。<br>'+prog+'<br>ごほうび：'+rewText(q.cur.rw),[['ごほうびをもらう',()=>{finishQuest(id);hideDlg()},''],['とじる',hideDlg,'d']]);
    else showDlg(B.jp,'「'+q.cur.name+'」のとちゅうだね。<br>'+prog,[['とじる',hideDlg,'d']]);return}
  const nq=nextQuest(id);if(!nq){showDlg(B.jp,'もう頼みたいことはないよ。ありがとう！');return}
  showDlg(B.jp,(q.done?T[1]:T[0])+'<br><br><b>クエスト「'+nq.name+'」</b><br>'+nq.req.map(r=>'・'+reqText(r)+' '+fmt(r.n)).join('<br>')+'<br>ごほうび：'+rewText(nq.rw)+(nq.st&&nq.st.length?'<br>（受けるときに '+rewText(nq.st)+' がもらえる）':''),
    [['受ける',()=>{acceptQuest(id,nq);hideDlg()},''],['あとで',hideDlg,'d']])}
