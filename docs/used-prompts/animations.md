### TASK
Implement a **generic, “ops-room” board animation system** for TAKTIK that adds:
1) a **cool, reusable attack animation** (unit → unit),
2) **generic “unit affected” pulses** when cards/tactics apply effects to units,
3) (bonus, if clean) **unit movement slide** when a unit moves.

This is **UI/UX only**: do not change engine logic or gameplay rules.

---

### CONSTRAINTS
- Follow repo contracts + UI doctrine:
    - `AGENTS.md` (esp. UI + docs requirements)
    - `docs/design/UI_GLOBAL_RULES.md` (flat, hard-edged, opaque panels; motion is mechanical)
    - `docs/design/brutalist_constructivism_locked_ai_prompt_system.md` and `docs/design/brutalist_constructivism_visual_style_bible_markdown.md`
- **No new gameplay state** in the engine. No reducer/phase sequencing changes.
- **No new animation libraries** (no framer-motion). Use **CSS keyframes / transitions** only.
- **No gradients, glow, blur, soft shadows, rounded corners.**
- **No layout shift**. FX must be absolute-position overlays inside the board transform container.
- Respect `prefers-reduced-motion` (use existing `useReducedMotion()` or media query).
- Use semantic colors (`src/lib/ui/semanticColors.ts`): MOVE blue, ATTACK red, DICE/cards yellow.
- Keep perf sane: do not animate via per-frame React state; prefer CSS animations + timeouts.

---

### FILES TO READ (max 8)
1. `AGENTS.md`
2. `docs/design/UI_GLOBAL_RULES.md`
3. `src/components/IsometricBoard.tsx`
4. `src/components/BoardViewport.tsx`
5. `src/app/page.tsx` (for phase/attack flow + pendingAttack/lastRoll)
6. `src/lib/ui/iso.ts` (grid→screen math)
7. `src/lib/ui/motion.ts` (reduced motion + duration tokens)
8. `src/lib/ui/semanticColors.ts`

---

### IMPLEMENTATION PLAN
#### A) Add a dedicated FX layer component (board-space overlay)
Create `src/components/BoardFxLayer.tsx` (or `src/components/fx/BoardFxLayer.tsx`) that renders **ephemeral FX** aligned to the isometric board’s coordinate system.

**Props (suggested):**
- `state: GameState` (read-only)
- `originX: number`, `originY: number`
- `tileW: number`, `tileH: number`
- `unitOffsetY: number` (match `IsometricBoard`’s `UNIT_OFFSET_Y`)
- `reducedMotion: boolean`

**Core idea:**
- Maintain a small internal list: `fxItems: FxItem[]`
- Add new items when game state transitions happen:
    - pendingAttack becomes non-null → show *aim/lock* overlay
    - lastRoll transitions null→value → spawn *shot/tracer + impact* overlay
    - pendingAttack transitions non-null→null (resolve) → spawn *result marker* (HIT/MISS), using a stored snapshot so it works even if target unit disappears
    - activeEffects gains new effect(s) → spawn *unit affected pulse(s)* on target units

Use `setTimeout` to remove ephemeral FX after a short duration. No RAF loops.

**Snapshot requirement (important):**
When `pendingAttack` is set, store a ref snapshot:
- attackerId/targetId
- attackerPos/targetPos (grid)
- attackerAnchor/targetAnchor (board pixels)
  So “resolve HIT” can still render a kill marker even though the target unit is removed from `state.units`.

Anchor math:
- Tile center in board pixels is `(originX + sx, originY + sy)` using `gridToScreen`.
- Unit “foot” anchor should match current sprite placement:
    - `anchorX = originX + sx`
    - `anchorY = originY + sy + UNIT_OFFSET_Y`
      (Keep it consistent with `IsometricBoard`’s unit positioning.)

---

#### B) Attack FX sequence (generic unit → unit)
**1) Aim / lock (while `state.pendingAttack` exists)**
Render:
- A **thick red vector line** attacker→target (solid, hard-edged).
- A **target bracket/diamond** at the target tile.

