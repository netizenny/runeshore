import { useEffect, useState } from 'react';
import type { GameEvent, PlayerView } from '@runeshore/shared';
import { ARCANA_BY_KEY } from '@runeshore/shared';
import { glory } from '../panels/Players';

type Cap = { big: string; small: string };
const n = (v: PlayerView, id: string) => v.players.find((p) => p.id === id)?.name ?? '?';

function caption(e: GameEvent, v: PlayerView): Cap | null {
  switch (e.type) {
    case 'shadeMoved': return { big: 'THE SHADE', small: `${n(v, e.player)} calls it to a new hex` };
    case 'stole': return { big: 'STOLEN!', small: `${n(v, e.thief)} takes ${e.resource ?? 'a card'} from ${n(v, e.victim)}` };
    case 'awardChanged': return e.player ? { big: e.award === 'longestPath' ? 'LONGEST TRAIL' : 'WARLORD', small: `${n(v, e.player)} claims it` } : null;
    case 'fleetAdvanced': return { big: 'THE FLEET', small: `The Hollow Fleet creeps to ${e.pos}` };
    case 'fleetAttack': return e.held ? { big: 'FLEET HELD!', small: `Defence ${e.defence} against ${e.strength}` } : { big: 'FLEET STRIKES!', small: `Strength ${e.strength} breaks defence ${e.defence}` };
    case 'shieldAwarded': return { big: 'SHIELD', small: `${n(v, e.player)} wins a Shield of the shore` };
    case 'spire': return { big: 'SPIRE', small: `${n(v, e.player)} raises the ${e.track} Spire` };
    case 'arcanaPlayed': return { big: ARCANA_BY_KEY[e.card]?.name.toUpperCase() ?? 'ARCANA', small: `${n(v, e.player)} plays an Arcana` };
    case 'landfall': return { big: 'LANDFALL!', small: `${n(v, e.player)} plants a flag on a new isle` };
    case 'raiderMoved': return { big: 'THE RAIDER', small: `${n(v, e.player)} sends the ghost boat raiding` };
    default: return null;
  }
}

// Each new big moment shows for ~1.2s, queued in order; the last one fades after 2.5s. The win screen stays until the player leaves.
export function ComicPanel({ events, view }: { events: GameEvent[]; view: PlayerView }) {
  const [queue, setQueue] = useState<Cap[]>([]);
  useEffect(() => {
    const c = events.map((e) => caption(e, view)).filter((x): x is Cap => !!x);
    if (c.length) setQueue((q) => [...q, ...c]);
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!queue.length) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), queue.length > 1 ? 1200 : 2500);
    return () => clearTimeout(t);
  }, [queue]);

  if (view.phase.k === 'ended') {
    const rows = [...view.players].sort((a, b) => glory(view, b.id) - glory(view, a.id));
    return (
      <div className="comic win">
        <h1>{n(view, view.phase.winner)} rules Runeshore!</h1>
        <table><tbody>{rows.map((p) => <tr key={p.id}><td>{p.name}</td><td>★ {glory(view, p.id)}</td></tr>)}</tbody></table>
        <small>Hidden Relics decided the rest.</small>
        <button onClick={() => { location.hash = ''; location.reload(); }}>Back to lobby</button> {/* reload: the socket is still seated in the finished room */}
      </div>
    );
  }
  const c = queue[0];
  return c ? <div className="comic" key={c.small + queue.length}><h1>{c.big}</h1><p>{c.small}</p></div> : null;
}
