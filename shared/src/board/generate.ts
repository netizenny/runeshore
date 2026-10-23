import type { Board, Hex, HexId, Terrain } from '../types';
import { PORTS, TILES, TOKENS } from '../constants';
import { shuffle } from '../rng';
import { ALL_EDGES, COAST_EDGES, LAND_HEXES, edgeId, hexId } from './geometry';

const PORT_SLOTS = [0, 3, 7, 10, 13, 17, 20, 23, 27];
const EDGES = new Set(ALL_EDGES);
const ids: HexId[] = LAND_HEXES.map((h) => hexId(h.q, h.r));
const hot = (t: number | null) => t === 6 || t === 8;

// Fixed seed gives a seed-independent starter board that still passes every random-mode check.
const STARTER_SEED = 20261021;

export function generateBoard(mode: 'random' | 'starter', rngState: number): [Board, number] {
  let s = mode === 'starter' ? STARTER_SEED : rngState;
  let terrains: Terrain[] = [];
  let tokens: (number | null)[] = [];
  for (;;) {
    [terrains, s] = shuffle(TILES, s);
    const land = terrains.map((t, i) => [t, i] as const).filter(([t]) => t !== 'ashen').map(([, i]) => i);
    let ok = false;
    for (let tries = 0; tries < 1000 && !ok; tries++) {
      let t: number[];
      [t, s] = shuffle(TOKENS, s);
      tokens = ids.map(() => null);
      land.forEach((hi, k) => (tokens[hi] = t[k]));
      ok = !ids.some((a, i) => hot(tokens[i]) && ids.some((b, j) => j > i && hot(tokens[j]) && EDGES.has(edgeId(a, b))));
    }
    if (ok) break;
  }
  const hexes: Record<HexId, Hex> = {};
  ids.forEach((id, i) => {
    hexes[id] = { id, q: LAND_HEXES[i].q, r: LAND_HEXES[i].r, terrain: terrains[i], token: tokens[i] };
  });
  let kinds: typeof PORTS;
  [kinds, s] = shuffle(PORTS, s);
  const ports = PORT_SLOTS.map((slot, i) => ({ edge: COAST_EDGES[slot], kind: kinds[i] }));
  return [{ hexes, ports }, mode === 'starter' ? rngState : s];
}
