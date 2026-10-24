import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { drawArcana } from '../src/engine/hf/arcana';
import { gateDraws } from '../src/engine/hf/improve';
import { glory } from '../src/engine/awards';
import { ARCANA, ARCANA_BY_KEY } from '../src/constants';
import { arcState, play } from './helpers';

describe('arcana deck', () => {
  it('has 54 cards, 18 per suit, each with a name and text', () => {
    for (const t of ['lore', 'guild', 'crown'] as const) {
      expect(ARCANA.filter((c) => c.track === t).reduce((n, c) => n + c.count, 0)).toBe(18);
    }
    expect(new Set(ARCANA.map((c) => c.name)).size).toBe(ARCANA.length);
    expect(ARCANA.every((c) => c.name && c.text)).toBe(true);
    const s = arcState();
    expect(s.hf!.arcanaDecks.guild.filter((c) => c === 'peddler')).toHaveLength(6);
  });

  it('draws a Glory card straight to the table, anything else into the hand', () => {
    const s = arcState();
    s.hf!.arcanaDecks.lore = ['printer', 'smith'];
    const before = glory(s, 'a', false);
    drawArcana(s, 'a', 'lore');
    expect(s.hf!.players.a.arcana).toEqual([]);
    expect(glory(s, 'a', false)).toBe(before + 1);
    drawArcana(s, 'a', 'lore');
    expect(s.hf!.players.a.arcana).toEqual(['smith']);
  });

  it('skips a gate draw when the hand is full', () => {
    const s = arcState();
    s.hf!.players.a.level.lore = 1;
    s.hf!.players.a.arcana = ['smith', 'smith', 'smith', 'smith'];
    expect(gateDraws(s, 'lore', 1)).toEqual([]);
  });
});

describe('playArcana', () => {
  it('needs the card in hand, your turn, and the right phase', () => {
    const s = arcState();
    expect(applyAction(s, 'a', { type: 'playArcana', card: 'crane' })).toMatchObject({ ok: false, error: /do not hold/ });
    s.hf!.players.b.arcana.push('crane');
    expect(applyAction(s, 'b', { type: 'playArcana', card: 'crane' })).toMatchObject({ ok: false, error: /not your turn/ });
    s.phase = { k: 'roll' };
    s.hf!.players.a.arcana.push('crane');
    expect(applyAction(s, 'a', { type: 'playArcana', card: 'crane' })).toMatchObject({ ok: false, error: /cannot play/ });
    s.phase = { k: 'discard', pending: { b: 1 } };
    expect(applyAction(s, 'a', { type: 'playArcana', card: 'crane' })).toMatchObject({ ok: false, error: /cannot play/ });
  });

  it('is refused with the mode off, and Glory cards cannot be played from the hand', () => {
    const s = arcState();
    const r = play(s, 'a', 'printer');
    expect(r).toMatchObject({ ok: false });
    delete s.hf;
    expect(applyAction(s, 'a', { type: 'playArcana', card: 'crane' })).toMatchObject({ ok: false });
  });

  it('sends the played card to the bottom of its stack and leaves state untouched on error', () => {
    const s = arcState();
    const top = s.hf!.arcanaDecks.lore.length;
    const r = play(s, 'a', 'crane');
    if (!r.ok) throw new Error(r.error);
    expect(r.state.hf!.arcanaDecks.lore).toHaveLength(top + 1);
    expect(r.state.hf!.arcanaDecks.lore.at(-1)).toBe('crane');
    expect(r.state.hf!.players.a.arcana).toEqual([]);
    const bad = play(s, 'a', 'engineer', { vertex: 'nope' });
    expect(bad.ok).toBe(false);
    expect(s.hf!.arcanaDecks.lore).toHaveLength(top);
    expect(ARCANA_BY_KEY.crane.track).toBe('lore');
  });
});
