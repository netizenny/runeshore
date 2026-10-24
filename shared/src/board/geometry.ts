import type { Board, EdgeId, HexId, VertexId } from '../types';

// Pointy-top axial layout. Directions run clockwise on screen (y down) from east;
// corner i of a hex sits between neighbor directions i and i+1.
const DIRS: [number, number][] = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

// Large-board ids carry an 'L' prefix, so every id says which board it belongs to.
const isBig = (id: string) => id[0] === 'L';
export const hexId = (q: number, r: number, big = false): HexId => `${big ? 'L' : ''}${q},${r}`;
const parse = (h: HexId): [number, number] => {
  const [q, r] = (isBig(h) ? h.slice(1) : h).split(',').map(Number);
  return [q, r];
};
const hexNeighbor = (h: HexId, d: number): HexId => {
  const [q, r] = parse(h);
  return hexId(q + DIRS[d % 6][0], r + DIRS[d % 6][1], isBig(h));
};

export const vertexId = (hexes: [HexId, HexId, HexId]): VertexId => [...hexes].sort().join('|');
export const edgeId = (a: HexId, b: HexId): EdgeId => [a, b].sort().join('~');

const cornerVertex = (h: HexId, i: number): VertexId => vertexId([h, hexNeighbor(h, i), hexNeighbor(h, i + 1)]);
const commonNeighbors = (a: HexId, b: HexId): HexId[] => {
  const nb = new Set([0, 1, 2, 3, 4, 5].map((d) => hexNeighbor(b, d)));
  return [0, 1, 2, 3, 4, 5].map((d) => hexNeighbor(a, d)).filter((x) => nb.has(x));
};
const split = (id: string, sep: string) => id.split(sep) as HexId[];

export function hexPixel(h: HexId, size: number): { x: number; y: number } {
  const [q, r] = parse(h);
  return { x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r };
}

export function vertexPixel(v: VertexId, size: number): { x: number; y: number } {
  const ps = split(v, '|').map((h) => hexPixel(h, size));
  return { x: (ps[0].x + ps[1].x + ps[2].x) / 3, y: (ps[0].y + ps[1].y + ps[2].y) / 3 };
}

// Everything that depends on how many hexes the board has, built once per size.
function universe(radius: number, big: boolean) {
  const land: { q: number; r: number }[] = [];
  for (let q = -radius; q <= radius; q++)
    for (let r = -radius; r <= radius; r++) if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= radius) land.push({ q, r });
  const landSet = new Set(land.map((h) => hexId(h.q, h.r, big)));
  const vertexSet = new Set<VertexId>();
  const edgeSet = new Set<EdgeId>();
  for (const { q, r } of land) {
    const h = hexId(q, r, big);
    for (let i = 0; i < 6; i++) {
      vertexSet.add(cornerVertex(h, i));
      edgeSet.add(edgeId(h, hexNeighbor(h, i)));
    }
  }
  const vertexEdges = new Map<VertexId, EdgeId[]>();
  const vertexNeighbors = new Map<VertexId, VertexId[]>();
  for (const v of vertexSet) {
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
    vertexEdges.set(v, edges);
    vertexNeighbors.set(v, neighbors);
  }
  // Land-to-sea edges in clockwise order (angle of the edge midpoint, y down).
  const coast = [...edgeSet].filter((e) => split(e, '~').some((h) => !landSet.has(h)))
    .map((e) => {
      const [a, b] = split(e, '~');
      const pa = hexPixel(a, 1);
      const pb = hexPixel(b, 1);
      return { e, ang: Math.atan2(pa.y + pb.y, pa.x + pb.x) };
    })
    .sort((p, q) => p.ang - q.ang)
    .map((p) => p.e);
  return { land, landSet, vertexSet, edgeSet, vertices: [...vertexSet], edges: [...edgeSet], coast, vertexEdges, vertexNeighbors };
}

const STANDARD = universe(2, false);
const LARGE = universe(3, true);
const of = (id: string) => (isBig(id) ? LARGE : STANDARD);

export const geometry = (big: boolean) => (big ? LARGE : STANDARD);
export const boardGeometry = (b: Board) => geometry(isBig(Object.keys(b.hexes)[0]));

// The standard board's lists, kept for callers that only ever see that board.
export const LAND_HEXES = STANDARD.land;
export const ALL_VERTICES: VertexId[] = STANDARD.vertices;
export const ALL_EDGES: EdgeId[] = STANDARD.edges;
export const COAST_EDGES: EdgeId[] = STANDARD.coast;

export const vertexHexes = (v: VertexId): HexId[] => split(v, '|').filter((h) => of(v).landSet.has(h));
export const vertexNeighbors = (v: VertexId): VertexId[] => of(v).vertexNeighbors.get(v)!;
export const vertexEdges = (v: VertexId): EdgeId[] => of(v).vertexEdges.get(v)!;

export const edgeVertices = (e: EdgeId): [VertexId, VertexId] => {
  const [a, b] = split(e, '~');
  const [c1, c2] = commonNeighbors(a, b);
  return [vertexId([a, b, c1]), vertexId([a, b, c2])];
};

export const hexVertices = (h: HexId): VertexId[] => [0, 1, 2, 3, 4, 5].map((i) => cornerVertex(h, i));
