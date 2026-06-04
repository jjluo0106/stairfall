import {
  CANVAS_WIDTH,
  GRAVITY,
  PLAYER_SPEED,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  MAX_HP,
  INVINCIBLE_MS,
} from './constants.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    this.y = 80;
    this.vx = 0;
    this.vy = 0;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.hp = MAX_HP;
    this.onGround = false;
    this.invincibleUntil = 0;
    this.facing = 1;
  }

  update(keys) {
    this.vx = 0;
    if (keys.left) {
      this.vx = -PLAYER_SPEED;
      this.facing = -1;
    }
    if (keys.right) {
      this.vx = PLAYER_SPEED;
      this.facing = 1;
    }

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.width;
    }
  }

  landOn(stair) {
    this.y = stair.y - this.height;
    this.vy = 0;
    this.onGround = true;
  }

  heal(amount) {
    this.hp = Math.min(MAX_HP, this.hp + amount);
  }

  takeDamage(amount, now) {
    if (now < this.invincibleUntil) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invincibleUntil = now + INVINCIBLE_MS;
    return true;
  }

  isInvincible(now) {
    return now < this.invincibleUntil;
  }

  draw(ctx, now) {
    const blink = this.isInvincible(now) && Math.floor(now / 100) % 2 === 0;
    if (blink) return;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();

    // 身體
    ctx.fillStyle = '#6c5ce7';
    ctx.beginPath();
    ctx.roundRect(this.x + 4, this.y + 10, this.width - 8, this.height - 14, 6);
    ctx.fill();

    // 頭
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.arc(cx, this.y + 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#2d3436';
    const eyeOffset = this.facing * 3;
    ctx.beginPath();
    ctx.arc(cx - 4 + eyeOffset, this.y + 10, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 4 + eyeOffset, this.y + 10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 腿
    ctx.fillStyle = '#4834d4';
    ctx.fillRect(this.x + 6, this.y + this.height - 8, 7, 8);
    ctx.fillRect(this.x + this.width - 13, this.y + this.height - 8, 7, 8);

    ctx.restore();
  }
}
