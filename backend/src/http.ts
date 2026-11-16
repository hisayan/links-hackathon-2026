// 手元（dev-server）と AWS（Lambda）で共通の「注文の受け付け」処理
import { ask } from "./ask.js";

export type HttpResult = { status: number; body: string };

export async function handleAsk(rawBody: string | undefined): Promise<HttpResult> {
  let input: { question?: unknown; context?: unknown };
  try {
    input = JSON.parse(rawBody ?? "{}");
  } catch {
    return json(400, { error: "JSON の形式が正しくありません" });
  }
  if (typeof input.question !== "string" || input.question.trim() === "") {
    return json(400, { error: "question（質問文）を入れてください" });
  }

  try {
    const answer = await ask({ question: input.question, context: input.context });
    return json(200, { answer });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return json(500, { error: message });
  }
}

function json(status: number, data: unknown): HttpResult {
  return { status, body: JSON.stringify(data) };
}
