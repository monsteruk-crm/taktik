# TASK
Integrate constructivist background cut-out SVGs into the existing MOVE and ATTACK button components.

This is UI-only.
Do NOT modify engine logic, reducers, phase logic, or interaction behavior.

---

## VISUAL LANGUAGE (HARD RULES)
- Brutalist + Constructivist military command console
- Flat, hard-edged
- No gradients, no shadows, no blur, no glow
- No rounded corners
- Diagrammatic, not illustrative

---

## BACKGROUND CUT-OUTS
- SVG vectors only
- Flat fills only (no strokes)
- Abstract constructivist geometry
- Clipped to button bounds
- Rendered behind the label text
- Low contrast relative to text

---

## SVG ASSETS

### MOVE cut-out (directional arrows)
Use this SVG exactly:


<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
  <g fill="currentColor">
    <polygon points="10,10 20,20 10,30 14,30 24,20 14,10"/>
    <polygon points="30,10 40,20 30,30 34,30 44,20 34,10"/>
    <polygon points="50,10 60,20 50,30 54,30 64,20 54,10"/>
    <polygon points="70,10 80,20 70,30 74,30 84,20 74,10"/>
  </g>
</svg>

---

### ATTACK cut-out (abstract impact)

Use this SVG exactly:

<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
  <g fill="currentColor">
    <polygon points="50,6 54,18 66,14 58,22 70,26 56,26 60,38 50,28 40,38 44,26 30,26 42,22 34,14 46,18"/>
  </g>
</svg>

---

### STATE BEHAVIOR

Inactive:

* Background symbol uses neutral color
* Subtle, industrial, stamped feel

Active:

* Symbol switches to semantic color family
* * MOVE → blue
* * ATTACK → red
* Symbol remains lower contrast than label text

Disabled:

* Symbol present but further muted
* Matches existing disabled opacity rules
* No hover or interaction

---
IMPLEMENTATION NOTES

* Do not change button size or layout
* Do not animate
* Use existing active/selected state
* SVG should be injected as a background layer
* Color controlled via CSS (currentColor)
* Keep text always visually dominant