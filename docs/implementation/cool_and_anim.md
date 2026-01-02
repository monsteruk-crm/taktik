YOU ARE CODEX. WORK INSIDE THIS REPO.

Goal
Add a thin “Phase Progress Ruler” strip under the top command bar, like an instrument panel.
Also implement a small motion system with explicit animation roles so the UI feels mechanical, not webby.

Hard constraints
- DO NOT change engine logic, reducer, card/tactic behavior.
- UI only.
- No gradients, no glow, no drop shadows.
- Keep animation subtle, fast, and “stiff”. Respect reduced-motion.

1) Create PhaseRuler component
   Create: components/ui/PhaseRuler.tsx

Inputs
- phase: string (engine phase value)
- mode?: string (MOVE/ATTACK/etc optional; only used for minor label, can omit)
- compact?: boolean (for mobile)

Design
- A thin horizontal strip: height 10–12px desktop, 8–10px mobile.
- Segmented blocks (like a ruler):
    - 8–10 segments total.
    - Each segment is a small rectangle with border: 1px solid #1B1B1B.
    - Background default: #E6E6E2.
    - Active region: filled #1B1B1B (or dark gray) but flat.
    - Completed segments: filled rgba(27,27,27,0.35).
    - Future segments: empty (background).
- Add 2 thicker “ticks” at 25/50/75% using a pseudo-element overlay or thicker borders.
- Optional: small chevron marker (tiny wedge) indicating current phase index.

Mapping
- Create a UI-only phase order mapping (DO NOT invent new phases; map known ones to indices):
    - TURN_START
    - CARD_DRAW / CARD_RESOLUTION (if present) else DRAW
    - MOVEMENT / MOVE
    - ATTACKS / ATTACK
    - DICE_RESOLUTION / DICE
    - END_TURN
      If your engine phase enum differs, implement a robust mapper:
    - normalize phase string to uppercase
    - match includes("DRAW"), includes("MOVE"), includes("ATTACK"), includes("DICE"), includes("END")
      Fall back to first segment if unknown.

Behavior
- The ruler must not cause layout shift.
- It lives directly under the command bar, full width, inside the same “frame language”:
    - top/bottom borders 2px like the rest.

2) Add PhaseRuler to the top layout
   In app/page.tsx (or wherever the command bar is):
- Insert PhaseRuler under the command keys row (or between status capsules and keys if that’s better).
- Ensure it is visible on mobile too.
- It must never create horizontal scroll.

3) Motion system with explicit animation roles
   Create: lib/ui/motion.ts exporting:
- prefersReducedMotion(): boolean helper (or use MUI useMediaQuery('(prefers-reduced-motion: reduce)'))
- motion tokens:
    - DUR = { micro: 90, fast: 140, standard: 200 } (ms)
    - EASE = { stiff: 'cubic-bezier(0.2, 0.9, 0.1, 1)', snap: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }

Define animation roles (non-negotiable)
ROLE A — STATE ADVANCE (phase change)
- Applies to: PhaseRuler fill progression + a tiny “pulse” on the active segment.
- Duration: 140ms
- Easing: stiff
- Motion: color/fill only + very small scaleY(1.0->1.15->1.0) on active segment
- MUST NOT move layout or slide content.

ROLE B — COMMAND INTENT (when mode changes MOVE/ATTACK)
- Applies to: command key active state (background invert) and a 2px underline “rail” appearing under the active key.
- Duration: 90ms
- Easing: snap
- No translation. Only opacity + color.

ROLE C — PANEL REVEAL (ops console internal sections)
- Applies to: expanding/collapsing small sections (e.g., stored bonuses details, tactic armed banner)
- Duration: 200ms
- Easing: stiff
- Allowed motion: maxHeight/opacity OR scaleY with transform-origin: top
- MUST be internal; never shift the board.

ROLE D — CRITICAL ACTION (End Turn, Roll Dice, Confirm)
- Applies to: a brief “press” feel on button down only:
    - translateY(1px) + inner-line disappears momentarily
- Duration: 90ms
- Easing: snap
- No glow, no bounce.

ROLE E — DEV ONLY (logs)
- No animation at all. It’s dev tool. Keep it static.

Implement reduced-motion rule
- If prefers-reduced-motion: reduce:
    - disable all transforms and pulses
    - keep only instant state changes (0ms) or minimal opacity changes (<=90ms)

4) Implement animations (minimal)
- PhaseRuler:
    - animate background fill transitions using CSS transition on background-color
    - animate active segment pulse using keyframes (only if not reduced-motion)
- Command keys:
    - ensure hover/active transitions use motion tokens
- OpsConsole sections:
    - if you have any collapsible sections, apply ROLE C transitions
      Do NOT add framer-motion. Use CSS transitions/keyframes only.

5) Verification checklist
- Phase change visibly advances the ruler without moving anything.
- Mobile: ruler remains visible, no horizontal scroll, height shrinks.
- Reduced motion: no pulsing; transitions minimal.
- No engine logic changes.

Deliverables
- components/ui/PhaseRuler.tsx (new)
- lib/ui/motion.ts (new)
- Integrate PhaseRuler into the top layout
- Apply motion tokens to PhaseRuler and relevant UI transitions

Now implement.
