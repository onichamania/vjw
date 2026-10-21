// ================= データ（Wiki の数字をもとに）=================
const R=26;            // 星の半径（Wiki: Gaia radius 26）
const SEA=R;           // 海の高さ
const BED=R-2.6;       // 海の底
// ---- 資源 ----
const RES={
 wood:{n:'木材',c:'#b9773f'},plank:{n:'板',c:'#e3b36a'},rock:{n:'石',c:'#9aa3ad'},steel:{n:'鉄',c:'#c8d2dc'},
 azr:{n:'アズライト',c:'#2f7cf0'},ame:{n:'アメジスト',c:'#b25cf0'},shroom:{n:'キノコ',c:'#e8423a'},meat:{n:'肉',c:'#d9715a'},
 dia:{n:'ダイヤ',c:'#5ff0f0'},sul:{n:'硫黄',c:'#f2dc2a'},ura:{n:'ウラン',c:'#5ce04a'},cact:{n:'サボテン',c:'#3faa4a'},
 ruby:{n:'ルビー',c:'#f0284a'},coin:{n:'コイン',c:'#ffc21a'},core:{n:'ソースコア',c:'#ff7af0'}};
const RES_ORDER=['wood','plank','rock','steel','azr','ame','shroom','meat','dia','sul','ura','cact','ruby','coin','core'];
// ---- 木や岩（Wiki「Terrain」：道具・レベル・体力・取れる数・復活の秒数）----
// r=当たりの半径、hh=高さ（数字やゲージの位置）
const NODE={
 oak:   {n:'オークの木',tool:'axe',lv:1,hp:6, res:'wood',amt:15,rsp:10,r:.55,hh:2.13},
 pine:  {n:'マツの木',tool:'axe',lv:2,hp:12,res:'wood',amt:12,rsp:10,r:.5,hh:2.46},
 magic: {n:'まぼろしの木',tool:'axe',lv:3,hp:18,res:'wood',amt:20,rsp:10,r:.55,hh:2.3},
 shroom:{n:'赤いキノコ',tool:'axe',lv:3,hp:6, res:'shroom',amt:6,rsp:10,r:.5,hh:1.31},
 snowt: {n:'雪の木',tool:'axe',lv:4,hp:24,res:'wood',amt:24,rsp:10,r:.55,hh:2.54},
 dead:  {n:'枯れ木',tool:'axe',lv:5,hp:28,res:'wood',amt:28,rsp:300,r:.5,hh:2.3},
 palm:  {n:'ヤシの木',tool:'axe',lv:5,hp:36,res:'wood',amt:36,rsp:10,r:.5,hh:2.62},
 cact:  {n:'サボテン',tool:'axe',lv:5,hp:45,res:'cact',amt:9,rsp:5,r:.45,hh:1.8},
 rock:  {n:'大きな岩',tool:'pick',lv:1,hp:6, res:'rock',amt:3,rsp:11,r:.6,hh:1.23},
 crock: {n:'洞くつの大岩',tool:'pick',lv:2,hp:20,res:'rock',amt:20,rsp:10,r:.7,hh:1.56},
 snowr: {n:'雪の岩',tool:'pick',lv:3,hp:30,res:'rock',amt:30,rsp:11,r:.7,hh:1.56},
 azr:   {n:'アズライトの結晶',tool:'pick',lv:1,hp:9, res:'azr',amt:9,rsp:12,r:.55,hh:1.48},
 ame:   {n:'アメジストの結晶',tool:'pick',lv:3,hp:18,res:'ame',amt:9,rsp:5,r:.55,hh:1.56},
 dia:   {n:'ダイヤの岩',tool:'pick',lv:4,hp:40,res:'dia',amt:5,rsp:12,r:.65,hh:1.56},
 sul:   {n:'硫黄の結晶',tool:'pick',lv:5,hp:16,res:'sul',amt:8,rsp:15,r:.55,hh:1.48},
 ura:   {n:'ウランの結晶',tool:'pick',lv:6,hp:48,res:'ura',amt:6,rsp:20,r:.6,hh:1.64},
 ruby:  {n:'ルビーの結晶',tool:'pick',lv:7,hp:54,res:'ruby',amt:9,rsp:12,r:.55,hh:1.56},
 chest: {n:'金の宝箱',tool:'pick',lv:1,hp:25,res:'coin',amt:90,rsp:180,r:.55,hh:1.15},
 sword: {n:'岩にささった剣',tool:'pick',lv:7,hp:60,res:null,amt:0,rsp:0,r:.6,hh:2.2,once:1},
 core:  {n:'ソースコア',tool:'pick',lv:1,hp:10,res:'core',amt:1,rsp:0,r:.6,hh:2.2,once:1}};
