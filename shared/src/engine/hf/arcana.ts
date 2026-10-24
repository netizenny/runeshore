import type { Action, ArcanaArg, GameEvent, GameState, PlayerId, Track } from '../../types';
import { ARCANA_BY_KEY, ARCANA_INSTANT } from '../../constants';
import type { Result } from '../setup';
import { hfPlayer } from './state';
import { SCIENCE } from './arcana-science';
import { TRADE } from './arcana-trade';
import { POLITICS } from './arcana-politics';

export type Play = (s: GameState, id: PlayerId, arg: ArcanaArg) => Result;

const refuse: Play = () => 'that card is played the moment it is drawn';
const PLAYS: Record<string, Play> = { ...SCIENCE, ...TRADE, ...POLITICS, printer: refuse, constitution: refuse };

// Draw the top card of a stack. Glory cards go straight to the table; callers check hand room first.
export function drawArcana(s: GameState, id: PlayerId, track: Track): GameEvent[] {
  const p = hfPlayer(s, id);
  const card = s.hf!.arcanaDecks[track].shift()!;
  const events: GameEvent[] = [{ type: 'arcanaDrawn', player: id, track }];
  if (ARCANA_INSTANT.includes(card)) {
    p.extraGlory++;
    events.push({ type: 'arcanaPlayed', player: id, card });
  } else p.arcana.push(card);
  return events;
}

// Own turn, after the roll (the Fatecaster before it), no pending choice open. The card returns to the bottom of its stack.
export function playArcana(s: GameState, id: PlayerId, a: Extract<Action, { type: 'playArcana' }>): Result {
  if (!s.hf) return 'no Arcana in this mode';
  const me = hfPlayer(s, id);
  const i = me.arcana.indexOf(a.card);
  if (i < 0) return 'you do not hold that card';
  if (s.phase.k !== (a.card === 'alchemist' ? 'roll' : 'main')) return 'cannot play that card now';
  me.arcana.splice(i, 1); // an error result discards the cloned state, so no undo is needed
  const r = PLAYS[a.card](s, id, a.arg ?? {});
  if (typeof r === 'string') return r;
  s.hf.arcanaDecks[ARCANA_BY_KEY[a.card].track].push(a.card);
  return [{ type: 'arcanaPlayed', player: id, card: a.card }, ...r];
}
