import type { Action, PlayerView } from '@runeshore/shared';

export function ShadeSteal({ view, legal, act }: { view: PlayerView; legal: Action[]; act(a: Action): void }) {
  return (
    <div className="modal">
      <h3>Steal from whom?</h3>
      {legal.map((a) => a.type === 'steal' && (
        <button key={a.victim} onClick={() => act(a)}>{view.players.find((p) => p.id === a.victim)?.name}</button>
      ))}
    </div>
  );
}
