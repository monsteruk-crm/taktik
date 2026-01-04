## Codex Prompt — Fix Rivers + Roads Networks in `terrain.ts`

You are working on the Taktik project. Modify **ONLY** `/mnt/data/terrain.ts`.
Goal: fix procedural **rivers** and **roads** generation artifacts in the isometric network overlay.

### Hard constraints (must obey)

* Keep generation **deterministic** for the same seed / rng inputs (do not use `Math.random`).
* Do **not** refactor the file structure, rename public APIs, or change return types.
* Do **not** introduce new dependencies.
* Preserve existing road/river data representation (connections/edges per tile).
* Roads and rivers are allowed to overlap only where bridges are placed (keep existing bridge rules).
* Make changes **minimal**, localized to the network generation + pruning logic.

---

# A) Rivers: zig-zag/meander AND kill the checkerboard lattice

## Problem

Current river zig-zagging still produces a **high-density checkerboard / lattice** pattern (alternating turns every tile).

## Required behavior

* Rivers should “meander”: **turn sometimes**, but **not every tile**.
* Prevent alternating axis per tile (the lattice artifact) by enforcing **run-length / axis persistence**.

## Implement this change

In river walk / growth step, add **axis persistence**:

* Track `runAxis` = `'H' | 'V'` and `runLen` consecutive steps on that axis.
* Enforce a minimum run length before turning: `MIN_AXIS_RUN = 2` (or 3 if still too gridlike).
* After `MIN_AXIS_RUN`, allow turning with probability `TURN_PROB ~ 0.35–0.5`.
* When turning, prohibit immediate backtracking (`OPPOSITE[lastDir]`), and prefer the perpendicular axis.

Pseudo-behavior:

* If lastDir is horizontal (E/W), keep horizontal until runLen >= MIN_AXIS_RUN unless blocked.
* If lastDir is vertical (N/S), keep vertical similarly.
* If forward move is blocked/out of bounds, choose a turn that stays in bounds.

Also add a **tiny anti-checker penalty**:

* Disallow exact alternating pattern `A-B-A-B` in the last 4 dirs (if present, force continue or pick other turn).

**Do NOT attempt to fix river checkerboards via pruning.** This must be solved during generation.

## River pruning

Keep river pruning **very light**:

* Only remove **single-tile stubs** (degree 1) when attached to a high-degree junction (>=3), or cap removal to a single pass.
* Do not run recursive “while changed” pruning for rivers.

---

# B) Roads: keep intersections but make pruning non-destructive

## Problem

Road prune logic is **too aggressive** and can cascade, deleting large regions / blank maps.

## Required behavior

* Remove obvious 1-tile nubs and dead spurs.
* Do **not** cascade-delete whole components.
* Do **not** use repeated `while(changed)` pruning loops that erase big sections.

## Implement this change

Replace recursive pruning with **bounded, single-pass pruning**:

* Compute degree for each tile (how many road connections).
* In **one pass** (or at most two passes), remove only:

  1. degree==1 tiles where the neighbor degree >=3 (true spur off a junction), OR
  2. degree==1 tiles whose connected neighbor is degree==1 (tiny 2-tile segment) — remove both in one pass safely.

Important: Do not remove degree==1 tiles that are part of long chains unless they match the spur patterns above.

If you need a second pass, do exactly **two passes max**, no “loop until stable”.

Also preserve intersections:

* Do not leave “intersection tiles” with a dead direction that visually implies a road continuing but doesn’t connect.
* If your renderer chooses an intersection sprite based on a bitmask, ensure pruning updates the bitmask consistently (remove opposite edge from neighbor when removing an edge).

---

# C) Acceptance checks (must verify in code)

Add a small internal debug function or comments to sanity-check (no console spam in production):

* For a high density case, ensure rivers do not create long checkerboard patches.
* Ensure roads never result in an all-blank network after pruning at typical densities.
* Ensure connections are symmetric: if cell A has dir E, neighbor B has dir W, etc.

---

# D) Deliverable

* Output the full updated `/mnt/data/terrain.ts` only.
* No other files.
* Do not include explanations—just the code.

---

If you want to make Codex’ life easier, append this note:

* “Search in `terrain.ts` for the river walk/generation loop and introduce axis-run persistence there.”
* “Search for the road pruning function and replace recursive pruning with single-pass spur pruning.”
