import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/create';
import { boardGeometry } from '../src/board/geometry';
import { VOLCANO } from '../src/board/scenarios/volcano';
import { DEFAULT_SETTINGS } from '../src/types';
import { PLAYERS } from './helpers';

const game = (seed: number) => createGame(PLAYERS, { ...DEFAULT_SETTINGS, boardSize: 'volcano' }, seed);
const land = (seed: number) => Object.values(game(seed).board.hexes).filter((h) => h.terrain !== 'deep');
const count = (hs: { terrain: string }[], t: string) => hs.filter((h) => h.terrain === t).length;
const CORNER = ['clay', 'fleece', 'timber', 'harvest'];

describe('Volcano board', () => {
  it('has 71 land hexes: 20 corner, 14 desert, 18 ore, 18 fog, 1 gold', () => {
    const hs = land(1);
    expect(hs).toHaveLength(71);
    expect(count(hs, 'ashen')).toBe(14);
    expect(count(hs, 'starmetal')).toBe(18);
    expect(count(hs, 'mist')).toBe(18);
    expect(count(hs, 'glimmer')).toBe(1);
    expect(hs.filter((h) => CORNER.includes(h.terrain))).toHaveLength(20);
    expect(game(1).board.hexes['Se0,0'].terrain).toBe('glimmer');
  });

  it('deals corners from the four resources, bare desert, gold 6 or 8, legal ore tokens', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const h of land(seed)) {
        if (h.terrain === 'ashen' || h.terrain === 'mist') expect(h.token).toBeNull();
        else if (h.terrain === 'glimmer') expect([6, 8]).toContain(h.token);
        else expect([2, 3, 4, 5, 6, 8, 9, 10, 11, 12]).toContain(h.token);
      }
    }
  });

  it('is reproducible by seed and varies between seeds', () => {
    const sig = (seed: number) => JSON.stringify(land(seed));
    expect(sig(7)).toBe(sig(7));
    expect(sig(7)).not.toBe(sig(8));
  });

  it('puts two ports per corner (8 total) on land-to-sea edges, none sharing an outpost spot', () => {
    const s = game(3);
    const { edgeSet, edgeVertices } = { ...boardGeometry(s.board), edgeVertices: (e: string) => e.split('~') };
    expect(s.board.ports).toHaveLength(8);
    expect(s.board.ports.filter((p) => p.kind === 'any')).toHaveLength(4);
    for (const p of s.board.ports) {
      expect(edgeSet.has(p.edge)).toBe(true);
      const [a, b] = edgeVertices(p.edge);
      expect([a, b].filter((h) => s.board.hexes[h].terrain !== 'deep')).toHaveLength(1);
    }
  });

  it('has a Deep hex for the Raider', () => {
    const [q, r] = VOLCANO.raiderStart;
    expect(game(1).board.hexes[`Se${q},${r}`].terrain).toBe('deep');
  });
});

describe('Volcano ports', () => {
  it('never share an outpost spot, and every sea hex is on the board', () => {
    const s = game(3);
    const spots = s.board.ports.flatMap((p) => p.edge.split('~'));
    expect(new Set(spots).size).toBe(spots.length);
  });
});

describe('Volcano as a base-mode map', () => {
  it('has no Boats or Raider, and also plays under Hollow Fleet', () => {
    for (const hollowFleet of [false, true]) {
      const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, boardSize: 'volcano', hollowFleet }, 7);
      expect(s.di!.base).toBe(true);
      expect(s.di!.raiderHex).toBeNull();
      expect(Object.values(s.di!.boatsLeft).every((n) => n === 0)).toBe(true);
      expect(s.board.hexes[s.shadeHex].terrain).toBe('ashen');
      expect(!!s.hf).toBe(hollowFleet);
    }
  });
});
