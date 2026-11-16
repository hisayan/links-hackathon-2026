// Claude Code の awsCredentialExport から呼ばれ、.env の AWS 認証情報を Claude Code に渡す。
// （.claude/settings.json の "awsCredentialExport" を参照）
import { ENV_PATH, parseEnvFile } from "./env.mjs";

const env = parseEnvFile();
const missing = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"].filter(
  (k) => !env[k] || env[k].includes("ここに"),
);

if (missing.length > 0) {
  console.error(
    `AWS の認証情報が見つかりません: ${missing.join(", ")}\n` +
      `→ Workshop Studio の「AWS CLI credentials」をコピーして ${ENV_PATH} に貼り付けてください。`,
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    Credentials: {
      AccessKeyId: env.AWS_ACCESS_KEY_ID,
      SecretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      SessionToken: env.AWS_SESSION_TOKEN,
    },
  }),
);
