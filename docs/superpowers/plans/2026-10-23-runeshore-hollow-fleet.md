# Runeshore: Siege of the Hollow Fleet (Cities & Knights) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A room can turn on "Siege of the Hollow Fleet". The server then enforces the full Cities & Knights rule set on top of the base game, and the client plays it. 3–4 players, win at 13 Renown.

**Architecture:** One opt-in flag, one optional state branch. `Settings.hollowFleet` (default `false`) turns the mode on. `GameState.hf?: HFState` holds every expansion field, so base-game states, tests and snapshots are untouched when it is off. New rules live in `shared/src/engine/hf/`. The base engine gets only small hook calls (`if (s.hf) …`) at: `createGame`, setup's second outpost, `roll`, `startSeven`/`moveShade`, `produce`, `endTurn`, `buyOmen`/`playOmen`, `updateAwards`/`checkWin`, `legalActions`/`autoAct`, `viewFor`.

**Tech Stack:** unchanged (TypeScript, Vitest, `ws`, React + Vite).

**Spec:** `docs/superpowers/specs/2026-10-21-runeshore-design.md` ("Siege of the Hollow Fleet scope")
**Base plan:** `docs/superpowers/plans/2026-10-21-runeshore-base-game.md`
**Sessions:** `docs/superpowers/plans/2026-10-21-runeshore-session-phases.md` (sessions 11–16 map to tasks below)

## Global Constraints

- All base-game constraints still apply: Runeshore terms only, no Catan/colonist names, art or card text; all legality in `shared/`; every decision point has an automatic default.
- Mode off means zero behavior change. The existing suite (including the fuzz test) must stay green after every task with `hollowFleet: false`.
- No Omen deck, no Wardens, no Grand host in this mode (Sentinels replace Wardens).
- Win at `settings.renownTarget`; the lobby sets it to 13 when the mode is switched on (host can still change it).
- Rules authority: current official C&K rulebook. Several numbers below come from memory; each is marked **[verify]** and must be checked against the rulebook at the start of the task that uses it. Do not code a **[verify]** number unchecked.
- Names come from the spec table: Vellum / Silk / Sigil, Lore / Guild / Crown, Arcana, Spire, Bulwark, Sentinel, Shield of the shore, Peddler, The Hollow Fleet. Arcana card names are renamed in Task H9 (one table, agreed before coding).

## Review Focus

1. Mode off: `createGame` output, `viewFor` output and snapshots are byte-identical to before (no `hf` key). Test in H1.
2. Resource conservation: bank + all hands, per resource (19 each) and per commodity (12 each **[verify]**), is constant through every action. The fuzz test asserts it every step. Test in H15.
3. Fleet attack with ties, with a player who has no citadels, with a player whose only citadels are under Spires, with no active Sentinels at all. Test in H6.
4. Two players owe a choice at once (two citadel losses, two Arcana picks): the phase holds a pending list like `discard` does; second action after resolution gets a clean error. Test in H6.
5. Arcana effects that act on other players (Spy, Deserter, Saboteur, Wedding, Master Merchant, Resource/Trade Monopoly) when the target has nothing to give: legal, does nothing, never crashes or goes negative. Test in H10–H11.
6. Hidden info: Arcana hands and deck order never reach another client; only counts. Test in H15.
7. Sentinel on a vertex that loses its Path link (Diplomat, or a broken road): it stays but cannot move until reconnected. Test in H4.

## File structure (new and changed)

```
shared/src/
  types.ts            + Settings.hollowFleet, GameState.hf?, HFState, new Actions/Phases/Events
  constants.ts        + commodity list, Sentinel/Bulwark costs, fleet track length, ARCANA_DECK
  engine/hf/
    state.ts          initHF, helper getters (hfPlayer, sentinelAt, citadels)
    dice.ts           three-dice roll, event die, gate draws, commodity production
    sentinels.ts      build, activate, promote, move, displace, chase
    bulwarks.ts       build bulwark, discard limit
    fleet.ts          advance, attack, loss + reward phases
    improve.ts        Lore/Guild/Crown levels, Spires, abilities
    arcana.ts         deck, hand limit, dispatcher for play
    arcana-science.ts, arcana-trade.ts, arcana-politics.ts
    peddler.ts
    score.ts          HF Renown contributions
  view.ts             hide Arcana hands and deck
shared/test/hf-*.test.ts
server/src/room.ts    settings toggle, renown default
client/src/…          panels listed in H13
```

