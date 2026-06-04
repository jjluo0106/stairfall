#!/usr/bin/env bash
set -euo pipefail

API_URL="$1"
BUCKET="$2"
CF_ID="${3:-}"
REGION="${4:-ap-northeast-1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST"
cp "$ROOT/index.html" "$DIST/"
cp -r "$ROOT/css" "$ROOT/js" "$DIST/"

sed -i.bak "s|apiUrl: ''|apiUrl: '$API_URL'|" "$DIST/index.html"
rm -f "$DIST/index.html.bak"

aws s3 sync "$DIST" "s3://$BUCKET" --region "$REGION" --delete \
  --cache-control "public, max-age=3600" --exclude "index.html"
aws s3 cp "$DIST/index.html" "s3://$BUCKET/index.html" --region "$REGION" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html; charset=utf-8"

if [[ -n "$CF_ID" ]]; then
  aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths "/*" >/dev/null
fi

echo "前端已上傳至 s3://$BUCKET"
