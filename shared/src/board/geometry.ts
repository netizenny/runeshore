import type { EdgeId, HexId, VertexId } from '../types';

// Pointy-top axial layout. Directions run clockwise on screen (y down) from east;
// corner i of a hex sits between neighbor directions i and i+1.
const DIRS: [number, number][] = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

export const hexId = (q: number, r: number): HexId => `${q},${r}`;
const parse = (h: HexId): [number, number] => {
  const [q, r] = h.split(',').map(Number);
  return [q, r];
};
const hexNeighbor = (h: HexId, d: number): HexId => {
  const [q, r] = parse(h);
  return hexId(q + DIRS[d % 6][0], r + DIRS[d % 6][1]);
};

export const LAND_HEXES: { q: number; r: number }[] = [];
for (let q = -2; q <= 2; q++)
  for (let r = -2; r <= 2; r++) if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= 2) LAND_HEXES.push({ q, r });
const LAND = new Set(LAND_HEXES.map((h) => hexId(h.q, h.r)));

export const vertexId = (hexes: [HexId, HexId, HexId]): VertexId => [...hexes].sort().join('|');
export const edgeId = (a: HexId, b: HexId): EdgeId => [a, b].sort().join('~');

const cornerVertex = (h: HexId, i: number): VertexId => vertexId([h, hexNeighbor(h, i), hexNeighbor(h, i + 1)]);
const commonNeighbors = (a: HexId, b: HexId): HexId[] => {
  const nb = new Set([0, 1, 2, 3, 4, 5].map((d) => hexNeighbor(b, d)));
  return [0, 1, 2, 3, 4, 5].map((d) => hexNeighbor(a, d)).filter((x) => nb.has(x));
};

const vertexSet = new Set<VertexId>();
const edgeSet = new Set<EdgeId>();
for (const { q, r } of LAND_HEXES) {
  const h = hexId(q, r);
  for (let i = 0; i < 6; i++) {
    vertexSet.add(cornerVertex(h, i));
    edgeSet.add(edgeId(h, hexNeighbor(h, i)));
  }
}
export const ALL_VERTICES: VertexId[] = [...vertexSet];
export const ALL_EDGES: EdgeId[] = [...edgeSet];

const split = (id: string, sep: string) => id.split(sep) as HexId[];

export const vertexHexes = (v: VertexId): HexId[] => split(v, '|').filter((h) => LAND.has(h));

const vertexEdgeMap = new Map<VertexId, EdgeId[]>();
const vertexNeighborMap = new Map<VertexId, VertexId[]>();
for (const v of ALL_VERTICES) {
  const [a, b, c] = split(v, '|');
  const edges: EdgeId[] = [];
  const neighbors: VertexId[] = [];
  for (const [x, y, z] of [[a, b, c], [a, c, b], [b, c, a]]) {
    const e = edgeId(x, y);
    if (!edgeSet.has(e)) continue;
    edges.push(e);
    const d = commonNeighbors(x, y).find((n) => n !== z)!;
    neighbors.push(vertexId([x, y, d]));
  }
  vertexEdgeMap.set(v, edges);
  vertexNeighborMap.set(v, neighbors);
}
export const vertexNeighbors = (v: VertexId): VertexId[] => vertexNeighborMap.get(v)!;
export const vertexEdges = (v: VertexId): EdgeId[] => vertexEdgeMap.get(v)!;

export const edgeVertices = (e: EdgeId): [VertexId, VertexId] => {
  const [a, b] = split(e, '~');
  const [c1, c2] = commonNeighbors(a, b);
  return [vertexId([a, b, c1]), vertexId([a, b, c2])];
};

export const edgeNeighbors = (e: EdgeId): EdgeId[] => {
  const out = new Set<EdgeId>();
  for (const v of edgeVertices(e)) for (const n of vertexEdges(v)) if (n !== e) out.add(n);
  return [...out];
};

export const hexVertices = (h: HexId): VertexId[] => [0, 1, 2, 3, 4, 5].map((i) => cornerVertex(h, i));

export function hexPixel(h: HexId, size: number): { x: number; y: number } {
  const [q, r] = parse(h);
  return { x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r };
}

export function vertexPixel(v: VertexId, size: number): { x: number; y: number } {
  const ps = split(v, '|').map((h) => hexPixel(h, size));
  return { x: (ps[0].x + ps[1].x + ps[2].x) / 3, y: (ps[0].y + ps[1].y + ps[2].y) / 3 };
}

// Land-to-sea edges in clockwise order (angle of the edge midpoint, y down).
export const COAST_EDGES: EdgeId[] = ALL_EDGES.filter((e) => split(e, '~').some((h) => !LAND.has(h)))
  .map((e) => {
    const [a, b] = split(e, '~');
    const pa = hexPixel(a, 1);
    const pb = hexPixel(b, 1);
    return { e, ang: Math.atan2(pa.y + pb.y, pa.x + pb.x) };
  })
  .sort((p, q) => p.ang - q.ang)
  .map((p) => p.e);
