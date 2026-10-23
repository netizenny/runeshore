import type { Commodity, OmenKind, Resource, ResourceCounts, Terrain } from './types';

export const RESOURCES: Resource[] = ['clay', 'timber', 'fleece', 'harvest', 'starmetal'];

export const COMMODITIES: Commodity[] = ['vellum', 'silk', 'sigil'];
export const isCommodity = (k: string): k is Commodity => (COMMODITIES as string[]).includes(k);
// A citadel on this terrain pays one base card plus one commodity (clay and harvest pay 2 base).
export const COMMODITY_OF: Partial<Record<Resource, Commodity>> = { timber: 'vellum', fleece: 'silk', starmetal: 'sigil' };
export const HF_BANK_EACH = 12;
export const FLEET_TRACK = 7;
export const SENTINELS_PER_RANK = 2;
export const BULWARKS_MAX = 3;
export const ARCANA_PER_TRACK = 18;

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
};

export const PIECES = { path: 15, outpost: 5, citadel: 4 };
export const BANK_EACH = 19;

const rep = <T>(x: T, n: number): T[] => Array<T>(n).fill(x);

export const OMEN_DECK: OmenKind[] = [
  ...rep<OmenKind>('warden', 14),
  ...rep<OmenKind>('relic', 5),
  ...rep<OmenKind>('waymaking', 2),
  ...rep<OmenKind>('bounty', 2),
  ...rep<OmenKind>('hoard', 2),
];

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

export const OMEN_NAME: Record<OmenKind, string> = { warden: 'Warriors', relic: 'Relic', waymaking: 'Twin Paths', bounty: 'Bounty', hoard: 'Hoard' };
