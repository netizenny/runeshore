import { applyAction } from '../src/engine/apply';
import { createGame } from '../src/engine/create';
import { DEFAULT_SETTINGS, type ArcanaArg, type GameState } from '../src/types';

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

// Same as stateWith, but with Siege of the Hollow Fleet on.
export function hfState(partial: Partial<GameState> = {}): GameState {
  const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, boardMode: 'starter', hollowFleet: true }, 1);
  return { ...s, phase: { k: 'main' }, turn: 1, ...partial };
}

// Deal `card` to `id` and play it through the real dispatcher.
export function play(s: GameState, id: string, card: string, arg?: ArcanaArg) {
  s.hf!.players[id].arcana.push(card);
  return applyAction(s, id, { type: 'playArcana', card, arg });
}

// hfState where player 'a' is on turn.
export function arcState(): GameState {
  const s = hfState();
  s.current = s.order.indexOf('a');
  return s;
}
