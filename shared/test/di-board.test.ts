import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/create';
import { applyAction } from '../src/engine/apply';
import { legalActions } from '../src/engine/legal';
import { boardGeometry, edgeVertices, isPathEdge, vertexHexes } from '../src/board/geometry';
import { DEFAULT_SETTINGS, type GameState } from '../src/types';
import { claimLandfall } from '../src/engine/awards';
import { liftMist } from '../src/engine/mist';
import { viewFor } from '../src/view';
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

describe('Quartet Reach', () => {
  const qr = () => createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario: 'quartet' }, 5);

  it('builds 4 isles of 6 hexes, ports on land-deep edges, setup allowed anywhere', () => {
    const s = qr();
    const land = Object.values(s.board.hexes).filter((h) => h.terrain !== 'deep');
    expect(land).toHaveLength(24);
    expect(new Set(Object.values(s.di!.isleOf)).size).toBe(4);
    expect(s.di!.homeIsle).toBe('');
    const { edgeSet } = boardGeometry(s.board);
    for (const p of s.board.ports) {
      expect(edgeSet.has(p.edge)).toBe(true);
      const [a, b] = p.edge.split('~');
      expect([a, b].filter((h) => s.board.hexes[h]?.terrain !== 'deep' && s.board.hexes[h])).toHaveLength(1);
    }
    const isles = new Set(
      legalActions(s, current(s)).flatMap((a) => (a.type === 'placeOutpost' ? vertexHexes(a.vertex).map((h) => s.di!.isleOf[h]) : [])),
    );
    expect(isles.size).toBe(4);
  });

  it('Landfall skips the isle you started on, pays on a new one', () => {
    const s = qr();
    const id = current(s);
    const { vertices } = boardGeometry(s.board);
    const onIsle = (isle: string) => vertices.filter((v) => vertexHexes(v).length && vertexHexes(v).every((h) => s.di!.isleOf[h] === isle));
    const [i0, i1] = [...new Set(Object.values(s.di!.isleOf))];
    const [start, other] = onIsle(i0);
    s.buildings[start] = { owner: id, kind: 'outpost' };
    s.buildings[other] = { owner: id, kind: 'outpost' };
    expect(claimLandfall(s, id, other)).toEqual([]);
    const far = onIsle(i1)[0];
    s.buildings[far] = { owner: id, kind: 'outpost' };
    expect(claimLandfall(s, id, far)).toEqual([{ type: 'landfall', player: id, isle: i1 }]);
  });
});

describe('Veiled Reach Mist', () => {
  const vr = () => createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario: 'veiled' }, 5);

  it('hides 6 Mist hexes, keeps them off the wire, and deals the fog pool', () => {
    const s = vr();
    const mist = Object.values(s.board.hexes).filter((h) => h.terrain === 'mist');
    expect(mist).toHaveLength(6);
    expect(Object.keys(s.di!.mist!).sort()).toEqual(mist.map((h) => h.id).sort());
    expect(Object.values(s.di!.mist!).map((m) => m.terrain).sort()).toEqual(['clay', 'fleece', 'glimmer', 'harvest', 'starmetal', 'timber']);
    expect(viewFor(s, 'a').di!.mist).toBeUndefined();
    expect(s.board.hexes[s.shadeHex].terrain).toBe('ashen');
  });

  it('a path beside Mist lifts it and pays a card; Glimmer pays a pick; hex then produces', () => {
    const s = vr();
    s.phase = { k: 'main' };
    s.turn = 1;
    const id = current(s);
    const [hex] = Object.keys(s.di!.mist!);
    const edge = [...boardGeometry(s.board).edgeSet].find((e) => e.split('~').includes(hex))!;
    s.di!.mist![hex] = { terrain: 'clay', token: 8 };
    const before = s.players.find((p) => p.id === id)!.hand.clay;
    const ev = liftMist(s, id, edge);
    expect(ev).toContainEqual({ type: 'revealed', player: id, hex, terrain: 'clay', token: 8 });
    expect(s.board.hexes[hex]).toMatchObject({ terrain: 'clay', token: 8 });
    expect(s.players.find((p) => p.id === id)!.hand.clay).toBe(before + 1);
    expect(s.di!.mist![hex]).toBeUndefined();
    expect(liftMist(s, id, edge)).toEqual([]);
  });

  it('a Glimmer reveal opens a pick', () => {
    const s = vr();
    s.phase = { k: 'main' };
    const id = current(s);
    const [hex] = Object.keys(s.di!.mist!);
    s.di!.mist![hex] = { terrain: 'glimmer', token: 6 };
    liftMist(s, id, [...boardGeometry(s.board).edgeSet].find((e) => e.split('~').includes(hex))!);
    expect(s.phase).toEqual({ k: 'glimmer', pending: { [id]: 1 } });
  });
});

describe('Sextet Reach', () => {
  const six = Array.from({ length: 6 }, (_, i) => ({ id: 'abcdef'[i], name: `P${i}`, color: 'ember' as const }));
  const sx = () => createGame(six, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario: 'sextet' }, 5);

  it('builds 6 isles of 6 hexes with every resource, 12 ports on land-deep edges, a 5-6 bank', () => {
    const s = sx();
    const land = Object.values(s.board.hexes).filter((h) => h.terrain !== 'deep');
    expect(Object.keys(s.board.hexes)).toHaveLength(91);
    expect(land).toHaveLength(36);
    expect(land.filter((h) => h.terrain === 'ashen')).toHaveLength(1);
    const isles = new Set(Object.values(s.di!.isleOf));
    expect(isles.size).toBe(6);
    for (const isle of isles) {
      const terrains = land.filter((h) => s.di!.isleOf[h.id] === isle).map((h) => h.terrain);
      expect(terrains).toHaveLength(6);
      for (const r of ['clay', 'timber', 'fleece', 'harvest', 'starmetal']) expect(terrains).toContain(r);
    }
    expect(s.board.ports).toHaveLength(12);
    for (const p of s.board.ports) {
      const [a, b] = p.edge.split('~');
      expect(s.board.hexes[a] && s.board.hexes[b]).toBeTruthy();
      expect([a, b].filter((h) => s.board.hexes[h].terrain !== 'deep')).toHaveLength(1);
    }
    expect(s.bank.clay).toBe(24);
    expect(s.omenDeck).toHaveLength(34);
    expect(s.di!.homeIsle).toBe('');
  });
});
