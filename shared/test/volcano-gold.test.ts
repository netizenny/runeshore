import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { createGame } from '../src/engine/create';
import { hexVertices } from '../src/board/geometry';
import { SCENARIOS } from '../src/board/scenarios/landfall';
import { DEFAULT_SETTINGS } from '../src/types';
import { PLAYERS } from './helpers';

const volcano = { ...DEFAULT_SETTINGS, boardSize: 'volcano' as const };

describe('Volcano lobby target and gold', () => {
  it('default target is 10 and the lobby target reaches the game', () => {
    expect(SCENARIOS.volcano.target).toBe(10);
    expect(createGame(PLAYERS, { ...volcano, gloryTarget: 12 }, 1).settings.gloryTarget).toBe(12);
  });

  it('gold is a plain Glimmer field: a roll of its token pays one pick, no bonus', () => {
    const base = createGame(PLAYERS, volcano, 4);
    const gold = Object.values(base.board.hexes).find((h) => h.terrain === 'glimmer')!;
    expect([6, 8]).toContain(gold.token);
    const who = base.order[0];
    for (let rng = 1; rng < 500; rng++) {
      const s = structuredClone(base);
      s.phase = { k: 'roll' };
      s.turn = 1;
      s.rngState = rng;
      s.buildings[hexVertices(gold.id)[0]] = { owner: who, kind: 'outpost' };
      const rolled = applyAction(s, who, { type: 'roll' });
      if (!rolled.ok || rolled.state.dice![0] + rolled.state.dice![1] !== gold.token) continue;
      expect(rolled.state.phase).toEqual({ k: 'glimmer', pending: { [who]: 1 } });
      const r = applyAction(rolled.state, who, { type: 'chooseGlimmer', cards: { clay: 0, fleece: 0, timber: 0, harvest: 0, starmetal: 1 } });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.state.players.find((p) => p.id === who)!.hand.starmetal).toBeGreaterThanOrEqual(1);
      return;
    }
    throw new Error('no rng rolled the gold token');
  });
});
