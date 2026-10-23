import { useEffect, useRef } from 'react';
import type { GameEvent, PlayerView } from '@runeshore/shared';
import { Cards } from './util';

export function Log({ view }: { view: PlayerView }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [view.log.length]);
  const n = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const line = (e: GameEvent) => {
    switch (e.type) {
      case 'rolled': return `${n(e.player)} rolled ${e.dice[0] + e.dice[1]}`;
      case 'produced': return `The land yields to ${Object.keys(e.gains).map(n).join(', ') || 'no one'}`;
      case 'discarded': return `${n(e.player)} cast off ${e.count} cards`;
      case 'shadeMoved': return `${n(e.player)} moved the Shade`;
      case 'stole': return `${n(e.thief)} stole ${e.resource ?? 'a card'} from ${n(e.victim)}`;
      case 'built': return `${n(e.player)} raised ${e.piece === 'outpost' ? 'an' : 'a'} ${e.piece}`;
      case 'omenBought': return `${n(e.player)} drew an Omen`;
      case 'omenPlayed': return `${n(e.player)} played ${e.kind}`;
      case 'traded': return <>{n(e.a)} traded <Cards c={e.aGave} /> with {e.b === 'bank' ? 'the bank' : n(e.b)} for <Cards c={e.bGave} /></>;
      case 'awardChanged': return `${e.award === 'longestPath' ? 'Longest Path' : 'Grand Host'} ${e.player ? `goes to ${n(e.player)}` : 'is lost'}`;
      case 'turnEnded': return `${n(e.player)} ended their turn`;
      case 'autoActed': return `${n(e.player)} ran out of time`;
      case 'won': return `${n(e.player)} wins!`;
    }
  };
  return (
    <div className="log">
      {view.log.map((e, i) => <p key={i}>{line(e)}</p>)}
      <div ref={end} />
    </div>
  );
}
