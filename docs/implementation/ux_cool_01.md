YOU ARE CODEX. WORK INSIDE THIS REPO.

Goal
Implement “oblique command keys” (parallelogram buttons) like the reference UI, and use them in the top command bar.
This MUST look like a tactical console: hard edges, angled ends, thick borders, no gradients, no glow.

Hard constraints
- DO NOT modify engine logic, reducer, phase sequencing, card/tactic targeting.
- UI only.
- No shadows, no gradients. Flat fills only.
- Buttons must remain accessible: focus ring, keyboard operable, proper disabled state.

Implementation Plan

1) Create a reusable component: components/ui/ObliqueKey.tsx
- Base: MUI ButtonBase (or Button) but fully custom styling via sx.
- Shape: parallelogram using ONE of these (choose simplest):
  A) clip-path polygon: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)
  B) skewX(-12deg) on container + counter-skew on label
  Prefer clip-path (cleaner, no text distortion).
- Styling rules:
    - Height: 40 desktop, 36 mobile.
    - Border: 2px solid #1B1B1B
    - Background: default #E6E6E2
    - Hover: invert (bg #1B1B1B, text #E6E6E2)
    - Active/pressed: translateY(1px) + remove inner line for “mechanical press”
    - Disabled: opacity 0.35, keep border, no hover invert, cursor default
    - Uppercase label, letterSpacing 0.08em, fontWeight 800

- Add “inner frame line” (the magic) with ::after:
    - position absolute inset 3px
    - border: 1px solid rgba(27,27,27,0.35)
    - same clip-path polygon as outer (or inset polygon)

- Props:
    - label: string
    - onClick
    - disabled
    - tone?: "neutral" | "blue" | "red" | "yellow" | "black"
    - active?: boolean
    - rightNotch?: boolean (optional later)
    - startIcon / endIcon optional

- Tone mapping (flat):
    - neutral: bg #E6E6E2
    - blue: bg rgba(31,78,121,0.25)
    - red: bg rgba(193,18,31,0.25)
    - yellow: bg rgba(242,183,5,0.30)
    - black: bg #1B1B1B with text #E6E6E2 (and invert hover = concrete)
      Keep it flat (no gradient).

2) Replace top bar buttons with ObliqueKey
   Find the top command bar component/page where these buttons are rendered:
- DRAW CARD, MOVE, ATTACK, NEXT PHASE, TURN START, END TURN, ROLL DICE, RESOLVE ATTACK, CLEAR SELECTION
  Replace the “primary action cluster” with ObliqueKey instances:
- MOVE tone blue, ATTACK tone red
- END TURN tone black with a red accent stripe (next step)
- ROLL DICE tone yellow
- NEXT PHASE / TURN START neutral
- DISABLED states match existing phase rules (do not change enable logic)

3) Add an optional left accent stripe for END TURN (match ref)
   In ObliqueKey, if tone === "black" OR prop accentColor provided:
- add ::before as a 6px vertical stripe on the left edge (inside the border)
- keep it flat, no blur.

4) Fix mobile layout (no horizontal scrolling)
   The top bar must WRAP, not scroll.
- Put command keys in a flex container:
    - display:flex; flexWrap:wrap; gap:8px
    - ensure each key has minWidth on desktop (110) and smaller on mobile (92)
    - use sx breakpoint rules: minWidth: { xs: 92, md: 110 }
- Remove any overflowX:auto or width:max-content patterns for the button row.
- Ensure the command bar can be two rows on mobile.

5) Verify focus + keyboard
- Ensure ObliqueKey shows a visible focus state (outline: 2px solid #1F4E79, outlineOffset: 2px).
- Enter/Space activates it.
- Disabled keys do nothing.

Acceptance criteria
- Buttons are visibly oblique (angled ends), thick bordered, flat.
- Hover invert looks like a “command key” not a web button.
- Mobile: no horizontal scroll at 390px width; keys wrap to 2 lines.
- No logic changes: only visuals/layout.

Deliverables
- New file: components/ui/ObliqueKey.tsx
- Refactor top bar to use it
- Brief verification steps for 1440x900 and 390x844

Now implement.
