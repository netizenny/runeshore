import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/apply';
import { edgeVertices, hexVertices, vertexEdges } from '../src/board/geometry';
import type { GameState } from '../src/types';
import { arcState, play } from './helpers';

const ok = (r: ReturnType<typeof play>) => {
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const err = (r: ReturnType<typeof play>) => (r.ok ? '' : r.error);
const hand = (s: GameState, id: string) => s.players.find((p) => p.id === id)!.hand;
const zero = { clay: 0, timber: 0, fleece: 0, harvest: 0, starmetal: 0 };
const NONE = { vellum: 0, silk: 0, sigil: 0 };
const terrainHex = (s: GameState, t: string) => Object.values(s.board.hexes).find((h) => h.terrain === t)!;
const other = (e: string, v: string) => edgeVertices(e).find((x) => x !== v)!;

// An outpost for `id` with one Path leading off it to a free vertex `far`.
function withPath(s: GameState, id: string, terrain: string) {
  const v = hexVertices(terrainHex(s, terrain).id)[0];
  s.buildings[v] = { owner: id, kind: 'outpost' };
  const e = vertexEdges(v)[0];
  s.paths[e] = id;
  return { v, e, far: other(e, v) };
}

describe('crown arcana', () => {
  it('Cleric moves the Shade and steals one card from each opponent beside it, none from the empty-handed', () => {
    const s = arcState();
    const h = terrainHex(s, 'timber');
    const [v1, v2] = hexVertices(h.id);
    s.buildings[v1] = { owner: 'b', kind: 'outpost' };
    s.buildings[v2] = { owner: 'c', kind: 'outpost' };
    Object.assign(hand(s, 'b'), { clay: 3 });
    expect(err(play(s, 'a', 'bishop', { hex: h.id }))).toMatch(/asleep/);
    s.hf!.shadeActive = true;
    expect(err(play(s, 'a', 'bishop', { hex: s.shadeHex }))).toMatch(/another hex/);
    const t = ok(play(s, 'a', 'bishop', { hex: h.id }));
    expect(t.shadeHex).toBe(h.id);
    expect(hand(t, 'a').clay).toBe(1);
    expect(hand(t, 'b').clay).toBe(2);
    expect(hand(t, 'c')).toEqual(zero);
  });

  it('Charter is never played from the hand', () => {
    expect(err(play(arcState(), 'a', 'constitution'))).toMatch(/drawn/);
  });

  it('Turncoat: the target picks, you place one of the same rank', () => {
    const s = arcState();
    const mine = withPath(s, 'a', 'timber');
    const theirs = withPath(s, 'b', 'fleece');
    s.hf!.sentinels[theirs.v] = { owner: 'b', rank: 2, active: true, actedTurn: 0 };
    s.hf!.sentinels[theirs.far] = { owner: 'b', rank: 1, active: true, actedTurn: 0 };
    expect(err(play(s, 'a', 'deserter', { target: 'a' }))).toMatch(/opponent/);
    expect(err(play(s, 'a', 'deserter', { target: 'c' }))).toMatch(/no Sentinels/);
    expect(err(play(s, 'a', 'deserter', { target: 'b', place: 'nope' }))).toMatch(/cannot place/);
    const t = ok(play(s, 'a', 'deserter', { target: 'b', place: mine.far }));
    expect(t.phase).toMatchObject({ k: 'deserter', target: 'b' });
    expect(applyAction(t, 'b', { type: 'arcanaPickSentinel', vertex: mine.far })).toMatchObject({ ok: false });
    const r = applyAction(t, 'b', { type: 'arcanaPickSentinel', vertex: theirs.v });
    if (!r.ok) throw r.error;
    expect(r.state.phase.k).toBe('main');
    expect(r.state.hf!.sentinels[theirs.v]).toBeUndefined();
    expect(r.state.hf!.sentinels[mine.far]).toMatchObject({ owner: 'a', rank: 2, active: false });
  });

  it('Turncoat with a single Sentinel needs no choice, and places nothing once your supply of that rank is spent', () => {
    const s = arcState();
    const mine = withPath(s, 'a', 'timber');
    const theirs = withPath(s, 'b', 'fleece');
    s.hf!.sentinels[theirs.v] = { owner: 'b', rank: 1, active: false, actedTurn: 0 };
    s.hf!.sentinels.spare1 = { owner: 'a', rank: 1, active: false, actedTurn: 0 };
    s.hf!.sentinels.spare2 = { owner: 'a', rank: 1, active: false, actedTurn: 0 };
    const t = ok(play(s, 'a', 'deserter', { target: 'b', place: mine.far }));
    expect(t.phase.k).toBe('main');
    expect(t.hf!.sentinels[theirs.v]).toBeUndefined();
    expect(t.hf!.sentinels[mine.far]).toBeUndefined();
  });

  it("Envoy removes an open Path; your own may be laid again, an opponent's may not", () => {
    const s = arcState();
    const mine = withPath(s, 'a', 'timber');
    const f = vertexEdges(mine.far).find((e) => e !== mine.e)!; // chain v -e- far -f- end
    s.paths[f] = 'a';
    const theirs = withPath(s, 'b', 'fleece');
    const spare = s.players.find((p) => p.id === 'a')!.piecesLeft.path;
    const again = vertexEdges(mine.v)[1];
    expect(err(play(s, 'a', 'diplomat', { edge: mine.e }))).toMatch(/not open/); // joined to the outpost and to f
    expect(err(play(s, 'a', 'diplomat', {}))).toMatch(/pick a Path/);
    const t = ok(play(s, 'a', 'diplomat', { edge: f, rebuild: again }));
    expect(t.paths[f]).toBeUndefined();
    expect(t.paths[again]).toBe('a');
    expect(t.players.find((p) => p.id === 'a')!.piecesLeft.path).toBe(spare);
    const u = ok(play(s, 'a', 'diplomat', { edge: theirs.e, rebuild: again }));
    expect(u.paths[theirs.e]).toBeUndefined();
    expect(u.paths[again]).toBeUndefined();
    expect(u.players.find((p) => p.id === 'b')!.piecesLeft.path).toBe(s.players.find((p) => p.id === 'b')!.piecesLeft.path + 1);
  });

  it('Envoy leaves a Sentinel standing on the vertex that lost its Path', () => {
    const s = arcState();
    const mine = withPath(s, 'a', 'timber');
    s.hf!.sentinels[mine.far] = { owner: 'a', rank: 1, active: true, actedTurn: 0 };
    const t = ok(play(s, 'a', 'diplomat', { edge: mine.e }));
    expect(t.hf!.sentinels[mine.far]).toBeDefined();
  });

  it('Plot displaces an opponent Sentinel beside your Path; the owner moves it, or loses it with nowhere to go', () => {
    const s = arcState();
    const mine = withPath(s, 'a', 'timber');
    const spot = mine.far;
    const theirE = vertexEdges(spot).find((e) => e !== mine.e)!;
    s.paths[theirE] = 'b';
    s.hf!.sentinels[spot] = { owner: 'b', rank: 2, active: true, actedTurn: 0 };
    expect(err(play(s, 'a', 'intrigue', { vertex: 'nope' }))).toMatch(/opponent Sentinel/);
    const t = ok(play(s, 'a', 'intrigue', { vertex: spot }));
    expect(t.hf!.sentinels[spot]).toMatchObject({ owner: 'a', rank: 1 });
    expect(t.phase).toMatchObject({ k: 'displaced', owner: 'b', vertex: spot, rank: 2 });
    const to = other(theirE, spot);
    const r = applyAction(t, 'b', { type: 'moveDisplaced', to });
    if (!r.ok) throw r.error;
    expect(r.state.hf!.sentinels[to]).toMatchObject({ owner: 'b', rank: 2 });

    delete s.paths[theirE]; // no Path to flee along
    const lost = ok(play(s, 'a', 'intrigue', { vertex: spot }));
    expect(lost.phase.k).toBe('main');
    expect(lost.hf!.sentinels[spot].owner).toBe('a');
  });

  it('Plot refuses a Sentinel that is not beside your Path, or one of your own', () => {
    const s = arcState();
    const mine = withPath(s, 'a', 'timber');
    const far = hexVertices(terrainHex(s, 'starmetal').id)[3];
    s.hf!.sentinels[far] = { owner: 'b', rank: 1, active: true, actedTurn: 0 };
    s.hf!.sentinels[mine.far] = { owner: 'a', rank: 1, active: true, actedTurn: 0 };
    expect(err(play(s, 'a', 'intrigue', { vertex: far }))).toMatch(/touch your Path/);
    expect(err(play(s, 'a', 'intrigue', { vertex: mine.far }))).toMatch(/opponent Sentinel/);
  });

  it('Wrecker makes every opponent with as much Renown discard half, rounded down', () => {
    const s = arcState();
    s.buildings.x1 = { owner: 'a', kind: 'outpost' };
    s.buildings.x2 = { owner: 'b', kind: 'outpost' };
    Object.assign(hand(s, 'b'), { clay: 5 });
    Object.assign(hand(s, 'c'), { clay: 4 }); // no Renown: spared
    const t = ok(play(s, 'a', 'saboteur'));
    expect(t.phase).toMatchObject({ k: 'arcanaGive', mode: 'discard', pending: { b: 2 } });
    expect(applyAction(t, 'b', { type: 'arcanaGive', cards: { ...zero, clay: 1 } })).toMatchObject({ ok: false });
    const r = applyAction(t, 'b', { type: 'arcanaGive', cards: { ...zero, clay: 2 }, commodities: NONE });
    if (!r.ok) throw r.error;
    expect(r.state.phase.k).toBe('main');
    expect(hand(r.state, 'b').clay).toBe(3);
    expect(r.state.bank.clay).toBe(s.bank.clay + 2);
    expect(hand(r.state, 'c').clay).toBe(4);
  });

  it('Wrecker with nobody eligible does nothing', () => {
    expect(ok(play(arcState(), 'a', 'saboteur')).phase.k).toBe('main');
  });

  it("Informant takes the card you name from an opponent's Arcana", () => {
    const s = arcState();
    s.hf!.players.b.arcana = ['smith', 'crane'];
    const bad = (c: string) => err(play(s, 'a', 'spy', { target: c === 'mining' ? 'b' : 'c', takeCard: c === 'mining' ? 'mining' : 'smith' }));
    expect(bad('mining')).toMatch(/do not hold/);
    expect(bad('smith')).toMatch(/do not hold/);
    s.hf!.players.a.arcana = [];
    const t = ok(play(s, 'a', 'spy', { target: 'b', takeCard: 'smith' }));
    expect(t.hf!.players.a.arcana).toEqual(['smith']);
    expect(t.hf!.players.b.arcana).toEqual(['crane']);
  });

  it('Informant needs room in your hand', () => {
    const s = arcState();
    s.hf!.players.b.arcana = ['smith'];
    s.hf!.players.a.arcana = ['crane', 'crane', 'crane', 'crane'];
    expect(err(play(s, 'a', 'spy', { target: 'b', takeCard: 'smith' }))).toMatch(/full/);
  });

  it('Warcry wakes all your Sentinels free; they still wait a turn to act', () => {
    const s = arcState();
    s.hf!.sentinels.p = { owner: 'a', rank: 1, active: false, actedTurn: 0 };
    s.hf!.sentinels.q = { owner: 'a', rank: 2, active: true, actedTurn: 0 };
    s.hf!.sentinels.r = { owner: 'b', rank: 1, active: false, actedTurn: 0 };
    const t = ok(play(s, 'a', 'warlord'));
    expect(t.hf!.sentinels.p).toMatchObject({ active: true, actedTurn: s.turn });
    expect(t.hf!.sentinels.q).toMatchObject({ active: true, actedTurn: 0 });
    expect(t.hf!.sentinels.r.active).toBe(false);
    expect(hand(t, 'a')).toEqual(hand(s, 'a'));
    ok(play(arcState(), 'a', 'warlord')); // no Sentinels: legal
  });

  it('Dowry: each opponent with more Renown gives you 2 cards of their choice', () => {
    const s = arcState();
    s.hf!.players.b.extraRenown = 3;
    Object.assign(hand(s, 'b'), { clay: 1 });
    s.hf!.players.b.commodities.silk = 1;
    const t = ok(play(s, 'a', 'wedding'));
    expect(t.phase).toMatchObject({ k: 'arcanaGive', mode: 'give', pending: { b: 2 } });
    const r = applyAction(t, 'b', { type: 'arcanaGive', cards: { ...zero, clay: 1 }, commodities: { ...NONE, silk: 1 } });
    if (!r.ok) throw r.error;
    expect(hand(r.state, 'a').clay).toBe(1);
    expect(r.state.hf!.players.a.commodities.silk).toBe(1);
    expect(r.state.phase.k).toBe('main');
  });

  it('Dowry takes 1 from a one-card opponent, nothing from an empty hand or a poorer player', () => {
    const s = arcState();
    s.hf!.players.b.extraRenown = 3;
    s.hf!.players.c.extraRenown = 3;
    Object.assign(hand(s, 'b'), { clay: 1 });
    expect(ok(play(s, 'a', 'wedding')).phase).toMatchObject({ pending: { b: 1 } });
    expect(ok(play(arcState(), 'a', 'wedding')).phase.k).toBe('main');
  });

  it('only the owed player may answer, and only while the phase is open', () => {
    const s = arcState();
    s.hf!.players.b.extraRenown = 3;
    Object.assign(hand(s, 'b'), { clay: 2 });
    const t = ok(play(s, 'a', 'wedding'));
    const give = { type: 'arcanaGive' as const, cards: { ...zero, clay: 2 }, commodities: NONE };
    expect(applyAction(t, 'c', give)).toMatchObject({ ok: false, error: /nothing to hand/ });
    const r = applyAction(t, 'b', give);
    if (!r.ok) throw r.error;
    expect(applyAction(r.state, 'b', give)).toMatchObject({ ok: false });
  });
});