## State shape (decided here so every task agrees)

```ts
type Commodity = 'vellum' | 'silk' | 'sigil';
type Track = 'lore' | 'guild' | 'crown';            // lore↔vellum, guild↔silk, crown↔sigil
interface HFState {
  fleetPos: number;                                  // 0..FLEET_TRACK (7 **[verify]**)
  shadeActive: boolean;                              // false until the first attack
  eventDie: 'ship' | Track | null;                   // last roll
  bank: Record<Commodity, number>;
  players: Record<PlayerId, {
    commodities: Record<Commodity, number>;
    level: Record<Track, number>;                    // 0..5
    arcana: ArcanaCard[];                            // hidden; max 4 **[verify]**
    shields: number;                                 // Shield of the shore points
    extraRenown: number;                             // Printer / Constitution
  }>;
  sentinels: Record<VertexId, { owner: PlayerId; rank: 1 | 2 | 3; active: boolean; actedTurn: number }>;
  bulwarks: VertexId[];                              // vertices of citadels with a Bulwark
  spires: Record<Track, { vertex: VertexId; owner: PlayerId } | null>;
  peddler: { hex: HexId; owner: PlayerId } | null;
  arcanaDecks: Record<Track, ArcanaCard[]>;          // three stacks, hidden
  turnFlags: { alchemist?: [number, number]; merchantFleet?: Resource | Commodity; /* set by Arcana, cleared in endTurn */ };
}
```

Production dice keep using `GameState.dice`: `dice[0]` = yellow die, `dice[1]` = red die.

---

## Task H1: Flag, state, creation (Session 11)

**Files:**
- Modify: `shared/src/types.ts`, `shared/src/constants.ts`, `shared/src/engine/create.ts`, `shared/src/engine/setup.ts`, `shared/src/engine/omens.ts`, `shared/src/index.ts`
- Create: `shared/src/engine/hf/state.ts`
- Test: `shared/test/hf-create.test.ts`

**Interfaces:**
- Produces: `Settings.hollowFleet: boolean` (default `false` in `DEFAULT_SETTINGS`); `initHF(players, rng) → [HFState, rng]`; `hfPlayer(s, id)`.
- Consumes: `createGame`, `Settings`.

- [ ] **Step 1:** Tests: with `hollowFleet:false`, `createGame` has no `hf` key and equals the pre-change output for a fixed seed (Review Focus 1). With it on: `hf` exists, `omenDeck` is `[]`, commodity bank full, three Arcana stacks of 18 shuffled (stub cards until H9), each player has level 0/0/0 and empty commodities.
- [ ] **Step 2:** Add the flag and `HFState` types. Implement `initHF` and call it from `createGame` only when the flag is on.
- [ ] **Step 3:** Setup: when `hf` is on, the second initial Outpost is a Citadel (still pays one card per adjacent hex, base resources only, never commodities). Test: piece counts and starting hand.
- [ ] **Step 4:** `buyOmen` and `playOmen` return `'no Omens in this mode'` when `hf` is set. `legalActions` never offers them.
- [ ] **Step 5:** Run `npm test` (all green). Commit `feat(hf): flag, state shape, creation`.

---

## Task H2: Three dice, commodities, bank trade (Session 11)

**Files:**
- Modify: `shared/src/engine/turn.ts`, `shared/src/engine/trade.ts`, `shared/src/types.ts` (events)
- Create: `shared/src/engine/hf/dice.ts`
- Test: `shared/test/hf-dice.test.ts`

**Interfaces:**
- Produces: `rollHF(s, id) → Result`; events `eventDie {face}`, extended `produced` gains to include commodities.
- Consumes: `roll` (delegates to `rollHF` when `s.hf`), `produce`.

