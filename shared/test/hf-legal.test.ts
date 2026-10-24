import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { autoAct, legalActions, pendingPlayers } from '../src/engine/legal';
import type { GameState } from '../src/types';
import { drive, newGame } from './drive';

const hf = (seed: number) => newGame(seed, 3, { hollowFleet: true, renownTarget: 13 });

describe('hf legalActions and autoAct', () => {
  it('every legal action applies, and autoAct always finishes the phase, over seeded mid-game states', () => {
    for (let seed = 1; seed <= 6; seed++) {
      let n = 0;
      drive(hf(seed), seed, 1500, (s: GameState) => {
        if (++n % 25) return;
        for (const id of pendingPlayers(s)) {
          for (const a of legalActions(s, id)) expect(applyAction(s, id, a).ok, `seed ${seed} ${JSON.stringify(a)}`).toBe(true);
          expect(autoAct(s, id).ok, `seed ${seed} autoAct in ${s.phase.k}`).toBe(true);
        }
      });
    }
    // Autopilot alone only rolls and ends turns, so no winner is expected; it must just never error.
    for (let seed = 1; seed <= 3; seed++) {
      let s = hf(seed);
      for (let i = 0; i < 4000 && s.phase.k !== 'ended'; i++) {
        const r = autoAct(s, pendingPlayers(s)[0]);
        if (!r.ok) throw new Error(`seed ${seed} stuck in ${s.phase.k}: ${r.error}`);
        s = r.state;
      }
    }
  }, 300_000);

  it('offers a held Arcana card as a play', () => {
    const s = hf(1);
    s.phase = { k: 'main' };
    s.hf!.players[s.order[s.current]].arcana = ['crane', 'warlord'];
    const cards = legalActions(s, s.order[s.current]).flatMap((a) => (a.type === 'playArcana' ? [a.card] : []));
    expect(cards.sort()).toEqual(['crane', 'warlord']);
  });
});
