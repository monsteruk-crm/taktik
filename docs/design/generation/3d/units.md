**PROMPT (UNITS / Taktik):**

You are generating a tactical boardgame token as a 3D kit of parts.

**Token type:** isometric tactical unit token, **[UNIT_CLASS]** unit
Examples: infantry, special operations, motorized, armored, artillery, recon, air-defense, drone, command, engineer, logistics.

## Visual style

Brutalist Constructivism, cold war military operational aesthetic, constructivist diagram language.
Flat color fields only, diagrammatic (not illustrative), clean edges, hard shapes, no decoration.

## Form rules

* silhouette-first (readable from isometric view)
* abstract irregular block composition
* shoulders + upper mass clearly visible
* asymmetry allowed to encode class identity
* no realism, no identifiable real-world equipment
* no surface detail, no micro-textures

## Block-kit construction (IMPORTANT)

Create **separate objects**, not merged. Name them clearly:

* `Base_Slab` (always)
* `Lower_Mass` / `Chassis` (if applicable)
* `Upper_Mass` / `Shoulders` (always)
* `Asym_Block_01..03` (0–3)
* `Accent_Block_01..02` (0–2, small)

Every block must be:

* axis-aligned box / hard extruded prism only
* hard edges only, no bevel, no rounding
* no smoothing

## Base

Flat brutalist rectangular slab. Hard edges. Single flat fill. No bevel. No shadow.

## Color / Materials (MUST use src/lib/ui/semanticColors.ts)

Use flat materials only (no metalness, gloss, reflections).

* `MAT_BASE`  = `semanticColors.unitBase`
* `MAT_BODY`  = `semanticColors.unitBody`
* `MAT_BODY2` = `semanticColors.unitBody2` (optional, sparing)
* `MAT_ACCENT` = `semanticColors.[FACTION]` where `[FACTION]` is `playerA` or `playerB` (sparingly)

Accent rules:

* max **1 faction accent** material
* accent coverage should be small (1–2 tiny blocks)

## Absolute prohibitions

No gradients, glow, soft shadows, lighting effects, cinematic styling, depth of field, rounded corners, pixel art, miniature feel, “3D render look”, decals, logos, text.

## Output requirements

* Deliver as **separate named objects** (NOT merged)
* Simple topology, low poly
* Unit centered above base, fully visible
* Z-up
* Provide **OBJ+MTL** (or glTF) with materials mapped to the semanticColors above

## Class identity encoding (abstract only)

* infantry: compact core + clear shoulders, minimal asymmetry
* special operations: sharper asymmetry + offset upper mass
* motorized: longer chassis + rear mass, slight forward bias
* armored: wider/heavier chassis, low center of mass
* artillery: rear-extended mass + tall offset upper block
* recon: light chassis, forward offset upper block, strong asymmetry
* command: prominent upper mass + secondary side block (“signal” vibe)

**Fill only:**

* `[UNIT_CLASS] = …`
* `[FACTION] = playerA | playerB`

---




If you want, I can also regenerate your **motorized** + **special ops** versions using *exactly* these semanticColors materials (unitBase/unitBody/unitBody2 + player accent), so your pipeline stays perfectly consistent.
