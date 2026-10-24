import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/create';
import { applyAction } from '../src/engine/apply';
import { legalActions, pendingPlayers, autoAct } from '../src/engine/legal';
import { hexVertices, vertexEdges, edgeVertices } from '../src/board/geometry';
import { RESOURCES } from '../src/constants';
import { DEFAULT_SETTINGS, type Action, type GameState } from '../src/types';
import { PLAYERS } from './helpers';

function game(): GameState {
  const s = createGame(PLAYERS, { ...DEFAULT_SETTINGS, drownedIsles: true }, 5);
  s.phase = { k: 'main' };
  s.turn = 3;
  s.current = s.order.indexOf('a');
  return s;
}
const ok = (r: ReturnType<typeof applyAction>) => {
  expect(r.ok).toBe(true);
  return (r as { ok: true; state: GameState }).state;
};
const hexOf = (s: GameState, terrain: string) => Object.values(s.board.hexes).filter((h) => h.terrain === terrain);
const total = (c: Record<string, number>) => Object.values(c).reduce((n, x) => n + x, 0);

describe('Raider', () => {
  // A deep hex with a boat edge owned by 'b' (with a card in hand) on it.
  function raided() {
    const s = game();
    const hex = hexOf(s, 'deep').find((h) => hexVertices(h.id).length)!.id;
    const edge = [...new Set(hexVertices(hex).flatMap(vertexEdges))].find((e) => e.split('~').includes(hex))!;
    s.di!.boats[edge] = 'b';
    s.players.find((p) => p.id === 'b')!.hand.clay = 2;
    s.phase = { k: 'moveShade', then: 'main' };
    return { s, hex, edge };
  }

  it('moves to deep hexes only, steals from a boat owner, and starts off-board', () => {
    const { s, hex } = raided();
    expect(s.di!.raiderHex).toBeNull();
    const land = hexOf(s, 'timber')[0].id;
    expect(applyAction(s, 'a', { type: 'moveShade', hex: land, raider: true }).ok).toBe(false);
    const n = ok(applyAction(s, 'a', { type: 'moveShade', hex, raider: true }));
    expect(n.di!.raiderHex).toBe(hex);
    expect(n.shadeHex).toBe(s.shadeHex);
    expect(n.log.some((e) => e.type === 'raiderMoved')).toBe(true);
    expect(n.log.some((e) => e.type === 'stole' && e.victim === 'b')).toBe(true);
    expect(n.phase.k).toBe('main');
    expect(applyAction(n, 'a', { type: 'moveShade', hex, raider: true }).ok).toBe(false);
  });

  it('is offered as a legal alternative to the Shade', () => {
    const { s } = raided();
    const moves = legalActions(s, 'a').filter((a) => a.type === 'moveShade') as Extract<Action, { type: 'moveShade' }>[];
    expect(moves.some((m) => m.raider)).toBe(true);
    expect(moves.some((m) => !m.raider)).toBe(true);
  });

  it('is refused when the expansion is off', () => {
    const s = createGame(PLAYERS, DEFAULT_SETTINGS, 1);
    s.phase = { k: 'moveShade', then: 'main' };
    const h = Object.values(s.board.hexes)[1].id;
    expect(applyAction(s, s.order[s.current], { type: 'moveShade', hex: h, raider: true }).ok).toBe(false);
  });

  it('blocks building and moving boats on its edges, not production', () => {
    const { s, hex, edge } = raided();
    s.di!.raiderHex = hex;
    s.phase = { k: 'main' };
    s.buildings[edgeVertices(edge)[0]] = { owner: 'b', kind: 'outpost' };
    for (const r of RESOURCES) s.players.find((p) => p.id === 'b')!.hand[r] = 5;
    s.current = s.order.indexOf('b');
    const b = legalActions(s, 'b');
    expect(b.some((a) => a.type === 'moveBoat' && a.from === edge)).toBe(false);
    expect(b.some((a) => a.type === 'buildBoat' && a.edge.split('~').includes(hex))).toBe(false);
    s.di!.raiderHex = null;
    s.turn += 2;
    expect(legalActions(s, 'b').some((a) => a.type === 'buildBoat')).toBe(true);
  });
});

describe('Glimmer', () => {
  function glimmered(kind: 'outpost' | 'citadel' = 'outpost') {
    const s = game();
    s.phase = { k: 'roll' };
    const hex = hexOf(s, 'glimmer')[0];
    s.buildings[hexVertices(hex.id)[0]] = { owner: 'a', kind };
    return { s, hex };
  }
  const rollTo = (s: GameState, token: number) => {
    // Find a seed so the roll lands on `token`.
    for (let seed = 1; seed < 5000; seed++) {
      const t = { ...s, rngState: seed };
      const r = applyAction(t, 'a', { type: 'roll' });
      if (r.ok && r.state.dice![0] + r.state.dice![1] === token) return r.state;
    }
    throw new Error('no seed');
  };

  it('pays picks of any resource, 1 per outpost and 2 per citadel', () => {
    for (const [kind, n] of [['outpost', 1], ['citadel', 2]] as const) {
      const { s, hex } = glimmered(kind);
      const g = rollTo(s, hex.token!);
      expect(g.phase).toEqual({ k: 'glimmer', pending: { a: n } });
      expect(pendingPlayers(g)).toEqual(['a']);
      const cards = { clay: 0, timber: 0, fleece: 0, harvest: 0, starmetal: 0 };
      cards.starmetal = n;
      expect(applyAction(g, 'a', { type: 'chooseGlimmer', cards: { ...cards, starmetal: n + 1 } }).ok).toBe(false);
      const done = ok(applyAction(g, 'a', { type: 'chooseGlimmer', cards }));
      expect(done.players.find((p) => p.id === 'a')!.hand.starmetal).toBe(n);
      expect(done.bank.starmetal).toBe(g.bank.starmetal - n);
      expect(done.phase.k).toBe('main');
    }
  });

  it('a short vault trims the pick; an empty vault skips it', () => {
    const { s, hex } = glimmered('citadel');
    for (const r of RESOURCES) s.bank[r] = 0;
    s.bank.clay = 1;
    const g = rollTo(s, hex.token!);
    expect(g.phase).toEqual({ k: 'glimmer', pending: { a: 1 } });
    expect(legalActions(g, 'a').every((a) => a.type === 'chooseGlimmer' && total(a.cards) === 1)).toBe(true);
    for (const r of RESOURCES) s.bank[r] = 0;
    expect(rollTo(s, hex.token!).phase.k).toBe('main');
  });

  it('the Shade blocks it, and autoAct picks for a timeout', () => {
    const { s, hex } = glimmered();
    const blocked = { ...s, shadeHex: hex.id };
    expect(rollTo(blocked, hex.token!).phase.k).toBe('main');
    const g = rollTo(s, hex.token!);
    const r = autoAct(g, 'a');
    expect(r.ok && r.state.phase.k).toBe('main');
  });
});
