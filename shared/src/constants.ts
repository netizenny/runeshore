import type { Commodity, Track, OmenKind, Resource, ResourceCounts, Terrain } from './types';

export const RESOURCES: Resource[] = ['clay', 'timber', 'fleece', 'harvest', 'starmetal'];

export const COMMODITIES: Commodity[] = ['vellum', 'silk', 'sigil'];
export const isCommodity = (k: string): k is Commodity => (COMMODITIES as string[]).includes(k);
// A citadel on this terrain pays one base card plus one commodity (clay and harvest pay 2 base).
export const COMMODITY_OF: Partial<Record<Resource, Commodity>> = { timber: 'vellum', fleece: 'silk', starmetal: 'sigil' };
export const HF_BANK_EACH = 12;
export const FLEET_TRACK = 7;
export const SENTINELS_PER_RANK = 2;
export const BULWARKS_MAX = 3;
export const IMPROVE_MAX = 5;
export const SPIRE_LEVEL = 4; // first to reach it claims the track's Spire
export const TRACK_COMMODITY: Record<Track, Commodity> = { lore: 'vellum', guild: 'silk', crown: 'sigil' };
export const ARCANA_PER_TRACK = 18;
export const ARCANA_HAND_MAX = 4;

export interface ArcanaDef { key: string; name: string; track: Track; count: number; text: string }
// Runeshore names for the 54 Arcana (18 per suit). Lore<->science, Guild<->trade, Crown<->politics.
export const ARCANA: ArcanaDef[] = [
  { key: 'alchemist', name: 'Fatecaster', track: 'lore', count: 2, text: 'Before you roll: choose the result of both dice.' },
  { key: 'crane', name: 'Winch', track: 'lore', count: 2, text: 'Your next improvement this turn costs 1 less commodity.' },
  { key: 'engineer', name: 'Mason', track: 'lore', count: 1, text: 'Build a Bulwark free.' },
  { key: 'inventor', name: 'Tinkerer', track: 'lore', count: 2, text: 'Swap two number tokens (not 2, 6, 8 or 12).' },
  { key: 'irrigation', name: 'Floodgate', track: 'lore', count: 2, text: 'Take 2 Harvest for each Harvest hex beside your buildings.' },
  { key: 'medicine', name: 'Apothecary', track: 'lore', count: 2, text: 'Upgrade an Outpost to a Citadel for 2 Starmetal and 1 Harvest.' },
  { key: 'mining', name: 'Deepdelve', track: 'lore', count: 2, text: 'Take 2 Starmetal for each Starmetal hex beside your buildings.' },
  { key: 'printer', name: 'Chronicle', track: 'lore', count: 1, text: '1 Glory. Played the moment you draw it.' },
  { key: 'roadbuilding', name: 'Wayfarers', track: 'lore', count: 2, text: 'Lay 2 Paths free.' },
  { key: 'smith', name: 'Forgemaster', track: 'lore', count: 2, text: 'Promote up to 2 of your Sentinels one rank, free.' },
  { key: 'harbor', name: 'Dockside Barter', track: 'guild', count: 2, text: 'Offer each opponent a resource; each with a commodity must swap one for it.' },
  { key: 'mastermerchant', name: 'Silver Tongue', track: 'guild', count: 2, text: 'Take 2 cards from a player with more Glory.' },
  { key: 'peddler', name: 'Peddler', track: 'guild', count: 6, text: 'Place the Peddler beside your building: 1 Glory and 2:1 trades in that resource.' },
  { key: 'merchantfleet', name: 'Trade Convoy', track: 'guild', count: 2, text: 'This turn one resource or commodity trades 2:1.' },
  { key: 'resmonopoly', name: 'Corner the Market', track: 'guild', count: 4, text: 'Name a resource; each opponent gives you 2 of it.' },
  { key: 'trademonopoly', name: 'Corner the Wares', track: 'guild', count: 2, text: 'Name a commodity; each opponent gives you 1 of it.' },
  { key: 'bishop', name: 'Cleric', track: 'crown', count: 2, text: 'Move the Shade; steal 1 card from each opponent beside it.' },
  { key: 'constitution', name: 'Charter', track: 'crown', count: 1, text: '1 Glory. Played the moment you draw it.' },
  { key: 'deserter', name: 'Turncoat', track: 'crown', count: 2, text: 'An opponent removes a Sentinel of their choice; you may place one of the same rank.' },
  { key: 'diplomat', name: 'Envoy', track: 'crown', count: 2, text: 'Remove an open Path. If it was yours, you may lay it again free.' },
  { key: 'intrigue', name: 'Plot', track: 'crown', count: 2, text: 'Displace an opponent Sentinel beside your Path; you may place a Basic one there.' },
  { key: 'saboteur', name: 'Wrecker', track: 'crown', count: 2, text: 'Each opponent with as much Glory as you discards half their cards.' },
  { key: 'spy', name: 'Informant', track: 'crown', count: 3, text: "Look at an opponent's Arcana and take one." },
  { key: 'warlord', name: 'Warcry', track: 'crown', count: 2, text: 'Activate all your Sentinels free.' },
  { key: 'wedding', name: 'Dowry', track: 'crown', count: 2, text: 'Each opponent with more Glory gives you 2 cards.' },
];
export const ARCANA_BY_KEY: Record<string, ArcanaDef> = Object.fromEntries(ARCANA.map((c) => [c.key, c]));
// Glory cards are played face up the moment they are drawn and never held.
export const ARCANA_INSTANT = ['printer', 'constitution'];
export const MEDICINE_COST = { clay: 0, timber: 0, fleece: 0, harvest: 1, starmetal: 2 };
export const INVENTOR_FIXED = [2, 6, 8, 12];

