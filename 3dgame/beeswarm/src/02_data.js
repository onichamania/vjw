// ===================== ゲームのデータ（Bee Swarm Simulator Wiki の数値どおり） =====================
// 座標の単位は「花1マス」（本家の4スタッド）。x=東、z=北（ハイブの前が南＝マイナス）
const TS=1;
// ---- フィールド ----
// w×h=花の数（本家どおり）、c=白赤青の割合、s=1段/2段/3段の割合、zone=必要なハチの数、y=高さ
const FIELDS={
 sunflower:{jp:'ヒマワリ畑',w:20,h:33,c:[.7,.15,.15],s:[.9,.1,0],zone:0,x:8,z:-45,y:0,fc:'w',mobs:[],drop:[['sunflowerseed',.012]],deco:'sunflower'},
 dandelion:{jp:'タンポポ畑',w:36,h:18,c:[.85,.05,.1],s:[.85,.15,0],zone:0,x:-40,z:-28,y:0,fc:'w',mobs:[],drop:[['treat',.01],['glue',.0003],['glitter',.0002]],deco:'dandelion'},
 mushroom:{jp:'キノコ畑',w:32,h:23,c:[.3,.7,0],s:[.9,.1,0],zone:0,x:-26,z:-58,y:0,fc:'r',mobs:[['ladybug',2,1,1]],drop:[['strawberry',.006],['treat',.008],['bitterberry',.0004]],deco:'mushroom'},
 blueflower:{jp:'青い花畑',w:43,h:17,c:[.3,0,.7],s:[.9,.1,0],zone:0,x:-90,z:-62,y:0,fc:'b',mobs:[['rhino',2,1,1]],drop:[['blueberry',.006],['blueextract',.0003]],deco:'blueflower'},
 clover:{jp:'クローバー畑',w:29,h:26,c:[.334,.333,.333],s:[.5,.5,0],zone:0,x:-104,z:-34,y:0,fc:'m',mobs:[['ladybug',1,1,2],['rhino',1,1,2]],drop:[['treat',.008],['silveregg',.00005]],deco:'clover'},
 strawberry:{jp:'イチゴ畑',w:22,h:26,c:[.25,.75,0],s:[.2,.75,.05],zone:5,x:-4,z:-90,y:8,fc:'r',mobs:[['ladybug',2,3,3]],drop:[['strawberry',.012]],deco:'strawberry'},
 spider:{jp:'クモ畑',w:28,h:26,c:[1,0,0],s:[.1,.8,.1],zone:5,x:-38,z:-90,y:8,fc:'w',mobs:[['spider',1,4,4]],drop:[['treat',.006]],deco:'spider'},
 bamboo:{jp:'竹畑',w:39,h:18,c:[.25,0,.75],s:[.2,.75,.05],zone:5,x:-80,z:-94,y:8,fc:'b',mobs:[['rhino',2,3,3]],drop:[['blueberry',.008]],deco:'bamboo'},
 pineapple:{jp:'パイナップル畑',w:33,h:23,c:[.9,.05,.05],s:[.2,.5,.3],zone:10,x:-114,z:-138,y:16,fc:'w',mobs:[['mantis',1,4,4],['rhino',2,5,5]],drop:[['pineapple',.012]],deco:'pineapple'},
 stump:{jp:'切り株畑',w:27,h:27,round:1,c:[.18,.07,.75],s:[0,0,1],zone:10,x:-152,z:-130,y:16,fc:'b',mobs:[],boss:'stumpsnail',drop:[['glue',.0005]],deco:'stump'},
 cactus:{jp:'サボテン畑',w:33,h:18,c:[.3,.35,.35],s:[0,.5,.5],zone:15,x:6,z:-122,y:24,fc:'m',mobs:[['werewolf',1,7,7]],drop:[['treat',.006]],deco:'cactus'},
 pumpkin:{jp:'カボチャ畑',w:33,h:17,c:[.6,.2,.2],s:[0,.3,.7],zone:15,x:6,z:-141,y:24,fc:'w',mobs:[['werewolf',1,7,7]],drop:[['treat',.006]],deco:'pumpkin'},
 pinetree:{jp:'松の森',w:31,h:23,c:[.15,0,.85],s:[.05,.45,.5],zone:15,x:44,z:-138,y:24,fc:'b',mobs:[['mantis',2,5,6]],drop:[['blueberry',.008]],deco:'pinetree'},
 rose:{jp:'バラ畑',w:31,h:20,c:[.15,.85,0],s:[.05,.45,.5],zone:15,x:40,z:-60,y:24,fc:'r',mobs:[['scorpion',2,5,6]],drop:[['strawberry',.008]],deco:'rose'},
 mountaintop:{jp:'山頂の畑',w:24,h:28,c:[0,.5,.5],s:[0,0,1],zone:25,x:-70,z:-178,y:48,fc:'m',mobs:[],boss:'mondochick',drop:[['treat',.006],['mooncharm',.0006]],deco:'mountain'},
 pepper:{jp:'トウガラシ畑',w:27,h:21,c:[.15,.85,0],s:[0,0,1],zone:35,x:98,z:74,y:14,fc:'r',mobs:[],drop:[['strawberry',.006]],deco:'pepper'},
 coconut:{jp:'ココナッツ畑',w:30,h:21,c:[.88,.08,.04],s:[0,0,1],zone:35,x:36,z:51,y:6,fc:'w',mobs:[],boss:'coconutcrab',drop:[['coconut',.01]],deco:'coconut'},
 ant:{jp:'アリ畑',w:32,h:12,c:[.5,.25,.25],s:[1,0,0],zone:20,x:-90,z:24,y:0,fc:'m',mobs:[],drop:[],deco:'ant'}};