- [ ] **Step 1:** Rules check **[verify]**: city production by terrain (Timber → Timber + Vellum; Fleece → Fleece + Silk; Starmetal → Starmetal + Sigil; Clay and Harvest → 2 base resources as in the base game).
- [ ] **Step 2:** Tests: three dice drawn from `rngState` in fixed order (yellow, red, event); same state gives same roll. Event die faces: 3 of 6 ship, 1 each Lore/Guild/Crown. Citadel on a Timber hex gives 1 Timber + 1 Vellum; Outposts unchanged. Short commodity bank follows the same rule as base resources (Review Focus 3 of the base plan).
- [ ] **Step 3:** Resolution order **[verify]**: event die first (ship step in H6, gate draw in H7), then production, then a total of 7 starts the seven procedure. Implement the order with empty hooks that H6/H7 fill.
- [ ] **Step 4:** Seven handling in `startSeven`: hand size counts base resources and commodities, not Arcana. Discard becomes `ResourceCounts` plus commodity counts (extend the `discard` action to `{cards, commodities?}`); half rounded down, over `discardLimit + 2 × Bulwarks` (H5 fills the Bulwark part).
- [ ] **Step 5:** Shade: while `!hf.shadeActive`, a 7 makes players discard but then skips `moveShade` and steals nothing. Test.
- [ ] **Step 6:** Bank trade: commodities trade 4:1 for anything; ports do not apply to commodities. Test.
- [ ] **Step 7:** `npm test` green, commit `feat(hf): dice, commodities, shade gate`.

---

## Task H3: Renown accounting (Session 11)

**Files:**
- Modify: `shared/src/engine/awards.ts`
- Create: `shared/src/engine/hf/score.ts`
- Test: `shared/test/hf-score.test.ts`

- [ ] **Step 1:** Rules check **[verify]**: Outpost 1, Citadel 2, Spire +2 (on top of the Citadel), Shield of the shore 1 each, Peddler 1, Printer and Constitution 1 each, Longest path 2. No Grand host.
- [ ] **Step 2:** Tests for each source. Winning check uses `settings.renownTarget` on the owner's own turn, same as base.
- [ ] **Step 3:** In `updateAwards`, skip Grand host when `hf` is set. Hook `hfScore(s, id)` into the Renown sum.
- [ ] **Step 4:** `npm test` green, commit `feat(hf): renown sources`.

---

## Task H4: Sentinels (Session 12)

**Files:**
- Create: `shared/src/engine/hf/sentinels.ts`
- Modify: `shared/src/types.ts` (Actions), `shared/src/engine/apply.ts` (handlers), `shared/src/engine/turn.ts` (`endTurn` resets nothing; `actedTurn` compares to `s.turn`)
- Test: `shared/test/hf-sentinels.test.ts`

**Interfaces:**
- Produces Actions: `buildSentinel {vertex}`, `activateSentinel {vertex}`, `promoteSentinel {vertex}`, `moveSentinel {from, to}`, `chaseShade {vertex}` (then the normal `moveShade` phase with `then:'main'`).
- Consumes: path graph from `board/geometry` (`vertexEdges`, `vertexNeighbors`), `s.paths`, `s.buildings`.

- [ ] **Step 1:** Rules check **[verify]**: costs (build: 1 Fleece + 1 Starmetal; promote: same; activate: 1 Harvest), limits (2 per rank), rank 3 needs Crown level 3, rank names Basic/Strong/Mighty (strength 1/2/3), a Sentinel built or promoted this turn starts inactive and promotion deactivates **[verify]**, whether a just-activated Sentinel may act the same turn **[verify]**, displacement rules (needs strictly higher rank; displaced owner must move it to a free connected vertex or it is removed), chase rules (active, adjacent to Shade hex, becomes inactive).
- [ ] **Step 2:** Tests, one per rule above plus: build only on a vertex linked to your own Paths and empty; can't pass through opponent Sentinels; movement uses only your own connected Paths; one action per Sentinel per turn (`actedTurn`); Review Focus 7.
- [ ] **Step 3:** Implement. Displacement that forces an opponent move: new phase `{k:'displaced', owner, vertex, by}` with the owner choosing a destination (auto default: random legal, else removed). Add to `Phase`.
- [ ] **Step 4:** `chaseShade` is allowed only when `shadeActive`; it sets phase `moveShade` with `then:'main'`, current player moves it and steals as normal.
- [ ] **Step 5:** `npm test` green, commit `feat(hf): sentinels`.

---

## Task H5: Bulwarks (Session 12)

**Files:**
- Create: `shared/src/engine/hf/bulwarks.ts`
- Modify: `shared/src/types.ts`, `shared/src/engine/apply.ts`, `shared/src/engine/turn.ts` (discard limit)
- Test: `shared/test/hf-bulwarks.test.ts`

