import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMsg, ServerMsg } from '@runeshore/shared';
import { connect, type Status } from '../net/socket';

type Joined = Extract<ServerMsg, { t: 'joined' }>;
type Lobby = Extract<ServerMsg, { t: 'lobby' }>;
type Game = Extract<ServerMsg, { t: 'game' }>;

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
        } else if (m.t === 'lobby') setLobby(m);
        else if (m.t === 'game') setGame(m);
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
