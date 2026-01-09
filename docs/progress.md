# Progress Log

This file is a running, append-only narrative of project milestones.
Each entry captures what the system could do **before**, what it can do **now**, and what the **next** logical step is.

---

## 2025-12-25 — Repository audit + initial documentation baseline

### BEFORE
- The repo had the manual and some supporting docs, but no engine/system documentation describing the implemented rules, data model, phases, or card handling.
- The engine/UI boundary was only discoverable by reading code.

### NOW
Implemented (from code audit):
- Deterministic, UI-agnostic rules engine as a pure reducer: `lib/engine/reducer.ts`.
- Explicit phase model with a fixed phase order (`TURN_START → … → END_TURN`) and a `NEXT_PHASE` action.
- Units on a 20×30 grid with Manhattan-distance movement; max 5 unit moves per turn; per-unit `hasMoved` tracking.
- Attacks with Manhattan-distance range, a deterministic d6 roll, and a simple HIT/MISS resolution; win condition is annihilation (one player has no units).
- Seeded RNG (`rngSeed`) for both deck shuffling and dice rolls.
- Card system with:
  - `pendingCard` from draws (bonus or targeted malus),
  - auto-resolution for untargeted malus cards,
  - an “effects” layer (hooks like `modifyMovement`, `canMoveUnit`, `modifyAttackRoll`),
  - up to 6 stored bonus cards (stored but not playable yet).
- A placeholder Next.js + MUI UI that can drive the reducer locally: grid board, card panel, phase buttons, and a small rolling log.
- Lint-clean UI patterns (no `setState` directly in effects; no mutable loop vars in JSX) to keep `npm run lint` passing.

Partially implemented / stubs:
- “Initial tactical deck” exists in state (`tacticalDeck`, `selectedTacticalDeck`) but has no selection flow.
- Stored bonus cards are tracked (`storedBonuses`) but there is no action/UI to play them.
- Some actions are not phase-gated in the reducer (e.g., `DRAW_CARD`, `PLAY_CARD`, `STORE_BONUS`).
- Unit “damage” is stubbed (`isUnitDamaged: () => false`), so any “repair/restore” style effects are not representable yet.

Missing (vs `docs/Taktik_Manual_EN.md`):
- Manual-aligned unit movement values and combat resolution (current unit stats are placeholders).
- Manual-aligned card cancellation semantics (manual: cancel 1 malus; current: reaction removes all opponent malus effects).
- Manual-aligned “Enemy Disinformation” targeting (manual: opponent chooses; current: active player selects an enemy unit).
- End-of-turn shuffle rule (manual: shuffle at end; current: only shuffles when refilling an empty deck).
- Scenario/mission victory conditions, terrain/LOS concepts, and richer combat rules.

### NEXT
- Make the turn flow enforceable in-engine (phase-gate `DRAW_CARD`/`PLAY_CARD`/`STORE_BONUS`, and align phases with the manual’s “turn summary”).
- Implement playing stored bonus cards and a clear “reaction/cancel malus” pipeline.
- Replace placeholder unit stats with manual-derived movement/combat rules, then add at least one non-annihilation victory condition path.

### Known limitations / TODOs
- Single-client “hotseat” UI: the same browser controls both players; no networking/auth.
- No terrain, no unit HP/damage model, no ranged fire mechanics beyond a single hit threshold.
- Tactic cards exist as a type, but none are implemented in the deck lists.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`, `docs/cards-system.md`, `docs/architecture.md`, `docs/README.md`
- Engine boundary: `lib/engine/index.ts`
- UI: `app/page.tsx`, `lib/ui/Board.tsx`

---

## 2025-12-26 — Isometric board conversion (MVP)

### BEFORE
- The board rendered as a top-down orthographic grid with text labels.
- Move highlights were grid-colored tiles only in the old `lib/ui/Board.tsx`.
- No bitmap assets or isometric projection utilities existed.

### NOW
- Added isometric projection utilities (`lib/ui/iso.ts`) and an isometric renderer (`components/IsometricBoard.tsx`) with tile, highlight, and unit layers.
- Added `components/BoardViewport.tsx` to provide pan/zoom via a single transformed container (MVP wheel + drag).
- Introduced deterministic move-range helper (`lib/engine/movement.ts`) and shared grid helpers (`lib/engine/selectors.ts`).
- Updated movement legality to 8-direction (Chebyshev distance) and moved board dimensions into `GameState` (`boardWidth`, `boardHeight`).
- Added placeholder PNG assets and a generator script (`scripts/gen_placeholders.mjs`) wired to `npm run gen:assets`.
- Updated the main UI to render the isometric board and use move-range highlights for click-to-move.

### NEXT
- Align move-range UI with attack mode (e.g., show attack ranges or separate highlight layers).
- Add unit hover/selection feedback that matches the isometric visual style.
- Implement proper card/phase gating in the reducer so the turn flow matches the manual.

### Known limitations / TODOs
- Placeholder art only; replace with final assets later.
- Click handling does not distinguish between pan and click; short drags may still register as clicks.
- Movement rules now allow diagonals; attack rules still use Manhattan distance.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`, `docs/architecture.md`, `docs/README.md`
- Engine: `lib/engine/gameState.ts`, `lib/engine/reducer.ts`, `lib/engine/movement.ts`, `lib/engine/selectors.ts`
- UI: `app/page.tsx`, `components/BoardViewport.tsx`, `components/IsometricBoard.tsx`, `lib/ui/iso.ts`, `app/globals.css`
- Assets/tools: `scripts/gen_placeholders.mjs`, `public/assets/tiles/ground.png`, `public/assets/tiles/highlight_move.png`, `public/assets/units/infantry.png`, `public/assets/units/mech.png`, `public/assets/units/special.png`, `package.json`, `package-lock.json`

---

## 2025-12-27 — Fix isometric click handling and drag stuck states

### BEFORE
- Pointer capture in the viewport could leave the mouse “stuck” when a drag didn’t end cleanly.
- Click-to-select/move was unreliable because pointer-up events were handled inside the board layer while capture lived on the viewport.

### NOW
- Click handling is centralized in `BoardViewport` with a drag threshold to differentiate pan from click.
- Pointer cancel/leave now safely releases capture to avoid stuck dragging.
- Isometric hit testing now runs on viewport clicks and reliably dispatches selection/move actions.

### NEXT
- Add a small drag distance indicator or cursor state (grab/grabbing) for clearer pan affordance.
- Consider suppressing clicks entirely after a drag and adding a short click debounce for touch.

### Known limitations / TODOs
- Attack-mode interactions still rely on grid clicks without explicit isometric feedback.

### Files touched
- Docs: `docs/progress.md`
- UI: `components/BoardViewport.tsx`, `components/IsometricBoard.tsx`, `app/page.tsx`, `lib/ui/iso.ts`

---

## 2025-12-27 — Remove accidental NestJS template

### BEFORE
- `vercel init` with the NestJS preset added `nestjs/` (and a `nextjs/` template folder), which surfaced lint errors and unwanted NestJS references in the repo.

### NOW
- Removed the accidental `nestjs/` and `nextjs/` template directories to restore a clean Next.js-only codebase.

### NEXT
- Re-run lint/build after any other scaffold changes to ensure the repo stays clean.

### Known limitations / TODOs
- None.

### Files touched
- Docs: `docs/progress.md`
- Cleanup: removed `nestjs/`, `nextjs/`

---

## 2025-12-27 — Remove Vercel CLI dependency

### BEFORE
- `package.json` included the `vercel` dev dependency from the accidental `vercel init`, which pulled in `@vercel/nestjs` and other framework references in `package-lock.json`.

### NOW
- Removed the `vercel` dev dependency and regenerated the lockfile via `npm uninstall vercel`.

### NEXT
- Keep the dependency list focused on the Next.js app and add Vercel CLI only if explicitly needed for deployment workflows.

### Known limitations / TODOs
- None.

### Files touched
- Docs: `docs/progress.md`
- Dependencies: `package.json`, `package-lock.json`

---

## 2025-12-26 — Clarify isometric MVP instructions

### BEFORE
- `docs/isometric.md` used inconsistent bold/heading markup that made the steps hard to follow and challenged tooling expectations.

### NOW
- Rewrote `docs/isometric.md` into clean markdown with standard headings, numbered lists, code blocks, and explicit sections for engine requirements, UI projection, assets, rendering components, click handling, highlights, sample state, and the definition of done.
- Document now clearly references the required files, helper utilities, and highlight animation snippet.

### NEXT
- Implement the isometric board MVP described herein, starting with the engine movement helpers and UI projection utilities.

### Known limitations / TODOs
- The new instructions do not include implementation status; assets and components still need to be created.

### Files touched
- Docs: `docs/isometric.md`

---

## 2025-12-27 — Player-specific unit sprites

### BEFORE
- Units used a single sprite per unit type (`infantry.png`, `mech.png`, `special.png`) regardless of owner.

### NOW
- Unit sprites are now selected per player: `PLAYER_A` uses the `*_a.png` variants and `PLAYER_B` uses the `*_b.png` variants for light, mechanized, and special units.

### NEXT
- Confirm sprite sizing/positioning in the isometric view and tune any per-faction offsets if needed.

### Known limitations / TODOs
- Unit art is still a single size; there is no scaling or per-unit visual differentiation beyond owner color.

### Files touched
- Docs: `docs/progress.md`
- UI: `components/IsometricBoard.tsx`

## 2026-01-05 — Centered opening deployment

### BEFORE
- Units started in the upper-left corner (two rows near coordinates 2–6), so the start-of-game fight was always offset from the board center despite the manual describing central engagements.
- Terrain avoidance still ran, but the corner anchors limited the interesting tactical terrain the neutral board could offer at turn 1.

### NOW
- Spawn anchors now target the central columns (centerX ± 1) across two adjacent rows, and each anchor still snaps to the nearest clear tile, keeping the road/river prohibition intact while clustering Players A + B near the middle of the tactical board.
- Both armies therefore begin adjacent to the board center, better matching the idea of a central engagement while still respecting deterministic placement and terrain rules.

### NEXT
- Investigate whether different scenarios should shift those center anchors or whether pre-game terrain hints can nudge the snapped positions away from each other without breaking determinism.

### Known limitations / TODOs
- If the very center column is blocked by dense roads/rivers, the nearest clear-cell scan may push units outward, which can still leave both factions adjacent; future work could add a small offset for symmetry or per-side facing.

-### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`
- Engine: `src/lib/engine/reducer.ts`

## 2026-01-06 — Configurable roster plus center lift

### BEFORE
- Each faction’s opening roster was hard-coded to three units (“A1–A3”, “B1–B3”) with prescribed types and row/column preferences, so expansion to different unit mixes required code edits and could not react to a simple configuration change.
- The centering logic also assumed exactly three spawn columns per row, limiting later adjustments when the roster or map changed.

### NOW
- Added `initialUnitComposition` in `src/lib/settings.ts` to describe how many `INFANTRY`, `VEHICLE`, and `SPECIAL` units each player may field, letting the reducer generate IDs and stats from that map while keeping the deterministic stats-per-type table.
- The reducer now builds each player’s roster from that configuration, generates center-column anchors (`centerX ± offsets`), and still snaps every unit to the nearest non-road/non-river tile, so the centre deployment and terrain avoidance rules scale automatically with the configured roster.

### NEXT
- Explore whether scenario presets should swap `initialUnitComposition` or if an override mechanism is needed, and ensure future cards/rules reference the new, dynamic unit IDs.

### Known limitations / TODOs
- No validation yet that `initialUnitComposition` sums to the same totals per player, so anything from zero to dozens of units is technically allowed and may cause overlapping `findNearestClearCell` scans to re-use the center column repeatedly.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`
- Engine: `src/lib/engine/reducer.ts`, `src/lib/settings.ts`

## 2026-01-07 — Placement distance guard

### BEFORE
- Centered placement clustered opposing rows right beside each other (one row apart) even though future scenarios may call for more spacing, and there was no shared config for how close the enemy could start.

### NOW
- Added `bootstrapUnitPlacement.enemyDistance` in `src/lib/settings.ts`, and the reducer now tries to separate the anchor rows by that many cells before the nearest-clear-cell adjustment so the opening lines respect a single source of truth for enemy spacing.

### NEXT
- Review whether later logic should use the same `enemyDistance` to enforce column spacing or to adjust markup for specific missions (e.g., fanning out across the map edges).

### Known limitations / TODOs
- Clamping when the centre is near the board edges can still collapse the spacing below `enemyDistance`; a future refinement could add a fallback shift or ensure map height accommodates the desired distance before placement.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`
- Engine: `src/lib/engine/reducer.ts`, `src/lib/settings.ts`

## 2026-01-08 — Enforce unit orientation

### BEFORE
- Row anchors could swap sides when the board edges limited spacing, so Player A sometimes spawned behind Player B even though the intent is fixed facing.

### NOW
- Anchor rows now accept the desired `enemyDistance`, clamp to the board bounds, and force Player A onto the northern row and Player B onto the southern row before the nearest-clear-cell correction, keeping facing consistent across scenarios.

### NEXT
- Decide if column/diagonal preferences also need a fixed facing or if per-scenario overrides should rotate the entire formation while keeping the anchor order intact.

### Known limitations / TODOs
- When the board height is smaller than `enemyDistance`, the rows collapse into the closest available pair, so the facing enforcement still relies on a tall enough map.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`
- Engine: `src/lib/engine/reducer.ts`

---

## 2026-01-04 — Guard terrain path bias against null direction

### BEFORE
- `walkPath` unconditionally dereferenced `lastDir` when applying `biasStraight`, which broke TypeScript strict null checks even though runtime generation usually has a prior direction.

### NOW
- The terrain walker snapshots `lastDir` before using it, so continuing straight only happens when a direction exists and the compile error disappears without behavioral changes.
- The snapshot also carries an explicit `(typeof DIRECTIONS)[number]` type, which satisfies TypeScript’s inference while leaving the deterministic bias logic untouched.

### NEXT
- Scan other strict-null warnings in the terrain/codegen helpers to keep the generator TypeScript-clean.

### Known limitations / TODOs
- The terrain generator still randomly chooses start points on the map edge, so the same road/rivers may look asymmetrical; separate seeding for rivers might be a future polish.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`
- Engine: `src/lib/engine/terrain.ts`

---

## 2026-01-04 — Tie bridge budget to terrain params

### BEFORE
- `generateTerrainNetworks()` gained a `maxBridges` option but no caller provided a value, so TypeScript flagged the new argument and the docs never explained how to tune bridge counts.

### NOW
- `initialTerrainParams` exposes a typed `maxBridges` knob and the reducer forwards it into `generateTerrainNetworks()`, so terrain generation can be configured from one place and the TypeScript errors disappear.

### NEXT
- Document acceptable ranges or UI controls for `maxBridges`, and consider adding warnings when budget limits are incompatible with board size.