- [ ] **Step 1:** Rules check **[verify]**: cost (2 Clay), max 3 per player, one per Citadel, only on a Citadel, each raises the discard limit by 2, does not protect from the Fleet.
- [ ] **Step 2:** Tests: legal/illegal builds, limit math in `startSeven`, a Bulwark stays on its vertex when the Citadel is later lost to the Fleet (the Bulwark is removed with it — assert exact behavior **[verify]**).
- [ ] **Step 3:** Action `buildBulwark {vertex}`; wire the discard limit.
- [ ] **Step 4:** `npm test` green, commit `feat(hf): bulwarks`.

---

## Task H6: Fleet track and attack (Session 13)

**Files:**
- Create: `shared/src/engine/hf/fleet.ts`
- Modify: `shared/src/engine/hf/dice.ts` (ship hook), `shared/src/types.ts` (Phases `fleetLoss`, `fleetReward`; events `fleetAdvanced`, `fleetAttack`, `shieldAwarded`, `citadelLost`)
- Test: `shared/test/hf-fleet.test.ts`

**Interfaces:**
- Produces: `advanceFleet(s) → Result`; Actions `chooseLoss {vertex}`, `chooseReward {track}`.

- [x] **Step 1:** Rules check **[verify]**: track length, attack strength = number of Citadels on the board (Spires count), defence = sum of ranks of active Sentinels per player. Fleet loses when defence ≥ strength: top contributor (alone) gets Shield of the shore (1 Renown); tied top contributors each pick one Arcana card from a stack instead; nobody with 0 contribution counts. Fleet wins: the player(s) with the lowest contribution among those who own Citadels lose one Citadel (it becomes an Outpost; Spire Citadels are safe unless a player has only those, in which case none is lost **[verify]**). After any attack: all Sentinels become inactive, track resets to 0, `shadeActive = true`.
- [x] **Step 2:** Tests: win, lose, tie for best, tie for worst, player with no Citadels (Review Focus 3), only-Spire Citadels, no Sentinels anywhere.
- [x] **Step 3:** Implement. Citadel loss with a choice → phase `fleetLoss {pending: PlayerId[]}` (Review Focus 4). Tied reward → `fleetReward {pending}`. When all resolve, resume the roll flow (production, then the 7 procedure).
- [x] **Step 4:** `npm test` green, commit `feat(hf): fleet attack`.

---

## Task H7: Improvements, Spires, gate draws (Session 13)

**Files:**
- Create: `shared/src/engine/hf/improve.ts`
- Modify: `shared/src/engine/hf/dice.ts` (gate hook), `shared/src/engine/trade.ts`
- Test: `shared/test/hf-improve.test.ts`

- [x] **Step 1:** Rules check **[verify]**: level n costs n of that track's commodity; max 5; needs at least one Citadel; reaching 4 first claims a Spire on one of your Citadels (not yet taken), reaching 5 first-past the current holder takes it; abilities at level 3 (Lore: when production gives you nothing, take 1 base resource of your choice; Guild: commodities trade 2:1; Crown: Mighty Sentinels). Gate draw: on a gate face, each player draws an Arcana card from that track's stack if the red die ≤ their level + 1.
- [x] **Step 2:** Tests for each cost, claim and steal of Spires, ability effects, gate draws including the hand limit (draw is skipped at 4 cards) and an empty stack.
- [x] **Step 3:** Action `improve {track}`. Spires use `hf.spires`; Renown comes from H3.
- [x] **Step 4:** `npm test` green, commit `feat(hf): improvements and Spires`.

---

## Task H8: Peddler (Session 13, or move to Session 14 if it runs over)

**Files:**
- Create: `shared/src/engine/hf/peddler.ts`
- Test: `shared/test/hf-peddler.test.ts`

- [x] **Step 1:** Rules check **[verify]**: the Peddler is placed by a Peddler Arcana card, sits on a land hex next to the placer's building, gives 1 Renown and a 2:1 bank trade in that hex's resource, and passes to whoever places it next.
- [x] **Step 2:** Implement `placePeddler`, `tradeRatio` hook, score hook. Tests.
- [x] **Step 3:** `npm test` green, commit `feat(hf): peddler`.

---

## Task H9: Arcana deck and dispatcher (Session 14)

**Files:**
- Create: `shared/src/engine/hf/arcana.ts`
- Modify: `shared/src/constants.ts`, `shared/src/types.ts`
- Test: `shared/test/hf-arcana-core.test.ts`

