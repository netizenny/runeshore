import { IMPROVE_MAX, type Action, type HFView, type PlayerId, type Track } from '@runeshore/shared';

const TRACKS: Track[] = ['lore', 'guild', 'crown'];
const COMMODITY = { lore: 'vellum', guild: 'silk', crown: 'sigil' } as const;

export function Improve({ hf, me, legal, act }: { hf: HFView; me: PlayerId; legal: Action[]; act(a: Action): void }) {
  const p = hf.players[me];
  const can = (t: Track) => legal.find((a): a is Extract<Action, { type: 'improve' }> => a.type === 'improve' && a.track === t);
  return (
    <div className="improve">
      {TRACKS.map((t) => {
        const a = can(t);
        const spire = hf.spires[t];
        return (
          <button key={t} disabled={!a} onClick={() => a && act(a)} title={`Needs ${p.level[t] + 1} ${COMMODITY[t]}`}>
            {t} {p.level[t]}/{IMPROVE_MAX}{spire ? (spire.owner === me ? ' ♛' : ' ♚') : ''}
          </button>
        );
      })}
    </div>
  );
}

// Winners of a Fleet defence pick the stack their reward card comes from.
export function Reward({ legal, act }: { legal: Action[]; act(a: Action): void }) {
  const picks = legal.filter((a): a is Extract<Action, { type: 'chooseReward' }> => a.type === 'chooseReward');
  return (
    <div className="modal">
      <h3>The Fleet is held: draw an Arcana from</h3>
      {picks.map((a) => <button key={a.track} onClick={() => act(a)}>{a.track}</button>)}
    </div>
  );
}
