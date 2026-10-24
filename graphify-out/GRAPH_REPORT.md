# Graph Report - Runeshore  (2026-10-23)

## Corpus Check
- 54 files · ~48,069 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 798 nodes · 2191 edges · 38 communities (29 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 88 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Board Generation
- Server and Rooms
- Board Art Rendering
- Design Docs and Plans
- Pages Deploy Workflow
- Client App and Socket
- Community 7
- Server Package Config
- Root Package Config
- Base TS Config
- Shared Package
- Client TS Config
- Server TS Config
- Shared TS Config
- Building and Trading Task
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 34
- Community 35
- Community 36
- Community 37

## God Nodes (most connected - your core abstractions)
1. `applyAction()` - 47 edges
2. `GameState` - 41 edges
3. `Room` - 33 edges
4. `Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan` - 33 edges
5. `vitest` - 31 edges
6. `player()` - 31 edges
7. `PlayerId` - 30 edges
8. `Action` - 28 edges
9. `legalActions()` - 26 edges
10. `edgeVertices()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Task H3: Renown accounting (Session 11)` --references--> `updateAwards()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/engine/awards.ts
- `Task H16: Client UI (Session 16)` --references--> `legalActions()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/engine/legal.ts
- `Task H8: Peddler (Session 13, or move to Session 14 if it runs over)` --references--> `tradeRatio()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/engine/trade.ts
- `Task H5: Bulwarks (Session 12)` --references--> `startSeven()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/engine/turn.ts
- `Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan` --references--> `updateAwards()`  [INFERRED]
  docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md → shared/src/engine/awards.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared rules engine build tasks** — docs_superpowers_plans_2026_10_21_runeshore_base_game_task5_setup_production, docs_superpowers_plans_2026_10_21_runeshore_base_game_task6_shade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task7_build_trade, docs_superpowers_plans_2026_10_21_runeshore_base_game_task8_omens, docs_superpowers_plans_2026_10_21_runeshore_base_game_task9_awards [EXTRACTED 1.00]
- **Arcana deck: three suit tasks** — docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h10, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h11, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h12, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h9 [EXTRACTED 1.00]
- **Hollow Fleet core engine tasks** — docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h1, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h2, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h3 [EXTRACTED 1.00]
- **Hollow Fleet server, UI, and deploy tasks** — docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h15, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h16, docs_superpowers_plans_2026_10_23_runeshore_hollow_fleet_h17 [EXTRACTED 1.00]

## Communities (38 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (65): Task H13: Legal actions, autopilot, views (Session 15), vitest, nextMove(), emptyCounts(), FLEET_TRACK, PIECES, applyAction(), currentPlayer() (+57 more)

### Community 1 - "Board Generation"
Cohesion: 0.05
Nodes (68): Task H1: Flag, state, creation (Session 11), EDGES, generateBoard(), hot(), ids, PORT_SLOTS, ALL_EDGES, ALL_VERTICES (+60 more)

### Community 2 - "Server and Rooms"
Cohesion: 0.05
Nodes (50): Citadel(), ink, Outpost(), PathLine(), Port(), ResIcon(), RESOURCE_GLYPH, S (+42 more)

### Community 3 - "Board Art Rendering"
Cohesion: 0.06
Nodes (22): ws, DIST, MIME, startServer(), DATA_DIR, deleteRoom(), loadRooms(), RoomSnapshot (+14 more)

### Community 4 - "Design Docs and Plans"
Cohesion: 0.13
Nodes (44): COSTS, ANYONE, Handler, HANDLERS, buildCitadel(), buildOutpost(), buildPath(), canPay() (+36 more)

### Community 5 - "Pages Deploy Workflow"
Cohesion: 0.06
Nodes (39): dependencies, react@^18.3.1, react-dom@^18.3.1, @runeshore/shared@*, devDependencies, @types/react@^18.3.0, @types/react-dom@^18.3.0, vite@^5.4.0 (+31 more)

### Community 6 - "Client App and Socket"
Cohesion: 0.07
Nodes (33): Cinzel and Inter Google Fonts, src/main.tsx module entry (#root), Runeshore base game implementation plan, applyAction deterministic engine dispatcher, PlayerView hidden-info filter, Review focus edge cases, Task 10: legalActions, autoAct, viewFor, fuzz, Task 11: Server rooms, protocol, persistence (+25 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (29): concurrency, cancel-in-progress, group, environment, runs-on, steps, VITE_BASE, VITE_WS_URL (+21 more)

### Community 8 - "Server Package Config"
Cohesion: 0.10
Nodes (23): ARCANA, ARCANA_PER_TRACK, ArcanaDef, BANK_EACH, BULWARKS_MAX, COMMODITIES, COMMODITY_OF, cost() (+15 more)

### Community 9 - "Root Package Config"
Cohesion: 0.15
Nodes (19): ARCANA_HAND_MAX, isCommodity(), SENTINELS_PER_RANK, addSentinel(), arcanaGive(), arcanaPickSentinel(), desert(), free() (+11 more)

### Community 10 - "Base TS Config"
Cohesion: 0.18
Nodes (16): ARCANA_BY_KEY, ARCANA_INSTANT, drawArcana(), Play, playArcana(), PLAYS, POLITICS, SCIENCE (+8 more)

### Community 11 - "Shared Package"
Cohesion: 0.11
Nodes (19): File structure (new and changed), Global Constraints, Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan, State shape (decided here so every task agrees), Task H10: Lore-suit cards (Session 14), Task H11: Guild-suit cards (Session 14), Task H14: Fuzz with the expansion on (Session 15), Task H15: Server and lobby (Session 16) (+11 more)

### Community 12 - "Client TS Config"
Cohesion: 0.23
Nodes (17): Task H12: Crown-suit cards (Session 14, may spill into a second session), Task H2: Three dice, commodities, bank trade (Session 11), afterFleet(), FACES, rollHF(), loreBonus(), afterSeven(), cardCount() (+9 more)

### Community 13 - "Server TS Config"
Cohesion: 0.12
Nodes (18): @types/node, @types/ws, dependencies, @runeshore/shared@*, ws@^8.18.0, devDependencies, @types/node@^22.0.0, @types/ws@^8.5.0 (+10 more)

### Community 14 - "Shared TS Config"
Cohesion: 0.13
Nodes (17): Phase 1: Base game (sessions 1-8), Phase 2: Polish and hosting (session 9), Session 1: Scaffold and foundations (Tasks 1-3), Session 2: Board and first turns (Tasks 4-5), Session 3: Core rules (Tasks 6-8), Session 5: Server (Task 11), Session 6: Client lobby and board (Tasks 12-13), Session 7: Game panels (Task 14 steps 1-4) (+9 more)

### Community 15 - "Building and Trading Task"
Cohesion: 0.14
Nodes (16): devDependencies, concurrently@^9.0.0, tsx@^4.19.0, typescript@^5.6.0, vitest@^2.1.0, name, private, scripts (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (14): Runeshore session phases plan, Base-game plan (Tasks 1-15), Phase 4+: remaining expansions (5-6 player, Seafarers/Drowned Isles, Traders & Barbarians, Explorers & Pirates), Session rule: tests pass and committed before stopping, Session 10: Plan the expansion, Spec: runeshore-design.md, Totals table (sessions and hours per phase), Siege of the Hollow Fleet implementation plan (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (11): Session 12: Sentinels and Bulwarks (H4-H5), Session 13: Fleet attacks and improvements (H6-H8), Commodities: Vellum, Silk, Sigil, H2: Three dice, commodities, bank trade, H3: Renown accounting, H4: Sentinels, H5: Bulwarks, H6: Fleet track and attack (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, module, moduleResolution, noEmit, noUncheckedIndexedAccess, skipLibCheck, strict (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): services, buildCommand, healthCheckPath, name, plan, runtime, startCommand, type

### Community 20 - "Community 20"
Cohesion: 0.39
Nodes (8): act(), chain(), err(), give(), me(), ok(), other(), setup()

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (7): main, name, private, scripts, test, type, version

### Community 22 - "Community 22"
Cohesion: 0.54
Nodes (7): advanceFleet(), canDraw(), chooseLoss(), chooseReward(), citadels(), lose(), loseable()

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, extends, include, ../tsconfig.base.json

### Community 24 - "Community 24"
Cohesion: 0.38
Nodes (7): Phase 3: Siege of the Hollow Fleet (sessions 10-16), Session 10b: In-game Rulebook (base game), Session 11: Engine hooks, event die, commodities (H1-H3), Session 16: Expansion UI and playtest (H15-H17), H1: Flag, state, creation, H15: Server and lobby, H16: Client UI

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../tsconfig.base.json

### Community 26 - "Community 26"
Cohesion: 0.70
Nodes (5): Session 14: Arcana deck (H9-H12), H10: Lore-suit cards, H11: Guild-suit cards, H12: Crown-suit cards, H9: Arcana deck and dispatcher

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (4): Session 15: Expansion autopilot, views, fuzz (H13-H14), Session 4: Awards, legal moves, fuzzing (Tasks 9-10), H13: Legal actions, autopilot, views, H14: Fuzz with expansion on

### Community 28 - "Community 28"
Cohesion: 0.50
Nodes (3): extends, include, ../tsconfig.base.json

## Knowledge Gaps
- **34 isolated node(s):** `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json`, `Task 7: Building and trading`, `src/main.tsx module entry (#root)` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 210 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan` connect `Shared Package` to `Community 0`, `Board Generation`, `Design Docs and Plans`, `Client TS Config`, `Community 16`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan` (e.g. with `checkWin()` and `updateAwards()`) actually correct?**
  _`Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `../tsconfig.base.json`, `../tsconfig.base.json`, `../tsconfig.base.json` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0547022932884494 - nodes in this community are weakly interconnected._
- **Why does `Runeshore session phases plan` connect `Community 16` to `Community 24`, `Shared TS Config`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `Board Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.05088919288645691 - nodes in this community are weakly interconnected._
- **Should `Server and Rooms` be split into smaller, more focused modules?**
  _Cohesion score 0.05350140056022409 - nodes in this community are weakly interconnected._