// 1枚のタイルに置く数
const NODE_PER={oak:3,pine:3,magic:3,shroom:3,snowt:3,dead:2,palm:3,cact:3,rock:3,crock:2,snowr:2,azr:3,ame:3,dia:2,sul:3,ura:2,ruby:3,chest:1,sword:1,core:1};
// ---- 道具（Wiki「Axes」「Pickaxes」の費用。力 = レベル）----
const AXE=[null,null,{plank:40,steel:40},{plank:150,steel:150,azr:390},{plank:300,steel:300,ame:650},{plank:900,steel:900,coin:1500},{plank:720,steel:720,coin:3200},{plank:1000,steel:1000,dia:270},{plank:2400,steel:2400,ura:400}];
const PICK=[null,null,{plank:35,steel:35},{azr:360,steel:500,plank:130},{steel:260,plank:340,ame:650},{steel:450,plank:675,coin:1500},{steel:640,plank:1000,coin:3200},{steel:900,plank:1600,dia:270},{steel:1200,plank:2400,ura:400}];
// 剣：ガイアの 1〜8 は今の本家にないので、斧の費用に合わせて作った。9 は岩にささった剣（Wiki: Health 120 / Power 15）
const WEAP=[null,null,{plank:20,steel:20},{plank:100,steel:100,azr:200},{plank:200,steel:200,ame:400},{plank:400,steel:400,shroom:300},{plank:500,steel:500,dia:100},{plank:700,steel:700,sul:200},{plank:900,steel:900,ura:200}];
const WPOW=[0,2,3,4,6,8,10,12,13,15],WHP=[0,40,50,60,70,80,90,100,110,120];
const CRAFT_T=[0,0,4,6,8,10,12,14,16];   // 作る時間（秒）
const TOOLN={axe:'斧',pick:'つるはし',weap:'剣'};
// ---- 敵（Wiki「Enemies」の落とすもの。体力と強さはこのゲームの剣に合わせた）----
const ENEMY={
 gob:   {n:'ゴブリン',hp:6,atk:5,spd:2.3,r:.45,drop:{steel:1,wood:5,rock:5},rsp:90,sc:1},
 log:   {n:'丸太モンスター',hp:10,atk:6,spd:2.0,r:.5,drop:{plank:1,wood:10},rsp:90,sc:1},
 red:   {n:'赤い兵士',hp:30,atk:9,spd:2.4,r:.45,drop:{rock:20,coin:5},rsp:60,sc:1},
 master:{n:'マスター兵士',hp:140,atk:16,spd:2.2,r:.8,drop:{coin:100,steel:20},rsp:300,sc:1.7,boss:1},
 fung:  {n:'キノコ男',hp:40,atk:11,spd:2.1,r:.5,drop:{shroom:10},rsp:20,sc:1},
 yeti:  {n:'イエティ',hp:60,atk:15,spd:2.4,r:.6,drop:{meat:18},rsp:40,sc:1.2},
 skel:  {n:'ガイコツ海賊',hp:100,atk:20,spd:2.6,r:.45,drop:{ruby:2,coin:10,cact:5},rsp:50,sc:1}};
