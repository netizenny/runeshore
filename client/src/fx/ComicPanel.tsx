import { useEffect, useState } from 'react';
import type { GameEvent, PlayerView } from '@runeshore/shared';
import { renown } from '../panels/Players';

type Cap = { big: string; small: string };
const n = (v: PlayerView, id: string) => v.players.find((p) => p.id === id)?.name ?? '?';

function caption(e: GameEvent, v: PlayerView): Cap | null {
  switch (e.type) {
    case 'rolled': return { big: `${e.dice[0] + e.dice[1]}`, small: `${n(v, e.player)} rolls ${e.dice[0]} and ${e.dice[1]}` };
    case 'shadeMoved': return { big: 'THE SHADE', small: `${n(v, e.player)} calls it to a new hex` };
    case 'stole': return { big: 'STOLEN!', small: `${n(v, e.thief)} takes ${e.resource ?? 'a card'} from ${n(v, e.victim)}` };
    case 'awardChanged': return e.player ? { big: e.award === 'longestPath' ? 'LONGEST PATH' : 'GRAND HOST', small: `${n(v, e.player)} claims it` } : null;
    default: return null;
  }
}

// Each new big moment shows for ~1.2s, queued in order; the last one stays on screen until replaced. The win screen stays until the player leaves.
export function ComicPanel({ events, view }: { events: GameEvent[]; view: PlayerView }) {
  const [queue, setQueue] = useState<Cap[]>([]);
  useEffect(() => {
    const c = events.map((e) => caption(e, view)).filter((x): x is Cap => !!x);
    if (c.length) setQueue((q) => [...q, ...c]);
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (queue.length < 2) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 1200);
    return () => clearTimeout(t);
  }, [queue]);

  if (view.phase.k === 'ended') {
    const rows = [...view.players].sort((a, b) => renown(view, b.id) - renown(view, a.id));
    return (
      <div className="comic win">
        <h1>{n(view, view.phase.winner)} rules Runeshore!</h1>
        <table><tbody>{rows.map((p) => <tr key={p.id}><td>{p.name}</td><td>★ {renown(view, p.id)}</td></tr>)}</tbody></table>
        <small>Hidden Relics decided the rest.</small>
        <button onClick={() => { location.hash = ''; location.reload(); }}>Back to lobby</button> {/* reload: the socket is still seated in the finished room */}
      </div>
    );
  }
  const c = queue[0];
  return c ? <div className="comic" key={c.small + queue.length}><h1>{c.big}</h1><p>{c.small}</p></div> : null;
}
