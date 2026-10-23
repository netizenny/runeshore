import { useState } from 'react';
import { RESOURCES, emptyCounts, tradeRatio, type Action, type GameState, type PlayerView, type Resource } from '@runeshore/shared';
import { ResIcon } from '../board/art';
import { Cards, Stepper } from './util';

export function Trade({ view, legal, act }: { view: PlayerView; legal: Action[]; act(a: Action): void }) {
  const hand = view.players.find((p) => p.id === view.you)!.hand!;
  const mine = view.order[view.current] === view.you && view.phase.k === 'main';
  const [give, setGive] = useState(emptyCounts);
  const [get, setGet] = useState(emptyCounts);
  const [to, setTo] = useState<string[]>([]);
  const others = view.players.filter((p) => p.id !== view.you);
  const name = (id: string) => view.players.find((p) => p.id === id)?.name;
  const bank = legal.filter((a): a is Extract<Action, { type: 'bankTrade' }> => a.type === 'bankTrade');
  const ratio = (r: Resource) => tradeRatio(view as unknown as GameState, view.you, r); // reads only board and buildings
  const offers = view.offers.filter((o) => o.from === view.you || o.to === 'all' || o.to.includes(view.you));
  const ok = RESOURCES.some((r) => give[r]) && RESOURCES.some((r) => get[r]) && RESOURCES.every((r) => !(give[r] && get[r]));
  const toggle = (id: string) => setTo(to.includes(id) ? to.filter((x) => x !== id) : [...to, id]);
  const send = () => {
    act({ type: 'offerTrade', give, get, to: to.length ? to : 'all' });
    setGive(emptyCounts());
    setGet(emptyCounts());
    setTo([]);
  };

  return (
    <div className="trade">
      <h3>Trade</h3>
      {offers.map((o) => (
        <div key={o.id} className="offer">
          <b>{o.from === view.you ? 'You' : name(o.from)}</b> give <Cards c={o.give} /> for <Cards c={o.get} />
          {o.from === view.you ? (
            <>
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
      ))}
      {mine && (
        <>
          <h4>Offer to players</h4>
          {RESOURCES.map((r) => (
            <div key={r} className="row"><ResIcon r={r} /> give <Stepper value={give[r]} max={hand[r]} onChange={(v) => setGive({ ...give, [r]: v })} /> get <Stepper value={get[r]} max={9} onChange={(v) => setGet({ ...get, [r]: v })} /></div>
          ))}
          <div className="row">To: {others.map((p) => <label key={p.id}><input type="checkbox" checked={to.includes(p.id)} onChange={() => toggle(p.id)} />{p.name}</label>)} {!to.length && <small>(everyone)</small>}</div>
          <button disabled={!ok} onClick={send}>Send offer</button>
          <h4>Bank and ports</h4>
          {RESOURCES.map((g) => (
            <div key={g} className="row"><ResIcon r={g} /> {ratio(g)}:1 →
              {RESOURCES.filter((r) => r !== g).map((r) => (
                <button key={r} disabled={!bank.some((a) => a.give === g && a.get === r)} onClick={() => act({ type: 'bankTrade', give: g, get: r })}><ResIcon r={r} size={14} /></button>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
