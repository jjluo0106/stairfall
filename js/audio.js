const STORAGE_KEY = 'stairfall-sound';

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
    this._lastLandAt = 0;
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

  resume() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.38;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _tone({ freq, duration = 0.08, type = 'square', volume = 0.2, attack = 0.005, decay = 0.06, detune = 0 }) {
    if (!this.enabled || !this.ctx || !this.master) return;

    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (detune) osc.detune.setValueAtTime(detune, t0);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(t0);
    osc.stop(t0 + duration);
  }

  playStart() {
    this.resume();
    this._tone({ freq: 523, duration: 0.07, type: 'square', volume: 0.18 });
    this._tone({ freq: 659, duration: 0.09, type: 'square', volume: 0.2, attack: 0.08 });
    this._tone({ freq: 784, duration: 0.12, type: 'triangle', volume: 0.22, attack: 0.16 });
  }

  playLand() {
    const now = performance.now();
    if (now - this._lastLandAt < 90) return;
    this._lastLandAt = now;
    this._tone({ freq: 180, duration: 0.06, type: 'triangle', volume: 0.28, decay: 0.05 });
  }

  playHeal() {
    this._tone({ freq: 880, duration: 0.05, type: 'sine', volume: 0.12, decay: 0.04 });
  }

  playHurt() {
    this._tone({ freq: 140, duration: 0.14, type: 'sawtooth', volume: 0.26, decay: 0.12 });
    this._tone({ freq: 90, duration: 0.1, type: 'square', volume: 0.15, attack: 0.04, decay: 0.08 });
  }

  playFloor() {
    this._tone({ freq: 440 + Math.random() * 40, duration: 0.04, type: 'square', volume: 0.1, decay: 0.03 });
  }

  playGameOver() {
    this._tone({ freq: 330, duration: 0.2, type: 'triangle', volume: 0.22, decay: 0.18 });
    this._tone({ freq: 220, duration: 0.28, type: 'triangle', volume: 0.2, attack: 0.22, decay: 0.2 });
    this._tone({ freq: 165, duration: 0.35, type: 'sine', volume: 0.16, attack: 0.48, decay: 0.28 });
  }
}

export const gameAudio = new GameAudio();
