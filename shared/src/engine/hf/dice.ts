import type { GameEvent, GameState, PlayerId, Track } from '../../types';
import { randInt } from '../../rng';
import { produce, startSeven } from '../turn';
import type { Result } from '../setup';
import { advanceFleet } from './fleet';

const FACES: ('ship' | Track)[] = ['ship', 'ship', 'ship', 'lore', 'guild', 'crown'];

// Production, then a 7 starts its procedure. Runs after the event die, or after a Fleet choice is settled.
export function afterFleet(s: GameState, total: number): GameEvent[] {
  s.phase = { k: 'main' };
  if (total !== 7) return [{ type: 'produced', gains: produce(s, total) }];
  startSeven(s);
  return [];
}

// Yellow, red, then event die, all from rngState. Order: event die, production, then a 7.
export function rollHF(s: GameState, _id: PlayerId): Result {
  if (s.phase.k !== 'roll') return 'not time to roll';
  const hf = s.hf!;
  let y: number, r: number, e: number;
  [y, s.rngState] = randInt(s.rngState, 6);
  [r, s.rngState] = randInt(s.rngState, 6);
  [e, s.rngState] = randInt(s.rngState, 6);
  s.dice = [y + 1, r + 1];
  hf.eventDie = FACES[e];
  const total = s.dice[0] + s.dice[1];
  const events: GameEvent[] = [
    { type: 'rolled', player: s.order[s.current], dice: s.dice },
    { type: 'eventDie', face: hf.eventDie },
  ];
  s.phase = { k: 'main' };
  // H7 adds the gate draw here, before production.
  if (hf.eventDie === 'ship') events.push(...advanceFleet(s, total));
  if (s.phase.k === 'main') events.push(...afterFleet(s, total));
  return events;
}
