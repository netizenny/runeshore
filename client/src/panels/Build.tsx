import { COSTS, type Action } from '@runeshore/shared';
import type { Mode } from '../board/Board';
import { Cards } from './util';

const has = (legal: Action[], t: Action['type']) => legal.some((a) => a.type === t);

export function Build({ legal, picked, setPicked, act }: { legal: Action[]; picked: Mode; setPicked(m: Mode): void; act(a: Action): void }) {
  const pieces = [['path', 'buildPath', 'Path'], ['outpost', 'buildOutpost', 'Outpost'], ['citadel', 'buildCitadel', 'Citadel']] as const;
  return (
    <div className="build">
      {pieces.map(([m, t, label]) => (
        <button key={m} disabled={!has(legal, t)} data-on={picked === m} onClick={() => setPicked(picked === m ? null : m)}>
          {label} <Cards c={COSTS[m]} />
        </button>
      ))}
      <button disabled={!has(legal, 'buyOmen')} onClick={() => act({ type: 'buyOmen' })}>Rune <Cards c={COSTS.omen} /></button>
    </div>
  );
}
