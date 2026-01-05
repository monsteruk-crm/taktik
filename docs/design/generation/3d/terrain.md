**PROMPT (TERRAIN / Taktik):**

You are generating tactical boardgame terrain as a 3D modular kit of parts.

**Terrain type:** isometric tactical terrain, **[TERRAIN_CLASS]**
Examples: wall, barricade, building, bunker, tower, platform, bridge, rubble, trench, hill, cover block, objective marker, industrial.

## Visual style

Brutalist Constructivism, cold war military operational aesthetic, constructivist diagram language.
Flat color fields only, diagrammatic (not illustrative), clean edges, hard shapes, no decoration.

## Form rules

* readable silhouette from isometric angle
* abstract massing, no realism
* no identifiable real-world details (no doors/windows/signage/pipes)
* no surface detail, no micro-textures
* hard edges only, no bevel, no rounding
* avoid fragile thin parts

## Modular construction (IMPORTANT)

Create **separate objects**, not merged. Name them clearly:

* `Footprint_Base` (optional but recommended)
* `Primary_Mass` (always)
* `Secondary_Mass_01..04` (0–4)
* `Top_Plate_01..02` / `Cover_Slab_01..02` (0–2)
* `Trim_Block_01..02` (0–2, neutral accent only)

## Color / Materials (MUST use src/lib/ui/semanticColors.ts)

Flat materials only:

* `MAT_BASE`  = `semanticColors.terrainBase`
* `MAT_MASS`  = `semanticColors.terrainMass`
* `MAT_MASS2` = `semanticColors.terrainMass2` (optional)
* `MAT_TRIM`  = `semanticColors.terrainEdge` (sparingly)

Faction colors (`semanticColors.playerA/playerB`) are **not** used on terrain unless explicitly requested for “owned structures”.

## Absolute prohibitions

No gradients, glow, soft shadows, lighting effects, cinematic styling, depth of field, rounded corners, realistic textures, decals, text.

## Output requirements

* Deliver as **separate named objects** (NOT merged)
* Simple topology, low poly
* Centered, fully visible
* Z-up
* Provide **OBJ+MTL** (or glTF) using the semanticColors materials above

## Terrain identity encoding (abstract only)

* wall/barricade: long low slab + 1–2 offset blocks
* bunker: squat heavy mass + thick top plate
* building: stacked masses + stepped roof plate
* tower: vertical stack + stable base + one side offset
* platform: thin top slab on chunky supports
* bridge: long top slab + two support pylons
* rubble: low profile irregular stacked blocks
* trench: stepped slabs implying negative space (no detailed cuts)
* hill: stepped terraces (no smooth slope)
* objective: compact base + tall monolith + small trim plate

**Fill only:**

* `[TERRAIN_CLASS] = …`

---