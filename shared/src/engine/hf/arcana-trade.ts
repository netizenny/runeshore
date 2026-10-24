import type { Commodity, GameState, PlayerId, Resource } from '../../types';
import { COMMODITIES, RESOURCES, isCommodity } from '../../constants';
import { glory } from '../awards';
import { player } from '../setup';
import { placePeddler } from './peddler';
import { hfPlayer, stocks } from './state';
import type { Play } from './arcana';

type Kind = Resource | Commodity;
export const KINDS: Kind[] = [...RESOURCES, ...COMMODITIES];
const held = (s: GameState, id: PlayerId, k: Kind) => stocks(s, id, k).hand[k];
export const cardTotal = (s: GameState, id: PlayerId) => KINDS.reduce((n, k) => n + held(s, id, k), 0);
export const others = (s: GameState, id: PlayerId) => s.players.map((p) => p.id).filter((p) => p !== id);

export function move(s: GameState, from: PlayerId, to: PlayerId, k: Kind, n: number) {
  stocks(s, from, k).hand[k] -= n;
  stocks(s, to, k).hand[k] += n;
}

// Each opponent hands over up to `n` of one kind.
function monopoly(s: GameState, id: PlayerId, k: Kind, n: number) {
  for (const o of others(s, id)) move(s, o, id, k, Math.min(n, held(s, o, k)));
  return [];
}

export const TRADE: Record<string, Play> = {
  harbor(s, id, { offers }) {
    const me = player(s, id);
    const pending: Record<PlayerId, number> = {};
    const used: Record<string, number> = {};
    for (const o of others(s, id)) {
      if (!COMMODITIES.some((c) => hfPlayer(s, o).commodities[c])) continue; // nothing to swap, the offer is void
      const r = offers?.[o];
      if (!r || !RESOURCES.includes(r)) return 'offer a resource to each opponent holding a commodity';
      if ((used[r] = (used[r] ?? 0) + 1) > me.hand[r]) return 'you do not hold those resources';
      pending[o] = 1;
    }
    if (Object.keys(pending).length) s.phase = { k: 'arcanaGive', by: id, mode: 'harbor', pending, offers };
    return [];
  },
  mastermerchant(s, id, { target, take }) {
    if (!target || target === id || !s.players.some((p) => p.id === target)) return 'pick an opponent';
    if (glory(s, target, true) <= glory(s, id, true)) return 'they need more Glory than you';
    const n = Math.min(2, cardTotal(s, target));
    if (take?.length !== n) return `take exactly ${n} cards`;
    const need: Record<string, number> = {};
    for (const k of take) {
      if (!KINDS.includes(k) || (need[k] = (need[k] ?? 0) + 1) > held(s, target, k)) return 'they do not hold that';
    }
    for (const k of take) move(s, target, id, k, 1);
    return [];
  },
  peddler(s, id, { hex }) {
    return placePeddler(s, id, hex ?? '');
  },
  merchantfleet(s, _id, { kind }) {
    if (!kind || !KINDS.includes(kind)) return 'pick a resource or commodity';
    s.hf!.turnFlags.merchantFleet = kind;
    return [];
  },
  resmonopoly(s, id, { resource }) {
    if (!resource || !RESOURCES.includes(resource)) return 'name a resource';
    return monopoly(s, id, resource, 2);
  },
  trademonopoly(s, id, { commodity }) {
    if (!commodity || !isCommodity(commodity)) return 'name a commodity';
    return monopoly(s, id, commodity, 1);
  },
};
