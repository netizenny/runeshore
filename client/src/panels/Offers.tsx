import type { Action, PlayerView } from '@runeshore/shared';
import { useEffect, useRef } from 'react';
import { Cards } from './util';
import { play } from '../sound';

// Incoming offers are a centred card with a chime; your own sit beside the sidebar. "You give" = cards leaving you, "You get" = cards coming to you, for everyone.
export function Offers({ view, legal, act }: { view: PlayerView; legal: Action[]; act(a: Action): void }) {
  const name = (id: string) => view.players.find((p) => p.id === id)?.name;
  const offers = view.offers.filter((o) => o.from === view.you || o.to === 'all' || o.to.includes(view.you));
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const fresh = offers.filter((o) => o.from !== view.you && !seen.current.has(o.id));
    fresh.forEach((o) => seen.current.add(o.id));
    if (fresh.length) play('chime');
  });
  if (!offers.length) return null;
  return (
    <div className="offers" role="status" aria-live="polite">
      {offers.map((o) => {
        const own = o.from === view.you;
        return (
          <div key={o.id} className="offer" data-incoming={!own}>
            <b>{own ? 'Your offer' : `${name(o.from)} offers`}</b>
            <div className="line"><b>You give →</b> <Cards c={own ? o.give : o.get} /></div>
            <div className="line"><b>You get ←</b> <Cards c={own ? o.get : o.give} /></div>
            {own ? (
              <>
                {o.declined.map((p) => <small key={p} className="declined">{name(p)} declined</small>)}
                {o.accepted.map((p) => (
                  <button key={p} disabled={!legal.some((a) => a.type === 'confirmTrade' && a.offerId === o.id && a.partner === p)} onClick={() => act({ type: 'confirmTrade', offerId: o.id, partner: p })}>Trade with {name(p)}</button>
                ))}
                <button onClick={() => act({ type: 'cancelTrade', offerId: o.id })}>Cancel</button>
              </>
            ) : (
              <>
                <div className="answer"><button className="yes" aria-label="Accept" data-on={o.accepted.includes(view.you)} onClick={() => act({ type: 'respondTrade', offerId: o.id, accept: true })}>✓<span> Accept</span></button>
                <button className="no" aria-label="Decline" data-on={o.declined.includes(view.you)} onClick={() => act({ type: 'respondTrade', offerId: o.id, accept: false })}>✗<span> Decline</span></button></div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
