import type { Action, GameState, PlayerId, VertexId } from '../../types';
import { COSTS, SENTINELS_PER_RANK } from '../../constants';
import { ALL_VERTICES, edgeVertices, hexVertices, vertexEdges } from '../../board/geometry';
import { canPay, pay } from '../build';
import type { Result } from '../setup';
import { hfPlayer } from './state';

type Rank = 1 | 2 | 3;
const empty = (s: GameState, v: VertexId) => !s.buildings[v] && !s.hf!.sentinels[v];

// Vertices a Sentinel at `from` can reach over its owner's Paths. Opponent Sentinels end the walk
// (they are only a target); opponent buildings block it; own pieces are passed through.
export function reach(s: GameState, id: PlayerId, from: VertexId): VertexId[] {
  const seen = new Set([from]);
  const queue = [from];
  const out: VertexId[] = [];
  for (const v of queue) {
    for (const e of vertexEdges(v)) {
      if (s.paths[e] !== id) continue;
      for (const w of edgeVertices(e)) {
        if (seen.has(w)) continue;
        seen.add(w);
        const b = s.buildings[w];
        const k = s.hf!.sentinels[w];
        if (b && b.owner !== id) continue;
        if (k && k.owner !== id) {
          out.push(w);
          continue;
        }
        queue.push(w);
        if (!b && !k) out.push(w);
      }
    }
  }
  return out;
}

// A Sentinel may act if it is active and was not activated this turn.
function actor(s: GameState, id: PlayerId, v: VertexId) {
  if (s.phase.k !== 'main') return 'cannot do that now';
  const k = s.hf?.sentinels[v];
  if (!k || k.owner !== id) return 'no Sentinel of yours there';
  if (!k.active) return 'Sentinel is not active';
  if (k.actedTurn >= s.turn) return 'Sentinel was just activated';
  return k;
}

const count = (s: GameState, id: PlayerId, rank: Rank) =>
  Object.values(s.hf!.sentinels).filter((k) => k.owner === id && k.rank === rank).length;

export function buildSentinel(s: GameState, id: PlayerId, a: Extract<Action, { type: 'buildSentinel' }>): Result {
  if (!s.hf || s.phase.k !== 'main') return 'cannot build now';
  if (!ALL_VERTICES.includes(a.vertex) || !empty(s, a.vertex)) return 'vertex is taken';
  if (!vertexEdges(a.vertex).some((e) => s.paths[e] === id)) return 'Sentinel must touch your path';
  if (count(s, id, 1) >= SENTINELS_PER_RANK) return 'no Basic Sentinels left';
  if (!canPay(s, id, COSTS.sentinel)) return 'cannot afford';
  pay(s, id, COSTS.sentinel);
  s.hf.sentinels[a.vertex] = { owner: id, rank: 1, active: false, actedTurn: s.turn };
  return [{ type: 'sentinel', player: id, did: 'built', at: a.vertex }];
}

export function activateSentinel(s: GameState, id: PlayerId, a: Extract<Action, { type: 'activateSentinel' }>): Result {
  const k = s.hf?.sentinels[a.vertex];
  if (s.phase.k !== 'main' || !k || k.owner !== id) return 'no Sentinel of yours there';
  if (k.active) return 'already active';
  if (!canPay(s, id, COSTS.activate)) return 'cannot afford';
  pay(s, id, COSTS.activate);
  k.active = true;
  k.actedTurn = s.turn;
  return [{ type: 'sentinel', player: id, did: 'activated', at: a.vertex }];
}

export function promoteSentinel(s: GameState, id: PlayerId, a: Extract<Action, { type: 'promoteSentinel' }>): Result {
  const k = s.hf?.sentinels[a.vertex];
  if (s.phase.k !== 'main' || !k || k.owner !== id) return 'no Sentinel of yours there';
  if (k.rank === 3) return 'already Mighty';
  const next = (k.rank + 1) as Rank;
  if (next === 3 && hfPlayer(s, id).level.crown < 3) return 'Mighty needs Crown level 3';
  if (count(s, id, next) >= SENTINELS_PER_RANK) return 'no Sentinels of that rank left';
  if (!canPay(s, id, COSTS.sentinel)) return 'cannot afford';
  pay(s, id, COSTS.sentinel);
  k.rank = next; // keeps its active state
  return [{ type: 'sentinel', player: id, did: 'promoted', at: a.vertex }];
}

export function moveSentinel(s: GameState, id: PlayerId, a: Extract<Action, { type: 'moveSentinel' }>): Result {
  const k = actor(s, id, a.from);
  if (typeof k === 'string') return k;
  if (!reach(s, id, a.from).includes(a.to)) return 'Sentinel cannot get there';
  const victim = s.hf!.sentinels[a.to];
  if (victim && victim.rank >= k.rank) return 'can only displace a weaker Sentinel';
  delete s.hf!.sentinels[a.from];
  s.hf!.sentinels[a.to] = { ...k, active: false };
  const events: Result = [{ type: 'sentinel', player: id, did: 'moved', at: a.to }];
  if (!victim) return events;
  // The displaced owner picks a free connected vertex; with none, the Sentinel is lost.
  if (reach(s, victim.owner, a.to).some((v) => empty(s, v))) {
    s.phase = { k: 'displaced', owner: victim.owner, vertex: a.to, rank: victim.rank, active: victim.active };
    events.push({ type: 'sentinel', player: victim.owner, did: 'displaced', at: a.to });
  } else events.push({ type: 'sentinel', player: victim.owner, did: 'lost', at: a.to });
  return events;
}

export function moveDisplaced(s: GameState, id: PlayerId, a: Extract<Action, { type: 'moveDisplaced' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'displaced' || ph.owner !== id) return 'nothing to move';
  if (!reach(s, id, ph.vertex).includes(a.to) || !empty(s, a.to)) return 'Sentinel cannot get there';
  s.hf!.sentinels[a.to] = { owner: id, rank: ph.rank, active: ph.active, actedTurn: 0 };
  s.phase = { k: 'main' };
  return [{ type: 'sentinel', player: id, did: 'moved', at: a.to }];
}

export function chaseShade(s: GameState, id: PlayerId, a: Extract<Action, { type: 'chaseShade' }>): Result {
  const k = actor(s, id, a.vertex);
  if (typeof k === 'string') return k;
  if (!s.hf!.shadeActive) return 'the Shade is asleep';
  if (!hexVertices(s.shadeHex).includes(a.vertex)) return 'Sentinel is not next to the Shade';
  k.active = false;
  s.phase = { k: 'moveShade', then: 'main' };
  return [{ type: 'sentinel', player: id, did: 'chased', at: a.vertex }];
}
