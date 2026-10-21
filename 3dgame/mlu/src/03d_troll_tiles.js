// ================= トロルヘイムのタイル =================
// 1〜118 は Wiki「Trollheim Tile By Tile」の順番・費用・中身（そのあとの表は Wiki がガイアのコピーになっていて無いので、
// 119 からは Wiki の「Trollheim」「Terrain」「Enemies」「Merchants」「Portal Overview」の資料から、沼・難破船の浜・船・火山の島・スケリルのすみか・ポータルを組み立てた）
// 1行 = 「エリア|費用（資源:数,…）|中身」。エリア：1 秋の野原 2 秋の島 3 秋の丘 4 クモの洞くつ 5 沼 6 難破船の浜 7 火山の島 8 赤い火山
//   9 アズライトの洞くつ 10 ストゥフルのすみか 11 スケリルのすみか（ダンジョン）12 橋 13 氷のくぼみ
const TROLL_TILES=[
"1|wood:200|plankR","1|wood:250|tpine","12|plank:350|bridge",
"2|wood:250|ctroll","2|wood:350|wheat","2|wood:450|scare","2|wood:350,wheat:25|wheat","2|wood:400,wheat:40|wheat","2|wood:500,wheat:80|wheat","2|wood:500,wheat:120|wheat","2|wood:500|redoak",
"2|plank:250,wheat:1000|mill","2|wheat:250|","2|wheat:300|","2|plank:50,wheat:350|scare","2|plank:100,wheat:400|","2|plank:175,wheat:500|","2|wheat:500|pickR","2|plank:190,wheat:500|scare",
"2|plank:200,wheat:550|cave","2|wood:600|","2|wood:650|arock","2|wood:500|redoak","2|wood:500|redoak",
// 25〜45 アズライトの洞くつ
"12|plank:350|bridge","9|rock:500|crock2","9|rock:600|","9|rock:700|crock2 azr2 rockm","9|rock:700,azr:700|azr2","9|rock:700,azr:700|","9|rock:700,azr:900|azr2","9|rock:800,azr:1200|crock2 chest rockm",
"9|rock:800|crock2","9|rock:850|crock2 azr2","9|rock:900|crock2","9|rock:950|","9|rock:950|crock2","9|rock:1000|crock2","9|rock:1000|azr2","9|rock:1000|crock2","9|rock:1000|crock2 key rockm",
"9|rock:1000|","9|rock:1000|chest","9|rock:1000|","9|rock:1000|chest",
// 46〜55 秋の島（つかまった農家）
"2|rock:500,azr:500|arock","2|rock:500|","2|rock:500|redoak","2|rock:500|","2|rock:500,key:1|farmer","2|rock:500|arock","2|rock:500|mtroll arock","2|wood:700|arock","2|wood:750|arock","12|rock:1000|bridge",
// 56〜73 秋の丘（クマ）・野原の残り
"3|rock:500|","3|rock:750|arock","3|rock:500,plank:150|weapR","3|rock:750|bear arock","3|wood:2000|","3|rock:1000|bear","3|rock:1000|arock","3|rock:1000|arock","3|rock:1000|arock","3|rock:1000|","3|rock:1000|bear arock",
"3|wood:2000|tpine","1|wood:500|axeR","1|wood:1000|","1|wood:250|tpine","3|rock:1000|rockT","3|rock:750,leather:20|","3|rock:750|",
// 74〜94 クモの洞くつ（小麦トロルの通せんぼ・石炭）
"4|leather:50|wtroll","4|wheat:350|trollgo","4|rock:1000|spider","4|rock:500|coal","4|azr:500|","4|ame:500|","4|ruby:500|","4|rock:1100|coal","4|rock:1100|coal","4|coal:10|coal","4|rock:1100,coal:25|coal",
"4|rock:1200,coal:50|spider","4|rock:1000,coal:100|","4|rock:1200,coal:50|coal","4|rock:1500|barna","4|rock:1700|barna","4|rock:2000,coal:200|coal barna","4|rock:2000|","4|rock:2500|chest","4|rock:2500|chest","4|rock:2500|cave spider",
// 95〜115 ストゥフルのすみか
"10|rock:600|","10|rock:700|arock","10|rock:700|arock","10|rock:800|arock ame2","10|rock:800|ame2","10|rock:900|crim","10|rock:900|arock","10|rock:1000|arock ame2","10|rock:1000|crim","10|rock:1000|ame2",
"10|rock:1000,ame:500|","10|rock:1000,ame:500|arock","10|rock:800,ame:1000|ame2 crim","10|rock:800,ame:1300|","10|rock:900,ame:1400|ame2","10|rock:1000,ame:1500|","10|rock:1300,ame:900|crim","10|rock:1400,ame:750|crim",
"10|rock:1500,ame:1000|ame2","10|rock:1500,ame:1500|stufur","10|rock:1800,ame:1500|key",
// 116〜118 クモの洞くつの奥（クモの女王）
"4|rock:2000,coal:150|coal barna","4|rock:2000,coal:200|arock","4|ame:1000,coal:300|squeen",
// 119〜120 氷のくぼみ（氷づけのつるはし Lv17）
"13|rock:1500,coal:350|","13|rock:2000,coal:400|icepick",
// 121〜141 沼（つかまった仕立て屋・ワニ・沼のトロル）
"12|plank:800|bridge","5|wood:2500|sdead","5|wood:2500|outh","5|wood:3000|sdead croc","5|rock:2500|sdead","5|wood:3000,coal:300|croc","5|rock:3000|sdead","5|crock:30|outh sdead","5|wood:3500|croc",
"5|rock:3000,crock:50|coalT","5|wood:3500,crock:80|sdead","5|rock:3500,key:1|tailorR","5|wood:4000|sdead croc","5|rock:4000,crock:100|","5|leather:100,crock:120|chest","5|wood:4000,coal:500|sdead",
"5|rock:4500|croc","5|wood:4500,crock:150|stroll","5|rock:5000,coal:600|sdead","5|wood:5000|outh","5|rock:5000,crock:200|sdead",
// 142〜156 難破船の浜（歯車・ガイコツ・つかまった船長・船着き場）
"12|plank:1200|bridge","6|wood:3000,coal:400|scrap","6|rock:3000|skelb","6|wood:3500|scrap","6|rock:3500,coal:500|scrap skelb","6|gear:30|","6|wood:4000,gear:50|scrap","6|rock:4000|skelb chest",
"6|bone:40,gear:80|scrap","6|wood:4500,coal:600|skelb","6|rock:4500,gear:120|scrap","6|bone:80,gear:150|","6|wood:5000,rock:5000|scrap skelb","6|gear:250,bone:120,coin:500|captain","6|plank:1500,gear:200|dockN",
// 157〜171 火山の島（船で南へ）
"7||dockS","7|rock:3000|cblock vrock","7|coal:1000|cblock lava","7|rock:3500|amber","7|coal:1200,gear:100|cblock vrock","7|rock:3500|lava vrock","7|coal:1500|amber cblock","7|rock:4000,amber:50|vrock",
"7|coal:1800|ura2","7|rock:4000,amber:80|lava ura2","7|coal:2000,gear:200|cblock","7|rock:4500|ura2 amber","7|ura:150,coal:2000|lava vrock","7|rock:4500,amber:120|ura2","7|ura:200,coal:2500|cblock chest",
// 172〜180 赤い火山（トロルヘイムのポータル・スケリルのすみかの入り口）
"8|rock:5000|ura2 vrock","8|coal:2500,amber:150|lava","8|rock:5000,ura:250|amber vrock","8|coal:3000|portal","8|rock:5500,ura:300|ura2 lava","8|amber:200,coal:3000|vrock","8|rock:5500|ura2","8|ura:400,amber:250|lava","8|rock:6000,coal:3500|cave",
// 181〜192 スケリルのすみか（ルビー・スケリル・ソースコア2つ）
"11|rock:4000|barna","11|rock:4000|ruby2","11|rock:4500,ura:200|ruby2 lava","11|rock:4500|barna ruby2","11|ruby:500|lava","11|rock:5000,ruby:600|ruby2","11|rock:5000|barna chest","11|ruby:800,amber:300|ruby2",
"11|rock:5500,ruby:900|lava key","11|rock:6000,ruby:1000|skellir","11|ruby:1200,key:1|core","11|ruby:1500,amber:400|core"];
if(typeof module!=='undefined')module.exports={TROLL_TILES};
