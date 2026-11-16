// .env の AWS 認証情報を読み込む（手元で動かすときだけ。Lambda では使わない）
import { loadEnv } from "../../scripts/env.mjs";

loadEnv();
