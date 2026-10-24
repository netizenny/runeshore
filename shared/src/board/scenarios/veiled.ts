import type { Scenario } from './landfall';

// Veiled Reach: four isles whose outer fringes are Mist. A path or Boat beside a Mist hex lifts it.
// shortcut: Mist hides land only (no hidden sea), so geometry and isles stay static; revisit for deep-hiding fog.
export const VEILED: Scenario = {
  id: 'veiled',
  prefix: 'Sv',
  name: 'Veiled Reach',
  radius: 4,
  land: [
    // home isle (west) with two Mist hexes on its east shore
    [-3, 1, 'harvest', 9, true],
    [-2, 0, 'timber', 6],
    [-2, 1, 'clay', 10],
    [-3, 2, 'fleece', 8],
    [-4, 2, 'ashen', null],
    [-3, 0, 'starmetal', 3],
    [-1, 0, 'mist', null],
    [-1, 1, 'mist', null],
    // east isle
    [2, -1, 'clay', 9],
    [2, 0, 'harvest', 5],
    [3, -1, 'fleece', 11],
    [3, -2, 'timber', 4],
    [3, 0, 'mist', null],
    [4, -2, 'mist', null],
    // north isle
    [-1, -2, 'starmetal', 5],
    [0, -2, 'timber', 9],
    [0, -3, 'clay', 4],
    [1, -3, 'fleece', 10],
    [-1, -3, 'harvest', 11],
    [1, -4, 'mist', null],
    // south isle
    [0, 2, 'harvest', 6],
    [0, 3, 'fleece', 3],
    [1, 2, 'timber', 8],
    [-1, 3, 'starmetal', 9],
    [1, 3, 'mist', null],
  ],
  // One per Mist hex, dealt out at the start of the game.
  fog: [
    ['timber', 8],
    ['clay', 5],
    ['fleece', 9],
    ['harvest', 11],
    ['glimmer', 6],
    ['starmetal', 4],
  ],
  ports: [
    [-3, 0, -4, 0, 'any'],
    [-3, 2, -3, 3, 'fleece'],
    [-2, 0, -2, -1, 'timber'],
    [3, -2, 4, -3, 'any'],
    [2, -1, 1, -1, 'harvest'],
    [2, 0, 1, 1, 'any'],
    [0, -3, 0, -4, 'any'],
    [1, -3, 2, -4, 'clay'],
    [0, 3, 0, 4, 'starmetal'],
    [-1, 3, -2, 4, 'any'],
    [1, 2, 2, 2, 'timber'],
  ],
};
