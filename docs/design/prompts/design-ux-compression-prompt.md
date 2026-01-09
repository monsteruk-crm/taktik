PROJECT CONTEXT — READ CAREFULLY

You are working on **TAKTIK**, a deterministic, turn-based, grid-based tactical board game.
This task concerns **UI / UX only**.

The UI is a **Brutalist + Constructivist military command console**:
- flat
- hard-edged
- manufactured
- no gradients
- no glow
- no blur
- no soft shadows
- no rounded corners

Reference mental model:
Printed Cold-War command console / instrument panel, not a web app, not a HUD.

---

ABSOLUTE CONSTRAINTS (NON-NEGOTIABLE)

DO NOT:
- change engine logic
- change reducers or state machines
- change phase sequencing
- change card / tactic / targeting behavior
- invent new phases
- add “friendly” SaaS UI patterns
- add visual effects to fake hierarchy

YOU MAY:
- refactor UI layout
- add UI-only mapping/helpers
- introduce new UI primitives
- improve hierarchy, clarity, and legibility
- adjust color usage within semantic rules

---

CANONICAL UI RULES (HARD GATE)

You MUST follow:
- `docs/ui/UI_GLOBAL_RULES.md`
- `docs/ui/TOP_BAR_PHASE_WIREFRAMES.md`
- `AGENTS.md` §15 (UI Command Console Rules)

If a change violates those docs, the task is FAILED.

---

CORE UI DOCTRINE

1) Board-first  
   The board is the primary surface. UI supports it, never competes.

2) Plates inside frames  
   Hierarchy is expressed via:
- borders
- inset lines
- flat opaque fills  
  Never via glow, shadows, or transparency.

3) Semantic color = meaning  
   Color is not decoration. It communicates state.

---

SEMANTIC COLOR SYSTEM (MANDATORY)

- MOVE = blue
- ATTACK = red
- CARDS / DRAW / DICE = yellow
- CONFIRM / END TURN = black
- CANCEL / secondary = neutral
- Player identity = blue/red stripe

Rules:
- ACTIVE state = filled semantic color
- INACTIVE = neutral fill + accent stripe
- DISABLED = darker neutral + ~0.35 opacity + no hover
- Yellow surfaces ALWAYS use dark text (no white-on-yellow)

---

TOP COMMAND BAR — AUTHORITATIVE MODEL

Phases (engine truth):

TURN_START
CARD_DRAW
CARD_RESOLUTION
MOVEMENT
ATTACK
DICE_RESOLUTION
END_TURN


UI model:
- **PHASE** = game clock (what step we are in)
- **MODE** = interaction tool (MOVE / ATTACK)
- **FLOW** = advancing time (NEXT PHASE / END TURN)

Zones (must never mix):
- LEFT: MODE (MOVE / ATTACK)
- CENTER: ACTIONS (contextual per phase)
- RIGHT: FLOW (NEXT PHASE + END TURN grouped)

END TURN:
- always black
- always red stripe
- always isolated in FLOW group

NEXT PHASE:
- advances phase only
- never confused with actions

MODE buttons:
- only active during ACTIONS phases
- never active outside MOVEMENT / ATTACK phases

The **exact visual states per phase** are defined in:
`docs/ui/TOP_BAR_PHASE_WIREFRAMES.md`  
Those SVGs are authoritative and must be matched.

---

RESPONSIVE DOCTRINE

Desktop:
- Right-side Ops Console dock
- Board remains dominant

Mobile portrait:
- Bottom console drawer (non-modal, snap heights)
- Header uses strict tiering and collapsing

Mobile landscape:
- Board-first “Landscape Mode”
- Header collapses to slim strip
- Commands move to right-edge dock
- No bottom sheets in landscape

No horizontal scrolling at any breakpoint.

---

FOCUS / TARGETING MODE (CRITICAL)

When targeting or resolving:
- Use opaque FOCUS panels (pale yellow)
- Never transparent over the board
- Add focus rail + “FOCUS” indicator
- Action buttons in focus must be strongly emphasized

---

LEGIBILITY & CONTRAST (HARD GATE)

- No white-on-yellow text
- Active states must be unmistakable
- Major panels must have Band Headers (dark header bands)
- Zones must be visually distinct via flat fills

If a new user cannot instantly tell:
- where they are
- what is active
- what requires action  
  …the UI is incomplete.

---

MOTION RULES (MECHANICAL ONLY)

- No playful animation
- No layout shift
- Use short, stiff transitions only
- Reduced-motion must be respected

---

ENFORCEMENT

If implementation deviates:
- update the docs first
- then update the UI

If docs and UI disagree, the docs win.

Proceed accordingly.
