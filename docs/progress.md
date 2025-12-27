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
