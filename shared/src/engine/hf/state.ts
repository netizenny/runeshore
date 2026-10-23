import type { Commodity, GameState, HFState, PlayerId, Resource, Track } from '../../types';
import { ARCANA, COMMODITIES, HF_BANK_EACH, isCommodity } from '../../constants';
import { shuffle } from '../../rng';

export const TRACKS: Track[] = ['lore', 'guild', 'crown'];
const per = <T>(f: () => T): Record<Track, T> => ({ lore: f(), guild: f(), crown: f() });
const zeroCom = (): Record<Commodity, number> => ({ vellum: 0, silk: 0, sigil: 0 });

export function initHF(players: PlayerId[], rng: number): [HFState, number] {
  const arcanaDecks = per<string[]>(() => []);
  for (const t of TRACKS) [arcanaDecks[t], rng] = shuffle(ARCANA.filter((c) => c.track === t).flatMap((c) => Array<string>(c.count).fill(c.key)), rng);
  const hf: HFState = {
    fleetPos: 0,
    shadeActive: false,
    eventDie: null,
    bank: Object.fromEntries(COMMODITIES.map((c) => [c, HF_BANK_EACH])) as Record<Commodity, number>,
    players: Object.fromEntries(
      players.map((id) => [id, { commodities: zeroCom(), level: per(() => 0), arcana: [], shields: 0, extraRenown: 0 }]),
    ),
    sentinels: {},
    bulwarks: [],
    spires: per(() => null),
    peddler: null,
    arcanaDecks,
    turnFlags: {},
  };
  return [hf, rng];
}

export const hfPlayer = (s: GameState, id: PlayerId) => s.hf!.players[id];

// The hand and the bank that hold card kind k.
export function stocks(s: GameState, id: PlayerId, k: Resource | Commodity): { hand: Record<string, number>; bank: Record<string, number> } {
  return isCommodity(k)
    ? { hand: hfPlayer(s, id).commodities, bank: s.hf!.bank }
    : { hand: s.players.find((p) => p.id === id)!.hand, bank: s.bank };
}

// Each Bulwark on one of the player's citadels raises their discard limit by 2.
export const discardLimitFor = (s: GameState, id: PlayerId) =>
  s.settings.discardLimit + 2 * (s.hf?.bulwarks.filter((v) => s.buildings[v]?.owner === id).length ?? 0);
