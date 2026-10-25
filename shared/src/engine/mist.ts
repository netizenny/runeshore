import type { EdgeId, GameEvent, GameState, HexId, PlayerId, Terrain } from '../types';
import { RESOURCES } from '../constants';
import { shuffle } from '../rng';
import { edgeVertices } from '../board/geometry';
import type { Scenario } from '../board/scenarios/landfall';

// Deals the scenario's hidden terrains and number tokens onto its Mist hexes (apart, as in the official facedown piles;
// Deep takes no token). Returns the hidden map and the new rng state.
export function dealMist(sc: Scenario, mistHexes: HexId[], rng: number): [Record<HexId, { terrain: Terrain; token: number | null }>, number] {
  const [terrains, afterTerrains] = shuffle(sc.fog!.terrains, rng);
  const [tokens, next] = shuffle(sc.fog!.tokens, afterTerrains);
  let t = 0;
  return [Object.fromEntries(mistHexes.map((h, i) => [h, { terrain: terrains[i], token: terrains[i] === 'deep' ? null : tokens[t++] }])), next];
}

// A path or Boat beside an intersection that touches Mist lifts every Mist hex there. Land pays the builder
// 1 card of its kind (a Glimmer field, a pick); Deep pays nothing.
// shortcut: outside the main phase (setup, Twin Paths) a Glimmer reveal pays the builder's scarcest resource, not a pick.
export function liftMist(s: GameState, id: PlayerId, edge: EdgeId): GameEvent[] {
  const mist = s.di?.mist;
  if (!mist) return [];
  const events: GameEvent[] = [];
  const player = s.players.find((p) => p.id === id)!;
  for (const hex of [...new Set(edgeVertices(edge).flatMap((v) => v.split('|')))].sort()) {
    const hidden = mist[hex];
    if (!hidden) continue;
    delete mist[hex];
    s.board.hexes[hex] = { ...s.board.hexes[hex], ...hidden };
    events.push({ type: 'revealed', player: id, hex, ...hidden });
    const r = RESOURCES.find((x) => x === hidden.terrain);
    if (r && s.bank[r] > 0) {
      s.bank[r]--;
      player.hand[r]++;
    } else if (hidden.terrain === 'glimmer' && RESOURCES.some((x) => s.bank[x] > 0)) {
      if (s.phase.k === 'main' || s.phase.k === 'glimmer') {
        const pending = s.phase.k === 'glimmer' ? s.phase.pending : {};
        s.phase = { k: 'glimmer', pending: { ...pending, [id]: (pending[id] ?? 0) + 1 } };
      } else {
        const pick = RESOURCES.filter((x) => s.bank[x] > 0).sort((a, b) => player.hand[a] - player.hand[b])[0];
        s.bank[pick]--;
        player.hand[pick]++;
      }
    }
  }
  return events;
}
