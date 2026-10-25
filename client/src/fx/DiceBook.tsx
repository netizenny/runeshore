import { useEffect, useState } from 'react';

const FLIP_MS = 1500;
const face = () => 1 + Math.floor(Math.random() * 6);

// A spellbook whose leaves flip on every new turn, then rests open: left page = first die, right page = second.
export function DiceBook({ dice, turn }: { dice: number[] | null; turn: number }) {
  const [flipping, setFlipping] = useState(true);
  const [blur, setBlur] = useState<[number, number]>([face(), face()]);
  useEffect(() => {
    setFlipping(true);
    const t = setTimeout(() => setFlipping(false), FLIP_MS);
    return () => clearTimeout(t);
  }, [turn]);
  useEffect(() => {
    if (!flipping) return;
    const i = setInterval(() => setBlur([face(), face()]), 90);
    return () => clearInterval(i);
  }, [flipping]);

  const [a, b] = flipping ? blur : dice ?? ['?', '?'];
  return (
    <div className="tome" data-flip={flipping} key={flipping ? 'f' + turn : 'r'} title="Dice">
      <div className="tome-page l"><span>{a}</span></div>
      <div className="tome-page r"><span>{b}</span></div>
      {flipping && [0, 1, 2, 3, 4].map((i) => <div key={i} className="tome-leaf" style={{ animationDelay: `${i * 0.24}s` }} />)}
      {!flipping && dice && <small>{dice[0] + dice[1]}</small>}
    </div>
  );
}
