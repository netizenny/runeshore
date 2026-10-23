import { createGame } from '../src/engine/create';
import { DEFAULT_SETTINGS, type GameState } from '../src/types';

export const PLAYERS = [
  { id: 'a', name: 'A', color: 'ember' as const },
  { id: 'b', name: 'B', color: 'tide' as const },
  { id: 'c', name: 'C', color: 'moss' as const },
];

// Valid mid-game state: starter board, turn 1, phase main, current = order[0].
export function stateWith(partial: Partial<GameState> = {}): GameState {
  const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, boardMode: 'starter' }, 1);
  return { ...s, phase: { k: 'main' }, turn: 1, ...partial };
}
