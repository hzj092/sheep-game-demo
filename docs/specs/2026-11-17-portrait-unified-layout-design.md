# Design: Unified Portrait Game Layout

## Status

User-approved layout requirements; implementation plan follows. This document specifies UI layout only and does not change game rules, tile generation, ads, or persistence behavior.

## Goal

Use one portrait, single-column composition on desktop and Android mobile browsers. The page must fit the available viewport without horizontal or vertical page scrolling, while keeping the tile board dominant and all game controls visible.

## Confirmed Requirements

- Use the same single-column layout at every breakpoint. Center the application on desktop with a maximum width of approximately 520 CSS pixels; use the available width on mobile.
- Fit both home and gameplay views within the available viewport height and width. Prevent document-level horizontal and vertical scrolling, including on narrow phone screens.
- Preserve the home screen's two entries: Basic and Level 2. Keep the three Level 2 layouts (random, inverted pyramid, Sheep mode), but show them as vertically stacked, easy-to-tap choices.
- Arrange gameplay vertically in this order: level information and progress, tile board, seven-slot tray, and three tools.
- Give the board most of the available gameplay area. Keep the tray above the tools and never overlay the board with the tray or tool controls.
- Show Undo, Store, and Shuffle in one compact horizontal row. Each control is a square button with a visible name/icon and a quantity badge at its upper-right corner.
- Preserve existing game behavior and content, including seeds, tile colors, tool/ad behavior, results, and run history.

## Layout

### Home

```text
┌──────────────────────────┐
│ Brand                    │
│ Select level             │
│ [ Basic                 ]│
│ [ Level 2               ]│
│   [ Random              ]│
│   [ Inverted pyramid    ]│
│   [ Sheep mode          ]│
│ Local run count/status   │
└──────────────────────────┘
```

Keep the existing two entry points. The Level 2 entry contains three full-width vertical layout choices. Reduce header and inter-section spacing before reducing text readability or touch targets.

### Gameplay

```text
┌──────────────────────────┐
│ Back          Seed  Restart│
│ Level title / cleared     │
│ Progress                  │
│ ┌──────────────────────┐ │
│ │                      │ │
│ │    dominant board    │ │
│ │                      │ │
│ └──────────────────────┘ │
│ Tray count                │
│ [ ][ ][ ][ ][ ][ ][ ]    │
│   [Undo] [Store] [Shuffle]│
└──────────────────────────┘
```

Use a single centered column capped near 520px on desktop and full available width on mobile. The board receives the flexible remaining height after compact fixed-height header, tray, and tool regions. Keep the board centered and scale its footprint and tile faces down as needed; controls stay outside the board. Respect mobile safe-area insets and dynamic viewport height so browser chrome changes do not introduce page scrolling.

Each tool has a stable square hit target, an icon and short visible label, and a top-right quantity badge. Use the existing per-tool ad count in its accessible label and retain the current click behavior. Result and ad dialogs remain within the viewport.

## Responsive and Interaction Rules

- No breakpoint switches back to a two-column desktop game layout.
- Use `100dvh` with a `100vh` fallback and safe-area-aware insets. The outer application is a viewport-sized layout with overflow contained; the board is the shrinkable region (`min-height: 0`).
- Keep all controls and headings in normal layout flow. No sticky/fixed tray or tools may cover tiles.
- Maintain a minimum 44 CSS-pixel interactive target for home choices and tool buttons where viewport constraints permit; if the narrowest supported viewport makes every constraint impossible, prioritize no page scrolling, board visibility, and non-overlapping controls, and document the resulting compact sizing.
- Ensure icon-only meanings remain available through visible labels and accessible names, including touch devices without hover tooltips.
- On small heights, first tighten decorative spacing and board size. Do not hide an entry, tray slot, tool, or result action.

## Implementation Approach

1. **Viewport-constrained grid (recommended).** Refactor the application shell and gameplay region into single-column CSS grid/flex layouts. Let the board consume the remaining height and size its tile coordinates relative to its contained frame. This preserves the existing components and avoids fixed overlays.
2. **Whole-page transform scaling.** Scale a fixed desktop canvas to fit each viewport. This can keep proportions but makes touch targets and text uncomfortably small and complicates browser safe areas.
3. **Scrollable single column.** Use the same order but allow vertical scrolling when controls do not fit. This is simpler, but directly conflicts with the confirmed no-scroll requirement.

Choose approach 1. Apply the same layout model to home and gameplay, with a 520px maximum content width and viewport-safe sizing.

## Acceptance Criteria

- At 320×568, 360×640, 390×844, and a desktop viewport (1366×768), both the home screen and gameplay screen have no horizontal or vertical document scrolling.
- Desktop uses a centered column no wider than approximately 520px; mobile uses the available viewport width without clipping content.
- Home displays exactly the Basic entry and Level 2 entry; Level 2 offers all three layout choices vertically, with usable tap targets.
- Gameplay order is level/progress, board, seven-slot tray, tools. The board occupies the largest flexible region; tray and tools do not overlap any tile.
- All seven tray positions and all three square tool buttons with quantity badges are visible simultaneously.
- Tool names, icons, counts, ad eligibility, and existing actions remain correct. Results and simulated-ad dialogs fit the viewport.
- Existing unit tests pass. Chrome screenshots and DOM measurements verify the four target viewport sizes, document scroll dimensions, board/control bounds, and key touch targets.

## Risks and Boundaries

- A 270-tile board on a short viewport forces a smaller tile footprint. The layout must preserve spatial relationships and hit targets without scrolling; if the board's generated geometry itself cannot fit, implementation must show that measured limitation rather than silently clip tiles.
- Mobile browsers vary in dynamic viewport reporting and safe-area behavior. Verify in Chrome at the target viewports and use `dvh` plus safe-area insets.
- This work does not alter game rules, layout generation, the board's hit-testing/coverage algorithms, tool limits, ad simulation, or saved records.
