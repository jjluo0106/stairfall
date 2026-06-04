param(
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,

    [Parameter(Mandatory = $true)]
    [string]$BucketName,

    [string]$DistributionId = "",
    [string]$Region = "ap-northeast-1"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $Root "dist"

Write-Host "==> Preparing frontend build..." -ForegroundColor Cyan
if (Test-Path $DistDir) { Remove-Item $DistDir -Recurse -Force }
New-Item -ItemType Directory -Path $DistDir | Out-Null

Copy-Item (Join-Path $Root "index.html") $DistDir
Copy-Item (Join-Path $Root "css") (Join-Path $DistDir "css") -Recurse
Copy-Item (Join-Path $Root "js") (Join-Path $DistDir "js") -Recurse

$indexPath = Join-Path $DistDir "index.html"
$content = Get-Content $indexPath -Raw -Encoding UTF8
$content = $content -replace "apiUrl: ''", "apiUrl: '$ApiUrl'"
Set-Content $indexPath $content -Encoding UTF8 -NoNewline

Write-Host "==> Uploading to S3: $BucketName ..." -ForegroundColor Cyan
aws s3 sync $DistDir "s3://$BucketName" `
    --region $Region `
    --delete `
    --cache-control "public, max-age=3600" `
    --exclude "index.html"

aws s3 cp (Join-Path $DistDir "index.html") "s3://$BucketName/index.html" `
    --region $Region `
    --cache-control "no-cache, no-store, must-revalidate" `
    --content-type "text/html; charset=utf-8"

if ($DistributionId) {
    Write-Host "==> Invalidating CloudFront cache..." -ForegroundColor Cyan
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    aws cloudfront create-invalidation `
        --distribution-id $DistributionId `
        --paths "/*" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: CloudFront invalidation failed (need cloudfront:CreateInvalidation on IAM user)." -ForegroundColor Yellow
    }
    $ErrorActionPreference = $prevEap
}

Write-Host ""
Write-Host "Frontend deploy complete." -ForegroundColor Green
Write-Host "  Open CloudFormation output CloudFrontUrl in your browser."
