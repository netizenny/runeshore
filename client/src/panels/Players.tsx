import { useEffect, useState } from 'react';
import type { PlayerView } from '@runeshore/shared';

// Renown the table can see: pieces and awards. Relics stay hidden until the win.
export function renown(v: PlayerView, id: string) {
  const b = Object.values(v.buildings).filter((x) => x.owner === id);
  return b.filter((x) => x.kind === 'outpost').length + 2 * b.filter((x) => x.kind === 'citadel').length
    + (v.longestPath === id ? 2 : 0) + (v.grandHost === id ? 2 : 0);
}

function useSecondsLeft(deadline: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}

export function Players({ view, waiting, deadline }: { view: PlayerView; waiting: string[]; deadline: number | null }) {
  const left = useSecondsLeft(deadline);
  return (
    <div className="players">
      {view.order.map((id) => {
        const p = view.players.find((x) => x.id === id)!;
        const turn = view.order[view.current] === id;
        return (
          <div key={id} className="pl" data-turn={turn} style={{ borderLeftColor: `var(--${p.color})` }}>
            <b>{p.name}{id === view.you ? ' (you)' : ''}</b>
            <span title="Renown">★ {renown(view, id)}</span>
            <span title="Cards">🂠 {p.handCount}</span>
            <span title="Omens">✦ {p.omenCount}</span>
            {view.longestPath === id && <em>Longest Path</em>}
            {view.grandHost === id && <em>Grand Host</em>}
            {p.wardensPlayed > 0 && <small>Wardens {p.wardensPlayed}</small>}
            {waiting.includes(id) && <span className="ring">{left === null ? '…' : `${left}s`}</span>}
          </div>
        );
      })}
    </div>
  );
}
