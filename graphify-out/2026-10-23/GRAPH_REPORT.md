# Graph Report - Runeshore  (2026-10-23)

## Corpus Check
- 81 files · ~32,912 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 560 nodes · 1505 edges · 19 communities (17 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5c44d273`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Hex Geometry
- Board Generation
- Server and Rooms
- Board Art Rendering
- Design Docs and Plans
- Pages Deploy Workflow
- Client App and Socket
- Client Package Config
- Server Package Config
- Root Package Config
- Base TS Config
- Shared Package
- Client TS Config
- Server TS Config
- Shared TS Config
- Building and Trading Task
- Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan
- services
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `Room` - 35 edges
2. `Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan` - 35 edges
3. `applyAction()` - 31 edges
4. `player()` - 26 edges
5. `GameState` - 25 edges
6. `edgeVertices()` - 24 edges
7. `Action` - 23 edges
8. `legalActions()` - 22 edges
9. `vitest` - 19 edges
10. `emptyCounts()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Task H3: Renown accounting (Session 11)` --references--> `updateAwards()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/engine/awards.ts
- `Task H16: Client UI (Session 16)` --references--> `legalActions()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/engine/legal.ts
- `Task H8: Peddler (Session 13, or move to Session 14 if it runs over)` --references--> `tradeRatio()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/engine/trade.ts
- `Task H4: Sentinels (Session 12)` --references--> `vertexNeighbors()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/board/geometry.ts
- `Task H4: Sentinels (Session 12)` --references--> `vertexEdges()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/board/geometry.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared rules engine build tasks** — docs_superpowers_plans_2026_10_21_runeshore_base_game_task5_setup_production, docs_superpowers_plans_2026_10_21_runeshore_base_game_task6_shade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task7_build_trade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task8_omens, docs_superpowers_plans_2026_10_21_runeshore_base_game_task9_awards [EXTRACTED 1.00]
- **Ways to play Runeshore with friends** — readme_local_play, readme_lan_play, readme_cloudflared_tunnel [EXTRACTED 1.00]

## Communities (19 total, 2 thin omitted)

### Community 0 - "Hex Geometry"
Cohesion: 0.08
Nodes (63): Task H1: Flag, state, creation (Session 11), ids, ALL_EDGES, ALL_VERTICES, COAST_EDGES, commonNeighbors(), cornerVertex(), DIRS (+55 more)

### Community 1 - "Board Generation"
Cohesion: 0.06
Nodes (74): Review Focus, Task H13: Legal actions, autopilot, views (Session 15), vitest, COLORS, RoomOpts, Seat, nextMove(), EDGES (+66 more)

### Community 2 - "Server and Rooms"
Cohesion: 0.08
Nodes (17): DIST, MIME, startServer(), DATA_DIR, deleteRoom(), loadRooms(), RoomSnapshot, saveRoom() (+9 more)

### Community 3 - "Board Art Rendering"
Cohesion: 0.08
Nodes (52): Citadel(), ink, Outpost(), PathLine(), Port(), ResIcon(), RESOURCE_GLYPH, S (+44 more)

### Community 4 - "Design Docs and Plans"
Cohesion: 0.06
Nodes (43): Cinzel and Inter Google Fonts, src/main.tsx module entry (#root), Runeshore base game implementation plan, applyAction deterministic engine dispatcher, PlayerView hidden-info filter, Review focus edge cases, Task 10: legalActions, autoAct, viewFor, fuzz, Task 11: Server rooms, protocol, persistence (+35 more)

### Community 5 - "Pages Deploy Workflow"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, VITE_BASE, VITE_WS_URL (+21 more)

### Community 6 - "Client App and Socket"
Cohesion: 0.15
Nodes (19): App(), roomOf(), connect(), Status, wsUrl(), Home(), Lobby, ERRORS (+11 more)

### Community 7 - "Client Package Config"
Cohesion: 0.11
Nodes (22): dependencies, react@^18.3.1, react-dom@^18.3.1, @runeshore/shared@*, devDependencies, @types/react@^18.3.0, @types/react-dom@^18.3.0, vite@^5.4.0 (+14 more)

### Community 8 - "Server Package Config"
Cohesion: 0.12
Nodes (19): @types/node, @types/ws, ws, dependencies, @runeshore/shared@*, ws@^8.18.0, devDependencies, @types/node@^22.0.0 (+11 more)

### Community 9 - "Root Package Config"
Cohesion: 0.14
Nodes (16): devDependencies, concurrently@^9.0.0, tsx@^4.19.0, typescript@^5.6.0, vitest@^2.1.0, name, private, scripts (+8 more)

### Community 10 - "Base TS Config"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, module, moduleResolution, noEmit, noUncheckedIndexedAccess, skipLibCheck, strict (+2 more)

### Community 11 - "Shared Package"
Cohesion: 0.25
Nodes (7): main, name, private, scripts, test, type, version

### Community 12 - "Client TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, extends, include, ../tsconfig.base.json

### Community 13 - "Server TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../tsconfig.base.json

### Community 14 - "Shared TS Config"
Cohesion: 0.50
Nodes (3): extends, include, ../tsconfig.base.json

### Community 16 - "Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan"
Cohesion: 0.10
Nodes (31): File structure (new and changed), Global Constraints, Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan, Session map, State shape (decided here so every task agrees), Task H10: Lore-suit cards (Session 14), Task H11: Guild-suit cards (Session 14), Task H12: Crown-suit cards (Session 14, may spill into a second session) (+23 more)

### Community 17 - "services"
Cohesion: 0.22
Nodes (8): services, buildCommand, healthCheckPath, name, plan, runtime, startCommand, type

## Ambiguous Edges - Review These
- `Task 10: legalActions, autoAct, viewFor, fuzz` → `Phase 3: Siege of the Hollow Fleet (sessions 10-16)`  [AMBIGUOUS]
  docs/superpowers/plans/2026-10-21-runeshore-session-phases.md · relation: semantically_similar_to

## Knowledge Gaps
- **12 isolated node(s):** `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json`, `Task 7: Building and trading`, `src/main.tsx module entry (#root)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 155 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Board Art Rendering` to `Client App and Socket`, `Client Package Config`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan` (e.g. with `checkWin()` and `updateAwards()`) actually correct?**
  _`Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Hex Geometry` be split into smaller, more focused modules?**
  _Cohesion score 0.07922991484635321 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Board Generation` to `Hex Geometry`, `Root Package Config`, `Server and Rooms`, `Board Art Rendering`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `Board Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.056158385684370836 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Task 10: legalActions, autoAct, viewFor, fuzz` and `Phase 3: Siege of the Hollow Fleet (sessions 10-16)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._