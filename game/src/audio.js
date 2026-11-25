// Sizzle Rush — sound: tiny WebAudio beeps, no audio files.
// Every sound is a short oscillator blip so the game needs no network and
// no assets. The first user gesture unlocks the audio context.

let audioCtx = null;
let muted = false;

export function unlockAudio() {
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    } catch {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, seconds, type, gain, when) {
  if (!audioCtx || muted) return;
  const t0 = audioCtx.currentTime + (when || 0);
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

/** Named game sounds, each a one- or two-note blip. */
export function playSound(name) {
  if (!audioCtx || muted) return;
  switch (name) {
    case 'pickup':
      tone(520, 0.08, 'triangle', 0.1);
      break;
    case 'plate-add':
      tone(660, 0.07, 'triangle', 0.1);
      tone(880, 0.09, 'triangle', 0.09, 0.06);
      break;
    case 'chop-start':
      tone(300, 0.06, 'square', 0.06);
      break;
    case 'chop-done':
      tone(700, 0.08, 'triangle', 0.1);
      tone(940, 0.1, 'triangle', 0.09, 0.05);
      break;
    case 'grill-start':
      tone(220, 0.1, 'sawtooth', 0.05);
      break;
    case 'grill-done':
      tone(780, 0.12, 'sine', 0.12);
      break;
    case 'burnt':
      tone(180, 0.25, 'sawtooth', 0.08);
      break;
    case 'order-new':
      tone(440, 0.09, 'sine', 0.1);
      tone(587, 0.12, 'sine', 0.1, 0.09);
      break;
    case 'serve-good':
      tone(523, 0.1, 'triangle', 0.12);
      tone(659, 0.1, 'triangle', 0.12, 0.08);
      tone(784, 0.16, 'triangle', 0.12, 0.16);
      break;
    case 'serve-wrong':
      tone(220, 0.18, 'square', 0.07);
      tone(160, 0.22, 'square', 0.07, 0.1);
      break;
    case 'order-expired':
      tone(330, 0.2, 'sawtooth', 0.08);
      tone(220, 0.3, 'sawtooth', 0.08, 0.12);
      break;
    case 'click':
      tone(600, 0.05, 'triangle', 0.08);
      break;
    case 'trash':
      tone(140, 0.12, 'square', 0.06);
      break;
    case 'game-over':
      tone(392, 0.15, 'triangle', 0.11);
      tone(330, 0.15, 'triangle', 0.11, 0.14);
      tone(262, 0.3, 'triangle', 0.11, 0.28);
      break;
    default:
      tone(440, 0.06, 'sine', 0.08);
      break;
  }
}
