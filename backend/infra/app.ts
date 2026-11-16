// AWS に「お店を出す」ための設計図（CDK）
//
//   CloudFront（公開 URL は 1 つだけ）
//    ├─ /        → S3（地図画面 = クライアント。web-maplibre か web-navara の dist）
//    └─ /api/*   → Lambda（backend = サーバー。Bedrock を呼ぶ）
//
// 地図画面は手元と同じく /api/ask を呼ぶだけなので、URL や CORS の設定は不要です。
import { App, CfnOutput, Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const app = new App();
const web = app.node.tryGetContext("web") ?? "web-maplibre"; // -c web=web-navara で 3D 版
const distDir = fileURLToPath(new URL(`../../${web}/dist`, import.meta.url));
if (!existsSync(distDir)) {
  throw new Error(`${web}/dist がありません。リポジトリの一番上のフォルダーで npm run deploy（3D 版は npm run deploy:navara）を実行してください（ビルドも自動で行われます）`);
}

const stack = new Stack(app, "LinksHackathonApp", {
  env: { region: process.env.AWS_REGION ?? "us-east-1" },
});

// --- サーバー: Bedrock を呼ぶ Lambda ---
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
const fnUrl = fn.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.NONE });

// --- クライアント: 地図画面を置く S3（直接は公開せず CloudFront 経由のみ） ---
const bucket = new s3.Bucket(stack, "WebBucket", {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: RemovalPolicy.DESTROY, // ハッカソン用: 削除時に中身ごと消す
  autoDeleteObjects: true,
});

const distribution = new cloudfront.Distribution(stack, "Distribution", {
  defaultRootObject: "index.html",
  defaultBehavior: {
    origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
  additionalBehaviors: {
    "/api/*": {
      origin: new origins.FunctionUrlOrigin(fnUrl),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
    },
  },
});

new s3deploy.BucketDeployment(stack, "DeployWeb", {
  sources: [s3deploy.Source.asset(distDir)],
  destinationBucket: bucket,
  distribution, // 更新したら CloudFront のキャッシュも消す
  memoryLimit: 1024, // 3D 版（約 30MB）でも足りるように
});

new CfnOutput(stack, "AppUrl", { value: `https://${distribution.distributionDomainName}/` });
new CfnOutput(stack, "Web", { value: web });