// ---- 建物 ----
// kind: ref=資源の精錬 / eq=道具を作る / trade=商人
const BLD={
 plankR:{n:'板の精錬所',kind:'ref',inp:{wood:3},out:'plank',t:1.0},
 steelR:{n:'鉄の精錬所',kind:'ref',inp:{rock:5},out:'steel',t:1.5},
 axeR:  {n:'斧の精錬所',kind:'eq',tool:'axe'},
 pickR: {n:'つるはしの精錬所',kind:'eq',tool:'pick'},
 weapR: {n:'武器の精錬所',kind:'eq',tool:'weap'},
 woodT: {n:'木材の商人',kind:'trade',inp:{wood:50},out:'coin',k:5},
 rockT: {n:'石の商人',kind:'trade',inp:{rock:40},out:'coin',k:5},
 azT:   {n:'アズライトの商人',kind:'trade',inp:{azr:10},out:'coin',k:5},
 diaT:  {n:'ダイヤの商人',kind:'trade',inp:{dia:2},out:'coin',k:5},
 meatT: {n:'肉の商人',kind:'trade',inp:{meat:15},out:'coin',k:1},
 portal:{n:'ポータル',kind:'portal'},skin:{n:'キャラクターポータル',kind:'skin'},
 cave:{n:'洞くつの入り口',kind:'deco'},bridge:{n:'橋',kind:'deco'}};
// ポータル（Wiki「Gaia Tile By Tile」の最後）
let PORTAL_STEPS=[{n:'下のリング',c:{steel:60}},{n:'アズライトのかけら',c:{azr:700}},{n:'アメジストのかけら',c:{ame:750}},{n:'ダイヤのかけら',c:{dia:150}},{n:'ウランのかけら',c:{ura:450}},{n:'ルビーのかけら',c:{ruby:500}},{n:'ポータルを動かす',c:{core:1}}];
// ---- エリア（Wiki の 2D マップの番号）----
let AREA={
 1:{n:'草原',top:'#8ed14f',top2:'#a5de62',side:'#c98a4c',deco:'meadow'},
 2:{n:'岩の丘',top:'#d9a066',top2:'#e6b27a',side:'#a8663a',deco:'hills'},
 3:{n:'トウヒの森',top:'#3f9c64',top2:'#4fae72',side:'#7a5636',deco:'spruce'},
 4:{n:'兵士の洞くつ',top:'#7a4632',top2:'#8a5440',side:'#4e2c22',deco:'cave'},
 5:{n:'砂の岬',top:'#f2d27a',top2:'#f7df96',side:'#d1a45a',deco:'sand'},
 6:{n:'ふしぎの森',top:'#6f5878',top2:'#7f6890',side:'#463650',deco:'mystic'},
 7:{n:'北極',top:'#eef4ff',top2:'#ffffff',side:'#a9bfe6',deco:'arctic'},
 8:{n:'灰の地',top:'#c4553c',top2:'#d46a4a',side:'#6c2a20',deco:'ash'},
 9:{n:'ウランの谷',top:'#2e3644',top2:'#3a4454',side:'#1c222c',deco:'ura'},
 10:{n:'砂漠',top:'#f5d48a',top2:'#fae3a6',side:'#d8a45a',deco:'desert'},
 11:{n:'草原',top:'#8ed14f',top2:'#a5de62',side:'#c98a4c',deco:'meadow'},
 12:{n:'橋',top:'#b9773f',top2:'#c98a4c',side:'#7a4a24',deco:'none'}};
// エリアによって「岩」の種類が変わる
let ROCK_BY_AREA={4:'crock',7:'snowr'};
// ---- キャラクター（Wiki「Playable Characters」のガイアの2人と、はじめのキャラ）----
const SKINS=[
 {id:'stick',n:'ぼうにんげん',cost:null,body:'#ffd21f',head:'#ffd21f',acc:null,note:'ボーナスなし'},
 {id:'fungy',n:'ファンギー',cost:{shroom:1500},body:'#f4e3c8',head:'#f4e3c8',acc:'shroom',note:'キノコ +15%・こうげき -10%',bonus:{shroom:1.15},dmg:.9},
 {id:'astro',n:'うちゅうひこうし',cost:{ura:300,sul:300},body:'#f2f4f8',head:'#f2f4f8',acc:'helmet',note:'ウラン・硫黄 +10%・体力 +10%',bonus:{ura:1.1,sul:1.1},hp:1.1}];
