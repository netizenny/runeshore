import { RESOURCES, emptyCounts, type Action, type PlayerView, type ResourceCounts } from '@runeshore/shared';
import { useEffect, useRef } from 'react';
import { Cards } from './util';
import { play } from '../sound';

// What `need` has that `hand` lacks.
const missing = (need: ResourceCounts, hand: ResourceCounts) => {
  const m = emptyCounts();
  for (const r of RESOURCES) m[r] = Math.max(0, need[r] - hand[r]);
  return m;
};
const lacks = (m: ResourceCounts) => RESOURCES.some((r) => m[r]);

// Incoming offers are a centred card with a chime; your own stack under the trade drawer. "You give" = cards leaving you, "You get" = cards coming to you, for everyone.
export function Offers({ view, legal, act, scope }: { view: PlayerView; legal: Action[]; act(a: Action): void; scope: 'incoming' | 'own' }) {
  const hand = view.players.find((p) => p.id === view.you)!.hand!;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name;
  const offers = view.offers.filter((o) => o.from === view.you || o.to === 'all' || o.to.includes(view.you));
  const seen = useRef(new Set<string>());
  useEffect(() => {
    if (scope !== 'incoming') return;
    const fresh = offers.filter((o) => o.from !== view.you && !seen.current.has(o.id));
    fresh.forEach((o) => seen.current.add(o.id));
    if (fresh.length) play('chime');
  });
  const shown = offers.filter((o) => (o.from === view.you) === (scope === 'own'));
  if (!shown.length) return null;
  return (
    <div className="offers" data-scope={scope} role="status" aria-live="polite">
      {shown.map((o) => {
        const own = o.from === view.you;
        const short = missing(own ? o.give : o.get, hand);
        const waiting = (o.to === 'all' ? view.players.map((p) => p.id) : o.to).filter((p) => p !== view.you && !o.accepted.includes(p) && !o.declined.includes(p));
        return (
          <div key={o.id} className="offer" data-incoming={!own}>
            <b>{own ? 'Your offer' : `${name(o.from)} offers`}</b>
            <div className="line"><b>You give →</b> <Cards c={own ? o.give : o.get} /></div>
            <div className="line"><b>You get ←</b> <Cards c={own ? o.get : o.give} /></div>
            {own ? (
              <>
                {o.declined.map((p) => <small key={p} className="declined">{name(p)} declined</small>)}
                {o.accepted.map((p) => {
                  const ok = legal.some((a) => a.type === 'confirmTrade' && a.offerId === o.id && a.partner === p);
                  return (
                    <div key={p} className="line">
                      <small className="accepted">{name(p)} accepted</small>
                      <button disabled={!ok} onClick={() => act({ type: 'confirmTrade', offerId: o.id, partner: p })}>Trade with {name(p)}</button>
                      {!ok && <small className="why">{lacks(short) ? <>You need <Cards c={short} /></> : `${name(p)} can no longer pay`}</small>}
                    </div>
                  );
                })}
                {waiting.length > 0 && <small className="waiting">Waiting for {waiting.map(name).join(', ')}</small>}
                <button onClick={() => act({ type: 'cancelTrade', offerId: o.id })}>Cancel</button>
              </>
            ) : (
              <>
                {lacks(short) && <small className="why">You need <Cards c={short} /></small>}
                <div className="answer"><button className="yes" aria-label="Accept" disabled={lacks(short)} data-on={o.accepted.includes(view.you)} onClick={() => act({ type: 'respondTrade', offerId: o.id, accept: true })}>✓<span> Accept</span></button>
                <button className="no" aria-label="Decline" data-on={o.declined.includes(view.you)} onClick={() => act({ type: 'respondTrade', offerId: o.id, accept: false })}>✗<span> Decline</span></button></div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
