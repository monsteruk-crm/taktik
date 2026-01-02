YOU ARE CODEX. WORK INSIDE THIS REPO.

Problem
Mobile top command area is jumbled:
- too many plates/capsules/keys competing in the same band
- no priority tiers
- no deterministic wrapping rules
  Result: unreadable instrument panel.

Goal
Implement a STRICT 3-tier Mobile Command Header system:
- Tier 1: identity + critical state (always visible)
- Tier 2: command keys (wrap rules; max two rows)
- Tier 3: secondary readouts (collapsible “More” rail)
  This must look like a manufactured console, not a CSS accident.

Hard constraints
- DO NOT change engine logic, reducer, phases, card/tactic behavior.
- UI only.
- Flat, hard borders, no gradients/glow/shadows.
- NO horizontal scrolling on mobile.
- Top must remain fixed and readable at 360–420px widths.

Definitions
Let isNarrow = useMediaQuery("(max-width:1100px)").
Let isTiny = useMediaQuery("(max-width:420px)").

1) Create a new component: components/CommandHeader.tsx
   It renders the entire top area on all breakpoints.
   Props: pass the same state/handlers currently used in page.tsx for top controls and readouts.

CommandHeader must output 3 tiers:

TIER 1 — IDENTITY PLATE (single row, never wraps)
Left: PLAYER plate (accent stripe)
Center: VP / TURN / PHASE as compact capsules
Right: CONSOLE toggle key (small oblique key)

Rules:
- This tier is ONE ROW only.
- Use CSS grid with 3 columns:
    - left: max-content
    - center: 1fr
    - right: max-content
- Center group must be allowed to compress/truncate:
    - PHASE becomes short label on mobile (TURN, DRAW, MOVE, ATK, DICE, END)
- If isTiny:
    - hide VP capsule first (lowest priority)
    - keep TURN + PHASE

TIER 2 — COMMAND KEYS (max 2 rows, deterministic)
This contains only the “do something now” keys:
- DRAW CARD
- MOVE
- ATTACK
- NEXT PHASE
- END TURN
- ROLL DICE
- RESOLVE ATTACK
- CLEAR SELECTION (only if something selected or pending exists; otherwise hidden)

Rules:
- Use a 2-row grid, NOT free wrap:
    - Row A (primary): MOVE, ATTACK, END TURN
    - Row B (flow): DRAW CARD, NEXT PHASE, ROLL DICE, RESOLVE ATTACK
- On isTiny:
    - collapse text labels to short forms:
        - DRAW, NEXT, DICE, RESOLVE, CLEAR
- Keys must keep their oblique shape.
- If there are more keys than fit:
    - NEVER wrap into a 3rd row
    - Instead: move lowest priority keys into Tier 3 “More” panel

Priority order for overflow removal (first removed):
1) CLEAR SELECTION
2) RESOLVE ATTACK
3) DRAW CARD (only if phase doesn’t allow it anyway)
4) ROLL DICE (only if phase doesn’t allow it anyway)
   Never remove END TURN.

TIER 3 — SECONDARY READOUT RAIL (collapsed by default)
This includes:
- MODE
- SELECTED
- PENDING
- LAST ROLL
- STATUS
  Also includes any overflowed command keys from Tier 2.

Presentation:
- A thin rail plate with a “MORE ▾” oblique micro-key on the right.
- Default collapsed: shows only MODE + one of (SELECTED or PENDING) depending on which is non-empty.
- Expanded: shows the full set in a tidy 2-column capsule grid.

Rules:
- Tier 3 MUST NEVER be always expanded by default.
- Tier 3 is allowed to scroll vertically INSIDE itself if needed (but ideally it fits).

2) Implement deterministic truncation + label shortening
   Create helpers in lib/ui/headerFormat.ts:
- shortPhase(phase): string
- shortKey(label): string
- shortUnit(id/name): string (truncate)
  These are UI-only.

3) Remove duplicate readouts
   Right now you display MODE/STATUS in multiple places.
   Rule:
- MODE is only in Tier 3 (and optionally a tiny icon in Tier 1).
- STATUS is only in Tier 3 (or replace with a single dot in Tier 1).
  No duplicate plates.

4) Tight alignment system (stop “random” gaps)
   Define constants in lib/ui/layoutTokens.ts:
- BORDER = 2
- GAP_SM = 6
- GAP_MD = 8
- PAD = 8
  Apply consistently across header tiers.

5) Fix vertical rhythm with “Header Frame”
   Wrap CommandHeader in a Frame/Plate:
- Outer border line at bottom to separate it from the PhaseRuler and board frame.
- No shadows.
- Background: SURFACE (#E6E6E2) with sub-plates (#DEDED8, #DADAD4)

6) Motion roles (mechanical only)
   Apply ROLE B (COMMAND INTENT):
- Active key underline/rail appears under the selected mode key (MOVE/ATTACK)
- 90ms snap easing
  Apply ROLE A only to PhaseRuler.
  Tier 3 expand/collapse uses ROLE C:
- 200ms stiff
- reduced motion: instant

7) Acceptance checks (must pass)
   At 390x844 and 360x800:
- Tier 1 is clean, single row, readable
- Tier 2 is at most 2 rows, no spaghetti wrapping
- Tier 3 is collapsed by default; expands when “More” tapped
- No horizontal scroll anywhere
- Board remains visible under header; header does not exceed ~30–35% screen height

Deliverables
- components/CommandHeader.tsx (new)
- lib/ui/headerFormat.ts (new)
- lib/ui/layoutTokens.ts (new or integrate into existing tokens)
- app/page.tsx refactor: replace ad-hoc top layout with <CommandHeader />
- Remove duplicate MODE/STATUS readouts

Now implement.