- [ ] **Step 1:** Name table first. Rename the official 54-card list (three suits of 18) into original Runeshore names and write the one-line effect for each in `constants.ts`. Composition **[verify]**: Lore suit 18, Guild suit 18, Crown suit 18 (see H10–H12 lists). The owner may rename.
- [ ] **Step 2:** `playArcana {card, …args}` dispatcher: own turn only; not while a pending phase is open except where the card says; hand limit 4 **[verify]**; discarded cards return to the bottom of their stack. Cards that give Renown (Printer, Constitution) resolve instantly when drawn **[verify]**.
- [ ] **Step 3:** Tests for the dispatcher, hand limit, and recycling.
- [ ] **Step 4:** Commit `feat(hf): arcana deck`.

---

## Task H10: Lore-suit cards (Session 14)

**Files:** `shared/src/engine/hf/arcana-science.ts`; test `shared/test/hf-arcana-lore.test.ts`

Cards (official names → mechanic) **[verify each]**: Alchemist ×2 (set both production dice before rolling), Crane ×2 (improvement costs 1 less), Engineer ×1 (free Bulwark), Inventor ×2 (swap two number tokens, not 2, 12, 6, 8), Irrigation ×2 (2 Harvest per owned Harvest hex), Medicine ×2 (Citadel for 2 Harvest + 3 Starmetal, i.e. discount **[verify]**), Mining ×2 (2 Starmetal per owned Starmetal hex), Printer ×1 (1 Renown), Road Building ×2 (two free Paths), Smith ×2 (promote two Sentinels free).

- [ ] **Step 1:** One test per card including its edge cases. Build in two commits of about five cards each.
- [ ] **Step 2:** Commit `feat(hf): lore arcana`.

---

## Task H11: Guild-suit cards (Session 14)

**Files:** `shared/src/engine/hf/arcana-trade.ts`; test `shared/test/hf-arcana-guild.test.ts`

Cards **[verify each]**: Commercial Harbor ×2 (offer each opponent a base resource for a commodity), Master Merchant ×2 (take 2 cards from a player with more Renown), Peddler ×6 (see H8), Merchant Fleet ×2 (one resource or commodity trades 2:1 this turn), Resource Monopoly ×4 (name a resource; each opponent gives up to 2), Trade Monopoly ×2 (name a commodity; each opponent gives 1).

- [ ] **Step 1:** One test per card including Review Focus 5 (targets with nothing to give).
- [ ] **Step 2:** Commit `feat(hf): guild arcana`.

---

## Task H12: Crown-suit cards (Session 14, may spill into a second session)

**Files:** `shared/src/engine/hf/arcana-politics.ts`; test `shared/test/hf-arcana-crown.test.ts`

