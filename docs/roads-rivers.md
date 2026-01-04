# Roads + Rivers (UI Overlay)

## What this feature does
- Generates topology-aware road and river overlay tiles and renders them on the isometric board using engine-provided terrain networks.

## Why it exists (rule source / manual reference)
- Visual board context first; terrain is now generated in engine state for future rules in `docs/Taktik_Manual_EN.md`.

## Constraints
- Terrain networks live in engine state but do not affect rules yet.
- Overlays must align with `TILE_LAYOUT` width/height and use the same grid positioning as ground tiles.
- Overlays are top-face only using the isometric (s,t) basis, flat color, no gradients, no texture, no glow.
- Networks render on a faint top-face slab (5% alpha) to visually center the overlays.
- Roads render above rivers when both exist on the same tile.
- River palette is a cyan/blue-leaning channel with a brighter inner band for contrast.
- Topology recipes must be deterministic and tileable; each edge combination has a distinct layout.
- Network density is controlled by `GameState.terrain.params` and generated from `GameState.rngSeed`.
- Density values greater than `1` are interpreted as percentages (e.g. `4` → `0.04`).
- The optional `GameState.terrain.params.maxBridges` value caps how many river-crossing road tiles (bridges) the generator will place, so overlays should never render more bridged cells than this configured limit.

## Edge cases
- Single-tile networks render as a centered join plate (no arms).
- T/X junctions rely on shared connector geometry; mismatched adjacency will look broken.

## How to test it manually
1. Run `npm run gen:tiles` to generate tiles and network overlays.
2. Run `npm run dev`.
3. Confirm a new game produces roads and rivers across multiple tiles (not just a fixed demo).
4. Verify overlays align with ground tiles when panning/zooming and do not bleed outside the diamond face.
