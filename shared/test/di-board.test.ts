import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/create';
import { applyAction } from '../src/engine/apply';
import { legalActions } from '../src/engine/legal';
import { boardGeometry, edgeVertices, isPathEdge, vertexHexes } from '../src/board/geometry';
import { DEFAULT_SETTINGS, type GameState } from '../src/types';
import { PLAYERS } from './helpers';

const di = () => createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true }, 5);
const current = (s: GameState) => s.order[s.current];

describe('Drowned Isles board', () => {
  it('builds First Landfall: 16 land hexes in 3 isles, 21 deep, ports on land-deep edges', () => {
    const s = di();
    const hexes = Object.values(s.board.hexes);
    expect(hexes).toHaveLength(37);
    expect(hexes.filter((h) => h.terrain !== 'deep')).toHaveLength(16);
    expect(hexes.every((h) => h.id.startsWith('Sf'))).toBe(true);
    expect(new Set(Object.values(s.di!.isleOf)).size).toBe(3);
    expect(s.board.ports).toHaveLength(9);
    const { edgeSet } = boardGeometry(s.board);
    for (const p of s.board.ports) {
      expect(edgeSet.has(p.edge)).toBe(true);
      const [a, b] = p.edge.split('~');
      expect([a, b].filter((h) => s.board.hexes[h]?.terrain !== 'deep' && s.board.hexes[h])).toHaveLength(1);
    }
    expect(s.board.hexes[s.shadeHex].terrain).toBe('ashen');
  });

  it('sea-only edges cannot hold paths; vertices there have no land', () => {
    const s = di();
    const { edges, vertices } = boardGeometry(s.board);
    expect(edges.some((e) => !isPathEdge(e))).toBe(true);
    expect(vertices.some((v) => vertexHexes(v).length === 0)).toBe(true);
  });

  it('setup is limited to the home isle, and every offered spot works', () => {
    let s = di();
    const spots = legalActions(s, current(s)).filter((a) => a.type === 'placeOutpost');
    expect(spots.length).toBeGreaterThan(0);
    for (const a of spots) {
      if (a.type !== 'placeOutpost') continue;
      expect(vertexHexes(a.vertex).some((h) => s.di!.isleOf[h] === s.di!.homeIsle)).toBe(true);
    }
    const far = boardGeometry(s.board).vertices.find((v) => vertexHexes(v).length && vertexHexes(v).every((h) => s.di!.isleOf[h] !== s.di!.homeIsle))!;
    expect(applyAction(s, current(s), { type: 'placeOutpost', vertex: far })).toMatchObject({ ok: false });
    const sea = boardGeometry(s.board).vertices.find((v) => !vertexHexes(v).length)!;
    expect(applyAction(s, current(s), { type: 'placeOutpost', vertex: sea })).toMatchObject({ ok: false });
    const [a] = spots;
    const r = applyAction(s, current(s), a);
    expect(r.ok).toBe(true);
    s = (r as { ok: true; state: GameState }).state;
    const paths = legalActions(s, current(s)).filter((x) => x.type === 'placePath');
    expect(paths.length).toBeGreaterThan(0);
    for (const x of paths) if (x.type === 'placePath') expect(edgeVertices(x.edge).includes((s.phase as { lastOutpost: string }).lastOutpost)).toBe(true);
  });

  it('the Shade cannot go to a Deep hex', () => {
    const s = di();
    s.phase = { k: 'moveShade', then: 'main' };
    const deep = Object.values(s.board.hexes).find((h) => h.terrain === 'deep')!.id;
    expect(applyAction(s, current(s), { type: 'moveShade', hex: deep })).toMatchObject({ ok: false });
    expect(legalActions(s, current(s)).some((a) => a.type === 'moveShade' && !a.raider && s.board.hexes[a.hex].terrain === 'deep')).toBe(false);
  });

  it('with the toggle off nothing changes', () => {
    const s = createGame(PLAYERS, DEFAULT_SETTINGS, 5);
    expect(s.di).toBeUndefined();
    expect(Object.keys(s.board.hexes)).toHaveLength(19);
  });
});
