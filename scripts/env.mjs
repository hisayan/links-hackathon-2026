// .env を読み込む小さな道具（外部パッケージなし）
//
// Workshop Studio の「AWS CLI credentials」に表示される内容を、
// Mac 用 / Windows(PowerShell) 用 / Windows(cmd) 用のどれでも“そのまま貼り付け”で読めるようにしています。
//   export AWS_ACCESS_KEY_ID="..."      ← Mac / Linux
//   $Env:AWS_ACCESS_KEY_ID="..."        ← Windows PowerShell
//   set AWS_ACCESS_KEY_ID=...           ← Windows コマンドプロンプト
//   AWS_ACCESS_KEY_ID=...               ← ふつうの .env 形式
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");

/** .env の中身を { KEY: value } にして返す（ファイルが無ければ空） */
export function parseEnvFile(path = ENV_PATH) {
  if (!existsSync(path)) return {};
  const result = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("[")) continue;
    const m = line.match(/^(?:export\s+|set\s+|\$env:)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/i);
    if (!m) continue;
    let value = m[2].trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    result[m[1].toUpperCase()] = value;
  }
  return result;
}

/** .env の値を process.env に入れる（.env に書いた値を優先） */
export function loadEnv(path = ENV_PATH) {
  const values = parseEnvFile(path);
  Object.assign(process.env, values);
  return values;
}
