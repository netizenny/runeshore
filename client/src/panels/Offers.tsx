import type { Action, PlayerView } from '@runeshore/shared';
import { Cards } from './util';

// Open offers, always visible left of the scoreboard. GIVE = cards leaving you, GET = cards coming to you.
export function Offers({ view, legal, act }: { view: PlayerView; legal: Action[]; act(a: Action): void }) {
  const name = (id: string) => view.players.find((p) => p.id === id)?.name;
  const offers = view.offers.filter((o) => o.from === view.you || o.to === 'all' || o.to.includes(view.you));
  if (!offers.length) return null;
  return (
    <div className="offers">
      {offers.map((o) => {
        const own = o.from === view.you;
        return (
          <div key={o.id} className="offer">
            <b>{own ? 'Your offer' : `${name(o.from)} offers`}</b>
            <div><b>GIVE</b> <Cards c={own ? o.give : o.get} /></div>
            <div><b>GET</b> <Cards c={own ? o.get : o.give} /></div>
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
                <button data-on={o.accepted.includes(view.you)} onClick={() => act({ type: 'respondTrade', offerId: o.id, accept: true })}>Accept</button>
                <button data-on={o.declined.includes(view.you)} onClick={() => act({ type: 'respondTrade', offerId: o.id, accept: false })}>Decline</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
