# Runeshore base game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable online base game of Runeshore: host creates a room, friends join by link, 3–4 players play a full game to 10 Renown with server-enforced rules.

**Architecture:** npm-workspaces monorepo. `shared/` is a pure, deterministic rules engine (`applyAction(state, playerId, action)`), seeded RNG, no I/O. `server/` holds rooms in memory, snapshots them to disk, and talks to clients over WebSockets, sending each player a filtered view. `client/` is React + Vite with an SVG board in the dark graphic-novel style.

**Tech Stack:** TypeScript 5, Node 24, `ws`, React 18, Vite 5, Vitest 2, `concurrently`, `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-21-runeshore-design.md`

## Global Constraints

- No Catan or colonist.io names, art, icons, palette, card frames, or card text anywhere in the UI. Use only the Runeshore terms from the spec's terminology table (Renown, Path, Outpost, Citadel, The Shade, Clay/Timber/Fleece/Harvest/Starmetal, Ashen waste, Omens, Warden, Waymaking, Bounty, Hoard, Relic, Grand host, Longest path, Port).
- No accounts, no database. Rooms reached only by link.
- All rule checks happen in `shared/` and run on the server. The client never decides legality; it may only grey out buttons using `legalActions`.
- Rules authority: current official base-game rulebook. Visibility of other players' info follows colonist.io (others see hand counts, not cards; steals show "a card" to third parties).
- Every decision point has an automatic default (see Task 10).
- `npm run dev` from the repo root starts everything. Works on Windows 11.
- Look: deep indigo night, gold ink linework, runes, flat inked SVG. No gradients-heavy or 3D art.
- 3–4 players. Win at `settings.renownTarget` (default 10) on your own turn.

## Review Focus

1. Two players act at the same instant (both click accept on one trade, two discards land together) — server applies actions one at a time per room; second gets a clean error if no longer legal. Test in Task 11.
2. Same player opens the room in a second tab — newest socket takes the seat, old socket gets `{t:'error', code:'replaced'}` and stops. Test in Task 11.
3. Bank can't cover production (e.g. 2 players owed 3 Harvest, bank has 2) — nobody gets that resource, unless only one player is owed it, who gets what's left. Test in Task 5.
4. Omen deck is empty — `buyOmen` is illegal, not a crash. Test in Task 8.
5. Nickname empty, whitespace, over 20 chars, or duplicate in the room — trimmed; empty rejected; >20 cut; duplicate gets " 2" suffix. Test in Task 11.

---

## File structure

```
package.json                 workspaces, root scripts
tsconfig.base.json
.gitignore                   node_modules, dist, data, .superpowers
shared/src/
  types.ts                   all shared types (state, actions, events, views)
  constants.ts               costs, piece limits, deck/tile/token lists
  rng.ts                     seeded RNG
  board/geometry.ts          hex/vertex/edge ids and adjacency
  board/generate.ts          random fair board + starter board
  engine/create.ts           createGame
  engine/apply.ts            applyAction dispatcher
  engine/setup.ts            setup-phase placement
  engine/turn.ts             roll, production, discard, Shade, end turn
  engine/build.ts            paths, outposts, citadels
  engine/trade.ts            bank, port, player trades
  engine/omens.ts            buy/play Omens
  engine/awards.ts           Longest path, Grand host, Renown, win
  engine/legal.ts            legalActions, autoAct
  view.ts                    viewFor (hidden-info filter)
  protocol.ts                client/server message types
  index.ts                   re-exports
shared/test/*.test.ts
server/src/
  index.ts                   HTTP + WS boot, serves client build in prod
  room.ts                    Room class: seats, queue, timers, host cmds
  rooms.ts                   registry, ids, expiry
  persist.ts                 snapshot save/load
server/test/*.test.ts
client/
  index.html, vite.config.ts
  src/main.tsx, App.tsx
  src/net/socket.ts          WS client, reconnect, seat token storage
  src/state/useGame.ts       hook exposing view + send
  src/theme/theme.css        palette tokens, fonts
  src/screens/Home.tsx       create room
  src/screens/Lobby.tsx      join, seats, settings, start
  src/screens/Game.tsx       game layout
  src/board/Board.tsx        SVG board, hit targets
  src/board/art.tsx          tile, token, piece, port SVG art
  src/panels/Hand.tsx, Build.tsx, Trade.tsx, Omens.tsx, Players.tsx, Log.tsx
  src/panels/Discard.tsx, ShadeSteal.tsx
  src/fx/ComicPanel.tsx      popup moments
```

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.gitignore`, `shared/package.json`, `shared/tsconfig.json`, `shared/src/index.ts`, `shared/test/smoke.test.ts`, `server/package.json`, `server/tsconfig.json`, `server/src/index.ts`, `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/index.html`, `client/src/main.tsx`, `client/src/App.tsx`

**Interfaces:**
- Produces: package names `@runeshore/shared`, `@runeshore/server`, `@runeshore/client`. Root scripts `dev`, `test`, `build`, `start`. Server port `3001` (env `PORT`), Vite dev port `5173` proxying `/ws` to `ws://localhost:3001`.

