## Taktik UI Global Rules (Command Console System)

### Scope

These rules apply to all UI work (React components, CSS, MUI theme overrides, and any new panels or overlays).
They exist to prevent regressions into “generic web app UI.”

---

## 1) Non-negotiable visual style

* Flat only: no gradients, no glow, no blur, no glassmorphism, no soft shadows.
* Hard edges: no rounded corners anywhere (`borderRadius = 0`).
* Borders define structure: use borders and inset lines to create hierarchy, not effects.
* Typography is functional: uppercase headings, tight letter spacing, strong weight.

---

## 2) Layout doctrine

* Board-first: the board is the primary surface; everything else supports it.
* No permanent dashboards: avoid always-visible side panels on small screens.
* Overlays are contextual: Cards, Tactics, Log, and Targeting appear only when needed.
* No horizontal scrolling at mobile widths (ever). If something does not fit, it must wrap or truncate.

---

## 3) Frame hierarchy (prevents “double box” mess)

Every visible container must declare its semantic type and follow these rules.

### Surface types

* SURFACE: page/app background.
* FRAME: outer boundary (play surface frame, console boundary).
* PANEL: content slab inside a frame (cards, tactics, log).
* FOCUS PANEL: targeting / pending directives / critical prompts.

### Border rules

* Only one outer border per region.

    * If a component already draws a 2px border, its direct children must not draw another 2px border.

* Nested containers may use dividers (1–2px lines) or header plates (a small titled slab), but not another frame.

### Standard border language

* Outer frame: `2px solid #1B1B1B`.
* Inner inset line: `1px solid rgba(27,27,27,0.25)` inset by 3–4px.
* Dividers: `2px solid #1B1B1B` (preferred), or `1px` only for dense lists.

---

## 4) Color system (hierarchy without effects)

Colors must be opaque; no transparency overlays for panels.

Recommended base palette:

* Base concrete (SURFACE): `#E6E6E2`.
* Panel: `#DEDED8`.
* Panel darker (sections): `#DADAD4`.
* Text/ink: `#1B1B1B`.
* Accent blue: `#1F4E79`.
* Accent red: `#C1121F`.
* Accent yellow: `#F2B705`.

Focus tones (opaque):

* Focus/Targeting: `#E7E0C6` (pale yellow).
* Danger: `#E9D0D0` (pale red).
* Info: `#D9E4EF` (pale blue).

If two adjacent frames look identical, introduce hierarchy via these fills rather than shadows.

---

## 5) “Plates” and “Keys” are the only interactive primitives

* Primary actions must use ObliqueKey (parallelogram command keys).
* Console tabs must use ObliqueTabBar (joined, no gaps).
* Status readouts must use StatusCapsule + ChevronDivider.
* Targeting / pending directives must use OverlayPanel (opaque focus panel).

No ad-hoc buttons. If a design needs a new control, extend one of these primitives.

---

## 6) Responsiveness rules

Breakpoint policy: use an explicit narrow threshold (for example, `max-width: 1100px`) for “dock vs sheet.”

### Desktop

* Right OpsConsole is a dock and does not recenter the page.
* The board remains visually dominant.

### Mobile

* OpsConsole becomes a bottom sheet.
* The command bar wraps into multiple rows.
* Never shrink the board to fit panels; panels overlay.

---

## 7) Targeting UI rules (the “bottom strip”)

* Targeting overlays must be opaque with no see-through panels over the board.
* Targeting panels must be anchored to the play surface frame and use FOCUS PANEL tone.
* Targeting controls must be grouped:

    * left: instruction + progress (“selected 1/1”).
    * right: actions (confirm/cancel/store/etc.).

---

## 8) Motion rules (mechanical, not playful)

No framer-motion required. CSS transitions and keyframes only.

### Animation roles

* ROLE A — State advance (phase change): PhaseRuler fill plus tiny pulse (140ms).
* ROLE B — Command intent: active key underline/state change (90ms).
* ROLE C — Panel reveal: internal collapses/expands only (200ms).
* ROLE D — Critical press: 1px press feedback only (90ms).
* ROLE E — Dev-only: logs have no animation.

Reduced motion:

* If `prefers-reduced-motion: reduce`, disable transforms and pulses; keep minimal opacity changes.

No animation is allowed to move the board or cause layout shift.

---

## 9) Dev-only features must be feature flagged

* LOG is dev-only and must be gated by `NEXT_PUBLIC_SHOW_DEV_LOGS=true`.
* The component remains dynamic; only the tab or panel is hidden.
* If LOG is hidden and currently selected, auto-fallback to CARDS.

---

## 10) Guardrails for PR review

Reject UI changes if any of the following appear:

* gradients, glows, soft shadows, or transparency overlays for panels.
* rounded corners.
* horizontal scrolling on mobile.
* duplicate outer borders (double frames) in the same region.
* “centered modal blob” layouts (content must be docked and structured).
* new UI state that duplicates engine state for gameplay decisions.

## Color Roles for Clarity (MANDATORY)

The UI must communicate meaning through **semantic color**, not just text.

### Non-negotiable rules
- Primary actions MUST be color-coded:
  - MOVE = blue
  - ATTACK = red
  - DICE = yellow
  - END TURN / CONFIRM = black
- Current MODE must be visually dominant (filled accent, inverted text).
- Targeting / selection states MUST trigger a FOCUS treatment (opaque pale yellow panels + focus rail).
- Player identity must be reinforced via stripes on:
  - player plate
  - console header
  - active/focus modules

### Allowed (and recommended)
- Bold flat fills (opaque) for active states
- Accent stripes for inactive states
- Inverted text on filled keys

### Still forbidden
- gradients, glow, blur
- transparency that reveals the board under panels
- “soft” shadows to create hierarchy
