import { expect, test } from 'vitest';
import { nextRandom, randInt, shuffle } from '../src/rng';

function seq(seed: number, n: number) {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    const [v, next] = nextRandom(s);
    out.push(v);
    s = next;
  }
  return out;
}

test('same seed gives same sequence in [0,1)', () => {
  const a = seq(42, 5);
  expect(a).toEqual(seq(42, 5));
  expect(a).not.toEqual(seq(43, 5));
  for (const v of a) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThan(1);
});

test('randInt stays in range and hits every value', () => {
  const seen = new Set<number>();
  let s = 7;
  for (let i = 0; i < 1000; i++) {
    const [v, next] = randInt(s, 6);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(5);
    seen.add(v);
    s = next;
  }
  expect(seen.size).toBe(6);
});

test('shuffle is a deterministic permutation', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8];
  const [a, next] = shuffle(arr, 99);
  expect([...a].sort()).toEqual(arr);
  expect(shuffle(arr, 99)[0]).toEqual(a);
  expect(next).not.toBe(99);
  expect(arr).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});
