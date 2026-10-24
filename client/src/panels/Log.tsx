import { useEffect, useRef } from 'react';
import { ARCANA_BY_KEY, OMEN_NAME, type GameEvent, type PlayerView } from '@runeshore/shared';
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
      case 'produced': {
        const who = Object.entries(e.gains);
        return who.length ? <>{who.map(([id, c]) => <span key={id}>{n(id)} got <Cards c={c} /> </span>)}</> : 'The land yields to no one';
      }
      case 'discarded': return `${n(e.player)} cast off ${e.count} cards`;
      case 'shadeMoved': return `${n(e.player)} moved the Shade`;
      case 'stole': return <>{n(e.thief)} stole {e.resource ? <Cards c={{ [e.resource]: 1 }} /> : 'a card'} from {n(e.victim)}</>;
      case 'built': return `${n(e.player)} raised ${e.piece === 'outpost' ? 'an' : 'a'} ${e.piece}`;
      case 'omenBought': return `${n(e.player)} drew a Rune`;
      case 'omenPlayed': return `${n(e.player)} played ${OMEN_NAME[e.kind]}`;
      case 'traded': return <>{n(e.a)} traded <Cards c={e.aGave} /> with {e.b === 'bank' ? 'the vault' : n(e.b)} for <Cards c={e.bGave} /></>;
      case 'awardChanged': return `${e.award === 'longestPath' ? 'Longest Trail' : 'Warlord'} ${e.player ? `goes to ${n(e.player)}` : 'is lost'}`;
      case 'eventDie': return `Event die: ${e.face}`;
      case 'sentinel': return `${n(e.player)}'s Sentinel ${e.did}`;
      case 'fleetAdvanced': return `The Hollow Fleet advances to ${e.pos}`;
      case 'fleetAttack': return `The Hollow Fleet attacks (${e.strength} vs ${e.defence}): ${e.held ? 'held' : 'it breaks through'}`;
      case 'shieldAwarded': return `${n(e.player)} wins a Shield of the shore`;
      case 'citadelLost': return `${n(e.player)} loses a Citadel`;
      case 'arcanaDrawn': return `${n(e.player)} draws a ${e.track} Arcana`;
      case 'arcanaPlayed': return `${n(e.player)} plays ${ARCANA_BY_KEY[e.card]?.name ?? e.card}`;
      case 'arcanaGave': return `${n(e.from)} gives ${e.count} to ${e.to === 'bank' ? 'the vault' : n(e.to)}`;
      case 'peddlerPlaced': return `${n(e.player)} places the Peddler`;
      case 'improved': return `${n(e.player)} improves ${e.track} to ${e.level}`;
      case 'spire': return `${n(e.player)} raises the ${e.track} Spire`;
      case 'turnEnded':
      case 'autoActed': return null;
      case 'won': return `${n(e.player)} wins!`;
    }
  };
  return (
    <div className="log">
      {view.log.map((e, i) => { const l = line(e); return l && <p key={i}>{l}</p>; })}
      <div ref={end} />
    </div>
  );
}
