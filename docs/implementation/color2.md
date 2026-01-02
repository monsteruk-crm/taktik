YOU ARE CODEX. WORK INSIDE THIS REPO.

Problem
UI is technically correct but hard to read because:
- too many elements share the same “concrete plate” fill
- active/inactive/focus states are not visually dominant enough
- text contrast is inconsistent (e.g. white text on yellow tabs)
- panels lack a strong “header band” system to guide scanning

Goal
Improve legibility and distinguishability using:
- a stricter neutral hierarchy (SURFACE / PANEL / PANEL_DARK / INK_BAND)
- semantic fills for ACTIVE states (not just stripes)
- guaranteed text contrast rules (no white-on-yellow)
- bold section header bands (“instrument panel bands”) without gradients/shadows

Hard constraints
- DO NOT change engine logic, reducer, phases, targeting behavior.
- UI only.
- No gradients, glow, blur, soft shadows.
- Panels must be opaque (no transparency over the board).

Implementation plan

1) Add a contrast palette + text-on-color helper
   Create or update: lib/ui/semanticColors.ts
   Add neutrals:
- surface: #E6E6E2
- surface2: #EFEFEA (lighter “paper”)
- panel: #DEDED8
- panel2: #D2D2CB (darker slab)
- ink: #1B1B1B
- ink2: #2A2A2A (optional for secondary dark fills)

Add accents (existing):
- blue: #1F4E79
- red: #C1121F
- yellow: #F2B705

Add helper:
- textOn(bg): returns #1B1B1B or #E6E6E2 using luminance threshold
  Rule: yellow ALWAYS uses #1B1B1B text (never white).

2) Introduce “BandHeader” pattern (this is the readability jump)
   Create: components/ui/BandHeader.tsx
- A full-width header band inside panels:
    - background: ink
    - text: surface
    - border: 2px solid ink
    - inner inset line optional
    - optional accent stripe (6px) on left in blue/red/yellow depending on context
- Height: 34–38px
- Typography: uppercase, bold, letterSpacing 0.08em

Use BandHeader for:
- OpsConsole header (“TAKTIK COMMAND”)
- Section headers: “PENDING CARD DIRECTIVE”, “STORED BONUSES”, “OPEN WINDOWS”, “WINDOW: …”
  Do NOT change behavior; only replace the current pale header plates with BandHeader.

3) Make state visually dominant by switching from “stripe-only” to “fill for ACTIVE”
   Update primitives:
- ObliqueKey
- ObliqueTabBar
- StatusCapsule
  Rules:
- ACTIVE = filled accent (blue/red/yellow/ink) + textOn(accent)
- INACTIVE = panel fill + accent stripe
- DISABLED = panel2 fill + no stripe + opacity 0.35 + no hover invert

Important:
- Yellow ACTIVE must be yellow fill + black text.
- Red/Blue ACTIVE should likely be accent fill + surface text.

4) Tabs must be unmistakable (Cards/Tactics/Log)
   Update ObliqueTabBar:
- CARDS tab accent = yellow
- TACTICS tab accent = blue
- LOG tab accent = neutral gray (dev-only, do not compete)
  Make selected tab:
- filled accent (not black)
- textOn(accent)
- maintain joined, no gaps, correct overlap z-index

This removes the “everything becomes black selected” ambiguity.

5) Introduce “Zone tinting” to separate major regions (still flat)
   Apply subtle but obvious background differences:
- Command header background: surface2
- Board frame interior background: surface2
- OpsConsole dock background: panel
- OpsConsole internal panels: panel2
  These are opaque fills; no gradients.

6) Fix dense text readability
- Reduce letterSpacing slightly for body text inside panels (keep headings tight).
- Ensure summary/usage text uses a darker neutral (ink) and adequate font size.
- Add consistent lineHeight for body text (1.25–1.35).

7) Focus/Targeting must scream “you’re in a mode”
   Where targeting is active:
- OverlayPanel tone="focus" uses focus fill (#EFE5C7 or slightly stronger)
- Add a 6px yellow rail at top + a small “FOCUS” capsule
- Ensure action buttons inside focus overlays use ACTIVE semantic fills:
    - SELECT TARGETS = yellow fill + black text
    - CONFIRM = ink fill + light text
    - CANCEL = panel2 fill + ink text

8) Verify (acceptance)
- CARDS tab is readable (no white-on-yellow).
- Users can instantly tell:
    - what is active
    - where they are (Cards vs Tactics)
    - whether they are in targeting/focus
- No engine behavior changes.

Deliverables
- semanticColors.ts updates + textOn helper
- BandHeader.tsx new
- Update OpsConsole sections to use BandHeader
- Update ObliqueTabBar to use filled accent for active tab
- Update keys/capsules to use ACTIVE=fill policy
- Brief manual checks + viewport checks

Now implement.
