import type { EdgeId, GameEvent, GameState, PlayerId, VertexId } from '../types';
import { edgeVertices, vertexEdges } from '../board/geometry';
import { player } from './setup';
import { hfScore } from './hf/score';

// Longest simple trail of the player's paths; an opponent building ends the trail at that vertex.
export function longestPathLength(s: GameState, id: PlayerId): number {
  const mine = Object.keys(s.paths).filter((e) => s.paths[e] === id);
  const blocked = (v: VertexId) => !!s.buildings[v] && s.buildings[v].owner !== id;
  const used = new Set<EdgeId>();
  let best = 0;
  const walk = (v: VertexId, len: number) => {
    best = Math.max(best, len);
    for (const e of vertexEdges(v)) {
      if (s.paths[e] !== id || used.has(e)) continue;
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
export function renown(s: GameState, id: PlayerId, includeHidden: boolean): number {
  let n = 0;
  for (const b of Object.values(s.buildings)) if (b.owner === id) n += b.kind === 'citadel' ? 2 : 1;
  if (s.longestPath === id) n += 2;
  if (s.grandHost === id) n += 2;
  if (s.hf) n += hfScore(s, id);
  if (includeHidden) n += player(s, id).omens.filter((o) => o.kind === 'relic').length;
  return n;
}

export function checkWin(s: GameState): GameEvent[] {
  if (s.phase.k === 'setup' || s.phase.k === 'ended') return [];
  const id = s.order[s.current];
  if (renown(s, id, true) < s.settings.renownTarget) return [];
  s.phase = { k: 'ended', winner: id };
  return [{ type: 'won', player: id }];
}
