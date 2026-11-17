# Implementation Plan: Level 2 Pile Layouts

## Overview

Add three selectable layouts under the existing second-level home entry: the current fully-random 270-card layout, a 201-card inverted pyramid, and a 270-card Sheep composition. Use independent seeded generators with shared placement and coverage helpers so the existing random layout remains stable.

## Requirements

- Preserve the Basic level and current fully-random board behavior.
- Inverted-pyramid layer counts: `1, 4, 9, 16, 25, 36, 49, 61`; later outer layers cover inner layers.
- Sheep mode: two 10-card side stacks, central upper `7x2` and lower `7x4` regions, pyramid foundations, randomized intermediate cards, and at least two regular grid layers per region; total 270 cards.
- Large pyramid motifs occupy 8%-25% of board cards. Motifs repeat 2 or 3 times at a shared footprint. Small pyramids prefer the first 8% of pool generation order, with deterministic random fallback.
- Selecting a layout starts a seeded run; the selected layout is recorded. Legacy records without a layout remain readable.
- No changes to existing tray, match-three, tool, ad, revive, win/loss, or tile-color rules.

## Architecture Changes

- `src/game/levels.ts`: retain the random generator path; add independent inverted and Sheep generators plus shared geometry/coverage helpers.
- `src/game/types.ts`: add second-level layout identity and any narrow tile metadata needed for deterministic rendering.
- `src/game/history.ts`: persist the selected layout while reading existing records without that field.
- `src/App.tsx`: expose three layout choices under the second-level entry and carry the selected layout into runs/results.
- `src/components/Board.tsx` and `src/styles.css`: render the new board positions, overlaps, and visible 8px side-stack offsets responsively.
- `src/App.test.tsx`, `src/game/levels.test.ts`, and `src/game/history.test.ts`: cover selection, generation invariants, determinism, and history compatibility.
- `README.md`: update v1.2 status and summarize the implemented layouts after verification.

## Implementation Steps

### Phase 1: Layout Identity and Inverted Pyramid

1. **Specify layout generator behavior in tests** (File: `src/game/levels.test.ts`)
   - Action: Add failing tests for the 201-card square-layer sequence, deterministic tile order/positions/coverage, outer-layer coverage, and preservation of the existing 270-card random generator output.
   - Why: Establish the generator contracts before implementation.
   - Dependencies: None
   - Risk: Medium
2. **Add layout identity and generation routing** (Files: `src/game/types.ts`, `src/game/levels.ts`)
   - Action: Introduce a second-level layout type and route `getLevel` through the existing random path by default without changing its random-number consumption.
   - Why: Keep current callers and seeded random boards stable while making variant selection explicit.
   - Dependencies: Step 1
   - Risk: Medium
3. **Add shared grid-overlap helpers** (File: `src/game/levels.ts`)
   - Action: Add deterministic grid placement and footprint-overlap coverage helpers; keep them separate from the current random generator path.
   - Why: Use consistent geometric coverage for new overlapping layouts.
   - Dependencies: Step 2
   - Risk: Medium
4. **Implement inverted-pyramid generation** (File: `src/game/levels.ts`)
   - Action: Generate centered square layers with counts `1,4,9,16,25,36,49,61`, seed-assign tile types, and make each new outer layer visually higher than overlapping inner tiles.
   - Why: Deliver the first new deterministic layout independently.
   - Dependencies: Step 3
   - Risk: Medium

### Phase 2: Sheep Composite Generator

1. **Specify Sheep composition invariants in tests** (File: `src/game/levels.test.ts`)
   - Action: Add failing tests for 270 total tiles, two side stacks of 10 with 8px offsets, central-region bounds, at least two aligned layers in each region, required foundations, pyramid occupancy, and same-seed determinism.
   - Why: Make the spatial and allocation constraints executable.
   - Dependencies: Phase 1
   - Risk: High
2. **Implement single motif footprints** (File: `src/game/levels.ts`)
   - Action: Add small helpers that place one large (4+1) or small (2+1) motif with touching base cards, centered top, and explicit footprint-overlap links.
   - Why: Keep geometry primitives small and directly testable.
   - Dependencies: Phase 2, Step 1
   - Risk: High
3. **Repeat motifs vertically** (File: `src/game/levels.ts`)
   - Action: Stack 2 or 3 motif repetitions at the same footprint and link each new repetition to the cards it geometrically covers.
   - Why: Implement the specified overlap depth without duplicating the single-motif placement logic.
   - Dependencies: Phase 2, Step 2
   - Risk: High
