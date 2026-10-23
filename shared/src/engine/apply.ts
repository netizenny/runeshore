import type { Action, ApplyResult, GameState, PlayerId } from '../types';
import { placeOutpost, placePath, type Result } from './setup';
import { roll } from './turn';

export const currentPlayer = (s: GameState): PlayerId => s.order[s.current];

type Handler = (s: GameState, id: PlayerId, a: any) => Result;
const HANDLERS: Partial<Record<Action['type'], Handler>> = { placeOutpost, placePath, roll };

export function applyAction(state: GameState, playerId: PlayerId, action: Action): ApplyResult {
  if (state.phase.k === 'ended') return { ok: false, error: 'game over' };
  const handler = HANDLERS[action.type];
  if (!handler) return { ok: false, error: 'unknown action' };
  // Every handler so far is current-player only; discard (Task 6) will relax this.
  if (playerId !== currentPlayer(state)) return { ok: false, error: 'not your turn' };
  const next = structuredClone(state);
  const res = handler(next, playerId, action);
  if (typeof res === 'string') return { ok: false, error: res };
  next.log.push(...res);
  return { ok: true, state: next, events: res };
}
