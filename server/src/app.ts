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
  const serveStatic = process.env.NODE_ENV === 'production';
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

  const wss = new WebSocketServer({ server: http, path: '/ws' });
  wss.on('connection', (ws: WebSocket) => {
    let room: Room | null = null;
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
        const r = msg.t === 'create' ? rooms.create() : rooms.get(String(msg.roomId));
        if (!r) return err('no_room', 'That room does not exist.');
        if (r.join(ws, msg.name, msg.t === 'join' ? msg.seatToken : undefined)) room = r;
        else if (msg.t === 'create') rooms.drop(r); // failed create (bad name): do not leak an empty room
      } else if (room) room.handle(ws, msg);
      else err('not_seated', 'Join a room first.');
    });
    ws.on('close', () => room?.disconnect(ws));
  });

  rooms.load();
  return http.listen(port, () => console.log(`runeshore server on :${port}`));
}

