import { describe, expect, it } from 'vitest';
import { OMEN_DECK, OMEN_NAME } from '../src';
import { BOOKS } from '../../client/src/rules/content';

describe('rulebook', () => {
  const topics = BOOKS.flatMap((b) => b.topics);
  it('has an entry for every omen kind', () => {
    for (const k of new Set(OMEN_DECK)) expect(topics.some((x) => x.section === 'Runes' && x.title === OMEN_NAME[k])).toBe(true);
  });
  it('has unique ids and covers renamed terms', () => {
    expect(new Set(topics.map((x) => x.id)).size).toBe(topics.length);
    for (const w of ['Glory', 'Outpost', 'Citadel', 'The Shade', 'Ash', 'Port', 'Warlord', 'Longest trail']) expect(topics.some((x) => x.section === 'Terms' && x.title === w)).toBe(true);
  });
});
