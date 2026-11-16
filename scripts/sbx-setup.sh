#!/bin/sh
# 🛡️ 安全コース: sandbox の中に Node.js / npm を入れる（sbxenv.yaml の postCreate から呼ばれる）
# - 足りないものだけ入れる（Playwright kit を使うと Node.js 24 は入っているが npm が無い）
# - sandbox は起動直後に裏で apt を動かしているので、空くまで待ってから実行する
set -e

pkgs=""
command -v node >/dev/null 2>&1 || pkgs="$pkgs nodejs"
command -v npm  >/dev/null 2>&1 || pkgs="$pkgs npm"

if [ -z "$pkgs" ]; then
  echo "Node.js $(node --version) / npm $(npm --version) はインストール済みです"
  exit 0
fi

i=0
until sudo apt-get update -qq 2>/dev/null; do
  i=$((i + 1))
  [ "$i" -ge 30 ] && { echo "apt-get update に失敗しました"; exit 1; }
  echo "apt が使用中なので待っています…（${i}）"
  sleep 5
done

# shellcheck disable=SC2086
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o DPkg::Lock::Timeout=300 $pkgs
echo "✅ Node.js $(node --version) / npm $(npm --version) を使えるようにしました"
