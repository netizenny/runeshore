import { useState } from 'react';
import type { PlayerView } from '@runeshore/shared';

// How often each dice sum has come up this game, counted from the log.
export function DiceStats({ view }: { view: PlayerView }) {
  const [open, setOpen] = useState(false);
  const count: number[] = Array(13).fill(0);
  for (const e of view.log) if (e.type === 'rolled') count[e.dice[0] + e.dice[1]]++;
  return (
    <div className="dice-stats">
      <button data-on={open} title="Dice roll totals" onClick={() => setOpen(!open)}>🎲</button>
      {open && (
        <table>
          <tbody>
            {count.map((c, sum) => sum >= 2 && <tr key={sum}><td>{sum}</td><td>{c}</td></tr>)}
          </tbody>
        </table>
      )}
    </div>
  );
}
