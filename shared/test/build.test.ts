import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { edgeVertices, vertexEdges, vertexNeighbors, ALL_VERTICES } from '../src/board/geometry';
import { PIECES, emptyCounts } from '../src/constants';
import type { Action, GameState } from '../src/types';
import { stateWith } from './helpers';

const rich = () => {
  const s = stateWith();
  s.players.find((p) => p.id === s.order[0])!.hand = { clay: 9, timber: 9, fleece: 9, harvest: 9, starmetal: 9 };
  return s;
};
const ok = (s: GameState, a: Action, id = s.order[s.current]) => {
  const r = applyAction(s, id, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const bad = (s: GameState, a: Action, id = s.order[s.current]) => expect(applyAction(s, id, a).ok).toBe(false);
const me = (s: GameState) => s.players.find((p) => p.id === s.order[s.current])!;

// Own outpost at a vertex, own path on one of its edges.
function net() {
  const s = rich();
  const id = s.order[0];
  const v = ALL_VERTICES[20];
  const e = vertexEdges(v)[0];
  s.buildings[v] = { owner: id, kind: 'outpost' };
  s.paths[e] = id;
  const mid = edgeVertices(e).find((x) => x !== v)!;
  const e2 = vertexEdges(mid).find((x) => x !== e)!;
  s.paths[e2] = id;
  s.players.find((p) => p.id === id)!.piecesLeft.outpost--;
  return { s, id, v, e, far: edgeVertices(e2).find((x) => x !== mid)!, mid };
}

describe('build', () => {
  it('path: connects to own network, costs, returns to bank', () => {
    const { s, v } = net();
    const next = vertexEdges(v)[1];
    const r = ok(s, { type: 'buildPath', edge: next });
    expect(me(r).hand.clay).toBe(8);
    expect(r.bank.clay).toBe(20);
    expect(r.paths[next]).toBe(s.order[0]);
    bad(s, { type: 'buildPath', edge: vertexEdges(ALL_VERTICES[0])[0] }); // disconnected
    bad(r, { type: 'buildPath', edge: next }); // occupied
  });

  it('path: opponent building at the joint blocks continuing through it', () => {
    const { s, id, mid: far, e } = net();
    s.buildings[far] = { owner: s.order[1], kind: 'outpost' };
    for (const beyond of vertexEdges(far).filter((x) => x !== e)) {
      const otherEnd = edgeVertices(beyond).find((x) => x !== far)!;
      const touchesMine = s.buildings[otherEnd]?.owner === id || vertexEdges(otherEnd).some((x) => s.paths[x] === id);
      if (!touchesMine) bad(s, { type: 'buildPath', edge: beyond });
    }
  });

  it('outpost: needs own path, distance rule, cost, piece limit', () => {
    const { s, far } = net();
    const r = ok(s, { type: 'buildOutpost', vertex: far });
    expect(r.buildings[far]).toEqual({ owner: s.order[0], kind: 'outpost' });
    expect(me(r).hand.timber).toBe(8);
    bad(s, { type: 'buildOutpost', vertex: ALL_VERTICES[0] }); // no path
    bad(r, { type: 'buildOutpost', vertex: vertexNeighbors(far)[0] }); // distance
    const full = net();
    full.s.players.find((p) => p.id === full.id)!.piecesLeft.outpost = 0;
    bad(full.s, { type: 'buildOutpost', vertex: full.far });
  });

  it('citadel: only own outpost; returns the outpost piece', () => {
    const { s, v } = net();
    const r = ok(s, { type: 'buildCitadel', vertex: v });
    expect(r.buildings[v].kind).toBe('citadel');
    expect(me(r).piecesLeft).toMatchObject({ outpost: PIECES.outpost, citadel: PIECES.citadel - 1 });
    expect(me(r).hand.starmetal).toBe(6);
    bad(r, { type: 'buildCitadel', vertex: v });
    bad(s, { type: 'buildCitadel', vertex: ALL_VERTICES[0] });
  });

  it('only current player, only in main, must afford', () => {
    const { s, v } = net();
    bad(s, { type: 'buildCitadel', vertex: v }, s.order[1]);
    bad({ ...s, phase: { k: 'roll' } }, { type: 'buildCitadel', vertex: v });
    s.players.find((p) => p.id === s.order[0])!.hand = emptyCounts();
    bad(s, { type: 'buildCitadel', vertex: v });
  });
});

describe('moveShade input', () => {
  it('rejects keys that are not hexes, like __proto__', () => {
    const s = stateWith({ phase: { k: 'moveShade', then: 'main' } });
    const id = s.order[s.current];
    for (const hex of ['__proto__', 'constructor', 'toString']) {
      const r = applyAction(s, id, { type: 'moveShade', hex });
      expect(r.ok, hex).toBe(false);
    }
  });
});
