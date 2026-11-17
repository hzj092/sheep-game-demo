# Implementation Plan: Unified Portrait Layout

## Overview

Convert the home and game screens to a centered, single-column viewport layout shared by desktop and Android browsers. The board will use the flexible center region; tray and compact square tools remain visible beneath it without page scrolling or overlays.

## Requirements

- Target 320×568, 360×640, 390×844, and 1366×768 viewports without document scroll or clipped controls.
- Cap desktop content near 520px and use mobile width with safe-area-aware dynamic viewport sizing.
- Preserve two home entries; stack the three Level 2 layout choices vertically.
- Keep gameplay order: level/progress, board, seven-slot tray, tools.
- Display three labeled square tools horizontally with top-right stock badges.
- Preserve game behavior, game state, board geometry relationships, and existing persistence.

## Architecture Changes

- `src/styles.css`: replace breakpoint-dependent two-column gameplay with a viewport-constrained single-column layout; define shrinkable board sizing and square tool sizing.
- `src/App.tsx`: retain component order and existing game flows while applying the unified home/game shell sizing and semantics if structural changes are needed.
- `src/components/Board.tsx`: keep generated coordinates and z-order stable; only adjust frame-relative sizing if required for fit.
- `src/components/Tools.tsx`: make each tool a square, accessible control with a count badge and visible compact label.
- `src/App.test.tsx`, `src/components/Board.test.tsx`, and a new `src/components/Tools.test.tsx`: cover structure, controls, and invariants.
- `README.md`: document unified portrait responsive behavior and launch/Pages setup.

## Implementation Steps

### Phase 1: Unified Home and Viewport Shell

1. **Create viewport-sized app shell** (File: `src/styles.css`)
   - Action: Add `100vh` fallback, `100dvh`, safe-area insets, box sizing, and document/root overflow containment; center a single column with a 520px maximum width.
   - Why: Establish identical portrait composition across desktop and mobile and prevent page-level scrolling.
   - Dependencies: None
   - Risk: Medium
2. **Restack home choices** (Files: `src/styles.css`, `src/App.test.tsx`)
   - Action: Make Basic and Level 2 entries fit the content width; stack the three Level 2 options vertically with stable touch-sized rows. Add/adjust structural tests.
   - Why: Keep all home choices readable and selectable in the locked viewport.
   - Dependencies: Step 1
   - Risk: Low

### Phase 2: Board-First Gameplay and Tools

3. **Refactor game view into a shrinkable vertical layout** (Files: `src/styles.css`, `src/App.tsx`)
   - Action: Place header and level/progress above a flexible board region; tray and tools follow in normal flow. Constrain board dimensions to the remaining height while preserving aspect/position logic and keeping every active tile inside the frame.
   - Why: Give the board the largest available area without tray/tool overlap or scrolling.
   - Dependencies: Phase 1
   - Risk: High
4. **Restyle tool controls** (Files: `src/components/Tools.tsx`, `src/styles.css`, `src/components/Tools.test.tsx`)
   - Action: Present undo, store, and shuffle in a horizontal row of equal square controls. Place stock in a top-right badge; preserve visible names and accessible ad/count descriptions. Add focused rendering and click-delegation tests.
   - Why: Match the requested compact control layout without reducing affordance on touch screens.
   - Dependencies: Step 3
   - Risk: Medium
5. **Keep tray and result flows viewport-safe** (Files: `src/styles.css`, `src/App.test.tsx`)
   - Action: Fit all seven tray slots beneath the board and above tools; constrain result/ad dialogs to the viewport and ensure every action remains visible.
   - Why: Prevent secondary screens from reintroducing clipping or scroll.
   - Dependencies: Steps 3-4
   - Risk: Medium

### Phase 3: Responsive Verification and Documentation

6. **Document the layout contract** (File: `README.md`)
   - Action: Record supported viewport targets, no-scroll behavior, and board/tray/tool order while retaining existing game rules and Pages deployment guidance.
   - Why: Keep project instructions aligned with the actual UI and hosting configuration.
   - Dependencies: Steps 1-5
   - Risk: Low
7. **Verify real viewport bounds** (Files: `src/App.test.tsx`, `src/components/Board.test.tsx`, `src/components/Tools.test.tsx`)
   - Action: Run tests/build, then capture Chrome at 320×568, 360×640, 390×844, and 1366×768. Check `scrollWidth/clientWidth`, `scrollHeight/clientHeight`, and bounding boxes for board, tray, tools, and dialogs. Fix any overlap, clipping, or target-size regressions before handoff.
   - Why: CSS test environments alone cannot prove viewport fit or visual usability.
   - Dependencies: Steps 1-6
   - Risk: Medium

## Testing Strategy

- Unit: `npm test`, including existing game-engine and layout-generation suites plus home/tool component expectations.
- Integration: Exercise home selection for all three layouts, a tile selection into the tray, all three tool callbacks, and ad/result dialogs.
- Browser: Use local Chrome at the four target viewport sizes; inspect screenshots and DOM metrics for page scrolling, horizontal clipping, control bounds, and visible touch targets.
- Build: `npm run build`.

## Success Criteria

- [ ] Home and gameplay use a single centered column at desktop and mobile sizes.
- [ ] No target viewport has document-level horizontal or vertical scrolling.
- [ ] All home entries, 270-tile layouts, seven tray slots, tool buttons/badges, and result actions remain visible and unclipped.
- [ ] Tray and tools never overlap the tile board.
- [ ] Existing gameplay rules, seed handling, ads, and history behavior remain unchanged.
- [ ] Tests and production build pass; Chrome visual and DOM-bound checks pass at every target size.
