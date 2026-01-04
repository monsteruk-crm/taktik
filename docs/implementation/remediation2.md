You’re right, and your diagnosis is correct: **the current network overlays are mathematically correct but visually anemic**. They technically branch, but they *read* like thin indicators, not like **terrain that occupies space on the tile face**.

This is not a UI bug.
This is a **semantic mismatch between how terrain tiles are authored vs how networks are authored**.

Your terrain tiles (plain, rough, forest, etc.) are:

* **procedural compositions**
* **multi-primitive**
* **spatially rich**
* **use the whole top face**

Your roads/rivers are currently:

* single centerline + arms
* constant width
* no spatial articulation
* no secondary structure
* no internal variation per topology

So even with 15 variants, they *look* like “an angle”.

The fix is **not more PNGs**.
The fix is: **roads and rivers must be generated with the same richness model as terrain tiles**.

Below is a **Codex-ready remediation prompt** that tells Codex exactly how to do this **programmatically**, reusing your existing generator style (`rectOnTopFace`, RNG, multi-pass fills, etc.), and making the result expandable.

---

## ✅ CODEX REMEDIATION PROMPT

**PROGRAMMATIC ROADS & RIVERS — FULL TOPOLOGY, FULL PRESENCE**

Copy-paste this **verbatim** into Codex.

---

````markdown
# TASK — Rebuild ROAD and RIVER generation to match terrain tile richness (procedural, multi-pass, topology-aware)

## Context
The current ROAD and RIVER overlays are generated with a single center strip + arms.
They technically branch (N/E/S/W, T, X), but visually they read as thin indicators, not as terrain occupying space.

We already have a powerful procedural tile generator (`gen_terrain_tiles.mjs`) that:
- uses rectOnTopFace(s,t)
- builds terrain via MANY primitives
- varies density, segmentation, secondary structures
- fills a large portion of the top face

Roads and rivers must be rebuilt to follow the **same paradigm**.

Do NOT change runtime rendering.
Do NOT add engine logic.
ONLY modify the generator.

Reference file: `scripts/gen_terrain_tiles.mjs` :contentReference[oaicite:0]{index=0}

---

## Core requirement (non-negotiable)

Roads and rivers must be:
- generated **procedurally per topology**
- composed of **multiple rectOnTopFace primitives**
- visually occupy meaningful area on the top face
- topology-aware (straight, corner, T, X, dead-end all feel different)
- still perfectly tileable and deterministic

NO single-stroke or single-strip solutions.

---

## Architectural change

### Replace this mental model ❌
> “one connector strip per edge”

### With this model ✅
> “topology → layout recipe → multiple surface primitives”

Each edge combination (N, NS, NE, NES, NESW, etc.) maps to a **layout recipe**, not just arms.

---

## Implementation plan (exact)

### 1. Introduce a topology classifier

In `makeNetworkOverlayTopFace`, derive:

```js
const degree = edges.length; // 1,2,3,4
const isStraight = degree === 2 && (
  (edges.includes("N") && edges.includes("S")) ||
  (edges.includes("E") && edges.includes("W"))
);
const isCorner = degree === 2 && !isStraight;
const isTJunction = degree === 3;
const isCross = degree === 4;
````

---

## 2. ROAD — procedural layout rules

Roads are **engineered surfaces**, not lines.

### Common ROAD elements

Always use:

* center plate (wide)
* one or more parallel lanes
* occasional inset blocks (medians / shoulders)

Use 2–4 passes per tile.

### Width model

* base road width = existing widthPx
* shoulders = +25–40%
* inner lanes = 60–70%

### Layout recipes

#### a) Straight (NS or EW)

* 2–3 long parallel strips
* slight offset between them
* optional broken median segments

#### b) Corner (NE, ES, SW, WN)

* L-shaped wide plate
* diagonal chamfer block at corner
* 1–2 secondary strips reinforcing turn

#### c) T-junction

* large central plaza-like plate
* three outgoing road bodies
* optional short “stub” blocks reinforcing hierarchy

#### d) Cross (NESW)

* large square or diamond hub
* four outgoing road bodies
* internal segmentation (bands or quadrants)

All geometry MUST be built with rectOnTopFace.

---

## 3. RIVER — procedural channel system

Rivers are **channels**, not strokes.

### Common RIVER elements

* wide main channel
* secondary banks
* occasional inner split (islands / shallows)

Still flat. Still abstract.

### Width model

* main channel = 1.3–1.6 × road width
* banks = additional outer strips
* inner voids optional (negative space)

### Layout recipes

#### a) Straight

* wide central band
* 1–2 parallel bank bands
* occasional narrowing/widening segments

#### b) Corner

* curved feel via stepped rects (NOT curves)
* overlapping rectangular turns
* thicker inner bend, thinner outer bend

#### c) T-junction

* confluence basin (large irregular plate)
* three feeding channels
* asymmetric emphasis (one branch wider)

#### d) Cross

* rare but supported
* central basin + four channels
* internal segmentation to avoid “plus sign” look

---

## 4. Determinism + variation (important)

Add a seeded RNG per tile variant:

```js
const rng = makeRng(
  0x524F4144 ^ edges.length ^ edges.map(e => e.charCodeAt(0)).reduce((a,b)=>a+b,0)
);
```

Use it ONLY to:

* slightly vary offsets
* choose between 2–3 layout micro-variants
* vary shoulder/bank thickness within bounds

Never break tile edges.

---

## 5. Expandability requirement

Refactor network generation to this structure:

```js
function generateNetworkSurface({
  kind,      // "road" | "river"
  edges,
  rectOnTopFace,
  fillPolygon,
  rng,
})
```

So that adding:

```js
{ id: "trench", ... }
```

later is trivial.

---

## 6. Hard visual constraints (do not violate)

* No gradients
* No textures
* No noise
* No curves
* No alpha fades
* No strokes
* Flat fills only
* Everything clipped to top face

Roads feel **engineered**.
Rivers feel **cut into the surface**.

---

## Acceptance test (visual)

After regeneration:

* Straight roads occupy ~25–35% of tile width
* Junctions feel heavier than straight segments
* Rivers clearly dominate the tile when present
* Branching tiles look materially different from corners
* No tile looks like a “puny angle” anymore

If a tile still reads as a thin indicator, the task is FAILED.

---

## Deliverables

* Updated `makeNetworkOverlayTopFace`
* Regenerated `/public/assets/tiles/networks/*.png`
* Same manifest.json structure
* No runtime changes

```

---

## Why this will finally work

This aligns **networks with terrain philosophy**:

- terrain ≠ icon  
- terrain = **procedural surface logic**

