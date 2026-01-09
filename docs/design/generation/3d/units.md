 PROMPT — UNITS / TAKTIK v2.2 (VISUAL DOMINANCE EDITION)

You are generating a tactical boardgame **unit marker** designed to be **immediately readable on a dense isometric map**.

This is NOT a decorative asset.
This is a **foreground command token** that must visually dominate terrain.

**Token type:** isometric tactical unit token, **[UNIT_CLASS]**
**Faction:** **[FACTION]**

The unit must be identifiable in **under 150ms** at gameplay zoom.

---

## PRIMARY GOAL (NON-NEGOTIABLE)

> The unit must **interrupt the map visually**, not blend into it.

If the unit visually harmonizes with terrain → INVALID.

---

## Visual style (BASE)

* Brutalist Constructivism
* Cold war military operational aesthetic
* Diagrammatic, not illustrative
* Flat colors only
* Hard edges only
* No decoration

---

## 🔑 Enforced block anatomy (HUMANOID)

You MUST build a **blocky humanoid** with exaggerated, readable mass.

Required blocks:

* Head_Block — small but **high-contrast**
* Torso_Block — **dominant vertical mass**
* Shoulder_Blocks — **wide, visually heavy**
* Arm_Blocks — thick, simplified, clearly attached
* Leg_Blocks — **thick and separated**
* Base_Slab — flat anchor

### ❗ Critical exaggeration rules

* Shoulders must be visually wider than legs
* Arms and legs must be **thicker than realistic**
* No thin columns
* No elegant proportions

This is a **marker**, not a statue.

---

## 📐 Scale & dominance rules (THIS IS NEW)

* Unit height must visually exceed:

  * road tiles
  * river tiles
  * flat terrain features
* Unit silhouette must remain readable when reduced to **32–48px height**
* If the unit disappears at that scale → INVALID

---

## 🎨 COLOR BLOCKING (THIS IS THE REAL FIX)

Forget “subtle”.

### Mandatory color separation

You MUST use **at least THREE clearly distinct color blocks**:

1. **Torso** — darkest or strongest value
2. **Shoulders** — high-contrast accent (NOT same value as torso)
3. **Legs/Base** — lighter or neutral value

Uniform coloring = INVALID.

### Faction color usage (AMPLIFIED)

Faction color MUST be:

* applied to **large shoulder blocks**
* OR a bold chest band
* Coverage: **10–20% of visible area**

Tiny accents are forbidden.

The unit should be identifiable as Player A / B **from the corner of the eye**.

---

## Anti-camouflage rule (VERY IMPORTANT)

The unit must **NOT** use:

* the same dominant value as the terrain underneath
* the same saturation level as roads / rivers

If sampled values are too close → INVALID.

---

## Abstraction limit (UPDATED)

Allowed:

* chunky limbs
* toy-like blockiness
* exaggerated geometry

Forbidden:

* monolithic stacks
* thin totems
* uniform slabs
* “graphic icon” look

If it looks like an icon instead of a physical marker → WRONG.

---

## Absolute prohibitions

* No gradients
* No glow
* No shadows
* No lighting
* No textures
* No bevels
* No smooth silhouettes
* No realism
* No miniature aesthetics

---

## Output

* Low poly
* Separate named blocks
* Z-up
* Centered
* OBJ + MTL or glTF
* Flat materials only

