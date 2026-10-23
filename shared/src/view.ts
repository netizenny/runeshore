import type { GameEvent, GameState, PlayerId, PlayerState, ResourceCounts } from './types';

export type PlayerViewPlayer = Omit<PlayerState, 'hand' | 'omens'> & {
  handCount: number;
  omenCount: number;
  hand?: ResourceCounts; // viewer only
  omens?: PlayerState['omens']; // viewer only
};
export type PlayerView = Omit<GameState, 'seed' | 'rngState' | 'omenDeck' | 'players'> & {
  omenDeckCount: number;
  players: PlayerViewPlayer[];
  you: PlayerId;
};

const sum = (c: ResourceCounts) => c.clay + c.timber + c.fleece + c.harvest + c.starmetal;

// Third parties see that a steal happened, not which card.
export const eventFor = (e: GameEvent, viewer: PlayerId): GameEvent =>
  e.type === 'stole' && viewer !== e.thief && viewer !== e.victim ? { ...e, resource: null } : e;

export function viewFor(s: GameState, viewer: PlayerId): PlayerView {
  const { seed: _seed, rngState: _rng, omenDeck, players, log, ...rest } = s;
  return {
    ...structuredClone(rest),
    omenDeckCount: omenDeck.length,
    log: log.map((e) => eventFor(e, viewer)),
    players: players.map(({ hand, omens, ...p }) => ({
      ...structuredClone(p),
      handCount: sum(hand),
      omenCount: omens.length,
      ...(p.id === viewer ? { hand: { ...hand }, omens: structuredClone(omens) } : {}),
    })),
    you: viewer,
  };
}
