// AWS Lambda（Function URL）として動かすときの入り口
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { handleAsk } from "./http.js";

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const body =
    event.body && event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
  const result = await handleAsk(body);
  return {
    statusCode: result.status,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: result.body,
  };
};
