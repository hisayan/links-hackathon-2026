import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
    host: true, // sandbox（sbx）の中で動かしても外から見えるように
    // /api へのリクエストを手元の backend（厨房）へ転送する
    proxy: { "/api": "http://localhost:8787" },
  },
  // @navaramap/font が別バージョンの three を引き込むため、1つにまとめる
  resolve: { dedupe: ["three"] },
  build: { target: "es2022" }, // top-level await を使うため
});
