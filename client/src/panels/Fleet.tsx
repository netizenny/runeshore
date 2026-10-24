import { FLEET_TRACK, type HFView } from '@runeshore/shared';

const FACE = { ship: '⛵ ship', lore: 'Lore', guild: 'Guild', crown: 'Crown' } as const;

// The Hollow Fleet creeps along the track; at the end it attacks.
export const Fleet = ({ hf }: { hf: HFView }) => (
  <div className="fleet" title="The Hollow Fleet attacks when it reaches the end of the track">
    {Array.from({ length: FLEET_TRACK + 1 }, (_, i) => (
      <span key={i} className="step-cell" data-here={i === hf.fleetPos} data-end={i === FLEET_TRACK}>{i === hf.fleetPos ? '⛵' : i === FLEET_TRACK ? '☠' : '·'}</span>
    ))}
    {hf.eventDie && <small>event: {FACE[hf.eventDie]}</small>}
    {!hf.shadeActive && <small>Shade asleep</small>}
  </div>
);
