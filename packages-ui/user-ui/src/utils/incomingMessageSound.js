/**
 * Короткий звук для входящего сообщения (Web Audio API, без файлов).
 * После политики автовоспроизведения браузера нужен вызов ensureAudioUnlocked() с жестом пользователя.
 */

let ctx = null;

function getContext() {
  if (typeof window === 'undefined' || !window.AudioContext && !window.webkitAudioContext) {
    return null;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!ctx) {
    ctx = new Ctx();
  }
  return ctx;
}

/** Вызвать один раз после клика/касания по странице, чтобы разрешить звук. */
export function ensureAudioUnlocked() {
  const c = getContext();
  if (c?.state === 'suspended') {
    c.resume().catch(() => {});
  }
}

/**
 * Проигрывает мягкий двухтоновый сигнал (входящее сообщение не от вас).
 */
export function playIncomingMessageSound() {
  const c = getContext();
  if (!c || c.state !== 'running') return;

  const now = c.currentTime;
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  master.connect(c.destination);

  const playTone = (freq, start, dur) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.4, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  playTone(880, now + 0.05, 0.08);
  playTone(1174.66, now + 0.14, 0.1);
}
