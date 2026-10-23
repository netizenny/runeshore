import type { Action, ApplyResult, GameEvent, GameState, PlayerId, Resource, ResourceCounts } from '../types';
import { COSTS, RESOURCES, emptyCounts } from '../constants';
import { ALL_EDGES, ALL_VERTICES, vertexEdges, vertexNeighbors } from '../board/geometry';
import { randInt, shuffle } from '../rng';
import { applyAction, currentPlayer } from './apply';
import { canPay, pathSpotOk } from './build';
import { tradeRatio } from './trade';
import { player } from './setup';

const accepts = (s: GameState, id: PlayerId, a: Action) => applyAction(s, id, a).ok;

// All ways to discard exactly n cards from a hand.
function discards(hand: ResourceCounts, n: number): ResourceCounts[] {
  const out: ResourceCounts[] = [];
  const go = (i: number, left: number, cur: ResourceCounts) => {
    if (i === RESOURCES.length) {
      if (!left) out.push({ ...cur });
      return;
    }
    for (let k = 0; k <= Math.min(left, hand[RESOURCES[i]]); k++) go(i + 1, left - k, { ...cur, [RESOURCES[i]]: k });
  };
  go(0, n, emptyCounts());
  return out;
}

// Candidates are cheaply pre-filtered, then confirmed by applyAction itself so the two never disagree.
export function legalActions(s: GameState, id: PlayerId): Action[] {
  const ph = s.phase;
  if (ph.k === 'ended' || !s.players.some((p) => p.id === id)) return [];
  const out: Action[] = [];
  const me = player(s, id);
  const add = (a: Action) => {
    if (accepts(s, id, a)) out.push(a);
  };

  for (const o of s.offers) {
    if (o.from !== id) {
      if (o.to === 'all' || o.to.includes(id)) {
        out.push({ type: 'respondTrade', offerId: o.id, accept: true }, { type: 'respondTrade', offerId: o.id, accept: false });
      }
    } else {
      out.push({ type: 'cancelTrade', offerId: o.id });
      for (const partner of o.accepted) add({ type: 'confirmTrade', offerId: o.id, partner });
    }
  }
  if (ph.k === 'discard') {
    // Valid by construction, so no per-candidate state clone.
    if (ph.pending[id]) for (const cards of discards(me.hand, ph.pending[id])) out.push({ type: 'discard', cards });
    return out;
  }
  if (id !== currentPlayer(s)) return out;

  switch (ph.k) {
    case 'setup':
      if (ph.step === 'outpost') {
        for (const v of ALL_VERTICES) {
          if (!s.buildings[v] && !vertexNeighbors(v).some((n) => s.buildings[n])) out.push({ type: 'placeOutpost', vertex: v });
        }
      } else {
        for (const e of vertexEdges(ph.lastOutpost!)) if (!s.paths[e]) out.push({ type: 'placePath', edge: e });
      }
      return out;
    case 'moveShade':
      for (const h of Object.keys(s.board.hexes)) if (h !== s.shadeHex) out.push({ type: 'moveShade', hex: h });
      return out;
    case 'steal':
      for (const victim of ph.victims) out.push({ type: 'steal', victim });
      return out;
    case 'waymaking':
      for (const e of ALL_EDGES) if (pathSpotOk(s, id, e)) out.push({ type: 'buildPath', edge: e });
      return out;
    case 'roll':
      out.push({ type: 'roll' });
      break;
    case 'main':
      out.push({ type: 'endTurn' });
      if (canPay(s, id, COSTS.path)) for (const e of ALL_EDGES) if (pathSpotOk(s, id, e)) add({ type: 'buildPath', edge: e });
      const [outpost, citadel] = [canPay(s, id, COSTS.outpost), canPay(s, id, COSTS.citadel)];
      for (const v of ALL_VERTICES) {
        const b = s.buildings[v];
        if (citadel && b?.owner === id && b.kind === 'outpost') add({ type: 'buildCitadel', vertex: v });
        else if (outpost && !b && vertexEdges(v).some((e) => s.paths[e] === id)) add({ type: 'buildOutpost', vertex: v });
      }
      if (canPay(s, id, COSTS.omen)) add({ type: 'buyOmen' });
      for (const give of RESOURCES) {
        if (me.hand[give] < tradeRatio(s, id, give)) continue;
        for (const get of RESOURCES) if (get !== give) add({ type: 'bankTrade', give, get });
      }
      break;
  }

  // Omens play before the roll or in the main phase.
  const kinds = new Set(me.omens.map((o) => o.kind));
  if (kinds.has('warden')) add({ type: 'playOmen', kind: 'warden' });
  if (kinds.has('waymaking')) add({ type: 'playOmen', kind: 'waymaking' });
  if (kinds.has('bounty')) {
    RESOURCES.forEach((x, i) => RESOURCES.slice(i).forEach((y) => add({ type: 'playOmen', kind: 'bounty', pick: [x, y] })));
  }
  if (kinds.has('hoard')) for (const resource of RESOURCES) add({ type: 'playOmen', kind: 'hoard', resource });
  return out;
}

export function pendingPlayers(s: GameState): PlayerId[] {
  if (s.phase.k === 'ended') return [];
  return s.phase.k === 'discard' ? Object.keys(s.phase.pending) : [currentPlayer(s)];
}

// The timeout default for a pending player. Randomness comes from (and advances) rngState.
export function autoAct(s: GameState, id: PlayerId): ApplyResult {
  if (!pendingPlayers(s).includes(id)) return { ok: false, error: 'nothing pending for that player' };
  const ph = s.phase;
  let rng = s.rngState;
  const events: GameEvent[] = [];
  let cur: GameState = s;

  const step = (a: Action): string | null => {
    const r = applyAction({ ...cur, rngState: rng }, id, a);
    if (!r.ok) return r.error;
    cur = r.state;
    rng = cur.rngState;
    events.push(...r.events);
    return null;
  };
  const pick = <T,>(xs: T[]): T => {
    let i: number;
    [i, rng] = randInt(rng, xs.length);
    return xs[i];
  };

  let err: string | null;
  if (ph.k === 'roll') err = step({ type: 'roll' });
  else if (ph.k === 'discard') {
    const cards = RESOURCES.flatMap((r) => Array<Resource>(player(s, id).hand[r]).fill(r));
    let mixed: Resource[];
    [mixed, rng] = shuffle(cards, rng);
    const c = emptyCounts();
    for (const r of mixed.slice(0, ph.pending[id])) c[r]++;
    err = step({ type: 'discard', cards: c });
  } else if (ph.k === 'main') {
    err = null;
    for (const o of s.offers) if (o.from === id && !err) err = step({ type: 'cancelTrade', offerId: o.id });
    err ??= step({ type: 'endTurn' });
  } else {
    const opts = legalActions(s, id).filter((a) => a.type !== 'respondTrade' && a.type !== 'cancelTrade');
    err = opts.length ? step(pick(opts)) : 'no legal action';
  }
  if (err) return { ok: false, error: err };
  const marker: GameEvent = { type: 'autoActed', player: id };
  events.unshift(marker);
  return { ok: true, state: { ...cur, rngState: rng, log: [...cur.log, marker] }, events };
}
