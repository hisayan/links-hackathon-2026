// ブラウザ側（客席）のコード。3D 地図（Navara）の表示と、backend への質問だけを担当します。
import ThreeView, { Color, JAPAN_GSI_ELEVATION_DECODER } from "@navaramap/three";
import {
  DefaultPlugin,
  type DefaultDescriptions,
} from "@navaramap/three-default-plugin";

// PLATEAU 配信サービスの「全国の建物」（各自治体の最新年度）
const PLATEAU_BLDG = {
  lod1: "https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/all-bldg-lod1-latest/tileset.json",
  lod2: "https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/all-bldg-lod2-latest/tileset.json",
} as const;
type Lod = keyof typeof PLATEAU_BLDG;

// --- 1. 3D 地図を準備する（順番が大事: 作る → プラグイン → init） ---
const view = new ThreeView<DefaultDescriptions>({
  container: document.querySelector<HTMLDivElement>("#map")!,
});
const defaultPlugin = new DefaultPlugin();
view.addPlugin(defaultPlugin);
await view.init();
defaultPlugin.addDefaultPhotorealScene(); // 空・太陽・大気
// 太陽の位置は「日時」で決まる。指定しないと“今”になり、夜に開くと真っ暗になるので固定する。
// （UTC で書く: 2026-11-28T03:00:00Z = 日本時間 12:00）
view.atmosphere.date = new Date("2026-11-28T03:00:00Z");

// --- 2. 地形（国土地理院 標高タイル）※地図や建物より先に追加する ---
const dem = view.addSource({
  type: "raster-dem",
  url: "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
  minZoom: 6,
  maxZoom: 15,
  elevationDecoder: JAPAN_GSI_ELEVATION_DECODER(),
});
view.addLayer({ type: "terrain", source: dem, terrain: {} });

// --- 3. 背景の地図（国土地理院 淡色地図）を地形に貼る ---
const gsi = view.addSource({
  type: "raster-tile",
  url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
  maxZoom: 18,
});
view.addLayer({ type: "raster", source: gsi });

// --- 4. PLATEAU の建物（LOD1 = 箱型 / LOD2 = 屋根の形あり）を切り替える ---
const buildingLayers: Partial<Record<Lod, ReturnType<typeof view.addLayer>>> = {};

function showBuildings(lod: Lod) {
  // 初めて選んだ LOD だけデータを読み込み、あとは表示/非表示を切り替える
  if (!buildingLayers[lod]) {
    const source = view.addSource({ type: "3d-tiles", url: PLATEAU_BLDG[lod] });
    buildingLayers[lod] = view.addLayer({
      type: "3d-tiles",
      source,
      model: { color: new Color().setStyle("#ffffff"), metalness: 0, roughness: 1 },
    });
  }
  for (const key of Object.keys(buildingLayers) as Lod[]) {
    buildingLayers[key]!.update({ model: { show: key === lod } });
  }
}

const lodEl = document.querySelector<HTMLSelectElement>("#lod")!;
lodEl.addEventListener("change", () => showBuildings(lodEl.value as Lod));
showBuildings(lodEl.value as Lod);

view.attribution?.add([
  {
    attribution: "国土地理院",
    attributionUrl: "https://maps.gsi.go.jp/development/ichiran.html",
  },
  {
    attribution: "3D都市モデル（Project PLATEAU）国土交通省",
    attributionUrl: "https://www.mlit.go.jp/plateau/",
  },
]);

// 東京駅の西側（丸の内）を斜めから見下ろす
view.setCamera({ lng: 139.7625, lat: 35.676, height: 900, heading: 20, pitch: -35, roll: 0 });

// --- 5. 建物をクリック → 属性を表示 → Claude に聞く ---
const selectedEl = document.querySelector<HTMLParagraphElement>("#selected")!;
const questionEl = document.querySelector<HTMLTextAreaElement>("#question")!;
const askBtn = document.querySelector<HTMLButtonElement>("#ask")!;
const answerEl = document.querySelector<HTMLDivElement>("#answer")!;

let context: Record<string, unknown> | undefined;

view.on("featureClick", (info) => {
  if (!info?.properties) return;
  context = info.properties as Record<string, unknown>;
  const name = context["gml:name"] ?? context["名称"] ?? "（名前なし）";
  selectedEl.textContent = `選んだ建物: ${name}\n属性の数: ${Object.keys(context).length}`;
  askBtn.disabled = false;
});

askBtn.addEventListener("click", async () => {
  askBtn.disabled = true;
  answerEl.textContent = "考え中…";
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? "/api/ask"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: questionEl.value, context }),
    });
    const data = await res.json();
    answerEl.textContent = data.answer ?? `エラー: ${data.error}`;
  } catch (err) {
    answerEl.textContent = `backend につながりません。npm run dev:backend を動かしていますか？\n${err}`;
  } finally {
    askBtn.disabled = false;
  }
});
