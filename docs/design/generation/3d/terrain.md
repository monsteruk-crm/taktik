## PROMPT (TERRAIN / Taktik v2)

You are generating tactical boardgame terrain as a **readable isometric terrain tile**, built from **abstract semantic masses**, not decorative scenery.

**Terrain type:** isometric tactical terrain tile, **[TERRAIN_CLASS]**

Examples: forest, woods, hill, building, bunker, wall, barricade, rubble, trench, bridge, objective.

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

## 🔑 Semantic terrain language (MANDATORY)

Each terrain type MUST communicate its identity using **mass repetition and spatial pattern**, not texture or detail.

### Terrain is defined by:

* **vertical rhythm**
* **density**
* **negative space**
* **cluster pattern**

A single solid block is NOT valid terrain unless explicitly required (e.g. bunker).

---

## Terrain-class semantic rules

### 🌲 Forest / Woods (VERY IMPORTANT)

To represent a forest, you MUST:

* Use **multiple vertical pillar-like blocks** (tree abstractions)
* Vary their heights slightly (2–3 discrete heights max)
* Cluster them in groups, not evenly spaced
* Leave visible gaps between trunks (permeable terrain)
* Avoid merging into one solid green mass

Required objects:

* `Ground_Slab`
* `Tree_Trunk_01..N` (at least 5, ideally 7–12)
* Optional `Canopy_Block_01..N` (blocky, flat, no spheres)

Forbidden:

* single monolithic green block
* smooth shapes
* cone/sphere “tree” icons
* decorative foliage

The forest should read immediately as:

> “many vertical things → forest → cover terrain”

---

### 🏠 Building

* One dominant mass
* 1–2 secondary stacked masses
* Clear roof plate
* Solid, opaque, impassable

---

### 🧱 Wall / Barricade

* Long, low repeated slabs
* Horizontal rhythm
* Partial cover implied by height

---

### 🪨 Rubble

* Many small irregular blocks
* Low profile
* Chaotic but still blocky
* No single dominant mass

---

### 🕳 Trench

* Stepped negative space implied via slabs
* Horizontal cuts
* No literal holes or sculpted trenches

---

## Modular construction (IMPORTANT)

Create **separate objects**, not merged:

* `Ground_Slab` (almost always)
* `Primary_Mass` or repeated masses
* `Secondary_Mass_01..N`

Each object:

* axis-aligned box or extruded prism
* hard edges only
* no bevel
* no rounding

---

## 🎨 Color logic (semanticColors.ts REQUIRED)

Use flat materials only, mapped explicitly:

### Ground

* `semanticColors.terrainBase`

### Terrain masses

* `semanticColors.terrainMass`
* `semanticColors.terrainMass2` (variation only)

### Forest-specific

* Trunks: `semanticColors.success` OR `semanticColors.info` (muted green)
* Ground still neutral (NOT green slab)

⚠️ Entire tile being green is INVALID.

Green must appear as **repeated vertical elements**, not as a solid base.

---

## Abstraction limits

You are NOT allowed to:

* rely on color alone to define terrain
* use a single mass for complex terrain
* use texture to imply meaning
* create decorative scenery

If the terrain cannot be identified in 1 second from isometric view, it is WRONG.

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
* no noise
* no decals
* no text

---

## Output requirements

* Separate named objects (NOT merged)
* Low poly
* Z-up
* Centered
* Fully visible
* OBJ + MTL or glTF
* Flat materials from `semanticColors.ts`

---