- [ ] **Step 1:** `git init`. Write `.gitignore` with `node_modules`, `dist`, `data`, `.superpowers`.
- [ ] **Step 2:** Root `package.json`: `"private": true`, `"workspaces": ["shared","server","client"]`, scripts: `dev` = `concurrently -n server,client "npm -w server run dev" "npm -w client run dev"`, `test` = `npm -w shared test && npm -w server test`, `build` = `npm -w client run build && npm -w server run build`, `start` = `npm -w server start`. Dev deps: `typescript`, `vitest`, `concurrently`, `tsx`.
- [ ] **Step 3:** Shared imports in server/client resolve TS source directly (`"main": "src/index.ts"` in `shared/package.json`; Vite and `tsx` handle TS). `shared/src/index.ts` exports `const VERSION = '0.1.0'`.
- [ ] **Step 4:** Write `shared/test/smoke.test.ts`: `expect(VERSION).toBe('0.1.0')`.
- [ ] **Step 5:** Server `dev` = `tsx watch src/index.ts`; `index.ts` starts an HTTP server on `PORT ?? 3001` answering `GET /health` with `ok`. Deps: `ws`, `@types/ws`.
- [ ] **Step 6:** Client: Vite React app, `App.tsx` renders `Runeshore`. Proxy `/ws` in `vite.config.ts`.
- [ ] **Step 7:** Run `npm install`, then `npm test`. Expected: 1 passing test. If install fails with EPERM/EBUSY under OneDrive, stop and report — spec says move the project out of OneDrive.
- [ ] **Step 8:** Run `npm run dev`; `curl http://localhost:3001/health` returns `ok`; `http://localhost:5173` shows `Runeshore`. Stop dev.
- [ ] **Step 9:** Commit `chore: scaffold monorepo`.

---

### Task 2: Types, constants, RNG

**Files:**
- Create: `shared/src/types.ts`, `shared/src/constants.ts`, `shared/src/rng.ts`
- Test: `shared/test/rng.test.ts`

