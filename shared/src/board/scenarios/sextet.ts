import type { Resource, Terrain } from '../../types';
import type { Scenario } from './landfall';

// One isle per row, as [terrain, token] for its center then its ring (clockwise from south-east, the outer hex left Deep).
// Every isle holds all five resources; tokens match the large board's 35.
const ISLES: [Terrain, number | null][][] = [
  [['harvest', 10], ['timber', 6], ['clay', 3], ['starmetal', 8], ['fleece', 11], ['glimmer', 4]],
  [['clay', 9], ['fleece', 8], ['harvest', 4], ['glimmer', 2], ['starmetal', 6], ['timber', 11]],
  [['timber', 5], ['harvest', 6], ['starmetal', 10], ['clay', 3], ['glimmer', 12], ['fleece', 9]],
  [['fleece', 4], ['clay', 8], ['timber', 11], ['harvest', 9], ['starmetal', 5], ['timber', 3]],
  [['starmetal', 10], ['timber', 6], ['fleece', 5], ['clay', 2], ['harvest', 9], ['harvest', 11]],
  [['ashen', null], ['harvest', 8], ['fleece', 4], ['clay', 12], ['timber', 10], ['starmetal', 5]],
];
// Two ports per isle: on the outer Deep hex, and facing the open sea at the center.
const PORT_KINDS: [Resource | 'any', Resource | 'any'][] = [
  ['any', 'fleece'], ['any', 'clay'], ['any', 'starmetal'], ['harvest', 'any'], ['any', 'timber'], ['any', 'harvest'],
];

const DIRS: [number, number][] = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
// Isle i is isle 0 turned i * 60 degrees clockwise about the center.
const turn = ([q, r]: [number, number], i: number): [number, number] => (i ? turn([-r, q + r], i - 1) : [q, r]);
const add = ([q, r]: [number, number], [dq, dr]: [number, number]): [number, number] => [q + dq, r + dr];
const CENTER: [number, number] = [4, 0];

// Sextet Reach (Quartet Reach for 5-6 players): six equal isles in a ring; start anywhere.
export const SEXTET: Scenario = {
  id: 'sextet',
  prefix: 'Sx',
  name: 'Sextet Reach',
  radius: 5,
  target: 14,
  raiderStart: [0, 0],
  anywhere: true,
  big: true,
  land: ISLES.flatMap((isle, i) =>
    isle.map(([terrain, token], k) => [...turn(k ? add(CENTER, DIRS[k]) : CENTER, i), terrain, token] as Scenario['land'][number]),
  ),
  ports: PORT_KINDS.flatMap(([outer, inner], i) => [
    [...turn(CENTER, i), ...turn(add(CENTER, DIRS[0]), i), outer],
    [...turn(add(CENTER, DIRS[3]), i), ...turn(add(CENTER, [-2, 0]), i), inner],
  ] as Scenario['ports']),
};
