// AWS に「お店を出す」ための設計図（CDK）
// Lambda（厨房）を作り、Bedrock を呼ぶ許可だけを与えて、URL で公開します。
import { App, CfnOutput, Duration, Stack } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { fileURLToPath } from "node:url";

const app = new App();
const stack = new Stack(app, "LinksHackathonBackend", {
  env: { region: process.env.AWS_REGION ?? "us-east-1" },
});

const fn = new NodejsFunction(stack, "AskFunction", {
  entry: fileURLToPath(new URL("../src/lambda.ts", import.meta.url)),
  runtime: lambda.Runtime.NODEJS_24_X,
  timeout: Duration.seconds(60),
  memorySize: 512,
  environment: {
    BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-sonnet-5-5",
  },
});

// クロスリージョン推論（us.～）では、推論プロファイルと各リージョンのモデルの両方に許可が必要
fn.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    resources: [
      `arn:aws:bedrock:*:${stack.account}:inference-profile/*`,
      "arn:aws:bedrock:*::foundation-model/*",
    ],
  }),
);

const url = fn.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ["*"],
    allowedMethods: [lambda.HttpMethod.POST],
    allowedHeaders: ["content-type"],
  },
});

new CfnOutput(stack, "AskUrl", { value: url.url });
