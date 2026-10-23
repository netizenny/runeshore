/// <reference types="vite/client" />
import type { ClientMsg, ServerMsg } from '@runeshore/shared';

export type Status = 'connecting' | 'open' | 'closed';

const wsUrl = () => import.meta.env.VITE_WS_URL || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;

// Reconnecting socket: backoff 0.5 s -> 5 s. `onOpen` runs on every (re)connect so callers can re-join.
export function connect(h: {
  onOpen(): void;
  onMsg(m: ServerMsg): void;
  onStatus(s: Status): void;
}) {
  let ws: WebSocket | null = null;
  let delay = 500;
  let stopped = false;
  let timer: number | undefined;
  const open = () => {
    h.onStatus('connecting');
    ws = new WebSocket(wsUrl());
    ws.onopen = () => {
      delay = 500;
      h.onStatus('open');
      h.onOpen();
    };
    ws.onmessage = (e) => h.onMsg(JSON.parse(String(e.data)));
    ws.onclose = () => {
      h.onStatus('closed');
      if (stopped) return;
      timer = window.setTimeout(open, delay);
      delay = Math.min(delay * 2, 5000);
    };
  };
  open();
  return {
    send: (m: ClientMsg) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify(m)),
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      ws?.close();
    },
  };
}
