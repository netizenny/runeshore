import type { Board, Hex, HexId, Terrain } from '../types';
import { PORTS, PORTS_LARGE, TILES, TILES_LARGE, TOKENS, TOKENS_LARGE } from '../constants';
import { randInt, shuffle } from '../rng';
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

// Keeps each scenario's land shape and port spots but deals terrains, number tokens and port kinds at random.
// Each isle shuffles within itself, so its desert and gold stay put and every start stays fair. Tokens obey the official
// placement rules: no 6/8 side by side (unless the scenario allows it), none on gold, and in `calmWoods` scenarios none of
// 2, 3, 11, 12 on timber or fleece. Mist hexes stay Mist; their contents are dealt later by dealMist.
export function randomizeScenario(sc: Scenario, board: Board, rng: number): [Board, number] {
  if (sc.random) return dealRandom(sc, board, rng);
  const { edgeSet } = geometry(sc.prefix);
  const { isleOf } = scenarioIsles(sc, board);
  const groups: Record<string, HexId[]> = {};
  for (const l of sc.land) {
    if (l[2] === 'mist') continue;
    const id = hexId(l[0], l[1], sc.prefix);
    (groups[isleOf[id]] ??= []).push(id);
  }
  const low = (t: number | null) => t === 2 || t === 3 || t === 11 || t === 12;
  let s = rng;
  const hexes: Record<HexId, Hex> = { ...board.hexes };
  for (const slots of Object.values(groups)) {
    let terrains: Terrain[];
    [terrains, s] = shuffle(slots.map((id) => board.hexes[id].terrain), s);
    slots.forEach((id, i) => (hexes[id] = { ...hexes[id], terrain: terrains[i], token: null }));
    const numbered = slots.filter((id) => hexes[id].terrain !== 'ashen');
    const pool = slots.map((id) => board.hexes[id].token).filter((t) => t !== null) as number[];
    const bad = (id: string, i: number) => {
      const { terrain, token } = hexes[id];
      if (terrain === 'glimmer' && !hot(token)) return true;
      if (sc.calmWoods && (terrain === 'timber' || terrain === 'fleece') && low(token)) return true;
      return !sc.redAdjacent && hot(token) && numbered.some((o, j) => j > i && hot(hexes[o].token) && edgeSet.has(edgeId(id, o)));
    };
    for (let tries = 0; tries < 2000; tries++) {
      let tk: number[];
      [tk, s] = shuffle(pool, s);
      numbered.forEach((id, k) => (hexes[id] = { ...hexes[id], token: tk[k] }));
      if (!numbered.some(bad)) break;
    }
  }
  let kinds: typeof PORTS;
  [kinds, s] = shuffle(board.ports.map((p) => p.kind), s);
  return [{ hexes, ports: board.ports.map((p, i) => ({ ...p, kind: kinds[i] })) }, s];
}

// Volcano: every draw is independent and taken in the fixed order of `sc.land`, so a seed always yields the same board.
function dealRandom(sc: Scenario, board: Board, rng: number): [Board, number] {
  const { corner, tokens, goldTokens, portResources } = sc.random!;
  let s = rng;
  const draw = <T>(pool: readonly T[]): T => {
    let i: number;
    [i, s] = randInt(s, pool.length);
    return pool[i];
  };
  const hexes: Record<HexId, Hex> = { ...board.hexes };
  for (const [q, r, placeholder] of sc.land) {
    if (placeholder === 'mist' || placeholder === 'ashen') continue;
    const id = hexId(q, r, sc.prefix);
    hexes[id] = { ...hexes[id], terrain: corner.includes(placeholder) ? draw(corner) : placeholder, token: draw(placeholder === 'glimmer' ? goldTokens : tokens) };
  }
  const ports = board.ports.map((p, i) => ({ ...p, kind: i % 2 ? draw(portResources) : ('any' as const) }));
  return [{ hexes, ports }, s];
}

// Land hexes grouped into isles by flood fill over shared edges; the home isle holds the `home` hex ('' when setup may start anywhere).
export function scenarioIsles(sc: Scenario, board: Board): { isleOf: Record<HexId, string>; homeIsle: string } {
  const isleOf: Record<HexId, string> = {};
  const { edgeSet } = geometry(sc.prefix);
  const land = Object.values(board.hexes).filter((h) => h.terrain !== 'deep' && h.terrain !== 'mist').map((h) => h.id);
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
