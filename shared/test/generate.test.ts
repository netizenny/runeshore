import { describe, expect, it } from 'vitest';
import { generateBoard } from '../src/board/generate';
import { ALL_EDGES, edgeId, edgeVertices, geometry } from '../src/board/geometry';
import { PORTS, PORTS_LARGE, TILES, TILES_LARGE, TOKENS, TOKENS_LARGE } from '../src/constants';

const sorted = <T>(a: T[]) => [...a].sort();

function check(b: ReturnType<typeof generateBoard>[0]) {
  const hs = Object.values(b.hexes);
  expect(hs).toHaveLength(19);
  expect(sorted(hs.map((h) => h.terrain))).toEqual(sorted(TILES));
  expect(sorted(hs.filter((h) => h.token !== null).map((h) => h.token))).toEqual(sorted(TOKENS));
  expect(hs.find((h) => h.terrain === 'ashen')!.token).toBeNull();
  const edges = new Set(ALL_EDGES);
  const hot = hs.filter((h) => h.token === 6 || h.token === 8);
  for (const a of hot) for (const c of hot) if (a !== c) expect(edges.has(edgeId(a.id, c.id))).toBe(false);
  expect(new Set(b.ports.map((p) => p.edge)).size).toBe(9);
  const vs = b.ports.flatMap((p) => edgeVertices(p.edge));
  expect(new Set(vs).size).toBe(vs.length);
  expect(sorted(b.ports.map((p) => p.kind))).toEqual(sorted(PORTS));
}

describe('generateBoard', () => {
  it('random boards are valid for 200 seeds', () => {
    for (let seed = 1; seed <= 200; seed++) check(generateBoard('random', seed)[0]);
  });
  it('starter is valid and seed-independent', () => {
    const [a] = generateBoard('starter', 1);
    const [b] = generateBoard('starter', 999);
    check(a);
    expect(a).toEqual(b);
  });
});

describe('large board', () => {
  it('has 37 hexes, 35 tokens, 11 ports, no adjacent 6/8, for 100 seeds', () => {
    const edges = new Set(geometry(true).edges);
    for (let seed = 1; seed <= 100; seed++) {
      const b = generateBoard('random', seed, true)[0];
      const hs = Object.values(b.hexes);
      expect(hs).toHaveLength(37);
      expect(sorted(hs.map((h) => h.terrain))).toEqual(sorted(TILES_LARGE));
      expect(sorted(hs.filter((h) => h.token !== null).map((h) => h.token))).toEqual(sorted(TOKENS_LARGE));
      const hot = hs.filter((h) => h.token === 6 || h.token === 8);
      for (const a of hot) for (const c of hot) if (a !== c) expect(edges.has(edgeId(a.id, c.id))).toBe(false);
      expect(new Set(b.ports.map((p) => p.edge)).size).toBe(11);
      const vs = b.ports.flatMap((p) => edgeVertices(p.edge));
      expect(new Set(vs).size).toBe(vs.length);
      expect(sorted(b.ports.map((p) => p.kind))).toEqual(sorted(PORTS_LARGE));
    }
  });
});
