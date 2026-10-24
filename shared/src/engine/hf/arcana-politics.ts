import type { Action, GameEvent, GameState, PlayerId, VertexId } from '../../types';
import { ARCANA_HAND_MAX, COMMODITIES, RESOURCES, SENTINELS_PER_RANK, isCommodity } from '../../constants';
import { boardGeometry, edgeVertices, hexVertices, vertexEdges } from '../../board/geometry';
import { renown } from '../awards';
import { pathSpotOk } from '../build';
import { player, type Result } from '../setup';
import { stealCard } from '../turn';
import { count, empty, reach } from './sentinels';
import { hfPlayer, stocks } from './state';
import { KINDS, cardTotal, move, others } from './arcana-trade';
import type { Play } from './arcana';

const rival = (s: GameState, id: PlayerId, t?: PlayerId) => !!t && t !== id && s.players.some((p) => p.id === t);
const sentinelsOf = (s: GameState, id: PlayerId) => Object.keys(s.hf!.sentinels).filter((v) => s.hf!.sentinels[v].owner === id);
const touchesMyPath = (s: GameState, id: PlayerId, v: VertexId) => vertexEdges(v).some((e) => s.paths[e] === id);
const free = (s: GameState, id: PlayerId, v?: VertexId) => !!v && boardGeometry(s.board).vertexSet.has(v) && empty(s, v) && touchesMyPath(s, id, v);
const addSentinel = (s: GameState, id: PlayerId, v: VertexId, rank: 1 | 2 | 3) => {
  s.hf!.sentinels[v] = { owner: id, rank, active: false, actedTurn: s.turn };
};

// Remove the target's Sentinel; the card player then places one of the same rank at `place` if their supply allows.
function desert(s: GameState, by: PlayerId, target: PlayerId, v: VertexId, place?: VertexId): GameEvent[] {
  const { rank } = s.hf!.sentinels[v];
  delete s.hf!.sentinels[v];
  const events: GameEvent[] = [{ type: 'sentinel', player: target, did: 'lost', at: v }];
  if (place && empty(s, place) && count(s, by, rank) < SENTINELS_PER_RANK) {
    addSentinel(s, by, place, rank);
    events.push({ type: 'sentinel', player: by, did: 'built', at: place });
  }
  return events;
}

// A road end is open when none of the owner's pieces touch it.
function openPath(s: GameState, e: string): boolean {
  const owner = s.paths[e];
  return edgeVertices(e).some((v) => s.buildings[v]?.owner !== owner && !vertexEdges(v).some((x) => x !== e && s.paths[x] === owner));
}

