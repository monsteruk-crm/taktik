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

---

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

### Files touched
- Docs: `docs/progress.md`, `docs/board-hover.md`
- UI: `components/BoardViewport.tsx`, `components/IsometricBoard.tsx`, `app/page.tsx`

---

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
