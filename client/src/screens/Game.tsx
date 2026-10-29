import { useEffect, useRef, useState } from 'react';
import type { Action, ClientMsg, PlayerView, ServerMsg } from '@runeshore/shared';
import { FRAME } from '@runeshore/shared';
import { Board, type Mode, type Pick } from '../board/Board';
import { ComicPanel } from '../fx/ComicPanel';
import { DiceBook } from '../fx/DiceBook';
import { ArcanaHand, arcanaPicks, playsOf } from '../panels/Arcana';
import { Build } from '../panels/Build';
import { Commodities } from '../panels/Commodities';
import { Fleet } from '../panels/Fleet';
import { Give } from '../panels/Give';
import { DiceStats } from '../panels/DiceStats';
import { Glimmer } from '../panels/Glimmer';
import { Improve, Reward } from '../panels/Improve';
import { Sentinels, sentinelPicks, type Sub } from '../panels/Sentinels';
import { Hand } from '../panels/Hand';
import { Log } from '../panels/Log';
import { Offers } from '../panels/Offers';
import { Omens } from '../panels/Omens';
import { Rulebook } from '../panels/Rulebook';
import { Players } from '../panels/Players';
import { ShadeSteal } from '../panels/ShadeSteal';
import { Trade } from '../panels/Trade';
import { isMuted, setMuted } from '../sound';

type GameMsg = Omit<Extract<ServerMsg, { t: 'game' }>, 'view'> & { view: PlayerView };

const has = (legal: Action[], ...types: Action['type'][]) => legal.some((a) => types.includes(a.type));

