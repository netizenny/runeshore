import type { EdgeId, GameEvent, GameState, HexId, PlayerId, Terrain } from '../types';
import { RESOURCES } from '../constants';
import { shuffle } from '../rng';
import type { Scenario } from '../board/scenarios/landfall';

// Deals the scenario's hidden land onto its Mist hexes; returns the hidden map and the new rng state.
export function dealMist(sc: Scenario, mistHexes: HexId[], rng: number): [Record<HexId, { terrain: Terrain; token: number | null }>, number] {
  const [fog, next] = shuffle(sc.fog ?? [], rng);
  return [Object.fromEntries(mistHexes.map((h, i) => [h, { terrain: fog[i][0], token: fog[i][1] }])), next];
}

// A Path or Boat beside a Mist hex lifts it. In the main phase the builder takes one card of its kind,
// or a Glimmer pick; setup and Waymaking reveals pay nothing (shortcut: keeps phase flow simple).
export function liftMist(s: GameState, id: PlayerId, edge: EdgeId): GameEvent[] {
  const mist = s.di?.mist;
  if (!mist) return [];
  const events: GameEvent[] = [];
  for (const hex of edge.split('~')) {
    const hidden = mist[hex];
    if (!hidden) continue;
    delete mist[hex];
    s.board.hexes[hex] = { ...s.board.hexes[hex], ...hidden };
    events.push({ type: 'revealed', player: id, hex, ...hidden });
    if (s.phase.k !== 'main' && s.phase.k !== 'glimmer') continue;
    const r = RESOURCES.find((x) => x === hidden.terrain);
    if (r && s.bank[r] > 0) {
      s.bank[r]--;
      s.players.find((p) => p.id === id)!.hand[r]++;
    } else if (hidden.terrain === 'glimmer' && RESOURCES.some((x) => s.bank[x] > 0)) {
      const pending = s.phase.k === 'glimmer' ? s.phase.pending : {};
      s.phase = { k: 'glimmer', pending: { ...pending, [id]: (pending[id] ?? 0) + 1 } };
    }
  }
  return events;
}
