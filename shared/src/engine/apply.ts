import type { Action, ApplyResult, GameState, PlayerId } from '../types';
import { placeOutpost, placePath, type Result } from './setup';
import { discard, endTurn, moveShade, roll, steal } from './turn';
import { buildCitadel, buildOutpost, buildPath } from './build';
import { buildBoat, moveBoat } from './boats';
import { bankTrade, cancelTrade, confirmTrade, offerTrade, respondTrade } from './trade';
import { buyOmen, playOmen } from './omens';
import { activateSentinel, buildSentinel, chaseShade, moveDisplaced, moveSentinel, promoteSentinel } from './hf/sentinels';
import { buildBulwark } from './hf/bulwarks';
import { chooseLoss, chooseReward } from './hf/fleet';
import { improve } from './hf/improve';
import { playArcana } from './hf/arcana';
import { arcanaGive, arcanaPickSentinel } from './hf/arcana-politics';
import { checkWin, updateAwards } from './awards';

export const currentPlayer = (s: GameState): PlayerId => s.order[s.current];

type Handler = (s: GameState, id: PlayerId, a: any) => Result;
const HANDLERS: Record<Action['type'], Handler> = {
  placeOutpost, placePath, roll, discard, moveShade, steal, buildPath, buildOutpost, buildCitadel, buildBoat, moveBoat,
  buildSentinel, activateSentinel, promoteSentinel, moveSentinel, moveDisplaced, chaseShade, buildBulwark, chooseLoss, chooseReward, improve, playArcana, arcanaGive, arcanaPickSentinel,
  buyOmen, playOmen, bankTrade, offerTrade, respondTrade, confirmTrade, cancelTrade, endTurn,
};
// Actions any seated player may take; the handler checks they are actually asked to.
const ANYONE: Action['type'][] = ['discard', 'respondTrade', 'moveDisplaced', 'chooseLoss', 'chooseReward', 'arcanaGive', 'arcanaPickSentinel'];

export function applyAction(state: GameState, playerId: PlayerId, action: Action): ApplyResult {
  if (state.phase.k === 'ended') return { ok: false, error: 'game over' };
  const handler = HANDLERS[action.type];
  if (!handler) return { ok: false, error: 'unknown action' };
  if (!state.players.some((p) => p.id === playerId)) return { ok: false, error: 'not in this game' };
  if (!ANYONE.includes(action.type) && playerId !== currentPlayer(state)) return { ok: false, error: 'not your turn' };
  // Log events are never mutated, so share them instead of deep-cloning a log that grows all game.
  const next = structuredClone({ ...state, log: [] as GameState["log"] });
  next.log = [...state.log];
  const res = handler(next, playerId, action);
  if (typeof res === 'string') return { ok: false, error: res };
  // Awards only move when a piece is built or an Omen is played.
  const events = res.some((e) => e.type === 'built' || e.type === 'boatMoved' || e.type === 'omenPlayed' || e.type === 'arcanaPlayed') ? [...res, ...updateAwards(next)] : [...res];
  events.push(...checkWin(next));
  next.log.push(...events);
  return { ok: true, state: next, events };
}
