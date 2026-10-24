import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { tradeRatio } from '../src/engine/trade';
import { legalActions } from '../src/engine/legal';
import { gateDraws, loreBonus } from '../src/engine/hf/improve';
import { ALL_VERTICES } from '../src/board/geometry';
import type { Action, GameState, PlayerId, Track } from '../src/types';
import { hfState } from './helpers';

const V = ALL_VERTICES;
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
const setup = () => {
  const s = hfState();
  const [a, b] = s.order;
  s.buildings[V[0]] = { owner: a, kind: 'citadel' };
  s.buildings[V[1]] = { owner: a, kind: 'citadel' };
  s.buildings[V[10]] = { owner: b, kind: 'citadel' };
  for (const id of [a, b]) Object.assign(s.hf!.players[id].commodities, { vellum: 30, silk: 30, sigil: 30 });
  return { s, a, b };
};
const up = (s: GameState, id: PlayerId, track: Track, n: number, vertex?: string) => {
  for (let i = 0; i < n; i++) s = ok(s, id, { type: 'improve', track, vertex });
  return s;
};

describe('improvements', () => {
  it('level n costs n of the track commodity, returned to the bank', () => {
    const { s, a } = setup();
    const t = up(s, a, 'lore', 3);
    expect(t.hf!.players[a].level.lore).toBe(3);
    expect(t.hf!.players[a].commodities.vellum).toBe(30 - 6);
    expect(t.hf!.bank.vellum).toBe(s.hf!.bank.vellum + 6);
  });

  it('needs a Citadel, enough commodity, and stops at level 5', () => {
    const { s, a } = setup();
    expect(err(s, s.order[1], { type: 'improve', track: 'lore' })).toMatch(/not your turn/);
    delete s.buildings[V[0]], delete s.buildings[V[1]];
    expect(err(s, a, { type: 'improve', track: 'lore' })).toMatch(/Citadel/);
    s.buildings[V[0]] = { owner: a, kind: 'citadel' };
    s.hf!.players[a].commodities.vellum = 0;
    expect(err(s, a, { type: 'improve', track: 'lore' })).toMatch(/afford/);
    s.hf!.players[a].commodities.vellum = 99;
    const t = up(s, a, 'lore', 5);
    expect(err(t, a, { type: 'improve', track: 'lore' })).toMatch(/top/);
    expect(legalActions(t, a).some((x) => x.type === 'improve' && x.track === 'lore')).toBe(false);
    expect(legalActions(s, a).some((x) => x.type === 'improve' && x.track === 'lore')).toBe(true);
  });

  it('no Spire below level 4', () => {
    const { s, a } = setup();
    expect(up(s, a, 'crown', 3).hf!.spires.crown).toBeNull();
  });

  it('level 4 claims the Spire on a chosen Citadel; one Spire per Citadel', () => {
    const { s, a } = setup();
    const t = up(up(s, a, 'lore', 4, V[1]), a, 'guild', 4);
    expect(t.hf!.spires.lore).toEqual({ vertex: V[1], owner: a });
    expect(t.hf!.spires.guild).toEqual({ vertex: V[0], owner: a }); // V[1] taken, falls to the free one
  });

  it('level 5 past the holder takes the Spire; equal or lower level does not', () => {
    const { s, a, b } = setup();
    let t = up(s, a, 'lore', 4);
    t.current = t.order.indexOf(b);
    t = up(t, b, 'lore', 4);
    expect(t.hf!.spires.lore!.owner).toBe(a); // level 4 vs 4: no steal
    t = up(t, b, 'lore', 1);
    expect(t.hf!.spires.lore).toEqual({ vertex: V[10], owner: b });
  });

  it('a Spire is skipped when there is no free Citadel', () => {
    const { s, a } = setup();
    delete s.buildings[V[1]];
    const t = up(up(s, a, 'lore', 4), a, 'guild', 4);
    expect(t.hf!.spires.guild).toBeNull();
  });

  it('Guild level 3 trades commodities 2:1', () => {
    const { s, a } = setup();
    expect(tradeRatio(s, a, 'silk')).toBe(4);
    expect(tradeRatio(up(s, a, 'guild', 3), a, 'silk')).toBe(2);
  });

  it('Lore level 3 pays 1 base resource when a roll paid nothing', () => {
    const { s, a, b } = setup();
    s.hf!.players[a].level.lore = 3;
    const gains: Record<string, object> = { [b]: { clay: 1 } };
    loreBonus(s, gains);
    expect(Object.keys(gains).sort()).toEqual([a, b].sort());
    expect(s.bank.timber + s.bank.clay + s.bank.fleece + s.bank.harvest + s.bank.starmetal).toBe(
      5 * 19 - 1,
    );
  });
});

describe('gate draws', () => {
  it('draw when red die <= level + 1, never at level 0, never past the hand limit, empty stack is skipped', () => {
    const { s, a, b } = setup();
    s.hf!.players[a].level.crown = 2;
    const n = s.hf!.arcanaDecks.crown.length;
    gateDraws(s, 'crown', 3);
    expect(s.hf!.players[a].arcana).toHaveLength(1);
    expect(s.hf!.players[b].arcana).toHaveLength(0);
    expect(s.hf!.arcanaDecks.crown).toHaveLength(n - 1);
    gateDraws(s, 'crown', 4);
    expect(s.hf!.players[a].arcana).toHaveLength(1);
    s.hf!.players[a].arcana = ['x', 'x', 'x', 'x'];
    gateDraws(s, 'crown', 1);
    expect(s.hf!.players[a].arcana).toHaveLength(4);
    s.hf!.players[a].arcana = [];
    s.hf!.arcanaDecks.crown = [];
    expect(gateDraws(s, 'crown', 1)).toEqual([]);
  });
});
