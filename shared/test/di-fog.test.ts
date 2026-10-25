import { expect, it } from 'vitest';
import { createGame } from '../src/engine/create';
import { pathEdgeSolid, vertexSolid } from '../src/engine/mist';
import { boardGeometry, vertexHexes } from '../src/board/geometry';
import { DEFAULT_SETTINGS } from '../src/types';
import { PLAYERS } from './helpers';

it('fog-only edges and vertices are not solid; ones touching a home isle are', () => {
  const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario: 'veiled' } as never, 1);
  const fog = s.di!.fogHexes!;
  expect(fog.length).toBeGreaterThan(0);
  for (const h of fog) s.board.hexes[h] = { ...s.board.hexes[h], terrain: 'harvest' }; // as if revealed
  const { vertices } = boardGeometry(s.board);
  const fogOnly = vertices.find((v) => vertexHexes(v).length && vertexHexes(v).every((h) => fog.includes(h)))!;
  const mixed = vertices.find((v) => vertexHexes(v).some((h) => fog.includes(h)) && vertexHexes(v).some((h) => !fog.includes(h) && s.board.hexes[h].terrain !== 'deep'))!;
  expect(vertexSolid(s, fogOnly)).toBe(false);
  expect(vertexSolid(s, mixed)).toBe(true);
  const edge = boardGeometry(s.board).edges.find((e) => e.split('~').every((h) => fog.includes(h)))!;
  expect(pathEdgeSolid(s, edge)).toBe(false);
});
