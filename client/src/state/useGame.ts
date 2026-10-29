import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMsg, GameEvent, PlayerView, ServerMsg } from '@runeshore/shared';
import { connect, type Status } from '../net/socket';
import { play, playEvent } from '../sound';

type Joined = Extract<ServerMsg, { t: 'joined' }>;
type Lobby = Extract<ServerMsg, { t: 'lobby' }>;
type Game = Omit<Extract<ServerMsg, { t: 'game' }>, 'view'> & { view: PlayerView };

// sessionStorage, not localStorage: tabs of one browser must be able to hold different seats (still survives reload).
const key = (id: string) => `runeshore:seat:${id}`;
const getToken = (id: string) => {
  try {
    return sessionStorage.getItem(key(id)) ?? undefined;
  } catch {
    return undefined;
  }
};
const setToken = (id: string, t: string) => {
  try {
    sessionStorage.setItem(key(id), t);
  } catch {
    /* storage blocked: seat is lost on reload, game still works */
  }
};
const NAME_KEY = 'runeshore:name';
export const savedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};
const saveName = (n: string) => {
  try {
    localStorage.setItem(NAME_KEY, n);
  } catch {
    /* ignore */
  }
};

export const ERRORS: Record<string, string> = {
  started: 'This game already began.',
  bad_name: 'Pick a name first.',
  no_room: 'That room does not exist.',
  replaced: 'You joined from another tab. This one is now idle.',
  too_soon: 'Not yet. Give them a little longer.',
};

// roomId: room from the URL (null on Home). Reclaims the stored seat on every (re)connect; new seats are taken explicitly.
export function useGame(roomId: string | null) {
  const [status, setStatus] = useState<Status>('connecting');
  const [joined, setJoined] = useState<Joined | null>(null);
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const conn = useRef<ReturnType<typeof connect> | null>(null);
  const log = useRef<GameEvent[]>([]);
  const wasMyTurn = useRef(false);
  const offers = useRef(0);
  const name = useRef(savedName());
  const room = useRef(roomId);
  room.current = roomId;

  useEffect(() => {
    const c = connect({
      onStatus: setStatus,
      onOpen: () => {
        const id = room.current;
        const token = id ? getToken(id) : undefined;
        if (id && token) c.send({ t: 'join', roomId: id, name: name.current, seatToken: token });
      },
      onMsg: (m) => {
        if (m.t === 'joined') {
          setToken(m.roomId, m.seatToken);
          setJoined(m);
          setError(null);
        } else if (m.t === 'lobby') {
          setLobby(m);
          setGame(null); // a rematch sends everyone back here
          log.current = [];
        }
        else if (m.t === 'game') {
          // Full log arrives once per connection; later messages only add this move's events.
          log.current = m.log ?? [...log.current, ...m.events];
          if (!m.log) {
            const v = m.view;
            m.events.forEach((e) => playEvent(e, v.you));
            const myTurn = v.order[v.current] === v.you;
            if (myTurn && !wasMyTurn.current) play('turn');
            wasMyTurn.current = myTurn;
            if (v.offers.length > offers.current && v.offers.some((o) => o.from !== v.you)) play('offer');
            offers.current = v.offers.length;
          } else {
            wasMyTurn.current = m.view.order[m.view.current] === m.view.you;
            offers.current = m.view.offers.length;
          }
          setGame({ ...m, view: { ...m.view, log: log.current } });
        }
        else {
          setError(ERRORS[m.code] ?? m.message);
          if (m.code === 'replaced') {
            c.stop();
          }
        }
      },
    });
    conn.current = c;
    return () => {
      c.stop();
    };
  }, []);

  const send = useCallback((m: ClientMsg) => {
    if (m.t === 'create' || m.t === 'join') {
      name.current = m.name;
      saveName(m.name);
    }
    setError(null);
    conn.current?.send(m);
  }, []);

  return { status, joined, lobby, game, error, send };
}
