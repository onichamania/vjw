// ================= ガジェット・スターパワー・ギア・ハイパーチャージ（キャラごとに買って装備） =================
const kitOwn=id=>{if(ADMIN)return{gad:[0,1],sp:[0,1],hyper:true};const o=J('gr-ko-'+id,{gad:[],sp:[],hyper:false});o.gad=o.gad||[];o.sp=o.sp||[];return o},kitEq=id=>J('gr-ke-'+id,{gad:-1,sp:-1});
// バフィー：買うと自動で装備（本家と同じく3つ全部つけられる）。最初の1つは無料。本家でバフィーがあるキャラだけ
const bufOwn=id=>ADMIN?{gad:true,sp:true,hyper:true}:J('gr-bf-'+id,{gad:false,sp:false,hyper:false}),bufFree=()=>!LS('gr-bffree','');
function myKit(id){const o=kitOwn(id),e=kitEq(id),lv=level(id),bo=bufOwn(id);
  const k={gad:lv>=KITLV.gad&&o.gad.includes(e.gad)?e.gad:-1,sp:lv>=KITLV.sp&&o.sp.includes(e.sp)?e.sp:-1,gears:[],hyper:lv>=KITLV.hyper&&o.hyper};
  k.buf=BUF[id]?{gad:bo.gad&&k.gad>=0,sp:bo.sp&&k.sp>=0,hyper:bo.hyper&&k.hyper}:{};return k}
// 買う・装備する（本家と同じ値段：ガジェット1000・スターパワー2000・ハイパーチャージ5000コイン）
function kitAct(id,kind,key){const o=kitOwn(id),e=kitEq(id),lv=level(id);
  if(kind==='hyper'){if(o.hyper)return;if(lv<KITLV.hyper){note('パワー'+KITLV.hyper+'で買えます',1.8);return}if(coins()<KITCOST.hyper){note('コインが足りません',1.5);return}addCoins(-KITCOST.hyper);o.hyper=true;try{fxSlam('ハイパーチャージ！','#ff6fe0',BT[id].name)}catch(x){}}
  else{const need=kind==='gad'?KITLV.gad:KITLV.sp,cost=kind==='gad'?KITCOST.gad:KITCOST.sp,list=o[kind];
    if(!list.includes(key)){if(lv<need){note('パワー'+need+'で買えます',1.8);return}if(coins()<cost){note('コインが足りません',1.5);return}addCoins(-cost);list.push(key);try{fxSlam(kind==='gad'?'ガジェット！':'スターパワー！',kind==='gad'?'#3fdc5a':'#ffb514',BT[id].gad&&(kind==='gad'?BT[id].gad[key].name:BT[id].sp[key].name))}catch(x){}}e[kind]=key}
  if(!ADMIN)JS('gr-ko-'+id,o);JS('gr-ke-'+id,e);SFX.gem();drawChar()}
// ---- 前のバージョンのセーブを新しいキャラへ移す ----
(function migrate(){if(LS('gr-mig3',''))return;const map={hinata:'jack',momo:'goro',ren:'kachiko',gantetsu:'piko',kohaku:'kagerou',hikari:'ranran',jin:'vlad',fubuki:'soda'};
  for(const [o,n] of Object.entries(map))for(const k of['gr-tr-','gr-lv-','gr-sk-','gr-skin-']){const v=LS(k+o,null);if(v!=null&&LS(k+n,null)==null)LSset(k+n,v)}
  const own=J('gr-own',null);if(own)JS('gr-own',own.map(x=>map[x]||x).filter(x=>BT[x]));const p=LS('gr-pick','');if(map[p])LSset('gr-pick',map[p]);LSset('gr-mig3','1')})();

// ---- データを全部リセット（このバージョンで一度だけ自動で行う） ----
function resetAll(){const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('gr-'))ks.push(k)}for(const k of ks)localStorage.removeItem(k)}
try{if(LS('gr-ver','')!=='6'){resetAll();LSset('gr-ver','6')}}catch(e){}