**Interfaces:**
- Produces (types.ts):
  - `type Resource = 'clay'|'timber'|'fleece'|'harvest'|'starmetal'`
  - `type Terrain = Resource | 'ashen'`
  - `type ResourceCounts = Record<Resource, number>`
  - `type HexId = string` (`"q,r"`), `VertexId = string`, `EdgeId = string`
  - `type PlayerId = string`
  - `type OmenKind = 'warden'|'relic'|'waymaking'|'bounty'|'hoard'`
  - `interface Hex { id: HexId; q: number; r: number; terrain: Terrain; token: number|null }`
  - `interface Port { edge: EdgeId; kind: Resource | 'any' }` (`any` = 3:1)
  - `interface Board { hexes: Record<HexId, Hex>; ports: Port[] }`
  - `interface Settings { boardMode: 'random'|'starter'; renownTarget: number; discardLimit: number; turnTimerSec: 0|60|90|120 }` defaults `{ 'random', 10, 7, 0 }` as `DEFAULT_SETTINGS`
  - `interface PlayerState { id; name; color: PlayerColor; hand: ResourceCounts; omens: { kind: OmenKind; boughtTurn: number }[]; wardensPlayed: number; piecesLeft: { path; outpost; citadel } }`
  - `type PlayerColor = 'ember'|'tide'|'moss'|'bone'` (original color names, hex values decided in Task 12)
  - `type Phase = { k:'setup'; round: 1|2; step:'outpost'|'path'; lastOutpost?: VertexId } | { k:'roll' } | { k:'discard'; pending: Record<PlayerId, number> } | { k:'moveShade'; then: 'roll'|'main' } | { k:'steal'; hex: HexId; victims: PlayerId[]; then: 'roll'|'main' } | { k:'main' } | { k:'waymaking'; left: 1|2 } | { k:'ended'; winner: PlayerId }`
  - `interface TradeOffer { id: string; from: PlayerId; give: ResourceCounts; get: ResourceCounts; to: PlayerId[]|'all'; accepted: PlayerId[]; declined: PlayerId[] }`
  - `interface GameState { seed: number; rngState: number; settings: Settings; board: Board; players: PlayerState[]; order: PlayerId[]; current: number; turn: number; phase: Phase; omenPlayedThisTurn: boolean; buildings: Record<VertexId, { owner: PlayerId; kind:'outpost'|'citadel' }>; paths: Record<EdgeId, PlayerId>; shadeHex: HexId; bank: ResourceCounts; omenDeck: OmenKind[]; offers: TradeOffer[]; longestPath: PlayerId|null; grandHost: PlayerId|null; dice: [number,number]|null; log: GameEvent[] }`
  - `type Action` union, exactly: `placeOutpost{vertex}`, `placePath{edge}`, `roll`, `discard{cards: ResourceCounts}`, `moveShade{hex}`, `steal{victim}`, `buildPath{edge}`, `buildOutpost{vertex}`, `buildCitadel{vertex}`, `buyOmen`, `playOmen{kind:'warden'}`, `playOmen{kind:'waymaking'}`, `playOmen{kind:'bounty'; pick:[Resource,Resource]}`, `playOmen{kind:'hoard'; resource}`, `bankTrade{give: Resource; get: Resource}`, `offerTrade{give; get; to}`, `respondTrade{offerId; accept: boolean}`, `confirmTrade{offerId; partner}`, `cancelTrade{offerId}`, `endTurn`. Each has `type` as discriminant.
  - `type GameEvent` union with `type` discriminant: `rolled{player; dice}`, `produced{gains: Record<PlayerId, Partial<ResourceCounts>>}`, `discarded{player; count}`, `shadeMoved{player; hex}`, `stole{thief; victim; resource: Resource|null}`, `built{player; piece; at}`, `omenBought{player}`, `omenPlayed{player; kind}`, `traded{a; b; aGave; bGave}` (b = `'bank'` for bank/port), `awardChanged{award:'longestPath'|'grandHost'; player: PlayerId|null}`, `turnEnded{player}`, `autoActed{player}`, `won{player}`.
  - `type ApplyResult = { ok: true; state: GameState; events: GameEvent[] } | { ok: false; error: string }`
- Produces (constants.ts): `COSTS` (`path`: clay 1 timber 1; `outpost`: clay, timber, fleece, harvest 1 each; `citadel`: harvest 2 starmetal 3; `omen`: fleece, harvest, starmetal 1 each), `PIECES = { path: 15, outpost: 5, citadel: 4 }`, `BANK_EACH = 19`, `OMEN_DECK` (14 warden, 5 relic, 2 waymaking, 2 bounty, 2 hoard), `TILES` (4 timber, 4 fleece, 4 harvest, 3 clay, 3 starmetal, 1 ashen), `TOKENS = [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12]`, `PORTS` (4 any, 1 each resource), `emptyCounts(): ResourceCounts`.
- Produces (rng.ts): `nextRandom(rngState: number): [value: number, next: number]` (mulberry32, value in [0,1)), `randInt(state, n): [int, next]`, `shuffle<T>(arr, state): [T[], next]`.

- [ ] **Step 1:** Write `rng.test.ts`: same seed gives same sequence of 5 values; `randInt(s, 6)` over 1000 draws stays in 0..5 and hits every value; `shuffle` returns a permutation and is deterministic per seed.
- [ ] **Step 2:** Run `npm -w shared test`. Expected: FAIL, module missing.
- [ ] **Step 3:** Write `types.ts`, `constants.ts`, `rng.ts` per Interfaces. Export all from `index.ts`.
- [ ] **Step 4:** Run tests. Expected: PASS. Run `npx tsc -p shared --noEmit`. Expected: no errors.
- [ ] **Step 5:** Commit `feat(shared): types, constants, seeded rng`.

---

### Task 3: Board geometry

**Files:**
- Create: `shared/src/board/geometry.ts`
- Test: `shared/test/geometry.test.ts`

