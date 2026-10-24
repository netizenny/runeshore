export type Resource = 'clay' | 'timber' | 'fleece' | 'harvest' | 'starmetal';
export type Terrain = Resource | 'ashen';
export type ResourceCounts = Record<Resource, number>;
export type HexId = string; // "q,r"
export type VertexId = string;
export type EdgeId = string;
export type PlayerId = string;
export type OmenKind = 'warden' | 'relic' | 'waymaking' | 'bounty' | 'hoard';
export type Commodity = 'vellum' | 'silk' | 'sigil';
export type Track = 'lore' | 'guild' | 'crown'; // lore<->vellum, guild<->silk, crown<->sigil
export type ArcanaCard = string; // a key of ARCANA in constants.ts

// Per-card arguments; each card reads only the fields it needs.
export interface ArcanaArg {
  hex?: HexId;
  hexes?: [HexId, HexId];
  vertex?: VertexId;
  vertices?: VertexId[];
  edge?: EdgeId;
  edges?: EdgeId[];
  target?: PlayerId;
  resource?: Resource;
  commodity?: Commodity;
  kind?: Resource | Commodity;
  dice?: [number, number];
  take?: (Resource | Commodity)[];
  takeCard?: ArcanaCard;
  offers?: Record<PlayerId, Resource>;
  place?: VertexId;
  rebuild?: EdgeId;
}
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
  boardSize: 'standard' | 'large';
  renownTarget: number;
  discardLimit: number;
  turnTimerSec: 15 | 30 | 45;
  hollowFleet: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  boardMode: 'random',
  boardSize: 'standard',
  renownTarget: 10,
  discardLimit: 7,
  turnTimerSec: 30,
  hollowFleet: false,
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
  | { k: 'displaced'; owner: PlayerId; vertex: VertexId; rank: 1 | 2 | 3; active: boolean }
  | { k: 'fleetLoss'; pending: PlayerId[]; total: number }
  | { k: 'fleetReward'; pending: PlayerId[]; total: number }
  // Opponents owe cards to `by` (give), to the vault (discard), or one commodity for the offered resource (harbor).
  | { k: 'arcanaGive'; by: PlayerId; mode: 'give' | 'discard' | 'harbor'; pending: Record<PlayerId, number>; offers?: Record<PlayerId, Resource> }
  | { k: 'deserter'; by: PlayerId; target: PlayerId; place?: VertexId }
  | { k: 'ended'; winner: PlayerId };

export interface HFState {
  fleetPos: number; // 0..FLEET_TRACK
  shadeActive: boolean; // false until the first attack
  eventDie: 'ship' | Track | null; // last roll
  bank: Record<Commodity, number>;
  players: Record<PlayerId, {
    commodities: Record<Commodity, number>;
    level: Record<Track, number>; // 0..5
    arcana: ArcanaCard[]; // hidden
    shields: number; // Shield of the shore points
    extraRenown: number; // Printer / Constitution
  }>;
  sentinels: Record<VertexId, { owner: PlayerId; rank: 1 | 2 | 3; active: boolean; actedTurn: number }>;
  bulwarks: VertexId[]; // vertices of citadels with a Bulwark
  spires: Record<Track, { vertex: VertexId; owner: PlayerId } | null>;
  peddler: { hex: HexId; owner: PlayerId } | null;
  arcanaDecks: Record<Track, ArcanaCard[]>; // hidden
  turnFlags: { alchemist?: [number, number]; merchantFleet?: Resource | Commodity; crane?: boolean };
}

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
  dice: [number, number] | null; // [yellow, red] when hf is on
  hf?: HFState;
  log: GameEvent[];
}

export type Action =
  | { type: 'placeOutpost'; vertex: VertexId }
  | { type: 'placePath'; edge: EdgeId }
  | { type: 'roll' }
  | { type: 'discard'; cards: ResourceCounts; commodities?: Record<Commodity, number> }
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
  | { type: 'bankTrade'; give: Resource | Commodity; get: Resource | Commodity }
  | { type: 'offerTrade'; give: ResourceCounts; get: ResourceCounts; to: PlayerId[] | 'all' }
  | { type: 'respondTrade'; offerId: string; accept: boolean }
  | { type: 'confirmTrade'; offerId: string; partner: PlayerId }
  | { type: 'cancelTrade'; offerId: string }
  | { type: 'buildSentinel'; vertex: VertexId }
  | { type: 'activateSentinel'; vertex: VertexId }
  | { type: 'promoteSentinel'; vertex: VertexId }
  | { type: 'moveSentinel'; from: VertexId; to: VertexId }
  | { type: 'moveDisplaced'; to: VertexId }
  | { type: 'chaseShade'; vertex: VertexId }
  | { type: 'buildBulwark'; vertex: VertexId }
  | { type: 'chooseLoss'; vertex: VertexId }
  | { type: 'chooseReward'; track: Track }
  | { type: 'improve'; track: Track; vertex?: VertexId }
  | { type: 'playArcana'; card: ArcanaCard; arg?: ArcanaArg }
  | { type: 'arcanaGive'; cards: ResourceCounts; commodities?: Record<Commodity, number> }
  | { type: 'arcanaPickSentinel'; vertex: VertexId }
  | { type: 'endTurn' };

export type GameEvent =
  | { type: 'rolled'; player: PlayerId; dice: [number, number] }
  | { type: 'eventDie'; face: 'ship' | Track }
  | { type: 'produced'; gains: Record<PlayerId, Partial<ResourceCounts & Record<Commodity, number>>> }
  | { type: 'discarded'; player: PlayerId; count: number }
  | { type: 'shadeMoved'; player: PlayerId; hex: HexId }
  | { type: 'stole'; thief: PlayerId; victim: PlayerId; resource: Resource | null }
  | { type: 'built'; player: PlayerId; piece: 'path' | 'outpost' | 'citadel' | 'bulwark'; at: string }
  | { type: 'sentinel'; player: PlayerId; did: 'built' | 'activated' | 'promoted' | 'moved' | 'displaced' | 'lost' | 'chased'; at: VertexId }
  | { type: 'fleetAdvanced'; pos: number }
  | { type: 'fleetAttack'; strength: number; defence: number; held: boolean }
  | { type: 'shieldAwarded'; player: PlayerId }
  | { type: 'citadelLost'; player: PlayerId; vertex: VertexId }
  | { type: 'arcanaDrawn'; player: PlayerId; track: Track }
  | { type: 'arcanaPlayed'; player: PlayerId; card: ArcanaCard }
  | { type: 'arcanaGave'; from: PlayerId; to: PlayerId | 'bank'; count: number }
  | { type: 'peddlerPlaced'; player: PlayerId; hex: HexId }
  | { type: 'improved'; player: PlayerId; track: Track; level: number }
  | { type: 'spire'; player: PlayerId; track: Track; vertex: VertexId }
  | { type: 'omenBought'; player: PlayerId }
  | { type: 'omenPlayed'; player: PlayerId; kind: OmenKind }
  | { type: 'traded'; a: PlayerId; b: PlayerId | 'bank'; aGave: Partial<ResourceCounts & Record<Commodity, number>>; bGave: Partial<ResourceCounts & Record<Commodity, number>> }
  | { type: 'awardChanged'; award: 'longestPath' | 'grandHost'; player: PlayerId | null }
  | { type: 'turnEnded'; player: PlayerId }
  | { type: 'autoActed'; player: PlayerId }
  | { type: 'won'; player: PlayerId };

export type ApplyResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: string };
