const STORAGE_KEY = 'stairfall-sound';

/** 產生短促 WAV data URL（相容性比 Web Audio Oscillator 更好） */
function wavDataUrl(freq, durationSec, volume = 0.45, sampleRate = 22050) {
  const sampleCount = Math.floor(sampleRate * durationSec);
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t * 80);
    const decay = Math.exp(-t * (6 + 1 / Math.max(durationSec, 0.05)));
    const sample = Math.sin((2 * Math.PI * freq * t)) * volume * attack * decay;
    const s16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, s16, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export class GameAudio {
  constructor() {
    this.enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
    this.unlocked = false;
    this._src = new Map();
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

  _srcFor(key, freq, duration, volume) {
    if (!this._src.has(key)) {
      this._src.set(key, wavDataUrl(freq, duration, volume));
    }
    return this._src.get(key);
  }

  _playSrc(src) {
    if (!this.enabled || !src) return;
    const audio = new Audio(src);
    audio.volume = 1;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  _play(key, freq, duration, volume = 0.4) {
    this._playSrc(this._srcFor(key, freq, duration, volume));
  }

  /** 必須在使用者點擊後呼叫，解鎖瀏覽器自動播放限制 */
  async unlock() {
    if (!this.enabled) return false;
    const src = this._srcFor('unlock', 440, 0.06, 0.5);
    try {
      const audio = new Audio(src);
      audio.volume = 1;
      await audio.play();
      this.unlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  playStart() {
    if (!this.enabled) return;
    this._play('start1', 523, 0.1, 0.45);
    setTimeout(() => this._play('start2', 659, 0.1, 0.45), 100);
    setTimeout(() => this._play('start3', 784, 0.14, 0.5), 200);
  }

  playSpring() {
    this._play('spring', 320, 0.14, 0.55);
    setTimeout(() => this._play('spring2', 520, 0.1, 0.45), 80);
  }

  playLand() {
    const now = performance.now();
    if (now - this._lastLandAt < 90) return;
    this._lastLandAt = now;
    this._play('land', 200, 0.07, 0.55);
  }

  playHeal() {
    this._play('heal', 880, 0.06, 0.35);
  }

  playHurt() {
    this._play('hurt1', 150, 0.12, 0.5);
    setTimeout(() => this._play('hurt2', 95, 0.1, 0.4), 60);
  }

  playFloor() {
    this._play(`floor-${Math.floor(Math.random() * 3)}`, 440 + Math.random() * 60, 0.05, 0.3);
  }

  playGameOver() {
    this._play('over1', 330, 0.18, 0.45);
    setTimeout(() => this._play('over2', 220, 0.2, 0.42), 160);
    setTimeout(() => this._play('over3', 165, 0.28, 0.4), 320);
  }

  playUiClick() {
    this._play('ui', 660, 0.05, 0.35);
  }
}

export const gameAudio = new GameAudio();