export function Game({ game, send }: { game: GameMsg; send(m: ClientMsg): void }) {
  const { view, legal } = game;
  const me = view.players.find((p) => p.id === view.you)!;
  const [picked, setPicked] = useState<Mode>(null);
  const [trading, setTrading] = useState(false);
  const [book, setBook] = useState(false);
  const [muted, setMute] = useState(isMuted);
  const [sub, setSub] = useState<Sub | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [boatFrom, setBoatFrom] = useState<string | null>(null);
  useEffect(() => setBoatFrom(null), [picked]);
  // The rulebook and trade drawer stop my turn clock; the server resumes it after 2 minutes at most.
  const reading = book || trading;
  useEffect(() => {
    if (!reading) return;
    send({ t: 'pause', on: true });
    return () => send({ t: 'pause', on: false });
  }, [reading]);
  const hf = view.hf;
  const ph = view.phase;
  const forced: Mode = has(legal, 'placeOutpost') ? 'outpost' : has(legal, 'placePath') || ph.k === 'waymaking' ? 'path' : has(legal, 'moveShade') ? 'shade' : null;
  const mode = forced ?? picked;
  const act = (action: Action) => {
    setPicked(null);
    setSub(null);
    setFrom(null);
    setCard(null);
    setBoatFrom(null);
    send({ t: 'action', action });
  };
  const forcedPick = (type: Action['type'], key: 'vertex' | 'to'): Pick[] =>
    legal.filter((a) => a.type === type).map((a) => ({ kind: 'vertex', id: (a as unknown as Record<string, string>)[key], go: () => act(a) }));
  // Boat mode: click a new boat spot, or one of your movable boats then its destination.
  const edgePick = (id: string, go: () => void): Pick => ({ kind: 'edge', id, go });
  const boatPicks: Pick[] = mode === 'boat' ? legal.flatMap((a) => a.type === 'buildBoat' ? [edgePick(a.edge, () => act(a))] : [])
    : mode !== 'moveboat' ? []
    : boatFrom ? legal.flatMap((a) => a.type === 'moveBoat' && a.from === boatFrom ? [edgePick(a.to, () => act(a))] : [])
    : [...new Set(legal.flatMap((a) => a.type === 'moveBoat' ? [a.from] : []))].map((e) => edgePick(e, () => setBoatFrom(e)));
  // Starting boats (setup) and Twin Paths boats are placed in path mode.
  const freeBoats: Pick[] = legal.flatMap((a) => a.type === 'placeBoat' || (ph.k === 'waymaking' && a.type === 'buildBoat') ? [edgePick(a.edge, () => act(a))] : []);
  const frame = legal.find((a) => a.type === 'moveShade' && a.hex === FRAME);
  const pick: Pick[] = boatPicks.length ? boatPicks : freeBoats.length ? freeBoats : ph.k === 'displaced' ? forcedPick('moveDisplaced', 'to')
    : ph.k === 'fleetLoss' ? forcedPick('chooseLoss', 'vertex')
    : ph.k === 'deserter' ? forcedPick('arcanaPickSentinel', 'vertex')
    : (card && arcanaPicks(playsOf(legal, card), act)) || sentinelPicks(legal, sub, from, setFrom, act);
  const name = view.players.find((p) => p.id === view.order[view.current])?.name;
  const mine = view.order[view.current] === view.you;
  const prompt = ph.k === 'waymaking' ? `Twin Paths: lay ${ph.left} more path${ph.left > 1 ? 's' : ''} or boat${ph.left > 1 ? 's' : ''}`
    : ph.k === 'setup' ? (mine ? `Setup: place your ${ph.step}${ph.step === 'path' && freeBoats.length ? ' (or a boat)' : ''}` : `${name} is placing ${ph.step === 'path' ? 'a path' : `an ${ph.step}`}`)
    : has(legal, 'moveShade') ? 'Move the Shade to a hex'
    : ph.k === 'discard' ? 'Waiting for discards'
    : ph.k === 'displaced' ? 'A Sentinel was displaced: move it' + (ph.owner === view.you ? '' : ` (${view.players.find((p) => p.id === ph.owner)?.name})`)
    : ph.k === 'fleetLoss' ? 'The Hollow Fleet wins: lose a Citadel'
    : ph.k === 'fleetReward' ? 'The Fleet is held: choose a reward'
    : ph.k === 'glimmer' ? 'Glimmer fields pay: choose your cards'
    : ph.k === 'arcanaGive' ? 'Arcana: cards are owed'
    : ph.k === 'deserter' ? 'Turncoat: choose a Sentinel to give up'
    : ph.k === 'roll' ? (mine ? 'Rolling the dice' : `${name} is rolling`)
    : ph.k === 'main' ? (mine ? 'Your turn: build, trade or end your turn' : `${name}'s turn`)
    : ph.k === 'steal' ? (mine ? 'Choose who to steal from' : `${name} is stealing`)
    : `Waiting for ${name}`;
  const icon = ph.k === 'setup' ? (ph.step === 'path' ? '🛤️' : '🏠') : ph.k === 'waymaking' ? '🛤️' : has(legal, 'moveShade') ? '👻'
    : ph.k === 'roll' ? '🎲' : ph.k === 'discard' ? '🃏' : ph.k === 'steal' ? '🫳' : ph.k === 'main' ? (mine ? '⭐' : '⏳') : '✨';
  const roll = legal.find((a) => a.type === 'roll');
  const end = legal.find((a) => a.type === 'endTurn');
  useEffect(() => { if (roll) act(roll); }, [!!roll, view.turn]); // auto-roll on my turn
  const myMove = legal.length > 0;
  // One live dock control (Trade aside): mark it as the move to make and dim the rest.
  const dock = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const live = Array.from(dock.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled):not(.trade)'));
    dock.current!.querySelectorAll('[data-next]').forEach((b) => b.removeAttribute('data-next'));
    if (live.length === 1) live[0].setAttribute('data-next', '');
    dock.current!.dataset.solo = String(live.length === 1);
  });
  const owed = ph.k === 'discard' ? ph.pending[view.you] : 0;

  return (
    <div className="game" data-hf={!!hf}>
      <div className="bar" data-mine={myMove} role="status" aria-live="polite"><span className="bar-icon" aria-hidden="true">{icon}</span><b>{prompt}</b>{frame && <button onClick={() => act(frame)}>Raider to the frame</button>}</div>
      <div className="board"><DiceBook dice={view.dice} turn={view.turn} /><div className="corner"><button className="book" title="Rulebook" onClick={() => setBook(true)}>📖</button><button className="book" title="Sound on/off" onClick={() => { setMuted(!muted); setMute(!muted); }}>{muted ? '🔇' : '🔊'}</button><DiceStats view={view} /></div><Board view={view} legal={legal} mode={mode} onAction={act} pick={pick} /></div>
      <aside className="side">
        <div
          className="side-grip"
          title="Drag to resize"
          onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const w = Math.min(Math.max(window.innerWidth - e.clientX, 240), window.innerWidth * 0.6);
            e.currentTarget.closest<HTMLElement>('.game')!.style.setProperty('--side-w', `${w}px`);
          }}
        />
        {hf && <Fleet hf={hf} />}
        <Players view={view} waitingOn={game.waitingOn} deadline={game.deadline} />
        <Log view={view} />
      </aside>
      <div className="dock" ref={dock} data-mine={myMove}>
        <Hand hand={me.hand!} />
        {hf && <Commodities hf={hf} me={view.you} />}
        <Build left={{ ...me.piecesLeft, boat: view.di?.boatsLeft[view.you] ?? 0 }} boats={!!view.di} legal={legal} picked={forced ? null : picked} setPicked={setPicked} act={act} />
        {hf ? <Improve hf={hf} me={view.you} legal={legal} act={act} /> : <Omens me={me} turn={view.turn} legal={legal} act={act} />}
        {hf && <Sentinels legal={legal} sub={sub} setSub={(v) => { setSub(v); setFrom(null); setPicked(null); setCard(null); }} />}
        {hf && <ArcanaHand cards={hf.players[view.you].arcana ?? []} legal={legal} view={view} sel={card} setSel={(c) => { setCard(c); setSub(null); setPicked(null); }} act={act} />}
        <button className="trade" data-on={trading} onClick={() => setTrading(!trading)}>Trade</button>
        {end && <button className="go" onClick={() => act(end)}>End turn</button>}
      </div>
      <Offers view={view} legal={legal} act={act} scope="incoming" />
      <div className="tradecol">
        {trading && <div className="drawer"><Trade view={view} legal={legal} act={act} /></div>}
        <Offers view={view} legal={legal} act={act} scope="own" />
      </div>
      {owed > 0 && has(legal, 'discard') && <Give title="The Shade stirs: cast off" type="discard" hand={me.hand!} commodities={hf?.players[view.you].commodities} need={owed} legal={legal} act={act} />}
      {ph.k === 'arcanaGive' && ph.pending[view.you] > 0 && <Give title={ph.mode === 'discard' ? 'Arcana: discard' : 'Arcana: give'} type="arcanaGive" hand={me.hand!} commodities={hf?.players[view.you].commodities} need={ph.pending[view.you]} onlyCommodities={ph.mode === 'harbor'} legal={legal} act={act} />}
      {ph.k === 'fleetReward' && has(legal, 'chooseReward') && <Reward legal={legal} act={act} />}
      {ph.k === 'glimmer' && has(legal, 'chooseGlimmer') && <Glimmer view={view} legal={legal} act={act} />}
      {ph.k === 'steal' && has(legal, 'steal') && <ShadeSteal view={view} legal={legal} act={act} />}
      {book && <Rulebook close={() => setBook(false)} />}
      <ComicPanel events={game.events} view={view} send={send} />
    </div>
  );
}
