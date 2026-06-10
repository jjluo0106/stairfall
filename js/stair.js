import {
  CANVAS_WIDTH,
  STAIR_HEIGHT,
  STAIR_MIN_WIDTH,
  STAIR_MAX_WIDTH,
  STAIR_GAP,
  SPIKE_CHANCE,
  SPIKE_HEIGHT,
  SPRING_CHANCE,
  CONVEYOR_CHANCE,
  PlatformType,
} from './constants.js';

let nextId = 0;

function pickStairColor() {
  const palette = [
    { light: '#74b9ff', dark: '#0984e3' },
    { light: '#55efc4', dark: '#00b894' },
    { light: '#fab1a0', dark: '#e17055' },
    { light: '#dfe6e9', dark: '#b2bec3' },
    { light: '#fd79a8', dark: '#e84393' },
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

function rollPlatformType(forceSpikes) {
  if (forceSpikes) return PlatformType.NORMAL;
  const r = Math.random();
  if (r < SPRING_CHANCE) return PlatformType.SPRING;
  if (r < SPRING_CHANCE + CONVEYOR_CHANCE) return PlatformType.CONVEYOR;
  return PlatformType.NORMAL;
}

export class Stair {
  constructor(y, options = {}) {
    this.id = nextId++;
    this.width =
      options.width ??
      STAIR_MIN_WIDTH + Math.random() * (STAIR_MAX_WIDTH - STAIR_MIN_WIDTH);
    this.x = options.x ?? Math.random() * (CANVAS_WIDTH - this.width);
    this.y = y;
    this.height = STAIR_HEIGHT;
    this.type = options.type ?? rollPlatformType(options.hasSpikes === true);

    const wantSpikes = options.hasSpikes ?? Math.random() < SPIKE_CHANCE;
    this.hasSpikes =
      this.type === PlatformType.NORMAL && wantSpikes;

    if (this.type === PlatformType.SPRING) {
      this.color = { light: '#ffeaa7', dark: '#fdcb6e' };
    } else if (this.type === PlatformType.CONVEYOR) {
      this.color = { light: '#b2bec3', dark: '#636e72' };
      this.direction = options.direction ?? (Math.random() < 0.5 ? -1 : 1);
    } else {
      this.color = options.color ?? pickStairColor();
    }
  }

  update(speed) {
    this.y -= speed;
  }

  isOffScreen() {
    return this.y + this.height < 0;
  }

  draw(ctx, now = 0) {
    ctx.save();

    if (this.type === PlatformType.SPRING) {
      this.drawSpring(ctx);
    } else if (this.type === PlatformType.CONVEYOR) {
      this.drawConveyor(ctx, now);
    } else {
      this.drawNormal(ctx);
      if (this.hasSpikes) this.drawSpikes(ctx);
    }

    ctx.restore();
  }

  drawNormal(ctx) {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, this.color.light);
    gradient.addColorStop(1, this.color.dark);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawSpring(ctx) {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, '#ffeaa7');
    gradient.addColorStop(1, '#f39c12');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.stroke();

    // 彈簧線圈
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const coils = 4;
    const coilW = this.width / coils;
    const baseY = this.y + this.height * 0.55;
    for (let i = 0; i <= coils; i++) {
      const cx = this.x + i * coilW;
      const cy = baseY + (i % 2 === 0 ? -4 : 4);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('彈', this.x + this.width / 2, this.y + this.height - 3);
  }

  drawConveyor(ctx, now) {
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, '#dfe6e9');
    gradient.addColorStop(1, '#636e72');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 3);
    ctx.fill();

    // 輸送帶條紋（隨時間捲動）
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 3);
    ctx.clip();

    const stripeW = 10;
    const offset = ((now * 0.06 * this.direction) % stripeW + stripeW) % stripeW;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 3;
    for (let sx = this.x - stripeW + offset; sx < this.x + this.width + stripeW; sx += stripeW) {
      ctx.beginPath();
      ctx.moveTo(sx, this.y);
      ctx.lineTo(sx + stripeW * 0.6, this.y + this.height);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // 方向箭頭
    const arrowX = this.x + this.width / 2;
    const arrowY = this.y + this.height / 2;
    ctx.fillStyle = this.direction > 0 ? '#0984e3' : '#e17055';
    ctx.beginPath();
    if (this.direction > 0) {
      ctx.moveTo(arrowX - 5, arrowY);
      ctx.lineTo(arrowX + 5, arrowY);
      ctx.lineTo(arrowX + 1, arrowY - 4);
      ctx.moveTo(arrowX + 5, arrowY);
      ctx.lineTo(arrowX + 1, arrowY + 4);
    } else {
      ctx.moveTo(arrowX + 5, arrowY);
      ctx.lineTo(arrowX - 5, arrowY);
      ctx.lineTo(arrowX - 1, arrowY - 4);
      ctx.moveTo(arrowX - 5, arrowY);
      ctx.lineTo(arrowX - 1, arrowY + 4);
    }
    ctx.fill();
  }

  drawSpikes(ctx) {
    const spikeCount = Math.floor(this.width / 12);
    const spikeWidth = this.width / spikeCount;

    ctx.fillStyle = '#e74c3c';
    for (let i = 0; i < spikeCount; i++) {
      const sx = this.x + i * spikeWidth;
      ctx.beginPath();
      ctx.moveTo(sx, this.y);
      ctx.lineTo(sx + spikeWidth / 2, this.y - SPIKE_HEIGHT);
      ctx.lineTo(sx + spikeWidth, this.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export function createInitialStairs() {
  const stairs = [];
  let y = 120;

  for (let i = 0; i < 14; i++) {
    const safe = i <= 2;
    stairs.push(
      new Stair(y, {
        hasSpikes: !safe && Math.random() < SPIKE_CHANCE,
        type: safe ? PlatformType.NORMAL : undefined,
      })
    );
    y += STAIR_GAP + Math.random() * 20;
  }
  return stairs;
}

export function spawnStair(stairs) {
  const lowest = stairs.reduce((max, s) => Math.max(max, s.y), 0);
  const y = lowest + STAIR_GAP + Math.random() * 30;
  stairs.push(new Stair(y));
}
