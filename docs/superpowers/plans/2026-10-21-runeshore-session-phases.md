# Runeshore: build phases split into 5-hour sessions

Date: 2026-10-21

This file splits the whole build into sessions of about 5 hours each. Each session
ends on a green test run and a commit, so the next session can start cold.

Sources:
- Spec: `docs/superpowers/specs/2026-10-21-runeshore-design.md`
- Base-game plan (Tasks 1–15): `docs/superpowers/plans/2026-10-21-runeshore-base-game.md`

## How to run each session

1. Open a new Claude Code session in this folder, on the working branch.
2. Paste the session's "Start prompt" line below.
3. At the end, check the "Done when" list. If a session runs over, stop at the last
   finished task, commit, and carry the rest into the next session.
4. Tick the session's box in this file and commit.

Rule for every session: tests pass and work is committed before you stop. Never end a
session with a half-written task uncommitted.

---

## Phase 1: Base game (8 sessions, ~40 hours)

Goal: friends can play a full base game by link. Milestone from the spec: playtest
this with friends before any expansion work starts.

### [x] Session 1: Scaffold and foundations (Tasks 1–3)

- Monorepo, `npm run dev`, Vitest wired up.
- Types, constants, seeded RNG.
- Hex geometry: 54 vertices, 72 edges, 30 coast edges.
- Risk: `npm install` under OneDrive may fail with EPERM/EBUSY. If so, move the project
  out of OneDrive first (e.g. `C:\dev\Runeshore`) before doing anything else.
- Start prompt: "Execute Tasks 1–3 of the base-game plan."
- Done when: `npm test` passes, `npm run dev` serves `/health` and the client page,
  3 commits made.

### [x] Session 2: Board and first turns (Tasks 4–5)

- Random fair board and starter board.
- `createGame`, `applyAction` dispatcher, setup snake order, roll and production,
  bank-shortage rule.
- Start prompt: "Execute Tasks 4–5 of the base-game plan."
- Done when: generate, setup and production tests pass.

### [x] Session 3: Core rules (Tasks 6–8)

- Sevens, discards, the Shade, stealing, end turn.
- Building paths, outposts, citadels. Bank, port and player trades.
- Omens: buy and play all four playable kinds.
- Start prompt: "Execute Tasks 6–8 of the base-game plan."
- Done when: shade, build, trade and omen tests pass.

### [x] Session 4: Awards, legal moves, fuzzing (Tasks 9–10)

- Longest path, Grand host, Renown, win check.
- `legalActions`, `autoAct`, `viewFor`, fuzz test over 50 seeds.
- Expect the fuzz test to find engine bugs. Budget about half the session for fixes.
- Start prompt: "Execute Tasks 9–10 of the base-game plan."
- Done when: fuzz test runs 50 seeds × 3 and 4 players with all invariants holding.
  The rules engine is complete at this point.

### [x] Session 5: Server (Task 11)

- Rooms, seat tokens, protocol, one-action-at-a-time queue, turn timer, disconnect
  handling, host commands, disk snapshots.
- Start prompt: "Execute Task 11 of the base-game plan."
- Done when: room, persist and ws tests pass.

### [x] Session 6: Client lobby and board (Tasks 12–13)

- Theme tokens and fonts, socket with auto-reconnect, Home and Lobby screens.
- SVG board art: six terrains, tokens, ports, pieces, the Shade.
- Start prompt: "Execute Tasks 12–13 of the base-game plan."
- Done when: 3 browser tabs can create, join, start, and click through setup on the
  same board. A reload keeps the seat.

### [x] Session 7: Game panels (Task 14, steps 1–4)

- Players, Log, Hand, Build, Omens, Trade panels.
- Discard, Shade-steal, Bounty, Hoard and Waymaking prompts.
- Comic-panel popups for big moments and the win screen.
- Start prompt: "Execute Task 14 steps 1–4 of the base-game plan."
- Done when: every action in `legal` can be done from the UI.