**Interfaces:**
- Produces:
  - `LAND_HEXES: {q:number; r:number}[]` — the 19 axial coords with max(|q|,|r|,|q+r|) ≤ 2.
  - `hexId(q,r): HexId`
  - `vertexId(hexes: [HexId,HexId,HexId]): VertexId` — sorted ids joined by `|`. A vertex is named by the 3 hexes (land or off-board ring 3) meeting at it.
  - `edgeId(a: HexId, b: HexId): EdgeId` — sorted pair joined by `~`.
  - `ALL_VERTICES: VertexId[]` (54), `ALL_EDGES: EdgeId[]` (72) — only those touching a land hex.
  - `vertexHexes(v): HexId[]` (land only), `vertexNeighbors(v): VertexId[]`, `vertexEdges(v): EdgeId[]`, `edgeVertices(e): [VertexId,VertexId]`, `edgeNeighbors(e): EdgeId[]`, `hexVertices(h): VertexId[]` (6), `COAST_EDGES: EdgeId[]` (30, edges between land and ring 3 in clockwise order).
  - `vertexPixel(v, size): {x,y}`, `hexPixel(h, size): {x,y}` for pointy-top layout (used by client).

- [ ] **Step 1:** Tests: `ALL_VERTICES.length === 54`, `ALL_EDGES.length === 72`, `COAST_EDGES.length === 30`; every vertex has 2 or 3 neighbors; center hex `0,0` has 6 vertices each touching 3 land hexes; `edgeVertices` of every edge are neighbors of each other; `vertexId` is order-independent.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement. Build vertices by iterating land hexes and their 6 corners: corner i of hex H is shared with neighbors in directions i and i+1. Precompute adjacency maps once at module load.
- [ ] **Step 4:** Run, expect PASS.
- [ ] **Step 5:** Commit `feat(shared): hex board geometry`.

---

### Task 4: Board generation

**Files:**
- Create: `shared/src/board/generate.ts`
- Test: `shared/test/generate.test.ts`

**Interfaces:**
- Consumes: geometry, constants, rng.
- Produces: `generateBoard(mode: 'random'|'starter', rngState: number): [Board, number]`.

- [ ] **Step 1:** Tests: for 200 seeds in random mode, the board has 19 hexes matching `TILES` counts, tokens match `TOKENS` exactly, the ashen hex has `token: null`, no two hexes with token 6 or 8 are adjacent, 9 ports on distinct `COAST_EDGES` with no two ports sharing a vertex, port kinds match `PORTS`. Starter mode: same seed-independent board on two different seeds.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement. Random: shuffle tiles, shuffle tokens onto non-ashen hexes, retry the token shuffle until no adjacent 6/8 (cap 1000 tries, then reshuffle tiles). Ports: place on every 3rd-ish coast edge from a fixed list of 9 indices into `COAST_EDGES` (`[0,3,7,10,13,17,20,23,27]`), kinds shuffled. Starter: a hard-coded tile/token/port layout written for Runeshore (any layout meeting the same checks; do not copy a published layout).
- [ ] **Step 4:** Run, expect PASS.
- [ ] **Step 5:** Commit `feat(shared): board generation`.

---

### Task 5: Game creation, setup, roll, production

**Files:**
- Create: `shared/src/engine/create.ts`, `shared/src/engine/apply.ts`, `shared/src/engine/setup.ts`, `shared/src/engine/turn.ts`
- Test: `shared/test/setup.test.ts`, `shared/test/production.test.ts`
- Test helper: `shared/test/helpers.ts` — `stateWith(partial)` builds a valid mid-game state for targeted tests.

**Interfaces:**
- Produces:
  - `createGame(players: {id; name; color}[], settings: Settings, seed: number): GameState` — order shuffled by seed, phase `{k:'setup', round:1, step:'outpost'}`, bank 19 each, omen deck shuffled, Shade on ashen hex.
  - `applyAction(state, playerId, action): ApplyResult` — dispatcher; never mutates input (use `structuredClone`). Returns `{ok:false, error}` for anything illegal, including wrong player or wrong phase.
  - `currentPlayer(state): PlayerId`

- [ ] **Step 1:** Setup tests: snake order (round 1 order A,B,C; round 2 C,B,A); outpost must respect distance rule (no building on a neighbor vertex); path in setup must touch the outpost just placed; round-2 outpost grants one of each adjacent non-ashen terrain from the bank; after the last round-2 path, phase is `roll` and current is order[0].
- [ ] **Step 2:** Production tests: roll total N gives 1 per outpost and 2 per citadel on hexes with token N, except the Shade hex; Review Focus 3: two players owed 3 Harvest with bank 2 → neither gets Harvest; one player owed 3 with bank 2 → gets 2. `roll` uses and advances `rngState`; same state + roll gives same dice.
- [ ] **Step 3:** Run, expect FAIL.
- [ ] **Step 4:** Implement `create.ts`, `setup.ts` (`placeOutpost`, `placePath` in setup phase), `turn.ts` (`roll` with production; 7 handled in Task 6 — for now 7 goes to phase `main`), `apply.ts` dispatcher.
- [ ] **Step 5:** Run, expect PASS.
- [ ] **Step 6:** Commit `feat(engine): setup and production`.

