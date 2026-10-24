import { useState } from 'react';
import { COMMODITIES, RESOURCES, emptyCounts, type Action, type Commodity, type ResourceCounts } from '@runeshore/shared';
import { ResIcon } from '../board/art';
import { Stepper } from './util';

type Give = Extract<Action, { type: 'discard' | 'arcanaGive' }>;
const none = (): Record<Commodity, number> => ({ vellum: 0, silk: 0, sigil: 0 });

// Pick exactly `need` cards (commodities count) to cast off or hand over; only combinations legalActions lists can be sent.
export function Give({ title, type, hand, commodities, need, legal, act, onlyCommodities }: {
  title: string; type: Give['type']; hand: ResourceCounts; commodities?: Record<Commodity, number>; need: number; legal: Action[]; act(a: Action): void; onlyCommodities?: boolean;
}) {
  const [c, setC] = useState(emptyCounts);
  const [k, setK] = useState(none);
  const sum = RESOURCES.reduce((n, r) => n + c[r], 0) + COMMODITIES.reduce((n, x) => n + k[x], 0);
  const match = legal.find((a): a is Give => a.type === type && RESOURCES.every((r) => a.cards[r] === c[r]) && COMMODITIES.every((x) => (a.commodities?.[x] ?? 0) === k[x]));
  return (
    <div className="modal">
      <h3>{title} {need}</h3>
      {!onlyCommodities && RESOURCES.map((r) => (
        <div key={r} className="row"><ResIcon r={r} /> {r} ({hand[r]}) <Stepper value={c[r]} max={Math.min(hand[r], need - sum + c[r])} onChange={(v) => setC((p) => ({ ...p, [r]: v }))} /></div>
      ))}
      {commodities && COMMODITIES.map((x) => (
        <div key={x} className="row">{x} ({commodities[x]}) <Stepper value={k[x]} max={Math.min(commodities[x], need - sum + k[x])} onChange={(v) => setK((p) => ({ ...p, [x]: v }))} /></div>
      ))}
      <button disabled={!match} onClick={() => match && act(match)}>Give ({sum}/{need})</button>
    </div>
  );
}
