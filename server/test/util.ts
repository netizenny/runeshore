import type { ServerMsg } from '@runeshore/shared';
import type { Conn } from '../src/room';

export type Sock = Conn & { msgs: ServerMsg[]; closed: boolean; last<T extends ServerMsg['t']>(t: T): Extract<ServerMsg, { t: T }> | undefined };

export function sock(): Sock {
  const s: Sock = {
    msgs: [],
    closed: false,
    send: (d) => void s.msgs.push(JSON.parse(d)),
    close: () => void (s.closed = true),
    last: (t) => [...s.msgs].reverse().find((m) => m.t === t) as never,
  };
  return s;
}