---

### Task 6: Sevens, discards, the Shade, end turn

**Files:**
- Modify: `shared/src/engine/turn.ts`
- Test: `shared/test/shade.test.ts`

**Interfaces:**
- Produces: phases `discard`, `moveShade`, `steal` wired as in types; `endTurn` advances `current`, increments `turn`, clears `offers`, resets `omenPlayedThisTurn`, sets phase `roll`.

- [ ] **Step 1:** Tests: roll 7 with one player holding 9 cards (limit 7) → phase `discard` with `pending = {thatPlayer: 4}`; discard with wrong count is rejected; any pending player may discard in any order (not only current); after all discards → `moveShade`; moving to the same hex is rejected; moving to a hex with 0 opponent buildings (excluding players with 0 cards) → `main`; one victim → auto-steal happens immediately, event `stole`; 2+ victims → phase `steal`, current picks. Steal takes a random card from victim. No production on 7. `endTurn` only legal in `main`.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run, expect PASS.
- [ ] **Step 5:** Commit `feat(engine): sevens, discards, Shade`.

---

### Task 7: Building and trading

**Files:**
- Create: `shared/src/engine/build.ts`, `shared/src/engine/trade.ts`
- Test: `shared/test/build.test.ts`, `shared/test/trade.test.ts`

**Interfaces:**
- Produces: handlers for `buildPath`, `buildOutpost`, `buildCitadel`, `bankTrade`, `offerTrade`, `respondTrade`, `confirmTrade`, `cancelTrade`. `tradeRatio(state, player, resource): 2|3|4`.

- [ ] **Step 1:** Build tests: path must connect to own path/building and not pass through an opponent building at the joint vertex; outpost must be on own path network and obey the distance rule; citadel only on own outpost; each costs `COSTS` and returns resources to bank; piece limits enforced (6th outpost rejected; upgrading returns the outpost piece); all only in phase `main` and by current player.
- [ ] **Step 2:** Trade tests: bank trade at 4:1; 3:1 with an `any` port building; 2:1 with matching port; offers only by current player in `main`; others `respondTrade` accept/decline; `confirmTrade` with a partner who accepted and both still hold the cards → swap, offer removed; confirm with a partner who no longer has the cards → error; giving and getting same resource rejected; empty offer rejected; Review Focus 1: two `confirmTrade` calls for one offer → second returns error `offer gone`.
- [ ] **Step 3:** Run, expect FAIL.
- [ ] **Step 4:** Implement.
- [ ] **Step 5:** Run, expect PASS.
- [ ] **Step 6:** Commit `feat(engine): building and trading`.

---

### Task 8: Omens

**Files:**
- Create: `shared/src/engine/omens.ts`
- Test: `shared/test/omens.test.ts`

**Interfaces:**
- Produces: handlers for `buyOmen`, `playOmen`.

- [ ] **Step 1:** Tests: `buyOmen` costs `COSTS.omen`, draws top of `omenDeck`, records `boughtTurn`; Review Focus 4: empty deck → error, state unchanged. `playOmen` allowed before or after rolling on own turn; max one per turn; not one bought this turn; `relic` can't be played (counts automatically). Warden: `wardensPlayed++`, goes to `moveShade` then back to the phase it came from (`roll` if before roll, else `main`) via the phase's `then` field. Waymaking: phase `waymaking` with `left: 2` (or fewer if pieces short); paths free; ends early if no legal path. Bounty: take 2 named resources from bank (fails if bank lacks them). Hoard: every other player gives all of that resource to current.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run, expect PASS.
- [ ] **Step 5:** Commit `feat(engine): omens`.

---

### Task 9: Awards and winning

**Files:**
- Create: `shared/src/engine/awards.ts`
- Modify: `shared/src/engine/apply.ts` (call `updateAwards` and `checkWin` after every successful action)
- Test: `shared/test/awards.test.ts`

**Interfaces:**
- Produces: `longestPathLength(state, player): number`, `updateAwards(state): GameEvent[]`, `renown(state, player, includeHidden: boolean): number`, `checkWin(state): GameEvent[]`.

