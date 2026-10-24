import { useState } from 'react';
import type { ClientMsg, ServerMsg, Settings } from '@runeshore/shared';
import { savedName } from '../state/useGame';

type Lobby = Extract<ServerMsg, { t: 'lobby' }>;

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function Lobby(p: {
  roomId: string;
  seated: boolean;
  you?: string;
  lobby: Lobby | null;
  error: string | null;
  send(m: ClientMsg): void;
}) {
  const [name, setName] = useState(savedName);
  const [copied, setCopied] = useState(false);
  const { lobby, send } = p;
  const isHost = !!lobby && lobby.host === p.you;
  const set = (s: Partial<Settings>) => send({ t: 'settings', settings: s });
  const copy = () => navigator.clipboard?.writeText(location.href).then(() => setCopied(true));

  return (
    <div className="screen">
      <h1>Room {p.roomId}</h1>
      {!p.seated && (
        <div className="row">
          <input value={name} maxLength={20} placeholder="Your name" onChange={(e) => setName(e.target.value)} />
          <button disabled={!name.trim()} onClick={() => send({ t: 'join', roomId: p.roomId, name })}>Take a seat</button>
        </div>
      )}
      {p.error && <div className="err">{p.error}</div>}
      <div>
        {lobby?.seats.map((s) => (
          <div className="seat" key={s.id}>
            <span className="chip" style={{ background: `var(--${s.color})` }} />
            {s.name}
            {s.id === lobby.host && ' (host)'}
            <span className={`dot${s.connected ? ' on' : ''}`} />
          </div>
        ))}
      </div>
      <button onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
      {isHost && lobby && (
        <>
          <div className="settings">
            <label>Board</label>
            <select value={lobby.settings.boardMode} onChange={(e) => set({ boardMode: e.target.value as Settings['boardMode'] })}>
              <option value="random">Random</option>
              <option value="starter">Starter</option>
            </select>
            <label>Map size</label>
            <select value={lobby.settings.boardSize} onChange={(e) => set({ boardSize: e.target.value as Settings['boardSize'] })}>
              <option value="standard">Standard</option>
              <option value="large">Large</option>
            </select>
            <label>Glory target</label>
            <select value={lobby.settings.gloryTarget} onChange={(e) => set({ gloryTarget: +e.target.value })}>
              {range(7, 15).map((n) => <option key={n}>{n}</option>)}
            </select>
            <label>Discard limit</label>
            <select value={lobby.settings.discardLimit} onChange={(e) => set({ discardLimit: +e.target.value })}>
              {range(7, 10).map((n) => <option key={n}>{n}</option>)}
            </select>
            <label>Mode</label>
            <select value={lobby.settings.hollowFleet ? 'hf' : lobby.settings.drownedIsles ? 'di' : 'original'} onChange={(e) => set({ hollowFleet: e.target.value === 'hf', drownedIsles: e.target.value === 'di' })}>
              <option value="original">Original</option>
              <option value="hf">Siege of the Hollow Fleet</option>
              <option value="di">Drowned Isles</option>
            </select>
            {lobby.settings.drownedIsles && (
              <>
                <label>Scenario</label>
                <select value={lobby.settings.scenario} onChange={(e) => set({ scenario: e.target.value as Settings['scenario'] })}>
                  <option value="landfall">First Landfall</option>
                  <option value="quartet">Quartet Reach</option>
                </select>
              </>
            )}
            <label>Turn timer</label>
            <select value={lobby.settings.turnTimerSec} onChange={(e) => set({ turnTimerSec: +e.target.value as Settings['turnTimerSec'] })}>
              {[15, 30, 45].map((n) => <option key={n} value={n}>{n} s</option>)}
            </select>
          </div>
          <button disabled={lobby.seats.length < 2 || lobby.seats.length > 4} onClick={() => send({ t: 'start' })}>Begin</button>
        </>
      )}
      {p.seated && !isHost && <div>Waiting for the host to begin.</div>}
    </div>
  );
}
