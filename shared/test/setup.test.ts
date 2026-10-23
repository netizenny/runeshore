import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { createGame } from '../src/engine/create';
import { ALL_EDGES, ALL_VERTICES, edgeVertices, vertexNeighbors, vertexHexes } from '../src/board/geometry';
import { DEFAULT_SETTINGS, type Action, type GameState } from '../src/types';
import { PLAYERS } from './helpers';

const act = (s: GameState, a: Action): GameState => {
  const r = applyAction(s, s.order[s.current], a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const free = (s: GameState) => ALL_VERTICES.find((v) => !s.buildings[v] && !vertexNeighbors(v).some((n) => s.buildings[n]))!;
const edgeAt = (s: GameState, v: string) => ALL_EDGES.find((e) => !s.paths[e] && edgeVertices(e).includes(v))!;

describe('setup', () => {
  it('snake order, then roll with order[0]', () => {
    let s = createGame(PLAYERS, DEFAULT_SETTINGS, 7);
    const seen: string[] = [];
    while (s.phase.k === 'setup') {
      seen.push(s.order[s.current]);
      const v = free(s);
      s = act(s, { type: 'placeOutpost', vertex: v });
      s = act(s, { type: 'placePath', edge: edgeAt(s, v) });
    }
    const o = s.order;
    expect(seen).toEqual([o[0], o[1], o[2], o[2], o[1], o[0]]);
    expect(s.phase).toEqual({ k: 'roll' });
    expect(s.current).toBe(0);
  });

  it('enforces distance rule, path adjacency, wrong player', () => {
    let s = createGame(PLAYERS, DEFAULT_SETTINGS, 7);
    const v = free(s);
    expect(applyAction(s, s.order[1], { type: 'placeOutpost', vertex: v }).ok).toBe(false);
    s = act(s, { type: 'placeOutpost', vertex: v });
    const far = ALL_EDGES.find((e) => !edgeVertices(e).includes(v))!;
    expect(applyAction(s, s.order[0], { type: 'placePath', edge: far }).ok).toBe(false);
    s = act(s, { type: 'placePath', edge: edgeAt(s, v) });
    expect(applyAction(s, s.order[1], { type: 'placeOutpost', vertex: vertexNeighbors(v)[0] }).ok).toBe(false);
  });

  it('round 2 outpost pays one of each adjacent resource', () => {
    let s = createGame(PLAYERS, DEFAULT_SETTINGS, 7);
    for (let i = 0; i < 3; i++) {
      const v = free(s);
      s = act(s, { type: 'placeOutpost', vertex: v });
      s = act(s, { type: 'placePath', edge: edgeAt(s, v) });
    }
    const v = free(s);
    const want = vertexHexes(v).map((h) => s.board.hexes[h].terrain).filter((t) => t !== 'ashen');
    const me = s.players.find((p) => p.id === s.order[s.current])!;
    s = act(s, { type: 'placeOutpost', vertex: v });
    const got = s.players.find((p) => p.id === me.id)!.hand;
    expect(Object.values(got).reduce((a, b) => a + b, 0)).toBe(want.length);
    for (const t of want) expect(got[t as keyof typeof got]).toBeGreaterThan(0);
  });
});
