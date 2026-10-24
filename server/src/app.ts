import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';
import type { ClientMsg } from '@runeshore/shared';
import { Rooms } from './rooms';
import type { Room } from './room';

const MIME: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };
const DIST = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function startServer(port: number, rooms = new Rooms()): Server {
  const serveStatic = existsSync(join(DIST, 'index.html')); // built client present: serve it
  const http = createServer((req, res) => {
    const url = (req.url ?? '/').split('?')[0];
    if (url === '/health') return void res.end('ok');
    if (serveStatic) {
      const file = normalize(join(DIST, url));
      const target = file.startsWith(DIST) && existsSync(file) && extname(file) ? file : join(DIST, 'index.html'); // SPA fallback for /r/<id>
      if (existsSync(target)) {
        res.setHeader('content-type', MIME[extname(target)] ?? 'application/octet-stream');
        return void res.end(readFileSync(target));
      }
    }
    res.statusCode = 404;
    res.end();
  });

  const wss = new WebSocketServer({ server: http, path: '/ws', maxPayload: 16 * 1024 });
  // Standard ws liveness check: ping our own clients, drop any that missed the last round, so half-open sockets (sleeping phones) free their seat.
  const alive = new WeakSet<WebSocket>();
  const beat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.has(ws)) { ws.terminate(); continue; }
      alive.delete(ws);
      ws.ping();
    }
  }, 30_000);
  beat.unref();
  wss.on('close', () => clearInterval(beat));

  wss.on('connection', (ws: WebSocket, req) => {
    let room: Room | null = null;
    alive.add(ws);
    ws.on('pong', () => alive.add(ws));
    // Behind a proxy the first X-Forwarded-For entry is the client; a client can forge it, so this is a speed bump, not a wall.
    const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.socket.remoteAddress || '';
    const err = (code: string, message: string) => ws.send(JSON.stringify({ t: 'error', code, message }));
    ws.on('message', (raw) => {
      let msg: ClientMsg;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return err('bad_msg', 'Malformed message.');
      }
      if (msg?.t === 'create' || msg?.t === 'join') {
        if (room) return err('already_joined', 'Already in a room.');
        const r = msg.t === 'create' ? rooms.create(ip) : rooms.get(String(msg.roomId));
        if (!r) return msg.t === 'create' ? err('busy', 'Too many rooms right now. Try again later.') : err('no_room', 'That room does not exist.');
        if (r.join(ws, msg.name, msg.t === 'join' ? msg.seatToken : undefined)) room = r;
        else if (msg.t === 'create') rooms.drop(r); // failed create (bad name): do not leak an empty room
      } else if (room) room.handle(ws, msg);
      else err('not_seated', 'Join a room first.');
    });
    ws.on('error', () => {}); // bad frames: ws closes the socket itself; an unhandled 'error' would kill the process
    ws.on('close', () => room?.disconnect(ws));
  });

  rooms.load();
  return http.listen(port, () => console.log(`runeshore server on :${port}`));
}

