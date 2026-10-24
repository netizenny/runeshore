import type { Action, EdgeId, GameState, PlayerId, ResourceCounts } from '../types';
import { COSTS, RESOURCES } from '../constants';
import { boardGeometry, edgeVertices, vertexEdges, vertexNeighbors } from '../board/geometry';
import { player, type Result } from './setup';

export const canPay = (s: GameState, id: PlayerId, c: ResourceCounts) => RESOURCES.every((r) => player(s, id).hand[r] >= c[r]);

export function pay(s: GameState, id: PlayerId, c: ResourceCounts) {
  for (const r of RESOURCES) {
    player(s, id).hand[r] -= c[r];
    s.bank[r] += c[r];
  }
}

// A path joins at a vertex where you own a building, or own another path and no opponent building blocks it.
export function pathSpotOk(s: GameState, id: PlayerId, edge: EdgeId): boolean {
  if (!boardGeometry(s.board).edgeSet.has(edge) || s.paths[edge]) return false;
  return edgeVertices(edge).some((v) => {
    const b = s.buildings[v];
    if (b) return b.owner === id;
    return vertexEdges(v).some((e) => e !== edge && s.paths[e] === id);
  });
}

export const hasLegalPath = (s: GameState, id: PlayerId) => boardGeometry(s.board).edges.some((e) => pathSpotOk(s, id, e));

export function buildPath(s: GameState, id: PlayerId, a: Extract<Action, { type: 'buildPath' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'main' && ph.k !== 'waymaking') return 'cannot build now';
  const p = player(s, id);
  if (p.piecesLeft.path < 1) return 'no paths left';
  if (!pathSpotOk(s, id, a.edge)) return 'path must connect to your network';
  if (ph.k === 'main') {
    if (!canPay(s, id, COSTS.path)) return 'cannot afford';
    pay(s, id, COSTS.path);
  }
  s.paths[a.edge] = id;
  p.piecesLeft.path--;
  if (ph.k === 'waymaking') {
    s.phase = ph.left === 2 && p.piecesLeft.path > 0 && hasLegalPath(s, id) ? { ...ph, left: 1 } : { k: ph.then };
  }
  return [{ type: 'built', player: id, piece: 'path', at: a.edge }];
}

export function buildOutpost(s: GameState, id: PlayerId, a: Extract<Action, { type: 'buildOutpost' }>): Result {
  if (s.phase.k !== 'main') return 'cannot build now';
  const v = a.vertex;
  const p = player(s, id);
  if (!boardGeometry(s.board).vertexSet.has(v)) return 'no such vertex';
  if (p.piecesLeft.outpost < 1) return 'no outposts left';
  if (s.buildings[v] || vertexNeighbors(v).some((n) => s.buildings[n])) return 'too close to another building';
  if (s.hf?.sentinels[v]) return 'a Sentinel stands there';
  if (!vertexEdges(v).some((e) => s.paths[e] === id)) return 'outpost must touch your path';
  if (!canPay(s, id, COSTS.outpost)) return 'cannot afford';
  pay(s, id, COSTS.outpost);
  s.buildings[v] = { owner: id, kind: 'outpost' };
  p.piecesLeft.outpost--;
  return [{ type: 'built', player: id, piece: 'outpost', at: v }];
}

export function buildCitadel(s: GameState, id: PlayerId, a: Extract<Action, { type: 'buildCitadel' }>): Result {
  if (s.phase.k !== 'main') return 'cannot build now';
  return upgradeOutpost(s, id, a.vertex, COSTS.citadel);
}

// `cost` is discounted by the Apothecary Arcana card.
export function upgradeOutpost(s: GameState, id: PlayerId, vertex: string, cost: ResourceCounts): Result {
  const b = s.buildings[vertex];
  const p = player(s, id);
  if (b?.owner !== id || b.kind !== 'outpost') return 'citadel needs your outpost';
  if (p.piecesLeft.citadel < 1) return 'no citadels left';
  if (!canPay(s, id, cost)) return 'cannot afford';
  pay(s, id, cost);
  b.kind = 'citadel';
  p.piecesLeft.citadel--;
  p.piecesLeft.outpost++;
  return [{ type: 'built', player: id, piece: 'citadel', at: vertex }];
}
