const STORAGE_KEY = 'stairfall-sound';

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
    this._lastLandAt = 0;
    this._ready = null;
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(on) {
    this.enabled = on;
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  async ensureRunning() {
    if (!this.enabled) return false;

    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return false;
      }
    }

    return this.ctx.state === 'running';
  }

  resume() {
    if (!this._ready) {
      this._ready = this.ensureRunning();
    }
    return this._ready;
  }

  _tone({ freq, type = 'square', volume = 0.25, attack = 0.01, decay = 0.08, delay = 0 }) {
    if (!this.enabled || !this.ctx || !this.master) return;

    const t0 = this.ctx.currentTime + delay;
    const stopAt = t0 + attack + decay + 0.02;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);

    const peak = Math.max(volume, 0.001);
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, stopAt);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(t0);
    osc.stop(stopAt);
  }

  async playStart() {
    if (!(await this.ensureRunning())) return;
    this._tone({ freq: 523, type: 'square', volume: 0.22, decay: 0.07, delay: 0 });
    this._tone({ freq: 659, type: 'square', volume: 0.24, decay: 0.08, delay: 0.09 });
    this._tone({ freq: 784, type: 'triangle', volume: 0.26, decay: 0.1, delay: 0.18 });
  }

  async playLand() {
    if (!(await this.ensureRunning())) return;
    const now = performance.now();
    if (now - this._lastLandAt < 90) return;
    this._lastLandAt = now;
    this._tone({ freq: 200, type: 'triangle', volume: 0.35, attack: 0.005, decay: 0.06 });
  }

  async playHeal() {
    if (!(await this.ensureRunning())) return;
    this._tone({ freq: 880, type: 'sine', volume: 0.18, decay: 0.05 });
  }

  async playHurt() {
    if (!(await this.ensureRunning())) return;
    this._tone({ freq: 150, type: 'sawtooth', volume: 0.32, decay: 0.1 });
    this._tone({ freq: 95, type: 'square', volume: 0.2, decay: 0.08, delay: 0.05 });
  }

  async playFloor() {
    if (!(await this.ensureRunning())) return;
    this._tone({
      freq: 440 + Math.random() * 40,
      type: 'square',
      volume: 0.14,
      attack: 0.003,
      decay: 0.04,
    });
  }

  async playGameOver() {
    if (!(await this.ensureRunning())) return;
    this._tone({ freq: 330, type: 'triangle', volume: 0.28, decay: 0.15, delay: 0 });
    this._tone({ freq: 220, type: 'triangle', volume: 0.26, decay: 0.18, delay: 0.16 });
    this._tone({ freq: 165, type: 'sine', volume: 0.22, decay: 0.22, delay: 0.34 });
  }

  async playUiClick() {
    if (!(await this.ensureRunning())) return;
    this._tone({ freq: 660, type: 'sine', volume: 0.15, decay: 0.06 });
  }
}

export const gameAudio = new GameAudio();
