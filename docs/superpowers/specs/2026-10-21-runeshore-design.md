# Runeshore — design

Date: 2026-10-21
Status: draft, awaiting approval

## Intent

Runeshore is a browser board game the owner plays online with friends. It plays like
Catan as hosted on colonist.io: a hex island, dice-driven resource production, building,
trading, and a thief piece. On top of the base game it supports the major expansions,
starting with Cities & Knights.

The why: the owner wants their own version of that game night, with every expansion
available, without the look of either existing product.

## Goals

- Play a full game online with friends from separate machines, joined by a shared link.
- Faithful rules: the server enforces every rule of the base game and each expansion
  as it ships. A player can't make an illegal move from the browser.
- Original identity. No card art, tile art, icons, layout, colors, card text, or
  terminology copied from Catan or colonist.io. Game mechanics may match; presentation
  must not.
- Dark graphic-novel fantasy look (details below).
- Expansions selectable per room by the host before the game starts.

## Non-goals

- Accounts, login, profiles, friends lists, rankings, or match history.
- A database. Game state lives in server memory while the room exists.
- Public lobby or matchmaking. Rooms are found only by link.
- Native mobile apps. The site should work in a phone browser, but desktop is primary.
- Monetization.

## Anti-goals (failure even if it works)

- Anything that reads as a Catan or colonist.io clone at a glance: their palette, their
  card frames, their hex art, their trademarked names ("Catan", "Settlers", "Cities &
  Knights" etc. never appear in the UI; expansion names are renamed too).
- Rules bugs that let a client cheat or desync players.
- Losing a game because one player's tab refreshed.

## Constraints

- The owner won't edit code. Everything must run with one command and be explained in
  plain steps.
- Windows 11 machine, Node.js v24 installed. Project folder is inside OneDrive; if
  OneDrive sync causes install or file-lock problems, move the project out of OneDrive.
- Free hosting later (e.g. Render). Must work behind a single public URL with
  WebSockets.

## Decided

### Players and rooms

- Host opens the site, clicks create room, picks options, gets a link to share.
- A friend opens the link, types a nickname, takes a seat. No account.
- 3–4 players for base and Cities & Knights; 5–6 players arrives with the 5–6 extension
  phase.
- Refresh or brief disconnect: the player rejoins their seat automatically (seat token
  kept in browser storage). Game waits or keeps the turn timer running per settings.
- Room is deleted some minutes after everyone leaves.

### Expansion order

1. Base game.
2. Cities & Knights (owner's first priority).
3. 5–6 player extension (base and C&K).
4. Seafarers.
5. Traders & Barbarians scenarios/variants.
6. Explorers & Pirates.

First milestone (owner's decision): the base game ships on its own and gets playtested
with friends before Cities & Knights work starts. The engine still leaves room for C&K
turn structure (event die, commodities, extra decision points) so it isn't a rewrite.

Host toggles expansions in the room settings. Combinations without official rules
(e.g. Explorers & Pirates with Cities & Knights) are blocked with a short note in the
settings screen. Official combinations (e.g. Seafarers + Cities & Knights) are allowed
once both are built.

### Look: dark graphic novel

- Deep indigo night background, gold ink linework, runes, inked comic panels.
- Tiles are illustrated in a flat inked style (SVG), not photographic or 3D.
- Big moments (dice roll, thief moved, barbarian attack, win) get a comic-panel popup.
- Original card frames, original iconography, original typography (a display face for
  headings, readable sans for numbers and rules text).

### Technology (builder's call, stated to the owner)

- TypeScript everywhere, npm workspaces monorepo:
  - `shared/` — pure rules engine: `(state, action) -> (state, events)`, deterministic,
    seeded RNG, no I/O. All rules live here and are unit-tested with Vitest.
  - `server/` — Node HTTP + WebSocket (`ws`). Owns rooms and authoritative state. Sends
    each player a view with hidden info removed (other players' hands, deck order).
  - `client/` — React + Vite. Board drawn in SVG.
- `npm run dev` starts server and client together for local play.
- Production: server serves the built client, one port, one URL.

## Terminology (renamed)

Mechanics map one-to-one. Names below are the builder's proposal; the owner may rename.

| Concept | Runeshore name |
|---|---|
| Victory points | Renown |
| Road | Path |
| Settlement | Outpost |
| City | Citadel |
| Robber | The Shade |
| Brick / lumber / wool / grain / ore | Clay / Timber / Fleece / Harvest / Starmetal |
| Desert | Ashen waste |
| Development cards | Omens |
| Knight card | Warden |
| Road building / Year of plenty / Monopoly | Waymaking / Bounty / Hoard |
| Victory point card | Relic |
| Largest army / Longest road | Grand host / Longest path |
| Harbor | Port |
| Cities & Knights expansion | "Siege of the Hollow Fleet" |
| Barbarians | The Hollow Fleet |
| C&K knights | Sentinels |
| Paper / cloth / coin | Vellum / Silk / Sigil |
| Science / Trade / Politics tracks | Lore / Guild / Crown |
| Progress cards | Arcana |
| Metropolis | Spire |
| City wall | Bulwark |
| Defender of Catan | Shield of the shore |
| Merchant | Peddler |
| Seafarers expansion / ship / pirate / gold field | "Drowned Isles" / Skiff / Corsair / Glimmer field |

Names for Traders & Barbarians and Explorers & Pirates pieces are decided in their phases.

## Base game rules scope

- Board: 19 land hexes, number tokens, 9 ports. Two board modes: random (with fairness
  constraints: no two red numbers adjacent) and a fixed starter layout.
- Setup: snake-order placement of two outposts and two paths; second outpost yields
  starting resources.
- Turn: roll, production, 7 → discard half (over 7 cards) and move the Shade + steal,
  then trade and build in any order, then end turn.
- Trading: player-to-player offers (propose, counter, accept, decline), bank 4:1, port
  3:1 and 2:1.
- Omen deck: standard composition and play limits (one per turn, not the turn bought,
  Relics revealed at win).
- Grand host (3+ Wardens), Longest path (5+ segments, broken by opponent outposts).
- Win at 10 Renown on your own turn.
- Room options: turn timer (off / 60s / 90s / 120s), board mode, discard limit, Renown
  target.

## Siege of the Hollow Fleet (Cities & Knights) scope

Full official C&K rules, renamed: Hollow Fleet track and attack resolution, three
commodities from citadels, Sentinels (basic/strong/mighty, activate, move, displace,
chase the Shade), Bulwarks, citadel improvements on Lore/Guild/Crown tracks, Spires,
Arcana deck (all three suits, full card list), event die, Shield of the shore, Peddler,
13 Renown win. No Omen deck in this mode.

## Builder's calls (owner may override)

- **Rules authority:** current official rulebooks for each game and expansion. Follow
  colonist.io only for what players can see about each other (card counts, public
  steal results, trade log).
- **Timeouts:** every decision point in the engine has an automatic default. When the
  turn timer runs out: roll if not rolled, discard at random, move the Shade to a random
  legal hex and steal at random, pick C&K choices at random among legal ones, then end
  the turn. Pending trades are cancelled.
- **Disconnects:** the seat stays reserved. With the timer on, the game keeps going on
  timeouts. With the timer off, the game pauses on that player; after 2 minutes the host
  can skip their turns on autopilot or remove them (their pieces stay, their cards are
  discarded).
- **Server restarts:** each room's state is snapshotted to disk after every action, and
  reloaded on start, so a restart or deploy doesn't kill a running game. The hosting
  phase picks a host that keeps files and doesn't sleep mid-game.
- **Planning depth:** base game and Siege of the Hollow Fleet are planned in detail. The
  engine is built to extend to 6 players, sea hexes, and ships. Later phases get their
  own design pass, including which scenarios are in.

## Left to the builder

- Exact visual design within the stated direction, layout of the game screen, animation
  details.
- Room link format, room expiry time, reconnection timing.
- Board generation algorithm and fairness rules beyond those stated.
- Hosting provider and deploy steps when that phase comes.
- Test strategy (rules engine must be well covered).
