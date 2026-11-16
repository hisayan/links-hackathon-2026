import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    host: true, // sandbox（sbx）の中で動かしても外から見えるように
    // /api へのリクエストを手元の backend（サーバー側）へ転送する
    proxy: { "/api": "http://localhost:8787" },
  },
});
