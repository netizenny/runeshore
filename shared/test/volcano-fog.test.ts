import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { createGame } from '../src/engine/create';
import { liftMist, pathEdgeSolid } from '../src/engine/mist';
import { boardGeometry, edgeVertices, vertexHexes } from '../src/board/geometry';
import { DEFAULT_SETTINGS } from '../src/types';
import { PLAYERS } from './helpers';

const game = (seed: number) => createGame(PLAYERS, { ...DEFAULT_SETTINGS, boardSize: 'volcano' }, seed);
const FIVE = ['clay', 'fleece', 'timber', 'harvest', 'starmetal'];
const CORNER = ['clay', 'fleece', 'timber', 'harvest'];

describe('Volcano fog', () => {
  it('hides 18 fog hexes, each one of the five resources with a legal token', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = game(seed);
      expect(s.di!.fogHexes).toHaveLength(18);
      expect(Object.keys(s.di!.mist!)).toHaveLength(18);
      for (const m of Object.values(s.di!.mist!)) {
        expect(FIVE).toContain(m.terrain);
        expect([2, 3, 4, 5, 6, 8, 9, 10, 11, 12]).toContain(m.token);
      }
    }
    expect(JSON.stringify(game(5).di!.mist)).toBe(JSON.stringify(game(5).di!.mist));
  });

  it('a path on foot beside fog lifts it and pays the builder the revealed resource', () => {
    const s = game(2);
    const { edges } = boardGeometry(s.board);
    const edge = edges.find((e) => pathEdgeSolid(s, e) && edgeVertices(e).some((v) => vertexHexes(v).some((h) => s.di!.mist![h])))!;
    const hexes = [...new Set(edgeVertices(edge).flatMap((v) => v.split('|')))].filter((h) => s.di!.mist![h]);
    const hidden = hexes.map((h) => s.di!.mist![h]);
    const events = liftMist(s, 'a', edge);
    expect(events.filter((e) => e.type === 'revealed')).toHaveLength(hexes.length);
    for (const h of hexes) {
      expect(s.di!.mist![h]).toBeUndefined();
      expect(FIVE).toContain(s.board.hexes[h].terrain);
    }
    const got = Object.values(s.players.find((p) => p.id === 'a')!.hand).reduce((a, b) => a + b, 0);
    expect(got).toBe(hidden.length);
  });

  it('setup outposts must touch a corner hex', () => {
    const s = game(3);
    const { vertices } = boardGeometry(s.board);
    const touches = (v: string) => vertexHexes(v).some((h) => CORNER.includes(s.board.hexes[h].terrain));
    const ok = vertices.find(touches)!;
    const bad = vertices.find((v) => vertexHexes(v).length && !touches(v))!;
    const who = s.order[s.current];
    expect(typeof applyAction(s, who, { type: 'placeOutpost', vertex: bad })).toBe('object');
    expect((applyAction(s, who, { type: 'placeOutpost', vertex: bad }) as { error?: string }).error).toBeTruthy();
    expect((applyAction(s, who, { type: 'placeOutpost', vertex: ok }) as { error?: string }).error).toBeUndefined();
  });
});
