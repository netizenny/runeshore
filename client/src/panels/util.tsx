import { COMMODITIES, RESOURCES, type Commodity, type ResourceCounts } from '@runeshore/shared';
import { ResIcon } from '../board/art';

// Compact "2 [glyph] 1 [glyph]" for a set of cards.
export const Cards = ({ c }: { c: Partial<ResourceCounts & Record<Commodity, number>> }) => (
  <span className="cards">
    {RESOURCES.filter((r) => c[r]).map((r) => <span key={r}>{c[r]}<ResIcon r={r} size={26} /></span>)}
    {COMMODITIES.filter((k) => c[k]).map((k) => <span key={k}>{c[k]} {k}</span>)}
  </span>
);

export const Stepper = ({ value, max, onChange }: { value: number; max: number; onChange(n: number): void }) => (
  <span className="step">
    <button disabled={value <= 0} onClick={() => onChange(value - 1)} aria-label="less">−</button>
    <b>{value}</b>
    <button disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="more">+</button>
  </span>
);
