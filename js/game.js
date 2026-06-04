import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STAIR_SPEED,
  SPIKE_DAMAGE,
  SPIKE_COOLDOWN,
  LAND_HEAL,
  MAX_HP,
} from './constants.js';
import { Player } from './player.js';
import { createInitialStairs, spawnStair } from './stair.js';
import { checkStairCollision, isStandingOn, isSpikeHit } from './collision.js';
import { isCeilingSpikeHit, drawCeilingSpikes } from './ceiling.js';
import { gameAudio } from './audio.js';

export const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'gameover',
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = new Player();
    this.stairs = [];
    this.state = GameState.MENU;
    this.score = 0;
    this.floor = 0;
    this.lastSpikeHit = 0;
    this.scrollOffset = 0;
    this.speedMultiplier = 1;
    this.keys = { left: false, right: false };
    this.gameOverHandled = false;
  }

  reset() {
    this.player.reset();
    this.stairs = createInitialStairs();
    this.score = 0;
    this.floor = 0;
    this.lastSpikeHit = 0;
    this.scrollOffset = 0;
    this.speedMultiplier = 1;
    this.state = GameState.PLAYING;
    this.gameOverHandled = false;
  }

  start() {
    this.reset();
  }

  handleKeyDown(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = true;
    if (code === 'KeyR' && this.state === GameState.GAME_OVER) this.start();
  }

  handleKeyUp(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = false;
  }

  update(now) {
    if (this.state !== GameState.PLAYING) return;

    const speed = STAIR_SPEED * this.speedMultiplier;
    this.player.onGround = false;
    this.player.update(this.keys);

    for (const stair of this.stairs) {
      stair.update(speed);
    }

    this.stairs = this.stairs.filter((s) => !s.isOffScreen());

    while (this.stairs.length < 16) {
      spawnStair(this.stairs);
    }

    let standingStair = null;
    let justLanded = false;

    for (const stair of this.stairs) {
      if (checkStairCollision(this.player, stair)) {
        this.player.landOn(stair);
        standingStair = stair;
        justLanded = true;
        break;
      }
    }

    if (!standingStair) {
      for (const stair of this.stairs) {
        if (isStandingOn(this.player, stair)) {
          this.player.landOn(stair);
          standingStair = stair;
          break;
        }
      }
    }

    if (justLanded && standingStair && !standingStair.hasSpikes) {
      const beforeHp = this.player.hp;
      this.player.heal(LAND_HEAL);
      void gameAudio.playLand();
      if (this.player.hp > beforeHp) void gameAudio.playHeal();
    }

    const hitSpike =
      isCeilingSpikeHit(this.player) ||
      this.stairs.some((stair) => isSpikeHit(this.player, stair));

    if (
      hitSpike &&
      now - this.lastSpikeHit > SPIKE_COOLDOWN &&
      this.player.takeDamage(SPIKE_DAMAGE, now)
    ) {
      this.lastSpikeHit = now;
      void gameAudio.playHurt();
    }

    this.scrollOffset += speed;
    const newFloor = Math.floor(this.scrollOffset / 80);
    if (newFloor > this.floor) {
      this.floor = newFloor;
      this.score += 10;
      void gameAudio.playFloor();
      if (this.floor % 5 === 0) {
        this.speedMultiplier = Math.min(2, 1 + this.floor * 0.02);
      }
    }

    this.score += 0.1;

    if (this.player.hp <= 0 || this.player.y > CANVAS_HEIGHT + 50) {
      this.state = GameState.GAME_OVER;
    }
  }

  drawBackground() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#2d3436');
    gradient.addColorStop(1, '#1e272e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
  }

  draw(now) {
    this.drawBackground();

    for (const stair of this.stairs) {
      stair.draw(this.ctx);
    }

    this.player.draw(this.ctx, now);

    drawCeilingSpikes(this.ctx);

    this.drawHUD(now);
  }

  drawHUD(now) {
    const ctx = this.ctx;
    const barWidth = 80;
    const barHeight = 8;
    const hpRatio = this.player.hp / MAX_HP;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(10, 10, barWidth + 4, barHeight + 4);

    ctx.fillStyle = hpRatio > 0.3 ? '#00b894' : '#e74c3c';
    ctx.fillRect(12, 12, barWidth * hpRatio, barHeight);

    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(`HP ${Math.ceil(this.player.hp)}`, 12, 32);

    ctx.textAlign = 'right';
    ctx.fillText(`F${this.floor}`, CANVAS_WIDTH - 12, 24);
    ctx.fillText(`${Math.floor(this.score)}`, CANVAS_WIDTH - 12, 40);
    ctx.restore();
  }

  getHUD() {
    return {
      hp: Math.ceil(this.player.hp),
      floor: this.floor,
      score: Math.floor(this.score),
    };
  }
}
