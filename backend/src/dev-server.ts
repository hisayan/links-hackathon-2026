// 手元の PC で動かすための小さなサーバー（http://localhost:8787）
// フロントエンド（Vite）からは /api/ask で呼ばれます。
import "./load-env.js"; // ← 最初に読む（AWS の認証情報を .env から）
import { createServer } from "node:http";
import { handleAsk } from "./http.js";

const PORT = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/ask") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const result = await handleAsk(body);
    res.writeHead(result.status, { "content-type": "application/json; charset=utf-8" });
    res.end(result.body);
    return;
  }
  if (req.method === "GET" && req.url === "/api/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, "0.0.0.0", () => {
  console.log(`backend: http://localhost:${PORT}/api/ask で待っています`);
});
