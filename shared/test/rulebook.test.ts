import { describe, expect, it } from 'vitest';
import { OMEN_DECK } from '../src';
import { BOOKS } from '../../client/src/rules/content';

describe('rulebook', () => {
  const topics = BOOKS.flatMap((b) => b.topics);
  it('has an entry for every omen kind', () => {
    for (const k of new Set(OMEN_DECK)) expect(topics.some((x) => x.section === 'Omens' && x.title.toLowerCase() === k)).toBe(true);
  });
  it('has unique ids and covers renamed terms', () => {
    expect(new Set(topics.map((x) => x.id)).size).toBe(topics.length);
    for (const w of ['Renown', 'Outpost', 'Citadel', 'The Shade', 'Ashen waste', 'Port']) expect(topics.some((x) => x.section === 'Terms' && x.title === w)).toBe(true);
  });
});
