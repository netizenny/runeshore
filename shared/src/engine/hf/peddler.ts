import type { GameState, HexId, PlayerId } from '../../types';
import { hexVertices } from '../../board/geometry';
import type { Result } from '../setup';

// Called by the Peddler Arcana card (H11), not a standalone action. Takes the Peddler from its current owner.
export function placePeddler(s: GameState, id: PlayerId, hex: HexId): Result {
  const h = s.board.hexes[hex];
  if (!s.hf || !h || h.terrain === 'ashen') return 'pick a land hex';
  if (!hexVertices(hex).some((v) => s.buildings[v]?.owner === id)) return 'Peddler goes next to your building';
  if (s.hf.peddler?.hex === hex && s.hf.peddler.owner === id) return 'already there';
  s.hf.peddler = { hex, owner: id };
  return [{ type: 'peddlerPlaced', player: id, hex }];
}
