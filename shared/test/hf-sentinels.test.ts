import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { legalActions } from '../src/engine/legal';
import { edgeVertices, hexVertices, vertexEdges } from '../src/board/geometry';
import type { Action, GameState, PlayerId } from '../src/types';
import { hfState } from './helpers';

// A straight walk of n edges from the first land vertex: vs[0..n], es[0..n-1].
function chain(n: number) {
  const vs = [hexVertices('0,0')[0]];
  const es: string[] = [];
  while (es.length < n) {
    const e = vertexEdges(vs.at(-1)!).find((x) => !es.includes(x) && !vs.includes(edgeVertices(x).find((y) => y !== vs.at(-1))!))!;
    es.push(e);
    vs.push(edgeVertices(e).find((y) => y !== vs.at(-1))!);
  }
  return { vs, es };
}

const me = (s: GameState) => s.order[s.current];
const other = (s: GameState) => s.order[(s.current + 1) % s.order.length];
const give = (s: GameState, id: PlayerId, h: Partial<Record<string, number>>) => Object.assign(s.players.find((p) => p.id === id)!.hand, h);
const act = (s: GameState, id: PlayerId, a: Action) => applyAction(s, id, a);
const ok = (s: GameState, id: PlayerId, a: Action) => {
  const r = act(s, id, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const err = (s: GameState, id: PlayerId, a: Action) => {
  const r = act(s, id, a);
  return r.ok ? '' : r.error;
};

function setup() {
  const s = hfState();
  const { vs, es } = chain(4);
  const a = me(s);
  for (const e of es) s.paths[e] = a;
  give(s, a, { fleece: 9, starmetal: 9, harvest: 9, clay: 9 });
  return { s, vs, es, a, b: other(s) };
}

describe('sentinels', () => {
  it('build: needs own path, empty vertex, 1 fleece + 1 starmetal, starts inactive, max 2 basic', () => {
    const { s, vs, a } = setup();
    expect(err(s, a, { type: 'buildSentinel', vertex: 'nowhere' })).toBeTruthy();
    const s1 = ok(s, a, { type: 'buildSentinel', vertex: vs[0] });
    expect(s1.hf!.sentinels[vs[0]]).toMatchObject({ owner: a, rank: 1, active: false });
    expect(s1.players.find((p) => p.id === a)!.hand).toMatchObject({ fleece: 8, starmetal: 8 });
    expect(err(s1, a, { type: 'buildSentinel', vertex: vs[0] })).toMatch(/taken/);
    const s2 = ok(s1, a, { type: 'buildSentinel', vertex: vs[1] });
    expect(err(s2, a, { type: 'buildSentinel', vertex: vs[2] })).toMatch(/Basic/);
    give(s, a, { fleece: 0 });
    expect(err(s, a, { type: 'buildSentinel', vertex: vs[0] })).toMatch(/afford/);
    const far = hexVertices('2,-1').find((v) => !vertexEdges(v).some((e) => s.paths[e]))!;
    expect(err(setup().s, a, { type: 'buildSentinel', vertex: far })).toMatch(/path/);
  });

  it('activate costs a harvest and cannot act the same turn', () => {
    const { s, vs, a } = setup();
    let t = ok(ok(s, a, { type: 'buildSentinel', vertex: vs[0] }), a, { type: 'activateSentinel', vertex: vs[0] });
    expect(t.hf!.sentinels[vs[0]].active).toBe(true);
    expect(t.players.find((p) => p.id === a)!.hand.harvest).toBe(8);
    expect(err(t, a, { type: 'moveSentinel', from: vs[0], to: vs[1] })).toMatch(/just activated/);
    t = { ...t, turn: t.turn + 1 };
    t = ok(t, a, { type: 'moveSentinel', from: vs[0], to: vs[2] });
    expect(t.hf!.sentinels[vs[2]]).toMatchObject({ active: false });
    expect(t.hf!.sentinels[vs[0]]).toBeUndefined();
  });

  it('promote: 2 ranks free, Mighty needs Crown 3, keeps active', () => {
    const { s, vs, a } = setup();
    s.hf!.sentinels[vs[0]] = { owner: a, rank: 1, active: true, actedTurn: 0 };
    let t = ok(s, a, { type: 'promoteSentinel', vertex: vs[0] });
    expect(t.hf!.sentinels[vs[0]]).toMatchObject({ rank: 2, active: true });
    expect(err(t, a, { type: 'promoteSentinel', vertex: vs[0] })).toMatch(/Crown/);
    t.hf!.players[a].level.crown = 3;
    t = ok(t, a, { type: 'promoteSentinel', vertex: vs[0] });
    expect(t.hf!.sentinels[vs[0]].rank).toBe(3);
    expect(err(t, a, { type: 'promoteSentinel', vertex: vs[0] })).toMatch(/Mighty/);
  });

  it('cannot walk through an opponent Sentinel or building, or without a path link', () => {
    const { s, vs, a, b } = setup();
    s.hf!.sentinels[vs[0]] = { owner: a, rank: 3, active: true, actedTurn: 0 };
    s.hf!.sentinels[vs[1]] = { owner: b, rank: 3, active: false, actedTurn: 0 };
    expect(err(s, a, { type: 'moveSentinel', from: vs[0], to: vs[2] })).toMatch(/get there/);
    expect(err(s, a, { type: 'moveSentinel', from: vs[0], to: vs[1] })).toMatch(/weaker/);
    delete s.hf!.sentinels[vs[1]];
    s.buildings[vs[1]] = { owner: b, kind: 'outpost' };
    expect(err(s, a, { type: 'moveSentinel', from: vs[0], to: vs[2] })).toMatch(/get there/);
    // Review Focus 7: its Path link is gone, so it stays put but cannot move.
    delete s.buildings[vs[1]];
    s.paths[chain(4).es[0]] = b;
    expect(err(s, a, { type: 'moveSentinel', from: vs[0], to: vs[2] })).toMatch(/get there/);
    expect(s.hf!.sentinels[vs[0]]).toBeDefined();
  });

  it('displaces a weaker Sentinel; owner relocates it', () => {
    const { s, vs, es, a, b } = setup();
    for (const e of es) s.paths[e] = a;
    // b owns a short spur at the far end, so a displaced b Sentinel has somewhere to go.
    const spur = vertexEdges(vs[3]).find((e) => !es.includes(e))!;
    s.paths[spur] = b;
    s.hf!.sentinels[vs[0]] = { owner: a, rank: 2, active: true, actedTurn: 0 };
    s.hf!.sentinels[vs[2]] = { owner: b, rank: 1, active: true, actedTurn: 0 };
    s.paths[es[2]] = b; // b's link to vs[3] runs through es[2]
    s.paths[es[1]] = a;
    const t = ok(s, a, { type: 'moveSentinel', from: vs[0], to: vs[2] });
    expect(t.hf!.sentinels[vs[2]].owner).toBe(a);
    {
      expect(t.phase.k).toBe('displaced');
      expect(t.phase).toMatchObject({ owner: b, rank: 1, active: true });
      expect(err(t, a, { type: 'endTurn' })).toBeTruthy();
      const to = legalActions(t, b).find((x) => x.type === 'moveDisplaced') as Extract<Action, { type: 'moveDisplaced' }>;
      const u = ok(t, b, to);
      expect(u.phase.k).toBe('main');
      expect(u.hf!.sentinels[to.to]).toMatchObject({ owner: b, rank: 1, active: true });
    }
  });

  it('a displaced Sentinel with no free connected vertex is removed', () => {
    const { s, vs, a, b } = setup();
    s.hf!.sentinels[vs[0]] = { owner: a, rank: 3, active: true, actedTurn: 0 };
    s.hf!.sentinels[vs[1]] = { owner: b, rank: 1, active: true, actedTurn: 0 };
    // b has no Paths, so nothing is reachable.
    const t = ok(s, a, { type: 'moveSentinel', from: vs[0], to: vs[1] });
    expect(t.phase.k).toBe('main');
    expect(t.hf!.sentinels[vs[1]].owner).toBe(a);
  });

  it('chase: needs a awake Shade, an active Sentinel next to it, then moves the Shade', () => {
    const { s, a } = setup();
    const v = hexVertices(s.shadeHex)[0];
    s.hf!.sentinels[v] = { owner: a, rank: 1, active: true, actedTurn: 0 };
    expect(err(s, a, { type: 'chaseShade', vertex: v })).toMatch(/asleep/);
    s.hf!.shadeActive = true;
    const t = ok(s, a, { type: 'chaseShade', vertex: v });
    expect(t.phase).toEqual({ k: 'moveShade', then: 'main' });
    expect(t.hf!.sentinels[v].active).toBe(false);
    const hex = Object.keys(t.board.hexes).find((h) => h !== t.shadeHex)!;
    expect(ok(t, a, { type: 'moveShade', hex }).phase.k).toBe('main');
    s.hf!.sentinels[v].active = false;
    expect(err(s, a, { type: 'chaseShade', vertex: v })).toMatch(/not active/);
  });

  it('legalActions only lists accepted moves', () => {
    const { s, vs, a } = setup();
    s.hf!.sentinels[vs[0]] = { owner: a, rank: 1, active: true, actedTurn: 0 };
    const acts = legalActions(s, a);
    expect(acts).toContainEqual({ type: 'moveSentinel', from: vs[0], to: vs[2] });
    expect(acts).toContainEqual({ type: 'buildSentinel', vertex: vs[1] });
    for (const x of acts) expect(applyAction(s, a, x).ok).toBe(true);
  });
});
