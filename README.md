# 小朋友下樓梯

NS-Shaft 風格的 HTML5 Canvas 小遊戲，含 AWS 靜態部署與全服排行榜。

## 本地執行

```powershell
python -m http.server 8080
```

瀏覽器開啟 http://localhost:8080（本地模式不連 API，排行榜顯示離線提示）。

## 架構

```
瀏覽器
  ├─ CloudFront → S3（index.html / css / js）
  └─ API Gateway HTTP API → Lambda → DynamoDB（排行榜）
```

| 元件 | 用途 |
|------|------|
| **S3 + CloudFront** | 靜態託管遊戲前端 |
| **API Gateway** | REST 入口 `/scores` |
| **Lambda** | 讀寫排行榜 |
| **DynamoDB** | 儲存 Top 10 分數 |

## 前置需求

- [AWS CLI](https://aws.amazon.com/cli/) 已設定凭证（`aws configure`）
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 18+（Lambda 依賴打包用）

## CI/CD（GitHub Actions）

推送到 `main` 時會依變更路徑自動部署：

| 變更路徑 | 動作 |
|----------|------|
| `index.html`、`css/`、`js/` | 上傳 S3 + 注入 API URL + 嘗試清除 CloudFront 快取 |
| `backend/`、`infra/` | `sam build` + `sam deploy`，接著部署前端 |
| 手動 | GitHub → Actions → **Deploy Stairfall to AWS** → Run workflow |

### 必要設定（GitHub Repository Secrets）

在 stairfall 倉庫的 **Settings → Secrets and variables → Actions** 新增（可與 resume-website 共用同一組 IAM 金鑰）：

| Secret | 說明 |
|--------|------|
| `AWS_ACCESS_KEY_ID` | 具 S3、CloudFormation、SAM/Lambda 權限的 IAM 使用者 |
| `AWS_SECRET_ACCESS_KEY` | 對應 Secret |

建議 IAM 額外包含 `cloudfront:CreateInvalidation`（你本機部署時曾出現權限不足；CI 會 `continue-on-error`，沒權限時只是快取較晚更新）。

區域固定為 **ap-northeast-1**，CloudFormation stack 名稱為 **stairfall**（與 `infra/samconfig.toml.example` 一致）。

## 一鍵部署（本機）

```powershell
cd scripts
.\deploy-all.ps1
```

或分步部署：

```powershell
# 1. 部署 API + DynamoDB + S3 + CloudFront
.\deploy-backend.ps1

# 2. 依 Output 上傳前端（注入 API URL）
.\deploy-frontend.ps1 `
  -ApiUrl "https://xxxx.execute-api.ap-northeast-1.amazonaws.com/prod" `
  -BucketName "stairfall-website-123456789012" `
  -DistributionId "E1234567890ABC"
```

部署完成後，CloudFormation Outputs 的 `CloudFrontUrl` 即為公開遊戲網址。

## API 規格

### GET `/scores`

回傳 Top 10 排行榜。

```json
{
  "scores": [
    { "rank": 1, "playerName": "小明", "score": 520, "floor": 42, "createdAt": "2026-06-04T..." }
  ]
}
```

### POST `/scores`

提交分數。

```json
{ "playerName": "小明", "score": 520, "floor": 42 }
```

## 專案結構

```
stairfall/
├── index.html / css / js     # 遊戲前端
├── backend/                  # Lambda 原始碼
├── infra/template.yaml       # AWS SAM 基礎設施
└── scripts/                  # 部署腳本
```

## 自訂區域

修改 `scripts/deploy-*.ps1` 的 `-Region` 參數，或複製 `infra/samconfig.toml.example` 為 `samconfig.toml` 後調整。

## 費用估算（低流量）

- S3 / CloudFront / Lambda / DynamoDB 皆為按量計費
- 個人 side project 通常落在 AWS 免費額度內
