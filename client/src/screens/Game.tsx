import { useState } from 'react';
import type { Action, ClientMsg, ServerMsg } from '@runeshore/shared';
import { Board, type Mode } from '../board/Board';
import { ComicPanel } from '../fx/ComicPanel';
import { Build } from '../panels/Build';
import { Discard } from '../panels/Discard';
import { Hand } from '../panels/Hand';
import { Log } from '../panels/Log';
import { Offers } from '../panels/Offers';
import { Omens } from '../panels/Omens';
import { Rulebook } from '../panels/Rulebook';
import { Players } from '../panels/Players';
import { ShadeSteal } from '../panels/ShadeSteal';
import { Trade } from '../panels/Trade';

type GameMsg = Extract<ServerMsg, { t: 'game' }>;

const has = (legal: Action[], ...types: Action['type'][]) => legal.some((a) => types.includes(a.type));

export function Game({ game, send }: { game: GameMsg; send(m: ClientMsg): void }) {
  const { view, legal } = game;
  const me = view.players.find((p) => p.id === view.you)!;
  const [picked, setPicked] = useState<Mode>(null);
  const [trading, setTrading] = useState(false);
  const [book, setBook] = useState(false);
  const ph = view.phase;
  const forced: Mode = has(legal, 'placeOutpost') ? 'outpost' : has(legal, 'placePath') || ph.k === 'waymaking' ? 'path' : has(legal, 'moveShade') ? 'shade' : null;
  const mode = forced ?? picked;
  const act = (action: Action) => {
    setPicked(null);
    send({ t: 'action', action });
  };
  const name = view.players.find((p) => p.id === view.order[view.current])?.name;
  const prompt = ph.k === 'waymaking' ? `Twin Paths: lay ${ph.left} more path${ph.left > 1 ? 's' : ''}`
    : ph.k === 'setup' ? `Setup: place your ${ph.step}`
    : has(legal, 'moveShade') ? 'Move the Shade to a hex'
    : ph.k === 'discard' ? 'Waiting for discards'
    : `${name}: ${ph.k}`;
  const roll = legal.find((a) => a.type === 'roll');
  const end = legal.find((a) => a.type === 'endTurn');
  const owed = ph.k === 'discard' ? ph.pending[view.you] : 0;

  return (
    <div className="game">
      <div className="bar"><b>{prompt}</b>{view.dice && ph.k !== 'roll' && <span>🎲 {view.dice[0]} + {view.dice[1]}</span>}</div>
      <div className="board"><button className="book" title="Rulebook" onClick={() => setBook(true)}>📖</button><Board view={view} legal={legal} mode={mode} onAction={act} /></div>
      <aside className="side">
        <Players view={view} waiting={game.waitingOn.map((w) => w.player)} deadline={game.deadline} />
        <Log view={view} />
      </aside>
      <div className="dock">
        <Hand hand={me.hand!} />
        <Build legal={legal} picked={forced ? null : picked} setPicked={setPicked} act={act} />
        <Omens me={me} turn={view.turn} legal={legal} act={act} />
        <button data-on={trading} onClick={() => setTrading(!trading)}>Trade</button>
        {roll && <button className="go" onClick={() => act(roll)}>Roll</button>}
        {end && <button className="go" onClick={() => act(end)}>End turn</button>}
      </div>
      <Offers view={view} legal={legal} act={act} />
      {trading &&<div className="drawer"><Trade view={view} legal={legal} act={act} /></div>}
      {owed > 0 && has(legal, 'discard') && <Discard hand={me.hand!} need={owed} act={act} />}
      {ph.k === 'steal' && has(legal, 'steal') && <ShadeSteal view={view} legal={legal} act={act} />}
      {book && <Rulebook close={() => setBook(false)} />}
      <ComicPanel events={game.events} view={view} />
    </div>
  );
}
