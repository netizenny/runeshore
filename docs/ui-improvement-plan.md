# Runeshore UI improvement plan

Based on the critique of `client/` on 2026-10-28. Score: 22/40 (Acceptable). Goal from `client/PRODUCT.md`: friends aged 3 to 75 can play on laptop or desktop, in a fantasy setting, with the youngest helped by a grown-up.

Nothing here is built yet. It is meant to be built in a separate chat, in the order below. Each phase ends in its own commit. Do not push until all phases are done.

## Decisions (settled by the owner)

1. **The turn timer stays.** Timing pressure is wanted. Make it fair, not gone.
2. **The 3 year old plays with a grown-up helping.** No separate pre-reader mode. Everything must still be big, picture-led and forgiving.
3. **Keep the board world** (indigo, gold, illustrated hex board). Fix hierarchy; no full redesign.

## What the review found

| Problem | Severity | Evidence |
|---|---|---|
| Timer plays for you at zero (default 30s, range 15 to 45s) with no log line, and keeps running while you read the rulebook or a trade. | P1 | `server/src/room.ts` ~245-281, `Lobby.tsx:91`, `Players.tsx:19-26` |
| Weak "it is your turn" signal. The top bar prints raw text such as "AnnBo: main". The active seat is only a 2px outline. | P0 | `Game.tsx:80`, `theme.css:49` |
| Buttons and text too small: board click circles 25.6px, buttons 38-40px, many labels 11.5-13.6px. | P1 | Measured at 1440x900 |
| No clear "do this next" button. Every dock control looks the same. | P1 | `theme.css`, `Build.tsx` |
| Trade is hard to follow. Give/Get wording flips by viewer, and offers pop up in a corner. | P2 | `Offers.tsx`, `.offers { right: 330px }` |
| Home and Lobby are plain forms with no art. | P2 | `Home.tsx`, `Lobby.tsx` |
| Win screen is flat and unstyled. | P3 | `ComicPanel.tsx` |
| No visible keyboard focus. Name field has no label. Placeholder contrast about 2.8:1. Countdown not announced. | P1 | Detector and measurements |
| Inter font, one-note gold-on-indigo boxes, and `* { font-weight: 700 }` flatten hierarchy. 8px side stripe on player rows. | P2 | `theme.css:17`, `theme.css:48` |

## Phases

### Phase 1: Safe to play
- Timer stays on. Add 60s and 90s options and make 45s the default. Pause it while the rulebook or trade drawer is open. Show a draining bar beside the digits. Log "Auto-moved for X". Announce the countdown to screen readers.
- Raise floors: interactive targets 48px, body text 16px, nothing under 14px. Board click circles 40px or more with a hover ring.
- Visible keyboard focus on every control. Label on the name field. Readable placeholder contrast.
- Announce turn changes and offers to screen readers.
- Replace raw phase text ("AnnBo: main") with plain words and an icon.
- Commands: `harden`, `typeset`, `adapt`.

### Phase 2: A clear turn
- A big "your turn" signal: pulsing gold ring around the dock, a sound cue, and a large prompt with the piece icon ("Place a house").
- One filled "do this next" button; all other dock buttons become quiet outlines. When only one move is legal, highlight it and dim the rest, so a grown-up and a watching child can follow.
- Cut options at each decision to 4 or fewer where possible.
- Commands: `shape` first, then `layout`, `bolder`.

### Phase 3: Trading made clear
- Use "You give" and "You get" with arrows, the same wording for everyone.
- Incoming offer becomes a centred card with a chime and big green check and red cross buttons.
- Picker becomes a fixed panel instead of covering the board. Remove the hard-coded 330px offset so it follows the sidebar.
- Commands: `clarify`, `layout`, `animate`.

