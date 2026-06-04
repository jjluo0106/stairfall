#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-stairfall}"
REGION="${REGION:-ap-northeast-1}"
PROJECT_NAME="${PROJECT_NAME:-stairfall}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> 安裝 Lambda 依賴..."
(cd "$ROOT/backend" && npm install --omit=dev)

echo "==> SAM build & deploy..."
(cd "$ROOT/infra" && sam build && sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides "ProjectName=$PROJECT_NAME" \
  --no-fail-on-empty-changeset)

API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" --output text)
CF_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
CF_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text)

bash "$ROOT/scripts/deploy-frontend.sh" "$API_URL" "$BUCKET" "$CF_ID" "$REGION"

echo ""
echo "部署完成: $CF_URL"
