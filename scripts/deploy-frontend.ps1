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

Write-Host "==> 準備前端建置目錄..." -ForegroundColor Cyan
if (Test-Path $DistDir) { Remove-Item $DistDir -Recurse -Force }
New-Item -ItemType Directory -Path $DistDir | Out-Null

Copy-Item (Join-Path $Root "index.html") $DistDir
Copy-Item (Join-Path $Root "css") (Join-Path $DistDir "css") -Recurse
Copy-Item (Join-Path $Root "js") (Join-Path $DistDir "js") -Recurse

$indexPath = Join-Path $DistDir "index.html"
$content = Get-Content $indexPath -Raw -Encoding UTF8
$content = $content -replace "apiUrl: ''", "apiUrl: '$ApiUrl'"
Set-Content $indexPath $content -Encoding UTF8 -NoNewline

Write-Host "==> 上傳至 S3: $BucketName ..." -ForegroundColor Cyan
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
    Write-Host "==> 清除 CloudFront 快取..." -ForegroundColor Cyan
    aws cloudfront create-invalidation `
        --distribution-id $DistributionId `
        --paths "/*" | Out-Null
}

Write-Host ""
Write-Host "前端部署完成！" -ForegroundColor Green
Write-Host "  遊戲網址請至 CloudFormation Outputs 的 CloudFrontUrl 查看"
