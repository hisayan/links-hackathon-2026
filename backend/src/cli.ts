// 動作確認用: npm run ask -w backend -- "こんにちは"
import { ask } from "./ask.js";

const question = process.argv.slice(2).join(" ") || "こんにちは。あなたは誰？";
console.log(await ask({ question }));