- [ ] **Step 1:** Tests: longest path counts edges in the longest simple trail (handles loops and forks); an opponent outpost on a joint splits the trail; award needs ≥5 and goes to holder of strictly longest; ties keep the current holder; if holder drops below others and others tie, award goes to nobody; Grand host needs ≥3 Wardens, strictly more than holder to take. Renown: outpost 1, citadel 2, each award 2, each relic 1. Win only checked for current player during their turn, at `settings.renownTarget`, including hidden relics → phase `ended`, event `won`.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement. Longest path: DFS over edges from each endpoint, tracking used edges, not passing through vertices owned by opponents.
- [ ] **Step 4:** Run, expect PASS.
- [ ] **Step 5:** Commit `feat(engine): awards and win`.

---

### Task 10: Legal actions, autopilot, views, fuzz

**Files:**
- Create: `shared/src/engine/legal.ts`, `shared/src/view.ts`
- Test: `shared/test/legal.test.ts`, `shared/test/view.test.ts`, `shared/test/fuzz.test.ts`

**Interfaces:**
- Produces:
  - `legalActions(state, player): Action[]` — every action `applyAction` would accept for that player now, except player trades (`offerTrade` excluded; `respondTrade`/`confirmTrade`/`cancelTrade` included for existing offers). Bank trades listed once per (give, get) pair.
  - `pendingPlayers(state): PlayerId[]` — who the game is waiting on (current player, or all with pending discards).
  - `autoAct(state, player): ApplyResult` — the spec's timeout defaults: in `setup` place a random legal outpost/path; `roll` → roll; `discard` → discard random cards of the required count; `moveShade` → random legal hex; `steal` → random victim; `waymaking` → random legal path; `main` → cancel own offers then `endTurn`. Randomness from `rngState`.
  - `interface PlayerView` = `GameState` minus `seed`, `rngState`, `omenDeck` (replaced by `omenDeckCount`), with other players' `hand` replaced by `handCount: number` and `omens` by `omenCount: number`; `stole` events show `resource: null` unless viewer is thief or victim. Plus `you: PlayerId`.
  - `viewFor(state, viewer): PlayerView`
- [ ] **Step 1:** Legal tests: for 30 random states reached by play, every action in `legalActions` applies `ok`; `autoAct` always returns `ok` for each id in `pendingPlayers`.
- [ ] **Step 2:** View tests: viewer sees own hand and omens; others' hands are counts; no `rngState`, `seed`, or deck order in JSON of the view; stole event hidden from a third player.
- [ ] **Step 3:** Fuzz test: for 50 seeds, 3 and 4 players, loop `autoAct`-or-random-legal-action until `ended` or 3000 actions. Assert each game ends with a winner, and invariants hold every step: bank + all hands = 19 per resource; omen deck + held + played = 25; no negative counts; pieces left ≥ 0.
- [ ] **Step 4:** Run, expect FAIL.
- [ ] **Step 5:** Implement.
- [ ] **Step 6:** Run, expect PASS. Fix any engine bug the fuzz finds in the owning file, with a targeted regression test.
- [ ] **Step 7:** Commit `feat(engine): legal actions, autopilot, player views`.

---

### Task 11: Server rooms, protocol, persistence

**Files:**
- Create: `shared/src/protocol.ts`, `server/src/room.ts`, `server/src/rooms.ts`, `server/src/persist.ts`
- Modify: `server/src/index.ts`
- Test: `server/test/room.test.ts`, `server/test/ws.test.ts`, `server/test/persist.test.ts`

**Interfaces:**
- Produces (`shared/src/protocol.ts`, exported from shared index):
  - Client → server: `{t:'create'; name}`, `{t:'join'; roomId; name; seatToken?}`, `{t:'settings'; settings: Partial<Settings>}` (host, lobby only), `{t:'start'}` (host, 3–4 seated), `{t:'action'; action: Action}`, `{t:'host'; cmd:'autopilot'|'remove'; player}`, `{t:'leave'}`.
  - Server → client: `{t:'joined'; roomId; you: PlayerId; seatToken; host: boolean}`, `{t:'lobby'; seats: {id; name; color; connected}[]; host: PlayerId; settings}`, `{t:'game'; view: PlayerView; events: GameEvent[]; legal: Action[]; deadline: number|null; waitingOn: {player; since}[]}`, `{t:'error'; code: string; message: string}`.
