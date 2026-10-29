# Graph Report - Runeshore  (2026-10-28)

## Corpus Check
- 164 files · ~104,610 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 1117 nodes · 3209 edges · 48 communities (42 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf1495ca`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apply.ts
- Game.tsx
- createGame
- constants.ts
- hf-sentinels.test.ts
- geometry.ts
- Game.tsx
- applyAction
- edgeVertices
- helpers.ts
- client/package.json
- vitest
- vitest
- legal.ts
- Server Package Deps
- Brag Plan: Runeshore — Siege of the Hollow Fleet
- edgeVertices
- shared/src/index.ts
- edgeVertices
- legal.ts
- landfall.ts
- brag-output-2026-10-28-152613/composition/gen.cjs
- PlayerView
- useGame.ts
- Hollow Fleet Demo GIF
- Product
- turn.ts
- Shared TS Config
- createGame
- Task 7: Building and trading
- constants.ts
- Improve.tsx
- brag-output/composition/hyperframes.json
- scripts
- scripts
- sound.ts
- HyperFrames Composition Project
- HyperFrames Composition Project
- composition-brief.md
- 2026-10-28T23-05-33Z__src.md
- apply.ts
- geometry.ts
- hf-arcana-crown.test.ts
- turn.ts
- react
- create.ts

## God Nodes (most connected - your core abstractions)
1. `applyAction()` - 55 edges
2. `GameState` - 51 edges
3. `edgeVertices()` - 44 edges
4. `PlayerId` - 42 edges
5. `vitest` - 41 edges
6. `Action` - 41 edges
7. `legalActions()` - 39 edges
8. `Room` - 37 edges
9. `vertexEdges()` - 37 edges
10. `player()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `[x] Phase 1: Scenario data and geometry` --references--> `Scenario`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/board/scenarios/landfall.ts
- `Rules (confirmed by the user 2026-10-25)` --references--> `dealMist()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/engine/mist.ts
- `Global constraints` --references--> `liftMist()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/engine/mist.ts
- `[x] Phase 1: Scenario data and geometry` --references--> `randInt()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/rng.ts
- `[x] Phase 1: Scenario data and geometry` --references--> `shuffle()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-runeshore-volcano.md → shared/src/rng.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared rules engine build tasks** — docs_superpowers_plans_2026_10_21_runeshore_base_game_task5_setup_production, docs_superpowers_plans_2026_10_21_runeshore_base_game_task6_shade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task7_build_trade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task8_omens, docs_superpowers_plans_2026_10_21_runeshore_base_game_task9_awards [EXTRACTED 1.00]
- **Drowned Isles shipped scenarios** — docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_first_landfall, docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_quartet_reach, docs_superpowers_plans_2026_10_24_runeshore_drowned_isles_veiled_reach [EXTRACTED 1.00]
- **Lobby UI elements** — hollow_fleet_siege_player_list, hollow_fleet_siege_copy_link, hollow_fleet_siege_host_wait [EXTRACTED 1.00]
- **Runeshore plan documents** — docs_superpowers_plans_2026_10_21_runeshore_session_phases_doc, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_doc [INFERRED 0.85]

## Communities (48 total, 6 thin omitted)

### Community 0 - "apply.ts"
Cohesion: 0.06
Nodes (101): Longest route (paths + boats), boardGeometry(), isLandHex(), landHexesAt(), pathEdgeOn(), vertexEdges(), ARCANA_INSTANT, COSTS (+93 more)

### Community 1 - "Game.tsx"
Cohesion: 0.06
Nodes (38): DIST, MIME, startServer(), DATA_DIR, deleteRoom(), loadRooms(), RoomSnapshot, saveRoom() (+30 more)

### Community 2 - "createGame"
Cohesion: 0.21
Nodes (19): dealRandom(), generateBoard(), hot(), PORT_SLOTS, PORT_SLOTS_LARGE, randomizeScenario(), scenarioBoard(), scenarioIsles() (+11 more)

### Community 3 - "constants.ts"
Cohesion: 0.05
Nodes (72): Book, BOOKS, OMEN_ICON, t(), TERMS, Topic, ARCANA, ARCANA_HAND_MAX (+64 more)

### Community 4 - "hf-sentinels.test.ts"
Cohesion: 0.07
Nodes (33): Cinzel and Inter Google Fonts, src/main.tsx module entry (#root), Runeshore base game implementation plan, applyAction deterministic engine dispatcher, PlayerView hidden-info filter, Review focus edge cases, Task 10: legalActions, autoAct, viewFor, fuzz, Task 11: Server rooms, protocol, persistence (+25 more)

### Community 5 - "geometry.ts"
Cohesion: 0.16
Nodes (22): ALL_EDGES, COAST_EDGES, commonNeighbors(), cornerVertex(), DIRS, hexNeighbor(), hexPixel(), LAND_HEXES (+14 more)

### Community 7 - "Game.tsx"
Cohesion: 0.05
Nodes (96): BoatPiece(), BulwarkRim(), Citadel(), HALO, ink, LandfallFlag(), Outpost(), PathLine() (+88 more)

### Community 8 - "applyAction"
Cohesion: 0.07
Nodes (47): nextMove(), applyAction(), currentPlayer(), accepts(), autoAct(), discards(), legalActions(), pendingPlayers() (+39 more)

### Community 9 - "edgeVertices"
Cohesion: 0.16
Nodes (16): ALL_VERTICES, edgeVertices(), isPathEdge(), of(), split(), vertexHexes(), vertexNeighbors(), PIECES (+8 more)

### Community 10 - "helpers.ts"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, VITE_BASE, VITE_WS_URL (+21 more)

### Community 12 - "client/package.json"
Cohesion: 0.10
Nodes (23): Runeshore build phases in 5-hour sessions, Large random map (37-hex), Phase 1: Base game (sessions 1-8), Phase 2: Polish and hosting (session 9), Phase 3: Siege of the Hollow Fleet (sessions 10-16), Phase 4+: remaining expansions, Session 10b: In-game Rulebook, H9-H12: Arcana deck (Lore, Guild, Crown suits) (+15 more)

### Community 13 - "vitest"
Cohesion: 0.11
Nodes (17): vitest, hexVertices(), placePeddler(), game(), glimmered(), hexOf(), raided(), arcState() (+9 more)

### Community 14 - "vitest"
Cohesion: 0.12
Nodes (18): aud, capHtml, caps, COL, corner, DIRS, f1(), gold (+10 more)

### Community 15 - "legal.ts"
Cohesion: 0.10
Nodes (19): Audio direction, Brag Plan: Runeshore — Siege of the Hollow Fleet, Duration: 22s, Format: landscape — 1920x1080, Hook (0–4s), Key moments, Outro / punchline, Scene 1 — Hook — 4.0s (+11 more)

### Community 16 - "Server Package Deps"
Cohesion: 0.10
Nodes (19): Audio direction, Brag Plan: Runeshore — Volcano map, Duration: 21s, Format: landscape — 1920x1080, Hook (0-3.5s), Key moments, Outro / punchline, Scene 1 — Hook — 3.5s (+11 more)

### Community 18 - "Brag Plan: Runeshore — Siege of the Hollow Fleet"
Cohesion: 0.12
Nodes (19): @types/node, @types/ws, ws, dependencies, @runeshore/shared@*, ws@^8.18.0, devDependencies, @types/node@^22.0.0 (+11 more)

### Community 19 - "edgeVertices"
Cohesion: 0.11
Nodes (22): dependencies, react@^18.3.1, react-dom@^18.3.1, @runeshore/shared@*, devDependencies, @types/react@^18.3.0, @types/react-dom@^18.3.0, vite@^5.4.0 (+14 more)

### Community 21 - "shared/src/index.ts"
Cohesion: 0.15
Nodes (17): Runeshore Drowned Isles Plan, Boat (ship), Deep hex (sea), DIState (state.di expansion slice), Drowned Isles DLC (Seafarers-style expansion), engine/mist.ts (liftMist), First Landfall scenario, Glimmer field (gold) (+9 more)

### Community 23 - "edgeVertices"
Cohesion: 0.14
Nodes (16): devDependencies, concurrently@^9.0.0, tsx@^4.19.0, typescript@^5.6.0, vitest@^2.1.0, name, private, scripts (+8 more)

### Community 24 - "legal.ts"
Cohesion: 0.13
Nodes (7): faces, lvl, raiders, rows, shields, shipSvg(), stepsS1

### Community 25 - "landfall.ts"
Cohesion: 0.15
Nodes (19): add(), CENTER, DIRS, ISLES, PORT_KINDS, ringLand(), ringPorts(), turn() (+11 more)

### Community 27 - "brag-output-2026-10-28-152613/composition/gen.cjs"
Cohesion: 0.12
Nodes (19): Assumptions to confirm (small), Layout (copied from the screenshot), Name map (Colonist to Runeshore), [ ] Phase 5: Cities & Knights, [ ] Phase 6: Ship it, Phases, Risks, Rules (confirmed by the user 2026-10-25) (+11 more)

### Community 28 - "PlayerView"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 29 - "useGame.ts"
Cohesion: 0.10
Nodes (29): App(), roomOf(), connect(), Status, wsUrl(), Hero(), Home(), Lobby (+21 more)

### Community 30 - "Hollow Fleet Demo GIF"
Cohesion: 0.12
Nodes (16): Decisions (settled by the owner), Not in phase 7 (P2, later), Out of scope, Phase 1: Safe to play, Phase 2: A clear turn, Phase 3: Trading made clear, Phase 4: Welcome and win, Phase 5: Fantasy look (DONE) (+8 more)

### Community 31 - "Product"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, module, moduleResolution, noEmit, noUncheckedIndexedAccess, skipLibCheck, strict (+2 more)

### Community 32 - "turn.ts"
Cohesion: 0.20
Nodes (9): authoringSkill, media, autoProxy, paths, assets, blocks, components, registry (+1 more)

### Community 33 - "Shared TS Config"
Cohesion: 0.20
Nodes (9): authoringSkill, media, autoProxy, paths, assets, blocks, components, registry (+1 more)

### Community 35 - "createGame"
Cohesion: 0.31
Nodes (7): [x] Phase 1: Scenario data and geometry, VOLCANO, createGame(), di(), CORNER, game(), land()

### Community 36 - "Task 7: Building and trading"
Cohesion: 0.22
Nodes (8): name, private, scripts, check, dev, publish, render, type

### Community 37 - "constants.ts"
Cohesion: 0.22
Nodes (8): name, private, scripts, check, dev, publish, render, type

### Community 40 - "Improve.tsx"
Cohesion: 0.22
Nodes (8): services, buildCommand, healthCheckPath, name, plan, runtime, startCommand, type

### Community 43 - "brag-output/composition/hyperframes.json"
Cohesion: 0.25
Nodes (7): Commands, Documentation, HyperFrames Composition Project, Key Rules, Linting — ALWAYS RUN AFTER CHANGES, Project Structure, Skills — read these first

### Community 44 - "scripts"
Cohesion: 0.25
Nodes (7): Commands, Documentation, HyperFrames Composition Project, Key Rules, Linting — ALWAYS RUN AFTER CHANGES, Project Structure, Skills — read these first

### Community 45 - "scripts"
Cohesion: 0.25
Nodes (7): Commands, Documentation, HyperFrames Composition Project, Key Rules, Linting — ALWAYS RUN AFTER CHANGES, Project Structure, Skills — read these first

### Community 46 - "sound.ts"
Cohesion: 0.25
Nodes (7): Commands, Documentation, HyperFrames Composition Project, Key Rules, Linting — ALWAYS RUN AFTER CHANGES, Project Structure, Skills — read these first

### Community 47 - "HyperFrames Composition Project"
Cohesion: 0.25
Nodes (7): main, name, private, scripts, test, type, version

### Community 48 - "HyperFrames Composition Project"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, extends, include, ../tsconfig.base.json

### Community 51 - "composition-brief.md"
Cohesion: 0.33
Nodes (6): Copy Invite Link Button, Hollow Fleet Siege (demo subject), Hollow Fleet Siege Demo GIF, Waiting For Host To Begin Status, Lobby Player List (Mira host, Tolan, JayJay), Room Lobby Screen (Room MRHGTF)

### Community 52 - "2026-10-28T23-05-33Z__src.md"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../tsconfig.base.json

### Community 53 - "apply.ts"
Cohesion: 0.50
Nodes (3): extends, include, ../tsconfig.base.json

### Community 59 - "create.ts"
Cohesion: 0.13
Nodes (23): Global constraints, [x] Phase 2: Fog and setup, Scenario, SCENARIOS, QUARTET, CORNERS, Hx, ISLES (+15 more)

## Knowledge Gaps
- **37 isolated node(s):** `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json`, `Longest route (paths + boats)`, `Large random map (37-hex)` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 379 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `apply.ts`, `Game.tsx`, `createGame`, `constants.ts`, `createGame`, `geometry.ts`, `brag-output-2026-10-28-152613/composition/gen.cjs`, `edgeVertices`, `applyAction`, `edgeVertices`, `create.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apply.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05797680927628948 - nodes in this community are weakly interconnected._
- **Why does `Action` connect `Game.tsx` to `apply.ts`, `Game.tsx`, `constants.ts`, `applyAction`, `edgeVertices`, `vitest`, `brag-output-2026-10-28-152613/composition/gen.cjs`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Game.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05513612445664608 - nodes in this community are weakly interconnected._
- **Why does `ws` connect `Brag Plan: Runeshore — Siege of the Hollow Fleet` to `Game.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0515406162464986 - nodes in this community are weakly interconnected._