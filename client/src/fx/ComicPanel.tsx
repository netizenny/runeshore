import { useEffect, useState } from 'react';
import type { ClientMsg, GameEvent, PlayerView } from '@runeshore/shared';
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
export function ComicPanel({ events, view, send }: { events: GameEvent[]; view: PlayerView; send(m: ClientMsg): void }) {
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
    const relics = (p: PlayerView['players'][number]) => (p.omens ?? []).filter((o) => o.kind === 'relic').length;
    const total = (p: PlayerView['players'][number]) => glory(view, p.id) + relics(p);
    const rows = [...view.players].sort((a, b) => total(b) - total(a));
    const bld = (id: string, kind: string) => Object.values(view.buildings).filter((x) => x.owner === id && x.kind === kind).length;
    const hf = (id: string) => view.hf?.players[id];
    const src: [string, (p: PlayerView['players'][number]) => number][] = [
      ['Outposts', (p) => bld(p.id, 'outpost')],
      ['Citadels ×2', (p) => 2 * bld(p.id, 'citadel')],
      ['Longest path', (p) => (view.longestPath === p.id ? 2 : 0)],
      ['Grand host', (p) => (view.grandHost === p.id ? 2 : 0)],
      ...(view.di ? [['Landfalls', (p: PlayerView['players'][number]) => 2 * view.di!.landfall[p.id].length] as [string, (p: PlayerView['players'][number]) => number]] : []),
      ...(view.hf ? ([
        ['Spires', (p) => 2 * Object.values(view.hf!.spires).filter((s) => s?.owner === p.id).length],
        ['Shields', (p) => hf(p.id)!.shields],
        ['Printer/Charter', (p) => hf(p.id)!.extraGlory],
        ['Peddler', (p) => (view.hf!.peddler?.owner === p.id ? 1 : 0)],
      ] as [string, (p: PlayerView['players'][number]) => number][]) : []),
      ['Relics', relics],
    ];
    const winner = view.players.find((p) => p.id === (view.phase as { winner: string }).winner)!;
    const podium = [rows[1], rows[0], rows[2]].filter(Boolean); // 2nd, 1st, 3rd: the tall step sits in the middle
    return (
      <div className="comic win" style={{ '--win': `var(--${winner.color})` } as React.CSSProperties} role="dialog" aria-label={`${winner.name} wins`}>
        <div className="crown" aria-hidden="true">👑</div>
        <h1>{winner.name} rules Runeshore!</h1>
        <div className="podium">
          {podium.map((p) => (
            <div key={p.id} className="step" data-first={p.id === winner.id} data-place={rows.indexOf(p) + 1}>
              <span className="chip" style={{ background: `var(--${p.color})` }} />
              <b>{p.name}</b>
              <span>★ {total(p)}</span>
            </div>
          ))}
        </div>
        <button className="go huge" onClick={() => send({ t: 'rematch' })}>Back to lobby</button>
        <details className="how">
          <summary>How it happened</summary>
          <table>
            <thead><tr><th />{rows.map((p) => <th key={p.id}>{p.name}</th>)}</tr></thead>
            <tbody>
              {src.filter(([, f]) => rows.some((p) => f(p) > 0)).map(([label, f]) => <tr key={label}><td>{label}</td>{rows.map((p) => <td key={p.id}>{f(p) || '·'}</td>)}</tr>)}
              <tr><td><b>Total</b></td>{rows.map((p) => <td key={p.id}><b>★ {total(p)}</b></td>)}</tr>
            </tbody>
          </table>
        </details>
      </div>
    );
  }
  const c = queue[0];
  return c ? <div className="comic" key={c.small + queue.length}><h1>{c.big}</h1><p>{c.small}</p></div> : null;
}
