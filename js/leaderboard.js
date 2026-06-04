import { API_BASE_URL, LEADERBOARD_ENABLED } from './config.js';

export async function fetchLeaderboard() {
  if (!LEADERBOARD_ENABLED) {
    return { scores: [], offline: true };
  }

  const res = await fetch(`${API_BASE_URL}/scores`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`排行榜載入失敗 (${res.status})`);
  }

  const data = await res.json();
  return { scores: data.scores || [], offline: false };
}

export async function submitScore({ playerName, score, floor }) {
  if (!LEADERBOARD_ENABLED) {
    return { ok: false, offline: true };
  }

  const res = await fetch(`${API_BASE_URL}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, score, floor }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `提交失敗 (${res.status})`);
  }

  return { ok: true, offline: false };
}
