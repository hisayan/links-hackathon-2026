# Claude Code 向けメモ

## sandbox（Docker Sandboxes）で動かすとき

- sandbox の設定は `sbxenv.yaml` にあります。ポート・ネットワーク許可・初期セットアップについて案内する前に、まずこのファイルを確認してください。
- 地図アプリのポート（2D: 5173 / 3D: 5174）は `sbxenv.yaml` の `ports:` でホストに公開済みです。`sbx port publish` を案内する必要はなく、手元のブラウザで http://localhost:5173 / http://localhost:5174 をそのまま開けます。
- backend（8787）は公開していません。ブラウザからは Vite の `/api` プロキシ経由で使います。