const FIELD_IDS=Object.keys(FIELDS);
const FLOWER_POLLEN=[0,30,45,60,75,90];   // 1段〜星の花がためられる花粉
// ---- 道具（tools） ----
// pat: line=前に一列 / single=前の1マス / sq=まわり3×3 / dia=ひし形 / circ=まるく / ring=輪 / rect=前に四角 / top3=近くのいちばん高い3つ
const TOOLS={
 scooper:{jp:'スクーパー',shop:'noob',price:0,pat:['line',2],amt:2,t:.8,d:'前の2マスから2花粉ずつ（0.8秒）'},
 rake:{jp:'レーキ',shop:'noob',price:800,pat:['line',3],amt:2,t:.7,d:'前の3マスから2花粉ずつ（0.7秒）'},
 clippers:{jp:'クリッパー',shop:'noob',price:2200,pat:['single',1],amt:9,t:.6,d:'前の1マスから9花粉（0.6秒）'},
 magnet:{jp:'マグネット',shop:'noob',price:5500,pat:['sq',9],amt:2,t:.8,d:'まわり9マスから2花粉ずつ（0.8秒）'},
 vacuum:{jp:'バキューム',shop:'noob',price:14000,pat:['dia',13],amt:2,t:.8,d:'まわり13マスから2花粉ずつ（0.8秒）'},
 superscooper:{jp:'スーパースクーパー',shop:'pro',price:40000,pat:['line',5],amt:4,t:.5,d:'前の5マスから4花粉ずつ（0.5秒）'},
 pulsar:{jp:'パルサー',shop:'pro',price:125000,pat:['circ',29],amt:2,t:1,d:'まわり29マスから2花粉ずつ（1秒）'},
 electromagnet:{jp:'エレクトロマグネット',shop:'pro',price:300000,pat:['sq',9],amt:4,t:.5,d:'まわり9マスから4花粉ずつ（0.5秒）'},
 scissors:{jp:'シザース',shop:'pro',price:850000,pat:['single',1],amt:'all',t:.5,d:'前の1マスの花粉を全部（0.5秒）'},
 honeydipper:{jp:'ハニーディッパー',shop:'pro',price:1500000,pat:['circ',49],amt:2,t:.9,d:'まわり49マスから2花粉ずつ（0.9秒）'},
 bubblewand:{jp:'バブルワンド',shop:'bluehq',price:3500000,pat:['ring',16],amt:6,t:.8,col:{b:2},sp:'bubble',d:'輪の16マスから6花粉ずつ（0.8秒）。青い花は2倍。10回ごとにシャボン玉'},
 scythe:{jp:'サイス',shop:'redhq',price:3500000,pat:['line',7],amt:7,t:.47,col:{r:2},sp:'flame',d:'前の7マスから7花粉ずつ（0.47秒）。赤い花は2倍。20回ごとに炎'},
 goldenrake:{jp:'ゴールデンレーキ',shop:'mtn',price:20000000,pat:['rect',4,4],amt:7,t:.75,sp:'super5',d:'前の4列×4マスから7花粉ずつ（0.75秒）。5回ごとに4列×12マスまで届く'},
 sparkstaff:{jp:'スパークスタッフ',shop:'mtn',price:60000000,pat:['top3',81],amt:'all',t:.6,col:{w:1.2,r:1.2,b:1.2},d:'近くのいちばん花粉が多い3つの花から全部（+20%・0.6秒）'},
 porcelaindipper:{jp:'ポーセリンディッパー',shop:'mtn',price:150000000,pat:['circ',49],amt:3,t:.7,col:{w:1.5},sp:'pillar',d:'まわり49マスから3花粉ずつ（0.7秒）。白い花粉+50%。10回ごとに光の柱'},
 petalwand:{jp:'ペタルワンド',shop:'petal',price:1500000000,items:{spiritpetal:1,starjelly:10,glitter:25,enzymes:75},pat:['circ',37],amt:6,t:.7,col:{w:2,r:2,b:2},sp:'shuriken',d:'まわり37マスから6花粉ずつ（花粉2倍・0.7秒）。3回ごとに手裏剣でハチがすぐにハチミツにする'},
 tidepopper:{jp:'タイドポッパー',shop:'bluehq',price:2500000000000,items:{blueextract:1500,stinger:150,tropicaldrink:150,swirledwax:75,supersmoothie:50,comfortingvial:3},need:'giftedbucko250',pat:['dia',22],amt:5,t:1,col:{w:1.2,b:2.5},sp:'wave',d:'22マスから5花粉（白1.2倍・青2.5倍）。3回ごとに波'},
 darkscythe:{jp:'ダークサイス',shop:'redhq',price:2500000000000,items:{redextract:1500,stinger:200,hardwax:100,causticwax:50,supersmoothie:50,invigoratingvial:3},need:'giftedriley250',pat:['circ',35],amt:13,t:.5,d:'まわり35マスから13花粉（0.5秒）'},
 gummyballer:{jp:'グミボーラー',shop:'gummy',price:10000000000000,items:{glue:1500,gumdrops:2000,causticwax:50,supersmoothie:50,turpentine:5,satisfyingvial:3},pat:['circ',29],amt:9,t:1,col:{w:2.5,r:2.5,b:2.5},d:'まわり29マスから9花粉（2.5倍・1秒）'}};
// ---- カバン ----
const BAGS={
 pouch:{jp:'ポーチ',shop:'noob',price:0,st:{cap:200},d:'小さなカバン'},
 jar:{jp:'ジャー',shop:'noob',price:650,st:{cap:750},d:'じょうぶなプラスチックのびん'},
 backpack:{jp:'バックパック',shop:'noob',price:5500,st:{cap:3500},d:'がんじょうなリュック'},
 canister:{jp:'キャニスター',shop:'noob',price:22000,st:{cap:10000,conv:30},d:'ハチミツにするのが速くなる'},
 megajug:{jp:'メガジャグ',shop:'pro',price:50000,st:{cap:25000,conv:40},d:'とても大きなかめ'},
 compressor:{jp:'コンプレッサー',shop:'pro',price:160000,st:{cap:50000,conv:55},d:'花粉をおしこめる機械'},
 elitebarrel:{jp:'エリートバレル',shop:'pro',price:650000,st:{cap:125000,conv:70},d:'世界一すすんだたる'},
 portohive:{jp:'ポートオーハイブ',shop:'pro',price:1250000,st:{cap:250000,conv:100,ic:5},d:'背負える小さなハイブ。少しの花粉をすぐハチミツにする'},
 blueportohive:{jp:'青いポートオーハイブ',shop:'bluehq',price:12500000,items:{blueextract:2,softwax:2},st:{cap:400000,conv:150,icB:10,blue:10,atkB:1},d:'青くぬったポートオーハイブ'},
 redportohive:{jp:'赤いポートオーハイブ',shop:'redhq',price:12500000,items:{redextract:2,softwax:2},st:{cap:375000,conv:150,icR:10,red:10,atkR:1},d:'赤くぬったポートオーハイブ'},
 porcelainportohive:{jp:'ポーセリンポートオーハイブ',shop:'mtn',price:250000000,items:{glitter:3,softwax:3,mooncharm:10},st:{cap:500000,conv:250,ic:10,white:50,red:10,blue:10,atk:1},d:'白い花粉をふやす、めずらしいポートオーハイブ'},
 coconutcanister:{jp:'ココナッツキャニスター',shop:'coconut',price:25000000000,items:{coconut:250,tropicaldrink:150,redextract:150,blueextract:150,refreshingvial:2},st:{cap:1000000,capMul:1.25,conv:400,hiveMul:1.5,ic:10,icW:10,white:100},d:'背中のココナッツがピンチから守る'}};
