import { describe, expect, it } from 'vitest';
import { RESOURCES } from '../src/constants';
import type { GameState } from '../src/types';
import { drive, newGame } from './drive';

function invariants(s: GameState) {
  for (const r of RESOURCES) {
    const total = s.bank[r] + s.players.reduce((n, p) => n + p.hand[r], 0);
    if (total !== 19) throw new Error(`${r} total ${total}`);
    if (s.bank[r] < 0 || s.players.some((p) => p.hand[r] < 0)) throw new Error(`negative ${r}`);
  }
  const held = s.players.reduce((n, p) => n + p.omens.length, 0);
  const played = s.log.filter((e) => e.type === 'omenPlayed').length;
  if (s.omenDeck.length + held + played !== 25) throw new Error(`omens ${s.omenDeck.length}+${held}+${played}`);
  for (const p of s.players) {
    if (p.piecesLeft.path < 0 || p.piecesLeft.outpost < 0 || p.piecesLeft.citadel < 0) throw new Error('pieces < 0');
  }
}

describe('fuzz', () => {
  for (const n of [3, 4]) {
    it(`50 seeds with ${n} players end with a winner and keep invariants`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const { state, steps } = drive(newGame(seed, n), seed, 3000, invariants);
        expect(state.phase.k, `seed ${seed} after ${steps} steps`).toBe('ended');
        invariants(state);
      }
    }, 120_000);
  }
});
