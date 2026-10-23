import type { Action, GameState, PlayerId } from '../../types';
import { BULWARKS_MAX, COSTS } from '../../constants';
import { canPay, pay } from '../build';
import type { Result } from '../setup';

export function buildBulwark(s: GameState, id: PlayerId, a: Extract<Action, { type: 'buildBulwark' }>): Result {
  if (!s.hf || s.phase.k !== 'main') return 'cannot build now';
  return placeBulwark(s, id, a.vertex, false);
}

// `free` is the Mason Arcana card.
export function placeBulwark(s: GameState, id: PlayerId, vertex: string, free: boolean): Result {
  const hf = s.hf!;
  const b = s.buildings[vertex];
  if (b?.owner !== id || b.kind !== 'citadel') return 'Bulwark needs your citadel';
  if (hf.bulwarks.includes(vertex)) return 'already has a Bulwark';
  if (hf.bulwarks.filter((v) => s.buildings[v]?.owner === id).length >= BULWARKS_MAX) return 'no Bulwarks left';
  if (!free && !canPay(s, id, COSTS.bulwark)) return 'cannot afford';
  if (!free) pay(s, id, COSTS.bulwark);
  hf.bulwarks.push(vertex);
  return [{ type: 'built', player: id, piece: 'bulwark', at: vertex }];
}
