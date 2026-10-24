import { COSTS, type Action, type ResourceCounts } from '@runeshore/shared';
import type { Pick } from '../board/Board';
import { Cards } from './util';

export type Sub = 'buildSentinel' | 'activateSentinel' | 'promoteSentinel' | 'move' | 'chaseShade' | 'buildBulwark';
const ROWS: [Sub, string, ResourceCounts | null][] = [
  ['buildSentinel', 'Sentinel', COSTS.sentinel],
  ['activateSentinel', 'Activate', COSTS.activate],
  ['promoteSentinel', 'Promote', COSTS.sentinel],
  ['move', 'Move', null],
  ['chaseShade', 'Chase', null],
  ['buildBulwark', 'Bulwark', COSTS.bulwark],
];
const TYPE: Record<Sub, Action['type']> = { buildSentinel: 'buildSentinel', activateSentinel: 'activateSentinel', promoteSentinel: 'promoteSentinel', move: 'moveSentinel', chaseShade: 'chaseShade', buildBulwark: 'buildBulwark' };

export function Sentinels({ legal, sub, setSub }: { legal: Action[]; sub: Sub | null; setSub(s: Sub | null): void }) {
  return (
    <div className="build sentinels">
      {ROWS.map(([s, label, cost]) => (
        <button key={s} disabled={!legal.some((a) => a.type === TYPE[s])} data-on={sub === s} onClick={() => setSub(sub === s ? null : s)}>
          {label} {cost && <Cards c={cost} />}
        </button>
      ))}
    </div>
  );
}

// Board spots for the chosen Sentinel action. Move is two clicks: the Sentinel, then its destination.
export function sentinelPicks(legal: Action[], sub: Sub | null, from: string | null, setFrom: (v: string | null) => void, act: (a: Action) => void): Pick[] {
  if (!sub) return [];
  if (sub === 'move') {
    const moves = legal.filter((a): a is Extract<Action, { type: 'moveSentinel' }> => a.type === 'moveSentinel');
    if (!from) return [...new Set(moves.map((m) => m.from))].map((id) => ({ kind: 'vertex', id, go: () => setFrom(id) }));
    return moves.filter((m) => m.from === from).map((m) => ({ kind: 'vertex', id: m.to, go: () => act(m) }));
  }
  return legal.filter((a) => a.type === TYPE[sub]).map((a) => ({ kind: 'vertex', id: (a as { vertex: string }).vertex, go: () => act(a) }));
}
