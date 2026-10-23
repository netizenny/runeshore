export type Resource = 'clay' | 'timber' | 'fleece' | 'harvest' | 'starmetal';
export type Terrain = Resource | 'ashen';
export type ResourceCounts = Record<Resource, number>;
export type HexId = string; // "q,r"
export type VertexId = string;
export type EdgeId = string;
export type PlayerId = string;
export type OmenKind = 'warden' | 'relic' | 'waymaking' | 'bounty' | 'hoard';
export type PlayerColor = 'ember' | 'tide' | 'moss' | 'bone';

export interface Hex {
  id: HexId;
  q: number;
  r: number;
  terrain: Terrain;
  token: number | null;
}

export interface Port {
  edge: EdgeId;
  kind: Resource | 'any'; // 'any' = 3:1
}

export interface Board {
  hexes: Record<HexId, Hex>;
  ports: Port[];
}

export interface Settings {
  boardMode: 'random' | 'starter';
  renownTarget: number;
  discardLimit: number;
  turnTimerSec: 0 | 60 | 90 | 120;
}

export const DEFAULT_SETTINGS: Settings = {
  boardMode: 'random',
  renownTarget: 10,
  discardLimit: 7,
  turnTimerSec: 0,
};

export interface PlayerState {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  hand: ResourceCounts;
  omens: { kind: OmenKind; boughtTurn: number }[];
  wardensPlayed: number;
  piecesLeft: { path: number; outpost: number; citadel: number };
}

export type Phase =
  | { k: 'setup'; round: 1 | 2; step: 'outpost' | 'path'; lastOutpost?: VertexId }
  | { k: 'roll' }
  | { k: 'discard'; pending: Record<PlayerId, number> }
  | { k: 'moveShade'; then: 'roll' | 'main' }
  | { k: 'steal'; hex: HexId; victims: PlayerId[]; then: 'roll' | 'main' }
  | { k: 'main' }
  | { k: 'waymaking'; left: 1 | 2; then: 'roll' | 'main' }
  | { k: 'ended'; winner: PlayerId };

export interface TradeOffer {
  id: string;
  from: PlayerId;
  give: ResourceCounts;
  get: ResourceCounts;
  to: PlayerId[] | 'all';
  accepted: PlayerId[];
  declined: PlayerId[];
}

export interface GameState {
  seed: number;
  rngState: number;
  settings: Settings;
  board: Board;
  players: PlayerState[];
  order: PlayerId[];
  current: number;
  turn: number;
  phase: Phase;
  omenPlayedThisTurn: boolean;
  buildings: Record<VertexId, { owner: PlayerId; kind: 'outpost' | 'citadel' }>;
  paths: Record<EdgeId, PlayerId>;
  shadeHex: HexId;
  bank: ResourceCounts;
  omenDeck: OmenKind[];
  offers: TradeOffer[];
  longestPath: PlayerId | null;
  grandHost: PlayerId | null;
  dice: [number, number] | null;
  log: GameEvent[];
}

export type Action =
  | { type: 'placeOutpost'; vertex: VertexId }
  | { type: 'placePath'; edge: EdgeId }
  | { type: 'roll' }
  | { type: 'discard'; cards: ResourceCounts }
  | { type: 'moveShade'; hex: HexId }
  | { type: 'steal'; victim: PlayerId }
  | { type: 'buildPath'; edge: EdgeId }
  | { type: 'buildOutpost'; vertex: VertexId }
  | { type: 'buildCitadel'; vertex: VertexId }
  | { type: 'buyOmen' }
  | { type: 'playOmen'; kind: 'warden' }
  | { type: 'playOmen'; kind: 'waymaking' }
  | { type: 'playOmen'; kind: 'bounty'; pick: [Resource, Resource] }
  | { type: 'playOmen'; kind: 'hoard'; resource: Resource }
  | { type: 'bankTrade'; give: Resource; get: Resource }
  | { type: 'offerTrade'; give: ResourceCounts; get: ResourceCounts; to: PlayerId[] | 'all' }
  | { type: 'respondTrade'; offerId: string; accept: boolean }
  | { type: 'confirmTrade'; offerId: string; partner: PlayerId }
  | { type: 'cancelTrade'; offerId: string }
  | { type: 'endTurn' };

export type GameEvent =
  | { type: 'rolled'; player: PlayerId; dice: [number, number] }
  | { type: 'produced'; gains: Record<PlayerId, Partial<ResourceCounts>> }
  | { type: 'discarded'; player: PlayerId; count: number }
  | { type: 'shadeMoved'; player: PlayerId; hex: HexId }
  | { type: 'stole'; thief: PlayerId; victim: PlayerId; resource: Resource | null }
  | { type: 'built'; player: PlayerId; piece: 'path' | 'outpost' | 'citadel'; at: string }
  | { type: 'omenBought'; player: PlayerId }
  | { type: 'omenPlayed'; player: PlayerId; kind: OmenKind }
  | { type: 'traded'; a: PlayerId; b: PlayerId | 'bank'; aGave: Partial<ResourceCounts>; bGave: Partial<ResourceCounts> }
  | { type: 'awardChanged'; award: 'longestPath' | 'grandHost'; player: PlayerId | null }
  | { type: 'turnEnded'; player: PlayerId }
  | { type: 'autoActed'; player: PlayerId }
  | { type: 'won'; player: PlayerId };

export type ApplyResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: string };
