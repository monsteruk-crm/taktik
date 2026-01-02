YOU ARE CODEX. WORK INSIDE THIS REPO.

Problem
Mobile console is unusable:
- It opens as a “modal” that blocks the board + makes other UI unreachable.
- It renders as a thin slice with no usable interaction surface.
- Scrolling and focus trapping cause the page to feel broken.

Goal
On narrow screens, the OpsConsole must become a NON-MODAL “console drawer”:
- It overlays the board but does NOT trap interaction like a modal.
- It has snap heights (peek/half/full) and a strong handle to control them.
- It must never cover the top command bar permanently; user can always reach it.
- No horizontal scrolling at mobile widths.

Hard constraints
- DO NOT change engine logic, reducer, phases, card/tactic behavior.
- UI only.
- Flat style, hard borders, no glow, no gradients, no soft shadows.
- Must respect prefers-reduced-motion.

Key decision (MANDATORY)
STOP using MUI Modal/SwipeableDrawer for the mobile console.
Implement the mobile console as a fixed-position bottom overlay panel with manual height control.
Reason: Drawer/Modal behavior + focus trap + scroll lock are what make everything unreachable.

Implementation steps

1) Create a new component: components/MobileConsoleDrawer.tsx
   Props:
- open: boolean
- onOpenChange(open:boolean): void
- header: ReactNode (TAKTIK COMMAND plate)
- tabs: ReactNode (ObliqueTabBar)
- body: ReactNode (panel content)
- initialSize?: "peek" | "half" | "full"
- devNotice?: ReactNode (optional)

Behavior:
- Renders as <Box position="fixed" left=0 right=0 bottom=0 zIndex high>
- Uses explicit heights (in dvh) with a cap:
    - peek: 22dvh (min 160px)
    - half: 55dvh (min 360px)
    - full: 82dvh (max 720px)
- Stores size in state: size = peek/half/full
- If open becomes true → default to half (NOT peek). Peek is allowed only when user explicitly collapses.

Non-modal rules (CRITICAL):
- NO backdrop/scrim.
- NO focus trap.
- NO scroll lock on body.
- Pointer events:
    - Drawer panel: pointerEvents:auto
    - Everything behind: stays interactive in uncovered areas.
- Provide a close “X” in header to fully hide it.

Handle + snap control:
- Add a visible handle bar at top (like your screenshot but bigger and “grabbable”):
    - 44px tall handle zone
    - centered handle pill
    - tapping handle cycles sizes: peek → half → full → half …
- Also support drag (optional MVP):
    - On pointer move, set height based on delta and snap on release to nearest size.
    - If drag is too much, implement tap-to-cycle only (acceptable).

Scrolling:
- Drawer content area (body) is the only scroll container:
    - overflow:auto; minHeight:0
- DO NOT allow the page to scroll because of the drawer.

2) Integrate MobileConsoleDrawer into the page layout
   In app/page.tsx (or your layout component):
- Use isNarrow = useMediaQuery("(max-width:1100px)")
- Desktop:
    - keep right dock console
- Mobile:
    - render <MobileConsoleDrawer open={consoleOpen} ...>
    - The “CONSOLE” button toggles open/close
    - When opening, set size to "half" (default)

3) Fix the command bar reachability
   On mobile:
- Keep top command bar fixed and always visible.
- Ensure drawer full height leaves at least command bar height visible:
    - full height must be <= (100dvh - commandBarHeight - 8px)
      If needed, clamp "full" to 76dvh instead of 82dvh.

4) Prevent “slice” state from being unusable
   Rule:
- If open === true and size === "peek":
    - The peek state must still show:
        - Taktik Command header (one line)
        - Current tab label
        - A clear “tap to expand” affordance
          So peek must include header + tab strip, not just a sliver.

5) Add a “safe touch target rail”
   At the very top of the drawer, add a 2px border rail and a 44px handle zone.
   This prevents accidental board taps and makes intent obvious.

6) Motion roles (use your existing motion tokens)
   ROLE C — PANEL REVEAL:
- When opening/closing or changing size:
    - transition height with 200ms (stiff)
    - reduced motion: no animation (instant)
- No bouncing, no overshoot.

7) Verification checklist (must pass)
- 390x844:
    - opening console shows HALF height by default (usable immediately)
    - no scrim, no modal trapping, top command bar remains reachable
    - page does not lock scroll; only drawer content scrolls
    - board remains interactive above the drawer (uncovered portion)
- Switching tabs works in drawer.
- LOG remains feature-flagged dev-only as before.
- No horizontal scroll anywhere.

Deliverables
- components/MobileConsoleDrawer.tsx (new)
- app/page.tsx updated to use it on mobile instead of SwipeableDrawer/Modal
- Remove any leftover SwipeableDrawer usage for console on mobile
- Brief test steps for mobile + reduced motion

Now implement.
