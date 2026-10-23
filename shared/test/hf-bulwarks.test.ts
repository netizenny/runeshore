import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { discardLimitFor } from '../src/engine/hf/state';
import { ALL_VERTICES } from '../src/board/geometry';
import { hfState } from './helpers';

describe('bulwarks', () => {
  const setup = () => {
    const s = hfState();
    const a = s.order[s.current];
    ALL_VERTICES.slice(0, 5).forEach((v, i) => (s.buildings[v] = { owner: a, kind: i < 4 ? 'citadel' : 'outpost' }));
    s.players.find((p) => p.id === a)!.hand.clay = 20;
    return { s, a, vs: ALL_VERTICES.slice(0, 5) };
  };

  it('costs 2 clay, only on your citadel, one each, max 3, each adds 2 to the discard limit', () => {
    const { s, a, vs } = setup();
    let t = s;
    vs.slice(0, 3).forEach((v, i) => {
      const r = applyAction(t, a, { type: 'buildBulwark', vertex: v });
      if (!r.ok) throw new Error(r.error);
      t = r.state;
      expect(discardLimitFor(t, a)).toBe(7 + 2 * (i + 1));
    });
    expect(t.players.find((p) => p.id === a)!.hand.clay).toBe(14);
    const bad = (v: string, b = t) => {
      const r = applyAction(b, a, { type: 'buildBulwark', vertex: v });
      return r.ok ? '' : r.error;
    };
    expect(bad(vs[0])).toMatch(/already/);
    expect(bad(vs[3])).toMatch(/no Bulwarks/);
    expect(bad(vs[4], s)).toMatch(/citadel/);
    expect(bad(vs[3], { ...s, players: s.players.map((p) => ({ ...p, hand: { ...p.hand, clay: 1 } })) })).toMatch(/afford/);
  });

  it('is refused with the expansion off', () => {
    const { s, a, vs } = setup();
    delete s.hf;
    const r = applyAction(s, a, { type: 'buildBulwark', vertex: vs[0] });
    expect(r.ok).toBe(false);
  });
});
