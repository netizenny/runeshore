import type { Action, GameState, PlayerId, Resource, ResourceCounts } from '../types';
import { RESOURCES } from '../constants';
import { hexVertices } from '../board/geometry';
import { randInt } from '../rng';
import { player, type Result } from './setup';

export function roll(s: GameState, _id: PlayerId): Result {
  if (s.phase.k !== 'roll') return 'not time to roll';
  let d1: number, d2: number;
  [d1, s.rngState] = randInt(s.rngState, 6);
  [d2, s.rngState] = randInt(s.rngState, 6);
  s.dice = [d1 + 1, d2 + 1];
  const total = s.dice[0] + s.dice[1];
  const events: Result = [{ type: 'rolled', player: s.order[s.current], dice: s.dice }];
  s.phase = { k: 'main' };
  if (total !== 7) events.push({ type: 'produced', gains: produce(s, total) });
  else startSeven(s);
  return events;
}

const handSize = (h: ResourceCounts) => RESOURCES.reduce((n, r) => n + h[r], 0);

function startSeven(s: GameState) {
  const pending: Record<PlayerId, number> = {};
  for (const p of s.players) {
    const n = handSize(p.hand);
    if (n > s.settings.discardLimit) pending[p.id] = Math.floor(n / 2);
  }
  s.phase = Object.keys(pending).length ? { k: 'discard', pending } : { k: 'moveShade', then: 'main' };
}

export function discard(s: GameState, id: PlayerId, a: Extract<Action, { type: 'discard' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'discard' || !ph.pending[id]) return 'nothing to discard';
  const p = player(s, id);
  let total = 0;
  for (const r of RESOURCES) {
    const n = a.cards[r];
    if (!Number.isInteger(n) || n < 0 || n > p.hand[r]) return 'bad discard';
    total += n;
  }
  if (total !== ph.pending[id]) return `discard exactly ${ph.pending[id]}`;
  for (const r of RESOURCES) {
    p.hand[r] -= a.cards[r];
    s.bank[r] += a.cards[r];
  }
  delete ph.pending[id];
  if (!Object.keys(ph.pending).length) s.phase = { k: 'moveShade', then: 'main' };
  return [{ type: 'discarded', player: id, count: total }];
}

export function moveShade(s: GameState, id: PlayerId, a: Extract<Action, { type: 'moveShade' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'moveShade') return 'not moving the Shade';
  if (!Object.hasOwn(s.board.hexes, a.hex)) return 'no such hex';
  if (a.hex === s.shadeHex) return 'the Shade must move';
  s.shadeHex = a.hex;
  const victims = [...new Set(hexVertices(a.hex).map((v) => s.buildings[v]?.owner))].filter(
    (o): o is PlayerId => !!o && o !== id && handSize(player(s, o).hand) > 0,
  );
  const events: Result = [{ type: 'shadeMoved', player: id, hex: a.hex }];
  if (victims.length > 1) {
    s.phase = { k: 'steal', hex: a.hex, victims, then: ph.then };
    return events;
  }
  s.phase = { k: ph.then };
  if (victims.length === 1) events.push(stealCard(s, id, victims[0]));
  return events;
}

export function steal(s: GameState, id: PlayerId, a: Extract<Action, { type: 'steal' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'steal' || !ph.victims.includes(a.victim)) return 'cannot steal from that player';
  s.phase = { k: ph.then };
  return [stealCard(s, id, a.victim)];
}

function stealCard(s: GameState, thief: PlayerId, victim: PlayerId) {
  const v = player(s, victim);
  const cards = RESOURCES.flatMap((r) => Array<Resource>(v.hand[r]).fill(r));
  let i: number;
  [i, s.rngState] = randInt(s.rngState, cards.length);
  v.hand[cards[i]]--;
  player(s, thief).hand[cards[i]]++;
  return { type: 'stole' as const, thief, victim, resource: cards[i] };
}

export function endTurn(s: GameState, id: PlayerId): Result {
  if (s.phase.k !== 'main') return 'cannot end turn now';
  s.current = (s.current + 1) % s.order.length;
  s.turn++;
  s.offers = [];
  s.omenPlayedThisTurn = false;
  s.phase = { k: 'roll' };
  return [{ type: 'turnEnded', player: id }];
}

function produce(s: GameState, total: number): Record<PlayerId, Partial<ResourceCounts>> {
  const owed: Record<PlayerId, Partial<ResourceCounts>> = {};
  for (const hex of Object.values(s.board.hexes)) {
    if (hex.token !== total || hex.id === s.shadeHex || hex.terrain === 'ashen') continue;
    for (const v of hexVertices(hex.id)) {
      const b = s.buildings[v];
      if (!b) continue;
      const o = (owed[b.owner] ??= {});
      o[hex.terrain] = (o[hex.terrain] ?? 0) + (b.kind === 'citadel' ? 2 : 1);
    }
  }
  const gains: Record<PlayerId, Partial<ResourceCounts>> = {};
  for (const r of RESOURCES as Resource[]) {
    const who = Object.keys(owed).filter((p) => owed[p][r]);
    const sum = who.reduce((n, p) => n + owed[p][r]!, 0);
    if (!sum) continue;
    // Short bank: nobody gets it, unless only one player is owed — then they take what's left.
    if (sum > s.bank[r] && who.length > 1) continue;
    for (const p of who) {
      const n = Math.min(owed[p][r]!, s.bank[r]);
      if (!n) continue;
      s.bank[r] -= n;
      s.players.find((x) => x.id === p)!.hand[r] += n;
      (gains[p] ??= {})[r] = n;
    }
  }
  return gains;
}
