# Implementation Plan: Seeded Animal-Pool Sheep Demo

## Overview

Implement the approved two-mode game in the isolated worktree. Use the xlegex generation flow (type pool, shuffled layers, grid positions, adjacent-layer coverage) while adding seeded generation and fixing the documented allocation/coordinate issues. The animal catalog is sampled without replacement per run before constructing the triple pool.

## Requirements

- Home has exactly two entries: Basic (4 types x 2 repeats = 24 tiles) and Sheep Mode (15 types x 6 repeats = 270 tiles).
- Each run samples `cardNum` distinct symbols from the approved 44-animal list using its seed; each chosen type appears `3 * layerNum` times.
- The same mode, seed, and generator version reproduce type selection, layers, and logical positions.
- Preserve the seven-slot match-three rules and one-use undo/store/shuffle tools. Each tool action requires a successful local mock-ad flow and consumes its use; cancel/failure changes nothing.
- An in-game reward slot grants one additional undo use after a successful local mock-ad flow; cancel/failure grants nothing.
- Store moves the leftmost three tray tiles to storage and permits returning them. Shuffle permutes active board types without changing counts or geometry.
- One successful mock-ad revive moves the leftmost three tray tiles into an uncovered, selectable top layer displayed in the board's bottom return row.
- Final win/loss records mode, seed, generator version, result, and completion time under `sheep-demo.run-history.v1` in localStorage, then returns home. Starting another run creates a new seed.

## Architecture Changes

- `src/game/levels.ts`: animal catalog, seeded PRNG, per-run no-replacement sampling, pool construction, layer sizing, grid placement, and mode configurations.
- `src/game/types.ts` and `src/game/engine.ts`: mode/seed state, adjacent-layer coverage, state transitions, history, tool actions, and revive return tiles.
- `src/game/rewards.ts` and new `src/game/history.ts`: local mock-ad completion semantics and persistent final-run records.
- `src/App.tsx` and `src/components/`: home mode selection, play view, ad-gated tools, revive flow, result feedback, and board return row.
- `src/styles.css`: responsive home/game views and return-row styling.
- `README.md` and `demo/README.md`: launch instructions and final behavior/spec alignment.

## Implementation Steps

### Phase 1: Deterministic Animal Pool — Minimum Viable

1. **Lock generation behavior with failing tests** (File: `src/game/levels.test.ts`)
   - Action: Assert the exact 44 unique symbols, per-seed sampling of 4 or 15 distinct types, 24/270 tile totals, per-type triple multiples, seed repeatability, and bounded/non-empty layer totals.
   - Why: Catch catalog and random-generation errors before changing the generator.
   - Dependencies: None
   - Risk: Medium
2. **Implement seeded pool and two mode configurations** (Files: `src/game/levels.ts`, `src/game/types.ts`)
   - Action: Add the approved catalog, mode definitions, seeded type sampling, repeated triples, bounded shuffled layer allocation, unique grid positions, and generator version.
   - Why: Make the new deck sizes and all generation randomness reproducible.
   - Dependencies: Step 1
   - Risk: Medium
3. **Verify generation invariants in focused tests** (File: `src/game/levels.test.ts`)
   - Action: Run the tests and add only the missing edge cases for zero/maximum seeds and both modes.
   - Why: Confirm generated data meets the written spec before engine work.
   - Dependencies: Step 2
   - Risk: Low

### Phase 2: Match Rules and Recovery — Core Experience

4. **Add failing state-transition tests** (File: `src/game/engine.test.ts`)
   - Action: Cover seven-slot loss, exact triple removal, last-selection undo, three-tile storage/return, seeded shuffle invariants, adjacent-layer selection, and revive tiles becoming directly selectable top-layer cards.
   - Why: Define gameplay behavior independently from React.
   - Dependencies: Phase 1
   - Risk: Medium
5. **Implement game-state transitions** (Files: `src/game/engine.ts`, `src/game/types.ts`)
   - Action: Add mode/seed/version state, explicit adjacent-layer coverage, snapshot/undo, storage limits, board-only shuffle, terminal settlement, and revive return-row placement.
   - Why: Keep rules deterministic and prevent UI code from mutating game state directly.
   - Dependencies: Step 4
   - Risk: High

### Phase 3: Mock Ads and Run Records

6. **Add failing reward and persistence tests** (Files: `src/game/rewards.test.ts`, new `src/game/history.test.ts`)
   - Action: Assert tool actions only apply after mock completion, canceled rewards preserve state/counts, the reward slot adds one undo use on success, revive is one-use, and final records serialize to the agreed localStorage key.
   - Why: Protect the ad gate and the user-requested seed history.
   - Dependencies: Phase 2
   - Risk: Medium
7. **Implement reward and record modules** (Files: `src/game/rewards.ts`, new `src/game/history.ts`)
   - Action: Add typed mock completion/cancel results and versioned read/write helpers for final run records.
   - Why: Make reward effects and persistence testable without UI timing.
   - Dependencies: Step 6
   - Risk: Medium

### Phase 4: Home and Play UI

8. **Add failing UI workflow tests** (File: `src/App.test.tsx`)
   - Action: Verify home shows exactly two modes, selecting each starts the expected deck size, tool use waits for mock-ad success, revive returns three cards to the board, and final outcomes persist then return home.
   - Why: Validate the requested end-to-end flows.
   - Dependencies: Phase 3
   - Risk: High
9. **Wire the home, board, tool, and result flows** (Files: `src/App.tsx`, `src/components/Board.tsx`, `src/components/Tools.tsx`, `src/components/Tray.tsx`; add focused components only if needed)
   - Action: Replace automatic level progression with mode selection; connect deterministic new-run seeds, ad-gated tools, the extra-undo reward slot, revive, storage return, final records, and home navigation.
   - Why: Deliver the agreed two-entry playable experience.
   - Dependencies: Step 8
   - Risk: High
10. **Style and document the runnable demo** (Files: `src/styles.css`, `README.md`, `demo/README.md`)
    - Action: Keep the board, seven slots, storage, ad flow, and return row usable on narrow and desktop viewports; document the local command and final rules.
    - Why: Make the experience usable and keep the spec aligned with implementation.
    - Dependencies: Step 9
    - Risk: Medium

### Phase 5: Verification

11. **Run automated and browser checks** (Files: relevant tests and app)
    - Action: Run `npm test` and `npm run build`; start the dev server and exercise both mode entries, one tool ad success/cancel, revive, and final return/record flows at desktop and mobile viewports.
    - Why: Verify gameplay and responsive rendering beyond pure unit tests.
    - Dependencies: Steps 1-10
    - Risk: Medium

## Testing Strategy

- Unit: `src/game/levels.test.ts`, `src/game/engine.test.ts`, `src/game/rewards.test.ts`, and `src/game/history.test.ts` for generated-deck invariants and every state transition.
- Integration: `src/App.test.tsx` for both home entries, ad-gated action, revive, final persistence, and return-home behavior.
- Browser: Run the local Vite server and check both modes plus ad/revive flows at desktop and mobile viewport sizes.

## Success Criteria

- [ ] The 44-symbol catalog is exact and each run samples exactly `cardNum` distinct types.
- [ ] Basic produces 24 tiles and Sheep Mode produces 270 tiles with the configured per-type counts.
- [ ] Matching mode/seed/generator version reproduces the same generated deck and geometry.
- [ ] Both modes, all three tools, mock ad gates, one revive, final record, and return-home behavior work.
- [ ] Tests and production build pass; the local app is available for browser verification.