// ---- 装備（帽子・ベルト・ブーツ・肩当て・グライダー） ----
const GEAR={
 helmet:{jp:'ヘルメット',slot:'hat',shop:'noob',price:30000,items:{pineapple:5,mooncharm:1},st:{pollen:10,def:25},d:'花粉がふえて、頭も守れる'},
 propellerhat:{jp:'プロペラハット',slot:'hat',shop:'pro',price:2500000,items:{gumdrops:25,pineapple:100,mooncharm:5},st:{pollen:15,ability:5,jump:10},d:'日よけにもなる楽しい帽子'},
 beekeepermask:{jp:'ビーキーパーマスク',slot:'hat',shop:'mtn',price:20000000,items:{enzymes:5,glue:3,glitter:1},st:{pollen:20,beeGather:20,ability:10,def:25},d:'本物の養蜂家だけがかぶるベール'},
 bubblemask:{jp:'バブルマスク',slot:'hat',shop:'bluehq',price:100000000,items:{blueextract:50,blueberry:500,oil:25,glitter:15},st:{blueMul:1.5,icB:15,capMul:1.5,bubbleMul:2,def:30,ability:15},d:'海の力で青い花粉集めを強くする'},
 firemask:{jp:'ファイアマスク',slot:'hat',shop:'redhq',price:100000000,items:{strawberry:500,redextract:50,enzymes:25,glue:15},st:{redMul:1.5,icR:15,capMul:1.5,icFlame:50,atkRpct:15,def:35,ability:15},d:'心に火をつけて赤いハチを強くする'},
 honeymask:{jp:'ハニーマスク',slot:'hat',shop:'guild',price:100000000,items:{treat:9999,oil:50,enzymes:25,goldegg:5},st:{pollen:25,beeGather:25,capMul:1.25,hft:50,convAmt:80,def:30,ability:15},d:'かぶるだけで満たされる、すてきなマスク'},
 demonmask:{jp:'デーモンマスク',slot:'hat',shop:'demon',price:5000000000,items:{stinger:500,redextract:250,enzymes:150,glue:100,invigoratingvial:1},st:{redMul:1.5,pollen:25,capMul:1.5,icR:20,icFlame:50,atkPct:25,def:35,ability:20},d:'悪魔の力が宿ったマスク'},
 diamondmask:{jp:'ダイヤモンドマスク',slot:'hat',shop:'diamond',price:5000000000,items:{blueextract:250,oil:150,glitter:100,diamondegg:5,comfortingvial:1},st:{blueMul:1.5,icB:15,pollen:25,capMul:3,bubbleMul:1.5,def:35,ability:20},d:'ダイヤモンドでできたマスク'},
 gummymask:{jp:'グミマスク',slot:'hat',shop:'gummy',price:5000000000,items:{glue:250,enzymes:100,oil:100,glitter:100,satisfyingvial:1},st:{whiteMul:1.25,pollen:25,capMul:1.5,def:30,ability:20},d:'グミ兵のマスク'},
 beltpocket:{jp:'ベルトポケット',slot:'belt',shop:'noob',price:14000,items:{sunflowerseed:10},st:{cap:5000,convAmt:10,loot:25},d:'こしにつけてカバンを大きくする'},
 beltbag:{jp:'ベルトバッグ',slot:'belt',shop:'pro',price:440000,items:{pineapple:50,sunflowerseed:50,stinger:3},st:{cap:25000,convAmt:20,loot:50},d:'さっと取り出せる便利なポーチ'},
 mondobeltbag:{jp:'モンドベルトバッグ',slot:'belt',shop:'mtn',price:12400000,items:{pineapple:150,sunflowerseed:150,stinger:10,softwax:1},st:{cap:100000,convAmt:50,loot:75,bomb:10,atkW:1},d:'遠い国から来たかざりのベルトバッグ'},
 honeycombbelt:{jp:'ハニカムベルト',slot:'belt',shop:'guild',price:75000000,items:{enzymes:50,glue:50,oil:25},st:{cap:150000,capMul:1.25,convAmt:75,loot:100,bomb:20,hft:50,atkW:1},d:'ハチの巣の形のぜいたくなベルト'},
 petalbelt:{jp:'ペタルベルト',slot:'belt',shop:'petal',price:15000000000,items:{starjelly:25,glitter:50,glue:100,spiritpetal:1},st:{cap:250000,capMul:1.5,convAmt:100,loot:100,hft:75,bomb:25,atkW:1},d:'花びらのベルト'},
 coconutbelt:{jp:'ココナッツベルト',slot:'belt',shop:'coconut',price:50000000000,items:{coconut:500,tropicaldrink:1500,purplepotion:200,hardwax:200,turpentine:3,refreshingvial:3},st:{cap:350000,capMul:1.75,convAmt:120,loot:102,hft:100,atk:1},d:'ココナッツのカマーバンド'},
 basicboots:{jp:'ベーシックブーツ',slot:'boots',shop:'noob',price:4400,items:{sunflowerseed:3,blueberry:3},st:{ms:5,moveColl:2},d:'花の上を歩くと花粉が集まる'},
 hikingboots:{jp:'ハイキングブーツ',slot:'boots',shop:'pro',price:2200000,items:{blueberry:50,strawberry:50},st:{ms:6,jump:10,moveColl:6},d:'山を歩くのに便利なブーツ'},
 beekeeperboots:{jp:'ビーキーパーブーツ',slot:'boots',shop:'mtn',price:15000000,items:{oil:5,blueextract:3,redextract:3},st:{beeGather:27,ms:8,jump:20,moveColl:10,atk:1},d:'実用的でおしゃれなブーツ'},
 coconutclogs:{jp:'ココナッツクロッグ',slot:'boots',shop:'coconut',price:10000000000,items:{coconut:150,tropicaldrink:50,glue:100,oil:100,refreshingvial:1},st:{pollen:15,hft:25,atk:2,ms:7,jump:22,moveColl:14},d:'ココナッツをけってスピードアップ'},
 gummyboots:{jp:'グミブーツ',slot:'boots',shop:'gummy',price:10000000000,items:{glue:500,glitter:250,redextract:250,blueextract:250,satisfyingvial:1,motivatingvial:1},st:{pollen:20,atk:3,hft:50,ms:8,jump:22,moveColl:16},d:'歩いたあとにグーが残るブーツ'},
 braveguard:{jp:'ブレイブガード',slot:'rg',shop:'pro',price:300000,items:{stinger:3},st:{cap:15000,white:5,atkW:1},d:'ブレイブビーが作った右の肩当て'},
 hastyguard:{jp:'ヘイスティガード',slot:'rg',shop:'pro',price:300000,items:{mooncharm:5},st:{cap:15000,beeMs:1,msMul:1.1},d:'ヘイスティビーが作った右の肩当て'},
 blueguard:{jp:'ブルーガード',slot:'rg',shop:'bluehq',price:1000000,items:{blueberry:50,royaljelly:1,mooncharm:3},st:{cap:25000,blue:15,def:5,atkB:1},d:'青の養蜂家の右の肩当て'},
 eliteblueguard:{jp:'エリートブルーガード',slot:'rg',shop:'bluehq',price:5000000,items:{blueextract:3,blueberry:50,royaljelly:5,mooncharm:15},st:{cap:75000,blue:25,def:7,critPow:50,atkB:1},d:'いちばん熱心な青の養蜂家のためのガード'},
 buckoguard:{jp:'バッコガード',slot:'rg',shop:'bluehq',price:30000000,items:{blueextract:10,blueberry:100,glue:5,mooncharm:75},st:{cap:150000,blue:35,def:10,critPow:75,atkB:2},d:'青いハチのリーダーがきたえた防具'},
 cobaltguard:{jp:'コバルトガード',slot:'rg',shop:'guild',price:200000000,items:{blueextract:100,stinger:100,enzymes:50,glitter:25},st:{cap:250000,blue:50,blueBomb:20,atkB:3,def:10,critPow:100},d:'コバルトビーの力が宿ったガード'},
 bomberguard:{jp:'ボンバーガード',slot:'lg',shop:'pro',price:300000,items:{sunflowerseed:25},st:{cap:15000,white:5,bomb:15},d:'ボンバービーが作った左の肩当て'},
 lookerguard:{jp:'ルッカーガード',slot:'lg',shop:'pro',price:300000,items:{sunflowerseed:25},st:{cap:15000,crit:1,critPow:25},d:'ルッカービーが作った左の肩当て'},
 redguard:{jp:'レッドガード',slot:'lg',shop:'redhq',price:750000,items:{strawberry:50,royaljelly:1,stinger:1},st:{cap:25000,red:10,def:5,atkR:1},d:'赤の養蜂家の左の肩当て'},
 eliteredguard:{jp:'エリートレッドガード',slot:'lg',shop:'redhq',price:5000000,items:{redextract:3,strawberry:50,royaljelly:5,stinger:5},st:{cap:75000,red:25,def:7,crit:5,atkR:1},d:'いちばん熱心な赤の養蜂家のためのガード'},
 rileyguard:{jp:'ライリーガード',slot:'lg',shop:'redhq',price:30000000,items:{redextract:10,strawberry:100,glue:5,stinger:25},st:{cap:150000,red:35,def:10,crit:8,atkR:2},d:'赤いハチのリーダーがきたえた防具'},
 crimsonguard:{jp:'クリムゾンガード',slot:'lg',shop:'guild',price:200000000,items:{redextract:100,stinger:100,oil:50,glitter:25},st:{cap:250000,red:50,redBomb:20,atkR:3,def:10,crit:10},d:'クリムゾンビーの力が宿ったガード'},
 parachute:{jp:'パラシュート',slot:'glide',shop:'pro',price:500000,st:{glide:1},d:'空中でジャンプを押すと開いて、ゆっくりおりられる'},
 glider:{jp:'グライダー',slot:'glide',shop:'mtn',price:5000000,st:{glide:2},d:'パラシュートよりずっと速く空を飛べる'}};