- Room rules:
  - Room id: 6 chars from `ABCDEFGHJKMNPQRSTVWXYZ23456789`. Link: `/r/<roomId>`.
  - Seat token: 32 hex chars from `crypto.randomBytes`. `join` with a valid token reclaims the seat; Review Focus 2: an existing socket on that seat gets `error{code:'replaced'}` and is closed.
  - Review Focus 5: name trimmed; empty → `error{code:'bad_name'}`; cut to 20 chars; duplicate gets ` 2`, ` 3` suffix.
  - Max 4 seats; join after start without a token → `error{code:'started'}`.
  - Colors assigned in seat order `ember, tide, moss, bone`.
  - Host = first seat; if host leaves before start, next seat becomes host.
  - Actions applied strictly one at a time per room (synchronous `applyAction`; no awaits between check and apply). After each, broadcast a fresh `game` message to every socket with its own `viewFor` and `legalActions`.
  - Turn timer: if `turnTimerSec > 0`, `deadline = now + turnTimerSec*1000` for each pending player when they become pending; on expiry call `autoAct` until that player is no longer pending.
  - Disconnect with timer off: track `since` per disconnected pending player; after 120 s host may send `host{cmd:'autopilot'}` (server then `autoAct`s for that player whenever pending, until they reconnect) or `host{cmd:'remove'}` (player becomes permanent autopilot; their hand returned to bank). `host` cmds before 120 s → `error{code:'too_soon'}`.
  - Room deleted 10 minutes after the last socket disconnects; its snapshot file deleted too.
- Produces (persist.ts): `saveRoom(snapshot: RoomSnapshot): void` writes `data/rooms/<id>.json` via temp file + rename; `loadRooms(): RoomSnapshot[]`; `deleteRoom(id)`. `RoomSnapshot = { id; seats: {id; name; color; seatToken; autopilot: boolean}[]; host; settings; game: GameState|null }`. Saved after every lobby change and action. `index.ts` loads snapshots on boot.

- [ ] **Step 1:** `room.test.ts` (Room class driven directly with fake sockets): create/join/start flow; name rules; reclaim seat by token; replaced socket gets error; second confirm of a trade gets error and state is consistent; timer expiry calls autopilot (use Vitest fake timers); `host` cmd before 120 s gives `too_soon`, after 120 s works.
- [ ] **Step 2:** `persist.test.ts`: save then load round-trips a mid-game room in a temp dir; a room restored from a snapshot accepts the next action.
- [ ] **Step 3:** `ws.test.ts`: start server on a random port, 3 `ws` clients create/join/start, each receives a `game` message whose view hides others' hands.
- [ ] **Step 4:** Run `npm -w server test`, expect FAIL.
- [ ] **Step 5:** Implement. `index.ts`: WS at path `/ws`; in production (`NODE_ENV=production`) also serve `client/dist` with SPA fallback so `/r/<id>` loads the app.
- [ ] **Step 6:** Run, expect PASS.
- [ ] **Step 7:** Commit `feat(server): rooms, protocol, persistence`.

---

### Task 12: Client shell, theme, lobby

**Files:**
- Create: `client/src/net/socket.ts`, `client/src/state/useGame.ts`, `client/src/theme/theme.css`, `client/src/screens/Home.tsx`, `client/src/screens/Lobby.tsx`
- Modify: `client/src/App.tsx`, `client/index.html`

**Interfaces:**
- Consumes: protocol types from `shared/src/protocol.ts` (Task 11).
- Produces: `useGame(): { status: 'connecting'|'open'|'closed'; joined; lobby; game; error; send(msg) }`. Seat token stored in `localStorage` under `runeshore:seat:<roomId>` (wrapped in try/catch). Auto-reconnect with backoff 0.5 s → 5 s, re-sending `join` with token.
- Theme tokens in `theme.css`: `--night: #14122b`, `--night-2: #1f1b40`, `--ink-gold: #e8c26a`, `--ink-gold-dim: #a8893f`, `--parchment: #efe3c4`, `--blood: #b8433a`; player colors `--ember: #e0703a`, `--tide: #4fa3c7`, `--moss: #7fb35a`, `--bone: #d9d2bf`. Fonts from Google Fonts: `Cinzel` for headings, `Inter` for body/numbers.

- [ ] **Step 1:** Home: title "Runeshore", name field, "Create room" button → `create` → navigate to `/r/<id>`.
- [ ] **Step 2:** Lobby at `/r/<id>`: if no seat, name field + "Take a seat"; seat list with color chips and connected dots; copy-link button; host sees settings (board mode, Renown target 8–15, discard limit 7–10, turn timer off/60/90/120) and "Begin" (enabled at 3–4 seats). Error messages in plain words (e.g. `started` → "This game already began.").
- [ ] **Step 3:** Run `npm run dev`; open two browser tabs, create and join; seats show in both. Reload a tab: it keeps its seat.
- [ ] **Step 4:** Commit `feat(client): theme, lobby, connection`.