export const POLITICS: Record<string, Play> = {
  bishop(s, id, { hex }) {
    if (!s.hf!.shadeActive) return 'the Shade is asleep';
    if (!hex || !s.board.hexes[hex] || hex === s.shadeHex) return 'pick another hex';
    s.shadeHex = hex;
    const events: GameEvent[] = [{ type: 'shadeMoved', player: id, hex }];
    const victims = new Set(hexVertices(hex).map((v) => s.buildings[v]?.owner));
    for (const o of s.order) {
      if (o !== id && victims.has(o) && RESOURCES.some((r) => player(s, o).hand[r] > 0)) events.push(stealCard(s, id, o));
    }
    return events;
  },
  deserter(s, id, { target, place }) {
    if (!rival(s, id, target)) return 'pick an opponent';
    const theirs = sentinelsOf(s, target!);
    if (!theirs.length) return 'they have no Sentinels';
    if (place && !free(s, id, place)) return 'cannot place a Sentinel there';
    if (theirs.length === 1) return desert(s, id, target!, theirs[0], place);
    s.phase = { k: 'deserter', by: id, target: target!, place };
    return [];
  },
  diplomat(s, id, { edge, rebuild }) {
    const owner = edge && s.paths[edge];
    if (!edge || !owner) return 'pick a Path';
    if (!openPath(s, edge)) return 'that Path is not open';
    delete s.paths[edge];
    player(s, owner).piecesLeft.path++;
    if (owner === id && rebuild) {
      if (rebuild === edge || !pathSpotOk(s, id, rebuild)) return 'cannot lay it there';
      s.paths[rebuild] = id;
      player(s, id).piecesLeft.path--;
    }
    return [];
  },
  intrigue(s, id, { vertex }) {
    const k = vertex && s.hf!.sentinels[vertex];
    if (!vertex || !k || k.owner === id) return 'pick an opponent Sentinel';
    if (!touchesMyPath(s, id, vertex)) return 'it must touch your Path';
    const events: GameEvent[] = [];
    delete s.hf!.sentinels[vertex];
    if (count(s, id, 1) < SENTINELS_PER_RANK) {
      addSentinel(s, id, vertex, 1);
      events.push({ type: 'sentinel', player: id, did: 'built', at: vertex });
    }
    // Same fate as a Sentinel pushed off by another: moved by its owner to a free connected vertex, else lost.
    if (reach(s, k.owner, vertex).some((v) => empty(s, v))) {
      s.phase = { k: 'displaced', owner: k.owner, vertex, rank: k.rank, active: k.active };
      events.push({ type: 'sentinel', player: k.owner, did: 'displaced', at: vertex });
    } else events.push({ type: 'sentinel', player: k.owner, did: 'lost', at: vertex });
    return events;
  },
  saboteur(s, id) {
    const pending: Record<PlayerId, number> = {};
    for (const o of others(s, id)) {
      const n = Math.floor(cardTotal(s, o) / 2);
      if (n > 0 && renown(s, o, true) >= renown(s, id, true)) pending[o] = n;
    }
    if (Object.keys(pending).length) s.phase = { k: 'arcanaGive', by: id, mode: 'discard', pending };
    return [];
  },
  spy(s, id, { target, takeCard }) {
    if (!rival(s, id, target)) return 'pick an opponent';
    const theirs = hfPlayer(s, target!).arcana;
    const i = takeCard ? theirs.indexOf(takeCard) : -1;
    if (i < 0) return 'they do not hold that card';
    if (hfPlayer(s, id).arcana.length >= ARCANA_HAND_MAX) return 'your Arcana hand is full';
    hfPlayer(s, id).arcana.push(...theirs.splice(i, 1));
    return [];
  },
  warlord(s, id) {
    for (const v of sentinelsOf(s, id)) {
      const k = s.hf!.sentinels[v];
      if (k.active) continue;
      k.active = true;
      k.actedTurn = s.turn;
    }
    return [];
  },
  wedding(s, id) {
    const pending: Record<PlayerId, number> = {};
    for (const o of others(s, id)) {
      const n = Math.min(2, cardTotal(s, o));
      if (n > 0 && renown(s, o, true) > renown(s, id, true)) pending[o] = n;
    }
    if (Object.keys(pending).length) s.phase = { k: 'arcanaGive', by: id, mode: 'give', pending };
    return [];
  },
};

// An opponent settles what a card asked of them: Dowry/Wrecker cards, or the commodity in a Dockside Barter.
export function arcanaGive(s: GameState, id: PlayerId, a: Extract<Action, { type: 'arcanaGive' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'arcanaGive' || !ph.pending[id]) return 'nothing to hand over';
  const want = (k: string) => (isCommodity(k) ? a.commodities?.[k] : a.cards?.[k as never]) ?? 0;
  let total = 0;
  for (const k of KINDS) {
    const n = want(k);
    if (!Number.isInteger(n) || n < 0 || n > stocks(s, id, k).hand[k]) return 'bad choice';
    if (ph.mode === 'harbor' && n && !isCommodity(k)) return 'give a commodity';
    total += n;
  }
  if (total !== ph.pending[id]) return `hand over exactly ${ph.pending[id]}`;
  for (const k of KINDS) {
    const n = want(k);
    if (!n) continue;
    if (ph.mode === 'discard') {
      const { hand, bank } = stocks(s, id, k);
      hand[k] -= n;
      bank[k] += n;
    } else move(s, id, ph.by, k, n);
  }
  if (ph.mode === 'harbor') move(s, ph.by, id, ph.offers![id], 1);
  delete ph.pending[id];
  if (!Object.keys(ph.pending).length) s.phase = { k: 'main' };
  return [{ type: 'arcanaGave', from: id, to: ph.mode === 'discard' ? 'bank' : ph.by, count: total }];
}

// The Turncoat's target picks which of their Sentinels goes.
export function arcanaPickSentinel(s: GameState, id: PlayerId, a: Extract<Action, { type: 'arcanaPickSentinel' }>): Result {
  const ph = s.phase;
  if (ph.k !== 'deserter' || ph.target !== id) return 'no Sentinel to give up';
  if (s.hf!.sentinels[a.vertex]?.owner !== id) return 'pick one of your Sentinels';
  s.phase = { k: 'main' };
  return desert(s, ph.by, id, a.vertex, ph.place);
}
