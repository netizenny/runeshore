import type { Action, EdgeId, GameState, PlayerId } from '../types';
import { COSTS } from '../constants';
import { boardGeometry, edgeVertices, vertexEdges } from '../board/geometry';
import type { Result } from './setup';
import { canPay, pay } from './build';
import { liftMist } from './mist';

// A boat sits on any edge that is not land on both sides (isPathEdge's complement plus coasts).
// A Raider hex blocks building on, or moving a boat off, any of its edges.
const raided = (s: GameState, e: EdgeId) => !!s.di!.raiderHex && e.split('~').includes(s.di!.raiderHex);

const isBoatEdge = (s: GameState, e: EdgeId) => {
  const { landSet } = boardGeometry(s.board);
  return !e.split('~').every((h) => landSet.has(h));
};

// Boats join at a vertex where you own a building, or own another boat (never a path: they meet only at buildings).
// `without` is a boat being moved, treated as already lifted off the board.
export function boatSpotOk(s: GameState, id: PlayerId, edge: EdgeId, without?: EdgeId): boolean {
  const boats = s.di!.boats;
  if (!boardGeometry(s.board).edgeSet.has(edge) || !isBoatEdge(s, edge) || s.paths[edge] || raided(s, edge) || (boats[edge] && edge !== without)) return false;
  return edgeVertices(edge).some((v) => {
    const b = s.buildings[v];
    if (b) return b.owner === id;
    return vertexEdges(v).some((e) => e !== edge && e !== without && boats[e] === id);
  });
}

// Movable: the player's own, not new this turn, and one end touches none of their other pieces.
export function boatMovable(s: GameState, id: PlayerId, edge: EdgeId): boolean {
  const di = s.di!;
  if (di.boats[edge] !== id || di.builtTurn[edge] === s.turn || di.movedTurn === s.turn || raided(s, edge)) return false;
  return edgeVertices(edge).some((v) => s.buildings[v]?.owner !== id && !vertexEdges(v).some((e) => e !== edge && (s.paths[e] === id || di.boats[e] === id)));
}

export function buildBoat(s: GameState, id: PlayerId, a: Extract<Action, { type: 'buildBoat' }>): Result {
  if (!s.di || s.phase.k !== 'main') return 'cannot build now';
  if (s.di.boatsLeft[id] < 1) return 'no boats left';
  if (!boatSpotOk(s, id, a.edge)) return 'boat must connect to your outpost or boat';
  if (!canPay(s, id, COSTS.boat)) return 'cannot afford';
  pay(s, id, COSTS.boat);
  s.di.boats[a.edge] = id;
  s.di.builtTurn[a.edge] = s.turn;
  s.di.boatsLeft[id]--;
  return [{ type: 'built', player: id, piece: 'boat', at: a.edge }, ...liftMist(s, id, a.edge)];
}

export function moveBoat(s: GameState, id: PlayerId, a: Extract<Action, { type: 'moveBoat' }>): Result {
  if (!s.di || s.phase.k !== 'main') return 'cannot move now';
  if (s.di.movedTurn === s.turn) return 'a boat already moved this turn';
  if (s.di.boats[a.from] !== id) return 'not your boat';
  if (!boatMovable(s, id, a.from)) return 'that boat is not an open end, or is new';
  if (a.to === a.from || !boatSpotOk(s, id, a.to, a.from)) return 'boat must connect to your outpost or boat';
  const di = s.di;
  delete di.boats[a.from];
  delete di.builtTurn[a.from];
  di.boats[a.to] = id;
  di.builtTurn[a.to] = s.turn;
  di.movedTurn = s.turn;
  return [{ type: 'boatMoved', player: id, from: a.from, to: a.to }, ...liftMist(s, id, a.to)];
}
