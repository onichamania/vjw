// ---- ずっと使えるコード（LUC-XXXX-XXXX）：セーブするたびに、同じコードの中身を最新に上書きする ----
// 中身はランチャー（Claude のアーティファクト）のデータ（db）に置く：lusave/<コード> に見出し、lusave/<コード>/<a|b>/<番号> にセーブコード。
// 書くときは、いま見出しが指していない方（a/b）に書いてから見出しを切りかえる（読んでいる人に書きかけを見せない）。書けるのはランチャーの持ち主（と編集できる人）だけ
const CLOUD={key:null,s:null};   // このセーブがつながっているコードと、最後に読んだ／書いた版
const CL={p:null,db:null,canW:null,chain:Promise.resolve(),queued:false,qp:null,last:-1e9,tm:0,said:false,bad:false,conf:false};
const clRun=fn=>{const q=CL.chain.then(fn);CL.chain=q.catch(()=>{});return q};   // 書くのはいつも1つずつ
const CL_ABC='23456789ABCDEFGHJKMNPQRSTUVWXYZ',CL_PART=200000;
const clKey=s=>{const m=String(s||'').toUpperCase().replace(/[\s-]/g,'').match(/^LUC([2-9A-Z]{8})$/);return m?m[1]:null};
const clShow=k=>'LUC-'+k.slice(0,4)+'-'+k.slice(4);
function clInit(){return CL.p||(CL.p=(async()=>{const C=netClaude();if(!C)return null;let db=null;try{db=await C.use('db')}catch(e){db=null}CL.db=db;
  if(db){try{const u=await C.use('user');CL.canW=u?await u.can('data.write'):null}catch(e){CL.canW=null}}return db})())}
const clNoDb='この画面ではずっと使えるコードを使えません。Claude にサインインしてランチャーを開いてください（ふつうの長いセーブコードは使えます）';
// 上げるセーブ（コードの情報はのぞく）
const clBody=s=>{const o=Object.assign({},s);delete o.cloud;delete o.cloudS;return o};
// 読む：見出しと同じ印（s）の部分だけをつなぐ。ちょうど書きかえ中なら少し待って読みなおす
async function clHead(key){const db=await clInit();if(!db)throw new Error(clNoDb);const hs=await db.doc('lusave/'+key).get();return hs.exists?hs.data():null}
async function clGet(key){const db=await clInit();if(!db)throw new Error(clNoDb);const H=db.doc('lusave/'+key);
  for(let tr=0;tr<5;tr++){const hs=await H.get();if(!hs.exists)throw new Error('このコード（'+clShow(key)+'）は見つかりません');const h=hs.data();
    const ps=await Promise.all(Array.from({length:h.n|0},(_,i)=>H.collection(h.g).doc(String(i)).get()));
    if(ps.length&&ps.every(q=>q.exists&&q.data().s===h.s))return{code:ps.map(q=>q.data().d).join(''),h};await new Promise(r=>setTimeout(r,1200))}
  throw new Error('いま上書きしているところのようです。少し待ってからもう一度読みこんでください')}
// 書く：base（この端末が最後に読んだ／書いた版）とちがう版になっていたら、別の場所で新しくなっているので上書きしない
async function clPut(key,save,base){const db=await clInit();if(!db)throw new Error(clNoDb);const code=await packCode(clBody(save)),H=db.doc('lusave/'+key);let h=null;try{const hs=await H.get();h=hs.exists?hs.data():null}catch(e){}
  if(base&&h&&h.s!==base)throw{code:'conflict',message:'conflict'};
  const g=h&&h.g==='a'?'b':'a',ng=Object.assign({a:0,b:0},h&&h.ng),s=Date.now().toString(36)+Math.random().toString(36).slice(2,6),n=Math.max(1,Math.ceil(code.length/CL_PART));
  for(let i=0;i<n;i++)await H.collection(g).doc(String(i)).set({s,d:code.slice(i*CL_PART,(i+1)*CL_PART)});
  for(let i=n;i<(ng[g]|0);i++)try{await H.collection(g).doc(String(i)).delete()}catch(e){}   // 前より短くなった分
  ng[g]=n;const pct=Math.floor(((save.open||[]).length-1)/NTILE*100);await H.set({v:1,g,n,s,ng,len:code.length,t:Date.now(),p:pct});return{s}}
// 書いた版をおぼえる（この端末のセーブにも）
function clMark(s){CLOUD.s=s;try{const o=loadSave();if(o&&o.cloud===CLOUD.key&&o.cloudS!==s){o.cloudS=s;LSset(SAVE_KEY,JSON.stringify(o))}}catch(e){}}
// 新しいコードを作って、いまのセーブをつなぐ
async function clMake(){const db=await clInit();if(!db)throw new Error(clNoDb);if(CL.canW===false)throw new Error('ずっと使えるコードを作れるのは、このランチャーの持ち主だけです');
  saveGame();const save=loadSave();if(!save)throw new Error('セーブがありません');
  let key='';for(let tr=0;tr<5;tr++){key=Array.from({length:8},()=>CL_ABC[Math.random()*CL_ABC.length|0]).join('');const hs=await db.doc('lusave/'+key).get();if(!hs.exists)break}
  const r=await clRun(()=>clPut(key,save));CLOUD.key=key;CL.conf=false;CL.bad=false;CL.said=true;clMark(r.s);saveGame();return key}
const clErr=e=>e&&e.code==='conflict'?'別の場所でこのコードが新しくなっています':e&&(e.code==='invalid_argument'||e.code==='not_granted'||e.code==='permission_denied')?'このコードに上書きできるのは、ランチャーの持ち主だけです':e&&e.code==='quota_exceeded'?'保存できる量がいっぱいです':(e&&e.message)||'うまくいきませんでした';
// セーブのあと：遊んでいる間は40秒に1回まで、メニューを開いた・やめたときはすぐ
function clAfterSave(now){if(!CLOUD.key||CL.bad||CL.conf)return;const t=performance.now();clearTimeout(CL.tm);
  if(now||STATE!=='play'||t-CL.last>=40000)clSync();else CL.tm=setTimeout(()=>clAfterSave(),40000-(t-CL.last))}
function clSync(){if(CL.queued)return CL.qp;CL.queued=true;CL.last=performance.now();return CL.qp=clRun(()=>{CL.queued=false;return clDo()})}   // まだ始まっていない上書きは1つにまとめる
async function clDo(){if(CL.bad||CL.conf)return;try{const save=loadSave();if(!save||!save.cloud)return;const r=await clPut(save.cloud,save,save.cloudS);clMark(r.s);
    if(!CL.said){CL.said=true;toast('ずっと使えるコード '+clShow(save.cloud)+' を最新にしました（このあともセーブのたびに上書きします）')}}
  catch(e){if(e&&e.code==='conflict'){CL.conf=true;toast('ずっと使えるコードは別の場所で新しくなっています。この端末のぶんでは上書きしません')}
    else if(e&&(e.code==='invalid_argument'||e.code==='not_granted'||e.code==='permission_denied'||e.code==='quota_exceeded'||e.message===clNoDb)){CL.bad=true;toast('ずっと使えるコードに上書きできません：'+clErr(e))}}}
// コードを読みこむ（ずっと使えるコードなら、つないだまま）
async function clLoad(key){const {code,h}=await clGet(key);const o=await unpackCode(code);if(!validSave(o))throw new Error('中身が読めませんでした');o.cloud=key;o.cloudS=h.s;CL.conf=false;CL.bad=false;CL.said=true;return o}
