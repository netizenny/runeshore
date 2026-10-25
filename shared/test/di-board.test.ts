import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/create';
import { applyAction } from '../src/engine/apply';
import { legalActions } from '../src/engine/legal';
import { boardGeometry, edgeId, edgeVertices, isPathEdge, vertexEdges, vertexHexes } from '../src/board/geometry';
import { QUARTET } from '../src/board/scenarios/quartet';
import { VEILED } from '../src/board/scenarios/veiled';
import { SCENARIOS } from '../src/board/scenarios/landfall';
import { setupSpotOk } from '../src/engine/setup';
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

  it('builds 4 isles of 6 hexes, ports on land-deep edges, setup allowed anywhere but the Glimmer isle', () => {
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
    expect(isles.size).toBe(3);
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

  it('rings a 7-hex heart of Mist with four isles, keeps them off the wire, and deals the fog pool', () => {
    const s = vr();
    const mist = Object.values(s.board.hexes).filter((h) => h.terrain === 'mist');
    expect(mist).toHaveLength(7);
    expect(new Set(Object.values(s.di!.isleOf)).size).toBe(4);
    expect(Object.keys(s.di!.mist!).sort()).toEqual(mist.map((h) => h.id).sort());
    expect(Object.values(s.di!.mist!).map((m) => m.terrain).sort()).toEqual([...VEILED.fog!.terrains].sort());
    expect(Object.values(s.di!.mist!).filter((m) => m.terrain !== 'deep').map((m) => m.token).sort()).toEqual([...VEILED.fog!.tokens].sort());
    expect(Object.values(s.di!.mist!).every((m) => (m.terrain === 'deep') === (m.token === null))).toBe(true);
    expect(viewFor(s, 'a').di!.mist).toBeUndefined();
    expect(s.board.hexes[s.shadeHex].token).toBe(12);
  });

  it('a path lifts Mist at either end of its edge, not only on the edge itself', () => {
    const s = vr();
    s.phase = { k: 'main' };
    const mist = s.di!.mist!;
    const edge = [...boardGeometry(s.board).edgeSet].find((e) => !e.split('~').some((h) => mist[h]) && edgeVertices(e).some((v) => v.split('|').some((h) => mist[h])))!;
    const ev = liftMist(s, current(s), edge);
    expect(ev.length).toBeGreaterThan(0);
    expect(ev.every((e) => e.type === 'revealed' && !edge.split('~').includes(e.hex))).toBe(true);
  });

  it('a Deep reveal pays nothing and turns the hex into sea; unlifted Mist takes no outpost', () => {
    const s = vr();
    s.phase = { k: 'main' };
    const id = current(s);
    const [hex] = Object.keys(s.di!.mist!);
    const v = [...boardGeometry(s.board).vertices].find((x) => x.split('|').every((h) => [undefined, 'mist', 'deep'].includes(s.board.hexes[h]?.terrain)) && x.split('|').includes(hex))!;
    expect(setupSpotOk(s, v)).toBe(false);
    s.di!.mist![hex] = { terrain: 'deep', token: null };
    const hand = { ...s.players.find((p) => p.id === id)!.hand };
    liftMist(s, id, [...boardGeometry(s.board).edgeSet].find((e) => e.split('~').includes(hex))!);
    expect(s.board.hexes[hex]).toMatchObject({ terrain: 'deep', token: null });
    expect(s.players.find((p) => p.id === id)!.hand).toEqual(hand);
  });

  it('has no Landfall marks, wins at 12, and each isle is a start', () => {
    const s = vr();
    const id = current(s);
    const v = [...boardGeometry(s.board).vertices].find((x) => vertexHexes(x).some((h) => s.board.hexes[h].terrain === 'timber'))!;
    s.buildings[v] = { owner: id, kind: 'outpost' };
    expect(claimLandfall(s, id, v)).toEqual([]);
    expect(VEILED.target).toBe(12);
    expect(s.di!.homeIsle).toBe('');
  });

  it('a starting boat may replace the starting path', () => {
    const s = vr();
    const id = current(s);
    const v = [...boardGeometry(s.board).vertices].find((x) => vertexHexes(x).some((h) => s.board.hexes[h].terrain !== 'mist' && s.board.hexes[h].terrain !== 'deep') && vertexEdges(x).some((e) => e.split('~').some((h) => s.board.hexes[h].terrain === 'deep')))!;
    let n = applyAction(s, id, { type: 'placeOutpost', vertex: v });
    expect(n.ok).toBe(true);
    const st = (n as { state: GameState }).state;
    const boat = legalActions(st, id).find((a) => a.type === 'placeBoat');
    expect(boat).toBeTruthy();
    const r = applyAction(st, id, boat!);
    expect(r.ok).toBe(true);
    const after = (r as { state: GameState }).state;
    expect(Object.keys(after.di!.boats)).toHaveLength(1);
    expect(after.di!.boatsLeft[id]).toBe(14);
    expect(after.phase).toMatchObject({ k: 'setup', step: 'outpost' });
    expect(after.current).toBe(1);
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

describe('Drowned Isles randomization', () => {
  it.each(['landfall', 'quartet', 'veiled', 'sextet', 'veiled6'] as const)('%s deals different terrains, tokens and ports per seed', (scenario) => {
    const sig = (seed: number) => {
      const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario }, seed);
      return JSON.stringify([Object.values(s.board.hexes).map((h) => [h.terrain, h.token]), s.board.ports.map((p) => p.kind)]);
    };
    expect(new Set([1, 2, 3, 4, 5].map(sig)).size).toBeGreaterThan(1);
  });
});

describe('Official scenario rules', () => {
  it('Quartet Reach wins at 13, and keeps low tokens off timber and fleece', () => {
    expect(QUARTET.land.filter((l) => l[2] === 'glimmer')).toHaveLength(1);
    expect(QUARTET.target).toBe(13);
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario: 'quartet' }, seed);
      for (const h of Object.values(s.board.hexes)) {
        if (h.terrain === 'timber' || h.terrain === 'fleece') expect([2, 3, 11, 12]).not.toContain(h.token);
      }
    }
  });

  it.each(['landfall', 'quartet', 'veiled', 'sextet', 'veiled6'] as const)('%s keeps gold on a 6 or 8 and red numbers apart (unless allowed)', (scenario) => {
    const sc = SCENARIOS[scenario];
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario }, seed);
      const hot = Object.values(s.board.hexes).filter((h) => h.token === 6 || h.token === 8);
      for (const h of Object.values(s.board.hexes)) if (h.terrain === 'glimmer') expect(hot).toContain(h);
      for (const m of Object.values(s.di?.mist ?? {})) if (m.terrain === 'glimmer') expect([6, 8]).toContain(m.token);
      if (!sc.redAdjacent) for (const a of hot) for (const b of hot) expect(boardGeometry(s.board).edgeSet.has(edgeId(a.id, b.id)) && a !== b).toBe(false);
    }
  });

  it('Landfall keeps its desert on the home isle when shuffled', () => {
    for (const seed of [1, 2, 3, 4]) {
      const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true }, seed);
      const at = (t: string) => Object.values(s.board.hexes).filter((h) => h.terrain === t).map((h) => s.di!.isleOf[h.id]);
      expect(at('ashen')).toEqual([s.di!.homeIsle]);
    }
  });

  it('targets follow the official scenarios', () => {
    expect([SCENARIOS.landfall.target, SCENARIOS.quartet.target, SCENARIOS.veiled.target]).toEqual([14, 13, 12]);
  });
});

