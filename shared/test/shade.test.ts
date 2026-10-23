import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { hexVertices } from '../src/board/geometry';
import { emptyCounts } from '../src/constants';
import type { Action, GameState, PlayerId } from '../src/types';
import { stateWith } from './helpers';

const act = (s: GameState, id: PlayerId, a: Action) => {
  const r = applyAction(s, id, a);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const hand = (s: GameState, id: PlayerId, c: Partial<ReturnType<typeof emptyCounts>>) => {
  s.players.find((p) => p.id === id)!.hand = { ...emptyCounts(), ...c };
  return s;
};
// Roll-phase state whose next roll is a 7.
function sevenState(): GameState {
  let s = stateWith({ phase: { k: 'roll' } });
  const is7 = (x: GameState) => {
    const r = applyAction(x, x.order[0], { type: 'roll' });
    return r.ok && r.state.dice![0] + r.state.dice![1] === 7;
  };
  while (!is7(s)) s = { ...s, rngState: s.rngState + 1 };
  return s;
}
const cur = (s: GameState) => s.order[s.current];
const other = (s: GameState) => s.order.filter((p) => p !== cur(s));
const far = (s: GameState) => Object.keys(s.board.hexes).find((h) => h !== s.shadeHex)!;

describe('sevens', () => {
  it('discard phase: floor(n/2), any order, exact count, then moveShade', () => {
    const s = sevenState();
    const [x, y] = other(s);
    hand(s, x, { clay: 9 });
    hand(s, y, { timber: 8 });
    const r = act(s, cur(s), { type: 'roll' }).state;
    expect(r.phase).toEqual({ k: 'discard', pending: { [x]: 4, [y]: 4 } });
    expect(applyAction(r, y, { type: 'discard', cards: { ...emptyCounts(), timber: 3 } }).ok).toBe(false);
    expect(applyAction(r, cur(s), { type: 'discard', cards: emptyCounts() }).ok).toBe(false);
    const a = act(r, y, { type: 'discard', cards: { ...emptyCounts(), timber: 4 } }).state; // y before x
    expect(a.bank.timber).toBe(19 + 4);
    const b = act(a, x, { type: 'discard', cards: { ...emptyCounts(), clay: 4 } }).state;
    expect(b.phase).toEqual({ k: 'moveShade', then: 'main' });
  });

  it('no discard when under limit; no production on 7', () => {
    const s = sevenState();
    const r = act(s, cur(s), { type: 'roll' });
    expect(r.state.phase).toEqual({ k: 'moveShade', then: 'main' });
    expect(r.events.some((e) => e.type === 'produced')).toBe(false);
  });

  it('shade must move; no victims -> main', () => {
    const s = { ...sevenState(), phase: { k: 'moveShade', then: 'main' } as const };
    expect(applyAction(s, cur(s), { type: 'moveShade', hex: s.shadeHex }).ok).toBe(false);
    const r = act(s, cur(s), { type: 'moveShade', hex: far(s) });
    expect(r.state.phase).toEqual({ k: 'main' });
    expect(r.state.shadeHex).toBe(far(s));
  });

  it('one victim steals at once; empty-handed players are skipped; two victims choose', () => {
    const base = { ...sevenState(), phase: { k: 'moveShade', then: 'main' } as const };
    const hex = far(base);
    const [x, y] = other(base);
    const [v1, v2] = hexVertices(hex);
    base.buildings = { [v1]: { owner: x, kind: 'outpost' }, [v2]: { owner: y, kind: 'outpost' } };
    hand(base, x, { clay: 1 });
    // y has no cards -> only x is a victim
    const one = act(base, cur(base), { type: 'moveShade', hex });
    expect(one.state.phase).toEqual({ k: 'main' });
    expect(one.events).toContainEqual({ type: 'stole', thief: cur(base), victim: x, resource: 'clay' });
    expect(one.state.players.find((p) => p.id === cur(base))!.hand.clay).toBe(1);

    hand(base, y, { timber: 1 });
    const two = act(base, cur(base), { type: 'moveShade', hex }).state;
    expect(two.phase).toMatchObject({ k: 'steal', victims: expect.arrayContaining([x, y]) });
    expect(applyAction(two, cur(base), { type: 'steal', victim: cur(base) }).ok).toBe(false);
    const done = act(two, cur(base), { type: 'steal', victim: y });
    expect(done.state.phase).toEqual({ k: 'main' });
    expect(done.state.players.find((p) => p.id === y)!.hand.timber).toBe(0);
  });
});

describe('endTurn', () => {
  it('advances, clears offers, resets omen flag; only in main', () => {
    const s = stateWith({ omenPlayedThisTurn: true });
    s.offers.push({ id: 'x', from: cur(s), give: emptyCounts(), get: emptyCounts(), to: 'all', accepted: [], declined: [] });
    const r = act(s, cur(s), { type: 'endTurn' }).state;
    expect(r.current).toBe(1);
    expect(r.turn).toBe(s.turn + 1);
    expect(r.offers).toEqual([]);
    expect(r.omenPlayedThisTurn).toBe(false);
    expect(r.phase).toEqual({ k: 'roll' });
    expect(applyAction(r, cur(r), { type: 'endTurn' }).ok).toBe(false);
    expect(applyAction(s, other(s)[0], { type: 'endTurn' }).ok).toBe(false);
  });
});
