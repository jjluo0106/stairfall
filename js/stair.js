import {
  CANVAS_WIDTH,
  STAIR_HEIGHT,
  STAIR_MIN_WIDTH,
  STAIR_MAX_WIDTH,
  STAIR_GAP,
  SPIKE_CHANCE,
  SPIKE_HEIGHT,
} from './constants.js';

let nextId = 0;

export class Stair {
  constructor(y, options = {}) {
    this.id = nextId++;
    this.width =
      options.width ??
      STAIR_MIN_WIDTH + Math.random() * (STAIR_MAX_WIDTH - STAIR_MIN_WIDTH);
    this.x = options.x ?? Math.random() * (CANVAS_WIDTH - this.width);
    this.y = y;
    this.height = STAIR_HEIGHT;
    this.hasSpikes = options.hasSpikes ?? Math.random() < SPIKE_CHANCE;
    this.color = options.color ?? pickStairColor();
  }

  update(speed) {
    this.y -= speed;
  }

  isOffScreen() {
    return this.y + this.height < 0;
  }

  draw(ctx) {
    ctx.save();

    // 平台主體
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, this.color.light);
    gradient.addColorStop(1, this.color.dark);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 3);
    ctx.fill();

    // 邊框
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.hasSpikes) {
      this.drawSpikes(ctx);
    }

    ctx.restore();
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

export function createInitialStairs() {
  const stairs = [];
  let y = 120;

  for (let i = 0; i < 14; i++) {
    stairs.push(new Stair(y, { hasSpikes: i > 2 && Math.random() < SPIKE_CHANCE }));
    y += STAIR_GAP + Math.random() * 20;
  }
  return stairs;
}

export function spawnStair(stairs) {
  const lowest = stairs.reduce((max, s) => Math.max(max, s.y), 0);
  const y = lowest + STAIR_GAP + Math.random() * 30;
  stairs.push(new Stair(y));
}
