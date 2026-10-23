import type { Action, GameState, PlayerId, Resource, ResourceCounts } from '../types';
import { RESOURCES } from '../constants';
import { edgeVertices } from '../board/geometry';
import { player, type Result } from './setup';

const have = (s: GameState, id: PlayerId, c: ResourceCounts) => RESOURCES.every((r) => player(s, id).hand[r] >= c[r]);
const valid = (c: ResourceCounts) => RESOURCES.every((r) => Number.isInteger(c[r]) && c[r] >= 0);
const total = (c: ResourceCounts) => RESOURCES.reduce((n, r) => n + c[r], 0);
const nonzero = (c: ResourceCounts): Partial<ResourceCounts> =>
  Object.fromEntries(RESOURCES.filter((r) => c[r]).map((r) => [r, c[r]]));

export function tradeRatio(s: GameState, id: PlayerId, resource: Resource): 2 | 3 | 4 {
  let best: 2 | 3 | 4 = 4;
  for (const port of s.board.ports) {
    if (port.kind !== 'any' && port.kind !== resource) continue;
    if (!edgeVertices(port.edge).some((v) => s.buildings[v]?.owner === id)) continue;
    best = Math.min(best, port.kind === 'any' ? 3 : 2) as 2 | 3 | 4;
  }
  return best;
}

export function bankTrade(s: GameState, id: PlayerId, a: Extract<Action, { type: 'bankTrade' }>): Result {
  if (s.phase.k !== 'main') return 'cannot trade now';
  if (!RESOURCES.includes(a.give) || !RESOURCES.includes(a.get) || a.give === a.get) return 'bad trade';
  const n = tradeRatio(s, id, a.give);
  const p = player(s, id);
  if (p.hand[a.give] < n) return 'cannot afford';
  if (s.bank[a.get] < 1) return 'vault is out of that resource';
  p.hand[a.give] -= n;
  s.bank[a.give] += n;
  s.bank[a.get]--;
  p.hand[a.get]++;
  return [{ type: 'traded', a: id, b: 'bank', aGave: { [a.give]: n }, bGave: { [a.get]: 1 } }];
}

export function offerTrade(s: GameState, id: PlayerId, a: Extract<Action, { type: 'offerTrade' }>): Result {
  if (s.phase.k !== 'main') return 'cannot trade now';
  if (!valid(a.give) || !valid(a.get) || !total(a.give) || !total(a.get)) return 'empty offer';
  if (RESOURCES.some((r) => a.give[r] && a.get[r])) return 'cannot give and get the same resource';
  if (!have(s, id, a.give)) return 'cannot afford';
  if (a.to !== 'all') {
    if (!a.to.length || a.to.some((t) => t === id || !s.players.some((p) => p.id === t))) return 'bad recipients';
  }
  s.offers.push({
    id: `t${s.turn}-${Math.max(-1, ...s.offers.map((o) => +o.id.split('-')[1])) + 1}`,
    from: id,
    give: { ...a.give },
    get: { ...a.get },
    to: a.to === 'all' ? 'all' : [...new Set(a.to)],
    accepted: [],
    declined: [],
  });
  return [];
}

export function respondTrade(s: GameState, id: PlayerId, a: Extract<Action, { type: 'respondTrade' }>): Result {
  const o = s.offers.find((x) => x.id === a.offerId);
  if (!o) return 'offer gone';
  if (id === o.from || (o.to !== 'all' && !o.to.includes(id))) return 'not offered to you';
  o.accepted = o.accepted.filter((p) => p !== id);
  o.declined = o.declined.filter((p) => p !== id);
  (a.accept ? o.accepted : o.declined).push(id);
  return [];
}

export function confirmTrade(s: GameState, id: PlayerId, a: Extract<Action, { type: 'confirmTrade' }>): Result {
  const o = s.offers.find((x) => x.id === a.offerId);
  if (!o) return 'offer gone';
  if (s.phase.k !== 'main') return 'cannot trade now';
  if (o.from !== id) return 'not your offer';
  if (!o.accepted.includes(a.partner)) return 'partner has not accepted';
  if (!have(s, id, o.give) || !have(s, a.partner, o.get)) return 'a player no longer has the cards';
  const me = player(s, id), them = player(s, a.partner);
  for (const r of RESOURCES) {
    me.hand[r] += o.get[r] - o.give[r];
    them.hand[r] += o.give[r] - o.get[r];
  }
  s.offers = s.offers.filter((x) => x !== o);
  return [{ type: 'traded', a: id, b: a.partner, aGave: nonzero(o.give), bGave: nonzero(o.get) }];
}

export function cancelTrade(s: GameState, id: PlayerId, a: Extract<Action, { type: 'cancelTrade' }>): Result {
  const o = s.offers.find((x) => x.id === a.offerId);
  if (!o) return 'offer gone';
  if (o.from !== id) return 'not your offer';
  s.offers = s.offers.filter((x) => x !== o);
  return [];
}