4. **Represent and generate side stacks** (Files: `src/game/types.ts`, `src/game/levels.ts`)
   - Action: Add narrow stack metadata and create the two ten-card side stacks with deterministic 8px vertical offsets and explicit cover order.
   - Why: Preserve stack geometry for responsive rendering and selection logic.
   - Dependencies: Phase 2, Step 1
   - Risk: Medium
5. **Allocate Sheep regions and card budget** (File: `src/game/levels.ts`)
   - Action: Reserve the two central regions, place their foundations, choose a seeded large-pyramid card share within 8%-25%, and calculate a deterministic remaining-card budget.
   - Why: Make the fixed total and structure proportions explicit before filling grid layers.
   - Dependencies: Phase 2, Steps 3-4
   - Risk: High
6. **Fill randomized and aligned layers** (File: `src/game/levels.ts`)
   - Action: Place seeded intermediate cards and at least two complete aligned layers in each region, then allocate any remaining cards inside the allowed regions to reach exactly 270.
   - Why: Finish the Sheep board while preserving all region and total-count invariants.
   - Dependencies: Phase 2, Step 5
   - Risk: High
   - Dependencies: Phase 2, Step 2
   - Risk: High

### Phase 3: Home Selection, Persistence, and Rendering

1. **Add layout selection flow tests** (File: `src/App.test.tsx`)
   - Action: Add failing tests for the unchanged Basic entry, exactly three second-level layout choices, and each choice starting the correct layout/count.
   - Why: Lock the user-facing navigation contract.
   - Dependencies: Phase 1 and Phase 2
   - Risk: Medium
2. **Persist layout identity with run history** (Files: `src/game/history.ts`, `src/game/history.test.ts`)
   - Action: Add failing compatibility tests for writing a layout identifier and reading older entries without one, then implement the optional persisted field.
   - Why: Distinguish the new variants without invalidating local records.
   - Dependencies: Phase 3, Step 1
   - Risk: Low
3. **Implement second-entry variant controls** (File: `src/App.tsx`)
   - Action: Keep Basic as-is, render three compact buttons within the second-level entry, create a new seeded board for the selected variant, and display its name in the game heading.
   - Why: Expose the three generators through the requested home flow.
   - Dependencies: Phase 3, Step 1
   - Risk: Medium
4. **Render generated positions and coverage** (File: `src/components/Board.tsx`)
   - Action: Render generator coordinates and stack metadata without overriding explicit coverage order.
   - Why: Make the data layout legible and preserve current interaction styling.
   - Dependencies: Phase 1 and Phase 2
   - Risk: High
5. **Style responsive pile layouts** (File: `src/styles.css`)
   - Action: Apply a visible 8px side-stack offset per card and ensure layout footprints stay within the board on desktop and mobile while preserving white ready tiles and light-gray covered tiles.
   - Why: Keep the new pile shapes readable across viewport sizes.
   - Dependencies: Phase 3, Step 4
   - Risk: Medium
6. **Update version documentation** (Files: `README.md`, `demo/README.md`)
   - Action: Mark v1.2 implemented and document the three variants, tile counts, stack composition, and deterministic generation.
   - Why: Keep the recorded version scope aligned with the delivered code.
   - Dependencies: All previous steps
   - Risk: Low

## Testing Strategy

- Unit: `src/game/levels.test.ts` for exact counts, layer sequence, coverage, region bounds, motif counts, occupancy, determinism, and random-layout stability.
- Unit: `src/game/history.test.ts` for new layout persistence and legacy records.
- Integration: `src/App.test.tsx` for the Basic entry, three second-level choices, selected layout heading, and tile totals.
- Regression: full `npm test -- --reporter=dot` and `npm run build`.
- Visual: inspect the three layouts at desktop and mobile widths in the running Vite app, focusing on overlap, side-stack offset visibility, and board bounds.

## Success Criteria

- [x] Basic and fully-random gameplay remain unchanged.
- [x] Inverted pyramid renders 201 cards in the specified layer counts and coverage order.
- [x] Sheep mode renders exactly 270 cards with the specified side stacks and central-only regions.
- [x] Same layout, seed, and generator version produce identical layouts.
- [x] The second-level entry offers exactly the three requested choices, and history distinguishes them.
- [x] Existing tests pass, new tests pass, and the production build succeeds.
