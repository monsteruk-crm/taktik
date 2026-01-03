Yes — that’s the **right consolidation step** 👍
Below is a **single, clean Markdown document** you can drop into your repo (I suggest
`docs/implementation/TOP_BAR_PHASE_WIREFRAMES.md`).

It contains **all 7 phase wireframes embedded inline as SVG**, and it reads like a spec, not a brainstorm. This is exactly the kind of thing Codex (and humans) can follow without drifting.

---

````md
# Taktik Top Command Bar — Phase Wireframes (Authoritative)

This document defines the **authoritative visual specification** for the **Top Command Bar**
across all engine phases.

Each phase below is represented by an SVG wireframe.
These SVGs are **not decorative** — they define:

- grouping
- hierarchy
- which controls are active vs inactive
- semantic meaning of each button

UI implementations MUST match these wireframes.
Engine logic MUST NOT be changed.

---

## Global Rules (apply to all wireframes)

- Three zones exist and must never mix:
  - **MODE** (left): MOVE / ATTACK (tools)
  - **ACTIONS** (center): context-dependent actions
  - **FLOW** (right): NEXT PHASE / END TURN
- FLOW controls are always grouped on the right.
- END TURN is always black with a red stripe.
- MODE buttons are only active during ACTIONS phases.
- Inactive controls remain visible but clearly disabled.
- Flat style only. No gradients, glow, blur, or shadows.

---

## Phase 1 — TURN_START

Purpose: Start of turn. Player may only advance the game clock.

Active controls:
- NEXT PHASE

Inactive:
- MOVE, ATTACK, all ACTIONS

```svg
<svg width="1200" height="190" viewBox="0 0 1200 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="1180" height="170" fill="#E6E6E2" stroke="#1B1B1B" stroke-width="2"/>
  <text x="520" y="44" font-size="14" font-weight="800">PHASE: TURN START</text>

  <rect x="960" y="98" width="90" height="52" fill="#D2D2CB" stroke="#1B1B1B" stroke-width="2"/>
  <text x="984" y="128" font-weight="900">NEXT</text>

  <rect x="1056" y="98" width="110" height="52" fill="#1B1B1B"/>
  <rect x="1056" y="98" width="6" height="52" fill="#C1121F"/>
  <text x="1090" y="128" fill="#E6E6E2" font-weight="900">END</text>
</svg>
````

---

## Phase 2 — CARD_DRAW

Purpose: Player draws a card.

Active controls:

* DRAW

```svg
<svg width="1200" height="190" viewBox="0 0 1200 190" xmlns="http://www.w3.org/2000/svg">
  <text x="520" y="44" font-size="14" font-weight="800">PHASE: CARD</text>

  <rect x="520" y="102" width="200" height="36" fill="#F2B705" stroke="#1B1B1B" stroke-width="2"/>
  <text x="580" y="126" font-weight="900">DRAW</text>

  <rect x="960" y="98" width="90" height="52" fill="#D2D2CB" stroke="#1B1B1B" stroke-width="2"/>
  <text x="984" y="128" font-weight="900">NEXT</text>

  <rect x="1056" y="98" width="110" height="52" fill="#1B1B1B"/>
  <rect x="1056" y="98" width="6" height="52" fill="#C1121F"/>
  <text x="1090" y="128" fill="#E6E6E2" font-weight="900">END</text>
</svg>
```

---

## Phase 3 — CARD_RESOLUTION

Purpose: Resolve drawn card effects.

Active controls:

* RESOLVE

```svg
<svg width="1200" height="190" viewBox="0 0 1200 190" xmlns="http://www.w3.org/2000/svg">
  <text x="520" y="44" font-size="14" font-weight="800">PHASE: CARD</text>

  <rect x="520" y="102" width="240" height="36" fill="#1B1B1B"/>
  <rect x="520" y="102" width="6" height="36" fill="#F2B705"/>
  <text x="570" y="126" fill="#E6E6E2" font-weight="900">RESOLVE</text>

  <rect x="960" y="98" width="90" height="52" fill="#D2D2CB" stroke="#1B1B1B" stroke-width="2"/>
  <text x="984" y="128" font-weight="900">NEXT</text>

  <rect x="1056" y="98" width="110" height="52" fill="#1B1B1B"/>
  <rect x="1056" y="98" width="6" height="52" fill="#C1121F"/>
  <text x="1090" y="128" fill="#E6E6E2" font-weight="900">END</text>
