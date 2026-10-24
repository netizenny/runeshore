import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { glory, updateAwards } from '../src/engine/awards';
import { hfState } from './helpers';

describe('hf glory', () => {
  it('counts each source', () => {
    const s = hfState({ buildings: { a1: { owner: 'a', kind: 'outpost' }, a2: { owner: 'a', kind: 'citadel' } } });
    expect(glory(s, 'a', true)).toBe(3);
    s.hf!.spires.lore = { vertex: 'a2', owner: 'a' };
    expect(glory(s, 'a', true)).toBe(5);
    s.hf!.players.a.shields = 2;
    s.hf!.players.a.extraGlory = 1;
    s.hf!.peddler = { hex: Object.keys(s.board.hexes)[0], owner: 'a' };
    expect(glory(s, 'a', true)).toBe(9);
    expect(glory(s, 'b', true)).toBe(0);
    s.longestPath = 'a';
    expect(glory(s, 'a', true)).toBe(11);
  });

  it('no Grand host in this mode', () => {
    const s = hfState();
    s.players[0].wardensPlayed = 5;
    expect(updateAwards(s)).toEqual([]);
    expect(s.grandHost).toBeNull();
  });

  it('wins on the owner own turn once glory reaches the target', () => {
    const s = hfState();
    const id = s.order[s.current];
    s.settings.gloryTarget = 4;
    s.buildings = { v1: { owner: id, kind: 'citadel' } };
    s.hf!.players[id].shields = 2;
    s.hf!.players[id].commodities.vellum = 4;
    const r = applyAction(s, id, { type: 'bankTrade', give: 'vellum', get: 'clay' });
    expect(r.ok && r.state.phase).toEqual({ k: 'ended', winner: id });
  });
});
