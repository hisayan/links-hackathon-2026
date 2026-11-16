// Bedrock の Claude に質問する部分（サーバー側だけで動くコード）
// AWS の認証情報はここでだけ使われ、ブラウザには渡りません。
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-sonnet-5-5";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const SYSTEM_PROMPT = `あなたは国土交通省のオープンデータ（Project LINKS / PLATEAU）を使った
まちづくりハッカソンのアシスタントです。
ユーザーが地図上で選んだ場所や建物の情報（context）をもとに、質問に日本語で簡潔に答えてください。
- 与えられた情報にないことは推測であると明示する
- 箇条書き中心で 300 字程度まで`;

export type AskInput = {
  question: string;
  // 地図で選んだ場所や建物の属性など（自由な形のデータ）
  context?: unknown;
};

export async function ask({ question, context }: AskInput): Promise<string> {
  const text =
    context === undefined
      ? question
      : `## context\n${JSON.stringify(context, null, 2)}\n\n## 質問\n${question}`;

  const res = await client.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [{ role: "user", content: [{ text }] }],
      inferenceConfig: { maxTokens: 1024 },
    }),
  );

  return (
    res.output?.message?.content
      ?.map((c) => ("text" in c ? c.text : ""))
      .join("") ?? ""
  );
}
