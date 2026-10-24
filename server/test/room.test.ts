import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pendingPlayers } from '@runeshore/shared';
import { stateWith } from '../../shared/test/helpers';
import { Room } from '../src/room';
import { sock, type Sock } from './util';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// Room with n seated players; seat ids are renamed a,b,c,d so tests can use stateWith.
function lobby(n = 3, names = ['Ann', 'Bo', 'Cy', 'Di']) {
  const room = new Room('ROOM01');
  const socks: Sock[] = [];
  for (let i = 0; i < n; i++) {
    const s = sock();
    room.join(s, names[i]);
    room.seats[i].id = 'abcd'[i];
    socks.push(s);
  }
  return { room, socks };
}
const errCode = (s: Sock) => s.last('error')?.code;

describe('join rules', () => {
  it('rejects empty names, trims, cuts to 20, suffixes duplicates', () => {
    const room = new Room('R');
    const s0 = sock();
    room.join(s0, '   ');
    expect(errCode(s0)).toBe('bad_name');
    expect(room.seats).toHaveLength(0);
    room.join(sock(), '  ' + 'x'.repeat(30) + ' ');
    room.join(sock(), 'Ann');
    room.join(sock(), 'Ann');
    room.join(sock(), 'Ann');
    expect(room.seats.map((s) => s.name)).toEqual(['x'.repeat(20), 'Ann', 'Ann 2', 'Ann 3']);
    const s5 = sock();
    room.join(s5, 'Eve');
    expect(errCode(s5)).toBe('full');
  });

  it('gives colors in seat order; host passes on when they leave', () => {
    const { room, socks } = lobby(3);
    expect(room.seats.map((s) => s.color)).toEqual(['ember', 'tide', 'moss']);
    expect(socks[0].last('joined')!.host).toBe(true);
    expect(socks[1].last('joined')!.host).toBe(false);
    room.handle(socks[0], { t: 'leave' });
    expect(socks[1].last('lobby')!.host).toBe(room.seats[0].id);
    expect(room.seats[0].name).toBe('Bo');
    expect(room.seats[0].color).toBe('ember');
  });

  it('only the host starts, and only with 2-4 players', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[1], { t: 'start' });
    expect(errCode(socks[1])).toBe('not_host');
    room.handle(socks[0], { t: 'leave' });
    room.handle(socks[1], { t: 'leave' });
    room.handle(socks[2], { t: 'start' });
    expect(errCode(socks[2])).toBe('too_few');
  });

  it('validates settings', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[0], { t: 'settings', settings: { gloryTarget: 99 } });
    expect(errCode(socks[0])).toBe('bad_settings');
    room.handle(socks[0], { t: 'settings', settings: { gloryTarget: 12, turnTimerSec: 30 } });
    expect(room.settings).toMatchObject({ gloryTarget: 12, turnTimerSec: 30 });
  });

  it('drownedIsles and hollowFleet exclude each other; large map turns Isles off', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[0], { t: 'settings', settings: { hollowFleet: true } });
    room.handle(socks[0], { t: 'settings', settings: { drownedIsles: true } });
    expect(room.settings).toMatchObject({ drownedIsles: true, hollowFleet: false, gloryTarget: 14 });
    room.handle(socks[0], { t: 'settings', settings: { hollowFleet: true } });
    expect(room.settings).toMatchObject({ drownedIsles: false, hollowFleet: true, gloryTarget: 13 });
    room.handle(socks[0], { t: 'settings', settings: { drownedIsles: true, hollowFleet: false } });
    room.handle(socks[0], { t: 'settings', settings: { boardSize: 'large' } });
    expect(room.settings).toMatchObject({ drownedIsles: false, boardSize: 'large' });
  });

  it('hollowFleet toggle: host only, moves glory target 10 <-> 13, explicit target wins', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[1], { t: 'settings', settings: { hollowFleet: true } });
    expect(errCode(socks[1])).toBe('not_host');
    room.handle(socks[0], { t: 'settings', settings: { hollowFleet: true } });
    expect(room.settings).toMatchObject({ hollowFleet: true, gloryTarget: 13 });
    room.handle(socks[0], { t: 'settings', settings: { hollowFleet: false } });
    expect(room.settings).toMatchObject({ hollowFleet: false, gloryTarget: 10 });
    room.handle(socks[0], { t: 'settings', settings: { hollowFleet: true, gloryTarget: 11 } });
    expect(room.settings).toMatchObject({ hollowFleet: true, gloryTarget: 11 });
    room.handle(socks[0], { t: 'start' });
    expect(room.game!.hf).toBeDefined();
    const back = Room.restore(JSON.parse(JSON.stringify(room.snapshot())));
    expect(back.game!.hf).toEqual(room.game!.hf);
  });

  it('after start: no new seats; token holders get in; the newest socket replaces the old', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[0], { t: 'start' });
    const late = sock();
    room.join(late, 'Zed');
    expect(errCode(late)).toBe('started');

    const token = socks[1].last('joined')!.seatToken;
    const tab2 = sock();
    room.join(tab2, 'Bo', token);
    expect(tab2.last('joined')!.you).toBe('b');
    expect(errCode(socks[1])).toBe('replaced');
    expect(socks[1].closed).toBe(true);
    // the old tab is dead: its actions are ignored, and its close does not drop the new tab
    const before = tab2.msgs.length;
    room.handle(socks[1], { t: 'action', action: { type: 'endTurn' } });
    room.disconnect(socks[1]);
    expect(room.seats[1].conn).toBe(tab2);
    expect(tab2.msgs.length).toBe(before);
  });
});

