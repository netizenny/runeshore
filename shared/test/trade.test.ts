import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { tradeRatio } from '../src/engine/trade';
import { edgeVertices } from '../src/board/geometry';
import { emptyCounts } from '../src/constants';
import type { Action, GameState } from '../src/types';
import { stateWith } from './helpers';

const c = (p: Partial<ReturnType<typeof emptyCounts>>) => ({ ...emptyCounts(), ...p });
const ok = (s: GameState, a: Action, id = s.order[s.current]) => {
  const r = applyAction(s, id, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const err = (s: GameState, a: Action, id = s.order[s.current]) => {
  const r = applyAction(s, id, a);
  return r.ok ? null : r.error;
};
const hand = (s: GameState, id: string) => s.players.find((p) => p.id === id)!.hand;

describe('bank and port trades', () => {
  it('4:1, 3:1 any port, 2:1 matching port', () => {
    const s = stateWith();
    const id = s.order[0];
    expect(tradeRatio(s, id, 'clay')).toBe(4);
    hand(s, id).clay = 4;
    const t = ok(s, { type: 'bankTrade', give: 'clay', get: 'timber' });
    expect(hand(t, id)).toMatchObject({ clay: 0, timber: 1 });
    expect(err(s, { type: 'bankTrade', give: 'clay', get: 'clay' })).toBeTruthy();

    const any = s.board.ports.find((p) => p.kind === 'any')!;
    s.buildings[edgeVertices(any.edge)[0]] = { owner: id, kind: 'outpost' };
    expect(tradeRatio(s, id, 'clay')).toBe(3);
    const spec = s.board.ports.find((p) => p.kind !== 'any')!;
    s.buildings[edgeVertices(spec.edge)[0]] = { owner: id, kind: 'outpost' };
    if (spec.kind !== 'any') expect(tradeRatio(s, id, spec.kind)).toBe(2);
  });
});

describe('player trades', () => {
  const setup = () => {
    const s = stateWith();
    const [a, b, d] = s.order;
    s.players.find((p) => p.id === a)!.hand = c({ clay: 2 });
    s.players.find((p) => p.id === b)!.hand = c({ timber: 2 });
    const o = ok(s, { type: 'offerTrade', give: c({ clay: 1 }), get: c({ timber: 1 }), to: 'all' });
    return { s: o, a, b, d, id: o.offers[0].id };
  };

  it('offer -> accept -> confirm swaps and removes the offer', () => {
    const { s, a, b, id } = setup();
    const acc = ok(s, { type: 'respondTrade', offerId: id, accept: true }, b);
    const done = ok(acc, { type: 'confirmTrade', offerId: id, partner: b });
    expect(hand(done, a)).toMatchObject({ clay: 1, timber: 1 });
    expect(hand(done, b)).toMatchObject({ clay: 1, timber: 1 });
    expect(done.offers).toEqual([]);
  });

  it('second confirm gets "offer gone"', () => {
    const { s, b, id } = setup();
    const acc = ok(s, { type: 'respondTrade', offerId: id, accept: true }, b);
    const done = ok(acc, { type: 'confirmTrade', offerId: id, partner: b });
    expect(err(done, { type: 'confirmTrade', offerId: id, partner: b })).toBe('offer gone');
  });

  it('confirm fails if partner lacks cards or has not accepted', () => {
    const { s, b, id } = setup();
    expect(err(s, { type: 'confirmTrade', offerId: id, partner: b })).toBeTruthy();
    const acc = ok(s, { type: 'respondTrade', offerId: id, accept: true }, b);
    hand(acc, b).timber = 0;
    expect(err(acc, { type: 'confirmTrade', offerId: id, partner: b })).toBeTruthy();
  });

  it('rejects empty, same-resource, unaffordable offers and non-current offerers', () => {
    const s = stateWith();
    s.players.find((p) => p.id === s.order[0])!.hand = c({ clay: 1 });
    expect(err(s, { type: 'offerTrade', give: c({}), get: c({ timber: 1 }), to: 'all' })).toBeTruthy();
    expect(err(s, { type: 'offerTrade', give: c({ clay: 1 }), get: c({ clay: 1 }), to: 'all' })).toBeTruthy();
    expect(err(s, { type: 'offerTrade', give: c({ clay: 2 }), get: c({ timber: 1 }), to: 'all' })).toBeTruthy();
    expect(err(s, { type: 'offerTrade', give: c({ clay: 1 }), get: c({ timber: 1 }), to: 'all' }, s.order[1])).toBeTruthy();
  });

  it('decline and cancel', () => {
    const { s, b, id } = setup();
    const dec = ok(s, { type: 'respondTrade', offerId: id, accept: false }, b);
    expect(dec.offers[0].declined).toEqual([b]);
    expect(err(dec, { type: 'cancelTrade', offerId: id }, b)).toBeTruthy();
    expect(ok(dec, { type: 'cancelTrade', offerId: id }).offers).toEqual([]);
  });
});

describe('offer ids', () => {
  it('stay unique when several offers are posted in one turn', () => {
    const s = stateWith();
    hand(s, s.order[0]).clay = 3;
    const o = (give: Partial<ReturnType<typeof emptyCounts>>) => ({ type: 'offerTrade', give: c(give), get: c({ fleece: 1 }), to: 'all' }) as Action;
    const t = ok(ok(ok(s, o({ clay: 1 })), o({ clay: 2 })), o({ clay: 3 }));
    expect(new Set(t.offers.map((x) => x.id)).size).toBe(3);
  });
});
