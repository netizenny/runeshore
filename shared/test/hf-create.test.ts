import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { createGame } from '../src/engine/create';
import { legalActions } from '../src/engine/legal';
import { vertexEdges } from '../src/board/geometry';
import { DEFAULT_SETTINGS } from '../src/types';
import { PLAYERS, hfState } from './helpers';

describe('hf creation', () => {
  it('mode off: no hf key, Omen deck present, deterministic', () => {
    const a = createGame(PLAYERS, DEFAULT_SETTINGS, 7);
    expect('hf' in a).toBe(false);
    expect(a.omenDeck.length).toBe(25);
    expect(createGame(PLAYERS, DEFAULT_SETTINGS, 7)).toEqual(a);
  });

  it('mode on: commodity bank, three stacks of 18, no Omens', () => {
    const s = hfState();
    expect(s.omenDeck).toEqual([]);
    const hf = s.hf!;
    expect(hf.bank).toEqual({ vellum: 12, silk: 12, sigil: 12 });
    for (const t of ['lore', 'guild', 'crown'] as const) expect(hf.arcanaDecks[t]).toHaveLength(18);
    expect(hf.arcanaDecks.lore).not.toEqual([...hf.arcanaDecks.lore].sort());
    for (const p of s.players) {
      expect(hf.players[p.id].level).toEqual({ lore: 0, guild: 0, crown: 0 });
      expect(hf.players[p.id].commodities).toEqual({ vellum: 0, silk: 0, sigil: 0 });
    }
    expect(hf.shadeActive).toBe(false);
  });

  it('second setup outpost is a Citadel paying base cards only', () => {
    let s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, boardMode: 'starter', hollowFleet: true }, 3);
    const put = (vertex: string) => {
      const who = s.order[s.current];
      let r = applyAction(s, who, { type: 'placeOutpost', vertex });
      if (!r.ok) throw new Error(r.error);
      s = r.state;
      r = applyAction(s, who, { type: 'placePath', edge: vertexEdges(vertex).find((e) => !s.paths[e])! });
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    };
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < 3; i++) {
        const v = legalActions(s, s.order[s.current]).find((a) => a.type === 'placeOutpost')!;
        put((v as { vertex: string }).vertex);
      }
    }
    const kinds = Object.values(s.buildings).map((b) => b.kind);
    expect(kinds.filter((k) => k === 'outpost')).toHaveLength(3);
    expect(kinds.filter((k) => k === 'citadel')).toHaveLength(3);
    expect(s.players.every((p) => p.piecesLeft.outpost === 4 && p.piecesLeft.citadel === 3)).toBe(true);
    expect(Object.values(s.hf!.players).every((p) => Object.values(p.commodities).every((n) => n === 0))).toBe(true);
    expect(s.hf!.bank).toEqual({ vellum: 12, silk: 12, sigil: 12 });
  });

  it('no Omens: buy and play refused, never offered', () => {
    const s = hfState();
    const id = s.order[s.current];
    s.players.find((p) => p.id === id)!.hand = { clay: 0, timber: 0, fleece: 5, harvest: 5, starmetal: 5 };
    expect(applyAction(s, id, { type: 'buyOmen' })).toEqual({ ok: false, error: 'no Omens in this mode' });
    expect(applyAction(s, id, { type: 'playOmen', kind: 'warden' }).ok).toBe(false);
    expect(legalActions(s, id).some((a) => a.type === 'buyOmen' || a.type === 'playOmen')).toBe(false);
  });
});
