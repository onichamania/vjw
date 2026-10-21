// ================= トロルヘイムのデータ（Wiki「Trollheim」「Terrain」「Enemies」「Axes」「Pickaxes」「Weapons」「Armor」「Helmets」「Merchants」「Portal Overview」）=================
Object.assign(RES,{
 wheat:{n:'小麦',c:'#f0c040'},coal:{n:'石炭',c:'#3a3a48'},wool:{n:'羊毛',c:'#f4f0e8'},leather:{n:'革',c:'#a8683a'},gear:{n:'歯車',c:'#b8c0cc'},
 crock:{n:'ワニの足',c:'#7ab04a'},bone:{n:'骨',c:'#f0ead8'},amber:{n:'琥珀',c:'#ffa020'},key:{n:'金のカギ',c:'#ffd21f'}});
RES_ORDER.splice(RES_ORDER.indexOf('coin'),0,'wheat','coal','wool','leather','gear','crock','bone','amber');RES_ORDER.splice(RES_ORDER.indexOf('core'),0,'key');
Object.assign(NODE,{
 tpine: {n:'秋のマツ',tool:'axe',lv:5,hp:48,res:'wood',amt:48,rsp:11,r:.5,hh:2.5},
 wheat: {n:'小麦畑',tool:'weap',lv:1,hp:1,res:'wheat',amt:8,rsp:5,r:.45,hh:1.0},
 redoak:{n:'大きなカシ',tool:'axe',lv:7,hp:150,res:'wood',amt:375,rsp:18,r:.75,hh:3.0},
 crock2:{n:'洞くつの大岩',tool:'pick',lv:7,hp:40,res:'rock',amt:40,rsp:10,r:.7,hh:1.6},
 azr2:  {n:'アズライトの結晶',tool:'pick',lv:8,hp:36,res:'azr',amt:18,rsp:12,r:.6,hh:1.7},
 arock: {n:'秋の岩',tool:'pick',lv:8,hp:45,res:'rock',amt:45,rsp:11,r:.65,hh:1.7},
 coal:  {n:'石炭の岩',tool:'pick',lv:9,hp:50,res:'coal',amt:25,rsp:15,r:.65,hh:1.6},
 barna: {n:'フジツボの岩',tool:'pick',lv:9,hp:50,res:'rock',amt:50,rsp:25,r:.7,hh:1.7},
 ame2:  {n:'アメジストの結晶',tool:'pick',lv:10,hp:36,res:'ame',amt:18,rsp:15,r:.6,hh:1.8},
 sdead: {n:'沼の枯れ木',tool:'axe',lv:9,hp:56,res:'wood',amt:56,rsp:20,r:.5,hh:2.6},
 outh:  {n:'沼の小屋',tool:'axe',lv:1,hp:6,res:'plank',amt:3,rsp:30,r:.6,hh:2.0},
 scrap: {n:'がらくたの山',tool:'axe',lv:10,hp:100,res:'gear',amt:13,rsp:10,r:.7,hh:1.3},
 cblock:{n:'石炭のかたまり',tool:'pick',lv:11,hp:100,res:'coal',amt:50,rsp:20,r:.75,hh:1.8},
 vrock: {n:'火山の岩',tool:'pick',lv:11,hp:60,res:'rock',amt:60,rsp:11,r:.7,hh:1.7},
 amber: {n:'琥珀の結晶',tool:'pick',lv:11,hp:80,res:'amber',amt:10,rsp:15,r:.55,hh:1.7},
 ura2:  {n:'ウランの結晶',tool:'pick',lv:12,hp:96,res:'ura',amt:12,rsp:20,r:.6,hh:1.8},
 ruby2: {n:'ルビーの結晶',tool:'pick',lv:12,hp:108,res:'ruby',amt:18,rsp:12,r:.6,hh:1.8},
 key:   {n:'金のカギ',tool:'pick',lv:1,hp:10,res:'key',amt:1,rsp:0,r:.5,hh:1.8,once:1},
 icepick:{n:'氷づけのつるはし',tool:'pick',lv:12,hp:200,res:null,amt:0,rsp:0,r:.7,hh:2.2,once:1}});
