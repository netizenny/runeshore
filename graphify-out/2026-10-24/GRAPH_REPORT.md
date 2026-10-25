# Graph Report - Runeshore  (2026-10-24)

## Corpus Check
- 128 files · ~67,386 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 872 nodes · 2839 edges · 33 communities (30 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `984914d4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Board Geometry & HF Plan
- Node Builtins & Constants
- Board Generation
- HF Plan & Server Room
- legal.ts
- Build & Offers Panels
- Pages CI Workflow
- Piece Art
- constants.ts
- Client App & Socket
- hf-arcana-guild.test.ts
- awards.ts
- client/package.json
- geometry.ts
- HF State & Tests
- DI Data Model
- Server Package Deps
- apply.ts
- hf-arcana-crown.test.ts
- Root Package & Tooling
- GameState
- Arcana Guild/Lore Tests
- Sentinel Tests
- Fleet & Commodity Panels
- Shared Package Config
- HF Dice Tests
- Client TS Config
- Hollow Fleet Demo GIF
- Server TS Config
- Shared TS Config
- Project CLAUDE.md
- Building & Trading Task
- Task 7: Building and trading

## God Nodes (most connected - your core abstractions)
1. `applyAction()` - 53 edges
2. `GameState` - 51 edges
3. `edgeVertices()` - 42 edges
4. `Action` - 41 edges
5. `PlayerId` - 40 edges
6. `vitest` - 38 edges
7. `legalActions()` - 38 edges
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

## Communities (33 total, 3 thin omitted)

### Community 0 - "Board Geometry & HF Plan"
Cohesion: 0.08
Nodes (67): Longest route (paths + boats), boardGeometry(), edgeVertices(), isLandHex(), landHexesAt(), pathEdgeOn(), vertexEdges(), vertexNeighbors() (+59 more)

### Community 1 - "Node Builtins & Constants"
Cohesion: 0.06
Nodes (85): BoatPiece(), BulwarkRim(), Citadel(), ink, LandfallFlag(), Outpost(), PathLine(), PeddlerToken() (+77 more)

### Community 2 - "Board Generation"
Cohesion: 0.05
Nodes (43): DIST, MIME, startServer(), DATA_DIR, deleteRoom(), loadRooms(), RoomSnapshot, saveRoom() (+35 more)

### Community 3 - "HF Plan & Server Room"
Cohesion: 0.16
Nodes (18): App(), roomOf(), connect(), Status, wsUrl(), Home(), Lobby, ERRORS (+10 more)

### Community 4 - "legal.ts"
Cohesion: 0.05
Nodes (85): nextMove(), hexVertices(), ARCANA_HAND_MAX, ARCANA_INSTANT, COMMODITIES, COMMODITY_OF, HF_BANK_EACH, isCommodity() (+77 more)

### Community 5 - "Build & Offers Panels"
Cohesion: 0.07
Nodes (33): Cinzel and Inter Google Fonts, src/main.tsx module entry (#root), Runeshore base game implementation plan, applyAction deterministic engine dispatcher, PlayerView hidden-info filter, Review focus edge cases, Task 10: legalActions, autoAct, viewFor, fuzz, Task 11: Server rooms, protocol, persistence (+25 more)

### Community 6 - "Pages CI Workflow"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, VITE_BASE, VITE_WS_URL (+21 more)

### Community 7 - "Piece Art"
Cohesion: 0.12
Nodes (23): vitest, ALL_VERTICES, applyAction(), OmenKind, bad(), ok(), rich(), act() (+15 more)

### Community 8 - "constants.ts"
Cohesion: 0.09
Nodes (41): Book, BOOKS, OMEN_ICON, t(), TERMS, Topic, generateBoard(), hot() (+33 more)

### Community 9 - "Client App & Socket"
Cohesion: 0.10
Nodes (23): Runeshore build phases in 5-hour sessions, Large random map (37-hex), Phase 1: Base game (sessions 1-8), Phase 2: Polish and hosting (session 9), Phase 3: Siege of the Hollow Fleet (sessions 10-16), Phase 4+: remaining expansions, Session 10b: In-game Rulebook, H9-H12: Arcana deck (Lore, Guild, Crown suits) (+15 more)

### Community 10 - "hf-arcana-guild.test.ts"
Cohesion: 0.22
Nodes (3): play(), beside(), hexOf()

### Community 11 - "awards.ts"
Cohesion: 0.24
Nodes (8): checkWin(), glory(), longestPathLength(), updateAwards(), placePeddler(), hfScore(), HexId, VertexId

### Community 12 - "client/package.json"
Cohesion: 0.11
Nodes (22): dependencies, react@^18.3.1, react-dom@^18.3.1, @runeshore/shared@*, devDependencies, @types/react@^18.3.0, @types/react-dom@^18.3.0, vite@^5.4.0 (+14 more)

### Community 13 - "geometry.ts"
Cohesion: 0.08
Nodes (50): ALL_EDGES, COAST_EDGES, commonNeighbors(), cornerVertex(), DIRS, hexNeighbor(), hexPixel(), isPathEdge() (+42 more)

### Community 14 - "HF State & Tests"
Cohesion: 0.12
Nodes (19): @types/node, @types/ws, ws, dependencies, @runeshore/shared@*, ws@^8.18.0, devDependencies, @types/node@^22.0.0 (+11 more)

### Community 15 - "DI Data Model"
Cohesion: 0.15
Nodes (17): Runeshore Drowned Isles Plan, Boat (ship), Deep hex (sea), DIState (state.di expansion slice), Drowned Isles DLC (Seafarers-style expansion), engine/mist.ts (liftMist), First Landfall scenario, Glimmer field (gold) (+9 more)

### Community 16 - "Server Package Deps"
Cohesion: 0.14
Nodes (16): devDependencies, concurrently@^9.0.0, tsx@^4.19.0, typescript@^5.6.0, vitest@^2.1.0, name, private, scripts (+8 more)

### Community 17 - "apply.ts"
Cohesion: 0.27
Nodes (11): ANYONE, Handler, HANDLERS, cancelTrade(), confirmTrade(), have(), nonzero(), offerTrade() (+3 more)

### Community 18 - "hf-arcana-crown.test.ts"
Cohesion: 0.28
Nodes (5): NONE, other(), terrainHex(), withPath(), zero

### Community 19 - "Root Package & Tooling"
Cohesion: 0.22
Nodes (10): arcState(), hfState(), err(), fleetAt(), ok(), act(), err(), ok() (+2 more)

### Community 21 - "GameState"
Cohesion: 0.28
Nodes (7): DEFAULT_SETTINGS, GameState, game(), glimmered(), hexOf(), raided(), PLAYERS

### Community 22 - "Arcana Guild/Lore Tests"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, module, moduleResolution, noEmit, noUncheckedIndexedAccess, skipLibCheck, strict (+2 more)

### Community 25 - "Sentinel Tests"
Cohesion: 0.22
Nodes (8): services, buildCommand, healthCheckPath, name, plan, runtime, startCommand, type

### Community 26 - "Fleet & Commodity Panels"
Cohesion: 0.39
Nodes (8): act(), chain(), err(), give(), me(), ok(), other(), setup()

### Community 27 - "Shared Package Config"
Cohesion: 0.25
Nodes (7): main, name, private, scripts, test, type, version

### Community 28 - "HF Dice Tests"
Cohesion: 0.46
Nodes (7): act(), cur(), hand(), rig(), roll(), target(), total()

### Community 29 - "Client TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, extends, include, ../tsconfig.base.json

### Community 30 - "Hollow Fleet Demo GIF"
Cohesion: 0.33
Nodes (6): Copy Invite Link Button, Hollow Fleet Siege (demo subject), Hollow Fleet Siege Demo GIF, Waiting For Host To Begin Status, Lobby Player List (Mira host, Tolan, JayJay), Room Lobby Screen (Room MRHGTF)

### Community 31 - "Server TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../tsconfig.base.json

### Community 33 - "Shared TS Config"
Cohesion: 0.50
Nodes (3): extends, include, ../tsconfig.base.json

## Knowledge Gaps
- **37 isolated node(s):** `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json`, `Longest route (paths + boats)`, `Deep hex (sea)` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 205 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Piece Art` to `Board Geometry & HF Plan`, `Board Generation`, `legal.ts`, `constants.ts`, `hf-arcana-guild.test.ts`, `awards.ts`, `geometry.ts`, `Server Package Deps`, `hf-arcana-crown.test.ts`, `Root Package & Tooling`, `GameState`, `Fleet & Commodity Panels`, `HF Dice Tests`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Board Geometry & HF Plan` be split into smaller, more focused modules?**
  _Cohesion score 0.08491228070175438 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Node Builtins & Constants` to `HF Plan & Server Room`, `client/package.json`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Node Builtins & Constants` be split into smaller, more focused modules?**
  _Cohesion score 0.055728625822083766 - nodes in this community are weakly interconnected._
- **Why does `Action` connect `Node Builtins & Constants` to `Board Geometry & HF Plan`, `Board Generation`, `legal.ts`, `Piece Art`, `apply.ts`, `Root Package & Tooling`, `GameState`, `Fleet & Commodity Panels`, `HF Dice Tests`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `Board Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.05262027491408935 - nodes in this community are weakly interconnected._