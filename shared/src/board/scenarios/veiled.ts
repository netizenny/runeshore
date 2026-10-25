import type { Scenario } from './landfall';

// Veiled Reach: two isles with a band of Mist between them, a sea gap apart so the fog is reached only by Boat. A path or Boat beside an intersection that touches
// Mist lifts it; what lies under may be land, a Glimmer field or open Deep.
export const VEILED: Scenario = {
  id: 'veiled',
  prefix: 'Sv',
  name: 'Veiled Reach',
  radius: 5,
  target: 12,
  noLandfall: true,
  redAdjacent: true,
  anywhere: true,
  raiderStart: [0, 3],
  land: [
    // west isle
    [-3, -1, 'harvest', 9],
    [-2, -1, 'timber', 6],
    [-4, 0, 'clay', 10],
    [-3, 0, 'fleece', 8],
    [-2, 0, 'starmetal', 3],
    [-4, 1, 'timber', 4],
    [-3, 1, 'clay', 11],
    [-5, 1, 'fleece', 5],
    // east isle
    [3, 1, 'harvest', 9],
    [2, 1, 'timber', 6],
    [4, 0, 'clay', 10],
    [3, 0, 'fleece', 8],
    [2, 0, 'starmetal', 5],
    [4, -1, 'timber', 4],
    [3, -1, 'starmetal', 12],
    [5, -1, 'harvest', 11],
    // the Mist band, top to bottom
    [2, -4, 'mist', null],
    [1, -3, 'mist', null],
    [2, -3, 'mist', null],
    [1, -2, 'mist', null],
    [0, -1, 'mist', null],
    [1, -1, 'mist', null],
    [0, 0, 'mist', null],
    [0, 1, 'mist', null],
    [-1, 1, 'mist', null],
    [-1, 2, 'mist', null],
    [-1, 3, 'mist', null],
    [-2, 3, 'mist', null],
    [-2, 4, 'mist', null],
  ],
  // One per Mist hex. Terrains and tokens are dealt apart; Deep takes no token (13 hexes, 11 tokens).
  fog: {
    terrains: ['deep', 'deep', 'glimmer', 'glimmer', 'harvest', 'harvest', 'clay', 'clay', 'timber', 'fleece', 'fleece', 'starmetal', 'starmetal'],
    tokens: [2, 3, 3, 4, 5, 6, 8, 9, 9, 10, 11],
  },
  ports: [
    [-3, -1, -3, -2, 'any'],
    [-4, 0, -5, 0, 'timber'],
    [-5, 1, -5, 2, 'any'],
    [-3, 1, -3, 2, 'clay'],
    [3, 1, 3, 2, 'starmetal'],
    [4, 0, 5, 0, 'fleece'],
    [5, -1, 5, -2, 'any'],
    [3, -1, 3, -2, 'harvest'],
  ],
};
