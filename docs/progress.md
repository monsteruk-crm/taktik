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