Object.assign(NODE_PER,{tpine:3,wheat:3,redoak:1,crock2:2,azr2:2,arock:2,coal:2,barna:2,ame2:2,sdead:2,outh:1,scrap:2,cblock:2,vrock:2,amber:2,ura2:2,ruby2:2,key:1,icepick:1});
// 道具：トロルヘイムで作れる Lv9〜16（Wiki の費用）。剣 Lv9 はガイアでは岩にささっているもの（後の星では作れる）なので、ここでは作れるようにした
Object.assign(AXE,{9:{plank:700,steel:700},10:{plank:700,steel:700,wheat:1000},11:{plank:700,steel:700,azr:4500},12:{plank:700,steel:800,coal:2000},13:{plank:700,steel:800,ame:4500},14:{plank:700,steel:800,gear:1000},15:{plank:700,steel:800,ura:1000},16:{plank:700,steel:800,ruby:4500}});
Object.assign(PICK,{9:{steel:700,plank:700},10:{steel:700,plank:700,wheat:1000},11:{steel:720,plank:720,azr:4500},12:{steel:740,plank:740,coal:2000},13:{steel:760,plank:760,ame:4500},14:{steel:780,plank:780,gear:1000},15:{steel:800,plank:800,ura:1000},16:{steel:900,plank:900,ruby:4500}});
Object.assign(WEAP,{9:{plank:500,steel:600,azr:2500},10:{plank:600,steel:700,azr:4500},11:{plank:600,steel:700,coal:1500},12:{plank:600,steel:800,ame:4500},13:{plank:600,steel:800,gear:1000},14:{plank:600,steel:800,ura:1000},15:{plank:600,steel:800,ruby:4500}});
WPOW.push(17,19,21,23,25,27);WHP.push(130,140,150,160,170,180);
for(let l=9;l<=17;l++)CRAFT_T[l]=16+(l-8)*2;
// かぶと・よろい（Wiki「Helmets」「Armor」：体力が増える）
const HELM=[null,{coin:500,wool:50},{coin:500,wool:125},{coin:500,leather:250},{coin:500,leather:400},{coin:500,crock:300},{coin:500,crock:500},{coin:500,gear:500},{coin:1000,wool:500,leather:1000}];
const ARMR=[null,{coin:500,wool:25},{coin:500,wool:100},{coin:500,leather:200},{coin:500,leather:300},{coin:500,crock:200},{coin:500,crock:400},{coin:500,gear:500},{coin:1000,wool:500,leather:1000}];
const ARMHP=[0,15,20,25,30,35,40,45,50];
Object.assign(TOOLN,{helm:'かぶと',arm:'よろい'});
const TOOLCOST={axe:AXE,pick:PICK,weap:WEAP,helm:HELM,arm:ARMR};
// 敵（体力と落とすものは Wiki「Enemies」のトロルヘイム。こうげきの強さはこのゲームの体力に合わせた）
Object.assign(ENEMY,{
 ctroll:{n:'石炭トロル',hp:200,atk:16,spd:2.0,r:.9,drop:{wool:25,coal:20},rsp:600,sc:1.6,boss:1},
 scare: {n:'かかし',hp:30,atk:12,spd:2.4,r:.45,drop:{wheat:15,plank:3},rsp:40,sc:1},
 mtroll:{n:'山のトロル',hp:400,atk:24,spd:2.1,r:1,drop:{wool:25,rock:60},rsp:600,sc:1.8,boss:1},
 rockm: {n:'岩のモンスター',hp:45,atk:14,spd:2.0,r:.6,drop:{rock:25,azr:15},rsp:30,sc:1.1},
 bear:  {n:'クマ',hp:60,atk:16,spd:2.6,r:.7,drop:{leather:8},rsp:40,sc:1.1},
 spider:{n:'クモ',hp:120,atk:18,spd:2.8,r:.7,drop:{coal:7},rsp:35,sc:1},
 crim:  {n:'紅の剣士',hp:55,atk:18,spd:2.5,r:.45,drop:{rock:20,coin:10,ame:15},rsp:35,sc:1},
 stufur:{n:'ストゥフル',hp:600,atk:30,spd:2.2,r:1.1,drop:{wool:25,coin:150,ame:100},rsp:300,sc:1.9,boss:1},
 squeen:{n:'クモの女王',hp:500,atk:28,spd:2.6,r:1.1,drop:{coal:200},rsp:120,sc:1.7,boss:1},
 croc:  {n:'ワニ',hp:50,atk:18,spd:2.4,r:.7,drop:{crock:10},rsp:40,sc:1},
 stroll:{n:'沼のトロル',hp:600,atk:32,spd:2.0,r:1.1,drop:{crock:50,wool:25},rsp:600,sc:1.9,boss:1},
 skelb: {n:'ガイコツ',hp:75,atk:20,spd:2.6,r:.45,drop:{bone:8},rsp:30,sc:1},
 lava:  {n:'溶岩ゴーレム',hp:90,atk:24,spd:2.2,r:.7,drop:{ruby:8,rock:15},rsp:30,sc:1.2},
 skellir:{n:'スケリル',hp:1000,atk:40,spd:2.2,r:1.2,drop:{coin:300,ruby:200},rsp:600,sc:2.1,boss:1}});
// 建物
Object.assign(BLD,{
 mill:  {n:'風車',kind:'trade',inp:{wheat:100},out:'coin',k:45},
 barn:  {n:'羊の小屋',kind:'trade',inp:{coin:10},out:'wool',k:1},
 coalT: {n:'石炭の商人',kind:'trade',inp:{coal:40},out:'coin',k:5},
 tailorR:{n:'仕立て屋',kind:'eq',tools:['helm','arm']},
 rportal:{n:'ガイアへのポータル',kind:'warp',to:'gaia'},
 dockN: {n:'船着き場（北）',kind:'boat',pair:'dockS'},dockS:{n:'船着き場（南）',kind:'boat',pair:'dockN'},
 farmer:{n:'農家',kind:'npc'},captain:{n:'船長',kind:'npc'}});
