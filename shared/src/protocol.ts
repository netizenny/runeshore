import type { Action, GameEvent, PlayerColor, PlayerId, Settings } from './types';
import type { GameView } from './view';

export type SeatInfo = { id: PlayerId; name: string; color: PlayerColor; connected: boolean };

export type ClientMsg =
  | { t: 'create'; name: string }
  | { t: 'join'; roomId: string; name: string; seatToken?: string }
  | { t: 'settings'; settings: Partial<Settings> }
  | { t: 'start' }
  | { t: 'action'; action: Action }
  | { t: 'host'; cmd: 'autopilot' | 'remove'; player: PlayerId }
  | { t: 'pause'; on: boolean } // stop my clock while I read the rulebook or build a trade
  | { t: 'leave' };

export type ServerMsg =
  | { t: 'joined'; roomId: string; you: PlayerId; seatToken: string; host: boolean }
  | { t: 'lobby'; seats: SeatInfo[]; host: PlayerId; settings: Settings }
  | { t: 'game'; view: GameView; log?: GameEvent[]; events: GameEvent[]; legal: Action[]; deadline: number | null; waitingOn: { player: PlayerId; since: number; paused?: true }[] }
  | { t: 'error'; code: string; message: string };
