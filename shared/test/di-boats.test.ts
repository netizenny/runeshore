import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/create';
import { applyAction } from '../src/engine/apply';
import { legalActions } from '../src/engine/legal';
import { longestPathLength, glory } from '../src/engine/awards';
import { boardGeometry, edgeVertices, isPathEdge, vertexEdges, vertexHexes } from '../src/board/geometry';
import { DEFAULT_SETTINGS, type Action, type GameState } from '../src/types';
import { PLAYERS } from './helpers';

// Mid-game Drowned Isles state, player 'a' on turn 3 with a full hand and an outpost on the home isle coast.
function game(): { s: GameState; home: string } {
  const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true }, 5);
  s.phase = { k: 'main' };
  s.turn = 3;
  s.current = s.order.indexOf('a');
  for (const r of ['clay', 'timber', 'fleece', 'harvest', 'starmetal'] as const) s.players.find((p) => p.id === 'a')!.hand[r] = 10;
  const { vertices } = boardGeometry(s.board);
  const home = vertices.find((v) => vertexHexes(v).some((h) => s.di!.isleOf[h] === s.di!.homeIsle) && vertexEdges(v).some((e) => legalBoat(s, v, e)))!;
  s.buildings[home] = { owner: 'a', kind: 'outpost' };
  return { s, home };
}
const legalBoat = (s: GameState, v: string, e: string) => !e.split('~').every((h) => boardGeometry(s.board).landSet.has(h)) && edgeVertices(e).includes(v);
const act = (s: GameState, a: Action, who = 'a') => applyAction(s, who, a);
const ok = (r: ReturnType<typeof applyAction>) => {
  expect(r.ok).toBe(true);
  return (r as { ok: true; state: GameState }).state;
};
const boatsFor = (s: GameState, id = 'a') => legalActions(s, id).filter((a) => a.type === 'buildBoat') as Extract<Action, { type: 'buildBoat' }>[];

