param(
    [string]$StackName = "stairfall",
    [string]$Region = "ap-northeast-1",
    [string]$ProjectName = "stairfall"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$InfraDir = Join-Path $Root "infra"
$BackendDir = Join-Path $Root "backend"

Write-Host "==> 安裝 Lambda 依賴..." -ForegroundColor Cyan
Push-Location $BackendDir
npm install --omit=dev
Pop-Location

Write-Host "==> SAM build..." -ForegroundColor Cyan
Push-Location $InfraDir
sam build --template-file template.yaml
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> SAM deploy..." -ForegroundColor Cyan
sam deploy `
    --stack-name $StackName `
    --region $Region `
    --resolve-s3 `
    --capabilities CAPABILITY_IAM `
    --parameter-overrides "ProjectName=$ProjectName" `
    --no-fail-on-empty-changeset

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> 取得 Stack Outputs..." -ForegroundColor Cyan
$outputs = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs" `
    --output json | ConvertFrom-Json

function Get-Output($key) {
    ($outputs | Where-Object { $_.OutputKey -eq $key }).OutputValue
}

$apiUrl = Get-Output "ApiUrl"
$bucket = Get-Output "WebsiteBucketName"
$cfUrl = Get-Output "CloudFrontUrl"
$cfId = Get-Output "CloudFrontDistributionId"

Write-Host ""
Write-Host "部署完成！" -ForegroundColor Green
Write-Host "  API URL:       $apiUrl"
Write-Host "  S3 Bucket:     $bucket"
Write-Host "  CloudFront:    $cfUrl"
Write-Host ""
Write-Host "下一步：執行 deploy-frontend.ps1 上傳前端" -ForegroundColor Yellow
Write-Host "  .\scripts\deploy-frontend.ps1 -ApiUrl `"$apiUrl`" -BucketName `"$bucket`" -DistributionId `"$cfId`""

Pop-Location
