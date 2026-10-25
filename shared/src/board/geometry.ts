import type { Board, EdgeId, HexId, VertexId } from '../types';
import { LANDFALL, type Scenario } from './scenarios/landfall';
import { QUARTET } from './scenarios/quartet';
import { SEXTET } from './scenarios/sextet';
import { VEILED } from './scenarios/veiled';
import { VEILED6 } from './scenarios/veiled6';

// Pointy-top axial layout. Directions run clockwise on screen (y down) from east;
// corner i of a hex sits between neighbor directions i and i+1.
const DIRS: [number, number][] = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

// Every id carries its board's letter prefix: none = standard, 'L' = large, 'S?' = a Drowned Isles scenario.
// `true` still means the large board.
const prefixOf = (id: string) => /^[A-Za-z]*/.exec(id)![0];
export const hexId = (q: number, r: number, pre: string | boolean = ''): HexId => `${pre === true ? 'L' : pre || ''}${q},${r}`;
const parse = (h: HexId): [number, number] => {
  const [q, r] = h.slice(prefixOf(h).length).split(',').map(Number);
  return [q, r];
};
const hexNeighbor = (h: HexId, d: number): HexId => {
  const [q, r] = parse(h);
  return hexId(q + DIRS[d % 6][0], r + DIRS[d % 6][1], prefixOf(h));
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

// Everything that depends on the board's shape, built once per board. `isLand` is false for Deep hexes,
// which sit in the disc (so boats can use their edges) but never produce or take buildings.
function universe(radius: number, pre: string, isLand: (q: number, r: number) => boolean = () => true) {
  const all: { q: number; r: number }[] = [];
  for (let q = -radius; q <= radius; q++)
    for (let r = -radius; r <= radius; r++) if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= radius) all.push({ q, r });
  const land = all.filter((h) => isLand(h.q, h.r));
  const landSet = new Set(land.map((h) => hexId(h.q, h.r, pre)));
  const vertexSet = new Set<VertexId>();
  const edgeSet = new Set<EdgeId>();
  for (const { q, r } of all) {
    const h = hexId(q, r, pre);
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
  return { all, land, landSet, vertexSet, edgeSet, vertices: [...vertexSet], edges: [...edgeSet], coast, vertexEdges, vertexNeighbors };
}

const STANDARD = universe(2, '');
const LARGE = universe(3, 'L');
const scenarioUniverse = (sc: Scenario) => {
  const lit = new Set(sc.land.map(([q, r]) => `${q},${r}`));
  return universe(sc.radius, sc.prefix, (q, r) => lit.has(`${q},${r}`));
};
const UNIVERSES: Record<string, typeof STANDARD> = { '': STANDARD, L: LARGE, [LANDFALL.prefix]: scenarioUniverse(LANDFALL), [QUARTET.prefix]: scenarioUniverse(QUARTET), [VEILED.prefix]: scenarioUniverse(VEILED), [SEXTET.prefix]: scenarioUniverse(SEXTET), [VEILED6.prefix]: scenarioUniverse(VEILED6) };
const of = (id: string) => UNIVERSES[prefixOf(id)];

export const geometry = (pre: string | boolean) => UNIVERSES[pre === true ? 'L' : pre || ''];
export const boardGeometry = (b: Board) => of(Object.keys(b.hexes)[0]);
// A path needs land on at least one side; open-water edges are for Boats.
export const isPathEdge = (e: EdgeId): boolean => split(e, '~').some((h) => of(e).landSet.has(h));

// Real land right now: Deep and unlifted Mist hexes are sea. The universe's landSet is static, so it only says where land can ever be.
export const isLandHex = (b: Board, h: HexId): boolean => {
  const t = b.hexes[h]?.terrain;
  return !!t && t !== 'deep' && t !== 'mist';
};
export const pathEdgeOn = (b: Board, e: EdgeId): boolean => split(e, '~').some((h) => isLandHex(b, h));
export const landHexesAt = (b: Board, v: VertexId): HexId[] => vertexHexes(v).filter((h) => isLandHex(b, h));

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
