YOU ARE CODEX. WORK INSIDE THIS REPO.

Goal
Increase clarity for non-expert users by making UI states visually distinctive using bold, flat colors (no gradients/glow/shadows).
The UI is already structurally correct; this task is ONLY semantic color emphasis.

Hard constraints
- DO NOT change engine logic, reducer, phases, card/tactic targeting behavior.
- UI only.
- Flat fills only. No opacity overlays that reveal the board beneath a panel.
- Keep borders/inset lines; colors must reinforce meaning, not replace structure.

Problem diagnosis
Too many elements share identical “concrete + black border” styling.
New users can’t quickly distinguish:
- Primary actions vs secondary actions
- Current phase / current mode
- Pending targeting / focus state
- Player A vs Player B ownership
- “Safe” vs “danger” vs “needs attention”

Implementation plan

1) Introduce a single source of truth for colors
   Create: lib/ui/semanticColors.ts
   Export tokens (opaque):
- ink: #1B1B1B
- surface: #E6E6E2
- panel: #DEDED8
- panel2: #DADAD4

Player identity (must be bold but not neon):
- playerA: #1F4E79 (blue)
- playerB: #C1121F (red)

Action colors (use as strong fills for ACTIVE, and stripe for INACTIVE):
- move: #1F4E79
- attack: #C1121F
- dice: #F2B705
- confirm: #1B1B1B (black key)
- cancel: #DADAD4 (neutral)

Semantic states (opaque, flat):
- focus: #EFE5C7 (stronger pale yellow than current)
- danger: #E9D0D0
- info: #D9E4EF
- success: #D7E7D4 (subtle green)

2) Upgrade primitives to use semantic color roles (no “random tones”)
   Update:
- ObliqueKey
- ObliqueTabBar
- StatusCapsule
- OverlayPanel
- OpsConsole section header plates

Rules for emphasis:
A) ACTIVE = filled with the semantic color + inverted text (white or surface)
B) INACTIVE = neutral fill + a 6px accent stripe (semantic color) on the left
C) DISABLED = neutral fill + stripe removed + opacity 0.35 + no hover

3) Make the command area readable at a glance
- Mode keys:
    - Active MOVE key: full blue fill, white text
    - Active ATTACK key: full red fill, white text
- END TURN stays black (already good) but must have a red stripe always.
- ROLL DICE uses strong yellow fill when enabled; neutral when disabled.

4) Make the console tabs unmistakable (Cards vs Tactics)
   In ObliqueTabBar:
- CARDS tab uses a yellow stripe when inactive; full black fill when active (keep your active style) BUT add a 6px yellow stripe even on active.
- TACTICS tab uses a blue stripe similarly.
- LOG (dev) uses neutral gray stripe; do not compete visually.
  No gaps, joined edges preserved.

5) Make “Focus/Targeting” impossible to miss
   Any targeting mode (card targeting, tactic targeting, pending attack targeting) must activate a FOCUS treatment:
- Bottom targeting overlay uses OverlayPanel tone="focus" (opaque, not transparent)
- Add a 2px “focus rail” line at top of the overlay in yellow (flat)
- Also add a small “FOCUS” capsule near MODE or inside the overlay header (yellow)

6) Reinforce player ownership everywhere (small but consistent)
- Player plate always has a bold stripe (blue/red).
- In OpsConsole header, add a 6px stripe matching current player.
- In Pending Card Directive header, stripe based on card type:
    - BONUS = blue stripe
    - MALUS = red stripe
    - TACTIC = yellow stripe

7) Keep it flat and legible
- No gradients, no shadows.
- Use borders + inset lines as before.
- Ensure contrast: any filled accent key must use white/surface text.
- Do not rely on opacity for meaning.

Acceptance criteria
- A new user can instantly see:
    - current player
    - current phase/mode
    - what action is primary right now
    - when the game is in targeting/focus
    - whether they are in Cards vs Tactics
- UI remains brutal/flat.
- No engine behavior changes.

Deliverables
- lib/ui/semanticColors.ts (new)
- Updated primitives to use semantic colors consistently
- Minor OpsConsole updates to apply semantic stripes to section headers
- Brief before/after notes

Now implement.
