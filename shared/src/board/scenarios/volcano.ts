import type { Resource, Terrain } from '../../types';
import type { Scenario } from './landfall';
import { DIRS } from './sextet';

// Colonist "Volcano", traced from its map card. Rows run north to south; rows 0, 2, 4, 6 sit half a hex off rows 1, 3, 5.
// x corner resource (dealt at random), D desert, O ore, F fog, G gold.
const ROWS = ['xxDOFFODxx', 'xxDFOFOFDxx', 'xDFFOOFFDx', 'DOOOGOOOD', 'xDFFOOFFDx', 'xxDFOFOFDxx', 'xxDOFFODxx'];
const TERRAIN: Record<string, [Terrain, number | null]> = { x: ['clay', null], D: ['ashen', null], O: ['starmetal', null], F: ['mist', null], G: ['glimmer', null] };

const LAND = ROWS.flatMap((row, i) => {
  const r = i - 3;
  return [...row].map((c, k) => {
    const x = k - (row.length - 1) / 2; // hex centers, in hex widths from the middle
    return [x - r / 2, r, ...TERRAIN[c]] as Scenario['land'][number];
  });
});

const RADIUS = 6; // the 11-wide rows only fit a disc this big
const key = (q: number, r: number) => `${q},${r}`;
const lit = new Set(LAND.map(([q, r]) => key(q, r)));
const cornerHexes = LAND.filter((l) => l[2] === 'clay');
const mid = (q: number, r: number) => ({ x: q + r / 2, y: r * 1.5 });

// Each corner cluster gets two ports on its outer coast: land hexes with open sea beside them, spread apart.
const PORTS: Scenario['ports'] = [0, 1, 2, 3].flatMap((c) => {
  const east = c % 2 === 1;
  const south = c >= 2;
  const own = cornerHexes.filter(([q, r]) => (q + r / 2 > 0) === east && (r > 0) === south);
  const coast = own.flatMap(([q, r]) =>
    DIRS.filter(([dq, dr]) => !lit.has(key(q + dq, r + dr)) && Math.max(Math.abs(q + dq), Math.abs(r + dr), Math.abs(q + dq + r + dr)) <= RADIUS).map(([dq, dr]) => ({ q, r, dq, dr, a: Math.atan2(mid(q, r).y + mid(q + dq, r + dr).y, mid(q, r).x + mid(q + dq, r + dr).x) })),
  ).sort((p, q) => p.a - q.a);
  // two edges a third of the coast apart (never neighbours, so they never share an outpost spot)
  return [coast[Math.floor(coast.length / 6)], coast[Math.floor((coast.length * 4) / 6)]].map(
    (e, i) => [e.q, e.r, e.q + e.dq, e.r + e.dr, i ? 'timber' : 'any'] as Scenario['ports'][number],
  );
});

// Placeholders: corner hexes hold 'clay' and every number token starts empty. The random deal (see `random`) fills them each game.
export const VOLCANO: Scenario = {
  id: 'volcano',
  prefix: 'Se',
  name: 'Volcano',
  radius: RADIUS,
  target: 10,
  base: true,
  noLandfall: true,
  anywhere: true,
  redAdjacent: true,
  raiderStart: [0, -4],
  land: LAND,
  random: {
    corner: ['clay', 'fleece', 'timber', 'harvest'],
    tokens: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12],
    goldTokens: [6, 8],
    portResources: ['clay', 'fleece', 'timber', 'harvest', 'starmetal'] as Resource[],
    fog: ['clay', 'fleece', 'timber', 'harvest', 'starmetal'],
  },
  ports: PORTS,
};
