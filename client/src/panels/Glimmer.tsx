import { useState } from 'react';
import { RESOURCES, emptyCounts, type Action, type PlayerView } from '@runeshore/shared';
import { ResIcon } from '../board/art';
import { Stepper } from './util';

// A Glimmer field pays picks, not cards: choose exactly the owed number; only picks legalActions lists can be sent.
export function Glimmer({ view, legal, act }: { view: PlayerView; legal: Action[]; act(a: Action): void }) {
  const [c, setC] = useState(emptyCounts);
  const ph = view.phase;
  const owed = ph.k === 'glimmer' ? ph.pending[view.you] ?? 0 : 0;
  const need = Math.min(owed, RESOURCES.reduce((n, r) => n + view.bank[r], 0));
  const sum = RESOURCES.reduce((n, r) => n + c[r], 0);
  const match = legal.find((a): a is Extract<Action, { type: 'chooseGlimmer' }> => a.type === 'chooseGlimmer' && RESOURCES.every((r) => a.cards[r] === c[r]));
  return (
    <div className="modal">
      <h3>Glimmer: pick {need}</h3>
      {RESOURCES.map((r) => (
        <div key={r} className="row"><ResIcon r={r} /> {r} <Stepper value={c[r]} max={Math.min(view.bank[r], need - sum + c[r])} onChange={(v) => setC((p) => ({ ...p, [r]: v }))} /></div>
      ))}
      <button disabled={!match} onClick={() => match && act(match)}>Take ({sum}/{need})</button>
    </div>
  );
}
