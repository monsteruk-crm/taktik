YOU ARE CODEX. WORK INSIDE THIS REPO.

Goal
Build a board-first “Command Screen” UI that looks intentional (ops room), fixes mobile breakpoints, and replaces the current “big card blob in the middle” with a structured console layout.

Non-negotiables
- DO NOT change engine logic, reducer logic, card/tactic rules, phase sequencing, or targeting rules.
- Only refactor UI/layout/styling and small UI-only helpers.
- The board must remain the primary surface. Everything else is a dock/overlay.
- Mobile must not overflow horizontally, ever.
- Use the style rules in: docs/design/brutalist_constructivism_visual_style_bible_markdown.md
- Remove “glow” look (no neon / no drop-shadow glow). Flat highlights only.

What “good” looks like (target layout)
DESKTOP (>= md):
- Top command bar (fixed, thin, brutal)
- Board fills remaining space
- Right “Ops Console” dock (not modal), with tabs:
    - CARDS (pending + actions + stored)
    - TACTICS (open windows + arm/target/confirm)
    - LOG (scroll)
- The console is scrollable internally; the page/viewport is NOT.

MOBILE (< md):
- Top command bar stays fixed.
- Board fills remaining height using 100dvh (not 100vh).
- Ops Console becomes a bottom sheet (SwipeableDrawer) with the same tabs.
- A single “CONSOLE” button (or icon) toggles the bottom sheet.
- No permanent side columns on mobile.

Implementation tasks (do these in order)

1) Add an MUI theme + brutal component overrides
- Create: lib/ui/theme.ts exporting createTheme()
- Enforce brutal rules:
    - borderRadius: 0 everywhere
    - Paper: no elevation, border: 2px solid #1B1B1B, background #E6E6E2
    - Button: rectangle only, uppercase, border 2px solid, hover = invert fill/text
    - Typography: uppercase for headings, tight letterSpacing, numeric clarity
- Use palette from style bible:
    - background: #E6E6E2
    - text: #1B1B1B
    - accent red: #C1121F
    - accent blue: #1F4E79
    - accent yellow: #F2B705
- Wrap app with ThemeProvider + CssBaseline in app/layout.tsx (inside AppRouterCacheProvider).

2) Fix global CSS to stop “neon glow”
- In app/globals.css:
    - Replace .moveHighlight drop-shadow glow with a flat effect:
        - use opacity pulse + solid outline/stroke feel (no blur)
        - keep animation but no glow / no filter.
    - Also set body background to theme base (#E6E6E2) and remove Arial default (let MUI theme handle typography).

3) Build OpsConsole component (tabs + responsive container)
- Create: components/OpsConsole.tsx
  Props should be “dumb”: it receives everything CardPanel currently receives + log entries.
  Inside OpsConsole:
- Use MUI Tabs: CARDS / TACTICS / LOG
- Each tab is a “panel slab” with clear hierarchy and aggressive whitespace.
- Do NOT center big content like a modal. It must read like a console.

CARDS tab layout (this is the main fix)
- Top: small row with “COMMON DECK: N” + [DRAW] button.
- Pending card becomes a structured block:
    - Left: card image (lo) with strict border.
    - Right: text (KIND, NAME, SUMMARY, USAGE) + targeting line.
    - Actions aligned bottom/right:
        - If targeting required: [SELECT TARGETS] [CONFIRM] [CANCEL]
        - Else: [PLAY]
        - Bonus: [STORE] (only when allowed)
- Stored bonuses become a compact grid of thumbnails (2 columns desktop dock, 3 columns on wide, horizontal row on mobile) with only name + tiny summary on expand (Accordion or click-to-expand).
- Keep the existing logic/props—do not change behaviors.

TACTICS tab layout
- At top: “OPEN WINDOWS: …” shown as Chips (brutal rectangles).
- Armed tactic shown as a strong banner slab (accent blue).
- Tactics list should be compact:
    - thumbnail + name
    - window badge
    - actions (ARM or SELECT TARGETS / CONFIRM / CANCEL)
- Again: reuse existing props and callbacks exactly; no new rules.

LOG tab layout
- Scrollable area with fixed row height like now, but styled as console:
    - mono-ish typography (still within theme)
    - dividers every row or subtle gridlines (no shadows)

4) Replace the current layout in app/page.tsx with board-first command screen
   Right now it uses a Grid 8/4 split and huge stacked panels.
   Replace with:
- Root: <Box sx={{ height: '100dvh', display:'flex', flexDirection:'column' }}>
- Top bar: AppBar/Toolbar, fixed height (e.g. 56 on mobile, 64 desktop)
    - include your existing buttons (Move/Attack/Next Phase/Turn Start/End Turn/Roll Dice/Resolve Attack)
    - include “Console” toggle button (shown on mobile; optional on desktop)
- Content row: <Box sx={{ flex:1, display:'flex', minHeight:0 }}>
    - Board area: <Box sx={{ flex:1, minWidth:0, position:'relative' }}> …BoardViewport… </Box>
    - Desktop dock: <Box sx={{ width: 420, display:{ xs:'none', md:'block' }, borderLeft:'2px solid #1B1B1B' }}>
      <OpsConsole ... />
      </Box>

For mobile:
- Use useMediaQuery(theme.breakpoints.down('md')).
- Render OpsConsole inside <SwipeableDrawer anchor="bottom"> with PaperProps:
    - height: min(80dvh, 640px)
    - borderTop: 2px solid #1B1B1B
    - paddingBottom: env(safe-area-inset-bottom)
- Add a “CONSOLE” button in the top bar to open/close the bottom sheet.

Important layout rules:
- NO Container that recenters everything; the UI must feel like a command surface.
- The board must not shrink due to console opening on mobile; console overlays it.
- Ensure all scroll is inside the console panels (minHeight:0 on flex containers, overflow:'auto' only inside console).

5) Make BoardViewport fill correctly
- Confirm components/BoardViewport.tsx supports taking full available height.
- Ensure the board area uses height: 100% and no hardcoded vh.
- Prevent accidental page scroll caused by BoardViewport.

6) Update manual e2e layout notes
- Update docs/manual-e2e-test.md “UI / Layout Smoke Checks”:
    - Desktop: Right “Ops Console” dock is present with tabs.
    - Mobile: Console opens via top-bar button into bottom sheet.
- Keep the rest of the test steps valid (cards/tactics behavior unchanged).

Acceptance checks (must pass before you stop)
- Desktop: board + right console dock; cards tab not centered; no “giant modal blob”.
- Mobile (iPhone SE width): NO horizontal scroll; board fills; console bottom sheet works; buttons accessible.
- Tactics UX: arming + targeting + consuming still works exactly as described in docs/manual-e2e-test.md.
- No reducer/engine changes.

Deliverable
- Commit/patch the changed files.
- Summarize the exact files touched and how to run/verify.

Now do it.
