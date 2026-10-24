import { COMMODITIES, type HFView, type PlayerId } from '@runeshore/shared';

const GLYPH = { vellum: '📜', silk: '🧵', sigil: '🔰' } as const;

export const Commodities = ({ hf, me }: { hf: HFView; me: PlayerId }) => {
  const p = hf.players[me];
  return (
    <div className="hand commodities">
      {COMMODITIES.map((c) => (
        <div key={c} className={`card ${c}`} data-empty={!p.commodities[c]}>
          <span>{GLYPH[c]}</span><b>{p.commodities[c]}</b><small>{c}</small>
        </div>
      ))}
      <div className="card" data-empty={!p.shields}><span>🛡</span><b>{p.shields}</b><small>shields</small></div>
    </div>
  );
};
