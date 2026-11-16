#!/bin/sh
# 🛡️ 安全コース: sandbox の中に Node.js / npm を入れる（sbxenv.yaml の postCreate から呼ばれる）
# - apt の Node.js（Debian 13 では v20）は古いので、nodejs.org から公式の LTS（v24）を入れる
#   （nodejs.org は sandbox の balanced 設定で最初から通信が許可されている）
# - すでに新しい Node.js と npm があれば何もしない
set -e

NODE_LINE=24
BASE="https://nodejs.org/dist/latest-v${NODE_LINE}.x"

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  major=$(node -p 'process.versions.node.split(".")[0]')
  if [ "$major" -ge "$NODE_LINE" ]; then
    echo "Node.js $(node --version) / npm $(npm --version) はインストール済みです"
    exit 0
  fi
fi

case "$(uname -m)" in
  x86_64 | amd64) arch=x64 ;;
  aarch64 | arm64) arch=arm64 ;;
  *) echo "この CPU（$(uname -m)）には対応していません"; exit 1 ;;
esac

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# ファイル名とチェックサム（壊れていないかの確認用）を取ってくる
line=$(curl -fsSL "$BASE/SHASUMS256.txt" | grep " node-v.*-linux-${arch}\.tar\.gz$")
file=${line##* }
echo "$file をダウンロードしています…"
curl -fsSL -o "$tmp/$file" "$BASE/$file"
(cd "$tmp" && echo "$line" | sha256sum -c --quiet -)

sudo tar -xzf "$tmp/$file" -C /usr/local --strip-components=1 --no-same-owner
hash -r 2>/dev/null || true
echo "✅ Node.js $(/usr/local/bin/node --version) / npm $(/usr/local/bin/npm --version) を使えるようにしました"