Implementation options (pick one, keep simple):
- **SVG** with a `<line>` + a small diamond `<rect transform="rotate(45)" ...>`; or
- **Rotated rectangle div** for the line + existing tile highlight asset for the target.

Style rules:
- Flat fill only.
- Mechanical: no bounce/elastic.
- Prefer `linear` timing if anything animates.

**2) Shot/tracer (on `lastRoll` appearing)**
Spawn a short-lived tracer:
- A red line that “writes on” from attacker→target via `scaleX` from 0→1 (transform-origin at attacker).
- A brief **muzzle flash** (tiny red/ink diamond) at attacker for ~90ms.
- An **impact flash** at target (hard-edged diamond/ring) for ~140–200ms.

Outcome logic:
- For HIT: impact/kill marker uses ATTACK red (+ optional ink outline).
- For MISS: impact marker is neutral/ink (avoid introducing new accent colors).

Reduced motion:
- Skip tracer motion; show a single, fast opacity flash at target and (optionally) attacker.

**3) Resolve marker (on pendingAttack clearing)**
After `RESOLVE_ATTACK`, render a short marker at target position using the stored snapshot:
- HIT → big red X (two rectangles crossing) + quick fade-out
- MISS → small “MISS” capsule or an ink bracket flash (keep it operational, not playful)

This marker must work even if the unit already disappeared.

---

#### C) “Unit affected” FX (cards/tactics/effects)
When `state.activeEffects` gains new effect(s):
- For each new `effect.targetUnitIds`, spawn a **yellow pulse** on those units:
    - Use existing tile highlight PNG (`/assets/tiles/highlight_target_confirm.png`) OR draw a diamond in CSS/SVG.
    - Animate `transform: scale(0.85 → 1.05)` + opacity `1 → 0` over ~200ms, linear.

Do NOT invent effect semantics. This is purely “something applied here” feedback.

Reduced motion: no scaling; just a brief opacity flash.

---

#### D) Bonus: movement slide animation (unit reposition)
In `IsometricBoard.tsx`, make units slide when their `left/top` changes:
- Add `transition: left 200ms linear, top 200ms linear` when NOT reduced motion.
- Keep `pointerEvents: none`.
- Ensure it doesn’t animate on initial mount in a weird way (usually OK, but if it does, gate transitions behind a `hasMountedRef`).

---

### INTEGRATION POINTS
- Update `src/components/IsometricBoard.tsx`:
    - Import and render `<BoardFxLayer />` **above tiles/highlights** and preferably **above units** (or split: aim line below units, impact above units).
    - Pass origin/tile sizes and reducedMotion state (you already compute these in `IsometricBoard`).
    - (Optional, correct semantics) switch `attackHighlights` to use `/assets/tiles/highlight_attack.png` instead of move highlight.

No changes needed to the engine reducer.

---

### DEFINITION OF DONE
- Attack flow shows:
    - aim/lock overlay immediately after selecting an attack (ATTACK phase)
    - tracer + impact when rolling dice (DICE_RESOLUTION)
    - HIT/MISS resolve marker after resolving attack; HIT marker still appears even if unit disappears
- Card/tactic effects that target units cause a short “unit affected” pulse on those units.
- Reduced-motion mode disables transform-heavy animation but still provides clear feedback.
- No board layout shifts; panning/zooming still works; FX stays aligned during pan/zoom.
- `npm run lint` passes.

---

### OUTPUTS REQUIRED (per AGENTS.md)
1) Code changes
2) Documentation updates:
    - Append entry to `docs/progress.md` (BEFORE / NOW / NEXT + files touched)
    - Update `docs/manual-e2e-test.md` to add checks for attack FX + effect pulse + reduced motion behavior
    - If you add a new doc file, also update `docs/README.md` and `docs/meta/DOCS_INDEX.md`
3) Memory MCP updates:
    - Only if you introduced a durable, always-true convention (likely “none” for this UI-only change)

---

### RESPONSE FORMAT (MANDATORY)
- Files read
- Files changed
- What changed (brief)
- Docs updated (exact sections)
- Memory updates (atomic bullets or “none”)
