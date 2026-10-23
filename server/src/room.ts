import { randomBytes, randomInt } from 'node:crypto';
import {
  DEFAULT_SETTINGS,
  applyAction,
  autoAct,
  createGame,
  eventFor,
  legalActions,
  pendingPlayers,
  viewFor,
  type ClientMsg,
  type GameEvent,
  type GameState,
  type PlayerColor,
  type PlayerId,
  type ServerMsg,
  type Settings,
} from '@runeshore/shared';
import type { RoomSnapshot } from './persist';

export type Conn = { send(data: string): void; close(): void };
export type RoomOpts = { save?: (snap: RoomSnapshot) => void; onExpire?: (room: Room) => void };

type Seat = { id: PlayerId; name: string; color: PlayerColor; seatToken: string; autopilot: boolean; conn: Conn | null; offlineSince: number };

const COLORS: PlayerColor[] = ['ember', 'tide', 'moss', 'bone'];
const IDLE_MS = 10 * 60_000;
const HOST_WAIT_MS = 120_000;
const MAX_SEATS = 4;

const bad = (code: string, message: string): ServerMsg => ({ t: 'error', code, message });

export class Room {
  seats: Seat[] = [];
  settings: Settings = { ...DEFAULT_SETTINGS };
  game: GameState | null = null;
  private bySocket = new Map<Conn, Seat>();
  private pendingSince = new Map<PlayerId, number>();
  private timers = new Map<PlayerId, ReturnType<typeof setTimeout>>();
  private idle: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly id: string, private opts: RoomOpts = {}) {
    this.armIdle();
  }

  static restore(snap: RoomSnapshot, opts: RoomOpts = {}): Room {
    const r = new Room(snap.id, opts);
    r.settings = snap.settings;
    r.game = snap.game;
    r.seats = snap.seats.map((s) => ({ ...s, conn: null, offlineSince: Date.now() }));
    r.settle([]);
    return r;
  }

  snapshot(): RoomSnapshot {
    return {
      id: this.id,
      seats: this.seats.map(({ conn: _c, offlineSince: _o, ...s }) => s),
      host: this.seats[0]?.id ?? '',
      settings: this.settings,
      game: this.game,
    };
  }

  // ---- connections ----

  // Returns whether conn got a seat.
  join(conn: Conn, rawName: string, token?: string): boolean {
    const back = token ? this.seats.find((s) => s.seatToken && s.seatToken === token) : undefined;
    let seat = back;
    if (back) {
      if (back.conn && back.conn !== conn) {
        const old = back.conn;
        this.bySocket.delete(old);
        this.put(old, bad('replaced', 'This seat was taken by another tab.'));
        old.close();
      }
      back.autopilot = false;
    } else {
      if (this.game) return this.put(conn, bad('started', 'This game already began.')), false;
      if (this.seats.length >= MAX_SEATS) return this.put(conn, bad('full', 'This room is full.')), false;
      const base = String(rawName ?? '').trim().slice(0, 20);
      if (!base) return this.put(conn, bad('bad_name', 'Pick a name first.')), false;
      let name = base;
      for (let n = 2; this.seats.some((s) => s.name === name); n++) name = `${base} ${n}`;
      seat = {
        id: randomBytes(4).toString('hex'),
        name,
        color: COLORS[this.seats.length],
        seatToken: randomBytes(16).toString('hex'),
        autopilot: false,
        conn: null,
        offlineSince: 0,
      };
      this.seats.push(seat);
    }
    seat!.conn = conn;
    this.bySocket.set(conn, seat!);
    this.clearIdle();
    this.put(conn, { t: 'joined', roomId: this.id, you: seat!.id, seatToken: seat!.seatToken, host: this.seats[0] === seat });
    this.changed();
    return true;
  }

  disconnect(conn: Conn): void {
    const seat = this.bySocket.get(conn);
    this.bySocket.delete(conn);
    if (!seat || seat.conn !== conn) return;
    seat.conn = null;
    seat.offlineSince = Date.now();
    if (!this.bySocket.size) this.armIdle();
    this.changed();
  }

  handle(conn: Conn, msg: ClientMsg): void {
    const seat = this.bySocket.get(conn);
    if (!seat) return this.put(conn, bad('not_seated', 'Join the room first.'));
    try {
      switch (msg.t) {
        case 'leave':
          return this.leave(conn, seat);
        case 'settings':
          return this.setSettings(conn, seat, msg.settings);
        case 'start':
          return this.start(conn, seat);
        case 'action':
          return this.act(conn, seat, msg.action);
        case 'host':
          return this.hostCmd(conn, seat, msg.cmd, msg.player);
        default:
          return this.put(conn, bad('bad_msg', 'Unknown message.'));
      }
    } catch (e) {
      console.error(e);
      this.put(conn, bad('illegal', 'That did not work.'));
    }
  }

  // ---- commands ----

  private leave(conn: Conn, seat: Seat) {
    if (this.game) return this.disconnect(conn);
    this.bySocket.delete(conn);
    this.seats = this.seats.filter((s) => s !== seat);
    this.seats.forEach((s, i) => (s.color = COLORS[i])); // colors follow seat order
    if (!this.bySocket.size) this.armIdle();
    this.changed();
  }

  private setSettings(conn: Conn, seat: Seat, p: Partial<Settings>) {
    if (this.game || seat !== this.seats[0]) return this.put(conn, bad('not_host', 'Only the host can change settings in the lobby.'));
    const next = { ...this.settings, ...p };
    const ok =
      ['random', 'starter'].includes(next.boardMode) &&
      Number.isInteger(next.renownTarget) && next.renownTarget >= 7 && next.renownTarget <= 15 &&
      Number.isInteger(next.discardLimit) && next.discardLimit >= 7 && next.discardLimit <= 10 &&
      [15, 30, 45].includes(next.turnTimerSec);
    if (!ok) return this.put(conn, bad('bad_settings', 'Those settings are out of range.'));
    this.settings = { boardMode: next.boardMode, renownTarget: next.renownTarget, discardLimit: next.discardLimit, turnTimerSec: next.turnTimerSec };
    this.changed();
  }

  private start(conn: Conn, seat: Seat) {
    if (this.game || seat !== this.seats[0]) return this.put(conn, bad('not_host', 'Only the host can begin.'));
    if (this.seats.length < 3) return this.put(conn, bad('too_few', 'Need at least 3 players.'));
    const players = this.seats.map(({ id, name, color }) => ({ id, name, color }));
    this.game = createGame(players, this.settings, randomInt(1, 2 ** 31));
    this.settle([]);
  }

  // Strictly synchronous from check to apply: that is the per-room action queue.
  private act(conn: Conn, seat: Seat, action: unknown) {
    if (!this.game) return this.put(conn, bad('not_started', 'The game has not begun.'));
    if (typeof (action as { type?: unknown })?.type !== 'string') return this.put(conn, bad('bad_msg', 'Malformed action.'));
    const r = applyAction(this.game, seat.id, action as never);
    if (!r.ok) return this.put(conn, bad('illegal', r.error));
    this.game = r.state;
    this.settle([...r.events]);
  }

  private hostCmd(conn: Conn, seat: Seat, cmd: string, target: PlayerId) {
    const t = this.seats.find((s) => s.id === target);
    if (seat !== this.seats[0] || !this.game) return this.put(conn, bad('not_host', 'Only the host can do that during a game.'));
    if (!t || t.conn) return this.put(conn, bad('bad_target', 'That player is still connected.'));
    if (Date.now() - t.offlineSince < HOST_WAIT_MS) return this.put(conn, bad('too_soon', 'Wait 2 minutes after they disconnect.'));
    if (cmd !== 'autopilot' && cmd !== 'remove') return this.put(conn, bad('bad_msg', 'Unknown command.'));
    t.autopilot = true;
    if (cmd === 'remove') t.seatToken = ''; // no token can match, so the seat is gone for good
    const events: GameEvent[] = [];
    this.sync(events);
    if (cmd === 'remove') {
      // Hand goes back to the bank once any pending duty of theirs is played out.
      const g = structuredClone(this.game);
      const p = g.players.find((x) => x.id === t.id)!;
      for (const k of Object.keys(p.hand) as (keyof typeof p.hand)[]) {
        g.bank[k] += p.hand[k];
        p.hand[k] = 0;
      }
      this.game = g;
    }
    this.broadcast(events);
    this.save();
  }

  // ---- timers and autopilot ----

  // Reconciles who is pending: stamps new ones, clears old ones, arms timers, runs autopilot seats.
  private sync(events: GameEvent[]) {
    if (!this.game) return;
    for (let guard = 0; guard < 200; guard++) {
      const pending = pendingPlayers(this.game);
      for (const id of [...this.pendingSince.keys()]) {
        if (!pending.includes(id)) this.drop(id);
      }
      for (const id of pending) {
        if (this.pendingSince.has(id)) continue;
        this.pendingSince.set(id, Date.now());
        if (this.settings.turnTimerSec > 0) {
          this.timers.set(id, setTimeout(() => this.expire(id), this.settings.turnTimerSec * 1000));
        }
      }
      const auto = pending.find((id) => this.seats.find((s) => s.id === id)?.autopilot);
      if (!auto || !this.step(auto, events)) return;
    }
  }

  private settle(events: GameEvent[]) {
    this.sync(events);
    this.broadcast(events);
    this.save();
  }

  private step(id: PlayerId, events: GameEvent[]): boolean {
    const r = autoAct(this.game!, id);
    if (!r.ok) return false;
    this.game = r.state;
    events.push(...r.events);
    return true;
  }

  private expire(id: PlayerId) {
    this.timers.delete(id);
    const events: GameEvent[] = [];
    while (this.game && pendingPlayers(this.game).includes(id) && this.step(id, events));
    this.settle(events);
  }

  private drop(id: PlayerId) {
    this.pendingSince.delete(id);
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  }

  private armIdle() {
    this.clearIdle();
    this.idle = setTimeout(() => this.opts.onExpire?.(this), IDLE_MS);
    this.idle.unref?.();
  }

  private clearIdle() {
    if (this.idle) clearTimeout(this.idle);
    this.idle = null;
  }

  // Stops all timers; used when the room is deleted.
  dispose() {
    this.clearIdle();
    for (const id of [...this.pendingSince.keys()]) this.drop(id);
  }

  // ---- output ----

  private put(conn: Conn, msg: ServerMsg) {
    try {
      conn.send(JSON.stringify(msg));
    } catch {
      /* socket already gone */
    }
  }

  private save() {
    // A disk hiccup (e.g. a sync tool locking the file) must not fail the move; the next change saves again.
    try {
      this.opts.save?.(this.snapshot());
    } catch (e) {
      console.error('snapshot save failed', e);
    }
  }

  private changed() {
    if (this.game) this.broadcast([]);
    else this.lobby();
    this.save();
  }

  private lobby() {
    const msg: ServerMsg = {
      t: 'lobby',
      seats: this.seats.map((s) => ({ id: s.id, name: s.name, color: s.color, connected: !!s.conn })),
      host: this.seats[0]?.id ?? '',
      settings: this.settings,
    };
    for (const s of this.seats) if (s.conn) this.put(s.conn, msg);
  }

  private broadcast(events: GameEvent[]) {
    const g = this.game!;
    const waitingOn = [...this.pendingSince].map(([player, since]) => ({ player, since }));
    const deadline = this.settings.turnTimerSec > 0 && waitingOn.length ? Math.min(...waitingOn.map((w) => w.since)) + this.settings.turnTimerSec * 1000 : null;
    for (const s of this.seats) {
      if (!s.conn) continue;
      this.put(s.conn, { t: 'game', view: viewFor(g, s.id), events: events.map((e) => eventFor(e, s.id)), legal: legalActions(g, s.id), deadline, waitingOn });
    }
  }
}
