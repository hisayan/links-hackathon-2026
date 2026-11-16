// .env の AWS 認証情報を読み込んでから、後ろに書いたコマンドを実行する
// 例: node scripts/with-env.mjs cdk deploy
// （Claude Code 自身は awsCredentialExport で .env を読むが、Claude が実行するコマンドには渡らないため）
import { spawn } from "node:child_process";
import { loadEnv } from "./env.mjs";

const values = loadEnv();
if (!values.AWS_ACCESS_KEY_ID) {
  console.error("⚠️ .env に AWS の認証情報がありません（3章の手順で .env を作ってください）");
  process.exit(1);
}
process.env.AWS_REGION ??= process.env.AWS_DEFAULT_REGION ?? "us-east-1";

const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 1));
