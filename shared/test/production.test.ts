import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { hexVertices } from '../src/board/geometry';
import type { GameState } from '../src/types';
import { stateWith } from './helpers';

// Returns a roll-phase state whose next roll totals N, with hex `h` retargeted to harvest/N.
function rigged(buildings: GameState['buildings'], bank: number) {
  let s = stateWith({ phase: { k: 'roll' }, buildings });
  const peek = (x: GameState) => {
    const r = applyAction(x, x.order[0], { type: 'roll' });
    return r.ok ? r.state.dice![0] + r.state.dice![1] : 0;
  };
  while (peek(s) === 7) s = { ...s, rngState: s.rngState + 1 };
  const total = peek(s);
  const hex = Object.values(s.board.hexes).find((h) => h.terrain !== 'ashen')!;
  hex.terrain = 'harvest';
  hex.token = total;
  s.bank.harvest = bank;
  return { s, hex };
}
const roll = (s: GameState) => {
  const r = applyAction(s, s.order[0], { type: 'roll' });
  if (!r.ok) throw new Error(r.error);
  return r.state;
};

describe('production', () => {
  it('1 per outpost, 2 per citadel, none on the Shade hex', () => {
    const base = rigged({}, 19);
    const [v1, v2] = hexVertices(base.hex.id);
    const s = { ...base.s, buildings: { [v1]: { owner: 'a', kind: 'outpost' as const }, [v2]: { owner: 'b', kind: 'citadel' as const } } };
    const out = roll(s);
    expect(out.players.find((p) => p.id === 'a')!.hand.harvest).toBe(1);
    expect(out.players.find((p) => p.id === 'b')!.hand.harvest).toBe(2);
    const blocked = roll({ ...s, shadeHex: base.hex.id });
    expect(blocked.players.every((p) => p.hand.harvest === 0)).toBe(true);
  });

  it('short bank: two owed -> nobody; one owed -> gets the rest', () => {
    const base = rigged({}, 2);
    const [v1, v2] = hexVertices(base.hex.id);
    const two = { ...base.s, buildings: { [v1]: { owner: 'a', kind: 'citadel' as const }, [v2]: { owner: 'b', kind: 'citadel' as const } } };
    expect(roll(two).players.every((p) => p.hand.harvest === 0)).toBe(true);
    const one = { ...base.s, buildings: { [v1]: { owner: 'a', kind: 'citadel' as const }, [v2]: { owner: 'a', kind: 'outpost' as const } } };
    const out = roll(one);
    expect(out.players.find((p) => p.id === 'a')!.hand.harvest).toBe(2);
    expect(out.bank.harvest).toBe(0);
  });

  it('roll is deterministic from rngState and advances it', () => {
    const s = stateWith({ phase: { k: 'roll' } });
    const a = roll(s), b = roll(s);
    expect(a.dice).toEqual(b.dice);
    expect(a.rngState).not.toBe(s.rngState);
  });
});
