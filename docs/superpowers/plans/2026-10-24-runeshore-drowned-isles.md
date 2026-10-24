# Runeshore: Drowned Isles (Seafarers) Plan

Date: 2026-10-24. Status: PLAN ONLY, no code written yet.

Goal: add the Seafarers-style expansion as an optional lobby DLC, "Drowned Isles".
Rules follow official Catan Seafarers and Colonist.io (memory: official-rules-dlcs).
Names and art are Runeshore-only (nothing matches Catan or Colonist).

## Global constraints

- Each phase ends green (`npm test`, fuzz) and is committed. NO push until all phases done, then one push + Render redeploy (memory: push-after-dlc).
- No self-ping or keep-alive code (memory: no-self-ping).
- Expansion is a lobby toggle; with it off, base game and Hollow Fleet behave exactly as today (existing tests must stay green).
- Before each phase, resolve every **[verify]** item against the official Seafarers rulebook and Colonist behavior (web search). Where they differ, say so and ask.
- Before reading files, query graphify (`graphify-out`). After new files, run `/graphify . --update`.

## Research summary (official Seafarers)

- Ships: cost 1 lumber + 1 wool, placed on sea-touching edges, chain from a coastal settlement or an existing ship. 15 per player. The open end ship of a route can be moved (one per turn, not one built this turn, not a closed route). [verify exact timing and limits]
- Roads and ships join only at a settlement/city. Longest route counts roads + ships, min 5; an opponent settlement breaks it. [verify: route-through-settlement rule]
- Pirate: on a 7, player moves robber OR pirate. Pirate sits on a sea hex, steals 1 card from an adjacent-ship owner, blocks building/moving ships on its hex edges. Does not block production. [verify: pirate before/after first 7 variants]
- Gold fields: a settlement on a rolled gold hex gets 1 resource of choice, a city 2. [verify: bank-shortage with choices]
- Island bonus: first settlement on a new island earns special VP. [verify: 1 vs 2 VP per edition; Colonist value]
- Harbors work as base game; ship-reachable coast.
- Fog hexes (hidden until a ship/road reaches them), desert crossings, tribes, cloth, wonders are scenario-specific.
- Scenarios (official): Heading for New Shores, Four Islands, Fog Islands, Through the Desert, Forgotten Tribe, Cloth for Catan, Pirate Islands, Wonders of Catan. [verify which Colonist ships]

## Runeshore names and look

| Official | Runeshore | Look |
|---|---|---|
| Seafarers | Drowned Isles | comic-panel title card, flooded-ruins banner |
| Ship | Boat | slim longboat, shell-sail in player color, lantern at the bow |
| Pirate | Raider | ghost boat, black torn sail, green lantern, eye-glow |
| Gold field | Glimmer field | prism-shard hex, resource pick spinner |
| Sea | Deep (hex) | ink-teal with halftone wave dots, no tokens |
| Fog hex | Mist | swirling parchment fog, lifts to reveal terrain |
| Island bonus VP | Landfall mark | small gold flag tile on the new isle |
| Heading for New Shores | First Landfall | 3 isles, easiest, default |
| Four Islands | Quartet Reach | 4 isles, start anywhere |
| Fog Islands | Veiled Reach | Mist-heavy |
| Through the Desert | Ashen Crossing | uses `ashen` terrain strip |
| Forgotten Tribe | Hollow Kin | native settlements, trade rewards |
| Cloth for Catan | Silk Tithe | villages pay Silk tokens |
| Pirate Islands | Raider Cove | Raider raids, fortress capture |
| Wonders of Catan | Spires | build-a-spire race |

Scope cut (ponytail): Phases 1-5 ship First Landfall + Quartet Reach + Veiled Reach. The other five scenarios are Phase 6, optional, one at a time.

## Touchpoints (from graph)

shared: `types.ts` (Board, Hex terrain, Edge), `board/generate.ts` + geometry, `engine/create.ts`, `engine/build.ts` (canPay, build), `engine/legal.ts` (legalActions, autoAct), `engine/turn.ts` (7 / shade flow), `engine/awards.ts` (longest path), `engine/hf/*` as the pattern for an opt-in expansion module (`engine/di/*`).
client: `board/Board.tsx`, `board/TerrainArt`, `panels/Build.tsx`, `panels/Rulebook` + `rules/BOOKS`, `screens/Lobby`.
server: `RoomOpts` (new `drownedIsles` + `scenario`).