const SLOTS={tool:'道具',bag:'カバン',hat:'帽子・マスク',belt:'ベルト',boots:'ブーツ',lg:'左の肩当て',rg:'右の肩当て',glide:'グライダー'};
// ---- アイテム ----
const ITEMS={
 ticket:{jp:'チケット',ic:'🎟️',d:'いろいろなお店で使える'},
 treat:{jp:'おやつ',ic:'🍪',d:'ハチにあげるときずなが10ふえる',bond:10},
 sunflowerseed:{jp:'ヒマワリの種',ic:'🌻',d:'きずな+25（好物ならもっと）',bond:25},
 strawberry:{jp:'イチゴ',ic:'🍓',d:'きずな+25（好物ならもっと）',bond:25},
 pineapple:{jp:'パイナップル',ic:'🍍',d:'きずな+25（好物ならもっと）',bond:25},
 blueberry:{jp:'ブルーベリー',ic:'🫐',d:'きずな+25（好物ならもっと）',bond:25},
 bitterberry:{jp:'ビターベリー',ic:'🍇',d:'きずな+100',bond:100},
 neonberry:{jp:'ネオンベリー',ic:'💚',d:'きずな+500',bond:500},
 mooncharm:{jp:'ムーンチャーム',ic:'🌙',d:'きずな+250',bond:250},
 startreat:{jp:'スタートリート',ic:'🌟',d:'きずな+1000。ハチをギフテッドにする',bond:1000,gift:1},
 atomictreat:{jp:'アトミックトリート',ic:'⚛️',d:'きずな+1000',bond:1000},
 royaljelly:{jp:'ロイヤルゼリー',ic:'👑',d:'ハチの種類をランダムに変える（レベルはそのまま）',jelly:1},
 starjelly:{jp:'スタージェリー',ic:'✨',d:'ハチをランダムなギフテッドのハチに変える',jelly:2},
 basicegg:{jp:'ベーシックエッグ',ic:'🥚',d:'ほとんどベーシックビー（87%）。レア10%・エピック2.5%・レジェンダリー0.5%',egg:'basic'},
 silveregg:{jp:'シルバーエッグ',ic:'🥈',d:'レア64.9%・エピック30%・レジェンダリー5%・ミシック0.1%',egg:'silver'},
 goldegg:{jp:'ゴールドエッグ',ic:'🥇',d:'エピック79%・レジェンダリー20%・ミシック1%',egg:'gold'},
 diamondegg:{jp:'ダイヤモンドエッグ',ic:'💎',d:'レジェンダリー95%・ミシック5%',egg:'diamond'},
 mythicegg:{jp:'ミシックエッグ',ic:'🔮',d:'かならずミシックのハチ',egg:'mythic'},
 staregg:{jp:'スターエッグ',ic:'⭐',d:'かならずギフテッドのハチ（レジェンダリー以上が出やすい）',egg:'star'},
 giftedsilveregg:{jp:'ギフテッドシルバーエッグ',ic:'🥈',d:'シルバーエッグと同じで、かならずギフテッド',egg:'silver',g:1},
 giftedgoldegg:{jp:'ギフテッドゴールドエッグ',ic:'🥇',d:'ゴールドエッグと同じで、かならずギフテッド',egg:'gold',g:1},
 gifteddiamondegg:{jp:'ギフテッドダイヤモンドエッグ',ic:'💎',d:'ダイヤモンドエッグと同じで、かならずギフテッド',egg:'diamond',g:1},
 puppyegg:{jp:'パピービーの卵',ic:'🐶',d:'パピービーが生まれる',egg:'=puppy'},
 photonegg:{jp:'フォトンビーの卵',ic:'💡',d:'フォトンビーが生まれる',egg:'=photon'},
 tabbyegg:{jp:'タビービーの卵',ic:'🐱',d:'タビービーが生まれる',egg:'=tabby'},
 festiveegg:{jp:'フェスティブビーの卵',ic:'🎁',d:'フェスティブビーが生まれる',egg:'=festive'},
 crimsonegg:{jp:'クリムゾンビーの卵',ic:'🟥',d:'クリムゾンビーが生まれる',egg:'=crimson'},
 cobaltegg:{jp:'コバルトビーの卵',ic:'🟦',d:'コバルトビーが生まれる',egg:'=cobalt'},
 gummyegg:{jp:'グミビーの卵',ic:'🍬',d:'グミビーが生まれる',egg:'=gummy'},
 bearegg:{jp:'ベアビーの卵',ic:'🐻',d:'ベアビーが生まれる',egg:'=bear'},
 raseggs:{jp:'ラスカルビーの卵',ic:'🐝',d:'ラスカルビーが生まれる',egg:'=rascal'},
 bumbleegg:{jp:'バンブルビーの卵',ic:'🐝',d:'バンブルビーが生まれる',egg:'=bumble'},
 gumdrops:{jp:'ガムドロップ',ic:'🍬',d:'フィールドで使うと花にグーがつく（グーをとるとハチミツ）',use:'gumdrop'},
 stinger:{jp:'スティンガー',ic:'🗡️',d:'30秒間ハチの攻撃力1.5倍',use:'stinger'},
 magicbean:{jp:'マジックビーン',ic:'🫘',d:'グリッターの材料'},
 redextract:{jp:'赤エキス',ic:'🔴',d:'10分間 赤い花粉1.25倍',use:'redextract'},
 blueextract:{jp:'青エキス',ic:'🔵',d:'10分間 青い花粉1.25倍',use:'blueextract'},
 enzymes:{jp:'エンザイム',ic:'🧪',d:'10分間 変換速度1.25倍・すぐ変換10%',use:'enzymes'},
 oil:{jp:'オイル',ic:'🛢️',d:'10分間 自分とハチの速さ1.2倍',use:'oil'},
 glue:{jp:'グルー',ic:'🧴',d:'10分間 ハチと道具の花粉1.25倍',use:'glue'},
 glitter:{jp:'グリッター',ic:'💫',d:'いるフィールドの花粉+100%（15分）',use:'glitter'},
 tropicaldrink:{jp:'トロピカルドリンク',ic:'🍹',d:'10分間 白い花粉1.25倍・すぐ変換10%・会心+5%',use:'tropical'},
 purplepotion:{jp:'パープルポーション',ic:'🧉',d:'15分間 容量1.25倍・赤青1.5倍・ハチと道具1.3倍',use:'purple'},
 supersmoothie:{jp:'スーパースムージー',ic:'🥤',d:'20分間 いろいろ大きく強化',use:'smoothie'},
 coconut:{jp:'ココナッツ',ic:'🥥',d:'トロピカルドリンクの材料'},
 softwax:{jp:'ソフトワックス',ic:'🕯️',d:'クラフトの材料'},
 hardwax:{jp:'ハードワックス',ic:'🧱',d:'クラフトの材料'},
 swirledwax:{jp:'スワールドワックス',ic:'🌀',d:'クラフトの材料'},
 causticwax:{jp:'コースティックワックス',ic:'☣️',d:'クラフトの材料'},
 turpentine:{jp:'ターペンタイン',ic:'🫙',d:'クラフトの材料'},
 fielddice:{jp:'フィールドダイス',ic:'🎲',d:'ランダムなフィールドの花粉+100%（15分）',use:'dice'},
 smoothdice:{jp:'スムースダイス',ic:'🎲',d:'えらんだ色のフィールドを強化',use:'dice'},
 loadeddice:{jp:'ロードダイス',ic:'🎲',d:'えらんだフィールドを強化',use:'dice'},
 microconverter:{jp:'マイクロコンバーター',ic:'🔋',d:'カバンの花粉を全部すぐハチミツにする',use:'micro'},
 honeysuckle:{jp:'ハニーサックル',ic:'🌼',d:'カバンの花粉の一部をハチミツにする',use:'suckle'},
 whirligig:{jp:'ワーリギグ',ic:'🎐',d:'ハイブにワープする',use:'whirl'},
 nightbell:{jp:'ナイトベル',ic:'🔔',d:'夜にする（未実装）'},
 jellybeans:{jp:'ジェリービーンズ',ic:'🫘',d:'ランダムなバフ',use:'beans'},
 spiritpetal:{jp:'スピリットペタル',ic:'🌸',d:'スピリットベアのクエストで手に入る（この版では未実装）'},
 refreshingvial:{jp:'リフレッシングバイアル',ic:'🧪',d:'ネクターのびん（この版では手に入らない）'},
 comfortingvial:{jp:'コンフォーティングバイアル',ic:'🧪',d:'ネクターのびん（この版では手に入らない）'},
 invigoratingvial:{jp:'インビゴレイティングバイアル',ic:'🧪',d:'ネクターのびん（この版では手に入らない）'},
 satisfyingvial:{jp:'サティスファイングバイアル',ic:'🧪',d:'ネクターのびん（この版では手に入らない）'},
 motivatingvial:{jp:'モチベーティングバイアル',ic:'🧪',d:'ネクターのびん（この版では手に入らない）'}};
