import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { legalActions } from '../src/engine/legal';
import { vertexEdges, ALL_VERTICES } from '../src/board/geometry';
import { emptyCounts } from '../src/constants';
import type { Action, GameState, OmenKind } from '../src/types';
import { stateWith } from './helpers';

const ok = (s: GameState, a: Action, id = s.order[s.current]) => {
  const r = applyAction(s, id, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const bad = (s: GameState, a: Action) => expect(applyAction(s, s.order[s.current], a).ok).toBe(false);
const me = (s: GameState) => s.players.find((p) => p.id === s.order[s.current])!;
const withOmen = (kind: OmenKind, boughtTurn = 0, phase: GameState['phase'] = { k: 'main' }) => {
  const s = stateWith({ phase });
  me(s).omens.push({ kind, boughtTurn });
  return s;
};

describe('buy', () => {
  it('pays, draws top card, records turn', () => {
    const s = stateWith({ omenDeck: ['relic', 'hoard'] });
    me(s).hand = { ...emptyCounts(), fleece: 1, harvest: 1, starmetal: 1 };
    const r = ok(s, { type: 'buyOmen' });
    expect(me(r).omens).toEqual([{ kind: 'hoard', boughtTurn: 1 }]);
    expect(r.omenDeck).toEqual(['relic']);
    expect(r.bank.fleece).toBe(20);
  });
  it('empty deck is an error and state is unchanged', () => {
    const s = stateWith({ omenDeck: [] });
    me(s).hand = { ...emptyCounts(), fleece: 1, harvest: 1, starmetal: 1 };
    const before = structuredClone(s);
    bad(s, { type: 'buyOmen' });
    expect(s).toEqual(before);
  });
});

describe('play', () => {
  it('not the turn it was bought, not twice a turn, not relics', () => {
    bad(withOmen('warden', 1), { type: 'playOmen', kind: 'warden' });
    const r = ok(withOmen('warden'), { type: 'playOmen', kind: 'warden' });
    me(r).omens.push({ kind: 'warden', boughtTurn: 0 });
    bad({ ...r, phase: { k: 'main' } }, { type: 'playOmen', kind: 'warden' });
    bad(withOmen('relic'), { type: 'playOmen', kind: 'relic' } as any);
  });

  it('warden: counts, moves Shade, returns to the phase it came from', () => {
    for (const k of ['roll', 'main'] as const) {
      const r = ok(withOmen('warden', 0, { k }), { type: 'playOmen', kind: 'warden' });
      expect(me(r).wardensPlayed).toBe(1);
      expect(r.phase).toEqual({ k: 'moveShade', then: k });
      const hex = Object.keys(r.board.hexes).find((h) => h !== r.shadeHex)!;
      expect(ok(r, { type: 'moveShade', hex }).phase).toEqual({ k });
    }
  });

  it('bounty takes two from the bank; fails if bank is short', () => {
    const r = ok(withOmen('bounty'), { type: 'playOmen', kind: 'bounty', pick: ['clay', 'clay'] });
    expect(me(r).hand.clay).toBe(2);
    expect(r.bank.clay).toBe(17);
    const s = withOmen('bounty');
    s.bank.clay = 1;
    bad(s, { type: 'playOmen', kind: 'bounty', pick: ['clay', 'clay'] });
  });

  it("hoard takes every other player's copies of one resource", () => {
    const s = withOmen('hoard');
    s.players.forEach((p) => (p.hand.timber = 2));
    const r = ok(s, { type: 'playOmen', kind: 'hoard', resource: 'timber' });
    expect(me(r).hand.timber).toBe(2 * s.players.length);
    expect(r.players.filter((p) => p.id !== me(r).id).every((p) => p.hand.timber === 0)).toBe(true);
  });

  it('waymaking: two free paths then back; refused with no legal spot', () => {
    const s = withOmen('waymaking', 0, { k: 'roll' });
    const v = ALL_VERTICES[20];
    s.buildings[v] = { owner: s.order[0], kind: 'outpost' };
    const [e1, e2] = vertexEdges(v);
    const w = ok(s, { type: 'playOmen', kind: 'waymaking' });
    expect(w.phase).toEqual({ k: 'waymaking', left: 2, then: 'roll' });
    const w1 = ok(w, { type: 'buildPath', edge: e1 });
    expect(w1.phase).toMatchObject({ k: 'waymaking', left: 1 });
    const w2 = ok(w1, { type: 'buildPath', edge: e2 });
    expect(w2.phase).toEqual({ k: 'roll' });
    expect(me(w2).hand).toEqual(emptyCounts());
    bad(withOmen('waymaking'), { type: 'playOmen', kind: 'waymaking' });
  });

  it('waymaking offers no path once the player has none left', () => {
    const s = stateWith({ phase: { k: 'waymaking', left: 1, then: 'main' } });
    s.buildings[ALL_VERTICES[20]] = { owner: s.order[s.current], kind: 'outpost' };
    me(s).piecesLeft.path = 0;
    expect(legalActions(s, me(s).id)).toEqual([]);
  });
});
