YOU ARE CODEX. WORK INSIDE THIS REPO.

Problem
Mobile landscape is unusable: the board is too small because the header (tiers + ruler + rails) consumes vertical space.
We need a dedicated landscape layout doctrine.

Goal
Implement a “Landscape Board-First Mode” for narrow+landscape screens:
- Board uses ~80–90% of vertical space.
- UI collapses into a single slim top strip + contextual edge console.
- No modal trapping. Everything remains reachable.
- No engine logic changes.

Hard constraints
- DO NOT change engine/reducer/phase logic.
- UI only.
- No gradients/glow/shadows.
- No horizontal scroll.
- Respect reduced-motion.

Detection logic (MUST)
Define:
- isNarrow = useMediaQuery("(max-width:1100px)")
- isLandscape = useMediaQuery("(orientation: landscape)")
- isShort = useMediaQuery("(max-height:520px)")  // typical phone landscape
  LandscapeMode = isNarrow && isLandscape && isShort

1) Add a dedicated header mode: CommandHeader must support `variant`
   Update components/CommandHeader.tsx:
- Add prop variant: "default" | "landscape"
- When variant="landscape", render ONLY:
  TIER-L0 (Slim Strip) height ~44px:
    - Left: PLAYER capsule (very compact)
    - Center: PHASE short label + TURN (tiny)
    - Right: CONSOLE toggle + “⋯” (More) button
    - Optional: a tiny 6–8 segment mini PhaseRuler inline (not the full ruler bar)
      Everything else must be hidden from the header in landscape.

Rules:
- NO Tier 2 command keys row in landscape header.
- NO Tier 3 readout rail in landscape header.
- NO full PhaseRuler below header (remove it in landscape; use mini-ruler inside strip).
  This is the key: header must not exceed 44–52px.

2) Move command keys into an Edge Command Dock (right side)
   Create: components/EdgeCommandDock.tsx

Behavior
- Only in LandscapeMode.
- Fixed-position dock on the RIGHT edge:
    - width: 280px (max 45vw)
    - height: 100dvh
    - top offset: header height
    - background: opaque panel color (#DEDED8)
    - border-left: 2px solid #1B1B1B
- Collapsed by default to a “tab handle” (like a physical latch):
    - a 32px wide vertical handle with “CMD”
    - tapping opens the dock
- When open:
    - Contains your ObliqueKey clusters (MOVE/ATTACK/END TURN etc)
    - Contains readout capsules (MODE/SELECTED/PENDING/LAST ROLL)
    - Uses internal scroll only (overflow:auto inside), never page scroll.

Non-modal rules:
- No backdrop/scrim.
- Board remains interactive in the uncovered area.
- Dock overlays the board on the right, but board keeps most width.
- Provide close button in dock header.

Auto behavior (the magic)
- Auto-open briefly (700ms) ONLY on first entry into LandscapeMode OR when phase changes into a “needs action” phase (e.g., CARD_DRAW, DICE).
- Auto-close after 2.2s if user does not interact.
- If user pins it open (tap a “PIN” icon), do not auto-close.

3) Console drawer behavior in landscape
   Your MobileConsoleDrawer (bottom sheet) must NOT be used in LandscapeMode.
   Instead:
- Console content (OpsConsole tabs) lives in the same EdgeCommandDock:
    - Add a 2-tab switch inside dock header: CMD | CONSOLE
    - CMD tab = action keys + readouts
    - CONSOLE tab = OpsConsole (cards/tactics/dev log)
      This prevents the “bottom slice” issue and avoids stealing vertical space.

4) Introduce “Hold-to-Reveal” micro-overlay for emergency access
   In LandscapeMode, allow user to reveal the command keys temporarily without opening the dock:
- Long-press anywhere on the header strip for 350ms:
    - Show a transient overlay ribbon (top-center) with 3 keys only:
      MOVE / ATTACK / END
    - Auto-hide after 1.5s or on any tap.
      This is a pure UI affordance; do not change game logic.

5) Board viewport resizing rules (most important)
   In LandscapeMode:
- Board container height = calc(100dvh - headerHeight)
- No other vertical bars.
- Ensure BoardViewport uses 100% height, no hardcoded vh.
- Ensure no outer container adds padding/margins that eat vertical pixels.

6) Motion roles
- Dock open/close: ROLE C (panel reveal) 200ms stiff, opacity+transformX (very small)
- Header strip: no animation except tiny state updates
- Reduced motion: no transform, only instant.

7) Dev-only LOG handling (unchanged)
- LOG remains feature-flagged; in LandscapeMode it should not bloat the dock.
- If logs enabled, put it behind a third tab inside CONSOLE, or keep it hidden unless explicitly opened.

Acceptance criteria
- LandscapeMode on 844x390:
    - Board is large and usable (dominant area).
    - Header is a slim strip only.
    - Actions are reachable via right edge dock (CMD).
    - Cards/tactics reachable via dock CONSOLE tab.
    - No modal trapping, no scrims.
    - No horizontal scroll.
- Portrait remains unchanged and still great.

Deliverables
- Update CommandHeader.tsx with variant="landscape"
- New EdgeCommandDock.tsx
- Update app/page.tsx: detect LandscapeMode and route UI:
    - Header -> landscape variant
    - Replace bottom console drawer with edge dock
- Ensure BoardViewport fills height correctly
- Brief manual test steps for:
    - 390x844 portrait
    - 844x390 landscape

Now implement.
