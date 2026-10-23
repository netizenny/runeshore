import { useState } from 'react';
import { OMEN_TEXT, RESOURCES, type Action, type OmenKind, type PlayerViewPlayer, type Resource } from '@runeshore/shared';
import { ResIcon } from '../board/art';

export function Omens({ me, turn, legal, act }: { me: PlayerViewPlayer; turn: number; legal: Action[]; act(a: Action): void }) {
  const [pick, setPick] = useState<Resource[]>([]);
  const [open, setOpen] = useState<'bounty' | 'hoard' | null>(null);
  const plays = legal.filter((a): a is Extract<Action, { type: 'playOmen' }> => a.type === 'playOmen');
  const can = (k: OmenKind) => plays.some((a) => a.kind === k);
  const run = (k: OmenKind) => {
    if (k === 'bounty' || k === 'hoard') return setOpen(open === k ? null : k), setPick([]);
    act({ type: 'playOmen', kind: k } as Action);
  };
  const choose = (r: Resource) => {
    if (open === 'hoard') return setOpen(null), act({ type: 'playOmen', kind: 'hoard', resource: r });
    const next = [...pick, r];
    if (next.length < 2) return setPick(next);
    const sorted = next.sort((a, b) => RESOURCES.indexOf(a) - RESOURCES.indexOf(b)) as [Resource, Resource];
    setOpen(null);
    setPick([]);
    act({ type: 'playOmen', kind: 'bounty', pick: sorted });
  };
  return (
    <div className="omens">
      {(me.omens ?? []).map((o, i) => (
        <button key={i} className="omen" title={OMEN_TEXT[o.kind]} disabled={!can(o.kind)} onClick={() => run(o.kind)}>
          {o.kind}{o.boughtTurn === turn && o.kind !== 'relic' ? ' (new)' : ''}
        </button>
      ))}
      {open && (
        <div className="pick">
          {open === 'bounty' ? `Pick 2 (${pick.length}/2):` : 'Pick 1:'}
          {RESOURCES.map((r) => <button key={r} onClick={() => choose(r)}><ResIcon r={r} /></button>)}
        </div>
      )}
    </div>
  );
}
