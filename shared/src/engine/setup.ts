import type { Action, GameEvent, GameState, PlayerId } from '../types';
import { edgeVertices, vertexHexes, vertexNeighbors, boardGeometry } from '../board/geometry';

// Handlers mutate the (already cloned) state and return events, or an error string.
export type Result = GameEvent[] | string;

export const player = (s: GameState, id: PlayerId) => s.players.find((p) => p.id === id)!;

export function placeOutpost(s: GameState, id: PlayerId, a: Extract<Action, { type: 'placeOutpost' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'setup' || ph.step !== 'outpost') return 'not placing an outpost';
  const v = a.vertex;
  if (!boardGeometry(s.board).vertexSet.has(v)) return 'no such vertex';
  if (s.buildings[v] || vertexNeighbors(v).some((n) => s.buildings[n])) return 'too close to another building';
  const p = player(s, id);
  // In the expansion the second outpost is a Citadel.
  const kind = s.hf && ph.round === 2 ? 'citadel' : 'outpost';
  s.buildings[v] = { owner: id, kind };
  p.piecesLeft[kind]--;
  if (ph.round === 2) {
    for (const h of vertexHexes(v)) {
      const t = s.board.hexes[h].terrain;
      if (t !== 'ashen' && s.bank[t] > 0) {
        s.bank[t]--;
        p.hand[t]++;
      }
    }
  }
  s.phase = { k: 'setup', round: ph.round, step: 'path', lastOutpost: v };
  return [{ type: 'built', player: id, piece: 'outpost', at: v }];
}

export function placePath(s: GameState, id: PlayerId, a: Extract<Action, { type: 'placePath' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'setup' || ph.step !== 'path') return 'not placing a path';
  if (!boardGeometry(s.board).edgeSet.has(a.edge)) return 'no such edge';
  if (s.paths[a.edge]) return 'path already there';
  if (!edgeVertices(a.edge).includes(ph.lastOutpost!)) return 'path must touch the new outpost';
  s.paths[a.edge] = id;
  player(s, id).piecesLeft.path--;
  const n = s.order.length;
  if (ph.round === 1 && s.current < n - 1) {
    s.current++;
    s.phase = { k: 'setup', round: 1, step: 'outpost' };
  } else if (ph.round === 1) {
    s.phase = { k: 'setup', round: 2, step: 'outpost' }; // last player goes again
  } else if (s.current > 0) {
    s.current--;
    s.phase = { k: 'setup', round: 2, step: 'outpost' };
  } else {
    s.phase = { k: 'roll' };
    s.turn = 1;
  }
  return [{ type: 'built', player: id, piece: 'path', at: a.edge }];
}
