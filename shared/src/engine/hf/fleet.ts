import type { Action, GameEvent, GameState, PlayerId, VertexId } from '../../types';
import { ARCANA_HAND_MAX, FLEET_TRACK } from '../../constants';
import { player, type Result } from '../setup';
import { TRACKS, hfPlayer } from './state';
import { afterFleet } from './dice';

const citadels = (s: GameState, id: PlayerId) => Object.keys(s.buildings).filter((v) => s.buildings[v].owner === id && s.buildings[v].kind === 'citadel');
// Citadels under a Spire are safe from the Fleet.
const loseable = (s: GameState, id: PlayerId) => citadels(s, id).filter((v) => !Object.values(s.hf!.spires).some((sp) => sp?.vertex === v));
const canDraw = (s: GameState, id: PlayerId) => hfPlayer(s, id).arcana.length < ARCANA_HAND_MAX && TRACKS.some((t) => s.hf!.arcanaDecks[t].length > 0);

// The Citadel becomes an Outpost (or vanishes if none is left to place); its Bulwark goes with it.
function lose(s: GameState, id: PlayerId, v: VertexId): GameEvent {
  const p = player(s, id);
  p.piecesLeft.citadel++;
  s.hf!.bulwarks = s.hf!.bulwarks.filter((x) => x !== v);
  if (p.piecesLeft.outpost > 0) {
    p.piecesLeft.outpost--;
    s.buildings[v].kind = 'outpost';
  } else delete s.buildings[v];
  return { type: 'citadelLost', player: id, vertex: v };
}

// A ship step. On the last one the Fleet attacks. `total` is the production roll, resumed once any pending choice is done.
export function advanceFleet(s: GameState, total: number): GameEvent[] {
  const hf = s.hf!;
  const events: GameEvent[] = [{ type: 'fleetAdvanced', pos: ++hf.fleetPos }];
  if (hf.fleetPos < FLEET_TRACK) return events;

  const power: Record<PlayerId, number> = Object.fromEntries(s.players.map((p) => [p.id, 0]));
  for (const k of Object.values(hf.sentinels)) if (k.active) power[k.owner] += k.rank;
  const strength = Object.values(s.buildings).filter((b) => b.kind === 'citadel').length;
  const defence = Object.values(power).reduce((n, x) => n + x, 0);
  const held = defence >= strength;
  events.push({ type: 'fleetAttack', strength, defence, held });
  hf.fleetPos = 0;
  hf.shadeActive = true;
  for (const k of Object.values(hf.sentinels)) k.active = false;

  const ids = s.players.map((p) => p.id);
  if (held) {
    const top = Math.max(...ids.map((id) => power[id]));
    const best = top > 0 ? ids.filter((id) => power[id] === top) : [];
    if (best.length === 1) {
      hfPlayer(s, best[0]).shields++;
      events.push({ type: 'shieldAwarded', player: best[0] });
    } else {
      const pending = best.filter((id) => canDraw(s, id));
      if (pending.length) s.phase = { k: 'fleetReward', pending, total };
    }
    return events;
  }
  const owners = ids.filter((id) => citadels(s, id).length);
  const low = Math.min(...owners.map((id) => power[id]));
  const pending: PlayerId[] = [];
  for (const id of owners.filter((id) => power[id] === low)) {
    const open = loseable(s, id);
    if (open.length === 1) events.push(lose(s, id, open[0]));
    else if (open.length > 1) pending.push(id);
  }
  if (pending.length) s.phase = { k: 'fleetLoss', pending, total };
  return events;
}

export function chooseLoss(s: GameState, id: PlayerId, a: Extract<Action, { type: 'chooseLoss' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'fleetLoss' || !ph.pending.includes(id)) return 'no Citadel to give up';
  if (!loseable(s, id).includes(a.vertex)) return 'pick one of your Citadels not under a Spire';
  const events = [lose(s, id, a.vertex)];
  ph.pending = ph.pending.filter((x) => x !== id);
  if (!ph.pending.length) events.push(...afterFleet(s, ph.total));
  return events;
}

export function chooseReward(s: GameState, id: PlayerId, a: Extract<Action, { type: 'chooseReward' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'fleetReward' || !ph.pending.includes(id)) return 'no reward to pick';
  const deck = s.hf!.arcanaDecks[a.track];
  if (!deck?.length) return 'that stack is empty';
  hfPlayer(s, id).arcana.push(deck.shift()!);
  const events: GameEvent[] = [{ type: 'arcanaDrawn', player: id, track: a.track }];
  // Someone later in the list may now find every stack empty.
  ph.pending = ph.pending.filter((x) => x !== id && canDraw(s, x));
  if (!ph.pending.length) events.push(...afterFleet(s, ph.total));
  return events;
}