### Known limitations / TODOs
- Very low budgets still rely on the random bridge selector working quickly; we may want to fall back to a deterministic bridge if a positive budget is provided but no candidate is found after a bounded number of tries.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`, `docs/roads-rivers.md`
- Engine: `src/lib/engine/terrain.ts`, `src/lib/engine/reducer.ts`, `src/lib/engine/gameState.ts`, `src/lib/settings.ts`


## 2025-12-27 — Adjust unit centering on tiles

### BEFORE
- Unit sprites were anchored exactly at the grid center, which made the new art appear slightly high relative to the tiles.

### NOW
- Added a small vertical offset so unit sprites sit more naturally centered over the isometric tiles.

### NEXT
- Recheck positioning once any additional unit sizes or animations are introduced.

### Known limitations / TODOs
- Offsets are global (shared by all unit types) and may need per-unit tuning later.

### Files touched
- Docs: `docs/progress.md`
- UI: `components/IsometricBoard.tsx`

---

## 2026-01-01 — Clarify Game UX instructions

### BEFORE
- `docs/implementation/game_ux.md` mixed heavy bolding, inconsistent headings, and stray spacing that broke Markdown tooling and made the layout requirements harder to parse.

### NOW
- Rewrote the file into standard Markdown with clear headings, lists, and inline code blocks that describe the command bar, board viewport, overlays, mobile rules, required state flags, component responsibilities, forbidden patterns, and validation checklist.

### NEXT
- Tie the clarified UX rules back into the UI implementation by ensuring each component derives state from the required engine flags and mobile layouts respect the bottom-sheet model.

### Known limitations / TODOs
- The entry only documents formatting cleanup; no implementation verification is performed yet.

### Files touched
- Docs: `docs/progress.md`, `docs/implementation/game_ux.md`

---

## 2026-01-01 — Resolve TypeScript compile blockers

### BEFORE
- `npm run tsc` failed with null-safety errors in `components/BoardViewport.tsx`, `lib/engine/reducer.ts`, and `lib/ui/CardPanel.tsx`, preventing any builds from completing.

### NOW
- Added a wheel listener closure that retains a non-null viewport reference, re-checked for `lastRoll` before using it, and guarded tactic targeting confirmation so the UI only compares `count` when the spec really describes units; `tsc` now succeeds.

### NEXT
- Keep TypeScript happy as new features land and revisit the action-targeting UX if we introduce new targeting spec variations in the cards system.

### Known limitations / TODOs
- None beyond the new guard logic itself; no behavior changes were required.

### Files touched
- UI: `components/BoardViewport.tsx`, `lib/ui/CardPanel.tsx`
- Engine: `lib/engine/reducer.ts`
- Docs: `docs/progress.md`

## 2026-01-01 — Clarify Game UX instructions

### BEFORE
- `docs/implementation/game_ux.md` mixed heavy bolding, inconsistent headings, and stray spacing that broke Markdown tooling and made the layout requirements harder to parse.

### NOW
- Rewrote the file into standard Markdown with clear headings, lists, and inline code blocks that describe the command bar, board viewport, overlays, mobile rules, required state flags, component responsibilities, forbidden patterns, and validation checklist.

### NEXT
- Tie the clarified UX rules back into the UI implementation by ensuring each component derives state from the required engine flags and mobile layouts respect the bottom-sheet model.

### Known limitations / TODOs
- The entry only documents formatting cleanup; no implementation verification is performed yet.

### Files touched
- Docs: `docs/progress.md`, `docs/implementation/game_ux.md`

## 2026-01-01 — Board hover roll-over feedback

### BEFORE
- The isometric board had no hover feedback; tiles only changed when a move highlight or unit selection was present.

### NOW
- Added a rollover highlight that tints the tile under the cursor without touching game state.
- Hover detection is viewport-aware (pan/zoom) and clears when the pointer leaves the board.

### NEXT
- Consider adding attack-range hover previews or contextual tooltips for units/tiles.

### Known limitations / TODOs
- Hover feedback is intentionally disabled while panning to avoid visual noise.

---

## 2026-01-07 — Rebuild terrain tiles from square tops + beveled base

### BEFORE
- Terrain tiles projected a mix of older SVGs (some trimmed/masked) onto the isometric face, and the base slab had no bevel edge.
- The generator relied on trim-based rasterization, which could shrink square tops and create edge mismatches.

### NOW
- Terrain tiles now use the new 100×100mm square `base_0*-*.svg` tops, projected directly (no trim) so the artwork covers the full top face.
- A shared extruded-base helper draws the side faces plus a beveled top edge, keeping all terrain tiles visually consistent.

### NEXT
- Run the generator and visually validate the new beveled tops across the board at typical zoom to confirm the square art aligns cleanly with roads/rivers.

### Known limitations / TODOs
- Tile generation has not been re-run in this step, so regenerated PNGs still need to be reviewed after `node scripts/gen_terrain_tiles.mjs`.

### Files touched
- Docs: `docs/progress.md`, `docs/terrain-tiles.md`
- Generator: `scripts/gen_terrain_tiles.mjs`

## 2026-01-07 — Remove registry marker overlay

### BEFORE
- The isometric board rendered a `registry.png` marker over the center tile so unit offsets could be aligned via `temp/map.png`.

### NOW
- The registry marker is gone; the board now renders only the tiles, highlights, and units that players see in-game.

### NEXT
- If we ever need a debug alignment target again, consider a dev-only toggle that can be flipped on without shipping the asset to players.

### Known limitations / TODOs
- None; the alignment marker was never part of gameplay.

### Files touched
- Docs: `docs/progress.md`
- UI: `src/components/IsometricBoard.tsx`

---

## 2026-01-08 — Add configurable unit layout tweaks

### BEFORE
- Unit sprites sat `TILE_H * 0.3` pixels below their tile centers with no knobs to adjust their alignment or apparent scale, so every atlas refresh required editing the renderer itself.

### NOW
- Added `initialUnitDisplayConfig` to `src/lib/settings.ts` to publish `offsetX`, `offsetY`, and `scale` adjustments that default to zero so the current layout stays unchanged.
- `IsometricBoard` now reads the new config and adds those offsets/scale changes when computing each sprite’s left/top positions and size.

### NEXT
- Surface these tuning values in the dev console or a configuration menu so artists can tweak placements without touching source code.

### Known limitations / TODOs
- The scale tweak multiplies by `1 + value`, so values ≤ -1 still collapse the sprite; consider clamping once we expose the knobs.
- There is no UI to edit the settings yet; edits must still happen in the settings file.

### Files touched
- Config: `src/lib/settings.ts`
- UI: `src/components/IsometricBoard.tsx`
- Docs: `docs/engine.md`, `docs/progress.md`

---

## 2026-01-08 — Support unit-type-specific layout tweaks

### BEFORE
- Every unit type shared the same global offset/scale, so any per-art differences required editing the renderer and risked affecting all units simultaneously.

### NOW
- `initialUnitDisplayConfig` is a per-`UnitType` map in `src/lib/settings.ts`, letting INFANTRY/VEHICLE/SPECIAL each supply their own `offsetX`, `offsetY`, and `scale` adjustments (zeros keep the existing layout).
- `IsometricBoard` uses each unit’s tweak when computing left/top and sprite size, so the renderer can honor the specific offsets while still keeping the engine deterministic.

### NEXT
- Add tooling (console knobs, config screen, or JSON editor) to edit these per-type tweaks without touching source code.

### Known limitations / TODOs
- The tweaks remain handwritten in `settings.ts`; a UI or preset system would make iteration safer.
- Negative scale tweaks still multiply by `1 + value`, so values ≤ -1 collapse the sprite unless the UI guards against them.

### Files touched
- Config: `src/lib/settings.ts`
- UI: `src/components/IsometricBoard.tsx`
- Docs: `docs/engine.md`, `docs/progress.md`

## 2026-01-01 — Fix board hover tracking

### BEFORE
- Hover feedback relied only on pointer-move callbacks and did not always fire in practice, so tiles stayed unchanged.

### NOW
- Added mouse-move/leave fallback handling in the viewport to ensure hover updates fire reliably.

### NEXT
- Verify hover behavior on touch devices and decide whether to add a dedicated touch hover substitute.

### Known limitations / TODOs
- Hover remains disabled while actively panning.

### Files touched
- Docs: `docs/progress.md`, `docs/board-hover.md`
- UI: `components/BoardViewport.tsx`

---

## 2026-01-01 — Use CSS hover tint for tiles

### BEFORE
- The JS-driven hover state did not trigger reliably, so tiles never visibly changed on rollover.

### NOW
- Each tile image applies a CSS hover filter, so the tile under the cursor visibly tints without additional state.

### NEXT
- Confirm the tint strength against final art and decide whether to add a dedicated hover sprite instead of a filter.

### Known limitations / TODOs
- Hover feedback relies on CSS filters; if art direction changes, a separate hover overlay may be preferable.

### Files touched
- Docs: `docs/progress.md`, `docs/board-hover.md`
- UI: `components/IsometricBoard.tsx`, `components/BoardViewport.tsx`, `app/page.tsx`

---

## 2026-01-01 — Restore drag-friendly hover overlay

### BEFORE
- CSS hover on each tile captured pointer interactions, making viewport panning unreliable.

### NOW
- Reverted tiles to non-interactive pointer handling and restored a JS-driven hover overlay so drag/pan works reliably.

### NEXT
- Consider adding a dedicated hover sprite instead of tinting the base tile if art direction requires it.

### Known limitations / TODOs
- Hover updates every mouse move; consider throttling if performance becomes an issue.

### Files touched
- Docs: `docs/progress.md`, `docs/board-hover.md`
- UI: `components/IsometricBoard.tsx`, `components/BoardViewport.tsx`, `app/page.tsx`

---

## 2026-01-01 — Prevent tile drag during viewport pan

### BEFORE
- Tile hover was back, but dragging the board often grabbed the underlying image and stopped panning after a few pixels.

### NOW
- Tile/overlay/unit images are explicitly non-draggable and hover updates are driven by pointer move on the viewport.

### NEXT
- Consider throttling hover updates if pan performance becomes an issue on large boards.

### Known limitations / TODOs
- Hover still runs during panning; if it feels noisy, we can disable hover while dragging.

### Files touched
- Docs: `docs/progress.md`, `docs/board-hover.md`
- UI: `components/BoardViewport.tsx`, `components/IsometricBoard.tsx`, `app/page.tsx`

---

## 2026-01-01 — Restore hover with mousemove (keep drag smooth)

### BEFORE
- Hover tint did not trigger in Chrome on Ubuntu after switching back to the overlay approach.

### NOW
- Hover updates are driven by `mousemove` for mouse pointers and by `pointermove` for touch/pen, while keeping tiles non-draggable.

### NEXT
- If hover still feels inconsistent, consider adding a dedicated hover sprite and throttling updates.

### Known limitations / TODOs
- Hover is disabled during active pan drags to keep the viewport responsive.

### Files touched
- Docs: `docs/progress.md`, `docs/board-hover.md`
- UI: `components/BoardViewport.tsx`

---

## 2026-01-01 — Restore CSS hover with drag suppression

### BEFORE
- Hover and pan regressions persisted due to JS hover state and pointer handling conflicts.

### NOW
- Tile hover is back to a CSS filter and images are explicitly non-draggable to keep panning smooth.

### NEXT
- If hover tint still conflicts with drag in some browsers, add a dedicated hover sprite layer.

### Known limitations / TODOs
- Hover is per-tile CSS and may need a custom sprite for final art.

### Files touched
- Docs: `docs/progress.md`, `docs/board-hover.md`
- UI: `components/IsometricBoard.tsx`, `components/BoardViewport.tsx`, `app/page.tsx`

---

## 2026-01-01 — Fix passive wheel warning in viewport

### BEFORE
- Zoom wheel used React's onWheel handler and logged a passive listener warning when calling preventDefault.

### NOW
- Wheel zoom is attached via a non-passive native listener on the viewport, removing the warning.

### NEXT
- Consider adding zoom limits UI and reset controls once the camera UX is finalized.

### Known limitations / TODOs
- Zoom still uses a fixed step; no smooth zoom curve yet.

### Files touched
- Docs: `docs/progress.md`
- UI: `components/BoardViewport.tsx`

---

## 2026-01-01 — Cursor-anchored zoom to prevent wheel jumps

### BEFORE
- Mouse wheel zoom shifted the board abruptly because scaling was applied around the origin.

### NOW
- Wheel zoom is anchored to the cursor position and uses a smoother exponential scale step to avoid sudden jumps.

### NEXT
- Add zoom reset controls and optional zoom speed settings in the UI.

### Known limitations / TODOs
- Zoom limits are still hard-coded (0.5–2.0).

### Files touched
- Docs: `docs/progress.md`
- UI: `components/BoardViewport.tsx`

---

## 2026-01-01 — Fix pan/zoom ref sync scope

### BEFORE
- A ref sync effect was accidentally placed outside the component, causing a runtime ReferenceError (`pan is not defined`).

### NOW
- Ref sync effects live inside `BoardViewport`, keeping pan/zoom refs in scope.

### NEXT
- Confirm zoom/pan behavior and consider adding tests for camera controls.

### Known limitations / TODOs
- No automated tests for camera interaction yet.

### Files touched
- Docs: `docs/progress.md`
- UI: `components/BoardViewport.tsx`

---

## 2026-01-01 — Show card summary/usage in the UI

### BEFORE
- The card panel only showed card name, kind, and targeting info.

### NOW
- Pending cards and stored bonuses display their `summary` and `usage` text in the card panel.

### NEXT
- Consider adding artwork thumbnails using the new `images` fields for quick visual scanning.

### Known limitations / TODOs
- Card panel still uses text-only layout; no images or formatting beyond captions.

### Files touched
- Docs: `docs/progress.md`, `docs/cards-system.md`
- UI: `lib/ui/CardPanel.tsx`

---

## 2026-01-01 — Reformat tactic cards implementation doc

### BEFORE
- `docs/implementation/Tactics_Cards_Implementation.md` used multiline bold, inconsistent numbering, and inline instructions that made it hard to consume or cite in follow-up work.
- The engine requirements, timing rules, and code snippet were buried in ad-hoc formatting instead of discrete sections.

### NOW
- Rewrote the entire doc into structured sections (overview, reaction windows, engine flow, lifetime, manual examples, hard rules, summary) with standard markdown headings, prose, and a clean `ReactionWindow` type definition block.
- Clarified the mandatory reaction rules and determinism expectations so future implementers can quickly confirm compliance while coding.

### NEXT
- Use this clarified doc to drive the concrete implementation of tactic plays (phase gating and reaction window handling) in the engine.
- Add example tactic data definitions that match the manual entries listed here and document their targeting/constraints.

### Known limitations / TODOs
- Tactic cards still need actual implementations in the engine and UI despite the docs now being explicit about their required behavior.

### Files touched
- Docs: `docs/progress.md`, `docs/implementation/Tactics_Cards_Implementation.md`

---

## 2026-01-01 — Show card art with placeholder fallback

### BEFORE
- Card panel showed only text; new image fields were not displayed.

### NOW
- Pending cards and stored bonuses render thumbnail art using `images.lo` with a fallback to `public/assets/cards/placeholder.png`.

### NEXT
- Consider switching pending cards to use `images.hi` and adding larger previews.

### Known limitations / TODOs
- Placeholder art is generic; replace once final card frames are available.

### Files touched
- Docs: `docs/progress.md`, `docs/cards-system.md`
- UI: `lib/ui/CardPanel.tsx`
- Assets: `public/assets/cards/placeholder.png`
- Tools: `scripts/gen_placeholders.mjs`

---

## 2026-01-01 — Implement tactic cards with reaction windows

### BEFORE
- Tactic cards existed as a type and separate data file, but there was no engine flow to open reaction windows or play tactics.
- Dice resolution applied damage immediately on `ROLL_DICE`, leaving no room for after-roll reactions.
- The UI could not arm or play tactics from the tactical deck.

### NOW
- Added reaction-window handling for tactics (before move, before roll, after roll/before damage) with engine validation and deterministic logging.
- Split attack resolution into `ROLL_DICE` and `RESOLVE_ATTACK` so after-roll reactions (e.g., `Commander's Luck`) can occur.
- Surfaced tactic cards in the UI with an “arm + target + resolve” flow and wired them into movement and attack actions.

### NEXT
- Add per-player tactical deck selection (distinct hands) and a mulligan/selection flow.
- Implement stored bonus card play and align malus cancellation with “cancel 1 malus” rules.
- Expand tactic coverage (e.g., `afterMove`) once additional cards are defined.

### Known limitations / TODOs
- `selectedTacticalDeck` is shared across players; there is no per-player tactical hand yet.
- After-move windows are supported only within the move action and have no dedicated UI.
- Tactic effects currently expire by end of turn only.

### Files touched
- Engine: `lib/engine/gameState.ts`, `lib/engine/reducer.ts`, `lib/engine/cards.ts`
- UI: `app/page.tsx`, `lib/ui/CardPanel.tsx`
- Docs: `docs/progress.md`, `docs/engine.md`, `docs/cards-system.md`, `docs/tactics-cards.md`

---

## 2026-01-01 — Update manual E2E checklist for tactics

### BEFORE
- Manual E2E checklist did not cover tactic reaction windows or the new two-step dice resolution.
- Several UI checks referenced the old grid layout and missing controls.

### NOW
- Rewrote `docs/manual-e2e-test.md` to match the isometric UI and the current tactics flow.
- Added explicit steps for arming tactics in `beforeMove`, `beforeAttackRoll`, and `afterAttackRoll/beforeDamage` windows.

### NEXT
- Add per-player tactical deck selection steps once that flow exists.
- Extend the E2E checklist when stored bonus play is implemented.

### Known limitations / TODOs
- The checklist assumes the current single shared tactical deck and the “Resolve Attack” button flow.

### Files touched
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

---

## 2026-01-01 — Fix pending card targeting state

### BEFORE
- Starting target selection for cards like `Advanced Recon` briefly enabled Confirm/Cancel but the UI immediately reset, making every targeting attempt fail.
- The targeting context effect cleared state whenever the context object changed, so the “Select Targets” action nullified itself.

### NOW
- The targeting cleanup effect now only runs when the pending card changes, so initiating target selection keeps `Confirm/Cancel` enabled while unit selections are made.
- Selecting targets now reliably keeps the targeting context active until the player confirms or cancels.

### NEXT
- Keep monitoring targeting interactions when we add new card types or tactic selection flows.
- Consider extracting a reusable targeting hook if more UI elements need this pattern.

### Known limitations / TODOs
- This fix only affects pending cards (bonus/malus); tactics targeting remains in its own flow.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

---

## 2026-01-01 — Add quick tactics smoke test

### BEFORE
- The manual E2E checklist had only the full tactics section and no quick verification path.

### NOW
- Added a short “Quick Tactics Smoke Test” section at the top to rapidly verify reaction windows and the Commander's Luck reroll.

### NEXT
- Add per-player tactical deck selection steps when that feature is implemented.

### Known limitations / TODOs
- The quick test assumes tactics are available in the shared tactical deck.

### Files touched
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

---

## 2026-01-01 — Store card art assets in public folders

### BEFORE
- `lib/engine/cards.ts` and `lib/engine/cards/tactics.ts` referenced `/assets/cards/hi` and `/lo` images that did not exist in `public/` yet.
- Card art lived only inside `temp` and `temp/resized`, so the UI fell back to the placeholder image.

### NOW
- Hi-res and low-res PNGs for all referenced cards were moved to `public/assets/cards/hi` and `/lo`, matching every file path used in the engine definitions.
- Verified there are no missing references: every `/assets/cards/hi/…` and `/assets/cards/lo/…` used by the code now exists on disk.

### NEXT
- Remove the leftover `ChatGPT Image…` files from `temp` once no longer needed, and consider committing the card art to the repository if licensing allows.

### Known limitations / TODOs
- Temporary source PNGs remain in `temp`/`temp/resized` (they can be deleted after verification).

### Files touched
- Assets: `public/assets/cards/hi/*`, `public/assets/cards/lo/*`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Align isometric unit sizing and anchoring

### BEFORE
- Unit sprites were rendered at a fixed 64×64 size with a hard-coded 10px downward offset.
- Player A/B art had different padding, so sprites appeared slightly misaligned relative to tile centers and to each other.
- Tile-relative sizing was not tied to the isometric grid, making it hard to match the provided `temp/map.png` reference.

### NOW
- Introduced tile-derived sprite sizing (`TILE_W * 0.52`) with per-unit-type scale factors so infantry, vehicles, and special units stay proportionate.
- Anchored sprites to the tile plane with a `TILE_H * 0.3` vertical offset, matching the visual grounding seen in `temp/map.png`.
- Centralized the unit positioning constants inside `IsometricBoard` for easier future tuning.

### NEXT
- Evaluate the raw unit PNGs and crop/clean alpha channels to remove residual padding so the per-type scales can be simplified.
- Re-run the alignment check after swapping in final art to confirm offsets still line up with the isometric grid.

### Known limitations / TODOs
- Current alignment assumes the existing art; heavily padded assets may still need image-level cleanup for perfect centering.

### Files touched
- UI: `components/IsometricBoard.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Add registry marker overlay for unit alignment

### BEFORE
- No visual guide existed to verify unit anchoring against the tile’s viewer-facing corner.
- Aligning sprites relied on eyeballing offsets, which was error-prone.

### NOW
- Added a `registry.png` marker (bottom-center anchor) sized to sit on the tile’s near corner for alignment checks.
- Render the registry marker on the board’s center tile so unit offsets can be validated in-app against `temp/map.png`.

### NEXT
- Hide or toggle the marker via a debug flag once alignment is finalized.
- Provide per-unit debug markers if future art introduces varying baselines.

### Known limitations / TODOs
- Marker is always visible for now; add a UI toggle when no longer needed.

### Files touched
- UI: `components/IsometricBoard.tsx`
- Assets: `public/assets/tiles/registry.png`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Upsize registry marker for precise alignment

### BEFORE
- The registry marker was a small 32×48 PNG, making fine alignment hard when comparing against unit sprites.

### NOW
- Recreated the registry marker as a 1024×1024 PNG with a full-height arrow from the bottom center to the tile’s upper corner, then render it scaled to tile size so subpixel alignment remains crisp.
- Kept the marker on the center tile to validate unit anchors directly in the live board.

### NEXT
- Add a debug toggle to hide/show the marker once alignment is confirmed.

### Known limitations / TODOs
- Always visible until a toggle is added.

### Files touched
- Assets: `public/assets/tiles/registry.png`
- UI: `components/IsometricBoard.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Tactics UI moved to modal/drawer

### BEFORE
- The side panel rendered the full tactics list with verbose metadata at all times, making the UI cluttered.
- Reaction tactics were not visually gated by open reaction windows.

### NOW
- Replaced the tactics list with a compact HUD: TACTICS button with playable badge, open-window label, and armed tactic status.
- Added a responsive tactics modal (Dialog on desktop, Drawer on mobile) that groups cards by reaction window and disables non-playable tactics.
- Targeting flow remains in the side panel with clear “Selecting targets” status and Confirm/Cancel controls.

