import type { Action, GameEvent, GameState, PlayerId, Resource } from '../types';
import { RESOURCES } from '../constants';
import { liftMist } from './mist';
import { boatSpotOk } from './boats';
import { edgeVertices, landHexesAt, pathEdgeOn, vertexHexes, vertexNeighbors, boardGeometry } from '../board/geometry';

// Handlers mutate the (already cloned) state and return events, or an error string.
export type Result = GameEvent[] | string;

export const player = (s: GameState, id: PlayerId) => s.players.find((p) => p.id === id)!;

// Setup outposts must touch land, and on a Drowned Isles board only the home isle (any isle when it has none).
export const setupSpotOk = (s: GameState, v: string) =>
  landHexesAt(s.board, v).some((h) => !s.di?.homeIsle || s.di.isleOf[h] === s.di.homeIsle);

export function placeOutpost(s: GameState, id: PlayerId, a: Extract<Action, { type: 'placeOutpost' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'setup' || ph.step !== 'outpost') return 'not placing an outpost';
  const v = a.vertex;
  if (!boardGeometry(s.board).vertexSet.has(v)) return 'no such vertex';
  if (s.buildings[v] || vertexNeighbors(v).some((n) => s.buildings[n])) return 'too close to another building';
  if (!setupSpotOk(s, v)) return s.di ? 'start on the home isle' : 'no land there';
  const p = player(s, id);
  // In the expansion the second outpost is a Citadel.
  const kind = s.hf && ph.round === 2 ? 'citadel' : 'outpost';
  s.buildings[v] = { owner: id, kind };
  p.piecesLeft[kind]--;
  if (ph.round === 2) {
    for (const h of vertexHexes(v)) {
      const t = s.board.hexes[h].terrain;
      if (RESOURCES.includes(t as Resource) && s.bank[t as Resource] > 0) {
        s.bank[t as Resource]--;
        p.hand[t as Resource]++;
      }
    }
  }
  s.phase = { k: 'setup', round: ph.round, step: 'path', lastOutpost: v };
  return [{ type: 'built', player: id, piece: 'outpost', at: v }];
}

// Advances the snake-order setup once a starting path or boat is down.
function nextSetupStep(s: GameState, round: 1 | 2) {
  const n = s.order.length;
  if (round === 1 && s.current < n - 1) {
    s.current++;
    s.phase = { k: 'setup', round: 1, step: 'outpost' };
  } else if (round === 1) {
    s.phase = { k: 'setup', round: 2, step: 'outpost' }; // last player goes again
  } else if (s.current > 0) {
    s.current--;
    s.phase = { k: 'setup', round: 2, step: 'outpost' };
  } else {
    s.phase = { k: 'roll' };
    s.turn = 1;
  }
}

// A coastal starting outpost may take a boat on an adjacent sea edge instead of a path.
export function placeBoat(s: GameState, id: PlayerId, a: Extract<Action, { type: 'placeBoat' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'setup' || ph.step !== 'path') return 'not placing a path';
  if (!s.di) return 'no boats in this game';
  if (!edgeVertices(a.edge).includes(ph.lastOutpost!)) return 'boat must touch the new outpost';
  if (s.di.boatsLeft[id] < 1 || !boatSpotOk(s, id, a.edge)) return 'no boat can go there';
  s.di.boats[a.edge] = id;
  s.di.builtTurn[a.edge] = s.turn;
  s.di.boatsLeft[id]--;
  const lifted = liftMist(s, id, a.edge);
  nextSetupStep(s, ph.round);
  return [{ type: 'built', player: id, piece: 'boat', at: a.edge }, ...lifted];
}

export function placePath(s: GameState, id: PlayerId, a: Extract<Action, { type: 'placePath' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'setup' || ph.step !== 'path') return 'not placing a path';
  if (!boardGeometry(s.board).edgeSet.has(a.edge)) return 'no such edge';
  if (s.paths[a.edge]) return 'path already there';
  if (!pathEdgeOn(s.board, a.edge)) return 'paths need land';
  if (!edgeVertices(a.edge).includes(ph.lastOutpost!)) return 'path must touch the new outpost';
  s.paths[a.edge] = id;
  player(s, id).piecesLeft.path--;
  const lifted = liftMist(s, id, a.edge);
  nextSetupStep(s, ph.round);
  return [{ type: 'built', player: id, piece: 'path', at: a.edge }, ...lifted];
}
