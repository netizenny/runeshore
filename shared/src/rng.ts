// mulberry32 over an explicit state so game state stays serializable and replayable.
export function nextRandom(rngState: number): [number, number] {
  const next = (rngState + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

export function randInt(state: number, n: number): [number, number] {
  const [v, next] = nextRandom(state);
  return [Math.floor(v * n), next];
}

export function shuffle<T>(arr: readonly T[], state: number): [T[], number] {
  const out = [...arr];
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    let j: number;
    [j, s] = randInt(s, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return [out, s];
}