describe('game flow', () => {
  it('start sends each player a private view and their own legal moves', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[0], { t: 'start' });
    for (const [i, s] of socks.entries()) {
      const g = s.last('game')!;
      expect(g.view.you).toBe('abc'[i]);
      expect(g.view.players.filter((p) => p.hand)).toHaveLength(1);
      expect(JSON.stringify(g.view)).not.toContain('rngState');
      expect(g.legal.length > 0).toBe(pendingPlayers(room.game!).includes('abc'[i]));
    }
  });

  it('second confirm of one trade gets a clean error and state stays consistent', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[0], { t: 'start' });
    const base = stateWith();
    const [cur, other] = base.order;
    const at = (id: string) => socks['abc'.indexOf(id)];
    const players = base.players.map((p) => (p.id === cur ? { ...p, hand: { ...p.hand, clay: 1 } } : p.id === other ? { ...p, hand: { ...p.hand, timber: 1 } } : p));
    room.game = { ...base, players };
    const give = { clay: 1, timber: 0, fleece: 0, harvest: 0, starmetal: 0 };
    const get = { ...give, clay: 0, timber: 1 };
    room.handle(at(cur), { t: 'action', action: { type: 'offerTrade', give, get, to: 'all' } });
    const offerId = room.game.offers[0].id;
    room.handle(at(other), { t: 'action', action: { type: 'respondTrade', offerId, accept: true } });
    room.handle(at(cur), { t: 'action', action: { type: 'confirmTrade', offerId, partner: other } });
    const after = JSON.stringify(room.game);
    room.handle(at(cur), { t: 'action', action: { type: 'confirmTrade', offerId, partner: other } });
    expect(at(cur).last('error')).toMatchObject({ code: 'illegal', message: 'offer gone' });
    expect(JSON.stringify(room.game)).toBe(after);
  });

  it('garbage actions are rejected without crashing', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[0], { t: 'start' });
    room.handle(socks[0], { t: 'action', action: { type: 'placeOutpost' } as never });
    expect(socks[0].last('error')).toBeDefined();
    room.handle(socks[1], { t: 'action', action: null as never });
    expect(errCode(socks[1])).toBe('bad_msg');
  });

  it('turn timer expiry plays the autopilot until that player is no longer pending', () => {
    const { room, socks } = lobby(3);
    room.handle(socks[0], { t: 'settings', settings: { turnTimerSec: 30 } });
    room.handle(socks[0], { t: 'start' });
    const first = room.game!.order[0];
    expect(socks[0].last('game')!.deadline).toBe(Date.now() + 30_000);
    vi.advanceTimersByTime(30_000);
    expect(room.game!.log.some((e) => e.type === 'autoActed')).toBe(true);
    expect(pendingPlayers(room.game!)).not.toContain(first);
    expect(Object.keys(room.game!.buildings).length).toBeGreaterThan(0);
  });
});

