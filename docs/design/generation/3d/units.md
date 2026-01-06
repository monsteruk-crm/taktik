## PROMPT (UNITS / Taktik v2)

You are generating a tactical boardgame unit token as a **readable isometric icon**, built from **abstract block anatomy**, not a sculpture.

**Token type:** isometric tactical unit token, **[UNIT_CLASS]**

---

## Visual style

* Brutalist Constructivism
* cold war military operational aesthetic
* constructivist diagram language
* flat color fields only
* diagrammatic, not illustrative
* clean edges, hard shapes
* no decoration

---

## 🔑 Semantic anatomy (MANDATORY — this fixes legibility)

The unit MUST clearly read as a **humanoid or vehicle form**, even when abstract.

### For HUMANOID units (infantry, special ops, command):

You MUST include **all** of the following as distinct blocks:

* `Head_Block` (small, topmost, centered)
* `Torso_Block` (largest vertical mass)
* `Shoulder_Blocks` (left + right, horizontal emphasis)
* `Arm_Blocks` (simplified, vertical or L-shaped)
* `Leg_Blocks` (two distinct vertical supports)
* `Base_Slab`

No realism, no fingers, no faces —
but the **body plan must be unmistakable**.

### For VEHICLE units (motorized, armored, artillery):

You MUST include:

* `Chassis_Block` (long, low, dominant)
* `Cabin_Block` (raised front or center mass)
* `Payload_or_Turret_Block` (rear or top mass)
* Optional side blocks to suggest wheels/tracks
* `Base_Slab`

The silhouette must clearly suggest:

* **length**
* **direction**
* **weight distribution**

---

## Block-kit construction (IMPORTANT)

* Every body part is a **separate object**
* Axis-aligned boxes or extruded prisms only
* Hard edges only
* No bevel
* No rounding
* No smoothing

Object names must be semantic (`Head_Block`, `Torso_Block`, etc.)

---

## Base

* flat brutalist slab
* rectangular
* hard edges
* single flat fill
* no bevel
* no shadow

---

## 🎨 Color logic (this fixes the “no color” problem)

Colors are **semantic**, not decorative.
They indicate **body regions**, not textures.

Use `src/lib/ui/semanticColors.ts` **explicitly**:

### Mandatory mapping

* Base: `semanticColors.unitBase`
* Torso / Chassis: `semanticColors.unitBody`
* Secondary body parts: `semanticColors.unitBody2`
* Small markers / highlights: `semanticColors.ink`

### Faction accent (REQUIRED)

* Use `semanticColors.playerA` or `playerB`
* Apply to:

    * shoulders OR
    * chest block OR
    * head band / stripe
* Accent must be **clearly visible from isometric view**
* Accent coverage: ~5–15% of visible area (not tiny cubes!)

⚠️ A unit with no visible accent color is INVALID.

---

## Abstraction limits (very important)

You are NOT allowed to:

* collapse the body into a single stack
* hide arms/legs entirely
* produce a “pile of blocks”
* rely only on silhouette without anatomy

If the unit cannot be identified as:

* “a soldier”
* “a vehicle”
* “an artillery piece”

…then the output is WRONG.

---

## Absolute prohibitions

* no gradients
* no glow
* no soft shadows
* no lighting effects
* no cinematic styling
* no depth of field
* no rounded corners
* no surface textures
* no realistic equipment
* no miniature look
* no voxel art

---

## Unit-class shaping rules (strong hints, not decoration)

* **Light infantry**
  Slim proportions, visible legs, upright stance, clear head–torso separation

* **Special operations**
  Same anatomy, but asymmetry in shoulders or arms, some tech details

* **Motorized**
  Long chassis, raised cabin, rear payload block — reads horizontally

* **Armored**
  Very wide chassis, low profile, dominant central mass

* **Artillery**
  Rear-heavy silhouette, long rear block, elevated firing mass


## Output requirements

* Separate named objects (NOT merged)
* Low poly
* Z-up
* Centered
* Fully visible
* OBJ + MTL or glTF
* Flat materials mapped to `semanticColors`

---


---

### Fill only:

* `[UNIT_CLASS] = …`
* `[FACTION] = playerA | playerB`

---