describe('boats', () => {
  it('build from an own outpost, cost 1 timber + 1 fleece, off-network edges refused', () => {
    const { s, home } = game();
    const first = boatsFor(s)[0];
    expect(vertexEdges(home).includes(first.edge) || edgeVertices(first.edge).some((v) => vertexEdges(v).length)).toBe(true);
    const n = ok(act(s, first));
    expect(n.di!.boats[first.edge]).toBe('a');
    expect(n.players.find((p) => p.id === 'a')!.hand.timber).toBe(9);
    expect(n.players.find((p) => p.id === 'a')!.hand.fleece).toBe(9);
    expect(n.di!.boatsLeft.a).toBe(14);
    const far = boardGeometry(s.board).edges.find((e) => !boatsFor(s).some((b) => b.edge === e) && !e.split('~').every((h) => boardGeometry(s.board).landSet.has(h)))!;
    expect(act(s, { type: 'buildBoat', edge: far }).ok).toBe(false);
    const landLand = boardGeometry(s.board).edges.find((e) => e.split('~').every((h) => boardGeometry(s.board).landSet.has(h)))!;
    expect(act(s, { type: 'buildBoat', edge: landLand }).ok).toBe(false);
  });

  it('cannot afford without timber and fleece', () => {
    const { s } = game();
    s.players.find((p) => p.id === 'a')!.hand.timber = 0;
    expect(act(s, boatsFor(game().s)[0]).ok).toBe(false);
    expect(boatsFor(s)).toHaveLength(0);
  });

  it('a boat built this turn cannot move; an open end moves once per turn', () => {
    const { s } = game();
    let n = ok(act(s, boatsFor(s)[0]));
    n = ok(act(n, boatsFor(n).find((b) => !n.di!.boats[b.edge])!));
    const [e1, e2] = Object.keys(n.di!.boats);
    expect(legalActions(n, 'a').some((a) => a.type === 'moveBoat')).toBe(false);
    n.turn = 5; // next turn for this player
    const moves = legalActions(n, 'a').filter((a) => a.type === 'moveBoat') as Extract<Action, { type: 'moveBoat' }>[];
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((m) => n.di!.boats[m.from] === 'a')).toBe(true);
    const moved = ok(act(n, moves[0]));
    expect(moved.di!.boats[moves[0].to]).toBe('a');
    expect(moved.di!.boats[moves[0].from]).toBeUndefined();
    expect(legalActions(moved, 'a').some((a) => a.type === 'moveBoat')).toBe(false);
  });

  it('the boat cap is 15', () => {
    const { s } = game();
    s.di!.boatsLeft.a = 0;
    expect(boatsFor(s)).toHaveLength(0);
    expect(act(s, { type: 'buildBoat', edge: 'x' }).ok).toBe(false);
  });

  it('a boat chain counts toward the longest route (min 5) and earns the award', () => {
    const { s } = game();
    let n = s;
    for (let i = 0; i < 5; i++) {
      // Always extend: prefer the edge farthest along the chain by taking the last candidate.
      const opts = boatsFor(n);
      n = ok(act(n, opts[opts.length - 1]));
    }
    expect(Object.keys(n.di!.boats)).toHaveLength(5);
    expect(longestPathLength(n, 'a')).toBeGreaterThanOrEqual(2);
    // Hand-built straight route: confirm the walker counts boats at all.
    const m = game().s;
    m.di!.boats = {};
    const start = Object.keys(m.buildings)[0];
    let v = start;
    const seen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const e = vertexEdges(v).find((x) => !seen.has(x) && legalBoat(m, v, x) && !m.paths[x]);
      if (!e) break;
      seen.add(e);
      m.di!.boats[e] = 'a';
      const [p, q] = edgeVertices(e);
      v = p === v ? q : p;
    }
    expect(longestPathLength(m, 'a')).toBe(Object.keys(m.di!.boats).length);
  });

  it('paths and boats join only at the owner\'s building', () => {
    const { s, home } = game();
    const b = vertexEdges(home).find((e) => !isPathEdge(e))!;
    const path = vertexEdges(home).find((e) => e !== b && isPathEdge(e))!;
    s.di!.boats[b] = 'a';
    s.paths[path] = 'a';
    expect(longestPathLength(s, 'a')).toBe(2); // joined at the outpost
    delete s.buildings[home];
    expect(longestPathLength(s, 'a')).toBe(1); // no building: the trail cannot cross
  });

  it('first outpost on a new isle gives Landfall (+2), once per isle', () => {
    const { s } = game();
    const di = s.di!;
    const far = boardGeometry(s.board).vertices.find((v) => vertexHexes(v).length && vertexHexes(v).every((h) => di.isleOf[h] !== di.homeIsle))!;
    const boat = vertexEdges(far).find((e) => legalBoat(s, far, e))!;
    di.boats[boat] = 'a';
    const before = glory(s, 'a', false);
    const n = ok(act(s, { type: 'buildOutpost', vertex: far }));
    expect(n.log.some((e) => e.type === 'landfall')).toBe(true);
    expect(glory(n, 'a', false)).toBe(before + 1 + 2);
    expect(n.di!.landfall.a).toHaveLength(1);
  });

  it('outposts cannot stand on all-sea vertices', () => {
    const { s } = game();
    const sea = boardGeometry(s.board).vertices.find((v) => !vertexHexes(v).length && vertexEdges(v).length)!;
    s.di!.boats[vertexEdges(sea)[0]] = 'a';
    expect(act(s, { type: 'buildOutpost', vertex: sea }).ok).toBe(false);
  });
});

describe('official boat details', () => {
  it('Twin Paths may lay boats free, in any mix', () => {
    const { s } = game();
    const hand = { ...s.players.find((p) => p.id === 'a')!.hand };
    s.phase = { k: 'waymaking', left: 2, then: 'main' };
    let n = ok(act(s, boatsFor(s)[0]));
    expect(n.phase).toMatchObject({ k: 'waymaking', left: 1 });
    n = ok(act(n, boatsFor(n).find((b) => !n.di!.boats[b.edge])!));
    expect(n.phase).toEqual({ k: 'main' });
    expect(Object.keys(n.di!.boats)).toHaveLength(2);
    expect(n.players.find((p) => p.id === 'a')!.hand).toEqual(hand);
  });

  it('an own path at a boat end does not close it (only boats and buildings do)', () => {
    const { s, home } = game();
    const first = boatsFor(s)[0].edge;
    s.di!.boats[first] = 'a';
    s.di!.builtTurn[first] = 1;
    const far = edgeVertices(first).find((v) => v !== home)!;
    const path = vertexEdges(far).find((e) => e !== first && !s.di!.boats[e] && isPathEdge(e));
    if (path) s.paths[path] = 'a';
    expect(legalActions(s, 'a').some((a) => a.type === 'moveBoat' && a.from === first)).toBe(true);
  });
});