### NEXT
- Add a debug toggle to hide the tactics modal when no window is open.
- Revisit copy and spacing once final card art is in place.

### Known limitations / TODOs
- The modal is always available when a reaction window is open; there is no tutorial or onboarding for new players.

### Files touched
- UI: `lib/ui/CardPanel.tsx`, `lib/ui/TacticsModal.tsx`, `lib/ui/CardArt.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Update manual E2E steps for tactics modal

### BEFORE
- The E2E checklist referenced the old always-visible tactics list and did not cover the new modal/drawer flow.
- ESC handling for tactic targeting was not documented.

### NOW
- Updated the manual checklist to use the TACTICS HUD + modal/drawer flow, including disabled state when no windows are open.
- Added explicit steps for badge counts, grouped windows, and ESC behavior.

### NEXT
- Expand tests once stored bonus play is implemented.

### Known limitations / TODOs
- The checklist assumes the shared tactical deck model.

### Files touched
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

---

## 2026-01-01 — Add combined cards+tactics regression pass

### BEFORE
- The manual E2E doc had separate sections for cards and tactics but no single quick pass that exercised both in one flow.

### NOW
- Added a short combined walkthrough that covers draw/play, movement tactics, attack tactics, and log verification in one sequence.

### NEXT
- Add a similar combined pass once stored bonus play is implemented.

### Known limitations / TODOs
- The pass assumes the current shared tactical deck and simple annihilation win condition.

### Files touched
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

---

## 2026-01-01 — Apply overlay-first command UI shell

### BEFORE
- The UI used a sticky header plus a persistent side panel layout that competed with the board for space.
- Board height was fixed by `vh` values and collapsed on small screens.
- Cards, tactics, and log were rendered as permanent panels rather than overlays.

### NOW
- Added a fixed-height command bar and made the board fill the remaining viewport height using `calc(100dvh - var(--command-bar-height))`.
- Replaced permanent panels with modal overlays: cards/tactics and log now open in Dialogs/Drawers without shrinking the board.
- Added a context drawer (right on desktop, bottom sheet on mobile) that appears only when selection or pending actions exist.

### NEXT
- Refine context panel copy once VP and scenario scoring are implemented.
- Add a compact, keyboard-only shortcut sheet for advanced players.

### Known limitations / TODOs
- VP is placeholder in the command bar until scoring is implemented in the engine.

### Files touched
- UI: `app/page.tsx`, `components/BoardViewport.tsx`, `lib/ui/CardPanel.tsx`
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

---

## 2026-01-01 — Add targeting action bar when cards overlay closes

### BEFORE
- Selecting card/tactic targets required the cards modal to remain open, blocking map interaction.
- There was no compact confirm/cancel UI when the overlay was dismissed.

### NOW
- Starting targeting closes the cards overlay and shows a fixed bottom action bar with target count plus Confirm/Cancel.
- The bar works for both pending cards and tactic targeting without changing engine logic.

### NEXT
- Add a small “reopen cards” affordance on the targeting bar once UX settles.

### Known limitations / TODOs
- The targeting bar is always fixed; consider snapping above mobile bottom sheets if needed.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

---

## 2026-01-01 — Allow board interaction with context panel open

### BEFORE
- The context drawer opened as a modal, blocking clicks on the board after selecting a unit.

### NOW
- Context drawer no longer renders a backdrop and does not trap focus, so the board remains interactive while the panel is open.

### NEXT
- Add a subtle “tap outside to close” affordance if players want a quick hide action on mobile.

### Known limitations / TODOs
- The context panel still occupies screen space; use the size toggles to reduce coverage on mobile.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Keep cards overlay closed during targeting

### BEFORE
- Starting pending-card targeting closed the overlay but it immediately reopened because the pending card still existed.
- The modal blocked map clicks, preventing target selection.

### NOW
- Auto-open only occurs when a pending card exists and targeting is not active, keeping the overlay closed while selecting targets.

### NEXT
- Add a small “resume cards” action on the targeting bar if players want to reopen the overlay mid-selection.

### Known limitations / TODOs
- Targeting still relies on the bottom action bar for confirmation.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Suppress Cards & Tactics overlay while targeting

### BEFORE
- The Cards & Tactics overlay still opened if a pending card existed, even while targeting a card or tactic.

### NOW
- Overlay visibility is suppressed during any targeting mode, so map clicks are always available for target selection.

### NEXT
- Consider adding a small “return to cards” button inside the targeting bar.

### Known limitations / TODOs
- Overlay reopening is manual once targeting ends.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Fix targeting overlay reference order

### BEFORE
- A runtime ReferenceError occurred because `cardsOverlayOpen` referenced `isPendingTargeting` before it was defined.

### NOW
- Moved targeting flag initialization above `cardsOverlayOpen` so the overlay state computes safely.

### NEXT
- Keep derived UI flags grouped together to avoid ordering issues.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Let map clicks pass through context drawer

### BEFORE
- Even with no backdrop, the context drawer’s root layer still captured pointer events and blocked board clicks.

### NOW
- Context drawer root ignores pointer events while the paper remains interactive, so the board stays clickable.

### NEXT
- Consider adding a context close affordance that doesn’t cover the board.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Render cards overlay only when open

### BEFORE
- Closing the cards overlay during targeting could still leave modal remnants and trigger DOM removeChild errors.

### NOW
- Cards overlay mounts only when open and disables transition animations, avoiding DOM churn during targeting confirms.

### NEXT
- Reintroduce transitions if stable under React 19 + Turbopack.

### Known limitations / TODOs
- Overlay opens/closes instantly (no animation) for now.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Raise targeting bar above context panel

### BEFORE
- The targeting action bar could be obscured by the right-side context drawer, blocking Confirm/Cancel clicks.

### NOW
- Increased the targeting bar z-index so it stays above the context drawer.

### NEXT
- If overlap remains on narrow screens, add a safe-area inset or move the bar upward on desktop.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-01 — Pin targeting bar above all overlays

### BEFORE
- A z-index of 60 still allowed the context drawer to overlap the targeting action bar in some layouts.

### NOW
- Raised the targeting bar to z-index 9999 so it always sits above other UI overlays.

### NEXT
- If additional overlays are added later, keep the targeting bar at the top of the z-index stack.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Fix move ownership and context overlap

### BEFORE
- Move mode allowed selecting enemy units as the mover.
- The right-side context drawer overlapped the command bar.

### NOW
- Move selection only activates for the active player’s units.
- Desktop context drawer is pushed below the command bar and constrained to the remaining viewport height.

### NEXT
- Consider adding a clearer “enemy unit” hover state to reinforce ownership.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Anchor context panel below command bar

### BEFORE
- The context drawer still rendered at the top-right, overlapping the command bar.

### NOW
- Desktop context panel is explicitly positioned below the command bar using a fixed `top` offset and viewport height calc.

### NEXT
- If the command bar height changes, keep the CSS variable in sync.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Offset context drawer below header

### BEFORE
- The context panel still sat flush to the top-right in some layouts.

### NOW
- Added an explicit vertical offset to the drawer paper and reduced its height to account for the command bar gap.
- Lowered the drawer z-index so the command bar stays on top.

### NEXT
- If the header height changes again, update the offset variable and retest on mobile.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Force context drawer margin via PaperProps

### BEFORE
- Drawer offsets defined in slot props were not applied, leaving the context panel at the top.

### NOW
- Applied the vertical offset and max height directly on `PaperProps` so the drawer is pushed below the command bar.

### NEXT
- Verify the margin persists across breakpoints and browsers.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Use fixed pixel offset for context drawer

### BEFORE
- CSS variable-based offsets were not reflected in the inspector, so the context panel still sat at the top.

### NOW
- Applied a fixed 120px top margin and height clamp on the context drawer to keep it below the command bar.

### NEXT
- Replace the fixed offset with a measured header height once the command bar is finalized.

### Known limitations / TODOs
- The offset is hardcoded; update if the command bar height changes.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Force context drawer position with fixed top offset

### BEFORE
- The context drawer still appeared at the top-right, because padding was not a positional offset.

### NOW
- Applied `position: fixed` with an explicit `top: 120px` and `right: 0` on the drawer paper to guarantee the Y offset.

### NEXT
- Replace the fixed top offset with a measured value once the header height is locked.

### Known limitations / TODOs
- The top offset is hardcoded to 120px.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Replace desktop context drawer with fixed overlay box

### BEFORE
- Drawer positioning styles were ignored, leaving the context panel pinned to the top-right.

### NOW
- Desktop context panel is rendered as a fixed-position box with an explicit pixel offset below the command bar.
- Mobile still uses the bottom-sheet drawer.

### NEXT
- Measure the command bar height and replace the 120px offset if the bar changes.

### Known limitations / TODOs
- The desktop offset is hardcoded to 120px.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Use fixed mobile bottom sheet for context

### BEFORE
- Mobile context used a Drawer that risked focus capture and inconsistent positioning.

### NOW
- Mobile context is a fixed bottom sheet with explicit peek/half/full heights, keeping the map interactive outside the sheet.

### NEXT
- Add a drag handle if we want swipe-to-resize.

### Known limitations / TODOs
- No swipe gesture; size is controlled by buttons only.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-02 — Add mandatory design-system compliance rule

### BEFORE
- AGENTS instructions did not explicitly enforce the brutalist-constructivism design system docs.

### NOW
- Added a mandatory rule in `AGENTS.md` requiring adherence to the locked design prompt and visual style bible for any UI work.

### NEXT
- Verify upcoming UI changes reference the design docs before implementation.

### Known limitations / TODOs
- None.

### Files touched
- Docs: `AGENTS.md`, `docs/progress.md`

---

## 2026-01-01 — Align E2E steps with targeting bar flow

### BEFORE
- The manual checklist still referenced the “small targeting bar” and had duplicate step numbering.

### NOW
- Updated the checklist to reference the bottom targeting bar and corrected step numbers in the cards and tactics sections.

### NEXT
- Re-run the combined walkthrough once new overlays are added.

### Known limitations / TODOs
- None.

### Files touched
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

---

## 2026-01-01 — Fix targeting bar type guards

### BEFORE
- TypeScript errors surfaced because the targeting bar read `.count` on non-unit targeting specs and referenced an undefined variable.

### NOW
- Confirm buttons in the targeting bar guard on `type === "unit"` and reuse the existing `targetingSpec`.

### NEXT
- Keep targeting UI checks aligned with `TargetingSpec` unions.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`

## 2026-01-02 — Command screen layout + Ops Console

### BEFORE
- The UI relied on centered modals/drawers for cards, tactics, and log, plus a floating context panel.
- The layout used a tall fixed command bar and a large, centered panel stack that pulled focus from the board.
- Move highlights used a neon drop-shadow glow and the page could scroll.

### NOW
- Added a brutalist MUI theme with flat, rectangular components and palette-aligned defaults.
- Rebuilt the screen as a board-first command surface with a thin AppBar, a right-hand Ops Console dock (tabs: Cards/Tactics/Log), and a mobile bottom-sheet console toggle.
- Flattened highlight styling (no glow), locked the base background, and ensured the board viewport fills the available height.
- Updated manual E2E layout checks to match the new console-driven UI.

### NEXT
- Validate command-bar density on small screens and consider additional compression or shortcuts if needed.
- Add lightweight unit context readouts inside the console without changing engine logic.

### Known limitations / TODOs
- Action buttons in the command bar may require horizontal scrolling on very narrow devices.
- Targeting confirm/cancel remains in the bottom targeting bar rather than the console.

### Files touched
- UI: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components/OpsConsole.tsx`, `components/BoardViewport.tsx`, `lib/ui/theme.ts`, `lib/ui/CardArt.tsx`
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

## 2026-01-02 — Fix MUI theme provider client boundary

### BEFORE
- The root layout passed the MUI theme directly through a server component wrapper, triggering a runtime error about functions in Client Components.

### NOW
- Moved the ThemeProvider + AppRouterCacheProvider into a dedicated client wrapper component to satisfy Next.js client boundary rules.

### NEXT
- Re-run the UI smoke checks to confirm the console layout renders without runtime errors.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/layout.tsx`, `app/ThemeRegistry.tsx`
- Docs: `docs/progress.md`

## 2026-01-02 — Define Geist font CSS variables

### BEFORE
- The CSS referenced `--font-geist-sans` and `--font-geist-mono` without fallback definitions, triggering unresolved custom property warnings.

### NOW
- Added explicit fallback font variable definitions in `app/globals.css` so the CSS custom properties resolve even before Next.js injects font variables.

### NEXT
- Confirm typography renders with Geist and falls back cleanly when fonts are unavailable.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/globals.css`
- Docs: `docs/progress.md`

## 2026-01-02 — Center board on median unit position

### BEFORE
- The board viewport opened at pan (0,0), which could place the unit cluster away from center.

### NOW
- Added an initial pan calculation that centers the viewport on the median unit position at first render.

### NEXT
- Consider persisting pan/zoom between turns or sessions if needed.

### Known limitations / TODOs
- Initial centering runs once on mount and does not re-center after unit movement.

### Files touched
- UI: `components/BoardViewport.tsx`, `app/page.tsx`
- Docs: `docs/progress.md`

## 2026-01-02 — Ops-room command plate + framed console polish

### BEFORE
- The command bar used a scrolling row of buttons and lacked the command-plate hierarchy.
- The Ops Console tabs looked like default MUI tabs, and cards still read as a generic block.
- Mobile console sizing was fixed and lacked snap heights or a grab handle.

### NOW
- Added Frame/Plate primitives and used them across the command plate, board frame, and console sections.
- Rebuilt the command bar with a player plate, stats capsules, and wrapping command keys (no horizontal scrolling).
- Refactored the Ops Console: header plate, hard tab plates, directive-style pending card module, and compact stored bonus tiles.
- Implemented narrow breakpoint behavior at 1100px and added bottom-sheet snap sizes with a grab handle.
- Updated UI smoke checks in the manual E2E doc to match the new command/console structure.

### NEXT
- Validate command plate density at 390×844 and adjust key grouping if needed.
- Tune stored bonus tile expansion behavior on very narrow screens.

### Known limitations / TODOs
- Bottom sheet snap sizing is click-cycled; swipe snap points are not enforced beyond the Drawer default.

### Files touched
- UI: `app/page.tsx`, `components/OpsConsole.tsx`, `components/ui/Frame.tsx`, `components/ui/Plate.tsx`, `lib/ui/theme.ts`
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

## 2026-01-02 — Ensure Ops Console dock scrolls

### BEFORE
- The console dock clipped content at the bottom when it exceeded the viewport.

### NOW
- Wrapped the right dock so the Ops Console can scroll independently while keeping headers/states visible.

### NEXT
- None (minor UI polish). Verify with long log/bonus lists to confirm scrolling.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`

## 2026-01-02 — Desktop console dock scroll fix

### BEFORE
- The desktop Ops Console dock clipped content at the bottom with no reliable scrolling.

### NOW
- Allowed the dock container to scroll vertically and let the console render to natural height on desktop (fillHeight=false), while keeping mobile drawer full-height behavior.

### NEXT
- Validate long log and stored bonus lists on desktop to confirm smooth scroll.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`, `components/OpsConsole.tsx`
- Docs: `docs/progress.md`

## 2026-01-02 — Fix Ops Console scrolling + horizontal overflow

### BEFORE
- The Ops Console dock clipped vertically and could introduce horizontal scroll.

### NOW
- Ensured the console body is a flex column so tab panels can constrain height and scroll internally, and hid horizontal overflow at the console root.

### NEXT
- Recheck long card/log lists to confirm the internal scroll behaves on desktop and mobile.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/OpsConsole.tsx`, `app/page.tsx`
- Docs: `docs/progress.md`

## 2026-01-02 — Oblique command keys

### BEFORE
- Command bar actions used rectangular plates; no oblique/parallelogram styling.

### NOW
- Added `components/ui/ObliqueKey.tsx` and replaced command bar actions with oblique, clipped keys (flat, no gradients) including focus, hover inversion, and pressed state.
- Ensured command keys wrap (no horizontal scroll) and preserved all action enable/disable logic.

### NEXT
- Verify keyboard focus and activation for all command keys.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueKey.tsx`, `app/page.tsx`
- Docs: `docs/progress.md`

## 2026-01-02 — Oblique tab strip + status capsules

### BEFORE
- Ops Console tabs were rectangular plates with spacing and the log tab was always visible.
- Command plate stats used plain plates without iconography or chevron separators.

### NOW
- Added oblique, joined tab strip via `ObliqueTabBar`, with LOG gated behind `NEXT_PUBLIC_SHOW_DEV_LOGS=true`.
- Introduced micro UI primitives (StatusCapsule, ChevronDivider, MicroIcon) and rebuilt command plate stats into capsule groups with icons and chevrons.
- Updated the manual UI smoke checks to note the dev-only log tab.

### NEXT
- Validate tab keyboard navigation (arrow keys + Enter/Space) across desktop and mobile.

### Known limitations / TODOs
- The oblique tab strip allows horizontal scroll only if tabs cannot fit; prefer adjusting labels if it becomes common.

### Files touched
- UI: `components/ui/ObliqueTabBar.tsx`, `components/ui/StatusCapsule.tsx`, `components/ui/ChevronDivider.tsx`, `components/ui/MicroIcon.tsx`, `components/OpsConsole.tsx`, `app/page.tsx`
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

## 2026-01-02 — Phase ruler + motion tokens

### BEFORE
- The command bar had no phase progress indicator and UI motion was implicit.

### NOW
- Added `PhaseRuler` under the command bar with segmented progression, ticks, and active marker.
- Added motion tokens in `lib/ui/motion.ts` and applied them to phase transitions, oblique keys, tabs, and collapsible panels with reduced-motion support.
- Updated UI smoke checks to include the phase ruler.

### NEXT
- Verify reduced-motion behavior on systems with motion reduction enabled.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/PhaseRuler.tsx`, `lib/ui/motion.ts`, `components/ui/ObliqueKey.tsx`, `components/ui/ObliqueTabBar.tsx`, `components/OpsConsole.tsx`, `app/page.tsx`
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`

## 2026-01-02 — Targeting overlay frame hierarchy

### BEFORE
- The bottom targeting panel looked semi-transparent and visually bled into the board, with multiple nested frames creating double borders.

### NOW
- Added an opaque `OverlayPanel` primitive with a single outer border, inset line, and header plate.
- Rebuilt the targeting overlay using the new panel, added a top rail divider, and aligned it to the play surface for a solid, anchored feel.
- Introduced explicit surface color tokens for surface/panel/action/board backgrounds.

### NEXT
- Validate targeting overlay clarity across phases (pending card vs tactic) and on narrow screens.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/OverlayPanel.tsx`, `app/page.tsx`, `app/globals.css`
- Docs: `docs/manual-e2e-test.md`, `docs/progress.md`
---

## 2026-01-02 — Clarify UI global rules formatting

### BEFORE
- The UI global rules document leaned heavily on bold and scattered formatting, so it was harder to scan the console doctrine and verify hierarchy/interaction rules.

