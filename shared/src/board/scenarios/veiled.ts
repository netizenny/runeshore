import type { Resource, Terrain } from '../../types';
import type { Scenario } from './landfall';

type Hx = [number, number];
// An isle is its template turned or mirrored into one of the four corners.
const CORNERS: ((h: Hx) => Hx)[] = [([q, r]) => [q, r], ([q, r]) => [-q - r, r], ([q, r]) => [-q, -r], ([q, r]) => [q + r, -r]];
const SHAPE: Hx[] = [[4, -3], [5, -3], [4, -2], [3, -2], [3, -3], [4, -4]]; // north-east corner: center, then its ring (the far hex left Deep)
const OUTER_PORTS: [Hx, Hx][] = [[[4, -4], [4, -5]], [[4, -2], [5, -2]]]; // land hex, Deep hex beyond it
const ISLES: [Terrain, number][][] = [
  [['harvest', 9], ['timber', 6], ['clay', 10], ['fleece', 5], ['starmetal', 3], ['clay', 4]],
  [['timber', 10], ['harvest', 8], ['starmetal', 5], ['clay', 11], ['fleece', 9], ['harvest', 4]],
  [['clay', 9], ['fleece', 8], ['timber', 4], ['harvest', 3], ['starmetal', 10], ['timber', 11]],
  [['fleece', 6], ['starmetal', 9], ['harvest', 11], ['clay', 12], ['timber', 5], ['starmetal', 8]],
];
const PORT_KINDS: (Resource | 'any')[] = ['any', 'timber', 'any', 'harvest', 'starmetal', 'any', 'fleece', 'clay'];
const MIST: Hx[] = [[0, 0], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

// Veiled Reach: four isles, one in each corner, around a heart of Mist a sea gap away from all of them, so the fog is reached only by Boat.
// A path or Boat beside an intersection that touches Mist lifts it; what lies under may be land, the one Glimmer field or open Deep.
export const VEILED: Scenario = {
  id: 'veiled',
  prefix: 'Sv',
  name: 'Veiled Reach',
  radius: 5,
  target: 12,
  noLandfall: true,
  anywhere: true,
  raiderStart: [2, 0],
  land: [
    ...ISLES.flatMap((isle, i) => isle.map(([terrain, token], k) => [...CORNERS[i](SHAPE[k]), terrain, token] as Scenario['land'][number])),
    ...MIST.map(([q, r]) => [q, r, 'mist', null] as Scenario['land'][number]),
  ],
  // One per Mist hex. Terrains and tokens are dealt apart; Deep takes no token (7 hexes, 6 tokens). No red numbers under the fog.
  fog: {
    terrains: ['glimmer', 'deep', 'harvest', 'clay', 'timber', 'fleece', 'starmetal'],
    tokens: [3, 4, 5, 9, 10, 11],
  },
  ports: CORNERS.flatMap((to, i) => OUTER_PORTS.map(([land, sea], k) => [...to(land), ...to(sea), PORT_KINDS[i * 2 + k]] as Scenario['ports'][number])),
};