// つかまっている人（タイルが買えるあいだはおりの中。開けると出てきて、ごほうび）
const NPC_OF={farmer:'farmer',tailorR:'tailor',captain:'captain'};
const NPC_FREE={farmer:['農家を助けた！','小麦が2倍とれるようになった'],tailorR:['仕立て屋を助けた！','かぶととよろいを作ってくれる'],captain:['船長を助けた！','船着き場から船に乗れるようになる']};
for(const k of ['plankR','steelR','axeR','pickR','weapR','rockT','woodT','azT','diaT','meatT','mill','barn','coalT'])BLD[k].out=BLD[k].out||null;
// トロルヘイムのエリア
const AREA_TROLL={
 1:{n:'秋の野原',top:'#f0b030',top2:'#f5c24a',side:'#b06a2a',deco:'autumn'},
 2:{n:'秋の島',top:'#c8792a',top2:'#d68a3a',side:'#7a3e18',deco:'autumn'},
 3:{n:'秋の丘',top:'#b8865a',top2:'#c8966a',side:'#7a5034',deco:'hills'},
 4:{n:'クモの洞くつ',top:'#5c666e',top2:'#6a747c',side:'#363c42',deco:'cave'},
 5:{n:'沼',top:'#7a8a3a',top2:'#8a9a46',side:'#4a5222',deco:'swamp'},
 6:{n:'難破船の浜',top:'#f2d27a',top2:'#f7df96',side:'#c89a50',deco:'beach'},
 7:{n:'火山の島',top:'#5a464c',top2:'#68525a',side:'#34282c',deco:'ash'},
 8:{n:'赤い火山',top:'#c44a38',top2:'#d25a44',side:'#6c2a20',deco:'ash'},
 9:{n:'アズライトの洞くつ',top:'#465a80',top2:'#52668e',side:'#26304a',deco:'dungeon'},
 10:{n:'ストゥフルのすみか',top:'#5a466e',top2:'#66527a',side:'#30243e',deco:'dungeon'},
 11:{n:'スケリルのすみか',top:'#6a3434',top2:'#784040',side:'#3a1a1a',deco:'dungeonR'},
 12:{n:'橋',top:'#b9773f',top2:'#c98a4c',side:'#7a4a24',deco:'none',nob:1},
 13:{n:'氷のくぼみ',top:'#e6f2ff',top2:'#f4faff',side:'#a9bfe6',deco:'arctic'}};
// ポータル（Wiki「Portal Overview」のトロルヘイム）
const PORTAL_TROLL=[{n:'下のリング',c:{steel:60}},{n:'アズライトのかけら',c:{azr:1500}},{n:'アメジストのかけら',c:{ame:1500}},{n:'石炭のかけら',c:{coal:2500}},{n:'ウランのかけら',c:{ura:900}},{n:'ルビーのかけら',c:{ruby:2000}},{n:'ポータルを動かす',c:{core:2}}];
// ---- 星の一覧 ----
const WDEF={
 gaia:{id:'gaia',n:'ガイア',tiles:GAIA_TILES,layout:GAIA_LAYOUT,area:AREA,rockBy:ROCK_BY_AREA,portal:PORTAL_STEPS,shark:4,next:'troll',water:'#22b8f2',bed:'#1371b8',shelf:'#7fe0e8',
   maxLv:{axe:8,pick:8,weap:8,helm:0,arm:0},start:[{j:1,n:'oak',c:2},{j:2,n:'oak',c:1},{j:4,n:'oak',c:2}],portalCol:['#9aa3ad','#2f7cf0','#b25cf0','#5ff0f0','#5ce04a','#f0284a']},
 troll:{id:'troll',n:'トロルヘイム',tiles:TROLL_TILES,layout:TROLL_LAYOUT,area:AREA_TROLL,rockBy:{},portal:PORTAL_TROLL,shark:.5,next:null,back:'gaia',water:'#2cc4d8',bed:'#12708a',shelf:'#86e6dc',
   maxLv:{axe:16,pick:16,weap:15,helm:8,arm:8},ctrFirst:1,start:[{j:1,b:'rportal'},{j:2,b:'steelR'},{j:3,b:'barn'},{j:4,n:'tpine',c:2},{j:5,n:'tpine',c:2},{j:6,n:'tpine',c:1}],portalCol:['#9aa3ad','#2f7cf0','#b25cf0','#2a2a34','#5ce04a','#f0284a']}};
const WORLD_ORDER=['gaia','troll'];
AREA[11].nob=1;AREA[12].nob=1;   // ガイアの「草原（2つ目）」と橋は名前を出さない
