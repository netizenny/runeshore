import { useState } from 'react';
import { SCENARIOS, type ClientMsg, type ServerMsg, type Settings } from '@runeshore/shared';
import { savedName } from '../state/useGame';

type Lobby = Extract<ServerMsg, { t: 'lobby' }>;

const PRESETS: { id: string; label: string; hint: string; set: Partial<Settings> }[] = [
  { id: 'quick', label: 'Quick', hint: 'Short game, 7 Glory', set: { hollowFleet: false, drownedIsles: false, gloryTarget: 7 } },
  { id: 'classic', label: 'Classic', hint: 'The usual, 10 Glory', set: { hollowFleet: false, drownedIsles: false, gloryTarget: 10 } },
  { id: 'epic', label: 'Epic', hint: 'Hollow Fleet, 13 Glory', set: { hollowFleet: true, drownedIsles: false, gloryTarget: 13 } },
];
const presetOf = (s: Settings) => (s.drownedIsles ? null : s.hollowFleet ? (s.gloryTarget === 13 ? 'epic' : null) : s.gloryTarget === 7 ? 'quick' : s.gloryTarget === 10 ? 'classic' : null);

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
  const many = (lobby?.seats.length ?? 0) > 4;
  // 5-6 players need a big map; big maps seat 2-6. The server checks the same.
  const big = !!lobby && (lobby.settings.drownedIsles ? !!SCENARIOS[lobby.settings.scenario].big : lobby.settings.boardSize === 'large');
  const mapFits = !many || big;

  return (
    <div className="screen">
      <div className="code" role="group" aria-label={`Room code ${p.roomId.split('').join(' ')}`}>
        <small>Room code</small>
        <b aria-hidden="true">{p.roomId.slice(0, 3)} {p.roomId.slice(3)}</b>
      </div>
      {!p.seated && (
        <div className="row">
          <input aria-label="Your name" value={name} maxLength={20} placeholder="Your name" onChange={(e) => setName(e.target.value)} />
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
          <div className="presets" role="radiogroup" aria-label="Game length">
            {PRESETS.map((x) => (
              <button key={x.id} role="radio" aria-checked={presetOf(lobby.settings) === x.id} data-on={presetOf(lobby.settings) === x.id} onClick={() => set(x.set)}>
                <b>{x.label}</b><small>{x.hint}</small>
              </button>
            ))}
          </div>
          <details className="advanced">
          <summary>Advanced</summary>
          <div className="settings">
            <label>Board</label>
            <select value={lobby.settings.boardMode} onChange={(e) => set({ boardMode: e.target.value as Settings['boardMode'] })}>
              <option value="random">Random</option>
              <option value="starter">Starter</option>
            </select>
            {!lobby.settings.drownedIsles && (
              <>
                <label>Map size</label>
                <select value={lobby.settings.boardSize} onChange={(e) => set({ boardSize: e.target.value as Settings['boardSize'] })}>
                  <option value="standard">Standard (2-4)</option>
                  <option value="large">Large (2-6)</option>
                  <option value="volcano">Volcano (2-4)</option>
                </select>
              </>
            )}
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
                  {Object.values(SCENARIOS).filter((sc) => !sc.base).map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name} ({sc.big ? '2-6' : '2-4'})</option>
                  ))}
                </select>
              </>
            )}
            <label>Turn timer</label>
            <select value={lobby.settings.turnTimerSec} onChange={(e) => set({ turnTimerSec: +e.target.value as Settings['turnTimerSec'] })}>
              {[15, 30, 45, 60, 90].map((n) => <option key={n} value={n}>{n} s</option>)}
            </select>
          </div>
          </details>
          {!mapFits && <div className="err">Five or six players need a large map.</div>}
          <button disabled={lobby.seats.length < 2 || !mapFits} className="go huge" onClick={() => send({ t: 'start' })}>Begin</button>
        </>
      )}
      {p.seated && !isHost && <div>Waiting for the host to begin.</div>}
    </div>
  );
}
