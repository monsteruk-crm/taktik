YOU ARE CODEX. WORK IN THIS REPO.

Objective
Make the UI match the generated reference look (ops-room command console) WITHOUT changing game/engine behavior.

Hard constraints
- DO NOT change engine logic, reducer, card/tactic rules, phase sequencing, targeting, or move/attack rules.
- You may ONLY change UI layout, styling, and UI components.
- Respect docs/design/brutalist_constructivism_visual_style_bible_markdown.md: no gradients, no soft shadows, no glow.
- Use the provided reference images as visual target:
    - /mnt/data/ref_left.png
    - /mnt/data/ref_right.png

What is wrong now (fix this)
- Cards feel like a “big centered blob” because the hierarchy is weak and everything sits in generic Paper blocks.
- Top bar looks like a web toolbar, not a command plate.
- Mobile breakpoints feel broken because the command bar becomes horizontally scrollable and the console becomes a big sheet with no structure.

Target layout (match the reference)
DESKTOP (>= 1100px):
- Thick framed play surface with an inner border (double-frame).
- Top “Command Plate” with:
    - Left: PLAYER PLATE (DEFENDER/ATTACKER color strip)
    - Mid: VP / TURN / PHASE as segmented capsules
    - Right: a thin “status bar” + console toggle (optional)
- Board fills the play surface.
- Right side = OPS CONSOLE DOCK (not a modal) with a header plate: “TAKTIK COMMAND”
- Inside dock: tabs CARDS / TACTICS / LOG, but styled like hard plates (not default Tabs).

MOBILE (< 1100px):
- Board must occupy full remaining screen: height = 100dvh minus command plate height.
- No horizontal scrolling anywhere (including the top bar).
- Console becomes a bottom sheet with a visible grab handle and three snap heights:
    - 20% (peek)
    - 55% (half)
    - 85% (full)
- Tabs remain, but must be readable and not cramped.

Implementation steps (do in order)

1) Introduce a reusable “Frame” + “Plate” primitives (THIS is the magic)
   Create: components/ui/Frame.tsx
- A wrapper that draws:
    - outer border: 2px solid #1B1B1B
    - inner border inset: 2px solid #1B1B1B with padding gap (e.g. 6px)
- No shadows, no gradients.
- It should accept: titleLeft?, titleRight?, accentColor?
- It should render an optional “header plate” (like the reference) that sits on the top edge inside the frame.

Create: components/ui/Plate.tsx
- A brutal slab with:
    - background: #E6E6E2
    - border: 2px solid #1B1B1B
    - optional accent stripe (left edge, 6–10px wide)
    - tight uppercase label styling

You will use Frame/Plate everywhere: board surface, command bar sections, console sections, pending card module.

2) Rebuild the Command Bar to stop feeling like a web toolbar
   Refactor app/page.tsx top area:
- Replace the current 2-row grid + overflowX auto button strip with a “command plate” that WRAPS instead of scrolling.
- Use CSS grid with named areas; on mobile it becomes two stacked rows.

Design rules:
- Buttons become “command keys”:
    - MOVE = blue plate
    - ATTACK = red plate
    - END TURN = black text on concrete plate + red accent stripe
    - ROLL DICE = yellow accent
    - Disabled state must look like “depowered”: opacity 0.35 + no hover invert.
- NO horizontal scrolling in the command bar.
- Use two rows on mobile:
    - Row 1: player plate + stats capsules
    - Row 2: command keys (wrap to 2 lines if needed)

Implementation detail:
- Make a small helper component inside page.tsx: <CommandKey>
    - wraps MUI Button but applies plate styling via sx (border 2px, background, inverted hover, fixed height 36-40, minWidth 110 desktop, 92 mobile).
    - Supports “accent” color and “active” state.

3) Fix the “big cards blob” by restructuring CARDS tab into an ops layout
   Modify components/OpsConsole.tsx (CARDS tab only):
   Replace the current “Pending Card Paper” with a three-zone layout:

CARDS TAB STRUCTURE (like ref)
A) TOP: “DECK STATUS STRIP”
- A thin plate row:
    - “COMMON DECK: N”
    - DRAW key on the right

B) MIDDLE: “PENDING CARD DIRECTIVE” (this is the big one)
- Should NOT look like a generic modal. It’s a directive module.
- Use Frame + Plate:
    - Left: card art (lo) fixed width (120–140)
    - Right: stacked labels:
        - KIND + NAME on one line
        - SUMMARY (2 lines max, overflow clamp)
        - USAGE (2 lines max)
        - TARGETING line as a chip-like plate
    - Bottom-right: action key row (Select Targets / Confirm / Cancel / Play / Store)
- Enforce compactness:
    - Clamp summary/usage using CSS line-clamp.
    - Do not let text expand infinitely.

C) BOTTOM: “STORED BONUSES STRIP”
- Remove Accordions (they read like web UI).
- Use a compact tile strip:
    - Desktop dock: 2 columns grid
    - Mobile: horizontal scroll row with snap
- Each tile:
    - thumbnail art
    - 1-line name
    - on click: expands inline below (simple collapse) showing summary (NOT accordion chrome)

IMPORTANT:
- Keep ALL existing logic/callbacks exactly.
- Only change visual structure.

4) Make OPS CONSOLE look like the reference (header plate + hard sections)
   Modify OpsConsole root:
- Add a header plate above Tabs:
    - Left: “TAKTIK COMMAND”
    - Right: small status text (PLAYER, TURN) or leave blank
- Tabs must look like cut steel plates:
    - remove the default thin indicator feel; make selected tab a filled plate (bg #1B1B1B, text #E6E6E2).
    - unselected tabs: bg #E6E6E2, border 2px, text #1B1B1B.
- Ensure the console body uses internal scroll only.

5) Mobile breakpoints: stop guessing; implement explicit width rule + no overflow
   Right now you use md breakpoint. Replace with explicit:
- const isNarrow = useMediaQuery("(max-width:1100px)");

Rules:
- Desktop dock shows only when !isNarrow.
- Mobile bottom sheet shows only when isNarrow.

Bottom sheet behavior:
- Keep SwipeableDrawer but add a visible handle at top of drawer content.
- Implement snap heights by controlling PaperProps.sx.height dynamically:
    - store a state: sheetSize = "peek" | "half" | "full"
    - clicking the handle cycles sizes (MVP), swipe can stay default.
    - heights: 20dvh / 55dvh / 85dvh (cap at 720px)
- Ensure safe areas:
    - paddingBottom: env(safe-area-inset-bottom)
    - paddingTop for handle area

Also ensure:
- No horizontal scroll: audit any width:max-content usage (you currently have it in the top button row). Remove it.
- The board container must be minWidth:0 and overflow hidden.
- Any scroll must live ONLY inside the console content area.

6) Visual polish pass (no shadows, but add “mechanical depth” via lines)
   Add in theme.ts component overrides (allowed, still flat):
- Add “inset line” effect via pseudo-elements:
    - For Paper/Plate: ::after with inset border (1px) using rgba(27,27,27,0.35)
- Add section dividers as thick rules (2px) not 1px.

7) Verify against manual + e2e docs
   Open docs/manual-e2e-test.md and ensure:
- no behavior changes
- update UI smoke checks:
    - Desktop shows dock console + header plate
    - Mobile console bottom sheet has 3 sizes and no horizontal scroll
    - Pending card directive module is not centered modal

Acceptance criteria (must satisfy)
- Desktop: board framed with double border; console dock has “TAKTIK COMMAND” plate; CARDS tab looks like a directive module, not a blob.
- Mobile: zero horizontal scroll; board fills; console bottom sheet toggles and cycles peek/half/full; actions remain accessible.
- Cards/tactics behaviors unchanged.

Deliverables
- List files changed.
- Brief “how to verify” steps with viewport sizes (390x844 and 1440x900).
- Do not include screenshots; just steps.

Now implement.