// ---- ハチの日本語の名前・好物・ギフテッドのボーナス ----
const BEE_JP={Basic:'ベーシックビー',Bomber:'ボンバービー',Brave:'ブレイブビー',Bumble:'バンブルビー',Cool:'クールビー',Hasty:'ヘイスティビー',Looker:'ルッカービー',Rad:'ラッドビー',Rascal:'ラスカルビー',Stubborn:'スタボーンビー',
 Bubble:'バブルビー',Bucko:'バッコビー',Commander:'コマンダービー',Demo:'デモビー',Exhausted:'エグゾーステッドビー',Fire:'ファイアビー',Frosty:'フロスティビー',Honey:'ハニービー',Rage:'レイジビー',Riley:'ライリービー',Shocked:'ショックドビー',
 Baby:'ベビービー',Carpenter:'カーペンタービー',Demon:'デーモンビー',Diamond:'ダイヤモンドビー',Lion:'ライオンビー',Music:'ミュージックビー',Ninja:'ニンジャビー',Shy:'シャイビー',
 Buoyant:'ブイアントビー',Fuzzy:'ファジービー',Precise:'プリサイスビー',Spicy:'スパイシービー',Tadpole:'タッドポールビー',Vector:'ベクタービー',
 Bear:'ベアビー',Cobalt:'コバルトビー',Crimson:'クリムゾンビー',Digital:'デジタルビー',Festive:'フェスティブビー',Gummy:'グミビー',Photon:'フォトンビー',Puppy:'パピービー',Tabby:'タビービー',Vicious:'ヴィシャスビー',Windy:'ウィンディビー'};
const FAV={sunflowerseed:['Basic','Bomber','Looker','Commander','Demo','Carpenter','Ninja','Precise','Vector'],strawberry:['Rad','Rascal','Stubborn','Rage','Riley','Baby','Shy','Spicy'],
 pineapple:['Brave','Hasty','Exhausted','Fire','Honey','Shocked','Demon','Lion','Fuzzy'],blueberry:['Bumble','Cool','Bubble','Bucko','Frosty','Diamond','Music','Buoyant','Tadpole']};
const GIFT_ST={Basic:{pollenMul:1.2},Bomber:{bombMul:1.1},Brave:{atk:1},Bumble:{capMul:1.1},Cool:{blueMul:1.1},Hasty:{msPct:15},Looker:{critPow:25},Rad:{redMul:1.1},Rascal:{redBombMul:1.25},Stubborn:{life:15},
 Bubble:{bubbleMul:1.25},Bucko:{capBlueF:20},Commander:{crit:3},Demo:{buzzMul:1.25},Exhausted:{capWhiteF:20},Fire:{flameMul:1.25},Frosty:{blueBombMul:1.25},Honey:{hftMul:1.5},Rage:{atkPct:10},Riley:{capRedF:20},Shocked:{whiteMul:1.1},
 Baby:{loot:25},Carpenter:{toolMul:1.25},Demon:{icBomb:20},Diamond:{convMul:1.2},Lion:{giftPollen:5},Music:{beeGather:25},Ninja:{beeMs:5},Shy:{abilityPollen:5},
 Buoyant:{capMul:1.2},Fuzzy:{bombPow:1.1},Precise:{scrit:3},Spicy:{flameDur:25},Tadpole:{bubbleDur:25},Vector:{markDur:15},
 Bear:{pollenMul:1.1},Cobalt:{icB:15},Crimson:{icR:15},Digital:{dup:1},Festive:{hiveMul:1.25},Gummy:{hpp:5},Photon:{ic:5},Puppy:{bondTreat:20},Tabby:{critPow:50},Vicious:{respawn:-15},Windy:{icW:15}};
const RARITY_JP={Common:'コモン',Rare:'レア',Epic:'エピック',Legendary:'レジェンダリー',Mythic:'ミシック',Event:'イベント'};
const RARITY_COL={Common:'#c8823c',Rare:'#e8e8e8',Epic:'#ffd84a',Legendary:'#7fe0ff',Mythic:'#c880ff',Event:'#6ae07a'};
// ---- 卵とロイヤルゼリーの確率 ----
const EGG_ODDS={basic:[['Common',87],['Rare',10],['Epic',2.5],['Legendary',.5]],silver:[['Rare',64.9],['Epic',30],['Legendary',5],['Mythic',.1]],
 gold:[['Epic',79],['Legendary',20],['Mythic',1]],diamond:[['Legendary',95],['Mythic',5]],mythic:[['Mythic',100]],star:[['Epic',40],['Legendary',50],['Mythic',10]]};
