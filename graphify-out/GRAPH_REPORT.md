# Graph Report - Runeshore  (2026-10-25)

## Corpus Check
- 131 files · ~69,380 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 888 nodes · 2886 edges · 46 communities (42 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c60e9b01`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- setup.ts
- Game.tsx
- persist.test.ts
- HF Plan & Server Room
- turn.ts
- Build & Offers Panels
- Pages CI Workflow
- Piece Art
- content.ts
- Client App & Socket
- GameState
- edgeVertices
- client/package.json
- geometry.ts
- HF State & Tests
- DI Data Model
- Server Package Deps
- Board.tsx
- hf-arcana-crown.test.ts
- hf-improve.test.ts
- di-raider.test.ts
- room.ts
- Arcana Guild/Lore Tests
- arcana-politics.ts
- vitest
- Sentinel Tests
- Fleet & Commodity Panels
- Shared Package Config
- constants.ts
- Client TS Config
- Hollow Fleet Demo GIF
- Server TS Config
- PlayerId
- Shared TS Config
- Project CLAUDE.md
- Building & Trading Task
- Task 7: Building and trading
- Room
- apply.ts
- emptyCounts
- react
- shared/src/index.ts
- state.ts
- fleet.ts
- improve.ts
- hf-dice.test.ts

## God Nodes (most connected - your core abstractions)
1. `applyAction()` - 53 edges
2. `GameState` - 51 edges
3. `edgeVertices()` - 42 edges
4. `PlayerId` - 41 edges
5. `Action` - 41 edges
6. `legalActions()` - 39 edges
7. `vitest` - 38 edges
8. `vertexEdges()` - 37 edges
9. `Room` - 35 edges
10. `player()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Siege of the Hollow Fleet mode (README)` --conceptually_related_to--> `Siege of the Hollow Fleet implementation plan`  [INFERRED]
  README.md → docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md
- `Board()` --calls--> `boardGeometry()`  [EXTRACTED]
  client/src/board/Board.tsx → shared/src/board/geometry.ts
- `Board()` --calls--> `edgeVertices()`  [EXTRACTED]
  client/src/board/Board.tsx → shared/src/board/geometry.ts
- `Board()` --calls--> `hexPixel()`  [EXTRACTED]
  client/src/board/Board.tsx → shared/src/board/geometry.ts
- `Board()` --calls--> `hexVertices()`  [EXTRACTED]
  client/src/board/Board.tsx → shared/src/board/geometry.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared rules engine build tasks** — docs_superpowers_plans_2026_10_21_runeshore_base_game_task5_setup_production, docs_superpowers_plans_2026_10_21_runeshore_base_game_task6_shade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task7_build_trade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task8_omens, docs_superpowers_plans_2026_10_21_runeshore_base_game_task9_awards [EXTRACTED 1.00]
- **Drowned Isles shipped scenarios** — docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_first_landfall, docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_quartet_reach, docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_veiled_reach [EXTRACTED 1.00]
- **Lobby UI elements** — hollow_fleet_siege_player_list, hollow_fleet_siege_copy_link, hollow_fleet_siege_host_wait [EXTRACTED 1.00]
- **Runeshore plan documents** — docs_superpowers_plans_2026_10_21_runeshore_session_phases_doc, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_doc [INFERRED 0.85]

## Communities (46 total, 4 thin omitted)

### Community 0 - "setup.ts"
Cohesion: 0.12
Nodes (43): Longest route (paths + boats), boardGeometry(), isLandHex(), landHexesAt(), pathEdgeOn(), BULWARKS_MAX, boatMovable(), boatSpotOk() (+35 more)

### Community 1 - "Game.tsx"
Cohesion: 0.10
Nodes (35): Mode, Pick, ArcanaHand(), arcanaPicks(), describe(), Play, playsOf(), spot() (+27 more)

### Community 2 - "persist.test.ts"
Cohesion: 0.15
Nodes (9): DIST, MIME, startServer(), DATA_DIR, deleteRoom(), loadRooms(), saveRoom(), Rooms (+1 more)

### Community 3 - "HF Plan & Server Room"
Cohesion: 0.14
Nodes (22): App(), roomOf(), connect(), Status, wsUrl(), Home(), Lobby, play() (+14 more)

### Community 4 - "turn.ts"
Cohesion: 0.18
Nodes (21): COMMODITY_OF, FRAME, NOT_LAND, afterFleet(), FACES, rollHF(), loreBonus(), afterSeven() (+13 more)

### Community 5 - "Build & Offers Panels"
Cohesion: 0.07
Nodes (33): Cinzel and Inter Google Fonts, src/main.tsx module entry (#root), Runeshore base game implementation plan, applyAction deterministic engine dispatcher, PlayerView hidden-info filter, Review focus edge cases, Task 10: legalActions, autoAct, viewFor, fuzz, Task 11: Server rooms, protocol, persistence (+25 more)

### Community 6 - "Pages CI Workflow"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, VITE_BASE, VITE_WS_URL (+21 more)

### Community 7 - "Piece Art"
Cohesion: 0.12
Nodes (23): vitest, ALL_VERTICES, PIECES, applyAction(), bad(), net(), ok(), rich() (+15 more)

### Community 8 - "content.ts"
Cohesion: 0.14
Nodes (14): Omens(), Rulebook(), Book, BOOKS, OMEN_ICON, t(), TERMS, Topic (+6 more)

### Community 9 - "Client App & Socket"
Cohesion: 0.10
Nodes (23): Runeshore build phases in 5-hour sessions, Large random map (37-hex), Phase 1: Base game (sessions 1-8), Phase 2: Polish and hosting (session 9), Phase 3: Siege of the Hollow Fleet (sessions 10-16), Phase 4+: remaining expansions, Session 10b: In-game Rulebook, H9-H12: Arcana deck (Lore, Guild, Crown suits) (+15 more)

### Community 10 - "GameState"
Cohesion: 0.15
Nodes (12): hexVertices(), checkWin(), glory(), harvestAll(), placePeddler(), hfScore(), GameState, HexId (+4 more)

### Community 11 - "edgeVertices"
Cohesion: 0.18
Nodes (14): edgeVertices(), vertexEdges(), longestPathLength(), updateAwards(), openPath(), DEFAULT_SETTINGS, chain(), act() (+6 more)

### Community 12 - "client/package.json"
Cohesion: 0.11
Nodes (22): dependencies, react@^18.3.1, react-dom@^18.3.1, @runeshore/shared@*, devDependencies, @types/react@^18.3.0, @types/react-dom@^18.3.0, vite@^5.4.0 (+14 more)

### Community 13 - "geometry.ts"
Cohesion: 0.05
Nodes (81): generateBoard(), hot(), PORT_SLOTS, PORT_SLOTS_LARGE, randomizeScenario(), scenarioBoard(), scenarioIsles(), ALL_EDGES (+73 more)

### Community 14 - "HF State & Tests"
Cohesion: 0.12
Nodes (19): @types/node, @types/ws, ws, dependencies, @runeshore/shared@*, ws@^8.18.0, devDependencies, @types/node@^22.0.0 (+11 more)

### Community 15 - "DI Data Model"
Cohesion: 0.15
Nodes (17): Runeshore Drowned Isles Plan, Boat (ship), Deep hex (sea), DIState (state.di expansion slice), Drowned Isles DLC (Seafarers-style expansion), engine/mist.ts (liftMist), First Landfall scenario, Glimmer field (gold) (+9 more)

### Community 16 - "Server Package Deps"
Cohesion: 0.14
Nodes (16): devDependencies, concurrently@^9.0.0, tsx@^4.19.0, typescript@^5.6.0, vitest@^2.1.0, name, private, scripts (+8 more)

### Community 17 - "Board.tsx"
Cohesion: 0.17
Nodes (24): BoatPiece(), BulwarkRim(), Citadel(), ink, LandfallFlag(), Outpost(), PathLine(), PeddlerToken() (+16 more)

### Community 18 - "hf-arcana-crown.test.ts"
Cohesion: 0.28
Nodes (5): NONE, other(), terrainHex(), withPath(), zero

### Community 19 - "hf-improve.test.ts"
Cohesion: 0.24
Nodes (9): hfState(), err(), fleetAt(), ok(), act(), err(), ok(), setup() (+1 more)

### Community 20 - "di-raider.test.ts"
Cohesion: 0.48
Nodes (4): game(), glimmered(), hexOf(), raided()

### Community 21 - "room.ts"
Cohesion: 0.18
Nodes (9): RoomSnapshot, COLORS, Conn, RoomOpts, Seat, lobby(), started(), sock (+1 more)

### Community 22 - "Arcana Guild/Lore Tests"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, module, moduleResolution, noEmit, noUncheckedIndexedAccess, skipLibCheck, strict (+2 more)

### Community 23 - "arcana-politics.ts"
Cohesion: 0.16
Nodes (22): COMMODITIES, isCommodity(), arcanaCandidates(), pairs(), addSentinel(), arcanaGive(), arcanaPickSentinel(), desert() (+14 more)

### Community 24 - "vitest"
Cohesion: 0.26
Nodes (13): nextMove(), currentPlayer(), accepts(), autoAct(), discards(), legalActions(), pendingPlayers(), tradeRatio() (+5 more)

### Community 25 - "Sentinel Tests"
Cohesion: 0.22
Nodes (8): services, buildCommand, healthCheckPath, name, plan, runtime, startCommand, type

### Community 26 - "Fleet & Commodity Panels"
Cohesion: 0.39
Nodes (8): act(), chain(), err(), give(), me(), ok(), other(), setup()

### Community 27 - "Shared Package Config"
Cohesion: 0.25
Nodes (7): main, name, private, scripts, test, type, version

### Community 28 - "constants.ts"
Cohesion: 0.11
Nodes (20): ARCANA_INSTANT, ARCANA_PER_TRACK, ArcanaDef, BANK_EACH, BANK_EACH_BIG, BOATS_PER_PLAYER, cost(), INVENTOR_FIXED (+12 more)

### Community 29 - "Client TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, extends, include, ../tsconfig.base.json

### Community 30 - "Hollow Fleet Demo GIF"
Cohesion: 0.33
Nodes (6): Copy Invite Link Button, Hollow Fleet Siege (demo subject), Hollow Fleet Siege Demo GIF, Waiting For Host To Begin Status, Lobby Player List (Mira host, Tolan, JayJay), Room Lobby Screen (Room MRHGTF)

### Community 31 - "Server TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../tsconfig.base.json

### Community 32 - "PlayerId"
Cohesion: 0.18
Nodes (12): SeatInfo, ArcanaCard, GameEvent, HFState, PlayerId, PlayerState, eventFor(), GameView (+4 more)

### Community 33 - "Shared TS Config"
Cohesion: 0.50
Nodes (3): extends, include, ../tsconfig.base.json

### Community 38 - "apply.ts"
Cohesion: 0.20
Nodes (16): ANYONE, Handler, HANDLERS, buyOmen(), playOmen(), player(), bankTrade(), cancelTrade() (+8 more)

### Community 39 - "emptyCounts"
Cohesion: 0.32
Nodes (12): ResIcon(), Give, none(), Glimmer(), Hand(), Pick(), Trade(), Stepper() (+4 more)

### Community 40 - "react"
Cohesion: 0.23
Nodes (12): Cap, caption(), ComicPanel(), n(), DiceBook(), face(), glory(), hfGlory() (+4 more)

### Community 41 - "shared/src/index.ts"
Cohesion: 0.16
Nodes (9): Commodities(), GLYPH, DiceStats(), FACE, Fleet(), ShadeSteal(), FLEET_TRACK, HFView (+1 more)

### Community 42 - "state.ts"
Cohesion: 0.23
Nodes (11): ARCANA_HAND_MAX, HF_BANK_EACH, SENTINELS_PER_RANK, discardLimitFor(), initHF(), per(), TRACKS, zeroCom() (+3 more)

### Community 43 - "fleet.ts"
Cohesion: 0.44
Nodes (8): advanceFleet(), canDraw(), chooseLoss(), chooseReward(), citadels(), lose(), loseable(), VertexId

### Community 44 - "improve.ts"
Cohesion: 0.57
Nodes (7): drawArcana(), citadels(), gateDraws(), improve(), spire(), spireAt(), hfPlayer()

### Community 45 - "hf-dice.test.ts"
Cohesion: 0.46
Nodes (7): act(), cur(), hand(), rig(), roll(), target(), total()

## Knowledge Gaps
- **37 isolated node(s):** `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json`, `Longest route (paths + boats)`, `Deep hex (sea)` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 208 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Piece Art` to `setup.ts`, `persist.test.ts`, `content.ts`, `state.ts`, `edgeVertices`, `GameState`, `geometry.ts`, `hf-dice.test.ts`, `Server Package Deps`, `hf-arcana-crown.test.ts`, `hf-improve.test.ts`, `di-raider.test.ts`, `room.ts`, `vitest`, `Fleet & Commodity Panels`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `setup.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11755102040816326 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `Game.tsx`, `HF Plan & Server Room`, `emptyCounts`, `content.ts`, `shared/src/index.ts`, `client/package.json`, `Board.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Game.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09988385598141696 - nodes in this community are weakly interconnected._
- **Why does `Action` connect `Game.tsx` to `setup.ts`, `turn.ts`, `Piece Art`, `content.ts`, `edgeVertices`, `geometry.ts`, `Board.tsx`, `hf-improve.test.ts`, `di-raider.test.ts`, `arcana-politics.ts`, `vitest`, `Fleet & Commodity Panels`, `constants.ts`, `PlayerId`, `apply.ts`, `emptyCounts`, `shared/src/index.ts`, `fleet.ts`, `improve.ts`, `hf-dice.test.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `persist.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1455026455026455 - nodes in this community are weakly interconnected._