Cards **[verify each]**: Bishop ×2 (move the Shade, steal one card from each adjacent player), Constitution ×1 (1 Renown), Deserter ×2 (an opponent loses a Sentinel of a rank you name; you get a Basic one), Diplomat ×2 (remove an open Path; the owner may rebuild it elsewhere), Intrigue ×2 (displace an opponent Sentinel next to your Path), Saboteur ×2 (players with at least as much Renown as you discard half), Spy ×3 (look at an opponent's Arcana hand, take one), Warlord ×2 (activate all your Sentinels free), Wedding ×2 (each player with more Renown gives you 2 cards).

- [ ] **Step 1:** One test per card, plus Review Focus 5. Cards that need an opponent's choice reuse the pending-list phase pattern from `discard` (Saboteur, Wedding, Deserter's pick, Diplomat's rebuild).
- [ ] **Step 2:** Commit `feat(hf): crown arcana`.

---

## Task H13: Legal actions, autopilot, views (Session 15)

**Files:**
- Modify: `shared/src/engine/legal.ts`, `shared/src/view.ts`, `shared/src/protocol.ts`
- Test: `shared/test/hf-legal.test.ts`, `shared/test/hf-view.test.ts`

- [x] **Step 1:** `legalActions` emits every new action for every new phase. Keep the existing pattern: cheap pre-filter, then confirm with `applyAction` so the two never disagree. Cap enumeration for card arguments (token swaps, trade targets) with a pre-filter, not brute force.
- [x] **Step 2:** `autoAct` default for every new decision: `fleetLoss` random Citadel (non-Spire first), `fleetReward` random track, `displaced` random legal vertex else remove, Arcana argument choices random among legal. Per spec: choose randomly among legal options, then end turn.
- [x] **Step 3:** `viewFor`: replace `hf.players[id].arcana` with a count for others, drop `arcanaDecks` to counts, keep the viewer's own hand (Review Focus 6). Events that reveal a card (Spy) are filtered like `stole`.
- [x] **Step 4:** Tests: for a handful of seeded mid-game states, every `legalActions` entry applies cleanly and `autoAct` ends every phase in finite steps.
- [x] **Step 5:** Commit `feat(hf): legal actions, autopilot, views`.

---

## Task H14: Fuzz with the expansion on (Session 15)

**Files:** Modify `shared/test/fuzz.test.ts`, `shared/test/drive.ts`

- [x] **Step 1:** Run the existing fuzz loop with `hollowFleet:true` over many seeds, 3 and 4 players. Per step assert: no thrown error, conservation of every resource and commodity (Review Focus 2), piece limits (Sentinels 2 per rank, Bulwarks 3, Spires 1 per track), Renown equals the recomputed sum, games end or hit a step cap with no stuck phase.
- [x] **Step 2:** Fix whatever the fuzz finds. This step is open-ended; stop at the first green long run (about 200 seeds).
- [x] **Step 3:** Commit `test(hf): fuzz with expansion`.

---

## Task H15: Server and lobby (Session 16)

**Files:** Modify `server/src/room.ts`, `server/test/*.test.ts`, `client/src/screens/Lobby.tsx`

- [ ] **Step 1:** Room setting `hollowFleet`; switching it on sets `renownTarget` to 13 (and back to 10 off, unless the host changed it). Host-only, lobby-only. Test.
- [ ] **Step 2:** Snapshot save/load round-trips an `hf` game. Test.
- [ ] **Step 3:** Commit `feat(hf): room setting`.

---

## Task H16: Client UI (Session 16)

**Files:** Create under `client/src/panels/`: `Commodities.tsx`, `Improve.tsx`, `Sentinels.tsx` (board mode plus actions), `Fleet.tsx` (track), `Arcana.tsx`; Modify: `Board.tsx`, `art.tsx`, `Game.tsx`, `ComicPanel.tsx`, `Lobby.tsx`

- [ ] **Step 1:** Board: Sentinel pieces (three ranks, active/inactive look), Bulwark rim on Citadels, Spire crest, Peddler token, fleet track strip with ship marker.
- [ ] **Step 2:** Panels: hand with commodities, three-track improve panel with costs, Arcana hand with per-card argument pickers, Sentinel actions via board click modes, pending-choice overlays for `fleetLoss`, `fleetReward`, `displaced` (reuse the style of `Discard.tsx`).
- [ ] **Step 3:** Comic panels: Fleet advances, Fleet attack (win and loss), Shield awarded, Spire claimed, Arcana played.
- [ ] **Step 4:** Greys out buttons using `legalActions` only; no rules in the client.
- [ ] **Step 4b:** Rulebook: add a "Siege of the Hollow Fleet" tab to `client/src/rules/content.ts` with every new term (Vellum, Silk, Sigil, Lore, Guild, Crown, Sentinel ranks, Bulwark, Spire, Shield of the shore, Peddler, The Hollow Fleet), how the fleet track and attack work, and one entry per Arcana card (text from `constants.ts`).
- [ ] **Step 5:** Commit per piece, `feat(hf-ui): …`.

---

## Task H17: Playtest and deploy (Session 16)

- [ ] **Step 1:** Local four-tab playtest to 13 Renown with the mode on. List bugs; fix those that block play, log the rest.
- [ ] **Step 2:** Re-run the base game once with the mode off to confirm no regression.
- [ ] **Step 3:** Update `README.md` (mode, rules differences), push, redeploy per the Render notes. Tick sessions in the phases file.

---

## Session map

| Session | Tasks |
|---|---|
| 11 Engine hooks, event die, commodities | H1, H2, H3 |
| 12 Sentinels and Bulwarks | H4, H5 |
| 13 Fleet attacks and improvements | H6, H7, H8 |
| 14 Arcana deck | H9, H10, H11, H12 (may need a 14b) |
| 15 Autopilot, views, fuzz | H13, H14 |
| 16 UI and playtest | H15, H16, H17 |
