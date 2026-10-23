import type { Action, ApplyResult, GameState, PlayerId } from '../types';
import { placeOutpost, placePath, type Result } from './setup';
import { discard, endTurn, moveShade, roll, steal } from './turn';
import { buildCitadel, buildOutpost, buildPath } from './build';
import { bankTrade, cancelTrade, confirmTrade, offerTrade, respondTrade } from './trade';
import { buyOmen, playOmen } from './omens';

export const currentPlayer = (s: GameState): PlayerId => s.order[s.current];

type Handler = (s: GameState, id: PlayerId, a: any) => Result;
const HANDLERS: Record<Action['type'], Handler> = {
  placeOutpost, placePath, roll, discard, moveShade, steal, buildPath, buildOutpost, buildCitadel,
  buyOmen, playOmen, bankTrade, offerTrade, respondTrade, confirmTrade, cancelTrade, endTurn,
};
// Actions any seated player may take; the handler checks they are actually asked to.
const ANYONE: Action['type'][] = ['discard', 'respondTrade'];

export function applyAction(state: GameState, playerId: PlayerId, action: Action): ApplyResult {
  if (state.phase.k === 'ended') return { ok: false, error: 'game over' };
  const handler = HANDLERS[action.type];
  if (!handler) return { ok: false, error: 'unknown action' };
  if (!state.players.some((p) => p.id === playerId)) return { ok: false, error: 'not in this game' };
  if (!ANYONE.includes(action.type) && playerId !== currentPlayer(state)) return { ok: false, error: 'not your turn' };
  const next = structuredClone(state);
  const res = handler(next, playerId, action);
  if (typeof res === 'string') return { ok: false, error: res };
  next.log.push(...res);
  return { ok: true, state: next, events: res };
}
