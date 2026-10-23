import { applyAction } from '../src/engine/apply';
import { createGame } from '../src/engine/create';
import { autoAct, legalActions, pendingPlayers } from '../src/engine/legal';
import { nextRandom } from '../src/rng';
import { DEFAULT_SETTINGS, type Action, type GameState } from '../src/types';

const COLORS = ['ember', 'tide', 'moss', 'bone'] as const;
const PREFER: Action['type'][] = ['buildCitadel', 'buildOutpost', 'buyOmen', 'playOmen'];

export function newGame(seed: number, n: number, partial = {}): GameState {
  const players = Array.from({ length: n }, (_, i) => ({ id: 'abcd'[i], name: `P${i}`, color: COLORS[i] }));
  return createGame(players, { ...DEFAULT_SETTINGS, ...partial }, seed);
}

// Plays with a builder-leaning random policy; calls onStep(before, action, result) for every action.
export function drive(s: GameState, seed: number, max: number, onStep?: (s: GameState) => void): { state: GameState; steps: number } {
  let rng = seed >>> 0 || 1;
  const r = () => {
    let v: number;
    [v, rng] = nextRandom(rng);
    return v;
  };
  let steps = 0;
  while (s.phase.k !== 'ended' && steps < max) {
    const who = pendingPlayers(s);
    const id = who[Math.floor(r() * who.length)];
    let res;
    const setupOrForced = s.phase.k !== 'main' && s.phase.k !== 'roll';
    if (setupOrForced || r() < 0.1) res = autoAct(s, id);
    else {
      const legal = legalActions(s, id);
      const preferred = legal.filter((a) => PREFER.includes(a.type));
      const pool = preferred.length && r() < 0.8 ? preferred : legal.filter((a) => a.type !== 'endTurn' || r() < 0.15);
      const a = pool[Math.floor(r() * pool.length)] ?? { type: 'endTurn' as const };
      res = applyAction(s, id, a);
    }
    if (!res.ok) throw new Error(`step ${steps} (${s.phase.k}) ${id}: ${res.error}`);
    s = res.state;
    steps++;
    onStep?.(s);
  }
  return { state: s, steps };
}
