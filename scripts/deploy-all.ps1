param(
    [string]$StackName = "stairfall",
    [string]$Region = "ap-northeast-1",
    [string]$ProjectName = "stairfall"
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot

Write-Host "========== 1/2 部署後端基礎設施 ==========" -ForegroundColor Magenta
& (Join-Path $ScriptDir "deploy-backend.ps1") -StackName $StackName -Region $Region -ProjectName $ProjectName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "========== 2/2 部署前端 ==========" -ForegroundColor Magenta

$outputs = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs" `
    --output json | ConvertFrom-Json

function Get-Output($key) {
    ($outputs | Where-Object { $_.OutputKey -eq $key }).OutputValue
}

& (Join-Path $ScriptDir "deploy-frontend.ps1") `
    -ApiUrl (Get-Output "ApiUrl") `
    -BucketName (Get-Output "WebsiteBucketName") `
    -DistributionId (Get-Output "CloudFrontDistributionId") `
    -Region $Region

Write-Host ""
Write-Host "全部部署完成！遊戲網址：" -ForegroundColor Green
Write-Host "  $(Get-Output 'CloudFrontUrl')"
