import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { tradeRatio } from '../src/engine/trade';
import { hexVertices } from '../src/board/geometry';
import { renown } from '../src/engine/awards';
import type { GameState } from '../src/types';
import { arcState, play } from './helpers';

const ok = (r: ReturnType<typeof play>) => {
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const err = (r: ReturnType<typeof play>) => (r.ok ? '' : r.error);
const hand = (s: GameState, id: string) => s.players.find((p) => p.id === id)!.hand;

describe('guild arcana', () => {
  it('Dockside Barter swaps each opponent commodity for the offered resource, their pick', () => {
    const s = arcState();
    Object.assign(hand(s, 'a'), { clay: 2 });
    s.hf!.players.b.commodities = { vellum: 1, silk: 1, sigil: 0 };
    // c holds no commodity: the offer is void
    expect(err(play(s, 'a', 'harbor', { offers: {} }))).toMatch(/offer a resource/);
    expect(err(play(s, 'a', 'harbor', { offers: { b: 'timber' } }))).toMatch(/do not hold/);
    const t = ok(play(s, 'a', 'harbor', { offers: { b: 'clay', c: 'clay' } }));
    expect(t.phase).toMatchObject({ k: 'arcanaGive', mode: 'harbor', pending: { b: 1 } });
    expect(applyAction(t, 'b', { type: 'arcanaGive', cards: { clay: 0, timber: 0, fleece: 0, harvest: 0, starmetal: 0 }, commodities: { vellum: 0, silk: 0, sigil: 0 } })).toMatchObject({ ok: false });
    const r = applyAction(t, 'b', { type: 'arcanaGive', cards: { clay: 0, timber: 0, fleece: 0, harvest: 0, starmetal: 0 }, commodities: { vellum: 0, silk: 1, sigil: 0 } });
    if (!r.ok) throw r.error;
    expect(r.state.phase.k).toBe('main');
    expect(r.state.hf!.players.a.commodities.silk).toBe(1);
    expect(r.state.hf!.players.b.commodities.silk).toBe(0);
    expect(hand(r.state, 'a').clay).toBe(1);
    expect(hand(r.state, 'b').clay).toBe(1);
  });

  it('Dockside Barter with nobody holding a commodity does nothing', () => {
    const s = arcState();
    const t = ok(play(s, 'a', 'harbor', { offers: {} }));
    expect(t.phase.k).toBe('main');
  });

  it('Silver Tongue takes 2 cards from a player with more Renown only', () => {
    const s = arcState();
    Object.assign(hand(s, 'b'), { clay: 1 });
    s.hf!.players.b.commodities.sigil = 1;
    expect(err(play(s, 'a', 'mastermerchant', { target: 'b', take: ['clay', 'sigil'] }))).toMatch(/more Renown/);
    s.hf!.players.b.extraRenown = 2;
    expect(renown(s, 'b', true)).toBeGreaterThan(renown(s, 'a', true));
    expect(err(play(s, 'a', 'mastermerchant', { target: 'b', take: ['clay'] }))).toMatch(/exactly 2/);
    expect(err(play(s, 'a', 'mastermerchant', { target: 'b', take: ['clay', 'clay'] }))).toMatch(/do not hold/);
    const t = ok(play(s, 'a', 'mastermerchant', { target: 'b', take: ['clay', 'sigil'] }));
    expect(hand(t, 'a').clay).toBe(1);
    expect(t.hf!.players.a.commodities.sigil).toBe(1);
    expect(hand(t, 'b').clay).toBe(0);
  });

  it('Silver Tongue on a target with nothing takes nothing', () => {
    const s = arcState();
    s.hf!.players.b.extraRenown = 2;
    const t = ok(play(s, 'a', 'mastermerchant', { target: 'b', take: [] }));
    expect(hand(t, 'b')).toEqual(hand(s, 'b'));
  });

  it('Peddler is placed through the card', () => {
    const s = arcState();
    const h = Object.values(s.board.hexes).find((x) => x.terrain === 'timber')!;
    s.buildings[hexVertices(h.id)[0]] = { owner: 'a', kind: 'outpost' };
    const t = ok(play(s, 'a', 'peddler', { hex: h.id }));
    expect(t.hf!.peddler).toEqual({ hex: h.id, owner: 'a' });
    expect(err(play(arcState(), 'a', 'peddler', { hex: h.id }))).toMatch(/next to your/);
  });

  it('Trade Convoy makes one kind 2:1 for the turn only', () => {
    const s = arcState();
    expect(err(play(s, 'a', 'merchantfleet', { kind: 'bogus' as never }))).toMatch(/pick/);
    const t = ok(play(s, 'a', 'merchantfleet', { kind: 'vellum' }));
    expect(tradeRatio(t, 'a', 'vellum')).toBe(2);
    expect(tradeRatio(t, 'a', 'silk')).toBe(4);
    const u = ok(play(s, 'a', 'merchantfleet', { kind: 'clay' }));
    expect(tradeRatio(u, 'a', 'clay')).toBe(2);
    const end = applyAction(u, 'a', { type: 'endTurn' });
    if (!end.ok) throw end.error;
    expect(tradeRatio(end.state, 'a', 'clay')).toBe(4);
  });

  it('Corner the Market takes up to 2 of a resource from each opponent, short hands included', () => {
    const s = arcState();
    Object.assign(hand(s, 'b'), { timber: 5 });
    Object.assign(hand(s, 'c'), { timber: 1 });
    expect(err(play(s, 'a', 'resmonopoly', {}))).toMatch(/name a resource/);
    const t = ok(play(s, 'a', 'resmonopoly', { resource: 'timber' }));
    expect(hand(t, 'a').timber).toBe(3);
    expect(hand(t, 'b').timber).toBe(3);
    expect(hand(t, 'c').timber).toBe(0);
    const none = ok(play(arcState(), 'a', 'resmonopoly', { resource: 'clay' }));
    expect(hand(none, 'a').clay).toBe(0);
  });

  it('Corner the Wares takes 1 commodity from each opponent that has one', () => {
    const s = arcState();
    s.hf!.players.b.commodities.silk = 3;
    expect(err(play(s, 'a', 'trademonopoly', { commodity: 'clay' as never }))).toMatch(/name a commodity/);
    const t = ok(play(s, 'a', 'trademonopoly', { commodity: 'silk' }));
    expect(t.hf!.players.a.commodities.silk).toBe(1);
    expect(t.hf!.players.b.commodities.silk).toBe(2);
    expect(t.hf!.players.c.commodities.silk).toBe(0);
  });
});
