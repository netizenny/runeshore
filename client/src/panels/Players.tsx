import { useEffect, useState } from 'react';
import type { PlayerView } from '@runeshore/shared';

// Glory the table can see: pieces and awards. Relics stay hidden until the win.
export function renown(v: PlayerView, id: string) {
  const b = Object.values(v.buildings).filter((x) => x.owner === id);
  return b.filter((x) => x.kind === 'outpost').length + 2 * b.filter((x) => x.kind === 'citadel').length
    + (v.longestPath === id ? 2 : 0) + (v.grandHost === id ? 2 : 0) + hfRenown(v, id);
}

// Expansion Glory: Spires, Shields of the shore, Printer/Charter and the Peddler.
const hfRenown = (v: PlayerView, id: string) => {
  const hf = v.hf;
  if (!hf) return 0;
  return 2 * Object.values(hf.spires).filter((s) => s?.owner === id).length + hf.players[id].shields + hf.players[id].extraRenown + (hf.peddler?.owner === id ? 1 : 0);
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
            <span title="Glory">★ {renown(view, id)}</span>
            <span title="Cards">🂠 {p.handCount}</span>
            {view.hf ? <span title="Arcana">✦ {view.hf.players[id].arcanaCount}</span> : <span title="Runes">✦ {p.omenCount}</span>}
            {view.hf && <span title="Commodities">📜 {Object.values(view.hf.players[id].commodities).reduce((a, b) => a + b, 0)}</span>}
            {view.longestPath === id && <em title="Longest Trail">🛤</em>}
            {view.grandHost === id && <em title="Warlord">Warlord</em>}
            {p.wardensPlayed > 0 && <small title="Warriors played">⚔ {p.wardensPlayed}</small>}
            {waiting.includes(id) && <span className="ring">{left === null ? '…' : `${left}s`}</span>}
          </div>
        );
      })}
    </div>
  );
}
