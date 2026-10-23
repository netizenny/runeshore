import { useState } from 'react';
import { RESOURCES, emptyCounts, type Action, type ResourceCounts } from '@runeshore/shared';
import { ResIcon } from '../board/art';
import { Stepper } from './util';

export function Discard({ hand, need, act }: { hand: ResourceCounts; need: number; act(a: Action): void }) {
  const [c, setC] = useState(emptyCounts);
  const sum = RESOURCES.reduce((n, r) => n + c[r], 0);
  return (
    <div className="modal">
      <h3>The Shade stirs: cast off {need}</h3>
      {RESOURCES.map((r) => (
        <div key={r} className="row"><ResIcon r={r} /> {r} ({hand[r]}) <Stepper value={c[r]} max={Math.min(hand[r], need - sum + c[r])} onChange={(v) => setC((p) => ({ ...p, [r]: v }))} /></div>
      ))}
      <button disabled={sum !== need} onClick={() => act({ type: 'discard', cards: c })}>Cast off ({sum}/{need})</button>
    </div>
  );
}