---

### Task 13: Board rendering

**Files:**
- Create: `client/src/board/Board.tsx`, `client/src/board/art.tsx`
- Modify: `client/src/screens/Game.tsx` (create)

**Interfaces:**
- Consumes: `vertexPixel`, `hexPixel`, `ALL_VERTICES`, `ALL_EDGES`, `PlayerView`, `legal: Action[]`.
- Produces: `<Board view legal onAction(a: Action) />`. Clickable vertex/edge/hex hit targets appear only where a legal action exists for the current selection mode (`'outpost'|'path'|'citadel'|'shade'|null`, held in `Game.tsx`).

- [ ] **Step 1:** Art (original, inked SVG, gold strokes on night): one tile design per terrain — Clay (cracked kiln rocks), Timber (ink pines), Fleece (curled hills with sheep glyphs), Harvest (sheaf rows), Starmetal (crystal crags), Ashen waste (cinder dunes). Number tokens as rune-ringed medallions; 6 and 8 in `--blood`, pips under the number. Ports as small banner flags on coast with ratio and resource glyph. Outpost = watchtower silhouette, Citadel = keep with two spires, Path = inked plank line, The Shade = hooded wisp. All drawn by hand in SVG paths; nothing traced from other games.
- [ ] **Step 2:** Board scales to fit its container; sea is a dark field with faint wave ink lines.
- [ ] **Step 3:** Run dev, start a 3-player game in 3 tabs, place setup pieces by clicking. Each tab sees the same board.
- [ ] **Step 4:** Commit `feat(client): board art and placement`.

---

### Task 14: Game panels and comic moments

**Files:**
- Create: `client/src/panels/Hand.tsx`, `Build.tsx`, `Trade.tsx`, `Omens.tsx`, `Players.tsx`, `Log.tsx`, `Discard.tsx`, `ShadeSteal.tsx`, `client/src/fx/ComicPanel.tsx`
- Modify: `client/src/screens/Game.tsx`

**Interfaces:**
- Consumes: `useGame`, `legal`, `view`, `events`.

- [ ] **Step 1:** Layout: board center; right column Players (name, color, Renown visible, hand count, omen count, awards, timer ring for whoever is pending), Log below; bottom bar Hand (resource cards in Runeshore card frames: tall rune-bordered panels with terrain glyph, original design), Build buttons with cost glyphs, Omens hand, Trade button, Roll / End turn.
- [ ] **Step 2:** Trade panel: build an offer (give/get steppers), send to all or chosen players; incoming offers show accept/decline; offerer sees who accepted and confirms one. Bank/port trade tab shows best ratio per resource from `legal`.
- [ ] **Step 3:** Discard modal (pick exactly N), Shade-steal picker, Bounty/Hoard pickers, Waymaking prompts.
- [ ] **Step 4:** ComicPanel: a short (≈1.2 s) inked panel with a caption for `rolled` (dice faces), `shadeMoved`, `stole`, award changes, `won` (full-screen panel with final Renown table and "Back to lobby"). Caption words use Runeshore terms only.
- [ ] **Step 5:** Run dev, play a full 3-player game across 3 tabs to a win. Check every Omen, a player trade, a port trade, a 7 with discards. Log any bug, fix in the owning file with a test where the engine is at fault.
- [ ] **Step 6:** Commit `feat(client): game panels and comic moments`.

---

### Task 15: Production build and play-with-friends guide

**Files:**
- Create: `README.md`
- Modify: `server/package.json` (`build`: `tsc` to `dist`, `start`: `node dist/index.js`) — or run with `tsx` in production if bundling shared TS is awkward; builder's call.

- [ ] **Step 1:** `npm run build && npm start`; open `http://localhost:3001`, create a room, join from a second browser. Works.
- [ ] **Step 2:** Restart the server mid-game; reload both tabs; game resumes from snapshot.
- [ ] **Step 3:** README in plain steps for the owner: start locally (`npm install`, `npm run dev`), play with friends on the same Wi-Fi (use the PC's LAN IP), play over the internet for a night via `cloudflared tunnel --url http://localhost:3001` (install with `winget install Cloudflare.cloudflared`). Hosting on a real site is a later phase.
- [ ] **Step 4:** Run `npm test`. Expected: all pass.
- [ ] **Step 5:** Commit `docs: how to run and play`.
