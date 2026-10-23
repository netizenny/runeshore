import { describe, expect, it } from 'vitest';
import { placePeddler } from '../src/engine/hf/peddler';
import { hfScore } from '../src/engine/hf/score';
import { tradeRatio } from '../src/engine/trade';
import { hexVertices } from '../src/board/geometry';
import { hfState } from './helpers';

describe('peddler', () => {
  const setup = () => {
    const s = hfState();
    const [a, b] = s.order;
    const hexes = Object.values(s.board.hexes).filter((h) => h.terrain !== 'ashen');
    const [h1, h2] = hexes;
    s.buildings[hexVertices(h1.id)[0]] = { owner: a, kind: 'outpost' };
    s.buildings[hexVertices(h2.id)[0]] = { owner: b, kind: 'outpost' };
    return { s, a, b, h1, h2 };
  };

  it('sits next to your building, gives 1 Renown and 2:1 on that hex resource', () => {
    const { s, a, h1 } = setup();
    const kind = h1.terrain as never;
    expect(tradeRatio(s, a, kind)).toBe(4);
    const r = placePeddler(s, a, h1.id);
    expect(typeof r).not.toBe('string');
    expect(hfScore(s, a)).toBe(1);
    expect(tradeRatio(s, a, kind)).toBe(2);
  });

  it('is refused away from your buildings, on an ashen hex, or with the mode off', () => {
    const { s, a } = setup();
    const h2 = Object.values(s.board.hexes).find((h) => h.terrain !== 'ashen' && !hexVertices(h.id).some((v) => s.buildings[v]?.owner === a))!;
    expect(placePeddler(s, a, h2.id)).toMatch(/next to your/);
    const ashen = Object.values(s.board.hexes).find((h) => h.terrain === 'ashen');
    if (ashen) expect(placePeddler(s, a, ashen.id)).toMatch(/land/);
    delete s.hf;
    expect(typeof placePeddler(s, a, h2.id)).toBe('string');
  });

  it('passes to whoever places it next', () => {
    const { s, a, b, h1, h2 } = setup();
    placePeddler(s, a, h1.id);
    placePeddler(s, b, h2.id);
    expect(s.hf!.peddler).toEqual({ hex: h2.id, owner: b });
    expect(hfScore(s, a)).toBe(0);
    expect(hfScore(s, b)).toBe(1);
  });
});