describe('Glimmer fields and starts', () => {
  const six = Array.from({ length: 6 }, (_, i) => ({ id: 'abcdef'[i], name: `P${i}`, color: 'ember' as const }));
  const gold = (scenario: keyof typeof SCENARIOS, outer = true) =>
    SCENARIOS[scenario].land.filter((l) => l[2] === (outer ? 'glimmer' : 'mist')).length;

  it('2-4 maps hold one Glimmer field on an outer isle, 2-6 maps two; Veiled Reach hides them in the fog', () => {
    expect([gold('landfall'), gold('quartet'), gold('sextet'), gold('veiled'), gold('veiled6')]).toEqual([1, 1, 2, 0, 0]);
    expect(SCENARIOS.veiled.fog!.terrains.filter((t) => t === 'glimmer')).toHaveLength(1);
    expect(SCENARIOS.veiled6.fog!.terrains.filter((t) => t === 'glimmer')).toHaveLength(2);
    expect(SCENARIOS.veiled6.fog!.terrains).toHaveLength(gold('veiled6', false));
  });

  it.each(['quartet', 'sextet'] as const)('%s never allows a starting outpost on a Glimmer isle', (scenario) => {
    for (const seed of [1, 2, 3]) {
      const s = createGame(six, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario }, seed);
      const goldIsles = new Set(Object.values(s.board.hexes).filter((h) => h.terrain === 'glimmer').map((h) => s.di!.isleOf[h.id]));
      expect(goldIsles.size).toBe(SCENARIOS[scenario].land.filter((l) => l[2] === 'glimmer').length);
      const spots = legalActions(s, current(s)).filter((a) => a.type === 'placeOutpost').flatMap((a) => vertexHexes((a as { vertex: string }).vertex));
      expect(spots.length).toBeGreaterThan(0);
      for (const h of spots) expect(goldIsles.has(s.di!.isleOf[h])).toBe(false);
    }
  });

  it('Greater Veiled Reach: six isles, a 13-hex heart, a sea gap, start anywhere', () => {
    const s = createGame(six, { ...DEFAULT_SETTINGS, drownedIsles: true, scenario: 'veiled6' }, 5);
    expect(Object.values(s.board.hexes).filter((h) => h.terrain === 'mist')).toHaveLength(13);
    expect(new Set(Object.values(s.di!.isleOf)).size).toBe(6);
    expect(s.board.hexes[s.shadeHex].token).toBe(12);
    expect(s.board.ports).toHaveLength(12);
    const dist = (a: number[], b: number[]) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[0] + a[1] - b[0] - b[1]));
    const mist = SCENARIOS.veiled6.land.filter((h) => h[2] === 'mist');
    for (const m of mist) for (const l of SCENARIOS.veiled6.land.filter((h) => h[2] !== 'mist')) expect(dist([m[0], m[1]], [l[0], l[1]])).toBeGreaterThan(1);
  });
});
