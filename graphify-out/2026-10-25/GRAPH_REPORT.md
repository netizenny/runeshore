# Graph Report - Runeshore  (2026-10-25)

## Corpus Check
- 134 files · ~71,620 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 921 nodes · 2960 edges · 35 communities (32 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8cf134c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apply.ts
- Game.tsx
- Room
- HF Plan & Server Room
- hf-sentinels.test.ts
- Build & Offers Panels
- Pages CI Workflow
- Piece Art
- constants.ts
- Client App & Socket
- hf-arcana-guild.test.ts
- apply.ts
- client/package.json
- geometry.ts
- HF State & Tests
- DI Data Model
- Server Package Deps
- Phases
- hf-arcana-crown.test.ts
- hf-improve.test.ts
- di-raider.test.ts
- Arcana Guild/Lore Tests
- legal.ts
- Sentinel Tests
- hf-dice.test.ts
- Shared Package Config
- types.ts
- Client TS Config
- Hollow Fleet Demo GIF
- Server TS Config
- turn.ts
- Shared TS Config
- Project CLAUDE.md
- Building & Trading Task
- Task 7: Building and trading

## God Nodes (most connected - your core abstractions)
1. `applyAction()` - 53 edges
2. `GameState` - 51 edges
3. `edgeVertices()` - 43 edges
4. `PlayerId` - 41 edges
5. `Action` - 41 edges
6. `vitest` - 39 edges
7. `legalActions()` - 39 edges
8. `vertexEdges()` - 37 edges
9. `Room` - 35 edges
10. `player()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Global constraints` --references--> `Scenario`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/board/scenarios/landfall.ts
- `[x] Phase 1: Scenario data and geometry` --references--> `Scenario`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/board/scenarios/landfall.ts
- `[x] Phase 1: Scenario data and geometry` --references--> `createGame()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/engine/create.ts
- `[ ] Phase 2: Fog and setup` --references--> `dealMist()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/engine/mist.ts
- `Global constraints` --references--> `liftMist()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/engine/mist.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared rules engine build tasks** — docs_superpowers_plans_2026_10_21_runeshore_base_game_task5_setup_production, docs_superpowers_plans_2026_10_21_runeshore_base_game_task6_shade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task7_build_trade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task8_omens, docs_superpowers_plans_2026_10_21_runeshore_base_game_task9_awards [EXTRACTED 1.00]
- **Drowned Isles shipped scenarios** — docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_first_landfall, docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_quartet_reach, docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_veiled_reach [EXTRACTED 1.00]
- **Lobby UI elements** — hollow_fleet_siege_player_list, hollow_fleet_siege_copy_link, hollow_fleet_siege_host_wait [EXTRACTED 1.00]
- **Runeshore plan documents** — docs_superpowers_plans_2026_10_21_runeshore_session_phases_doc, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_doc [INFERRED 0.85]

## Communities (35 total, 3 thin omitted)

### Community 0 - "apply.ts"
Cohesion: 0.06
Nodes (87): Longest route (paths + boats), [ ] Phase 2: Fog and setup, boardGeometry(), edgeVertices(), isLandHex(), landHexesAt(), of(), pathEdgeOn() (+79 more)

### Community 1 - "Game.tsx"
Cohesion: 0.05
Nodes (91): BoatPiece(), BulwarkRim(), Citadel(), HALO, ink, LandfallFlag(), Outpost(), PathLine() (+83 more)

### Community 2 - "Room"
Cohesion: 0.06
Nodes (33): DIST, MIME, startServer(), DATA_DIR, deleteRoom(), loadRooms(), RoomSnapshot, saveRoom() (+25 more)

### Community 3 - "HF Plan & Server Room"
Cohesion: 0.12
Nodes (25): App(), roomOf(), connect(), Status, wsUrl(), Home(), Lobby, ac() (+17 more)

### Community 4 - "hf-sentinels.test.ts"
Cohesion: 0.39
Nodes (8): act(), chain(), err(), give(), me(), ok(), other(), setup()

### Community 5 - "Build & Offers Panels"
Cohesion: 0.07
Nodes (33): Cinzel and Inter Google Fonts, src/main.tsx module entry (#root), Runeshore base game implementation plan, applyAction deterministic engine dispatcher, PlayerView hidden-info filter, Review focus edge cases, Task 10: legalActions, autoAct, viewFor, fuzz, Task 11: Server rooms, protocol, persistence (+25 more)

### Community 6 - "Pages CI Workflow"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, VITE_BASE, VITE_WS_URL (+21 more)

### Community 7 - "Piece Art"
Cohesion: 0.17
Nodes (14): applyAction(), bad(), ok(), rich(), act(), stateWith(), rigged(), roll() (+6 more)

### Community 8 - "constants.ts"
Cohesion: 0.09
Nodes (40): Book, BOOKS, OMEN_ICON, t(), TERMS, Topic, dealRandom(), generateBoard() (+32 more)

### Community 9 - "Client App & Socket"
Cohesion: 0.10
Nodes (23): Runeshore build phases in 5-hour sessions, Large random map (37-hex), Phase 1: Base game (sessions 1-8), Phase 2: Polish and hosting (session 9), Phase 3: Siege of the Hollow Fleet (sessions 10-16), Phase 4+: remaining expansions, Session 10b: In-game Rulebook, H9-H12: Arcana deck (Lore, Guild, Crown suits) (+15 more)

### Community 10 - "hf-arcana-guild.test.ts"
Cohesion: 0.24
Nodes (4): arcState(), play(), beside(), hexOf()

### Community 11 - "apply.ts"
Cohesion: 0.23
Nodes (11): ANYONE, Handler, HANDLERS, checkWin(), glory(), longestPathLength(), updateAwards(), hfScore() (+3 more)

### Community 12 - "client/package.json"
Cohesion: 0.11
Nodes (22): dependencies, react@^18.3.1, react-dom@^18.3.1, @runeshore/shared@*, devDependencies, @types/react@^18.3.0, @types/react-dom@^18.3.0, vite@^5.4.0 (+14 more)

### Community 13 - "geometry.ts"
Cohesion: 0.06
Nodes (54): ALL_EDGES, COAST_EDGES, commonNeighbors(), cornerVertex(), DIRS, hexNeighbor(), isPathEdge(), LAND_HEXES (+46 more)

### Community 14 - "HF State & Tests"
Cohesion: 0.12
Nodes (19): @types/node, @types/ws, ws, dependencies, @runeshore/shared@*, ws@^8.18.0, devDependencies, @types/node@^22.0.0 (+11 more)

### Community 15 - "DI Data Model"
Cohesion: 0.15
Nodes (17): Runeshore Drowned Isles Plan, Boat (ship), Deep hex (sea), DIState (state.di expansion slice), Drowned Isles DLC (Seafarers-style expansion), engine/mist.ts (liftMist), First Landfall scenario, Glimmer field (gold) (+9 more)

### Community 16 - "Server Package Deps"
Cohesion: 0.14
Nodes (16): devDependencies, concurrently@^9.0.0, tsx@^4.19.0, typescript@^5.6.0, vitest@^2.1.0, name, private, scripts (+8 more)

### Community 17 - "Phases"
Cohesion: 0.14
Nodes (14): Assumptions to confirm (small), Global constraints, Layout (copied from the screenshot), Name map (Colonist to Runeshore), [ ] Phase 3: Lobby target and gold, [ ] Phase 4: Client board and art, [ ] Phase 5: Cities & Knights, [ ] Phase 6: Ship it (+6 more)

### Community 18 - "hf-arcana-crown.test.ts"
Cohesion: 0.28
Nodes (5): NONE, other(), terrainHex(), withPath(), zero

### Community 19 - "hf-improve.test.ts"
Cohesion: 0.17
Nodes (14): vitest, ALL_VERTICES, DEFAULT_SETTINGS, hfState(), PLAYERS, err(), fleetAt(), ok() (+6 more)

### Community 20 - "di-raider.test.ts"
Cohesion: 0.30
Nodes (7): hexVertices(), placePeddler(), HexId, game(), glimmered(), hexOf(), raided()

### Community 22 - "Arcana Guild/Lore Tests"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, module, moduleResolution, noEmit, noUncheckedIndexedAccess, skipLibCheck, strict (+2 more)

### Community 24 - "legal.ts"
Cohesion: 0.09
Nodes (44): [x] Phase 1: Scenario data and geometry, nextMove(), ARCANA, ARCANA_HAND_MAX, HF_BANK_EACH, isCommodity(), SENTINELS_PER_RANK, currentPlayer() (+36 more)

### Community 25 - "Sentinel Tests"
Cohesion: 0.22
Nodes (8): services, buildCommand, healthCheckPath, name, plan, runtime, startCommand, type

### Community 26 - "hf-dice.test.ts"
Cohesion: 0.46
Nodes (7): act(), cur(), hand(), rig(), roll(), target(), total()

### Community 27 - "Shared Package Config"
Cohesion: 0.25
Nodes (7): main, name, private, scripts, test, type, version

### Community 28 - "types.ts"
Cohesion: 0.20
Nodes (10): ArcanaArg, DIState, OmenKind, Phase, Port, TradeOffer, bad(), me() (+2 more)

### Community 29 - "Client TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, extends, include, ../tsconfig.base.json

### Community 30 - "Hollow Fleet Demo GIF"
Cohesion: 0.33
Nodes (6): Copy Invite Link Button, Hollow Fleet Siege (demo subject), Hollow Fleet Siege Demo GIF, Waiting For Host To Begin Status, Lobby Player List (Mira host, Tolan, JayJay), Room Lobby Screen (Room MRHGTF)

### Community 31 - "Server TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../tsconfig.base.json

### Community 32 - "turn.ts"
Cohesion: 0.09
Nodes (45): ARCANA_INSTANT, ArcanaDef, COMMODITY_OF, FLEET_TRACK, FRAME, NOT_LAND, SPIRE_LEVEL, TRACK_COMMODITY (+37 more)

### Community 33 - "Shared TS Config"
Cohesion: 0.50
Nodes (3): extends, include, ../tsconfig.base.json

## Knowledge Gaps
- **37 isolated node(s):** `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json`, `Longest route (paths + boats)`, `Deep hex (sea)` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 225 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `hf-improve.test.ts` to `apply.ts`, `Room`, `hf-sentinels.test.ts`, `Piece Art`, `constants.ts`, `hf-arcana-guild.test.ts`, `apply.ts`, `geometry.ts`, `Server Package Deps`, `hf-arcana-crown.test.ts`, `di-raider.test.ts`, `legal.ts`, `hf-dice.test.ts`, `types.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apply.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06455445544554456 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Game.tsx` to `Room`, `HF Plan & Server Room`, `client/package.json`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `Game.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051874062968515745 - nodes in this community are weakly interconnected._
- **Why does `Action` connect `Game.tsx` to `apply.ts`, `turn.ts`, `Room`, `hf-sentinels.test.ts`, `Piece Art`, `apply.ts`, `hf-improve.test.ts`, `di-raider.test.ts`, `legal.ts`, `hf-dice.test.ts`, `types.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `Room` be split into smaller, more focused modules?**
  _Cohesion score 0.06201550387596899 - nodes in this community are weakly interconnected._