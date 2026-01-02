YOU ARE CODEX. WORK INSIDE THIS REPO.

Goal
Fix the bottom “TARGETING PENDING CARD” panel:
- it must NOT be transparent
- it must NOT overlap/bleed into the board visually
- eliminate the “double box mess” by introducing a clear frame hierarchy with distinct colors
- keep everything dynamic (content + visibility based on existing state)
- DO NOT change any targeting/card/tactic logic

Hard constraints
- Engine/reducer/phase logic untouched.
- No gradients, glow, blur, or soft shadows.
- Keep the Brutalist/Constructivist console language: plates inside frames, hard borders, inner inset line.
- No layout shifts for the board. Overlay is allowed, but must be visually solid.

Observed issue (fix precisely)
The bottom targeting panel currently appears semi-transparent and visually merges with the play surface.
It also creates confusing “double borders” because multiple components draw the same black frame on top of each other.

Solution strategy
1) Define a strict “Frame Hierarchy” with three semantic surface types:
    - SURFACE (base app background): light concrete (#E6E6E2)
    - PANEL (standard plate): slightly darker warm gray (#DEDED8) OR #DADAD4
    - ALERT/FOCUS PANEL (targeting/critical): pale yellow or pale red tint depending on context

2) Implement a new UI primitive specifically for overlays:
   Create: components/ui/OverlayPanel.tsx
- Props:
    - title: string
    - tone?: "neutral" | "info" | "warning" | "danger" | "focus"
    - accent?: "blue" | "red" | "yellow" | "black"
    - children
    - rightActions?: ReactNode (optional)
- Styles (non-negotiable):
    - position: absolute or fixed (use existing positioning strategy)
    - background MUST be opaque (no alpha)
    - border: 2px solid #1B1B1B
    - inner inset line: ::after inset 4px, border 1px rgba(27,27,27,0.25)
    - no shadows
    - title rendered as a header plate inside the panel:
        - background: PANEL color (not transparent)
        - border: 2px solid #1B1B1B
        - optional accent stripe 6px at left (solid)
- Tone backgrounds (opaque):
    - neutral: #DEDED8
    - info: #D9E4EF (very pale blue)
    - warning: #EFE5C7 (pale yellow, not bright)
    - danger: #E9D0D0 (pale red)
    - focus (targeting): #E7E0C6 (same family as warning)
      These are flat fills; do not use opacity.

3) Eliminate double frames by enforcing “ONLY ONE OUTER BORDER”
   Audit the bottom targeting UI composition:
- If the bottom bar currently wraps a Frame/Plate + another Frame/Plate, remove the outermost duplicate.
- Rule:
    - OverlayPanel draws the outer border.
    - Child sections inside may draw only a 1px divider or NO border, unless they are “header plates”.
- Replace any nested Frame components inside the overlay with:
    - simple Box with padding + divider lines (2px max where needed)
    - or Plate with no outer frame (if you have such prop; otherwise use plain Box)

4) Make the overlay look intentional and anchored
- The bottom targeting overlay should snap to the bottom edge of the PLAY SURFACE frame:
    - left aligned to board frame inner padding
    - right aligned to board frame inner padding
    - height: compact (e.g., 88–110px)
- Add a top “rail” divider separating it from the board:
    - 2px solid #1B1B1B
    - optional tick marks (very subtle) but not required.

5) Apply consistent “Frame Coloring” across the app
   Right now many frames look identical because everything is black border on same background.
   Implement these rules globally (theme or shared constants):
- App background: #E6E6E2
- Board Frame background (behind canvas): #EDEDE8 (slightly different)
- OpsConsole background: #DEDED8
- Internal header plates: #E6E6E2 (lighter) with border
- Action area plates: #DADAD4 (darker)
  This creates readable hierarchy without adding effects.

6) Hook the overlay to existing targeting state (NO new logic)
   The overlay must appear only when:
- targeting is active for a pending card OR pending attack OR tactic targeting (whatever your UI currently supports)
  Do NOT create a new boolean in engine state.
  Derive visibility from existing UI state already used to show “SELECT TARGETS / CONFIRM”.

7) Motion role (use your motion tokens)
   Apply ROLE C — PANEL REVEAL:
- transition: opacity + transform scaleY (origin bottom) OR maxHeight
- duration 200ms
- easing stiff
- reduced motion: no transform, just instant opacity

Acceptance criteria
- Bottom panel is fully opaque and readable against the board.
- No “see-through” board lines under the panel.
- No double-border clutter: one outer border, one inner inset line, clean header plate.
- Color hierarchy makes frames understandable (surface vs panel vs focus).
- Behavior unchanged: targeting still works exactly as before.

Deliverables
- components/ui/OverlayPanel.tsx (new)
- Update the component responsible for the bottom targeting panel to use OverlayPanel
- Adjust colors/constants in theme or a shared palette file (UI only)
- Brief verification steps:
    - enter card targeting: panel appears solid and aligned
    - exit targeting: panel hides cleanly
    - no overlap artifacts or double borders
