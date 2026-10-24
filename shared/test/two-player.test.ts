import { describe, expect, it } from 'vitest';
import { drive, newGame } from './drive';

describe('2-player games', () => {
  for (const hollowFleet of [false, true]) {
    it(`plays hollowFleet=${hollowFleet} without throwing`, () => {
      const { steps } = drive(newGame(5, 2, { hollowFleet }), 5, 3000);
      expect(steps).toBeGreaterThan(50);
    });
  }
});
