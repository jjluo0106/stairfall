/** 本地開發留空；部署時由 deploy-frontend 腳本注入 API URL */
export const API_BASE_URL =
  (typeof window !== 'undefined' && window.STAIRFALL_CONFIG?.apiUrl) || '';

export const LEADERBOARD_ENABLED = Boolean(API_BASE_URL);
