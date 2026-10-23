import { useState } from 'react';
import type { Action, ClientMsg, ServerMsg } from '@runeshore/shared';
import { Board, type Mode } from '../board/Board';

type GameMsg = Extract<ServerMsg, { t: 'game' }>;

const has = (legal: Action[], ...types: Action['type'][]) => legal.some((a) => types.includes(a.type));

// Task 14 replaces this bar with real panels; for now just enough to drive setup and the first turns.
export function Game({ game, send }: { game: GameMsg; send(m: ClientMsg): void }) {
  const { view, legal } = game;
  const [picked, setPicked] = useState<Mode>(null);
  const forced: Mode = has(legal, 'placeOutpost') ? 'outpost' : has(legal, 'placePath') || view.phase.k === 'waymaking' ? 'path' : has(legal, 'moveShade') ? 'shade' : null;
  const mode = forced ?? picked;
  const act = (action: Action) => {
    setPicked(null);
    send({ t: 'action', action });
  };
  const toggles: [Mode, boolean][] = [['path', has(legal, 'buildPath')], ['outpost', has(legal, 'buildOutpost')], ['citadel', has(legal, 'buildCitadel')]];
  const name = (id: string) => view.players.find((p) => p.id === id)?.name;
  return (
    <div className="game">
      <div className="bar">
        <span>{name(view.order[view.current])} · {view.phase.k}</span>
        {!forced && toggles.filter(([, ok]) => ok).map(([m]) => <button key={m} onClick={() => setPicked(picked === m ? null : m)}>{m}</button>)}
        {legal.filter((a) => a.type === 'roll' || a.type === 'endTurn').map((a) => <button key={a.type} onClick={() => act(a)}>{a.type === 'roll' ? 'Roll' : 'End turn'}</button>)}
        {legal.filter((a): a is Extract<Action, { type: 'steal' }> => a.type === 'steal').map((a) => <button key={a.victim} onClick={() => act(a)}>Steal from {name(a.victim)}</button>)}
      </div>
      <div className="board"><Board view={view} legal={legal} mode={mode} onAction={act} /></div>
    </div>
  );
}
