import type { OmenKind, Resource, ResourceCounts, Terrain } from './types';

export const RESOURCES: Resource[] = ['clay', 'timber', 'fleece', 'harvest', 'starmetal'];

export const emptyCounts = (): ResourceCounts => ({ clay: 0, timber: 0, fleece: 0, harvest: 0, starmetal: 0 });

const cost = (c: Partial<ResourceCounts>): ResourceCounts => ({ ...emptyCounts(), ...c });

export const COSTS = {
  path: cost({ clay: 1, timber: 1 }),
  outpost: cost({ clay: 1, timber: 1, fleece: 1, harvest: 1 }),
  citadel: cost({ harvest: 2, starmetal: 3 }),
  omen: cost({ fleece: 1, harvest: 1, starmetal: 1 }),
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
  warden: 'Warden: move the Shade and steal',
  relic: 'Relic: 1 hidden Renown',
  waymaking: 'Waymaking: lay 2 paths free',
  bounty: 'Bounty: take any 2 from the bank',
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
