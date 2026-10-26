# Runeshore: Ember Crown (Volcano map) plan, DRAFT

Status: draft, no code yet. Date: 2026-10-25. Branch: `feat/base-game`.

Source: Colonist.io "Volcano" map card ("Race towards the gold tile! Discover what the Volcano has to offer in the fog tiles!"). It lists Base, Cities & Knights, and both 5-6 modes as supported. The layout below was traced from the user's screenshot.

Working name "Volcano" until the user picks a Runeshore name (ideas: Ember Crown, Cinder Heart).

## Global constraints

- Follow official Catan and Colonist rules; verify before coding (memory: official-rules-dlcs).
- One commit per phase; no push until the whole map is done (memory: push-after-dlc).
- Query graphify before reading source (CLAUDE.md). Ask the user to run `/graphify . --update` after new files.
- Reuse the Drowned Isles machinery (`Scenario`, `fog`, `dealMist`, `liftMist`, `glimmer`). Add as little new engine code as possible.

## Name map (Colonist to Runeshore)

| Colonist | Runeshore terrain |
|---|---|
| brick | `clay` |
| sheep | `fleece` |
| wood | `timber` |
| wheat | `harvest` |
| ore | `starmetal` |
| desert | `ashen` |
| gold | `glimmer` |
| fog | `mist` |

## Layout (copied from the screenshot)

7 rows, pointy-top, rows 0/2/4/6 offset half a hex from rows 1/3/5. 71 land hexes, surrounded by sea. Legend: `x` corner resource, `D` desert, `O` ore, `F` fog, `G` gold.

```
row 0 (10):   x x D O F F O D x x
row 1 (11):  x x D F O F O F D x x
row 2 (10):   x D F F O O F F D x
row 3 (9):     D O O O G O O O D
row 4 (10):   x D F F O O F F D x
row 5 (11):  x x D F O F O F D x x
row 6 (10):   x x D O F F O D x x
```

Counts: 20 corner, 14 desert, 18 ore, 18 fog, 1 gold = 71. The map is vertically and horizontally mirrored, so four corner clusters of 5 hexes each (3 + 2 rows tall at the edge). The whole middle row is ore with gold in the centre. Fog sits between the ores.

Gold sits dead centre: row 3, middle hex. Axial conversion: `r = row - 3`, `q` from column with the odd-row half-step. Hex ids follow the existing `S<letter>` scheme.

## Rules (confirmed by the user 2026-10-25)

1. Corner hexes: only brick, sheep, wood or wheat. Resource per hex random. Number token per hex random.
2. Desert hexes: only desert. No number tokens.
3. Ore hexes: only ore. Number token per hex random.
4. Gold hex: only gold. Token only 6 or 8. No gold bonus; it is an ordinary Glimmer field (pick any resource).
5. Fog hexes hide random resources, dealt like Veiled Reach (`dealMist`). Numbers random per hex.
6. Fog is reachable on foot (no Boats): a path beside an intersection touching fog lifts it.
7. Win target is chosen in the lobby (existing `target` setting).
8. Setup: players may start in any of the 4 corner clusters (free choice, one cluster each at 4 players).
9. Ports: two per corner, 8 in total, on the coast of each corner cluster.
10. Robber starts on a random desert hex.
11. 2-4 players only for now. No 5-6 version.

## Assumptions to confirm (small)

- Fog pool: only the five resources (clay, fleece, timber, harvest, starmetal). No gold, no desert, no sea under fog.
- "Random numbers per hex": each hex draws from 2, 3, 4, 5, 6, 8, 9, 10, 11, 12 independently (no fixed counts). 6/8 may sit side by side unless the user wants the official no-adjacent rule (`redAdjacent` flag exists).
- Port kinds: per corner one 3:1 (`any`) and one 2:1 of a random resource.
- Cities & Knights (Hollow Fleet) works on this map at 2-4 players.

## Phases

### [x] Phase 0: Verify rules (done 2026-10-25, user answered)

Rules above are confirmed or defaulted by the user. Confirm the small assumptions in passing during Phase 1.

### [x] Phase 1: Scenario data and geometry

New `shared/src/board/scenarios/volcano.ts` with a `Scenario`: radius to cover 11-wide rows, `land` list from the layout, fog hexes as `mist`, ports, `raiderStart`. Extend `Scenario` with optional random pools (resource set per region, token rule per region) because current scenarios hardcode terrain and token. Add a `randomizeVolcano` step (or a `random` field read by `createGame`) that deals corners, ore tokens and gold token from a seeded rng (`shuffle`, `randInt` already exist). Register in `SCENARIOS`. Done when: unit tests check counts (20/14/18/18/1), corner terrains only the four resources, desert tokenless, gold 6 or 8, ore tokens legal, seeds reproducible.

### [x] Phase 2: Fog and setup

Wire `dealMist` to the 18 fog hexes with the five-resource pool. Check `solid()` and `vertexSolid`: fog ring touches ore, so paths and outposts next to fog land normally; no Boats needed. Setup restricts starts to the four corner clusters (use `home` flags or a new `startZone`; `anywhere` must not allow ore or desert starts). Done when: tests for lift on a path, reveal payout (resource, Glimmer pick, token), start-zone restriction, and no invalid hex ids.

### [ ] Phase 3: Lobby target and gold

Lobby picks the win target (existing setting). Gold is a plain Glimmer field, no bonus. Done when: tests confirm the lobby target applies and gold pays a pick.

### [ ] Phase 4: Client board and art

Render the rectangular board in `client/src/board/Board.tsx` (scenario radius, hex positions). Terrain art for ore, desert, fog hexes exists; check gold and fog look. Lobby: add the map to `Settings['scenario']` select (2-4 players, not `big`). Rulebook entry in `client/src/rules/Book.tsx`. Done when: browser playtest at `:3001` shows the right shapes, tokens, ports and a fog lift.

### [ ] Phase 5: Cities & Knights

Make the map work with Hollow Fleet (commodities, raiders) at 2-4 players. Done when: a full C&K game with bots plays to the end on this map.

### [ ] Phase 6: Ship it

Fuzz test (full fuzz ~45 min, run in background), rulebook audit against the confirmed rules, update the memory plan-docs note, then push.

## Risks

- Fog pool is an assumption (five resources only); a wrong guess changes balance.
- Random corners can produce a lopsided start (all wood, a 6/8 stack). May need a balance check or reroll rule; `redAdjacent` and `calmWoods` flags already exist.
- Rectangular 11-wide board may exceed the current `radius` disc (Veiled uses 5); check rendering cost and `Board` viewbox.
- Scenario type is a fixed table today; random pools are the main new engine feature.
