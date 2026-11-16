# links-hackathon-2026

LINKS:POWER of DATA x DATA 2026 ハッカソン向けのサンプルです。

地図で場所や建物を選び、Bedrock の Claude に質問する最小のサンプルです。

```
web-maplibre/  🗺️ 2D の地図（MapLibre）……ガイド本編で使う
web-navara/    🏙️ 3D の地図（Navara + PLATEAU）……付録 B で使う
backend/       🍳 Claude に質問する部分（どちらの地図からも共通で使う）
```

## 動かし方

> 💡 Claude Code に「README を読んで、このサンプルを動かして」と頼めば、代わりにやってくれます。

```bash
npm install            # 1回だけ（必要な部品をダウンロード）
npm run dev:backend    # ターミナル1: サーバー（backend）を起動
npm run dev:maplibre   # ターミナル2: 2D 地図 → http://localhost:5173
# または
npm run dev:navara     # ターミナル2: 3D 地図 → http://localhost:5174
```

AWS の認証情報（Workshop Studio で表示されるもの）が設定されている必要があります。

## しくみ

```
ブラウザ（クライアント）    手元 or AWS（サーバー）               AWS
web-maplibre / navara ──▶  backend (/api/ask)  ──▶  Bedrock (Claude)
  地図・画面だけ             認証情報はここだけ
```

## AWS に公開する（デプロイ）

`.env` の認証情報で、地図画面と backend をまとめて公開します（URL は 1 つ）。

```bash
npm run bootstrap       # AWS アカウントで最初の 1 回だけ（約 1 分）
npm run deploy          # 2D 版を公開（約 5 分）→ 最後に表示される AppUrl を開く
npm run deploy:navara   # 3D 版を公開する場合（2D 版と入れ替わります）
npm run destroy         # 片付け
```

```
CloudFront（AppUrl）
 ├─ /        → S3（地図画面）
 └─ /api/*   → Lambda（backend → Bedrock）
```

## 出典

- 地図: [国土地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)
- 地形: [国土地理院 標高タイル](https://maps.gsi.go.jp/development/ichiran.html)
- 3D 都市モデル: [Project PLATEAU](https://www.mlit.go.jp/plateau/)（国土交通省）全国の建築物 LOD1 / LOD2（[PLATEAU 配信サービス](https://docs.plateauview.mlit.go.jp/)）

## ライセンス

このリポジトリのコードは [MIT License](LICENSE) です。
同梱しているエージェントスキルは、それぞれの提供元のライセンスに従います。

- `.claude/skills/navara-usage/` … [maplibre/navara](https://github.com/maplibre/navara)（`@navaramap/three` 同梱、MIT OR Apache-2.0）
- `.claude/skills/plateau-api/` … [Project-PLATEAU/skills](https://github.com/Project-PLATEAU/skills)（MIT License）

