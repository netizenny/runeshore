import type { Action, GameEvent, GameState, PlayerId, Track } from '../../types';
import { ARCANA_HAND_MAX, IMPROVE_MAX, RESOURCES, SPIRE_LEVEL, TRACK_COMMODITY } from '../../constants';
import type { Result } from '../setup';
import { hfPlayer } from './state';
import { drawArcana } from './arcana';

const citadels = (s: GameState, id: PlayerId) => Object.keys(s.buildings).filter((v) => s.buildings[v].owner === id && s.buildings[v].kind === 'citadel');
const spireAt = (s: GameState, v: string) => Object.values(s.hf!.spires).some((sp) => sp?.vertex === v);

// Reaching level 4 claims the track's Spire; reaching 5 past the holder takes it. It sits on a Citadel not already under a Spire.
function spire(s: GameState, id: PlayerId, track: Track, want?: string): GameEvent[] {
  const held = s.hf!.spires[track];
  const level = hfPlayer(s, id).level[track];
  if (level < SPIRE_LEVEL || held?.owner === id || (held && (level < IMPROVE_MAX || hfPlayer(s, held.owner).level[track] >= level))) return [];
  const free = citadels(s, id).filter((v) => !spireAt(s, v));
  const vertex = want && free.includes(want) ? want : free[0];
  if (!vertex) return [];
  s.hf!.spires[track] = { vertex, owner: id };
  return [{ type: 'spire', player: id, track, vertex }];
}

export function improve(s: GameState, id: PlayerId, a: Extract<Action, { type: 'improve' }>): Result {
  if (!s.hf || s.phase.k !== 'main') return 'cannot improve now';
  const me = hfPlayer(s, id);
  const level = me.level[a.track];
  if (level === undefined) return 'bad track';
  if (level >= IMPROVE_MAX) return 'already at the top level';
  if (!citadels(s, id).length) return 'improving needs a Citadel';
  const com = TRACK_COMMODITY[a.track];
  const cost = level + 1 - (s.hf.turnFlags.crane ? 1 : 0); // a Winch discounts one improvement
  if (me.commodities[com] < cost) return 'cannot afford';
  if (a.vertex && s.buildings[a.vertex]?.kind !== 'citadel') return 'a Spire needs a Citadel';
  delete s.hf.turnFlags.crane;
  me.commodities[com] -= cost;
  s.hf.bank[com] += cost;
  me.level[a.track]++;
  return [{ type: 'improved', player: id, track: a.track, level: me.level[a.track] }, ...spire(s, id, a.track, a.vertex)];
}

// Gate face: each player with a level on that track draws if the red die is at most level + 1. Hand full or stack empty: no draw.
export function gateDraws(s: GameState, track: Track, red: number): GameEvent[] {
  const events: GameEvent[] = [];
  for (const id of s.order) {
    const p = hfPlayer(s, id), deck = s.hf!.arcanaDecks[track];
    if (p.level[track] < 1 || red > p.level[track] + 1 || p.arcana.length >= ARCANA_HAND_MAX || !deck.length) continue;
    events.push(...drawArcana(s, id, track));
  }
  return events;
}

// Lore level 3: a roll that paid you nothing gives 1 base resource.
// shortcut: takes the kind you hold least of (bank permitting) instead of asking; upgrade if players want to choose.
export function loreBonus(s: GameState, gains: Record<PlayerId, object>): void {
  for (const p of s.players) {
    if (hfPlayer(s, p.id).level.lore < 3 || gains[p.id]) continue;
    const r = RESOURCES.filter((k) => s.bank[k] > 0).sort((x, y) => p.hand[x] - p.hand[y])[0];
    if (!r) continue;
    s.bank[r]--;
    p.hand[r]++;
    gains[p.id] = { [r]: 1 };
  }
}
