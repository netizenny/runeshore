import type { GameState, PlayerId } from '../../types';

// Renown from expansion sources only; Outposts, Citadels and Longest path stay in `renown`.
export function hfScore(s: GameState, id: PlayerId): number {
  const hf = s.hf!;
  const spires = Object.values(hf.spires).filter((sp) => sp?.owner === id).length;
  return 2 * spires + hf.players[id].shields + hf.players[id].extraRenown + (hf.peddler?.owner === id ? 1 : 0);
}
