# Board Hover Feedback

## What this feature does
- Highlights the isometric tile currently under the cursor by rendering the `highlight_move.png` overlay.

## Why it exists (rule source / manual reference)
- UI affordance only. This is not a rules-engine concept and is not specified in `docs/Taktik_Manual_EN.md`.

## Constraints
- Purely visual; must not mutate game state or engine data.
- Must respect the current pan/zoom transform applied by the viewport.
- Must not interfere with existing tile highlights or unit rendering order.
- Hover feedback uses pointer tracking to place a highlight overlay; the base tile is no longer tinted.
- Tile images are explicitly non-draggable to avoid interrupting viewport panning.

## Edge cases
- Cursor outside the board bounds clears the hover highlight.
- Hover remains visible during panning unless the pointer leaves the board.

## How to test it manually
1. Run `npm run dev`.
2. Move the mouse across the board; the tile under the cursor should tint.
3. Move the cursor off the board; the highlight should disappear.
4. Click-and-drag to pan; hover tint should not flicker during the drag.
