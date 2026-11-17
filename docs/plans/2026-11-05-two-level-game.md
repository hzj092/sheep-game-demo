# Implementation Plan: Two-Level Tile Match Game

## Overview

Create a responsive Vite/React/TypeScript game with an isolated deterministic rules engine. The teaching and high-pressure funnel levels share the same seven-slot match-three rules and three tools.

## Requirements

- Exactly two playable levels: guided tutorial, then high-pressure funnel.
- Seven tray slots; triples clear, a full tray loses.
- Undo, remove-three-to-storage, shuffle, and mock reward callback.
- Mobile-first responsive board and controls.

## Architecture Changes

- `src/game/`: pure game state, tile/layout definitions, level generation, and actions.
- `src/components/`: board, tray, tool controls, tutorial prompts, and result states.
- `src/styles.css`: responsive visual system and board geometry.
- `src/game/*.test.ts`: deterministic rules and generation tests.

## Implementation Steps

### Phase 1: Project and Rules — Minimum Viable
1. **Create the Vite app and test runner** (File: `package.json`, `vite.config.ts`, `src/main.tsx`)
   - Action: Scaffold React/TypeScript and configure Vitest.
   - Why: Establish a runnable baseline and fast logic tests.
   - Dependencies: None
   - Risk: Low
2. **Specify engine behavior with failing tests** (File: `src/game/engine.test.ts`)
   - Action: Cover selection, triple clear, seven-slot loss, undo, storage, and shuffle invariants.
   - Why: Lock behavior before implementation.
   - Dependencies: Step 1
   - Risk: Medium
3. **Implement state and actions** (File: `src/game/engine.ts`)
   - Action: Add pure typed operations for select, undo, remove-three, return stored tile, and shuffle.
   - Why: Keep mechanics independent of React.
   - Dependencies: Step 2
   - Risk: Medium

### Phase 2: Levels and Playable UI — Core Experience
4. **Add deterministic level layouts** (File: `src/game/levels.ts`)
   - Action: Define a small guided board and a fixed funnel-shaped layered board with seeded tile assignment.
   - Why: Make the two difficulty profiles reproducible and visually intentional.
   - Dependencies: Step 3
   - Risk: Medium
5. **Build game screen and responsive board** (File: `src/App.tsx`, `src/components/Board.tsx`, `src/components/Tray.tsx`)
   - Action: Render selectable layered tiles, tray, level progression, tutorial prompts, and win/loss states.
   - Why: Deliver the actual playable workflow.
   - Dependencies: Steps 3-4
   - Risk: Medium
6. **Wire tools and mock reward entry** (File: `src/components/Tools.tsx`, `src/game/rewards.ts`)
   - Action: Connect tool actions and expose a mock callback that grants rewards only on successful completion.
   - Why: Complete the agreed power-up and ad-slot behavior without a real SDK.
   - Dependencies: Step 5
   - Risk: Low

### Phase 3: Polish and Verification
7. **Style mobile and desktop states** (File: `src/styles.css`)
   - Action: Tune fixed tile dimensions, responsive board bounds, contrast, focus/disabled states, and motion.
   - Why: Keep game controls readable and prevent overlap.
   - Dependencies: Step 5
   - Risk: Medium
8. **Verify test/build and browser play** (File: `README.md`)
   - Action: Document run commands; run tests/build and exercise both levels at desktop and mobile sizes.
   - Why: Confirm the delivered experience, not only the rules engine.
   - Dependencies: Steps 1-7
   - Risk: Low

## Testing Strategy

- Unit: Vitest tests for each state transition, edge case, and deterministic level invariant.
- Integration: Render and interact with a level, use each tool, and reach win/loss states.
- E2E: Start dev server and verify tutorial completion plus level-two funnel play at mobile and desktop viewports.

## Success Criteria

- [x] `npm test` passes.
- [x] `npm run build` succeeds.
- [x] Both levels can be started and completed or lost in-browser.
- [x] The seven-slot tray and all three tools work as specified.
- [x] Mobile and desktop controls do not overlap the board.
- [x] The local mock reward only grants on success.
