#!/bin/sh
# 🛡️ 安全コース: sandbox の中に Node.js / npm を入れる（sbxenv.yaml の postCreate から呼ばれる）
# sandbox は起動直後に自分で apt を動かしていることがあるので、空くまで待ってから実行する。
set -e

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  echo "Node.js $(node --version) はインストール済みです"
  exit 0
fi

i=0
until sudo apt-get update -qq; do
  i=$((i + 1))
  [ "$i" -ge 30 ] && { echo "apt-get update に失敗しました"; exit 1; }
  echo "apt が使用中なので待っています…（${i}）"
  sleep 5
done

sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o DPkg::Lock::Timeout=300 nodejs npm
echo "✅ Node.js $(node --version) / npm $(npm --version) をインストールしました"