const JELLY_ODDS=[['Rare',70],['Epic',27],['Legendary',3],['Mythic',.004]];
// ---- きずなとレベル（そのレベルになるのに必要なきずな） ----
const BOND_LV=[0,0,10,40,200,750,4000,15000,60000,270000,450000,1200000,2000000,4000000,7000000,15000000,120000000,450000000,1900000000,7500000000,15000000000,475000000000,4.5e12,9.5e13,9e14,9e15];
// ---- 敵（mobs） ----
// hp=レベルごとの体力、resp=復活までの秒、drops=[アイテム,確率,数の候補]
const MOBS={
 ladybug:{jp:'テントウムシ',hp:{1:12,2:20,3:28},dmg:15,resp:300,honey:75,bond:5,bp:1,size:1,col:0xd8343a,
   drops:[['ticket',.02,[1,5,10]],['strawberry',.3,[1,5,10]],['gumdrops',.12,[1,5,10]],['treat',.3,[1,50]],['royaljelly',.015,[1]],['magicbean',.006,[1]],['redextract',.006,[1]],['fielddice',.006,[1]],['honeysuckle',.006,[1]],['bitterberry',.008,[1,5]],['neonberry',.002,[1]],['raseggs',.0003,[1]]]},
 rhino:{jp:'サイカブト',hp:{1:10,2:16,3:22,5:34},dmg:18,resp:300,honey:75,bond:5,bp:1,size:1.1,col:0x3a4a6a,
   drops:[['ticket',.02,[1,5,15]],['blueberry',.3,[1,5,10]],['gumdrops',.12,[1,5,10,25]],['treat',.3,[1,5,25]],['royaljelly',.015,[1]],['blueextract',.006,[1,3]],['whirligig',.006,[1]],['magicbean',.006,[1]],['microconverter',.006,[1]],['neonberry',.002,[1]],['bumbleegg',.0003,[1]]]},
 spider:{jp:'クモ',hp:{4:100},dmg:20,resp:1800,honey:1000,bond:40,bp:10,size:2,col:0x2b2b33,
   drops:[['ticket',.25,[1,3,5,10,25]],['bitterberry',.2,[1,3,5]],['gumdrops',.2,[5,10]],['royaljelly',.2,[1,5]],['treat',.3,[1,5,25]],['pineapple',.2,[1,3,33]],['fielddice',.05,[1,5]],['glue',.08,[1,3,5]],['enzymes',.08,[1,3,5]],['magicbean',.05,[1]],['stinger',.02,[1,3,5]],['starjelly',.004,[1]],['diamondegg',.0005,[1]],['goldegg',.002,[1]]]},
 mantis:{jp:'カマキリ',hp:{4:115,5:140,6:165},dmg:20,resp:1200,honey:250,bond:25,bp:5,size:1.6,col:0x5fbf3a,
   drops:[['ticket',.2,[1,3,5]],['blueberry',.25,[1,3,5,10,25]],['pineapple',.25,[1,3,5,10,25]],['treat',.3,[3,5,10,25]],['gumdrops',.15,[1,5,10]],['mooncharm',.03,[1]],['royaljelly',.08,[1,5]],['microconverter',.04,[1,5]],['smoothdice',.01,[1]],['neonberry',.02,[1]],['whirligig',.02,[1]],['oil',.02,[1,5]],['glitter',.02,[1]],['silveregg',.003,[1]]]},
 scorpion:{jp:'サソリ',hp:{5:170,6:200},dmg:25,resp:1200,honey:1000,bond:25,bp:5,size:1.5,col:0x7a2a40,
   drops:[['ticket',.13,[1,3,5]],['gumdrops',.15,[1,5,10,25]],['royaljelly',.08,[1,5]],['treat',.3,[1,5,10,25]],['strawberry',.3,[1,3,5,10,25]],['pineapple',.2,[1,3,5,10]],['stinger',.05,[1,3,5]],['redextract',.03,[1,3]],['fielddice',.04,[1,5]],['bitterberry',.08,[1,5]],['glitter',.015,[1]],['enzymes',.02,[1]],['goldegg',.002,[1]]]},
 werewolf:{jp:'オオカミ男',hp:{7:250},dmg:35,resp:3600,honey:5000,bond:75,bp:25,size:2.2,col:0x6a5a4a,
   drops:[['ticket',.5,[1,3,5,10,15,25]],['gumdrops',.3,[1,3,5,10,15]],['treat',.4,[5,10,50]],['sunflowerseed',.3,[5,10,50]],['pineapple',.3,[1,20]],['royaljelly',.3,[1,5,10]],['microconverter',.1,[1,5]],['glue',.1,[1,3,5]],['oil',.1,[1]],['starjelly',.01,[1]],['loadeddice',.004,[1]],['diamondegg',.001,[1]]]},
 kingbeetle:{jp:'キングビートル',hp:{7:2500},dmg:40,resp:86400,honey:1000000,bond:500,bp:150,size:4,col:0x2a3a8a,boss:1,
   drops:[['treat',1,[100]],['royaljelly',1,[1,3,5]],['ticket',1,[5,10,25]],['mooncharm',.8,[5,10,25]],['gumdrops',.5,[5,25,250]],['neonberry',.3,[1,5]],['redextract',.2,[1,3]],['blueextract',.2,[1,3]],['silveregg',.1,[1]],['goldegg',.05,[1]],['starjelly',.05,[1]]]},
 tunnelbear:{jp:'トンネルベア',hp:{9:10000},dmg:1000,resp:172800,honey:5000000,bond:1000,bp:200,size:5,col:0x3a2a1a,boss:1,
   drops:[['royaljelly',1,[5,10,20]],['ticket',1,[10,15,25]],['mooncharm',1,[20]],['starjelly',.15,[1]],['giftedsilveregg',.03,[1]],['giftedgoldegg',.015,[1]],['gifteddiamondegg',.005,[1]]]},
 stumpsnail:{jp:'切り株カタツムリ',hp:{6:30000000},dmg:30,resp:345600,honey:30000000,bond:2000,bp:500,size:7,col:0x9a7aa0,boss:1,saveHp:1,
   drops:[['glue',1,[1,10,100]],['starjelly',1,[1,5,10]],['ticket',.8,[50,100,250]],['glitter',.5,[1,5,10]],['oil',.5,[1,5]],['enzymes',.5,[1,5,10]],['royaljelly',.8,[10,100,1000]],['treat',.8,[25,1000,10000]],['magicbean',.4,[1,10,25]],['neonberry',.4,[1,10,100]],['goldegg',.1,[1]],['diamondegg',.08,[1]],['mythicegg',.01,[1]]]},
 coconutcrab:{jp:'ココナッツクラブ',hp:{12:250000},dmg:40,resp:129600,honey:0,bond:2500,bp:400,size:6,col:0xc85a2a,boss:1,
   drops:[['coconut',1,[25,50,100]],['microconverter',1,[5,10]],['tropicaldrink',1,[1,3,5]],['bitterberry',1,[25,50]],['starjelly',1,[1,3]],['glitter',.4,[1,5]],['oil',.4,[1,5]],['magicbean',.4,[1,5]],['glue',.4,[1,5]],['neonberry',.2,[1,5]],['silveregg',.03,[1]],['diamondegg',.02,[1]],['atomictreat',.02,[1]],['mythicegg',.004,[1]]]},
 mondochick:{jp:'モンドチック',hp:{8:300000},dmg:75,resp:3600,honey:20000,bond:0,bp:0,size:5,col:0xffe060,boss:1,
   drops:[['treat',1,[50,100,250]],['bitterberry',1,[10,25,50]],['neonberry',.8,[1,2]],['fielddice',.5,[1,3]],['microconverter',.5,[1,3,5]],['magicbean',.5,[1,3]],['starjelly',.1,[1]],['mythicegg',.003,[1]],['startreat',.0005,[1]]]}};
// ---- バフ ----
// per=1スタックの効果、max=最大スタック、dur=秒
const BUFFS={
 boost_r:{jp:'赤ブースト',ic:'🔴',max:10,dur:15,d:'赤い花粉×1.2（10スタックで×3）'},
 boost_b:{jp:'青ブースト',ic:'🔵',max:10,dur:15,d:'青い花粉×1.2（10スタックで×3）'},
 boost_w:{jp:'白ブースト',ic:'⚪',max:10,dur:15,d:'白い花粉×1.2（10スタックで×3）'},
 haste:{jp:'ヘイスト',ic:'💨',max:10,dur:20,d:'移動速度×1.1（10スタックで×2）'},
 focus:{jp:'フォーカス',ic:'🎯',max:10,dur:20,d:'会心率+3%（10スタックで+30%）'},
 melody:{jp:'メロディ',ic:'🎵',max:1,dur:30,d:'会心のダメージ+100%'},
 rage:{jp:'レイジ',ic:'😡',max:4,dur:45,d:'ハチの攻撃力+1（4スタックで+4）'},
 babylove:{jp:'ベビーラブ',ic:'👶',max:1,dur:30,d:'花粉×2・運+50%'},
 bombcombo:{jp:'ボムコンボ',ic:'💣',max:10,dur:5,d:'ボムの力×1.25（10スタックで×3.5）'},
 bearmorph:{jp:'ベアモーフ',ic:'🐻',max:1,dur:30,d:'花粉×2・移動速度24・ジャンプ65'},
 puppylove:{jp:'パピーラブ',ic:'🐶',max:1,dur:10,d:'ハチの速さ+10%・ハチの花粉+50%'},
 bluesync:{jp:'青ボムシンク',ic:'🔷',max:1,dur:30,d:'青ボムが白い花からも集める・青い花粉+10%'},
 redsync:{jp:'赤ボムシンク',ic:'🔶',max:1,dur:30,d:'赤ボムが白い花からも集める・赤い花粉+10%'},
 corrupt:{jp:'フィールド汚染',ic:'👾',max:1,dur:20,d:'トークンがふえることがある'},
 tabby:{jp:'タビーブレッシング',ic:'🐾',max:1,dur:20,d:'会心のダメージ+25%・会心率+1%'},
 balloon:{jp:'バルーンオーラ',ic:'🎈',max:10,dur:3,d:'花粉×1.02（ハチミツトークン+2%）'},
 flameheat:{jp:'フレイムヒート',ic:'🔥',max:5,dur:4,d:'赤い花粉×1.2・ハチの攻撃+5%'},
 stinger:{jp:'スティンガー',ic:'🗡️',max:1,dur:30,d:'ハチの攻撃力×1.5'},
 oil:{jp:'オイル',ic:'🛢️',max:1,dur:600,d:'自分とハチの速さ×1.2'},
 enzymes:{jp:'エンザイム',ic:'🧪',max:1,dur:600,d:'変換速度×1.25・すぐ変換10%'},
 redextract:{jp:'赤エキス',ic:'🔴',max:1,dur:600,d:'赤い花粉×1.25'},
 blueextract:{jp:'青エキス',ic:'🔵',max:1,dur:600,d:'青い花粉×1.25'},
 glue:{jp:'グルー',ic:'🧴',max:1,dur:600,d:'ハチと道具の花粉×1.25'},
 tropical:{jp:'トロピカルドリンク',ic:'🍹',max:1,dur:600,d:'白い花粉×1.25・すぐ変換10%・会心+5%'},
 purple:{jp:'パープルポーション',ic:'🧉',max:1,dur:900,d:'容量×1.25・赤青×1.5・ハチ×1.3・道具×1.3'},
 smoothie:{jp:'スーパースムージー',ic:'🥤',max:1,dur:1200,d:'容量×1.5・花粉×1.6・ハチと道具×1.4・変換×2 など'},
 wealth:{jp:'ウェルスクロック',ic:'⏰',max:5,dur:3600,d:'花粉1つあたりのハチミツ×1.01'},
 jelly:{jp:'ジェリービーンズ',ic:'🫘',max:1,dur:60,d:'ランダムなバフ'}};
