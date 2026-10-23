import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { legalActions } from '../src/engine/legal';
import { hexVertices } from '../src/board/geometry';
import { emptyCounts } from '../src/constants';
import type { Action, GameState, PlayerId, Terrain } from '../src/types';
import { hfState } from './helpers';

const act = (s: GameState, id: PlayerId, a: Action) => {
  const r = applyAction(s, id, a);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const cur = (s: GameState) => s.order[s.current];
const total = (s: GameState) => s.dice![0] + s.dice![1];
const roll = (s: GameState) => act(s, cur(s), { type: 'roll' });
const hand = (s: GameState, id: PlayerId, c: Partial<ReturnType<typeof emptyCounts>>) => {
  s.players.find((p) => p.id === id)!.hand = { ...emptyCounts(), ...c };
};
// A roll-phase state whose next roll satisfies `ok`.
function rig(ok: (total: number) => boolean) {
  let s = hfState({ phase: { k: 'roll' } });
  while (!ok(total(roll(s).state))) s = { ...s, rngState: s.rngState + 1 };
  return s;
}
// Retarget one hex so the rigged roll pays it; returns its vertices.
function target(s: GameState, terrain: Terrain) {
  const hex = Object.values(s.board.hexes).find((h) => h.terrain !== 'ashen')!;
  hex.terrain = terrain;
  hex.token = total(roll(s).state);
  return hexVertices(hex.id);
}

describe('hf dice', () => {
  it('same state gives the same roll; three dice from rngState', () => {
    const s = hfState({ phase: { k: 'roll' } });
    const a = roll(s), b = roll(s);
    expect(a.state.dice).toEqual(b.state.dice);
    expect(a.state.hf!.eventDie).toBe(b.state.hf!.eventDie);
    expect(a.events.map((e) => e.type)).toContain('eventDie');
    expect(a.state.rngState).not.toBe(s.rngState);
  });

  it('event die: ship about half the time, each track about a sixth', () => {
    const faces: Record<string, number> = {};
    for (let i = 0; i < 600; i++) {
      const f = roll(hfState({ phase: { k: 'roll' }, rngState: i * 7919 + 1 })).state.hf!.eventDie!;
      faces[f] = (faces[f] ?? 0) + 1;
    }
    expect(Object.keys(faces).sort()).toEqual(['crown', 'guild', 'lore', 'ship']);
    expect(faces.ship).toBeGreaterThan(250);
    expect(faces.ship).toBeLessThan(350);
    for (const t of ['lore', 'guild', 'crown']) expect(faces[t]).toBeGreaterThan(60);
  });

  it('citadel on Timber pays Timber + Vellum; outpost 1 Timber; clay citadel pays 2 base', () => {
    const s = rig((t) => t !== 7);
    const [v1, v2] = target(s, 'timber');
    s.buildings = { [v1]: { owner: 'a', kind: 'citadel' }, [v2]: { owner: 'b', kind: 'outpost' } };
    const out = roll(s).state;
    const pa = out.players.find((p) => p.id === 'a')!, pb = out.players.find((p) => p.id === 'b')!;
    expect([pa.hand.timber, out.hf!.players.a.commodities.vellum]).toEqual([1, 1]);
    expect([pb.hand.timber, out.hf!.players.b.commodities.vellum]).toEqual([1, 0]);
    expect(out.hf!.bank.vellum).toBe(11);
    expect(out.bank.timber).toBe(17);

    const c = rig((t) => t !== 7);
    const [w] = target(c, 'clay');
    c.buildings = { [w]: { owner: 'a', kind: 'citadel' } };
    const o2 = roll(c).state;
    expect(o2.players.find((p) => p.id === 'a')!.hand.clay).toBe(2);
    expect(o2.hf!.players.a.commodities).toEqual({ vellum: 0, silk: 0, sigil: 0 });
  });

  it('short commodity bank: two owed -> nobody gets it; base card still paid', () => {
    const s = rig((t) => t !== 7);
    const [v1, v2] = target(s, 'starmetal');
    s.buildings = { [v1]: { owner: 'a', kind: 'citadel' }, [v2]: { owner: 'b', kind: 'citadel' } };
    s.hf!.bank.sigil = 1;
    const out = roll(s).state;
    expect(out.hf!.bank.sigil).toBe(1);
    expect(out.players.find((p) => p.id === 'a')!.hand.starmetal).toBe(1);
  });

  it('a 7 with the Shade asleep: discards happen (commodities count), then main, no steal', () => {
    const s = rig((t) => t === 7);
    hand(s, 'b', { clay: 5 });
    s.hf!.players.b.commodities.silk = 4; // 9 cards counting commodities
    const r = roll(s).state;
    expect(r.phase).toEqual({ k: 'discard', pending: { b: 4 } });
    const d = act(r, 'b', { type: 'discard', cards: { ...emptyCounts(), clay: 2 }, commodities: { vellum: 0, silk: 2, sigil: 0 } }).state;
    expect(d.phase).toEqual({ k: 'main' });
    expect(d.hf!.bank.silk).toBe(14);
    expect(d.hf!.players.b.commodities.silk).toBe(2);
    expect(applyAction(r, 'b', { type: 'discard', cards: { ...emptyCounts(), clay: 5 } }).ok).toBe(false);
    // every generated discard is accepted
    const legal = legalActions(r, 'b');
    expect(legal.length).toBeGreaterThan(0);
    for (const a of legal) expect(applyAction(r, 'b', a).ok).toBe(true);
    // an awake Shade moves after the discards
    r.hf!.shadeActive = true;
    expect(act(r, 'b', { type: 'discard', cards: { ...emptyCounts(), clay: 4 } }).state.phase).toEqual({ k: 'moveShade', then: 'main' });
  });

  it('a Bulwark raises the owner discard limit by 2', () => {
    const s = rig((t) => t === 7);
    const [v] = hexVertices(Object.keys(s.board.hexes)[0]);
    s.buildings[v] = { owner: 'b', kind: 'citadel' };
    s.hf!.bulwarks = [v];
    hand(s, 'b', { clay: 9 });
    expect(roll(s).state.phase.k).toBe('main');
    hand(s, 'b', { clay: 10 });
    expect(roll(s).state.phase).toEqual({ k: 'discard', pending: { b: 5 } });
  });

  it('bank trade: commodities 4:1 for anything; refused with the mode off', () => {
    const s = hfState();
    const id = cur(s);
    s.hf!.players[id].commodities.vellum = 4;
    const r = act(s, id, { type: 'bankTrade', give: 'vellum', get: 'clay' }).state;
    expect(r.hf!.players[id].commodities.vellum).toBe(0);
    expect(r.hf!.bank.vellum).toBe(16);
    expect(r.players.find((p) => p.id === id)!.hand.clay).toBe(1);
    expect(act(s, id, { type: 'bankTrade', give: 'vellum', get: 'silk' }).state.hf!.players[id].commodities).toEqual({ vellum: 0, silk: 1, sigil: 0 });
    expect(legalActions(s, id).some((a) => a.type === 'bankTrade' && a.give === 'vellum')).toBe(true);
    s.hf!.players[id].commodities.vellum = 3;
    expect(applyAction(s, id, { type: 'bankTrade', give: 'vellum', get: 'clay' }).ok).toBe(false);
    const off = { ...s, hf: undefined };
    expect(applyAction(off, id, { type: 'bankTrade', give: 'vellum', get: 'clay' }).ok).toBe(false);
  });
});
