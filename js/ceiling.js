import { CANVAS_WIDTH, CEILING_SPIKE_HEIGHT } from './constants.js';

/** 玩家頭部進入天花板尖刺區 */
export function isCeilingSpikeHit(player) {
  const playerTop = player.y + 2;
  return playerTop <= CEILING_SPIKE_HEIGHT + 2;
}

export function drawCeilingSpikes(ctx) {
  const spikeCount = Math.floor(CANVAS_WIDTH / 12);
  const spikeWidth = CANVAS_WIDTH / spikeCount;

  ctx.save();

  ctx.fillStyle = '#922b21';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 3);

  ctx.fillStyle = '#e74c3c';
  for (let i = 0; i < spikeCount; i++) {
    const sx = i * spikeWidth;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + spikeWidth / 2, CEILING_SPIKE_HEIGHT);
    ctx.lineTo(sx + spikeWidth, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