### NOW
- Rewrote `docs/design/UI_GLOBAL_RULES.md` with plain text paragraphs and grouped sections so similar constraints live together, keeping only the needed emphasis for semantic terms.
- Made lists, font, color, motion, and responsiveness rules easier to parse while preserving the full set of command-console constraints.

### NEXT
- Review any other design/style docs that reference the console rules and ensure their formatting matches the cleaned-up tone.

### Known limitations / TODOs
- No automated checks cover formatting changes, so future edits must follow the same plain-markup approach manually.

### Files touched
- Docs: `docs/progress.md`, `docs/design/UI_GLOBAL_RULES.md`
---
## 2026-01-02 — Apply command console global rules

### BEFORE
- The command console frames still used double 2px borders, some actions relied on ad-hoc button styling, and the tab bar/bonus list allowed horizontal scrolling on small widths.
- Several UI accents used semi-transparent fills instead of the opaque palette defined in the global rules.

### NOW
- Simplified `Frame` to a single outer border with an inset line, and aligned console panels to the `--action-panel` fill for hierarchy.
- Reworked stored bonus tiles into clickable Plates with a thin inset summary border and removed horizontal scrolling from the bonus list and tab bar.
- Swapped key/capsule tone fills to opaque palette values and made phase completion segments use the panel tone.

### NEXT
- Scan any remaining UI surfaces for ad-hoc interactive elements or overflow behavior and align them to the same command-console rules.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/Frame.tsx`, `components/ui/Plate.tsx`, `components/ui/ObliqueKey.tsx`, `components/ui/StatusCapsule.tsx`, `components/ui/PhaseRuler.tsx`, `components/ui/ObliqueTabBar.tsx`, `components/OpsConsole.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Mobile console drawer rebuild

### BEFORE
- The mobile console used a modal drawer that trapped focus, locked scroll, and rendered as a thin, awkward slice over the board.
- The command bar could be effectively blocked by the modal behavior, and the console height snapping was unreliable on narrow screens.

### NOW
- Replaced the modal drawer with a fixed, non-modal `MobileConsoleDrawer` that uses explicit height snaps and a 44px handle rail.
- Split OpsConsole layout controls so mobile renders header/tabs in the drawer shell and uses body scrolling instead of internal panels.
- Capped full height against the command bar height to keep the top controls reachable and kept the board interactive above the drawer.

### NEXT
- Verify touch ergonomics on a real device and decide whether drag-to-resize is needed beyond tap-to-cycle.

### Known limitations / TODOs
- Drag-resize is not implemented; tap-to-cycle controls height for now.

### Files touched
- UI: `components/MobileConsoleDrawer.tsx`, `components/OpsConsole.tsx`, `app/page.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Mobile console drag resize

### BEFORE
- The mobile drawer only allowed tap-to-cycle sizes, so users could not directly drag the console height.

### NOW
- Added pointer-driven drag resizing on the handle (`drawer-drag-handle`) with live height updates and snap-to-size on release.
- Disabled height transitions during drag and prevented touch scrolling while resizing.

### NEXT
- Validate drag snapping feel across devices and ensure the command bar remains reachable at full height.

### Known limitations / TODOs
- Drag snapping is vertical only (no inertia), by design.

### Files touched
- UI: `components/MobileConsoleDrawer.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Mobile command header tiers

### BEFORE
- The top command area mixed plates, keys, and readouts in a single wrap band, causing unpredictable ordering and unreadable stacking on mobile.
- MODE/STATUS readouts appeared in multiple places and there was no deterministic tiering or collapse behavior.

### NOW
- Added `CommandHeader` with a strict three-tier layout: identity row, two-row command grid, and a collapsed secondary rail with a More toggle.
- Implemented deterministic label shortening and truncation helpers plus shared layout tokens for consistent spacing.
- Removed duplicate readouts from the top bar and kept PhaseRuler anchored below the header frame.

### NEXT
- Validate key density at 360–420px widths and tune overflow priorities if any commands feel buried.

### Known limitations / TODOs
- Turn-start remains available only through the main flow controls and is not surfaced in the tiered header.

### Files touched
- UI: `components/CommandHeader.tsx`, `components/ui/PhaseRuler.tsx`, `app/page.tsx`
- UI tokens: `lib/ui/headerFormat.ts`, `lib/ui/layoutTokens.ts`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Reaction window abstraction

### BEFORE
- Reaction window availability was computed in the UI, and tactic validation/apply logic was duplicated across movement, roll, and resolve actions in the reducer.

### NOW
- Centralized reaction window derivation in `getOpenReactionWindows(state)` and moved tactic validation/application into a dedicated `lib/engine/reactions.ts` helper.
- Reducer actions now reuse the shared helper instead of duplicating validation and effect application logic.
- UI consumes the engine helper for open reaction windows, keeping the engine the single source of truth.

### NEXT
- Add unit tests around reaction window derivation and tactic validation to protect the abstraction.

### Known limitations / TODOs
- No automated tests exist yet for reaction validation paths.

### Files touched
- Engine: `lib/engine/reactions.ts`, `lib/engine/effects.ts`, `lib/engine/reducer.ts`, `lib/engine/index.ts`
- UI: `app/page.tsx`
- Docs: `docs/engine.md`, `docs/tactics-cards.md`, `docs/progress.md`
---

## 2026-01-02 — Reformat Next.js multi-zone implementation doc

### BEFORE
- `docs/implementation/nextjs-multi-zone.md` used bold-aplenty text, inline highlights, and inconsistent code formatting that made it difficult to read or reliably reference for implementation steps.

### NOW
- Rewrote the entire guide with plain headings, prose descriptions, fenced code blocks, and structured lists so each setup phase, configuration snippet, and deployment note is easy to scan and copy.
- Grouped the architecture notes, environment variables, linking guidance, and testing checklist into distinct sections that mirror the implementation flow.

### NEXT
- Confirm the rewritten guide matches the live implementation (e.g., port numbers, env var names) and update the shared documentation whenever the multi-zone deployment changes.

### Known limitations / TODOs
- No automated linting verifies Markdown style; manual review is required whenever formatting changes are made.

### Files touched
- Docs: `docs/progress.md`, `docs/implementation/nextjs-multi-zone.md`
---

## 2026-01-02 — Fix targeting / queued tactic typings

### BEFORE
- OpsConsole and Home were failing TypeScript checks: required `ownerId` fields were missing from targeting/queued tactics, DEV log gating used `SHOW_DEV_LOGS` before declaration, and a `Plate` control tried to act like a button.

### NOW
- Ensured every targeting/queued-tactic state update supplies the active player as `ownerId`, which lets `useMemo` filters trust the data shape without TS errors.
- Declared `SHOW_DEV_LOGS` before it is referenced so tab logic resolves correctly, and removed the invalid `type` prop from the `Plate` button replacement.
- Ran `tsc` to confirm the project builds cleanly after the fixes.

### NEXT
- Keep guards around new targeting flows and `enqueue` logic in sync with the engine so these primitives stay type-safe.

### Known limitations / TODOs
- None.

### Files touched
- Docs: `docs/progress.md`
- UI: `app/page.tsx`, `components/OpsConsole.tsx`
---
## 2026-01-02 — Hook state sync cleanup

### BEFORE
- Lint failed due to setState-in-effect patterns, unstable memoization dependencies, and ref access during render in key UI components.

### NOW
- Converted reaction/console state to derived values, stabilized memoized command-key data, and moved viewport initialization into a ref callback.
- Updated mobile drawer sizing to reset via remount instead of effect-driven state updates.

### NEXT
- Watch for future hook lint violations as new UI features are added.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`, `components/BoardViewport.tsx`, `components/CommandHeader.tsx`, `components/MobileConsoleDrawer.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Landscape mobile command dock

### BEFORE
- Landscape mobile used the full header stack and phase ruler, shrinking the board and leaving actions buried in a vertical layout.

### NOW
- Added a landscape-only header variant with a slim strip, inline mini phase indicator, and a long-press quick-action ribbon.
- Introduced a right-edge command dock with CMD/CONSOLE tabs, auto-open behavior for action phases, and pinned/manual controls.
- Routed mobile landscape to the edge dock and kept the board height dominant with a fixed header offset.

### NEXT
- Validate dock ergonomics on real devices and tune the auto-open timing if it feels intrusive.

### Known limitations / TODOs
- Auto-open currently triggers on CARD_DRAW and DICE_RESOLUTION only.

### Files touched
- UI: `components/CommandHeader.tsx`, `components/EdgeCommandDock.tsx`, `app/page.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Mobile viewport recenter + pinch zoom

### BEFORE
- The board pan/zoom stayed fixed on orientation change or resize, and mobile users could not pinch to zoom.

### NOW
- BoardViewport recenters on resize/orientation changes using the initial pan/zoom rules.
- Added two-finger pinch zoom with midpoint anchoring to keep the board stable while scaling.

### NEXT
- Tune zoom clamps if playtesting shows too much/too little range.

### Known limitations / TODOs
- Recenter currently resets zoom to the default on resize.

### Files touched
- UI: `components/BoardViewport.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Bold semantic color emphasis

### BEFORE
- Most action keys, tabs, and overlays shared the same neutral concrete palette, making modes, focus, and ownership hard to scan.

### NOW
- Centralized semantic color tokens and applied active/inactive/disabled fill + stripe rules across keys, tabs, and status capsules.
- Added a focus rail + FOCUS capsule to targeting overlays and enforced the focus tone for any targeting state.
- Reinforced player ownership with blue/red stripes on command plates and OpsConsole headers, plus card-type stripes on pending directives.

### NEXT
- Validate color contrast on real devices and adjust token values if any state still blends.

### Known limitations / TODOs
- Some secondary plates still use neutral fills and may need further emphasis if playtests call for it.

### Files touched
- UI: `lib/ui/semanticColors.ts`, `components/ui/ObliqueKey.tsx`, `components/ui/ObliqueTabBar.tsx`, `components/ui/StatusCapsule.tsx`, `components/ui/OverlayPanel.tsx`, `components/OpsConsole.tsx`, `components/CommandHeader.tsx`, `app/page.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Semantic color activation fixes

### BEFORE
- Mode keys were disabled in non-action phases, so the active fill never appeared and the palette changes read as tiny edge stripes only.

### NOW
- Mode selectors stay enabled so the current mode renders as a filled accent state.
- END TURN always renders as a black key with a red stripe when the game is active.
- Mode status capsules inherit blue/red tones to mirror the active mode.

### NEXT
- Re-check command keys during each phase to confirm the color hierarchy still reads correctly on all device sizes.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/CommandHeader.tsx`, `app/page.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Oblique tab/key stripe rendering fix

### BEFORE
- Accent stripes on ObliqueKey and ObliqueTabBar rendered as tiny slivers because the stripe element was clipped by a polygon larger than its width.

### NOW
- Switched oblique stripe rendering to hard-stop linear gradients so stripes fill the full 6px width while preserving the oblique clip on the button itself.

### NEXT
- Confirm stripe visibility across all tabs/keys at multiple widths, especially the EdgeCommandDock.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueKey.tsx`, `components/ui/ObliqueTabBar.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Active tab fill by semantic color

### BEFORE
- Active tabs still filled black, with only a narrow accent stripe visible at the edge.

### NOW
- Active tabs fill with their semantic color (Cards = dice yellow, Tactics = move blue, Log = neutral gray) while preserving the oblique clip.

### NEXT
- Recheck contrast for the Log tab in low-light environments.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueTabBar.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Color2 contrast and band headers

### BEFORE
- Active states relied on stripes, tabs still had inconsistent contrast, and pale header plates made panels blend together.

### NOW
- Added a contrast helper and expanded neutrals to enforce readable text on accent fills.
- Introduced BandHeader and swapped OpsConsole section headers to ink bands with accent stripes for faster scanning.
- Shifted inactive fills to panel tones, active fills to semantic accents, and updated focus actions to use bold active fills.
- Added surface2/panel2 zone tinting and tightened body text spacing for better readability.

### NEXT
- Verify color legibility across themes and tune neutral bands if any section feels too heavy.

### Known limitations / TODOs
- None.

### Files touched
- UI: `lib/ui/semanticColors.ts`, `components/ui/BandHeader.tsx`, `components/ui/Frame.tsx`, `components/ui/ObliqueKey.tsx`, `components/ui/ObliqueTabBar.tsx`, `components/ui/StatusCapsule.tsx`, `components/OpsConsole.tsx`, `components/CommandHeader.tsx`, `app/page.tsx`, `app/globals.css`
- Docs: `docs/progress.md`
---
## 2026-01-02 — PhaseRuler interlocking chevrons

### BEFORE
- PhaseRuler used clipped box segments that overlapped visually and did not interlock cleanly.

### NOW
- Rebuilt PhaseRuler with SVG chevron segments that have matching left notches and right teeth, using H/2 tooth geometry and zero-gap tiling.
- Preserved phase mapping and active pulse while switching to interlocking manufactured shapes.

### NEXT
- Verify the chevron joins at the narrowest viewport widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/PhaseRuler.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Targeting overlay persistence fix

### BEFORE
- Starting pending-card targeting caused the bottom overlay to flash and close immediately.

### NOW
- Targeting resets only when the pending card changes, preventing premature overlay dismissal.
- Targeting state is read from a ref to avoid effect re-triggers on context updates.

### NEXT
- Validate targeting flow for tactics and pending cards across turns.

### Known limitations / TODOs
- None.

### Files touched
- UI: `app/page.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — SkewedButton typed

### BEFORE
- `components/ui/SkewedButton.jsx` was a JS-only component with fixed label.

### NOW
- Rewritten as `components/ui/SkewedButton.tsx` with proper props typing, optional label/children, and retain the skew effect.

### NEXT
- Ensure any new skewed controls reuse this typed primitive.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/SkewedButton.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueKey simplification

### BEFORE
- ObliqueKey had layered rail elements and extra state branches that made styling harder to reason about.

### NOW
- Simplified ObliqueKey to a single ButtonBase with clip-path, a stripe via linear-gradient, and typed props similar to SkewedButton.
- Added support for children/label while keeping the same oblique shape and interaction states.

### NEXT
- Validate button contrast across all tones in the console and command dock.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueKey stripe clipping fix

### BEFORE
- Inactive keys showed stray accent color on the right edge due to gradient + clip-path interaction.

### NOW
- Moved the accent stripe back to a clipped pseudo-element and limited gradients to inactive-only, removing edge bleed.

### NEXT
- Recheck inactive keys at very small widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueKey left-edge fix

### BEFORE
- Inactive keys showed a triangular sliver of the accent stripe at the top-left due to the left edge being slanted in the clip-path.

### NOW
- Straightened the left edge in the ObliqueKey clip-path so the accent stripe renders as a clean vertical bar with no red wedge.

### NEXT
- Recheck adjacent key seams at all sizes.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueKey skew simplification

### BEFORE
- ObliqueKey clip-path produced edge bleed and accent wedges on inactive buttons.

### NOW
- Replaced clip-path geometry with a simple skew transform, matching the SkewedButton strategy and eliminating stripe bleed.
- Kept the vertical stripe as a normal bar and unskewed the label text for readability.

### NEXT
- Validate the skewed shape against the design guidelines for oblique controls.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueTabBar skew cleanup

### BEFORE
- Tab clip-paths caused accent bleed and jagged edges similar to the old ObliqueKey.

### NOW
- Switched ObliqueTabBar to a skewed ButtonBase approach, with counter‑skewed labels and clean vertical stripes.

### NEXT
- Verify tab seams at narrow widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueTabBar.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueTabBar slab fix

### BEFORE
- Skewed tabs overlapped and cropped the first/last edges.

### NOW
- Tabs use a clipped rectangular shell with an internal skewed slab, keeping straight outer edges while preserving the oblique fill.
- Overlap reduced to border-only so tabs no longer cover each other.

### NEXT
- Verify the slab offset on very small widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueTabBar.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueTabBar slanted edges

### BEFORE
- Tabs lost the slanted edges and rendered as squares after the slab fix.

### NOW
- Added outer clip-paths per tab position so the first tab slants right, middle tabs slant both sides, and last tab slants left.
- Kept the internal skewed slab for consistent fill without edge bleed.

### NEXT
- Fine-tune slant width if needed for tighter joins.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueTabBar.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueTabBar chevron reset

### BEFORE
- Tabs had odd internal skew artifacts and gaps when the slab method was used.

### NOW
- Returned to clean chevron clip-path tabs with straight outer edges and no internal slab, matching the reference shape.
- Stripes are clipped to the tab shape to avoid bleed.

