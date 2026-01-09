# Codex Instructions — Isometric MVP Board (Render + Click + Move Highlights)

## Goal

Implement an MVP isometric board in Next.js + React + TypeScript that can:

1. Render a 20×30 grid in isometric projection using bitmap PNG assets.
2. Render a few units (bitmaps) on tiles.
3. Support click/tap interactions:
   - Click a unit to select it, then show highlight tiles for that unit’s possible moves.
   - Click a highlighted tile to move the selected unit there.
4. Support pan/zoom by transforming a single container (no per-tile transforms).
5. Keep rules/UI separation: the engine computes legal moves purely in grid coords; the UI projects those positions to screen space and draws bitmaps.

## Hard constraints

- All art assets must be PNG bitmaps.
- No external “isometric engine library.”
- Engine logic must remain deterministic and UI-agnostic.
- Input must be mobile-first (tap works; mouse works).

---

## Deliverables

### 1) Engine (pure)

Create under `lib/engine/`:

- `types.ts`
  - `GridPos { x: number; y: number }`
  - `Unit { id: string; owner: 'A' | 'D'; kind: 'infantry' | 'mech' | 'special'; move: number; pos: GridPos }`
  - `Terrain` type (optional; MVP can stay plain)
  - `GameState { width: 20; height: 30; units: Unit[]; blocked?: Set<string> }`

- `movement.ts`
  - `getMoveRange(state, unitId): GridPos[]`
  - Movement rules:
    * 8-directional (Chebyshev distance / BFS cost=1)
    * Disallow moving off-board.
    * (Recommended) disallow landing on occupied tiles.
  - Purely functional: consumes state, produces positions.

- `selectors.ts`
  - Helpers such as `posKey({x,y}) => "x,y"`, `inBounds(pos, w, h)`, `unitAt(pos, units)`, etc.

### 2) UI projection and hit testing

Create under `lib/ui/`:

- `iso.ts`
  - Constants:
    * `TILE_W = 128` (or 96; choose one and use it consistently)
    * `TILE_H = 64`
  - `gridToScreen({x,y}) → { sx, sy }` using `sx = (x - y) * (TILE_W/2)` and `sy = (x + y) * (TILE_H/2)`
  - `screenToGrid(sx, sy)` is the exact inverse:
    ```ts
    const fx = sx / (TILE_W / 2);
    const fy = sy / (TILE_H / 2);
    const x = (fy + fx) / 2;
    const y = (fy - fx) / 2;
    return { x: Math.round(x), y: Math.round(y) };
    ```
  - Ensure the inverse runs on board-local coordinates (after pan/zoom removed).

### 3) Assets (bitmaps)

Under `public/assets/` provide:

- `tiles/ground.png`
- `tiles/highlight_move.png` — the key translucent diamond highlight the same size as `ground.png`.
- `units/infantry.png`
- `units/mech.png`

If real art is unavailable, add `scripts/gen_placeholders.mjs` that uses `pngjs` (or similar) to generate:
- A diamond-shaped ground tile.
- A translucent cyan/green highlight diamond (`highlight_move.png`).
- Simple unit icons (circle/rect) with transparent background.

Add `npm run gen:assets` to run the placeholder generator.

### 4) Board rendering components

- `components/BoardViewport.tsx`
  - Manages `panX`, `panY`, and `zoom`.
  - Applies `transform: translate(panX, panY) scale(zoom)` to one inner container.
  - Handles pointer drag for panning and wheel/pinch for zoom (wheel + drag is MVP minimum).

- `components/IsometricBoard.tsx`
  - Receives `state`, `selectedUnitId`, `moveRange`.
  - Renders three DOM layers (in order): tiles, highlights (pointer-events: none), units.
  - Position elements absolutely inside a relative board container, offsetting each tile by `originX`/`originY` so the board is centered.
  - Compute `sx/sy` via `gridToScreen` and place `<img src="/assets/tiles/ground.png" style={{ left: originX + sx, top: originY + sy }} />`.
  - Render highlights for each entry in `moveRange`.
  - Use `zIndex = x + y` for tiles/highlights and `zIndex = x + y + 1000` for units.

### 5) Click detection (critical)

Inside `IsometricBoard`:

1. On pointer down/up (click), obtain board-local coordinates:
   - `const rect = boardInnerRef.current?.getBoundingClientRect()`
   - `localX = (clientX - rect.left - panX) / zoom`
   - `localY = (clientY - rect.top - panY) / zoom`
2. Convert to grid with `screenToGrid(localX - originX, localY - originY)` (rounding to nearest tile).
3. Validate bounds.
4. Interaction priority:
   - If clicking a tile with a unit → select that unit.
   - Else if a unit is selected and clicked tile is in `moveRange` → move it there.
   - Else clear selection.

Rounding-based tile picking is acceptable; no pixel-perfect hit testing required.

---

## Highlight magic

Highlights must remain bitmap-only. Use `highlight_move.png` and drive visibility with a radial sweep:

- Compute Manhattan distance from the selected unit to each highlight tile.
- Animate a sweep radius that expands and contracts from 0 → max distance → 0, with a short hold at the outer edge.
- Fade tiles in by distance: opacity ramps from 0 to 1 as the sweep passes their ring.
- No per-tile scale, glow, blur, or drop-shadow effects.

You may optionally render a glow variant `highlight_move_glow.png` behind the main highlight (`opacity: 0.6` glow layer, `opacity: 0.9` base layer). Both remain PNGs.

---

## MVP state + sample units

In `app/page.tsx` (or a small store):

- Board dimensions: 20×30.
- Place 2–4 units (combinations of infantry/mech/special).
- Movement values: infantry 2, mech 4, special 3.
- When a unit is selected, compute `moveRange = getMoveRange(state, selectedUnitId)`.
- Moving updates the unit’s pos in the pure reducer.

---

## Definition of Done

- Board renders as an isometric 20×30 grid using PNG tiles.
- Units render as PNGs aligned to tile centers.
- Tapping/clicking a unit selects it.
- Move highlights appear as a radial sweep of PNG diamonds (tiles fade in from 0 opacity by ring).
- Tapping/clicking a highlighted tile moves the unit.
- Tapping/clicking an empty tile clears selection.
- Pan/zoom works via transforming one container.

---

## Notes

- Avoid re-rendering the entire board on every pointer move; only update viewport pan/zoom state.
- Keep `gridToScreen` and `screenToGrid` together in one file and unit-test both directions.
- Engine outputs `GridPos[]`; UI interprets how to draw highlights.
*** End Patch_com##**