// ---- お店 ----
// kind: gear=装備を売る / buy=アイテムを売る
const SHOPS={
 noob:{jp:'ヌーブショップ',keeper:'ヌーブベア',x:-68,z:-28,y:0,zone:0,col:0x6ac24a},
 pro:{jp:'プロショップ',keeper:'プロベア',x:-114,z:-157,y:16,zone:10,col:0x3a6ad8},
 bluehq:{jp:'ブルーHQ',keeper:'ブルーベア',x:-126,z:-62,y:0,zone:0,col:0x2a60e0,need:'blue4'},
 redhq:{jp:'レッドHQ',keeper:'レッドベア',x:64,z:-62,y:24,zone:15,col:0xe03a3a,need:'red4'},
 mtn:{jp:'山頂のショップ',keeper:'トップベア',x:-62,z:-152,y:48,zone:25,col:0xb07a3a},
 guild:{jp:'バッジベアラーズギルド',keeper:'ギルドのクマ',x:58,z:-102,y:24,zone:15,col:0x8a6ad0},
 coconut:{jp:'ココナッツの洞くつ',keeper:'ココナッツのお店',x:56,z:46,y:6,zone:35,col:0x8a6a3a},
 petal:{jp:'ペタルショップ',keeper:'ペタルショップ',x:116,z:58,y:14,zone:35,col:0xf0a0c0},
 gummy:{jp:'グミベアのすみか',keeper:'グミベア',x:-112,z:30,y:0,zone:20,col:0x5ad8c0},
 demon:{jp:'デーモンマスクの台',keeper:'デーモンマスク',x:-74,z:-36,y:0,zone:0,col:0x6a1a1a},
 diamond:{jp:'ダイヤモンドマスクの台',keeper:'ダイヤモンドマスク',x:-130,z:-48,y:0,zone:0,col:0x8ae0ff}};
// 機械・小さなお店（決まった物を売る・もらえる）
const MACHINES={
 eggshop:{jp:'ベーシックエッグのお店',x:-6,z:-31,y:0,zone:0,ic:'🥚'},
 treatshop:{jp:'おやつのお店',x:-1,z:-66,y:0,zone:0,ic:'🍪'},
 ticketshop:{jp:'チケットのお店',x:-56,z:-152,y:48,zone:25,ic:'🎟️'},
 rjshop:{jp:'ロイヤルゼリーのお店',x:40,z:-96,y:24,zone:15,ic:'👑'},
 tickettent:{jp:'チケットテント',x:10,z:18,y:0,zone:0,ic:'🎪'},
 gumdropshop:{jp:'ガムドロップのお店',x:-56,z:-86,y:8,zone:5,ic:'🍬'},
 stingershop:{jp:'スティンガーのお店',x:-62,z:14,y:0,zone:0,ic:'🗡️'},
 blender:{jp:'ブレンダー',x:62,z:-108,y:24,zone:15,ic:'🥤'},
 converter1:{jp:'インスタントコンバーター',x:-6,z:-24,y:0,zone:0,ic:'⚡',cd:900},
 converter2:{jp:'インスタントコンバーター',x:-160,z:-116,y:16,zone:10,ic:'⚡',cd:900},
 converter3:{jp:'インスタントコンバーター',x:-50,z:-160,y:48,zone:25,ic:'⚡',cd:900},
 wealthclock:{jp:'ウェルスクロック',x:-124,z:-20,y:0,zone:0,ic:'⏰',cd:3600},
 blueberrydis:{jp:'ブルーベリーディスペンサー',x:-120,z:-70,y:0,zone:0,ic:'🫐',cd:14400},
 strawberrydis:{jp:'イチゴディスペンサー',x:58,z:-70,y:24,zone:15,ic:'🍓',cd:14400},
 treatdis:{jp:'おやつディスペンサー',x:-58,z:-22,y:0,zone:0,ic:'🍪',cd:3600},
 rjdis:{jp:'ロイヤルゼリーディスペンサー',x:-76,z:-20,y:0,zone:0,ic:'👑',cd:79200},
 gluedis:{jp:'グルーディスペンサー',x:-116,z:36,y:0,zone:20,ic:'🧴',cd:79200},
 coconutdis:{jp:'ココナッツディスペンサー',x:60,z:52,y:6,zone:35,ic:'🥥',cd:14400},
 booster_b:{jp:'青のフィールドブースター',x:-130,z:-70,y:0,zone:0,ic:'🔵',cd:2700,fields:['blueflower','bamboo','pinetree']},
 booster_r:{jp:'赤のフィールドブースター',x:68,z:-52,y:24,zone:15,ic:'🔴',cd:2700,fields:['mushroom','strawberry','rose']},
 booster_w:{jp:'山頂のフィールドブースター',x:-52,z:-170,y:48,zone:25,ic:'⚪',cd:2700,fields:['sunflower','dandelion','spider','pineapple','coconut']},
 redcannon:{jp:'赤い大砲',x:4,z:-6,y:0,zone:0,ic:'🎯'},
 yellowcannon:{jp:'黄色い大砲',x:-166,z:-122,y:16,zone:10,ic:'🎯'},
 bluecannon:{jp:'青い大砲',x:48,z:-90,y:24,zone:15,ic:'🎯'},
 kblair:{jp:'キングビートルのすみか',x:-100,z:-50,y:0,zone:0,ic:'🪲'},
 tunnel:{jp:'ホワイトトンネル',x:-156,z:-108,y:16,zone:10,ic:'🕳️'}};
