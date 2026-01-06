# Terrain Tiles

## What this feature does
Generates a deterministic base terrain tile per board cell (`PLAIN`, `ROUGH`, `FOREST`, `URBAN`, `INDUSTRIAL`, `HILL`, `WATER`) and renders the matching `public/assets/tiles/terrain-*.png` tile beneath road/river/bridge overlays.

## Why it exists (manual reference)
The manual establishes distinct terrain features on the play surface. This system encodes those terrain classes into deterministic, legible regions so the board reads as a tactical map without introducing non-deterministic noise. Source: `docs/Taktik_Manual_EN.md`.

## Constraints
- Deterministic: terrain generation consumes the terrain seed and returns the next seed.
- No speckle: regions must be coherent blobs, not per-cell noise.
- Road/river cells always render as `PLAIN` base tiles so overlays remain crisp.
- Water is tied to river-adjacent widening cells and protected from smoothing or cleanup.
- Urban/Industrial are seeded clusters placed near roads/bridges, never from noise.
- Roads/rivers remain visually dominant; terrain is the “paper,” networks are the “ink.”
- Debug overlay uses flat, opaque legend colors and is gated by `NEXT_PUBLIC_TERRAIN_DEBUG=true`.

## Edge cases
- Small isolated regions of FOREST/ROUGH/HILL are dissolved to the dominant neighboring terrain (or `PLAIN` if no neighbor dominates).
- Water widening is only applied at river bends/confluences and never spills onto road cells.
- River and road cells are forced back to `PLAIN` after all cleanup passes.
- Edge cells are biased back to `PLAIN` unless they are protected (WATER/URBAN/INDUSTRIAL).

## How to test it manually
1. Set `NEXT_PUBLIC_TERRAIN_DEBUG=true` and start the dev server (`npm run dev`).
2. Load the board and confirm large terrain blobs with readable roads/rivers on top.
3. Verify no isolated single tiles for FOREST/ROUGH/HILL remain.
4. Confirm urban/industrial clusters are compact and biased toward roads/bridges.
5. Check the debug legend counts/regions against the target ranges in `docs/implementation/terrain.md`.
