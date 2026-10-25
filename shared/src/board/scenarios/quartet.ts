import type { Scenario } from './landfall';

// Quartet Reach: four equal isles in a ring; start anywhere but the south-west Glimmer isle, every isle but your first gives a Landfall mark.
export const QUARTET: Scenario = {
  id: 'quartet',
  prefix: 'Sq',
  name: 'Quartet Reach',
  radius: 4,
  target: 13,
  calmWoods: true,
  raiderStart: [0, 0],
  anywhere: true,
  land: [
    // north-west isle
    [-2, -1, 'timber', 9],
    [-1, -1, 'harvest', 6],
    [-2, 0, 'clay', 10],
    [-2, -2, 'fleece', 5],
    [-1, -2, 'starmetal', 11],
    [-3, 0, 'harvest', 3],
    // north-east isle
    [2, -3, 'clay', 9],
    [3, -3, 'starmetal', 3],
    [1, -3, 'fleece', 10],
    [2, -2, 'harvest', 6],
    [2, -4, 'starmetal', 5],
    [1, -2, 'timber', 4],
    // east isle
    [2, 1, 'harvest', 8],
    [1, 1, 'fleece', 4],
    [2, 0, 'clay', 11],
    [3, 0, 'clay', 3],
    [2, 2, 'starmetal', 9],
    [1, 2, 'timber', 10],
    // south-west isle
    [-2, 3, 'starmetal', 2],
    [-1, 3, 'fleece', 5],
    [-3, 3, 'glimmer', 8],
    [-2, 2, 'harvest', 12],
    [-1, 2, 'timber', 4],
    [-2, 4, 'ashen', null],
  ],
  ports: [
    [-2, -2, -1, -3, 'any'],
    [-2, -1, -3, -1, 'timber'],
    [2, -4, 1, -4, 'any'],
    [3, -3, 4, -3, 'harvest'],
    [3, 0, 4, 0, 'starmetal'],
    [2, 2, 1, 3, 'any'],
    [-3, 3, -4, 4, 'fleece'],
    [-2, 4, -1, 4, 'clay'],
  ],
};
