import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { legalActions } from '../src/engine/legal';
import { advanceFleet } from '../src/engine/hf/fleet';
import { ALL_VERTICES } from '../src/board/geometry';
import { FLEET_TRACK } from '../src/constants';
import type { Action, GameState, PlayerId } from '../src/types';
import { hfState } from './helpers';

const V = ALL_VERTICES;
const ok = (s: GameState, id: PlayerId, a: Action) => {
  const r = applyAction(s, id, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const err = (s: GameState, id: PlayerId, a: Action) => {
  const r = applyAction(s, id, a);
  return r.ok ? '' : r.error;
};

// citadels: owner -> number of citadels; power: owner -> ranks of active Sentinels (one piece each).
function fleetAt(citadels: Record<PlayerId, number>, power: Record<PlayerId, number[]> = {}) {
  const s = hfState();
  let i = 0;
  for (const [id, n] of Object.entries(citadels)) for (let k = 0; k < n; k++) s.buildings[V[i++]] = { owner: id, kind: 'citadel' };
  for (const [id, ranks] of Object.entries(power)) for (const rank of ranks) s.hf!.sentinels[V[i++]] = { owner: id, rank: rank as 1 | 2 | 3, active: true, actedTurn: 0 };
  s.hf!.fleetPos = FLEET_TRACK - 1;
  return s;
}
const citadelsOf = (s: GameState, id: PlayerId) => Object.keys(s.buildings).filter((v) => s.buildings[v].owner === id && s.buildings[v].kind === 'citadel');

describe('fleet attack', () => {
  it('a ship before the last step only moves the marker', () => {
    const s = fleetAt({ a: 1 });
    s.hf!.fleetPos = 2;
    expect(advanceFleet(s, 6)).toEqual([{ type: 'fleetAdvanced', pos: 3 }]);
    expect(s.hf!.shadeActive).toBe(false);
  });

  it('defence ≥ strength: the single top contributor gets a Shield of the shore', () => {
    const s = fleetAt({ a: 1, b: 1, c: 1 }, { a: [2], b: [1] });
    const ev = advanceFleet(s, 6);
    expect(ev).toContainEqual({ type: 'fleetAttack', strength: 3, defence: 3, held: true });
    expect(s.hf!.players.a.shields).toBe(1);
    expect(s.hf!.players.b.shields).toBe(0);
  });

  it('resets the track, wakes the Shade, and deactivates every Sentinel', () => {
    const s = fleetAt({ a: 1 }, { a: [3], b: [1] });
    advanceFleet(s, 6);
    expect(s.hf!.fleetPos).toBe(0);
    expect(s.hf!.shadeActive).toBe(true);
    expect(Object.values(s.hf!.sentinels).every((k) => !k.active)).toBe(true);
  });

  it('tie for best: each tied player picks an Arcana stack, then the roll resumes', () => {
    let s = fleetAt({ a: 1, b: 1, c: 2 }, { a: [2], b: [2] });
    advanceFleet(s, 6);
    expect(s.phase).toMatchObject({ k: 'fleetReward', pending: ['a', 'b'], total: 6 });
    expect(err(s, 'c', { type: 'chooseReward', track: 'lore' })).toMatch(/no reward/);
    s = ok(s, 'a', { type: 'chooseReward', track: 'lore' });
    expect(s.hf!.players.a.arcana).toHaveLength(1);
    expect(s.hf!.arcanaDecks.lore).toHaveLength(17);
    expect(err(s, 'a', { type: 'chooseReward', track: 'lore' })).toMatch(/no reward/);
    const r = applyAction(s, 'b', { type: 'chooseReward', track: 'crown' });
    expect(r.ok && r.state.phase).toEqual({ k: 'main' });
    expect(r.ok && r.events.some((e) => e.type === 'produced')).toBe(true);
  });

  it('tie for best with a 7 resumes into the discard / Shade procedure', () => {
    const s = fleetAt({ a: 1, b: 1, c: 2 }, { a: [2], b: [2] });
    Object.assign(s.players[0].hand, { clay: 8 });
    advanceFleet(s, 7);
    const r = ok(ok(s, 'a', { type: 'chooseReward', track: 'lore' }), 'b', { type: 'chooseReward', track: 'lore' });
    expect(r.phase).toMatchObject({ k: 'discard' });
  });

  it('a tied player is skipped when their Arcana hand is full', () => {
    const s = fleetAt({ a: 1, b: 1, c: 2 }, { a: [2], b: [2] });
    s.hf!.players.a.arcana = ['x', 'x', 'x', 'x'];
    advanceFleet(s, 6);
    expect(s.phase).toMatchObject({ k: 'fleetReward', pending: ['b'] });
  });

  it('nobody contributed and the Fleet is held: nothing happens', () => {
    const s = fleetAt({});
    advanceFleet(s, 6);
    expect(s.phase).toEqual({ k: 'main' });
    expect(Object.values(s.hf!.players).every((p) => p.shields === 0)).toBe(true);
  });

  it('defence < strength: the weakest Citadel owners each lose one (ties both lose), Bulwark goes too', () => {
    const s = fleetAt({ a: 1, b: 1, c: 0 }, {});
    const [va] = citadelsOf(s, 'a');
    s.hf!.bulwarks.push(va);
    const before = s.players[0].piecesLeft.outpost;
    const ev = advanceFleet(s, 6);
    expect(ev).toContainEqual({ type: 'fleetAttack', strength: 2, defence: 0, held: false });
    expect(citadelsOf(s, 'a')).toEqual([]);
    expect(s.buildings[va]).toMatchObject({ owner: 'a', kind: 'outpost' });
    expect(s.players[0].piecesLeft.outpost).toBe(before - 1);
    expect(s.hf!.bulwarks).toEqual([]);
    expect(citadelsOf(s, 'b')).toEqual([]);
    expect(s.phase).toEqual({ k: 'main' });
  });

  it('a player with no Citadels is never the weakest', () => {
    const s = fleetAt({ a: 2, b: 1 }, { a: [1], c: [1] });
    advanceFleet(s, 6);
    expect(citadelsOf(s, 'a')).toHaveLength(2);
    expect(citadelsOf(s, 'b')).toHaveLength(0);
  });

  it('with several Citadels the loser chooses; the roll resumes after all have chosen', () => {
    let s = fleetAt({ a: 2, b: 2, c: 0 }, {});
    advanceFleet(s, 6);
    expect(s.phase).toMatchObject({ k: 'fleetLoss', pending: ['a', 'b'] });
    expect(legalActions(s, 'a')).toHaveLength(2);
    const [x, y] = citadelsOf(s, 'a');
    expect(err(s, 'a', { type: 'chooseLoss', vertex: citadelsOf(s, 'b')[0] })).toBeTruthy();
    s = ok(s, 'a', { type: 'chooseLoss', vertex: x });
    expect(s.buildings[x].kind).toBe('outpost');
    expect(s.buildings[y].kind).toBe('citadel');
    expect(err(s, 'a', { type: 'chooseLoss', vertex: y })).toMatch(/give up/);
    s = ok(s, 'b', { type: 'chooseLoss', vertex: citadelsOf(s, 'b')[0] });
    expect(s.phase).toEqual({ k: 'main' });
  });

  it('Citadels under a Spire are safe; a player with only those loses nothing', () => {
    const s = fleetAt({ a: 1, b: 2 }, {});
    s.hf!.spires.lore = { vertex: citadelsOf(s, 'a')[0], owner: 'a' };
    advanceFleet(s, 6);
    expect(citadelsOf(s, 'a')).toHaveLength(1);
    expect(citadelsOf(s, 'b')).toHaveLength(2);
    expect(s.phase).toMatchObject({ k: 'fleetLoss', pending: ['b'] });
  });

  it('a Spire Citadel is not offered when the owner has a choice', () => {
    const s = fleetAt({ a: 3 }, {});
    const [sp, x, y] = citadelsOf(s, 'a');
    s.hf!.spires.crown = { vertex: sp, owner: 'a' };
    advanceFleet(s, 6);
    expect(s.phase).toMatchObject({ k: 'fleetLoss', pending: ['a'] });
    expect(err(s, 'a', { type: 'chooseLoss', vertex: sp })).toBeTruthy();
    expect(legalActions(s, 'a').map((a) => (a as { vertex: string }).vertex).sort()).toEqual([x, y].sort());
  });

  it('a ship on the event die at the last step triggers the attack from roll', () => {
    for (let seed = 1; seed < 200; seed++) {
      const s = fleetAt({ a: 1 }, {});
      s.phase = { k: 'roll' };
      s.rngState = seed;
      const r = applyAction(s, s.order[s.current], { type: 'roll' });
      if (!r.ok || r.state.hf!.eventDie !== 'ship') continue;
      expect(r.events.some((e) => e.type === 'fleetAttack')).toBe(true);
      expect(r.state.hf!.shadeActive).toBe(true);
      return;
    }
    throw new Error('no ship roll found');
  });
});
