import type { Action, GameState, PlayerId } from '../../types';
import { BULWARKS_MAX, COSTS } from '../../constants';
import { canPay, pay } from '../build';
import type { Result } from '../setup';

export function buildBulwark(s: GameState, id: PlayerId, a: Extract<Action, { type: 'buildBulwark' }>): Result {
  if (!s.hf || s.phase.k !== 'main') return 'cannot build now';
  const b = s.buildings[a.vertex];
  if (b?.owner !== id || b.kind !== 'citadel') return 'Bulwark needs your citadel';
  if (s.hf.bulwarks.includes(a.vertex)) return 'already has a Bulwark';
  if (s.hf.bulwarks.filter((v) => s.buildings[v]?.owner === id).length >= BULWARKS_MAX) return 'no Bulwarks left';
  if (!canPay(s, id, COSTS.bulwark)) return 'cannot afford';
  pay(s, id, COSTS.bulwark);
  s.hf.bulwarks.push(a.vertex);
  return [{ type: 'built', player: id, piece: 'bulwark', at: a.vertex }];
}
