# おとなりさん（Godot版）

three.js で作った「おとなりさん（アルファ1）」を、Godot 4.7 で作り直したものです。
家・小物・おとなりさんの動き・謎解き・お話・音・セーブまで同じ動きになるように移しています。

## 遊ぶ・中を見る

1. Godot 4.7 を入れる（https://godotengine.org/）
2. Godot で `godot/otonari/project.godot` を開く
3. F5 で遊べます（パソコンでは Forward+ で描くので、Web版より影やすみの暗がりがきれいです）

## ファイル

| 場所 | 中身 |
| --- | --- |
| `src/*.gd` | プログラム本体（部屋ごと・しくみごとに分けてある） |
| `game.gd` | `src/*.gd` をつなげたもの。Godot はこれを読む（`python3 tools/build.py` で作る） |
| `assets/` | three.js 版から書き出したテクスチャ・音・材質 |
| `fonts/` | 画面の文字（M PLUS Rounded 1c、使う字だけ） |
| `tests/` | 動きのテストと、見比べ用のスクリーンショット |
| `tools/` | `build.py`（つなげる）、`where.py`（game.gd の行 → src の行） |

`src/` を直したら `python3 tools/build.py` を実行してください。

## テスト

```sh
godot --headless --path . -s res://tests/route1.gd   # 攻略ルート1（ボイラー → ピッキング道具）
godot --headless --path . -s res://tests/route2.gd   # 攻略ルート2（ベル → 銅の鍵）
godot --headless --path . -s res://tests/hide.gd     # 見失う・隠れる
godot --headless --path . -s res://tests/cam.gd      # 監視カメラのレバー・セーブ
godot --headless --path . -s res://tests/carn.gd     # 遊園地の悪夢のあとのボタン
godot --headless --path . -s res://tests/misc.gd     # エレベーター・サメトロン・セーブ
godot --headless --path . -s res://tests/learn.gd    # 学習（入った所をふさぐ）
godot --headless --path . -s res://tests/soak.gd     # 400秒ほうっておく
```

どれも three.js 版の同じ名前のテストと同じ手順で、同じ結果になることを確かめてあります。
テストは保存先を共有するので、1つずつ実行してください。

## Web版

```sh
godot --headless --path . --export-release "Web" build/web/index.html
```

Web版は Compatibility（WebGL 2）で描きます。空からのまわりの光が室内に届かないため、
Web版だけ平らな色のまわりの光に置きかえ、three.js 版と同じ明るさになるよう合わせています
（`src/09_render.gd` の `COMPAT_AMB`）。