describe('disconnects and host commands', () => {
  function started() {
    const { room, socks } = lobby(3);
    room.handle(socks[0], { t: 'start' });
    room.disconnect(socks[2]);
    return { room, socks };
  }

  it('host cannot act on a connected player', () => {
    const { room, socks } = started();
    room.handle(socks[0], { t: 'host', cmd: 'autopilot', player: 'b' });
    expect(errCode(socks[0])).toBe('bad_target');
  });

  it('too_soon before 120 s, works after', () => {
    const { room, socks } = started();
    room.handle(socks[0], { t: 'host', cmd: 'autopilot', player: 'c' });
    expect(errCode(socks[0])).toBe('too_soon');
    vi.advanceTimersByTime(119_000);
    room.handle(socks[0], { t: 'host', cmd: 'autopilot', player: 'c' });
    expect(errCode(socks[0])).toBe('too_soon');
    vi.advanceTimersByTime(1_000);
    room.handle(socks[0], { t: 'host', cmd: 'autopilot', player: 'c' });
    expect(room.seats[2].autopilot).toBe(true);
    expect(pendingPlayers(room.game!)).not.toContain('c');
  });

  it('autopilot ends on reconnect; remove is permanent and returns the hand to the bank', () => {
    const { room, socks } = started();
    vi.advanceTimersByTime(120_000);
    room.handle(socks[0], { t: 'host', cmd: 'autopilot', player: 'c' });
    const back = sock();
    room.join(back, 'Cy', socks[2].last('joined')!.seatToken);
    expect(room.seats[2].autopilot).toBe(false);

    room.disconnect(back);
    vi.advanceTimersByTime(120_000);
    const g = room.game!;
    room.game = { ...g, players: g.players.map((p) => (p.id === 'c' ? { ...p, hand: { ...p.hand, clay: p.hand.clay + 2 } } : p)), bank: { ...g.bank, clay: g.bank.clay - 2 } };
    room.handle(socks[0], { t: 'host', cmd: 'remove', player: 'c' });
    const after = room.game!;
    expect(after.players.find((p) => p.id === 'c')!.hand.clay).toBe(0);
    expect(after.bank.clay + after.players.reduce((n, p) => n + p.hand.clay, 0)).toBe(19);
    const ghost = sock();
    room.join(ghost, 'Cy', socks[2].last('joined')!.seatToken);
    expect(room.seats[2].conn).toBeNull();
  });

  it('expires 10 minutes after the last socket leaves', () => {
    const onExpire = vi.fn();
    const room = new Room('R', { onExpire });
    const s = sock();
    room.join(s, 'Ann');
    room.disconnect(s);
    vi.advanceTimersByTime(9 * 60_000);
    expect(onExpire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(onExpire).toHaveBeenCalledWith(room);
  });
});

describe('log delivery and lobby expiry', () => {
  it('sends the full log once per connection, then only events', () => {
    const { room, socks } = lobby(2);
    room.handle(socks[0], { t: 'start' });
    expect(socks[0].last('game')!.log).toBeDefined();
    room.disconnect(socks[1]); // triggers another broadcast to the host
    expect(socks[0].last('game')!.log).toBeUndefined();
    const back = sock();
    room.join(back, 'Bo', socks[1].last('joined')!.seatToken);
    expect(back.last('game')!.log).toBeDefined(); // a new connection gets the full log
  });

  it('drops a lobby that never starts, even with a socket attached', () => {
    const onExpire = vi.fn();
    const room = new Room('R', { onExpire });
    room.join(sock(), 'Ann');
    vi.advanceTimersByTime(30 * 60_000);
    expect(onExpire).toHaveBeenCalledWith(room);
  });
});
