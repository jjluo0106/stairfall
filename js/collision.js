import { SPIKE_HEIGHT } from './constants.js';

/**
 * 單向碰撞：玩家從上方落下時才能站在平台上
 */
export function checkStairCollision(player, stair) {
  const prevBottom = player.y + player.height - player.vy;
  const currBottom = player.y + player.height;

  const horizontallyAligned =
    player.x + player.width > stair.x + 4 &&
    player.x < stair.x + stair.width - 4;

  const fallingOnto =
    player.vy >= 0 &&
    prevBottom <= stair.y + 2 &&
    currBottom >= stair.y;

  return horizontallyAligned && fallingOnto;
}

/** 玩家已站在平台上（隨平台一起上移） */
export function isStandingOn(player, stair) {
  const horizontallyAligned =
    player.x + player.width > stair.x + 4 &&
    player.x < stair.x + stair.width - 4;

  const onTop =
    player.vy >= 0 &&
    player.y + player.height >= stair.y - 2 &&
    player.y + player.height <= stair.y + 6;

  return horizontallyAligned && onTop;
}

/**
 * 尖刺碰撞：含踩到平台尖刺、被下方上升平台頂到（天花板感）
 * 尖刺區域為平台上方 SPIKE_HEIGHT 的三角形區域（以 AABB 近似）
 */
export function isSpikeHit(player, stair) {
  if (!stair.hasSpikes) return false;

  const spikeLeft = stair.x;
  const spikeRight = stair.x + stair.width;
  const spikeTop = stair.y - SPIKE_HEIGHT;
  const spikeBottom = stair.y + 2;

  const playerLeft = player.x + 2;
  const playerRight = player.x + player.width - 2;
  const playerTop = player.y + 2;
  const playerBottom = player.y + player.height;

  const horizontalOverlap =
    playerRight > spikeLeft && playerLeft < spikeRight;
  const verticalOverlap =
    playerBottom > spikeTop && playerTop < spikeBottom;

  return horizontalOverlap && verticalOverlap;
}
