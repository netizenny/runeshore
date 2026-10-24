import type { GameState, PlayerId } from '../../types';

// Glory from expansion sources only; Outposts, Citadels and Longest path stay in `glory`.
export function hfScore(s: GameState, id: PlayerId): number {
  const hf = s.hf!;
  const spires = Object.values(hf.spires).filter((sp) => sp?.owner === id).length;
  return 2 * spires + hf.players[id].shields + hf.players[id].extraGlory + (hf.peddler?.owner === id ? 1 : 0);
}
