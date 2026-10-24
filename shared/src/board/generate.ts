import type { Board, Hex, HexId, Terrain } from '../types';
import { PORTS, PORTS_LARGE, TILES, TILES_LARGE, TOKENS, TOKENS_LARGE } from '../constants';
import { shuffle } from '../rng';
import { edgeId, geometry, hexId } from './geometry';
import type { Scenario } from './scenarios/landfall';

const PORT_SLOTS = [0, 3, 7, 10, 13, 17, 20, 23, 27];
const PORT_SLOTS_LARGE = [0, 4, 7, 11, 15, 19, 22, 26, 30, 34, 38];
const hot = (t: number | null) => t === 6 || t === 8;

// Fixed seed gives a seed-independent starter board that still passes every random-mode check.
const STARTER_SEED = 20261021;

export function generateBoard(mode: 'random' | 'starter', rngState: number, big = false): [Board, number] {
  const { land: LAND_HEXES, edgeSet: EDGES, coast: COAST_EDGES } = geometry(big);
  const ids: HexId[] = LAND_HEXES.map((h) => hexId(h.q, h.r, big));
  let s = mode === 'starter' ? STARTER_SEED : rngState;
  let terrains: Terrain[] = [];
  let tokens: (number | null)[] = [];
  for (;;) {
    [terrains, s] = shuffle(big ? TILES_LARGE : TILES, s);
    const land = terrains.map((t, i) => [t, i] as const).filter(([t]) => t !== 'ashen').map(([, i]) => i);
    let ok = false;
    for (let tries = 0; tries < 1000 && !ok; tries++) {
      let t: number[];
      [t, s] = shuffle(big ? TOKENS_LARGE : TOKENS, s);
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
  [kinds, s] = shuffle(big ? PORTS_LARGE : PORTS, s);
  const ports = (big ? PORT_SLOTS_LARGE : PORT_SLOTS).map((slot, i) => ({ edge: COAST_EDGES[slot], kind: kinds[i] }));
  return [{ hexes, ports }, mode === 'starter' ? rngState : s];
}

// Drowned Isles boards are hand-authored: no shuffling, no rng use. Hexes outside `land` are Deep.
export function scenarioBoard(sc: Scenario): Board {
  const { all } = geometry(sc.prefix);
  const hexes: Record<HexId, Hex> = {};
  for (const { q, r } of all) {
    const id = hexId(q, r, sc.prefix);
    hexes[id] = { id, q, r, terrain: 'deep', token: null };
  }
  for (const [q, r, terrain, token] of sc.land) hexes[hexId(q, r, sc.prefix)] = { ...hexes[hexId(q, r, sc.prefix)], terrain, token };
  const ports = sc.ports.map(([q1, r1, q2, r2, kind]) => ({ edge: edgeId(hexId(q1, r1, sc.prefix), hexId(q2, r2, sc.prefix)), kind }));
  return { hexes, ports };
}

// Land hexes grouped into isles by flood fill over shared edges; the home isle holds the `home` hex ('' when setup may start anywhere).
export function scenarioIsles(sc: Scenario, board: Board): { isleOf: Record<HexId, string>; homeIsle: string } {
  const isleOf: Record<HexId, string> = {};
  const { edgeSet } = geometry(sc.prefix);
  const land = Object.values(board.hexes).filter((h) => h.terrain !== 'deep').map((h) => h.id);
  let n = 0;
  for (const start of land) {
    if (isleOf[start]) continue;
    const id = `i${n++}`;
    const todo = [start];
    isleOf[start] = id;
    while (todo.length) {
      const h = todo.pop()!;
      for (const o of land) if (!isleOf[o] && edgeSet.has(edgeId(h, o))) (isleOf[o] = id), todo.push(o);
    }
  }
  const home = sc.land.find((l) => l[4]);
  return { isleOf, homeIsle: home ? isleOf[hexId(home[0], home[1], sc.prefix)] : '' };
}
