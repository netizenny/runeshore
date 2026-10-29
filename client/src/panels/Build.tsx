import { COSTS, type Action } from '@runeshore/shared';
import type { Mode } from '../board/Board';
import { RESOURCES, type ResourceCounts } from '@runeshore/shared';
import { ResIcon } from '../board/art';
import { Cards } from './util';

const has = (legal: Action[], t: Action['type']) => legal.some((a) => a.type === t);

export function Build({ hand, legal, picked, setPicked, act, boats, left }: { hand: ResourceCounts; left: Record<string, number>; boats?: boolean; legal: Action[]; picked: Mode; setPicked(m: Mode): void; act(a: Action): void }) {
  const pieces = [['path', 'buildPath', 'Path'], ['outpost', 'buildOutpost', 'Outpost'], ['citadel', 'buildCitadel', 'Citadel']] as const;
  // Grey icon per missing resource, so a non-reader sees what is lacking.
  const Miss = ({ c, what }: { c: Partial<ResourceCounts>; what: string }) => {
    const m = RESOURCES.filter((r) => (c[r] ?? 0) > (hand[r] ?? 0));
    return m.length ? <span className="miss" role="img" aria-label={`${what}: missing ${m.map((r) => `${(c[r] ?? 0) - (hand[r] ?? 0)} ${r}`).join(', ')}`}>{m.map((r) => <span key={r}><ResIcon r={r} size={24} />−{(c[r] ?? 0) - (hand[r] ?? 0)}</span>)}</span> : null;
  };
  const all = boats ? [...pieces, ['boat', 'buildBoat', 'Boat'] as const] : pieces;
  return (
    <div className="build">
      {all.map(([m, t, label]) => (
        <button key={m} disabled={!has(legal, t)} data-on={picked === m} onClick={() => setPicked(picked === m ? null : m)}>
          {label} <small>×{left[m]}</small> <Cards c={COSTS[m]} /><Miss c={COSTS[m]} what={label} />
        </button>
      ))}
      {boats && <button disabled={!has(legal, 'moveBoat')} data-on={picked === 'moveboat'} onClick={() => setPicked(picked === 'moveboat' ? null : 'moveboat')}>Move Boat (free)</button>}
      <button disabled={!has(legal, 'buyOmen')} onClick={() => act({ type: 'buyOmen' })}>Rune <Cards c={COSTS.omen} /><Miss c={COSTS.omen} what="Rune" /></button>
    </div>
  );
}
