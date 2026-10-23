import type { GameState, PlayerId, Resource, ResourceCounts } from '../types';
import { RESOURCES } from '../constants';
import { hexVertices } from '../board/geometry';
import { randInt } from '../rng';
import type { Result } from './setup';

export function roll(s: GameState, _id: PlayerId): Result {
  if (s.phase.k !== 'roll') return 'not time to roll';
  let d1: number, d2: number;
  [d1, s.rngState] = randInt(s.rngState, 6);
  [d2, s.rngState] = randInt(s.rngState, 6);
  s.dice = [d1 + 1, d2 + 1];
  const total = s.dice[0] + s.dice[1];
  const events: Result = [{ type: 'rolled', player: s.order[s.current], dice: s.dice }];
  s.phase = { k: 'main' };
  if (total !== 7) events.push({ type: 'produced', gains: produce(s, total) });
  return events;
}

function produce(s: GameState, total: number): Record<PlayerId, Partial<ResourceCounts>> {
  const owed: Record<PlayerId, Partial<ResourceCounts>> = {};
  for (const hex of Object.values(s.board.hexes)) {
    if (hex.token !== total || hex.id === s.shadeHex || hex.terrain === 'ashen') continue;
    for (const v of hexVertices(hex.id)) {
      const b = s.buildings[v];
      if (!b) continue;
      const o = (owed[b.owner] ??= {});
      o[hex.terrain] = (o[hex.terrain] ?? 0) + (b.kind === 'citadel' ? 2 : 1);
    }
  }
  const gains: Record<PlayerId, Partial<ResourceCounts>> = {};
  for (const r of RESOURCES as Resource[]) {
    const who = Object.keys(owed).filter((p) => owed[p][r]);
    const sum = who.reduce((n, p) => n + owed[p][r]!, 0);
    if (!sum) continue;
    // Short bank: nobody gets it, unless only one player is owed — then they take what's left.
    if (sum > s.bank[r] && who.length > 1) continue;
    for (const p of who) {
      const n = Math.min(owed[p][r]!, s.bank[r]);
      if (!n) continue;
      s.bank[r] -= n;
      s.players.find((x) => x.id === p)!.hand[r] += n;
      (gains[p] ??= {})[r] = n;
    }
  }
  return gains;
}
