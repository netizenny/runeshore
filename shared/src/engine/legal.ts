import type { Action, ApplyResult, Commodity, GameEvent, GameState, PlayerId, Resource, ResourceCounts } from '../types';
import { COMMODITIES, COSTS, FRAME, IMPROVE_MAX, NOT_LAND, TRACK_COMMODITY, RESOURCES, emptyCounts, isCommodity } from '../constants';
import { boardGeometry, pathEdgeOn, vertexEdges, vertexNeighbors } from '../board/geometry';
import { randInt, shuffle } from '../rng';
import { applyAction, currentPlayer } from './apply';
import { canPay, pathSpotOk } from './build';
import { boatMovable, boatSpotOk } from './boats';
import { tradeRatio } from './trade';
import { player, setupSpotOk } from './setup';
import { TRACKS, hfPlayer, stocks } from './hf/state';
import { reach } from './hf/sentinels';
import { arcanaCandidates } from './hf/arcana-legal';

const accepts = (s: GameState, id: PlayerId, a: Action) => applyAction(s, id, a).ok;

// All ways to discard exactly n cards from a hand (base resources, plus commodities in the expansion).
function discards(hand: Record<string, number>, kinds: string[], n: number): Record<string, number>[] {
  const out: Record<string, number>[] = [];
  const go = (i: number, left: number, cur: Record<string, number>) => {
    if (i === kinds.length) {
      if (!left) out.push({ ...cur });
      return;
    }
    for (let k = 0; k <= Math.min(left, hand[kinds[i]]); k++) go(i + 1, left - k, { ...cur, [kinds[i]]: k });
  };
  go(0, n, {});
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
    if (ph.pending[id]) {
      const hf = !!s.hf;
      const hand = { ...me.hand, ...(hf && hfPlayer(s, id).commodities) };
      for (const d of discards(hand, hf ? [...RESOURCES, ...COMMODITIES] : RESOURCES, ph.pending[id])) {
        const cards = Object.fromEntries(RESOURCES.map((r) => [r, d[r]])) as ResourceCounts;
        if (!hf) out.push({ type: 'discard', cards });
        else out.push({ type: 'discard', cards, commodities: { vellum: d.vellum, silk: d.silk, sigil: d.sigil } });
      }
    }
    return out;
  }
  if (ph.k === 'glimmer') {
    const n = Math.min(ph.pending[id] ?? 0, RESOURCES.reduce((t, r) => t + s.bank[r], 0));
    if (n) for (const d of discards(s.bank, RESOURCES, n)) out.push({ type: 'chooseGlimmer', cards: Object.fromEntries(RESOURCES.map((r) => [r, d[r]])) as ResourceCounts });
    return out;
  }
  if (ph.k === 'displaced') {
    if (ph.owner === id) for (const to of reach(s, id, ph.vertex)) add({ type: 'moveDisplaced', to });
    return out;
  }
  if (ph.k === 'arcanaGive') {
    const n = ph.pending[id];
    if (!n) return out;
    const hand = { ...me.hand, ...hfPlayer(s, id).commodities };
    for (const d of discards(hand, ph.mode === 'harbor' ? COMMODITIES : [...RESOURCES, ...COMMODITIES], n)) {
      const cards = Object.fromEntries(RESOURCES.map((r) => [r, d[r] ?? 0])) as ResourceCounts;
      add({ type: 'arcanaGive', cards, commodities: { vellum: d.vellum ?? 0, silk: d.silk ?? 0, sigil: d.sigil ?? 0 } });
    }
    return out;
  }
  if (ph.k === 'deserter') {
    if (ph.target === id) for (const [vertex, k] of Object.entries(s.hf!.sentinels)) if (k.owner === id) add({ type: 'arcanaPickSentinel', vertex });
    return out;
  }
  if (ph.k === 'fleetLoss' || ph.k === 'fleetReward') {
    if (!ph.pending.includes(id)) return out;
    if (ph.k === 'fleetLoss') for (const vertex of Object.keys(s.buildings)) add({ type: 'chooseLoss', vertex });
    else for (const track of TRACKS) add({ type: 'chooseReward', track });
    return out;
  }
  if (id !== currentPlayer(s)) return out;

  switch (ph.k) {
    case 'setup':
      if (ph.step === 'outpost') {
        for (const v of boardGeometry(s.board).vertices) {
          if (!s.buildings[v] && !vertexNeighbors(v).some((n) => s.buildings[n]) && setupSpotOk(s, v)) out.push({ type: 'placeOutpost', vertex: v });
        }
      } else {
        for (const e of vertexEdges(ph.lastOutpost!)) {
          if (!s.paths[e] && pathEdgeOn(s.board, e)) out.push({ type: 'placePath', edge: e });
          if (s.di && s.di.boatsLeft[id] > 0 && boatSpotOk(s, id, e)) out.push({ type: 'placeBoat', edge: e });
        }
      }
      return out;
    case 'moveShade':
      for (const h of Object.keys(s.board.hexes)) if (h !== s.shadeHex && !NOT_LAND.includes(s.board.hexes[h].terrain)) out.push({ type: 'moveShade', hex: h });
      if (s.di?.raiderHex) out.push({ type: 'moveShade', hex: FRAME, raider: true });
      if (s.di) for (const h of Object.keys(s.board.hexes)) if (h !== s.di.raiderHex && s.board.hexes[h].terrain === 'deep') out.push({ type: 'moveShade', hex: h, raider: true });
      return out;
    case 'steal':
      for (const victim of ph.victims) out.push({ type: 'steal', victim });
      return out;
    case 'waymaking':
      for (const e of boardGeometry(s.board).edges) {
        if (pathSpotOk(s, id, e)) out.push({ type: 'buildPath', edge: e });
        if (s.di && s.di.boatsLeft[id] > 0 && boatSpotOk(s, id, e)) out.push({ type: 'buildBoat', edge: e });
      }
      return out;
    case 'roll':
      out.push({ type: 'roll' });
      break;
    case 'main':
      out.push({ type: 'endTurn' });
      if (canPay(s, id, COSTS.path)) for (const e of boardGeometry(s.board).edges) if (pathSpotOk(s, id, e)) add({ type: 'buildPath', edge: e });
      if (s.di) {
        const edges = boardGeometry(s.board).edges;
        if (s.di.boatsLeft[id] > 0 && canPay(s, id, COSTS.boat)) for (const edge of edges) if (boatSpotOk(s, id, edge)) out.push({ type: 'buildBoat', edge });
        for (const from of Object.keys(s.di.boats)) {
          if (!boatMovable(s, id, from)) continue;
          for (const to of edges) if (to !== from && boatSpotOk(s, id, to, from)) out.push({ type: 'moveBoat', from, to });
        }
      }
      const [outpost, citadel] = [canPay(s, id, COSTS.outpost), canPay(s, id, COSTS.citadel)];
      for (const v of boardGeometry(s.board).vertices) {
        const b = s.buildings[v];
        if (citadel && b?.owner === id && b.kind === 'outpost') add({ type: 'buildCitadel', vertex: v });
        else if (outpost && !b && vertexEdges(v).some((e) => s.paths[e] === id || s.di?.boats[e] === id)) add({ type: 'buildOutpost', vertex: v });
      }
      if (canPay(s, id, COSTS.omen)) add({ type: 'buyOmen' });
      const kinds = s.hf ? [...RESOURCES, ...COMMODITIES] : RESOURCES;
      for (const give of kinds) {
        if (stocks(s, id, give).hand[give] < tradeRatio(s, id, give)) continue;
        for (const get of kinds) if (get !== give) add({ type: 'bankTrade', give, get });
      }
      if (s.hf) {
        const mine = Object.entries(s.hf.sentinels).filter(([, k]) => k.owner === id);
        if (canPay(s, id, COSTS.sentinel)) {
          for (const v of boardGeometry(s.board).vertices) if (vertexEdges(v).some((e) => s.paths[e] === id)) add({ type: 'buildSentinel', vertex: v });
          for (const [v] of mine) add({ type: 'promoteSentinel', vertex: v });
        }
        const lv = hfPlayer(s, id);
        if (Object.values(s.buildings).some((b) => b.owner === id && b.kind === 'citadel'))
          for (const track of TRACKS) if (lv.level[track] < IMPROVE_MAX && lv.commodities[TRACK_COMMODITY[track]] > lv.level[track]) add({ type: 'improve', track });
        if (canPay(s, id, COSTS.bulwark)) for (const [v, b] of Object.entries(s.buildings)) if (b.owner === id) add({ type: 'buildBulwark', vertex: v });
        for (const [v, k] of mine) {
          if (!k.active) add({ type: 'activateSentinel', vertex: v });
          else {
            add({ type: 'chaseShade', vertex: v });
            for (const to of reach(s, id, v)) add({ type: 'moveSentinel', from: v, to });
          }
        }
      }
      break;
  }

  if (s.hf && (ph.k === 'roll' || ph.k === 'main')) for (const a of arcanaCandidates(s, id)) add(a);

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
  if (s.phase.k === 'displaced') return [s.phase.owner];
  if (s.phase.k === 'glimmer') return Object.keys(s.phase.pending);
  if (s.phase.k === 'arcanaGive') return Object.keys(s.phase.pending);
  if (s.phase.k === 'deserter') return [s.phase.target];
  if (s.phase.k === 'fleetLoss' || s.phase.k === 'fleetReward') return s.phase.pending;
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
    const kinds = s.hf ? [...RESOURCES, ...COMMODITIES] : RESOURCES;
    const cards = kinds.flatMap((k) => Array<Resource | Commodity>(stocks(s, id, k).hand[k]).fill(k));
    let mixed: (Resource | Commodity)[];
    [mixed, rng] = shuffle(cards, rng);
    const c = emptyCounts();
    const commodities = { vellum: 0, silk: 0, sigil: 0 };
    for (const k of mixed.slice(0, ph.pending[id])) isCommodity(k) ? commodities[k]++ : c[k]++;
    err = step(s.hf ? { type: 'discard', cards: c, commodities } : { type: 'discard', cards: c });
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
