import { useEffect, useState } from 'react';
import type { PlayerView } from '@runeshore/shared';

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

export function Players({ view, waiting, deadline }: { view: PlayerView; waiting: string[]; deadline: number | null }) {
  const left = useSecondsLeft(deadline);
  return (
    <div className="players">
      {[...view.order].sort((a, b) => glory(view, b) - glory(view, a)).map((id, rank) => {
        const p = view.players.find((x) => x.id === id)!;
        const turn = view.order[view.current] === id;
        const g = glory(view, id);
        return (
          <div key={id} className="pl" data-turn={turn} style={{ borderLeftColor: `var(--${p.color})` }}>
            <div className="pl-head">
              <span className="pl-rank">{rank === 0 && g > 0 ? '👑' : rank + 1}</span>
              <b>{turn && '▶ '}{p.name}{id === view.you ? ' (you)' : ''}</b>
              {waiting.includes(id) && <span className="ring">{left === null ? '…' : `${left}s`}</span>}
              <span className="pl-glory" title="Glory">♛ {g}</span>
            </div>
            <div className="pl-stats">
              <span title="Paths (roads)">Roads <b>{Object.values(view.paths).filter((o) => o === id).length}</b></span>
              <span title="Outposts (houses)">Houses <b>{Object.values(view.buildings).filter((x) => x.owner === id && x.kind === 'outpost').length}</b></span>
              <span title="Citadels">Citadels <b>{Object.values(view.buildings).filter((x) => x.owner === id && x.kind === 'citadel').length}</b></span>
              <span title="Cards">Cards <b>{p.handCount}</b></span>
              {view.hf ? <span title="Arcana">Arcana <b>{view.hf.players[id].arcanaCount}</b></span> : <span title="Runes">ᚱ <b>{p.omenCount}</b></span>}
              {view.hf && <span title="Commodities">Goods <b>{Object.values(view.hf.players[id].commodities).reduce((a, b) => a + b, 0)}</b></span>}
              {p.wardensPlayed > 0 && <span title="Warriors played">⚔ <b>{p.wardensPlayed}</b></span>}
            </div>
            {(view.longestPath === id || view.grandHost === id) && (
              <div className="pl-badges">
                {view.longestPath === id && <em title="Longest Trail">Longest Trail</em>}
                {view.grandHost === id && <em title="Warlord">Warlord</em>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
