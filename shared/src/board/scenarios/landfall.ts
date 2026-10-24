import type { Resource, Terrain } from '../../types';
import { QUARTET } from './quartet';
import { SEXTET } from './sextet';
import { VEILED } from './veiled';

export interface Scenario {
  id: string; // also the hex-id prefix: `S${letter}`
  prefix: string;
  name: string;
  radius: number; // every hex of this disc not listed in `land` is Deep
  anywhere?: true; // no home isle: setup may start on any isle
  big?: true; // a large map seating 2-6; the others seat 2-4
  land: [q: number, r: number, terrain: Terrain, token: number | null, home?: true][];
  fog?: [terrain: Terrain, token: number | null][]; // hidden contents dealt onto the `mist` hexes
  ports: [q1: number, r1: number, q2: number, r2: number, kind: Resource | 'any'][];
}

// First Landfall: a home isle (west) and two small isles to reach by Boat.
export const LANDFALL: Scenario = {
  id: 'landfall',
  prefix: 'Sf',
  name: 'First Landfall',
  radius: 3,
  land: [
    // home isle
    [-1, 0, 'harvest', 9, true],
    [0, 0, 'timber', 6],
    [-1, 1, 'clay', 10],
    [-2, 1, 'fleece', 8],
    [-2, 0, 'ashen', null],
    [-1, -1, 'starmetal', 3],
    [0, -1, 'fleece', 5],
    [1, -1, 'harvest', 10],
    [0, 1, 'timber', 4],
    [-1, -2, 'clay', 4],
    // east isle
    [2, 0, 'starmetal', 11],
    [3, -1, 'harvest', 9],
    [3, -2, 'glimmer', 4],
    // south isle
    [-2, 3, 'starmetal', 5],
    [-1, 3, 'timber', 11],
    [0, 3, 'glimmer', 10],
  ],
  ports: [
    [-1, -2, 0, -2, 'any'],
    [-1, -2, -2, -1, 'timber'],
    [1, -1, 1, -2, 'any'],
    [1, -1, 2, -1, 'fleece'],
    [0, 1, 1, 1, 'any'],
    [0, 1, -1, 2, 'clay'],
    [-1, 1, -2, 2, 'harvest'],
    [-2, 1, -3, 2, 'any'],
    [-2, 0, -3, 0, 'starmetal'],
  ],
};

export const SCENARIOS: Record<string, Scenario> = { landfall: LANDFALL, quartet: QUARTET, veiled: VEILED, sextet: SEXTET };
