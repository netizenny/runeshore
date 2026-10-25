import { useState } from 'react';
import { COMMODITIES, RESOURCES, emptyCounts, isCommodity, tradeRatio, type Action, type Commodity, type GameState, type PlayerView, type Resource, type ResourceCounts } from '@runeshore/shared';
import { ResIcon } from '../board/art';

// Click a resource to add one; click a chip in the tray to take one back.
function Pick({ label, hand, value, max, onChange }: { label: string; hand: boolean; value: ResourceCounts; max(r: Resource): number; onChange(c: ResourceCounts): void }) {
  const add = (r: Resource) => value[r] < max(r) && onChange({ ...value, [r]: value[r] + 1 });
  const drop = (r: Resource) => onChange({ ...value, [r]: value[r] - 1 });
  const tray = RESOURCES.flatMap((r) => Array.from({ length: value[r] }, (_, i) => [r, i] as const));
  return (
    <div className="pick-row">
      <b>{label}</b>
      <div className="row">{RESOURCES.map((r) => <button key={r} disabled={!max(r) || (hand && value[r] >= max(r))} onClick={() => add(r)}><ResIcon r={r} size={18} /></button>)}</div>
      <div className="tray">{tray.length ? tray.map(([r, i]) => <button key={r + i} onClick={() => drop(r)} title="Remove one"><ResIcon r={r} size={16} /></button>) : <small>click a card</small>}</div>
    </div>
  );
}

export function Trade({ view, legal, act }: { view: PlayerView; legal: Action[]; act(a: Action): void }) {
  const hand = view.players.find((p) => p.id === view.you)!.hand!;
  const mine = view.order[view.current] === view.you && view.phase.k === 'main';
  const [give, setGive] = useState(emptyCounts);
  const [get, setGet] = useState(emptyCounts);
  const bank = legal.filter((a): a is Extract<Action, { type: 'bankTrade' }> => a.type === 'bankTrade');
  const ratio = (r: Resource | Commodity) => tradeRatio(view as unknown as GameState, view.you, r); // reads only board and buildings
  const kinds: (Resource | Commodity)[] = view.hf ? [...RESOURCES, ...COMMODITIES] : RESOURCES;
  const ok = RESOURCES.some((r) => give[r]) && RESOURCES.some((r) => get[r]) && RESOURCES.every((r) => !(give[r] && get[r]));
  const send = () => {
    act({ type: 'offerTrade', give, get, to: 'all' });
    setGive(emptyCounts());
    setGet(emptyCounts());
  };

  const [tab, setTab] = useState<'players' | 'bank'>('players');
  const from = kinds.filter((g) => bank.some((a) => a.give === g));

  if (!mine) return <div className="trade"><h3>Trade</h3><small>Wait for your turn to offer. Incoming offers show top right.</small></div>;
  return (
    <div className="trade">
      <div className="row">
        <button data-on={tab === 'players'} onClick={() => setTab('players')}>Players</button>
        <button data-on={tab === 'bank'} onClick={() => setTab('bank')}>Vault / ports</button>
      </div>
      {tab === 'players' ? (
        <>
          <Pick label="GIVE" hand value={give} max={(r) => hand[r]} onChange={setGive} />
          <Pick label="GET" hand={false} value={get} max={() => 9} onChange={setGet} />
          <button className="go" disabled={!ok} onClick={send}>Offer to everyone</button>
        </>
      ) : from.length ? from.map((g) => (
        <div key={g} className="row">{isCommodity(g) ? g : <ResIcon r={g} />} {ratio(g)}:1 →
          {kinds.filter((r) => bank.some((a) => a.give === g && a.get === r)).map((r) => (
            <button key={r} onClick={() => act({ type: 'bankTrade', give: g, get: r })}>{isCommodity(r) ? r : <ResIcon r={r} size={14} />}</button>
          ))}
        </div>
      )) : <small>Nothing to trade with the vault yet.</small>}
    </div>
  );
}
