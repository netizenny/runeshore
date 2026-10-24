import type { ArcanaCard, GameEvent, GameState, HFState, PlayerId, PlayerState, ResourceCounts, Track } from './types';

export type PlayerViewPlayer = Omit<PlayerState, 'hand' | 'omens'> & {
  handCount: number;
  omenCount: number;
  hand?: ResourceCounts; // viewer only
  omens?: PlayerState['omens']; // viewer only
};
// Arcana hands and stack order stay on the server; others see counts only.
export type HFView = Omit<HFState, 'players' | 'arcanaDecks'> & {
  players: Record<PlayerId, Omit<HFState['players'][PlayerId], 'arcana'> & { arcanaCount: number; arcana?: ArcanaCard[] }>;
  arcanaDeckCounts: Record<Track, number>;
};
export type PlayerView = Omit<GameState, 'seed' | 'rngState' | 'omenDeck' | 'players' | 'hf'> & {
  hf?: HFView;
  omenDeckCount: number;
  players: PlayerViewPlayer[];
  you: PlayerId;
};

const sum = (c: ResourceCounts) => c.clay + c.timber + c.fleece + c.harvest + c.starmetal;

// Third parties see that a steal happened, not which card.
export const eventFor = (e: GameEvent, viewer: PlayerId): GameEvent =>
  e.type === 'stole' && viewer !== e.thief && viewer !== e.victim ? { ...e, resource: null } : e;

export function viewFor(s: GameState, viewer: PlayerId): PlayerView {
  const { seed: _seed, rngState: _rng, omenDeck, players, log, hf, ...rest } = s;
  return {
    ...structuredClone(rest),
    omenDeckCount: omenDeck.length,
    ...(hf && { hf: hfViewFor(s, hf, viewer) }),
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

function hfViewFor(s: GameState, hf: HFState, viewer: PlayerId): HFView {
  const { players, arcanaDecks, turnFlags, ...rest } = structuredClone(hf);
  const { alchemist: _hidden, ...flags } = turnFlags; // the chosen dice stay secret until rolled
  return {
    ...rest,
    turnFlags: viewer === s.order[s.current] ? turnFlags : flags,
    players: Object.fromEntries(
      Object.entries(players).map(([id, { arcana, ...p }]) => [id, { ...p, arcanaCount: arcana.length, ...(id === viewer ? { arcana } : {}) }]),
    ),
    arcanaDeckCounts: { lore: arcanaDecks.lore.length, guild: arcanaDecks.guild.length, crown: arcanaDecks.crown.length },
  };
}
