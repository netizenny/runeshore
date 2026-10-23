import { RESOURCES, type ResourceCounts } from '@runeshore/shared';
import { ResIcon } from '../board/art';

export const Hand = ({ hand }: { hand: ResourceCounts }) => (
  <div className="hand">
    {RESOURCES.map((r) => (
      <div key={r} className={`card ${r}`} data-empty={!hand[r]}>
        <ResIcon r={r} size={28} />
        <b>{hand[r]}</b>
        <small>{r}</small>
      </div>
    ))}
  </div>
);
