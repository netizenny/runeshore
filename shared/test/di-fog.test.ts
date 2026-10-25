import { expect, it } from 'vitest';
import { createGame } from '../src/engine/create';
import { pathEdgeSolid, vertexSolid } from '../src/engine/mist';
import { boardGeometry, vertexHexes } from '../src/board/geometry';
import { VEILED } from '../src/board/scenarios/veiled';
import { DEFAULT_SETTINGS } from '../src/types';
import { PLAYERS } from './helpers';

it('fog-only edges and vertices are not solid', () => {
  const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario: 'veiled' } as never, 1);
  const fog = s.di!.fogHexes!;
  expect(fog.length).toBeGreaterThan(0);
  for (const h of fog) s.board.hexes[h] = { ...s.board.hexes[h], terrain: 'harvest' }; // as if revealed
  const { vertices, edges } = boardGeometry(s.board);
  const fogOnly = vertices.find((v) => vertexHexes(v).length && vertexHexes(v).every((h) => fog.includes(h)))!;
  expect(vertexSolid(s, fogOnly)).toBe(false);
  expect(pathEdgeSolid(s, edges.find((e) => e.split('~').every((h) => fog.includes(h)))!)).toBe(false);
});

it('a lifted Mist hex is ordinary buildable land', () => {
  const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario: 'veiled' } as never, 1);
  const fog = s.di!.fogHexes!;
  for (const h of fog) s.board.hexes[h] = { ...s.board.hexes[h], terrain: 'harvest' };
  const fogOnly = boardGeometry(s.board).vertices.find((v) => vertexHexes(v).length && vertexHexes(v).every((h) => fog.includes(h)))!;
  for (const h of fog) delete s.di!.mist![h];
  expect(vertexSolid(s, fogOnly)).toBe(true);
});

it('Veiled Reach keeps a sea gap between the Mist and the isles', () => {
  const dist = (a: [number, number], b: [number, number]) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[0] + a[1] - b[0] - b[1]));
  const mist = VEILED.land.filter((h) => h[2] === 'mist');
  const land = VEILED.land.filter((h) => h[2] !== 'mist');
  for (const m of mist) for (const l of land) expect(dist([m[0], m[1]], [l[0], l[1]])).toBeGreaterThan(1);
});
