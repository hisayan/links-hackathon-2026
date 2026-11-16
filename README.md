# LINKS ハッカソン サンプル

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
npm run dev:backend    # ターミナル1: 厨房（backend）を起動
npm run dev:maplibre   # ターミナル2: 2D 地図 → http://localhost:5173
# または
npm run dev:navara     # ターミナル2: 3D 地図 → http://localhost:5174
```

AWS の認証情報（Workshop Studio で表示されるもの）が設定されている必要があります。

## しくみ

```
ブラウザ（客席）            手元 or AWS（厨房）             AWS
web-maplibre / navara ──▶  backend (/api/ask)  ──▶  Bedrock (Claude)
  地図・画面だけ             認証情報はここだけ
```

## AWS に公開する（デプロイ）

```bash
npm run deploy -w backend   # Lambda を作成し、URL が backend/cdk-outputs.json に出力される
```

## 出典

- 地図: [国土地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)
- 3D 都市モデル: [Project PLATEAU 千代田区（2023年度）](https://www.geospatial.jp/ckan/dataset/plateau-13101-chiyoda-ku-2023)