export const emptyCounts = (): ResourceCounts => ({ clay: 0, timber: 0, fleece: 0, harvest: 0, starmetal: 0 });

const cost = (c: Partial<ResourceCounts>): ResourceCounts => ({ ...emptyCounts(), ...c });

export const COSTS = {
  path: cost({ clay: 1, timber: 1 }),
  outpost: cost({ clay: 1, timber: 1, fleece: 1, harvest: 1 }),
  citadel: cost({ harvest: 2, starmetal: 3 }),
  omen: cost({ fleece: 1, harvest: 1, starmetal: 1 }),
  sentinel: cost({ fleece: 1, starmetal: 1 }), // build and each promotion
  activate: cost({ harvest: 1 }),
  bulwark: cost({ clay: 2 }),
  boat: cost({ timber: 1, fleece: 1 }),
};

export const PIECES = { path: 15, outpost: 5, citadel: 4 };
export const BOATS_PER_PLAYER = 15;
export const LANDFALL_GLORY = 2;
export const BANK_EACH = 19;
export const BANK_EACH_BIG = 24; // 5-6 players: the extension adds 5 of each

const rep = <T>(x: T, n: number): T[] => Array<T>(n).fill(x);

export const OMEN_DECK: OmenKind[] = [
  ...rep<OmenKind>('warden', 14),
  ...rep<OmenKind>('relic', 5),
  ...rep<OmenKind>('waymaking', 2),
  ...rep<OmenKind>('bounty', 2),
  ...rep<OmenKind>('hoard', 2),
];
// 5-6 players: the extension adds 6 Warriors and one each of Twin Paths, Bounty and Hoard.
export const OMEN_DECK_BIG: OmenKind[] = [...OMEN_DECK, ...rep<OmenKind>('warden', 6), 'waymaking', 'bounty', 'hoard'];

export const OMEN_TEXT: Record<OmenKind, string> = {
  warden: 'Warriors: move the Shade and steal',
  relic: 'Relic: 1 hidden Glory',
  waymaking: 'Twin Paths: lay 2 paths free',
  bounty: 'Bounty: take any 2 from the vault',
  hoard: 'Hoard: take every card of one kind from the others',
};

export const TILES: Terrain[] = [
  ...rep<Terrain>('timber', 4),
  ...rep<Terrain>('fleece', 4),
  ...rep<Terrain>('harvest', 4),
  ...rep<Terrain>('clay', 3),
  ...rep<Terrain>('starmetal', 3),
  'ashen',
];

export const TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

export const PORTS: (Resource | 'any')[] = [...rep<Resource | 'any'>('any', 4), ...RESOURCES];

// Large board: 37 hexes (7 of each terrain, 2 ashen), 35 tokens, 11 ports.
export const TILES_LARGE: Terrain[] = [...RESOURCES.flatMap((r) => rep<Terrain>(r, 7)), 'ashen', 'ashen'];
export const TOKENS_LARGE = [2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 11, 12, 12];
export const PORTS_LARGE: (Resource | 'any')[] = [...rep<Resource | 'any'>('any', 6), ...RESOURCES];

export const OMEN_NAME: Record<OmenKind, string> = { warden: 'Warriors', relic: 'Relic', waymaking: 'Twin Paths', bounty: 'Bounty', hoard: 'Hoard' };
