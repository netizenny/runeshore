import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, expect, it } from 'vitest';
import WebSocket from 'ws';
import type { ClientMsg, ServerMsg } from '@runeshore/shared';
import { startServer } from '../src/app';
import { Rooms } from '../src/rooms';

const dir = mkdtempSync(join(tmpdir(), 'rs-ws-'));
let server: Server;
afterAll(() => {
  server?.close();
  rmSync(dir, { recursive: true, force: true });
});

function client(port: number) {
  const ws = new WebSocket(`ws://localhost:${port}/ws`);
  const msgs: ServerMsg[] = [];
  const waiters: (() => void)[] = [];
  ws.on('message', (d) => {
    msgs.push(JSON.parse(String(d)));
    waiters.splice(0).forEach((w) => w());
  });
  const open = new Promise<void>((r) => ws.on('open', () => r()));
  return {
    ws,
    send: async (m: ClientMsg) => {
      await open;
      ws.send(JSON.stringify(m));
    },
    // Resolves with the first unconsumed message of type t.
    async next<T extends ServerMsg['t']>(t: T): Promise<Extract<ServerMsg, { t: T }>> {
      for (;;) {
        const i = msgs.findIndex((m) => m.t === t);
        if (i >= 0) return msgs.splice(i, 1)[0] as never;
        await new Promise<void>((r) => waiters.push(r));
      }
    },
  };
}

it('3 clients create, join, start, and see only their own hand', async () => {
  server = startServer(0, new Rooms(dir));
  await new Promise((r) => server.once('listening', r));
  const port = (server.address() as AddressInfo).port;

  const [a, b, c] = [client(port), client(port), client(port)];
  await a.send({ t: 'create', name: 'Ann' });
  const { roomId } = await a.next('joined');
  await b.send({ t: 'join', roomId, name: 'Bo' });
  await c.send({ t: 'join', roomId, name: 'Cy' });
  const joined = [await b.next('joined'), await c.next('joined')];
  expect(joined.every((j) => j.seatToken.length === 32)).toBe(true);

  await a.send({ t: 'start' });
  for (const [i, who] of [a, b, c].entries()) {
    const { view } = await who.next('game');
    expect(view.players).toHaveLength(3);
    expect(view.players.filter((p) => p.hand)).toHaveLength(1);
    expect(view.players.find((p) => p.id === view.you)!.name).toBe(['Ann', 'Bo', 'Cy'][i]);
  }

  const lost = client(port);
  await lost.send({ t: 'join', roomId: 'NOPE42', name: 'X' });
  expect((await lost.next('error')).code).toBe('no_room');
  [a, b, c, lost].forEach((x) => x.ws.close());
});

it('failed create leaves no room; failed join can be retried', async () => {
  const rooms = new Rooms(mkdtempSync(join(tmpdir(), 'rs-ws2-')));
  server.close();
  server = startServer(0, rooms);
  await new Promise((r) => server.once('listening', r));
  const port = (server.address() as AddressInfo).port;

  const a = client(port);
  await a.send({ t: 'create', name: '  ' });
  expect((await a.next('error')).code).toBe('bad_name');
  expect((rooms as unknown as { rooms: Map<string, unknown> }).rooms.size).toBe(0);

  await a.send({ t: 'create', name: 'Ann' });
  const { roomId } = await a.next('joined');
  const b = client(port);
  await b.send({ t: 'join', roomId, name: ' ' });
  expect((await b.next('error')).code).toBe('bad_name');
  await b.send({ t: 'join', roomId, name: 'Bo' });
  await b.next('joined');
});

it('survives an invalid text frame', async () => {
  server.close();
  server = startServer(0, new Rooms(mkdtempSync(join(tmpdir(), 'rs-ws3-'))));
  await new Promise((r) => server.once('listening', r));
  const port = (server.address() as AddressInfo).port;
  const bad = new WebSocket(`ws://localhost:${port}/ws`);
  await new Promise((r) => bad.on('open', r));
  bad.on('error', () => {});
  bad.send(Buffer.from([0xff, 0xfe]), { binary: false });
  await new Promise((r) => bad.on('close', r));
  const a = client(port);
  await a.send({ t: 'create', name: 'Ann' });
  await a.next('joined');
});
