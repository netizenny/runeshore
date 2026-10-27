// Synthesised sound effects (Web Audio): no asset files. Silent until the browser allows audio (first click).
import type { GameEvent, PlayerId } from '@runeshore/shared';

const MUTE_KEY = 'runeshore:muted';
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();
export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

let ctx: AudioContext | null = null;
const ac = () => (ctx ??= new AudioContext());

// One note: frequency glide f0 -> f1 over `dur` seconds, starting `at` seconds from now.
function tone(f0: number, dur: number, { f1 = f0, type = 'sine' as OscillatorType, vol = 0.15, at = 0 } = {}) {
  const c = ac();
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur);
}

// Filtered noise burst: dice rattle, robber thud.
function noise(dur: number, { freq = 1800, vol = 0.2, at = 0 } = {}) {
  const c = ac();
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}

const SOUNDS = {
  roll: () => [0, 0.07, 0.14, 0.23].forEach((at) => noise(0.06, { freq: 2200 + at * 3000, at })),
  build: () => {
    tone(180, 0.15, { f1: 90, type: 'triangle', vol: 0.3 });
    noise(0.05, { freq: 900, vol: 0.12 });
  },
  gain: () => tone(880, 0.12, { f1: 1320, vol: 0.1 }),
  turn: () => {
    tone(523, 0.14, { type: 'triangle' });
    tone(784, 0.22, { type: 'triangle', at: 0.13 });
  },
  tick: () => tone(1500, 0.04, { type: 'square', vol: 0.05 }),
  tock: () => tone(1000, 0.05, { type: 'square', vol: 0.05 }),
  offer: () => tone(1175, 0.4, { vol: 0.12 }),
  trade: () => {
    tone(988, 0.1, { type: 'square', vol: 0.06 });
    tone(1319, 0.18, { type: 'square', vol: 0.06, at: 0.09 });
  },
  shade: () => {
    noise(0.3, { freq: 300, vol: 0.35 });
    tone(110, 0.3, { f1: 55, type: 'sawtooth', vol: 0.15 });
  },
  steal: () => tone(700, 0.2, { f1: 200, type: 'sawtooth', vol: 0.1 }),
  omen: () => [659, 880, 1109].forEach((f, i) => tone(f, 0.25, { vol: 0.08, at: i * 0.08 })),
  alarm: () => {
    tone(330, 0.25, { f1: 220, type: 'sawtooth', vol: 0.12 });
    tone(330, 0.25, { f1: 220, type: 'sawtooth', vol: 0.12, at: 0.3 });
  },
  path: () => {
    tone(260, 0.08, { f1: 200, type: 'triangle', vol: 0.25 });
    noise(0.04, { freq: 1500, vol: 0.1 });
  },
  citadel: () => {
    tone(130, 0.3, { f1: 65, type: 'triangle', vol: 0.35 });
    tone(392, 0.2, { type: 'triangle', vol: 0.1, at: 0.15 });
    tone(523, 0.3, { type: 'triangle', vol: 0.1, at: 0.28 });
  },
  boat: () => {
    noise(0.25, { freq: 500, vol: 0.12 });
    tone(300, 0.25, { f1: 450, vol: 0.08, at: 0.05 });
  },
  discard: () => noise(0.15, { freq: 3500, vol: 0.15 }),
  glimmer: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.18, { vol: 0.06, at: i * 0.05 })),
  reveal: () => {
    tone(440, 0.3, { f1: 880, vol: 0.08 });
    noise(0.2, { freq: 4000, vol: 0.05 });
  },
  sentinel: () => {
    tone(220, 0.12, { type: 'square', vol: 0.08 });
    tone(330, 0.2, { type: 'square', vol: 0.08, at: 0.1 });
  },
  shield: () => {
    tone(784, 0.1, { type: 'triangle', vol: 0.12 });
    tone(1175, 0.35, { type: 'triangle', vol: 0.12, at: 0.1 });
  },
  award: () => [523, 659, 784].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.12, at: i * 0.1 })),
  improve: () => [392, 523, 659].forEach((f, i) => tone(f, 0.15, { vol: 0.1, at: i * 0.07 })),
  peddler: () => {
    tone(1568, 0.08, { vol: 0.08 });
    tone(2093, 0.15, { vol: 0.08, at: 0.07 });
  },
  fleet: () => tone(150, 0.4, { f1: 100, type: 'sawtooth', vol: 0.1 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, { type: 'triangle', vol: 0.15, at: i * 0.15 })),
};
export type Sound = keyof typeof SOUNDS;

export function play(s: Sound) {
  if (muted) return;
  try {
    void ac().resume();
    SOUNDS[s]();
  } catch {
    /* no audio support */
  }
}

// Events worth hearing. Per-event ordering is kept; sounds overlap rather than queue.
export function playEvent(e: GameEvent, me: PlayerId) {
  switch (e.type) {
    case 'rolled': return play('roll');
    case 'produced': return e.gains[me] && play('gain');
    case 'built': return play(e.piece === 'path' ? 'path' : e.piece === 'citadel' ? 'citadel' : e.piece === 'boat' ? 'boat' : 'build');
    case 'boatMoved': return play('boat');
    case 'landfall': case 'spire': return play('build');
    case 'improved': return play('improve');
    case 'discarded': return play('discard');
    case 'glimmered': return play('glimmer');
    case 'revealed': return play('reveal');
    case 'sentinel': return play('sentinel');
    case 'shieldAwarded': return play('shield');
    case 'awardChanged': return e.player && play('award');
    case 'peddlerPlaced': return play('peddler');
    case 'traded': return play('trade');
    case 'shadeMoved': case 'raiderMoved': return play('shade');
    case 'stole': return play('steal');
    case 'omenBought': case 'omenPlayed': case 'arcanaPlayed': case 'arcanaDrawn': return play('omen');
    case 'fleetAttack': case 'citadelLost': return play('alarm');
    case 'fleetAdvanced': return play('fleet');
    case 'won': return play('win');
  }
}