### NEXT
- Verify seam alignment across all widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueTabBar.tsx`
- Docs: `docs/progress.md`
---

## 2026-01-02 — Fix SkewedTabsConditional typing

### BEFORE
- `components/ui/SkewedTabsConditional.tsx` was plain JS; the missing type annotations and default React import usage caused TypeScript to fail during the build.

### NOW
- Typed the component (`React.FC`), the tab data, and the clip-path helper so the compiler knows what to expect, and added explicit `React.SyntheticEvent`/`number` parameters for the Tabs `onChange` handler.
- `tsc` now runs cleanly with the updated file.

### NEXT
- Keep any new UI utilities strongly typed before adding them so the build stays green.

### Known limitations / TODOs
- None.

### Files touched
- Docs: `docs/progress.md`
- UI: `components/ui/SkewedTabsConditional.tsx`
---
## 2026-01-02 — SkewedTabsConditional gap suppression

### BEFORE
- SkewedTabsConditional showed visible gaps between tabs because flex gaps cannot be negative.

### NOW
- Tabs are pulled together with negative left margin per tab and a matching container offset.

### NEXT
- Confirm the interlock at different tab widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/SkewedTabsConditional.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — SkewedTabsConditional full-width layout

### BEFORE
- The test tabs did not stretch to full width, making gap testing inconsistent.

### NOW
- Tabs flex to fill the container and overlap by the slant width for interlock testing.

### NEXT
- Adjust the clip-path or overlap if a seam remains after full-width scaling.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/SkewedTabsConditional.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — ObliqueTabBar simplified overlap

### BEFORE
- Tabs used complex slants/stripes that still left seams and inconsistent edges.

### NOW
- Simplified ObliqueTabBar to the same clip-path + negative overlap method used in SkewedTabsConditional.
- Tabs now interlock via a single slant width, keeping first/last straight edges and eliminating gaps.

### NEXT
- If a seam persists, adjust SLANT by 1–2px.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/ui/ObliqueTabBar.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Top bar phase wireframes layout

### BEFORE
- Mode, actions, and flow controls shared the same grid, and NEXT PHASE/END TURN were not clearly grouped.

### NOW
- Split the command bar into three zones: MODE (left), ACTIONS (center, phase-valid only), FLOW (right).
- Flow controls are always grouped in a fixed panel2 container with a 2px divider; NEXT PHASE includes a chevron and END TURN stays black with a red stripe.
- Mode keys only activate during action phases and remain disabled otherwise.

### NEXT
- Verify spacing on narrow desktop widths and confirm action visibility in each phase.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/CommandHeader.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Top bar flow icons

### BEFORE
- FlowGroup used standard oblique keys, which made NEXT PHASE / END TURN feel like regular actions.

### NOW
- FlowGroup uses two large square icon buttons: a neutral chevron for NEXT PHASE and a black stop block with red stripe for END TURN.
- Mode group stays left (1/3) and action buttons are centered in the middle zone.

### NEXT
- Validate spacing at narrow widths and adjust icon sizing if needed.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/CommandHeader.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Flow icon labels

### BEFORE
- Flow buttons were icon-only, which made intent less explicit at a glance.

### NOW
- Added small labels beneath the enlarged icons for NEXT and END while keeping the flat square buttons.

### NEXT
- Validate legibility at small widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/CommandHeader.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — FlowGroup padding removal

### BEFORE
- Flow buttons were wrapped in padded containers, and the divider split the two buttons instead of the group.

### NOW
- Removed the wrapper boxes so the flow buttons fill their halves directly, and moved the divider to a single right-edge line.

### NEXT
- Check alignment at narrow widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/CommandHeader.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Flow button text layout

### BEFORE
- Flow buttons stacked icon above a two-line label, which didn’t align the icon with the first line.

### NOW
- Icon sits next to the first line (“NEXT” / “END”) with the second line below, centered vertically.

### NEXT
- Verify readability at smallest sizes.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/CommandHeader.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Flow buttons match oblique keys

### BEFORE
- Flow controls used custom square ButtonBase styles that diverged from MOVE/ATTACK sizing.

### NOW
- Replaced flow buttons with standard ObliqueKey buttons (same size as MOVE/ATTACK), keeping the existing color scheme and adding icons before labels.

### NEXT
- Check spacing balance between action and flow groups.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/CommandHeader.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Flow group border removal

### BEFORE
- Flow controls were wrapped in a bordered container, adding an extra frame around NEXT PHASE / END TURN.

### NOW
- Removed the outer border and background from the FlowGroup container so the two buttons sit directly in the bar.

### NEXT
- Confirm alignment with the action group on narrow widths.

### Known limitations / TODOs
- None.

### Files touched
- UI: `components/CommandHeader.tsx`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Align tsconfig with src layout

### BEFORE
- `@/` aliases pointed to the repository root, but source files now live under `src/`, so imports broke.

### NOW
- Set `baseUrl` to `src` and kept `@/*` pointing inside that directory so all aliases resolve again.

### NEXT
- Run the app to ensure runtime paths still work.

### Known limitations / TODOs
- None.

### Files touched
- Config: `tsconfig.json`
- Docs: `docs/progress.md`
---
## 2026-01-02 — Tailwind import fix

### BEFORE
- globals.css imported the TypeScript module from tailwind rather than the CSS layers, which broke PostCSS.

### NOW
- Switched to the standard `@import "tailwindcss/base"`, etc., so the plugin adds the styles without syntax errors.

### NEXT
- Verify tailwind utilities still compile via Turbopack.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/app/globals.css`
- Docs: `docs/progress.md`
---
## 2026-01-03 — Tailwind layer statements for Turbopack

### BEFORE
- `globals.css` still referenced `@import "tailwindcss/base"`/`components`/`utilities`, which Turbopack rejected because those paths aren't exported under the `style` condition.

### NOW
- Replaced the imports with `@tailwind base`, `@tailwind components`, and `@tailwind utilities` so the Tailwind PostCSS plugin runs successfully through Next’s build.
- `npm run build` now succeeds.

### NEXT
- Keep the Tailwind layer statements in sync with any future PostCSS migrations.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/app/globals.css`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Move/Attack constructivist cutouts

### BEFORE
- MOVE and ATTACK keys were flat fills only, with no constructivist cut-out geometry to reinforce their roles.

### NOW
- Added optional cut-out SVG backgrounds to ObliqueKey and applied them to MOVE/ATTACK across the command header and dock, keeping the labels dominant and the fills flat.
- Cut-out colors follow the required inactive/active semantics (neutral when inactive, semantic family when active) and remain clipped behind the text.

### NEXT
- Validate the cut-out balance on the smallest button sizes to ensure the symbols stay subtle and readable.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`, `src/components/CommandHeader.tsx`, `src/app/page.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Cutout visibility tuning

### BEFORE
- The MOVE/ATTACK cut-outs were too low-contrast to read against the filled keys on desktop.

### NOW
- Shifted the cut-out tint toward the surface/panel tones and increased opacity so the geometry reads without overpowering the label text.

### NEXT
- Confirm visibility on both sm/md key sizes and adjust only if the symbol starts to compete with the label.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Cutout contrast boost

### BEFORE
- The MOVE/ATTACK cut-out layer was still too faint to read on both active and inactive states.

### NOW
- Increased the cut-out contrast by mixing the active fill toward surface tones and the inactive fill toward ink, with higher opacity so the shapes read while staying behind the label.

### NEXT
- Validate the cut-outs on mobile sizes to ensure they remain visible without overpowering the text.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Cutout visibility hardening

### BEFORE
- The cut-out SVGs were still effectively invisible on the MOVE/ATTACK keys due to low contrast and opacity.

### NOW
- Removed opacity-based fading and instead use higher-contrast, flat mixed fills for the cut-outs, plus a larger SVG scale so the geometry reads clearly behind the labels.

### NEXT
- Confirm the cut-outs remain visible on the smallest key size without overpowering the text.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Cutout scale + right alignment

### BEFORE
- The constructivist cut-outs were still tiny and centered under the label.

### NOW
- Doubled the cut-out SVG scale and aligned it to the right side of the key so the geometry reads clearly across the button surface.

### NEXT
- Confirm the right-aligned cut-outs don’t interfere with icon/label spacing on small keys.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Cutout edge alignment

### BEFORE
- The enlarged cut-outs still sat too close to the center, leaving them partially hidden by the label.

### NOW
- Anchored the cut-out container to the right edge so the geometry hugs the border and reads outside the label area.

### NEXT
- Re-check label overlap on narrow keys and adjust the left cut-off if needed.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Attack cutout swap + bottom-right anchor

### BEFORE
- The ATTACK cut-out used the placeholder starburst SVG and sat mid-right rather than anchoring to the bottom-right corner.

### NOW
- Replaced the ATTACK cut-out with the provided `temp/two.svg` geometry (rendered via `currentColor`) and anchored it to the bottom-right of the key.

### NEXT
- Confirm the new cut-out remains legible on small keys without colliding with labels.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Cutout visibility hard fix

### BEFORE
- The MOVE/ATTACK cut-outs still read as invisible because the ATTACK SVG viewBox was too large and the tint sat too close to the panel tones.

### NOW
- Cropped the ATTACK cut-out viewBox to its actual geometry, increased the cut-out scale, and moved both cut-outs to the right edge.
- Boosted cut-out contrast by mixing toward ink for active and inactive states while keeping the symbols behind the text.

### NEXT
- Re-check small keys and confirm the right-edge cut-outs stay readable without colliding with labels.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Attack cutout corner anchor

### BEFORE
- The ATTACK cut-out was still floating slightly above the lower-right corner instead of expanding from the corner.

### NOW
- Re-anchored the ATTACK cut-out container so the SVG’s lower-right aligns with the button’s lower-right edge.

### NEXT
- Verify the corner alignment at both sm and md key sizes.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Generate terrain prompt templates

### BEFORE
- Designers only had `docs/design/generation/base_prompt.md` and `terrain_types.md`, so every terrain prompt had to be assembled manually and risked omitting the required exclusions from `negative_prompt.md`.
- There was no single source of truth for terrain-specific prompts, so versioning and tooling integrations were inconsistent.

### NOW
- Produced 14 per-terrain prompt files under `docs/design/generation/output/` that combine the base prompt’s constraints, the matching terrain entry from `terrain_types.md`, and the shared `negative_prompt.md`.
- Each file follows the base structure (instruction first line → terrain description → remaining base rules → global negative prompt) so the command console aesthetic and negative constraints stay intact for every terrain.

### NEXT
- Hook these prompt files into the art-generation workflow (scripted export, generator input manifest, etc.) so each terrain can be rendered deterministically without hand-editing; consider adding metadata tracking or `terrains.json` for automation.

### Known limitations / TODOs
- Files are static markdown and still need manual copy/paste into the generation tool.
- No automated validation exists yet to ensure new terrain entries (if added later) automatically spawn prompts and stay in sync.

### Files touched
- Docs: `docs/progress.md`
- Docs: `docs/design/generation/output/terrain-01-plain.md`
- Docs: `docs/design/generation/output/terrain-02-rough.md`
- Docs: `docs/design/generation/output/terrain-03-forest.md`
- Docs: `docs/design/generation/output/terrain-04-urban.md`
- Docs: `docs/design/generation/output/terrain-05-hill.md`
- Docs: `docs/design/generation/output/terrain-06-water.md`
- Docs: `docs/design/generation/output/terrain-07-road.md`
- Docs: `docs/design/generation/output/terrain-08-bridge.md`
- Docs: `docs/design/generation/output/terrain-09-trench.md`
- Docs: `docs/design/generation/output/terrain-10-industrial.md`
- Docs: `docs/design/generation/output/terrain-11-rubble-optional-second-wave.md`
- Docs: `docs/design/generation/output/terrain-12-swamp-optional-second-wave.md`
- Docs: `docs/design/generation/output/terrain-13-fortification-later.md`
- Docs: `docs/design/generation/output/terrain-14-checkpoint-later.md`

---
## 2026-01-03 — Regenerate terrain prompt set

### BEFORE
- The per-terrain prompt files existed but needed regeneration to ensure they match the latest `base_prompt.md`, `terrain_types.md`, and `negative_prompt.md` without manual drift.

### NOW
- Rebuilt all 14 terrain prompt files in `docs/design/generation/output/`, inserting each terrain block directly after the base prompt’s first line and appending the global negative prompt to every file, guaranteeing synchronized content.

### NEXT
- Automate this regeneration (e.g., npm script) and add a checksum/manifest so future edits to any source file trigger prompt rebuilds automatically.

### Known limitations / TODOs
- Still requires a generation pipeline to convert prompts into PNGs; prompts remain static markdown.

### Files touched
- Docs: `docs/progress.md`
- Docs: `docs/design/generation/output/terrain-01-plain.md`
- Docs: `docs/design/generation/output/terrain-02-rough.md`
- Docs: `docs/design/generation/output/terrain-03-forest.md`
- Docs: `docs/design/generation/output/terrain-04-urban.md`
- Docs: `docs/design/generation/output/terrain-05-hill.md`
- Docs: `docs/design/generation/output/terrain-06-water.md`
- Docs: `docs/design/generation/output/terrain-07-road.md`
- Docs: `docs/design/generation/output/terrain-08-bridge.md`
- Docs: `docs/design/generation/output/terrain-09-trench.md`
- Docs: `docs/design/generation/output/terrain-10-industrial.md`
- Docs: `docs/design/generation/output/terrain-11-rubble-optional-second-wave.md`
- Docs: `docs/design/generation/output/terrain-12-swamp-optional-second-wave.md`
- Docs: `docs/design/generation/output/terrain-13-fortification-later.md`
- Docs: `docs/design/generation/output/terrain-14-checkpoint-later.md`

---
## 2026-01-03 — Procedural terrain tile (PLAIN) PNG

### BEFORE
- The repo only had placeholder tile art (`ground.png`, `highlight_move.png`) and prompt templates, but no actual terrain tile PNG matching the generation spec for `01 — PLAIN`.

### NOW
- Added a deterministic, script-generated isometric slab tile for `01 — PLAIN` with a neutral top face, slightly darker side faces, flat fills (no lighting), and minimal inset markings per the prompt.
- Output is a transparent 1024×1024 PNG at `public/assets/tiles/terrain-01-plain.png`.

### NEXT
- Extend the generator to produce the remaining terrain tiles (ROUGH/FOREST/URBAN/…) using the same geometric language and flat-fill constraints.
- Optionally wire the script to read `docs/design/generation/output/terrain-*.md` and emit a complete tile set in one command.

### Known limitations / TODOs
- The current script only generates `01 — PLAIN`; other terrain types still need implementation.
- The tile generator is procedural and does not use an AI model; results are intentionally abstract and may need manual tuning to match the final art direction.

### Files touched
- Tools: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-01-plain.png`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Procedural terrain tile (ROUGH) PNG

### BEFORE
- Only `01 — PLAIN` had a generated terrain tile PNG; `02 — ROUGH` existed as a prompt template only.

### NOW
- Extended the deterministic tile generator to output `02 — ROUGH` as abstract “broken pattern logic”: rectangular fragments, small offsets, and gaps/misalignments on the top face (no texture, no lighting, no rubble illustration).
- Output is a transparent 1024×1024 PNG at `public/assets/tiles/terrain-02-rough.png`.

### NEXT
- Implement the remaining terrain generators (FOREST/URBAN/HILL/…) so `docs/design/generation/output/terrain-*.md` has a matching PNG under `public/assets/tiles/`.

### Known limitations / TODOs
- Fragment layout is procedural; we may need to tune density and fragment sizes to better match the intended “rough traversal disruption” read across the full tile set.

### Files touched
- Tools: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-02-rough.png`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Procedural terrain tiles (FOREST / URBAN / HILL / WATER) PNGs

### BEFORE
- Only `01 — PLAIN` and `02 — ROUGH` had generated terrain PNGs; `03 — FOREST`, `04 — URBAN`, `05 — HILL`, and `06 — WATER` existed as prompt templates only.

### NOW
- Added deterministic, script-generated terrain tiles for:
  - `03 — FOREST`: dense tall-thin rectangle repetition with staggered rows and a couple clear lanes (no organic shapes).
  - `04 — URBAN`: orthogonal “footprint” blocks arranged in cells with crisp straight corridor bars (diagrammatic streets).
  - `05 — HILL`: 5 nested diamond contour plates (discrete terraces, no gradients).
  - `06 — WATER`: calm parallel banding with slight angular variation (no curves, no wave art).
- Outputs are transparent 1024×1024 PNGs:
  - `public/assets/tiles/terrain-03-forest.png`
  - `public/assets/tiles/terrain-04-urban.png`
  - `public/assets/tiles/terrain-05-hill.png`
  - `public/assets/tiles/terrain-06-water.png`

### NEXT
- Generate the remaining terrain set (ROAD/BRIDGE/TRENCH/INDUSTRIAL/…) so every prompt in `docs/design/generation/output/` has a matching tile asset.
- Once the full set exists, tune the neutral palette and density so the entire family reads as one coherent board system.

### Known limitations / TODOs
- These are procedural approximations of the prompt language (no AI model involved); geometry density and spacing may need iterative tuning against the desired art direction.

### Files touched
- Tools: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-03-forest.png`, `public/assets/tiles/terrain-04-urban.png`, `public/assets/tiles/terrain-05-hill.png`, `public/assets/tiles/terrain-06-water.png`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Raster terrain tile (ROAD) PNG

### BEFORE
- `07 — ROAD` existed only as a prompt template (`docs/design/generation/output/terrain-07-road.md`) and had no corresponding tile PNG.

### NOW
- Generated a transparent 1024×1024 isometric slab tile with a single strong linear corridor band crossing the top face edge-to-edge, plus a thin parallel lane marking (strict geometry, flat fills, no lighting).
- Output is `public/assets/tiles/terrain-07-road.png`.

### NEXT
- Generate `08 — BRIDGE` with a narrower traversal spine + symmetric supports to keep the ROAD/BRIDGE pair readable as a set.

### Known limitations / TODOs
- This is a procedural raster interpretation of the prompt; corridor thickness/placement may need tuning once the full tile family is generated.

### Files touched
- Assets: `public/assets/tiles/terrain-07-road.png`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Replace base ground + highlight tile PNGs

### BEFORE
- `public/assets/tiles/ground.png` and `public/assets/tiles/highlight_move.png` were legacy placeholder assets that did not match the slab-style “command console tile” spec and included non-neutral coloring/gradient behavior.

### NOW
- Overwrote the in-game base tile and move highlight tile to match the new prompt specs:
  - Base tile (`terrain-99-flat-ground`): neutral isometric slab with an empty top face (no markings), and slightly darker side faces.
  - Highlight overlay (`terrain-hilight`): top-face-only desaturated cyan flat fill with a subtle inset border (no gradients, no glow), leaving side faces unchanged via transparency.
- Generated/overwritten outputs:
  - `public/assets/tiles/ground.png`
  - `public/assets/tiles/highlight_move.png`

### NEXT
- Align the UI hover effect (`IsometricBoard` hover filter) with the new neutral base tile so hover doesn’t shift the palette too aggressively.
- Generate the remaining terrain PNGs so the board can swap tiles by terrain type instead of using a single base tile everywhere.

### Known limitations / TODOs
- The base/highlight prompts specify a 1:1 square output in docs, but the in-game assets remain 128×64 to match current board rendering (`TILE_W`/`TILE_H`), so the slab is rendered in a compact canvas.

### Files touched
- Tools: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/ground.png`, `public/assets/tiles/highlight_move.png`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Regenerate tile assets at 3× resolution

### BEFORE
- Generated terrain tiles were 1024×1024 and the in-game base/highlight tiles were 128×64, limiting downstream reuse for higher-resolution exports.

### NOW
- Updated the tile generator to render at 3× scale and re-generated all script-managed assets:
  - Terrain tiles: `terrain-01-plain.png` … `terrain-06-water.png` are now 3072×3072.
  - In-game base/highlight: `ground.png` and `highlight_move.png` are now 384×192.
- Output files are still transparent PNGs with the same isometric slab geometry and flat-fill constraints, just higher resolution.

### NEXT
- If we intend to use the 3× base/highlight assets in the runtime UI, verify that downscaling in the browser doesn’t introduce edge shimmer and consider enabling image-rendering rules if needed.

### Known limitations / TODOs
- `terrain-07-road.png` is not managed by `scripts/gen_terrain_tiles.mjs` yet, so it was not scaled by this step.

### Files touched
- Tools: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-01-plain.png`, `public/assets/tiles/terrain-02-rough.png`, `public/assets/tiles/terrain-03-forest.png`, `public/assets/tiles/terrain-04-urban.png`, `public/assets/tiles/terrain-05-hill.png`, `public/assets/tiles/terrain-06-water.png`, `public/assets/tiles/ground.png`, `public/assets/tiles/highlight_move.png`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Advanced highlight overlay tiles (attack / move / confirm)

### BEFORE
- Only the basic movement highlight (`public/assets/tiles/highlight_move.png`) existed; there were no distinct overlays for attack targeting or target-confirmation states.
- The design prompts for advanced highlights existed under `docs/design/generation/output/`, but there were no matching raster assets to drop into the game later.

### NOW
- Added three new top-face-only overlay PNGs (transparent background; flat fills; no glow/gradients; no side-face changes) matching:
  - `docs/design/generation/output/attack-hilight-tile.md` → `public/assets/tiles/highlight_attack.png`
  - `docs/design/generation/output/move-hilight-tile.md` → `public/assets/tiles/highlight_move_adv.png`
  - `docs/design/generation/output/target-confirm-highlight-tile.md` → `public/assets/tiles/highlight_target_confirm.png`
- Generation is wired into `scripts/gen_terrain_tiles.mjs` so these are reproduced deterministically alongside the other tiles.

### NEXT
- Wire these overlays into the UI state machine (attack-range preview, attackable targets, confirm step) and ensure only one overlay layer is visible per tile at a time.

### Known limitations / TODOs
- These overlays are generated but not used by the runtime UI yet.

### Files touched
- Tools: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/highlight_attack.png`, `public/assets/tiles/highlight_move_adv.png`, `public/assets/tiles/highlight_target_confirm.png`
- Docs: `docs/progress.md`

---
## 2026-01-03 — Procedural terrain tile (INDUSTRIAL) PNG

### BEFORE
- `10 — INDUSTRIAL` existed as a prompt template (`docs/design/generation/output/terrain-10-industrial.md`) but had no corresponding generated tile asset.

### NOW
- Added a deterministic industrial tile generator that renders heavy asymmetric “equipment pad” footprint logic on the top face: chunky rectangles with offsets and dense clustering plus a few thin “service channel” lines (no icons, no texture, no lighting).
- Output is a transparent 3× tile PNG at `public/assets/tiles/terrain-10-industrial.png` (3072×3072).

### NEXT
- Implement the remaining terrain tiles (ROAD/BRIDGE/TRENCH/…) in the same flat-fill geometric language so every prompt in `docs/design/generation/output/` has a matching PNG.

### Known limitations / TODOs
- The industrial layout is procedural and may need density/placement tuning once it’s viewed alongside the full tile family.

### Files touched
- Tools: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-10-industrial.png`
- Docs: `docs/progress.md`

---

## 2026-01-04 — Light Infantry unit token PNGs (assets/)

### BEFORE
- The project had player-specific Light Infantry sprites under `public/assets/units/`, but there was no unit-token output under `/assets` and no deterministic way to reproduce the Light Infantry token art there.

### NOW
- Added a deterministic generator for Light Infantry unit tokens and generated two transparent 1024×1024 PNGs into `/assets`:
  - `assets/units/light_a.png` — neutral variant (no accent stripe)
  - `assets/units/light_b.png` — single accent stripe (Operational Blue `#1F4E79`; no red accents)
- Documented the output and regeneration command in `docs/design/generation/output/unit-light-infantry.md`.

### NEXT
- Decide whether `/assets/units/` becomes the canonical source for unit token art (and, if so, wire the runtime to consume it) or keep `/assets` as an export-only bundle while the app continues using `public/assets/`.

### Known limitations / TODOs
- This generator produces flat-fill geometric tokens (no outlines, no lighting); if higher-fidelity token art is desired later, the spec may need an explicit update.

### Files touched
- Tools: `scripts/gen_units_light_infantry.mjs`
- Assets: `assets/units/light_a.png`, `assets/units/light_b.png`
- Docs: `docs/design/generation/output/unit-light-infantry.md`, `docs/progress.md`

---

## 2026-01-04 — Stop board recentering on unit moves

### BEFORE
- The board re-centered whenever `initialPan` changed, which happened on unit moves because the median unit position shifted.

### NOW
- Recenter only happens on resize/orientation events; `initialPan` updates no longer trigger a forced recenter.

### NEXT
- If we add explicit “recenter” controls, expose a manual action rather than implicit pan changes.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/components/BoardViewport.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-04 — Avoid hydration mismatch for procedural terrain seeds

### BEFORE
- Server and client generated different initial terrain seeds, causing hydration mismatch when road/river overlays rendered.

### NOW
- Server uses a fixed seed (`1`) unless `NEXT_PUBLIC_RNG_SEED` is set; the client re-seeds after mount for randomness when no env seed is provided.

### NEXT
- If desired, expose a UI control to lock or display the current seed.

### Known limitations / TODOs
- First paint uses the deterministic seed; map changes once after hydration when randomized.

### Files touched
- UI: `src/app/page.tsx`
- Shared: `src/lib/settings.ts`
- Docs: `docs/engine.md`, `docs/progress.md`

---

## 2026-01-04 — Fix terrain seed variability and density normalization

### BEFORE
- Terrain generation always used a fixed seed and density values above 1 were effectively clamped, making reloads identical and density tweaks feel ignored.

### NOW
- Initial RNG seed is sourced from `getInitialRngSeed()` (env override or random), and terrain density values >1 are treated as percentages so tuning is respected.

### NEXT
- Decide whether map seeds should be user-configurable per match or scenario.

### Known limitations / TODOs
- Without `NEXT_PUBLIC_RNG_SEED`, reloads will vary by design.

### Files touched
- Engine: `src/lib/engine/terrain.ts`, `src/lib/engine/reducer.ts`
- Shared: `src/lib/settings.ts`
- Docs: `docs/engine.md`, `docs/roads-rivers.md`, `docs/progress.md`

---

## 2026-01-04 — Add global settings file for terrain parameters

### BEFORE
- Initial terrain density parameters lived inline in the reducer.

### NOW
- Added `src/lib/settings.ts` to hold `initialTerrainParams`, and the reducer imports from this global settings module.

### NEXT
- Centralize additional tunable defaults in the settings file as they’re introduced.

### Known limitations / TODOs
- Settings are static constants; no runtime config override yet.

### Files touched
- Engine: `src/lib/engine/reducer.ts`
- Shared: `src/lib/settings.ts`
- Docs: `docs/engine.md`, `docs/progress.md`

---

## 2026-01-04 — Shift river palette toward cyan/blue

### BEFORE
- Rivers used muted blue-green tones that read too subdued on the board.

### NOW
- Updated river colors to a more cyan/blue palette with a brighter inner band for contrast.

### NEXT
- Recheck river contrast against urban/industrial tiles once those palettes finalize.

### Known limitations / TODOs
- Palette is still flat fill only; no texture.

### Files touched
- Scripts: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/roads-rivers.md`, `docs/progress.md`

---

## 2026-01-04 — Add faint top-face slabs for road/river overlays

### BEFORE
- Road/river overlays floated visually with no subtle base plate, making them feel slightly off-center on tiles.

### NOW
- Each network overlay includes a 5% alpha top-face slab under the geometry to center and anchor the visual footprint.

### NEXT
- Re-evaluate slab opacity after more terrain types are added to ensure it stays subtle.

### Known limitations / TODOs
- Slab tint is derived from the network base color; if palettes change, re-check contrast.

### Files touched
- Scripts: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/roads-rivers.md`, `docs/progress.md`

---

## 2026-01-04 — Generate terrain networks from engine rngSeed

### BEFORE
- Road/river overlays were driven by a static UI demo layout, not by engine state.

### NOW
- Terrain networks are generated deterministically at game start using `rngSeed` and stored in `GameState.terrain`, with density parameters controlling coverage.

### NEXT
- Add gameplay rules that consume terrain once the manual’s terrain system is defined.

### Known limitations / TODOs
- Terrain generation is currently a simple random-walk layout without scenario constraints.

### Files touched
- Engine: `src/lib/engine/terrain.ts`, `src/lib/engine/gameState.ts`, `src/lib/engine/reducer.ts`
- UI: `src/components/IsometricBoard.tsx`
- Docs: `docs/engine.md`, `docs/roads-rivers.md`, `docs/progress.md`

---

## 2026-01-04 — Expand demo road/river layout for richer topology coverage

### BEFORE
- Demo network layout only showed a small L-shaped road and river, which masked the procedural variety of the generated tiles.

### NOW
- Demo layout includes straights, corners, a T-junction, and a cross so the procedural overlays are visible in-context.

### NEXT
- Validate the expanded demo layout visually and keep it updated if board dimensions change.

### Known limitations / TODOs
- Demo layout is still static and not seeded by gameplay state.

### Files touched
- UI: `src/lib/ui/networks.ts`
- Docs: `docs/roads-rivers.md`, `docs/progress.md`

---

## 2026-01-04 — Enrich road/river topology generation for stronger presence

### BEFORE
- Road and river overlays used single-strip arms, so tiles read as thin indicators despite correct perspective.

### NOW
- Network overlays are built from multi-pass, topology-aware recipes (straight, corner, T, cross) with center plates, parallel bands, and basin plates for stronger visual mass.

### NEXT
- Review additional layout variants and tweak widths if any topology still reads as too thin.

### Known limitations / TODOs
- Procedural variation is deterministic per topology; it does not yet vary by map seed.

### Files touched
- Scripts: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/roads-rivers.md`, `docs/progress.md`

---

## 2026-01-04 — Fix road/river overlays to match isometric top-face perspective

### BEFORE
- Network overlays were drawn as screen-axis rectangles, producing flat bars that did not align with the isometric tile face.

### NOW
- Network overlays are generated using top-face (s,t) rectangles aligned to the tile basis, so roads/rivers render in perspective and join cleanly across tiles.

### NEXT
- Review the demo layout for additional connector cases and verify junctions after any future palette or width tweaks.

### Known limitations / TODOs
- Requires rerunning `npm run gen:tiles` after any geometry changes.

### Files touched
- Scripts: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/roads-rivers.md`, `docs/progress.md`

---

## 2026-01-04 — Restore move-range highlight lookup in isometric board

### BEFORE
- `IsometricBoard` referenced `moveRangeKeys` without defining it, causing a runtime error when rendering unit overlays.

### NOW
- `moveRangeKeys` is reinstated so move-range checks are defined and unit opacity correctly reflects move range.

### NEXT
- Run the board view after network overlay changes to verify highlight behavior remains consistent.

### Known limitations / TODOs
- None beyond existing demo-only network data.

### Files touched
- UI: `src/components/IsometricBoard.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-04 — Add road/river network overlays (UI-only)

### BEFORE
- The board rendered only ground tiles and highlights; there were no road/river overlays or connector logic.

### NOW
- Added network overlay generation (road/river variants), a UI-only adjacency helper, and demo overlay rendering on the board with proper z-index layering.

### NEXT
- Replace the demo network layout with real map data once terrain rules are defined.

### Known limitations / TODOs
- Networks are demo-only; there is no engine terrain model yet.

### Files touched
- Scripts: `scripts/gen_terrain_tiles.mjs`, `package.json`
- UI: `src/components/IsometricBoard.tsx`, `src/lib/ui/networks.ts`
- Docs: `docs/roads-rivers.md`, `docs/progress.md`

---

## 2026-01-04 — Align highlight overlays with ground tiles

### BEFORE
- Highlight overlays were clipped to a CSS diamond, which could mismatch the actual pixel bounds of the tile art and visually scale or offset highlights against the ground tiles.

### NOW
- Highlight overlays render without additional clip paths so the art aligns directly with the cropped PNG dimensions and `TILE_LAYOUT` sizing.

### NEXT
- Re-run the tile generator and verify highlight overlays align with the ground tile on the board at the current `TILE_LAYOUT` scale.

### Known limitations / TODOs
- If future tile art adds nontransparent edges, we may need to reintroduce explicit masking at the asset-generation stage instead of CSS clipping.

### Files touched
- UI: `src/components/IsometricBoard.tsx`, `src/app/globals.css`
- Docs: `docs/progress.md`

---

## 2026-01-04 — Preserve alpha + keep uncropped tiles in temp

### BEFORE
- ImageMagick cropped outputs in-place from `public/assets/tiles` with no preserved pre-crop assets, and alpha was not explicitly enforced during extent.

### NOW
- Generator writes uncropped PNGs into `temp/`, then crops from `temp/` into `public/assets/tiles` with `-alpha set -background none -gravity North -extent 1918x1190` to preserve transparency.

### NEXT
- Validate the crop dimensions against the latest tile layout and adjust the extent if the board alignment shifts again.

### Known limitations / TODOs
- Requires ImageMagick (`convert`) installed and accessible on PATH.

### Files touched
- Scripts: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/progress.md`

---

## 2026-01-04 — Auto-crop generated tiles with ImageMagick

### BEFORE
- Tile generator wrote PNGs at the raw render size with no guaranteed crop/extent normalization.

### NOW
- Generator runs ImageMagick `convert` after writing each tile to apply a consistent `1918x1190` North-anchored extent.

### NEXT
- If tile dimensions change again, update the extent size in `scripts/gen_terrain_tiles.mjs` and regenerate assets.

### Known limitations / TODOs
- Requires ImageMagick (`convert`) to be available on PATH when running the script.

### Files touched
- Scripts: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/progress.md`

---

## 2026-01-04 — Map highlight tiles to move/target/attack states

### BEFORE
- Hover feedback tinted ground tiles with CSS, and move range highlights used a single `highlight_move.png` asset.

### NOW
- Hover uses the `highlight_move.png` overlay, move range uses `highlight_move_adv.png`, targeting uses `highlight_target_confirm.png`, and attackable tiles reuse `highlight_move_adv.png` with a fallback to `highlight_move.png` if a specific asset is missing.

### NEXT
- Add explicit target/attack reach visualization rules once line-of-sight or range modifiers are finalized.

### Known limitations / TODOs
- Attackable tiles are computed from current unit range and active effects only; no additional line-of-sight constraints exist yet.

### Files touched
- UI: `src/components/BoardViewport.tsx`, `src/components/IsometricBoard.tsx`, `src/app/page.tsx`
- Docs: `docs/board-hover.md`, `docs/progress.md`

---

## 2026-01-04 — Centralize tile layout constants for map positioning

### BEFORE
- Tile sizing and alignment used scattered constants (`TILE_W`, `TILE_H`, and origin offsets) without a single shared property group to adjust map positioning consistently.

### NOW
- Introduced `TILE_LAYOUT` in `src/lib/ui/iso.ts` to centralize tile width/height and origin Y offset, and wired `IsometricBoard` to read sizing from that shared group.

### NEXT
- If additional positioning tweaks are needed (e.g., origin offsets or scale adjustments), update `TILE_LAYOUT` once and verify board alignment.

### Known limitations / TODOs
- Only the Y origin offset is grouped so far; other per-board offsets remain in component-local calculations.

### Files touched
- UI: `src/lib/ui/iso.ts`, `src/components/IsometricBoard.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-04 — Add tile row overlap for tighter stacking

### BEFORE
- Tile rows used a fixed `TILE_H / 2` vertical step, so lower tiles did not overlap enough to cover the upper row edges.

### NOW
- Added `rowOverlap` to `TILE_LAYOUT` and applied it to board sizing and grid projection so row spacing can be tightened centrally.

### NEXT
- Tune `TILE_LAYOUT.rowOverlap` based on the cropped tile images until the overlap matches the board art.

### Known limitations / TODOs
- Overlap only affects vertical spacing; horizontal spacing remains fixed.

### Files touched
- UI: `src/lib/ui/iso.ts`
- Docs: `docs/progress.md`

---

## 2026-01-04 — Repair terrain road generation crash

### BEFORE
- `createInitialGameState()` destructured `{ road: roadSet }` from `generateRoadCells(...)`, but `generateRoadCells` actually returns a `Set<string>`. SSR/game start would throw `TypeError: undefined is not iterable` and the board could never render.

### NOW
- `generateTerrainNetworks()` calls `generateRoadCells()` directly, maps the returned `Set` into an array, and keeps the deterministic seed flow intact, so the game can now boot without the runtime crash.

### NEXT
- Audit other uses of destructured returns in `lib/engine/terrain.ts` (e.g., tributary builders and bridge helpers) to ensure future refactors keep the deterministic seed path intact.

### Known limitations / TODOs
- Road/river generation still uses the same density heuristics; additional coverage for extreme density settings (zero or near-one) should be added if we need extreme map types.

### Files touched
- Engine: `src/lib/engine/terrain.ts`
- Docs: `docs/progress.md`, `docs/engine.md`

---

## 2026-01-04 — Deterministic spawn adjustment off roads/rivers

### BEFORE
- Initial unit placements were hard-coded grid coordinates, so generated road/river cells could spawn units directly on top of terrain networks.

### NOW
- Initial placement runs a deterministic nearest-clear-cell scan from each preferred spawn, ensuring units never start on a road/river tile or overlap another unit.

### NEXT
- Add explicit “spawn zone” definitions (e.g., top/bottom bands) so future scenarios can tune where the nearest-clear search is allowed to look.

### Known limitations / TODOs
- The scan uses Manhattan-radius expansion without faction-specific zones, so on extreme maps a unit could shift further than intended if the local area is fully blocked.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`
- Engine: `src/lib/engine/reducer.ts`

---

## 2026-01-04 — River walk axis persistence + single-pass road pruning

### BEFORE
- Rivers could still form checkerboard lattices because generation relied on local turns without explicit run-length persistence.
- Road pruning already used a single pass, but the river generator did not enforce axis-run persistence in its walk logic.

### NOW
- River generation uses an explicit axis-run persistence walk (runAxis/runLen, minimum run before turns, turn probability, and anti-ABAB filter) to prevent checkerboard lattices while staying deterministic.
- Road pruning remains single-pass spur trimming (no recursive cascades), matching the non-destructive requirement.

### NEXT
- Tune `MIN_AXIS_RUN` and `TURN_PROB` if rivers are too rigid or too bendy at extreme densities.

### Known limitations / TODOs
- The river walk caps step count to avoid infinite loops; very small maps may still terminate early if no valid turns exist.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`
- Engine: `src/lib/engine/terrain.ts`

---

## 2026-01-04 — Suppress checkerboard clusters at intersections

### BEFORE
- Checkerboard artifacts still appeared around river/road intersections because local joins could complete 2x2 lattice squares.

### NOW
- River walks reject moves that would create 2x2 squares when approaching joins, and road routing penalizes 2x2 square formation, reducing checkerboard clusters at intersections.

### NEXT
- Tune square penalties if intersections become too sparse or overly straight in dense maps.

### Known limitations / TODOs
- The square avoidance uses a local 2x2 test; extremely complex junctions may still create larger grid-like clusters.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`, `docs/roads-rivers.md`
- Engine: `src/lib/engine/terrain.ts`

---

## 2026-01-04 — Add tuning TODO for checkerboard suppression

### BEFORE
- There was no in-code pointer for how to adjust checkerboard suppression if lattices persisted in road intersections.

### NOW
- Added a focused TODO next to the square-penalty logic documenting exactly which values to tweak to loosen/tighten 2x2 suppression.

### NEXT
- If checkerboards reappear, adjust the square-penalty value as described in the TODO and recheck dense intersections.

### Known limitations / TODOs
- The TODO only covers road square suppression; rivers use the 2x2 rejection in `riverWalk`, which may also need tuning if river intersections become too rigid.

### Files touched
- Docs: `docs/progress.md`
- Engine: `src/lib/engine/terrain.ts`

---

## 2026-01-04 — Add river axis persistence + single-pass road pruning

### BEFORE
- Rivers could alternate direction every tile, creating checkerboard lattices at higher densities.
- Road pruning used a recursive loop, which could cascade and delete large portions of dense road networks.

### NOW
- River A* step cost tracks axis run length and discourages premature turns plus A‑B‑A‑B alternation, producing meandering runs without checkerboards.
- Road pruning is single-pass: it trims one-tile spurs (and tiny two-tile segments) without recursive cascades.

### NEXT
- Tune axis-run penalties if river paths are too rigid or too bendy on extreme densities.

### Known limitations / TODOs
- River run-length persistence is capped for A* state size; extremely long straight runs may still be favored on wide-open maps.

### Files touched
- Docs: `docs/progress.md`, `docs/engine.md`, `docs/roads-rivers.md`
- Engine: `src/lib/engine/terrain.ts`

---

## 2026-01-04 — Guard road sampling against empty sets

### BEFORE
- The collector/local road loop sampled a random existing road cell each iteration (`parseKey([...road][rng.int(0, road.size - 1)])`), so when the arterial phase produced no paths the set was empty, `rng.int(0, -1)` returned `NaN`, and `parseKey` received `undefined`, crashing the app during SSR startup.

### NOW
- After generating arterials we add a small fallback seed (`{0,0}`/`{1,0}`) before the collector loop so the road set is never empty when we sample from it; the collector/local expansion still grows deterministically, but the runtime crash from feeding `parseKey` a missing value is gone.

### NEXT
- Introduce authenticated sampling utilities (e.g., `pickFromSetOrDefault`) so future loops can safely fall back without duplicating guard code.

### Known limitations / TODOs
- The fallback always anchors at `{0,0}`/`{1,0}`, so extreme density fiddles should still be double-checked if we expose custom board origins later.

### Files touched
- Engine: `src/lib/engine/terrain.ts`
- Docs: `docs/progress.md`, `docs/engine.md`

---

## 2026-01-05 — Add bridge overlay square tile (vector)

### BEFORE
- There was no dedicated bridge overlay tile to mark bridge cells independently of road/river tiles.

### NOW
- Added a vector bridge overlay tile (`bridge_square.svg`) with a brown, center-aligned top-face square and a faint slab for placement alignment; it can be layered transparently over existing tiles.

### NEXT
- Wire the new bridge overlay into the renderer so bridge cells get the brown square marker when present.

### Known limitations / TODOs
- The overlay is a standalone asset only; rendering logic still needs to place it on bridge cells.

### Files touched
- Assets: `public/assets/tiles/networks/bridge_square.svg`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Bridge overlay generated by tile script + single-tile render flag

### BEFORE
- Bridge overlay existed only as a hand-authored SVG and the tile generator could only render the full set.

### NOW
- `scripts/gen_terrain_tiles.mjs` generates a brown bridge center-square overlay (`bridge_square.png`) using the same top-face slab + mask pipeline as roads/rivers, and the script accepts `--only=` to render a single tile or network variant on demand.

### NEXT
- Add renderer wiring so bridge cells draw `bridge_square.png` in the board overlay layer.

### Known limitations / TODOs
- `--only=` filtering is string-based; it does not validate unknown IDs.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/progress.md`
- Removed: `public/assets/tiles/networks/bridge_square.svg`

---

## 2026-01-05 — Render bridge overlay on board

### BEFORE
- Bridge cells were not visually distinguished; only the road and river overlays rendered.

### NOW
- The board renderer overlays `bridge_square.png` on tiles where a road and river overlap, matching the engine’s bridge cells.

### NEXT
- Validate bridge overlay readability across zoom levels and adjust color/size if needed.

### Known limitations / TODOs
- Bridge detection currently relies on road+river overlap; if we later store bridges explicitly, the renderer should switch to that source of truth.

### Files touched
- UI: `src/components/IsometricBoard.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Fix river walk backtrack filter typing

### BEFORE
- The river walk backtrack filter referenced a nullable `lastDir` inside a closure, causing a TypeScript compile error.

### NOW
- The backtrack filter snapshots `lastDir` into a non-null `Dir` before filtering, removing the TS error without changing behavior.

### NEXT
- Re-run `npm run build` after the next terrain change to ensure no new strict-null errors appear.

### Known limitations / TODOs
- None.

### Files touched
- Engine: `src/lib/engine/terrain.ts`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Terrain generation moved to a web worker

### BEFORE
- Terrain networks were generated synchronously during initial game state creation, blocking the UI thread.

### NOW
- Terrain generation runs inside a dedicated web worker and the UI shows a focused “map rendering in progress” panel while the worker computes the networks. The engine bootstrap was split into deterministic deck preparation and a terrain assembly step so the worker can return `{road, river, nextSeed}` without serializing card effect functions.

### NEXT
- Add a retry path or fallback to main-thread generation if the worker fails.

### Known limitations / TODOs
- The loading overlay is informational only; it does not yet expose a cancel or retry action.

### Files touched
- Engine: `src/lib/engine/reducer.ts`, `src/lib/engine/index.ts`
- UI: `src/app/page.tsx`
- Worker: `src/workers/terrainWorker.ts`
- Docs: `docs/progress.md`, `docs/engine.md`

---

## 2026-01-05 — Remove stale bootstrapRef usage

### BEFORE
- `requestNewGame` referenced `bootstrapRef`, which had been removed, causing a runtime ReferenceError.

### NOW
- `requestNewGame` uses the local bootstrap object only; no dangling ref usage.

### NEXT
- Verify worker flow on initial load and RNG reset.

### Known limitations / TODOs
- None.

### Files touched
- UI: `src/app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Terrain loading UI now shows spinner + retry/cancel

### BEFORE
- The loading panel was static text only, and worker failures left no recovery path in the UI.

### NOW
- The loading overlay includes a `CircularProgress` spinner and ObliqueKey actions for canceling, retrying, or regenerating a new seed. Worker errors automatically fall back to main-thread terrain generation once before surfacing an error state.

### NEXT
- Add telemetry/logging around worker failures so we can see how often the fallback triggers.

### Known limitations / TODOs
- Fallback terrain generation will still block the UI if it runs, so persistent worker failures remain a performance risk.

### Files touched
- UI: `src/app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Tighten river 2x2 suppression at joins

### BEFORE
- Tributaries allowed 2x2 squares at their join cell, which could still produce checkerboard clusters where multiple rivers intersected.

### NOW
- River walks still allow joins, but they now reject any 2x2 square that would include existing river cells, preventing lattice clusters at intersections.

### NEXT
- Re-check dense river maps to confirm joins still happen reliably at high density.

### Known limitations / TODOs
- Very dense maps may see fewer tributary joins if existing river cells dominate the join area.

### Files touched
- Engine: `src/lib/engine/terrain.ts`
- Docs: `docs/progress.md`, `docs/engine.md`

---

## 2026-01-05 — Strengthen road lattice suppression without shortening routes

### BEFORE
- Road A* only applied a single 2x2 square penalty, which still allowed checkerboard clusters when routes overlapped.

### NOW
- Road routing applies a higher penalty when a 2x2 square would include existing road cells, and a lighter penalty for newly formed squares, discouraging lattices without blocking path completion.

### NEXT
- Review high-density road maps to confirm lattices are suppressed without starving coverage.

### Known limitations / TODOs
- Extreme densities may still form occasional squares if no alternative path exists.

### Files touched
- Engine: `src/lib/engine/terrain.ts`
- Docs: `docs/progress.md`, `docs/engine.md`

---

## 2026-01-05 — Expose road lattice penalties in settings

### BEFORE
- The lattice suppression penalties were hard-coded inside `terrain.ts`, making it difficult to keep worker and fallback in sync.

### NOW
- `initialTerrainSquarePenalties` in `src/lib/settings.ts` defines the “new square” and “existing square” penalties, and that object is passed through `generateTerrainNetworks` both in the worker and the fallback path so changes stay centralized.

### NEXT
- Allow these penalties to be tuned via query params or debug UI if further tweaking is needed.

### Known limitations / TODOs
- The fallback still runs on the main thread if the worker fails and uses these same penalties without additional guardrails.

### Files touched
- Config: `src/lib/settings.ts`
- Engine: `src/lib/engine/terrain.ts`, `src/lib/engine/reducer.ts`
- UI: `src/app/page.tsx`
- Worker: `src/workers/terrainWorker.ts`
- Docs: `docs/progress.md`, `docs/engine.md`

---

## 2026-01-05 — Rebuild WATER terrain tile to read as water

### BEFORE
- `terrain-06-water.png` used faint gray banding that read like generic “scanlines” instead of water.
- Terrain tiles are generated assets but are not wired into the runtime board yet, so this tile wasn’t providing any usable “water” read in-game.

### NOW
- `makeTileWater1024()` uses an opaque pale-blue slab plus deterministic “current lanes” and hard-edged highlight rails (no curves/no gradients), so the asset reads as water while staying in the Brutalist Constructivism language.

### NEXT
- Wire terrain tiles into the board renderer (choose how terrain data maps to `terrain-*.png`), then verify readability alongside river overlays and units at normal zoom.

### Known limitations / TODOs
- Water currently uses a single fixed palette; if we introduce biome palettes later, this should become configurable (still deterministic).
- This is an asset-only change until terrain rendering is implemented in the UI.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-06-water.png`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Rework FOREST terrain tile to read as vegetation mass

### BEFORE
- `terrain-03-forest.png` rendered as scattered gray “barcode” fragments that didn’t communicate forest/vegetation.
- Terrain tiles are generated assets but are not wired into the runtime board yet, so this was purely an offline asset issue.

### NOW
- `makeTileForest1024()` renders clustered canopy plates in restrained field-green tones with sparse trunk marks and a few explicit clearings (all hard-edged, no curves/no gradients) so the tile reads as forest in the project’s diagram style.
- Adjusted the forest grid coverage and added a deterministic NE-edge fill guard so the canopy reaches the slab edges consistently (fixes the “north-east not stretched” gap).

### NEXT
- Once terrain rendering is wired into the UI, validate that forest contrast stays subordinate to units and does not clash with road/river overlays.

### Known limitations / TODOs
- Forest uses a fixed palette and cluster layout seed; if/when biome palettes exist, this should become configurable while remaining deterministic.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-03-forest.png`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Rework INDUSTRIAL terrain tile to read as a facility slab

### BEFORE
- `terrain-10-industrial.png` used low-contrast gray fragments that didn’t read as a distinct “industrial facility” surface.
- Terrain tiles are generated assets but are not wired into the runtime board yet, so this was an offline asset issue.

### NOW
- `makeTileIndustrial1024()` renders a structured facility footprint: a darker pad field, two long bays, a heavy core block, service cutouts, perimeter seams, paired rail channels, and sparse bolt/vent marks (flat plates only; no curves/no gradients).

### NEXT
- Once terrain rendering is wired into the UI, verify this doesn’t compete with unit silhouettes and still reads under overlays.

### Known limitations / TODOs
- Industrial palette is fixed; if we introduce palette theming later, keep it deterministic and configurable.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-10-industrial.png`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Ensure terrain biome generation always produces some FOREST

### BEFORE
- With `NEXT_PUBLIC_TERRAIN_DEBUG=true`, some seeds/boards could produce **zero** `FOREST` cells after smoothing + minimum-region pruning, making the map look like it “never” contains forest in debug.

### NOW
- `generateTerrainBiomes()` applies a deterministic “forest presence guard”: if the biome grid ends up with 0 `FOREST`, it seeds at least one forest cell and grows/backfills a small cluster near the highest-moisture area (avoiding protected types and road/river cells).
- `createInitialGameState()` now mirrors the worker/UI bootstrap by generating both networks and biomes (so any non-worker code path gets the same biome behavior).

### NEXT
- Tune biome thresholds once terrain affects gameplay (movement/LOS), but keep generation deterministic and UI-agnostic.

### Known limitations / TODOs
- This guard is only a minimum; it does not attempt to hit a target forest percentage.

### Files touched
- Engine: `src/lib/engine/terrain.ts`, `src/lib/engine/reducer.ts`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Ensure biome generator always produces ROUGH / HILL too

### BEFORE
- Even after the forest guard, the default bootstrap seed pipeline could still yield `ROUGH: 0` and `HILL: 0` consistently (and forest could be too small to notice), making terrain debug look like those biomes “never happen”.

### NOW
- `generateTerrainBiomes()` enforces minimum counts for `FOREST`, `ROUGH`, and `HILL` by deterministically assigning the top-scoring interior `PLAIN` cells (moisture for forest, elevation for rough/hill), while still avoiding protected types and road/river cells.
- With `NEXT_PUBLIC_TERRAIN_DEBUG=true`, terrain generation runs on the main thread (skips the worker) so debug counts/tiles don’t get “stuck” on stale worker bundles during dev iteration.

### NEXT
- When terrain impacts rules (movement/LOS), revisit this “minimum variety” rule and replace it with manual-driven gameplay requirements.

### Known limitations / TODOs
- These minimums are for visual/debug variety and do not ensure coherent large regions.

### Files touched
- Engine: `src/lib/engine/terrain.ts`
- UI: `src/app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Promote terrain debug palette into semantic colors

### BEFORE
- Terrain debug colors existed only inside `src/lib/ui/terrain.ts`, so other UI surfaces couldn’t reuse the same palette consistently.

### NOW
- The terrain debug palette lives in `src/lib/ui/semanticColors.ts` (`terrainDebugColors`) and `src/lib/ui/terrain.ts` consumes it for `TERRAIN_DEBUG_COLORS`.

### NEXT
- Use `terrainDebugColors` anywhere we need consistent biome visualization (legends, debug overlays, tooling).

### Known limitations / TODOs
- This is dev-only presentation; it does not affect gameplay rules.

### Files touched
- UI: `src/lib/ui/semanticColors.ts`, `src/lib/ui/terrain.ts`
- Docs: `docs/progress.md`

---

## 2026-01-05 — Add deterministic terrain biomes + tile rendering

### BEFORE
- The runtime board rendered a single `ground.png` everywhere; roads/rivers were present but base terrain types were not generated or displayed.
- Terrain noise, settlements, and cleanup rules did not exist, so no coherent biome regions were possible.

### NOW
- A deterministic biome generator assigns PLAIN/ROUGH/FOREST/URBAN/INDUSTRIAL/HILL/WATER per cell using seeded scalar fields, river/road inputs, settlement clusters, and cleanup passes.
- The isometric board renders per-cell terrain tiles (`terrain-*.png`) with roads/rivers/bridges layered on top.
- A dev-only terrain debug overlay + stats output can be enabled with `NEXT_PUBLIC_TERRAIN_DEBUG=true`.

### NEXT
- Tune biome thresholds against real playtests and decide how terrain types affect movement/combat rules.

### Known limitations / TODOs
- Terrain effects are visual-only; movement and combat ignore terrain modifiers.
- Biome thresholds are tuned for 20×30 and may need scaling rules for other map sizes.

### Files touched
- Engine: `src/lib/engine/terrain.ts`, `src/lib/engine/gameState.ts`, `src/lib/engine/reducer.ts`
- UI: `src/components/IsometricBoard.tsx`, `src/app/page.tsx`, `src/lib/ui/terrain.ts`
- Worker: `src/workers/terrainWorker.ts`
- Docs: `docs/engine.md`, `docs/terrain-tiles.md`, `docs/progress.md`

---

## 2026-01-05 — Suppress biome tiles under road/river overlays

### BEFORE
- Road and river cells could still render non-plain biome tiles (e.g., forest/rough/water), which made overlays look busy.

### NOW
- Road and river cells are forced back to `PLAIN` after biome generation so network overlays remain clean and legible.

### NEXT
- Reassess biome coverage targets once the simplified overlay baseline is validated in playtests.

### Known limitations / TODOs
- Water still appears adjacent to rivers via controlled widening; only the river cells themselves are forced to `PLAIN`.

### Files touched
- Engine: `src/lib/engine/terrain.ts`
- Docs: `docs/engine.md`, `docs/terrain-tiles.md`, `docs/progress.md`

---

## 2026-01-06 — Card draw overlay reveal + tween

### BEFORE
- Drawing a card updated the pending card panel instantly with no reveal or motion cue.

### NOW
- Drawing a card triggers a floating command-console header plus a huge centered card render while the rest of the UI stays visible.
- The card snaps into the pending card slot via a deterministic tween (or a short static reveal with reduced motion).
- The overlay uses only hard-edged frames/plates and flat fills in compliance with the UI doctrine.
- Timing is adjustable via `cardDrawOverlayTiming` in `src/lib/settings.ts`.
- The pending card art swaps to a blank placeholder while the overlay is active to avoid double renders.
- The tween now scales uniformly to avoid horizontal squeezing before the slot swap.
- Added a 300ms flat-color flash (black → white → red) at reveal start, skipped when reduced motion is enabled.

### NEXT
- Add an optional "skip reveal" interaction for power users if the animation ever feels too slow.

### Known limitations / TODOs
- If the pending card slot is not visible (mobile console closed), the overlay clears without a tween target.
- The reveal is visual-only and does not block gameplay state changes beyond its short on-screen duration.

### Files touched
- UI: `src/app/page.tsx`, `src/components/OpsConsole.tsx`, `src/components/ui/CardDrawOverlay.tsx`, `src/lib/ui/CardArt.tsx`
- Docs: `docs/card-draw-overlay.md`, `docs/progress.md`

---

## 2026-01-06 — Terrain tile tops from SVG sources

### BEFORE
- Terrain tiles used procedural top-face patterns baked directly in `scripts/gen_terrain_tiles.mjs`.
- Each terrain type had its own bespoke top-face drawing logic and color recipes.

### NOW
- Terrain top designs are loaded from square SVGs in `temp/terrain-tops/` and projected onto the isometric top face.
- All terrain tiles share a single extruded base (side faces + neutral top slab), with the SVG artwork providing the unique surface look.

### NEXT
- Validate the perspective mapping against the authored SVGs and adjust the source art if any edges feel clipped or stretched.

### Known limitations / TODOs
- The generator assumes ImageMagick `convert` is available to rasterize SVGs.
- Top textures are sampled nearest-neighbor; if banding appears, add optional bilinear sampling.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/terrain-tiles.md`, `docs/progress.md`

---

## 2026-01-06 — Refresh urban + industrial tile tops

### BEFORE
- Urban tiles showed missing dark blocks on one axis, and the industrial top used the prior SVG design.

### NOW
- Regenerated `terrain-04-urban.png` and `terrain-10-industrial.png` from the updated SVG sources in `temp/terrain-tops/` (`base_04-urban.svg` and `base_10-industrial.svg`).

### NEXT
- Review the new tiles at board zoom and adjust the source SVGs if any elements still clip at the isometric edges.

### Known limitations / TODOs
- Tile generation still depends on ImageMagick `convert` for SVG rasterization.
- Urban tops that hug the square edges may still require source padding if clipping persists.

### Files touched
- Assets: `public/assets/tiles/terrain-04-urban.png`, `public/assets/tiles/terrain-10-industrial.png`
- Generator: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/terrain-tiles.md`, `docs/progress.md`

---

## 2026-01-06 — Center/pad SVG tops before projection

### BEFORE
- Urban tops could lose edge rectangles if the SVG viewport wasn’t perfectly centered or padded.

### NOW
- SVG rasterization centers and pads to the target square size before projection, preventing edge clipping for urban tops.

### NEXT
- Verify the updated urban tile against the new SVG and adjust the source art if any shapes still fall outside the safe region.

### Known limitations / TODOs
- ImageMagick `convert` is still required for SVG rasterization.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/terrain-tiles.md`, `docs/progress.md`

---

## 2026-01-06 — Trim SVG tops before projection

### BEFORE
- Urban tops that included translated layers could still clip because the SVG viewBox did not bound the artwork.

### NOW
- SVG rasterization trims to the artwork bounds, then centers and pads to the target square size before projection.

### NEXT
- Confirm all SVG sources use consistent margins so trimming does not hide intended edge touches.

### Known limitations / TODOs
- ImageMagick `convert` remains a required dependency for rasterization.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/terrain-tiles.md`, `docs/progress.md`

---

## 2026-01-06 — Re-export urban top (centered)

### BEFORE
- The urban top projection used an older SVG that left the central block offset.

### NOW
- Regenerated `terrain-04-urban.png` from the simplified, centered `base_04-urban.svg`.

### NEXT
- Review the urban tile at board zoom and confirm the center block alignment.

### Known limitations / TODOs
- ImageMagick `convert` remains required for SVG rasterization.

### Files touched
- Assets: `public/assets/tiles/terrain-04-urban.png`
- Generator: `scripts/gen_terrain_tiles.mjs`
- Docs: `docs/progress.md`

---

## 2026-01-06 — Mask urban top background fill

### BEFORE
- The urban SVG included the base slab fill, which projected as unintended stripes on the isometric top.

### NOW
- The generator masks the urban base fill color (`#d2d2cb`) so only the grid + block elements render on the slab.

### NEXT
- If other tops include base fills, decide whether they should be masked similarly or baked into the SVG.

### Known limitations / TODOs
- Masking uses a small RGB tolerance; if the SVG colors drift, update the mask color list.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-04-urban.png`
- Docs: `docs/terrain-tiles.md`, `docs/progress.md`

---

## 2026-01-06 — Nudge urban top alignment

### BEFORE
- The urban center block drifted slightly toward the SE after projection.

### NOW
- Applied a small sampling offset in the urban projection so the center block aligns correctly.

### NEXT
- Confirm alignment at board zoom and tune the offset if the SVG is updated again.

### Known limitations / TODOs
- Offset is hard-coded for urban; if the source art changes significantly, retune it.

### Files touched
- Generator: `scripts/gen_terrain_tiles.mjs`
- Assets: `public/assets/tiles/terrain-04-urban.png`
- Docs: `docs/terrain-tiles.md`, `docs/progress.md`

---

## 2026-01-07 — Board hover performance pass

### BEFORE
- Hovering the map triggered full-page rerenders and rebuilt the isometric tile layer on every pointer move, which caused visible stutter and delayed rollover in other UI.

### NOW
- Hover state is localized inside a new `BoardSurface` wrapper so pointer moves no longer rerender the entire page.
- Hover updates are throttled to animation frames, reducing per-move work while keeping the highlight responsive.
- The isometric board caches terrain tiles, overlays, highlights, and units so hover changes only update the hover layer.

### NEXT
- Profile pan/zoom on low-end devices and consider virtualization or canvas rendering if terrain sizes increase.

### Known limitations / TODOs
- Hover rendering still uses DOM image layers; very large boards may still need a deeper rendering pipeline change.

### Files touched
- Docs: `docs/progress.md`
- UI: `src/app/page.tsx`, `src/components/BoardSurface.tsx`, `src/components/IsometricBoard.tsx`

---

## 2026-01-07 — Fix JSX namespace typing in board renderer

### BEFORE
- `IsometricBoard` used `JSX.Element[]`, which failed to typecheck in the current TS configuration.

### NOW
- `IsometricBoard` uses `ReactElement[]` from `react` for the tile array type, restoring `tsc` compatibility.

### NEXT
- Re-run the TypeScript check after any future TS config changes that may affect JSX typing.

### Known limitations / TODOs
- None.

### Files touched
- Docs: `docs/progress.md`
- UI: `src/components/IsometricBoard.tsx`

---

## 2026-01-08 — Scatter placement onto plain tiles

### BEFORE
- Armies always started on the tight center columns and the nearest-clear scan could land a unit on roads, rivers, or other biomes, so the opening fight felt constrained and sometimes placed forces on impossible tiles.

### NOW
- The reducer now jitters every anchor column/row by the seeded scatter radii (`bootstrapUnitPlacement.columnScatter` / `.rowScatter`), feeding that same LCG stream into `findNearestClearCell`.
- Unit placement will reject any tile whose biome is not `PLAIN`, so every army member now starts on plain ground even when the anchor is near a river or road.

### NEXT
- Explore whether scenario presets should swap the scatter radii or whether we should add additional anchors to push the units toward specific terrain features without breaking determinism.

### Known limitations / TODOs
- The scatter still begins from the original anchor rows, so extremely blocked center columns may still push the entire line en masse; future work could add mirror anchors or multiple candidate rows.

### Files touched
- Engine: `src/lib/engine/reducer.ts`, `src/lib/settings.ts`
- Docs: `docs/engine.md`, `docs/progress.md`

---

## 2026-01-08 — Radial move range + scale pulse

### BEFORE
- Movement highlights covered a square (Chebyshev) range and only faded in/out, so the possible moves looked boxy and the pulse felt flat.

### NOW
- Movement range uses Manhattan distance again, producing a radial diamond around the unit for both highlight and legality checks.
- The highlight pulse now scales in/out while fading, and reduced-motion disables the animation.

### NEXT
- Evaluate whether terrain or card effects should override the radial range shape (e.g., road-based boosts) without breaking determinism.

### Known limitations / TODOs
- The pulse still uses a simple 1s step animation; if it feels too harsh, we can switch to a brief eased keyframe set.

### Files touched
- Engine: `src/lib/engine/reducer.ts`, `src/lib/engine/movement.ts`
- UI: `src/app/globals.css`
- Docs: `docs/engine.md`, `docs/progress.md`

---

## 2026-01-08 — Highlight pulse settings

### BEFORE
- The move highlight pulse used hard-coded timing and easing in CSS, so tuning required editing `globals.css` directly.

### NOW
- Added `moveHighlightPulse` to `src/lib/settings.ts` and wired CSS variables through `BoardSurface`, so pulse duration and easing (plus scale/opacity bounds) are adjustable via settings.

### NEXT
- Decide whether to expose these settings in a debug UI panel for on-the-fly tuning.

### Known limitations / TODOs
- These values are applied to all highlight types via the shared `.moveHighlight` class; per-mode tuning would need additional CSS variables.

### Files touched
- UI: `src/components/BoardSurface.tsx`, `src/app/globals.css`
- Settings: `src/lib/settings.ts`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Radial move sweep (no per-tile scale pulse)

### BEFORE
- Move highlights used a per-tile scale pulse driven by CSS, so the animation read as a single tile breathing instead of a ring expanding around the unit.

### NOW
- Move highlights fade in from 0 opacity by Manhattan-distance ring, driven by a sweep radius that expands and contracts across the reachable tiles.
- Removed the CSS scale/opacity pulse so highlights no longer shrink/expand per tile; reduced-motion locks the sweep to the full range.
- Added a short hold at max sweep distance so the outer ring reads before contracting.

### NEXT
- Tune sweep timing and max opacity once we test on larger move ranges and dense terrain.

### Known limitations / TODOs
- The sweep is based on Manhattan distance, not exact path cost; blocked tiles inside the range will still appear if they are already included in `moveRange`.

### Files touched
- UI: `src/components/IsometricBoard.tsx`, `src/app/globals.css`, `src/components/BoardSurface.tsx`
- Settings: `src/lib/settings.ts`, `src/types/settings.ts`
- Docs: `docs/isometric.md`, `docs/progress.md`

---

## 2026-01-09 — Configurable base movement by unit type

### BEFORE
- Base movement values lived inside the reducer and could not be tuned without editing engine code.

### NOW
- Base movement per unit type is defined in settings (`initialUnitMovementByType`) and consumed by the reducer for unit stats.

### NEXT
- Replace placeholder values with the manual-aligned movement stats once the unit taxonomy is finalized.

### Known limitations / TODOs
- Attack values are still hard-coded in the reducer and not configurable via settings yet.

### Files touched
- Engine: `src/lib/engine/reducer.ts`
- Settings: `src/lib/settings.ts`, `src/types/settings.ts`
- Docs: `docs/engine.md`, `docs/progress.md`

---

## 2026-01-09 — Configurable base attack by unit type

### BEFORE
- Base attack values lived inside the reducer and could not be tuned without editing engine code.

### NOW
- Base attack per unit type is defined in settings (`initialUnitAttackByType`) and consumed by the reducer for unit stats.

### NEXT
- Replace placeholder values with the manual-aligned attack stats once the unit taxonomy is finalized.

### Known limitations / TODOs
- Manual hit modifiers by range are still not implemented.

### Files touched
- Engine: `src/lib/engine/reducer.ts`
- Settings: `src/lib/settings.ts`, `src/types/settings.ts`
- Docs: `docs/engine.md`, `docs/progress.md`

---

## 2026-01-09 — Data-driven terrain rules (movement + combat)

### BEFORE
- Terrain, roads, and rivers were visual-only; movement range used a simple Manhattan radius and combat ignored terrain entirely.

### NOW
- Added a data-driven terrain rule system with terrain/overlay/connector definitions and generic movement/combat resolvers.
- Movement range is costed per tile, applying overlay modifiers and bridge overrides without terrain-specific engine logic.
- Combat rolls apply terrain-based modifiers (attacker/defender terrain) before resolving HIT/MISS.

### NEXT
- Add card effects that temporarily override terrain rules (e.g., frozen rivers) using the same modifier pipeline.

### Known limitations / TODOs
- Combat modifiers affect roll results but do not yet incorporate line-of-sight overlays or unit abilities beyond tags.

### Files touched
- Engine: `src/lib/engine/terrainRules.ts`, `src/lib/engine/movement.ts`, `src/lib/engine/reducer.ts`
- Settings: `src/lib/settings.ts`, `src/types/settings.ts`
- Tests: `src/lib/engine/__tests__/terrainRules.test.ts`, `vitest.config.ts`
- Docs: `docs/engine.md`, `docs/terrain-rules.md`, `docs/progress.md`
- Tooling: `package.json`, `package-lock.json`, `AGENTS.md`
---

## 2026-01-09 — Manual markdown polish

### BEFORE
- `docs/Taktik_Manual_EN.md` used inline escapes, stray numbering, and inconsistent section structure that made the manual harder to scan and reference from the code/system requirements.

### NOW
- Rebuilt the manual with clear Markdown headings, grouped subsections, numbered victory conditions, structured tables, and consistent lists so each rule block is easier to read and validate.

### NEXT
- Review the refreshed manual against the engine and card rules to ensure nothing was lost in the formatting update and capture any missing clarifications in the manual or docs.

### Known limitations / TODOs
- The rewrite focused only on formatting; the underlying content still needs manual verification against the latest engine behavior.

### Files touched
- Docs: `docs/progress.md`, `docs/Taktik_Manual_EN.md`

---

## 2026-01-09 — Move/Attack key refresh

### BEFORE
- The MOVE and ATTACK keys used vector cutouts, making them visually distinct from NEXT PHASE/END TURN and harder to align with the command-grid styling.

### NOW
- Refreshed the MOVE/ATTACK keys so they use the same ObliqueKey treatment as NEXT PHASE/END TURN (no cutouts) while keeping the blue/red tones and introducing `KeyboardDoubleArrowRight`/`ElectricBolt` icons on both the header and the edge dock commands.

### NEXT
- Verify the icon styling on narrow screens to make sure the command grid stays stable and the icons do not overlap the text.

### Known limitations / TODOs
- None beyond the potential mobile spacing validation.

### Files touched
- UI: `src/components/CommandHeader.tsx`, `src/app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Next/End icon alignment

### BEFORE
- NEXT PHASE and END TURN used plain text glyphs while other action keys used MUI icons, creating a mixed visual language in the command grid and edge dock.

### NOW
- Added `PlayCircleOutline` and `StopCircle` start icons to NEXT PHASE and END TURN in both the command header and the edge command dock, matching the ObliqueKey styling used by MOVE/ATTACK while keeping existing tones.

### NEXT
- Quick pass on small-screen layouts to ensure the new icons don’t crowd the labels.

### Known limitations / TODOs
- None beyond the pending small-screen verification.

### Files touched
- UI: `src/components/CommandHeader.tsx`, `src/app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Oblique icon fix

### BEFORE
- ObliqueKey skewed the start/end icons, so the new NEXT/END icons appeared slanted even though the labels remained straight.

### NOW
- Wrapped start/end icons in a counter-skew container inside `ObliqueKey`, keeping icons upright while the key frame retains its oblique silhouette.

### NEXT
- Visual check on all icon-bearing keys to confirm upright rendering across sizes.

### Known limitations / TODOs
- None; relies on CSS transforms only.

### Files touched
- UI: `src/components/ui/ObliqueKey.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Mobile header stats overlay

### BEFORE
- On mobile, the VP/TURN/PHASE row remained in the sticky header, making the values disappear once the header scrolled offscreen.

### NOW
- When the layout is mobile (`isNarrow` + not `landscapeMode`), a pointer-events-none overlay in the board’s bottom-right duplicates the VP, turn, and phase capsules with the same values and padding, keeping the status visible even while the map fills the screen.

### NEXT
- Confirm the overlay behaves well when the mobile console/dock is visible so it never obscures urgent controls.

### Known limitations / TODOs
- The overlay is read-only (pointer-events are disabled) and will need revisiting if we ever want it interactive.

### Files touched
- UI: `src/app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Phase status strip component

### BEFORE
- The VP/TURN/PHASE capsules were assembled inline in multiple places, and the overlay padding drifted from the header’s spacing, leading to inconsistent capsule gutters.

### NOW
- Added a reusable `PhaseStatusStrip` component with consistent padding/gap rules and used it for the mobile overlay; the header now hides the strip on mobile and keeps the status in the overlay only.

### NEXT
- Validate the strip’s spacing on both mobile and desktop sizes, especially when phase names shorten.

### Known limitations / TODOs
- The component is UI-only; if VP becomes dynamic later, we’ll still need a data source for it.

### Files touched
- UI: `src/components/ui/PhaseStatusStrip.tsx`, `src/components/CommandHeader.tsx`, `src/app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Mobile phase control overlay

### BEFORE
- NEXT PHASE and END TURN remained in the header on mobile, while the status strip was moved onto the board, leading to split control surfaces.

### NOW
- On mobile only, NEXT PHASE and END TURN are rendered as a top-left board overlay (no extra panel framing), and the header hides those controls to keep the map the primary surface.

### NEXT
- Validate that the overlay does not conflict with terrain debug panels or other top-left overlays.

### Known limitations / TODOs
- The overlay uses small keys; revisit spacing if additional mobile buttons are introduced.

### Files touched
- UI: `src/components/CommandHeader.tsx`, `src/app/page.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Hide mobile panels during map render

### BEFORE
- On mobile during initial terrain generation, console and dock panels could appear or auto-open, causing the layout to look garbled while the map was still rendering.

### NOW
- Mobile console/dock panels stay hidden until the terrain is ready; console toggles and auto-open behaviors are suppressed during rendering, and the header action panels plus status strip remain hidden until the map is ready to avoid stacked UI noise. Terrain generation now starts after a 1s delay so the initial mobile layout settles before the render worker spins up.
 - On mobile, the entire header (including the phase ruler) stays hidden until terrain is ready so the map render overlay is the only visible UI during boot.
 - Mobile breakpoints now treat the UI as “narrow” until media queries resolve, preventing a desktop-first render that flashes header/panels before hydration.
 - During terrain boot, the header and side console are suppressed across all layouts so only the map render overlay is visible until the map is ready.
- Once terrain is ready, the header, overlays, and desktop console fade in with a short opacity transition to avoid a hard snap-in.
- The fade-in duration is now fixed at 400ms via `uiRevealMs` in the page component so the reveal feels deliberate.

### NEXT
- Re-check the first-load experience on both portrait and landscape mobile layouts to confirm the render overlay is the only visible panel.

### Known limitations / TODOs
- The console remains closed until terrain is ready; if we later need pre-render diagnostics, we may need a separate debug toggle.

### Files touched
- UI: `src/app/page.tsx`, `src/components/CommandHeader.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Mobile move/attack stacking

### BEFORE
- MOVE and ATTACK keys overlapped on very small screens because the two-column grid did not leave enough width for the oblique buttons.

### NOW
- Switched the command row to explicit grid columns: mobile uses 7/5 and hides the right-side phase controls entirely; desktop uses 4/4/4.

### NEXT
- Verify the new column ratios on a variety of device widths to ensure the action row never overlaps.

### Known limitations / TODOs
- The stacked layout increases header height on very small screens; revisit if it crowds other controls.

### Files touched
- UI: `src/components/CommandHeader.tsx`
- Docs: `docs/progress.md`

---

## 2026-01-09 — Terrain system contract

### BEFORE
- The manual described terrain effects in prose without stating the structured layers or design contract that the engine relies on.

### NOW
- Added explicit Tile Layers (Base Terrain, Overlays, Connectors) in Section 2 and described how each layer contributes movement/combat modifiers.
- Replaced the Movement/Combat section with an additive rule pipeline and documented the Terrain Overlays + Bridge Connectors behaviors so designers know where to plug new features.
- Added the Design Contract to forbid implementation-breaking rewrites and keep new terrains/configurations modular.

### NEXT
- Review the engine configuration and terrain rule sources so the manual and code stay aligned, and capture any new overlays/connectors that emerge from ongoing features.

### Known limitations / TODOs
- The entry focuses on the manual language; the engine still needs explicit reference tables for overlays or connectors beyond the current ones.

### Files touched
- Docs: `docs/progress.md`, `docs/Taktik_Manual_EN.md`

---

## 2026-01-09 — Board FX animations (attack/effects/move slide)

### BEFORE
- Attacks and effects used static board highlights only; no aim/lock line, tracer, impact, or resolve feedback.
- Unit positions snapped instantly with no movement slide.
- Effect application had no visual acknowledgement on the board.

### NOW
- Added a dedicated board FX layer that renders attack aim/lock, tracer + impact flashes on roll, and a resolve marker on attack completion (even if the target unit disappears).
- New active effects now trigger a short yellow pulse on affected units for immediate feedback.
- Unit sprites slide between tiles using linear left/top transitions when motion is allowed; reduced-motion keeps movements static.
- Attackable tiles now use the attack highlight asset for clearer semantic color.

### NEXT
- Validate FX timing/legibility on larger boards and at different zoom levels; tune sizes if needed.

### Known limitations / TODOs
- FX timing is currently token-based; may need per-phase tuning once we start polishing VFX balance.

### Files touched
- UI: `src/components/BoardFxLayer.tsx`, `src/components/IsometricBoard.tsx`
- Docs: `docs/progress.md`, `docs/manual-e2e-test.md`, `docs/README.md`, `docs/meta/DOCS_INDEX.md`
