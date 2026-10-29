# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A group of friends playing together, in the same room or over the internet. The range is wide on purpose: a 3 year old and a 75 year old must both be able to play. The 3 year old plays with a grown-up helping and may not be able to read. Play is mostly on laptop or desktop (mouse and keyboard). Games are 2-4 players.

## Product Purpose

Runeshore is a hex-island trading and building game played in the browser. Friends open a room link, take a seat, and play to a Glory target. Success: anyone in the group, at any age, can sit down and take real turns; the youngest with a grown-up beside them.

## Positioning

A Catan-style game that the whole family can join, not just people who already know the rules. The usual "read the rulebook first" barrier is the thing it removes.

## Operating Context

- Host runs the game on a PC (`npm start`) and shares a room link; also deployable to Render.
- Players join by browser. Seat is remembered per tab.
- Two modes: the base game, and the "Siege of the Hollow Fleet" add-on (Glory target 13). An in-game Rulebook has a tab per rule.

## Capabilities and Constraints

- React + Vite client in `client/`, shared rules engine in `shared/`, Node server in `server/`.
- Rules follow official Catan and Colonist rules (see project memory).
- The turn timer stays by choice (timing pressure is wanted). It must still be fair to slow players.

## Brand Commitments

Name: Runeshore. The game is fantasy themed (confirmed by the user). Existing game vocabulary (Glory, Runes, Relics, Warriors, Hollow Fleet, Vellum, Silk, Sigil, Arcana) is established and stays.

## Evidence on Hand

Working game with sound effects, comic-panel effects, rulebook, glory breakdown, and win screen. No user research or testing with children or older adults exists.

## Product Principles

1. Every turn offers clear, obvious next moves; nothing requires reading to proceed.
2. Mistakes are forgiving and easy to undo or avoid.
3. Pictures, sound, and motion carry meaning; text only supports.
4. Depth stays available for experienced players without blocking beginners.
5. Everyone at the table can follow what is happening at a glance.

## Accessibility & Inclusion

Must work for ages 3 to 75. This implies: large click targets, high contrast and large readable type for aging eyes, a timer that stays but is fair to slow players (pauses during reading, shows time as a bar), and picture-led cues for a pre-reader who has a grown-up helping. Mouse-and-keyboard is the primary input.
