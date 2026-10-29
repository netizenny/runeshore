import { useEffect, useState, type CSSProperties } from 'react';
import type { PlayerView } from '@runeshore/shared';
import { play } from '../sound';

// Glory the table can see: pieces and awards. Relics stay hidden until the win.
export function glory(v: PlayerView, id: string) {
  const b = Object.values(v.buildings).filter((x) => x.owner === id);
  return b.filter((x) => x.kind === 'outpost').length + 2 * b.filter((x) => x.kind === 'citadel').length
    + (v.longestPath === id ? 2 : 0) + (v.grandHost === id ? 2 : 0) + 2 * (v.di?.landfall[id].length ?? 0) + hfGlory(v, id);
}

// Expansion Glory: Spires, Shields of the shore, Printer/Charter and the Peddler.
const hfGlory = (v: PlayerView, id: string) => {
  const hf = v.hf;
  if (!hf) return 0;
  return 2 * Object.values(hf.spires).filter((s) => s?.owner === id).length + hf.players[id].shields + hf.players[id].extraGlory + (hf.peddler?.owner === id ? 1 : 0);
};

function useSecondsLeft(deadline: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}

type Waiting = { player: string; since: number; paused?: true };

// one shape per seat so colour is never the only cue
const SHAPES = ['M12 3l9 9-9 9-9-9z', 'M12 3l2.8 6 6.2.8-4.6 4.3 1.2 6.4L12 17.6 6.4 20.5l1.2-6.4L3 9.8 9.2 9z', 'M12 4a8 8 0 100 16 8 8 0 000-16z', 'M12 3l9 17H3z', 'M4 4h16v16H4z', 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z'];
function Flag({ n }: { n: number }) {
  return <span className="pl-flag" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={SHAPES[n % SHAPES.length]} /></svg></span>;
}

export function Players({ view, waitingOn, deadline }: { view: PlayerView; waitingOn: Waiting[]; deadline: number | null }) {
  const left = useSecondsLeft(deadline);
  const waiting = waitingOn.map((w) => w.player);
  const paused = waitingOn.filter((w) => w.paused).map((w) => w.player);
  const running = waitingOn.filter((w) => !w.paused);
  const total = deadline && running.length ? (deadline - Math.min(...running.map((w) => w.since))) / 1000 : 0;
  const myTurn = waiting.includes(view.you);
  useEffect(() => {
    if (myTurn && left !== null && left > 0 && left <= 10) play(left % 2 ? 'tick' : 'tock');
  }, [left, myTurn]);
  const say = myTurn && (left === 10 || left === 5) ? `${left} seconds left` : '';
  return (
    <div className="players">
      <span className="sr" role="alert">{say}</span>
      {[...view.order].sort((a, b) => glory(view, b) - glory(view, a)).map((id, rank) => {
        const p = view.players.find((x) => x.id === id)!;
        const turn = view.order[view.current] === id;
        const g = glory(view, id);
        const relics = id === view.you ? (p.omens ?? []).filter((o) => o.kind === 'relic').length : 0;
        return (
          <div key={id} className="pl" data-turn={turn} style={{ '--seat': `var(--${p.color})` } as CSSProperties}>
            <Flag n={view.order.indexOf(id)} />
            <div className="pl-head">
              <span className="pl-rank">{rank === 0 && g > 0 ? '👑' : rank + 1}</span>
              <b>{turn && '▶ '}{p.name}{id === view.you ? ' (you)' : ''}</b>
              {waiting.includes(id) && <span className="ring" data-urgent={left !== null && left <= 10 && !paused.includes(id)}>{paused.includes(id) ? '⏸' : left === null ? '…' : `${left}s`}</span>}
              <span className="pl-glory" title={relics ? 'Glory (bracket: with your hidden Relics, only you see it)' : 'Glory'}>♛ {g}{relics > 0 && ` (${g + relics})`}</span>
            </div>
            {waiting.includes(id) && !paused.includes(id) && left !== null && total > 0 && <div className="drain" aria-hidden="true"><i style={{ width: `${Math.min(100, (left / total) * 100)}%` }} /></div>}
            <div className="pl-stats">
              <span title="Paths (roads)" className={view.longestPath === id ? 'hl' : undefined}>Roads <b>{Object.values(view.paths).filter((o) => o === id).length}</b></span>
              <span title="Outposts (houses)">Houses <b>{Object.values(view.buildings).filter((x) => x.owner === id && x.kind === 'outpost').length}</b></span>
              <span title="Citadels">Citadels <b>{Object.values(view.buildings).filter((x) => x.owner === id && x.kind === 'citadel').length}</b></span>
              <span title="Cards">Cards <b>{p.handCount}</b></span>
              {view.hf ? <span title="Arcana">Arcana <b>{view.hf.players[id].arcanaCount}</b></span> : <span title="Runes">ᚱ <b>{p.omenCount}</b></span>}
              {view.hf && <span title="Commodities">Goods <b>{Object.values(view.hf.players[id].commodities).reduce((a, b) => a + b, 0)}</b></span>}
              <span title="Warriors played" className={view.grandHost === id ? 'hl' : undefined}>Warriors <b>{p.wardensPlayed}</b></span>
            </div>
            {(view.longestPath === id || view.grandHost === id) && (
              <div className="pl-badges">
                {view.longestPath === id && <em className="hl" title="Longest Trail">Longest Trail</em>}
                {view.grandHost === id && <em className="hl" title="Warlord">Warlord</em>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
