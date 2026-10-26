import type { Resource, Terrain } from '../../types';
import { QUARTET } from './quartet';
import { SEXTET } from './sextet';
import { VEILED } from './veiled';
import { VEILED6 } from './veiled6';
import { VOLCANO } from './volcano';

export interface Scenario {
  id: string; // also the hex-id prefix: `S${letter}`
  prefix: string;
  name: string;
  radius: number; // every hex of this disc not listed in `land` is Deep
  anywhere?: true; // no home isle: setup may start on any isle
  big?: true; // a large map seating 2-6; the others seat 2-4
  target: number; // default renown to win (official: 14 New Shores, 13 Four Islands, 12 Fog Islands)
  base?: true; // a map for Original and Hollow Fleet, not a Drowned Isles scenario: no Boats, no Raider
  noLandfall?: true; // no first-outpost bonus per isle
  redAdjacent?: true; // 6s and 8s may sit side by side
  calmWoods?: true; // timber and fleece never take 2, 3, 11 or 12
  raiderStart: [q: number, r: number]; // Deep hex the Raider begins on
  land: [q: number, r: number, terrain: Terrain, token: number | null, home?: true][];
  fog?: { terrains: Terrain[]; tokens: number[] }; // hidden terrains and number tokens, dealt separately onto the `mist` hexes (`deep` takes no token)
  // Random deal: land hexes whose terrain is in `corner` take a random one of them; every other numbered land hex, a random token
  // (Glimmer from `goldTokens`). Desert stays bare. Port kinds: the first of each pair is 3:1, the second a random `portResources`.
  // Mist hexes each draw a terrain from `fog` and a token from `tokens`, independently; setup outposts must touch a `corner` hex.
  random?: { corner: Terrain[]; tokens: number[]; goldTokens: number[]; portResources: Resource[]; fog: Terrain[] };
  ports: [q1: number, r1: number, q2: number, r2: number, kind: Resource | 'any'][];
}

// First Landfall: a home isle (west) and two small isles to reach by Boat.
export const LANDFALL: Scenario = {
  id: 'landfall',
  prefix: 'Sf',
  name: 'First Landfall',
  radius: 3,
  target: 14,
  raiderStart: [1, 2],
  land: [
    // home isle
    [-1, 0, 'harvest', 9, true],
    [0, 0, 'timber', 6],
    [-1, 1, 'clay', 10],
    [-2, 1, 'fleece', 4],
    [-2, 0, 'ashen', null],
    [-1, -1, 'starmetal', 3],
    [0, -1, 'fleece', 5],
    [1, -1, 'harvest', 10],
    [0, 1, 'timber', 4],
    [-1, -2, 'clay', 4],
    // east isle
    [2, 0, 'starmetal', 11],
    [3, -1, 'harvest', 9],
    [3, -2, 'glimmer', 8],
    // south isle
    [-2, 3, 'starmetal', 5],
    [-1, 3, 'timber', 11],
    [0, 3, 'fleece', 10],
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

export const SCENARIOS: Record<string, Scenario> = { landfall: LANDFALL, quartet: QUARTET, veiled: VEILED, sextet: SEXTET, veiled6: VEILED6, volcano: VOLCANO };
