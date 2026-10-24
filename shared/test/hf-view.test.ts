import { describe, expect, it } from 'vitest';
import { viewFor } from '../src/view';
import { newGame } from './drive';

describe('viewFor with Hollow Fleet', () => {
  const s = newGame(3, 3, { hollowFleet: true });
  s.hf!.players.a.arcana = ['spy', 'crane'];
  s.hf!.players.b.arcana = ['warlord'];
  s.hf!.turnFlags.alchemist = [3, 4];

  it('shows only your own Arcana and counts for the rest', () => {
    const v = viewFor(s, 'a').hf!;
    expect(v.players.a.arcana).toEqual(['spy', 'crane']);
    expect(v.players.b.arcana).toBeUndefined();
    expect(v.players.b.arcanaCount).toBe(1);
    expect(v.arcanaDeckCounts).toEqual({ lore: 18, guild: 18, crown: 18 });
    expect(JSON.stringify(viewFor(s, 'b'))).not.toMatch(/warlord.*warlord|arcanaDecks|"spy"/);
  });

  it('hides a Fatecaster result from everyone but the player on turn', () => {
    expect(viewFor(s, s.order[s.current]).hf!.turnFlags.alchemist).toEqual([3, 4]);
    expect(viewFor(s, s.order[(s.current + 1) % 3]).hf!.turnFlags.alchemist).toBeUndefined();
  });

  it('leaves no hf key when the mode is off', () => {
    expect('hf' in viewFor(newGame(3, 3), 'a')).toBe(false);
  });
});
