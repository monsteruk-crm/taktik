YOU ARE CODEX. WORK INSIDE THIS REPO.

Goal
Make OpsConsole tabs (CARDS / TACTICS / LOG) oblique and “joined” with NO spacing, like a fabricated console.
Also make LOG dev-only (feature-flagged) while keeping OpsConsole dynamic and reusable.

Hard constraints
- DO NOT change engine logic or card/tactic behavior.
- UI only.
- Tabs must remain keyboard accessible.
- No gradients, no glow, no soft shadows.

1) Create ObliqueTabBar component
   Create: components/ui/ObliqueTabBar.tsx

Requirements
- Renders a joined tab strip: tabs touch each other (no gap).
- Each tab is a parallelogram plate:
    - border: 2px solid #1B1B1B
    - background: #E6E6E2 (inactive)
    - active: background #1B1B1B, text #E6E6E2
    - hover: invert like command keys
- Shape via clip-path polygon. Use two shapes:
    - left-most: angled on right only
    - middle: angled both ends
    - right-most: angled on left only
      This avoids visible “holes” where plates meet.

- The tabs must visually “stack” correctly:
    - active tab should be on top (higher z-index)
    - inactive tabs sit beneath (so borders overlap cleanly)
- No spacing: use negative margins (e.g. marginLeft: -2px) so borders share edges.

API
type ObliqueTab = { id: string; label: string; hidden?: boolean }
props:
- tabs: ObliqueTab[]
- activeId: string
- onChange: (id: string) => void
- size?: "sm" | "md"
- rightContent?: ReactNode (optional small status text)

Implementation notes
- Use ButtonBase for each tab for accessibility.
- Role semantics:
    - container role="tablist"
    - tab role="tab" aria-selected, tabIndex
- Keyboard:
    - Left/Right arrow switches selection (roving tabIndex)
    - Enter/Space activates
      Keep it minimal but correct.

2) Wire ObliqueTabBar into OpsConsole.tsx
   Modify /mnt/data/OpsConsole.tsx in repo (the one already used).
   Replace current MUI Tabs with ObliqueTabBar.

Tabs to render:
- cards
- tactics
- log

But LOG must be dev-only and dynamic:
- Add a small config:
  const SHOW_DEV_LOGS = process.env.NEXT_PUBLIC_SHOW_DEV_LOGS === "true"
- The tab list should include LOG only if SHOW_DEV_LOGS.
- The panel content for LOG should also only render if SHOW_DEV_LOGS.
- If SHOW_DEV_LOGS is false and active tab is "log", auto-fallback to "cards".

DO NOT remove the log feature entirely; just gate it behind the env var.

3) Ensure no spacing + match the screenshot style
- The oblique tab strip must be flush with the console frame:
    - no padding around it besides the frame’s internal padding
- The strip should sit under the “TAKTIK COMMAND” header plate.
- Add a thin separator line under the tab strip (2px solid #1B1B1B), like a mechanical rail.

4) Small polish (must do)
- Tabs labels uppercase, letterSpacing 0.08em, fontWeight 800.
- Selected tab: add inner inset line via ::after (1px rgba(230,230,226,0.35)) so it feels like a pressed metal plate (still flat).
- Inactive tabs: add inner line rgba(27,27,27,0.25).

5) Verify
- Desktop: tabs are oblique, touching, no gaps.
- Active tab overlaps neighbors cleanly (no double borders or white seams).
- Mobile: tabs remain readable; strip can scroll horizontally ONLY if absolutely necessary, but prefer smaller typography and wrap disabled. (If you must, allow horizontal scroll inside tab strip only, not the whole page.)
- LOG tab not present unless NEXT_PUBLIC_SHOW_DEV_LOGS=true.
- Cards/tactics behaviors unchanged.

Deliverables
- components/ui/ObliqueTabBar.tsx (new)
- OpsConsole.tsx updated to use it + feature flag logic
- Brief steps:
    - set NEXT_PUBLIC_SHOW_DEV_LOGS=true to see LOG tab
    - unset/false hides it

Now implement.
