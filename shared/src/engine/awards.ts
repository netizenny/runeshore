import type { EdgeId, GameEvent, GameState, PlayerId, VertexId } from '../types';
import { LANDFALL_GLORY } from '../constants';
import { edgeVertices, vertexEdges, vertexHexes } from '../board/geometry';
import { SCENARIOS } from '../board/scenarios/landfall';
import { player } from './setup';
import { hfScore } from './hf/score';

// Longest simple trail of the player's paths and boats; an opponent building ends the trail at that vertex.
// A trail may switch between paths and boats at any shared vertex.
export function longestPathLength(s: Pick<GameState, 'paths' | 'buildings'> & { di?: { boats: GameState['paths'] } | null }, id: PlayerId): number {
  const boats = s.di?.boats ?? {};
  const mineAt = (e: EdgeId) => s.paths[e] === id || boats[e] === id;
  const mine = [...Object.keys(s.paths), ...Object.keys(boats)].filter(mineAt);
  const blocked = (v: VertexId) => !!s.buildings[v] && s.buildings[v].owner !== id;
  const used = new Set<EdgeId>();
  let best = 0;
  const walk = (v: VertexId, len: number) => {
    best = Math.max(best, len);
    for (const e of vertexEdges(v)) {
      if (!mineAt(e) || used.has(e)) continue;
      const [a, b] = edgeVertices(e);
      const u = a === v ? b : a;
      used.add(e);
      if (blocked(u)) best = Math.max(best, len + 1);
      else walk(u, len + 1);
      used.delete(e);
    }
  };
  for (const e of mine) for (const v of edgeVertices(e)) walk(v, 0);
  return best;
}

const ownsOnIsle = (s: GameState, id: PlayerId, isle: string, except: VertexId) =>
  Object.entries(s.buildings).some(([v, b]) => v !== except && b.owner === id && vertexHexes(v).some((h) => s.di!.isleOf[h] === isle));

// First outpost on each isle other than the ones you started on earns a Landfall mark.
export function claimLandfall(s: GameState, id: PlayerId, vertex: VertexId): GameEvent[] {
  const di = s.di;
  if (!di || SCENARIOS[s.settings.scenario].noLandfall) return [];
  const isles = new Set(vertexHexes(vertex).map((h) => di.isleOf[h]).filter(Boolean));
  return [...isles].filter((i) => i !== di.homeIsle && !di.landfall[id].includes(i) && !ownsOnIsle(s, id, i, vertex)).map((isle) => {
    di.landfall[id].push(isle);
    return { type: 'landfall' as const, player: id, isle };
  });
}

// Mutates the state, like the action handlers.
export function updateAwards(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];

  const lens = s.players.map((p) => ({ id: p.id, n: longestPathLength(s, p.id) }));
  const max = Math.max(...lens.map((l) => l.n));
  const leaders = lens.filter((l) => l.n === max).map((l) => l.id);
  const lp: PlayerId | null =
    max < 5 ? null : leaders.length === 1 ? leaders[0] : s.longestPath && leaders.includes(s.longestPath) ? s.longestPath : null;
  if (lp !== s.longestPath) {
    s.longestPath = lp;
    events.push({ type: 'awardChanged', award: 'longestPath', player: lp });
  }

  if (s.hf) return events; // Sentinels replace Wardens, so no Grand host

  const held = s.grandHost ? player(s, s.grandHost).wardensPlayed : 2;
  const top = s.players.reduce((a, p) => (p.wardensPlayed > a.wardensPlayed ? p : a));
  if (top.wardensPlayed >= 3 && top.wardensPlayed > held && top.id !== s.grandHost) {
    s.grandHost = top.id;
    events.push({ type: 'awardChanged', award: 'grandHost', player: top.id });
  }
  return events;
}

// includeHidden counts unplayed Relics, which only their owner may see.
export function glory(s: GameState, id: PlayerId, includeHidden: boolean): number {
  let n = 0;
  for (const b of Object.values(s.buildings)) if (b.owner === id) n += b.kind === 'citadel' ? 2 : 1;
  if (s.longestPath === id) n += 2;
  if (s.grandHost === id) n += 2;
  if (s.di) n += LANDFALL_GLORY * s.di.landfall[id].length;
  if (s.hf) n += hfScore(s, id);
  if (includeHidden) n += player(s, id).omens.filter((o) => o.kind === 'relic').length;
  return n;
}

export function checkWin(s: GameState): GameEvent[] {
  if (s.phase.k === 'setup' || s.phase.k === 'ended') return [];
  const id = s.order[s.current];
  if (glory(s, id, true) < s.settings.gloryTarget) return [];
  s.phase = { k: 'ended', winner: id };
  return [{ type: 'won', player: id }];
}
