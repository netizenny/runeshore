import { expect, test } from 'vitest';
import {
  ALL_EDGES, ALL_VERTICES, COAST_EDGES, LAND_HEXES, edgeVertices, hexId, hexPixel,
  hexVertices, vertexEdges, vertexHexes, vertexId, vertexNeighbors, vertexPixel,
} from '../src/board/geometry';

test('counts', () => {
  expect(LAND_HEXES).toHaveLength(19);
  expect(ALL_VERTICES).toHaveLength(54);
  expect(ALL_EDGES).toHaveLength(72);
  expect(COAST_EDGES).toHaveLength(30);
  expect(new Set(COAST_EDGES).size).toBe(30);
});

test('every vertex has 2 or 3 neighbors and 2 or 3 edges', () => {
  for (const v of ALL_VERTICES) {
    const n = vertexNeighbors(v).length;
    expect(n === 2 || n === 3).toBe(true);
    expect(vertexEdges(v)).toHaveLength(n);
  }
});

test('center hex has 6 interior vertices', () => {
  const vs = hexVertices(hexId(0, 0));
  expect(new Set(vs).size).toBe(6);
  for (const v of vs) expect(vertexHexes(v)).toHaveLength(3);
});

test('edge endpoints are neighbors; edges chain', () => {
  for (const e of ALL_EDGES) {
    const [a, b] = edgeVertices(e);
    expect(vertexNeighbors(a)).toContain(b);
    expect(vertexNeighbors(b)).toContain(a);
    expect(vertexEdges(a)).toContain(e);
  }
});

test('vertexId is order independent', () => {
  expect(vertexId(['0,0', '1,0', '0,1'])).toBe(vertexId(['0,1', '0,0', '1,0']));
});

test('pixel layout: adjacent hexes one apart, vertices on the hex ring', () => {
  const size = 10;
  const c = hexPixel('0,0', size);
  const e = hexPixel('1,0', size);
  expect(Math.hypot(e.x - c.x, e.y - c.y)).toBeCloseTo(size * Math.sqrt(3));
  for (const v of hexVertices('0,0')) {
    const p = vertexPixel(v, size);
    expect(Math.hypot(p.x - c.x, p.y - c.y)).toBeCloseTo(size);
  }
});
