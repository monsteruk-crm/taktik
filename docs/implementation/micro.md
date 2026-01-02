YOU ARE CODEX. WORK INSIDE THIS REPO.

Goal
Upgrade the top command bar “stats” into manufactured status capsules with chevron dividers + micro iconography (flat), matching the reference.
Keep everything responsive and avoid horizontal scrolling at mobile widths.

Hard constraints
- DO NOT change engine logic, reducer, phase sequencing, or card/tactic behavior.
- UI only.
- No gradients, no glow, no soft shadows.
- Must remain readable and not overflow on mobile.

Target visual
- VP / TURN / PHASE / STATUS / MODE / SELECTED / PENDING / LAST ROLL become small “capsules”
- Capsules are flat plates with thick borders, optional accent stripe, and chevron separators between groups.
- Feels like a printed ops console.

Implementation steps

1) Create UI primitives
   Create: components/ui/StatusCapsule.tsx

Requirements
- Base element: Box or ButtonBase (not clickable by default)
- Shape: rectangular plate (optionally slight oblique ends if you want), but simplest is flat rectangle.
- Style:
    - background: #E6E6E2
    - border: 2px solid #1B1B1B
    - padding: 4px 8px (sm), 6px 10px (md)
    - uppercase label, letterSpacing 0.08em, fontWeight 800
    - Value part should be more prominent (fontWeight 900) but same font.
- Supports props:
    - label: string (e.g. "TURN")
    - value: string | number (e.g. "1")
    - tone?: "neutral" | "blue" | "red" | "yellow" | "black"
    - compact?: boolean
    - icon?: ReactNode (optional)
    - maxWidth?: number (optional clamp)
- Add inner line via ::after:
    - inset 3px, border 1px rgba(27,27,27,0.25)

Create: components/ui/ChevronDivider.tsx
- A tiny flat “>>” style separator between capsule groups
- Do NOT use SVG gradients; simplest:
    - A 14px wide element with clip-path to form a chevron wedge
    - Or use a pseudo element triangle (CSS) twice to form double chevron
- Border: 2px solid #1B1B1B
- Fill: #E6E6E2
- Must not create gaps; sits between plates.

2) Micro iconography (flat)
   Create: components/ui/MicroIcon.tsx
   Provide 6 icons as simple CSS/SVG paths (flat, single color):
- VP (flag or star)
- TURN (hash or circular arrow)
- PHASE (stacked bars)
- STATUS (dot indicator)
- MODE (crosshair)
- ROLL (dice pip grid)
  Rules:
- One color only (#1B1B1B or inverted for dark backgrounds)
- No stroke effects beyond plain lines
- S
