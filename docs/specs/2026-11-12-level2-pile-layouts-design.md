# Design: Level 2 Pile Layouts

## Status

Design proposal for v1.2. No implementation changes are included until this design is approved.

## Goal

Keep the existing basic level and expand the second-level home entry into three selectable layouts: fully random, inverted pyramid, and Sheep mode. Each layout must be reproducible from its seed, preserve the existing match-three rules, and expose its coverage relationships to the game engine.

## Confirmed Requirements

- The fully random option reuses the current random second-level board and has 270 tiles.
- The inverted pyramid has 201 tiles arranged in layer order `1, 4, 9, 16, 25, 36, 49, 61`. The final layer has capacity 64 but uses 61 positions. Start at the board center and expand outward; later outer layers are above and cover earlier inner layers.
- Sheep mode has 270 tiles. It includes one 10-card vertical full-cover stack on each side of the board. Each successive card is displaced vertically by 8 CSS pixels so the stack depth remains visible.
- Sheep mode's remaining cards stay within two central regions: an upper 7-column by 2-row region and a lower 7-column by 4-row region. Each region starts with pyramid or small-pyramid structures, then seed-randomized cards, then at least two aligned grid layers matching that region's dimensions.
- A large pyramid motif is a four-card, edge-to-edge square base with one card centered above it. A small-pyramid motif is a two-card, edge-to-edge rectangular base with one card centered above it. A motif is repeated vertically at the same footprint 2 or 3 times; each repetition has a new base layer and centered top card.
- Large-pyramid structures occupy a seeded share of 8%-25% of the board's tile count, measured by the number of tiles in those structures.
- Small pyramids are placed preferentially among the first 8% of the seeded pool-generation order; if that region has no valid footprint, choose another valid footprint deterministically at random.
- All new layout choices and placements use the level seed. The basic level and existing game actions remain unchanged.

## Home Selection

The first-level Basic entry remains unchanged. The second-level entry contains three compact selectable choices:

```text
Basic

Second level
  [Fully random] [Inverted pyramid] [Sheep mode]
```

Selecting a choice starts a fresh run with a new seed and that layout. The active layout name is shown in the game heading and included in run history so records distinguish the three second-level variants.

## Layout Semantics

### Fully Random

Reuse the existing 270-tile seeded pool generation, randomized layer allocation, positions, and coverage behavior. Adding the other layout strategies must not change this option's results for a given seed and generator version.

### Inverted Pyramid

Place square grids centered on the same board origin. Grid pitch equals one card-face width, so neighboring cells touch without gaps and larger grids overlap the inner layers' card footprints. Layer card counts are 1, 4, 9, 16, 25, 36, 49, and 61. The 61-card outer layer occupies 61 of its 64 square-grid positions. Each later layer is visually above earlier layers and supplies their coverage links. This gives 201 total tiles and a deterministic center-to-edge silhouette.

### Sheep Mode

Place the left and right full-cover stacks outside the central layout. Within the center, reserve the upper 7x2 and lower 7x4 cell regions; no Sheep-mode tile may appear outside these regions except for the two side stacks. Build each region bottom-up: at least one seeded pyramid or small-pyramid motif, seed-randomized intermediate cards, then at least two full aligned grid layers. Allocate any remaining tiles as intermediate cards within the two reserved regions, preserving a total of exactly 270 tiles. The allocation and positions are seed-deterministic.

For the shared pyramid motif, adjacent base tiles have no gap. The upper tile is centered on the base footprint. Coverage is derived from actual tile-footprint overlap, with explicit parent IDs retained in the generated tile data so selection behavior does not depend on visual color styling.

## Implementation Approach

1. **Independent layout strategies with shared geometry helpers (recommended).** Keep the random generator stable, add separate deterministic inverted-pyramid and Sheep-mode generators, and share helpers for tile placement, footprint overlap, and coverage links. This keeps layout-specific rules easy to reason about and test.
2. **One generic layout-recipe interpreter.** Express every layout as a data recipe consumed by one generator. This is extensible but introduces a new abstraction before there are enough layouts to justify it.
3. **Extend the current random generator with layout conditionals.** This has the smallest initial diff but mixes unrelated placement rules and increases the chance of changing existing seeded random boards.

## State and Compatibility

- Add a second-level layout identifier separate from the existing Basic/second-level mode distinction.
- Store the selected layout identifier with the run and history record. Existing history records without a layout remain readable as the current fully-random layout.
- Increment the generator version for new layouts. Keep the fully-random path's random-number consumption and output stable; versioning records the algorithm contract for newly generated boards.
- Keep current tool inventory, undo, shuffle, store-to-board, revive, win/loss, and tile-color behavior unchanged.

## Acceptance Criteria

- The home screen leaves Basic intact and exposes exactly the three second-level choices.
- Fully random still creates 270 tiles and remains deterministic for the same seed/version.
- Inverted pyramid has exactly 201 tiles with counts `1,4,9,16,25,36,49,61`; its outer 61-card layer is above and covers inner layers.
- Sheep mode has exactly 270 tiles, two side stacks of 10, and all other tiles are inside the two specified central regions.
- Each Sheep-mode central region has at least two full aligned grid layers and starts with a large- or small-pyramid structure; remaining counts are filled within those regions.
- Large-pyramid tile occupancy falls between 8% and 25% of the selected board total. Small-pyramid placement follows the seeded first-8%-then-fallback rule.
- A repeated pyramid motif contains either 2 or 3 vertically repeated units and has correct overlap/selection transitions at each unit.
- Same layout, seed, and generator version produce identical tile types, positions, and coverage. Different layouts with the same seed remain distinguishable in history.
- Existing basic-level, tool, tray, result, and color tests continue to pass.

## Risks and Boundaries

- Dense layers can make visual depth hard to read. The 8px side-stack offset and ordinary card borders must remain visible at desktop and mobile widths.
- Geometry overlap, not just tile centers, determines coverage for pyramid motifs. Tests must exercise partial overlap and uncovering.
- The design does not add new power-ups, change tile counts for the existing random option, alter ad rules, or change the basic level.
