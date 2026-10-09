/**
 * WEB AUDIO API TRADING CHIMES
 * ----------------------------
 * Synthesizes crisp, modern auditory cues directly in the browser.
 * Zero external MP3/WAV assets; zero network latency; zero CORS issues.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('terminal_sound_enabled') !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('terminal_sound_enabled', enabled ? 'true' : 'false');
}

/**
 * 🔔 Gate Armed Chime: Ascending two-tone chime when all 15 gates clear (520Hz -> 660Hz)
 */
export function playGateArmedChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

/**
 * 🎯 Order Filled Chime: Crisp bell sound (880Hz) when an entry or exit order fills
 */
export function playOrderFilledChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880, now); // A5
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}

/**
 * 🛡️ Trailing Stop / Breakeven Locked Chime: Soft harmonic confirmation chord
 */
export function playTrailingLockedChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [587.33, 739.99].forEach((freq, i) => { // D5, F#5
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.05);

    gain.gain.setValueAtTime(0.06, now + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.05);
    osc.stop(now + 0.4);
  });
}
