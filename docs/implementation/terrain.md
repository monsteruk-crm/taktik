**CODEX PROMPT — Terrain Biomes Placement (avoid “mess”, keep it like an ops-map)**

You are working on **TAKTIK** (deterministic, seeded, replayable). The roads + rivers network generation is already correct and must NOT be rewritten. Your task is to add a new deterministic layer that assigns **base terrain tiles** per cell using the existing PNGs:

* `terrain-01-plain.png`
* `terrain-02-rough.png`
* `terrain-03-forest.png`
* `terrain-04-urban.png`
* `terrain-05-hill.png`
* `terrain-06-water.png`
* `terrain-10-industrial.png`

**Hard requirements**

1. **No confetti / noise.** Terrain must form **large coherent regions** (blobs), not per-cell speckling.
2. **Deterministic.** Use the engine/map seed (or terrain seed) and a seeded RNG. No `Math.random()`.
3. **Network-first layering.** Roads/rivers/bridges remain clearly readable: terrain is the “paper”, networks are the “ink”. Terrain must never “fight” the network legibility.
4. **Protected terrain classes.** Water tied to rivers; urban/industrial clustered; hills/rough coherent; forests coherent.
5. **Post-process cleanup.** Enforce **minimum region sizes** via flood-fill; eliminate tiny islands.
6. Must align with the project’s strict “Brutalist Constructivism” abstraction: symbolic, clean, hard-edged, not landscape-y.

---

## What to implement

### A) Add a terrain biome generator (new function/module)

Create (or extend) a function like:

`generateTerrainBiomes({ width, height, seed, rivers, roads, bridges }) => TerrainType[][]`

Where `TerrainType` is one of:
`PLAIN | ROUGH | FOREST | URBAN | INDUSTRIAL | HILL | WATER`

This function only decides the **base tile per cell**. Rendering can continue to layer networks on top.

### B) Use “macro fields” + “seeded settlements” (NOT pure random)

Implement terrain using **two scalar fields** + **seeded clusters**:

#### 1) Scalar fields (low-frequency, smooth)

Implement a cheap deterministic value-noise / FBM (no external deps) using hash-based lattice noise + bilinear interpolation:

* `elevation(x,y)` in [0..1] (2–4 octaves, low frequency)
* `moisture(x,y)` in [0..1] (2–4 octaves, different offsets)

These should change slowly across the map (big shapes).

#### 2) Rivers carve WATER baseline

Use the already-generated river network data:

* Any cell that contains a river segment becomes `WATER` base terrain.
* Optional: widen water **only at specific features** (confluences, sharp bends) but keep it controlled. Prefer widening by 1 cell max, and only if it doesn’t create scattered puddles.
* WATER is “protected”: never overwritten by smoothing.

#### 3) Hills + Rough from elevation (coherent)

Classify:

* `HILL` where elevation > `hillThreshold` (e.g. 0.72)
* `ROUGH` where elevation in a mid band (e.g. 0.52–0.72), but only if not WATER/URBAN/INDUSTRIAL.
  Everything else defaults to `PLAIN` initially.

#### 4) Forest from moisture + away from dense settlements

Forest must be big, not peppered:

* Candidate where moisture > `forestThreshold` (e.g. 0.62) AND not WATER.
* Apply a **region-grow** pass (see smoothing below) so forests become blobs.
* Bias forests to appear **near water** and **in rough areas**, but don’t form thin outlines around rivers (no “green river halo” everywhere).

#### 5) Urban + Industrial as seeded clusters (road-aware)

Do **NOT** derive urban/industrial from noise. They must be human patterns:

* Place `N_urban` seeds (e.g. 2–4 on 20×30) and `N_industrial` seeds (e.g. 1–3).
* Seed placement is **weighted**:

    * Prefer near **road intersections** and **bridges**.
    * Avoid WATER cells and avoid being too close to another settlement seed (min Manhattan/Chebyshev distance).
* Grow each seed into a compact cluster using BFS:

    * Urban radius: 2–4 steps typical
    * Industrial radius: 2–3 steps typical
    * Growth should prefer cells adjacent to roads (to read as connected infrastructure).
* These are “protected”: smoothing should not erase them; only allow minor edge cleanup.

---

## Cleanup / Anti-mess passes (this is the key)

### 1) Majority smoothing (small number of iterations)

Run 1–3 passes over the map (excluding protected cells: WATER/URBAN/INDUSTRIAL):

* For each cell, look at 8 neighbors.
* If ≥5 neighbors are a different terrain type, switch to that type.
  This removes jagged single-cell artifacts.

### 2) Minimum region size enforcement (flood fill)

For each terrain type (especially FOREST, ROUGH, HILL):

* Flood-fill connected components.
* If component size < `minSize` (e.g. FOREST<10, ROUGH<8, HILL<6), dissolve it:

    * Convert cells to the most common neighboring terrain type among the component boundary, else `PLAIN`.
      This is non-negotiable: it prevents “complete mess”.

### 3) Edge discipline

Optional but recommended:

* Keep a thin bias toward `PLAIN` near map edges unless WATER/settlement must exist there. This helps framing and reduces visual clutter.

---

## Output mapping to PNGs

Create a single mapping table:

* PLAIN -> terrain-01-plain.png
* ROUGH -> terrain-02-rough.png
* FOREST -> terrain-03-forest.png
* URBAN -> terrain-04-urban.png
* HILL -> terrain-05-hill.png
* WATER -> terrain-06-water.png
* INDUSTRIAL -> terrain-10-industrial.png

If your renderer supports variants/rotation: do it only if it doesn’t break isometric consistency. If unsure, do **no rotation**.

---

## Debugging hooks (must add)

Add a developer flag (or debug mode) to render an overlay legend:

* Each TerrainType as a flat debug color, so we can validate blob sizes and seed placement.
  Add a quick “print stats” function (counts per terrain + number of regions per type) so we can tune thresholds without guesswork.

---

## Tuning targets (so it doesn’t look awful)

On a 20×30 map (600 cells), aim roughly:

* PLAIN: 35–55%
* FOREST: 10–20% (in 1–3 big blobs)
* ROUGH: 10–20% (1–3 blobs)
* HILL: 5–12% (1–3 blobs)
* WATER: depends on river coverage (river cells + tiny widening only)
* URBAN: 2–6% (1–3 clusters)
* INDUSTRIAL: 1–4% (1–2 clusters)

These are targets, not rigid, but don’t let URBAN/INDUSTRIAL sprawl everywhere.

---

## Don’ts (kill list)

* No per-cell random terrain.
* No checkerboard alternation.
* No “every river cell surrounded by forest”.
* No tiny isolated single tiles (unless it’s a protected road/river overlay artifact; terrain must be clean).

---

## Deliverables

1. Implement `generateTerrainBiomes(...)` with deterministic seeded noise + seeded settlements + cleanup passes.
2. Wire it into the existing map/terrain pipeline so the board now has a base terrain type per cell, while roads/rivers remain layered on top.
3. Include debug overlay + stats toggles.

Focus on **coherence** and **legibility**. If terrain ever competes with network readability, simplify terrain shapes further.