### [x] Session 8: Full playtest and ship locally (Task 14 step 5, Task 15)

- Play a full 3-player game across 3 tabs. Fix bugs found, with tests for engine bugs.
- Production build, restart-mid-game check, README for running and playing.
- Start prompt: "Execute Task 14 step 5 and Task 15 of the base-game plan."
- Done when: `npm run build && npm start` works, a restarted server resumes the game,
  `npm test` passes, README written.
- After this session: play with real friends over `cloudflared`. Write down bugs and
  rule complaints for Session 9.

## Phase 2: Polish and hosting (1–2 sessions)

### [x] Session 9: Playtest fixes and real hosting

- Fix the friend-playtest bug list first.
- Pick a free host that supports WebSockets, keeps files, and doesn't sleep mid-game.
  Deploy. Snapshot folder must survive restarts.
- Start prompt: "Fix the playtest bugs in <list>, then plan and do hosting per the spec."
- Done when: a public URL hosts a game, and a redeploy keeps a running game.
- If the bug list is long, split this into two sessions: fixes, then hosting.
- Done 2026-10-23: bugs skipped; deploy by owner via Render free blueprint. Redeploys lose running games (accepted).

## Phase 3: Siege of the Hollow Fleet (Cities & Knights) (~7 sessions)

Detailed plan: `docs/superpowers/plans/2026-10-23-runeshore-hollow-fleet.md` (Tasks H1–H17).

### [x] Session 10: Plan the expansion

- Write `docs/superpowers/plans/<date>-runeshore-hollow-fleet.md` from the spec's C&K
  scope, in the same task format as the base-game plan.
- Decide how expansions plug into the engine (settings flag, phase additions, event die).
- Start prompt: "Write the implementation plan for Siege of the Hollow Fleet."
- Done when: plan committed and split into sessions 11–16 below (adjust if needed).
- Done 2026-10-23: plan written; sessions 11–16 keep their shape, task map at the end of the plan.

### [ ] Session 11: Engine hooks, event die, commodities (Tasks H1–H3)

- Expansion flag in settings; 13 Renown default; no Omen deck in this mode.
- Event die and red/yellow dice production; Vellum, Silk, Sigil from citadels.

### [ ] Session 12: Sentinels and Bulwarks (Tasks H4–H5)

- Build, activate, upgrade, move, displace, chase the Shade. Bulwarks raise discard limit.

### [ ] Session 13: Hollow Fleet attacks and improvements (Tasks H6–H8)

- Fleet track, attack resolution, citadel loss, Shield of the shore.
- Lore / Guild / Crown improvement tracks, Spires.

### [ ] Session 14: Arcana deck (Tasks H9–H12)

- All three suits and the full card list. This is the biggest rules chunk; it may run
  into a second session.

### [ ] Session 15: Expansion autopilot, views, fuzz (Tasks H13–H14)

- `legalActions` and `autoAct` for every new decision point. Hidden info for Arcana.
- Extend the fuzz test with the expansion on.

### [ ] Session 16: Expansion UI and playtest (Tasks H15–H17)

- Panels, board pieces and comic panels for the new parts. Full playtest. Deploy.

## Phase 4 and later: remaining expansions (rough sizes)

Each one starts with a design-and-plan session, as the spec requires.

- [ ] 5–6 player extension: ~3 sessions (plan, engine + bigger board + special build
  phase, UI + playtest).
- [ ] Seafarers ("Drowned Isles"): ~6 sessions (plan, sea hexes and Skiffs, Corsair and
  Glimmer fields, scenarios, UI, playtest).
- [ ] Traders & Barbarians: ~5 sessions, depending on which scenarios are picked.
- [ ] Explorers & Pirates: ~6 sessions.

## Totals

| Phase | Sessions | Hours |
|---|---|---|
| 1. Base game | 8 | ~40 |
| 2. Fixes and hosting | 1–2 | ~5–10 |
| 3. Siege of the Hollow Fleet | 7 | ~35 |
| 4+. Later expansions | ~20 | ~100 |
