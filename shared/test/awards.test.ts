import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { checkWin, longestPathLength, glory, updateAwards } from '../src/engine/awards';
import { ALL_VERTICES, edgeVertices, vertexEdges } from '../src/board/geometry';
import type { EdgeId, GameState, VertexId } from '../src/types';
import { stateWith } from './helpers';

// Simple trail of n edges from `from`, never revisiting a vertex.
function chain(n: number, from: VertexId = ALL_VERTICES[0]): { edges: EdgeId[]; end: VertexId; verts: VertexId[] } {
  const edges: EdgeId[] = [];
  const verts = [from];
  let v = from;
  while (edges.length < n) {
    const e = vertexEdges(v).find((x) => !edges.includes(x) && !verts.includes(edgeVertices(x).find((y) => y !== v)!))!;
    v = edgeVertices(e).find((y) => y !== v)!;
    edges.push(e);
    verts.push(v);
  }
  return { edges, end: v, verts };
}
const lay = (s: GameState, id: string, edges: EdgeId[]) => edges.forEach((e) => (s.paths[e] = id));

describe('longest path', () => {
  it('counts a straight trail', () => {
    const s = stateWith();
    lay(s, 'a', chain(6).edges);
    expect(longestPathLength(s, 'a')).toBe(6);
  });
  it('handles a fork: longest branch, not total', () => {
    const s = stateWith();
    const c = chain(4);
    lay(s, 'a', c.edges);
    const mid = c.verts[2];
    const spur = vertexEdges(mid).find((e) => !c.edges.includes(e))!;
    s.paths[spur] = 'a';
    expect(longestPathLength(s, 'a')).toBe(4);
  });
  it('handles a loop: six edges around one hex', () => {
    const s = stateWith();
    const hex = Object.keys(s.board.hexes)[0];
    const es = new Set<EdgeId>();
    for (const e of Object.keys(s.paths)) es.add(e);
    // All edges touching the first hex's vertices pairwise form the ring: take edges whose both ends are hex corners.
    const corners = new Set(ALL_VERTICES.filter((v) => v.split('|').includes(hex)));
    for (const v of corners) for (const e of vertexEdges(v)) if (edgeVertices(e).every((x) => corners.has(x))) s.paths[e] = 'a';
    const ring = Object.keys(s.paths).length;
    expect(longestPathLength(s, 'a')).toBe(ring);
  });
  it('an opponent outpost on a joint splits the trail', () => {
    const s = stateWith();
    const c = chain(6);
    lay(s, 'a', c.edges);
    s.buildings[c.verts[3]] = { owner: 'b', kind: 'outpost' };
    expect(longestPathLength(s, 'a')).toBe(3);
  });
});

describe('awards', () => {
  it('needs 5 and goes to the strict leader', () => {
    const s = stateWith();
    lay(s, 'a', chain(4).edges);
    updateAwards(s);
    expect(s.longestPath).toBeNull();
    lay(s, 'a', chain(5).edges);
    expect(updateAwards(s)).toEqual([{ type: 'awardChanged', award: 'longestPath', player: 'a' }]);
    expect(s.longestPath).toBe('a');
  });
  it('ties keep the holder; a tie that unseats the holder gives nobody', () => {
    const s = stateWith();
    const ca = chain(5);
    const far = ALL_VERTICES.find((v) => !ca.verts.includes(v) && chain(6, v).edges.every((e) => !ca.edges.includes(e)))!;
    lay(s, 'a', ca.edges);
    updateAwards(s);
    lay(s, 'b', chain(5, far).edges);
    updateAwards(s);
    expect(s.longestPath).toBe('a'); // tie keeps holder
    lay(s, 'b', chain(6, far).edges);
    updateAwards(s);
    expect(s.longestPath).toBe('b');
    s.paths = {};
    lay(s, 'b', ca.edges);
    lay(s, 'c', chain(5, far).edges);
    s.longestPath = 'a';
    updateAwards(s);
    expect(s.longestPath).toBeNull(); // b and c tie, holder a has none
  });
  it('Grand host needs 3 Wardens and strictly more than the holder', () => {
    const s = stateWith();
    s.players[0].wardensPlayed = 2;
    updateAwards(s);
    expect(s.grandHost).toBeNull();
    s.players[0].wardensPlayed = 3;
    updateAwards(s);
    expect(s.grandHost).toBe('a');
    s.players[1].wardensPlayed = 3;
    updateAwards(s);
    expect(s.grandHost).toBe('a');
    s.players[1].wardensPlayed = 4;
    updateAwards(s);
    expect(s.grandHost).toBe('b');
  });
});

describe('glory and win', () => {
  it('scores buildings, awards and relics', () => {
    const s = stateWith();
    s.buildings[ALL_VERTICES[0]] = { owner: 'a', kind: 'outpost' };
    s.buildings[ALL_VERTICES[10]] = { owner: 'a', kind: 'citadel' };
    s.longestPath = 'a';
    s.grandHost = 'a';
    s.players[0].omens = [{ kind: 'relic', boughtTurn: 0 }, { kind: 'warden', boughtTurn: 0 }];
    expect(glory(s, 'a', false)).toBe(1 + 2 + 2 + 2);
    expect(glory(s, 'a', true)).toBe(8);
  });
  it('wins for the current player at the target, counting hidden relics', () => {
    const s = stateWith();
    const cur = s.order[s.current];
    s.settings = { ...s.settings, gloryTarget: 3 };
    s.buildings[ALL_VERTICES[0]] = { owner: cur, kind: 'citadel' };
    s.players.find((p) => p.id === cur)!.omens = [{ kind: 'relic', boughtTurn: 0 }];
    expect(checkWin(s)).toEqual([{ type: 'won', player: cur }]);
    expect(s.phase).toEqual({ k: 'ended', winner: cur });
  });
  it('does not win for a non-current player', () => {
    const s = stateWith();
    s.settings = { ...s.settings, gloryTarget: 1 };
    s.buildings[ALL_VERTICES[0]] = { owner: s.order[1], kind: 'outpost' };
    expect(checkWin(s)).toEqual([]);
  });
  it('applyAction ends the game when an action reaches the target', () => {
    const s = stateWith();
    const cur = s.order[s.current];
    s.settings = { ...s.settings, gloryTarget: 2 };
    s.buildings[ALL_VERTICES[0]] = { owner: cur, kind: 'outpost' };
    s.players.find((p) => p.id === cur)!.hand = { clay: 0, timber: 0, fleece: 0, harvest: 2, starmetal: 3 };
    const r = applyAction(s, cur, { type: 'buildCitadel', vertex: ALL_VERTICES[0] });
    expect(r.ok && r.state.phase).toEqual({ k: 'ended', winner: cur });
  });
});
