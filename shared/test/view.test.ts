import { describe, expect, it } from 'vitest';
import { logFor, viewFor } from '../src/view';
import { emptyCounts } from '../src/constants';
import { newGame } from './drive';

describe('viewFor', () => {
  const s = newGame(5, 3);
  s.players[0].hand = { ...emptyCounts(), clay: 2, harvest: 1 };
  s.players[1].hand = { ...emptyCounts(), starmetal: 4 };
  s.players[1].omens = [{ kind: 'relic', boughtTurn: 1 }];
  s.log.push({ type: 'stole', thief: 'a', victim: 'b', resource: 'clay' });

  it('shows own cards, only counts for others', () => {
    const v = viewFor(s, 'a');
    expect(v.players[0].hand).toEqual(s.players[0].hand);
    expect(v.players[1].hand).toBeUndefined();
    expect(v.players[1].omens).toBeUndefined();
    expect(v.players[1].handCount).toBe(4);
    expect(v.players[1].omenCount).toBe(1);
    expect(v.you).toBe('a');
    expect(v.omenDeckCount).toBe(s.omenDeck.length);
  });

  it('leaks no seed, rngState or deck order', () => {
    const json = JSON.stringify(viewFor(s, 'a'));
    expect(json).not.toContain('"seed"');
    expect(json).not.toContain('rngState');
    expect(json).not.toContain('omenDeck"');
    expect(json).not.toContain('relic');
  });

  it('hides the stolen card from a third player only', () => {
    const steal = (id: string) => logFor(s, id).find((e) => e.type === 'stole') as { resource: string | null };
    expect(steal('a').resource).toBe('clay');
    expect(steal('b').resource).toBe('clay');
    expect(steal('c').resource).toBeNull();
  });

  it('does not alias the live state', () => {
    const v = viewFor(s, 'a');
    v.players[0].hand!.clay = 99;
    expect(s.players[0].hand.clay).toBe(2);
  });
});
