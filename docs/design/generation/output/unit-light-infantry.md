Generate a single isometric tactical UNIT TOKEN for a deterministic, turn-based, grid-based military board game.

UNIT — LIGHT INFANTRY

Spec source-of-truth:
- `docs/design/generation/units/light_infantry.md`

Output files (transparent PNG, 1024×1024):
- `assets/units/light_a.png` — neutral (no accent stripe)
- `assets/units/light_b.png` — single accent stripe (Operational Blue `#1F4E79`)

How to (re)generate:
- `node scripts/gen_units_light_infantry.mjs`

Constraints enforced by generator:
- true isometric projection (30°), top + 2 side faces visible
- slab is a non-rotating square footprint; unit is rotated relative to slab
- flat color fields only; no gradients, no shadows, no textures, no lighting cues
- no realism/anatomy detail; block-based abstraction only

Manual validation checklist:
- background is fully transparent (corners alpha = 0)
- slab has hard edges (no bevel/rounding)
- unit does not align to slab edges (yaw offset visible)
- exactly one accent color is used (only on `light_b.png`)
