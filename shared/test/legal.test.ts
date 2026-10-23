import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { autoAct, legalActions, pendingPlayers } from '../src/engine/legal';
import { emptyCounts } from '../src/constants';
import { drive, newGame } from './drive';

describe('legalActions', () => {
  it('every listed action applies ok, over 30 random mid-game states', () => {
    let checked = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let s = newGame(seed, 3 + (seed % 2));
      s = drive(s, seed, 40 + seed * 7).state;
      for (const p of s.players) {
        for (const a of legalActions(s, p.id)) {
          const r = applyAction(s, p.id, a);
          expect(r.ok, `${JSON.stringify(a)} in ${s.phase.k}: ${!r.ok && r.error}`).toBe(true);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('autoAct is ok for every pending player', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = drive(newGame(seed, 4), seed, 30 + seed * 9).state;
      for (const id of pendingPlayers(s)) expect(autoAct(s, id).ok).toBe(true);
    }
  });

  it('autoAct refuses a player nothing is pending for', () => {
    const s = newGame(1, 3);
    const other = s.order[1];
    expect(autoAct(s, other).ok).toBe(false);
  });

  it('discard phase: pending players only, exact count', () => {
    const s = newGame(1, 3);
    s.phase = { k: 'discard', pending: { [s.order[1]]: 2 } };
    s.players.find((p) => p.id === s.order[1])!.hand = { ...emptyCounts(), clay: 3, timber: 1 };
    expect(pendingPlayers(s)).toEqual([s.order[1]]);
    expect(legalActions(s, s.order[0])).toEqual([]);
    expect(legalActions(s, s.order[1]).length).toBe(2); // 2 clay, or clay+timber
  });
});
