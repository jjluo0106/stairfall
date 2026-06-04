import { Game, GameState } from './game.js';
import { LEADERBOARD_ENABLED } from './config.js';
import { fetchLeaderboard, submitScore } from './leaderboard.js';
import { gameAudio } from './audio.js?v=4';

const canvas = document.getElementById('gameCanvas');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const overlayScore = document.getElementById('overlayScore');
const submitScoreSection = document.getElementById('submitScoreSection');
const playerNameInput = document.getElementById('playerName');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const submitStatus = document.getElementById('submitStatus');
const startBtn = document.getElementById('startBtn');
const hpDisplay = document.getElementById('hpDisplay');
const floorDisplay = document.getElementById('floorDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardStatus = document.getElementById('leaderboardStatus');
const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');

const game = new Game(canvas);
const PLAYER_NAME_KEY = 'stairfall-player-name';

function loadSavedName() {
  return localStorage.getItem(PLAYER_NAME_KEY) || '';
}

function saveName(name) {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

function showOverlay(title, message, score = null, showSubmit = false) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;

  if (score !== null) {
    overlayScore.textContent = `最終分數：${score} · 樓層 ${game.floor}`;
    overlayScore.classList.remove('hidden');
  } else {
    overlayScore.classList.add('hidden');
  }

  if (showSubmit && LEADERBOARD_ENABLED) {
    submitScoreSection.classList.remove('hidden');
    playerNameInput.value = loadSavedName();
    submitStatus.textContent = '';
    submitScoreBtn.disabled = false;
  } else {
    submitScoreSection.classList.add('hidden');
  }

  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function updateHUD() {
  const hud = game.getHUD();
  hpDisplay.textContent = hud.hp;
  floorDisplay.textContent = hud.floor;
  scoreDisplay.textContent = hud.score;
}

function renderLeaderboard(scores, offline = false) {
  leaderboardList.innerHTML = '';

  if (offline) {
    leaderboardStatus.textContent = '本地模式（未設定 API，部署後可顯示全服排行）';
    return;
  }

  if (!scores.length) {
    leaderboardStatus.textContent = '尚無紀錄，成為第一位吧！';
    return;
  }

  leaderboardStatus.textContent = 'Top 10';

  for (const entry of scores) {
    const li = document.createElement('li');
    li.className = 'leaderboard-item';
    li.innerHTML = `
      <span class="rank">${entry.rank}</span>
      <span class="name">${escapeHtml(entry.playerName)}</span>
      <span class="meta">${entry.score} 分 · F${entry.floor}</span>
    `;
    leaderboardList.appendChild(li);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function refreshLeaderboard() {
  leaderboardStatus.textContent = '載入中…';
  leaderboardList.innerHTML = '';

  try {
    const { scores, offline } = await fetchLeaderboard();
    renderLeaderboard(scores, offline);
  } catch (err) {
    leaderboardStatus.textContent = err.message;
  }
}

async function handleSubmitScore() {
  const playerName = playerNameInput.value.trim();
  if (!playerName) {
    submitStatus.textContent = '請輸入暱稱';
    return;
  }

  submitScoreBtn.disabled = true;
  submitStatus.textContent = '提交中…';

  try {
    const hud = game.getHUD();
    await submitScore({
      playerName,
      score: hud.score,
      floor: hud.floor,
    });
    saveName(playerName);
    submitStatus.textContent = '已提交至全服排行榜！';
    await refreshLeaderboard();
  } catch (err) {
    submitStatus.textContent = err.message;
    submitScoreBtn.disabled = false;
  }
}

function gameLoop(timestamp) {
  game.update(timestamp);
  game.draw(timestamp);
  updateHUD();

  if (game.state === GameState.GAME_OVER && !game.gameOverHandled) {
    game.gameOverHandled = true;
    void gameAudio.playGameOver();
    showOverlay(
      '遊戲結束',
      'HP 歸零或掉出畫面了！再試一次吧。',
      game.getHUD().score,
      true
    );
    startBtn.textContent = '再玩一次';
  }

  requestAnimationFrame(gameLoop);
}

function updateSoundToggleLabel() {
  if (!soundToggleBtn) return;
  soundToggleBtn.textContent = gameAudio.isEnabled() ? '🔊 音效' : '🔇 靜音';
  soundToggleBtn.setAttribute('aria-pressed', gameAudio.isEnabled() ? 'true' : 'false');
}

startBtn.addEventListener('click', async () => {
  await gameAudio.unlock();
  gameAudio.playStart();
  hideOverlay();
  game.start();
});

if (soundToggleBtn) {
  updateSoundToggleLabel();
  soundToggleBtn.addEventListener('click', async () => {
    const wasOff = !gameAudio.isEnabled();
    gameAudio.toggle();
    if (gameAudio.isEnabled()) {
      await gameAudio.unlock();
      if (wasOff) gameAudio.playUiClick();
    }
    updateSoundToggleLabel();
  });
}

submitScoreBtn.addEventListener('click', handleSubmitScore);

playerNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSubmitScore();
  }
});

refreshLeaderboardBtn.addEventListener('click', refreshLeaderboard);

overlay.addEventListener('click', () => {
  void gameAudio.unlock();
});

canvas.addEventListener('click', () => {
  void gameAudio.unlock();
});

document.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
  void gameAudio.unlock();
  game.handleKeyDown(e.code);
});

document.addEventListener('keyup', (e) => {
  game.handleKeyUp(e.code);
});

showOverlay(
  '小朋友下樓梯',
  '用 ← → 或 A D 左右移動。重力會讓你往下掉，站在平台上才能繼續衝！小心紅色尖刺。'
);
startBtn.textContent = '開始遊戲';

refreshLeaderboard();
requestAnimationFrame(gameLoop);
