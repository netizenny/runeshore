import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { legalActions, pendingPlayers } from '@runeshore/shared';
import { deleteRoom, loadRooms, saveRoom } from '../src/persist';
import { Room } from '../src/room';
import { sock } from './util';

let dir: string;
beforeEach(() => void (dir = mkdtempSync(join(tmpdir(), 'rs-'))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const nextMove = (r: Room) => {
  const who = pendingPlayers(r.game!)[0];
  return { who, i: r.seats.findIndex((s) => s.id === who), action: legalActions(r.game!, who)[0] };
};

it('round-trips a mid-game room and the restored room accepts the next action', () => {
  const room = new Room('ABC234', { save: (s) => saveRoom(s, dir) });
  const socks = ['Ann', 'Bo', 'Cy'].map((n) => {
    const s = sock();
    room.join(s, n);
    return s;
  });
  room.handle(socks[0], { t: 'start' });
  const first = nextMove(room);
  room.handle(socks[first.i], { t: 'action', action: first.action });

  const [snap] = loadRooms(dir);
  expect(snap).toEqual(JSON.parse(JSON.stringify(room.snapshot())));

  const back = Room.restore(snap);
  const next = nextMove(back);
  const s = sock();
  back.join(s, '', snap.seats[next.i].seatToken);
  back.handle(s, { t: 'action', action: next.action });
  expect(s.last('error')).toBeUndefined();
  expect(back.game!.log.length).toBeGreaterThan(snap.game!.log.length);

  deleteRoom('ABC234', dir);
  expect(existsSync(join(dir, 'ABC234.json'))).toBe(false);
  expect(loadRooms(dir)).toEqual([]);
});

it('boot skips a snapshot that cannot be restored', async () => {
  const { Rooms } = await import('../src/rooms');
  const room = new Room('GOOD22', { save: (s) => saveRoom(s, dir) });
  room.join(sock(), 'Ann');
  saveRoom({ id: 'BAD222', seats: [{ id: 'x', name: 'X', color: 'ember', seatToken: 't', autopilot: false }], settings: room.settings, game: { phase: { k: 'roll' } } as never }, dir);
  expect(new Rooms(dir).load()).toBe(1);
});

it('caps live rooms per ip', async () => {
  const { Rooms } = await import('../src/rooms');
  const rooms = new Rooms(mkdtempSync(join(tmpdir(), 'rs-cap-')));
  for (let i = 0; i < 5; i++) expect(rooms.create('1.2.3.4')).not.toBeNull();
  expect(rooms.create('1.2.3.4')).toBeNull();
  expect(rooms.create('5.6.7.8')).not.toBeNull();
});
