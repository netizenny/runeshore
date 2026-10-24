import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { hexVertices, vertexEdges } from '../src/board/geometry';
import type { GameState } from '../src/types';
import { arcState, play } from './helpers';

const ok = (r: ReturnType<typeof play>) => {
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const err = (r: ReturnType<typeof play>) => (r.ok ? '' : r.error);
const hexOf = (s: GameState, terrain: string) => Object.values(s.board.hexes).filter((h) => h.terrain === terrain);
// A vertex beside the first hex of that terrain.
const beside = (s: GameState, terrain: string) => hexVertices(hexOf(s, terrain)[0].id)[0];

describe('lore arcana', () => {
  it('Fatecaster fixes both dice, before the roll only', () => {
    const s = arcState();
    expect(err(play(s, 'a', 'alchemist', { dice: [3, 4] }))).toMatch(/cannot play/);
    s.phase = { k: 'roll' };
    expect(err(play(s, 'a', 'alchemist', { dice: [0, 4] }))).toMatch(/two dice/);
    const t = ok(play(s, 'a', 'alchemist', { dice: [3, 4] }));
    const r = applyAction(t, 'a', { type: 'roll' });
    if (!r.ok) throw r.error;
    expect(r.state.dice).toEqual([3, 4]);
    expect(r.state.hf!.turnFlags.alchemist).toBeUndefined();
  });

  it('Winch takes 1 off one improvement and cannot stack', () => {
    const s = arcState();
    s.buildings[beside(s, 'timber')] = { owner: 'a', kind: 'citadel' };
    const t = ok(play(s, 'a', 'crane'));
    expect(err(play(t, 'a', 'crane'))).toMatch(/already/);
    const r = applyAction(t, 'a', { type: 'improve', track: 'lore' }); // level 1 costs 1, now free
    if (!r.ok) throw r.error;
    expect(r.state.hf!.players.a.level.lore).toBe(1);
    expect(r.state.hf!.turnFlags.crane).toBeUndefined();
    t.hf!.players.a.level.lore = 2;
    t.hf!.players.a.commodities.vellum = 2;
    const r2 = applyAction(t, 'a', { type: 'improve', track: 'lore' }); // level 3 costs 3, now 2
    if (!r2.ok) throw r2.error;
    expect(r2.state.hf!.players.a.commodities.vellum).toBe(0);
  });

  it('Mason builds a Bulwark free, only on your Citadel', () => {
    const s = arcState();
    const v = beside(s, 'timber');
    s.buildings[v] = { owner: 'a', kind: 'outpost' };
    expect(err(play(s, 'a', 'engineer', { vertex: v }))).toMatch(/citadel/);
    s.buildings[v].kind = 'citadel';
    const t = ok(play(s, 'a', 'engineer', { vertex: v }));
    expect(t.hf!.bulwarks).toEqual([v]);
    expect(t.players.find((p) => p.id === 'a')!.hand.clay).toBe(s.players.find((p) => p.id === 'a')!.hand.clay);
  });

  it('Tinkerer swaps two tokens but never a 2, 6, 8 or 12', () => {
    const s = arcState();
    const hexes = Object.values(s.board.hexes);
    const free = hexes.filter((h) => h.token !== null && ![2, 6, 8, 12].includes(h.token!));
    const fixed = hexes.find((h) => h.token === 6 || h.token === 8)!;
    const [a, b] = free.filter((h, i, all) => h.token !== all[0].token);
    expect(err(play(s, 'a', 'inventor', { hexes: [a.id, a.id] }))).toMatch(/different/);
    expect(err(play(s, 'a', 'inventor', { hexes: [a.id, fixed.id] }))).toMatch(/cannot move/);
    const t = ok(play(s, 'a', 'inventor', { hexes: [a.id, b.id] }));
    expect(t.board.hexes[a.id].token).toBe(b.token);
    expect(t.board.hexes[b.id].token).toBe(a.token);
  });

  it('Floodgate and Deepdelve pay 2 per hex beside your buildings, no matter the Citadel', () => {
    const s = arcState();
    const h = hexOf(s, 'harvest')[0];
    s.buildings[hexVertices(h.id)[0]] = { owner: 'a', kind: 'citadel' };
    const before = s.players.find((p) => p.id === 'a')!.hand.harvest;
    const t = ok(play(s, 'a', 'irrigation'));
    const adjacent = hexOf(s, 'harvest').filter((x) => hexVertices(x.id).some((v) => t.buildings[v]?.owner === 'a')).length;
    expect(t.players.find((p) => p.id === 'a')!.hand.harvest).toBe(before + 2 * adjacent);
    expect(t.bank.harvest).toBe(s.bank.harvest - 2 * adjacent);
    // nothing beside you: legal, pays nothing
    const u = ok(play(arcState(), 'a', 'mining'));
    expect(u.players.find((p) => p.id === 'a')!.hand.starmetal).toBe(0);
  });

  it('Deepdelve stops at what the vault holds', () => {
    const s = arcState();
    s.buildings[hexVertices(hexOf(s, 'starmetal')[0].id)[0]] = { owner: 'a', kind: 'outpost' };
    s.bank.starmetal = 1;
    const t = ok(play(s, 'a', 'mining'));
    expect(t.players.find((p) => p.id === 'a')!.hand.starmetal).toBe(1);
    expect(t.bank.starmetal).toBe(0);
  });

  it('Apothecary upgrades for 2 Starmetal and 1 Harvest', () => {
    const s = arcState();
    const v = beside(s, 'timber');
    s.buildings[v] = { owner: 'a', kind: 'outpost' };
    const me = s.players.find((p) => p.id === 'a')!;
    Object.assign(me.hand, { harvest: 1, starmetal: 1 });
    expect(err(play(s, 'a', 'medicine', { vertex: v }))).toMatch(/afford/);
    me.hand.starmetal = 2;
    const t = ok(play(s, 'a', 'medicine', { vertex: v }));
    expect(t.buildings[v].kind).toBe('citadel');
    expect(t.players.find((p) => p.id === 'a')!.hand).toMatchObject({ harvest: 0, starmetal: 0 });
  });

  it('Chronicle gives Glory only when drawn (covered in core), never from the hand', () => {
    expect(err(play(arcState(), 'a', 'printer'))).toMatch(/drawn/);
  });

  it('Wayfarers lays up to 2 Paths free, each following the normal rule', () => {
    const s = arcState();
    const v = beside(s, 'timber');
    s.buildings[v] = { owner: 'a', kind: 'outpost' };
    const [e1] = vertexEdges(v);
    const paths = s.players.find((p) => p.id === 'a')!.piecesLeft.path;
    expect(err(play(s, 'a', 'roadbuilding', { edges: [] }))).toMatch(/one or two/);
    expect(err(play(s, 'a', 'roadbuilding', { edges: ['nope'] }))).toMatch(/connect/);
    const t = ok(play(s, 'a', 'roadbuilding', { edges: [e1, vertexEdges(v)[1]] }));
    expect(t.paths[e1]).toBe('a');
    expect(t.players.find((p) => p.id === 'a')!.piecesLeft.path).toBe(paths - 2);
  });

  it('Forgemaster promotes two Sentinels free; Mighty still needs Crown 3', () => {
    const s = arcState();
    const [v1, v2] = hexVertices(hexOf(s, 'timber')[0].id);
    s.hf!.sentinels[v1] = { owner: 'a', rank: 1, active: true, actedTurn: 0 };
    s.hf!.sentinels[v2] = { owner: 'a', rank: 2, active: false, actedTurn: 0 };
    expect(err(play(s, 'a', 'smith', { vertices: [v1, v1] }))).toMatch(/different/);
    expect(err(play(s, 'a', 'smith', { vertices: [v1, v2] }))).toMatch(/Crown level 3/);
    s.hf!.players.a.level.crown = 3;
    const t = ok(play(s, 'a', 'smith', { vertices: [v1, v2] }));
    expect(t.hf!.sentinels[v1]).toMatchObject({ rank: 2, active: true });
    expect(t.hf!.sentinels[v2]).toMatchObject({ rank: 3, active: false });
  });
});
