YOU ARE CODEX. WORK INSIDE THIS REPO.

Goal
Fix the top command bar by separating MODE, ACTIONS, and FLOW controls.
NEXT PHASE and END TURN must be grouped together on the right as FLOW CONTROLS.

Hard constraints
- DO NOT change engine logic or behavior.
- UI only.
- Flat style, hard edges.
- No gradients, glow, shadows.
- Respect existing semantic colors.

Design changes (MANDATORY)

1) Split the command bar into three zones
- Left: ModeGroup
    - MOVE
    - ATTACK
- Center: ActionGroup
    - DRAW CARD
    - ROLL DICE
    - RESOLVE ATTACK
    - CLEAR SELECTION
    - Only show actions valid for current phase.
- Right: FlowGroup
    - NEXT PHASE
    - END TURN

2) FlowGroup styling
- Wrap NEXT PHASE and END TURN in a single container:
    - background: panel2
    - border: 2px solid ink
    - internal divider: 2px solid ink
- Right aligned, fixed width.
- FlowGroup must always remain visible.

3) Button semantics
   NEXT PHASE:
- Neutral fill
- Small chevron icon (▶ or ▸) before text
- Not visually dominant

END TURN:
- Black fill
- Red accent stripe
- Optional stop/skip icon
- Visually dominant within FlowGroup

4) Icon rules
- Icons are optional but must be flat, monochrome, and paired with text.
- Icons must not replace labels.
- Do not add icons to MOVE / ATTACK.

5) Update layout
- Ensure spacing clearly separates the three zones.
- MOVE / ATTACK must never visually merge with NEXT PHASE / END TURN again.

Acceptance criteria
- A new player can immediately tell:
    - how to choose a mode
    - what actions are available now
    - how to advance the game
- NEXT PHASE and END TURN feel related but distinct.
- No regression in mobile or landscape layouts.

Deliverables
- Refactored command bar layout
- FlowGroup container component (or equivalent)
- Updated styling for NEXT PHASE / END TURN