</svg>
```

---

## Phase 4 — MOVEMENT

Purpose: Player performs movement actions.

Active controls:

* MOVE (mode)

```svg
<svg width="1200" height="190" viewBox="0 0 1200 190" xmlns="http://www.w3.org/2000/svg">
  <text x="520" y="44" font-size="14" font-weight="800">PHASE: ACTIONS</text>

  <rect x="20" y="102" width="220" height="36" fill="#1F4E79"/>
  <text x="100" y="126" fill="#E6E6E2" font-weight="900">MOVE</text>

  <rect x="960" y="98" width="90" height="52" fill="#D2D2CB" stroke="#1B1B1B" stroke-width="2"/>
  <text x="984" y="128" font-weight="900">NEXT</text>

  <rect x="1056" y="98" width="110" height="52" fill="#1B1B1B"/>
  <rect x="1056" y="98" width="6" height="52" fill="#C1121F"/>
  <text x="1090" y="128" fill="#E6E6E2" font-weight="900">END</text>
</svg>
```

---

## Phase 5 — ATTACK

Purpose: Player performs attacks.

Active controls:

* ATTACK (mode)

```svg
<svg width="1200" height="190" viewBox="0 0 1200 190" xmlns="http://www.w3.org/2000/svg">
  <text x="520" y="44" font-size="14" font-weight="800">PHASE: ACTIONS</text>

  <rect x="250" y="102" width="220" height="36" fill="#C1121F"/>
  <text x="330" y="126" fill="#E6E6E2" font-weight="900">ATTACK</text>

  <rect x="960" y="98" width="90" height="52" fill="#D2D2CB" stroke="#1B1B1B" stroke-width="2"/>
  <text x="984" y="128" font-weight="900">NEXT</text>

  <rect x="1056" y="98" width="110" height="52" fill="#1B1B1B"/>
  <rect x="1056" y="98" width="6" height="52" fill="#C1121F"/>
  <text x="1090" y="128" fill="#E6E6E2" font-weight="900">END</text>
</svg>
```

---

## Phase 6 — DICE_RESOLUTION

Purpose: Resolve attack outcomes.

Active controls:

* ROLL DICE
* RESOLVE ATTACK

```svg
<svg width="1200" height="190" viewBox="0 0 1200 190" xmlns="http://www.w3.org/2000/svg">
  <text x="520" y="44" font-size="14" font-weight="800">PHASE: RESOLUTION</text>

  <rect x="520" y="102" width="200" height="36" fill="#F2B705"/>
  <text x="570" y="126" font-weight="900">ROLL DICE</text>

  <rect x="730" y="102" width="260" height="36" fill="#1B1B1B"/>
  <rect x="730" y="102" width="6" height="36" fill="#C1121F"/>
  <text x="780" y="126" fill="#E6E6E2" font-weight="900">RESOLVE ATTACK</text>

  <rect x="960" y="98" width="90" height="52" fill="#D2D2CB" stroke="#1B1B1B" stroke-width="2"/>
  <text x="984" y="128" font-weight="900">NEXT</text>

  <rect x="1056" y="98" width="110" height="52" fill="#1B1B1B"/>
  <rect x="1056" y="98" width="6" height="52" fill="#C1121F"/>
  <text x="1090" y="128" fill="#E6E6E2" font-weight="900">END</text>
</svg>
```

---

## Phase 7 — END_TURN

Purpose: End the current turn.

Active controls:

* END TURN only

```svg
<svg width="1200" height="190" viewBox="0 0 1200 190" xmlns="http://www.w3.org/2000/svg">
  <text x="520" y="44" font-size="14" font-weight="800">PHASE: END</text>

  <rect x="960" y="98" width="200" height="52" fill="#1B1B1B"/>
  <rect x="960" y="98" width="8" height="52" fill="#C1121F"/>
  <text x="1030" y="128" fill="#E6E6E2" font-weight="900">END TURN</text>
</svg>
```

---

## Enforcement

* These SVGs are the **single source of truth** for the Top Command Bar.
* Any UI implementation that deviates must update this document first.
* Engine logic and phase sequencing are out of scope.

```

---

### Yes — you were right
You **did** need another prompt (which you already have), but this markdown is the missing piece:  
it turns a design discussion into an **immutable contract**.

If you want next, I can:
- compress this into a **one-page PDF spec**, or  
- generate a **phase→UI mapping table** to paste directly into code comments.
```
