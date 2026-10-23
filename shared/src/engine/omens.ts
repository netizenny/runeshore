import type { Action, GameState, PlayerId } from '../types';
import { COSTS, RESOURCES } from '../constants';
import { canPay, hasLegalPath, pay } from './build';
import { player, type Result } from './setup';

export function buyOmen(s: GameState, id: PlayerId): Result {
  if (s.phase.k !== 'main') return 'cannot buy now';
  if (!s.omenDeck.length) return 'no Omens left';
  if (!canPay(s, id, COSTS.omen)) return 'cannot afford';
  pay(s, id, COSTS.omen);
  player(s, id).omens.push({ kind: s.omenDeck.pop()!, boughtTurn: s.turn });
  return [{ type: 'omenBought', player: id }];
}

export function playOmen(s: GameState, id: PlayerId, a: Extract<Action, { type: 'playOmen' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'roll' && ph.k !== 'main') return 'cannot play an Omen now';
  if (s.omenPlayedThisTurn) return 'one Omen per turn';
  if (a.kind === ('relic' as string)) return 'Relics count automatically';
  const p = player(s, id);
  const i = p.omens.findIndex((o) => o.kind === a.kind && o.boughtTurn < s.turn);
  if (i < 0) return 'you have no such Omen to play';
  // Validate before spending the card.
  if (a.kind === 'waymaking' && (p.piecesLeft.path < 1 || !hasLegalPath(s, id))) return 'no path can be placed';
  if (a.kind === 'bounty') {
    const [x, y] = a.pick;
    if (!RESOURCES.includes(x) || !RESOURCES.includes(y)) return 'bad pick';
    if (s.bank[x] < (x === y ? 2 : 1) || s.bank[y] < 1) return 'bank lacks those resources';
  }
  if (a.kind === 'hoard' && !RESOURCES.includes(a.resource)) return 'bad pick';

  p.omens.splice(i, 1);
  s.omenPlayedThisTurn = true;
  const events: Result = [{ type: 'omenPlayed', player: id, kind: a.kind }];
  if (a.kind === 'warden') {
    p.wardensPlayed++;
    s.phase = { k: 'moveShade', then: ph.k };
  } else if (a.kind === 'waymaking') {
    s.phase = { k: 'waymaking', left: p.piecesLeft.path >= 2 ? 2 : 1, then: ph.k };
  } else if (a.kind === 'bounty') {
    for (const r of a.pick) {
      s.bank[r]--;
      p.hand[r]++;
    }
  } else if (a.kind === 'hoard') {
    for (const o of s.players) {
      if (o.id === id) continue;
      p.hand[a.resource] += o.hand[a.resource];
      o.hand[a.resource] = 0;
    }
  }
  return events;
}