### Phase 4: Welcome and win
- Home: illustrated island hero, one huge "Start a game" button, a short "Join with code" box.
- Lobby: three presets (Quick, Classic, Epic) with the rest under "Advanced". Short room code that can be read aloud.
- Win screen: crown, podium, winner colour wash, safe for reduced-motion. Score table behind "How it happened". "Back to lobby" keeps the room.
- Commands: `onboard`, `delight`, `animate`.

### Phase 5: Fantasy look (DONE)
- Replace Inter with a warmer face that stays legible at large sizes (headings already use Cinzel). Remove the global bold rule and rebuild the weight hierarchy.
- Seat identity by colour plus shape or banner art instead of an 8px side stripe.
- Parchment, stone or wood texture on panels instead of identical indigo boxes. Keep today's strong contrast (about 14:1).
- Commands: `typeset`, `colorize`, `delight`.

### Phase 6: Check and finish (DONE except human test)
- Critique 2026-10-28: 27/40, up from 22/40. Remaining: dense seat stat rows, trade panel covers the hand, no feedback on board miss-clicks, win screen and offer card not re-checked.
- `polish`, then re-run `critique` and compare against 22/40.
- Test with a young child and an older adult at the table.

### Phase 6 re-critique (2026-10-29)
Score 28/40 (Good), up from 22/40 baseline and 27/40 after phase 6. Snapshot: `client/.impeccable/critique/2026-10-29T00-51-23Z__src.md`. The human test with a child and an older adult is skipped by owner decision. Three P1 issues remain; phase 7 fixes them. Each sub-phase ends in its own commit. Do not push until 7a, 7b and 7c are all done.

### Phase 7a: Setup banner shows the right player (DONE, 4b0483a; not yet checked in two tabs)
- Problem: `Game.tsx:101-102` checks `ph.k === 'setup'` before `mine`, so every player sees "Place your outpost/path" until their own turn. A child or older adult clicks a board that does nothing, and a screen reader announces the wrong prompt.
- Fix: branch on `mine`. If mine: "Place your outpost" or "Place your path". Otherwise: "{name} is placing an outpost" or "{name} is placing a path". The gold bar tint and `data-mine` stay tied to `mine` only. Keep `role=status` so the change is announced.
- Check: with two browser tabs in setup, the non-active tab shows the other player's name and no gold tint.
- Command: `clarify`.

### Phase 7b: Trade has no dead ends
- The own-offer card (`.offers`, `top: 3rem`) overlaps the trade drawer (`top: 4.5rem`) in `theme.css`. Move own offers inside the drawer, or stack them below it, so nothing covers the "Vault / ports" tab.
- Add proposer states: "Waiting for {name}" and "{name} accepted".
- Stop a receiver accepting an offer they cannot pay. Disable Accept and say what is missing, for example "You need 1 clay". If the proposer's confirm button is disabled, show the reason beside it.
- Reset the picker after an offer is sent, so a double click cannot send two offers.
- Check: two tabs. Send an offer the receiver cannot afford, then one they can. Confirm no overlap at 1440x900, including with the sidebar resized.
- Commands: `harden`, then `layout`.

### Phase 7c: Dock and seat stats readable without reading
- Replace the seat stat labels "Built / Cards / Runes / Warriors" (`Players.tsx:76-80`) with icons plus a tooltip and an accessible name. Keep numerals at least 16px.
- Unaffordable Build buttons show what is missing (one grey dot or icon per missing resource) instead of only dimming to 0.5 opacity.
- Raise dock cost icons from about 18px to 24px.
- Check: a grown-up and a non-reader can tell what a piece costs and what is missing without reading text. Keep every target at 48px and no text under 14px.
- Commands: `shape` for the icon set first, then `adapt`.

### Not in phase 7 (P2, later)
Hollow Fleet dock text below 14px, board hit targets not keyboard reachable, 6 unlabeled Lobby selects, win dialog autofocus, ★ vs ♛ glyph mismatch, duplicate `.step` class, flat Home hero art, emoji used as UI icons.

## Out of scope
Game rules and engine. No changes to `shared/`.
