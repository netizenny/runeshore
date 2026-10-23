import type { GameEvent, GameState, PlayerId, Resource } from '../../types';
import { INVENTOR_FIXED, MEDICINE_COST } from '../../constants';
import { hexVertices } from '../../board/geometry';
import { pathSpotOk } from '../build';
import { upgradeOutpost } from '../build';
import { player, type Result } from '../setup';
import { placeBulwark } from './bulwarks';
import { promote } from './sentinels';
import type { Play } from './arcana';

// 2 of the resource for every hex of that terrain beside one of your buildings (Citadels add nothing extra).
function harvestAll(s: GameState, id: PlayerId, terrain: Resource): Result {
  const hexes = Object.values(s.board.hexes).filter((h) => h.terrain === terrain && hexVertices(h.id).some((v) => s.buildings[v]?.owner === id));
  const n = Math.min(2 * hexes.length, s.bank[terrain]);
  s.bank[terrain] -= n;
  player(s, id).hand[terrain] += n;
  return n ? [{ type: 'produced', gains: { [id]: { [terrain]: n } } }] : [];
}

export const SCIENCE: Record<string, Play> = {
  alchemist(s, _id, { dice }) {
    if (!dice || dice.length !== 2 || dice.some((d) => !Number.isInteger(d) || d < 1 || d > 6)) return 'pick two dice, 1 to 6';
    s.hf!.turnFlags.alchemist = [dice[0], dice[1]];
    return [];
  },
  crane(s) {
    if (s.hf!.turnFlags.crane) return 'a Winch is already in use';
    s.hf!.turnFlags.crane = true;
    return [];
  },
  engineer: (s, id, { vertex }) => placeBulwark(s, id, vertex ?? '', true),
  inventor(s, _id, { hexes }) {
    const [a, b] = (hexes ?? []).map((h) => s.board.hexes[h]);
    if (!a || !b || a === b) return 'pick two different hexes';
    for (const h of [a, b]) if (h.token === null || INVENTOR_FIXED.includes(h.token)) return 'those tokens cannot move';
    [a.token, b.token] = [b.token, a.token];
    return [];
  },
  irrigation: (s, id) => harvestAll(s, id, 'harvest'),
  mining: (s, id) => harvestAll(s, id, 'starmetal'),
  medicine: (s, id, { vertex }) => upgradeOutpost(s, id, vertex ?? '', MEDICINE_COST),
  roadbuilding(s, id, { edges }) {
    if (!edges?.length || edges.length > 2) return 'lay one or two Paths';
    const p = player(s, id);
    const events: GameEvent[] = [];
    for (const e of edges) {
      if (p.piecesLeft.path < 1) return 'no paths left';
      if (!pathSpotOk(s, id, e)) return 'path must connect to your network';
      s.paths[e] = id;
      p.piecesLeft.path--;
      events.push({ type: 'built', player: id, piece: 'path', at: e });
    }
    return events;
  },
  smith(s, id, { vertices }) {
    if (!vertices?.length || vertices.length > 2 || new Set(vertices).size !== vertices.length) return 'promote one or two different Sentinels';
    const events: GameEvent[] = [];
    for (const v of vertices) {
      const r = promote(s, id, v, true);
      if (typeof r === 'string') return r;
      events.push(...r);
    }
    return events;
  },
};
