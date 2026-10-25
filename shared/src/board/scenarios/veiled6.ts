import type { Scenario } from './landfall';
import { DIRS, PORT_KINDS, ringLand, ringPorts } from './sextet';
import type { Terrain } from '../../types';

const ISLES: [Terrain, number | null][][] = [
  [['harvest', 10], ['timber', 6], ['clay', 3], ['starmetal', 8], ['fleece', 11], ['clay', 4]],
  [['clay', 9], ['fleece', 8], ['harvest', 4], ['timber', 2], ['starmetal', 6], ['timber', 11]],
  [['timber', 5], ['harvest', 6], ['starmetal', 10], ['clay', 3], ['fleece', 12], ['fleece', 9]],
  [['fleece', 4], ['clay', 8], ['timber', 11], ['harvest', 9], ['starmetal', 5], ['timber', 3]],
  [['starmetal', 10], ['timber', 6], ['fleece', 5], ['clay', 2], ['harvest', 9], ['harvest', 11]],
  [['starmetal', 9], ['harvest', 8], ['fleece', 4], ['clay', 12], ['timber', 10], ['starmetal', 5]],
];
// The heart: the center, its ring, and the six hexes between the isles. The six axis hexes stay open sea for Boats.
const MIST: [number, number][] = [[0, 0], ...DIRS, ...DIRS.map(([q, r], i) => [q + DIRS[(i + 1) % 6][0], r + DIRS[(i + 1) % 6][1]] as [number, number])];

// Veiled Reach for two to six: six isles around a heart of Mist hiding two Glimmer fields.
export const VEILED6: Scenario = {
  id: 'veiled6',
  prefix: 'Sw',
  name: 'Greater Veiled Reach',
  radius: 5,
  target: 14,
  noLandfall: true,
  raiderStart: [2, 0],
  anywhere: true,
  big: true,
  land: [...ringLand(ISLES), ...MIST.map(([q, r]) => [q, r, 'mist', null] as Scenario['land'][number])],
  // 13 hexes, 11 tokens; no red numbers under the fog.
  fog: {
    terrains: ['glimmer', 'glimmer', 'deep', 'deep', 'harvest', 'harvest', 'clay', 'clay', 'timber', 'timber', 'fleece', 'starmetal', 'starmetal'
],
    tokens: [2, 3, 3, 4, 4, 5, 5, 9, 9, 10, 11],
  },
  ports: ringPorts(PORT_KINDS),
};
