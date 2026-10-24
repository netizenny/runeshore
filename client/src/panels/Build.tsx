import { COSTS, type Action } from '@runeshore/shared';
import type { Mode } from '../board/Board';
import { Cards } from './util';

const has = (legal: Action[], t: Action['type']) => legal.some((a) => a.type === t);

export function Build({ legal, picked, setPicked, act, boats }: { boats?: boolean; legal: Action[]; picked: Mode; setPicked(m: Mode): void; act(a: Action): void }) {
  const pieces = [['path', 'buildPath', 'Path'], ['outpost', 'buildOutpost', 'Outpost'], ['citadel', 'buildCitadel', 'Citadel']] as const;
  const all = boats ? [...pieces, ['boat', 'buildBoat', 'Boat'] as const] : pieces;
  return (
    <div className="build">
      {all.map(([m, t, label]) => (
        <button key={m} disabled={!has(legal, t) && !(m === 'boat' && has(legal, 'moveBoat'))} data-on={picked === m} onClick={() => setPicked(picked === m ? null : m)}>
          {label} <Cards c={COSTS[m]} />
        </button>
      ))}
      <button disabled={!has(legal, 'buyOmen')} onClick={() => act({ type: 'buyOmen' })}>Rune <Cards c={COSTS.omen} /></button>
    </div>
  );
}