// 大砲で行ける場所
const CANNON_DEST=['sunflower','dandelion','mushroom','blueflower','clover','strawberry','spider','bamboo','pineapple','stump','cactus','pumpkin','pinetree','rose','mountaintop','coconut','pepper'];
// ---- クマ（クエストをくれる） ----
const BEARS={
 black:{jp:'ブラックベア',x:14,z:-10,y:0,zone:0,col:0x2b2b2b,snout:0x9a8070},
 mother:{jp:'マザーベア',x:8,z:-67,y:0,zone:0,col:0x8a5a3a,snout:0xd8b080,bow:1},
 brown:{jp:'ブラウンベア',x:-124,z:-28,y:0,zone:0,col:0x634929,snout:0xc8a77f},
 panda:{jp:'パンダベア',x:-58,z:-79,y:8,zone:5,col:0xf4f4f4,snout:0xf4f4f4,panda:1},
 science:{jp:'サイエンスベア',x:-170,z:-112,y:16,zone:10,col:0xa07a50,snout:0xd8c0a0,goggles:1},
 polar:{jp:'ポーラーベア',x:-16,z:-120,y:28,zone:15,col:0xf4f8ff,snout:0xf4f8ff},
 spirit:{jp:'スピリットベア',x:80,z:58,y:14,zone:35,col:0x9ad8ff,snout:0xd8f0ff,ghost:1},
 honeybee:{jp:'ハニービー（NPC）',x:44,z:-160,y:24,zone:15,col:0xffd84a,snout:0xffd84a,bee:1}};
// ---- ゲート（必要なハチの数） ----
// x0..x1, z = 通り道（ハチが足りないと通れない）
const GATES=[
 {n:5,jp:'ベーシックビーのゲート',x0:-60,x1:-52,z0:-75,z1:-74,y:8},
 {n:10,jp:'ブレイブビーのゲート',x0:-110,x1:-102,z0:-112.5,z1:-111.5,y:16},
 {n:15,jp:'ハニービーのゲート',x0:10,x1:18,z0:-112.5,z1:-111.5,y:24},
 {n:20,jp:'アリのゲート',x0:-70,x1:-64,z0:4,z1:12,y:0},
 {n:25,jp:'ライオンビーのゲート',x0:-25,x1:-24,z0:-160,z1:-150,y:24},
 {n:35,jp:'ウィンディビーのゲート',x0:24,x1:32,z0:13,z1:14,y:0}];
// ---- ブレンダーのレシピ（本家どおり） ----
const BLENDER=[['redextract',{royaljelly:10,strawberry:50}],['blueextract',{royaljelly:10,blueberry:50}],['enzymes',{royaljelly:10,pineapple:50}],['oil',{royaljelly:10,sunflowerseed:50}],['glue',{royaljelly:10,gumdrops:50}],
 ['tropicaldrink',{coconut:10,enzymes:2,oil:2}],['gumdrops',{pineapple:3,strawberry:3,blueberry:3}],['mooncharm',{royaljelly:1,pineapple:5,gumdrops:5}],['glitter',{mooncharm:25,magicbean:1}],['starjelly',{royaljelly:100,glitter:3}],
 ['purplepotion',{neonberry:3,redextract:3,blueextract:3,glue:3}],['softwax',{honeysuckle:5,oil:1,enzymes:1,royaljelly:10}],['hardwax',{softwax:3,enzymes:3,bitterberry:33,royaljelly:33}],
 ['swirledwax',{hardwax:3,softwax:9,purplepotion:6,royaljelly:3333}],['causticwax',{hardwax:5,enzymes:5,neonberry:25,royaljelly:5252}],['fielddice',{softwax:1,whirligig:1,redextract:1,blueextract:1}],
 ['smoothdice',{fielddice:3,softwax:3,whirligig:3,oil:3}],['loadeddice',{smoothdice:3,hardwax:3,oil:3,glue:1}],['supersmoothie',{neonberry:3,starjelly:3,purplepotion:3,tropicaldrink:6}],['turpentine',{supersmoothie:10,causticwax:10,starjelly:100,honeysuckle:1000}]];
// ハイブのスロットを買う値段（山頂のショップ。本家の表の数字、それより先はだいたいの値）
const SLOT_COST=[3000000,7750000,14562500,24057292,37085938,54774609,78597363,110474899,152902986,209117953,283309237,380891931];
// ハチのトークン（能力）の出やすさ：cd=次に出せるまでの秒、p=1回ごとの確率、g=ギフテッドのときだけ
const TOK_RATE={redboost:[6,.3],blueboost:[6,.3],whiteboost:[6,.3],haste:[6,.3],focus:[8,.3],melody:[15,.25],rage:[10,.35],babylove:[25,.3],
 buzzbomb:[6,.3],buzzbomb2:[8,.3],redbomb:[6,.3],redbomb2:[8,.3],bluebomb:[6,.3],bluebomb2:[8,.3],pollenmark:[14,.3],pollenmark2:[14,.3],honeymark:[14,.3],honeymark2:[14,.3],
 tokenlink:[10,.25],honeygift:[20,.3],honeygift2:[20,.3],balloon:[20,.3],party:[120,.3],fuzzbomb:[15,.3],haze:[60,.25],target:[20,.3],inferno:[25,.3],flamefuel:[45,.3],
 frog:[20,.3],triangulate:[15,.3],marksurge:[30,.3],bearmorph:[30,.3],bluepulse:[12,.3],redpulse:[12,.3],bluesync:[30,.3],redsync:[30,.3],glitch:[30,.3],mindhack:[15,.4,'battle'],corrupt:[120,.3],
 festivegift:[60,.3],glob:[15,.3],barrage:[30,.3],beamstorm:[20,.3],puppylove:[15,.3],fetch:[25,.3],scratch:[8,.3],tabbylove:[15,.3],impale:[15,.4,'battle'],raincloud:[30,.3],tornado:[30,.3]};
const TOK_INFO={redboost:['赤ブースト','🔴'],blueboost:['青ブースト','🔵'],whiteboost:['白ブースト','⚪'],haste:['ヘイスト','💨'],focus:['フォーカス','🎯'],melody:['メロディ','🎵'],rage:['レイジ','😡'],babylove:['ベビーラブ','👶'],
 buzzbomb:['バズボム','💥'],buzzbomb2:['バズボム+','💥'],redbomb:['赤ボム','🧨'],redbomb2:['赤ボム+','🧨'],bluebomb:['青ボム','💧'],bluebomb2:['青ボム+','💧'],pollenmark:['花粉マーク','🎯'],pollenmark2:['花粉マーク+','🎯'],
 honeymark:['ハニーマーク','🍯'],honeymark2:['ハニーマーク+','🍯'],tokenlink:['トークンリンク','🔗'],honeygift:['ハニーギフト','🎁'],honeygift2:['ハニーギフト+','🎁'],balloon:['バルーン','🎈'],party:['サプライズパーティー','🎉'],
 fuzzbomb:['ファズボム','☁️'],haze:['ポーレンヘイズ','🌫️'],target:['ターゲット練習','🎯'],inferno:['インフェルノ','🔥'],flamefuel:['フレイムフューエル','🛢️'],frog:['カエル','🐸'],triangulate:['トライアングル','🔺'],marksurge:['マークサージ','📍'],
 bearmorph:['ベアモーフ','🐻'],bluepulse:['青パルス','🔷'],redpulse:['赤パルス','🔶'],bluesync:['青ボムシンク','🔷'],redsync:['赤ボムシンク','🔶'],glitch:['グリッチ','👾'],mindhack:['マインドハック','🧠'],corrupt:['マップ汚染','👾'],
 festivegift:['フェスティブギフト','🎁'],glob:['グロブ','🟢'],barrage:['ガムドロップ弾','🍬'],beamstorm:['ビームストーム','🌟'],puppylove:['パピーラブ','🐶'],fetch:['フェッチ','🎾'],scratch:['スクラッチ','🐾'],tabbylove:['タビーラブ','💗'],
 impale:['インペイル','🗡️'],raincloud:['雨雲','🌧️'],tornado:['竜巻','🌪️']};