## Phase 1 spec (2026-10-24)

### Rules table (verify items resolved)

Sources: official 5th-ed rules text (ultraboardgames summary) + catan.com FAQ. Colonist.io pages were not retrievable; Colonist-specific values are marked **[ask]**.

| Item | Decision | Status |
|---|---|---|
| Boat cost / cap | 1 timber + 1 fleece, 15 per player | official |
| Boat edges | Edge between deep+deep or deep+land. Never land+land. A coast edge holds a path OR a boat, not both | official |
| Boat placement | Must touch own coastal outpost/citadel or own boat. Branching allowed | official |
| Boat/path link | Join only at own outpost/citadel on the shared vertex | official |
| Move a boat | 1 per turn, main phase; not one built this turn; only if one end vertex touches none of own other pieces; never in a closed route; destination follows build rules; not away from a raider-bordered edge | official |
| Longest route | Paths + boats, open or closed, min 5, 2 renown. Foreign outpost/citadel breaks the chain (same as base `awards.ts`). Moving a boat keeps the award if route stays at least as long | official + base rule |
| Raider | On a 7 or Warden play: move shade OR raider. Raider only on a deep hex. Steal 1 card from one player with a boat on an adjacent edge. Blocks new boats on its edges and moving boats off them. Does NOT block production | official |
| Raider start | Off-board until first moved. **[ask]** Colonist variant | ask |
| Glimmer field | Roll hits token: outpost 1, citadel 2, any resource(s) of choice. Not a card. Bank short: reduce picks to what bank has (base shortage rule). **[ask]** Colonist behavior | partly ask |
| Landfall mark | First outpost on each new isle (not home isle) = +2 renown, once per isle per player. Official scenario 1 uses 2. **[ask]** Colonist value | ask |
| Harbors | As base, pre-placed on scenario map | official |
| Setup | Home isle only (First Landfall). Start boat allowed instead of path next to a coastal outpost | official |
| Waymaking omen | 2 paths, 2 boats, or 1 each | official |
| Colonist scenario list | Not verified | ask |

### Data model (no code yet)

- `types.ts`: `Terrain` adds `'deep' | 'glimmer' | 'mist'`. `Settings` adds `drownedIsles: boolean` (default false) and `scenario: 'landfall' | 'quartet' | 'veiled'` (default 'landfall'). `GameState` adds `boats: Record<EdgeId, PlayerId>` (`{}` when off) and optional `di?: DIState`.
- `DIState`: `{ raiderHex: HexId | null; boatsLeft: Record<PlayerId, number>; builtTurn: Record<EdgeId, number>; movedTurn: number; landfall: Record<PlayerId, string[]>; isleOf: Record<HexId, string>; homeIsle: string; revealed: HexId[] }` (`revealed` used from Phase 6).
- A boat is movable if `builtTurn[edge] < state.turn` and `di.movedTurn !== state.turn`.
- Phases: reuse `moveShade` (action gains `raider?: true`, hex must be `deep`) and `steal` (victims from adjacent boats). New phase `{ k: 'glimmer'; pending: Record<PlayerId, number>; then: 'main' }`, resolved by `chooseGlimmer { cards }`.
- New actions: `buildBoat {edge}`, `moveBoat {from,to}`, `chooseGlimmer {cards}`. New events: `boatBuilt`, `boatMoved`, `landfall`, `raiderMoved`, `glimmered`.
- Deep hexes ARE stored in `board.hexes` on scenario boards (terrain `deep`, token null). Base and large boards keep implicit sea, so their code paths are untouched.

### Hex ids and geometry (resolves the id risk)

- Current state: `geometry.ts` `universe(radius, big)` builds a hex disc once per size; `isBig` checks an `L` prefix; sea is implicit.
- Scenario boards use prefix `S<scenario letter>`: `Sf3,-1` (landfall), `Sq`, `Sv`. Replace `isBig` + `of(id)` with a prefix lookup table; `''` and `L` entries stay as is.
- Generalize `universe(radius, big)` to `universe(hexList, prefix)`; standard/large call it with their discs. Their output must be identical (existing tests prove it).
- `landSet` = non-deep hexes, so `vertexHexes` and production are unchanged. A vertex is buildable only if one adjacent hex is land. Edge kinds derived: `land` (both land), `coast`, `sea`. Paths on land/coast, boats on coast/sea.
- `isleOf` from a flood fill over land adjacency at layout load; home isle = isle of the hex flagged `home`.

