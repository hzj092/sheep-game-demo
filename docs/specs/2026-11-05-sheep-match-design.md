# Two-Level Tile Match Game Design

## Goal

Build a locally runnable, responsive web game inspired by the public mechanics of Sheep a Sheep. The game has exactly two levels: a teaching level and a high-pressure level.

## Approved Scope

- Use Vite, React, and TypeScript.
- Prioritize portrait/mobile play while supporting desktop browsers.
- Implement a seven-slot tray; selectable tiles enter it and three matching tiles clear immediately.
- Level 1 teaches selection, matching, tray pressure, and the three tools through short contextual prompts.
- Level 2 uses a fixed layered funnel-shaped layout with deeper obstruction and more dispersed tile types.
- Provide undo, remove-three-to-storage, and shuffle tools.
- Keep game rules independent of presentation and make board layouts seedable/testable.
- Do not integrate a real advertising SDK. Keep a reward-ad entry point behind a local mock interface.

## Rules and State

- A tile is selectable only when no uncleared tile above it overlaps its hit area.
- Selecting a tile removes it from the board and appends it to the tray.
- Three tiles of the same type clear immediately; fewer than three occupy tray slots.
- A full tray without a clear is a loss.
- Undo restores the last selected tile and the prior tray state.
- Remove-three transfers up to three tray tiles into a temporary storage row; stored tiles remain available to return to the tray.
- Shuffle changes tile types among uncleared board tiles without changing geometry or obstruction.
- A mock reward flow grants a chosen tool/continue only after its completion callback succeeds.

## Level Intent

- Level 1: small, readable board, guided steps, generous matching opportunities.
- Level 2: fixed funnel silhouette, additional layers and tile types, and fewer immediately visible triples.
- Level geometry is deterministic. Tile-type assignment is seeded so failures can be reproduced.

## Out of Scope

- Production advertising SDKs, analytics, accounts, backend services, and persistent leaderboards.
- Claiming equivalence with proprietary original game internals.
- More than two levels or additional power-ups.

## Acceptance Criteria

- The project starts locally with documented commands and works in a browser.
- Both levels are playable from start to terminal win/loss states.
- Tray capacity, matching, undo, storage, and shuffle rules have automated tests.
- Mobile and desktop layouts keep the board, tray, and controls usable without overlap.
