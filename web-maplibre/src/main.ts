// ブラウザで動くクライアントのコード。地図の表示と、backend への質問だけを担当します。
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// 国土地理院の「淡色地図」タイル（API キー不要）
const map = new MapLibreMap({
  container: "map",
  style: {
    version: 8,
    sources: {
      gsi: {
        type: "raster",
        tiles: ["https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 18,
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
      },
    },
    layers: [{ id: "gsi", type: "raster", source: "gsi" }],
  },
  center: [139.7671, 35.6812], // 東京駅
  zoom: 13,
});
map.addControl(new NavigationControl());

const selectedEl = document.querySelector<HTMLParagraphElement>("#selected")!;
const questionEl = document.querySelector<HTMLTextAreaElement>("#question")!;
const askBtn = document.querySelector<HTMLButtonElement>("#ask")!;
const answerEl = document.querySelector<HTMLDivElement>("#answer")!;

let context: Record<string, unknown> | undefined;
const marker = new Marker();

map.on("click", (e) => {
  const { lng, lat } = e.lngLat;
  marker.setLngLat(e.lngLat).addTo(map);
  context = { 緯度: lat.toFixed(5), 経度: lng.toFixed(5), ズーム: map.getZoom().toFixed(1) };
  selectedEl.textContent = `選んだ場所: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  askBtn.disabled = false;
});

askBtn.addEventListener("click", async () => {
  askBtn.disabled = true;
  answerEl.textContent = "考え中…";
  try {
    // /api/ask は backend（サーバー）につながっています
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