### Scenario map format

`shared/src/board/scenarios/landfall.ts`: `{ id, name, players: number[], hexes: [q, r, Terrain, token | null, home?][], ports: [hexA, hexB, kind][] }`. Hand-authored; layouts written in Phase 2.

### Interactions

- Hollow Fleet and Drowned Isles are mutually exclusive (user decision 2026-10-24): lobby toggling one turns the other off; engine never sees both. No sentinel/raider interaction to build.
- Large map and Drowned Isles are mutually exclusive in the lobby (scenario picks the board).
- Toggle off: `boats` is `{}`, no `di`, no new phases; existing tests unchanged.

### Open questions for the user

1. Landfall = 2 renown (official scenario 1)? Colonist value unverified.
2. Raider off-board until first moved (official)?
3. Glimmer with short bank: reduce picks (proposed)?

## Phases (each ~one 5-hour session)

### [x] Phase 1: Design and geometry (spec above)
- Spec the data model: `Hex.terrain` adds `deep`, `glimmer`, `mist`; per-edge/vertex validity from adjacent land/sea; `Boat` ownership on edges; `state.di` expansion slice (raider hex, boats left, landfall marks, revealed mist).
- Static scenario map format (hand-authored layouts, not random) with island ids.
- Resolve all [verify] items above; write results into this file.
- Done when: spec section + final rules table committed; no engine code.

### [x] Phase 2: Board and setup (done 2026-10-24)
- Layout loader for First Landfall; vertex/edge validity (sea edges, coastal vertices); ports on islands.
- Setup placement allowed on the home isle only for First Landfall (per scenario rule).
- Lobby toggle + scenario picker; `RoomOpts` and persistence.
- Done when: generate/setup tests pass, fuzz still green with toggle off.
- Done notes: `shared/src/board/scenarios/landfall.ts` (radius-3 disc, 16 land hexes in 3 isles, 9 ports, rest Deep); geometry keyed by id prefix (`''`, `L`, `Sf`), `isPathEdge`; `createGame` sets `state.di = {isleOf, homeIsle}` (boats/raider fields arrive in phases 3-4); `setupSpotOk` limits setup to home isle; lobby Mode option + server exclusivity (HF / large map), default target 14. Tests: `di-board.test.ts`, fuzz block, room test. 174 shared + 23 server green. Not hand-clicked in browser (deep hexes use placeholder art until phase 5).

### [ ] Phase 3: Boats and routes
- Build boat (1 timber + 1 fleece), 15 cap, adjacency rules, move open-end boat once per turn.
- Longest route across paths + boats; settlement breaking; Landfall marks (+ VP).
- legalActions / autoAct / viewFor updates; tests for move legality and route length.
- Done when: new `di-*.test.ts` green, fuzz over 50 seeds with expansion on.

### [ ] Phase 4: Raider and Glimmer
- Seven flow: move shade OR raider; steal from adjacent boat owner; block boat build/move at its hex.
- Glimmer production: pick-a-resource action (1 settlement, 2 city), bank-shortage handling, auto-pick for bots/timeouts.
- Done when: raider + glimmer tests green; fuzz green.

### [ ] Phase 5: UI, art, rules book
- Deep/Glimmer/Mist hex art, Boat and Raider sprites, Landfall flags, glimmer picker panel, boat build/move interaction on Board, rulebook "Drowned Isles" chapter, comic moment on first landfall and raider raid.
- Done when: playtested with WS bots plus the built-in browser, mobile width checked.

### [ ] Phase 6: More scenarios (optional, one per sitting)
- Quartet Reach, Veiled Reach (Mist reveal on reach, gold on reveal), then Ashen Crossing, Hollow Kin, Silk Tithe, Raider Cove, Spires.
- Each: map, scenario rules module, tests, art, rulebook entry.

### [ ] Phase 7: Ship it
- Full fuzz with Drowned Isles on (Hollow Fleet off) and each alone, update memory/docs, `/graphify . --update`.
- Single commit set already per phase; then `git push` and Render redeploy (explicitly requested by user for this DLC).

## Risks
- Hex-id scheme ("q,r", `L` prefix for large map) must extend to arbitrary shapes; Phase 1 decides.
- Hollow Fleet also uses "fleet" wording and a Fleet panel; keep Boat UI separate to avoid confusion.
